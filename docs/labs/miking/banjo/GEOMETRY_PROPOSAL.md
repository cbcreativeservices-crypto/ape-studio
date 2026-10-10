# C05a Banjo: GEOMETRY PROPOSAL (medium depth)

> **Superseded numbers (owner 2026-10-10).** The lab now draws a STANDARD 5-string, not the museum banjo:
> head Ø 279.4 mm (11 in), scale 666.75 mm (26¼ in), fifth string 499.5 mm, bridge one third of the head
> in from the tail-side rim (pot centre +46.6 mm from the bridge). Live values: `shared/guitars/guitarSpec.ts`
> and `c05aBanjo/model.ts`. The figures below (Ø 285 / 720 / 555, centre −95) are the original proposal.

Guitar-body family variant `banjo pot` (`acoustic_guitar/GEOMETRY_PROPOSAL.md` §7), frame G with the
origin at the **bridge foot on the head** (the banjo bridge floats on the head; Deering).

| Item | Value | Class |
|---|---|---|
| Head (membrane) | circle Ø 285, centre at x = −95 (bridge placed 0.33·Ø toward the tail from centre: drawing default) | Ø SOURCED MET-BANJO (TRIAL modern) |
| Pot/rim depth | 70; resonator (optional) adds 40 behind, Ø 330 | drawing defaults |
| Scale (bridge → nut) | 720 (longest string) | SOURCED MET-BANJO |
| Fifth string | 555 long, peg at x = 555 from the bridge on the bass side | SOURCED length (MET-BANJO "shortest ca. 55.5 cm"); peg position DERIVED |
| Neck joins pot | x = −95 + 142.5 = +47.5 (rim edge) | DERIVED from defaults |
| Tailpiece | x ∈ [−240, −200] over the tail of the rim | drawing default |
| Open-back / resonator | flag; default resonator | lesson |

| Zone id | Position | Verification | Source |
|---|---|---|---|
| `zone.bj.neckJoint` (start) | aimed at the neck/pot junction (x ≈ +47.5, y = 0), d = 300–400 | **TRIAL** (lesson's one-mic reading of DPA's stereo "30-40 cm … distance"); target CONFIRMED | DPA-BANJO |
| `zone.bj.head.centre` | 76.2 in front of the head centre | **DIFFERENT**: replaces the lesson's "1 ft from the bridge" | S-LIVE, S-REC |
| `zone.bj.head.edge` | 76.2 in front of the head edge | not in lesson | S-LIVE, S-REC |
| `zone.bj.tailpiece` | mini clipped to the tailpiece, aimed at the bridge | CONFIRMED (wording fix) | S-LIVE, S-REC |
| `zone.bj.xy` | XY 4011 pair at the sweet spot | CONFIRMED | DPA-BANJO |
| `zone.bj.clip` | VC4099 on the rim | CONFIRMED | DPA-VC4099 |

Keep-outs: the head (no contact), bridge, picking hand over the head (x ∈ [−200, +60], z ∈ [0, 100]),
fretting hand on the neck. Posture: seated or strap-standing like the guitar (drawing defaults).
