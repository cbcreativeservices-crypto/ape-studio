# S4 report · phase 2 · the end-screen recap and next lab (2026-11-14)

Owner approval: "Begin fixing all bugs found and do obvious ... fixes as you suggested in the report", then the suggested order, item 6 "The end screen recap" (report section 3 row 5).

Files owned and changed: `src/features/lab/labEndContent.ts` (only writer this phase), `test/labFixes_20261114_S4.test.ts` (new).

## 1. Summary

- **All 65 Labs-menu tiles are covered, in 68 entries.** Every entry has a 3–5 line "What you learned" recap and a next-lab card. There are 68 entries for 65 tiles because Sound Systems has one end screen per mode (5 entries), Signal Detective shares the Visual Audio Analysis end screen, and each of the 7 Miking families has its own entry.
- **UPDATE (wiring round, on the coordinator's word): the recap now shows in 56 of the 68 entries.**
  - **12 entries still wait for their owners**, who are wiring them now: F5 has Foundations, Mic Principles, Wave, Speaker, Room; F6 has Digital, Meter, Gain, Tube, Amp, Cable, Cable Dressing.
  - Their rows are still in section 3, and they are the only keys left on the test's PENDING list.
  - Before this round, 33 entries showed.
- Nothing is held. The F7 EQ conflict is now resolved (item A).
- **Tests:**
  - `test/labFixes_20261114_S4.test.ts`: 288/288 pass.
  - Also passing: `labFixes_20261114_S2` 111/111, `labEndKit_d41k` 29/29, `labEndScreen` 47/47, `labEndsAndBanner` 7/7.
  - The 111 existing test files that name a host I touched: 3247 of 3248 pass. The 1 failure is F7's own pin of the old `labId="eq"` (SHARED NEED 0 below). No `npx tsc` (phase 2 rule).
- **On screen** (my own tab, 390×844, closed afterwards):
  - First round: Patchbay, Game Audio and Speech & Voice.
  - Wiring round: Mastering (WHAT'S LEFT → WHAT THIS LAB COVERS + AFTER THIS LAB "Mixing Guides") and Stage Plot (the new recap and next-lab card at the foot of "Your stage plots", laid out cleanly at 390).

## 1a. FINAL (2026-11-14): all 68 entries are wired; nothing is pending

F5 and F6 wired their 12 hosts. I checked each one in code. Every one passes the same key that labEndContent.ts uses:
- **F5:** `af_foundations`, `af_mic_principles`, `af_wave_physics` (home and module), `af_speaker_coverage`, `room-design`.
- **F6:** `af_digital_audio`, `af_visual_analysis` and `af_gain_staging` (home and module each), `tube`, `amp` (home and module).
- **The two cable labs** use F6's new `LabRecapNext` (src/screens/lab/cable/labEndExtras.tsx): `af_cables` in lesson12.tsx:171 and `af_cable_install` in CableInstallLabScreen.tsx:852.

Changes to the test:
- `PENDING` is now `{}`, with a test that it stays empty and that every key is read by a host.
- `WIRED_HOSTS` lists all 33 host files and their keys, with one test each.
- The scan now also reads `<LabRecapNext labId>`.
- A new ratchet: every `<LabEndScreen>` outside the kit must pass a `labId`. StartHere is exempt, since it is not a menu lab.

Test results:
- `labFixes_20261114_S4`: 306/306.
- Also passing: S2 111/111, labEndKit_d41k 29/29, labEndScreen 47/47, labEndsAndBanner 7/7.

On screen (one tab, 390×844, closed after): Visual Audio Analysis (F6). SEE WHAT'S LEFT shows WHAT THIS LAB COVERS with the 5 meter lines, and AFTER THIS LAB shows "Signal Chain Builder". The first tap was taken by the lab's glossary term card ("Audio Analyzer"), which closed on CONTINUE.

## 1b. Wiring round (2026-11-14, coordinator's word: "Please wire the hosts yourself where the owning agent has FINISHED (you may now edit exactly these lines, nothing else in those files)")

Each file was re-read first. Only the lines below changed.

| Lab | Key | Change | File |
|---|---|---|---|
| EQ Lab | `eq-lab` | `labId="eq"` → `labId="eq-lab"` (+ comment). Equalizer's `eq` entry now points to the EQ Lab again. | src/screens/lab/eq/EqLabHomeScreen.tsx, src/screens/lab/eq/EqModuleScreen.tsx |
| Microphone Selection | `micselect` | `labId="micselect"` | src/screens/lab/micselect/MicSelectLabScreen.tsx |
| Miking (7 families) | `miking-<family>` | ``labId={`miking-${lesson.labId}`}`` | src/screens/lab/miking/MikingLessonScreen.tsx |
| Sound Systems (5 modes) | `sound-systems-*` | `labId={labId}` | src/screens/lab/soundsystems/SsPagedLab.tsx |
| Mastering | `mastering` | `labId="mastering"` | src/screens/lab/mastering/MasteringLabScreen.tsx |
| Mixing Guides | `mixing-guides` | `labId="mixing-guides"` | src/screens/lab/mixingGuides/MixingGuideScreen.tsx |
| Modular Synth | `modular` | `labId="modular"` + `beforeLeave={close}` (the Modal closes first) | src/screens/lab/ModularLabScreen.tsx |
| Tuning & Temperament | `tuning` | `labId="tuning"` | src/screens/lab/tuning/TuningLabScreen.tsx |
| Drum Tuning | `drum-tuning` | `labId="drum-tuning"` | src/screens/lab/drumtuning/DrumTuningLabScreen.tsx |
| Cymatics (home, module) | `cymatics` | `labId="cymatics"` | src/screens/lab/cymatics/CymaticsHomeScreen.tsx, src/screens/lab/cymatics/CymaticsModuleScreen.tsx |
| Ear Training (lab, module) | `ear-training` | `labId="ear-training"` | src/screens/lab/eartraining/EarTrainingLabScreen.tsx, src/screens/lab/eartraining/EarModuleScreen.tsx |
| Pre-/Post-Production | `preprod` / `postprod` | import `labEndContentFor`; a recap + next-lab block under WHAT'S LEFT, reusing the screen's own styles (h2, para, leftRow, leftKind, leftTitle, go). The heading reads WHAT YOU LEARNED / UP NEXT once nothing is left, otherwise WHAT THIS LAB COVERS / AFTER THIS LAB. | src/screens/lab/production/ProductionPacketScreen.tsx |
| Stage Plot | `stage-plot` | import `useNavigation` + `labEndContentFor`; a `LabRecap` component at the foot of the stage-plot list (the lab has no end screen; the list is where every visit starts and ends), with 11 `recap*` styles copied from LabEndScreen's look. All text is ≥ 11 pt. | src/screens/lab/stageplot/StagePlotLabScreen.tsx |

Checks after the edits:
- Every touched file passes the TypeScript parser (0 parse diagnostics).
- `curl http://localhost:8142` returns 200, and the web bundle builds (HTTP 200, 77.9 MB, it contains the new keys).
- The test now scans for each wiring and has one test per wired host. It also checks that EQ Lab and Equalizer keep separate keys, and that Modular passes `beforeLeave={close}`.

**SHARED NEED 0 (F7's test, not mine to edit).**
- Where: `test/labFixes_20261114_F7.test.ts:279`. It pins the old line: `assert.match(code(f), /howItCounts=\{EQ_END_HOW_IT_COUNTS\}\s*labId="eq"/, f);`.
- Proposed: change the pin to `labId="eq-lab"`, with the coordinator's words above it: "Please wire the hosts yourself … F7 EQ Lab (eq-lab switch, both files)".
- Why: `EqLabHomeScreen.tsx` and `EqModuleScreen.tsx` now pass `eq-lab`. The EQ Lab's check block keeps its own check id `eq`, inside `extra`.

## 2. What was written, and the rules it keeps

- **Recap sources.** Each line comes from the lab's own teaching: its end Screen Guide's "what this teaches", its guided-lesson text and outcomes (`features/lab/guidedLessons/content.ts`), its page guides, the Foundations M14 recap and the Sound Systems LEARN wrap-up page. Each line is written as knowledge, never as a skill. The test bans "you'll / you will / you can" and the S2 skill list. Lines are US spelling, ≤ 30 words and 3–5 per lab.
- **Game Audio.** Lines 1–2 are `GA_END_GUIDE.teaches` lines 1–2, and a test pins that. Lines 3–5 come from its page guides (emitter/listener, the five "through a wall" effects, networked events).
- **Next lab: the Fundamentals.** They run in Labs-menu order: Amplitude → Foundations → Playground → Mic Principles → Wave → Speaker → Room → Digital → Meter → Signal Chain → Cable → Connector Selection → Cable Dressing → Patchbay → Gain Staging → Equalizer.
- **Next lab: Advanced Training.** Each lab points to a natural next topic, mostly the next lab in its own subject:
  - Compression → Gate → Limiter → Smart Processors → Delay → Reverb → Chorus → Flanger → Phaser → Phase → Stereo → Binaural → Beginning Mixing → Advanced Mixing → Mastering → Mixing Guides → Ear Training → Tuning → Harmonograph → Cymatics → Drum Tuning → Ear Training.
  - Oscillators → Noise → Harmonics → Distortion → FM → Modular → Envelope → Compression.
  - Tube → Amp → Sound Systems; the Sound Systems modes run Learn → Build → Route → Operate → Troubleshoot → DJ → Stage Plot → Miking Labs.
  - Pre-Production → Stage Plot; Post-Production → Mastering.
  - Mic Selection → Miking Labs.
  - The Miking families each point to a related lab: drums → Drum Tuning, percussion → Cymatics, winds → Harmonics, strings → Bass Guitar Physics, ensembles/field/broadcast → Speech & Voice.
- **Next-lab rules the test enforces:**
  - Every card is a Labs-menu route, or a Sound Systems mode route inside that lab.
  - The route takes no params, because the card calls `navigate(route)` bare. That rules out PreProdLab, PostProdLab and MeterModule as targets.
  - The title is exactly the menu's name.
  - No card points at its own lab, and no two labs point at each other.
  - No Advanced lab sends the learner back to Fundamentals. There is never a lock or a placeholder.
- **Changes to S2's three examples:**
  - Envelope's next changed from Harmonics to Compression. Harmonics → Distortion → FM → Modular → Envelope would otherwise loop back.
  - Gate's next changed from Compression to Limiter, the menu order. Compression → Gate.
  - Titles now match the menu ("Binaural Panner", not "Binaural Panner Lab").
  - S2's recap lines are kept unchanged. They meet the standard.
- **Comparison with F7's suggestions** (coordinator note): they agree except two.
  - Limiter: F7 suggested Distortion. I kept Smart Processors, the next lab in the Dynamics menu.
  - Equalizer: F7 suggested EQ Lab. That is only possible once the EQ Lab has its own key (item A below).
- **F9's Mic Selection proposal agrees with my entry** (same first two lines, next = Miking Labs).

## 3. SHARED NEEDS: hosts whose end screen does not read labEndContent yet

`<LabEndScreen>` reads the entry through its **`labId`** prop (`kit/LabEndScreen.tsx:89,165`). A host that draws `<LabEndScreen>` needs ONE added prop, `labId="<key>"`. The prop goes on the `<LabEndScreen` element at the line given.

| Lab | Exact key | File:line (`<LabEndScreen`) | Exact change |
|---|---|---|---|
| Foundations of Sound | `af_foundations` | src/screens/lab/foundations/FoundationsCourseScreen.tsx:2377 | add `labId="af_foundations"` |
| Microphone Principles | `af_mic_principles` | src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx:1673 | add `labId="af_mic_principles"` |
| Wave Physics Laboratory | `af_wave_physics` | src/screens/lab/wave/WaveLabHomeScreen.tsx:71 and src/screens/lab/wave/WaveModuleScreen.tsx:145 | add `labId="af_wave_physics"` to both |
| Speaker Placement & Coverage | `af_speaker_coverage` | src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx:642 | add `labId="af_speaker_coverage"` |
| Room Design & Monitoring | `room-design` | src/screens/lab/roomdesign/RoomDesignLabScreen.tsx:205 | add `labId="room-design"` |
| Digital Audio Systems | `af_digital_audio` | src/screens/lab/digital/DigitalLabHomeScreen.tsx:92 and src/screens/lab/digital/DigitalModuleScreen.tsx:124 | add `labId="af_digital_audio"` to both |
| Visual Audio Analysis (and Signal Detective) | `af_visual_analysis` | src/screens/lab/meter/MeterLabHomeScreen.tsx:71 and src/screens/lab/meter/MeterModuleScreen.tsx:127 | add `labId="af_visual_analysis"` to both |
| Gain Staging | `af_gain_staging` | src/screens/lab/gain/GainLabHomeScreen.tsx:74 and src/screens/lab/gain/GainModuleScreen.tsx:110 | add `labId="af_gain_staging"` to both |
| Mastering Lab | `mastering` | src/screens/lab/mastering/MasteringLabScreen.tsx:527 | add `labId="mastering"` |
| Mixing Guides | `mixing-guides` | src/screens/lab/mixingGuides/MixingGuideScreen.tsx:153 | add `labId="mixing-guides"` |
| Sound Systems (all 5 modes) | `sound-systems-learn`, `-build`, `-route`, `-operate`, `-troubleshoot` (the mode's own `labId`, soundsystems/units.ts) | src/screens/lab/soundsystems/SsPagedLab.tsx:334 | add `labId={labId}` (the component's prop, line 74) |
| EQ Lab | `eq-lab` | src/screens/lab/eq/EqLabHomeScreen.tsx:90 and src/screens/lab/eq/EqModuleScreen.tsx:164 | **change** `labId="eq"` to `labId="eq-lab"` in both (see item A) |
| Modular Synth | `modular` | src/screens/lab/ModularLabScreen.tsx:756 (inside `ModularLabEnd`, a Modal) | add `labId="modular"` AND `beforeLeave={close}` (the Modal must close before the next-lab card leaves) |
| Tuning & Temperament Lab | `tuning` | src/screens/lab/tuning/TuningLabScreen.tsx:342 | add `labId="tuning"` |
| Drum Tuning Lab | `drum-tuning` | src/screens/lab/drumtuning/DrumTuningLabScreen.tsx:473 | add `labId="drum-tuning"` |
| Cymatics Lab (home and module end screens) | `cymatics` | src/screens/lab/cymatics/CymaticsHomeScreen.tsx:144 and src/screens/lab/cymatics/CymaticsModuleScreen.tsx:127 | add `labId="cymatics"` to both. The studios' CHECK already shows it through LabShell. |
| Microphone Selection Lab (for F9) | `micselect` | src/screens/lab/micselect/MicSelectLabScreen.tsx:1112 | add `labId="micselect"` |
| Miking Labs, every lesson (for F9) | `miking-<family>`: `miking-drums`, `miking-percussion`, `miking-winds`, `miking-strings`, `miking-ensembles`, `miking-field`, `miking-broadcast` | src/screens/lab/miking/MikingLessonScreen.tsx:478 | add ``labId={`miking-${lesson.labId}`}`` (`Lesson.labId` is the family id, engine/model/types.ts) |
| Vacuum Tube Fundamentals | `tube` | src/screens/lab/tube/VacuumTubeLabScreen.tsx:961 | add `labId="tube"` |
| Amplifier Principles Lab | `amp` | src/screens/lab/amp/AmpLabHomeScreen.tsx:163 and src/screens/lab/amp/AmpModuleScreen.tsx:296 | add `labId="amp"` to both |
| Ear Training Lab | `ear-training` | src/screens/lab/eartraining/EarTrainingLabScreen.tsx:100 and src/screens/lab/eartraining/EarModuleScreen.tsx:615 | add `labId="ear-training"` to both |

**Hosts that draw NO shared end screen.** Each needs a small recap and next block. The proposed block: `const c = labEndContentFor('<key>')`, then the WHAT YOU LEARNED lines and the next-lab card in the same look as LabEndScreen's (or the lab's own WHAT'S LEFT page renders `<LabEndScreen>`):

| Lab | Exact key | File | Where |
|---|---|---|---|
| Cable & Connector Fundamentals | `af_cables` | src/screens/lab/cable/lessons/lesson12.tsx | under the LAB COMPLETE / WHAT'S LEFT block (around line 156) |
| Cable Dressing & Installation | `af_cable_install` | src/screens/lab/cableinstall/CableInstallLabScreen.tsx | its own WHAT'S LEFT / completion view (completeCopy.ts `ciLeftLead`) |
| Audio Pre-Production / Post-Production | `preprod` / `postprod` (= the route's `lab` param) | src/screens/lab/production/ProductionPacketScreen.tsx | under WHAT'S LEFT (line ~212): `labEndContentFor(lab)` |
| Stage Plot and Channel Designer | `stage-plot` | src/screens/lab/stageplot/StagePlotLabScreen.tsx | after the guided task's last step, or on the export area |

**A · EQ Lab vs Equalizer. RESOLVED in the wiring round:** both EQ Lab hosts now pass `eq-lab`, and `eq.next` points to the EQ Lab again. Below is the original note, kept for history.

Rows in the table above, other than those owned by F5 and F6, are DONE (section 1b).
- F7 made both EQ Lab end screens pass `labId="eq"`, the Equalizer's id.
- So the `eq` entry is written to be true of BOTH labs, and its next lab is Compression, never "EQ Lab". Without that, the EQ Lab's card would have pointed at itself.
- The EQ Lab has its own fuller entry, `eq-lab`, which shows once its hosts pass `labId="eq-lab"`. After that, the Equalizer's card could point to the EQ Lab (one line in labEndContent.ts).

**B · Already wired, nothing to do.**
- These hosts already pass their id: PagedLab (connector-select, patchbay, deesser, envelope, speech, mixing-beg, mixing-adv, dj-systems, game-audio), LabCheckEnd (every effect lab through FxLabScreen, fm, binaural, oscillator, noise, harmonic, autotune, harmonograph, bass, stereo), the cymatics studios through the LabShell default, and ReviewLabEnd (af_amplitude, af_sound_playground, af_signal_chain).
- The test scans the source for these, so a new host that passes an id is picked up automatically.

## 4. The test (test/labFixes_20261114_S4.test.ts)

- Reads the Labs menu from `labCatalog.ts` (and the Miking families from their registry). It fails if any menu route has no end-screen id or no entry.
- Every key in labEndContent.ts must be EITHER passed by a host today OR listed as PENDING with existing files. Hosts are found by scanning src for `<PagedLab>` (kit only), `<LabCheckEnd>`, `<ReviewLabEnd>`, `<LabEndScreen labId>`, and LabShell's default check end. A wrong key fails.
- Every pending `<LabEndScreen>` host still draws the shared end screen, so one prop is the whole fix.
- Every next lab passes these checks:
  - it is a real menu route (or a Sound Systems mode) with no params;
  - its title matches the menu;
  - it is not self-pointing, and no two labs point at each other;
  - Fundamentals run in menu order, and no Advanced lab sends the learner back to them.
- Recaps: 3–5 lines, ≤ 30 words, no skill claims, US spelling, no repeated line, each ends with a full stop. Game Audio's first two lines equal its guide's.

## 5. What I did not check, and why

- **The next-lab card's tap.** It was not seen leaving to the next lab. On Patchbay the tap brought up the end screen's guide card, and the preview harness (`#labpreview/<Route>`) has no real stack to navigate to. The card's code is S2's, and S2's test pins it.
- **The Equalizer's recap.** It was not seen. Its FINISH appears only after the CHECK is passed, and I did not answer the check. The Sound Safety sheet that came up there was closed with KEEP SOUND OFF.
- **The 35 pending entries.** They cannot be seen until their hosts pass the id (section 3).
- **The preview.** It reloaded several times while I worked (other agents' edits). Each check was retried until it loaded.
