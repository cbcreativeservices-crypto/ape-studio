# I01a Hi-Hat: GEOMETRY PROPOSAL (one model, two views + a hat close view)

Status: PROPOSAL for review. No app code. Sources: `hihat/SOURCES.md` (§0 = the Lab 2 key
register). Value classes as in `snare/GEOMETRY_PROPOSAL.md`: **SOURCED** · **DERIVED** ·
**TRIAL** · **UNKNOWN** · **DRAWING DEFAULT** (= "drawing default, not a published figure",
`placeholder: true`, never a readout). ILLUSTRATIVE = a layout choice (kit plan).

**Reuse, do not redraw.** The hat, its stand, clutch, rod, air-burst ring and the kit around it
already exist in branch `miking-w2`: `lessons/shared/cymbals/cymbalSpec.ts` (`HIHAT_14`,
`HIHAT_HARDWARE`, `hihatAirRing`, `cymbalSolid`, `cymbalFrame`, `surfaceHeight`) and
`lessons/shared/kitPlanModel.ts`. This lesson adds zones, the stick/hand envelope, the
gap-plane rule and the under-hat position. Nothing below changes a family number.

## 1. Frame

KIT frame K (`kick/GEOMETRY_PROPOSAL.md` §1): mm, origin kick batter centre, +x audience, +y
down, +z drummer's right, floor y = 290.4, height h ↦ y = 290.4 − h. Hat close view: the cymbal
frame of `cymbalSpec.ts` (origin = centre of the top cymbal's edge plane, n up, e1 audience, e2
drummer's right; tilt 0).

## 2. Anchors (from the kit plan, ILLUSTRATIVE positions; SOURCED sizes)

| Anchor | Value (K, mm) | Class | Source |
|---|---|---|---|
| `hh.c` top-cymbal edge-plane centre | (−470, h 850, −650) | ILLUSTRATIVE (h inside YMH-HHS 80–92 cm) | kitPlanModel `KIT_CYMBALS.hihat` |
| diameter / radius R | 355.6 / 177.8 | SOURCED | ZIL-K |
| bell top | h 850 + 28.448 = 878.448 | DRAWING DEFAULT (8 % rise) | cymbalSpec |
| bell radius | 35.56 (20 % of Ø / 2) | DRAWING DEFAULT | cymbalSpec |
| bottom cymbal edge plane | closed: h 850; open: h 850 − 12.7 | TRIAL (S-LIVE ½ in) | cymbalSpec `openGap` |
| `snare.c` | (−390, h 640, −330) | ILLUSTRATIVE | kitPlanModel |
| `u_snare` (plan unit, hat → snare) | (0.24254, 0.97014) = (80, 320)/329.85 | DERIVED | |
| `hh.edge.farFromSnare` | c − R·u_snare = (−513.12, h 850, −822.49) | DERIVED | S-REC1 "edge on the far side, away from the snare" |
| `hh.edge.awayFromDrummer` | c + R·e1 = (−292.2, h 850, −650) | DERIVED | S-LIVE "over edge away from drummer" |
| `hh.strike` (stick spot) | r = R − 25 = 152.8 (DPA 2–3 cm → midpoint 25), plan direction toward the throne: u_thr = (−300, 540)/617.7 = (−0.48566, 0.87420) → (−544.21, h ≈ 852, −516.42) | r SOURCED (DPA-HH); direction DRAWING DEFAULT | DPA-HH |
| clutch | Ø 26 × 70 above the top bell; pull rod Ø 7 to the pedal | DRAWING DEFAULT | cymbalSpec |
| stand / pedal | stand hub under c; footboard toward the throne, 300 × 90 on the floor | DRAWING DEFAULT | — |

## 3. Starting-point zones (shown to the learner only as "suggested starting points")

| Zone id | Region (K) | Class | Source |
|---|---|---|---|
| `zone.hh.dpa` | mic.ref 50–100 above the TOP surface at the point below it (h = 850 + s(r) + [50, 100], s = `surfaceHeight`); plan position anywhere over the pair whose line of sight to `snare.c` is blocked by the pair (DERIVED test: the segment mic.ref → snare.c crosses the pair slab) | SOURCED band + DERIVED visibility rule | DPA-HH "5-10 cm from the top"; "an angle where you can't see the snare drum" |
| `zone.hh.shure.rec1` | mic.ref directly above `hh.edge.farFromSnare`, 100–150 above it: (−513.12, h 950…1000, −822.49); axis straight down (−n) | SOURCED (distance read as height above the edge) | S-REC1 |
| `zone.hh.shure.recbk` | any mic.ref within 101.6 of the top-cymbal surface, outside `ko.air` | SOURCED radius | S-RECBK "within four inches to the cymbals" |
| `zone.hh.shure.live` | tag above `hh.edge.awayFromDrummer`, aim down; "a few inches" → band 50–100 above the edge | words SOURCED; band DRAWING DEFAULT | S-LIVE item 5 |
| `zone.hh.shure.cup` | tag "a few inches above", aimed at r 36–60 ("just below the cup") | words SOURCED; band DRAWING DEFAULT | S-RHYTHM |
| `zone.hh.e914` | above the outer edge band r 150–177.8, 40–60 above the edge plane (clears the 30 mm air-ring top), aim down | words SOURCED ("a few centimetres above the outer edge … aiming down"); band DRAWING DEFAULT | SN-E914 Pos. A |
| `zone.hh.under` | under the bottom cymbal, aimed up, r 100–150 on the audience side (θ −45°…+45° from e1), 40–80 below the bottom edge plane; mount = clip on the stand tube (U-CLIP type) | position DRAWING DEFAULT; option SOURCED | DPA-HH 4099 + U-CLIP |
| `zone.hh.overheadOnly` | no hat mic; the M09 overheads | SOURCED option | S-RECBK, S-REC1, S-BEYOND |
| `zone.hh.shared` | the M02 snare mic re-aimed: (a) null toward the hat, or (b) angled slightly toward the hat | SOURCED (both) | S-LIVE |

The edge-vs-centre aim control is a separate variable (DPA: lower toward the edge, higher
overtones toward the centre; LW-040 "vary between center and edge"): the aim point slides on the
top surface from r = R − 25 (edge band) to r = 36 (cup), words only.

## 4. Keep-outs and envelopes

| Keep-out | Region | Class | Source |
|---|---|---|---|
| `ko.air` | the family's air-burst ring: annulus r ∈ [177.8, 237.8], from the bottom cymbal to 30 above the top one | DRAWING DEFAULT (60 wide, 30 above) | cymbalSpec `hihatAirRing`; DPA-HH "air pressure moving out from the sides"; SN-E914 "strong air current … on the edge" |
| `ko.gapPlane` | lesson rule: capsule never in the plane of the opening — a slab h ∈ [850 − 12.7 − 15, 850 + 15] for r > 150 (merged with `ko.air`) | lesson rule; ±15 DRAWING DEFAULT | lesson L49 |
| `ko.pair` | the pair slab + its open travel (12.7) + top-cymbal rock ±4° about the clutch (±12.4 at the edge, DERIVED 177.8·sin 4°) | rock angle DRAWING DEFAULT | lesson L11 ("rocking motion") |
| `ko.stick` | sector: from the drummer's hand (drawing default (−700, h 1000, −430)) to `hh.strike`, swept ±15° in plan and up to 406.4 (stick length) above the strike point | length SOURCED (VF-5A, TRIAL any stick); geometry ILLUSTRATIVE | VF-5A |
| `ko.hand` | capsule r 60 around the stick's grip end along the stick path + forearm (drawing default Ø 90) | ILLUSTRATIVE | lesson L11 |
| `ko.clutch` / `ko.rod` | cylinders r 13 / 3.5 (+ 20 clearance) on the stand axis | DRAWING DEFAULT | cymbalSpec |
| `ko.pedal` / `ko.foot` | footboard box + the left foot (drawing default 280 × 110 × 120 high) | ILLUSTRATIVE | — |
| `ko.snareRim`, neighbour cymbals, overhead stands | from the kit plan | ILLUSTRATIVE | kitPlanModel |

## 5. Readouts (computed from the 3-D model)

grille front to top surface (vertical, mm) · aim angle from straight down · plan radius of the
aim point (edge … cup, in words) · "snare in line of sight: yes/no" (DERIVED test above) · angle
of `snare.c` off the mic axis (vs the chosen pattern's null: cardioid 180°, e 914 "approx. 180°")
· distance to `ko.air` (red at ≤ 0) · path difference hat-mic vs each overhead to `hh.strike` →
Δt (`SOURCES_SHARED.md` §1–2). No spectral curve (lesson rule).

## 6. Invariant tests

- `zone.hh.shure.rec1` mic.ref is 100–150 above `hh.edge.farFromSnare` and its plan point is on
  the far side: (mic − c)·u_snare < 0.
- Example `zone.hh.dpa` point (−491.8, h 935, −737.3) (= c − 90·u_snare, 75 above the surface)
  passes the visibility test: the segment to `snare.c` reaches h 860 at t = 0.254, plan point
  (−465.9, −633.8), 16.7 from c (< 177.8) → blocked.
- No zone intersects `ko.air` or `ko.gapPlane`; `zone.hh.e914` clears the ring's 30-mm top.
- `hh.strike` lies 25 ± 5 inside the edge.

## 7. Owner list

1. Stick/hand envelope shape (ILLUSTRATIVE) and the right-hand cross-over vs open-handed posture.
2. Rock angle (±4°), gap-plane band (±15), air ring (60 × 30): drawing defaults.
3. Show all six close starting points, or only DPA 5–10 cm + Shure 10–15 cm + e 914 tag?
4. Lesson text fix: Shure gives BOTH snare-mic strategies (HH-D2).
