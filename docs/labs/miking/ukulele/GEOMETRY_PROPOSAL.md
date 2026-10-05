# C05c Ukulele: GEOMETRY PROPOSAL (medium depth)

Guitar-body family, frame G (origin at the saddle). Fret formula as C01 (PHYS-ET).

| Size | Scale L | Overall | Class |
|---|---|---|---|
| Soprano (**default**) | 345 | 522 | SOURCED MET-UKE (TRIAL modern) |
| Concert | 381 | 610 | drawing default (Low retailer figures 15" / 24") |
| Tenor | 428.5 | 673 | drawing default (16.87" / 26.5") |
| Baritone | 511 | 757 | drawing default (20.125" / 29.81") |

Body (soprano, drawing defaults): length 240, lower bout 160, waist 115, upper bout 130, depth 60,
neck joins at the 12th fret (x = L/2 = 172.5, DERIVED for the default), sound hole Ø 50 at x = 120.
Other sizes scale the body by L/345 (drawing default rule; lesson: "neck joins … at a different
geometric relation" — owner may supply real proportions).

| Zone id | Position | Verification | Source |
|---|---|---|---|
| `zone.uk.upper` (start) | aimed at the upper body / neck joint, off the strumming arc and slightly off the hole axis, d = 200–400 | **TRIAL** (lesson); aim by guitar analogy | lesson, DPA-UKE |
| `zone.uk.clip` | VC4099 if the real depth is 35–55, otherwise GC4099 (35–122); the 60 default depth is a placeholder, so the app should not claim which clip fits | fit rule SOURCED; depth UNKNOWN | DPA-UKE |
| `zone.uk.xy` | XY cardioids at the sweet spot | CONFIRMED | DPA-UKE |

Keep-out: `env.uk.strum` = box over the hole/bridge, z ∈ [0, 110]. Strap optional. UNKNOWN: all body
proportions.
