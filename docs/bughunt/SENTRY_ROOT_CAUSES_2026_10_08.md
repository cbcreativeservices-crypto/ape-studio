# Sentry root causes — 2026-10-08

Owner, 2026-10-08: *"Learn from those crashes. Why did they happen? Is there a
similar situation elsewhere in the app that could trigger a crash the same way?
Investigate elsewhere after — don't just stop at fixing what was found."*

Every Sentry issue open on 2026-10-08 was read from the issue's latest event
(stack, breadcrumbs, device, build). For each ROOT-CAUSE PATTERN: the issue,
why it happened, every other place in the app with the same pattern, and
whether it was fixed (and where). Ratchet tests pin each pattern app-wide:
`test/a11yTreeDepth_20261008.test.ts`, `test/sentryRootCauses_20261008.test.ts`,
`test/autoUpdate.test.ts`, and on the native branch
`test/nativeStopCapture_20261008.test.ts`.

Branches: JS fixes are on **`sentry-fixes`** (OTA-safe). The iOS native fix is
on **`native-ios-fixes`** = `origin/final-lab` + `a54dde1b` (iPad mic fix) +
the stopCapture fix — it moves the iOS runtime fingerprint and ships only in an
owner-ordered build.

---

## Pattern 1 — the accessibility tree is too big and too deep

**Issues:** APE-STUDIO-W (build 34), APE-STUDIO-R (builds 27/30/34, 6 events),
APE-STUDIO-S (build 30). App Hanging ≥ 2000 ms. Every event is an iPhone16/17
Pro on iOS 27 in Cupertino (development kernel) — almost certainly Apple App
Review — and every one lands seconds after `navigation: Dashboard` (the Study
tab), with the breadcrumbs `study_methods`, `student_achievement_progress`,
`rpc/topic_term_counts`, `student_method_progress`, and taps every 2 s on Text.

**Why.** The main thread is inside
`_accessibilityUserTestingSnapshotDescendantsWithAttributes:maxDepth:maxChildren:`
→ `automationElements` → `_accessibilityUserTestingSubviewsSorted` (R, S) and
`_axRecursivelyPropertyListCoercedRepresentationWithError` dozens deep (W): an
accessibility client (UI automation / Accessibility Inspector / VoiceOver)
asking for the whole element tree. That walk visits every native view, and:

* every **react-native-svg** element is a native view. `ElevatedFrame`'s
  powder-coat face drew **240 `<Circle>`s per panel**; the Dashboard's rack face
  (`BlackFaceBg`) **130 more**; each screw 7. The Dashboard has ~8 framed
  panels and 7 rack faces — roughly **3,500 decorative native views**, nested a
  dozen deep, before a single word of content;
* unlabelled `LedMeter`s (21 segment views each), vent fields (78 views each),
  glass sheens — all visible to the walk;
* the Home carousel mounted all ~30 cards (`FlatList` defaults).

A second, related class surfaced in the sweep: **on iOS a `Pressable` is an
accessibility element by default, whatever its role** — a Pressable wrapping
other controls makes them unreachable to VoiceOver and reads every text inside
it as one run-on label (the Glossary popup read only "Back"; the topic intro
read only "Dismiss").

**Fixed (sentry-fixes):**
* `A11Y_HIDDEN` (in `src/features/settings/a11y.ts`) — the house helper that
  hides a decorative subtree on both platforms. (Not its own module: the
  app-start module budget, `test/perfStartTrim_20261004.test.ts`, is a ratchet
  at 260 and stays there.)
* `specksToPaths` (in `src/components/ElevatedFrame.tsx`, a marked pure block
  the ratchet transpiles and unit-tests) — specks drawn as a few `<Path>`s:
  PanelFace 240 → 32 paths, the Dashboard grit 130 → 20, same specks, same
  places.
* `ElevatedFrame` (`PanelFace`), Dashboard `BlackFaceBg`, `CornerScrews`,
  `VentHoles`, `GlassCover` hidden; each Homework / Complete-This-Topic divider
  is ONE header element; unlabelled `LedMeter` hidden (a labelled one stays one
  progressbar).
* **App-wide: all 284 undecided `<Svg>` / `<SvgXml>` roots** (119 files) now
  carry `accessibilityElementsHidden importantForAccessibility="no-hide-descendants"`
  (39 were already labelled and are untouched). Nothing a screen reader could
  use was lost: an unlabelled SVG never read anything.
* Home carousel windowed (`initialNumToRender 3`, `windowSize 7`); its page
  dots are one element ("Card 3 of 24").
* Nested-element fixes (each now readable, and every inner control reachable —
  as itself, or as a custom action on the one element): Flashcards card and
  full-screen body, Glossary definition popup and image viewer, topic intro
  (`LearningIntroSheet`), topic welcome (`TopicWelcomeSheet`), `TrophyModal`'s
  action key, `CredentialThumb` viewer, Enrollment collapsed rows (deck /
  study as actions), `ExposureCheckin` (readings in the label, Dismiss as an
  action), Profile full ID (BRIGHTEN as an action), LED colour picker, SPL full
  VU + full gauge, Waveform chooser, RT60 band table, SPL session log, Cymatics
  gallery cards, lab photo / mic photo lightboxes, connector card.

**Ratchets:** every `<Svg>` root app-wide must decide (hidden, or one labelled
element); no accessible element nested inside another app-wide (shrink-only
allowlist: 13 in Miking lessons — see below); on the fixed screens no
unlabelled element over a block of text and no label mapped over a list; the
texture / Dashboard / LedMeter / Home fixes pinned.

**Not fixed (and why):**
* `src/screens/lab/miking/**` — 13 nested elements (a labelled figure frame
  around a labelled image). Another agent owns that tree today; they are on the
  ratchet's allowlist so the count can only fall.
* Long-form teaching-canvas labels (e.g. Cable Install, Speech, Sound Systems)
  — by design (owner rule: every teaching canvas has a label + text summary),
  bounded in size, and they are one element each: not this hang.
* **Needs a device pass:** run Accessibility Inspector → Audit on the Study
  Dashboard (and VoiceOver through it) on an iPhone; the snapshot should now be
  hundreds of elements, not thousands.

## Pattern 2 — the runtime is torn down while it is rendering (startup reload)

**Issue:** APE-STUDIO-D — fatal `EXC_BAD_ACCESS` in
`RuntimeScheduler_Modern::updateRendering` on the JS thread. Two users: build
24 (2026-09-19) and build 32 (2026-10-05, iPhone 17 Pro, iOS 26.6.2). Build 32:
embedded launch, Splash on screen, 31 OTA asset downloads finishing at
02:28:35.99 — and the crash 40 ms later, 3 s after launch.

**Why.** `expo-updates` checks on every launch. When the download finished,
our `startAutoUpdate` heard "update pending" and called `Updates.reloadAsync()`.
expo-updates then tears the React host down from the MAIN thread
(`RelaunchProcedure` → `RCTTriggerReloadCommandListeners`) while the JS thread
is still running startup work — and every JS event-loop tick ends in
`updateRendering`. Build 24 reloaded inline; build 32 deferred it with
`InteractionManager`, which in RN 0.86 is a same-tick microtask, so the reload
still landed inside a tick that rendered. Build 34 has the `runSoon` macrotask
(2026-10-04), which only moves the reload to the *next* tick — which also ends
in `updateRendering`. **So build 34 still had the cause.**

**Fixed (sentry-fixes):** `watchForPendingUpdate` never reloads while the app
is in the foreground. An update found in the startup window is applied the next
time the app goes to the **background** (nothing on screen, no render in
flight; and if anything still failed there, iOS just cold-launches the app next
time instead of crashing it in front of the person or App Review). A late find
waits for the next cold launch, as before. No work is chained after
`reloadAsync()` any more.

**Elsewhere:** `reloadAsync` has exactly one caller; no `DevSettings.reload`,
no restart library, no `location.reload` — ratcheted.

## Pattern 3 — a native audio call made after iOS tore the session down

**Issue:** APE-STUDIO-T — fatal `EXC_BAD_ACCESS` in
`AVAudioEngineImpl::UpdateInputNode` ← `-[AVAudioEngine inputNode]` ←
`ApeDspModule.stopCapture` (iPad Pro 12.9", iOS 26.6.1, build 27). Breadcrumbs:
Tools hub 12:51:06 → landscape → background 12:51:11 → crash 12:59:36, still
in the background.

**Why.** Two halves:
* **JS:** the Tools hub's background stop called the engine's `stop()`, which
  only *schedules* `ApeDsp.stop()` behind micSession's 1.5 s warm window. iOS
  freezes JS timers when it suspends the app, so the stop ran when the process
  was next woken — eight minutes later.
* **Native:** `stopCapture` then read `engine.inputNode` to remove the tap.
  That is not a property read: AVAudioEngine rebuilds the input node against
  the current hardware, and the session had been torn down behind the
  suspended app.

**Fixed:**
* sentry-fixes (JS, OTA): `flushPendingRelease()` (micSession), called from
  the root `AudioOutputGate`'s existing `'background'` branch — any
  already-scheduled mic release runs the moment the app goes to the
  background; the hub now `stop()` + `releaseMicNow()` like the tools.
* native-ios-fixes (build): `stopCapture` never touches `inputNode` (each
  capture has its own engine; releasing it drops the tap), is idempotent and
  re-entrancy safe; capture is closed natively on
  `didEnterBackgroundNotification` and never opened in the background (start
  and watchdog refuse; `desiredRunning` is kept so it reopens on return);
  `startCapture` refuses before `engine.inputNode` when there is no input
  route; a media-services reset drops every AVAudio object without calling into
  them; `genStart/Stop`, `binStart/Stop`, `modStart/Stop` now run on the main
  queue with the observers (they raced them on Expo's background queue).
  (Builds 33/34 already carry the earlier guard — stop the engine first, only
  touch `inputNode` with an input route — which narrows but does not close the
  race.)

**Elsewhere (swept):** every `ApeDsp.start/stop/genStop/binStop/modStop` call
site; every AppState handler. Output voices stop immediately on background
(AudioOutputGate → `panicMuteAudio` / `stopAllSound`, no timer). The tools'
background handler already hard-released. `ape-optical` (camera) stops in its
effect cleanup the moment the app backgrounds, on its own serial queue —
safe. Android `ApeDspModule.kt` `stop` only calls into its own native handle
(no AVAudio equivalent of `inputNode`) — no change. Ratchet: a background
handler that schedules `releaseMic()` must also `releaseMicNow()`; the root
flush is pinned.

## Pattern 4 — a Supabase realtime channel reused after `subscribe()`

**Issue:** APE-STUDIO-5 — "cannot add `postgres_changes` callbacks for
realtime:active_device_watch after `subscribe()`" (dev build, 2026-09-16).

**Why.** `supabase.channel(topic)` returns the EXISTING channel for a topic,
and `removeChannel()` is asynchronous — a remount (Fast Refresh, an auth
re-render) got the live channel back and `.on()` threw.

**Fixed already** (9a09158e, 2026-09-21): a unique topic per mount, removed on
cleanup. **Elsewhere:** it is the only realtime channel in the app. Ratchet: no
channel topic may be a fixed string, and every file that opens one removes it.

## Pattern 5 — a hook called conditionally

**Issue:** APE-STUDIO-V — "Rendered more hooks than during the previous
render" (build 30, 2026-09-26). Sentry's culprit `pick(MatchCurve)` is a
**source-map mismatch** (an OTA bundle symbolicated with the build-30 map); the
raw stack and the React component stack both say `ShareTermSheet` on the
Glossary screen.

**Why.** ShareTermSheet's `useState` sat below `if (!payload) return …`, so
opening the share sheet ran one more hook than the closed render.

**Fixed already** (0f317b6d, 2026-09-28). **Elsewhere:** an AST sweep of every
component and hook in `src/` for hooks after an early return, inside a branch
/ loop / try, or after `&&` / `?:` / `??` found none (the only loops are
vizWave's constant-count colour buckets; the only `try` is Miking's
`useFocusedSafe`, which calls the hook first, unconditionally). Ratchet: that
sweep runs on every test pass — it fails on the original ShareTermSheet code.

## Pattern 6 — Skia on web without WebGL

**Issue:** APE-STUDIO-G — "failed to create webgl context: err 0" (11 events,
web preview, 2026-09-20).

**Why.** CanvasKit's `MakeWebGLCanvasSurface` THROWS when the browser will not
give it a WebGL context (no GPU, a hidden preview pane, the ~16-context cap);
Skia calls it from the canvas's `onLayout`, uncaught. Home's featured-card
shimmer mounts a fresh `<Canvas>` every pass.

**Fixed (sentry-fixes):** `src/lib/skiaWebFallback.ts`, installed in `index.ts`
right after CanvasKit loads — a WebGL failure falls back to CanvasKit's CPU
surface. Web only; native untouched. Ratchet + unit test with a fake CanvasKit.

## Pattern 7 — an unhandled fetch rejection

**Issue:** APE-STUDIO-E — "TypeError: Failed to fetch" from Skia's `loadData` →
`Skia.Data.fromURI` in an effect (web preview, Tools → Waveform).

**Why.** react-native-skia's `useImage` / `useFont` / `useTypeface` / `useData`
call `loadData(...).then(setData)` with no rejection handler.

**Fixed (sentry-fixes):** `src/lib/skiaSafeAssets.ts` (`useSafeSkiaImage`,
`useSafeSkiaFont`) — the same loader, a failure reads as "not loaded". Both
users (Wave lab head icon, Amplitude dynamics font) switched. **Elsewhere:** the
only other raw `fetch` (lab clip buffer) is awaited inside its own try.
Ratchet: Skia's unguarded asset hooks are banned in `src/`; no
`Skia.Data.fromURI` without a `.catch`.

## Dev-only noise — no change needed

* **APE-STUDIO-J / N / 8** — `safeDeckIndexForAccent is not defined`,
  `getSessionSafe is not a function`, `CREDENTIAL_COPY is not defined`: web dev
  preview, `dev=true`, inside `HMRClient` / `scheduleRefresh` (Fast Refresh
  mid-edit, the old name still referenced for one save). None of the three
  names is referenced anywhere in `src/` today (they were renamed:
  `safeSession`/`safeSessionResult`, `CREDENTIAL_COPY_BY_SLUG`, …), and
  `tsc --noEmit` is clean.
* **APE-STUDIO-3/6/A/H/K/7/C/9/4/B/M** — Metro `TransformError` /
  `UnableToResolveError` while files were mid-edit (web dev, 0 users).
* **APE-STUDIO-1/2** — the telemetry self-test (dev).
