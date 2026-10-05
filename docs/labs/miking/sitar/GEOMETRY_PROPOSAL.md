# C14 Sitar: GEOMETRY PROPOSAL (medium depth)

Frame S: origin = centre of the main bridge (jawari) foot on the tabli/tabkadi (soundboard); +x along the
neck toward the pegs; +y across the board toward the melody (playing) side; +z out of the board.

| Item | Value | Class |
|---|---|---|
| Overall length | 1245 | SOURCED MET-ADHIKARI (124.5 cm) |
| Overall width / depth | 343 / 310 (gourd) | SOURCED MET-ADHIKARI |
| Main gourd | Ø 343, its centre at x = −60 | Ø = overall width (TRIAL); position drawing default |
| Neck | x ∈ [+160, +1080], width 85; frets curved, 19 | drawing defaults |
| Optional upper gourd | Ø 200 behind the neck at x = +950 | drawing default |
| Sympathetic strings | 13 under the frets, pegs along the neck side | count per lesson (Met) |
| Posture | seated on the floor; the gourd rests on the left foot sole, neck at ~45° up to the player's left; board faces forward | drawing default (lesson describes; no geometry source) |
| Mizrab hand | box x ∈ [+20, +260], z ∈ [0, 100] | `env.st.mizrab` drawing default |

| Zone id | Position | Verification | Source |
|---|---|---|---|
| `zone.st.geos` | omni ~200 from the board, below the bridge, aimed diagonally upward at the jawari | **CONFIRMED** | GEOS |
| `zone.st.duvel.high` / `.low` | two cardioids 177.8–203.2 away, one at the neck, one at the bridge/body | **CONFIRMED** | S-DUVEL |
| `zone.st.A` | 250–450 from the lower face, across the bridge | TRIAL (lesson) | lesson |
| `zone.st.imrsv` | ribbons ~400; room A/B 1000 to the sides; two ~700 behind | CONFIRMED | IMRSV |
| `zone.st.C` | 600–1000 in front | TRIAL (lesson) | lesson |

Keep-outs: `env.st.mizrab`, the neck's left-hand sweep, the gourd, pegs, floor posture area. UNKNOWN: all
interior placement of the gourd and frets; owner/player check.
