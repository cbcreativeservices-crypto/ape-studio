-- Patchbay Signal Flow & Normalling lab — backend seed (OWNER RUNS THIS).
-- ⏳ NOT YET EXECUTED. Drafted 2026-09-10 on the owner's ruling: "anything in
-- the Audio Fundamentals container menu is part of the audio fundamentals
-- requisite."
--
-- Adds the 14th audio_fundamentals lab row so mark_lab_complete accepts
-- 'af_patchbay'. Sort 107: after af_cable_install (106), before
-- af_gain_staging (110) — matching the catalog order (Patchbay sits between
-- Cable Dressing and Gain Staging in the Signal category).
--
-- Safe ordering: the client already ships with the key (commit pending) — the
-- RPC's lab_not_found guard keeps any completion unsent + retried until this
-- row exists, so run it whenever convenient. NOTE: because the server requires
-- EVERY active audio_fundamentals lab for the gs3081 topic credit, running
-- this makes Patchbay REQUIRED for that credit from that moment on (that is
-- the point of the ruling). Idempotent if re-run.
-- (Schema note: the flag column is is_active — the labs table has no
-- `required` column.)

insert into labs (key, name, area, sort_order, is_active)
values ('af_patchbay', 'Patchbay Signal Flow & Normalling', 'audio_fundamentals', 107, true)
on conflict (key) do update
  set name = excluded.name,
      area = excluded.area,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active;

-- Verify:
-- select key, name, sort_order, is_active from labs
--   where area = 'audio_fundamentals' order by sort_order;
-- Expect 14 rows with af_patchbay at 107.
