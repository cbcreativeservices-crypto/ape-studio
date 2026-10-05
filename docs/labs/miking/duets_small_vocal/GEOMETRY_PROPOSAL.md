# E04 Duets/Small Vocal Groups: GEOMETRY PROPOSAL

Reuses frame V singers, stage frame S, array tool (§A), choir/backing zones.

| Scene | Geometry | Class |
|---|---|---|
| `duo.shared` | one mic; 2–4 singers on an arc of equal radius R about the capsule (matched distance is the lesson rule) | SOURCED layout (AKG-C414); R drawing default 400 |
| `duo.fig8` | figure-8 between two facing singers on its 0°/180° axis; side nulls drawn at 90°/270° | geometry = bidirectional definition; singer distances drawing default |
| `duo.pair` | array tool preset (XY/MS/ORTF/AB) at the group's acoustic centre; ORTF 95° recording-angle wedge | SOURCED §A |
| `duo.individual` | one directional mic per singer; 3:1 ratio readout (mic-to-mic) | SOURCED §0.2 |
| `duo.mainSpot` | pair + low-level spots; path-difference readout Δt = Δd / c | DERIVED |

Interaction: "move one singer 6 inches closer" (L108) → readout of level change 20·log10(R/(R−152.4)) dB and the
proximity indicator (frame V). Monitor wedges snap to §0.1 nulls; no feedback simulation (§0.4).
