/**
 * FIGURE V2 — THE POLE HAND END-ON, FROM THE BACK SIDE (owner 2026-11-24, "one hand at a time": hand number five — a
 * RIGHT hand gripping a Ø 30 mm pole, seen ALONG the pole from the thumb / index end, the pole ≈ 25° off the line of
 * sight, the camera tilted toward the BACK of the hand: poleHandEndBack.tsx). Checked here:
 *   • the art exists as authored points; the options and exports mirror poleHandEnd's;
 *   • the forearm leaves the fist 135° counter-clockwise (page) from the pole's near part — exactly opposite
 *     poleHandEnd's (45° clockwise), so the rigs where poleHandEnd's forearm was 169–177° off the arm come within 11°;
 *   • the pole INSIDE the ring: skin all round its section (index above and left, thumb below, the web right); the near
 *     part in FRONT of the fist hides the index's lower curl and the thumb's very end, never the knuckle or the bend;
 *   • the fingers behind step up to the upper right, each by less; the knuckle row climbs that way;
 *   • the far part of the pole hidden inside the hand, out again past the back of the hand; the wrist narrower than
 *     the fist; the to-page transform mirrors for the left hand.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PB = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEndBack.tsx'));
const PE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEnd.tsx'));
type Pt = { u: number; v: number };
type Ell = { c: Pt; rx: number; ry: number; rot: number };
const A = PB.POLE_HAND_END_BACK as {
  index: Pt[];
  middle: Pt[];
  ring: Pt[];
  little: Pt[];
  body: Pt[];
  thumb: Pt[];
  thumbNail: Pt[];
  cuff: Ell;
  knuckle: Pt;
  knuckles: Pt[];
  thumbTip: Pt;
};
const r = PB.POLE_R as number;
const TURN = PB.END_BACK_TURN as number;
const AXIS = PB.POLE_END_BACK_AXIS as Pt;
const FORE = PB.POLE_END_BACK_FORE as Pt;
const SEC = PB.POLE_END_BACK_SECTION as Ell;
const unturn = (p: Pt): Pt => ({ u: p.u * Math.cos(TURN) + p.v * Math.sin(TURN), v: -p.u * Math.sin(TURN) + p.v * Math.cos(TURN) });
const H = (q: Pt[]) => q.map(unturn);
const deg = (x: number) => (x * 180) / Math.PI;
/** A page angle difference folded into (−180°, 180°]. */
const fold = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
/** Along the near pole (+ toward the viewer) and across it, on the page (drawing frame). */
const along = (p: Pt) => p.u * AXIS.u + p.v * AXIS.v;
const across = (p: Pt) => -p.u * AXIS.v + p.v * AXIS.u;
/** Under the near pole's band on the page. */
const underNear = (p: Pt) => along(p) > 0 && Math.abs(across(p)) < r;
const farOut = (p: Pt) => -along(p);
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

describe('the pole hand end-on from the back side (poleHandEndBack)', () => {
  it('the art exists as authored points; the exports mirror poleHandEnd', () => {
    for (const q of [A.index, A.middle, A.ring, A.little, A.body, A.thumb]) {
      assert.ok(Array.isArray(q) && q.length >= 9);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    for (const k of ['PoleHandEndBack', 'poleHandEndBackOutline', 'poleHandEndBackToPage', 'poleHandEndBackAxisOnPage', 'poleHandEndBackForeOnPage', 'poleEndBackAxisAt'])
      assert.equal(typeof PB[k as keyof typeof PB], 'function', k);
    assert.ok(Math.abs(SEC.rx / SEC.ry - Math.cos(PB.POLE_END_BACK_TILT as number)) < 1e-9);
    assert.ok(Math.abs(PB.POLE_END_BACK_TILT - PE.POLE_END_TILT) < 1e-12, 'the same tilt as poleHandEnd');
  });

  it("the forearm leaves 135° counter-clockwise from the near pole: opposite poleHandEnd's, within 11° of the B04 / F09 arms", () => {
    const mine = fold(deg(Math.atan2(FORE.v, FORE.u) - Math.atan2(AXIS.v, AXIS.u)));
    assert.ok(Math.abs(mine - -135) < 1e-9, `forearm − near axis ${mine.toFixed(1)}°`);
    assert.ok(Math.abs(mine - deg(PB.END_BACK_FORE_FROM_NEAR as number)) < 1e-9);
    const et = PE.END_TURN as number;
    const ax = PE.POLE_END_AXIS as Pt;
    const theirs = fold(deg(et - Math.atan2(ax.v, ax.u)));
    assert.ok(Math.abs(theirs - 45) < 1e-9, `poleHandEnd ${theirs.toFixed(1)}°`);
    assert.ok(Math.abs(Math.abs(fold(mine - theirs)) - 180) < 1e-9, 'exactly opposite');
    // (BoomV2 2026-11-24: poleHandEnd's forearm 169°, 177°, 170° off the real arm on B04 close, B04 held low, F09)
    for (const lean of [169, 177, 170]) assert.ok(180 - lean <= 11 && 180 - lean < 40);
  });

  it('the pole INSIDE the ring: skin all round its section; the near part in front hides the lower curl, not the knuckle or the bend', () => {
    const all = [H(A.index), H(A.thumb), H(A.body)];
    const has = (p: Pt) => all.some((q) => inside(q, p));
    for (const [x, y] of [[0, -24], [-24, 0], [0, 26], [24, 0], [17, -17], [-17, -17], [17, 17]]) assert.ok(has({ u: x, v: y }), `skin at (${x}, ${y}) round the section`);
    // the index's inner side presses on the section all round its far half
    for (const p of H(A.index).slice(25, 34)) {
      const d = Math.hypot(p.u, p.v);
      assert.ok(d > r - 1.6 && d < r + 2.6, `index inner side at ${d.toFixed(1)} mm`);
    }
    // the near pole in FRONT: it hides the index's last joint and the thumb's very end …
    assert.ok(underNear(A.index[17]) && underNear(A.thumbTip), 'the near pole over the lower curl and the thumb end');
    // … never the knuckle, the middle joint's bend, the thumb's nail or its root
    assert.ok(!underNear(A.knuckle) && !underNear(A.index[11]), 'the knuckle and the bend in view');
    const nail = A.thumbNail.reduce((s, p) => ({ u: s.u + p.u / A.thumbNail.length, v: s.v + p.v / A.thumbNail.length }), { u: 0, v: 0 });
    assert.ok(!underNear(nail), 'the thumb nail just in view');
    assert.ok(inside(H(A.body), H(A.thumb)[0]) && inside(H(A.body), H(A.thumb)[A.thumb.length - 1]), "the thumb's root closes inside the mound");
    assert.ok(Math.min(...H(A.thumb).map((p) => p.v)) > 6, 'the thumb below the pole');
  });

  it('the fingers behind step up to the upper right, each by less; the knuckle row climbs that way', () => {
    const reach = [A.index, A.middle, A.ring, A.little].map((q) => Math.max(...q.map(farOut)));
    assert.ok(reach[1] > reach[0] && reach[2] > reach[1] && reach[3] > reach[2]);
    const bands = [reach[1] - reach[0], reach[2] - reach[1], reach[3] - reach[2]];
    assert.ok(bands[0] > bands[1] && bands[1] > bands[2], `bands ${bands.map((b) => b.toFixed(1)).join(' / ')}`);
    assert.ok(bands[2] > 1 && bands[0] < 14, 'a sliver at the end, never a full finger');
    const k = H(A.knuckles);
    for (let i = 1; i < 4; i++) assert.ok(k[i].u > k[i - 1].u && k[i].v < k[i - 1].v, 'each knuckle up and to the right of the one in front');
    const steps = [1, 2, 3].map((i) => Math.hypot(k[i].u - k[i - 1].u, k[i].v - k[i - 1].v));
    assert.ok(steps[0] > steps[2], 'not a row of equal bumps');
  });

  it('the far pole hidden in the hand and out past the back of it; the wrist narrower than the fist; the anchors exported', () => {
    const at = PB.poleEndBackAxisAt as (a: number) => Pt;
    assert.ok(Math.abs(Math.hypot(at(100).u, at(100).v) - 100 * Math.sin(25 * (Math.PI / 180))) < 1e-9);
    assert.ok(inside(A.body, at(-60)), 'inside the hand at the middle of the fist');
    for (const a of [-260, -400]) assert.ok(![A.body, A.index, A.middle, A.ring, A.little, A.thumb].some((q) => inside(q, at(a))), 'out past the back of the hand');
    assert.ok(Math.abs(farOut(PB.POLE_END_BACK_GRIP as Pt) - 40 * (PB.POLE_END_BACK_FORESHORTEN as number)) < 1e-9);
    const cuff = unturn(PB.POLE_HAND_END_BACK_CUFF as Pt);
    assert.ok(cuff.u > 80, 'the cuff toward the forearm');
    const wr = crossingsX(H(A.body), 72.5);
    const wrist = wr[wr.length - 1] - wr[0];
    const fist = Math.max(...H(A.thumb).map((p) => p.v)) - Math.min(...H(A.little).map((p) => p.v));
    assert.ok(wrist < fist * 0.75, `wrist ${wrist.toFixed(1)} against fist ${fist.toFixed(1)}`);
  });

  it('to the page: placed, scaled, and mirrored for the left hand', () => {
    const toPage = PB.poleHandEndBackToPage as (o: { x: number; y: number; s: number; rot?: number; mirror?: boolean }) => (q: Pt) => Pt;
    const p = toPage({ x: 100, y: 50, s: 2 })(A.knuckle);
    assert.ok(Math.abs(p.u - (100 + 2 * A.knuckle.u)) < 1e-9 && Math.abs(p.v - (50 + 2 * A.knuckle.v)) < 1e-9);
    const m = toPage({ x: 100, y: 50, s: 2, mirror: true })(A.knuckle);
    assert.ok(Math.abs(m.u - (100 - 2 * A.knuckle.u)) < 1e-9 && Math.abs(m.v - p.v) < 1e-9);
    const ax = (PB.poleHandEndBackAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    assert.ok(Math.abs(ax.u + AXIS.u) < 1e-9 && Math.abs(ax.v - AXIS.v) < 1e-9);
    const fo = (PB.poleHandEndBackForeOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ rot: 0.3 });
    assert.ok(Math.abs(Math.atan2(fo.v, fo.u) - (TURN + 0.3)) < 1e-9);
  });
});
