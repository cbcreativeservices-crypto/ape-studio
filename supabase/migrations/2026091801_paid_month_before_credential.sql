-- One complete month of membership before a credential is granted.
--
-- Owner's rule, settled 2026-09-17:
--   • the clock starts on the FIRST PAID DAY;
--   • a lapse RESETS it — months do not accumulate across gaps;
--   • ONE complete month, not two;
--   • ADMIN GRANTS AND ACCESS CODES COUNT AS PAID (owner, 2026-09-17). The
--     codes are tiered — 1 month free, 1 year, lifetime — and issued from the
--     owner's own dashboard, so a comp is a deliberate gift of membership and
--     earns like one;
--   • a REFUND earns nothing: "no certificates if they refund and I never get
--     paid anything".
--
-- Because comps count, the only thing excluded is money that came back. The
-- column is therefore named for what it actually measures — the start of the
-- current unbroken run of active membership — rather than for "paid", which
-- would be a lie the first time a comped influencer earned a certificate.
--
-- The rule has been STATED in the app since 2026-07-22 (AwardsScreen) and has
-- never been ENFORCED. This migration is the enforcement.
--
-- NOT YET APPLIED — see docs/APE_MEMBER_TENURE_FOR_COMP_A.md. One question is
-- outstanding for Computer A (the refund webhook), and one is the owner's (the
-- 1-month code tier can never reach a full month; see MEMBER_MONTH below).

begin;

-- ── 1 · when the current unbroken run of membership began ────────────────────
--
-- Set by EVERY path that activates access: validate-purchase, redeem_access_code
-- and any admin grant. Left alone while a run continues (a renewal must not
-- restart the clock). RESET to now() when a lapsed member comes back, which is
-- what makes "a lapse resets it" true.
--
-- NULL means the row predates this migration. Backfilled below from created_at,
-- which for the three existing admin_grant rows is exactly when their access
-- began.
alter table public.entitlements
  add column if not exists member_since timestamptz;

comment on column public.entitlements.member_since is
  'Start of the CURRENT unbroken run of active membership, whatever its source. '
  'Set on activation, PRESERVED across renewals, RESET when a lapsed member '
  'returns, CLEARED on refund. Comps and access codes count (owner 2026-09-17).';

-- A refund or store revocation has to be recordable. `status` is free text with
-- no check constraint, so this widens rather than breaks.
alter table public.entitlements
  add column if not exists refunded_at timestamptz;

comment on column public.entitlements.refunded_at is
  'Set when Apple or Google report a refund or revocation. Non-null means the '
  'money came back: access ends, member_since is cleared, no credential is granted.';

-- Backfill. Safe: all existing rows are admin_grant, which counts as paid, and
-- created_at is when that grant was made.
update public.entitlements
   set member_since = created_at
 where member_since is null;

-- ── 2 · the predicate ────────────────────────────────────────────────────────
--
-- MEMBER_MONTH is one calendar month. NOTE FOR THE OWNER: a code with
-- grant_days = 30 can NEVER satisfy this — in a 31-day month, `now() - interval
-- '1 month'` is 31 days ago, so a 30-day grant runs out before it qualifies,
-- and even in a 30-day month it is a photo finish against its own expiry. If
-- the "1 month free" tier is meant to be able to earn a credential, issue it
-- with grant_days = 35 or so. If it is meant as a taster, leave it at 30 and
-- this comment is the record of that being deliberate.
create or replace function public.member_month_complete(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
      from public.users u
      join public.entitlements e on e.user_id = u.id
     where u.auth_id = p_uid
       and e.product = 'academy'
       and e.status  = 'active'
       and e.refunded_at is null
       and (e.expires_at is null or e.expires_at > now())
       -- The whole rule, in one line.
       and e.member_since is not null
       and e.member_since <= now() - interval '1 month'
  );
$$;

comment on function public.member_month_complete(uuid) is
  'True when the caller has had one complete, unbroken, unrefunded month of '
  'active academy membership from any source. Institutional users are NOT '
  'exempt here on purpose — if they should be, add that check deliberately.';

grant execute on function public.member_month_complete(uuid) to authenticated;

-- ── 3 · keep member_since correct on every activation path ───────────────────
--
-- redeem_access_code: set it on a NEW row, and on an existing row only when the
-- previous run had already lapsed. A live renewal or an upgrade from a monthly
-- code to a lifetime one must NOT restart the clock.
--
-- The rest of redeem_access_code is unchanged; only the two writes are touched.
create or replace function public.redeem_access_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  -- HARDENED 2026-09-11: lock the code row so the used_count check + increment are
  -- atomic. Without this, two different users redeeming the same code concurrently
  -- could both pass the max_uses check before either increments (over-redemption of
  -- a single-use code). FOR UPDATE serializes concurrent redemptions of the same code.
  select * into c from public.access_codes where code = v_code for update;
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
           -- ADDED 2026-09-17: start the tenure clock only when this is a NEW
           -- run. A renewal, or an upgrade from a monthly code to a lifetime
           -- one, keeps the original date; a member who lapsed and came back
           -- starts again, which is the owner's "lapses reset it".
           member_since = case
                            when v_existing.member_since is null then now()
                            when v_existing.refunded_at is not null then now()
                            when v_existing.expires_at < now() then now()
                            else v_existing.member_since
                          end,
           refunded_at = null,
           updated_at = now()
     where id = v_existing.id;
  else
    insert into public.entitlements (user_id, product, status, source, expires_at, store_ref, member_since)
    values (v_user_id, c.grant_product, 'active', 'access_code', v_expires, v_code, now());
  end if;

  insert into public.access_code_redemptions (code, user_id) values (v_code, v_user_id);
  update public.access_codes set used_count = used_count + 1 where code = v_code;

  return jsonb_build_object('status', 'granted', 'tier', c.grant_product, 'expires_at', v_expires);
end;
$function$;

-- ── 4 · the gate ─────────────────────────────────────────────────────────────
--
-- Goes immediately after the existing academy check in start_final_exam, so the
-- refusals read: not a member → not a member long enough → already earned →
-- work incomplete.
--
-- APPLY BY EDITING THE LIVE BODY AT THAT ONE LINE. start_final_exam is long and
-- this file deliberately does not carry a copy of it, because a stale copy
-- pasted over the live one is how the D4 activation floor would get lost:
--
--     IF NOT public.has_academy_access(auth.uid()) THEN RAISE EXCEPTION 'academy_required'; END IF;
--   + IF NOT public.member_month_complete(auth.uid()) THEN RAISE EXCEPTION 'paid_tenure_required'; END IF;
--
-- The client already knows this error code and has copy for it
-- (src/features/finalExam/api.ts, EXAM_START_ERROR_COPY.paid_tenure_required).
--
-- submit_final_exam needs the same guard immediately before it writes the
-- credential_awards row: a refund can land between starting an exam and
-- finishing it, and the start gate cannot see the future.

commit;
