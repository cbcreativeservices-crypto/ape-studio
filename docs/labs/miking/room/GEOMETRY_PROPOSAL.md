# M10 Drum Room Microphones: GEOMETRY PROPOSAL

Status: PROPOSAL. No app code. Value classes / DRAWING DEFAULT rule: header of
`snare/GEOMETRY_PROPOSAL.md`. Frame: KIT frame K (floor y = 290.4; h ↦ y = 290.4 − h). The kit
itself is the shared kit (`kit/GEOMETRY_PROPOSAL.md`); M10 adds the room and the room mics.
Sources: `room/SOURCES.md`. Numbers computed as shown.

## 1. The room (all drawing defaults, not published figures)

No source gives a room. One studio live room is proposed, sized so that the one sourced distant
figure (UA: "about 15 feet away in the corners of the room") is literally true.

| Item | Value (mm) | Rule |
|---|---|---|
| Kit centre C_k (plan) | (−195, −165) | midpoint of the kick batter centre O and the snare centre S0 (drawing default; also the mono-OH plan point) |
| Back wall (behind the drummer) | x = −2500 | drawing default |
| Side walls | z = −165 ± 2700 → z = −2865 and z = +2535 | drawing default |
| Front wall | x = 3996.4 | DERIVED: a corner mic inset 300 from both walls is 4572 (15 ft) from C_k in plan: x = −195 + √(4572² − 2400²) + 300 |
| Ceiling | h = 3000 (y = −2709.6) | drawing default (fits Shure's 2–3 m overhead band, S-REC1) |
| Door, traffic route | door 900 wide on the back wall at z ∈ [1200, 2100]; route from the door to the kit's right side | drawing default (lesson L5 asks for them) |
| Room size | 6496.4 × 5400 × 3000 | DERIVED from the above |

Live variant: the same kit on a stage with the M01 wedges (`lesson.live.wedges`) and a PA pair at
the front edge; positions reuse the M01 setting page (ILLUSTRATIVE).

## 2. Room-mic starting points

| Id | Geometry | h above floor | Aim | Class / source |
|---|---|---|---|---|
| `rm.lowFrontPair` | omni pair centred on the kick axis, 1000 in front of the kick resonant head: centre (1457.2, ·, 0); spacing 400 across z (capsules at z = ±200) | 400 (drawing default for "low") → y = −109.6 | straight at the kit (−x) | 1000 SOURCED (DPA-KICK "approximately 1 meter in front of the kit, low, in front of the kick drum"); spacing TRIAL (DPA-STEREO 40 cm example); height drawing default |
| `rm.sm4.front` | one side-address cardioid on the kick axis, distance d ∈ [1000, 2000] from the kick resonant head (Shure's "(1–2 m)"); default d = 1500 → (1957.2, ·, 0) | 1000 (drawing default) | at C_k, logo face toward the kit | SOURCED range; height drawing default |
| `rm.sm4.over` | the same mic "as an overhead (above the kit, facing down)" | see M09 mono OH (h 1604.8) | down | SOURCED words |
| `rm.mono.trialA/B` | two marked positions in front of the kit, "at least a useful stride apart": A = (2200, ·, −165), B = (2950, ·, −165) | 1500 | at C_k | lesson trial; positions and the 750-mm stride are drawing defaults |
| `rm.cornerPair` | two mics 4572 from C_k in plan, 300 from both walls: L = (3696.4, ·, −2565), R = (3696.4, ·, 2235) | 2000 (drawing default) → y = −1709.6 | at C_k | SOURCED 15 ft (UA-STEREO); corners as in the anecdote ("one production example, not a prescription") |
| `rm.xy`, `rm.ms` | coincident pair at any permitted room point; X/Y 90° (DPA-STEREO); M/S Mid toward C_k, Side ±90° | user | | SOURCED geometry |

## 3. Arrival-time readouts (DERIVED; "calculated from the drawing", 20 °C, c = 343.21 m/s)

Δt = path / c (`SOURCES_SHARED.md` §1). At the defaults:

| From → to | Path (mm) | Time (ms) |
|---|---|---|
| snare S0 → corner mic R | 5012.8 | 14.61 |
| kick O → corner mic R | 4645.6 | 13.54 |
| kick O → low front pair centre | 1461.3 | 4.26 |
| snare S0 → low front pair centre | 1891.7 | 5.51 |

Show next to them the lesson's rule (L65): do not automatically time-align a room track. The
readout is information, not an instruction.

## 4. Keep-outs and safety regions

| Id | Region | Status |
|---|---|---|
| `ko.kitEnvelope` | the kit plan box `PLAN_BOX.kit` (u −1050…650, v −880…720) extended up to h 2000 | ILLUSTRATIVE (shared kit file) |
| `ko.door`, `ko.route` | door swing (r 900) and a 900-wide traffic route | drawing default |
| `ko.wallMount` | any position touching a wall, ceiling or grid is refused (lesson L70) | rule |
| `ko.boom` | a long boom over the kit needs a counterweighted base (drawn as a state, lesson L70) | rule |
| `ko.pa`, `ko.wedge` (live) | PA and wedge boxes from the live scene | ILLUSTRATIVE |

## 5. Invariant tests

- Corner mics are 4572 ± 1 mm from C_k in plan and 300 mm from two walls.
- `rm.lowFrontPair` centre is 1000 mm in front of the kick resonant head (x = 457.2 + 1000).
- `rm.sm4.front` distance stays in [1000, 2000] while it is labelled as the SM4 start.
- Arrival-time table recomputes from geometry (no hard-coded ms).

## 6. UNKNOWNS for the owner

1. The room (size, ceiling, door) — one studio room proposed; a club/stage room can be added.
2. Low-front pair height and spacing (400 / 400 mm). 3. SM4 height (1000 mm). 4. Corner-pair height
(2000 mm). 5. The "useful stride" (750 mm).
