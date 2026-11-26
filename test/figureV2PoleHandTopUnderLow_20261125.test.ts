/**
 * FIGURE V2 — THE POLE HAND FROM DIRECTLY ABOVE, SUPPORTING THE POLE FROM BELOW, THE MIC DRAGGED LOW (2026-11-25: B10,
 * the mic dragged below the mouth: the boom operator's LEFT hand still holds the pole UNDERHAND, but the arm is pulled in
 * and down, and from above its forearm is 56.5° off the approved poleHandTopUnder's — poleHandTopUnderLow.tsx, a drawing
 * for that view, NOT placed yet). Checked here:
 *   • the art exists as authored points; the options and exports as poleHandTopUnder's;
 *   • the rig, read here (BoomV2.boomPlans 'top' + boomGrip.boomHandFace): below the mouth the left hand is underhand,
 *     the palm 62.6° off facing the camera, the camera 28° along the pole toward the LITTLE-finger end and 59° over from
 *     the palm toward the knuckle side (the backs of the fingers toward it, the back of the hand away), the thumb at the
 *     mic end, the forearm a little up toward the camera; the drawing's constants are those;
 *   • the forearm leaves 150° clockwise from the pole's thumb end (mirrored −150°): below the mouth within 5°, every low
 *     pose (where poleHandTopUnder is past its 40° fit) within 8°; B10's start is another picture;
 *   • the pole THROUGH the hand (the fingers over its axis inside the fist, clear past it); past the fist it passes over
 *     the wrist (the body under it there), and the cuff and the sleeve are clear of it;
 *   • the fingers: each grows out of the hand, each its own width, reach and end;
 *   • the thumb the thickest digit, its root hidden under the pole, its outer side past the fingers' ends; one nail, on
 *     its end segment's outer side;
 *   • the wrist narrower than the hand; the cuff past the wrist; to the page placed, scaled, turned and mirrored.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PT = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandTopUnderLow.tsx'));
const FSm = R(await import('../src/dev/frontBoomStudy.tsx'));
const BV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/BoomV2.tsx'));
const BG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/boomGrip.ts'));
const SRC = (await import('node:fs')).readFileSync(new URL('../src/screens/lab/miking/lessons/shared/figureV2/poleHandTopUnderLow.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type Pt = { u: number; v: number };
type V3 = { x: number; y: number; z: number };
type Ell = { c: Pt; rx: number; ry: number; rot: number };
const A = PT.POLE_HAND_TOP_UNDER_LOW as unknown as {
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
const r = PT.POLE_R_TOP_UNDER_LOW as number;
const AXIS = PT.POLE_TOP_UNDER_LOW_AXIS as Pt;
const KN = PT.POLE_TOP_UNDER_LOW_KNUCKLE_SIDE as Pt;
const FORE = PT.POLE_TOP_UNDER_LOW_FORE as Pt;
const K = PT.POLE_TOP_UNDER_LOW_FORESHORTEN as number;
const at = PT.poleTopUnderLowAxisAt as (a: number) => Pt;
const toPage = PT.poleHandTopUnderLowToPage as (o: { x: number; y: number; s: number; rot?: number; mirror?: boolean }) => (q: Pt) => Pt;
const axisOnPage = PT.poleHandTopUnderLowAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt;
const foreOnPage = PT.poleHandTopUnderLowForeOnPage as (o: { rot?: number; mirror?: boolean }) => Pt;
const deg = (x: number) => (x * 180) / Math.PI;
const fold = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const ang = (p: Pt) => deg(Math.atan2(p.v, p.u));
/** The pole's own page frame: a mm along it toward the thumb end, c mm across it toward the knuckle side. */
const al = (p: Pt) => p.u * AXIS.u + p.v * AXIS.v;
const cr = (p: Pt) => p.u * KN.u + p.v * KN.v;
const pAC = (a: number, c: number): Pt => ({ u: AXIS.u * a + KN.u * c, v: AXIS.v * a + KN.v * c });
function inside(q: Pt[], p: Pt): boolean {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const a = q[i];
    const b = q[j];
    if (a.v > p.v !== b.v > p.v && p.u < ((b.u - a.u) * (p.v - a.v)) / (b.v - a.v) + a.u) c = !c;
  }
  return c;
}

/* ── the rig (read here, not copied): the left hand from above, underhand ── */
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: V3) => Math.sqrt(dot(a, a));
const unit = (a: V3): V3 => ({ x: a.x / len(a), y: a.y / len(a), z: a.z / len(a) });
type Seen = { label: string; under: boolean; palmUp: number; backToCam: number; fore: number; foreShare: number; poleUp: number; thumbAtMic: boolean; elbow: Pt; camF: number; camThumb: number; forePole: number; approvedOff: number };
function seen(label: string, rig: unknown, who: unknown): Seen {
  const B = BV.boomPlans(rig, who, 'top', false, undefined, 'ruledHandOnly');
  const a = (B.arms as { hand: { arm: { side: string; fist: V3; elbow: V3; under?: boolean } } }[]).find((x) => x.hand.arm.side === 'L')!;
  const arm = a.hand.arm;
  const t = B.vs.toward as V3;
  const f = BG.boomHandFace(B.o, arm, B.poleDir, t);
  const U = BV.topUnderAngle(B.o, arm, B.poleDir, B.vs) as { measured: number; off: number };
  const F2 = B.vs.proj(arm.fist) as Pt;
  const E2 = B.vs.proj(arm.elbow) as Pt;
  const f3 = unit(sub(arm.fist, arm.elbow));
  const fe = { u: E2.u - F2.u, v: E2.v - F2.v };
  return {
    label,
    under: !!arm.under,
    palmUp: f.palmUp,
    backToCam: dot(f.d, t),
    fore: U.measured,
    foreShare: Math.hypot(fe.u, fe.v) / len(sub(arm.elbow, arm.fist)),
    poleUp: dot(B.poleDir, t),
    thumbAtMic: dot(f.thumb, B.poleDir) > 0,
    elbow: fe,
    camF: dot(f3, t),
    camThumb: dot(f.thumb, t),
    forePole: dot(f3, f.thumb),
    approvedOff: U.off,
  };
}
const rigs = FSm.SIDE_RIGS as { key: string; title: string; rig: unknown; who: unknown }[];
const B10 = rigs.find((x) => x.key === 'b10')!;
const BELOW = seen('B10 dragged below the mouth', rigs.find((x) => x.title.includes('dragged below the mouth'))!.rig, B10.who);
const liveAt = (front: { x: number; y: number }, aim: { x: number; y: number }, label: string) => {
  const l = Math.hypot(aim.x, aim.y);
  const rig = FSm.b10LiveRig({ x: front.x, y: front.y, z: 0 }, { x: aim.x / l, y: aim.y / l, z: 0 });
  return rig ? seen(label, rig, B10.who) : null;
};
/** Every B10 pose read here where the left hand is underhand from above and the approved poleHandTopUnder is past its
 *  40° fit: the mic dragged out 300–800 mm at −60° … +20° (to the mouth), below the mouth with other aims, and the first
 *  steps from below the mouth toward the start. */
function lowPoses(): Seen[] {
  const out: (Seen | null)[] = [];
  for (const d of [300, 370, 450, 600, 800])
    for (const e of [-60, -45, -30, -15, 0, 10, 20]) {
      const q = (e * Math.PI) / 180;
      const front = { x: d * Math.cos(q), y: -d * Math.sin(q) };
      out.push(liveAt(front, { x: -front.x, y: -front.y }, `${d} mm at ${e}°`));
    }
  for (const ay of [-1.6, -1.2, -1, -0.7, -0.4, 0]) out.push(liveAt({ x: 260, y: 260 }, { x: -0.7, y: ay }, `below the mouth, aim ${ay}`));
  for (let k = 0; k <= 1.0001; k += 0.1) {
    const a = { x: 260, y: 260 };
    const b = { x: 900 * Math.SQRT1_2, y: -900 * Math.SQRT1_2 };
    const a0 = { x: -0.7 / Math.hypot(0.7, 1), y: -1 / Math.hypot(0.7, 1) };
    const a1 = { x: -Math.SQRT1_2, y: Math.SQRT1_2 };
    out.push(liveAt({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }, { x: a0.x + (a1.x - a0.x) * k, y: a0.y + (a1.y - a0.y) * k }, `the sweep at ${k.toFixed(1)}`));
  }
  return out.filter((s): s is Seen => !!s && s.under && s.approvedOff > 40);
}

describe('the pole hand from directly above, supporting the pole from below, the mic dragged low (poleHandTopUnderLow)', () => {
  it('the art exists as authored points; the exports as poleHandTopUnder’s', () => {
    for (const q of [...A.fingers, A.body, A.thumb, A.sleeve]) {
      assert.ok(Array.isArray(q) && q.length >= 8);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    for (const k of ['PoleHandTopUnderLow', 'poleHandTopUnderLowOutline', 'poleHandTopUnderLowToPage', 'poleHandTopUnderLowAxisOnPage', 'poleHandTopUnderLowForeOnPage', 'poleTopUnderLowAxisAt'])
      assert.equal(typeof PT[k as keyof typeof PT], 'function', k);
    assert.deepEqual(PT.POLE_TOP_UNDER_LOW_GRIP, { u: 0, v: 0 });
    assert.ok(Math.abs(Math.hypot(at(10).u, at(10).v) - 10 * K) < 1e-9);
    // the pole's own frame: the knuckle side a quarter turn counter-clockwise from the axis
    assert.ok(Math.abs(al(KN)) < 1e-9 && Math.abs(fold(ang(KN) - ang(AXIS)) - -90) < 1e-9);
    // nothing places it yet (placement waits for the owner)
    assert.ok(SRC.includes('placement waits for the owner to pass the drawing'));
  });

  it('the rig: below the mouth the left hand from above is UNDERHAND, its palm 62.6° off, the camera at the LITTLE-finger end and over the knuckle side', () => {
    assert.equal(BELOW.under, true);
    assert.ok(Math.abs(BELOW.palmUp - 0.459) < 0.02, `palm·up ${BELOW.palmUp.toFixed(3)}`);
    assert.ok(BELOW.backToCam < -0.4, `the back of the hand turned away (${BELOW.backToCam.toFixed(2)})`);
    assert.ok(BELOW.thumbAtMic, 'the thumb at the mic end');
    assert.ok(Math.abs(BELOW.camThumb - -0.463) < 0.02, `camera along the pole toward the thumb ${BELOW.camThumb.toFixed(3)}`);
    // square to the pole the camera sits 59° over from the palm toward the knuckles (the backs of the fingers toward it)
    const q = (BELOW.camF - BELOW.forePole * BELOW.camThumb) / Math.sqrt(1 - BELOW.forePole * BELOW.forePole);
    assert.ok(Math.abs(q - 0.758) < 0.03 && Math.abs(deg(Math.atan2(q, BELOW.palmUp)) - 59) < 2, `camera toward the knuckle side ${q.toFixed(3)}`);
    assert.ok(Math.abs(BELOW.forePole - 0.614) < 0.03, `forearm · pole ${BELOW.forePole.toFixed(3)}`);
    // the forearm a little up toward the camera; its page share; the pole's
    assert.ok(Math.abs(BELOW.camF - 0.314) < 0.02 && Math.abs(BELOW.foreShare - (PT.POLE_TOP_UNDER_LOW_FORE_SHARE as number)) < 0.02, `forearm up ${BELOW.camF.toFixed(3)}, share ${BELOW.foreShare.toFixed(3)}`);
    assert.ok(Math.abs(Math.sqrt(1 - BELOW.poleUp * BELOW.poleUp) - K) < 0.01, `pole share ${Math.sqrt(1 - BELOW.poleUp * BELOW.poleUp).toFixed(3)}`);
    // the elbow about 51 mm right of and 309 mm below the fist (left hand)
    assert.ok(Math.abs(BELOW.elbow.u - 51) < 4 && Math.abs(BELOW.elbow.v - 309) < 4, `elbow (${BELOW.elbow.u.toFixed(0)}, ${BELOW.elbow.v.toFixed(0)})`);
    // the approved underhand drawing from above is 56.5° off here: the gap this drawing fills
    assert.ok(Math.abs(BELOW.approvedOff - 56.5) < 1, `poleHandTopUnder ${BELOW.approvedOff.toFixed(1)}° off`);
  });

  it('the forearm leaves 150° clockwise from the pole’s thumb end (mirrored −150°): below the mouth within 5°, every low pose within 8°', () => {
    const mine = fold(ang(FORE) - ang(AXIS));
    assert.ok(Math.abs(mine - 150) < 1e-9, `forearm − axis ${mine.toFixed(2)}°`);
    assert.ok(Math.abs(mine - deg(PT.TOP_UNDER_LOW_FORE_FROM_AXIS as number)) < 1e-9);
    const left = fold(ang(foreOnPage({ mirror: true })) - ang(axisOnPage({ mirror: true })));
    assert.ok(Math.abs(left - -150) < 1e-9, `left hand ${left.toFixed(1)}°`);
    // as placed at rot 0 the mirrored left hand is the below-the-mouth pose: the pole at −124.9°
    assert.ok(Math.abs(fold(ang(axisOnPage({ mirror: true })) - -124.9)) < 0.1);
    assert.ok(Math.abs(fold(left - BELOW.fore)) < 5, `below the mouth ${BELOW.fore.toFixed(1)}° (${Math.abs(fold(left - BELOW.fore)).toFixed(1)}° off)`);
    const low = lowPoses();
    let worst = 0;
    for (const L of low) {
      const off = Math.abs(fold(left - L.fore));
      worst = Math.max(worst, off);
      assert.ok(off < 8, `${L.label}: ${L.fore.toFixed(1)}° (${off.toFixed(1)}° off)`);
      assert.ok(L.camThumb < -0.15 && L.palmUp < 0.75, `${L.label}: the same view (camera ${L.camThumb.toFixed(2)}, palm·up ${L.palmUp.toFixed(2)})`);
    }
    assert.ok(low.length >= 25, `${low.length} low poses, the worst ${worst.toFixed(1)}° off`);
    // the range it serves within the lesson's 40° fit: the left forearm from −110° round to −190° (= +170°)
    assert.ok(Math.abs(fold(left - -110)) <= 40 + 1e-9 && Math.abs(fold(left - 170)) <= 40 + 1e-9);
    // B10's start (the mic high) is another picture (the approved poleHandTopUnder's)
    const start = seen('start', B10.rig, B10.who);
    assert.ok(Math.abs(fold(left - start.fore)) > 40 && start.camThumb > 0, `start ${start.fore.toFixed(1)}°`);
  });

  it('the pole THROUGH the hand: the fingers over its axis inside the fist, clear past it; past the fist it passes over the wrist', () => {
    const fingers = A.fingers;
    for (const a of [-21, -12, 0, 12, 24, 36]) assert.ok(fingers.some((q) => inside(q, pAC(a, 0))), `a finger over the axis ${a} mm along`);
    // the fingers lie over the pole on its whole width
    for (const c of [-r + 2, 0, r - 2]) assert.ok(fingers.some((q) => inside(q, pAC(6, c))), `a finger over the pole ${c} mm across`);
    for (const a of [-75, 75]) assert.ok(![...fingers, A.thumb].some((q) => inside(q, at(a))), `the pole clear of the fingers and the thumb at ${a} mm`);
    // the knuckles on the far (knuckle) side of the pole, the middle joints just past its other edge, the last joints beyond
    for (const f of A.fingerAxes) assert.ok(cr(f.mcp) > r && cr(f.pip) < -r + 7 && cr(f.dip) < -r, `${f.name}: over the pole from the knuckle side`);
    // past the fist the wrist goes UNDER the pole (the body crosses its axis there), the heel shows on the far side of it
    assert.ok(inside(A.body, at(-62)), 'the wrist under the pole');
    assert.ok(cr(A.heel) < -r && cr(A.wrist) > -r, 'the heel past the pole’s edge, the wrist’s middle under the pole');
    // the cuff and the sleeve well clear of the pole
    for (const p of [...A.sleeve, A.cuff.c]) assert.ok(Math.abs(cr(p)) > r + 5, `(${al(p).toFixed(1)}, ${cr(p).toFixed(1)}) clear of the pole`);
  });

  it('the fingers grow out of the hand (each root inside the body), each its own width, reach and end', () => {
    for (const [i, q] of A.fingers.entries()) assert.ok(inside(A.body, q[0]) && inside(A.body, q[2]), `${A.fingerAxes[i].name}: its root in the hand`);
    // the visible band of each finger across the pole's axis (the nearer finger, the next one, covers its little-finger side)
    const band = (q: Pt[], nearer: Pt[] | null) => {
      let n = 0;
      for (let a = -40; a <= 50; a += 0.1) if (inside(q, pAC(a, 0)) && !(nearer && inside(nearer, pAC(a, 0)))) n++;
      return n * 0.1;
    };
    const [index, middle, ring, little] = A.fingers;
    const w = [band(index, middle), band(middle, ring), band(ring, little), band(little, null)];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(Math.abs(w[i] - w[j]) > 0.8, `widths ${w.map((x) => x.toFixed(1)).join(' / ')}`);
    assert.ok(w[1] === Math.max(...w) && w[3] === Math.min(...w), `the middle the widest, the little the narrowest: ${w.map((x) => x.toFixed(1)).join(' / ')}`);
    // each end reaches its own distance past the pole's edge (the middle the farthest, the little the least)
    const reach = A.fingers.map((q) => -Math.min(...q.map(cr)));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(Math.abs(reach[i] - reach[j]) > 0.8, `reach ${reach.map((x) => x.toFixed(1)).join(' / ')}`);
    assert.ok(reach[1] === Math.max(...reach) && reach[3] === Math.min(...reach));
    // no line where a finger grows out of the hand: every drawn edge starts well clear of its knuckle
    A.fingerEdges.slice(0, 3).forEach((e, i) => {
      const f = A.fingerAxes[i];
      for (const p of e) assert.ok(Math.hypot(p.u - f.mcp.u, p.v - f.mcp.v) > 8, `${f.name}: its edge clear of its knuckle`);
    });
  });

  it('the thumb is the thickest digit, its root hidden under the pole, its outer side past the fingers’ ends; one nail, on its outer side', () => {
    // its width square to the pole across the end segment (its inner side behind the fingers' ends)
    const width = (a: number) => {
      const cs: number[] = [];
      for (let c = -60; c <= 0; c += 0.1) if (inside(A.thumb, pAC(a, c))) cs.push(c);
      return Math.max(...cs) - Math.min(...cs);
    };
    for (const a of [6, 12, 18]) assert.ok(width(a) >= 18 && width(a) <= 26, `thumb ${width(a).toFixed(1)} mm at ${a}`);
    for (const f of A.fingerAxes) assert.ok(2 * f.r < width(12), `${f.name} ${2 * f.r} mm`);
    // the root under the pole (hidden by it), inside the hand
    assert.ok(Math.abs(cr(A.thumb[0])) < r && inside(A.body, A.thumb[0]), 'the root under the pole, in the hand');
    // past the fingers' ends it shows: a full band of it outside every finger
    let seenBand = 0;
    for (let c = -60; c <= 0; c += 0.1) if (inside(A.thumb, pAC(12, c)) && !A.fingers.some((q) => inside(q, pAC(12, c)))) seenBand += 0.1;
    assert.ok(seenBand > 14, `the thumb shows ${seenBand.toFixed(1)} mm past the fingers`);
    // the nail: wholly on the thumb, on its outer side (away from the fist), on its end segment (past the middle joint)
    const nc = { u: A.thumbNail.reduce((s, p) => s + p.u, 0) / A.thumbNail.length, v: A.thumbNail.reduce((s, p) => s + p.v, 0) / A.thumbNail.length };
    for (const p of A.thumbNail) assert.ok(inside(A.thumb, p), 'wholly on the thumb');
    assert.ok(cr(nc) < -40 && !A.fingers.some((q) => inside(q, nc)), 'on the outer side, in sight');
    assert.ok(al(nc) < al(A.thumbIp) && al(nc) > al(A.thumbTip), 'on the end segment');
    assert.deepEqual(Object.keys(A).filter((k) => /nail/i.test(k)), ['thumbNail'], 'no other nail (the fingers’ are behind the pole)');
  });

  it('the wrist narrower than the hand; the forearm’s edges straight; the cuff past the wrist; to the page placed, scaled, turned and mirrored', () => {
    const acrossF = (p: Pt) => p.u * -FORE.v + p.v * FORE.u;
    const alongF = (p: Pt) => p.u * FORE.u + p.v * FORE.v;
    const wr = A.body.filter((p) => Math.abs(alongF(p) - alongF(A.wrist)) < 6).map(acrossF);
    const hand = [...A.body.filter((p) => alongF(p) < alongF(A.wrist) - 25), ...A.thumb, ...A.fingers.flat()].map(acrossF);
    assert.ok(wr.length >= 2);
    assert.ok(Math.max(...wr) - Math.min(...wr) < (Math.max(...hand) - Math.min(...hand)) * 0.6, 'the wrist narrower');
    // each forearm edge one straight line (its points on a line within 0.05 mm)
    const straight = (q: Pt[]) => {
      const d = { u: q[q.length - 1].u - q[0].u, v: q[q.length - 1].v - q[0].v };
      const l = Math.hypot(d.u, d.v);
      return Math.max(...q.map((p) => Math.abs(((p.u - q[0].u) * d.v - (p.v - q[0].v) * d.u) / l)));
    };
    const i0 = A.body.findIndex((p) => Math.abs(al(p) - -59.75) < 0.3 && Math.abs(cr(p) - 4.89) < 0.3);
    assert.ok(i0 > 0 && straight(A.body.slice(i0, i0 + 5)) < 0.05 && straight(A.body.slice(i0 + 5, i0 + 10)) < 0.05, 'the forearm’s edges straight');
    assert.ok(alongF(A.cuff.c) > alongF(A.wrist) + 40, 'the cuff past the wrist');
    assert.ok(Math.abs(A.cuff.rx / A.cuff.ry - 0.314) < 0.02, 'the cuff foreshortened as the forearm rises (0.31)');
    const p = toPage({ x: 100, y: 50, s: 2 })(A.thumbTip);
    assert.ok(Math.abs(p.u - (100 + 2 * A.thumbTip.u)) < 1e-9 && Math.abs(p.v - (50 + 2 * A.thumbTip.v)) < 1e-9);
    const m = toPage({ x: 100, y: 50, s: 2, mirror: true })(A.thumbTip);
    assert.ok(Math.abs(m.u - (100 - 2 * A.thumbTip.u)) < 1e-9 && Math.abs(m.v - p.v) < 1e-9);
    const fo = foreOnPage({ rot: 0.3 });
    assert.ok(Math.abs(fold(ang(fo) - (ang(FORE) + deg(0.3)))) < 1e-9);
    assert.ok(Math.abs(al(AXIS) - 1) < 1e-9);
  });
});
