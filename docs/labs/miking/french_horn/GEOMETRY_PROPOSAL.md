# A03 French horn: GEOMETRY PROPOSAL

Brass family base: `trumpet/GEOMETRY_PROPOSAL.md`. The horn is the family's **room-scene** member:
the reflecting wall behind the player is part of the model.

## 1. Placement in W (ILLUSTRATIVE, drawing defaults)
Seated player facing +X (audience). Bell rim centre at W (−180, −700, +220): right of and behind the
player's right hip, axis pointing **−X (rear) and 20° outward to +Z**, tilted 10° down (drawing defaults;
SOURCED only "faces towards the rear"). Right hand inside the bell (keep-out sphere r 90 at the rim).
Left hand on the rotary valves (box 120 × 100 × 120). **Rear wall** plane at X = −1500 (user slider
−800…−4000; drawing default).

## 2. Row
| Symbol | Value | Class | Source |
|---|---|---|---|
| `D_bell` | 310 | UNKNOWN → drawing default | Yamaha prints "M" only |
| valves | 4 rotary (double F/B♭) | SOURCED | YHR-567 |
| `L_tube` (F side) | 3750 (label) | SOURCED | PL-2010 |
| coil Ø | drawing default 260 | UNKNOWN | — |

## 3. Envelopes
`env.hn.bellsUp` = bell axis rotating up to +45° pitch (drawing default; L7 "bells up"), plus turn ±20°
yaw. Detachable-joint no-mount ring. Right-hand access cone into the bell (no mic there: L43 "Never reach
into the bell").

## 4. Zones
| Zone | Region | Verdict / source |
|---|---|---|
| `zone.hn.front` | in front of the player, mic hears the horn after ≥ 1 reflection; d from the player drawing default 1000–2500; **no published distance** | CONFIRMED words (IHS-ROSTRUP) |
| `zone.hn.rostrup.main` | ORTF-type pair ~4000 from the accompanying piano (case study tag) | CONFIRMED, IHS-ROSTRUP |
| `zone.hn.spot.above/below` | front spots above the horn (figure-8, null toward the piano) and beneath it | CONFIRMED, IHS-ROSTRUP (no distances → drawing defaults 400–800) |
| `zone.hn.rear` | behind/beside the bell, aimed toward the bell, off axis; low stand | CONFIRMED words (S-LIVE "aiming toward bell"; MDAT "behind… closer to the ground… off axis"); distance drawing default 600–1200 — Shure 1–2 ft is generic brass only (L10 says so) |

Readouts: path-length difference direct (bell→mic) vs reflected (bell→wall→mic) with arrival Δt
(`SOURCES_SHARED.md` §1); front/rear level comparison is **qualitative** (Yamaha words). Radiation layer:
brass family, horn row (rear-pointing lobe ≥ 500 Hz, PL-2010). Owner: bell Ø and pose defaults; wall
distance slider; whether to show both schools side by side (D-HN1).
