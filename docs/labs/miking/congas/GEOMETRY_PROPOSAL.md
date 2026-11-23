# M04a Congas: GEOMETRY PROPOSAL

Value classes / DRAWING DEFAULT rule: header of `snare/GEOMETRY_PROPOSAL.md`. Sources:
`congas/SOURCES.md`. Not on the drum kit: own frame.

## Frame H (hand-drum frame, reused by bongos, djembe, tambourine, tonbak, tabla)
Units mm. Origin = the floor point under the midpoint between the drums' head centres (single drum:
under its head centre). +x toward the audience (away from the player); +y down (floor y = 0);
+z to the player's right. The player stands or sits at −x. Height h above the floor ↦ y = −h.

## Default instruments (two-drum set)

| Anchor | Value | Class | Source |
|---|---|---|---|
| conga (11-3/4 in) head | Ø 298.45, centre (0, −762.0, −170) | size + height SOURCED; plan drawing default | LP-CLASSIC "30″ tall" |
| tumba (12-1/2 in) head | Ø 317.5, centre (0, −762.0, +170) | same | LP-CLASSIC |
| centre spacing | 340 (heads 32.0 mm apart at the rims: 340 − 149.225 − 158.75) | drawing default | — |
| shell taper / bottom opening Ø | UNKNOWN; drawing default bottom Ø = 0.8 × head Ø, open | drawing default | — |
| tilt | 0 (on the floor); "raised setup" state lifts the drums 150 (drawing default) | drawing default | — |
| player hands envelope | above each head, plan half-disc on the −x side, up to 300 above the head | ILLUSTRATIVE | — |

## Starting-point zones

| Zone | Region | Source |
|---|---|---|
| `zone.conga.shared` | one mic between the two heads, "just above top heads": mic.ref on the plane x = 0…+80, z = 0, h = 762 + [50, 150] (the 50–150 band is a drawing default for "just above"), aimed down | S-DRUMS / S-REC / S-LIVE (words) |
| `zone.conga.each` | per drum, distance from the head centre 152.4–609.6 ("6 inches to two feet"), on the audience side, aimed at the head | RM-CONGA |
| `zone.conga.bottom` | raised drums only: in front of the lower opening, ~305 ("about a foot"), not blocking it; cables never into the opening | SOS-LATIN (Garza); lesson rule |
| `zone.conga.room` | ≈ 2000 in front ("about two metres") | SOS-LATIN (Garza) |
| `ko.hands`, `ko.knees`, `ko.opening` | as above; nothing under a floor-standing drum's opening | lesson rule |

Readouts: distance to each head, the two path lengths and their difference (Δt, `SOURCES_SHARED.md`).
UNKNOWN for the owner: plan spacing, raised-stand height, shell taper, player posture (standing).

## Frame C and the set of three (2026-11-22, owner: "center conga is conga w tumba and quinto on sides"; decision "Three drums")

Frame H's side view looks ALONG z (from the player's right), so with the drums spread along z one hides the
next — the picture the owner rejected. M04a now uses FRAME C, frame H turned a quarter: origin on the floor
under the CONGA's head centre; **+x toward the player's LEFT** (the quinto's side, the audience's right);
+y down; **+z toward the AUDIENCE**; the player at −z. The engine's 'side' view (u = x, v = y, camera at
+z) is then the FRONT elevation, from the audience: tumba on the left of the picture, conga in the middle,
quinto on the right. The top view (u = x, v = z) has the audience at the bottom, as the stage plans do.
A mic facing the drums from the audience side aims −z (aim home az = −90°); a level boom runs +z.
Only M04a changes; bongos, timbales, djembe and the rest keep frame H.

| Anchor | Value | Class | Source |
|---|---|---|---|
| quinto (11 in) head | Ø 279.4, centre (+355.0, −762.0, 0) | size + height SOURCED; side and spacing drawing default | LP-CLASSIC |
| conga (11-3/4 in) head | Ø 298.45, centre (0, −762.0, 0) | same | LP-CLASSIC |
| tumba (12-1/2 in) head | Ø 317.5, centre (−376.5, −762.0, 0) | same | LP-CLASSIC |
| row | a straight row, the bellies 30 mm apart at their widest (bellies drawn ≈ 157 / 168 / 179 mm radius) | drawing default (`gap`, `belly` 0.18 × R) | — |
| which side | quinto on the player's left, tumba on the right: "a common layout; players set their drums their own way" | drawing default (in the unknowns) | — |
| hands envelope | one box over the player's half (z ≤ 0) of all three heads, x −545 … +505, up to 300 above | ILLUSTRATIVE | — |
| player | standing behind the conga, x ±420, z −720 … −250, to 1650 tall | ILLUSTRATIVE | — |
| raised stands | each drum its own three-legged stand, legs to the floor 150 lower; tumba and quinto legs at 30°, 150°, 270° (two front, one back — none in front of the tumba's opening); the conga's turned to 90°, 210°, 330° so no leg meets a neighbour's | ILLUSTRATIVE | — |

| Zone | Region | Source |
|---|---|---|
| `cg.shared` | one mic over the set: over the conga's audience half (x 0, z +50, r 50), 50–150 above the heads, aimed down | S-DRUMS words for a pair; TRIAL for three |
| `cg.pair` | two mics, 152.4–609.6 above the heads, between the tumba's and the quinto's centres on the audience half; drawn starts over each gap (x −188.2 and +177.5, z +80, 380 above) | RM-CONGA words; TRIAL positions |
| `cg.<drum>` ×3 | 152.4–609.6 from that drum's head, within its radius of its centre line, aimed at it | RM-CONGA |
| `cg.clip.<drum>` ×3 | the front rim, 50–150 above the head | DPA-JB (quinto TRIAL) |
| `cg.bottom` | raised only: ~305 in front (+z) of the tumba's lower opening | SOS-LATIN |

The live wedge sits at (0, 0, +1050) facing −z; the side fill at (+1900, 0, −250) facing −x. STUDIO OR LIVE
is drawn from above (the front view looks straight along the mic-to-wedge line). THE SETTING's band plan
(u toward the audience, v toward the player's right) draws the set at (u, v) = (z, −x).
