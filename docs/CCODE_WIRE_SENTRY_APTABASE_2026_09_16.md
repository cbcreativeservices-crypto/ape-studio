# CCODE — wire Sentry (crash) + Aptabase (analytics), privacy-first (2026-09-16, owner approved)

Goal: add crash + product analytics **without** breaking the clean privacy profile — NO ad ID, NO ATT prompt, NO cross-app tracking, so Apple "Tracking = No" stays true.

## Owner prep first (Cháno — ccode is blocked until these land)
1. Create a **Sentry** project (platform: React Native) → copy the **DSN**.
2. Create an **Aptabase** app → copy the **App Key** (pick **EU** host for strictest privacy).
3. Hand both keys to ccode (env / app config, not committed plaintext).

## ccode — install + wire (Expo SDK 57)
**Sentry** (`@sentry/react-native`, Expo plugin):
- Init early; wrap the root. Source maps via the Expo plugin.
- Privacy config: `sendDefaultPii: false`; **do NOT enable Session Replay**; attach ONLY the app's own user id via `Sentry.setUser({ id: appUserId })` — never a device/ad id; scrub PII from breadcrumbs.

**Aptabase** (`@aptabase/react-native`):
- Init with the app key + EU host.
- Track only **anonymous** product events (screen views, feature usage, quiz start/finish counts). NO PII, NO free-text that could carry a name/email.

**Both:**
- NO IDFA/GAID, NO ATT prompt, NO advertising or cross-app tracking.
- Put both behind one runtime flag so they can be killed fast.

## Return to Computer A (so A can finalize the store privacy forms)
A short table of exactly what each SDK sends:
`SDK | data category (Diagnostics/Crash · Analytics/Usage) | fields | linked to a user id? | endpoint/host | any 3rd-party sharing`
Confirm explicitly: no device/ad id, no ATT, mic audio still on-device.

## Done-when
`tsc` clean · `npm test` · a test crash shows in Sentry · a test event shows in Aptabase · the "what it collects" table returned to A.

One-liner for the Claude Code session: "read docs/CCODE_WIRE_SENTRY_APTABASE_2026_09_16.md and apply it (after I give you the Sentry DSN + Aptabase key)."
