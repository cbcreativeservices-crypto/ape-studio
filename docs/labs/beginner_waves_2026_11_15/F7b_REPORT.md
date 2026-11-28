# F7b report: beginner waves 1-3 (2026-11-15)

Group F7b: Delay, Reverb, Chorus, Flanger, Phaser, Distortion, Phase (the rack effect labs).
Owner go: "build waves 1 thru 3" (D62 adoption plan). No build, no update, no commit, no git writes.
Tests: `test/labWaves_20261115_F7b.test.ts` (67 tests, all pass).

## 1. Summary

- **Built: 23 of 24 listed items, plus the sweeps and the coordinator's extra SH-75-F.**
- **Built a different way: 1 (CH-01).** The card now matches the picture, and the picture is unchanged. Reason: a standing rule (the picture is the DSP's own math, never stylized audio). See the CH-01 row.
- **Not a bug in these labs: SH-15, SH-35, SH-37.**
- **Held: none.**
- **SHARED NEEDS: none for the frame (group S).** Two server changes are proposed for the glossary, and some FxLabScreen.tsx changes are shared with F7a (section 3).
- **Seen on screen: none of these seven labs.** There is no web-preview route for them (`src/dev/webPreviews.tsx` has no entry for Delay, Reverb, Chorus, Flanger, Phaser, Distortion or Phase), as the coordinator warned. So every row says "not seen on screen (no preview route)". Each one was checked in code and tests instead. Section 5 lists what a phone or preview check should look at.

## 2. Item table

| ID | Wave | What changed on screen (plain words) | Files | Test | Seen on screen at 390 | Status |
|---|---|---|---|---|---|---|
| DL-01 | 1 | Delay opens at FEEDBACK 0%. Each gray click comes back once as a blue echo, and the glass key now reads GRAY CLICK · BLUE ECHO (GRAY CLICK · BLUE ECHOES once FDBK is up). It replaces the old "CLICK · 90 BPM" key: one line in, one out. EXPLORE WHERE TO START now just says to watch. | fxLabConfigs.tsx (delay), fxAnim.tsx (EchoFlow note), delayScreenGuides.ts | DL-01 block | not seen on screen (no preview route) | BUILT |
| DL-02 | 1 | One tempo. The click is now CLICK 120, and TIME opens at 250 ms, an eighth note at 120 BPM. The caption names the CLICK's own notes ("250 ms = an eighth note at the CLICK's 120 BPM: each repeat lands halfway between two clicks"; at 375 ms a dotted eighth; at 500 ms "a quarter-note at 120 BPM, the CLICK's tempo: each repeat lands on the next click"). Any other TIME keeps the quarter-note law LEARN teaches. 160 BPM and 90 BPM are gone from the guide, the lesson and the caption. **Why not the 500 ms example:** at 500 ms every echo lands exactly under the next click, so the echo hides and FEEDBACK's growing trail cannot be seen. 250 ms keeps the one tempo and the echoes in time. | fxLabConfigs.tsx (DELAY_BPM, delayTempoPhrase, sources, TIME), delayScreenGuides.ts, content.ts (delay: CLICK 120) | DL-02 block | not seen on screen (no preview route) | BUILT |
| DL-03 | 1 | LEARN WHERE TO START: "Start on EXPLORE, no sound needed: with FDBK at 0%, drag TIME all the way down to 80 ms and watch the one echo close in behind each click: a slapback. Leave FORMULA / CONCEPT for last." LEARN TRY THIS takes the same order (slapback first, formula last). | delayScreenGuides.ts | DL-03 block | not seen on screen (no preview route) | BUILT (one change with DL-01/02) |
| RV-04 | 1 | First pointer: "Drag RT60 (decay time) up, from a small room toward a big hall, and watch the amber wash on OUT last longer. Then tap ▶…". "RT60 (decay time)" comes from `termWithShort('rt60')`. | reverbScreenGuides.ts | RV-04 block | not seen on screen (no preview route) | BUILT |
| FL-03 | 1 | The flanger readout cell RATE is now SWEEP, like the dock key. It shows the sweep's RATE, and the first-visit caption still reads "sweep speed". The guide was updated to match. | fxLabConfigs.tsx (flanger bezel), flangerScreenGuides.ts | FL-03 block | not seen on screen (no preview route) | BUILT |
| PS-02 | 1 | The Phaser notes open "A phaser makes a few UNEVEN dips in the sound and sweeps them up and down…". The flanger comes second, as "If you met the flanger: its short delay makes an even comb instead." "That difference is the whole lesson" is gone. | fxLabConfigs.tsx (phaser intro) | PS-02 block | not seen on screen (no preview route) | BUILT |
| PS-03 | 1 | Every counting step holds the dips still first. This covers LEARN WHERE TO START, EXPLORE and LEARN TRY THIS 2, CHECK TRY THIS, the sound-off line, the two in-notes check reasons and the three understanding-check reasons. The lab still opens sweeping (DEPTH 50%), so ▶ shows the swirl. | phaserScreenGuides.ts, fxLabConfigs.tsx (phaser), understandingChecks.ts (PHASER why) | PS-03 block | not seen on screen (no preview route) | BUILT |
| DS-03 | 1 | TYPE choices now read HARD (FLAT TOPS), SOFT (ROUNDED) and TUBE (LOPSIDED), and the key reads OVERSAMPLING instead of OS. The same words are used in the guide, lesson, check, captions and sound-off line. The dock value still shows HARD / SOFT / TUBE. | fxLabConfigs.tsx (distortion), distortionScreenGuides.ts, content.ts (distortion), understandingChecks.ts (DISTORTION) | DS-03 block | not seen on screen (no preview route) | BUILT |
| DS-05 | 1 | The reason for "oversampling only changes the display" now reads: "The picture stays the same with OVERSAMPLING, but the sound changes, so this step needs your ears: play SINE 5 kHz at high DRIVE and compare ON with OFF." (29 words; it does not give the answer.) | understandingChecks.ts | DS-05 block | not seen on screen (no preview route) | BUILT |
| PH-03 | 1 | Phase LEARN WHERE TO START: "Start on EXPLORE: set FLIP R to FLIPPED Ø, then LISTEN to MONO (L+R), and watch OUT go flat. Then read polarity versus phase here. The formula under FORMULA / CONCEPT comes last." | phaseScreenGuides.ts | PH-03 block | not seen on screen (no preview route) | BUILT (one change with PH-01/05) |
| PH-05 | 1 | When R is flipped, LISTEN is on MONO and DELAY R is 0, the glass prints SILENCE: THE TWO SIDES ERASED EACH OTHER over the flat line. At that moment the L / R key steps aside, since both traces are flat: one line in, one out. EXPLORE WHERE TO START opens on that silent step, with ▶ last. | fxAnim.tsx (StereoFlow, phase flavor only), phaseScreenGuides.ts | PH-05 block; stereo test updated | not seen on screen (no preview route) | BUILT |
| PH-06 | 1 | The DELAY R lane's − / + keys now step exactly 0.1 ms: 11 taps from 0 reach 1.1 ms and 23 reach 2.3 ms. No new buttons: the lane's own − / + keys (S3, row 8) used a 5% fallback step (0.5 ms), because FxLabScreen's format ignores its argument. The fader now declares `steps: 100`, and FxLabScreen forwards `steps`. | fxLabConfigs.tsx (phase fader), FxLabScreen.tsx (FxFaderSpec.steps + forward), phaseScreenGuides.ts, content.ts | PH-06 block (runs laneStepValue) | not seen on screen (no preview route) | BUILT |
| SH-11 | 1 | Every EXPLORE and LEARN WHERE TO START in the 7 labs now opens on a step you can do without sound. Fixed here: Distortion EXPLORE (was "Tap ▶…"), Phase EXPLORE (was "Tap ▶…"), and the Delay / Flanger / Phaser / Phase LEARN starts. Reverb, Chorus and Distortion LEARN already opened on reading. | the guides above | SH-11 block (14 tests) | not seen on screen (no preview route) | BUILT |
| SH-15 | 1 | Nothing goes blank with sound off in these labs. Their readouts show settings, not live measurements: no `pollGr` here; the only live cell is the dynamics labs' GR. | (checked FxLabScreen.tsx:672-695) | — | — | NOT A BUG |
| SH-27 | 1 | Dock labels wrap (shared). The glass labels I added were sized for a 390 phone in code (section 5). The longest dock key, OVERSAMPLING, relies on DockButton's two-line wrap. | fxAnim.tsx | — | not seen on screen (no preview route) | BUILT (code-checked) |
| SH-35 | 1 | These labs have one rack, which stays mounted across EXPLORE / LEARN / CHECK, so the key order is the `params` order everywhere. | — | — | — | NOT A BUG |
| SH-36 | 1 | One name per control: Phase (PH-01), Flanger SWEEP (FL-03), Distortion OVERSAMPLING (DS-03), Reverb DECAY TIME (RT60) (RV-01). Reverb's readout PRE is now PRE-DLY, like its dock key. Abbreviations that are spelled out in their tray title (FDBK = FEEDBACK, DAMP = HF DAMPING, RES = RESONANCE) are the shared design and stay. | fxLabConfigs.tsx, reverbScreenGuides.ts | SH-36 block | not seen on screen (no preview route) | BUILT |
| SH-64 | 1 | A control the setting ignores is grayed with its reason. Delay: REPEAT DAMPING at FDBK 0% ("needs FDBK above 0%: one repeat is not filtered"; the engine's first repeat is the raw input). Phaser: RATE at DEPTH STATIC ("nothing moves at STATIC"). To make it show inside group trays, FxLabScreen's group tray now grays an ignored section's chips (opacity 0.45). The reason takes the place of the hint, and the chips still answer a tap. | fxLabConfigs.tsx (delay, phaser `ignoredBy`), FxLabScreen.tsx (group render + `chipRowIgnored`) | SH-64 block | not seen on screen (no preview route) | BUILT |
| RV-01 | 2 | Subtitle: "Decay time (RT60) · Pre-delay · Damping". Readout: DECAY TIME (RT60), shortening to DECAY TIME in a narrow cell. Tray / lane title: DECAY TIME (RT60). The words come from `PLAIN_TERMS.rt60.short`. The cell's caption was dropped, because a caption would be a second RT60 definition (guardrail 3). The dock key stays RT60, the control's name in every step. FxLabScreen now forwards `kNarrow` (F7a's Stereo uses it too). | fxLabConfigs.tsx, FxLabScreen.tsx, reverbScreenGuides.ts, understandingChecks.ts (REVERB why) | RV-01 block | not seen on screen (no preview route) | BUILT |
| RV-03 | 2 | A small bracket over OUT spans the gray click to the start of the wash (PRE-DELAY plus the tank's 31 ms first line), labeled GAP. It glides with the wash, for the CLICK source only. Line out: the glass key dropped its BPM ("CLICK · dB VIEW"; the tempo is on SOURCE). The step and TRY THIS now point at the GAP bracket. | fxAnim.tsx (ReverbFlow), reverbScreenGuides.ts, content.ts (reverb step 4) | RV-03 block | not seen on screen (no preview route) | BUILT |
| CH-01 | 2 | **Card changed, picture unchanged.** The engine mixes ONE late copy per side (Effects.hpp ModEffect: L and R copies, 90° apart). It never mixes two or three copies into one sum. Drawing a choir's sum would draw what the audio does not do (standing rule: the picture is the DSP's own math, never stylized audio). In mono the two side copies also beat against each other, which would contradict the lab's MIX 100% = VIBRATO lesson. So the card that made the false promise was changed instead: "Chorus is an effect that makes one sound seem like more than one. It copies the sound, delays the copy a little, and slowly wobbles that delay, so its pitch drifts. Mixed with the original, the two sound like two players who can never be perfectly together." This matches the picture and the notes. | labTermIntroData.ts (ChorusLab) | CH-01 block | not seen on screen (no preview route) | BUILT (card); picture part not built: standing rule. If the owner still wants a two-copy picture, it needs his decision on drawing the right side's copy |
| CH-02 | 2 | RATE opens at 0.50 Hz (was 0.25 Hz), so one wobble takes 2 s. It stays under the 0.87 Hz "LFO SLOWED" cap, and step 1 is still honest. Each DELAY tray choice says "How late the copy runs. On SINE 440 Hz this barely changes the sound: switch SOURCE to PINK NOISE to hear it." (also SH-76). | fxLabConfigs.tsx (chorus), chorusScreenGuides.ts, content.ts | CH-02 block | not seen on screen (no preview route) | BUILT |
| CH-03 | 2 | The notes no longer name the flanger. The check question now reads "A flanger (the next lab) makes a sweeping, jet-like whoosh. Compared with it, a chorus uses…", with options unchanged (deck and grading untouched). The lesson's mistake line says "(the next lab)". | fxLabConfigs.tsx (chorus intro), understandingChecks.ts (CHORUS), content.ts | CH-03 block | not seen on screen (no preview route) | BUILT |
| FL-02 | 2 | LEARN WHERE TO START: "Read the first paragraph, what a flanger is. Then on EXPLORE drag CENTER from 2.0 ms down to 0.50 ms, no sound needed, and watch the notches on OUT spread apart. Leave FORMULA / CONCEPT for last." The three missing-control entries (LFO Waveform, Stereo width / LFO phase offset, Through-Zero) fold into ONE entry, "Other controls you will meet" (ADV). It keeps the 90° fact and the "specialty" wording. | flangerScreenGuides.ts, content.ts (flanger) | FL-02 block | not seen on screen (no preview route) | BUILT |
| PS-01 | 2 | Phaser card: "A phaser makes a few dips in the sound and sweeps them up and down, a swirling whoosh. More STAGES means more dips." | labTermIntroData.ts | PS-01 block | not seen on screen (no preview route) | BUILT |
| DS-04 | 2 | Distortion card: "…adds sound the original did not have. Sometimes it sounds nice, like the warm tone of a tube amp or guitar overdrive; sometimes it sounds harsh. Push a sound harder than the equipment can carry and its shape gets squashed; that adds new tones." Down from five sentences to three, and "harmonic and intermodulation content" is gone. | labTermIntroData.ts | DS-04 block | not seen on screen (no preview route) | BUILT |
| PH-01 | 2 | The Phase keys read DELAY R, FLIP R and LISTEN; the readouts FLIP R / DELAY R / LISTEN (caption "one speaker?"); the choice FLIPPED Ø; the stage label FLIP · DELAY. Ø is explained once, in the tray ("Ø means flipped upside down…") and in the guide. Tray titles keep the trade word in brackets: FLIP R (POLARITY), LISTEN (MONO-FOLD). Every POL / DLY R / FOLD / INVERTED Ø is gone from the guide, notes, lesson and check. | fxLabConfigs.tsx (phase), fxAnim.tsx (stageLabel), phaseScreenGuides.ts, content.ts (phase), understandingChecks.ts (PHASE) | PH-01 block | not seen on screen (no preview route) | BUILT |
| PH-04 | 2 | Phase card opens "Two copies of a sound can help each other or erase each other.", then the in-phase / half-cycle lines. Comb filtering and speaker alignment are dropped. | labTermIntroData.ts | PH-04 block | not seen on screen (no preview route) | BUILT |
| SH-12 | 2 | All 7 labs already pass their own `soundOffLine`. The Phaser and Phase lines were reworded for PS-03 / PH-01. | fxLabConfigs.tsx | — | — | ALREADY BUILT (checked) |
| SH-14 | 2 | The listening-only steps in these labs carry NEEDS SOUND (Delay damping, Distortion oversampling, Chorus RATE). Each lab's sound-off line names the silent path. There is no shared "can't listen now" control to add (group S). | — | — | — | ALREADY BUILT (per lab) |
| SH-37 | 2 | Effect labs show the dev-build line only under `__DEV__` (FxLabScreen.tsx:957). No "update the app" in any of my files. | — | — | — | NOT A BUG |
| FL-04 | 3 | The flanger's OUT title "SPECTRUM (dB)" is now "DIPS = CANCELED HERE" (US spelling): one line out, one in. The phaser keeps SPECTRUM (dB). The guide and the lesson's display entry say each dip is a frequency the copy cancels. Note: the label is permanent, not only on a first view. The glass cannot know a first visit, and permanent costs nothing because it replaced the old title. | fxAnim.tsx (SpectrumFlow), flangerScreenGuides.ts, content.ts | FL-04 block | not seen on screen (no preview route) | BUILT |
| PH-02 | 3 | The note above the scope now reads "Scope: L against R, upright = same, flat = opposite. It and CORRELATION are modeled, not measured." It replaces the old "worked out from a 440 Hz model" note (same element, ≤ 100 chars, disclosure kept). | fxLabConfigs.tsx (phase curveNote) | PH-02 block | not seen on screen (no preview route) | BUILT |
| SH-26 | 3 | The codes in these labs are now words (POL / DLY R / FOLD / OS / TANH / ASYM / R: Ø · DLY). The remaining dock abbreviations (FDBK, PRE-DLY, DAMP, RES) are spelled out in their tray title and carry first-visit bezel captions. | — | covered by DS-03 / PH-01 tests | — | BUILT |
| SH-76 | 3 | One-line tray meanings, shown for the selected choice only: Reverb DAMP (DARK / NATURAL / BRIGHT), Chorus DEPTH (SUBTLE / CLASSIC / DEEP) and DELAY, Flanger MIX (50% EVEN / 100%), Phase FLIPPED Ø and MONO (L+R). Skipped on purpose, so a tray never states a check answer: Chorus MIX 100% = VIBRATO, Flanger FDBK 70% METALLIC, Distortion OVERSAMPLING and 50% PARALLEL. Group trays (Delay COLOR, the Phaser / Flanger SWEEP) show no blurbs (frame). | fxLabConfigs.tsx | SH-76 block | not seen on screen (no preview route) | BUILT |
| SH-75-F | 1 | The coordinator's extra item: the CHECK guides no longer repeat "no score" (the shared card says it). Chorus, Flanger and Phaser now read "A right answer stays right."; Delay and Reverb "A wrong answer costs nothing: pick again straight away."; Distortion and Phase "There is no limit on tries." The two pinned tests were updated with the owner quote. | the 7 guides; test/screenGuide_distortion, test/screenGuide_phase | SH-75-F block | not seen on screen (no preview route) | BUILT |

### Pinned tests updated on purpose (each with `owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan, item …)`)
- test/screenGuide_delay_20261031.test.ts
- test/screenGuide_reverb_20261031.test.ts
- test/screenGuide_chorus_20261031.test.ts
- test/screenGuide_flanger_20261031.test.ts
- test/screenGuide_phaser_20261031.test.ts
- test/screenGuide_distortion_20261031.test.ts
- test/screenGuide_phase_20261031.test.ts
- test/screenGuide_stereo_20261031.test.ts (Phase stage label; the legend steps aside only in the Phase silence)
- test/screenGuide_eartraining_20261031.test.ts (the Reverb key's full name)
- test/dec_A03-effect-labs-captions-and-sources_20261105.test.ts (OVERSAMPLING)
- test/labFixes_20261114_F7.test.ts: the kNarrow forward, the Delay / Reverb start regexes, and the Reverb cell without a caption. The F7a edit in the same test was kept.

## 3. SHARED NEEDS

- **Frame (group S): none.** I edited nothing in `rack/`, `kit/`, `LabShell.tsx`, `LabUnderstandingCheck.tsx` or the shared logic.
- **FxLabScreen.tsx (shared by all 12 effect labs, F7a and F7b).** Three small, additive changes, all made with Edit on their exact lines:
  - (a) `FxFaderSpec.steps`, forwarded as `steps: s.steps` (PH-06).
  - (b) the bezel's `kNarrow?: string`, forwarded on both bezel branches (RV-01; F7a's Stereo MONO CHECK → MONO uses it).
  - (c) the group tray grays an `ignoredBy` member, with its reason in the hint's place and a `chipRowIgnored` style (SH-64). It coexists with F7a's `hint`.
- **fxAnim.tsx:** edits only in EchoFlow, ReverbFlow, SpectrumFlow (flanger branch), StereoFlow (phase flavor only) and `stageLabel` (phase).
- **Server change proposed (never run): the glossary rows behind the four rewritten lab cards.** The app text now leads, as the 11-14 round did for the Connector and Cable dressing cards. The coordinator decides whether to update the rows (proposed SQL; ids as in labTermIntroData.ts):
  ```sql
  -- proposal only; not run
  update glossary set plain_english = 'A phaser makes a few dips in the sound and sweeps them up and down, a swirling whoosh. More STAGES means more dips.' where id = '53870fd2-ddf2-4299-8d29-a0d195e1285e';
  update glossary set plain_english = 'Distortion is any change to a signal that adds sound the original did not have. Sometimes it sounds nice, like the warm tone of a tube amp or guitar overdrive; sometimes it sounds harsh. Push a sound harder than the equipment can carry and its shape gets squashed; that adds new tones.' where id = 'f62fc1ed-05ff-4c60-9f4c-f96ec34400e9';
  update glossary set plain_english = 'Two copies of a sound can help each other or erase each other. Phase is where a wave is in its up-and-down cycle compared to another wave. When two copies line up (in phase) they add together. When two equal sine waves are half a cycle apart (180 degrees) they cancel.' where id = 'a3004045-dce0-4e6d-9a51-f1149c4584a3';
  update glossary set plain_english = 'Chorus is an effect that makes one sound seem like more than one. It copies the sound, delays the copy a little, and slowly wobbles that delay, so its pitch drifts. Mixed with the original, the two sound like two players who can never be perfectly together.' where id = 'd8f9a016-2238-43ee-b5d9-2f1bded98f9c';
  ```
  The glossary is a teaching reference used beyond these labs, so the owner may prefer to leave the rows as they are and keep the app wording lab-only.

## 4. Guardrail check (a line in, a line out)

- **Delay glass:** GRAY CLICK · BLUE ECHO replaced the "CLICK · 90 BPM" key, so the element count is the same.
- **Reverb glass:** the GAP bracket and its label came in; the key's "· 60 BPM" went out. The Reverb readout lost its first-visit caption, and its subtitle and key got longer but stayed one element each.
- **Flanger glass:** DIPS = CANCELED HERE replaced SPECTRUM (dB).
- **Phase glass:** SILENCE… appears only at the exact cancel, when the L / R key goes away.
- **Phase scope note:** replaced in place.
- **Tray blurbs:** one line inside an open tray, for the selected choice only.
- **Group-tray gray:** the reason sits in the existing section-head line.
- **Fewer things to read:** the Phaser card went from 8 sentences to 2, the Distortion card from 5 to 3, the Flanger LEARN from 3 entries to 1, and the Chorus notes and Phaser notes are shorter.

## 5. What I could not check, and why

- **No screen check.** None of the 7 labs has a web-preview route, so nothing was seen at 390 x 844. A phone or preview check should look at:
  - Delay's GRAY CLICK · BLUE ECHOES key: 24 characters, the same length as the existing STEADY NOISE · TRY CLICK, so it may touch the stage bar on a 320-wide phone.
  - Phase's FLIP · DELAY along the bar: about 82 of 90 glass units by Oswald widths.
  - The SILENCE line: it may wrap to two lines at 390, and is placed to end above the flat line.
  - Reverb's GAP label near the top.
  - DECAY TIME (RT60) on the bezel: should shorten to DECAY TIME when narrow.
  - OVERSAMPLING on the Distortion dock: wraps to two lines.
  - That the delay echo really reads blue: it does by the level-color math (≤ 10% of full scale).
- **Sound not heard.** These are model or text changes, and the audio engine is untouched. The new defaults (FDBK 0%, TIME 250 ms, 120 BPM click, Chorus RATE 0.5 Hz) change what plays at first.
- **Other groups' failing tests (not mine; not touched).** In my run of the 85 test files that touch my sources, these fail:
  - auditR2_A_C (limiter wording in content.ts)
  - auditR2_A_D (CeilingScene)
  - early_G2-fx-labs:139 (limiter sources order)
  - factAuditR3_D (mixing pagesAdvA)
  - labsGroupBBugHunt20260930
  - Earlier runs also briefly showed modular / harmonic / F7:461 (EQ Lab), which other builders were editing at the time.
  - Every test of my files passes: 2906 of 2911 in that set; the 5 failures are the ones above.
- **tsc:** see the final line below.

**tsc (`npx tsc --noEmit`, run once at the end):** 0 errors in the whole project, mine included.

## Checker fixes (CHECK_F7b_REPORT.md, 2026-11-15)

| # | Checker finding | Fix | Files | Test |
|---|---|---|---|---|
| 1 | DL-02 FAIL: at 250 ms the caption says "each repeat lands halfway between two clicks". That is false at FDBK above 0%, where repeat 2 lands ON the next click. | The caption now reads "…: **the first** repeat lands halfway between two clicks." | fxLabConfigs.tsx (`delayTempoPhrase`) | labWaves DL-02 block (also checks that "each repeat lands halfway" is gone) |
| 2 | RV-04 FAIL: "drag RT60 up, from a small room toward a big hall", but RT60 opens at 1.5 s (HALL). | The start now reads "Drag RT60 (decay time) down to a small room, then up toward a big hall, and watch the amber wash on OUT last longer. Then tap ▶…". | reverbScreenGuides.ts | labWaves RV-04 (also pins `initial: 1.5`); labFixes_20261114_F7 start regex updated |
| 3 | The Delay PING-PONG steps promise L, R, L, but at the new FDBK 0% default there is only one repeat. | EXPLORE TRY THIS 3 now begins "Set FDBK to 50%, open COLOR and turn PING-PONG on: …", and guided step 5 begins "Set FDBK to 50%, then open COLOR…". "(SOURCE on CLICK 120)" was dropped from TRY THIS 3 so it fits the 200-character budget; CLICK is the default source. | delayScreenGuides.ts, content.ts | labWaves "checker fixes" block |
| 4 | The Phaser in-notes wrong-answer hint counts dips without STATIC. | It now reads "Set the sweep to STATIC, then tap through STAGES and count the dips in the curve." The PS-03 test now holds EVERY counting line to STATIC; the exception for "in the curve" was removed. | fxLabConfigs.tsx (phaser) | labWaves PS-03 + "checker fixes" |
| 5 | Reverb: "Read the readout's full name: DECAY TIME (RT60)" is untrue when a narrow phone shows only "DECAY TIME". | It now reads "The 60 in RT60 is not a length. On EXPLORE, the RT60 readout is named DECAY TIME." This is true with either key. | understandingChecks.ts (REVERB why) | labWaves "checker fixes" |

CH-01 is left as built (the coordinator will tell the owner). After the fixes, my set of 85 test files gives 2913 of 2914; the one failure (delay TRY THIS over budget) was then fixed and the delay, F7 and labWaves tests pass (147 of 147). The other groups' failures listed in section 5 did not appear in this run.

**tsc after the checker fixes:** 0 errors (exit 0).
