# REPORT — Dynamic microphone capsule cutaway (animated SVG asset, v1)

Companion to the loudspeaker master cutaway (same pipeline, same design language, same deliverable contract).
Built AFTER the speaker asset was finalised, per instruction.

## What was built
`dynamic_mic_capsule_cutaway.svg` (rest state, 134 ids, layered per the id contract) ·
`MOTION_dynamic_mic_capsule_cutaway.md` (drive model, attribute table, keyframes, references) ·
`preview_dynamic_mic_capsule_cutaway.html` (offline preview: period/excursion sliders, p/v/e/x bars, 3-trace scope
showing pressure, output, and 90°-lagging displacement, 8 layer toggles, 6 camera framings) · extras (snapshot SVG at
φ=90°, keyframes JSON nested+flat, hero PNG) · source generators.

## Research base
A dedicated research pass fetched and verified 16+ primary references before the first line was drawn: Wente & Thuras
1931 (BSTJ), Marshall & Romanow 1936 (WE 630A), Bauer's Unidyne patent US 2,237,298, Seeler's Unidyne III patents
US 3,132,713 / 3,240,883, Olson 1947 ch. VIII, Beranek 1954 §6.4, Eargle's Microphone Book, the SBE Standard Handbook
microphone chapter (RCA BK-16A data: 9 µm Mylar, 1 T gap — ⚠️ APE verification 2026-08-22: no "BK-16A" surfaces in any
web-accessible RCA archive (BK line: BK-1A dynamic, BK-5/10/11 ribbons); the chapter author Jon Sank was RCA's mic
engineer so the figures may be real book data, but re-check the model number against the printed chapter before citing
it in learner-facing copy — if it can't be confirmed, attribute the figures as "typical moving-coil values" or to the
Western Electric 618-A lineage instead), Altec's cross-section (0.5 mm gap, 0.15 mm clearances),
Shure history/SM58 documentation, Audio-Technica US 6,091,828 (Ø22.5 mm diaphragm, Ø14 mm 40 mg CCAW coil), DPA/
Neumann/SOS on cardioid & proximity, plus a "commonly drawn wrong in mic diagrams" checklist that drove the design.

## What it teaches (honestly)
Generator, not motor: p drives the diaphragm; the coil moves in the radial gap field; e = Bl·v — proportional to
velocity, not displacement. Resistance-controlled phase model drawn (v ∝ p, x lags 90°) with the mass-controlled
cardioid caveat declared. Rear ports + felt + phase-shift passages + two cavities shown structurally (the cardioid
network); humbucking coil outside the motor, series-opposing; polarity per convention (+p → +V on the red lug);
excursion labelled as exaggerated ~10³× (real: sub-µm to µm).

## Inline review pass (subagent capacity was exhausted; review run directly, same checklist)
Verified: flux path stays entirely in steel + gap (loop coordinates checked against every part's extents); Lenz-
consistent ⊗/⊙ (inward motion → ⊗ top, matching the speaker's verified convention); internal current B → coil → A when
e > 0 (current flows toward the + lug inside the source); dash chain geometrically continuous with per-element offsets
k_j = (k_{j−1}+L_{j−1}) mod 18; leads never cross flux runs or cut steel; coil covers the gap at ±3; wavefront arrival
phase = pressure peak at the diaphragm; loop seam clean; no console errors.
Fixed from this pass: bottom label row collisions (re-flowed to two rows, ≥3-unit clearance verified programmatically);
flux return crossing the rear-port hole (far-half wall now visible behind the felt — section-through-a-port convention,
stated in the spec); static front-cavity rect poking past the diaphragm at −X (shrunk behind the roll); hum-coil wire
start touching the lug corner; spec note added that the current overlay assumes a connected load.

## Known limitations / decisions for Brenda
1. Gap, wire gauge and clearances are stretched for legibility (real: 0.5 mm gap, 0.15 mm clearance, 30 µm wire) — as
   with the speaker, stated in the spec; radial proportions of a Ø22 mm vocal capsule are otherwise honest.
2. The cardioid network is shown structurally with a static rear-path overlay; the pressure-gradient dynamics
   themselves (rear-arrival delay) are not animated. Could be a follow-up state.
3. The pneumatic shock mount and output transformer are outside the capsule scope and omitted (stated).
4. One review pass was run (inline) rather than three independent panels — the speaker's nine reviews already hardened
   the shared pipeline (keyframe contract, dash math, hatch/light/label conventions), which this asset inherits.
