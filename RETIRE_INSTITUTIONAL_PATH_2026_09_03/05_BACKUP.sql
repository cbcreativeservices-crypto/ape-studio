-- RETIRE INSTITUTIONAL PATH · 05_BACKUP
-- Captures everything the (future) drops would destroy, so the decision work in
-- NOTES_BLOCKERS.md can be done against a safe copy:
--   * verbatim source of all 11 functions that read these objects
--   * verbatim definition of the 3 views that read them
--   * full contents of courses / enrollment / course_sections / session_logs
--   * achievements.course_id values (the 51 v1 rows)
--   * the RLS policy definitions on those four tables
-- Safe to re-run: refuses to clobber an existing backup.

DO $$
BEGIN
  ---------------------------------------------------------------- function source
  IF to_regclass('public.inst_func_backup_20260903') IS NULL THEN
    CREATE TABLE public.inst_func_backup_20260903 (
      proname text, identity text, def text, taken_at timestamptz NOT NULL DEFAULT now());
    INSERT INTO public.inst_func_backup_20260903 (proname, identity, def)
    SELECT p.proname,
           p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
           pg_get_functiondef(p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\menrollment\M' OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourses\M'
        OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_sections\M' OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\msession_logs\M'
        OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_id\M');
    RAISE NOTICE 'backed up % function definitions', (SELECT count(*) FROM public.inst_func_backup_20260903);
  ELSE RAISE NOTICE 'function backup exists - untouched'; END IF;

  -------------------------------------------------------------------- view source
  IF to_regclass('public.inst_view_backup_20260903') IS NULL THEN
    CREATE TABLE public.inst_view_backup_20260903 (
      viewname text, def text, taken_at timestamptz NOT NULL DEFAULT now());
    INSERT INTO public.inst_view_backup_20260903 (viewname, def)
    SELECT c.relname, pg_get_viewdef(c.oid, true)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('v','m')
      AND pg_get_viewdef(c.oid) ~* '\menrollment\M|\mcourse_sections\M|\mcourse_id\M';
    RAISE NOTICE 'backed up % view definitions', (SELECT count(*) FROM public.inst_view_backup_20260903);
  ELSE RAISE NOTICE 'view backup exists - untouched'; END IF;

  ------------------------------------------------------------------ policy source
  IF to_regclass('public.inst_policy_backup_20260903') IS NULL THEN
    CREATE TABLE public.inst_policy_backup_20260903 AS
      SELECT schemaname, tablename, policyname, permissive, roles::text AS roles,
             cmd, qual::text AS qual, with_check::text AS with_check, now() AS taken_at
      FROM pg_policies
      WHERE schemaname='public'
        AND tablename IN ('courses','enrollment','course_sections','session_logs');
    RAISE NOTICE 'backed up % policies', (SELECT count(*) FROM public.inst_policy_backup_20260903);
  ELSE RAISE NOTICE 'policy backup exists - untouched'; END IF;

  ------------------------------------------------------------------- table data
  IF to_regclass('public.inst_courses_backup_20260903') IS NULL THEN
    CREATE TABLE public.inst_courses_backup_20260903 AS SELECT * FROM public.courses;
  END IF;
  IF to_regclass('public.inst_enrollment_backup_20260903') IS NULL THEN
    CREATE TABLE public.inst_enrollment_backup_20260903 AS SELECT * FROM public.enrollment;
  END IF;
  IF to_regclass('public.inst_course_sections_backup_20260903') IS NULL THEN
    CREATE TABLE public.inst_course_sections_backup_20260903 AS SELECT * FROM public.course_sections;
  END IF;
  IF to_regclass('public.inst_session_logs_backup_20260903') IS NULL THEN
    CREATE TABLE public.inst_session_logs_backup_20260903 AS SELECT * FROM public.session_logs;
  END IF;

  ------------------------------------------------------- achievements.course_id
  IF to_regclass('public.achievements_course_id_backup_20260903') IS NULL THEN
    CREATE TABLE public.achievements_course_id_backup_20260903 AS
      SELECT id, global_sequence, course_id, sequence_in_course
      FROM public.achievements WHERE course_id IS NOT NULL;
    ALTER TABLE public.achievements_course_id_backup_20260903 ADD PRIMARY KEY (id);
    RAISE NOTICE 'backed up % achievements.course_id values',
      (SELECT count(*) FROM public.achievements_course_id_backup_20260903);
  ELSE RAISE NOTICE 'achievements.course_id backup exists - untouched'; END IF;
END $$;

-- Expect: functions 11+, views 3, policies 11, courses 9, enrollment 20,
--         sections 0, session_logs 0, achievement_course_ids 51
SELECT (SELECT count(*) FROM public.inst_func_backup_20260903)             AS functions,
       (SELECT count(*) FROM public.inst_view_backup_20260903)             AS views,
       (SELECT count(*) FROM public.inst_policy_backup_20260903)           AS policies,
       (SELECT count(*) FROM public.inst_courses_backup_20260903)          AS courses,
       (SELECT count(*) FROM public.inst_enrollment_backup_20260903)       AS enrollment,
       (SELECT count(*) FROM public.inst_course_sections_backup_20260903)  AS course_sections,
       (SELECT count(*) FROM public.inst_session_logs_backup_20260903)     AS session_logs,
       (SELECT count(*) FROM public.achievements_course_id_backup_20260903) AS achievement_course_ids;
