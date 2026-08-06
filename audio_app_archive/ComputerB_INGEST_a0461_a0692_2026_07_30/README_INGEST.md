# Ingest — Machine B delivery a0461–a0692 (2026-07-30)

Committee-reviewed + corrected Phase-2 backlog. **1,808 existing rows updated** (196 FLAG-FOR-REVIEW excluded — not in payload). Validated by Machine A before build: **1,808/1,808 ids exist, 1,808/1,808 terms match; 0 placeholders, 0 empty fields, all list fields are arrays.**

## What gets written
Keyed UPDATE by `id` (idempotent). Writes the 8 content fields only: definition, plain_english, purpose_function, practical_application, category, related_terms[], common_mistakes[], scenario_contexts[]. `difficulty` is NOT written (structural — see the delivery's BOOTH_difficulty report; 1,475 recs). Legal-citation/mark flags (327) are a separate post-review symbol pass — not applied here.

## Run order in the Supabase SQL editor
1. `APPLY_00_BACKUP.sql`  (snapshots the 1,808 rows to `glossary_backup_a0461_a0692_20260730`)
2. `APPLY_01.sql` … `APPLY_06.sql`  (order between them doesn't matter — keyed + idempotent)
3. `VERIFY.sql`  → expect **total = 1808, exact_match = 1808, mismatches = 0**

If VERIFY shows any mismatch, tell me which and I'll regenerate only the affected APPLY file.

## Notes
- Two rows share the term "Outfill" (distinct ids) — expected; UPDATE is by id so both are handled.
- Apply the difficulty report (beginner 734 / intermediate 680 / advanced 61) at DB level separately when you're ready.
