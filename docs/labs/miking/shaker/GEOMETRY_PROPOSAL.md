# I03a Shaker: GEOMETRY PROPOSAL (and §A, the SMALL-PERCUSSION FAMILY used by I03–I06)

Classes: `hihat/GEOMETRY_PROPOSAL.md`. Frame H (`congas/GEOMETRY_PROPOSAL.md`): origin floor under
the instrument's normal playing position, +x toward the audience/mic side, +y down (h ↦ −h), +z
the player's right; the player stands (or sits) at −x.

## §A. Small-percussion family (one scene, one parameter row per instrument)

| Part | Rule | Class |
|---|---|---|
| player | standing; chest front plane at x = −250, shoulder height h 1400, eye level h 1600 | ILLUSTRATIVE |
| `P0` playing-zone centre | where the instrument spends most of the time: (0, h 1150, 0) in front of the chest (two-handed instruments: midway between the hands) | ILLUSTRATIVE (the lessons measure "from the center of the playing arc / area") |
| motion envelope `E` | per instrument (below): the volume the instrument + hands sweep, including accents and the largest stroke | DRAWING DEFAULT (no source gives one) |
| distance readout | from `P0` (the lessons' reference) AND, separately, "nearest point of `E`" (= clearance). Shure's "gap of at least 12 in / 30 cm" is drawn from the instrument at rest (`P0` minus the instrument's half-size) | lab convention |
| motion-direction toggle | toward/away vs side-to-side relative to the mic (YMH-REC3) — a source control with words ("accents louder" vs "more even") | SOURCED words |
| Shure floor | ring at 304.8 from the instrument | SOURCED (S-HOME) |
| comparator | two positions at matched level (each lesson's pair, e.g. 300 and 600) | lesson |
| meters | peak meter, not VU (YMH-REC3) | SOURCED |
| keep-outs | `E` + 50; stand legs and boom outside `E`; cable away from the feet; boom counterweighted (lesson) | DRAWING DEFAULT + lesson rules |

## §B. Shaker row

| Item | Value | Class |
|---|---|---|
| shell | cylinder Ø 45 × 160 (small) / Ø 55 × 200 (large) | DRAWING DEFAULT (Meinl gives no size) |
| `E` | ellipsoid around `P0`: ±150 along the shake axis, ±60 across, ±60 up/down | DRAWING DEFAULT |
| `zone.shaker.trial` | 300–600 from `P0`, on the audience side | lesson TRIAL |
| `zone.shaker.shure` | ≥ 304.8 from the shell | SOURCED (S-HOME) |
| `zone.shaker.yamaha` | 203.2 from the player's chest plane (YMH-REC3 "player stand about eight inches from the mic") — shown as a published alternative; check against `E` | SOURCED |

Owner: shaker sizes, `E` sizes, posture; whether to show the Yamaha 8-in point (closer than Shure's 30 cm).
