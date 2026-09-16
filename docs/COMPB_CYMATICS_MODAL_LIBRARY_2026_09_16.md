# Computer B handoff — Cymatics Lab plate MODAL LIBRARY (2026-09-16)

**Ask:** numerically solved free-vibration modes for the plate shapes that have no closed form, delivered as JSON the app loads by lookup. Owner decision 2026-09-16: "complex shapes → Comp B". The app's analytic shapes (square, rectangle, disc) are already live in Phase 1; these plug into the same studio as extra SHAPE options.

## Shapes wanted (free edges unless noted; unit size = 1)
| id | geometry | notes |
|---|---|---|
| `triangle` | equilateral, side 1 | free edges |
| `hexagon` | regular, flat-to-flat 1 | free edges |
| `ring` | annulus, outer Ø 1, inner Ø 0.35 | free outer + free inner; ALSO a `ring-clamped-inner` variant (inner edge clamped, the bell-plate rig) |
| `bell` | "bell plate": disc Ø 1 with a centre post clamped over Ø 0.12 | clamped centre patch, free rim |
| `guitar` | classical-guitar lower+upper bout outline (provide the polygon you use) | free edges |
| `violin` | violin top outline WITHOUT f-holes, then a second variant WITH f-holes | free edges |

## Physics
Kirchhoff thin plate, isotropic, ν = 0.33, uniform thickness. Solve the eigenproblem `D∇⁴W = ρ h ω² W` on the shape with the stated boundary conditions. Finite-difference (13-point biharmonic stencil with free-edge ghost rows) or FEM (e.g. a DKT/Kirchhoff element via any FEM package) — your call; **the app only consumes the result**. Discard the rigid-body modes (λ² = 0). Report the first **16 elastic modes**.

## Deliverable — one JSON per shape variant
```json
{
  "schema": "ape_cymatics_modal_library",
  "version": 1,
  "shape": "hexagon",
  "boundary": "free",
  "nu": 0.33,
  "grid": { "nx": 96, "ny": 96, "x0": 0, "y0": 0, "dx": 0.010526, "dy": 0.010526 },
  "mask": "<base64 of nx*ny uint8: 1 = inside plate, 0 = outside>",
  "outline": [[x, y], …],                // plate boundary polygon in grid units (0..1), for drawing
  "modes": [
    {
      "id": "hex-01",
      "lambda2": 12.34,                    // dimensionless: ω = (λ²/L²)·√(D/ρh), L = the unit size above
      "nodalLines": 2,                     // your count (for the teaching label)
      "label": "2 nodal lines",
      "W": "<base64 of nx*ny int8: displacement quantised to −127..127, unit-normalised (max |W| = 127); 0 outside the mask>"
    }
  ]
}
```
- `lambda2` is what the app scales with the exact law `f = (λ²/2πL²)·√(E h²/12ρ(1−ν²))`, so please give it against **L = 1 (the unit size in the table)**.
- Quantised int8 displacement is plenty for the visuals (particles descend |W| gradients; heat/phase views read the sign).
- Grid 96×96 is the target (≈ 9 KB per mode after base64; 16 modes ≈ 150 KB per shape). If you prefer 64×64, say so.
- Please include a small `validation` block per file: the first three λ² compared with any published value you can find (Leissa lists free equilateral triangles and annular plates), so the app can print "Calculated · validated" vs "Calculated".

## How the app will use it
`src/features/cymatics/plateModes.ts` gets a `libraryModes(shapeId)` branch that returns the same `PlateMode[]` the analytic shapes produce — `shape(x, y)` becomes a bilinear lookup into `W`, `lam2` = `lambda2`, and the existing driver/support weighting, resonance readout, heat/phase/node/3D views and particle engine work unchanged. Until a file lands, the SHAPE tray shows those rows dimmed as *Planned*.

## Where to put it
`D:\` or `Downloads` as usual, folder `cymatics_modal_library/` with one file per variant + a README naming the solver, mesh size and how the λ² were normalised. ccode ingests into `src/data/cymatics/` and commits.
