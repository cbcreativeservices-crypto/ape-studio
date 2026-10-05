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
