# Bug test SP1: Stage Plot and Channel Designer (Library, Setup, Stage)

Tester: SP1, 2026-11-13. Preview `http://localhost:8142/#labpreview/StagePlotLab`, own tab (tab-30), emulated 390 x 844; also checked at 375 x 667 and 320 x 640.
Evidence: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\bugtest_sp1\`
No source file, git or storage was changed. Sound stayed off. I pressed no DOWNLOAD, SHARE or PRINT button. For the delete test only, I replaced `window.confirm` in my own tab so it answered "yes" (the pane blocks native dialogs: `confirmDialog` and `notify` use `window.confirm` and `window.alert` on the web).

How I drove it: I pressed controls by their accessibility labels. I typed by setting the field and firing input, focus and blur events. I dragged on the stage with mouse events sent from JavaScript; coordinate drags in the pane did not reach the stage. I read results from the page text, the accessibility labels and the SVG elements, and checked the picture in screenshots.

Counts: **S1 1 · S2 12 · S3 9.**

---

## 1. Screens and controls

| Screen | Control | What it is for | Result | What I saw |
|---|---|---|---|---|
| Library | START × 6 (blank, solo, duo, four-piece, playback, salsa) | Make a new plot from a start | PASS | Each opens the editor with the right people and objects. A double tap made one plot (latched). |
| Library | Cap at 24 | Refuse a 25th plot, in words | PASS | At 24: "This device keeps 24 stage plots, and it is full…" START is disabled. |
| Library | OPEN / row | Reopen a plot | PASS | |
| Library | MORE › RENAME | Rename band and title | PASS | The row and the header change at once. |
| Library | MORE › DUPLICATE | Make a separate copy | PASS, S3 | The copy is made and **opens**. Its header is the same as the master's (S3-05). |
| Library | MORE › DUPLICATE FOR A GIG | Make a venue copy | PASS | Venue and date go into the copy. The master is unchanged. The row says "Gig copy of …". |
| Library | Gig date field, "Read as …" | Parse the date one way only | FAIL | 5/12/2026 is refused, but "Junk 5 2026" is read as June 5 (S2-11). |
| Library | MORE › DELETE | Delete after a confirm | PASS (confirm stubbed) | Cancel keeps the plot; yes removes it. The text says "The gig copies made from it are kept." The gig copy then reads "its master is no longer on this device". |
| Library | Guest note, list faces | Say the work is not saved; empty list | PASS | "No stage plots yet. Start one above." |
| Editor bar | ‹ ALL PLOTS, UNDO, REDO, revision and status | Leave; step history; show the state | PASS | Undo and redo work for add, move pad, drag, handle resize, typed size, turn, group, duplicate, remove, rename, performer remove and status, by the spHistory rules. |
| Editor tabs | ? / ! marks | Count review questions per area | PASS | Four-piece "Setup ? 3". Each mark clears when it is answered. A duplicate channel shows "Inputs ! 1". |
| Setup | Band name, title | Name on the packet | PASS | They clear "no band" and "(example)". The note under the title says "…in Setup" while you are in Setup (S3-04). |
| Setup | Venue | | PASS | |
| Setup | Event date and "Read as …" | Read one date only | FAIL | "Junk 5 2026" → June 5; "Mayday 1 2026" → May 1 (S2-11). 2026-02-30 and 5/12/2026 are refused, and the typed text is wiped (S3-08). |
| Setup | Load-in / Soundcheck / Performance | Times | S3 | "25:99 PM" and "soon" are taken with no word (S3-01). |
| Setup | Contact × 4 + "Show … in the packet" × 4 | Contact and what prints | FAIL | The show switches correctly bring the question back. An invalid email ("ana-at-example") clears the question (S2-05). |
| Setup | Status Draft / Ready | Mark ready; refuse while blocked | PASS | Blank (empty) and a duplicate channel both refuse: an alert plus "1 thing must be corrected… First: …". GO TO THE REVIEW opens Export. |
| Setup | Venue confirmed switch | Recorded only by the band | PASS | It appears only when Ready. It goes off, and revision 2 starts, at the next edit. |
| Setup | Stage width / depth | Size and scale | PARTLY | abc, 0, −5 and 1001 are refused. 1001 gets the wrong reason. With only the width set, the note still says "With no width and depth" (S3-02). |
| Setup | Feet / Meters, Estimated / Confirmed | Unit and confidence | PASS | Key "8 × 5 m · estimated". Grid step 0.25 m against 1 ft. The pad reads in m. |
| Setup | Performers: ADD, EDIT, name, role | Who is on stage | PASS | "Performer 13" is added. The name carries to Stage, Inputs and Monitors. |
| Setup | PLACE / LOCATE ON THE STAGE | Go to the Stage and select | PASS | Stage opens with "… is in your lists, and it is not on the stage yet" and PLACE ON THE STAGE. |
| Setup | REMOVE performer (sheet, two choices, CANCEL) | Remove and say what it touches | PASS | Chino "and what is only theirs": inputs 16 → 14 and Congas leave the key. The shared mix M6 stays. Undo brings it all back. |
| Setup | Guided task: SHOW, the steps, GO | Optional walk-through | FAIL | Step 2 says Done while a performer has nothing to play (S2-06). The steps close when you leave Setup (S3-07). |
| Setup | Review notes under the fields; GO TO from Export | Reach the field | PASS | GO TO for "no contact" scrolls Setup to TECHNICAL CONTACT. |
| Stage | ADD popup, every kind (27) | Place each kind | PASS | All 27 were placed. The key lists 25 entries: vocal mic shares "Microphone on a stand", bass amp shares "Amplifier", as designed. |
| Stage | ADD › package, device, new performer, from Setup, only a drawing, decide later | What the symbol stands for | PASS | Percussion mic with Nina gives channel 15 in Inputs. A wedge on M1 makes Monitors "3 wedges" and M1 "Wedge 1 and Wedge 3". New performer Zed appears in Setup. |
| Stage | Drag (move) | Move an object | PASS | One undo step. A group moves together. Overlaps are allowed silently. |
| Stage | Riser corner handle; SIZE fields | Resize a platform | FAIL | The handle works (one step). The width is taken up to 150 % of the stage and drawn past both edges (S2-09). |
| Stage | OBJECT tray: STAGE RIGHT / UPSTAGE / DOWNSTAGE / STAGE LEFT | Move without dragging | PASS | Moves one grid step. It can leave the stage: an OFF STAGE tag and a review question appear. |
| Stage | Pad and dock ↺15° ↻15° FACE THE AUDIENCE / UPSTAGE | Turn | PASS | 25 × ↻15° gives 15°. The figure turns on the drawing. |
| Stage | TURN fader, ZOOM fader drag | Turn / zoom by fader | NOT TESTED | My synthetic drags did not move the lanes. |
| Stage | ZOOM IN / OUT / FIT STAGE / FIND OBJECT | Zoom | PASS | 1.0 → 4.0× and back. FIND gives 2× on the object. |
| Stage | Typed Across / Depth | Exact place | S3 | 150 % is cut to 125 % silently; "abc" is ignored silently (S3-03). |
| Stage | DUPLICATE (one object, a group) | Copy as a drawing | FAIL | The copy keeps the linked object's name: two "Wedge 1", two "Alex" (S2-07). |
| Stage | GROUP / UNGROUP | Move together | PASS | |
| Stage | REMOVE FROM THE STAGE (inline confirm) | Remove the drawing only | FAIL | The drawing goes. For an instrument, nothing then asks about its inputs (S2-02). |
| Stage | Name on the plot | Label printed on the plot | FAIL | The stage says "Front wedge" while Monitors still says "Wedge 1" (S2-08). |
| Stage | VIEW: Grid, Snap, Names, Numbers | Drawing aids | FAIL | They work on the drawing. But Snap (never printed) starts a new revision of a READY plot (S2-04). Names and Numbers reset when you leave the area (S3-07). The VIEW popup covers the drawing while you toggle. |
| Stage | HIDE / SHOW DISPLAY | Read the well | PASS | |
| Stage | FULL SCREEN in / out | Larger stage | FAIL | It opens at 1.9× with performers cut off at both sides, and the DISPLAY chip says 1× (S2-10). The VIEW tray covers the stage (S2-12). Leaving puts the zoom back. |
| Stage | Names and numbers on the drawing | Read who and what | FAIL | Salsa at 390 shows "Marisol M6": her own M1 is dropped and Wedge 9's code sits against her name (S2-03). |
| Stage | Key under the stage | Exactly the kinds on the stage | PASS at 390 | It adds and drops kinds correctly with add, remove and undo. **At 375 × 667 the key takes the display** (S1-01). At 320 its last row is clipped. |
| Stage | New top-view art (15 kinds) | Recognisable, true to the handoff | PASS | Seen at 4×: percussion table, congas (tumba on the player's right, measured 87.7 against 81.4), timbales (macho on the player's right, bells toward the audience), bongó (hembra on the player's right), upright piano with keys upstage, guitar lying face up, trumpet with the bell to the audience, laptop with its keyboard upstage, IEM shelf, drum fill, sidefill, rack, quad box, chair, music stand. |
| Stage | Agreement with Inputs and Monitors | One model | PASS except S2-02 and S2-08 | Four-piece: channels 1–14 and M1–M4 match the badges and locations. |
| All | Console | | PASS | No app errors. Only framework deprecation warnings. |

---

## 2. Bugs (most serious first)

### S1-01 · Stage · S1. On a 375 × 667 phone the stage is a 15–45 px strip; the key takes the display
- **Steps:** Set the viewport to 375 × 667. START Salsa band and open STAGE. (Or start Blank, set a 20 × 12 ft stage and ADD the 15 newly drawn kinds.)
- **Expected:** a usable drawing with the key under it.
- **Happened:**
  - **Salsa:** stage SVG 87 px including the direction words; the deck itself is about 45 px tall. Names and badges pile on top of each other.
  - **15 kinds:** stage SVG 54 px, deck about 15 px, key 104 px.
  - **320 × 640:** stage SVG 53 px. The key's last row is clipped (Music stand cannot be seen). "STAGE RIGHT" reads "TAGE RIGH". ZOOM OUT sits at x = −32, off screen.
  - **390 × 844 with 27 kinds:** key 190 px against stage 145 px.
- **Evidence:** `13_375x667_salsa_stage_45px_labels_overlap.jpg`, `11_375x667_15kinds_stage_is_a_strip.jpg`, `12_320x640_stage_strip_key_clipped_zoomout_cut.jpg`, `01_blank_all27_kinds_key_squeezes_stage.jpg`.
- **Cause:** `StageArea.tsx:324-329`. The display height is `max(250, min(320, 0.36·winH)) + keyHeight`, the rack then clamps it for the dock and the well, and the key's height is taken out of the stage. Nothing gives the stage a minimum or caps the key.
- **Smallest fix:** give the stage a minimum height (about 180 px) before the key. Let the key wrap into more columns, or scroll inside its own strip, when it would take more than about 35 % of the display.

### S2-02 · Stage / Inputs · S2. Removing an instrument's symbol leaves its inputs with no drawing and no question
- **Steps:** START Four-piece, open STAGE, choose the Drums row, REMOVE FROM THE STAGE, then YES.
- **Expected:** "Drum kit is in the input list but not on the stage", plus a PLACE button under NOT ON THE STAGE YET.
- **Happened:**
  - The key drops "Drum kit" and channels 1–6 stay in Inputs ("Kick · Drum kit · Maya · Upstage center").
  - The Stage tab has no mark and no NOT ON THE STAGE YET block.
  - The same happens with the Percussion symbol added for Nina.
  - The plot that is sent has no drums drawn.
- **Cause:** `spModel.ts:880-888`. `spObjectOfSource` falls back to the performer's figure, so `spReview.ts:153` (source-unplaced) and `stageLinks.ts:313` both count the kit as placed.
- **Fix:** use the performer fallback only for sources a person carries (vocals, hand percussion), or for categories with no instrument symbol. Otherwise ask the source-unplaced question.

### S2-03 · Stage · S2. A performer's mix code is dropped silently, and a neighbour's code sits against the name
- **Steps:** START Salsa band, open STAGE at 390 × 844, and look at the middle.
- **Expected:** "Marisol M1", or a note that a performer's code is left out.
- **Happened:**
  - The drawing reads "Marisol M6": the text ends at x = 206 and Wedge 9's "M6" badge starts at x = 214.
  - Marisol's own M1 and Chino's M6 are not drawn; only one "M1" is on the stage, Wedge 1's.
  - The note says "The equipment keeps its channel numbers and mix codes, and every performer is named", which hides the loss.
- **Evidence:** `06_salsa_stage_390_Marisol_reads_M6.png`, `07_salsa_closeup_Marisol_M6_Chino_no_badge.png`.
- **Cause:** `stageGeom.ts:712-725`, the "bare" branch: name only, badges dropped. `bare` is never reported (`StagePlanView` passes only `dropped`, and the note is at `StageArea.tsx:342`).
- **Fix:** give badges against a performer's name a clear gap, or a leader. Report `bare` in the note ("N performers' mix codes are not shown").

### S2-04 · Stage VIEW · S2. Snap (never printed) starts a new revision of a READY plot
- **Steps:** START Solo. In Setup, set Status to Ready ("Revision 1 · Ready"). In STAGE › VIEW, toggle "Snap to the grid".
- **Expected:** no change to the document.
- **Happened:** "Revision 2 · Draft". READY is lost and an undo step is added. Grid does the same on a plot with no stage size, where the grid is not printed (`spPacket.ts:421`).
- **Cause:** `StageArea.tsx:141-147` (`setStage` through `ed.apply(spEdit)`), and `spHistory.ts:43-45` (`contentKey` includes `stage.snap` and `stage.grid`).
- **Fix:** keep Snap out of the document; it is a screen preference like Names. Count Grid only when the plot is to scale. Or leave both out of `contentKey` and out of spEdit's revision bump.

### S2-05 · Setup · S2. An email that is not an email answers the "no technical contact" question
- **Steps:** START Four-piece. Type Contact name "Ana Ruiz" and Email "ana-at-example".
- **Happened:** "Setup ? 1" becomes "Setup" (cleared), while the screen says "This does not look like an email address."
- **Cause:** `spReview.ts:109`, `hasText(c.email)`.
- **Fix:** `c.email.includes('@')` there, the same test as `SetupArea.tsx:349`.

### S2-06 · Setup guided task · S2. "Add what each performer plays or sings" is marked Done while a performer has nothing
- **Steps:** START Salsa, ADD A PERFORMER (any name), place them on the stage, then SHOW THE STEPS.
- **Happened:** step 2 shows ✓ "Done." The new performer has no source.
- **Cause:** `spReview.ts:296`. It checks that every SOURCE has inputs, not that every PERFORMER has a source.
- **Fix:** also require each performer to have a source, or a "plays nothing amplified" answer. Otherwise reword the step.

### S2-07 · Stage · S2. DUPLICATE copies the linked object's name onto an unlinked drawing
- **Steps:** START Four-piece, choose the Wedge 1 row, DUPLICATE.
- **Happened:** two objects named "Wedge 1"; the copy has no mix. The same happens with a group: two figures named "Alex". The plot sent to a venue shows a second "Wedge 1" that is in no monitor plan. The copy also landed on the front lip.
- **Evidence:** `09_duplicate_wedge1_named_wedge1.png`.
- **Cause:** `spDuplicateObject` in `spModel.ts`.
- **Fix:** give the copy "Wedge 1 (copy)", or the kind's name, when the original is linked.

### S2-08 · Stage / Monitors · S2. "Name on the plot" of a linked object differs from the list name
- **Steps:** START Solo, choose the Wedge 1 row, set Name on the plot to "Front wedge", then open MONITORS.
- **Happened:** the stage and plot say "Front wedge" (M1); Monitors still says "Wedge 1". The same happens for an instrument against its source. The packet names one device two ways.
- **Cause:** `StageInspector.tsx:104` edits `o.label` only.
- **Fix:** for a linked object, edit the linked device or source label. Or show the list name beside the field and say they differ.

### S2-09 · Stage › Riser SIZE · S2. A riser wider than the stage is accepted and drawn past both edges
- **Steps:** START Four-piece, choose Drum riser, set Width (% of the stage width) to 500.
- **Happened:** the field shows 150 and the riser is drawn 458 px wide on a 368 px display, past STAGE RIGHT and STAGE LEFT. No review question and no words. A width of 0 was refused silently.
- **Evidence:** `08_riser_150pct_past_stage_edges.jpg`.
- **Cause:** `StageInspector.tsx:67-70` / `stageSizeFraction` clamp.
- **Fix:** clamp to 100 % of the stage width and depth and say so ("A riser cannot be wider than the stage").

### S2-10 · Stage FULL SCREEN · S2. Full screen opens zoomed to 1.9× with performers cut off, and two zoom readouts disagree
- **Steps:** START Four-piece, STAGE, FULL SCREEN.
- **Happened:** the dock says "ZOOM 1.9× · drag the stage to slide". Leo, Nina, the keyboard and the IEM transmitter are off the sides; you first see the stage without two of its four performers. The top DISPLAY chip shows 1× selected at the same time.
- **Evidence:** `02_fullscreen_opens_at_1.9x_performers_cut_display_chip_says_1x.jpg`.
- **Cause:** by design in `StagePlanView.tsx:215-235`. The two readouts are the held shared-frame item.
- **Fix:** open full screen at the fit that shows the whole stage width (fill the height only when the width still fits), or say in the strip that the sides are off screen.

### S2-11 · Setup and gig copy date · S2. Any word starting with a month's three letters is read as that month
- **Steps:** Setup › Event date "Junk 5 2026", then "Mayday 1 2026".
- **Happened:** "Read as June 5, 2026." and "Read as May 1, 2026." The packet file name and the plot get that date.
- **Cause:** `spStore.ts:154-155`, `MONTH_NAMES.indexOf(hit[1].slice(0, 3))`.
- **Fix:** accept only a full month name or its standard abbreviation (optional "."), for example a lookup of {jan, january, feb, february, …, sep, sept, september, …}.

### S2-12 · Stage FULL SCREEN VIEW (and the popup) · S2. The VIEW controls cover the stage they change
- **Steps:** Four-piece, FULL SCREEN, VIEW.
- **Happened:** the tray ("stays open — compare while you watch") covers the lower two-thirds of the stage. At the fit zoom the stage sits in the middle of a tall glass, so only the top band and empty dark glass stay visible. Outside full screen the VIEW popup covers the drawing while Grid, Names and Numbers are toggled.
- **Evidence:** `03_fullscreen_view_tray_covers_stage.jpg`.
- **Fix:** in full screen, align the stage to the top while a tray is open. Outside full screen, show VIEW as a tray under the drawing, as OBJECT is.

### S2-13 · Stage dock · S2. A long selected name reflows the dock and shrinks the stage
- **Steps:** Salsa, ADD A PERFORMER named "Güiro Man With A Very Long Name That Goes On And On Forever", PLACE ON THE STAGE.
- **Happened:** the OBJECT button grows to full width (name at 9 px), the dock breaks into two rows, and the stage SVG shrinks from 280 to 223 px. The 3-line name label covers Tito's area.
- **Evidence:** `10_long_performer_name_dock_reflows_stage_shrinks.jpg`.
- **Cause:** `StageArea.tsx:309`. `valueLabel` is the full name.
- **Fix:** cut the value label to about 12 characters with "…" (the full name is in `valueA11y`) and keep the button's width fixed.

### S3-01 · Setup · S3. Times take any text ("25:99 PM", "soon") with no word. Fix: a quiet "Not read as a time" note, as the date has.
### S3-02 · Setup / Stage · S3. Stage size: wrong reason and wrong note
- "1001" is refused with "Type a number, like 24 or 7.5"; the reason is the 1000 limit.
- With the width set and no depth, Setup still says "With no width and depth…" (`SetupArea.tsx:402`) and Stage says "no stage width and depth are set" (`StageArea.tsx:390`).
- Fix: "or", and an out-of-range message.
### S3-03 · Stage typed position · S3. Out-of-range or unreadable input changes nothing, with no message. Across 150 % becomes 125 % silently, and "abc" is ignored silently. 45.5 shows as 46 while the hint says "kept exactly as typed".
### S3-04 · Setup · S3. The "(example)" note says "Change it or clear it in Setup" while the user is in Setup (`spReview.ts:102`).
### S3-05 · Library · S3. Copies and blank plots are hard to tell apart
- DUPLICATE opens the copy, and the header is identical to the master's.
- A gig copy and its master both show "The Renamed Band" and have the same a11y label "More for The Renamed Band…".
- Many blank plots are all "Untitled stage plot".
### S3-06 · Stage · S3. New objects are placed across the front lip. The Rack (Art Check) and the duplicated Wedge 1 were placed straddling the audience edge.
### S3-07 · Stage / Setup · S3. Screen state resets on leaving the area. Names, Numbers and Zoom reset when leaving Stage (Grid and Snap persist because they are saved); the guided-task steps close when leaving Setup.
### S3-08 · Setup · S3. A refused date wipes the typed text. Leaving the field with "5/12/2026" empties it and the user retypes. Fix: keep the refused text with the note.
### S3-09 · Stage · S3. Returning to Setup after LOCATE ON THE STAGE reopens the row and deselects the stage object. The comment at `SetupArea.tsx:122` says it must not reopen.

---

## 3. Not tested, and why
- **ZOOM and TURN fader drags:** synthetic mouse drags did not move the lanes; the nudge buttons were tested instead. Finger drags on a phone were not tested either.
- **Browser BACK:** the tab has no history (the lab adds no history entry), so BACK had nothing to go to. Whether BACK from the editor leaves the lab and loses a guest's work could not be checked.
- **Delete confirmation as a user sees it:** native `confirm` is blocked in the pane, so I stubbed it in my tab. On a real web browser it is a native dialog, not the house popup.
- **The guest "not signed in" popup:** suppressed by the pane (confirm returned false).
- **PDF, print, share, download:** excluded by the brief.
- **Landscape full screen, screen reader, Larger Text, reduce motion:** the lab has no decorative motion (no `useDecorativeMotion` or Animated in `stageplot/`).
- **A member's save after a reload:** I was a guest; a reload empties the lab, as expected.
- **Inputs and Monitors controls themselves:** SP2's slice. Only their agreement with the stage was checked.
