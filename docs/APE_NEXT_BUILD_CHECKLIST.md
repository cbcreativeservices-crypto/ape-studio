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

| **Deep links** — `proaudio://…` scheme; Universal Links / App Links for `proaudiotrainingacademy.com` (2026-09-05 discoverability pass) | `app.json` `scheme`, `ios.associatedDomains`, `android.intentFilters` (native config → needs the build); the URL→screen map is JS (`src/navigation/linking.ts`) | n/a | ✅ added 2026-09-05 | scheme works in any build after 2026-09-05; the https links stay inert until the website hosts `/.well-known/apple-app-site-association` + `assetlinks.json` (`docs/APE_WEBSITE_SEO_NOTES_2026_09_05.md` §A) |
| Light-Pulse frequency counter (camera luma) + MultiMeter snapshot photo | camera path inside `ape-dsp` (no `expo-camera` package) | in-tree module | `NSCameraUsageDescription` + `android.permission.CAMERA` ✅ | ready |
| Glossary / calc **copy to clipboard** | `expo-clipboard` ~57.0.1 | ✅ | none required | ready |

`expo-print` and `react-native-view-shot` autolink; no plugin entry exists for them by design.

**Verified 2026-09-05 (evening) before the demo builds:** every package in `package.json` with a native half has its plugin/permission above or autolinks; `tsc --noEmit` clean; 255 tests green.

## What the owner does

1. `eas build --profile development --platform ios` (and android) from `C:\Users\profe\dev\ape-studio` on the current branch, then install the new dev client on both phones and delete the old one (a stale client next to a new one caused the 2026-08-21 black-screen confusion — see memory `dev-client-reload-crash-2026-08-21`).
2. First run: the Harmonograph card's SAVE will prompt for add-only Photos access with the text in `app.json`; PRINT opens the OS print sheet; SHARE opens the share sheet.
3. Tick off each row above on the device; anything still saying "needs the next app build" after installing is a defect, not a gate.

## Rule for future work

Whenever a feature is written behind `optionalModule()` or an engine-version check, add its row here in the same commit, with the dependency and the plugin/permission it needs — so "make sure it's in the next build" is a lookup, not an audit.
