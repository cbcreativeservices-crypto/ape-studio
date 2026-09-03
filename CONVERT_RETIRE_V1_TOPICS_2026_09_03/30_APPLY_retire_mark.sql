-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 30_APPLY · retire
--
-- Retires ALL 51: the 17 CONVERT rows (emptied and folded by Stage 10) and the
-- 34 RETIRE rows. There is no held-back set any more.
--
-- **THIS IS THE STAGE THAT ACTUALLY REMOVES THE FIVE.** gs 1, 9, 17, 19, 21 —
-- Sound & Acoustics, Dynamics Processing, Assisted Listening Systems,
-- Corporate AV, Distributed Audio Systems — are the only rows in the whole
-- package that are is_active = true with no v3 successor. For the other 46,
-- this stage is bookkeeping: 37 were already inactive, and the 9 active CONVERT
-- topics live on at their v3 twin. For these five, deactivation IS the removal.
-- Nothing survives them, and nothing needs to: they carry zero glossary links
-- and zero quiz questions (05_BACKUP asserts both before this stage can run).
--
-- "Retire" means: cannot be activated, cannot be free, cannot be a
-- prerequisite, and is recorded in a dated ledger that says why. It does NOT
-- mean DELETE. Reasons, in order of weight:
--
--  1. glossary_topics.achievement_id is ON DELETE CASCADE. A hard delete would
--     silently destroy curated term links with no error. Stage 10 empties that
--     table for the CONVERT set first, but "the destructive path is one
--     forgotten stage away from losing curated content" is exactly the shape of
--     thing to design out.
--  2. 3 badges and 50 approved quiz_questions still point into the set with
--     NO ACTION foreign keys. A hard delete cannot execute until the owner
--     rules on that content, and forcing it would mean deleting content.
--  3. Nothing in the app can reach an inactive topic in an archived curriculum:
--     start_quiz_attempt raises archived_quiz_retired for the v1 curriculum by
--     hard-coded id, the glossary topic filter selects v3 + is_active only, and
--     public_course_topics is no longer read. Deactivation is sufficient to
--     remove the five from the app; deletion adds risk without adding an
--     outcome.
--
-- 40_APPLY_OPTIONAL_hard_delete.sql is there if the owner wants the rows gone.
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
  if (select count(*) from public.cr_v1topics_map_20260903) <> 51
     or (select count(*) from public.cr_v1topics_map_20260903 where class='RETIRE') <> 34 then
    raise exception 'STAGE 30 ABORTED: the map is not 17 CONVERT + 34 RETIRE - re-run 05_BACKUP against the current ruling';
  end if;
  if to_regclass('public.cr_v1topics_achievements_20260903') is null
     or (select count(*) from public.cr_v1topics_achievements_20260903) <> 51 then
    raise exception 'STAGE 30 ABORTED: the achievements backup is missing or incomplete - re-run 05_BACKUP';
  end if;

  -- Stage 10 must have folded the CONVERT topics first, or this stage would
  -- deactivate a topic that still owns live glossary links.
  if exists (select 1 from public.glossary_topics g
             join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id and m.class='CONVERT') then
    raise exception 'STAGE 30 ABORTED: Stage 10 has not run - CONVERT topics still own glossary links';
  end if;

  -- The fold rule, re-checked at apply time: nothing about to be deactivated
  -- may still be the only home of a term.
  if exists (select 1 from public.glossary_topics g
             join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id) then
    raise exception 'STAGE 30 ABORTED: a topic being retired still carries glossary_topics links';
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
  -- trig_validate_quiz_question_count only fires when a row is ACTIVATED. This
  -- stage only ever sets is_active=false, including on the five live rows, so
  -- it cannot fire. No trigger has to be disabled.

  insert into public.cr_v1topics_ledger_20260903
    (v1_id, v1_gs, v1_name, class, v3_id, v3_gs, was_active, was_always_free, was_prereq, reason)
  select m.v1_id, m.v1_gs, m.v1_name, m.class, m.v3_id, m.v3_gs,
         a.is_active, a.always_free, a.is_prerequisite,
         case
           when m.class='CONVERT'
             then 'Converted 2026-09-03: every surviving reference folded onto v3 gs '
                  || m.v3_gs || ' (' || m.v3_name || '), then retired.'
           when m.v1_gs in (1,9,17,19,21)
             then 'Removed 2026-09-03 by owner ruling: active v1 topic with no v3 successor. '
                  || 'Carried no glossary terms and no quiz questions, so nothing required folding.'
           else 'Retired 2026-09-03: legacy v1 topic, already inactive, no v3 name twin, superseded by the v3 taxonomy.'
         end
  from public.cr_v1topics_map_20260903 m
  join public.achievements a on a.id = m.v1_id
  where not exists (select 1 from public.cr_v1topics_ledger_20260903 l where l.v1_id = m.v1_id);
  get diagnostics v_led = row_count;

  update public.achievements a
     set is_active       = false,
         always_free     = false,
         is_prerequisite = false
    from public.cr_v1topics_map_20260903 m
   where m.v1_id = a.id
     and (a.is_active or a.always_free or a.is_prerequisite);
  get diagnostics v_upd = row_count;

  -- Post-assertion: not one of the 51 may still be live.
  if exists (select 1 from public.achievements a
             join public.cr_v1topics_map_20260903 m on m.v1_id=a.id
             where a.is_active or a.always_free or a.is_prerequisite) then
    raise exception 'STAGE 30 ABORTED: a v1 topic survived the update still active/free/prerequisite';
  end if;

  -- And the v3 side must be untouched.
  if (select count(*) from public.achievements
      where curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and is_active) <> 166 then
    raise exception 'STAGE 30 ABORTED: the v3 active topic count is no longer 166 - this stage must never touch v3';
  end if;

  insert into public.cr_v1topics_report_20260903 (stage, k, v) values
    -- 16 = 14 currently-active rows (9 CONVERT + the owner-ruled 5) plus two
    -- inactive rows that still carry a flag: gs36 DAW Skills (always_free) and
    -- one inactive is_prerequisite row.
    ('30_APPLY','achievements_rows_flags_cleared_expect_16', v_upd::text),
    ('30_APPLY','  active rows deactivated (expect 14 = 9 CONVERT + the ruled 5)',
       (select count(*)::text from public.cr_v1topics_ledger_20260903 where was_active)),
    ('30_APPLY','  of those, the owner-ruled five (gs 1,9,17,19,21)',
       (select count(*)::text from public.cr_v1topics_ledger_20260903 where was_active and v1_gs in (1,9,17,19,21))),
    ('30_APPLY','ledger_rows_written_expect_51',             v_led::text),
    ('30_APPLY','v1_topics_still_active_expect_0',
       (select count(*)::text from public.achievements a
        join public.cr_v1topics_map_20260903 m on m.v1_id=a.id where a.is_active)),
    ('30_APPLY','v3_active_topics_expect_166_unchanged',
       (select count(*)::text from public.achievements
        where curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and is_active));
end $$;

select stage, k, v, at from public.cr_v1topics_report_20260903 where stage='30_APPLY' order by at desc, k;

-- The five, specifically. This is the removal, on the record.
select 'ruled_removed' as section, l.v1_gs, l.v1_name, l.was_active, l.retired_at, l.reason
from public.cr_v1topics_ledger_20260903 l where l.v1_gs in (1,9,17,19,21) order by l.v1_gs;

select class, v1_gs, v1_name, v3_gs, was_active, was_always_free, retired_at
from public.cr_v1topics_ledger_20260903 order by class, v1_gs;
