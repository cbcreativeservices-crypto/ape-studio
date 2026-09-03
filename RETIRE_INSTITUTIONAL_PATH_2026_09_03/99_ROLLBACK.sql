-- RETIRE INSTITUTIONAL PATH · 99_ROLLBACK
-- Recreates the two views dropped by Stage 10, verbatim from the backup.
-- (Stage 10 is the only apply file in this package, so this is the whole
-- rollback. Nothing else has been changed to reverse.)

BEGIN;

DO $rb$
DECLARE v_def text;
BEGIN
  IF to_regclass('public.inst_view_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'cannot roll back: the view backup is gone';
  END IF;

  IF to_regclass('public.v_student_progress') IS NULL THEN
    SELECT def INTO v_def FROM public.inst_view_backup_20260903 WHERE viewname='v_student_progress';
    IF v_def IS NULL THEN RAISE EXCEPTION 'cannot roll back: v_student_progress definition missing'; END IF;
    EXECUTE 'CREATE VIEW public.v_student_progress AS ' || v_def;
    RAISE NOTICE 'v_student_progress restored';
  END IF;

  IF to_regclass('public.v_section_cohort_stats') IS NULL THEN
    SELECT def INTO v_def FROM public.inst_view_backup_20260903 WHERE viewname='v_section_cohort_stats';
    IF v_def IS NULL THEN RAISE EXCEPTION 'cannot roll back: v_section_cohort_stats definition missing'; END IF;
    EXECUTE 'CREATE VIEW public.v_section_cohort_stats AS ' || v_def;
    RAISE NOTICE 'v_section_cohort_stats restored';
  END IF;
END $rb$;

COMMIT;

-- Grants are not carried by CREATE VIEW. Re-assert from inst_policy_backup /
-- your own records if these views had non-default grants; by default only the
-- owner can read them after this.
SELECT 'v_student_progress'     AS view, (to_regclass('public.v_student_progress')     IS NOT NULL) AS restored
UNION ALL
SELECT 'v_section_cohort_stats',        (to_regclass('public.v_section_cohort_stats') IS NOT NULL);
