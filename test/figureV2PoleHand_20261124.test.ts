/**
 * FIGURE V2 — THE POLE HAND, PALM SIDE (owner 2026-11-24: "one hand at a time";
 * the first: a RIGHT hand gripping a horizontal Ø 30 mm pole, arm raised, seen
 * from the palm side — poleHandFront.tsx). Checked here:
 *   • the art exists as authored points (body, the four-finger group, the thumb);
 *   • the thumb is on the viewer's RIGHT for the right hand (the index beside it,
 *     the little finger outside on the left);
 *   • the pole passes THROUGH the hand: the finger group covers its middle, and
 *     beyond the fist on both sides nothing of the hand covers it;
 *   • the fist ≈ 85–90 mm wide and ≈ 90–100 mm tall, the wrist ≈ 58 mm;
 *   • the finger ends differ (middle widest and highest, little narrowest and
 *     lowest) and the top edge is the fingers' own bends (no knuckle row behind).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandFront.tsx'));
type Pt = { u: number; v: number };
const A = PH.POLE_HAND_FRONT as {
  body: Pt[];
  group: Pt[];
  thumb: Pt[];
  heelY: number;
  thumbTip: Pt;
  thumbRoot: Pt;
  fingers: readonly { name: string; L: number; R: number; top: number; tip: number }[];
};
const r = PH.POLE_R as number;
const xs = (q: Pt[]) => q.map((p) => p.u);
const ys = (q: Pt[]) => q.map((p) => p.v);
/** Where a closed polygon crosses the horizontal line y (sorted x). */
function crossings(q: Pt[], y: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    if ((a.v - y) * (b.v - y) < 0) out.push(a.u + ((y - a.v) / (b.v - a.v)) * (b.u - a.u));
  }
  return out.sort((m, n) => m - n);
}

describe('the pole hand, palm side (poleHandFront)', () => {
  it('the art exists: one body, one finger group, one thumb, authored as points', () => {
    for (const q of [A.body, A.group, A.thumb]) {
      assert.ok(Array.isArray(q) && q.length >= 12);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    assert.equal(A.fingers.length, 4);
    assert.equal(typeof PH.PoleHandFront, 'function');
  });

  it("the thumb is on the viewer's right (a right hand seen palm-side, the arm from below)", () => {
    const f = Object.fromEntries(A.fingers.map((g) => [g.name, (g.L + g.R) / 2]));
    assert.ok(f.little < f.ring && f.ring < f.middle && f.middle < f.index, 'little on the left … index on the right');
    assert.ok(A.thumbRoot.u > f.index, 'the thumb grows from the mound on the right');
    assert.ok(A.thumbTip.u < A.thumbRoot.u && A.thumbTip.v < A.thumbRoot.v, 'it crosses up and to the left over the fingers');
    const tx = xs(A.thumb);
    assert.ok(Math.max(...tx) > 40, 'the thumb side bulges right');
  });

  it('the pole passes through the hand: the fingers cover its middle, both ends are free', () => {
    const g = crossings(A.group, 0.5);
    assert.ok(g.length >= 2);
    assert.ok(g[0] < -35 && g[g.length - 1] > 30, 'the finger group covers the pole across the fist');
    // every finger lies across the front of the pole: its bend above the pole's top, its tip on its lower half or just below
    for (const f of A.fingers) {
      assert.ok(f.top < -r, `${f.name}: its bend above the pole`);
      assert.ok(f.tip > 0 && f.tip < r + 4, `${f.name}: its tip on the pole's lower half or just below`);
    }
    // beyond the fist nothing of the hand: the pole is seen on both sides
    const all = [...A.body, ...A.group, ...A.thumb].filter((p) => Math.abs(p.v) <= r);
    assert.ok(Math.min(...xs(all)) > -45 && Math.max(...xs(all)) < 48);
  });

  it('the fist is about 85–90 mm wide and 90–100 mm tall; the wrist about 58 mm', () => {
    const fist = [...A.body, ...A.group, ...A.thumb].filter((p) => p.v <= A.heelY);
    const w = Math.max(...xs(fist)) - Math.min(...xs(fist));
    const h = A.heelY - Math.min(...ys(fist));
    assert.ok(w >= 83 && w <= 92, `width ${w.toFixed(1)}`);
    assert.ok(h >= 88 && h <= 100, `height ${h.toFixed(1)}`);
    const wr = crossings(A.body, 75);
    const ww = wr[wr.length - 1] - wr[0];
    assert.ok(ww >= 54 && ww <= 62, `wrist ${ww.toFixed(1)}`);
  });

  it('the four finger ends differ; their bends are the top edge (nothing of the hand above them)', () => {
    const by = Object.fromEntries(A.fingers.map((g) => [g.name, g]));
    const w = (n: string) => by[n].R - by[n].L;
    assert.ok(w('middle') >= w('index') && w('middle') >= w('ring') && w('little') < w('ring'), 'middle widest, little narrowest');
    assert.ok(by.middle.top < by.ring.top && by.middle.top < by.index.top && by.little.top > by.ring.top, 'middle highest, little lowest');
    // the body (palm, behind the pole) never rises above the fingers' bends
    assert.ok(Math.min(...ys(A.body)) > Math.min(...ys(A.group)) + 10);
    assert.ok(Math.abs(Math.min(...ys(A.group)) - by.middle.top) < 0.6);
  });

  it('options only: the approved drawing is the default; the LEFT hand is its mirror, re-lit (the light stays upper left)', () => {
    const id = PH.lightMapOf(0, false);
    assert.deepEqual([id.a, id.b, id.c, id.d].map((x: number) => x + 0), [1, 0, 0, 1], 'unturned, unmirrored: the approved light exactly');
    const L = PH.lightMapOf(0, true);
    // (mirrored: the page's light, upper left, comes from the art's upper RIGHT in its own frame)
    const lx = L.a * -0.62 + L.b * -0.78;
    const ly = L.c * -0.62 + L.d * -0.78;
    assert.ok(lx > 0 && ly < 0);
    // (mirrored, the thumb lands on the viewer's left)
    const toPage = PH.poleHandToPage({ x: 0, y: 0, s: 1, rot: 0, mirror: true });
    assert.ok(toPage(A.thumbRoot).u < 0);
  });
});
