# Convert and retire the 51 legacy v1 topics — guarded SQL package (2026-09-03)

**Status: PENDING YOUR APPROVAL. Nothing here has been run against production.**
Every file was authored read-only against `yjgolswjggmlpeowvtxr`; not one byte
has been applied.

Your ruling: *"the ones that are being used or share a name consider to be
converted. all the others should be considered stale and retired."*

Your follow-up ruling, 2026-09-03: *"these should be removed: Sound & Acoustics,
Dynamics Processing, Assisted Listening Systems, Corporate AV, Distributed Audio
Systems."* Those five were the only ones I had held back. They are now retired
with the rest, and **the split is 17 CONVERT / 34 RETIRE / nothing outstanding.**

## Run order

Run one file at a time in the Supabase SQL editor. Read the result rows before
moving on. You can stop after any stage — each is self-contained and
independently reversible.

| # | File | What it does | Reversible? |
|---|---|---|---|
| 1 | `00_PRECHECK.sql` | Read-only. Re-derives the 17/34 split from live data, the whole FK graph, every collision count, and proves the fold rule. | n/a |
| 2 | `05_BACKUP.sql` | Builds `cr_v1topics_map_20260903` (the SSoT every later stage reads) and backs up all 51 achievements rows plus every row any stage can touch. Aborts unless the split is exactly 17/34 and no topic being removed carries a term or a question. | n/a |
| 3 | `10_APPLY_convert_repoint.sql` | **CONVERT.** Folds all 1,978 glossary links and the progress rows from the 17 v1 topics onto their v3 twins. Re-evaluates credentials. | Yes |
| — | `15_APPLY_paywall_gate.sql` | *Authored separately, self-contained.* Repoints the `glossary_study_v` `common_mistakes` gate off the dead v1 topic numbers onto the v3 free topics. Read its own header — **it changes what free users see.** Has its own `15_ROLLBACK_paywall_gate.sql`. | Yes, its own file |
| 4 | `20_APPLY_purge_v1_user_data.sql` | Deletes the 6 v1 quiz attempts (+ items) and the 43 + 54 progress rows on all 34 RETIRE topics. | Yes |
| 5 | `30_APPLY_retire_mark.sql` | **RETIRE.** Clears `is_active` / `always_free` / `is_prerequisite` on all 51 and writes a dated ledger row for each. **This is the stage that actually removes the five you named.** | Yes |
| 6 | `40_APPLY_OPTIONAL_hard_delete.sql` | **Optional and currently self-blocking.** Physically deletes all 51 rows — only once nothing points at them. | Yes |
| — | `90_VERIFY.sql` | Read-only. Run after each stage. Stages not yet run read `NOT RUN`. | n/a |
| — | `99_ROLLBACK.sql` | Reverses every stage that has run, in reverse order. | n/a |
| — | `NOTES_RULED_REMOVED_FIVE.md` | The decision record for the five, and why nothing needed folding out of them. | n/a |

The order is the dependency graph:

```
Stage 10  convert      (must precede 20 and 30 — it folds and empties the 17)
Stage 15  paywall gate (independent; anywhere after 10 is natural)
Stage 20  purge        (must precede 40 — attempts and progress block a delete)
Stage 30  retire       (must precede 40 — retire before you delete)
Stage 40  hard delete  (optional; needs REMOVE_V1_REMNANTS Stage 60 first)
```

## The verified split

Re-derived from live data, not taken on trust.

| Class | Topics | Currently active | Glossary terms | Quiz questions |
|---|---|---|---|---|
| **CONVERT** — has an exact v3 name twin | 17 | 9 | 1,978 (on 16 of them) | 50 (all on gs0) |
| **RETIRE** — no twin; goes | 34 | 5 | **0** | **0** |
| | **51** | **14** | 1,978 | 50 |

The 34 RETIRE are the 29 that were already inactive plus the five you named
(gs 1, 9, 17, 19, 21), which are the only active rows in that bucket.

The 17 CONVERT pairs, resolved by exact case-insensitive name match inside
curriculum `a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72` and then pinned to
`global_sequence` pairs so nothing depends on a display string at run time:

| v1 gs | Name | → v3 gs | v1 active? | terms folded |
|---|---|---|---|---|
| 0 | Pro Audio Safety | 3060 | yes | yes |
| 2 | Grounding & Electrical | 3070 | yes | yes |
| 4 | Signal Path & Levels | 3030 | yes | yes |
| 8 | Equalization (EQ) | 3340 | yes | yes |
| 12 | Amplifiers | 3180 | yes | yes |
| 14 | Analog Live Sound | 3560 | yes | yes |
| 15 | Digital Live Sound | 3570 | yes | yes |
| 16 | RF Wireless Systems | 3600 | yes | yes |
| 22 | Vehicle Audio | 3770 | yes | yes |
| 32 | Documentation & Diagrams | 3300 | no | yes |
| 35 | Vacuum Tubes | 3190 | no | yes |
| 37 | MIDI | 4040 | no | yes |
| 41 | Project Management | 4360 | no | yes |
| 46 | Audio Career Exploration | 4380 | no | yes |
| 47 | Workplace Skills | 4370 | no | yes |
| 49 | Music Entrepreneurship | 4390 | no | yes |
| 50 | Industry Foundations | 4400 | no | yes |

`05_BACKUP` refuses to build the map unless all 17 pairs still share a name, the
split is still 17/34, and the five you named are present, active, and classed
RETIRE. If the taxonomy moves under this package, it stops rather than guessing.

## The fold rule — met, and proven, not assumed

Your general rule: **"terms should fold into other existing."** A term folds
when its topic link moves onto a live v3 topic. A term is lost when the only
topic it is attached to disappears. Measured on live data:

- **All 1,978 v1 glossary links sit on CONVERT topics** — 16 of the 17. Stage 10
  folds every single one onto its v3 twin.
- **The 34 RETIRE topics carry ZERO glossary links.** Including the five you
  ruled removed: zero each.
- **The 34 RETIRE topics carry ZERO quiz questions.** All 50 v1 questions sit on
  gs0, a CONVERT topic.
- **Zero rows in `glossary` point at a v1 topic directly** (`achievement_id`).
- **Zero glossary terms currently have no topic link at all**, so "no term is
  left orphaned" is a real invariant `90_VERIFY` can assert rather than a hope.

**No topic being removed carries a term, and every term folds into an existing
v3 topic.** That is the rule, met.

This is enforced, not just documented: `05_BACKUP` aborts if any RETIRE topic
holds a glossary link or a quiz question, and `30_APPLY` re-checks at apply time
that nothing being deactivated still owns a term.

Of the 1,978 links folded, 1,624 are cases where the term is **already** linked
to the v3 twin; those v1 duplicates are dropped rather than moved, which is not
a loss — the term keeps the identical link through the surviving row. The other
354 are genuine repoints.

## Four things the original brief had wrong

None changes the plan, but you should know.

1. **`course_id IS NOT NULL` is one-directional.** All 51 rows carrying a
   `course_id` are v1, but the v1 curriculum holds **52** rows — gs51
   `Foundations of Sound` has a NULL `course_id` and is not in this package's
   set. It is inactive and nothing points at it.
2. **There are not 417 v3 rows.** 417 rows have a NULL `course_id`, in three
   populations: 175 v3 (166 active), **241 in a third curriculum `51c1d5db…`
   labelled `v2-draft`**, and that 1 v1 row. Nobody has ruled on the 241.
3. **"Zero glossary rows point at any v1 topic" was true of the wrong table.**
   `glossary.achievement_id` is indeed 0, but `glossary_topics` — which carries
   the actual term→topic membership — held **1,978** rows on v1 topics. Its
   foreign key is **`ON DELETE CASCADE`**: a hard delete would have destroyed
   all 1,978 silently. That is why Stage 30 is a soft retire.
4. **`student_achievement_progress` has 64 rows on the 51, not 51** (91 in
   `student_method_progress`).

## What "convert" means here, mechanically

For each of the 17 pairs, every surviving reference moves from the v1 id to the
v3 id, then the v1 row is retired in Stage 30. Three tables carry references and
all three have a unique key a naive `UPDATE` would violate.

**The collision rule, applied identically in all three: the v3 row wins.**
Where the twin already holds a row for the same key, the **v1 duplicate is
deleted** and the v3 row is left byte-for-byte untouched. No field merging.

| Table | Unique key | Rows to handle | Collide → v1 row deleted | Genuinely repointed |
|---|---|---|---|---|
| `glossary_topics` | `(glossary_id, achievement_id)` | 1,978 | 1,624 | 354 |
| `student_achievement_progress` | `(user_id, achievement_id)` | 21 | 17 | 4 |
| `student_method_progress` | `(user_id, achievement_id, method_key)` | 37 | 3 | 34 |

Why the v3 side wins rather than a merge:

- **For the glossary links — which are curated content — the delete provably
  loses nothing.** Zero of the 1,978 is a `is_primary` home, so no term's
  primary topic moves and the partial unique index
  `ux_glossary_topics_one_primary` cannot be hit. And in zero cases does the v1
  row carry a `difficulty` its v3 twin lacks (39 differ; the v3 side is
  populated in all 39, and it is the curated value).
- **For the progress rows, there is nothing to weigh.** They are pre-launch test
  data across your own accounts.
- A merge would need a per-column precedence rule you have not given. Picking
  one side is honest; inventing a merge is not.

Stage 10 also calls `evaluate_user_credentials()` once per affected user. It has
to: `student_progress_award` fires on `INSERT OR UPDATE OF status` only, so
repointing `achievement_id` does **not** fire it, and a repointed `complete` row
now credits a v3 topic that certificate and program membership actually read.

### What convert does NOT move, and why

**`quiz_questions` — 50 rows, all on v1 gs0 Pro Audio Safety, all `approved`,
`source = ai_generated`.** Its twin gs3060 already holds **792**. Repointing
would inject 50 questions never ratified against the v3 topic straight into a
live quiz pool, which collides with your ratified-copy rule. They stay on the
retired v1 row where nothing can serve them. **Still your decision: delete them,
or promote them into 3060 deliberately.**

**`quiz_attempts` — 6 rows, all submitted.** An attempt records sitting a *v1*
quiz; rewriting it onto a v3 topic would fabricate v3 exam history that feeds
mastery and certificate evaluation. Stage 20 deletes them (backed up).

**`badges` — 4 rows, all v1-curriculum.** None points at a CONVERT topic:
`MIC Certified`, `REC Certified` and `MIX Certified` trigger off stale RETIRE
topics, and `PA Certified` off gs17 Assisted Listening Systems — one of the five
you ruled removed. All four are left as they are, and they are one of the two
things making Stage 40 refuse.

**`public_course_topics` — 54 rows covering all 51 topics.** A v1 catalog the app
no longer reads and that `REMOVE_V1_REMNANTS` Stage 60 drops outright.

## Why "retire" is deactivate-and-mark, not delete

Stage 30 sets `is_active = false`, `always_free = false`,
`is_prerequisite = false` on all 51 and writes a row per topic into
`cr_v1topics_ledger_20260903` recording what it was and why it went. 16 rows
actually change: the 14 active ones (9 CONVERT + your five), plus gs36 DAW
Skills which is inactive but `always_free`, plus one inactive prerequisite.

Three reasons for soft over hard:

1. **`glossary_topics.achievement_id` is `ON DELETE CASCADE`.** A hard delete
   destroys curated links with no error. Stage 10 empties that table first, but
   "the destructive path is one forgotten stage away from losing 1,978 curated
   links" is exactly the shape of thing to design out.
2. **50 approved quiz questions and 4 badges still point into the set with
   `NO ACTION` foreign keys.** A hard delete cannot execute until you rule on
   that content, and forcing it would mean deleting curated content as a side
   effect of a cleanup.
3. **Deletion buys no outcome.** Nothing in the app can reach an inactive topic
   in an archived curriculum: `start_quiz_attempt` raises
   `archived_quiz_retired` for the v1 curriculum by hard-coded id, the glossary
   topic filter selects v3 + `is_active` only, and `public_course_topics` is no
   longer read. **Deactivation is what removes your five from the app.**

`40_APPLY_OPTIONAL_hard_delete.sql` is there if you want the rows physically
gone. It is fully guarded, names its blocker in the error message, re-checks
`pg_constraint` for any FK it has not been taught about, and **as of today it
will refuse.** That refusal is a feature.

## Sequencing against the other packages

| Requirement | Needed by | State today |
|---|---|---|
| `REMOVE_V1_REMNANTS` Stage 60 — `DROP public_course_topics` | **Stage 40 only** | not run |
| `REMOVE_V1_REMNANTS` Stage 30 — quiz function rewrite | recommended before Stage 20 | not run |
| `REMOVE_COLLEGE_COURSES_2026_09_03` | nothing here | independent |
| `RETIRE_INSTITUTIONAL_PATH` — dropping `achievements.course_id` | **must come AFTER `05_BACKUP` here** | not run |

**Stages 10, 20 and 30 can run today**, in any relation to the other packages.

The one hard ordering constraint runs the other way:
`RETIRE_INSTITUTIONAL_PATH` plans to drop `achievements.course_id`, which is the
predicate that identifies these 51 rows. **Run `05_BACKUP` before that column
goes** — after that the map table stands on its own and you are safe either way.

## Safety design

- **Guarded.** Every apply file refuses to run when a precondition is unmet:
  backup missing, prior stage not run, a row about to be touched that the backup
  did not capture, a quiz attempt still `in_progress`, a CONVERT pair that lost
  its name match, a RETIRE topic that has acquired a term or a question.
- **Atomic.** Each apply stage is one `DO` block; a guard firing mid-way rolls
  the whole stage back.
- **Idempotent.** Re-running any stage finds nothing to do and reports zeros.
- **Scoped by stable keys.** `(curriculum_version_id, global_sequence)` pairs and
  the map's UUIDs. Display names are only ever *asserted*, never used to select.
- **Every destructive step is backed up first**, row for row, with original ids.
- **Trigger-aware.** `trig_validate_quiz_question_count` only fires on
  *activation*, so Stage 30 deactivating five live rows cannot trip it;
  `trig_validate_applicable_methods` fires on any update, so Stage 30 pre-checks
  method keys. No trigger is ever disabled.
- **No `\echo`.** All output returns as result rows. Each apply stage appends to
  `cr_v1topics_report_20260903` so `90_VERIFY` shows the whole run.

## What rollback cannot undo

`evaluate_user_credentials()`. Stage 10 recomputes credentials for affected
users, and re-inserting a `complete` progress row fires `student_progress_award`
again. Credential state is **recomputed**, not rewound. The rollback says so.

Everything else restores exactly, including your five coming back active.

## After a successful run

Keep the backup tables until you are satisfied — they are the only copy. Keep
`cr_v1topics_map_20260903` and `cr_v1topics_ledger_20260903` until the
institutional package is finished: once `achievements.course_id` is gone, they
are the only record of which v1 topic became which v3 topic, and of which five
were removed and when.

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

1. **The 50 v1 quiz questions on gs0.** Delete, or promote into the live 3060
   pool of 792?
2. **The four v1 badges** (`MIC`/`REC`/`MIX`/`PA Certified`). Delete, retarget
   to v3 topics, or leave dormant?
3. **The 241 `v2-draft` achievements rows** nobody has ruled on.
