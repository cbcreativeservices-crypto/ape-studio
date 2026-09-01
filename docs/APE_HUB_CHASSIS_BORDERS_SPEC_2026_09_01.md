# Hub Chassis Borders — Device-Scale Fix Spec (2026-09-01)

Owner finding on-device: tile borders read as moulded plastic, triple-lined, with fat inner corners
and invisible screws. Root causes are all in `src/screens/tools/TileChassis.tsx` +
`src/screens/tools/ToolsHubScreen.tsx`. Concept (recessed rack, wear seeds, power-on layers) is untouched.

## 1 · Diagnosis (element → finding)

1. **Plastic rim.** The outer chamfer is a stacked-rect ring: `Rect x=1 rx=12 fill=url(outer)` under
   `Rect x=3.2 rx=10.4 fill=url(face)` → a **2.2 logical px (≈7 device px @3x) exposed band**. The
   `outer` gradient (`#b9bcc2` @0 → `#71747a` @0.18) spans the whole tile height, so the entire top
   band sits in the bright zone — a uniform light-gray strip, not a catch-light. The extra
   `Line y=2.2 rgba(255,255,255,0.42) w=0.8` doubles it. Bright BAND = plastic; bright HAIRLINE = metal.
2. **Triple-line stack.** Around the display: inner-chamfer rect (dispX−2.6) + crevice rect (dispX−1.2)
   + glass `glassTopGlare` (1.5px white 0.30) — three parallel lines within ~4px. Bottom is worse:
   `glassBottomHighlight` (1.5px white 0.20) + lit bottom of `inner` gradient + crevice = three again.
   Between plate and display: plate bottom-highlight (y≈23.5) sits 2px above the chamfer top (y=25.4).
3. **Non-concentric radii.** Nested radius must = outer radius − inset. Actual: face rx 10.4 @ inset 3.2
   (should be 9.8); inner chamfer rx 7.2 / crevice rx 6 around a radius-5 well (should be 7.6 / 6.2);
   worst: `tileStrip` borderRadius **6** sits 4px inside `tileCap` radius **5** → correct inner radius
   is **1**. The strip's fat corners are the misalignment the owner sees.
4. **Invisible screws.** `Screw`: r 3.1 `#131416` on face `#4a4c52`, head `#1e1f22`, slots `#000`,
   one 0.8px 12%-alpha glint. Dark-on-dark with ~0.9px features — at 3x it downsamples to a noise dot.

## 2 · Corrected treatment (exact values)

### 2a. Machined edge — hairline catch, not band (TileChassis.tsx)
- Face rect: `x=2.2 y=2.2 w=w−4.4 h=H−4.4 rx=10.8` (ring narrows 2.2 → **1.2** logical px).
- `outer` gradient stops → `0: #d3d6dc`, `0.035: #7c7f85`, `0.45: #3b3d42`, `1: #101114`
  (catch-light confined to top ~1px of the ring; sides mid, bottom dark — one light source, top).
- Top glint line → `x1=14 x2=w−14 y=1.7 strokeWidth=0.6 stroke=url(#${u}glint)` with new horizontal def
  `glint`: `0: rgba(255,255,255,0)`, `0.5: rgba(255,255,255,0.55)`, `1: rgba(255,255,255,0)`
  (a glint fades at its ends; the current full-width constant line is the plastic tell).
- Add bottom inner shadow: `Line x1=10 y1=H−1.8 x2=w−10 y2=H−1.8 stroke=rgba(0,0,0,0.45) strokeWidth=0.8`.
- Keep seam (`rx 13 #000`) and the `wrap` side vignette unchanged.

### 2b. Border-stack — one lit line per edge survives
- **Survivors:** SVG crevice (dark AO) + inner chamfer's lit BOTTOM edge (correct recess physics) +
  glass top glare (thinned). **Dropped:** glass bottom highlight, plate bottom highlight.
- `glassTopGlare` (ToolsHubScreen) → `height: 1, backgroundColor: 'rgba(255,255,255,0.22)'`.
- `glassBottomHighlight` → DELETE the style and its `<View>` in `TileGlass` (a screen recessed below a
  top light source cannot rim-light its own bottom; the chamfer already tells that story).
- Nameplate: delete the bottom-highlight rect (`y=PLATE_Y+PLATE_H−1 … rgba(255,255,255,0.12)`); keep the
  1px 0.4-alpha top shadow. Engraving reads from shadow alone at this size.

### 2c. Concentric radii (outer @ inset → inner)
- Seam 13 @0 → chamfer **12** @1 (keep) → face **10.8** @2.2 (was 10.4 @3.2).
- Display well radius 5 base: inner chamfer rect → `rx=7.6` (@ −2.6), crevice → `rx=6.2` (@ −1.2),
  crevice top-shade rect → `rx=6.2` to match; `displayWell` 5, `tileCap` 5 (keep both).
- `tileStrip` borderRadius **6 → 1** (5 − 4 padding). This is the single highest-impact line.

### 2d. Screws — legible fasteners (TileChassis.tsx `Screw`)
Add one shared vertical def `${u}screw`: `0: #5a5d63`, `1: #26282c`. Then per screw:
- counterbore: `Circle r=3.6 fill=#0b0c0e`
- head: `Circle r=2.9 fill=url(#${u}screw)` + `stroke=rgba(0,0,0,0.5) strokeWidth=0.4`
- slots: `Rect x=cx−2.2 y=cy−0.5 w=4.4 h=1 rx=0.5 fill=#08090a` (+ rotated twin) — width 0.8 → **1.0**
- specular: `Circle cx−1.0 cy−1.1 r=0.7 fill=rgba(255,255,255,0.35)` (was 0.8/0.12)
Head mid-tone `#5a5d63→#26282c` now sits ABOVE face `#4a4c52` at top, below at bottom — a turned head.
`Screw` gains a `uid` prop (pass `u`) for the gradient id; positions/rotation jitter unchanged.

## 3 · Constraints honored
react-native-svg only, no filters/blur (linear gradients only), static paint-once SVG, `svgo: false`
untouched, strip artwork + sim/live minis + power-on `lit`/`bloom` layers + per-tile wear seeds all
unchanged. Grain/grit/scratch loops unchanged (they start at x/y 4 — still inside the new face inset).

## 4 · File-by-file edit list
**C:\Users\profe\dev\ape-studio\src\screens\tools\TileChassis.tsx**
1. `C.c0 → #d3d6dc`; retune `outer` stops per §2a; add `glint` + `screw` gradient defs.
2. Face rect inset 3.2 → 2.2, rx 10.4 → 10.8.
3. Replace top Line with gradient glint (§2a); add bottom inner-shadow Line.
4. Delete nameplate bottom-highlight rect.
5. Inner chamfer rx 7.2 → 7.6; crevice rx 6 → 6.2; crevice top-shade rx 4 → 6.2.
6. Rewrite `Screw` per §2d (takes `uid`).

**C:\Users\profe\dev\ape-studio\src\screens\tools\ToolsHubScreen.tsx**
1. `tileStrip.borderRadius: 6 → 1`.
2. `glassTopGlare`: height 1.5 → 1, alpha 0.30 → 0.22.
3. Delete `glassBottomHighlight` style + its `<View>` in `TileGlass`.
