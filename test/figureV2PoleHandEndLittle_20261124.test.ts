/**
 * FIGURE V2 — THE POLE HAND END-ON FROM THE LITTLE-FINGER END (owner 2026-11-24, "one hand at a time": a RIGHT hand
 * gripping a Ø 30 mm pole, seen looking ALONG the pole from the little-finger end, the pole ≈ 25° off the line of
 * sight: poleHandEndLittle.tsx — the partner of poleHandEnd). Checked here:
 *   • the art exists as authored points (the little finger, the three fingers behind, the hand's body);
 *   • the pole INSIDE the ring: the little finger's inner side presses on the pole's round section all round, its outer
 *     side well outside it;
 *   • the little finger's big knuckle the fist's highest point (one soft swell, no knuckle row);
 *   • the fingers behind stack in depth: each seen lower (farther along the pole), each showing beyond the fingers in
 *     front, each less of it shown than the one before;
 *   • the heel of the hand below the little finger's tip, flowing into a wrist narrower than the fist;
 *   • the pair with poleHandEnd: the same pole tilt and foreshortening, the pole axis and the cuff mirrored;
 *   • the grip centre exported; the to-page transform mirrors for the left hand.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PL = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEndLittle.tsx'));
const PE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEnd.tsx'));
type Pt = { u: number; v: number };
type Ell = { c: Pt; rx: number; ry: number; rot: number };
const A = PL.POLE_HAND_END_LITTLE as {
  little: Pt[];
  ring: Pt[];
  middle: Pt[];
  index: Pt[];
  behindEdges: [Pt[], Pt[], Pt[]];
  body: Pt[];
  cuff: Ell;
  knuckle: Pt;
  littleTip: Pt;
  heel: Pt;
};
const r = PL.POLE_R_LITTLE as number;
const TURN = PL.END_LITTLE_TURN as number;
const AXIS = PL.POLE_END_LITTLE_AXIS as Pt;
const SEC = PL.POLE_END_LITTLE_SECTION as Ell;
/** Back into the hand frame (the forearm along −x, the back of the hand up). */
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

describe('the pole hand end-on from the little-finger end (poleHandEndLittle)', () => {
  it('the art exists: little finger, three fingers behind, body — authored as points', () => {
    for (const q of [A.little, A.ring, A.middle, A.index, A.body]) {
      assert.ok(Array.isArray(q) && q.length >= 14);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    assert.equal(typeof PL.PoleHandEndLittle, 'function');
    assert.equal(typeof PL.poleHandEndLittleOutline, 'function');
  });

  it('the pole INSIDE the ring: the little finger presses on its section all round, its outer side well outside', () => {
    assert.ok(Math.abs(SEC.rx / SEC.ry - Math.cos(PL.POLE_END_LITTLE_TILT as number)) < 1e-9);
    assert.ok(Math.abs(Math.hypot(AXIS.u, AXIS.v) - 1) < 1e-9);
    const lit = H(A.little);
    const inner = lit.slice(25, 35);
    for (const p of inner) {
      const d = Math.hypot(p.u, p.v);
      assert.ok(d > r - 1.6 && d < r + 2.6, `little finger's inner side at ${d.toFixed(1)} mm from the axis`);
    }
    const outer = lit.slice(5, 21);
    for (const p of outer) assert.ok(Math.hypot(p.u, p.v) > r + 10, 'the finger round the pole, not along it');
    const angles = inner.map((p) => Math.atan2(p.v, p.u));
    assert.ok(Math.max(...angles) - Math.min(...angles) > 2.4, 'the C wraps well over a quarter round the pole');
  });

  it("the little finger's big knuckle is the fist's highest point: one soft swell, no knuckle row", () => {
    const k = unturn(A.knuckle);
    for (const q of [A.little, A.ring, A.middle, A.index]) for (const p of H(q)) assert.ok(p.v >= k.v - 0.01);
    const body = H(A.body).filter((p) => p.u > -70);
    for (const p of body) assert.ok(p.v >= k.v, 'the back of the hand lower than the knuckle');
    assert.ok(Math.min(...body.map((p) => p.v)) - k.v < 4, '...but only a little: a soft swell');
  });

  it('the fingers behind stack in depth: each lower, each showing beyond those in front, each less of it shown', () => {
    const fingers = [A.little, A.ring, A.middle, A.index];
    const low = fingers.map((q) => Math.max(...H(q).map((p) => p.v)));
    assert.ok(low[1] > low[0] && low[2] > low[1] && low[3] > low[2], `lowest ${low.map((b) => b.toFixed(1)).join(' / ')}`);
    // how many of each one's edge points lie outside every finger in front of it
    const shown = [1, 2, 3].map((k) => A.behindEdges[k - 1].filter((p) => fingers.slice(0, k).every((q) => !inside(q, p))).length);
    assert.ok(shown[0] > shown[1] && shown[1] > shown[2] && shown[2] >= 1, `shown ${shown.join(' / ')}`);
    // and all of them reach out along the far pole beyond the little finger
    const reach = fingers.map((q) => Math.max(...q.map(farOut)));
    for (const k of [1, 2, 3]) assert.ok(reach[k] > reach[0] + 2);
  });

  it('the heel of the hand: below the little finger, flowing into a wrist narrower than the fist', () => {
    const heel = unturn(A.heel);
    const lit = H(A.little);
    assert.ok(heel.v > Math.max(...lit.map((p) => p.v)) + 3, 'the heel fuller than the little finger reaches');
    const front = H(A.body).filter((p) => p.u > -70 && p.u < 0);
    assert.ok(Math.abs(Math.max(...front.map((p) => p.v)) - heel.v) < 1e-9, 'the heel the lowest point of the hand');
    const b = H(A.body);
    const wr = crossingsX(b, -72.5);
    const wrist = wr[wr.length - 1] - wr[0];
    const fist = Math.max(...H(A.index).map((p) => p.v)) - unturn(A.knuckle).v;
    assert.ok(wrist >= 42 && wrist <= 56, `wrist ${wrist.toFixed(1)}`);
    assert.ok(fist >= 70 && fist <= 90, `fist ${fist.toFixed(1)}`);
    assert.ok(wrist < fist * 0.75);
  });

  it('the pair with poleHandEnd: the same tilt, the pole axis and the cuff mirrored; the forearm to the lower left', () => {
    assert.equal(PL.POLE_END_LITTLE_TILT, PE.POLE_END_TILT);
    assert.equal(PL.POLE_END_LITTLE_FORESHORTEN, PE.POLE_END_FORESHORTEN);
    const ax = PE.POLE_END_AXIS as Pt;
    assert.ok(Math.abs(AXIS.u + ax.u) < 1e-9 && Math.abs(AXIS.v - ax.v) < 1e-9);
    const cuff = PL.POLE_HAND_END_LITTLE_CUFF as Pt;
    const cuffE = PE.POLE_HAND_END_CUFF as Pt;
    assert.ok(Math.abs(cuff.u + cuffE.u) < 1e-9 && Math.abs(cuff.v - cuffE.v) < 1e-9);
    assert.ok(cuff.u < -60 && cuff.v > 15, 'the cuff to the lower left of the fist');
    const g = PL.POLE_END_LITTLE_GRIP as Pt;
    assert.ok(Math.abs(farOut(g) - 40 * (PL.POLE_END_LITTLE_FORESHORTEN as number)) < 1e-9);
    const at = (PL.poleEndLittleAxisAt as (a: number) => Pt)(100);
    assert.ok(Math.abs(Math.hypot(at.u, at.v) - 100 * Math.sin(25 * (Math.PI / 180))) < 1e-9);
  });

  it('to the page: placed, scaled, and mirrored for the left hand', () => {
    const toPage = PL.poleHandEndLittleToPage as (o: { x: number; y: number; s: number; rot?: number; mirror?: boolean }) => (q: Pt) => Pt;
    const p = toPage({ x: 100, y: 50, s: 2 })(A.knuckle);
    assert.ok(Math.abs(p.u - (100 + 2 * A.knuckle.u)) < 1e-9 && Math.abs(p.v - (50 + 2 * A.knuckle.v)) < 1e-9);
    const m = toPage({ x: 100, y: 50, s: 2, mirror: true })(A.knuckle);
    assert.ok(Math.abs(m.u - (100 - 2 * A.knuckle.u)) < 1e-9 && Math.abs(m.v - p.v) < 1e-9);
    const ax = (PL.poleHandEndLittleAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    assert.ok(Math.abs(ax.u + AXIS.u) < 1e-9 && Math.abs(ax.v - AXIS.v) < 1e-9);
  });
});
