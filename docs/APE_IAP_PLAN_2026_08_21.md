# APE In-App Purchases — build + owner setup (2026-08-21)

The last blocker for PAID commercial launch. Architecture (matches the existing
frozen backend, which already models `entitlements.source`/`store_ref` and a
`products` table): **direct store purchase → server receipt verification → write
entitlements**. No RevenueCat.

## What's BUILT (client, this commit — typecheck clean)
- `expo-iap` 5.3.2 added (+ its config plugin in app.json). **Needs a new dev/
  production build to bundle the native module.**
- `src/features/commercial/iapProducts.ts` — plan→SKU map (SKUs below).
- `src/features/commercial/purchase.ts` — init/connect, product fetch, buy,
  purchase listeners → server-validate → finishTransaction → refreshEntitlement,
  and Restore. FAILS SAFE: no native module / un-deployed verifier → nothing is
  granted; the UI explains.
- `src/screens/commercial/PaywallScreen.tsx` — CONTINUE now starts the purchase;
  Restore Purchases added; grants only after server verification.
- `supabase/functions/validate-purchase/index.ts` — the server verifier (Apple
  App Store Server API + Google Play Developer API) → upserts `entitlements`.
  Never trusts the client; fails safe.

## OWNER — required to make it work (in order)

### 1. Create the store products (IDs MUST match iapProducts.ts exactly)
| Plan | Type | Store product ID | Price |
|---|---|---|---|
| Monthly | Auto-renewing subscription | `academy_monthly` | $9.99 |
| Annual | Auto-renewing subscription | `academy_annual` | $59.99 |
| Lifetime | Non-consumable | `academy_lifetime` | $99.99 |

- **App Store Connect:** create a subscription group with monthly + annual, and a
  non-consumable for lifetime.
- **Google Play Console:** two subscriptions + one in-app product with the same IDs.
- (If you'd rather use different IDs, change the `sku` values in
  `src/features/commercial/iapProducts.ts` to match.)

### 2. Set the edge-function secrets (`supabase secrets set …`)
Apple (App Store Connect → Users and Access → Integrations → App Store Server API key):
- `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (the .p8 file contents),
  `APPLE_BUNDLE_ID`, `APPLE_ENV` = `sandbox` first, then `production`.

Google (a service account with Play Developer API access, granted in Play Console):
- `GOOGLE_SERVICE_ACCOUNT` (the service-account JSON), `ANDROID_PACKAGE_NAME`.

(`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` are provided
to edge functions automatically.)

### 3. Deploy the edge function
```
supabase functions deploy validate-purchase
```

### 4. Build + test in SANDBOX
- New dev/preview build (bundles expo-iap). Test with a StoreKit sandbox tester
  (iOS) and a Play license tester (Android): buy each plan → confirm the
  `entitlements` row is written and the app flips to Academy; test Restore.
- Verify a CANCELLED purchase grants nothing, and an un-verified receipt is
  refused (fail-safe).

## Notes / caveats
- The verifier is complete but has NOT been run against real store receipts (only
  the owner has sandbox accounts + secrets). **Treat step 4 as real testing, not a
  formality** — receipt APIs have platform quirks. Ping me with any sandbox error.
- Subscription renewals/expiry: the entitlement's `expires_at` is set from the
  store's reported expiry. A background renewal/cancel is NOT yet reconciled
  (no Apple/Google server-to-server notification handler) — a lapsed sub will
  read academy until `expires_at`, then the client derives `lapsed`. A future
  ASSN/RTDN webhook can tighten this; fine for launch.
- Comp/access codes remain the other grant path (unchanged).
