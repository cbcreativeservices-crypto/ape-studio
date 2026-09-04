-- DROP V1 SCAFFOLDING · 05_BACKUP
--
-- Creates the ONLY copy of everything the later stages destroy:
--   * the verbatim ORIGINAL SOURCE of all 12 functions this package rewrites or
--     drops (pg_get_functiondef text - restorable with a bare EXECUTE)
--   * the trigger definition trig_seed_first_topic
--   * the 8 RLS policy definitions that depend on is_instructor_for_user,
--     rebuilt as executable CREATE POLICY statements
--   * every row of courses / enrollment / course_sections / session_logs /
--     instructor_sections
--   * achievements.course_id (id + value, for the 51 non-null rows)
--   * the 4 badges rows (stage 30)
--
-- IMPORTANT: take this backup AFTER REMOVE_V1_REMNANTS stage 30 has run. The
-- "original" this package must be able to restore is that package's output, not
-- the pre-stage-30 body. 00_PRECHECK asserts stage 30 has run; this file
-- re-asserts it and refuses otherwise.
--
-- Safe to re-run: it refuses to clobber an existing backup.

DO $backup$
DECLARE v_n int;
BEGIN
  ------------------------------------------------------------------- precondition
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname IN ('start_quiz_attempt','submit_quiz')
               AND regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* 'public_course') THEN
    RAISE EXCEPTION 'refusing to back up: REMOVE_V1_REMNANTS stage 30 has not run yet. Backing up the pre-stage-30 quiz functions would make this package''s rollback restore the wrong version.';
  END IF;

  ---------------------------------------------------------------- function source
  IF to_regclass('public.v1scaffold_func_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_func_backup_20260903 (
      proname   text,
      identity  text,
      disposition text,          -- 'rewritten' or 'dropped' by this package
      def       text,
      taken_at  timestamptz NOT NULL DEFAULT now()
    );
    INSERT INTO public.v1scaffold_func_backup_20260903 (proname, identity, disposition, def)
    SELECT p.proname,
           p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
           CASE WHEN p.proname IN ('register_student','unlock_after_safety','recompute_reachability',
                                   'is_instructor_for_user','seed_first_topic_on_enrollment')
                THEN 'dropped' ELSE 'rewritten' END,
           pg_get_functiondef(p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        -- rewritten by stage 10
        'refresh_student_metrics','delete_my_account','record_study_progress','credit_time_trial',
        'start_quiz_attempt','submit_quiz','lookup_student_by_qr',
        -- dropped by stage 20
        'register_student','unlock_after_safety','recompute_reachability',
        'is_instructor_for_user','seed_first_topic_on_enrollment');
    SELECT count(*) INTO v_n FROM public.v1scaffold_func_backup_20260903;
    IF v_n < 12 THEN
      RAISE EXCEPTION 'expected 12 function definitions, captured % - investigate before continuing', v_n;
    END IF;
    RAISE NOTICE 'backed up % function definitions', v_n;
  ELSE
    RAISE NOTICE 'function backup already exists - left untouched';
  END IF;

  ------------------------------------------------------------------ trigger source
  IF to_regclass('public.v1scaffold_trigger_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_trigger_backup_20260903 (
      tgname text, tblname text, def text, taken_at timestamptz NOT NULL DEFAULT now());
    INSERT INTO public.v1scaffold_trigger_backup_20260903 (tgname, tblname, def)
    SELECT t.tgname, c.relname, pg_get_triggerdef(t.oid)
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND NOT t.tgisinternal AND t.tgname='trig_seed_first_topic';
    RAISE NOTICE 'backed up trigger definition(s)';
  ELSE
    RAISE NOTICE 'trigger backup already exists - left untouched';
  END IF;

  -------------------------------------------------------------------- RLS policies
  -- Rebuilt as executable CREATE POLICY text so 99_ROLLBACK can restore them
  -- without hand-typing. Captures BOTH:
  --   * every policy that depends on is_instructor_for_user (stage 20 drops
  --     these off SURVIVING tables), and
  --   * every policy on the five tables this package drops, so the rollback can
  --     put each table back with its exact RLS, not an approximation.
  IF to_regclass('public.v1scaffold_policy_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_policy_backup_20260903 (
      tblname text, polname text, def text, taken_at timestamptz NOT NULL DEFAULT now());
    INSERT INTO public.v1scaffold_policy_backup_20260903 (tblname, polname, def)
    SELECT c.relname, p.polname,
           'CREATE POLICY ' || quote_ident(p.polname) || ' ON public.' || quote_ident(c.relname)
           || ' AS ' || CASE p.polpermissive WHEN true THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END
           || ' FOR ' || CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                                       WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END
           || ' TO ' || COALESCE((SELECT string_agg(quote_ident(r.rolname), ', ')
                                  FROM unnest(p.polroles) rid JOIN pg_roles r ON r.oid=rid), 'PUBLIC')
           || COALESCE(' USING (' || pg_get_expr(p.polqual, p.polrelid) || ')', '')
           || COALESCE(' WITH CHECK (' || pg_get_expr(p.polwithcheck, p.polrelid) || ')', '')
           || ';'
    FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND (COALESCE(pg_get_expr(p.polqual,p.polrelid),'') ~* 'is_instructor_for_user'
        OR COALESCE(pg_get_expr(p.polwithcheck,p.polrelid),'') ~* 'is_instructor_for_user'
        OR c.relname IN ('courses','enrollment','course_sections','session_logs','instructor_sections'));
    SELECT count(*) INTO v_n FROM public.v1scaffold_policy_backup_20260903;
    RAISE NOTICE 'backed up % policy definitions', v_n;
  ELSE
    RAISE NOTICE 'policy backup already exists - left untouched';
  END IF;

  ------------------------------------------------------------ table grants + RLS flag
  -- So the rollback restores the same role privileges the tables had, rather
  -- than whatever the recreate happens to inherit.
  IF to_regclass('public.v1scaffold_grant_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_grant_backup_20260903 (
      tblname text, rowsecurity boolean, def text, taken_at timestamptz NOT NULL DEFAULT now());
    INSERT INTO public.v1scaffold_grant_backup_20260903 (tblname, rowsecurity, def)
    SELECT g.table_name, c.relrowsecurity,
           'GRANT ' || string_agg(DISTINCT g.privilege_type, ', ')
             || ' ON public.' || quote_ident(g.table_name)
             || ' TO ' || quote_ident(g.grantee) || ';'
    FROM information_schema.role_table_grants g
    JOIN pg_class c ON c.relname = g.table_name
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE g.table_schema='public'
      AND g.table_name IN ('courses','enrollment','course_sections','session_logs','instructor_sections')
    GROUP BY g.table_name, c.relrowsecurity, g.grantee;
    SELECT count(*) INTO v_n FROM public.v1scaffold_grant_backup_20260903;
    RAISE NOTICE 'backed up % grant statements', v_n;
  ELSE
    RAISE NOTICE 'grant backup already exists - left untouched';
  END IF;

  ------------------------------------------------------------------- table content
  IF to_regclass('public.v1scaffold_courses_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_courses_backup_20260903 AS SELECT * FROM public.courses;
    RAISE NOTICE 'backed up % courses rows', (SELECT count(*) FROM public.v1scaffold_courses_backup_20260903);
  ELSE RAISE NOTICE 'courses backup already exists - left untouched'; END IF;

  IF to_regclass('public.v1scaffold_enrollment_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_enrollment_backup_20260903 AS SELECT * FROM public.enrollment;
    RAISE NOTICE 'backed up % enrollment rows', (SELECT count(*) FROM public.v1scaffold_enrollment_backup_20260903);
  ELSE RAISE NOTICE 'enrollment backup already exists - left untouched'; END IF;

  IF to_regclass('public.v1scaffold_course_sections_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_course_sections_backup_20260903 AS SELECT * FROM public.course_sections;
    RAISE NOTICE 'backed up % course_sections rows', (SELECT count(*) FROM public.v1scaffold_course_sections_backup_20260903);
  ELSE RAISE NOTICE 'course_sections backup already exists - left untouched'; END IF;

  IF to_regclass('public.v1scaffold_session_logs_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_session_logs_backup_20260903 AS SELECT * FROM public.session_logs;
    RAISE NOTICE 'backed up % session_logs rows', (SELECT count(*) FROM public.v1scaffold_session_logs_backup_20260903);
  ELSE RAISE NOTICE 'session_logs backup already exists - left untouched'; END IF;

  IF to_regclass('public.v1scaffold_instructor_sections_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_instructor_sections_backup_20260903 AS SELECT * FROM public.instructor_sections;
    RAISE NOTICE 'backed up % instructor_sections rows', (SELECT count(*) FROM public.v1scaffold_instructor_sections_backup_20260903);
  ELSE RAISE NOTICE 'instructor_sections backup already exists - left untouched'; END IF;

  ------------------------------------------------------------ achievements.course_id
  IF to_regclass('public.v1scaffold_ach_course_id_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_ach_course_id_backup_20260903 AS
      SELECT id, course_id FROM public.achievements WHERE course_id IS NOT NULL;
    ALTER TABLE public.v1scaffold_ach_course_id_backup_20260903 ADD PRIMARY KEY (id);
    RAISE NOTICE 'backed up % achievements.course_id values',
      (SELECT count(*) FROM public.v1scaffold_ach_course_id_backup_20260903);
  ELSE RAISE NOTICE 'achievements.course_id backup already exists - left untouched'; END IF;

  -------------------------------------------------------------------------- badges
  IF to_regclass('public.v1scaffold_badges_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1scaffold_badges_backup_20260903 AS SELECT * FROM public.badges;
    RAISE NOTICE 'backed up % badges rows', (SELECT count(*) FROM public.v1scaffold_badges_backup_20260903);
  ELSE RAISE NOTICE 'badges backup already exists - left untouched'; END IF;
END $backup$;

-- Read-back.
SELECT 'v1scaffold_func_backup_20260903'  AS backup, count(*)::text AS rows FROM public.v1scaffold_func_backup_20260903
UNION ALL SELECT 'v1scaffold_trigger_backup_20260903', count(*)::text FROM public.v1scaffold_trigger_backup_20260903
UNION ALL SELECT 'v1scaffold_policy_backup_20260903',  count(*)::text FROM public.v1scaffold_policy_backup_20260903
UNION ALL SELECT 'v1scaffold_grant_backup_20260903',   count(*)::text FROM public.v1scaffold_grant_backup_20260903
UNION ALL SELECT 'v1scaffold_courses_backup_20260903', count(*)::text FROM public.v1scaffold_courses_backup_20260903
UNION ALL SELECT 'v1scaffold_enrollment_backup_20260903', count(*)::text FROM public.v1scaffold_enrollment_backup_20260903
UNION ALL SELECT 'v1scaffold_course_sections_backup_20260903', count(*)::text FROM public.v1scaffold_course_sections_backup_20260903
UNION ALL SELECT 'v1scaffold_session_logs_backup_20260903', count(*)::text FROM public.v1scaffold_session_logs_backup_20260903
UNION ALL SELECT 'v1scaffold_instructor_sections_backup_20260903', count(*)::text FROM public.v1scaffold_instructor_sections_backup_20260903
UNION ALL SELECT 'v1scaffold_ach_course_id_backup_20260903', count(*)::text FROM public.v1scaffold_ach_course_id_backup_20260903
UNION ALL SELECT 'v1scaffold_badges_backup_20260903', count(*)::text FROM public.v1scaffold_badges_backup_20260903
UNION ALL SELECT 'functions captured (must be 12)',
  (SELECT string_agg(identity, ', ' ORDER BY identity) FROM public.v1scaffold_func_backup_20260903);
