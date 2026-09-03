# The five v1 topics Booth ruled removed — decision record

**Decided 2026-09-03.** Verbatim: *"these should be removed: Sound & Acoustics,
Dynamics Processing, Assisted Listening Systems, Corporate AV, Distributed Audio
Systems."*

That is v1 `global_sequence` **1, 9, 17, 19, 21**. This file was an open question
until that ruling; it is now the record of the answer. Nothing here is pending.

## What they were, and why they needed a ruling at all

These five were the only v1 topics that were **active** and had **no v3 name
twin**. Every other one of the 51 fell out cleanly: 17 share a name with a live
v3 topic and convert onto it, 29 were already inactive and stale. These five sat
across the two halves of the original instruction — used, but with nowhere to
fold to. Rather than infer a mapping, I held them back and asked. The answer is
remove, so they now travel with the other 29 as `RETIRE`.

**Split is now 17 CONVERT / 34 RETIRE / 0 held back.**

## Nothing needed folding — verified, not assumed

Booth's general rule is *"terms should fold into other existing."* For these
five the rule is satisfied trivially, because none of them owns anything to
fold. Measured live:

| v1 gs | Name | glossary links | quiz questions | quiz attempts | badges | progress rows |
|---|---|---|---|---|---|---|
| 1 | Sound & Acoustics | **0** | **0** | 0 | — | 3 sap / 9 smp |
| 9 | Dynamics Processing | **0** | **0** | 0 | — | 1 sap / 3 smp |
| 17 | Assisted Listening Systems | **0** | **0** | 0 | 1 | 1 sap / 3 smp |
| 19 | Corporate AV | **0** | **0** | 0 | — | 1 sap / 3 smp |
| 21 | Distributed Audio Systems | **0** | **0** | 0 | — | 1 sap / 3 smp |

Zero terms and zero questions across all five. They are topic headings with
progress rows attached and no content behind them. The progress rows are
disposable — seven pre-launch accounts, all Booth's own — and Stage 20 deletes
them (backed up first).

`05_BACKUP` now **asserts** this rather than trusting it: it aborts if any
RETIRE topic carries a glossary link or a quiz question. If content ever appears
on one of the 34, the package stops instead of removing it.

## The one attachment that survives them

`PA Certified` — a v1-curriculum badge whose `trigger_achievement_id` is gs17
Assisted Listening Systems. It is one of four v1 badges, all of which this
package deliberately leaves alone. Retiring gs17 does not break the badge row;
it just means the badge triggers off a dead topic, exactly like the other three
already do.

The four v1 badges are a single outstanding decision — delete, retarget to v3
topics, or leave dormant — and they are one of the two things that make
`40_APPLY_OPTIONAL_hard_delete.sql` refuse to run.

## How the five differ from the other 29 in the run

Only in Stage 30, and only in one way that matters: **they are the only rows in
the package whose deactivation is the actual removal.**

- The 29 stale ones are already `is_active = false`. Stage 30 is bookkeeping.
- The 9 active CONVERT topics go dark too, but their content lives on at the v3
  twin — Stage 10 moved it there first.
- These five are `is_active = true` with no successor. When Stage 30 clears the
  flag, the topic is gone from the app and nothing takes its place. That is what
  Booth asked for.

Nothing else in the pipeline treats them differently. Stage 20 selects on the
mapping table's class, not on `is_active`, so it purges their progress rows the
same way it purges the other 29's. Stage 30's `BEFORE UPDATE` triggers on
`achievements` only fire restrictions on *activation*, so deactivating a live
row trips nothing.

## The carousel-name overlap — recorded, still not acted on

`Assisted Listening Systems` and `Corporate AV` also appear in
`C:\Users\profe\dev\ape-studio\src\screens\courses\CourseSelectionScreen.tsx`,
in the `TOPIC_CARD_ART` filename map (lines ~183 and ~185), keyed by display
name.

**They are not rendered.** `FIELD_TOPICS` on line 147 is an empty array, so the
topic-card deck those names fed is dormant, and nothing in that file resolves
those strings to an `achievements` row — they are keys into a bucket image map.

So removing the database rows breaks nothing on screen. But if `FIELD_TOPICS`
ever comes back, those two cards will name topics that no longer exist anywhere
in the curriculum. Worth knowing before that array is repopulated.

## Two related findings from the same investigation

**1. `glossary_study_v` gated `common_mistakes` on v1 topic numbers.** The view
returned `common_mistakes` to non-members only when
`a.global_sequence = ANY (ARRAY[0, 36])` — v1 values, which no v3 topic can
match. After Stage 10 folds the last v1 glossary link away, that gate matches
nothing at all.

This is now handled by `15_APPLY_paywall_gate.sql` / `15_ROLLBACK_paywall_gate.sql`
in this same folder, authored separately against Booth's instruction to point
the gate at the v3 free topics. Read that file's own header before running it —
it changes what free users see, and it says by how much.

**2. Two app queries resolve topics by `global_sequence` with no curriculum
filter**, so they could pick up a v1 row if a low gs ever reached them:

- `C:\Users\profe\dev\ape-studio\src\features\curriculum\curriculumStats.ts` line ~38
- `C:\Users\profe\dev\ape-studio\src\features\dashboard\api.ts` line ~231

Both are fed v3 gs values (3000+) in practice, so neither is a live bug and
neither blocks this package. Worth a `.eq('curriculum_version_id', V3_...)` next
time either file is open. `GlossaryScreen.tsx` line ~1210 already does it
correctly and is the pattern to copy.
