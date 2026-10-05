# M02 Snare Drum: GEOMETRY PROPOSAL (one model, two views)

Status: PROPOSAL for review. No app code. Every number carries a source key from `SOURCES.md`
in this folder (or `kick/SOURCES.md` for shared kit facts). Modelled on
`kick/GEOMETRY_PROPOSAL.md`. Owner ruling 2026-10-04: the learner sees only "recommended
starting points"; provenance stays in the model (`src`, `trial`, `placeholder`) and in these docs.

Value classes (same as the kick):
- **SOURCED** (key given) · **DERIVED** (formula given) · **TRIAL** (a sourced value borrowed
  from another drum or read under an interpretation) · **UNKNOWN**.
- **DRAWING DEFAULT** = a number the picture needs that no source gives. It is marked
  "drawing default, not a published figure", is never shown as a readout, and is flagged
  `placeholder: true` in the model. New in this batch (the task asked for them so the build is
  not blocked); the kick file deliberately left them to the build.

---

## 1. Coordinate system: the KIT frame K (same as the kick)

- Units mm. Origin O = centre of the **kick batter head** (kick `bd.batter.center`).
- +x along the kick axis toward the audience; **+y down** (floor at positive y); +z toward the
  drummer's right. Identical to `kick/GEOMETRY_PROPOSAL.md` §1, so one scene holds every drum.
- Floor: y = **290.4** (the M01 model's `yFloor` PLACEHOLDER: 279.4 + 3 + 8). A height above
  the floor h maps to y = 290.4 − h.
- Plan positions (x, z) come from the shared, ILLUSTRATIVE `KIT_PLAN`
  (`src/screens/lab/miking/lessons/shared/kitPlanModel.ts`, u = x, v = z). Keep them in step.
- Views: as for the kick, the side view is seen from the drummer's right looking toward −z
  (screen X = x, screen Y = y) and the top view looks down +y (screen X = x, screen Y = z).
  Plus a **snare close view** in the snare local frame S (below).

### Snare local frame S
- Origin S0 = centre of the snare batter head.
- n = head normal pointing up (away from the shell). At zero tilt n = −y_K.
- r = radial direction in the head plane; θ = plan angle measured from +x toward +z
  (θ = 0° points at the audience, 90° at the drummer's right).
- Head tilt: **UNKNOWN**; drawing default 0° (flat). If a tilt is added later, rotate S about
  the axis through S0 parallel to z_K.

## 2. Default snare

**14 in × 5.5 in** (355.6 × 139.7 mm, conv.). Sources: Yamaha SBS-1455, TMS-1455, RBS-1455
(YMH-SCB, YMH-TCS, YMH-RCS). It is the size in three current Yamaha lines and the size the
batch brief asks for. Alternatives for a later size switch: 14 × 6.5 (TMS-1465, TAMA-SSC),
14 × 5 (TAMA-SSC).

| Symbol | Meaning | Value (mm) | Class | Source / formula |
|---|---|---|---|---|
| `D_s` | nominal diameter | 355.6 | SOURCED (conv.) | 14 in; YMH-SCB/TCS/RCS |
| `R_s` | radius used for head edge and shell | 177.8 | TRIAL | D_s/2; real shell OD UNKNOWN (same simplification as the kick) |
| `H_s` | batter plane to snare-side plane | 139.7 | TRIAL | 5.5 in nominal depth |
| `t_shell` | shell wall | 5.6 | SOURCED | TMS-1455 "6-Ply, 5.6 mm" |
| `N_rods` | tension rods per head | 10 | SOURCED, interpreted | "Regular hoop (10 hole)" / "Inverse DynaHoop (10 hole)" |
| `phi0` | phase of the rod pattern | UNKNOWN | UNKNOWN | drawing default: a rod centred on the strainer side? not sourced → draw rods at θ = 18° + k·36° |
| `t_hoop` | hoop gauge | 2.3 | TRIAL | Tour Custom TT/FT hoop "2.3 mm" (not the snare's own figure) |
| `h_hoop` | hoop height above the head plane | UNKNOWN | drawing default **10** | none |
| `N_wires` | wire strands | 20 | SOURCED | TMS-1455 "20-Strand" (25 on RBS-1455) |
| wire span | length/width of the wire set | UNKNOWN | drawing default: width 75, length 0.9·D_s = 320 | none |
| strainer / butt | positions on the shell | UNKNOWN | drawing default: strainer at θ = 270° (drummer's left, facing the hi-hat side is common but not sourced), butt at θ = 90° | none |
| `h_S0` | batter height above floor | UNKNOWN | drawing default **640** → S0.y = 290.4 − 640 = **−349.6** | none |
| plan centre | (x, z) of S0 | (−390, −330) | ILLUSTRATIVE | `KIT_PLAN.snare.c` |

## 3. Named anchors

| Anchor id | Position in K (x, y, z) mm | Class | Source |
|---|---|---|---|
| `sn.batter.center` | (−390, −349.6, −330) | ILLUSTRATIVE + drawing default | §2 |
| `sn.batter.rim` | circle radius 177.8 about S0 in the head plane | TRIAL | §2 |
| `sn.hoop.top` | plane at 10 above the batter plane | drawing default | — |
| `sn.reso.center` | (−390, −349.6 + 139.7, −330) = (−390, −209.9, −330) | DERIVED | H_s |
| `sn.reso.rim` | circle radius 177.8 at y = −209.9 | TRIAL | |
| `sn.wires` | rectangle 320 × 75 under the snare-side head, centred, long axis strainer↔butt | drawing default | none |
| `sn.strainer`, `sn.butt` | on the shell at θ = 270° / 90° | drawing default | none |
| `sn.rod.batter[k]`, `sn.rod.reso[k]` | θ = 18° + k·36°, k = 0…9 | SOURCED count, drawing-default phase | |
| `sn.stand` | tripod under S0; leg spread and basket UNKNOWN | drawing default | none |
| `sn.strike.center` | S0 | definition | the target "toward the center" (AX-DPE8, AX-I5, S-REC1) |
| `sn.dirTo.hihat` | unit vector from S0 to the hi-hat centre (−470, ·, −650): plan angle θ ≈ 256° (DERIVED from KIT_PLAN) | DERIVED | |
| `sn.dirTo.throne` | plan angle θ ≈ 150° (DERIVED from KIT_PLAN) | DERIVED | |
| `sn.dirTo.rackTom` | plan angle θ ≈ 19° (DERIVED from KIT_PLAN) | DERIVED | |

## 4. Microphone outlines (simplified silhouettes at sourced sizes)

| Size set | Shape | Dimensions (mm) | Weight | Pattern (maker) | Source |
|---|---|---|---|---|---|
| SM57 type (generic end-address dynamic, small) | stepped cylinder | length 157; front Ø 32; tail Ø 23 | 284 g | "Cardioid" | S-SM57-UG p.6 drawing |
| i5 type | tapered cylinder | length 141.5; top Ø 37.5; base Ø 23 | 248 g | "Cardioid" | AX-I5 |
| e 904 type (compact clamp-on dynamic) | short cylinder on a rim clamp | Ø 41, length 63; clamp outline UNKNOWN | 125 g | "cardioid" | SN-904-2019 p.6 |
| Beta 56A type (supercardioid, stand adapter) | body + integral swivel | dimensions UNKNOWN (Shure guide gives none; product data empty) | 468 g | "Supercardioid", null "120° toward the rear" | S-B56A-UG |

`mic.ref` = centre of the grille front face; `mic.axis` = aim vector (kick §5 convention). All
distances are labelled "grille front to …" (lesson's acoustic-centre caveat, kick L39).

## 5. Recommended starting-point zones (from the lesson's numbers, each verified)

Heights h are measured along n from the batter-head plane (the rim top is h_hoop = 10 above it,
drawing default). "Over the rim" = the mic.ref plan position lies within ±40 mm (drawing default)
of the rim circle r = 177.8, on the approach side.

| Zone id | Region | Aim | Verified | Source |
|---|---|---|---|---|
| `zone.top.sm57` | over the rim, h_rim ∈ [25, 75] above the rim top (Shure: "2.5 to 7.5 cm (1 to 3 in.) above rim of top head") | at the head ("Aim mic at drum head") | CONFIRMED | S-SM57-UG p.3 |
| `zone.top.i5` | over the rim, h ≈ 50.8 above the rim (archived sheet) / above the head (current sheet) | toward the centre | CONFIRMED / DIFFERENT (D-S1) | AX-DPE8, AX-I5 |
| `zone.top.e904` | clamped to the rim; h ∈ [30, 50] above the head | axis 30°–60° from n (the head normal) | CONFIRMED; angle reference read from the figure | SN-904-2019 p.4 |
| `zone.top.far` | mic.ref ≈ 101.6 from the nearest point of the batter-head disc ("a good 4 inches"; draw a marker band 100–150) | "angled toward the center" | CONFIRMED with detail | S-SM57-ART, S-REC1 |
| `zone.bottom` | below the snare-side head, "just below rim of bottom head": plan position near the rim, h below the snare-side plane: **drawing default 30–80**, clear of `sn.wires`, strainer and stand | up at the snare-side head and wires | position SOURCED, distance UNKNOWN | S-SM57-UG p.3; SN-904-2019 p.4 (Position C) |
| `zone.shared.hh` | a few inches from the snare edge toward the hi-hat side, aimed between | snare + hi-hat | SOURCED words, no number | S-LIVE placements 5 and 6 |

Approach side (where the stand comes from): S-LIVE "Coming in from front of set on boom". Draw
the default mic at plan angle θ = −30° (front-left, between the hi-hat and the rack tom) —
**drawing default, not a published figure.**

Starting point shown to the learner (owner ruling): ONE zone per chosen mic type, worded "start
here, then move and listen". The internal default pick: `zone.top.sm57` (the only number that is
in a current maker user guide with a stated reference surface).

## 6. Keep-out zones

| Keep-out id | Region | Status |
|---|---|---|
| `ko.sn.head` | the batter disc r ≤ 177.8 plus 20 above it (stick tip and head motion) | drawing default |
| `ko.sn.stick` | the player's sector: plan angles θ ∈ [60°, 240°] (centred on the throne direction 150°), from the head plane up to 400 above it, out to r = 177.8 + 60 (rimshot reach) | ILLUSTRATIVE, drawing default (no source gives a stick envelope; lesson L89) |
| `ko.sn.wires`, `ko.sn.strainer`, `ko.sn.stand` | from §3 | drawing default |
| `ko.hihat` | hi-hat cymbals ± open travel; see `kit/GEOMETRY_PROPOSAL.md` | drawing default |
| `ko.rackTom` | rack tom and its mount | drawing default |

## 7. Readouts (from the 3-D model; labels say what they measure)

| Readout | Formula |
|---|---|
| Height above the rim | (mic.ref − S0)·n − h_hoop |
| Horizontal distance from the rim | |r_plan(mic.ref)| − 177.8 (negative = over the head) |
| Aim angle from the head normal | angle between −mic.axis and n (e 904 convention: 30–60°) |
| Hi-hat angle off the rear axis | angle between −mic.axis and (hihat.center − mic.ref); compare with the pattern null (cardioid 180°; Beta 56A type "120°") |
| Top/bottom path difference to S0 | |top.ref − S0| − |bottom.ref − sn.reso.center| → Δt via `SOURCES_SHARED.md` §1 (polarity drawn separately from delay) |

## 8. Invariant tests

- 10 rods per head, 36° apart. Wires lie on the snare-side head, not the batter.
- `zone.top.sm57` heights are 25–75 above the rim top; `zone.top.e904` 30–50 above the head and
  30–60° from n.
- `zone.bottom` never intersects `sn.wires`, strainer or stand.
- No readout reads a DRAWING DEFAULT or UNKNOWN value (h_hoop is only used to place the rim).

## 9. UNKNOWNS for the owner (each has a drawing default above)

1. Snare head height above the floor and tilt (default 640 mm, 0°).
2. Hoop height above the head (default 10 mm); snare hoop gauge (TRIAL 2.3 mm).
3. Wire-set size and strainer side (default 320 × 75 mm, strainer drummer's left).
4. Bottom-mic distance below the snare-side head (default 30–80 mm; Shure says only "just below rim").
5. Stick / rimshot / cross-stick envelope (default sector above).
6. Beta 56A outline (no dimensions published in the guide).
Lesson fixes are listed in `BATCH1_RESEARCH_SUMMARY.md`.
