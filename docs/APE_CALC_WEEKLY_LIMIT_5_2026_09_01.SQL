-- ===========================================================================
-- APE — CALCULATOR WEEKLY LIMIT: 10 → 5  (owner ruling 2026-09-01)
--
-- RUN THIS to change the free/lapsed allowance from 10 to 5 calculations per
-- rolling 7-day window. It is the SAME script as
-- docs/APE_CALC_WEEKLY_LIMIT_2026_08_13.SQL with v_limit := 5 in BOTH
-- functions — `create or replace` makes it safe to re-run, and it touches no
-- table data, so nobody's current usage row is disturbed.
--
-- The limit is SERVER-AUTHORITATIVE: the client only mirrors whatever the RPC
-- reports (src/features/lab/calcUsage.ts CALC_WEEKLY_LIMIT is a display
-- fallback for the offline/fail-open path and is already set to 5). Until this
-- runs, the server keeps enforcing 10 while the UI's fallback copy says 5.
--
-- Also note (owner 2026-09-01): the Calculator Laboratory itself is now always
-- accessible to every tier — this weekly cap is the only free-tier limit.
-- ===========================================================================

-- ===========================================================================
-- Calculator weekly-usage cap for free / lapsed accounts (owner 2026-08-13)
-- ---------------------------------------------------------------------------
-- 5 calculation OUTPUTS per rolling 7-day window, the window ANCHORED at the
-- account's first counted calculation (not a fixed calendar day). Academy is
-- unlimited (the client never calls these RPCs for academy). Anonymous guests
-- must sign in, so there is no account to count — these run per auth.uid().
--
-- The limit (5) and window (7 days) are SERVER-AUTHORITATIVE: they live inside
-- the functions so the client cannot raise them. Run this whole file once in the
-- Supabase SQL editor (or via CLI). Safe to re-run (idempotent).
-- ===========================================================================

create table if not exists public.calc_usage (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  used         integer     not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.calc_usage enable row level security;

-- Users may read their own row (the RPCs below do the writing as definer).
drop policy if exists calc_usage_own_select on public.calc_usage;
create policy calc_usage_own_select on public.calc_usage
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- calc_consume(): spend one credit. Call this the moment a capped user reveals
-- a NEW calculation result (the CALCULATE button). Returns the post-state.
--   allowed = true  -> this calculation is permitted (result may be shown)
--   allowed = false -> already at the limit; nothing incremented (block it)
-- Resets (window_start = now, used = 1) when 7 days have elapsed since the
-- window began — so the count restarts on the NEXT use after a week, not on a
-- fixed weekday.
-- ---------------------------------------------------------------------------
create or replace function public.calc_consume()
returns table (used integer, lim integer, window_start timestamptz, allowed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_limit  integer := 5;
  v_window interval := interval '7 days';
  v_row    public.calc_usage%rowtype;
begin
  if v_uid is null then
    return query select 0, v_limit, now(), false;
    return;
  end if;

  select * into v_row from public.calc_usage where user_id = v_uid for update;

  if not found then
    insert into public.calc_usage (user_id, window_start, used, updated_at)
      values (v_uid, now(), 1, now())
      returning * into v_row;
    return query select v_row.used, v_limit, v_row.window_start, true;
    return;
  end if;

  -- Rolling window elapsed -> restart the count at 1 and re-anchor.
  if now() - v_row.window_start >= v_window then
    update public.calc_usage
      set window_start = now(), used = 1, updated_at = now()
      where user_id = v_uid
      returning * into v_row;
    return query select v_row.used, v_limit, v_row.window_start, true;
    return;
  end if;

  -- Within the window and already at the cap -> block, do not increment.
  if v_row.used >= v_limit then
    return query select v_row.used, v_limit, v_row.window_start, false;
    return;
  end if;

  update public.calc_usage
    set used = used + 1, updated_at = now()
    where user_id = v_uid
    returning * into v_row;
  return query select v_row.used, v_limit, v_row.window_start, true;
end;
$$;

-- ---------------------------------------------------------------------------
-- calc_usage_status(): read-only. Powers the "# / 5" on-screen counter without
-- spending a credit. Reports 0 used once the window has elapsed (the next
-- consume will formally reset it).
-- ---------------------------------------------------------------------------
create or replace function public.calc_usage_status()
returns table (used integer, lim integer, window_start timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_limit  integer := 5;
  v_window interval := interval '7 days';
  v_row    public.calc_usage%rowtype;
begin
  if v_uid is null then
    return query select 0, v_limit, now();
    return;
  end if;

  select * into v_row from public.calc_usage where user_id = v_uid;

  if not found or (now() - v_row.window_start >= v_window) then
    return query select 0, v_limit, coalesce(v_row.window_start, now());
    return;
  end if;

  return query select v_row.used, v_limit, v_row.window_start;
end;
$$;

revoke all on function public.calc_consume() from public;
revoke all on function public.calc_usage_status() from public;
grant execute on function public.calc_consume() to authenticated;
grant execute on function public.calc_usage_status() to authenticated;
