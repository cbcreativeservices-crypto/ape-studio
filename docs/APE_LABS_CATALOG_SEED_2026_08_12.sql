-- ============================================================================
-- APE Studio — labs catalog seed (R6c lab-credit bridge)
-- Owner-ratified 2026-08-12. Area: audio_fundamentals (all 11 fundamentals labs).
--
-- Pairs with the client change that adds a stable `key` to each fundamentals lab
-- in src/screens/lab/labCatalog.ts and calls mark_lab_complete(p_lab_key) when a
-- lab's modules/challenge are cleared.
--
-- Target table (per R6c handoff):
--   labs(key text unique, name text, area text,
--        is_active bool default true, sort_order int default 0)
--
-- KEYS ARE IMMUTABLE once live — never rename/reuse a key (the app reports
-- completion by key, and the server derives the audio_fundamentals requirement
-- from this table). Re-running this file is safe (idempotent upsert): it updates
-- display name / area / sort order / is_active without disturbing anyone's
-- already-recorded student_lab_progress.
--
-- NOTE: Only the 11 audio_fundamentals labs are seeded here. Members-only
-- Training Lab labs do NOT count toward the universal requirement, so they are
-- intentionally omitted (add them later with a non-'audio_fundamentals' area if
-- you want them catalogued).
-- ============================================================================

INSERT INTO labs (key, name, area, sort_order, is_active) VALUES
  ('af_amplitude',        'Understanding Level & Amplitude', 'audio_fundamentals',  10, true),
  ('af_foundations',      'Foundations of Sound',            'audio_fundamentals',  20, true),
  ('af_sound_playground', 'Sound Playground',                'audio_fundamentals',  30, true),
  ('af_mic_principles',   'Microphone Principles',           'audio_fundamentals',  40, true),
  ('af_wave_physics',     'Wave Physics Laboratory',         'audio_fundamentals',  50, true),
  ('af_speaker_coverage', 'Speaker Placement & Coverage',    'audio_fundamentals',  60, true),
  ('af_digital_audio',    'Digital Audio Systems',           'audio_fundamentals',  70, true),
  ('af_visual_analysis',  'Visual Audio Analysis',           'audio_fundamentals',  80, true),
  ('af_signal_chain',     'Signal Chain Builder',            'audio_fundamentals',  90, true),
  ('af_signal_detective', 'Signal Detective',                'audio_fundamentals', 100, true),
  ('af_gain_staging',     'Gain Staging',                    'audio_fundamentals', 110, true)
ON CONFLICT (key) DO UPDATE SET
  name       = EXCLUDED.name,
  area       = EXCLUDED.area,
  sort_order = EXCLUDED.sort_order,
  is_active  = EXCLUDED.is_active;

-- Verify:
--   SELECT key, name, area, sort_order, is_active FROM labs
--   WHERE area = 'audio_fundamentals' ORDER BY sort_order;
-- Expect 11 rows.
