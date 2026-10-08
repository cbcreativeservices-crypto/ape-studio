# B06 Panels, Press Conferences and Groups: GEOMETRY PROPOSAL — defines the PANEL TABLE, LECTERN and ROUTING panel

## 1. Scene (plan first, section for the lectern)
- A panel table with 4 SEATED talkers (frame B, `radio_host` §1) + moderator, a lectern (standing talker, frame V),
  one audience question point (aisle), a PA pair with coverage wedges, a camera riser. Reuse frame S (stage plan,
  `lessons/shared/ensemble/frameS.ts`) and its stage-plot tokens; table length, seat pitch, lectern height:
  UNKNOWN → drawing defaults (owner list).
- Head turn per talker ("turn to a neighbour").

## 2. Mics and mounts
`gooseneck` (NEW mount, shared with B02; capsule: small cardioid condenser — REUSE `sdcCard` head scaled, or
`rimCondenser` gooseneck art if it fits), `boundaryHalf` (REUSE), lectern gooseneck (same mount on a lectern),
`vocDynCard` question handheld (REUSE), body-worn (`lavalier_headset`).

## 3. Zones
| Zone | Geometry | Class |
|---|---|---|
| `zone.b06.lectern` | gooseneck capsule 254–356 mm from the mouth, a little off the mouth axis | SOURCED S-CHURCH (after correction B06-1) |
| `zone.b06.lecternGain` | 178–254 mm (talker distance for setting gain) | SOURCED S-PODIUM — shown as a second range only if the owner wants (O-LEC) |
| `zone.b06.gooseneck` | one per talker, capsule raised toward the mouth across the speaking arc | PRACTICE; distance drawing default 250 mm |
| `zone.b06.boundary` | between two adjacent talkers on the table | PRACTICE (lesson) |
| `zone.b06.question` | handheld kept near the questioner's mouth (Lab 5 stage band) | SOURCED (S-SM58-UG < 150 mm) |

## 4. NEW shared tools (built once → shared/broadcast/)
- **Open-mic panel**: per-mic open/muted, NOM, gain-margin change 10·log10(NOM) (S-LIVE; Lab 5 gain-margin panel
  REUSE), the mute decision for a lectern + body mic pair, automixer as words (no simulated gating).
- **Bleed matrix**: each open mic vs each talker — distance and level difference (inverse square), Δt and first notch
  for the strongest leak (twoMic). 3:1 ratio shown as a note.
- **ROUTING panel** (used by B01–B08): a signal-flow diagram of the destinations — PA, monitors, program/stream,
  recorder, IFB/earpiece, talkback, press feed (box: line in → isolated mic-level outs), remote return with
  mix-minus. Pure diagram (no levels beyond "line" vs "mic"); a check "the question mic reaches the stream".

## 5. Setups
ONE MIC = lectern gooseneck; TWO MICS = gooseneck per panelist (two shown); CLOSE · LIVE = headset on the moving
presenter + lectern muted; FARTHER BACK = shared boundary on the table; ANOTHER START = question handheld.

## 6. Owner list
Table/lectern drawing defaults; O-LEC (show S-PODIUM's 7–10 in too?); how much routing (the plan says "supporting").
