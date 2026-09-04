# Drop the last v1 scaffolding — guarded SQL package (2026-09-03)

**Status: PENDING YOUR APPROVAL. Nothing here has been run against production.**
Every file was authored read-only against `yjgolswjggmlpeowvtxr`. Not one byte
has been applied, and no schema change of any kind was made.

This package clears the blockers the earlier
`RETIRE_INSTITUTIONAL_PATH_2026_09_03/NOTES_BLOCKERS.md` refused to author SQL
for, and then performs the five drops:

`courses` · `enrollment` · `course_sections` · `session_logs` ·
`achievements.course_id`

Plus, as a consequence of the dependency graph, `instructor_sections`.

---

## Run order

Run one file at a time in the Supabase SQL editor. Read the result rows before
moving on. You can stop after any stage — each is self-contained, guarded and
independently reversible.

| # | Where | File | What it does | Must have run first | Reversible? |
|---|---|---|---|---|---|
| 1 | Supabase SQL editor | `00_PRECHECK.sql` | Read-only. Proves every claim the applies rely on, and re-derives the blocker list from `pg_catalog`. | All four prior packages | n/a |
| 2 | Supabase SQL editor | `05_BACKUP.sql` | Backs up 12 function sources, the trigger, every affected RLS policy, the grants, all five tables' rows, the 51 `achievements.course_id` values and the 4 badge rows. | `REMOVE_V1_REMNANTS` stage 30 (see note) | n/a |
| 3 | Supabase SQL editor | `10_APPLY_rewrite_live_functions.sql` | Rewrites the **seven functions that must survive** off the legacy objects. **The most important file here.** | 05 | Yes, verbatim |
| 4 | Supabase SQL editor | `20_APPLY_drop_institutional_functions.sql` | Drops the **five functions** the retired institutional path existed to serve, the trigger, and the 8 RLS policies that depend on `is_instructor_for_user`. | 10 | Yes, verbatim |
| 5 | Supabase SQL editor | `30_APPLY_clear_badge_rows.sql` | **OPTIONAL.** Deletes the 4 `badges` rows. Not required by any drop. | 10 | Yes |
| — | **Your editor + a build** | ship `src/features/dashboard/api.ts` and `src/features/profile/api.ts` app changes | **REQUIRED before stage 50.** See NOTES_BLOCKERS. | — | — |
| 6 | Supabase SQL editor | `40_APPLY_drop_session_logs.sql` | `DROP TABLE session_logs`. Includes a live smoke test of `refresh_student_metrics`. | 10, 20 | Yes |
| 7 | Supabase SQL editor | `50_APPLY_drop_achievements_course_id.sql` | `ALTER TABLE achievements DROP COLUMN course_id`. | 10, 20, **app change** | Yes* |
| 8 | Supabase SQL editor | `60_APPLY_drop_enrollment.sql` | `DROP TABLE enrollment` (takes `trig_seed_first_topic` with it). | 10, 20 | Yes |
| 9 | Supabase SQL editor | `70_APPLY_drop_course_sections.sql` | `DROP TABLE instructor_sections`, then `DROP TABLE course_sections`. | 20, 60 | Yes |
| 10 | Supabase SQL editor | `80_APPLY_drop_courses.sql` | `DROP TABLE courses`. **LAST.** | everything above + `REMOVE_V1_REMNANTS` stage 50 | Yes* |
| — | Supabase SQL editor | `90_VERIFY.sql` | Read-only. Run after **each** stage. Stages not yet run read `NOT RUN`. | n/a | n/a |
| — | Supabase SQL editor | `99_ROLLBACK.sql` | Reverses every stage that has run, in reverse order (80 → 10). Safe to run twice. | n/a | n/a |

\* Reversible as schema + data, but see **What is irreversible** below.

### The order is the real dependency graph

```
10  rewrite the survivors      (Postgres does NOT dependency-check function
                                bodies — every table drop below would otherwise
                                break a live function SILENTLY, at runtime)
20  drop the retired functions (must follow 10: it removes their last callers)
30  badge rows                 (optional, independent)
40  session_logs               (needs 10: refresh_student_metrics is on the
                                quiz hot path; needs 20 for its RLS policy)
50  achievements.course_id     (needs 10 + 20; needs the app change)
60  enrollment                 (needs 10 + 20; frees course_sections)
70  course_sections            (needs 60 for enrollment_section_id_fkey;
                                takes instructor_sections with it)
80  courses                    (LAST — all five FKs in must be gone first)
```

### One note on when to take the backup

`05_BACKUP` must run **after** `REMOVE_V1_REMNANTS` stage 30. The "original" this
package has to be able to restore is *that package's output* for
`start_quiz_attempt` and `submit_quiz`, not the pre-stage-30 bodies. The backup
file refuses to run if it detects the older versions, and stage 10 refuses too.

**Which version does stage 10 assume?** Explicitly: `REMOVE_V1_REMNANTS`
stage 30's output, reproduced verbatim in `10_APPLY` with the further changes
annotated inline. It does not fight that package; it builds on it.

---

## Per-function decisions, and why

I re-derived the blocker list from `pg_catalog` rather than trusting either
earlier list. **Twelve** functions actually block these drops after the prior
packages have run — see "Where the lists were wrong" at the bottom.

### Rewritten — 7 (stage 10)

| Function | Decision | Reasoning |
|---|---|---|
| `refresh_student_metrics(uuid)` | **REWRITE. Never drop.** | `submit_quiz` calls it on **every** submission and it read `session_logs`. It now derives both `total_study_sessions` and the streaks from `student_method_progress.last_updated` + genuine `quiz_attempts.started_at`. Stage 40 ends with a live smoke test that actually executes it. |
| `delete_my_account()` | **REWRITE.** | Account deletion must keep working. Three `DELETE` lines removed (`enrollment`, `session_logs`, `instructor_sections`). Nothing else touched. I checked every remaining FK into `public.users`: each is either deleted explicitly or `ON DELETE CASCADE`, so the final `DELETE FROM users` still succeeds. |
| `record_study_progress(...)` | **REWRITE.** | Its `always_free` and v3 arms are byte-for-byte unchanged. Only the trailing `else` arm — the institutional enrolment lookup — becomes an explicit `retired_content` error. `00_PRECHECK` proves that arm is unreachable: it needs an achievement that is neither v1 nor v3 *and* carries a `course_id`, and there are zero such rows. |
| `credit_time_trial(uuid,text)` | **REWRITE — and this is a live bug fix.** | It required an `enrollment` row unconditionally and had **no v3 arm at all**, so on v3 it could only ever raise `not_enrolled`. `src/features/study/timeTrial.ts` (~line 337) calls it and swallows the error, so a cleared time trial silently failed to credit the method — the very gate that lets a learner reach the quiz. Its gate now mirrors `record_study_progress` exactly. (This answers question 3 of the old NOTES: yes, it was a live bug, not a line to delete.) |
| `start_quiz_attempt(uuid,uuid)` | **REWRITE.** | On top of stage 30's output: the `else` arm becomes `retired_content`, and the `achievements.course_id` read plus the `v_course` / `v_enr_cvid` locals go. The v3 arm, lockout, pool, study gate, draw and materialise logic are untouched. |
| `submit_quiz(...)` | **REWRITE.** | Same `else` → `retired_content`. Also removes the `unlock_after_safety` call, the `recompute_reachability` call and the badge write — all three proven dead on the live v3 path (see below). **The JSON payload shape is unchanged**: `badge_earned` is now a constant `false` and `next_topic` stays `null`, exactly as it already did on v3, so `src/features/quiz/api.ts`, `QuizScreen.tsx` and `TrophyScreen.tsx` need no change. |
| `lookup_student_by_qr(uuid)` | **REWRITE.** | Not on either earlier list. It calls `is_instructor_for_user`, which is a hard drop blocker (Postgres *will* refuse to drop a function a policy or another function depends on). It loses that disjunct; access narrows to `is_ta_or_admin()`. No app caller in `src/` or `web/`. Kept rather than dropped because it is the TA/admin QR scanner path, which is not part of institutional mode. |

### Dropped — 5 (stage 20)

| Function | Decision | Reasoning |
|---|---|---|
| `register_student(text,text)` | **DROP.** | Institutional class-code registration; the only writer that ever inserted an `enrollment` row. Its client wrapper `registerStudent()` was deleted from `src/features/auth/api.ts` on 2026-09-03 and was never imported anywhere — `AuthScreen` signs up through `registerCommercialUser`. I grepped `src/` and `web/`: no caller. Institutional mode is retired, and there is no v3 equivalent of "claim a pre-created student row with a class code", so this is a drop, not a rewrite. (Answers question 1 of the old NOTES: **the RPC goes.**) |
| `seed_first_topic_on_enrollment()` + `trig_seed_first_topic` | **DROP.** | Trigger function on `enrollment`, keyed on `achievements.course_id` + `sequence_in_course`. Meaningless without the table it fires on. The v3 equivalent already exists: `start_quiz_attempt` and `record_study_progress` each insert the progress row on demand. |
| `unlock_after_safety(uuid,uuid)` | **DROP.** | Loops over a user's `enrollment` rows. Its only caller was `submit_quiz`. `00_PRECHECK` proves it was already a **no-op on the live path**: every `enrollment` row is v1, and **zero** v3 achievements are `is_prerequisite`, so the loop never had a row. |
| `recompute_reachability(uuid,uuid,uuid)` | **DROP.** | Course-ordered progression — it orders achievements by `sequence_in_course` *within a `course_id`*, the column stage 50 drops. v3 has no ordered progression. Callers were `unlock_after_safety` (dropped) and `submit_quiz` (where `v_reach` was already always `null` on v3). The only mention in `src/` is a stale comment at the top of `features/dashboard/api.ts`. |
| `is_instructor_for_user(uuid)` | **DROP**, with 8 policies first. | Reads `instructor_sections JOIN enrollment`. The instructor role is part of the retired institutional path. (Answers question 4 of the old NOTES: **the whole instructor surface goes** — function, `instructor_sections`, and the `instr_*` policies.) |

### Not touched, and why

- **`bulk_import_glossary` / `validate_glossary`** — I confirmed `REMOVE_V1_REMNANTS`
  stage 10's output. Both resolve topics by v3 `global_sequence`, neither
  mentions `courses` or `course_code`, and neither writes `glossary.course_id`.
  **They are not blockers for anything in this package.** `00_PRECHECK` asserts
  it, and refuses to continue if stage 10 has not run.
- **`register_commercial_user`** — the live signup path. Untouched. `90_VERIFY`
  asserts it is still present.
- **`badges` / `student_badges` tables** — kept. See below.

### The RLS consequence of dropping `is_instructor_for_user`

Eight policies depend on it, on **five surviving tables** as well as the ones
being dropped:

```
performance_metrics.instr_read_perf_metrics        student_badges.instr_read_student_badges
quiz_attempts.instr_read_quiz_attempts             users.instr_read_users
student_achievement_progress.instr_read_ach_progress   enrollment.instr_read_enrollment
student_method_progress.instr_read_method_prog         session_logs.instr_read_session_logs
```

Postgres will refuse `DROP FUNCTION` while any of them exist, so stage 20 drops
them first. They are **permissive** grants that gave an instructor read access
to their students' rows — dropping one removes access, never grants it. Both
`00_PRECHECK` and `90_VERIFY` assert that every affected surviving table still
carries an `own_*` and an `admin_*` policy, so learners and admins are
completely unaffected. Four institutional users exist; all are your test rows.

---

## The badge permission — what I chose, and what it bought

You gave permission, not an obligation. Here is the line I drew.

**Taken:** stage 10 strips the badge write out of `submit_quiz`, and the
optional stage 30 deletes the 4 `badges` rows.

**Not taken:** I did **not** drop the `badges` or `student_badges` tables.

Why the split:

- The badge write in `submit_quiz` was **already unreachable on v3** — it needs
  `achievements.badge_trigger` non-null *and* a `badges` row of the same
  curriculum version. Zero v3 achievements carry a `badge_trigger`, and all 4
  badges are v1. `00_PRECHECK` proves both. So removing it is dead-code removal,
  not a behaviour change, and it costs nothing.
- Deleting the 4 rows removes `badges.trigger_achievement_id → achievements(id)`,
  which was **a stated blocker for `CONVERT_RETIRE_V1_TOPICS` stage 40** (the
  optional hard-delete of the 51 legacy v1 achievements). **That is the one
  thing the permission actually cleared.** It does not clear that stage's other
  blockers — `quiz_questions`, `glossary`, `glossary_topics`,
  `certificate_topics`, `program_topics`, `award_standing_requirements` and the
  progress tables all still reference `achievements`.
- Dropping the **tables** would break three things that still read them: the
  view `v_badge_roster`, the materialized view `mv_program_kpis`, and
  `src/features/profile/api.ts` `fetchProfile()`, which reads
  `student_badges.badge_name_snapshot` to derive the four MIC/REC/MIX/PA
  certificate flags. None of that is needed for any of the five drops, so I left
  it alone. It is a separate decision with an app change attached.

`student_badges` has 0 rows, so nothing earned is destroyed. Stage 30 refuses to
run if that ever stops being true. `lookup_student_by_qr` and
`delete_my_account` both still work: verified by inspection — the former `LEFT
JOIN`s both tables (it now returns NULL badge columns), the latter still deletes
from `student_badges` and nulls `granted_by` / `revoked_by`.

**If you would rather I had not touched badges at all**, skip stage 30 entirely
and the package still completes; only the `CONVERT_RETIRE_V1_TOPICS` knock-on is
lost. The `submit_quiz` change cannot be skipped separately, but it is a no-op.

---

## `refresh_student_metrics` — the one honest judgement call

This is the function that flatly could not be dropped, and rewriting it means
choosing a replacement for a number that no longer has a source.

`session_logs` was **never written by the app** — 0 rows, always. So
`total_study_sessions` was a permanent `0`, and the `session_logs` arm of the
streak CTE contributed nothing. The streaks were, in practice, already computed
from genuine quiz attempts alone.

**What I chose:** derive both from the two activity sources that actually exist —
`student_method_progress.last_updated` (study-method activity) and genuine
`quiz_attempts.started_at`. `total_study_sessions` becomes **a count of distinct
activity days (America/Los_Angeles)** — the same day set the streaks are built
from, so the three numbers are now mutually consistent instead of one being a
permanent zero.

**Said plainly, because it matters:** that is a *day* count, not a session count.
The database has no session concept any more. The function body and a
`COMMENT ON FUNCTION` both say so. I checked: **nothing in `src/` or `web/` reads
or displays `total_study_sessions`**, so this is a low-risk choice today.

A side effect worth knowing: streaks now also count study-method activity, not
only quiz attempts. That is an improvement, but it is a change.

**If you want it differently** it is one CTE:
- always `0` — drop the `days` count and hard-code it;
- count topic × method units engaged — `count(*) FROM student_method_progress
  WHERE user_id = p_user_id AND engagement_seconds > 0`;
- drop the column from the profile entirely — say so and I will write the
  `ALTER TABLE` as its own stage.

---

## Safety design

- **Guarded.** Every apply file opens with a `DO` block that refuses to run when
  a precondition is unmet: backup missing, prior stage not run, a dead-branch
  claim no longer true, a foreign key still pointing in, a function still
  reading the object about to be dropped, a view still selecting it. Because
  Postgres does not dependency-check function bodies, **every table-drop stage
  runs that check itself** and names the offending functions in the error.
- **Idempotent.** Function stages use `CREATE OR REPLACE`; drop stages use
  `IF EXISTS` and detect an already-dropped object and return. A second run of
  any file is a no-op. `99_ROLLBACK` is safe to run twice (and on a full
  rollback you *should*, so the second pass restores policies that depend on
  functions the first pass had not yet recreated).
- **Scoped by stable keys.** Curriculum-version UUIDs, `global_sequence`,
  function identity, constraint names — never a display name.
- **Every destructive step is backed up first**, including the verbatim source of
  all 12 functions, restorable by `EXECUTE`.
- **Content is protected separately from user data.** Guards refuse to delete a
  non-v1 badge or a non-v1 `course_id`, and `90_VERIFY` asserts the glossary
  (26,847 rows), its 1,978 topic links, `quiz_questions` and the 468
  `achievements` rows are all still intact after every stage.
- **No `\echo`.** All output comes back as result rows, so the files paste
  straight into the Supabase SQL editor.

---

## What is irreversible

- **Nothing, if you keep the backup tables.** Unlike the earlier packages, this
  one recreates each dropped table longhand with its exact columns, defaults,
  primary key, unique constraints, indexes, foreign keys, RLS flag, captured
  policies and captured grants — not just the rows. `99_ROLLBACK` restores all
  five tables, the column, all 12 functions, the trigger and the badge rows.
- **The one genuine exception: `glossary_course_id_fkey`.** `REMOVE_V1_REMNANTS`'
  own rollback recreates that constraint pointing at `public.courses`. Once
  stage 80 here has dropped and a rollback has recreated `courses`, that
  package's rollback restores the column and its 3,660 values but must skip the
  constraint. **Take a Supabase snapshot before stage 80** if you might ever want
  that package's rollback to be complete.
- Object OIDs do not survive, so anything keyed on them outside the catalog does
  not either. Nothing in this schema is.

---

## After a successful run

Keep the backup tables until you are satisfied — they are the only copy, and
`99_ROLLBACK` is inert without them. When you are done:

```sql
drop table public.v1scaffold_func_backup_20260903;
drop table public.v1scaffold_trigger_backup_20260903;
drop table public.v1scaffold_policy_backup_20260903;
drop table public.v1scaffold_grant_backup_20260903;
drop table public.v1scaffold_courses_backup_20260903;
drop table public.v1scaffold_enrollment_backup_20260903;
drop table public.v1scaffold_course_sections_backup_20260903;
drop table public.v1scaffold_session_logs_backup_20260903;
drop table public.v1scaffold_instructor_sections_backup_20260903;
drop table public.v1scaffold_ach_course_id_backup_20260903;
drop table public.v1scaffold_badges_backup_20260903;
```

---

## Where the earlier lists were wrong

Both counts were slightly off, in different directions. `00_PRECHECK` re-derives
the true list from `pg_catalog` so you never have to take my word for it.

| Claim | Reality |
|---|---|
| "Eleven live functions block the drops" (`RETIRE_INSTITUTIONAL/NOTES_BLOCKERS`) | The eleven **direct** readers were right. It missed `lookup_student_by_qr`, which blocks indirectly: it calls `is_instructor_for_user`, and Postgres refuses to drop a function another function depends on. **Twelve.** |
| "Thirteen: … `bulk_import_glossary` … `validate_glossary`" (the brief to me) | Those two are **not** blockers. `REMOVE_V1_REMNANTS` stage 10 already rewrote them off `courses` entirely — confirmed by reading its output and by a live `pg_proc` check. Subtract those two, add `lookup_student_by_qr`: **twelve.** |
| A raw `pg_proc` scan finds **fifteen** | The extra two are `commercial_topic_unlocked` and `recompute_reachability_commercial`, both dropped by `REMOVE_V1_REMNANTS` stage 40. They are blockers only if you skip that package. |
| "`course_sections` and `session_logs`: 0 rows, no code, no function refs — trivially safe" (the original brief) | `session_logs` was the single most dangerous item on the list. `course_sections` is blocked by an FK from `instructor_sections` that no list mentioned. |
| App blockers | `src/features/dashboard/api.ts` was known. **`src/features/profile/api.ts` was not** — two live queries embed `courses!inner(...)`. See `NOTES_BLOCKERS.md`. |
