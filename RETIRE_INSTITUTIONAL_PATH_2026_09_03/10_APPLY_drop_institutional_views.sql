-- RETIRE INSTITUTIONAL PATH · STAGE 10 · drop the two institutional-only views
--
-- This is the ONLY apply file in this package, and it is deliberately the
-- smallest safe slice. It removes the two views that exist solely to serve the
-- retired instructor/section reporting surface:
--
--   v_student_progress      reads enrollment + achievements.course_id
--   v_section_cohort_stats  reads enrollment + course_sections
--
-- Why these are safe now:
--   * Neither is referenced anywhere in src/ or web/ (grepped 2026-09-03).
--   * Both are plain views over tables that still exist, so dropping them
--     removes reporting output only - no data, no writes.
--   * They are two of the three hard dependencies that would make
--     `ALTER TABLE achievements DROP COLUMN course_id` and
--     `DROP TABLE enrollment` fail. Clearing them shrinks the later job.
--   (The third, glossary_full_v, is handled by REMOVE_V1_REMNANTS Stage 50.)
--
-- What this file deliberately does NOT do: drop courses, enrollment,
-- course_sections, session_logs, or achievements.course_id. Those are blocked
-- by eight function bodies including your live registration and metrics paths.
-- See NOTES_BLOCKERS.md - each one needs your ruling first.
--
-- Idempotent (IF EXISTS). Reversible (99_ROLLBACK recreates both verbatim).

BEGIN;

DO $guard$
DECLARE v_have int;
BEGIN
  IF to_regclass('public.inst_view_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been run';
  END IF;

  SELECT count(*) INTO v_have FROM public.inst_view_backup_20260903
   WHERE viewname IN ('v_student_progress','v_section_cohort_stats');
  IF v_have <> 2 THEN
    RAISE EXCEPTION 'refusing to run: the backup holds % of the 2 view definitions', v_have;
  END IF;

  -- Nothing else may depend on them (another view built on top, say).
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('v','m')
      AND c.relname NOT IN ('v_student_progress','v_section_cohort_stats')
      AND pg_get_viewdef(c.oid) ~* 'v_student_progress|v_section_cohort_stats') THEN
    RAISE EXCEPTION 'refusing to run: another view is built on one of these';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* 'v_student_progress|v_section_cohort_stats') THEN
    RAISE EXCEPTION 'refusing to run: a function still reads one of these views';
  END IF;
END $guard$;

DROP VIEW IF EXISTS public.v_section_cohort_stats;
DROP VIEW IF EXISTS public.v_student_progress;

COMMIT;

SELECT 'v_student_progress dropped' AS check,
       CASE WHEN to_regclass('public.v_student_progress') IS NULL THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'v_section_cohort_stats dropped',
       CASE WHEN to_regclass('public.v_section_cohort_stats') IS NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'definitions retained in backup',
       CASE WHEN (SELECT count(*) FROM public.inst_view_backup_20260903) >= 2 THEN 'PASS' ELSE 'FAIL' END;
