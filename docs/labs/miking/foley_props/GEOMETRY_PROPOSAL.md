# F03 Props and Object Handling: GEOMETRY PROPOSAL

Status: PROPOSAL. Frame F, stage, performer, mics, mounts: `foley_footsteps/GEOMETRY_PROPOSAL.md` (reuse).
**No source gives a distance for any prop** → every distance below is a drawing default (`placeholder: true`),
shown in the app only as a suggested starting point in plain words (owner decision O-6: accept defaults, or show
aim-only starts with no number).

## 1. Props (NEW art in `lessons/shared/foley/props.tsx`, real objects)

| Prop | Model (drawing default dimensions) | Sound-leaving parts (tap to name, MEET IT) | Keep-outs |
|---|---|---|---|
| Key ring | ring Ø 30 mm, 4 keys ~55 mm; held at hand level ~1000 mm above the floor | jingle (keys against keys), insertion, turn | hand arc (shared arm reach) |
| Paper | A4 sheet 210 × 297 mm on a table 750 mm high | bend/friction line, fold, set-down | sheet flutter zone (sheet length) |
| Door / drawer | Foley door on a stand: leaf 800 × 2000 mm, handle at 1000 mm; drawer 450 wide × 400 deep travel | handle, latch, hinge, panel, frame, final contact | **swing arc** (radius = leaf width, 0–90°) and **pinch zones** at hinge and latch edge — the existing `sweep` keep-out shape; drawer travel = box |
| Chair / furniture | chair 450 × 450 seat, 900 high; floor contact points | scrape, set-down, structural rattle | lift/drag path box |

All dimensions UNKNOWN in the sources (common-object sizes; drawing defaults). The door swing is the safety model
(L49: no equipment in the swing; never a mic on the moving door) and drives `nearestClear`.

## 2. Zones (aim targets first; distance = capsule → the named part)

| Zone id | Geometry | Class | Role |
|---|---|---|---|
| `zone.f03.whole` | the whole action from outside the travel: r = 1200, aim at the prop's centre | drawing default (method L19 "first cover the complete action") | **ONE MIC** (worked example) |
| `zone.f03.detail` | aimed at the handle/latch or the key jingle, r = 450, outside the swing/hand arc | drawing default (method L13/L19) | **CLOSE · LIVE** |
| `zone.f03.room` | r = 2500, includes the object and room (Malcolm/White "not too close") | drawing default (method OUP-MW) | **FARTHER BACK · STUDIO** |
| `pair.f03.closeRoom` | detail + room, recorded separately (L28) | method SOURCED (ASE-CROSS, HECKER) | **TWO MICS** |
| `zone.f03.panel` | aimed at the moving panel/frame (resonance) | drawing default | ANOTHER START |

Variants: `keys`, `paper`, `door`, `drawer`, `chair`; `live` (ENO-style booth at stage left with prop table, PA,
wedge in the mic's rejection — S-3REASONS).

## 3. Readouts
Distance to the selected part, arrival angle, inverse-square difference between the latch and the far panel edge
(why a close mic "hears a click, not the door"); TWO MICS Δt/comb while the learner scrubs the door angle (the
latch moves; no loop).

## 4. Owner list
O-6 default distances for props (none published) · door/drawer art · live booth art.
