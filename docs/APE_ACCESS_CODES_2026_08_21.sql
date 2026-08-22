-- ============================================================================
-- APE Access / Promo Codes — owner-run migration (2026-08-21)
-- ============================================================================
-- Feature (owner): a temporary way to offer BULK DISCOUNTS, COMP free Academy
-- accounts to key influencers, and TEMPORARY discounts at events/conventions.
-- The customized institutional/ED UI + workflows are a POST-launch effort; this
-- migration is the code-redemption MECHANISM, needed at launch.
--
-- This is a NARROW, owner-approved amendment to the frozen backend (same pattern
-- as the Community Mic Catalog, governance R2): two isolated tables + one
-- SECURITY DEFINER RPC. Raw code rows are NEVER client-readable (no RLS policy);
-- all access is through redeem_access_code().
--
-- CLIENT CONTRACT (already shipped, fails open until this runs):
--   redeem_access_code(p_code text) returns jsonb
--     { status: 'granted'|'already_active'|'invalid'|'expired'|'used_up'
--             |'discount_pending'|'not_authenticated',
--       tier?: 'academy', expires_at?: timestamptz }
--   Client: src/features/commercial/accessCode.ts
--
-- SCOPE AT LAUNCH:
--   • kind='grant'    → COMPS Academy access now (perpetual or N-day). FUNCTIONAL.
--   • kind='discount' → needs the in-app purchase/checkout flow (not built yet),
--                       so it returns 'discount_pending'. The rows can be seeded
--                       now; the IAP build will consume discount_pct at checkout.
--
-- Verified against live schema 2026-08-21:
--   entitlements(user_id uuid, product text, status text, source text,
--                expires_at timestamptz NOT NULL, store_ref text NOT NULL, ...)
--   users(id uuid, auth_id uuid, ...)  -- entitlements.user_id = users.id
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Code catalog (admin-managed; not client-readable)
-- ---------------------------------------------------------------------------
create table if not exists public.access_codes (
  code           text primary key,                     -- stored NORMALIZED: upper, no spaces
  kind           text not null default 'grant'
                   check (kind in ('grant','discount')),
  grant_product  text not null default 'academy',      -- entitlements.product to comp
  grant_days     integer,                              -- NULL = perpetual comp; N = N-day
  discount_pct   integer check (discount_pct between 1 and 100), -- discount kind (future IAP)
  max_uses       integer,                              -- NULL = unlimited
  used_count     integer not null default 0,
  active         boolean not null default true,
  starts_at      timestamptz,                          -- NULL = active immediately
  expires_at     timestamptz,                          -- NULL = code never expires (validity window)
  note           text,                                 -- admin note e.g. 'Influencer: Jane Q'
  created_at     timestamptz not null default now()
);
alter table public.access_codes enable row level security;
-- Intentionally NO policy → anon/authenticated cannot read or write raw codes.

-- ---------------------------------------------------------------------------
-- 2. Redemption ledger (audit + one-redemption-per-user guard)
-- ---------------------------------------------------------------------------
create table if not exists public.access_code_redemptions (
  id           uuid primary key default gen_random_uuid(),
  code         text not null references public.access_codes(code),
  user_id      uuid not null,                          -- users.id
  redeemed_at  timestamptz not null default now(),
  unique (code, user_id)
);
alter table public.access_code_redemptions enable row level security;
-- No client policy → ledger is server-only (written by the RPC below).

-- ---------------------------------------------------------------------------
-- 3. Redemption RPC (the ONLY client entry point)
-- ---------------------------------------------------------------------------
create or replace function public.redeem_access_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth    uuid := auth.uid();
  v_user_id uuid;
  v_code    text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  c         public.access_codes%rowtype;
  v_expires timestamptz;
  v_existing public.entitlements%rowtype;
begin
  if v_auth is null then
    return jsonb_build_object('status', 'not_authenticated');
  end if;

  select id into v_user_id from public.users where auth_id = v_auth;
  if v_user_id is null then
    return jsonb_build_object('status', 'not_authenticated');
  end if;

  if v_code = '' then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into c from public.access_codes where code = v_code;
  if not found or not c.active then
    return jsonb_build_object('status', 'invalid');
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return jsonb_build_object('status', 'invalid');
  end if;
  if c.expires_at is not null and now() > c.expires_at then
    return jsonb_build_object('status', 'expired');
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('status', 'used_up');
  end if;

  -- Already redeemed by this user → idempotent success.
  if exists (
    select 1 from public.access_code_redemptions r
     where r.code = v_code and r.user_id = v_user_id
  ) then
    return jsonb_build_object('status', 'already_active', 'tier', c.grant_product);
  end if;

  -- Discount codes need the checkout flow (not built yet).
  if c.kind = 'discount' then
    return jsonb_build_object('status', 'discount_pending');
  end if;

  -- GRANT: comp the product. entitlements.expires_at is NOT NULL, so a perpetual
  -- comp uses a far-future sentinel; a timed comp extends from now.
  v_expires := case
                 when c.grant_days is null then timestamptz '2099-12-31 00:00:00+00'
                 else now() + make_interval(days => c.grant_days)
               end;

  select * into v_existing
    from public.entitlements
   where user_id = v_user_id and product = c.grant_product
   order by expires_at desc
   limit 1;

  if found then
    update public.entitlements
       set status     = 'active',
           source     = 'access_code',
           store_ref  = v_code,
           expires_at = greatest(v_existing.expires_at, v_expires),
           updated_at = now()
     where id = v_existing.id;
  else
    insert into public.entitlements (user_id, product, status, source, expires_at, store_ref)
    values (v_user_id, c.grant_product, 'active', 'access_code', v_expires, v_code);
  end if;

  insert into public.access_code_redemptions (code, user_id) values (v_code, v_user_id);
  update public.access_codes set used_count = used_count + 1 where code = v_code;

  return jsonb_build_object('status', 'granted', 'tier', c.grant_product, 'expires_at', v_expires);
end;
$$;

revoke execute on function public.redeem_access_code(text) from anon, public;
grant execute on function public.redeem_access_code(text) to authenticated;

commit;

-- ============================================================================
-- ADMIN USAGE — create codes (run these as needed; codes are stored UPPER/no-space)
-- ============================================================================
-- Perpetual influencer comps (50 seats):
--   insert into public.access_codes (code, kind, grant_days, max_uses, note)
--   values ('INFLUENCER-FREE', 'grant', null, 50, 'Influencer comps 2026');
--
-- One-year comp for a single VIP:
--   insert into public.access_codes (code, kind, grant_days, max_uses, note)
--   values ('VIP-JANE-1YR', 'grant', 365, 1, 'Jane Q — 1yr comp');
--
-- Event comp, valid only during the convention week:
--   insert into public.access_codes (code, kind, grant_days, max_uses, starts_at, expires_at, note)
--   values ('NAMM2026', 'grant', 90, 500, '2026-01-20', '2026-01-27', 'NAMM booth — 90-day trial');
--
-- Event DISCOUNT (recognized now, applied at checkout once IAP ships):
--   insert into public.access_codes (code, kind, discount_pct, max_uses, expires_at, note)
--   values ('CONF30', 'discount', 30, 1000, '2026-03-01', 'Conference 30% off');
--
-- Deactivate a code:   update public.access_codes set active = false where code = 'NAMM2026';
-- Audit redemptions:   select code, count(*) from public.access_code_redemptions group by code;
-- ============================================================================
