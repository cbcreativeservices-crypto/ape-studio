# I02 Cajón: GEOMETRY PROPOSAL

Classes: `hihat/GEOMETRY_PROPOSAL.md`. New small family member: **box idiophone** (one
parametric box: W × D × H, front plate, port on a chosen face, internal snare line, feet).

## Frame J
mm. Origin = floor point under the box centre. **+x toward the audience (the front plate faces +x)**;
+y down (h ↦ y = −h); +z player's right. The player sits astride the top, facing +x.

| Anchor | Value | Class | Source |
|---|---|---|---|
| box | 317.5 (x) × 317.5 (z) × 480.06 (h) | SOURCED | GRIN-CAJ |
| walls / front plate | 12 / 4 thick | 12 TRIAL (MEINL-BUL); 4 DRAWING DEFAULT | |
| front plate | x = +158.75, h 0–480.06 | DERIVED | |
| zones on the plate | bass = lower half/centre (h 120–300, z ±80); slap = top corners (h 400–480, z ±(80–158)) | words SOURCED (GRIN-CAJ, MEINL-JC50); bands DRAWING DEFAULT | |
| internal snares | two wire sets against the inside of the plate, top third | SOURCED words (MEINL-JC50); size DRAWING DEFAULT | |
| rear port | Ø 177.8 on the back (x = −158.75), centre at h 300, z 0 | Ø SOURCED; height DRAWING DEFAULT | GRIN-CAJ |
| variant `slaptop` | port in the front, facing upward; striking surface slanted toward the player | SOURCED words; shape DRAWING DEFAULT | MEINL-SLAP |
| feet | 4 × Ø 25 × 8 | DRAWING DEFAULT | MEINL-JC50 ("four silicone feet") |
| player | seat on top (h 480); thighs over the top toward +x; knees at x ≈ +200, z ±200, h 460; shins down to the floor at x ≈ +150…+250; hands strike the plate from above; heels may tap the sides | ILLUSTRATIVE | GRIN-CAJ ("sits astride") |

| Zone | Region | Class | Source |
|---|---|---|---|
| `zone.caj.shure.front` | "dead center, 6–7" from the front": mic.ref on the plate's centre normal (h 240, z 0) at x = 158.75 + [152.4, 177.8]; slight angle (≤ 15°, DRAWING DEFAULT) | SOURCED | S-DUVEL |
| `zone.caj.white.front` | mic.ref 300–400 from the plate centre, located just below the top-edge height (h 430–480) and in front, angled DOWN to aim at the plate centre (DERIVED aim ≈ atan((455 − 240)/350) ≈ 31.6° below horizontal) | SOURCED | SOS-WHITE |
| `zone.caj.white.rear` | 200 from the back face, aimed at the port centre from one side at 45° (plan) | SOURCED | SOS-WHITE |
| `zone.caj.shure.port` | "right inside the sound hole" — only with a port clamp (MPMCC type); without the clamp the position is BLOCKED (lesson rule: no loose mic in the box) | SOURCED + lesson rule | S-DUVEL, MEINL-MPMCC |
| `zone.caj.slaptop` | at the front-facing (upward) port | words SOURCED | MEINL-SLAP (lesson [4]) |

| Keep-out | Region | Class |
|---|---|---|
| `ko.hands` | volume in front of the plate, x 158.75 → +400, h 150–600, z ±250 (the strike arcs) | ILLUSTRATIVE |
| `ko.knees`, `ko.shins`, `ko.heels` | capsules on the player model | ILLUSTRATIVE |
| `ko.rock` | the player may tilt the box back onto its rear edge: the rear zone keeps ≥ 120 from the back face at all tilts up to 15° (DRAWING DEFAULT) | DRAWING DEFAULT |
| `ko.exit` | a 600-wide path from the seat to the side | ILLUSTRATIVE |
| `ko.portAir` | a cone 30° half-angle, 100 deep from the port (lesson "air-pop risk") | DRAWING DEFAULT |

Note the Shure front point (152–178 mm out, at the plate centre h 240) sits between the knees and
below the hands: the build must test `ko.hands` (DERIVED check — at x = 311–337 it is inside the
default hands volume, so it will be flagged unless the player's strike arc is drawn narrower). The
app shows Shure's published point and the conflict; the player check decides.

Readouts: distances to the plate centre and the port; path difference front vs rear → Δt;
polarity button (front/rear opposite facing → compare both polarities; White flips one).
Owner: port height, player posture model, hands volume.
