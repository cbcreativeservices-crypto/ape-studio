-- =====================================================================
-- SCHEMA_v213_VERIFICATION_HARNESS.sql
-- Run AFTER DDL + SEED (on dev branch if usable, else post-PROD-apply with rollback ready).
-- Each block is independent; run one at a time (multi-statement execute_sql returns only
-- the LAST result set — a known project pitfall).
-- Acceptance = every check matches its "EXPECT".
-- =====================================================================

-- H1. Seed counts.  EXPECT: courses=9, topics=54, primary=51, cross=3, free=2
SELECT
  (SELECT count(*) FROM public.public_courses)                                    AS courses,
  (SELECT count(*) FROM public.public_course_topics)                             AS topics,
  (SELECT count(*) FROM public.public_course_topics WHERE placement='primary')   AS primary_rows,
  (SELECT count(*) FROM public.public_course_topics WHERE placement='cross_list')AS cross_rows,
  (SELECT count(*) FROM public.public_course_topics WHERE is_free)               AS free_rows;

-- H2. Single-primary invariant.  EXPECT: dupe_primary=0, achievements_without_primary=0
SELECT
  (SELECT count(*) FROM (
     SELECT achievement_id FROM public.public_course_topics
     WHERE placement='primary' GROUP BY achievement_id HAVING count(*)>1) d)     AS dupe_primary,
  (SELECT count(*) FROM public.achievements a
     WHERE NOT EXISTS (SELECT 1 FROM public.public_course_topics t
                       WHERE t.achievement_id=a.id AND t.placement='primary')) AS achievements_without_primary;

-- H3. Free topics are exactly gs0 + gs36.  EXPECT: two rows, global_sequence {0,36}
SELECT a.global_sequence, a.name
FROM public.public_course_topics t JOIN public.achievements a ON a.id=t.achievement_id
WHERE t.is_free ORDER BY a.global_sequence;

-- H4. Trigger negative test.  EXPECT: ERROR 'already has a primary home' (then ROLLBACK).
--   BEGIN;
--     INSERT INTO public.public_course_topics (public_course_id, achievement_id, placement, seq)
--     SELECT (SELECT id FROM public.public_courses WHERE sort_order=5),
--            (SELECT id FROM public.achievements WHERE global_sequence=1),  -- already primary in course 2
--            'primary', 99;
--   ROLLBACK;

-- H5. Anon column-grant probe.  Run as anon; EXPECT: definition OK, common_mistakes DENIED.
--   Manual (psql / SQL editor):
--     SET LOCAL ROLE anon; SELECT definition       FROM public.glossary LIMIT 1;  -- passes
--     SET LOCAL ROLE anon; SELECT common_mistakes  FROM public.glossary LIMIT 1;  -- permission denied
--   (each in its own transaction; a permission error aborts the current txn)

-- H6. common_mistakes masking via view.
--   Academy/institutional caller -> common_mistakes NON-NULL where source data present.
--   Non-academy caller           -> common_mistakes IS NULL for every row.
--   Verify with test users of each audience; structural check that the column exists:
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='glossary_full_v' AND column_name='common_mistakes';

-- H7. has_academy_access matrix.  EXPECT: institutional=true, commercial-no-ent=false,
--     commercial+active-academy=true, NULL(anon)=false.
--   (Populate a commercial test user + entitlement rows, then:)
-- SELECT public.has_academy_access((SELECT auth_id FROM public.users WHERE audience='institutional' LIMIT 1)) AS inst_true,
--        public.has_academy_access(NULL::uuid) AS anon_false;

-- H8. Additive-only regression: existing RPC signatures UNCHANGED.
--   EXPECT: start_quiz_attempt(p_achievement_id uuid, p_client_attempt_id uuid),
--           submit_quiz(...v8.3...), register_student, verify_registration all present & unchanged.
SELECT p.proname, pg_get_function_arguments(p.oid) AS args
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('start_quiz_attempt','submit_quiz','register_student','verify_registration','record_study_progress')
ORDER BY p.proname;

-- H9. Additive-only table check.  EXPECT: only 3 new base tables vs v2.12 baseline
--     (public_courses, public_course_topics, entitlements); users has new 'audience' col.
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE'
  AND table_name IN ('public_courses','public_course_topics','entitlements')
ORDER BY table_name;
SELECT count(*) AS users_has_audience FROM information_schema.columns
WHERE table_schema='public' AND table_name='users' AND column_name='audience';

-- H10. SECURITY ADVISORS.  Run get_advisors(security) after apply.
--   EXPECT: no new WARN beyond expected anon-read entries. Any other new WARN => STOP.

-- =====================================================================
-- END HARNESS.
-- =====================================================================
