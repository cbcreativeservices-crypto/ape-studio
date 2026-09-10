-- ===========================================================================
-- APE — GLOSSARY WEEKLY LOOKUP CAP: 14 / rolling week  (owner ruling 2026-09-10)
--
-- Free / lapsed accounts get 14 glossary DEFINITION OPENS ("lookups") per
-- rolling 7-day window, the window ANCHORED at the account's first counted
-- lookup (not a fixed calendar day). Academy is unlimited (the client never
-- calls these RPCs for a member). Anonymous guests have no account to count, so
-- the client meters THEM device-locally (AsyncStorage) — these RPCs run only
-- for signed-in free/lapsed users, keyed by auth.uid().
--
-- WHAT COUNTS (owner 2026-09-10): opening a definition to view it = +1. The
-- SEARCH itself is free — a search plus the first definition opened from it is a
-- single +1; each additional definition opened is another +1; a definition
-- opened after scrolling the list is +1. CROSS-LINKS (tapping a related term
-- inside a definition) are FREE. Re-opening a term already viewed in the same
-- app session is free (the client dedupes); the server simply counts every
-- consume it is asked to make. When the client is out of lookups it HARD-LOCKS
-- the glossary UI (client-side); the server just reports allowed=false.
--
-- The warning ("7 left") fires CLIENT-side at 7 used (Option A, owner
-- 2026-09-10); the server owns only the hard limit. The limit (14) and window
-- (7 days) are SERVER-AUTHORITATIVE — they live inside the functions so the
-- client cannot raise them. Run this whole file ONCE in the Supabase SQL editor.
-- Safe to re-run (idempotent; `create or replace`, touches no row data).
--
-- Mirrors docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL exactly (same shape, same
-- fail-open client contract in src/features/glossary/glossaryCap.ts).
-- ===========================================================================

create table if not exists public.glossary_usage (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  used         integer     not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.glossary_usage enable row level security;

-- Users may read their own row (the RPCs below do the writing as definer).
drop policy if exists glossary_usage_own_select on public.glossary_usage;
create policy glossary_usage_own_select on public.glossary_usage
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- glossary_consume(): spend one credit. Call this the moment a capped user
-- opens a NEW definition to view it. Returns the post-state.
--   allowed = true  -> this lookup is permitted (definition may be shown)
--   allowed = false -> already at the limit; nothing incremented (block it)
-- Resets (window_start = now, used = 1) when 7 days have elapsed since the
-- window began — so the count restarts on the NEXT lookup after a week, not on
-- a fixed weekday.
-- ---------------------------------------------------------------------------
create or replace function public.glossary_consume()
returns table (used integer, lim integer, window_start timestamptz, allowed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_limit  integer := 14;
  v_window interval := interval '7 days';
  v_row    public.glossary_usage%rowtype;
begin
  if v_uid is null then
    return query select 0, v_limit, now(), false;
    return;
  end if;

  select * into v_row from public.glossary_usage where user_id = v_uid for update;

  if not found then
    insert into public.glossary_usage (user_id, window_start, used, updated_at)
      values (v_uid, now(), 1, now())
      returning * into v_row;
    return query select v_row.used, v_limit, v_row.window_start, true;
    return;
  end if;

  -- Rolling window elapsed -> restart the count at 1 and re-anchor.
  if now() - v_row.window_start >= v_window then
    update public.glossary_usage
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

  update public.glossary_usage
    set used = used + 1, updated_at = now()
    where user_id = v_uid
    returning * into v_row;
  return query select v_row.used, v_limit, v_row.window_start, true;
end;
$$;

-- ---------------------------------------------------------------------------
-- glossary_usage_status(): read-only. Reports the current week's usage without
-- spending a credit (for an optional counter / status check). Reports 0 used
-- once the window has elapsed (the next consume will formally reset it).
-- ---------------------------------------------------------------------------
create or replace function public.glossary_usage_status()
returns table (used integer, lim integer, window_start timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_limit  integer := 14;
  v_window interval := interval '7 days';
  v_row    public.glossary_usage%rowtype;
begin
  if v_uid is null then
    return query select 0, v_limit, now();
    return;
  end if;

  select * into v_row from public.glossary_usage where user_id = v_uid;

  if not found or (now() - v_row.window_start >= v_window) then
    return query select 0, v_limit, coalesce(v_row.window_start, now());
    return;
  end if;

  return query select v_row.used, v_limit, v_row.window_start;
end;
$$;

revoke all on function public.glossary_consume() from public;
revoke all on function public.glossary_usage_status() from public;
grant execute on function public.glossary_consume() to authenticated;
grant execute on function public.glossary_usage_status() to authenticated;

-- ---------------------------------------------------------------------------
-- VERIFY (optional) — run after, expect a single row with used within [0,14]:
--   select * from public.glossary_usage_status();
-- ---------------------------------------------------------------------------
