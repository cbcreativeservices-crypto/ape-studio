# F6 report · Meter, Signal Chain, Gain, Patchbay, Digital, Cable, Cable Dressing, Connector Selection, Vacuum Tube, Amplifier, Calculator Lab · lab fix round 1, phase 1 (2026-11-14)

Status: PHASE 1 and PHASE 2 DONE (2026-11-14). Phase 2 is the section at the end.

## Summary
43 items: **36 fixed · 4 not a bug · 1 OUT (owner decision) · 2 shared needs · 0 held.** Tests: `test/labFixes_20261114_F6.test.ts` 38 pass; the touched files' own suites 752 pass, 0 fail; `npx tsc --noEmit` 0 errors (whole project, once, end of phase 1). Pinned tests changed on purpose, each with the owner's words above the change: screenGuide_chain, auditR2_A_D_labs (the Signal Chain line only), gainEmulatorPass, screenGuide_patchbay, screenGuide_digital, screenGuide_cableinstall, patternP16; screenGuide_calc (its import line only, for the new helper).

## Items

| # | Item (lab, what) | Verified in code (file:line) | Fix (files changed) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| 1 | Meter M1: overlay "PK 5.5" vs readout "PEAK +0.0" | vizMeters.tsx:370 (stats from the UNclipped buffer) vs modMeterA.tsx:344 (frame from the clipped buffer) | Overlay stats now read the stored (clipped) samples when the rails show; how far it wanted to go stays on the CLIP readout. vizMeters.tsx | F6 test "Meter lab" 1 | Yes: SPEECH reads "PK -2.6 RMS -12.6 CREST 10.0 dB" and frame "-2.6 / -12.6 / 10.0dB" | FIXED |
| 2 | Meter M1: "DC +0.02" vs "DC +4.0%" | vizMeters.tsx:345 (overlay buffer 2048 samples, frame 1024) and :509 (fraction, not %) | Overlay reads the frame's own 1024-sample buffer and prints DC in %. Guide line updated. vizMeters.tsx, meterScreenGuides.ts | F6 test 2 | Yes: overlay "DC +1.5%", frame "+1.5%" | FIXED |
| 3 | Meter M9: "a single point at center" vs a vertical line | modMeterC.tsx:266 | Copy: "a single line straight up the middle" | F6 test 6 | not re-seen (copy only) | FIXED |
| 4 | Meter M4: disclaimer printed twice | modMeterA.tsx:819 (stage badge) + :833 (well Badge). The stage badge is 2 lines with a shrink floor (RackUnit.tsx:709), so the well copy was redundant | Well copy removed. modMeterA.tsx | F6 test 3 | Yes: printed once | FIXED |
| 5 | Meter M4: 4 of 5 readout keys lost at 390 | modMeterA.tsx:789 (values "−15.9LUFS" etc. too wide → BezelReadouts drops the key, D36) | Number on the value line, unit on the `sub` line, plus `kNarrow` (INTEG., SAMPLE, GAP). Same for M1 CLIP "+5.4 OVER" and M2 PEAK / PK HOLD "+6.6 OVR". modMeterA.tsx | F6 tests 4, 5 | Yes (390): INTEG., LRA, SAMPLE, TRUE PK, TP GAP all shown with their numbers | FIXED |
| 6 | Signal Detective overlay "gives the answer away" (G2 file) | vizMeters.tsx:544 comment: "Everything else on the face stays — it is the evidence" (hideName design) | none | — | — | NOT A BUG (by design: the face is the evidence) |
| 7 | Signal Chain: SCENE "SQUASH" vs button "HOT INTO LIMITER" | SignalChainLabScreen.tsx:191 (`short: 'SQUASH'`) | short → "HOT→LIMIT" (the button's words, like EQ→COMP); guide line updated; pinned test updated with the owner's words. SignalChainLabScreen.tsx, chainScreenGuides.ts, test/screenGuide_chain_20261031.test.ts | F6 test "Signal Chain"; screenGuide_chain | not seen (no preview route; member route not walked yet) | FIXED |
| 8 | Signal Chain: ▶ shows nothing with sound off | SignalChainLabScreen.tsx:304 (`if (!fxReady) return`), :308 (`if (!ok) return` after KEEP SOUND OFF), :439 (`disabled={!fxReady}`) | ▶ is never dead: with sound kept off OUT reads SILENT (red) and a note under the rack says GR stays at 0 and gives the measured numbers (LIMIT alone −4.5, with DIST about −16, from chainScreenGuides.ts' measured table); on a device with no chain audio the same note. SignalChainLabScreen.tsx | F6 test "Signal Chain" | see row 7 | FIXED |
| 10 | Gain M8: FINISH · SEE WHAT'S LEFT shown before the puzzle is solved | RackUnit.tsx:797 draws the in-well FINISH whenever a LabNav context exists; modExplore.tsx:466 | Until FIXED the module's RackUnit gets no LabNav context (no big green button); the well offers a quiet link "Not solved yet. Leave anyway: SEE WHAT'S LEFT ›" and the strip's FINISH stays (labs never block navigation). After FIXED the big button returns. modExplore.tsx | F6 test "Gain" | Yes before the fix check: quiet link shown, no in-well FINISH (later re-check blocked by a shared-frame crash, see "not checked") | FIXED |
| 11 | Gain M8: inspected columns go back to "?" | modExplore.tsx:409/423 (only `revealed` opens a column) | Visited columns keep their verdict word under the "?" (✓ OK / LOW / HOT / CLIP / DIST, stageStatus colours) in place of INSPECT; the meter stays closed (owner 2026-08-10: one device at a time). New optional `checked` on StageColSpec. modExplore.tsx, gainViz.tsx | F6 test | Yes (front tab): PREAMP keeps "✓ OK" after EQ is inspected | FIXED |
| 12 | Gain M8: card says start at Preamp (forward), well says "work back upstream" | gainScreenGuides.ts:342, modExplore.tsx:497 | Well text: the culprit is the clipping stage nearest the source; search from either end (the guide's TRY THIS already said "either end"; its "as the notes suggest" dropped). | F6 test | — | FIXED |
| 13 | Gain M3: at +40 dB all stages clip at once | gainEngine.ts:131 (`raw >= CLIP_CEIL`): a full-scale signal hits every later stage's ceiling; the guide says so on purpose ("Every later stage … shows CLIP too", gainScreenGuides.ts:346), owner spec "the master ALWAYS shows CLIP" (modExplore.tsx:354) | Model kept (correct: a real clip light there lights too). The card's question "which stage reaches CLIP first" is now answered in words: a red note "First stage to clip: PROC … the damage started here." modLearn.tsx | F6 test | not seen (shared crash) | FIXED (model NOT A BUG; the missing answer fixed) |
| 14 | Gain M2: stage tag reads "TOO" (LOW cut off) | gainViz.tsx:152 `split(' ')[0]` took the FIRST word of "TOO LOW" when the glass is short | `shortRegionLabel()`: TOO LOW → LOW, QUIET SOURCE → QUIET. Pinned test gainEmulatorPass updated with the owner's words. gainViz.tsx | F6 test; gainEmulatorPass | not seen (shared crash) | FIXED |
| 15 | Patchbay p7: jacks unlock only on the RIGHT answer; the wrong-answer line names a "top jack" that is not there | pagesA.tsx:332/338 (`predicted ? …`), :361 (`onCorrect={() => setPredicted(true)}`), :357 (wrong text); the shared UnderstandingCheck has no "any answer" callback (tuning/components/check.tsx:30) | New lab-local `PredictCheck` (same look and feedback as UnderstandingCheck) whose `onCommit` fires on the first pick, right or wrong; wrong lines now say "The jacks are unlocked: patch the TOP jack…". Guide p7 and its pinned test updated with the owner's words. patchbay/predictCheck.tsx (new), pagesA.tsx, patchbayScreenGuides.ts, test/screenGuide_patchbay_20261031.test.ts | F6 test "Patchbay" | Yes: wrong pick → "The jacks are unlocked…", status "Jacks unlocked", TOP JACK in the dock; TOP JACK → "SPLIT … The normal DID NOT break." | FIXED |
| 16 | Patchbay p7: chip "PREDICT IT (answer below)" but the question is above | pagesA.tsx:311 | "(answer above)" | F6 test | Yes | FIXED |
| 17 | Patchbay: first load froze the browser ~1 minute | Profiled in my tab: the 15.9 MB dev web bundle (index.ts.bundle) loads in ~9 s; Patchbay page 1 is on screen ~4.3 s after DOMContentLoaded vs ~3.5 s for the Meter lab home; no long tasks recorded. PatchbayLabScreen.tsx builds only the page arrays; PagedLab renders the current page | none | — | Measured twice (16 s / 9 s total incl. bundle) | NOT A BUG (preview-only: the dev server's cold first compile of the whole web bundle, shared by every route; not Patchbay code). A phone release build has no such step. |
| 18 | Digital: "FS" = full scale in M1 ("0.75 FS", "% OF FS", AMP "×FS") but = sample rate in M2 and M7 | modAnalog.tsx:763 (`k: 'FS'` = sample rate), modDac.tsx:266 (`k: 'FS', v: '48 kHz'`) | The sample-rate readouts are RATE (the M2 dock key's own name); FS now means only full scale. Guide lines updated (M2, M7); pinned name lists in test/screenGuide_digital_20261031.test.ts updated with the owner's words. modAnalog.tsx, modDac.tsx, digitalScreenGuides.ts | F6 test "Digital" 1 | Yes (390): M2 bezel reads RATE 48 kHz, INPUT 1 kHz, NYQUIST …, keys kept | FIXED |
| 19 | Digital: labels cut at 390 in M1, M2, M4, M8 | M1: modAnalog.tsx:303 badge 131 chars, cut at "(blu…"; M2: :767-769 "14.27 kHz" too wide → key dropped (BezelReadouts D36); M4: modQuant.tsx:472 "−24.6 dBFS"; M8: modDac.tsx:522 "20.83 µs @48k" | M2/M4/M8: number on the value line, unit on the `sub` line (`hzCell()`), full value kept for screen readers (`vA11y`); M1 badge shortened to 97 chars ("ONE SOUND, 3 VIEWS · COLOR = LOUDNESS (blue quiet → red full scale)") | F6 test "Digital" 2, 3 | Yes for M2 keys; M1/M4/M8 not seen | FIXED |
| 20 | Cable Fundamentals: "MODULE 1 / 11" vs "LESSON 1 · 1 OF 12" | CableLabScreen.tsx:169 (tag adds `step + 1 OF CABLE_LESSONS.length`, 12 incl. the what's-left lesson); the strip counts 11 units (:118) | The tag shows the lesson tag only ("LESSON 1", "TESTER"); the strip is the one count. (No new counter added; the strip's own N/N is the owner's sweep, OUT.) CableLabScreen.tsx | F6 test "Cable labs" | Yes: tag reads "LESSON 1", strip "MODULE 1 / 11" | FIXED |
| 21 | Cable Fundamentals: CONTENTS opens as a pull-down (rule: popups, never pulldowns) | kit/LabNavBar.tsx:223 renders LabContents in-tree under the strip (:347 "in-tree (no Modal), under the strip") — the shared strip of every paged lab | none in my files | — | — | SHARED NEED (S1) |
| 22 | Cable Fundamentals L5: guide "three separate jobs" vs heading "THE FOUR DIFFERENT CONNECTIONS" (G3 file) | cableScreenGuides.ts:165 vs lessons/lesson05.tsx:99 (four cards, data/lesson05.ts:29-61) | Guide: "three separate jobs … met in four connections" | F6 test | — | FIXED |
| 23 | Cable Dressing stage 3: the winning pick wears a ✕ | scenes/RouteScene.tsx:706 (`verdict={f.positive ? 'good' : 'bad'}`), data/scenarios.ts:132 (a 0.1 reminder on the tray route) | When the pick is the top-ranked route, its non-positive notes show as ⓘ (RuleFeedback 'info'); a losing pick keeps ✕. RouteScene.tsx | F6 test | not seen | FIXED |
| 24 | Cable Dressing stage 4: "− EASE" makes the number go up | scenes/MechScene.tsx:424-436 (nudge(−0.08) = larger radius = bigger ×dia) | Buttons read "◂ GENTLER" / "TIGHTER ▸" (no − / +). Guide lines and the pinned guide test updated with the owner's words. MechScene.tsx, cableInstallScreenGuides.ts, test/screenGuide_cableinstall_20261031.test.ts | F6 test; screenGuide_cableinstall | not seen | FIXED |
| 25 | Cable Dressing end: "OVERALL 0" before anything is scored | CableInstallLabScreen.tsx:692 (`overallScore({})` = 0, printed) | With no area scored the card reads "KNOWLEDGE PROFILE · NOT SCORED YET" + one plain line. CableInstallLabScreen.tsx | F6 test | not seen | FIXED |
| 26 | Cable Dressing end: guide names a REVIEW RESULTS button that is not there | CableInstallLabScreen.tsx:825 (REVIEW RESULTS only when an area is under 80) vs cableInstallScreenGuides.ts:545/550 | Guide says REVIEW RESULTS appears when an area is under 80, and names NOT SCORED YET | F6 test | — | FIXED |
| 27 | Connector Selection p15: all nine answers are FALSE, and the guide says so | data/practice.ts:162 ("Every card in this set is FALSE by design (the brief's list)", pinned by a test); the page's own goal reads "Bust all 9 myths" | none | — | — | NOT A BUG (by design: a myth-busting deck; the goal chip itself says they are myths). Mixing in TRUE claims is a content change for the owner. |
| 28 | Connector Selection p6: explanations only when every mark is right; a wrong check shows red with no words | pagesB.tsx:101 (`checked && allRight`, by design: retrieval) and :114 (only TRY AGAIN on a miss) | Kept the retrieval design; a failed check now says in words what red means and how many rows to change ("2 rows are red: each is either a real job you left unmarked or an impostor you marked…"). pagesB.tsx | F6 test | not seen | FIXED |
| 29 | Connector Selection p14: unlabeled ⚡ button floats bottom-left | No "⚡" in connectorselect/, kit/, rack/; G6_EqLabHome.md:44 sees the same "app button" over EQ Lab "in the full app": an app-shell element, not this lab | none | — | not seen | SHARED NEED (app shell, report §3 row 8): find the floating ⚡ and label or hide it |
| 30 | Vacuum Tube: Tube Reference rows out of order ("01-09 then 38-40") | TubeReferenceScreen.tsx:171 prints `r.num` (card number); tubeRefs.ts:79-129 lists cards 31-40 (added 2026-08-17) after 1-30, and the page groups by family | `TUBE_REFS` is now the page's order (by family, card order inside); rows and the card header print the position (`tubeListNum`), and the card screen swipes in the same order. Card images still load by `stem`. tubeRefs.ts, TubeReferenceScreen.tsx, TubeCardScreen.tsx | F6 test "Vacuum Tube" | not seen (TubeReference is not a preview route; the full-app route is member-only) | FIXED |
| 31 | Vacuum Tube: "✓ 9 DONE" after paging through | by design: the lab credits a module on opening (OUT list: "a single meaning of done … where a lab credits by design for opening a page") | none | — | — | OUT (owner decision) |
| 32 | Amplifier M7: drawing "SOURCE 80% of clip" vs readout "SOURCE 50%" | mod7RealWorld.tsx:82 (meter = stage LEVEL vs its clip point) vs :173-175 (bezel = fader SETTING) | Both are right; the bezel numbers now carry a "SETTING" unit line so the two numbers name what they are (the drawing already says "of clip"; the guide already called them settings). mod7RealWorld.tsx | F6 test "Amplifier" | not seen | FIXED |
| 33 | Amplifier M5: heading does not match its step count | mod5ClassD.tsx:270 "3 · WHERE THE ENERGY GOES" inside STEP 2 / 2 | Section 3's number dropped (it is part of step 2). mod5ClassD.tsx | F6 test | not seen | FIXED |
| 34 | Calc: "SAME LEVEL IN dBV 1.782 dB" (dB where dBV/dBu is meant; also Mic Output, Limiter Threshold) | calcPanel.tsx:125 formatOutput prints the kind's only unit ('db' → "dB", 'number' → none, calcUnits.ts:84/104) whatever the label names; levels.ts:104/148, micsRf.ts:254-255 (quantity 'number' → no unit), splSafety.ts:966-967/1132/1169-1170 | New `namedOutputUnit()` (calcUnits.ts): a one-unit 'db'/'number' answer whose label names a reference prints it ("1.782 dBV", "−51.74 dBu", "7.958 µF"); value unchanged. Used by formatOutput and outputUnitLabel (workspace, workflow runner, report). calcUnits.ts, calcPanel.tsx; test/screenGuide_calc's import line updated | F6 test "Calculator Lab" | not seen | FIXED |
| 35 | Calc: Compressor Math answers read only "dB" | dynamics.ts:118/237 (OUTPUT LEVEL, SET THRESHOLD TO: meaning db:dbfs-level / db:comp-threshold; the fields' help says dBFS) | Those two answers print dBFS (by meaning, so the pinned labels stay). GAIN REDUCTION etc. stay "dB" (differences). calcUnits.ts | F6 test | not seen | FIXED |
| 36 | Calc workflow: "PRIMARY RESULT 375" with no unit | calcReport.ts:161 (primary = the LAST numeric row of the run: Delay Speaker Setup's buffers-per-second, quantity 'number'); ReportCard.tsx:57 printed the value only | Primary = the first numeric result of the last step (each function lists its answer first), and the card and the shared text print the result's label with it ("BUFFER LATENCY 2.667 ms"). calcReport.ts, ReportCard.tsx | F6 test | not seen (SAVE/SHARE not pressed) | FIXED |
| 37 | Meter LoudnessView (F4 request, Mastering M6 face showed the old TP) | vizMeters.tsx:1446-1456 (TP from simulateLoudness only) | Optional `truePeakDbtp` prop; undefined = the Meter lab unchanged (pinned). Mastering mod6Loudness.tsx passes `teach.tp` through MetersStage (F4 agreed). Root cause looked at: meterEngine.ts:327 invents the loudness clip's sample peak; inside the Meter lab's Loudness module SAMPLE PK / TRUE PK / TP GAP are self-consistent (−5.2 / −4.3 / +0.9, guide-pinned), so it was not changed; it is unrelated to the Waveform "PK 5.5 vs PEAK +0.0" (pre-clip vs stored, row 1). vizMeters.tsx, mastering/modules/mod6Loudness.tsx | F6 test "Meter LoudnessView"; mastering + meter suites 347 pass | not seen | FIXED |
| 38 | Calc: AWG refusal "must be from -3 to 18" vs the title "14 AWG – 4/0" | ampacity.ts:341 `range: [-3, 18]` with no `rangeMsg` → calcUnits.ts:827 prints the raw bounds; same in Voltage Drop powerElec.ts:277 ([-3, 40]) | D53 sentence in gauges: "CONDUCTOR SIZE must be a gauge from 18 AWG up to 4/0. Type 1/0 as 0, … 4/0 as −3. For 250 kcmil and larger, use the kcmil function." (and the Voltage Drop twin). Pinned test patternP16 updated with the owner's words. ampacity.ts, powerElec.ts | F6 test; patternP16 | not seen | FIXED |
| 39 | Calc: Loudspeaker SPL gives no answer and names no missing box | CalcWorkspaceScreen.tsx:434 (one fixed sentence whenever `values` is null; buildValues returns null on the first empty box, calcPanel.tsx:57) | The placeholder names the empty boxes ("Still needed: NUMBER OF SPEAKERS. The gray numbers are examples — type a value into every box."), says when a typed value can't be read, and says on an empty screen that gray numbers are examples. CalcWorkspaceScreen.tsx | F6 test | not seen | FIXED |
| 40 | Calc: "654.5 samples" (FIR Filter Length) | digitalAdv.ts:435/466 `latS = (N − 1) / 2`: a linear-phase FIR's group delay is exactly (N−1)/2 samples; an even N puts the centre between two taps, so a half sample is the physics, not a rounding slip (snapWhole is for counts; this is a delay) | Value kept; when it is not whole a plain row "WHY HALF A SAMPLE" explains it. digitalAdv.ts | F6 test | not seen | NOT A BUG (number); explanation added |
| 41 | Calc: "1.678e7" quantization levels (G3 file) | calcUnits.ts:181 (fmt goes exponential ≥ 1e7); digitalAdv.ts:650 (pinned numeric output) | Numeric output kept; a "THAT IS" row writes it out from 10 million up ("16,777,216 levels (about 16.8 million)"). digitalAdv.ts | F6 test | not seen | FIXED |
| 42 | Calc: answer heading "MV/PA → dBV/PA" reads as megavolts (G3 file) | CalcWorkspaceScreen.tsx:416 (toUpperCase, only dB tokens restored) | mV/Pa and dBV/Pa keep their case. CalcWorkspaceScreen.tsx | F6 test | not seen | FIXED |
| 9 | Signal Chain developer line "update the app to hear it" (non-__DEV__) | SignalChainLabScreen.tsx:585 | Plain sentence: "The chain cannot play sound on this device. …" (the __DEV__ line kept). test/auditR2_A_D_labs_20261023.test.ts pin updated with the owner's words | F6 test; auditR2_A_D | — | FIXED |
| 43 | Silent first step (Signal Chain: WHERE TO START needs ▶ and GR) | chainScreenGuides.ts:48 | One sentence added: "Sound off? ▶ gives the numbers in a note." (the note from row 8). The other F6 labs' first steps need no sound (each WHERE TO START checked). | screenGuide_chain (40-word cap) | — | FIXED |

## SHARED NEEDS

1. **Popups, never pulldowns: CONTENTS (Cable Fundamentals, and every paged lab).** File `src/screens/lab/kit/LabNavBar.tsx`, line 223 (`{contentsOpen ? <LabContents nav={nav} maxHeight={listMax} /> : null}`) and the in-tree styles at :347. Proposed change: render `LabContents` inside the app's centered popup (the Modal shell the confirm dialogs use), with a ✕ and tap-outside to close, Android BACK kept (:153-167); the list itself unchanged. It changes every paged lab's strip at once, so it belongs to the shared-frame owner (S1).
2. **The floating ⚡ button (Connector Selection p14, EQ Lab).** It is not in any lab file (no "⚡" in connectorselect/, kit/, rack/); G6_EqLabHome.md:44 calls it the "app button" over the dock in the full app. Proposed: the app-shell / shared-frame owner finds the component that draws it and either gives it a word label or keeps it off lab screens (report §3 row 8).
3. (Done here at the coordinator's request, no action needed) `vizMeters.tsx` LoudnessView `truePeakDbtp` prop and the pass-through in `mastering/modules/mod6Loudness.tsx` for F4 (row 37).

## Not checked, and why

- **On screen:** the pane reloaded often (other agents' edits; for a while a shared-frame crash "setScreenWork is not a function"), and rack modules lay out only in a FRONT tab (onLayout does not fire in a background tab, so Gain looked blank until fronted). Seen: Meter M1 and M4, Patchbay p7, Gain M8, Digital M2, Cable L1. Not seen: Signal Chain (no preview route; member route not walked), Gain M2/M3, Digital M1/M4/M8, Cable Dressing stages 3/4/end, Connector Selection p6/p14, Tube Reference (not a preview route), Amp M5/M7, and every Calc change (the workspace harness cannot navigate; the full-app route was not walked this round). For the checker round.
- **Left as they are (by design, owner's call, or phase 2):** the Signal Detective overlay (evidence by design); Connector p15's all-FALSE deck; Tube "✓ 9 DONE" (OUT); the strips' own "MODULE n / N" counters (OUT sweep); Cable Dressing stage 1 card titles that hint the answer (check-card pattern, phase 2); the Calc workflow not carrying step 1's AIR TEMPERATURE into step 2 (the runner offers earlier OUTPUTS only; carrying inputs is a runner feature, size M); the SEND → banner following into workspaces that cannot use it (M); Gain M4 STATUS reading HOT on TOO LOW EARLY (the output is genuinely hot; a NOISY status word is a design addition).
- **Glossary term cards (quick win 9):** already reworded by S1 in `src/features/intro/labTermIntroData.ts` (Connector, Cable dressing); not touched here.
- **Phase 2 mechanisms** (per-option reasons, recap lines, needs-sound tags, bezel captions): untouched, as the brief says.


---

# Phase 2 (2026-11-14): the shared mechanisms in F6's labs

**Summary:** 37 mechanism rows: **30 done · 6 not applicable · 1 shared need** (per-option reasons for the shared `CheckQuestion`). Tests: `test/labFixes_20261114_F6.test.ts` 51 pass (13 new phase-2 tests); the touched suites (meter, chain, gain, patchbay, digital, cable, cable dressing, amp, tube, connector, S1–S3, labEndKit, screenGuide) pass, 0 fail. No `npx tsc` (per the phase-2 brief); every changed .ts/.tsx parses (TypeScript transpile check, 0 errors), and the web bundle returns 200. Pinned tests changed on purpose with the owner's words: screenGuide_cableinstall (hold + stage-1 names), screenGuide_tube (hold, ABOUT chip), screenGuide_patchbay and screenGuide_cable (pageDetail), screenGuide_amp (IDLE caption).

| Lab | Mechanism | Done? | file:line | Test | Seen on screen |
|---|---|---|---|---|---|
| Amplifier | Check card: a reason per wrong option (26 checks, 74 reasons); first miss = reason, explanation only from the second different miss | Yes | features/amp/ampCheckWhy.ts (new); amp/kit.tsx CheckCard (`missed`, `ampWrongLine`); AmpModuleScreen.tsx requirement line | Phase 2 "check cards" 1–2 | Yes: M1, a wrong pick shows its reason only; a second wrong pick shows reason + explanation |
| Amplifier | End rows name what is missing (checks left / MARK COMPLETE / final) | Yes | features/amp/ampEnd.ts `ampModuleLeft` | "end screens" 1 | not seen |
| Amplifier | Bezel captions (SUPPLY, HEAT, EFFIC., LOAD, IDLE, CONDUCT., DISTORT., AT PEAK/TROUGH) | Yes | AmpRig.tsx rigStatusBezel; mod3Bias, mod4Classes, mod5ClassD | "captions" | not seen (captions show on a device's first visit; this pane had visited) |
| Amplifier | End guide start, state-neutral | Yes | ampScreenGuides.ts AMP_END_GUIDE | "end screens" 4 | — |
| Amplifier | Silent learner / FINISH after pass / accuracy chip | n/a | no sound; ends on its own end screen; chip already removed (concept lab) | — | — |
| Meter | Bezel captions (RMS, CREST, DC, CLIP, PK HOLD, OVERS, NDL MAX, INTEGRATED, LRA, SAMPLE PK, TRUE PK, TP GAP, TILT, RT·125, RT·4k, RIDGE, CORR, MONO FOLD …) | Yes | meter/modules/modMeterA/B/C.tsx | "captions" | not seen |
| Meter | End: the shared rule once (`howItCounts`); start state-neutral | Yes | MeterLabHomeScreen.tsx, MeterModuleScreen.tsx; meterScreenGuides.ts | "end screens" 3–4 | — |
| Meter | Check card (CheckQuestion) | SHARED NEED 1 | foundations/bits.tsx (not mine) | — | — |
| Meter | Silent learner | n/a | no sound in the lab (visual only, ListeningSoonCard) | — | — |
| Signal Chain | Sound-off line (its own words) | Yes | SignalChainLabScreen.tsx stage `soundOffLine` | "silent" 1 | not seen (no preview route) |
| Signal Chain | NEEDS SOUND on DELAY → REVERB + a can't-listen line | Yes | SignalChainLabScreen.tsx scenario lesson | "silent" 1 | not seen |
| Signal Chain | Bezel captions (SRC, CHAIN, SCENE, OUT) | Yes | SignalChainLabScreen.tsx bezel | "captions" | not seen |
| Signal Chain | Stored GR while silent | n/a here | the GR lives on the drawing, not the bezel; the phase-1 note under the rack gives the numbers | — | — |
| Signal Chain | FINISH after pass | n/a | ReviewLabEnd already ends the lab (no CHECK tab) | — | — |
| Gain | End: the one pass-only module gets its own line; the rule for the rest said once | Yes | GainModuleScreen.tsx, GainLabHomeScreen.tsx; gain/modules/registry.ts `GAIN_TROUBLESHOOT_LEFT` | "end screens" 3 | not seen |
| Gain | Bezel captions (HEADROOM, NOISE); start state-neutral | Yes | modLearn.tsx, modExplore.tsx; gainScreenGuides.ts | "captions", "end screens" 4 | — |
| Gain | Accuracy chip | kept | Gain is one of the owner's named measuring labs (D37) | — | — |
| Digital | NEEDS SOUND on HEAR THE FOLD + a can't-listen line (the two tones, and the red curve) | Yes | digital/modules/modAnalog.tsx ALIAS tray | "silent" 2 | not seen |
| Digital | Bezel captions (PERIOD, RMS, NYQUIST, READS AS, RATE, TH. SNR, LEVELS, HEX, SNR, HEADROOM, MISSED, LAYERS, PEAK DEV) | Yes | modAnalog/modQuant/modDac/modChain.tsx (ReadoutGrid's item type takes `caption` too, digital/bits.tsx) | "captions" | not seen |
| Digital | End: rule once; start state-neutral | Yes | DigitalLabHomeScreen.tsx, DigitalModuleScreen.tsx; digitalScreenGuides.ts | "end screens" 3–4 | — |
| Digital | Check card (CheckQuestion) | SHARED NEED 1 | — | — | — |
| Patchbay | Check card | already | every UnderstandingCheck has a `wrong` line per option; page 7's PredictCheck (phase 1) too | — | — |
| Patchbay | End rows name what is missing (20 pages, in the goal chips' words) + the rule once | Yes | PatchbayLabScreen.tsx PAGE_DETAIL, `handsOnDetail`; the end guide's seeing line | "end screens" 2 | not seen |
| Patchbay | Bezel captions (NORMAL, DEST HEARS); start state-neutral | Yes | rackLayout.tsx; patchbayScreenGuides.ts | "captions" | — |
| Connector Selection | Check card | already | both UnderstandingChecks have a per-option `wrong`; the build pages' FIT·SIGNAL·CONSTRUCTION·SAFETY rows and the myth corrections are per option | — | — |
| Connector Selection | End rows name what is missing (16 pages) + rule once; start state-neutral | Yes | ConnectorSelectLabScreen.tsx; connectorSelectScreenGuides.ts | "end screens" 2, 4 | not seen |
| Cable Fundamentals | Check card: lesson 1's pair quiz says what THE PICKED category is | Yes | cable/lessons/lesson01.tsx `wrongPickLine` | "check cards" 3 | not seen |
| Cable Fundamentals | Lessons 8 and 11: one `hint` per decision step (S2 allows a hint for options without their own reason); lesson 12 uses CheckQuestion | partly | data/lesson08.ts, data/lesson11.ts | — | SHARED NEED 1 covers lesson 12 |
| Cable Dressing | Stage 1 names and captions no longer give the answer before the pick (letter + a plain look; nickname and judging caption after) | Yes | cableinstall/scenes/WhyScene.tsx `blind`; guide lines | "check cards" 4 | not seen |
| Cable Dressing | Guide waits for the intro drawing (S1 SN5) | Yes | CableInstallLabScreen.tsx `introAnimating` (1.6 s; Reduce Motion: no wait) | "arrival" | not seen |
| Cable Dressing | Every option already scored with its own reason (stages 3, 9 …) | already | — | — | — |
| Vacuum Tube | Guide never opens over the card's load error (S1 SN5) | Yes | TubeCardScreen.tsx `hold={failed}` | "arrival" | not seen |
| Vacuum Tube | ABOUT chip with only the cards' own note (D37) | Yes | TubeReferenceScreen.tsx, TubeCardScreen.tsx | "accuracy" | not seen |
| Vacuum Tube | Bezel captions (PLATE I, EMISSION); end rule once; start state-neutral | Yes | VacuumTubeLabScreen.tsx; tubeScreenGuides.ts | "captions", "end screens" | — |
| Vacuum Tube | Check card (CheckQuestion) | SHARED NEED 1 | — | — | — |
| Calculator Lab | (no sound, no checks, no lab end screen) | n/a | the ✓ VERIFIED calc chip stays (D37) | — | — |
| All F6 labs | Arrival order: any other hold needed? | checked | no other F6 screen shows its own popup or an animation under the intro card | — | — |

## Phase 2b: `why` on every CHECK YOURSELF question (after F5 landed `CheckSpec.why`)

The real count was **117 questions, not 48** (48 was the number of `<CheckQuestion>` tags; several render whole banks): Meter 46 (incl. the 28 Signal Detective questions), Digital 15, Cable Fundamentals 32 (lessons 2, 3, 6, 7 and the 17-question final), Cable Dressing 15 (its quiz bank), Gain 4, Tube 2, Signal Chain 3. **All 117 now carry one reason per wrong option (about 330 lines)**: each says why THAT option is not it, or points at the control or picture that shows it, never quotes the answer, at most 30 words. The local item types that mirror CheckSpec (clockingCard.ts, cable lesson07.ts `L07Check`, lesson12.ts `FinalCheckItem`) gained `why?`. Not touched: Cable Dressing's M11 fire-space flow (its own card in FireScene, not CheckQuestion).

| Mechanism | Done? | Files | Test | Seen |
|---|---|---|---|---|
| `why` per wrong option, 117 questions | Yes | meter/modules/modMeterA/B/C.tsx; gain/modules/modLearn.tsx; digital/modules/clockingCard.ts, modAnalog, modChain, modQuant, modDac; tube/VacuumTubeLabScreen.tsx; SignalChainLabScreen.tsx; cable/data/lesson02, 03, 06, 07, 12.ts; cableinstall/data/scenarios.ts | F6 test "CheckSpec.why" (parses every question from source: every wrong option covered, none on the right one, ≤ 30 words, never quoting the answer, count = 117); the touched suites 811 pass | not seen |
| Balanced option lengths where the right answer is the longest | **Done in Phase 2c below** | — | — | — |

**Second miss:** F5's `checkWrongText` (src/screens/lab/foundations/checkWords.ts) shows `why[picked]` (else `wrongHint`) on EVERY wrong pick. When I read it, it did **not** add `reveal` after a second different miss; the coordinator says F5 is now adding that to CheckQuestion itself. I did not edit F5's files.

## Phase 2c (2026-11-14): balanced options, the fire-space flow card, the recap + next-lab cards

### 1. Balanced option lengths (owner-approved: row 4, pattern 4)

Rule: in every CHECK YOURSELF question, the right answer is never more than **1.4×** the next-longest option. That way a novice cannot pick it just because it is the longest.

- **Rewritten:** about 64 options across 62 questions, plus 2 Amplifier checks.
  - Long right answers were tightened.
  - Short wrong answers were made fuller, for example the Signal Detective distractors 'Clipping at the input', 'Mains hum on the line', 'DC offset in the signal'.
  - Every right answer is still right, and every `why` reason still matches its option.
- **Files:**
  - meter/modules/modMeterA/B/C.tsx
  - digital/modules/modAnalog, modChain, modQuant, modDac
  - SignalChainLabScreen.tsx
  - cable/data/lesson02, 03, 06, 12.ts
  - cableinstall/data/scenarios.ts (the quiz bank and CI_FIRE_SPACES)
  - src/features/amp/ampContent.ts
- **Left unchanged (owner-approved copy):** the Patchbay checks. Where the approval is recorded:
  - src/screens/lab/patchbay/PatchbayLabScreen.tsx:13 reads "ALL COPY RATIFIED by the owner".
  - docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md:3 reads "RATIFIED BY THE OWNER 2026-09-10 — approved as written."
- **Already balanced:** Connector Selection.
- **Test:** F6 test "Phase 2 · balanced options". It parses 17 source files plus the Amp checks (n ≥ 117), decodes `\u` escapes and asserts ≤ 1.4× on every question.
- **Pins updated:**
  - test/wiringFix_r3_mastdigmeter_20261021.test.ts now pins 'Spikes at power-line multiples'. It still asserts that no option says "60 Hz".
  - test/screenGuide_cableinstall_20261031.test.ts now pins the fire trap option 'Yes — the label on the tube says fire rated'.

### 2. Cable Dressing fire-space flow card: reasons per wrong option, the answer after a second miss

This card is FireScene's own, not CheckQuestion.

- The 5 sleeve walk-through questions (`FLOW`, scenes/FireScene.tsx) and the 3 space questions (`CI_FIRE_SPACES`, data/scenarios.ts) now carry `why` on every wrong option, and their options are balanced.
- Behaviour:
  - The **first pick is still the scored one**, so scoring is unchanged.
  - A wrong pick shows its own reason plus "Try another answer."
  - From the second try the explanation (`reveal`) is added.
  - A right pick shows the explanation.
  - Options already tried are disabled.
- The guide's control line now reads: "The first pick is scored; a wrong pick shows its reason, and you can try again."
- Test: F6 test "Cable Dressing fire-space flow card". It checks all 8 questions (a reason on each wrong option, none on the right one, balanced) and pins the verdict logic.

### 3. The recap and next-lab card (S4's labEndContent.ts): **wired**

- **`labId` on the shared `<LabEndScreen>`**:
  - Digital `af_digital_audio`: DigitalLabHomeScreen, DigitalModuleScreen
  - Meter `af_visual_analysis`: MeterLabHomeScreen, MeterModuleScreen
  - Gain `af_gain_staging`: GainLabHomeScreen, GainModuleScreen
  - Tube `tube`: VacuumTubeLabScreen
  - Amp `amp`: AmpLabHomeScreen, AmpModuleScreen
  - In AmpModuleScreen, `labId` sits after `labTitle`, because test/labEndScreen.test.ts pins `labTitle` as the first prop.
- **The two cable labs with their own end screen:**
  - New src/screens/lab/cable/labEndExtras.tsx `LabRecapNext({ labId, complete })` reads `labEndContentFor(labId)`.
  - It draws the same blocks, look and words as kit/LabEndScreen.tsx: WHAT YOU LEARNED / WHAT THIS LAB COVERS, and UP NEXT / AFTER THIS LAB.
  - The next card leaves through `claimLabLeave()` and navigates with `runSoon`.
  - Placed in:
    - Cable Fundamentals: cable/lessons/lesson12.tsx, `<LabRecapNext labId="af_cables" complete={completion.complete} />` after the complete / what's-left block.
    - Cable Dressing: cableinstall/CableInstallLabScreen.tsx CompleteStage, `<LabRecapNext labId="af_cable_install" complete={done} />` after the mastery profile.
- **For S4:** done. S4 owns its test and can flip these from pending.
- Test: F6 test "recap + next-lab card", which pins all 9 `labId`s and both LabRecapNext placements.

| Mechanism | Done? | Test | Seen |
|---|---|---|---|
| Balanced options (≤ 1.4×) | Yes (Patchbay left as written: owner-ratified) | F6 "balanced options" | not seen |
| Fire-space flow reasons + second-miss answer | Yes | F6 "fire-space flow card" | not seen |
| labId on 9 end screens | Yes | F6 "recap + next-lab card" | not seen |
| LabRecapNext in both cable labs | Yes | F6 "recap + next-lab card" | not seen |

**Tests:**
- F6 test file: 58 pass.
- Cable, lab-end, S4, Meter, Digital, Gain, Tube and Amp suites: 3,351 pass after the one pin update.
- No tsc was run (as instructed).

**Full suite (2026-11-14):** 22,610 tests, 22,601 pass, 9 fail.

Two of the nine were mine, both from the same cause:
- test/factAuditR1_C_other_20261022.test.ts:109
- test/wiringFix_r8_text_20261021.test.ts:76

Both pin the fact-audited waterfall wording, F013922 / R7-MTR-01: 'TIME — each ridge nearer the front is the spectrum a moment later'. My balancing had shortened it, so I did **not** change the pin. Instead I put the verified wording back in modMeterB.tsx `CHECK_Z_AXIS` and balanced the question by making the three wrong options fuller:
- 'Phase — how far each frequency is shifted in time'
- 'A second frequency axis, for the harmonics above it'
- 'Stereo width — how far the sound spreads left to right'

The ratio is now 65 / 54 = 1.2, and the reasons still fit. Both tests pass again: the F6, Meter, fact-audit and r3/r8 suites give 797 pass, 0 fail.

The other 7 are not F6's files:
- R009992 (src/features/soundsystems/faults.ts)
- 5 tests in test/batch4_G4-learnB-rigs_20261105.test.ts (Sound Systems rigs)
- the G6 ratchet (test/patternP12_20261002.test.ts) on src/features/lab/screenGuide/ScreenGuide.tsx `[carrierId]`, the shared screen-guide kit

## Phase 2 SHARED NEEDS

1. **(LANDED by F5, 2b above)** Per-option reasons for the shared `CheckQuestion` (src/screens/lab/foundations/bits.tsx:31 `CheckSpec`, :41 `CheckQuestion`). My original note follows; the first count it gives (48) was low, the real count is 117. Proposed, matching S2's `UnderstandingQuestion`:
   ```ts
   export type CheckSpec = { question: string; options: string[]; correctIdx: number; reveal: string; wrongHint?: string;
     /** NEW: a wrong option's own reason, by ORIGINAL index (never correctIdx). */ why?: Readonly<Record<number, string>> };
   // in CheckQuestion: keep a Set of distinct wrong picks; on a wrong pick show
   //   `NOT QUITE — TRY ANOTHER. ${spec.why?.[picked] ?? spec.wrongHint ?? 'Look back at what the lab showed you, then try another answer.'}`
   //   and from the 2nd distinct wrong pick append ` ${spec.reveal}`.
   ```
   Once it lands I can write the `why` lines for my 48 questions, as I did for the Amp lab.
2. **CONTENTS as a popup** (from phase 1; now with S2, the kit owner): src/screens/lab/kit/LabNavBar.tsx:223.

## Checker C3 fixes (2026-11-14, CHECK_C3_REPORT.md F-2, F-3, F-4, O-1)

### F-2: bezel captions cut with "…"

I measured every caption in F6's rack labs in the 8142 preview, at 320 and at 390. The test was the caption's scrollWidth against its cell width.

At 320, 30 captions were cut, not just the 6 C3 found at 390. The bezel draws a caption on one line (`fitValue(10)` in the shared kit, rack/BezelReadouts.tsx), so the fix was shorter words. I did not edit the kit.

**Renamed:**

| Lab | Old caption | New caption |
|---|---|---|
| Meter | whole program | overall |
| Meter | loud-soft span | range |
| Meter | top sample | highest |
| Meter | top in between | real top |
| Meter | overshoot | extra |
| Meter | times clipped | clips |
| Meter | average level | average |
| Meter | peak vs avg | spiky? |
| Meter | off-center | shift |
| Meter | over the top? | clipped? |
| Meter | highest yet | max yet |
| Meter | high vs low | top vs low |
| Meter | low-end fade | bass fade |
| Meter | rings longest | rings most |
| Meter | level in mono | mono level |
| Digital | samples a sec | a second |
| Digital | highest kept | top freq |
| Digital | what you get | heard as |
| Digital | signal vs hiss | over hiss |
| Digital | room to clip | until clip |
| Digital | how many steps | step count |
| Gain | room to clip | until clip |
| Amp | power drawn | power in |
| Amp | wasted as heat | wasted |
| Amp | useful share | useful % |
| Amp | resting draw | at rest |
| Amp | clean or not | clean? |
| Signal Chain | test sound | sound in |

**Measured after the change, all fitting at 320:**
- Meter: waveform, peak, VU, loudness, spectrum, waterfall, phase
- Digital: sampling, quant, ADC
- Amp: what, bias, classes, class D

The three C3 pages were also measured at 390, all fitting:
- Meter loudness: overall 60/60, range 37/37
- Meter peak: clips 36/36
- Digital quant: step count 67/67

**Already fitting at 320:**
- Tube EMISSION
- Patchbay ('inside link' 55/55, 'input gets' 66/66)
- Digital DAC and errors pages
- VU 'needle’s top'

**Not opened in the preview:** Signal Chain, which has no preview route. Its 'sound in' is 37 px, chosen to fit the narrowest four-cell bezel. Also Tube PLATE I and Digital ISP MISSED, which sit on later stages; those bezels have 2 to 3 wide cells.

**Pin updated:** test/screenGuide_amp_20261031.test.ts now expects 'at rest'.

### F-3: Conductor Ampacity

- `rangeMsg` now reads "CONDUCTOR SIZE must be a gauge from 14 AWG up to 4/0." (src/screens/lab/calc/workspaces/ampacity.ts).
- The input range stays [-3, 18], so 18 and 16 still get their own explanation: "…This calculator covers 14 AWG and larger."
- Table 310.16 is unchanged. It is verified against NEC 2023 copper (14 AWG 15/20/25 A … 4/0 195/230/260 A; 18 and 16 AWG in the 90 °C column only).
- The test calls the real `domainMsg`: 20 gives the 14 AWG sentence, while 18 and 16 pass through to `awgRefusal`.

### F-4: FIR Filter Length

"centre" is now "center" in both WHY HALF A SAMPLE lines (src/screens/lab/calc/workspaces/digitalAdv.ts). The other "centre"s in F6 files are code comments only.

### O-1: Peak Meter CREST

- The cause: the picture computed CREST from a 2048-sample render, the bezel from the 1024-sample one.
- The fix: vizMeters.tsx PeakMeterView now reads the same `renderSignal(sig)` × gain as the bezel.
- In the preview at 390, the picture reads "CREST 16.1 dB" and the bezel reads "16.1dB". Before, it was 15.9 against 16.1.
- Modules 1 and 3–9 checked for the same split:
  - Waveform: already one source (`stored`).
  - Loudness picture and bezel: same `simulateLoudness(signal)`.
  - Phase: same `stereoPair(width, phase)` at n = 512.
  - VU, spectrum, spectrogram and waterfall: the picture prints no second number.

**Tests:** the F6 file has 63 tests, all passing. With the Meter, Digital, Amp, Gain, chain, calc, fact-audit, wiring-fix and US-spelling suites, 3,166 ran and the only failure was my own 10-character caption check. I widened that rule to 12 characters, the longest caption that measured inside its cell ('needle’s top'), and the F6 file then passed 63/63. Every edited file parse-checks. 8142 returned 200. No tsc was run.

The calculator fixes were checked with the real `domainMsg` and the source, not opened on screen.
