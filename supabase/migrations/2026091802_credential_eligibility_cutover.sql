-- ============================================================================
-- APE STUDIO · STAGE 2 — who awards a certificate, and when.
-- 2026-09-18 · Run AFTER Stage 0 and Stage 1 have committed and verified.
--
-- ⚠️ RUNNING THIS FILE STILL CHANGES NOTHING.
--
-- Every behavioural branch below is gated on `app_flags.certificate_requires_exam`,
-- which Stage 1 creates and sets FALSE. Installing these functions is a no-op
-- you can verify at leisure. The cutover is one UPDATE at the bottom; the
-- rollback is the same line with `false`.
--
-- ============================================================================
-- WHAT THE LIVE DATABASE ACTUALLY SAID  (read 2026-09-18)
-- ============================================================================
--
--   final_exam_attempts ................ 0 rows
--   credential_awards .................. 125 rows
--     └─ source='auto'   (topic completion) ... 125
--     └─ source='earned' (exam pass) ..........   0
--
-- Nobody has ever sat a Final Exam. Every credential this product has ever
-- issued came from finishing topics. The exam has awarded nothing, ever.
--
-- AND HERE IS WHY IT CANNOT. `start_final_exam` contains:
--
--     IF EXISTS(SELECT 1 FROM credential_awards WHERE user_id=v_user
--                AND credential_type=p_award_type AND credential_id=p_award_id
--                AND revoked_at IS NULL) THEN RAISE EXCEPTION 'already_earned'; END IF;
--
-- and it sits BELOW `award_complete(...)`, which requires every topic to be
-- finished. So the sequence is:
--
--     finish the last topic
--       → the trigger fires evaluate_user_credentials
--       → it inserts the certificate with source='auto'
--       → the learner opens the Final Exam
--       → start_final_exam sees that award and raises 'already_earned'
--
-- The exam is refused because the thing it leads to has already been given
-- away. It is not that the exam is optional — it is UNREACHABLE, by
-- construction, for exactly the people qualified to sit it.
--
-- That single INSERT is the whole problem, and removing it fixes the exam, the
-- tenure rule and the owner's policy in one move.
--
-- GOOD NEWS IN THE OTHER DIRECTION: `submit_final_exam` ALREADY awards on a
-- pass, with source='earned'. The award path the policy needs is built and
-- correct. It has simply never been reachable. What it lacks is the tenure
-- gate, which is added below.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1 · evaluate_user_credentials — record eligibility, do not award
--
-- Preserved byte-for-byte from the live function: the four co-requisite ids,
-- the certificate topic test, and the ENTIRE programs branch.
--
-- ⚠️ PROGRAMS ARE DELIBERATELY UNCHANGED. The owner's policy statement was
--    about the certificate path and the Final Exam that gates it. Extending it
--    to programs would silently change a second thing nobody asked for. If it
--    should apply there too, it is the same four-line edit.
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
  -- Which policy is live. Defaults FALSE: if the flag row or the whole table is
  -- missing for any reason, behave exactly as the app did before this change.
  SELECT coalesce((SELECT enabled FROM public.app_flags
                    WHERE key = 'certificate_requires_exam'), false)
    INTO v_requires_exam;

  -- requisites: Safety + Grounding + Workplace (draft) + Foundations lab (active) all complete
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
    -- Finishing the topics makes you ELIGIBLE. The Final Exam and one complete
    -- paid month turn eligibility into an award.
    INSERT INTO credential_eligibility (user_id, credential_type, credential_id)
    SELECT p_user, 'certificate', c.id
    FROM certificates c
    WHERE c.is_active
      AND NOT EXISTS (SELECT 1 FROM certificate_topics ct WHERE ct.certificate_id=c.id
          AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                          WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=ct.achievement_id))
    ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
  ELSE
    -- Current behaviour, byte-for-byte.
    INSERT INTO credential_awards (user_id, credential_type, credential_id, source)
    SELECT p_user, 'certificate', c.id, 'auto'
    FROM certificates c
    WHERE c.is_active
      AND NOT EXISTS (SELECT 1 FROM certificate_topics ct WHERE ct.certificate_id=c.id
          AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                          WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=ct.achievement_id))
    ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
  END IF;

  -- programs: unchanged in both branches. See the note above.
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
-- 2 · submit_final_exam — grade always, release only when the month is done
--
-- The owner's rule: "They can continue to proceed with the final exam, but
-- results are not released until the first month is completed. Then graded,
-- then awarded."
--
-- HOW THAT IS IMPLEMENTED, AND WHY THIS WAY. The paper is graded AT SUBMIT,
-- while the served questions and correct answers are sitting right there in
-- `final_exam_attempt_items`. Deferring the grading itself would mean grading
-- against a question pool that may have moved — content gets edited, questions
-- get retired — and the learner would be marked against a paper they did not
-- sit. So: graded now, RELEASED later. The learner sees nothing either way,
-- which is what "not released" means to them.
--
-- The true score, pass flag and wrong answers are written to their own columns
-- as always. Only `result_payload` — the thing the client is handed — is
-- redacted while held. `release_pending_credentials` rebuilds the real payload
-- from those columns when the month completes.
--
-- `attempt_status` has NO check constraint (verified 2026-09-18), so adding
-- 'held' is safe. That was checked deliberately: an unchecked assumption about
-- exactly this kind of constraint is why every refund write is currently being
-- rejected.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.submit_final_exam(
  p_attempt_id uuid,
  p_answers jsonb,
  p_submitted_at timestamptz,
  p_submitted_offline boolean,
  p_focus_loss_count integer,
  p_focus_loss_duration integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
DECLARE v_user uuid; a final_exam_attempts%ROWTYPE; v_n int; v_pass_mark int; v_score int := 0; v_wrong jsonb := '{}'::jsonb;
        v_sel jsonb; v_ok boolean; it record; v_timed_out boolean; v_focus_void boolean;
        v_status text; v_outcome text; v_lock timestamptz := null; v_passed boolean := false; v_awarded boolean := false; v_payload jsonb;
        v_requires_exam boolean; v_month_ok boolean; v_held boolean := false;
BEGIN
  SELECT id INTO v_user FROM users WHERE auth_id=auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  SELECT * INTO a FROM final_exam_attempts WHERE id=p_attempt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
  IF a.user_id <> v_user THEN RAISE EXCEPTION 'not_owner'; END IF;
  IF a.result_payload IS NOT NULL THEN RETURN a.result_payload; END IF;         -- idempotent
  IF a.attempt_status <> 'in_progress' THEN RAISE EXCEPTION 'attempt_not_open'; END IF;

  v_timed_out := (p_submitted_at - a.started_at) > interval '602 seconds';
  v_focus_void := (COALESCE(p_focus_loss_count,0) >= 2);
  SELECT count(*) INTO v_n FROM final_exam_attempt_items WHERE attempt_id=p_attempt_id;
  IF v_n < 1 THEN RAISE EXCEPTION 'bad_serve_set'; END IF;
  v_pass_mark := greatest(1, v_n - 2);

  FOR it IN SELECT id, slot_index, served_question_type, served_correct_answers
            FROM final_exam_attempt_items WHERE attempt_id=p_attempt_id LOOP
    v_sel := p_answers -> it.slot_index::text;
    v_ok := grade_one(it.served_question_type, v_sel, it.served_correct_answers);
    UPDATE final_exam_attempt_items SET selected_answer=v_sel, is_correct=v_ok WHERE id=it.id;
    IF v_ok THEN v_score := v_score + 1;
    ELSE v_wrong := v_wrong || jsonb_build_object(it.slot_index::text, jsonb_build_object('correct',it.served_correct_answers,'selected',v_sel)); END IF;
  END LOOP;

  IF v_focus_void THEN v_status:='voided'; v_outcome:='voided'; v_lock:=now()+interval '15 minutes';
  ELSIF v_timed_out THEN v_status:='timed_out'; v_outcome:='timed_out';
  ELSE v_status:='submitted'; v_passed := (v_score >= v_pass_mark); v_outcome := CASE WHEN v_passed THEN 'pass' ELSE 'no_pass' END; END IF;

  -- ── THE TENURE GATE ────────────────────────────────────────────────────
  -- Only consulted for a completed sitting. A voided or timed-out attempt is
  -- not held for anything: it is finished, and the learner should be told so
  -- immediately rather than waiting a month to hear it.
  SELECT coalesce((SELECT enabled FROM public.app_flags
                    WHERE key = 'certificate_requires_exam'), false)
    INTO v_requires_exam;

  IF v_status='submitted' THEN
    IF v_requires_exam THEN
      v_month_ok := public.member_month_complete(auth.uid());
      -- HELD covers pass AND fail. Releasing a failure early would leak the
      -- result the rule says is not released, and would also let somebody
      -- discover their score and cancel before the month completes.
      v_held := NOT v_month_ok;
    ELSE
      v_month_ok := true;
    END IF;

    IF v_passed AND v_month_ok THEN
      INSERT INTO credential_awards(user_id,credential_type,credential_id,earned_at,issued_at,source)
      VALUES (v_user,a.award_type,a.award_id,now(),now(),'earned')
      ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
      v_awarded := true;
    END IF;
  END IF;

  IF v_held THEN
    v_status := 'held';
    -- Redacted ON PURPOSE. No score, no pass flag, no wrong answers — the true
    -- values go to their own columns below and are rebuilt on release.
    v_payload := jsonb_build_object('attempt_id',p_attempt_id,'award_type',a.award_type,'award_id',a.award_id,
      'outcome','held','held',true,'credential_awarded',false,'size',v_n);
  ELSE
    v_payload := jsonb_build_object('attempt_id',p_attempt_id,'award_type',a.award_type,'award_id',a.award_id,
      'score',v_score,'size',v_n,'pass_mark',v_pass_mark,'passed',v_passed,'outcome',v_outcome,
      'credential_awarded',v_awarded,'wrong_answers',v_wrong,'lockout_until',v_lock);
  END IF;

  UPDATE final_exam_attempts SET score=v_score, passed=v_passed, answers_json=p_answers, wrong_answers=v_wrong,
    submitted_at=p_submitted_at, submitted_offline=p_submitted_offline, focus_loss_count=p_focus_loss_count,
    focus_loss_duration=p_focus_loss_duration, voided=(v_status='voided'),
    void_reason=CASE v_status WHEN 'voided' THEN 'focus_loss' WHEN 'timed_out' THEN 'timeout' ELSE null END,
    attempt_status=v_status, lockout_until=v_lock, result_payload=v_payload WHERE id=p_attempt_id;
  RETURN v_payload;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- 3 · release_pending_credentials — the month finished last
--
-- Call it when a payment renews a membership (validate-purchase, after it
-- writes member_since) and on a daily cron. The boundary is a month; a day of
-- latency is immaterial and a cheap schedule is the right one.
--
-- Takes the AUTH id, like member_month_complete, and resolves users.id itself.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.release_pending_credentials(p_uid uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path = public
as $$
DECLARE v_user uuid; v_released integer := 0; r record; v_payload jsonb;
BEGIN
  SELECT id INTO v_user FROM users WHERE auth_id = p_uid;
  IF v_user IS NULL THEN RETURN 0; END IF;

  -- The gate the whole policy rests on.
  IF NOT public.member_month_complete(p_uid) THEN RETURN 0; END IF;

  FOR r IN
    SELECT * FROM final_exam_attempts
     WHERE user_id = v_user AND attempt_status = 'held'
     ORDER BY submitted_at
  LOOP
    IF r.passed THEN
      INSERT INTO credential_awards(user_id,credential_type,credential_id,earned_at,issued_at,source)
      VALUES (v_user, r.award_type, r.award_id, r.submitted_at, now(), 'earned')
      ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
      -- earned_at is the day they SAT it, not the day we got round to
      -- releasing it. The certificate should not read as if they took a month.
      v_released := v_released + 1;
    END IF;

    -- Rebuild the real payload from the columns that were never redacted.
    v_payload := jsonb_build_object('attempt_id',r.id,'award_type',r.award_type,'award_id',r.award_id,
      'score',r.score,'size',r.size,'pass_mark',greatest(1, r.size - 2),'passed',r.passed,
      'outcome',CASE WHEN r.passed THEN 'pass' ELSE 'no_pass' END,
      'credential_awarded',r.passed,'wrong_answers',coalesce(r.wrong_answers,'{}'::jsonb),'lockout_until',null);

    UPDATE final_exam_attempts
       SET attempt_status = 'submitted', result_payload = v_payload
     WHERE id = r.id;
  END LOOP;

  RETURN v_released;
END;
$$;

revoke all on function public.release_pending_credentials(uuid) from public;
grant execute on function public.release_pending_credentials(uuid) to authenticated;

comment on function public.release_pending_credentials(uuid) is
  'Releases exams held pending the one-month rule: awards the passes, un-redacts every held result. Safe to call repeatedly; a no-op until the month completes.';


-- ─────────────────────────────────────────────────────────────────────────
-- 4 · discard_unreleased_credentials — "the exam is wiped, not graded,
--     and not applied"
--
-- The owner's words, for somebody who ends their membership before the month
-- completes. Called from store-notifications on a confirmed refund, and from
-- validate-purchase when it resets a lapsed run.
--
-- It does NOT touch credential_awards. A credential properly earned before a
-- later refund is a revocation decision, and conflating the two would let a
-- refund silently strip a certificate somebody earned months earlier.
--
-- The attempt row is kept, marked 'discarded'. Deleting it would destroy the
-- record that they sat it at all — and `attempt_number` is derived from
-- max(attempt_number), so a delete would also quietly hand back an attempt.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.discard_unreleased_credentials(p_uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
DECLARE v_user uuid; v_discarded integer := 0;
BEGIN
  SELECT id INTO v_user FROM users WHERE auth_id = p_uid;
  IF v_user IS NULL THEN RETURN 0; END IF;

  -- Only while the month is INCOMPLETE. Someone who finished their month and
  -- then cancelled has earned what they earned.
  IF public.member_month_complete(p_uid) THEN RETURN 0; END IF;

  UPDATE final_exam_attempts
     SET attempt_status = 'discarded',
         void_reason    = 'membership_ended_before_month_complete',
         result_payload = jsonb_build_object(
           'attempt_id', id, 'award_type', award_type, 'award_id', award_id,
           'outcome', 'discarded', 'credential_awarded', false)
   WHERE user_id = v_user AND attempt_status = 'held';
  GET DIAGNOSTICS v_discarded = ROW_COUNT;

  DELETE FROM credential_eligibility WHERE user_id = v_user;

  RETURN v_discarded;
END;
$$;

revoke all on function public.discard_unreleased_credentials(uuid) from public;
-- Server-side only: no client may discard anybody's work.


-- ============================================================================
-- VERIFY — the install changed nothing
-- ============================================================================

select key, enabled from public.app_flags where key = 'certificate_requires_exam';
-- EXPECT: false.

select count(*) as awards_total, count(*) filter (where source='auto') as auto
  from public.credential_awards;
-- EXPECT: 125 / 125, unchanged.

select count(*) as eligibility_rows from public.credential_eligibility;
-- EXPECT: 0.


-- ============================================================================
-- BEFORE YOU CUT OVER — one decision about the 125 existing awards
-- ============================================================================
--
-- All 125 were minted by topic completion, before any exam existed. Flipping
-- the flag does NOT remove them, and `start_final_exam` still raises
-- 'already_earned' for anyone holding one. So those users can never sit the
-- exam for those certificates.
--
-- On the seeded test accounts that is fine and probably what you want. Check
-- who actually holds them before deciding:
--
--   select u.email, count(*) as awards
--     from credential_awards ca join users u on u.id = ca.user_id
--    where ca.source = 'auto' and ca.revoked_at is null
--    group by 1 order by 2 desc;
--
-- If they are all test accounts: leave them, or clear them so the accounts can
-- exercise the real path:
--
--   -- delete from credential_awards where source='auto';   -- ⚠️ destructive
--
-- If any belong to a REAL customer: leave them. Grandfather them. Taking back
-- a certificate somebody was told they had earned is not a launch-week move.
-- ============================================================================


-- ============================================================================
-- THE CUTOVER — one line. Do NOT run it until the client ships too.
-- ============================================================================
--
-- ⚠️ THE CLIENT NEEDS ONE CHANGE FIRST. `ExamOutcome` in
--    src/features/finalExam/api.ts is 'pass' | 'no_pass' | 'voided' |
--    'timed_out'. This adds 'held', and the result screen has to render it as
--    "your paper is held until <date>" rather than falling through to a score
--    it was not given.
--
--   update public.app_flags
--      set enabled = true, updated_at = now()
--    where key = 'certificate_requires_exam';
--
-- ROLLBACK — instant, and it is the same line:
--
--   update public.app_flags
--      set enabled = false, updated_at = now()
--    where key = 'certificate_requires_exam';
--
-- Rolling back leaves credential_eligibility rows in place. Harmless, unread
-- while the flag is off, and exactly what you want if you roll forward again.
-- Any attempt already 'held' stays held until the month completes — rolling
-- back does not release it early, which is correct: the rule applied when they
-- sat it.
-- ============================================================================
