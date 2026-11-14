# F4 report: Beginning Mixing, Advanced Mixing, Mastering, Mixing Guides, Pre-Production, Post-Production (phase 1)

**Summary:** 18 fixed · 6 not a bug (one of them, the accuracy chip, with a wording fix) · 0 held · 1 shared need · nothing seen on screen (preview not serving; see the end).

Tests: `test/labFixes_20261114_F4.test.ts` (23 tests, all pass). Existing tests for the files I touched: 102 files, 2,733 tests; my 4 failures fixed (pins and budgets below); 4 remaining failures are in other groups' files (see "Not checked").

## Item table

| # | Item (lab, what) | Verified in code (file:line) | Fix (files changed) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| 1 | Mastering M6 S1: TRUE PK below sample PEAK (Kick +1.6 / −5.0, Organ −5.7 / −8.8; also Speech −2.6 / −7.6) | `mod6Loudness.tsx:119-123` (old): PEAK = `linDb(peakOf(renderSignal(signal)))`, TRUE PK = `simulateLoudness(signal).truePeakDbtp`. Two different models: `meterEngine.ts:308-336` authors its own sample peak (Kick −5.4) unrelated to the rendered waveform (Kick +1.58). | `modules/mod6Loudness.tsx`: TRUE PK = shown PEAK + the story's own inter-sample overshoot (`truePeakDbtp − samplePeakDbfs`, ≥ 0). Now Kick +1.6 / +2.0, Organ −5.7 / −5.3, Speech −2.6 / −2.2, Music −5.5 / −4.6. | F4 "TRUE PK never reads below PEAK" (2) | not seen on screen | FIXED (+ SHARED NEED 1 for the LUFS face's own TP label) |
| 2 | Mastering M3 S3: + CONNECT pressed repeatedly builds the CORRECT chain | `mod3Room.tsx:28-56` (old): `firstUnplaced` moved the selection to the next unplaced device in list order, and the list IS signal order. | `modules/mod3Room.tsx`: selection stays on the device just placed (button reads ✓ PLACED); well text "Then choose the next DEVICE yourself: the order is the decision." `masteringScreenGuides.ts` path guide (start / control / tryThis) updated. | F4 (2); `screenGuide_mastering_20261031` pin updated with the owner's words | not seen on screen | FIXED |
| 3 | Mastering: "· credited" after the last card, right or wrong | `MasteringLabScreen.tsx:470` promises "A wrong pick is fine — the explanation is the point. Credit lands the moment the last one does."; guide `masteringScreenGuides.ts:1241` "once each of its decisions has an answer, right or wrong". | none | n/a | n/a | NOT A BUG (the lab's own words promise exactly this) |
| 4 | Mastering: the review has no button back to practice | `MasteringLabScreen.tsx:462-473`: credit line names "the PRACTICE step", no control. | `MasteringLabScreen.tsx`: `OPEN THE PRACTICE CARDS ›` (KeyButton) under the credit line while cards are open → `setStep(MASTERING_CREDIT_STEP[mod.id])`. (Not "‹ BACK …": that is a retired word, `masteringLabStructure.test.ts:68`.) Review guides (M1, M5) name it. | F4 (1) | not seen on screen | FIXED |
| 5 | Mixing Guides: "✓ 50 DONE" after MARK AS READ on one guide | `MixingGuideScreen.tsx:19-21, 108-111` (NEXT › and FINISH mark the guide being left as read); the lab's own guide says so: `mixingGuidesScreenGuides.ts:82` "NEXT › also marks this guide read", `:121` "A guide counts as read when you leave it with NEXT › or FINISH ›, or tap MARK AS READ". G4 walked all 50 with NEXT ›. | none | n/a | n/a | NOT A BUG (by design and stated; OUT list item 1: a single meaning of "done") |
| 6 | Beginning p15: inspection passes before a sample rate is chosen | `pagesD.tsx:207` (old): `onPress={() => setInspected(true)}` unconditionally. | `pagesD.tsx`: passes only with rate AND depth; otherwise says "No bounce yet: choose a SAMPLE RATE and a BIT DEPTH above first." Guide line updated. | F4 | not seen on screen | FIXED |
| 7 | Beginning p4: caption spoils the blind vote | `pagesA.tsx:280` (old): "B's bar sits 3 dB higher with nothing else changed" printed before the vote. | `pagesA.tsx`: before the vote the caption says "Vote with your ears first, before you read the bars."; the 3 dB line appears after the vote. | F4 | not seen on screen | FIXED |
| 8 | Beginning end: "13 pages still to finish" after all 16 were walked | Page credit = goal chips latched (`kit.tsx:295`, `PagedLab.tsx:449-469, 523-529`). 9 of 16 pages (4, 5, 7, 8, 9, 10, 13, 14, 16) carry a listening goal that latches only from `pb.heard` (`pagesA.tsx:268`, `pagesB.tsx:40,43,225`, `pagesC.tsx:48-49,135,207`, `pagesD.tsx:56,128,289`), which a sound-off walk can never meet. The other open pages are goals G4 did not finish (and see the wipe below). Nothing in the counting is wrong. | none in phase 1 (the sound-off path is phase 2's shared "needs sound" / silent-path mechanism) | n/a | n/a | NOT A BUG (counting by design; silent path = phase 2) |
| 9 | Beginning: ACCURACY chip in a concept lab (D37) | `BeginningMixingLabScreen.tsx:47-52` and `AdvancedMixingLabScreen.tsx:44-49`: "ACCURACY CHIP RULE (owner 2026-10-31): kept … real level readouts". The owner already ruled on these two labs. | Chip stays. Each lab now passes its own `accuracyDetail` (first line of the note says what THIS lab measures), so it no longer reads as off-topic (G4 saw the generic list with light meters). | F4 | not seen on screen | NOT A BUG (owner ruling) + wording fix |
| 10 | Advanced p1: says Beginning Mixing is not done after it was walked | `pagesAdvA.tsx:21-32` (old): `p.completed.length >= 16` on the STORED marks only. Also missed (a) a guest's held marks this session and (b) banked page credit after START OVER (PRACTICE), which `PagedLab.tsx:523-529` itself counts. | `pagesAdvA.tsx`: a page counts when stored, held (`withHeldPages(…, heldPaged('mixing-beg'))`) or banked (`useLabKeysDone` on Beginning's page keys). A learner who started it is told "some of its pages still have goals open on this device (its WHAT'S LEFT screen names them)", not the generic line. | F4 (2) | not seen on screen | FIXED |
| 11 | Advanced p2: a fourth pick is silently ignored | `kit.tsx:194-197` `togglePriority` refuses a 4th with no word. | `pagesAdvA.tsx`: a 4th tap sets the line to "Three is the limit. Tap one of your three to drop it, then pick the new one." Guide updated. | F4 | not seen on screen | FIXED |
| 12 | Advanced p2: "the final page will hold you to them" is kept only after page 20's seventh step | `pagesAdvD.tsx:651-656`: priorities appear only in DELIVERED (after all 7 steps). | `pagesAdvA.tsx`: "page 20, the final repair, puts them in front of you before you start it." `pagesAdvD.tsx`: a YOUR PAGE-2 CONTRACT card above STEP 1 when three are chosen. Guides p2 / p20 updated. | F4 | not seen on screen | FIXED |
| 13 | Post-Production: % fell 33 → 31 after answering | `readiness.ts:118-122, 167-182, 266-276`: the stage number is decisions made minus 0.02 per open attention finding. The second answer (Pitch ticked, "Not discussed with anyone") OPENED a finding ("A performance is being altered without an agreement"), so readiness honestly dropped; answering "Yes — agreed" clears it and the number rises. | none | n/a | n/a | NOT A BUG (a readiness number, designed to count open findings; documented in the guide `preprodScreenGuides.ts:87`) |
| 14 | Post-Production stage 7: +0.4 dBTP gives no finding | `postprod/logic2.ts:269-274` fires only when `brief.true_peak_max` is set; nothing covered "above 0 dBTP, no ceiling". | `postprod/stage7.data.ts` + `postprod/logic2.ts`: new attention rule `finish-true-peak-over-zero-no-ceiling` ("True peak above 0 dBTP, with no ceiling to check it against", fix: record the ceiling in stage 1, lower the limiter, re-measure). Rule count pin 136 → 137 in `productionEngine.test.ts` with the owner's words. | F4 (2) | not seen (production labs have no harness route; full-app route needs a project) | FIXED |
| 15 | Save-failure message guesses "free up some space" | `ProductionStageScreen.tsx:190, 329-330`. A write also fails when the list cannot be read or the project is gone (`projectStore.ts:283-293`). | `ProductionStageScreen.tsx`: banner and VoiceOver line say what happened and what to do ("Re-enter it …; if it keeps happening, close the app and open it again"). | F4 | not seen (needs a failed write) | FIXED |
| 16 | "1 required decisions made" | `ProductionStageScreen.tsx:380`, `ReadinessMeter.tsx:81,134`, `packet.ts:260,274`. | `packet.ts` `decisionsMadeText(n)` used in all five places; "N questions answered" pluralised too. `productionFollowups_20261004` pin updated with the owner's words. | F4 | not seen | FIXED |
| 17 | Exercise numbers skip 3 and 6 | `ProductionLabScreen.tsx:586`: the number shown is the STAGE number; a project type hides some exercises. | Numbered 1..n in the list shown, with " · stage n" after the title. | F4 | not seen | FIXED |
| 18 | New project shows red "Not Ready 0 / 100" (quick win 15) | `ReadinessMeter.tsx:38-40`: red whenever the verdict is not_ready. | Grey (textMuted) while nothing is answered and nothing blocks; red from the first answer, and whenever a blocker is open. | F4 | not seen | FIXED |
| 19 | Section 8: saved practice projects deleted within 1-2 s in the shared preview | See "The wipe" below. | none | n/a | n/a | NOT A BUG (preview-only: several app instances share one browser storage) |
| 20 | Pre/Post stage rows read "0 required · 0 answered" (reads as "nothing required") | `ReadinessMeter.tsx:192`. | "0 required decided · 0 answered". | F4 | not seen | FIXED |
| 21 | Post-Production exercise 1: "One named person" did not tick | `postprod/logic2.ts:500-505` ticks for one name; G4's miss was the wipe (item 19). Found on the way: the check accepted "Sam and Jo" while the stage's own finding (`postprod/logic.ts:84-88`) calls that a committee. | `postprod/logic.ts` exports `looksLikeGroup`; the finding and the check share it. | F4 (2) | not seen | FIXED (the inconsistency); the reported miss NOT A BUG |
| 22 | Beginning p8: trade-off line waits for audio while the picture already shows the fix | `pagesC.tsx:53-54, 82`: the line followed the last HEARD fix; the picture follows the tapped one. | The line follows the fix on the picture. Guide line updated. | F4 | not seen on screen | FIXED |
| 23 | "This project is not on this device" (seen by G4 under the wipe) | `ProductionStageScreen.tsx:345` | Adds "If you made it on this phone, go back to the lab home and open it from there." | none (copy) | not seen | FIXED |
| 24 | Silent first step (WHERE TO START needs sound) | Beginning p5, p8, p10; Advanced p4, p6, p7, p8, p10, p11, p12, p14, p19, p20; Mastering M1 S3, M5 S3, M6 S2 opened on ▶ / "listen". | Each `start` line now opens with something a sound-off learner can do and see (each drawing / readout verified to change without audio: G4's notes and the code), then "With sound on, play …". All ≤ 40 words; budgets pass. | F4 (BM 3 pages) + the three screen-guide suites | not seen on screen | FIXED |

## The wipe (section 8): why saved projects vanished in the shared preview

**Verdict: preview-only. No code path deletes a signed-in member's saved projects except the deliberate account wipes (sign-out, a different account signing in, single-device displacement, account deletion).**

- On the web, every tab of `localhost:8142` is a separate app LAUNCH, but all tabs share ONE `localStorage` (AsyncStorage on web).
- Each launch runs `useAccountLocalSync` (`accountLocalSync.ts:169-263`). When the launch's session read CONFIRMS no account, it is a "guest launch" and runs `wipeGuestLaunch()` (`accountLocalSync.ts:104-112, 205-206`) = `clearLocalAccountData({ total: true })`, which removes every `ape:*` key except `GUEST_KEEP` (`clearLocalAccountData.ts:200-220`). `ape:production:preprod:v1` / `postprod:v1` (`projectStore.ts:27-30`) are not on it; `ape:dev:entitlement` is, which is why the coordinator's override survived.
- In the preview the "member" is the dev entitlement override, not a real Supabase session, so every tab load is a guest launch. With many auditor tabs loading and reloading (and Metro reloads while agents edit), that wipe ran every second or two over everyone's storage. G4's own probe key vanishing while its tab sat idle is exactly this: another tab's launch wiped it.
- On a phone there is one app instance. The guest wipe runs once per launch, before the guest can do anything (`claimGuestLaunchWipe`, `:87-94`). A member's launch reads their uid, finds the same marker and returns without wiping (`syncLocalToIdentity`, `:54-58`); an offline member whose session read fails is never treated as a guest (`:227-247`).
- So the Pre/Post persistence G4 could not judge should be checked with ONE preview tab open, or on a phone.

## SHARED NEEDS

1. **`src/screens/lab/meter/vizMeters.tsx` (LoudnessView, line 1416-1449, and the TP label at 1666-1668), owner: the Meter lab's group.** Mastering M6 S1's LOUDNESS face prints `TP ${sim.truePeakDbtp}` from `simulateLoudness`, whose sample peak is not the rendered waveform's (Kick: face "TP −5.0 dBTP" while the bezel now says TRUE PK +2.0). Proposed (additive, same pattern as `targetLufs` / `gainDb`): add an optional prop `truePeakDbtp?: number` to `LoudnessView`; when given, use it (plus `gainDb`) for the TP label and the `over` test at line 1473 instead of `s.truePeakDbtp`. Default undefined keeps the Visual Audio Analysis lab byte-identical. I would then pass `truePeakDbtp={teach.tp}` from `mod6Loudness.tsx:63`. (The deeper cause, `meterEngine.ts:327` authoring a sample peak unrelated to `renderSignal`'s, also shows in the Meter lab itself; that is that group's call.)

Notes for other owners (not needs from me):
- `LabEndScreen` / `PagedLab` (S2): the 13-times sentence is already being handled by S2 (quick win 17, `mixingHandsOnCredit_20261014.test.ts:59-66`). My labs pass `handsOnDetail` unchanged, so they pick it up.
- The PagedLab sound-off path (phase 2): 9 Beginning and about a third of Advanced pages can only be finished with sound; that is the shared "needs sound" mechanism.

## What I did not check, and why

- On screen: see the "Seen on screen" column. The production labs have no `#labpreview` route; the full-app route creates a project, which a second agent's tab load would wipe (item 19), so their screens were checked by test and code only.
- Failures in the related-test run that are NOT in my files (left for their owners): `accountWipeRegistry.test.ts` (`features/intro/screenIntros.ts`, `features/audio/soundSafetyAck.ts#resetSoundSafetySession`, S-group files) and `labHubUnreadable_20261003.test.ts` (Cymatics home and module screens).
- Mastering items G4 raised that are orientation, not bugs (name drift STEREO / "Stereo / spatial", QUIET MID / "Quiet song in the middle", M8 card wording "What do you ask for?", M7 card 4 is a fill-in "…are…" prompt, not a fragment): left for the owner / phase 2.
- **On screen: nothing in this round was seen on screen.** Three tabs over about 15 minutes: the preview never served the app (the bundle request stayed pending; the page body stayed empty), and two of my tabs were navigated or closed by other agents. The whole-project `tsc` currently stops on syntax errors in another group's file, `src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx` (665-774, an unclosed JSX block, likely mid-edit), which would also break the web bundle. Everything here is for the checker round.
- `npx tsc --noEmit`: the whole project stops on that Foundations file (8 syntax errors, none mine). A type check of my labs' entry screens and everything they import (`MasteringLabScreen`, `BeginningMixingLabScreen`, `AdvancedMixingLabScreen`, `MixingGuideScreen`, the four Production screens) through a scratch tsconfig that extends the repo's: **0 errors**.
- The OOM on the first `tsc` run was memory pressure from parallel agents; reran with a larger heap.


---

# Phase 2 (2026-11-14): the shared mechanisms filled in for F4's labs

**Summary:** done in all six labs where a mechanism applies. 35 F4 tests pass (12 new in phase 2). The pinned suites I touched pass after updates: screenGuide_mastering, screenGuide_mixing-beg, screenGuide_mixing-adv and mixingHandsOnCredit; each moved pin carries the owner's words. No `npx tsc`; every changed file passes the TypeScript parser, and the web bundle built (HTTP 200) before the screen checks. 0 held, 1 shared need (below).

## Beginning Mixing and Advanced Mixing (PagedLab, ▶ comparison rows, no rack)

| Mechanism | Done? | file:line | Test | Seen on screen |
|---|---|---|---|---|
| Silent path: a ▶ refused because sound is off now records that version as LOOKED AT; every listening goal reads it, so all 16 Beginning pages (and every Advanced page) can be finished sound-off. That ends "13 pages still to finish". | yes | `mixing/kit.tsx` (`useMixPlayback`: `studied`, `heard` = heard ∪ studied, `play()`'s refused branch) | F4 "the silent path" (2) | YES. Beginning p4: ▶ MIX A → Sound Safety sheet → KEEP SOUND OFF; ▶ MIX B → no sheet (S1); "Looked at (not heard: sound is off): MIX A · MIX B."; the vote buttons appeared; voting B ticked "✓ Vote A vs B blind"; the caption then showed "B's bar sits 3 dB higher". |
| "Sound off?" line above every ▶ row (own words) | yes | `mixing/kit.tsx` `MIX_SOUND_OFF_LINE`, `<SoundOffLine>` in `AbPlayer` | F4 | YES (p4) |
| NEEDS SOUND tags | not needed | With the silent path every goal can be met and seen; S3 says tag only what cannot be done silently. | — | — |
| `BezelItem.silent` / bezel captions | n/a | No rack, no bezel in these labs. | — | — |
| Check card | already per-option | The pages' `UnderstandingCheck` (tuning/components/check, not mine) already takes a `wrong[]` reason per option, and every mixing check passes one; the component already counts misses (checkFeedback.ts). | — | — |
| End screen: each unfinished row names its own goals | yes | `BeginningMixingLabScreen.tsx` `BEG_PAGE_DETAIL` (16), `AdvancedMixingLabScreen.tsx` `ADV_PAGE_DETAIL` (20), `pageDetail={pageDetail}`; HANDS_ON_DETAIL now said once (S2's HOW A PAGE COUNTS). End guides updated. | F4 (2) + screenGuide pins | not seen (end screen not reached) |
| endGuide `intro.start` state-neutral | yes | both end guides | F4 | — |
| Arrival order | nothing to declare | No tray/console popup of their own; the ProNote already waits (S1 automatic). | — | — |
| Accuracy chip (D37) | Beginning → `accuracyVariant="about"`; Advanced keeps the full chip | The owner's 2026-10-31 ruling ("too repetitive and doesn't need to be on every screen"; keep it on labs with REAL-WORLD numbers) names no lab. The "kept" comment in the screen files was the implementer's reading, not a per-lab owner decision. Beginning's meters read its own rendered mixes, so it gets ABOUT (the comment quotes the rule). Advanced shows LUFS / true-peak estimates, like Mastering, so it keeps the full chip. | F4 | YES: the chip reads ABOUT on Beginning p1 |

## Mastering (MasteringRack on RackUnit; its own practice cards)

| Mechanism | Done? | file:line | Test | Seen on screen |
|---|---|---|---|---|
| Per-option reason on every wrong pick (43 cards, about 120 lines). Module 4's eight-option bank has a "what this tool is for" line, overridden per card where a sharper reason exists. First miss = `✗ NOT QUITE — TRY ANOTHER. <reason>`; a second, different miss adds the full explanation. | yes | new `mastering/masteringWhy.ts`; `mastering/kit.tsx` `wrongLine()` and ScenarioCard. The 8 practice guides' wrong-pick line is updated. | F4 (3): every wrong option covered, ≤ 30 words, no line quotes the right answer, no two alike in a card, US spelling | YES. M1 card 1: Mix revision → "✗ NOT QUITE — TRY ANOTHER. The whole mix leans dull on every system…"; then More information → the reason plus the full explanation. |
| Balanced option lengths | DONE in the checker-C2 round (see the end of this report) | The right answer is the longest option on several cards (r3, r4, m3, l1, l2, d5). Re-wording options changes the `correct` strings that recorded answers and the screen guides quote. Report only: the owner may want the cards' wording reviewed as a set. | — | — |
| "Sound off?" line (own words) on the three LISTEN steps | yes | `MasteringRack.tsx` now passes `soundOffLine` / `captionsId`; `mod1What.tsx`, `mod5Workflow.tsx`, `mod6Loudness.tsx` | F4 | YES (M1 S3) |
| `BezelItem.silent` | not needed | `useMasterPlayback.ts:342-350` already measures offline with sound off (quiet pre-render), so the LISTEN readouts show real values, not "—". | — | — |
| Bezel captions (first visit) | yes | `kit.tsx` measure/match bezels (PEAK "highest sample", TRUE PK "smoothed peak", LUFS "how loud", PLR "peak over loud", MATCH "fair compare"); mod3 SPL / BASS / TREBLE / PER DAY; mod4 OUT AT 0 IN / CORRELATION / LUFS (I); mod6 FOLD; mod8 GAP / MAX STEP | F4 (all ≤ 14 characters) | YES ("smoothed peak" under TRUE PK on M1 S3) |
| FINISH · SEE WHAT'S LEFT | already | The module strip already ends in FINISH; no LabShell check. | — | — |
| End screen: rows count what is LEFT ("5 decisions still to answer on its PRACTICE step"; Module 8: "N track decisions still to answer, then the QC checklist" / "The QC checklist: check every line."); the rule said once via `howItCounts` | yes | `MasteringLabScreen.tsx` `endDetail()`, `howItCounts` | F4 + screenGuide_mastering pin | not seen |
| endGuide `intro.start` state-neutral | yes | `masteringScreenGuides.ts` | F4 | — |
| Accuracy chip | kept (full) | Measuring lab (LUFS / true-peak / PLR estimates, NIOSH SPL), as the owner's rule says. | — | — |

## Mixing Guides (reading lab, LabEndScreen)

| Mechanism | Done? | file:line | Test | Seen on screen |
|---|---|---|---|---|
| End screen: the read rule said once (`howItCounts`); rows carry none (every row would repeat it) | yes | `MixingGuideScreen.tsx` | F4 | not seen |
| endGuide `intro.start` state-neutral | yes | `mixingGuidesScreenGuides.ts` | F4 | — |
| Silent path, captions, check card, arrival | n/a | No sound, no bezel, no quiz. | — | — |
| Accuracy chip | kept | Prints real-world SPL / loudness figures (owner rule; `MixingGuideScreen.tsx:140-143`). | — | — |

## Pre-Production and Post-Production

| Mechanism | Done? | Why |
|---|---|---|
| Silent path, captions | n/a | No sound, no rack bezel. |
| Check card | n/a | Exercises are live checklists, not quizzes; each line already says what it needs. |
| End screen | n/a | No LabEndScreen; the packet's WHAT'S LEFT already lists each open item by name (`readiness.ts` `projectLeftItems`). |
| Accuracy chip | kept, "practice" variant | Owner rule 2026-10-31 (Production labs keep the practice chip). |

## SHARED NEEDS (phase 2)

1. (Repeated from phase 1, still open.) `src/screens/lab/meter/vizMeters.tsx` LoudnessView: an optional `truePeakDbtp` prop, so Mastering M6's LUFS face prints the same TRUE PK as the bezel.
2. (None.) The mixing labs’ shared check (`tuning/components/check.tsx` + `checkFeedback.ts`) already counts misses and shows each option’s own `wrong[i]` line, so the second-miss rule needs nothing from me.

## Not checked, and why (phase 2)

- On screen, the end screens (Beginning / Advanced / Mastering / Mixing Guides WHAT'S LEFT) were not reached. The preview reloads every few seconds while other agents edit, and it reset my Mastering tab to step 1 once mid-walk. These are pinned by tests.
- The mixing labs' measured numbers (Beginning p4 bars, Advanced p6 PEAK / RMS / CREST) still need a render, and the mixing kit renders only with sound on (`kit.tsx` pre-render rule: no audio-session work before the learner has enabled sound). A silent learner sees the drawing change and the goal tick, but not those numbers. Splitting the DSP measurement from the player load (as `useMasterPlayback.ts:342-350` does) is the next step. I left it out because it touches the render queue, the double-tap guard and the fence; it needs its own careful pass and a phone check.
- Preview data I changed by normal taps: the Beginning p4 vote (B), and Mastering M1 card 1 answered (a wrong first pick, recorded in the dev store).
- Other groups' red tests in the related run, not mine: `labHubUnreadable_20261003` (Cymatics), `screenGuide_cable_20261031:442` (connector select `pageDetail`), `auditR2_A_D_labs` (fxLabConfigs), `auditR2_A_C_features_tools` (soundsystems faults), `wiringFix_r4_soundsystems` (a syntax error in a Sound Systems file).


---

# Checker C2 fixes (2026-11-14)

| # | C2 finding | Verified | Fix (files) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| FAIL 2 | Beginning + Advanced Mixing checks: the right answer is obviously the longest | My measure (right ÷ longest wrong, by characters) found 14 of 34 checks over 1.4 and 3 more at 1.37-1.40, worst `pagesAdvA.tsx` 110 vs 39 and 97 vs 46. | `pagesC.tsx` (1 check), `pagesAdvA.tsx` (4), `pagesAdvB.tsx` (4), `pagesAdvC.tsx` (4), `pagesAdvD.tsx` (4). The right answers are shorter and some wrong ones are fuller. `correct` indexes, explanations and every per-option `wrong[]` reason are unchanged and still true of the new wording. All 34 are now ≤ 1.27 (most ≤ 1.1). No guide or test quoted the old wording (searched src/ and test/). | F4 "no right answer stands out by length" (all 34 measured, ≤ 1.4) | YES. Advanced p2: "Copy the same plugin and settings onto all nine tracks now" / "Build one shared bus for them now — the plan should have had it" / … | FIXED |
| FAIL 3 | HOW A PAGE COUNTS said "This page counts as done once…" above a list, and never said goals must be met in one visit | `kit.tsx` `useVisitGoals`: the chips live in `useRef(goals.map(() => ctx.isDone))`, so a remount (leaving the page) starts them empty. C2's report is right. | `kit.tsx` `HANDS_ON_DETAIL` = "A page counts once all its goals are met in one visit; leaving a page before then clears its marks. NEXT moves on without counting it." Three pins updated, each with the owner's words: `mixingHandsOnCredit_20261014`, `screenGuide_mixing-adv_20261031`, `screenGuide_mixing-beg_20261031`. | F4 "HOW A PAGE COUNTS says … ONE visit" | YES: Advanced WHAT'S LEFT shows it under HOW A PAGE COUNTS, with each row's own goals below | FIXED |
| Re-check | Mastering cards I had left unbalanced in phase 2 | **Saved answers are keyed by CARD ID, not by option text or index.** `masteringProgress.ts:33-35` `answers: Record<string, boolean>` (scenario id → "right on the first pick"), and the card rebuilds a recorded right answer from the CURRENT text: `mastering/kit.tsx` ScenarioCard, `const picked = pickedHere ?? (recorded === true ? s.correct : null)`. So rewording is safe, and my phase-2 reason for leaving them was wrong. | Balanced. Measured precisely, only 5 cards were over 1.3 (t4, t7, e1, w1, w5); the six I named in phase 2 were within 1.3. `masteringContent.ts`: the triage option "More information from the client" is now "Ask the client first" (t4, t7, e1 and TRIAGE_OPTIONS); w1's and w5's wrong options are fuller. `masteringWhy.ts` keys, the two guide lines, and the Module 1 and 8 intros follow. `screenGuide_mastering` pin updated with the owner's words. Docs: only the audit file quotes the old label. | F4 "Mastering … at most 1.3×" + "a recorded answer is keyed by card id" | not seen (Mastering not reopened this round) | FIXED |

Checks: 2,269 tests across every suite that names the mixing or mastering files pass, 0 fail. Every changed file passes the TypeScript parser. `curl` of the 8142 bundle returned 200. No tsc.


---

# Phase 3 (2026-11-14): the owner's decisions, F4's labs

**Summary:** 9 done, 0 held, 2 shared needs (strip noun, below). 50 F4 tests pass (15 new in phase 3), 3,002 of 3,007 in every suite naming my files. The 5 failures are other groups' files: Foundations nav lock, F6's howItCounts, the Cymatics module screen, Mic Selection, and a new loop in MikingRack. Every changed file passes the TypeScript parser, and the 8142 bundle returns 200. No tsc, no commits.

| # | Decision → item | What I did (file) | Why | Test | Seen on screen |
|---|---|---|---|---|---|
| 1 | Done = work done: Mixing Guides counted a guide as read on NEXT › | `MixingGuideScreen.tsx`: `beforeAdvance` removed; **MARK AS READ is the one thing that counts a guide.** `howItCounts`, the reader and end guides (`mixingGuidesScreenGuides.ts`) and the hub card line all say "reach its end and tap MARK AS READ". Stored reads are untouched: `readRecord`/`readProgress` are unchanged, and nothing removes an id. | A reading guide has no check, so its work is reading it. MARK AS READ sits at the guide's foot, after the 13th section, so tapping it means the learner reached the end and says so. Counting by scroll position would credit a fast scroll; this is honest and already built. | F4 (2) + `screenGuide_mixingGuides` pins moved (owner's words) | not seen (preview did not load in my tab) |
| 1 | Other F4 labs that credit on opening? | Checked: Mastering credits on answered decisions + the QC list; both mixing labs on goal chips; Pre/Post on every stage complete (`complete.ts`). None credits on opening. | — | — | — |
| 2 | "Mixing guide 1 of 50" | Header subtitle is now "Mixing guide" (· read). | — | F4 | not seen |
| 2 | Other N-of-total in my labs | Mastering M7 CONFIRMED "0 / 6" → "6 LEFT" / "✓ ALL" (bezel, tray key and the delivery-sheet drawing); M8 "3 of 8 match the key" → "5 lines to look at again" / "Every line matches the key"; M8 "0 of 9" → "9 lines left to check"; Advanced p2 "0/3 chosen" → "3 more to choose". Kept as VALUES, not progress: Mastering STAGE 4 / 5 and FLOW 1 / 7 (slider positions, like FRET 3 of 12), STAGES 0 / 5 (slots in the chain), the Production readiness score "/ 100" (a score, not a count of done items), and the packet table's "Row n of m" (a screen-reader table position). | Owner's rule: a count of what is LEFT stays. | F4 (3) + `masteringToddlerPass2` pin (owner's words) | not seen |
| 2/3 | "MODULE n / 50" and "MODULE n / 16" on the shared strip; one progress word per lab | Not my file: the strip is `kit/labNav.ts` (S2). See SHARED NEEDS 1 and 2. Each of my labs already uses one word everywhere else: **page** (both mixing labs), **guide** (Mixing Guides), **module · step** (Mastering), **stage** (Pre/Post). | — | — | — |
| 3 | Plain one-line model note instead of all-caps badges | Mastering: `modules/shared.tsx` `PLAIN_MODEL_NOTE` (one sentence per badge, ≤ 87 characters); `MasteringRack.tsx` passes `modelNote` (S3), so every rack step shows it. Mixing labs: no rack, no badge. Mixing Guides, Production: no model badge. | — | F4 (every badge has a note; one sentence, no all-caps word) | not seen |
| 3 | "drawing…" placeholder | Automatic on the first frame (S3). Mastering's LISTEN glass already shows a "STOPPED · PRESS ▶" line, never an empty box; the mixing labs draw synchronously in SVG. | — | — | — |
| 3 | LEARN-first, tray ⓘ | n/a: my labs are not LabShell rack labs with LEARN tabs, and Mastering's trays have no `helpKey` lessons. | — | — | — |
| 5 | Advanced Mixing pages 7, 8, 10, 11, 13: two lessons per page | **FOLDED, not split.** Each page's second lesson (THE ADVANCED TOOLKIT ×2, THE SET-DESIGN TOOLKIT, THE TOOLKIT, THE MOVES) now sits under a `GO DEEPER ▾` key (`mixing/kit.tsx` `GoDeeper`) below the page's main experiment. All content is kept, and the toolkit goal stays on each page. Guide lines name the fold. | Stored progress is keyed by page INDEX (`pagedProgress.ts`, `ape:mixing-adv:v1` `completed: number[]`). Credit is one server key per page (`trainingLabKeys.ts` MIXING_ADV_PAGE_IDS, 20 ids, used by the certificate requirements). A split would change every later index AND need new server keys: a server change in another group's file. The fold keeps every stored record meaning what it meant, with nothing to migrate. | F4: an OLD record `{completed: [6,7,9,10,12]}` still maps to the same five pages; 20 titles in the same order; 20 credit ids | not seen |
| 5 | Mastering module 1 step 3 | The beginner core now leads: "What to listen for at matched level", a two-line how-to, and the MATCH-off volume warning (kept in view: it is about safe volume). The mechanics, the measured numbers, the TRUE PK note, the faceplate and the honesty notes fold under `HOW THIS COMPARISON WORKS · GO DEEPER ▾` (`mastering/kit.tsx` `GoDeeper`). All text is kept. | — | F4 (order + every passage still present) | not seen |
| 5 | Pre-Production stage 1's 33 questions | `ProductionStageScreen.tsx`, for every stage of both labs: each section shows its **required** questions first, then folds its optional ones under `N MORE QUESTIONS · OPTIONAL · GO DEEPER ▾`. A fold opens by itself when one of its questions is already answered or marked not applicable, or when WHAT'S LEFT sent the learner to it (`focus`), so no answer or link is ever hidden. Stage 1 now opens on its 17 required questions. The schema, rules, readiness and packet are untouched (screen order only). | Stage 1 is named, but every stage is a long phone form (G4), and one rule for all stages keeps both labs alike. | F4 (2) | not seen |

## SHARED NEEDS (phase 3)

1. **`src/screens/lab/kit/labNav.ts` (S2), the strip noun.** The strip always reads "MODULE n / N" (`labNav.ts:32-34`, `NavNoun = 'MODULE' | 'STEP'`). That is N-of-total, and the wrong word in my labs.
   - Proposed: an optional `noun` on `useLabNav` options ('PAGE' | 'GUIDE' | 'MODULE', default 'MODULE').
   - The strip would print the noun and the unit's own number or name, with no total: "PAGE 7 ▾", "GUIDE · POP ▾", "MODULE 3 · STEP 2 ▾".
   - I would then pass `noun: 'PAGE'` (Beginning and Advanced Mixing, via PagedLab) and `'GUIDE'` (Mixing Guides).
2. **`src/screens/lab/kit/PagedLab.tsx` (S2):** pass that `noun` through from a PagedLab prop (the mixing labs already pass `noun="page"` to LabEndScreen through PagedLab).

## Not checked (phase 3)

- On screen: the preview did not finish loading in my tab within about 40 s (the bundle was rebuilding under many agents' edits). Every phase 3 item is "not seen on screen", for the checker round. The bundle URL itself returned 200 before and after.


## Phase 3 · S2 noun API adopted (2026-11-14)

- Both mixing labs: `<PagedLab … unitNoun="page">`, so the strip, CONTENTS and the end screen say PAGE, as every guide and goal line already does (`beginningMixingScreenGuides.ts:601` "HOW A PAGE COUNTS" now matches). Every mixing page is already declared `manualDone: true` (S2 ratchet: mixing 0).
- Mixing Guides: wrapped once in `<LabNounProvider value="guide">`; the strip shows the style name (`posLabel`, e.g. "GUIDE · POP") with no total. The end screen's `noun="guide"` agrees, so it stays.
- Mastering: "module" (the default) on the strip and the end screen; no `noun` prop to drop.
- This closes my phase-3 SHARED NEEDS 1 and 2.
- Tests: F4 plus screenGuide mixing-beg / mixing-adv / mastering / mixingGuides and mixingHandsOnCredit: 337 / 337 pass. Parse-check clean; the bundle returns 200. Not seen on screen.


## Checker K2 fixes (2026-11-14)

| K2 finding | Fix | Test | Seen on screen |
|---|---|---|---|
| Pre-Production: FOLD THE OPTIONAL QUESTIONS did nothing once an optional question was answered | `ProductionStageScreen.tsx`: `foldChoice[section] ?? autoOpen`. The automatic opening (an answered or N/A optional question, or WHAT'S LEFT focus) is only the starting state; the learner's tap decides after that. | F4 | not seen (production labs have no preview route) |
| "·  required" double space | `FieldRow.tsx:55` → " · required" | F4 | not seen |
| Advanced p8 (and 7, 10, 11, 13): the check draws on the folded list | `mixing/kit.tsx` `GoDeeper`: `openWhen` opens the fold by itself once the page's first goal (its experiment) is met, with sound or by the silent path. While closed it says "The check below draws on this list; it opens by itself once the experiment above is done." After that the learner's taps decide. | F4 | YES, tab fronted. p8: the closed fold showed the note; ▶ NO DUCK → KEEP SOUND OFF → ▶ KICK DUCKS BASS ticked "✓ Hear the kick duck the bass" and the fold opened (FOLD ▴, Serial compression listed). |
| Mastering model note said "your phone's uncalibrated output" in the browser too | "this device's uncalibrated output" in `modules/shared.tsx`, the M1 S3 Honesty point, and both mixing labs' accuracy notes | F4 | not seen |

Tests: F4 + screenGuide mixing-adv / mastering / preprod / postprod, masteringLabStructure, productionEngine and every FieldRow suite: 814 / 814 pass. Parse-check clean; the bundle returns 200.
