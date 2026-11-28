# Stage shapes, round 2: wings with a thrust, names inside the stage, the round's audience (2026-11-13)

Builder D. The owner said "Yes, build them all" about the items held from the stage-shape feature. Nothing is committed: the lead commits.

**Rules kept**
- No git, eas, server or SQL. package.json, `useLabNav.ts`, `modules/`, index.ts and metro.config.js were not touched. No image file was touched.
- Builder C's and Builder E's areas were left alone. Shared files got small targeted edits only (listed below).
- Browser: my own tab only. DOWNLOAD PDF, SHARE, PRINT, sign-in, purchase and Sound Safety were never pressed. The tab is closed and the viewport reset to desktop.

## 1. Wings together with a thrust

**The model.** Wings are now an on/off option of a rectangle or a thrust, never the round. The shape is one of three: Rectangle, Thrust, In the round.

| What | Where |
|---|---|
| `SpStage.wings?: boolean` (absent = off). Only a field was added; the schema stays 2 | `src/features/stageplot/spTypes.ts:392` |
| `'wings'` stays in `SpStageShape` as a value that is only ever read (the morning's saved plots) | `spTypes.ts:370` |
| `SpStageForm`, `SP_SHAPES` (three), `SP_WINGS_HINT` | `src/features/stageplot/spShape.ts:39`, `:49` |
| `spShapeOf` reads `'wings'` as `'rect'`. `spHasWings` is on for a rectangle or a thrust (or a saved `'wings'`), never in the round. `spIsShaped` means anything but a plain rectangle | `spShape.ts:63`–`:79` |
| `spWingRects`, `spShapeBounds` (tongue and wings together), the grid, the move reach and the on-stage test all follow `spHasWings` | `spShape.ts:116`, `:128` |
| `spShapeWords`: a thrust with wings says both, the tongue first | `spShape.ts:289` |
| `spSetStageShape` takes `wings`. An old `shape: 'wings'` call becomes a rectangle with wings | `src/features/stageplot/spModel.ts:1008` |
| `spMigrate`: a saved `'wings'` loads as rectangle + wings on. A junk flag is removed. Schema 1 and schema 2 both read | `spModel.ts:1653` |
| The first stage box goes in a wing on a thrust with wings too | `spModel.ts:1268`, `src/screens/lab/stageplot/stage/StagePalette.tsx:123` |

**The packet** (`src/features/stageplot/spPacket.ts`):
- `:608` shaped-label placement uses `spIsShaped`.
- `:961`–`:970` the size note. Sized: "24 ft × 16 ft (confirmed); thrust 10 ft × 8 ft; wings 6 ft each". With no sizes: "Not to scale; a thrust reaches into the audience at the front, with wings at each side".
- `:981` the deck. A rectangle with wings keeps `shape: 'wings'`, so old plots stay byte-identical. A thrust with wings is `'thrust'`, and its wings are in `areas`.
- `deck.stage.wings` is at `spDocTypes.ts:106`.
- `:1013` the legend line.
- The HTML sheet, the export preview and the PDF already draw `deck.areas`, so they needed no change.

**Screen:**
- `StagePlanView.tsx:375` draws the shape with `spIsShaped`, and `stageGeom.ts:427` draws the grid in the tongue and both wings.
- The inspector's hint uses `spIsShaped` (`StageInspector.tsx:161`).

**Setup** (`SetupArea.tsx`):
- Three shapes, each with its plain line.
- `:457` the switch "Wings at each side" (Rectangle and Thrust only), with one plain line.
- `:487` "Width of each wing" when wings are on.
- The guide line is updated (`guides/setup.ts:31`).

## 2. On the phone, a name never crosses the stage's edge (every plot)

`src/screens/lab/stageplot/stage/stageGeom.ts`:

**What the plan keeps off: `stageFloorOf`** (`:623`) gives the lines of the stage exactly as they are drawn:
- the rectangle's outline and its front lip (from 1 unit inside the front edge to 3.5 units past it);
- a shape's outline, its 4-unit front edges and the wings' dashed edges;
- the round's rim.

**The test: `stageCrossesFloor`** (`:674`) checks a box, with 1.5 units of air, against those lines.

**The options: `stageLabelPlan(…, opts)`** gains two:
- `floor`: no name, number or mix code lies across a line. On a shaped stage, an on-stage object's name stands on the floor (`StageLabelIn.onStage`, `:469`).
- `peopleApart`: a performer's name keeps 8 units from any other label (`LABEL_PEOPLE_APART`, `:601`). At 4 units the dark text halos still met: "Luisito" sat over "Yolanda" at 375 wide.

**Order and the last place:**
- The selected object is placed first (`:937`).
- A performer with no clean place nearby tries places farther out, with a leader (`LABEL_STEPS_FAR`, `:587`).
- Then a place off its floor (never across a line, never touching).
- Only then is the name left out and counted in `peopleOut` (`:580`). The selected object always keeps its name (`lastPlace`, `:951`).

**Numbers with no clean place** are left out and counted (`numbersClear`), as on the shaped stages.

**The view and the area:**
- `stageScreenLabelOpts(p, T)` (`:716`) is what the view asks for on every plot (`StagePlanView.tsx:349`, `:355`).
- The area reports `peopleOut` (`StagePlanView.tsx:367`, `StageArea.tsx:201`). The note adds: "N performers’ names are not shown at this size, so no name touches another or crosses the edge of the stage."
- The numbers sentence now ends "…so nothing is covered and nothing crosses the edge of the stage."
- The last line now reads "Press ZOOM IN to see every name and number."

**With no options, the plan is exactly what it was.** A test pins this.

**Result.** Geometric check of the five examples and the salsa band with boxes, at 390, 375 and 320 (each plot's own glass):
- 0 labels across a line, 0 in the frame, 0 overlaps, 0 performer names closer than 4 units to another label.
- Every performer named, `peopleOut` empty.
- The same holds with every object selected in turn (324 selections), and at zoom 1.5×, 2× and 3×.

Thrust, round, wings and thrust-with-wings plots (four-piece and salsa) are clean too.

**Cost.** More equipment is shown by its number alone, or without numbers, at 375 and 320. For example, the salsa band at 320 shows 0 of 21 equipment number rows, where they used to print over each other (17 overlaps before).

**Browser, measured from the rendered SVG** (real Oswald widths) at 390, 375 and 320, five examples: no label across the deck, none in the frame, no two labels touching.

## 3. The round says "audience" on every side

- `stageRoundFrameWords` (`stageGeom.ts:735`), drawn at `StagePlanView.tsx:606`.
- The top band reads "FAR SIDE · AUDIENCE ON ALL SIDES", with the audience words in amber. The bottom reads "FOH SIDE" in amber, with its arrows. STAGE RIGHT and STAGE LEFT stay in the side bands, which are too short on a phone for "(AUDIENCE)".
- At 320 the top line measures 183 of 298 units in the browser, at 10 pt. A 12-letter reference name still fits between the arrows (a test checks this).
- The printed packet is unchanged: it says "(AUDIENCE)" on all four sides.

## Tests

**New file `test/stagePlotShapesMore_20261113.test.ts`, 31 tests:**
- Model, migration, and old-wings identity (PDF, HTML and text equal four ways).
- On-stage, words, grid, reach, size notes, legend, deck and text view.
- HTML, preview and PDF.
- Review, first box, Setup and view pins.
- The screen-geometry checks above: an independent line model, with selections and zoom.
- Left-out counting, the plan unchanged with no options, floor lines, and the round words' fit.

**Mutation checks:**

| Part undone | Tests failing |
|---|---|
| `floor` | 13 |
| `peopleApart` | 13 |

The file was restored and compared with `cmp`.

**Tests changed on purpose**, each marked "owner 2026-11-13: build them all — names stay inside the stage":
- `test/stagePlotBugtestR2_20261113.test.ts`: the "Every performer is named" pin, and the five-argument `leftOutRef` call.
- `test/stagePlotStage.test.ts`: the same two pins, the `peopleOut` count and sentence, and the ZOOM IN line.
- `test/stagePlotShapeLabels_20261113.test.ts`:
  - `screenPlan` now mirrors the view (`stageScreenLabelOpts`, `onStage`);
  - the view pin is now `stageScreenLabelOpts(p, T)`;
  - the "no options keeps its last resort" check is kept.

**Runs:**
- `node --test --test-timeout=120000 test/stagePlot*.test.ts`: **928 tests, 928 pass, 0 fail**.
- During the run, Builder E's `stagePlotSymbolsMore`/`SymbolsR2` work in progress failed twice; it passed by the final run.
- `npx tsc --noEmit -p .`: 0 errors.

## Byte-compare proof (rectangles unchanged)

**Baseline.** A copy of `src/features/stageplot` was taken at HEAD fe8a85c0, before any builder's edits: `…\scratchpad\r2\base\`. "Base + mine" (`r2\mine\`, built by `r2\mkmine.sh`) is that copy with only my edits.

| Compare | Result |
|---|---|
| `r2\bytes.mjs`: 42 rectangle plots (the five examples, the 22-symbol plot and the boxed salsa band; Letter and A4; full, compact and plot), plus 18 old-wings plots. PDF bytes (`cmp`), and SHA-256 of the HTML sheet, the 390/375/320 previews and the text | **60 of 60 byte-identical** |
| `sp_render.mjs` (copy with a root switch): five examples × 2 papers × 3 packets, base = live tree = base + mine | **30 of 30 identical** |
| `fsb_render.mjs` (copy with a root switch): thrust, round, wings, boxed, Letter and A4 | **16 of 16 identical** (wings is now drawn as rectangle + wings) |

The live tree, with Builder C's and E's work in it, differs only in:
- boxed/wings full and compact (C's "Box return" column);
- the 22-symbol plot (E's symbols).

The five examples are identical in the live tree too.

## Images looked at

**Phone crops (dark):**
- solo 390; duo 390 and 320; four-piece 390, 375 and 320; playback 390, 375 and 320; salsa 390, 375 and 320.
- Thrust with wings, 390; round, 390 and 320.
- All are in `…\scratchpad\r2\shots\`.

**PDF pages:**
- `r2\tw_out\`: twL_p1, twA_p1, twPlotOnly_p1, twPlainFull_p1, stwL_p1, stwA_p1.

**Setup:** the switch, its hint and the wing width field, at 320 and 390.

**After-pictures** in `C:\Users\profe\Downloads\2026-11-13_STAGE_PLOT_NEW_FEATURES_PICTURES\`:
- `40_pdf_thrust_with_wings.png`
- `41_phone_thrust_with_wings.png`
- `42_phone_salsa_320.png`
- `43_phone_round_audience.png` (390 above, 320 below)

## Reviews

**Independent visual reviewer** (21 images, given no conclusions): **no label across a stage line, and no name touching another label.**

| Finding | Done |
|---|---|
| "Leo M2 6" at 375 read as Leo's channel 6 | Fixed by the 8-unit rule; nothing is now within 14 units of Leo |
| "Keys 9–10" and "Yolanda M2" end at the frame's inner line at 320 | Inside the frame; held |
| Names printed over neighbours' drawings at 320 and 375 (salsa, "Maya" over the IEM tag) | The existing last resort for performers; held |
| "Drum riser" caption beside the amp on the printed four-piece | A riser's name goes under its own box; this is not the shapes' code. Held |
| Bare numbers whose owner is unclear on crowded phones (playback "1–4", salsa "M3", the "6" in the wing on the salsa thrust) | Held |

**Live-sound and learner reviewer:**

| Finding | Done |
|---|---|
| The wings hint said "out of the audience’s sight" | Fixed: "usually out of the audience’s sight" (Setup only; the printed legend is kept byte-identical) |
| The wing-width hint was vague | Fixed: "How far each wing reaches out from the side of the stage." |
| The guide line suggested wings go with all three shapes | Fixed: "…A rectangle or a thrust can have wings…" |
| The ZOOM IN line spoke of names only | Fixed: "…every name and number." |
| "wings 6 ft wide each" | Not done: the brief's own wording is "wings 6 ft each" |
| The round's FOH hint | Held: not this round's change |
| "Outside the stage" and "Off the stage" | Held: not this round's change |
| SR/SL WING spelled out | Held: not this round's change |

## Held, and why

1. **The selected "Keys headphone amplifier" on a plain thrust with wings at 320.**
   - Its name crosses a line in one of 360 shaped selections.
   - No place keeps the rules there, and the selection's name is never left out (it is the only readout).
2. **The reviewer's points listed above as held.** They are older wording or layout rules, outside this round.
3. **The export preview on a phone scrolls sideways.** It is 520 wide, as it is for every plot (`SP_PLOT_MIN_W`).
4. **Not checked on a real phone.** The checks were in the web preview, which reloaded several times while the other builders saved.
