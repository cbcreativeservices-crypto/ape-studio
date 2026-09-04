-- DROP V1 SCAFFOLDING · STAGE 10 · rewrite the seven functions that must SURVIVE
-- the drops.
--
-- Postgres does not dependency-check function bodies. A DROP TABLE succeeds and
-- the functions that read it break silently, at runtime, on the next call. This
-- stage takes every surviving function OFF courses / enrollment / course_sections
-- / session_logs / achievements.course_id, so that stages 40-80 cannot break them.
--
-- BASELINE: this file rewrites ON TOP OF REMOVE_V1_REMNANTS stage 30's output for
-- start_quiz_attempt and submit_quiz. Their bodies below are that package's
-- versions with the further changes listed. The guard refuses to run if stage 30
-- has not been applied.
--
-- ---------------------------------------------------------------- what changes
-- refresh_student_metrics  REWRITTEN. On the quiz hot path (submit_quiz calls it
--                          on every submission). Its only session_logs uses were
--                          total_study_sessions and one arm of the streak CTE.
--                          Both are re-derived - see the note in the body.
-- delete_my_account        REWRITTEN. Three DELETE lines removed (enrollment,
--                          session_logs, instructor_sections). Nothing else
--                          touched. Every remaining non-cascading FK into
--                          public.users is still handled, so the final
--                          DELETE FROM users still succeeds.
-- record_study_progress    REWRITTEN. The final `else` arm (the enrollment
--                          lookup) becomes an explicit `retired_content` error.
--                          The always_free and v3 arms are byte-for-byte as they
--                          were.
-- credit_time_trial        REWRITTEN, and this is a BUG FIX, not a deletion. It
--                          required an enrollment row unconditionally and had no
--                          v3 arm, so on v3 it could only ever raise
--                          `not_enrolled` - and src/features/study/timeTrial.ts
--                          calls it live and swallows the error. Its gate now
--                          mirrors record_study_progress exactly.
-- start_quiz_attempt       REWRITTEN. The `else` arm (enrollment lookup) becomes
--                          `retired_content`; the achievements.course_id read
--                          and the v_course / v_enr_cvid locals are removed.
-- submit_quiz              REWRITTEN. The `else` arm becomes `retired_content`;
--                          the course_id read, the unlock_after_safety call, the
--                          recompute_reachability call and the badge write all
--                          go. Payload shape is UNCHANGED - `next_topic` was
--                          already always null on v3, and `badge_earned` is now
--                          a constant false (see stage 30 / the README).
-- lookup_student_by_qr     REWRITTEN. Loses the `is_instructor_for_user(u.id)`
--                          disjunct so that is_instructor_for_user can be
--                          dropped in stage 20. Access narrows to
--                          `is_ta_or_admin()`. No app caller.
--
-- Idempotent: CREATE OR REPLACE throughout. A second run is a no-op.
-- Reversible: 99_ROLLBACK restores all seven verbatim from 05_BACKUP.

BEGIN;

DO $guard$
DECLARE v_bad int;
BEGIN
  IF to_regclass('public.v1scaffold_func_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been taken';
  END IF;
  IF (SELECT count(*) FROM public.v1scaffold_func_backup_20260903
      WHERE proname IN ('refresh_student_metrics','delete_my_account','record_study_progress',
                        'credit_time_trial','start_quiz_attempt','submit_quiz','lookup_student_by_qr')) < 7 THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP did not capture all seven functions this stage rewrites';
  END IF;

  -- The baseline must be REMOVE_V1_REMNANTS stage 30's output.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname IN ('start_quiz_attempt','submit_quiz')
               AND p.prosrc ~* 'public_course') THEN
    RAISE EXCEPTION 'refusing to run: REMOVE_V1_REMNANTS stage 30 has not run. Run it first - this file rewrites on top of its output.';
  END IF;

  -- Re-prove at apply time that the `else` arms being replaced are unreachable.
  SELECT count(*) INTO v_bad FROM public.achievements
   WHERE course_id IS NOT NULL
     AND curriculum_version_id NOT IN ('c689c0c4-1d93-4a92-9159-2af019745c49'::uuid,
                                       'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'::uuid);
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'refusing to run: % achievements are neither v1 nor v3 yet carry a course_id - the else arms are NOT dead', v_bad;
  END IF;
END $guard$;

-- ============================================================ refresh_student_metrics
CREATE OR REPLACE FUNCTION public.refresh_student_metrics(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_avg_all     DECIMAL;
  v_avg_genuine DECIMAL;
  v_study       INT;
  v_cur         INT;
  v_longest     INT;
BEGIN
  -- D-PM1: averages over SUBMITTED attempts only (exclude void/timeout/in_progress)
  SELECT avg(score) INTO v_avg_all
    FROM public.quiz_attempts
   WHERE user_id = p_user_id AND attempt_status = 'submitted';

  SELECT avg(score) INTO v_avg_genuine
    FROM public.quiz_attempts
   WHERE user_id = p_user_id AND attempt_status = 'submitted' AND is_practice = false;

  -- D-PM2/D-PM3 (rewritten 2026-09-03, the legacy session-log table dropped)
  -- ------------------------------------------------------------------------
  -- That table was never written by the app; it held 0 rows, so
  -- total_study_sessions was a permanent 0 and its arm of the streak CTE
  -- contributed nothing. Both are now derived from the two activity
  -- sources that DO exist:
  --     * student_method_progress.last_updated  (study-method activity)
  --     * quiz_attempts.started_at, genuine only (assessment activity)
  --
  -- HONESTY NOTE: total_study_sessions is now the count of DISTINCT ACTIVITY
  -- DAYS (America/Los_Angeles), not a count of sessions - the database has no
  -- session concept any more. It is the same day set the streaks are computed
  -- from, so the three numbers are now mutually consistent. Nothing in the app
  -- reads or displays total_study_sessions today. If you would rather it read
  -- 0, or count topic x method study units instead, say so - it is one CTE.
  WITH days AS (
    SELECT DISTINCT (last_updated AT TIME ZONE 'America/Los_Angeles')::date AS d
      FROM public.student_method_progress
     WHERE user_id = p_user_id AND last_updated IS NOT NULL
    UNION
    SELECT DISTINCT (started_at AT TIME ZONE 'America/Los_Angeles')::date
      FROM public.quiz_attempts
     WHERE user_id = p_user_id AND is_practice = false AND started_at IS NOT NULL
  ),
  ordered AS (
    SELECT d, d - (row_number() OVER (ORDER BY d))::int AS grp FROM days
  ),
  runs AS (
    SELECT grp, count(*)::int AS len, max(d) AS last_day FROM ordered GROUP BY grp
  )
  SELECT
    COALESCE((SELECT count(*)::int FROM days), 0),
    COALESCE(max(len), 0),
    COALESCE((SELECT len FROM runs
               WHERE last_day >= (now() AT TIME ZONE 'America/Los_Angeles')::date - 1
               ORDER BY last_day DESC LIMIT 1), 0)
  INTO v_study, v_longest, v_cur
  FROM runs;

  v_study   := COALESCE(v_study, 0);
  v_longest := COALESCE(v_longest, 0);
  v_cur     := COALESCE(v_cur, 0);

  INSERT INTO public.performance_metrics
        (user_id, avg_quiz_score, avg_genuine_score,
         total_study_sessions, current_streak_days, longest_streak_days, updated_at)
  VALUES (p_user_id, v_avg_all, v_avg_genuine, v_study, v_cur, GREATEST(v_cur, v_longest), now())
  ON CONFLICT (user_id) DO UPDATE SET
    avg_quiz_score       = EXCLUDED.avg_quiz_score,
    avg_genuine_score    = EXCLUDED.avg_genuine_score,
    total_study_sessions = EXCLUDED.total_study_sessions,
    current_streak_days  = EXCLUDED.current_streak_days,
    longest_streak_days  = GREATEST(public.performance_metrics.longest_streak_days,
                                    EXCLUDED.current_streak_days, EXCLUDED.longest_streak_days),
    updated_at           = now();
END
$function$;

COMMENT ON FUNCTION public.refresh_student_metrics(uuid) IS
  'Rewritten 2026-09-03 off session_logs. total_study_sessions is now a count of distinct study-activity DAYS (America/Los_Angeles), not sessions.';

-- ================================================================ delete_my_account
CREATE OR REPLACE FUNCTION public.delete_my_account()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_user uuid; v_auth uuid; v_auth_deleted boolean := false;
BEGIN
  v_auth := auth.uid();
  IF v_auth IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT id INTO v_user FROM users WHERE auth_id = v_auth;
  IF v_user IS NULL THEN
    BEGIN DELETE FROM auth.users WHERE id = v_auth; v_auth_deleted := true; EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN jsonb_build_object('user_deleted', false, 'auth_deleted', v_auth_deleted);
  END IF;

  -- Personal records + PII (quiz_attempt_items cascades from quiz_attempts).
  DELETE FROM quiz_attempts WHERE user_id = v_user;
  DELETE FROM student_achievement_progress WHERE user_id = v_user;
  DELETE FROM student_method_progress WHERE user_id = v_user;
  DELETE FROM student_badges WHERE user_id = v_user;
  DELETE FROM performance_metrics WHERE user_id = v_user;
  -- The legacy course-enrolment delete was removed 2026-09-03 (table dropped, stage 60).
  DELETE FROM entitlements WHERE user_id = v_user;
  DELETE FROM notification_preferences WHERE user_id = v_user;
  DELETE FROM notification_log WHERE user_id = v_user;
  -- The legacy study-session-log delete was removed 2026-09-03 (table dropped, stage 40).
  DELETE FROM tool_usage_log WHERE user_id = v_user;
  DELETE FROM audit_log WHERE actor_id = v_user;
  -- Defensive for admin self-deletes. The legacy instructor-section delete was
  -- removed 2026-09-03 (table dropped, stage 70 - the instructor role is retired).
  UPDATE quiz_questions SET reviewed_by = NULL WHERE reviewed_by = v_user;
  UPDATE student_badges SET granted_by = NULL WHERE granted_by = v_user;
  UPDATE student_badges SET revoked_by = NULL WHERE revoked_by = v_user;

  -- Identity row. Every remaining FK into public.users is either handled above
  -- or ON DELETE CASCADE (community_profiles, contact_*, credential_awards,
  -- entitlements, final_exam_attempts, registry_consent_events,
  -- student_lab_progress, study_pace_records, tool_usage_log,
  -- user_bundle_enrollments, user_enrollment_state, user_home_cards,
  -- user_topic_enrollments).
  DELETE FROM users WHERE id = v_user;

  -- Auth login (best-effort).
  BEGIN DELETE FROM auth.users WHERE id = v_auth; v_auth_deleted := true; EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object('user_deleted', true, 'auth_deleted', v_auth_deleted);
END; $function$;

-- ============================================================= record_study_progress
CREATE OR REPLACE FUNCTION public.record_study_progress(p_achievement_id uuid, p_method_key text, p_batch_id uuid, p_active_seconds integer, p_events jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET statement_timeout TO '15s'
AS $function$
DECLARE
  v_user uuid; v_ach_cvid uuid;
  v_row student_method_progress%ROWTYPE;
  v_states jsonb; v_batches jsonb; v_ev jsonb; v_item text; v_kind text;
  v_ans_delta int := 0; v_cor_delta int := 0; v_req_passes int;
  v_total int; v_done int; v_delta int; v_pct int; v_free boolean;
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
BEGIN
  SELECT id INTO v_user FROM users WHERE auth_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  SELECT required_passes INTO v_req_passes FROM study_methods WHERE key = p_method_key;
  IF v_req_passes IS NULL THEN RAISE EXCEPTION 'invalid_method'; END IF;
  IF p_batch_id IS NULL OR p_active_seconds IS NULL OR p_active_seconds < 0
     OR p_events IS NULL OR jsonb_typeof(p_events) <> 'array'
     OR jsonb_array_length(p_events) > 500 THEN RAISE EXCEPTION 'invalid_event'; END IF;

  SELECT a.curriculum_version_id, a.always_free
    INTO v_ach_cvid, v_free
  FROM achievements a WHERE a.id = p_achievement_id;
  IF v_ach_cvid IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;

  IF COALESCE(v_free, false) THEN
    -- always_free (owner 2026-08-17): any signed-in user records progress —
    -- no academy/enrollment/lock gate. Keep the v3 progress-row invariant.
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
    -- Was: the institutional enrolment lookup, which joined the legacy course
    -- tables. Both are gone as of 2026-09-03. Non-v3, non-always_free content
    -- is retired.
    RAISE EXCEPTION 'retired_content';
  END IF;

  INSERT INTO student_method_progress
    (user_id, achievement_id, method_key, is_applicable, completion_pct, engagement_seconds, answered_count, correct_count)
  VALUES (v_user, p_achievement_id, p_method_key, true, 0, 0, 0, 0)
  ON CONFLICT (user_id, achievement_id, method_key) DO NOTHING;
  SELECT * INTO v_row FROM student_method_progress
  WHERE user_id = v_user AND achievement_id = p_achievement_id AND method_key = p_method_key FOR UPDATE;

  v_states  := COALESCE(v_row.item_states, '{}'::jsonb);
  v_batches := COALESCE(v_states->'_batches', '[]'::jsonb);
  IF v_batches @> to_jsonb(ARRAY[p_batch_id::text]) THEN RETURN build_study_snapshot(v_row.id, true); END IF;

  FOR v_ev IN SELECT * FROM jsonb_array_elements(p_events) LOOP
    v_item := v_ev->>'item'; v_kind := v_ev->>'kind';
    IF v_item IS NULL OR left(v_item,1) = '_' OR NOT EXISTS (
         SELECT 1 FROM glossary_topics gt WHERE gt.achievement_id = p_achievement_id AND gt.glossary_id::text = v_item)
    THEN RAISE EXCEPTION 'invalid_event'; END IF;
    IF NOT (v_states ? v_item) THEN v_states := jsonb_set(v_states, ARRAY[v_item], '{}'::jsonb, true); END IF;
    IF p_method_key = 'flashcards' AND v_kind = 'view' THEN
      v_states := jsonb_set(v_states, ARRAY[v_item,'views'], to_jsonb(COALESCE((v_states#>>ARRAY[v_item,'views'])::int,0) + 1), true);
    ELSIF p_method_key = 'flashcards' AND v_kind = 'known' AND jsonb_typeof(v_ev->'value') = 'boolean' THEN
      v_states := jsonb_set(v_states, ARRAY[v_item,'known'], v_ev->'value', true);
    ELSIF p_method_key <> 'flashcards' AND v_kind = 'answer' AND jsonb_typeof(v_ev->'correct') = 'boolean' THEN
      v_states := jsonb_set(v_states, ARRAY[v_item,'attempts'], to_jsonb(COALESCE((v_states#>>ARRAY[v_item,'attempts'])::int,0) + 1), true);
      v_ans_delta := v_ans_delta + 1;
      IF (v_ev->>'correct')::boolean THEN
        v_states := jsonb_set(v_states, ARRAY[v_item,'correct'], to_jsonb(COALESCE((v_states#>>ARRAY[v_item,'correct'])::int,0) + 1), true);
        v_cor_delta := v_cor_delta + 1;
      END IF;
    ELSE RAISE EXCEPTION 'invalid_event'; END IF;
  END LOOP;

  v_delta := LEAST(p_active_seconds, GREATEST(0, EXTRACT(EPOCH FROM (now() - v_row.last_updated)))::int);
  SELECT count(*) INTO v_total FROM glossary_topics WHERE achievement_id = p_achievement_id;
  IF v_total = 0 THEN RAISE EXCEPTION 'invalid_event'; END IF;
  SELECT count(*) INTO v_done FROM jsonb_each(v_states) s(k, v)
  WHERE left(s.k,1) <> '_'
    AND CASE WHEN p_method_key = 'flashcards'
         THEN COALESCE((s.v->>'views')::int,0) >= 1 OR COALESCE((s.v->>'known')::boolean,false)
         ELSE COALESCE((s.v->>'correct')::int,0) >= 1 END;
  v_pct := FLOOR(v_done * 100.0 / v_total)::int;

  v_batches := v_batches || to_jsonb(p_batch_id::text);
  IF jsonb_array_length(v_batches) > 50 THEN
    v_batches := (SELECT jsonb_agg(e) FROM (SELECT t.e FROM jsonb_array_elements(v_batches) WITH ORDINALITY t(e, ord) ORDER BY t.ord DESC LIMIT 50) s);
  END IF;
  v_states := jsonb_set(v_states, ARRAY['_batches'], v_batches, true);

  UPDATE student_method_progress SET
    item_states = v_states, engagement_seconds = engagement_seconds + v_delta,
    answered_count = answered_count + v_ans_delta, correct_count = correct_count + v_cor_delta,
    completion_pct = v_pct, last_updated = now()
  WHERE id = v_row.id;
  RETURN build_study_snapshot(v_row.id, false);
END; $function$;

-- ================================================================ credit_time_trial
-- BUG FIX, not a deletion. The old body did:
--     SELECT a.course_id ... IF v_course IS NULL THEN RAISE 'not_enrolled'
-- and every v3 achievement has a NULL course_id, so on v3 this RPC could only
-- ever fail. src/features/study/timeTrial.ts calls it live and swallows the
-- error, so a cleared time trial silently failed to credit the method - which
-- is the gate that lets a learner reach the quiz.
--
-- The gate now mirrors record_study_progress exactly: always_free -> allow;
-- v3 -> has_academy_access + user_topic_enrollments; anything else ->
-- retired_content.
--
-- ONE deliberate difference from the old body: the `method_not_applicable`
-- check is gone. It was UNREACHABLE on v3 (the course_id test fired first), so
-- keeping it would introduce a brand-new failure mode rather than preserve one.
-- Applicability is already enforced where it matters - start_quiz_attempt's
-- study gate only counts methods listed in achievements.applicable_methods.
-- To restore it, re-add the two commented lines below.
CREATE OR REPLACE FUNCTION public.credit_time_trial(p_achievement_id uuid, p_method_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET statement_timeout TO '15s'
AS $function$
DECLARE
  v_user uuid; v_ach_cvid uuid; v_free boolean; v_req_passes int;
  -- v_applicable text[];   -- re-add with the two lines below to restore the check
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
BEGIN
  -- 1. caller
  SELECT id INTO v_user FROM users WHERE auth_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;

  -- 2. method must exist
  SELECT required_passes INTO v_req_passes FROM study_methods WHERE key = p_method_key;
  IF v_req_passes IS NULL THEN RAISE EXCEPTION 'invalid_method'; END IF;

  -- 3. eligibility (fail-closed) -- mirrors record_study_progress
  SELECT a.curriculum_version_id, a.always_free
    INTO v_ach_cvid, v_free
  FROM achievements a WHERE a.id = p_achievement_id;
  IF v_ach_cvid IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;

  -- SELECT a.applicable_methods INTO v_applicable FROM achievements a WHERE a.id = p_achievement_id;
  -- IF NOT (p_method_key = ANY(COALESCE(v_applicable, ARRAY[]::text[]))) THEN RAISE EXCEPTION 'method_not_applicable'; END IF;

  IF COALESCE(v_free, false) THEN
    IF v_ach_cvid = c_v3 THEN
      INSERT INTO student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
      VALUES (v_user, p_achievement_id, 'unlocked', 0, 0, 0) ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  ELSIF v_ach_cvid = c_v3 THEN
    IF NOT public.has_academy_access(auth.uid()) THEN RAISE EXCEPTION 'academy_required'; END IF;
    IF NOT EXISTS (SELECT 1 FROM user_topic_enrollments ute
                   WHERE ute.user_id = v_user AND ute.achievement_id = p_achievement_id) THEN
      RAISE EXCEPTION 'not_enrolled'; END IF;
    INSERT INTO student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
    VALUES (v_user, p_achievement_id, 'unlocked', 0, 0, 0) ON CONFLICT (user_id, achievement_id) DO NOTHING;
  ELSE
    RAISE EXCEPTION 'retired_content';
  END IF;

  -- 4. upsert row if missing (mirror record_study_progress insert defaults), then flag trial_passed (idempotent)
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

-- =============================================================== start_quiz_attempt
-- Baseline: REMOVE_V1_REMNANTS stage 30 output. Changes here:
--   * a.course_id is no longer selected; v_course and v_enr_cvid are gone.
--   * `if v_course is null and v_ach_cvid <> c_v3 then raise not_enrolled` is
--     removed - it only existed to reject a v1/v2 row with no course.
--   * the `else` arm (enrollment lookup + version match) becomes retired_content.
--   * the now-unreachable `else` of the status check collapses into the v3 path.
-- The v3 arm, lockout, pool, study-gate, draw and materialise logic are
-- byte-for-byte as stage 30 left them.
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_achievement_id uuid, p_client_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET statement_timeout TO '30s'
AS $function$
declare
  v_user uuid; v_attempt_id uuid; v_existing uuid; v_ach_cvid uuid;
  v_status text; v_lockout timestamptz; v_best int; v_is_active boolean; v_is_prereq boolean;
  v_pool int; v_is_practice boolean; v_attempt_number int; v_gate_fail int; v_materialized int;
  v_gs int; v_free boolean;
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
  c_v1 constant uuid := 'c689c0c4-1d93-4a92-9159-2af019745c49';
begin
  select id into v_user from users where auth_id = auth.uid();
  if v_user is null then raise exception 'user_not_found'; end if;
  select id into v_existing from quiz_attempts where client_attempt_id = p_client_attempt_id and user_id = v_user;
  if v_existing is not null then return build_attempt_payload(v_existing); end if;
  select id into v_existing from quiz_attempts where user_id = v_user and achievement_id = p_achievement_id and attempt_status = 'in_progress' limit 1;
  if v_existing is not null then return build_attempt_payload(v_existing); end if;
  select a.curriculum_version_id, a.is_active, a.is_prerequisite, a.global_sequence, a.always_free
    into v_ach_cvid, v_is_active, v_is_prereq, v_gs, v_free from achievements a where a.id = p_achievement_id;
  if v_ach_cvid is null then raise exception 'not_enrolled'; end if;

  -- Archived v1 quizzes are retired under the discrete model (owner 2026-08-10).
  if v_ach_cvid = c_v1 then raise exception 'archived_quiz_retired'; end if;

  if v_ach_cvid = c_v3 then
    if not v_free and not public.has_academy_access(auth.uid()) then raise exception 'academy_required'; end if;
    if not exists (select 1 from user_topic_enrollments ute where ute.user_id = v_user and ute.achievement_id = p_achievement_id) then
      raise exception 'not_enrolled'; end if;
    insert into student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
    values (v_user, p_achievement_id, 'unlocked', 0, 0, 0) on conflict (user_id, achievement_id) do nothing;
  else
    -- Was: the institutional enrolment lookup against the legacy course
    -- tables, all of which are gone as of 2026-09-03.
    raise exception 'retired_content';
  end if;

  select status, lockout_until, best_genuine_score into v_status, v_lockout, v_best
  from student_achievement_progress where user_id = v_user and achievement_id = p_achievement_id;
  if v_lockout is not null and v_lockout >= now() then raise exception 'under_lockout'; end if;

  select count(*) into v_pool from quiz_questions where achievement_id = p_achievement_id and usage = 'graded_quiz' and review_status = 'approved';
  if v_is_active is not true then raise exception 'pool_too_small'; end if;

  select count(*) into v_gate_fail from (select m as method_key from achievements a, unnest(coalesce(a.applicable_methods, array[]::text[])) as m where a.id = p_achievement_id) req
  left join study_methods sm on sm.key = req.method_key
  left join student_method_progress smp on smp.user_id = v_user and smp.achievement_id = p_achievement_id and smp.method_key = req.method_key and smp.is_applicable = true
  where smp.id is null or sm.id is null or (not coalesce(smp.trial_passed, false) and (smp.completion_pct < 100 or smp.engagement_seconds < sm.min_engagement_seconds
     or (sm.requires_accuracy and smp.answered_count = 0) or (sm.requires_accuracy and smp.answered_count > 0 and (smp.correct_count::numeric / smp.answered_count) * 100 < sm.accuracy_threshold)));
  if v_gate_fail > 0 then raise exception 'study_gate_unmet'; end if;

  -- (3) practice = topic already complete (size-independent)
  v_is_practice := (v_status = 'complete');
  select coalesce(max(attempt_number) filter (where not is_practice), 0) + 1 into v_attempt_number from quiz_attempts where user_id = v_user and achievement_id = p_achievement_id;
  begin
    insert into quiz_attempts (id, user_id, achievement_id, attempt_number, score, is_practice, started_at, submitted_at, attempt_status, client_attempt_id)
    values (gen_random_uuid(), v_user, p_achievement_id, v_attempt_number, 0, v_is_practice, now(), null, 'in_progress', p_client_attempt_id) returning id into v_attempt_id;
  exception when unique_violation then
    select id into v_existing from quiz_attempts where client_attempt_id = p_client_attempt_id and user_id = v_user;
    if v_existing is null then select id into v_existing from quiz_attempts where user_id = v_user and achievement_id = p_achievement_id and attempt_status = 'in_progress' limit 1; end if;
    return build_attempt_payload(v_existing);
  end;

  -- (1)(2) PER-TERM discrete draw: <=1 item/term, I/A-first, weighted 1-of-5.
  with prev_terms as (
    select distinct qq.glossary_id
    from quiz_attempt_items qai
    join quiz_attempts pa on pa.id = qai.attempt_id
    join quiz_questions qq on qq.id = qai.question_id
    where pa.user_id = v_user and pa.achievement_id = p_achievement_id and pa.id <> v_attempt_id
      and pa.started_at = (select max(p2.started_at) from quiz_attempts p2 where p2.user_id = v_user and p2.achievement_id = p_achievement_id and p2.id <> v_attempt_id)
  ),
  terms as materialized (
    select q.glossary_id,
           max(gt.difficulty) as diff,
           (q.glossary_id in (select glossary_id from prev_terms)) as was_prev
    from quiz_questions q
    join glossary_topics gt on gt.glossary_id = q.glossary_id and gt.achievement_id = q.achievement_id
    where q.achievement_id = p_achievement_id and q.usage in ('graded_quiz','scenario') and q.review_status = 'approved'
    group by q.glossary_id
  ),
  ia as materialized (
    select glossary_id from terms where diff in ('intermediate','advanced') order by was_prev asc, random() limit 22
  ),
  fill as materialized (
    select glossary_id from terms where glossary_id not in (select glossary_id from ia)
    order by was_prev asc, random()
    limit (greatest(0, least(30, (select count(*) from terms)) - (select count(*) from ia)))
  ),
  sel_terms as (select glossary_id from ia union all select glossary_id from fill),
  picked as (
    select distinct on (q.glossary_id) q.id
    from quiz_questions q
    join sel_terms s on s.glossary_id = q.glossary_id
    where q.achievement_id = p_achievement_id and q.usage in ('graded_quiz','scenario') and q.review_status = 'approved'
    order by q.glossary_id, power(random(), 1.0 / case when q.usage = 'graded_quiz' then 2.0 else 1.0 end) desc
  ),
  ordered as (select id, (row_number() over (order by random()))::smallint as slot_index from picked)
  insert into quiz_attempt_items (attempt_id, slot_index, question_id, is_repeat, served_question_type, served_options, served_correct_answers)
  select v_attempt_id, o.slot_index, o.id, false, m.served_question_type, m.served_options, m.served_correct_answers
  from ordered o cross join lateral public.materialize_discrete_slot(o.id) m;
  get diagnostics v_materialized = row_count;
  -- v3 accepts any nonzero size (variable-size quizzes); archived path is retired above.
  if v_materialized = 0 then raise exception 'pool_too_small'; end if;

  return build_attempt_payload(v_attempt_id);
end;
$function$;

-- ======================================================================= submit_quiz
-- Baseline: REMOVE_V1_REMNANTS stage 30 output. Changes here:
--   * a.course_id / a.badge_trigger / a.is_prerequisite are no longer selected;
--     v_course, v_enr_cv, v_badge_trigger, v_badge_id, v_is_prereq are gone.
--   * the `else` arm (enrollment lookup + version match) becomes retired_content.
--   * `perform unlock_after_safety(...)` removed - that function is dropped in
--     stage 20. It looped over enrollment rows for the achievement's curriculum
--     version; every enrollment row is v1 and no v3 achievement is a
--     prerequisite, so it was a proven no-op on the live path (00_PRECHECK
--     re-proves both).
--   * `v_reach := recompute_reachability(...)` removed - v_reach was already
--     always null on v3, and stays null. `next_topic` in the payload is
--     unchanged.
--   * the badge write removed (owner 2026-09-03: badges are out of the app).
--     It was guarded by achievements.badge_trigger AND a badges row of the same
--     curriculum version; zero v3 achievements carry a badge_trigger and all 4
--     badges are v1, so it could never fire on the live path. `badge_earned`
--     stays in the payload as a constant false, so src/features/quiz/api.ts and
--     TrophyScreen keep working with no app change.
CREATE OR REPLACE FUNCTION public.submit_quiz(p_attempt_id uuid, p_answers jsonb, p_submitted_at timestamp with time zone, p_submitted_offline boolean, p_focus_loss_count integer, p_focus_loss_duration integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET statement_timeout TO '30s'
AS $function$
declare
  v_user uuid; v_att quiz_attempts%rowtype; v_ach_cv uuid;
  v_prev_status text; v_prev_best int; v_lockout timestamptz; v_n int; v_score int := 0; v_wrong jsonb := '{}'::jsonb;
  v_sel jsonb; v_ok boolean; it record; v_timed_out boolean; v_focus_void boolean;
  v_new_best int; v_new_status text; v_trophy boolean := false; v_badge_earned boolean := false;
  v_attempt_status text; v_outcome text; v_lockout_set timestamptz := null; v_reach jsonb := null; v_payload jsonb;
  v_pass_mark int;
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
begin
  select id into v_user from users where auth_id = auth.uid();
  if v_user is null then raise exception 'user_not_found'; end if;
  select * into v_att from quiz_attempts where id = p_attempt_id for update;
  if not found then raise exception 'attempt_not_found'; end if;
  if v_att.user_id <> v_user then raise exception 'not_owner'; end if;
  if v_att.result_payload is not null then return v_att.result_payload; end if;
  if v_att.attempt_status <> 'in_progress' then raise exception 'attempt_not_open'; end if;
  select a.curriculum_version_id into v_ach_cv from achievements a where a.id = v_att.achievement_id;
  if v_ach_cv is distinct from c_v3 then
    -- v3 has no course enrolment; My Enrollments is the gate, checked in
    -- start_quiz_attempt. Every other branch was the institutional enrolment
    -- lookup against the legacy course tables, retired 2026-09-03.
    raise exception 'retired_content';
  end if;
  select status, best_genuine_score, lockout_until into v_prev_status, v_prev_best, v_lockout from student_achievement_progress where user_id = v_user and achievement_id = v_att.achievement_id;
  v_prev_status := coalesce(v_prev_status,'unlocked'); v_prev_best := coalesce(v_prev_best,0);
  if v_prev_status = 'locked' then raise exception 'topic_locked'; end if;
  v_timed_out := (p_submitted_at - v_att.started_at) > interval '602 seconds';
  v_focus_void := (coalesce(p_focus_loss_count,0) >= 2);

  -- (1) variable size, (2) pass_mark = size - 2
  select count(*) into v_n from quiz_attempt_items where attempt_id = p_attempt_id;
  if v_n < 1 or v_n > 30 then raise exception 'bad_serve_set'; end if;
  v_pass_mark := greatest(1, v_n - 2);

  for it in select qai.id, qai.slot_index, qai.served_question_type, qai.served_correct_answers, qq.explanation as explanation
            from quiz_attempt_items qai left join quiz_questions qq on qq.id = qai.question_id where qai.attempt_id = p_attempt_id loop
    v_sel := p_answers -> it.slot_index::text;
    v_ok := grade_one(it.served_question_type, v_sel, it.served_correct_answers);
    update quiz_attempt_items set selected_answer = v_sel, is_correct = v_ok where id = it.id;
    if v_ok then v_score := v_score + 1;
    else v_wrong := v_wrong || jsonb_build_object(it.slot_index::text, jsonb_build_object('correct', it.served_correct_answers, 'selected', v_sel, 'explanation', it.explanation)); end if;
  end loop;
  if v_focus_void then v_attempt_status := 'voided'; v_outcome := 'voided'; v_lockout_set := now() + interval '15 minutes';
  elsif v_timed_out then v_attempt_status := 'timed_out'; v_outcome := 'timed_out';
  else v_attempt_status := 'submitted'; v_outcome := case when v_score >= v_pass_mark then 'full_pass' else 'no_pass' end; end if;
  v_new_status := v_prev_status; v_new_best := v_prev_best;
  if v_attempt_status = 'submitted' and not v_att.is_practice then
    v_new_best := greatest(v_prev_best, v_score);
    if v_score >= v_pass_mark then v_new_status := 'complete';
    else v_new_status := 'unlocked'; end if;
    update student_achievement_progress set status = v_new_status, best_genuine_score = v_new_best, quiz_score = v_score, quiz_attempts = quiz_attempts + 1,
      date_earned = coalesce(date_earned, case when v_new_status='complete' then now() end) where user_id = v_user and achievement_id = v_att.achievement_id;
    if v_new_status = 'complete' and v_prev_status <> 'complete' then
      v_trophy := true;
      -- badge write removed 2026-09-03 (badges are out of the app; it could
      -- never fire on v3). unlock_after_safety call removed 2026-09-03 (proven
      -- no-op on v3; the function is dropped in stage 20).
    end if;
    -- v3 has no course-ordered progression; v_reach stays null, exactly as before.
  end if;
  if v_lockout_set is not null then update student_achievement_progress set lockout_until = v_lockout_set where user_id = v_user and achievement_id = v_att.achievement_id; end if;
  insert into performance_metrics(user_id, total_quiz_attempts, genuine_quiz_attempts, practice_quiz_attempts, total_trophies_earned, last_activity_at)
  values (v_user, 1, case when v_att.is_practice then 0 else 1 end, case when v_att.is_practice then 1 else 0 end, case when v_trophy then 1 else 0 end, now())
  on conflict (user_id) do update set total_quiz_attempts = performance_metrics.total_quiz_attempts + 1,
    genuine_quiz_attempts = performance_metrics.genuine_quiz_attempts + case when v_att.is_practice then 0 else 1 end,
    practice_quiz_attempts = performance_metrics.practice_quiz_attempts + case when v_att.is_practice then 1 else 0 end,
    total_trophies_earned = performance_metrics.total_trophies_earned + case when v_trophy then 1 else 0 end, last_activity_at = now();
  v_payload := jsonb_build_object('attempt_id', p_attempt_id, 'score', v_score, 'outcome', v_outcome, 'new_status', v_new_status, 'best_genuine_score', v_new_best,
      'badge_earned', v_badge_earned, 'trophy_granted', v_trophy, 'next_topic', v_reach, 'wrong_answers', v_wrong, 'lockout_until', v_lockout_set);
  update quiz_attempts set score = v_score, answers_json = p_answers, wrong_answers = v_wrong, submitted_at = p_submitted_at, submitted_offline = p_submitted_offline,
      focus_loss_count = p_focus_loss_count, focus_loss_duration = p_focus_loss_duration, voided = (v_attempt_status = 'voided'),
      void_reason = case v_attempt_status when 'voided' then 'focus_loss' when 'timed_out' then 'timeout' else null end,
      attempt_status = v_attempt_status, result_payload = v_payload where id = p_attempt_id;
  perform public.refresh_student_metrics(v_user);
  return v_payload;
end;
$function$;

-- ============================================================== lookup_student_by_qr
-- Loses the is_instructor_for_user disjunct so that function can be dropped in
-- stage 20. Access narrows to is_ta_or_admin(). No app caller (grep of src/ and
-- web/ finds none); the badge columns it returns are retained so the signature
-- is unchanged.
CREATE OR REPLACE FUNCTION public.lookup_student_by_qr(p_qr_token uuid)
 RETURNS TABLE(user_id uuid, nickname text, first_name text, last_name_initial text, ape_student_id text, badge_name text, earned_at timestamp with time zone, is_active boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT u.id, u.nickname, u.first_name, u.last_name_initial, u.ape_student_id,
         b.name, sb.earned_at, (sb.revoked_at IS NULL)
  FROM public.users u
  LEFT JOIN public.student_badges sb ON sb.user_id = u.id
  LEFT JOIN public.badges b          ON b.id = sb.badge_id
  WHERE u.qr_token = p_qr_token
    AND public.is_ta_or_admin();
$function$;

COMMIT;

-- Read-back: none of the seven may still mention any of the five targets.
SELECT p.proname,
       CASE WHEN p.prosrc ~* '\mcourses\M|\menrollment\M|\mcourse_sections\M|\msession_logs\M|\mcourse_id\M|is_instructor_for_user'
            THEN 'FAIL - still references a target object' ELSE 'PASS' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('refresh_student_metrics','delete_my_account','record_study_progress',
                    'credit_time_trial','start_quiz_attempt','submit_quiz','lookup_student_by_qr')
ORDER BY p.proname;
