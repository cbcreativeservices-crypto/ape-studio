-- Audio Connectors & Cable Selection lab — backend seed.
-- ⏳ AWAITING OWNER RUN (drafted 2026-09-11 with the lab build). Idempotent.
-- Same ruling as Patchbay (2026-09-10): "anything in the Audio Fundamentals
-- container menu is part of the audio fundamentals requisite."
--
-- Adds the 15th audio_fundamentals lab row so mark_lab_complete accepts
-- 'af_connector_select'. Sort 108: the 105/106/107 slots are taken
-- contiguously (af_cables / af_cable_install / af_patchbay), and the ORDER
-- USERS SEE comes from the client catalog (labCatalog.ts, where this lab
-- sits right after Cable & Connector Fundamentals) — the server sort_order
-- only orders admin listings, so appending at 108 is correct and avoids
-- renumbering live rows.
--
-- Safe ordering: the client ships with the key already — the RPC's
-- lab_not_found guard keeps any completion unsent + retried until this row
-- exists, so run it whenever convenient. NOTE: because the server requires
-- EVERY active audio_fundamentals lab for the gs3081 topic credit, running
-- this makes the lab REQUIRED for that credit from that moment on (that is
-- the point of the ruling). (Schema note: the flag column is is_active — the
-- labs table has no `required` column.)

insert into labs (key, name, area, sort_order, is_active)
values ('af_connector_select', 'Audio Connectors & Cable Selection', 'audio_fundamentals', 108, true)
on conflict (key) do update
  set name = excluded.name,
      area = excluded.area,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active;

-- Verify:
-- select key, name, sort_order, is_active from labs
--   where area = 'audio_fundamentals' order by sort_order;
-- Expect 15 rows with af_connector_select at 108.
