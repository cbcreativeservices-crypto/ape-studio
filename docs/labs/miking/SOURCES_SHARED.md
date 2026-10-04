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
