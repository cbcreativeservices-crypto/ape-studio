# Jog wheel — implementation blueprint (2026-09-05)

Synthesised from the three specialist specifications (design, animation and interaction, lighting) against the owner's visual brief `C:\Users\profe\dev\ape-studio\docs\design\JOG_WHEEL_REFERENCE_2026_09_05.md` and the current implementation `C:\Users\profe\dev\ape-studio\src\components\JogWheel.tsx`. Every "must" from the three specs is kept, every "should" is folded in, and "nice"s that would add per-frame cost are dropped. Conflicts are resolved in §0 with the choice and the reason. Verified before writing: `node_modules/.bin/tsc --noEmit` exits 0 and `npm test` passes 276/276 on the unmodified tree; the Skia 2.6.2, Reanimated 4.5.1 and react-native-web behaviours the blueprint depends on were checked in `node_modules` (references inline).

Owner intent (verbatim): "redo the look, feel, motion, action, response, and realistic believability of the rotary knob in the dashboard screen. Use the real reference images to base design and lighting cues off of (I want it to look real!). This should be a praise point of the app, not a frustration or a gimmick."

---

## 0. Conflicts resolved

| # | Topic | Design said | Animation said | Lighting said | Decision and why |
|---|---|---|---|---|---|
| 1 | How the dimple moves | Animate only the dimple `<Image>` x/y scalars; no Group CTM | `<Group transform>` from one `useDerivedValue` translate | Same as animation | **Scalars on `<Image x y>`.** A translated circle is identical to a rotated one, so all three agree nothing rotates; scalar shared-value props are the proven idiom in this repo (`cableArt.tsx:321 end={rv}`, `CourseSelectionScreen.tsx:390`) and cost one blit. Animated Group transforms do work here too (`vizSpectral.tsx:496-503`), so this is the conservative choice, not a workaround. |
| 2 | How the dish is rendered | Opaque cached raster (its own gradient) | Live nodes, multiply/screen blend so face grain shows through | Live nodes with `Shadow inner` + `Mask` (saveLayers per frame) | **Translucent cached raster** (shading-only RGBA: black and white at low alpha). One blit per frame, no per-frame image filters or saveLayers, and it still inherits the local face tone and the face grain — the very reason animation and lighting wanted live nodes. Design's "SHOULD darken the dish on the shadow side" comes for free. |
| 3 | Body raster method | `createPicture` + `drawAsImageFromPicture` | `Skia.Surface.Make` (CPU) + imperative draws | Memoised declarative canvas, optional `drawAsImage` | **CPU `Skia.Surface.Make` + imperative draws.** Synchronous, no texture-image thread caveat, identical on web (`JsiSkSurfaceFactory.js:7` → `CanvasKit.MakeSurface`) and native. `drawAsImageFromPicture` on web needs a WebGL offscreen plus a `readPixels` round-trip (`Offscreen.js:23-32`, `JsiSkImage.js:89-101`); a live declarative body canvas would re-render at Dashboard meter rate unless memoised anyway. |
| 4 | The 96 px dial | Skia canvas with plain-number props | RN `<Image>` from a base64 PNG (zero live canvases on the Dashboard) | Skia canvas, memoised | **Skia canvas, `React.memo` keyed on size.** Synchronous first paint (a data-URI PNG decodes asynchronously and can flash blank), one code path for both sizes. A memoised canvas with constant props never redraws. |
| 5 | Light vector | (−0.45, −0.89), 27° | "top-left key" | (−0.5, −0.866), 30° | **30°.** Clean trig, matches the trophy bevel ratio (`DashboardScreen.tsx:2139-2140`, 0.35:0.20 ≈ cos30:sin30) and `cableArt.tsx:188`; 3° is invisible. |
| 6 | Face radius and canvas bleed | R = 0.47·S, pad 0.10·S | — | R = S/2 − 1, bleed 0.30–0.35·R | **Design's.** The hero card clips overflow (`DashboardScreen.tsx:2010`) and the 96 px box sits on the card's 10 px bottom padding (`:2028-2033`, `:2149`); lighting's shadow reaches ~18 px below the box (a hard cut line), design's reaches ~11 px with only the sub-5 % tail touching the pad. |
| 7 | Face gradient | Radial, 19 levels, crest equal to the panel | — | Linear along L, 12 levels, crest below the panel | **Radial shape with lighting's cap** (crest #1c1c1f, below the panel's #1f2021). The brief requires the knob darker than the panel everywhere; the off-centre radial gives the broader, softer lift of an overhead key. |
| 8 | Top edge / rim | One blurred sweep ring, HUB_LIGHT rungs 0.14 / 0.45 | — | Blurred fillet ring + crisp thin rim line | **Lighting's two rings on design's rungs.** The brief asks for a *thin line*; a single blurred 0.06·R band reads as a soft edge, not a lit edge. Rim line white 0.16 (hard cap 0.22), shadow-side fillet 0.45. |
| 9 | Dish tones | Opaque gradient, far wall #2d2d32 | crescent/pool as blend layers | Translucent, pool ≤ #202023, lip ≈ #3d3d41 | **Lighting's.** A matte dish gains at most ~22 % on its far wall (n·L 0.82 → 1.0); #2d2d32 over a #15 face reads wet and would re-open the 2026-08-05 "specular read wrong" ruling. |
| 10 | Grain | SkSL hash noise or Turbulence + colour matrix, baked | 128² LCG tile or FractalNoise, baked | 512² seeded RGBA tile via ImageShader, overlay blend | **512² seeded tile, overlay blend, baked into the body raster, with design's sub-linear pitch law.** Repo precedent (`SpectrogramScreen.tsx:246-250`), no shader compile, no Perlin lattice, one-time cost; overlay makes sparkle follow the light for free. |
| 11 | Release physics | Optional `withDecay` settle ≤ 20°, never a step (nice) | Silent settle ≤ 22.5° (must) + 2-detent coast with a UI-thread reaction (should) | — | **Bistable settle into the nearest detent + one-detent coast on a real flick; clicks fire through `step()` from one JS timer; no `withDecay`, no per-frame reaction.** `withDecay` compounds `velocity *= exp(-(1-dec)·(now-start)·0.1)` every frame (`rigidDecay.js:15`), so its coast length depends on refresh rate. MIN_STEP_MS 300 makes a second coast click impossible inside 320 ms, so a two-detent coast would always decouple wheel and topic; one detent keeps them locked. See §6.4. |
| 12 | Overlay open/close | (no position; "keep the dial hidden while open") | 140 ms in / 110 ms out fade + 0.97→1 scale | — | **Adopt the fade**, instant under reduced motion. No ratified rule forbids it, it reads as a lamp coming up on a panel, and the dial stays hidden exactly as today. |
| 13 | Haptics beyond the detent | — | Soft tick on confirmed grab; optional Light on ✕ | — | **Adopt both**, gated by `hapticsEnabled()`. No per-frame cost; silence on release/settle except a genuine detent crossing. |
| 14 | Disabled dial at 45 % opacity | — | "a real knob does not go translucent" (flag) | — | **Unchanged.** Rare state (one topic); an owner decision, not a realism gate. |
| 15 | Dimple radius | 0.27·R | 0.27·R | 0.26·R | **0.27·R** (25.4 % of D, inside the brief's 25–28 %). |
| 16 | Bounce spot | only when dR ≥ 24 px | — | always | **Only when dR ≥ 20 px** (overlay only). At 12 px it is mud. |
| 17 | ✕ key | Re-cut as a square matte console key (should) | Light haptic optional | — | **Adopt the re-cut** (§2.5); position nudged 4 px outward so the shadow bloom never touches it. |
| 18 | Accessibility | — | `onPress` fallback on the dial; adjustable role on the turn surface (must) | — | **Adopt.** RN and RNW route keyboard/AT activation to `onPress` only. |
| 19 | Canvases per knob | 1 (two images) | 1 (blit + dish nodes) | 2 | **One canvas per knob, two `<Image>` nodes.** |
| 20 | Contact shadow strength | α 0.60, σ 0.064·R | α 0.55, σ 0.045·D | α 0.55, σ 0.09·R | **α 0.55, σ 0.06·R** — the bleed budget in #6. |

---

## 1. Target in one paragraph

A low, heavy, matte sandblasted-black puck standing about 12 % of its diameter proud of the #1f2021 rack panel, seen very slightly from above so a thin crescent of cylinder wall shows under the face, seated in a tight near-black collar with a soft contact shadow falling down-right, and carrying one concave finger dish at 0.52·R whose shading is locked to the app's one overhead key (30° to the viewer's left): the dark occlusion crescent is always on the dish's upper-left inner wall and the thin lit lip always on its lower-right rim, at every spin angle. The face is the darkest raised object in the hero (crest #1c1c1f, mean ≈ #151517, shadow side #0c0c0e — every value below the panel), modelled by one broad off-centre diffuse gradient, a thin lit rim hairline on the upper-left arc only, and a static per-pixel sandblast sparkle; no hot spot, no outline ring, no colour. It is rendered in Skia as two cached rasters — a static body and a translucent, world-lit dish — and the only thing that changes per frame is where the dish image sits on its orbit, driven by the existing `spin` shared value on the UI thread. Under the finger it behaves like a low-mass detented encoder: it is under the finger the instant you touch it (the 50 ms glide, now continued rather than cancelled by the first move), tracks 1:1 with no visual notching, clicks through eight Rigid detents per turn exactly as ratified, and on release seats into the nearest detent or, on a genuine flick, coasts at most one click further and clicks as it seats. The 96 px dial and the ~297 px overlay are literally the same drawing at two sizes; the knob costs zero frames when idle.

---

## 2. Architecture

### 2.1 Files

| File (absolute) | Status | Contents |
|---|---|---|
| `C:\Users\profe\dev\ape-studio\src\components\JogWheel.tsx` | edit | Exports unchanged: `JogDial({ size, disabled, onOpen })`, `JogOverlay({ active, spin, onStep, onClose, disabled })`. Keeps every ratified constant (`DETENT_DEG`, `OVERLAY_Y_OFFSET` 46, `MIN_STEP_MS` 300, `FAST_SPIN_DEG` 1.5, `DEAD_PX` 44, `DIMPLE_OFFSET` 30, the size formula, the 8 px tap threshold), the PanResponder, tap-outside-to-close, the ✕ key, the SVG fallback stack (`JogBase`, `JogLighting`, `JogDimple`, `JogDimpleLayer`) and the styles. Gains: the `SKIA_READY` guard, the motion additions of §6, the accessibility additions, the presence fade, the new ✕ styles. |
| `C:\Users\profe\dev\ape-studio\src\components\jogwheel\jogGeometry.ts` | new | Pure numbers. `LIGHT`, `AWAY`, `geom(S)` → every dimension of §3–§4 as a fraction of R with the pixel clamps applied, `dishCentre(spinDeg, g)`. No React, no Skia — unit-testable with `node --test` if wanted. |
| `C:\Users\profe\dev\ape-studio\src\components\jogwheel\jogRaster.ts` | new | `getGrainTile()` (module-cached `SkImage`), `buildBodyImage(S, dpr)`, `buildDishImage(S, dpr)`, `getJogRasters(S)` (synchronous, module `Map` cache keyed `${round(S)}@${dpr}`, ≤ 4 entries), `prewarmJogRasters(S)`. Imperative Skia only (`Skia.Surface.Make`, `Skia.Paint`, `Skia.Shader.*`, `Skia.MaskFilter.MakeBlur`, `Skia.Path.MakeFromOp`). Must never be called when `!SKIA_READY`. |
| `C:\Users\profe\dev\ape-studio\src\components\jogwheel\JogSkia.tsx` | new | `JogSkiaStack({ size, spin? })` — the one `<Canvas>` per knob: `<Image image={body}/>` + `<Image image={dish} x y/>` where x/y are `useDerivedValue` scalars when `spin` is given and plain numbers otherwise. `React.memo` on `size` (the dial never re-renders with the Dashboard's meters). |
| `C:\Users\profe\dev\ape-studio\src\screens\dashboard\DashboardScreen.tsx` | no change (at most one line) | Nothing required. The one permitted line, only if a device pass shows a need: `overflow: 'visible'` on `styles.topicJog` (Android clipping) **or** `importantForAccessibility="no-hide-descendants"` on the hidden dial wrapper at `:1410` (the invisible opener stays focusable while the wheel is open). |

### 2.2 Component tree

```
JogDial (Pressable, role button, label "Open the topic wheel", onPressIn + onPress fallback)
└─ JogStack size=S                       View S×S, overflow visible
   └─ SKIA_READY ? JogSkiaStack(size)    Canvas at (-pad,-pad), (S+2pad)², pointerEvents none (prop AND style)
                 : existing SVG stack     unchanged apart from §7

JogOverlay (mounted while `mounted`, which lags `active` by the 110 ms exit fade)
└─ Reanimated.View  absoluteFill, zIndex 60, opacity = presence        (root)
   ├─ Reanimated.View  wheel box at (cx-S/2, cy-S/2), S×S, scale 0.97→1, pointerEvents none (prop+style)
   │  └─ JogStack size=S spin=spin
   ├─ View  {...pan.panHandlers} absoluteFill, role adjustable, actions increment/decrement,
   │        pointerEvents = active ? 'auto' : 'none'                     (drawn AFTER the wheel — §7)
   └─ Pressable ✕  (role button, label "Close the topic wheel", hitSlop 18)   (last = topmost)
```

Rotation centre: the face centre is the S×S box centre in both components, so `JogOverlay`'s angle math about `(cx, cy)` and `DIMPLE_OFFSET` are untouched. The canvas bleeds by `pad` on every side purely to hold the wall, collar and contact shadow.

### 2.3 Notation used below

* `S` — box size (96 for the dial; overlay `S = round(min(w·0.62, h·0.4)·1.23)`, ≈ 297 on a 390×844 phone, unchanged).
* `R = 0.47·S` — face radius (45.1 @ 96, 139.6 @ 297). Everything else is a fraction of R.
* `pad = 0.213·R` (= 0.10·S). Canvas side `Sc = S + 2·pad = 2.553·R`. Canvas origin is at (−pad, −pad) in box coordinates; `C = (Sc/2, Sc/2)` is the face centre in canvas coordinates.
* `t = 0.095·R` — visible wall lune height (4.3 px @ 96, 13.3 px @ 297). `Cb = C + (0, t)` — the base circle centre.
* `LIGHT L = (−0.5, −0.866)` (toward the light), `AWAY = (0.5, 0.866)`. In Skia sweep-gradient terms (0° = +x, clockwise on screen): light at **240°** (position 0.667), shadow at **60°** (0.167), terminators at 150° (0.417) and 330° (0.917).
* `dR = 0.27·R` — dish radius; `ρ = 0.52·R` — orbit radius; `θ = (spin − 30°)·π/180`; `D = C + ρ·(cos θ, sin θ)` — dish centre (rest at 2 o'clock; the finger lands on it because `DIMPLE_OFFSET = 30`).
* `dpr = min(PixelRatio.get(), 3)`; raster pixel size = `round(Sc·dpr)`; the raster canvas is scaled by `dpr` so every number below is in logical px; blur sigmas use `respectCTM: true`.
* `k.α` = black at alpha α, `w.α` = white at alpha α. Colours are sRGB; the canvas colour space stays default (sRGB) so hexes sample as written.
* Pixel clamps (only these scale sub-linearly): every stroke ≥ 1 px, every blur σ ≥ 0.5 px unless stated, grain cell per §5, bounce spot omitted below dR 20 px.

Numeric table for the implementer (R = 45.1 / 139.6):

| Quantity | S = 96 | S = 297 |
|---|---|---|
| pad, Sc | 9.6, 115.2 | 29.7, 356.4 |
| t | 4.3 | 13.3 |
| dR, ρ | 12.2, 23.5 | 37.7, 72.6 |
| contact shadow offset (x, y from C), σ | (2.3, 7.0), 2.7 | (7.0, 21.7), 8.4 |
| AO fringe r, σ | 46.9, 1.4 | 145.2, 4.2 |
| collar r, width, σ | 45.7, 1.1, 0.5 | 141.3, 3.5, 1.7 |
| fillet ring r, width, σ | 43.5, 3.2, 0.9 | 134.7, 9.8, 2.8 |
| rim line r, width | 44.6, 1.0 | 137.9, 2.2 |
| dish raster side (logical / @3×) | 31.7 / 95 px | 98 / 294 px |
| body raster (@3×) | 346 px | 1069 px |
| grain cell (device px @3× / @2×) | 1 / 1 | 2 / 1 |

---

## 3. Layer stack — bottom to top, at face radius R

Layers A0–A8 live in the **static body raster** (built once per (S, dpr), drawn as one `<Image>`). Layers D0–D4 live in the **translucent dish raster** (§4). Nothing in the body raster ever moves or rotates; the grain is static (the brief allows either). "World-fixed" below means authored relative to LIGHT and never rotated.

| # | Layer | Skia primitive (imperative, on the raster canvas) | Geometry (fractions of R) | Colour / stops | Blur | Blend | Motion |
|---|---|---|---|---|---|---|---|
| A0 | AO fringe (360° occlusion seating the puck) | `drawCircle` | c = Cb, r = 1.04·R | k.40 | MaskFilter Normal σ = max(0.03·R, 1) | srcOver | static, world-fixed |
| A1 | Contact shadow (offset away from the light) | `drawCircle` | c = C + (0.05·R, t + 0.06·R), r = R | k.55 | σ = max(0.06·R, 1.5) | srcOver | static |
| A2 | Collar ring (the dark gap at the base) | `drawCircle`, stroke | c = Cb, r = 1.012·R, width = max(0.025·R, 1) | k.90 | σ = max(0.012·R, 0.5) | srcOver | static |
| A3 | Cylinder wall (Lambert around the drum) | `drawCircle` + `MakeSweepGradient(Cb)` | c = Cb, r = R | positions [0, .167, .333, .5, .75, 1] → ['#111114', '#08080a', '#0b0b0d', '#1a1a1d', '#1a1a1d', '#111114'] (darkest at 60°, lit at 180°; the 180–360° half is hidden under the face) | none | srcOver | static |
| A4 | Wall top-to-base falloff | `save; clipPath(circle(Cb,R)); drawCircle + MakeRadialGradient(C, R+t); restore` | c = C, r = R + t | positions [0, .917, .95, 1] → [w.05, w.05, transparent, k.45] (a hair lighter just under the rounded edge, darker to the base) | none | srcOver | static |
| A5 | Face diffuse (matte, no hot spot) | `drawCircle` + `MakeRadialGradient`, `paint.setDither(true)` | c = C, r = R; gradient centre = C + L·0.5·R, radius = 1.55·R | positions [0, .35, .72, 1] → ['#1c1c1f', '#171719', '#111113', '#0c0c0e'] | none | srcOver | static |
| A6 | Sandblast grain (§5) | `drawCircle` with the tile `ImageShader` (repeat, nearest, scale cell/dpr) | c = C, r = 0.99·R | tile (236,236,242) sparkle + faint pits; `paint.setAlphaf(g)` | none | **overlay** | static |
| A6b | Grain on the wall lune (should) | same shader, clip = circle(Cb, R) minus circle(C, R) | — | alpha 0.5·g | none | overlay | static |
| A7 | Rounded-edge fillet shade | `drawCircle`, stroke + `MakeSweepGradient(C)` | c = C, r = R − 0.035·R, width = 0.07·R | positions [0, .167, .417, .667, .917, 1] → [k.30, k.45, transparent, w.05, transparent, k.30] (darker than the face at 60°, neutral at the tangents, faintly lifted at 240°) | σ = max(0.02·R, 0.5) | srcOver | static |
| A8 | Lit rim hairline | `drawCircle`, stroke + `MakeSweepGradient(C)` | c = C, r = R − 0.012·R, width = clamp(0.016·R, 1, 2.4) | positions [0, .417, .667, .917, 1] → [w0, w0, **w.16**, w0, w0] — a crisp thin line over the ~160° lit arc, absent on the lower-right. **Hard cap α 0.22**: above it the edge reads as gloss (owner 2026-08-05). | none | srcOver | static |
| — | Dish (§4) | second `<Image>` node | side 2.6·dR, centred on D(θ) | translucent modulations | — | srcOver | **position follows spin; shading world-fixed** |

Draw order inside the raster is exactly A0 → A8. The face (A5) covers everything inside r < R about C, so of A3/A4 only the lower lune of height t survives; of A0–A2 only the outer fringe, the down-right shadow and the outer half of the collar survive on the panel. Translucent black over the transparent raster composites onto the RN panel as an exact multiply — no blend mode can see the RN view behind the canvas, so nothing that must darken the panel may rely on `multiply`.

Tonal ladder (sRGB, targets for the pixel probes): panel #1f2021 (31) · face crest #1c1c1f (28) · face mean ≈ #151517 (21) · face shadow side #0c0c0e (12) · wall #1a1a1d → #08080a · collar ≈ #050506 · dish crescent core ≤ #060608 · dish floor = local face tone · dish pool ≤ #202023 · far lip peak ≈ #35353a · rim hairline peak ≈ #40404a · sparkle peaks ≤ #3a3a40 · unlit LED block #3b3c3e (`LedMeter.tsx:201`, must stay brighter than the knob) · glass recess #050608 (`DashboardScreen.tsx:2119`, a hole, not an object). The brightest thing on the knob is the rim hairline (white 0.16, HUB_LIGHT rung 3, `TileChassis.tsx:60`), deliberately duller than the trophy bevel's 0.35 metal lip directly above (`DashboardScreen.tsx:2139`): metal lip versus matte plastic is the material contrast the eye should read. Everything is achromatic; the LED ladder owns all chroma and the amber percentage owns all warmth.

---

## 4. The dimple as a function of θ

**Position:** `θ = (spin − 30°)·π/180`, `D(θ) = C + ρ·(cos θ, sin θ)`, ρ = 0.52·R. The dish image (side `2.6·dR`) is drawn at `x = D.x − 1.3·dR`, `y = D.y − 1.3·dR`, `width = height = 2.6·dR`, `fit="fill"`. That is the entire per-frame dependency on spin.

**Shading:** independent of θ. Because the dish is a circle and the key light is broad and distant, rotating the dish about C is indistinguishable from translating its centre along the orbit, so one image authored in world orientation is exact at every angle. The raster is translucent (only black and white at partial alpha), so wherever it lands it darkens and lightens the *local* face tone and grain underneath: the floor equals the surrounding face, the crescent kills the sparkle, the pool keeps it, and the dish darkens on its own when it swings to the shadow side. Local coordinates below have origin at D, in fractions of dR:

| # | Layer | Primitive | Geometry | Colour / stops | Blur |
|---|---|---|---|---|---|
| D0 | Wall darkening + the soft face-to-dish fillet | `drawCircle` + `MakeRadialGradient((0,0), 1.05·dR)` | r = 1.05·dR | positions [0, .60, .86, .95, 1] → [transparent, k.03, k.20, k.22, transparent] (floor = face tone, rim ≈ 0.72×, fading over the last 5 % = the rounded transition; no hard circle anywhere) | none |
| D1 | Cast crescent (the rim's own shadow, hugging the **upper-left** inner wall) | `save; clipPath(circle(0, 0.985·dR)); drawPath(MakeFromOp(rect(±1.5·dR), circle(AWAY·0.22·dR = (+0.11·dR, +0.19·dR), dR), Difference)); restore` | offset along AWAY | k.75 | σ = max(0.10·dR, 0.6) |
| D2 | Lambert term (dark toward the lit-side wall, lit pool on the far wall) | same clip; `drawCircle` + `MakeLinearGradient(L·dR → −L·dR)` i.e. (−0.5·dR, −0.866·dR) → (+0.5·dR, +0.866·dR) | r = 0.985·dR | positions [0, .48, .52, 1] → [k.30, k0, w0, w.05] (the 0.48/0.52 gap keeps the black-to-white swap fully transparent) | none |
| D3 | Bounce spot (wall inter-reflection near the floor centre) — **only when dR ≥ 20 px** | `drawCircle` + `MakeRadialGradient` | c = (0.06·dR, 0.10·dR), r = 0.42·dR | positions [0, .55, 1] → [w.045, w.015, transparent] | none |
| D4 | Far lip (thin light lip on the lower-right rim where the fillet catches the key) | `Skia.Path.Make().addArc(oval(±1.03·dR), −10, 140)`, stroke + `MakeSweepGradient((0,0), start −10, end 130)` | r = 1.03·dR, width = max(0.055·dR, 1) | positions [0, .5, 1] → [w0, **w.13**, w0] (peak at 60° = AWAY; the near/upper rim stays dark, defined only by D0/D1) | σ = max(0.03·dR, 0.5) |

Tone targets on the overlay at any θ: crescent core ≤ #060608 at `D + L·0.8·dR`; floor ≈ local face tone; pool ≤ #202023 at `D − L·0.8·dR`; lip peak ≈ #35353a. Nothing in the dish may exceed the rim hairline's brightness.

Why no `Shadow inner` / `Mask` nodes: on both platforms Skia builds the inner shadow as a four-filter composition (`sksg/Recorder/commands/ImageFilters.js:12-24`), which is fine once at raster time but would be a saveLayer per frame if live. The clip + difference-path + mask-blur recipe above produces the same crescent with no image filter at all; D0's fade replaces the alpha mask (the lighting spec's own fallback).

---

## 5. Grain — preparation and caching

**Look:** dense, isotropic, tiny points a little lighter than their neighbours, plus rare faint pits; denser and brighter in the lit region, gone inside the dish crescent; invisible as "noise" at arm's length, unmistakable as sandblasted plastic up close. It is also the banding killer for the broad 16-level face gradient (together with `paint.setDither(true)` on A5).

**One tile, built once per app run, module-level cache:**

```ts
// jogRaster.ts — 512×512 RGBA Unpremul, seeded (mulberry32, seed 0x5A17B1A5), transparent by default
for each pixel: u = rng();
  if (u < 0.12)       { v = rng(); write(236, 236, 242, round(255 * (0.12 + 0.50 * v*v*v))); } // most points faint, a few reach ~0.62
  else if (u < 0.17)  { write(0, 0, 0, round(255 * 0.10)); }                                     // faint pits
Skia.Image.MakeImage({ width: 512, height: 512, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
                     Skia.Data.fromBytes(buf), 512 * 4)   // SpectrogramScreen.tsx:246-250 recipe
```

**Applied at raster time only (A6):** `tile.makeShaderOptions(TileMode.Repeat, TileMode.Repeat, FilterMode.Nearest, MipmapMode.None, Skia.Matrix().scale(cell / dpr, cell / dpr))` on a paint with `blendMode = Overlay` and `alphaf = g`, drawn as the face circle (r = 0.99·R). With the raster canvas scaled by dpr, one texel = `cell` device pixels, integer, so dots stay crisp.

* **Cell (device px):** `cell = max(1, floor(dpr · 0.5 · (S / 96) ^ 0.4))` — the design spec's sub-linear pitch law: the grain scales with the object (the overlay is the same puck seen ~3× closer) but never becomes dirt. At dpr 3: dial 1, overlay 2; at dpr 2: 1 and 1; at dpr 1 (web preview): 1 and 1.
* **Global opacity:** `g = clamp(dpr / 3, 0.5, 1) × (S < 150 ? 0.6 : 1.0)` — coarser device pixels get lower per-dot contrast; the dial variant is the same surface seen three times farther away (no resolvable dots, only a fine lift).
* **Overlay blend** means a white dot yields `dst·(1+α)` and a pit `dst·(1−α)` on this dark ground: the sparkle is automatically stronger in lit regions and vanishes inside the crescent with no extra work. Peaks on the crest stay ≤ #3a3a40.
* Never regenerated, never animated, never drawn live. Exactly one `Skia.Image.MakeImage` call site for the tile.

**Raster cache:** `Map<string, { body: SkImage; dish: SkImage; g: JogGeom }>` keyed `${Math.round(S)}@${dpr}`, at most 4 entries (evict the oldest). Builder is synchronous (`Skia.Surface.Make(px, px)` → `getCanvas()` → `scale(dpr, dpr)` → draws → `flush()` → `makeImageSnapshot()`); CPU-backed images are safe to draw from the UI thread on native and need no `makeNonTextureImage`. Cost estimate: dial ≈ 5 ms; overlay at 3× (1069² with four blurred layers) ≈ 40–100 ms on a phone, once per size per session.

**Pre-warm:** `JogOverlay`'s hooks run while inactive (Dashboard mounts it always), so an effect after first paint calls `prewarmJogRasters(size)` via `InteractionManager.runAfterInteractions` — the big raster exists before the first open and never delays the Dashboard's first frame. If the user opens before it exists, `getJogRasters` builds synchronously on demand (one-time, never blank). The dial raster is built synchronously in `useMemo` (5 ms) so the first paint is never blank. A window-size change (device rotation) is just a new key.

---

## 6. Motion and response

All ratified behaviour is preserved verbatim: `DETENT_DEG` 45 (8 per turn), `MIN_STEP_MS` 300 with the "drop the excess" rule, `FAST_SPIN_DEG` 1.5, `DEAD_PX` 44, `OVERLAY_Y_OFFSET` 46, `DIMPLE_OFFSET` 30, the 8 px tap/drag threshold, the overlay size formula, angle-about-centre math, endless wrap (spin is unbounded), the 50 ms `withTiming` glide (`Easing.out(quad)`), the 1800/90/1 clamped tracking spring, the Rigid haptic per detent through `step()` gated by `hapticsEnabled()`, tap-outside-to-close and the ✕ key. Gesture input stays on `PanResponder` (react-native-gesture-handler is not installed; adding it needs a native build). Nothing below runs per frame on JS: handlers are per touch event, Reanimated interpolates on the UI thread, Skia redraws two image blits.

New constants (starting values; §6.9 says which are tuned on device):

```
GRAB_GRACE_MS   = 80      SETTLE_SPRING = { stiffness: 600, damping: 49, mass: 1, overshootClamping: true }  // ζ = 1, ~160 ms
COAST_MIN_DPS   = 180     COAST_DECEL   = 2400 (°/s²)      COAST_MAX_MS = 320     COAST_MIN_MS = 90
VEL_STALE_MS    = 80      VEL_MIN_DT_MS = 4                VEL_CLAMP_DPS = 720
PRESENCE_IN_MS  = 140 (Easing.out(cubic), opacity 0→1, scale 0.97→1.00)
PRESENCE_OUT_MS = 110 (Easing.in(quad),  opacity →0,  scale →0.985)
```

`animationsAllowed()` (`C:\Users\profe\dev\ape-studio\src\features\settings\a11y.ts:75-77`) is read **on every render** into `allowedRef` (the PanResponder is memoised with `[]`; the OS flag hydrates after first paint — `attentionPulse.tsx:27-29` precedent). Gated OFF when reduced: the presence fade (instant mount/unmount), the coast (none), the settle spring (direct set to the same endpoint). Always ON because functional: finger tracking, the 50 ms glide, the dish following spin, detent haptics. There is no `withRepeat`, no `useFrameCallback`, no ambient motion of any kind: when nothing is touched, nothing runs.

### 6.1 Grab

Unchanged: on grant, unwrap the target to the nearest equivalent of the current spin and glide there in 50 ms. Added: `grantAt = Date.now()`, velocity estimator reset, `springLive = false`, any pending release timer cleared, `cancelAnimation(spin)` is **not** called here (the glide replaces whatever was running). **Grace window:** for `GRAB_GRACE_MS` after grant every move update takes the spring path regardless of |d|, so the spring starts from the glide's current value and inherits its velocity — the glide is *continued*, not snapped. Today the first move event (8–16 ms after touch-down) does a direct set that cancels the timing animation and teleports the remaining glide distance (up to 180°), which is the "pop" the glide was meant to remove.

### 6.2 Tracking

Unchanged rule with hysteresis: `useSpring = springLive || Math.abs(d) >= FAST_SPIN_DEG || now - grantAt < GRAB_GRACE_MS`; once the spring path engages inside a gesture it stays engaged until release (`springLive = true`). This removes the hitch at the end of every fast spin (the direct set snapping a ~17° spring lag at 720°/s) while honouring the 2026-08-16 ruling that slow gestures create no animation object. The dimple stays exactly under the finger: **no visual notch, catch or snap while dragging** — the detent is felt (Rigid) during the drag and only seen at rest.

Velocity estimator (per event, not per frame): `ω = 0.5·ω + 0.5·(d / dt)` from event timestamps, ignoring `dt < VEL_MIN_DT_MS`; clamped to ±`VEL_CLAMP_DPS`. If the last move is older than `VEL_STALE_MS` at release, ω = 0 (a paused finger is not a flick).

### 6.3 Detents while dragging

Exactly as today: relative to the grab (`accum`), JS-side, `step(dir)` with the MIN_STEP_MS throttle and the Rigid haptic. `accum` stays in (−45°, 45°) between clicks; that remainder is what the release logic reads.

### 6.4 Release: bistable settle and the one-detent coast

A detented knob cannot rest between detents. On release of a confirmed drag (`movedRef`; a tap outside still closes, a tap on the wheel still does nothing):

```
s     = sign(ω) (0 if |ω| < COAST_MIN_DPS or !allowedRef.current)
Δ     = s ? min(67.5°, ω² / (2·COAST_DECEL)) : 0            // constant-deceleration travel
pEnd  = clamp(accum + s·Δ, −45°, +45°)                       // at most ONE boundary crossing
k     = round(pEnd / 45)  ∈ {−1, 0, +1}                       // the detent it seats into
travel = k·45 − accum;  endpoint = spinTarget + travel
```

* `k = 0`: seat back into the last clicked detent — silent, no `onStep`, travel ≤ 22.5° (or up to 45° after a flick that ran out of momentum, still silent).
* `k = ±1`: the wheel is past halfway (or the flick carries it there) and falls forward into the next detent — the click point — so `step(k)` fires through the normal path (Rigid haptic, `onStep`, throttle). Wheel and topic therefore always agree at rest. If the throttle drops the click (a detent < 300 ms earlier), the owner's "drop the excess" rule applies, as it already does mid-drag.
* Animation: no flick → `spin.value = withSpring(endpoint, SETTLE_SPRING)` (critically damped, ~160 ms, a mechanical seat, never a bounce). Flick → `withTiming(endpoint, { duration: clamp(1000·2·|travel| / |ω|, COAST_MIN_MS, COAST_MAX_MS), easing: Easing.out(Easing.quad) })` — out-quad *is* constant deceleration with initial slope ω, so the release is velocity-continuous and frame-rate independent. Reduced motion → direct set.
* Click timing: one `setTimeout` (cancelled on grant, close and unmount) fires `step(k)` at 110 ms for the spring settle and at 0.8·duration for the coast, i.e. as the wheel seats. No worklet, no `useAnimatedReaction`, no `runOnJS`.
* Bookkeeping: `spinTarget = endpoint; accum = 0`.
* **`withDecay` is banned** (`rigidDecay.js:15` compounds the decay per frame, and under `ReduceMotion.System` it jumps to the clamp edge).

### 6.5 Overlay open and close

Internal `mounted` state plus `presence = useSharedValue(0)`. `active → true`: `setMounted(true)`, `presence = withTiming(1, 140 ms, out-cubic)`. `active → false`: `presence = withTiming(0, 110 ms, in-quad, cb → runOnJS(setMounted)(false))`. Opacity on the root (wheel and ✕ fade together); scale 0.97→1.00 on the wheel view only; never above 1.0; no spring. The pan surface is live from the first frame of the open (a drag can begin during the fade) and inert during the exit (`pointerEvents = active ? 'auto' : 'none'`). `onClose` semantics untouched: the commit fires immediately, only the visual lingers 110 ms. The contact shadow lives in the raster, so the whole object comes and goes as one. Reduced motion: presence set directly, mount/unmount synchronous (today's behaviour). The Dashboard still hides the small dial the instant the overlay opens (`DashboardScreen.tsx:1410`, `:2151`) — no change.

### 6.6 Press feedback

None on the small dial: the Dashboard hides it in the same commit the press opens the wheel, so no press animation could ever be seen, and a real knob neither squashes nor depresses. On the overlay the finger is usually not on the wheel (drag anywhere), so a depth change would be a fabricated cue. The honest press feedback is the overlay coming up (§6.5), the glide (§6.1) and the grab tick (§6.7).

### 6.7 Haptics (all gated by `hapticsEnabled()`, fired only from JS event handlers)

| Event | Haptic |
|---|---|
| Detent crossed (drag, settle or coast) | `impactAsync(Rigid)` — unchanged, only ever from `step()` |
| Drag confirmed (movedRef flips at > 8 px) | `impactAsync(Soft)` once per gesture; never on grant, so a tap on the wheel and a tap-outside-to-close stay silent. Android fallback if Soft is inaudible on the owner's device: `performAndroidHapticsAsync(Gesture_Start)` |
| Release / silent settle | nothing — a haptic here would read as a topic change that did not happen |
| ✕ commit | `impactAsync(Light)` — a console key press |

### 6.8 Accessibility (roles and labels preserved, gaps closed)

* `JogDial`: keep `accessibilityRole="button"` and `accessibilityLabel="Open the topic wheel"`; add an `onPress` fallback that opens only if `onPressIn` did not already open during this press (`openedRef`) — RN and react-native-web route keyboard, VoiceOver, TalkBack and synthetic clicks to `onPress` only.
* `JogOverlay` pan surface: `accessibilityRole="adjustable"`, `accessibilityLabel="Topic wheel"`, `accessibilityHint="Swipe up or down to change topic"` (native only), `accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}`, `onAccessibilityAction` → `step(±1)` and `spinTarget += ±45` animated with `SETTLE_SPRING` so the dimple visibly advances one detent.
* ✕ unchanged (`"Close the topic wheel"`, hitSlop 18).
* Optional one-line Dashboard change (only if an AT pass shows the invisible opener is focusable while the wheel is open): `importantForAccessibility="no-hide-descendants"` on the hidden wrapper at `DashboardScreen.tsx:1410`.

### 6.9 Cancel and safety

`cancelAnimation(spin)`, clear the release timer and reset `springLive` at the top of the close handler, whenever `active` turns false, and in the unmount cleanup, so no late `step()` can reach the Dashboard after it has committed `goTo(scrollIdxRef.current)` (`DashboardScreen.tsx:1873-1877`). Guard `step()` with `activeRef` so a stale timer is a no-op. Values to confirm on a phone (they cannot be judged on the web preview): `COAST_MIN_DPS`, `COAST_DECEL`, the Soft grab tick, and the settle/coast click timings.

### 6.10 ✕ key (design "should", adopted)

Keep the 34×34 box, hitSlop 18, role and label. Restyle as a matte console key on the same light ladder as the knob: `borderRadius: 6`, face `#1a1b1e`, `borderTopColor rgba(255,255,255,0.14)` (HUB_LIGHT rung 3), sides `rgba(0,0,0,0.30)`, bottom `rgba(0,0,0,0.45)` (rung 5), a 1.5 px downward contact shadow `rgba(0,0,0,0.5)` (iOS shadow / Android elevation 2), glyph ✕ `#d5d8de`, 15 px, weight 600. Position nudged 4 px outward so the wheel's new shadow bloom never touches it: `left = cx + size/2 − 18`, `top = cy − size/2 − 12`. Nothing on a real transport section is a round floating chip with a specular rim.

---

## 7. Web fallback and the SKIA_READY guard

```ts
const SKIA_READY =
  Platform.OS !== 'web' ||
  (typeof globalThis !== 'undefined' && !!(globalThis as { CanvasKit?: unknown }).CanvasKit);
```

Identical in shape to `C:\Users\profe\dev\ape-studio\src\screens\tools\WaveformScreen.tsx:76-78`. `JogStack` renders `JogSkiaStack` when true and the existing react-native-svg stack when false — never a blank. `jogRaster.ts` must never be invoked when the guard is false (the `Skia` singleton binds to CanvasKit at module evaluation; `index.ts` loads `public/canvaskit.wasm` before `App`, so on the :8090 preview the Skia path is what renders).

Fallback edits (all zero per-frame cost, so folded in):

1. `JogDimpleLayer`: replace the `rotate` style with the same translate trick — `useAnimatedStyle(() => ({ transform: [{ translateX: ρ·(cos θ − cos θ0) }, { translateY: ρ·(sin θ − sin θ0) }] }))` — so even the fallback keeps its shading world-fixed.
2. `JogDimple`: move the lip glint (`JogWheel.tsx:114`) to the dish's lower rim (`dCy + dR·0.98`) and cap the dish centre stop (`:101`) at `#1c1c20`.

Web hit-testing, a hard rule (overnight audit 2026-09-04; fix precedent `C:\Users\profe\dev\ape-studio\src\screens\courses\CourseSelectionScreen.tsx:378-383`): react-native-web ignores the Skia `<Canvas pointerEvents="none">` prop, so both canvases carry `pointerEvents="none"` **and** `style={{ pointerEvents: 'none' }}`, their wrapper Views carry `pointerEvents="none"`, and in the overlay the wheel is rendered **before** the pan surface and the ✕ (which are transparent and full-screen, so draw order has no visual cost). Without this, drags that start on the wheel die on the web preview and the dial's press can be swallowed.

Web verification notes: judge only console errors from a fresh tab; the harness's synthetic mouse events can drive a press-in and a drag on the pan surface, and `document.querySelector('[aria-label="Open the topic wheel"]').click()` must open the overlay after §6.8 (it does not today). The web preview's DPR is 1–1.5, so the grain reads 2–3× coarser than on a phone — sign the grain off on device.

---

## 8. Performance budget

| Situation | Work per frame | Notes |
|---|---|---|
| Dashboard idle, overlay closed | **0** | The dial's canvas has constant props and is `React.memo`'d on `size`; the Dashboard's meter re-renders do not reach it. No shared value feeds it. |
| Overlay open, finger still | **0** | No Reanimated animation runs on `spin` when nothing is touched; no `withRepeat`, no `useFrameCallback`, no reaction. The canvas redraws only when `spin` changes. |
| Overlay open, dragging / settling / coasting | 2 derived scalars (one sin, one cos, two adds) + 2 image blits in one canvas | Zero JS per frame: PanResponder handlers are per touch event; Reanimated interpolates on the UI thread (main thread on web, still zero JS of ours); Skia draws two `<Image>` nodes. No paint, shader, path, filter, noise or saveLayer is constructed per frame. |
| Once per (size, dpr) per session | body raster + dish raster | Synchronous CPU rasterisation; dial ≈ 5 ms in `useMemo`; overlay ≈ 40–100 ms pre-warmed after the Dashboard's first paint. Cache ≤ 4 entries; the overlay raster at 3× is ≈ 4.6 MB RGBA, the dish ≈ 0.35 MB. |
| Once per app run | 512² grain tile (1 MB) | Module-level; ~3 ms; never rebuilt. |
| Open / close | one `withTiming` on `presence` for 140 / 110 ms | Nothing after it settles. |
| Memory | ≤ 4 cached raster pairs + 1 tile | Rotation on device creates a new size; evict the oldest. |

Web holds one WebGL context per Skia canvas: two at most while the overlay is open (the hidden dial's canvas stays mounted at opacity 0), one otherwise.

Things that must not be "optimised" away: the baked grain and the dither (they are the banding killer for a 16-level gradient over a 280 px face, not decoration); the `pointerEvents` style on the canvases; the raster cache key including dpr.

---

## 9. Acceptance checklist

A judge ticks these from screenshots of the web preview (fresh tab → STUDY → the dial in the hero → click → overlay; `computer.zoom` for close inspection) and from the code. Pixel probes use the tonal ladder in §3.

**Look (screenshot)**

1. At rest, dial and overlay: the dimple shows a dark crescent on its **upper-left** inner wall and a thin light lip on its **lower-right** rim; there is no bright ellipse on the dimple's top.
2. After dragging the overlay ~90° and ~180° (dimple near 12 o'clock and near 6 o'clock): the crescent is still upper-left and the lip lower-right; only the dimple's position on the orbit has changed.
3. Mean face luminance (4 samples at 0.5·R on the N/E/S/W axes) is below the panel #1f2021; no flat-face pixel outside single-pixel sparkle, the rim hairline, the lip and the pool exceeds #1c1c1f; sparkle peaks ≤ #3a3a40; the darkest pixel on the knob lies inside the dimple's upper-left crescent.
4. At `D + L·0.8·dR` luminance ≤ 8/255 and at `D − L·0.8·dR` ≥ the local face tone + 6 levels, at every tested angle.
5. A darker crescent of wall (~0.095·R tall at the bottom, tapering to nothing at the sides) shows under the face, with a hair-lighter line at its top; a tight near-black collar hugs the lower half of the base; a soft shadow lies on the panel below-right of the puck (panel pixels 0.1·R outside the base at 60° are ≥ 6 levels darker than those at 240°). Nothing is drawn inside the face to fake depth (no vignette, no ellipses).
6. The rim is a thin lighter line (peak ≈ #40404a, 1–2.4 px) over roughly 160°–320° only and darker than the face on the lower-right arc — not a uniform outline; no region brighter than #4a4a50 wider than 3 px anywhere on the knob (no hot spot).
7. Zoom the overlay 2–3×: a fine static speckle is visible, denser and brighter toward the upper-left, absent inside the crescent. Zoom the dial 3×: the same texture at a finer pitch with no individually resolvable dots. Nothing sparkles, moves or shimmers while idle.
8. The overlay downscaled to 96 px matches the dial (face 0.94·S, dimple ⌀ 0.254·D at 0.52·R, wall 0.045·S, same tones).
9. The ✕ is a square-cornered matte key (radius 6, 0.14 top rim, 0.45 bottom shadow, glyph #d5d8de) at `cx + size/2 − 18` / `cy − size/2 − 12`, and the wheel's shadow does not touch it.
10. The knob remains darker than the unlit LED blocks (#3b3c3e) and the trophy bevel's metal lip is brighter than the knob's rim hairline.

**Feel (device pass; web where possible)**

11. Touching the overlay and turning immediately shows no snap (moves inside `GRAB_GRACE_MS` take the spring path); after a fast spin the deceleration shows no hitch (`springLive` hysteresis present).
12. A slow release between detents seats ≤ 22.5° into a detent in ~160 ms; silent when it seats back, one Rigid click and one topic step when it falls forward past halfway. A hard flick coasts at most one detent (≤ 320 ms), lands exactly on a detent and clicks as it seats; never two clicks.
13. The overlay fades in over ~140 ms with scale never above 1.0, the ✕ fades with it, a drag started during the fade already turns the wheel, and the exit fade is ~110 ms. Under reduced motion (Settings toggle or OS flag) mount/unmount is instant, a flick stops dead on the detent, and finger tracking plus detent haptics are unchanged.
14. Haptics: Rigid per detent, one Soft tick when a drag is confirmed, nothing on a silent settle, Light on ✕; none when `hapticsEnabled()` is false.

**Code**

15. `JogWheel.tsx` still exports `JogDial{size,disabled,onOpen}` and `JogOverlay{active,spin,onStep,onClose,disabled}`; `DETENT_DEG`, `OVERLAY_Y_OFFSET` 46, `MIN_STEP_MS` 300, `FAST_SPIN_DEG` 1.5, `DEAD_PX` 44, `DIMPLE_OFFSET` 30, the 50 ms glide, the 1800/90/1 spring, the size formula, endless wrap and tap-outside-to-close are unchanged; `DashboardScreen.tsx` is untouched or changed on one line.
16. `SKIA_READY` (`Platform.OS !== 'web' || !!globalThis.CanvasKit`) selects Skia; the SVG stack renders when false; `jogRaster.ts` is never called when false; both canvases carry `pointerEvents="none"` and `style.pointerEvents: 'none'`; in the overlay the wheel precedes the pan surface and the ✕ in JSX.
17. The only Skia props driven by a shared value are the dish `<Image>` `x` and `y` (two `useDerivedValue`s of `(spin − 30)·π/180`); no `<Group transform>` is animated; no `rotate` remains anywhere in the file; the dial passes plain numbers.
18. Rasters come from a module-level cache keyed by `(round(S), dpr)` built with `Skia.Surface.Make`; exactly one `Skia.Image.MakeImage` call site for the grain, executed at most once per app run; the grain shader uses repeat tiling, nearest sampling and a `cell/dpr` scale; blend mode overlay; the face paint has dither on.
19. No per-frame paint/shader/noise/path construction; no `withRepeat`, `useFrameCallback` or `useAnimatedReaction`; `withDecay` is absent; `Haptics.impactAsync` call sites are exactly: `step()` (Rigid), the grab tick (Soft), the ✕ (Light); `animationsAllowed()` is read per render into a ref and gates the presence fade, the coast and the settle spring only.
20. `JogDial` keeps `accessibilityRole="button"` and `accessibilityLabel="Open the topic wheel"` and has the `onPress` fallback; the pan surface has `accessibilityRole="adjustable"` with increment/decrement actions; the ✕ keeps `"Close the topic wheel"`.
21. On close and unmount: `cancelAnimation(spin)`, the release timer is cleared, and no `onStep` can reach the Dashboard afterwards.
22. Gate: `node_modules/.bin/tsc --noEmit` exits 0 and `npm test` passes 276/276 (both verified green on the unmodified tree at blueprint time); a fresh web tab shows no console errors beyond the pre-existing 401 resource loads.

---

## Appendix — the imperative raster in outline

```ts
// jogRaster.ts (sketch; every number comes from geom(S))
const surf = Skia.Surface.Make(px, px); if (!surf) return null;      // caller falls back to SVG
const cv = surf.getCanvas(); cv.scale(dpr, dpr);
const p = Skia.Paint(); p.setAntiAlias(true);
// A0 AO fringe
p.setColor(Skia.Color('rgba(0,0,0,0.40)')); p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, g.aoSigma, true));
cv.drawCircle(g.Cb.x, g.Cb.y, 1.04 * g.R, p);
// A1 contact shadow … A2 collar (stroke) … A3 wall (sweep, no mask) … A4 falloff (clip + radial) …
// A5 face: p.setShader(Skia.Shader.MakeRadialGradient(C + L·0.5R, 1.55R, stops…, null, TileMode.Clamp)); p.setDither(true)
// A6 grain: p.setShader(tile.makeShaderOptions(Repeat, Repeat, Nearest, None, Skia.Matrix().scale(cell/dpr, cell/dpr)));
//           p.setBlendMode(BlendMode.Overlay); p.setAlphaf(g.grainAlpha); cv.drawCircle(C, 0.99R, p)
// A7 fillet (stroke + sweep + blur) … A8 rim line (stroke + sweep, no blur)
surf.flush(); const body = surf.makeImageSnapshot();
// dish: a second surface of side round(2.6·dR·dpr); D0 radial → D1 clip + MakeFromOp(rect, offsetCircle, Difference) + blur
//       → D2 linear along L → D3 (dR ≥ 20) → D4 arc + sweep(start −10, end 130) + blur
```

```tsx
// JogSkia.tsx (sketch)
const dishX = useDerivedValue(() => g.C.x + g.orbit * Math.cos((spin.value - 30) * Math.PI / 180) - g.dishSide / 2);
const dishY = useDerivedValue(() => g.C.y + g.orbit * Math.sin((spin.value - 30) * Math.PI / 180) - g.dishSide / 2);
<Canvas pointerEvents="none" style={{ position: 'absolute', left: -g.pad, top: -g.pad, width: g.Sc, height: g.Sc, pointerEvents: 'none' }}>
  <Image image={body} x={0} y={0} width={g.Sc} height={g.Sc} fit="fill" />
  <Image image={dish} x={dishX} y={dishY} width={g.dishSide} height={g.dishSide} fit="fill" />
</Canvas>
```
