# Stage Plot and Channel Designer — sources, decisions and known limits

Must-do row D60. Owner GO 2026-11-12 (answers: "Use recommended" to seven questions). Specification: the owner's handoff, `Stage-Plot-and-Channel-Designer-Claude-Code-Handoff.pdf` (16 pages, prepared 2026-11-11).

## 1. What it is

A working tool (not a lesson): a band draws its stage from above, lists what reaches the sound system, plans its monitors, and prints or shares one PDF packet for a venue's sound engineer. Five work areas, in any order: Setup, Stage, Inputs, Monitors, Export.

Listed in the Labs menu since 2026-11-13 (commit 2fc3f7cd): Live Sound Reinforcement, members only. Credit `tr_stage_plot` needs a plot started from a blank stage and a full or compact packet. Not published to phones yet; the owner's OTA comes first. Web preview: `#labpreview/StagePlotLab`.

**Added 2026-11-13/14** (owner: "yes i want a stage-shape option (thrust, round or wings). also the ability to place where stage boxes are. We also need more symbols for more diverse music", then "Yes, build them all" and "build the remaining held items too"). See section 11.

## 2. Where the code is

| Part | Path |
|---|---|
| The one project model, every edit, totals, review rules, example bands, print symbols, packet, PDF writer, saving | `src/features/stageplot/` |
| Screens | `src/screens/lab/stageplot/` |
| Tests | `test/stagePlot*.test.ts` |
| Review reports (round 1) | `docs/labs/stageplot/reviews/` |

## 3. Decisions (owner's answers and the lead's)

| Decision | Source |
|---|---|
| Labs menu under Live Sound Reinforcement; members only; a guest can try it and nothing is saved | Owner, question 1 |
| A tool with an optional guided task; the guided task earns the lab's credit; a certificate requirement is decided at listing | Owner, question 2 |
| No mail composer now (it needs a package the app lacks = a store build). Share PDF opens the share sheet; the suggested message is copied | Owner, question 3 |
| On screen: the app's existing top-view art. In print: black-line symbols drawn in code. No image file touched | Owner, question 4 |
| Example bands: solo, duo, four-piece (the handoff's worked example), band with playback, salsa band | Owner, question 5 |
| Feet first, meters optional; US Letter first, A4 optional | Owner, question 6 |
| One independent review round, one fix round, gate, commit, push, handoff; not listed, nothing published | Owner, question 7 |
| Saved on the device only (no account sync: no server table exists for it) | Lead; the handoff says "use existing account synchronization if available" |
| A PDF writer of our own (`spPdf.ts`), no new package | Lead: the app had no way to make a PDF file in a browser, and the handoff requires a web download |
| Phones make the SAME PDF with that writer (file → share sheet; print from the file) | Lead, after review: the phone's page-to-PDF converter is not expected to print page footers or repeat table headers on iPhone. NOT verified on a phone |
| When a stage has no dimensions the drawing assumes a stage size by band size (7.2 × 4.5 m up to five performers, 9.2 × 5.75 m up to eight, 11.2 × 7 m for more), and always prints "Not to scale" | Lead: a twelve-piece band was drawn as people standing on each other |

## 4. Rules the model keeps (whichever screen edits)

- One input = one physical audio channel at a mixer. A stereo source is two inputs, paired.
- An icon never adds an input. A DI icon that illustrates an existing path points at that path.
- A mix is not a device. Distinct mixes, monitor feed audio channels and equipment counts are three separate numbers. What the house console is asked to create is counted apart from what the band creates in its own rig.
- "To be confirmed" is a value: kept, printed, never guessed. Nothing infers phantom power, a DI's type or a supplier.
- A click or cue is monitor only and excluded from every mix until someone asks for it. Sending it to the audience is a question the band can answer once; a change of routing asks again.
- One answer to "who supplies it": a DI channel on a DI device is supplied by whoever supplies the device.
- The venue is not asked about its own equipment in the unresolved list.
- No broken links: removing something detaches what pointed at it, in the open. A mix others share is never erased with one performer.
- A shared revision is frozen: the first edit after an export, or after "Ready to advance", moves the revision on and returns to Draft.
- A gig copy has new ids everywhere and never changes its master.
- Positions are fractions of the stage, never pixels. Stage right is the viewer's left.

## 5. What the tool deliberately does not do (handoff §13)

No console control. No radio frequency coordination (it records "coordination required" only). No electrical design: a power drop is a requested location, never a statement about a circuit. No gain, EQ, phantom switching or polarity settings for the venue. It never calls a gig "production ready": **Ready to advance** means the band's document is prepared for discussion, and "venue confirmed" is a separate mark the user sets.

## 6. Simplifications a user should know (and where the tool says so)

| Simplification | Told |
|---|---|
| Symbols are drawings of a kind of thing, not the footprint of anybody's equipment | On the Stage (badge under the picture) and in the packet's legend |
| A plot with no dimensions is not to scale | "NOT TO SCALE" on the Stage and on the plot page |
| The conventional channel order is a convenience, not a house standard | Inputs (CHANNEL ORDER) and above the printed input list |
| Mix needs (Primary, Supporting, Not needed, Must exclude) are advance preferences, not fader values | Monitors, on the needs panel |
| The packet is not a tagged or standards-compliant accessible PDF; the "Text only" view is the accessible form | Export |

## 7. Open proofs (nothing here has been checked on a phone)

| Item | State |
|---|---|
| Dragging on the stage with a finger; FULL SCREEN drags | NOT CHECKED on a phone (mouse only, in the web preview) |
| Print on a phone | NOT CHECKED |
| Share sheet on a phone, and Mail attaching the PDF | NOT CHECKED |
| The PDF opened in Acrobat, Apple Preview or a browser's viewer; printed on paper (Letter and A4, grayscale) | NOT CHECKED (opened cleanly by two PDF libraries; pages read as images) |
| Restore after an app restart for a member | NOT CHECKED on a device (tested against the store's logic) |
| Screen reader, keyboard, Larger Text | NOT CHECKED on a device (roles, labels and states are set in code) |

## 8. Review round 1 (2026-11-12)

Three independent reviewers: live sound (accuracy; the printed packet read page by page), usability and plain language (the specification line by line; the first ten minutes tap by tap), visual and function (in the browser at phone size). Reports in `reviews/`. One fix round followed. What it changed is listed in the handoff in Downloads (`2026-11-12_STAGE_PLOT_LAB_HANDOFF`).

## 9. Review round 2 (2026-11-12, asked for by the owner)

Two reviewers went through every screen: words (`reviews/REVIEW2_WORDS_2026_11_12.md`, 76 findings) and visuals (`reviews/REVIEW2_VISUALS_2026_11_12.md`, 48 findings). One fix round followed (commit 22b3cba3). Declined and held items are on must-do row D60, items (u) to (x).

## 10. Top-view art for the stage (2026-11-12, owner: "create new art for each, do not use simple line drawings")

Fifteen kinds that were line symbols on the Stage screen have their own art, drawn in code (react-native-svg), at 32 units to the meter, in the language of `cableinstall/scenes/floorArt.tsx`. No image file was created or changed. Contract: `stage/topArtTypes.ts` (centered on 0,0, front toward the audience, inside the kind's print-symbol footprint). The printed packet keeps its black line symbols.

**The convention for every played instrument:** the player is upstage of it, facing the audience, so the player's right hand is toward stage right. The print symbols for congas, bongó, timbales and the playback laptop were turned to agree with it in the same round.

| Kind | What is drawn | Checked against |
|---|---|---|
| percussion | A padded percussion table: tambourine, triangle and beater, güiro, two maracas, hand cowbell, two claves | Known from the trade |
| congas | Conga and the larger tumba, the tumba on the player's right; rawhide heads, counterhoops, lug hooks, staves | Thomann's guide to conga arrangement (tumba to the right); a 12½ in tumba listing (six lugs). Five lugs on the conga: trade knowledge, not sourced |
| timbales | 14 in macho on the player's right, 15 in hembra on the left, two bells on the center post on the audience's side | world-beats.com on timbales (which drum and which bell on which side); three Wikimedia Commons photographs of timbales. The bells' exact angle varies by player |
| bongó | Hembra (larger) on the player's right, macho on the left, center block | Wikipedia "Bongo drum" (larger drum on the right for a right-handed player); an LP Matador listing (four lugs) |
| piano | An upright, keys and player upstage; 52 white and 36 black keys, bass at the player's left | Known from the trade (88 keys = 122.5 cm) |
| acoustic-guitar | A steel-string guitar lying face up, neck upstage; drawn at 0.88 of life size to fit the footprint | Known from the trade (25.4 in scale) |
| horn | A B-flat trumpet as held, bell toward the audience. Third-slide ring, pinky hook and water key left out (not confirmed from above) | A stock photograph of a trumpet from overhead (which tube is on which side) |
| playback | A laptop on a small table with a compact audio interface; the operator is upstage, the screen edge toward the audience | Known from the trade |
| iem | One half-rack in-ear transmitter on a rack shelf, antenna and two input plugs at the rear | A retailer's listing for the half-rack size (198 × 172 mm); panel and rear layout from the trade |
| drum-fill | A subwoofer with a two-way box standing on it, grilles toward the front | Known from the trade |
| sidefill | A three-way trapezoid cabinet on its sub (670 mm front, 419 mm rear, 749 mm deep), two flying tracks | A manufacturer's datasheet for a trapezoid three-way cabinet (the sizes; it confirms two tracks, not their angle) |
| rack | A shock-mount rack case, lids on: ball corners, lid seams, butterfly latches | Known from the trade |
| power | A rubber stage quad box (120 × 107 mm) on its cable, with a loop of slack | A manufacturer's datasheet for a quad box |
| chair | An orchestra chair: seat, curved backrest upstage, four glides | Known from the trade |
| music-stand | A solid-desk stand on a tripod, the lip on the player's side | A retailer's listing for a symphony stand (desk 20 × 12.5 in) |

Scale: instruments are drawn at or slightly over life size (congas 1.1, bongó 1.2, timbales 1.3, trumpet 1.17), as the stage already does for people and the drum kit. Tests: `test/stagePlotArtInstruments.test.ts`, `test/stagePlotArtGear.test.ts` (each piece inside its footprint, shadow first, no text, image or hook, and the facts in the table).

## 11. Stage shapes, stage boxes and more symbols (2026-11-13/14)

| Round | Commit | Builder reports in this folder |
|---|---|---|
| 1 | 8e84e3eb | FEATURE_SHAPES_BOXES_20261113, FEATURE_SYMBOLS_20261113 |
| Label fix | 3d76d0f4 | FIX_SHAPE_LABELS_20261113 |
| 2 | a3a61354 | FEATURE_BOXES_R2, FEATURE_SHAPES_R2, FEATURE_SYMBOLS_R2 (all _20261113) |
| 3 | 8aeb2847 | FEATURE_BOXES_R3, FEATURE_LABELS_R3, FEATURE_SYMBOLS_R3 (all _20261113) |

The owner's report: `C:\Users\profe\Downloads\2026-11-13_STAGE_PLOT_NEW_FEATURES_REPORT.html`, with pictures 01–85 in the `_PICTURES` folder.

**Sources for real-world sizes:**

| What | Value | Source |
|---|---|---|
| Leslie 122 / 147 cabinet | 29¼ × 20⅝ in (0.743 × 0.524 m) | Hammond's specification page (hammondorganco.com/trad-leslie-specifications); Thomann lists the 122H at 743 × 525 mm |
| Choral risers | 12–16 singers per 3-step 6 ft unit, where 12 is shoulder to shoulder and 16 is shoulders overlapping, with a floor row included; the lab uses 4 a row (about 0.44 m) and the packet advises 3 a row for shoulder room | Wenger brochure LT0024, quoted in `spChoir.ts` |
| Marimba | 5-octave, 2.6 × 1.05 m | Yamaha's published 261 × 103 cm |
| Hand harmonium | Bina No. 23B, 3¼ octaves, 21½ × 12 × 13 in, 4 stops and 2 drones | A US retailer's listing (FEATURE_SYMBOLS_R3) |
| Timpani | A set of four (32 / 29 / 26 / 23 in), American or German order; footprint 2.6 × 1.52 m with the stool (the timpanist is the performer symbol) | Audio-expert review (FEATURE_SYMBOLS_R2/R3) |

**Owner decisions:**
- **Credit:** blank stage only; "Plot only" does not count; PRINT counts once the dialog opens.
- **Shaped "Plot only" packets** may run to 2 pages to keep equipment names (2026-11-13).
- **Hidden names at 320 wide** are accepted (2026-11-14): "The 320 wide will just have to deal with it".
- **The drum riser** is sizable (SIZE Width/Depth, corner handle) and movable; a caption with no room is named by the key.

**Changes old plots show:**
- the salsa example's "Nelson (M5)" moved about 2 pt in print;
- an old choir prints "(11 singers, 3 rows)";
- the venue choice "Return lines from the house position…" now reads "Return lines to the stage (from FOH or the monitor position)";
- phone label layouts on every plot.

**Not verified:** a real phone (waits for the owner's OTA); anything heard.
