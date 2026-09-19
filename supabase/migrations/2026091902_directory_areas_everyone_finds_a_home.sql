-- 2026-09-19 · directory areas: everyone finds a home (owner)
--
-- APPLIED TO PRODUCTION 2026-09-19 (mcp apply_migration). 13 areas → 23.
--
-- ── WHY ────────────────────────────────────────────────────────────────────
--
-- Owner: "it should also include users of our diverse audio spectrum not just
-- more mainstream as is currently. we have excluded fields currently. we dont
-- need to be specific, but everyone should find a home."
--
-- Measured rather than guessed: the app SHOWCASES 23 study areas on its own
-- Home carousel (src/data/studyAreaCredentials.ts) and the directory offered
-- 13 places to say you work in. Six areas WE TEACH had nowhere to land:
--
--   Worship Audio            → "Live Sound" is not it, and it is one of the
--                              largest participation communities in audio
--   DJ Production            → "Music Production" is not DJing
--   Theatrical Sound Design  → its own craft, not event production
--   Assisted Listening       → an ACCESSIBILITY field, and it was excluded
--   Road Crew & Touring      → nothing
--   Audio Technician /
--     Career & Business      → nothing
--
-- Three more come from our own credentialCopy.ts, which describes careers in
-- them (audiology assistant, hearing-aid specialist, ultrasonic/underwater)
-- while the directory had no matching home: clinical hearing care, forensic
-- audio, underwater/marine acoustics.
--
-- ── THE LAST ROW IS THE IMPORTANT ONE ──────────────────────────────────────
--
-- "Still exploring — not sure yet", sorted 99 so it never competes with a real
-- answer. Before it, a beginner — the core audience of a TRAINING app — could
-- not answer the first question of the profile honestly. A first question the
-- user cannot answer is where a sign-up stops, and the evidence fits: 9
-- accounts, 0 profiles even STARTED (not 0 completed — 0 started).
--
-- ── SAFETY ─────────────────────────────────────────────────────────────────
--
-- Purely additive, `on conflict do nothing`. No existing slug, label or
-- sort_order is touched, so nothing already selected can move or break.
-- Reversing is a delete of these ten slugs.

insert into public.directory_areas (slug, label, sort_order) values
  ('worship-house-of-worship',      'Worship & House of Worship Audio',              14),
  ('dj-club-nightlife',             'DJ, Club & Nightlife',                          15),
  ('theatre-performing-arts',       'Theatre & Performing Arts Sound',               16),
  ('touring-road-crew-backline',    'Touring, Road Crew & Backline',                 17),
  ('assistive-listening-access',    'Assistive Listening & Audio Accessibility',     18),
  ('audio-tech-business-career',    'Audio Tech Work, Business & Career',            19),
  ('clinical-hearing-care',         'Medical, Clinical & Hearing Care Acoustics',    20),
  ('forensic-audio',                'Forensic Audio & Investigation',                21),
  ('underwater-marine-acoustics',   'Underwater, Marine & Ultrasonic Acoustics',     22),
  ('exploring-not-sure-yet',        'Still exploring — not sure yet',                99)
on conflict (slug) do nothing;
