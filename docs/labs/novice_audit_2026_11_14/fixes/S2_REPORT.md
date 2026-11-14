# S2 report: check card and end screen (lab fix round, 2026-11-14)

**Summary: 9 fixed · 1 not a bug (explained on screen now) · 0 held · 4 shared needs.** (Items 9–11 were added after the coordinator handed me `src/features/lab/understandingChecks.ts`. SHARED_API.md section S2 §2 now says plainly that passing `checkEnd={<LabCheckEnd …/>}` is the FINISH API.)

API for phase 2: `SHARED_API.md`, section S2 (written first, before polishing). Worked examples: Gate and Envelope (per-option reasons), Envelope, Gate and Stereo (recap + next lab).

## Items

| # | Item (lab, what) | Verified in code (file:line) | Fix (files changed) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| 1 | Check card: the first wrong tap printed the explanation, which names the answer (row 4, pattern 4) | src/components/LabUnderstandingCheck.tsx:157-161 (before): `got \|\| wrong ?` drew `q.explanation` | src/features/lab/understanding.ts (optional `why`, `hint`); new src/features/lab/checkFeedback.ts; src/components/LabUnderstandingCheck.tsx | test/labFixes_20261114_S2.test.ts "row 4" (fails on the old card) | Yes, Gate CHECK at 390: 1st miss = NOT QUITE — TRY ANOTHER + that option's reason only; a 2nd, different miss = reason + THE EXPLANATION; right = CORRECT + explanation | FIXED |
| 2 | Gate and Envelope: a reason for every wrong option (the two examples) | src/features/lab/understandingChecks.ts GATE, ENVELOPE (no `why` before) | understandingChecks.ts (`why` lines only; no option, answer or explanation touched) | "row 4 ratchet" (every authored `why`/`hint`: key is an option, never the correct one, ≤ 30 words, never quotes the answer) | Yes (Gate Q1) | FIXED |
| 3 | End screen: "What you learned" recap slot and next-lab slot (row 5) | kit/LabEndScreen.tsx had neither | new src/features/lab/labEndContent.ts; kit/LabEndScreen.tsx; kit/PagedLab.tsx, kit/LabCheckEnd.tsx, kit/ReviewLabEnd.tsx pass their id | "row 5 · labEndContent" (routes must exist in RootStackParamList; knowledge not skills; US spelling) | Yes: Stereo end layer showed WHAT THIS LAB COVERS + AFTER THIS LAB; Envelope the same; tapping AFTER THIS LAB on Envelope opened Harmonics Lab | FIXED |
| 4 | End screen: a state-aware WHERE TO START (row 5; G5c "tap the first page still listed" with none listed; G6 EQ Lab "open the first module" when only the check was left) | none existed | src/screens/lab/kit/labEnd.ts `whereToStart`; LabEndScreen.tsx | "row 5 · WHERE TO START" (start / resume / only the check / done / unreadable) | Yes: Envelope "Pick up at Common Sound Shapes, the first one still listed" and the tap opened page 2; Stereo "Start with the check" | FIXED |
| 5 | Quick win 17: the shared sentence once, not on every row (Beginning Mixing printed it 13 times) | kit/PagedLab.tsx:542-546 (before): `handsOnDetail` as the `detail` of every manualDone row | PagedLab.tsx (`howItCounts`, rows carry only the lab's own `pageDetail`); labEnd.ts (`PAGE_READ_RULE`, `PAGE_TASK_RULE`, `howItCountsHeading`); LabEndScreen.tsx (`howItCounts`, printed once under HOW A PAGE COUNTS) | "quick win 17"; test/mixingHandsOnCredit_20261014.test.ts updated with the owner's approval quoted | Partly: Beginning Mixing showed the sentence ONCE under HOW A PAGE COUNTS (first version, which still had a short per-row line; I then removed that line too, because 16 identical short lines repeat the same fault). The final version is not seen on screen: the 8142 preview stopped loading and my tabs were closed (pane contention). Covered by tests. | FIXED |
| 6 | End-screen row label cut at 390 (G1 Amplitude: "Pass CHECK YOURSELF … MARK …") | LabEndScreen.tsx row label `numberOfLines={2}` | LabEndScreen.tsx (label wraps) | "row labels wrap" | Not seen on screen (Amplitude not opened) | FIXED |
| 7 | Envelope / Speech: WHAT'S LEFT says "not done" after every page was opened (section 7) | kit/PagedLab.tsx:570-575 `beforeAdvance` marks a page only when NEXT / FINISH leaves it; header line 13 "A CONTENTS jump never marks anything" | No logic change. The rule is now said on the end screen: "A page counts once you press NEXT (or FINISH) at its foot. Jumping to it from CONTENTS does not count it." | "row 5" | Yes: NEXT on Envelope page 1 gave ✓ 1 DONE, and the rule shows above the list | NOT A BUG (by design) — now explained to the learner |
| 5b | Game Audio (F3 via the coordinator): "PagedLab.tsx:~545 still gives every hands-on row the same detail; one sentence on 19 rows" | kit/PagedLab.tsx `endUnits` (now ~:553): rows are `{ id, label: p.title }` only; `handsOnDetail` reaches only `howItCounts` (~:565); `pageDetailOf` adds the lab's own `pageDetail`. F3 saw the code from before item 5. | Already covered by item 5. Added: PagedLab prop docs for `handsOnDetail` / `pageDetail` and a stale comment brought up to date | new test "Game Audio (F3…): HANDS_ON reaches only howItCounts; pages 20–22 keep their own pageDetail" | **Yes**, #labpreview/GameAudioLab → CONTENTS → WHAT'S LEFT. The HANDS_ON sentence is printed 1 time, under HOW A PAGE COUNTS. Pages 20 and 22 keep their own lines, 1 each. Rows 01–19 have no line. | FIXED (by item 5; verified) |
| 9 | Gate Q3 (chatter): its explanation stated Q4's right answer word for word ("HOLD keeps the gate open for a minimum time") — F7 via the coordinator | understandingChecks.ts GATE `chatter` explanation vs `hold-meaning` correct | understandingChecks.ts: F7's text ("…more time before it may close, or a gentler close…") | "Gate Q3's explanation no longer states Q4's answer" | Not seen on screen (pane contention; text-only change) | FIXED |
| 10 | Limiter Q2 (gr-math): a wrong pick printed "holds them down by 5 dB" — F7 | understandingChecks.ts LIMITER `gr-math`. The explanation is right; the giveaway was the card printing it on a first miss, which item 1 already fixed. | The explanation stays (it confirms the sum after a right answer). F7's sentence, without the number, is now the question's `hint`, so the first miss reads "Count how far the peaks sit ABOVE the ceiling…". F7's second sentence was dropped: the ratchet caught it at 31 words. | "Limiter Q2: a first miss gets a hint without the number" | Not seen on screen | FIXED |
| 11 | Chorus Q2 (full-wet): prompt said "At 100% WET", but the lab's control is MIX (30% / 50% / 100% = VIBRATO) — F7 | understandingChecks.ts CHORUS `full-wet`; fxLabConfigs.tsx chorus `label: 'MIX'` | Prompt now "At MIX 100% (100% wet) the chorus stops sounding like a chorus. What do you hear instead?" | "Chorus: the prompt names the lab's MIX control" | Not seen on screen | FIXED |
| 8 | Quick win 4: FINISH · SEE WHAT'S LEFT after "Check passed." in the effect labs and the G7 rack labs | LabShell.tsx:694 draws `{checkEnd ?? null}`; only Binaural, FM, Stereo (FxLabScreen.tsx:695-699) and Modular pass one. PagedLab labs already end the check page with FINISH (PagedLab.tsx:647). | SHARED NEED 1 (LabShell / FxLabScreen are not mine) | — | Gate CHECK: no FINISH (confirmed); Stereo: FINISH opens the end layer (seen) | SHARED NEED |

## SHARED NEEDS

**1. LabShell: a what's-left link under every CHECK (quick win 4).** File `src/screens/lab/LabShell.tsx`, line 694.
- Change `{checkEnd ?? null}` to `{checkEnd ?? <LabCheckEnd labId={labId} labTitle={checkTitle ?? title} />}`.
- Add `import { LabCheckEnd } from './kit/LabCheckEnd';`.
- LabCheckEnd lives in its own file on purpose, so LabShell gains no "‹ BACK" wording (test/labNavLaw stays green).
- Effect: Gate, Limiter, Delay, Reverb, Chorus, Flanger, Phaser, Distortion, Phase, Compression, Equalizer, Oscillators, Noise, Harmonics, Autotune, Harmonograph and Bass get FINISH · SEE WHAT'S LEFT, plus their recap and next-lab card once labEndContent has an entry (Gate's is already there).
- Recommended alongside it, in `src/screens/lab/FxLabScreen.tsx` lines 695-699: `checkEnd={<LabCheckEnd labId={config.labId} labTitle={config.title} onOpen={stop} endGuide={config.labId === 'stereo' ? STEREO_END_GUIDE : undefined} />}`, so opening the end layer stops the effect's sound. The G7 rack labs can do the same with their own `stop`.

**2. CHECK screen guides that now say something false (owner of each guide file).** After a first miss the card shows a reason or a nudge, not the explanation. These lines are now FALSE:
- `src/screens/lab/autotuneScreenGuides.ts:111` ("with the same explanation")
- `src/screens/lab/binauralScreenGuides.ts:115` and `src/screens/lab/stereoScreenGuides.ts:124` ("heads the explanation")
- `src/screens/lab/cymatics/cymaticsScreenGuides.ts:552` and `:559` ("read the explanation", "with the same explanation")
- `src/screens/lab/distortionScreenGuides.ts:151` and `src/screens/lab/phaseScreenGuides.ts:140` ("the same explanation as a nudge")
- `src/screens/lab/fmScreenGuides.ts:125`, `src/screens/lab/envelope/envelopeScreenGuides.ts:284`, `src/screens/lab/speech/speechScreenGuides.ts:407` and `src/screens/lab/modular/modularScreenGuides.ts:128` ("Every answer opens its explanation")
- `src/screens/lab/harmonographScreenGuides.ts:112` ("with the explanation")
- `src/screens/lab/soundsystems/soundsystemsScreenGuides.ts:696` and `:703` ("read the explanation", "with an explanation")

Proposed replacement (uses only words the card shows, so the name-pin tests stay green): "Tap an answer. Right: it turns green and CORRECT explains why. Wrong: NOT QUITE — TRY ANOTHER says what to look at again; a second wrong pick also shows the explanation. Nothing is lost and there is no score."

These lines only become true once every wrong option has its own `why` in phase 2 ("shows why", "with the reason", "explains"). Until then, use the same replacement:
- bass:155, compression:134, chorus:119, delay:135, deesser/smartProcessors:46, gate:135, limiter:121, flanger:124, eq/equalizer:117, harmonic:156, noise:117, oscillator:118, micselect:399, phaser:122, reverb:145.

If a guide test pins the old wording, it moves with the guide.

**3. End-screen guide intros with a fixed WHERE TO START (phase 2, each lab's `endGuide.intro.start`).** Make them state-neutral, for example "Read WHERE TO START at the top: it names the next thing to do from where you are."
- The intro card's "seen" id hashes its text (screenGuide/types.ts:43), so a state-varying intro would pop up again; that is why the state-aware line lives on the screen itself.
- Known false cases: Sound Systems TROUBLESHOOT end ("Tap the first page still listed" with none listed, G5c) and EQ Lab end ("open the first module… work down" when only the check is left, G6).

**4. Amplitude (lab agent, `src/screens/lab/amplitude/AmplitudeOrientation.tsx:1080-1086`).** `stepLabel` is fixed text: "Pass CHECK YOURSELF — THREE QUICK READS, then press UNDERSTOOD — MARK REVIEWED". When the ramp check is already passed, pass instead "Press UNDERSTOOD — MARK REVIEWED (your check is passed)" (G1 suggestion 1). The cut-off half of this item is fixed in item 6.

## Test and type-check results

- `node --test test/labFixes_20261114_S2.test.ts`: 35/35 pass.
- After item 5b, these files together pass 160 of 160: labFixes_20261114_S2, labEndKit_d41k, djRedoFresh, screenGuide_gameaudio, screenGuide_djsystems, mixingHandsOnCredit.
- SHARED_API.md section S2 now gives two more things for F3:
  - the exact `pageDetail` call a lab uses to give each row its own "what is missing" line;
  - the answer on GA_END_GUIDE.teaches: put the recap in labEndContent.ts under `'game-audio'` and copy only the guide lines that are recap.
- After items 9–11, these files together pass 109 of 109: labFixes_20261114_S2, understandingChecks_20261013, screenGuide_gate, screenGuide_limiter, screenGuide_chorus.
- No further tsc run, at the coordinator's request (the machine is out of memory).
- The existing tests that read my files (118 files, 3511 tests): 3509 pass and 2 fail.
  - Both failures are in `labHubUnreadable_20261003` and read `src/screens/lab/cymatics/CymaticsHomeScreen.tsx` / `CymaticsModuleScreen.tsx`, which another agent is editing. I do not touch them.
  - An earlier run also showed failures from other agents' work in progress (Mastering "‹ BACK", DockTray, Game Audio, Tuning guides, ScreenGuide backRef); none read a line I changed.
- Pinned tests I changed on purpose, each with the owner's approval quoted:
  - `test/mixingHandsOnCredit_20261014.test.ts`
  - `test/screenGuide_cymatics_20261031.test.ts`
  - `test/screenGuide_harmonograph_20261031.test.ts` (the "wrong pick shows the same explanation" pin)
- `npx tsc --noEmit`:
  - First full run, after the main changes: 0 errors.
  - Final run: 0 errors in my files. It stopped at parse errors in `src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx:665-764`, another agent's file in mid-edit, so the coordinator's gate should re-run it. One run before that ran out of memory.

## Not checked, and why

- The final per-row version of item 5, and item 6 (Amplitude), were not seen on screen. The 8142 preview stopped answering mid-session, and my pane tabs were closed under me (12 agents, 9 tabs). The coordinator's checker round should look at Beginning Mixing → CONTENTS → WHAT'S LEFT, and at Amplitude → FINISH.
- Gate's end screen cannot be seen until SHARED NEED 1 lands.
- Phone (native) look not checked: the changes are plain RN views and text, identical on iOS and Android.
- Pane note: one `preview_start` reused a tab named "seed" (it navigated it to #mixinglabpreview) before I switched to my own tabs. If "seed" was another agent's tab, it was moved once.

## Phase 2 (coordinator, 2026-11-14: owner approved row 4 "per-option reasons"; S2 is the only writer of understandingChecks.ts)

| # | Item | Fix | Test | Status |
|---|---|---|---|---|
| P2-1 | Every question in `src/features/lab/understandingChecks.ts` gives every wrong option its own reason | 117 questions, 28 labs, every wrong option. 336 new reason lines, plus Envelope's 12 from phase 1. Gate's reasons were re-keyed to its rebalanced options. Each line was checked against the lab's own config, screen and LEARN text for real control names (MIX, AMOUNT, SPEED FAST — SNAP, INDEX, LEVEL, GRID V / FLOW, SUPPLY / DC RAILS…) | labFixes_20261114_S2 "phase 2: EVERY question…" plus the existing ratchet (key is an option, never the answer, ≤ 30 words, never quotes the answer) | FIXED |
| P2-2 | Balanced option lengths (the right answer was over 1.4× the next option in 72 of 117 questions) | Mostly by lengthening the wrong options with plausible, clearly wrong detail. 11 right answers shortened with the same meaning: gate hold-meaning; eq q-width, graphic-vs-parametric; compression below-threshold, makeup; delay feedback, damping; distortion parallel; stereo width-is-side; harmonic phase-deafness; modular sine-filter. Every `correct` was updated with its option | "phase 2: the right answer is never obviously the longest…" and "every right answer is still one of its options" | FIXED |
| P2-3 | Prompts that named a control wrongly | harmonic `amplitude`: the lab has no AMPLITUDE key, so the prompt now says "the overall level". fm `index` now names INDEX. autotune `fast-retune` / `slow-short-notes` now name SPEED at FAST — SNAP / SLOW — GLIDE. autotune `amount-math` now says AMOUNT. cymatics `level-not-pattern` now says LEVEL (DRIVE is the exciter tray) | screenGuide_autotune pin updated (owner quote) | FIXED |
| P2-4 | S3's shared need: `accuracyVariant` on PagedLab | kit/PagedLab.tsx: `accuracyVariant?: 'tool' \| 'about'`, passed as `variant` to both AccuracyNote calls (default unchanged) | screenGuide_mixing-beg, _smartprocessors, _cable pins updated (owner quote) | FIXED. F4 can now set `accuracyVariant="about"` on Beginning Mixing |

Method: four forks drafted the lines in parallel into scratchpad JSON, each lab group validated by script. I merged them with one script and re-ran every check over the whole file. Facts the drafters were unsure of, and the answer they checked against:
- delay damping: the trail ends a little sooner. Filtering in the loop removes energy.
- phase: INVERTED Ø with DLY R 2 ms moves the comb notches rather than removing them.
- bass: the major third sits near fret 4 (string length 0.794).
- fm: sine-on-sine FM spreads the energy rather than adding it.
- amp: crossover distortion is worst at low level; a higher-impedance load is easier.

None contradicts the labs' own teaching text.

**Labs whose CHECK guide line may now switch to the shared sentence** (every wrong option has a reason): amp, autotune, bass, binaural, chorus, compression, cymatics, delay, distortion, envelope, eq (EQ Lab and Equalizer share this check), flanger, fm, gate, harmonic, harmonograph, limiter, micselect, modular, noise, oscillator, phase, phaser, reverb, smart-processors (De-Esser), speech, stereo, tube.

**Not complete:** Sound Systems. Its check lives in `src/features/soundsystems/check.ts`, which is not in this file. Its guide lines (soundsystemsScreenGuides.ts:696, :703) must not switch yet.

Tests: labFixes_20261114_S2 plus every test file that reads understandingChecks.ts or PagedLab.tsx: 2012 run, 2004 pass, 8 fail. 7 are in files other agents are editing, as of this run:
- labHubUnreadable: Cymatics hub and module screens.
- screenGuide_mixing-beg / -adv: F4's new `pageDetail` and end-guide wording.
- screenGuide_speech: the speech agent's new `pageDetail`.

The 8th (screenGuide_cable, my accuracyVariant pin) is fixed. The re-run of my changed files passes 191 of 191. No tsc, as asked.

## CONTENTS pull-down → centered popup (F6 via the coordinator; owner standing rule "popups, never pulldowns")

| # | Item | Verified in code | Fix | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| N-1 | Every paged lab opened CONTENTS as an in-tree pull-down under the strip | kit/LabNavBar.tsx:223 (before): `{contentsOpen ? <LabContents …/> : null}` inside the strip's View; style comment "in-tree (no Modal), under the strip" | kit/LabNavBar.tsx: LabContents now draws in a DimModal (`transparent`, fade, Low-Light wash) as a centered card at the popup width (`popupCard`). It has a CONTENTS heading and ✕; a tap outside closes it; `onRequestClose` closes it on Android BACK, and the focus-aware BackHandler (:153-167) is kept. Rows still call `nav.jump(i)` and WHAT'S LEFT still calls `nav.openEnd`. START OVER (PRACTICE) runs its confirm through `useModalHandoff` (house helper) once the popup has closed. The list scrolls inside the card. | labFixes_20261114_S2 "CONTENTS is a centered popup" (4 tests). The 41 test files that read LabNavBar: 1471 of 1479 pass; the 8 failures are other agents' in-progress files (amp, mastering, mixing, cable's `pageDetail`) | Yes, Envelope Lab at 390. The centered CONTENTS card shows ✕, rows 01–07 + CHECK, WHAT'S LEFT › and START OVER (PRACTICE). Row 03 jumped to module 3 and closed the popup. ✕ closed it; a tap outside closed it; WHAT'S LEFT opened the end screen. START OVER was not pressed: on web PagedLab uses the browser's blocking `confirm()` | FIXED |

Not seen: START OVER through the popup on a phone (the confirm hand-off). Android hardware BACK, which needs a phone.

## NEEDS SOUND on guided steps that only the ear can do (coordinator, F7's list; report section 3 row 3)

| # | Item | Verified in content | Fix | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| NS-1 | Guided steps (LEARN tab + GuidedLessonSheet) whose NOTICE can only be heard had no marker | I read all 169 steps' DO / NOTICE lines in src/features/lab/guidedLessons/content.ts. The 11 marked steps rest on something heard: eq 2 ("you hear a thin ring"), eq 3 ("you hear the boost travel"), eq 4 ("louder… can fool you"), delay 6 ("repeats turn slightly duller"), chorus 3 ("the drawing is held back… but the sound is not"), chorus 4 ("a wobble you can clearly hear"), gate 6 ("Listen for the noise fluttering"), distortion 4 ("you hear off-key tones… The display doesn't change"), binaural 1 ("The noise sits to your left"), binaural 5 ("much easier to place"), fm 5 ("starts bright and dulls… while the graph keeps the strike's bright start"). Not marked, because the NOTICE shows on screen: e.g. phase 2–4 (the trace and CORRELATION show it), flanger 6, noise 2, modular 5, harmonograph 3 (Hz readouts) | types.ts: `GuidedStep.needsSound?: true`. content.ts: the 11 steps marked. GuidedLessonSheet.tsx: StepsBlock draws S3's `<NeedsSoundTag />` after the step's DO text, in the sheet and in the inline LEARN body. A marker, never a lock | labFixes_20261114_S2 "guided steps: a NEEDS SOUND tag…" (exact set + rendering). With all 39 test files that read the guided lessons: 1183 of 1184 pass; the 1 failure is soundsystems/faults.ts (another agent) | Yes: Gate LEARN at 390, step 6 reads "…move THRESH slowly toward the noise's level. NEEDS SOUND"; steps 1–5 carry no tag | FIXED |

F7 listed Equalizer steps 2–4 and Chorus step 3. All four are confirmed. Chorus 4 was added, since its NOTICE is purely aural.

## Mic Selection end check aligned with the lab's own cards (F9's shared need 1, via the coordinator)

| # | Item | Verified | Fix (understandingChecks.ts, `MIC_SELECT`) | Test | Status |
|---|---|---|---|---|---|
| MS-1 | Lectern question: the end check said "presence boost around 4 kHz". F9's Lesson 4 card says "presence peak around 5 kHz". The lab's own curve is "B · Presence rise (3–6 kHz)" (micSelectData.ts:453) | MicSelectLabScreen.tsx:429-441 (F9's card) | The option now reads "One with a presence rise around 3–6 kHz", the lab's own band; 5 kHz sits inside it, so nothing contradicts. Reasons now use F9's wording: presence ("…Look at where the rumble sits on the axis: far below it.") and flat ("…Flat is a choice, not a fix."). Explanation unchanged; it already agrees | "Mic Selection end check matches…" | FIXED |
| MS-2 | Label-vs-specs question: the right answer was the longest and carried its own reason ("— maximum SPL, pattern and response —"), unlike F9's rebalanced Lesson 9 card | MicSelectLabScreen.tsx:634-646 | Right answer now "Yes, if its specs suit the job". The specs moved into the explanation, as in the card's reveal: "The spec sheet decides: maximum SPL, pattern and response." The "vocal only" reason is F9's: "Plenty of mics sold for vocals sit on loud cabs every day. What on the spec sheet decides it?" | same, plus the length and answer-integrity ratchets | FIXED |

Tests: labFixes_20261114_S2, understandingChecks_20261013, screenGuide_micselect and labFixes_20261114_F9 together pass 201 of 201, before the 2 new Mic Selection tests. The 2 new tests pass in my test file. No tsc.

## Shared lab header: titles cut mid-word at 320 (checker C4, F8's measured change, via the coordinator)

| # | Item | Verified | Fix (kit/LabNavBar.tsx) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| HD-1 | At 320 wide a long title word broke inside the word (Cymatics "MEMBR / ANE & …"; also HARMONOGRAPH) | LabNavBar.tsx styles (before): `header` with no wrap and `titleBlock: { flexShrink: 1, flexGrow: 1 }`, so the right-hand keys kept their width and squeezed the title | Applied F8's change (`header` flexWrap 'wrap'; `titleBlock` flexBasis 0; `headerRight` marginLeft 'auto'), with one correction. F8's fixed `minWidth: 110` was not enough: measured at 320, HARMONOGRAPH (126 px in Oswald SemiBold 16 / 1.2 tracking) still broke as "HARMONOGRAP / H", because 123 px was left for the title and the keys stayed on row 1. The floor is now per title: `titleMinWidth(title)` = longest word × 10.7 px, clamped 80–128. A short title (GATE LAB) keeps one row even at 320; a long word sends the keys to a second, right-aligned row. Words measured: HARMONOGRAPH 126, UNDERSTANDING 123, DIRECTIONALITY 121, FUNDAMENTALS 114, LOUDSPEAKER 105, OSCILLATOR 90 | labFixes_20261114_S2 "shared lab header…" (2 tests). The 41 files that read LabNavBar: 1592 of 1592 pass | Yes, measured in the 8142 preview (element boxes and the title word's line boxes), each at 320 and 390: **Membrane** 390 one row (title 131 wide, keys at x 175), 320 keys on row 2 and the title on one line. **Harmonograph** 390 one row (title 193), 320 keys on row 2 and HARMONOGRAPH on one line (126). **Gate** 390 one row; 320 one row (title 123 ≥ floor 80). **Oscillator** 390 one row; 320 one row, OSCILLATOR whole (90 ≤ 123). Nothing overlaps; at 390 every box sits where it did before | FIXED |

Not checked: a phone (the rule uses the bundled Oswald font, the same on iOS and Android); labs whose titles were not opened.
