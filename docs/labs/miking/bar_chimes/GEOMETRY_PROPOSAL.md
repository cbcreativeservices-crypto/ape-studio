# I06c Bar Chimes: GEOMETRY PROPOSAL

Family: `shaker/GEOMETRY_PROPOSAL.md` §A, but the instrument is stand-mounted (frame H origin under
the rail centre; rail along z).

| Item | Value | Class | Source |
|---|---|---|---|
| rail (mantle) | 380 long (inside PAS 12–16 in), 40 × 30 section, at h 1350 on a stand | length TRIAL (PAS-ECV02 reading); rest DRAWING DEFAULT | PAS-ECV02 |
| bars | 27, single row (default; 60 double-row option); graduated length 300 → 60 (linear), Ø 10, pitch along the rail 13.3 (= 360/27) | count SOURCED (MEINL-CH27); sizes DRAWING DEFAULT | |
| filament | each bar hung 15 below the rail | SOURCED (GROVER-MT35 "filament"); length DRAWING DEFAULT | |
| damper | optional bar along the rail | SOURCED option | GROVER-MT35 |
| sweep | hand path along the row at bar mid-height, both directions; bars swing ±20° about their filament | path SOURCED words (PAS); swing DRAWING DEFAULT | PAS-ECV02 |
| `P0` | centre of the row (bars' mid-height) | lesson | |

| Zone | Region | Class |
|---|---|---|
| `zone.chime.trial` | 400–800 from `P0`, facing the row's length, at a height that sees the bars (not only the rail) | lesson TRIAL |
| `zone.chime.ends` | optional mic at each end, outside the swing | lesson; position DRAWING DEFAULT |
| `zone.chime.shure` | ≥ 304.8 | SOURCED S-HOME |
| `ko.swing` / `ko.hand` | bar swing + sweep hand + 50 | DRAWING DEFAULT |

Readouts: the two end-mic path difference to a bar at each end → Δt; mono warning. Owner: bar lengths.
