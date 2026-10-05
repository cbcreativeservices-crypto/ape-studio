# M03 Rack and Floor Toms: GEOMETRY PROPOSAL

Status: PROPOSAL. No app code. Value classes and the DRAWING DEFAULT rule: see
`snare/GEOMETRY_PROPOSAL.md` (header). Frame: the KIT frame K of `snare/GEOMETRY_PROPOSAL.md` §1
(= the kick frame: origin kick batter centre, +x audience, +y down, +z drummer's right, floor
y = 290.4). Sources: `toms/SOURCES.md`; kit layout: `kit/GEOMETRY_PROPOSAL.md`.

## 1. Default toms (the brief's 5-piece: two rack toms + one floor tom)

| Drum | Size (in) | mm (conv.) | Class | Source |
|---|---|---|---|---|
| Rack tom 1 | 10 × 7 | Ø 254.0 × 177.8 | SOURCED | SBT-1007 / TMT-1007 / RBT-1007; TAMA "10"x7"" |
| Rack tom 2 | 12 × 8 | Ø 304.8 × 203.2 | SOURCED | SBT-1208 / TMT-1208 / RBT-1208; TAMA "12"x8"" |
| Floor tom | 16 × 16 | Ø 406.4 × 406.4 | SOURCED | TAMA-SSC "16"x16" Floor Tom" (Yamaha alternative 16 × 15 = 406.4 × 381.0) |

| Symbol | Value (mm) | Class | Source |
|---|---|---|---|
| `t_shell` | 5.6 | SOURCED | Tour Custom "5.6 mm" |
| `t_hoop` | 2.3 | SOURCED | Tour Custom "TT / FT : 2.3 mm" |
| `h_hoop` (hoop above head) | drawing default **10** | UNKNOWN | none |
| rods per head, rack | drawing default **6** | UNKNOWN (Yamaha table suspect, D-T2) | `KIT_PLAN` draws 6 |
| rods per head, floor | 8 | SOURCED, interpreted | RBF-1615 "8" |
| floor-tom legs | drawing default **3**, length to suit | UNKNOWN | `KIT_PLAN` draws 3 |
| tom mount (arm, clamp) | drawing default: one arm from the kick shell top to each rack tom | UNKNOWN | names only (Y.E.S.S., MTH600) |

## 2. Placement in the kit (all ILLUSTRATIVE or drawing default)

Heights are the batter-head centre above the floor; y = 290.4 − h. Tilt = rotation of the head
normal toward the drummer (−x) about an axis parallel to z.

| Anchor | Plan (x, z) | h above floor | Tilt | Class |
|---|---|---|---|---|
| `tom1.batter.center` (10 in) | (130, −280) | 850 | 15° | drawing default |
| `tom2.batter.center` (12 in) | (150, +40) | 850 | 15° | drawing default |
| `ft.batter.center` (16 in) | (−360, 380) | 620 | 0° | plan = `KIT_PLAN.floorTom`; height drawing default |

Clearance check that fixed the 850 mm (DERIVED): lowest point of a tilted rack tom =
h − depth·cos(tilt) − R·sin(tilt). For the 12 × 8 at 15°: 850 − 196.3 − 39.4 = 614.3 mm above the
floor, which clears the kick shell top at 290.4 + 279.4 = 569.8 mm by 44.5 mm.

Note: M01's 4-piece plan has ONE 12-in rack tom at (140, −150). The 5-piece plan above moves it
to (150, +40) and adds the 10-in at (130, −280). Owner decides whether M01 adopts the 5-piece plan
(nothing in M01's teaching depends on the tom position).

Local frame per tom (T): origin at the batter centre, n = head normal (up and tilted), r radial,
plan angle θ as in the snare frame.

## 3. Named anchors (per tom; ids shown for tom2)

`tom2.batter.center`, `tom2.batter.rim` (circle R = 152.4), `tom2.reso.center` (batter centre −
203.2·n), `tom2.reso.rim`, `tom2.rod[k]` (θ = 30° + k·60°, drawing default), `tom2.mount`,
`tom2.strike.center`, `tom2.strike.rimPoint(θ)`; floor tom: `ft.leg[k]` (k = 0…2), `ft.rod[k]`
(θ = 22.5° + k·45°).

## 4. Microphone outlines

| Size set | Dimensions (mm) | Pattern | Source |
|---|---|---|---|
| Beta 56A type | UNKNOWN; drawing default: reuse the SM57 silhouette scaled to a 50-mm grille, with a swivel stand adapter | "Supercardioid", null 120° | S-B56A-UG |
| e 904 type | Ø 41 × 63 + rim clamp | "cardioid" | SN-904-2019 |
| DM20 type (gooseneck condenser on RM1) | body 282.44 × Ø 22; gooseneck 120.65 × Ø 9.53 | "Cardioid" | EW-DM20 |
| D2 / D4 type | length 100; Ø 21.5 base, 39 widest | hypercardioid | AX-D2, AX-D4 |
| SM57 type | 157 / Ø 32 / Ø 23 | "Cardioid" | S-SM57-UG |

## 5. Recommended starting-point zones (each verified)

h = height of mic.ref above the batter plane along n.

| Zone id | Region | Aim | Verified | Source |
|---|---|---|---|---|
| `zone.tom.b56` | h ∈ [25, 75] over the tom (plan position over the rim, ±40 drawing default) | "at top drum heads" | CONFIRMED | S-B56A-UG, S-SM57-UG |
| `zone.tom.shared` | between a pair of toms, h ∈ [25, 75] above the heads, plan point on the segment joining the two batter centres, outside both stick zones | at both heads | CONFIRMED (position words + same height row) | S-B56A-UG, S-LIVE (Position E), S-REC |
| `zone.tom.e904` | clamped to the rim, h ∈ [30, 50] | axis 30–60° from n | CONFIRMED | SN-904-2019 |
| `zone.tom.dm20` | h ∈ [38.1, 76.2]; axis never parallel to the head (angle between axis and head plane > 0; drawing default 45° from n) | toward the head | CONFIRMED | EW-DM20 |
| `zone.tom.audix` | grille bottom 25.4–50.8 above the head | "pointed towards the center" | Audix sheet (not in lesson) | AX-D2, AX-D4 |
| `zone.tom.inside` | inside the shell, pointing up at the batter; ONLY when the state `bottomHeadRemoved = true` and `playerApproved = true` | up at the batter | CONFIRMED (Shure); lesson's consent condition | S-B56A-UG, S-LIVE |
| `zone.tom.bottom.dm20` | RM1 on the bottom hoop, below the resonant head; distance UNKNOWN (drawing default 30–80 below) | up at the resonant head | position SOURCED, distance UNKNOWN | EW-DM20 |

Aim control: target point P(t) = rim point + t·(centre − rim point), t ∈ [0, 1]. Tendency text
(no curve): t → 0 "higher pitch attack", t → 1 "low end, more boomy" (DPA-TOMS words).

Default zone for the learner: `zone.tom.b56` (one current maker guide, stated reference).

## 6. Keep-outs

| Keep-out | Region | Status |
|---|---|---|
| `ko.tom.head[i]` | each batter disc + 20 above | drawing default |
| `ko.tom.stick[i]` | the drummer-facing half of each tom (plan sector centred on the throne direction ±90°), up to 400 above the head | ILLUSTRATIVE |
| `ko.cym` | each cymbal's disc ± its swing (see `kit/GEOMETRY_PROPOSAL.md`) | drawing default |
| `ko.ft.leg` | the drummer's right leg volume beside the floor tom (box: x ∈ [−700, −250], z ∈ [120, 300], from the floor to h = 600) | ILLUSTRATIVE |
| `ko.tom.mount` | arms and clamps | drawing default |

## 7. Readouts

Height above head; horizontal distance from rim; aim angle from n; aim target t (rim↔centre);
for a shared mic the two path lengths and their difference (Δt via `SOURCES_SHARED.md` §1); the
angle from the mic's rear axis to the nearest cymbal edge compared with the pattern null.

## 8. Invariant tests

- Each rack tom's lowest point is above the kick top (569.8 mm above the floor) — DERIVED check.
- `zone.tom.inside` is reachable only when `bottomHeadRemoved` and `playerApproved` are true.
- DM20 zone rejects an axis parallel to the head.
- Floor tom has 8 rods; tom rods equally spaced.

## 9. UNKNOWNS for the owner (drawing defaults above)

1. Rack-tom heights, tilt and mount arms (850 mm, 15°). 2. Floor-tom head height (620 mm) and leg
geometry. 3. Rack-tom rod count (6). 4. Beta 56A outline. 5. Bottom-mic distance for the DM20
bottom mount. 6. Whether M01 adopts the 5-piece plan.
