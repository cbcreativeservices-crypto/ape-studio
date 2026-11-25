/**
 * FIGURE V2 — THE POLE HAND END-ON FROM THE LITTLE-FINGER END, TOWARD THE FRONT OF THE FIST (owner 2026-11-24: a RIGHT
 * hand gripping a Ø 30 mm pole, seen ALONG the pole from the little-finger end, the pole ≈ 25° off the line of sight,
 * the camera tilted toward the front of the fist, the hand's plane edge-on: poleHandEndLittleFore.tsx; used mirrored
 * for the boom operator's LEFT hand on B10 post-event overhead). Checked here:
 *   • the art exists as authored points; the options and exports mirror poleHandEndBack's; the same tilt; no thumb;
 *   • the forearm leaves 9° clockwise (page) from the pole's near part: the mirrored left hand within 1° of B10
 *     overhead's arm (−9.2°, read from the rig 2026-11-24); B10 raised (+94.7°) and dragged below the mouth (+73.7°)
 *     are other views (past the 40° tolerance);
 *   • the pole INSIDE the hand: skin all round its section; the near part lies in front of the side of the hand, never
 *     over the little finger's knuckle, bend or tip; the far part hidden in the fist and out past the index's front;
 *   • the knuckle row steps up to the right, each step different; the bends each at their own height;
 *   • the wrist narrower than the fist; to the page placed, scaled, turned and mirrored.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PF = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEndLittleFore.tsx'));
const PE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEnd.tsx'));
type Pt = { u: number; v: number };
type Ell = { c: Pt; rx: number; ry: number; rot: number };
const A = PF.POLE_HAND_END_LITTLE_FORE as unknown as {
  little: Pt[];
  ring: Pt[];
  middle: Pt[];
  index: Pt[];
  body: Pt[];
  cuff: Ell;
  knuckle: Pt;
  knuckles: Pt[];
  bends: Pt[];
  littleTip: Pt;
  heel: Pt;
} & Record<string, unknown>;
const r = PF.POLE_R_LITTLE_FORE as number;
const TURN = PF.END_LITTLE_FORE_TURN as number;
const AXIS = PF.POLE_END_LITTLE_FORE_AXIS as Pt;
const FORE = PF.POLE_END_LITTLE_FORE_FORE as Pt;
const SEC = PF.POLE_END_LITTLE_FORE_SECTION as Ell;
const K = PF.POLE_END_LITTLE_FORE_FORESHORTEN as number;
const unturn = (p: Pt): Pt => ({ u: p.u * Math.cos(TURN) + p.v * Math.sin(TURN), v: -p.u * Math.sin(TURN) + p.v * Math.cos(TURN) });
const H = (q: Pt[]) => q.map(unturn);
const deg = (x: number) => (x * 180) / Math.PI;
/** A page angle difference folded into (−180°, 180°]. */
const fold = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const along = (p: Pt) => p.u * AXIS.u + p.v * AXIS.v;
const across = (p: Pt) => -p.u * AXIS.v + p.v * AXIS.u;
/** Under the near pole's band (B10's 110 mm of it) on the page. */
const underNear = (p: Pt) => along(p) > 0 && along(p) < 110 * K && Math.abs(across(p)) < r;
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

describe('the pole hand end-on from the little-finger end, toward the front of the fist (poleHandEndLittleFore)', () => {
  it('the art exists as authored points; the exports mirror poleHandEndBack; the same tilt; no thumb', () => {
    for (const q of [A.little, A.ring, A.middle, A.index, A.body]) {
      assert.ok(Array.isArray(q) && q.length >= 9);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    for (const k of ['PoleHandEndLittleFore', 'poleHandEndLittleForeOutline', 'poleHandEndLittleForeToPage', 'poleHandEndLittleForeAxisOnPage', 'poleHandEndLittleForeForeOnPage', 'poleEndLittleForeAxisAt'])
      assert.equal(typeof PF[k as keyof typeof PF], 'function', k);
    assert.ok(Math.abs(SEC.rx / SEC.ry - Math.cos(PF.POLE_END_LITTLE_FORE_TILT as number)) < 1e-9);
    assert.ok(Math.abs((PF.POLE_END_LITTLE_FORE_TILT as number) - (PE.POLE_END_TILT as number)) < 1e-12, 'the same tilt as poleHandEnd');
    assert.ok(!('thumb' in A), 'no thumb: it lies behind the four fingers from this side');
    assert.equal(PF.POLE_END_LITTLE_FORE_NEAR, 110, "B10's pole goes on 110 mm past this hand");
  });

  it('the forearm leaves 9° clockwise from the near pole: the left hand fits B10 overhead; raised and dragged below are other views', () => {
    const mine = fold(deg(Math.atan2(FORE.v, FORE.u) - Math.atan2(AXIS.v, AXIS.u)));
    assert.ok(Math.abs(mine - 9) < 1e-9, `forearm − near axis ${mine.toFixed(1)}°`);
    assert.ok(Math.abs(mine - deg(PF.END_LITTLE_FORE_FORE_FROM_NEAR as number)) < 1e-9);
    const fo = (PF.poleHandEndLittleForeForeOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    const ax = (PF.poleHandEndLittleForeAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    const left = fold(deg(Math.atan2(fo.v, fo.u) - Math.atan2(ax.v, ax.u)));
    assert.ok(Math.abs(left + 9) < 1e-9, `left hand ${left.toFixed(1)}°`);
    // (the rigs' real left forearms minus the near pole, on the page, read 2026-11-24 from BoomV2.boomPlans 'side')
    assert.ok(Math.abs(fold(left - -9.2)) < 1, 'B10 overhead within 1°');
    assert.ok(Math.abs(fold(left - 94.7)) > 40, 'B10 raised over the head: the camera at the thumb end, another view');
    assert.ok(Math.abs(fold(left - 73.7)) > 40, 'B10 dragged below the mouth: toward the palm, another view');
    // the drag range where the camera is at the little-finger end, toward the front (1000 mm out; 50°, 45°, 40°, 30° up)
    for (const a of [-22.9, 7.0, 5.4, 4.9, 10.9]) assert.ok(Math.abs(fold(left - a)) < 40, `drag ${a}° inside the tolerance`);
  });

  it('the pole INSIDE the hand: skin all round its section; the near part in front of the side of the hand only', () => {
    const all = [H(A.little), H(A.body)];
    const has = (p: Pt) => all.some((q) => inside(q, p));
    for (const [x, y] of [[0, -22], [22, 0], [0, 22], [-22, 0], [16, -16], [-16, -16], [16, 16], [-16, 16]]) assert.ok(has({ u: x, v: y }), `skin at (${x}, ${y}) round the section`);
    // the little finger's inner side presses on the section round its far half (just outside it)
    for (const p of H(A.little).slice(28, 32)) {
      const d = Math.hypot(p.u / Math.cos(PF.POLE_END_LITTLE_FORE_TILT as number), p.v);
      assert.ok(d > r - 1 && d < r + 4, `inner side at ${d.toFixed(1)} mm`);
    }
    // the near pole in FRONT of the side of the hand and the heel …
    const turned = (x: number, y: number): Pt => ({ u: x * Math.cos(TURN) - y * Math.sin(TURN), v: x * Math.sin(TURN) + y * Math.cos(TURN) });
    const side = turned(-30, 8);
    assert.ok(inside(A.body, side) && underNear(side), 'the near pole over the side of the hand, above the heel');
    // … never over the little finger's knuckle, its bend or its tip; nor over any knuckle or bend behind
    for (const p of [A.knuckle, A.littleTip, ...A.knuckles, ...A.bends]) assert.ok(!underNear(p), 'the knuckles, the bends and the tip in view');
    // the tip tucked just under the pole's lower edge, against the heel
    assert.ok(Math.abs(across(A.littleTip)) < r + 6 && Math.hypot(A.littleTip.u - A.heel.u, A.littleTip.v - A.heel.v) < 40);
  });

  it('the far pole hidden in the fist and out past the index finger’s front', () => {
    const at = PF.poleEndLittleForeAxisAt as (a: number) => Pt;
    assert.ok(Math.abs(Math.hypot(at(100).u, at(100).v) - 100 * K) < 1e-9);
    const shapes = [A.body, A.little, A.ring, A.middle, A.index];
    assert.ok(shapes.some((q) => inside(q, at(-60))), 'inside the hand at the middle of the fist');
    for (const a of [-220, -300]) assert.ok(!shapes.some((q) => inside(q, at(a))), 'out past the index');
    const front = Math.max(...H(A.index).map((p) => p.u));
    assert.ok(unturn(at(-220)).u > front, 'beyond the index finger’s front');
    assert.ok(Math.abs(along(PF.POLE_END_LITTLE_FORE_GRIP as Pt) + 40 * K) < 1e-9);
  });

  it('the knuckle row steps up to the right, each step its own; the bends each at their own height', () => {
    const k = H(A.knuckles);
    for (let i = 1; i < 4; i++) assert.ok(k[i].u > k[i - 1].u, 'each knuckle to the right of the one in front');
    const rise = [1, 2, 3].map((i) => k[i - 1].v - k[i].v);
    assert.ok(rise[0] > 0 && rise[1] > 0 && rise[2] < 0, `rises ${rise.map((x) => x.toFixed(1)).join(' / ')}: the middle's the highest, the index's lower`);
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(Math.abs(Math.abs(rise[i]) - Math.abs(rise[j])) > 1, 'no two steps alike');
    const b = H(A.bends);
    for (let i = 1; i < 4; i++) assert.ok(b[i].u > b[i - 1].u, 'each bend farther out');
    const ys = b.map((p) => p.v);
    assert.ok(Math.max(...ys) - Math.min(...ys) > 6, 'the bends at different heights: not a row of equal bumps');
    const steps = [1, 2, 3].map((i) => b[i].u - b[i - 1].u);
    assert.ok(new Set(steps.map((s) => Math.round(s))).size === 3, `bend steps ${steps.map((s) => s.toFixed(1)).join(' / ')}: each finger its own width`);
  });

  it('the wrist narrower than the fist; the cuff toward the forearm; to the page placed, scaled, turned and mirrored', () => {
    const cuff = unturn(PF.POLE_HAND_END_LITTLE_FORE_CUFF as Pt);
    assert.ok(cuff.u < -80, 'the cuff toward the forearm');
    const wr = crossingsX(H(A.body), -72);
    const wrist = wr[wr.length - 1] - wr[0];
    const fist = Math.max(...H(A.body).map((p) => p.v)) - Math.min(...H(A.middle).map((p) => p.v));
    assert.ok(wrist < fist * 0.75, `wrist ${wrist.toFixed(1)} against fist ${fist.toFixed(1)}`);
    const toPage = PF.poleHandEndLittleForeToPage as (o: { x: number; y: number; s: number; rot?: number; mirror?: boolean }) => (q: Pt) => Pt;
    const p = toPage({ x: 100, y: 50, s: 2 })(A.knuckle);
    assert.ok(Math.abs(p.u - (100 + 2 * A.knuckle.u)) < 1e-9 && Math.abs(p.v - (50 + 2 * A.knuckle.v)) < 1e-9);
    const m = toPage({ x: 100, y: 50, s: 2, mirror: true })(A.knuckle);
    assert.ok(Math.abs(m.u - (100 - 2 * A.knuckle.u)) < 1e-9 && Math.abs(m.v - p.v) < 1e-9);
    const ax = (PF.poleHandEndLittleForeAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ mirror: true });
    assert.ok(Math.abs(ax.u + AXIS.u) < 1e-9 && Math.abs(ax.v - AXIS.v) < 1e-9);
    const fo = (PF.poleHandEndLittleForeForeOnPage as (o: { rot?: number; mirror?: boolean }) => Pt)({ rot: 0.3 });
    assert.ok(Math.abs(fold(deg(Math.atan2(fo.v, fo.u) - (Math.PI + TURN + 0.3)))) < 1e-9);
  });
});
