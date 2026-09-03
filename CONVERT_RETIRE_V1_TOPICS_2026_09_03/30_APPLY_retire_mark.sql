-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 30_APPLY · retire (soft)
--
-- Retires the 46 topics the owner ruled on: the 17 CONVERT rows (now emptied by
-- Stage 10) and the 29 RETIRE rows. The 5 BLOCKED rows are NOT touched.
--
-- "Retire" here means: cannot be activated, cannot be free, cannot be a
-- prerequisite, and is recorded in a dated ledger that says why. It does NOT
-- mean DELETE. Reasons, in order of weight:
--
--  1. glossary_topics.achievement_id is ON DELETE CASCADE. A hard delete would
--     silently destroy every remaining curated term->topic link with no error.
--  2. 3 badges and 50 approved quiz_questions still point at rows in this set
--     with NO ACTION foreign keys. A hard delete cannot even run until the
--     owner rules on that content, and forcing it would mean deleting it.
--  3. Nothing in the app can reach an inactive topic in an archived curriculum:
--     start_quiz_attempt raises archived_quiz_retired for the v1 curriculum by
--     hard-coded id, the glossary topic filter selects v3 + is_active only, and
--     public_course_topics is no longer read. Deactivation is sufficient to
--     satisfy the ruling; deletion adds risk without adding an outcome.
--
-- If the owner does want the rows gone, 40_APPLY_OPTIONAL_hard_delete.sql is
-- there, fully guarded, and will refuse until (2) is resolved.
--
-- Idempotent: re-running updates nothing and writes no new ledger rows.

create table if not exists public.cr_v1topics_ledger_20260903 (
  v1_id       uuid primary key,
  v1_gs       integer not null,
  v1_name     text    not null,
  class       text    not null,
  v3_id       uuid,
  v3_gs       integer,
  was_active  boolean not null,
  was_always_free boolean not null,
  was_prereq  boolean not null,
  retired_at  timestamptz not null default now(),
  reason      text not null
);

do $$
declare
  v_upd int; v_led int;
begin
  if to_regclass('public.cr_v1topics_map_20260903') is null then
    raise exception 'STAGE 30 ABORTED: 05_BACKUP has not been run';
  end if;
  if to_regclass('public.cr_v1topics_achievements_20260903') is null
     or (select count(*) from public.cr_v1topics_achievements_20260903) <> 51 then
    raise exception 'STAGE 30 ABORTED: the achievements backup is missing or incomplete - re-run 05_BACKUP';
  end if;

  -- Stage 10 must have emptied the CONVERT topics first, or this stage would
  -- deactivate a topic that still owns live glossary/progress rows.
  if exists (select 1 from public.glossary_topics g
             join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id and m.class='CONVERT') then
    raise exception 'STAGE 30 ABORTED: Stage 10 has not run - CONVERT topics still own glossary links';
  end if;

  -- BEFORE UPDATE trig_validate_applicable_methods rejects a non-canonical
  -- method key on ANY update, including this one.
  if exists (select 1 from public.achievements a
             join public.cr_v1topics_map_20260903 m on m.v1_id=a.id
             where a.applicable_methods is not null
               and exists (select 1 from unnest(a.applicable_methods) mm
                           where not exists (select 1 from public.study_methods s where s.key=mm))) then
    raise exception 'STAGE 30 ABORTED: one of the 51 carries a non-canonical applicable_methods key; the achievements trigger would reject the update';
  end if;

  insert into public.cr_v1topics_ledger_20260903
    (v1_id, v1_gs, v1_name, class, v3_id, v3_gs, was_active, was_always_free, was_prereq, reason)
  select m.v1_id, m.v1_gs, m.v1_name, m.class, m.v3_id, m.v3_gs,
         a.is_active, a.always_free, a.is_prerequisite,
         case when m.class='CONVERT'
              then 'Converted 2026-09-03: all surviving references repointed to the v3 twin, then retired.'
              else 'Retired 2026-09-03: legacy v1 topic, inactive, no v3 name twin, superseded by the v3 taxonomy.' end
  from public.cr_v1topics_map_20260903 m
  join public.achievements a on a.id = m.v1_id
  where m.class in ('CONVERT','RETIRE')
    and not exists (select 1 from public.cr_v1topics_ledger_20260903 l where l.v1_id = m.v1_id);
  get diagnostics v_led = row_count;

  update public.achievements a
     set is_active       = false,
         always_free     = false,
         is_prerequisite = false
    from public.cr_v1topics_map_20260903 m
   where m.v1_id = a.id
     and m.class in ('CONVERT','RETIRE')
     and (a.is_active or a.always_free or a.is_prerequisite);
  get diagnostics v_upd = row_count;

  -- The 5 BLOCKED rows must be exactly as they were.
  if exists (select 1 from public.achievements a
             join public.cr_v1topics_map_20260903 m on m.v1_id=a.id and m.class='BLOCKED'
             where a.is_active is distinct from true) then
    raise exception 'STAGE 30 ABORTED: a BLOCKED topic was deactivated - this stage must never touch them';
  end if;

  insert into public.cr_v1topics_report_20260903 (stage, k, v) values
    ('30_APPLY','achievements_rows_flags_cleared', v_upd::text),
    ('30_APPLY','ledger_rows_written',             v_led::text),
    ('30_APPLY','still_active_among_the_46',
       (select count(*)::text from public.achievements a
        join public.cr_v1topics_map_20260903 m on m.v1_id=a.id
        where m.class in ('CONVERT','RETIRE') and a.is_active)),
    ('30_APPLY','blocked_left_active_expect_5',
       (select count(*)::text from public.achievements a
        join public.cr_v1topics_map_20260903 m on m.v1_id=a.id
        where m.class='BLOCKED' and a.is_active));
end $$;

select stage, k, v, at from public.cr_v1topics_report_20260903 where stage='30_APPLY' order by at desc, k;
select class, v1_gs, v1_name, v3_gs, was_active, was_always_free, retired_at
from public.cr_v1topics_ledger_20260903 order by class, v1_gs;
