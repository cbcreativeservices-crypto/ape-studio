# Comp / access codes — owner guide (2026-09-07)

You asked for side functions to (a) generate codes you hand out — 1 month, 1 year, lifetime — for
promotion and for employer/institutional deals until the full institutional layer is built, and (b) let
those codes act as keys into membership. Both halves exist now; one database fix was needed to make them
actually grant access.

## What was already built (no action)

- **Redeeming is wired in the app.** A recipient enters the code on **Create Account** or later in
  **Settings → MEMBERSHIP**, and the app calls the server, then re-reads real membership
  (`src/features/commercial/accessCode.ts`, `redeem_access_code` RPC). The client never decides access;
  the server grants it and writes the entitlement (`source = access_code`, `store_ref` = the code).
- Codes are idempotent per user, respect a max-use limit, an optional validity window, and an on/off
  switch.

## The one fix you must run

Redemption was being rejected by the database: the grant writes `source = 'access_code'` but the
`entitlements` table only allowed four other source values, so every redemption (and the App Review
comp) silently failed with "redemption isn't available yet". Section 1 of
`docs/APE_OWNER_SQL_2026_09_07.sql` widens the constraint. **Run that file first** — it also installs the
generator (section 2) and the security cleanup (section 3).

## Minting codes (run in the Supabase SQL editor)

`admin_mint_access_code(plan, count, max_uses, note, code_expires_days)` returns the code(s) it creates.
It is owner-only — the app cannot call it.

| You want | Run | Gives |
|---|---|---|
| One 1-month trial code | `select * from public.admin_mint_access_code('month');` | one PA-XXXX-XXXX, 30 days of Academy |
| One 1-year free code | `select * from public.admin_mint_access_code('year', 1, 1, 'Jane Doe');` | one code, 365 days |
| One lifetime code | `select * from public.admin_mint_access_code('lifetime', 1, 1, 'Podcast guest');` | one code, never expires |
| 50 single-use 1-year codes for a promo | `select * from public.admin_mint_access_code('year', 50, 1, 'AES 2026 booth');` | 50 distinct codes |
| An employer / institutional deal, 25 seats on one code | `select * from public.admin_mint_access_code('year', 1, 25, 'Acme Corp 25 seats');` | one code, redeemable 25 times |

- **plan** sets how long the ACCESS lasts: `month` = 30 days, `year` = 365 days, `lifetime` = never expires.
- **count** is how many distinct codes to mint at once (influencer handouts).
- **max_uses** is redemptions per code — a bulk/employer deal is one code with `max_uses` = seats. This is
  the stopgap for institutions until the dedicated institutional layer (postponed) is built.
- **note** is your own label; **code_expires_days** optionally makes the code itself stop working after
  N days (separate from how long the access lasts).

## Seeing and managing codes

```sql
select code, note,
       case when grant_days is null then 'lifetime' when grant_days=365 then 'year'
            when grant_days=30 then 'month' else grant_days||'d' end as plan,
       used_count, max_uses, active, expires_at as code_expires, created_at
  from public.access_codes order by created_at desc;
```

Turn a code off early: `update public.access_codes set active=false where code='PA-XXXX-XXXX';`
See who redeemed one: `select user_id, redeemed_at from public.access_code_redemptions where code='PA-XXXX-XXXX';`

## How a recipient uses it

1. Create an account (or sign in) in the app.
2. Enter the code on the Create Account screen, or Settings → MEMBERSHIP → redeem.
3. Membership activates immediately; a lifetime code shows no expiry, a timed code counts from redemption.

## Reviewer / App Review account (launch item)

Same mechanism: create `review@proaudiotrainingacademy.com`, mint a lifetime code
(`admin_mint_access_code('lifetime', 1, 1, 'App Review')`), redeem it once in the app, and put the login
in both stores' review notes. This is why section 1 must run before you set up the reviewer account —
without it the redemption fails.

## Not built on purpose

- **Discount codes** (a percentage off a real purchase) return `discount_pending` — they need the IAP
  checkout, which is a separate launch item. Grant codes (free access) are what the functions above mint.
- **The full institutional layer** (org dashboards, seat management, SSO) is postponed; the `max_uses`
  bulk code is the interim.
