# Bug hunt — Pass 2, agent E: lifecycle, teardown and leaks

Axis: what keeps running after the user has moved on — battery, stuck meters,
audio that will not stop, state that outlives the thing it describes.

Pass 1 (`pass1-state-hooks.md` §3) swept ~240 timer/listener/rAF sites against
**unmount** and reported none leaked. I re-checked that claim and agree with it
as stated: I found no interval, listener or rAF that survives unmount. So this
pass goes at the three axes that sweep did not cover:

1. **blur** — a root-stack screen that is navigated *over* stays mounted, and a
   `useEffect` cleanup never runs;
2. **AppState `background`** — Home button, lock screen, an incoming call;
3. **state that outlives the resource** — a transport that still says PLAYING
   after something else silenced the native voice.

All three turned up real defects. The unmount hygiene is genuinely excellent;
the blur and background hygiene is inconsistent, and where it is missing it is
missing on the loudest and most expensive screens in the app.

**Headline:** `src/screens/lab/` contains **zero** uses of `AppState`. Seventeen
labs can start a native audio voice and not one of them stops it when the app
leaves the foreground.

---

# Findings

## E1. Every lab keeps sounding when the app is backgrounded — on Android the tone never stops

**Severity:** BLOCKER
**Confidence:** high on the JS half (verifiable by reading); high on the Android
native half; medium on iOS (see below — a device check settles it)

**Where:**
- `src/screens/lab/OscillatorLabScreen.tsx:183` — `useFocusEffect(useCallback(() => () => stopTone(), [stopTone]))` and nothing else
- the same idiom, with the same omission, in all 17 voice-starting labs:
  `AutotuneLabScreen`, `BassLabScreen`, `FmLabScreen`, `FxLabScreen`,
  `NoiseLabScreen`, `HarmonographLabScreen`, `SignalChainLabScreen`,
  `BinauralLabScreen:132`, `ModularLabScreen:236`, `HarmonicsView.tsx:1492`,
  `foundations/FoundationsCourseScreen`, `foundations/FoundationsPlaygroundScreen`,
  `eq/modules/eqAudition`, `digital/modules/modAnalog`,
  `cymatics/useDriveTone.ts:134`, `cymatics/modules/modHarmony.tsx:122`
- `src/features/audio/AudioOutputGate.tsx:149` — the app's only root AppState
  handler for audio, and it acts **only** on `state === 'active'`
- `modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt` —
  no `requestAudioFocus`, no `OnAudioFocusChangeListener`, no activity-pause hook
- `modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp:25` — Oboe output stream

**What the user does:** starts a tone in any lab (Oscillator, Noise, FM,
Cymatics drive…), then presses Home, or the phone locks, or a call comes in.

**What happens:** `useFocusEffect` fires on *navigation* blur, not on app
background — pressing Home does not blur a navigation screen. Nothing else in
the tree is listening. On Android the Oboe output stream is not bound to the
activity and holds no audio focus, so the tone plays on out of the speaker
indefinitely, with no notification, no media control, and no way to stop it
except finding the app again or force-killing it. With no audio focus requested,
it also does not duck or yield to anything else the phone wants to play.

**What should happen:** leaving the foreground silences the app, exactly as
`TuningPlayer` already does — `src/features/tuning/tuningAudio.ts:35`:
`AppState.addEventListener('change', s => { if (s !== 'active') this.stop(); })`.
That one class is the only place in the app that gets this right.

**Why I believe it:** `grep -rn AppState src/screens/lab/` returns nothing. The
only root AppState handler that touches audio (`AudioOutputGate.tsx:149`) has a
single branch and it is `state === 'active'`. The Kotlin module's only
`AudioManager` uses are device-enumeration and route/HPF refresh
(`ApeDspModule.kt:112,124,152,430,437,458`); there is no focus request anywhere.

**iOS caveat:** `app.json` has no `UIBackgroundModes: ["audio"]`, so iOS should
suspend the process and the tone should stop by itself. That is the good case —
but see E2, which is the bad half of the same gap on iOS.

**Suggested fix:** one root component beside `ShakeToMute`/`MicFeedbackGuard` in
`App.tsx` that calls `stopAllFilePlayers()`, `ApeDsp.genStop()`, `binStop()`,
`modStop()` and `Speech.stop()` on any non-`'active'` AppState. That is
`panicMuteAudio()` minus `disableAudioOutput()` — the gate should stay open so
returning does not demand a fresh 5-second hold. Android audio focus is the
proper native fix and is a larger job; the JS guard closes the user-visible hole
now. Note that fixing this alone leaves E5 (the transport still says PLAYING).

---

## E2. A phone call permanently silences the generator with no sign on screen (iOS)

**Severity:** MAJOR
**Confidence:** medium-high — the code asymmetry is unambiguous; the exact
AVAudioEngine state after an interruption wants a device check

**Where:**
- `modules/ape-dsp/ios/ApeDspModule.swift:604-631` — the interruption observer
- `:613-616` — `case .began: if self.running { self.interrupted = true; self.stopCapture(...) }`
- `:518-535` — the 2 s watchdog, guarded on `desiredRunning`, which is set only
  by capture `start`/`stop` (`:68`, `:73`)
- `:318-322` — `startGeneratorOutput()`: `if let e = outEngine, e.isRunning { return }`

**What the user does:** is in a lab with a tone running when a call arrives,
Siri fires, or an alarm goes off.

**What happens:** iOS deactivates the session and the tone stops (correct). The
interruption handler deals with **capture only** — `running` is the capture flag,
`stopCapture` is the capture teardown, and `desiredRunning` is the capture
intent. Nothing touches `outEngine`, `core.genStop()` or the generator. When the
interruption ends, the watchdog restarts *capture* and the generator is simply
gone. The lab's React state still has `running === true`: the transport shows ■,
the pilot lamp is lit, the 500 ms `noteAudioActivity` keepalive is still
ticking, and there is no sound. The user has to guess that STOP-then-START will
fix it.

**What should happen:** either the generator resumes with capture, or the lab is
told it stopped so the transport drops to ▶.

**Why I believe it:** the asymmetry is explicit in the file — capture has an
`interrupted` flag, a `desiredRunning` intent and a watchdog that works toward
it; the generator has none of the three. `startGeneratorOutput`'s
`if e.isRunning { return }` guard shows the author expected the engine to be
re-entered, so a manual restart does heal it — which is why this reads to the
user as "the lab broke" rather than "the lab crashed".

**What would settle it:** on the iOS 27 phone (memory: that pass is already
owed), start the Oscillator Lab tone, ring the phone, decline the call, and see
whether the tone returns. Same test for lock/unlock.

---

## E3. The Cymatics studios keep a 56×56 field solver and a 60 fps frame callback running behind every screen you push over them

**Severity:** MAJOR (BLOCKER on a mid-range Android — this is sustained
JS-thread + UI-thread work on a screen the user has left)
**Confidence:** high

**Where:**
- `src/screens/lab/cymatics/PlateStudioScreen.tsx:206-227` — sweep interval
- `src/screens/lab/cymatics/MembraneStudioScreen.tsx:189-212` — same
- `src/screens/lab/cymatics/LiquidStudioScreen.tsx:216-223` — same
- `PlateStudioScreen.tsx:143-156` — `grid = useMemo(() => sampleField(spec, modes, freq, Q, GRID_N), [… freq …])`, `GRID_N = 56` (`:50`)
- `PlateStudioScreen.tsx:122` `silentDrive`, `:199` `driving = tone.running || silentDrive`, `:531` `running={driving}`
- `src/screens/lab/cymatics/vizPlate.tsx:308-311`, `vizLiquid.tsx:146-149`, `vizMembrane.tsx:129-132` — `useEffect(() => { cb.setActive(true); return () => cb.setActive(false); }, [cb])`
- none of the three studio screens contains `useIsFocused`, `useFocusEffect` or `AppState` (verified by grep)

**What the user does:** opens the Chladni Plate Studio, taps **▶ Sweep the
modes**, and while it runs taps **Open the gallery ›** (`:559`) or **Guided
experiments ›** (`:620`).

**What happens:** those are `navigation.navigate` calls on the **root** stack, so
the studio stays mounted behind the pushed screen. The sweep's 125 ms interval
is not cleared — its effect deps are `[sweeping, modes]` and neither changes —
so it keeps calling `setFreq` 8 times a second, forever. Each `setFreq`
invalidates the `grid` memo, which runs `sampleField` over 56×56 = 3,136 cells
against up to 16 modes, ~8 times a second, on the JS thread, on a screen nobody
is looking at. With the MULTI (dual-frequency) chip on it is two full passes per
tick. Separately, `cb.setActive(true)` is unconditional, so each mounted studio
also holds a live `useFrameCallback` firing every display frame; with **Silent
drive ON** (`:385`, a user-facing chip) `driving` stays true through blur — the
tone stops but the full particle integrator in `vizPlate.tsx:209` keeps running
at 60–120 Hz on the UI thread.

Open two studios in a session and you have two of each, since they are three
separate root routes (`RootNavigator.tsx:483-485`).

**What should happen:** blur stops the sweep, drops `silentDrive`, and
deactivates the frame callback — the studio rests until the user comes back.

**Why I believe it:** the same lab already does it right one directory down.
`CymaticsModuleScreen.tsx:57` takes `useIsFocused()` and threads it to every
animated child — `modHarmony.tsx:310` `running={focused}`,
`modSystems.tsx:223-227` the same — and `vizPlate.tsx:689`
(`PressureWaveStrip`) and `foundations/viz.tsx:201,235` both use
`cb.setActive(running)`, the correct form, with `viz.tsx:190` documenting *why*.
The three studio screens are the only members of the family that skipped it.
Memory records Cymatics Phase 4 as built-but-uncommitted and awaiting a device
pass; this is exactly the class of thing that pass would surface as "the phone
gets hot".

**Suggested fix:** each studio takes `const focused = useIsFocused()`, then
`if (!sweeping || !focused) return;` in the sweep effect, `const driving =
focused && (tone.running || silentDrive)`, and the three viz files change
`cb.setActive(true)` to `cb.setActive(running)`.

---

## E4. Low-Light Production Mode silently consumes the once-per-day hearing-dose warning

**Severity:** MAJOR (a safety promise not kept)
**Confidence:** high

**Where:**
- `src/features/audio/exposureMonitor.ts:478-489` — the producer
- `src/features/audio/ExposureCheckin.tsx:99-105` — the consumer
- `exposureMonitor.ts:347-352` — the latches reset only on day rollover

**What the user does:** engages Low-Light Production Mode (a dark studio, a
long session on headphones — precisely the person this dosimeter exists for) and
works past 100 % of the daily dose.

**What happens:** `tick()` runs
`if (!reachedFiredToday && d.dose >= 1) { reachedFiredToday = true; d.warnings += 1; emitCheckin('reached'); }`.
The latch is set and the day's warning count incremented **before** the listener
runs. `ExposureCheckin`'s listener then opens with
`if (areOverlaysSuppressed()) return;`. The panel never appears, and because
`reachedFiredToday` is now `true` and is only cleared by `rollDayIfNeeded()` or
an explicit delete, **it never fires again that day** — not when the user leaves
Low-Light mode, not when the dose goes on climbing. The same applies to
`approaching` (`:479`) and to routine check-ins, which are also dropped when the
user is not on an `AUDIO_ROUTES` screen (`:104`) after `d.checkins` has already
been incremented — so the Exposure Monitor screen reports check-ins the user
never saw.

**What should happen:** Low-Light suppresses the *presentation*, not the event.
The latch should be consumed only by an actually-shown warning, and a dose
warning that could not be shown should be re-offered when suppression lifts.

**Why I believe it:** the ordering is plain in the two files. It is also the one
`useOverlaysSuppressed` consumer that does **not** follow the house pattern —
pass 1 §3 checked six of them and found every one gates at *render* time on the
current value (`coachMark.ts:98`, `ScreenIntroOverlay.tsx:84`,
`TopicWelcomeSheet.tsx:118`, `Celebration.tsx:52-63`, `LearningIntroSheet.tsx:43`,
`useMethodCelebration.ts`). This one gates at *emit* time and throws the event
away. The structural safety the rest of the app has, this surface does not.

**Note for whoever fixes it:** the hard rule is that nothing may auto-appear in
Low-Light mode, and that rule should hold. The fix is to keep the event pending
(don't set the latch until it is delivered), not to show the panel anyway.

---

## E5. Shake-to-mute and the mic interlock leave every lab transport showing PLAYING over silence

**Severity:** MAJOR
**Confidence:** high

**Where:**
- `src/features/audio/panicMute.ts:20-39` — stops every native voice, updates no React state
- `src/features/audio/MicFeedbackGuard.tsx:17-21` — `if (muted) void ApeDsp.genStop();`, likewise
- `src/features/audio/audioOutputStore.ts:103-122` — `disableAudioOutput()`
- consumers of `useAudioOutputEnabled`: `AudioBorderFrame.tsx`, `AudioOutputRow.tsx`, `ShakeToMute.tsx` — **no lab or tool screen subscribes**

**What the user does:** is in the Plate Studio (or Oscillator, Noise, FM…) with
a tone running and shakes the phone — plausible in a cymatics lab, and the
behaviour the Sound Safety Warning advertises in writing.

**What happens:** `panicMuteAudio()` silences everything natively and re-locks
the gate. The lab's own `running` state is never touched, because nothing tells
it. So the transport still shows ■ / STOP, the pilot lamp is still lit, the
500 ms `noteAudioActivity` keepalive interval is still running (it no-ops
internally, but it never stops), and in Cymatics `useDriveTone.retune` still
returns early on `!running === false` — so **the plate pattern keeps responding
to the frequency fader with no sound at all**. A cymatics lab that shows a
pattern forming at a frequency it is not actually playing is teaching something
untrue.

The same desync arrives by a second door: `MicFeedbackGuard` calls
`ApeDsp.genStop()` app-wide whenever the mic goes hot without the override, and
its own comment names itself "the belt-and-suspenders cut for every **other**
screen" — those other screens have no idea it happened. `HarmonicsView.tsx:1304-1308`
is the only screen that keeps its `genRunning` in step with the interlock.

**What should happen:** a lab whose voice has been cut from outside drops back to
▶ and stops its keepalive.

**Why I believe it:** the grep for `useAudioOutputEnabled` consumers is the whole
argument — three files, none of them a lab or a tool.

**Suggested fix:** the smallest correct change is one line per lab —
`const audioOn = useAudioOutputEnabled();` plus
`useEffect(() => { if (!audioOn && running) stopTone(); }, [audioOn, running])`.
Better, put it in a shared `useNativeToneTransport` hook, since 17 labs repeat
this block verbatim already.

---

## E6. A tool can open the microphone on a screen the user has already left

**Severity:** MAJOR (privacy — the OS mic indicator lights behind another
screen, against this module's own stated promise)
**Confidence:** high on the code path; medium on how often a user hits the window

**Where:**
- `src/features/tools/engine/useDspEngine.ts:263-295` — `useToolAutoStart`'s deferred fire, with **no focus check**
- `:242-261` — the bounded re-arm
- `:194-209` — the blur teardown whose comment states the promise: *"the mic must not stay hot behind another screen (spec §18 + privacy copy)"*
- `src/screens/tools/SplMeterScreen.tsx:1609-1617` — the escape hatch, rendered whenever `state === 'idle'`

**What the user does:** opens the SPL Meter and, in the first moment — before
the mic has finished opening — taps **VIEW SAVED MEASUREMENTS**.

**What happens:** `useToolAutoStart` defers `start()` behind
`InteractionManager.runAfterInteractions` with a 1.5 s fallback, and the comment
at `:277-280` records that a held interaction handle can push that out further.
The library link is rendered at `state === 'idle'`, which is exactly that
window. `navigation.navigate('ToolLibrary', …)` pushes on the root stack, so
SplMeter **blurs without unmounting** — the pending `fire` is not cancelled
(only an unmount cancels it), so `start()` runs and `acquireMic()` opens the
microphone while the user is reading a list.

There is a second route to the same place. If `start()` was already in flight,
the blur cleanup takes the state `'starting' → 'idle'`; `ranOnce` is still
false, so the re-arm at `:257` clears `done.current`, the state change re-runs
the effect at `:263`, and it starts again — on the blurred screen. Both paths
end with `setMicActive(true)`, which arms the app-wide feedback interlock (so
`MicFeedbackGuard` silences the speaker everywhere, see E5) and arms
`exposureMonitor`'s 1 Hz poller against a session nobody is watching. It is
bounded — leaving the tool for good unmounts it and releases — but for the rest
of that visit the mic is hot behind another screen.

**What should happen:** `useToolAutoStart` refuses to fire when the screen is not
focused, and the re-arm is likewise focus-gated.

**Why I believe it:** the fire path has no focus reference of any kind; the
screen's own `useFocusEffect` re-arm at `SplMeterScreen.tsx:588-593` shows the
author knew refocus was the right trigger and applied it there but not in the
shared hook.

**Suggested fix:** `const isFocused = useIsFocused();` in `useToolAutoStart`,
then `if (!isFocused) return undefined;` at the top of the effect at `:263` and
`isFocused &&` in the re-arm condition at `:257`.

---

## E7. Two live-microphone lab modules ignore the user's "Release microphone in the background" setting

**Severity:** MAJOR
**Confidence:** high

**Where:**
- `src/screens/lab/eq/modules/LiveSpectrumEq.tsx:284` — `useToolAutoStart(state, onStart)` — **no third argument**
- `src/screens/lab/eq/modules/SeeingFrequency.tsx:304` — same
- `src/screens/lab/HarmonicsView.tsx:972` — `useDspEngine(...)` with no `useToolAutoStart` at all
- `src/features/tools/engine/useDspEngine.ts:308-309` — `useEffect(() => { if (!stop) return undefined; …AppState… }, [stop])`
- `src/features/settings/store.ts:24-28,58` — the setting, default ON, described as *"the mic stops immediately"*

**What the user does:** has "Release microphone in the background" on (the
default), opens the EQ Lab's **Live Spectrum** or **Seeing Frequency** module, or
the Harmonic Lab's LIVE mode, and presses Home.

**What happens:** the background-release handler is wired only when the caller
passes `stop`. These three callers do not, so the effect returns immediately and
no AppState listener exists. Nothing releases the mic; `useDspEngine`'s only
teardowns are blur and unmount, and pressing Home is neither.

**What should happen:** the mic releases, as the setting says, on every screen
that holds it.

**Why I believe it:** this exact bug was found and fixed twice before under the
tag **B-170** — `MultiMeterScreen.tsx:716-722` ("This screen starts manually …
so it never opted in via `useToolAutoStart` and the mic stayed hot behind the
Home button") and `ToolInfoScreen.tsx:90-96`. Both fixes hand-rolled the same
handler. The EQ lab's two live modules and HarmonicsView are the remaining
members of the same set; the comment at `useDspEngine.ts:299` ("TOOLS only")
explains why they were not considered, but they hold the microphone just the
same.

**Suggested fix:** pass `stop` at all three call sites. `useToolAutoStart`
already does the rest, and reads the setting at event time.

---

## E8. The SPL meter's rAF loop dies permanently if one native read throws

**Severity:** MINOR (hardening — a stuck meter with no recovery)
**Confidence:** medium — it depends on whether `ApeDsp.getMeterFrame()` can
throw across the JSI boundary, which I could not settle by reading

**Where:** `src/features/tools/engine/useRafFrameLoop.ts:26-40`

```js
const tick = (now: number) => {
  if (!alive) return;
  cb.current(now);                    // ← a throw here …
  raf = requestAnimationFrame(tick);  // ← … never reaches this line
};
```

**What happens:** the callback at `SplMeterScreen.tsx:987` is 70 lines of
per-frame work over a native frame. One throw — a bridge hiccup, a released
module, a `NaN` reaching something strict — and the loop is not rescheduled. The
needles freeze at their last value, `STALE_FRAME_MS` never clears them because
the stale check lives *inside* the dead loop, and there is no error to see. The
screen presents a frozen frame as live, which the measurement-tools spec §1.7
explicitly forbids. Only leaving and re-entering the tool recovers it.

**Fix:** `try { cb.current(now); } finally { raf = requestAnimationFrame(tick); }`.

---

## E9. NavIcon's fader excursion animation is not stopped on unmount

**Severity:** MINOR
**Confidence:** high, impact low

**Where:** `src/components/nav/NavIcon.tsx:148-160`

The cleanup sets `stopped = true` and calls `loops.forEach(l => l.stop())`, but
the in-flight excursion `Animated.sequence(...).start(...)` at `:150` is never
captured in a variable and never stopped — only the (already-stopped) loop
object in `loops[i]` is. A native-driver animation carries on against a detached
`Animated.Value` after unmount. Harmless in practice because the icon lives in
the tab bar and effectively never unmounts; worth a line if the file is touched.

---

## E10. `dragRail`'s "show me" animation runs to completion after unmount, and stacks on a double tap

**Severity:** MINOR
**Confidence:** high, impact low

**Where:** `src/screens/lab/tuning/components/dragRail.tsx:83-99`

`showMe()` adds an `anim` listener and starts a 900 ms timing whose completion
callback fires `onChange` and `onSettle` on the parent. `useEffect(() => () =>
anim.removeAllListeners(), [anim])` removes the listener on unmount but does not
stop the animation, so the completion callback still runs against a gone parent
(React 18 no-ops it). Two taps inside 900 ms start two animations and two
listeners on the same value.

**Fix:** hold the `CompositeAnimation` in a ref, `.stop()` it in the cleanup and
at the top of `showMe()`.

---

## E11. A concurrent `EarClipPlayer.load()` strands its temp WAVs

**Severity:** MINOR (disk, not memory — and the one live caller already guards it)
**Confidence:** high on the mechanism, low on reachability today

**Where:** `src/features/ear/earPlayer.ts:107-130,190-194`

`load()` starts with `await this.unloadFiles()`, which frees whatever is in
`this.files` *at that moment*, and only assigns `this.files = uris` at `:130`,
after the write loop. Two overlapping `load()` calls therefore both see an empty
`files`, and the first call's WAVs (up to ~2 MB each) are overwritten by the
second's assignment with nothing left holding their paths.

This is not currently reachable: `kit.tsx:234-236,276-282` added
`renderingSigRef`/`renderSeqRef` specifically to collapse the overlap, and the
file's own comment at `:225` names this exact consequence. `TuningPlayer.play`
serialises with `token`. It is worth making `load()` itself safe rather than
relying on every caller to remember — track the in-flight uris and free them if
superseded.

---

# Verification of pass-1 fixes in my area

- **`filePlayers.ts` / shake-to-mute over file playback** — the registry is
  sound and its three producers are covered. Registration is fused to
  `applyCeiling` (`outputCeiling.ts:77`), and I confirmed there are exactly
  three player-creation sites in `src/` — `earPlayer.ts:135`,
  `LabAudioPlayer.ts:83`, `AudioPlayer.tsx:52` — and all three call it. Release
  sites unregister (`earPlayer.ts:163,201`, `LabAudioPlayer` `dispose()`,
  `AudioPlayer.tsx:67`). **No uncovered creation or release site exists.** One
  gap worth naming: `stopAllFilePlayers()` sets `volume = 0` permanently
  (`filePlayers.ts:73`), and `LabAudioPlayer.play()` reuses a live player via
  `replace()` without re-applying the ceiling — so a panic-muted player stays at
  zero. That is pass 1's "output ceiling not re-applied when a player is reused"
  and I am not re-reporting it, only confirming the registry does not fix it.
- **`AudioPlayer.tsx` output ceiling** — present at `:66-68`, applied via
  `applyCeiling(player)` on `[player]`, cleanup unregisters only (correct —
  `useAudioPlayer` owns the instance's lifetime).
- **`FirstRunCoordinator` early return above hooks** — fixed as described.
  `FIRST_RUN_ENABLED === false` short-circuits at the component boundary
  (`:59-62`), so the 250 ms poll at `:97` never mounts at all.
- **`useLabAudio` / `LabAudioPlayer`** — still has no consumers, so pass 1's F16
  remains latent as stated. Note that **`LabAudioPlayer.ts` still contains a raw
  NUL byte** despite the comment at `:34-41` claiming it was replaced with an
  escape — `git status` shows the file modified and `grep` still classes it as
  binary. Pass 1's F18 is not yet fixed; I mention it only because it means
  every repo-wide `grep` (including several of mine) is still skipping that file.

---

# Coverage

## Swept exhaustively

- **All 71 `setInterval` sites** in `src/`. Every one is cleared on unmount
  (pass 1's finding holds). I re-checked each for *blur* and *background*: the
  three Cymatics studio sweeps (E3) are the only ones that keep doing real work
  behind a pushed screen. The 15 `setInterval(noteAudioActivity, …)` keepalives
  all clear correctly but outlive the sound itself (E5).
- **All 111 `setTimeout` sites.** No self-rescheduling pseudo-interval anywhere.
  The three files with more `setTimeout` than `clearTimeout`
  (`EarModuleScreen.tsx`, `mixing/kit.tsx`, `mixing/pagesAdvD.tsx`) are all
  one-shots guarded by `aliveRef`/token counters.
- **All `requestAnimationFrame` sites.** Only one is a loop
  (`useRafFrameLoop.ts`, E8); the rest — `AwardsScreen:447,630`,
  `CourseSelectionScreen`, `CurriculumScreen`, `GlossaryScreen`,
  `InsideStats`, `cableinstall/motion.tsx`, `CenterLockTuner` — are single-shot
  post-layout scrolls that need no cancel.
- **All `addListener` / `addEventListener` sites.** Every one is removed. The
  four files with more adds than removes are all correct on inspection:
  `supabase.ts:30` and `GlossaryScreen.tsx:142` are deliberate module-scope
  app-lifetime listeners, `dragRail.tsx:91` pairs with `removeAllListeners`,
  `exposureMonitor.ts:537` is inside a `booted`-guarded init. **No listener is
  removed with a different function identity than was added** — the codebase
  uses RN's subscription-object API throughout and never calls
  `removeEventListener`, which removes that entire failure class.
- **All 14 `AppState` handlers.** Ten are correct. The gaps are the *absences*:
  E1 (no lab handler at all), E7 (three mic screens that never wire one).
  `SingleDeviceGuard`, `sync.ts`, `hubPreviewEngine`, `LowLightLayer`,
  `MultiMeterScreen`, `ToolInfoScreen`, `QuizScreen`, `FinalExamScreen`,
  `App.tsx` and `tuningAudio.ts` all register once and remove on cleanup, with
  no double-arm path (every module-scope registration is either at import time
  or behind an idempotence guard).
- **All `withRepeat` / `Animated.loop` sites** — every file has at least as many
  `cancelAnimation`/`.stop()` calls as loop starts. `AwardsScreen`'s `BackSweep`
  (`:279-281`) is the model: `alive` flag, `clearTimeout`, `clearInterval` and
  `cancelAnimation(x)` in one cleanup.
- **All 5 `useFrameCallback` files** — `foundations/viz.tsx` and
  `vizPlate.tsx:689` gate correctly on `running`; the three Cymatics studio
  visualisers do not (E3). `SkinnedVu.tsx` checked, clean.
- **Every sensor and capture path** — `ShakeToMute` (accelerometer, subscribed
  only while audio is enabled, with a correct `cancelled` guard around the
  `isAvailableAsync` await), `useShake`, `micSession`, `useDspEngine`,
  `opticalCounter`.

## Checked and found clean — worth recording

- **`micSession.ts`** is the best-reasoned file I read this pass. The `startGen`
  token, the debounced release, the `captureAlive()` adopt-or-restart check and
  the `forceRestart` drain are all correct, and the docblock at `:39-49`
  describes precisely the leak class I was hunting. I could not break it.
- **`opticalCounter.ts` + `ape-optical`** — clean, including the case I expected
  to fail. The `cancelled` branch at `:118-124` closes a camera session that
  opened after teardown, and the Android module binds to `ProcessLifecycleOwner`
  (`ApeOpticalModule.kt:28-35`) so CameraX auto-unbinds on background and
  re-binds on return. `LightPulseMode` (`FrequencyCounterScreen.tsx:283`) has no
  navigation of its own, so its only exit is `goBack()` → mode `null` → unmount →
  `Optical.stop()`. **No camera leak.**
- **`hubPreviewEngine.ts`** — the one screen that gets every axis right at once:
  `useIsFocused` **and** AppState **and** a nav lock, with the lock deliberately
  held as state rather than a ref (`:172-180`) so clearing it re-runs the effect.
  If E1/E3/E6/E7 need a reference implementation, this is it.
- **`MainTabs.tsx` `resetToRootOnBlur`** — a tab switch resets the Study and
  Achievements stacks to root, so an in-progress study method unmounts and its
  audio releases. The guard at `:32-38` (do not reset when the blur came from a
  root-stack push over the tabs) is correct. **Scenarios' `<AudioPlayer/>`
  therefore has no leak path** — the screen cannot push anything, and a tab
  switch unmounts it. This was the first thing I expected to find and it is fine.
- **`TuningPlayer`** — the only class in the app that handles AppState
  background, and it also disposes correctly. `TuningLabScreen.tsx:25` memoises
  it on the stable `requestAudioOutput` from `AudioOutputGate.tsx:92`'s
  `useMemo(…, [])`, so there is **no double-registration on re-render**.
- **`EarClipPlayer` and `useMixPlayback`** — heavily and correctly defended
  against teardown-mid-load, including the orphaned-instance case at
  `kit.tsx:320-336`. Only the latent E11 remains.
- **`exposureMonitor.initExposureMonitor`** — idempotent via `booted`;
  `hydrate()` cannot reject; the arm/disarm is driven off one subscription that
  covers both the output gate and the mic. The poller genuinely does not run
  when there is nothing to measure.
- **`useRafFrameLoop`'s callback-in-a-ref design** — correct, and the right
  answer to the meter-responsiveness rule. Only the error path (E8) is open.
- **Dep arrays** — I found **no** effect that re-subscribes every render, and no
  stale-closure bug with user-visible consequences. The codebase uses the
  live-ref idiom (`xRef.current = x` above the effect) consistently and
  correctly; `useDspEngine.ts:86-95`, `SplMeterScreen`'s `weightingRef`/
  `responseRef`, and `useRafFrameLoop`'s `cb` are all textbook. Two harmless
  stale closures: `ExposureCheckin.tsx:120-127`'s PanResponder captures
  `reduceMotion === false` forever (a swipe-up dismiss animates at the
  full-motion duration under Reduce Motion), and `NavIcon`'s excursion callback
  (E9).

## Not covered

- **Runtime behaviour.** Everything here is from reading. E1's Android half and
  E2 both want a device pass to confirm the native audio-session behaviour I
  inferred; I have said so in each.
- **`src/screens/lab/production/`** — read only far enough to confirm it has no
  timers or subscriptions of its own. Memory records Production Labs as planned,
  not built, so I did not audit it as shipping code.
- **Small per-screen animation intervals** (`InsideStats.tsx:284` at 206 ms,
  `speechViz.tsx:176` at 50 ms, `modSystems.tsx:30`, `pagesC.tsx:156`,
  `DeEsserLabScreen.tsx:147,301`). These re-render at 5–20 Hz while their local
  flag is set and are not focus-gated *at the interval*, but the ones inside
  module hosts do receive a `focused` prop that drives that flag
  (`CymaticsModuleScreen.tsx:57`, `EqModuleScreen.tsx:78`). I spot-checked and
  found the pattern honoured; I did not exhaustively verify every module host.
  This is polish, not a launch risk.

---

# Suggested order of work

1. **E1** — one root AppState component. Highest severity, smallest change,
   closes "audio that will not stop" for every lab at once.
2. **E4** — do not consume the dose latch on a suppressed warning. Few lines,
   and it restores a hearing-safety promise for exactly the users who need it.
3. **E3** — three focus gates and three `setActive(running)` calls, before the
   Cymatics Phase 4 device pass, since a slower phone is what makes it visible.
4. **E6 / E7** — `useIsFocused` inside `useToolAutoStart`, and pass `stop` at
   the three call sites. Both are privacy promises the code already makes in
   comments.
5. **E5** — one shared hook; do it with E1, since E1 without E5 leaves the
   transport lying in a new way.
6. **E2** — needs the device pass first, then a generator `desiredRunning`
   mirroring the capture one.
7. **E8 / E9 / E10 / E11** — hardening, any time.

Items 1–4 are each under twenty lines and touch code with no test coverage to
break. Items 1, 3 and 6 are the ones a user would report as "the app kept
making noise", "my phone got hot", and "the lab stopped working after a call".
