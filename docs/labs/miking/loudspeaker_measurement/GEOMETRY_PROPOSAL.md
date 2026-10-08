# F14 Loudspeaker and Sound System Measurement: GEOMETRY PROPOSAL

Status: PROPOSAL, no app code.

## 1. Frames
Two scenes: (a) **bench**: one loudspeaker, its reference axis, mic on an arc (radius r, angle θ) — mm/m; (b) **venue**:
scene frame F plan + section, main L/R, sub, front fill, seats. Frame M objects.

## 2. Drawable model
| Item | Geometry | Class |
|---|---|---|
| Two-way cabinet, reference axis marked | generic; reuse `lessons/shared/speakers/` cabinet art (Leslie/speaker module) | REUSE |
| Off-axis arc | radius r fixed (drawing default 2 m), θ steps 0/15/30/45/60° (drawing default grid) | default |
| Near-field point | capsule close to the cone/port; contact keep-out around cone, grille, vent | PRACTICE; gap drawing default 10 mm |
| Ground-plane variant | mic and source on a large flat plane | PRACTICE |
| Venue seats: front/middle/rear/edge/overlap | mic at **1.2 m seated, 1.7 m standing** | CONFIRMED (MEYER-MAPP) |
| Signal chain | console → DSP → amp → speaker; reference tap pre-DSP / post-DSP; mic → analyzer (never → PA) | PRACTICE |
| Studio variant | L/R monitors, desk, listening position ± nearby head positions | drawing default room |

## 3. Non-placement pages
- **Reference tap & delay** (chain rack): choose the tap; the arrival time = path/c (CALC-C) + a drawing-default DSP
  latency; the learner sets the delay; a wrong-arrival trap (a reflection stronger than direct).
- **Window vs resolution**: window length T → Δf = 1/T readout (physics, exact).
- No invented magnitude/phase curves: any trace drawn is "a simplified example".

## 4. STARTING SETUPS
ONE MIC: on the reference axis at radius r. TWO MICS: same r, one off-axis. CLOSE · LIVE: venue seats (start/mid/end
of coverage, seated height). FARTHER BACK · STUDIO: monitor at the listening position + a neighbour position. ANOTHER
START: near-field at the woofer/port; ground plane.

## 5. Shared / new
REUSE speakers art, frame M, scene frame F, `physics/levels.ts` (inverse square along the seats), twoMic (arrival
differences main vs fill at an overlap seat — the comb, labelled ideal). NEW: venue seat plan with sources
(`shared/measure/venue.ts`), reference-tap chain rack. Cross-link the Sound Systems Lab (no duplication of its art —
import where possible).
