-- REMOVE V1 REMNANTS · 05_BACKUP
-- Creates the ONLY copy of everything the later stages destroy:
--   * the verbatim source of every function this package rewrites or drops
--   * the verbatim definition of the one view it has to recreate
--   * glossary.course_id (the column values, 3,660 non-null)
--   * public_courses / public_course_topics (whole tables)
-- Safe to re-run: it refuses to clobber an existing backup.

DO $$
BEGIN
  ----------------------------------------------------------------- function source
  IF to_regclass('public.v1remnants_func_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1remnants_func_backup_20260903 (
      proname   text,
      identity  text,
      def       text,
      taken_at  timestamptz NOT NULL DEFAULT now()
    );
    INSERT INTO public.v1remnants_func_backup_20260903 (proname, identity, def)
    SELECT p.proname,
           p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
           pg_get_functiondef(p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('bulk_import_glossary','validate_glossary',
                        'seed_commercial_free_topics','start_quiz_attempt','submit_quiz',
                        'commercial_topic_unlocked','recompute_reachability_commercial',
                        'validate_single_primary_home');
    RAISE NOTICE 'backed up % function definitions',
      (SELECT count(*) FROM public.v1remnants_func_backup_20260903);
  ELSE
    RAISE NOTICE 'function backup already exists - left untouched';
  END IF;

  --------------------------------------------------------------------- view source
  IF to_regclass('public.v1remnants_view_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1remnants_view_backup_20260903 (
      viewname  text,
      def       text,
      taken_at  timestamptz NOT NULL DEFAULT now()
    );
    INSERT INTO public.v1remnants_view_backup_20260903 (viewname, def)
    SELECT c.relname, pg_get_viewdef(c.oid, true)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'glossary_full_v';
    RAISE NOTICE 'backed up glossary_full_v definition';
  ELSE
    RAISE NOTICE 'view backup already exists - left untouched';
  END IF;

  ------------------------------------------------------------- glossary.course_id
  IF to_regclass('public.glossary_course_id_backup_20260903') IS NULL THEN
    CREATE TABLE public.glossary_course_id_backup_20260903 AS
      SELECT id, course_id FROM public.glossary WHERE course_id IS NOT NULL;
    ALTER TABLE public.glossary_course_id_backup_20260903 ADD PRIMARY KEY (id);
    RAISE NOTICE 'backed up % glossary.course_id values',
      (SELECT count(*) FROM public.glossary_course_id_backup_20260903);
  ELSE
    RAISE NOTICE 'glossary.course_id backup already exists - left untouched';
  END IF;

  ------------------------------------------------ public_courses / _course_topics
  IF to_regclass('public.v1remnants_public_courses_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1remnants_public_courses_backup_20260903 AS
      SELECT * FROM public.public_courses;
    RAISE NOTICE 'backed up public_courses';
  ELSE
    RAISE NOTICE 'public_courses backup already exists - left untouched';
  END IF;

  IF to_regclass('public.v1remnants_public_course_topics_backup_20260903') IS NULL THEN
    CREATE TABLE public.v1remnants_public_course_topics_backup_20260903 AS
      SELECT * FROM public.public_course_topics;
    RAISE NOTICE 'backed up public_course_topics';
  ELSE
    RAISE NOTICE 'public_course_topics backup already exists - left untouched';
  END IF;
END $$;

-- Expect: functions 8, views 1, glossary_course_ids 3660, pub_courses 9, pct 54
-- (pub_courses/pct will read 1 and 1 if REMOVE_COLLEGE_COURSES already ran.)
SELECT (SELECT count(*) FROM public.v1remnants_func_backup_20260903)                    AS functions,
       (SELECT count(*) FROM public.v1remnants_view_backup_20260903)                    AS views,
       (SELECT count(*) FROM public.glossary_course_id_backup_20260903)                 AS glossary_course_ids,
       (SELECT count(*) FROM public.v1remnants_public_courses_backup_20260903)          AS pub_courses,
       (SELECT count(*) FROM public.v1remnants_public_course_topics_backup_20260903)    AS pub_course_topics;
