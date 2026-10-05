# I11b Wurlitzer: GEOMETRY PROPOSAL

Classes: `hihat/GEOMETRY_PROPOSAL.md`. Reuse the speaker family maths (`speakerModel.ts`) with ONE
new driver shape: **`SPEAKER_OVAL_4x8`** (101.6 × 203.2 nominal, SOURCED VV-200A; cone depth,
dust-cap size DRAWING DEFAULT scaled from the 12-in reference via `speakerScale`, applied to the
two axes separately).

## Frame W (Wurlitzer case)
mm. Origin = the floor point under the centre of the keyboard's front edge; +x toward the player
(the speakers face the player); +y down; +z toward the treble. Case: DRAWING DEFAULT 1020 wide ×
500 deep × 230 high on legs, keybed at h 720 (instrument size UNKNOWN; key count 64 Low).

| Anchor | Value | Class | Source |
|---|---|---|---|
| speakers | two 4×8 ovals in the lid's front slope, long axis along z, at z = ±260, facing the player (+x) and 20° up | count/size SOURCED; positions/angle DRAWING DEFAULT | VV-200A, TF-DIFF |
| model switch | 200: on the amp rail (behind a grille, rigid); 200A: on the lid (lid = baffle; rattle possible) | SOURCED | TF-DIFF |
| controls | volume, vibrato (tremolo depth/speed words), aux/headphone jack; 200A aux trim on the bottom | SOURCED | TF-REC, VV-200A |
| player | seated at +x; knees under the keybed; hands over the keys; right foot on the sustain pedal | ILLUSTRATIVE | |

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.wur.close` | mic.ref 25.4 from the grille, off-centre on the oval (≈ 0.5 × semi-axis), slight angle (10–20°) | 25.4 SOURCED; off-centre amount and angle DRAWING DEFAULT | TF-REC |
| lateral slider | centre ↔ outward: "brighter … more bass/warmth" | SOURCED words | S-GTR |
| `zone.wur.two` | one close mic per grille (not stereo — same signal unless verified) | lesson | |
| `zone.wur.room` | 600–900 back toward the audience side | DRAWING DEFAULT (S-SM57 room row is for a cabinet; TRIAL) | |

Keep-outs (the hard part — the grilles face the player): `ko.player` (hands, forearms, knees,
sheet-music rest), `ko.lid` (no clamp, no stand contact — lesson rule), `ko.pedal`. A close mic
lives in the gap between the player's body and the lid: show it as a narrow allowed band, or a
"use the aux / external amp" suggestion when the band is empty.
Signal strip: key → hammer → steel reed → electrostatic pickup → preamp/vibrato → amp → speakers →
room → mic; aux out = alternate electrical path; speaker output → mic/line/DI = BLOCKED (TF-REC).
Owner: case size and grille positions (UNKNOWN — measure a real 200A), which model is default
(proposal: 200A, because the lid-baffle and rattle teach the most).
