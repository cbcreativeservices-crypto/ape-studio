# Cymatics Phase 4 — Pattern Gallery & Art Studio · BUILD HANDOFF

**To:** the Fable session that built Cymatics Phases 1–3
**From:** ccode (Opus session, 2026-09-17)
**Repo:** `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, clean and pushed at `c249d441`+
**Status of the ask:** the owner has assigned Phase 4 to you. Spec of record is
`docs/APE_CYMATICS_LAB_SPEC_2026_09_16.md` §4; everything else in that spec is built.

> You built Phases 1–3, so this document does not re-explain the lab. It gives you the
> Phase 4 scope verbatim, the exact reuse map with line numbers, the three build risks
> that will bite, and the acceptance bar.

---

## 0. READ FIRST — the one thing that shapes this whole phase

**Phase 4 is an export feature, and the export natives do not exist in the current dev client.**

`react-native-view-shot`, `expo-sharing`, `expo-media-library` and `expo-print` are in
`package.json` but their native halves ride the NEXT EAS build. Everything resolves through
`optionalModule()` at runtime and returns an honest failure.

This is not a blocker — it is the design. The Harmonograph already solved it and you copy that
solution exactly:

- `src/screens/lab/harmoExport.ts` — `isShareAvailable()` / `isSaveAvailable()` / `isPrintAvailable()`
  probe the modules; `saveToPhotos(ref)` returns `'saved' | 'denied' | 'unavailable' | 'failed'`;
  `printCard(ref)` returns a boolean. **Neither ever throws.**
- `src/screens/lab/HarmonographViewer.tsx:90` computes availability once into `avail`,
  `:224` marks the capture target `<View ref={cardRef} collapsable={false}>` (the
  `collapsable={false}` is REQUIRED on Android or the ref captures nothing),
  `:266–284` renders each button disabled with an accessibility label that states why,
  `:311` prints the footer line naming what needs the next build.

**The rule, inherited:** a capability without a native half renders **disabled with the
"available after the next app build" note**. Never a dead control, never a lying one, never a
crash. The owner asked for those buttons to be visible specifically so the feature reads as
complete-but-gated.

**So: build the whole of Phase 4 now. It is fully testable on-device except for the final
hand-off to Photos / the print sheet, which you verify renders as a disabled control with the
honest note.** Do not wait for a build, and NEVER start one (`eas build` is owner-cue-only,
`AGENTS.md`).

---

## 1. Scope, verbatim from spec §4

- Save pattern + full experiment state (JSON, AsyncStorage `ape:cymatics:patterns:v1`);
  duplicate/modify; favourites; compare 2/4; notes; reopen exact configuration.
  **Numeric state is stored separately from artwork.**
- Colouring mode = the Harmonograph art-board grammar: node-line outline extraction
  (marching squares on the node-only field) → tap-to-fill enclosed regions, solid/gradient,
  Academy palette + custom, undo/redo, hide/show nodal lines, line weight, background,
  rotational-symmetry fill.
- Export via `harmoExport` / `shareImage` (view-shot → share / save-to-Photos / print).
  PNG + transparent PNG + printable PDF (Letter / A4 / square) through those gates;
  **SVG export is new** (we already build the outline as paths).
  **Art Print hides data; Lab Print prints the settings block** (title, Hz, note, dimensions,
  material, thickness/depth, liquid, mode, exciter, date, name, notes, "Simulation").
- Honesty rule inherited: capabilities without a native half render disabled with the
  "next app build" note.

---

## 2. Reuse map — what already exists, with line numbers

| You need | It already exists at | Notes |
|---|---|---|
| Save / print / share gates | `src/screens/lab/harmoExport.ts` | Use as-is. Add nothing to it unless SVG/PDF needs a new gate. |
| Disabled-button + honest-note pattern | `src/screens/lab/HarmonographViewer.tsx:90, 224, 266–311` | Copy the shape, including `collapsable={false}`. |
| Share chain underneath | `src/screens/lab/calc/shareImage.ts` | `harmoExport.isShareAvailable()` delegates here. |
| Optional-native loader | `src/features/tools/capture/optionalModule.ts` | The ONLY correct way to touch a native-gated module. |
| Iso-line extraction (marching squares) | `src/screens/lab/cymatics/vizLiquid.tsx:293+` | **Inline in a `useMemo`, not a helper.** See §3.1. |
| Plate field + modes | `src/features/cymatics/plateModes.ts` (`sampleField`, `plateModes`, `readResonance`) | The node-only field is what you contour. |
| Membrane / liquid fields | `src/features/cymatics/membrane.ts`, `faraday.ts` | For gallery entries saved from those studios. |
| Saved-state precedent | AsyncStorage keys `ape:calcwf:projects` / `ape:calcwf:favorites` | Same user-artifact shape; follow the naming. |
| Studio state shapes to persist | `src/features/cymatics/presets.ts` — `StudioPreset`, `LiquidPreset`, `MembranePreset` | Reopening a pattern = rebuilding one of these + the view mode. |
| Studio → preset routing | `experimentRoute()` in `presets.ts` | Added 2026-09-17; reuse it for "reopen this pattern". |
| Rack layout law | `src/screens/lab/cymatics/modules/rackLayout.tsx`, `src/screens/lab/rack/*` | See §4. |
| Colour standard | `src/features/tools/levelColor.ts` | See §4. |

### Route + wiring checklist (match the Phase 3 pattern exactly)

1. `src/navigation/types.ts` — add the route(s) next to `CymaticsMembraneStudio:` (line ~263).
2. `src/navigation/RootNavigator.tsx` — `Gated.X = withAmplitudeOrientation(Screen)` (line ~188),
   then `<Stack.Screen …>` (line ~412). The lab home itself is `withMembershipPreview`.
3. `src/navigation/linking.ts:84–87` — add `labs/cymatics/gallery` (and the art board if it is
   its own route). **Linking is read once at container mount: a new deep link only works after a
   cold start.**
4. `src/screens/lab/cymatics/modules/registry.ts` — **remove** the
   `Pattern Gallery & Art Studio` row from `PLANNED_AREAS` (it is the last one left) and add the
   real entry point on `CymaticsHomeScreen` as a fourth button beside the three studios.
5. Guided-lesson keys for any new control, in `src/features/lab/guidedLessons/content.ts`
   under the `cymatics` lesson.

---

## 3. The three things that will bite

### 3.1 The contour code is not a helper yet

`vizLiquid.tsx:293+` builds iso-lines, but it is inline, Skia-path-typed, and carries a
**dish-specific radial envelope normalisation** (added in the 09-17 debug pass because Bessel
modes decay outward and outer rings never reached a fixed level).

For Phase 4 you need outlines from the **plate node field**, as geometry you can (a) stroke,
(b) hit-test for tap-to-fill, and (c) serialise to SVG. Recommendation:

- Extract a generic `src/features/cymatics/contours.ts` returning **plain polylines**
  (`{x,y}[][]`), not Skia paths, so the same output feeds Skia, hit-testing and SVG.
- Leave the radial normalisation **out** of the generic version; it is a liquid-view concern.
  Pass a pre-normalised field in.
- Keep `vizLiquid` working. Either have it call the new helper and apply its normalisation
  first, or leave it alone. Do not regress the contours view — it was debugged once already.

### 3.2 Tap-to-fill needs enclosed regions, not lines

Marching squares gives you segments. Filling needs closed loops with an inside test. Two routes:

- **Geometric:** stitch segments into closed rings, then even-odd point-in-polygon for the tap.
  Exact, exports to SVG trivially, and survives rotation/symmetry fill. More work.
- **Raster flood fill** on the sampled grid, then trace the filled region's boundary.
  Easier to get right, but the SVG export then needs the traced boundary anyway.

The spec wants SVG out of this ("we already build the outline as paths"), so the geometric
route is the one that pays for itself. Your call.

### 3.3 Never resize a live Skia canvas

Rack law, and it has bitten this codebase before. The art board's canvas is sized by its
container once; opening a tray/panel must not re-measure it mid-interaction.

---

## 4. Standing rules that apply to every line you write

These are owner hard rules, several earned the hard way. Non-negotiable.

- **Amplitude colour standard** — every amplitude drawing uses the house ramp via
  `src/features/tools/levelColor.ts`: `levelColor` for meters, `heatColor` for fields (black
  floor), `heatRgbW` for worklets (pinned by a test), `MIDLINE_BLUE` for zero lines,
  `WAVE_LEVEL_STOPS` for ± waveforms. **Categorical tints for states/stages, never the ramp.**
  The Academy palette offered to the user for *colouring artwork* is a different thing and is
  fine — that is art, not data.
- **Honesty badges** — every drawn pattern carries its Simulation / Calculated / Approximated /
  Illustrative label. A saved gallery entry must carry the badge it had when saved, and the
  Lab Print includes "Simulation".
- **No promise words** — never "coming soon", "in development", "soon", "later". Planned things
  are shown as dimmed placeholders with `DEV_NOTE`. "Available after the next app build" is the
  approved phrasing for native gates.
- **MIN_FONT 12** anywhere in the lab. The tools' 9.5px is legacy, not precedent.
- **Visual standards** — illustrated real objects, never boxes/circles/lines as stand-ins
  (`docs/APE_VISUAL_STANDARDS_2026_07_29.md`).
- **Low-Light Production Mode** — nothing may auto-appear or flash; new auto-overlays gate on
  `useOverlaysSuppressed`. A gallery that animates thumbnails on entry needs that gate.
- **AccuracyNote** — `<AccuracyNote/>` belongs in every lab/tool header.
- **Never touch image assets** without the owner naming the folder and giving a go, each time.
- **Never run `eas build`** on your own reading of anything.
- **Push only when the owner says "push".** Commit when they say commit.

---

## 5. Known gotchas from Phases 1–3 (do not rediscover these)

1. `plateModes.modeResponseSigned` used to return the real part, which is exactly 0 **at**
   resonance, so a drive landed exactly on a mode dropped that mode from the field. It is the
   signed magnitude now. Pinned by `test/cymaticsMembrane.test.ts`.
2. A Skia `Vertices` mesh **bleeds a transparent vertex colour to black** across shared edges.
   Mask by dropping quads, never by colouring corners transparent.
3. A discrete 5-point Laplacian scales as 1/n², so any curvature term tuned at one grid size
   must be rescaled ∝ n² when N changes.
4. Off-resonance displays must SCALE with response, or the lab teaches "a pattern at every
   frequency" — the exact misconception the lab exists to kill.
5. Metal-plate Q is in the hundreds: a plain log sweep never reads AT. Use the dwell sweep.
6. `react-navigation` linking is read once at container mount — new deep links need a cold start.
7. Files ccode has never touched can differ in whitespace from what `cat` shows; prefer
   sentence-level anchors in patch scripts.
8. Node's test runner, not jest: `npm test` (`node --test`). Jest in this repo will report 193
   bogus failures because it picks up worktree ESM files.

---

## 6. Acceptance bar

- `npx tsc --noEmit -p .` clean.
- `npm test` green (1212 tests at handoff time; add tests for the contour helper and for
  save/load round-tripping a pattern).
- Device-verified on the Pixel: save a pattern from each of the three studios, reopen each and
  confirm the studio comes back to the **exact** configuration; colour a plate figure; verify
  undo/redo; confirm the export buttons render **disabled with the honest note** rather than
  failing.
- Zero device errors (the lab's standing bar; the Phase 3 and rack passes both landed at 0).
- Spec §4 and §6 updated with "as built"; `docs/CROSS_SESSION_HANDOFF.md` entry filled
  (the post-commit hook stamps a stub — fill `affects other side:` / `needs:`).

**Device test path (members-only lab on the guest dev client):**
Home → long-press the WORDMARK (DEV: anonymous→free→academy, dismiss each alert) →
`adb shell am start -a android.intent.action.VIEW -d proaudio://labs/cymatics`.
Screenshots: `adb shell screencap -p /sdcard/s.png` then `adb pull` — PowerShell `exec-out`
corrupts PNGs, and on Git Bash prefix adb with `MSYS_NO_PATHCONV=1` or the `/sdcard` path is
mangled into a Windows path. The owner often holds the phone at the same time; adb taps and
theirs collide.

---

## 7. Open questions for the owner (ask before building past them)

1. **Where does the Gallery live** — a fourth button on the Cymatics home beside the three
   studios, or a tab inside each studio? Spec implies its own screen; the home button is the
   safer read.
2. **Is the Art Studio a separate route from the Gallery**, or a mode inside it? The spec names
   them as one area ("Pattern Gallery & Art Studio").
3. **Compare 2/4** — side-by-side on one canvas, or a pager? Phase 3's Change One Thing already
   draws two plates on one glass and is the obvious precedent.
4. **PDF page sizes** (Letter / A4 / square) need `expo-print`, which is native-gated. Build the
   size picker now and gate the action, or defer the picker until the build?

---

## 8. Everything else on the lab's open list (context, not your job)

- 8 certificates still need art created (Computer B has the other 54 to upload).
- Rack judge leftovers the owner has not ruled on: lab home as a rack of three units; a
  conditional DRUM/CONE dock + TENSION fader on the Membrane studio; illustration passes for
  the drum shell, lamp and speaker cutaway; Low-Light auto-motion gating; the last sub-12px
  labels.
- Beats / detuned pairs stay **visual-only** until engine 8 lands with the next build.

Good hunting. The lab is in good shape — Phase 4 is the last piece of the spec.
