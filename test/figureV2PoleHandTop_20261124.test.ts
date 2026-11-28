/**
 * FIGURE V2 — THE POLE HAND FROM ABOVE (owner 2026-11-24, "one hand at a time": hand number three — a RIGHT hand
 * gripping a horizontal Ø 30 mm pole held overhead, palm forward, seen from directly above: poleHandTop.tsx).
 * Checked here:
 *   • the art exists as authored points (the fingers' group, the hand's body);
 *   • the thumb on the page's LEFT (a right hand, palm forward, the operator toward the page's bottom): only its base
 *     shows, one smooth convex swell on the operator's side of the pole, going in under the pole's near edge;
 *   • the pole THROUGH the hand: the fingers cross over it, the thumb's base and the palm's edge go under it on both
 *     sides; the pole seen left and right of the hand;
 *   • the fingers' bends hang just past the pole's front edge (the middle farthest, the little the shortest); the
 *     knuckle row on the operator's side, low swells, the middle the most prominent;
 *   • sizes: the fist about 88 mm along the pole, about 75 mm from the knuckle edge to the bends; the cuff 60–70 mm;
 *     the wrist narrower than the hand.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PT = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandTop.tsx'));
type Pt = { u: number; v: number };
const A = PT.POLE_HAND_TOP as {
  body: Pt[];
  group: Pt[];
  wristY: number;
  thumbPeak: Pt;
  thumbAtPole: Pt;
  cuff: { c: Pt; rx: number; ry: number };
  fingers: readonly { name: string; L: number; R: number; front: number; pip: number; knuckle: number }[];
};
const r = PT.POLE_R as number;
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

describe('the pole hand from above (poleHandTop)', () => {
  it('the art exists: the fingers and the hand, authored as points', () => {
    assert.ok(Array.isArray(A.body) && A.body.length >= 30);
    assert.ok(Array.isArray(A.group) && A.group.length >= 50);
    for (const p of [...A.body, ...A.group]) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    assert.equal(r, 15);
    assert.equal(typeof PT.PoleHandTop, 'function');
  });

  it("the thumb on the page's LEFT: only its base, one smooth convex swell on the operator's side, going under the pole", () => {
    assert.ok(by.index.L < by.little.L, 'index on the left, little finger on the right');
    assert.ok(A.thumbPeak.u < by.index.L - 8, 'the swell out beyond the index');
    assert.ok(A.thumbPeak.v > r && A.thumbPeak.v < r + 30, "on the operator's side, a little behind the pole");
    assert.ok(A.thumbAtPole.u < by.index.L - 8 && Math.abs(A.thumbAtPole.v - r) < 0.01);
    // (from where it leaves the wrist up to under the pole's near edge: every turn the same way — convex, no corner,
    // no notch)
    const i0 = A.body.findIndex((p) => p.u < -32 && p.v > 55 && p.v < 62);
    const i1 = A.body.findIndex((p) => p.u < -40 && p.v < r);
    assert.ok(i0 > i1, 'the outline runs down the thumb side from the pole to the wrist');
    const run = A.body.slice(i1, i0 + 1);
    assert.ok(run.length >= 8);
    let sign = 0;
    for (let i = 1; i < run.length - 1; i++) {
      const a = run[i - 1];
      const b = run[i];
      const c = run[i + 1];
      const z = (b.u - a.u) * (c.v - b.v) - (b.v - a.v) * (c.u - b.u);
      if (Math.abs(z) < 1e-9) continue;
      if (!sign) sign = Math.sign(z);
      assert.equal(Math.sign(z), sign, `convex at (${b.u}, ${b.v})`);
    }
  });

  it('the pole passes THROUGH the hand: the fingers over it, the thumb and the palm under it on both sides; seen both sides', () => {
    const g = crossings(A.group, 0);
    assert.equal(g.length, 2, 'the fingers one group across the pole');
    assert.ok(g[0] < by.index.L + 0.5 && g[1] > by.little.R - 0.5, 'all four fingers cross the pole');
    const b = crossings(A.body, r - 3);
    assert.equal(b.length, 2);
    assert.ok(b[0] < g[0] - 5, "the thumb's base goes under the pole beyond the index");
    assert.ok(b[1] > g[1], "the palm's edge goes under the pole beyond the little finger");
    assert.ok(b[0] > -52 && b[1] < 45, 'the pole is seen on both sides of the hand');
  });

  it("the bends hang just past the pole's front edge; the knuckle row on the operator's side", () => {
    for (const f of A.fingers) {
      assert.ok(f.front < -r - 6 && f.front > -r - 18, `${f.name}: its bend ${(-f.front - r).toFixed(1)} mm past the pole`);
      assert.ok(f.pip > -r && f.pip < r, `${f.name}: its middle joint over the pole`);
      assert.ok(f.knuckle > r + 18, `${f.name}: its knuckle behind the pole`);
    }
    assert.ok(by.middle.front < by.index.front && by.middle.front < by.ring.front, 'the middle finger hangs farthest');
    assert.ok(by.little.front > by.index.front && by.little.front > by.ring.front, 'the little finger the shortest');
    assert.ok(by.middle.knuckle > by.index.knuckle && by.middle.knuckle > by.ring.knuckle && by.little.knuckle < by.ring.knuckle);
    assert.ok(Math.abs(Math.min(...ys(A.group)) - by.middle.front) < 0.6, 'the bends are the front edge');
    const w = A.fingers.map((f) => f.R - f.L);
    assert.deepEqual(w, [18, 19, 18, 15]);
    // (the knuckle swells: index and middle the larger, the little the smallest, each on its finger's column)
    const K = Object.fromEntries((PT.KNUCKLES as readonly { name: string; c: Pt; kr: number }[]).map((k) => [k.name, k]));
    assert.ok(K.index.kr > K.ring.kr && K.middle.kr > K.ring.kr && K.little.kr < K.ring.kr);
    for (const f of A.fingers) assert.ok(K[f.name].c.u > f.L && K[f.name].c.u < f.R && K[f.name].c.v > r + 18);
  });

  it('sizes: the fist ≈ 88 mm along the pole and ≈ 75 mm across it; the cuff 60–70 mm; the wrist narrower than the hand', () => {
    const all = [...A.body.filter((p) => p.v <= A.wristY), ...A.group];
    const w = Math.max(...xs(all)) - Math.min(...xs(all));
    assert.ok(w >= 82 && w <= 92, `along the pole ${w.toFixed(1)}`);
    const across = Math.max(...A.fingers.map((f) => f.knuckle)) - Math.min(...A.fingers.map((f) => f.front));
    assert.ok(across >= 73 && across <= 86, `across ${across.toFixed(1)}`);
    assert.ok(2 * A.cuff.rx >= 60 && 2 * A.cuff.rx <= 70, `cuff ${2 * A.cuff.rx}`);
    assert.ok(A.cuff.ry > A.cuff.rx * 0.6, 'round-ish: the forearm nearly end-on');
    const wr = crossings(A.body, A.wristY);
    const ww = wr[wr.length - 1] - wr[0];
    assert.ok(ww >= 54 && ww <= 62, `wrist ${ww.toFixed(1)}`);
    assert.ok(ww < w * 0.72, 'the wrist clearly narrower than the hand');
  });

  it('(2026-11-24, "Boom top") only options added: the left hand mirrored and re-lit, the scene’s pole, its frame and outline — the default unchanged', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/figureV2/poleHandTop.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    for (const k of ['mirror?: boolean', "poleLook?: 'study' | 'boom'", 'export function poleHandTopToPage', 'export function poleHandTopOutline']) assert.ok(src.includes(k), k);
    // (the defaults: no mirror, the study pole; unturned and unmirrored the light map is the identity — exactly as authored)
    assert.match(src, /mirror = false, poleLook = 'study' \}: PoleHandTopProps\)/);
    assert.match(src, /mirror \|\| rot !== 0 \? lightMapOf\(rot, mirror\) : IDENTITY/);
    assert.match(src, /if \(isId\(M\)\) return es;/);
    assert.match(src, /if \(isId\(M\)\) return rimOf\(path, w\);/);
    // (the frame: the origin on the page point, +x along the turn; mirrored, the art's +x runs the other way)
    const T = PT.poleHandTopToPage({ x: 5, y: 7, s: 1, rot: 0 });
    assert.deepEqual(T({ u: 2, v: 3 }), { u: 7, v: 10 });
    const M = PT.poleHandTopToPage({ x: 5, y: 7, s: 1, rot: 0, mirror: true });
    assert.deepEqual(M({ u: 2, v: 3 }), { u: 3, v: 10 });
  });
});
