-- ===========================================================================
-- GLOSSARY WEEKLY METER: counted per DEVICE as well as per identity
-- (owner 2026-09-25: a guest who hit the weekly lock signed in to a free
-- account on the same phone and "it was completely unlocked fresh again").
--
-- Before: one usage row per auth uid. A guest's temporary device key, a free
-- account, and a re-minted guest key are three uids, so one phone had three
-- separate fourteens. After: the app sends its stable per-install id
-- (ape:deviceId, which survives sign-in, sign-out and Guest Mode) with every
-- metered call, and the server keeps a row per DEVICE beside the row per
-- identity. A lookup is allowed only when BOTH rows have room; a block
-- increments neither. The fuller row is what the app shows.
--
-- Compatibility: every new parameter has a default, so the already-published
-- app (which sends no device id) keeps working exactly as before — metered by
-- identity only — until it updates. The old zero-argument overloads are
-- dropped so PostgREST never has two candidates.
-- ===========================================================================

create table if not exists public.glossary_usage_device (
  device_id    text        primary key,
  window_start timestamptz not null default now(),
  used         integer     not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.glossary_usage_device enable row level security;
-- No policies on purpose: only the SECURITY DEFINER functions below touch it.
revoke all on table public.glossary_usage_device from anon, authenticated;

-- A usable device id, or null. The app's id is a UUID; anything else that a
-- caller could invent is bounded to a short, plain token so the table cannot
-- be filled with junk keys of arbitrary size.
create or replace function public.glossary_device_key(p_device_id text)
returns text
language sql
immutable
as $$
  select case when p_device_id ~ '^[A-Za-z0-9._-]{8,64}$' then p_device_id else null end
$$;
revoke all on function public.glossary_device_key(text) from public;

drop function if exists public.glossary_consume();
drop function if exists public.glossary_usage_status();
drop function if exists public.get_glossary_definition(uuid);

-- ---------------------------------------------------------------------------
-- glossary_consume(p_device_id): spend one credit against the identity row AND
-- the device row. Blocked when either is at the cap; nothing incremented then.
-- Rows lock in a fixed order (identity, then device) so two calls cannot
-- deadlock. Returns the fuller of the two rows.
-- ---------------------------------------------------------------------------
create or replace function public.glossary_consume(p_device_id text default null)
returns table (used integer, lim integer, window_start timestamptz, allowed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_dev    text := public.glossary_device_key(p_device_id);
  v_limit  integer := 14;
  v_window interval := interval '7 days';
  u        public.glossary_usage%rowtype;
  d        public.glossary_usage_device%rowtype;
begin
  if v_uid is null then
    return query select 0, v_limit, now(), false;
    return;
  end if;

  -- Identity row: create, or re-anchor when the rolling week has elapsed.
  select * into u from public.glossary_usage where user_id = v_uid for update;
  if not found then
    insert into public.glossary_usage (user_id, window_start, used, updated_at)
      values (v_uid, now(), 0, now())
      returning * into u;
  elsif now() - u.window_start >= v_window then
    update public.glossary_usage x
      set window_start = now(), used = 0, updated_at = now()
      where x.user_id = v_uid
      returning * into u;
  end if;

  -- Device row: the same, when the caller gave a usable device id.
  if v_dev is not null then
    select * into d from public.glossary_usage_device where device_id = v_dev for update;
    if not found then
      insert into public.glossary_usage_device (device_id, window_start, used, updated_at)
        values (v_dev, now(), 0, now())
        returning * into d;
    elsif now() - d.window_start >= v_window then
      update public.glossary_usage_device x
        set window_start = now(), used = 0, updated_at = now()
        where x.device_id = v_dev
        returning * into d;
    end if;
  end if;

  -- At the cap on either row -> block, increment nothing, report the fuller.
  if u.used >= v_limit or (v_dev is not null and d.used >= v_limit) then
    if v_dev is not null and d.used >= u.used then
      return query select d.used, v_limit, d.window_start, false;
    else
      return query select u.used, v_limit, u.window_start, false;
    end if;
    return;
  end if;

  -- The `x.` alias is load-bearing: `used` is also an OUT parameter here.
  update public.glossary_usage x
    set used = x.used + 1, updated_at = now()
    where x.user_id = v_uid
    returning * into u;
  if v_dev is not null then
    update public.glossary_usage_device x
      set used = x.used + 1, updated_at = now()
      where x.device_id = v_dev
      returning * into d;
    if d.used >= u.used then
      return query select d.used, v_limit, d.window_start, true;
      return;
    end if;
  end if;
  return query select u.used, v_limit, u.window_start, true;
end;
$$;

-- ---------------------------------------------------------------------------
-- glossary_usage_status(p_device_id): read-only; the fuller of the two rows,
-- each reported as 0 once its window has elapsed.
-- ---------------------------------------------------------------------------
create or replace function public.glossary_usage_status(p_device_id text default null)
returns table (used integer, lim integer, window_start timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_dev    text := public.glossary_device_key(p_device_id);
  v_limit  integer := 14;
  v_window interval := interval '7 days';
  u        public.glossary_usage%rowtype;
  d        public.glossary_usage_device%rowtype;
  u_used   integer := 0;
  u_ws     timestamptz := now();
  d_used   integer := 0;
  d_ws     timestamptz := now();
begin
  if v_uid is null then
    return query select 0, v_limit, now();
    return;
  end if;

  select * into u from public.glossary_usage where user_id = v_uid;
  if found and now() - u.window_start < v_window then
    u_used := u.used;
    u_ws := u.window_start;
  elsif found then
    u_ws := u.window_start;
  end if;

  if v_dev is not null then
    select * into d from public.glossary_usage_device where device_id = v_dev;
    if found and now() - d.window_start < v_window then
      d_used := d.used;
      d_ws := d.window_start;
    end if;
  end if;

  if d_used > u_used then
    return query select d_used, v_limit, d_ws;
  else
    return query select u_used, v_limit, u_ws;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_glossary_definition(p_id, p_device_id): the live metering path. Same
-- body as before; the device id is passed through to glossary_consume.
-- ---------------------------------------------------------------------------
create or replace function public.get_glossary_definition(p_id uuid, p_device_id text default null)
returns table (
  definition text, plain_english text, purpose_function text, practical_application text,
  scenario_contexts text[], related_terms text[], category text, difficulty text,
  common_mistakes text[], used integer, lim integer, window_start timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare _u record;
begin
  -- Members are never metered.
  if public.has_academy_access(auth.uid()) then
    return query
      select g.definition, g.plain_english, g.purpose_function,
             g.practical_application, g.scenario_contexts, g.related_terms,
             g.category, g.difficulty, g.common_mistakes,
             null::int, null::int, null::timestamptz
      from public.glossary g where g.id = p_id;
    return;
  end if;

  -- Everyone else must be signed in — for a guest, that means holding the
  -- temporary device key they consented to.
  if auth.uid() is null then
    raise exception 'sign_in_required' using errcode = 'PGRST';
  end if;

  select * into _u from public.glossary_consume(p_device_id);
  if not coalesce(_u.allowed, false) then
    raise exception 'weekly_limit_reached' using errcode = 'PGRST';
  end if;

  -- common_mistakes stays member-only, exactly as glossary_full_v masks it.
  return query
    select g.definition, g.plain_english, g.purpose_function,
           g.practical_application, g.scenario_contexts, g.related_terms,
           g.category, g.difficulty, null::text[],
           _u.used, _u.lim, _u.window_start
    from public.glossary g where g.id = p_id;
end;
$$;

revoke all on function public.glossary_consume(text) from public;
revoke all on function public.glossary_usage_status(text) from public;
revoke all on function public.get_glossary_definition(uuid, text) from public;
grant execute on function public.glossary_consume(text) to authenticated;
grant execute on function public.glossary_usage_status(text) to authenticated;
grant execute on function public.get_glossary_definition(uuid, text) to authenticated;
