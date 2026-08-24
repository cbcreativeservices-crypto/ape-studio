-- Cable Dressing & Installation lab — backend seed (owner runs in Supabase SQL editor).
-- Adds the 13th audio_fundamentals lab row so mark_lab_complete accepts
-- 'af_cable_install'. Until this runs, the app queues completion safely and
-- retries (fireComplete fail-open path) — local ✓ works regardless.
-- Idempotent upsert, same shape as APE_CABLE_LAB_SEED_2026_08_15.sql.

insert into labs (key, name, area, sort_order, required)
values ('af_cable_install', 'Cable Dressing & Installation', 'audio_fundamentals', 106, true)
on conflict (key) do update
  set name = excluded.name,
      area = excluded.area,
      sort_order = excluded.sort_order,
      required = excluded.required;
