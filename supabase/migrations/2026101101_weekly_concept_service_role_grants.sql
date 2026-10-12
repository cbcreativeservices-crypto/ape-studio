-- APPLIED to production 2026-10-11 (via MCP, migration weekly_concept_service_role_grants).
--
-- on-weekly-concept runs as service_role. service_role does not inherit table
-- grants, and had none on these two tables, so from the day the Vault key went
-- in (2026-10-04) every due user was skipped as "No prefs found" and no
-- delivery row could be written. Cron green, HTTP 200, {"sent":0} — silent.
--
-- users (id, auth_id) already had column SELECT; subscriptions and concepts are
-- read through SECURITY DEFINER RPCs, so they need nothing.
grant select on public.notification_preferences to service_role;
grant select, insert, update on public.notification_concept_deliveries to service_role;
