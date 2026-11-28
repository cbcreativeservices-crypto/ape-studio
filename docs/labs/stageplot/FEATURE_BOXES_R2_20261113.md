# Stage boxes, round 2: returns, sub-snakes, a band's digital box (2026-11-13)

Builder C. The owner's go: "Yes, build them all" (the items held from the stage-box feature). Nothing is committed: the lead commits. No git, eas, server or SQL commands were run. package.json, `useLabNav.ts`, `modules/`, index.ts and metro.config.js were not touched, and no image files were touched.

## 1. What was built

### Monitor returns tied to mixes
- **Model:** `SpMix.ret` (`{ boxId, ret, byHand }`, null = none yet) and `SpMix.fromConsole` ("From the console"). A stereo mix takes `ret` and the next return.
- **Edits:** `spAssignReturn` (by hand), `spSetFromConsole`, `spReturnWords` ("SB1 · return 3", "SB1 · returns 3–4", "From the console").
- **AUTO-ASSIGN RETURNS** (`spAutoAssignReturns`, its own button in Monitors; one edit, so one UNDO puts every return back):
  - Covers mixes requested from the house console (or "who creates it" to be confirmed) that have no return. It skips "From the console", a mix the band makes on its own rig or personal mixers, and any return chosen by hand.
  - The box nearest the mix's drawn devices.
  - A wireless in-ear mix goes to the box nearest its drawn transmitter (or a drawn rack). With neither drawn it is left for the student, and the result says why.
  - A stereo pair starts on an odd return (1–2, 3–4). Only when no odd start is free does it take any two side by side.
  - A sub-snake's returns are never used: they reach it through its main box.
- **Screens:**
  - Mix editor: "Stage box return (where the mix comes back to the stage)" with No return yet / SB1 (has 8 returns) / From the console. Under it, the return number, "Chosen by you / by AUTO-ASSIGN RETURNS", and warnings for a shared return or a return past the count. An in-ear line shows while the mix has no return.
  - Mix cards: "Stage box return: …".
  - Monitors: a new section, RETURNS ON THE STAGE BOXES. It has each box's returns, return by return, AUTO-ASSIGN RETURNS with its result in words, and two help popups ("Returns and wedges", "In-ear mixes and returns": a wedge is one return; an IEM mix goes to its transmitter, which sits with a monitor console or in a side rack).
  - Box editor: "Returns of SB1" with GO TO MONITORS.
- **Paper:**
  - A "Stage box return" column in the full and compact monitor plans, only when a box has returns. Cells read "SB1 · return 1", "No return yet", "From the console, not a stage box", or "–" for a mix the band makes itself.
  - A muted line under the table: the returns are the band's suggestion.
  - Patch summary: "returns 1 M1, 2 M2, 3–4 M3, 5–6 M4, 2 free" (return by return, as the engineer review asked; the brief's "returns 1–6: M1–M5" form hid which return carries which mix). The text summary says the same.

### A sub-snake that feeds another box
- **Model:** `SpStageBox.feed` (`{ boxId, first, last }`, null = straight to the console). `spSetBoxFeed`:
  - With no range given, it takes the first run of the main box that nothing uses.
  - A loop, a box feeding itself, and a DIGITAL box are refused, and nothing changes.
  - `scrub` also drops a feed to a box that is gone, a saved loop, and the feed of a box made digital.
- **Words:**
  - `spBoxVia` / `spBoxViaWords`: "SB2 · 3 (via SB1 · 11)", chains "SB3 · 2 (via SB2 · 6, SB1 · 14)", and "(past its feed to SB2)".
  - `spBoxPatchWords` carries the via words, so the input list's Box · socket column, the row and the band table all show them. The column is wider only when a sub-snake exists.
- **AUTO-ASSIGN SOCKETS:**
  - It never uses the sockets a sub-snake plugs into.
  - It fills a sub-snake only up to what its cable carries.
  - `spBoxFreeSocket` (the input editor's pick) skips those sockets too.
- **Screens:**
  - Box editor: "Where this box plugs in". The choices are "Straight to the console", or "Into SB1's sockets (this box is a sub-snake)"; boxes that would make a loop are not listed. Below that are the first and last socket on the main box, the via example, and warnings.
  - A digital box gets one line instead: it joins over the network.
  - The main box's socket list shows "9–16 · SB2 plugs in here (a sub-snake)", and its card shows "sockets 9–16 take SB2".
  - The input editor warns when a socket is taken by a sub-snake, and says where a sub-snake's socket arrives.
- **Patch summary:** "sockets 9–16: SB2 (sub-snake)" on the main box; "a sub-snake, plugs into SB1 sockets 9–16" on the sub.

### A question for a band's own digital box
- `SpStageBox.connectsTo` (at most 40 letters) and `connectsTbc`.
- Asked once (question level) for a digital, band-supplied box: "Which console does SB1 connect to? A digital stage box only works with a console that speaks its format. Type the console under Connects to, or mark it to be confirmed." GO TO opens the box at "Connects to".
- It is answered by typing the console, or by the switch "Console not known yet (to be confirmed)". The switch makes an open item: "Stage box SB1: which console it connects to".
- The patch summary prints "connects to Behringer X32, AES50", or "which console it connects to is to be confirmed".

### Review questions (each with GO TO)
| Rule | Level | Goes to |
|---|---|---|
| `return-twice`: a return given to two mixes | Must correct | The mix, its return field |
| `return-over`: a return past the box's count (a stereo mix's second one too) | Must correct | The mix |
| `returns-short`: more returns needed than the main boxes have, while a box has returns | Question | The first mix with no return |
| `box-feed-overlap`: a sub-snake's sockets also given to inputs or to another sub-snake | Must correct | The sub-snake, its feed |
| `box-feed-past`: the feed runs past the main box's size | Must correct | The sub-snake |
| `box-feed-short`: an input on a sub-snake socket that its cable does not carry | Must correct | The sub-snake |
| `box-console`: a band's digital box with no console named | Question | The box, Connects to |

A main box that only carries a sub-snake is no longer asked about as "nothing plugged in".

### Schema
No schema change: still 2. `spMigrate` reads plots saved at schema 1 and 2 with every new field blank. Junk falls back safely: a bad return or feed becomes null, a non-text console becomes '', a non-boolean becomes false. A return or feed pointing at a missing box is dropped, a saved loop is broken, and schema 3 is refused.

## 2. Files (file:line)

**New**
- `test/stagePlotBoxesMore_20261113.test.ts` (43 tests)
- `docs/labs/stageplot/FEATURE_BOXES_R2_20261113.md` (this file)

**Changed**

| File | What changed |
|---|---|
| `src/features/stageplot/spTypes.ts` | `SpStageBox.feed/connectsTo/connectsTbc` :144–149, `SpBoxFeed` :153, `SpReturnPatch` :158, `SpMix.ret/fromConsole` :219–223 |
| `src/features/stageplot/spModel.ts` | scrub :200–214; broken refs; `spAddMix` defaults; `spAddBox`/`spUpdateBox`; the section "sub-snakes, consoles and returns" :1032 (`spFeedLoops` :1039, `spBoxVia` :1057, `spSetBoxFeed` :1093, returns, `spAutoAssignReturns` :1180); AUTO-ASSIGN SOCKETS reserved range :1411 and sub-snake cap :1452; copies; `feedOf` :1632 and `spMigrate` |
| `src/features/stageplot/spDerive.ts` | open item :335; `SpBoxUse` feed/return fields :357, computed :383; `spBoxLine(u, p)`, `spMixCodeRuns`, `spBoxMoreWords` :484; text summary |
| `src/features/stageplot/spReview.ts` | sub-snake, return and console questions :264–296; `returns-short` :319 |
| `src/features/stageplot/spPacket.ts` | wider Box · socket column :1179; Stage box return column :1237 and in both mix tables; patch summary :1549; suggestion line :1623 |
| `src/screens/lab/stageplot/inputs/BoxPanel.tsx` | help texts :41–47; the box editor's Connects to :158, sub-snake :167 and returns :210; card subtitle and badges |
| `src/screens/lab/stageplot/inputs/InputEditor.tsx` | sub-snake warnings :150 and under the socket field |
| `src/screens/lab/stageplot/inputs/inputsLogic.ts` | socket lines :324, free socket :352, `spSubsOn` :358, `spSocketSub` :366 |
| `src/screens/lab/stageplot/monitors/monitorPlan.ts` | returns helpers and help :736 to the end |
| `src/screens/lab/stageplot/monitors/MixSheets.tsx` | the return field :200, :246 |
| `src/screens/lab/stageplot/MonitorsArea.tsx` | card line; RETURNS ON THE STAGE BOXES :360 |

`spPdf.ts` and `spPacketHtml.ts` needed no change: tables are drawn generically. Nothing of Builder D's or E's (drawing, shapes, symbols, kind lists) was edited. Line endings were kept per file.

## 3. Tests
| Run | Result |
|---|---|
| `test/stagePlotBoxesMore_20261113.test.ts` | 43 / 43 pass |
| `node --test --test-timeout=120000 test/stagePlot*.test.ts` | 897 tests, 895 pass, 2 fail. Both are source pins on `stage/StagePalette.tsx` in `stagePlotStage.test.ts` (B7 "fourteen objects…", "the likely source comes first…"): another builder's work in progress, not this feature's files. Earlier runs also showed failures in `stagePlotShapeLabels`, `stagePlotSymbolsMore` and `stagePlotBugtestR2` (StagePlanView and symbols); they were gone by the final run. |
| `npx tsc --noEmit -p .` | No stage plot errors |

One existing test caught this work: `stagePlotMonitors` "no payment words" (the word "free" and "asked of" in Monitors files). The wording was changed, and the test was not touched.

## 4. Byte-identical proof and PDFs looked at
- **The five examples:** all 30 PDFs (salsa, four-piece, playback, solo, duo × letter/A4 × full/plot/compact) are byte-identical before and after, made with `sp_render.mjs`.
- **`fsb_render.mjs` plots:**
  - thrust and round: byte-identical;
  - plot-only packets: byte-identical;
  - boxed and wings full packets: they differ only by the new Stage box return column ("No return yet" on every mix), because their boxes have returns (8). With that column stripped, the packet text is identical.
  - No saved plot outside today's unpublished box work can have boxes.
- **Read as images** (scratch script `scratchpad\r2b\r2_render.mjs`):
  - four-piece with SB1 (band, digital, 16/8, "Behringer X32, AES50") and SB2 (an 8-socket drum sub-snake into SB1 9–16), sockets and returns auto-assigned: pages 3 (patch summary) and 4 (monitor plan);
  - salsa with SB1 and an SB2 sub-snake: pages 3–5.
  - Checked: the column widths ("SB1 · return 1" on one line), the wider via column, and the page breaks.

## 5. Browser checks
- Own tab at `http://localhost:8142/#labpreview/StagePlotLab`, at 390×844, 375×667 and 320×640.
- What was used:
  - ADD A STAGE BOX twice;
  - SB1: returns, Digital, Band;
  - SB2: 8 inputs, a sub-snake into SB1, first socket 9;
  - AUTO-ASSIGN SOCKETS. The rows read "SB2 · 1 (via SB1 · 9)". The console question appeared, GO TO opened SB1 at Connects to, and typing a console answered it.
  - Monitors: AUTO-ASSIGN RETURNS (1, 2, 3–4, 5–6). Typing M3's return 2 gave the warning and a Must correct question, and that question's GO TO opened M3 at its return.
- `scrollWidth` equals the width at 320 and 375. No console errors.
- The preview reloaded once (other builders), and the steps were repeated.
- DOWNLOAD PDF, SHARE, PRINT, sign-in, purchase and Sound Safety were never pressed. The tab was closed and the viewport reset to desktop.

## 6. Reviews and what was done
A fresh live-sound engineer and a fresh learner-clarity reviewer read the code, the PDF pages and the phone screenshots.

| Finding | Done |
|---|---|
| A digital box shown as a sub-snake "into sockets" (engineer) | Fixed: refused in the model, dropped if made digital, and the editor says it joins over the network |
| A sub-snake's returns come from the main box (engineer) | Partly: the sub's returns are not offered to mixes, AUTO-ASSIGN never uses them, `returns-short` counts main boxes only, and the help says so. Charging a main box return for each sub return is held (section 7) |
| AUTO-ASSIGN SOCKETS overfilled a sub-snake past its cable, and the free count was wrong (engineer) | Fixed |
| Stereo returns starting on an even number; the editor allowed the last return as a stereo start (engineer) | Fixed: odd starts, both in AUTO-ASSIGN and the editor's pick; the field's maximum is count − 1 for stereo |
| "From the console" too general; IEM racks in FOH-only rooms are fed from box returns (engineer) | Help and hints rewritten; the packet says "From the console, not a stage box" |
| The patch summary hid which return carries which mix; "sockets 9–16 take SB2" read backwards (engineer) | Now "returns 1 M1, 2 M2, 3–4 M3…" and "sockets 9–16: SB2 (sub-snake)" |
| The fixture called SB2 a "Percussion sub-snake" though it carried the horns (engineer) | The picture script note was corrected |
| UK "neighbouring"; "for one" idiom; the TRANSMITTER capitals; undefined "feed", "fills", "mono line", "patch" (learner) | Reworded |
| The option "Sockets of SB1 (a sub-snake)" read as if SB1 were the sub; "The console directly" (learner) | Now "Into SB1's sockets (this box is a sub-snake)" and "Straight to the console" |
| Many names for one thing (box return / output / where it comes back) (learner) | "Stage box return" in the field, the cards, the packet column and the help |
| The "Connects to" hint used jargon; the switch label read as half a question (learner) | Rewritten; the switch is now "Console not known yet (to be confirmed)" |
| "the boxes have too few … give a box more returns" (learner) | It now says to correct the number only if the box has more returns than typed |
| The in-ear advice twice on one screen, and shown after a return was chosen (learner) | The hint no longer repeats it; the line shows only while there is no return |
| "none yet" with no next step; one question asking two things (learner) | A next step was added; the question was rewritten |
| "SB1 (6)" chip; the repeated line in the box editor; the long returns help (learner) | Now "SB1 (has 6 returns)"; the repeat was removed; the help was split into two popups |
| The packet's box returns were not marked as a suggestion (learner) | A muted line was added |

## 7. Held, and why
| Item | Why |
|---|---|
| A sub-snake's returns charged against main-box returns ("SB2 return 1 via SB1 return 7") | A second chain of the same kind as the input feed. Today the sub's returns are simply not used. The owner may want it |
| Stereo L/R marked on the return cells, and stereo sidefills placed at two boxes | Minor. The pair is listed as one range; placement uses the mean of the devices |
| A mix the band makes on its own rig that keeps a return chosen earlier | It still prints and is still checked; no question asks about it (minor, engineer) |
| A transmitter fallback that uses the first drawn rack | Minor; the student is told which box was used and can change it |
| A note printed with no label in the patch summary ("…; Drum sub.") | Round-1 format, shared with every box. Left as it was |
| "AUTO-ASSIGN" naming in round-1 texts, and the length of round 1's `SP_BOX_HELP` (learner 20, 21) | Round-1 copy; outside these three items |
| Not checked on a phone | As for the rest of the lab |
