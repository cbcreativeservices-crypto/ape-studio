# AP&E Studio: React Native known issues and best-practice audit (as of 2026-10-04)

Repo: `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`. This was a read-only pass: no edits, commits, publishes, installs or sub-agents.

## 0. What the app actually runs (verified from the repo and node_modules)

| Item | Value | Where |
|---|---|---|
| Expo | 57.0.23 | package.json, node_modules/expo |
| React Native | 0.86.3 (every SDK-57 native build since commit 75a66a82, 2026-08-29) | package.json |
| React | 19.2.3 | package.json |
| Reanimated / Worklets | 4.5.1 / 0.10.1, exactly what Expo pins | node_modules/expo/bundledNativeModules.json |
| Skia | 2.6.2, exactly what Expo pins | same |
| Navigation | @react-navigation/native 7.3.7, native-stack 7.17.9, bottom-tabs 7.18.7 (JS tabs, not native tabs) | installed |
| supabase-js / auth-js | 2.110.0 | installed |
| New Architecture | **On, and it cannot be turned off.** RN 0.86 runs bridgeless only: `global.RN$Bridgeless` timers path in `react-native/Libraries/Core/setUpTimers.js`, and `ViewUtil.getUIManagerType` is deprecated "as part of the removal of the legacy architecture". app.json has no `newArchEnabled` flag, and none is needed. | node_modules |
| Android targets | compileSdk 36, targetSdk 36, minSdk 24, NDK 27.1 | `react-native/gradle/libs.versions.toml` |
| Native projects | Continuous Native Generation (no android/ or ios/ folders) | repo root |
| React Compiler | **Not enabled.** No `experiments.reactCompiler` in app.json and no babel.config.js. babel-plugin-react-compiler is present only as a transitive dependency. | app.json |
| Inline requires | Off (Expo default `inlineRequires: false`). Screens are lazy through `getComponent` instead (130 routes). | @expo/metro-config/build/ExpoMetroConfig.js:346; src/navigation/RootNavigator.tsx |
| Expo package versions | Every Expo-managed dependency matches `bundledNativeModules.json` | checked by script |

A key runtime fact behind finding F1: in bridgeless mode RN 0.86 implements `setImmediate` with `queueMicrotask` (see setUpTimers.js, "We shim the immediate APIs via `queueMicrotask`"). The `InteractionManager` stub uses `setImmediate`, so in this app **`InteractionManager.runAfterInteractions(cb)` is effectively `queueMicrotask(cb)`**. The callback runs before the current event-loop tick finishes, so before the next render step. It does not wait for touches, animations or transitions.

---

## 1. Research findings (with sources)

### 1.1 Releases, versions and deprecations

| # | Claim | Source (date) |
|---|---|---|
| R1 | Expo SDK 57 moves RN 0.85 to 0.86 and keeps React 19.2. Reanimated goes 4.3 to 4.5 and Worklets 0.8 to 0.10. `expo prebuild` now cleans native dirs by default. expo-image gains `writeToCacheAsync`/`readFromCacheAsync`. `expo@57.0.23` adds opt-in `ios.enableSceneSupport`. | https://expo.dev/changelog/sdk-57 (2026-06-30) |
| R2 | SDK 57 known regressions: a Hermes V1 memory blow-up with worklets/reanimated (fixed in expo@57.0.9 = RN 0.86.2) and a dev startup-time regression (fixed in expo@57.0.17 = RN 0.86.3). | same |
| R3 | RN 0.86 has no user-facing breaking changes. It fixes edge-to-edge on Android 15+ (measureInWindow, KeyboardAvoidingView, Dimensions, StatusBar in Modal), fixes BackHandler after resume on API 36+, fixes the Samsung keyboard minus-sign bug, and makes AccessibilityInfo promises resolve `false` instead of hanging. | https://reactnative.dev/blog/2026/06/11/react-native-0.86 (2026-06-11) |
| R4 | InteractionManager is deprecated in the docs: "Avoid long-running work and use `requestIdleCallback` instead." The docs still describe the old behaviour, but the RN 0.86 source is a `@deprecated InteractionManagerStub` built on setImmediate. | https://reactnative.dev/docs/0.86/interactionmanager (accessed 2026-10-04); node_modules/react-native/Libraries/Interaction/InteractionManager.js |
| R5 | **Expo SDK 58 (RN 0.88) removes `InteractionManager`, the `Touchable` root export, `NativeMethods` types, `Modal.animated` and the deprecated StatusBar props.** It also requires the UIScene lifecycle, turns R8 on for Android release builds, and makes deep `react-native/Libraries/*` imports type errors. | https://expo.dev/changelog/sdk-58-beta (2026-09-15) |
| R6 | SafeAreaView in core is deprecated since RN 0.81; use react-native-safe-area-context. | https://reactnative.dev/blog/2025/08/12/react-native-0.81 (2025-08-12) |
| R7 | `UIManager.setLayoutAnimationEnabledExperimental` is a no-op under the New Architecture and logs a dev warning. | node_modules/react-native/Libraries/ReactNative/BridgelessUIManager.js:184-189 (RN 0.86.3 source) |
| R8 | Reanimated 4.5.3 "prevented animated views from reverting to stale values after the app is paused". 4.5.4 means "Reanimated no longer takes over the UIManagerAnimationDelegate, so RN's `LayoutAnimation.configureNext` works alongside Reanimated", and it fixes an iOS nil `_performOperations` crash. 4.5.5 fixes the 4.5.4 Android build on RN 0.83/0.84. 4.5.5 peers: RN 0.83–0.86, worklets 0.10–0.11. | https://swmansion.com/changelog/reanimated-4-5-3/ (2026-07-22), /reanimated-4-5-4/ (2026-08-25), /reanimated-4-5-5/ (2026-08-27); `npm view react-native-reanimated@4.5.5 peerDependencies` |
| R9 | Under the React Compiler, Reanimated shared values should use `.get()`/`.set()` rather than `.value`. | https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue (accessed 2026-10-04) |
| R10 | Expo React Compiler: enabled with `experiments.reactCompiler: true` (Babel is auto-configured from SDK 54; ESLint rules included from SDK 55). Opt out with `'use no memo'`. Health check: `npx react-compiler-healthcheck`. The Expo page still says "experimental". | https://docs.expo.dev/guides/react-compiler (accessed 2026-10-04) |
| R11 | FlashList v2 is a JS-only rewrite for the New Architecture with no native dependency and no size estimates needed. | https://shopify.engineering/flashlist-v2 ; https://github.com/shopify/flash-list (accessed 2026-10-04) |
| R12 | supabase-js `processLock`/`lock` is deprecated. "The auth client coordinates refreshes itself", so `{ lock: processLock }` has no effect. | node_modules/@supabase/auth-js/dist/module/lib/locks.d.ts:90; https://esm.sh/@supabase/auth-js@2.110.7/dist/module/lib/locks.d.ts |
| R13 | Supabase's Expo tutorial: `autoRefreshToken: true, persistSession: true, detectSessionInUrl: false`, with session storage encrypted through SecureStore. AppState start/stop of auto-refresh is the documented RN pattern. | https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native (accessed 2026-10-04) |
| R14 | supabase-js releases after 2.110: 2.114 (2026-09-02), 2.116 (2026-09-07: "silence commit-guard-discarded refresh in initial session"), 2.117.0/2.117.1 (2026-09-22/23: passkeys default; "return stored session when a refresh loses to another tab"). Latest is 2.117.2. | https://github.com/supabase/supabase-js/releases ; `npm view` |
| R15 | expo-sqlite: "Enable WAL journal mode when you create a new database to improve performance." WAL is not the default. Sync methods block the JS thread. `useNewConnection` defaults to false (shared connection). | https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/ (accessed 2026-10-04) |
| R16 | Expo keyboard guide: on Android, a KeyboardAvoidingView with `behavior` undefined is the recommended default; react-native-keyboard-controller for complex cases. | https://docs.expo.dev/guides/keyboard-handling/ (accessed 2026-10-04) |
| R17 | EAS Update code signing is only on the EAS Production/Enterprise plans. It needs `updates.codeSigningCertificate` and `codeSigningMetadata`, plus a new build with a new runtime version. | https://docs.expo.dev/eas-update/code-signing/ (accessed 2026-10-04) |
| R18 | React Navigation 8 is still alpha/in progress (July 2026 progress report). 7.x is current. | https://reactnavigation.org/blog/2026/07/08/react-navigation-8.0-july-progress |

### 1.2 Platform and store rules

| # | Claim | Source (date) |
|---|---|---|
| P1 | From 2026-08-31, new apps and updates on Play must target API 36 (an extension to 2026-11-01 is available). | https://developer.android.com/google/play/requirements/target-sdk (accessed 2026-10-04) |
| P2 | Android 16 with targetSdk 36: the edge-to-edge opt-out is disabled. Predictive back is on by default and `onBackPressed`/KEYCODE_BACK are no longer dispatched; the opt-out `enableOnBackInvokedCallback="false"` still works. On displays of 600 dp or more, orientation, resizability and aspect-ratio locks are ignored. `elegantTextHeight` is ignored. | https://developer.android.com/about/versions/16/behavior-changes-16 (accessed 2026-10-04) |
| P3 | Play 16 KB page size: required for apps targeting Android 15+ from 2025-11-01 (extension to 2026-05-31). One secondary source also cites 2027-02-01 as a hard update block. | https://developer.android.com/guide/practices/page-sizes ; https://help.pushwoosh.com/hc/en-us/articles/31409797287453 . **2027-02-01 not verified on an official page.** |
| P4 | From 2026-04-28, App Store uploads must be built with Xcode 26 / the iOS 26 SDK. | https://developer.apple.com/news/upcoming-requirements/ ; https://expo.dev/blog/app-store-connect-minimum-sdk-26 |
| P5 | iOS 27 SDK: apps must use the UIScene life cycle or they fail to launch. This is triggered by the SDK you build with. Stable SDK 57 apps keep the AppDelegate path, and SDK 58 generates SceneDelegate. In Xcode 27 the Liquid Glass opt-out `UIDesignRequiresCompatibility` no longer takes effect. | https://expo.dev/changelog/sdk-57 ; https://docs.customer.io/integrations/sdk/expo/whats-new/ios-27-uiscene-support/ ; https://developer.apple.com/forums/thread/832543 . **The date when Apple will REQUIRE the iOS 27 SDK for uploads was not verified.** By pattern it would be about April 2027. |
| P6 | Expo privacy manifests: Apple may not parse PrivacyInfo files inside static CocoaPods, so declare required-reason APIs in `ios.privacyManifests`. Apple emails (ITMS-91053) after an upload when reasons are missing. However, RN's pod install aggregates library manifests by default (`privacy_file_aggregation_enabled: true`). | https://docs.expo.dev/guides/apple-privacy/ ; node_modules/react-native/scripts/react_native_pods.rb:73 |
| P7 | iOS 26 Liquid Glass hits native chrome: nav bars, tab bars, alerts, Switch (a custom `trackColor` falls back to the narrow switch). | https://thoughtbot.com/blog/migrating-to-native-stack-navigation-with-a-surprise-from-ios-26 ; https://www.mindbowser.com/ios-26-liquid-glass-react-native-health-app-guide/ |

### 1.3 Items I could not verify
- Whether Hermes V1 is the default engine in SDK 57. The changelog only says "a Hermes V1 regression from SDK 56". It does not matter for this app, because the fix is in RN 0.86.2+ and the builds carry 0.86.3.
- Whether React Navigation 7 native-stack turns `freezeOnBlur` on by default.
- The Android 17 / API 37 status of the predictive-back opt-out.
- The official 2027-02-01 16 KB date (P3) and the iOS 27 SDK upload deadline (P5).
- Whether App Store Connect sent ITMS-91053 privacy emails for builds 32/33. I cannot see the store consoles. This is Comp A's lane.

---

## 2. Audit: app against findings

Legend: **OTA** = JS only, the fingerprint is unchanged. **BUILD** = a native, app.json or native-package change that moves the fingerprint.

Fingerprint note: `@expo/fingerprint` default `sourceSkips` is only `PackageJsonAndroidAndIosScriptsIfNotContainRun` (node_modules/@expo/fingerprint/build/Options.js:71). **Any app.json change moves the runtime**, and that includes `experiments.reactCompiler`. Pure-JS package bumps (supabase-js, React Navigation, FlashList v2) are not autolinked native modules, so they should not move it. Confirm with an `expo-fingerprint` diff before any publish.

### F1. InteractionManager: a deprecated stub here, and removed in RN 0.88 / SDK 58
- **Occurrences**
  - src/components/JogWheel.tsx:35 (import) and :730 (`prewarmJogRasters` after mount).
  - src/features/tools/engine/useDspEngine.ts:16 (import) and :404 (mic `start()` after "interactions", with a 1.5 s fallback at :405).
  - src/features/updates/startAutoUpdate.ts:8 (import) and :29 (`settle` for the OTA `reloadAsync`).
  - src/screens/dashboard/DashboardScreen.tsx:27 (import) and :1174 (focus reload).
  - src/screens/tools/ToolsHubScreen.tsx:13 (import) and :1029 (`displaysReady`, with a 350 ms fallback at :1030).
  - Comments only: src/features/updates/autoUpdate.ts:56, src/features/tools/engine/micSession.ts:32, src/screens/lab/LabShell.tsx:534.
  - Test pinned to the exact call: test/perfHome_20261003.test.ts:145.
- **Applies:** yes. Each site's comment assumes "after the transition/interactions", but the call actually runs as a microtask in the same tick:
  - ToolsHub: the "after the open transition" wait never happens. The Skia previews start during the push, and the 350 ms timer is dead code.
  - JogWheel: the "after the Dashboard's first paint" raster build runs before that paint.
  - startAutoUpdate: the crash note (autoUpdate.ts:31-33) says the reload must be "off the render path", yet a microtask runs before `RuntimeScheduler::updateRendering` in the same `runEventLoopTick`. That is the very frame in the 2026-09-19 crash stack. Whether a microtask reload can reproduce that crash is unproven, but the intended guarantee is not in place.
  - useDspEngine and Dashboard: harmless today. The behaviour simply equals "now".
- **Risk if left:** the SDK 58 upgrade fails to compile or run (import removed). The ToolsHub/JogWheel deferrals don't happen (jank on open). The OTA-reload safety margin is weaker than documented.
- **Proposed change:**
  - Add one house helper, e.g. `src/lib/afterInteractions.ts`, with `runSoon(cb) → { cancel }`. It uses `requestIdleCallback(cb, { timeout })` where present and falls back to `setTimeout(cb, 0)`; on web it uses `setTimeout`. Also add `runAfterTransition(navigation, cb, fallbackMs)` for "after the push", using the `transitionEnd` + timer pattern LabShell already proved.
  - Per site:
    - startAutoUpdate:29: `settle: (cb) => { setTimeout(cb, 0); }`. This is a real macrotask after the render step. Optionally wrap it in `requestAnimationFrame` first.
    - JogWheel:730: `runSoon` (idle, timeout about 1000 ms).
    - ToolsHub:1029: `transitionEnd` + the existing 350 ms fallback.
    - useDspEngine:404 and Dashboard:1174: keep today's effective timing (`setTimeout(fire, 0)` / `runSoon`). This does not change when the mic starts or when the Study tab loads.
  - Update test/perfHome_20261003.test.ts:145 to the new call.
  - Add a ratchet test that fails on `InteractionManager` in src/ (D47 style; the allowlist starts empty).
- **Effort:** about 1–2 h including tests. **OTA.**

### F2. `UIManager.setLayoutAnimationEnabledExperimental(true)`: a no-op that warns
- **Occurrences:**
  - src/components/Section.tsx:24-25
  - src/screens/enrollment/EnrollmentScreen.tsx:109-110
  - src/screens/enrollment/HomeSetupSheet.tsx:46-47
  - src/screens/lab/cable/lessons/lesson02.tsx:31-32
  - src/screens/lab/LabShell.tsx:46-47
- **Applies:** yes. Under bridgeless it does nothing and prints "currently a no-op in the New Architecture" in dev (R7).
- **Risk:** none at runtime. It is dev-console noise and dead code that suggests a behaviour that isn't there.
- **Change:** delete the five guarded blocks and drop `UIManager` from the imports where it becomes unused. LayoutAnimation itself stays.
- **Effort:** 15 min. **OTA.**

### F3. expo-sqlite: module-scope sync open, and no WAL
- **Occurrences:**
  - src/features/glossary/offlineCorpus.native.ts:29 (`openDatabaseSync` at import) and :31-41 (`execSync` DDL at import).
  - src/features/quiz/submissionQueueStorage.native.ts:18 and :22.
  - src/features/study/studyQueueStorage.native.ts:18 and :23.
  - Already lazy: src/features/tools/measure/measurementsBackend.native.ts:45. Its own comment states the house lesson: "opening a database as a side effect of an import is how a native module ends up on the boot path".
  - Import chains: clearLocalAccountData.ts:31,33 → both queue modules; DashboardScreen.tsx:126-127; SettingsScreen.tsx:46.
  - No `journal_mode` anywhere.
- **Applies:** partly.
  - The three module-scope opens contradict the app's own 2026-08-28 lesson. A thrown `execSync` at import would take the importing module, and the account wipe, down with it.
  - WAL is the documented recommendation (R15) and would speed the 160-batch glossary save.
- **Change:**
  - Add one lazy shared opener, e.g. `src/features/storage/appDb.native.ts` with `appDb()`, which opens `ape-studio.db` once and runs the three files' DDL on first use.
  - Optionally run `PRAGMA journal_mode = WAL` once in that opener.
  - The three modules call `appDb()` instead of using a module-level `db`.
- **Risk:**
  - Lazy open: low.
  - WAL: low to moderate. It persistently changes the on-disk mode and adds -wal/-shm files. The account wipe deletes rows, not files (no `deleteDatabase` anywhere), so it is unaffected.
- **Effort:** 1–2 h with tests. **OTA.**

### F4. Reanimated 4.5.1: three fixed bugs ship in 4.5.3–4.5.5
- **Occurrences:**
  - package.json `react-native-reanimated: 4.5.1`, `react-native-worklets: 0.10.1`.
  - `LayoutAnimation.configureNext/easeInEaseOut` in 8 files (9 calls): Section.tsx, EnrollmentScreen.tsx, HomeSetupSheet.tsx, HelpScreen.tsx, lesson02.tsx, bits.tsx, LabShell.tsx, MatchingScreen.tsx.
  - 53 files / 259 `useSharedValue` uses.
- **Applies:** yes (R8).
  - Under 4.5.1, RN LayoutAnimation can be swallowed by Reanimated (expand/collapse may not animate).
  - Animated views can revert to stale values after the app is paused. This matters for meters, Low-Light and backgrounding.
  - There is also an iOS crash fix.
- **Change:** at the next native build, `react-native-reanimated@4.5.5` + `react-native-worklets@0.10.4`. Both are inside 4.5.5's peer range (RN 0.83–0.86, worklets 0.10–0.11). This is one patch above Expo's pin, so `expo install --check` will flag it, and that is expected.
- **Effort:** 30 min plus a device pass on labs and meters. **BUILD.**

### F5. Native packages behind their SDK-57 line
- expo-speech-recognition 56.0.1 (latest 57.1.0, published for the SDK 57 line). expo-iap 5.5.1 (latest 5.8.2).
- **Applies:** partly. Both run today. 56.x was built against SDK 56 headers. The IAP bump touches purchase flows.
- **Change:** bump both at the next native build, and run the store sandbox purchase/restore test (Comp A).
- **Effort:** 1 h + QA. **BUILD.**

### F6. Pure-JS package bumps
- supabase-js 2.110 → 2.117.2 (R14). React Navigation native 7.3.7 → 7.5.0, native-stack 7.17.9 → 7.20.0, bottom-tabs 7.18.7 → 7.20.0. react-native-qrcode-svg 6.3.21 → 6.3.26.
- **Applies:** partly. None of the listed fixes target an observed bug here. The auth fixes are mostly multi-tab/browser; 2.116's "commit-guard-discarded refresh in initial session" is the most relevant one.
- **Risk:**
  - React Navigation minors can change routing details the app has tests for (the `pop: true` / `exact: true` rules in src/navigation/linking.ts).
  - supabase changes can interact with safeSessionResult and the cold-start auth race.
- **Change:** take them with the next build's QA cycle, not as a standalone OTA. Run the full test suite plus an `expo-fingerprint` diff. Do not run `npm install` now (it rewrites package-lock).
- **Effort:** 1 h + QA. **OTA-capable**, but bundle them with a build by policy.

### F7. React Compiler: not enabled
- **Occurrences:** no `experiments` in app.json. 1,422 `useMemo`/`useCallback` sites, 65 `memo()`, 259 `useSharedValue` (`.value` access opts components out, R9). The recent memo/caching work (perf hunt 2026-10-03) is all hand-tuned.
- **Applies:** yes, as an opportunity.
- **Risk:** medium.
  - It changes render timing app-wide.
  - Hand-tuned memo and identity-sensitive effects (newest-wins tickets, latches, `startFenced`) need re-verification.
  - The app.json flag moves the fingerprint.
- **Change (if approved):**
  1. Run `npx react-compiler-healthcheck` (read-only).
  2. Enable at a native build.
  3. Opt out sensitive files with `'use no memo'` (audio engine hooks, LabShell).
  4. Do not strip existing memo.
- **Effort:** 1–2 days incl. device passes. **BUILD.**

### F8. Glossary list: FlatList of about 31,858 rows
- **Occurrence:** src/screens/glossary/GlossaryScreen.tsx:3803 (already tuned with `initialNumToRender=20`, `maxToRenderPerBatch=30`, `windowSize=7`, variable-height `onScrollToIndexFailed` handling). There are 18 FlatLists in total.
- **Applies:** partly. FlashList v2 (JS-only, R11) would reduce memory and blanking on the A–Z list and remove the `scrollToIndex` failure dance.
- **Risk:** row recycling reuses component state across rows. Glossary rows with local state (open/charged/teaser) would need audit. This conflicts with D50 per-session charging state if any of it is held in row components.
- **Effort:** 0.5–1 day. **OTA-capable** (JS package).

### F9. EAS Update code signing: not configured
- **Applies:** yes, as hardening. OTA bundles are trusted on HTTPS + EAS only.
- **Change:** needs the EAS Production plan, a certificate in app.json, and a new build plus runtime (R17).
- **Effort:** 2 h + build. **BUILD.**

### F10. iOS 27 SDK / UIScene / Liquid Glass
- **Applies:**
  - Liquid Glass: already live in builds made with Xcode 26. The app's exposure is small, because all stacks use `headerShown: false` (RootNavigator.tsx:310, StudyStack.tsx:44, AchievementsStack.tsx:33, MainTabs.tsx:73), tabs are JS-drawn, and the one `<Switch>` is dev-only (src/features/dev/DevVisualIndex.tsx:297).
  - UIScene: not needed while building with Xcode 26 on SDK 57, which matches the memory rule "never pin Xcode 27 on SDK 57". The move to Xcode 27 must come with SDK 58 or `ios.enableSceneSupport`.
- **Change:** none now. Plan the SDK 58 upgrade, which F1 prepares for. **Owner/timeline.**

### F11. Android 16 / targetSdk 36 behaviours
- **Edge-to-edge:** forced. Insets are handled: sheets add `insets.bottom` (RequestsView.tsx:637, AudioCommunityDirectoryScreen.tsx:206), and RN 0.86 fixes KAV/Dimensions. Applies: handled.
- **Predictive back:** app.json `"predictiveBackGestureEnabled": false` keeps `onBackPressed` flowing to BackHandler / `useBackWhileFocused`. Applies: handled for API 36.
- **Large screens:** orientation locks are ignored at 600 dp or more. src/navigation/navOrientation.ts and src/lib/screenOrientationSafe.ts already unlock on tablets. Applies: handled.
- **Keyboard:** Android KAV `behavior={undefined}` at SettingsScreen.tsx:1267, ProductionStageScreen.tsx:170, RequestsView.tsx:435/630, AudioCommunityDirectoryScreen.tsx:205/460/531. This matches the Expo guidance (R16), and RN 0.86 fixed KAV under edge-to-edge (R3). Applies: no change. Keep it on the Pixel smoke list (the composer inside a `<Modal>`).
- **16 KB pages:** modules/ape-dsp/android/build.gradle:33-39 sets `-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON`, and Oboe 1.10.0 supports 16 KB. Applies: handled. Verify alignment of the next AAB (`zipalign -c -P 16`, or Play's App Bundle Explorer).

### F12. Security
- **Session storage:** keychain, chunked at 1,800 bytes (src/lib/authStorage.native.ts), with AsyncStorage on web only. This exceeds the Supabase tutorial's baseline (R13).
- **Client:** src/lib/supabase.ts:28-45 sets `detectSessionInUrl: false` and `autoRefreshToken`, gated by AppState start/stop, with a bounded fetch. It matches R13, and no `lock` option is needed (R12). Applies: no change.
- **Deep links:** src/navigation/linking.ts:46 runs `filter: isAcceptedLink`, which re-checks the authority (the `@evil.example` case). Applies: handled.
- **iOS `associatedDomains`:** deliberately deferred (docs/APE_NEXT_BUILD_CHECKLIST.md:40). Already tracked.
- **Keychain persistence (note):** iOS keychain items survive an app uninstall, so a reinstall can restore the previous session. This is standard; the owner should know about it, but it is not a defect.

### F13. Legacy-API sweep: clean
Searched src/, App.tsx, index.ts and modules/ for each of the following, with zero hits:
- core `SafeAreaView`;
- `findNodeHandle`;
- `setNativeProps`;
- `PushNotificationIOS`;
- core `Clipboard` / `AsyncStorage`;
- `*.removeEventListener` on BackHandler, AppState, Dimensions, Linking or Keyboard;
- deep `react-native/Libraries/*` imports;
- `Touchable*`;
- `NativeMethods`;
- `<Modal animated>`;
- `defaultProps` / `propTypes`;
- deprecated StatusBar setters.

`<StatusBar hidden animated />` at SplMeterScreen.tsx:2507 uses supported props. SDK 58's foreground-notification default is already handled explicitly by `setNotificationHandler` (src/features/notifications/push.ts:48).

### F14. Smaller observations
- **`forwardRef` (8 files):** React 19 accepts `ref` as a prop. forwardRef still works, so this is optional.
- **Module-scope `Dimensions.get('window')`:** src/components/tooldemos/Rt60Demo.tsx:44 is clamped to 268–304, so the impact is negligible. CourseSelectionScreen.tsx:149 is intentional and documented.
- **JS-driven Animated loops (`useNativeDriver: false`, 27 calls):** e.g. PatchPairView.tsx:106 and RtaDemo.tsx:301-303. They animate SVG props (the native driver can't). They are already gated by `useDecorativeMotion` or allowlisted in P10b as lessons. Moving them to Reanimated `useAnimatedProps` is a perf-only refactor.
- **Ungated `console.log`:** src/features/notifications/localSchedule.ts:584 and src/features/telemetry/telemetry.ts:171 (self-test). These are trivial.
- **`freezeOnBlur`:** not set on tabs or stacks. It would cut hidden-tab re-renders, but it conflicts with the app's many "refetch when a write lands" listeners (a frozen screen won't re-render). The default status is unverified.
- **Privacy manifest:** none in app.json. RN's pod-install aggregation is on by default (P6), and the custom modules (ape-dsp, ape-optical) call no required-reason APIs (grep: UserDefaults, file timestamps, systemUptime, disk space; none found). Library manifests cover FileTimestamp/UserDefaults/SystemBootTime/DiskSpace.
- **Hermes V1 regression (R2):** not applicable. The builds carry RN 0.86.3.

---

## 3. Vetting against house rules and recent fixes

| Item | safeSessionResult | createLocalStore | startFenced | memo/caching (perf 10-03) | D44–D54 rulings | Verdict |
|---|---|---|---|---|---|---|
| F1 InteractionManager | n/a | n/a | useDspEngine:404 sits upstream of `start()`; keep "fire now" timing so startFenced ordering and dspStartSupersede/micOrphanStart tests are unchanged | Dashboard:1174 is pinned by perfHome_20261003:145. The ticket logic must stay byte-equivalent; only the scheduler call changes | D48 untouched; ToolsHub displays keep their 350 ms guarantee | OK. **A** |
| F2 setLayoutAnimation… | n/a | n/a | n/a | n/a | n/a | OK. **A** |
| F3 SQLite lazy + WAL | n/a | Not covered (SQLite, not AsyncStorage). D51 "a failed read is told" still holds because loadTerms' completeness marker is unchanged | n/a | n/a | D50 glossary charging not touched | OK. **A** for lazy open. WAL is an optional second commit in the same item |
| F4 Reanimated bump | n/a | n/a | n/a | Meters "drive SharedValues per rAF" (memory rule). The stale-value fix helps | D48 display loops | **B** |
| F5 native pkg bumps | n/a | n/a | n/a | n/a | IAP purchase/refund (D44): Comp A sandbox | **B** |
| F6 JS bumps (supabase, nav) | Must re-run getSessionSafe tests and the cold-start auth-race retry | n/a | n/a | n/a | D52/D54 auth-js offline behaviour may shift | **B** (bundle with the build QA, not a lone OTA) |
| F7 React Compiler | n/a | n/a | Opt out audio hooks | Conflicts with hand-tuned identity work; needs a full re-verify | n/a | **C** |
| F8 FlashList v2 | n/a | n/a | n/a | Recycling vs row state | D50 per-session charge state in rows | **C** |
| F9 OTA code signing | n/a | n/a | n/a | n/a | Plan cost; publish path D49 | **C** |
| F10 iOS 27 / SDK 58 | n/a | n/a | n/a | n/a | Build rule: owner says go | **C** |
| F11–F14 | | | | | | **D** |

---

## 4. Ranked list

### A: do now (OTA-safe, low risk, clear benefit)
1. **A1. Replace InteractionManager (F1).**
   - Sites: JogWheel.tsx:35/730, useDspEngine.ts:16/404, startAutoUpdate.ts:8/29, DashboardScreen.tsx:27/1174, ToolsHubScreen.tsx:13/1029. Also update test/perfHome_20261003.test.ts:145 and add a ratchet test.
   - Why: in RN 0.86 bridgeless it is `queueMicrotask` (no deferral at all), and it is removed in SDK 58.
2. **A2. Delete the no-op `UIManager.setLayoutAnimationEnabledExperimental` blocks (F2).**
   - Sites: Section.tsx:24-25, EnrollmentScreen.tsx:109-110, HomeSetupSheet.tsx:46-47, lesson02.tsx:31-32, LabShell.tsx:46-47.
3. **A3. Lazy shared SQLite opener, with WAL optional (F3).**
   - Sites: offlineCorpus.native.ts:29-41, submissionQueueStorage.native.ts:18-22, studyQueueStorage.native.ts:18-23 → one `appDb()`, modelled on measurementsBackend.native.ts:40-54.

### B: next native build
- **B1.** Reanimated 4.5.1 → 4.5.5, worklets 0.10.1 → 0.10.4 (F4).
- **B2.** expo-speech-recognition 56.0.1 → 57.x; expo-iap 5.5.1 → 5.8.x (F5).
- **B3.** JS bumps taken with that build's QA: supabase-js 2.117.x; @react-navigation/* 7.5/7.20 (F6).
- **B4.** Verify 16 KB alignment of the new AAB (F11). This is a check, not a change.
- **B5.** iOS `associatedDomains` (already on APE_NEXT_BUILD_CHECKLIST).

### C: owner decision
- **C1.** React Compiler (F7): app.json flag (moves the runtime), healthcheck, opt-outs.
- **C2.** FlashList v2 for the Glossary list (F8).
- **C3.** EAS Update code signing (F9): plan + build.
- **C4.** SDK 58 / Xcode 27 timing (F10): the UIScene requirement; InteractionManager is removed there (A1 pre-empts it).
- **C5.** `freezeOnBlur` for tabs (F14).
- **C6.** Reanimated rewrite of the JS-driven SVG loops (F14): perf only.

### D: not applicable or already handled
- Core SafeAreaView, findNodeHandle, setNativeProps, PushNotificationIOS, core Clipboard/AsyncStorage, removed listener APIs, deep imports, Touchable, Modal.animated, defaultProps: all absent (F13).
- targetSdk 36 (default), edge-to-edge insets, predictive-back opt-out, tablet orientation, 16 KB flags (F11).
- Supabase client config, `processLock` (deprecated, not needed), keychain session storage, deep-link filter (F12).
- Lazy screens via `getComponent`; inline requires not needed. Image caching is already expo-image `memory-disk` with `recyclingKey` (CardArt.tsx:152-154, TrophyImage.tsx:158-160); the RN `<Image>` uses are local/data sources.
- Hermes V1 regression (builds on 0.86.3). Liquid Glass impact (headers hidden). Android KAV (matches Expo guidance). Privacy manifest (RN aggregation; no required-reason APIs in custom modules). forwardRef, Rt60Demo module-scope width, two ungated console.logs: negligible.
