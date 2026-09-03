-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 40_APPLY · OPTIONAL HARD DELETE
--
-- ***** DO NOT RUN THIS UNLESS YOU HAVE DECIDED YOU WANT THE ROWS GONE. *****
--
-- Stage 30 already satisfies the ruling, including the removal of the five the
-- owner named on 2026-09-03. This stage exists only if you want all 51 rows
-- physically gone. It will REFUSE to run while anything still points at them,
-- and today it WILL refuse, because:
--
--   * 50 approved quiz_questions sit on v1 gs0 (Pro Audio Safety). Deleting the
--     topic does not delete them - the FK is NO ACTION, so the delete errors.
--     You must first decide: delete those 50 questions, or move them into the
--     v3 gs3060 pool (which already holds 792 and is live).
--   * 4 badges trigger off topics in the set: MIC Certified, REC Certified,
--     MIX Certified, and PA Certified (which hangs off gs17 Assisted Listening
--     Systems, one of the five). Same NO ACTION FK, same decision: delete the
--     badge or retarget it.
--   * public_course_topics still references all 51 until REMOVE_V1_REMNANTS
--     Stage 60 drops that table.
--
-- The refusal is the point. Every guard below names exactly what is in the way.
-- Nothing here uses CASCADE, and glossary_topics' ON DELETE CASCADE is defused
-- by an explicit zero-rows guard rather than being relied on.
--
-- Scope is now all 51 rows. There is no held-back set.

do $$
declare
  v_n int; v_del int;
begin
  if to_regclass('public.cr_v1topics_map_20260903') is null then
    raise exception 'STAGE 40 ABORTED: 05_BACKUP has not been run';
  end if;
  if to_regclass('public.cr_v1topics_achievements_20260903') is null
     or (select count(*) from public.cr_v1topics_achievements_20260903) <> 51 then
    raise exception 'STAGE 40 ABORTED: the achievements backup is missing or incomplete - the rows would be unrecoverable';
  end if;
  if to_regclass('public.cr_v1topics_ledger_20260903') is null
     or (select count(*) from public.cr_v1topics_ledger_20260903) <> 51 then
    raise exception 'STAGE 40 ABORTED: Stage 30 has not run for all 51 topics - retire before you delete';
  end if;
  if exists (select 1 from public.achievements a
             join public.cr_v1topics_map_20260903 m on m.v1_id=a.id where a.is_active) then
    raise exception 'STAGE 40 ABORTED: a topic in the set is still active - run Stage 30 first';
  end if;

  -- ------------------------------------------------ every inbound reference
  select count(*) into v_n from public.glossary_topics x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % glossary_topics rows still point at the set. The FK is ON DELETE CASCADE - a delete would destroy them silently.', v_n; end if;

  select count(*) into v_n from public.quiz_questions x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % quiz_questions still point at the set. Decide whether they are deleted or moved to the v3 twin pool.', v_n; end if;

  select count(*) into v_n from public.badges x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.trigger_achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % badges trigger off the set. Retarget or delete them first.', v_n; end if;

  select count(*) into v_n from public.quiz_attempts x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % quiz_attempts still point at the set - run Stage 20.', v_n; end if;

  select count(*) into v_n from public.student_achievement_progress x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % student_achievement_progress rows still point at the set - run Stages 10 and 20.', v_n; end if;

  select count(*) into v_n from public.student_method_progress x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % student_method_progress rows still point at the set - run Stages 10 and 20.', v_n; end if;

  select count(*) into v_n from public.glossary x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % glossary rows still point at the set.', v_n; end if;

  select count(*) into v_n from public.user_topic_enrollments x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % user_topic_enrollments rows still point at the set.', v_n; end if;

  select count(*) into v_n from public.certificate_topics x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % certificate_topics rows still point at the set.', v_n; end if;

  select count(*) into v_n from public.program_topics x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % program_topics rows still point at the set.', v_n; end if;

  select count(*) into v_n from public.award_standing_requirements x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % award_standing_requirements rows still point at the set.', v_n; end if;

  select count(*) into v_n from public.scenario_homework x
    join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id ;
  if v_n > 0 then raise exception 'STAGE 40 ABORTED: % scenario_homework rows still point at the set.', v_n; end if;

  if to_regclass('public.public_course_topics') is not null then
    execute 'select count(*) from public.public_course_topics x
             join public.cr_v1topics_map_20260903 m on m.v1_id=x.achievement_id
             ' into v_n;
    if v_n > 0 then
      raise exception 'STAGE 40 ABORTED: % public_course_topics rows still point at the set. Run REMOVE_V1_REMNANTS Stage 60 (DROP public_course_topics) first.', v_n;
    end if;
  end if;

  -- A late-added FK this file has not been taught about.
  if exists (
    select 1 from pg_constraint c
    where c.contype='f' and c.confrelid='public.achievements'::regclass
      and c.conrelid::regclass::text not in (
        'award_standing_requirements','badges','certificate_topics','glossary','glossary_topics',
        'program_topics','public_course_topics','quiz_attempts','quiz_questions',
        'student_achievement_progress','student_method_progress','user_topic_enrollments')) then
    raise exception 'STAGE 40 ABORTED: a foreign key into achievements exists that this file does not check. Re-run 00_PRECHECK section 6 and update the guards.';
  end if;

  delete from public.achievements a
   using public.cr_v1topics_map_20260903 m
   where m.v1_id = a.id;
  get diagnostics v_del = row_count;

  insert into public.cr_v1topics_report_20260903 (stage, k, v) values
    ('40_APPLY','achievements_hard_deleted_expect_51', v_del::text),
    ('40_APPLY','v1_rows_remaining_expect_1_gs51_out_of_scope',
       (select count(*)::text from public.achievements
        where curriculum_version_id='c689c0c4-1d93-4a92-9159-2af019745c49'));
end $$;

select stage, k, v, at from public.cr_v1topics_report_20260903 where stage='40_APPLY' order by at desc, k;
