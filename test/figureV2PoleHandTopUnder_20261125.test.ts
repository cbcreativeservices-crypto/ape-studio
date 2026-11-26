/**
 * FIGURE V2 — THE POLE HAND FROM DIRECTLY ABOVE, SUPPORTING THE POLE FROM BELOW (2026-11-25: B10 post-event overhead,
 * the boom operator's LEFT hand holds the pole UNDERHAND — palm up under the pole, fingers over its top, thumb up the near
 * side, wrist below — seen in the view from above; poleHandTopUnder.tsx, used mirrored). Checked here:
 *   • the art exists as authored points; the options and exports as poleHandEndUnder's;
 *   • the rig, read here (BoomV2.boomPlans 'top' + boomGrip.boomHandFace): B10's start left hand is underhand, its palm
 *     toward the camera (palm·up ≈ 0.81, 36° off square), the camera 29° over toward the knuckle side and leaning toward
 *     the thumb end, the thumb at the mic end, the forearm rising toward the camera; the drawing's constants are those;
 *   • the forearm leaves 98° clockwise from the pole's thumb end (mirrored −98°): within 1° of B10's start, within 3° of
 *     B10 raised over the head, within 20° of every dragged pose; B10 dragged below the mouth is another picture;
 *   • the pole THROUGH the hand (skin over its axis inside the fist, clear past it), never over the wrist or forearm;
 *   • the fingers: each grows out of the hand (its root inside the body or the finger above), each its own width and reach;
 *   • the thumb the thickest digit, its root inside the mound, its outline one line with the hand's; one nail, on it;
 *   • the wrist narrower than the hand; the cuff past the wrist; to the page placed, scaled, turned and mirrored.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PT = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandTopUnder.tsx'));
const FSm = R(await import('../src/dev/frontBoomStudy.tsx'));
const BV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/BoomV2.tsx'));
const BG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/boomGrip.ts'));

type Pt = { u: number; v: number };
type V3 = { x: number; y: number; z: number };
type Ell = { c: Pt; rx: number; ry: number; rot: number };
const A = PT.POLE_HAND_TOP_UNDER as unknown as {
  fingers: Pt[][];
  fingerEdges: Pt[][];
  fingerAxes: { name: string; mcp: Pt; pip: Pt; dip: Pt; tip: Pt; r: number }[];
  body: Pt[];
  thumb: Pt[];
  thumbEdge: Pt[];
  thumbNail: Pt[];
  sleeve: Pt[];
  cuff: Ell;
  thumbTip: Pt;
  thumbIp: Pt;
  heel: Pt;
  wrist: Pt;
} & Record<string, unknown>;
const r = PT.POLE_R_TOP_UNDER as number;
const AXIS = PT.POLE_TOP_UNDER_AXIS as Pt;
const FORE = PT.POLE_TOP_UNDER_FORE as Pt;
const K = PT.POLE_TOP_UNDER_FORESHORTEN as number;
const at = PT.poleTopUnderAxisAt as (a: number) => Pt;
const toPage = PT.poleHandTopUnderToPage as (o: { x: number; y: number; s: number; rot?: number; mirror?: boolean }) => (q: Pt) => Pt;
const axisOnPage = PT.poleHandTopUnderAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt;
const foreOnPage = PT.poleHandTopUnderForeOnPage as (o: { rot?: number; mirror?: boolean }) => Pt;
const deg = (x: number) => (x * 180) / Math.PI;
const fold = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const ang = (p: Pt) => deg(Math.atan2(p.v, p.u));
/** Across the pole's axis on the page (+: the right, the heel's and the wrist's side). */
const across = (p: Pt) => -p.u * AXIS.v + p.v * AXIS.u;
const along = (p: Pt) => p.u * AXIS.u + p.v * AXIS.v;
function inside(q: Pt[], p: Pt): boolean {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const a = q[i];
    const b = q[j];
    if (a.v > p.v !== b.v > p.v && p.u < ((b.u - a.u) * (p.v - a.v)) / (b.v - a.v) + a.u) c = !c;
  }
  return c;
}
/** The shape's width along the line through `p` in direction `d`: its outermost crossings. */
function chord(q: Pt[], p: Pt, d: Pt) {
  const ts: number[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    const ex = b.u - a.u;
    const ey = b.v - a.v;
    const den = d.u * ey - d.v * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((a.u - p.u) * ey - (a.v - p.v) * ex) / den;
    const s = ((a.u - p.u) * d.v - (a.v - p.v) * d.u) / den;
    if (s >= 0 && s <= 1) ts.push(t);
  }
  return Math.max(...ts) - Math.min(...ts);
}

/* ── the rig (read here, not copied): the left hand from above, underhand ── */
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: V3) => Math.sqrt(dot(a, a));
const unit = (a: V3): V3 => ({ x: a.x / len(a), y: a.y / len(a), z: a.z / len(a) });
type Seen = { label: string; under: boolean; palmUp: number; foreFromMic: number; foreUp: number; foreShare: number; poleUp: number; thumbAtMic: boolean; elbow: Pt; camF: number; camThumb: number };
function seen(label: string, rig: unknown, who: unknown, side: 'L' | 'R', mode = 'ruledHandOnly'): Seen {
  const B = BV.boomPlans(rig, who, 'top', false, undefined, mode);
  const a = (B.arms as { hand: { arm: { side: string; fist: V3; elbow: V3; under?: boolean } } }[]).find((x) => x.hand.arm.side === side)!;
  const arm = a.hand.arm;
  const t = B.vs.toward as V3;
  const f = BG.boomHandFace(B.o, arm, B.poleDir, t);
  const F2 = B.vs.proj(arm.fist) as Pt;
  const E2 = B.vs.proj(arm.elbow) as Pt;
  const P2 = B.vs.proj(add(arm.fist, B.poleDir)) as Pt;
  const f3 = unit(sub(arm.fist, arm.elbow));
  const fe = { u: E2.u - F2.u, v: E2.v - F2.v };
  return {
    label,
    under: !!arm.under,
    palmUp: f.palmUp,
    foreFromMic: fold(ang(fe) - ang({ u: P2.u - F2.u, v: P2.v - F2.v })),
    foreUp: dot(f3, t),
    foreShare: Math.hypot(fe.u, fe.v) / len(sub(arm.elbow, arm.fist)),
    poleUp: dot(B.poleDir, t),
    thumbAtMic: dot(f.thumb, B.poleDir) > 0,
    elbow: fe,
    camF: dot(f3, t),
    camThumb: dot(f.thumb, t),
  };
}
const rigs = FSm.SIDE_RIGS as { key: string; title: string; rig: unknown; who: unknown }[];
const B10 = rigs.find((x) => x.key === 'b10')!;
const START = seen('B10 overhead (start)', B10.rig, B10.who, 'L');
const live = (d: number, e: number) => {
  const q = (e * Math.PI) / 180;
  const front = { x: d * Math.cos(q), y: -d * Math.sin(q), z: 0 };
  const l = Math.hypot(front.x, front.y);
  const rig = FSm.b10LiveRig(front, { x: -front.x / l, y: -front.y / l, z: 0 });
  return rig ? seen(`B10 dragged ${d} mm at ${e}°`, rig, B10.who, 'L') : null;
};

describe('the pole hand from directly above, supporting the pole from below (poleHandTopUnder)', () => {
  it('the art exists as authored points; the exports as poleHandEndUnder’s', () => {
    for (const q of [...A.fingers, A.body, A.thumb, A.sleeve]) {
      assert.ok(Array.isArray(q) && q.length >= 8);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    for (const k of ['PoleHandTopUnder', 'poleHandTopUnderOutline', 'poleHandTopUnderToPage', 'poleHandTopUnderAxisOnPage', 'poleHandTopUnderForeOnPage', 'poleTopUnderAxisAt'])
      assert.equal(typeof PT[k as keyof typeof PT], 'function', k);
    assert.deepEqual(PT.POLE_TOP_UNDER_GRIP, { u: 0, v: 0 });
    assert.ok(Math.abs(Math.hypot(at(10).u, at(10).v) - 10 * K) < 1e-9);
  });

  it('the rig: B10’s start left hand from above is UNDERHAND, its palm toward the camera 36° off square, the thumb at the mic end', () => {
    assert.equal(START.under, true);
    assert.ok(Math.abs(START.palmUp - 0.808) < 0.02, `palm·up ${START.palmUp.toFixed(3)}`);
    assert.ok(START.thumbAtMic, 'the thumb at the mic end');
    assert.ok(Math.abs(START.foreFromMic - -97.7) < 1, `left forearm − pole (mic) ${START.foreFromMic.toFixed(1)}°`);
    // the forearm rises toward the camera; its page share; the pole's
    assert.ok(Math.abs(START.foreUp - 0.549) < 0.02 && Math.abs(START.foreShare - (PT.POLE_TOP_UNDER_FORE_SHARE as number)) < 0.02, `forearm up ${START.foreUp.toFixed(3)}, share ${START.foreShare.toFixed(3)}`);
    assert.ok(Math.abs(Math.sqrt(1 - START.poleUp * START.poleUp) - K) < 0.01, `pole share ${Math.sqrt(1 - START.poleUp * START.poleUp).toFixed(3)}`);
    // the elbow about 253 mm left and 109 mm below the fist (left hand)
    assert.ok(Math.abs(START.elbow.u - -253) < 3 && Math.abs(START.elbow.v - 109) < 3, `elbow (${START.elbow.u.toFixed(0)}, ${START.elbow.v.toFixed(0)})`);
    // the camera leans toward the knuckle side (along the forearm) and toward the thumb end
    assert.ok(START.camF > 0.5 && START.camThumb > 0.3);
  });

  it('the forearm leaves 98° clockwise from the pole’s thumb end (mirrored −98°): B10 start within 1°, raised within 3°, every drag within 20°', () => {
    const mine = fold(ang(FORE) - ang(AXIS));
    assert.ok(Math.abs(mine - 98) < 1e-9, `forearm − axis ${mine.toFixed(2)}°`);
    assert.ok(Math.abs(mine - deg(PT.TOP_UNDER_FORE_FROM_AXIS as number)) < 1e-9);
    const left = fold(ang(foreOnPage({ mirror: true })) - ang(axisOnPage({ mirror: true })));
    assert.ok(Math.abs(left - -98) < 1e-9, `left hand ${left.toFixed(1)}°`);
    // as placed at rot 0 the mirrored left hand IS B10's start: the pole at −105.7°, the forearm at 156.7°
    assert.ok(Math.abs(fold(ang(axisOnPage({ mirror: true })) - -105.7)) < 0.1);
    assert.ok(Math.abs(fold(ang(foreOnPage({ mirror: true })) - 156.7)) < 1);
    assert.ok(Math.abs(fold(left - START.foreFromMic)) < 1, 'B10 start within 1°');
    const raised = seen('raised', rigs.find((x) => x.title.includes('raised over the head'))!.rig, B10.who, 'L');
    assert.ok(raised.under && raised.thumbAtMic && Math.abs(fold(left - raised.foreFromMic)) < 3, `raised ${raised.foreFromMic.toFixed(1)}°`);
    assert.ok(Math.abs(raised.palmUp - START.palmUp) < 0.05);
    let n = 0;
    let worst = 0;
    for (const d of [600, 700, 800, 900, 1000])
      for (const e of [20, 30, 40, 50, 60]) {
        const L = live(d, e);
        if (!L || !L.under) continue;
        n++;
        const off = Math.abs(fold(left - L.foreFromMic));
        worst = Math.max(worst, off);
        assert.ok(off < 20, `${L.label}: ${L.foreFromMic.toFixed(1)}° (${off.toFixed(1)}° off)`);
        assert.ok(L.palmUp > 0.68 && L.palmUp < 0.84, `${L.label}: palm·up ${L.palmUp.toFixed(2)}`);
      }
    assert.ok(n >= 20 && worst > 15, `${n} dragged poses, the worst ${worst.toFixed(1)}° off`);
    // B10 dragged below the mouth: the pole's mic end turned away and the camera at the little-finger end — another view
    const below = seen('below', rigs.find((x) => x.title.includes('dragged below the mouth'))!.rig, B10.who, 'L');
    assert.ok(Math.abs(fold(left - below.foreFromMic)) > 40 && below.camThumb < 0, `below the mouth ${below.foreFromMic.toFixed(1)}°`);
  });

  it('the pole THROUGH the hand: covered by skin inside the fist, clear past it; never over the wrist or the forearm', () => {
    const skin = [...A.fingers, A.body, A.thumb];
    for (const a of [-36, -20, 0, 20, 36]) assert.ok(skin.some((q) => inside(q, at(a))), `skin over the axis at ${a} mm`);
    for (const a of [-80, 80]) assert.ok(!skin.some((q) => inside(q, at(a))), `the pole clear of the hand at ${a} mm`);
    // the fingers lie over the pole on its whole width at the middle of the fist
    for (const s of [-r + 2, 0, r - 2]) {
      const p = { u: -AXIS.v * s, v: AXIS.u * s };
      assert.ok(A.fingers.some((q) => inside(q, p)), `a finger over the pole ${s} mm across`);
    }
    // the wrist, the forearm and the sleeve well clear of the pole's band
    const fore = A.body.filter((p) => p.u > 58);
    assert.ok(fore.length >= 8);
    for (const p of [...fore, ...A.sleeve, A.wrist, A.cuff.c]) assert.ok(Math.abs(across(p)) > r + 12, `(${p.u.toFixed(1)}, ${p.v.toFixed(1)}) clear of the pole`);
    // the heel and the wrist on the right of the pole (the near side), the fingers' knuckle side on the left (the far side)
    assert.ok(across(A.heel) > r && across(A.wrist) > r);
    for (const f of A.fingerAxes) assert.ok(across(f.mcp) < -r && across(f.pip) < 0 && across(f.dip) > 0, `${f.name}: up the far side and over the top`);
  });

  it('the fingers grow out of the hand (each root inside the body or the finger above), each its own width and reach', () => {
    const [index, middle, ring, little] = A.fingers;
    assert.ok(inside(A.body, index[0]), 'the index from the hand');
    assert.ok(inside(A.body, middle[0]) || inside(index, middle[0]), 'the middle from the hand');
    assert.ok(inside(A.body, ring[0]) || inside(middle, ring[0]), 'the ring from the hand');
    assert.ok(inside(A.body, little[0]) || inside(ring, little[0]), 'the little from the hand');
    // the visible band of each finger over the pole (from the finger above's lower edge to its own), along the pole
    const band = (q: Pt[], above: Pt[] | null, x: number) => {
      const ys: number[] = [];
      for (let y = -60; y <= 60; y += 0.1) if (inside(q, { u: x, v: y }) && !(above && inside(above, { u: x, v: y }))) ys.push(y);
      return ys.length * 0.1;
    };
    const w = [band(index, null, 9), band(middle, index, 9), band(ring, middle, 9), band(little, ring, 9)];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(Math.abs(w[i] - w[j]) > 0.8, `widths ${w.map((x) => x.toFixed(1)).join(' / ')}`);
    assert.ok(w[1] === Math.max(...w) && w[3] === Math.min(...w), `the middle the widest, the little the narrowest: ${w.map((x) => x.toFixed(1)).join(' / ')}`);
    // each reaches its own distance past the pole's edge
    const reach = A.fingers.map((q) => Math.max(...q.map(across)));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(Math.abs(reach[i] - reach[j]) > 1.5, `reach ${reach.map((x) => x.toFixed(1)).join(' / ')}`);
    // no line where a finger grows out of the hand: every drawn edge stays clear of its knuckle side
    A.fingerEdges.slice(0, 3).forEach((e, i) => {
      const f = A.fingerAxes[i];
      for (const p of e) assert.ok(Math.hypot(p.u - f.mcp.u, p.v - f.mcp.v) > 8, `${f.name}: its edge clear of its knuckle`);
    });
  });

  it('the thumb is the thickest digit, grows out of its mound (its outline one line with the hand’s); one nail, on its end segment', () => {
    // the end segment, square to its length (it runs down and to the left at about 124°)
    const n = { u: Math.cos((34 * Math.PI) / 180), v: Math.sin((34 * Math.PI) / 180) };
    for (const p of [{ u: 31, v: -13 }, { u: 28.4, v: -8.4 }]) {
      const w = chord(A.thumb, p, n);
      assert.ok(w >= 17.5 && w <= 21, `end segment ${w.toFixed(1)} mm at (${p.u}, ${p.v})`);
    }
    // the base, level with its middle joint, between its drawn edges
    const base = chord(A.thumb.filter((p) => p.u < 50), { u: 36, v: -24 }, { u: 1, v: 0 });
    assert.ok(base >= 20 && base <= 24, `base ${base.toFixed(1)} mm`);
    // a blunt tip
    assert.ok(chord(A.thumb, { u: 23.4, v: -2 }, n) >= 11, 'a full, blunt tip');
    // every finger narrower than the thumb's end segment
    for (const f of A.fingerAxes) assert.ok(2 * f.r < 19.5, `${f.name} ${2 * f.r} mm`);
    // the root inside the mound; where its outline leaves the hand's it is the same point
    assert.ok(inside(A.body, A.thumb[0]), 'the root inside the mound');
    assert.ok(A.body.some((p) => Math.hypot(p.u - A.thumbEdge[0].u, p.v - A.thumbEdge[0].v) < 1e-9), 'one line with the hand’s outline');
    // the nail: wholly on the thumb's end segment, on its outer (lower-right) side, away from the pole
    const nc = { u: A.thumbNail.reduce((s, p) => s + p.u, 0) / A.thumbNail.length, v: A.thumbNail.reduce((s, p) => s + p.v, 0) / A.thumbNail.length };
    for (const p of A.thumbNail) assert.ok(inside(A.thumb, p), 'wholly on the thumb');
    assert.ok(across(nc) > across(A.thumbTip) + 4, 'on the side away from the pole');
    assert.ok(nc.v > A.thumbIp.v && nc.v < A.thumbTip.v, 'on the end segment');
    assert.deepEqual(Object.keys(A).filter((k) => /nail/i.test(k)), ['thumbNail'], 'no other nail');
  });

  it('the wrist narrower than the hand; the cuff past the wrist; to the page placed, scaled, turned and mirrored', () => {
    const acrossF = (p: Pt) => p.u * -FORE.v + p.v * FORE.u;
    const alongF = (p: Pt) => p.u * FORE.u + p.v * FORE.v;
    const wr = A.body.filter((p) => Math.abs(alongF(p) - alongF(A.wrist)) < 7).map(acrossF);
    const hand = [...A.body.filter((p) => alongF(p) < alongF(A.wrist) - 10), ...A.thumb, ...A.fingers.flat()].map(acrossF);
    assert.ok(wr.length >= 2);
    assert.ok(Math.max(...wr) - Math.min(...wr) < (Math.max(...hand) - Math.min(...hand)) * 0.6, 'the wrist narrower');
    assert.ok(alongF(A.cuff.c) > alongF(A.wrist) + 20, 'the cuff past the wrist');
    assert.ok(Math.abs(A.cuff.rx / A.cuff.ry - 0.55) < 0.03, 'the cuff foreshortened as the forearm rises (0.55)');
    const p = toPage({ x: 100, y: 50, s: 2 })(A.thumbTip);
    assert.ok(Math.abs(p.u - (100 + 2 * A.thumbTip.u)) < 1e-9 && Math.abs(p.v - (50 + 2 * A.thumbTip.v)) < 1e-9);
    const m = toPage({ x: 100, y: 50, s: 2, mirror: true })(A.thumbTip);
    assert.ok(Math.abs(m.u - (100 - 2 * A.thumbTip.u)) < 1e-9 && Math.abs(m.v - p.v) < 1e-9);
    const fo = foreOnPage({ rot: 0.3 });
    assert.ok(Math.abs(fold(ang(fo) - (ang(FORE) + deg(0.3)))) < 1e-9);
    assert.ok(Math.abs(along(AXIS) - 1) < 1e-9);
  });
});
