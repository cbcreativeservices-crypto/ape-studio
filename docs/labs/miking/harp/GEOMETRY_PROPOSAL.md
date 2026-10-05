# C10 Harp: GEOMETRY PROPOSAL (medium depth)

Frame H (harp): origin = floor point under the soundboard's lower end (the base); +y down (floor y = 0);
+x toward the audience (the player sits at −x, the soundboard leans back onto the player's right
shoulder); +z to the audience's right.

| Item | Value | Class |
|---|---|---|
| Height | 1900 (DPA "190 cm height"); Met instruments 1763 (Erard 1895), 1780 (L&H) | SOURCED DPA-HARP / MET |
| Depth (front to back) | 940 | SOURCED MET-LH |
| Soundboard | resonating length 1328, greatest width 390; leans from the base toward the player, top end at (−700, −1450, 0) | length/width SOURCED MET-ERARD; lean drawing default |
| Pillar | length 1657, front of the harp, near-vertical from (+200, 0) to (+150, −1657) | length SOURCED MET-ERARD; position drawing default |
| Neck/crown | joins pillar top to soundboard top | drawing default curve |
| Strings | 47 between soundboard and neck; longest 1557, shortest 65 | lengths SOURCED MET-ERARD; count = lesson/survey (not in sources read) |
| Sound holes (back of the soundbox) | 5 ovals 120 × 60 along the back, second from the bottom at 30 % of the board length | drawing default; "second from the bottom" named by DPA |
| Pedals | 7 at the base, z ∈ [−250, +250] | count UNKNOWN in sources read (survey); drawing default |
| Lever harp | scale 0.6 × pedal harp, no pedals, levers on the neck | drawing default |
| Player | seated at x = −750, seat 550, head at (−750, −1300, −150); hands both sides of the strings | drawing default |

| Zone id | Position | Verification | Source |
|---|---|---|---|
| `zone.hp.ab` (studio) | omni A/B pair ≥ 2000 from the harp, toward the room centre, not too low (drawing default height 1500, spacing 600) | **CONFIRMED** (spacing is a drawing default — no source gives it) | DPA-HARP |
| `zone.hp.blend` | 2000–3000 | CONFIRMED | DPA-HARP |
| `zone.hp.pillar` (spot) | cardioid near the pillar top, pointing down at the soundboard, d drawing default 400 | CONFIRMED | DPA-HARP |
| `zone.hp.behind` | slightly behind, from the right, opposite the player's head, a little higher | CONFIRMED | DPA-HARP |
| `zone.hp.pair30` | two cardioids ~300 from the board: one from right behind, one horizontal; top +6 dB | CONFIRMED | DPA-HARP |
| `zone.hp.shure` | ~609.6, aimed toward the player at part of the soundboard (reading: from the audience side, through the strings, at the board) | CONFIRMED (distance); direction Medium | S-REC, S-LIVE |
| `zone.hp.hole` (live) | omni mini in the second sound hole from the bottom | CONFIRMED | DPA-HARP |

Keep-outs: strings plane ± 150 (hands), pedals and the player's feet, the arc over the player's head
(no boom over the head without a secure stand — lesson), chair. UNKNOWN: pedal count/positions, hole
layout, lean angle, lever-harp sizes, pair spacing.
