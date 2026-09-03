# Remove the v1 remnants — guarded SQL package (2026-09-03)

**Status: PENDING YOUR APPROVAL. Nothing here has been run against production.**
Every file was authored read-only against `yjgolswjggmlpeowvtxr`; not one byte
has been applied.

## Run order

Run one file at a time in the Supabase SQL editor. Read the result rows before
moving on. You can stop after any stage — each one is self-contained and
independently reversible.

| # | File | What it does | Reversible? |
|---|---|---|---|
| 1 | `00_PRECHECK.sql` | Read-only. Proves the branches Stage 30 removes are dead, lists the app-side blockers. | n/a |
| 2 | `05_BACKUP.sql` | Backs up 8 function sources, the `glossary_full_v` definition, 3,660 `glossary.course_id` values, and both `public_course*` tables. | n/a |
| 3 | `10_APPLY_glossary_functions.sql` | Rewrites `bulk_import_glossary` + `validate_glossary` onto v3 identity. **Highest risk file. Read its section below.** | Yes, verbatim |
| 4 | `20_APPLY_seed_free_topics.sql` | Rewrites `seed_commercial_free_topics`. | Yes, verbatim |
| 5 | `30_APPLY_quiz_functions.sql` | Strips the v1 branches out of `start_quiz_attempt` + `submit_quiz`. | Yes, verbatim |
| 6 | `40_APPLY_drop_dead_objects.sql` | Drops `commercial_topic_unlocked`, `recompute_reachability_commercial`, `validate_single_primary_home` + its trigger, and policies `pc_read` / `pct_read`. | Yes |
| 7 | `50_APPLY_drop_glossary_course_id.sql` | Recreates `glossary_full_v` without `course_id`, then drops `glossary.course_id`. **Needs an app change first.** | Mostly — see below |
| 8 | `60_APPLY_drop_public_course_tables.sql` | Drops `public_course_topics` then `public_courses`. | Data only — see below |
| — | `90_VERIFY.sql` | Read-only. Run after each stage. Stages not yet run read `NOT RUN`. | n/a |
| — | `99_ROLLBACK.sql` | Reverses every stage that has run, in reverse order. | n/a |

The order is not cosmetic. It is the real dependency graph:

```
Stage 10  glossary functions        (must precede 50 — they write course_id)
Stage 20  seed_commercial_free_topics (independent)
Stage 30  quiz functions            (must precede 40 and 60 — last live readers)
Stage 40  orphaned fns/trigger/policies (must precede 60 — trigger lives on the table)
Stage 50  glossary.course_id        (must drop/recreate glossary_full_v in the same tx)
Stage 60  public_course* tables     (last)
```

## The one app change that must ship first

**`src/screens/glossary/GlossaryScreen.tsx` must stop using `glossary.course_id`
before Stage 50 runs.** Three places:

- line ~113 — `.select('id, term, definition, plain_english, course_id, achievement_id')`
- line ~1443 — `if (filter === 'course' && selCourseId) list = list.filter(e => e.course_id === selCourseId)`
- line ~2313 — `courseCodeById.get(e.course_id)`

If Stage 50 runs first, the glossary browser errors on an unknown column.

`src/features/dashboard/api.ts` (lines ~230 / ~238) also selects
`achievements.course_id` — but **this package does not drop that column**, so it
is not a blocker here. It is a blocker for the *other* package (see below).

## What is irreversible

- **Stage 60.** `99_ROLLBACK` can put the *rows* back into recreated tables, but
  not the primary keys, unique indexes, foreign keys, defaults or RLS policies
  they had. If you might ever want these tables back exactly as they were, take
  a Supabase snapshot before Stage 60.
- **Stage 50, conditionally.** Its rollback recreates
  `glossary_course_id_fkey`, which points at `public.courses`. Once the
  institutional package drops `courses`, that FK can never be restored — the
  rollback will restore the column and all 3,660 values but skip the constraint,
  and it says so when it does.
- Everything else restores byte-for-byte from `pg_get_functiondef` text captured
  in `05_BACKUP`.

## Stage 10 — why this one first, and why it is dangerous

`bulk_import_glossary` and `validate_glossary` both resolved a topic as
`courses.code = <input>.course_code` → `achievements.course_id = that`. Only 51
`achievements` rows have a `course_id` and **all 51 are v1**. So the importer
could never tag a v3 topic; it wrote `achievement_id = NULL` and carried on.
Worse, its `ON CONFLICT (term) DO UPDATE` overwrote **every** column, so a
payload for an existing term could blank that term's topic tag and its curated
prose. There are 26,847 curated rows behind that.

That is why it is Stage 10: fix the writer before you touch anything it writes.

**Test this on a branch database before production.** Both functions are
`SECURITY DEFINER`. Create a Supabase branch, run `05_BACKUP` + `10_APPLY` there,
run one real import payload through `validate_glossary` and then
`bulk_import_glossary`, and diff the affected rows. Then run it here.

Four deliberate behaviour changes in the rewrite, all of them hardening:

1. Topics resolve by `achievements.global_sequence` scoped to the active v3
   curriculum `a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72`. The input key is
   `global_sequence` (a number). `achievement_name` is now only cross-checked,
   never used to resolve.
2. A payload containing `course_code` is a **hard error**. Old v1 payloads fail
   loudly instead of silently mis-tagging.
3. An unresolvable `global_sequence` is a **hard error**. The old code carried
   on with `NULL`.
4. `ON CONFLICT DO UPDATE` is now `COALESCE`-guarded on every column: a key
   absent from the payload leaves the curated value alone, and `achievement_id`
   is never overwritten with `NULL`. **This is the mitigation for the
   "silently rewrites 26,847 rows" hazard.** If you *want* the old
   blank-on-absent behaviour for some column, say so and I will change it back.

`glossary.course_id` is no longer written at all — which is what unblocks
Stage 50.

## Stage 20 — the `seed_commercial_free_topics` decision

The old body seeded progress rows for `global_sequence IN (0, 36)` with no
curriculum scope. Both rows are v1, and gs36 (`DAW Skills`) is
`is_active = false`. Every commercial signup got two progress rows pointing at
retired content, one of them inactive.

**I made it data-driven rather than a hard-coded list or a bare no-op:** it now
seeds v3 achievements where `always_free AND is_active`. That set is **empty
today**, so in practice the function is a no-op — which is the correct outcome:

- v3 free access is not modelled on `achievements.always_free` at all (zero v3
  rows have it set); it runs through `user_topic_enrollments` +
  `has_academy_access`.
- The two live v3 entry points, `start_quiz_attempt` and
  `record_study_progress`, already insert the `student_achievement_progress` row
  on demand. Nothing needs pre-seeding for the app to work.
- A hard-coded replacement list would be a guess, and a wrong guess writes junk
  into every new user's progress table.

Being data-driven means it starts working by itself the moment you mark a v3
topic `always_free` — no further SQL.

The signature is unchanged, so **`register_commercial_user` is not modified and
its `PERFORM public.seed_commercial_free_topics(v_user_id)` keeps working.**
`90_VERIFY` asserts that explicitly.

## Stage 30 — the two quiz functions are NOT symmetric

This is the finding that most changes the shape of the job.

**`start_quiz_attempt`** — the `elsif v_audience = 'commercial'` arm really is
dead. It is only reachable when the achievement's curriculum is neither v3 (the
arm above it) nor v1 (which raises `archived_quiz_retired` earlier). All 51
achievements carrying a `course_id` are v1, and any non-v3 row with a NULL
`course_id` is rejected before the branch is evaluated. Deleting it is pure
dead-code removal. `00_PRECHECK` re-proves this against live data and
`30_APPLY` re-proves it again at apply time and refuses to run if it fails.

**`submit_quiz`** — the `v_audience = 'commercial'` arm is **live**.
`register_commercial_user` is the only writer of `audience`, so *every* real app
user is `commercial`, and `submit_quiz` has no v3 arm at all. Deleting the
branch as written in the brief would have sent every user into the enrollment
lookup and **broken quiz submission for the entire app.**

So the arm is retargeted, not removed: the test becomes `v_ach_cv = c_v3`, and
only the v1 bodies inside it go —

- the `public_course_topics … placement='primary'` lookup (it can only match a
  v1 achievement, so for v3 it always returned NULL);
- the `recompute_reachability_commercial(...)` call (already guarded by
  `if v_public_course is not null`, which for v3 was never true, so `v_reach`
  stayed NULL — and still does);
- the `elsif false then … passed_incomplete …` block, dead since the pass-mark
  rework, which was the other `public_course_topics` reader.

Net behaviour on the live path: identical.

One deliberate change: an `audience='institutional'` user submitting a **v3**
attempt previously got `not_enrolled` from `submit_quiz` even though
`start_quiz_attempt` had already let them start (its v3 arm ignores audience).
They now submit normally. Four institutional users exist; all are your test
rows.

## What this package does NOT touch

Per your instruction, and per what the dependency graph actually allows:

- **`register_commercial_user`** — untouched. `90_VERIFY` checks it is still
  present and still calls the seeder.
- **The 51 legacy `achievements` rows** — untouched. `90_VERIFY` checks the
  count is still 51.
- **`achievements.course_id`, `courses`, `enrollment`, `course_sections`,
  `session_logs`** — all moved to the second package. See below.

## The second package

`C:\Users\profe\dev\ape-studio\RETIRE_INSTITUTIONAL_PATH_2026_09_03\`

Those five objects turned out to be far more entangled than a five-FK list. They
are read by **eight** database functions and **three** views, including
`refresh_student_metrics` (called by `submit_quiz` on every submission) and
`register_student` (the institutional registration path). Dropping them is a
separate decision with a separate risk profile, so it got its own folder. Read
that README before running anything here that you might want to undo — Stage 50's
rollback depends on `courses` still existing.

**Run this package first, in full, and confirm it. Then look at that one.**

## Safety design

- **Guarded.** Every apply file opens with a `DO` block that refuses to run when
  a precondition is unmet: backup missing, prior stage not run, dead-branch claim
  no longer true, a foreign key still pointing in, the importer still writing the
  column it is about to drop.
- **Idempotent.** Function stages use `CREATE OR REPLACE`; drop stages use
  `IF EXISTS`; Stage 50 detects an already-dropped column and returns. A second
  run of any file is a no-op.
- **Scoped by stable keys.** Curriculum version UUIDs, `global_sequence`,
  function identity — never a display name.
- **Every destructive step is backed up first**, including the verbatim source of
  every function rewritten or dropped, restorable by `EXECUTE`.
- **No `\echo`.** All output comes back as result rows, so the files paste
  straight into the Supabase SQL editor.

## After a successful run

Keep the backup tables until you are satisfied — they are the only copy. When
you are done:

```sql
drop table public.v1remnants_func_backup_20260903;
drop table public.v1remnants_view_backup_20260903;
drop table public.glossary_course_id_backup_20260903;
drop table public.v1remnants_public_courses_backup_20260903;
drop table public.v1remnants_public_course_topics_backup_20260903;
```

Do not drop the glossary and view backups until the institutional package is
finished too — Stage 50's rollback needs them.
