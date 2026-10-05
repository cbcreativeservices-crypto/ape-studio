# M09 Drum Overheads (incl. Glyn Johns): GEOMETRY PROPOSAL

Status: PROPOSAL. No app code. Value classes and the DRAWING DEFAULT rule: see the header of
`snare/GEOMETRY_PROPOSAL.md`. Frame: KIT frame K (kick frame; floor y = 290.4; a height above the
floor h ↦ y = 290.4 − h). Sources: `overheads/SOURCES.md`. Kit anchors: `kit/GEOMETRY_PROPOSAL.md`.
All numbers below were computed with the formulas shown (receipts reproducible).

## 1. Fixed anchors used by every overhead technique

| Anchor | K position (x, y, z) mm | h above floor | Class |
|---|---|---|---|
| `sn.batter.center` = S0 (default snare "target spot") | (−390, −349.6, −330) | 640 | ILLUSTRATIVE plan + drawing-default height (snare file) |
| `kick.batter.center` = O | (0, 0, 0) | 290.4 | kick frame origin |
| `ft.batter.center` | (−360, −329.6, 380) | 620 | toms file (drawing default) |
| `ft.rim.top` | rim circle R 203.2 at h 630 | 630 | drawing default (h_hoop 10) |
| `drummer.headTop` | (−720, −1009.6, −110) | 1300 | drawing default, not a published figure (seated) |
| `drummer.shoulderR` | (−700, −859.6, 90) | 1150 | drawing default, not a published figure |
| `kit.audioCentreLine` | the line through O and S0 (plan) | — | SOURCED idea (S-OH-MM); positions ILLUSTRATIVE |
| `room.ceiling` | y = 290.4 − 3000 = −2709.6 | 3000 | drawing default (Shure's 2–3 m overhead range must fit, S-REC1) |

## 2. Technique geometries (starting points)

### 2.1 Mono overhead (S-LIVE Position A)
- mic.ref over the kit centre, "about 1 foot above drummer's head": h = 1300 + 304.8 = **1604.8**
  (DERIVED from the drawing-default head + SOURCED 1 ft) → y = −1314.4.
- Plan point: midpoint of O and S0 = (−195, −165) (drawing default for "center of drum set").
- Aim: straight down (drawing default). Shure's comment: for cymbals only, roll off lows.

### 2.2 X/Y (coincident)
- Pair centre directly above the snare (S-5TECH): plan (−390, −330); height drawing default =
  the mono height 1604.8 (S-LIVE Position A covers "crossed microphones" too) → y = −1314.4.
- Included angle **90°** (DPA-STEREO, common); allowed 90°–135° (S-REC); warn above 135°
  (S-OH-MM). Bisector aimed at S0. Capsules coincident, **not touching** (DPA-STEREO): drawing
  default gap 5 mm between bodies.

### 2.3 ORTF (near-coincident)
- Capsule spacing **170 mm**, included angle **110°** (S-5TECH). Same centre and height as X/Y.
- Alternatives logged: 152.4 mm (S-COMMON "six inches"), 177.8 mm (S-LIVE "7-inch").

### 2.4 A/B spaced pair
- Rule: each capsule equidistant from S0 (DPA-KIT, S-OH-MM, S-5TECH). Start distance
  **1219.2 mm** ("4 feet is a good starting point", AX-DPE8 SCX1C tip), capsules vertical.
- Default plan points (drawing default): (−150, −930) and (−150, +270), i.e. 240 mm in front of
  the snare and ±600 mm across the kit. Plan distance to S0 = 646.2 → height above S0 =
  √(1219.2² − 646.2²) = 1033.9 → h = **1673.9**, y = **−1383.5** for both (DERIVED).
- Mike Major's height offset option: one mic lower by 50.8–254.0 mm (S-OH-MM) — a control,
  not a default.
- Shure's overall overhead band: 2000–3000 mm above the floor (S-REC1, minimal approach). The
  default 1673.9 sits below it; that matches S-REC1's note that overheads "work better closer to
  the kit" in a close-mic multitrack. Show the 2–3 m band as a second starting zone.

### 2.5 Mid-Side
- Mid capsule and Side figure-8 coincident at the X/Y centre; Mid aimed at S0, Side axis along ±z.
- Decode: L = M + S, R = M − S (UA-MS procedure); mono L + R = 2M.

### 2.6 Recorderman (S-5TECH)
- Mic A: S0 + 812.8 straight up → **(−390, −1162.4, −330)**, h 1452.8, aimed straight down.
- Mic B: on the circle {|B − S0| = 812.8} ∩ {|B − O| = |A − O| = 1269.7}, the point nearest the
  drawing-default right shoulder → **(−823.3, −966.3, −25.7)**, h 1256.7, aimed at S0. It lies
  199.9 mm from the shoulder default, behind and above the throne: the clearance check must pass
  before it is accepted.
- The kick reference point for "equally distant from the kick" is UNKNOWN; drawing default = O.

### 2.7 Glyn Johns (RM-GJ + MT-GJ reconciled)
- **Main overhead:** S0 + 1016 straight up (RM-GJ "directly over the snare drum, at a height of
  about 40"") → **(−390, −1365.6, −330)**, h 1656.0, aimed at the target spot (default S0).
  Variant: MT-GJ "around 4 feet (122cm) above the kit" → S0 + 1219.2 up (h 1859.2).
- **Side mic:** height = floor-tom rim + 152.4 (MT-GJ "around 6 inches (15cm) above its rim") =
  h **782.4**; distance to S0 = the main overhead's 1016 (RM-GJ equal distance). Vertical offset
  782.4 − 640 = 142.4 → plan distance √(1016² − 142.4²) = 1005.97 along the plan line from S0
  through the floor-tom centre → **(−347.5, −492.0, 675.1)**, which is 92.1 mm beyond the floor-tom
  rim (DERIVED). Both accounts are satisfied at once: it is "over / adjacent to the floor tom" and
  equidistant. Aim: default at S0 (lesson, RM-GJ target spot); MT-GJ variant aims "towards the
  hi-hat" (−470, ·, −650).
- **Spots:** kick (M01 zones) and optional snare (M02 zones). 3 or 4 mics.
- **Pan (internal, not a rule):** RM-GJ main ≈ 1:30, side hard toward the floor-tom side; MT-GJ
  notes a narrower spread. The app offers "modest, adjustable" pan per the lesson.

## 3. Mic outlines

No models named in the lesson. Use the shared mic family (`BATCH1_RESEARCH_SUMMARY.md` §3):
small-diaphragm pencil condenser (drawing default Ø 21 × 104 mm, Audix SCX1 length "104 mm / 4.1 in"
from AX-DPE8; diameter UNKNOWN), large-diaphragm side-address (SM4: product data width 118.008, height
80.01, depth 254.991 mm, Medium, see `room/SOURCES.md`), figure-8 (drawing default = the large-diaphragm outline),
stereo bar (drawing default 250 mm long).

## 4. Zones, keep-outs and the snare-distance aid

| Id | Region | Status |
|---|---|---|
| `zone.oh.mono` | sphere r = 150 (drawing default tolerance) about §2.1 | SOURCED position words + DERIVED height |
| `zone.oh.xy`, `zone.oh.ortf` | r = 150 about the §2.2 centre | SOURCED geometry, drawing-default height |
| `zone.oh.ab` | for each capsule: the sphere shell |P − S0| ∈ [1219.2 − 100, 1219.2 + 100], above h 1500 | SOURCED distance; tolerance drawing default |
| `zone.oh.gj.main` / `.side` | r = 100 about §2.7 points | DERIVED from SOURCED numbers |
| `zone.oh.recorderman` | r = 100 about §2.6 points | DERIVED |
| `ko.drummer` | a capsule from the throne seat (h 500) to the head top (h 1300), radius 250, plus a stick sphere r = 700 (drawing default) about the shoulders | ILLUSTRATIVE |
| `ko.cymbal[i]` | each cymbal disc ± 60 mm vertical swing (drawing default) | ILLUSTRATIVE |
| `ko.ceiling` | y < −2709.6 + 100 | drawing default |
| `ko.boom` | no boom tip may pass over `ko.drummer` without a counterweighted stand (lesson L10) | rule |

**Snare-distance aid (readout):** for each overhead capsule, |mic.ref − S0| in mm and the
difference between the two; also the same for O (kick) and the hi-hat centre, to show that equal
snare distance does not make the other sources equal (lesson L55). Δt from `SOURCES_SHARED.md` §1.

## 5. Invariant tests

- GJ: |main − S0| = |side − S0| = 1016 ± 0.5 at the defaults; side h = ft rim h + 152.4.
- Recorderman: |A − S0| = |B − S0| = 812.8; |A − O| = |B − O|.
- A/B defaults equidistant from S0 (1219.2).
- X/Y angle ∈ [90°, 135°]; ORTF 170 mm / 110°.
- No capsule inside `ko.drummer`, `ko.cymbal`, `ko.ceiling`.

## 6. UNKNOWNS for the owner (drawing defaults given)

1. Drummer head and shoulder positions (1300 / 1150 mm). 2. X/Y and ORTF height over the snare
(1604.8 mm). 3. A/B plan offsets (±600 across, 240 in front). 4. Kick reference point for
Recorderman (O). 5. Cymbal heights (kit file). 6. Ceiling (3000 mm).
