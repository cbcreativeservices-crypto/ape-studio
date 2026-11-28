/**
 * FIGURE V2 — THE POLE HAND END-ON (owner 2026-11-24, "one hand at a time": hand number four — a RIGHT hand gripping a
 * Ø 30 mm pole, seen looking ALONG the pole from the thumb / index end, the pole ≈ 25° off the line of sight:
 * poleHandEnd.tsx). Checked here:
 *   • the art exists as authored points (index, the three fingers behind, the hand's body, the thumb);
 *   • the pole INSIDE the ring: the index's inner side presses on the pole's round section all round the far half,
 *     its outer side well outside it; the thumb under the pole; the thumb's root closing inside the hand's mound;
 *   • the index's big knuckle the fist's highest point (one soft swell, no row);
 *   • the fingers behind progressively hidden: each reaches a little farther out along the far pole, by less each time;
 *   • the forearm leaves to the lower right; the wrist narrower than the fist; the cuff anchor, the pole axis and the
 *     grip centre exported; the round section foreshortened by cos 25°; the to-page transform mirrors for the left hand.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEnd.tsx'));
type Pt = { u: number; v: number };
type Ell = { c: Pt; rx: number; ry: number; rot: number };
const A = PE.POLE_HAND_END as {
  index: Pt[];
  middle: Pt[];
  ring: Pt[];
  little: Pt[];
  body: Pt[];
  thumb: Pt[];
  cuff: Ell;
  knuckle: Pt;
  thumbTip: Pt;
};
const r = PE.POLE_R as number;
const TURN = PE.END_TURN as number;
const AXIS = PE.POLE_END_AXIS as Pt;
const SEC = PE.POLE_END_SECTION as Ell;
/** Back into the hand frame (the forearm along +x, the back of the hand up). */
const unturn = (p: Pt): Pt => ({ u: p.u * Math.cos(TURN) + p.v * Math.sin(TURN), v: -p.u * Math.sin(TURN) + p.v * Math.cos(TURN) });
const H = (q: Pt[]) => q.map(unturn);
/** How far a point lies out along the FAR pole (away from the viewer) on the page. */
const farOut = (p: Pt) => -(p.u * AXIS.u + p.v * AXIS.v);
function inside(q: Pt[], p: Pt): boolean {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const a = q[i];
    const b = q[j];
    if (a.v > p.v !== b.v > p.v && p.u < ((b.u - a.u) * (p.v - a.v)) / (b.v - a.v) + a.u) c = !c;
  }
  return c;
}
function crossingsX(q: Pt[], x: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    if ((a.u - x) * (b.u - x) < 0) out.push(a.v + ((x - a.u) / (b.u - a.u)) * (b.v - a.v));
  }
  return out.sort((m, n) => m - n);
}

describe('the pole hand end-on (poleHandEnd)', () => {
  it('the art exists: index, three fingers behind, body, thumb — authored as points', () => {
    for (const q of [A.index, A.middle, A.ring, A.little, A.body, A.thumb]) {
      assert.ok(Array.isArray(q) && q.length >= 14);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    assert.equal(typeof PE.PoleHandEnd, 'function');
    assert.equal(typeof PE.poleHandEndOutline, 'function');
  });

  it('the pole INSIDE the ring: the index presses on its section all round, the thumb under it, the thumb grows out of its mound', () => {
    // (the section foreshortened: narrower along the pole by cos 25°)
    assert.ok(Math.abs(SEC.rx / SEC.ry - Math.cos(PE.POLE_END_TILT as number)) < 1e-9);
    assert.ok(Math.abs(Math.hypot(AXIS.u, AXIS.v) - 1) < 1e-9);
    const idx = H(A.index);
    // the inner side (the far half of the section, round the C): every point just outside the pole
    const inner = idx.slice(25, 34);
    for (const p of inner) {
      const d = Math.hypot(p.u, p.v);
      assert.ok(d > r - 1.6 && d < r + 2.6, `index inner side at ${d.toFixed(1)} mm from the axis`);
    }
    // its outer side well outside the pole, all round the C (left, bottom-left, bottom)
    const outer = idx.slice(5, 21);
    for (const p of outer) assert.ok(Math.hypot(p.u, p.v) > r + 10, 'the finger round the pole, not along it');
    const angles = inner.map((p) => Math.atan2(p.v, p.u));
    assert.ok(Math.max(...angles) - Math.min(...angles) > 2.4, 'the C wraps well over a quarter round the pole');
    // the thumb under the pole, nearer than the fingers' ends, its root inside the hand's mound
    const th = H(A.thumb);
    assert.ok(Math.min(...th.map((p) => p.v)) > 6, 'the thumb below the pole');
    assert.ok(inside(H(A.body), th[0]) && inside(H(A.body), th[th.length - 1]), 'its root closes inside the mound');
    assert.ok(unturn(A.thumbTip).u < 0 && unturn(A.thumbTip).u > -30, 'its tip on the index, not beyond the fist');
  });

  it("the index's big knuckle is the fist's highest point: one soft swell, no knuckle row", () => {
    const k = unturn(A.knuckle);
    for (const q of [A.index, A.middle, A.ring, A.little, A.thumb]) for (const p of H(q)) assert.ok(p.v >= k.v - 0.01);
    const body = H(A.body).filter((p) => p.u < 70);
    for (const p of body) assert.ok(p.v >= k.v, 'the back of the hand lower than the knuckle');
    assert.ok(Math.min(...body.map((p) => p.v)) - k.v < 4, '...but only a little: a soft swell');
  });

  it('the fingers behind are progressively hidden: each farther out along the far pole, by less each time', () => {
    const reach = [A.index, A.middle, A.ring, A.little].map((q) => Math.max(...q.map(farOut)));
    assert.ok(reach[1] > reach[0] && reach[2] > reach[1] && reach[3] > reach[2]);
    const bands = [reach[1] - reach[0], reach[2] - reach[1], reach[3] - reach[2]];
    assert.ok(bands[0] > bands[1] && bands[1] > bands[2], `bands ${bands.map((b) => b.toFixed(1)).join(' / ')}`);
    assert.ok(bands[2] > 1 && bands[0] < 12, 'a sliver at the end, never a full finger');
  });

  it('the forearm leaves to the lower right; the wrist narrower than the fist; the anchors exported', () => {
    const cuff = PE.POLE_HAND_END_CUFF as Pt;
    assert.ok(cuff.u > 60 && cuff.v > 15, 'the cuff to the lower right of the fist');
    const b = H(A.body);
    const wr = crossingsX(b, 72.5);
    const wrist = wr[wr.length - 1] - wr[0];
    const fist = Math.max(...H(A.thumb).map((p) => p.v)) - unturn(A.knuckle).v;
    assert.ok(wrist >= 42 && wrist <= 56, `wrist ${wrist.toFixed(1)}`);
    assert.ok(fist >= 70 && fist <= 90, `fist ${fist.toFixed(1)}`);
    assert.ok(wrist < fist * 0.75);
    // the pole's axis toward the viewer, the grip centre back along it inside the fist
    const g = PE.POLE_END_GRIP as Pt;
    assert.ok(Math.abs(farOut(g) - 40 * (PE.POLE_END_FORESHORTEN as number)) < 1e-9);
    const at = (PE.poleEndAxisAt as (a: number) => Pt)(100);
    assert.ok(Math.abs(Math.hypot(at.u, at.v) - 100 * Math.sin(25 * (Math.PI / 180))) < 1e-9);
  });

  it('to the page: placed, scaled, and mirrored for the left hand', () => {
    const toPage = PE.poleHandEndToPage as (o: { x: number; y: number; s: number; rot?: number; mirror?: boolean }) => (q: Pt) => Pt;
    const p = toPage({ x: 100, y: 50, s: 2 })(A.knuckle);
    assert.ok(Math.abs(p.u - (100 + 2 * A.knuckle.u)) < 1e-9 && Math.abs(p.v - (50 + 2 * A.knuckle.v)) < 1e-9);
    const m = toPage({ x: 100, y: 50, s: 2, mirror: true })(A.knuckle);
    assert.ok(Math.abs(m.u - (100 - 2 * A.knuckle.u)) < 1e-9 && Math.abs(m.v - p.v) < 1e-9);
    const ax = (PE.poleHandEndAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    assert.ok(Math.abs(ax.u + AXIS.u) < 1e-9 && Math.abs(ax.v - AXIS.v) < 1e-9);
  });
});
