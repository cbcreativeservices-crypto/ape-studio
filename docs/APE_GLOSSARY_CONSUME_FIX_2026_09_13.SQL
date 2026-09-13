-- =====================================================================
-- glossary_consume() — the 14/week cap had never counted past 1
-- APPLIED 2026-09-13 · migration fix_glossary_consume_ambiguous_used_column
-- =====================================================================
--
-- WHAT WAS WRONG. The function is declared
--   returns table(used integer, lim integer, window_start timestamptz, allowed boolean)
-- which makes `used` an OUT PARAMETER as well as a column of glossary_usage.
-- Its increment read:
--
--   update public.glossary_usage
--      set used = used + 1, updated_at = now()
--    where user_id = v_uid
--   returning * into v_row;
--
-- The right-hand `used` is ambiguous between the variable and the column, so
-- Postgres raised `42702 column reference "used" is ambiguous`. The FIRST
-- lookup in a window takes the INSERT path and works; every lookup after it
-- takes this UPDATE and threw.
--
-- WHY NOBODY SAW IT. features/glossary/glossaryCap.ts catches a consume error
-- and returns `unavailable: true, allowed: true` — deliberate fail-open, so the
-- glossary never breaks. It worked exactly as designed and hid this completely:
-- the count never passed 1, the "7 left" heads-up never fired, and the hard
-- lock never triggered. **The server-side 14-a-week cap has not capped anyone
-- since it went live on 2026-09-10**, through a device pass and an overnight
-- QA sweep, because nothing it does is visible when it fails.
--
-- The device-local guest path (same file) was never affected — it is plain
-- AsyncStorage arithmetic.
--
-- HOW IT SURFACED. The glossary gateway's new RPC
-- (docs/APE_GLOSSARY_GATEWAY_RUN_THIS_2026_09_13.SQL, step 3) calls
-- glossary_consume(). Testing that RPC through a full 15-lookup week raised
-- 42702 on the second call. The gateway would have inherited the same silence
-- and metered nothing at all.
--
-- THE FIX. Alias the table so the column reference is unambiguous. The `u.` is
-- load-bearing; do not "tidy" it away. The window-reset branch is folded into a
-- conditional UPDATE for the same reason — one shape, all qualified.
--
-- VERIFIED LIVE, through the whole cycle rather than by reading it back:
--   call 1..14   -> used 1..14, allowed = true
--   call 15, 16  -> used 14, allowed = FALSE, no increment
--   window aged past 7 days -> re-anchors to used = 1, then 2
--
-- ⚠️ WHAT CHANGES FOR USERS: free and lapsed ACCOUNTS are now actually limited
-- to 14 glossary definition-opens a week, which is the owner's 2026-09-10
-- ruling working for the first time. Pre-launch, so no live user is affected
-- (see the dev-stage-no-user-gating rule). If that limit should not be enforced
-- yet, run the ROLLBACK at the bottom of this file.
-- =====================================================================

create or replace function public.glossary_consume()
returns table(used integer, lim integer, window_start timestamp with time zone, allowed boolean)
language plpgsql security definer set search_path to 'public'
as $function$
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
  update public.glossary_usage u
    set window_start = now(), used = 1, updated_at = now()
    where u.user_id = v_uid and now() - v_row.window_start >= v_window
    returning * into v_row;
  if found then
    return query select v_row.used, v_limit, v_row.window_start, true;
    return;
  end if;

  select * into v_row from public.glossary_usage where user_id = v_uid for update;

  -- Within the window and already at the cap -> block, do not increment.
  if v_row.used >= v_limit then
    return query select v_row.used, v_limit, v_row.window_start, false;
    return;
  end if;

  -- ⚠️ The `u.` alias is LOAD-BEARING. `used` is also an OUT parameter of this
  -- function; unqualified, `used = used + 1` is ambiguous (42702) and every
  -- lookup after the first one in a window throws.
  update public.glossary_usage u
    set used = u.used + 1, updated_at = now()
    where u.user_id = v_uid
    returning * into v_row;
  return query select v_row.used, v_limit, v_row.window_start, true;
end;
$function$;


-- =====================================================================
-- VERIFY (leaves nothing behind). Expect 1 then 2.
-- =====================================================================
begin;
  insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, updated_at)
  values ('00000000-0000-0000-0000-0000000000aa','00000000-0000-0000-0000-000000000000',
          'authenticated','authenticated', true, now(), now());
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}';
  select used, lim, allowed from public.glossary_consume();
  select used, lim, allowed from public.glossary_consume();
rollback;


-- =====================================================================
-- ROLLBACK — restores the BROKEN version exactly as it stood before.
-- ⚠️ Running this puts the free-tier glossary cap back to "never counts past
-- one", i.e. effectively unlimited. Only do it deliberately.
-- =====================================================================
-- create or replace function public.glossary_consume()
-- returns table(used integer, lim integer, window_start timestamp with time zone, allowed boolean)
-- language plpgsql security definer set search_path to 'public'
-- as $function$
-- declare
--   v_uid    uuid := auth.uid();
--   v_limit  integer := 14;
--   v_window interval := interval '7 days';
--   v_row    public.glossary_usage%rowtype;
-- begin
--   if v_uid is null then
--     return query select 0, v_limit, now(), false;
--     return;
--   end if;
--   select * into v_row from public.glossary_usage where user_id = v_uid for update;
--   if not found then
--     insert into public.glossary_usage (user_id, window_start, used, updated_at)
--       values (v_uid, now(), 1, now())
--       returning * into v_row;
--     return query select v_row.used, v_limit, v_row.window_start, true;
--     return;
--   end if;
--   if now() - v_row.window_start >= v_window then
--     update public.glossary_usage
--       set window_start = now(), used = 1, updated_at = now()
--       where user_id = v_uid
--       returning * into v_row;
--     return query select v_row.used, v_limit, v_row.window_start, true;
--     return;
--   end if;
--   if v_row.used >= v_limit then
--     return query select v_row.used, v_limit, v_row.window_start, false;
--     return;
--   end if;
--   update public.glossary_usage
--     set used = used + 1, updated_at = now()   -- <- the 42702
--     where user_id = v_uid
--     returning * into v_row;
--   return query select v_row.used, v_limit, v_row.window_start, true;
-- end;
-- $function$;
