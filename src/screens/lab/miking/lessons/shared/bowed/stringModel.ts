/**
 * THE IDEAL STRING — the physics behind HOW IT SOUNDS for the bowed family
 * (LESSON_JOURNEY §7: "standing waves on a string (fixed ends, harmonics) —
 * a model to add, pure and tested, before it is drawn"). Positions are
 * fractions of the vibrating length from the BRIDGE (0) to the nut or the
 * stopping finger (1); displacements are relative (the drawing scales them
 * up, "motion drawn larger"). Pure; worklet-safe where marked.
 *
 *   • SHAPES: a string fixed at both ends vibrates in shapes sin(nπx), at n
 *     times the lowest pitch — whole-number ratios (a drum's are not).
 *   • A point at x drives (or hears) shape n in proportion to |sin(nπx)|: a
 *     shape with a still point (a node) under the bow or the finger is not
 *     driven there.
 *   • BOWED (Helmholtz motion): the string is two straight lines meeting at
 *     a CORNER that runs to the nut and back, along two parabolas. Under the
 *     bow the string sticks to the hair and moves with it for (1 − β) of
 *     each cycle, then slips back for β (β = the bow's distance from the
 *     bridge as a fraction of the length).
 *   • PLUCKED: the released triangle splits into two corners running
 *     opposite ways (d'Alembert); half a cycle later it is the same
 *     triangle, mirrored and upside down.
 * Ideal: no stiffness, no losses, rigid ends — said once on the page ("a
 * simplified string").
 */

/** Shape n's displacement at x (−1 … 1). */
export function shapeAt(n: number, x: number): number {
  'worklet';
  return Math.sin(n * Math.PI * x);
}

/** The still points (nodes) of shape n, strictly inside the string. */
export function nodesOf(n: number): number[] {
  const out: number[] = [];
  for (let k = 1; k < n; k++) out.push(k / n);
  return out;
}

/** How much shape n moves at x, as a fraction of its peak (0 … 1). */
export function shareAt(n: number, x: number): number {
  return Math.abs(Math.sin(n * Math.PI * x));
}

/** The shapes (1 … nMax) with a still point within `tol` of x. */
export function stillAt(x: number, nMax: number, tol = 0.05): number[] {
  const out: number[] = [];
  for (let n = 1; n <= nMax; n++) if (shareAt(n, x) < tol) out.push(n);
  return out;
}

/** The corner of Helmholtz motion at phase φ (0 … 1): where it is and its height. */
export function helmholtzCorner(phase: number): { x: number; h: number; outbound: boolean } {
  'worklet';
  const p = phase - Math.floor(phase);
  const outbound = p < 0.5;
  const x = outbound ? 2 * p : 2 * (1 - p);
  const h = (outbound ? 1 : -1) * 4 * x * (1 - x);
  return { x, h, outbound };
}

/** The bowed string's displacement at x, phase φ (peak 1 at the middle). */
export function helmholtzAt(x: number, phase: number): number {
  'worklet';
  const c = helmholtzCorner(phase);
  if (c.x <= 1e-9) return 0;
  if (c.x >= 1 - 1e-9) return 0;
  return x <= c.x ? (c.h * x) / c.x : (c.h * (1 - x)) / (1 - c.x);
}

/** Under the bow at β: is the string STICKING to the hair (moving with the
 *  bow) or SLIPPING back, at phase φ? It slips while the corner is between
 *  the bridge and the bow. */
export function bowState(beta: number, phase: number): 'stick' | 'slip' {
  const c = helmholtzCorner(phase);
  return c.x < beta ? 'slip' : 'stick';
}

/** The fraction of a cycle the string slips under a bow at β (= β). */
export function slipFraction(beta: number, steps = 2000): number {
  let n = 0;
  for (let i = 0; i < steps; i++) if (bowState(beta, (i + 0.5) / steps) === 'slip') n++;
  return n / steps;
}

/** The plucked string's starting triangle (peak 1 at β). */
function triangle(x: number, beta: number): number {
  'worklet';
  return x <= beta ? x / beta : (1 - x) / (1 - beta);
}

/** Its odd, period-2 extension (fixed ends at 0 and 1). */
function extended(x: number, beta: number): number {
  'worklet';
  let u = x - 2 * Math.floor(x / 2); // 0 … 2
  if (u > 1) {
    u = 2 - u;
    return -triangle(u, beta);
  }
  return triangle(u, beta);
}

/** The plucked string at x, phase φ (one cycle = φ 0 → 1), plucked at β. */
export function pluckedAt(x: number, phase: number, beta: number): number {
  'worklet';
  const t = 2 * (phase - Math.floor(phase));
  return 0.5 * (extended(x - t, beta) + extended(x + t, beta));
}

/** A plucked string's harmonic strengths (relative, |a_n| ∝ |sin nπβ| / n²). */
export function pluckedHarmonic(n: number, beta: number): number {
  return Math.abs(Math.sin(n * Math.PI * beta)) / (n * n);
}

/** The ideal bowed string's harmonic strengths (∝ 1 / n). */
export function bowedHarmonic(n: number): number {
  return 1 / n;
}
