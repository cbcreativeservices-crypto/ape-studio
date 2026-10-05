# M07a Concert Bass Drum: GEOMETRY PROPOSAL

Frame: origin on the floor under the drum centre; +x toward the conductor/audience; +y down; +z to
the player's right. The drum's axis lies along ±z when the heads face sideways into the ensemble
(lesson), playing head toward the player's side. Value classes: `snare/GEOMETRY_PROPOSAL.md`.

| Anchor | Value (mm) | Class | Source |
|---|---|---|---|
| drum | Ø 914.4 × 406.4 deep (36 × 16 in) | SOURCED | YMH-CPCAT CB 636 |
| drum centre height | drawing default 800 | UNKNOWN | — |
| playing head | the head facing −z (player side); tilt θ_tilt about the pivot axis (x), drawing default 0° (vertical) | drawing default | stand allows angle adjustment (YMH-CB9-STAND) |
| pivot shafts | on the shell at ±x (horizontal pivot through the drum centre) | drawing default (pivot exists: SOURCED words) | YMH-CB9-STAND |
| stand | frame with four casters, brakes; footprint drawing default 1000 × 600 | words SOURCED, size drawing default | YMH-CB9-STAND |
| mallet arc + damping-hand reach (both heads) | ILLUSTRATIVE | — | lesson |

| Zone | Region | Source |
|---|---|---|
| `zone.cbd.decca` | mic.ref 450 from the playing-head centre ("about 45 cm"), "just above the instrument", aimed diagonally down at the head: drawing default elevation 45° above the head-centre horizontal → mic.ref ≈ (0, −(800 + 318.2), −(203.2 + 318.2)) | DECCA (distance and direction words); 45° is a drawing default |
| `state.cbd.turned` | no-mic option: drum turned sideways to project toward the conductor | DECCA |
| `ko.stand.unlock` | the app never shows the drum unlocked, tilted or lifted by the learner (lesson) | rule |

UNKNOWN for the owner: centre height, stand footprint, the 45° elevation.
