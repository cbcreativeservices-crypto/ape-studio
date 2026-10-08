# B04 Boom and Camera-Mounted Pickup: GEOMETRY PROPOSAL — defines the CAMERA FRAME tool, BOOM and SHOTGUN

## 1. CAMERA FRAME tool (NEW once → shared/broadcast/cameraFrame.ts; used by B02, B03, B04, B05, B06, B08)
- A generic video camera (illustrated, no brand) on a tripod: lens point P, aim, horizontal and vertical angle of
  view (drawing defaults: e.g. a medium "head-and-shoulders" and a "wide" preset; owner list).
- Frame = a pyramid from P; drawn as a wedge in side view (top/bottom edges) and plan view (left/right edges).
  `outsideFrame(point, margin)` = DERIVED test; the frame wedge is a COLLISION keep-out for the mic tip and the pole.
- Camera distance control (close / wide) — moves the camera; a camera-mounted mic moves with it.
- Light/shadow: text-only warning (no light model).

## 2. Boom and pole (NEW once → shared/broadcast/boomPole.ts)
Boom pole (hand-held, operator figure from players/), fixed stand boom (for a seated subject), shock mount, cable.
Pole length and operator height: UNKNOWN → drawing defaults. The operator's reach is a keep-out.

## 3. Mics (NEW once → shared/broadcast/broadcastMics.ts)
| id | What | Pattern drawn | Class |
|---|---|---|---|
| `shotgunShort` | short shotgun (interference tube) in a shock mount | **simplified lobe**: hypercardioid-like front with narrowing at HF — no first-order equation exists; draw the hypercardioid polar labelled "a simplified picture" and say in words that the real pattern narrows and wobbles with frequency (owner decision O-SG) | pattern UNKNOWN; S-SHOTGUN ~30° side rejection internal only |
| `compactHyper` | compact hypercardioid/supercardioid pencil on the boom | first-order super/hyper (S-LIVE 126°/110° nulls) | SOURCED (Lab 5 §0.1) |
| `camMic` | on-camera short shotgun in a shoe mount | as `shotgunShort` | mount geometry drawing default |
| wind kit | foam / basket + fur | — | from `field_reporter` §4 |

## 4. Zones (all clamped OUTSIDE the active frame; distance = DERIVED from frame edge + margin)
| Zone | Geometry | Class |
|---|---|---|
| `zone.boom.above` | above and slightly in front of the speaker, aimed at the mouth or upper chest | SOURCED R-BOOM / S-SHOTGUN |
| `zone.boom.below` | below the bottom frame edge, aimed up at the mouth, clear of desk and knees | SOURCED R-BOOM ("if absolutely necessary") |
| `zone.boom.side` | slightly to the side, out of frame | SOURCED S-SHOTGUN; R-BOOM disagrees ("never") → shown as a conditional start with the horizontal-ambience tendency |
| `zone.cam` | the camera mic at the camera's distance | DERIVED (camera distance) |

## 5. Readouts (DERIVED)
Mouth-to-capsule r for each option at the current frame (the "why the boom beats the camera mic" number);
inverse-square level change between `camMic` and boom; what the mic's axis points at beyond the talker (a ray to the
floor/wall/PA, image-source note); two speakers: boom aim swing angle between mouths; boom + lav Δt (twoMic).

## 6. Setups
ONE MIC = `boom.above` (worked example); TWO MICS = boom + lav safety track (separate channels); CLOSE · LIVE =
`boom.below` under a high frame; FARTHER BACK = `zone.cam` (wide frame); ANOTHER START = `boom.side`.

## 7. Owner list
O-SG shotgun drawing (simplified hypercardioid + words); lens presets; show the pole operator figure; power-line
safety stated as a text rule only.
