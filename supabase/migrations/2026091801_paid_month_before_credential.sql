-- One complete month of PAID membership before a credential is granted.
--
-- Owner's rule, restated 2026-09-17:
--   • the clock starts on the FIRST PAID DAY;
--   • a lapse RESETS it (paid months do not accumulate across gaps);
--   • one complete month, not two;
--   • a refunded purchase earns nothing — "no certificates if they refund and
--     I never get paid anything".
--
-- The rule has been stated in the app since 2026-07-22 (AwardsScreen) and was
-- never enforced anywhere. This migration is the enforcement.
--
-- NOT YET APPLIED. Written for review — see docs/APE_PAID_TENURE_PLAN.md for
-- the two policy edges that need the owner's answer first (admin grants, and
-- the refund webhook that does not exist yet).

begin;

-- ── 1 · when the current unbroken PAID run began ─────────────────────────────
--
-- NULL means "no paid money has been received for this entitlement", which is
-- the correct and safe default: every existing row is an admin_grant, and an
-- admin grant is not a payment. Nothing that is NULL can ever satisfy the gate.
alter table public.entitlements
  add column if not exists paid_since timestamptz;

comment on column public.entitlements.paid_since is
  'First day of the CURRENT unbroken run of PAID access. Set by validate-purchase '
  'on a paid activation; RESET to the new date when a lapsed member pays again; '
  'CLEARED on refund/revocation. NULL = no payment received, so no credential.';

-- A refund or store revocation has to be recordable. `status` is free text with
-- no check constraint today, so this is a widening, not a break.
alter table public.entitlements
  add column if not exists refunded_at timestamptz;

comment on column public.entitlements.refunded_at is
  'Set when Apple/Google report a refund or revocation. Non-null means the money '
  'was returned: access ends and paid_since is cleared, so no credential is granted.';

-- ── 2 · the predicate ────────────────────────────────────────────────────────
create or replace function public.paid_month_complete(p_uid uuid)
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
       -- The whole rule, in one line: a full month of unbroken paid membership.
       and e.paid_since is not null
       and e.paid_since <= now() - interval '1 month'
  );
$$;

comment on function public.paid_month_complete(uuid) is
  'True when the caller has had one complete month of unbroken, unrefunded PAID '
  'academy membership. Institutional users are NOT exempt here on purpose — if '
  'they should be, add the audience check deliberately rather than by omission.';

grant execute on function public.paid_month_complete(uuid) to authenticated;

-- ── 3 · the gate ─────────────────────────────────────────────────────────────
--
-- Placed immediately after the existing academy_required check in
-- start_final_exam, so the order of refusals reads: not a member → not a member
-- long enough → already earned → work incomplete.
--
-- NOTE FOR WHOEVER APPLIES THIS: start_final_exam is long and this file must
-- not fork it. Apply by editing the LIVE body at that one line rather than
-- pasting a stale copy over it:
--
--   IF NOT public.has_academy_access(auth.uid()) THEN RAISE EXCEPTION 'academy_required'; END IF;
-- + IF NOT public.paid_month_complete(auth.uid()) THEN RAISE EXCEPTION 'paid_tenure_required'; END IF;
--
-- The client already knows this error code and has copy for it
-- (src/features/finalExam/api.ts, EXAM_START_ERROR_COPY.paid_tenure_required).
--
-- submit_final_exam needs the same guard immediately before it writes the
-- credential_awards row, because a refund can land between starting an exam and
-- finishing it, and the start gate cannot see the future.

commit;
