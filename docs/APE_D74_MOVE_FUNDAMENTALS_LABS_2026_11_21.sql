-- AP&E Studio [MD:D74], owner 2026-11-21: Audio Fundamentals holds only what EVERY student needs.
-- Generated from src/data/labRequirements.ts (commit after 9332ca7e). Run in ONE transaction, as written.
-- 42 requirement rows: af_speaker_coverage 13, af_cable_install 13, af_patchbay 7, tr_room_design 9.
--
-- WHAT IT DOES
--   1. Moves 3 labs rows from area audio_fundamentals to training. KEYS UNCHANGED (student progress is keyed
--      by them). trg_labs_recompute_af re-checks every learner; since 2026-09-22 the credit can only be
--      PROMOTED, so anyone who has the 12 remaining Fundamentals labs gets gs3081 now, and nobody loses it.
--   2. Requires the moved labs (and Room Design) only on the credentials whose job uses them (upsert; the 5
--      tr_room_design rows from 2026-11-19 are already live and are rewritten with the same text).
--   It does NOT delete any other requirement row.
-- ORDER: run BEFORE (or together with) the OTA that moves the labs in the app. Safe for the current app too:
--   it already reports these af_ keys, and treats Fundamentals as the labs listed in its own catalog.
BEGIN;

-- 0. Refuse unless the three rows are exactly where we expect them.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM labs WHERE key IN ('af_speaker_coverage', 'af_cable_install', 'af_patchbay') AND area = 'audio_fundamentals';
  IF n <> 3 THEN RAISE EXCEPTION 'D74: expected 3 audio_fundamentals rows to move, found %', n; END IF;
END $$;

-- 1. Move the three labs to Training (fires the promote-only Fundamentals recompute once).
UPDATE labs SET area = 'training' WHERE key IN ('af_speaker_coverage', 'af_cable_install', 'af_patchbay') AND area = 'audio_fundamentals';

-- 2. Stage the requirements.
CREATE TEMP TABLE _d74_stage (credential_type text, slug text, lab_key text, why text) ON COMMIT DROP;
INSERT INTO _d74_stage (credential_type, slug, lab_key, why) VALUES
  ('certificate', 'cert-analog-console-recording-v3', 'af_patchbay', 'In an analog room the outboard gear is reached through the patchbay, so every insert and every overpatch goes through it.'),
  ('certificate', 'cert-av-over-ip-systems-v3', 'af_speaker_coverage', 'Installed AV systems are designed so every listener in the room sits inside a speaker’s coverage.'),
  ('certificate', 'cert-av-over-ip-systems-v3', 'af_cable_install', 'Network and speaker cable in an install runs through walls, ceilings and racks, and has to be routed, separated and labeled.'),
  ('certificate', 'cert-broadcast-engineer-v3', 'af_cable_install', 'A broadcast plant is racks and long cable runs that have to stay labeled, protected and serviceable while the station stays on air.'),
  ('certificate', 'cert-broadcast-engineer-v3', 'af_patchbay', 'Broadcast signals are rerouted at the patchbay, and a wrong patch on a normalled point can take a feed off air.'),
  ('certificate', 'cert-car-audio-installation-v3', 'af_cable_install', 'A vehicle install depends on routing power cable away from signal cable and protecting every run where it passes bare metal.'),
  ('certificate', 'cert-consumer-and-home-audio-v3', 'tr_room_design', 'Speakers in a living room are heard through the room, so where they sit matters as much as which they are.'),
  ('certificate', 'cert-corporate-and-event-production-v3', 'af_speaker_coverage', 'An event system has to reach every seat in the room, and that is decided by where each speaker sits and points.'),
  ('certificate', 'cert-corporate-and-event-production-v3', 'af_cable_install', 'Event cable crosses floors the public walks on, so it has to be routed and covered so that nobody trips.'),
  ('certificate', 'cert-distributed-and-paging-systems-v3', 'af_speaker_coverage', 'A paging system is many speakers spaced so every part of the building is covered, with no dead spots between them.'),
  ('certificate', 'cert-home-studio-starter-v3', 'tr_room_design', 'A home studio’s monitors and listening spot are only as good as the room around them.'),
  ('certificate', 'cert-home-theater-design-v3', 'tr_room_design', 'Seats and speakers in a home theater are placed around the room’s modes and reflections.'),
  ('certificate', 'cert-how-sound-behaves-in-a-room-v3', 'tr_room_design', 'This lab shows a room’s modes and reflections change as you move the speakers and the listener.'),
  ('certificate', 'cert-live-sound-system-engineer-v3', 'af_speaker_coverage', 'Deciding where the speakers hang, how high and how far they tilt is how the whole audience hears the same show.'),
  ('certificate', 'cert-live-sound-system-engineer-v3', 'af_cable_install', 'Snakes, splits and speaker runs have to be laid so they are safe to walk past and quick to pack away.'),
  ('certificate', 'cert-pa-loudspeaker-systems-v3', 'af_speaker_coverage', 'A PA is aimed so every seat sits in a speaker’s beam, and this lab shows who it reaches and who it misses.'),
  ('certificate', 'cert-room-acoustics-and-treatment-v3', 'tr_room_design', 'Treatment is placed where the modes and first reflections are, and this lab maps them in a room you draw.'),
  ('certificate', 'cert-stage-patch-and-signal-distribution-v3', 'af_cable_install', 'Looms on a stage have to be run, protected and labeled so a fault can be traced in minutes during a show.'),
  ('certificate', 'cert-stage-patch-and-signal-distribution-v3', 'af_patchbay', 'A normalled patch point changes what is connected the moment a cable goes in, so you have to know what a patch will break.'),
  ('certificate', 'cert-studio-recording-engineer-v3', 'af_patchbay', 'Most studios route their gear through a patchbay, and a patch you did not predict can cut a signal in the middle of a take.'),
  ('certificate', 'cert-studio-wiring-and-infrastructure-v3', 'af_cable_install', 'Studio wiring is routing, supporting, dressing and labeling cable so the next technician can find and fix any run.'),
  ('certificate', 'cert-studio-wiring-and-infrastructure-v3', 'af_patchbay', 'Wiring a patchbay means choosing which points are normalled, half-normalled or thru, and that choice decides how the studio works.'),
  ('certificate', 'cert-system-tuning-and-alignment-v3', 'af_speaker_coverage', 'Tuning cannot fix a seat that no speaker reaches, so coverage, fills and delays come before any EQ.'),
  ('certificate', 'cert-touring-and-road-crew-v3', 'af_cable_install', 'Running, covering and coiling cable at every load-in is daily crew work, and a badly coiled cable costs the next show time.'),
  ('program', 'prog-acoustics-and-psychoacoustics-research-v3', 'tr_room_design', 'Room treatment and studio design are named topics here, and this lab maps where the modes and reflections fall in a room you draw.'),
  ('program', 'prog-audio-acoustics-and-system-optimization-v3', 'af_speaker_coverage', 'Even coverage starts with where the speakers sit and aim, before any measurement or tuning.'),
  ('program', 'prog-audio-acoustics-and-system-optimization-v3', 'tr_room_design', 'Treating a room starts with knowing where its modes and first reflections land at the listening seat.'),
  ('program', 'prog-audio-networking-and-infrastructure-v3', 'af_cable_install', 'A network is only as reliable as its cabling, so every run is routed, supported, kept clear of power and labeled.'),
  ('program', 'prog-audio-networking-and-infrastructure-v3', 'af_patchbay', 'Patchbays are still where racks and rooms meet, and how each point is normalled has to be designed and written down.'),
  ('program', 'prog-audio-systems-engineering-v3', 'af_speaker_coverage', 'Designing a system means choosing where each speaker goes so its pattern covers the listeners and not the walls.'),
  ('program', 'prog-commercial-audio-and-av-systems-v3', 'af_speaker_coverage', 'An install is laid out so every listener sits inside a speaker’s coverage, with fills where the main speakers cannot reach.'),
  ('program', 'prog-commercial-audio-and-av-systems-v3', 'af_cable_install', 'An install puts cable in walls, ceilings and racks that has to pass inspection and stay serviceable for years.'),
  ('program', 'prog-concert-and-festival-production-v3', 'af_speaker_coverage', 'A festival crowd is covered by aiming, hanging and tilting the PA, with delay speakers for the people far back.'),
  ('program', 'prog-concert-and-festival-production-v3', 'af_cable_install', 'A festival site is cable across stages and crowds, run to be safe, protected from traffic and quick to change over.'),
  ('program', 'prog-dj-and-club-audio-v3', 'af_speaker_coverage', 'Even sound across the dance floor comes from where the club’s speakers sit and point, not from the DJ’s EQ.'),
  ('program', 'prog-live-sound-engineering-v3', 'af_speaker_coverage', 'Where the speakers sit and point decides who hears the show clearly, before a single fader moves.'),
  ('program', 'prog-live-sound-engineering-v3', 'af_cable_install', 'Every show starts with cable run safely across a stage and a floor, and ends with it coiled so it lays out straight next time.'),
  ('program', 'prog-studio-recording-engineering-v3', 'af_patchbay', 'The console and the outboard gear meet at the patchbay, and patching without breaking the normal signal path is daily studio work.'),
  ('program', 'prog-studio-recording-engineering-v3', 'tr_room_design', 'A control room can only be trusted once its speakers, listening seat and treatment are placed around the room’s modes and reflections.'),
  ('program', 'prog-theater-venue-and-entertainment-audio-v3', 'af_speaker_coverage', 'A venue system has to reach every seat, from the front row to the balcony, and that starts with where the speakers point.'),
  ('program', 'prog-vehicle-and-consumer-audio-systems-v3', 'af_cable_install', 'Car and home installs are judged on cable routed out of harm’s way, kept apart from power and finished so it can be serviced.'),
  ('program', 'prog-vehicle-and-consumer-audio-systems-v3', 'tr_room_design', 'Home hi-fi is heard through the room, so where the speakers and the listener sit decides what the system can do.');

-- 3. Refuse to half-apply: every slug and key must resolve.
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(DISTINCT s.credential_type || ':' || s.slug, ', ') INTO missing
  FROM _d74_stage s
  LEFT JOIN certificates c ON s.credential_type = 'certificate' AND c.slug = s.slug
  LEFT JOIN programs p ON s.credential_type = 'program' AND p.slug = s.slug
  WHERE coalesce(c.id, p.id) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'D74: unknown credential slug(s): %', missing; END IF;
  SELECT string_agg(DISTINCT s.lab_key, ', ') INTO missing FROM _d74_stage s LEFT JOIN labs l ON l.key = s.lab_key WHERE l.id IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'D74: unknown lab key(s): %', missing; END IF;
END $$;

-- 4. Upsert.
INSERT INTO credential_lab_requirements (credential_type, credential_id, lab_id, why)
SELECT s.credential_type, coalesce(c.id, p.id), l.id, s.why
FROM _d74_stage s
LEFT JOIN certificates c ON s.credential_type = 'certificate' AND c.slug = s.slug
LEFT JOIN programs p ON s.credential_type = 'program' AND p.slug = s.slug
JOIN labs l ON l.key = s.lab_key
ON CONFLICT (credential_type, credential_id, lab_id) DO UPDATE SET why = EXCLUDED.why;

COMMIT;

-- 5. CHECK (read-only), expected:
--   area: 12 audio_fundamentals rows; af_speaker_coverage, af_cable_install, af_patchbay = training
--   requirement rows: af_speaker_coverage = 13, af_cable_install = 13, af_patchbay = 7, tr_room_design = 9
SELECT key, area FROM labs WHERE area = 'audio_fundamentals' OR key IN ('af_speaker_coverage', 'af_cable_install', 'af_patchbay', 'tr_room_design') ORDER BY area, key;
SELECT l.key, count(*) FROM credential_lab_requirements r JOIN labs l ON l.id = r.lab_id WHERE l.key IN ('af_speaker_coverage', 'af_cable_install', 'af_patchbay', 'tr_room_design') GROUP BY l.key ORDER BY l.key;
