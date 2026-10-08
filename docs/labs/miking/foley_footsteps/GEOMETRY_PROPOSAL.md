# F01 Foley Footsteps: GEOMETRY PROPOSAL — defines the shared FOLEY STAGE family (frame F)

Status: PROPOSAL. No app code. Sources: `foley_footsteps/SOURCES.md` (keys in §0). Value classes as
`kick/GEOMETRY_PROPOSAL.md`: SOURCED / DERIVED / TRIAL / UNKNOWN; a drawing that needs an UNKNOWN uses a
**drawing default** (`placeholder: true`, never shown as a readout, on the owner list). The app shows **suggested
starting points** only, one zone style, no source names, no badges (LESSON_JOURNEY §12). Fully silent.

## 1. Frame F (Foley stage) — used by F01–F05 (and later F09 practical sounds)

- Units mm, degrees. **Origin = centre of the ACTIVE AREA on the walking surface** (F01: the central footfall
  area, the lesson's own reference L12 "capsule to the central active footfall area"; F02: the active fabric; F03:
  the prop's sounding part; F04: the impact point / water entry; F05: the start of the action path).
- Axes follow frame S (`lessons/shared/ensemble/frameS.ts`) so the shared stereo-array tool drops in unchanged:
  +x to the **recordist's right** (the mic side looking at the stage), +y **down** (floor y = 0, a height h is
  y = −h), +z **toward the recordist / control-room glass**; the performer works at z ≤ 0.
- Views from ONE model: **plan** (x, z) and **side/section** (−z, y), as frame S. Scale 0.3 m (a prop) to ~5 m
  (the 3.5 m perspective plus the room mic). Readouts in the app's unit setting; rounding to 10 mm below 1 m,
  50 mm above (D10 rounding scaled — new rule to put in `engine/model/units.ts`, shared by Lab 6/7).

## 2. The Foley stage model (`lessons/shared/foley/stage.ts` — NEW, built once by group 1)

| Item | Value | Class |
|---|---|---|
| Pit (one surface bay) | 1200 × 1000 mm inside; rim 100 mm; min usable area 0.8 m² | SOURCED (FF-PIT, practice) |
| Pit depth (dry surfaces) | 100 mm | drawing default (inside FF-PIT's 50–1000 mm) |
| Base slab (section only) | ≥ 300 mm; FF's own 350 mm on dense sand | SOURCED (FF-PIT) |
| Surface variants | `tile`, `woodPanel` (hollow, drawn with its void), `concrete`, `gravel`, `leaves`, `carpetOver` (carpet on wood or tile, both layers in section) | SOURCED list (NF-FOLEY, FF-CUE, FF-KMR); textures drawn as real material, not hatching |
| Neighbouring pits / props table | 2 pits side by side + a prop table at the back | drawing default |
| Room shell | stage floor, one back wall, the control-room window behind the recordist | drawing default (no dimensions published) |
| Live variant | theatre Foley booth at stage left (ENO-FOLEY "a special booth is constructed stage left"), a PA cabinet and a wedge | SOURCED placement idea; dimensions drawing default |

## 3. The performer and the motion envelope (`lessons/shared/foley/performer.ts` — NEW, reuses `shared/players`)

- A standing/walking adult in the house figure style (`PlayerFigure.tsx` + `playerPose.ts`, new poses `walkHeel`,
  `walkToe`, `pivot`, `scuff`). Body dimensions: drawing default (as the Lab 5 head).
- **Footfall area** = the pit's walkable rectangle. **Motion envelope** (keep-out, hatched in the house keep-out
  style) = footfall area + arm/body sweep: drawing default 450 mm beyond the pit edge on the walking sides and a
  2000 mm-high body column. No source gives a clearance (lesson L126 says so) → `placeholder: true`; the copy says
  "the performer's whole movement — mark it on the floor before any stand goes up" (lesson L69, safety, exact).
- Exit path: a 600 mm strip from the pit to the stage door side (drawing default) — stands and cables may not
  enter it (L69).

## 4. Microphones and mounts (shared; `lessons/shared/fieldmics/` — NEW, built once by group 1)

| Type id | Body (drawing) | Pattern | Notes |
|---|---|---|---|
| `shotgunShort` | Ø 19 × 250 mm, capsule 200 mm behind the grille | `supercardioid` below f_t, narrowing lobe above (SOURCES §c) | NEW pattern renderer `shotgunLobe` (ILLUSTRATIVE banded lobe; "a simplified picture" said once). Body = one real model's published size (SEN-416, Low) → drawing default. |
| `scSupercard` | small-diaphragm supercardioid, existing small condenser art | `supercardioid` | "no interference tube" (L9) |
| `ldcFoley` | reuse Lab 5 `grpLdc` (shared LDC) | cardioid | NoiseFloor's second option; also the room mic |
| `shockMount` | elastic cradle drawn on every stand mic | — | F01-C5 |

Mounts: `stand` (existing; a heavy round-base stand is drawn on the stage floor, never inside the envelope) and the
**`pole` boom** (NEW MountKind, group 1, used by F02/F03/F08 and Lab 7): a hand-held pole from an operator figure,
tip over or beside the action; geometry = operator hand point + pole length (drawing default 2000 mm) + aim.

## 5. Zones (distances = capsule → origin, along the aim)

| Zone id | Geometry | Class / source | Starting-setup role |
|---|---|---|---|
| `zone.f01.roesch` | r ∈ [914, 1829], mic in front or to the side, plan bearing ≈ 15° off the performer's front line, aimed at the footfall centre | SOURCED (MIX-2005); bearing = interpretation (drawing default 15°) | **ONE MIC** (worked example) |
| `zone.f01.close` | r ∈ [800, 1000], aimed "across or down toward the contact zone" (L17) | TRIAL (lesson's own, UNSOURCED) — owner decision O-1 | **CLOSE · LIVE** (and the live theatre start) |
| `zone.f01.mid` | r ∈ [1500, 2000] | SOURCED (FF-KMR) | **FARTHER BACK · STUDIO** |
| `zone.f01.far` | r = 3500 (one scene: a fight on gravel) | SOURCED (FF-HP), one example | ANOTHER START ("a wide scene, judged in the mix") |
| `pair.f01.closeRoom` | close shotgun in `zone.f01.roesch` + room LDC at r = 3000 (drawing default), height 2000 | SOURCED method (MIX-2005, HECKER, ASE-CROSS); room distance drawing default | **TWO MICS** (`setupPairs` entry, logged) |

Heights: capsule height above the floor is UNKNOWN in every source → drawing default 600 mm for r ≤ 1 m (aim
"down toward the contact zone"), 1200 mm beyond; the aim always ends at the origin. Constraint (DERIVED): every
zone start must lie outside the motion envelope; `zone.f01.close` at 800 mm from the pit centre is 200 mm outside a
1200 mm-wide pit edge only along x — the builder checks with `geometry/collision.nearestClear` and moves the mic
(not the envelope) if they touch; log it.

## 6. Readouts (calculated from the drawing)
- Distance r and the arrival angle at the capsule (`polar.ts`); "steps nearer the mic vs farther" level spread
  across the pit = inverse square between the nearest and farthest footfall (`levels.levelDiffDb`), the only number
  shown; shotgun banded lobe: words only.
- TWO MICS: Δt and the ideal comb from `twoMic.ts` (existing), polarity note (DPA-POL), "check in mono".
- Live: wedge in the mic's null (S-LIVE angles), NOM readout (S-AUTOMIX / S-LIVE), no feedback animation.

## 7. MEET IT — where the sound comes from (visual physics only)
The heel strike → sole/floor contact → surface texture → the floor or panel under it (section view; the hollow
panel's void and a base-floor layer drawn) → the room. Shoe close-up (heel, toe, sole material) as tap-to-name parts.
No curve; "the hollow panel and the layer under the carpet can add a boom" in words (FF-PIT 80–200 Hz kept
internal, may be shown as "a low boom" only).

## 8. Owner list
O-1 the 0.8–1.0 m CLOSE start (lesson's own trial) — show it, or use Roesch's 0.9 m lower edge? · O-2 approve the
drawn shotgun lobe (simplified picture) · O-3 performer art (walking person, shoes) · O-4 the 15° reading of Roesch.
