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
--   * student_achievement_progress and student_method_progress rows on the 29
--     RETIRE topics.
--
-- WHAT STAYS
--   * progress rows on the 5 BLOCKED topics. They are the evidence of what
--     still uses those topics, and the owner has not ruled on them yet.
--   * everything on the CONVERT topics - Stage 10 already moved or merged it.
--
-- Idempotent. Backup-guarded. Reversible from the 05_BACKUP tables.

do $$
declare
  v_qa int; v_sap int; v_smp int;
begin
  if to_regclass('public.cr_v1topics_map_20260903') is null then
    raise exception 'STAGE 20 ABORTED: 05_BACKUP has not been run';
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
    ('20_APPLY','quiz_attempts_deleted_all_classes', v_qa::text),
    ('20_APPLY','sap_deleted_RETIRE_only',           v_sap::text),
    ('20_APPLY','smp_deleted_RETIRE_only',           v_smp::text),
    ('20_APPLY','sap_kept_on_BLOCKED',
       (select count(*)::text from public.student_achievement_progress s
        join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='BLOCKED')),
    ('20_APPLY','smp_kept_on_BLOCKED',
       (select count(*)::text from public.student_method_progress s
        join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='BLOCKED'));
end $$;

select stage, k, v, at from public.cr_v1topics_report_20260903 where stage='20_APPLY' order by at desc, k;
