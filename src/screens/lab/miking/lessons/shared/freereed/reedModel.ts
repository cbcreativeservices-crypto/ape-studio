/**
 * THE FREE REED — technical truth for HOW IT SOUNDS (Lab 3's harmonica and
 * accordion). Pure TypeScript (no React Native), so the tests reach it.
 *
 * A free reed is a thin brass tongue riveted at one end over a slot in a
 * plate. Air pressure bends it into the slot; it springs back and swings
 * THROUGH the slot again and again, opening and closing the air's way as it
 * passes — so the air leaves in puffs at the reed's own frequency. That is
 * the sound (lesson L6: "Air moving across free reeds"; accordion L6:
 * "Air moved by the bellows excites reeds").
 *
 * The SHAPES drawn on the sound page are an IDEAL CLAMPED-FREE BAR (a
 * cantilever, Euler–Bernoulli): one end held still, the other free. Its
 * frequencies follow the roots of cos βL · cosh βL = −1 — 1.8751, 4.6941,
 * 7.8548, 10.9955 — and rise as (βnL)², so the shapes' ratios are 1, 6.27,
 * 17.55, 34.39: far apart, NOT a harmonic series. A real reed is tapered and
 * weighted toward its tip by the maker, so its numbers differ; the picture
 * teaches which parts move and where the still points fall (said once, on
 * screen: "a simplified picture").
 *
 * Nothing here is a sound or a level; nothing loops (D8).
 */

/** The first four roots βnL of cos x · cosh x = −1 (a cantilever's modes). */
export const CANTILEVER_ROOTS = [1.8751040687, 4.6940911330, 7.8547574382, 10.9955407349] as const;

/** Each shape's frequency over the lowest one: (βnL / β1L)². */
export const REED_RATIOS: readonly number[] = CANTILEVER_ROOTS.map((b) => (b / CANTILEVER_ROOTS[0]) ** 2);

/** The characteristic equation's residual at x (zero at every root). */
export function cantileverResidual(x: number): number {
  return Math.cos(x) * Math.cosh(x) + 1;
}

/** The shape of mode n (0-based) at ξ ∈ [0, 1] from the clamp, scaled so the
 *  free tip moves ±1 (its sign alternates with n: the tip is +1). */
export function reedShape(n: number, xi: number): number {
  const b = CANTILEVER_ROOTS[Math.max(0, Math.min(CANTILEVER_ROOTS.length - 1, n))];
  const s = (Math.cosh(b) + Math.cos(b)) / (Math.sinh(b) + Math.sin(b));
  const raw = (t: number) => Math.cosh(b * t) - Math.cos(b * t) - s * (Math.sinh(b * t) - Math.sin(b * t));
  return raw(Math.max(0, Math.min(1, xi))) / raw(1);
}

/** The still points (nodes) of mode n along the reed, ξ in (0, 1) — the
 *  clamp itself (ξ = 0) is not listed. Found by bisection on a fine grid. */
export function reedNodes(n: number): number[] {
  const out: number[] = [];
  const N = 2000;
  let prev = reedShape(n, 1e-3);
  for (let i = 2; i <= N; i++) {
    const x = i / N;
    const cur = reedShape(n, x);
    if (prev === 0 || prev * cur < 0) {
      let lo = (i - 1) / N;
      let hi = x;
      for (let k = 0; k < 50; k++) {
        const mid = (lo + hi) / 2;
        if (reedShape(n, lo) * reedShape(n, mid) <= 0) hi = mid;
        else lo = mid;
      }
      out.push((lo + hi) / 2);
    }
    prev = cur;
  }
  return out;
}

/** The share of the tip's motion a mode has at ξ (|shape|, 0…1+). */
export function reedMotionAt(n: number, xi: number): number {
  return Math.abs(reedShape(n, xi));
}

/**
 * THE PUFF SEQUENCE (the explanatory overlay, 4 steps). Each step's reed tip
 * position (+1 = pushed down THROUGH the slot by the air, 0 = at rest in the
 * plate, −1 = sprung back up past it) and whether the air's way is open. A
 * picture of the ORDER of events, never their speed or size (motion drawn
 * larger):
 *   1  the air arrives: the reed at rest closes its slot (all but a hair);
 *   2  the air pushes the reed down through the slot: the way opens, a puff;
 *   3  the reed springs back up through the slot (closing it as it passes)
 *      and past it: the way opens again on the other side;
 *   4  it keeps swinging at its own frequency: the air leaves in puffs — the
 *      sound.
 */
export type PuffStep = { tip: number; open: boolean; puffs: number; sound: boolean };
export const PUFF_STEPS: readonly PuffStep[] = [
  { tip: 0, open: false, puffs: 0, sound: false },
  { tip: 1, open: true, puffs: 1, sound: false },
  { tip: -0.8, open: true, puffs: 2, sound: false },
  { tip: 1, open: true, puffs: 4, sound: true },
];

/** Is the air's way open at a tip position? The slot is closed while the
 *  reed sits inside the plate's thickness (|tip| below `inSlot`), open once
 *  it has swung clear on either side. */
export function slotOpen(tip: number, inSlot = 0.25): boolean {
  return Math.abs(tip) > inSlot;
}
