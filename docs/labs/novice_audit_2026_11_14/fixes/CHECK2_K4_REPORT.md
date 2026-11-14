# CHECK2 K4 report: F8 + F9 phase 3 (2026-11-14)

Checker K4, round 2. Scope: F8_REPORT phase 3 (Ear Training, Envelope, Speech, Drum Tuning, Tuning, Cymatics, rack-lab model notes) and F9_REPORT phase 3 (Miking, Mic Selection). Preview http://localhost:8142, one built-in-pane tab, 390x844. Sound kept OFF throughout.

**Summary: 49 checked · 45 PASS · 2 FAIL · 2 NOT SEEABLE / NOT SEEN.** Plus notes on near-change regressions and a list of every ALL-CAPS model line still on screen.

Tab note: the pane is shared by several checkers. At the very start, one `navigate` call without a tabId landed on another checker's active tab (tab-2) and moved it to `#labpreview/EarModule/frequency` once; that tab's owner had navigated it back by my next call. After that I worked only in my own tab (tab-4, 390x844), closed it at the end, and closed the `seed` tab my first call had opened. Hash changes do not remount the preview, so each lab was opened with a reload. Storage: I removed no keys. Shared storage is wiped across tabs (F8's note), so Envelope's `ape:envelope:v1` read back null mid-walk; in-session ✓ marks were used as the evidence.

## Table

| Lab | Item (group, decision) | Steps | Seen | Result |
|---|---|---|---|---|
| Ear Training | F8 (4) answers locked until played | Drill, tap an answer before playing | aria-disabled=true, nothing happens | PASS |
| Ear Training | F8 (4) a refused play does not unlock | ▶ A → KEEP SOUND OFF | still locked, line unchanged | PASS |
| Ear Training | F8 (4) sound-off message + way out | Drill with sound off | "This drill needs sound, and sound is off… go to the drill list; nothing here is lost." + TO THE DRILL LIST › | PASS |
| Ear Training | F8 (4) TO THE DRILL LIST › works | Hub → OPEN → tap it | back on the module list | PASS |
| Ear Training | F8 (2) no "Level 2 of 5" / "Trial 1 of 10" | Drill header, round line, WHAT'S LEFT | "Level 1 · Octave centers", "Trial 1 · Streak 0", rows "Not tried yet · clear level 2 at 80 %…" | PASS |
| Ear Training | F8 (4) sound-on line and unlock after every clip | needs sound | — | NOT SEEABLE (sound rule) |
| Envelope | F8 (2) strip | open | "MODULE 1 ▾" | PASS |
| Envelope | F8 (1) opening does not count | CONTENTS on module 1 | 01 ○ | PASS |
| Envelope | F8 (1) NEXT without the goal does not count | strip NEXT, CONTENTS | 01 ○ | PASS |
| Envelope | F8 (1) goal counts | module 2 tap Kick drum | 02 ✓ | PASS |
| Envelope | F8 (1) WHAT'S LEFT rows | end screen | "Still to do: …" per hands-on module; reading module none; no "opening counts" | PASS |
| Envelope | F8 (2) check counter | module 7, one right | "6 STILL TO GET RIGHT" → "5 STILL TO GET RIGHT" | PASS |
| Envelope | F8 (3) module word | module 6 GOT IT › | "✓ THIS MODULE IS DONE · NEXT MOVES ON" | PASS |
| Speech | F8 (1) NEXT without the goal | module 1 NEXT, CONTENTS | 01 ○ | PASS |
| Speech | F8 (1) WHAT'S LEFT rows | end screen | 10 "Still to do:" rows, Voices Differ none | PASS |
| Speech | F8 (2) check counter | module 11 | "0 correct this visit · 5 more completes the module" | PASS |
| Tuning | F8 (3) chapter word | strip, CONTENTS, WHAT'S LEFT | CHAPTER / "14 chapters not done yet" / HOW A CHAPTER COUNTS | PASS |
| Tuning | F8 (3) rack model note | chapter 1 | "Every number here is worked out from exact ratios; nothing is measured." | PASS |
| Tuning | F8 (2) ch 14 LEFT | chapter 14 | "LEFT 6 · still to do" | PASS |
| Tuning | F8 (3) no ALL-CAPS "NOT A MEASUREMENT" | chapter 5 BEATING MODEL | "EXPLANATORY MODEL · NOT A MEASUREMENT" in the drawing | **FAIL K4-1** |
| Drum Tuning | F8 (3) chapter word | strip, CONTENTS, WHAT'S LEFT | "CHAPTER 1 · STEP 1", "7 chapters not done yet" | PASS |
| Drum Tuning | F8 (3) ORDER / TURNS / STAGE | ch 2 st 3, ch 2 st 4, ch 3 st 1 | "ORDER 1 / 8", "TURNS 0 / 8", "STAGE 1 / 7" | PASS |
| Drum Tuning | F8 (3) model note | ch 1, 2, 3 | "This drum is a model drawn to explain the idea, not a measurement." | PASS |
| Drum Tuning | S3 "drawing…" | ch 2, ch 3 first frame | "drawing…" then the drawing | PASS |
| Cymatics | F8 (1) not on opening | open module 1, CONTENTS | 01 ○ | PASS |
| Cymatics | F8 (1) counts on NEXT | strip NEXT, CONTENTS | 01 ✓ | PASS |
| Cymatics | F8 (1) CONTENTS jump marks nothing | jump 02 → 04 | 02 ○, 04 ○ | PASS |
| Cymatics | F8 (1) HOW IT COUNTS | WHAT'S LEFT | "A module counts once you work through it and move on with NEXT ›…" | PASS |
| Cymatics | F8 (1) ALL MODULES DONE | needs all 8 + check | code `CymaticsModuleScreen.tsx:142`, `CymaticsHomeScreen.tsx:151` | NOT SEEN |
| Oscillators | F8 (3) model note | EXPLORE | "This picture is worked out from the math of the wave, not measured." | PASS |
| Noise | F8 (3) model note | EXPLORE | "These slopes are idealized, worked out from the math, not measured." | PASS |
| Harmonics | F8 (3) model note | EXPLORE | "This picture is worked out from the math of the tone, not measured." | PASS |
| FM | F8 (3) model note | EXPLORE | "Each line’s height comes from the Bessel math; each sits at FC ± k·FM." | PASS |
| Modular | F8 (3) model note | EXPLORE | "Every cable in this patch is live, and the knobs show your settings." | PASS |
| Autotune | F8 (3) model note | EXPLORE | "The curve on this grid of cents shows the exact retuning you hear." | PASS |
| Harmonograph | F8 (3) model note | EXPLORE | "The machine is drawn from the pendulum equations, not filmed." | PASS |
| Bass | F8 (3) model note | EXPLORE | "The frets sit at their real spacing, worked out from the fret equation." | PASS |
| Oscillators, Noise | F8 (3) guides describe the note, not the old badge | LEARN › CONTROLS | still quote "ANALYTIC MODEL — NOT A MEASUREMENT" / "IDEALIZED SPECTRAL SLOPES" | **FAIL K4-2** |
| Miking | F9 (5) E16 3.3 GO DEEPER | E16 → 03 → step 3 | core + "GO DEEPER ▾ · 5 more cards"; 824 → 1,242 words when opened | PASS |
| Miking | F9 (2) M01 2.1 SETUP | M01 → 02 | bezel "SETUP 1", key "SETUP ▪ 1", lane "one mic" | PASS |
| Miking | F9 (2) quick check | M01 "I already mic kicks" | "6 still to answer." → "5 still to answer · …" | PASS |
| Miking | F9 hub titles | Miking hub | "Bass Clarinet", "Amplified Speakers and Leslie" (2 lines, not cut), "0 modules done" | PASS |
| Miking | F9 (3) "drawing…" | E16 3.1, 3.2; M01 4.1 Placement Studio | first frame "drawing…", then the drawing | PASS |
| Miking | F9 (2)/(3) strip | any lesson | "MODULE 3 · STEP 3 ▾" (no total) | PASS |
| Mic Selection | F9 (2) no "3 OF 11" | module 1 | tag "MODULE 1"; strip "MODULE 1 ▾" | PASS |
| Mic Selection | F9 (1) Module 1 ✓ only after its goal | open → CONTENTS; tap Condenser → CONTENTS | 01 ○ then 01 ✓ | PASS |
| Mic Selection | F9 (1) end rows | NEXT through 02 without goal; WHAT'S LEFT | 02 not counted; every row "Still to do: …"; locker "Optional, still counts. Still to do: cover all ten jobs." | PASS |
| Mic Selection | F9 (1) HOW IT COUNTS | WHAT'S LEFT | "… Opening it does not count it. …" | PASS |
| Mic Selection | F9 (3) "module" everywhere | end screen + source scan | no learner string says lesson/page | PASS |

## FAIL list

**K4-1 · Tuning chapter 5: ALL-CAPS "EXPLANATORY MODEL · NOT A MEASUREMENT" still drawn on screen**
- Repro: `#labpreview/TuningLab` at 390x844 → CHAPTER ▾ → 05 Harmonic Alignment and Beating → scroll the well to BEATING MODEL. Top right of the drawing reads "EXPLANATORY MODEL · NOT A MEASUREMENT" in caps, and the green envelope line is drawn straight through the words.
- File: `src/screens/lab/tuning/components/harmonicLadder.tsx:152` (`BeatingModel`, `<SvgText>`). Also the full-screen badge `ch4Harmonics.tsx:206` (`BADGE_MODEL` = "EXPLANATORY MODEL — not a measurement", `tuning/rackLayout.tsx:66`).
- Why FAIL: decision 3 asks for one plain sentence in place of caps "NOT A MEASUREMENT", and F8 lists Tuning as converted. The plain sentence already sits under the figure ("Explanatory model, not a measurement: …"), so the in-drawing line can simply go.

**K4-2 · Oscillators and Noise LEARN still quote the retired caps badge**
- Repro: `#labpreview/OscillatorLab` → LEARN → CONTROLS → "What the display shows": "The badge ANALYTIC MODEL — NOT A MEASUREMENT means the bars are calculated from the wave." Then EXPLORE: the display shows the sentence "This picture is worked out from the math of the wave, not measured.", not that badge.
- Same in `#labpreview/NoiseLab` → LEARN → "What the display shows": "They are ideal slopes (IDEALIZED SPECTRAL SLOPES), not a measurement of your sound."
- File: `src/features/lab/guidedLessons/content.ts:664` (oscillator) and `:519` (noise).
- Why FAIL: F8 says "Guides that quoted the old badge face now describe the note"; these two LEARN entries were missed, so LEARN shows caps disclaimer text and points to a badge that is no longer on screen.

## ALL-CAPS model lines still on screen (as the brief asks)

| Lab | Text on screen | Where shown | File:line |
|---|---|---|---|
| Tuning | "EXPLANATORY MODEL · NOT A MEASUREMENT" | ch 5 beating model, inline (K4-1) | `tuning/components/harmonicLadder.tsx:152` |
| Envelope | "ILLUSTRATIVE MODEL — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT · vertical = relative level · horizontal = time" | under every chart (modules 1, 2, 3, 5), inline Text | `envelope/EnvelopeChart.tsx:294` (string `:52`) |
| Envelope | "ILLUSTRATIVE MODEL — … · syllable timing is typical, not a recording" | speech-syllable figure, inline Text | `envelope/EnvelopeLabScreen.tsx:223` |
| Envelope | "TYPICAL VALUES — ILLUSTRATIVE, NOT MEASURED · real sounds vary" | module 4, inline Text | `envelope/EnvelopeLabScreen.tsx:335` (badge `:296`) |
| Oscillators | "The badge ANALYTIC MODEL — NOT A MEASUREMENT means…" | LEARN (K4-2) | `features/lab/guidedLessons/content.ts:664` |
| Noise | "(IDEALIZED SPECTRAL SLOPES), not a measurement" | LEARN (K4-2) | `features/lab/guidedLessons/content.ts:519` |
| Cymatics | "ILLUSTRATIVE — AIR MOLECULES, LONGITUDINAL WAVE" | module 1 figure, inline FigBadge | `cymatics/modules/modIntro.tsx:52,56` |
| Cymatics | "SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTER-DRIVEN" | home hero plate | `cymatics/modules/modIntro.tsx:79` style badge (home) |
| Cymatics | "SIMULATION · ILLUSTRATIVE cone stages · CALCULATED fs, ka…" | Membrane studio | `cymatics/MembraneStudioScreen.tsx:453` |
| Bass | "READOUT — EXACT VALUES FROM THE STRING MODEL" (a heading, not a disclaimer) | EXPLORE notes | `BassLabScreen.tsx` |
| Drum Tuning | "MODEL · illustration, not a measurement" / "MODEL · the air couples the heads" | full screen only (ExpandableFigure) | `drumtuning/modules/shared.tsx:49`, `ch4Whole.tsx:107` |

Correction to F8's phase-3 note: the Envelope lines a learner sees inline are Envelope's own `<Text>` captions, not ExpandableFigure badges (that component shows its badge only in full screen, `kit/ExpandableFigure.tsx:37`), so they can be changed in the lab. Envelope is not in the must-convert list, so they are listed, not failed.

## Regression notes near the changes (not FAILs)
- Ear Training: locked answer chips look exactly like live ones (`EarModuleScreen.tsx:753-762`, no locked style); the amber line above explains it.
- Shared S1 inline intro card (`src/features/lab/screenGuide/ScreenGuide.tsx:874`, absolute at the bottom): on Envelope module 6 it covers the lower half of the in-flow "NEXT: CHECK YOURSELF ›" (centre still tappable); on Tuning ch 5 and FM EXPLORE it covers part of the well until ✕.
- Envelope WHAT'S LEFT: the end-guide popup arrived after paint and took my first tap on a row.
- Oscillators: the first EXPLORE tap after a reload raised the Sound Safety sheet and the tab stayed on LEARN after KEEP SOUND OFF; the second tap switched. (Noise: sheet too, but the tab switched.)
- Drum Tuning: STAGE keeps "1 / 7" while Miking's STAGE key dropped its total; both are positions, but the two labs now differ. TURNS lane "finger-tight: the known co…" is ellipsized at 390.
- Speech: the first-open card leads with a "Miking" term card (`src/features/intro/labTermIntroData.ts`, S1).

## Running log

### Ear Training (F8 phase 3, decision 4 and 2)
- Hub → Frequency Recognition → OPEN. Drill shows "Trial 1 · Streak 0", question with NEEDS SOUND, then: "This drill needs sound, and sound is off. The answers open once you have played every clip. Turn sound on (Profile › AUDIO OUTPUT) to practice, or go to the drill list; nothing here is lost." and "TO THE DRILL LIST ›". PASS.
- Tapped "A is higher" before playing: nothing happened; both chips aria-disabled=true. PASS (lock works).
- Tapped ▶ A → Sound Safety sheet → KEEP SOUND OFF: chips still locked, line unchanged. PASS (a refused play does not unlock).
- TO THE DRILL LIST › from the drill opened from the hub: returned to the module list (Frequency Recognition row expanded). PASS. (Opened as the preview's root screen it does nothing: no back stack in the harness, not an app bug.)
- Header subtitle "Level 1 · Octave centers" (no "of 5"); WHAT'S LEFT rows "Not tried yet · clear level 2 at 80 % over 20 answers to count"; no "Trial n of 10", no "Level n of 5". Code: earLabEnd.ts:70,73. PASS.
- NOTE (not a FAIL): the locked answer chips look exactly like live chips (opacity 1, same colors, EarModuleScreen.tsx:753-762 has no locked style); a tap does nothing. The amber line just above explains it, so it is not a silent dead tap, but a dim style would read better.
- Sound-on wording (sound only) "Play every clip first…" and unlock after every clip played: NOT SEEABLE (needs sound; rule forbids enabling). Code earLabEnd.ts:36-45 and onAnswer guard EarModuleScreen.tsx:423 match.

### Envelope (F8 phase 3, decisions 1, 2, 3)
- Strip reads "MODULE 1 ▾" (no "/ 7"). PASS.
- Opened module 1, CONTENTS: 01 shows ○. Pressed strip NEXT without touching anything; CONTENTS on module 2: 01 still ○. PASS (NEXT alone no longer counts a hands-on module).
- Module 2: tapped "Kick drum"; CONTENTS: 02 ✓. PASS.
- WHAT'S LEFT: "6 modules plus the check not done yet"; HOW A MODULE COUNTS says jumping does not count and a goal module "counts once that goal or check is met; NEXT moves on without counting it"; rows "Still to do: move any slider, or switch a curve." / "tap one of the transient types." / "tap one of the numbered sounds." / "tap Percussive (snare) or Sustained (trumpet)." / 07 "get all six questions in this module right."; 06 (reading) has no line. No "opening counts". PASS.
- Module 7: "6 STILL TO GET RIGHT"; one right answer → "5 STILL TO GET RIGHT". PASS (no "n OF 6 CORRECT").
- Module 6: GOT IT › → "✓ THIS MODULE IS DONE · NEXT MOVES ON" ("module" word). PASS.
- Model notes: ALL-CAPS disclaimers STILL ON SCREEN (listed as the brief asks):
  - modules 1, 2, 3 and 5: "ILLUSTRATIVE MODEL — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT · vertical = relative level · horizontal = time", an INLINE `<Text>` caption under every chart: `src/screens/lab/envelope/EnvelopeChart.tsx:294` (text from `CHART_HONESTY`, `EnvelopeChart.tsx:52`). The same string is also the full-screen ExpandableFigure badge (`EnvelopeChart.tsx:215`).
  - the speech-syllable figure: inline caption `EnvelopeLabScreen.tsx:223` ("ILLUSTRATIVE MODEL … · syllable timing is typical, not a recording"), badge `:207`.
  - module 4: "TYPICAL VALUES — ILLUSTRATIVE, NOT MEASURED · real sounds vary", inline `<Text>` caption `EnvelopeLabScreen.tsx:335`; badge `:296`.
  - So F8's note ("Not converted: the ExpandableFigure badges in Envelope…, drawn by the shared ExpandableFigure, which has no plain mode") does not describe what is on screen: ExpandableFigure shows its badge only in full screen (`kit/ExpandableFigure.tsx:37`); the caps lines a learner sees inline are Envelope's own Text captions, which a lab-local edit can change. Envelope is not in the brief's must-convert list (8 rack labs, Tuning, Drum Tuning), so this is listed, not failed.
- Regression notes (shared, S1): (a) on WHAT'S LEFT the end-guide popup arrived after the screen painted and swallowed my first tap on the "07 Check Yourself" row (tap had to be repeated). (b) On module 6 the inline WHERE TO START card (`src/features/lab/screenGuide/ScreenGuide.tsx:874`, absolute at the bottom) covers the lower half of the in-flow "NEXT: CHECK YOURSELF ›" button; its centre is still tappable (elementFromPoint hit the button), and ✕ closes the card. Not a dead tap.

### Speech (F8 phase 3)
- Strip "MODULE 1 ▾". Module 1 opened, strip NEXT without a tap; CONTENTS: 01 ○ and 02 ○. PASS.
- WHAT'S LEFT: "11 modules plus the check not done yet"; every hands-on row names its task ("Still to do: tap one of the numbered parts." … "Still to do: five right answers in this module."); 09 Voices Differ (reading) has no line; HOW A MODULE COUNTS as in Envelope. PASS.
- Module 11: "0 correct this visit · 5 more completes the module" (no "n of 7"). PASS.
- Model notes on Speech: none in caps on screen (the FORMANTS badge `vowelViz.tsx:315` is sentence case; PLOSIVE badge `speechPagesB.tsx:189` passes `note`).
- NOTE (term card, not F8's file): on first open the Speech lab's intro card leads with a "Miking" term ("Miking means choosing and placing microphones on a source…") above "THE SPEECH SYSTEM". Odd for the Speech lab's first screen; source is the lab-term popup data (`src/features/intro/labTermIntroData.ts`), S1's file.

### Tuning (F8 phase 3)
- Strip "CHAPTER 1 ▾"; CONTENTS rows by chapter; WHAT'S LEFT "14 chapters not done yet", "HOW A CHAPTER COUNTS: A chapter counts once its own task is done, not when it is opened", each row "Still to do: …". PASS (one word: chapter).
- Chapter 1 rack: model note reads "Every number here is worked out from exact ratios; nothing is measured." PASS.
- Chapter 14: bezel "LEFT 6 · still to do" (no "DONE n/6"); first frame showed "drawing…". PASS.
- **FAIL (K4-1)**: chapter 5 "Harmonic Alignment and Beating", the BEATING MODEL figure in the well still draws ALL-CAPS "EXPLANATORY MODEL · NOT A MEASUREMENT" inside the SVG, top right, and the green envelope line runs straight through the words. File: `src/screens/lab/tuning/components/harmonicLadder.tsx:152` (`BeatingModel`, SvgText). The same figure is wrapped by `ch4Harmonics.tsx:204-208` with `badge={BADGE_MODEL}` ("EXPLANATORY MODEL — not a measurement", caps prefix) for full screen. The plain sentence under it ("Explanatory model, not a measurement: …") already says the same thing, so the in-drawing caps line is now a duplicate.

### Drum Tuning (F8 phase 3)
- Strip "CHAPTER 1 · STEP 1 ▾", CONTENTS lists 7 chapters, WHAT'S LEFT "7 chapters not done yet … Start with the first chapter", each row names its task (e.g. 02 "Every fault found and nothing extra flagged, on any drum, then ✓ REVEAL KEY."). PASS (one word: chapter; STEP only on the strip).
- Rack model note on every chapter seen (1, 2, 3): "This drum is a model drawn to explain the idea, not a measurement." PASS.
- Renamed readouts seen: ch 2 step 3 "ORDER 1 / 8" (fader position), ch 2 step 4 "TURNS 0 / 8" (fader position), ch 3 step 1 "STAGE 1 / 7". PASS for the rename (no readout says STEP).
- NOTE (consistency, not a FAIL): STAGE "1 / 7" (`ch3Method.tsx:194`) keeps an n / total form, while F9 turned Miking's identical "STAGE 1 / 4" key into the item alone. Both can be read as a fader position (allowed), but the two labs now treat the same word differently. Same for ROD/LUG "n / 6" (`ch1Sound.tsx:235`, `ch3Method.tsx:225,275`), which are clearly positions and fine.
- "drawing…" placeholder seen as the first frame on ch 2 steps 1, 3, 4 and ch 3 step 1, replaced by the drawing. PASS.
- Cut text: ch 2 step 4, the TURNS lane value "finger-tight: the known co…" is ellipsized at 390 (lane tag). Minor, likely pre-existing.
- ExpandableFigure badges in Drum Tuning ("MODEL · illustration, not a measurement", `modules/shared.tsx:49`, used at `ch2Prepare.tsx:318`; "MODEL · the air couples the heads", `ch4Whole.tsx:107`) show only in full screen and are mostly sentence case, with a caps "MODEL ·" prefix.

### Cymatics (F8 phase 3)
- Home → NEW HERE? START HERE › opened module 1; CONTENTS: 01 ○ (opening does not count). PASS.
- Strip NEXT → module 2; CONTENTS: 01 ✓. PASS (counts on NEXT).
- CONTENTS jump 02 → 04; CONTENTS: 02 ○ and 04 ○ (a jump marks nothing). PASS.
- WHAT'S LEFT: "7 modules plus the check not done yet", HOW A MODULE COUNTS "A module counts once you work through it and move on with NEXT › (FINISH › on the last). Modules already counted stay counted. The check counts once every answer is right." The check is drawn on the end screen ("5 still to get right"). "✓ 1 DONE". PASS.
- "ALL MODULES DONE" title: code only (`CymaticsModuleScreen.tsx:142`, `CymaticsHomeScreen.tsx:151`); not reached on screen (would need all 8 modules plus the 5-question check). NOT SEEN.
- ALL-CAPS disclaimers still on screen in Cymatics (listed): module 1 "ILLUSTRATIVE — AIR MOLECULES, LONGITUDINAL WAVE" (`cymatics/modules/modIntro.tsx:52,56`, FigBadge, inline); home hero "SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTER-DRIVEN" (`modIntro.tsx:79` style badge on the home plate); Membrane studio "SIMULATION · ILLUSTRATIVE cone stages · CALCULATED …" (`MembraneStudioScreen.tsx:453`). None says "NOT A MEASUREMENT".
- NOTE: in the web preview, module 1's two figure boxes are empty black boxes (no "drawing…"), because Cymatics draws with Skia, which the web build lacks (F8 phase 1 item 19). Not seeable as a learner bug here.

### Rack labs: model notes (F8 phase 3, decision 3)
- Oscillators EXPLORE: "This picture is worked out from the math of the wave, not measured." PASS.
- Noise EXPLORE: "These slopes are idealized, worked out from the math, not measured." PASS.
- **FAIL (K4-2)**: the LEARN tab of both labs still quotes the retired ALL-CAPS badge, on screen, and names a badge that is no longer shown:
  - Oscillators LEARN › CONTROLS › What the display shows: "The badge ANALYTIC MODEL — NOT A MEASUREMENT means the bars are calculated from the wave." (`src/features/lab/guidedLessons/content.ts:664`)
  - Noise LEARN › CONTROLS › What the display shows: "They are ideal slopes (IDEALIZED SPECTRAL SLOPES), not a measurement of your sound." (`content.ts:519`)
  - The old faces survive as the fallback strings (`NoiseLabScreen.tsx:275` "IDEALIZED SPECTRAL SLOPES — ANALYTIC, NOT A MEASUREMENT"), but the learner now sees the sentence, so LEARN describes something not on screen. F8 says "Guides that quoted the old badge face now describe the note"; these LEARN entries were missed.
- NOTE: on Oscillators the first tap on EXPLORE after a reload brought up the Sound Safety sheet and the tab stayed on LEARN after KEEP SOUND OFF; the second tap switched. On Noise the first EXPLORE tap brought the sheet too, but the tab did switch. The sheet on entering EXPLORE (no ▶ pressed) may be by design (the rack arms audio); the lost first tap on Oscillators is a possible dead tap.
- Harmonics EXPLORE: "This picture is worked out from the math of the tone, not measured." PASS.
- FM EXPLORE: "Each line’s height comes from the Bessel math; each sits at FC ± k·FM." PASS (plain; no caps).
- Modular EXPLORE: "Every cable in this patch is live, and the knobs show your settings." PASS.
- Autotune EXPLORE: "The curve on this grid of cents shows the exact retuning you hear." PASS.
- Harmonograph EXPLORE: "The machine is drawn from the pendulum equations, not filmed." PASS.
- Bass EXPLORE: "The frets sit at their real spacing, worked out from the fret equation." PASS. Still in caps on the page, as a section heading rather than a disclaimer: "READOUT — EXACT VALUES FROM THE STRING MODEL" (BassLabScreen.tsx; listed only).
- No SVG text with MODEL/MEASUREMENT found in any of the 8 rack displays.

### Miking (F9 phase 3)
- E16 (Jazz Big Band) → CONTENTS → 03 Choose the microphones → NEXT, NEXT → step 3.3. Strip "MODULE 3 · STEP 3 ▾" (no total). The step opens with the "Can’t listen now?" line, the job line and two mic cards (small-diaphragm cardioid, small-diaphragm omni), then "GO DEEPER ▾ · 5 more cards". Page words 824 before; tapped GO DEEPER → "GO DEEPER ▴" and five more cards (figure-8 condenser side-address, end-address dynamic supercardioid, end-address dynamic cardioid, …); page words 1,242. All content kept, beginner part first. PASS.
- "drawing…" placeholder is the first frame on E16 3.1 and 3.2 (rack steps). PASS.
- (Checked and withdrawn: a first tap on the strip after a reload seemed dead; on a third reload I saw the lesson's intro card was up and that first tap was closing it. Not a bug.)
- M01 (Kick Drum) "I already mic kicks" → QUICK CHECK: foot line "6 still to answer."; after one answer "5 still to answer · this is your first try — leaving this module keeps your answers." No "n of 6". PASS.
- M01 → CONTENTS → 02 → step 2.1: bezel "SETUP 1", dock key "SETUP ▪ 1", lane "SETUP … one mic". No "1 / 6". PASS. The step's intro shows as the inline WHERE TO START card (later step of the visit).

