# I10 Glockenspiel: GEOMETRY PROPOSAL

Family: `vibraphone/GEOMETRY_PROPOSAL.md` §A. Parameter row (default YG-2500 per its manual):

| Param | Value | Class | Source |
|---|---|---|---|
| range | C5–E8 (keys 52–92); 41 bars = 24 naturals + 17 accidentals | SOURCED (count DERIVED) | YMH-YG2500(-OM) |
| wLow = wHigh | 32.5 (manual) | SOURCED (GLK-D4) | YMH-YG2500-OM |
| t | 9 | SOURCED | YMH-YG2500-OM |
| footprint | 1062 × 564 (manual) — rectangle | SOURCED | YMH-YG2500-OM |
| hBars | 950 (inside 85–105 cm) | DRAWING DEFAULT | |
| LbarLow / LbarMin | 0.4 × 564 = 225.6 / 90 | DRAWING DEFAULT | |
| naturals row | 24 × 32.5 + 23 × 6 = 918 < 1062 (fits) | DERIVED | |
| bar support | "strings through holes drilled through the sides" | SOURCED | YMH-YG2500-OM |
| resonators | tubes, L_ac(C5) = 163.2 → L_ac(E8) = 16.2 (§A4); "only essential accidental resonators" | SOURCED rule / DERIVED length | |
| damper | damper bar + pedal + "Damper stopper"; gas-spring legs | SOURCED parts; geometry DRAWING DEFAULT | YMH-YG2500-OM |
| options | Adams Concert (hand-damped, 1200 × 550/310, 32-mm bars); YG-1210 case 787.4 × 482.6 × 108.0 with lid (lid hinge on the far side, open 90°: DRAWING DEFAULT) | SOURCED sizes | ADAMS-GLC, YMH-YG1210 |

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.glk.shure` | ONE mic 101.6–152.4 above the bars, over the played span, aimed down — **shown only if it clears `ko.mallet`**; otherwise greyed with "inside the mallet path" | SOURCED | S-LIVE / S-RECBK |
| `zone.glk.trial` | above and slightly toward the audience side, 300–600 from the bars | lesson TRIAL | lesson L11 |
| `zone.glk.pair` | optional near-coincident pair over the span (no Shure dimension: DRAWING DEFAULT ORTF-like 170 mm / 110°, the M09 builder) | lesson suggestion | lesson L16 |

`ko.mallet` for the glockenspiel: hBars + 250 (DRAWING DEFAULT; smaller strokes than the
marimba). The Shure 101.6–152.4 band lies INSIDE it — that is the lesson's own point (L9: "the
capsule or boom can be within a real player's mallet arc"); the app must show the conflict.
Owner: glock mallet envelope height; case-lid geometry.
