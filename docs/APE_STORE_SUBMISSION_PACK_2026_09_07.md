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

Display names the store shows (owner copy, ratify): "Academy Monthly", "Academy Annual", "Academy Lifetime".
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

"Data used to track you": none. Privacy policy URL: required — see run-list item 7.

### Google Play Data safety

- Collects user data: yes. Shares user data: no.
- Encrypted in transit: yes (HTTPS to Supabase). Deletion request: answer yes only if an
  account-deletion path exists in the app or on the website — **owner: confirm one exists**. Apple also
  requires in-app account deletion for apps with account creation.
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

## 5. Screenshot shot list (run-list item 5)

Shoot on device in dark mode with a clean status bar (full battery, no notifications). Apple sizes: the
iPhone 6.9" set (1320×2868, iPhone 16 Pro Max or 15 Pro Max) covers the smaller sets if those are left
empty. Keep iPad unchecked as a supported device. Google: phone 1080×1920 minimum, 2 to 8 shots, plus a
1024×500 feature graphic.

| # | Screen | Set up | Caption (30 chars or fewer, ratify) |
|---|---|---|---|
| 1 | Home carousel with the course cards loaded | member account, cards warmed | Learn pro audio for real |
| 2 | Dashboard, a topic mid-progress, jog knob visible | any topic at 2 of 4 methods | Four ways to study every topic |
| 3 | SPL Meter Home (VU) reading a real level | play music in the room | Real meters, honest numbers |
| 4 | RTA or Spectrogram live | same source | See the sound |
| 5 | Tuner FULL SCREEN, a string just locked green | guitar, low E in tune | Stage tuner, 25 instruments |
| 6 | A lab mid-interaction (Harmonograph or Mic Principles capsule) | member | Labs that behave like the gear |
| 7 | Glossary term page | for example Phantom Power | 26,000+ terms explained |
| 8 | Awards or certificate wall with one credential | reviewer or test account | Earn certificates that verify |

Feature graphic (Google): the SPL VU face or the tuner full screen on the dark rack background with the
full name "Pro Audio Training Academy". No walls of text, no device frames required.

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

## Open questions for the owner

1. Account deletion: is there an in-app or website path? Apple requires it for apps with sign-up.
2. Privacy policy and terms URLs (run-list item 7). Both consoles block submission without them.
3. Ratify the product display names, descriptions and screenshot captions above.
