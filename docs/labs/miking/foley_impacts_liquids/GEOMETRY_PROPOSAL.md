# F04 Impacts, Liquids and Textures: GEOMETRY PROPOSAL

Status: PROPOSAL. Frame F, stage, performer, mics, mounts: `foley_footsteps/GEOMETRY_PROPOSAL.md` (reuse).
No source distance or splash radius → all distances are drawing defaults (`placeholder: true`).

## 1. Sources (NEW art in `lessons/shared/foley/props.tsx`)

| Variant | Model (drawing default) | Sound-leaving parts | Keep-out |
|---|---|---|---|
| `impact` | padded block 150 × 100 × 60 mm struck on a wooden tabletop (750 mm high) | contact point, block body, table body, room | block travel (hand arc) |
| `water` | shallow basin Ø 400 × 120 mm on a stable low table, non-slip mat, towel; small jug pour | water entry, splash, container wall, drips | **splash envelope** (hatched, ILLUSTRATIVE): an ellipse 2.5 × the basin radius around it (drawing default), floor wet zone; ALL electronics, cable junctions and power outside it (L26) |
| `texture` | dry brush across coarse fabric on a board 600 × 400 mm | friction line along the stroke, board resonance | stroke path box |
| `hydrophone` (card) | an immersion-rated hydrophone (cable + body) in the basin vs an airborne mic above | — | ordinary mic NEVER in the basin (exact safety) |
| `contact` (card) | a contact transducer on a dry container wall | — | — |

## 2. Zones

| Zone id | Geometry | Class | Role |
|---|---|---|---|
| `zone.f04.side` | water: airborne mic off to the side of the basin, outside the splash envelope by ≥ 300 mm, aimed at the water entry | method SOURCED (L15; DS-BRY "off to one side"); margin drawing default | **ONE MIC** (worked example, water variant) |
| `zone.f04.contact` | impact: aimed at block + surface, r = 500 | drawing default (method L12) | **CLOSE · LIVE** |
| `zone.f04.room` | impact or water: r = 1500, object + room/drip tail | drawing default (method L12/L15, HECKER) | **FARTHER BACK · STUDIO** |
| `pair.f04.task` | mic A at the entry/impact, mic B on the body/tail/room — "a different task" (L30) | method SOURCED (ASE-ELEM) | **TWO MICS** |
| `zone.f04.stroke` | texture: aimed along the friction line, r = 400, never crossed by the brush | drawing default | ANOTHER START |

## 3. The sensing-medium card (NEW, shared by F04 and later F10/F16): `lessons/shared/field/medium.ts`
Three paths drawn side by side: AIR (airborne mic), WATER (hydrophone, pressure in water), STRUCTURE (contact
transducer). Each recorded track carries its medium label (L28 "Compare tracks with their sensing medium named").
New `transducer` kinds in `engine/model/types.ts`: `hydrophone`, `contact` (no polar pattern drawn: `unstated`).

## 4. Readouts and checks
- Splash check: the mic, its stand feet and cable route vs the envelope (fail = red keep-out; the copy: "move it
  outside the splash; a windshield is not a water barrier").
- Headroom card (words): set gain on the strongest planned hit; clipping at the mic, preamp or recorder cannot be
  fixed later (L23).
- TWO MICS Δt / comb (static sources; water "flow" stated in words).

## 5. Owner list
Splash-envelope drawing default (2.5 × basin radius, illustrative) · hydrophone/contact as cards only (no
placement) · F10 overlap.
