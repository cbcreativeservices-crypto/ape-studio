# B02 News Anchors and Seated Interviews: GEOMETRY PROPOSAL

Status: PROPOSAL. Assembles three shared families; adds nothing new of its own except the two-seat desk scene.

## 1. Scene
- Two SEATED talkers (frame B, `radio_host` §1) at an anchor desk: anchor facing camera, guest at ~90° (plan),
  seat spacing drawing default. Head-turn control: face camera / face partner / read down.
- Camera (shared CAMERA FRAME tool, `boom_camera/` §1) at a drawing-default distance; widest frame drawn as a
  keep-out wedge in side + plan view.
- Desk top = reflector (desk reflection readout, `radio_host` §6).

## 2. Starting setups
| Role | Setup | Geometry | Class |
|---|---|---|---|
| ONE MIC | visible omni lav on the sternum (each talker) | `zone.lav.sternum` from `lavalier_headset` §3: 125–250 mm from the lip point, centred | SOURCED SN-ME2 / S-PASTOR (D-LAV1) |
| TWO MICS | lav (safety) + boom (program), routed separately | boom: `zone.boom.above` (`boom_camera`) clamped to the frame edge | SOURCED R-BOOM; distance DERIVED from the frame |
| CLOSE · LIVE | gooseneck on the desk, capsule raised toward the mouth | head height/aim from the mouth; gooseneck reach drawing default | PRACTICE; reuse `rimCondenser`-style gooseneck art? → no: NEW `gooseneck` mount shared with B06 |
| FARTHER BACK · STUDIO | boundary mic on the desk top toward the talker | `boundaryHalf` (REUSE, Lab 1) on the desk plane | SOURCED pattern (S-B91-UG) |
| ANOTHER START | concealed lav (inside the garment) | same zone, a fabric layer drawn over the capsule ("may dull the top end") | PRACTICE; CTRY-B6 cap note internal only |

## 3. Readouts (DERIVED)
r and off-axis angle vs head turn for a chest mic vs a boom vs a desk mic (the core lesson); boom tip to frame-edge
clearance; lav + boom Δt and first notch (twoMic) with the "choose one channel" decision; desk reflection notch for
the gooseneck vs ~0 path difference for the boundary (why the boundary works differently — "a simplified picture").

## 4. Clearance
Frame wedge (no mic tip inside), light/shadow line (drawing default, text only), desk, talkers' solids, papers.
Overhead boom over a seated person: shown only as "rigged and secured by qualified crew" (text; no rigging drawn).

## 5. Owner list
Seat angle and spacing; camera lens angle (drawing default); show the concealed-lav variant as its own setup?
