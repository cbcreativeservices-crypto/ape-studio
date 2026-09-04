-- REMOVE V1 REMNANTS · STAGE 30 · strip the v1 "commercial" branches out of
-- start_quiz_attempt and submit_quiz.
--
-- These two functions are the last live readers of public_course_topics.
-- Stage 60 cannot drop that table until this has run. Function bodies are NOT
-- dependency-checked by Postgres, so a DROP TABLE first would break both
-- functions silently at runtime.
--
-- ---------------------------------------------------------------- what changes
-- start_quiz_attempt
--   * Removes the `elsif v_audience = 'commercial'` arm (both places) and the
--     v_public_course / v_audience locals.
--   * PROVEN DEAD, not merely unused: that arm is only reachable when the
--     achievement's curriculum is neither v3 (the arm above it) nor v1 (which
--     raises `archived_quiz_retired` earlier). Every one of the 51 achievements
--     rows carrying a course_id is v1, and any non-v3 row with a NULL course_id
--     is rejected by `if v_course is null and v_ach_cvid <> c_v3 then
--     raise 'not_enrolled'` before the branch is evaluated. 00_PRECHECK
--     section "deadcode" re-proves this against live data; if it returns
--     anything other than 0, DO NOT RUN THIS FILE.
--   * Everything else - the v3 arm, the institutional/enrollment arm, the
--     lockout, pool, study-gate, draw and materialise logic - is byte-for-byte
--     as it was.
--
-- submit_quiz
--   * The `v_audience = 'commercial'` arm here is NOT dead: every registered
--     app user is audience='commercial' (register_commercial_user is the only
--     writer), so this is the live path for v3 submissions. Deleting the arm
--     outright would send every user into the enrollment lookup and break quiz
--     submission for the whole app.
--   * So the arm is RETARGETED, not removed: the test becomes
--     `v_ach_cv = c_v3` and the two v1 bodies inside it go away.
--       - the `public_course_topics ... placement='primary'` lookup is deleted
--         (it can only ever match a v1 achievement, so for v3 it always
--         returned NULL);
--       - `recompute_reachability_commercial(...)` is deleted. It was already
--         guarded by `if v_public_course is not null`, which for v3 was never
--         true, so v_reach stayed NULL. It still stays NULL. No behaviour
--         change on the live path.
--       - the `elsif false then ... end` block (dead since the pass-mark
--         rework) is deleted; it was the other public_course_topics reader.
--   * ONE deliberate behaviour change: an audience='institutional' user
--     submitting a v3 attempt previously got 'not_enrolled' from submit_quiz
--     even though start_quiz_attempt had already let them start (its v3 arm
--     does not look at audience). They now submit normally. This makes the two
--     functions agree. 4 institutional users exist; all are owner test rows.
--
-- Idempotent: CREATE OR REPLACE.

BEGIN;

DO $guard$
DECLARE v_bad int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.v1remnants_func_backup_20260903 WHERE proname='start_quiz_attempt')
     OR NOT EXISTS (SELECT 1 FROM public.v1remnants_func_backup_20260903 WHERE proname='submit_quiz') THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not captured both quiz functions';
  END IF;

  -- Re-prove the dead-branch claim at apply time, not just at precheck time.
  SELECT count(*) INTO v_bad FROM public.achievements
  WHERE course_id IS NOT NULL
    AND curriculum_version_id <> 'c689c0c4-1d93-4a92-9159-2af019745c49'::uuid;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'refusing to run: % non-v1 achievements carry a course_id, so the removed branch is reachable', v_bad;
  END IF;

  SELECT count(*) INTO v_bad
  FROM public.public_course_topics pct
  JOIN public.achievements a ON a.id = pct.achievement_id
  WHERE a.curriculum_version_id <> 'c689c0c4-1d93-4a92-9159-2af019745c49'::uuid;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'refusing to run: % public_course_topics rows point at non-v1 achievements', v_bad;
  END IF;
END $guard$;

------------------------------------------------------------------ start_quiz_attempt
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_achievement_id uuid, p_client_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET statement_timeout TO '30s'
AS $function$
declare
  v_user uuid; v_attempt_id uuid; v_existing uuid; v_course uuid; v_ach_cvid uuid; v_enr_cvid uuid;
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
  select a.course_id, a.curriculum_version_id, a.is_active, a.is_prerequisite, a.global_sequence, a.always_free
    into v_course, v_ach_cvid, v_is_active, v_is_prereq, v_gs, v_free from achievements a where a.id = p_achievement_id;
  if v_ach_cvid is null then raise exception 'not_enrolled'; end if;
  if v_course is null and v_ach_cvid <> c_v3 then raise exception 'not_enrolled'; end if;

  -- Archived v1 quizzes are retired under the discrete model (owner 2026-08-10).
  if v_ach_cvid = c_v1 then raise exception 'archived_quiz_retired'; end if;

  if v_ach_cvid = c_v3 then
    if not v_free and not public.has_academy_access(auth.uid()) then raise exception 'academy_required'; end if;
    if not exists (select 1 from user_topic_enrollments ute where ute.user_id = v_user and ute.achievement_id = p_achievement_id) then
      raise exception 'not_enrolled'; end if;
    insert into student_achievement_progress(user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
    values (v_user, p_achievement_id, 'unlocked', 0, 0, 0) on conflict (user_id, achievement_id) do nothing;
  else
    select e.curriculum_version_id into v_enr_cvid from enrollment e where e.user_id = v_user and e.course_id = v_course;
    if v_enr_cvid is null then raise exception 'not_enrolled'; end if;
    if v_enr_cvid is distinct from v_ach_cvid then raise exception 'version_mismatch'; end if;
  end if;

  select status, lockout_until, best_genuine_score into v_status, v_lockout, v_best
  from student_achievement_progress where user_id = v_user and achievement_id = p_achievement_id;
  if v_ach_cvid = c_v3 then
    null;
  else
    if v_status is null or v_status = 'locked' then raise exception 'topic_locked'; end if;
  end if;
  if v_lockout is not null and v_lockout >= now() then raise exception 'under_lockout'; end if;

  select count(*) into v_pool from quiz_questions where achievement_id = p_achievement_id and usage = 'graded_quiz' and review_status = 'approved';
  if v_is_active is not true then raise exception 'pool_too_small'; end if;
  if v_ach_cvid <> c_v3 and v_pool < 30 then raise exception 'pool_too_small'; end if;

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
  if v_ach_cvid <> c_v3 and v_materialized <> 30 then raise exception 'pool_too_small'; end if;

  return build_attempt_payload(v_attempt_id);
end;
$function$;

------------------------------------------------------------------------ submit_quiz
CREATE OR REPLACE FUNCTION public.submit_quiz(p_attempt_id uuid, p_answers jsonb, p_submitted_at timestamp with time zone, p_submitted_offline boolean, p_focus_loss_count integer, p_focus_loss_duration integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
 SET statement_timeout TO '30s'
AS $function$
declare
  v_user uuid; v_att quiz_attempts%rowtype; v_course uuid; v_ach_cv uuid; v_enr_cv uuid; v_badge_trigger text; v_is_prereq boolean;
  v_prev_status text; v_prev_best int; v_lockout timestamptz; v_n int; v_score int := 0; v_wrong jsonb := '{}'::jsonb;
  v_sel jsonb; v_ok boolean; it record; v_timed_out boolean; v_focus_void boolean;
  v_new_best int; v_new_status text; v_trophy boolean := false; v_badge_earned boolean := false;
  v_attempt_status text; v_outcome text; v_lockout_set timestamptz := null; v_reach jsonb := null; v_badge_id uuid; v_payload jsonb;
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
  select a.course_id, a.curriculum_version_id, a.badge_trigger, a.is_prerequisite into v_course, v_ach_cv, v_badge_trigger, v_is_prereq from achievements a where a.id = v_att.achievement_id;
  if v_ach_cv = c_v3 then
    -- v3 has no course enrollment; My Enrollments is the gate, checked in start_quiz_attempt.
    v_enr_cv := v_ach_cv;
  else
    select e.curriculum_version_id into v_enr_cv from enrollment e where e.user_id = v_user and e.course_id = v_course;
    if v_enr_cv is null then raise exception 'not_enrolled'; end if;
    if v_enr_cv is distinct from v_ach_cv then raise exception 'version_mismatch'; end if;
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
    -- (the former `elsif false then ... passed_incomplete ...` arm was dead code
    --  since the pass-mark rework and was the last public_course_topics reader here)
    if v_score >= v_pass_mark then v_new_status := 'complete';
    else v_new_status := 'unlocked'; end if;
    update student_achievement_progress set status = v_new_status, best_genuine_score = v_new_best, quiz_score = v_score, quiz_attempts = quiz_attempts + 1,
      date_earned = coalesce(date_earned, case when v_new_status='complete' then now() end) where user_id = v_user and achievement_id = v_att.achievement_id;
    if v_new_status = 'complete' and v_prev_status <> 'complete' then
      v_trophy := true;
      if v_badge_trigger is not null then
        select id into v_badge_id from badges where name = v_badge_trigger and curriculum_version_id = v_ach_cv;
        if v_badge_id is not null then
          insert into student_badges(user_id, badge_id, badge_name_snapshot, source) values (v_user, v_badge_id, v_badge_trigger, 'earned') on conflict (user_id, badge_name_snapshot) do nothing;
          v_badge_earned := true;
        end if;
      end if;
      if v_is_prereq is true then perform unlock_after_safety(v_user, v_ach_cv); end if;
    end if;
    if v_ach_cv = c_v3 then
      -- v3 has no course-ordered progression; v_reach stays null, exactly as before.
      null;
    else v_reach := recompute_reachability(v_user, v_ach_cv, v_course); end if;
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

COMMIT;

-- Read-back: neither quiz function may still mention public_course*.
SELECT p.proname,
       CASE WHEN regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* 'public_course' THEN 'FAIL - still reads public_course*' ELSE 'PASS' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('start_quiz_attempt','submit_quiz')
ORDER BY p.proname;
