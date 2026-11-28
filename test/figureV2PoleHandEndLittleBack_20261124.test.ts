/**
 * FIGURE V2 — THE POLE HAND END-ON FROM THE LITTLE-FINGER END, TOWARD THE BACK OF THE HAND (owner 2026-11-24: a RIGHT
 * hand gripping a Ø 30 mm pole, seen ALONG the pole from the little-finger end, the pole ≈ 25° off the line of sight,
 * the camera tilted toward the back of the hand: poleHandEndLittleBack.tsx; used mirrored for the boom operator's LEFT
 * hand). Checked here:
 *   • the art exists as authored points; the options and exports mirror poleHandEndBack's; the same tilt;
 *   • the forearm leaves 150° clockwise (page) from the pole's near part: the mirrored left hand within 1° of B04 held
 *     low's arm (−150.5°); B10 overhead (−9.2°) is 141° away — one drawing cannot serve both (they are 141° apart);
 *   • the pole INSIDE the little finger's ring: skin all round its section; the near part hides the little finger's
 *     middle segment, never its knuckle, its bend or its tip; no thumb drawn (it is behind the fist from this side);
 *   • the fingers behind step up to the upper left, each by less; the knuckle row climbs that way;
 *   • the far pole hidden inside the hand and out past the back of it; the wrist narrower than the fist; to the page
 *     placed, scaled, turned and mirrored.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PL = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEndLittleBack.tsx'));
const PE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEnd.tsx'));
type Pt = { u: number; v: number };
type Ell = { c: Pt; rx: number; ry: number; rot: number };
const A = PL.POLE_HAND_END_LITTLE_BACK as unknown as {
  little: Pt[];
  ring: Pt[];
  middle: Pt[];
  index: Pt[];
  body: Pt[];
  cuff: Ell;
  knuckle: Pt;
  knuckles: Pt[];
  littleTip: Pt;
  heel: Pt;
} & Record<string, unknown>;
const r = PL.POLE_R_LITTLE_BACK as number;
const TURN = PL.END_LITTLE_BACK_TURN as number;
const AXIS = PL.POLE_END_LITTLE_BACK_AXIS as Pt;
const FORE = PL.POLE_END_LITTLE_BACK_FORE as Pt;
const SEC = PL.POLE_END_LITTLE_BACK_SECTION as Ell;
const unturn = (p: Pt): Pt => ({ u: p.u * Math.cos(TURN) + p.v * Math.sin(TURN), v: -p.u * Math.sin(TURN) + p.v * Math.cos(TURN) });
const H = (q: Pt[]) => q.map(unturn);
const deg = (x: number) => (x * 180) / Math.PI;
/** A page angle difference folded into (−180°, 180°]. */
const fold = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
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

describe('the pole hand end-on from the little-finger end, toward the back (poleHandEndLittleBack)', () => {
  it('the art exists as authored points; the exports mirror poleHandEndBack; the same tilt', () => {
    for (const q of [A.little, A.ring, A.middle, A.index, A.body]) {
      assert.ok(Array.isArray(q) && q.length >= 9);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    for (const k of ['PoleHandEndLittleBack', 'poleHandEndLittleBackOutline', 'poleHandEndLittleBackToPage', 'poleHandEndLittleBackAxisOnPage', 'poleHandEndLittleBackForeOnPage', 'poleEndLittleBackAxisAt'])
      assert.equal(typeof PL[k as keyof typeof PL], 'function', k);
    assert.ok(Math.abs(SEC.rx / SEC.ry - Math.cos(PL.POLE_END_LITTLE_BACK_TILT as number)) < 1e-9);
    assert.ok(Math.abs((PL.POLE_END_LITTLE_BACK_TILT as number) - (PE.POLE_END_TILT as number)) < 1e-12, 'the same tilt as poleHandEnd');
    assert.ok(!('thumb' in A), 'no thumb: it is behind the fist from this side');
  });

  it('the forearm leaves 150° clockwise from the near pole: the left hand fits B04 held low; B10 overhead cannot share it', () => {
    const mine = fold(deg(Math.atan2(FORE.v, FORE.u) - Math.atan2(AXIS.v, AXIS.u)));
    assert.ok(Math.abs(mine - 150) < 1e-9, `forearm − near axis ${mine.toFixed(1)}°`);
    assert.ok(Math.abs(mine - deg(PL.END_LITTLE_BACK_FORE_FROM_NEAR as number)) < 1e-9);
    // (the mirrored left hand turns it round)
    const fo = (PL.poleHandEndLittleBackForeOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    const ax = (PL.poleHandEndLittleBackAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    const left = fold(deg(Math.atan2(fo.v, fo.u) - Math.atan2(ax.v, ax.u)));
    assert.ok(Math.abs(left + 150) < 1e-9, `left hand ${left.toFixed(1)}°`);
    // (the rigs' real left forearms minus the near pole, on the page, read 2026-11-24: B04 held low, B10 overhead)
    const B04_LOW = -150.5;
    const B10_OVERHEAD = -9.2;
    assert.ok(Math.abs(fold(left - B04_LOW)) < 1, 'B04 held low within 1°');
    assert.ok(Math.abs(fold(left - B10_OVERHEAD)) > 40, 'B10 overhead outside the 40° tolerance');
    assert.ok(Math.abs(fold(B04_LOW - B10_OVERHEAD)) > 80, 'the two arms are too far apart for one drawing');
  });

  it('the pole INSIDE the little finger: skin all round its section; the near part hides the middle segment only', () => {
    const all = [H(A.little), H(A.body)];
    const has = (p: Pt) => all.some((q) => inside(q, p));
    for (const [x, y] of [[0, -22], [22, 0], [0, 22], [-22, 0], [16, -16], [-16, -16], [16, 16], [-16, 16]]) assert.ok(has({ u: x, v: y }), `skin at (${x}, ${y}) round the section`);
    // the little finger's inner side presses on the section round its far half (just outside it)
    for (const p of H(A.little).slice(31, 35)) {
      const d = Math.hypot(p.u, p.v);
      assert.ok(d > r - 1 && d < r + 3, `inner side at ${d.toFixed(1)} mm`);
    }
    // the near pole in FRONT hides the middle segment and the last joint …
    assert.ok(underNear(A.little[14]) && underNear(A.little[17]), 'the near pole over the middle segment and the last joint');
    // … never the knuckle, the bend or the tip
    assert.ok(!underNear(A.knuckle) && !underNear(A.little[11]) && !underNear(A.littleTip), 'the knuckle, the bend and the tip in view');
    // the tip tucked against the heel, below the pole
    assert.ok(unturn(A.littleTip).v > 12 && Math.hypot(A.littleTip.u - A.heel.u, A.littleTip.v - A.heel.v) < 40);
  });

  it('the fingers behind step up to the upper left, each by less; the knuckle row climbs that way', () => {
    const k = H(A.knuckles);
    for (let i = 1; i < 4; i++) assert.ok(k[i].u < k[i - 1].u && k[i].v < k[i - 1].v, 'each knuckle up and to the left of the one in front');
    const rise = [1, 2, 3].map((i) => k[i - 1].v - k[i].v);
    assert.ok(rise[0] > rise[1] && rise[1] > rise[2] && rise[2] > 1, `rises ${rise.map((x) => x.toFixed(1)).join(' / ')}: not a row of equal bumps`);
    const reach = [A.little, A.ring, A.middle, A.index].map((q) => Math.max(...q.map(farOut)));
    assert.ok(reach[1] > reach[0] && reach[2] > reach[1] && reach[3] > reach[2], 'each finger farther along the pole');
    // the little finger is the slimmest: its curl inside the others' reach above it
    const top = (q: Pt[]) => Math.min(...H(q).map((p) => p.v));
    assert.ok(top(A.little) > top(A.ring) && top(A.ring) > top(A.middle) && top(A.middle) > top(A.index));
  });

  it('the far pole hidden in the hand and out past the back of it; the wrist narrower than the fist; the anchors', () => {
    const at = PL.poleEndLittleBackAxisAt as (a: number) => Pt;
    assert.ok(Math.abs(Math.hypot(at(100).u, at(100).v) - 100 * Math.sin(25 * (Math.PI / 180))) < 1e-9);
    assert.ok(inside(A.body, at(-60)), 'inside the hand at the middle of the fist');
    for (const a of [-300, -500]) assert.ok(![A.body, A.little, A.ring, A.middle, A.index].some((q) => inside(q, at(a))), 'out past the back of the hand');
    assert.ok(Math.abs(farOut(PL.POLE_END_LITTLE_BACK_GRIP as Pt) - 40 * (PL.POLE_END_LITTLE_BACK_FORESHORTEN as number)) < 1e-9);
    const cuff = unturn(PL.POLE_HAND_END_LITTLE_BACK_CUFF as Pt);
    assert.ok(cuff.u < -80, 'the cuff toward the forearm');
    const wr = crossingsX(H(A.body), -75);
    const wrist = wr[wr.length - 1] - wr[0];
    const fist = Math.max(...H(A.body).map((p) => p.v)) - Math.min(...H(A.index).map((p) => p.v));
    assert.ok(wrist < fist * 0.75, `wrist ${wrist.toFixed(1)} against fist ${fist.toFixed(1)}`);
  });

  it('to the page: placed, scaled, turned and mirrored for the left hand', () => {
    const toPage = PL.poleHandEndLittleBackToPage as (o: { x: number; y: number; s: number; rot?: number; mirror?: boolean }) => (q: Pt) => Pt;
    const p = toPage({ x: 100, y: 50, s: 2 })(A.knuckle);
    assert.ok(Math.abs(p.u - (100 + 2 * A.knuckle.u)) < 1e-9 && Math.abs(p.v - (50 + 2 * A.knuckle.v)) < 1e-9);
    const m = toPage({ x: 100, y: 50, s: 2, mirror: true })(A.knuckle);
    assert.ok(Math.abs(m.u - (100 - 2 * A.knuckle.u)) < 1e-9 && Math.abs(m.v - p.v) < 1e-9);
    const ax = (PL.poleHandEndLittleBackAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    assert.ok(Math.abs(ax.u + AXIS.u) < 1e-9 && Math.abs(ax.v - AXIS.v) < 1e-9);
    const fo = (PL.poleHandEndLittleBackForeOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ rot: 0.3 });
    assert.ok(Math.abs(fold(deg(Math.atan2(fo.v, fo.u) - (Math.PI + TURN + 0.3)))) < 1e-9);
  });
});
