# Next native build — checklist of everything gated on it (kept current)

The installed dev client predates several native modules and engine versions. Every one of these features is already written, honesty-gated at runtime (`optionalModule()` / engine capability checks), and switches itself on the moment a build that carries the native half is installed. Nothing here needs code to "turn on" — it needs the build.

**Owner ask 2026-09-05:** "the harmonograph drawing says it needs the next app build to work (share, save, print). make sure this is included in our next build." → verified below; one config gap fixed (photo-library permission text).

## What the next build must carry — verified in the repo

| Feature (what the user sees today) | Native half | In `package.json` | In `app.json` plugins / permissions | Status |
|---|---|---|---|---|
| Harmonograph drawing card — **SHARE** as image | `react-native-view-shot` 5.1.0 + `expo-sharing` ~57.0.16 | ✅ | `expo-sharing` plugin ✅ (view-shot needs none) | ready |
| Harmonograph drawing card — **SAVE to Photos** | view-shot + `expo-media-library` ~57.0.4 | ✅ | **was missing** → `expo-media-library` plugin added 2026-09-05 with add-only photo permission text (iOS `NSPhotoLibraryAddUsageDescription`; Android media permissions per plugin) | ready |
| Harmonograph drawing card — **PRINT** | view-shot + `expo-print` ~57.0.1 | ✅ | none required | ready |
| Calculator report — share as **image** (text share works now) | view-shot + expo-sharing | ✅ | ✅ | ready |
| Glossary term — share as **image**, copy to clipboard | view-shot + expo-sharing (+ clipboard) | ✅ | ✅ | ready |
| Certificate / credential **PDF download** (Profile, Awards, Credential Wall) | `expo-print` + `expo-sharing` | ✅ | ✅ | ready |
| Glossary **dictation** mic | `expo-speech-recognition` | ✅ | ✅ plugin with permission text | ready |
| Keyboard controller (calc inputs) | `react-native-keyboard-controller` | ✅ | none | ready |
| Lab audio that "predates the v3 additive engine" (Harmonograph intervals, Bass Lab, Foundations Playground/Course additive + stereo dual-osc), **v6 effects path** (FX Lab), **v7 binaural** (Binaural Lab) | `ape-dsp` native engine (source complete, see memory `audio-engine-status`) | in-tree module | n/a | ready — needs the rebuild |

| **Deep links** — `proaudio://…` scheme; App Links for `proaudiotrainingacademy.com` (2026-09-05 discoverability pass) | `app.json` `scheme` + `android.intentFilters` (native config → needs the build); the URL→screen map is JS (`src/navigation/linking.ts`) | n/a | ✅ added 2026-09-05 | scheme works in any build after 2026-09-05; https links stay inert until the website hosts `/.well-known/apple-app-site-association` + `assetlinks.json`. **iOS `associatedDomains` is NOT in the build yet** — needs one interactive `eas build` (Apple login) to add the capability; step in `docs/APE_WEBSITE_SEO_NOTES_2026_09_05.md` §A |
| Light-Pulse frequency counter (camera luma) + MultiMeter snapshot photo | camera path inside `ape-dsp` (no `expo-camera` package) | in-tree module | `NSCameraUsageDescription` + `android.permission.CAMERA` ✅ | ready |
| **Store review prompt** — asks for a rating only after real successes (lab completed, quiz passed, certificate earned), thresholds in `src/features/review/reviewEligibility.ts` | `expo-store-review` ~57.0.2 + `expo-application` ~57.0.2 (version for once-per-version) | ✅ installed 2026-09-06 | none required | **needs the next build** — no-op on current clients |
| **In-app purchases** — the paywall's real store connection (OpenIAP) | `expo-iap` ^5.5.1 (plugin auto-added); loader re-enabled in `features/commercial/purchase.ts` | ✅ installed 2026-09-06 | `expo-iap` plugin ✅ | **needs the next build** — purchases report "unavailable" on current clients; store products + validate-purchase must be configured before a real purchase can succeed |
| **Installed app name** — the home-screen name is `Pro Audio` (owner 2026-09-06, clarified: abbreviate on the device rather than let iOS/Android truncate "Training Academy"); the STORE listing name is the full `Pro Audio Training Academy` | `app.json` `expo.name` unchanged | ✅ | n/a | no build needed for this — store name is console work |
| Glossary / calc **copy to clipboard** | `expo-clipboard` ~57.0.1 | ✅ | none required | ready |
| **Home carousel card art** — reliable loading (owner report 2026-09-05: placeholders on both phones; the course-cards bucket serves `Cache-Control: no-cache`, which defeats iOS's URL cache) | `expo-image` ~57.0.3 — its own memory+disk cache ignores that header; `CardArt` uses it when the native module is present and falls back to RN `ImageBackground` (force-cache + retry) on the current dev clients | ✅ installed 2026-09-05 | none required (no plugin) | **needs this build** — until then the RN fallback path runs |

`expo-print` and `react-native-view-shot` autolink; no plugin entry exists for them by design.

**Verified 2026-09-05 (evening) before the demo builds:** every package in `package.json` with a native half has its plugin/permission above or autolinks; `tsc --noEmit` clean; 255 tests green.

## What the owner does

1. `eas build --profile development --platform ios` (and android) from `C:\Users\profe\dev\ape-studio` on the current branch, then install the new dev client on both phones and delete the old one (a stale client next to a new one caused the 2026-08-21 black-screen confusion — see memory `dev-client-reload-crash-2026-08-21`).
2. First run: the Harmonograph card's SAVE will prompt for add-only Photos access with the text in `app.json`; PRINT opens the OS print sheet; SHARE opens the share sheet.
3. Tick off each row above on the device; anything still saying "needs the next app build" after installing is a defect, not a gate.

## Rule for future work

Whenever a feature is written behind `optionalModule()` or an engine-version check, add its row here in the same commit, with the dependency and the plugin/permission it needs — so "make sure it's in the next build" is a lookup, not an audit.

## BUILD RULE (owner, 2026-09-05, after two violations — "I ALWAYS WILL TELL YOU EXPLICITLY WHEN I WANT TO START A BUILD")
NEVER run `eas build` (any profile, any platform), `eas submit`, or any other billed/external action on my own reading of a message. "We need to build", "then build new versions", a task list, a deadline, a demo — NONE of these are the cue. The ONLY cue is the owner saying, in that moment, in their own words, to start the build now. When work reaches the build step: ask ONE line, then WAIT. Written in nine places at the owner's instruction so it is never missed.


**Built 2026-09-05 evening on the owner's explicit go:** iOS build 16 · Android versionCode 12, from commit 783a0a9. Every row above ships in these builds. Next build gates: `expo-store-review` (not installed), iOS `associatedDomains` (needs one interactive build once the AASA is live).

## Rule for optional modules (2026-09-06)
A package behind `optionalModule()` is only usable if it has a LITERAL `require` in the `LOADERS` table in `src/features/tools/capture/optionalModule.ts`. The old eval-only path hid packages from Metro so their JavaScript was never bundled, and the Harmonograph SAVE/SHARE/PRINT keys said "next app build" even on the build that carried them. Install → LOADERS line → checklist row, always together.
