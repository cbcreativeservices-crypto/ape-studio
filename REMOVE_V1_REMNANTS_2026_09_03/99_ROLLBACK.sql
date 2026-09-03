-- REMOVE V1 REMNANTS · 99_ROLLBACK
-- Restores everything this package changed, in reverse stage order, from the
-- 05_BACKUP tables. Safe to run after any subset of stages: each section
-- checks whether it has work to do.
--
-- LIMITS - read before relying on this:
--   * Stage 60's table drop is restored as DATA ONLY. The recreated
--     public_courses / public_course_topics get column types from the backup
--     tables but NOT their original primary keys, unique indexes, foreign keys,
--     defaults, or RLS. If you need those back exactly, restore from a Supabase
--     snapshot instead.
--   * Stage 50's rollback recreates the FK glossary_course_id_fkey, which
--     references public.courses. If RETIRE_INSTITUTIONAL_PATH has already
--     dropped `courses`, that FK cannot be recreated and the section will
--     re-add the column and the values but skip the constraint (it says so).
--   * Function sources are restored verbatim by EXECUTEing the
--     pg_get_functiondef text captured in 05_BACKUP. That is exact.

BEGIN;

DO $rb$
DECLARE r record; v_has_courses boolean;
BEGIN
  IF to_regclass('public.v1remnants_func_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'cannot roll back: the function backup is gone';
  END IF;

  -------------------------------------------------- STAGE 60 (tables) - data only
  IF to_regclass('public.public_courses') IS NULL
     AND to_regclass('public.v1remnants_public_courses_backup_20260903') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.public_courses AS SELECT * FROM public.v1remnants_public_courses_backup_20260903';
    RAISE NOTICE 'public_courses recreated (DATA ONLY - no PK/FK/RLS)';
  END IF;
  IF to_regclass('public.public_course_topics') IS NULL
     AND to_regclass('public.v1remnants_public_course_topics_backup_20260903') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE public.public_course_topics AS SELECT * FROM public.v1remnants_public_course_topics_backup_20260903';
    RAISE NOTICE 'public_course_topics recreated (DATA ONLY - no PK/FK/RLS)';
  END IF;

  ------------------------------------------------------ STAGE 50 (glossary column)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='glossary' AND column_name='course_id') THEN
    EXECUTE 'ALTER TABLE public.glossary ADD COLUMN course_id uuid';
    EXECUTE 'UPDATE public.glossary g SET course_id = b.course_id
             FROM public.glossary_course_id_backup_20260903 b WHERE b.id = g.id';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_glossary_course ON public.glossary USING btree (course_id)';
    v_has_courses := (to_regclass('public.courses') IS NOT NULL);
    IF v_has_courses THEN
      EXECUTE 'ALTER TABLE public.glossary ADD CONSTRAINT glossary_course_id_fkey
               FOREIGN KEY (course_id) REFERENCES public.courses(id)';
      RAISE NOTICE 'glossary.course_id restored with its FK';
    ELSE
      RAISE NOTICE 'glossary.course_id restored WITHOUT its FK (public.courses no longer exists)';
    END IF;

    -- Put the original view back, verbatim from the backup.
    EXECUTE 'DROP VIEW IF EXISTS public.glossary_full_v';
    EXECUTE 'CREATE VIEW public.glossary_full_v AS ' ||
            (SELECT def FROM public.v1remnants_view_backup_20260903 WHERE viewname='glossary_full_v');
    EXECUTE 'GRANT SELECT ON public.glossary_full_v TO anon, authenticated';
    RAISE NOTICE 'glossary_full_v restored from backup';
  END IF;

  ------------------------------------------------------ STAGE 40 (dropped objects)
  FOR r IN SELECT def FROM public.v1remnants_func_backup_20260903
           WHERE proname IN ('commercial_topic_unlocked',
                             'recompute_reachability_commercial',
                             'validate_single_primary_home')
  LOOP
    EXECUTE r.def;
  END LOOP;

  IF to_regclass('public.public_course_topics') IS NOT NULL
     AND to_regprocedure('public.validate_single_primary_home()') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                     WHERE c.relname='public_course_topics' AND t.tgname='trg_single_primary_home') THEN
    EXECUTE 'CREATE TRIGGER trg_single_primary_home
             BEFORE INSERT OR UPDATE ON public.public_course_topics
             FOR EACH ROW EXECUTE FUNCTION validate_single_primary_home()';
  END IF;

  IF to_regclass('public.public_courses') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='public_courses' AND policyname='pc_read') THEN
    EXECUTE 'CREATE POLICY pc_read ON public.public_courses FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF to_regclass('public.public_course_topics') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='public_course_topics' AND policyname='pct_read') THEN
    EXECUTE 'CREATE POLICY pct_read ON public.public_course_topics FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  ------------------------------------- STAGES 30, 20, 10 (rewritten function bodies)
  FOR r IN SELECT def FROM public.v1remnants_func_backup_20260903
           WHERE proname IN ('start_quiz_attempt','submit_quiz',
                             'seed_commercial_free_topics',
                             'bulk_import_glossary','validate_glossary')
  LOOP
    EXECUTE r.def;
  END LOOP;

  RAISE NOTICE 'rollback complete';
END $rb$;

COMMIT;

SELECT 'functions restored' AS check,
       (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public'
          AND p.proname IN ('bulk_import_glossary','validate_glossary','seed_commercial_free_topics',
                            'start_quiz_attempt','submit_quiz','commercial_topic_unlocked',
                            'recompute_reachability_commercial','validate_single_primary_home'))::text AS value
UNION ALL SELECT 'glossary.course_id present',
       (SELECT count(*)::text FROM information_schema.columns
        WHERE table_schema='public' AND table_name='glossary' AND column_name='course_id')
UNION ALL SELECT 'public_course* tables present',
       ((to_regclass('public.public_courses') IS NOT NULL)::int
      + (to_regclass('public.public_course_topics') IS NOT NULL)::int)::text;
