-- ============================================================================
-- APE STUDIO · 2026-09-18 · APPLIED TO PRODUCTION
--   migrations: enable_pg_net_for_weekly_concept_cron
--               weekly_concept_dispatcher
--               schedule_weekly_concept_cron
--
-- The weekly concept shipped with a Settings toggle, a screen, a deployed Edge
-- Function and a correct RPC — and never sent a single notification, because
-- nothing ever called it. This is the missing half.
--
-- ⚠️ IT STILL SENDS NOTHING. See "THE GATE" below. That is deliberate.
-- ============================================================================

-- ── 1 · pg_net was not installed ────────────────────────────────────────────
--
-- net.http_post is how pg_cron reaches an Edge Function, and the
-- on-weekly-concept header has always said the cron would call it that way.
-- The extension was simply never enabled — part of why nothing sent.
create extension if not exists pg_net with schema extensions;


-- ── 2 · the dispatcher ──────────────────────────────────────────────────────
--
-- on-weekly-concept authenticates with `Authorization: Bearer <service role
-- key>` and 401s on anything else. ccode must never handle that key, so this
-- reads it from Vault at call time and NO-OPS when it is absent.
--
-- ── THE GATE ───────────────────────────────────────────────────────────────
--
-- That no-op is the whole design. The cron is scheduled and running, and it
-- sends nothing until somebody puts the key in Vault themselves:
--
--   select vault.create_secret('<service role key>', 'service_role_key',
--                              'Used by dispatch_weekly_concept');
--
-- It keeps a promise written into the Edge Function itself:
--
--   "Cron (when Booth activates it) POSTs with Authorization: Bearer <service
--    role>. Do not run the cron until concept sequence is reviewed."
--
-- Surfaced rather than quietly stepped over. The Vault secret is now where
-- "reviewed" gets decided, by a person.
--
-- BLAST RADIUS when it is switched on: 7 subscriptions, 1 active, 1 user with
-- notify_weekly_concept on. The first real send reaches one account.
create or replace function public.dispatch_weekly_concept()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $fn$
DECLARE
  v_key text;
  v_req bigint;
BEGIN
  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
   WHERE name = 'service_role_key'
   LIMIT 1;

  -- Returns rather than raising: a cron job that errors every ten minutes is
  -- noise that trains people to ignore it.
  IF v_key IS NULL OR length(v_key) = 0 THEN
    RETURN 'skipped: no service_role_key in vault';
  END IF;

  -- Fire-and-forget. pg_net queues the request and returns an id; the Edge
  -- Function does its own work and writes its own delivery rows. Nothing here
  -- waits, so a slow or failed call cannot hold a cron worker open.
  SELECT net.http_post(
           url     := 'https://yjgolswjggmlpeowvtxr.supabase.co/functions/v1/on-weekly-concept',
           headers := jsonb_build_object(
                        'Content-Type',  'application/json',
                        'Authorization', 'Bearer ' || v_key),
           body    := '{}'::jsonb,
           timeout_milliseconds := 30000
         ) INTO v_req;

  RETURN 'posted: request ' || v_req;
END;
$fn$;

-- Owner-only. Nothing client-side may trigger a notification run, and the
-- function reads a service-role key — this is the grant that matters here.
revoke all on function public.dispatch_weekly_concept() from public;

comment on function public.dispatch_weekly_concept() is
  'Cron entry point for the weekly concept. Reads service_role_key from Vault and POSTs to the on-weekly-concept Edge Function. No-ops when the secret is absent, which is how the send stays switched off until someone deliberately switches it on.';


-- ── 3 · the schedule ────────────────────────────────────────────────────────
--
-- ── WHY */10 AND NOT SOMETHING TIDIER ──────────────────────────────────────
--
-- get_due_concept_subscriptions matches when the current time is within 420
-- SECONDS either side of send_time — a 14-minute window, in the USER'S
-- timezone. So the cron interval must be <= 840s or a slice of users is
-- skipped PERMANENTLY, not occasionally:
--
--   */15  = 900s  ✗  60s of every window unreachable — those users NEVER send
--   */14  = 840s  ✗  exactly the window; no margin for a late worker
--   */10  = 600s  ✓  240s of slack
--
-- ⚠️ The old header comment in the Edge Function says "every 15 minutes",
--    which would have been WRONG. Anyone whose send_time landed in the dead
--    60 seconds would silently never have received one, and it would have
--    looked like a delivery bug forever.
--
-- Double-firing inside one window is handled twice over: the function's own
-- same-day `not exists` dedupe, and the partial unique index added earlier the
-- same day (2026091805, notification_concept_deliveries_daily).
select cron.schedule(
  'on-weekly-concept',
  '*/10 * * * *',
  $job$ select public.dispatch_weekly_concept(); $job$
);

-- ── VERIFIED AFTER ──────────────────────────────────────────────────────────
--   select public.dispatch_weekly_concept();
--     -> "skipped: no service_role_key in vault"
--   cron.job now has jobid 5 'on-weekly-concept', */10, postgres, active.
--
-- TO TURN IT OFF AGAIN:  select cron.unschedule('on-weekly-concept');
-- TO PAUSE WITHOUT UNSCHEDULING: delete the vault secret.
