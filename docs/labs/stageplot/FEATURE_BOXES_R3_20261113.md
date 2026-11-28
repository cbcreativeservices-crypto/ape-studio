# Stage boxes, round 3: the held items, built (2026-11-13)

Builder F. Owner's go: "build the remaining held items too" (FEATURE_BOXES_R2 section 7). Nothing is committed; the lead commits. No git, eas, server or SQL commands were run. package.json, `useLabNav.ts`, `modules/`, index.ts, metro.config.js and image files were not touched. Builders G (label placement, shapes) and H (symbols) were working at the same time; their files were left alone, and shared files got small targeted edits only.

## 1. What was built

### 1. A sub-snake's returns come through the main box
- **Model:** optional `SpStageBox.retFeed` (`{ first, last }`): the main box's returns that carry the sub-snake's returns. The main box is the sub-snake's own `feed`.
- **Edits:** `spSetBoxReturnFeed`. With no range, it takes the first run of main-box returns that no mix and no other sub-snake uses, the same way the input feed does.
  - A feed is never longer than the sub-snake has returns.
  - Plugging the sub-snake straight into the console, or into another box, drops the return feed.
  - `spUpdateBox` never touches it, and a copy keeps it.
- **Words:** "SB2 · return 1 (via SB1 · return 7)"; "SB2 · returns 1 (L) – 2 (R) (via SB1 · returns 5–6)".
  - A return past the feed reads "(not carried: SB2's returns reach SB1 on returns 7–8 only)".
  - A return that is not connected reads "(its returns are not connected to SB1 yet)".
- **Which boxes give returns:** a sub-snake's returns are offered only once they reach a box that connects to the console (`spReturnsReach`, `spReturnsUsable`).
- **AUTO-ASSIGN RETURNS:**
  - Never gives a mix the main box returns that carry a sub-snake.
  - Uses the sub-snake for the mix nearest it.
  - Skips a return that goes nowhere (a chain).
  - Decides "odd start" for a stereo pair by the main box's return number.
- **Review questions** (each with GO TO the sub-snake, field `retFeed`):

  | Rule | Level |
  |---|---|
  | `box-ret-feed-overlap` (a carrying return also given to a mix or another sub-snake) | Must correct |
  | `box-ret-feed-past` (past the main box's returns) | Must correct |
  | `box-ret-feed-short` (a mix, or a sub-snake below it in a chain, on a return the feed does not carry) | Must correct |
  | `box-ret-feed-none` (a mix on a sub-snake's return, with no feed said) | Question |

- **Screens:**
  - Box editor: "WHERE ITS RETURNS COME FROM", with "Not chosen yet" / "Returns of SB1", first and last return, the example "SB2 · return 1 (via SB1 · return 7)", and warnings.
  - Monitors and the box editor's lines: "7–8 · to SB2 returns 1–2 (sub-snake)" and "Its returns come through SB1 returns 7–8." Returns that are not carried are listed as such, not as free.
- **Paper:**
  - Patch summary: "5–8 to SB2 returns 1–4 (sub-snake)" on the main box. On the sub-snake: "its returns come through SB1 returns 5–8; its own returns: 1–2 M4, …".
  - When a sub-snake exists, one muted line says what "sub-snake" and "via" mean.

### 2. L/R, and a stereo sidefill at two boxes
- **Return cells:**
  - "SB1 · returns 3 (L) – 4 (R)" on the mix card, in the editor, in both monitor plan tables and in the text summary.
  - A split mix names the stage side: "SB2 · return 3 (L, stage left) (via SB1 · return 7), SB1 · return 9 (R, stage right)".
- **Model:** optional `SpMix.retR` (the R side's own return). `spMixReturnSpots` lists every return a mix takes. Every check uses it: shared return, past the count, the box lines, the patch summary, AUTO-ASSIGN.
- **By hand:** in the mix editor, "R (right) side of this mix": "Right after L (SB1 · return 6)", "Another return on SB1" or "On SB2". It is shown only for a sidefill, a drum fill or a custom mix, or to take a split back.
- **AUTO-ASSIGN:** a stereo sidefill whose stage-left and stage-right speakers stand nearest different boxes gets its L (stage left, the performers' left) on one box and its R on the other. The result sentence says so.
- **Patch summary:** "9 M5 (R, stage right; L on SB2)" and "3 M5 (L, stage left; R on SB1)".
- **Review:** `return-split-one-place` (must correct). An in-ear, headphone or wedge mix split across two boxes is refused: it goes to one place.

### 3. A band-rig mix that still holds a return
- **Question** `return-band-rig` (GO TO the mix's return field): "M2 is made on your band's own monitor console, but it still has SB1 · return 2. Does it still need that return? …"
- **How it is answered:**
  - choose No return yet; or
  - turn on the new switch "It still uses this return" (optional `SpMix.retKeep`); or
  - request return lines from the venue.
- **Until it is answered,** the packet cell reads "SB1 · return 2 (to be confirmed)".
- **AUTO-ASSIGN RETURNS** takes off a return it chose itself. A return chosen by hand stays.

### 4. The transmitter fallback
With no transmitter drawn, AUTO-ASSIGN chooses a rack in this order:
1. a rack that already holds a drawn transmitter;
2. a rack named for in-ears or radio;
3. the drawn rack nearest the mix's performer (the owner's rule);
4. the first rack, only when the performer is not drawn.

The result says which rack and why: "M3: its transmitter is not on the plot, so AUTO-ASSIGN RETURNS used IEM rack at upstage right (its name says in-ears or radio) and gave M3 a return on SB1, the box nearest that rack. …"

### 5. The box size on the label
- **Label text:** "SB1 16/8" on the stage drawing and the printed plot. When returns are not given, the label is "SB2 8 in", because "SB2 8" would read like socket 8.
- **Where:** only the label TEXT changed, through the existing functions `stageName` (stageLinks.ts) and `objectLabel` (spPacket.ts), via `spBoxPlotLabel`. Placement is Builder G's.
- **Legend:** one line, only with a box drawn: "A stage box is named with its size: SB1 16/8 has 16 inputs and 8 returns."

### 6. Learner points 20 and 21
- **(20)** Every on-screen text now says AUTO-ASSIGN SOCKETS or AUTO-ASSIGN RETURNS in full (BoxPanel, InputEditor, monitorPlan, MonitorsArea). A test scans the source.
- **(21)** `SP_BOX_HELP` went from 156 words to about 115. The engineer checked it, and asked for the splitter and the PA-amplifier returns to be added. It says "network type", as the Connects to hint does.

### 7. The box note
The learner reviewer recommended a label, and the engineer agreed. It now reads "… Supplied by the venue. Note: By the keys."
- Without the label, the band's words run into the generated facts.
- The editor placeholder is now "Shared with the support act", so it no longer invites a location that can contradict the plot.

## 2. Saved fields and schema
- New fields: `SpStageBox.retFeed`, `SpMix.retR` and `SpMix.retKeep`. All are optional and absent by default. Schema stays 2.
- `spMigrate` handles schema 1 and 2. It keeps a real range or return, and drops junk (deleted, not nulled).
- `scrub` drops:
  - a return feed with no feed;
  - an R return without an L, on a mono mix, or on a box that is gone.
- Copies re-point `retR` at their own boxes.

## 3. Files

| File | What |
|---|---|
| `src/features/stageplot/spTypes.ts` | `retFeed`, `SpReturnFeed`, `retR`, `retKeep` |
| `src/features/stageplot/spModel.ts` | scrub, broken refs; `spBoxPlotLabel`; round-3 block after `spSetBoxFeed` (`spReturnsReach`, `spReturnsUsable`, `spReturnVia(Words)`, `spReturnFeedWords`, `spSetBoxReturnFeed`, `spMixReturnSpots`, `spMixReturnsOn`, `spMixSplit`, `spMixMaySplit`, `spSetReturnKeep`, `spAssignReturnR`); `spReturnWords`/`spReturnWordsOn`; AUTO-ASSIGN RETURNS; `spUpdateBox`; copies; `spMigrate` |
| `src/features/stageplot/spDerive.ts` | `SpBoxUse` returns by spot + `retFedBy`/`retFeedClash`/`retFeedPast`/`retFeedShort`; `spBoxMoreWords`; the stereo-with-two-devices open item |
| `src/features/stageplot/spReview.ts` | the four return-feed rules, `return-band-rig`, `return-split-one-place`, `return-over` text by spot |
| `src/features/stageplot/spPacket.ts` | `objectLabel` box size; legend line; `returnCell`; "Note:"; sub-snake line |
| `src/screens/lab/stageplot/stage/stageLinks.ts` | `stageName` box size |
| `src/screens/lab/stageplot/inputs/BoxPanel.tsx` | `SP_BOX_HELP`, hints, "Where its returns come from", card badge/subtitle, placeholder |
| `src/screens/lab/stageplot/inputs/InputEditor.tsx` | AUTO-ASSIGN SOCKETS wording |
| `src/screens/lab/stageplot/monitors/MixSheets.tsx` | L/R fields, "R (right) side of this mix", "It still uses this return" |
| `src/screens/lab/stageplot/monitors/monitorPlan.ts` | free return, shared return, box lines, AUTO-ASSIGN result words, R hint |
| `src/screens/lab/stageplot/MonitorsArea.tsx` | AUTO-ASSIGN RETURNS line |
| `test/stagePlotBoxesR3_20261113.test.ts` | new, 23 tests |

**Existing tests changed on purpose** (each is marked in the file):
- `stagePlotBoxesMore_20261113`: "SB1 · returns 5 (L) – 6 (R)"; the box note "Note: By the drum riser."
- `stagePlotShapesBoxes_20261113`: the plot label "SB1 16 in".

## 4. Tests and proof
- **Tests:** `node --test --test-timeout=120000 test/stagePlot*.test.ts` gave 1039 tests, 1039 pass, 0 fail.
- **Type check:** `npx tsc --noEmit -p .` shows no stage plot errors.
- **Byte-identical proof:** Builders G and H were changing the output at the same time; salsa and thrust already differ through their work. So the proof isolates mine:
  - A snapshot of `src/features/stageplot` was taken before any edit.
  - A "mine-only" tree was built from it with only my change blocks applied. Others' blocks were listed and left out (tool: `scratchpad\r3tools\mine_only.py`).
  - Rendered with `sp_render.mjs`, `fsb_render.mjs` and `r2_render.mjs` (copies taking a root path: `scratchpad\r3tools\`):
    - **All 30 example PDFs are byte-identical** (5 bands × Letter/A4 × full/plot/compact).
    - The thrust and round plots are byte-identical.
    - The boxed, wings and round-2 plots differ only by the box label size, the legend line, "Note:", the sub-snake line and L/R.
- **Rendered and read as images:** a round-3 test plot (`scratchpad\r3tools\r3_render.mjs`):
  - the four-piece band;
  - SB1 24/12;
  - SB2 8/4, a sub-snake into SB1 9–16 with returns through SB1 5–8;
  - a stereo sidefill split SB2/SB1;
  - M2 on the band's console holding a return;
  - the transmitter not drawn, two racks.

## 5. Browser
- **Setup:** my own tab at `http://localhost:8142/#labpreview/StagePlotLab`, at 390×844, 375×667 and 320×640.
- **Steps:**
  - ADD A STAGE BOX twice. SB2 is 8 inputs, analog, 2 returns, a sub-snake into SB1, with returns from SB1 7–8.
  - AUTO-ASSIGN SOCKETS, then AUTO-ASSIGN RETURNS. M2 went to "SB2 · return 1 (via SB1 · return 7)".
  - On M4 Keys (wired in-ear) the R choice is not offered. Set to Sidefill, it is, and "On SB2" gives "SB1 · return 5 (L, stage left), SB2 · return 2 (R, stage right) (via SB1 · return 8)".
  - M2 set to Band monitor console: the question appeared. GO TO opened M2 at its return with the new switch, and turning the switch on answered it.
- **Results:**
  - `scrollWidth` equals the width at 320 and 375 on Stage, Inputs and Monitors.
  - No console errors.
  - "SB1 16/8" and "SB2 8/2" are in the page text. At 320 wide the stage drawing leaves the box names out where it is crowded; that is Builder G's placement.
- **Not pressed:** DOWNLOAD PDF, SHARE, PRINT, sign-in, purchase and Sound Safety.
- **Closing:** the tab was closed and the viewport reset to desktop.
- **Reload:** the preview reloaded once on a file change, and the steps were repeated.

## 6. Reviews and what was done
A fresh live-sound engineer and a fresh learner-clarity reviewer read the code, the PDF pages and the phone screens.

| Finding | Done |
|---|---|
| The R choice was offered for in-ear mixes; a transmitter or headphone amp takes L and R together (engineer) | Fixed: offered only for sidefill, drum fill or custom. A split in-ear, headphone or wedge mix must be corrected (`return-split-one-place`) |
| `return-band-rig` could not be answered while keeping a split request (engineer) | Fixed with the switch "It still uses this return" (`retKeep`) |
| Chains of sub-snakes were not checked; AUTO-ASSIGN used returns that go nowhere (engineer) | Fixed: `retFeedShort` counts sub-snakes below; AUTO-ASSIGN and the editor's pick skip returns that do not reach the console |
| A bare L/R clashed with "overhead L and R as the audience sees the kit" (both) | A split mix now says "L, stage left" / "R, stage right" everywhere, and the result says L and R are named as the performers see the stage |
| A sub-snake's returns not carried were counted as free (engineer) | Fixed in the patch summary and the box lines ("Not carried to SB1: 3–4") |
| A return feed could be longer than the sub-snake's returns (engineer) | Clamped; the field's maximum follows |
| The main box line did not say what each carrying return goes to (engineer) | "5–8 to SB2 returns 1–4 (sub-snake)" |
| "how its 2 sidefills are fed" asked of a stereo mix with two devices (engineer) | No longer asked for a stereo mix with two devices of a kind |
| The transmitter fallback could pick a wedge-amp rack (engineer) | Rack holding transmitters first, then one named for in-ears/radio, then the owner's "nearest the performer" |
| "SB2 8" reads like socket 8 (engineer); no key for the size (both) | "SB2 8 in"; a legend line explains the size |
| "past what its returns carry" unclear (engineer) | "(not carried: SB2's returns reach SB1 on returns 7–8 only)" |
| Odd-pair start through a sub-snake (engineer) | Tested on the main box's number |
| M2's cell looked settled while the question is open (engineer) | "(to be confirmed)" |
| SP_BOX_HELP gaps: splitter, PA-amplifier returns (engineer); "format" vs "type" (learner) | Added; "network type" |
| Two "SB1" choices; "Not connected yet" read as a fault; duplicate headings; "its" ambiguity; long question texts; the AUTO-ASSIGN line too long at 320 (learner) | All reworded as suggested |
| The packet never explains sub-snake / via (learner) | One muted line, only when a sub-snake exists |
| Box note label (learner, decide together) | "Note: …" kept, as recommended; placeholder changed |

## 7. Still not built, and why
| Item | Why |
|---|---|
| Renaming the venue-feed choice "Return lines from the house position to the stage" to "…(from FOH or the monitor position)", and a new choice "An input split and return lines" (engineer) | That word list (`SP_VENUE_FEED_WORD`) is in `spCatalog.ts`, Builder H's file this round, and a new choice changes the saved type. The "It still uses this return" switch answers the question without it. For the lead to give to H, or to do after this round |
| The same "→ SB2 sockets 1–8" mapping on the main box's socket line (engineer 7, inputs half) | That line is round-2 socket wording that existing tests pin. The returns half was built |
| Parentheses in "SB2 · returns 1 (L) – 2 (R) (via SB1 · returns 5–6)" (learner 15) | Kept: the owner's brief gave the form "SB2 return 1 via SB1 return 7" printed as "SB2 · return 1 (via SB1 · return 7)" |
| Box names on the 320-wide stage drawing when crowded | Label placement is Builder G's work |
| Not checked on a phone | As for the rest of the lab |

## 8. Pictures
In `C:\Users\profe\Downloads\2026-11-13_STAGE_PLOT_NEW_FEATURES_PICTURES\`:
- `60_phone_sub_snake_returns_through_SB1.jpg`: the box editor
- `61_phone_mix_editor_L_R_on_two_boxes.jpg`: the mix editor
- `62_phone_monitors_returns_via_SB1.jpg`: RETURNS ON THE STAGE BOXES
- `63_pdf_plot_box_labels_SB1_24-12.png`: the plot page with "SB1 24/12" and "SB2 8/4"
- `64_pdf_patch_summary_and_monitor_plan_returns.png`: the patch summary and the monitor plan, side by side

## Round 3b: the three items left in section 7, built (lead's go, 2026-11-13)
Owner: "build the remaining held items". Builder H had finished, so `spCatalog.ts` was free to edit. Builder G's files (label placement and shapes) were not touched.

### 1. What the band asks of the venue (engineer review)
- **The new choice:** "An input split and return lines to the stage" (`SpVenueFeed` value `'split-returns'`). It is for a band monitor console at the monitor position, which needs both.
  - It is listed in the mix editor, the monitor plan's "requested from the venue" lines and the packet's "Who creates it" cells.
  - The hint `SPM_FEED_HINT` explains it on its own line.
- **The renamed choice:** `'returns'` now reads "Return lines to the stage (from FOH or the monitor position)". The hint says return lines come from FOH (the desk in the audience) or a monitor position.
- **Review and packet:** `spVenueGivesReturns` covers both values.
  - `return-band-rig` is not asked when the band requests return lines, with or without a split.
  - The packet cell then prints the return without "(to be confirmed)".
- **Saved values:** schema stays 2. A new allowed value was added; no field was added.
  - `spMigrate` keeps every known value.
  - An unknown saved value becomes "to be confirmed".
  - No example uses `'returns'`. A plot that chose it prints the new name; that is the requested rename.

### 2. The via form (learner review)
- **Sockets:** no brackets inside brackets. "SB2 · 3, via SB1 · 11"; a chain reads "SB3 · 2, via SB2 · 6, then SB1 · 14".
- **Returns:** "SB2 · return 1, via SB1 · return 7"; "SB2 · returns 1 (L) – 2 (R), via SB1 · returns 7–8".
- **A split mix:** its two sides are separated by a semicolon: "SB2 · return 3 (L, stage left), via SB1 · return 7; SB1 · return 9 (R, stage right)".
- **Where it shows:** the input list, the input rows, the Box · socket column, the return cells and the box editor examples. The packet's sub-snake line uses the same form.
- **Kept in brackets:** the status words "(past its feed to SB1)" and "(not carried: …)", because they are a note, not a place.

### 3. The socket line (engineer review)
- **Patch summary:** "sockets 9–16 from SB2 sockets 1–8 (sub-snake)". It mirrors the returns form, "5–8 to SB2 returns 1–4 (sub-snake)".
- **The main box's socket list:** "9–16 · from SB2 sockets 1–8 (sub-snake)".
- **The box card:** "sockets 9–16 from SB2" and "returns 5–8 to SB2".

### Tests changed on purpose
Each is marked "owner 2026-11-13: build the remaining held items".
- `stagePlotBoxesMore_20261113`: the via form (four assertions) and the socket line (two).
- `stagePlotMonitors`: the renamed return-lines line, the hint's five lines and the return-lines hint text.
- `stagePlotBoxesR3_20261113`: the via form, and the split's semicolon. Three new tests:
  - the split-and-returns choice;
  - saved values;
  - the socket line.

### Checks
- **Tests:** `node --test --test-timeout=120000 test/stagePlot*.test.ts` gave 1042 tests, 1042 pass, 0 fail.
- **Type check:** `npx tsc --noEmit -p .` shows no stage plot errors.
- **Byte-identical:** the same mine-only proof as in section 4 was run again. All 30 example PDFs and the thrust and round plots are byte-identical (40 files). The playback example's "An input split" is unchanged.
- **Browser, own tab at 320 wide:**
  - The input rows read "SB2 · 1, via SB1 · 1".
  - SB1's socket list reads "1–8 · from SB2 sockets 1–8 (sub-snake)".
  - M2's editor lists the six venue choices with the new and renamed words.
  - `scrollWidth` was 320, and there were no console errors.
  - The tab was closed and the viewport reset.

### Picture
`C:\Users\profe\Downloads\2026-11-13_STAGE_PLOT_NEW_FEATURES_PICTURES\65_pdf_round3b_via_socket_line_split_and_returns.png` shows packet pages 3 and 4 side by side: the Box · socket column with ", via", the patch summary socket line, and M2 "Requested from the venue: an input split and return lines to the stage".

### Still open
Nothing from section 7 except the two items outside my area: the box names left off a crowded 320-wide stage drawing (Builder G's placement), and a phone check (as for the rest of the lab).
