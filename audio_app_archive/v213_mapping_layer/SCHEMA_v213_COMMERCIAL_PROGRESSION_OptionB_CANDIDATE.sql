-- =====================================================================
-- SCHEMA_v213_COMMERCIAL_PROGRESSION_OptionB_CANDIDATE.sql
-- Option B: commercial quiz/progression support. Parallel public-course clamp +
-- SURGICAL audience branches in start_quiz_attempt (v3) and submit_quiz (v8.4).
-- STATUS: CANDIDATE — NOT DEPLOYED. Integrity-critical (grading/gating/progression).
--   Requires a full INSTITUTIONAL REGRESSION (byte-identical behavior for audience='institutional')
--   + a commercial matrix before any prod go-ahead. Supabase native branching is unusable for this
--   project, so verification path is a decision (throwaway clone vs careful prod+rollback).
-- BASELINE: start_quiz_attempt (2-arg v2) + submit_quiz v8.3, pulled verbatim from live 2026-07-11.
-- GRADER MATH IS UNTOUCHED. Only the enrollment guard, the passed_incomplete SCOPE, and the
--   reachability call are audience-branched. Everything else is byte-identical to the deployed bodies.
-- KEY MODEL FACTS (verified): student_achievement_progress is one row per (user, achievement) →
--   best_genuine_score + completion are shared; each non-Safety achievement has exactly ONE primary
--   public-course home (public_course_topics.placement='primary'), so the public course for an
--   attempt is DERIVED from that primary row (no new RPC param / no client contract change).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. current_curriculum_version() — the live curriculum version (single active today).
--    Derived from the Safety prerequisite (gs0), which always exists.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_curriculum_version()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
  SELECT curriculum_version_id FROM public.achievements WHERE global_sequence = 0 LIMIT 1;
$fn$;
REVOKE ALL ON FUNCTION public.current_curriculum_version() FROM public;
GRANT EXECUTE ON FUNCTION public.current_curriculum_version() TO authenticated;

-- ---------------------------------------------------------------------
-- 2. commercial_topic_unlocked(user, public_course, achievement) — READ-ONLY clamp check.
--    Unlock rule mirrors recompute_reachability but ordered by public_course_topics.seq and
--    derived from best_genuine_score (monotonic; never from a demotable status):
--      - contiguous-complete prefix K = largest seq S such that every topic with seq<=S has best>=24;
--      - topic is unlocked if its seq <= K+1 (next after the complete prefix), OR
--      - one-ahead: the topic at seq K+1 is a partial (best in 20..23) and this topic is at seq K+2.
--    Free topics (gs0, gs36) are handled by the callers as always-startable; this fn is for paid topics.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commercial_topic_unlocked(p_user uuid, p_public_course uuid, p_achievement uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $fn$
DECLARE
  v_target_seq int;
  v_k int;              -- contiguous-complete prefix (by seq)
  v_next_partial boolean;
BEGIN
  SELECT pct.seq INTO v_target_seq
  FROM public.public_course_topics pct
  WHERE pct.public_course_id = p_public_course AND pct.achievement_id = p_achievement;
  IF v_target_seq IS NULL THEN RETURN false; END IF;              -- topic not in this course

  -- K = highest seq S with no incomplete (best<24) topic at seq<=S
  WITH ord AS (
    SELECT pct.seq,
           COALESCE(sap.best_genuine_score,0) AS best
    FROM public.public_course_topics pct
    LEFT JOIN public.student_achievement_progress sap
      ON sap.user_id = p_user AND sap.achievement_id = pct.achievement_id
    WHERE pct.public_course_id = p_public_course
  )
  SELECT COALESCE(MAX(o.seq),0) INTO v_k
  FROM ord o
  WHERE o.best >= 24
    AND NOT EXISTS (SELECT 1 FROM ord x WHERE x.seq <= o.seq AND x.best < 24);

  IF v_target_seq <= v_k + 1 THEN RETURN true; END IF;

  -- one-ahead: seq K+1 is a partial (20..23) -> seq K+2 also open
  SELECT (COALESCE(sap.best_genuine_score,0) BETWEEN 20 AND 23) INTO v_next_partial
  FROM public.public_course_topics pct
  LEFT JOIN public.student_achievement_progress sap
    ON sap.user_id = p_user AND sap.achievement_id = pct.achievement_id
  WHERE pct.public_course_id = p_public_course AND pct.seq = v_k + 1;

  RETURN (COALESCE(v_next_partial,false) AND v_target_seq = v_k + 2);
END; $fn$;
REVOKE ALL ON FUNCTION public.commercial_topic_unlocked(uuid,uuid,uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.commercial_topic_unlocked(uuid,uuid,uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. recompute_reachability_commercial(user, public_course) — WRITE clamp advance, public-seq order.
--    Same shape/semantics as recompute_reachability but ordered by public_course_topics.seq and
--    scoped to the public course. Only ever unlocks (never re-locks). Returns unlocked ids + clamped.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_reachability_commercial(p_user uuid, p_public_course uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE
  v_k int; v_k1 record; v_k2 record;
  v_unlocked uuid[] := '{}'; v_clamped boolean := false;
BEGIN
  CREATE TEMP TABLE _cord ON COMMIT DROP AS
    SELECT row_number() OVER (ORDER BY pct.seq) AS rn,
           pct.achievement_id AS id,
           COALESCE(sap.status,'locked') AS status
    FROM public.public_course_topics pct
    LEFT JOIN public.student_achievement_progress sap
      ON sap.user_id = p_user AND sap.achievement_id = pct.achievement_id
    WHERE pct.public_course_id = p_public_course;

  SELECT COALESCE(MAX(o.rn),0) INTO v_k
  FROM _cord o
  WHERE o.status='complete'
    AND NOT EXISTS (SELECT 1 FROM _cord x WHERE x.rn <= o.rn AND x.status <> 'complete');

  SELECT * INTO v_k1 FROM _cord WHERE rn = v_k + 1;
  IF FOUND THEN
    IF v_k1.status = 'locked' THEN
      INSERT INTO public.student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
      VALUES (p_user, v_k1.id, 'unlocked', 0, 0, 0)
      ON CONFLICT (user_id, achievement_id) DO UPDATE SET status='unlocked'
        WHERE student_achievement_progress.status='locked';
      v_unlocked := array_append(v_unlocked, v_k1.id);
    END IF;
    IF v_k1.status = 'passed_incomplete' THEN
      v_clamped := true;
      SELECT * INTO v_k2 FROM _cord WHERE rn = v_k + 2;
      IF FOUND AND v_k2.status = 'locked' THEN
        INSERT INTO public.student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
        VALUES (p_user, v_k2.id, 'unlocked', 0, 0, 0)
        ON CONFLICT (user_id, achievement_id) DO UPDATE SET status='unlocked'
          WHERE student_achievement_progress.status='locked';
        v_unlocked := array_append(v_unlocked, v_k2.id);
      END IF;
    END IF;
  END IF;

  DROP TABLE IF EXISTS _cord;
  RETURN jsonb_build_object('unlocked_ids', to_jsonb(v_unlocked), 'clamped', v_clamped);
END; $fn$;

-- ---------------------------------------------------------------------
-- 4. seed_commercial_free_topics(user) — seed gs0 + gs36 as 'unlocked' + their method_progress.
--    Mirrors seed_first_topic_on_enrollment for the two free topics (no enrollment for commercial).
--    Call from register_commercial_user (fold-in) or on first free-topic open. Idempotent.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_commercial_free_topics(p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE r record; m text;
BEGIN
  FOR r IN
    SELECT a.id, a.applicable_methods
    FROM public.achievements a WHERE a.global_sequence IN (0,36)
  LOOP
    INSERT INTO public.student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
    VALUES (p_user, r.id, 'unlocked', 0, 0, 0)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    IF r.applicable_methods IS NOT NULL THEN
      FOREACH m IN ARRAY r.applicable_methods LOOP
        INSERT INTO public.student_method_progress(user_id, achievement_id, method_key,
          is_applicable, completion_pct, engagement_seconds, answered_count, correct_count)
        VALUES (p_user, r.id, m, true, 0, 0, 0, 0)
        ON CONFLICT (user_id, achievement_id, method_key) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END; $fn$;
-- Fold-in (apply with the package): add to register_commercial_user just before its final RETURN:
--     PERFORM public.seed_commercial_free_topics(v_user_id);

-- =====================================================================
-- 5. start_quiz_attempt v3 — audience-branched. Institutional path BYTE-IDENTICAL to v2.
--    New optional p_public_course_id retained for forward-compat but UNUSED (commercial course is
--    derived from the achievement's primary home, so the client contract stays the 2-arg call).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_achievement_id uuid, p_client_attempt_id uuid, p_public_course_id uuid DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public','pg_temp' SET statement_timeout TO '30s'
AS $function$
DECLARE
  v_user uuid; v_attempt_id uuid; v_existing uuid;
  v_course uuid; v_ach_cvid uuid; v_enr_cvid uuid;
  v_status text; v_lockout timestamptz; v_best int; v_is_active boolean; v_is_prereq boolean;
  v_pool int; v_is_practice boolean; v_attempt_number int; v_gate_fail int;
  v_materialized int;
  v_audience text; v_gs int; v_free boolean; v_public_course uuid;   -- NEW
BEGIN
  SELECT id INTO v_user FROM users WHERE auth_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  SELECT audience INTO v_audience FROM users WHERE id = v_user;      -- NEW

  SELECT id INTO v_existing FROM quiz_attempts WHERE client_attempt_id = p_client_attempt_id AND user_id = v_user;
  IF v_existing IS NOT NULL THEN RETURN build_attempt_payload(v_existing); END IF;
  SELECT id INTO v_existing FROM quiz_attempts WHERE user_id = v_user AND achievement_id = p_achievement_id AND attempt_status = 'in_progress' LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN build_attempt_payload(v_existing); END IF;

  SELECT a.course_id, a.curriculum_version_id, a.is_active, a.is_prerequisite, a.global_sequence
    INTO v_course, v_ach_cvid, v_is_active, v_is_prereq, v_gs
  FROM achievements a WHERE a.id = p_achievement_id;
  IF v_course IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
  v_free := (v_gs IN (0,36));                                        -- NEW

  -- Safety precondition: unchanged for institutional; commercial free topics are exempt (D4-a).
  IF v_is_prereq IS NOT TRUE AND NOT (v_audience='commercial' AND v_free) THEN
    IF NOT EXISTS (SELECT 1 FROM student_achievement_progress sap JOIN achievements a0 ON a0.id = sap.achievement_id
                   WHERE sap.user_id = v_user AND a0.is_prerequisite = true AND a0.curriculum_version_id = v_ach_cvid AND sap.status = 'complete') THEN
      RAISE EXCEPTION 'safety_prerequisite_incomplete';
    END IF;
  END IF;

  -- Enrollment/entitlement: institutional keeps the enrollment gate; commercial swaps it.
  IF v_audience = 'commercial' THEN
    IF NOT v_free AND NOT public.has_academy_access(auth.uid()) THEN
      RAISE EXCEPTION 'academy_required';
    END IF;
    SELECT public_course_id INTO v_public_course FROM public_course_topics
      WHERE achievement_id = p_achievement_id AND placement='primary';
    -- ensure a progress row exists so submit_quiz's UPDATE lands (lazy create)
    INSERT INTO student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
    VALUES (v_user, p_achievement_id, 'unlocked', 0, 0, 0)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  ELSE
    SELECT e.curriculum_version_id INTO v_enr_cvid FROM enrollment e WHERE e.user_id = v_user AND e.course_id = v_course;
    IF v_enr_cvid IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
    IF v_enr_cvid IS DISTINCT FROM v_ach_cvid THEN RAISE EXCEPTION 'version_mismatch'; END IF;
  END IF;

  SELECT status, lockout_until, best_genuine_score INTO v_status, v_lockout, v_best
  FROM student_achievement_progress WHERE user_id = v_user AND achievement_id = p_achievement_id;

  -- Unlock: institutional reads stored status; commercial computes over public_course_topics.seq.
  IF v_audience = 'commercial' THEN
    IF NOT v_free AND NOT public.commercial_topic_unlocked(v_user, v_public_course, p_achievement_id) THEN
      RAISE EXCEPTION 'topic_locked';
    END IF;
  ELSE
    IF v_status IS NULL OR v_status = 'locked' THEN RAISE EXCEPTION 'topic_locked'; END IF;
  END IF;
  IF v_lockout IS NOT NULL AND v_lockout >= now() THEN RAISE EXCEPTION 'under_lockout'; END IF;

  SELECT count(*) INTO v_pool FROM quiz_questions WHERE achievement_id = p_achievement_id AND usage = 'graded_quiz' AND review_status = 'approved';
  IF v_is_active IS NOT TRUE OR v_pool < 25 THEN RAISE EXCEPTION 'pool_too_small'; END IF;

  SELECT count(*) INTO v_gate_fail FROM (SELECT m AS method_key FROM achievements a, unnest(COALESCE(a.applicable_methods, ARRAY[]::text[])) AS m WHERE a.id = p_achievement_id) req
  LEFT JOIN study_methods sm ON sm.key = req.method_key
  LEFT JOIN student_method_progress smp ON smp.user_id = v_user AND smp.achievement_id = p_achievement_id AND smp.method_key = req.method_key AND smp.is_applicable = true
  WHERE smp.id IS NULL OR sm.id IS NULL OR smp.completion_pct < 100 OR smp.engagement_seconds < sm.min_engagement_seconds
     OR (sm.requires_accuracy AND smp.answered_count = 0) OR (sm.requires_accuracy AND smp.answered_count > 0 AND (smp.correct_count::numeric / smp.answered_count) * 100 < sm.accuracy_threshold);
  IF v_gate_fail > 0 THEN RAISE EXCEPTION 'study_gate_unmet'; END IF;

  v_is_practice := (COALESCE(v_best,0) >= 24);
  SELECT COALESCE(MAX(attempt_number) FILTER (WHERE NOT is_practice), 0) + 1 INTO v_attempt_number FROM quiz_attempts WHERE user_id = v_user AND achievement_id = p_achievement_id;
  BEGIN
    INSERT INTO quiz_attempts (id, user_id, achievement_id, attempt_number, score, is_practice, started_at, submitted_at, attempt_status, client_attempt_id)
    VALUES (gen_random_uuid(), v_user, p_achievement_id, v_attempt_number, 0, v_is_practice, now(), NULL, 'in_progress', p_client_attempt_id) RETURNING id INTO v_attempt_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_existing FROM quiz_attempts WHERE client_attempt_id = p_client_attempt_id AND user_id = v_user;
    IF v_existing IS NULL THEN SELECT id INTO v_existing FROM quiz_attempts WHERE user_id = v_user AND achievement_id = p_achievement_id AND attempt_status = 'in_progress' LIMIT 1; END IF;
    RETURN build_attempt_payload(v_existing);
  END;
  WITH prev AS (SELECT qai.question_id FROM quiz_attempt_items qai JOIN quiz_attempts pa ON pa.id = qai.attempt_id WHERE pa.user_id = v_user AND pa.achievement_id = p_achievement_id AND pa.id <> v_attempt_id AND pa.started_at = (SELECT MAX(p2.started_at) FROM quiz_attempts p2 WHERE p2.user_id = v_user AND p2.achievement_id = p_achievement_id AND p2.id <> v_attempt_id)),
  pool AS MATERIALIZED (SELECT q.id, q.question_type, gt.difficulty AS diff, (q.id IN (SELECT question_id FROM prev)) AS was_prev FROM quiz_questions q JOIN glossary_topics gt ON gt.glossary_id = q.glossary_id AND gt.achievement_id = q.achievement_id WHERE q.achievement_id = p_achievement_id AND q.usage = 'graded_quiz' AND q.review_status = 'approved'),
  ia AS MATERIALIZED (SELECT id FROM pool WHERE diff IN ('intermediate','advanced') ORDER BY was_prev ASC, random() LIMIT 18),
  fill AS MATERIALIZED (SELECT id FROM pool WHERE id NOT IN (SELECT id FROM ia) ORDER BY was_prev ASC, random() LIMIT (25 - (SELECT count(*) FROM ia))),
  drawn AS (SELECT id FROM ia UNION ALL SELECT id FROM fill),
  ordered AS (SELECT id, (row_number() OVER (ORDER BY random()))::smallint AS slot_index FROM drawn)
  INSERT INTO quiz_attempt_items (attempt_id, slot_index, question_id, is_repeat, definition_id, served_question_type, served_options, served_correct_answers)
  SELECT v_attempt_id, o.slot_index, o.id, false, NULL, m.served_question_type, m.served_options, m.served_correct_answers FROM ordered o CROSS JOIN LATERAL public.materialize_pooled_slot(o.id) m;
  GET DIAGNOSTICS v_materialized = ROW_COUNT;
  IF v_materialized <> 25 THEN RAISE EXCEPTION 'pool_too_small'; END IF;
  RETURN build_attempt_payload(v_attempt_id);
END; $function$;

-- =====================================================================
-- 6. submit_quiz v8.4 — audience-branched. Grading/scoring/threshold/trophy math BYTE-IDENTICAL.
--    Only three edits vs v8.3, all marked  -- >>> COMMERCIAL:
--      (a) load v_audience;
--      (b) enrollment guard -> commercial bypass (version pinned to achievement cv);
--      (c) passed_incomplete sibling scope -> public course for commercial;
--      (d) reachability call -> recompute_reachability_commercial for commercial (course derived
--          from the achievement's primary public home).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.submit_quiz(p_attempt_id uuid, p_answers jsonb, p_submitted_at timestamp with time zone, p_submitted_offline boolean, p_focus_loss_count integer, p_focus_loss_duration integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public','pg_temp' SET statement_timeout TO '30s'
AS $function$
DECLARE
  v_user uuid; v_att quiz_attempts%ROWTYPE;
  v_course uuid; v_ach_cv uuid; v_enr_cv uuid; v_badge_trigger text; v_is_prereq boolean;
  v_prev_status text; v_prev_best int; v_lockout timestamptz;
  v_n int; v_score int := 0; v_wrong jsonb := '{}'::jsonb;
  v_sel jsonb; v_ok boolean; it record;
  v_timed_out boolean; v_focus_void boolean;
  v_new_best int; v_new_status text; v_trophy boolean := false; v_badge_earned boolean := false;
  v_attempt_status text; v_outcome text; v_lockout_set timestamptz := NULL;
  v_sibling_partial int; v_reach jsonb := NULL; v_badge_id uuid; v_payload jsonb;
  v_audience text; v_public_course uuid;                              -- >>> COMMERCIAL
BEGIN
  SELECT id INTO v_user FROM users WHERE auth_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  SELECT audience INTO v_audience FROM users WHERE id = v_user;       -- >>> COMMERCIAL

  SELECT * INTO v_att FROM quiz_attempts WHERE id = p_attempt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
  IF v_att.user_id <> v_user THEN RAISE EXCEPTION 'not_owner'; END IF;
  IF v_att.result_payload IS NOT NULL THEN RETURN v_att.result_payload; END IF;
  IF v_att.attempt_status <> 'in_progress' THEN RAISE EXCEPTION 'attempt_not_open'; END IF;

  SELECT a.course_id, a.curriculum_version_id, a.badge_trigger, a.is_prerequisite
    INTO v_course, v_ach_cv, v_badge_trigger, v_is_prereq
  FROM achievements a WHERE a.id = v_att.achievement_id;

  -- >>> COMMERCIAL: institutional keeps the enrollment gate; commercial bypasses it (version = achievement cv).
  IF v_audience = 'commercial' THEN
    v_enr_cv := v_ach_cv;
    SELECT public_course_id INTO v_public_course FROM public_course_topics
      WHERE achievement_id = v_att.achievement_id AND placement='primary';
  ELSE
    SELECT e.curriculum_version_id INTO v_enr_cv FROM enrollment e WHERE e.user_id = v_user AND e.course_id = v_course;
    IF v_enr_cv IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
    IF v_enr_cv IS DISTINCT FROM v_ach_cv THEN RAISE EXCEPTION 'version_mismatch'; END IF;
  END IF;

  SELECT status, best_genuine_score, lockout_until INTO v_prev_status, v_prev_best, v_lockout
  FROM student_achievement_progress WHERE user_id = v_user AND achievement_id = v_att.achievement_id;
  v_prev_status := COALESCE(v_prev_status,'unlocked');
  v_prev_best   := COALESCE(v_prev_best,0);
  IF v_prev_status = 'locked' THEN RAISE EXCEPTION 'topic_locked'; END IF;

  v_timed_out  := (p_submitted_at - v_att.started_at) > interval '602 seconds';
  v_focus_void := (COALESCE(p_focus_loss_count,0) >= 2);

  SELECT count(*) INTO v_n FROM quiz_attempt_items WHERE attempt_id = p_attempt_id;
  IF v_n <> 25 THEN RAISE EXCEPTION 'bad_serve_set'; END IF;

  FOR it IN SELECT qai.id, qai.slot_index, qai.served_question_type, qai.served_correct_answers,
                   qq.explanation AS explanation
            FROM quiz_attempt_items qai LEFT JOIN quiz_questions qq ON qq.id = qai.question_id
            WHERE qai.attempt_id = p_attempt_id LOOP
    v_sel := p_answers -> it.slot_index::text;
    v_ok  := grade_one(it.served_question_type, v_sel, it.served_correct_answers);
    UPDATE quiz_attempt_items SET selected_answer = v_sel, is_correct = v_ok WHERE id = it.id;
    IF v_ok THEN v_score := v_score + 1;
    ELSE v_wrong := v_wrong || jsonb_build_object(it.slot_index::text,
            jsonb_build_object('correct', it.served_correct_answers, 'selected', v_sel, 'explanation', it.explanation));
    END IF;
  END LOOP;

  IF v_focus_void THEN
    v_attempt_status := 'voided'; v_outcome := 'voided'; v_lockout_set := now() + interval '15 minutes';
  ELSIF v_timed_out THEN
    v_attempt_status := 'timed_out'; v_outcome := 'timed_out';
  ELSE
    v_attempt_status := 'submitted';
    v_outcome := CASE WHEN v_score >= 24 THEN 'full_pass' WHEN v_score >= 20 THEN 'partial_pass' ELSE 'no_pass' END;
  END IF;

  v_new_status := v_prev_status; v_new_best := v_prev_best;
  IF v_attempt_status = 'submitted' AND NOT v_att.is_practice THEN
    v_new_best := GREATEST(v_prev_best, v_score);
    IF v_new_best >= 24 THEN
      v_new_status := 'complete';
    ELSIF v_new_best >= 20 THEN
      -- >>> COMMERCIAL: sibling passed_incomplete scope = public course; institutional = academic course.
      IF v_audience = 'commercial' THEN
        SELECT count(*) INTO v_sibling_partial
        FROM public_course_topics pct
        JOIN student_achievement_progress sap ON sap.achievement_id = pct.achievement_id AND sap.user_id = v_user
        WHERE pct.public_course_id = v_public_course
          AND sap.status = 'passed_incomplete' AND sap.achievement_id <> v_att.achievement_id;
      ELSE
        SELECT count(*) INTO v_sibling_partial
        FROM student_achievement_progress sap JOIN achievements a ON a.id = sap.achievement_id
        WHERE sap.user_id = v_user AND a.course_id = v_course AND a.curriculum_version_id = v_ach_cv
          AND sap.status = 'passed_incomplete' AND sap.achievement_id <> v_att.achievement_id;
      END IF;
      IF v_sibling_partial > 0 THEN v_new_status := 'unlocked'; ELSE v_new_status := 'passed_incomplete'; END IF;
    ELSE
      v_new_status := 'unlocked';
    END IF;

    UPDATE student_achievement_progress
      SET status = v_new_status, best_genuine_score = v_new_best, quiz_score = v_score,
          quiz_attempts = quiz_attempts + 1,
          date_earned = COALESCE(date_earned, CASE WHEN v_new_status='complete' THEN now() END)
    WHERE user_id = v_user AND achievement_id = v_att.achievement_id;

    IF v_new_status = 'complete' AND v_prev_status <> 'complete' THEN
      v_trophy := true;
      IF v_badge_trigger IS NOT NULL THEN
        SELECT id INTO v_badge_id FROM badges WHERE name = v_badge_trigger AND curriculum_version_id = v_ach_cv;
        IF v_badge_id IS NOT NULL THEN
          INSERT INTO student_badges(user_id, badge_id, badge_name_snapshot, source)
          VALUES (v_user, v_badge_id, v_badge_trigger, 'earned')
          ON CONFLICT (user_id, badge_name_snapshot) DO NOTHING;
          v_badge_earned := true;
        END IF;
      END IF;
      IF v_is_prereq IS TRUE THEN
        PERFORM unlock_after_safety(v_user, v_ach_cv);   -- verify: no-op safe for commercial (no enrollment)
      END IF;
    END IF;

    -- >>> COMMERCIAL: advance the public-course clamp; institutional advances the academic clamp.
    IF v_audience = 'commercial' THEN
      IF v_public_course IS NOT NULL THEN
        v_reach := recompute_reachability_commercial(v_user, v_public_course);
      END IF;
    ELSE
      v_reach := recompute_reachability(v_user, v_ach_cv, v_course);
    END IF;
  END IF;

  IF v_lockout_set IS NOT NULL THEN
    UPDATE student_achievement_progress SET lockout_until = v_lockout_set
    WHERE user_id = v_user AND achievement_id = v_att.achievement_id;
  END IF;

  INSERT INTO performance_metrics(user_id, total_quiz_attempts, genuine_quiz_attempts,
      practice_quiz_attempts, total_trophies_earned, last_activity_at)
  VALUES (v_user, 1, CASE WHEN v_att.is_practice THEN 0 ELSE 1 END,
          CASE WHEN v_att.is_practice THEN 1 ELSE 0 END, CASE WHEN v_trophy THEN 1 ELSE 0 END, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_quiz_attempts   = performance_metrics.total_quiz_attempts + 1,
    genuine_quiz_attempts = performance_metrics.genuine_quiz_attempts + CASE WHEN v_att.is_practice THEN 0 ELSE 1 END,
    practice_quiz_attempts= performance_metrics.practice_quiz_attempts + CASE WHEN v_att.is_practice THEN 1 ELSE 0 END,
    total_trophies_earned = performance_metrics.total_trophies_earned + CASE WHEN v_trophy THEN 1 ELSE 0 END,
    last_activity_at = now();

  v_payload := jsonb_build_object(
      'attempt_id', p_attempt_id, 'score', v_score, 'outcome', v_outcome,
      'new_status', v_new_status, 'best_genuine_score', v_new_best,
      'badge_earned', v_badge_earned, 'trophy_granted', v_trophy,
      'next_topic', v_reach, 'wrong_answers', v_wrong, 'lockout_until', v_lockout_set);

  UPDATE quiz_attempts SET
      score = v_score, answers_json = p_answers, wrong_answers = v_wrong,
      submitted_at = p_submitted_at, submitted_offline = p_submitted_offline,
      focus_loss_count = p_focus_loss_count, focus_loss_duration = p_focus_loss_duration,
      voided = (v_attempt_status = 'voided'),
      void_reason = CASE v_attempt_status WHEN 'voided' THEN 'focus_loss' WHEN 'timed_out' THEN 'timeout' ELSE NULL END,
      attempt_status = v_attempt_status, result_payload = v_payload
  WHERE id = p_attempt_id;

  PERFORM public.refresh_student_metrics(v_user);
  RETURN v_payload;
END; $function$;

-- =====================================================================
-- 7. VERIFICATION (must pass before prod go-ahead)
--   INSTITUTIONAL REGRESSION (BLOCKING): re-run the full existing smoke set as audience='institutional'
--     -> behavior byte-identical (draw, gating, thresholds, trophies, clamp, lockout, void, timeout).
--   COMMERCIAL MATRIX (needs a commercial test user + entitlement rows):
--     - free user, gs0 pre-Safety -> start allowed, submit grades, trophy on 24+, next unlocks.
--     - free user, gs36 pre-Safety -> start allowed (free exempt), completes.
--     - free user, paid topic -> academy_required.
--     - academy user, paid topic seq1 -> allowed; seq2 locked until seq1 complete; one-ahead on 20-23.
--     - lapsed -> paid topics re-lock; free topics still work; trophies/Album retained.
--   HELPER CHECKS: unlock_after_safety(commercial_user, cv) does not error with no enrollment;
--     commercial submit UPDATE lands (progress row pre-created by start_quiz_attempt v3).
--   get_advisors(security): no new ERROR; new WARNs limited to the added SECURITY DEFINER helpers
--     (same accepted pattern).
-- Rollback: re-deploy the captured v2 start_quiz_attempt + v8.3 submit_quiz bodies; drop the 4 helpers.
-- =====================================================================
