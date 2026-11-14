# F8 report · lab fix round 1, phase 1 (2026-11-14)

Group F8: Oscillators, Noise, Harmonics, FM, Modular, Envelope, Autotune, Tuning, Drum Tuning, Cymatics, Harmonograph, Speech, Ear Training, Bass.

**Summary:** 25 items. 18 FIXED (one in part), 4 NOT A BUG, 1 OUT (owner), 2 SHARED (1 SHARED NEED to forward, 1 already S2's). No commits, no eas.

- Tests: `test/labFixes_20261114_F8.test.ts`, 25 tests, all pass. Each one fails on the code as it was before.
- Existing tests for the files I touched: 30 files, 865 tests, all pass.
  - 7 pinned expectations changed on purpose. Each was updated with the owner's words above it: `drumTuningLab.test.ts:450`, `drumTuningToddlerPass2.test.ts:210`, `screenGuide_harmonic_20261031.test.ts:188`, `screenGuide_tuning_20261031.test.ts:59`, `screenGuide_envelope_20261031.test.ts:455`, `screenGuide_speech_20261031.test.ts:527`, `screenGuide_eartraining_20261031.test.ts:469,514`.
- `npx tsc --noEmit`: 0 errors in my files. The run showed 3 errors, all in another group's `src/screens/lab/stageplot/GuidedTask.tsx` (missing `SP_GUIDED_TITLE` / `spGuidedOpenByDefault` exports). One edit came after that run: HarmonicsView SLOPE uses `sub` and `vA11y`, both optional strings on `BezelItem`, and `exactOptionalPropertyTypes` is off.

## Items

| # | Item (lab, what) | Verified in code (file:line) | Fix (files changed) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| 1 | Bass · drag bubble "FRET FRET 3 of 12" | `BassLabScreen.tsx:495`: the fader `format` returned "FRET 3 of 12". `rack/RackUnit.tsx:691` prints `{label}  {format}` in the drag tag, so the word doubled | `BassLabScreen.tsx`: the value is now "3 of 12"; the frame prints the label FRET. "of 12" kept, because the N-of-total sweep is OUT (owner) | F8 | yes: the lane reads "FRET … 12 of 12", word once | FIXED |
| 2 | Harmonics · display labels sit on empty rows after a preset change | `HarmonicsView.tsx:714-732` labelled markers 1..12 greedily, low n first, whether or not each harmonic sounds | `harmonicModel.ts`: new `pickMarkerLabels(markers, gap, lit)`. `HarmonicsView.tsx` passes the lit set in MODEL view; live view unchanged. The marker lines still show every harmonic | F8 | yes: after PRESET → SQUARE the labels are 1, 3, 5, 7 and 9, beside the lit bands | FIXED |
| 3 | Harmonics · SLOPE "−6.0" with no unit | `HarmonicsView.tsx:1674` | SLOPE now shows "−6.0" over a "dB/OCT" unit line (`sub`, read aloud "dB per octave"). First try "−6.0 dB/OCT" in `v` made the bezel drop the SLOPE key at 390 (D36), so the unit moved to `sub` | F8, harmonic pin | yes: key SLOPE kept, value −6.0, unit dB/OCT | FIXED |
| 4 | Drum Tuning ch 2 step 5 · REVEAL KEY works after 1 of 13 spots | `modules/ch2Prepare.tsx:245-254`: reveal() had no walk check | reveal() now waits until every spot has been looked at, and says why ("Walk the whole drum first: 12 spots have not been looked at yet…", `drumContent.ts` `revealWaitLine`). The guide's control line says so | F8 | not seen (see below) | FIXED |
| 5 | Drum Tuning ch 2 step 5 · "2 of 4 right" counts un-ticked lines as right | `ch2Prepare.tsx:243`: score = lines where flag == present | `drumContent.ts` `prepResult` / `prepResultLine`: "You found 1 fault and missed 1 — no credit yet." KEY bezel reads ALL FOUND / n MISSED / n EXTRA; YOUR RUN uses the same words. Credit rule unchanged (every fault found, nothing extra) | F8 | not seen | FIXED |
| 6 | Drum Tuning ch 5 step 4 · intro says GOAL BEND, page opens on GOAL SHORT | `ch5Types.tsx:54` `useState<GoalId>('short')`; `drumScreenGuides.ts:735` | the intro start now begins with the goal on screen (SHORT: raise DAMPING, ✓ CHECK; works without sound), then BEND | F8 | not seen | FIXED |
| 7 | Drum Tuning ch 3 step 2 · cannot be finished without sound | `ch3Method.tsx:94-104`: a lug counts only when its tap sounded, and REVEAL MAP needs all 8 | after a tap that did not sound, or a refused REVEAL MAP, "◉ CAN'T LISTEN NOW · SHOW THE MAP" shows the map with a plain note. YOUR RUN says the map was looked at without listening. No credit involved (this step has none) | F8 | not seen | FIXED |
| 8 | Drum Tuning ch 7 step 2 · the diagnosis cannot start without sound | `ch7Trouble.tsx:103-105`: investigated = struck && tappedEnough, and a strike counts only when it plays | after a strike that did not sound, "◉ CAN'T LISTEN NOW · USE THE READOUTS" opens WHERE? and FIX on that case (`Sim.silent`). A case worked silently NEVER counts toward credit (the chapter's rule is LISTEN → WHERE → FIX), and the screen says so | F8; 2 pins | not seen | FIXED |
| 9 | Drum Tuning ch 7 review · "first hypothesis right on 0 of 0 named" | `ch7Trouble.tsx:372` | with no cause named: "you have not named a cause yet." | F8 | not seen | FIXED |
| 10 | Envelope, Speech · WHAT'S LEFT says "not done" after every page; Speech ✓ lost after a reload | `kit/PagedLab.tsx:570-575`: NEXT marks the page, and pages also mark themselves on use. My on-screen check: I walked Envelope 1-6 with NEXT and the contents showed ✓ on 01-05 in-session. `ape:envelope:v1` was saved, then erased by something else within 8 s (I polled localStorage). An earlier read held no lab keys at all, only the GUEST_KEEP keys. The preview's one origin is shared by every agent's tab, and the guest wipe runs there | none | — | yes | NOT A BUG (preview only: the shared storage is wiped across tabs) |
| 11 | Tuning · "14 chapters not done yet" after all were worked | `TuningLabScreen.tsx:210-220` and the chapters: each chapter marks itself on its OWN task. Chapters 0 (Welcome), 7 (Just) and 11 (Systems) complete on a plain button (BEGIN LAB ›, I'VE GOT IT ›, I'VE COMPARED THEM ›) that needs no task first. The shell's NEXT did not mark them, so a learner who pressed NEXT was told they were not done. The rest of the auditor's count is the preview wipe from item 10 | `labCtx.ts` `ChapterDef.ackDone`; `chapters/index.ts` flags chapters 0, 7 and 11; `TuningLabScreen.tsx` `beforeAdvance` marks an ackDone chapter on NEXT or FINISH. Task chapters unchanged. Each row's "to finish" line is S2's phase-2 `detail` | F8; tuning pin | not seen | FIXED (part: the per-row reasons are phase 2) |
| 12 | Cymatics · HOME does not open in the preview | `src/dev/webPreviews.tsx` had no `CymaticsLab` entry | route added (`CymaticsLab: CymaticsHomeScreen`) | F8 | yes: `#labpreview/CymaticsLab` opens the home | FIXED |
| 13 | Cymatics · the lab's check is reachable only from the studios | The HOME does draw it (`CymaticsHomeScreen.tsx:208`, `LabUnderstandingBlock`); the audit could not open the home. The real gap: the module path's FINISH end screen (`CymaticsModuleScreen.tsx:122-135`) and the home's WHAT'S LEFT listed only the 8 modules, never the check, which is the lab's credit (`trainingLabKeys.ts:101`, completion 'understanding') | new `cymatics/useCymaticsEnd.tsx`: both end screens add the check row and draw the check (`shownHereId` + `extra`, the Tube / Amp / Mic Selection pattern). End-guide copy updated | F8 | yes: WHAT'S LEFT lists "CHECK · Check your understanding" and draws the 5 questions | FIXED |
| 14 | Cymatics · Membrane title clipped at 390 | `MembraneStudioScreen.tsx:490`; `kit/LabNavBar.tsx:128` allows 2 title lines. Measured on screen: 148 px beside the header keys, and the title needed 3 lines | title is now "MEMBRANE & LOUDSPEAKER" (2 lines). The home button keeps the full studio name | F8 | yes: 2 lines, height 48 = scrollHeight, nothing cut | FIXED |
| 15 | Cymatics Gallery · the empty gallery's intro says "Tap a card…" | `cymaticsScreenGuides.ts:591` | the start line now begins "No cards yet? Open a studio from NOTHING SAVED YET…" | F8 | not seen | FIXED |
| 16 | Rack labs (Oscillators, Noise, Harmonics, Autotune, Harmonograph, Bass) · no end page after CHECK | the check is the SHARED LabShell check; only labs that pass `checkEnd` get FINISH (FM and Modular do) | none here: S2 makes it the LabShell default (SHARED_API §2, S2's SHARED NEED). In phase 2 I check that all six get it | — | — | SHARED (S2) |
| 17 | Wrong-answer text that is plainly wrong (names another control or a false number) | I read every set in `features/lab/understandingChecks.ts` for my labs (OSCILLATOR, NOISE, HARMONIC, ENVELOPE, AUTOTUNE, CYMATICS, HARMONOGRAPH, BASS, MODULAR, FM, SPEECH) and the Tuning `wrong` lines in ch 7 and ch 11. I re-worked the numbers: 40/27 = 21.51 ¢ narrow; D→B = 5/3; the ET third is 13.69 ¢ from 5/4 | none: every explanation is true. Their fault is giving the answer away, which S2's per-option `why` fixes in phase 2 | — | — | NOT A BUG (per-option reasons are phase 2) |
| 18 | Developer text in Oscillators and FM | `OscillatorLabScreen.tsx:375-377, 387-391`; `FmLabScreen.tsx:394-396`: the dev-build wording is behind `__DEV__`; store builds print a plain sentence | none | — | — | NOT A BUG (`__DEV__` only) |
| 19 | "update the app to hear / see it" lines in my labs (Cymatics studios and modules, Harmonics, Harmonograph, Bass, Modular, Autotune) | each sits behind a missing native capability (`skiaAvailable`, `engineReady`, `additiveReady`). Every learner build carries Skia (`package.json:19`) and the v7 engine, so these lines show only in the web preview or an old dev client | none | — | — | NOT A BUG (cannot appear on a learner build) |
| 20 | Silent first step in WHERE TO START: Oscillators, Noise, Harmonics, Modular, Bass, Tuning chapter 1 | each EXPLORE `intro.start` in `*ScreenGuides.ts` began with ▶ or HEAR IT | each now starts with a step a sound-off learner can do and see, then the sound step. The silent steps: WAVE → SQUARE empties the even bars; COLOR tilts the line; PRESET → SQUARE takes THD from 75.2 to 43.8 %; FRET 12 gives LENGTH 50 %; PATCH → WOBBLE draws the blue cable; ROOT and OCTAVE can be read | F8 (first sentence has no ▶ or "hear"; at most 40 words) | Harmonics: yes (the intro card shows the new line, and the numbers match the screen). Others not seen | FIXED |
| 21 | Ear Training · "100% · last 20" after ONE answer | `EarModuleScreen.tsx:598` always printed "last 20"; `earProgress.ts:261` averages up to the last 20 answers | `earLabEnd.ts` `earScoreWindowLabel`: "1 answer" / "n answers" until there are 20, then "last 20"; the spoken label follows | F8; eartraining pins | not seen | FIXED |
| 22 | Ear Training · answers accepted without playing | — | — | — | — | OUT (owner) |
| 23 | Speech page 2 · intro says "four jobs"; the page says "Five stages" | `speechPagesA.tsx:149`; `speechScreenGuides.ts:82` | the intro's learning line now names the five stages | F8 | not seen | FIXED |
| 24 | Envelope page 6, Speech page 9 · GOT IT › vanishes with no word | `EnvelopeLabScreen.tsx:420`; `speechPagesB.tsx:367` | after the tap the page reads "✓ THIS PAGE IS DONE · NEXT MOVES ON" | F8; 2 pins | not seen | FIXED |
| 25 | Noise · term card says noise is "everything you didn't want" (quick win 9) | `src/features/intro/labTermIntroData.ts:330-337` (not my file; glossary text verbatim) | — | — | — | SHARED NEED (below) |

## SHARED NEEDS

1. **Noise term card (quick win 9).**
   - File: `src/features/intro/labTermIntroData.ts`, lines 330-337 (`NoiseLab`).
   - Problem: the wired row "Noise" (glossaryId dec16fab-229e-46fe-8715-51fc8af9b21a) defines noise as unwanted signal, the opposite of what the lab teaches.
   - Proposed change: wire the lab to a glossary row that names noise as a sound with no pitch, used on purpose (candidates: "Pink Noise", "White Noise"). Copy it VERBATIM with its glossaryId, per the file's own rule.
   - The text must come from a read-only query of the live glossary; I did not run it. For example: `select id, term, plain_english from glossary where term ilike any (array['pink noise','white noise','%noise color%']) and topic_id is not null;`
   - If no row fits, the glossary row itself needs a server edit (owner or Comp A).
2. **LabShell FINISH after CHECK** for Oscillators, Noise, Harmonics, Autotune, Harmonograph and Bass: this is S2's default and S2 has already filed it. Nothing more is needed from me.

## Not checked on screen, and why

- **Not seen: Drum Tuning items 4-9, Tuning item 11, Gallery 15, the silent-start lines other than Harmonics (20), Ear Training 21, Speech 23, and the GOT IT lines (24).**
  - Each is covered by the F8 test against the code.
  - Why: the shared preview was overloaded. A page load timed out after 300 s; tabs were closed by the pane; the bundle reloaded mid-walk because of other agents' edits. My Drum Tuning walk to chapter 2 step 5 was sent back to chapter 1 by a reload, after about 36 intro popups.
  - The coordinator's checker round can look at them before commit.
- **Seen on screen:** Bass FRET lane; Harmonics labels after SQUARE and the SLOPE key and unit; Cymatics home route; Cymatics WHAT'S LEFT with the check; the Membrane title at 390; the Envelope in-session ✓ and the storage wipe.
- **Not run:** the whole suite (the coordinator runs it).

---

# Phase 2 (shared mechanisms filled in)

**Summary:** 8 mechanisms filled in across the 14 labs. Tests: `labFixes_20261114_F8.test.ts` now has 64 tests (phase 1 + phase 2), all pass. The existing tests for the touched files pass (last runs: 860 + 522 tests, 0 fail). Phase-2 SHARED NEEDS: none (the Noise term card is S1's, per the coordinator; per-option reasons in understandingChecks.ts are S2's). Preview bundle builds (HTTP 200 after the last edit). No `npx tsc` (coordinator's rule); every edited file parse-checked.

## Per lab

| Lab | Silent line | NEEDS SOUND tags | Captions | Own checks: reason first | FINISH / end rows | End-guide start | CHECK guide lines | Seen on screen |
|---|---|---|---|---|---|---|---|---|
| Oscillators | yes | — (every step works silently) | F0, VIEW | shared check (S2) | own `checkEnd`, `onOpen={stopTone}` | (LabCheckEnd, no guide) | yes | yes: sound-off line, both captions, new WHERE TO START, FINISH · SEE WHAT'S LEFT under CHECK |
| Noise | yes | — | SLOPE, OUT | shared (S2) | `checkEnd`, `stopNoise` | — | yes | not seen |
| Harmonics | yes | — | F0, THD, CREST (SLOPE has its unit line) | shared (S2) | `checkEnd`, `stopAllSound` | — | yes | not seen (phase 1: labels and SLOPE seen) |
| FM | yes | — | FC, FM, I, BW | shared (S2) | already had one | yes | yes | not seen |
| Modular | yes | — | VCO, RES, LFO, SEQ | shared (S2) | already had one | (no end guide) | yes | not seen |
| Autotune | yes | — | AMOUNT, SPEED, ENDS | shared (S2) | `checkEnd`, `stop` | — | yes | not seen |
| Harmonograph | yes | — | RATIO | shared (S2) | `checkEnd`, `stopInterval` | — | yes | not seen |
| Bass | yes | — | none needed (NOTE / FREQ / INTERVAL / LENGTH are plain) | shared (S2) | `checkEnd`, `stopNote` | — | yes | phase 1 only |
| Envelope | n/a (no rack) | — | — | page 7: 18 reasons | `pageDetail` (check page) | yes | yes (shared check and page 7) | not seen |
| Speech | n/a (no sound) | — | — | 9 checks, 27 reasons (`speechCheckWhy.ts`) | `pageDetail` (check page) | yes | yes | not seen |
| Tuning | — | — (HEAR IT steps all show the numbers) | every readout in all 14 chapters (see "Phase 2 finish") | every chapter check had reasons; now the explanation follows a 2nd different miss | `CHAPTER_FINISH` detail + `howItCounts` | yes | — | not seen |
| Drum Tuning | — | ch 4, ch 6, ch 7 credit lines | REL, RESPONDS | 12 cards, 24 reasons (`DRUM_SCENARIO_WHY`) | already named per row | yes | one practice line | not seen |
| Cymatics | — | — | every studio and module readout (see "Phase 2 finish") | shared (S2) | check row + check drawn, `howItCounts` | yes | yes | phase 1: check on WHAT'S LEFT seen |
| Ear Training | — | every drill question | — | answers-without-playing is OUT | already named per row | yes | — | not seen |

## Phase 2 finish: the two partial items (coordinator follow-up)

- **Tuning chapter readouts:** every bezel readout in all 14 chapters now has a plain-word first-visit caption (S3 `BezelItem.caption`, ≤ 14 characters). This includes the template-key cells (`NOTE …`, `PYTH …` / `JUST …`, and the four E cells in chapter 14). Examples:
  - CENTS "interval size", REGION "where it sits", PARTIALS Δ "overtone gap"
  - t = √5/2 "whole tone", g⁴/4 "third it makes"
  - WOLF "the bad fifth", VS EQUAL "off equal"
- **Cymatics remaining readouts:**
  - Other Systems: SYSTEM (the STRNG cell) "what vibrates", plus MODE, NODES and FAMILY.
  - Nodes: LINES and the multi-line RES cell.
  - Harmony in Motion: INTERVAL, BEAT, and tones A and B.
  - Harmonics vs Plate Modes: LADDER, RATIO and FAMILY.
  - Change One Thing: LOCKED, and plates A and B.
  - Membrane: fs, ka, STAGE, FUNDAMENTAL and RESPONSE. Plate: RESPONSE. Liquid: SHAKE.
  - DRIVE on every studio and module.
- **Left without a caption, on purpose (already plain words):**
  - chapter 14's DONE counter;
  - FREQ in Harmonics vs Plate Modes (a frequency in Hz, which the automatic "Hz? dB?" chip explains);
  - the Gallery art board's REGIONS / FILLED / UNDO / REDO.
  - Every readout is on the shared bezel, so none was technically unable to take a caption.
- **Test:** the F8 test "captions on every Tuning chapter readout and every Cymatics readout" walks every bezel line in those files. It fails on any readout without a caption (outside the named exceptions) or with a caption over 14 characters.
  - 65 F8 tests pass.
  - screenGuide_tuning, screenGuide_cymatics, tuningLabRack and the Cymatics model tests pass (230 + 359 tests).
- The preview bundle still builds (HTTP 200). Every file was parse-checked; no tsc was run. Not seen on screen (the preview is overloaded).

## Done so far

| Mechanism | Labs | Done? | file:line | Test |
|---|---|---|---|---|
| Silent-learner line (`soundOffLine`, own words) | Oscillators, Noise, Harmonics, FM, Modular, Autotune, Harmonograph, Bass: every EXPLORE step works and shows without sound | yes | the rack `stage` in each screen (HarmonicsView for Harmonics) | F8 phase 2 |
| NEEDS SOUND tag | Drum Tuning: the credit lines of ch 4 (strike all three), ch 6 (▶ BOTH), ch 7 (cases count only when listened to). Ear Training: every drill question | yes | ch4Whole / ch6Kit / ch7Trouble credit Point/Body; EarModuleScreen question line | F8 phase 2 |
| Bezel captions (first visit) | listed in the per-lab table; all ≤ 14 characters, 1-3 words | yes (Tuning not done) | bezel arrays | F8 phase 2 |
| Accuracy chip (D37) | every concept lab in the group already passes `accuracy={false}`; Harmonics keeps it (REAL SIGNAL listens through the mic) | nothing to change | — | — |
| Arrival holds (S1 §3) | no lab in the group draws its own popup over a card; nothing to declare | nothing to change | — | — |
| `BezelItem.silent` | no readout in the group is a live measurement while sound is off (all are drawn from the model); Harmonics' REAL SIGNAL needs the mic, not sound out | n/a | — | — |

No `npx tsc` (coordinator's rule). Every edited .ts/.tsx was parse-checked with the TypeScript parser on that file alone (`parse ok`).

## Done so far

| Mechanism | Labs | Done? | file:line | Test |
|---|---|---|---|---|
| FINISH · SEE WHAT'S LEFT under CHECK, own `checkEnd` with `onOpen` stopping the sound | Oscillators (`stopTone`), Noise (`stopNoise`), Harmonics (`stopAllSound`: the tone lives in HarmonicsView, which unwinds on the sound-stop signal), Autotune (`stop`), Harmonograph (`stopInterval`), Bass (`stopNote`). FM and Modular already had theirs | yes | each `*LabScreen.tsx`, the `<LabShell … checkEnd=…>` line | F8 phase 2 |
| CHECK guide lines that promised the explanation on a wrong tap → S2's sentence | Oscillators, Noise, Harmonics, Bass, Autotune, Harmonograph, FM, Modular, Envelope, Speech, Cymatics (21 lines) | yes | the `check` section of each guide | F8 phase 2; the guide tests (391 + 83) pass |
| End-screen guide `intro.start` state-neutral | Cymatics, Ear Training, Drum Tuning, FM, Envelope, Tuning, Speech | yes | each `*_END_GUIDE.intro.start` | F8 phase 2; guide tests (402) pass |
| Each unfinished row names what is missing | Tuning: `CHAPTER_FINISH` (one task line per chapter, only while not done) + `howItCounts` once (TuningLabScreen.tsx LabEndScreen). Envelope and Speech: `pageDetail` for the hands-on check page (reading pages get the shared NEXT rule). Cymatics: `howItCounts` once on both end screens. Drum Tuning and Ear Training already name the missing task per row | yes | tuning/chapters/index.ts `CHAPTER_FINISH`; EnvelopeLabScreen / SpeechLabScreen `pageDetail`; cymatics/useCymaticsEnd.tsx | F8 phase 2 |
| Lab-local checks: a reason per wrong option first, the explanation after a second DIFFERENT miss | The shared `UnderstandingCheck` (tuning/components/check.tsx + checkFeedback.ts): with a `wrong` map the second different miss now adds the explanation; the same wrong option twice counts once. Tuning: every chapter check already had a `wrong` map. Envelope page 7: 6 checks × 3 reasons added. Speech: new `speech/speechCheckWhy.ts`, 9 checks × 3 reasons, keyed by option text (the questions live in features/speech, not mine). Drum Tuning decision cards: `DRUM_SCENARIO_WHY`, 12 cards × 2 reasons, `drumWrongLine` | yes | listed | F8 phase 2; `tuningCheckRetry` pin updated |

**Cross-lab effect to note:** `tuning/components/check.tsx` (`UnderstandingCheck`) is also used by DJ Systems, Connector Selection, Cable Install, De-Esser and others. For any check WITH a `wrong` map, a second DIFFERENT wrong pick now also shows the explanation, and a repeat of the same wrong option no longer counts as a second miss. This is the shared check card's rule (SHARED_API S2 §1); no other lab's test pins the old line.

Pinned tests changed on purpose in phase 2 (owner's words above each): `tuningCheckRetry_20261107.test.ts:43-44`, `screenGuide_speech_20261031.test.ts:494` (`pageDetail` allowed: a line only, no credit), `labHubUnreadable_20261003.test.ts:292,303` (Cymatics end screens read the visits AND the check through `useCymaticsEnd`, the EQ rule; this was my phase-1 change).
