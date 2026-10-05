# I11a Rhodes: GEOMETRY PROPOSAL

Classes: `hihat/GEOMETRY_PROPOSAL.md` header. **Reuse the speaker family** (`miking-w5`:
`lessons/shared/speakers/speakerModel.ts` — frame C, `SPEAKER_12`, `CONE_SPOTS`, `GRILLE_X`,
`cabLayout`, the stage plan) and the C02 '65 Deluxe Reverb combo (`electric_guitar_amp/`). This
lesson adds a keyboard, a signal-path strip and an optional mechanism inset — nothing new in the
speaker maths.

## 1. Scenes

| Scene | Content | Class | Source |
|---|---|---|---|
| `rig.mono` (default) | Stage 61 (passive, one jack) → one combo amp ('65 Deluxe Reverb: 622.3 × 444.5 × 241.3, one 12-in speaker, open back drawing default) | SOURCED combo (FEN-65DR-MAN); Stage 61 size UNKNOWN → drawn with the MK8 footprint scaled to 61 keys (DRAWING DEFAULT) | RH-S61, FEN-65DR-MAN |
| `rig.stereo` | MK8 (1153 × 563 × 225, 73 keys) → L and R 1/4-in outputs → two identical combos 1500 apart (DRAWING DEFAULT); Vari-Pan moves level between them | SOURCED keyboard and outputs | RH-MK8-UG |
| `rig.direct` | MK8 XLR → console mic input (allowed); SEND = "direct from pickup signal"; speaker output → mic/DI input = BLOCKED with the lesson's reason | SOURCED | RH-MK8-UG; lesson L39 |
| Suitcase | NOT drawn as a model (speaker layout Low/UNKNOWN); a text note only | — | `rhodes/SOURCES.md` §a |

Keyboard frame: reuse frame C for the amp; the keyboard sits 1500 to the amp's side (DRAWING
DEFAULT stage layout), player seated at the keys (ILLUSTRATIVE envelope: body slab, hands over
the keys, right foot on the sustain pedal).

## 2. Zones (on the combo, frame C: origin = speaker centre at the baffle; +x out of the cabinet)

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.amp.close` | mic.ref 25.4–152.4 from the speaker plane ("1-6 inches (2-15 cm)"); lab measures from the grille cloth (`GRILLE_X` drawing default 15) | SOURCED band, lab reference point | S-PGA27 |
| `zone.amp.boundary` | lateral position at the dust-cap/cone line (`CONE_SPOTS.boundary`) | SOURCED words | S-MILLS |
| lateral slider | centre → boundary → edge, words "brighter … more bass/warmth" | SOURCED (S-GTR; D-L2 noted) | |
| `zone.amp.room` | 600–900 back, on axis ("60 to 90 cm (2 to 3 ft.) back from speaker") | SOURCED | S-SM57-UG (speaker_leslie) |
| `zone.amp.rear` | open back: behind the speaker, polarity note | SOURCED | S-MILLS |
| stereo | one comparable mic per combo, matched distance/aim | lesson | |

Keep-outs: the family's cone/grille contact zone, the combo's rear ventilation "at least 6 inches
(15.25 cm)" (FEN-65DR-MAN), hot surfaces/vents (drawing default 50 band at the rear panel), the
player's pedal foot, cables across the walkway.

## 3. Mechanism inset (optional, labelled "inside view — never open the instrument")

One note's tine (TRIAL length 111.125, the replacement-kit length; real tines vary by note —
RH-SM79 tine chart not read), tonebar above it, pickup at the tine's free end, hammer below;
escapement 0.794 (SOURCED, RH-SM79). Signal strip: key → hammer → tine/tonebar → pickup →
controls/effects → amp → speaker → room → mic (lesson L6). No pickup adjustment control (lesson
rule; RH-MK8-UG caution).

Readouts: distance grille → mic, lateral spot (words), path to each combo (stereo Δt), the
signal-path tracer with the connector type at each stage. Owner: Stage 61 size (UNKNOWN), stage
layout, whether to show the mechanism inset.
