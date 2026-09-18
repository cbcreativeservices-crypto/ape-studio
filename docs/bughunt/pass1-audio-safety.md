# Bug hunt — Pass 1: audio, hearing safety, and the measurement tools

**Date:** 2026-09-17 · **Branch:** audio-tools-engine · **HEAD:** 213736bd
**Method:** source reading only. No dev server, no build, no `eas` command, no git write.

---

## What I examined

Read in full:

- `src/features/audio/` — `AudioOutputGate.tsx`, `audioOutputStore.ts`, `SoundSafetyWarning.tsx`,
  `soundSafetyAck.ts`, `soundSafetyText.ts`, `outputCeiling.ts`, `exposureMonitor.ts`,
  `ExposureCheckin.tsx`, `levelHearingWarning.ts`, `speakerSafety.ts`, `panicMute.ts`,
  `ShakeToMute.tsx`, `MicFeedbackGuard.tsx`, `AudioOutputRow.tsx`, `AudioBorderFrame.tsx`,
  `FeedbackAllowRow.tsx`
- `src/features/ear/earPlayer.ts`, `src/features/lab/LabAudioPlayer.ts`, `src/features/lab/useLabAudio.ts`,
  `src/features/tuning/tuningAudio.ts`, `src/screens/lab/mixing/audio/mixAudio.ts` (header + playback contract),
  `src/screens/lab/mixing/kit.tsx` (`useMixPlayback`)
- `src/components/AudioPlayer.tsx`, `src/components/SpeakButton.tsx`, `src/components/HoldToActivate.tsx`,
  `src/components/DimModal.tsx`
- `src/features/tools/engine/micSession.ts`, `src/features/tools/engine/useDspEngine.ts`,
  `src/features/tools/genCapSession.ts`
- `modules/ape-dsp/index.ts` (TypeScript surface), `App.tsx` root wiring
- `src/screens/tools/SignalGenScreen.tsx`, `src/screens/lab/HarmonicsView.tsx`, `src/screens/lab/LabShell.tsx`,
  `src/screens/study/ScenariosScreen.tsx`, `src/features/study/mediaTypes.ts`
- `node_modules/expo-audio` iOS + Android native sources, to settle whether `replace()` preserves volume
- `test/soundSafety.test.ts`

Swept the whole repo for: `createAudioPlayer`, `useAudioPlayer`, `expo-audio`, `expo-av`, `expo-video`,
`react-native-video`, `WebView`, `Speech.speak`, `genStart/binStart/modStart`, `requestAudioOutput`,
`noteAudioActivity`, `disableAudioOutput`, `setMicActive`, `useAudioOutputEnabled`, `shouldPlaySound`.

## What I could not check

- **Anything needing the device or a running app.** Whether the native engine keeps sounding when the app is
  backgrounded (there is no `UIBackgroundModes: audio` in `app.json`, so iOS should suspend; Android is the open
  question), the real SPL the −12 dBFS ceiling produces on the owner's hardware, whether a shake fires
  reliably, and iOS 27 behaviour. Several findings below say where a device check would settle a detail — none
  of them depend on it for the finding itself.
- **The native ape-dsp cap chain.** I read the TypeScript surface and the documented `capDb` / `capUnlocked`
  contract in `modules/ape-dsp/index.ts`, not the Swift/Kotlin implementation.
- **Live content.** Whether any `quiz_questions` row currently carries `media_type = 'audio'` is backend data;
  I did not query it. Finding 1 is about the code path, which is live regardless.
- I ran neither `npm test` nor `npx tsc --noEmit`, having changed no code. Note that `test/soundSafety.test.ts`
  covers the ceiling arithmetic and the warning text only — none of the paths below are under test.

---

## Bypass of the first-use safety gate — Scenarios plays audio without it

**Severity:** blocker
**Where:** `src/components/AudioPlayer.tsx:50`, `:67`; rendered at `src/screens/study/ScenariosScreen.tsx:520`

**What happens:** This path can expose someone to unexpected loud sound. A scenario card carrying an audio
asset renders a play button that streams the file at **full scale**, with no Sound Safety Warning, no
audio-output gate, no output ceiling, and no way for the user to shake-mute it.

**Why:** `LivePlayer` takes `expoAudio.useAudioPlayer({ uri })` and calls `player.play()` in `toggle()`. There
is no `requestAudioOutput()` anywhere in the file, and no `applyCeiling()` — so `volume` stays at expo-audio's
default of `1.0`, i.e. 12 dB above the ceiling that `earPlayer` and `LabAudioPlayer` were given today, and
roughly 20 dB above the native generator's default tone. Three protections fail together:

1. The gate is never asked, so a user who has never seen the Sound Safety Warning hears sound anyway.
2. `ShakeToMute.tsx:30` subscribes the accelerometer only while `useAudioOutputEnabled()` is true. Because this
   path never enables the gate, the panic gesture is not even listening.
3. `panicMuteAudio()` does not touch expo-audio players regardless (see the next finding), so the shake would
   not stop it even if it fired.

The exposure monitor also never sees it. The reachability is data-driven: `src/features/study/mediaTypes.ts:48`
builds `{ kind: 'audio', url }` from any row whose `media_type` is `audio`, so this goes live the moment a
scenario with audio is authored — no app change required.

**Fix:** Make `LivePlayer` gate and cap like every other player. Hold the gate result in state, make `toggle()`
`async`, and on the play branch `if (!(await requestAudioOutput())) return;` before `player.play()`. Call
`applyCeiling(player)` in an effect keyed on `player`. Then register it with the panic-mute registry from the
next finding. If shipping before that registry exists, the minimum is the gate check plus `applyCeiling` — but
do not ship the file as it stands.

---

## Shake-to-mute cannot stop any file playback

**Severity:** blocker
**Where:** `src/features/audio/panicMute.ts:19-33`

**What happens:** A user who shakes the phone because sound is hurting them keeps hearing it. The tone
generator, binaural bus, modular voice and speech all stop; **every clip playing through expo-audio keeps
playing to its end** — up to a 10-second stereo loop in the mixing lab, and whatever the ear-training or tuning
clip length is.

**Why:** `panicMuteAudio()` stops exactly four things: `ApeDsp.genStop()`, `binStop()`, `modStop()`,
`fxReset()`, plus `Speech.stop()`, then flips the gate. Nothing in the app holds a handle to the live
`expo-audio` players, so there is nothing for it to stop. The live players are:

- `EarClipPlayer` — ear training (`src/screens/lab/eartraining/EarModuleScreen.tsx:99`), the tuning lab
  (`src/features/tuning/tuningAudio.ts:26`), the mixing labs (`src/screens/lab/mixing/kit.tsx:313`)
- `LabAudioPlayer` — `src/features/lab/useLabAudio.ts:46` (currently dormant, see "Checked and found nothing")
- `components/AudioPlayer.tsx` — the ungated one above

This directly contradicts a promise the app now makes in writing. `src/features/audio/soundSafetyText.ts:55`
tells the user, in the list of things the app does to protect them, "Shake the phone at any time to mute
instantly." `AudioOutputGate.tsx:253` repeats it in a red card: "SHAKE THE PHONE AT ANY TIME TO INSTANTLY MUTE
AUDIO OUTPUT." Both are false on every file-playback screen.

**Fix:** Add a tiny registry module, e.g. `src/features/audio/livePlayers.ts`, exporting
`registerPlayer(p) / unregisterPlayer(p) / stopAllFilePlayback()`. Register in `EarClipPlayer.load()` and
`LabAudioPlayer.play()` right where `createAudioPlayer` is called (`earPlayer.ts:134`, `LabAudioPlayer.ts:82`),
unregister in their `dispose()`/`remove()` paths, and register `components/AudioPlayer`'s player in an effect.
Call `stopAllFilePlayback()` from `panicMuteAudio()` before `disableAudioOutput()`. Keep it a plain module with
no React import so `panicMute` can call it without a cycle.

---

## `disableAudioOutput()` silences nothing — every auto-mute is a label, not an action

**Severity:** blocker
**Where:** `src/features/audio/audioOutputStore.ts:102-109`

**What happens:** This can leave someone listening to sound the app has told them is off. When any auto-mute
fires while audio is genuinely sounding, the sound continues — while the red "audio is live" border disappears,
the panic-shake listener is torn down, and the exposure monitor stops counting dose. The user is left with
audio playing, every indicator saying muted, and the emergency gesture disabled.

**Why:** `disableAudioOutput()` clears the idle timer, clears `idleBypass`, sets `enabled = false` and emits.
That is all it does. I checked every subscriber to that emit — `AudioBorderFrame.tsx:26`,
`AudioOutputRow.tsx:48`, `ShakeToMute.tsx:26`, and `exposureMonitor.ts:526` via `subscribeAudioOutput`. Not one
of them stops output; two of them stop *protecting* the user:

- `ShakeToMute.tsx:30` — `if (!on) return`, so the accelerometer listener is removed. Panic mute is now dead.
- `exposureMonitor.ts:526` — `evaluateArm()` calls `stopTimer()`, so dose accumulation stops while the sound
  that causes the dose continues.

The paths that call it while sound could be live: sign-in (`AudioOutputGate.tsx:147`), foreground-after-idle
(`:156`), the 20-minute idle timer (`audioOutputStore.ts:61`), and the user tapping the Profile row
(`AudioOutputRow.tsx:53`). Only `panicMuteAudio()` pairs it with a real teardown, and even that one misses file
playback.

There is a partial mitigation for the native path: every tone screen runs a 2 Hz `noteAudioActivity()`
keepalive while running (`SignalGenScreen.tsx:394`, `HarmonicsView.tsx:206`, and the same `ACTIVITY_MS`
interval in fourteen lab screens), which keeps `lastActivity` fresh so the idle timer does not fire mid-tone.
That is per-screen discipline rather than a mechanism, and it does not cover the file path at all:
**no file-playback site calls `noteAudioActivity()` after the initial gate check.** So a learner working through
ear-training clips or mixing comparisons without touching the screen for 20 minutes gets the idle mute mid-clip
— sound continuing, border gone, shake dead.

**Fix:** Make the mute do the muting. Extract the silencing half of `panicMuteAudio()` into
`src/features/audio/silenceAllOutput.ts` (native stops + `Speech.stop()` + `stopAllFilePlayback()` from the
previous finding — no store import, so no cycle), then call it from `disableAudioOutput()`'s
`if (enabled)` branch, and have `panicMuteAudio()` simply call `disableAudioOutput()`. Separately, have
`EarClipPlayer.play()` and `LabAudioPlayer.play()` call `noteAudioActivity()` so a clip counts as activity.

---

## The exposure monitor is blind to every clip the app plays

**Severity:** serious
**Where:** `src/features/audio/exposureMonitor.ts:361-398` (`readSources()`)

**What happens:** Listening time and dose accrue as zero on the screens where people listen longest through
headphones. Ear training, the tuning lab and both mixing labs contribute nothing to the daily dose, produce no
routine check-in, and can never trigger the "approaching" or "reached" warnings — a user can spend an hour on
ear training and the app will report their exposure as low.

**Why:** `readSources()` reads exactly four things: `ApeDsp.genStatus()`, `binStatus()`, `modStatus()`, and
`ttsSpeaking`, plus the mic. There is no expo-audio term. `earPlayer.ts` and `LabAudioPlayer.ts` import nothing
from the monitor, and the monitor exports no hook for them to call. The file's own header claims it is "GROUND
TRUTH, not screen visibility" — it is ground truth for the native voices only.

The 3 dB exchange model makes this worse rather than better: because nothing is measured, nothing is
integrated, so the gap is silent rather than merely approximate.

**Fix:** Give the file path a level source the monitor can read. The registry from the panic-mute finding
already knows which players are live; add `filePlaybackActive(): boolean` to it and, in `readSources()`, fold
in a `FILE_DBFS` constant alongside `BIN_MOD_DBFS` at `:162`. Since `applyCeiling` pins file playback at
`PLAYBACK_CEILING_DB` (−12 dBFS), that is the honest assumed source level and the comment can say so. It stays
inside the existing `Math.max` so nothing double-counts.

---

## Routine check-ins are suppressed on most of the labs that make sound

**Severity:** serious
**Where:** `src/features/audio/ExposureCheckin.tsx:42-55` (`AUDIO_ROUTES`)

**What happens:** The 15-minute listening check-in never appears on the ear-training module, the tuning lab,
the whole cymatics lab, either mixing lab, or several others — so a user gets no periodic prompt on exactly the
screens where a long headphone session happens.

**Why:** `AUDIO_ROUTES` is a hand-maintained allow-list of route names, and `onAudioScreen()` gates routine
check-ins on it. Comparing it against the route names actually registered in `src/navigation/RootNavigator.tsx`,
these audible routes are missing: `EarModule`, `TuningLab`, `CymaticsLab`, `CymaticsModule`,
`CymaticsPlateStudio`, `CymaticsMembraneStudio`, `CymaticsLiquidStudio`, `BeginningMixingLab`,
`AdvancedMixingLab`, `SpeechLab`, `AmpLab`, `AmpModule`, `EnvelopeLab`, `DeEsserLab`, `SmartProcessorsLab`,
`PatchbayLab`, `ProductionLab`, `ProductionStage`, `ProductionActivity`, `PreProdLab`, `PostProdLab`,
`PublicGlossary`. Note `EarLab` is in the list but `EarModule` — the screen that actually plays the clips — is
not.

Cymatics is the clearest case of the list going stale: `useDriveTone.ts:102` calls `ApeDsp.genStart()`, so the
dosimeter *is* counting that exposure; only the check-in is suppressed. For the ear and mixing labs the
suppression compounds the previous finding, so those screens are invisible twice over.

Critical dose warnings (`approaching` / `reached`) correctly ignore the list, so the once-per-day safety events
still fire. This is about the routine prompt only.

**Fix:** Invert the rule. The list exists to keep the panel off screens where the user is reading, not
listening — so suppress on a short deny-list (auth, splash, paywall, checkout-like flows) and show everywhere
else, or better, gate on `snap.soundingNow || session != null` which is the real question being asked. A
hand-kept route list has to be edited every time a lab ships, and it has already fallen behind by two dozen
routes.

---

## Declining the Sound Safety Warning mid-write reopens the enable flow

**Severity:** serious
**Where:** `src/features/audio/AudioOutputGate.tsx:174-191`

**What happens:** A user who accepts the warning and then immediately backs out can end up with audio enabled
anyway, after having been told their request was refused.

**Why:** `onAccept` runs an async IIFE that awaits `recordSoundSafetyAck()` and then
`supabase.auth.getUser()` — two awaits, one of them a network-capable call. Throughout that window
`SoundSafetyWarning` is still mounted with `visible={phase === 'safety'}` and fully interactive. Tapping the
scrim (`SoundSafetyWarning.tsx:88`), the decline button (`:170`) or Android BACK (`:84`) calls
`settle(false)` — which nulls `resolver.current`, sets `phase` to `'closed'`, and resolves the caller's promise
with `false`. Then the pending write resolves, `stored` is true, and line 189 runs `setPhase('explain')`,
re-opening popup 1 against a null resolver. From there PROCEED → the 5-second hold →
`enableAudioOutput()` at `:294`, and `settle(true)` calls `r?.(ok)` on nothing. Sound is now on with no
outstanding request, after an explicit decline.

The 5-second hold still stands between the user and sound, so this is not a route to *unexpected* output — but
it is the acceptance flow ignoring a decline, in the one dialog whose entire purpose is recording consent
accurately.

Related, same block: when `recordSoundSafetyAck` returns `false` the gate correctly refuses to enable
(`:184-187`) — but says nothing. The user taps the accept button and the dialog simply closes with no sound and
no explanation.

**Fix:** Capture the resolver identity before the first await and bail if it changed:

```ts
const mine = resolver.current;
// … awaits …
if (resolver.current !== mine) return;   // the user left; do not advance the flow
```

Block the dismiss paths while the write is in flight (a `writing` state that disables the scrim, the decline
button and `onRequestClose`), and surface a message on the `!stored` branch rather than closing silently.

---

## The mic↔speaker interlock only cuts the generator

**Severity:** serious
**Where:** `src/features/audio/MicFeedbackGuard.tsx:20`

**What happens:** The interlock that exists to stop the built-in mic hearing the built-in speaker stops exactly
one of the five ways this app can make sound.

**Why:** the guard's whole body is `if (muted) void ApeDsp.genStop();`. It does not call `binStop()`,
`modStop()`, `Speech.stop()`, or anything on the file players. And `isSpeakerFeedbackMuted()` is not consulted
by `requestAudioOutput()` — I grepped every consumer, and `MicFeedbackGuard` is the only one — so nothing
*prevents* a new sound starting while the mic is hot. The guard only reacts to the `muted` transition.

Scope today is narrower than it looks, and I want to be precise about it. I checked all eleven `useDspEngine(`
call sites: mic capture happens only in `HarmonicsView` (LIVE mode), the two EQ live-spectrum modules, and the
Tools screens. The tone labs gate on `gate === 'idle'` — engine present, capture *not* started — so
`BinauralLabScreen`, `ModularLabScreen` and the rest never open the mic. So there is no screen today that runs
the binaural bus, the modular voice, TTS or file playback with the mic capturing. HarmonicsView's LIVE mode is
handled correctly: `:1297` starts the reference tone only when `isFeedbackAllowed()`.

What keeps it from being theoretical is `micSession`'s warm handoff. `RELEASE_DEBOUNCE_MS = 1500`
(`micSession.ts:33`) means the capture stream stays open for up to 1.5 s after the user leaves a tools screen.
Navigate from the RTA straight into a lab and the first sound starts against a hot mic. For a generator tone
the guard fires and cuts it — the safe direction, though the user sees a lab that refuses to play for no stated
reason. For a mixing or ear clip nothing happens at all.

**Fix:** Two changes. Have the guard call the shared `silenceAllOutput()` from the third finding instead of
`genStop()` alone. And have `requestAudioOutput()` return `false` while `isSpeakerFeedbackMuted()` is true, so
the interlock is a precondition rather than only a reaction — with the existing `FeedbackAllowRow` override as
the one documented way past it.

---

## A cold-start race can re-show the warning and overwrite the acknowledgment record

**Severity:** minor
**Where:** `src/features/audio/AudioOutputGate.tsx:122` with `src/features/audio/soundSafetyAck.ts:90-114`

**What happens:** A user who accepted the warning weeks ago can be shown it again on a cold launch, and
accepting it a second time destroys the original record — the timestamp and wording the module exists to
preserve.

**Why:** `requestAudioOutput()` picks its phase from `isAcknowledged()`, which reads the in-memory `cached`
record. That cache is populated by `loadSoundSafetyAck()`, kicked off in a mount effect at `:131-139`. The
comment at `:117-121` acknowledges the window and argues it is closed because the load starts long before any
sound is asked for. It is not always: `LabShell.tsx:313-316` fires `void requestAudioOutput()` in its own mount
effect, so a deep link straight into a lab at cold start can reach the gate before an AsyncStorage read
resolves.

The consequence is not just a redundant dialog. `recordSoundSafetyAck()` writes a fresh record with a new
`acceptedAt`, replacing the original — the "what did it say, and had it changed since" evidence the file's
header says a boolean could not answer.

There is a second ordering bug in the same area. `loadSoundSafetyAck()` sets `loaded = true` at `:92`, *before*
awaiting. If a write completes while that load is still in flight, the load then resolves and executes
`cached = parsed` at `:101` — replacing the record just written with the stale one. Both pass the version
check, so `isAcknowledged()` stays true and nothing surfaces, but the in-memory record is now the wrong one and
`acknowledgment()` will show it back to the user in Help.

**Fix:** Keep the load promise in a module variable and have `requestAudioOutput()` await it before choosing
the phase — the gate is already async, so this costs nothing on the normal path. In `loadSoundSafetyAck()`,
guard the assignment: `if (cached == null) cached = parsed;` so an in-flight load can never clobber a record
written while it was running.

---

## The output ceiling is not re-applied when a player is reused

**Severity:** minor
**Where:** `src/features/ear/earPlayer.ts:132`, `src/features/lab/LabAudioPlayer.ts:80`

**What happens:** Nothing today — but the ceiling added this morning rests on an undocumented invariant that a
dependency bump could flip silently, and the failure mode would be a clip playing 12 dB hot.

**Why:** both players call `applyCeiling(p)` only on the `createAudioPlayer` branch. The reuse branch
(`existing.replace({ uri })` / `this.player.replace({ uri: url })`) does not re-apply it, on the assumption
that `volume` survives a source swap. I checked, and it does: on iOS `volume` is a property of `player.ref`,
the shared `AVPlayer` (`node_modules/expo-audio/ios/AudioModule.swift:202-205`), and `replace` only swaps the
item (`:234-240`); on Android `replace` calls `player.setMediaSource` on the same ExoPlayer instance
(`android/.../AudioModule.kt:489`). So the current behaviour is correct.

It is still worth closing, because `outputCeiling.ts` is explicitly written as a hard safety floor and this is
the one place where it depends on someone else's implementation detail staying put.

**Fix:** One line in each file — call `applyCeiling` on the reuse branch as well. It is idempotent.

---

## The generator safety cap stays unlocked through a panic mute

**Severity:** minor
**Where:** `src/features/tools/genCapSession.ts:17-21` with `src/screens/tools/SignalGenScreen.tsx:362`

**What happens:** A user who unlocked the −12 dBFS generator cap, then shook the phone because it was too loud,
returns to a Signal Generator whose cap is still off.

**Why:** `unlockedThisSession` is a module flag with no clearer other than a JS relaunch.
`SignalGenScreen.tsx:362` silently re-applies `ApeDsp.genUnlockCap()` on every mount when the flag is set —
owner-approved as "confirm once per session" — but `panicMuteAudio()` does not clear it, and neither does the
sign-in re-mute. The panic gesture is the user saying *that was too loud*, and it leaves the one control that
made it possible in the permissive position.

The immediate risk is bounded: the mount effect at `:355-361` always pushes `DEFAULT_LEVEL_DB`, so the level
resets even though the cap does not, and the teardown at `:380` calls `genRelockCap()` on the native side. The
flag is what re-opens the door on the next visit.

**Fix:** Add a `clearGenCapUnlock()` to `genCapSession.ts` and call it from `panicMuteAudio()` and from
`disableAudioOutput()`. A user who re-enables audio after an emergency mute should meet the cap again.

---

## Push notifications play a sound the gate never sees

**Severity:** minor
**Where:** `src/features/notifications/push.ts:48`

**What happens:** A notification arriving while the user wears headphones plays the OS alert sound, on an app
whose Sound Safety Warning tells them "Sound is off every time you open the app. Nothing plays until you turn
it on deliberately" (`soundSafetyText.ts:54`).

**Why:** `setNotificationHandler` returns `shouldPlaySound: true` unconditionally. This is the OS notification
channel rather than the audio path, so it is at notification volume and cannot reach the levels the labs can —
but the claim in the warning is unqualified, and for this app's audience the distinction will not be obvious.

**Fix:** Either `shouldPlaySound: false` (the banner already carries the information), or qualify the warning's
wording so the one sentence the user is asked to agree to is literally true.

---

## Entering a lab pre-empts the play button, and auto-raises the warning in Low-Light mode

**Severity:** polish
**Where:** `src/screens/lab/LabShell.tsx:313-316`

**What happens:** Two small things, both from the same line. First, tapping PLAY while the on-entry audio
prompt is still open does nothing, permanently: `AudioOutputGate.tsx:111-114` denies any second request while
one is mid-flight, so the play press resolves `false` and returns — and completing the hold afterwards does not
retry it. The user holds for five seconds, audio enables, and the thing they pressed never happens.

Second, this makes the brand-new Sound Safety Warning an auto-appearing overlay on lab entry. It does not
consult `areOverlaysSuppressed()` the way `ExposureCheckin.tsx:22` does, so it will appear unbidden in
Low-Light Production Mode, which promises nothing auto-appears.

**Why:** the mount effect fires `void requestAudioOutput()` with no user action behind it (owner-confirmed
2026-07-25, when the flow was two popups rather than three).

**Fix:** For the race, have the gate queue rather than deny — or, smaller and in keeping with the
simplest-fix rule, have lab play handlers re-check `isAudioOutputEnabled()` after a `false` and proceed if it
became true. For Low-Light, treat the on-entry prompt as the auto-overlay it is and gate it on
`areOverlaysSuppressed()`; a user-initiated PLAY press would still raise the warning, which is the case that
matters.

---

## Exposure day accounting: a lost second, and a stale day while disarmed

**Severity:** polish
**Where:** `src/features/audio/exposureMonitor.ts:434`, `:346-354`

**What happens:** Two small inaccuracies in the dose record. Neither is a safety risk; both make the numbers
slightly wrong in the optimistic direction.

**Why:** at `:434` a new session is opened with `activeSec: pendingSec` — the retro-credited first second, so
no listening time is lost from the *session*. But `day.activeSec` is only incremented by `dt` at `:448`, so the
retro-credited second never reaches the day total. One second is lost per session, and the routine check-in at
`:459` keys off `d.activeSec % intSec === 0`, so the drift accumulates against the check-in schedule too.

Separately, `rollDayIfNeeded()` runs only inside `tick()`, which runs only while the poller is armed. An app
left open across midnight with audio off therefore reports yesterday's `day` through
`getExposureSnapshot()` until something starts sounding.

**Fix:** Add `pendingSec` into `day.activeSec` when the session opens. Call `rollDayIfNeeded()` from
`getExposureSnapshot()` as well, or from `evaluateArm()`.

---

## Checked and found nothing

Recording these explicitly, since "no finding" is only useful if it says what was looked at.

- **Every native voice start is gated.** All 22 `ApeDsp.genStart()` / `binStart()` / `modStart()` call sites —
  Autotune, Bass, Binaural, cymatics `modHarmony` and `useDriveTone`, digital `modAnalog`, EQ `eqAudition`, FM,
  Foundations course (three sites) and playground, Fx, Harmonics, Harmonograph, Modular, Noise, Oscillator,
  SignalChain, SignalGen — are preceded by an awaited `requestAudioOutput()` whose `false` returns early, and
  every one carries a generation-counter guard so a start resolving after a teardown calls `genStop()` instead
  of sounding behind a closed screen.
- **Every `EarClipPlayer.play()` owner is gated.** `EarModuleScreen.tsx:243`, `TuningPlayer.play`
  (`tuningAudio.ts:54`), and mixing `kit.tsx:363`. `TuningPlayer` additionally stops on any non-active
  `AppState` (`:35-38`).
- **`LabAudioPlayer` is gated and currently dormant.** `useLabAudio.ts:61` gates it; `useLabAudio()` itself has
  zero call sites in the app, so the class is not reachable today.
- **No ungated text-to-speech.** Three files import `expo-speech`: `SpeakButton.tsx` gates at `:59` before
  `Speech.speak`; `exposureMonitor.ts` only calls `isSpeakingAsync()`; `panicMute.ts` only calls `stop()`.
  `SpeakButton` is used only from `GlossaryScreen`. There is no other `Speech.speak` in the repo.
- **No other media API can make sound.** No `expo-av`, `expo-video`, `react-native-video`, `WebView`, or
  `<Video>` anywhere in `src/`. `expo-audio` is reached through exactly three files.
- **The checkbox is genuinely required and dismissal does not accept.** `SoundSafetyWarning.tsx:156` sets
  `disabled={!checked}` on the accept Pressable, and `:72` guards the handler independently. The scrim (`:88`),
  the decline button (`:170`) and `onRequestClose` (`:84`) all route to `close()` → `onDecline`. The checkbox
  resets on both exits (`:66-75`). The buttons sit inside the ScrollView below the text, so the accept control
  cannot be reached without the text moving.
- **A failed acknowledgment write does refuse to enable.** `AudioOutputGate.tsx:184-187` returns `settle(false)`
  on `!stored`, which is correct. (The race around it is finding 7; the silence on failure is noted there too.)
- **Concurrent requests resolve in the safe direction.** `AudioOutputGate.tsx:111-114` denies a second
  `requestAudioOutput()` while one is pending, rather than stacking modals or double-enabling.
- **The free-user lab preview short-circuit is safe.** `:99-102` resolves `false` and never enables.
- **The idle-bypass checkbox resets correctly.** It is cleared on every popup open (`:116`),
  `disableAudioOutput()` clears `idleBypass` (`audioOutputStore.ts:104`) so it cannot survive a mute, and
  `setIdleBypass()` is called *before* `enableAudioOutput()` (`:293-294`) so `armIdleTimer()`'s
  `if (idleBypass) return` no-ops correctly rather than arming a timer that is then never cleared.
- **The 5-second hold cannot be shortened.** `HoldToActivate.tsx:73-78` fires `onComplete` only when the
  animation reports `finished`; `onPressOut` stops it first. It is JS-driven (`useNativeDriver: false`), so an
  OS "remove animations" setting cannot collapse it.
- **Relaunch re-mute works by construction.** `audioOutputStore` persists nothing; `enabled` starts `false` on
  every JS launch.
- **Layered sources cannot double-count.** `readSources()` returns `Math.max` of output and mic, never a sum
  (`exposureMonitor.ts:396-397`) — one acoustic exposure, one duration.
- **Backgrounding stops accumulation.** `initExposureMonitor` (`:537-541`) sets `appActive` from `AppState`,
  force-persists the day on leaving, and `evaluateArm()` tears the poller down. `stopTimer()` (`:506-518`)
  clears `sounding` so the snapshot cannot claim live audio while disarmed.
- **The day boundary and retention are right.** `dateKeyOf` (`:158`) is local-time, so the key does not drift
  east of UTC; `rollDayIfNeeded()` resets the once-per-day `approaching`/`reached` latches; 45-day pruning runs
  at hydrate.
- **Sign-out does not leak one user's dose into another's record.** `resetLocal()` (`:252-271`) clears the
  module state and un-latches `hydrated`, which was the 2026-08-28 fix.
- **`micSession` tracks the real capture state.** `setMicActive(true/false)` is paired on every exit including
  the orphaned-start path (`:117-122`), so the interlock and the monitor's arming cannot be left lying.
- **The speaker-excursion guard is applied at the source.** `speakerSafety.ts` shapes the generator level by
  frequency and is route-aware above engine v4; I found no path that starts a low tone around it.
- **The anonymous-session carve-out in the login re-mute is correct.** `AudioOutputGate.tsx:147` requires
  `isRealAccount(session)`, so opening the glossary does not silence a lab mid-use.

---

## Suggested order

Findings 1, 2 and 3 are one piece of work and should be done together: a small `livePlayers` registry, a
`silenceAllOutput()` extracted from `panicMuteAudio`, wired into `disableAudioOutput()`, plus the gate and
ceiling on `components/AudioPlayer.tsx`. That single change closes the escape, makes the shake honest, and
makes every auto-mute actually mute. Findings 4 and 5 then fall out of the same registry. 6 and 7 are
independent and small. The rest can wait for a quieter week.
