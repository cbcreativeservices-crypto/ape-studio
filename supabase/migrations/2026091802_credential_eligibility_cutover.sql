-- ============================================================================
-- APE STUDIO · STAGE 2 — who awards a certificate.
-- 2026-09-18 · Run AFTER Stage 1 has committed and verified.
--
-- ⚠️ RUNNING THIS FILE STILL CHANGES NOTHING.
--
-- It replaces one function with a version that honours BOTH policies and picks
-- between them by reading `app_flags.certificate_requires_exam`, which Stage 1
-- created and set to FALSE. So installing it is a no-op you can verify at
-- leisure. The cutover is a separate one-line UPDATE at the bottom, and the
-- rollback is the same line with `false`.
--
-- That separation is deliberate. This is the highest-stakes behaviour in the
-- product, it is landing in launch week, and you should be able to reverse it
-- from your phone without a deploy.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- WHAT THE CURRENT FUNCTION DOES  (your Q10 output, 2026-09-18)
--
-- 1. Checks four co-requisites are complete — Safety, Grounding, Workplace,
--    and the Foundations lab. This part is RIGHT and is preserved untouched,
--    same four ids, same test.
--
-- 2. Then, for every active certificate whose topics are ALL complete:
--       INSERT INTO credential_awards (..., source) VALUES (..., 'auto')
--
--    No Final Exam check. No tenure check. The certificate is minted the
--    moment the last topic goes green — which is why start_final_exam answers
--    `already_earned`: the exam is refusing to start because the credential it
--    leads to has already been granted.
--
-- 3. Same again for programs.
--
-- WHAT THE NEW ONE DOES WHEN THE FLAG IS ON
--
-- Steps 1 and 3 are unchanged. Step 2 writes `credential_eligibility` instead
-- of `credential_awards` — "this person has finished the work", which is true,
-- and not "this person holds the credential", which is not yet.
--
-- ⚠️ PROGRAMS ARE DELIBERATELY LEFT ALONE. Your policy statement was about the
--    certificate path and the Final Exam that gates it. I have not assumed the
--    same rule applies to programs, because you did not say so and guessing
--    would silently change a second thing. If programs should behave the same
--    way, say so and it is a four-line change.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.evaluate_user_credentials(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_core boolean;
  v_requires_exam boolean;
BEGIN
  -- Which policy is live. Default FALSE — if the row or the table is missing
  -- for any reason, behave exactly as the app did before this change.
  SELECT coalesce(
           (SELECT enabled FROM public.app_flags WHERE key = 'certificate_requires_exam'),
           false)
    INTO v_requires_exam;

  -- requisites: Safety + Grounding + Workplace (draft) + Foundations lab (active) all complete
  -- UNCHANGED from the version running on 2026-09-18. Same four ids.
  SELECT (SELECT count(*) FROM student_achievement_progress p
          WHERE p.user_id=p_user AND p.status='complete'
            AND p.achievement_id IN (
              'e5451add-87f8-47f0-ba06-9a53d70bebe9',
              '041c8d66-5280-40b9-abdc-7b18202b684a',
              '89bd470d-e7fb-464b-874c-753f1d1db912',
              '7387db19-2fa5-4536-af25-25a5f725a484')) = 4
  INTO v_core;
  IF NOT v_core THEN RETURN; END IF;

  IF v_requires_exam THEN
    -- NEW POLICY: finishing the topics makes you ELIGIBLE. The Final Exam and
    -- one complete paid month turn eligibility into an award.
    INSERT INTO credential_eligibility (user_id, credential_type, credential_id)
    SELECT p_user, 'certificate', c.id
    FROM certificates c
    WHERE c.is_active
      AND NOT EXISTS (SELECT 1 FROM certificate_topics ct WHERE ct.certificate_id=c.id
          AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                          WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=ct.achievement_id))
    ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
  ELSE
    -- CURRENT POLICY, byte-for-byte as it runs today.
    INSERT INTO credential_awards (user_id, credential_type, credential_id, source)
    SELECT p_user, 'certificate', c.id, 'auto'
    FROM certificates c
    WHERE c.is_active
      AND NOT EXISTS (SELECT 1 FROM certificate_topics ct WHERE ct.certificate_id=c.id
          AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                          WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=ct.achievement_id))
    ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
  END IF;

  -- programs: all required (non-elective) topics complete + >=1 elective when electives exist
  -- UNCHANGED. See the note above about why programs are not being altered here.
  INSERT INTO credential_awards (user_id, credential_type, credential_id, source)
  SELECT p_user, 'program', pr.id, 'auto'
  FROM programs pr
  WHERE pr.is_active
    AND NOT EXISTS (SELECT 1 FROM program_topics pt WHERE pt.program_id=pr.id AND pt.is_elective=false
        AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                        WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=pt.achievement_id))
    AND (NOT EXISTS (SELECT 1 FROM program_topics pt WHERE pt.program_id=pr.id AND pt.is_elective)
         OR EXISTS (SELECT 1 FROM program_topics pt JOIN student_achievement_progress p ON p.achievement_id=pt.achievement_id
                    WHERE pt.program_id=pr.id AND pt.is_elective AND p.user_id=p_user AND p.status='complete'))
  ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
END
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- THE RELEASE PATH — what turns a held exam into a certificate
--
-- Two things must happen for an award: a PASSED exam, and a COMPLETE month.
-- They can happen in either order, so something has to run when the second one
-- lands. This is that something, for the case where the month finishes last.
--
-- Call it when a payment renews a membership (from validate-purchase, after it
-- writes member_since) and on a cheap schedule — a daily cron is plenty, the
-- boundary is a month.
--
-- ⚠️ THE ONE LINE I HAVE NOT WRITTEN is marked below. It needs the shape of
--    your final-exam attempts table, which is not in the repo and which I have
--    never seen. See the note at the end of this file.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.release_pending_credentials(p_user uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_released integer := 0;
BEGIN
  -- No month, nothing to release. This is the gate the whole policy rests on.
  IF NOT public.member_month_complete(p_user) THEN
    RETURN 0;
  END IF;

  -- ⚠️ INCOMPLETE — the passed-exam test goes here.
  --
  -- The intent, in words: award every certificate this user is eligible for
  -- AND has passed the Final Exam for. Something like:
  --
  --   INSERT INTO credential_awards (user_id, credential_type, credential_id, source)
  --   SELECT ce.user_id, ce.credential_type, ce.credential_id, 'exam'
  --     FROM credential_eligibility ce
  --    WHERE ce.user_id = p_user
  --      AND ce.credential_type = 'certificate'
  --      AND EXISTS (SELECT 1 FROM <final_exam_attempts> a
  --                   WHERE a.user_id = p_user
  --                     AND a.award_id = ce.credential_id
  --                     AND a.outcome  = 'pass')
  --   ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
  --   GET DIAGNOSTICS v_released = ROW_COUNT;
  --
  -- I have not written it as live SQL because I would be guessing at the table
  -- name, the column that holds the award id, and how a pass is recorded. A
  -- wrong guess here either awards nothing forever or awards on a failed paper.
  -- Run the query at the end of this file and I will finish it in one line.

  RETURN v_released;
END
$$;

revoke all on function public.release_pending_credentials(uuid) from public;
grant execute on function public.release_pending_credentials(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- THE CANCELLATION RULE — "the exam is wiped, not graded, not applied"
--
-- Your words. If somebody ends their membership before the month completes,
-- the paper they sat is discarded: not graded, not applied, and not counted
-- against them as an attempt they have used.
--
-- This discards the ELIGIBILITY and returns how many rows it touched, so the
-- caller can log it. It deliberately does NOT touch `credential_awards` — a
-- credential that was properly awarded before a later refund is a separate
-- decision (revocation), and conflating the two would let a refund silently
-- strip a certificate somebody legitimately earned months earlier.
--
-- Called from store-notifications on a confirmed refund, and from
-- validate-purchase when it resets a lapsed run.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.discard_unreleased_credentials(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_discarded integer := 0;
BEGIN
  -- Only while the month is INCOMPLETE. Someone who finished their month and
  -- then cancelled has earned what they earned.
  IF public.member_month_complete(p_user) THEN
    RETURN 0;
  END IF;

  DELETE FROM credential_eligibility
   WHERE user_id = p_user;
  GET DIAGNOSTICS v_discarded = ROW_COUNT;

  RETURN v_discarded;
END
$$;

revoke all on function public.discard_unreleased_credentials(uuid) from public;
-- Server-side only: no client should be able to discard anybody's progress.


-- ============================================================================
-- VERIFY — the install changed nothing
-- ============================================================================

select key, enabled from public.app_flags where key = 'certificate_requires_exam';
-- EXPECT: false. If this is true, you have already cut over.

select count(*) as eligibility_rows from public.credential_eligibility;
-- EXPECT: 0. Nothing writes it while the flag is false.

select count(*) as awards_total from public.credential_awards;
-- EXPECT: unchanged from before Stage 2.


-- ============================================================================
-- THE CUTOVER — one line. Do NOT run it yet.
-- ============================================================================
--
-- Run this only when ALL of the following are true:
--   1. release_pending_credentials is finished (the marked line above).
--   2. submit_final_exam awards on a pass when the month is already complete.
--   3. You have decided the backfill question at the end of Stage 1.
--
--   update public.app_flags
--      set enabled = true, updated_at = now()
--    where key = 'certificate_requires_exam';
--
-- ROLLBACK — the same line, and it is instant:
--
--   update public.app_flags
--      set enabled = false, updated_at = now()
--    where key = 'certificate_requires_exam';
--
-- Rolling back leaves any credential_eligibility rows in place. They are
-- harmless — nothing reads them while the flag is off — and they are exactly
-- what you want if you roll forward again.
-- ============================================================================


-- ============================================================================
-- WHAT I NEED TO FINISH THIS — run these three, send me the output
-- ============================================================================

-- 1 · the exam functions, so I can write the award into the right one rather
--     than bolting it on beside them
select prosrc from pg_proc
 where proname in ('start_final_exam','submit_final_exam')
   and pronamespace = 'public'::regnamespace;

-- 2 · where an attempt lives, and how a pass is recorded
select table_name, column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name ilike '%exam%'
 order by table_name, ordinal_position;

-- 3 · what credential_awards actually looks like, so the award insert matches
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'credential_awards'
 order by ordinal_position;

select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.credential_awards'::regclass;
-- ============================================================================
