# F16 Scientific Arrays and Specialized Sensors: GEOMETRY PROPOSAL

Status: PROPOSAL, no app code.

## 1. Frames
Scene frame F (room, metres) with a marked coordinate origin and array axes (the lesson asks for them, L5).
Frame M objects.

## 2. Drawable model
| Item | Geometry | Class |
|---|---|---|
| Two-element baseline (the exercise) | two omni measurement mics, spacing b (drawing default 0.5 m), one synchronized recorder | PRACTICE |
| Source points: centre, side | on a line in front of the array, distance drawing default 2 m | default |
| Arrival readout | Δt = (r_L − r_R)/c (CALC-C, exact); the front/back mirror point drawn as the ambiguity | DERIVED / physics |
| Uniform line array (N elements, spacing d) | d vs λ/2 check: f_max = c/(2d) readout | CONFIRMED rule (MW-ULA) |
| Planar imaging array + camera | generic disc/grid, registered to a video frame; "hot spot is an estimate" label | PRACTICE |
| Intensity probe | two capsules face to face, spacer 12 / 25 / 50 mm presets, axis arrow (positive direction); reading ∝ cos θ of incidence | CONFIRMED in substance (PROBE-SPACER); band per spacer NOT shown as numbers unless the builder re-reads a maker sheet |
| Enclosing surface around a small device with outward normals + safe scan path | paper exercise | PRACTICE |
| Hydrophone on a line in water (side view: surface, depth, mooring) | depth drawing default; "rated and calibrated for the deployment" | PRACTICE |
| Ultrasonic detector | generic | PRACTICE |

## 3. Non-placement pages
- **Units card**: air dB re 20 µPa vs water dB re 1 µPa — "not comparable by subtraction" (DOSITS-AW).
- **Nyquist card**: sample rate vs highest frequency (reuse Digital Lab / glossary wording).
- **Claim ladder** (shared with F15).

## 4. STARTING SETUPS
ONE MIC: (n/a — the lesson is about arrays) → ONE ARRAY: two-mic baseline, source centred. TWO MICS: the same pair,
source moved to the side (Δt changes sign). CLOSE · LIVE: intensity probe normal to a panel (paper / qualified operator).
FARTHER BACK · STUDIO: imaging array at a distance from the device. ANOTHER START: hydrophone (field), ultrasonic detector.

## 5. Shared / new
REUSE `stereoArray.arrivals`/`dtLR` (two-mic Δt), twoMic, frame M, F15 contact sensor + claim ladder. NEW: line-array
λ/2 helper (pure, tested), intensity-probe object, hydrophone side view (water surface art).
