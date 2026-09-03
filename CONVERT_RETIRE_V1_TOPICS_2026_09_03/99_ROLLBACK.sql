-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 99_ROLLBACK
--
-- Reverses every stage that has run, in reverse order, from the 05_BACKUP
-- tables. One atomic DO block. Idempotent: a stage that did not run is skipped.
--
-- WHAT IT RESTORES EXACTLY
--   * all 51 achievements rows and their is_active / always_free /
--     is_prerequisite flags - including the five the owner ruled removed on
--     2026-09-03, which come back active exactly as they were
--   * every glossary_topics, student_achievement_progress and
--     student_method_progress row, back on its original v1 topic, with its
--     original id and every column value
--   * every quiz_attempts row and its quiz_attempt_items
--
-- WHAT IT CANNOT UNDO
--   * evaluate_user_credentials(). Stage 10 recomputed credentials for the
--     affected users, and re-inserting a 'complete' progress row fires the
--     student_progress_award trigger again. Credential state is therefore
--     RECOMPUTED, not rewound - a recompute, not a byte-for-byte restore.
--   * anything you did to quiz_questions or badges by hand. This package never
--     touched either, so it cannot put them back.

do $$
declare
  v_a int; v_gt int; v_sap int; v_smp int; v_qa int; v_qi int; v_flag int;
begin
  if to_regclass('public.cr_v1topics_map_20260903') is null then
    raise exception 'ROLLBACK ABORTED: no mapping table - nothing from this package has run';
  end if;
  if to_regclass('public.cr_v1topics_achievements_20260903') is null then
    raise exception 'ROLLBACK ABORTED: the achievements backup is gone - cannot restore';
  end if;

  -- ------------------------------------------- undo Stage 40 (hard delete)
  insert into public.achievements
    (id, curriculum_version_id, course_id, sequence_in_course, global_sequence, name,
     description, icon_url, badge_trigger, applicable_methods, is_active, created_at,
     is_prerequisite, always_free, field, subject)
  select b.id, b.curriculum_version_id, b.course_id, b.sequence_in_course, b.global_sequence, b.name,
         b.description, b.icon_url, b.badge_trigger, b.applicable_methods, b.is_active, b.created_at,
         b.is_prerequisite, b.always_free, b.field, b.subject
  from public.cr_v1topics_achievements_20260903 b
  where not exists (select 1 from public.achievements a where a.id = b.id);
  get diagnostics v_a = row_count;

  -- ------------------------------------------------ undo Stage 30 (retire)
  update public.achievements a
     set is_active       = b.is_active,
         always_free     = b.always_free,
         is_prerequisite = b.is_prerequisite
    from public.cr_v1topics_achievements_20260903 b
   where b.id = a.id
     and (a.is_active       is distinct from b.is_active
       or a.always_free     is distinct from b.always_free
       or a.is_prerequisite is distinct from b.is_prerequisite);
  get diagnostics v_flag = row_count;

  delete from public.cr_v1topics_ledger_20260903;

  -- ------------------- undo Stages 10 and 20 (repoints, merges and purges)
  -- Delete-by-id then re-insert restores repointed rows and deleted rows in one
  -- move. The v3 survivor rows that won a collision are NOT in the backup, so
  -- they are untouched and cannot conflict: their achievement_id differs.
  delete from public.glossary_topics g
   where g.id in (select id from public.cr_v1topics_glossary_topics_20260903);
  insert into public.glossary_topics
    (id, glossary_id, achievement_id, is_primary, created_at, difficulty)
  select id, glossary_id, achievement_id, is_primary, created_at, difficulty
  from public.cr_v1topics_glossary_topics_20260903;
  get diagnostics v_gt = row_count;

  delete from public.student_method_progress s
   where s.id in (select id from public.cr_v1topics_smp_20260903);
  insert into public.student_method_progress
    (id, user_id, achievement_id, method_key, completion_pct, engagement_seconds, answered_count,
     correct_count, item_states, is_applicable, last_updated, trial_passed)
  select id, user_id, achievement_id, method_key, completion_pct, engagement_seconds, answered_count,
         correct_count, item_states, is_applicable, last_updated, trial_passed
  from public.cr_v1topics_smp_20260903;
  get diagnostics v_smp = row_count;

  delete from public.student_achievement_progress s
   where s.id in (select id from public.cr_v1topics_sap_20260903);
  insert into public.student_achievement_progress
    (id, user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts, lockout_until, date_earned)
  select id, user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts, lockout_until, date_earned
  from public.cr_v1topics_sap_20260903;
  get diagnostics v_sap = row_count;

  insert into public.quiz_attempts
    (id, user_id, achievement_id, attempt_number, score, is_practice, answers_json, wrong_answers,
     started_at, submitted_at, attempt_status, submitted_offline, focus_loss_count, focus_loss_duration,
     voided, void_reason, client_attempt_id, result_payload)
  select b.id, b.user_id, b.achievement_id, b.attempt_number, b.score, b.is_practice, b.answers_json, b.wrong_answers,
         b.started_at, b.submitted_at, b.attempt_status, b.submitted_offline, b.focus_loss_count, b.focus_loss_duration,
         b.voided, b.void_reason, b.client_attempt_id, b.result_payload
  from public.cr_v1topics_quiz_attempts_20260903 b
  where not exists (select 1 from public.quiz_attempts q where q.id = b.id);
  get diagnostics v_qa = row_count;

  insert into public.quiz_attempt_items
    (id, attempt_id, slot_index, question_id, is_repeat, served_question_type, served_correct_answers,
     selected_answer, is_correct, served_options)
  select b.id, b.attempt_id, b.slot_index, b.question_id, b.is_repeat, b.served_question_type, b.served_correct_answers,
         b.selected_answer, b.is_correct, b.served_options
  from public.cr_v1topics_quiz_attempt_items_20260903 b
  where not exists (select 1 from public.quiz_attempt_items i where i.id = b.id);
  get diagnostics v_qi = row_count;

  insert into public.cr_v1topics_report_20260903 (stage, k, v) values
    ('99_ROLLBACK','achievements_reinserted',  v_a::text),
    ('99_ROLLBACK','achievement_flags_restored', v_flag::text),
    ('99_ROLLBACK','glossary_topics_restored',  v_gt::text),
    ('99_ROLLBACK','sap_restored',              v_sap::text),
    ('99_ROLLBACK','smp_restored',              v_smp::text),
    ('99_ROLLBACK','quiz_attempts_restored',    v_qa::text),
    ('99_ROLLBACK','quiz_items_restored',       v_qi::text);
end $$;

select stage, k, v, at from public.cr_v1topics_report_20260903 where stage='99_ROLLBACK' order by at desc, k;

-- Sanity: the original picture, back.
select 'restored' as section, k, v from (values
  ('v1 topics with a course_id (expect 51)',
     (select count(*)::text from public.achievements where course_id is not null)),
  ('active among them (expect 14 = 9 CONVERT + the 5 ruled removed)',
     (select count(*)::text from public.achievements where course_id is not null and is_active)),
  ('glossary_topics on them (expect 1978)',
     (select count(*)::text from public.glossary_topics g
      join public.achievements a on a.id=g.achievement_id where a.course_id is not null)),
  ('sap on them (expect 64)',
     (select count(*)::text from public.student_achievement_progress s
      join public.achievements a on a.id=s.achievement_id where a.course_id is not null)),
  ('smp on them (expect 91)',
     (select count(*)::text from public.student_method_progress s
      join public.achievements a on a.id=s.achievement_id where a.course_id is not null)),
  ('quiz_attempts on them (expect 6)',
     (select count(*)::text from public.quiz_attempts q
      join public.achievements a on a.id=q.achievement_id where a.course_id is not null))
) t(k,v);
