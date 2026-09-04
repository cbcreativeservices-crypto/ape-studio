# Resume here — the v1 removal, morning of 2026-09-04

Parked 2026-09-03 at a clean stopping point. Nothing is half-applied, the app is
healthy, and every change is committed and pushed on `audio-tools-engine`.

## The one thing to do next

Open the decision sheet and mark the twelve functions:

**https://claude.ai/code/artifact/ee277ce2-603f-457d-a626-8ebaa84bda6a**

Twelve cards, Agree / Change it / Ask me on each, then the Copy decisions button
and paste the result back to ccode. Two cards are marked red and deserve real
attention; the other ten are quick.

Once those are marked, the last package runs and v1 is gone.

## Where things stand

Four of five SQL packages are applied and verified.

| Package | State |
|---|---|
| Paywall gate (v3 free topics) | applied |
| Convert / retire v1 topics | applied — 17 folded, 34 retired |
| Remove college courses | applied — 8 gone, order 1 kept |
| Remove v1 remnants | applied — all 24 checks PASS |
| Retire institutional path | applied — both views dropped |
| **Drop v1 scaffolding** | **written, not run — blocked on the twelve** |

Verified state of the database after all of it:

- No `public_courses`, no `public_course_topics`, no `glossary.course_id`.
- No commercial gating functions, no v1 topic marked active.
- Glossary corpus intact at 26,847. v3 still 166 active topics.
- All backups retained. Every package has a rollback.

Verified state of the app: Home shows five cards, the two free tasters are the v3
pair, Glossary loads all 26,847 terms. `tsc` clean, 179/179 tests.

## The last package

[`DROP_V1_SCAFFOLDING_2026_09_03`](../DROP_V1_SCAFFOLDING_2026_09_03) — rewrites
seven functions, deletes five, then drops `session_logs`,
`achievements.course_id`, `enrollment`, `course_sections` and `courses`, in that
dependency order.

**One app change must ship before its stage 50.** `src/features/profile/api.ts`
embeds `courses!inner(code, sequence, color_hex)` in two queries that feed the
Achievements and Gallery screens. Dropping `achievements.course_id` breaks both.
What replaces `courses.code` and `color_hex` under v3 is a design decision Booth
has not made, so it was written up rather than guessed. **Decide this before
running stage 50, or those two screens go blank the way the Glossary did.**

## Lessons from yesterday, do not repeat them

1. **Green SQL is not a working app.** All 24 checks passed while the Glossary
   rendered zero terms, because a query still named a dropped column. After every
   package: open the app and look.
2. **Guards must not read comments.** A dependency check matching the raw
   function source also matches `--` comments, and the rewrites deliberately add
   comments naming the dropped tables. All 92 checks now strip comments first.
3. **The Supabase editor is not psql.** No `\echo`. It returns only the last
   result set, so a stage that reports through several SELECTs shows one, and a
   stage that reports only through `RAISE NOTICE` appears to do nothing.
4. **`check` is a reserved word.** `AS check` is legal; referencing it bare is not.

## Still open, none of it blocking

- The 241 `v2-draft` rows: an abandoned draft curriculum, wholly inert, nothing
  points at it. Booth confirmed it was abandoned. Offered for deletion, not yet
  authorised.
- The `profile/api.ts` design call above.
- Whether `lookup_student_by_qr` should be deleted rather than rewritten —
  nothing in the app calls it.

## Not part of this at all

The six labs from 2026-09-02 are built, design-reviewed and **tested and approved
by Booth**. Nothing outstanding there.
