# Refund webhook — what is built, and the four steps that need your hand

**ccode · 2026-09-17.** Owner: *"you build the refund webhook."* Built. It is
all in the repo and none of it is deployed, because the production-deploy
permission was declined mid-session. Nothing below is guesswork — every
interface was read off the live database or the live edge functions first.

---

## Why this exists

Your credential rule has two halves:

> One complete month of membership before a credential is granted — and **no
> certificates if they refund and I never get paid anything.**

The first half is a date comparison. The second half is impossible without
this, because **Apple and Google report refunds asynchronously and nothing was
listening.** A refunded member kept `status='active'` until their period simply
ran out, so no predicate anywhere could tell them from a paying one.

---

## What is built

| Piece | File | State |
|---|---|---|
| The webhook | `supabase/functions/store-notifications/index.ts` | **New.** Not deployed. |
| Tenure clock on purchase | `supabase/functions/validate-purchase/index.ts` | **Patched.** Not deployed. |
| Columns + predicate + redeem | `supabase/migrations/2026091801_paid_month_before_credential.sql` | **Not applied.** |
| Month tier = 35 days | — | ✅ **Applied and live.** |
| Client error + copy | `src/features/finalExam/api.ts`, `AwardProgressScreen.tsx` | ✅ **Shipped, on the phones.** |

### The security model, because it is the whole design

The webhook endpoint is **public** — it has to be, Apple and Google post to it
with no credential of ours. So it treats **every request body as a rumour**.

A notification is used only as a trigger — *"something changed for transaction
X"* — and **never** as evidence of what changed. The function then asks Apple or
Google directly, with our own authenticated call, and acts on that answer alone.

A forged notification can therefore do exactly one thing: make us re-check a
transaction against the store and confirm it is fine.

That is deliberately stronger than verifying Apple's JWS certificate chain and
trusting the payload, and it reuses the same server APIs `validate-purchase`
already calls — so there is one way of establishing truth in this codebase
rather than two that can drift apart.

### What it does on each event

| Event | Action |
|---|---|
| Apple `REFUND` / `REVOKE`, confirmed by Apple's API showing a `revocationDate` | `status='refunded'`, `refunded_at=now()`, **`member_since=null`** |
| Apple `REFUND_REVERSED` | access restored, but **the month restarts** — they did not hold an unbroken paid month |
| Google voided purchase | same as a refund |
| Google `SUBSCRIPTION_REVOKED` (type 12), confirmed against the Play API | same as a refund |
| Google `EXPIRED` (type 13) | **nothing.** A normal lapse is not a refund, and tenure is handled by the expiry date already |
| Anything else | ignored, 200 |

Clearing `member_since` is the point: it is what stops a refunded member ever
satisfying `member_month_complete`, and it means coming back later is a **new**
run that starts the month again.

It always returns 200, even on errors. A non-2xx makes the store retry the same
rumour for hours, and we do not act on rumours.

---

## The four steps that need you

### 1 · Apply the tenure migration

```bash
supabase db push
```
or apply `supabase/migrations/2026091801_paid_month_before_credential.sql` from
the dashboard. It adds `entitlements.member_since` and `.refunded_at`, the
`member_month_complete()` predicate, and a `redeem_access_code` that maintains
the clock. Backfills the 3 existing rows from `created_at`.

### 2 · Add the one new secret and deploy both functions

```bash
supabase secrets set STORE_NOTIFY_SLUG=$(openssl rand -hex 24)
supabase functions deploy store-notifications --no-verify-jwt
supabase functions deploy validate-purchase
```

Every other secret it needs is already set for `validate-purchase`.

### 3 · Point the stores at it

The URL is `https://<project>.functions.supabase.co/store-notifications/<SLUG>`.

- **Apple** — App Store Connect → your app → App Information → App Store Server
  Notifications → set **both** the Production and Sandbox URLs, V2.
- **Google** — Play Console → Monetisation setup → Real-time developer
  notifications → create a Pub/Sub topic with a **push** subscription to that
  URL. Also switch on **Voided Purchases** notifications, which is a separate
  toggle and is the one that actually reports refunds.

### 4 · Add the gate to `start_final_exam`

One line, immediately after the existing academy check. **Edit the live body at
that line — do not paste a stored copy over it**, or the D4 activation floor
gets silently dropped:

```
  IF NOT public.has_academy_access(auth.uid()) THEN RAISE EXCEPTION 'academy_required'; END IF;
+ IF NOT public.member_month_complete(auth.uid()) THEN RAISE EXCEPTION 'paid_tenure_required'; END IF;
```

`submit_final_exam` wants the same guard immediately before it writes the
`credential_awards` row — a refund can land between starting an exam and
finishing it, and the start gate cannot see the future.

The client already knows `paid_tenure_required` and has copy for it, live on the
phones now.

---

## How to test it before trusting it

1. Apple sandbox: buy, then use App Store Connect's **Request a Test
   Notification**, and separately refund the sandbox transaction. Watch
   `supabase functions logs store-notifications`.
2. Check the row: `select status, member_since, refunded_at from entitlements`.
3. Confirm a refunded account is refused at the exam with
   `paid_tenure_required`, not with a blank screen.
4. Confirm an **expired** subscription does NOT get `refunded_at` set — a lapse
   is not a refund, and conflating the two would punish people who simply let a
   month run out.

---

## One thing I did not do

`admin-codes`' console page labels plans with `(d===30 ? "month" : d+"d")`, so a
newly minted month code now lists as **"35d"** rather than **"month"**. One
character — `d===35` — but it needs an edge-function redeploy, so it is bundled
into step 2 if you want it.
