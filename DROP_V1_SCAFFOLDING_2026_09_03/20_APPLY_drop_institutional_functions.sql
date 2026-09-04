-- DROP V1 SCAFFOLDING · STAGE 20 · drop the five functions the retired
-- institutional path existed to serve, plus the trigger and the RLS policies
-- that depend on them.
--
-- REQUIRES: stage 10 (its rewrites remove the last callers of all five).
--
-- ---------------------------------------------------------- what is dropped, and why
-- register_student(text,text)
--     Institutional class-code registration. Reads courses AND enrollment; it
--     is the only writer that ever inserted an enrollment row. Its client
--     wrapper `registerStudent()` was deleted from src/features/auth/api.ts on
--     2026-09-03 and was never imported anywhere - AuthScreen signs up through
--     registerCommercialUser. Nothing in src/ or web/ calls the RPC. Institutional
--     mode is retired, so this is dropped outright rather than rewritten: there
--     is no v3 equivalent of "claim a pre-created student row with a class code".
--
-- seed_first_topic_on_enrollment()  + TRIGGER trig_seed_first_topic
--     Trigger function on `enrollment`, keyed on achievements.course_id +
--     sequence_in_course. It has no meaning without the table it fires on. The
--     v3 equivalent already exists and is not affected: start_quiz_attempt and
--     record_study_progress each insert the student_achievement_progress row on
--     demand.
--
-- unlock_after_safety(uuid,uuid)
--     Loops over a user's enrollment rows to unlock each course's first topic
--     after the safety prerequisite. Its only caller was submit_quiz, and stage
--     10 removed that call. 00_PRECHECK proves it was already a no-op on the
--     live path: every enrollment row is v1, and no v3 achievement is
--     is_prerequisite, so the loop never had a row to act on.
--
-- recompute_reachability(uuid,uuid,uuid)
--     Course-ordered progression: orders achievements by sequence_in_course
--     WITHIN a course_id. v3 has no courses and no ordered progression - the
--     column it filters on is dropped in stage 50. Callers were
--     unlock_after_safety (dropped here) and submit_quiz (call removed in stage
--     10, where v_reach was already always null on v3). No app caller; the only
--     mention in src/ is a stale comment at the top of features/dashboard/api.ts.
--
-- is_instructor_for_user(uuid)
--     Reads instructor_sections JOIN enrollment. The instructor role is part of
--     the retired institutional path. It cannot be dropped while any policy
--     references it, so the eight policies below go first.
--
-- ------------------------------------------------------------------ RLS consequence
-- The eight `instr_read_*` / instructor policies are PERMISSIVE grants that gave
-- an instructor read access to their students' rows. Dropping them REMOVES
-- access; it never grants any. 00_PRECHECK asserts every affected surviving
-- table still has both an `own_*` and an `admin_*` policy, so learners and
-- admins are unaffected. Four institutional users exist; all are owner test rows.
--
-- Idempotent: IF EXISTS throughout. Reversible: 99_ROLLBACK restores all five
-- functions verbatim from 05_BACKUP and replays the captured CREATE POLICY text.

BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.v1scaffold_func_backup_20260903') IS NULL
     OR to_regclass('public.v1scaffold_policy_backup_20260903') IS NULL
     OR to_regclass('public.v1scaffold_trigger_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been taken';
  END IF;
  IF (SELECT count(*) FROM public.v1scaffold_func_backup_20260903 WHERE disposition='dropped') < 5 THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP did not capture all five functions this stage drops';
  END IF;

  -- Stage 10 must have run: it removes the last callers.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='submit_quiz'
               AND (p.prosrc ~* 'unlock_after_safety' OR p.prosrc ~* 'recompute_reachability')) THEN
    RAISE EXCEPTION 'refusing to run: submit_quiz still calls unlock_after_safety / recompute_reachability. Run stage 10 first.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='lookup_student_by_qr'
               AND p.prosrc ~* 'is_instructor_for_user') THEN
    RAISE EXCEPTION 'refusing to run: lookup_student_by_qr still calls is_instructor_for_user. Run stage 10 first.';
  END IF;

  -- No OTHER function may still call any of the five.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
             WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql')
               AND p.proname NOT IN ('register_student','unlock_after_safety','recompute_reachability',
                                     'is_instructor_for_user','seed_first_topic_on_enrollment')
               AND (p.prosrc ~* '\mregister_student\M' OR p.prosrc ~* '\munlock_after_safety\M'
                 OR p.prosrc ~* '\mrecompute_reachability\s*\(' OR p.prosrc ~* '\mis_instructor_for_user\M'
                 OR p.prosrc ~* '\mseed_first_topic_on_enrollment\M')) THEN
    RAISE EXCEPTION 'refusing to run: another function still calls one of the five. Investigate before continuing.';
  END IF;
END $guard$;

------------------------------------------------------------------ trigger, then fn
DROP TRIGGER IF EXISTS trig_seed_first_topic ON public.enrollment;
DROP FUNCTION IF EXISTS public.seed_first_topic_on_enrollment();

--------------------------------------------------------------------------- policies
-- Every policy that depends on is_instructor_for_user. Those on tables this
-- package later drops (enrollment, session_logs) are listed too, so the
-- function can be dropped now rather than after stage 60.
DROP POLICY IF EXISTS instr_read_perf_metrics   ON public.performance_metrics;
DROP POLICY IF EXISTS instr_read_quiz_attempts  ON public.quiz_attempts;
DROP POLICY IF EXISTS instr_read_ach_progress   ON public.student_achievement_progress;
DROP POLICY IF EXISTS instr_read_method_prog    ON public.student_method_progress;
DROP POLICY IF EXISTS instr_read_student_badges ON public.student_badges;
DROP POLICY IF EXISTS instr_read_users          ON public.users;
DROP POLICY IF EXISTS instr_read_enrollment     ON public.enrollment;
DROP POLICY IF EXISTS instr_read_session_logs   ON public.session_logs;

-------------------------------------------------------------------------- functions
DROP FUNCTION IF EXISTS public.register_student(text, text);
DROP FUNCTION IF EXISTS public.unlock_after_safety(uuid, uuid);
DROP FUNCTION IF EXISTS public.recompute_reachability(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.is_instructor_for_user(uuid);

-- Belt and braces: no policy anywhere may still reference the dropped function.
DO $check$
DECLARE v_left text;
BEGIN
  SELECT string_agg(c.relname||'.'||p.polname, ', ')
    INTO v_left
  FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND (COALESCE(pg_get_expr(p.polqual,p.polrelid),'') ~* 'is_instructor_for_user'
      OR COALESCE(pg_get_expr(p.polwithcheck,p.polrelid),'') ~* 'is_instructor_for_user');
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'policies still reference is_instructor_for_user: %', v_left;
  END IF;
END $check$;

COMMIT;

-- Read-back.
SELECT 'function gone: '||n.f AS check,
       CASE WHEN to_regprocedure(n.f) IS NULL THEN 'PASS' ELSE 'FAIL - still present' END AS result
FROM (VALUES ('public.register_student(text,text)'),
             ('public.unlock_after_safety(uuid,uuid)'),
             ('public.recompute_reachability(uuid,uuid,uuid)'),
             ('public.is_instructor_for_user(uuid)'),
             ('public.seed_first_topic_on_enrollment()')) n(f)
UNION ALL
SELECT 'trigger trig_seed_first_topic gone',
       CASE WHEN NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                             WHERE NOT t.tgisinternal AND c.relname='enrollment' AND t.tgname='trig_seed_first_topic')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
-- Two instructor policies survive this stage on purpose: instr_read_own_sections
-- (on instructor_sections) and instr_read_course_sections / instr_write_enrollment
-- reference the instructor_sections TABLE, not the function, and drop with their
-- own tables in stages 60 and 70.
SELECT 'instructor policies remaining (expect only the 3 table-scoped ones)',
       (SELECT COALESCE(string_agg(c.relname||'.'||p.polname, ', ' ORDER BY c.relname, p.polname), '(none)')
        FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
        JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND p.polname LIKE 'instr\_%');
