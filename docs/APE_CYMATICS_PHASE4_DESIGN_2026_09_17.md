# Cymatics Phase 4 — Pattern Gallery & Art Studio · DESIGN OF RECORD

**From:** the Fable session (2026-09-17) · **To:** the Claude Code session that builds it
**Repo:** `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, HEAD `ebeeaf96` at design time
**Input:** `C:\Users\profe\Downloads\2026-09-17_CYMATICS_PHASE4_HANDOFF\CYMATICS_PHASE4_BUILD_HANDOFF.md` (the build handoff; its §7 owner decisions are locked and repeated in §1 here)
**Scope of this document:** the design of record — AND, after the owner's "design and build is ok, but stop so I can change off Fable for testing", the record of the build. **Phase 4 is BUILT in the working tree (uncommitted), tsc clean, 1222/1222 tests.** The owner stopped the Fable session before the device pass on purpose. The next session's job is §10 (device verification), fixes, then commit on "commit".

---

## 0. What exists in the tree (UNCOMMITTED — built 2026-09-17)

The design pass wrote the algorithmic core as real, tested code; the build pass then wrote every screen, hook and wiring item in §8. `npx tsc --noEmit -p tsconfig.json` is clean and `npm test` passes **1222/1222** (1212 + the 10 new). Nothing is committed yet; nothing has run on a device yet.

**Built (new files):** `src/screens/lab/cymatics/PatternFigure.tsx` (RN-SVG figure renderer, `PAPERS`), `galleryExport.ts` (PRINT / PDF / SVG gates + actions), `ExportPanel.tsx` (the capture card + chips + gated buttons + page picker), `GalleryCompare.tsx` (`CompareCanvas`, `CompareTable`), `GalleryArt.tsx` (the art board on `RackUnit`), `GalleryScreen.tsx` (the route: browse / open / art / compare). **Modified:** the three studios (SAVE header key, `{ saved }` reopen, "Saved to the Gallery ✓ · Open the gallery ›"), `LabShell.tsx` (`HeaderTextButton`), `navigation/{types,RootNavigator,linking}.ts`, `modules/registry.ts` (`PLANNED_AREAS` = []), `CymaticsHomeScreen.tsx` (fourth button; PLANNED AREAS hidden when empty), `guidedLessons/content.ts` (10 keys), `labCatalog.ts` blurb, `docs/APE_NEXT_BUILD_CHECKLIST.md` row, spec §4 / §6 "as built".

The table below lists the design-pass core (still accurate).

| File | What it is | Status |
|---|---|---|
| `src/features/cymatics/contours.ts` | marching squares → stitched polylines; sign-component region labelling; region boundary as closed loops; rotation helper; SVG path builder | written, tested |
| `src/features/cymatics/patternStore.ts` | `SavedPattern` / `Artwork` types, validation + normalisation, injectable KV store, CRUD, `usePatterns()` hook, `TONE_RATIOS` | written, tested |
| `src/features/cymatics/patternField.ts` | `patternGeometry(state, N)` (field + outline + colours for plate / drum / dish), `patternReadout(state)` (Lab Print rows), `defaultPatternName` | written, tested |
| `src/features/cymatics/figure.ts` | pixel-space layers (outline path, node-line path, fill paths), `regionAtPx` hit-test, `applyFill` with symmetry, analysis cache | written, tested |
| `src/features/cymatics/svgExport.ts` | `figureSvg()` document, `sheetHtml('art'\|'lab', page, …)`, `compareHtml()`, `PAGES` (Letter / A4 / Square) | written, tested |
| `test/cymaticsGallery.test.ts` | 10 tests pinning the above (zero lines, quadrant regions, closed boundaries with area ¼, disc mask, symmetry fills, px hit-test, SVG/sheets, all three studios, store round-trip + quarantine, normalisation defaults) | green |

Nothing else was touched. No screen, no navigation, no studio, no lesson, no doc. Those are the build (§8).

---

## 1. Decisions — do not re-litigate

Owner-locked (handoff §7):
1. **The Gallery is a FOURTH BUTTON on the Cymatics lab home**, one gallery for all three studios. Remove the last `PLANNED_AREAS` row.
2. **The Art Studio is a MODE inside the Gallery**, not a route. Deep link `labs/cymatics/gallery` only.
3. **Compare draws side by side on ONE canvas** (Change One Thing's idiom); Compare 4 = 2×2. No pager.
4. **Build the PDF page-size picker NOW**, disabled with the honest "available after the next app build" note.

Made in the design pass (with the reasons — the build session inherits them):

5. **The figure renderer is `react-native-svg`, not Skia.** Three reasons. (a) `react-native-view-shot` captures RN-SVG reliably on Android (the Harmonograph card is the device-proven precedent); a Skia `Canvas` is a native surface and capture is not guaranteed. (b) ONE renderer draws the on-screen figure, the art board, the compare canvas and the export card from the SAME path data that `svgExport.ts` writes — what you see is what ships. (c) No Skia gate, no worklets: the art board is static between taps. The gallery's visual language is the Chladni figure as line art on the illustrated object face (material / head / liquid tint from `patternGeometry`), which satisfies the visual standard. The saved pattern's live views (sand, heat, 3D…) remain one tap away: OPEN IN STUDIO.
6. **Regions = 4-connected components of sign(field).** The "enclosed regions between nodal lines" are exactly the sign components, for every shape including the library polygons with holes. No planar-face arithmetic. (`labelRegions`)
7. **Region boundary = marching squares on a signed-magnitude field, padded.** +|f| inside the region, −|f| outside, −ε beyond the domain, one padding ring so every loop closes. Where two regions meet the crossing interpolates to the TRUE nodal line; along the plate edge the loop hugs the outline half a sample past the last inside cell (the drawn edge covers it). Fill with the even-odd rule. (`regionBoundary`)
8. **Symmetry fill = rotated-tap lookup.** Filling region R from tap point p also fills the regions under p rotated by 2πi/k about the domain centre, k ∈ {1,2,3,4,6,8}. Exact for symmetric patterns, harmless otherwise. (`applyFill`)
9. **Grid size for the art board: `ART_N = 96`.** Region ids depend on N, so `Artwork.N` is stored and a mismatch drops fills instead of misplacing them (pinned by a test). Thumbnails use N = 40; the open view N = 64.
10. **SVG export works TODAY** (string generation): shared as TEXT through RN's core `Share.share` on the current client; as a real `.svg` FILE through `expo-file-system/legacy` (already bundled and native in every build — `src/features/ear/earPlayer.ts` imports it) + `expo-sharing` once the build carries sharing. No new package.
11. **PDF and PRINT go through `expo-print`'s HTML path** (`printToFileAsync({html,width,height})` → share the PDF; `printAsync({html,width,height})` → the print dialog). No view-shot in that chain, so PRINT and PDF gate on `expo-print` (+ `expo-sharing` for the PDF share) only. PNG SHARE / SAVE-TO-PHOTOS keep the Harmonograph's view-shot gates.
12. **Two collections, two keys** (`ape:cymatics:patterns:v1`, `ape:cymatics:artwork:v1`) — numeric state separate from artwork, per spec. Damaged rows quarantine under `:damaged` (calc-workflow idiom).

---

## 2. Data model (as written in `patternStore.ts`)

```ts
type PatternState =
  | { studio:'plate';    spec: PlateSpec;    hz; amplitude; view; multi; sandCount; sandSize; friction }
  | { studio:'liquid';   spec: LiquidSpec;   hz; accelG; view; dualId }      // spec.dualRatio carries the ratio
  | { studio:'membrane'; spec: MembraneSpec; hz; amplitude; view; driverId };
type SavedPattern = { id; v:1; name; notes; favourite; createdAt; updatedAt; badge; state };
type Artwork = { patternId; v:1; updatedAt; N; fills: {region; color; style:'solid'|'gradient'}[]; lineWeight; lineColor; background; symmetry };
TONE_RATIOS = { off:null, oct:2, fifth:1.5, fourth:4/3 }   // shared by plate MULTI and liquid DUAL ids
```
`normalisePattern()` merges each spec over its `DEFAULT_*` so a row saved before a new spec field still loads. `patternStore()` is the AsyncStorage singleton; `createPatternStore(memoryStore())` is what tests use. `usePatterns()` → `{ patterns | null, reload, upsert, remove, duplicate }`.

`Artwork.background`: `'plate'` (the object's face colour), any hex, or `'transparent'`. `lineWeight` 0 = nodal lines hidden.

---

## 3. Geometry & export API (as written)

- `patternGeometry(state, N)` → `{ field, N, aspect, outline, face, edge, texture, strength }`. Outline kinds: `circle`, `rect{rx}`, `ring{inner}`, `poly{outline,holes}` (library shapes). Plate multi-tone superposes exactly as the studio does.
- `patternReadout(state)` → `{ title, hz, note, rows[{k,v}], studioLabel }` — every Lab Print row is the real state (Plate / Thickness / Edges / Driver / Support / Damping / Drive / Resonance / Level … Liquid / Dish / Drive / Shake / Response / Stage … Head / Tension / Fundamental / Strike / …).
- `fitFrame(aspect, w, h, pad)` → the figure box; `figureLayers(geometry, frame, artwork|null)` → `{ outlineD, linesD, fills[{region,d,color,style,cx,cy,r}], frame }`; `regionAtPx(geometry, frame, x, y)`; `domainPoint(frame, x, y)`; `applyFill(geometry, artwork, region, tapDomainPt, fill|null)` → new fills; `shade(hex, amount)` for gradient outer stops.
- `figureSvg(geometry, artwork, { size, background, face })` → SVG string; `sheetHtml('art'|'lab', page, svg, meta)`; `compareHtml(page, items, meta)`; `PAGES`.

---

## 4. Screen design — `GalleryScreen.tsx` (one route, four modes)

Route `CymaticsGallery: { id?: string } | undefined` (a saved-pattern id opens straight into OPEN mode). Gated like the studios: `withAmplitudeOrientation`. Header = back ‹ (in a sub-mode goes back to BROWSE, in BROWSE pops), title, `<AccuracyNote compact/>`. Internal `mode: 'browse' | 'open' | 'art' | 'compare'`, `currentId`, `compareIds: string[]`.

### 4.1 BROWSE
- Title `PATTERN GALLERY & ART STUDIO` · subtitle "Saved patterns from the three studios — reopen, colour, compare, print."
- Filter chips (LabChip): `ALL · PLATE · DISH · DRUM · ★ FAVOURITES`.
- A `COMPARE` toggle chip: on → cards become selectable (2 or 4); a pinned bar at the bottom reads "2 selected · COMPARE ›" (disabled until 2; at 3 says "pick one more or compare 2"; caps at 4).
- 2-column grid of cards: thumbnail (`PatternFigure` at N = 40, lines on the face, no fills unless artwork exists → then the artwork), name (Oswald 13), studio tag + Hz (mono 12), ★ toggle at the corner. Tap → OPEN.
- Empty state (no patterns): the sentence "Nothing saved yet. Every studio has a SAVE key in its header — press it while a figure is on the plate, in the dish or on the drumhead." + three chips OPEN THE PLATE STUDIO › / DISH › / DRUM ›.
- Low-Light rule: no entry animation on thumbnails (static render; nothing gated needed if nothing moves — keep it static).

### 4.2 OPEN (one pattern)
- Large `PatternFigure` (N = 64; artwork applied if any) on the object face, badge line under it (the pattern's saved `badge` verbatim, prefixed `SIMULATION ·` if it isn't already).
- Name: a `TextInput` (Oswald 15) editing `name` — commits on blur through `upsert`. Notes: multiline `TextInput` (Barlow 14, min 44 dp), commits on blur. Both MIN_FONT ≥ 12.
- Readout block: `patternReadout(state).rows` as a 2-column table (mono 12 keys, Barlow 13 values) + the note (`A4 +12¢`).
- Actions (LabChip row): `OPEN IN STUDIO ›` (navigate to the studio route with `{ saved: id }`, §6) · `COLOUR ›` (→ ART mode) · `DUPLICATE` · `★ FAVOURITE` / `★ FAVOURITED` · `DELETE` (RN `Alert.alert` confirm; also deletes artwork).
- EXPORT panel (§5) with kind chips `ART PRINT · LAB PRINT`.
- The studio view mode saved with the pattern is restored by OPEN IN STUDIO; the gallery itself always draws line art (decision 5).

### 4.3 ART (the art board — a Rack Unit)
Render `RackUnit` directly (not `LabShell`): STAGE pinned, DOCK at the bottom, the well between. Stage size `'L'`. **Never resize the canvas after mount** — `fitFrame` is computed from the glass's (w,h) once per layout; the PatternFigure's `Svg` is sized by that frame.

- **Stage:** `PatternFigure` with `interactive` — a `Pressable` wrapping the `Svg`; `onPress` → `e.nativeEvent.locationX/Y` → `regionAtPx` → `applyFill(geometry, artwork, region, domainPoint(...), currentFill or null when the ERASE chip is on)` → push to history → re-render. Badge (under the glass): `ART BOARD · <saved badge>`.
- **Bezel** (4 cells): `REGIONS n` · `FILLED m` · `‹ UNDO` (onPress, tint amber when available, textSub when not) · `REDO ›`.
- **Dock keys** (5 — the rack's comfort limit): 
  - `FILL` — `group`, sticky; tray content: the palette (a 12-swatch row: `WAVE_COLOR_SWATCHES` + black + white as 44 dp round swatches with the selected one ringed), a `CUSTOM ›` chip opening the in-tree `SpectrumColorPicker` (never a nested Modal), and an `ERASE` chip (tap a region to clear it). `valueLabel` = the swatch hex without `#` (mono). helpKey `art_fill`.
  - `STYLE` — `options`, sticky: `Solid` / `Gradient` (blurb: "Gradient shades each region from its centre outward — the colour at the middle, 45 % darker at the edge.") ; helpKey `art_style`.
  - `WEIGHT` — `fader` (bound on mount, `initialParam: 'weight'`): lane 0..1 → line weight 0–4 px (`format` "1.5 px" / "hidden" at 0); `home` 0.375 (= 1.5 px); helpKey `art_weight`. Line COLOUR chips live inside the STYLE tray under a `NODAL LINES` heading (white / black / amber / the current fill colour).
  - `PAPER` — `options`, sticky: `Plate (material)` / `Black` / `White` / `Warm paper #f4ecd8` / `Navy #0b1020` / `Transparent` (blurb on Transparent: "For the transparent PNG — the object face is not drawn."). helpKey `art_paper`.
  - `SYM` — `options`, sticky: `Off` / `2` / `3` / `4` / `6` / `8` (blurb: "Fill one region and its rotated partners fill with it — the pattern's own symmetry does the work."). helpKey `art_symmetry`.
- **Well:** caption (outside any disclosure): "Tap a region to fill it. Nodal lines are the still lines of the figure — the fill never crosses one." Then `CLEAR ALL` chip (confirm-free; undoable), the EXPORT panel (§5, kind fixed to ART with the LAB toggle available), a `SAVE ARTWORK` state line ("Saved ✓" / "Saving…" — artwork autosaves 500 ms after every change and on leaving ART mode), and the guided-lesson row.
- **History:** `history: Artwork[]`, `index`; every change pushes a new immutable artwork (cap 60). UNDO/REDO move the index; autosave writes `history[index]`.
- Leaving ART (back ‹) returns to OPEN with the artwork applied to the preview.

### 4.4 COMPARE
- One `Svg` canvas: 2 figures side by side (each ≤ 46 % of width) or 4 in a 2×2 grid, each on its own object face with a caption under it (name · studio · Hz, Oswald 12), the whole thing inside the capture card (§5) so it exports. Below: the four readouts' Drive / Resonance rows in a compact table so the comparison is readable as data too, and the sentence "Same frequency, different object — or the same object, different frequency: read which one changed." Chips: `EDIT SELECTION` (back to BROWSE with compare on) and the EXPORT panel (kind: compare → `compareHtml`).

---

## 5. Export surface — `src/screens/lab/cymatics/galleryExport.ts` + `ExportPanel.tsx`

**Gates (`galleryExport.ts`, next to `harmoExport.ts`, same `optionalModule` idiom; never throws):**

| Control | Needs | Gate function | Enabled path |
|---|---|---|---|
| SHARE PNG | view-shot + expo-sharing | `harmoExport.isShareAvailable()` | `shareImage.captureAndShare(cardRef, title)` |
| SAVE TO PHOTOS | view-shot + expo-media-library | `harmoExport.isSaveAvailable()` | `harmoExport.saveToPhotos(cardRef)` (add-only permission, unchanged) |
| PRINT | expo-print | new `isPrintHtmlAvailable()` | `printLib.printAsync({ html, width, height })` |
| PDF (Letter / A4 / Square) | expo-print + expo-sharing | new `isPdfAvailable()` | `printLib.printToFileAsync({ html, width, height })` → `sharing.shareAsync(uri, { mimeType:'application/pdf', UTI:'com.adobe.pdf' })` |
| SVG | nothing (text) / expo-sharing (file) | always enabled | if sharing: write `${FileSystem.cacheDirectory}<name>.svg` with `expo-file-system/legacy` `writeAsStringAsync`, `shareAsync(uri, { mimeType:'image/svg+xml', UTI:'public.svg-image' })`; else RN `Share.share({ message: svg, title })`. Result `'file' | 'text' | 'failed'`; the panel says which happened. |

Disabled controls render exactly as `HarmonographViewer.tsx:266–311`: `disabled`, `btnDisabled` style, an `accessibilityLabel` that states why, and ONE footer line "SHARE · SAVE · PRINT · PDF need the next app build." listing only what is missing. **The page-size picker (Letter / A4 / Square chips) is always rendered** and drives both PRINT and PDF; it is disabled with the same note when neither is available (decision 4).

**The capture card (`ExportCard`):** `<View ref={cardRef} collapsable={false}>` (REQUIRED on Android). Contents by format:
- PNG: brand header (`shareHeaderLines('Cymatics Lab')`), the `PatternFigure` at card width, then for LAB PRINT the readout rows + name + notes + `SIMULATION · <badge>` line, then the ONE shared footer (`shareFooterLines()`); ART PRINT = header + figure + footer only.
- TRANSPARENT PNG: the figure alone on a transparent card background (`backgroundColor: 'transparent'`, `PAPER` forced to Transparent for the capture) — no chrome, since it exists to be composited.
- PRINT / PDF use `sheetHtml(kind, page, figureSvg(geometry, artwork, { size: 1000, background, face: paper==='plate' }), meta)` — the SAME `figureSvg` string the SVG export writes, so the four outputs never disagree. `meta.date` = ISO date; `meta.brand` = `shareFooterLines()`; `meta.title` = "Cymatics Lab: Sound Made Visible".
- COMPARE card: the compare canvas + captions + footer; PDF via `compareHtml`.

Format chips on the panel: `PNG · TRANSPARENT PNG · PDF · SVG` (PDF reveals the page-size chips). Kind chips: `ART PRINT · LAB PRINT` (OPEN and ART modes; COMPARE has its own). Messages: "Saved to Photos ✓", "Photos permission denied — allow access in Settings to save.", "Shared as an SVG file ✓" / "Shared the SVG source as text — open it in a vector editor and save it as .svg.", "Sent to the printer." / "Printing didn't complete.", "PDF ready — pick where to send it.".

---

## 6. Studio hooks (three studios, identical shape)

1. **SAVE key in the header.** Add `HeaderTextButton({ label, onPress, disabled? })` to `LabShell.tsx` beside `HeaderPlayButton` (same 34-dp pill, Oswald 12, amber border), and pass `headerAction={<View style={{flexDirection:'row',alignItems:'center',gap:8}}><HeaderTextButton label="SAVE" onPress={savePattern}/><HeaderPlayButton …/></View>}` in `PlateStudioScreen`, `LiquidStudioScreen`, `MembraneStudioScreen`.
2. **What each studio saves** (`newPattern(state, badge, defaultPatternName(state))` → `patternStore().upsertPattern`):
   - plate: `{ studio:'plate', spec, hz: freq, amplitude, view, multi, sandCount, sandSize, friction }`, badge = the stage badge string already computed for the rack (`lib ? … : spec.shape === 'circle' ? … : …`).
   - liquid: `{ studio:'liquid', spec: specLive (carries dualRatio), hz: freq, accelG: accel, view, dualId }`, badge = the stage badge.
   - membrane: `{ studio:'membrane', spec, hz: freq, amplitude, view, driverId }`, badge = the stage badge.
   After saving: an in-well line "Saved to the Gallery ✓" with a chip `OPEN THE GALLERY ›` → `navigation.navigate('CymaticsGallery', { id })`. Saving never leaves the studio.
3. **Reopen exact configuration.** Route params become `{ preset?: string; saved?: string } | undefined`. On mount, if `saved`: `patternStore().getPattern(saved)` → apply EVERY field in one batch (`setSpec`, `setFreq`, `setAmplitude`/`setAccel`, `setView`, `setMulti`/`setDualId`/`setDriverId`, `setSandCount`, `setSandSize`, `setFriction`) and set the preset-landing refs (`landed`, `landedF`) to true so no preset logic runs; `experiment` is undefined for a saved pattern. Add a well line "Reopened from the Gallery: <name>". The one-frame default render before the async load is acceptable; do not block the screen.

---

## 7. Wiring

- `src/navigation/types.ts` (~line 263): `CymaticsGallery: { id?: string } | undefined;` and widen the three studio params to `{ preset?: string; saved?: string } | undefined`.
- `src/navigation/RootNavigator.tsx`: import `GalleryScreen`; `CymaticsGallery: withAmplitudeOrientation(GalleryScreen)` in `Gated` (~188); `<Stack.Screen name="CymaticsGallery" component={Gated.CymaticsGallery} />` (~412).
- `src/navigation/linking.ts` (~87): `CymaticsGallery: 'labs/cymatics/gallery'` (cold start needed for a new link).
- `src/screens/lab/cymatics/modules/registry.ts`: `PLANNED_AREAS` becomes `[]` with a comment; `CymaticsHomeScreen.tsx`: render the PLANNED AREAS title only when the array is non-empty; add the fourth button after the Membrane one — `OPEN THE PATTERN GALLERY & ART STUDIO ›` / sub "Save a pattern from any studio · colour it · compare 2 or 4 · art print or lab sheet", tint `#c4a2ff` (`colors.programPurple`) border `rgba(196,162,255,.7)` bg `#120f1c`.
- `src/features/lab/guidedLessons/content.ts`, inside the `cymatics` lesson's controls (after `dual_liquid`, line ~1249) — paste these:
  - `gallery` · "Pattern Gallery" · "Every SAVE from a studio lands here with its exact experiment state — the plate or dish or head, the drive, the level, the view — and the honesty badge it carried. Reopen it and the studio comes back to that configuration. The gallery itself draws the figure as line art on the object; the live views live in the studio."
  - `save_pattern` · "Saving a pattern" · "SAVE stores numbers, not a picture: the studio's full state, so the figure is reproducible. Artwork you add later is stored separately and never changes the science underneath."
  - `art_fill` · "Fill" · "Tap a region — one of the areas enclosed by nodal lines — to fill it. Regions are the parts of the plate moving together, in phase; a fill never crosses a still line because the still line is the boundary. ERASE clears a region; UNDO and REDO live on the bezel."
  - `art_style` · "Solid or gradient" · "Solid paints the region flat. Gradient shades it from its centre outward, which reads as height: the antinode in the middle, the still line at the edge. NODAL LINES here sets the line colour."
  - `art_weight` · "Line weight" · "The nodal lines' stroke, 0–4 px. At zero they vanish and only the fills speak — the figure is still there, drawn by the colours' edges."
  - `art_paper` · "Paper" · "What sits under the figure: the object's own face (aluminum, brass, the drumhead, the liquid), a plain colour, or nothing at all for a transparent PNG you can composite elsewhere."
  - `art_symmetry` · "Symmetry fill" · "A Chladni figure has the symmetry of its plate. With SYM on, filling one region also fills its rotated partners — 4 for a square, 6 for a hexagon, 2 for a rectangle — so a full colouring takes a few taps instead of dozens."
  - `art_export` · "Export" · "PNG and transparent PNG share or save the card; SVG writes the figure as editable vector paths; PDF prints it on Letter, A4 or a square page. ART PRINT is the figure alone. LAB PRINT adds the settings block so the sheet is a lab record — it always says Simulation. Controls without a native half are disabled until the next app build."
  - `compare` · "Compare" · "Two or four saved patterns on one canvas, each with its drive. Same frequency and a different figure means the object changed; same object and a different figure means the frequency did. That is the lab's central discovery, made side by side."
  - `lab_print` · "Lab print" · "The settings block prints every value the figure came from — plate, thickness, edges, driver, support, damping, drive, resonance, level (or the dish and liquid, or the head and tension) — plus the date, your name for it, your notes and the Simulation label. A record, not a claim."
- Catalog blurb (`labCatalog.ts` Cymatics row): append "…save, colour, compare and print your patterns."
- `docs/APE_NEXT_BUILD_CHECKLIST.md`: one row "Cymatics Gallery exports — SHARE / SAVE (view-shot + sharing / media-library), PRINT + PDF (expo-print [+ sharing]); SVG text-share works now, SVG file-share with sharing" — all packages already listed, no new plugin.

---

## 8. Build order (files to create / modify)

1. Read + commit the six design artefacts (§0).
2. `src/screens/lab/cymatics/PatternFigure.tsx` — RN-SVG figure: `Defs` (radial gradients per gradient fill, id `g<region>`; `ClipPath` = outline), background rect (unless transparent / plate), face path (when paper = plate: fill `geometry.face`; brushed/polished textures may add a subtle `LinearGradient` highlight — optional), clipped group: fills (even-odd) then node lines (`strokeLinecap="round"`), outline stroke `geometry.edge`. Props: `geometry, artwork|null, width, height, paper, interactive?, onTap?(x,y px)`. Use `figureLayers` from `figure.ts`; memoise on (geometry, frame, artwork).
3. `src/screens/lab/cymatics/galleryExport.ts` (§5 gates + actions) and `ExportPanel.tsx` (card + chips + buttons + note + messages).
4. `src/screens/lab/cymatics/GalleryScreen.tsx` with `GalleryArt.tsx` (the RackUnit art board) and `GalleryCompare.tsx`.
5. `LabShell.tsx` `HeaderTextButton`; the three studios (§6).
6. Navigation, home, registry, linking, lessons, catalog blurb, checklist (§7).
7. Tests (§9), then `npx tsc --noEmit -p tsconfig.json` and `npm test`.
8. Device pass (§10). Spec §4 + §6 "as built"; sync-channel stub filled on commit.

---

## 9. Tests to add (beyond the 10 written)

- `galleryExport`: with all natives absent (`optionalModule` returns null in node) `isPrintHtmlAvailable()` / `isPdfAvailable()` are false and `shareSvg()` resolves `'text'` or `'failed'` without throwing (mock `react-native` `Share` if the module graph needs it — otherwise keep this to the pure helpers).
- Lesson keys: extend `test/helpContent.test.ts`'s pattern if it asserts unique keys — every new key above must be unique inside the `cymatics` lesson.
- `linkPaths.test.ts`: add `labs/cymatics/gallery` if that test enumerates lab paths.

---

## 10. Device verification (Pixel, guest dev client)

Home → long-press the WORDMARK to `academy` → `adb shell am start -a android.intent.action.VIEW -d proaudio://labs/cymatics` (the gallery deep link `labs/cymatics/gallery` needs a cold start after the linking edit).
1. Plate studio → set brass 320 mm disc, sweep to a mode → SAVE → "Saved to the Gallery ✓" → OPEN THE GALLERY › → the card shows the disc figure with the brass face.
2. Dish studio → glycerin, 5 mm, above onset → SAVE. Drum studio → kettle on → SAVE. Gallery BROWSE shows three cards with the right tags; filters work; ★ toggles.
3. OPEN each → OPEN IN STUDIO → confirm the studio comes back to the EXACT state (material/size/thickness/edge/driver/support/damping/Hz/level/view/multi for the plate; liquid/depth/dish/wall/rim/waveform/dual/Hz/g/view for the dish; head/diameter/tension/kettle/strike/Hz/view/driver for the drum).
4. OPEN the plate → COLOUR → tap a region (fills), SYM 4 (four fill), STYLE gradient, WEIGHT 0 (lines vanish) and back, PAPER black / transparent, UNDO ×3, REDO ×3, CLEAR ALL, back ‹ → the OPEN preview shows the artwork; kill the app → reopen → the artwork persisted.
5. EXPORT: SVG → the share sheet opens with the SVG text (paste into a file, open in a vector editor — the acceptance line in spec §6); SHARE / SAVE / PRINT / PDF render DISABLED with the one honest note; the Letter / A4 / Square chips render (disabled).
6. COMPARE 2 and 4 → one canvas, captions right, export panel present.
7. DUPLICATE → "(copy)" card without artwork; DELETE → confirm → gone (and its artwork).
8. Zero JS errors in logcat (`adb logcat -d | grep ReactNativeJS`), zero red boxes.
9. After the owner's next native build: re-verify SHARE PNG, SAVE to Photos (add-only prompt), PRINT dialog, PDF share on each page size, SVG as a file.

---

## 11. Gotchas the build session must not rediscover

- `collapsable={false}` on the capture `View` or Android captures nothing.
- One native `Modal` maximum, never nested — the colour picker is an in-tree overlay (Harmonograph precedent).
- The rack's `initialParam` MUST be a fader id (`'weight'`), or the lane binds to nothing and warns.
- Never re-measure / resize the art board glass during an interaction (rack law); compute `fitFrame` from the stage's (w,h) and keep it.
- `Artwork.N` must equal the geometry's N used to label regions (`ART_N = 96` everywhere the art board or its preview is drawn); the open-view preview must ALSO use N = 96 when artwork exists, or fills drop (by design).
- AsyncStorage is async: apply a reopened state in ONE batch of setters; set `landed` refs first.
- MIN_FONT 12 everywhere in the lab; categorical tints for chips/states; the Academy ramp is never used for art colours (art palette = `WAVE_COLOR_SWATCHES` + black/white + custom — that is art, not data).
- Low-Light Production Mode: nothing auto-appears; the gallery has no auto-motion, keep it so.
- `react-navigation` linking is read once at container mount — cold start after adding the route.
- Never run `eas build`. Ask one line when the work reaches the build step; wait.

---

## 12. Acceptance (from the handoff §6, restated for this design)

- tsc clean; `npm test` green (1222 now + the §9 additions).
- Pixel: save from each studio, reopen each exactly, colour a plate figure with undo/redo, exports render disabled with the honest note, SVG share works, compare 2 and 4 on one canvas, zero device errors.
- Spec §4 and §6 carry "as built"; `docs/CROSS_SESSION_HANDOFF.md` stub filled (client-only, nothing for A).
