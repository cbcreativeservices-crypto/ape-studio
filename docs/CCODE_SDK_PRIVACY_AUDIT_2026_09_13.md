# CCODE → Computer A — Production SDK inventory for the store privacy forms

Answered from the actual repo/build 2026-09-15 (request built 2026-09-13). Read-only audit, no code changed.
Sources: `package.json` (53 runtime deps), `app.json` (plugins + permissions), `src/features/auth/**`,
`src/screens/glossary/GlossaryDictation.tsx`, `src/features/permissions/**`, `src/features/tools/capture/**`,
`src/features/audio/**`, help copy, `measurementStore.ts`.

## Headline
- **No analytics SDK. No crash/diagnostics SDK. No advertising/attribution SDK. No IDFA/GAID, no App Tracking Transparency.** Confirmed absent.
- Off-device network egress is only: **your Supabase backend**, **OS push (APNs/FCM via Expo)**, **App Store/Play Billing**, and — for the glossary dictation feature only — the **OS speech recognizer (Apple/Google)**.
- **Two corrections to the request's assumptions:** payments is **`expo-iap`** (StoreKit/Play Billing direct), **NOT RevenueCat**; and **`expo-location` is NOT installed** (dormant behind an optional-require, `isAvailable()`=false) — no GPS collection in this build.

## Drop-in table (shipping SDKs that touch data/network)

| SDK | Bucket | Data it collects/sends | Linked to user? | Tracking (ads)? | Third party |
|-----|--------|------------------------|-----------------|-----------------|-------------|
| `@supabase/supabase-js` ^2.110 | Auth + backend/data | Email, password (auth); name + last initial, profile photo, country, learning progress/enrollments, purchase entitlement, opt-in community profile | Yes | No | Supabase (your project) |
| `expo-notifications` ~57.0.15 | Push | Expo push token → APNs/FCM | Yes (token stored to account) | No | Expo · Apple APNs · Google FCM |
| `expo-iap` ^5.5.1 | Payments/IAP | Purchase/transaction + receipt validation | Yes (entitlement) | No | Apple App Store · Google Play Billing |
| `expo-speech-recognition` ^56.0.1 | Speech (glossary dictation ONLY) | Microphone audio + transcript, **only while the user holds the mic in glossary search** | No (not tied to account) | No | Apple Speech framework · Android Google speech service (`com.google.android.googlequicksearchbox`) — **audio may leave the device** (see note) |
| `expo-media-library` ~57.0.4 | Photos (write on SAVE) | Writes one image to Photos when user taps SAVE; reads nothing from library | No | No | On-device OS Photos (no third party) |
| `expo-secure-store` · `expo-sqlite` · `@react-native-async-storage/async-storage` | Local storage at rest | Device consent key, saved measurements, offline queues — on device only | On-device only | No | None (local) |
| `ape-dsp` (your native module) | Mic analysis | Mic audio analyzed on-device for level/tuning; **never recorded or uploaded** | No | No | None (on-device) |
| `ape-optical` (native, camera; optional/gated) | Optical Hz counter | Camera image brightness analyzed on-device for the Light-Pulse counter; **not uploaded** | No | No | None (on-device) |

**Explicitly NONE (confirmed absent):** Analytics/product (no Firebase/Amplitude/Segment/PostHog/Mixpanel). Crash/diagnostics (no Sentry/Crashlytics/Bugsnag). Advertising/attribution (no ad SDK, no AppsFlyer/Adjust/Branch, no IDFA/GAID). Social sign-in (no Google/Apple/Facebook auth). Device/advertising identifier collection (`expo-application` reads only the app *version* string, no vendor/device ID).

## The two required confirmations

1. **Auth providers actually live in production:** **email/password only** (Supabase Auth `signInWithPassword`). **Google sign-in NOT shipped. Sign in with Apple NOT enabled** (`ios.usesAppleSignIn` unset; no Apple-auth code). → Apple Guideline **4.8 does NOT apply** (no third-party sign-in present to trigger the Sign-in-with-Apple requirement).

2. **Microphone audio handling:**
   - **Measurement tools / tuner** → analyzed **on-device** by the native `ape-dsp` engine, **never recorded or uploaded** (confirmed in `measurementStore.ts` "no audio uploads" and help copy "analyzed on your phone… not uploaded").
   - **Glossary dictation** → `ExpoSpeechRecognitionModule.start(...)` is called **without `requiresOnDeviceRecognition: true`**, so speech is handed to the **OS recognizer (Apple Speech / Android Google speech service)**, which **may transmit the audio off-device** for recognition. This is via Apple/Google, **not your backend** — but it is the one path where mic audio can leave the device.

## ⚠️ One decision for Computer A before finalizing the forms
The dictation path above conflicts slightly with the `app.json` mic-permission string ("Audio is processed on this device and is not recorded or uploaded") — true for the tools, not strictly guaranteed for dictation. Pick one:
- **(A) Keep the on-device claim true:** set `requiresOnDeviceRecognition: true` in `GlossaryDictation.tsx:73` (a one-line code change, would need a build) — then no mic audio ever leaves the device, and the forms can answer "audio not collected/transmitted."
- **(B) Declare it:** leave dictation as-is and declare "Audio Data" used for **App Functionality**, processed by a third party (Apple/Google speech), **not linked to identity, not for tracking** — Apple label + Google Data Safety "Audio → shared with service provider for functionality."

I recommend **(A)** — it's cleaner, keeps the existing honest permission copy accurate, and removes an entire data category from both forms. It needs your go for a build; flag it and I'll make the one-line change.
