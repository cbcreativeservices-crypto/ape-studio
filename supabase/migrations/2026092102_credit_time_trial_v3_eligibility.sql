-- credit_time_trial: teach it the v3 curriculum.
--
-- ⛔ THE BUG. Passing a Time Trial has never credited anything, for anyone,
-- on any v3 topic — and the result panel says "This study method is cleared
-- toward unlocking the quiz" while it happens.
--
-- The function only ever implemented the RETIRED course model. Its first
-- eligibility line is:
--
--     IF v_course IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
--
-- and every one of the 175 v3 topics has `course_id IS NULL`, because v3
-- replaced courses with My Enrollments (user_topic_enrollments). So the
-- function throws on its first check, always. `record_study_progress` was
-- given a v3 branch when the model changed; this one was missed, and it is
-- the only other place that writes study credit.
--
-- The throw is invisible to the learner: recordTimeTrialPass swallows the
-- error by design so a failed credit never interrupts study. So the app
-- promises a reward, the server refuses it, and nobody is told.
--
-- Verified against production 2026-09-21 before writing this:
--   • 175 of 175 v3 topics have course_id IS NULL      → always 'not_enrolled'
--   • applicable_methods IS correctly populated for v3 → not a second wall
--     (172 carry all four methods, 2 carry three, 1 is empty — see below)
--   • the client sends the STUDY method key (flashcards / matching /
--     fill_in_blank / scenarios), never a literal 'time_trial', so the
--     applicable_methods check is the right check and stays.
--
-- ⚠️ ONE TOPIC WILL STILL REFUSE, CORRECTLY: a single v3 achievement has an
-- empty applicable_methods, so it fails 'method_not_applicable'. That is
-- fail-closed behaviour on a content gap, not this bug, and it is left alone
-- deliberately rather than papered over here.
--
-- The eligibility block below is copied from record_study_progress so the two
-- writers agree. Divergence between them IS the bug being fixed, so keep them
-- in step: always_free → any signed-in user; v3 → academy access plus a
-- My Enrollments row; legacy → the old course/enrollment/lock checks.

CREATE OR REPLACE FUNCTION public.credit_time_trial(p_achievement_id uuid, p_method_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET statement_timeout TO '15s'
AS $function$
DECLARE
  v_user uuid; v_course uuid; v_ach_cvid uuid; v_enr_cvid uuid; v_status text;
  v_applicable text[]; v_req_passes int; v_free boolean;
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
BEGIN
  -- 1. caller
  SELECT id INTO v_user FROM users WHERE auth_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;

  -- 2. method must exist
  SELECT required_passes INTO v_req_passes FROM study_methods WHERE key = p_method_key;
  IF v_req_passes IS NULL THEN RAISE EXCEPTION 'invalid_method'; END IF;

  -- 3. eligibility (fail-closed) — mirrors record_study_progress exactly
  SELECT a.course_id, a.curriculum_version_id, a.applicable_methods, a.always_free
    INTO v_course, v_ach_cvid, v_applicable, v_free
  FROM achievements a WHERE a.id = p_achievement_id;
  IF v_ach_cvid IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;

  IF COALESCE(v_free, false) THEN
    -- always_free (owner 2026-08-17): any signed-in user records progress.
    IF v_ach_cvid = c_v3 THEN
      INSERT INTO student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
      VALUES (v_user, p_achievement_id, 'unlocked', 0, 0, 0) ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  ELSIF v_ach_cvid = c_v3 THEN
    -- v3: My Enrollments is the gate (+ paywall). No course / progression.
    IF NOT public.has_academy_access(auth.uid()) THEN
      RAISE EXCEPTION 'academy_required'; END IF;
    IF NOT EXISTS (SELECT 1 FROM user_topic_enrollments ute
                   WHERE ute.user_id = v_user AND ute.achievement_id = p_achievement_id) THEN
      RAISE EXCEPTION 'not_enrolled'; END IF;
    INSERT INTO student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
    VALUES (v_user, p_achievement_id, 'unlocked', 0, 0, 0) ON CONFLICT (user_id, achievement_id) DO NOTHING;
  ELSE
    IF v_course IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
    SELECT e.curriculum_version_id INTO v_enr_cvid
    FROM enrollment e WHERE e.user_id = v_user AND e.course_id = v_course;
    IF v_enr_cvid IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
    IF v_enr_cvid IS DISTINCT FROM v_ach_cvid THEN RAISE EXCEPTION 'version_mismatch'; END IF;
    SELECT status INTO v_status FROM student_achievement_progress
    WHERE user_id = v_user AND achievement_id = p_achievement_id;
    IF v_status IS NULL OR v_status = 'locked' THEN RAISE EXCEPTION 'topic_locked'; END IF;
  END IF;

  -- The trial must be on a method this topic actually offers. Applies to
  -- every branch — a free topic is not an unguarded one.
  IF NOT (p_method_key = ANY(COALESCE(v_applicable, ARRAY[]::text[]))) THEN
    RAISE EXCEPTION 'method_not_applicable'; END IF;

  -- 4. upsert the row if missing, then flag trial_passed (idempotent)
  INSERT INTO student_method_progress
    (user_id, achievement_id, method_key, is_applicable,
     completion_pct, engagement_seconds, answered_count, correct_count)
  VALUES (v_user, p_achievement_id, p_method_key, true, 0, 0, 0, 0)
  ON CONFLICT (user_id, achievement_id, method_key) DO NOTHING;

  UPDATE student_method_progress
     SET trial_passed = true
   WHERE user_id = v_user AND achievement_id = p_achievement_id
     AND method_key = p_method_key;

  RETURN jsonb_build_object('trial_passed', true, 'method_key', p_method_key);
END; $function$;
