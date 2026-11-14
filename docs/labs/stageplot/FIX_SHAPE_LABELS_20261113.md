# Fix: labels collide on shaped stages (2026-11-13)

**Scope.** Repo `C:\Users\profe\dev\ape-workbench`, branch `ota-after-approval-39-23`, on top of 8e84e3eb.

**Rules kept.**
- No git, no eas, no server or SQL.
- No change to package.json, `useLabNav.ts`, `modules/`, index.ts or metro.config.js.
- No image file touched.
- Browser: my own tab only. DOWNLOAD PDF, SHARE, PRINT, sign-in, purchase and Sound Safety were never pressed. The tab is closed and the viewport reset.

## The defect

On a thrust, and in the round, the printed plot's names ran into each other and into symbols. In `14_pdf_thrust.png`:
- "13" sat on Nina;
- "M4 M4" printed side by side;
- "Lead vocal 11" lay over its microphone;
- "Guitar amp" lay over the amp.

## What caused it

The packet works out every name's place once, in `spPlotDoc`, for one drawing size. The PDF then drew a **shaped** stage **smaller** than that size, while the words kept their size. Two reasons:

1. **A shaped drawing is taller.** A 24 × 16 ft stage plus an 8 ft thrust is 24 ft deep, so the drawing hits its 380 pt height cap. When the page cannot also hold the legend, `drawPlot` lets the drawing give way by up to 15%.
   - The report's thrust plot-only A4 was drawn at 38.6 pt/m.
   - Its names were placed for 56.1 pt/m: 31% smaller.
2. **A plot-only packet is "roomy".** Its names were placed for a 520 pt tall drawing. The PDF only draws it that tall when the page has the room; here it did not.

On top of that, the PDF prints some words wider than the packet's estimate. Helvetica Bold "M4" is 2 pt wider than the estimate, so neighbours that were 1.5 pt apart touched.

**Measured before the fix** (114 PDFs, scale read back from the PDF):

| Plot | Clashes |
|---|---|
| Report thrust | 32 |
| Four-piece on a plain thrust | 9 |
| Salsa on a thrust | 29 |
| Round | 13 |

A clash is a label on a label, or a label on a symbol. The rectangle examples drew at their placed size, which is why they were clean.

## What changed

All of the shaped-stage behaviour is gated on the shape. A rectangle runs exactly the code it ran before.

### `src/features/stageplot/spPacket.ts`

**Names on a shaped stage are placed for the smallest drawing any renderer makes:**
- `:608` `shaped` sets the placement scale. It is the narrowest page (A4, 508 pt) at the usual height, with no roomy enlargement: `SP_PLOT_SHAPED_K = { width: 508, give: 1 }` at `:372`.
- When the drawing is larger than that, each name's box only shrinks toward its own anchor, so a clear place stays clear.

**Words are measured at the PDF's widths:**
- `:353` `spLabelBlockPrinted` gives the same row as `spLabelBlock`, with Helvetica's real widths (never less than the estimate).
- `:795` uses it for shaped stages.
- `:46` imports `spPdfEncode` and `spPdfWidth` from `spPdfFonts.ts`.

**Added after the first independent review:**
- **The shape's own lines.** `:629` `cuts`, `:647` `onLine` and `:663` `onFloor`:
  - A name never lies across the outline, the thrust walls, the circle, or a wing's dashed edge.
  - An on-stage object's name stays on the floor: the stage or a wing, never the audience corner beside a thrust.
- **Leaders** (`farOut`, `:835`–`:880`):
  - A leader runs through no name and no other symbol.
  - A name on a leader keeps 6 pt off other symbols.
  - Each of these is relaxed only when no place keeps it.
  - A later name never sits on a leader.
- **Order** (`:916`): a name goes farther out only after every name of its kind that still has a place beside its own symbol has taken it. Before this, Iván's leadered name took the place beside Carmen.
- **No roomy drawing** (`:1039`): a shaped plot is not drawn larger than its names were placed for. Before this, names drifted off their symbols in the plot-only packet.

### `src/features/stageplot/spPdf.ts`

- `:422` `shapedW: 508`, `shapedGive: 1` mirror the packet's constant. The new test pins the two.
- `:569` `buildPlot` never draws a deck plot smaller than that floor.
- `:1038` `fit()`: when the floor stops the drawing giving way, the legend runs on to the next page instead.
- `:1058` the last-resort layout (a plot that cannot fit an empty page) ignores the floor, so it never overflows the page.

### On-screen Stage drawing

- `src/screens/lab/stageplot/stage/stageGeom.ts:632` `stageLabelPlan(…, opts.numbersClear)`.
- At `:818`, on a shaped stage the last resort ("numbers printed on their own symbol, even over other art") is off. Numbers with no clear place are left out and counted (`numbersOut`). The screen already says so, and they come back on ZOOM IN.
- `StagePlanView.tsx:349` passes `numbersClear: spShapeOf(p.stage) !== 'rect'`.
- This fixed "12" on "M2", and "14" and "13" on "M4", on a thrust at 320 wide.

## A rectangle renders exactly as before (proven)

- A copy of the original sources, rebuilt in the scratchpad (`shapefix/base/`), first reproduced all 114 earlier PDFs byte for byte.
- Then, before and after:
  - **42 rectangle PDFs**: the five examples, the 22-symbol plot and the boxed salsa band; Letter and A4; full, compact and plot. **Byte-identical.**
  - **36 rectangle documents, HTML sheets and 390/375/320 previews** (SHA-256 each). **Identical.**
- On screen, `stageLabelPlan` with no options returns the same plan as before; a test pins this.

## Results

**Clashes across 114 PDFs** (13 shaped plots × Letter/A4 × full/compact/plot): **88 before, 0 after.** That count is labels on labels and labels on symbols, at the scale read back from each PDF, with Helvetica widths.

**On screen**, four-piece on thrust, round and wings, at 368×266, 353×139 and 298×117.6 glass:
- No name or number box runs into another.
- No number box lies on another symbol.

**Readability cost:**
- Equipment shown by its number alone across the shaped set: 370 → 474.
- Leaders: 194 → 270.

**Page count:** six plot-only packets grow from 1 page to 2. The drawing no longer gives way, so the last legend lines run on:

| Plot | Paper |
|---|---|
| Thrust (the report) | A4 |
| Round | A4 |
| Salsa on a thrust | Letter and A4 |
| Four-piece on a plain thrust | A4 |
| Four-piece on a round square | Letter |

No full or compact packet changed its page count.

## Pictures

| | Before | After |
|---|---|---|
| Thrust (plot only, A4) | `C:\Users\profe\Downloads\2026-11-13_STAGE_PLOT_NEW_FEATURES_PICTURES\14_pdf_thrust.png` | `…\18_after_pdf_thrust.png` |
| Round (full, Letter) | `…\12_pdf_in_the_round.png` | `…\19_after_pdf_round.png` |
| Wings (full, A4) | `…\13_pdf_with_wings.png` | `…\20_after_pdf_wings.png` |
| Phone 390 × 844, Stage, four-piece on a thrust | (none) | `…\21_after_phone_thrust.png` |

All renders are in the scratchpad (`…\scratchpad\shapefix\`):
- `base_out\`: before PDFs.
- `final3\`: after PDFs.
- `review2\`: the pages the reviewer saw.

## Tests

New file `test/stagePlotShapeLabels_20261113.test.ts`, **49 tests**. It covers 13 shaped plots:
- the report's thrust, round and wings plots;
- the four-piece, the salsa band and the 22 new symbols on each shape;
- the salsa band on a thrust with two stage boxes.

**PDF (Letter and A4; full, compact, plot):**
- The test reads the PDF's own drawing scale back from the outline it drew.
- It finds every printed name at the computed place, to 0.2 pt.
- No row (name and its boxes) runs into another row or lies on a symbol footprint.
- A name with no leader is nearer its own symbol. The only allowance is the drift when drawn larger, bounded by geometry.

**At the placed size:**
- No collisions.
- Nearest symbol is its own.
- No name across the outline, the circle or a wing edge.
- No name on another's leader. The 22-symbol stress plot is exempt from this one check (see Held).

**HTML print sheet and export preview** (390/375/320): the same checks.

**On-screen Stage drawing** (390/375/320): no name or number box overlaps another, and no number box lies on another symbol.

**Floor and pins:**
- The PDF never draws a shaped plot below its placement scale.
- The two constants match.
- The view passes `numbersClear` only for shapes.

**Mutation checks:** each part was undone alone, the tests run, and the file restored (SHA-256 checked):

| Part undone | Tests failing |
|---|---|
| Placement scale | 8 |
| Printed widths | 7 |
| PDF floor | 6 |
| On-screen gate | 6 |
| Outline rule | 8 |
| Leader-through-name preference | 0 (not caught) |

The leader-through-name preference is not caught because no band plot needs it today, and the stress plot is exempt from that check.

**Commands:**
- `node --test --test-timeout=120000 test/stagePlot*.test.ts`: **802 tests, 802 pass, 0 fail.**
- `npx tsc --noEmit -p .`: no errors.
- Full suite not run; the lead runs it.

## Independent review

Two fresh subagents looked at the rendered pages without my conclusions.

**Round 1** found names across walls and outlines, leaders through names, and a leadered name taking another's place. Fixed above.

**Round 2** found:
- Band plots, printed (four-piece and salsa): no overlaps. Mild "near" items only:
  - "13" 1–3 px from the riser corner;
  - "Chino" about 6 px right of Nelson's head;
  - "Drum riser" level with the guitar amp.
- The remaining findings are listed under Held.

## Held (not changed here)

1. **The 22-symbol stress plot on thrust and wings.** It packs a symbol every few feet. When no place has a clear leader, a leader may run behind another name, and some names sit under a neighbouring symbol (with leaders). No text overlaps text.
2. **Round, circle 30 ft.** The two IEM symbols of the four-piece template stand on the circle line. That is where the objects are, not where the labels are.
3. **On-screen Stage drawing on a phone (`stageLabelPlan`).** These behave the same on the rectangle example; the editor's label engine has its own rules:
   - names can still cross the stage's edge lines;
   - a performer's name (never dropped, by design) can touch another label at 320 and 375;
   - ownership is judged centre to centre.
4. **Rectangle salsa band on A4** (example and boxed). "Nelson (M5)" touches the bass amp by about 1 pt, from Helvetica's real width. Rectangles were to stay exactly as before. Applying the printed widths to rectangles too would fix it, but would move rectangle labels.
5. **On-screen wording on a shaped stage.** The note "…shown without their channel numbers or mix codes at this size, so no name is covered" is still the R2 wording. The reason is now "nothing is covered".
6. **The `give` constant.** If one-page plot-only packets matter more than names, `SP_PLOT_SHAPED_K.give` (with `SP_PDF_PLOT.shapedGive`) can go to 0.84. Pages stay as before, but more equipment prints by number only. I measured this: 0 clashes, more names dropped, 0 page changes.
