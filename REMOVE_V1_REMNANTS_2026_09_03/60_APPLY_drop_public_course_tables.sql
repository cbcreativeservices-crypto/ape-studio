-- REMOVE V1 REMNANTS · STAGE 60 · drop public_courses + public_course_topics
--
-- SEQUENCING - this stage has three hard prerequisites:
--   1. REMOVE_COLLEGE_COURSES_2026_09_03 must have been RUN (or consciously
--      abandoned). That package deletes rows from these two tables. Running it
--      after this stage is impossible - the tables will not exist. This file
--      does not force it, because dropping the tables achieves a superset of
--      it, but the two packages must not be interleaved.
--   2. Stage 30 must have run - start_quiz_attempt and submit_quiz were the
--      last live readers of public_course_topics, and function bodies are not
--      dependency-checked, so dropping first would break them silently.
--   3. Stage 40 must have run - trg_single_primary_home lives on
--      public_course_topics.
--   The guard below enforces 2 and 3.
--
-- FK note: public_course_topics has an FK into achievements
-- (public_course_topics_achievement_id_fkey) and public_courses is the parent
-- of public_course_topics (ON DELETE CASCADE). Dropping child then parent needs
-- no CASCADE. Nothing else in the schema points at either table - verified
-- against pg_constraint.
--
-- IRREVERSIBLE-ISH: 99_ROLLBACK can recreate the data from
-- v1remnants_public_course*_backup_20260903, but it recreates the tables from
-- the backup's inferred shape - it does NOT restore the original constraints,
-- defaults, indexes or RLS. If you may ever want these tables back as they
-- were, take a full Supabase snapshot before running this file.

BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.v1remnants_public_courses_backup_20260903') IS NULL
     OR to_regclass('public.v1remnants_public_course_topics_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been run';
  END IF;

  IF to_regclass('public.public_courses') IS NULL
     AND to_regclass('public.public_course_topics') IS NULL THEN
    RAISE NOTICE 'both tables are already gone - nothing to do';
    RETURN;
  END IF;

  -- Stage 30 gate.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.prosrc ~* 'public_course') THEN
    RAISE EXCEPTION 'refusing to run: at least one function still reads public_course* - run Stages 30 and 40 first';
  END IF;

  -- Stage 40 gate.
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
             WHERE c.relname='public_course_topics' AND NOT t.tgisinternal) THEN
    RAISE EXCEPTION 'refusing to run: public_course_topics still carries a trigger - run Stage 40 first';
  END IF;

  -- Nothing outside these two tables may point at them.
  IF EXISTS (SELECT 1 FROM pg_constraint con
             JOIN pg_class cl      ON cl.oid = con.conrelid
             JOIN pg_class confrel ON confrel.oid = con.confrelid
             WHERE con.contype='f'
               AND confrel.relname IN ('public_courses','public_course_topics')
               AND cl.relname NOT IN ('public_courses','public_course_topics')) THEN
    RAISE EXCEPTION 'refusing to run: an outside table has an FK into public_course*';
  END IF;
END $guard$;

DROP TABLE IF EXISTS public.public_course_topics;
DROP TABLE IF EXISTS public.public_courses;

COMMIT;

SELECT 'public_course_topics dropped' AS check,
       CASE WHEN to_regclass('public.public_course_topics') IS NULL THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'public_courses dropped',
       CASE WHEN to_regclass('public.public_courses') IS NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'backups retained',
       CASE WHEN to_regclass('public.v1remnants_public_courses_backup_20260903') IS NOT NULL
             AND to_regclass('public.v1remnants_public_course_topics_backup_20260903') IS NOT NULL
            THEN 'PASS' ELSE 'FAIL' END;
