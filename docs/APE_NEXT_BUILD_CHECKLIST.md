# Next native build — checklist of everything gated on it (kept current)

The installed dev client predates several native modules and engine versions. Every one of these features is already written, honesty-gated at runtime (`optionalModule()` / engine capability checks), and switches itself on the moment a build that carries the native half is installed. Nothing here needs code to "turn on" — it needs the build.

**Owner ask 2026-09-05:** "the harmonograph drawing says it needs the next app build to work (share, save, print). make sure this is included in our next build." → verified below; one config gap fixed (photo-library permission text).

## What the next build must carry — verified in the repo

| Feature (what the user sees today) | Native half | In `package.json` | In `app.json` plugins / permissions | Status |
|---|---|---|---|---|
| Harmonograph drawing card — **SHARE** as image | `react-native-view-shot` 5.1.0 + `expo-sharing` ~57.0.16 | ✅ | `expo-sharing` plugin ✅ (view-shot needs none) | ready |
| Harmonograph drawing card — **SAVE to Photos** | view-shot + `expo-media-library` ~57.0.4 | ✅ | **was missing** → `expo-media-library` plugin added 2026-09-05 with add-only photo permission text (iOS `NSPhotoLibraryAddUsageDescription`; Android media permissions per plugin) | ready |
| Harmonograph drawing card — **PRINT** | view-shot + `expo-print` ~57.0.1 | ✅ | none required | ready |
| **Cymatics Pattern Gallery exports** (2026-09-17, Phase 4) — SHARE PNG / SAVE to Photos (view-shot + sharing / media-library, the Harmonograph gates), PRINT + PDF Letter/A4/Square (`expo-print` HTML path, PDF share via sharing), SVG as a **file** (sharing + expo-file-system) | all already listed above; `expo-file-system` ships in the expo core | ✅ | ✅ (no new plugin) | ready · **SVG share works NOW** as text through the core Share sheet; the page-size picker is built and renders disabled until this build |
| Calculator report — share as **image** (text share works now) | view-shot + expo-sharing | ✅ | ✅ | ready |
| **Saved measurement — share as image** (owner device pass 2026-09-11: sharing sent text only — "the image is not shared… that is the whole idea of sharing the tools with visuals") | view-shot + expo-sharing, via the same `shareImage` helper the calculator uses | ✅ | ✅ (no new plugin — both already listed above) | ready · **falls back to the text share** when the native half is absent or capture fails, so it is never a dead control |
| Glossary term — share as **image**, copy to clipboard | view-shot + expo-sharing (+ clipboard) | ✅ | ✅ | ready |
| Certificate / credential **PDF download** (Profile, Awards, Credential Wall) | `expo-print` + `expo-sharing` | ✅ | ✅ | ready |
| Glossary **dictation** mic | `expo-speech-recognition` | ✅ | ✅ plugin with permission text | ready |
| Keyboard controller (calc inputs) | `react-native-keyboard-controller` | ✅ | none | ready |
| Lab audio that "predates the v3 additive engine" (Harmonograph intervals, Bass Lab, Foundations Playground/Course additive + stereo dual-osc), **v6 effects path** (FX Lab), **v7 binaural** (Binaural Lab) | `ape-dsp` native engine (source complete, see memory `audio-engine-status`) | in-tree module | n/a | ready — needs the rebuild |

| **Deep links** — `proaudio://…` scheme; App Links for `proaudiotrainingacademy.com` (2026-09-05 discoverability pass) | `app.json` `scheme` + `android.intentFilters` (native config → needs the build); the URL→screen map is JS (`src/navigation/linking.ts`) | n/a | ✅ added 2026-09-05 | scheme works in any build after 2026-09-05; https links stay inert until the website hosts `/.well-known/apple-app-site-association` + `assetlinks.json`. **iOS `associatedDomains` is NOT in the build yet** — needs one interactive `eas build` (Apple login) to add the capability; step in `docs/APE_WEBSITE_SEO_NOTES_2026_09_05.md` §A |
| Light-Pulse frequency counter (camera luma) + MultiMeter snapshot photo | camera path inside `ape-dsp` (no `expo-camera` package) | in-tree module | `NSCameraUsageDescription` + `android.permission.CAMERA` ✅ | ready |
| **Certificate shared as an IMAGE** (owner 2026-09-18: "their printed certificate (image)"; the QR card and the link ship OTA and work now — this is only the certificate itself as a PNG) | `react-native-webview` + the existing `react-native-view-shot`: render `certificateHtml.ts`'s HTML in an offscreen WebView and photograph it | ❌ **not installed** — and deliberately NOT installed yet, see the note under this table | none expected (autolinked) | **parked — needs a decision on ORDERING, not on design** |
| **MultiMeter snapshot — TAG LOCATION** (`src/features/tools/capture/location.ts`, wired in `MultiMeterScreen`) | `expo-location` | ❌ **not installed** — `optionalModule()` resolves it to `null`, so `isAvailable()` is false and the control stays hidden | **permissions REMOVED from `app.json` 2026-09-11** — see below | **parked** — needs the package installed AND the manifest keys put back |
| **Store review prompt** — asks for a rating only after real successes (lab completed, quiz passed, certificate earned), thresholds in `src/features/review/reviewEligibility.ts` | `expo-store-review` ~57.0.2 + `expo-application` ~57.0.2 (version for once-per-version) | ✅ installed 2026-09-06 | none required | **needs the next build** — no-op on current clients |
| **In-app purchases** — the paywall's real store connection (OpenIAP) | `expo-iap` ^5.5.1 (plugin auto-added); loader re-enabled in `features/commercial/purchase.ts` | ✅ installed 2026-09-06 | `expo-iap` plugin ✅ | **needs the next build** — purchases report "unavailable" on current clients; store products + validate-purchase must be configured before a real purchase can succeed |
| **Installed app name** — the home-screen name is `Pro Audio` (owner 2026-09-06, clarified: abbreviate on the device rather than let iOS/Android truncate "Training Academy"); the STORE listing name is the full `Pro Audio Training Academy` | `app.json` `expo.name` unchanged | ✅ | n/a | no build needed for this — store name is console work |
| Glossary / calc **copy to clipboard** | `expo-clipboard` ~57.0.1 | ✅ | none required | ready |
| **Home carousel card art** — reliable loading (owner report 2026-09-05: placeholders on both phones; the course-cards bucket serves `Cache-Control: no-cache`, which defeats iOS's URL cache) | `expo-image` ~57.0.3 — its own memory+disk cache ignores that header; `CardArt` uses it when the native module is present and falls back to RN `ImageBackground` (force-cache + retry) on the current dev clients | ✅ installed 2026-09-05 | none required (no plugin) | **needs this build** — until then the RN fallback path runs |

`expo-print` and `react-native-view-shot` autolink; no plugin entry exists for them by design.

### ✅ Generator gain ramp — level faders TICK — FIXED AND VERIFIED ON DEVICE 2026-09-18

**Closed.** Shipped in the `preview` builds of 2026-09-18 (Android `bd02e15d`,
iOS `9aa9e995`) and confirmed by the owner on the phone: *"No crackle!"* The
change is the duration-based gain ramp described below, in
`modules/ape-dsp/ios/core/Generator.hpp` (`kGainRampSec`). 171 golden vectors
passed with it. Kept here for the reasoning, which generalises: a slope limiter
expressed in ABSOLUTE amplitude does nothing for small moves at low levels, and
a fader is exactly that case.

### (original finding)

Not a gated feature; a **native DEFECT** whose fix only lands with a build.

Owner, riding STRENGTH in Foundations Module 3: *"I hear like a crackle when I
move the strength slider."* Confirmed on Module 9, which carries a FREQ fader and
a LEVEL fader on ONE screen — identical touch rate, identical Skia re-render
load: **LEVEL crackles, FREQ is clean.** So it is the gain path, not thread
starvation, and not the phone speaker (M3 at 165 Hz and M4 at 330 Hz both do it).

`Generator.hpp` slope-limits gain in ABSOLUTE amplitude units, and says so:
*"the rate is fixed, not the duration — the click-free guarantee is the bounded
slope."* That guarantee covers a 0→1 jump. It does nothing for a fader:

| | |
|---|---|
| slope | `1 / (48000 × kRampSec 0.008)` = **0.0026 amplitude/sample** |
| M9 LEVEL range | −44 → −20 dBFS = amplitude 0.0063 → 0.100 |
| ~0.5 s sweep at 120 touch events/s | ≈ **0.0016 amplitude per write** |
| samples that step needs | 0.0016 ÷ 0.0026 = **0.6** |

Every write lands inside ONE sample — the limiter never engages, so each is a
true discontinuity of ~0.0016 (a −56 dBFS click) arriving ~120×/s under a tone at
−20 dBFS. Nothing generates a tick deliberately (checked: no haptic and no click
source on `ParamLane`) — **the level steps ARE the ticks.**

**Unfixable from JS**: at 60–120 writes/s there is no way to cross that range in
steps small enough to be inaudible without the fader visibly lagging. The
smoothing has to happen BETWEEN writes, which is the engine's job.

**The change** — `modules/ape-dsp/ios/core/Generator.hpp`, in `renderInto`, make
gain DURATION-based (any new target reached in a fixed ~15 ms) instead of
slope-based, which is what a mixer fader does:

```cpp
// was: fixed slope — useless for small changes at low levels
const double gainStep = 1.0 / (rampSamples < 1.0 ? 1.0 : rampSamples);
// becomes: fixed DURATION — recomputed per render block from the distance left
const double gainStep = std::fabs(ampTarget - ampCur_) / (fs * kGainRampSec);
```

Keep the `if (env_ <= 0.0) ampCur_ = ampTarget;` snap (nothing to glide from
while silent). ONE file fixes both phones — Android's `CMakeLists.txt` compiles
`../ios/core`. Re-run the core's golden tests with it.

✅ Applied 2026-09-18 as part of the build, which is exactly how this was meant
to land — the note below was the standing reason not to write it earlier.


### Location permissions removed 2026-09-11 — exactly what to put back

`app.json` declared FINE + COARSE location and `NSLocationWhenInUseUsageDescription` as pre-staging for Snapshot "tag location". `expo-location` is not installed, so in any build we submit today those permissions are unreachable by any code path — and `ACCESS_FINE_LOCATION` obliges a Play Console location declaration for a feature that cannot run. They were removed rather than shipped. **Nothing in `src/` changed**: `location.ts` and its MultiMeter control are untouched and still gate themselves off.

When Snapshot GPS is picked back up, install `expo-location` and restore these three keys verbatim:

```jsonc
// expo.android.permissions — add alongside android.permission.CAMERA
"android.permission.ACCESS_COARSE_LOCATION",
"android.permission.ACCESS_FINE_LOCATION"

// expo.ios.infoPlist
"NSLocationWhenInUseUsageDescription": "Used only when you choose to tag a measurement snapshot with where it was taken. Location is stored with the snapshot on this device and never shared automatically."
```

That iOS string is owner-ratified copy — restore it as written rather than rewriting it.

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

---

## Certificate-as-an-image: why the package is NOT installed yet (2026-09-18)

The owner picked the WebView route over re-drawing the certificate in React, and
that is the right call: `certificateHtml.ts` is the ONE definition of what a
certificate looks like, and a second React version would drift from it the first
time either was edited — the app already carries three bugs of exactly that
shape, found this week.

**But installing it now would stop every OTA fix reaching the phones.**

`react-native-webview` is a native dependency, so adding it changes the
`@expo/fingerprint` runtimeVersion. Every OTA published after that computes a
runtime the installed builds do not have, so `eas update` succeeds and the
phones see nothing — silently, which is the trap already documented for
`.easignore`. Everything landed this week (the credential policy, the refund
key, the entitlement cache, the production parsers, the share row, the Trophy
Case copy) is OTA-eligible and would be stranded.

So the ordering is: **keep shipping OTA, and install this in the SAME commit as
the next native build.** One line at that point:

```
npx expo install react-native-webview
```
…then add `'react-native-webview': () => require('react-native-webview')` to
`LOADERS` in `src/features/tools/capture/optionalModule.ts`. The code cannot be
written before the install — a literal `require` of an absent package fails the
whole bundle, which that file's own header explains.

**One risk to test on a real device, not to assume away.** `view-shot` capturing
a `WebView` is unreliable on Android: the WebView can be a surface the snapshot
does not see, and it comes back blank. If that happens, the fallback is the PDF
that already works — so the control must be gated on a successful capture and
never offered as a dead button.

---

## 📦 PARKED FOR THE NEXT NATIVE BUILD: exclude `.git` from the upload (found 2026-09-18)

The 2026-09-18 build uploaded a **572 MB** archive and spent ~8 minutes on it.
Measured, not guessed — the included set after `.easignore` is 836 MB, and:

| | |
|---|---|
| `.git` | **667.8 MB — 80% of everything uploaded** |
| assets | 122.4 MB |
| `save here before pen erases it!` | 18.8 MB |
| src | 15.8 MB |
| everything else | ~10 MB |

`git count-objects -vH` reports `size-pack: 572.28 MiB`, which is the archive
size almost exactly: **the upload IS the git pack.** A native build has no use
for it.

**Why `.git` is that big** — three website demo videos in history:
`web/public/app-screens/home.mp4` (65.5 MB), `tools.mov` (42.8 MB),
`lab.mp4` (23.7 MB). `web/` is excluded from the UPLOAD, but its history lives
in `.git` forever, so excluding the folder never helped and never will.

**The fix is one line in `.easignore`:**

```
.git/
```

Expected effect: 572 MB → roughly 150 MB, and several minutes off every build.

⛔ **DO NOT ADD IT ON ITS OWN.** `.easignore` is @expo/fingerprint source #1, so
editing it changes the runtimeVersion — every `eas update` after that would
publish to a runtime the installed phones do not have, succeeding silently and
delivering nothing. It must land in the SAME commit as a native build, exactly
like the native deps. See memory `reference_easignore_breaks_ota`.

**Also worth doing, separately and safely** (no fingerprint impact, local only):
`.git` holds 709 loose objects, ~350 stray `tmp_obj_*` files from interrupted
operations, and a `.rev` with no matching pack. A `git gc` cleans that up. It
does not shrink the pack — the videos are reachable history, and removing those
needs a history rewrite plus a force push, which is a coordinated decision, not
maintenance.

---

## ⛔ LESSON FROM AN ACTUAL APPLE REJECTION (2026-09-19, error 90683)

ccode set `photosPermission: false` on `expo-media-library` (pass 5 · E-3),
reasoning that the feature is write-only so the READ purpose string was
unnecessary. **That reasoning was wrong and Apple rejected the upload:**

```
90683 — missing NSPhotoLibraryUsageDescription
```

**Why it was wrong:** `expo-media-library` **links PhotoKit read APIs into the
binary regardless of the flag.** Apple's static scanner looks at what the binary
LINKS, not at what the app calls. Removing the purpose string for an API that is
present is an automatic reject, even when the app genuinely never reads.

Fixed by A in `e0a610d5` with a truthful read string, rebuilt (build 21),
**accepted**. ⛔ Do not set it back to `false`.

**The general rule, which is the part worth keeping:** a purpose string must
match what the binary CAN do, not what the app chooses to do. "We never call it"
is not a defence to a linker-level scan. Trimming permission strings is only
safe when the SDK providing them is also removed.

### ❌ IT DID. The Android half broke SAVE, and is reverted (2026-09-19)

The other half of E-3 blocked three media READ permissions:

```
android.permission.READ_EXTERNAL_STORAGE
android.permission.WRITE_EXTERNAL_STORAGE
android.permission.READ_MEDIA_IMAGES
```

**Owner, on device: "android image save failed."** Predicted here and confirmed
within the hour. `blockedPermissions` has been REMOVED entirely — all four media
permissions are back in the manifest, which is the configuration that shipped
and worked before E-3 touched it.

**Why it broke:** `saveToLibraryAsync` goes through
`requestPermissionsAsync(writeOnly: true)`, which maps to
`WRITE_EXTERNAL_STORAGE` (and `READ_MEDIA_IMAGES` on API 33+). Android returns
**denied immediately** for any permission the manifest does not declare — there
is no prompt and no error worth reading, so the save just does not happen.
Blocking a permission does not make a feature stop asking for it; it makes the
ask fail.

⛔ **DO NOT re-apply `blockedPermissions` for expo-media-library.** Twice now,
on two platforms, the same reasoning ("the feature is write-only, so the read
permission is unnecessary") has broken shipping behaviour. The permission set
belongs to the SDK, not to our reading of which code paths we call. If the
permissions are genuinely unwanted, the only safe route is removing
`expo-media-library` and the save-to-Photos feature with it.

**This needs a NATIVE BUILD to take effect** — `app.json` is a fingerprint
input, and the fix is in the manifest, so no OTA can deliver it.

