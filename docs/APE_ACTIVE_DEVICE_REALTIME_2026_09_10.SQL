-- ===========================================================================
-- APE — SINGLE-DEVICE TRUE REALTIME (DRAFT FOR REVIEW): push an instant sign-out
-- to a displaced device, instead of the ~8s foreground poll.
-- Companion to the client change in SingleDeviceGuard (see the snippet I sent in
-- chat). Owner 2026-09-10. The 8s poll stays as a fallback either way.
--
-- WHAT THIS ENABLES: the client subscribes (Supabase Realtime) to its OWN
-- active_device row. When another device claims the account (claim_device updates
-- that row's device_id), this device receives the UPDATE within ~1s and signs
-- out immediately.
--
-- TWO THINGS REALTIME NEEDS, both absent today:
--   1. active_device currently has RLS enabled with ZERO policies (deny-all), so
--      the client cannot receive row events. Add an OWN-ROW SELECT policy so a
--      user can subscribe to (only) their own row. This does NOT open write access
--      — claim_device stays the only writer (SECURITY DEFINER).
--   2. The table must be in the `supabase_realtime` publication.
--
-- Idempotent. No row data touched. After running, apply the client subscription.
-- ===========================================================================

-- (1) Own-row SELECT so the user can subscribe to their active_device row.
drop policy if exists active_device_own_select on public.active_device;
create policy active_device_own_select on public.active_device
  for select
  to authenticated
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- (2) Deliver full row images on UPDATE so the payload always carries device_id
-- (default replica identity = PK would still include changed columns, but FULL is
-- robust and this table is tiny — one row per user).
alter table public.active_device replica identity full;

-- (3) Add the table to the realtime publication. If it's already a member this
-- raises "relation is already member of publication" — safe to ignore, or run
-- the guarded block below instead of the bare ALTER.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'active_device'
  ) then
    execute 'alter publication supabase_realtime add table public.active_device';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- VERIFY after running:
--   -- policy present (expect one row, cmd = SELECT):
--   select policyname, cmd from pg_policies
--     where schemaname='public' and tablename='active_device';
--   -- table in the realtime publication (expect one row):
--   select schemaname, tablename from pg_publication_tables
--     where pubname='supabase_realtime' and tablename='active_device';
-- Dashboard equivalent for (3): Database -> Publications -> supabase_realtime ->
-- enable `active_device` (if you prefer the UI over the ALTER above).
-- ---------------------------------------------------------------------------
