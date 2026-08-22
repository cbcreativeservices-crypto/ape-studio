-- ============================================================================
-- APE Single-Device Login — owner-run migration (2026-08-21)
-- ============================================================================
-- Feature (owner): one account may be actively used on ONE device at a time.
-- When a new device signs in and PINGS the server (claim_device), it becomes the
-- active device; the previous device discovers it's no longer active on its next
-- check (launch / app-foreground) and signs itself out. 1 user = 1 active device
-- = no simultaneous shared-credential use.
--
-- Narrow frozen-backend amendment (access-code / mic-catalog precedent): one
-- isolated table + two SECURITY DEFINER RPCs. Client: src/features/account/
-- deviceIdentity.ts + singleDevice.ts; claim on sign-in; guard on foreground.
-- ============================================================================

begin;

create table if not exists public.active_device (
  user_id    uuid primary key,           -- one row per user (users.id)
  device_id  text not null,              -- the currently-active device's id
  updated_at timestamptz not null default now()
);
alter table public.active_device enable row level security;
-- No client policy — all access is via the SECURITY DEFINER RPCs below.

-- Claim this device as the active one for the caller. Returns the PRIOR device id
-- (so the client can tell the user another device was signed out) + whether this
-- was a takeover.
create or replace function public.claim_device(p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path to public, pg_temp
as $$
declare
  v_auth  uuid := auth.uid();
  v_user  uuid;
  v_prior text;
begin
  if v_auth is null then return jsonb_build_object('status','not_authenticated'); end if;
  select id into v_user from public.users where auth_id = v_auth;
  if v_user is null then return jsonb_build_object('status','not_authenticated'); end if;

  select device_id into v_prior from public.active_device where user_id = v_user;

  insert into public.active_device(user_id, device_id, updated_at)
       values (v_user, p_device_id, now())
  on conflict (user_id) do update set device_id = excluded.device_id, updated_at = now();

  return jsonb_build_object(
    'status', 'claimed',
    'prior_device_id', v_prior,
    'took_over', (v_prior is not null and v_prior <> p_device_id)
  );
end;
$$;

-- The account's currently-active device id (or NULL if none). The client
-- compares it to its own id: NULL → no active device yet (do nothing / claim);
-- equal → still active; different → this device was displaced → sign out.
create or replace function public.get_active_device()
returns text
language sql
security definer
set search_path to public, pg_temp
stable
as $$
  select ad.device_id
    from public.active_device ad
    join public.users u on u.id = ad.user_id
   where u.auth_id = auth.uid();
$$;

revoke execute on function public.claim_device(text) from anon, public;
revoke execute on function public.get_active_device() from anon, public;
grant execute on function public.claim_device(text) to authenticated;
grant execute on function public.get_active_device() to authenticated;

commit;
