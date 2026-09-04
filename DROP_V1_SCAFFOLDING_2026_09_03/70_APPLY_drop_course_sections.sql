-- DROP V1 SCAFFOLDING · STAGE 70 · DROP TABLE instructor_sections, then
-- DROP TABLE course_sections.
--
-- REQUIRES: stage 20 (is_instructor_for_user gone; delete_my_account no longer
--                     deletes from instructor_sections - that was stage 10).
-- REQUIRES: stage 60 (enrollment_section_id_fkey went with the enrollment table).
-- REQUIRES: RETIRE_INSTITUTIONAL stage 10 (v_section_cohort_stats reads
--                     course_sections and IS dependency-checked).
--
-- ------------------------------------------------------------ why two tables
-- `instructor_sections` was not on the original five-drop list, but
-- `instructor_sections.section_id -> course_sections(id) ON DELETE CASCADE` is a
-- real constraint and course_sections cannot be dropped while it exists. The
-- choice is to drop the FK or drop the table. The instructor role is part of the
-- retired institutional path and stage 20 already removed the function that made
-- it mean anything, so a table with 0 rows, no remaining function readers and no
-- app readers has nothing left to do. It is dropped.
--
-- Both tables have 0 rows. Backed up regardless.
--
-- Drops with them: policies instr_read_own_sections, admin_all_instr_sections,
-- instr_read_course_sections, admin_all_course_sections; constraints
-- instructor_sections_instructor_id_fkey, instructor_sections_section_id_fkey,
-- course_sections_course_id_fkey (the fourth FK into `courses`).
--
-- Idempotent: IF EXISTS. Reversible: 99_ROLLBACK recreates both with their exact
-- columns, defaults, keys, foreign keys, indexes and policies.

BEGIN;

DO $guard$
DECLARE v_n int; v_left text;
BEGIN
  IF to_regclass('public.course_sections') IS NULL AND to_regclass('public.instructor_sections') IS NULL THEN
    RAISE NOTICE 'both tables already dropped - nothing to do';
    RETURN;
  END IF;
  IF to_regclass('public.v1scaffold_course_sections_backup_20260903') IS NULL
     OR to_regclass('public.v1scaffold_instructor_sections_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been taken';
  END IF;

  IF to_regclass('public.course_sections') IS NOT NULL THEN
    SELECT count(*) INTO v_n FROM public.course_sections s
     WHERE NOT EXISTS (SELECT 1 FROM public.v1scaffold_course_sections_backup_20260903 k WHERE k.id = s.id);
    IF v_n > 0 THEN
      RAISE EXCEPTION 'refusing to run: % course_sections rows are not in the backup. Re-take 05_BACKUP.', v_n;
    END IF;
  END IF;
  IF to_regclass('public.instructor_sections') IS NOT NULL THEN
    SELECT count(*) INTO v_n FROM public.instructor_sections s
     WHERE NOT EXISTS (SELECT 1 FROM public.v1scaffold_instructor_sections_backup_20260903 k WHERE k.id = s.id);
    IF v_n > 0 THEN
      RAISE EXCEPTION 'refusing to run: % instructor_sections rows are not in the backup. Re-take 05_BACKUP.', v_n;
    END IF;
  END IF;

  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO v_left
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
  WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql')
    AND (regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_sections\M' OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\minstructor_sections\M');
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: these functions still read the section tables: %. Run stages 10 and 20 first.', v_left;
  END IF;

  IF to_regclass('public.enrollment') IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: enrollment still exists and its section_id FK points here. Run stage 60 first.';
  END IF;
  IF to_regclass('public.v_section_cohort_stats') IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: v_section_cohort_stats still reads course_sections. Run RETIRE_INSTITUTIONAL_PATH stage 10 first.';
  END IF;
END $guard$;

DROP TABLE IF EXISTS public.instructor_sections;
DROP TABLE IF EXISTS public.course_sections;

COMMIT;

-- Read-back.
SELECT 'instructor_sections dropped' AS check,
       CASE WHEN to_regclass('public.instructor_sections') IS NULL THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'course_sections dropped',
  CASE WHEN to_regclass('public.course_sections') IS NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'no function references either',
  CASE WHEN NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                        WHERE n.nspname='public'
                          AND (regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_sections\M' OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\minstructor_sections\M'))
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'FKs into courses remaining (expect only glossary if stage 50 of the other package has not run)',
  (SELECT COALESCE(string_agg(c.conrelid::regclass::text||'.'||c.conname, ', ' ORDER BY 1), '(none)')
   FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.courses'::regclass);
