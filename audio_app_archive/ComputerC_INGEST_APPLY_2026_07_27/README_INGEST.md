# Computer C ingest — paste into Supabase SQL editor

**1,293 new glossary terms** (1,292 from Computer C's gate-passed corpus + 1 Machine-A addendum: "Lin/Log"). The 20 FLAG-FOR-REVIEW terms are intentionally **held out** pending Booth's ruling.

## Run order
1. Paste and run **APPLY_01.sql … APPLY_08.sql** (order doesn't matter; each is idempotent, `ON CONFLICT (id) DO NOTHING`, safe to re-run).
2. Paste and run **VERIFY.sql** → expect **inserted_glossary = 1293** and **primary_topics = 1293**. `equation_rows` = 196.
3. If anything looks wrong, **ROLLBACK.sql** removes exactly this batch (its glossary_topics then glossary rows).

Each APPLY file inserts the glossary row (all 8 content fields + difficulty + formula_symbolic/formula_words for equations) and its glossary_topics links (one primary + any cross-list), keyed by the term's stable id.

## Still needs a Booth ruling (NOT in this batch)
- 20 FLAG-FOR-REVIEW terms (trade slang / low-source names) — see the bundle's `FLAGGED_FOR_REVERIFY.txt`.
- 4 difficulty re-tags (EXTRA BASS, MEGA BASS, ULT Power Sound → intermediate; Phase Tracking → advanced).
- 9 accepted readability exceptions (proper-noun headwords).
