-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 10_APPLY · CONVERT (repoint)
--
-- Repoints every SURVIVING reference from the 17 v1 topics that have an exact
-- v3 name twin onto that twin. Runs as one atomic DO block.
--
-- COLLISION RULE, applied identically in all three tables:
--   the v3 row WINS. Where the twin already holds a row for the same
--   (user, topic) / (user, topic, method) / (term, topic), the v1 duplicate is
--   DELETED and the v3 row is left byte-for-byte untouched. No field merging.
--   Justification: every colliding row is pre-launch test data written by the
--   owner's 7 accounts, and the v3 row is the one the live app already reads.
--   00_PRECHECK proves the delete loses nothing (no v1 glossary link carries a
--   difficulty its v3 twin lacks, and none of them is a primary home).
--
-- WHAT THIS STAGE DOES NOT MOVE — deliberate, see README:
--   quiz_questions  (50 rows, all on v1 gs0)  - moving them injects unratified
--                                               content into the live 3060 pool
--   quiz_attempts   (6 rows)                  - history; purged in Stage 20
--   badges          (0 CONVERT rows)          - none point at a CONVERT topic
--   public_course_topics                      - a v1 catalog, dropped elsewhere
--
-- Idempotent: after a successful run there is nothing left to move, so a second
-- run reports zeros and changes nothing.

do $$
declare
  v_gt_del int; v_gt_upd int;
  v_sap_del int; v_sap_upd int;
  v_smp_del int; v_smp_upd int;
  v_user uuid;
  v_users uuid[];
begin
  -- ------------------------------------------------------------------ guards
  if to_regclass('public.cr_v1topics_map_20260903') is null then
    raise exception 'STAGE 10 ABORTED: 05_BACKUP has not been run (mapping table missing)';
  end if;
  if (select count(*) from public.cr_v1topics_map_20260903 where class='CONVERT') <> 17 then
    raise exception 'STAGE 10 ABORTED: mapping table does not hold exactly 17 CONVERT rows';
  end if;
  if exists (select 1 from public.cr_v1topics_map_20260903 where class='CONVERT'
             and (v3_id is null or lower(btrim(v1_name)) <> lower(btrim(v3_name)))) then
    raise exception 'STAGE 10 ABORTED: a CONVERT pair lost its twin or its name match';
  end if;
  if to_regclass('public.cr_v1topics_glossary_topics_20260903') is null
     or to_regclass('public.cr_v1topics_sap_20260903') is null
     or to_regclass('public.cr_v1topics_smp_20260903') is null then
    raise exception 'STAGE 10 ABORTED: a required backup table is missing - re-run 05_BACKUP';
  end if;
  -- every row we are about to touch must already be in the backup
  if exists (select 1 from public.glossary_topics g
             join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id and m.class='CONVERT'
             where not exists (select 1 from public.cr_v1topics_glossary_topics_20260903 b where b.id=g.id)) then
    raise exception 'STAGE 10 ABORTED: glossary_topics rows exist that 05_BACKUP did not capture - re-run 05_BACKUP';
  end if;
  if exists (select 1 from public.student_achievement_progress s
             join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT'
             where not exists (select 1 from public.cr_v1topics_sap_20260903 b where b.id=s.id)) then
    raise exception 'STAGE 10 ABORTED: student_achievement_progress rows exist that 05_BACKUP did not capture';
  end if;
  if exists (select 1 from public.student_method_progress s
             join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT'
             where not exists (select 1 from public.cr_v1topics_smp_20260903 b where b.id=s.id)) then
    raise exception 'STAGE 10 ABORTED: student_method_progress rows exist that 05_BACKUP did not capture';
  end if;
  -- an in-progress attempt on a topic we are retiring would be orphaned mid-quiz
  if exists (select 1 from public.quiz_attempts q
             join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id
             where q.attempt_status='in_progress') then
    raise exception 'STAGE 10 ABORTED: a quiz attempt on a v1 topic is still in_progress';
  end if;

  -- remember who is affected, so credentials can be re-evaluated afterwards
  select coalesce(array_agg(distinct u), '{}') into v_users from (
    select s.user_id u from public.student_achievement_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT'
    union
    select s.user_id from public.student_method_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT'
  ) x;

  -- ------------------------------------------------------- glossary_topics
  -- unique key: (glossary_id, achievement_id); also a partial unique on
  -- (glossary_id) where is_primary, which cannot be hit here because no v1 link
  -- is a primary home (asserted below).
  if exists (select 1 from public.glossary_topics g
             join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id and m.class='CONVERT'
             where g.is_primary) then
    raise exception 'STAGE 10 ABORTED: a v1 glossary link is a PRIMARY home - moving it is a curation decision, not a repoint';
  end if;

  with m as (select v1_id, v3_id from public.cr_v1topics_map_20260903 where class='CONVERT')
  delete from public.glossary_topics g
  using m
  where g.achievement_id = m.v1_id
    and exists (select 1 from public.glossary_topics t
                where t.glossary_id = g.glossary_id and t.achievement_id = m.v3_id);
  get diagnostics v_gt_del = row_count;

  update public.glossary_topics g
     set achievement_id = m.v3_id
    from public.cr_v1topics_map_20260903 m
   where m.class='CONVERT' and g.achievement_id = m.v1_id;
  get diagnostics v_gt_upd = row_count;

  -- ------------------------------------------- student_achievement_progress
  -- unique key: (user_id, achievement_id)
  with m as (select v1_id, v3_id from public.cr_v1topics_map_20260903 where class='CONVERT')
  delete from public.student_achievement_progress s
  using m
  where s.achievement_id = m.v1_id
    and exists (select 1 from public.student_achievement_progress t
                where t.user_id = s.user_id and t.achievement_id = m.v3_id);
  get diagnostics v_sap_del = row_count;

  update public.student_achievement_progress s
     set achievement_id = m.v3_id
    from public.cr_v1topics_map_20260903 m
   where m.class='CONVERT' and s.achievement_id = m.v1_id;
  get diagnostics v_sap_upd = row_count;

  -- ------------------------------------------------ student_method_progress
  -- unique key: (user_id, achievement_id, method_key)
  with m as (select v1_id, v3_id from public.cr_v1topics_map_20260903 where class='CONVERT')
  delete from public.student_method_progress s
  using m
  where s.achievement_id = m.v1_id
    and exists (select 1 from public.student_method_progress t
                where t.user_id = s.user_id and t.achievement_id = m.v3_id
                  and t.method_key = s.method_key);
  get diagnostics v_smp_del = row_count;

  update public.student_method_progress s
     set achievement_id = m.v3_id
    from public.cr_v1topics_map_20260903 m
   where m.class='CONVERT' and s.achievement_id = m.v1_id;
  get diagnostics v_smp_upd = row_count;

  -- --------------------------------------------------- credential recompute
  -- student_progress_award fires on INSERT or UPDATE OF status only, so the
  -- repoints above did NOT fire it. A repointed 'complete' row now credits a v3
  -- topic that certificate/program membership actually reads, so evaluate once
  -- per affected user. evaluate_user_credentials is a pure recompute.
  foreach v_user in array v_users loop
    perform public.evaluate_user_credentials(v_user);
  end loop;

  insert into public.cr_v1topics_report_20260903 (stage, k, v) values
    ('10_APPLY','glossary_topics_deleted_as_duplicate', v_gt_del::text),
    ('10_APPLY','glossary_topics_repointed',            v_gt_upd::text),
    ('10_APPLY','sap_deleted_as_duplicate',             v_sap_del::text),
    ('10_APPLY','sap_repointed',                        v_sap_upd::text),
    ('10_APPLY','smp_deleted_as_duplicate',             v_smp_del::text),
    ('10_APPLY','smp_repointed',                        v_smp_upd::text),
    ('10_APPLY','users_recredentialled',                coalesce(array_length(v_users,1),0)::text);
end $$;

select stage, k, v, at from public.cr_v1topics_report_20260903 where stage='10_APPLY' order by at desc, k;

-- Post-state: every one of these must be 0.
select 'post' as section, k, v from (values
  ('glossary_topics still on a CONVERT topic',
     (select count(*)::text from public.glossary_topics g
      join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id and m.class='CONVERT')),
  ('student_achievement_progress still on a CONVERT topic',
     (select count(*)::text from public.student_achievement_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT')),
  ('student_method_progress still on a CONVERT topic',
     (select count(*)::text from public.student_method_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT'))
) t(k,v);
