# I12 Gong: GEOMETRY PROPOSAL

Classes: `hihat/GEOMETRY_PROPOSAL.md`.

## Frame G
mm. Origin = floor point under the gong's centre at rest. +x from the gong toward the audience
(the struck face looks +x); +y down (h ↦ −h); +z to the audience's left. The player stands beside the struck face, at (x +300, z −500),
facing the gong (ILLUSTRATIVE).

| Item | Value | Class | Source |
|---|---|---|---|
| `gong.symphonic` (default) | Ø 812.8, bossless, rim (flange) depth 40, face slightly domed (8) | Ø SOURCED (PAI-GONG list); rim/dome DRAWING DEFAULT | PAI-GONG |
| `gong.luo` (bossed/pitched alt.) | Ø 406.0, depth 31, rim 20 | SOURCED (Met object, TRIAL for "a bossed gong") | MET-LUO |
| `gong.nipple` (Burmese) | Ø 457 (inside 12–24 in), boss Ø 90 × 35 high | Ø range SOURCED (SONVO); boss DRAWING DEFAULT | SONVO |
| centre height | h 1300 | DRAWING DEFAULT | — |
| frame stand | TMGS-3-type square frame, inner 1100 × 1100, posts 40, feet 600 deep; suspension cords from two top holes at ±45° | stand type SOURCED (MEINL-TMGS3, "up to 40"/100 cm"); sizes DRAWING DEFAULT | |
| swing | free swing forward/back and sideways: ±80 at the rim, ±6° rotation about the cord axis | behaviour SOURCED (PAI-SUP); amplitude DRAWING DEFAULT | PAI-SUP |
| mallet | head Ø 120, handle 400; arc from the player's shoulder to the strike point, plus 150 follow-through | DRAWING DEFAULT | — |
| strike point | symphonic: off-centre at r 0.25 R (drawing default; Paiste's figure not read); bossed: the boss, or "a couple inches from the nipple" (≈ 51 from the boss edge) | partly SOURCED (SONVO) | |

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.gong.A` | 600–1200 in front of the face (on the +x axis), at centre height | lesson TRIAL | lesson |
| `zone.gong.B` | 300–600 from the face, offset to a clear outer portion (r 0.6–0.9 R) | lesson TRIAL | lesson |
| `zone.gong.C` | coincident XY cardioid pair (90°, M09 builder) on the A axis; then near-coincident / spaced | lesson + DPA-STEREO | |
| `zone.gong.D` | front + room mic (room: 3000 back, DRAWING DEFAULT) | lesson | |
| `zone.gong.sonvo` | (reference only) two mics ≈ 305 from the gong, 1524 and 1067 high, 305–406 apart | SOURCED account | SONVO |
| boss aim | bossed gongs: compare aiming at the boss vs the broad face | lesson | |

Keep-outs: `ko.swing` (the face's swept volume + 100), `ko.mallet`, the frame and cords (no clamp
to gong, rope or frame — lesson), the player. Distance readout: capsule → gong surface at rest
(the lesson's definition) and → centre region (switch).
Owner: default gong (32-in symphonic proposed), centre height, swing amplitude, strike point.
