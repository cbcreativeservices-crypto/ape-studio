-- ============================================================================
-- APE Studio — Cable & Connector Fundamentals lab seed (af_cables)
-- Owner-ratified 2026-08-15: FULL CERTIFICATE CREDIT AT LAUNCH — this lab
-- becomes the 12th REQUIRED lab in the audio_fundamentals area (gs3081
-- universal credit). Successor row to APE_LABS_CATALOG_SEED_2026_08_12.sql;
-- same table, same idempotent-upsert shape.
--
-- ⚠ RUN AT LAUNCH of the lab, not before (owner decision 2026-08-15):
--   • Once seeded with area='audio_fundamentals', the server requires this lab
--     for the gs3081 "Audio Fundamentals Lab" credit — users who completed the
--     previous 11 labs will need this lab too. The owner accepted this raised
--     bar (ruling 2026-08-15).
--   • Until seeded, the client degrades gracefully: local checkmark works,
--     mark_lab_complete returns lab_not_found and quietly retries.
--
-- KEY IS IMMUTABLE once live: 'af_cables' — never rename/reuse (matches the
-- LabKey union in src/features/lab/labCompletion.ts and the leaf key in
-- src/screens/lab/labCatalog.ts).
--
-- sort_order 105 places it between Signal Detective (100) and Gain Staging
-- (110) — the catalog's on-screen position (after signal-flow labs, before
-- gain staging).
-- ============================================================================

INSERT INTO labs (key, name, area, sort_order, is_active) VALUES
  ('af_cables', 'Cable & Connector Fundamentals', 'audio_fundamentals', 105, true)
ON CONFLICT (key) DO UPDATE SET
  name       = EXCLUDED.name,
  area       = EXCLUDED.area,
  sort_order = EXCLUDED.sort_order,
  is_active  = EXCLUDED.is_active;

-- Verify:
--   SELECT key, name, area, sort_order, is_active FROM labs
--   WHERE area = 'audio_fundamentals' ORDER BY sort_order;
-- Expect 12 rows, with af_cables at sort_order 105.
