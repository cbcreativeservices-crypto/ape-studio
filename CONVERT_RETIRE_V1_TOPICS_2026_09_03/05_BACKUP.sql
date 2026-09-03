-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 05_BACKUP
-- Creates the mapping table every later stage reads, plus a verbatim copy of
-- every row any later stage can touch. Writes nothing outside its own tables.
-- Idempotent: re-running rebuilds the map and tops up the backups.

-- ============================================================ 1. the map/SSoT
create table if not exists public.cr_v1topics_map_20260903 (
  v1_id        uuid primary key,
  v1_gs        integer not null,
  v1_name      text    not null,
  v1_is_active boolean not null,
  v3_id        uuid,
  v3_gs        integer,
  v3_name      text,
  class        text    not null check (class in ('CONVERT','RETIRE','BLOCKED')),
  built_at     timestamptz not null default now()
);

do $$
declare
  c_v1 constant uuid := 'c689c0c4-1d93-4a92-9159-2af019745c49';
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
  v_convert int; v_retire int; v_blocked int; v_total int; v_badname int;
begin
  delete from public.cr_v1topics_map_20260903;

  insert into public.cr_v1topics_map_20260903
        (v1_id, v1_gs, v1_name, v1_is_active, v3_id, v3_gs, v3_name, class)
  with pairs(v1_gs, v3_gs) as (values
    (0,3060),(2,3070),(4,3030),(8,3340),(12,3180),(14,3560),(15,3570),(16,3600),(22,3770),
    (32,3300),(35,3190),(37,4040),(41,4360),(46,4380),(47,4370),(49,4390),(50,4400))
  select v1.id, v1.global_sequence, v1.name, v1.is_active,
         v3.id, v3.global_sequence, v3.name,
         case when v3.id is not null then 'CONVERT'
              when v1.is_active     then 'BLOCKED'
              else                       'RETIRE' end
  from public.achievements v1
  left join pairs p on p.v1_gs = v1.global_sequence
  left join public.achievements v3
         on v3.curriculum_version_id = c_v3
        and v3.global_sequence = p.v3_gs
  where v1.course_id is not null;

  select count(*) filter (where class='CONVERT'),
         count(*) filter (where class='RETIRE'),
         count(*) filter (where class='BLOCKED'),
         count(*)
    into v_convert, v_retire, v_blocked, v_total
  from public.cr_v1topics_map_20260903;

  -- Every mapped topic must live in v1 and every twin in v3, or the pair list
  -- is stale. Names must still match case-insensitively.
  select count(*) into v_badname
  from public.cr_v1topics_map_20260903 m
  where m.class='CONVERT' and lower(btrim(m.v1_name)) <> lower(btrim(m.v3_name));

  if v_total <> 51 then
    raise exception 'BACKUP ABORTED: expected 51 v1 topics with a course_id, found %', v_total;
  end if;
  if v_convert <> 17 or v_retire <> 29 or v_blocked <> 5 then
    raise exception 'BACKUP ABORTED: split is %/%/% (CONVERT/RETIRE/BLOCKED), expected 17/29/5', v_convert, v_retire, v_blocked;
  end if;
  if v_badname > 0 then
    raise exception 'BACKUP ABORTED: % CONVERT pair(s) no longer share a name with their v3 twin', v_badname;
  end if;
  if exists (select 1 from public.cr_v1topics_map_20260903 m
             join public.achievements a on a.id=m.v1_id
             where a.curriculum_version_id <> c_v1) then
    raise exception 'BACKUP ABORTED: a mapped source row is not in the v1 curriculum';
  end if;
  if (select array_agg(v1_gs order by v1_gs) from public.cr_v1topics_map_20260903 where class='BLOCKED')
     <> array[1,9,17,19,21] then
    raise exception 'BACKUP ABORTED: the BLOCKED set is not exactly gs 1,9,17,19,21 - the owner ruling does not fit the data any more';
  end if;
end $$;

-- ================================================== 2. the report/audit table
create table if not exists public.cr_v1topics_report_20260903 (
  at      timestamptz not null default now(),
  stage   text not null,
  k       text not null,
  v       text
);

-- ============================================= 3. verbatim row-level backups
-- achievements (all 51, including the 5 BLOCKED, so a rollback is total)
create table if not exists public.cr_v1topics_achievements_20260903 as
  select a.* from public.achievements a where false;
insert into public.cr_v1topics_achievements_20260903
  (id, curriculum_version_id, course_id, sequence_in_course, global_sequence, name,
   description, icon_url, badge_trigger, applicable_methods, is_active, created_at,
   is_prerequisite, always_free, field, subject)
select a.id, a.curriculum_version_id, a.course_id, a.sequence_in_course, a.global_sequence, a.name,
       a.description, a.icon_url, a.badge_trigger, a.applicable_methods, a.is_active, a.created_at,
       a.is_prerequisite, a.always_free, a.field, a.subject
from public.achievements a
where a.course_id is not null
  and not exists (select 1 from public.cr_v1topics_achievements_20260903 b where b.id=a.id);

-- glossary_topics (1,978 rows today, ALL on CONVERT topics)
create table if not exists public.cr_v1topics_glossary_topics_20260903 as
  select g.* from public.glossary_topics g where false;
insert into public.cr_v1topics_glossary_topics_20260903
  (id, glossary_id, achievement_id, is_primary, created_at, difficulty)
select g.id, g.glossary_id, g.achievement_id, g.is_primary, g.created_at, g.difficulty
from public.glossary_topics g
where g.achievement_id in (select v1_id from public.cr_v1topics_map_20260903)
  and not exists (select 1 from public.cr_v1topics_glossary_topics_20260903 b where b.id=g.id);

-- student_achievement_progress
create table if not exists public.cr_v1topics_sap_20260903 as
  select s.* from public.student_achievement_progress s where false;
insert into public.cr_v1topics_sap_20260903
  (id, user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts, lockout_until, date_earned)
select s.id, s.user_id, s.achievement_id, s.status, s.best_genuine_score, s.quiz_score, s.quiz_attempts, s.lockout_until, s.date_earned
from public.student_achievement_progress s
where s.achievement_id in (select v1_id from public.cr_v1topics_map_20260903)
  and not exists (select 1 from public.cr_v1topics_sap_20260903 b where b.id=s.id);

-- student_method_progress
create table if not exists public.cr_v1topics_smp_20260903 as
  select s.* from public.student_method_progress s where false;
insert into public.cr_v1topics_smp_20260903
  (id, user_id, achievement_id, method_key, completion_pct, engagement_seconds, answered_count,
   correct_count, item_states, is_applicable, last_updated, trial_passed)
select s.id, s.user_id, s.achievement_id, s.method_key, s.completion_pct, s.engagement_seconds, s.answered_count,
       s.correct_count, s.item_states, s.is_applicable, s.last_updated, s.trial_passed
from public.student_method_progress s
where s.achievement_id in (select v1_id from public.cr_v1topics_map_20260903)
  and not exists (select 1 from public.cr_v1topics_smp_20260903 b where b.id=s.id);

-- quiz_attempts + their items (items cascade on delete, so they need their own copy)
create table if not exists public.cr_v1topics_quiz_attempts_20260903 as
  select q.* from public.quiz_attempts q where false;
insert into public.cr_v1topics_quiz_attempts_20260903
  (id, user_id, achievement_id, attempt_number, score, is_practice, answers_json, wrong_answers,
   started_at, submitted_at, attempt_status, submitted_offline, focus_loss_count, focus_loss_duration,
   voided, void_reason, client_attempt_id, result_payload)
select q.id, q.user_id, q.achievement_id, q.attempt_number, q.score, q.is_practice, q.answers_json, q.wrong_answers,
       q.started_at, q.submitted_at, q.attempt_status, q.submitted_offline, q.focus_loss_count, q.focus_loss_duration,
       q.voided, q.void_reason, q.client_attempt_id, q.result_payload
from public.quiz_attempts q
where q.achievement_id in (select v1_id from public.cr_v1topics_map_20260903)
  and not exists (select 1 from public.cr_v1topics_quiz_attempts_20260903 b where b.id=q.id);

create table if not exists public.cr_v1topics_quiz_attempt_items_20260903 as
  select i.* from public.quiz_attempt_items i where false;
insert into public.cr_v1topics_quiz_attempt_items_20260903
  (id, attempt_id, slot_index, question_id, is_repeat, served_question_type, served_correct_answers,
   selected_answer, is_correct, served_options)
select i.id, i.attempt_id, i.slot_index, i.question_id, i.is_repeat, i.served_question_type, i.served_correct_answers,
       i.selected_answer, i.is_correct, i.served_options
from public.quiz_attempt_items i
where i.attempt_id in (select id from public.cr_v1topics_quiz_attempts_20260903)
  and not exists (select 1 from public.cr_v1topics_quiz_attempt_items_20260903 b where b.id=i.id);

-- Reference-only copies. NOTHING in this package modifies these two, but the
-- rollback and the Stage 40 guards need to know what was there.
create table if not exists public.cr_v1topics_quiz_questions_ref_20260903 as
  select q.* from public.quiz_questions q where q.achievement_id in (select v1_id from public.cr_v1topics_map_20260903);
create table if not exists public.cr_v1topics_badges_ref_20260903 as
  select b.* from public.badges b where b.trigger_achievement_id in (select v1_id from public.cr_v1topics_map_20260903);

-- ============================================================ 4. what we got
insert into public.cr_v1topics_report_20260903 (stage, k, v)
select '05_BACKUP', k, v from (values
  ('map_convert',      (select count(*)::text from public.cr_v1topics_map_20260903 where class='CONVERT')),
  ('map_retire',       (select count(*)::text from public.cr_v1topics_map_20260903 where class='RETIRE')),
  ('map_blocked',      (select count(*)::text from public.cr_v1topics_map_20260903 where class='BLOCKED')),
  ('bkp_achievements', (select count(*)::text from public.cr_v1topics_achievements_20260903)),
  ('bkp_glossary_topics', (select count(*)::text from public.cr_v1topics_glossary_topics_20260903)),
  ('bkp_sap',          (select count(*)::text from public.cr_v1topics_sap_20260903)),
  ('bkp_smp',          (select count(*)::text from public.cr_v1topics_smp_20260903)),
  ('bkp_quiz_attempts',(select count(*)::text from public.cr_v1topics_quiz_attempts_20260903)),
  ('bkp_quiz_items',   (select count(*)::text from public.cr_v1topics_quiz_attempt_items_20260903)),
  ('ref_quiz_questions',(select count(*)::text from public.cr_v1topics_quiz_questions_ref_20260903)),
  ('ref_badges',       (select count(*)::text from public.cr_v1topics_badges_ref_20260903))
) t(k,v);

select stage, k, v from public.cr_v1topics_report_20260903 where stage='05_BACKUP' order by at desc, k;
select class, v1_gs, v1_name, v1_is_active, v3_gs, v3_name
from public.cr_v1topics_map_20260903 order by class, v1_gs;
