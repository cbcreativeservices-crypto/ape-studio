# C08 Electric Bass Amplifier: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/Electric-Bass-Amplifier-Miking-Technique.txt` (L<line>).
Rules and shared keys: `acoustic_guitar/SOURCES.md` §0. Speaker family: `speaker_leslie/SOURCES.md`
(AMP-410 = Ampeg SVT-410HLF spec sheet). Checked 2026-10-04 by Claude.

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| S-BASSREC | Shure, Marc (Shure UK), "Recording & Mixing Bass Guitar", dated "February 23, 2015" (lesson [2]) | https://www.shure.com/en-US/insights/recording-mixing-bass-guitar | 200, read |
| AMP-VEN | Ampeg, Venture Series heads page (lesson [1]) | https://ampeg.com/products/venture-bass-amplifiers/heads.html | 200 |
| AMP-FAQ | Ampeg FAQ (lesson [6]) | https://ampeg.com/faq/ | 200; the load statement was **not found** in the fetched text (may sit in a collapsed answer) |
| RAD-J48 | Radial J48 user guide, "J48-Manual-WEB-02-26" (lesson [5]) | https://www.radialeng.com/wp-content/uploads/2026/03/J48-Manual-WEB-02-26.pdf | 200, read |

## a. Placement

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Bass cabinet distance | "somewhere between 4 - 18 inches will usually work depending on preference" | S-BASSREC | 2026-10-04 | High | 101.6–457.2 mm (conv.). L9 "10–45 cm (4–18 in)" CONFIRMED (45.72 cm exact) |
| Cone trend (bass) | "positioning the mic toward the speaker cone edge will produce a warm tone while pointing it directly at the centre will give you more 'bite'" | S-BASSREC | 2026-10-04 | High | L9 CONFIRMED. Shure's bass article does **not** name the dust-cap/cone boundary; that start point is borrowed from Mills (guitar). Say so, or cite S-MILLS. |
| Distance → room | "As you move the mic further away from the grill, the tone changes from a very dry, focused… to a more natural and ambient sound" | S-BASSREC | 2026-10-04 | High | |
| Mic choice | frequency response and "how well the mic handles high sound pressure levels (SPL)"; "a specialised kick/bass dynamic mic up close alongside a condenser mic placed further away… check the phase relationships" | S-BASSREC | 2026-10-04 | High | L9/L37/L40 CONFIRMED |
| Pads | "Pads will typically allow you to attenuate the signal by 10 - 15dB." | S-BASSREC | 2026-10-04 | High | |
| General amp range | "Amplifiers 1-6 inches (2-15 cm)" | S-PGA27 | 2026-10-04 | High | L9 CONFIRMED |
| Mixed 10/15 cab | "For more low-end oomph, put a mic on the 15-inch speaker… try putting a mic on one of the 10-inchers or on the horn for more high-end definition" | S-RHYTHM | 2026-10-04 | High | L29 CONFIRMED (and correctly framed as "on some cabinets") |
| Live practice | "it's standard practice to send the bass direct through the P.A., in some circumstances an engineer will also mic the bass cabinet… Large-diaphragm dynamics are good choices." | S-RHYTHM | 2026-10-04 | High | L41 CONFIRMED |

## b. DI, amp, load

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Venture DI Pre/Post | "When set to Pre the DI signal bypasses the -15dB input pad, Compressor, tone controls, SGT circuit, and FX Loop. When set to Post it includes them." | AMP-VEN | 2026-10-04 | High | L6 CONFIRMED |
| Venture DI out | "balanced XLR output… line-level audio… It is not affected by the Volume control."; "-20dB: Reduces the DI output level by 20dB." | AMP-VEN | 2026-10-04 | High | |
| Venture heads | "solid-state preamps and Class D power amplifiers" | AMP-FAQ | 2026-10-04 | High | |
| Ampeg tube-output load rule | not found in fetched FAQ text | AMP-FAQ | 2026-10-04 | UNREACHABLE (content) | L44: re-check in a browser before keeping the wording |
| J48 phantom | "requires standard 48V phantom for powering" | RAD-J48 | 2026-10-04 | High | L36 CONFIRMED |
| J48 pad | "–15dB pad" | RAD-J48 | 2026-10-04 | High | |
| J48 low-cut | "Low-cut filter switch (-6dB down at 80Hz)"; "gently rolls off bass (-6db at 80Hz)" | RAD-J48 | 2026-10-04 | High | L38 "approximately 6 dB down at 80 Hz" CONFIRMED |
| Connect at zero | "…turned off or the volume levels are turned down to zero. This practice will reduce the probability of noise, such as a capacitor discharge…" | RAD-J48 | 2026-10-04 | High | L44 CONFIRMED |

## c. Pitch (PHYS-ET)

| Note | Frequency | Class | Notes |
|---|---|---|---|
| E1 (4-string open low) | 41.203 Hz | DERIVED 440·2^(−41/12) | L38 "about 41 Hz" CONFIRMED |
| B0 (5-string open low) | 30.868 Hz | DERIVED 440·2^(−46/12) | **missing** in the lesson (survey flag); J48 low-cut matters more |

## d. Cabinet (geometry; from the speaker module)

| Fact | Value | Source | Confidence |
|---|---|---|---|
| SVT-410HLF outer box | 762 × 609.6 × 482.6 mm | AMP-410 (speaker_leslie) | High |
| Drivers | four 10 in + horn | AMP-410 | High |
| Driver/horn layout | UNKNOWN → speaker-module drawing default (2×2 at ±170 z / ±150 y; horn between the top pair) | — | — |
| 10-in speaker sizes | UNKNOWN (no 10-in datasheet read) → drawing default: scale the CEL-V30 12-in by 10/12 | — | — |

## e. Hearing

OSHA 85 dBA (`acoustic_guitar/SOURCES.md` §c): L45 CONFIRMED.
