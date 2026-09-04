-- REMOVE V1 REMNANTS · STAGE 50 · drop glossary.course_id
--
-- 3,660 of 26,847 glossary rows carry a v1 course tag that contradicts their
-- own achievement_id. Every glossary row already resolves its topic through
-- achievement_id / glossary_topics, so the column is pure noise.
--
-- >>> DEPENDENCY THE SKETCH DID NOT HAVE <<<
-- The view public.glossary_full_v SELECTs glossary.course_id. A view column is
-- a hard dependency: `ALTER TABLE ... DROP COLUMN course_id` FAILS unless the
-- view is dropped first (or CASCADE is used, which would silently delete the
-- view the app reads). glossary_full_v is live - it is read by
--   src/features/study/api.ts (x2) and src/screens/glossary/GlossaryScreen.tsx (x2)
-- so it is dropped and recreated identically minus that one column, inside the
-- same transaction. Its original definition is in v1remnants_view_backup_20260903.
--
-- >>> APP CHANGE REQUIRED BEFORE THIS STAGE <<<
--   src/screens/glossary/GlossaryScreen.tsx
--     line ~113   .select('id, term, definition, plain_english, course_id, achievement_id')
--     line ~1443  filter === 'course' && list.filter(e => e.course_id === selCourseId)
--     line ~2313  courseCodeById.get(e.course_id)
--   That screen must stop selecting and filtering on course_id and ship first,
--   or the glossary browser errors on an unknown column.
--
-- Also note: index idx_glossary_course and FK glossary_course_id_fkey are
-- dropped automatically with the column. The rollback recreates both - which
-- means ROLLBACK ONLY WORKS WHILE public.courses STILL EXISTS. Once
-- RETIRE_INSTITUTIONAL_PATH drops `courses`, the FK cannot be restored and
-- this stage becomes effectively irreversible.

BEGIN;

DO $guard$
DECLARE v_backed int;
BEGIN
  IF to_regclass('public.glossary_course_id_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been run';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.v1remnants_view_backup_20260903
                 WHERE viewname = 'glossary_full_v') THEN
    RAISE EXCEPTION 'refusing to run: the glossary_full_v definition is not backed up';
  END IF;

  -- Column already gone? Then this is a re-run; nothing to do.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='glossary' AND column_name='course_id') THEN
    RAISE NOTICE 'glossary.course_id already dropped - nothing to do';
    RETURN;
  END IF;

  -- Backup must still cover every non-null value that is about to be lost.
  SELECT count(*) INTO v_backed FROM public.glossary g
  WHERE g.course_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.glossary_course_id_backup_20260903 b
                    WHERE b.id = g.id AND b.course_id = g.course_id);
  IF v_backed > 0 THEN
    RAISE EXCEPTION 'refusing to run: % glossary rows have a course_id not present in the backup (re-take the backup)', v_backed;
  END IF;

  -- The importer must already be off course_id, or the next import re-adds it.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='bulk_import_glossary'
               AND regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* 'course_id') THEN
    RAISE EXCEPTION 'refusing to run: bulk_import_glossary still writes course_id - run Stage 10 first';
  END IF;

  -- Nothing must be left that reads glossary.course_id.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname IN ('validate_glossary')
               AND regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* 'course_id') THEN
    RAISE EXCEPTION 'refusing to run: validate_glossary still references course_id - run Stage 10 first';
  END IF;
END $guard$;

-- Recreate the view without course_id. Everything else is verbatim.
DROP VIEW IF EXISTS public.glossary_full_v;
CREATE VIEW public.glossary_full_v AS
 SELECT id,
    term,
    definition,
    plain_english,
    achievement_id,
    related_terms,
    category,
    difficulty,
    scenario_contexts,
    purpose_function,
    practical_application,
        CASE
            WHEN has_academy_access(auth.uid()) THEN common_mistakes
            ELSE NULL::text[]
        END AS common_mistakes
   FROM glossary g;

ALTER TABLE public.glossary DROP COLUMN IF EXISTS course_id;

COMMIT;

-- Grants are not carried by CREATE VIEW; re-assert the ones the view had.
-- (Adjust if your project grants differ - check with \dp glossary_full_v.)
GRANT SELECT ON public.glossary_full_v TO anon, authenticated;

SELECT 'glossary.course_id dropped' AS check,
       CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                             WHERE table_schema='public' AND table_name='glossary' AND column_name='course_id')
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'glossary_full_v still exists',
       CASE WHEN to_regclass('public.glossary_full_v') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'glossary row count unchanged (26847)',
       CASE WHEN (SELECT count(*) FROM public.glossary) = 26847 THEN 'PASS' ELSE 'CHECK - count moved' END
UNION ALL SELECT 'backup retained (3660)',
       CASE WHEN (SELECT count(*) FROM public.glossary_course_id_backup_20260903) = 3660 THEN 'PASS' ELSE 'CHECK' END;
