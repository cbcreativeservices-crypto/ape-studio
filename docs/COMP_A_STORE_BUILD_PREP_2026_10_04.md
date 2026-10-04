# Comp A: prepare for the next store build (2026-10-04)

From ccode (Computer B), at the owner's request: "give me a handoff to comp a to prepare for store build".

**Nothing has been built yet.** Only the owner starts a build, by saying so at the time (BUILD RULE, AGENTS.md). This note lets both sides be ready when they do. The live store builds are **iOS 33 / Android 16**. Remote auto-increment should make the next ones **iOS 34 / Android 17**.

## 1. Who does what

| Step | Owner | ccode (repo) | Comp A (stores/server) |
|---|---|---|---|
| Say "start the build" | ✅ | — | — |
| Package bumps + native fixes (§2) | — | ✅ on the owner's go, same commit as the build | — |
| `eas build` (ios + android, production profile) | go | runs it | — |
| iOS associatedDomains capability (one interactive build with an Apple login) | Apple login | — | ✅ coordinate (§4.4) |
| Store listings, What's New, screenshots | approves | supplies the change list (§5) | ✅ |
| In-app purchase sandbox test | — | — | ✅ (§4.1) |
| 16 KB page-size check on the Android bundle | — | — | ✅ (§4.2) |
| `eas submit` / TestFlight / Play internal track | go | can run the submit on the owner's go | ✅ console side: review notes, testers, rollout |

## 2. What the build will carry (ccode lane, listed so A can test it)

**Package updates.** These are native packages, so they need the build:
- `react-native-reanimated` 4.5.1 → **4.5.5** and `react-native-worklets` 0.10.1 → **0.10.4**. This fixes:
  - expand/collapse animations being swallowed;
  - animated values going stale after the app is paused (meters, Low-Light);
  - an iOS crash.
- `expo-iap` 5.5.1 → **5.8.x**. Purchase flows: **needs the sandbox test in §4.1.**
- `expo-speech-recognition` 56.0.1 → **57.x** (the SDK-57 line). Glossary dictation.
- JS-only updates taken with this build's testing: `@supabase/supabase-js` 2.110 → **2.117.x**, and the React Navigation minors (native 7.5, native-stack and bottom-tabs 7.20).

**Native fixes** (from the next-build queue):
- **Signal Generator, headphones unplugged / Bluetooth dropped:**
  - iOS: the tone carried on through the loudspeaker.
  - Android: the stream died while the screen still said RUN.
  - Fix: stop it and tell the screen.
- **iPad mic-stop crash in the background** (Sentry APE-STUDIO-T): guard `stopCapture` when the audio engine or its input format is no longer valid.

**Already-written features that switch on with any new build** (docs/APE_NEXT_BUILD_CHECKLIST.md):
- image share/save/print (Harmonograph, Cymatics, calculator, measurements, glossary);
- certificate PDF;
- the store review prompt;
- the real in-app purchase connection;
- expo-image card art.

**All app code since the last publish:** hunts 11–13, the React Native pass and the wrap-up, plus this morning's owner rulings once they land:
- lab clips count toward hearing exposure while they play;
- the clipping flag clears when you move to another tool;
- "OVER CEILING BY …";
- a credit warning before opening a cross-linked glossary term.

## 3. Things that will change for Comp A to know about

- **New runtime fingerprint.** OTA updates published afterwards go ONLY to the new build. Builds 33/16 stay on their own runtimes (iOS e8e3455b…, Android 22976b0e…). Until most testers have moved, every publish has to go to BOTH the old and the new runtimes, as we do now.
- **No new permissions.** Nothing in this build adds a permission or a data type:
  - store privacy forms / data safety: no change expected;
  - age rating: no change.
  - ⛔ Comp A should still confirm this against the final `app.json` diff before submitting (Apple rejected a removed purpose string once; permissions must match the binary).
- **Glossary charging changes** (owner ruling 2026-10-04): opening a cross-linked term from inside a definition now costs one lookup, after a warning the reader confirms.
  - Members, unconfirmed members and already-opened terms are never charged.
  - If any review note or support text says cross-links are free, update it.
  - Server side: no change. It uses the existing `get_glossary_definition` meter.

## 4. Please prepare before the owner says go

1. **In-app purchase sandbox test** (expo-iap 5.8):
   - On a TestFlight/internal build: buy, restore, refund-ends-same-day and cancel-ends-at-cycle-end (owner policy 2026-10-01).
   - Confirm the `validate-purchase` function accepts both stores' receipts.
   - Sandbox testers ready on both consoles.
2. **Android 16 KB pages:**
   - Google Play requires 16 KB page-size support for apps targeting Android 15+.
   - Our audio engine is already built for it (`-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON`, Oboe 1.10).
   - After upload, check Play Console → App Bundle Explorer for a 16 KB warning and report back.
3. **Target API:**
   - Play has required target API 36 since 2026-08-31; SDK 57's default is 36.
   - Confirm Play Console shows no target-SDK warning on the upload.
4. **iOS associatedDomains** (`applinks:proaudiotrainingacademy.com`):
   - The capability needs one interactive `eas build` with an Apple login.
   - The website must already serve `/.well-known/apple-app-site-association` (and `assetlinks.json` for Android).
   - Please confirm both files are live and correct, or tell us this build should skip the capability.
5. **Release notes / What's New:** draft from §2, in plain user terms. Do not promise future features.
6. **Xcode version:** builds stay on **Xcode 26** with SDK 57. Do not pin Xcode 27; that waits for SDK 58 and the iOS UIScene work.
7. **TestFlight / internal testing groups** ready for 34 / 17.

## 5. Not in this build (owner decisions pending)

- React Compiler.
- FlashList v2 for the Glossary.
- Signed OTA updates (needs the EAS Production plan).
- The SDK 58 / Xcode 27 move.
- Certificate-as-image (needs `react-native-webview`).
- Snapshot location tagging (needs `expo-location` and its permissions put back).

Reply on docs/CROSS_SESSION_HANDOFF.md with:
- the §4 items done;
- any blocker;
- the IAP test result.
