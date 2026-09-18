# One month of membership before a credential — for Computer A

**From:** ccode · 2026-09-17
**Owner's rule, settled this session.** The app has stated it since 2026-07-22
and nothing has ever enforced it.

> A minimum of 1 complete month of paid membership is required before a
> certificate can be granted.
> — `AwardsScreen.tsx:417`

---

## The rule, exactly

| | |
|---|---|
| Length | **One** complete month. Not two. |
| Clock starts | The **first paid day**. |
| A lapse | **Resets** it. Months do not accumulate across gaps. |
| Admin grants / access codes | **Count as paid** (owner, 2026-09-17). The codes are tiered — 1 month free, 1 year, lifetime — and issued from the owner's own dashboard, so a comp is a deliberate gift of membership and earns like one. |
| A refund | **Earns nothing.** Owner: *"no certificates if they refund and I never get paid anything."* |

Because comps count, the only thing excluded is money that came back.

---

## What I verified in the live database

- `entitlements` = product / status / source / expires_at / store_ref /
  created_at / updated_at. **No record of when a run of membership began.**
  All 3 rows are `admin_grant`; no real purchase has ever been written.
- `has_academy_access(uuid)` tests `status='active'` and not-expired. No notion
  of duration.
- `start_final_exam` gates on: academy access → already earned → award complete
  → content activation → lockout. **No tenure check.**
- `redeem_access_code` writes `source='access_code'` and an `expires_at` of
  `now() + grant_days`, or the 2099 sentinel when `grant_days is null`.
- `validate-purchase` checks Apple's `revocationDate` **at purchase time only**.

## What I have prepared

`supabase/migrations/2026091801_paid_month_before_credential.sql` — **written,
not applied.** It adds:

1. `entitlements.member_since timestamptz` — start of the current unbroken run,
   whatever the source. Preserved across renewals, reset when a lapsed member
   returns, cleared on refund. Backfilled from `created_at` (correct for the 3
   existing admin grants).
2. `entitlements.refunded_at timestamptz`.
3. `member_month_complete(uuid)` — the predicate.
4. A revised `redeem_access_code` that maintains `member_since` (it only
   restarts the clock when the previous run had actually lapsed, so a renewal
   or a monthly→lifetime upgrade keeps the original date).
5. The one-line gate for `start_final_exam`, written as an instruction to edit
   the live body rather than as a copy of it — a stale paste would silently
   drop the D4 activation floor.

The client half is already shipped and live: `paid_tenure_required` is a known
`ExamStartError` with user copy, and the rule now also appears on
`AwardProgressScreen` where the exam is actually taken.

---

## What I need from you

### 1 · The refund webhook does not exist — is it yours?

This is the real gap. Apple and Google report refunds **asynchronously**, and
there is no App Store Server Notifications V2 handler and no Play RTDN handler
among the edge functions (`tube-image`, `on-weekly-concept`, `validate-purchase`,
`admin-codes`, `lab-upload`, `lab-audio`, `lab-source-pull`, `lab-audio-load`).

So today a refunded member keeps `status='active'` until their period simply
expires. `refunded_at` would never be set, and the refund half of the owner's
rule stays unenforced no matter what the predicate says.

**Question:** are you building the notifications handler, or should ccode? It
needs to set `status`, `refunded_at` and clear `member_since` on
`REFUND` / `REVOKE` (Apple) and `SUBSCRIPTION_REVOKED` / voided purchases
(Google).

### 2 · Does `validate-purchase` become yours to edit, or mine?

It needs the same `member_since` maintenance the migration gives
`redeem_access_code`: set on a new row, preserved on renewal, restarted after a
lapse. It is a Deno edge function in your half of the house, but ccode wrote it
(2026-08-21). Say which of us touches it and I will stay out of the way.

### 3 · Apply the migration, or do you want to?

It is a nullable column, a backfill of 3 rows, one new function and one edited
one. Low risk, but it is production and the sync channel's own rule is that the
live DB is yours.

---

## Already done — the month tier is 35 days

**Was:** a `grant_days = 30` code could never earn a credential. In a 31-day
month `now() - interval '1 month'` is 31 days ago, so the code expired before it
qualified.

**Now:** owner ruled 35 days and it is APPLIED to production —
`admin_mint_access_code` migration `month_plan_35_days_so_it_can_earn_a_credential`.
Verified live: `when 'month' then 35`. Safe, because no month code had ever been
minted (the three existing codes are two lifetime and one year).

A member on a month code now becomes eligible on day 28-31 and keeps access to
day 35: a 4-7 day window to sit the exam.

### One small thing that follows from it

The `admin-codes` console page still labels plans with
`(d===30 ? "month" : d+"d")`, so a newly minted month code will list as
**"35d"** rather than **"month"**. Cosmetic and honest, but it is in your edge
function and needs a redeploy, so ccode has not touched it. One character:
`d===35`.
