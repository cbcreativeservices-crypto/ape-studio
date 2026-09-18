# Bug hunt — PASS 1: entitlement, membership, purchases, access codes

ccode, 2026-09-17. Branch `audio-tools-engine`. Read-only pass: no DB touched, no
build/submit/update run, nothing committed.

## What I examined

Client: `src/features/commercial/*` (EntitlementProvider, entitlementExpiry,
accessCode, studyGate, memberStanding, realAccount, purchase, iapProducts,
MembershipGate, StudyAccessSheet), `src/features/lab/withMembershipPreview.tsx`,
`labPreviewStore.ts`, `LabPreviewOverlay.tsx`, `src/screens/lab/labMembership.ts`,
`labCatalog.ts`, `EarLabScreen.tsx`, `LabCategoryScreen.tsx`,
`src/navigation/RootNavigator.tsx` (screen registry), `linking.ts`,
`linkPaths.ts`, `pendingLink.ts`, `src/screens/commercial/PaywallScreen.tsx`,
`src/screens/auth/AuthScreen.tsx`, `src/screens/settings/SettingsScreen.tsx`,
`src/features/finalExam/api.ts`, `src/config/devMode.ts`, `src/config/flags.ts`,
plus every `useEntitlement()` consumer (34 call sites) and every `devBypass(...)`
call site.

Server (read-only): `supabase/functions/validate-purchase/index.ts`,
`supabase/functions/store-notifications/index.ts`,
`supabase/functions/admin-codes/index.ts`,
`supabase/migrations/2026091801_paid_month_before_credential.sql`,
`docs/APE_ACCESS_CODES_2026_08_21.sql`, `docs/APE_OWNER_SQL_2026_09_07.sql`.

Verification run: `npx tsc --noEmit` — clean. `npm test` — 0 fail, 0 cancelled.

## What I could NOT check

- **The live database.** I did not query Supabase. So I cannot confirm which
  version of `redeem_access_code` is deployed (the `FOR UPDATE` hardening is
  claimed in a comment but there is no migration for it in the repo), nor the
  body of `has_academy_access`, `start_final_exam` or `submit_final_exam` — none
  of those exist in this repo. Findings that depend on them are marked.
- **`has_academy_access`.** It decides server-side access. I could not read it,
  so I cannot confirm it checks `status`/`refunded_at` and not just `expires_at`.
  **Please verify** that a row with `status='refunded'` is refused by it —
  `store-notifications` only sets `status`/`refunded_at`, it never touches
  `expires_at`, so a refunded lifetime buyer's row still reads `2099-12-31`.
- **Runtime/device behaviour.** No dev server, no device, no store sandbox. The
  StoreKit/Play delivery timing in Blocker 1 is reasoned from the code paths
  that exist, not observed.
- The brief listed `src/features/lab/labMembership.ts`; it actually lives at
  `src/screens/lab/labMembership.ts`. Same file, checked.

---

## No subscription renewal ever reaches our server

**Severity:** blocker
**Where:** `src/features/commercial/purchase.ts:107-148`, and its only callers
`src/screens/commercial/PaywallScreen.tsx:99` / `:114`

**What happens:** every monthly subscriber loses all paid access roughly 31 days
after they buy, and every annual subscriber loses it after a year — while still
being charged. This **wrongly blocks a paying user**, 100% of them, and it is
also an App Store 3.1.2 / Play policy failure (paid subscription not honoured).

**Why:** `entitlements.expires_at` is written by exactly three things:
`validate-purchase`, `redeem_access_code`, and an admin grant. Nothing else in
the repo extends it. `validate-purchase` is only ever called from
`validateWithServer()` in `purchase.ts`, which runs from (a) the
`purchaseUpdatedListener` and (b) `restorePurchases()`. Both listeners are
installed by `initPurchases()` and torn down by `teardownPurchases()` — and
`initPurchases` is called from exactly one place, `PaywallScreen`'s mount
effect, with teardown on unmount (`PaywallScreen.tsx:99-116`). So the store
listener exists only while the paywall is on screen.

There is no app-boot sync, no foreground sync, and no server-side renewal path:
`store-notifications` deliberately ignores everything that is not a refund
(`supabase/functions/store-notifications/index.ts:264-277` and `:330-335` —
Apple `DID_RENEW` and Google type 2/4 fall through to "not a refund event,
ignored"). So the row written at first purchase is the last word. Once
`expires_at` passes, `academyTierFromRows` classifies the user `lapsed`
(`EntitlementProvider.tsx:127-140`) and the server refuses too. The only way
back is for the user to find Restore Purchases inside the paywall.

**Fix:** validate the store's current entitlement outside the paywall. Smallest
version that closes it: on app foreground and at boot for a signed-in account,
call a new `syncEntitlementFromStore()` that does `getIap()` →
`getAvailablePurchases()` → `validateWithServer()` for any academy SKU, then
`refreshEntitlement()`; make it silent and best-effort (never a dialog, never a
downgrade on failure). Rate-limit it to, say, once per 12 h via AsyncStorage.
The durable version is to also handle Apple `DID_RENEW` / `SUBSCRIPTION_RENEWED`
and Google notification types 2 (RENEWED) and 4 (PURCHASED) in
`store-notifications` and write the new `expires_at` from the verified store
answer — that is the only path that works when the app is not opened at all.

---

## A monthly subscriber can never satisfy the new tenure rule

**Severity:** blocker
**Where:** `supabase/functions/validate-purchase/index.ts:246-249`; the same
logic in `supabase/migrations/2026091801_paid_month_before_credential.sql:188-193`

**What happens:** the direct answer to question 5 — **yes, `member_since` is
wrongly reset on a renewal**, and the consequence is that a paying monthly
subscriber is permanently denied every credential. It wrongly blocks a paying
user, and it is the single most damaging thing the tenure rule can do.

**Why:**

```ts
const lapsed = !!prior?.expires_at && Date.parse(prior.expires_at) < Date.now();
const member_since =
  !prior || !prior.member_since || prior.refunded_at || lapsed ? nowIso : prior.member_since;
```

"Lapsed" is decided from **our stored `expires_at`**, not from the store's view
of the subscription. Because of Blocker 1 that stored value is always the one
written at the last `validate-purchase` call, so it goes into the past on day 31
even though Apple/Google renewed on schedule. The user is then locked out,
eventually opens the paywall and taps Restore, `validate-purchase` runs, sees
`prior.expires_at` in the past, decides they lapsed, and sets
`member_since = now()`. Next month, same thing. `member_since` is never more
than a few days old, so `member_since <= now() - interval '1 month'`
(`2026091801_...sql:89`) is never true for a monthly subscriber. They pay
forever and the Final Exam always answers `paid_tenure_required`
(`src/features/finalExam/api.ts:101`).

Annual and lifetime buyers are unaffected (their `expires_at` stays in the
future long enough). Access-code comps are unaffected. It is specifically the
monthly plan — the cheapest, most common one — that is broken.

**Fix:** two parts. (1) Fix Blocker 1 so `expires_at` is never stale. (2) Do not
infer a lapse from a timestamp that can be stale: give it a grace window, e.g.
`const lapsed = !!prior?.expires_at && Date.parse(prior.expires_at) < Date.now() - LAPSE_GRACE_MS`
with `LAPSE_GRACE_MS` at least 45 days (comfortably longer than one billing
period plus the store's own billing-retry grace), or better, decide it from the
verified store answer — if Apple/Google report a continuous
`originalTransactionId`/purchase token with no gap, it is a renewal, not a
return, and `member_since` must be preserved. Apple's
`signedTransactionInfo.originalPurchaseDate` is exactly the right value to seed
`member_since` from for a subscription; consider using it instead of `now()`.

---

## `proaudio://labs/<category>` opens 28 members-only labs live, unlocked

**Severity:** blocker
**Where:** `src/screens/lab/LabCategoryScreen.tsx:22-86` (no gating anywhere in
the file), reachable via `src/navigation/linking.ts:95` (`LabCategory: 'labs/:id'`)
and `src/navigation/linkPaths.ts:141-144` (the `labs` family is a claimed path)

**What happens:** a free (or guest) account opens
`proaudio://labs/dynamics` — or the equivalent universal link
`https://proaudiotrainingacademy.com/labs/dynamics` — lands on the category
screen with every lab listed and an **OPEN** button, taps it, and gets the paid
lab fully live: audio running, all controls interactive, no scrim, no upgrade
sheet. It also **earns Fundamentals lab completion credit** while doing it
(`src/features/lab/labCompletion.ts:308` only refuses credit when a preview is
armed, and nothing armed one). This costs the owner money directly — it is the
paid product handed over for free, by URL.

**Why:** `LabCategoryScreen` is the one lab list that was never given the
membership rule. `EarLabScreen` has `leafLocked` + `startLabPreview`
(`EarLabScreen.tsx:78-88`); `LabCategoryScreen`'s `open()` is just
`if (leaf.route) go(leaf.route, leaf.params)` (`:39-41`). Nothing in the app
navigates to `LabCategory`, so it has probably never been exercised — but the
linking table publishes it.

The screen-level backstop only half exists. `withMembershipPreview` is applied
to 16 routes in `RootNavigator.tsx:213-229`, and the invariant written above it
scopes itself to routes "that carry a deep-link path". Deriving the member-only
set from the catalog the same way `computeLabRouteMembership` does gives **44
members-only routes, of which 28 are not wrapped**:

```
FoundationsPlayground, MeterLab, SignalChainLab, MeterModule, CableLab,
ConnectorSelectLab, PatchbayLab, GainLabHome, BeginningMixingLab,
AdvancedMixingLab, EqLabHome, GateLab, LimiterLab, SmartProcessorsLab,
ChorusLab, FlangerLab, PhaserLab, FmLab, ModularLab, EnvelopeLab, StereoLab,
BinauralLab, AutotuneLab, TuningLab, BassLab, MicSelectLab, AmpLab,
EarTrainingLab
```

Every one of those is registered ungated in `RootNavigator` (they use `Gated.*`,
which is `withAmplitudeOrientation`, not a membership gate — see
`RootNavigator.tsx:151`). The 16 that are wrapped (CompressionLab, EqLab,
ReverbLab, …) do hold, because `withMembershipPreview` catches them at the
screen. So the exposure is precisely the 28 above.

**Fix:** two changes, both small.

1. `LabCategoryScreen` must use the same rule as the Ear Lab. Import
   `isMemberOnlyLabRoute` (or take the `leafLocked` shape from
   `EarLabScreen.tsx:78`), pass `locked` into `LabRow`, and in `open()` call
   `startLabPreview(leaf.route, leaf.name)` before `go(...)` when it is locked.
2. Drop the "carries a deep-link path" qualifier and wrap **every** lab screen
   in `withMembershipPreview`. It no-ops for a route the catalog says is free,
   so wrapping is free of risk; leaving a route out is the only failure mode.
   Add a test that asserts every route with `memberOnly: true` in
   `computeLabRouteMembership(LAB_CATEGORIES)` appears in `MemberGated` — the
   existing `test/labMembershipGate.test.ts` proves the rule but never proves it
   is applied.

---

## One store receipt can entitle unlimited accounts

**Severity:** blocker
**Where:** `supabase/functions/validate-purchase/index.ts:196-215`

**What happens:** user A buys Lifetime Academy for $99.99. Their transaction id
(or Google purchase token) is a plain string. Anyone who has it can sign in to
their own account and POST it to `validate-purchase`; it verifies against Apple,
returns valid, and a second `entitlements` row is written for the second user.
Repeat indefinitely. This costs the owner money and is trivially scriptable —
receipt-sharing services exist precisely for this.

**Why:** the function authenticates the *caller* (`:186-188`) and verifies the
*receipt* (`:205-209`), but never checks that the two belong together. Apple's
`/inApps/v1/transactions/{id}` lookup is app-scoped, not account-scoped, so it
happily confirms someone else's transaction. There is no `appAccountToken`
comparison and no uniqueness check on `store_ref` — the write is keyed on
`(user_id, product)` only (`:222-228`), so a duplicate lands as a new row for
the new user rather than being rejected.

**Fix:** bind the purchase to the account and refuse re-use.

1. Pass an `appAccountToken` (iOS) / `obfuscatedAccountId` (Android) equal to a
   stable hash of the user id at `requestPurchase` time in
   `purchase.ts:188-196`, and in `validate-purchase` refuse when the verified
   transaction's `appAccountToken` does not match the caller.
2. Independently, before writing: `select user_id from entitlements where
   store_ref = <ref>` and if it exists for a *different* user, return
   `{ ok: false, error: 'receipt_in_use' }`. That alone stops the bulk of it and
   needs no client change. Add a partial unique index on `store_ref` for the
   store sources so the database enforces it too.

---

## Cymatics studios and Production stages bypass the gate entirely

**Severity:** serious
**Where:** `src/navigation/linking.ts:83-93`; `src/navigation/RootNavigator.tsx:435-441`

**What happens:** `CymaticsLab` is correctly members-only and gated. But its
children each have their own published deep link and none is gated:
`labs/cymatics/plate`, `labs/cymatics/liquid`, `labs/cymatics/membrane`,
`labs/cymatics/gallery`, `labs/cymatics/module/:id`,
`labs/production/:lab/:projectId/:stageId`, `labs/production/:lab/exercise/…`.
A non-member deep-linking to `proaudio://labs/cymatics/plate` gets the Chladni
Plate Studio live. Costs the owner money — and the Production labs are the
flagship the whole launch hangs on.

**Why:** these routes do not appear in `labCatalog` at all, so
`isMemberOnlyLabRoute()` returns its default `false`
(`labCatalog.ts:534-536`) — wrapping them in `withMembershipPreview` today would
still no-op. The rule is derived from catalog *leaves*, and a lab's internal
sub-screens are not leaves. In-app this is invisible because the parent's scrim
blocks the taps that would reach them; only the link bypasses the parent.

**Fix:** give the route→membership map a notion of a sub-route. Simplest: add an
explicit `MEMBER_ONLY_SUBROUTES` list in `labCatalog.ts` (the cymatics
studios/gallery/module, `ProductionStage`, `ProductionActivity`, `ProductionLab`,
`DigitalModule`) that `isMemberOnlyLabRoute` ORs in, then wrap those screens in
`withMembershipPreview` in `RootNavigator`. Guard it with a test that every
route named in `linking.ts` under a members-only lab's path prefix is reported
members-only.

---

## Refunds are matched by `store_ref`, and `store_ref` drifts

**Severity:** serious
**Where:** `supabase/functions/store-notifications/index.ts:218-238` and
`:294-306`, `:330-341`; `validate-purchase/index.ts:220`;
`2026091801_paid_month_before_credential.sql:182`

**What happens:** refunds are missed — the user keeps Academy access (and their
tenure toward a credential) after the money went back. Costs the owner money,
and defeats the stated purpose of the whole tenure migration.

**Why:** `markRefunded` finds rows with `.in('store_ref', refs)`. `store_ref` is
not stable:

- `validate-purchase:220` writes `body.transactionId || body.purchaseToken || sku`
  — **transaction id wins even on Android**, where expo-iap supplies both.
  Google's `SUBSCRIPTION_REVOKED` path then searches only `[sub.purchaseToken]`
  (`store-notifications:339`) — no `orderId` — so it matches nothing.
- `redeem_access_code` overwrites `store_ref` with the **access code**
  (migration `:182`). A paying subscriber who redeems any promo code loses the
  link to their store transaction, and their later refund cannot be found. It
  also flips `source` to `'access_code'`, which quietly corrupts revenue
  attribution.
- Apple: `store_ref` is whatever transaction id was last validated. Because of
  Blocker 1 users will be restoring monthly, so `store_ref` becomes a *renewal*
  transaction id, which is neither the refunded transaction's id nor the
  `originalTransactionId` the handler also tries (`:297`). Miss.

**Fix:** stop keying refunds on a mutable field. Add
`entitlements.store_original_ref` (Apple `originalTransactionId`, Google
purchase token), written once on first activation and never overwritten — by
`validate-purchase` or by `redeem_access_code`. Match refunds on that. In the
meantime, two one-line mitigations: include `sub.orderId`/`voided.orderId` in
the Google `refs` for the revocation path, and change `redeem_access_code` to
leave `source`/`store_ref` alone when the existing row's source is `app_store`
or `play_store`.

---

## One forged notification can revoke every holder of an access code

**Severity:** serious
**Where:** `supabase/functions/store-notifications/index.ts:218-238` and
`:320-328`

**What happens:** every member who redeemed the same access code shares one
`store_ref` (the code string — `redeem_access_code` writes `store_ref = v_code`).
`markRefunded` updates **every row with that `store_ref`, for every user, with
no `user_id` or `product` scoping**. On the Google voided-purchase path it does
so **without any verification at all** — `googleTruth` is called but its answer
is only logged (`:326-327`; the comment says this is deliberate). So a single
POST with `voidedPurchaseNotification.purchaseToken` set to a publicly-printed
code like `PA-XXXX-XXXX` marks every influencer/convention comp as refunded:
access revoked, `member_since` cleared, tenure destroyed. This wrongly blocks
users the owner deliberately comped, and it is not recoverable by waiting.

The endpoint is protected only by `STORE_NOTIFY_SLUG` in the path (`:365`) —
noise reduction, as its own comment says, not authentication. Access codes are
printed on cards and handed out at booths, so the "secret" half of this pair is
public by design.

**Fix:** three changes, all small.

1. Never let a store notification touch an access-code row: add
   `.in('source', ['app_store','play_store'])` to both `markRefunded` and
   `markReinstated`, plus `.eq('product','academy')`.
2. Do not write on the Google voided path without a verified answer, or at
   minimum require that the matched rows' `source` is `play_store` (covered by
   1) and that exactly one row matched.
3. Verify Apple's JWS signature chain / Google's Pub/Sub OIDC token in addition
   to the current re-check. The "treat everything as a rumour" design is sound
   *provided* the rumour cannot itself cause a write — right now, on one path,
   it can.

---

## Google verification on the voided path is called with the wrong argument

**Severity:** serious
**Where:** `supabase/functions/store-notifications/index.ts:322`

**What happens:** `googleTruth(voided.purchaseToken, decoded.packageName ?? '', 'subs')`
passes the **package name** where the function expects the **SKU**. The URL it
builds is
`…/applications/{pkg}/purchases/subscriptions/{packageName}/tokens/{token}`,
which will always 404, so `truth` is always `null` and the response always
reports `verified: "token no longer resolvable"`. The refund still lands (by
design on this path), but the owner's only signal that a voided-purchase refund
was genuine is permanently wrong. That makes a real problem indistinguishable
from normal operation in the logs.

**Why:** `googleTruth`'s second parameter is `sku` (`:177-189`); the Google
voided-purchase RTDN does not carry the SKU at all, only `purchaseToken` and
`orderId`.

**Fix:** look up the entitlement row by `store_ref` first, read the product/SKU
from it (store the SKU at purchase time — it is currently discarded), and pass
that. If the SKU genuinely cannot be recovered, drop the call rather than making
one that cannot succeed, and say so in the response note.

---

## A subscription that expires mid-session keeps paid access until relaunch

**Severity:** minor
**Where:** `src/features/commercial/EntitlementProvider.tsx:233-361`

**What happens:** the direct answer to question 3 — **nothing happens**. The
moment of expiry is not observed. The client reads the tier on
`INITIAL_SESSION` / `SIGNED_IN` / `SIGNED_OUT` and on an explicit
`refreshEntitlement()` (code redemption, purchase, restore) and never again.
`TOKEN_REFRESHED` is deliberately ignored (`:329`), there is no timer, and there
is no AppState foreground hook. A phone that is never cold-started keeps a
member's `academy` tier for as long as the process lives. This is a fail-open
that costs the owner a little money, but it is bounded by process lifetime and
the server still refuses the things the server owns (quiz/exam RPCs, glossary
metering), so what leaks is client-rendered content only.

On relaunch the demotion **is** correct and complete: `academyTierFromRows`
reports `lapsed`, `capsFor('lapsed')` re-locks common mistakes, audio tools and
all topics, and every screen gate reads `isMember`/`caps` from the one provider,
so there is no screen left showing paid state. I checked all 34
`useEntitlement()` consumers for this and found no screen that caches a tier of
its own.

**Fix:** add an AppState `active` listener in the provider that calls
`refreshEntitlement()` when the app has been backgrounded for more than a few
minutes. It can only raise or correctly lower the tier, and it pairs naturally
with the store sync in Blocker 1.

---

## `redeem_access_code` burns a use and rewrites the row even when it grants nothing

**Severity:** minor
**Where:** `supabase/migrations/2026091801_paid_month_before_credential.sql:172-203`

**What happens:** the "a code that grants LESS than the user already has" case.
Access itself is safe — `expires_at = greatest(v_existing.expires_at, v_expires)`
(`:183`) never shortens, and the 2099 lifetime sentinel always wins. But the
redemption still: increments `used_count` (`:203`), so a 50-seat influencer code
is consumed by someone who gained nothing; overwrites `source` and `store_ref`
(see the refund finding above); and returns `'granted'` with an `expires_at` of
the *new, shorter* grant (`:205`) while the row actually kept the longer one, so
the client's `RedeemResult.expiresAt` is a lie.

**Fix:** before the grant, compare `v_expires` against `v_existing.expires_at`;
when the existing access is already longer, return
`jsonb_build_object('status','already_active','tier',c.grant_product)` without
writing the row or incrementing `used_count`. If the owner prefers the code to
be consumed either way, at least return the row's real resulting `expires_at`.

---

## "Code applied" is shown even when the refresh failed

**Severity:** minor
**Where:** `src/screens/settings/SettingsScreen.tsx:106-110`

**What happens:** `if (res.ok) await refreshEntitlement();` discards the boolean.
`refreshEntitlement` returns `false` when the read failed and the tier was kept
(`EntitlementProvider.tsx:386-397`), so the user is told "Code applied" and then
watches the app stay locked. The grant is real server-side and the next launch
picks it up, so nobody loses access permanently — but the immediate experience
contradicts the message, which is the same dishonesty the paywall's restore path
was rewritten to avoid.

**Fix:** mirror the paywall (`PaywallScreen.tsx:156-176`): keep the result and,
when it is `false`, say the code was applied but this device could not refresh
yet, with a Retry.

---

## Every RPC failure reads as "redemption isn't available yet"

**Severity:** minor
**Where:** `src/features/commercial/accessCode.ts:84-88`

**What happens:** any `error` from the RPC maps to `'unavailable'`, whose copy is
*"Code redemption isn't available yet. Your account is set up — try the code
again later."* That was right while the migration was unrun. It is now wrong:
the tables are live, so this string now fires for real failures — a constraint
violation, the unique `(code, user_id)` race, a connectivity blip — and tells an
influencer standing at a booth to come back later, forever.

**Fix:** distinguish the one case the copy describes. Keep `'unavailable'` only
for `error.code === 'PGRST202'` (function missing); map everything else to
`'error'`, which already has honest copy ("Couldn't redeem the code right now.
Please try again.").

---

## `admin_mint_access_code` in docs still mints 30-day month codes

**Severity:** minor
**Where:** `docs/APE_OWNER_SQL_2026_09_07.sql:60`

**What happens:** `v_days := case lower(p_plan) when 'month' then 30 …`.
Production was changed to 35 days (`docs/CROSS_SESSION_HANDOFF.md:59-60`, and
`2026091801_…sql:65-70` depends on it), but this file was not updated. Anyone
re-running this SQL — a plausible thing to do when minting codes for launch —
silently reverts the month tier to 30 days, at which point every month-code
holder is mathematically unable to earn a credential (in a 31-day month,
`now() - interval '1 month'` is 31 days ago and the code has already expired).
It would wrongly block exactly the comped users the owner most wants to succeed.

**Fix:** change `then 30` to `then 35` in that file and add the same note the
migration carries about why.

---

## `leafLocked` ignores `alwaysFree`, unlike the route rule

**Severity:** polish
**Where:** `src/screens/lab/EarLabScreen.tsx:78-79` vs
`src/screens/lab/labMembership.ts:46`

**What happens:** nothing today. `leafLocked` is
`(sec === 'training' || !!leaf.member) && !isMember` with no `alwaysFree` check,
while `computeLabRouteMembership` has `&& !cat.alwaysFree`. The only `alwaysFree`
category is the Calculator Laboratory, which is a hub with no `extraLabs`, and
the hub row takes the separate `secLocked && !cat.alwaysFree` path (`:143`), so
the divergence is unreachable. The moment anyone adds an `extraLabs` row under
the Calculator Lab, the list will lock it while the route gate reports it free —
the exact class of disagreement `labMembership.ts` exists to prevent.

**Fix:** add `&& !cat.alwaysFree` to `leafLocked`, which means threading the
category (it is already in scope at the call site, `:159`).

---

## `ProductionLab`'s own wrapper is a no-op

**Severity:** polish
**Where:** `src/navigation/RootNavigator.tsx:434`

**What happens:** `<Stack.Screen name="ProductionLab" component={MemberGated.ProductionLab} />`
looks gated but is not: `withMembershipPreview` reads `route.name`, and
`'ProductionLab'` does not appear in `labCatalog` (only `'PreProdLab'` and
`'PostProdLab'` do), so `isMemberOnlyLabRoute('ProductionLab')` is `false` and
the wrapper passes through. Nothing navigates to the bare `ProductionLab` route
today and it has no deep-link path, so it is currently unreachable — but the
code reads as protected when it is not.

**Fix:** covered by the sub-route list proposed in the Cymatics/Production
finding; add `'ProductionLab'` to it.

---

## Checked and found nothing

These were examined specifically and are correct as written:

- **The deliberate fail-open on an unreadable `expires_at`**
  (`EntitlementProvider.tsx:107-141`, `entitlementExpiry.ts:34-53`). The
  reasoning still holds and it is bounded: it only applies to a row whose
  `status` is already `'active'`, it is client-side only (server RPCs re-check),
  the anomaly is logged as a count with no PII, and `expires_at` is
  `timestamptz NOT NULL` so PostgREST cannot emit an unparseable value short of
  schema drift. A refunded row is `status='refunded'` and is skipped before the
  expiry question is even asked. No change needed.
- **The `resolved` / `tierKnown` split and the bounded boot retry**
  (`:194-297`). The retry can only raise a tier, generations cancel stale reads
  across auth events, `resolved` flips in `.finally()` so no screen hangs, and
  `tierKnown` correctly keeps `memberStanding` at `'unknown'` after a failed
  read so a member's notifications are not swept.
- **`realAccount.isRealAccount`** is used consistently — the anonymous glossary
  device session cannot redeem a code (`accessCode.ts:79-80`) or be read as a
  tier (`EntitlementProvider.tsx:317`, `:378`).
- **`studyGate.ts`** — `studyMethodLocked` reads the displayed topic and
  `customListLocked` the committed one, both correct per the comment, and both
  fail closed on a null `gs`.
- **`withMembershipPreview` itself** — the cold-boot `GateHold` genuinely
  prevents the paid lab mounting before the scrim, and it clears a stale preview
  when entitlement upgrades mid-lab. The problem is coverage, not this file.
- **`PaywallScreen`** — `onContinue` fails safe on `!resolved` (`:125-128`),
  restore reports three honest states, and a failed `refreshEntitlement` after a
  charge offers a retry instead of a spinner.
- **`validate-purchase` fail-safe behaviour** — a missing secret, a failed
  verification, a bundle/SKU mismatch, a revoked transaction or a failed
  entitlement write all return `ok:false` and grant nothing (`:54`, `:90`,
  `:107`, `:209`, `:268-271`), and the client does not `finishTransaction` on
  failure. Expiry is never shortened (`:230-235`).
- **`supabase/functions/admin-codes/index.ts`** — five independent factors
  (bearer token validated server-side, AAL2 required, email allowlist,
  constant-time passphrase, optional IP allowlist), all fail-safe on an unset
  secret. Nothing to report.
- **`linkPaths.ts`** — authority parsing rejects userinfo, backslashes, encoded
  separators, traversal and foreign schemes; `pendingLink` stores only a
  validated path, in memory, single-use. The lab exposure above is a gating gap,
  not a link-parsing one.
- **Double redemption of an access code by the same user** — the
  `unique (code, user_id)` constraint on `access_code_redemptions`
  (`docs/APE_ACCESS_CODES_2026_08_21.sql:64`) plus the idempotent
  `already_active` early return make it safe.
- **Two users redeeming one code concurrently** — the `select … for update` on
  the code row (`2026091801_…sql:138`) serialises the `max_uses` check and the
  increment. ⚠️ Caveat: that hardening exists in this migration file and in a
  code comment dated 2026-09-11, but there is **no migration in the repo that
  applied it**, and `docs/APE_ACCESS_CODES_2026_08_21.sql:99` — the version that
  was actually run — has no `FOR UPDATE`. Please confirm against the live
  function body before treating this as closed.
- **The 2099 lifetime sentinel against the tenure predicate** — correct.
  `expires_at > now()` (`2026091801_…sql:86`) passes for 2099, `lapsed` is false
  for a lifetime row in `validate-purchase:247`, and `classifyExpiry` reads it as
  `'current'`. A lifetime buyer becomes eligible one month after purchase, as
  intended.
- **The tenure predicate's shape** — `status='active'`, `refunded_at is null`,
  `expires_at` in the future, `member_since` non-null and at least a month old,
  joined through `users.auth_id`. That is the owner's rule stated correctly. Its
  problem is the data feeding `member_since`, not the SQL.

---

## DEV BYPASSES — full inventory (pre-launch checklist item)

`src/config/devMode.ts:14-58`. Every flag is read through
`devBypass(flag) = __DEV__ && DEV_BYPASS[flag]` (`:68-69`), so **all of them are
inert in a release build regardless of their value**. I verified there is no
other read path: `DEV_BYPASS` is never destructured or indexed directly anywhere
outside `devMode.ts`, and `DEV_BYPASS_ACTIVE` (the only other export) has zero
consumers.

| Flag | Value | Consumers | Would it leak paid content in production? |
|---|---|---|---|
| `bypassQuizLocks` | **false** | `DashboardScreen.tsx:1376` | No. Off, and the server re-checks in `start_quiz_attempt` regardless. |
| `bypassMethodLocks` | **false** | `DashboardScreen.tsx:1254`, `:1795` | No. Off. |
| `bypassAcademyLocks` | **false** | `EntitlementProvider.tsx:451` | **This is the one that would.** It forces `caps` to full academy. It is OFF, and `__DEV__`-guarded. Leave it off. |
| `alwaysShowIntros` | **false** | `ScreenIntroOverlay.tsx:49,79`, `coachMark.ts:64,91`, `FlashcardsScreen.tsx:616,634,646,904,1156` | No — cosmetic only. |
| `instantIntros` | **true** | `AppWelcomeOverlay.tsx:32`, `ScreenIntroOverlay.tsx:102` | No. Zeroes the intro dwell timers. `__DEV__`-only, so the governed 9 s/8 s holds ship intact. No gate, no paid content. |
| `webPreviewAutoGuest` | **true** | `AuthScreen.tsx:194` | No. Doubly guarded — `__DEV__` **and** `Platform.OS === 'web'`. The shipped app has no web target (`linking.ts:41` disables linking on web; the public web app is the Next.js site). It enters *Guest* mode, the lowest tier, so even if it did fire it would grant nothing. |

Two flags are ON. Neither grants access, and both are unreachable in a release
build. **No dev bypass leaks paid content or skips a gate in production.** The
only flag that could is `bypassAcademyLocks`, and it is off.

One related item that is *not* a bypass but belongs on the same checklist:
`FLAG_DEFAULTS.commercialMode` is `true` (`src/config/flags.ts:12`) and
`setCommercialMode` no-ops outside `__DEV__` (`EntitlementProvider.tsx:401`).
The persisted override key `DEV_COMMERCIAL_FLAG_KEY` is written but **never read
back**, so every launch starts with commercial mode on. That is fail-closed and
correct; note only that the dev logo long-press therefore does not survive a
reload.

The dev entitlement override `DEV_ENTITLEMENT_KEY` *is* hydrated from storage
(`EntitlementProvider.tsx:211-220` and `:344-351`), but both paths are
`__DEV__ && Platform.OS === 'web'`, and `setEntitlement` itself no-ops outside
`__DEV__` (`:434`), so `devOverrode` can never be latched in a release build.
Checked and clean.

---

## Suggested order of work

1. Blocker 1 (renewal sync) and Blocker 2 (tenure reset) are one piece of work —
   Blocker 2 cannot be fixed correctly without Blocker 1. Do them together.
2. Blocker 3 (LabCategoryScreen + wrap every member-only route) is the smallest
   fix on this list and closes the widest hole. An hour, with a test.
3. Blocker 4 (receipt binding). The `store_ref`-in-use check alone is a few
   lines server-side and needs no app release.
4. The serious server findings (5–8) can ship as edge-function deploys without
   touching the app.
