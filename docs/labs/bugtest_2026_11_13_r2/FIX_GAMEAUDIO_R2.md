# FIX R2-GA: Game Audio Lab, round-2 bug test fixes (2026-11-13)

**Fixer:** R2-GA
**Scope:** `src\screens\lab\gameaudio\**` and the Game Audio tests only. I did not touch `src\screens\lab\rack\*`, the kit or Stage Plot. I ran no git, no eas, no servers and wrote no browser storage. Sound stayed OFF the whole time.

**Tests:** `node --test --test-timeout=120000 test/gameAudio*.test.ts test/labRegistration_20261113.test.ts test/screenGuide_gameaudio_20261112.test.ts`
- Result: **792 tests, 792 pass, 0 fail.**
- `npx tsc --noEmit -p .` shows no errors in any Game Audio file.

**New test file:** `test\gameAudioBugtestR2_20261113.test.ts` has 38 tests. Every source read normalizes CRLF.

**Browser check:**
- I used my own tab (tab-54) at `http://localhost:8142/#labpreview/GameAudioLab`, at 390×844, 375×667 and 320×700. I closed it at the end and reset the viewport.
- I clicked elements by script (pointer events), with the tab in front.
- For a while the preview was blank: the other fixer's half-saved `rack/BezelReadouts.tsx` threw `SUB_FS is not defined`. A reload fixed it once their save landed.

## FIXED

| ID | What changed | Files | What I saw on screen |
|---|---|---|---|
| **R2-GA1-01** (S2), pages 6, 7, 8, 10 | After START THE FAULT, the faulty setting shows **the value it had before START**, with no "?" and no LOCKED. Its chooser still opens: picking the value it shows does nothing, and picking the other value is the learner's own change. The real value appears only after the symptom happens once more. This is one shared hook, `usePlantedFault` (chbBits), backed by the pure `gaPlantedView` / `gaPlantedPick` (bitsLogic). `TrayLocked` is removed. The "?"/locked sentences are gone from the guides for p6, p7 and p10. The p8 and p10 "common mistake" notes now sit **below** the card. | p06Pipeline, p07Instances, p08GameSyncs, p10Loops, chbBits, bitsLogic, guides p06/p07/p10 | **p6:** after START, DOOR FILE reads FOUND (readout and key), the chooser opens on ● door_open.wav, and the chain card says "door asks for door_open.wav". Re-picking door_open.wav keeps the card active. After OPEN DOOR: MISSING, the FAULT line appears and the chain names v2. Fix → CLOSE DOOR → ✓ FIXED. **p7:** after START, the row reads "✓ STOP ITS LOOP"; after the orphan it reads "✓ LEAVE IT PLAYING". **p8:** SCOPE reads LOCAL and opens; after STEP: GUIDE it reads GLOBAL and "COPIED FROM YOU" appears; fix → ✓ FIXED. The mistake note sits after the card. **p10:** the row reads ✓ ONCE until the beds pile up (BEDS 5), then ✓ ON EVERY UPDATE. |
| **R2-GA1-11** (S3) | DOOR FILE's door_open_v2.wav blurb says "No file with that name is in the build" only after the log has named a missing file on this visit. | p06Pipeline | Before the symptom the blurb is neutral; after it, the full blurb shows. |
| **R2-GA1-02** (S2) | The guide's "changes" line now says what is always true: left and right follow the picture, so FACING no longer changes GEN PAN. It says "nearer the center" for 0° only. The lesson says "At 0°, …". The check's wrong-answer feedback no longer claims "less far to the side". | guides/p04, p04Games | At FACING 90° the readout goes from L 25% to R 55%. The text no longer contradicts it. |
| **R2-GA1-03 / -10** (S2) | `recentTakes` keeps the last 8 choices *among several takes*. One-take entries (door, rattle) are still recorded but are dropped first once there are more than 16. | model/gaModel | p9: after 16 STEPs and 4 door presses, the strip's label lists the same 8 takes before and after the doors. |
| **R2-GA1-05** (S3) | p10's FIXED needs proof: a step with the scene running *after* the rule was corrected, with no copy stacked. The card stays active until then. Hint 3 asks for the step. | p10Loops | After ■ STOP: no FIXED, BEDS 0, card active. After SCENE on: BEDS 2, still active. After STEP: ✓ FIXED. |
| **R2-GA2-01** (S2), p19 fault 5 | (a) ADD GENERATOR 2 no longer takes over an orphan loop. While its old loop plays, the model refuses to place it and logs a REFUSED line saying why. A newly placed generator starts OFF. (b) Fault 5 counts only after **the removal is tested again**: the bench counts a clean removal made after the symptom, with the rule correct (`proved`). ■ STOP alone keeps it active. Hint 3 and guide p19 updated (no "must"). | model/gaModel, data/gaFaults, guides/p19 | After FIX REMOVAL → STOP ITS LOOP, ADD shows the line "GENERATOR 2 is not placed again: its old loop, instance i151, still plays with no owner. ■ STOP silences it; …" and FIXED stays 0. After ■ STOP: FAULTS 1, FIXED 0. After ADD (comes in OFF), on, REMOVE: FAULTS 0, FIXED 1. p7 still reaches ✓ FIXED by its hint path. |
| **R2-GA2-04** (S2) | New model fact `stingerOnLine`, counted only for a stinger that waited for a beat, bar or phrase. p14's goal uses it. | model/gaModel, p14Music | CHANGE AT ▸ NOW + STINGER: "STINGER played immediately"; the goal stays ○. |
| **R2-GA2-12** (S3) | The strip's spoken label reads "No layer or mood change is waiting." It no longer says "Nothing is waiting" while a stinger waits. | scene/hud/bModel | test |
| **R2-GA2-05** (S3) | The p15 row that reads REFUSED no longer draws the old cut's cross on top of its words. | scene/hud/bLines | test (source) |
| **R2-GA2-06** (S3) | p17 check: the question, the explanation and the line feedback now say both voices are protected, matching "HELD: 2 PROTECTED". | p17Budgets | test |
| **R2-GA2-08** (S3) | A narrow (compact) orphan slot drops its priority number, so its name stays whole. The red rim and NO OWNER still mark it. | scene/hud/cVoices | p19 fault 5 at 390: slot "HUM 2" was 24 px wide in a 25 px box (cut); it is now 37/37 and whole. |
| **R2-GA2-09** (S3) | p21 is true to the code: "Each sound here is built once in the app, then played as a fixed file" (the AI topic). The reading section says no sound is procedural: each is built once, before it first plays, and does not follow the game. | p21Today | test |
| **R2-GA2-10** (S3) | On a stage narrower than 360, the tool header reads "SIMPLIFIED" alone. The spoken label keeps the whole idea. | scene/hud/cToolsStage | 320: "SIMPLIFIED" is whole (scrollWidth = clientWidth). |
| **R2-GA2-11** (S3) | The wall strip title reads "IF GEN 1  PLAYED" (two spaces). | scene/hud/bWall | test (source) |
| **R2-GA2-13 (b)** (S3) | The DOOR label tries four places and takes the first that is clear of YOU and the GUIDE and of the names already placed: above the doorway on the courtyard side, below it, then the same two on the workshop side. | scene/GaScene | 320, p22, GO: GRAVEL: DOOR CLOSED moved under the doorway on the workshop side, clear of YOU, CRATE and GENERATOR 1. My first two tries collided with CRATE, then with GENERATOR 1, and were fixed. 390, page open: unchanged, above the doorway. |
| **R2-GA2-14 a, b** (S3) | (a) The chain reads "Computed output: zero level", not "level zero level". (b) A one-second row reads "1 second". | scene/hud/aModel, data/gaBudget | test |
| **R2-GA1-06** (S3) | p4's "Listen from the overhead camera" counts only a choice made in the LISTENER tray. | p04Games | STRATEGY: the goal stays ○. LISTENER ▸ OVERHEAD CAMERA: it latches. |
| **R2-GA1-07** (S3) | GEN PAN reads "—" while generator 1 is not played (off, or VIRTUAL), as p11 does. | p04Games, guides/p04 | Page open: "—". OPEN WORLD: "—". Generator on: L 25%; camera: R 55%. |
| **R2-GA1-12 / -13** (S3) | RHYTHM: "… PLAYING reads 1 when it lands. VOICES leaves music out." RACING: "The generator starts at high speed: its rings crowd close. …" (no "then … faster"). Both lines are within 110 characters. | data/gaGenres, guides/p04 | I read both lines in the tray. |
| **R2-GA1-15** (S3), credit hardening | GameAudioLabScreen passes `optionalPage={noPageOptional}` (always false). PagedLab then checks `every(i => completed.includes(i))` over all 22 indexes instead of counting entries. Nothing else changes: the END screen marks a page optional only when the function returns true. | GameAudioLabScreen | test |
| **B-S3-02** (S3) | "Door · door_open.wav", no longer "Door · door · door_open.wav". | model/gaModel | Log: "Door · door_close.wav → EFFECTS bus". |
| **B-S3-03** (S3) | A late layer now says "…, 1 s later (its voice is held from now)". This explains both the line's timestamp and VOICES counting it at once. | model/gaModel | test |
| **B-S3-05** (S3) | A p4 GAMES pick restarts the scene but keeps the page's log clock (`enterPage` with `keepClock`). | model/gaModel, p04Games | test |
| Lead's follow-up (frame now drops a key that does not fit) | `gaFitReadouts` now passes `kNarrow` to the frame at widths of 360 and up; below 360 the short key still replaces the full one. Added PLAYING → PLAY and SOUND → SND. | bitsLogic, GaLab | **320, p10:** ZONE / BEDS / **PLAY** / VOICES / **SND**. ZONE is dropped beside the wide value COURTYARD; that is the existing house rule. **375, p9:** **VARY** / **TAKE** / PLAYING / VOICES are all shown. |

**Round-1 tests I updated** because the behaviour changed on purpose. Each changed line says why. Files:
- gameAudioChAFamilies
- gameAudioChAGenres (it also had a stray backspace character in a regex, now fixed)
- gameAudioChB
- gameAudioChC
- gameAudioChD
- gameAudioChETools
- gameAudioFixGA1_20261113
- gameAudioModel

## HELD (and why)

- **B-S3-08, YOU walks onto the fountain** (S3): changes the scene's design. I built a stop at the basin and reverted it. It broke the round-1 guarantee W1 F01 ("from anywhere in the courtyard, STEP reaches VIRTUAL"): the basin's edge is only 0.04 m from the top-edge walk line, so walking west along y = 0.9 is blocked. A fix means moving the fountain, or accepting that the figure overlaps the rim. The owner should decide.
- **R2-GA1-16, the learner's ■ STOP logged as GAME** (S3): round 1 kept ■ STOP as a GAME line on purpose (pinned test "■ STOP is unchanged: a GAME line"). Changing the line's kind would also change what six page log filters show (p3, p8, p13, p14, …). This is a design call, not small.
- **B-S3-15, the 50 px empty band in the p7 tray**: the empty `flexGrow:1` child with `margin-top: -8` belongs to the shared rack tray frame, six levels above my TrayBox. It is the shared frame's.
- **B-S3-18 (slider keyboard), R2-GA1-04 (dock keys < 44), R2-GA1-09 ("OPEN D…"), R2-GA2-02 (dock values "…"), R2-GA2-03 / B-16 ("SURFA…"), R2-GA2-13 (a) (tray covers the readouts at 320)**: shared frame, owned by the other fixer.
- **R2-GA2-07, FIX opens on the active fault's setting**: a design question, as the tester said.
- **R2-GA2-14 (c), "Hide them to review"**: the text is in `kit\LabEndScreen.tsx`, which all labs share.
- **R2-GA1-14, native `confirm()` for the guest reminder**: held as the brief asks (`lib\confirm.ts`, preview host).
- **R2-GA1-08, p11 YOU / BEHIND YOU pile-up in a corner at 320** (S3): needs a new placement strategy for corner labels and the token near the edge. Not small.
- **Partly-fixed round-1 items left as they are:**
  - B-S3-04: the MIX tag is now documented.
  - B-S3-06: "in 0.3 s" is the model's spread; voices are held at once, as B-S3-03's words now say.
  - B-S3-13: the TV and soundbar drawings are a drawing decision.
  - B-S3-14: the bird has no strip row.
  - B-S3-16: the p1 guide step wording.

## Notes for the lead

- Page lesson word counts barely change: p4 gains "At 0°,". The p8 and p10 notes only moved.
- The concealment (R2-GA1-01) deliberately shows the pre-START value. The guide's general line ("Nothing on the screen names it until you have made the problem happen") covers it. The checker follow-up below makes that value say where it is true.

## Checker follow-up (after CHECK_GAMEAUDIO_R2.md)

**Tests:** 807 tests, 807 pass, 0 fail (same command as above). `tsc --noEmit` shows no errors in Game Audio files. The new file now holds 53 tests.
**Browser:** checked in my own tab (tab-60) at 390×844 and 320×700, sound off. I confirmed the module number before each reading, then reset the viewport and closed the tab.

| Item | What changed | Files | Proof |
|---|---|---|---|
| **Test gaps M03, M04, M07** | Behaviour tests on the model plus the pure rule: on p6 and p8, the shown value after START equals the value before START, and it changes only after the symptom. Wiring tests pin `const shownMissing = plant.shown;`, `plant.start(missing); setMissing(true);`, `const shownGlobal = plant.shown;`, and each page's `plant.start(<current value>)` before planting (p7, p8, p10 too). | test file | Each regression the checker made now fails a test. |
| **M19, M25, M52** | M19: `benchAdvance` is driven directly with a `cleanRemove` while the rule is still wrong; it proves nothing (and with the rule right, it proves). M25: pins the orphan slot dropping its priority. M52: pins p10's hint 3 asking for a step. | test file | — |
| **C-1, proof must be fresh** | New pure rule `gaProofStep` (bitsLogic) and hook `useFreshProof` (chbBits): a new symptom clears the proof, and a proof counts only while the repair is in. p6, p7, p8 and p10 judge FIXED by it. In `gaFaults.benchAdvance`, a new orphan resets `proved` to 0. | bitsLogic, chbBits, p06, p07, p08, p10, data/gaFaults | **Seen, p7 at 390:** round 1 ✓ FIXED. Round 2 (LEAVE IT PLAYING → orphan → STOP ITS LOOP → ■ STOP): **not FIXED**. Then ADD, on, REMOVE: ✓ FIXED. Pure test of the rule; model test of a second round of fault 5 (still open after ■ STOP, fixed only after the re-test). |
| **C-2, notes** | The p8 and p10 "common mistake" notes render only while no fault is hiding (`!unnamed`): shown before START, hidden from START until the symptom, shown again afterward. | p08, p10 | **Seen, p10:** note shown before START; hidden after START; shown again after the beds stacked. |
| **C-3, refused ADD** | p7's tray shows a note "■ STOP first: a stray loop still holds generator 2." while an orphan holds generator 2's place. p19's TEST tray uses the same words in place of "No second generator yet." | p07, p19 | **Seen, p7:** the note appears after the orphan and goes after ■ STOP. |
| **C-4, never a lie on screen** | New pure rule `gaPlantedWhere(unnamed, symptomSeen)`. A value is labelled **IN PROJECT** while a fault hides, and before any symptom on this visit (before START the project and the build agree, so this is true then too). It is labelled **IN BUILD** once a symptom has shown what the build does. Because the label reads IN PROJECT from page open, START changes nothing on screen in a first round. Where it shows:<br>• **p6:** the readout key is `IN PROJECT` / `IN BUILD` (narrow `PROJECT` / `BUILD`; "FILE IN PROJECT" did not fit at 390). The spoken label says "in the project, the door event asks for door_open.wav and door_close.wav, which are in the project. Press the door key to test the build", then "in the build, … which is not in the build".<br>• **p7 and p10:** the rule row heading ends "· IN PROJECT" / "· IN BUILD".<br>• **p8:** the SCOPE blurbs and spoken value begin "In the project, …" / "In the build, …". The dock key itself is too narrow for the word; its chooser carries it.<br>• **Guides:** p06 now defines the readout ("IN PROJECT: does the project hold the file the door layer asks for? Once a FAULT line names a missing file, it reads IN BUILD."). p07 and p10 explain the ✓ in the same words. Every guide stays within its budget; p6 lost "Cards in the lesson spell it out." to make room. | bitsLogic, p06, p07, p08, p10, guides p06/p07/p10 | **Seen, p6 at 390:** open → "IN PROJECT FOUND"; START → still "IN PROJECT FOUND"; OPEN DOOR → "BUILD MISSING" in red. p7 row reads "· IN PROJECT", then "· IN BUILD" after the orphan. p10 row reads "· IN PROJECT" after START. |
| **C-5, PLAY key** | The PLAYING short key is now **PLAYS**. p1's lesson says "On a narrow phone they read PLAYS and SND." (Saying it in the p1 guide pushed it past its 410-character budget, so it is in the lesson.) | GaLab, p01Welcome | **Seen, p10 at 320:** COURTYARD · BEDS · PLAYS · VOICES · SND. |

**Note for the owner (C-4):**
- The concealment now tells a true story from real practice: the project names a file that is there, while the build asks for another.
- Choosing a value in DOOR FILE, the rule row or SCOPE still changes the setting itself.
