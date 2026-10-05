# C02 Electric Guitar Amplifier: GEOMETRY PROPOSAL

Status: PROPOSAL. Sources: `electric_guitar_amp/SOURCES.md`. Value classes: `acoustic_guitar/GEOMETRY_PROPOSAL.md`
header. **Reuses the SPEAKER FAMILY** of `speaker_leslie/GEOMETRY_PROPOSAL.md` Part A unchanged (frame C,
12-in speaker sizes, 1×12 / 4×12 cabinets, zones `zone.cab.*`). This file only adds the combo cabinet,
the e 906 positions, the live "against the grille" zone and the guitarist envelope.

## 1. Frame C (from speaker_leslie, restated)

Origin = centre of the active speaker's cone at the baffle plane; +x out toward the mic; +y down; +z to
the listener's right facing the cabinet. Grille plane x = g, drawing default g = 15 (UNKNOWN). Lateral
radius r = sqrt(y² + z²) from the cone centre; d = mic.ref.x − g.

Speaker (CEL-V30, TRIAL for the Fender's Jensen C12K): R_cone 141.5 (DERIVED), R_dust drawing default 50,
R_surround drawing default 128.

## 2. Cabinets offered in this lesson

| Cabinet id | Outer W (z) × H (y) × D (x) mm | Driver | Back | Source |
|---|---|---|---|---|
| `cab.combo.fender65dr` (**default**) | 622 × 445 × 241 | one 12 in | open (drawing default; manual silent) | FEN-65DR-MAN (sizes SOURCED from inch values: 24.5 in = 622.3, 17.5 in = 444.5, 9.5 in = 241.3 conv.; Fender prints 62.2 / 44.5 / 24.1 cm) |
| `cab.1x12` | 500 × 470 × 290 | one 12 in | closed (UNKNOWN) | MAR-MX112 |
| `cab.4x12` | 770 × 755 × 365 | four 12 in, 2×2 at ±190 z, ±185 y (drawing default) | closed | MAR-1960A |

Combo speaker centre on the baffle: drawing default z = +60 from the cabinet centre line, y = 255 below
the cabinet top (placeholder; the manual gives no drawing). Control panel band: top 90 mm of the front,
drawing default. Rear ventilation keep-out: x ∈ [−241 − 152.4, −241] behind the back (SOURCED 6 in).

## 3. Lateral points and zones (each verified)

| Zone id | Lateral r | d (mm) | Verification | Source |
|---|---|---|---|---|
| `zone.eg.boundary` (**default start**) | r = R_dust (50, drawing default) | small; use 12.7 (Mills' grille distance) to 50 | **CONFIRMED** L7/L12 | S-MILLS |
| `zone.eg.pga27` | any r on the chosen cone | 25.4–152.4 (Shure prints 2–15 cm) | **CONFIRMED** L28 | S-PGA27 |
| `zone.eg.e906.A` | r = 0 (dome) | close (no number) | CONFIRMED L16 "brighter" ("many trebles, aggressive") | SN-906 |
| `zone.eg.e906.B` | r = (R_dust + R_surround)/2 = 89 (DERIVED from drawing defaults); optional rotation ~30° toward the edge | close | **CONFIRMED** L7 | SN-906 |
| `zone.eg.e906.C` | r = R_surround − 10 = 118 | close | CONFIRMED L19 ("smoother") | SN-906 |
| `zone.eg.mills2` | mic 1 at r = R_dust + 25.4…50.8 (KSM27), mic 2 at r = R_dust on another speaker; both d = 12.7 | | CONFIRMED L37 (two-mic example) | S-MILLS |
| `zone.eg.rear` | behind an open back on the driver axis; polarity swap | UNKNOWN; drawing default 50–150 | CONFIRMED L38 (no distance exists) | S-MILLS |
| `zone.eg.live.grille` | r = 0 aimed straight, or at the edge angled into the voice coil | d ≈ 0 ("right up against the grille") | not in lesson; live option | S-RHYTHM |
| `zone.eg.sm57.*` | 25 / 150–300 / 600–900 on-axis | | from speaker module | S-SM57-UG |
| `zone.eg.room` | lesson L39 "farther room mic" | no number; drawing default 1000–2000 | no source | — |

Keep-outs (rules from the lesson): `ko.eg.cone` (no contact with grille or moving cone: d ≥ 5 drawing
default), `ko.eg.vents` (rear 152.4 SOURCED), `ko.eg.tubes` (inside chassis: no mic, hand or stand, L38),
`ko.eg.player` (below).

One-variable rule (L33): lateral drag keeps d; angle drag keeps position; distance drag keeps r.

## 4. Guitarist envelope (ILLUSTRATIVE, drawing defaults)

Player stands 600–1500 mm in front of the combo, offset to one side (drawing default z = −700); feet
zone 400 × 300 on the floor where the pedalboard sits (default z ∈ [−900, −500], x ∈ [600, 900]); cable
route from the guitar to the amp input on the control panel. The mic cable must not cross the feet
zone (L35). Floor y = +(445 − 255) = 190 below the speaker centre for the combo on the floor (DERIVED
from the drawing default); a tilt-back stand is optional.

## 5. Readouts

r and d separately (mm), "dome · line · middle · edge" label, aim angle off the cone axis, which
speaker (multi-speaker cabinets), open/closed back flag, polarity state for front+rear (drawn apart from
delay), path difference → Δt with the calculator speed of sound (shared readout from Batch 1).

## 6. UNKNOWNS for the owner

1. Combo speaker position, back panel style (open by default). 2. Dust-cap and surround radii (speaker
module defaults). 3. Room-mic distance (no source). 4. Remove the e 906 "designed to hang" claim (not in
the manual) or source it.
