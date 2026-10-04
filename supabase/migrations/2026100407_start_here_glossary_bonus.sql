-- ===========================================================================
-- START HERE: two extra full glossary definitions, ONCE (owner 2026-10-04)
--
-- DRAFT - NOT APPLIED. Comp A applies it after the owner approves.
--
-- Owner: Start Here gives the learner 2 EXTRA full glossary definition lookups,
-- once, then normal weekly metering - "this should not be a loophole in our
-- limit".
--
-- Design:
--   * The grant is recorded per IDENTITY (auth uid) AND per DEVICE (the app's
--     install id, ape:deviceId - the same id the weekly meter already uses,
--     2026092502). A bonus open needs room in BOTH rows and spends from BOTH.
--     So:
--       - reinstall (new device id, same account)      -> the identity row is spent;
--       - new account / new guest key on the same phone -> the device row is spent;
--       - no device id (old build, unreadable id)        -> no bonus; normal meter.
--   * Only the new RPC get_glossary_definition_start_here() spends it. The app
--     calls that RPC only from Start Here; every other open still calls
--     get_glossary_definition(), unchanged.
--   * A bonus open does NOT spend a weekly lookup (that is what "extra"
--     means). When the bonus is used up, the same call falls through to the
--     normal weekly meter (glossary_consume), with the same refusal message
--     ('weekly_limit_reached') as today.
--   * Members are never metered and never touch the bonus (has_academy_access,
--     first, exactly as get_glossary_definition).
--   * A term already read by this identity in the last 24 h (2026100301) is
--     free and spends nothing - neither the bonus nor the week.
--   * A bonus open is written to glossary_term_reads like any charged open, so
--     re-opening that term within 24 h is free everywhere.
--   * Both rows are written in the RPC's single transaction: a refusal or an
--     error rolls the bonus back with everything else.
--
-- Id spaces: user_id here is auth.uid() (the AUTH id, like glossary_usage and
-- glossary_term_reads) - NOT public.users.id.
--
-- Compatibility: new table + new functions only. get_glossary_definition,
-- glossary_consume and glossary_usage_status are not changed. Published builds
-- never call the new RPC and are unaffected; the new client falls back to the
-- normal RPC while this is not applied (PGRST202 "could not find the function").
-- ===========================================================================

create table if not exists public.glossary_start_here_bonus_user (
  user_id       uuid        primary key,
  used          integer     not null default 0 check (used >= 0),
  first_used_at timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.glossary_start_here_bonus_device (
  device_id     text        primary key,
  used          integer     not null default 0 check (used >= 0),
  first_used_at timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.glossary_start_here_bonus_user   enable row level security;
alter table public.glossary_start_here_bonus_device enable row level security;
-- No policies on purpose: only the SECURITY DEFINER functions below touch them.
revoke all on table public.glossary_start_here_bonus_user   from public, anon, authenticated;
revoke all on table public.glossary_start_here_bonus_device from public, anon, authenticated;
-- service_role does not inherit table rights; give it its own (support / audits).
grant select, insert, update, delete on table public.glossary_start_here_bonus_user   to service_role;
grant select, insert, update, delete on table public.glossary_start_here_bonus_device to service_role;

-- ---------------------------------------------------------------------------
-- glossary_start_here_bonus_status(p_device_id): read-only. How many of the 2
-- extra definitions are left for this identity on this device (the smaller of
-- the two rows), or NULL when the bonus does not apply here:
--   * a member (never metered);
--   * no usable device id (the bonus needs one; the normal meter applies).
-- A caller with no session gets 0 rows' worth of nothing: NULL as well.
-- ---------------------------------------------------------------------------
create or replace function public.glossary_start_here_bonus_status(p_device_id text default null)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_dev   text := public.glossary_device_key(p_device_id);
  v_bonus constant integer := 2;
  u_used  integer;
  d_used  integer;
begin
  if v_uid is null or v_dev is null then
    return null;
  end if;
  if public.has_academy_access(v_uid) then
    return null;
  end if;
  select b.used into u_used from public.glossary_start_here_bonus_user b where b.user_id = v_uid;
  select b.used into d_used from public.glossary_start_here_bonus_device b where b.device_id = v_dev;
  return greatest(0, v_bonus - greatest(coalesce(u_used, 0), coalesce(d_used, 0)));
end;
$$;

-- ---------------------------------------------------------------------------
-- get_glossary_definition_start_here(p_id, p_device_id): Start Here's metered
-- open. Same columns as get_glossary_definition, plus:
--   bonus_spent  true when THIS call spent one of the 2 extra definitions;
--   bonus_left   extra definitions left after this call (NULL: not applicable).
-- ---------------------------------------------------------------------------
create or replace function public.get_glossary_definition_start_here(p_id uuid, p_device_id text default null)
returns table (
  definition text, plain_english text, purpose_function text, practical_application text,
  scenario_contexts text[], related_terms text[], category text, difficulty text,
  common_mistakes text[], used integer, lim integer, window_start timestamptz,
  bonus_spent boolean, bonus_left integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_dev   text := public.glossary_device_key(p_device_id);
  v_bonus constant integer := 2;
  _u      record;
  u_used  integer;
  d_used  integer;
  v_spent boolean := false;
  v_left  integer := null;
begin
  -- Members are never metered and never touch the bonus.
  if public.has_academy_access(v_uid) then
    return query
      select g.definition, g.plain_english, g.purpose_function,
             g.practical_application, g.scenario_contexts, g.related_terms,
             g.category, g.difficulty, g.common_mistakes,
             null::int, null::int, null::timestamptz, false, null::int
      from public.glossary g where g.id = p_id;
    return;
  end if;

  if v_uid is null then
    raise exception 'sign_in_required' using errcode = 'PGRST';
  end if;

  -- An unknown id spends nothing (no rows back).
  if not exists (select 1 from public.glossary g where g.id = p_id) then
    return;
  end if;

  if exists (
    select 1 from public.glossary_term_reads r
    where r.user_id = v_uid and r.glossary_id = p_id
      and r.read_at > now() - interval '24 hours'
  ) then
    -- Already charged for this term in the last 24 hours: report, don't spend.
    select s.used, s.lim, s.window_start into _u
      from public.glossary_usage_status(p_device_id) s;
    v_left := public.glossary_start_here_bonus_status(p_device_id);
  else
    if v_dev is not null then
      -- Make both rows exist, then lock them in a fixed order (identity, then
      -- device) so two concurrent opens cannot both spend the last extra one.
      insert into public.glossary_start_here_bonus_user (user_id) values (v_uid)
        on conflict (user_id) do nothing;
      insert into public.glossary_start_here_bonus_device (device_id) values (v_dev)
        on conflict (device_id) do nothing;
      select b.used into u_used from public.glossary_start_here_bonus_user b
        where b.user_id = v_uid for update;
      select b.used into d_used from public.glossary_start_here_bonus_device b
        where b.device_id = v_dev for update;

      if u_used < v_bonus and d_used < v_bonus then
        update public.glossary_start_here_bonus_user b
          set used = b.used + 1, updated_at = now()
          where b.user_id = v_uid;
        update public.glossary_start_here_bonus_device b
          set used = b.used + 1, updated_at = now()
          where b.device_id = v_dev;
        u_used := u_used + 1;
        d_used := d_used + 1;
        v_spent := true;
      end if;
      v_left := greatest(0, v_bonus - greatest(u_used, d_used));
    end if;

    if v_spent then
      -- An extra definition: the week is reported, not spent.
      select s.used, s.lim, s.window_start into _u
        from public.glossary_usage_status(p_device_id) s;
    else
      -- No extra left (or no device id): the normal weekly meter, unchanged.
      select * into _u from public.glossary_consume(p_device_id);
      if not coalesce(_u.allowed, false) then
        raise exception 'weekly_limit_reached' using errcode = 'PGRST';
      end if;
    end if;

    insert into public.glossary_term_reads (user_id, glossary_id)
      values (v_uid, p_id)
      on conflict (user_id, glossary_id) do update set read_at = now();
  end if;

  -- common_mistakes stays member-only, exactly as get_glossary_definition.
  return query
    select g.definition, g.plain_english, g.purpose_function,
           g.practical_application, g.scenario_contexts, g.related_terms,
           g.category, g.difficulty, null::text[],
           _u.used, _u.lim, _u.window_start, v_spent, v_left
    from public.glossary g where g.id = p_id;
end;
$$;

-- Guests hold an anonymous key (role `authenticated`), exactly as the weekly
-- meter's RPCs. `anon` (no key at all) is refused by the grant, and would be
-- refused by 'sign_in_required' anyway.
revoke all on function public.glossary_start_here_bonus_status(text) from public, anon;
revoke all on function public.get_glossary_definition_start_here(uuid, text) from public, anon;
grant execute on function public.glossary_start_here_bonus_status(text) to authenticated;
grant execute on function public.get_glossary_definition_start_here(uuid, text) to authenticated;

-- PostgREST picks up new functions on a schema reload.
notify pgrst, 'reload schema';
