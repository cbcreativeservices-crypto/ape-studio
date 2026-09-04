-- DROP V1 SCAFFOLDING · 90_VERIFY · READ ONLY.
-- Run after each stage. Every row for a stage you have run must read PASS.
-- Stages you have not run yet read "NOT RUN" - that is fine.
-- Anything reading FAIL or INVESTIGATE means stop.

-- NOTE: `check` is a reserved word in Postgres. It is legal as a column ALIAS
-- but NOT as an unquoted reference, so the outer list and ORDER BY quote it.
SELECT stage, "check", result FROM (

-- ------------------------------------------------------------------- STAGE 05
SELECT 5 AS stage, 'all 12 function sources captured' AS check,
  CASE WHEN to_regclass('public.v1scaffold_func_backup_20260903') IS NULL THEN 'NOT RUN'
       WHEN (SELECT count(*) FROM public.v1scaffold_func_backup_20260903) >= 12 THEN 'PASS'
       ELSE 'FAIL - incomplete backup' END AS result
UNION ALL SELECT 5, 'table + column + badge backups present',
  CASE WHEN to_regclass('public.v1scaffold_courses_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1scaffold_enrollment_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1scaffold_course_sections_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1scaffold_session_logs_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1scaffold_instructor_sections_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1scaffold_ach_course_id_backup_20260903') IS NOT NULL
        AND to_regclass('public.v1scaffold_badges_backup_20260903') IS NOT NULL
       THEN 'PASS' ELSE 'NOT RUN' END

-- ------------------------------------------------------------------- STAGE 10
UNION ALL SELECT 10, 'refresh_student_metrics is off the legacy session table',
  CASE WHEN (SELECT regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='refresh_student_metrics') ~* '\msession_logs\M'
       THEN 'NOT RUN' ELSE 'PASS' END
UNION ALL SELECT 10, 'refresh_student_metrics still EXISTS (submit_quiz calls it every submission)',
  CASE WHEN to_regprocedure('public.refresh_student_metrics(uuid)') IS NOT NULL THEN 'PASS'
       ELSE 'FAIL - the quiz hot path is broken' END
UNION ALL SELECT 10, 'delete_my_account still EXISTS',
  CASE WHEN to_regprocedure('public.delete_my_account()') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 10, 'delete_my_account touches none of the dropped tables',
  CASE WHEN (SELECT regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='delete_my_account')
            ~* '\menrollment\M|\msession_logs\M|\minstructor_sections\M'
       THEN 'NOT RUN' ELSE 'PASS' END
UNION ALL SELECT 10, 'credit_time_trial still EXISTS (timeTrial.ts calls it live)',
  CASE WHEN to_regprocedure('public.credit_time_trial(uuid,text)') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 10, 'credit_time_trial has a v3 arm (the bug fix landed)',
  CASE WHEN (SELECT regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='credit_time_trial')
            ~* 'user_topic_enrollments' THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 10, 'none of the seven rewritten functions references a target object',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                    WHERE n.nspname='public'
                      AND p.proname IN ('refresh_student_metrics','delete_my_account','record_study_progress',
                                        'credit_time_trial','start_quiz_attempt','submit_quiz','lookup_student_by_qr')
                      AND regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourses\M|\menrollment\M|\mcourse_sections\M|\msession_logs\M|\mcourse_id\M|is_instructor_for_user')
       THEN 'NOT RUN' ELSE 'PASS' END
UNION ALL SELECT 10, 'submit_quiz payload still carries badge_earned + next_topic (app compatibility)',
  CASE WHEN (SELECT regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='submit_quiz')
            ~* 'badge_earned' AND
       (SELECT regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='submit_quiz') ~* 'next_topic'
       THEN 'PASS' ELSE 'FAIL - payload shape changed, src/features/quiz/api.ts expects both keys' END

-- ------------------------------------------------------------------- STAGE 20
UNION ALL SELECT 20, 'register_student dropped',
  CASE WHEN to_regprocedure('public.register_student(text,text)') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 20, 'unlock_after_safety dropped',
  CASE WHEN to_regprocedure('public.unlock_after_safety(uuid,uuid)') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 20, 'recompute_reachability dropped',
  CASE WHEN to_regprocedure('public.recompute_reachability(uuid,uuid,uuid)') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 20, 'is_instructor_for_user dropped',
  CASE WHEN to_regprocedure('public.is_instructor_for_user(uuid)') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 20, 'seed_first_topic_on_enrollment dropped',
  CASE WHEN to_regprocedure('public.seed_first_topic_on_enrollment()') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 20, 'no policy anywhere references is_instructor_for_user',
  CASE WHEN EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
                    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
                      AND (COALESCE(pg_get_expr(p.polqual,p.polrelid),'') ~* 'is_instructor_for_user'
                        OR COALESCE(pg_get_expr(p.polwithcheck,p.polrelid),'') ~* 'is_instructor_for_user'))
       THEN 'NOT RUN' ELSE 'PASS' END
UNION ALL SELECT 20, 'learners keep their own_* access on every table that lost an instr_* policy',
  CASE WHEN (SELECT bool_and(has_own AND has_admin) FROM (
              SELECT c.relname,
                     bool_or(p.polname LIKE 'own\_%')   AS has_own,
                     bool_or(p.polname LIKE 'admin\_%') AS has_admin
              FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              JOIN pg_policy p ON p.polrelid=c.oid
              WHERE n.nspname='public'
                AND c.relname IN ('performance_metrics','quiz_attempts','student_achievement_progress',
                                  'student_method_progress','student_badges')
              GROUP BY c.relname) s)
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 20, 'register_commercial_user (the LIVE signup path) is untouched',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                    WHERE n.nspname='public' AND p.proname='register_commercial_user')
       THEN 'PASS' ELSE 'FAIL - the only live registration path is gone' END

-- ------------------------------------------------------------------- STAGE 30
UNION ALL SELECT 30, 'badges rows cleared (OPTIONAL stage)',
  CASE WHEN (SELECT count(*) FROM public.badges) = 0 THEN 'PASS (or was already empty)' ELSE 'NOT RUN' END
UNION ALL SELECT 30, 'student_badges still 0 rows - no earned record destroyed',
  CASE WHEN (SELECT count(*) FROM public.student_badges) = 0 THEN 'PASS' ELSE 'INVESTIGATE' END
UNION ALL SELECT 30, 'badges + student_badges TABLES still exist (deliberately kept)',
  CASE WHEN to_regclass('public.badges') IS NOT NULL AND to_regclass('public.student_badges') IS NOT NULL
       THEN 'PASS' ELSE 'FAIL - v_badge_roster / mv_program_kpis / profile api.ts read these' END

-- ------------------------------------------------------------------- STAGE 40
UNION ALL SELECT 40, 'session_logs dropped',
  CASE WHEN to_regclass('public.session_logs') IS NULL THEN 'PASS' ELSE 'NOT RUN' END

-- ------------------------------------------------------------------- STAGE 50
UNION ALL SELECT 50, 'achievements.course_id dropped',
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema='public' AND table_name='achievements' AND column_name='course_id')
       THEN 'PASS' ELSE 'NOT RUN' END

-- ------------------------------------------------------------------- STAGE 60
UNION ALL SELECT 60, 'enrollment dropped',
  CASE WHEN to_regclass('public.enrollment') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 60, 'trig_seed_first_topic gone',
  CASE WHEN NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                        WHERE NOT t.tgisinternal AND t.tgname='trig_seed_first_topic')
       THEN 'PASS' ELSE 'NOT RUN' END

-- ------------------------------------------------------------------- STAGE 70
UNION ALL SELECT 70, 'course_sections dropped',
  CASE WHEN to_regclass('public.course_sections') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 70, 'instructor_sections dropped',
  CASE WHEN to_regclass('public.instructor_sections') IS NULL THEN 'PASS' ELSE 'NOT RUN' END

-- ------------------------------------------------------------------- STAGE 80
UNION ALL SELECT 80, 'courses dropped',
  CASE WHEN to_regclass('public.courses') IS NULL THEN 'PASS' ELSE 'NOT RUN' END

-- ---------------------------------------------------------- CONTENT (every stage)
-- Content is never throwaway, whatever the user data policy is.
UNION ALL SELECT 99, 'CONTENT - glossary rows (expect 26847)',
  CASE WHEN (SELECT count(*) FROM public.glossary) = 26847 THEN 'PASS'
       ELSE 'INVESTIGATE - now ' || (SELECT count(*)::text FROM public.glossary) END
UNION ALL SELECT 99, 'CONTENT - glossary_topics links (expect 1978)',
  CASE WHEN (SELECT count(*) FROM public.glossary_topics) = 1978 THEN 'PASS'
       ELSE 'INVESTIGATE - now ' || (SELECT count(*)::text FROM public.glossary_topics) END
UNION ALL SELECT 99, 'CONTENT - achievements (expect 468)',
  CASE WHEN (SELECT count(*) FROM public.achievements) = 468 THEN 'PASS'
       ELSE 'INVESTIGATE - now ' || (SELECT count(*)::text FROM public.achievements) END
UNION ALL SELECT 99, 'CONTENT - quiz_questions',
  (SELECT count(*)::text FROM public.quiz_questions)
UNION ALL SELECT 99, 'CONTENT - v3 achievements (expect 175)',
  CASE WHEN (SELECT count(*) FROM public.achievements
             WHERE curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'::uuid) = 175
       THEN 'PASS' ELSE 'INVESTIGATE' END

-- ------------------------------------------------------------ RESIDUAL REFERENCES
UNION ALL SELECT 99, 'any function still naming a target object (expect none once 10+20 have run)',
  (SELECT COALESCE(string_agg(p.proname, ', ' ORDER BY p.proname), '(none)')
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
   WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql')
     AND (regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourses\M' OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\menrollment\M' OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_sections\M'
          OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\msession_logs\M' OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_id\M'))

) t ORDER BY stage, "check";
