# Stage Plot: round 3 of the added symbols (2026-11-13)

The owner said "build the remaining held items too" about section 8 of `FEATURE_SYMBOLS_R2_20261113.md`. This is builder H's work. It ran beside builder F (stage boxes) and builder G (label placement and shapes). Shared files were changed only by small, targeted edits. Nothing is committed; the lead commits.

All six held items are built. Nothing is held back.

## 1. German timpani setup: built

**What the student sees**
- A **Setup: AMERICAN / GERMAN** choice.
- It appears where timpani are added (palette, step "HOW THE DRUMS STAND", before the package is chosen) and in the object's details ("TIMPANI SETUP").
- Both places use one control: `stage/TimpaniSetup.tsx`.
- The help line says which drum is where and asks the student to check with the timpanist.

**The drawing**
- The German setup is **its own layout**, `SP_TIMPANI_GERMAN` in `spSymbols.ts`. The largest drum is at the timpanist's right (stage right). From the player's left the drums read 23, 26, 29, 32 in.
- Every rim is still 0.55 m from the stool, and the set has the same box as the American one.
- The drawing is not reflected. The stage's "no flip / no mirror" source check still passes. Light and shadow fall the same way in both setups.
- **Screen art:** `TimpaniSetTop({ setup })` in `topArtR2.tsx`, drawn by a new `case 'timpani'` in `stageArt.tsx`.
- **Print:** `spObjectSymbol` gives the German symbol for a German set.
- **TURN and name clearance:** both work in both setups (tested at 0° and 90°, and checked on the phone).
- **Key:** one "Timpani (set of four)" entry, drawn American.

**Package words** (`spTimpaniPackages(setup)` in `spCatalog.ts`; `stageTimpaniPackagesFor` in `stageLinks.ts`)
- Same package ids and same input rows in either setup.
- The words say which setup is drawn.
- The pair package says which microphone is over the low drums: "Timpani R is over the 32 and 29 in drums" (American), "Timpani L …" (German).
- The per-drum package lists the drums largest first, in both setups.

**Saved data**
- One optional field: `SpObject.timpaniSetup` ('american' or 'german').
- If the field is missing, the set is American, so old plots are unchanged.
- `spMigrate` drops a damaged value, and drops the field from anything that is not timpani.
- A copy keeps the field. The schema version stays 2.

## 2. Choir figures without shoulder overlap: built

**The change**
- Singers in a choir now use the house figure's new **narrow build**, 400 mm across instead of 476. This is an optional `build="narrow"` setting on `FigureAboveSvg` (`src/features/lab/figureAboveSvg.tsx`). Every other plan keeps the standard figure.
- It is the same single body outline, made narrower only between the armhole seams, so the arms keep their width. This was a visual-review fix.
- The head and the chest-to-back depth are unchanged.
- **Where 400 mm comes from:** the FAA Technical Operations anthropometric survey (HFDS Appendix B, item 24) gives clothed shoulder (bideltoid) breadth for women as 40.0 cm at the 5th percentile and 45.4 cm at the median. 400 mm is therefore a slim adult, not an average one (see item 5).

**The result**
- At 0.44 m spacing, neighbouring bodies now have about 4 cm between them.
- Each figure's light outline is now 1.0 unit wide (it was 1.4), so neighbouring outlines stay apart. The test checks this at every size from 4 to 60 singers and every row setting.
- A choir in one row on the floor now gets one shadow per singer. The single dark strip behind all of them looked like a bench (visual-review fix).
- **Unchanged:** riser units, counts, footprint, and the 11-singer, 3-row layout (4 + 3 + 4, 1.85 × 1.4 m).
- **Visible change:** old choirs look slightly slimmer on screen, which the owner has accepted. The printed symbol is unchanged (circles).
- **Pinned tests:** no earlier test measured figure width, so none needed changing for this item.

## 3. Harmonium checked against a named model: built

**The model:** Bina No. 23B, 3¼ octave, a typical kirtan harmonium. The listing is Musician's Mall USA, https://www.musiciansmallusa.com/bina-23b-kirtan-harmonium. It says: "3 1/4 octave keyboard, an octave coupler, 3 fold bellows, 4 stops and 2 drones", reeds "voiced B/M" (bass and male), "21 1/2 by 12 by 13 inches" open, 21 lb.

**On wording:** the live-sound reviewer advised calling it "typical", not "widely sold":
- sitar-tabla.com lists the 23B as discontinued.
- A 3½-octave "23B Dx" is also sold under the same name.

**What changed**

| | Before | Now |
|---|---|---|
| Case | 0.60 × 0.30 m | 0.546 × 0.305 m (21½ × 12 in) |
| Knobs | 7 equal knobs | 4 stop knobs and 2 smaller drone knobs, one drone at each end |
| Shadow | a full rectangle | follows the bellows' wedge shape (visual-review fix) |

- The drone order on a 23B is not published, so the drawing does not claim one.
- One Bina manual (model not named) says the drones are the smaller knobs.
- **Unchanged:** 39 keys from C to D (23 white, 16 black), low end at the player's left. The reviewer confirmed this with a listing that says "39 keys C to D".
- **Unchanged:** bellows hinged at the player's right, the floor rug, and the 1.0 × 1.0 m footprint.
- **Octave coupler: not drawn, on purpose.** Its position on a 23B is not published, and a venue does not need it. The code says so.
- **Pinned test updated on purpose:** in `test/stagePlotSymbolsR2_20261113.test.ts`, the line "harmonium 0.60 × 0.30 m" is now 0.546 × 0.305 m, marked "owner 2026-11-13: build the remaining held items".

## 4. Singer count printed: built

All of this comes from the existing name-and-text code in `spPacket.ts` (`objectLabel`, `whoCell`, the stage-notes list). No label placement code was touched. The words come from `spChoirCountWords` and `spChoirRiserNote` in `spChoir.ts`.

**What prints, and where:**
- **Name beside the choir on the plot** (PDF, HTML packet, text view): "Choir (24 singers, 3 rows)". One row reads "(5 singers, 1 row)". A size note the student typed is added after it: "Choir (24 singers, 3 rows; gospel choir)".
- **Input list, "Performer and where the input is":** "Choir · at the choir (24 singers, 3 rows), upstage center".
- **"Notes on the stage"** (added on the reviewer's advice):
  - Example line: "Choir (24 singers, 3 rows): Choral risers: 3 × 6 ft (1.83 m) three-step riser units, 3 rows."
  - It also explains the spacing (see item 5).
  - It also appears when a choir has a typed note, and it is skipped for a choir in one row on the floor.

**Which outputs change for an old plot** (an 11-singer, 3-row choir saved before):
- **The plot name:** it gains "(11 singers, 3 rows)".
- **Every choir microphone's "where" cell:** gains the same words.
- **"Notes on the stage":** a new riser line.
- **Unchanged:** the screen editor's names, the equipment table and the key.
- **Example bands:** none contains a choir or timpani, so none changed (the existing test still holds).

## 5. Riser figures, from Wenger's own text: sourced; spacing kept

**Source:** Wenger Choral Risers brochure LT0024 (https://www.wengercorp.com/Lit/Wenger_Choral%20Risers_BRO_LT0024.pdf), "Signature Choral Riser Sets", 3-step 098H053:
- GROUP CAPACITY 12-16, UNITS NEEDED 1, SPACE REQUIRED 6'w x 4'10"d.
- Steps "18" (457 mm) deep"; the riser "6' (1829 mm) wide at back of third step".
- The footnote, word for word: "First number indicates how many high school students will fit on a riser set if all students stand shoulder to shoulder. Second number indicates how many students will fit on a riser set if they are all facing center with shoulders overlapping. Numbers include a row of students standing on the floor. Adult groups should use lower number."
- The Tourmaster 6 ft table in the same brochure gives the same 12-16 per unit.

**What this corrects**
- Round 2 had the two numbers the wrong way round. 16 is the overlapping-shoulders figure, and both numbers count a row on the floor.
- So the tool's 4 singers a row on a unit (about 0.44 m each) matches Wenger's tight, overlapping-shoulders packing. That is close spacing for adults.

**The decision (live-sound reviewer): keep 4 a row**
- Changing it would double the riser units for small choirs.
- It would also change the footprint of every saved plot.
- Instead, the packet now says so in the stage notes: "Drawn at about 4 singers a row on each unit (about 0.45 m, 18 in, a singer, staggered). An adult choir that wants shoulder room needs 3 a row: about one riser unit for every 8 singers." (The figure is worked out for each step count: 3 + 2 + 3 for three steps.)
- The quote is in the `spChoir.ts` header comment, and a test holds it.
- **Owner option, not built:** a "close / roomy" spacing choice for new choirs only.

## 6. Timpani footprint: 2.6 × 1.52 m, final

- The footprint is the drums and the stool, in both setups.
- The live-sound reviewer agreed: the timpanist is the separate performer symbol on the stool. Adding the body to the drum symbol would count the player twice.
- What a venue needs is the deck size. The reviewer's own sizing for a riser under the set is at least 12 × 8 ft, which allows about 0.5 m behind the stool.

## Reviews and fixes

**Live-sound reviewer** (fresh subagent) confirmed items 1, 3, 4 and 6 and decided item 5. Applied:
- the German layout drawn on the other side of the center line (not the sizes swapped into the American places);
- the pair package's low-side sentence;
- largest first in both setups;
- the 23B wording and the drones as smaller knobs;
- the riser line in the stage notes;
- keeping 4 a row, with the printed note.

**Visual-accuracy reviewer** (fresh subagent, given PNGs and code, not my conclusions). Fixed:
- **One-row choir strip:** must fix, done.
- **Print stool:** now dashed, so it never reads as a fifth drum.
- **Harmonium shadow:** follows the bellows.
- **Narrow build:** keeps the arm width.
- **Outline width:** 1.0.
- **Pedals:** now about 15 cm past the bowl, aimed at the player's feet (0.15 m in front of the stool), on screen and in print.
- **Octave coupler:** the code now says why it is not drawn.

**Not changed:**
- **24-singer choir:** its back row stands half a place off center. That is the round-2 rule for an odd leftover; it is unchanged and unavoidable at 24.
- **Found correct:** the German set, both print symbols, the figures, the harmonium keys, knobs and bellows, and the printed page.

## Files

**New**
- `src/screens/lab/stageplot/stage/TimpaniSetup.tsx`
- `test/stagePlotSymbolsR3_20261113.test.ts` (16 tests)
- this report

**Changed by small edits**

| File | What changed |
|---|---|
| `spTypes.ts` | `timpaniSetup?`, `SpTimpaniSetup` |
| `spModel.ts` | the new-object step and the `spMigrate` step |
| `spSymbols.ts` | `SP_TIMPANI_GERMAN`, `spTimpaniLayout`, `spTimpaniPedalDeg`, `timpaniSymbolOf`, `spTimpaniGermanSymbol`, `spObjectSymbol`, the harmonium and its knobs |
| `spCatalog.ts` | `spTimpaniPackages`, `SP_TIMPANI_SETUP_WORDS` |
| `spChoir.ts` | the Wenger quote, `spChoirCountWords`, `spChoirRiserNote` |
| `spPacket.ts` | `objectLabel`, `whoCell`, the stage notes |
| `stageLinks.ts` | `stageTimpaniPackagesFor` |
| `stageArt.tsx` | `case 'timpani'` |
| `topArtR2.tsx` | timpani by setup, pedals, harmonium |
| `topArtWorld.tsx` | narrow singers, per-singer floor shadows |
| `StagePalette.tsx` | setup step |
| `StageInspector.tsx` | TIMPANI SETUP |
| `src/features/lab/figureAboveSvg.tsx` | optional `build` |
| `test/stagePlotSymbolsR2_20261113.test.ts` | the harmonium pin, marked |

**Not touched:** label placement, stage boxes, `package.json`, `useLabNav.ts`, `modules/`, any image file, git, eas, server.

## Checks

**Tests**
- `node --test --test-timeout=120000 test/stagePlot*.test.ts`: 964 tests, 953 pass, 11 fail. **None of the 11 is mine.** They are all builder G's work in progress:
  - the readout words in `StagePlanView.tsx`;
  - phone name placement in `stageGeom.ts`, which was being edited at 23:28.
  - An earlier run also showed builder F's box tests failing mid-way.
- The three symbol test files together (`stagePlotSymbolsMore`, `R2`, `R3`): 168 of 168 pass.

**Type check:** `npx tsc --noEmit -p .` gives one error, `StagePlanView.tsx(88)`: `stageReadoutWords` is not exported from `stageGeom`. That is builder G's work in progress. There are no errors in my files.

**Browser** (own tab):
- **At 390 wide:**
  - chose GERMAN before the package, and read the pair package's German words;
  - added the set (largest drum at stage right);
  - added a 24-singer choir (narrow figures, clear of each other);
  - turned the set 90° (name clear);
  - switched to AMERICAN in the details (the drawing followed).
- **At 320 wide:** the same stage laid out correctly.
- **Afterwards:** viewport reset to desktop, tab closed.
- **Not pressed:** DOWNLOAD PDF, SHARE, PRINT, sign-in, purchase or Sound Safety.
- **Not checked:** a real phone, and sound.

## Pictures

In `C:\Users\profe\Downloads\2026-11-13_STAGE_PLOT_NEW_FEATURES_PICTURES\`:
- `80_timpani_american_and_german_screen_and_print.png`
- `81_choir_figures_before_after_11_and_24_singers.png`
- `82_choir_figures_before_after_6_and_5_singers.png`
- `83_harmonium_bina_23B_screen_and_print.png`
- `84_pdf_plot_page_and_input_list_choir_24_singers.png`: the real PDF writer, the plot page and the input list.
- `85_phone_390_german_timpani_choir_setup_choice_turned_and_320.png`: the real app.

The PNG renderer does not draw gradients, so 80–83 show the figures' shirt and skin in flat middle tones. The phone picture shows the real look.

Scratch renders and scripts are in `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\r3H\`: `r3render.mjs`, `mk_pdf_r3.mjs`, `big\`, and the PDFs.

## Sources
- Wenger Choral Risers brochure LT0024: https://www.wengercorp.com/Lit/Wenger_Choral%20Risers_BRO_LT0024.pdf
- FAA Human Factors Design Standard, Appendix B, Technical Operations anthropometry: https://hf.tc.faa.gov/hfds/download-hfds/hfds_pdfs/App_B_Tech_Ops_Anthropometrics.pdf
- Musician's Mall USA, Bina 23B Kirtan Harmonium: https://www.musiciansmallusa.com/bina-23b-kirtan-harmonium/
- Bina harmonium manual (drones are the smaller knobs; coupler position): https://manuals.online/bina/electronic-keyboard/harmonium/user-manual/1pelz and https://manuals.online/bina/musical-instrument/harmonium/user-manual/2bhhn
- sitar-tabla.com, Bina harmoniums (23B discontinued): https://sitar-tabla.com/binaharmonium.htm
