# B13 Field and Diamond Sports: GEOMETRY PROPOSAL — defines the shared VENUE PLAN builder (frame P)

Status: PROPOSAL. Builds once: `lessons/shared/sports/venuePlan.ts` (+ art). Used by every lesson B09–B17.
It extends Lab 5's seating/stage-plot builder (frame S, `lessons/shared/ensemble/`): same plan view, token and
readout machinery, new layers.

## 1. Frame P (plan, metres)
- Origin and axes per scene; +x along the touchline/sideline, +y into the field, +z up (heights).
- **Layers** (drawn styles, one meaning each): playing area (filled), run-off / free zone / perimeter (hatched,
  "keep clear"), operational routes (dashed: medical, officials, benches, crew lanes, exits), approved footprints (solid
  outline boxes), camera positions + frame cones, crowd sectors, PA positions, target points / target zones, mic tokens
  with aim arrow + ideal pattern overlay, operator turn arc.
- **Readouts (DERIVED)**: plan range, slant range (with source and capsule heights), aim relative to "straight ahead",
  off-axis angle to PA/crowd sector, Δt between two mics for a chosen source point, comb notches (twoMic engine),
  inverse-square level change between target points. All say "calculated from the drawing".
- **Coverage map mode**: each target zone tagged useful detail / ambience only / unavailable, with its handoff source.

## 2. B13 scenes (sport outlines are DRAWING DEFAULTS until each builder reads the rulebook dimension)
| Scene | Outline | Clearance drawn | Class |
|---|---|---|---|
| Practice field | 30 × 20 m rectangle, M (15, −6), E strip, targets A (15, 4), B (5, 10), C (15, 18) | 6 m offset (lesson: hypothetical, not a rule) | TRIAL, CONFIRMED arithmetic |
| American football | 120 × 53⅓ yd field (common dimension, not read today) | team/crew lanes as dashed routes | drawing default |
| Soccer | 105 × 68 m (common, not read today) | goals, nets, flags carry a "no attachments" badge | rule SOURCED (IFAB-L1) |
| Rugby union | 100 × 70 m + in-goal (common, not read today) | perimeter 5 m (min 3.5 men / 3.0 women) drawn as keep-clear | SOURCED WR-L1 |
| Baseball | 90 ft base paths (common, not read today), foul territory marked "may be live ball" | backstop screen = barrier | drawing default |
| Softball | 60 ft base paths (common for fast pitch, not read today), pitcher's circle | as baseball | drawing default |

**The practice field is the Placement Studio scene.** Real-sport scenes are plan illustrations of WHERE approval is
needed and why; mics are drawn only on approved footprints the lesson names (perimeter marks, backstop side, camera
position).

## 3. Starting setups
ONE MIC: perimeter shotgun at M aimed at A (10 m, 0°), capsule 1.2 m. TWO MICS: shotgun + dish at M on A/B/C (sequential
— "do not assume they share a coordinate"). CLOSE · LIVE: plate-area shotgun from behind the backstop (baseball).
FARTHER BACK · STUDIO: fixed XY ambience at E. ANOTHER START: dish at M tracking A→B→C with handoff.

## 4. Practice
Observation sheet rows as the lesson (shotgun A, dish A, B/C, 10/20° aim errors, height, moving target, ambience mono).
