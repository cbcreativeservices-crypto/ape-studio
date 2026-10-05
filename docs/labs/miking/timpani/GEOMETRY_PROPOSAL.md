# M06 Timpani: GEOMETRY PROPOSAL

Frame H variant: origin on the floor under the midpoint of the two head centres; +x toward the
conductor/audience (away from the player); +y down; +z to the player's right. Value classes:
`snare/GEOMETRY_PROPOSAL.md`.

| Anchor | Value (mm) | Class | Source |
|---|---|---|---|
| 29-in drum head | Ø 736.6 | SOURCED | YMH-TIMP-SEL |
| 26-in drum head | Ø 660.4 | SOURCED | YMH-TIMP-SEL |
| layout | international: low (29) on the player's left (−z), high (26) on the right; German = mirrored | SOURCED rule | YMH-TIMP-PLACE |
| centres | (0, −h, −380) and (0, −h, +380); rim gap 760 − 368.3 − 330.2 = 61.5 | drawing default | — |
| head height h | drawing default 760 | UNKNOWN | — |
| strike points | on the player side (−x), 1/3 of the radius in from the hoop: 29-in at r = 245.5, 26-in at r = 220.1 from each centre toward −x | DERIVED from SOURCED rule | YMH-TIMP-STRIKE |
| mallet arcs, pedal zones, conductor sightline | ILLUSTRATIVE | — | lesson |

| Zone | Region | Source |
|---|---|---|
| `zone.timp.pair` | one mic between the two drums, 1000 above the head plane ("about 1 m (3'4")"): (0, −(h + 1000), 0) ± 150 tolerance (drawing default) | DECCA |
| `zone.timp.four` | four-drum set: one such mic per pair | DECCA |
| `ko.mallet`, `ko.pedal`, `ko.sightline` | ILLUSTRATIVE | lesson |

Note: 1 m = 3 ft 3.37 in; Decca prints "(3'4")".
UNKNOWN for the owner: head height; four-drum spacing; which layout is the default (international proposed).
