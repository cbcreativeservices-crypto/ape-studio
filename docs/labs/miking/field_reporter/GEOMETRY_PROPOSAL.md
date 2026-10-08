# B03 Field Reporters and Handheld Interviews: GEOMETRY PROPOSAL — defines the HANDHELD INTERVIEW + WIND KIT

## 1. Scene (plan + side, stage frame S from `full_orchestra` §1 with two STANDING frame-V talkers)
- Reporter and guest standing face to face at ~60–90° (plan), spacing drawing default (≈ 600–900 mm mouth to mouth).
- Camera token (shared camera frame, `boom_camera` §1) on the reporter's side; a background noise source token
  (traffic/crowd/loudspeaker, illustrated real objects) whose direction the learner can rotate the pair against.
- The reporter's arm reach is a keep-out envelope (DERIVED from the shared player figure, drawing default).

## 2. Mics (NEW once → shared/broadcast/broadcastMics.ts)
| id | What | Pattern | Body |
|---|---|---|---|
| `repOmni` | long-handle omni reporter dynamic with a mic flag | omni | UNKNOWN → drawing default (long handle) |
| `vocDynCard` | directional handheld (REUSE voiceMics) | cardioid | existing |

## 3. Zones
| Zone | Geometry | Class |
|---|---|---|
| `zone.b03.shared` | omni at chest height on the midpoint between the two mouths | SOURCED R-REPORTER ("around chest height between") — chest height drawing default |
| `zone.b03.handoffOmni` | omni moved toward the active mouth along the handoff path | PRACTICE (lesson) |
| `zone.b03.handoffDir` | cardioid aimed at the active mouth, r ≤ 150 mm | SOURCED (Lab 5 stage band, S-SM58-UG / DPA-VOICE) |
| `zone.b03.two` | a close mic each (separate channels) | PRACTICE |

## 4. NEW shared tools
- **Handoff path**: an arc between the two mouths; scrubbing it moves the mic; readouts r_A, r_B and the level
  difference 20·log10(r_B/r_A) (inverse square, DERIVED) — shows why a mid-point omni favours neither and why a
  directional mic pointed "between" serves neither.
- **Wind kit** (shared with B04/B08 and possibly Lab 6 F06–F09): built-in grille, foam, fitted fur, basket+fur
  (blimp) drawn as real accessories; a wind arrow at the capsule; tendencies in words only (no dB figures — none
  sourced). Coordinate the path with the Lab 6 builder (`lessons/shared/field/wind*` if they build first).
- **Weather/safety card**: the lightning rule (exact), electronics out of rain, stop/relocate signal.

## 5. Setups
ONE MIC = `shared`; TWO MICS = `two`; CLOSE · LIVE = `handoffDir`; FARTHER BACK = — (none: a camera mic is B04's);
ANOTHER START = `handoffOmni` with foam/fur.

## 6. Owner list
Talker spacing and chest-height default; draw the mic flag (generic, no logo); include the background-source rotate.
