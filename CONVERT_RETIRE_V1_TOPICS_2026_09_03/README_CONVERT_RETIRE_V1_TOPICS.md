# Convert and retire the 51 legacy v1 topics — guarded SQL package (2026-09-03)

**Status: PENDING YOUR APPROVAL. Nothing here has been run against production.**
Every file was authored read-only against `yjgolswjggmlpeowvtxr`; not one byte
has been applied.

Your ruling: *"the ones that are being used or share a name consider to be
converted. all the others should be considered stale and retired."*

## Run order

Run one file at a time in the Supabase SQL editor. Read the result rows before
moving on. You can stop after any stage — each is self-contained and
independently reversible by `99_ROLLBACK`.

| # | File | What it does | Reversible? |
|---|---|---|---|
| 1 | `00_PRECHECK.sql` | Read-only. Re-derives the split from live data, the whole FK graph, every collision count, and the sequencing state of the other two packages. | n/a |
| 2 | `05_BACKUP.sql` | Builds `cr_v1topics_map_20260903` (the SSoT every later stage reads) and backs up all 51 achievements rows plus every row any stage can touch. Aborts unless the split is exactly 17/29/5. | n/a |
| 2b | `15_APPLY_paywall_gate.sql` | **Paywall.** Points the Common Mistakes gate in `glossary_study_v` at the v3 free topics (3060, 3970) instead of the v1 pair (0, 36). Self-contained: own backup, own rollback in `15_ROLLBACK_paywall_gate.sql`. **Widens the free tier from 119 terms to 390** — read its header. Safe to run first. | Yes |
| 3 | `10_APPLY_convert_repoint.sql` | **CONVERT.** Repoints glossary links and progress from the 17 v1 topics onto their v3 twins, deleting duplicates. Re-evaluates credentials. | Yes |
| 4 | `20_APPLY_purge_v1_user_data.sql` | Deletes the 6 v1 quiz attempts (+ items) and the progress rows on the 29 RETIRE topics. Leaves BLOCKED alone. | Yes |
| 5 | `30_APPLY_retire_mark.sql` | **RETIRE.** Clears `is_active` / `always_free` / `is_prerequisite` on the 46, and writes a dated ledger row for each. | Yes |
| 6 | `40_APPLY_OPTIONAL_hard_delete.sql` | **Optional and currently self-blocking.** Physically deletes the 46 rows — only once nothing points at them. Read its header before you even open it. | Yes |
| — | `90_VERIFY.sql` | Read-only. Run after each stage. Stages not yet run read `NOT RUN`. | n/a |
| — | `99_ROLLBACK.sql` | Reverses every stage that has run, in reverse order. | n/a |
| — | `NOTES_BLOCKED_FIVE.md` | The five rows I refused to guess at, what points at them, and your options. | n/a |

The order is the dependency graph:

```
Stage 10  convert      (must precede 20 and 30 — it empties the 17 topics)
Stage 20  purge        (must precede 40 — attempts and progress block a delete)
Stage 30  retire       (must precede 40 — retire before you delete)
Stage 40  hard delete  (optional; needs REMOVE_V1_REMNANTS Stage 60 first)
```

## The verified split

I re-derived it rather than trusting the brief. It came out exactly as briefed:
**17 CONVERT · 29 RETIRE · 5 BLOCKED = 51.** Of the 14 active v1 topics, 9 have a
twin and 5 do not; of the 37 inactive, 8 have a twin and 29 do not.

The 17 pairs, resolved by exact case-insensitive name match inside curriculum
`a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72` and then pinned to `global_sequence`
pairs so nothing depends on a display string at run time:

| v1 gs | Name | → v3 gs | v1 was active? |
|---|---|---|---|
| 0 | Pro Audio Safety | 3060 | yes |
| 2 | Grounding & Electrical | 3070 | yes |
| 4 | Signal Path & Levels | 3030 | yes |
| 8 | Equalization (EQ) | 3340 | yes |
| 12 | Amplifiers | 3180 | yes |
| 14 | Analog Live Sound | 3560 | yes |
| 15 | Digital Live Sound | 3570 | yes |
| 16 | RF Wireless Systems | 3600 | yes |
| 22 | Vehicle Audio | 3770 | yes |
| 32 | Documentation & Diagrams | 3300 | no |
| 35 | Vacuum Tubes | 3190 | no |
| 37 | MIDI | 4040 | no |
| 41 | Project Management | 4360 | no |
| 46 | Audio Career Exploration | 4380 | no |
| 47 | Workplace Skills | 4370 | no |
| 49 | Music Entrepreneurship | 4390 | no |
| 50 | Industry Foundations | 4400 | no |

`05_BACKUP` refuses to build the map unless all 17 pairs still share a name, the
split is still 17/29/5, and the BLOCKED set is still exactly gs 1, 9, 17, 19, 21.
If the taxonomy moves under this package, it stops rather than guessing.

## Four things your brief had slightly wrong

None of them changes the plan, but you should know.

1. **`course_id IS NOT NULL` is not an exact synonym for "v1 row".** It is exact
   in one direction only: all 51 rows carrying a `course_id` are v1. But the v1
   curriculum holds **52** rows — gs51 `Foundations of Sound` has a NULL
   `course_id` and is therefore not in this package's set at all. It is inactive
   and nothing points at it. Flagging it so it does not surprise you later as
   "the one v1 topic that survived".

2. **There are not 417 v3 rows.** 417 rows have a NULL `course_id`, but they are
   three populations: 175 v3 (`v3-locked-172`, 166 active), **241 in a third
   curriculum `51c1d5db…` labelled `v2-draft`**, and the 1 v1 row above. This
   package touches only v1 and writes only into v3. The 241 v2-draft rows are
   untouched and are not on anyone's list — you may want a decision about them
   eventually.

3. **"Zero glossary rows point at any v1 topic" is true of the wrong table.**
   `glossary.achievement_id` is indeed 0. But `glossary_topics` — the link table
   that actually carries term→topic membership — holds **1,978 rows** on v1
   topics, every one of them on a CONVERT topic. This is the single largest
   thing this package moves, and its foreign key is **`ON DELETE CASCADE`**: a
   hard delete of those achievements would have destroyed all 1,978 silently,
   with no error and no rollback. It is the main reason Stage 30 is a soft
   retire.

4. **`student_achievement_progress` has 64 rows on the 51, not 51.** Four
   accounts, several topics each. `student_method_progress` has 91.

## What "convert" means here, mechanically

For each of the 17 pairs, every surviving reference moves from the v1 id to the
v3 id, then the v1 row is retired in Stage 30. Three tables carry references and
all three have a unique key that a naive `UPDATE` would violate.

**The collision rule, applied identically in all three: the v3 row wins.**
Where the twin already holds a row for the same key, the **v1 duplicate is
deleted** and the v3 row is left byte-for-byte untouched. No field is merged.

| Table | Unique key | Rows to handle | Collide → v1 row deleted | Genuinely repointed |
|---|---|---|---|---|
| `glossary_topics` | `(glossary_id, achievement_id)` | 1,978 | 1,624 | 354 |
| `student_achievement_progress` | `(user_id, achievement_id)` | 21 | 17 | 4 |
| `student_method_progress` | `(user_id, achievement_id, method_key)` | 37 | 3 | 34 |

Why the v3 side wins rather than a max/coalesce merge:

- Every colliding row is pre-launch test data from your seven accounts, and the
  v3 row is the one the live app already reads. There is no user to protect.
- **The delete provably loses nothing.** Zero of the 1,978 v1 glossary links is
  a `is_primary` home, so no term's primary topic moves and the partial unique
  index `ux_glossary_topics_one_primary` cannot be hit. And in zero cases does
  the v1 row carry a `difficulty` its v3 twin lacks (39 rows differ, but the v3
  side is populated in all 39 — the v3 value is the curated one).
- A merge would need a per-column precedence rule you have not given, on data
  that is disposable. Picking one side is honest; inventing a merge is not.

Stage 10 also calls `evaluate_user_credentials()` once per affected user. It has
to: the `student_progress_award` trigger fires on `INSERT OR UPDATE OF status`
only, so repointing `achievement_id` does **not** fire it, and a repointed
`complete` row now credits a v3 topic that certificate and program membership
actually read.

### What convert does NOT move, and why

**`quiz_questions` — 50 rows, all on v1 gs0 Pro Audio Safety, all `approved`,
all `source = ai_generated`.** Its twin gs3060 already holds **792** questions.
Repointing would inject 50 questions that were never ratified against the v3
topic straight into a live quiz pool, which collides head-on with your
ratified-copy rule. They stay on the retired v1 row, where nothing can serve
them. **This is a decision waiting for you: delete them, or promote them into
3060 deliberately.** It is also the reason Stage 40 refuses to run.

**`quiz_attempts` — 6 rows, all submitted, one user.** An attempt is a record of
sitting a *v1* quiz. Rewriting it onto a v3 topic would fabricate v3 exam
history that feeds mastery and certificate evaluation. Stage 20 deletes them
(backed up) instead of repointing them.

**`badges` — 4 rows.** None points at a CONVERT topic: `MIC Certified`,
`REC Certified` and `MIX Certified` trigger off RETIRE topics, and
`PA Certified` off a BLOCKED one. All four are v1-curriculum badges. Nothing to
convert; they are left exactly as they are and they are why Stage 40 refuses.

**`public_course_topics` — 54 rows covering all 51 topics.** A v1 catalog table
that the app no longer reads and that `REMOVE_V1_REMNANTS` Stage 60 drops
outright. Repointing it would be maintaining something on its way to deletion.

## Why "retire" is a deactivate-and-mark, not a delete

Stage 30 sets `is_active = false`, `always_free = false`,
`is_prerequisite = false` on the 46 and writes a row per topic into
`cr_v1topics_ledger_20260903` recording what it was, what it became, and why.

Three reasons, in order of weight:

1. **`glossary_topics.achievement_id` is `ON DELETE CASCADE`.** A hard delete
   destroys curated links with no error. Today Stage 10 empties that table for
   the CONVERT set first, but "the destructive path is one forgotten stage away
   from data loss" is exactly the shape of thing to design out.
2. **50 approved quiz questions and 3 badges still point into the set with
   `NO ACTION` foreign keys.** A hard delete cannot even execute until you rule
   on that content, and forcing it would mean deleting curated content as a side
   effect of a cleanup.
3. **Deletion buys no outcome.** Nothing in the app can reach an inactive topic
   in an archived curriculum: `start_quiz_attempt` raises `archived_quiz_retired`
   for the v1 curriculum by hard-coded id, the glossary topic filter selects v3
   + `is_active` only, and `public_course_topics` is no longer read.
   Deactivation satisfies the ruling; deletion only adds risk.

Note that 37 of the 46 are **already** `is_active = false`, so the visible
effect of Stage 30 is the 9 active CONVERT topics going dark plus `always_free`
coming off gs0 and gs36. The ledger is what makes the retirement legible to the
next person who looks — which is the part that was actually missing.

`40_APPLY_OPTIONAL_hard_delete.sql` is there if you disagree. It is fully
guarded, it names in its error message exactly what is blocking it, it re-checks
`pg_constraint` for any foreign key the file has not been taught about, and
**as of today it will refuse.** That refusal is a feature.

## Sequencing against the other two packages

| Requirement | Needed by | State today |
|---|---|---|
| `REMOVE_V1_REMNANTS` Stage 60 — `DROP public_course_topics` | **Stage 40 only** | not run — the table still holds 54 rows pointing at all 51 topics |
| `REMOVE_V1_REMNANTS` Stage 30 — quiz function rewrite | recommended before Stage 20 | not run |
| `REMOVE_COLLEGE_COURSES_2026_09_03` | nothing here | independent; it deletes 53 of those 54 rows and leaves the gs0 one |
| `RETIRE_INSTITUTIONAL_PATH` — dropping `achievements.course_id` | **must come AFTER this package** | not run |

**Stages 10, 20 and 30 can run today, in any relation to the other packages.**
They touch no object those packages own.

The one hard ordering constraint runs the other way, and it matters:
`RETIRE_INSTITUTIONAL_PATH` plans to drop `achievements.course_id`. That column
is the predicate this entire package uses to identify the 51 rows. **Run this
package before that column is dropped**, or `05_BACKUP` will have nothing to
select on and the map can never be rebuilt. The `cr_v1topics_map_20260903` table
survives the column drop, so once Stage 05 has run you are safe either way — but
until it has, this package depends on that column existing.

`v_student_progress` also joins `achievements.course_id`; that view is
`RETIRE_INSTITUTIONAL_PATH` Stage 10's problem, not this package's.

## Safety design

- **Guarded.** Every apply file opens with guards that refuse to run when a
  precondition is unmet: backup missing, prior stage not run, a row about to be
  touched that the backup did not capture, a quiz attempt still `in_progress`, a
  BLOCKED topic about to be modified, a CONVERT pair that lost its name match.
- **Atomic.** Each apply stage is a single `DO` block, so a guard that fires
  mid-way rolls the whole stage back.
- **Idempotent.** Re-running any stage finds nothing to do and reports zeros.
- **Scoped by stable keys.** `(curriculum_version_id, global_sequence)` pairs and
  the mapping table's UUIDs. Display names are only ever *asserted*, never used
  to select a row at apply time.
- **Every destructive step is backed up first**, row for row, with original ids.
- **Trigger-aware.** The `achievements` BEFORE UPDATE triggers only fire
  restrictions on *activation*, so Stage 30's deactivation cannot trip them —
  but Stage 30 still pre-checks `applicable_methods` because
  `trig_validate_applicable_methods` fires on *any* update.
- **No `\echo`.** All output comes back as result rows, so the files paste
  straight into the Supabase SQL editor. Each apply stage also appends to
  `cr_v1topics_report_20260903` so `90_VERIFY` can show you the whole run.

## What rollback cannot undo

`evaluate_user_credentials()`. Stage 10 recomputes credentials for the affected
users, and re-inserting a `complete` progress row fires
`student_progress_award` again. Credential state is therefore **recomputed**,
not rewound. On seven pre-launch accounts that is the right outcome, but it is
not a byte-for-byte restore and the rollback file says so.

## After a successful run

Keep the backup tables until you are satisfied — they are the only copy. Keep
`cr_v1topics_map_20260903` and `cr_v1topics_ledger_20260903` until the
institutional package has finished, because they are the only surviving record
of which v1 topic became which v3 topic once `achievements.course_id` is gone.

```sql
drop table public.cr_v1topics_achievements_20260903;
drop table public.cr_v1topics_glossary_topics_20260903;
drop table public.cr_v1topics_sap_20260903;
drop table public.cr_v1topics_smp_20260903;
drop table public.cr_v1topics_quiz_attempts_20260903;
drop table public.cr_v1topics_quiz_attempt_items_20260903;
drop table public.cr_v1topics_quiz_questions_ref_20260903;
drop table public.cr_v1topics_badges_ref_20260903;
drop table public.cr_v1topics_report_20260903;
-- keep these two:
-- public.cr_v1topics_map_20260903
-- public.cr_v1topics_ledger_20260903
```

## Still on your desk

1. **The five BLOCKED topics.** `NOTES_BLOCKED_FIVE.md`.
2. **The 50 v1 quiz questions on gs0.** Delete, or promote into the live 3060
   pool of 792?
3. **The four v1 badges.** Delete, retarget to v3 topics, or leave dormant?
4. **`glossary_study_v`'s `ARRAY[0, 36]` free-tier gate**, which this package
   renders completely dead. See `NOTES_BLOCKED_FIVE.md`.
5. **The 241 `v2-draft` achievements rows** nobody has ruled on.
