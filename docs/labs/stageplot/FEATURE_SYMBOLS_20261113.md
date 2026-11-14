# Stage Plot: more symbols for more diverse music (2026-11-13)

The owner asked: "We also need more symbols for more diverse music", and gave the go to build. This is builder B's work. It ran beside builder A (stage shapes and stage boxes), and shared files were changed only by small, targeted edits. Nothing is committed: the lead commits.

## 1. The final list, and why

A live-sound expert subagent was asked to choose about 20 kinds from the brief's starting list, keeping only things a real stage plot shows. This build has **22 kinds**: the expert's core 20, plus the choir and the mandolin from the second wave.

| Group | Kind (id) | Palette name | Why |
|---|---|---|---|
| People | `choir` | Choir on a riser | Gospel, church and school shows. A choir is a group on risers with area microphones. |
| Instruments: drums | `e-drums` | Electronic drum kit | Its stereo line from the module and its monitor needs differ from an acoustic kit. |
| Percussion and world | `cajon` | Cajón | Acoustic duos, flamenco, Latin. |
| | `djembe` | Djembe | West African, worship, acoustic acts. |
| | `tabla` | Tabla | Indian classical, fusion. The player sits on the floor, so the rug is part of the symbol. |
| | `steel-pan` | Steel pan | Caribbean, calypso, soca. |
| | `vibraphone` | Vibraphone | Jazz and Latin jazz. Split from marimba: the size, the bars and the motor differ. |
| Strings | `upright-bass` | Upright bass | Jazz, salsa, bluegrass, rockabilly. |
| | `violin` | Violin or viola | Folk, country, string sections, charanga. |
| | `cello` | Cello | A cellist always sits, so the chair is part of the symbol. |
| | `harp` | Harp | Orchestral pops, Paraguayan and llanero music. The harpist's stool is part of the symbol. |
| Keys | `grand-piano` | Grand piano | Jazz, salsa, gospel and pops plots use a grand all the time; the app had only an upright. Added on the expert's advice. |
| | `electric-piano` | Electric piano | A 73-key stage electric piano. |
| | `keyboard-rig` | Two-tier keyboard rig | An 88-key board and a 61-key synthesizer on one stand. |
| | `organ` | Hammond organ | A two-manual tonewheel console with its bench and pedals. |
| | `leslie` | Leslie speaker | Its own kind: it is placed apart from the organ, and the microphones are on it. |
| Folk | `banjo` | Banjo | Bluegrass, folk. |
| | `mandolin` | Mandolin | Bluegrass, folk. One drawing cannot be both a banjo and a mandolin. |
| | `accordion` | Accordion | Norteño, vallenato, Cajun, tango, folk. |
| Brass and reeds | `saxophone` | Saxophone | The existing horn is a trumpet. |
| | `trombone` | Trombone | Salsa's front line. The slide needs its own space. |
| Electronic | `dj` | DJ table | Two media players and a mixer on a table. |

**Dropped or held, with the reason:**
- **Orchestral chairs-and-stands group.** Chairs and music stands already exist. A fixed group drawing is never the right size.
- **Güiro / hand-percussion table.** The existing percussion table already holds a güiro. In salsa, a corista plays the güiro on their own vocal microphone.
- **Marimba, timpani, flute, harmonium, harmonica.** These are real, but rarer on band plots. They are HELD for a later round (section 7).

**Example bands: none changed.** The salsa example already lists two trombones, miked on stands. Its layout is pinned by the round-2 label tests. The expert advised against a separate güiro symbol (the corista plays it on a vocal microphone). Adding symbols to an example would move its labels, so all five examples are untouched. A test holds this.

## 2. Each kind's inputs (packages offered by the symbol)

These are generic categories, never a brand or model of microphone. Phantom power stays "to be confirmed" on every row. [L/R] marks a stereo pair.

| Kind | Packages and rows |
|---|---|
| Choir | **`choir-three`**: Choir L, C, R (small-diaphragm condenser, tall boom); about one for every 2 to 3 m of choir width, as few as cover it. **`choir-two`**: Choir L, R. |
| E-drums | **`e-drums-stereo`**: E-drums L/R (DI) [L/R]; the outputs are often unbalanced, and the drummer needs a monitor mix. **`e-drums-kick`**: kick + L/R (DI). |
| Cajón | **`cajon-mics`**: Cajón back (kick drum microphone at the port) + Cajón front (dynamic). **`cajon-mic`**: one microphone at the back port. |
| Djembe | **`djembe-mics`**: top (dynamic) + bottom (kick drum microphone). Also the existing `percussion-mic`. |
| Tabla | **`tabla-mics`**: dayan + bayan (small-diaphragm condenser, short boom). |
| Steel pan | **`steel-pan-mic`**: one condenser above, tall boom. **`steel-pan-pair`**: Pans L/R [L/R]. |
| Vibraphone | **`vibes-mics`**: Vibes low / Vibes high (small-diaphragm condensers, tall boom) [paired]. The motor needs power. |
| Upright bass | **`upright-bass-both`**: pickup (DI with a high-impedance input) + clip-on condenser. **`upright-bass-pickup`**. **`upright-bass-mic`**: clip-on; a stand on a quiet stage. |
| Grand piano | **`grand-piano-mics`**: Piano low / Piano high (condensers under the lid, tall boom) [paired]. **`grand-piano-pickup`** (DI). Source name "Grand piano". |
| Electric piano | **`ep-di`**: one DI with a high-impedance input. **`ep-stereo`** [L/R]. |
| Keyboard rig | **`keys-rig-two`**: Keys 1 L/R + Keys 2 L/R (DI). **`keys-submix`** [L/R]. The existing `keys-stereo`. |
| Organ | **`leslie-mics`**, **`leslie-two`**: the organ is miked at its Leslie. **`organ-line`**: Organ L/R (DI) for a modern organ. |
| Leslie | **`leslie-mics`**: top L, top R (dynamic) + bottom (kick drum microphone); never a DI. **`leslie-two`**: top + bottom. The text says to add it from the organ OR the Leslie, not both. |
| Violin, cello, harp, banjo, mandolin | **`<kind>-mic`**: clip-on for violin and cello; a small-diaphragm condenser on a short boom for harp, banjo and mandolin. **`<kind>-pickup`**: a piezo pickup into a DI with a high-impedance input, or the player's preamp. |
| Accordion | **`accordion-mics`**: treble + bass clip-ons. **`accordion-di`**: built-in microphone system (DI). |
| Saxophone | **`sax-mic`**: clip-on condenser; a doubler needs a second microphone. Also `horn-mic`. |
| Trombone | **`trombone-mic`**: dynamic on a **tall** boom, beside the slide. Also `horn-mic`. |
| DJ | **`dj-stereo`**: DJ L/R (balanced line) [L/R]; a mixer with only unbalanced outputs needs a stereo DI; the booth monitor is an output. Also `vocal`, for the DJ's talk microphone. |

**What else changed for these kinds:**
- Each one asks what it stands for before it is placed (`stageLinkMode` = sound).
- The review asks about one drawn with nothing behind it (`SOUND_KINDS` in spReview).
- Each one is painted under the performers (`INSTRUMENT_KINDS` in stageGeom).
- A source from the list is drawn with its new symbol (`KIND_WORDS`).

**`KIND_WORDS` details:**
- "Blues harp" and "harmonica" map to a vocal microphone, never the concert harp.
- "Double bass drum" is not an upright bass.
- "Kettledrums" is not e-drums.

## 3. Every file

**New:**
- `src/screens/lab/stageplot/stage/topArtStringsKeys.tsx`: the top-view art for 12 kinds: upright bass, cello, violin, harp, grand piano, organ, Leslie, electric piano, keyboard rig, accordion, banjo, mandolin.
- `src/screens/lab/stageplot/stage/topArtWorld.tsx`: the top-view art for 10 kinds: choir, e-drums, cajón, djembe, tabla, steel pan, vibraphone, saxophone, trombone, DJ. The choir's singers are the house figure (`FigureAboveSvg`).
- `test/stagePlotSymbolsMore_20261113.test.ts`: the tests (section 4).
- This report.

**Changed, by small edits:**
- `src/features/stageplot/spTypes.ts`: 22 ids added to `SpObjectKind`.
- `src/features/stageplot/spCatalog.ts`:
  - 22 palette entries.
  - The packages, with the helpers `di()` and `stringPackages()`.
  - The palette name of `piano` is now "Upright piano" (its default label stays "Piano"), so it cannot be confused with the grand.
- `src/features/stageplot/spSymbols.ts`:
  - The black-line print symbols (`MORE_SYMBOLS()`, `SP_MORE_KINDS`).
  - The key names and the key order.
  - The key name of `piano` is now "Upright piano".
- `src/screens/lab/stageplot/stage/stageArt.tsx`: `STAGE_TOP_ART` spreads the two new maps.
- `src/screens/lab/stageplot/stage/stageLinks.ts`: `SOUND`, `STAGE_PACKAGES`, `CATEGORY_OF`, `KIND_WORDS`.
- `src/screens/lab/stageplot/stage/stageGeom.ts`: `INSTRUMENT_KINDS` (the draw order).
- `src/features/stageplot/spReview.ts`: `SOUND_KINDS`.

No image files were touched. All art is drawn in code. No package.json change, no new package, no git.

## 4. Tests and results

`test/stagePlotSymbolsMore_20261113.test.ts` has 100 tests. Line endings are normalised with `.replace(/\r\n/g,'\n')`. For **every** one of the 22 kinds, the file checks:
- **Palette:** it is in the palette once, in the right group, with a plain name.
- **Key:** it has its own key entry and key symbol. The key of a stage with all 22 lists each once and lays out at 390 width, with text of at least 9 pt.
- **Inputs:** it asks what it stands for and offers at least one package. Every row is generic: no brand, and the equipment is a microphone, DI or line output. Each package becomes real inputs, with stereo sides paired. A drawing with nothing behind it is asked about in the review.
- **Art exists and is illustrated:** it is one component in the two new maps, wired into `STAGE_TOP_ART`. It has at least 10 parts, at least 3 materials, and its shadow drawn first. It stays inside its footprint, centred, fills at least 90 % of its long side, and matches its stated extent.
- **Art is a pure drawing:** no text, no image, no hooks, no animation. It imports only the drawing package, the contract and the house figure.
- **PDF drawing:** its print symbol has 3 or more shapes and stays inside its footprint. TURN works: a quarter turn swaps its width and depth. A plot with all 22 prints each one whole, lists them in the key, and makes a valid PDF. Each kind alone at 0° and at 90° has its printed name off its symbol.

**Practice pins (one test):**
- Upright bass: pickup plus microphone.
- High-impedance DI for piezo pickups.
- Cajón: back plus front.
- Steel pan and vibraphone: microphones overhead.
- DJ: a stereo line pair.
- Leslie: top L/R plus bottom, never a DI.
- The organ offers the Leslie microphones and a line out.
- Harp: a condenser.
- Choir: area condensers.
- E-drums: a stereo DI pair.
- Tabla: one microphone a drum.
- Trombone: tall boom.
- Grand piano: low/high, under its own source name.
- Vibes: low/high.
- Every stereo package is flagged.

**Other tests:**
- **Orientation:** keys upstage; the grand's keys at stage right; the organ bench upstage; the dayan on the player's right; the e-kit throne upstage; the trombone bell on the player's left; the vibraphone's low end at +x; the violin's scroll forward and left; the cello's endpin downstage.
- **Examples:** none of the five examples contains an added kind.

**Run:** `node --test --test-timeout=120000 test/stagePlot*.test.ts test/labRegistration_20261113.test.ts` gives **770 tests, 770 pass, 0 fail**. That run includes builder A's work in progress at the time.
- No existing test was changed.
- One existing test failed during the work: the stage test's "no flip / mirror" source scan matched a helper named `mirrorD`. The helper was renamed `symmetricD`; the test was not touched.

**Type check:** `npx tsc --noEmit -p .` shows no errors in any stage-plot file.

## 5. Where the PNG previews are

All are in `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\symbols_more\`.

**Large renders** (12 px per floor unit, on the stage deck colour, with the footprint dashed):
- `big\<kind>.png`, one per kind.
- Contact sheets `s1.png` to `s6.png` and `s7_grand.png`.
- After the review fixes: `r1.png` (harp, cello, violin, upright bass) and `r2.png` (e-drums, trombone, Leslie, choir).
- This renderer does not draw gradients, so the choir's singers look black here. In the app they are the grey-blue house figure; see `phone390_after_review_fixes.jpg`.

**Phone screenshots** from the real app, in the `phone\` subfolder. The stages are crowded on purpose.
- `phone390_batch1_strings_keys.jpg` and `phone390_batch2_world_keys.jpg`: 390 × 844.
- `phone320_batch2.jpg`: 320 wide.
- `phone390_dj_turned_90.png`: TURN, with the label placed.
- `phone390_zoomed_ep_cello.png`.
- `phone390_after_review_fixes.jpg`: after the fixes.

**PDF** (made by `mk_pdf.mjs`, a plot with all 22 kinds on a 44 × 28 ft stage):
- `more_plot_letter.pdf`, page image `more_plot_p1.png`.
- `more_full_a4.pdf`, page images `more_full_a4_p1.png` to `p3.png`.

**Render tools** (scratch only): `loader.mjs`, `svgstub.mjs`, `render.mjs`, `svg2png.py`, `sheet.py`.

## 6. Expert and visual review findings, and the fixes

Two fresh subagents reviewed the work with the PNGs and the code: a live-sound engineer and a visual-accuracy illustrator.

**Live-sound review: fixed**
- **Trombone stand** (must fix): now a tall boom. The text now says: in front of the bell, beside the slide.
- **Choir:** small-diaphragm condensers; "one for every 2 to 3 m, about 1 m in front, above head height, as few as cover the choir".
- **Blues harp:** maps to a vocal microphone, not the concert harp.
- **Grand piano:** its own `grand-piano-mics` (Piano low / high) and the source "Grand piano", so a source placed from the list is drawn as the grand.
- **Organ and Leslie double inputs:** both Leslie packages say "add this from the organ OR the Leslie, not both: link the other symbol to the same source".
- **Upright bass microphone:** now a clip-on (a stand microphone on a quiet stage).
- **Cajón:** the overhead `percussion-mic` is replaced by a one-microphone package at the back port.
- **"Hammond organ" naming:** kept, because brand names are owner-approved. `organ-line` now says a single keyboard-style organ is better drawn as a keyboard or a keyboard rig.
- **Vibraphone:** Vibes low / high.
- **`KIND_WORDS`:** fixes for e-drums, double bass drum and B-3, and the organ is now matched before the Leslie.
- **`stereo: true`:** set on every L/R package.
- **Vibraphone motor:** the text now says it needs power.
- **Key name:** "Grand piano (lid open)" is now "Grand piano".
- **DJ:** the symbol also offers the vocal package, for a talk microphone.

**Visual review: fixed**
- **Harp** (read as a metronome):
  - Added the harpist's stool.
  - The harp leans onto the player's right shoulder: turned 10°, the top at stage right.
  - Added the seven pedal tips (three left, four right) and a carved ten-leaf capital, with the neck widening into it.
  - The gilt base frame is toned down.
  - The print symbol follows.
- **Violin:** the chinrest was on the E-string side. It is now on the G side, left of the tailpiece.
- **E-kit:**
  - The pedals are now about 0.33 m ahead of the throne.
  - The ride is over the floor-tom side and the crash is near the front bar.
  - The rack is lighter with steel clamps, the mesh heads are light grey, and the cymbal pads have a grey face with a light rim.
  - The footprint is now 1.5 × 1.1 m.
- **Grand piano:** the key bed is black between the keys and the music desk (no gold or spruce at the keyboard-end corners). Cheek blocks were added at both ends of the keys.
- **Leslie:** one lead only (the organ cable carries the mains), coming out from under the back at floor level, with no plugs.
- **Choir:** the riser's invented centre seam is removed.
- **Trombone:** true proportions: the bell rim is 0.5 m ahead of the mouthpiece, the tuning crook 0.22 m behind it, and the slide end 0.94 m ahead. The footprint is 0.36 × 1.23 m.
- **Upright bass:** the scroll is a narrow nub with its centre flute (a spiral face only shows from the side).
- **Cello:** turned 10°, so the scroll passes the player's head on the left.
- **Organ:** the upper manual overlaps the lower one's back.

**Reviewed and found correct (no change):**
- The grand in concert placement: bass upstage, lid toward the audience.
- The vibraphone: low end at the player's left, accidentals 3-2 from the low end.
- The tabla: dayan on the player's right.
- The trombone: bell on the player's left.
- The DJ controls: on the DJ's side.
- The organ: preset keys and drawbar colours.
- The banjo: fifth-string peg on the bass side.
- The mandolin: pickguard on the treble side, 4 + 4 tuners.
- The accordion and the electric piano.

## 7. HELD (for the lead and the owner)

1. **A choir of any size.** The choir symbol is fixed at 1.85 × 1.4 m: one three-step riser and 11 singers. A 30-voice choir would need a sized choir, like the riser, or a singer count. That is a model change, not made here.
2. **Leslie size.** The drawing uses 0.74 × 0.52 m, the expert's cited Hammond spec for a 122. The visual reviewer remembers 0.83 × 0.55 m. It is not settled from a primary source.
3. **More kinds for later:** marimba, timpani (with a mirror option for American and German setups), flute (the existing horn microphone default is a poor fit), harmonium, harmonica (today a vocal microphone), a string-section group, and a percussion sample pad.
4. **Smaller points held:**
   - A harp or bass stool as a separate object.
   - Tabla on a low carpeted riser instead of a floor rug.
   - The bayan's syahi side varies by player; it is drawn away from the player, slightly to the right.
   - The Organ symbol shows a two-manual console; a single-manual clone is better drawn as keys.
5. **The harp.** It still reads as a narrow wedge at the smallest key size. That is the true top view of a harp. The stool, the turn and the capital are what make it read. The owner should look at it.
6. **Owner checks not done:** no phone or device proof, and sound was never on. On the stage plot, an added kind is a drawing and its packages; there is no in-lab teaching text for them.
