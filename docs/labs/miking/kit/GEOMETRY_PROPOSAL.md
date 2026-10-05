# M11 Complete Drum-Kit Setups: GEOMETRY PROPOSAL (the shared 5-piece kit plan)

Status: PROPOSAL. No app code. This file is the **single kit plan** for M01–M03 and M09–M11.
Value classes / DRAWING DEFAULT rule: header of `snare/GEOMETRY_PROPOSAL.md`. Sources:
`kit/SOURCES.md` (sizes), and the per-drum files.

## 1. Frame

KIT frame K = the kick frame (`kick/GEOMETRY_PROPOSAL.md` §1): origin O = kick batter-head
centre; +x toward the audience; **+y down**; +z toward the drummer's right. Floor y = 290.4 (M01
`yFloor` PLACEHOLDER). Height above floor h ↦ y = 290.4 − h. Plan (x, z) = `kitPlanModel.ts`
(u, v). Right-handed layout; left-handed = mirror z (z ↦ −z).

## 2. Kit plan (5-piece + 4 cymbals)

Sizes are SOURCED (`kit/SOURCES.md`). Plan positions are ILLUSTRATIVE (existing `KIT_PLAN` where it
already has the part; new parts are drawing defaults). Heights h are drawing defaults, not
published figures, except where a Yamaha stand range bounds them.

| Part id | Size (mm) | Plan (x, z) | h (mm) | Tilt | Notes |
|---|---|---|---|---|---|
| `kick` | Ø 558.8 × 457.2 | axis from (0, 0) to (457.2, 0) | centre 290.4 | 0 | M01 (owner-approved) |
| `kick.pedal` | M01 placeholder box | x ∈ [axle −230, axle +40], z = 0 | floor | — | M01 |
| `throne` | seat r 175 (`KIT_PLAN`) | (−770, −110) | seat **500** | — | drawing default |
| `snare` | Ø 355.6 × 139.7 | (−390, −330) | batter **640** | 0° | `KIT_PLAN.snare`; snare file |
| `tom1` (10 in) | Ø 254.0 × 177.8 | (130, −280) | batter **850** | 15° to drummer | new; toms file |
| `tom2` (12 in) | Ø 304.8 × 203.2 | (150, +40) | batter **850** | 15° | moved from M01's (140, −150), owner to confirm |
| `floorTom` (16 in) | Ø 406.4 × 406.4 | (−360, 380) | batter **620** | 0° | `KIT_PLAN.floorTom`; 3 legs |
| `hihat` | Ø 355.6 pair | (−470, −650) | top cymbal **850** (inside Yamaha "80-92cm") | 0° | `KIT_PLAN.hihat`; closed gap 0; open gap **12.7** TRIAL (Shure's "1/2" apart") |
| `hihat.pedal` | `KIT_PLAN.hihat.pedal` | u −760…−500, v −590, halfW 45 | floor | | |
| `crash1` (16 in) | Ø 406.4 | (−80, −560) | **1150** (inside "94-175cm", CS-865) | 15° toward drummer | new |
| `crash2` (18 in) | Ø 457.2 | (250, +360) | **1200** | 15° | new |
| `ride` (20 in) | Ø 508.0 | (−80, +640) | **1000** | 10° | new |
| stands | tripods; boom arms to each cymbal | bases drawing default | — | — | Yamaha: 3 legs |
| `drummer` | body capsule; head top h 1300, right shoulder (−700, h 1150, 90) | | | | drawing default (overheads file) |

DERIVED clearance checks at the defaults (receipts in the build tests):
- crash1 ↔ hihat plan distance 400.2 > 203.2 + 177.8 = 381.0 (no overlap in plan).
- crash1 ↔ tom1 plan distance 350.0; crash1 sits 300 above tom1's batter.
- crash2 ↔ tom2 plan distance 335.3; crash2 sits 350 above tom2's batter.
- ride ↔ floorTom plan distance 382.1; ride sits 380 above the floor-tom batter.
- tom2 lowest point 614.3 > kick top 569.8 (toms file §2).

## 3. Cymbal model (drawing defaults)

Each cymbal: disc of the sourced diameter, profile height 8 % of diameter (drawing default),
bell diameter 20 % of diameter (drawing default), thickness not drawn (UNKNOWN). Swing envelope for
keep-outs: ± 60 mm at the edge (drawing default). Hi-hat: two identical discs; air-burst keep-out
= a ring 60 mm wide around the pair's edge, from the bottom cymbal to 30 above the top (DPA-HH:
air "moving out from the sides"); drawing default width.

## 4. Channel-plan builder (stage stepper)

Each stage reuses the per-source zones; no new placement numbers.

| Stage | Channels (maker-documented sets) | Zones used |
|---|---|---|
| 1 mic | overhead (S-REC "One"); or live Placement 1 (S-LIVE) | overheads §2.1 |
| 2 mics | kick + overhead (S-REC "Two"); live 1 + 3, or 3 + 6 (S-LIVE) | kick zones + OH; S-LIVE 6 = shared snare/hi-hat/high-tom mic |
| 3 mics | kick + snare + overhead (S-REC "Three"); live 1, 2, 3 or 3, 6, 7 (S-LIVE); Glyn Johns 3-mic (M09) | + snare `zone.top.sm57`; S-LIVE 7 = one mic just above the floor tom aimed up at cymbals and one high tom |
| 4 mics | + hi-hat (S-REC "Four"); two OH + kick + snare (lesson L18); Glyn Johns 4-mic | + `zone.hh` below |
| 5+ | + toms (S-REC "Five"); the DP Elite 8 8-mic set (AX-DPE8) | toms zones |

Hi-hat zone `zone.hh`: mic.ref 50–100 above the top hi-hat cymbal (DPA-HH "5-10 cm from the top of
the hi-hat cymbal"), outside the air-burst ring, on the side away from the snare (DPA-HH) / "over
edge away from drummer" (S-LIVE); Shure recording booklet: "within four inches" (≤ 101.6).

Live scene: S-LIVE Placement 6 position = "a few inches from snare drum edge, next to high tom, just
above top head of tom … from front of the set on a boom" (drawing default: 75 from the snare rim
toward tom1, 40 above tom1's batter). Placement 7 = "grille just above floor tom, aiming up toward
cymbals and one of high toms" (drawing default: 60 above the floor-tom batter at its front edge).

## 5. Routing matrix and counters

Rows = channels; columns = PA, monitors, record, broadcast (lesson L67). Default: room channel off
PA and monitors (lesson L48). Counters: channels, stands, inputs, open mics — computed from the plan.
No number on screen is a "recommended count" (lesson L69).

## 6. Invariant tests

- Every part's size equals its `kit/SOURCES.md` row; layout positions carry `illustrative: true`.
- No cymbal disc intersects another cymbal or drum at the defaults (plan + height check).
- Hi-hat top-cymbal height inside 800–920; cymbal heights inside 940–1750 (Yamaha CS-865 range),
  flagged Medium (measured point not stated).
- Left-handed mirror maps every z to −z and keeps the kick axis at z = 0.

## 7. UNKNOWNS for the owner

1. All heights and tilts (drawing defaults above). 2. Whether M01 adopts the 5-piece plan (tom2
moves). 3. Cymbal profiles. 4. Throne height and the drummer body envelope. 5. Ride 20 in (sourced)
vs 22 in (not verified today).
