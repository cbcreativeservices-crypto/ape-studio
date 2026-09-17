/**
 * Cymatics Lab — solid-plate modal model (spec §1.1). PURE + import-free
 * (materials aside) so node:test pins it and the viz worklets can consume its
 * outputs (plain numbers / Float32Array — nothing here touches React).
 *
 * WHAT IS EXACT, WHAT IS APPROXIMATED (every screen labels this honestly):
 *  • The SCALING LAW is exact for geometrically similar plates with the same
 *    support:  f = (λ² / 2π a²) · √( D / ρh ),  D = E h³ / 12(1−ν²).
 *    Size ↑ → f ∝ 1/a²;  thickness ↑ → f ∝ h;  stiffer ↑, denser ↓.
 *  • CIRCULAR free plate: mode shapes J_n(k r)·cos(nθ) with the tabulated
 *    free-edge eigenvalues λ² (Leissa, NASA SP-160 "Vibration of Plates",
 *    ν ≈ 0.33). The true free-edge shape carries a small I_n(kr) term we omit
 *    → APPROXIMATED (nodal-circle radii within a few %).
 *  • RECTANGULAR / SQUARE free plate: no closed form exists. We use the
 *    classic teaching approximation — cos(mπx/a)·cos(nπy/b) shapes with
 *    free-free beam eigen-constants β_m ≈ (m+½)π and λ² ≈ β_m² + β_n²(a/b)²
 *    (Warburton's Rayleigh form without the cross term). Degenerate pairs on a
 *    square combine as W_mn ± W_nm — the diagonal Chladni figures. Nodal
 *    TOPOLOGY and ordering are right; frequencies are APPROXIMATED.
 *  • ORTHOTROPIC wood: D₁ (along grain) and D₂ (across), D₃ ≈ √(D₁D₂);
 *    f² ∝ (D₁β_m⁴ + D₂β_n⁴(a/b)⁴ + 2D₃β_m²β_n²(a/b)²) / (ρ h a⁴). The grain
 *    axis rotates which plate axis gets D₁ (cos²/sin² blend) → APPROXIMATED.
 *  • RESPONSE: single-DOF magnitude per mode, 1/√((1−r²)² + (r/Q)²), r = f/f_k.
 *  • DRIVE / SUPPORT: a mode is excited in proportion to |W_k| at the driver
 *    and suppressed by |W_k| at the support (a clamp forces a node there).
 */
import { MATERIAL_BY_ID, type MaterialId } from './materials';
import { isLibraryShape, libraryInside, libraryShapeFn, librarySnapInside, loadLibraryShape, type LibraryShapeId } from './modalLibrary';

/** Analytic shapes (square / rect / disc) plus the eight numerically solved
 *  MODAL-LIBRARY shapes (spec §1.3, Computer B 2026-09-16 — modalLibrary.ts). */
export type PlateShape = 'square' | 'rect' | 'circle' | LibraryShapeId;

/** The plate's y-extent / x-extent in plate-normalised units: 1 for a square
 *  or disc, the short/long ratio for a rectangle, and the solved grid's bbox
 *  ratio for a library shape (a violin is taller than wide → > 1). The grid,
 *  the viz and the exciter/support coordinates all use y ∈ [0, aspect]. */
export function plateAspect(spec: Pick<PlateSpec, 'shape' | 'aspect'>): number {
  if (spec.shape === 'rect') return Math.max(0.5, Math.min(1, spec.aspect));
  if (isLibraryShape(spec.shape)) return loadLibraryShape(spec.shape).aspect;
  return 1;
}
export type EdgeCondition = 'free' | 'supported' | 'clamped';

export type PlateSpec = {
  shape: PlateShape;
  /** Representative size, mm: side (square), long side (rect), diameter (circle). */
  sizeMm: number;
  /** Rectangle short/long ratio (0.5..1). Ignored for square/circle. */
  aspect: number;
  /** Thickness, mm. */
  thicknessMm: number;
  material: MaterialId;
  /** Wood grain angle, degrees from the plate x axis. */
  grainDeg: number;
  edge: EdgeCondition;
  /** 0..1 — scales the material Q down (1 = heavily damped). */
  damping: number;
  /** Driver position, plate-normalised 0..1 × 0..1. */
  exciter: { x: number; y: number };
  /** Support / clamp point, plate-normalised; null = centre-supported by default. */
  support: { x: number; y: number } | null;
};

export type PlateMode = {
  id: string;
  /** Human label: "(2,0)+(0,2)" / "2 diameters" etc. */
  label: string;
  /** Dimensionless λ² for the frequency law (already includes aspect + grain). */
  lam2: number;
  /** Resonant frequency for the current spec, Hz. */
  hz: number;
  /** Weight from driver/support placement, 0..1 (0 = cannot be excited). */
  drive: number;
  /** Nodal-line count hint for the teaching panel. */
  nodalLines: number;
  /** Evaluate the unit-normalised mode shape at plate-normalised (x,y) ∈ [0,1]². */
  shape: (x: number, y: number) => number;
};

// ── Bessel J_n (series for small x, asymptotic for large) ─────────────────────
export function besselJ(n: number, x: number): number {
  if (x === 0) return n === 0 ? 1 : 0;
  if (x < 12 + n) {
    // Power series: Σ (−1)^k (x/2)^(2k+n) / (k! (k+n)!)
    let term = Math.pow(x / 2, n);
    for (let i = 1; i <= n; i++) term /= i;
    let sum = term;
    const q = -(x * x) / 4;
    for (let k = 1; k < 60; k++) {
      term *= q / (k * (k + n));
      sum += term;
      if (Math.abs(term) < 1e-14 * Math.abs(sum)) break;
    }
    return sum;
  }
  // Hankel asymptotic (two terms) — adequate for the radii we sample.
  const mu = 4 * n * n;
  const p = 1 - ((mu - 1) * (mu - 9)) / (2 * Math.pow(8 * x, 2));
  const qq = (mu - 1) / (8 * x);
  const chi = x - (n / 2 + 0.25) * Math.PI;
  return Math.sqrt(2 / (Math.PI * x)) * (p * Math.cos(chi) - qq * Math.sin(chi));
}

// ── Circular free plate: (n nodal diameters, s nodal circles) → λ² ──────────
// Leissa Table 2.x, free edge, ν = 0.33 (rigid-body (0,0),(1,0) excluded).
const CIRCLE_MODES: { n: number; s: number; lam2: number; k: number }[] = [
  { n: 2, s: 0, lam2: 5.253, k: 2.29 },
  { n: 0, s: 1, lam2: 9.084, k: 3.01 },
  { n: 3, s: 0, lam2: 12.23, k: 3.5 },
  { n: 1, s: 1, lam2: 20.52, k: 4.53 },
  { n: 4, s: 0, lam2: 21.6, k: 4.65 },
  { n: 5, s: 0, lam2: 33.1, k: 5.75 },
  { n: 2, s: 1, lam2: 35.25, k: 5.94 },
  { n: 0, s: 2, lam2: 38.55, k: 6.21 },
  { n: 6, s: 0, lam2: 46.2, k: 6.8 },
  { n: 3, s: 1, lam2: 52.91, k: 7.27 },
  { n: 1, s: 2, lam2: 59.86, k: 7.74 },
  { n: 7, s: 0, lam2: 61.0, k: 7.81 },
  { n: 4, s: 1, lam2: 73.6, k: 8.58 },
  { n: 0, s: 3, lam2: 87.8, k: 9.37 },
  { n: 2, s: 2, lam2: 88.9, k: 9.43 },
];
// Clamped / simply-supported circular plates — ratio to the free values is a
// fair teaching approximation (clamped raises every mode; the fundamental
// becomes the (0,0) umbrella mode which a free plate lacks).
const CIRCLE_EDGE_FACTOR: Record<EdgeCondition, number> = { free: 1, supported: 1.35, clamped: 1.95 };

// ── Free-free beam eigen-constants (m = 0 rigid, m ≥ 2 elastic) ─────────────
function beamBeta(m: number): number {
  if (m <= 0) return 0;
  if (m === 2) return 4.7300;
  if (m === 3) return 7.8532;
  if (m === 4) return 10.9956;
  return (m + 0.5) * Math.PI;
}
const RECT_EDGE_FACTOR: Record<EdgeCondition, number> = { free: 1, supported: 1.2, clamped: 1.7 };

function stiffnessD(E_GPa: number, h_m: number, nu: number): number {
  return (E_GPa * 1e9 * h_m * h_m * h_m) / (12 * (1 - nu * nu));
}

/** f in Hz for a dimensionless λ² on a plate of size a (m). */
function modeHz(lam2: number, D: number, rho: number, h_m: number, a_m: number): number {
  return (lam2 / (2 * Math.PI * a_m * a_m)) * Math.sqrt(D / (rho * h_m));
}

/** The plate's modes for the current spec, ascending by frequency. */
export function plateModes(spec: PlateSpec, count = 14): PlateMode[] {
  const mat = MATERIAL_BY_ID[spec.material];
  const h = spec.thicknessMm / 1000;
  const a = spec.sizeMm / 1000;
  const rho = mat.rho;
  const nu = mat.nu;
  const Dpar = stiffnessD(mat.E, h, nu);
  const Dperp = mat.Eperp != null ? stiffnessD(mat.Eperp, h, nu) : Dpar;
  // Grain rotation → effective x/y stiffnesses (cos²/sin² blend).
  const g = (spec.grainDeg * Math.PI) / 180;
  const c2 = Math.cos(g) ** 2;
  const s2 = Math.sin(g) ** 2;
  const Dx = Dpar * c2 + Dperp * s2;
  const Dy = Dpar * s2 + Dperp * c2;
  const D3 = Math.sqrt(Dx * Dy);
  const iso = mat.Eperp == null;

  const modes: PlateMode[] = [];
  if (isLibraryShape(spec.shape)) {
    // MODAL LIBRARY (spec §1.3): solved modes, looked up. λ² is given against
    // L = 1 = the shape's unit dimension (side / flat-to-flat / outer Ø / body
    // length), which is exactly what SIZE means for that shape, so the exact
    // scaling law applies with a = SIZE. The files are isotropic (ν = 0.33);
    // wood uses the geometric-mean stiffness like the disc does, so the grain
    // angle does not re-order library modes (said in the tray).
    const lib = loadLibraryShape(spec.shape);
    const D = iso ? Dpar : Math.sqrt(Dx * Dy);
    for (const m of lib.modes) {
      modes.push({
        id: `lib-${lib.id}-${m.id}`,
        label: m.label,
        lam2: m.lambda2,
        hz: modeHz(m.lambda2, D, rho, h, a),
        drive: 1,
        nodalLines: m.nodalLines,
        shape: libraryShapeFn(lib, m.W),
      });
    }
  } else if (spec.shape === 'circle') {
    const R = a / 2;
    const edgeF = CIRCLE_EDGE_FACTOR[spec.edge];
    const D = iso ? Dpar : Math.sqrt(Dx * Dy); // wood disc: geometric-mean stiffness
    for (const m of CIRCLE_MODES) {
      const lam2 = m.lam2 * edgeF;
      const hz = modeHz(lam2, D, rho, h, R); // λ² is tabulated over R² for discs
      const k = m.k;
      const n = m.n;
      const shape = (x: number, y: number) => {
        const dx = (x - 0.5) * 2;
        const dy = (y - 0.5) * 2;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > 1) return 0;
        const th = Math.atan2(dy, dx);
        return besselJ(n, k * r) * Math.cos(n * th);
      };
      modes.push({
        id: `c-${n}-${m.s}`,
        label: `${n} diameter${n === 1 ? '' : 's'} · ${m.s} circle${m.s === 1 ? '' : 's'}`,
        lam2,
        hz,
        drive: 1,
        nodalLines: n + m.s,
        shape,
      });
    }
  } else {
    const aspect = spec.shape === 'square' ? 1 : Math.max(0.5, Math.min(1, spec.aspect));
    const b = a * aspect; // short side
    const edgeF = RECT_EDGE_FACTOR[spec.edge];
    const ms = [0, 2, 3, 4, 5, 6];
    const seen = new Set<string>();
    for (const m of ms) {
      for (const n of ms) {
        if (m + n < 2) continue; // (0,0) rigid
        const bm = beamBeta(m);
        const bn = beamBeta(n) * (a / b); // short side stiffer per unit length
        // Orthotropic Rayleigh form; isotropic collapses to β_m² + β_n².
        const lam2 =
          Math.sqrt((Dx * bm ** 4 + Dy * bn ** 4 + 2 * D3 * bm * bm * bn * bn) / Dpar) * edgeF;
        const hz = modeHz(lam2, Dpar, rho, h, a);
        const Wmn = (x: number, y: number) => Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
        if (spec.shape === 'square' && m !== n) {
          // Degenerate pair → the ± Chladni combinations (each once).
          const key = m < n ? `${m}-${n}` : `${n}-${m}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const Wnm = (x: number, y: number) => Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y);
          const lo = Math.min(m, n);
          const hi = Math.max(m, n);
          // Real square plates split the pair slightly (ν ≠ 0): the "+" figure
          // sits a little lower than the "−" figure.
          modes.push({ id: `sq-${hi}-${lo}-p`, label: `(${hi},${lo}) + (${lo},${hi})`, lam2: lam2 * 0.97, hz: hz * 0.97, drive: 1, nodalLines: hi, shape: (x, y) => (Wmn(x, y) + Wnm(x, y)) / 2 });
          modes.push({ id: `sq-${hi}-${lo}-m`, label: `(${hi},${lo}) − (${lo},${hi})`, lam2: lam2 * 1.03, hz: hz * 1.03, drive: 1, nodalLines: hi, shape: (x, y) => (Wmn(x, y) - Wnm(x, y)) / 2 });
        } else {
          modes.push({ id: `r-${m}-${n}`, label: `(${m},${n})`, lam2, hz, drive: 1, nodalLines: Math.max(0, m - 1) + Math.max(0, n - 1) + (m === 0 || n === 0 ? 1 : 0), shape: Wmn });
        }
      }
    }
  }
  // Driver / support weighting. A mode is driven in proportion to its motion
  // under the driver (a node there = silent) and suppressed by its motion at a
  // clamp (support = null → a plate resting free on the driver post only).
  // Positions live in grid units (y ∈ [0, aspect]); shape() takes y normalised
  // to the plate's own height. (Rectangles used to skip this division, so an
  // exciter at "centre" (0.5, 0.35) read as cos(nπ·0.35) — off-centre.) On a
  // library shape a point in the corner box or the hole is snapped to the
  // nearest plate, so a driver never sits where there is no plate.
  const asp = plateAspect(spec);
  const lib = isLibraryShape(spec.shape) ? loadLibraryShape(spec.shape) : null;
  const toShape = (p: { x: number; y: number }) => {
    const q = { x: p.x, y: p.y / asp };
    return lib ? librarySnapInside(lib, q.x, q.y) : q;
  };
  const ex = toShape(spec.exciter);
  const sp = spec.support ? toShape(spec.support) : null;
  for (const md of modes) {
    const atDrive = Math.abs(md.shape(ex.x, ex.y));
    const atSupport = sp ? Math.abs(md.shape(sp.x, sp.y)) : 0;
    md.drive = Math.max(0, Math.min(1, atDrive * (1 - atSupport) ** 2));
  }
  modes.sort((p, q) => p.hz - q.hz);
  return modes.slice(0, count);
}

/** Effective Q after the user's damping control. */
export function effectiveQ(material: MaterialId, damping: number): number {
  const Q = MATERIAL_BY_ID[material].Q;
  const d = Math.max(0, Math.min(1, damping));
  return Q * Math.pow(10, -1.5 * d);
}

/** Single-DOF response magnitude of a mode at drive frequency f. */
export function modeResponse(f: number, fk: number, Q: number): number {
  const r = f / fk;
  const re = 1 - r * r;
  const im = r / Q;
  return 1 / Math.sqrt(re * re + im * im);
}

/** Signed (in-phase) response — negative above resonance. */
export function modeResponseSigned(f: number, fk: number, Q: number): number {
  const r = f / fk;
  const re = 1 - r * r;
  const im = r / Q;
  const mag2 = re * re + im * im;
  // Real part of 1/(re + i·im) = re / |.|² — in phase below resonance,
  // anti-phase above, passing through zero AT resonance where the quadrature
  // (imaginary) part carries the motion. Callers that need the amplitude use
  // modeResponse(); this signed form drives the phase view.
  return mag2 > 0 ? re / mag2 : 0;
}

export type ResonanceState = 'below' | 'approaching' | 'at' | 'between';

export type ResonanceRead = {
  state: ResonanceState;
  /** 0..1 — the nearest excitable mode's normalised response. */
  strength: number;
  /** The mode that dominates at this frequency (highest weighted response). */
  dominant: PlateMode | null;
  /** The next excitable mode above f (for the "approaching" cue), if any. */
  next: PlateMode | null;
};

/** Read the resonance situation at drive frequency f. */
export function readResonance(f: number, modes: PlateMode[], Q: number): ResonanceRead {
  const excitable = modes.filter((m) => m.drive > 0.05);
  if (excitable.length === 0) return { state: 'between', strength: 0, dominant: null, next: null };
  let best: PlateMode | null = null;
  let bestVal = 0;
  for (const m of excitable) {
    const v = modeResponse(f, m.hz, Q) * m.drive;
    if (v > bestVal) {
      bestVal = v;
      best = m;
    }
  }
  const peak = best ? Q * best.drive : 1; // response at exact resonance ≈ Q
  const strength = Math.max(0, Math.min(1, bestVal / peak));
  const next = excitable.find((m) => m.hz > f * 1.02) ?? null;
  const first = excitable[0];
  let state: ResonanceState;
  if (strength >= 0.5) state = 'at';
  else if (f < first.hz * 0.9) state = 'below';
  else if (strength >= 0.12) state = 'approaching';
  else state = 'between';
  return { state, strength, dominant: best, next };
}

/**
 * Sample the drive-frequency displacement field on an N×N grid → Float32Array
 * (row-major, y outer). Returns the SIGNED in-phase field normalised to ±1,
 * so |value| is the amplitude map and sign gives the phase view. Cells
 * outside a circular plate are NaN.
 */
export function sampleField(spec: PlateSpec, modes: PlateMode[], f: number, Q: number, N: number): Float32Array {
  const out = new Float32Array(N * N);
  // Mode weights: signed response × drive; skip the negligible.
  const active = modes
    .map((m) => ({ m, w: modeResponseSigned(f, m.hz, Q) * m.drive }))
    .filter((e) => Math.abs(e.w) > 1e-3);
  let peak = 1e-9;
  const circle = spec.shape === 'circle';
  const aspect = plateAspect(spec);
  const lib = isLibraryShape(spec.shape) ? loadLibraryShape(spec.shape) : null;
  // The grid always spans y ∈ [0, aspect] — for a tall plate (aspect > 1) that
  // means the N×N cells are taller than wide; the viz stretches them back.
  for (let j = 0; j < N; j++) {
    const y = ((j + 0.5) / N) * aspect;
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N;
      if (lib) {
        if (!libraryInside(lib, x, y / aspect)) {
          out[j * N + i] = NaN;
          continue;
        }
      } else if (circle) {
        const dx = (x - 0.5) * 2;
        const dy = (y - 0.5) * 2;
        if (dx * dx + dy * dy > 1) {
          out[j * N + i] = NaN;
          continue;
        }
      }
      let v = 0;
      for (const e of active) v += e.w * e.m.shape(x, y / aspect);
      out[j * N + i] = v;
      const av = Math.abs(v);
      if (av > peak) peak = av;
    }
  }
  for (let k = 0; k < out.length; k++) if (!Number.isNaN(out[k])) out[k] /= peak;
  return out;
}

/** Default studio plate (the classic demonstration: 240 mm aluminum, 1 mm). */
export const DEFAULT_PLATE: PlateSpec = {
  shape: 'square',
  sizeMm: 240,
  aspect: 0.7,
  thicknessMm: 1,
  material: 'aluminum',
  grainDeg: 0,
  edge: 'free',
  damping: 0.1,
  exciter: { x: 0.5, y: 0.5 },
  support: null, // centre-driven on a post, edges free — the modern Chladni rig
};
