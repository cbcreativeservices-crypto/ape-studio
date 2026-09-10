# Wave E — Production configuration & secrets audit (release-readiness QA, 2026-09-10)

Scope: release build configuration — env/keys, identifiers, permissions, deep-link
config, dev/test exposure, signing inputs. Code + config review (app.json,
eas.json, src/config, src/lib/env). No builds run (owner-GO only). Secrets posture
cross-checked with Wave A's client scan.

## Findings

### E-1 [MED][deep-link] iOS `associatedDomains` is absent → Universal Links inoperative on iOS
`app.json` declares Android App Links via `android.intentFilters` (autoVerify,
host proaudiotrainingacademy.com + www, path prefixes below) but there is **no
`ios.associatedDomains`** entry. On iOS, `https://proaudiotrainingacademy.com/...`
links will **not** open the app — only the custom `proaudio://` scheme works.
**Action (owner/config):** if iOS Universal Links are intended, add
`ios.associatedDomains: ["applinks:proaudiotrainingacademy.com","applinks:www.proaudiotrainingacademy.com"]`
(and host the AASA file) before advertising https deep links. Ties to the
`labs/*` deep-link proposal (`docs/APE_LABS_DEEPLINK_PROPOSAL_2026_09_10.md`).

### E-2 [MED][deep-link] Android intent filters omit `/topics` (the canonical topic share path)
The Android `intentFilters` path prefixes are `/get /tools /learn /labs /glossary
/awards /directory /careers`. But `linking.ts` maps `/topics/:topicSlug` → Dashboard,
and `topicUrl()` generates `https://…/topics/<slug>` as the **canonical public topic
URL** (the link a share/marketing would use). With no `/topics` prefix (Android)
and no associatedDomains (iOS), a `…/topics/<slug>` link opens the app on **neither**
platform. **Action:** add a `/topics` pathPrefix to the Android intent filters (and
include `/topics` in the iOS AASA) — fold into the deep-link task.

### E-3 ✅ VERIFIED 2026-09-10 — production EAS env vars ARE set
`eas env:list --environment production` (as cbcreativeservices) confirms BOTH
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (the `sb_publishable_`
anon key) are set for the production environment — a cloud production build will
reach Supabase. Release-gate CLEARED. (Original finding retained below.)

### E-3 [MED · verify][build] Production EAS build env vars not visible in-repo
`eas.json` production profile has **no `env` block**, and `.env` is git-ignored
(Wave A). `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are inlined
at build time from the environment, so a **cloud** production build must have them
set as **EAS environment variables** (or they'll be undefined → the prod app can't
reach Supabase, surfacing as `src/lib/env.ts` throwing / a dead app). **Action
(owner):** confirm both `EXPO_PUBLIC_SUPABASE_*` are configured for the `production`
profile in the EAS dashboard before the release build. (Not a code fix; a build-env
check. Release-gate item.)

### E-4 [LOW][tidiness] Dev/debug routes registered unconditionally (but unreachable in prod)
`DspDebug` and `Institutional` are registered as routes in `RootNavigator`
unconditionally, but their **entry points are `__DEV__`-only** (DspDebug row on
ToolsHub is `__DEV__`; Institutional is reached only via the dev logo long-press /
`DevVisualIndex`, itself `{__DEV__ ? … : null}`). So neither is reachable in a
release build — **not a leak**, matching the pattern used elsewhere. Optional:
wrap the two `Stack.Screen` registrations in `__DEV__` for tidiness. No action
required for release.

## Verified GOOD

- **Identifiers consistent**: iOS `bundleIdentifier` = Android `package` =
  `com.cbcreativeservices.apestudio`; slug `ape-studio`; **version 1.0.0**;
  `extra.eas.projectId` set.
- **Permissions are justified** with clear, honest usage strings (mic/camera/
  location/media-library), each scoped and stating no upload — good App Store /
  Play review posture. `ITSAppUsesNonExemptEncryption: false` set (export
  compliance). `isAccessMediaLocationEnabled: false`, granular photo permission.
- **No test/dev credentials, test data, or debug config** in app.json / eas.json.
- **Secrets clean** (Wave A): only the `sb_publishable_` anon key + URL reach the
  client; `.env` git-ignored; `service_role` only server/tooling side.
- **Dev bypasses compiled out of release**: `devBypass()` / `DEV_BYPASS_ACTIVE`
  are `__DEV__`-gated (`src/config/devMode.ts`); `commercialMode` defaults ON in
  release (`src/config/flags.ts`).
- **Production error handling**: `RootErrorBoundary` shows the raw error message
  only under `__DEV__`; release shows the friendly fallback.
- **Session hardening**: `expo-secure-store` for native auth storage; IAP via
  `expo-iap` plugin present.

## Filed items → owner

| ID | Sev | Action |
| --- | --- | --- |
| E-1 | MED | ✅ DONE (cc1f6c8) — iOS `associatedDomains` added (apex + www). Still needs the website to host the AASA file to go live. |
| E-2 | MED | ✅ DONE (cc1f6c8) — `/topics` added to Android intent filters (both hosts). Still needs website assetlinks.json to verify. |
| E-3 | MED·verify | Confirm `EXPO_PUBLIC_SUPABASE_*` set as EAS env vars for the production profile — **release-gate** |
| E-4 | LOW | (optional) wrap DspDebug/Institutional route registrations in `__DEV__` |

No production-config CRITICAL/HIGH. E-1/E-2 are deep-link reach gaps (the scheme
still works; https links don't), E-3 is a build-env verification the owner must do
in the EAS dashboard.
