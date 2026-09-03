-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 20_APPLY · purge disposable data
--
-- Deletes the pre-launch user rows that keep retired v1 topics alive in
-- user-facing state. Scoped by the mapping table, never by name.
--
-- WHAT GOES
--   * every quiz_attempts row on ANY of the 51 (6 rows today, all submitted,
--     one user, all on gs0). Their quiz_attempt_items go with them via the
--     existing ON DELETE CASCADE - 05_BACKUP holds both copies.
--     They are NOT repointed: an attempt is a record of sitting a v1 quiz, and
--     rewriting it onto a v3 topic would fabricate v3 exam history that feeds
--     mastery and certificate evaluation.
--   * student_achievement_progress (43 rows) and student_method_progress
--     (54 rows) on all 34 RETIRE topics.
--
-- WHAT STAYS
--   * everything on the CONVERT topics - Stage 10 already folded or merged it.
--
-- SCOPE CHANGE 2026-09-03: this stage now covers 34 RETIRE topics, not 29. The
-- five the owner ruled removed (gs 1, 9, 17, 19, 21) are RETIRE like the rest.
-- Five of the 34 are still is_active = true, which the other 29 are not.
-- NOTHING IN THIS STAGE TESTS is_active: it selects purely on the mapping
-- table's class, and DELETE on a progress row is indifferent to whether its
-- topic is active. Verified line by line - no assumption of inactivity exists
-- here, and none is added.
--
-- These progress rows are disposable: seven pre-launch accounts, all the
-- owner's own. Content - terms and questions - is a different matter, and none
-- of the 34 carries any (asserted by 05_BACKUP's fold-rule guards).
--
-- Idempotent. Backup-guarded. Reversible from the 05_BACKUP tables.

do $$
declare
  v_qa int; v_sap int; v_smp int;
begin
  if to_regclass('public.cr_v1topics_map_20260903') is null then
    raise exception 'STAGE 20 ABORTED: 05_BACKUP has not been run';
  end if;
  if (select count(*) from public.cr_v1topics_map_20260903 where class='RETIRE') <> 34 then
    raise exception 'STAGE 20 ABORTED: the map does not hold 34 RETIRE topics - re-run 05_BACKUP against the current ruling';
  end if;
  if to_regclass('public.cr_v1topics_quiz_attempts_20260903') is null
     or to_regclass('public.cr_v1topics_quiz_attempt_items_20260903') is null
     or to_regclass('public.cr_v1topics_sap_20260903') is null
     or to_regclass('public.cr_v1topics_smp_20260903') is null then
    raise exception 'STAGE 20 ABORTED: a required backup table is missing - re-run 05_BACKUP';
  end if;

  -- Stage 10 must have run: otherwise the CONVERT topics still carry progress
  -- rows and this stage would look like it had nothing to do.
  if exists (select 1 from public.student_achievement_progress s
             join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT') then
    raise exception 'STAGE 20 ABORTED: Stage 10 has not run - CONVERT topics still hold progress rows';
  end if;

  -- nothing may be deleted that is not already backed up
  if exists (select 1 from public.quiz_attempts q
             join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id
             where not exists (select 1 from public.cr_v1topics_quiz_attempts_20260903 b where b.id=q.id)) then
    raise exception 'STAGE 20 ABORTED: quiz_attempts rows exist that 05_BACKUP did not capture';
  end if;
  if exists (select 1 from public.quiz_attempt_items i
             where i.attempt_id in (select q.id from public.quiz_attempts q
                                    join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id)
               and not exists (select 1 from public.cr_v1topics_quiz_attempt_items_20260903 b where b.id=i.id)) then
    raise exception 'STAGE 20 ABORTED: quiz_attempt_items exist that 05_BACKUP did not capture';
  end if;
  if exists (select 1 from public.student_achievement_progress s
             join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='RETIRE'
             where not exists (select 1 from public.cr_v1topics_sap_20260903 b where b.id=s.id)) then
    raise exception 'STAGE 20 ABORTED: student_achievement_progress rows exist that 05_BACKUP did not capture';
  end if;
  if exists (select 1 from public.student_method_progress s
             join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='RETIRE'
             where not exists (select 1 from public.cr_v1topics_smp_20260903 b where b.id=s.id)) then
    raise exception 'STAGE 20 ABORTED: student_method_progress rows exist that 05_BACKUP did not capture';
  end if;
  if exists (select 1 from public.quiz_attempts q
             join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id
             where q.attempt_status='in_progress') then
    raise exception 'STAGE 20 ABORTED: a quiz attempt on a v1 topic is still in_progress';
  end if;

  delete from public.quiz_attempts q
   using public.cr_v1topics_map_20260903 m
   where q.achievement_id = m.v1_id;
  get diagnostics v_qa = row_count;

  delete from public.student_achievement_progress s
   using public.cr_v1topics_map_20260903 m
   where s.achievement_id = m.v1_id and m.class = 'RETIRE';
  get diagnostics v_sap = row_count;

  delete from public.student_method_progress s
   using public.cr_v1topics_map_20260903 m
   where s.achievement_id = m.v1_id and m.class = 'RETIRE';
  get diagnostics v_smp = row_count;

  insert into public.cr_v1topics_report_20260903 (stage, k, v) values
    ('20_APPLY','quiz_attempts_deleted_expect_6',       v_qa::text),
    ('20_APPLY','sap_deleted_RETIRE_34_expect_43',      v_sap::text),
    ('20_APPLY','smp_deleted_RETIRE_34_expect_54',      v_smp::text),
    ('20_APPLY','sap_remaining_on_any_of_the_51_expect_0',
       (select count(*)::text from public.student_achievement_progress s
        join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id)),
    ('20_APPLY','smp_remaining_on_any_of_the_51_expect_0',
       (select count(*)::text from public.student_method_progress s
        join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id));
end $$;

select stage, k, v, at from public.cr_v1topics_report_20260903 where stage='20_APPLY' order by at desc, k;
