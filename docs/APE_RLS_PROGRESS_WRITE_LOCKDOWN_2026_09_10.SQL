-- ===========================================================================
-- APE — RLS FIX: lock per-user PROGRESS/BADGE/QUIZ tables to READ-ONLY for the
-- row owner (writes stay with the SECURITY-DEFINER RPCs).
--
-- Fixes QA Wave A finding A-1 (CRITICAL) + A-2 (HIGH),
-- docs/audit/waveA_entitlement-rls.md  (2026-09-10)
--
-- THE BUG: these four tables each carry an `own_*` policy with `cmd = ALL`, whose
-- USING clause constrains ONLY `user_id` (= the caller). So an authenticated user
-- can INSERT/UPDATE their OWN rows directly via the REST API (the shipped anon key
-- + their JWT) and set e.g. student_achievement_progress.status = 'complete' for
-- any achievement_id. An AFTER-trigger then runs evaluate_user_credentials(), which
-- awards certificates/programs purely by counting status='complete' rows — so the
-- user FORGES credentials, bypassing the app UI and the gated RPCs.
--
-- THE FIX: replace each `own_*` ALL policy with a `FOR SELECT` policy (same USING),
-- so the owner can still READ its own rows but can no longer WRITE them directly.
-- All legitimate writes already go through SECURITY-DEFINER RPCs
-- (record_study_progress, submit_quiz, start_final_exam/submit_final_exam, the
-- evaluate_user_credentials trigger, award_complete), which run as the function
-- owner and BYPASS RLS — so they are unaffected.
--
-- WHY IT IS SAFE / NON-BREAKING:
--   1. The mobile client writes NONE of these tables directly — it only .select()s
--      them and mutates via supabase.rpc(...). (Verified in QA Wave A client scan.)
--   2. This exact model is already PROVEN in this database: final_exam_attempts and
--      final_exam_attempt_items have RLS enabled with NO client write policy at all,
--      and start_final_exam/submit_final_exam (definer) write them fine.
--   3. The admin_all_* (is_admin) and instr_read_* policies are LEFT UNTOUCHED.
--
-- Idempotent (DROP POLICY IF EXISTS … then CREATE). Touches NO table data — no
-- user's existing rows are changed; only the write permission is removed.
--
-- AFTER RUNNING: re-verify on device a full study -> quiz -> credential-award
-- journey (the definer RPCs should still record progress and award credentials
-- exactly as before), and confirm the forge no longer works (a direct PATCH to
-- /rest/v1/student_achievement_progress as a normal user should now be rejected).
-- ===========================================================================

begin;

-- 1) student_achievement_progress  (the forge vector feeding evaluate_user_credentials)
drop policy if exists own_achievement_progress on public.student_achievement_progress;
create policy own_achievement_progress on public.student_achievement_progress
  for select
  to public
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- 2) student_method_progress
drop policy if exists own_method_progress on public.student_method_progress;
create policy own_method_progress on public.student_method_progress
  for select
  to public
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- 3) student_badges  (self-grant of achievement/badge records)
drop policy if exists own_badges on public.student_badges;
create policy own_badges on public.student_badges
  for select
  to public
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- 4) quiz_attempts  (forge of attempt status/score rows)
--    NOTE: quiz_attempt_items already has only a SELECT policy (own_attempt_items)
--    + admin_all_qai, so it needs no change.
drop policy if exists own_quiz_attempts on public.quiz_attempts;
create policy own_quiz_attempts on public.quiz_attempts
  for select
  to public
  using (user_id = (select id from public.users where auth_id = auth.uid()));

commit;

-- ---------------------------------------------------------------------------
-- VERIFY (run after; expect cmd = 'SELECT' for each own_* policy, and the
-- admin_all_* policies still present):
-- ---------------------------------------------------------------------------
-- select tablename, policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('student_achievement_progress','student_method_progress',
--                     'student_badges','quiz_attempts')
-- order by tablename, cmd, policyname;
