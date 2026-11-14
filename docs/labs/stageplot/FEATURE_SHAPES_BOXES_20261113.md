# Stage shapes and numbered stage boxes (2026-11-13)

Builder A. The owner's go: "yes i want a stage-shape option (thrust, round or wings). also the ability to place where stage boxes are." Nothing is committed: the lead commits. No git, eas or server commands were run, and package.json was not touched.

## 1. What was built

### Stage shapes
- **Four shapes:** Rectangle, Thrust, In the round (a circle or a square) and With wings.
  - Rectangle is the default. Every saved plot and all five examples are unchanged; a test checks this.
- **Model** (new file `spShape.ts`):
  - Positions are still fractions of the MAIN stage. A thrust's tongue lies past the front edge (y > 1), and a wing lies past a side (x < 0 or x > 1).
  - The tongue's width and depth, and each wing's width, are typed in the stage's unit. A part with no size is drawn at a usual size, and the plot says so.
  - In the round, the reference side (default "FOH", up to 12 letters) is drawn at the bottom. For a circle, the depth always follows the width.
- **Schema 2** (`SP_SCHEMA = 2`): `spMigrate` reads a schema-1 plot as a Rectangle with no boxes. A junk shape or size falls back to the safe default.
- **On or off the stage, per shape:**
  - The tongue counts as on the stage, and so does a wing (it is on the plot but is not the performance area).
  - A point outside a circle is off the stage.
  - The review's existing "outside the stage" question uses this test.
  - A stage box, an equipment rack or an in-ear transmitter standing off the stage is no longer asked about. The expert review said that is where such equipment normally stands.
- **Position words:**
  - Thrust: "Thrust, center", "Thrust tip, stage left side".
  - Wings: "Stage right wing".
  - In the round, from the reference side: "The FOH side, stage right", "The far side, center", "Center".
  - "Facing" in the round: "facing the FOH side" and "facing the far side". The short readout reads "faces FOH side, to stage right".
  - The move pad's buttons in the round read FAR SIDE, FOH SIDE, FACE THE FOH SIDE and FACE THE FAR SIDE.
- **Snap and grid:**
  - The snap grid is unchanged.
  - The reach of a drag or a typed position is now the shape's outer edge plus a quarter of the stage (`spMoveLimits`). The model and the editor share it, and a test holds them together.
  - Grid lines are drawn only inside the shape: inside the circle, on the tongue and in the wings.
  - A new object is placed inside a round stage, never in a corner of its square.
- **Undo, redo and copies:**
  - Undo and redo work through the existing history.
  - Duplicate and gig copies keep the shape.
- **Drawing on screen** (`StagePlanView`):
  - The timber deck and lip take the shape: a tongue, a clipped circle, or dashed dark wings.
  - SR WING and SL WING are named in the frame above the wings.
  - The round has its own direction words.
  - The Stage area shows one Note in words about the shape.
- **Drawing on paper** (export preview, HTML sheet, PDF):
  - A new optional `SpDocPlot.deck` holds the outline, the front edges, the wings with their names, the grid inside the shape, and the direction words.
  - A Rectangle has no `deck` and is drawn exactly as before.
  - The size note includes the shape: "thrust 10 ft × 8 ft", "wings 6 ft each", "30 ft across (confirmed), in the round: the FOH side is at the bottom".
  - The legend explains the shape, and the text view says positions in the shape's words.
- **Setup:**
  - "Shape of the stage" sits in STAGE SIZE, with one plain line for each shape (the chosen one is marked).
  - Each shape has its own size fields: Thrust width and depth, Width of each wing, Diameter for a circle, circle or square, and the name of the side at the bottom.
  - A help popup, "Thrust, in the round, wings: what changes for sound", is written in the student's voice.
  - One line in each of the Setup guide's `changes` and `teaches`.

### Numbered stage boxes
- **Model:**
  - `SpProject.boxes: SpStageBox[]`. A box has a name (SB1, SB2… or typed), input sockets (8/12/16/24/32/48 or typed, up to 96), optional returns, digital, analog or to be confirmed, who supplies it, and a note.
  - `SpInput.box = { boxId, socket, byHand }` and `SpInput.direct` ("Console direct").
  - `SpObject.boxId` links the existing stage-box symbol to its box.
- **Edits:**
  - `spAddBox` adds the box and its symbol. The first box on a stage with wings goes in a wing.
  - `spUpdateBox`: renaming a box renames its symbol.
  - `spRemoveBox` takes the symbol off the stage and takes the inputs off their sockets.
  - Also: `spLinkBoxObject`, `spAssignBox` (by hand), `spSetDirect`.
  - Restoring the missing side of a stereo pair never copies the other side's socket.
  - A duplicated symbol is only a drawing.
  - Copies re-point their sockets at their own copies of the boxes.
- **AUTO-ASSIGN** (`spAutoAssignBoxes`):
  - Fills sockets in channel order, on the box nearest each source (in meters when the stage size is known).
  - A stereo pair goes on neighboring sockets, L first.
  - Where two boxes are about as near (within 20 %), it uses the box that already holds that section.
  - It never moves a socket chosen by hand and skips Console direct. One UNDO puts every socket back.
  - A wireless input goes to the box nearest a drawn rack. With no rack drawn, it is left for the student, and the screen says why.
- **Where it shows:**
  - **Input list on screen:** "Stage box: SB2 · 7" on each row, or "Console direct", or "No stage box socket yet".
  - **PDF / HTML input list:**
    - A "Box · socket" column, only when the plot has boxes.
    - A "Stage boxes" patch summary: where each box stands, the channels it carries, sockets used and free, and who supplies it. Example: "SB1 (16 inputs, 8 returns, digital), upstage right: channels 1–9, 14–15 on sockets 1–11 used, 5 free. Supplied by the venue."
    - A line saying box and socket are the band's suggestion, and the venue's own patch comes first on its boxes.
    - A list of the inputs that are Console direct.
  - **Stage drawing and plot:** the box's name. The key already has the stage-box symbol.
  - **Technical summary:** one line.
- **Screens:**
  - **STAGE BOXES panel** in Inputs (`inputs/BoxPanel.tsx`): counts, one card per box, ADD A STAGE BOX, AUTO-ASSIGN SOCKETS with its result in words, and a help popup on real stage boxes.
  - **Box editor:** name, size, returns, kind, supplier, note, its sockets one by one, LOCATE or PLACE ON THE STAGE, and remove. While nothing is plugged in, a "Next:" line says what to do.
  - **Input editor:** a "Stage box" choice (No socket yet / SB… / Console direct) and its socket, with "Chosen by you" or "Chosen by AUTO-ASSIGN" and a warning for a shared socket.
  - **ADD > Stage box** on the Stage screen makes a numbered box.
  - **Stage inspector:** for a stage-box symbol, its patch line, GO TO ITS SOCKETS and UNLINK FROM SB1. For an unlinked symbol, MAKE IT A NUMBERED STAGE BOX and THIS IS SB2.
  - A box with no symbol is listed under NOT ON THE STAGE YET.
- **Review questions** (each with GO TO):

  | Question | Level |
  |---|---|
  | A socket used twice | Must correct (block) |
  | A box with an input on a socket past its size | Must correct (block) |
  | Inputs with no socket while boxes exist: one question, listing up to six names "and N more", answered by AUTO-ASSIGN SOCKETS or GO TO | Question (ask) |
  | A box with nothing plugged in | Question (ask) |

  - "Who supplies the stage box" is a to-be-confirmed item.
  - `SpSelection` and the issue targets gained the kind `'box'`.
- **Credit rules:** unchanged (blank stage only; full or compact packet). A test checks the five guided steps.

## 2. Files

**New**
- `src/features/stageplot/spShape.ts`
- `src/screens/lab/stageplot/inputs/BoxPanel.tsx`
- `test/stagePlotShapesBoxes_20261113.test.ts`
- `docs/labs/stageplot/FEATURE_SHAPES_BOXES_20261113.md` (this file)

**Changed**

| Area | Files |
|---|---|
| Model and output | `src/features/stageplot/spTypes.ts`, `spModel.ts`, `spDerive.ts`, `spReview.ts`, `spPacket.ts`, `spPacketHtml.ts`, `spPdf.ts`, `spDocTypes.ts`, `spSymbols.ts` |
| Lab shell and Setup | `src/screens/lab/stageplot/spContext.tsx`, `spIssueActions.ts`, `SetupArea.tsx`, `StageArea.tsx`, `InputsArea.tsx` |
| Stage screen | `stage/StagePlanView.tsx`, `stage/stageGeom.ts`, `stage/stageLinks.ts`, `stage/StageInspector.tsx`, `stage/StageMovePad.tsx`, `stage/StageObjectList.tsx`, `stage/StagePalette.tsx`, `stage/StageKey.tsx` |
| Inputs, monitors and guides | `inputs/InputEditor.tsx`, `inputs/InputRow.tsx`, `inputs/inputsLogic.ts`, `monitors/monitorPlan.ts`, `guides/setup.ts`, `guides/inputs.ts` |

Changes worth knowing about:
- **spTypes.ts:** schema 2, `SpStage` shape fields, `SpStageBox`, `SpBoxPatch`, `SpInput.box/direct`, `SpObject.boxId`, `SpProject.boxes`. These were small edits; Builder B's `SpObjectKind` list was not touched.
- **spSymbols.ts:** one small edit in `spStageMeters`. A circular stage with no size is drawn square.
- **StageKey.tsx:** only `boxId: null` on its sample object.

**Existing tests changed on purpose** (each is marked in the test with the reason):
- `test/stagePlotStore.test.ts`: the pinned `SpSelection` line now includes `'box'`.
- `test/stagePlotStage.test.ts`, two source pins:
  - the TURN readout passes `p.stage` (`stageFacingShort(turnOf(v), p.stage)`);
  - the status line passes `p.stage` to `stageWhere` and `stageFacingWord`.
- Both changes are so that a stage in the round is said from its reference side.

## 3. Tests

| Run | Result |
|---|---|
| `node --test --test-timeout=120000 test/stagePlot*.test.ts test/labRegistration_20261113.test.ts` | 770 tests, 770 pass, 0 fail |
| The new file `test/stagePlotShapesBoxes_20261113.test.ts` | 37 tests, all pass |
| `tsc --noEmit -p .` | No errors in any stage plot file |

What the new file covers:
- Defaults, the examples and the schema-1 migration.
- A circle's single size.
- The on-stage test and the position words for each shape.
- "Facing" in the round and the review's off-stage question per shape.
- The move reach, and the model and the editor's snap agreeing.
- The grid inside each shape, and placement inside a round stage.
- Undo, redo and copies.
- The packet's deck, size note and words, and PDF bytes for every shape on both papers.
- The Setup and screen source pins.
- Box defaults, names and renaming, and the first box going in a wing.
- AUTO-ASSIGN: channel order, nearest box, pairs, by hand, direct, undo, a full box, wireless with and without a rack, sections kept together.
- Removal, pair restore, copies and a duplicated symbol.
- The four review questions and their levels, the long-list cut, and off-stage rack gear.
- The input table column, the patch summary and the text summary.
- Row and editor words, the socket lines, placing a box from the Stage screen, and the screen wiring.

During the run, failures appeared that belonged to Builder B's work in progress (their new symbols test, and a `mirrorD` name in `topArtStringsKeys.tsx` that trips the "no flip" source check). They were gone by the final run.

## 4. PDF pages looked at

These plots were built with the lab's own functions (script: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\fsb\fsb_render.mjs`) and rendered on Letter and A4:
- the four-piece on a 24 × 16 ft stage with a 10 × 8 ft thrust;
- the four-piece in the round on a 30 ft circle;
- the four-piece on 24 × 16 ft with 6 ft wings and SB1;
- the salsa band with SB1 (16/8 digital) and SB2 (12/4 analog), auto-assigned.

Pages read as images:
- thrust p1, round p1 (before and after fixes), wings p1, boxed p1, p3 and p4 (before and after);
- the Export preview of a wings plot in the browser.

What they show:
- The tongue and its front edges, the circle with its lip and the grid inside it, and the dashed wings named SR WING and SL WING over them.
- SB1 in the stage-left wing, the box names on the plot, the "Box · socket" column, and the patch summary.

Page breaks:
- The last lines of every page of all eight full packets were checked by script. No page ends on a heading.
- Page counts: four-piece shaped plots are 5 pages on Letter and 4 on A4 (the four-piece was 4/4). Salsa with boxes is 6 / 5 (was 5 / 5): the taller drawing and the extra column.

## 5. Browser checks

- Done in my own tab at `http://localhost:8142/#labpreview/StagePlotLab`, at 390×844, 375×667 and 320×640. The tab was closed and the viewport reset at the end.
- What was used:
  - Setup's shape choice, its lines and the round's fields.
  - The thrust, round and wings drawings on the Stage screen.
  - ADD > Stage box, including the first box landing in the stage-left wing.
  - The STAGE BOXES panel, the box editor, AUTO-ASSIGN SOCKETS with its result note, and an input editor's Stage box choice and socket.
  - The Export preview with wings.
- At 320 wide, `scrollWidth` was 320, so there is no sideways scroll. The console showed no errors.
- The preview reloads when files change: Builder B was editing at the same time, so guest work was reset twice. The steps were repeated with page script clicks.
- DOWNLOAD PDF, SHARE, PRINT, sign-in and purchase were never pressed.

## 6. Expert and learner reviews: findings and what was done

Two fresh agents reviewed the work: a live-sound engineer and a learner-experience specialist.

| Finding | Done |
|---|---|
| AUTO-ASSIGN put wireless inputs on the box nearest the singer | Fixed: a receiver plugs in at its rack. It uses the box nearest a drawn rack; with no rack, it is left for the band and the screen says why |
| A box, rack or IEM transmitter beside the stage became an "unresolved" item in the packet | Fixed: not asked about for these kinds |
| "fOH side" in the text view | Fixed: the words are "The FOH side…" |
| How to read a round drawing was printed on page 2 | Fixed: it is in the size note on the plot page, and all four round direction words say (AUDIENCE) |
| The patch summary lacked where each box is and which channels it carries | Fixed |
| Box and socket were not marked as the band's suggestion | Fixed: one line under the summary |
| The thrust help said to point the vocal mic away from the mains, which a singer on the tongue cannot do | Rewritten |
| Sections were split across boxes | Fixed: within 20 % distance, the section stays on one box |
| A digital box only works with a console that speaks its format | Added to the help and to the supplier hint |
| Inaccuracies in the box help (returns, preamps, sub-snakes) | Help rewritten |
| The second and later boxes went into the other wing | Fixed: they now go by the backline (a sub-snake's place) |
| "Console direct" named only playback | Expanded |
| FOH and "reference side" were not explained; jargon in the shape help | Explained; the field is now "Name of the side at the bottom"; a Note says there is no upstage in the round; jargon defined |
| The inspector's position help was wrong for the shapes | A sentence added for shapes |
| No next step after ADD A STAGE BOX | A "Next:" line in the box editor |
| "Offstage" meant two things | The wings' words were changed |
| AUTO-ASSIGN wording and "make a box larger" | Rewritten; the result explains a list that moves between boxes (only when there are two boxes or more) |
| The empty-box question's AUTO-ASSIGN could do nothing, silently | The button was removed; the text says what to do |
| "ONLY A DRAWING" was unclear | Now UNLINK FROM SB1, with a line saying what stays; "tap its name" hint added |
| Two box size controls | The "Another size" chip was removed; the field is named "Another size (input sockets)" |
| The round's short facing words read like a place | They now say "faces…" |
| The no-socket list was too long | Cut to six names and "N more" |
| The socket-line text for three or more inputs | Fixed |
| The guides were behind the features | Lines updated within their size budgets |

## 7. Held, and why

| Item | Why |
|---|---|
| Wings together with a thrust (expert 3) | The shapes are exclusive. Making wings an on/off option is a model and drawing change the owner should decide on |
| Monitor returns tied to mixes ("M1 → SB1 return 1"), and a check of mixes against the returns given (expert 6) | Returns are counted and printed only. A per-box returns patch was "if simple"; it is not |
| Sub-snakes modelled as feeding another box, "Drum sub (8) → SB1 1–8" (expert 13) | The term is in the help and second boxes are placed by the backline; the "feeds" link is not built |
| A question for a band's own digital box ("which console does it connect to?") (expert 11) | The help and the supplier hint say it, and the note field takes it; no review question |
| Clock positions or numbered sides as another convention in the round, and the drum viewpoint note in the round (expert 15) | Words only; for the owner |
| The box size on the plot label ("SB1 16/8") | The plot prints the name; the size is in the patch summary |
| Showing only the chosen shape's line in Setup (learner 11) | The brief asks for a plain line for each shape; all four are shown, the chosen one marked |
| On screen, the round's side words stay "STAGE RIGHT" / "STAGE LEFT" without "(AUDIENCE)" | Existing tests pin those words in the drawing's source. The packet prints "(AUDIENCE)" on all four sides |
| Not checked on a phone | As for the rest of the lab: finger drags on the new shapes, and the PDF in a real viewer |
