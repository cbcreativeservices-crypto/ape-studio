# B08 Broadcast Audience and Event Space: GEOMETRY PROPOSAL — defines the VENUE / AUDIENCE plan

## 1. Venue plan (NEW once → shared/broadcast/venue.ts; reused by B06 and later B13–B17)
- Built on frame S (`lessons/shared/ensemble/frameS.ts`): a stage, audience SECTIONS as seated rows of people
  (REUSE the seating builder's seat tokens in plan; heads in section view), aisles, exits (keep-out), camera
  positions, PA clusters with coverage wedges (drawing-default dispersion; text "a simplified picture"), front fills,
  subwoofers, HVAC token.
- Two presets: small studio audience (one section) and a larger multi-section event (arena-like bowl in plan).
  All dimensions drawing defaults.

## 2. Mics
Directional crowd mic `arrCard` / `sdcCard` (REUSE), stereo-array tool presets XY / ORTF / AB (REUSE
`ensemble/stereoArray.ts`), NEW tokens: `surround5` (a 5-capsule surround head — 3 front, 2 rear) and `ambi4`
(tetrahedral 4-capsule) drawn as real objects, with a "front" arrow; no decode, only channel labels and orientation.

## 3. Zones
| Zone | Geometry | Class |
|---|---|---|
| `zone.b08.mono` | elevated above and somewhat in front of one section, aimed at faces, PA off-axis | SOURCED S-TOP6 (height/distance drawing default) |
| `zone.b08.twoZones` | left/right crowd mics at the stage edges / in front of sections, each aimed away from the PA | PRACTICE (lesson) |
| `zone.b08.xy`, `zone.b08.ortf`, `zone.b08.ab` | one location, preset arrays | SOURCED arrays (Lab 5) |
| `zone.b08.immersive` | surround/ambi token at one location | SOURCED format facts; position drawing default |

## 4. Readouts (DERIVED)
- **PA angle**: angle between each crowd mic's axis and the nearest PA cluster, with the pattern's rejection at that
  angle (first-order polar, S-LIVE nulls).
- **Near-spectator bias**: level from the nearest seat vs the section centre (inverse square) — "one person
  dominates" when > 6 dB (threshold = one distance doubling, DERIVED).
- **Two zones ≠ a pair**: Δt between two zone mics for a source at the centre and at one side; mono-sum first notch
  (twoMic); XY Δt = 0.
- Routing: crowd mics → broadcast/record only (ROUTING panel, `panels_press` §4); a check fails if routed to PA.

## 5. Setups
ONE MIC = `mono`; TWO MICS = `xy` at one location (pair) — contrasted with `twoZones`; CLOSE · LIVE = audience
question handheld (cross-link B06); FARTHER BACK = `ab` over the hall; ANOTHER START = `twoZones`, `immersive`.

## 6. Owner list
Venue presets and dimensions (drawing defaults); depth of the immersive part (proposed: tokens + channel map only);
PA dispersion drawing.
