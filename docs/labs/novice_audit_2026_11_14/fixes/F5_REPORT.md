# F5 report: Amplitude, Foundations of Sound, Sound Playground, Microphone Principles, Wave Physics, Speaker Placement, Room Design (phase 1)

**Summary (phase 1 done, 2026-11-14):** 33 fixed · 3 not a bug · 1 held (owner decision, the colour only; the words are fixed) · 1 moved to phase 2 (shared bezel captions) · 0 shared needs from me. One shared change asked of me has LANDED: `CheckSpec.why` (see the section below the table).

Tests: `test/labFixes_20261114_F5.test.ts` 36/36 pass. The existing tests for every file I touched (about 100 files, run one by one) all pass, except `labHubUnreadable_20261003`, which has 2 failures, both in Cymatics files I do not own. Pinned tests changed on purpose, each with the owner's words: screenGuide_20261031, screenGuide_foundations_20261031, screenGuide_micspeaker_20261031, screenGuide_amplitude_20261031, labEndsAndBanner_20261014, testflightTriage20261008, auditR2_A_D_labs_20261023, guestCareer_20261004.

`npx tsc --noEmit`: I ran it once mid-phase, with 0 errors in my files. I did not run it again at the end, because of the coordinator's note (3): "avoid running npx tsc concurrently; the coordinator runs it at the gate". After each edit I parse-checked every .tsx I had changed with esbuild, and I confirmed that the 8142 bundle builds.

## Item table

| # | Item (lab, what) | Verified in code (file:line) | Fix (files changed) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| W1 | Wave 11: "THE WRONG TOOL" improved the seat (SUM −4.4 → −1.7 dB) | Physics is right: at the start the main is 6.96 ms early, 0.70 of a 10 ms cycle at 100 Hz (250°); a flip adds 180° → 70°, so the sum improves at this seat and frequency only. modWaveB.tsx DelayAlignModule (reqDelay/sumDb) | A caption under the flip button when it is on: "Better at this seat (SUM −4.4 → −1.7 dB), by luck: a flip shifts the main by half a cycle, which only suits this seat at 100 Hz… A DELAY fixes the TIME" (or "Worse at this seat…"). Computes the un-flipped SUM. modWaveB.tsx | — (UI text; covered by bezelWords tests for the verdict) | Yes: text read on the page at 390x844 | FIXED |
| W2 | Wave 11: SUM −0.1 dB while OFF BY −8.02 ms | Physics is right: 8.02 ms ≈ 0.94 of the 8.55 ms cycle at 117 Hz, so the two land one whole cycle apart, in step at that frequency only | SUM cell gets a word line: IN STEP / OUT OF STEP / LUCKY FLIP / N CYCLE(S) OFF (new pure `src/screens/lab/wave/bezelWords.ts` sumVerdict); plus a well caption naming the one-cycle case. Guide updated | labFixes_20261114_F5 | Yes: "SUM −4.4 dB / OUT OF STEP" on the bezel | FIXED |
| W3 | Wave 11: REQ key drops at 14.98 ms | BezelReadouts.tsx:88-92 drops the key when the value is wider than the cell; REQ cell measured 80.3 px at 390, needs 80.8 for "14.98 ms" | bezelMs(): 0.1 ms from 10 ms up (screen reader keeps 0.01); cells evened (REQ/OFF BY/SUM 1.05). modWaveB.tsx, bezelWords.ts | labFixes_20261114_F5 | Cells measured 84/81/85/85 px | FIXED |
| W4 | Wave 16: "12.00 m"/"8.00 m" clipped; DEPTH thumb under "more ↓" at 770 | Measured at 390x770: tray scroll 108 px, content 140 px, "more ↓" y 610-628 over DEPTH slider y 594-638 | ROOM tray: WIDTH and DEPTH side by side (65 px, fits every phone). modWaveB.tsx; guide + pinned test updated | labFixes + screenGuide_20261031 | Yes, at 390x770: WIDTH 19-188 and DEPTH 202-371 side by side, with no "more ↓"; DEPTH dragged 8.00 → 3.20 m | FIXED |
| W5 | Wave 10: BOXES "4" clipped; ARRAY tray 3 stacked sliders, "4·4.0°" key | modWaveB.tsx LineArrayModule ARRAY group (3 DragSliders in one tray) | BOXES, SPLAY, HEIGHT are now their own dock faders with plain values ("4 boxes", "4.0° per box", "1.20 m hang depth"). Guide + pinned test updated | labFixes + screenGuide_20261031 | Yes: the dock reads BOXES 4 / SPLAY 4.0° / HEIGHT 0.90 m; BOXES slid to 8 → LEN 3.83 m, and the map changed | FIXED |
| W6 | Wave 9: vs ON-AXIS "stuck" at −12.0 dB | waveEngine.ts:166 directivityGain floors at 0.25 (−12 dB): a model floor, not the seat's level | At the floor the cell reads "≤ −12 dB" and the well says why (bezelWords.vsOnAxisReadout). modWaveB.tsx | labFixes_20261114_F5 (uses the engine's own directivityGain) | Not seen: dragging the listener needs a scripted touch drag on the canvas | FIXED |
| W7 | Wave home "THE 15 MODULES" vs strip "1 / 16" | WaveLabHomeScreen.tsx:66,101; registry.ts:30 num '◎' | "MODULES 1–15" + "PUT IT ALL TOGETHER · MODULE 16", builder row numbered 16, subtitle "sixteen modules". Guide updated | labFixes_20261114_F5 | Yes: the page text has MODULES 1–15 and PUT IT ALL TOGETHER · MODULE 16, and no "THE 15 MODULES" | FIXED |
| W8 | Wave: "LOSS/BNC", "FRESNEL N" spelled out on first view | modWaveA.tsx:359, 1011 | This is exactly S3's new `BezelItem.caption` (first-visit captions). Phase 2 fills it in ("lost per bounce", "shadow depth") | phase 2 | — | PHASE 2 (shared mechanism; the brief says not to touch it until then) |
| W9 | Wave: ~6 px unlabeled speaker/listener marks get on-picture labels (as module 12) | vizWave.tsx RoomSceneView drew no names; module 12 passed its own `labels` | New pure `src/screens/lab/wave/sceneNameTags.ts`; RoomSceneView draws SPEAKER / SUB / MIC / YOU (drag) beside each object, never over another tag or glyph, inside the room. Overrides: 6 SPEAKER S1/S2, 10 LINE ARRAY, 11 SUB/MAIN, 12 keeps its own tags + "YOU (front)". vizWave.tsx, modWaveA.tsx, modWaveB.tsx | labFixes_20261114_F5 | Yes: modules 6, 7, 8, 10, 11 and 14. A third pass lets a tag leave a very small room rather than cover another tag; in Echo's canyon, SPEAKER now sits under YOU (drag), apart | FIXED |
| W10 | Wave 6 intro: "red and blue bands" while the map shows warm and cool | waveScreenGuides.ts:245 | "through the loud (warm) and quiet (cool) bands" | — | Seen: module 6 map is yellow/orange with green nulls | FIXED |
| S1 | House slang "ride"/"lane" → "slide" (Foundations, Room, Wave; Mic guide too) | 12 lines in FoundationsCourseScreen.tsx, 12 in foundationsScreenGuides.ts, modCreate.tsx:209, modMonitoring.tsx:269/275, 9 in roomdesignScreenGuides.ts, micSpeakerScreenGuides.ts:111. "rides these pressure swings" (a mic moving with the air) is plain English and stays | All replaced; one pinned test updated (screenGuide_foundations M7 "PROBE slider") | labFixes_20261114_F5 (no learner string keeps "Ride …"/"lane") | — | FIXED |
| F1 | Foundations 1: FREQ ×4 while MODEL ×1.8, unexplained | FoundationsCourseScreen.tsx visHzFor (log, slowed) feeds MODEL | Module 1 text explains MODEL (slowed, squeezed; ×4 vs ×1.8; direction real, size not); the intro's WHERE TO START says MODEL rises far less | labFixes_20261114_F5 | Yes: the module 1 text on the page | FIXED |
| F2 | Foundations 9: "40Hz" overlaps "0dB" | viz.tsx: "40Hz" at left AX=36, top 0, next to the "0dB" scale label at left 10, top yDb(0)−5 | "40Hz" moved onto the frequency axis with 100/1k/10k; YOU HEAR label kept clear above it. viz.tsx | labFixes_20261114_F5 | Yes: "40Hz" is now on the axis beside 100, clear of the scale numbers | FIXED |
| F3 | Foundations 9: slider bottom 90 Hz vs card's 80 Hz | FoundationsCourseScreen.tsx M9Rack: f = 80·100^pos, pos 0 = 80 Hz exactly | — | — | Yes: dragged to the end of the slider: FREQ 80 Hz, SEND −37, HEARD −61 dB (the guide's numbers). The auditor's drag stopped short of the end | NOT A BUG |
| F4 | Foundations 11: asks for PLAY but has no PLAY key | FoundationsCourseScreen.tsx:1489: PLAY only when engine ≥ 3 (additive). Builds carry engine 10 (modules/ape-dsp/ios/core/EngineHub.hpp:71, committed); the web preview's sim reports an older engine | — | — | — | NOT A BUG (preview-only) |
| F5 | Foundations 10: cancelled (silent) sum drawn red | viz.tsx (M10): red at cancellation is the owner's ruling of 2026-08-05 ("bad, they cancelled") | Kept red (owner ruling); added the words "CANCELED — SILENT" on the flat line so red is not read as "more" | labFixes_20261114_F5 | Yes: PRESET 180° → a flat red line labelled CANCELED — SILENT | FIXED (words); the colour itself is the owner's call — HELD: owner decision |
| F6 | Foundations 10/11: "install the newest dev build…" | FoundationsCourseScreen.tsx:1402, 1522 are behind `__DEV__` | Developer line: NOT A BUG. The learner-build branch said "update the app to HEAR…" → now a plain student sentence pointing at the picture | labFixes_20261114_F5 | — | FIXED (learner branch) |
| P1 | Playground: the check uses 295 Hz, the page shows 290 Hz | FoundationsPlaygroundScreen.tsx:744 | 290 Hz, and the question says what a low-pass filter (LPF) is | labFixes_20261114_F5 | Yes (page text) | FIXED |
| P2 | Playground: header "FOUNDATIONS PLAYGROUND" vs tile "Sound Playground" | FoundationsPlaygroundScreen.tsx:597, 602 | "SOUND PLAYGROUND" (pinned test updated) | labFixes + screenGuide_foundations | Yes (page text) | FIXED |
| P3 | Playground: "update the app to hear the full sound" | FoundationsPlaygroundScreen.tsx:701 (not behind `__DEV__`) | "On this phone the sound here stays a pure sine; the drawings show the full shape exactly." | labFixes_20261114_F5 | — | FIXED |
| P4 | Playground: biggest instruction needs sound; "Module 10" points into another lab | FoundationsPlaygroundScreen.tsx:663, 379, 699 | Nudge: "Change anything below and watch all three views answer. Press PLAY to hear it too."; "Foundations of Sound, Module 10 (Phase)"; intro says "from Foundations of Sound" | labFixes_20261114_F5 | Yes (page text; no "update the app") | FIXED |
| M1 | Mic: DISTANCE slider runs opposite ways in modules 3 and 4 | MicPrinciplesLabScreen.tsx ProximitySection: d01 0 = 12 in → 1 = 1 in (right = closer); module 3: right = farther | Module 4 now 0 = 1 in → 1 = 12 in, starting at 12 in (right = farther in both). Pinned test updated | labFixes + screenGuide_micspeaker | Yes: module 4 opens at 12 in with the slider at the right end; dragged left → 1 in, BOOST +10 dB | FIXED |
| R1 | Room 5: after bass traps "TREATED stays 0/14" | modTreatment.tsx:93-94: TREATED counts reflection paths with a panel on them; corner traps rarely sit on one (by design) | Caption in the ADD tray once traps are in: traps work on the lows (watch RT60 125 ≈), TREATED counts paths on a panel; intro says "Open ADD, tap…" | labFixes_20261114_F5 | Yes: after BASS TRAPS, RT60 125 ≈ 0.31 s, TREATED 0/14, and the caption under the buttons | FIXED |
| R2 | Room 6: "6 untreated wall reflections inside 15 ms" vs "2 early wall reflections within 15 ms" | modReview.tsx imagingJudgement counted every level; roomModel.ts suggest counted only those > −12 dB | One rule, `earlyUntreatedWallReflections` (roomModel.ts), used by both | labFixes_20261114_F5 | Yes: the Review page now reads "2 untreated … inside 15 ms" and "2 early … within 15 ms" | FIXED |
| R3 | Room 4 intro: "Flip LAYOUT to START" while it already reads START | roomdesignScreenGuides.ts:139 | "With LAYOUT on START, pick MODE 34.3 Hz." | — | — | FIXED |
| A1 | Amplitude: WAVEFORM burst not visible at 390 | AmplitudeOrientation.tsx env(): sustain 0.72 → burst 1.0 over ±0.04, × TRACE_PEAK 0.66: bars 0.47 → 0.66 (green to yellow-green over ~3 of 56 bars) | Sustain lower, burst wider (±0.06), peaking at the LEVEL METER's PEAK (−3 dBFS = 0.708): twice the sustain's height, orange-yellow against green. Spectrogram scale follows. Pinned test updated | labFixes + screenGuide_amplitude | Yes (real app path, 390x844): the burst stands at about twice the height of the steady part. Its tips read yellow, not orange, because the peak is held at the meter's −3 dBFS so all six cards still draw one signal | FIXED |
| A2 | Amplitude: What's left says "Pass CHECK YOURSELF" after the check was passed | AmplitudeOrientation.tsx ReviewLabEnd stepLabel was a fixed string (S2 note ~1083) | New pure `amplitudeEndStep.ts`; the lab screen tracks the pass (AmplitudeColorBody onCheckPassed) and says "Press UNDERSTOOD — MARK REVIEWED (your check is passed)"; once the orientation is done, "Press MARK REVIEWED (your check is already passed)", and the detail line matches. Pinned tests updated | labFixes + labEndsAndBanner + guestCareer | Partly: in this preview the orientation was already done, and What's left read "Press MARK REVIEWED (your check is already passed)". Only the test covers the just-passed state | FIXED |
| A3 | Amplitude: "warmer = more" next to 78 dB SPL green-yellow and PEAK −3 orange | The mapping is the house standard: levelColor on each display's own window (SPL 40–100 dB = splColorForDba's window; meter −48–0) | The words were wrong-by-omission: a line under SIX VIEWS says each display colours its OWN scale and names the 78 / −3 case | labFixes_20261114_F5 | Yes (page text under SIX VIEWS) | FIXED (words) |
| W11 | Wave 14: "FAR WALL 16 ms" tag sat over the early stems | modWaveB.tsx ArrivalTimeline: label x clamped to ≥ 40 px with middle anchor, y at the stem top (inside the stems) | A label row is kept clear above the stems; the tag sits beside its own stem on the side with room. modWaveB.tsx | labFixes_20261114_F5 | Yes: in CANYON, "FAR WALL 291 ms" sits in its own row | FIXED |
| W12 | Wave 3: ARRIVALS row "15.5 ms" + "scattered" wrapped over the next row | vizWave.tsx arrivals rows: 16 mono characters in an 86 px row | "spread" in place of "scattered" (13 characters fit) | labFixes_20261114_F5 | Not seen (needs the ARRIVALS layer on module 3) | FIXED |
| W13 | Wave 8: text promised the readout would "swing from MAXIMUM to QUIET"; the strip says NODE / ANTINODE | modWaveA.tsx:1601 | "watch VERDICT swing from ANTINODE (loudest) to NODE (quiet)" | labFixes_20261114_F5 | — | FIXED |
| F7 | Foundations 2: text "a graph of PRESSURE over time" vs the graph's own caption "pressure along the air" | FoundationsCourseScreen.tsx m2 paras/check; viz.tsx:1201 | Text and check now say the graph is drawn along the air at one moment (Module 7 shows "one point, over time") | labFixes_20261114_F5 | — | FIXED |
| F8 | Foundations 12: the UNMIX sentence printed twice | FoundationsCourseScreen.tsx:1606 and the module para | The caption keeps only "Every analyzer in this app takes real signals apart the same way, live." | labFixes_20261114_F5 | — | FIXED |
| P5 | Playground: "(Update the app to hear these effects.)" | FoundationsPlaygroundScreen.tsx:561 (not behind `__DEV__`) | "(These effects do not play on this phone; EQ and BALANCE still show in the drawings.)" | labFixes_20261114_F5 | — | FIXED |
| M2 | Mic 10: "guess each habit before you read its title" while each title sits under its picture | micSpeakerScreenGuides.ts:331 | "look at each picture first and guess the habit, then read its title" | labFixes_20261114_F5 | — | FIXED |
| X1 | Silent first step (all my labs) | Every lab's first WHERE TO START is silent: Foundations m1 (tracer dot), Amplitude (colour bar), Mic, Wave, Speaker, Room (no sound at all); Playground fixed in P4 | — | — | — | DONE (only Playground needed it) |

## Shared change asked of me (coordinator, for F7): LANDED

- `src/screens/lab/foundations/bits.tsx`: `CheckSpec.why?: Record<number, string>`, keyed by the AUTHORED option index (the card shuffles only the order it shows). The wrong-answer line is now `checkWrongText(spec, picked)` = `spec.why?.[picked] ?? spec.wrongHint ?? 'Not quite — try again.'`, a pure function in the new `src/screens/lab/foundations/checkWords.ts`. Cards without `why` show exactly today's text. Tested in labFixes_20261114_F5 ("Shared check card"). F7 can fill in the data now; I will use it for my own cards in phase 2.

## SHARED NEEDS (from me)

None. Everything I needed was in my own files.

## New files (for the coordinator's commit)

- `src/screens/lab/wave/bezelWords.ts` (bezelMs, sumVerdict, cyclesOff, vsOnAxisReadout)
- `src/screens/lab/wave/sceneNameTags.ts` (on-picture names)
- `src/screens/lab/amplitude/amplitudeEndStep.ts`
- `src/screens/lab/foundations/checkWords.ts` (shared check card)
- `test/labFixes_20261114_F5.test.ts`

## Not checked, and why

- **Phone-only:** I saw nothing on a phone (there was no device in this round). Every look was the 8142 web preview at 390x844 or 390x770. The tag placement and the burst colour should get one look on a phone in the checker round.
- **Not seen on screen:**
  - W6: "≤ −12 dB" needs a touch drag of the listener on the canvas.
  - W12: needs the ARRIVALS layer turned on in module 3.
  - Amplitude's "just passed" step: the preview's orientation was already complete.
  - Speaker Placement: it had no phase 1 item.
- **Phase 2, not built now:** W8's bezel captions (LOSS/BNC, FRESNEL N), and every per-option reason, recap line and needs-sound tag, by the brief's rule.
- **Left as design, not bugs:** the G1 ideas that change a lesson's shape:
  - module 7's two-step reveal;
  - Room's FINISH key name;
  - grouping the Wave home list;
  - opening Mic on pickup patterns;
  - a label for Speaker's side view.

  They are suggestions, not plain bugs, and the brief puts rewrites out of scope.
- **The preview went down while I worked:**
  - Twice from another group's half-saved files (dj/pages/p06Gain.tsx, soundsystems/bits.tsx). I waited for the bundle to build again and re-checked.
  - Twice from my own edits: a JSX comment right after `? (` in the Playground, and a stale import after I renamed a file. I fixed both within minutes; the coordinator moved the Playground comment.

---

# Phase 2

**Summary:** every PHASE2_BRIEF mechanism that applies to my 7 labs is filled in, plus both of the coordinator's add-ons (the second-miss rule on the shared CheckQuestion; labId on every end screen). Tests: `test/labFixes_20261114_F5.test.ts` 97/97. I re-ran every existing test that reads a file I touched, plus F6 and F7, and all pass except `factAuditR1_C_other_20261022` (one assertion on `meter/modules/modMeterB.tsx`, which I do not own). No `npx tsc` (by the brief); every .tsx was parse-checked with esbuild and the 8142 bundle was confirmed to build after each edit.

## Coordinator add-ons

- **CheckQuestion second-miss rule (owner-approved row 4): DONE.**
  - The card lives in `src/screens/lab/foundations/bits.tsx`; the pure rule is in `checkWords.ts` (addMiss, showRevealAfterMisses).
  - First miss: that option's `why`, else wrongHint, else the default line.
  - A second, DIFFERENT wrong pick: its reason PLUS the reveal.
  - The same wrong option twice counts once. A right answer shows the reveal as before.
  - Seen on screen (Foundations module 1): wrong A → its reason only; A again → still no reveal; wrong C → its reason plus the reveal.
  - The F6 (52/52) and F7 (42/42) test files still pass.
- **labId on every end screen, for S4's recap: DONE.** Foundations `af_foundations`, Mic Principles `af_mic_principles`, Wave `af_wave_physics` (WaveLabHomeScreen AND WaveModuleScreen), Speaker Placement `af_speaker_coverage`, Room Design `room-design`. Seen on screen: Wave's What's left shows WHAT THIS LAB COVERS and AFTER THIS LAB · Speaker Placement & Coverage. **S4 can flip its "pending" rows.**

## Per lab

| Lab | Mechanism | Done? | Where | Test | Seen on screen |
|---|---|---|---|---|---|
| All 6 rack labs | First-visit bezel captions | Yes: one dictionary per lab in `foundations/bezelCaptions.ts` (≤ 14 characters, ≤ 3 words, never a unit), applied at ONE place per lab: Wave `waveLayout.tsx`; Foundations, Playground, Mic, Speaker and Room via `foundations/captionedRack.tsx` | bezelCaptions.ts, captionedRack.tsx | "first-visit bezel captions" (3) | Yes: Wave 1 (straight path / first bounce / echo vs direct / per bounce); Foundations 1 (cycles a sec / drawing speed); Mic 2 (pickup shape / how well heard); Room 2 (room shape); Speaker (sliders move / wide × tall) |
| Wave | Codes from phase 1 W8 | LOSS/BNC → "per bounce", FRESNEL N → "shadow depth", LOSS @ → "shadow loss", plus every other code (α, Δt, λ, MIN ƒ, REQ, F − R, GRATING, RT 125/500/2K…) | bezelCaptions.ts WAVE_CAPTIONS | yes | Yes (module 1) |
| Foundations, Playground | Sound-off line | Yes: on every rack whose dock has PLAY (shared SOUND_OFF_LINE; true here, every step can be done silently) | captionedRack.tsx | "silent learner" | Yes: "Sound off? You can still do every step…" at the top of module 1's well |
| Foundations | Stored values while silent | TONE and OUT read "OFF" (read aloud "(not heard: sound is off)") instead of a bare dash | FoundationsCourseScreen.tsx toneCell, M10 OUT | yes | Yes: "TONE: OFF (not heard: sound is off)" |
| Foundations, Playground | Needs sound + "can't listen now" | The 7 listening-only TRY THIS steps end "(Needs sound. Sound off? <what to watch instead>)". These labs have no step list or goal chips to carry a NeedsSoundTag; the steps live in the screen guide, which is plain text | foundationsScreenGuides.ts | yes (all ≤ 200 characters) | Not opened in the guide on screen |
| Foundations (15), Playground (1), Mic (7), Speaker (3), Wave (19) | `why` for every wrong option + balanced lengths | Yes: 45 cards, one reason per wrong option (≤ 30 words, points at the picture, never quotes the answer). Right answers shortened, or distractors lengthened, where the right one was the longest by far (the test holds right ≤ 1.6× the longest wrong) | the 6 lab files | 45 per-card tests | Yes (Foundations 1) |
| Mic | Picture rounds (SPOT THE MISTAKE) | Options are built from the field-guide cards, so no fixed `why`; they keep their shared hint, and the second-miss rule shows the reveal | MicPrinciplesLabScreen.tsx ~1528 | — | — |
| Amplitude | Own check (RampCheck) | Already one reason per question, and each question has exactly one wrong option. Nothing to add | AmplitudeOrientation.tsx CHECK_WRONG | — | — |
| All | FINISH after a pass | Not applicable: none of my labs is a LabShell lab with a check tab. Their last module/section ends on FINISH and What's left already; Amplitude and the Playground end through ReviewLabEnd | — | — | — |
| Foundations, Mic, Speaker, Wave (×2), Room | End-screen rows | Each unfinished row names its unit: "Not opened yet. Inside: <its WHAT YOU'RE LEARNING line>". These labs credit a unit when it is opened (the owner's call on "done" is pending), so the visit IS the missing piece; the rule is said once under HOW A MODULE/SECTION COUNTS | foundations/endRows.ts + the 6 LabEndScreen calls | "end screens" (8) | Yes: Wave's What's left |
| Foundations, Mic, Speaker, Room | State-neutral end-guide start | "Read WHERE TO START at the top: it names the next thing to do from where you are." (Wave has no end guide) | the 4 *ScreenGuides.ts files | yes | — |
| All | Arrival holds | None needed. Amplitude's orientation already holds the term card (`holdLabTermIntro`); no other screen of mine shows its own popup on arrival | — | — | — |
| All | D37 accuracy chip | No change: Foundations, Playground, Mic, Wave and Amplitude carry no chip (concept labs). Room Design and Speaker Placement keep theirs (measuring and acoustics labs, per S3) | — | — | — |
| CHECK screen-guide lines | | None of my guides promised "the explanation on a wrong tap". Foundations' "tap an answer to see why it's right or wrong" is now exactly true | — | — | — |
| Reading well (S3 fold) | | Works: scrolling the well folds the display to a slim strip with OPEN DISPLAY; the bezel and its captions stay | automatic | — | Yes: Wave module 1 and Foundations module 1 at 390x844 |

## New files (phase 2)

- `src/screens/lab/foundations/bezelCaptions.ts`
- `src/screens/lab/foundations/captionedRack.tsx`
- `src/screens/lab/foundations/endRows.ts`
- `src/screens/lab/foundations/checkWords.ts` (extended)

## SHARED NEEDS (phase 2)

None.

## Not checked on screen (phase 2)

- The Playground's sound-off line and its check reason (covered by tests).
- The second-miss rule on a Wave or Mic card (it is the same component as the Foundations card I saw).
- Captions on the 2nd visit, when they should hide (S3's mechanism).

---

# Checker C3 findings in my files (2026-11-14): both fixed

| # | Finding | Cause (file:line) | Fix | Test | Seen on screen |
|---|---|---|---|---|---|
| F-1 | Wave 16: "YOU (drag)" over "RING GAP > λ" | vizWave.tsx tag placer: `placed` held only the object glyphs, not text already drawn on the room | Before any tag is placed, `placed` now also holds the RING GAP plate, every probe label and every module label (`textBox`) | labFixes_20261114_F5 "C3 F-1" | Yes, Wave 16 at 390x844, FREQ 500 Hz: YOU (drag) at y 231-242, RING GAP at y 269-280, apart |
| O-2 | The CHECK YOURSELF options reordered by themselves 0.5-4 s after GOT IT (Gain M3, M5) | `foundations/bits.tsx` shuffled with `Math.random` in a `useState` initializer, so ANY remount reordered the options. I could not make the card remount on a fresh load (watched below), and nothing in the Gain host, ScreenGuideHost or RackUnit re-parents the well. The likely trigger is the dev server's hot reload: C3's run overlapped my phase-2 edits to this very file, and adding a `useState` (the `misses` list) makes React Fast Refresh reset the component's state and re-run the shuffle. That happens in the web preview only, never in a learner build | The order is now SEEDED by the question and its options (`checkWords.seededOrder`, FNV-1a + mulberry32): the same question always shows the same order, so no remount of any kind can reorder it. Different questions still get different orders (the right answer is not parked in one slot) | labFixes_20261114_F5 "C3 O-2" (same order on every mount; a full permutation; the right answer lands in all 3 slots across questions; no Math.random) | Yes, on my own tab with the intro-seen ids removed (below): Gain `follow` (M3) watched 48 s from load through GOT IT, and Gain `fadervsgain` (M5) 10 s after GOT IT. The card node never left the page, and the order "The clipping alrea… / You didn't pull th… / The fader is broke…" stayed the same |

**Intro-seen ids I removed** (from `ape:intro:screenIntroCards` in localStorage on 8142): `iar6v34` (Gain "Follow the Signal") and `i167vqn8` (Gain "Gain vs. Fader"). localStorage is shared by every tab on 8142, so any agent opening those two modules in that window would also have seen their intro card. Both ids were written back when I tapped GOT IT (checked: present again, 202 entries as before).

Parse-checked with esbuild; the 8142 bundle answers 200. F5 tests 100/100; F7 45/45. F6 57/58: its one failure is its own AWG refusal test (calc, F6's F-3), not my files. No tsc.
