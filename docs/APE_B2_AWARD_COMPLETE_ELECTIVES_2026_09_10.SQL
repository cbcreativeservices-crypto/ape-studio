-- ===========================================================================
-- APE — B-2 FIX (DRAFT — NOT CURRENTLY REQUIRED): make program "complete"
-- elective-aware. QA Wave B finding B-2, docs/audit/waveB_data-integrity-calc.md
--
-- ⚠️ VERIFIED 2026-09-10: ALL 37 active programs have ZERO elective topics
-- (every program_topics row is_elective = false). With no electives,
-- award_complete's current "all topics" rule ALREADY equals the elective-aware
-- rule below — so THIS CHANGES NOTHING TODAY and is NOT needed yet. Keep it as
-- future-proofing: apply it IF/WHEN a program is ever given elective topics, so
-- award_complete + start_final_exam + the client stay aligned with
-- evaluate_user_credentials() (which already uses the elective rule). The SQL is
-- correct as written; there is simply no live bug to fix until electives exist.
--
-- ⚠️ CONFIRM THE INTENDED RULE BEFORE RUNNING. This assumes the rule that the
-- `is_elective` column and `evaluate_user_credentials()` already imply:
--
--     A PROGRAM is complete when ALL NON-ELECTIVE topics are complete
--     AND (the program has no electives OR at least ONE elective is complete).
--     A CERTIFICATE is complete when ALL its topics are complete (no electives).
--     Standing co-requisites (award_standing_requirements, active curriculum)
--     are always required.
--
-- THE BUG: `award_complete()` (and therefore `start_final_exam`'s eligibility
-- gate, and the client's progress checklist that mirrors it) currently require
-- EVERY topic returned by award_required_topics(), which includes ALL electives.
-- So a user who is actually eligible (all required + 1 elective) — and may even
-- have been AUTO-AWARDED the credential by evaluate_user_credentials() — is told
-- the program is incomplete and cannot start the Final Exam. The two backend
-- rules disagree; this aligns award_complete() with evaluate_user_credentials().
--
-- WHY THIS SHAPE (safest):
--   • CREATE OR REPLACE on award_complete() only — SAME signature
--     (uuid, text, uuid) -> boolean. No DROP, no dependency risk.
--   • award_required_topics() is LEFT UNTOUCHED — start_final_exam still uses it
--     (unchanged) to build the exam pool + activity check from the full topic set
--     (the exam may legitimately draw from elective topics).
--   • start_final_exam's gate `IF NOT award_complete(...)` is fixed automatically.
--   • Mirrors evaluate_user_credentials() exactly for cert/program, and preserves
--     award_complete's existing standing-co-req requirement (via
--     award_standing_requirements, same source award_required_topics unions).
--
-- Idempotent. Touches no row data. SEMANTICS CHANGE on the credential/exam path —
-- device-verify after (see the companion client change + the checklist below).
-- ===========================================================================

create or replace function public.award_complete(p_user uuid, p_award_type text, p_award_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select
    -- (1) all standing co-requisites (active curriculum) complete
    not exists (
      select 1
      from award_standing_requirements asr
      join curriculum_versions cv on cv.id = asr.curriculum_version_id and cv.status = 'active'
      left join student_achievement_progress sap
        on sap.user_id = p_user and sap.achievement_id = asr.achievement_id
      where coalesce(sap.status, '') <> 'complete'
    )
    and case p_award_type
      -- (2a) CERTIFICATE: every certificate topic complete
      when 'certificate' then not exists (
        select 1
        from certificate_topics ct
        left join student_achievement_progress sap
          on sap.user_id = p_user and sap.achievement_id = ct.achievement_id
        where ct.certificate_id = p_award_id
          and coalesce(sap.status, '') <> 'complete'
      )
      -- (2b) PROGRAM: all NON-elective topics complete, AND (no electives OR >=1 elective complete)
      when 'program' then (
        not exists (
          select 1
          from program_topics pt
          left join student_achievement_progress sap
            on sap.user_id = p_user and sap.achievement_id = pt.achievement_id
          where pt.program_id = p_award_id
            and pt.is_elective = false
            and coalesce(sap.status, '') <> 'complete'
        )
        and (
          not exists (select 1 from program_topics pt where pt.program_id = p_award_id and pt.is_elective)
          or exists (
            select 1
            from program_topics pt
            join student_achievement_progress sap
              on sap.user_id = p_user and sap.achievement_id = pt.achievement_id
            where pt.program_id = p_award_id and pt.is_elective and sap.status = 'complete'
          )
        )
      )
      else false
    end
$function$;

-- The client (fetchAwardProgress) will CALL this RPC for the eligibility gate, so
-- ensure it's callable by signed-in users (it was previously only invoked
-- server-side by start_final_exam). Safe to re-run.
grant execute on function public.award_complete(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- VERIFY after running:
--   1. A program with electives where you've done all required + 1 elective:
--        select public.award_complete('<your users.id>', 'program', '<program_id>');
--      -> should now return TRUE (was FALSE).
--   2. A program missing a REQUIRED (non-elective) topic: still FALSE.
--   3. A certificate: unchanged (all topics required).
-- ---------------------------------------------------------------------------
