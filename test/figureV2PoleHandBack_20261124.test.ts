/**
 * FIGURE V2 — THE POLE HAND FROM THE BACK (owner 2026-11-24, "one hand at a time": hand number two — a RIGHT hand
 * gripping a horizontal Ø 30 mm pole, the arm from below, seen from the back of the hand: poleHandBack.tsx).
 * Checked here:
 *   • the art exists as authored points (the hand, the thumb behind the pole);
 *   • the thumb on the viewer's LEFT (a right hand from its back), leaving the hand's side below the index knuckle,
 *     seen only up to the pole's lower edge (behind it above);
 *   • the knuckle row: low swells, the middle the highest, the little finger's the smallest and lowest; the
 *     fingers' bends the top edge (the middle the highest), above the pole's top edge;
 *   • the pole BEHIND the hand, seen left and right of it at the first segments' height;
 *   • the fist about 88 mm wide and about 95 mm from the wrist to the bends; the wrist about 58 mm.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PB = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandBack.tsx'));
type Pt = { u: number; v: number };
const A = PB.POLE_HAND_BACK as {
  body: Pt[];
  wristY: number;
  thumbAtPole: Pt;
  thumbPeak: Pt;
  fingers: readonly { name: string; L: number; R: number; top: number; knuckle: Pt; kr: number }[];
};
const r = PB.POLE_R as number;
const xs = (q: Pt[]) => q.map((p) => p.u);
const ys = (q: Pt[]) => q.map((p) => p.v);
function crossings(q: Pt[], y: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    if ((a.v - y) * (b.v - y) < 0) out.push(a.u + ((y - a.v) / (b.v - a.v)) * (b.u - a.u));
  }
  return out.sort((m, n) => m - n);
}
const by = Object.fromEntries(A.fingers.map((f) => [f.name, f]));

describe('the pole hand from the back (poleHandBack)', () => {
  it('the art exists: one hand outline, authored as points', () => {
    assert.ok(Array.isArray(A.body) && A.body.length >= 30);
    for (const p of A.body) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    assert.equal(r, 15);
    assert.equal(typeof PB.PoleHandBack, 'function');
  });

  it("the thumb's base on the viewer's LEFT: one smooth convex swell from the wrist, peaking below the pole, going behind its lower edge", () => {
    assert.ok(by.index.L < by.little.L, 'index on the left, little finger on the right');
    assert.ok(A.thumbPeak.u < by.index.L - 6, 'the swell out beyond the index on the left');
    assert.ok(A.thumbPeak.v > r && A.thumbPeak.v < r + 25, 'peaking a little below the pole');
    assert.ok(A.thumbAtPole.u < by.index.L && Math.abs(A.thumbAtPole.v - r) < 0.01);
    // (the swell, from where it leaves the wrist's line up to the pole: every turn the same way — convex, no corner,
    // no notch; below it the outline eases out of the wrist)
    const i0 = A.body.findIndex((p) => p.u < -40 && p.v < 58);
    const i1 = A.body.findIndex((p) => p.v < r);
    const run = A.body.slice(i0, i1 + 1);
    assert.ok(run.length >= 6);
    for (let i = 1; i < run.length - 1; i++) {
      const a = run[i - 1];
      const b = run[i];
      const c = run[i + 1];
      const z = (b.u - a.u) * (c.v - b.v) - (b.v - a.v) * (c.u - b.u);
      assert.ok(z >= -1e-9, `convex at (${b.u}, ${b.v})`);
    }
  });

  it('the knuckle row: low swells, the middle highest, the little smallest and lowest; the bends above the pole', () => {
    assert.ok(by.middle.knuckle.v < by.index.knuckle.v && by.middle.knuckle.v < by.ring.knuckle.v && by.little.knuckle.v > by.ring.knuckle.v);
    assert.ok(by.little.kr < by.ring.kr && by.ring.kr < by.middle.kr && by.index.kr < by.middle.kr);
    assert.ok(by.middle.top < by.index.top && by.middle.top < by.ring.top && by.little.top > by.ring.top);
    for (const f of A.fingers) {
      assert.ok(f.top < -r, `${f.name}: its bend above the pole's top edge`);
      const seg = f.knuckle.v - f.top;
      assert.ok(seg >= 18 && seg <= 32, `${f.name}: first segment ${seg.toFixed(1)} mm from the back`);
      // (the knuckle row at the pole's lower edge: each swell reaching down to it)
      assert.ok(f.knuckle.v + f.kr >= r, `${f.name}: its knuckle swell reaching the pole's lower edge`);
    }
    assert.ok(Math.abs(Math.min(...ys(A.body)) - by.middle.top) < 0.6, 'the bends are the top edge');
  });

  it('the pole is behind the hand: seen left and right of it at the first segments, hidden between', () => {
    const y = -5.5;
    const c = crossings(A.body, y);
    assert.ok(c.length === 2, 'the hand one shape across the pole');
    assert.ok(c[0] < -30 && c[1] > 30, 'the hand covers the pole across the fist');
    assert.ok(c[0] > -45 && c[1] < 45, 'the pole is seen on both sides');
  });

  it('the fist about 88 mm wide, about 95 mm from the wrist to the bends; the wrist about 58 mm', () => {
    const fist = A.body.filter((p) => p.v <= A.wristY);
    const w = Math.max(...xs(fist)) - Math.min(...xs(fist));
    const h = A.wristY - Math.min(...ys(A.body));
    assert.ok(w >= 82 && w <= 92, `width ${w.toFixed(1)}`);
    assert.ok(h >= 90 && h <= 100, `height ${h.toFixed(1)}`);
    const wr = crossings(A.body, 86.5);
    const ww = wr[wr.length - 1] - wr[0];
    assert.ok(ww >= 54 && ww <= 62, `wrist ${ww.toFixed(1)}`);
    assert.ok(ww < w * 0.72, 'the wrist clearly narrower than the hand');
  });
});
