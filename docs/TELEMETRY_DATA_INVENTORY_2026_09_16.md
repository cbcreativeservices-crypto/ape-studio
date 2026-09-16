# Telemetry data inventory — Sentry + Aptabase (2026-09-16)

**For Computer A** — the exact "what each SDK sends" table for the Apple App-Privacy
and Google Data-Safety forms. Source of truth in code: `src/features/telemetry/telemetry.ts`
(SDK config) and `src/features/telemetry/scrub.ts` (the filters), pinned by
`test/telemetry.test.ts`. Kill switch for BOTH: `src/config/telemetry.ts` → `TELEMETRY_ENABLED`.

## Explicit confirmations

| Question | Answer |
|---|---|
| Advertising identifier (IDFA / GAID) read or sent? | **No.** Neither SDK is configured for it and no code reads one. |
| App Tracking Transparency prompt? | **No.** Never requested. Apple "Tracking" answer stays **No**. |
| Cross-app / cross-site tracking, ad attribution, data brokers? | **No.** |
| Any data linked to a user identity? | Only Sentry crash/diagnostic events carry the **app's own Supabase user id** (a UUID) for real accounts, set explicitly via `Sentry.setUser({ id })` and cleared on sign-out. Guests / anonymous glossary sessions are never bound. Aptabase carries **no** user identifier. |
| Microphone audio? | Still **on-device only**. Nothing in either SDK touches audio; no measurement or dictation data is sent anywhere. |
| Email / name / IP address? | **Never sent.** `sendDefaultPii: false`; `beforeSend` strips `user.email / username / ip_address` and any request context. Aptabase has no user object at all. |
| Session Replay / screenshots / view hierarchy? | **Off.** Replay integration not installed; `attachScreenshot` + `attachViewHierarchy` false. |
| Performance tracing / user-interaction tracing? | **Off** (`tracesSampleRate` unset, `enableAutoPerformanceTracing` false, `enableUserInteractionTracing` false). |
| Free text of any kind (typed search, notes, answers)? | **Cannot leave the app.** Aptabase props are whitelist-filtered to enum-shaped values (≤48 chars, identifier characters only, no `@` / `/` / quotes); console breadcrumbs are dropped; URLs lose their query strings. |
| Can it be disabled quickly? | One constant (`TELEMETRY_ENABLED = false`) turns off both SDKs at boot; a blank key in `.env` turns off that one SDK. |

## Per-SDK table

| SDK | Data category | Fields sent | Linked to a user id? | Endpoint / host | 3rd-party sharing |
|---|---|---|---|---|---|
| **Sentry** `@sentry/react-native` 7.11 | **Diagnostics — Crash Data** (Apple) / **App info and performance → Crash logs, Diagnostics** (Google) | Error type + message + JS stack trace (native stack once the next build carries the native module); app release/build, environment (`development`/`production`); OS name + version, device model/manufacturer, orientation, memory/battery state (standard Sentry device context); breadcrumbs = navigation route **names** (no params), http **method + path + status** (query strings stripped), touch-target component names; **anonymous release-health session counts** (start/end, crash-free rate). | **Yes, for real accounts only**: `user.id` = the app's Supabase user UUID. No email, username or IP (`sendDefaultPii: false` + `beforeSend` scrub). Guests: no user at all. | `https://o4512097493385216.ingest.us.sentry.io` (Sentry US, project `ape-studio`) | None. Sentry is a processor; data is not shared onward or used for advertising. |
| **Aptabase** `@aptabase/react-native` 0.6 | **Analytics — Product Interaction** (Apple) / **App activity → App interactions** (Google) | Event name + whitelisted props only: `screen_view {screen}`, `quiz_start {practice}`, `quiz_finish {outcome, offline}`, `exam_start {award}`, `exam_finish {passed, offline}`, future feature-usage counters of the same shape. SDK adds automatically: OS name + version, app version + build number, SDK version, `isDebug`, locale (hard-coded `en-US` by the SDK), and a **random per-launch session id** (not persisted, not a device id). **No device model, no advertising id, no persistent identifier.** | **No.** No user id, no account field; sessions are random per launch. | `https://eu.aptabase.com` (**EU** data residency, selected by the `A-EU-` key prefix) | None. Aptabase is a privacy-first, open-source processor; no ad networks. |

## Not collected by either SDK

Advertising ID · IDFV/Android ID · contacts · location · photos · microphone audio · typed text · quiz answers · glossary searches · account email/name · IP address (not stored on events) · purchase details.

## Store-form mapping (suggested)

- **Apple App Privacy** → *Data Not Linked to You*: Crash Data, Performance Data (release-health), Product Interaction, Other Diagnostic Data. *Data Linked to You*: **User ID** (Crash Data only — for signed-in accounts). **Tracking: No.**
- **Google Data Safety** → *Collected*: Crash logs, Diagnostics (app performance), App interactions. *Shared*: none. *Encrypted in transit*: yes (HTTPS). *Deletion*: crash events tied to a user id can be purged on request via Sentry's data-scrubbing/deletion; analytics has no identifier to delete.

## Verification (2026-09-16)

- `tsc` clean · `npm test` 1179/1179 (8 new scrub tests).
- Dev client (Pixel, JS-only mode — the current dev binary predates both native modules): boot self-test logged `sentry: true aptabase: true`, no JS errors.
- Sentry ingest returned **HTTP 200** for 3 envelopes (test error + sessions) from the web runtime of the same bundle.
- Aptabase: SDK reported no send failure on the device; **owner to confirm the `telemetry_self_test` + `screen_view` events in the Aptabase dashboard** (EU) and the test error `telemetry self-test (dev client)` in Sentry.

## Build-time notes (next EAS build)

- Both SDKs gain their native modules with the next build (native crash capture, real app version in Aptabase).
- Sentry source-map upload needs `SENTRY_AUTH_TOKEN` and `SENTRY_ORG` as EAS environment variables (sensitive); `project` is set in `app.json` (`ape-studio`). Without them the build still succeeds — stack traces are just unsymbolicated.
