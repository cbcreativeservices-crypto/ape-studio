-- DROP V1 SCAFFOLDING · STAGE 60 · DROP TABLE enrollment.
--
-- REQUIRES: stage 10 (record_study_progress, credit_time_trial,
--                     start_quiz_attempt, submit_quiz, delete_my_account off it).
-- REQUIRES: stage 20 (register_student, unlock_after_safety,
--                     is_instructor_for_user dropped; trig_seed_first_topic and
--                     its function dropped; instr_read_enrollment dropped).
-- REQUIRES: RETIRE_INSTITUTIONAL stage 10 (v_student_progress and
--                     v_section_cohort_stats both read it and ARE
--                     dependency-checked).
--
-- 20 rows. All are the owner's own test accounts against v1 courses, and there
-- are no other users. Per the pre-launch standing instruction they are
-- throwaway - but they are backed up verbatim regardless, and 99_ROLLBACK puts
-- them back.
--
-- Drops with the table: policies own_enrollment, admin_all_enrollment,
-- instr_write_enrollment; constraints enrollment_user_id_fkey,
-- enrollment_course_id_fkey (the third FK into `courses`),
-- enrollment_curriculum_version_id_fkey, enrollment_section_id_fkey (which is
-- what lets stage 70 drop course_sections); indexes idx_enrollment_user,
-- idx_enrollment_section, idx_enrollment_version, idx_enrollment_user_version
-- and the unique (user_id, course_id).
--
-- No app change needed: fetchDashboard() - the only client reader - was removed
-- from src/features/dashboard/api.ts on 2026-09-03, and registerStudent() was
-- removed from src/features/auth/api.ts the same day. Nothing in src/ or web/
-- selects from the table.
--
-- Idempotent: IF EXISTS. Reversible: 99_ROLLBACK recreates the table with its
-- exact columns, defaults, keys, foreign keys and policies, then restores the
-- 20 rows.

BEGIN;

DO $guard$
DECLARE v_n int; v_left text;
BEGIN
  IF to_regclass('public.enrollment') IS NULL THEN
    RAISE NOTICE 'enrollment already dropped - nothing to do';
    RETURN;
  END IF;
  IF to_regclass('public.v1scaffold_enrollment_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been taken';
  END IF;

  SELECT count(*) INTO v_n FROM public.enrollment e
   WHERE NOT EXISTS (SELECT 1 FROM public.v1scaffold_enrollment_backup_20260903 k WHERE k.id = e.id);
  IF v_n > 0 THEN
    RAISE EXCEPTION 'refusing to run: % enrollment rows are not in the backup. Re-take 05_BACKUP.', v_n;
  END IF;

  -- No function may still read it. Word-bounded, so user_topic_enrollments and
  -- user_bundle_enrollments do not false-positive.
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO v_left
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
  WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql') AND p.prosrc ~* '\menrollment\M';
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: these functions still read enrollment: %. Run stages 10 and 20 first.', v_left;
  END IF;

  IF to_regprocedure('public.is_instructor_for_user(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: is_instructor_for_user still exists and reads enrollment. Run stage 20 first.';
  END IF;
  IF to_regclass('public.v_student_progress') IS NOT NULL OR to_regclass('public.v_section_cohort_stats') IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: an institutional view still reads enrollment. Run RETIRE_INSTITUTIONAL_PATH stage 10 first.';
  END IF;
END $guard$;

DROP TABLE IF EXISTS public.enrollment;

COMMIT;

-- Read-back.
SELECT 'enrollment dropped' AS check,
       CASE WHEN to_regclass('public.enrollment') IS NULL THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'no function references enrollment',
  CASE WHEN NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                        WHERE n.nspname='public' AND p.prosrc ~* '\menrollment\M')
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'user_topic_enrollments (the v3 gate) is untouched',
  CASE WHEN to_regclass('public.user_topic_enrollments') IS NOT NULL
       THEN 'PASS - ' || (SELECT count(*)::text FROM public.user_topic_enrollments) || ' rows'
       ELSE 'FAIL - the v3 enrolment table is gone, that is very wrong' END
UNION ALL SELECT 'backup still holds the 20 rows',
  CASE WHEN (SELECT count(*) FROM public.v1scaffold_enrollment_backup_20260903) = 20 THEN 'PASS' ELSE 'INVESTIGATE' END
UNION ALL SELECT 'FKs into courses remaining after this stage',
  (SELECT string_agg(c.conrelid::regclass::text||'.'||c.conname, ', ' ORDER BY 1)
   FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.courses'::regclass)
UNION ALL SELECT 'FKs into course_sections remaining after this stage',
  (SELECT COALESCE(string_agg(c.conrelid::regclass::text||'.'||c.conname, ', ' ORDER BY 1), '(none)')
   FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.course_sections'::regclass);
