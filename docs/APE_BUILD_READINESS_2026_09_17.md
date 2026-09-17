# Build readiness — everything that turns on with the next native build

**Date:** 2026-09-17 · **Owner ask:** "I want everything to turn on with this next build so include everything in it."
**Targets:** new native builds for Pixel (Android) and iOS.
**ccode never starts the build.** `eas build` runs only when the owner says, in that moment, to start it (`AGENTS.md`).

---

## 1. THE ONE REAL BLOCKER — EAS does not have the telemetry keys

EAS builds in the cloud and `.env` is git-ignored, so **the build never sees your local file.**
Whatever is not registered in EAS is simply absent at build time.

Checked 2026-09-17 with `npx eas env:list` against all three environments
(`production`, `preview`, `development`). Every one of them holds exactly two variables:

```
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_SUPABASE_URL
```

**Both telemetry keys are missing.** `src/features/telemetry/telemetry.ts:50` boots Sentry only
`if (SENTRY_DSN)` and `:81` boots Aptabase only `if (APTABASE_APP_KEY)`. A blank key is a silent
no-op by design — the kill-switch behaviour. So a build made today would install cleanly, run
fine, and ship with **crash reporting and analytics both switched off**, with nothing on screen
to tell you.

### Fix — two steps

**Step 1. Fill the two new lines at the bottom of `.env`.** They were added 2026-09-17 and are
blank on purpose, because these are yours to generate and ccode must not handle them:

| Variable | What it is | Where to get it |
|---|---|---|
| `SENTRY_ORG` | Your Sentry organisation **slug**, not the numeric id | The org segment of your dashboard URL, `sentry.io/organizations/<slug>/` |
| `SENTRY_AUTH_TOKEN` | Internal-integration token, scopes `project:releases` + `org:read` | Sentry → Settings → Developer Settings → Internal Integrations |

Neither carries the `EXPO_PUBLIC_` prefix, deliberately: they are **build-time only** and must
never be inlined into the shipped bundle. They exist solely so the build can upload source maps,
which is what makes a native crash arrive as readable code instead of raw memory addresses.
**Do not paste the token into chat.** Type it straight into `.env`.

**Step 2. Push everything to EAS:**

```bash
cd C:\Users\profe\dev\ape-studio; ./scripts/eas-env-sync.ps1
```

That script reads `.env` and registers four variables across all three environments with the
right visibility: the two client keys as `sensitive`, the org slug as `plaintext`, and the auth
token as `secret`. It prints variable **names only**, never values. Re-running is safe. Add
`-WhatIf` to see the plan without doing anything.

Verify afterwards:

```bash
cd C:\Users\profe\dev\ape-studio; npx eas env:list production
```

> If you skip the Sentry org and token, the build still succeeds and crashes are still captured.
> You just get unreadable stack traces. Skipping the **DSN** or the **Aptabase key** is the one
> that silently disables the feature.

---

## 2. What turns on with this build

Everything below is already written, committed and waiting on its native half. No further code is
needed for any of it.

| Capability | Package | What changes on device |
|---|---|---|
| Crash + diagnostics | `@sentry/react-native` | Native crash capture begins. Release-health sessions start. Device context (model, manufacturer, memory, battery, orientation, storage) starts attaching — this is why the store forms are filed for the post-build state. |
| Product analytics | `@aptabase/react-native` | Events reach the EU endpoint. `appVersion` / `appBuildNumber` stop being empty strings. |
| Save to Photos | `expo-media-library` | The SAVE control on the Harmonograph, Cymatics Phase 4 and measurement snapshots goes live, using the narrower **add-only** Photos permission. |
| Print | `expo-print` | The PRINT control and the Lab Print / Art Print split go live. |
| Share as image | `react-native-view-shot` + `expo-sharing` | The SHARE control goes live across the labs and calculators. |
| Certificate PDFs | `expo-print` | Printable certificate output from the awards screens. |
| In-app purchases | `expo-iap` | Already plugin-configured; the paywall talks to real StoreKit / Play Billing and the `validate-purchase` edge function. |
| **Audible beats in the Cymatics lab** | `ape-dsp` engine 8 | `kEngineVersion = 8` is already in the native source (`modules/ape-dsp/ios/core/EngineHub.hpp:59`) and `GEN_MODES.dual = 14` is implemented on both platforms. Detuned pairs and dual-frequency drive stop being visual-only. |

Every one of these is reached through `optionalModule()`, so each control currently renders
**disabled with the "available after the next app build" note**. They flip to enabled with no
code change. Nothing needs a flag toggled.

---

## 3. Worth a glance before you build

- **`app.json` Sentry plugin has `project` and `url` but no `organization`.** With `SENTRY_ORG`
  set in the environment (step 1) the plugin resolves the org fine, so this is not a blocker.
  Adding it explicitly to `app.json` would make it independent of the environment — ccode did not,
  because it does not know your org slug.
- **Dev bypass flags are safe.** `src/config/devMode.ts` still has `instantIntros: true`, but the
  whole object is hard-guarded by `__DEV__` (`:65`, `:69`), so a release build renders it inert
  regardless of the values. No action needed.
- **`expo-print` and `react-native-view-shot` have no `app.json` plugin entry** and do not need
  one; they autolink.
- **Deep links need a cold start** after install — `react-navigation` reads the linking config
  once at container mount.

---

## 4. Verify after the build lands

1. `npx eas env:list production` shows four variables, not two.
2. Fire the telemetry self-test and confirm both dashboards receive it. Sentry ingest is **US**,
   Aptabase is **EU** — two different regions, both expected.
3. Force a native crash and confirm the Sentry stack trace is **symbolicated**. If it is raw
   addresses, the auth token did not reach the build.
4. Cymatics → Harmony in Motion → set a detune and confirm you can **hear** the beat. That is
   engine 8 proving itself.
5. Harmonograph → SAVE and PRINT are enabled, and iOS asks the **add-only** Photos question.
6. Cold-start once, then test a deep link: `proaudio://labs/cymatics/membrane`.
7. Tell Computer A the build shipped, so the store forms are filed against this state rather than
   the dev client.

---

## 5. Not in this build

- **Cymatics Phase 4** (Gallery & Art Studio) is assigned to the lab's Fable session and is not
  written yet — see `docs/APE_CYMATICS_PHASE4_HANDOFF_2026_09_17.md`. Its export controls will be
  gated exactly like the Harmonograph's, so whenever it lands it inherits whatever this build
  provides.
- **The 54 pending certificate images** are a Supabase Storage upload, not a build artefact.
  Nothing about the build changes them.
