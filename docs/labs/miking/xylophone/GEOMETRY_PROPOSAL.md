# I09 Xylophone: GEOMETRY PROPOSAL

Family and rules: `vibraphone/GEOMETRY_PROPOSAL.md` §A (frame M, layout, resonators, envelopes,
Shure zones). Parameter row (default Yamaha YX-500R):

| Param | Value | Class | Source |
|---|---|---|---|
| range (sounding) | F4–C8 (keys 45–88); 44 bars = 26 naturals + 18 accidentals | SOURCED (count DERIVED) | YMH-YX500, YMH-JENKS-ARC |
| wLow = wHigh | 41.275 (non-graduated 1 5/8 in) | SOURCED | YMH-YX500 |
| t | UNKNOWN → 22 | DRAWING DEFAULT | — |
| footprint | 1381.1 × 749.3 (54 3/8 × 29 1/2 in) — rectangle (Yamaha gives no end depths) → Dlow = Dhigh = 749.3 | SOURCED | YMH-YX500 |
| hBars | 870 (inside 800.1–949.3, "31 1/2" – 37 3/8"") | DRAWING DEFAULT | |
| LbarLow / LbarMin | 0.6 × 749.3 = 449.6 / 160 | DRAWING DEFAULT | |
| naturals row | 26 × 41.275 + 25 × 6 = 1223.2 < 1381.1 (fits) | DERIVED | |
| resonators | tubes under the naturals; under accidentals only "essential" ones (which ones: UNKNOWN → draw under every 2nd accidental, DRAWING DEFAULT); L_ac(F4) = 244.6 → L_ac(C8) = 20.4 (§A4) | rule SOURCED; selection DRAWING DEFAULT | YMH-YX500 |
| option | Adams Concert C4–C8, 48→40, 1650 × 900/560 (quint table) | SOURCED (XYL-D1 noted) | ADAMS-XYC |

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.xyl.one` | one mic 450–750 above the centre of the played notes, aimed down, only if clear of `ko.mallet` | lesson TRIAL | lesson L10 |
| `zone.xyl.shure.spaced` / `.xy` | §A6 | SOURCED | S-LIVE |
| `zone.xyl.offAxis` | "a safe off-axis position" — audience side, 45° elevation, 600–900 from the played-span centre | lesson words; band DRAWING DEFAULT | lesson L10 |

Keep-outs §A5 (mallet volume to hBars + 350; player; frame/cords). Mallet = hard rubber / poly
(SOURCE control; metal disabled with the reason "can damage or break the bars", YMH-CARE).
Owner: thickness, which accidentals have resonators, hBars, bar-length model.
