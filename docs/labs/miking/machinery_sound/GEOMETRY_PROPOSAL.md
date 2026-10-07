# F15 Machinery and Product Sound: GEOMETRY PROPOSAL

Status: PROPOSAL, no app code.

## 1. Frames
Bench/room scene in scene frame F (metres); origin = product's footprint centre on the reflecting plane; frame M objects.

## 2. Drawable model
| Item | Geometry | Class |
|---|---|---|
| Guarded desktop fan on a table (the lesson's device) | guard, blades, motor housing, rear vent; sizes drawing default | PRACTICE device |
| **Exclusion zone** around the device (guard + intake/exhaust airflow cone) | hard keep-out; mic cannot enter; no reaching | PRACTICE; radius drawing default 0.3 m beyond the guard, exhaust cone 30° |
| Positions A (user point), B, C (safe exterior points at same distance) | on a circle of radius d around the product, same height | drawing default d = 1 m, height = 1.2 m seated user (MEYER seat height reused) |
| Enveloping surface (illustration only, for the "formal survey" page) | hemisphere / box over the reflecting plane — shape shown, **no microphone count or coordinates** (the standard sets them; not reproduced) | CONFIRMED concept (ISO-3744); positions not drawn |
| Accelerometer / contact sensor | on the housing, device OFF and isolated, "a qualified person installs it" | PRACTICE |
| Industrial machine variant | drawn only as a no-go example (guards, lockout tag) — no mic placement | — |

## 3. Non-placement pages
- **Claim ladder**: creative perspective → relative comparison → calibrated pressure at a position → sound power
  (needs the standard): the learner sorts claims a setup can support.
- **Cycle log**: start / steady / stop markers on a SYNTHETIC level strip (labelled made-up example).

## 4. STARTING SETUPS
ONE MIC: user point A. TWO MICS: airborne mic at A + contact sensor on the housing (separate channels, different units).
CLOSE · LIVE: product demo with a close detail mic outside the exclusion zone, kept out of the PA. FARTHER BACK · STUDIO:
listener-like Foley perspective. ANOTHER START: B and C at the same radius.

## 5. Shared / new
REUSE frame M, scene frame F, levels.ts. NEW: exclusion-zone keep-out shape (airflow cone), contact-sensor object
(shared with F16 and part 1 F04), claim-ladder item type (shared with F16).
