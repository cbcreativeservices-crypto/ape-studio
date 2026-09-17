# Cymatics Lab: Sound Made Visible — spec of record (2026-09-16)

**Tagline:** Chladni plates, liquids, membranes, resonance, frequency, and harmonic relationships.
**Placement:** Training (members) › **Sound Visualization** — replaces the existing `status: 'development'` "Cymatics Lab" row in `src/screens/lab/labCatalog.ts`. Standalone lab with its own home (Digital Audio Lab idiom).
**Owner decisions (2026-09-16):** all four phases · name as above · members-only next to the Harmonograph · non-analytic plate shapes = **Computer B** deliverable · sound = **our own native generator only** (`modules/ape-dsp`) with proper visual effects · wood = rotatable grain axis with orthotropic stiffness · art output reuses the **Harmonograph** export chain (no new harmonograph).

Standing rules that bind every screen: `<AccuracyNote/>` in the header ("learn here, measure with a calibrated tool"); amplitude colour = `heatColor` ramp (navy floor → red) from `src/features/tools/levelColor.ts`; illustrated real objects, never boxes (visual standards 2026-07-29); every render carries a **Simulation** / **Calculated** / **Approximated** / **Illustrative** label; no "coming soon" copy — unbuilt phases are dimmed `Planned` rows; Low-Light: nothing auto-appears; meters/animations bypass React state (reanimated SharedValues / worklets).

---

## 0. The one principle the lab is built around

**A visible pattern does not belong to a frequency by itself.** 440 Hz has no universal shape. The pattern is a property of the whole system — geometry, size, thickness or depth, material (E, ρ, ν; viscosity, surface tension), support/boundary, excitation point, drive amplitude, damping. The lab is designed so the learner *discovers* this (Change-One-Thing, Phase 3) rather than reads it.

Scientific-integrity panel ("Evidence vs Myth") ships in Phase 1 and is linked from every studio: Chladni figures are genuine modal patterns · frequency matters but is not the only factor · the same note makes different patterns on different objects · shapes have no established emotional, healing or spiritual meaning · every app pattern is labelled Simulation unless from a measurement.

---

## 1. Physics engine (shared by all phases)

### 1.1 Plate modes (Phase 1)
- **Rectangular / square, free edges** (the classic Chladni condition): Ritz superposition of beam functions — mode (m,n) displacement `W(x,y) ≈ cos(mπx/a)·cos(nπy/b) ± cos(nπx/a)·cos(mπy/b)` (the ± pair is what makes the diagonal Chladni figures on square plates). Labelled **Approximated** (free-edge rectangular plates have no closed form; this is the standard teaching approximation and gives the right nodal topology).
- **Circular, free / clamped / simply-supported edge**: Bessel shapes `W(r,θ) = Jₙ(kr)·cos(nθ)` with the tabulated free-edge eigenvalues λ² (Leissa / NASA SP-160 "Vibration of Plates", ν ≈ 0.33); the true free-edge shape carries a small `Iₙ(kr)` term that is omitted, so nodal-circle radii are within a few %. Labelled **Approximated** (Phase 1 as built — `src/features/cymatics/plateModes.ts`).
- **Frequency law** (exact for geometrically similar plates, same support): `f_mn = λ_mn · (h / L²) · √( E / (12 ρ (1−ν²)) )`, λ from the mode table. Drives every "size ↑ → f ↓ (∝1/L²)", "thickness ↑ → f ↑ (∝h)", "stiffer ↑ / denser ↓" discovery.
- **Materials** (E GPa, ρ kg/m³, ν): aluminum 69/2700/0.33 · steel 200/7850/0.30 · brass 100/8500/0.34 · copper 117/8960/0.34 · acrylic 3.2/1180/0.37 · glass 70/2500/0.22 · plywood ≈ 10/600/0.30 (quasi-isotropic) · **solid wood orthotropic**: E∥ ≈ 12 GPa, E⊥ ≈ 0.9 GPa (spruce-class), ρ 450, grain axis rotatable 0–180°. Orthotropic plates use the rectangular-orthotropic Ritz form (D₁, D₂, D₃ stiffnesses) so rotating the grain visibly re-orders the modes.
- **Damping**: modal Q per material (metal high, acrylic/wood low); resonance response `A(f) = 1/√((1−(f/f_mn)²)² + (f/(Q f_mn))²)`. The **resonance indicator** reads the nearest-mode response: below / approaching / **at** (A > 0.8 of peak) / between.
- **Excitation + support**: the driver adds a weight `|W_mn(x_e,y_e)|` to each mode (a node under the driver cannot be excited — the "move the exciter, suppress a mode" experiment); a support/clamp point forces a node there (modes with an antinode at the clamp are dropped).
- **Multi-frequency**: superposition of the per-frequency modal responses (linear plate).

### 1.2 Particles (Phase 1)
- 3 000–8 000 particles (device-tiered) as a Skia point cloud; positions live in a `SharedValue<Float32Array>` updated in a reanimated worklet each frame — never React state.
- Each particle moves down the gradient of the RMS displacement field `|Σ A_k W_k|²` with per-particle friction + jitter (sand size/amount/friction controls). Patterns therefore **snap in** near a mode and dissolve between modes; they do not morph continuously.
- Slow-motion scales the drive clock, not the migration.

### 1.3 Non-analytic shapes — Computer B deliverable
Triangle, hexagon, ring/annular, bell plate, guitar and violin plates (free edge): offline numerical eigen-solve (finite-difference Kirchhoff plate on a grid, or FEM), delivered as JSON per shape:
```
{ "shape":"hexagon","grid":{"nx":96,"ny":96,"mask":[...]},"modes":[{"id":"h-01","lambda":<dimensionless λ>,"W":[<nx*ny float16/quantised int8>]}, …] }  // ≥ 12 modes per shape, unit-normalised
```
The app scales λ with the same `h/L²·√(E/ρ(1−ν²))` law and evaluates W by lookup. Handoff doc: `docs/COMPB_CYMATICS_MODAL_LIBRARY_2026_09_16.md`.
- **DELIVERED + INGESTED 2026-09-17** — Computer B returned eight variants (triangle, hexagon, ring, ring-clamped-inner, bell, guitar, violin, violin-fholes) as `src/data/cymatics/<shape>.json` (schema `ape_cymatics_modal_library` v1, 96 × 96, 16 elastic modes each, int8 W, mask, outline + holes, per-file `validation`; README alongside). Solver: FEM (Morley Kirchhoff triangle, scikit-fem), free disc reproduced to 0.048 %; annuli and bell agree with the exact characteristic equation to ≤ 0.11 %. `src/features/cymatics/modalLibrary.ts` decodes and caches; `plateModes()` takes a library branch (λ² against L = the shape's unit — side / flat-to-flat / outer Ø / body length — which is what SIZE means for it); the mode shape is a bilinear lookup; the exciter/support snap onto the plate; `sampleField` is NaN off the mask; `vizPlate` clips to the solved outline (even-odd for the ring hole and f-holes), keeps the sand on the plate, drops off-plate 3D quads and draws the bell's centre post. Badge: **CALCULATED · VALIDATED** (ring, ring-clamped-inner, bell) or **CALCULATED** (the rest). Edge condition is fixed by the solution; wood takes the geometric-mean stiffness (no grain re-ordering) and says so. Pinned by `test/cymaticsLibrary.test.ts`.

### 1.4 Liquid — Faraday waves (Phase 2)
- Gravity–capillary dispersion `ω² = (g k + σ k³/ρ)·tanh(k d)`; circular-container modes from Bessel zeros with a pinned or free contact line; drive at f_d → surface responds at **f_d/2** (subharmonic) once vertical acceleration exceeds a viscosity- and depth-dependent threshold `a_c`.
- Behaviour stages 1–10 are driven by `(a/a_c, f)` bands — flat → slosh → ripples → onset → stable pattern → mode transition → mixed → unstable → chaotic → splash/atomisation warning.
- Pattern family (rings, spokes, lobes, stripes, squares, hexagons, stars, quasiperiodic, travelling) from a **curated stable-pattern map** in (depth, viscosity, f, a) space — labelled **Approximated** (physics-constrained, not CFD). The app never promises a pattern outside its region.
- Liquid presets (water, salt water, glycerin mix, silicone oil, light/thick mineral oil, gel, cornstarch non-Newtonian) as (ρ, μ, σ) rows; descriptive ↔ scientific control pairs shown together.
- **Phase 2 as built (2026-09-16)** — `src/features/cymatics/liquids.ts` (8 liquids with ρ/μ/σ, tint + gloss for the renderer, `kinematicViscosity(l, T)` with a −2.5 %/°C thinning law, `CONTROL_PAIRS`) and `src/features/cymatics/faraday.ts`:
  - dispersion solved for k at the response frequency by bisection (**Calculated**); container modes for circle / ring (J_n zeros pinned, J_n′ zeros free), square and rectangle (Fourier) up to 200 Hz (**Calculated**);
  - onset threshold `a_c = 4γω_r / (k·tanh kd)` with γ = bulk `2νk²` + bottom boundary layer `k√(νω/2)/sinh(2kd)` + contact-line `c√(νω)/R` (c = 4 pinned, 1.2 free); cornstarch uses an effective ν that rises with a (shear-thickening) — **Approximated**; gel/thick oil report "no pattern in this rig's range" when a_c > 2.5 g;
  - stage ladder from a/a_c bands (< 0.15 flat · < 0.6 sloshing / ripples · < 1 ripples · < 1.15 onset · < 1.8 stable · < 2.6 transition · < 3.5 mixed · < 5 unstable · else chaotic; splash when the crest reaches 80 % of the wall or a/a_c > 7) — **Illustrative** divisions, stated on screen;
  - pattern family: dish modes when dish/λ < 2.5, else the bulk map (ν ≤ 4 cSt → squares below 90 Hz else stripes; ν ≤ 15 cSt → hexagons below 50 Hz else stripes; thicker → stripes; two-frequency drive → quasiperiodic) — **Approximated**, from Kudrolli & Gollub / Binks & van de Water / Edwards & Fauve;
  - `sampleSurface` returns the standing basis A and its partner B (quadrature or competing family) on a 64×64 grid; `src/screens/lab/cymatics/vizLiquid.tsx` composes h = env·(wA·A + wB·B) per frame in a reanimated worklet (stage-dependent weights: standing / crossfade / travelling / two drifting envelopes), shades a 64×64 RGBA buffer, and draws it as an SkImage with linear sampling — no React state per frame;
  - 8 tests in `test/cymaticsFaraday.test.ts` (dispersion limits, f/2 response, threshold ordering water < glycerin, shallow > deep, pinned > free, Bessel zeros, monotonic stages, family map, damped liquids, surface basis).

### 1.5 Membrane + loudspeaker (Phase 3)
Circular membrane: exact `J_n(k r) cos(nθ)` modes with tension/surface-density scaling. Loudspeaker cone: piston → resonance → cone flexing → radial modes → breakup → surround/dust-cap motion, as an illustrated cutaway driven by the membrane engine with a stiffness profile.
- **Phase 3 as built (2026-09-17)** — `src/features/cymatics/membrane.ts`: clamped-membrane modes from the J_n zero table (`faraday.J_ZEROS`), `f_ns = (j_ns / 2πR)·√(T/σ)` (**Calculated**, exact scaling pinned by test); five heads (σ, Q); strike weighting |W| at the mallet (centre → ring modes only); **kettle** = Rossing's measured timpani ratios on the principal (n,1) series + a plain air-mass factor elsewhere (**Approximated**, stated); `sampleMembrane` (signed ±1, NaN off the head). Loudspeaker: six drivers (f_s, Q_ts, D, breakup); `readCone` stage ladder stiffness → resonance → piston → edge flex → radial → breakup (**Illustrative**) with f_s response, `ka = πfD/c` and the 1/f² piston excursion (**Calculated**); `sampleCone` draws piston / J₀ flex / J_n radial / multi-mode breakup. `vizMembrane.tsx`: illustrated drum (shell, hoop, lugs, translucent lit head shaded per frame via `heatRgbW`), heat / phase / nodes / 3D head / section, and a loudspeaker cutaway (magnet, basket, spider, coil, cone, surround, dust cap) with a front view of the cone field. `MembraneStudioScreen`: FREQ (jump to a mode / a cone stage) · HEAD · STRIKE · CONE · VIEW · LEVEL; tuning card with the mode ratios; cone stage ladder; dwell sweep. Experiments #15–17. Lesson keys `membrane_display, head, tension, strike, kettle, cone, breakup, ratio, beats, lissajous, systems, change_one`. Pinned by `test/cymaticsMembrane.test.ts`.
- **Signed response fix (2026-09-17):** `plateModes.modeResponseSigned` now returns the signed MAGNITUDE; it used to return the real part alone, which is zero exactly at resonance, so a drive landed exactly on a mode's hertz dropped that mode from the drawn field.

---

## 2. Sound (all phases) — native generator, honest rules
- Source: `ApeDsp` generator (`GEN_MODES.sine` for a single drive tone; `additive` for exact integer ratios — 2:1, 3:2, 4:3, 5:4, 6:5 as harmonics of a shared f0, the Harmonograph idiom; `fm` for the bell/gong demos).
- Speaker safety: `speakerGuardDb`, `SPEAKER_HPF_HZ`, `guardAdditiveForEngine`, audio-output gate + `noteAudioActivity`, Low-Light suppression — identical wiring to the Harmonograph/Oscillator labs.
- **Beats / detuned pairs / dual-frequency liquid drive** need two independent sines. The current engine has none (Harmonograph disables audio under detune for the same reason). Phase 3 proposes a small native addition to `ape-dsp` — `GEN_MODES.dual` (two phase-continuous sines, independent f/level) — which lands with the **next build**; until then those controls are visual-only with the reason stated. *(Owner decision required; no build is started by ccode.)*
- Visual coupling: the on-screen driver/shaker/speaker animates from the same frequency + amplitude the generator is playing (cone excursion, platform motion), so what is seen matches what is heard.

---

## 3. Screens & IA

```
CymaticsHome  (lab home, LabShell)
 ├─ 1 What Is Cymatics?           animated intro (pressure → vibration → material moves; node vs antinode; why resonance)
 ├─ 2 Chladni Plate Studio        THE central experience
 ├─ 3 Liquid Cymatics Studio      Phase 2 — BUILT (route CymaticsLiquidStudio; second button on the lab home)
 ├─ 4 Membrane & Loudspeaker      Phase 3 — BUILT 2026-09-17 (route CymaticsMembraneStudio; third button on the lab home)
 ├─ 5 Nodes, Antinodes & Modes    teaching panel (interactive)
 ├─ 6 Harmonics vs Plate Modes    string / air column / membrane / plate comparison
 ├─ 7 Harmony in Motion           Phase 3 — BUILT 2026-09-17 (module `harmony`: locked ratios via additive, beats visual-only until engine 8, wave addition, Lissajous, spectrum, links into both studios' second tone)
 ├─ 8 Other Cymatic Systems       Phase 3 — BUILT 2026-09-17 (module `systems`: live string / pipe / levitation drawings on the amplitude ramp; water, speaker and bells link into the studios)
 ├─ 9 Change One Thing            Phase 3 — BUILT 2026-09-17 (module `change`: two plates, one locked tone, one variable — the §0 discovery tool)
 ├─ 10 Guided Experiments         15 activities (Phase 1 ships #1–7 & 13)
 ├─ 11 Pattern Gallery & Art Studio   Phase 4
 └─ Evidence vs Myth              integrity panel (Phase 1)
```

### Studio layout (plate + liquid share it)
READOUTS (Hz · nearest note · octave · cents · wavelength where relevant · current mode id · resonance strength meter) → DISPLAY (view switcher + overlay toggles) → CONTROLS (ParamLane / DockButton rack idiom: frequency coarse+fine, sweep, amplitude, damping, shape, material, size, thickness, support, excitation, particles, slow-mo, single/multi) → ACTIONS (play tone, sweep, reset particles, save pattern).

### Views (synchronised, same state)
Particle (sand/powder) · Amplitude heat map (`heatColor`) · Particle ⊕ heat overlay · 3D exaggerated plate (Skia, tilted) · Slow-motion ± displacement · Cross-section slice (movable) · Phase view (opposite-sign regions) · Node-only · Resonance-response graph · Spectrum. Liquid adds reflective surface, height-map, contour, refraction. (The greyscale MONOCHROME view was retired 2026-09-17: every amplitude drawing is on the house heat ramp.)

**Liquid Studio as built (Phase 2):** views = THE RIG (side elevation: lamp, dish + liquid layer, coupling platform bobbing at the DRIVE rate while the surface answers at half of it, shaker basket, bench; travel readout) · LIQUID SURFACE (lit Blinn-Phong surface, liquid tint + gloss) · HEIGHT MAP (Academy ramp) · CONTOURS (marching-squares iso-lines, amber crests / blue troughs) · REFRACTION (caustic web from the surface Laplacian) · 3D SURFACE (Vertices mesh, strobed) · CROSS-SECTION (drag on the dish). Bezel: DRIVE · RESP (f/2, or f* before onset) · λ · a/a꜀ tinted by stage. Dock: FREQ (10–200 Hz, chooser "drive at twice a dish mode") · SHAKE (0.02–1.5 g, level ramp, platform-travel readout) · LIQUID (8 presets + temperature + plain-words ↔ property table + ν/σ/ρ line) · DISH (circle/square/rect/ring, 60–300 mm, depth 2–15 mm, wall 10–40 mm, flat/bowl bottom, pinned/free rim) · DRIVE (sine/square/triangle/pulse via the native additive/burst modes; second tone 2:1 / 3:2 / 4:3 via GEN_MODES.dual on engine ≥ 8, shown-only before; slow motion) · VIEW (sticky). Well: stage ladder 1–10 with the physics "why", onset vs current g with ±5 % nudges, damping breakdown (bulk/bottom/rim) + family, sweep 15→150 Hz, silent drive, "what this rig is" (dish/λ, lowest dish modes), RIG SAFETY (never pour liquid into a loudspeaker), honesty note. Displays are strobed to ~1.4 Hz (0.3 Hz slow-mo) and say so. Guided lesson keys: `liquid_display, faraday, threshold, acceleration, liquid, viscosity, depth, dish, contact_line, stages, waveform, dual_liquid`.

### Frequency readout everywhere
Hz · nearest note + octave · cents · λ (in the medium where meaningful) · mode · resonance strength.

---

## 4. Phase 4 — Pattern Gallery & Art Studio (reuses Harmonograph export)
- Save pattern + full experiment state (JSON, AsyncStorage `ape:cymatics:patterns:v1`); duplicate/modify; favourites; compare 2/4; notes; reopen exact configuration. Numeric state is stored **separately** from artwork.
- Colouring mode = the Harmonograph art-board grammar: node-line outline extraction (marching squares on the node-only field) → tap-to-fill enclosed regions, solid/gradient, Academy palette + custom, undo/redo, hide/show nodal lines, line weight, background, rotational-symmetry fill.
- Export via `harmoExport` / `shareImage` (view-shot → share / save-to-Photos / print). PNG + transparent PNG + printable PDF (Letter / A4 / square) through those gates; **SVG** export is new (we already build the outline as paths). Art Print hides data; Lab Print prints the settings block (title, Hz, note, dimensions, material, thickness/depth, liquid, mode, exciter, date, name, notes, "Simulation").
- Honesty rule inherited: capabilities without a native half render disabled with the "next app build" note (view-shot / media-library / print are native-gated today).

---

## 5. Guided experiments (owner list, mapped to phases)
P1: 1 first visible resonance · 2 predict where particles gather · 3 nodes vs antinodes · 4 diameter changes resonance · 5 thickness changes resonance · 6 aluminum vs steel vs acrylic vs wood · 7 move the exciter, suppress a mode · 13 harmonic string vs inharmonic plate.
P2: 8 circular liquid pattern · 9 Faraday onset threshold · 10 water vs glycerin · 11 depth without changing frequency.
P3: 12 beat frequency (needs `dual` generator) · plus hidden-heat-map node ID and match-pattern-to-mode.
P4: 14 reproduce a saved pattern from its settings · 15 design, colour, save, print.

---

## 6. Build plan & gates
| Phase | Deliverable | Verify |
|---|---|---|
| 1 | Home, intro, Plate Studio (rect/square/circle, 8 materials, orthotropic wood, all controls, 8 views), Nodes/Modes, Harmonics vs Modes, Evidence vs Myth, 8 experiments, catalog row live | Pixel: sweep finds modes at predicted Hz; square (1,1)± diagonal figure; size/thickness scaling matches formula; exciter-at-node suppression; 60 fps particle view; tone plays through gate |
| 2 | Liquid Studio + stages + curated patterns + liquid views + 4 experiments — **BUILT 2026-09-16** (experiments #9–12 in the app's numbering route to the Liquid Studio with `SET UP THE DISH ›`; the Liquid row left PLANNED AREAS) | Threshold + ½f behaviour visible; no pattern outside its region — Pixel: RESP shows f* below onset and f/2 above; a/a꜀ bezel tints by stage; silicone 10 cSt at 40 Hz reports onset ≈ 1.2 g vs water ≈ 0.16 g; gel/thick oil report out-of-range instead of inventing a pattern |
| 3 | Harmony in Motion, Membrane/Speaker, Other Systems, Change-One-Thing, remaining experiments; `dual` generator proposal — **BUILT 2026-09-17** (experiments #15–17 in the drum studio; #13–14 "Turn it up" / "One frequency, three plates" from the learning pass; beats visual-only until engine 8 lands with the next build) | ratio audio exact via additive ✓ (Harmony module through GEN_MODES.additive); detune visual-only until build ✓ — Pixel: drum studio renders shell/hoop/lugs/head, bezel FUNDAMENTAL 200 Hz for a 14" Mylar head at 3 kN/m |
| 4 | Gallery + Art Studio + exports | export parity with Harmonograph; SVG opens in a vector editor |

Each phase: owner GO → build → tsc + tests → device-verify → commit on "commit". Comp B modal library plugs into Phase 1's shape list whenever it arrives.
