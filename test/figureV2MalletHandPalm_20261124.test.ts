/**
 * FIGURE V2 — THE MALLET HAND FROM THE PALM SIDE (owner 2026-11-24, "one hand at a time": the timpanist's far hand,
 * malletHandPalm.tsx). The same right hand and grip as the approved malletHandBack, seen from the other side.
 * Checked here:
 *   • the same hand: its outline is malletHandBack's, mirrored; the same shaft line (15° below the forearm);
 *   • the shaft leaves the grip between the thumb's pad and the index's bend, is hidden under the index across the
 *     palm, and its butt shows a little behind the index's fingertip, INSIDE the hand's outline (never outside);
 *   • four fingers, each its own form, differing: the index highest, the middle the longest, the little the smallest;
 *     their bends are the outline's own (one row on the far edge);
 *   • the thumb's root closes inside the hand (one form, no flap); the wrist narrower than the hand;
 *   • the options: the mirrored palm hand lands where malletHandBack would (same frame), and malletHandPalmRotFor.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const MP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/malletHandPalm.tsx'));
const MB = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/malletHandBack.tsx'));
type Pt = { u: number; v: number };
const A = MP.MALLET_HAND_PALM as {
  body: Pt[];
  thumb: Pt[];
  fingers: { index: Pt[]; middle: Pt[]; ring: Pt[]; little: Pt[] };
  lip: Pt[];
  wristX: number;
};
const F = MP.MALLET_PALM_FINGERS as readonly { name: string; top: number; bottom: number; bend: Pt; tip: Pt; w: number }[];
const on = MP.onShaftPalm as (a: number, d: number) => Pt;
const sc = MP.shaftCoordsPalm as (q: Pt) => { a: number; d: number };
const r = MP.MALLET_SHAFT_R as number;
const butt = MP.MALLET_BUTT as number;

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

describe('the mallet hand from the palm side (malletHandPalm)', () => {
  it('the same hand: malletHandBack’s outline mirrored, the same shaft line', () => {
    const back = MB.MALLET_HAND_BACK.body as Pt[];
    assert.equal(A.body.length, back.length);
    // (all but the thumb's top edge, which is bent a little at its middle joint: owner 2026-11-24)
    const t0 = MP.PALM_THUMB_TOP_AT as number;
    const t1 = t0 + (MB.MALLET_HAND_BACK.thumbTop as Pt[]).length;
    A.body.forEach((p, i) => {
      if (i < t0 || i >= t1) assert.ok(p.u === -back[i].u && p.v === back[i].v, `outline point ${i} mirrored`);
    });
    // the thumb's base joint and its tip unchanged; its middle joint bent ≈ 10–18°
    for (const i of [t0, t0 + 1, ...Array.from({ length: 6 }, (_, k) => t1 - 6 + k)]) assert.ok(A.body[i].u === -back[i].u && A.body[i].v === back[i].v);
    const top = A.body.slice(t0 + 2, t1 - 6).map(sc);
    const ang = (a: { a: number; d: number }, b: { a: number; d: number }) => Math.atan2(b.d - a.d, b.a - a.a);
    // (base joint → middle joint; middle joint → the start of the tip)
    const baseSeg = ang(top[0], top[2]);
    const endSeg = ang(top[3], top[top.length - 1]);
    const bend = ((baseSeg - endSeg) * 180) / Math.PI;
    assert.ok(bend >= 10 && bend <= 18, `thumb bent ${bend.toFixed(1)}° at its middle joint`);
    // the thumbnail: along the end segment's top edge, between the middle joint and the tip (its free edge ≥ 2 mm short
    // of the tip's end), 11–13 mm, ≤ 4.5 mm deep
    const nail = (MP.MALLET_HAND_PALM.thumbNail as Pt[]).map(sc);
    const joint = top[2].a;
    const tipA = sc(MP.MALLET_HAND_PALM.thumbTip as Pt).a;
    for (const q of nail) assert.ok(q.a > joint + 2 && q.a < tipA - 2, `nail point at ${q.a.toFixed(1)} between the joint and the tip`);
    const len = Math.max(...nail.map((q) => q.a)) - Math.min(...nail.map((q) => q.a));
    assert.ok(len >= 11 && len <= 13, `nail ${len.toFixed(1)} mm long`);
    const seg = A.body.slice(t0 + 2, t1 - 4).map(sc);
    const topAt = (a: number) => {
      for (let i = 1; i < seg.length; i++) if (a <= seg[i].a) return seg[i - 1].d + ((a - seg[i - 1].a) / (seg[i].a - seg[i - 1].a)) * (seg[i].d - seg[i - 1].d);
      return seg[seg.length - 1].d;
    };
    for (const q of nail) {
      const below = topAt(q.a) - q.d;
      assert.ok(below >= -0.5 && below <= 4.5, `nail ${below.toFixed(1)} mm under the top edge (on the outline, ≤ 4.5 mm deep)`);
    }
    assert.ok(nail.some((q) => Math.abs(topAt(q.a) - q.d) < 0.5), 'its rim on the thumb’s outline');
    assert.equal(typeof MP.MalletHandPalm, 'function');
    // (the head to the LEFT, 15° down; the inverse holds)
    const p = on(100, 0);
    assert.ok(Math.abs(Math.atan2(p.v, -p.u) - (15 * Math.PI) / 180) < 1e-9);
    const q = sc(on(-23, 4.5));
    assert.ok(Math.abs(q.a + 23) < 1e-9 && Math.abs(q.d - 4.5) < 1e-9);
  });

  it('the shaft: out of the grip between thumb pad and index, hidden under the index, its butt showing inside the hand', () => {
    // outside the hand from the mouth on toward the head
    for (let a = -3; a <= 200; a += 1) assert.ok(!inside(A.body, on(a, 0)), `shaft at ${a} seen`);
    // the butt inside the hand's outline (never along the outside)
    for (let a = -butt; a <= -5; a += 1) for (const d of [-r, 0, r]) assert.ok(inside(A.body, on(a, d * 0.95)), `shaft at ${a}/${d} within the hand`);
    // hidden under the index across the palm
    for (let a = -26; a <= -6; a += 2) assert.ok(inside(A.fingers.index, on(a, 0)), `shaft at ${a} under the index`);
    // shown for a few mm behind the index's tip, before it tucks under the thumb mound
    const shown = [];
    for (let a = -butt; a <= -5; a += 0.5) if (!inside(A.fingers.index, on(a, 0)) && !inside(A.lip, on(a, 0)) && !inside(A.thumb, on(a, 0))) shown.push(a);
    assert.ok(shown.length >= 8 && shown.length <= 30, `the butt shows for ${(shown.length / 2).toFixed(1)} mm`);
    assert.ok(Math.max(...shown) < -30, 'the shown part lies behind the index’s tip');
    // the thumb on TOP of the shaft
    for (const q of (MP.MALLET_HAND_PALM.thumbPad as Pt[])) assert.ok(sc(q).d > 0 && sc(q).d < r);
  });

  it('four fingers, each its own form, differing; their bends are the outline’s own (one row)', () => {
    assert.deepEqual(F.map((f) => f.name), ['index', 'middle', 'ring', 'little']);
    const by = Object.fromEntries(F.map((f) => [f.name, f]));
    // the index highest, the middle the longest, the little the smallest and shortest
    assert.ok(by.index.tip.v < by.middle.tip.v && by.middle.tip.v < by.ring.tip.v && by.ring.tip.v < by.little.tip.v);
    assert.ok(by.middle.tip.u > by.index.tip.u && by.middle.tip.u > by.ring.tip.u && by.ring.tip.u > by.little.tip.u);
    for (let i = 1; i < 4; i++) assert.ok(F[i].w < F[i - 1].w && F[i].bottom - F[i].top < F[i - 1].bottom - F[i - 1].top);
    // each bend point lies on the hand's outline
    for (const f of F) assert.ok(A.body.some((p) => p.u === f.bend.u && p.v === f.bend.v), `${f.name} bend on the outline`);
    // every fingertip inside the hand (tucked in toward the heel), none past the wrist
    for (const f of F) assert.ok(inside(A.body, f.tip) && f.tip.u < A.wristX - 30);
  });

  it('the thumb grows out of the hand; the wrist narrower than the hand', () => {
    for (const q of A.thumb.slice(0, 3)) assert.ok(inside(A.body, q), 'the thumb’s root inside the hand');
    const w = crossingsX(A.body, 92);
    const ww = w[w.length - 1] - w[0];
    const h = crossingsX(A.body, 31.5);
    const hh = h[h.length - 1] - h[0];
    assert.ok(ww >= 54 && ww <= 60 && ww < hh * 0.72, `wrist ${ww.toFixed(1)} vs hand ${hh.toFixed(1)}`);
  });

  it('the options: mirrored, it lands in malletHandBack’s frame; the rotation helper', () => {
    const toPage = MP.malletHandPalmToPage as (o: object) => (q: Pt) => Pt;
    const backPage = MB.malletHandToPage as (o: object) => (q: Pt) => Pt;
    const o = { x: 100, y: 50, s: 0.7, rot: 0.3 };
    const a = toPage({ ...o, mirror: true })(on(80, 0));
    const b = backPage(o)((MB.onShaft as (a: number, d: number) => Pt)(80, 0));
    assert.ok(Math.abs(a.u - b.u) < 1e-9 && Math.abs(a.v - b.v) < 1e-9);
    const rotFor = MP.malletHandPalmRotFor as (angle: number, mirror?: boolean) => number;
    for (const mirror of [false, true]) {
      const ang = 0.9;
      const rot = rotFor(ang, mirror);
      const f = toPage({ x: 0, y: 0, s: 1, rot, mirror });
      const p = f(on(100, 0));
      assert.ok(Math.abs(Math.atan2(p.v, p.u) - ang) < 1e-9, `mirror ${mirror}`);
    }
  });
});
