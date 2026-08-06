# Restructure Phase 0 - Backups & Baseline (2026-08-03)

## Backups created (in Supabase, project yjgolswjggmlpeowvtxr)
- _backup_restructure_20260803_achievements  = 241 rows (draft cv 51c1d5db topics)
- _backup_restructure_20260803_glossary       = 22,656 rows (full glossary)
- _backup_restructure_20260803_glossary_topics = 32,692 rows (all topic links)

## Baseline integrity snapshot (targets to re-verify after each phase)
- glossary_total .............. 22,656   (MUST stay constant through the whole restructure)
- terms_without_primary ....... 0        (must remain 0)
- multi_primary_terms ......... 0        (must remain 0)
- draft_topics (cv 51c1d5db) .. 241      (-> becomes 172 active after cutover; old ones deactivated)
- draft_active ................ 0        (draft topics staged inactive)
- max_global_sequence ......... 2410     (Phase 1 mints new topics at gs >= 3000 to avoid collision)

## Rollback
Any later phase can be reverted by restoring rows from the three _backup_restructure_20260803_* tables.
Old topics are only deactivated (is_active=false), never deleted, until backups are pruned post-cutover.

Status: PHASE 0 DONE. Awaiting the 4 gating decisions before Phase 1 (create 172 topics).
