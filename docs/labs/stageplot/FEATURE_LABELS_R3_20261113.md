# Stage Plot, labels round 3: the remaining held items (2026-11-13)

**Owner:** "build the remaining held items too". Repo `C:\Users\profe\dev\ape-workbench`, branch `ota-after-approval-39-23`, on top of 5d2e3e83.

**Rules kept.** No git, no eas, no server or SQL. No change to package.json, `useLabNav.ts`, `modules/`, index.ts or metro.config.js. No image file touched. Builders F and H's files left alone; shared files changed only by small targeted edits. Saved data: one optional field (`stage.roundSides`), schema still 2, `spMigrate` drops any other value. Browser: my own tab only, closed, viewport reset. DOWNLOAD PDF, SHARE, PRINT, sign-in, purchase and Sound Safety never pressed.

## What was built

| # | Item | What it does now | Where |
|---|---|---|---|
| 1a | Selected name on a thrust with wings at 320 | It never crosses a line. With no clean place on the drawing, the band above the drawing says "SELECTED · Keys headphone amplifier" in amber (10 → 9 units, never less), in place of UPSTAGE while it is selected. The selection may lie over a neighbour's drawing only when right against its own symbol. | `stageGeom.ts` `stageLabelPlan` (`readout`), `stageReadoutWords`; `StagePlanView.tsx` |
| 1b | Performer names over a neighbour's drawing (320/375) | A performer's name never covers another drawing, a leader, or a line. Order: the whole name beside the figure → farther out on a leader → the whole name on its own figure (it then covers only the instrument painted under that figure) → a short name ("Iv" = Iván, "AM" = Ana María; unique, 11.5 units) beside, on the figure, or on a leader → left out and counted. The note under the drawing says who is who: "1 performer's name is shortened at this size: Iv = Iván." Selected, the full name always shows (drawing or the band above). | `stageGeom.ts` `placeKept`, `stageShortNames`; `StageArea.tsx` |
| 1c | Bare numbers | A number shown with no name is on a leader, or against its own symbol and at least 2 units nearer it than any other drawing. Otherwise it is left out and counted. | `stageGeom.ts` `owned` |
| 2 | "Drum riser" caption | Screen: only inside its riser (corners, then every place inside); none = left out and counted. A riser's dashed edge is now a line no other name may cross. Print: inside first (finer grid, 1.5 pt from its edge); outside only with no other symbol within 12 pt; otherwise not printed (the key names "Riser (dashed outline)" and the legend says "A symbol with no name beside it is named in the key."). On a shaped stage the platform's name is placed before the performers'. | `stageGeom.ts`; `spPacket.ts` `beside(…, deep)`, `jobFor`, pick order |
| 3 | Salsa A4, "Nelson (M5)" touching the bass amp | Rectangles: after placement, each name is checked as A4 draws it (smallest size, Helvetica widths). One that touches a symbol or a name moves beside its symbol, or nudges up to 4 pt with its leader. Nelson moved 0.05 m (about 2 pt) left. | `spPacket.ts` "A RECTANGLE'S NAMES AS THEY PRINT" |
| 4 | Leaders behind names (22-symbol stress plot) | Screen: a leader never runs through a label or along another leader. Print (shaped): a straight leader, else one bend, else the names in the way move to another place beside their own symbols. Otherwise a name that only repeats the key's ("Steel pan", "Electronic drum kit") is not printed (the key and the text view name it). Later names never sit on a leader. | `spPacket.ts` `farOut`, `makeRoom`; `spPdf.ts`, `spPacketHtml.ts` draw `leader.via`; `spDocTypes.ts` |
| 5 | Objects across a new outline | A change of shape or size moves nothing. Setup (under the shape) and the Stage (under the drawing) name what now stands partly off the stage, or what the change left outside it. One button, MOVE THEM INSIDE (MOVE IT INSIDE for one), moves each the shortest way to a place wholly on the stage. It is one edit, so one UNDO, and it then says what it moved. | new `spInside.ts`, new `InsideOffer.tsx`; `SetupArea.tsx`, `StageArea.tsx` |
| 6 | Export preview scrolling sideways | The plot is drawn at the window's width (page width stays 320 at 320). ZOOM IN: FULL SIZE shows the printed-size plot sliding sideways inside a frame the width of the window (264 wide at 320). The key stays at its readable size under it. | `export/PlotView.tsx` |
| 7 | The round's side names | Setup, in the round: "Name the sides by: FOH side and far side / Clock positions (12 o'clock at FOH) / Numbered sides (side 1 at FOH)". Clockwise as seen from above, so 3 o'clock and side 2 are on the drawing's left. Used on screen (frame bands "6 O'CLOCK · AUDIENCE ON ALL SIDES", "12 O'CLOCK · FOH", side bands "3 O'CLOCK" / "9 O'CLOCK"), in position and facing words ("Toward 3 o'clock", "facing between 1 and 2 o'clock", "Between sides 1 and 2") and in print (four side words, size note, legend, text view). The default saves no field and prints as before. | `spShape.ts`, `spTypes.ts`, `spModel.ts`, `spPacket.ts`, `stageGeom.ts`, `StagePlanView.tsx`, `SetupArea.tsx` |
| 8 | Drum viewpoint note in the round | The examples' note follows the shape: in the round "Overhead L and R are named as the kit is seen from the FOH side." (or "from 12 o'clock (the FOH side)" / "from side 1 (the FOH side)"). On any other shape it reads as before. A note the band wrote itself is never changed. | `spShape.ts` `spOverheadNote`; `spModel.ts` `spSetStageShape` |
| 9 | Note under the drawing | The words now say what is true. Names and numbers are hidden "so that no name covers another name or drawing" (and, for performers, "or runs past the edge of the stage"). Hidden numbers: "there is no clear spot beside their own symbol, inside the stage." "Every performer is named" only shows while every whole name is shown. | `StageArea.tsx` |
| 10 | Setup's shape lines | The shape names are the choices. Only the chosen shape's line is shown, in full. | `SetupArea.tsx` |

## Rectangle prints: what changed, proven

Two builds of the current tree were rendered: one with my rectangle code, one with it switched off (rectangle repair, riser deep places, riser omission). Each ran all rectangle plots: the five examples, the 22 symbols and the salsa band with boxes, on Letter and A4, as full, compact and plot-only packets. For each render, SHA-256 of the PDF, HTML sheet, 390/375/320 previews and the document.

- **30 of 42 renders byte-identical.**
- **12 changed:** the salsa example and the salsa band with boxes, on both papers and all three packets. The only difference in the document is "Nelson (M5)" moving 0.052 m left, with its leader start. One plot document serves every paper, so Letter moves with A4.

Script: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\r3\t\rectproof.mjs`. Results are in `…\scratchpad\r3\proof2\now.json` and `…\off.json`.

Shaped prints change on purpose:
- The riser places and order. Thrust 24 × 16 now prints "Drum riser" inside its riser. Wings 6 ft and the plain-wings four-piece leave it off.
- Leaders: bent, make-room, or name left off on the 22-symbol thrust.
- The round only when a side naming is chosen, or for the overhead note.

## Tests

New file `test/stagePlotLabelsR3_20261113.test.ts`, **71 tests**.

**Screen.** The plan exactly as the view makes it, at 390/375/320 wide, on 23 plots: the five examples, salsa with boxes, and the four-piece, salsa and playback each on a thrust, a square and a circle in the round, with wings, and on a thrust with wings; plus the sized thrust with wings and boxed salsa on a thrust. Each plot is checked:
- with nothing selected, zoomed ×1.5 and ×2;
- with every object selected in turn.

On each, the test checks:
- no label on a label, or over another drawing;
- nothing across a stage line or a riser edge;
- a riser name only on its riser;
- no leader behind a label;
- every bare number owned;
- the selection named in exactly one place;
- every performer named whole, shortened, or counted out.

**Print.** At the placed size, on 30 plots and their plot-only packets, and on rectangles as A4 prints them:
- no row touches a row or a symbol;
- none lies across a line or on a leader (a bent leader too);
- a platform name stays on its platform;
- "Nelson (M5)" is clear of the bass amp;
- bent leaders are drawn as two lines;
- a name left off is named in the key and the text view.

**Round, notes and offers.** Round sides (default unchanged; clock; numbered; fits at 320); the overhead note; MOVE THEM INSIDE (exact set, wholly on, short move, nothing else moves); the export preview; Setup lines; the words.

**Pinned tests updated on purpose,** each marked "owner 2026-11-13: build the remaining held items":
- `stagePlotStage` (note words);
- `stagePlotBugtestR2` ("Every performer is named" condition);
- `stagePlotShapesBoxes` (Setup lines);
- `stagePlotShapesMore` (performers named whole, shortened, or counted; the selection named or in the band above; note words);
- `stagePlotShapeLabels` (performer named or counted out).

**Mutation checks** (one part undone, then restored):

| Part undone | Tests failing |
|---|---|
| Rectangle repair | 3 |
| Strict performer rules | 21 |
| Leader make-room | 2 |

**Commands:**
- `node --test --test-timeout=120000 test/stagePlot*.test.ts`: **1042 tests, 1042 pass, 0 fail.**
- `npx tsc --noEmit -p .`: no stage plot errors.
- Full suite not run.

## Reviews

**Fresh visual reviewer** (screenshots and PDF images, no conclusions given):
- "Maya (M3)" across the riser's dashed edge on the phone. **Fixed:** a riser's edge is now a line no name may cross.
- The "Iv" short name read as a cut-off name. **Fixed in the words:** the note now says the name is "shortened" and gives "Iv = Iván".
- On the phone, items near the circle rim and the thrust edge. The geometric checks (1.5 units of air) find none of these. The phone pictures are small.
- "IEM" on the rim: that is the in-ear symbol's own art, before MOVE THEM INSIDE.
- **Not changed, by the brief's rectangle rule:**
  - salsa A4 "14" between two mics;
  - "Yolanda (M2)" near an unnamed wedge.

  Neither touches anything, and rectangle layouts may change only where a label touches.
- **Not changed (stress plot):**
  - long and bent leaders over drawings;
  - "Tabla" now beside the unnamed steel pan.

  Leaders over drawings are allowed; leaders behind names are not.
- **Not mine:** the riser is drawn solid, not dashed, in the printed sheet.

**Learner reviewer:** the geometry is confirmed (3 o'clock and side 2 on the drawing's left). Applied:
- the shorter, plainer note lines;
- "shortened" instead of "initials";
- "the drawing's left" instead of "its left";
- "Toward side 2" and "Between sides 1 and 2";
- "Partly off the stage: …" and "The new stage shape left … outside the stage.";
- MOVE IT INSIDE for one object;
- "ZOOM IN: FULL SIZE".

Not applied:
- "Describe positions by": the brief gives "Name the sides by" word for word.
- Changing "(a circular stage)": that is existing print wording.

## Held, and why

1. **Pictures 70–78 are from just before the last two fixes.** The riser-edge rule and the final wording came after them, so the four-piece drawings may place Maya's name differently now. The tests cover the final code.
2. **On the phone, very crowded plots at 320 and 375 hide some names.** Salsa at 320 hides up to 4 performers' names. The note counts them and ZOOM IN shows them. The brief's rule (never over a neighbour's drawing) leaves no other place for them.
3. **The selection band is used more often on 320.** It shows for the riser, some amplifiers and microphones on shaped stages: 140 of the selections tested.
4. **In print, a riser too full for its own name.** On the four-piece with wings, at the smallest A4 scale, "Drum riser" is not printed. The key names the riser and the legend says so.
5. **A rectangle drawn up to 15% smaller.** The PDF can draw a rectangle that much smaller when its legend needs the room. The touch check covers the usual A4 size, not that case. No example plot gives way like this today.
6. **Not checked on a real phone, and the zoomed preview was not photographed.** The web preview kept reloading while the other builders saved. The zoomed preview was measured in the page instead: the page is 320 wide and the plot frame 264 wide with the plot inside it 520 wide.

## Pictures

Folder: `C:\Users\profe\Downloads\2026-11-13_STAGE_PLOT_NEW_FEATURES_PICTURES\`

| File | What it shows |
|---|---|
| `70_after_r3_phone320_salsa.jpg` | Salsa band at 320 wide |
| `71_after_r3_phone375_salsa.jpg` | Salsa band at 375 wide |
| `71b_after_r3_phone375_salsa_drawing_crop.png` | Salsa at 375, the drawing only |
| `72_after_r3_phone320_thrust_wings_selected_readout.jpg` | Thrust with wings at 320, the headphone amplifier selected, its name in the band above |
| `73_after_r3_setup_round_name_sides_clock_320.jpg` | Setup, in the round, the side naming set to clock positions |
| `74_after_r3_setup_move_them_inside_offer_320.jpg` | Setup, the MOVE THEM INSIDE offer |
| `75_after_r3_phone390_round_clock_positions.jpg` | The round with clock positions at 390 |
| `76_after_r3_phone390_moved_inside_one_undo.jpg` | After MOVE THEM INSIDE |
| `77_after_r3_setup_shape_one_line_320.jpg` | Setup, only the chosen shape's line |
| `78_after_r3_phone320_export_preview_fits_width.jpg` | The export preview at 320, fitted to the width |
| `79_after_r3_pdf_salsa_A4_page1.png` | The salsa band's A4 PDF, page 1 |
| `79b_before_after_pdf_salsa_A4_nelson_M5_bass_amp.png` | "Nelson (M5)" and the bass amp, before and after |
| `79c_after_r3_sheet_22_symbols_thrust_no_leader_behind_a_name.png` | The 22-symbol plot on a thrust: no leader behind a name |
| `79d_after_r3_sheet_thrust_drum_riser_on_its_riser.png` | Thrust: "Drum riser" on its riser |
