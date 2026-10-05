# I08 Marimba: GEOMETRY PROPOSAL

Family, frame M, layout rule, resonator acoustics, envelopes and the Shure zones:
`vibraphone/GEOMETRY_PROPOSAL.md` §A. This file is the parameter row plus marimba zones.

| Param | Value | Class | Source |
|---|---|---|---|
| range | C2–C7 (keys 16–76); 61 bars = 36 naturals + 25 accidentals | SOURCED (count DERIVED) | ADAMS-ALPHA |
| wLow / wHigh | 72 / 40 | SOURCED | ADAMS-ALPHA |
| t | 25.4 (low) → 19.05 (high) | TRIAL (YM-5100A "3/4" – 1" thick") | YMH-YM5100A |
| Lframe / Dlow / Dhigh | 2550 / 1040 / 560 | SOURCED | ADAMS-ALPHA |
| hBars | 970 (inside "90 – 104 cm") | DRAWING DEFAULT | |
| LbarLow / LbarMin | 620 / 190 | 620 TRIAL (YMH-MG1 "around 620 mm"); 190 DRAWING DEFAULT | YMH-MG1 |
| naturals row | Σw = 36 × 56 = 2016, + 35 × 6 = 2226 < 2550 (fits) | DERIVED | |
| resonators | keys 16–21 (C2–F2): Helmholtz boxes (DRAWING DEFAULT 150 × 120 cross-section, depth to fit under hBars − 150); keys 22–76: tubes, Ø 70 → 45 (DRAWING DEFAULT), L_ac = c/4f (§A4); optional arch (YMH-MG2) as a visual variant with a "pipe length ≠ pitch" note | type SOURCED (YM-5100A "Helmholtz (C16 to F21)", ADAMS-ALPHA); sizes DRAWING DEFAULT | |
| 4.3-octave option | A2–C7, 67→40, 2130 × 900 / 560 (Alpha 4.3) | SOURCED | ADAMS-ALPHA |

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.mar.one` | one mic 600–1000 above the centre of the PLAYED span, aimed down | lesson TRIAL | lesson L11 |
| `zone.mar.shure.spaced` / `.xy` | §A6 (457.2 above; 609.6 apart, or coincident 135°) | SOURCED | S-LIVE, S-RECBK |
| `zone.mar.wide` | spaced pair widened for a 5-octave span (lesson L17 "60 cm may be too narrow"): spacing slider 609.6 → 1200, height 457.2 → 800 | lesson suggestion; range DRAWING DEFAULT | lesson |
| `zone.mar.under` | under the resonators (effect), clear of the frame and the bass boxes | lesson; position DRAWING DEFAULT | |

DERIVED check for the coverage readout: from a single mic 457.2 above the centre, the ends of a
2226-mm naturals row are at ±1113 → the half-angle to each end is atan(1113/457.2) = 67.7°; an
ideal cardioid aimed down is 0.5 + 0.5·cos 67.7° = 0.690 → −3.2 dB there (first-order pattern,
`SOURCES_SHARED.md` §3), and the end bars are also 1203 vs 457 away (−8.4 dB by inverse distance,
DERIVED 20·log(457.2/1203.3)) — together about −11.6 dB, which is why a pair is used. The readout
shows angle and distance, never a response curve.

Keep-outs: §A5 (mallet volume to hBars + 350; player; frame, cords, bar posts; wheels). Tests: 61
bars; L_ac(C2) = 1305.9 > hBars (so a straight C2 tube is impossible → Helmholtz box required).
Owner: hBars, Helmholtz box size, tube diameters, the bar-length model, wide-pair range.
