# F02 Clothing and Body Movement: GEOMETRY PROPOSAL

Status: PROPOSAL. Frame F and the Foley stage, performer, mics and mounts: `foley_footsteps/GEOMETRY_PROPOSAL.md`
§1–§4 (reuse; nothing duplicated). Value classes and voice rules as there.

## 1. Scene
- Origin = the centre of the **active fabric** (sleeve-against-torso point, or the held garment's flex point).
- Performer (shared performer, new poses `holdGarment` — fabric held at chest height in both hands — and `wearJacket`
  — arm swing). A garment as a real object: a jacket (leather variant) and a sheet of bedding (the bed-scene card).
- **Gesture envelope** (keep-out): the swept arc of the hands and garment, drawn from the pose's shoulder point with
  arm reach = drawing default 750 mm (adult arm, `placeholder`); plus the body column. Lesson L8: the garment must
  not brush mic, mount, cable or stand — the collision test uses this envelope.
- Variants: `held` (artist seated or standing, fabric at chest height), `worn` (walking in place), `live`
  (performance station + PA + wedge, as F01 live).

## 2. Zones (capsule → active fabric)

| Zone id | Geometry | Class | Role |
|---|---|---|---|
| `zone.f02.garment` | r ∈ [1000, 1500], in front, slightly above, aimed down at the active fabric | SOURCED (FF-CLOTH) | **ONE MIC** (worked example) |
| `zone.f02.close` | r ∈ [400, 600] just outside the gesture envelope | drawing default — no source gives a close distance (L13) | **CLOSE · LIVE** (owner decision O-5) |
| `zone.f02.rain` | r up to 3000 (rain-cover texture) | SOURCED (FF-CLOTH) | ANOTHER START |
| `pair.f02.closeRoom` | `zone.f02.garment` mic + a room LDC farther back (drawing default 3000 mm) for an interior | SOURCED method (HECKER) | **TWO MICS** (`setupPairs`, logged) |
| `boom.f02.over` | pole boom over or to the side of a short travel area, tip ≥ the envelope + 150 mm | method PRACTICE (L22); clearance drawing default | ANOTHER START (boom) |

FARTHER BACK · STUDIO = `zone.f02.rain` (clearly farther than ONE MIC). Heights: drawing default 1500 mm capsule for `held`
(aim down ~30°), none sourced.

## 3. Teaching cards (read steps, no new geometry)
- **"Two different problems"**: a Foley cloth pass (wanted, miked from outside) vs dialogue-lav rustle under fabric
  (unwanted; a boom for bed scenes — HAYES). Plan view: lav point on the chest under the drawn fabric layer, boom
  above. Uses Lab 7's future `body` mount only as a drawing (no placement).
- Shock mount + cable strain relief callouts on the stand mic (mechanical paths).

## 4. Readouts
Distance, arrival angle, inverse-square spread between the nearest and farthest point of the gesture arc; TWO MICS Δt
+ comb ("movement makes any alignment only locally true", L30 — the comb redraws as the learner scrubs the gesture
point along the arc; no loop).

## 5. Owner list
O-5 close-detail default distance (none published) · O-3 people art (artist holding/wearing clothes) · bed-scene
card wording.
