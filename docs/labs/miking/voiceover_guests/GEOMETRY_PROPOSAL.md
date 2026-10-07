# B07 Voiceover, Narration and Broadcast Guests: GEOMETRY PROPOSAL

Mostly REUSE: frame V (standing reader at a script stand) and frame B (seated, `radio_host`); Lab 5 voice zones.

## 1. Scene
- A booth (side + plan): reader standing (voicePose) or seated, a script/music stand or screen (illustrated) as a
  REFLECTOR and a sight-line keep-out, soft panels on one wall (illustrated, no absorption numbers), a fan/vent noise
  token.
- Guest variant: a second seated talker (in-studio) or a laptop/earbud token (remote guest; plan view only).

## 2. Zones (lip point → capsule)
| Zone | Geometry | Class |
|---|---|---|
| `zone.b07.close` | on axis r ∈ [25.4, 152.4] (end-address dynamic) / ≈ 101.6 (condenser) | SOURCED S-SM7B-UG, DPA-VOC-STUDIO |
| `zone.b07.moderate` | r ∈ [203.2, 304.8] | SOURCED N-VOC / DPA-VOC-STUDIO |
| `zone.b07.offBreath` | same r, offset above or to the side of the jet, aimed at the mouth | SOURCED direction (R-POD, Lab 5 `zone.v.below`); angle drawing default |
| `zone.b07.overScript` | above the stand, about eye level, aimed down at the mouth | SOURCED N-POP (Lab 5 `zone.v.overhead`); eye level drawing default |
| `zone.b07.guestHs` | headset 20–30 mm from the mouth corner | SOURCED SN-ME3 (from B05) |

Reuse `lessons/shared/voice/voiceStarts.ts` rows: `closeRow`, `looseRow`, `lowRow`, `headsetRow` — no new zone code.

## 3. Readouts (DERIVED)
Direct-to-room tendency arrow vs r (inverse square only), proximity indicator, script-stand reflection path (desk
reflection tool, `radio_host` §6, applied to the stand plane), plosive jet hit.

## 4. Setups
ONE MIC = `close` with a pop screen; TWO MICS = host + in-studio guest (separate mics; Δt of the leak, twoMic);
CLOSE · LIVE = `close` without pop screen at the stage band (live read); FARTHER BACK · STUDIO = `moderate`;
ANOTHER START = `overScript`, remote-guest headset.

## 5. Owner list
Booth drawing (generic); remote guest drawn as laptop + headset only (no app/platform names).
