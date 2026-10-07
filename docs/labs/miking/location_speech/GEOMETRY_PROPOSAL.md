# F09 Location Speech and Practical Sounds: GEOMETRY PROPOSAL

Status: PROPOSAL, no app code. Classes as `measurement_mics/GEOMETRY_PROPOSAL.md`.

## 1. Frames
- **Frame V** (voice, `lessons/shared/voice/`, lip-point origin, mm) for every mic-to-mouth readout — REUSE as is.
- **Scene frame F** (shared with Lab 6 part 1; ground plane, metres, scene front) for the set: two speaking marks,
  table, camera, boom operator. Views: side (camera frame line visible) and plan.

## 2. Drawable model
| Item | Geometry | Class |
|---|---|---|
| Two people (talker A seated or standing, talker B), head turn ±60° | frame V head (line-art), torso; yaw drives the mouth axis | head = drawing default (Lab 5) ; turn angle drawing default |
| Camera + frame | camera on tripod; **frame line** = the top edge of the shot frustum in side view — a new keep-out ("mic and pole stay above/outside") | geometry DERIVED from a drawing-default lens angle (40° vertical) |
| Boom pole + shock mount + windshield (basket/fur) | pole from operator's hands; mic aimed at the mouth; length drawing default 2.5 m | PRACTICE |
| Lav | on the sternum (SHURE-LAV), moves with the torso, not the head | CONFIRMED position; distance to mouth DERIVED from the drawing |
| Handheld (interview variant) | frame V `zone.v.stage` (≤ 100 mm) | SOURCED (Lab 5) |
| Plant mic | small mic in a table prop aimed at the practical action (keys) | CONFIRMED type (DPA-PLANT); position drawing default |
| Camera-top mic | on the camera; distance = camera-to-talker (the lesson's point: direction ≠ proximity) | DERIVED |
| Overhead power line (outdoor variant) | keep-out cylinder radius **3 m (10 ft)** around the line | CONFIRMED (OSHA-ELEC) — safety, drawn exact |
| Practical object | keys on a table; door variant reuses F03 door if built (part 1) | part 1 asset |

## 3. STARTING SETUPS
- ONE MIC: boom just above the frame line, aimed at the talker's mouth (frame V on-axis), distance shown from the drawing.
- TWO MICS: boom + lav on separate channels (not stereo); the mono-blend comb readout from `physics/twoMic.ts` (Δt from the two path lengths).
- CLOSE · LIVE: handheld at the frame V stage zone; PA/monitor from Lab 5's gain-margin panel.
- FARTHER BACK · STUDIO: camera-top mic at camera distance (the honest contrast).
- ANOTHER START: plant mic at the table action.

## 4. Readouts
Mic-to-mouth distance and off-axis angle for each mic as the head turns (boom must re-aim; lav does not move with
the head); inverse-square difference between mics (levels.ts); boom-above-frame clearance; power-line clearance ✓/✗.

## 5. Shared / new
REUSE: frame V, Lab 5 gain-margin panel, twoMic, polar overlay. NEW (build once, shared with Lab 7 B04/B05):
`shared/field/location.ts` — camera frame keep-out, boom mount kind (`boom`), body mount kind (`body`, follows torso),
plant mount kind; overhead-line keep-out. Lab 7 boom/lav lessons import these.

## 6. Owner list
Depicting people (talkers, boom operator) — D-6B-5. Lab 7 overlap (one shared module) — D-6B-6.
