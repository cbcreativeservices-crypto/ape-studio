# Store submission pack — 2026-09-07

Everything the two consoles and the purchase path need, drafted from the code so the owner enters rather
than researches. Companion to `docs/APE_LAUNCH_RUNLIST_2026_09_07.md` (items 1, 2, 5, 6, 8).
Nothing here starts a build or a submission — BUILD RULE applies.

## 1. In-app products — create VERBATIM in both consoles (run-list item 1)

The app and the edge function only recognise these three IDs (`src/features/commercial/iapProducts.ts`,
`supabase/functions/validate-purchase/index.ts`). A typo in a console = "unknown_product" and no access.

| Product ID | Type | Price (USD) | Apple: where | Google: where |
|---|---|---|---|---|
| `academy_monthly` | Auto-renewing subscription, 1 month | 9.99 | Subscriptions → one group "Academy" → this product | Monetize → Subscriptions → product `academy_monthly` → one base plan, monthly, auto-renewing |
| `academy_annual` | Auto-renewing subscription, 1 year | 59.99 | Same group "Academy" (so upgrades and downgrades work) | Subscriptions → product `academy_annual` → base plan yearly |
| `academy_lifetime` | Non-consumable (Apple) / one-time product (Google) | 99.99 | In-App Purchases → Non-Consumable | Monetize → In-app products → `academy_lifetime` |

Display names the store shows — the paywall's own names (`src/screens/commercial/PaywallScreen.tsx`):
"Monthly", "Annual", "Lifetime Academy".
Both consoles need a localized description; suggested: "Full access to every course, lab, tool and
certificate in the Pro Audio Training Academy."

Apple also needs, before subscriptions can be sold: the Paid Apps agreement signed, tax and banking done,
and the subscription group's localization. Google needs the merchant account linked.

## 2. Purchase path — what is NOT live yet (run-list item 2)

**Finding 2026-09-07: the `validate-purchase` edge function exists only in the repo. It is NOT deployed**
(deployed functions today: `tube-image`, `on-weekly-concept`). Without it every purchase is refused with
"We couldn't verify that purchase" and nothing is granted — fail-safe, but no revenue.

Owner steps, in order, from `C:\Users\profe\dev\ape-studio`:

1. Set the secrets. Values come from App Store Connect → Users and Access → Integrations → In-App
   Purchase keys, and Play Console → Setup → API access → service account.

   ```bash
   npx supabase secrets set APPLE_ISSUER_ID=... APPLE_KEY_ID=... APPLE_BUNDLE_ID=com.cbcreativeservices.apestudio APPLE_ENV=production --project-ref yjgolswjggmlpeowvtxr
   ```

   ```bash
   npx supabase secrets set APPLE_PRIVATE_KEY="$(cat path/to/SubscriptionKey_XXXX.p8)" --project-ref yjgolswjggmlpeowvtxr
   ```

   ```bash
   npx supabase secrets set ANDROID_PACKAGE_NAME=com.cbcreativeservices.apestudio GOOGLE_SERVICE_ACCOUNT="$(cat path/to/service-account.json)" --project-ref yjgolswjggmlpeowvtxr
   ```

   The Google service account must be granted "View financial data" and "Manage orders and
   subscriptions" on the app in Play Console, with the Play Developer API enabled on its Google Cloud
   project.

2. Deploy:

   ```bash
   npx supabase functions deploy validate-purchase --project-ref yjgolswjggmlpeowvtxr
   ```

3. Patched in the repo today: the function now tries Apple production first and falls back to the
   SANDBOX on a 404. **App Review buys in the sandbox against the production build**; without this
   fallback the reviewer's purchase fails and the app is rejected. It also refuses an Apple subscription
   transaction whose expiry is already in the past.

### Sandbox test script (both phones, after the next build carries expo-iap)

| Step | iPhone | Pixel | Pass when |
|---|---|---|---|
| A | Settings → App Store → Sandbox Account: sign in with a sandbox tester created in App Store Connect → Users and Access → Sandbox | Play Console → Setup → License testing: add the Pixel's Google account; install the build from an internal-testing track (sideloaded APKs cannot purchase) | — |
| B | Open the app, go to Membership → paywall, tap the monthly plan | same | store sheet appears with the sandbox price |
| C | Complete the purchase | same | paywall closes, membership shows ACTIVE, `entitlements` row has `source` appstore or playstore, `store_ref` = transaction id, `expires_at` about 5 min ahead (sandbox monthly renews every 5 min) |
| D | Kill the app, reopen | same | still a member (entitlement refresh) |
| E | Tap Restore Purchases on a second device signed into the same sandbox account | same | member without paying again |
| F | Annual, then lifetime, on a fresh sandbox account each | same | same as C; lifetime `expires_at` = 2099-12-31 |
| G | Let the sandbox subscription lapse (about 30 min for 6 renewals) | same | membership drops to free on the next refresh; no crash |

Log to watch while testing: Supabase → Edge Functions → validate-purchase → logs. A `not_verified`
with correct secrets means the SKU or the environment does not match.

## 3. Privacy answers (run-list item 6) — drafted from the code, owner confirms

What the app actually does, verified in source 2026-09-07:

- Account: email and password via Supabase Auth (`src/features/auth/api.ts`). No name at signup.
- Learning data stored server-side under the account: study, quiz and lab progress, achievements,
  credentials, enrollment, entitlement (purchase) status, notification preferences and concept
  subscriptions.
- Optional Professional Registry listing (opt-in, 18+): display name, first name, bio, specialties,
  region and country, website, phone — only if the user publishes a listing.
- Push token stored only when the user turns notifications on.
- Microphone and camera: processed on the device for the audio tools and the light-pulse counter.
  Audio and images are never uploaded.
- Location: only when the user chooses to tag a MultiMeter measurement snapshot; kept on the device.
- Purchases: receipts verified server-side; the store handles payment; the app stores the transaction id.
- Feedback: the user composes an email in their own mail app; the draft pre-fills platform and version.
- No analytics SDK, no crash reporter, no advertising, no third-party tracking, no data sold.

### Apple App Privacy (nutrition labels)

| Data type | Collected? | Linked to user | Used for tracking | Purpose |
|---|---|---|---|---|
| Contact info → Email address | Yes | Yes | No | App functionality (account) |
| Contact info → Name | Yes, only if the user publishes a registry listing | Yes | No | App functionality |
| Contact info → Phone number | Yes, only registry listing | Yes | No | App functionality |
| User content → Other (bio, specialties) | Yes, only registry listing | Yes | No | App functionality |
| Purchases → Purchase history | Yes | Yes | No | App functionality |
| Identifiers → User ID | Yes | Yes | No | App functionality |
| Usage data → Product interaction (study progress, achievements) | Yes | Yes | No | App functionality |
| Location | **No** (device-only, never sent) | — | — | — |
| Audio data | **No** (device-only) | — | — | — |
| Photos or videos | **No** | — | — | — |
| Diagnostics | No | — | — | — |
| Device ID, advertising data | No | — | — | — |

"Data used to track you": none. Privacy policy URL: `https://www.proaudiotrainingacademy.com/privacy`
(page exists in `web/app/privacy`; terms at `/terms`, support at `/support`). The site's gate must let
these three pages through unauthenticated before submission — run-list item 7.

### Google Play Data safety

- Collects user data: yes. Shares user data: no.
- Encrypted in transit: yes (HTTPS to Supabase). Deletion request: **yes** — the app has an in-app
  DELETE ACCOUNT (Settings, hold five seconds, irreversible; `src/features/settings/DeleteAccountButton.tsx`,
  owner-approved 2026-07-25), which also satisfies Apple's account-deletion requirement.
- Personal info: email (required, account management); name and phone (optional, registry listing).
- Financial info: purchase history (required, app functionality). Payment details stay with Google.
- App activity: in-app actions and other user-generated content (progress, registry bio) — app functionality.
- Location: not collected (device-only). Audio: not collected. Photos: not collected. Device IDs: no.
- App info and performance, crash logs: not collected.
- Security practices: data encrypted in transit; users can request deletion.

### Content rating (IARC questionnaire, both stores)

Education and reference app. No violence, sexuality, profanity, gambling or drugs. No user-to-user
communication inside the app; the registry is a published listing, not messaging, so answer "no
interaction". It does share user-provided info publicly only through the opt-in registry, so answer yes
to "shares personal info with others" only for that feature if the form asks. Expected rating: 4+ and
Everyone.

### Apple export compliance

`ITSAppUsesNonExemptEncryption` is already `false` in `app.json`: HTTPS only, no custom crypto.

## 4. Reviewer demo account (run-list item 6)

App Review must see member-only content without paying. Create a dedicated account on the company domain
(for example `review@proaudiotrainingacademy.com`, never the personal domain), sign in once, redeem the
comp code `TESTCOMP` in Settings → MEMBERSHIP so the entitlement is active, then put the email and
password in App Store Connect → App Review Information → Sign-in required, with the note: "Sign in with
the credentials above; membership is pre-activated. Microphone permission is needed for the audio tools;
a quiet room is enough." Google: Play Console → App content → App access → same.

## 5. Screenshots (run-list item 5)

The capture plan is already ratified in `docs/discoverability/STORE_LISTING_SOURCE_OF_TRUTH.md` §7 —
six shots in this order: Glossary (26,000+ terms), Tools hub with live previews, a lab mid-interaction,
Explore with fields expanded (50 subjects), a study method or the Dashboard rack, a certificate view on a
demo account. Use that list; the captions there carry the verified numbers. Sizes: iPhone 6.9"
(1320×2868) covers the smaller Apple sets; Google phone 1080×1920 minimum plus a 1024×500 feature graphic.
The tuner FULL SCREEN with a string locked green is a strong optional seventh shot.

## 6. Security functions (run-list item 8) — verified in the database 2026-09-07, read-only

| Function | Definer | anon | authenticated | Verdict |
|---|---|---|---|---|
| `award_complete` | yes | no | no | closed (postgres only) |
| `materialize_discrete_slot` | yes | no | no | closed |
| `_labs_recompute_af` | yes | no | no | closed (trigger) |
| `trg_eval_credentials` | yes | no | no | closed (trigger) |
| `award_required_topics` | yes | **yes, via PUBLIC** | yes | read-only STABLE; returns curriculum structure (which topics a certificate needs), no user data, no writes. Low risk; tidy before launch |

The app calls `award_required_topics` from the Awards screen (`src/features/awards/api.ts`), so
`authenticated` must keep EXECUTE. Owner-run SQL (grant explicitly first, then take PUBLIC away — the
same gotcha as F1 on 2026-08-28; re-check afterwards):

```sql
grant execute on function public.award_required_topics(text, uuid) to authenticated, service_role;
revoke execute on function public.award_required_topics(text, uuid) from public, anon;
select has_function_privilege('anon','public.award_required_topics(text, uuid)','EXECUTE') as anon_should_be_false,
       has_function_privilege('authenticated','public.award_required_topics(text, uuid)','EXECUTE') as authenticated_should_be_true;
```

Safe for guests: the app only calls this RPC after resolving a signed-in student id (`internalUserId()`),
so the anon revoke cannot break the guest experience.

## 7. Already done (no action)

- `eas.json`: `appVersionSource: remote` and `autoIncrement: true` on the production profile. Run-list
  item 4 was already in place.
- `SUPPORT_EMAIL` is `info@proaudiotrainingacademy.com`.
- Export-compliance flag set; mic, camera and location usage strings present in `app.json`.

## Answers found in the project (no owner questions)

1. Account deletion: in-app, Settings → DELETE ACCOUNT, hold to confirm (`DeleteAccountButton.tsx`).
2. Privacy and terms: `web/app/privacy` and `web/app/terms` (plus `/support`), i.e.
   `https://www.proaudiotrainingacademy.com/privacy` and `/terms` once the site gate lets them through.
3. Copy: plan names come from the paywall; screenshot captions and the support/privacy URLs come from
   `STORE_LISTING_SOURCE_OF_TRUTH.md`. The only new strings here are the product descriptions in §1.
