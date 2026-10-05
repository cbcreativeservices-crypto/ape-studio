# Speaker Cabinet and Leslie Module: GEOMETRY PROPOSAL

Status: PROPOSAL. No app code. Value classes / DRAWING DEFAULT rule: header of
`snare/GEOMETRY_PROPOSAL.md`. Sources: `speaker_leslie/SOURCES.md`. This module is not on the drum
kit, so it has its own frames (same handedness and units as the kick frame: mm, +y down).

## Part A. Conventional cabinet (shared speaker scene for Guitar, Bass, Harmonica, Rhodes, Wurlitzer)

### A1. Frame C
Origin = centre of the active speaker's cone **at the baffle plane** (the plane of the speaker's
mounting flange). +x out of the cabinet toward the listener (the mic side); +y down; +z to the
listener's right when facing the cabinet. Grille cloth plane: x = g (drawing default **g = 15**, the
cloth stands proud of the baffle; UNKNOWN).

### A2. The speaker (Celestion Vintage 30 as the sourced 12-in reference)

| Symbol | Value (mm) | Class | Source |
|---|---|---|---|
| `D_nom` | 305 | SOURCED | CEL-V30 "Nominal Diameter 305mm / 12in" |
| `D_frame` | 309 | SOURCED | "Diameter 309mm" |
| `D_cut` | 283 | SOURCED | "Cut-out diameter 283mm" (visible cone + surround ≤ this) |
| cone depth / overall depth | 97 chassis, 135 overall | SOURCED | CEL-V30 |
| `R_cone` (visible cone edge incl. surround) | 141.5 | DERIVED | D_cut / 2 |
| `R_dust` (dust-cap radius) | drawing default **50** | UNKNOWN | not on the datasheet |
| `R_surround` (inner edge of the surround) | drawing default **128** | UNKNOWN | — |

Lateral positions (plan on the y–z plane, r from the cone centre): `pos.center` r = 0;
`pos.boundary` r = R_dust (Mills "line between the dust cover and the speaker cone"); `pos.edge`
r = R_surround − 10 (drawing default).

### A3. Cabinets (outer boxes, SOURCED; driver layout drawing default)

| Cabinet | W × H × D (mm) | Drivers | Driver layout (drawing default) | Source |
|---|---|---|---|---|
| 1×12 (Marshall MX112) | 500 × 470 × 290 | one 12 in | centred on the baffle | MAR-MX112 |
| 4×12 (Marshall 1960A, angled) | 770 × 755 × 365 | four 12 in | 2 × 2 grid, centres at ±190 (z) and ±185 (y) from the baffle centre; upper half of the baffle angled back (angle UNKNOWN, drawing default 8°) | MAR-1960A |
| Bass 4×10 + horn (Ampeg SVT-410HLF) | 762 × 609.6 × 482.6 | four 10 in + 1 horn | 2 × 2 grid ±170 / ±150; horn between the top pair (drawing default) | AMP-410 |
| Open-back option | any of the above with the back removed in the drawing: back panel UNKNOWN for these models | | state flag `openBack` | lesson omits; Mills rear-mic note |

### A4. Starting-point zones (each verified)

d = distance from the grille plane to mic.ref along +x.

| Zone | Region | Source |
|---|---|---|
| `zone.cab.pga27` | d ∈ [20, 150] (Shure prints "1-6 inches (2-15 cm)"), any lateral position; aim along −x | S-PGA27 (CONFIRMED) |
| `zone.cab.boundary` | lateral r = R_dust; d ∈ [25.4, 50.8] (Mills' KSM27 "about 1 to 2 inches") | S-MILLS |
| `zone.cab.sm57.close` | d = 25 ("2.5 cm (1 in.) from speaker"), centre or edge | S-SM57-UG |
| `zone.cab.sm57.mid` | d ∈ [150, 300], on-axis with the cone | S-SM57-UG |
| `zone.cab.sm57.far` | d ∈ [600, 900], on-axis | S-SM57-UG |
| `zone.cab.rear` (open back only) | behind the cabinet on the driver axis; distance UNKNOWN (drawing default 50–150); polarity swap prompted (Mills) | S-MILLS |

Bass cabinets: the Electric-Bass lesson's 10–45 cm range is a separate lesson's number (not in this
module's text; flagged for the summary).

One-variable rule (lesson L13): moving laterally keeps d constant; the readout shows r and d separately.

## Part B. Leslie (Heritage 122H as the sourced model)

### B1. Model choice
The **Leslie 122H** is drawn because it is the only Leslie with sourced rotor speeds, ramp times
and crossover (HAM-122H). It shares the traditional footprint with the 122A/147A (W 742 vs 742.95,
D 524 vs 523.875; height 1043 vs 1057.275 — D-L1). The app says "a classic two-rotor cabinet"; no
model name is shown (owner ruling).

### B2. Frame L
Origin = centre of the cabinet footprint on the floor. +x out of the **front** face (which face is
the "front" is not stated; drawing default = the face opposite the rear Rotor Control Panel, which
HAM-122H puts "on the back panel"); +y down (floor y = 0, top y = −1043); +z to the right when facing
the front.

| Item | Value (mm) | Class | Source |
|---|---|---|---|
| Cabinet W (z) × D (x) × H | 742 × 524 × 1043 | SOURCED | HAM-122H "W 74.2 X D 52.4 X H 104.3 cm" |
| Upper (horn) compartment | y ∈ [−1043, −0.62·1043 = −646.7] | drawing default | proportions read from HAM-122H p.6 schematic (Medium) |
| Woofer shelf | y = −646.7; woofer (Ø 381, "15" (38cm)") facing **down** | woofer size SOURCED; orientation from the schematic (Medium) | HAM-122H p.5–6 |
| Lower (rotor) compartment | y ∈ [−0.40·1043 = −417.2, 0] minus a plinth of 40 | drawing default | schematic |
| Horn rotor axis | vertical line x = 0, z = 0; horn plane y = −0.90·1043 = −938.7; two bells, each reaching r = 0.40·W/2 = 148.4 from the axis | drawing default | schematic shows two bells on a central axis above the compression driver |
| Low rotor axis | vertical line x = 0, z = 0; rotor plane y = −0.22·1043 = −229.5; rotor radius 0.40·W/2 = 148.4 | drawing default | schematic |
| Upper louvers | front, both sides and back of the upper compartment, band y ∈ [−1000, −780] | drawing default | count/size UNKNOWN |
| Lower openings | front, both sides and back of the lower compartment, band y ∈ [−380, −80] | drawing default | UNKNOWN |
| Crossover | 800 Hz | SOURCED | HAM-122H |

The inside view is labelled "inside view — never open the cabinet" (lesson L27; HAM-122H "NE PAS
OUVRIR", "Do not insert your fingers through the gaps").

### B3. Rotor motion model (SOURCED speeds; simplified ramps)

| Rotor | Slow | Fast | Rise (slow→fast) | Fall (fast→slow) | Source |
|---|---|---|---|---|---|
| Horn | 44 rpm (0.733 rev/s) | 402 rpm (6.70 rev/s) | 1.8 s | 2.4 s | HAM-122H p.7 defaults |
| Low (drum) | 42 rpm (0.700 rev/s) | 372 rpm (6.20 rev/s) | 7 s | 5.5 s | HAM-122H p.7 defaults |

- State: `mode ∈ {stop, slow, fast}`; angle θ(t) integrates ω(t); ω ramps **linearly** over the
  rise/fall time (simplification; Hammond gives only the times). Stop: the 122H/3300 offer STOP
  (foot switch held 1.5 s); ramp to 0 uses the fall time (drawing default).
- Rotation directions: **UNKNOWN** — drawing default both counter-clockwise seen from above, with
  a visible "direction not documented" note in the simplifications register (not on screen).
- Readout: which opening each bell/rotor mouth faces, and the angle from each mic's axis to the
  active mouth. No level curve, no simulated audio (lesson rule).
- Display at a time base the eye can follow: show the true rpm as a number; a "slowed ×N" badge if
  the animation is slowed (charter §5 honesty rule).

### B4. Starting-point zones (all outside the cabinet)

d = distance from the cabinet face (louver plane) to mic.ref along the outward normal.

| Zone | Region | Source |
|---|---|---|
| `zone.les.upper` | outside an upper louver, d ∈ [76.2, 304.8] ("3 inches to 1 foot away") | S-REC, S-LIVE |
| `zone.les.lower` | outside a lower opening, d ∈ [76.2, 304.8] | S-REC, S-LIVE |
| `zone.les.lower.rear` | outside the rear lower opening, d ≈ 76.2 ("about 3 inches") | S-LESLIE (Michaels) |
| `zone.les.upper.sides` | one mic each side of the upper compartment ("one close to each side"); Michaels: d ∈ [25.4, 50.8]; Byrne: one side, d ≈ 304.8, "just under the top louvers" | S-REC, S-LESLIE |
| `zone.les.upper.xy` | coincident X/Y pair outside the upper louvers, 90° (drawing default), capsules not touching | S-LESLIE (Mishur "xy pair for the horn"); geometry DPA-STEREO |
| `zone.les.room` | pair "a couple of meters away": d ≈ 2000 from the front face, h = 1000 (drawing default) | S-LESLIE (Mishur) |
| `ko.les.cabinet` | the whole cabinet volume + 20 mm: **no mic, cable or hand inside** (lesson L27) | rule |
| `ko.les.vent` | the louver/opening faces: cables may not cross them (lesson L28) | rule |
| `ko.les.organ` | organ bench, pedals and a 600-mm walkway (drawing default) | ILLUSTRATIVE |

Power-off placement step (lesson L60) precedes the rotor animation.

## Invariant tests

- No mic.ref inside `ko.les.cabinet`; every Leslie zone d > 0.
- Rotor fast/slow speeds and ramp times equal the HAM-122H table.
- Cab lateral move keeps d constant.
- 4×12 drivers lie inside the 770 × 755 baffle with ≥ 10 mm between frames (309-mm frames on a
  380 × 370 pitch: DERIVED check).

## UNKNOWNS for the owner

1. Which Leslie to draw (proposed 122H, the only one with sourced speeds). 2. Rotation directions.
3. Louver/opening layout and rotor sizes (drawing defaults from the schematic). 4. Dust-cap radius
(50 mm). 5. Open-back cabinet: add it (the Guitar lesson needs it). 6. Speaker layout on the
4×12 and 4×10 baffles. 7. Whether a slowed animation is acceptable (true rpm shown as a number).
