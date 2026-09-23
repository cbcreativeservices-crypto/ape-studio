# Pixel 7 Pro device sweep — 2026-09-23 (owner away)

Driving the physical Pixel over adb, Guest Mode, after the OTA.
App: versionCode 13, `preview` channel, runtime `78622e4e4ff904…`.

## OTA — CONFIRMED RUNNING ✅

⛔ First publish went to `production` ONLY. The Pixel listens on **`preview`**,
so it would have been a silent no-op — caught before claiming anything.
Published to `preview` as well; runtime matched the installed build exactly.

Two-launch proof (the standing definition of "updated"):

| Launch | expo-updates log |
|---|---|
| 1 | 48/48 assets, 0 failed → `Update available` → `DownloadComplete` → `NEW_UPDATE_LOADED` → `Restart` |
| 2 | `CheckCompleteUnavailable` → **`No update available`**, `isUpdateAvailable=false` |

Launch 2 having nothing to fetch is what proves the new code is the code running.

## Crash fix #2 — colour wheel in fullscreen SPL · VERIFIED (with a caveat)
1. Tools → SPL Reference Meter → OPEN TOOL → amplitude orientation gate
2. Answered its 3-question check — **all three correct**, gate passed
3. Meter live: PK 51, AVG 40, Leq 29.7 dBA, mic working
4. Tapped the gauge → fullscreen, `mRotation=ROTATION_90` (**landscape-locked** —
   the exact precondition of the crash)
5. **Tapped the colour wheel** → `LED METER COLOUR` picker opened and rendered
   correctly in landscape. `pid` unchanged, **0 FATAL / SIGABRT** lines.
6. Picked a scheme, DONE, exited → `mRotation=ROTATION_0`, portrait re-locked
   correctly, mic released (dosimeter stopped).

⚠️ HONEST CAVEAT: the reported crash was `UIApplicationInvalidInterfaceOrientation`,
a **UIKit** exception — it only ever occurred on iOS. This run proves the change
is safe on Android and the picker works while landscape-locked; it does NOT prove
the iOS fix. That needs the iPhone.

## Crash fix #1 — Sound Playground worklet · BLOCKED, partially covered
⛔ **Sound Playground is member-gated.** As a guest the preview sheet appears over
it and "NOT NOW" returns to the list — a guest cannot reach the pink-noise or EQ
controls. The specific crash path could not be driven.

Partial coverage instead: the FREE **Foundations of Sound** lab renders from the
SAME `screens/lab/foundations/viz.tsx`, and its animated air-particle field is
driven by `useDerivedValue` worklets in that file.
- Opened it, pressed PLAY (audio ran)
- **Walked all 14 modules** — `pid` constant, **0 fatal / 0 "Tried to
  synchronously call" lines** at every step

So the file's worklets execute cleanly on device; the two specific branches
(noise hash, EQ weights) still need a member account to exercise directly.

## Blocked without a sign-in (stated to owner)
The Pixel is signed out and I do not sign in on the owner's behalf. That blocks:
completing topics, completing programs/certificates, and quizzes
(`start_quiz_attempt` raises `not_enrolled` without an account).

## Glossary — the big freeze · VERIFIED WORKING ✅
Guest → Open Glossary:
1. Device-key consent dialog ("Opening the glossary") appeared FIRST
2. The welcome intro appeared AFTER it, **not drawn over it** — this is the
   `glossaryIntroHold` fix, confirmed on device
3. Corpus loaded: **32,116 terms**, list rendered, `pid` constant,
   **0 FATAL / 0 ANR / 0 long-frame skips**. No freeze, no brick.
4. Search "compress" → **190 results**, matches highlighted green in both term
   titles and definition bodies
5. Expanded "Compressed Air" → full definition with PLAIN ENGLISH / PURPOSE
   sections and tappable in-glossary cross-links (air, compressor, cold, freeze)
6. **Search-text weight rule confirmed both ways** (owner's latest request):
   expanded → search text **bold**; collapsed → back to regular

## Modals verified rendering on device (the layering work)
AppWelcomeOverlay · SoundSafetyWarning · AudioOutputGate · AccuracyNote ·
glossary device-key consent · glossary intro · LED colour picker (landscape).
All rendered and dismissed correctly; none drawn behind another.

⚠️ Observed: on first audio interaction three modals QUEUE (sound safety →
audio-output gate → accuracy note). Each consumed one tap, so navigation taps
were swallowed until all three were cleared. Not a bug — but worth knowing it
takes three dismissals before the app responds to navigation again.

## Orientation lock behaviour
Fullscreen SPL forced `ROTATION_90` and exiting restored `ROTATION_0`.
The mic released on exit (dosimeter stopped counting).
