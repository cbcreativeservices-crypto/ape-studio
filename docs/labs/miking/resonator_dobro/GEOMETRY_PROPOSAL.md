# C03 Resonator Guitar / Dobro: GEOMETRY PROPOSAL (medium depth)

Uses the **GUITAR BODY FAMILY** (`acoustic_guitar/GEOMETRY_PROPOSAL.md` §7) in frame G (origin = saddle
on the top plane; +x to the nut; +z out of the top). Body = steel dreadnought outline (TRIAL; resonator
bodies are not sourced). Opening type = `coverplate`.

| Item | Value | Class |
|---|---|---|
| Single cone (spider or biscuit) | Ø 241.3, centred under the coverplate, centre at x = −30 (drawing default) | Ø SOURCED NAT-TECH / BEARD; position drawing default |
| Coverplate | Ø 270 disc over the cone, hand-rest bar optional; hole pattern drawing default (ring of 20 × Ø 12) | drawing default |
| Tricone | three cones in a triangle under a T-bridge coverplate: cone Ø drawing default 152, centres (x −10, y ±90) and (x −150, y 0) | UNKNOWN |
| Upper-bout sound ports | two screened ports, Ø 60 at (x 230, y ±120) | drawing default |
| Postures | **round-neck upright** = acoustic-guitar posture; **square-neck lap style** = guitar lying flat on the lap, top facing UP (+z = world −y), headstock to the player's left | posture defaults; lap style per NAT-TECH distinction |
| Bar/slide hand | sweep over the strings x ∈ [x_edge, L], z ∈ [h, h + 80] | `env.rs.bar` drawing default |
| Picking hand | x ∈ [−60, +120] over the coverplate | `env.rs.pick` drawing default |

Zones:

| Zone id | Position | Verification | Source |
|---|---|---|---|
| `zone.rs.trial` (start) | facing the coverplate/upper body from slightly off the picking path, d = 200–450 | TRIAL (lesson) — no published resonator distance | lesson |
| `zone.rs.shure.guitarRows` | the guitar rows (3 in / 8 in from the cone centre in place of the sound hole; 4–8 in from the bridge) | not in lesson; Shure lists Dobro with them | S-REC, S-LIVE (TRIAL mapping hole → cone) |
| `zone.rs.clip` | 4099G clip on the rim, capsule toward the coverplate edge (not the cone) | CONFIRMED | DPA-MOUNT |
| `zone.rs.lap.boom` | lap style: boom from the side, capsule above the coverplate, d = 200–450 down onto the top | CONFIRMED (lesson "boom from the side"); distance = lesson trial | lesson |

Keep-outs: the coverplate and cone (no contact, no clamp — L-safety), `env.rs.bar`, `env.rs.pick`.
UNKNOWN: body size, coverplate pattern, tricone cone size, port positions.
