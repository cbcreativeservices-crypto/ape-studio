# F07 Wildlife and Distant Sources: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/F07-Wildlife-and-Distant-Sources-Miking-Technique.txt` (`cat -n` lines).
Checked 2026-10-07 (Claude, preparation pass). Keys and rules: `foley_footsteps/SOURCES.md` §0; field family:
`field_ambience/`. F07 defines the shared **parabolic dish** model (also Lab 7 B12).

## a. Facts read today

| Fact | Value (exact) | Source | Confidence |
|---|---|---|---|
| Dish and wavelength | "If the wavelength of a sound wave is greater than the diameter of the parabola, the sound wave will not be captured or amplified."; "Does not amplify very low frequency sounds at all"; "Higher frequency sounds, with shorter wavelengths, are amplified more than lower frequency sounds." | CORNELL-MIC | High |
| Typical dish size | Telinga and Wildtronics reflectors "57 cm (22 inches) in diameter" | CORNELL-MIC | High |
| Aim | "it is extremely important that a parabola is aimed precisely at the target sound source"; "Proper aim can be difficult with moving subjects" | CORNELL-MIC | High |
| Shotgun | "Off-axis mid and high frequency sounds will be altered due to the shotgun's phase reactive property"; shotguns "especially useful for recording groups of birds, birds in flight, and other actively moving birds" | CORNELL-MIC | High |
| Dish set A | diameter "585 mm (22 inches)"; focal distance "210 mm (8.3 inches)"; "All CCM microphones are mounted with their 0° direction pointing towards the dish"; omni, wide-cardioid or cardioid capsule; "100 Hz - 20 kHz (recommended transmission range of the parabolic system)" with a correcting EQ plug-in "producing a flat frequency response between 100 Hz and 20 kHz"; 874 g | SCH-DISH | High |
| Dish set B | "Diameter: 500mm"; "Focal Length: 140mm"; capsule "mounted, pointing back towards the dish, with the sensor at the focal point (marked with a coloured band)"; profile "y=x²/4" (focal-length form, units unstated) | INNERCORE | High |
| Dish gain formula | "Gain dB = 20LOG(3.25DE/W) Where: D = diameter inches, W = wavelength inches, E = efficiency (0 to 1)" | LS-DISH | Medium (practitioner; no derivation; ≈ 20·log10(π·D/λ) for E = 1) |
| Foam vs open habitat | foam "adequate … interior of a forest, but is insufficient for recording in grasslands and other windy open habitats" | CORNELL-ACC | High |
| Wildlife | NPS-WILD 25 yd / 100 yd, "If animals react to your presence you are too close", no calls or attractants | NPS-WILD | High |
| Lightning | NWS-LTG ("Substantial buildings and hard-topped vehicles are safe options") | NWS-LTG | High |

DERIVED (CALC-C c = 343.21 m/s): λ = D at f = c/D → 585 mm dish ≈ 587 Hz; 570 mm ≈ 602 Hz; 500 mm ≈ 686 Hz.
LS-DISH formula, E = 1, D = 22 in: 1 kHz (λ = 13.51 in) → 20·log10(3.25·22/13.51) ≈ 14.5 dB; 4 kHz → ≈ 26.5 dB
(Medium; theoretical on-axis maximum, real dishes lower).

## b. Lesson claims checked

| Claim (line) | Verdict | Evidence / correction |
|---|---|---|
| L5 species ID confirmed / provisional / unknown [1, 3] | PRACTICE (good) | Keep. |
| L6 NPS: site-specific distances, quiet, no recorded calls or attractants [3] | **CONFIRMED + numbers** | NPS-WILD (F07-C2). |
| L13 shotgun reduces off-axis especially at HF; no acoustic amplification; off-axis colored [1] | **CONFIRMED** | CORNELL-MIC; SCH-SHOTGUN. |
| L15–L16 capsule at the focal point, maker's orientation; concentrates mid/high; LF reaches the capsule directly but is not amplified [1, 2] | **CONFIRMED** | CORNELL-MIC, SCH-DISH. |
| L24 dish gain is acoustic concentration, not preamp gain | **CONFIRMED** (physics; CORNELL-MIC "captured or amplified" by the reflector) | — |
| L24 "Cornell explains that a dish emphasizes shorter wavelengths and does not amplify very low frequencies" [1] | **CONFIRMED**; Cornell also states the λ > D rule, which the lesson omits | **F07-C3**: teach the dependence the plan asks for (λ vs diameter), in words + the derived threshold for the drawn dish. |
| L24 SCHOEPS: most directional at mid/high; needs tonal correction [2] | **CONFIRMED** (100 Hz–20 kHz with EQ) | — |
| L24 "avoid a universal cutoff or range claim" | CONSISTENT | The threshold is PER DISH (c/D), not universal — the app computes it from the drawn diameter. |
| L25 long tube more selective; can pick up a source in its beam [1] | **CONFIRMED (qualitative)** | DPA-TUBE "Increased interference tube length will result in increased attenuation at lower frequencies". |
| L27 Innercore capsule aimed back toward the dish at a marked focus; SCHOEPS system-specific orientation [2, 7] | **CONFIRMED** | INNERCORE, SCH-DISH (both: capsule faces the dish). |
| L28 sweep with headphones; shotgun better for fast movement [1] | **CONFIRMED** | CORNELL-MIC. |
| L29 stereo-parabolic products: focused + ambience paths [8] | NOT RE-READ (TELINGA) | Card only. |
| L31 foam in a forest vs open grassland [2, 4] | **CONFIRMED** | CORNELL-ACC. |
| L31 "The dish surface itself may rustle or catch gusts" [2, 4] | **UNSOURCED** in [2] and [4] as read | PRACTICE (plausible); keep as "a dish is a large surface in the wind" without a citation (F07-C4). |
| L35 NPS structured monitoring with weather [5, 6] | **CONFIRMED** (NPS-RM47) | CORNELL-DATA not re-read. |
| L37 back away if an animal responds; no nests, lures, call playback [3] | **CONFIRMED** | NPS-WILD. |
| L38 lightning: substantial building or hard-topped vehicle [10] | **CONFIRMED** | NWS-LTG. |

## c. Corrections (builder logs each)
- **F07-C1** Institutional wording: header; "Students learn" (L3); "Guided teaching exercise"; "Student field sheet";
  "The lesson asks students" (L74).
- **F07-C2** Add the NPS example distances (US parks; local rules first).
- **F07-C3** Add the dish–wavelength relation (Cornell's λ > D rule; a 57 cm dish gives little help below roughly
  600 Hz) — the plan's "contradictions requiring scrutiny" item; LS-DISH formula internal only (owner O-9 whether a
  gain curve is drawn).
- **F07-C4** L31 dish-rustle line: no citation in the source pair; keep as practice.

## d. Disagreements
- **D-DISH-LF**: Cornell "not captured or amplified" below λ = D vs SCHOEPS "100 Hz – 20 kHz" recommended range.
  Consistent once read carefully: below c/D the capsule still hears sound DIRECTLY (no dish gain), and SCHOEPS EQs
  its system flat. The app shows "little help from the dish below about N Hz" for the drawn dish; never "no sound".
- **D-DISH-GEOM**: two makers, two geometries (585/210 vs 500/140, focal ratio 0.36 vs 0.28). The drawn dish is a
  generic 570 mm (Cornell's typical) with focus at 0.36·D (SCH-DISH ratio) → 205 mm (DERIVED; drawing default).
