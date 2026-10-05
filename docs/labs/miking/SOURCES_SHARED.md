# Miking Labs: SHARED SOURCES (physics every lesson uses)

Charter: `docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md` §3 (one row per fact cluster, date
checked, who checked). Lesson-specific facts live in each lesson's folder
(`kick/SOURCES.md` for M01). The engine code that uses each row is named in the row.

Checked 2026-10-04 by Claude (builder run, engine step 0). "Re-checked online" means the
page was fetched on that date and the quoted words were read. "From standard texts, not
re-checked" means the value is the textbook value and was NOT confirmed against a page on
that date.

Source keys (used by `src/screens/lab/miking/data/sources.ts` and by `model.ts` `src` fields):

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| CALC-C | AP&E calculator constant `speedOfSoundAir` (src/screens/lab/calc/calcUnits.ts) | (in the repo) | read in the repo |
| WP-SOUND | Wikipedia, "Speed of sound" (dry-air approximation) | https://en.wikipedia.org/wiki/Speed_of_sound | re-checked online |
| WP-COMB | Wikipedia, "Comb filter" (feedforward form) | https://en.wikipedia.org/wiki/Comb_filter | re-checked online |
| WP-MIC | Wikipedia, "Microphone", polar patterns section | https://en.wikipedia.org/wiki/Microphone | re-checked online |
| S-LIVE | Shure, Microphone Techniques for Live Sound Reinforcement (lesson ref [11]) | see `kick/SOURCES.md` | read 2026-10-04 in the kick pass |
| S-B52-UG | Shure, BETA52A User Guide 3.1 (2023-I) | see `kick/SOURCES.md` | read 2026-10-04 in the kick pass |
| DPA-31 | DPA Microphones, "3:1 rule" (lesson ref [12a]) | https://www.dpamicrophones.com/dictionary/0-9/31-rule/ | URL resolves (kick pass); content not re-audited |
| DPA-PPD | DPA Microphones, "Polarity, phase and delay" (lesson ref [6]) | https://www.dpamicrophones.com/mic-university/technology/polarity-phase-and-delay/ | URL resolves (kick pass); content not re-audited |
| MATH | Derivation from the stated formula (shown in the row) | — | derived; checked by test |
| S-SM57-UG | Shure, SM57 User Guide 3.6 (2025-A): the instrument-dynamic outline (157 mm long, 32 mm grille, 23 mm tail; "Cardioid") used by the generic `instDynCard` type | see `snare/SOURCES.md` | read 2026-10-04 in the snare pass; added here 2026-10-05 (mic family, speaker / Leslie module) |
| AX-SCX1 | Audix SCX1 pencil condenser length "104 mm / 4.1 in" (the generic `sdcCard` type's length; Ø 21 mm is a drawing default) | as quoted in `overheads/GEOMETRY_PROPOSAL.md` §(mic family) | quoted in the research pass; the sheet itself not re-read 2026-10-05 — re-verify |
| DPA-MOUNT | DPA, "How to mount the 4099 instrument microphone on various instruments": the guitar clip's fit ("body depth between 35 mm (1.4 in) and 122 mm (4.8 in)") for the generic `clipCond` type, and the bowed strings' clips (the `strMini` type) | see `acoustic_guitar/SOURCES.md` §0 | read 2026-10-04 in the Lab 4 pass; added here for the guitar family's mic type |
| DPA-UKE | DPA, "How to mic the ukulele": "The miniature supercardioid 4099 CORE+ Instrument Microphone" (the `clipCond` type's pattern) | see `ukulele/SOURCES.md` | read 2026-10-04 in the Lab 4 pass |
| DPA-VLA | DPA, "How to mic a viola" — the compact-cardioid and supercardioid-miniature facts behind the Lab 4 string mic family | see `violin/SOURCES.md` §0 | read 2026-10-04 in the Lab 4 research pass |
| DPA-HARP | DPA, "How to mic a harp": the generic `miniOmni` type (an omnidirectional miniature at a harp's sound hole; its size is a drawing default) | see `harp/SOURCES.md` | read 2026-10-04 in the Lab 4 research pass; added here 2026-10-05 (Lab 4 mic family) |
| PHYS-STRING | The ideal flexible string fixed at both ends: shapes sin(nπx/L), pitch ratios n, n − 1 still points; a stiff real string's upper shapes run sharp (standard string physics, Fletcher & Rossing, *The Physics of Musical Instruments*; from standard texts, not re-checked online) | — | engine `physics/stringModes.ts`, test `mikingLab4Keys.test.ts` (Lab 4, 2026-10-05) |

---

## 1. Speed of sound (engine: `physics/twoMic.ts` `C20`)

| Fact | Value | Source | Checked | Notes |
|---|---|---|---|---|
| Model used | c = 331.3 · √(1 + T/273.15) m/s, T in °C | CALC-C (`speedOfSoundAir`) | 2026-10-04, in repo | The lab CALLS the calculator's function and never copies the constant (charter §4). |
| Literature form | "c air ≈ 331.32 m/s × √(1 + θ/273.15)" | WP-SOUND | 2026-10-04, re-checked online | The calculator's 331.3 differs from 331.32 by 0.006 %. Not material at the lab's ≈ 5 mm display precision; logged, not changed (calculators are the source of truth). |
| Value at 20 °C | 343.2 m/s (calculator, 331.3·√(1+20/273.15) = 343.21) | CALC-C; WP-SOUND gives "about 343 m/s" | 2026-10-04 | The lab is fixed at 20 °C and says so on the panel. |
| Δt for 1 m path difference at 20 °C | 1 / 343.21 s = 2.914 ms | MATH | test `mikingPhysics.test.ts` | |

## 2. Comb filter from two arrivals (engine: `physics/twoMic.ts`)

| Fact | Value | Source | Checked | Notes |
|---|---|---|---|---|
| Two copies, one delayed by Δt, summed | H(f) = (gA + s·gB·e^(−j2πfΔt)) / (gA + gB), s = +1 or −1 | WP-COMB (feedforward form, "|H| = √[(1+α²)+2α cos(ωK)]") | 2026-10-04, re-checked online | The lab writes it in continuous time with α = s·gB/gA. |
| Nulls, same polarity (s = +1) | f_n = (2n − 1) / (2·Δt), n = 1, 2, … | WP-COMB: "the first minimum occurs at half the delay period and repeats at odd multiples" | 2026-10-04, re-checked online | |
| Nulls, inverted polarity (s = −1) | f_n = n / Δt, n = 0, 1, 2, … (n = 0 is the low-frequency loss) | WP-COMB: "the first minimum occurs at DC and repeats at even multiples" | 2026-10-04, re-checked online | This is the lab's "polarity flips the sign; it does not remove the delay" demonstration. |
| Null depth | 20·log10(|gA − gB| / (gA + gB)); equal gains → a true null (drawn at the −40 dB display floor) | MATH | test | |
| Parity with the calculator | for path = spacing·sin θ, the first null equals STEREOMIC "FIRST MONO COMB NULL" c/(2·path) | CALC (micsRf.ts `pathDelay`) | test `mikingPhysics.test.ts` | |

## 3. First-order polar patterns (engine: `physics/polar.ts`)

g(θ) = A + B·cos θ, A + B = 1, θ = the 3-D angle between the mic's front axis and the arrival
direction. Random-energy efficiency REE = A² + B²/3; directivity index DI = −10·log10(REE).

| Pattern | A | B | Null | Source | Checked |
|---|---|---|---|---|---|
| Omni | 1 | 0 | none | WP-MIC (pressure element) | re-checked online |
| Cardioid | 0.5 | 0.5 | 180° | WP-MIC ("a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)"); S-LIVE ("least sensitive at the rear (180 degrees off-axis)") | re-checked online / kick pass |
| Supercardioid (the lab's IDEAL model) | (√3 − 1)/2 ≈ 0.3660 | (3 − √3)/2 ≈ 0.6340 | arccos(−A/B) = 125.26° | MATH: the A that maximises the front-hemisphere / rear-hemisphere energy ratio of A + B·cos θ. From standard texts (Eargle, *The Microphone Book*), **not re-checked online**. | derived; test |
| Supercardioid, other published figures | — | — | WP-MIC: "approximately a 5:3 ratio … nulls at 126.9°"; S-LIVE: 126° (and 125° in its body text); S-B52-UG: "greatest sound rejection at points 120° toward the rear" | re-checked online / kick pass | Disagreement **D-SC** below. |
| Hypercardioid | 0.25 | 0.75 | 109.47° | WP-MIC: "3:1 ratio … nulls at 109.5°" | re-checked online |
| Figure-8 | 0 | 1 | 90° | WP-MIC | re-checked online |

Derived values (MATH, pinned by `mikingPhysics.test.ts`): cardioid REE 1/3, DI 4.77 dB;
supercardioid REE 0.2680, DI 5.72 dB, rear (180°) −11.44 dB; hypercardioid REE 0.25,
DI 6.02 dB, rear −6.02 dB; figure-8 REE 1/3, DI 4.77 dB.

**D-SC (supercardioid definition).** "Supercardioid" names a family member, not one exact
mix. The lab draws ONE ideal shape (max front-to-back, 125.26°) labelled **IDEAL**, says
"≈ 125°" in words, and quotes the maker's own figure (Beta 52A guide: 120°) wherever that
mic is named (ruling §16.13 D2 in ENGINE_BLUEPRINT.md). The 2 older app copies (micspeaker
0.37/0.63, micselect 0.366/0.634) are left alone (blueprint R10).

## 4. Level with distance and the 3:1 guideline (engine: `physics/levels.ts`)

| Fact | Value | Source | Checked | Notes |
|---|---|---|---|---|
| Point source, free field | level at rB relative to rA = 20·log10(rA / rB); doubling the distance = −6.02 dB (sign corrected 2026-10-04, audio review m9) | MATH (inverse-distance law, from standard texts, not re-checked online) | test | Labelled "ideal point source, far field". A mic 5 cm from a 56 cm head is in the near field, where this does not hold; page 5 says so (notch depths illustrative only). |
| 3:1 guideline | mic-to-mic distance ≥ 3 × each mic's distance to its own source; −20·log10(3) = −9.54 dB | DPA-31 / lesson ref [12]; MATH for the dB | content not re-audited | The lesson's limit is kept verbatim: it "does not guarantee phase coherence for an inside/outside pair". The calculator's stronger sentence is logged in CORRECTIONS_LOG.md (C-CALC-1). |

## 5. Simplifications register (shared)

- Point sources and straight-line paths in free field. Heads, shell, port diffraction and
  the room are not modelled (said on the two-mic panel).
- Ideal first-order patterns, frequency-independent. Real kick mics' patterns change with
  frequency (the panel says "ideal model").
- One temperature (20 °C).
- Distances displayed to ≈ 5 mm and angles to ≈ 5° (ruling §16.11); the acoustic centre is not
  the grille front (lesson L39), so no millimetre claim is made.

## 6. The hand-drum mic family (M04a Congas, M04b Bongos, M04c Timbales, M05 Djembe)

Engine: `lessons/shared/handdrums/handMics.ts` (registered beside the kick's types in
`data/micTypes.ts`). Generic types; the products below are the internal record only (owner
ruling 2026-10-04). Checked 2026-10-04 by Claude (hand-drum builder run). Rows that repeat a
lesson folder's key say where the full row lives.

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| S-SM57-UG | Shure, SM57 User Guide 3.6 (2025-A): "157 mm (6 3/16 in.)" overall, "32 mm (1 1/4 in.)" grille, "Cardioid" | see `snare/SOURCES.md` | read in the snare pass |
| AX-D2 | Audix D2 sheet: hypercardioid; "100 mm in length", "39 mm in diameter at the widest point"; applications "Rack tom, floor tom congas" | see `toms/SOURCES.md` | read in the toms pass |
| AX-D4 | Audix D4 sheet: the same body as the D2; applications include "djembe" | see `toms/SOURCES.md` | read in the toms pass |
| AX-SCX1 | Audix SCX1 length "104 mm / 4.1 in" (pencil condenser drawing default, Ø 21 mm a drawing default) | see `overheads/GEOMETRY_PROPOSAL.md` | read in the overheads pass |
| MKT-4099 | Markertek retailer listing, DPA 4099 CORE+ (4099-DP-1): "Directional Pattern: Supercardioid"; "Microphone Length: 1.97" (50mm)"; "Gooseneck Length: 5.5" (140mm)"; "145dB SPL peak"; "With DAD9001 or DAD9099: P48 (Phantom Power)"; "Microphone Diameter: 0.22" (5.7mm)" — taken to be the gooseneck, so the capsule's diameter is UNKNOWN (drawing default Ø 18 mm) | https://www.markertek.com/product/dpa-4099-dp-1/dpa-4099-core-ip58-supercardioid-instrument-microphone-loud-spl-6-mv-pa-sensitivity | 200, read 2026-10-04 (DPA's own product page lists no dimensions; the McGill copy of the user manual is 404) |
| DPA-JB | DPA, Jonas Brothers touring case: "4099s on high and low congas, the bongos, two toms and two timbales" | see `congas/SOURCES.md` | 200 |
| S-DUVEL | Shure, "Miking World Instruments with Alexander Duvel" (KSM137 pencil condensers on djembe and tabla) | see `djembe/SOURCES.md` | 200, re-read 2026-10-04 |

Simplifications: the compact dynamics are drawn with the kick dynamic's generic shape at their
own sourced length and front diameter; the clip-on condenser's gooseneck is drawn as a straight
run from its clamp at the nearest rim, and its reach (140 mm) is enforced — a clip mic cannot
sit farther from a rim than its gooseneck allows.
## 7. Mic types shared by Lab 1’s concert lessons (M06–M08, `data/micTypesConcert.ts`)

Added 2026-10-05 by the M06–M08 builder (branch miking-w4). Keys already read in other
lessons' passes are listed here so the shared mic types resolve from one table.
At the merge into final-lab the small cardioid dynamic (`orchDyn`) was the same type as the
snare's `smallDynCard` (same S-SM57-UG body and pattern), so M06–M08 now use `smallDynCard`.

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| S-SM57-UG | Shure, SM57 User Guide 3.6 (2025-A): "Dynamic (moving coil)"; "Cardioid"; 157 mm overall, 32 mm grille | see `snare/SOURCES.md` | read in the snare pass (2026-10-04) |
| AX-DPE8 | Audix DP Elite 8 sheet (archived): SCX1 length "104 mm / 4.1 in" (the pencil condenser's drawn length; Ø 21 mm is a drawing default) | see `snare/SOURCES.md`, `overheads/GEOMETRY_PROPOSAL.md` §5 | archived copy read (2026-10-04) |
| LESSON-TIMP | The owner's timpani lesson, L35: "A cardioid condenser is well documented for spots in both small orchestras and amplified shows." | `source_text/Timpani-Miking-Technique-Research.txt` | the lesson's own words |

## 8. Mic types for Lab 3's saxophones (A05a–d, `lessons/shared/sax/saxMics.ts`)

Added 2026-10-05 by the saxophone builder (branch miking-a3). The full family register is
`alto_sax/SOURCES.md` §0; these are the keys the shared mic types name.

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| S-SAX | Shure, D. Rochman, "Choosing a Saxophone Microphone for Recording and Live Sound" (engineers name condensers for detail, dynamics for close live work, ribbons for a rounded top) | https://www.shure.com/en-EU/insights/choosing-a-saxophone-microphone | 200, read (Batch 3) |
| S-POLAR | Shure, "Microphone Directionality and Polar Pattern Basics": "the supercardioid is least sensitive at 125 degrees and the hypercardioid at 110 degrees" | https://www.shure.com/en-US/insights/microphone-directionality-polar-pattern-basics | 200, read (Batch 3, `trumpet/SOURCES.md` §0.1) |