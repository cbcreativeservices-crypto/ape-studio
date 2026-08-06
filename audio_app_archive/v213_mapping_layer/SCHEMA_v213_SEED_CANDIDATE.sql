-- =====================================================================
-- SCHEMA_v213_SEED_CANDIDATE.sql
-- Seed public_courses (9) + public_course_topics (54) from the D-1 placement SSoT.
-- STATUS: CANDIDATE — run AFTER SCHEMA_v213_MAPPING_LAYER_DDL_CANDIDATE.sql.
-- SOURCE: APE_CLAUDE_CODE_COMMERCIAL_KICKOFF_2026_07_11.md §6 (embedded placement SSoT;
--         the standalone D1_PLACEMENT_SSOT_EXPORT_2026_07_11.json is NOT on disk — this
--         embedded copy is used as canonical; confirm with Booth if the JSON differs).
-- gs (global_sequence) is resolved to achievement UUIDs AT RUNTIME — no hardcoded UUIDs.
--
-- SEED INTEGRITY VERIFIED READ-ONLY AGAINST PROD 2026-07-11 (dry run, zero writes):
--   total_rows=54  courses=9  primaries=51  cross_lists=3  free_rows=2
--   unresolved_gs=0  distinct_primary_gs=51  == achievements total (51)  -> clean bijection.
-- Names for courses 3 & 4 use approved academic NAMES (AD-10 exceptions); no course numbers.
-- Free topics (is_free=true): gs0 (Professional Audio Safety) + gs36 (DAW Skills).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Courses (idempotent on slug).
-- ---------------------------------------------------------------------
INSERT INTO public.public_courses (slug, display_name, sort_order)
VALUES
  ('pro-audio-safety',                    'Pro Audio Safety',                     1),
  ('intro-to-audio',                      'Intro to Audio',                       2),
  ('sound-reinforcement-systems',         'Sound Reinforcement Systems',          3),
  ('audio-system-design-and-maintenance', 'Audio System Design and Maintenance',  4),
  ('recording-arts',                      'Recording Arts',                       5),
  ('music-production',                    'Music Production',                     6),
  ('podcasting-and-broadcast',            'Podcasting and Broadcast',             7),
  ('film-and-game',                       'Film and Game',                        8),
  ('career-and-business',                 'Career and Business',                  9)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Stage topic rows (course_sort, seq, gs, placement, is_free), resolve gs -> achievement.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE _stage_pct ON COMMIT DROP AS
WITH topic_seed(course_sort, seq, gs, placement, is_free) AS (VALUES
  -- Course 1: Pro Audio Safety
  (1, 1, 0,'primary',    true),
  -- Course 2: Intro to Audio
  (2, 1, 0,'cross_list', false),(2, 2, 1,'primary',false),(2, 3, 2,'primary',false),
  (2, 4, 3,'primary',false),(2, 5, 4,'primary',false),(2, 6, 5,'primary',false),
  (2, 7, 6,'primary',false),(2, 8, 7,'primary',false),(2, 9, 8,'primary',false),
  (2,10, 9,'primary',false),(2,11,10,'primary',false),
  -- Course 3: Sound Reinforcement Systems
  (3, 1, 0,'cross_list', false),(3, 2,12,'primary',false),(3, 3,13,'primary',false),
  (3, 4,14,'primary',false),(3, 5,15,'primary',false),(3, 6,16,'primary',false),
  (3, 7,17,'primary',false),(3, 8,19,'primary',false),(3, 9,20,'primary',false),
  (3,10,21,'primary',false),(3,11,18,'primary',false),(3,12,22,'primary',false),
  -- Course 4: Audio System Design and Maintenance
  (4, 1, 0,'cross_list', false),(4, 2,28,'primary',false),(4, 3,29,'primary',false),
  (4, 4,23,'primary',false),(4, 5,30,'primary',false),(4, 6,32,'primary',false),
  (4, 7,31,'primary',false),(4, 8,34,'primary',false),(4, 9,33,'primary',false),
  (4,10,35,'primary',false),(4,11,11,'primary',false),
  -- Course 5: Recording Arts
  (5, 1,24,'primary',false),(5, 2,27,'primary',false),(5, 3,43,'primary',false),
  (5, 4,25,'primary',false),(5, 5,26,'primary',false),
  -- Course 6: Music Production
  (6, 1,36,'primary', true),(6, 2,37,'primary',false),(6, 3,38,'primary',false),
  (6, 4,39,'primary',false),(6, 5,40,'primary',false),(6, 6,41,'primary',false),
  -- Course 7: Podcasting and Broadcast
  (7, 1,42,'primary',false),
  -- Course 8: Film and Game
  (8, 1,44,'primary',false),
  -- Course 9: Career and Business
  (9, 1,48,'primary',false),(9, 2,45,'primary',false),(9, 3,50,'primary',false),
  (9, 4,46,'primary',false),(9, 5,47,'primary',false),(9, 6,49,'primary',false)
)
SELECT
  pc.id            AS public_course_id,
  a.id             AS achievement_id,
  ts.placement     AS placement,
  ts.seq           AS seq,
  ts.is_free       AS is_free,
  ts.gs            AS gs
FROM topic_seed ts
JOIN public.public_courses pc ON pc.sort_order = ts.course_sort
JOIN public.achievements   a  ON a.global_sequence = ts.gs;

-- ---------------------------------------------------------------------
-- 3. GATE-VERIFY the staging set BEFORE writing the real table (fail-closed).
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_total int; v_courses int; v_prim int; v_cross int; v_free int;
  v_unresolved int; v_distinct_prim int; v_dupe_prim int;
BEGIN
  SELECT count(*), count(distinct public_course_id),
         count(*) FILTER (WHERE placement='primary'),
         count(*) FILTER (WHERE placement='cross_list'),
         count(*) FILTER (WHERE is_free)
    INTO v_total, v_courses, v_prim, v_cross, v_free
  FROM _stage_pct;

  SELECT count(*) INTO v_unresolved FROM _stage_pct WHERE achievement_id IS NULL;
  SELECT count(distinct achievement_id) INTO v_distinct_prim FROM _stage_pct WHERE placement='primary';
  SELECT count(*) INTO v_dupe_prim FROM (
    SELECT achievement_id FROM _stage_pct WHERE placement='primary'
    GROUP BY achievement_id HAVING count(*) > 1
  ) d;

  IF v_total <> 54 OR v_courses <> 9 OR v_prim <> 51 OR v_cross <> 3
     OR v_free <> 2 OR v_unresolved <> 0 OR v_distinct_prim <> 51 OR v_dupe_prim <> 0 THEN
    RAISE EXCEPTION 'SEED GATE FAILED: total=% courses=% prim=% cross=% free=% unresolved=% distinct_prim=% dupe_prim=%',
      v_total, v_courses, v_prim, v_cross, v_free, v_unresolved, v_distinct_prim, v_dupe_prim;
  END IF;

  RAISE NOTICE 'SEED GATE PASSED: 54 rows / 9 courses / 51 primary / 3 cross / 2 free / 0 unresolved / 0 dupe-primary.';
END $$;

-- ---------------------------------------------------------------------
-- 4. Atomic insert into the real table (trigger validates single-primary per row).
-- ---------------------------------------------------------------------
INSERT INTO public.public_course_topics (public_course_id, achievement_id, placement, seq, is_free)
SELECT public_course_id, achievement_id, placement, seq, is_free
FROM _stage_pct;

-- _stage_pct dropped automatically ON COMMIT.

-- =====================================================================
-- END SEED. Run SCHEMA_v213_VERIFICATION_HARNESS.sql to confirm post-write.
-- =====================================================================
