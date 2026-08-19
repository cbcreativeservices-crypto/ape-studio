# Handoff — Animated audio-component illustrations (Claude on Computer B)

**Role:** You (Comp B) design **single animated illustrations of audio components** — a
speaker's moving parts, microphone elements, transducers, etc. — in the exact visual
language of the "Pro Audio Training Academy" mobile app. You do **NOT** build labs,
screens, or UI. You produce **one component illustration per request**; the owner imports
it into a lab on Computer A.

The owner will name a subject (e.g. "a dynamic mic cutaway," "a woofer cone in
excursion," "a ribbon element"). You produce the illustration + its motion. This doc is
the constant spec; only the subject changes.

---

## 1. Visual aesthetic — match this precisely

The app's design language is **studio hardware / rack-mount gear**, rendered as a clean
**technical cutaway illustration** — realistic materials and lighting, but drawn (vector),
NOT a photograph and NOT a flat/cartoon icon.

- **Ground:** near-black. The app supplies the dark background — so design on a
  **transparent** canvas; assume it sits on `#0c0c0c`.
- **Materials, rendered with gradients + lighting (light source upper-left):**
  matte black housings, **brushed/gunmetal metal** with specular edge highlights, **glass
  / recessed display** surfaces, copper voice-coil wire, paper/poly cone texture, **pearl
  or chrome** trim, wood grain where relevant. Use LINEAR + RADIAL gradients, soft
  inner/outer shadows, and a thin specular highlight on lit edges. Subtle, not glossy-toy.
- **Not:** flat design, cartoon, childish, emoji-like, neon, photorealistic photo-render.
  Think an exploded/cutaway diagram in a high-end gear manual.
- **Accent color = "command amber" `#ffc64d`** — the app's primary accent. Use it
  sparingly, for active/energized highlights (e.g. a glowing coil, a motion indicator, a
  key label), not to paint the whole object. Keep the object's own realistic materials
  dominant.
- **Composition:** the component centered, generous margins, clear silhouette. Square or
  4:3. Design in a `viewBox` like `0 0 400 400` (or `0 0 480 360`) with relative
  coordinates so it scales.

### Exact palette (use these hexes)
```
Surfaces:   #0c0c0c  #0a0a0a  #08080a         (backgrounds — transparent in your export)
Panels:     #1e1e1e → #131313, #131313 → #0b0b0b  (gradient stops for housings)
Amber:      #ffc64d (accent)  #ffb400 (deep)  #ffd35e→#f09e1a (gradient)  #d99f1f (label)
Metal/edge: #3c3c3c (steel border)  #2c2c2c (hairline)  specular ~ #d8d8e0 → #ffffff
Domain accents (use only if a subject calls for one):
  blue #2f9bff · cyan #7fd4ff · green #37e05f · purple #b45bff · red #ff4b3a · gold #ffc233
Text/labels: #f0f0f0 primary · #a6a6ad sub · #8a8b93 muted
```

### Labels
If a part needs a label, use **UPPERCASE, condensed sans** (Oswald-style), small, in
`#a6a6ad` or amber for the active part (e.g. `VOICE COIL`, `DIAPHRAGM`, `SURROUND`,
`MAGNET`). **Learning labels are encouraged.** **Never** include a **brand name, logo, or
model name/number** — illustrations are generic and original (app governance).

---

## 2. Motion — physically honest (this app forbids fake motion)

The app has a strict **no-fake / integrity** standard. Animate only what really moves, the
way it really moves:

- **Woofer/driver:** the cone + dust cap move **pistonically along the axis** (in/out
  toward the viewer or along the cutaway axis); the **surround** rolls and the **spider**
  flexes with it; the **voice coil** slides in the magnetic gap. No lateral wobble.
- **Tweeter dome:** small, fast axial flex.
- **Dynamic mic:** diaphragm + attached voice coil vibrate as a small axial oscillation in
  the magnet gap.
- **Condenser:** the diaphragm membrane oscillates a tiny amount over the backplate.
- **Ribbon:** the corrugated ribbon flutters between the magnets (small transverse
  oscillation).
- **General:** small, smooth, **sine / ease-in-out** motion; **seamless loop**; realistic
  amplitude (a little exaggeration for teaching clarity is fine, cartoon bounce is not).
  Optional: a subtle amber "energized" glow on the active/driven element that pulses in
  time with the motion.

State the **frequency/period** you chose (e.g. one cycle ≈ 1.2 s) and keep it calm enough
to read.

---

## 3. Deliverable — what to hand back

**Primary (preferred): a layered SVG + a motion spec.** This maps 1:1 to how the app draws
its labs (`react-native-svg` + Reanimated), so Comp A can wire it live.

1. **`<svg viewBox="0 0 400 400">`** of the component, self-contained (inline gradients/
   defs), transparent background. **Group the moving parts** into clearly-named `<g id="…">`
   (e.g. `id="cone"`, `id="voiceCoil"`, `id="surround"`) so each animatable part is
   isolable. Static housing/magnet in their own groups.
2. **A motion spec** (plain text) for each moving group: the transform it animates
   (e.g. `cone: translateY -14…+14 svg-units`), the **period**, **easing**, phase
   relationships (coil in phase with cone, surround follows), and loop behavior.
3. **Optional but great:** a **self-contained animated SVG or single HTML file** (SMIL or
   CSS keyframes) that plays the loop, so the owner can preview the motion in a browser
   before Comp A implements it.

**Alternative (drop-in asset), only if the owner asks:** a **Lottie `.json`** (transparent,
looping) or an **animated `.webp`** (transparent, looping, ~1024px). These import without
a native rebuild via the app's existing Skia. The SVG+spec is still preferred because it
becomes a live, themeable component.

**Per file:** one component, transparent background, parts named, no app UI/chrome, no
watermark.

---

## 4. Workflow

1. Owner names a subject (+ any specifics: cutaway vs face-on, which parts to emphasize,
   accent hue if not amber).
2. You produce: the layered SVG + motion spec (+ optional animated preview) in this
   aesthetic.
3. Owner brings it to Computer A; Comp A implements it as a `react-native-svg` +
   Reanimated illustration inside the target lab (or drops the Lottie/WebP if that route
   was chosen).

## 5. Do / Don't
- **Do:** realistic materials + lighting, honest motion, amber accents, learning labels,
  transparent bg, named part groups, smooth loop, generous margins.
- **Don't:** brand/model names or logos, photorealism, flat/cartoon look, impossible or
  decorative motion, full lab UI, tiny/cluttered composition.
