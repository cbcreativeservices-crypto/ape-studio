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
- **Circular, free / clamped / simply-supported edge**: exact Bessel solution `W(r,θ) = [Jₙ(kr) + C·Iₙ(kr)]·cos(nθ)`, eigenvalues from the tabulated boundary equations (Leissa / NASA SP-160 "Vibration of Plates"). Labelled **Calculated**.
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
The app scales λ with the same `h/L²·√(E/ρ(1−ν²))` law and evaluates W by lookup. Handoff doc: `docs/COMPB_CYMATICS_MODAL_LIBRARY_2026_09_16.md` (to be written when Phase 1 lands, so the schema is proven first). Until delivered these shapes are dimmed **Planned** rows.

### 1.4 Liquid — Faraday waves (Phase 2)
- Gravity–capillary dispersion `ω² = (g k + σ k³/ρ)·tanh(k d)`; circular-container modes from Bessel zeros with a pinned or free contact line; drive at f_d → surface responds at **f_d/2** (subharmonic) once vertical acceleration exceeds a viscosity- and depth-dependent threshold `a_c`.
- Behaviour stages 1–10 are driven by `(a/a_c, f)` bands — flat → slosh → ripples → onset → stable pattern → mode transition → mixed → unstable → chaotic → splash/atomisation warning.
- Pattern family (rings, spokes, lobes, stripes, squares, hexagons, stars, quasiperiodic, travelling) from a **curated stable-pattern map** in (depth, viscosity, f, a) space — labelled **Approximated** (physics-constrained, not CFD). The app never promises a pattern outside its region.
- Liquid presets (water, salt water, glycerin mix, silicone oil, light/thick mineral oil, gel, cornstarch non-Newtonian) as (ρ, μ, σ) rows; descriptive ↔ scientific control pairs shown together.

### 1.5 Membrane + loudspeaker (Phase 3)
Circular membrane: exact `J_n(k r) cos(nθ)` modes with tension/surface-density scaling. Loudspeaker cone: piston → resonance → cone flexing → radial modes → breakup → surround/dust-cap motion, as an illustrated cutaway driven by the membrane engine with a stiffness profile.

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
 ├─ 3 Liquid Cymatics Studio      Phase 2
 ├─ 4 Membrane & Loudspeaker      Phase 3
 ├─ 5 Nodes, Antinodes & Modes    teaching panel (interactive)
 ├─ 6 Harmonics vs Plate Modes    string / air column / membrane / plate comparison
 ├─ 7 Harmony in Motion           Phase 3 (ratios, beats, wave addition, Lissajous, spectrum → drives the sim)
 ├─ 8 Other Cymatic Systems       Phase 3 (string, water surface, speaker+particles, air column, bells/gongs, levitation)
 ├─ 9 Change One Thing            Phase 3 split-screen
 ├─ 10 Guided Experiments         15 activities (Phase 1 ships #1–7 & 13)
 ├─ 11 Pattern Gallery & Art Studio   Phase 4
 └─ Evidence vs Myth              integrity panel (Phase 1)
```

### Studio layout (plate + liquid share it)
READOUTS (Hz · nearest note · octave · cents · wavelength where relevant · current mode id · resonance strength meter) → DISPLAY (view switcher + overlay toggles) → CONTROLS (ParamLane / DockButton rack idiom: frequency coarse+fine, sweep, amplitude, damping, shape, material, size, thickness, support, excitation, particles, slow-mo, single/multi) → ACTIONS (play tone, sweep, reset particles, save pattern).

### Views (synchronised, same state)
Particle (sand/powder) · Amplitude heat map (`heatColor`) · Particle ⊕ heat overlay · 3D exaggerated plate (Skia, tilted) · Slow-motion ± displacement · Cross-section slice (movable) · Phase view (opposite-sign regions) · Node-only · Resonance-response graph · Spectrum. Liquid adds reflective surface, height-map, contour, refraction, monochrome.

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
| 2 | Liquid Studio + stages + curated patterns + liquid views + 4 experiments | Threshold + ½f behaviour visible; no pattern outside its region |
| 3 | Harmony in Motion, Membrane/Speaker, Other Systems, Change-One-Thing, remaining experiments; `dual` generator proposal | ratio audio exact via additive; detune visual-only until build |
| 4 | Gallery + Art Studio + exports | export parity with Harmonograph; SVG opens in a vector editor |

Each phase: owner GO → build → tsc + tests → device-verify → commit on "commit". Comp B modal library plugs into Phase 1's shape list whenever it arrives.
