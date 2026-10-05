/**
 * A FREE BAR's bending shapes (pure; tested) — the physics behind the claves'
 * HOW IT SOUNDS (LESSON_JOURNEY §7: a model the lab can compute, or words).
 * A uniform bar free at both ends (Euler–Bernoulli): mode k has the shape
 *   φ(x) = cosh βx + cos βx − σ (sinh βx + sin βx),   0 ≤ x ≤ L,
 * with βL the k-th root of cos βL · cosh βL = 1 (4.7300, 7.8532 …) and
 * σ = (cosh βL − cos βL) / (sinh βL − sin βL). Its frequencies go as (βL)²:
 * the second shape sits ≈ 2.76 × the lowest — not a whole number, which is
 * why a clave sounds like a "click with a note", not a string's tone.
 * The lowest shape has two STILL POINTS, ≈ 22.4 % in from each end: a bar
 * supported there rings; a bar squeezed along its length is damped.
 */

/** βL for the first free-free bending shapes. */
export const BETA_L = [4.730040745, 7.853204624, 10.995607838] as const;

function sigma(bl: number): number {
  return (Math.cosh(bl) - Math.cos(bl)) / (Math.sinh(bl) - Math.sin(bl));
}

/** The shape of mode k (0 = lowest) at u = x / L (0 … 1), scaled so its
 *  largest value is 1 at the ends. */
export function barShape(k: number, u: number): number {
  const bl = BETA_L[k];
  const s = sigma(bl);
  const f = (t: number) => Math.cosh(bl * t) + Math.cos(bl * t) - s * (Math.sinh(bl * t) + Math.sin(bl * t));
  return f(u) / f(0);
}

/** The still points (nodes) of mode k, as fractions of the length. */
export function barNodes(k: number): number[] {
  const out: number[] = [];
  const N = 2000;
  let prev = barShape(k, 0);
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    const cur = barShape(k, u);
    if (prev === 0 || prev * cur < 0) {
      // Bisection on the bracket [u − 1/N, u].
      let a = (i - 1) / N;
      let b = u;
      for (let j = 0; j < 50; j++) {
        const m = (a + b) / 2;
        if (barShape(k, a) * barShape(k, m) <= 0) b = m;
        else a = m;
      }
      out.push((a + b) / 2);
    }
    prev = cur;
  }
  return out;
}

/** Mode k's frequency over the lowest's, (βL_k / βL_0)². */
export function barRatio(k: number): number {
  return (BETA_L[k] / BETA_L[0]) ** 2;
}
