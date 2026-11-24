/**
 * FIGURE V2 — THE MALLET HAND FROM THE BACK (owner 2026-11-24, "one hand at a time": a RIGHT hand holding a timpani /
 * concert bass drum mallet, Ø 12 mm shaft, the hand 45 mm from its butt, seen from the back of the hand by a side
 * camera: malletHandBack.tsx). Checked here:
 *   • the art exists as authored points (one hand outline, the thumb as its own piece closing inside it);
 *   • the thumb on TOP of the shaft, its pad overlapping the shaft's top, its tip a little past the index's bend;
 *   • the shaft leaves the fist on the right from BETWEEN the thumb's pad and the index's bend (both overlapping it),
 *     and only there: the butt (45 mm back) ends inside the hand;
 *   • the four bends stacked index → little, each a little shorter; the knuckles low swells, the middle the largest;
 *   • the fist about 85 mm tall (thumb top to little finger, square to the shaft) and about 80 mm from the wrist to
 *     the bends; the wrist clearly narrower than the hand.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const MH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/malletHandBack.tsx'));
type Pt = { u: number; v: number };
type Finger = { name: string; top: number; bottom: number; bend: Pt; notch: Pt; knuckle: Pt; kr: number };
const A = MH.MALLET_HAND_BACK as {
  body: Pt[];
  thumb: Pt[];
  thumbTop: Pt[];
  thumbPad: Pt[];
  mouth: Pt[];
  thumbTip: Pt;
  wristX: number;
  fingers: readonly Finger[];
};
const onShaft = MH.onShaft as (a: number, d: number) => Pt;
const sc = MH.shaftCoords as (q: Pt) => { a: number; d: number };
const r = MH.MALLET_SHAFT_R as number;
const butt = MH.MALLET_BUTT as number;
const by = Object.fromEntries(A.fingers.map((f) => [f.name, f])) as Record<string, Finger>;

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

describe('the mallet hand from the back (malletHandBack)', () => {
  it('the art exists: one hand outline and the thumb, authored as points', () => {
    assert.ok(Array.isArray(A.body) && A.body.length >= 40);
    for (const p of [...A.body, ...A.thumb]) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    assert.equal(r, 6, 'a Ø 12 mm shaft');
    assert.equal(butt, 45, 'the hand 45 mm from the butt');
    assert.equal(typeof MH.MalletHandBack, 'function');
    // (the shaft 15° down to the right in the neutral drawing)
    const p = onShaft(100, 0);
    assert.ok(Math.abs(Math.atan2(p.v, p.u) - (15 * Math.PI) / 180) < 1e-9);
  });

  it('the thumb lies along the TOP of the shaft: its pad on it, its tip a little past the index bend', () => {
    // (up to the tip: the tip itself rounds down onto the shaft)
    for (const q of A.thumbTop.filter((p) => sc(p).a < 10)) assert.ok(sc(q).d > r + 8, `thumb top above the shaft at (${q.u.toFixed(1)}, ${q.v.toFixed(1)})`);
    for (const q of A.thumbPad) {
      const d = sc(q).d;
      assert.ok(d > 0 && d < r, 'the pad overlapping the shaft’s top half');
    }
    const past = sc(A.thumbTip).a - sc(by.index.bend).a;
    assert.ok(past >= 0 && past <= 8, `tip ${past.toFixed(1)} mm past the index bend (at it, or 5–8 mm past)`);
    // a THUMB, not a pointing finger: the end segment ≈ 20 mm deep over the shaft (top edge to pad)
    const top0 = A.thumbTop.map(sc).filter((q) => q.a > -6 && q.a < 4);
    const depth = Math.min(...top0.map((q) => q.d)) - Math.max(...A.thumbPad.map((q) => sc(q).d));
    assert.ok(depth >= 18 && depth <= 23, `end segment ${depth.toFixed(1)} mm deep`);
    // the pad over the shaft's top edge for the first ≈ 15 mm out of the grip
    assert.ok(sc(A.thumbTip).a - sc(A.mouth[0]).a >= 15, 'the pad over the shaft for ≈ 15 mm out of the grip');
    // (the thumb's base closes INSIDE the hand: one form, no flap)
    for (const q of A.thumb.slice(0, 3)) assert.ok(inside(A.body, q), 'the thumb’s root inside the hand');
  });

  it('the shaft leaves the fist BETWEEN the thumb pad and the index bend, and only there', () => {
    const deep = A.mouth.reduce((m, q) => (sc(q).a < sc(m).a ? q : m));
    assert.ok(Math.abs(sc(deep).d) < 1 && sc(deep).a < 0 && sc(deep).a > -6, 'the grip point on the axis just inside the fulcrum');
    const indexTop = A.body.find((q) => q.u === 3 && q.v === 4.7)!;
    assert.ok(sc(indexTop).d < 0 && sc(indexTop).d > -r, 'the index bend overlapping the shaft’s lower half');
    // inside the hand from the butt to the fulcrum; outside from the mouth on
    for (let a = -butt; a <= -5; a += 1) assert.ok(inside(A.body, onShaft(a, 0)), `shaft at ${a} hidden in the hand`);
    for (const [a, d] of [[-butt - r, 0], [-butt + r, r], [-butt + r, -r]]) assert.ok(inside(A.body, onShaft(a, d)), 'the butt ends inside the hand');
    for (let a = -3; a <= 200; a += 1) assert.ok(!inside(A.body, onShaft(a, 0)), `shaft at ${a} seen`);
  });

  it('the bends stacked index → little, each a little shorter; the knuckles low swells, the middle the largest', () => {
    const names = A.fingers.map((f) => f.name);
    assert.deepEqual(names, ['index', 'middle', 'ring', 'little']);
    for (let i = 1; i < 4; i++) {
      assert.ok(A.fingers[i].top >= A.fingers[i - 1].bottom - 0.01, 'stacked top to bottom');
      assert.ok(A.fingers[i].bend.u < A.fingers[i - 1].bend.u, `${names[i]} shorter than ${names[i - 1]}`);
      assert.ok(A.fingers[i].knuckle.v > A.fingers[i - 1].knuckle.v);
    }
    assert.ok(by.little.kr < by.ring.kr && by.ring.kr < by.index.kr && by.index.kr <= by.middle.kr, 'index and middle knuckles the largest');
    // the bends: the index's the largest, each one below a little smaller
    for (let i = 1; i < 4; i++) assert.ok(A.fingers[i].bottom - A.fingers[i].top < A.fingers[i - 1].bottom - A.fingers[i - 1].top);
    for (const f of A.fingers) {
      const seg = f.bend.u - f.knuckle.u;
      assert.ok(seg >= 14 && seg <= 26, `${f.name}: knuckle to bend ${seg.toFixed(1)} mm`);
      assert.ok(f.bottom - f.top >= 11 && f.bottom - f.top <= 17, `${f.name}: ${(f.bottom - f.top).toFixed(1)} mm`);
    }
  });

  it('the fist about 85 mm tall and 80 mm long; the wrist narrower than the hand', () => {
    const ds = A.body.filter((q) => q.u > A.wristX).map((q) => sc(q).d);
    const tall = Math.max(...ds) - Math.min(...ds);
    assert.ok(tall >= 80 && tall <= 95, `tall ${tall.toFixed(1)} (square to the shaft)`);
    const long = by.index.bend.u - A.wristX;
    assert.ok(long >= 75 && long <= 90, `long ${long.toFixed(1)}`);
    const w = crossingsX(A.body, -92);
    const ww = w[w.length - 1] - w[0];
    assert.ok(ww >= 54 && ww <= 60, `wrist ${ww.toFixed(1)}`);
    const h = crossingsX(A.body, -31.5);
    const hh = h[h.length - 1] - h[0];
    assert.ok(ww < hh * 0.72, `the wrist (${ww.toFixed(1)}) clearly narrower than the hand (${hh.toFixed(1)})`);
  });
});
