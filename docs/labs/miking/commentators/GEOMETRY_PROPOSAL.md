# B09 Commentators: GEOMETRY PROPOSAL — defines the shared BROADCAST SPEECH set

Status: PROPOSAL, no app code. Value classes as `kick/GEOMETRY_PROPOSAL.md`: SOURCED / DERIVED / TRIAL / UNKNOWN
(a drawing default, `placeholder: true`, never a readout). Learner text: suggested starting points, no brands.

## 1. Frames reused
- **Frame V** (`lessons/shared/voice/`, `lead_vocal/GEOMETRY_PROPOSAL.md`): lip-point origin, line-art head, side and
  plan views from one model. B09 adds head yaw ψ_h (turn to the partner; default 0°, trial 30–45°) and pitch (looking
  down at notes, trial 20°).
- **Lab 7 part 1 headset / lav / handheld tokens** (B03 handheld, B04 boom, B05 lav/headset) when part 1 lands first;
  otherwise group G1 here builds them in `lessons/shared/broadcast/` and part 1 imports from there (one owner, §4).

## 2. Microphones (generic types)
| Token | Geometry | Class |
|---|---|---|
| `bc.headsetBoom` | band + closed ear cups + boom from the ear pivot; capsule at the **outside corner of the mouth, not in front** | SOURCED S-SM2 (placement, pivot 155°, boom adjust 89 mm). Capsule offset from the lip corner UNKNOWN → drawing default 15 mm lateral, 10 mm forward of the lip point |
| `bc.lipMic` | ribbon behind a lip guard; figure-8 axis on the mouth axis; side nulls at 90° | SOURCED pattern (COLES-4104); guard-to-ribbon distance UNKNOWN → drawing default 60 mm |
| `bc.deskArm` | broadcast dynamic on a desk arm, aimed at the mouth from just off the plosive line | PRACTICE; distance TRIAL 50–150 mm (frame V close zone) |
| `bc.lav`, `bc.headworn` | lav at the sternum; headworn element at the cheek | from part 1, else drawing default |

## 3. Booth plan (a `booth` preset of the venue plan builder, frame P — see `field_diamond/GEOMETRY_PROPOSAL.md` §1)
- Desk (drawing default 1.8 × 0.75 m), two seats 0.9 m apart (default), sightline arrow to the field, the partner-turn
  arc, notes and screen, window / PA cluster direction, crowd direction (arrows only).
- Readouts (DERIVED, "calculated from the drawing"): partner-mouth-to-mic vs own-mouth-to-mic distance → spill in dB by
  inverse square, 20·log10(d_partner/d_own), plus the mic's off-axis angle to the partner and ideal polar gain from
  `physics/polar.ts` (labelled a simplified picture). Example: own 25 mm, partner 900 mm → 31 dB from distance alone.
- Two-mic page: one voice in both mics → Δt and comb notches from the existing twoMic engine.

## 4. Built once and shared
1. `lessons/shared/broadcast/broadcastMics.ts` + art: headset boom, lip mic with guard, desk arm, handheld with flag,
   lav, compact shotgun on a short pole. One owner (first builder of Lab 7 part 1 or part 2).
2. **Feeds and routing panel** (static, no audio): mic → program / PA / record / talkback / own headphones; cough-mute
   and talkback switch states; IFB and mix-minus as drawn paths. Extends Lab 5's routing-role matrix.
3. Hearing card (safety, plain words): start headphone level low; a headset is not hearing protection.

## 5. Starting setups
- ONE MIC: headset boom at the outside corner of the mouth (placement SOURCED; distance "close", default).
- TWO MICS: two commentators, one mic each, with the spill readout.
- CLOSE · LIVE: lip mic with its guard against the upper lip (pattern SOURCED, distance default).
- FARTHER BACK · STUDIO: desk-arm mic in a quiet booth, with the head-turn trade-off.
- Keep-outs: glasses arm, notes, screen; the boom never crosses the breath-jet cone (frame V).

## 6. Dimensions still needed
Head (frame V defaults), headset band radius (default), boom base length (UNKNOWN; adjust range SOURCED), lip-guard depth
(UNKNOWN), desk and seat spacing (defaults).
