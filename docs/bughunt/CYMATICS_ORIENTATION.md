# Cymatics Lab — orientation (2026-09-18)

**What this is.** A cold-start briefing on the Cymatics Lab for someone who built it and has been away. Not a bug hunt, not a design review — the design review is `docs/bughunt/design-cymatics.md` and is not repeated here. Everything below was read out of the code in `src/screens/lab/cymatics/**` and `src/features/cymatics/**` as it stands today (working tree clean, HEAD `1b91aa6a`), not out of the spec. Where the code and the spec disagree, the code wins and I say so.

---

## 1. WHAT IS IT?

### The argument

The lab has one claim and it is a negative one: **a frequency does not have a shape.** 440 Hz has no figure of its own. The figure belongs to the whole system — outline, size, thickness, material, how it is held, where it is driven, how much it is damped — and the frequency only selects *which* of that object's own resonances gets woken, if any.

That claim is not buried in a paragraph. It is the first prose a learner reads on the lab home (`CymaticsHomeScreen.tsx`: *"Does 440 Hz have a shape? … The answer is the lab's central discovery, and you get to find it yourself"*), it is the tagline of the guided lesson (`guidedLessons/content.ts` → `cymatics`: *"A frequency has no shape of its own"*), and it has a whole module built as an instrument to prove it (Change One Thing). Every other piece in the lab is there to make that claim survive contact with a real learner: to make it concrete before it is stated, to supply the physics that makes it true, and to defend it against the enormous online mythology that says the opposite.

### What a learner walks away knowing

Six things, in roughly the order the lab builds them:

1. A stable figure appears **only at a resonance**, not at every frequency. Between modes the plate barely moves and the sand only shivers.
2. Every figure you will ever see is **one normal mode** of the object. The nodal lines are the hinges of that mode; the lobes either side move in opposite directions.
3. **Which** resonances an object has follows a law — `f ∝ (h / L²) · √(E / ρ(1−ν²))` — so size, thickness and material move them in predictable directions, and damping does *not* move them (it blurs them).
4. Plate and membrane modes are **inharmonic**. Strings and air columns are harmonic. That is why a plucked string has a pitch and a bare drumhead does not — and why a Chladni figure is not a picture of a chord.
5. Drive level changes how **far** the object moves, never **which** figure appears. Driver position changes which modes can be woken at all.
6. The same physics runs a liquid surface, a drumhead, a loudspeaker cone, a bell and an acoustic levitator — what changes is what vibrates and whether its modes happen to be harmonic.

### The parts, and what each is for

**Four instruments** (the parts that let you play — they have no right answer and no script):

| | For |
|---|---|
| **Chladni Plate Studio** | The central experience. Build a plate out of eleven outlines, eight materials, five sizes, five thicknesses, three edge conditions; drive it; watch sand find the still lines in any of seven synchronised views. Everything else in the lab either sets this up or comments on it. |
| **Liquid Cymatics Studio** | A dish on a shaker. Teaches the one thing a plate cannot: a **threshold**. Below a critical acceleration nothing organises at all; above it the surface answers at **half** the drive frequency. Eight liquids, four dish shapes, depth, rim condition. |
| **Membrane & Loudspeaker Studio** | Two instruments in one route. A tunable drumhead (why a drum has no pitch and a timpani does), and a loudspeaker cone swept from suspension resonance through the piston band into breakup — the one part of the lab that is directly professional rather than pedagogical. |
| **Pattern Gallery & Art Studio** | Where saved experiments live. Browse, reopen the exact configuration, colour the figure as line art, compare two or four side by side, export. Half archive, half toy. |

**Eight modules** (the parts that teach — `modules/registry.ts`, in the order they appear on the home):

1. **What Is Cymatics?** — pressure wave → vibration → material moves → node vs antinode → why only at resonance. Deliberately opens the plate **off** resonance (`f₁ × 0.78`) so the learner's first sight is a plate doing nothing, with a chip to flip to resonance.
2. **Nodes, Antinodes & Modes** — the kinesthetic one. A plate pinned on the glass with FREQ on the lane: ride onto a mode, watch the figure snap in; ride away, watch it dissolve. Square or disc, five views.
3. **Harmonics vs Plate Modes** — four frequency ladders on one shared log axis (string · open pipe · circular membrane · free plate), tap a rung to hear it. This is the direct refutation of "a chord has a cymatic symbol". A document, not a rack.
4. **Harmony in Motion** — frequency ratios kept deliberately *apart* from plate modes. Wave addition, Lissajous, spectrum, beats. Riding the BASE lane moves both tones while the figure holds still: harmony is a ratio, not a frequency.
5. **Other Cymatic Systems** — six systems (string, air column, water surface, loudspeaker with particles, bells/gongs/cymbals, acoustic levitation) answering "what is actually vibrating here". Three have live drawings on the glass; three hand off to the studio that simulates them.
6. **Change One Thing** — the thesis as an instrument. Two plates on one glass, one locked tone derived from plate A that never follows B, and a VARY tray choosing the single difference (material / size / thickness / shape / driver / support / damping).
7. **Evidence vs Myth** — the integrity panel, and the lab's only real retrieval test: commit EVIDENCE / DEPENDS / MYTH on six claims *before* the explanation unlocks, then a score.
8. **Guided Experiments** — a menu, not an activity. Seventeen cards, START THE SERIES at the top; the activity itself happens inside the instrument.

**The experiment series** — seventeen structured activities (`features/cymatics/presets.ts`): ten on the plate, four in the dish, three on the drum and cone. Each one carries a preset that lands the studio in exactly the situation the steps describe, a prediction (on ten of them), tick-off steps, and a `lookFor` payoff held behind a REVEAL. The run is continuous: PREV/NEXT live in the studio and hop studios when the next experiment lives elsewhere.

**Teaching vs playing.** The split is clean. The eight modules and the seventeen experiments teach — they have a claim, an order and a payoff. The four instruments are open-ended; they have no correct outcome and will happily sit at a frequency where nothing happens, which is itself the lesson. The Art Studio is the only part that is pure play, and the lab is careful that it stays play: the colouring is stored in a separate key and can never touch the numeric state underneath.

---

## 2. WHAT DOES IT DO?

### The science chain

Every studio runs the same shape of pipeline, and every number on screen comes out of it:

```
controls → a spec object → modes/threshold → a response read → a sampled field (Float32Array) → the viz
```

Nothing is ever a stored picture. The gallery, the art board, the compare canvas and the printed sheet all re-derive the figure from the saved state through the same chain (`patternField.patternGeometry`).

### Plate modes (`plateModes.ts`)

Three families of shape share one frequency law.

- **The law is exact** for geometrically similar plates on the same support: `f = (λ² / 2π a²) · √(D / ρh)`, `D = E h³ / 12(1−ν²)`. All the "size ↑ → f ∝ 1/L²", "thickness ↑ → f ∝ h", "√(E/ρ)" discoveries fall straight out of it. Only λ² differs between shapes.
- **Rectangle / square, free edges → APPROXIMATED.** There is no closed form, so the classic teaching approximation: `cos(mπx/a)·cos(nπy/b)` with free-free beam eigen-constants (β₂ = 4.7300, β₃ = 7.8532, β₄ = 10.9956, then (m+½)π), λ² ≈ β_m² + β_n²(a/b)², Warburton's Rayleigh form without the cross term. On a **square** the degenerate (m,n)/(n,m) pair is combined as `W_mn ± W_nm` — that is where the diagonal Chladni figures come from — and the pair is split ±3 % because a real plate splits it. Nodal topology and ordering are right; the frequencies are approximate.
- **Disc → APPROXIMATED.** `J_n(kr)·cos(nθ)` with Leissa's tabulated free-edge eigenvalues (NASA SP-160, ν ≈ 0.33), fifteen modes from (2,0) up. The true free-edge shape carries a small `I_n(kr)` term that is omitted, so nodal-circle radii are within a few per cent. Clamped and simply-supported discs are the free values scaled by a fixed factor (1.95 / 1.35) — a teaching approximation, and the same trick (1.7 / 1.2) for rectangles.
- **Eight solved shapes → CALCULATED, three of them VALIDATED.** Triangle, hexagon, ring, ring-with-clamped-hub, bell plate, guitar top, violin top, violin-with-f-holes. These came from Computer B as FEM solutions (Morley Kirchhoff triangles, scikit-fem) on a 96×96 grid, 16 modes each, int8 displacement plus a mask, outline and holes, shipped as `src/data/cymatics/<shape>.json` and decoded by `modalLibrary.ts`. λ² is given against that shape's own unit dimension — side, flat-to-flat, outer Ø, body length — which is exactly what the SIZE control means for it, so the same exact scaling law applies. The ring, clamped ring and bell agree with the exact characteristic equation to ≤ 0.11 % and carry the **VALIDATED** badge; the rest say **CALCULATED**. Their edge condition is part of the solution, so EDGES stops being a control and becomes a single printed chip.
- **Orthotropic wood.** Solid wood carries `E∥ = 12 GPa` against `E⊥ = 0.9 GPa` at ρ 450. The grain angle blends `Dx = D∥cos²g + D⊥sin²g` (and the complement for Dy, with `D₃ = √(DxDy)`), so rotating the grain genuinely re-orders the modes on a square or rectangle. On a disc or any solved shape, wood falls back to the geometric-mean stiffness and the grain does nothing — and the tray says so in plain words.
- **Damping and response.** Each material has a modal Q (aluminum 800, steel 1000, brass 600, copper 500, glass 700, plywood 60, wood 80, acrylic 40); the DAMPING control scales it as `Q · 10^(−1.5d)`. Response is the single-DOF magnitude `1/√((1−r²)² + (r/Q)²)`. `modeResponseSigned` returns that magnitude carrying the sign of the real part — in phase below resonance, anti-phase above. (It used to return the real part alone, which is *zero* exactly at resonance, so a drive landed precisely on a mode dropped that mode out of the drawn field. Fixed 2026-09-17; the comment in the file explains it.)
- **Drive and support.** `drive = |W(exciter)| · (1 − |W(support)|)²`, clamped to 0..1. That single line is the whole "move the driver onto a nodal line and the mode goes silent" experiment, and the "a clamp forces a node" one. On a solved shape the driver and clamp are snapped to the nearest point that is actually plate.
- **The field.** `sampleField` sums `signedResponse × drive × W` over the active modes on an N×N grid (56 in the studio, 48 in the modules, 44 in Change One Thing, 96 in the gallery), normalises to ±1, and writes **NaN** for cells outside the plate. Sign is the phase, magnitude is the amplitude map. The multi-tone case superposes a second sampled field weighted by each drive's response strength — legitimate, because a linear plate does exactly that.

### Liquid — Faraday waves (`faraday.ts`)

The dish is a genuinely different physics and the lab treats it as one.

- **Calculated:** the gravity–capillary dispersion `ω² = (gk + σk³/ρ)·tanh(kd)`, solved for k at the response frequency by bisection; and the dish's own modes for circle / ring / square / rectangle (Bessel zeros for pinned rims, J′ zeros for free ones; Fourier for the rectilinear shapes) up to 200 Hz.
- **Approximated:** the onset threshold `a_c = 4γω_r / (k·tanh kd)`, with γ assembled from three named contributions — bulk `2νk²`, the bottom boundary layer `k√(νω/2)/sinh(2kd)`, and the contact line `c√(νω)/R` (c = 4 pinned, 1.2 free). The studio prints those three as percentages, which is how the "thin layer → the bottom steals the energy" and "a wetting rim raises the threshold" lessons become visible rather than asserted. Cornstarch uses an effective viscosity that rises with acceleration.
- **The honest refusal.** When `a_c > 2.5 g` the rig reports **VISCOUS — NO PATTERN IN RANGE** instead of inventing a pattern. Gel and thick oil do exactly that. This is one of the more important decisions in the lab.
- **Illustrative:** the ten-stage ladder, whose boundaries are bands of `a/a_c` — flat below 0.15, sloshing/ripples to 1, onset to 1.15, stable to 1.8, transition, mixed, unstable, chaotic, splash — and the screen says the divisions are illustrative.
- **The pattern family** is a curated map, not CFD: when dish/λ < 2.5 the dish's own modes win; otherwise the bulk map (ν ≤ 4 cSt → squares below 90 Hz else stripes; ν ≤ 15 cSt → hexagons below 50 Hz else stripes; thicker → stripes; two-frequency drive → quasiperiodic), sourced to Kudrolli & Gollub, Binks & van de Water, Edwards & Fauve.
- **The subharmonic** is the thing to remember: drive at f and the surface answers at **f/2** once you are above threshold. The bezel's RESP cell shows `f/2` above onset and plain `f` below it, and the FREQ chooser is literally titled "DRIVE AT TWICE A DISH MODE".

### Membrane and cone (`membrane.ts`)

- **Calculated:** the clamped circular membrane, `f_ns = (j_ns / 2πR)·√(T/σ)` with exact Bessel zeros — so the tension, diameter and surface-density scaling are exact and pinned by tests. Five heads (Mylar 10 mil / 7 mil, calfskin, latex, Kevlar) differing in σ and Q.
- **Approximated:** the timpani kettle. It applies Rossing's *measured* ratios to the principal (n,1) series and a plain air-mass factor elsewhere, and says so. That is what produces the payoff — a bare head at 1 : 1.59 : 2.14 : 2.30 : 2.65, a kettled head near 1 : 1.5 : 2 : 2.5, a harmonic series missing its fundamental, which the ear fills in.
- **Strike weighting** is the membrane's version of the plate's driver rule: `|W|` at the mallet. A dead-centre mallet sits on every nodal diameter and can only wake the ring modes — the dull thud.
- **The loudspeaker is Illustrative by design.** Six drivers (25 mm dome through 380 mm sub) with f_s, Q_ts, diameter and a first-bending frequency; the six-stage ladder (stiffness → resonance → piston → edge flex → radial → breakup) is a stiffness profile, *not* a cone FEM, and the badge and the honesty block both say so. What **is** calculated inside it: the f_s response, `ka = πfD/c` with a beamwidth estimate, and the 1/f² piston excursion.

### What the badges mean

Every stage carries a silk-screened badge, and they are not decoration — they are a four-level vocabulary used consistently:

- **SIMULATION** — the prefix on everything. Nothing in this lab is a measurement. (`modMyth` teaches *"patterns generated by an app are measurements"* as a MYTH, so the lab has to keep its own rule.)
- **CALCULATED** — solved from the governing equation with no shortcut: the dispersion relation, the dish modes, the Bessel membrane modes, the FEM shape library, ka and the piston law.
- **CALCULATED · VALIDATED** — calculated *and* checked against a known exact result. Only the ring, clamped-hub ring and bell plate earn it.
- **APPROXIMATED** — a standard model with a known, named shortfall: the Ritz free plate (no exact solution exists), the disc's omitted `I_n` term, the Faraday threshold, the kettle's air loading.
- **ILLUSTRATIVE** — a drawn behaviour ladder, not a solution: the liquid's ten stages, the cone's six.

Below the fold each studio also prints a four-line block — what is exact / calculated / approximated / and what a real object would also depend on (flatness, mounting, the sand itself; cleanliness, the meniscus, the shaker's true motion; surround and spider geometry).

### What the views actually show

**Heat map.** The field is normalised to ±1 so its *shape* is always legible — but the heat ramp is then multiplied by `0.12 + 0.88 × strength` before it is coloured (`vizPlate.tsx`). That is deliberate and the comment says why: a full-red map at every frequency would have taught "there is a pattern at every frequency", which is the lab's own target misconception. Off resonance the map genuinely goes dark. Colours are the house `heatColor` ramp (navy floor → red), the same ramp as every meter in the app, and the studio prints a STILL → MOST MOTION key whenever a heat-derived view is up.

**Phase view.** Sign, not magnitude: amber where the field is positive, blue where it is negative, both mixed toward black as amplitude falls. It is showing that neighbours across a nodal line move in *opposite directions at the same instant* — the line is a hinge. Note that the blue here is the house MIDLINE_BLUE, which everywhere else in the app means zero amplitude; the prior design review flags that collision and it has not been changed.

**Node lines.** A three-band threshold on |field|: white below 0.06, a dim blue haze to 0.12, near-black above. It answers "which figure *would* form", and it fades with response strength rather than going dark.

**Particles.** A real point cloud (1 500 / 3 000 / 5 000 grains), positions living in a `SharedValue<Float32Array>` stepped every frame in a reanimated worklet — never React state. Each grain descends the gradient of |displacement| with agitation proportional to local amplitude × resonance strength, plus friction and deterministic jitter. That is why patterns **snap in** near a mode and dissolve between them rather than morphing continuously, and why grain size and friction change how fast a figure forms but never where its lines are.

**3D and cross-section** are strobed to a few hertz and say so — a real plate at 400 Hz shows you nothing.

### The controls, and what each one actually moves

- **FREQ** — the drive. Nothing else. It selects which mode (if any) responds; it never changes the plate. Logarithmic lane, 30–3 000 Hz on the plate, 10–200 Hz in the dish, 20–6 000 Hz on the drum, with a chooser that jumps straight onto a mode (or, in the dish, to *twice* a dish mode).
- **Material / size / thickness / shape / edges / grain** — these move the modes. The same drive frequency stops being a resonance. This is the entire thesis, exposed as six chip rows.
- **DAMPING** — the exception, and the lab names it as one. Damping does not move a resonance; it broadens it and lowers its peak.
- **LEVEL** — how far, not which. It maps to −40…−12 dBFS of real audio and nothing else in the model.
- **Driver position and clamp** — which modes can be excited at all.
- **SHAKE (dish)** — the real control variable there. It is an *acceleration* in g, and what matters is `a/a_c`, printed on the bezel and tinted by stage.
- **SAND** — amount, grain size, friction. Cosmetic to the physics, decisive to how the figure reads.

### Sound

One source: our own native generator, `ApeDsp` via `useDriveTone`. A sine at the drive frequency (phase-continuous retune, so a sweep or a fader drag glides without clicks). Square and triangle drives in the dish go through the **additive** engine as exact band-limited Fourier series (engine ≥ 3); pulse is `GEN_MODES.burst`. Harmony in Motion renders a locked ratio *exactly* as harmonics n₁ and n₂ of a shared base through the same additive path.

**Two independent tones need engine 8 and this client is on 7.** So the plate's SECOND TONE, the dish's SECOND FREQUENCY and Harmony's beats are **shown but not heard** today, and every one of those trays says so in plain words rather than faking it. Everything routes through the audio-output gate, pings `noteAudioActivity`, and stops on focus loss.

### Gallery and art output

`SAVE` stores **numbers, not a picture**: the whole studio state plus the honesty badge it was carrying. `patternGeometry` re-derives the field at N = 96, decides the outline kind (circle / rounded rect / ring / polygon-with-holes) and pulls the object's real face and edge colours from the material, head or liquid. `patternReadout` builds the Lab Print rows from the same state — plate, thickness, edges, driver, support, damping, drive, resonance, level (or liquid/dish/shake/response/stage, or head/tension/fundamental/strike).

The art board's geometry is the interesting part. **Regions are the 4-connected sign components of the field** — which is exactly "the areas enclosed by nodal lines", for every shape including the ones with holes, with no planar-face arithmetic. A region's boundary comes from marching squares on a padded signed-magnitude field, so where two regions meet the contour interpolates onto the *true* nodal line. Symmetry fill is a rotated-tap lookup: filling from point p also fills the regions under p rotated by 2πi/k. Region ids depend on the grid size, so `Artwork.N` is stored and a mismatch drops the fills rather than misplacing them.

The renderer is **react-native-svg**, not Skia — one renderer draws the thumbnail, the open view, the art board, the compare canvas and the export card, and it emits the same path data `svgExport.ts` writes. So the PNG, the SVG, the PDF and the screen can never disagree.

---

## 3. HOW DO YOU INTERACT WITH IT?

### Getting in

Academy (the MENU screen) → **Training** → **Sound Visualization** → *Cymatics Lab: Sound Made Visible*. The whole lab is **members-only**: `CymaticsLab` and every child route — module host, all three studios, the gallery — are individually wrapped in `withMembershipPreview` in `RootNavigator.tsx` (they were once only wrapped in the orientation helper, which checks nothing; they are listed by hand now).

Deep links, if you are testing: `proaudio://labs/cymatics`, `/plate`, `/liquid`, `/membrane`, `/gallery`, `/module/:id`. React Navigation reads linking once at container mount, so a newly added route needs a cold start.

### The lab home

Top to bottom: a **live hero** (the classic 240 mm square aluminum plate parked on its second excitable mode, 2 200 grains, running only while the screen is focused), the badge `SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTRE-DRIVEN`, then the thesis paragraph.

Then **four big buttons**, colour-coded and each with a one-line sub: amber → the Plate Studio, blue → the Liquid Studio, tan → the Membrane & Loudspeaker Studio, purple → the Pattern Gallery & Art Studio.

Then **LEARN & EXPERIMENT**: the eight modules as numbered accordion rows — tap the row to expand its blurb, tap OPEN to enter. PLANNED AREAS renders nothing, because `PLANNED_AREAS` is `[]` (every area of the spec is live; the mechanism is still wired for a future addition). A guided-lesson row sits at the bottom.

> **Easy to miss:** the four instrument buttons sit *above* the module list, so the default gesture is "open an instrument" before any framing, and there is no "start here". The lab's actual designed path is **START THE SERIES**, which is buried inside module 8. Nothing on the home points at it.

### The module screen

One host (`CymaticsModuleScreen`) with a header, a `‹ PREV / MODULE n / 8 / NEXT ›` bar that swaps modules **in place** via `setParams` (so back always leaves the lab, not the module), and one of two layouts:

- **Document modules** (Intro, Harmonics vs Plate Modes, Evidence vs Myth, Guided Experiments) get a plain scroller with the guided-lesson row at the bottom.
- **Rack modules** (Nodes, Harmony, Systems, Change One Thing) get the full height and render a **Rack Unit** themselves: a pinned stage that never resizes, a bezel of live readouts under it, the scroll well in the middle, and the dock at the bottom. The law is *reading may scroll; operating may not.*

### The rack idiom (shared by all four rack modules and all three studios)

Worth re-loading into your head because everything hangs off it:

- **STAGE** — the display, pinned. Never resized mid-interaction. The honesty badge is silk-screened under it.
- **BEZEL** — three or four backlit legend cells printed on the glass. **Long-press any cell for its guided-lesson entry.** Some cells are also **tappable verbs** — RES on the plate and in Nodes lands the drive on the nearest mode; RESPONSE on the drum does the same; UNDO/REDO on the art board live here. An `ⓘ` at the strip's end opens "what the display shows".
- **WELL** — the only thing that scrolls. The first-move caption sits *outside* any disclosure; everything else folds into one collapsible **LAB NOTES**.
- **DOCK** — one shared **ParamLane** (a drawn console fader with a slot, tick stops and a brushed cap) bound on mount to that screen's teaching parameter, over a strip of ≤ 6 **dock keys**. Tap a key to bind the lane to it (fader keys) or open its **tray** (group/options keys). Trays overlay the *well only* — the glass stays live while you change things. Double-tap the lane to return to its declared home. During a drag a **drag tag** rides the glass's bottom edge with the live value, so it is never under your finger. Faders are accessible: `adjustable` with increment/decrement actions.

> **Easy to miss #1:** a tappable bezel cell looks **identical** to a static one — same border, same type, no chevron, no underline (`BezelReadouts.tsx`). The RES tap-to-land is the primary escape from "I turned the knob and nothing is happening", and it is invisible.
>
> **Easy to miss #2:** trays are the only place most controls live. Six dock keys hide roughly thirty controls between them.

### Chladni Plate Studio

Header carries **SAVE** and **▶** side by side.

- **Dock:** `FREQ` (lane, 30–3 000 Hz log; chooser **JUMP TO A MODE** listing the ten lowest excitable modes with their Hz and labels) · `PLATE` (shape · material · size · aspect · damping · thickness · edges · grain) · `DRIVE` (driver position · support/clamp · run actions · second tone) · `VIEW` (sticky, seven options) · `LEVEL` (lane) · `SAND` (amount · grain size · reset · friction).
- **Bezel:** `DRIVE` Hz · `RESPONSE` % · `MODE` label · `RES` state (tappable → lands the nearest mode).
- **Well:** the resonance strength meter with a plain-English caption that changes with state; `‹ −0.1%` / `+0.1% ›` fine nudges (hold for 0.5 %); a **WHAT THIS PLATE IS** card that prints the four lowest excitable modes *and their ratios to the first* with the line "not 1 : 2 : 3 : 4. Plate modes are inharmonic"; cross-links to experiments, Nodes and Evidence vs Myth; the four-line honesty block.
- **Drag on the plate:** in the DRIVE tray, "Drag on plate" arms the driver or the clamp for direct placement on the glass. In the CROSS-SECTION view, dragging moves the slice.
- **SWEEP** is not a plain log sweep. Metal plates have Q in the hundreds, so a linear sweep crossed each resonance in about 20 ms and never read AT. This one **glides 1.5 s between modes and holds 3 s on each**, so every resonance is seen forming; the audio follows.
- **SILENT DRIVE** shakes the plate without the tone — for quiet rooms and for clients with no audio engine.

> **Easy to miss:** *nothing moves until you press ▶ or turn on SILENT.* The well says so, below the fold.
>
> **Easy to miss:** the SHAPE row concatenates the three analytic shapes and the eight solved ones into one undifferentiated chip wrap. Picking a solved shape silently replaces the EDGES chips with a single printed condition, and quietly disables wood's grain re-ordering. Both are explained — in the tray blurb, after you have already selected it.

### Liquid Cymatics Studio

Same faceplate, different instrument. The lane binds to **SHAKE**, not FREQ, because acceleration is the control variable that matters here.

- **Dock:** `FREQ` (10–200 Hz; chooser **DRIVE AT TWICE A DISH MODE**) · `SHAKE` (0.02–1.5 g, level-ramped lane, with the platform's physical travel in µm/mm printed) · `LIQUID` (eight presets · temperature · a plain-words ↔ property table · a live ν/σ/ρ line) · `DISH` (shape · size · aspect · depth · wall height · flat/bowl bottom · pinned/free rim) · `DRIVE` (waveform · sweep/slow-mo/silent · second frequency · relative phase) · `VIEW` (sticky, seven).
- **Bezel:** `DRIVE` · `RESP` (shows `f/2` above onset, plain `f` below) · `SHAKE` g · `a/a꜀` tinted by stage.
- **Well:** the **ten-rung stage ladder** with the current stage lit, the physics "why" for that stage in a sentence, `THRESHOLD ≈ x g · NOW y g` with ±5 % nudges, the damping breakdown as bulk/bottom/rim percentages and the pattern family, a **WHAT THIS RIG IS** card (dish/λ ratio, the lowest dish modes, λ in mm), a red-bordered **RIG SAFETY** card — *never pour liquid into a loudspeaker* — and the honesty block.
- Views include **THE RIG**, a side elevation where the platform bobs at the drive rate while the surface answers at half of it. That view is the single clearest statement of the subharmonic in the lab.
- Displays are strobed to about 1.4 Hz (0.3 Hz in slow motion) and say so.

> **Easy to miss:** the number on FREQ is what the *shaker* does. The surface does half of it. If you want a pattern on a particular dish mode you drive at **twice** that mode — which is why the chooser is worded the way it is.

### Membrane & Loudspeaker Studio

Two instruments behind one route, switched by VIEW.

- **Dock:** `FREQ` (20–6 000 Hz; the chooser lists head modes on the drum, and *cone stages* — f_s, piston band, ka = 1, edge flexing, breakup — when the loudspeaker is showing) · `HEAD` (material · diameter from 10″ tom to 26″ timpani · tension 1–6 kN/m · damping · **open shell vs timpani kettle**) · `STRIKE` (run actions · where the mallet lands, including drag-on-drum) · `CONE` (six drivers · "Show the loudspeaker") · `VIEW` (seven) · `LEVEL`.
- **Bezel, drum:** `DRIVE` · `FUNDAMENTAL` · `MODE` · `RESPONSE` % (tappable → lands the nearest driven mode).
- **Bezel, speaker:** `DRIVE` · `f_s` · `ka` · `STAGE n / 6`.
- **Well, drum:** the **TUNING** card — *why a drum has no pitch* (and *and a timpani does* when the kettle is on) — printing the live mode ratios against (0,1) or (1,1).
- **Well, speaker:** the six-rung cone ladder with its "why", excursion as a percentage of the resonant peak, ka with a beamwidth estimate, and the driver's own numbers.

> **Easy to miss:** the loudspeaker is *inside* this route. Nothing on the lab home says "loudspeaker", and the only ways in are the VIEW list's last entry or the CONE tray's "Show the loudspeaker" chip.

### The experiment series

Module 8 is a menu: a **START THE SERIES ›** button, then seventeen cards each showing number, title, goal, the prediction (where it has one), a `▸ PREVIEW THE n STEPS` fold, and **SET UP THE PLATE / DISH / DRUM ›**.

Tapping into an experiment routes to the right studio with a preset. The preset applies the spec, then resolves a frequency strategy — a literal Hz, or "land on the k-th excitable mode of the resulting plate" (resolved once the modes exist), or in the dish "drive at twice dish mode k, then land just above this setup's threshold".

The activity itself happens **in the instrument**. `ExperimentWell` renders through `rack.wellTop` — pinned at the top of the well, above the first-move caption, outside every disclosure — so the steps are the first thing under the stage on arrival. The card carries:

- `EXPERIMENT n / 17` and a `▾ FOLD` / `▸ STEPS` toggle,
- the goal, then a blue **PREDICT FIRST** panel (ten of seventeen have one),
- the steps as tappable tick-off rows,
- **REVEAL LOOK FOR ›**, which unfolds the payoff,
- and a `‹ PREV | ALL 17 | NEXT ›` row. PREV/NEXT use `StackActions.replace`, so the studio stays a single screen in the stack and `‹` back always lands on the experiment list however far you ran. When the next experiment lives in another studio the button reads **NEXT · DISH ›** or **NEXT · DRUM ›**.

> **Easy to miss:** the tick-offs are local state and are **cleared on every PREV/NEXT** (`go()` calls `setDone([])`). There is no persistence and no completion — at #17, NEXT is simply disabled and greyed.

### Gallery and Art Studio

One route, four modes, the header `‹` walking back through them (art → open → browse → out). Android hardware back does the same.

**BROWSE.** Filter chips `All · Plate · Dish · Drum · ★ Favourites`. A `Compare…` chip turns cards selectable (2–4, with an A/B/C/D letter appearing on each) and reveals a `PICK 2 – 4` / `COMPARE n ›` button. Two-column grid of cards, each a live-rendered figure (not a stored image) with name, studio tag and Hz. **Tap opens; long-press toggles favourite.** Empty state explains the SAVE key and offers three chips into the studios.

**OPEN.** The large figure with its badge (prefixed `SIMULATION ·` if it isn't already), then a chip row: `Open in studio ›` · `Colour ›` · `Duplicate` · `★ Favourite` · `Delete` (with an Alert confirm that also removes the artwork). Then editable **NAME** and **NOTES** (both commit on blur), then the settings table, then the export panel.

**`Open in studio ›` is the good trick:** it navigates with `{ saved: id }` and the studio applies *every* field in one batch — spec, Hz, level, view, multi/dual/driver, sand count/size/friction — after disarming its preset-landing refs, and prints `REOPENED FROM THE GALLERY · <name>` in the well. You get the exact experiment back, live.

**ART.** The art board is a Rack Unit of its own.
- Stage: the figure, tappable. A tap hit-tests to a region and fills it.
- Bezel: `REGIONS n` · `FILLED m` · `‹ UNDO` · `REDO ›` (the last two are the tappable cells).
- Dock: `FILL` (swatch row + custom colour via an in-tree picker overlay + **Erase**) · `STYLE` (solid / gradient, plus the nodal-line colour swatches) · `WEIGHT` (the bound lane, 0–4 px; at 0 the lines vanish and only the fills speak) · `PAPER` (the object's own face / black / white / warm paper / navy / transparent) · `SYM` (off / 2 / 3 / 4 / 6 / 8).
- Well: the caption, `Clear all fills`, the export panel, a save-state chip, the lesson row.
- History caps at 60 steps; a lane drag rewrites the current entry instead of pushing sixty. Autosave fires 500 ms after any change and flushes on unmount.

**COMPARE.** Two figures side by side or four in a 2×2 on **one canvas**, each on its own object face with a caption, then a data table of the identity lines, then a verdict sentence that states the thesis in whichever form applies — *"Same frequency, different objects — whatever differs in the figures, the tone did not do it."*

### Exports and what is gated

The visible card **is** the capture target (`collapsable={false}`, which Android requires). Kind chips: **ART PRINT** (figure only) vs **LAB PRINT** (figure + the whole settings block). Format chips: `PNG card · Transparent PNG · PDF · SVG`. The page-size picker (Letter / A4 / Square) is always rendered and drives both PRINT and PDF.

| Control | Needs | Today |
|---|---|---|
| SHARE (PNG) | view-shot + expo-sharing | disabled |
| SAVE (Photos) | view-shot + expo-media-library | disabled |
| PRINT | expo-print | disabled |
| PDF | expo-print + expo-sharing | disabled |
| **SVG** | nothing (text) / expo-sharing (file) | **works now** |

Disabled buttons render at 35 % with an accessibility label stating *why*, plus one footer line — "SHARE · SAVE · PRINT · PDF need the next app build. SVG works now." Nothing is a stub.

**Every sheet now carries provenance**, including the art print, the compare card and the transparent PNG: an 8.5 pt `SIMULATION · <badge>` line. The comment in `ExportPanel.tsx` explains the reasoning at length — the artefact that escapes is a symmetric coloured mandala, which is precisely the visual genre of the mythology the lab exists to correct, and it will be reposted as "the shape of 528 Hz" unless it says what it is. Two commits at HEAD (`a216153c`, `1b91aa6a`) carried the same line into the printed and compare sheets.

Storage: `ape:cymatics:patterns:v1` and `ape:cymatics:artwork:v1`, deliberately separate so colouring can never touch the science. Damaged rows are set aside under a `:damaged` key rather than destroyed.

### Degraded builds

The three `viz*.tsx` files are the only importers of Skia and are loaded solely through `skiaGate.requireViz*()`. On a pre-Skia client the stage renders an honest card — *"The plate display needs the current app build (Skia). Controls and readouts still work."* — and every number and control keeps working. The gallery is react-native-svg and needs no gate at all. With no audio engine, SILENT DRIVE still drives everything and the modules say so.

---

## 4. WHERE A LEARNER IS LIKELY TO GET LOST

**On arrival.** Thirteen entry points, no recommended path, and the instruments sit above the teaching. The lab does nothing about this today — no "START HERE", no pointer to START THE SERIES.

**"I turned the knob and nothing happened."** This is the most likely first failure, and it has two causes that look identical. Either the tone is not playing (nothing moves without ▶ or SILENT), or you are between resonances (which is the *lesson*, not a fault). The lab handles the second well — the RES cell reads BETWEEN, the heat map goes dark on purpose, and the well offers "tap RES on the bezel to land on it". It handles the first only with a caption below the fold, and the RES cell gives no visual sign that it is tappable.

**The punchline arrives before the discovery.** The Intro's closing card states the whole conclusion in prose, with the list of variables, in module 1. Change One Thing — the instrument built to make the learner discover it — is module 6, behind two contrast modules. A conclusion already read can only be confirmed, not discovered. The design review proposes the reorder; it has not been made.

**Nothing is remembered.** Experiment ticks are cleared on every PREV/NEXT and never persist; the home does not pass `done` to its module rows (every other lab does); there is no completion at experiment 17. A learner cannot answer "where was I?", and the lab's only retrieval instrument, Evidence vs Myth, sits at position 7 of 8 where a series-runner will never be delivered to it.

**Predictions are cheap to skip.** Both REVEAL controls — `REVEAL LOOK FOR ›` in the experiment well and `REVEAL HOW TO READ IT ›` in Change One Thing — are available as the very first action on arrival, before anything has been compared. Seven of the seventeen experiments have no `predict` field at all, including #2, which is titled *"Predict where the particles will gather"*.

**The two shape families look like one list.** Eleven chips in one wrap; selecting a solved shape removes a control and changes what wood does, and only the blurb afterwards explains it.

**Colour carries load, and it collides twice.** The heat ramp means amplitude everywhere in the app; the phase view paints maximum *downward* displacement in the ramp's zero-amplitude blue, and the RESPONSE and RES bezel cells sit adjacent showing the same physical fact in opposite hues (red at resonance vs green at resonance). A learner trained on the heat map will misread a blue phase lobe as a quiet region. Documented in the design review, unchanged.

**The dish is a different mental model.** Learners arriving from the plate will read FREQ as "the frequency of the pattern". It is not — the surface answers at half of it, and the control that decides whether *anything* happens is SHAKE, not FREQ. The bezel's `RESP` and `a/a꜀` cells and the ten-stage ladder carry this well once noticed; noticing is the hard part.

**The gallery does not say why you would compare.** After SAVE the studio offers "Open the gallery ›" and the gallery offers browse / colour / compare — but the COMPARE verdict line, which states the lab's thesis in data form, is only discoverable after you have already selected two patterns.

---

## 5. THE ONE-PARAGRAPH PITCH

Cymatics Lab: Sound Made Visible is a members-only lab built around a question most of the internet answers wrongly — *does 440 Hz have a shape?* You get four real instruments: a Chladni plate studio where you assemble a plate out of eleven outlines, eight materials and any thickness, drive it with a tone from our own audio engine, and watch several thousand grains of sand walk onto the still lines in seven synchronised views; a dish on a shaker where a liquid surface stays flat until you cross a threshold and then answers at *half* the drive frequency; a drumhead you can tune and strike, with a timpani kettle you can drop under it to hear a pitch appear out of an inharmonic instrument; and a loudspeaker cone you can sweep from suspension resonance through the piston band into breakup. Behind all of it is honest physics: the size–thickness–material scaling law is exact, the disc and membrane modes are Bessel functions with published eigenvalues, eight non-analytic shapes — triangle, hexagon, ring, bell plate, guitar and violin tops — are finite-element solutions validated against exact results where exact results exist, and every single render on screen carries a badge that says whether it is calculated, validated, approximated or illustrative. When the model would have to invent something, the lab refuses and tells you: a gel in this rig reports *no pattern in range* rather than drawing you one. Seventeen guided experiments run inside the instruments with a prediction first and the answer held back, eight teaching modules build the argument, a retrieval quiz makes you commit on the six claims people actually arrive believing, and anything you find can be saved with its full state, reopened exactly, coloured as line art, compared side by side and printed as either a lab sheet or a piece of art — with the word SIMULATION on it either way. You will leave knowing why a note has no figure of its own, and able to prove it.
