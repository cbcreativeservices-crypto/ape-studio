-- REMOVE V1 REMNANTS · 90_VERIFY · READ ONLY.
-- Run after each stage; every row for the stages you have run must read PASS.
-- Stages you have not run yet will read "NOT RUN" - that is fine.

SELECT stage, check, result FROM (

-- ------------------------------------------------------------------- STAGE 10
SELECT 10 AS stage, 'bulk_import_glossary resolves by v3 global_sequence' AS check,
  CASE WHEN (SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='bulk_import_glossary')
            ~* 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
       THEN 'PASS' ELSE 'NOT RUN' END AS result
UNION ALL SELECT 10, 'bulk_import_glossary no longer touches courses/course_code',
  CASE WHEN (SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='bulk_import_glossary')
            ~* '\mcourses\M|course_code'
       THEN 'NOT RUN' ELSE 'PASS' END
UNION ALL SELECT 10, 'validate_glossary no longer touches courses',
  CASE WHEN (SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='validate_glossary')
            ~* '\mcourses\M'
       THEN 'NOT RUN' ELSE 'PASS' END
UNION ALL SELECT 10, 'glossary corpus intact (26847 rows)',
  CASE WHEN (SELECT count(*) FROM public.glossary) = 26847 THEN 'PASS' ELSE 'INVESTIGATE' END
UNION ALL SELECT 10, 'no glossary row lost its achievement tag',
  CASE WHEN (SELECT count(*) FROM public.glossary WHERE achievement_id IS NULL) = 0
       THEN 'PASS' ELSE 'INVESTIGATE - untagged rows exist' END

-- ------------------------------------------------------------------- STAGE 20
UNION ALL SELECT 20, 'seed_commercial_free_topics is v3-scoped',
  CASE WHEN (SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='seed_commercial_free_topics')
            ~* 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
       THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 20, 'register_commercial_user still calls it (untouched)',
  CASE WHEN (SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='register_commercial_user')
            ~* 'seed_commercial_free_topics'
       THEN 'PASS' ELSE 'FAIL - registration path broken' END

-- ------------------------------------------------------------------- STAGE 30
UNION ALL SELECT 30, 'start_quiz_attempt no longer reads public_course*',
  CASE WHEN (SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='start_quiz_attempt') ~* 'public_course'
       THEN 'NOT RUN' ELSE 'PASS' END
UNION ALL SELECT 30, 'submit_quiz no longer reads public_course*',
  CASE WHEN (SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='submit_quiz') ~* 'public_course'
       THEN 'NOT RUN' ELSE 'PASS' END
UNION ALL SELECT 30, 'submit_quiz still calls refresh_student_metrics',
  CASE WHEN (SELECT p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='submit_quiz') ~* 'refresh_student_metrics'
       THEN 'PASS' ELSE 'FAIL' END

-- ------------------------------------------------------------------- STAGE 40
UNION ALL SELECT 40, 'commercial_topic_unlocked dropped',
  CASE WHEN to_regprocedure('public.commercial_topic_unlocked(uuid,uuid,uuid)') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 40, 'recompute_reachability_commercial dropped',
  CASE WHEN to_regprocedure('public.recompute_reachability_commercial(uuid,uuid)') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 40, 'validate_single_primary_home + trigger dropped',
  CASE WHEN to_regprocedure('public.validate_single_primary_home()') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 40, 'pc_read / pct_read dropped',
  CASE WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname IN ('pc_read','pct_read'))
       THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 40, 'recompute_reachability (the NON-commercial one) still present',
  CASE WHEN to_regprocedure('public.recompute_reachability(uuid,uuid,uuid)') IS NOT NULL THEN 'PASS' ELSE 'FAIL - wrong function dropped' END

-- ------------------------------------------------------------------- STAGE 50
UNION ALL SELECT 50, 'glossary.course_id dropped',
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema='public' AND table_name='glossary' AND column_name='course_id')
       THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 50, 'glossary_full_v recreated and readable',
  CASE WHEN to_regclass('public.glossary_full_v') IS NOT NULL THEN 'PASS' ELSE 'FAIL - view missing' END
UNION ALL SELECT 50, 'glossary_full_v no longer exposes course_id',
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema='public' AND table_name='glossary_full_v' AND column_name='course_id')
       THEN 'PASS' ELSE 'NOT RUN' END

-- ------------------------------------------------------------------- STAGE 60
UNION ALL SELECT 60, 'public_course_topics dropped',
  CASE WHEN to_regclass('public.public_course_topics') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 60, 'public_courses dropped',
  CASE WHEN to_regclass('public.public_courses') IS NULL THEN 'PASS' ELSE 'NOT RUN' END

-- ---------------------------------------------------------------- backups alive
UNION ALL SELECT 99, 'all five backup tables retained',
  CASE WHEN to_regclass('public.v1remnants_func_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1remnants_view_backup_20260903') IS NOT NULL
        AND to_regclass('public.glossary_course_id_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1remnants_public_courses_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1remnants_public_course_topics_backup_20260903') IS NOT NULL
       THEN 'PASS' ELSE 'FAIL - a backup is missing' END

-- ---------------------------------------------- things that must NOT have moved
UNION ALL SELECT 99, 'register_commercial_user untouched (present)',
  CASE WHEN to_regprocedure('public.register_commercial_user(text,jsonb)') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 99, 'the 51 legacy achievements rows still present',
  CASE WHEN (SELECT count(*) FROM public.achievements WHERE course_id IS NOT NULL) = 51
       THEN 'PASS'
       WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema='public' AND table_name='achievements' AND column_name='course_id')
       THEN 'N/A - column dropped by the other package'
       ELSE 'FAIL - legacy rows moved' END
UNION ALL SELECT 99, 'achievements total still 468',
  CASE WHEN (SELECT count(*) FROM public.achievements) = 468 THEN 'PASS' ELSE 'INVESTIGATE' END

) v ORDER BY stage, check;
