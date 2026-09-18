# Bug hunt — PASS 3, agent E: Android, and the platform differences nobody tested

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, 2026-09-18.
Read-only on source. No file changed except this one. No build, no EAS, no update,
no dev server, no network call, no image touched.

## Baseline

- `npx tsc --noEmit` → **clean, exit 0**.
- `npm test` → **1484 pass, 0 fail, 0 skipped** (12.7 s), exit 0.

Everything below therefore passes the type system and the existing suites — which is the
point: none of it is the kind of thing a test on a Windows box can see.

Every finding here is a **platform difference**, not a general bug: it is something
that behaves one way on the owner's iPhone and another way on Android, or something
that has no Android half at all. The owner develops and checks on iOS, so none of
this has been seen.

## Method

- Enumerated and read **all 66 `Platform.OS` sites** in `src/` + `App.tsx`.
- Read both native modules end to end on the Android side (`ApeDspModule.kt` 541 lines,
  `ApeDspJni.cpp` 831 lines, `ApeOpticalModule.kt` 189 lines) and diffed their behaviour
  against `ApeDspModule.swift`.
- Checked the RN keyboard mapping against the **actual shipped source**, not from memory:
  `node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactTextInputManager.kt:722-760, 1117-1131`.
- Checked the edge-to-edge state against the **actual shipped plugin**:
  `node_modules/@expo/prebuild-config/build/plugins/unversioned/edge-to-edge/withEdgeToEdge.js:26-27`.
- Audited all 70 `<Modal>` sites, all 17 `BackHandler` references, all 15 `gestureEnabled`
  sites, all `shadow*` vs `elevation` pairs, all permission request paths, all
  `expo-sharing` / `expo-print` / `expo-media-library` / `FileSystem` paths, and
  `app.json` against `linkPaths.ts` and `URL_ROUTE_CONTRACT.md`.

## Already known and open — verified, not re-reported as new

- `keyboardType: 'numbers-and-punctuation'` opening a QWERTY keyboard on Android:
  **confirmed against the RN source**, and I found a *second* site and a *different,
  worse* sibling — see finding 6.
- 13 labs with no `<AccuracyNote/>`, the Community Directory's 8 modals, `fmt()`
  scientific notation, `Date.parse` production dates, the certificate registry token:
  out of my axis, untouched.
- `docs/discoverability/URL_ROUTE_CONTRACT.md` already says the website half of the
  link handshake is not built. Finding 7 is about the half that is **not** in that doc.

---

# MAJOR

## 1. The Android audio OUTPUT stream has no error callback and no recovery watchdog — a device disconnect kills every tone permanently while the UI keeps saying it is playing

**Severity:** major
**Confidence:** high on the code (read); high on the mechanism (Oboe's documented
disconnect contract); **needs one device test to confirm the exact symptom** — see below.
**Where:** `modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp:271-302` (`openOutput`).
Compare the input path at `:222-268` plus its watchdog at `:393-403`.

**What the user does:** opens Signal Generator (or any of the **16 screens** that drive
this stream — `OscillatorLab`, `HarmonicsView`, `FmLab`, `BassLab`, `NoiseLab`, `FxLab`,
`AutotuneLab`, `SignalChainLab`, `HarmonographLab`, `FoundationsCourse`,
`FoundationsPlayground`, `eqAudition`, `modAnalog`, `modHarmony`, `useDriveTone`,
`SignalGenScreen`), starts a tone, then plugs in headphones, unplugs them, or lets a
Bluetooth headset connect or drop.

**What happens:** the stream is opened `PerformanceMode::LowLatency` +
`SharingMode::Exclusive`, which is the MMAP/AAudio path. When its device goes away AAudio
**disconnects** the stream: the data callback stops being called and the stream is dead.
Oboe surfaces that only through an error callback, and `openOutput` never calls
`setErrorCallback` — the builder chain at `:273-282` sets direction, performance mode,
sharing mode, format, channels, rate, conversion quality, usage, content type and the
**data** callback, and nothing else. So nothing reopens it.

Meanwhile `genStatus()` reports `running` from `g[0]`, which is `gen_.running()` — a flag
on the C++ `Generator`, not on the stream (`ApeDspModule.kt:355-367`,
`ApeDspJni.cpp:125-140`). `SignalGenScreen.tsx:385-399` polls that at 2 Hz. So the screen
keeps showing a running generator, the level readout keeps showing `effectiveLevelDb`, and
there is no sound and no error, until the user stops and starts again.

**What should happen:** what the **input** stream already does. `startAnalysisThread`
(`:355-405`) runs a capture-recovery watchdog — "a device unplug / route change closes the
input stream, the callback stops, and `lastWriteAt_` goes stale. Reopen HERE… rate-limited"
— added by the owner on 2026-08-14. The output stream got no equivalent. Either register
an `AudioStreamErrorCallback` that reopens in `onErrorAfterClose`, or give the output the
same timestamp-and-reopen watchdog, and make `genStatus().running` reflect the *stream*
so the UI cannot claim a tone that is not being rendered.

**iOS comparison:** `ApeDspModule.swift` has a full route-change observer (`:558-602`), an
interruption observer (`:604-630`) and a restart watchdog (`:510-548`). None of that
exists on Android for output.

**Device test that settles it:** Android phone, Signal Generator, 1 kHz at a safe level,
tone running out of the speaker → plug in wired headphones. If the tone does not resume in
the headphones *and* the screen still shows the generator running, this is confirmed.
Repeat with a Bluetooth headset connect and disconnect.

---

## 2. Nothing in the app requests Android audio focus — so a phone call plays over the test tone, and another app's music plays into the measurement

**Severity:** major
**Confidence:** high. `grep -rn "requestAudioFocus\|AudioFocus\|abandonAudioFocus\|BECOMING_NOISY" modules src` returns **zero hits**. `setAudioModeAsync` is called twice and only with `playsInSilentMode` (`src/features/ear/earPlayer.ts:112`, `src/features/lab/LabAudioPlayer.ts:69`), which is an AVAudioSession concept and a no-op on Android.
**Where:** `modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt` (whole file — it registers an `AudioDeviceCallback` for routing but never an `OnAudioFocusChangeListener`), `modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp:271-302`.

A pass-2 agent noted the stream holds no focus and is not bound to the activity. Here is
what actually follows from that, each traced to the code:

**a) An incoming call does not stop the tone.** Android audio focus is cooperative — the
dialer requests `AUDIOFOCUS_GAIN_TRANSIENT`, and an app that registered no listener is
simply never told. The Oboe stream is `Usage::Media` (`:280`), which is not a stream the
telephony stack force-mutes. So a 1 kHz sine keeps rendering through a phone call, and on
speakerphone the far end hears it. On iOS this is handled: `ApeDspModule.swift:604-618`
observes `AVAudioSession.interruptionNotification` and stops on `.began`.

**b) Another app's audio plays *into* every measurement.** Because we never take focus,
Spotify/YouTube/a podcast keeps playing when SPL, RTA, Spectrogram, RT60 or MultiMeter
starts. The phone speaker's output is then part of what the mic measures. For a tool the
app describes as a measurement instrument, that is a silent accuracy failure with no
warning flag — `useDspEngine.ts:330-350` raises `engine_inactive`, `bluetoothInput`,
`processedInput` and clip/drop flags, but has nothing for "we are not the only sound".

**c) The hearing-safety promise only covers our own contribution.** `AudioOutputGate`,
the output ceiling, the route-aware 150 Hz speaker HPF (`ApeDspModule.kt:463-479`) and the
exposure monitor all assume our stream is the audio the user is hearing. On Android it may
be one of two or three.

**d) Nothing ducks, in either direction.** A navigation prompt or a notification sound
will not duck our tone, and a `LOSS_TRANSIENT_CAN_DUCK` aimed at us does nothing.

**e) Headphone unplug is not treated as "becoming noisy".** Android broadcasts
`ACTION_AUDIO_BECOMING_NOISY` and expects a media app to pause. `refreshOutputRouteAndHpf`
(`ApeDspModule.kt:463-479`) only swaps the high-pass filter and keeps rendering. (In
practice finding 1 probably means the stream is dead rather than loud — but "loud out of
the speaker" and "silently dead" are both wrong, and which one happens depends on the
device.)

**What should happen:** request `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK` (or `GAIN`) around
`ensureOutput()`/`startCapture()`, abandon it on the last stop, and route
`AUDIOFOCUS_LOSS*` into the same path `interrupted` drives on iOS.

---

## 3. `interrupted` is hard-coded `false` on Android, so a phone call during a measurement is invisible to the whole app

**Severity:** major
**Confidence:** high — the literal is in the file twice.
**Where:** `modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt:190`
(`getFrame`) and `:219` (`getMeterFrame`):

```kotlin
"processedInput" to !measurementMode, "bluetoothInput" to bluetoothInput, "interrupted" to false,
```

`modules/ape-dsp/index.ts:35` and `:92` declare `interrupted: boolean` as part of the
shared frame contract — "the SAME JS surface … so index.ts resolves identically on both
platforms", per the file's own header. On iOS it is real
(`ApeDspModule.swift:31, 82, 106, 613-628`): an interruption sets it true and stops
capture with `stopReason = "interruption"`. On Android it is a constant.

**What the user does:** starts a 15-minute Leq / exposure measurement on an Android phone
and takes a call.

**What happens:** `interrupted` stays false. `DspDebugScreen.tsx:171` shows `false`.
Nothing else in `src/` reads it at all, which is itself telling — the honest flag exists
and has no consumer outside the debug screen, so on *both* platforms an interruption is
not surfaced to the user of the measurement. But on Android it cannot even be detected,
because there is no focus listener (finding 2) to set it.

**What should happen:** either Android sets it from an audio-focus loss, or the field is
removed from the Android frame so nobody builds on a constant. Given the accuracy promise,
the first.

---

## 4. Every measurement saved on Android records its input device as the literal string "Android input"

**Severity:** major — wrong information stored and displayed as fact, on records the app
positions as field documentation.
**Confidence:** high.
**Where:** `modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt:492`:

```kotlin
"routeName" to "Android input",
```

Consumed at:
- `src/screens/tools/MultiMeterScreen.tsx:1490` — rendered under the **INPUT** heading in
  the system row, beside SAMPLE RATE and FFT.
- `src/screens/tools/MultiMeterScreen.tsx:857, 903` — stored on the saved snapshot as
  `input_device: draft.routeName.length > 0 ? draft.routeName : 'Device microphone'`.
- `src/screens/tools/RtaScreen.tsx:951-958` and
  `src/screens/tools/SpectrogramScreen.tsx:409-416` — same, on their saves.
- `src/features/tools/measure/deviceProfile.ts:159` — `routeName` goes into the
  `DeviceCapabilityRecord` that feeds the community mic catalog contribution.

**What the user does:** plugs a USB measurement microphone into an Android phone and saves
an RTA capture.

**What happens:** the screen says the input is "Android input", and the saved record —
the thing that makes the measurement defensible later — says `input_device: "Android
input"`. On iOS the same field carries the real AVAudioSession port name.

**What should happen:** the Kotlin side already knows the answer. `detectBluetoothInput()`
(`:455-459`) enumerates `AudioManager.GET_DEVICES_INPUTS`; the same list carries
`AudioDeviceInfo.getProductName()` and `getType()`. Report the active input's product name,
and fall back to `'Device microphone'` rather than to a placeholder that reads like a real
answer. Note the surrounding fields *are* honest — `inputPortType` is
`"unprocessed"`/`"voice-recognition"` from the real preset — which makes this one stand out
as an oversight rather than a decision.

---

## 5. The Android hardware BACK button escapes the celebration screen, and the celebration is marked seen before it is shown — so the biggest moment in the app can be lost for good

**Severity:** major
**Confidence:** high on the mechanism; the "for good" part rests on `writeKnown` running
before the navigate, which it does.
**Where:**
- `src/navigation/RootNavigator.tsx:384` — `<Stack.Screen name="Celebration" … options={{ gestureEnabled: false }} />`
  with the comment *"Back is disabled for the same reason Trophy disables it"*.
- `src/screens/results/CelebrationScreen.tsx` — **no `BackHandler`** anywhere in the file.
- `src/features/celebration/useCredentialCelebration.ts:105-108` —
  *"Record BEFORE showing"*, `await writeKnown({ ids, certificates, programs })` runs
  before the event is returned.
- `src/screens/dashboard/DashboardScreen.tsx:716-725` — the focus effect that navigates.

**What the user does:** an Android learner earns their first certificate. The Dashboard
regains focus, `checkCredentials()` resolves, the Celebration screen opens. They press the
hardware BACK button — reflexively, or because the phone's gesture bar is right there.

**What happens:** `gestureEnabled: false` only disables the **iOS edge-swipe**. It has no
effect on the Android back button. The screen pops. `Dashboard` regains focus, the effect
runs `checkCredentials()` again, `readKnown()` now contains that credential id, `fresh` is
empty, and it returns null. The celebration never comes back — on this device, ever. The
comment at `RootNavigator.tsx:384` says exactly why that must not be possible, and on iOS
it is not.

**The same gap on three more screens.** `gestureEnabled: false` is the app-wide default
(`RootNavigator.tsx:323`) and is set explicitly, with an intent comment, on:

| Route | Line | Guarded against Android BACK? |
|---|---|---|
| `Results` | `RootNavigator.tsx:379` | no |
| `Trophy` | `:380` | no |
| `Celebration` | `:384` | **no** — and losable, above |
| `FinalExam` | `:387` | **yes** — `FinalExamScreen.tsx:398` |
| `FinalExamResult` | `:388` | no |
| `Quiz` (StudyStack) | `StudyStack.tsx:33` | **yes** — `QuizScreen.tsx:334` |

`QuizScreen.tsx:330-332` states the rule that was applied twice and then not applied to the
other four: *"Without this, `gestureEnabled:false` only blocks the iOS swipe and
hardware-back drops the learner out of a live timed attempt with no confirm."*

`Results`, `Trophy` and `FinalExamResult` pop back onto a finished attempt rather than
losing data, so they are cosmetic-to-confusing. `Celebration` is the one that loses
something.

**What should happen:** the three-line `BackHandler` block already written twice in this
codebase, on `CelebrationScreen` at minimum. Ideally `useCredentialCelebration` writes
`known` when the celebration is **acted on**, not before it is shown, with a short in-memory
guard against the double-focus race the `running` ref already handles.

---

## 6. Verified: two calculator screens open a QWERTY keyboard on Android — and a third field type makes a negative number physically untypeable

**Severity:** major (the negative-number half is new)
**Confidence:** high — checked against the shipped RN mapping, not from memory.
**Where (the known bug, now with both sites):**
- `src/screens/lab/calc/calcPanel.tsx:146` — `keyboardType={isList ? 'default' : 'numbers-and-punctuation'}`
- `src/screens/lab/calc/CalcProjectsScreen.tsx:259` — `keyboardType="numbers-and-punctuation"`

`ReactTextInputManager.kt:727-760` matches `numeric`, `number-pad`, `decimal-pad`,
`email-address`, `phone-pad`, `visible-password` and `url`. There is **no**
`numbers-and-punctuation` case, so `flagsToSet` keeps its initialiser
`InputType.TYPE_CLASS_TEXT` (`:728`) and the field gets a full text keyboard. Confirmed.

**New — `decimal-pad` cannot produce a minus sign on Android.** From `:1117-1121`:

```kotlin
INPUT_TYPE_KEYBOARD_NUMBER_PAD  = InputType.TYPE_CLASS_NUMBER
INPUT_TYPE_KEYBOARD_DECIMAL_PAD = NUMBER_PAD or InputType.TYPE_NUMBER_FLAG_DECIMAL
INPUT_TYPE_KEYBOARD_NUMBERED    = DECIMAL_PAD or InputType.TYPE_NUMBER_FLAG_SIGNED
```

`'numeric'` carries `TYPE_NUMBER_FLAG_SIGNED`; `'decimal-pad'` does **not**.

`src/screens/lab/production/FieldRow.tsx:478` sets `keyboardType="decimal-pad"` on the
production labs' `NumberField` — the component whose own handler at `:455-461` goes out of
its way to support a sign:

```js
let cleaned = t.replace(/[^0-9.\-]/g, '');
cleaned = (cleaned.startsWith('-') ? '-' : '') + cleaned.replace(/-/g, '');
…
if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
```

So the field explicitly models a leading `-` and an in-progress `-.`, and on Android the
keyboard it opens has no minus key. On iOS the decimal pad has no minus either, but iOS
users can long-press or paste; Gboard's number pad gives neither.

Same file, `:347`, the table-cell input uses `keyboardType={numeric ? 'numeric' : 'default'}`
— that one **is** correct on Android (signed + decimal). The inconsistency between `:347`
and `:478` inside one file is the tell.

**Impact, honestly bounded:** I did not find a shipping production field whose value is
legitimately negative (the 45 fields are budgets, durations, counts and rates), so today
this is latent. It stops being latent the first time someone adds a trim, an offset, a
temperature or a variance field. The calculators, by contrast, have `db`, `temperature`,
`cents` and `angle` quantity kinds (`calcUnits.ts:22-48`) where negatives are routine — and
those are the screens with the QWERTY bug, which at least *has* a minus key.

**What should happen:** `'numeric'` everywhere a number is wanted — it is the only RN
keyboard type that gives Android digits, a decimal separator and a sign. `parseQuantity`
already rejects anything a text keyboard could smuggle in.

---

## 7. `app.json` has no `ios.associatedDomains` at all — so even after the website ships the association files, iOS universal links still will not work

**Severity:** major (a launch-blocking discoverability gap that the docs say is already done)
**Confidence:** high — the key is simply absent from `app.json`.
**Where:** `app.json` `expo.ios` block (lines 19-27) contains `supportsTablet`,
`bundleIdentifier` and `infoPlist` and nothing else. Compare `expo.android`, which has 18
`autoVerify` intent filters.

Three places in the repo state the opposite:
- `src/navigation/linking.ts:5-8` — *"iOS Universal Links + Android App Links … (app.json
  `ios.associatedDomains` / `android.intentFilters` …)"*
- `src/navigation/linkPaths.ts:6-9` — *"Path lists live in exactly three places … `app.json`
  (`android.intentFilters`), and the website's `apple-app-site-association` `paths`"* —
  which quietly omits the iOS half of `app.json` from its own list.
- `docs/discoverability/URL_ROUTE_CONTRACT.md` §7 — *"The https forms stay inert until the
  website hosts the two association files."* That is true for Android and **false for iOS**:
  hosting the AASA will not help an app that never declared `applinks:` in its entitlements.

**What each platform does with the app's URLs today**, traced:

| | today | after the website ships `assetlinks.json` + AASA |
|---|---|---|
| `proaudio://…` | works, both platforms (`app.json` `scheme`) | unchanged |
| `https://…` on **Android** | opens the browser. `autoVerify="true"` with no reachable `/.well-known/assetlinks.json` fails verification, and on Android 12+ an unverified auto-verify filter is **not** offered to the app at all — it does not even appear in a chooser. The user would have to turn on "Open supported links" by hand. | works |
| `https://…` on **iOS** | opens the browser | **still opens the browser** — no `associatedDomains` entitlement |

I confirmed there is no `assetlinks.json` or `apple-app-site-association` anywhere in
`web/public`, no route serving one in `web/app`, and no rewrite in `web/next.config.ts`
(which contains only a `turbopack.root`). The only copies are
`docs/discoverability/examples/*.example`.

**Second, Android-only problem waiting behind it: `pathPrefix` over-claims.**
Android's `pathPrefix` is a raw string prefix on the whole path, not a segment match. Once
verification succeeds, the manifest claims:

- `/get` → also `/getting-started`, `/getaway`, anything starting `get`
- `/topics` → also `/topicsomething`
- `/learn` → also `/learners`
- `/careers` → also `/careers-at-pata`

None of those resolve in `isClaimedPath` (`linkPaths.ts:158-180`), so
`linking.filter` drops the URL and the user lands on Splash having tapped a link to a web
page they will now never see. `linkPaths.ts:127-145` records that this exact failure mode
already bit the seven lab sub-paths in pass 2 — *"the OS DID open the app, and this filter
then dropped the URL, leaving the person on Home with no explanation."* iOS's AASA uses
explicit path patterns and would not have this shape.

Two paths do it even without a typo:
- `https://…/awards` (bare). `app.json` claims `pathPrefix: "/awards"`.
  `isClaimedPath('awards')` → `second` is `undefined` → `AWARD_PAGES.includes('')` → **false**.
  Claimed by the OS, rejected by the app.
- `https://…/topics` (bare). `isClaimedPath('topics')` → `more.length === 0` → **true**, so
  the filter passes it, but `linking.config` only declares `/topics/:topicSlug`, so
  `getStateFromPath` resolves nothing and the link is dropped silently.
  `linking.ts:154-158` (`topicUrl`) **generates** this URL whenever `slugify` returns empty.

**What should happen:** add `ios.associatedDomains: ["applinks:proaudiotrainingacademy.com", "applinks:www.proaudiotrainingacademy.com"]` (it changes the fingerprint, so it lands with a native build, per the `.easignore` rule); switch the Android filters to `pathPattern`/`path` per claimed route rather than `pathPrefix`; and either claim bare `/awards` and `/topics` in the navigator or stop claiming them in the manifest.

---

## 8. Sharing a measurement or a result from Android still arrives as a bare picture with no name and no link — the 2026-09-11 fix was iOS-only

**Severity:** major
**Confidence:** high — the branch is explicit.
**Where:** `src/screens/lab/calc/shareImage.ts:58`:

```js
if (message && Platform.OS === 'ios') {
  await Share.share({ url: uri, message }, { dialogTitle });
  return true;
}
const ok = await sh.isAvailableAsync();
await sh.shareAsync(uri, { mimeType: 'image/png', dialogTitle, UTI: 'public.png' });
```

The docblock at `:40-48` records the owner's complaint verbatim: *"a file-only share DROPS
the text, so a shared measurement arrived as a bare picture with no company name and no
tappable link — the owner noticed the missing link immediately (2026-09-11)."* The fix
takes the `Share.share` path **only on iOS**. Android keeps `expo-sharing.shareAsync`,
which shares the file and nothing else — which is precisely the behaviour the owner
rejected.

**What the user does:** an Android member shares a workflow result or a measurement card.

**What happens:** the recipient gets a PNG with no attribution and no URL. The app's own
word-of-mouth loop is broken on roughly half the customer base.

**What should happen:** `Share.share({ message })` on Android does carry the text (it
ignores `url`), so there is a real choice to make — text+link without the image, or image
without text. A third option is to burn the URL into the rendered card, which fixes both
platforms and the "picture forwarded into a group chat" case. This one needs the owner's
call; what is not defensible is that Android silently gets the version that was already
rejected.

`UTI: 'public.png'` / `'com.adobe.pdf'` / `'public.svg-image'` in the same helpers are
iOS-only and harmless on Android. `mimeType` is set correctly in each case, which is the
Android half.

---

# MINOR

## 9. The production labs are the only text-entry screens in the app that do not use the keyboard controller

**Severity:** minor — **but this is the flagship pre-launch feature and it is untested on Android**
**Confidence:** medium. The code difference is certain; the on-screen symptom needs a device.
**Where:** `src/screens/lab/production/ProductionStageScreen.tsx:76-80`:

```jsx
<KeyboardAvoidingView
  style={styles.root}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={insets.top + 8}
>
```

`behavior={undefined}` makes `KeyboardAvoidingView` an inert `View` on Android. The
traditional justification is that `android:windowSoftInputMode=adjustResize` resizes the
window instead — but **edge-to-edge is now mandatory**:
`node_modules/@expo/prebuild-config/build/plugins/unversioned/edge-to-edge/withEdgeToEdge.js:26-27`
warns that *"`edgeToEdgeEnabled` customization is no longer available — Android 16 makes
edge-to-edge mandatory"*, and `app.json` sets neither `androidNavigationBar` nor
`softwareKeyboardLayoutMode`. Under edge-to-edge the window is not resized by the IME; the
app is responsible for the IME inset.

Every other text-entry surface in the app already uses the right tool —
`AuthScreen.tsx:385`, `CalcWorkflowRunScreen.tsx:481`, `CalcWorkspaceScreen.tsx:403`,
`ProfileScreen.tsx:480` all use `KeyboardAwareScrollView` from
`features/keyboard/keyboardControllerSafe.tsx`, which is backed by
`react-native-keyboard-controller` and handles Android IME insets properly. The two
production labs, with 45 fields across their stages, use the one that does nothing there.

The global `KeyboardToolbar` mounted at `App.tsx:521` still gives a DONE key, so the user is
never trapped — but a field low on a stage form may sit behind the keyboard with no way to
scroll it up.

**Device test:** Android phone → Pre-Production lab → any stage with fields below the fold →
tap the lowest field. If it is covered by the keyboard, this is confirmed. Fix is the
one-line swap to `KeyboardAwareScrollView` the rest of the app already uses.

## 10. `stopReason` and `events` are permanently empty on Android, so the debug screen has nothing to say

**Where:** `ApeDspModule.kt:497-498` — `"stopReason" to ""`, `"events" to emptyList<String>()`.
iOS maintains both (`ApeDspModule.swift:51-61, 422-423, 465-472`) with a 14-entry rolling
event log. `DspDebugScreen.tsx:152` renders `stopReason` only when non-empty, so on Android
the row never appears. Minor on its own; it matters because it is the tool the owner would
reach for when diagnosing findings 1-3 on an Android device, and it is blank there.

## 11. The tuner's picker scrim relies on an iOS-only accessibility prop and has no Android back handling

**Where:** `src/screens/tools/CenterLockTuner.tsx:400` —
`<View style={styles.pickerScrim} accessibilityViewIsModal>`.

This is the **only** one of the 62 `accessibilityViewIsModal` uses in `src/` that is not a
prop of a real `<Modal>` (I checked all of them). `accessibilityViewIsModal` is iOS-only, so
on Android TalkBack can still swipe through to the tuner behind the scrim, and since this
is an in-tree overlay rather than a `<Modal>`, hardware BACK leaves the whole screen instead
of closing the picker. Needs `importantForAccessibility="no-hide-descendants"` on the
siblings and a `BackHandler`, in the shape `SplMeterScreen.tsx:853-865` already uses.

**Worth stating plainly, because it prevents 61 unnecessary "fixes":** the other 61 sites are
fine on Android. RN's `<Modal>` renders a real `android.app.Dialog` in its own window, which
traps TalkBack and routes the back button through `onRequestClose` — and 69 of the 70 modal
sites set `onRequestClose` (the apparent misses in `AppDialog.tsx` and `MembershipGate.tsx`
are the word "Modal" appearing in a comment). `AppDialog.tsx:131` resolves `'cancel'` on
back, and `confirm.ts:34-35` documents that back is a decline, not a no-op. That part of the
app is genuinely Android-correct.

## 12. `Build.FINGERPRINT` is uploaded in the "anonymous" community device record; iOS sends nothing

**Where:** `src/features/tools/measure/deviceProfile.ts:117-123` — Android returns
`osBuild: asStr(c.Fingerprint)`, e.g.
`google/husky/husky:15/AP4A.241205.013/12345678:user/release-keys`. iOS returns
`osBuild: null` (`:124-128`). It rides into `buildDeviceKey` → `DeviceCapabilityRecord` →
`makeContribution`.

A fingerprint is per-build, not per-device, so this is not a re-identifier and I would not
call it a privacy incident. But given the store data-safety work is settled and being held
to a line, it is worth knowing that Android contributors send a materially more specific
device string than iOS contributors, for no stated benefit — `Release` and `Model` already
carry everything the catalog needs.

## 13. `closeOutputIfIdle()` sleeps 150 ms on an Expo worker thread on Android; iOS does it without blocking

**Where:** `ApeDspJni.cpp:152-166`. The comment says iOS achieves the same deferred close
"via `asyncAfter`" — non-blocking — while Android does
`std::this_thread::sleep_for(std::chrono::milliseconds(150))`. It is called from `genStop`,
`binStop`, `modStop` and `~NativeEngine`. The comment correctly notes this is the bridge
thread and not the RT callback, so it is safe. It does mean a lab that toggles tones quickly
(the ear-training and harmonics screens do) serialises 150 ms per stop on an Expo async
worker. Low impact, worth knowing if Android tone switching feels sluggish.

## 14. `Alert.alert` fallback declines are not handled on Android's outside-tap dismissal

**Where:** `src/lib/confirm.ts:60-64`. When `AppDialogHost` is not mounted, `confirmDialog`
falls back to `Alert.alert`. On Android an alert is cancelable by default: tapping outside or
pressing BACK dismisses it without invoking any button's `onPress`, so `opts.onCancel` never
runs. The docblock at `:20-28` says `onCancel` is load-bearing — *"the single-device takeover
whose CANCEL signs the user back out."* Adding `{ cancelable: false }` or an `onDismiss`
closes it. Very low reach: the host is mounted on every real screen
(`RootNavigator.tsx:355`), so this is the dev-harness path only.

## 15. Shadows with no `elevation` on Android, in 10 files

Cosmetic. Files where `shadowColor` appears and `elevation` never does:
`src/screens/lab/meter/vizMeters.tsx` (4), `src/screens/results/TrophyScreen.tsx` (2),
`src/screens/tools/SkinnedTunerVu.tsx`, `src/screens/achievements/GalleryScreen.tsx`,
`src/components/Toggle.tsx`, `src/components/MethodIcon.tsx`,
`src/components/GlassButton.tsx`, `src/components/Confetti.tsx`,
`src/components/nav/NavIcon.tsx`, `src/components/LedMeter.tsx`.

The last two are **deliberate** — `NavIcon.tsx:68` (`glowStyle`) and `LedMeter.tsx:116`
explicitly gate the glow to non-Android/iOS because an Android `elevation` glow is a grey
blur, not a coloured one. `SwitchButton.tsx:230-235` does the same for both its drop shadow
and its glow, and `SpeakButton.tsx:99` for its playing glow. Those four are correct choices,
not bugs. The other six are probably just untested on Android; on a dark UI the visible
result is a card that reads flat rather than raised. Not worth a launch fix.

## 16. Light Pulse: CameraX unbinds on background and rebinds on return, mid-measurement

**Where:** `modules/ape-optical/android/src/main/java/expo/modules/apeoptical/ApeOpticalModule.kt:28-36`
— bound to `ProcessLifecycleOwner`, so *"when the app backgrounds, CameraX auto-unbinds and
releases the camera, then re-binds on return."* The JS side pulls by monotonic seq, so a
background excursion leaves a time gap inside the rolling window the frequency estimate is
computed over. iOS's `AVCaptureSession` behaves differently (it is stopped/started
explicitly). Likely produces one bad reading rather than a wrong stable one, and the
stability label should catch it — but it is an untested Android path on a measurement tool.
**Device test:** arm Light Pulse on a steady 60 Hz source, background the app for five
seconds, return, and check whether the reading recovers or reports a false frequency.

---

# Verified and correct on Android — do not "fix" these

Reported because several look wrong at a glance and cost the next agent time:

- **Microphone permission denial, including "don't ask again".**
  `useDspEngine.ts:32-46` checks first, then requests; `EngineGate.tsx:46-96` renders an
  Android-only ALLOW MICROPHONE key *and* OPEN SETTINGS, with copy that names the
  don't-ask-again case explicitly and never claims a recovery it does not offer. This is
  the best-handled permission path in the app.
- **Camera permission.** `FrequencyCounterScreen.tsx:263-277` maps
  `PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN` to a distinct `'blocked'` state with a
  Settings pointer. Correct.
- **Notification permission and channels (Android 13+).** `localSchedule.ts:256-272` creates
  the channel *before* scheduling and asks for the runtime permission at the moment the user
  turns a reminder on, not at launch; every one of the 7 local schedules passes `channelId`
  (`:299, 314, 358, 397, 418, 451, 474, 494`). `push.ts:118-133` does the same for the push
  channel. `POST_NOTIFICATIONS` comes from the `expo-notifications` plugin. Correct, and the
  timing is better than most apps ship with.
- **`RECORD_AUDIO`.** Declared in `modules/ape-dsp/android/src/main/AndroidManifest.xml` and
  merged by autolinking; `android.permissions` in `app.json` is additive, so listing only
  `CAMERA` there does not suppress it.
- **Input-stream disconnect recovery.** `ApeDspJni.cpp:393-403` — the rate-limited reopen
  watchdog on the owned analysis thread. This is the model finding 1 asks for on output.
- **Route-aware speaker high-pass.** `ApeDspModule.kt:100-113, 463-479` — a real
  `AudioDeviceCallback`, refreshed before every `genStart`/`binStart`/`modStart`, 150 Hz to
  match `speakerSafety`. Android parity with iOS here is good.
- **Bottom safe area.** `components/nav/TabBar.tsx:32` applies
  `paddingBottom: insets.bottom`. Under mandatory edge-to-edge that is the one that mattered
  most, and it is right. 55 sites use `insets.bottom`; I did not find a bottom-anchored
  control that ignores it.
- **`LayoutAnimation`.** All four call sites guard
  `Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental`
  (`Section.tsx:24`, `EnrollmentScreen.tsx:81`, `HomeSetupSheet.tsx:44`,
  `lesson02.tsx:31`) with a comment noting the API is absent on Fabric. Correct.
- **Hardware BACK where it was thought about.** `SplMeterScreen.tsx:853-865` (a six-level
  priority chain), `QuizScreen.tsx:334`, `FinalExamScreen.tsx:398`,
  `cymatics/GalleryScreen.tsx:131`, `HarmonographViewer.tsx:122`, `rack/DockTray.tsx:85`,
  `WaveformScreen.tsx:144`. Seven files, all correct. The gap is finding 5, not the pattern.
- **`keyboardType="numeric"`** (`FieldRow.tsx:347`) — signed and decimal on Android. Correct.
- **`parseQuantity`** (`calcUnits.ts:205-239`) — refuses an ambiguous decimal comma rather
  than mis-parsing it, which is the right behaviour for a phone whose locale uses `,` as the
  decimal separator. Fails honestly.
- **Navigation animation.** `reduceMotionNav.ts:53-57` gives iOS `simple_push` with a tuned
  duration and Android `slide_from_right`, with a comment explaining that
  `animationDuration` is iOS-only in `react-native-screens`. Correct and documented.
- **Production form persistence.** `ProductionStageScreen.tsx:55-64` writes every field
  change to `projectStore()` immediately, so Android BACK out of a stage loses nothing.
- **`predictiveBackGestureEnabled: false`** in `app.json` — correct for an app that
  intercepts BACK in seven screens; predictive back would animate a pop that the handler
  then cancels.

---

# Coverage

**Done thoroughly:**

1. **All 66 `Platform.OS` sites** read in context. Non-iOS branches judged; missing branches
   hunted. The web branches (about half) are out of scope and were skipped after
   identification.
2. **iOS-only props.** `keyboardType` (all 10 sites, checked against the shipped RN mapping),
   `accessibilityViewIsModal` (all 62), `shadow*` vs `elevation` (all 29 files),
   `KeyboardAvoidingView` (all 3), `UTI` (all 3), `includeFontPadding` (all 8 — all
   `false`, which is the Android-correcting value, so all correct).
   `textContentType`, `enablesReturnKeyAutomatically`, `selectionColor` and `SafeAreaView`:
   **zero occurrences in the codebase** — a real and useful negative result. The app uses
   `useSafeAreaInsets` (109 files), not `SafeAreaView`, so there is no `edges` prop to get
   wrong.
3. **Hardware BACK.** All 17 `BackHandler` references, all 70 `<Modal>` sites checked for
   `onRequestClose`, all 15 `gestureEnabled` sites, and the in-tree overlays in the tool and
   lab screens. One losable case (finding 5), three cosmetic, one in-tree scrim (finding 11).
4. **Android audio.** Both native modules read end to end and diffed against the Swift. Four
   findings (1, 2, 3, 4) plus one performance note (13).
5. **Permissions.** Microphone, camera, notifications, media library — all four request paths
   traced including the denial branches. Only `expo-media-library`'s `writeOnly` flag is an
   iOS concept used unconditionally (`harmoExport.ts:77`), and it is harmless: Android
   ignores the argument and the plugin's `granularPermissions: ['photo']` in `app.json`
   already narrows the Android grant to `READ_MEDIA_IMAGES`.
6. **Files, paths, sharing.** `shareImage.ts`, `harmoExport.ts`, `galleryExport.ts`,
   `earPlayer.ts` all read. Everything writes to `FileSystem.cacheDirectory` and shares
   through `expo-sharing`, which ships its own `FileProvider` — no scoped-storage or
   `file://` exposure problem. One finding (8).
7. **Deep links and `app.json`.** `app.json`, `linking.ts`, `linkPaths.ts`,
   `URL_ROUTE_CONTRACT.md`, `web/next.config.ts`, `web/app/**`, `web/public/**`. One finding
   (7) with three parts.
8. **Text and layout.** `includeFontPadding`, `allowFontScaling` (1 site, and it is not
   disabling anything), `numberOfLines`/`ellipsizeMode` (**zero** `ellipsizeMode` in the
   codebase — RN's Android default is `tail`, which is what you want, so this is fine),
   `elevation` vs `shadow*`, edge-to-edge and the bottom inset.

**Not covered, and why:**

- **Android font-scaling and Display-size at 200%.** `SettingsScreen.tsx:517-526` correctly
  points Android users at *Settings › Accessibility › Display size and text* — which on
  Android changes **density** as well as font size, so every `dp` in the app grows. The app
  has a great many fixed `height:` values in `StyleSheet.create`. Whether any of them clips
  cannot be determined by reading; it needs a device at max display size and max font size.
  This is the single largest untested Android surface I am leaving behind.
  **Device test:** Android phone at Display size = largest and Font size = largest, then walk
  the Dashboard, a quiz, a calculator and one lab looking for clipped or overlapping text.
- **The IME inset under mandatory edge-to-edge** (finding 9). I can prove the code
  difference; only a device proves the symptom.
- **Actual Oboe disconnect behaviour** (finding 1). The contract is documented; the symptom
  needs a phone and a headphone jack.
- **Android 14/15 background-microphone behaviour.** The app has no foreground service and no
  `UIBackgroundModes`, so both platforms should stop capture when backgrounded — but Android
  delivers *silence* rather than an error when the mic is cut, and a long Leq or exposure
  integration would average that silence in rather than stopping. `useDspEngine.ts:299-320`
  wires an `AppState` stop, but only when the caller opts in by passing `stop`. I did not
  audit which of the tool screens opt in; that is a good follow-up and belongs with the
  lifecycle agent's axis more than mine.
- **Play Store specifics** — billing, data safety, target-SDK policy. Out of axis and
  already settled elsewhere.
