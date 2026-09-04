-- RETIRE INSTITUTIONAL PATH · 90_VERIFY · READ ONLY.

SELECT "check", result FROM (
SELECT 'v_student_progress dropped' AS check,
       CASE WHEN to_regclass('public.v_student_progress') IS NULL THEN 'PASS' ELSE 'NOT RUN' END AS result
UNION ALL SELECT 'v_section_cohort_stats dropped',
       CASE WHEN to_regclass('public.v_section_cohort_stats') IS NULL THEN 'PASS' ELSE 'NOT RUN' END
UNION ALL SELECT 'all 8 backup tables retained',
       CASE WHEN to_regclass('public.inst_func_backup_20260903') IS NOT NULL
             AND to_regclass('public.inst_view_backup_20260903') IS NOT NULL
             AND to_regclass('public.inst_policy_backup_20260903') IS NOT NULL
             AND to_regclass('public.inst_courses_backup_20260903') IS NOT NULL
             AND to_regclass('public.inst_enrollment_backup_20260903') IS NOT NULL
             AND to_regclass('public.inst_course_sections_backup_20260903') IS NOT NULL
             AND to_regclass('public.inst_session_logs_backup_20260903') IS NOT NULL
             AND to_regclass('public.achievements_course_id_backup_20260903') IS NOT NULL
            THEN 'PASS' ELSE 'FAIL - a backup is missing' END
-- Nothing below should have moved. This package does not drop tables.
UNION ALL SELECT 'courses still present (9 rows)',
       CASE WHEN (SELECT count(*) FROM public.courses) = 9 THEN 'PASS' ELSE 'CHANGED' END
UNION ALL SELECT 'enrollment still present (20 rows)',
       CASE WHEN (SELECT count(*) FROM public.enrollment) = 20 THEN 'PASS' ELSE 'CHANGED' END
UNION ALL SELECT 'achievements.course_id still present',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema='public' AND table_name='achievements' AND column_name='course_id')
            THEN 'PASS' ELSE 'CHANGED - column gone' END
UNION ALL SELECT 'register_student untouched',
       CASE WHEN to_regprocedure('public.register_student(text,text)') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'refresh_student_metrics untouched',
       CASE WHEN to_regprocedure('public.refresh_student_metrics(uuid)') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
) v ORDER BY "check";

-- Remaining blockers, live. This list must be EMPTY before any table drop.
SELECT 'REMAINING BLOCKER' AS section, p.proname AS function,
       trim(both ' ' from
            case when p.prosrc ~* '\menrollment\M'      then 'enrollment '      else '' end ||
            case when p.prosrc ~* '\mcourses\M'         then 'courses '         else '' end ||
            case when p.prosrc ~* '\mcourse_sections\M' then 'course_sections ' else '' end ||
            case when p.prosrc ~* '\msession_logs\M'    then 'session_logs '    else '' end ||
            case when p.prosrc ~* '\mcourse_id\M'       then 'course_id'        else '' end) AS reads
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public'
  AND (p.prosrc ~* '\menrollment\M' OR p.prosrc ~* '\mcourses\M'
    OR p.prosrc ~* '\mcourse_sections\M' OR p.prosrc ~* '\msession_logs\M'
    OR p.prosrc ~* '\mcourse_id\M')
ORDER BY p.proname;
