# I01b Ride Cymbal: GEOMETRY PROPOSAL

Frame K and value classes: `hihat/GEOMETRY_PROPOSAL.md` §1. Reuse `cymbalSpec.ts` (`RIDE_20`,
`BOOM_STAND`, `cymbalSolid`, `cymbalAreas`, `CYMBAL_SWING`) and the kit plan unchanged.

| Anchor | Value (K, mm) | Class | Source |
|---|---|---|---|
| `ride.c` edge-plane centre | (−80, h 1000, 640), tilt 10° toward the drummer | ILLUSTRATIVE | kitPlanModel |
| Ø / R | 508.0 / 254.0 | SOURCED | ZIL-K |
| bell / bow / edge bands | r 0–50.8 / 50.8–215.9 / 215.9–254.0 | DRAWING DEFAULT (20 % Ø, 85 % R) | cymbalSpec |
| floor tom (below) | kit plan floor tom | ILLUSTRATIVE | kitPlanModel |
| strike points | tip on bow: r 150 toward the drummer; tip on bell: r 30; shoulder on edge: r 240 | DRAWING DEFAULT (areas SOURCED in words, ZIL-L11) | ZIL-L11 |

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.ride.shureArea` | mic.ref 304.8–609.6 above the ride's edge plane, over the ride (plan r ≤ 254), aimed down; a COVERAGE mic for "the rest of cymbals", not a spot | SOURCED | S-AL1568 |
| `zone.ride.spotTop` | compact directional mic aimed at the bow (or the bell for bell accents), outside `ko.swing` + `ko.stick`; distance band 150–300 above the bow | words = lesson; band DRAWING DEFAULT (no source gives a spot distance) | lesson L26 |
| `zone.ride.under` | below the ride, aimed up at the underside, 80–150 below the edge plane, outside the downward swing and above the floor-tom keep-out | option SOURCED (DPA-KIT, DPA-JULIET, DPA-BLINK, SN-SHELTON); position DRAWING DEFAULT | |
| `zone.ride.overhead` | the M09 right overhead (AX-DPQUAD: right overhead takes "floor tom and ride") | SOURCED option | AX-DPQUAD |

| Keep-out | Region | Class |
|---|---|---|
| `ko.swing` | `cymbalSolid` clearance ±60 at the edge (and on every side of the plate) | DRAWING DEFAULT (family) |
| `ko.stick` | tip/shoulder sectors from the right hand (drawing default (−600, h 1050, 380)) to each strike point, up to 406.4 above the plate | length SOURCED (VF-5A); shape ILLUSTRATIVE |
| `ko.choke` | the grip hand at the edge nearest the drummer: box 120 × 100 × 80 around the edge point | ILLUSTRATIVE |
| `ko.floorTom`, boom arm, counterweight | from the kit plan and `BOOM_STAND` | ILLUSTRATIVE / DRAWING DEFAULT |

Readouts: height above the bow, aim area (bell / bow / edge, words), distance to the floor-tom
head (the floor-tom mic "may already contain the ride"), Δt to each overhead.
Tests: `zone.ride.shureArea` lower bound clears `ko.swing` + stick envelope? — NOT always (the
stick rises to 406.4): the build must test the union and show the conflict as a warning, not
move the published band. Owner: spot band (150–300) and under band (80–150) are drawing defaults.
