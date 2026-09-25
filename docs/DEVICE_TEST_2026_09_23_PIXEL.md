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

## Study machinery — REAL PROGRESS MADE (guest, unsaved) ✅
A guest CAN study the free topics, which got much further than expected.

**Pro Audio Safety** (TOPIC 2 OF 2, auto-enrolled):
- **Flashcards: 233 / 233 cards, 100% COMPLETE.** Swept the whole deck; `pid`
  constant, 0 FATAL, no jank.
- Completion popup fired correctly: **"NICE WORK! — FLASHCARD DECK COMPLETE"**,
  a CENTRED popup (matches the popups-not-pulldowns rule).
- **THE POWER SEQUENCE WORKS.** Before: only FLASHCARDS had START. After
  completing it: FLASHCARDS → REVIEW, and **FILL IN THE BLANK + MATCHING both
  gained START**. Overall topic progress moved 0% → **25%**.
- **Fill in the Blank: 10 questions answered, ALL 10 CORRECT** (progress tracked
  0% → 4%, i.e. every answer registered). Content spot-check was excellent —
  OSHA Competent Person, noise dose D=100×Σ(C/T), HAVS finger blanching,
  cheater plug as a ground-lift violation. All technically accurate and the
  distractors were plausible without being ambiguous.

⚠️ SCOPE, STATED PLAINLY: "every term, every question" is not reachable in a day.
This topic alone is 233 cards + 233 fill-in-blank questions, and there are 166
live topics averaging 195 terms. Answering one question costs ~2 UI round trips;
233 questions is ~470, and the full corpus is ~32,000 terms. What is proven is
that the machinery and the content are sound, not that every item was visited.

## Correction to my own method
An early crash check counted `AndroidRuntime: ` lines and appeared to show
5 → 10 → 15 "fatals" across tab navigation. Those were **my own `uiautomator`
dumps** starting a VM (5 lines each), not the app. Real crashes log
`FATAL EXCEPTION`; that count has been **0 everywhere all session**.

## Matching · Career Finder · credential tabs
- **Matching** started (58 pair-sets). Matched NFPA-80 self-closing → *Fire door*
  and the outdoor-rigging hazard → *Wind Hazard*; accepted pairs are removed from
  the pool. Mechanism works, 0 FATAL.
- **Career Finder** completed END TO END as a guest: 28 questions → scoring →
  results ("Music Creation, DAWs, Synthesis & Sonic Art", 37 titles, ranked #1)
  → family detail. No crash at any step.
- **Credential tabs** all render distinct content and none crash:
  Explore ("Discover What's Inside"), Certificates ("Build Your Academy
  Credentials"), Programs ("Complete Certificate Programs"), Pro Registry
  ("Get Discovered"), Enrollments ("Manage My Learning").
- Stats card is self-consistent with the glossary: **32,116 glossary terms**,
  166 study topics, 124 certificates, 36 programs, 163 calculators,
  142,324 practice questions.

## ⚠️ NOT CONCLUSIVELY VERIFIED — the Career Finder retake fix (A1-3)
I changed "Retake the Career Finder" from `navigate` to `popTo` so it returns to
the existing screen instead of pushing a duplicate. On device the retake did land
on the Career Finder, but leaving it took **two** back presses, not one.

That is ambiguous: it is either a surviving duplicate, or the first back was
consumed by the screen's own view state. I could not separate the two, because
backing out of the app ends the guest session and resets the path.

⛔ So this one is UNPROVEN on device. A clean test needs a baseline (fresh
Explore → Career Finder → count backs to leave) compared against the
post-retake count, ideally signed in so the session survives.

## Two false leads I chased and discarded (recorded so nobody re-chases them)
1. `AndroidRuntime:` line counts rising across navigation — those were my own
   `uiautomator` dumps, not the app. Real crashes log `FATAL EXCEPTION`: zero.
2. Credential tabs appearing not to switch — my tap coordinates were stale; the
   tab row moves down when the screen shows a title. With correct coordinates
   every tab switches correctly.

---

# 2026-09-24 — VERIFIED ON DEVICE, SIGNED IN (anorak)

The owner signed in, which unlocked the member-gated Sound Playground — the one
screen I could not reach as a guest, and the one both crashes live on.

## ✅ Crash 1 — pink noise. FIXED, exact repro driven.
Owner's original sequence, reproduced step for step:
`SOURCE → SQUARE` (they said this worked) → `PINK NOISE` (they said this crashed).

Result: **no crash.** pid constant, 0 FATAL / 0 "Tried to synchronously call".
The noise waveform draws and the spectrum shows the pink −3 dB/oct slope —
i.e. the `hash()` worklet path that used to abort is rendering.
WHITE and BROWN also cycled clean.

## ✅ Crash 2 — the Sentry one (`gainDbAt`). FIXED.
Condition: a WAVE selected **plus EQ on** — the branch a guest could never reach.
`SQUARE` + `FX → LPF 500 Hz`.

Result: **no crash.** The spectrum header reads **"EQ APPLIED"** and the square
wave visibly rounds off as its harmonics are attenuated. That is the EQ-weight
computation that Sentry recorded aborting, now running from the JS thread.

## ✅ HIDE DISPLAY (owner's ruling) — works, and holds.
- Tapped **▴ HIDE DISPLAY**: the glass disappears, the lesson takes the screen —
  TRY THIS, the level meter, the full prose AND the CHECK YOURSELF question all
  visible at once, where before they were crammed into a ~140pt well.
- **The readouts and the honesty badge stayed** (FREQ/λ/PERIOD/LEVEL and
  "CONCEPTUAL MODEL — … NOT MEASURED"). The disclosure was never the thing hidden.
- **Persisted across labs**: opened a different lab (Foundations of Sound) and it
  was already collapsed.
- **Persisted across MODULE changes**: NEXT ×2 → Module 3/14, still collapsed.
  This was the engineered-for failure mode (the frame remounts per module) and it
  held.
- **▾ SHOW DISPLAY restored it**: the AIR particle field and PRESSURE wave are
  animating again. Control measured **52pt tall** — above the 44pt minimum.

## Not done, and why
I did NOT use the saved-password sheet that Android offered for the account. The
owner signed in themselves.

---

# 2026-09-24 — ✅ CAREER FINDER RETAKE: PROVEN FIXED (build 30, Pixel 7 Pro)

The A1-3 item above is now closed. It was unprovable last time because no
BASELINE was taken; this run takes one first, which removes the ambiguity.

**Method — one observation, no back-counting.**
The old `navigate` bug leaves the stack as
`CareerFinder → CareerFamilyList → CareerFamily → CareerFinder`. So after a
retake, a SINGLE back press lands on the **career family detail** if a duplicate
survives, and on **Explore the Academy** if `popTo` collapsed the stack. Where
you land is unambiguous; how many presses it takes is not.

| step | result |
|---|---|
| **Baseline** — Explore → Career Finder → 1 back | → **Explore the Academy** |
| Full run — 28 questions → results → EXPLORE FAMILY ("Accessible Media & Audio Description") → "Retake the Career Finder" | → lands on Audio Career Finder |
| **After retake** — 1 back | → **Explore the Academy** |

Identical to baseline, and NOT the family detail. `popTo` is collapsing the
intermediate stack back onto the single existing CareerFinder instance. **Fixed.**

**What the old "two back presses" actually was.** On the way in, tapping the
Career Finder link on the curriculum screen raises an *intro popup* (START /
NOT NOW) before the screen is pushed. An overlay like that can absorb a back
press, which is exactly the "consumed by view state" alternative the earlier
note could not rule out. It was never evidence of a duplicate route.

⚠️ **uiautomator dumps go stale on this app** and will happily report the
PREVIOUS screen — it claimed we were still on the Career Finder after the back
press while the screenshot showed Explore. Treat `screencap` as ground truth and
use dumps only for locating tap targets on a screen you have already confirmed.
