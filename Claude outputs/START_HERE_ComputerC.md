# START HERE — Computer C · TERM DIFFICULTY RE-BALANCE (REPORT ONLY)

You are **Computer C**. **You report only — change nothing, edit no files, write no SQL, touch no database.** You return a judgment file per topic; Computer A QAs it and packages the DB change, Professor Booth applies it.

## The job
Each glossary term, within a topic, is tagged **beginner / intermediate / advanced**. Across the catalog many topics are badly lopsided — nearly every term defaulted to one tier at generation, so a topic ends up "172 intermediate, 1 beginner, 13 advanced" when the terms themselves clearly span all three levels. **Your job is to re-judge each term's honest difficulty**, so a learner meets a real progression instead of a wall of same-level cards.

**29 imbalanced topics · 4,334 terms**, worst-first in `MANIFEST.json`. For **every term**, decide the difficulty it *should* be, from the term + its definition. Re-derive from scratch — treat `current_difficulty` as just the starting label, and change it whenever your honest read differs.

## The three levels — the rubric
Judge difficulty **for an AP&E learner working through this topic**, by what the term demands, not by how the sentence is worded.

- **beginner** — foundational vocabulary a newcomer meets first. Recall / recognition level: "what is X." Everyday shop terms, basic parts, plain definitions, no prerequisite concepts. If someone new to audio could learn it from one sentence, it's beginner.
- **intermediate** — applied working knowledge. "How and why X works, and how to use it." Connects two or more ideas, assumes the beginner vocabulary, is the standard competence of a working professional. Most hands-on technique and gear operation lives here.
- **advanced** — specialist or edge knowledge. Heavy math or a derivation, niche/rare equipment, deep theory, expert trade-off judgment, standards-body detail, or graduate-level material. If it needs prerequisite intermediate knowledge *and* real depth or specialization, it's advanced.

## Distribution — aim for a real spread, but NEVER force a quota
- The goal is that each topic **spans all three tiers with none near-empty** — a learner can start easy and climb. A healthy topic is *roughly* a quarter-to-a-third beginner, ~40–55% intermediate, ~15–35% advanced. **This is guidance, not a target to hit.**
- **The term's true level always wins.** Do **NOT** promote an easy term to advanced, or demote a hard term to beginner, just to even out the numbers. A mis-tagged term is worse than an uneven topic. If a topic is genuinely almost all one level after honest judgment, say so (see "genuinely_skewed" below) rather than inventing a spread.
- Expect big movement in these topics precisely because they were defaulted — most "intermediate" piles hold plenty of true beginners (basic vocab) and some true advanced (the math/edge cases). Move them.

## What you get per term (`items/<topic>.jsonl`, one per line)
```
{ "glossary_id", "term", "topic", "current_difficulty", "definition", "plain_english" }
```
Judge on `term` + `definition` (+ `plain_english`). You do not see quiz questions and do not need them — judge the concept's difficulty, not any question.

## Output — one file per topic, checkpointed
For **each** `items/<name>.jsonl`, write `findings/<same-name>.jsonl`, **one line per term** (every term, changed or not), shape in `RETURN_SCHEMA_EXAMPLE.jsonl`:
```
{ "glossary_id", "term", "current_difficulty", "proposed_difficulty", "changed": true|false, "rationale": "<= ~15 words, why this level" }
```
- `proposed_difficulty` is one of `beginner|intermediate|advanced` — **never null**.
- `rationale` required when `changed:true`; a short phrase is fine when unchanged.
- End each topic file with **one summary line**: `{"_summary": {"topic","n","proposed":{"beg","int","adv"},"genuinely_skewed": true|false, "note"}}` — set `genuinely_skewed:true` only when, after honest judgment, the subject really cannot spread (e.g. an all-specialist topic), with a one-line reason.
- Checkpoint each file as you finish it.

## Posture: honest, per-term, defensible
Read the term and its definition; place it where it truly sits. Re-derive numbers/standards only if a level hinges on it. A topic coming out balanced is the expected, good result — but only if each term earns its label.

## Execution
- Work files in `MANIFEST.json` order (most-lopsided first).
- Split among **≤20 concurrent direct-write subagents by file** (NOT a Workflow / committee fan-out). Strong reasoning model.
- **If your budget runs low, STOP at a file boundary** and name the last file completed — files are priority-ordered.

## Hand back
Zip the `findings/` folder to Professor Booth + a short summary: total terms, how many changed, the new per-topic beg/int/adv shape, and any topics you marked `genuinely_skewed`. **You apply nothing.**

## Note for Computer A (not C's concern)
Difficulty is coupled to question coverage: intermediate/advanced terms are meant to carry ~5 questions; beginner terms are flashcard-only. A re-tag can create (a) newly int/adv terms with no questions yet (coverage gap) and (b) newly beginner terms that still carry questions. Neither breaks serving (start_quiz_attempt reads difficulty as a soft priority over question-bearing terms; the graded trigger only needs difficulty non-null), but A must reconcile coverage after applying — compute both cascades and hand Booth the authoring/retirement follow-up. Do NOT ask C to consider questions.

**Counts:** 29 topics · 4,334 terms · most-lopsided first · report-only.
