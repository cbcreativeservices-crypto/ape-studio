-- DROP V1 SCAFFOLDING · STAGE 40 · DROP TABLE session_logs.
--
-- REQUIRES: stage 10 (refresh_student_metrics + delete_my_account rewritten).
-- REQUIRES: stage 20 (drops the instr_read_session_logs policy).
--
-- This is the table the earlier brief called "0 rows, no code, no function
-- refs - trivially safe". It was the single most dangerous item on the list:
-- refresh_student_metrics reads it and submit_quiz calls that function on EVERY
-- quiz submission. Postgres would have let the DROP succeed and broken every
-- quiz submission silently at runtime.
--
-- Its own policies (own_session_logs, own_session_logs_write,
-- admin_all_session_logs) drop with the table. session_logs_course_id_fkey and
-- session_logs_user_id_fkey drop with it too, which removes one of the five FKs
-- into `courses`.
--
-- 0 rows. Nothing else references it. No app change needed - grep of src/ and
-- web/ finds no reader or writer.
--
-- Idempotent: IF EXISTS. Reversible: 99_ROLLBACK recreates the table with its
-- exact columns, defaults, primary key, foreign keys and RLS policies, then
-- restores the rows from 05_BACKUP.

BEGIN;

DO $guard$
DECLARE v_n int; v_left text;
BEGIN
  IF to_regclass('public.session_logs') IS NULL THEN
    RAISE NOTICE 'session_logs already dropped - nothing to do';
    RETURN;
  END IF;
  IF to_regclass('public.v1scaffold_session_logs_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been taken';
  END IF;

  -- Backup must cover every row.
  SELECT count(*) INTO v_n FROM public.session_logs s
   WHERE NOT EXISTS (SELECT 1 FROM public.v1scaffold_session_logs_backup_20260903 k WHERE k.id = s.id);
  IF v_n > 0 THEN
    RAISE EXCEPTION 'refusing to run: % session_logs rows are not in the backup. Re-take 05_BACKUP.', v_n;
  END IF;

  -- No function may still read it. This is the check Postgres will not do.
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO v_left
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
  WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql') AND regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\msession_logs\M';
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: these functions still read session_logs: %. Run stage 10 first.', v_left;
  END IF;

  -- refresh_student_metrics must be the rewritten one, and it must still exist.
  IF to_regprocedure('public.refresh_student_metrics(uuid)') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: refresh_student_metrics is missing. submit_quiz calls it on every submission.';
  END IF;
END $guard$;

DROP TABLE IF EXISTS public.session_logs;

COMMIT;

-- SMOKE TEST. This actually EXERCISES the quiz hot path's dependency: if
-- refresh_student_metrics still read the dropped table, this raises instead of
-- succeeding. It recomputes one real user's performance_metrics row, which is
-- the same thing every quiz submission does - a derived recomputation, not new
-- data. Delete this block if you would rather it stayed strictly read-only.
DO $smoke$
DECLARE v_u uuid;
BEGIN
  SELECT id INTO v_u FROM public.users ORDER BY id LIMIT 1;
  IF v_u IS NULL THEN
    RAISE NOTICE 'smoke test skipped - no users';
  ELSE
    PERFORM public.refresh_student_metrics(v_u);
    RAISE NOTICE 'smoke test PASSED - refresh_student_metrics ran clean for user %', v_u;
  END IF;
END $smoke$;

-- Read-back.
SELECT 'session_logs dropped' AS check,
       CASE WHEN to_regclass('public.session_logs') IS NULL THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'no function references session_logs',
  CASE WHEN NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                        WHERE n.nspname='public' AND regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\msession_logs\M')
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'refresh_student_metrics still present (submit_quiz calls it)',
  CASE WHEN to_regprocedure('public.refresh_student_metrics(uuid)') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'FKs into courses remaining after this stage',
  (SELECT string_agg(c.conrelid::regclass::text||'.'||c.conname, ', ' ORDER BY 1)
   FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.courses'::regclass);
