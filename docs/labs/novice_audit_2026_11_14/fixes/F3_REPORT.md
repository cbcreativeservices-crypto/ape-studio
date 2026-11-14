# F3 report · Game Audio Lab + Stage Plot Lab · lab fix round 1, PHASE 1

Agent F3 (Fable 5.2, high effort), 2026-11-14. Repo `C:\Users\profe\dev\ape-workbench`, branch `ota-after-approval-39-23`. No commits, no pushes, no `eas`, nothing published. Own files only.

## 1. Summary line

**16 fixed · 3 not a bug · 2 held (owner's decisions) · 3 shared needs.**
Tests: `test/labFixes_20261114_F3.test.ts` 29 pass, 0 fail. Every existing test of the two labs (the `gameAudio*`, `stagePlot*` and `screenGuide_gameaudio` files, 1861 tests with mine) passes. `npx tsc --noEmit`: exit 0, 0 errors.

**STATUS: PHASE 1 DONE.** Ready for phase 2.

## 2. Item table

| # | Item (lab, what) | Verified in code (file:line, before the fix) | Fix (files changed) | Test | Seen on screen (390 × 844, sound off) | Status |
|---|---|---|---|---|---|---|
| GA-1 | Game Audio p17: "impact × 4" but "TAKEN 9" | `pages/p17Budgets.tsx:157-159` printed `TAKEN {r.stolen}` under six rows; `data/gaBudget.ts` `lastBurst` groups a run ("× 4"). 5 loops + 4 one-shots = 9: the number was right, nothing joined it to the rows | `gaBudget.ts`: `burstTotalWords` ("TAKEN 9 = 5 loops + 4 one-shots · REFUSED 0"), `protectedKept`, `protectedKeptWords` ("Kept its voice: Overheat alarm (protected)."); `p17Budgets.tsx` | F3 test "page 17" (3 tests) | YES. Card read "TAKEN 9 = 5 loops + 4 one-shots · REFUSED 0". With ALARM on: "Kept its voice: Overheat alarm (protected)." | FIXED |
| GA-2 | Game Audio p17: BUDGET moves in steps of 4 | `gaBudget.ts:18` `BUDGET_STOPS = [1, 2, 4, 8, 12, 16, 0]`: 16 → 12 → 8, two presses for step 2's "Set BUDGET to 8" | the stop at 12 is gone; each stop is half the one above | F3 test; pinned stops in `gameAudioChD.test.ts` updated, with the owner's words | YES. One press of ‹ FEWER: VOICES 0/16 → 0/8 | FIXED |
| GA-3 | Game Audio p19: the FIX tray opens with the right tab selected and ticked | `pages/p19Testing.tsx:118-127,170`: `<FixTray start={focus} />`, `useState<FaultId>(start)`, `marked(x.pick, …)` (the ✓) | FIX opens with no setting chosen and a two-line prompt where the values go (the tray keeps its height); the chosen chip carries ▸, never ✓ | F3 test "FIX opens on no setting" (2 tests) | YES. Five chips, none marked; after a pick "▸ VOICE BUS", "○ EFFECTS", "● DIALOGUE"; closed and reopened, it is neutral again | FIXED |
| GA-4 | Game Audio p19: faults 1-4 count without a re-run, fault 5 needs one | `data/gaFaults.ts:310-313`: `proved` was counted for `orphan` only; `faultOpen` (:325) returned false for faults 1-4 as soon as the setting was right | all five are proved by a healthy re-run of the same action (`proofCount`, `faultRetest`, `prove` and `retest` on each fault; the footsteps need two steps, since one cannot show that the take changes). The card shows "SETTING CORRECTED · NOW TEST IT AGAIN" with the action to repeat (`bits.tsx` `FaultCard`), the FIX key reads RE-TEST instead of ALL OK, and the page, the cards' FIXED words and the guide state the one rule. Fault 5's card now says to press ■ STOP first. NEW credit only: stored page marks are untouched | F3 test (5 tests); pinned expectations in `gameAudioChD.test.ts` and `gameAudioBugtestR2_20261113.test.ts` updated, with the owner's words | YES for fault 1 (door) and fault 3 (footsteps): after the fix the chip stayed ●, the card asked for the re-run, FIX read RE-TEST; fault 3 stayed ● after one step and went ✓ after the second. Faults 2, 4 and 5: by test only | FIXED |
| GA-5 | Game Audio p11: the key reads "SOURCES ▸ NONE" while a source is ticked | `pages/p11Distance.tsx:91` | the value says what is switched ON: ALL OFF / GEN 1 ON / SCENE ON / BOTH ON; guide line updated | F3 test "page 11" | YES. ALL OFF → GEN 1 ON → BOTH ON → SCENE ON, each whole on the key | FIXED |
| GA-6 | Game Audio p21: "Choose a TOPIC under the picture" | `pages/p21Today.tsx:210` | "Press the TOPIC key at the bottom of the screen and choose a topic." | F3 test "page 21" | YES | FIXED |
| GA-7 | Game Audio p10: "WIND F…" | `pages/p10Loops.tsx:166` label `WIND FILE`, the fourth of six keys. Lab-local: it is the label's length | the key is `WIND` (`data/chbScene.ts` `P10_WIND_KEY`); the lesson and the guide say WIND | F3 test "page 10" | YES. "WIND ▸" whole at 12 px (as WIND FILE it had been shrunk to 9.1 px) | FIXED |
| GA-8 | Game Audio end screen: "21 pages not done yet" for a learner who did the work | WHY: the count is true. A page counts only when every goal AND its check are ✓ in one visit (`bits.tsx:86-96` `useVisitGoals`; `kit/PagedLab.tsx` `markDone`). The auditor finished page 1 and did the practice without the check on the others. Proof: I finished page 15 in the preview and the end screen read "21 pages not done yet" (22 − 1). No page said when it counts | one line under every page's goal chips: the rule while goals are open ("This page counts once every goal here is ✓ in one visit. Moving on before then does not count it, and these marks start empty when you come back."), and "✓ Every goal here is done, so this page is counted." when they are (`bitsLogic.ts` `gaGoalsNote`, `bits.tsx` `GoalChips`). No number in it. The end screen's own words are S2's: SHARED NEED 1 | F3 test "a page says when it counts" | YES. Both lines seen (page 1: the rule; page 15 after all five goals: the ✓ line) | FIXED (lab part) |
| GA-9 | Game Audio: a silent first step | `pages/guides/p02.ts:10` and `pages/p02Reacts.tsx:70` began "Turn SOUND on"; `pages/p13Formats.tsx:125` "Put on headphones…" with nothing for a learner without them | page 2 starts with OPEN DOOR ("Turn SOUND on first if you can listen"); page 13's step ends "No headphones? Read the strip instead." Every other page's first step already works with sound off (the log prints "(not heard: sound is off)") | F3 test (2 tests) | YES, both lines | FIXED |
| GA-10 | Game Audio p3: step 2 says "the whole card is here" while the open tray covers it | `pages/p03Platforms.tsx:173` | "Close the tray to read the whole card, just below." | existing word-count and guide tests pass | not looked at again (one sentence) | FIXED |
| GA-11 | Game Audio p4: GEN PAN reads "—" after a GAMES pick | `pages/p04Games.tsx:70-71`. By design: bug test R2-GA1-07 made a generator that is not played read "—", and the page's guide says "— means it is not played" | none | | | NOT A BUG |
| GA-12 | Game Audio p7: the "STOP ITS LOOP / LEAVE IT PLAYING" pair has no label | `pages/p07Instances.tsx:72`: the row is headed "WHEN A GENERATOR IS REMOVED · IN PROJECT" | none | | | NOT A BUG |
| GA-13 | Game Audio p4 and p10: two lessons on one page | | | | | HELD: owner's decision (OUT list) |
| SP-1 | Stage Plot: PLACE ON THE STAGE does not place the performer | `SetupArea.tsx:383-386` only called `ed.goTo('stage', { kind: 'performer', … })`. The same hand-off sat behind every button with that label: `inputs/SourceEditor.tsx:79`, `inputs/InputEditor.tsx:170`, `inputs/BoxPanel.tsx:299`, `MonitorsArea.tsx:237`, and the review answer `spIssueActions.ts` `locate` | `spIssueActions.ts` `placeOnStage`: ONE edit draws the row at a free place near downstage center (the Stage area's own `stagePlace`: a drawing only), then the Stage area opens with the new symbol selected. All six buttons use it; their spoken labels say "Place … on the stage and show it there" | F3 test (3 tests); pinned expectations in `stagePlotBugtest20261113.test.ts` and `stagePlotStore.test.ts` updated, with the owner's words | YES for Setup: before the fix, "0 objects on the stage" and a second PLACE button; after it, one press gave "1 object on the stage. Selected: Performer 1 (downstage center, facing the audience)." and the Stage tab's question mark cleared. The Inputs, Monitors and review buttons: by test only | FIXED |
| SP-2 | Stage Plot: new objects stack on one spot | `stage/stageLinks.ts:503-543` `stageFreeSpot`: free = 0.1 m of air, nearest grid point. Measured with the model: performer at 50 % / 67 %, amplifier at 50 % / 80 %, 0.1 m apart = 8 points on a phone, under the performer's name. They did not share a place; they looked stacked | 0.3 m of air where the stage has the room (`STAGE_NEW_AIR`), the old 0.1 m only on a stage too full for that (`STAGE_MIN_AIR`), and a step up or down the stage counts double (`STAGE_ROW_BIAS`), so a new object stands BESIDE the last one | F3 test (3 tests) | YES. Performer 1 and the guitar amp side by side, about 50 points apart, each name clear of the other symbol | FIXED |
| SP-3 | Stage Plot: "Who plays or sings it" defaults to Nobody | `stage/StagePalette.tsx:147` `setWho(NOBODY)` | `stageLinks.ts` `stageDefaultWho`: the performer whose figure is selected, or the band's ONLY performer; with several and none selected it stays "Nobody" (never a guess) | F3 test (2 tests) | YES. "Who plays or sings it: Performer 1" was the chosen value | FIXED |
| SP-4 | Stage Plot: the palette reopens over the result | `StageArea.tsx:168-171` `addFromPalette` already closes the popup after an add. In my tab, shown in front, the popup was gone 0.3 s after ADD THE SYMBOL AND 1 INPUT and the stage showed the new object selected. The pane does not run animation frames in a tab that is not in front (I measured 0 frames in one second), so there the popup's fade-out cannot finish: a preview-only effect. I did not reproduce the stuck popup myself | none (the closing is pinned in the F3 test) | F3 test "the palette does not stay" | YES: it closes | NOT A BUG (preview only) |
| SP-5 | Stage Plot quick win 13: GUIDED TASK open by default on a blank stage, no "(OPTIONAL)" | `GuidedTask.tsx:36,49`: `let stepsOpen = false`, title "GUIDED TASK (OPTIONAL)" | open by default on a plot started from a blank stage (`features/stageplot/spReview.ts` `spGuidedOpenByDefault`); closed on an example band, where the task earns nothing; HIDE THE STEPS is remembered. The heading is `GUIDED TASK`; the line "Working on a real gig? Skip this…" stays, so the task is still optional (owner's decision 2 stands). Setup's guide and intro card updated | F3 test (2 tests); one pinned line in `stagePlotBugtest20261113.test.ts` updated | YES. New blank plot: heading GUIDED TASK, five steps open, no "(OPTIONAL)" | FIXED |
| SP-6 | Stage Plot: the STAGE intro card says "Tap ADD and choose Performer" when a performer waits to be placed | `guides/stage.ts:11` | "Performers from Setup wait under the drawing: tap PLACE … ON THE STAGE for each. For anyone new, tap ADD and choose Performer. …" | F3 test | YES | FIXED |
| SP-7 | Stage Plot: the EXPORT intro card names SHARE PDF, the browser shows DOWNLOAD PDF | `guides/export.ts:14` | "press SHARE PDF (DOWNLOAD PDF in a browser) or PRINT" | F3 test | YES | FIXED |
| SP-8 | Stage Plot: the lab completes only with a real file (download, print or share) | owner's decision recorded in `docs/labs/stageplot/SOURCES.md` section 11 ("Credit: blank stage only… PRINT counts once the dialog opens") | none | | | HELD: owner's credit decision |

## 3. SHARED NEEDS

1. **End screen, Game Audio rows (S2).** `src/screens/lab/kit/PagedLab.tsx:545` gives every hands-on row the same `detail` (`handsOnDetail`), so the Game Audio end screen prints "Counts once its practice goals and its check are done; NEXT moves on without counting it." on 19 rows. Proposed: print a sentence shared by several rows ONCE, above the list (quick win 17), and keep a row's own `pageDetail` (pages 20, 21, 22 have their own). For the "You learned" recap, `GA_END_GUIDE.teaches` (`src/screens/lab/gameaudio/pages/guides/end.ts`) already holds four plain lines to show. Saying per page WHAT is missing needs the page to report it: when SHARED_API.md has that call I will fill it in for all 22 pages in phase 2 (each page already holds its goals as `{ label, hit }`).
2. **Records (coordinator).** Two record files are outside my folders. Proposed rows:
   - `docs/labs/gameaudio/SOURCES.md`, section 5 (corrections log): "2026-11-14 · Lab fix round 1. Page 17: the BUDGET stops are 1, 2, 4, 8, 16 and no limit (12 removed); the burst card prints its sum and names a protected sound that kept its voice. Page 19: FIX opens on no setting; all five faults need the same action run again after the fix. Page 11's key says ON / OFF; page 10's key is WIND; every page says under its goals when it counts. · Beginner audit G5 / G5b; `test/labFixes_20261114_F3.test.ts`".
   - `docs/labs/stageplot/SOURCES.md`, section 11: "2026-11-14 · Lab fix round 1 (owner approved quick win 13). The guided task is open on a plot started from a blank stage and is headed GUIDED TASK. Every PLACE ON THE STAGE button places in one edit. A new object gets 0.3 m of air and stands beside the last one. A new source is offered to the selected performer, or to the band's only one."
3. **Dock key order, Game Audio page 18 (row 8, DockTray).** The auditor pressed ID CHECK by habit because page 18's keys are SEND, ID CHECK, LEVEL while most pages start with their slider. The order is lab-local (`pages/p18Multiplayer.tsx`, the `keys` list), but "the same key order on every page" is a shared-frame rule (report section 3, row 8). I left it for phase 2 so it follows whatever SHARED_API.md settles.

No change is needed in `src/screens/lab/dj/art/sceneText*`.

## 4. What I did not check, and why

- **A phone.** Everything was seen in the web preview only. Phone-only: the Stage Plot popup closing after an add on iOS and Android, and the drag of a newly placed symbol.
- **Sound.** Never switched on (KEEP SOUND OFF). Nothing here changes a sound.
- **Game Audio page 19, faults 2, 4 and 5 on screen.** Faults 1 and 3 were walked; the other three are proved by the reducer-driven tests only.
- **Stage Plot: the PLACE ON THE STAGE buttons in Inputs (source, input, stage box), Monitors (device) and the review list.** Proved by test and by reading; only Setup's was pressed on screen.
- **Stage Plot FULL SCREEN** (the palette is a dock tray there, not a popup) and **320-wide phones**: not looked at.
- **PRINT, SHARE, DOWNLOAD, EMAIL and COPY** were never pressed, so the guided task's last step was not completed.
- **Other Stage Plot audit suggestions that are not bugs** were left alone: folding THE GIG and the other optional Setup sections, a "start here" mark on Blank stage in the library, a legend for the "? 1" tab marks, naming a mix after its performer, a tour of an example. They are design changes of size M, not in the approved bug and quick-win lists.
- **Preview data I changed by normal taps:** one "Untitled stage plot" (Performer 1 and a guitar amp) is saved in the preview's plots, and Game Audio page 15 is marked done there. I deleted nothing. The coordinator restores.
- **The scratchpad folder is shared by the agents**: another agent's `t1.py` replaced mine during the round. Nothing of mine depended on it afterward (my later scripts are named `f3_*`).

## 5. Type check

`npx tsc --noEmit`, run once more after my last edit: **exit 0, 0 errors** (in my files and in the whole tree at that moment).

## 6. Files changed

Game Audio: `bits.tsx`, `bitsLogic.ts`, `pages/data/chbScene.ts`, `pages/data/gaBudget.ts`, `pages/data/gaFaults.ts`, `pages/guides/p02.ts`, `p10.ts`, `p11.ts`, `p19.ts`, `pages/p02Reacts.tsx`, `p03Platforms.tsx`, `p10Loops.tsx`, `p11Distance.tsx`, `p13Formats.tsx`, `p17Budgets.tsx`, `p19Testing.tsx`, `p21Today.tsx`.
Stage Plot: `src/features/stageplot/spReview.ts`; `GuidedTask.tsx`, `MonitorsArea.tsx`, `SetupArea.tsx`, `StageArea.tsx`, `spIssueActions.ts`, `guides/export.ts`, `guides/setup.ts`, `guides/stage.ts`, `inputs/BoxPanel.tsx`, `inputs/InputEditor.tsx`, `inputs/SourceEditor.tsx`, `monitors/DeviceSheets.tsx`, `stage/StagePalette.tsx`, `stage/stageLinks.ts`.
Tests: new `test/labFixes_20261114_F3.test.ts`; pinned expectations updated on purpose (each with the owner's approval quoted) in `test/gameAudioChD.test.ts`, `test/gameAudioBugtestR2_20261113.test.ts`, `test/stagePlotBugtest20261113.test.ts`, `test/stagePlotStore.test.ts`.

---

# PHASE 2 · the shared frame, filled in for both labs

**Phase 2 summary: 8 mechanisms filled in (7 Game Audio, 1 Stage Plot) · 12 already met or not applicable, each checked · 1 shared need.**
Tests: `test/labFixes_20261114_F3.test.ts` now 41 pass, 0 fail (12 new). All tests of the two labs plus S2's file (which pins my screen file): 1980 pass, 0 fail. No `npx tsc` (as told); every changed file was parsed with the TypeScript parser (40 files, parse ok) and the preview bundle answered 200 after my last edit.

## P2-1. Game Audio Lab

| Mechanism | Done? | file:line | Test | Seen on screen (390 × 844, sound off) |
|---|---|---|---|---|
| Silent learner: the "Sound off?" line | DONE, in the lab's words: "Sound off? You can still do every step. The activity log and the rings show what you would hear." True of all 22 pages: every goal is judged from what the scene did | `GaLab.tsx:292` (`soundOffLine`), `bitsLogic.ts:90` | "the silent learner" | YES, at the top of the well on page 1 |
| Silent learner: NEEDS SOUND tags | DONE: one step, the only one judged by ear ("Raise LEVEL slowly until the scene is comfortable"). No goal chip needs sound, so none is tagged | `pages/p01Welcome.tsx:123` | same | YES: "…comfortable. NEEDS SOUND Then press ■ STOP." |
| Silent learner: a "can't listen now" path on listening steps | DONE: page 1 ("With sound off, watch the bars rise instead."); page 13 got "No headphones? Read the strip instead." in phase 1; page 2 starts with OPEN DOOR | `pages/p01Welcome.tsx:125`, `pages/p13Formats.tsx:125`, `pages/p02Reacts.tsx:71` | same | YES |
| Silent learner: `BezelItem.silent` | NOT APPLICABLE: no readout here comes from audio. Each is the model's own value and already shows with sound off | | | readouts seen with values, sound off |
| Bezel captions | DONE: 26 first-visit captions, set in ONE place by the readout's key and added by the rack, so no page file changed (VOICES "used/max", PLAYING "sounds", GEN PAN "left / right", DUCK "others dip", BEDS "loops on", STOLEN "voices taken", PRIORITY "higher wins", …). This lab keeps to 12 characters, and 8 for the two cells on every page: its row has five cells | `bitsLogic.ts:100` (`GA_READOUT_CAPTION`, `gaWithCaption`), `GaLab.tsx:275` | "first-visit captions" (3 tests) | PARTLY. Seen on 13 pages with none cut except the two I then shortened: "things playing" and "sounds now" were cut, so PLAYING is "sounds"; "used / limit" (48 points) did not fit page 8's 62-point cell, so VOICES is "used/max". The last two wordings were measured (32 and about 38 points of text in 45 points of room), not seen: the captions show on a first visit only and that visit was spent |
| Check card: a reason per wrong option, answer held back, balanced lengths | ALREADY MET, verified: all 31 checks use the tuning `UnderstandingCheck` with a `wrong` line for every wrong option (the explanation stays hidden until the right answer), and the right option is never the longest | every `pages/pNN*.tsx` check | "the check card … need nothing more" (scans all 22 pages) | seen in phase 1 (pages 15 and 17) |
| Check card: FINISH after a pass | ALREADY MET: a PagedLab lab ends with FINISH (SHARED_API S2 part 2) | | | seen (page 22) |
| Check card: screen-guide CHECK lines | ALREADY TRUE: the only two say "A wrong answer explains itself, and you can answer again" and "After a wrong answer you can try again", which is what this lab's card does | `pages/guides/p20.ts:23`, `p21.ts:21` | | |
| End screen: each unfinished row says what is missing | DONE: pages 1 to 19 each have their own "Still to do: …" line (their goals in the words of their chips, then their check). All of a page's goals are named, because a page counts when all are met in one visit. Pages 20 to 22 keep their own lines. The shared rule is a full sentence, printed once: "A page counts once its practice goals and its check are done in one visit; NEXT moves on without counting it." | new `pages/data/gaPageLeft.ts`; `GameAudioLabScreen.tsx:43,60` | "each unfinished row says what that page needs" (3 tests; each line is held against its page's goal chips) | YES: HOW A PAGE COUNTS once, then "Still to do: set LEVEL to 40% or lower, start the scene, stop it with ■ STOP, and pass the check." and so on down the list |
| End screen: a state-neutral `endGuide.intro.start` | DONE: "Read WHERE TO START at the top: it names the next thing to do from where you are. Tap any page in the list to open it." | `pages/guides/end.ts:24` | same | YES, on the end screen's intro card |
| Arrival order: holds | NOTHING TO DECLARE: every page is a Rack Unit, which already reports a tray or a drag as work under way; the lab term is on hold in `labTermIntroData.ts`, so no term card comes; page 1 has `guide.intro` | | | |
| Accuracy chip (D37) | ALREADY MET: `accuracy={false}` (a concept lab) | `GameAudioLabScreen.tsx` | "accuracy chip" | no chip in the header |
| Dock key order (handed to me by the coordinator) | DONE: where LEVEL is a page's slider it is the first key. Pages 18 and 19 had it last (SEND, ID CHECK, LEVEL), which is how the auditor switched ID CHECK off by habit | `pages/p18Multiplayer.tsx:204`, `pages/p19Testing.tsx:198` | "one key order on every page" | YES, page 18: LEVEL, SEND, ID CHECK, SOUND, ■ STOP |

## P2-2. Stage Plot and Channel Designer

| Mechanism | Done? | file:line | Test | Seen on screen |
|---|---|---|---|---|
| Silent learner (line, tags, stored values, listening steps) | NOT APPLICABLE: the lab plays no sound and has no ▶ | | | |
| Bezel captions | NOT APPLICABLE: the Stage area has no readout row (its height is the key's; `StageArea.tsx:215-221`) | | | |
| Check card | NOT APPLICABLE: the lab has no check or quiz | | | |
| End screen | NOT APPLICABLE: no end screen and no `endGuide`. Its progress is the GUIDED TASK, open by default on a blank stage since phase 1 | | | |
| Arrival order: no intro card over an open popup | DONE: every popup of the lab (`Sheet`) reports work under way to the screen's guide host. Its popups are plain Modals, which the card's own gate cannot see, and a review answer can open Monitors with ADD A MIX already up on the visit that brings that area's first-visit card. An owed card is dropped for that visit; a card already up closes | `spForm.tsx:468` | "no intro card over an open popup" | YES: with the STAGE intro card up, opening ADD closed the card and showed the palette alone; nothing crashed |
| Arrival order: the opening screen has `guide.intro` | ALREADY MET (`guides/library.ts`); the lab term is on hold, so no definition is repeated | | | |
| Accuracy chip (D37) | ALREADY MET: the header shows none | `StagePlotLabScreen.tsx` | "accuracy chip" | no chip |

## P2-3. SHARED NEEDS (phase 2)

1. **S2, one pinned line.** `test/labFixes_20261114_S2.test.ts:208` and `test/gameAudioChETools.test.ts:245-246` pin Game Audio's lines for pages 20 and 21 as "Counts once its six checks are done; …" and "Counts once its two checks are done; …". I left them (they do name that page's own missing piece), so those tests still pass. If S2 prefers every row to open "Still to do:", the change is three strings in `GameAudioLabScreen.tsx` PAGE_DETAIL ("Still to do: the six checks at the foot of the page." / "…the two checks…" / "Still to do: all seven goals in one visit. Its check is optional.") plus those two pins.

Nothing else: I did not edit `understandingChecks.ts` or `labEndContent.ts`, and I want no other recap lines than the `GA_END_GUIDE.teaches` pointer S4 already has.

## P2-4. Not checked in phase 2, and why

- **A phone**, and **320-wide**: not looked at. At 320 the readout cells are narrower than the 62 points I measured, so a 12-character caption may be cut there.
- **The last wording of two captions** (PLAYING "sounds", VOICES "used/max"): measured, not seen (see the table).
- **Sound**: never switched on, so the NEEDS SOUND tag was seen only in its sound-off color, and the "Sound off?" line was not seen to disappear.
- **Captions on pages 4, 14, 16 and 22** were not caught on screen (first visit already spent by an earlier pass); their words are 6 to 12 characters in cells of 67 points or more.

## P2-5. Files changed in phase 2

Game Audio: `GaLab.tsx`, `GameAudioLabScreen.tsx`, `bitsLogic.ts`, new `pages/data/gaPageLeft.ts`, `pages/guides/end.ts`, `pages/p01Welcome.tsx`, `pages/p18Multiplayer.tsx`, `pages/p19Testing.tsx`. Stage Plot: `spForm.tsx`. Tests: `test/labFixes_20261114_F3.test.ts` (12 tests added). No pinned test of another file needed changing.

---

# PHASE 3 · the owner's decisions of 2026-11-14, for both labs

**Phase 3 summary: 8 items done (5 Game Audio, 3 Stage Plot, one of them a bug of my own fold found on screen and fixed) · 9 checked and already met or not applicable · 1 held (the saved-mark move on a real phone: phone-only check) · 3 shared needs (comments only) · both labs seen on screen at the end (P3-7).**

Tests: `test/labFixes_20261114_F3.test.ts` is now 61 tests, 61 pass (20 new in phase 3). Every test of the two labs, plus S2's and S4's files, the storage and wipe tests that guard what I touched, and the two ratchets the coordinator's gate named (`patternP10b_20261002`, `afterInteractions_20261004`): **2393 pass, 0 fail**. No `npx tsc` (as told). Every changed file was parsed with the TypeScript parser (26 files, parse ok) and the preview bundle answered 200 after my last edit. No commits.

## P3-1. Game Audio Lab

| Item (owner's decision) | What was done | file:line | Test |
|---|---|---|---|
| **5 · Old page 4 held two lessons** | Now two pages. **Page 4 "Kinds of games"** (the beginner part: open three kinds of game, one check on the play mode). **Page 5 "Whose ears: the listener"** (the depth: the camera, FACING, the pan check). Every goal and both checks of the old page are on one of the two, none twice. Nothing was dropped | `pages/p04Games.tsx`, new `pages/p23Listener.tsx`, guides `guides/p04.ts`, new `guides/p23.ts` | "old page 4: its five goals and two checks are on the two pages, none twice" |
| **5 · Old page 10 held two lessons** | Now two pages. **Page 11 "Ambience and zones"** (the beginner part: cross the doorway, one check). **Page 12 "Loops and their joins"** (the depth: the raw-cut join, ■ STOP for every loop, the join check) | `pages/p10Loops.tsx`, new `pages/p24LoopJoin.tsx`, guides `guides/p10.ts`, new `guides/p24.ts` | "old page 10: its three goals and two checks are on the two pages, none twice" |
| **5 · "Find how progress is keyed first"** | Found: page marks are keyed by the page's **index** in the list, not by an id (`src/features/lab/pagedProgress.ts:17`, `{completed: number[], lastPage, done}`, stored as `ape:game-audio:v1` on the device only: nothing uploads or downloads it; a guest's marks are held for the session and written to that record after sign-in). The certificate credit `tr_game_audio` is a separate record, keyed by the lab, and is not indexed | | |
| **5 · "Map old keys so nothing earned is lost"** | A one-time move of the saved marks, done before the lab's shell reads them. Old pages 1-3 keep their place; old 4 becomes 4 **and** 5; old 5-9 become 6-10; old 10 becomes 11 **and** 12; old 11-22 become 13-24. "Last page open" moves the same way; "lab done" is kept. So a learner who had finished the old page 4 or 10 has both new pages done, and a learner with all 22 done has all 24 done | new `model/gaPageLayout.ts:59` (`gaIndexFromLayout1`), `:70`, `:129` (`gaEnsurePageLayout`); `GameAudioLabScreen.tsx:87` | "the map: every old page keeps its mark…" |
| **5 · "…and test it" with a saved record from before the split** | Six tests drive the real move against a stand-in for the device's storage: a fully done 22-page record; a partly done one (pages 1, 4, 6, 10, 17, last open on 12); the next visit, a new app start and a later wipe (it never runs twice); a device with nothing stored; the app closed in the middle of the move; a device that cannot be read or will not write | | `describe` "pages 4 and 10 are two pages each, and saved marks follow them" (9 tests) |
| **5 · Page count updated everywhere** | The list is 24 pages (`pages/index.ts:69`). Every number a learner reads was moved: "Page 8 explains them" (page 1), "Page 19 plays…" (page 3's guide), "page 22 has the others" (page 9, a term note), the end screen's guide ("Page 22 is done when its six checks are passed, page 23 when its two are"). The end screen's 21 "Still to do" lines and its three own lines were re-keyed (`pages/data/gaPageLeft.ts`, `GameAudioLabScreen.tsx:66-69`). CONTENTS and the strip count from the list, so they needed nothing | | "every page number a learner reads is today's number"; "24 pages, in this order…" |
| **3 · One name per unit** | `unitNoun="page"`: the strip, CONTENTS and the end screen now say PAGE (they said MODULE), which is the word the lab's lessons, goal notes and guides always used. As the coordinator noted, S2 re-pinned the end screen's tools row to index 21 after the split | `GameAudioLabScreen.tsx:110` | "the strip, CONTENTS and the end screen use the lab's own word, page" |
| **3 · "drawing…" instead of a blank panel** (pages 5, 6, 7, 12 of the audit) | Adopted S3's `stage.drawing` for **every** page: the glass says "drawing…" until the page has had two turns of the task queue to build and draw its scene, and for 1.2 s at most, so it can never stay. It waits with the house `runSoon` (no frame callbacks): the coordinator's gate caught that my first version, which waited on two animation frames, made `GaLab.tsx` a new loop host for `test/patternP10b_20261002.test.ts`; the code was changed, no list was touched, and that test passes | `GaLab.tsx:231-262, 330` | "the glass says 'drawing…' until the picture has had its first frames, and never for good" |
| **3 · Plain model note in place of an all-caps badge** | NOT APPLICABLE: this lab shows no "NOT A MEASUREMENT" badge (it has `accuracy={false}` and passes no `badge`) | | |
| **3 · LEARN first, ⓘ in a tray, step intros inline** | NOTHING TO FILL IN. LEARN first: not a LabShell lab (no LEARN tab). ⓘ in a tray: it shows where a tray key has a long-press lesson (`helpKey`); this lab has no long-press help at all (its help is each page's guide and its term chips, both already visible), so there was no hidden help to surface. Step intros: automatic (S1) | | |
| **1 · "Done" = work done** | ALREADY MET and now declared: all 24 pages are `manualDone: true`; a page marks itself only when all its goals and its check are met in one visit; NEXT and a CONTENTS jump mark nothing. S2's ratchet for this lab is 0 | every `pages/pNN*.tsx` last line | S2's ratchet test, plus mine in phase 2 |
| **2 · No "N of total" progress counter** | NONE LEFT in the lab's own files (checked every page and guide). The strip's "MODULE n / N" went with S2's change. "TAKE 1 of 4", "VOICES 0/16" and "BUDGET 8" are values, and stay | | |

### The credit rule, exactly

- **The words did not change.** The rule is still "every page done" → `tr_game_audio` (PagedLab's `labDoneKey`).
- **The number changed from 22 pages to 24.** No goal and no check was added: the old page 4's five goals and two checks, and the old page 10's three goals and two checks, are now spread over two pages each. Each of the four pages has its own check, so each counts on its own.
- **Credit already earned is untouched.** `tr_game_audio` is kept by the shared credit record, which never removes a credit. A learner who had finished all 22 pages also keeps a full page list (24 of 24), so the end screen does not ask them to redo anything.
- **A learner part-way through** keeps every mark. A finished old page 4 or 10 counts for both pages it became, so nobody has to redo a lesson they had passed.
- **For a new learner the work is the same.** The one "pass both checks" goal of each old page became one "Pass the check" goal on each new page. The same things are done in two shorter visits instead of one long one.

### How the move is kept safe

- It runs once per device, guarded by a small device-level value (`ape:onboarding:gaPageLayout`). That key family survives the account wipe on purpose: a guest's pages are written to the account after the sign-in wipe, so a wiped marker would have moved the same record twice.
- Three steps, each safe to repeat: keep a copy of the old record in the marker → write the moved record and read it back → set the marker to "24 pages". If the app closes in the middle, the next start finishes from the copy.
- A device with nothing stored is marked "24 pages" at once, so its first record is never taken for an old one.
- If the device cannot be read or will not write, nothing is changed and it tries again on the next visit. The lab never waits on it (labs never block navigation).
- **One residual risk, stated plainly:** in that last case (storage unreadable at that moment) the lab still opens, and a page finished in that visit is saved in the new layout while the old record is still unmoved. The record then mixes the two. It needs a storage failure at exactly that moment; the result would be one or two marks on the wrong page, never a lost credit. I did not build more for it.
- **For whoever changes the page list next:** adding, removing or reordering a page needs a layout 3 in `model/gaPageLayout.ts` (the file's header says how). File numbers are names, not places: `p23Listener.tsx` is the learner's page 5 and `p24LoopJoin.tsx` is page 12 (`pages/index.ts` header).

## P3-2. Stage Plot and Channel Designer

| Item (owner's decision) | What was done | file:line | Test |
|---|---|---|---|
| **5 · SETUP's ~25 fields: beginner core first** | A new plot now shows **THE BAND** and **PERFORMERS** open (what a beginner must fill in to get a plot), then one line, "Five more parts of the packet. All are optional: open one when you need it.", and five folded rows: **THE GIG**, **TECHNICAL CONTACT**, **REVISION AND STATUS**, **STAGE SIZE**, **NOTES**, each with **GO DEEPER ▾** (and HIDE ▴ when open). Every field, switch and note is still there, in the same order | new `src/features/stageplot/spSetupFolds.ts`; `spForm.tsx:340` (`FoldSection`); `SetupArea.tsx:442-520` | "five parts fold, in the order they were in…"; "nothing was removed…" |
| A folded row is never blank | Each closed row says what it holds now in one line. On a new plot: "The venue, the date and the times. Nothing typed yet.", "The person the venue’s engineer should ask. Nobody yet.", "Revision 1 · Draft", "Rectangle · no size yet (not to scale)", "Nothing written yet." Once filled in, the row shows the values instead (the venue, the date, the times; the contact's name and details; the size) | `spSetupFolds.ts:48` | "a closed part says what it holds, in one line, and is never blank" |
| A review question is never folded away | "No technical contact" shows on the closed TECHNICAL CONTACT row, and GO TO from the review opens that part before it moves to the field | `spSetupFolds.ts:77-88`, `SetupArea.tsx:188-193` | "a review question is never folded away…" (and the re-pinned line in `stagePlotStore.test.ts`) |
| An open part stays open | Per plot, for the session: leaving Setup and coming back keeps what was opened. Not stored on the device (nothing to migrate) | `SetupArea.tsx` (`openFolds`) | same `describe` |
| **Export's GO TO SETUP opens the folded contact** (found on screen) | "Contact shown in the packet: none. Change it in SETUP." has a GO TO SETUP button. With the contact folded it landed at the top of Setup, the contact out of sight. It now leaves the contact's rule, as a review "Go to" does, so Setup opens TECHNICAL CONTACT and brings it into view. Every other "go to Setup" in the lab is about a performer, and PERFORMERS is never folded | `spIssueActions.ts:92` (`goToSetupPart`), `ExportArea.tsx:388` | "Export’s GO TO SETUP for the contact opens the folded contact part" |
| Folds are rows, not pulldowns | The row opens in place inside the page's own scroll, like the lab's existing MORE DETAILS; no menu drops over other content (popups, not pulldowns) | | |
| **A screen reader hears each part of a row as its own sentence** (checker K2) | Two rows' summaries have no full stop on screen ("Revision 1 · Draft", "Rectangle · 24 × 16 ft"), so the spoken label ran into "Show this part". The label is now built in one place and closes every part with a full stop: "REVISION AND STATUS. Revision 1 · Draft. Show this part." The words on screen did not change | `spSetupFolds.ts` (`spFoldRowSay`), `spForm.tsx:350` | "a screen reader hears each part of a row as its own sentence" (every row, empty and filled). Read back from the page: all five labels correct |
| Both "go to" paths, checked again with my tab in front (asked by the coordinator after K2) | The review's "Go to it" for the contact question, and Export's GO TO SETUP: each opened Setup with TECHNICAL CONTACT open (HIDE ▴) and its heading at the top of the view, just under the tab bar (heading at 194 of 844 points, the first field at 384) | | seen, with a picture |
| Guide and intro card | The Setup guide's start line and control list now say the parts are folded (control list kept to 5 lines, 691 characters, inside the cap) | `guides/setup.ts` | "the guide and the intro card say the parts are folded" |
| **1 · "Done" = work done** | ALREADY MET: the lab has no pages and no credit on opening. Its progress is the GUIDED TASK, which ticks a step only from what the plot holds | | |
| **2 · No "N of total"** | NONE: no counter of that kind in the lab. "NOT TO SCALE" is a drafting note on the plot and stays | | |
| **3 · One name per unit** | NOT APPLICABLE: no strip, no end screen. The areas are called areas everywhere | | |
| **3 · Model note, "drawing…", LEARN first** | NOT APPLICABLE: not a rack lab; the stage draws at once from the plot (no blank panel was reported) | | |

## P3-3. SHARED NEEDS (phase 3)

All three are comments, in files I do not own. No behavior depends on them.

1. `src/features/lab/trainingCompletion.ts:22`: "every one of its 22 pages done" → "every one of its 24 pages done".
2. `src/features/lab/trainingLabKeys.ts:59`: "its 22 pages is done" → "its 24 pages is done".
3. `src/navigation/types.ts:420`: "22 pages on the PagedLab shell" → "24 pages on the PagedLab shell".

Already settled, for the record: S2's pin of the end screen's tools row (index 19 → 21) was changed by S2, as the coordinator said.

## P3-4. Pinned tests changed on purpose

Each carries a comment quoting the owner's decision 5 of 2026-11-14 ("Split a page that holds two lessons into two pages." / "Long pages: beginner core first … fold the depth under 'Go deeper ▾'"):
`gameAudioBugtestR2_20261113` (the listener's guide is now G23 / `p23Listener`), `gameAudioChAFamilies` ("Page 8"), `gameAudioTerms` ("page 22"), `gameAudioChETools` (rows 21 and 22), `gameAudioChAGenres` (two checks across the two pages), `gameAudioChB` (the page list gains `p24LoopJoin`; the raw-cut goal lives there), `stagePlotStore` (Setup keeps the rule it took, and opens the fold), `stagePlotPacket` (Export's GO TO SETUP opens the contact part).

## P3-5. Docs

`docs/labs/gameaudio/SOURCES.md` section 8 and `docs/labs/stageplot/SOURCES.md` section 13 record what changed in this round and why (the 24 pages, the credit rule, the saved-mark move, the unit word, the folded Setup).

## P3-6. Files changed in phase 3

Game Audio: new `model/gaPageLayout.ts`, new `pages/p23Listener.tsx`, new `pages/p24LoopJoin.tsx`, new `pages/guides/p23.ts`, new `pages/guides/p24.ts`; `GameAudioLabScreen.tsx`, `GaLab.tsx`, `gaTerms.ts`, `pages/index.ts`, `pages/p04Games.tsx`, `pages/p10Loops.tsx`, `pages/p01Welcome.tsx`, `pages/p09Variation.tsx`, `pages/data/gaPageLeft.ts`, `pages/guides/p03.ts`, `p04.ts`, `p10.ts`, `end.ts`. Stage Plot: new `src/features/stageplot/spSetupFolds.ts`; `spForm.tsx`, `SetupArea.tsx`, `guides/setup.ts`, `spIssueActions.ts`, `ExportArea.tsx`. Docs: the two SOURCES files. Tests: `test/labFixes_20261114_F3.test.ts` (20 added) and the eight pins above.

## P3-7. Seen on screen in phase 3 (390 × 844, sound off, the built-in pane)

The preview could not be loaded for most of phase 3 (see "The preview server" below). It came back near the end, and I then looked at both labs.

| Lab | What I looked at | What I saw |
|---|---|---|
| Game Audio | The strip | "PAGE 1 ▾" (was MODULE); its screen-reader label is "Page 1. Opens the contents". No "n / N" |
| Game Audio | CONTENTS | 24 rows with the right names: 4 "Kinds of games", 5 "Whose ears: the listener", 11 "Ambience and zones", 12 "Loops and their joins", 24 "Capstone and free play". Read from the rows themselves; the popup did not show in the picture of the pane (the pane was hidden, where popups do not animate in) |
| Game Audio | Page 4, done from start to finish | The scene is drawn; LISTENER reads YOU ("whose ears"). Picking PUZZLE, RACING and HORROR ticked "Open three kinds of game" (the key read 3 SEEN). The right answer ticked "Pass the check", and the page said "✓ Every goal here is done, so this page is counted." The foot button read "NEXT: WHOSE EARS: THE LISTENER ›". CONTENTS then said "Page 4, Kinds of games, done" |
| Game Audio | Page 5 | The glass said "drawing…" on arrival, then the scene. GENERATOR 1 on gave GEN PAN L 25%. OVERHEAD CAMERA, a move of FACING and YOUR EARS ticked the three practice goals. Its intro came as the inline note above the dock (S1's phase 3), not a popup |
| Game Audio | Page 11 | Two goals ("Cross the doorway twice with the scene running", "Pass the check"), the fault card, one check. Five dock keys (FACING, STEP, SOUNDS, SOUND, ■ STOP), none cut |
| Game Audio | Page 12 | WIND reads LOOP. SCENE on and WIND on RAW CUT: after about 12 s the strip read JUMPS 1 and the first goal ticked. ■ STOP ticked the second |
| Game Audio | The end screen | "23 pages still to go." HOW A PAGE COUNTS once, with the lab's sentence. Rows 01 to 03 and 05 to 21 each read "Still to do: …" with that page's own goals; rows 22, 23 and 24 have their own lines; page 04 is not listed and the foot reads "✓ 1 DONE" |
| Game Audio | A device with nothing stored | On the first open of the lab the layout value was written as "24 pages" at once, as designed |
| Stage Plot | SETUP on a blank plot | The intro card says the parts are folded. THE BAND and PERFORMERS are open. Then the line "Five more parts of the packet. All are optional: open one when you need it." and five rows, each with GO DEEPER ▾ and its one-line summary. Nothing is cut at 390 |
| Stage Plot | Open THE GIG, go to STAGE, come back | It opened in place (HIDE ▴, its hint, Venue, Event date, Load-in, Soundcheck, Performance) and was still open on return |
| Stage Plot | A plot with a performer and no contact (the Solo performer example) | The closed TECHNICAL CONTACT row shows the review question: "? The packet shows no technical contact with a phone number or an email. The venue’s engineer has nobody to ask." |
| Stage Plot | EXPORT › "Contact shown in the packet: none. Change it in SETUP." › GO TO SETUP | **A bug of my own fold, found by looking and fixed:** it landed at the top of Setup with the contact folded away. It now opens TECHNICAL CONTACT and brings it to the top of the view (seen after the fix). `spIssueActions.ts` (`goToSetupPart`), `ExportArea.tsx:388`; test "Export’s GO TO SETUP for the contact opens the folded contact part"; the pin in `stagePlotPacket.test.ts:1260` was changed on purpose, with the owner's decision quoted |

### Not seen on screen, and why

- **The saved-mark move itself. HELD: phone-only check.** It cannot be shown in the web preview: the preview runs as a guest, a guest's page marks are never written to the device there ("You are not signed in, so nothing here is saved yet"), and the guest launch wipe removes a record put there by hand (`accountLocalSync.ts:104`; the test record I had put in was gone once the app had started). So the move is proved by the tests only, against a stand-in for the device's storage. The real proof is a signed-in phone that holds a record saved before this change.
- **The checks on pages 5, 11 and 12, and page 11's doorway goal**: not done on screen. They use the same check card and the same goal rule as page 4, which I did do from start to finish.
- **The other four folds opened by hand** (TECHNICAL CONTACT by its own row, REVISION AND STATUS, STAGE SIZE, NOTES): only THE GIG was opened by its row, and TECHNICAL CONTACT by GO TO SETUP. All five use the one `FoldSection`.
- **The review list's own "Go to it" for the contact question**: not pressed. It uses the same path as the fixed button (tested).
- **A phone, 320 wide, and sound on**: not looked at. "drawing…" stayed about 2 s in the hidden pane, where timers run slow; on a phone it is two turns of the task queue, 1.2 s at most. After the change to `runSoon` I looked once more: on a page change the line showed at once and was gone inside 1.5 s, with the scene drawn.

### The preview server (told to the coordinator when it happened)

- For most of phase 3 a pane tab could not load the app: a request that asks for compression (every browser does) came at about 12 KB/s, so the 78 MB bundle needed about 17 minutes, while a plain request was answered in 2.5 s.
- Then nothing was listening on 8142 for a few minutes. I did not stop or restart it. It went down within seconds of my tab's app starting; I cannot tell whether that was the cause or a coincidence. One possible cause is memory, with many tabs each waiting on a compressed bundle.
- It came back (not by me), and compressed loads were then fast (under 1 s).
- For one failed attempt I served a saved copy of the bundle from a small read-only helper on 127.0.0.1:8747 for about a minute. It is stopped and the copy is deleted.

### The preview's storage, as I left it

- The test record I had put in (`ape:game-audio:v1`) is gone, and I put nothing else there.
- The layout value the lab wrote itself (`ape:onboarding:gaPageLayout`) was there after my Game Audio look and gone a few minutes later, together with the "seen" flags of the intro cards. No app code removes that key (the wipe keeps its family, and "Reset onboarding hints" removes two other named keys and `ape:intro:*` only), so I take it another agent cleared the shared preview storage between my two looks. Not proven. On a device this cannot happen without the record going too: page marks are kept on the device only, and nothing downloads them.
