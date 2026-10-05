# C04 Pedal Steel and Lap Steel: GEOMETRY PROPOSAL (medium depth)

The miked source is the **amplifier**: reuse `electric_guitar_amp/GEOMETRY_PROPOSAL.md` (frame C, combo
cabinet, zones `zone.eg.boundary`, `zone.eg.pga27`, `zone.eg.rear`) unchanged. The instrument is drawn
only to place the clearance zone the lesson requires.

Pedal steel (all DRAWING DEFAULTS, `placeholder: true`; no dimension sourced): single neck 10 strings,
body 900 (x) × 300 (z) × 90 (y) on four legs, top 700 above the floor; changer at the player's right
end; 3 floor pedals on a rack 200 deep under the instrument's middle; 4 knee levers hanging 150 below
the body. Seated player behind, seat 550. Lap steel: a 700 × 150 slab across the knees, no pedals.

| Envelope / zone | Region | Rule |
|---|---|---|
| `env.ps.legs` | pedal rack + knee levers + volume pedal + feet: box 1000 × 600 on the floor under and in front of the player | no stand base or cable inside (lesson "keep … out of the volume-pedal and knee-lever zone") |
| `env.ps.bar` | bar hand over the strings | keep-out |
| `zone.ps.amp.*` | the C02 amp zones on the steel player's amp | CONFIRMED (PGA27, Mills) |

UNKNOWN: every pedal-steel dimension, amp model (Peavey manual unreachable → use the C02 combo).
