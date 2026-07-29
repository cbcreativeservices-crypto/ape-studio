# AP&E Lab Visual Standards — Owner Ruling 2026-07-29

**Status: STANDING RULE.** Applies to every lab visual and animation from this
date forward, and retroactively to existing labs (retrofit pass).

## The ruling (owner, verbatim intent)

Lab graphics had drifted to a clunky, boxy, early-1980s look — boxes, lines,
and circles standing in for real objects (a circle for a head, a box for a
speaker, a line for a mic). That is far below the standard this product
delivers. **When an animation can draw the item itself — a microphone, a
loudspeaker, a human head — it must never be represented by an ambiguous
primitive.** Animation must be beautiful, not just functional.

## Rules

1. **No primitive stand-ins for real objects.** If the thing on screen is a
   physical object (microphone, speaker cabinet, head, hand, ear, tube, guitar,
   stand, stage), draw a recognizable illustration of that object. Bare
   rect/circle/line proxies are prohibited for objects.
2. **Abstract data may stay abstract.** Graphs, curves, meters, waveforms,
   spectra, coverage maps and field lines are genuinely abstract — clean
   geometric drawing is correct there. But style them: soft glows, gradient
   fills under curves, anti-aliased weight hierarchy — not hairline-on-black.
3. **Illustration technique floor (Skia):**
   - Layered vector shapes with rounded, organic silhouettes (Path curves, not
     rect stacks).
   - Linear/radial **gradients** for form (metal sheen, glass, skin, cones),
     never single flat fills for a 3D object.
   - Soft shadows / rim highlights to lift objects off the background.
   - Glow via layered translucent strokes or blurred fills (filament glow,
     LEDs, hot zones).
   - A consistent scene: subtle background depth (floor line, vignette),
     consistent light direction (upper-left), consistent palette (existing
     lab tokens: amber #ffc64d accents, blue #6fa8ff energy/electrons, green
     #5bff85 good, red #ff6b5e problem).
4. **Beautiful motion.** Ease in/out (no linear teleports), secondary motion
   where natural (ripples, settle, breathing glow), continuous phase clocks
   (usePhaseClock) so parameter changes never snap or strobe.
5. **Honesty rules unchanged (§1.7).** Prettier never means fake: badges
   (ILLUSTRATIVE MODEL), disclosed simplifications, and no implied measurement
   precision all stay exactly as they are.
6. **Performance discipline stays.** Static geometry in useMemo; per-frame
   work in worklet-safe useDerivedValue; keep node counts sane on mid phones.

## Retrofit status

- 2026-07-29: mic/speaker lab (`src/screens/lab/micspeaker/viz.tsx`) and tube
  lab (`src/screens/lab/tube/viz.tsx`) upgraded first (the labs the ruling
  cited). Remaining older labs (foundations viz, fxViz heroes, harmonograph,
  bass fretboard, etc.) upgrade opportunistically as they are touched — or in
  a dedicated pass when the owner schedules one.
