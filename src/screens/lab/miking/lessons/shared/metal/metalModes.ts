/**
 * HOW SUSPENDED METAL SOUNDS — the shapes it rings in, for drawing
 * (LESSON_JOURNEY §7: "Plates and bars: plate/bar mode shapes from a model
 * the app already has, or in words"). Lab 2's suspended-metal lessons (I06a
 * triangle, I06b finger cymbals, I06c bar chimes, I12 gong). FULLY SILENT:
 * nothing here is ever played; the numbers are drawn and read, never heard.
 *
 *   BAR   a straight bar free at both ends (Euler–Bernoulli): the textbook
 *         free–free roots βL = 4.7300, 7.8532, 10.9956, 14.1372, 17.2788;
 *         shape W(x) = cosh βx + cos βx − σ(sinh βx + sin βx),
 *         σ = (cosh βL − cos βL)/(sinh βL − sin βL); pitch ∝ β² (so the
 *         ratios 1 : 2.76 : 5.40 : 8.93 : 13.34 — not whole numbers). The
 *         plate model's own beam constants (features/cymatics/plateModes.ts
 *         beamBeta) are the first three of these roots.
 *   CHIME for bars of one diameter and metal, pitch ∝ 1 / length² (the same
 *         β, scaled): a bar half as long rings four times higher.
 *   DISC  the Cymatics Lab's free circular plate (plateModes, Leissa's
 *         free-edge λ², J_n(k r)·cos nθ): a gong hangs by cords at its rim,
 *         so its edge is free. A strike at the exact centre drives only the
 *         ring-shaped (n = 0) shapes, because J_n(0) = 0 for n ≥ 1.
 *   STRIKE a stroke drives a shape in proportion to how much the metal moves
 *         THERE in that shape (the rule the drum lessons use).
 *
 * SIMPLIFICATIONS (said on screen, once per picture): the triangle is drawn
 * as the straight bar it was bent from — the bends shift the numbers and add
 * more shapes; the gong is a flat disc of even thickness — a real tam-tam is
 * slightly domed with a turned rim, and a bossed gong's boss concentrates its
 * main tone. Pure: node:test pins it.
 */
import { besselJ, DEFAULT_PLATE, plateModes } from '../../../../../../features/cymatics/plateModes.ts';

/* ═══════════════ BAR (free at both ends) ═══════════════ */

/** The first five free–free roots βL (textbook values). */
export const FREE_BAR_ROOTS = [4.730040745, 7.853204624, 10.99560784, 14.13716549, 17.27875966] as const;

export type BarShape = {
  /** 1-based: the lowest bending shape is 1. */
  n: number;
  beta: number;
  /** Pitch ÷ the lowest shape's (β² ratio). */
  ratio: number;
  /** Still points along the bar (fractions of its length). */
  nodes: readonly number[];
  label: string;
};

function sigmaOf(b: number): number {
  return (Math.cosh(b) - Math.cos(b)) / (Math.sinh(b) - Math.sin(b));
}

/** The free–free shape at x ∈ [0, 1] (unnormalised). */
export function barW(beta: number, x: number): number {
  const bx = beta * Math.max(0, Math.min(1, x));
  return Math.cosh(bx) + Math.cos(bx) - sigmaOf(beta) * (Math.sinh(bx) + Math.sin(bx));
}

function barNodes(beta: number): number[] {
  const out: number[] = [];
  const N = 2000;
  let prev = barW(beta, 0);
  for (let i = 1; i <= N; i++) {
    const x = i / N;
    const v = barW(beta, x);
    if (Math.sign(v) !== Math.sign(prev) && prev !== 0) {
      // linear refine
      const x0 = (i - 1) / N;
      out.push(x0 + (prev / (prev - v)) * (1 / N));
    }
    prev = v;
  }
  return out;
}

const barPeakCache = new Map<number, number>();
/** The shape's peak |W| over the bar (the free ends: 2 for every shape). */
export function barPeak(beta: number): number {
  const hit = barPeakCache.get(beta);
  if (hit != null) return hit;
  let pk = 0;
  for (let i = 0; i <= 1000; i++) pk = Math.max(pk, Math.abs(barW(beta, i / 1000)));
  barPeakCache.set(beta, pk);
  return pk;
}

export const BAR_SHAPES: readonly BarShape[] = FREE_BAR_ROOTS.map((beta, i) => ({
  n: i + 1,
  beta,
  ratio: (beta / FREE_BAR_ROOTS[0]) ** 2,
  nodes: barNodes(beta),
  label: `shape ${i + 1}`,
}));

/** −1 … 1: the shape at x, as a fraction of its peak. */
export function barAt(sh: BarShape, x: number): number {
  return barW(sh.beta, x) / barPeak(sh.beta);
}

/** 0 … 1: how much of the shape's peak motion sits under a stroke at x. */
export function barStrikeShare(sh: BarShape, x: number): number {
  return Math.min(1, Math.abs(barAt(sh, x)));
}

/** Bars of one diameter and metal: pitch ratio of a bar of length L against
 *  one of length L0 (∝ 1 / L²). */
export function chimePitchRatio(L: number, L0: number): number {
  return (L0 / L) ** 2;
}

/** A pitch ratio as musical distance, in octaves (log2). */
export function octaves(ratio: number): number {
  return Math.log2(ratio);
}

/* ═══════════════ DISC (free at its edge) ═══════════════ */

export type DiscShape = {
  id: string;
  /** Still lines across (nodal diameters) and still rings. */
  n: number;
  s: number;
  /** λ² ÷ the lowest shape's. */
  ratio: number;
  label: string;
  still: string;
  /** The Bessel argument at the edge (J_n(k r)·cos nθ). */
  k: number;
};

function stillWords(n: number, s: number): string {
  const d = n === 0 ? '' : `${n} still line${n === 1 ? '' : 's'} across`;
  const c = s === 0 ? '' : `${s} still ring${s === 1 ? '' : 's'}`;
  return [d, c].filter(Boolean).join(' and ') || 'no still lines';
}

/** The Bessel arguments of plateModes' circle table (the same ids). */
const DISC_K: Readonly<Record<string, number>> = {
  'c-2-0': 2.29, 'c-0-1': 3.01, 'c-3-0': 3.5, 'c-1-1': 4.53, 'c-4-0': 4.65, 'c-5-0': 5.75, 'c-2-1': 5.94, 'c-0-2': 6.21,
  'c-6-0': 6.8, 'c-3-1': 7.27, 'c-1-2': 7.74, 'c-7-0': 7.81, 'c-4-1': 8.58, 'c-0-3': 9.37, 'c-2-2': 9.43,
};

/** The free disc's shapes, ascending — the Cymatics Lab's circle, edge free. */
export const DISC_SHAPES: readonly DiscShape[] = (() => {
  const ms = plateModes({ ...DEFAULT_PLATE, shape: 'circle', sizeMm: 812.8, aspect: 1, thicknessMm: 2, material: 'brass', exciter: { x: 0.5, y: 0.5 }, support: null }, 15);
  const base = ms[0].lam2;
  return ms.map((m) => {
    const [, n, s] = m.id.split('-').map(Number);
    return { id: m.id, n, s, ratio: m.lam2 / base, label: `(${n},${s})`, still: stillWords(n, s), k: DISC_K[m.id] ?? 0 };
  });
})();

/** The shape's value at polar (r ∈ [0, 1], θ from the strike direction). */
export function discAt(sh: DiscShape, r: number, theta: number): number {
  if (r > 1) return 0;
  return besselJ(sh.n, sh.k * r) * Math.cos(sh.n * theta);
}

const discPeakCache = new Map<string, number>();
export function discPeak(sh: DiscShape): number {
  const hit = discPeakCache.get(sh.id);
  if (hit != null) return hit;
  let pk = 0;
  for (let i = 0; i <= 400; i++) pk = Math.max(pk, Math.abs(discAt(sh, i / 400, 0)));
  discPeakCache.set(sh.id, pk);
  return pk;
}

/** 0 … 1: how much of the shape's peak sits under a stroke at radius r. */
export function discStrikeShare(sh: DiscShape, rFrac: number): number {
  const pk = discPeak(sh);
  return pk > 0 ? Math.min(1, Math.abs(discAt(sh, Math.max(0, Math.min(1, rFrac)), 0)) / pk) : 0;
}

/** Radii (fractions of R) of the still RINGS, found on θ = 0. */
export function discStillRings(sh: DiscShape): number[] {
  const out: number[] = [];
  let prev = discAt(sh, 0.005, 0);
  for (let i = 2; i <= 600; i++) {
    const r = i / 600;
    const v = discAt(sh, r, 0);
    if (Math.sign(v) !== Math.sign(prev) && Math.abs(prev) > 1e-12) out.push(r - 0.5 / 600);
    prev = v;
  }
  return out.slice(0, sh.s);
}

/** Angles (radians, from the strike direction) of the still DIAMETERS. */
export function discStillDiameters(sh: Pick<DiscShape, 'n'>): number[] {
  if (sh.n === 0) return [];
  return Array.from({ length: sh.n }, (_, k) => ((2 * k + 1) * Math.PI) / (2 * sh.n));
}

/** How many of the drawn shapes a stroke at r drives noticeably (share ≥ 0.2). */
export function shapesDriven(rFrac: number, threshold = 0.2): number {
  return DISC_SHAPES.filter((sh) => discStrikeShare(sh, rFrac) >= threshold).length;
}

/**
 * The BUILD-UP picture (I12, stage 3 — drawn, never played): which shapes
 * hold the energy at each of the strike sequence's events. A WEIGHT per shape,
 * 0 … 1, for drawing a mix; never a level or a time. Event 1–2: the shapes the
 * stroke drives (its share at the strike point, weighted toward the broad,
 * lower ones); event 3 on a tam-tam: the energy spread into the finer, higher
 * shapes — the swell after the strike. A bossed gong struck on its boss keeps
 * its ring-shaped (n = 0) shapes.
 */
export function buildUpWeights(event: number, rFrac: number, kind: 'tamtam' | 'bossed'): number[] {
  return DISC_SHAPES.map((sh, i) => {
    const drive = discStrikeShare(sh, rFrac);
    if (event <= 1) return 0;
    if (event === 2) return drive * Math.max(0, 1 - i / 6);
    if (kind === 'bossed') return sh.n === 0 ? Math.max(drive, 0.6) : drive * 0.25;
    // tam-tam: the broad shapes give their energy away to the finer ones.
    return i < 4 ? drive * 0.35 : 0.55 + 0.45 * (i / (DISC_SHAPES.length - 1));
  });
}
