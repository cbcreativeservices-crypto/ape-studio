# Stage Plot: round 2 of the added symbols (2026-11-13)

The owner said "Yes, build them all" about the items held in `FEATURE_SYMBOLS_20261113.md` section 7. This is builder E's work. It ran beside builder C (stage boxes) and builder D (shapes and labels). Shared files were changed only by small, targeted edits. Nothing is committed; the lead commits.

Three things were built:
1. A choir of any size.
2. The Leslie at the maker's size.
3. Five new kinds: marimba, timpani, flute, hand harmonium and harmonica.

## 1. A choir of any size

**What the student does:**
- They set **Singers** (4 to 60) and **Rows** (AUTO, 1, 2, 3 or 4).
- They do it in the palette before the package is chosen, so the package fits the choir. They can also do it later in the choir's OBJECT details (CHOIR SIZE).
- The same control is used in both places: `stage/ChoirSize.tsx`.

**What follows from the size (all from `spChoirLayout`, `src/features/stageplot/spChoir.ts:106`):**
- The riser.
- The screen art.
- The print symbol.
- The key.
- TURN.
- The room a name keeps clear.
- The free place a new choir is dropped in.
- The area-microphone package.
- The review.

**The numbers, and where they come from:**

*The riser*
- It is drawn as **sold choral riser units**: 6 ft (1.83 m) wide, with 18 in (0.46 m) steps.
- Source: Wenger's layout sheet for its 6 ft, 3-step, 18 in riser (Wenger Signature Choral Riser Riser Layouts PDF, and the Wenger Choral Risers brochure LT0024). It lists **12 to 16 standing performers per unit** (16 is shoulder to shoulder) on about 6 ft × 4 ft 10 in.
- The tool uses the 12-performer figure: about 0.44 m a singer across.
- The live-sound reviewer agreed. A venue gives floor by riser units, not by meters.
- The brief's "0.5–0.6 m across, 0.6–0.75 m rows" fits a choir standing on a flat floor or sitting, not a riser. A choir in one row therefore stands on the floor, with no riser, at **0.5 m a singer**.

*Window spacing*
- Rows are counted across the whole riser. From the back, a full row holds 4 × units, the next row holds 4 × units − 1, and so on.
- The fewest units that seat everybody are used.
- Empty places come off in pairs from the fullest row, so every row stays on its own seats.
- When one empty place is left over, the back row stands half a seat off center. The window spacing still holds at every size (visual review fix).

*Rows on AUTO*
| Singers | Rows |
|---|---|
| 4–5 | 1 |
| 6–7 | 2 |
| 8–35 | 3 (the riser most venues own) |
| 36–60 | 4 |

This follows the reviewer's change.

*Area microphones*
- The rule is **about one for every 2.5 m of choir width, at least 1, at most 6** (`spChoirMics`, spChoir.ts:182). One cardioid microphone covers 15 to 20 voices.
- The brief's "one per 8–12 singers in a row" was changed on the reviewer's advice: it asks for too many microphones.
- The placement words (spChoir.ts:199) say: tall stands 0.6–0.9 m in front of the front row, 0.3–0.6 m above the back row's heads, aimed at the back row. The 3:1 rule is in plain words, "as few as cover it", plus 0.9 m of clear floor in front for the stands.

**Packages (`spCatalog.ts`, `choirPackages()`; `stageLinks.ts` `stageChoirPackageIds`):**
- The choir offers the package for its own width first: `choir-one` … `choir-six`. The rows are named Choir; Choir L/R; Choir L/C/R; Choir 1…n.
- The left/right pair `choir-two` is offered second.
- `choir-three` keeps its id, so old plots still read it. It is no longer offered for the default 11-singer choir: three microphones across 1.85 m breaks 3:1.

**The review (`spReview.ts:417`):** it asks a question when a choir's source has fewer area microphones than the rule, or more than the rule + 1.
- An 11-singer choir with the L/R pair stays quiet.
- **Note:** an old plot that added `choir-three` to an 11-singer choir now gets this question. That is intended, on the reviewer's advice.

**Saved plots:**
- The new optional field is `SpObject.choir = { singers, rows }` (spTypes.ts:346).
- `spMigrate` (spModel.ts:1712) reads a choir with no size, or a damaged one, as **11 singers in 3 rows**. Only a choir keeps the field.
- **No schema bump:** a reader that does not know the field keeps it and draws the old choir. A test (stagePlotShapesBoxes) pins `SP_SCHEMA = 2`, and neither other builder bumped it.
- One unit at 11/3 is 4 + 3 + 4 on a 1.85 × 1.4 m footprint, as before. A test checks that the riser and every singer are where the old drawing had them, within 2 cm.
- **One visible change:** the old **print** symbol had 16 circles while the screen drew 11. Print now draws the same 11.
- A new choir is 11 singers on AUTO, which gives 3 rows: the same drawing.

## 2. The Leslie's real size

**Source:** Hammond's own page, hammondorganco.com/trad-leslie-specifications, prints **29 1/4 in W × 20 5/8 in D × 41 5/8 in H, 149 lb** for the Leslie **122A, 147A and 122XB** (and the 981). Thomann lists the current 122H at 743 × 525 × 1045 mm.

**The result:**
- The cabinet is **0.743 × 0.524 m**. The "0.83 × 0.55 m" memory is wrong.
- The symbol is a 122 and a 147 alike. They are the same cabinet, rotors and speakers. The 122's amplifier has a balanced input for console organs; the 147's is unbalanced. That makes no difference on a plot.
- The print rectangle is now exactly 0.743 × 0.524 m, and the footprint is 0.75 m wide (spSymbols.ts:622).
- The screen cabinet was already within 2 cm.
- The print's cable is now one line: a 122 or 147 has one lead (visual review).

## 3. Five new kinds

These are in the palette (INSTRUMENTS) and the key. Each has screen art (`stage/topArtR2.tsx`) and a black-line print symbol (`R2_SYMBOLS`, spSymbols.ts:291). The screen and print share one geometry (`SP_MARIMBA`, `SP_TIMPANI`, `SP_FLUTE`, `SP_HARMONIUM`, `SP_HARMONICA`).

Each one also:
- Asks what it stands for (`SOUND` in stageLinks).
- Is asked about in the review when nothing is behind it.
- Gets a TURN, its name kept clear, and a draw order.
- Is placed from a source's own name (`KIND_WORDS`).

| Kind | Palette / key name | The object | Packages (generic only) |
|---|---|---|---|
| `marimba` | Marimba (5-octave) | 2.6 × 1.05 m: Yamaha publishes 261 × 103 cm for its YM-5100A and 272 × 116 cm for the YM-6100 (both 5 octaves, C–c4). 36 naturals and 25 accidentals; the low C is at the player's left; the gap is an even 16 mm; resonator rims show in the gaps. | `marimba-two`: low/high small-diaphragm condensers, tall booms, 0.5 m above. `marimba-three`: low/mid/high. Notes that a 4.3-octave is about 2.0 × 0.9 m. |
| `timpani` | Timpani (four drums); key: (set of four) | A set of four (32/29/26/23 in), American setup: the largest is at the timpanist's left. Every rim is 0.55 m from the stool. Chrome counterhoops, handles (8 on the large drums, 6 on the small), the gauge and the pedal toward the player. 2.6 × 1.52 m. | `timpani-pair` (offered first): a pair 1–1.5 m above. `timpani-each`: Timpani 32 in / 29 in / 26 in / 23 in, tall stands. The German setup is described in words. |
| `flute` | Flute | A concert flute, 0.67 m, held to the player's right, the foot a little forward. The lip plate is at the player's left end. Key cups are grouped left hand / right hand, and the open-ring keys show their holes. The tube is drawn about 1.3 × its width so it reads at phone size. | `flute-stand`: a small-diaphragm condenser on a tall boom, about 15 cm from the lip plate, never into the air stream, with a windscreen; it says the flute needs a strong monitor. `flute-clip`: clip-on. The saxophone also gains `sax-flute` (a doubler). |
| `harmonium` | Hand harmonium; key: (on a floor rug) | The Indian/Pakistani hand harmonium: 3¼ octaves, 39 keys (23 white, 16 black, the low end at the player's left), 0.60 × 0.30 m, on the rug the player sits on. The keys face the player. Stop and drone knobs sit in a row behind the keys, seen side-on (they pull toward the player). The top cover is plain. The bellows are on the back panel, hinged at the player's right and opened at the left by the left hand. | `harmonium-mic`: a small-diaphragm condenser on a low boom, 20–30 cm from the reed openings. `harmonium-vocal`: plus the player's vocal on a low boom. |
| `harmonica` | Harmonica; key: (its microphone and harmonica case) | The player's dynamic microphone on a straight round-base stand: the clip sits on the pole, and the microphone points at the player. An open case of 12 harmonicas (102 × 22 mm each, the ten holes up) sits on a small table at the player's right. | `harmonica-mic`: a dynamic vocal microphone on a straight stand, cupped by the player. `harmonica-amp`: the player's bullet microphone into their own amplifier, with the amplifier miked. `harmonica-di`: a line out through a high-impedance DI. All three say "Most harmonica players also sing: add a vocal microphone." |

**Why the harmonica is a symbol at all (decided with the live-sound reviewer):**
- A harmonica is held in the hands, so the plot shows what the venue must provide: the player's microphone and stand, and the case of harmonicas in several keys.
- No hands are drawn: figure rules.
- It is drawn **over** the performers, like every microphone. It is the one new kind not in `INSTRUMENT_KINDS`. It is still listed under instruments, where students look for it.
- An amplifier is placed with the existing amplifier symbol, named "Harp amp".
- "Harmonica", "blues harp", "harp mic" and "harp amp" now map to this symbol. The first round's test said the vocal microphone; those two lines were updated (`test/stagePlotSymbolsMore_20261113.test.ts`, with a comment).
- **Other new `KIND_WORDS`:** marimba; timpani, timp and kettle drum; flute and piccolo (now before the generic horn rule); harmonium.

**Draw order:** marimba, timpani, flute and harmonium are under the performers; the harmonica is over them (stageGeom.ts:249).

**Not changed:**
- The example bands: none places a round-2 kind or a choir (tested).
- No image files: all the art is code.
- No package.json, no git, no eas, no server.

## 4. Files

**New:**
- `src/features/stageplot/spChoir.ts`: the choir layout, rules and words.
- `src/screens/lab/stageplot/stage/topArtR2.tsx`: the art for the five new kinds.
- `src/screens/lab/stageplot/stage/ChoirSize.tsx`: the size control.
- `test/stagePlotSymbolsR2_20261113.test.ts`: 52 tests.
- This report.

**Changed by small edits:**
- `spTypes.ts`: 5 kinds; `SpChoir`; `SpObject.choir?`.
- `spSymbols.ts`:
  - `spChoirSymbol`, `spObjectSymbol` (used by `spObjectBoxM` and `spPlacedShapes`), the legacy choir.
  - `R2_SYMBOLS` and the shared geometry.
  - Key names and order.
  - The palette's choir name is now "Choir" and its key name "Choir (a circle for each singer)": a one-row choir has no riser.
  - The Leslie.
- `spCatalog.ts`: 5 palette entries, `choirPackages()`, `sax-flute`, 11 new packages.
- `spModel.ts`: `pushObject` gives a new choir its size; the `spMigrate` choir step.
- `spReview.ts`: `SOUND_KINDS`; the `choir-mics` question.
- `stageLinks.ts`:
  - `SOUND`, `STAGE_PACKAGES` and `CATEGORY_OF`.
  - `stagePackagesFor(kind, choir?)` and `stageChoirPackageIds`.
  - `KIND_WORDS`.
  - `stageFreeSpot(…, choir?)`: a new choir gets room for its own riser.
- `stageGeom.ts`: `stageArtSize(kind, o?)` gives the choir's own box on the glass; `INSTRUMENT_KINDS`.
- `stageArt.tsx`: `STAGE_TOP_ART` adds `TOP_ART_R2`; a `case 'choir'` draws `ChoirTop` with the object's layout.
- `topArtWorld.tsx`: `ChoirTop` takes an optional layout. With none, it draws the old 11/3 drawing exactly, so the first round's tests still measure it.
- `StagePalette.tsx`: the choir size step before the packages.
- `StageInspector.tsx`: CHOIR SIZE.

The source-scanned lines that the stage tests pin were kept word for word.

## 5. Tests and checks

**Test file:** `test/stagePlotSymbolsR2_20261113.test.ts`. Source reads use `.replace(/\r\n/g,'\n')`.
- For each of the five kinds, the same checks as the 22:
  - palette and key;
  - inputs (generic only, pairs, review);
  - art (≥ 10 parts, ≥ 3 materials, shadow first, inside the footprint, centered, fills ≥ 90 %, matches its stated extent);
  - pure drawing;
  - print symbol inside its footprint;
  - TURN;
  - a plot that makes a PDF;
  - the name off the symbol at 0° and 90°.
- Also: orientation, draw order, real sizes and practice pins.
- **The choir:**
  - old load (11/3, same footprint, the singers within 2 cm of before);
  - damaged-size migration;
  - auto rows;
  - every size from 4 to 60 × every row setting: everybody placed, the fewest units, window spacing, inside the footprint;
  - screen art at 7 sizes;
  - the microphone rule;
  - packages;
  - the review in both directions;
  - free placement;
  - a copy keeps its size;
  - one key entry;
  - the name off the symbol;
  - a full A4 PDF.
- **The Leslie** against Hammond's figure.

**Results:**
- `node --test --test-timeout=120000 test/stagePlot*.test.ts`: **928 tests, 928 pass, 0 fail**. This run includes builders C and D's work in progress. An earlier run had 11 failures in C's `stagePlotBoxesMore` while their work was mid-way; it was clean on the final run.
- `npx tsc --noEmit -p .`: **no errors**.
- Formatting: the new files were checked with `prettier --single-quote --print-width 250`, the house style.

## 6. Pictures and renders

**In `C:\Users\profe\Downloads\2026-11-13_STAGE_PLOT_NEW_FEATURES_PICTURES\`:**
- `50_choir_sizes.png`: screen art for 4/1, 7, 11/3 (the old choir), 16, 24/2, 24, 40 and 60, then the print symbols.
- `51_new_symbols_sheet.png`: the five new kinds and the Leslie, screen and print.
- `52_phone_new_symbols.png`: the real app at 390 and 320 wide (a 24-singer choir and the five kinds, the key); CHOIR SIZE in the object details; the size step in the palette.
- `53_pdf_new_symbols.png`: a plot page from the real PDF writer: a 30-singer choir, a 6-singer choir, the five kinds and the Leslie on 44 × 28 ft.

**Scratch, in `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\r2E\`:**
- `big\` and `big3\`: one PNG per kind and size.
- `r2render.mjs` and `mk_pdf_r2.mjs`.
- `r2_plot_letter.pdf`.

The PNG renderer does not draw gradients, so the choir's singers look black there. In the app they are the grey-blue house figure (see 52).

**Browser checks:**
- Own tab, 390 and 320 wide: the choir set to 24 singers and then 4 rows; each kind placed; the key read.
- The 320 view laid out correctly once the page re-laid out after the resize.
- Afterwards the viewport was reset to desktop and the tab was closed.
- Not pressed: DOWNLOAD PDF, SHARE, PRINT, sign-in, purchase or Sound Safety.

## 7. Reviews and fixes

**Live-sound reviewer** (fresh subagent; its decisions were applied, as above):
- Riser units and 0.46 m; stagger across the whole riser; the auto-row bands; one row on the floor.
- The 2.5 m microphone rule; the choir-one default; choir-three no longer offered by default; the review thresholds.
- The marimba as a 5-octave instrument; timpani as a set of four, American setup, the pair first, tall stands.
- The flute words and the sax doubler.
- The harmonium's bellows side and hand, its packages, and the name "Hand harmonium".
- The harmonica as microphone + case, drawn over the performers, with three packages and the vocal note.
- The Leslie confirmed.

**Visual-accuracy reviewer** (fresh subagent, given PNGs and code). Fixed:
- **Timpani** (must fix): the chrome counterhoop is now the outer ring and the copper bowl is hidden under it; the invented ring on the head is gone; every rim is at an even 0.55 m reach.
- **Harmonica** (must fix):
  - The boom-like bar is gone: the clip sits on the pole, 6 cm from the microphone's tail.
  - Harmonicas are 102 × 22 mm with ten holes along the long side.
  - The table is bigger and wooden.
  - The lid strip is shown.
  - The grille shows its band seam and mesh, not a "+".
- **Choir** (must fix): every row stays on its own seats, so the window spacing never breaks. This was wrong at 16, 24 and 24/2.
- **Marimba:** an even 16 mm gap (bars 42–62 mm wide); resonator openings show in the gaps.
- **Flute:** key cups grouped left hand / right hand; only the open-ring keys show holes.
- **Harmonium:** knobs side-on (they pull toward the player); a plain lid instead of an invented grille.
- **Leslie print:** one cable.

**Found correct:**
- The marimba's accidental pattern and orientation.
- The harmonium's keys and bellows.
- The flute's joints.
- The Leslie's proportions.
- The choir's unit, step and spacing.

## 8. Held (for the lead and the owner)

1. **Timpani footprint.** It is 2.6 × 1.52 m: the drums and the stool. The reviewer's 2.8 × 1.8 m included the timpanist's body behind the stool, which is a separate performer symbol.
2. **German timpani setup.** The drawing is American; the German setup is said in the package words. TURN cannot mirror, and a mirror option is held.
3. **Choir singers' shoulders overlap a little at 0.44 m spacing.** This is the old 11/3 drawing's look, kept so old plots look the same. The owner can ask for wider figures.
4. **Harmonium:** traced from the reviewer's description and makers' listings (56–61 × 27–30 cm), not from one model's photo. The owner should look at it.
5. **Not checked on a real phone.** There is no device proof, and sound was never on.
6. **The packet does not print the singer count in words.** The drawing shows it to scale. Adding "(24 singers)" to the printed name would change old plots' labels, so it was not done.
7. **Wenger PDFs:** the per-singer figures come from the published capacities (12–16 per unit). The PDF's own drawings could not be text-extracted here.
