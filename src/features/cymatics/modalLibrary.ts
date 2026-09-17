/**
 * Cymatics Lab — the plate MODAL LIBRARY (spec §1.3): numerically solved free-
 * vibration modes for the plate shapes that have no closed form, delivered by
 * Computer B (2026-09-16) as one JSON per shape and consumed here by lookup.
 *
 * WHAT THE FILES ARE (src/data/cymatics/README_COMPB_2026_09_16.md): FEM
 * (Morley Kirchhoff plate triangle, scikit-fem) on ≈ 30–70 k triangles, ν =
 * 0.33, the first 16 ELASTIC modes per shape (rigid-body λ² = 0 discarded),
 * each mode's displacement W quantised to int8 on a 96 × 96 grid, unit-
 * normalised (max |W| = 127) and exactly 0 outside the plate mask. λ² is given
 * against L = 1 = the shape's stated unit dimension, so the app's exact
 * scaling law f = (λ² / 2π L²) · √(D / ρh) applies with L = the SIZE control.
 *
 * WHAT IS CALCULATED, WHAT IS VALIDATED: the solver reproduces the exact
 * Bessel free disc to 0.048 % and the annuli / bell to ≤ 0.11 % against the
 * exact annulus characteristic equation — those files carry a `validation`
 * block with published values and the badge says CALCULATED · VALIDATED. The
 * completely free triangle and hexagon have no published table (Leissa has
 * only sparse Chladni data there) and the instrument outlines are custom, so
 * they say CALCULATED. Nothing here is Approximated — the shapes are solved,
 * not fitted.
 *
 * PURE + import-free so node:test pins it (`parseLibraryFile` takes the parsed
 * JSON; the Metro `require` map lives in `loadLibraryShape`).
 */

export type LibraryShapeId = 'triangle' | 'hexagon' | 'ring' | 'ring-clamped-inner' | 'bell' | 'guitar' | 'violin' | 'violin-fholes';

export type LibraryShapeInfo = {
  id: LibraryShapeId;
  /** Tray chip label. */
  label: string;
  /** What the SIZE control means for this shape (the L = 1 unit in the file). */
  unitLabel: string;
  /** The boundary condition the file was solved with — fixed, not a control. */
  boundaryLabel: string;
  /** One line for the tray. */
  blurb: string;
};

export const LIBRARY_SHAPES: readonly LibraryShapeInfo[] = [
  { id: 'triangle', label: 'Triangle', unitLabel: 'side', boundaryLabel: 'Free edges (solved)', blurb: 'Equilateral, all edges free — three-fold figures the square cannot make.' },
  { id: 'hexagon', label: 'Hexagon', unitLabel: 'flat-to-flat', boundaryLabel: 'Free edges (solved)', blurb: 'Regular hexagon, free edges — six-fold families, many degenerate pairs.' },
  { id: 'ring', label: 'Ring', unitLabel: 'outer Ø', boundaryLabel: 'Free outer and inner edge (solved)', blurb: 'An annulus, inner Ø 35 % — the hole removes the centre antinode.' },
  { id: 'ring-clamped-inner', label: 'Ring · clamped hub', unitLabel: 'outer Ø', boundaryLabel: 'Free outer edge, clamped inner edge (solved)', blurb: 'The same annulus held rigidly at its hub — every mode rises and the umbrella mode appears.' },
  { id: 'bell', label: 'Bell plate', unitLabel: 'outer Ø', boundaryLabel: 'Clamped centre post (Ø 12 %), free rim (solved)', blurb: 'A disc clamped on a centre post — the classic bowed-plate rig, with the (0,0) umbrella mode.' },
  { id: 'guitar', label: 'Guitar plate', unitLabel: 'body length', boundaryLabel: 'Free edges (solved)', blurb: 'A classical-guitar top outline — the lutherie bending, torsion and ring modes.' },
  { id: 'violin', label: 'Violin plate', unitLabel: 'body length', boundaryLabel: 'Free edges (solved)', blurb: 'A violin top without f-holes — the free-plate modes luthiers tune by tap tone.' },
  { id: 'violin-fholes', label: 'Violin · f-holes', unitLabel: 'body length', boundaryLabel: 'Free edges (solved)', blurb: 'The same top with f-holes cut — see which modes the holes move.' },
];

const IDS = new Set<string>(LIBRARY_SHAPES.map((s) => s.id));
export function isLibraryShape(s: string): s is LibraryShapeId {
  return IDS.has(s);
}
export const LIBRARY_SHAPE_BY_ID: Record<LibraryShapeId, LibraryShapeInfo> = Object.fromEntries(LIBRARY_SHAPES.map((s) => [s.id, s])) as Record<LibraryShapeId, LibraryShapeInfo>;

/** The on-disk schema (schema `ape_cymatics_modal_library` v1). */
export type LibraryFile = {
  schema: string;
  version: number;
  shape: string;
  boundary: string;
  nu: number;
  solver?: string;
  notes?: string;
  grid: { nx: number; ny: number; x0: number; y0: number; dx: number; dy: number };
  /** base64 of nx·ny uint8, row-major (y outer), 1 = plate. */
  mask: string;
  /** Outer boundary polygon in grid coordinates. */
  outline: [number, number][];
  /** Interior boundaries (ring hole, f-holes) in grid coordinates. */
  holes?: [number, number][][];
  /** Bell: the clamped centre post, grid coordinates. */
  clampedPatch?: { cx: number; cy: number; d: number };
  validation?: { mode: string; lambda2: number; published: number | null; source: string }[];
  modes: { id: string; lambda2: number; nodalLines: number; label: string; W: string }[];
};

export type LibraryMode = {
  id: string;
  lambda2: number;
  nodalLines: number;
  label: string;
  /** int8 displacement, row-major, −127..127, 0 outside the mask. */
  W: Int8Array;
};

/** A decoded shape. Coordinates are PLATE-NORMALISED: x ∈ [0,1] across the
 *  grid's x-span, y ∈ [0, aspect] where aspect = y-span / x-span (a violin is
 *  taller than it is wide, so its aspect is > 1). */
export type LibraryShape = {
  id: LibraryShapeId;
  info: LibraryShapeInfo;
  nx: number;
  ny: number;
  aspect: number;
  mask: Uint8Array;
  outline: { x: number; y: number }[];
  holes: { x: number; y: number }[][];
  clampedPatch: { x: number; y: number; r: number } | null;
  modes: LibraryMode[];
  /** Every validation row has a published value it matches. */
  validated: boolean;
  /** One line for the honesty text. */
  validationNote: string;
  boundary: string;
  nu: number;
};

// ── base64 → bytes (no runtime assumptions: Hermes and node:test both take it) ──
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LUT = (() => {
  const t = new Int16Array(256).fill(-1);
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i;
  return t;
})();
export function decodeBase64(s: string): Uint8Array {
  let len = s.length;
  while (len > 0 && (s[len - 1] === '=' || s[len - 1] === '\n' || s[len - 1] === '\r')) len--;
  const out = new Uint8Array(Math.floor((len * 3) / 4));
  let o = 0;
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < len; i++) {
    const v = B64_LUT[s.charCodeAt(i)];
    if (v < 0) continue; // whitespace
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 0xff;
    }
  }
  return o === out.length ? out : out.subarray(0, o);
}

/** Parse one file into a decoded shape. Throws on a schema mismatch — a bad
 *  file must fail loudly in tests, never render a wrong plate. */
export function parseLibraryFile(raw: LibraryFile): LibraryShape {
  if (raw.schema !== 'ape_cymatics_modal_library' || raw.version !== 1) throw new Error(`modal library: unexpected schema ${raw.schema} v${raw.version}`);
  if (!isLibraryShape(raw.shape)) throw new Error(`modal library: unknown shape ${raw.shape}`);
  const { nx, ny, dx, dy } = raw.grid;
  const xSpan = (nx - 1) * dx;
  const ySpan = (ny - 1) * dy;
  const aspect = ySpan / xSpan;
  const mask = decodeBase64(raw.mask);
  if (mask.length !== nx * ny) throw new Error(`modal library ${raw.shape}: mask ${mask.length} ≠ ${nx * ny}`);
  const norm = (p: [number, number]) => ({ x: (p[0] - raw.grid.x0) / xSpan, y: (p[1] - raw.grid.y0) / xSpan });
  const modes: LibraryMode[] = raw.modes.map((m) => {
    const bytes = decodeBase64(m.W);
    if (bytes.length !== nx * ny) throw new Error(`modal library ${raw.shape}/${m.id}: W ${bytes.length} ≠ ${nx * ny}`);
    return { id: m.id, lambda2: m.lambda2, nodalLines: m.nodalLines, label: m.label, W: new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length) };
  });
  const validation = raw.validation ?? [];
  const validated = validation.length > 0 && validation.every((v) => v.published != null);
  let validationNote: string;
  if (validated) {
    const worst = Math.max(...validation.map((v) => Math.abs(v.lambda2 / (v.published as number) - 1)));
    validationNote = `first ${validation.length} modes within ${(worst * 100).toFixed(2)} % of the exact characteristic equation`;
  } else if (validation.some((v) => /mesh refinement/i.test(v.source))) {
    validationNote = 'no published table exists for this boundary; mesh-refinement check < 0.01 %, solver validated on the exact disc';
  } else {
    validationNote = 'custom outline, no published values; solver validated on the exact disc';
  }
  return {
    id: raw.shape,
    info: LIBRARY_SHAPE_BY_ID[raw.shape],
    nx,
    ny,
    aspect,
    mask,
    outline: raw.outline.map(norm),
    holes: (raw.holes ?? []).map((h) => h.map(norm)),
    clampedPatch: raw.clampedPatch ? { x: (raw.clampedPatch.cx - raw.grid.x0) / xSpan, y: (raw.clampedPatch.cy - raw.grid.y0) / xSpan, r: raw.clampedPatch.d / 2 / xSpan } : null,
    modes,
    validated,
    validationNote,
    boundary: raw.boundary,
    nu: raw.nu,
  };
}

// ── Metro-bundled files, decoded once ─────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-require-imports */
const FILES: Record<LibraryShapeId, () => LibraryFile> = {
  triangle: () => require('../../data/cymatics/triangle.json') as LibraryFile,
  hexagon: () => require('../../data/cymatics/hexagon.json') as LibraryFile,
  ring: () => require('../../data/cymatics/ring.json') as LibraryFile,
  'ring-clamped-inner': () => require('../../data/cymatics/ring-clamped-inner.json') as LibraryFile,
  bell: () => require('../../data/cymatics/bell.json') as LibraryFile,
  guitar: () => require('../../data/cymatics/guitar.json') as LibraryFile,
  violin: () => require('../../data/cymatics/violin.json') as LibraryFile,
  'violin-fholes': () => require('../../data/cymatics/violin-fholes.json') as LibraryFile,
};
/* eslint-enable @typescript-eslint/no-require-imports */
const cache = new Map<LibraryShapeId, LibraryShape>();
export function loadLibraryShape(id: LibraryShapeId): LibraryShape {
  let s = cache.get(id);
  if (!s) {
    s = parseLibraryFile(FILES[id]());
    cache.set(id, s);
  }
  return s;
}
/** node:test path: the ESM runner has no `require`, so a test reads the JSON
 *  with `fs`, parses it with `parseLibraryFile`, and primes the cache here
 *  before exercising `plateModes()`. On the device Metro bundles the files
 *  and `loadLibraryShape` never needs this. */
export function primeLibraryShape(shape: LibraryShape): void {
  cache.set(shape.id, shape);
}

// ── lookups (plate-normalised x ∈ [0,1], yN ∈ [0,1] across the y-span) ────────
/** Is the plate present at (x, yN)? Nearest-cell mask lookup. */
export function libraryInside(lib: LibraryShape, x: number, yN: number): boolean {
  if (x < 0 || x > 1 || yN < 0 || yN > 1) return false;
  const i = Math.max(0, Math.min(lib.nx - 1, Math.round(x * (lib.nx - 1))));
  const j = Math.max(0, Math.min(lib.ny - 1, Math.round(yN * (lib.ny - 1))));
  return lib.mask[j * lib.nx + i] === 1;
}

/** Nearest plate point to (x, yN) — for a driver or clamp asked to sit where
 *  there is no plate (a triangle's corner box, a ring's hole). */
export function librarySnapInside(lib: LibraryShape, x: number, yN: number): { x: number; y: number } {
  if (libraryInside(lib, x, yN)) return { x, y: yN };
  const gx = x * (lib.nx - 1);
  const gy = yN * (lib.ny - 1);
  let best = Infinity;
  let bi = 0;
  let bj = 0;
  for (let j = 0; j < lib.ny; j++) {
    for (let i = 0; i < lib.nx; i++) {
      if (lib.mask[j * lib.nx + i] !== 1) continue;
      const d = (i - gx) * (i - gx) + (j - gy) * (j - gy);
      if (d < best) {
        best = d;
        bi = i;
        bj = j;
      }
    }
  }
  return { x: bi / (lib.nx - 1), y: bj / (lib.ny - 1) };
}

/** The mode shape as a function: bilinear lookup into W, unit-normalised
 *  (÷127), 0 outside the plate. Same contract as the analytic `shape(x, y)`. */
export function libraryShapeFn(lib: LibraryShape, W: Int8Array): (x: number, yN: number) => number {
  const { nx, ny, mask } = lib;
  return (x, yN) => {
    if (x < 0 || x > 1 || yN < 0 || yN > 1) return 0;
    const gx = x * (nx - 1);
    const gy = yN * (ny - 1);
    const i0 = Math.max(0, Math.min(nx - 2, Math.floor(gx)));
    const j0 = Math.max(0, Math.min(ny - 2, Math.floor(gy)));
    const fx = Math.max(0, Math.min(1, gx - i0));
    const fy = Math.max(0, Math.min(1, gy - j0));
    const k = j0 * nx + i0;
    // Bilinear over the four corners; a corner outside the mask contributes 0
    // (W is 0 there by construction), so the field fades to the edge cleanly.
    const a = W[k];
    const b = W[k + 1];
    const c = W[k + nx];
    const d = W[k + nx + 1];
    const v = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    // Outside the plate proper (nearest cell empty) → exactly 0.
    if (mask[Math.round(gy) * nx + Math.round(gx)] !== 1) return 0;
    return v / 127;
  };
}
