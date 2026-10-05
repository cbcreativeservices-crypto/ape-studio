# C06b Upright Bass, bowed: GEOMETRY PROPOSAL

Status: PROPOSAL. Identical to `upright_bass_plucked/GEOMETRY_PROPOSAL.md` (frame B, posture, zones),
plus the bow:

| Item | Value | Class |
|---|---|---|
| Bow contact `bw.contact` | x ∈ [+40, +170] above the bridge (drawing default) | UNKNOWN |
| Bow hair travel | ±485 along y′ about the contact point | SOURCED (Met obj. 503222 hair 48.5 cm; TRIAL for a modern bow) |
| Frog/hand sphere | r 90 at the travelling end | drawing default |
| String-crossing angle | ±25° (E to G) | drawing default |
| `env.ub.bow` | the swept slab (violin §3 rule) with these values | DERIVED from the above |

Zones: as C06a. `zone.ub.shure.front` must lie outside `env.ub.bow`: with the contact at x ≤ +170 and
the mic at x ∈ [+60, +150], the mic must sit at z ≥ 152.4 in front of the strings and laterally clear
of the bow hand — the readout flags any overlap. Orchestral spot (MK 4V side-address cardioid): stand in
front of the section, drawing default 1000–1500 high above the floor and 800 in front; neighbours'
bow envelopes repeat at 1200 spacing (drawing default) — section seating is UNKNOWN (lesson).

"Mark the safe zone before energizing the system" (lesson): the bow envelope is drawn before any mic
can be placed.
