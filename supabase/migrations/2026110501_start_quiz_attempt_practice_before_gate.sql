-- Practice on a passed topic: decided before the study check (owner 2026-11-05).
-- Applied live by Comp A on 2026-11-05 at 09:08 PT. This file records the live definition;
-- function definition md5 fb6bdc463cfe9f29cd94d2e3152ea2b7. Grants and owner unchanged.
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
  select a.curriculum_version_id, a.is_active, a.global_sequence, a.always_free
    into v_ach_cvid, v_is_active, v_gs, v_free from achievements a where a.id = p_achievement_id;
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

  -- (3) practice = topic already complete (size-independent). Decided before the
  -- study check: a passed topic can always be practiced (owner 2026-11-05).
  v_is_practice := (v_status = 'complete');

  select count(*) into v_gate_fail from (select m as method_key from achievements a, unnest(coalesce(a.applicable_methods, array[]::text[])) as m where a.id = p_achievement_id) req
  left join study_methods sm on sm.key = req.method_key
  left join student_method_progress smp on smp.user_id = v_user and smp.achievement_id = p_achievement_id and smp.method_key = req.method_key and smp.is_applicable = true
  where smp.id is null or sm.id is null or ((smp.completion_pct < 100 or smp.engagement_seconds < sm.min_engagement_seconds
     or (sm.requires_accuracy and smp.answered_count = 0) or (sm.requires_accuracy and smp.answered_count > 0 and (smp.correct_count::numeric / smp.answered_count) * 100 < sm.accuracy_threshold)));
  if v_gate_fail > 0 and v_is_practice is not true then raise exception 'study_gate_unmet'; end if;

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
