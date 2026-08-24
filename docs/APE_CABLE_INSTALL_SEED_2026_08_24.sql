-- Cable Dressing & Installation lab — backend seed.
-- ✅ EXECUTED 2026-08-24 against the production project (verified: row present,
-- sort 106 between af_cables 105 and af_gain_staging 110). Kept for the record;
-- idempotent if re-run.
--
-- Adds the 13th audio_fundamentals lab row so mark_lab_complete accepts
-- 'af_cable_install'. (Schema note: the flag column is is_active — the labs
-- table has no `required` column.)

insert into labs (key, name, area, sort_order, is_active)
values ('af_cable_install', 'Cable Dressing & Installation', 'audio_fundamentals', 106, true)
on conflict (key) do update
  set name = excluded.name,
      area = excluded.area,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active;
