# F16 Scientific Arrays and Specialized Sensors: SOURCES (technical reference)

Lesson: `source_text/F16-Scientific-Arrays-and-Specialized-Sensors-Miking-Technique.txt` (`cat -n` lines). Checked 2026-10-07.
Keys: `measurement_mics/SOURCES.md` §0.

| # | Line | Claim | Status |
|---|---|---|---|
| 1 | L5 | Array "hot spot" is a model estimate, not a photograph | PRACTICE (HBK not re-read; correct) |
| 2 | L6 | Two drifting recorders ≠ coherent array | PRACTICE / physics |
| 3 | L12–13 | Two-mic baseline: arrival order; front/back ambiguity | CONFIRMED (physics: a line array is symmetric about its axis — cone of confusion) |
| 4 | L21 | Uniform spacing ≤ λ/2 at the highest frequency avoids spatial aliasing | CONFIRMED (MW-ULA "spaced less than one-half the wavelength") |
| 5 | L24 | p–p intensity probe: two phase-matched mics + spacer; spacer sets the band; 90° incidence → ~zero axial component | CONFIRMED in substance (PROBE-SPACER: 12/25/50 mm spacers covering about 100 Hz–10 kHz; cos θ dependence is physics). HBK article 403 |
| 6 | L25 | ISO 9614-1 discrete points; -2, -3 scanning | NOT RE-READ (403); titles/dates in refs match known editions (1993, 1996, 2002) |
| 7 | L28 | Beamforming better at higher frequencies; holography for low/close | PRACTICE (HBK) |
| 8 | L36 | Underwater dB re 1 µPa vs air dB re 20 µPa; not directly comparable | CONFIRMED (DOSITS-AW). Enrichment: the references alone account for 26 dB, and equal intensities differ by 61.5 dB in total — the app must NOT teach "subtract 26 dB" |
| 9 | L44 | Sampling must exceed twice the highest frequency; anti-alias filter; transducer bandwidth | CONFIRMED (Nyquist; app Learn glossary 'nyquist') |
| 10 | L39 | Bat detectors; detection ≠ count (USGS NABat) | NOT RE-READ; PRACTICE |
| 11 | L42 | Never emit unverified ultrasound; inaudible ≠ harmless | PRACTICE, safety — keep |
| 12 | L26 | "unless … a qualified instructor are available"; "Students" | WRONG (wording) → "a qualified operator" |
| 13 | L102 | Cross-link "F10 water and hydrophone" | WRONG → F10 has no hydrophone content; point to this lesson's own hydrophone step and F04 |
| 14 | — | Array aperture, spacing, probe distance | UNKNOWN → drawing defaults; λ/2 rule DERIVED from the chosen top frequency with CALC-C |

Corrections: #12, #13; enrichment #8.
