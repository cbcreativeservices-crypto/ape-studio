# The five v1 topics I could not rule on

Verified read-only against `yjgolswjggmlpeowvtxr` on 2026-09-03. Nothing was run.

Your ruling was *"the ones that are being used or share a name consider to be
converted. all the others should be considered stale and retired."* These five
are **being used** and **do not share a name** with anything in v3. The two
halves of the rule point in opposite directions, so I stopped.

No SQL is authored for them. `05_BACKUP` classes them `BLOCKED`, and every apply
stage asserts they come out the other side untouched and still active.

## What each one is, and what points at it today

| v1 gs | Name | progress rows | method rows | badges | quiz questions | glossary links | quiz attempts |
|---|---|---|---|---|---|---|---|
| 1 | Sound & Acoustics | 3 | 9 | — | 0 | 0 | 0 |
| 9 | Dynamics Processing | 1 | 3 | — | 0 | 0 | 0 |
| 17 | Assisted Listening Systems | 1 | 3 | **1** (`PA Certified`) | 0 | 0 | 0 |
| 19 | Corporate AV | 1 | 3 | — | 0 | 0 | 0 |
| 21 | Distributed Audio Systems | 1 | 3 | — | 0 | 0 | 0 |

Each also has one `public_course_topics` row, which disappears when
`REMOVE_V1_REMNANTS` Stage 60 drops that table.

**Read "in use" carefully.** Every one of those progress rows was written by one
of your seven pre-launch accounts; there is no third-party data here. What makes
these five different from the 29 stale ones is not the progress data — it is
that they are the only ones still `is_active = true` with no successor. They are
reachable-looking content with nowhere to go.

`PA Certified` (gs17) is the only structural attachment: a v1-curriculum badge
whose `trigger_achievement_id` is Assisted Listening Systems. It is one of four
v1 badges, all of which this package leaves alone.

## Your options, per topic

For each, one of three. I am not choosing.

**A — create a v3 topic.** Gives the name a real home in the live taxonomy and
makes it a genuine convert. Costs a new curriculum row, a `field`/`subject`
placement, `applicable_methods`, and eventually a question pool. The v3
curriculum is labelled `v3-locked-172`; adding to it is a curriculum decision,
not a data fix.

**B — map to a near neighbour you name.** These are the closest live v3 topics.
I am listing them as candidates for you to accept or reject, **not** as a
mapping — none is a name match and I will not infer one.

| v1 topic | Candidate v3 neighbours (gs · name) |
|---|---|
| Sound & Acoustics | 3000 Sound & Wave Fundamentals · 3040 Foundations — Sound, Waveform, Level & Phase · 3420 Acoustic Principles & Room Behavior |
| Dynamics Processing | 3350 Dynamics — Compression, Limiting & Gating (Core) · 4740 Advanced Dynamics — Processing & Techniques |
| Assisted Listening Systems | 3750 Commercial/Install AV & Assisted Listening |
| Corporate AV | 3750 Commercial/Install AV & Assisted Listening · 3740 Audio System Design & Specification |
| Distributed Audio Systems | 3740 Audio System Design & Specification · 3750 Commercial/Install AV & Assisted Listening |

3750 is the plausible destination for three of the five, which is itself a
finding: v3 folded a whole installed-audio band into one topic. If you accept it
for all three, say so explicitly — three v1 topics collapsing into one v3 topic
is a merge, and I will write it as a merge with the same collision rule as
Stage 10 (the v3 row wins).

**C — retire anyway.** The honest reading of the second half of your sentence,
if "used" means "used by a real user" rather than "flagged active". Costs
nothing structurally: gs17's badge would then need the same decision as the
other three v1 badges. If you pick this for all five, tell me and I will add a
Stage 35 that folds them into the existing retire path — it is four lines.

## The carousel-name overlap — flagged, not assumed

`Assisted Listening Systems` and `Corporate AV` also appear in
`C:\Users\profe\dev\ape-studio\src\screens\courses\CourseSelectionScreen.tsx`,
in the `TOPIC_CARD_ART` filename map (lines ~183 and ~185), keyed by display
name.

**They are not currently rendered.** `FIELD_TOPICS` on line 147 is an empty
array, so the topic-card deck those names fed is dormant. Nothing in that file
resolves those strings to an `achievements` row — they are keys into a bucket
image map and nothing more.

So: the names coincide, and the art exists. Whether that is because the carousel
was built from the v1 topic list, or because both were built from the same
mental model of the field, I cannot tell from the code, and I am not going to
guess. If you intend to bring `FIELD_TOPICS` back, that is an argument for
option A on those two. If the carousel is dead, it is not evidence of anything.

## Two more things I found while proving this out

**1. `glossary_study_v` gates on v1 topic numbers.** The view that feeds the
glossary study path returns `common_mistakes` to non-members only when
`a.global_sequence = ANY (ARRAY[0, 36])`. Those are v1 gs values — v3 topics
start at 3000, so that gate can only ever match a v1 topic. After Stage 10 no
glossary link points at a v1 topic at all, so the free-taster exception becomes
completely dead and every non-member loses `common_mistakes` everywhere.

I did **not** change it. Whether non-members should get `common_mistakes` on any
v3 topic is a paywall decision, and your `calc-weekly-limit` and free/paid split
rulings say those are yours. It is a one-line view rewrite once you tell me what
the rule is. Note that `REMOVE_V1_REMNANTS` Stage 20 deals with the *other*
hard-coded `(0, 36)`, in `seed_commercial_free_topics`; this one is separate and
that package does not touch it.

**2. Two app queries resolve topics by `global_sequence` with no curriculum
filter**, so they can pick up a v1 row if a low gs ever reaches them:

- `C:\Users\profe\dev\ape-studio\src\features\curriculum\curriculumStats.ts` line ~38
- `C:\Users\profe\dev\ape-studio\src\features\dashboard\api.ts` line ~231

Both are fed v3 gs values (3000+) in practice, so neither is a live bug today,
and neither blocks this package. They are worth a `.eq('curriculum_version_id', V3_...)`
the next time either file is open. `GlossaryScreen.tsx` line ~1210 already does
it correctly and is the pattern to copy.
