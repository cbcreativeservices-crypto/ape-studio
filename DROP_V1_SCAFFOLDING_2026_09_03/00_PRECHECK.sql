-- DROP V1 SCAFFOLDING · 00_PRECHECK · READ ONLY. Nothing here writes.
--
-- Proves, against live data, every claim the apply stages rely on. Run it
-- first. If any row says FAIL or INVESTIGATE, stop and read the README /
-- NOTES_BLOCKERS before running anything else.
--
-- This package runs AFTER, and assumes the completed output of:
--   REMOVE_COLLEGE_COURSES_2026_09_03      (all)
--   REMOVE_V1_REMNANTS_2026_09_03          (all 8 stages, esp. 10, 30, 40, 50, 60)
--   CONVERT_RETIRE_V1_TOPICS_2026_09_03    (all)
--   RETIRE_INSTITUTIONAL_PATH_2026_09_03   (stage 10 - the two institutional views)

-- NOTE: `check` is a reserved word in Postgres. It is legal as a column ALIAS
-- but NOT as an unquoted reference, so the outer list and ORDER BY quote it.
SELECT section, "check", result FROM (

-- ============================================================ PREREQUISITE PACKAGES
SELECT 'prereq' AS section, 'REMOVE_V1_REMNANTS stage 10 has run (glossary fns off courses)' AS check,
  CASE WHEN (SELECT bool_and(NOT (p.prosrc ~* '\mcourses\M'))
             FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname IN ('bulk_import_glossary','validate_glossary'))
       THEN 'PASS' ELSE 'FAIL - run REMOVE_V1_REMNANTS stage 10 first' END AS result

UNION ALL SELECT 'prereq', 'REMOVE_V1_REMNANTS stage 30 has run (quiz fns off public_course*)',
  CASE WHEN (SELECT bool_and(NOT (p.prosrc ~* 'public_course'))
             FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname IN ('start_quiz_attempt','submit_quiz'))
       THEN 'PASS' ELSE 'FAIL - run REMOVE_V1_REMNANTS stage 30 first. Stage 10 of THIS package rewrites on top of its output.' END

UNION ALL SELECT 'prereq', 'REMOVE_V1_REMNANTS stage 50 has run (glossary.course_id gone)',
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema='public' AND table_name='glossary' AND column_name='course_id')
       THEN 'PASS' ELSE 'FAIL - glossary_course_id_fkey still points at courses; stage 80 cannot run' END

UNION ALL SELECT 'prereq', 'REMOVE_V1_REMNANTS stage 60 has run (public_course* gone)',
  CASE WHEN to_regclass('public.public_course_topics') IS NULL AND to_regclass('public.public_courses') IS NULL
       THEN 'PASS' ELSE 'INVESTIGATE - public_course* still present (not fatal here, but the order is wrong)' END

UNION ALL SELECT 'prereq', 'RETIRE_INSTITUTIONAL stage 10 has run (v_student_progress gone)',
  CASE WHEN to_regclass('public.v_student_progress') IS NULL
       THEN 'PASS' ELSE 'FAIL - this view reads enrollment + achievements.course_id and IS dependency-checked; stages 50/60 will fail' END

UNION ALL SELECT 'prereq', 'RETIRE_INSTITUTIONAL stage 10 has run (v_section_cohort_stats gone)',
  CASE WHEN to_regclass('public.v_section_cohort_stats') IS NULL
       THEN 'PASS' ELSE 'FAIL - this view reads enrollment + course_sections; stages 60/70 will fail' END

-- ============================================================ THE FIVE TARGETS
UNION ALL SELECT 'targets', 'courses row count',        (SELECT count(*)::text FROM public.courses)
UNION ALL SELECT 'targets', 'enrollment row count',     (SELECT count(*)::text FROM public.enrollment)
UNION ALL SELECT 'targets', 'course_sections row count',(SELECT count(*)::text FROM public.course_sections)
UNION ALL SELECT 'targets', 'session_logs row count',   (SELECT count(*)::text FROM public.session_logs)
UNION ALL SELECT 'targets', 'instructor_sections row count', (SELECT count(*)::text FROM public.instructor_sections)
UNION ALL SELECT 'targets', 'achievements with a non-null course_id', (SELECT count(*)::text FROM public.achievements WHERE course_id IS NOT NULL)

-- ============================================================ DEAD-BRANCH PROOFS
-- Stage 10 replaces four "else" arms (the enrollment lookups) with an explicit
-- retired_content error. Each is reachable ONLY for an achievement that is
-- neither v3 nor v1 AND carries a course_id. That set must be empty.
UNION ALL SELECT 'deadcode', 'no achievement is non-v1, non-v3 AND carries a course_id',
  CASE WHEN (SELECT count(*) FROM public.achievements
             WHERE course_id IS NOT NULL
               AND curriculum_version_id NOT IN ('c689c0c4-1d93-4a92-9159-2af019745c49'::uuid,
                                                 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'::uuid)) = 0
       THEN 'PASS' ELSE 'FAIL - the else arms are NOT dead. DO NOT RUN STAGE 10.' END

-- unlock_after_safety loops over enrollment rows for the achievement's
-- curriculum version. Every enrollment row is v1, and no v3 achievement is a
-- prerequisite, so submit_quiz's call to it is a proven no-op on the live path.
UNION ALL SELECT 'deadcode', 'no v3 achievement is is_prerequisite',
  CASE WHEN (SELECT count(*) FROM public.achievements
             WHERE curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'::uuid
               AND is_prerequisite IS TRUE) = 0
       THEN 'PASS' ELSE 'INVESTIGATE - a v3 prerequisite exists; re-read the unlock_after_safety reasoning' END

UNION ALL SELECT 'deadcode', 'every enrollment row is v1 (so unlock_after_safety finds nothing on v3)',
  CASE WHEN (SELECT count(*) FROM public.enrollment
             WHERE curriculum_version_id IS DISTINCT FROM 'c689c0c4-1d93-4a92-9159-2af019745c49'::uuid) = 0
       THEN 'PASS' ELSE 'INVESTIGATE - a non-v1 enrollment row exists' END

-- submit_quiz's badge write is guarded by achievements.badge_trigger AND
-- badges.curriculum_version_id = the achievement's version. Zero v3 rows carry
-- a badge_trigger and all 4 badges are v1, so it can never fire on v3.
UNION ALL SELECT 'deadcode', 'no v3 achievement carries a badge_trigger',
  CASE WHEN (SELECT count(*) FROM public.achievements
             WHERE badge_trigger IS NOT NULL
               AND curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'::uuid) = 0
       THEN 'PASS' ELSE 'FAIL - stripping the badge write from submit_quiz would change live behaviour' END

UNION ALL SELECT 'deadcode', 'all badges rows are v1',
  CASE WHEN (SELECT count(*) FROM public.badges
             WHERE curriculum_version_id IS DISTINCT FROM 'c689c0c4-1d93-4a92-9159-2af019745c49'::uuid) = 0
       THEN 'PASS' ELSE 'INVESTIGATE - a non-v1 badge exists; stage 30 would delete live content' END

UNION ALL SELECT 'deadcode', 'student_badges is empty (stage 30 destroys no earned record)',
  CASE WHEN (SELECT count(*) FROM public.student_badges) = 0
       THEN 'PASS' ELSE 'STOP - someone has earned a badge; re-read stage 30 before running it' END

-- ============================================================ FUNCTION INVENTORY
-- The true blocker list, derived from pg_proc, not from memory.
UNION ALL SELECT 'functions', 'functions still reading courses/enrollment/course_sections/session_logs/course_id',
  (SELECT string_agg(p.proname, ', ' ORDER BY p.proname)
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
   WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql')
     AND (p.prosrc ~* '\mcourses\M' OR p.prosrc ~* '\menrollment\M' OR p.prosrc ~* '\mcourse_sections\M'
          OR p.prosrc ~* '\msession_logs\M' OR p.prosrc ~* '\mcourse_id\M'))

UNION ALL SELECT 'functions', 'count of the above',
  (SELECT count(*)::text
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
   WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql')
     AND (p.prosrc ~* '\mcourses\M' OR p.prosrc ~* '\menrollment\M' OR p.prosrc ~* '\mcourse_sections\M'
          OR p.prosrc ~* '\msession_logs\M' OR p.prosrc ~* '\mcourse_id\M'))

-- ============================================================ RLS / STRUCTURE
UNION ALL SELECT 'structure', 'policies that depend on is_instructor_for_user (stage 20 drops these)',
  (SELECT string_agg(c.relname||'.'||p.polname, ', ' ORDER BY c.relname, p.polname)
   FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public'
     AND (COALESCE(pg_get_expr(p.polqual,p.polrelid),'') ~* 'is_instructor_for_user'
       OR COALESCE(pg_get_expr(p.polwithcheck,p.polrelid),'') ~* 'is_instructor_for_user'))

UNION ALL SELECT 'structure', 'every table losing an instr_* policy keeps an own_* and an admin_* policy',
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
       THEN 'PASS' ELSE 'FAIL - dropping the instr_* policies would strip a table of all access' END

UNION ALL SELECT 'structure', 'FKs still pointing INTO courses',
  (SELECT string_agg(c.conrelid::regclass::text||'.'||c.conname, ', ' ORDER BY 1)
   FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.courses'::regclass)

UNION ALL SELECT 'structure', 'FKs still pointing INTO course_sections',
  (SELECT COALESCE(string_agg(c.conrelid::regclass::text||'.'||c.conname, ', ' ORDER BY 1), '(none)')
   FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.course_sections'::regclass)

UNION ALL SELECT 'structure', 'trigger trig_seed_first_topic present on enrollment',
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                    WHERE NOT t.tgisinternal AND c.relname='enrollment' AND t.tgname='trig_seed_first_topic')
       THEN 'present - stage 20 drops it' ELSE 'already gone' END

UNION ALL SELECT 'structure', 'views/matviews still reading any of the five targets',
  (SELECT COALESCE(string_agg(DISTINCT dep.relname, ', '), '(none)')
   FROM pg_depend d JOIN pg_rewrite r ON r.oid=d.objid
   JOIN pg_class dep ON dep.oid=r.ev_class
   JOIN pg_class src ON src.oid=d.refobjid JOIN pg_namespace ns ON ns.oid=src.relnamespace
   WHERE ns.nspname='public' AND src.relname IN ('courses','enrollment','course_sections','session_logs')
     AND dep.relname <> src.relname)

-- ============================================================ APP-SIDE BLOCKERS
-- These cannot be checked from SQL. Confirm them by hand - see NOTES_BLOCKERS.
UNION ALL SELECT 'app', 'src/features/dashboard/api.ts still selects achievements.course_id (~line 230/238)',
  'CHECK BY HAND - must ship removed before STAGE 50'
UNION ALL SELECT 'app', 'src/features/profile/api.ts fetchAchievements/fetchGallery embed courses!inner (~line 218/260)',
  'CHECK BY HAND - must ship rewritten before STAGE 50 and STAGE 80'
UNION ALL SELECT 'app', 'src/features/study/timeTrial.ts calls credit_time_trial (~line 337)',
  'LIVE CALLER - credit_time_trial is REWRITTEN by stage 10, never dropped'

) t ORDER BY
  CASE section WHEN 'prereq' THEN 1 WHEN 'targets' THEN 2 WHEN 'deadcode' THEN 3
               WHEN 'functions' THEN 4 WHEN 'structure' THEN 5 ELSE 6 END,
  "check";
