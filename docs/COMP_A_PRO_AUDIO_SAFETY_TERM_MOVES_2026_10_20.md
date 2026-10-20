# Comp A: move 111 specialist terms out of Pro Audio Safety (2026-10-20)

**Draft, not applied:** `supabase/migrations/2026102001_pro_audio_safety_term_moves.sql`. Apply it only after you have checked it. The owner approved every move.

## Why
Pro Audio Safety (global_sequence 3060) is free and every learner meets it. It had 233 terms, many of them for electricians, safety officers or audiologists. The owner wants it to hold the safety everyone in audio needs. The specialist terms move to the topic where they apply.

## Owner decisions (2026-10-20)
1. The keep/move split: **approved** (122 stay, 111 move).
2. Every destination topic: **approved**.
3. Near-duplicate terms: **do NOT merge**. Both terms of each pair stay as they are.
4. Free users no longer seeing the moved terms in full: **accepted**. `glossary_study_v` opens full text only for 3060 and 3970, so moved terms become members-only.

Review page with every term and the reason for each group: https://claude.ai/artifact/JUfie28uWSPhte9L53ziZu

## What the migration does (one transaction)
For each of the 111 terms (listed by name and destination topic name in the file):
- `glossary_topics`: its single row's `achievement_id` changes from Pro Audio Safety to the destination.
- `glossary.achievement_id`: same change.
- `quiz_questions.achievement_id`: same change for its questions, both graded quiz and scenario. That is **559 questions**: 109 terms × 5 plus 2 terms × 7.
- `term_reassignment_log`: one row per term, `status = 'applied'`. The table was empty before.

Nothing is deleted. Definitions, question text and difficulty are unchanged.

## Checked read-only before writing it (2026-10-20)
- Each of the 111 terms has exactly one `glossary_topics` row, and it points at Pro Audio Safety (`32129be7-4248-5c40-9d69-207b9c89878c`).
- No destination topic already has a term of the same name.
- The file's pre-flight lookup resolves exactly **111 distinct terms**, each with a destination id, and finds **559** questions to move.
- Destination ids are chosen as the achievement row of that name holding the most primary terms, because some names have duplicate rows.
- **Duplicate Pro Audio Safety rows:**
  - `eebac0e9-…` holds 50 graded-quiz questions and no terms. The question update covers it as well.
  - `e5451add-…` holds nothing.
  - Neither row is removed here.
- 8 questions on the Pro Audio Safety ids belong to terms that are not in Pro Audio Safety. This migration doesn't touch them. Worth a look separately.

## Built-in safety
- **Pre-flight:** the migration raises an exception, so nothing changes, unless:
  - exactly 111 distinct terms resolve, each with a destination;
  - none of them is already linked to its destination.
- **VERIFY**, run inside the transaction. Roll back if any number is off:
  - `pas_terms_122` should be 122 (the terms left in Pro Audio Safety);
  - `pas_questions_675` should be 675 (1,234 − 559);
  - `log_rows_111` should be 111.

## Please check after applying
- Anything cached per topic: term counts such as `glossary_stats` and per-topic totals behind the meters. Recompute them if they are stored rather than computed live.
- Certificate or exam rules that count Pro Audio Safety terms or questions.
- Learners' progress on the moved terms (reads, mastery). Is it keyed by term (follows the term) or by topic (stays on Pro Audio Safety)? Tell ccode either way.

## App side
No code change is needed. The app reads topics and terms from the database. Two code comments name moved terms ("Occlusion effect", "Noise susceptibility" in `src/features/study/scenarioHomework.ts`); they describe a past finding and need no change.

## Second draft: worldwide emergency wording (owner: "yes comp a", 2026-10-20)
`supabase/migrations/2026102002_glossary_call_emergency_services.sql`, independent of the first draft. "Call 911" becomes **"Call Emergency Services"**. Its definition and plain English name 911 (US and Canada), 112 (European Union) and 999 (UK). It is keyed on the row id plus the current text, so it changes nothing if the row was edited since. Its VERIFY should show `renamed_1` = 1 and `old_name_0` = 0. Quiz question text is not changed: questions that say "911" are still correct for the US.

"OSHA" and "Permissible Exposure Limit" already say they are US rules, so they need no change.

**Tell ccode when each is applied**, with its VERIFY numbers.
