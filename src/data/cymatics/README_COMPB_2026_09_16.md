# Cymatics Lab — plate MODAL LIBRARY (Computer B deliverable, 2026-09-16)

Numerically solved free-vibration modes for the eight plate-shape variants in
`shapes_scope.json`. One JSON per variant, schema `ape_cymatics_modal_library` v1,
96×96 grid, 16 elastic modes each (rigid-body λ² = 0 modes discarded), ν = 0.33.

## Solver

FEM, not the 13-point FDM stencil: **Morley nonconforming Kirchhoff plate triangle**
(scikit-fem 12.0.2) on unstructured meshes (Shewchuk Triangle, min angle 30°, max
element area 2·10⁻⁵ → ≈ 30 000–69 000 triangles, ≈ 47 000–104 000 DOF per shape).
Free edges are the *natural* boundary conditions of the plate weak form

  a(W,V) = ∫ ν ΔW ΔV + (1−ν) W,ij V,ij dΩ = λ⁴ ∫ W V dΩ  (D = ρh = 1, L = 1)

so no ghost rows are needed; clamped edges are enforced by eliminating both Morley
DOF types (vertex deflection + edge normal slope) on the clamped facets. Generalized
eigenproblem solved with ARPACK shift-invert; modes reported in ascending λ².

## Accuracy / validation

* Solver check against the **exact Bessel solution** of the free disc (Ø 1, ν = 0.33):
  max λ² error **0.048 %** over the first 16 elastic modes (mesh-convergence check:
  refining 2·10⁻⁵ → 8·10⁻⁶ moves λ² by < 0.01 %). The same exact machinery reproduces
  Leissa NASA SP-160's free-disc table (k²a² = 5.25, 9.07, 12.24, 20.51, 21.53 …).
* `ring`, `ring-clamped-inner`, `bell`: per-file `validation` blocks compare the first
  three FEM λ² with the **exact annulus characteristic equation** (Bessel J, Y, I, K,
  same BCs, same ν) solved this run — agreement 0.00–0.11 %.
* `triangle`, `hexagon`: no accessible published λ² table was found for the completely
  free case (NASA SP-160 carries only sparse Chladni-figure data there), stated
  honestly in the files; both are covered by the disc validation + mesh-refinement
  check above.
* `guitar`, `violin`, `violin-fholes`: custom outlines, no published values (stated
  in-file). Mode sequences reproduce the classic free-plate lutherie patterns
  (bending, torsion, ring-mode families).

## λ² normalisation (per the brief: L = 1 = the unit size in the shapes table)

Each shape is built in coordinates where its stated unit dimension equals exactly 1,
and λ² = √μ from the eigensolve in those coordinates, so the app's law
`f = (λ²/2πL²)·√(E h²/12ρ(1−ν²))` applies directly with the physical L being:

| shape | L = 1 means | grid bbox (x × y) |
|---|---|---|
| triangle | side | 1.000 × 0.866 |
| hexagon | flat-to-flat (corner-to-corner = 1.1547 = grid x-span) | 1.155 × 1.000 |
| ring, ring-clamped-inner | outer diameter | 1.000 × 1.000 |
| bell | outer diameter | 1.000 × 1.000 |
| guitar | body length (y axis); lower-bout width 0.736 | 0.736 × 1.000 |
| violin, violin-fholes | body length (y axis); lower-bout width 0.584 | 0.584 × 1.000 |

## File format notes

* `grid`: `x0 = y0 = 0`; `dx = (bbox width)/(nx−1)`, `dy = (bbox height)/(ny−1)` —
  pixels are square only when the bbox is; bilinear lookup with the stated dx/dy is
  exact either way.
* `mask`: base64 of nx·ny **uint8**, row-major, y outer (index = iy·nx + ix), 1 = plate.
* `W`: base64 of nx·ny **int8**, same ordering, unit-normalised per mode
  (max |W| = 127), exactly 0 outside the mask.
* `outline`: the outer boundary polygon in the same coordinates as the grid.
  Shapes with interior boundaries also carry a **`holes`** array (list of polygons):
  `ring`/`ring-clamped-inner` (inner circle) and `violin-fholes` (two f-holes).
* `bell`: modelled as an annulus with the inner edge (Ø 0.12) clamped — the standard
  idealisation of a centre post clamping the patch. The mask/outline cover the **full
  disc** (the patch is plate, it just doesn't move): W = 0 there, no `holes` entry.
  Extra key `clampedPatch: {cx, cy, d}` is included for drawing the post.
* `nodalLines` / `label`: automated count of connected zero-level curves
  (closed interior loops + boundary-to-boundary lines, from the FEM zero contour).
  On shapes with holes, a "diameter" interrupted by a hole counts per segment —
  e.g. the ring's first mode (2 diameters → 4 radial segments) is "4 nodal lines".
  Bell mode 3 legitimately has **0** nodal lines (monotone umbrella mode; the clamp
  edge itself is not counted).
* Guitar/violin outlines are mirror-symmetric PCHIP curves through stated control
  points (in each file's `outline`); classical proportions (guitar lower bout 0.736·L,
  waist 0.470·L, upper bout 0.556·L; violin 0.584/0.314/0.472·L). The violin's
  f-holes are simplified slots (curved 0.025-wide channel + Ø 0.04 eyes) flanking the
  centreline near the waist — real f-hole geometry is finer than a 96×96 grid cell,
  so the slots keep the acoustically relevant mass/stiffness removal without
  sub-pixel detail. Their polygons are in `holes`.

## Files

triangle.json, hexagon.json, ring.json, ring-clamped-inner.json, bell.json,
guitar.json, violin.json, violin-fholes.json — plus `previews/preview_<shape>.png`
contact sheets (16 modes each, red/blue = ±W, black = nodal lines) for eyeballing;
the previews are not consumed by the app.

Ingest as planned into `src/data/cymatics/`; `libraryModes(shapeId)` can treat every
file identically — bilinear lookup into `W`, `lam2 = lambda2`.
