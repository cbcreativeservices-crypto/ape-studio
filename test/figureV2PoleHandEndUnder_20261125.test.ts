/**
 * FIGURE V2 — THE POLE HAND END-ON FROM THE THUMB END, SUPPORTING THE POLE FROM BELOW (owner 2026-11-25: B10 post-event
 * overhead, the boom operator's LEFT hand holds the pole UNDERHAND — palm up under the pole, fingers over its top, thumb
 * up the near side, wrist below; poleHandEndUnder.tsx, used mirrored). Checked here:
 *   • the art exists as authored points; the options and exports mirror poleHandEndLittleBack's; the same 25° tilt;
 *   • the forearm leaves 8° clockwise (page) from the pole's near part; the mirrored left hand −8°: 1° off B10's start
 *     pose and within 40° of the main thumb-end drag zone (read from the rig itself here, through BoomV2.boomPlans; the
 *     mic close in and low, and B10 raised / dragged below the mouth, are other views);
 *   • placed on B10's start rig as BoomV2 places an end-on drawing (near axis on the pole, grip on the grip point,
 *     straight wrist) the upper arm reaches (≤ 300 mm on the page) and the elbow is below the hand;
 *   • the pole INSIDE the hand: skin all round its section; the near pole never over the wrist, the forearm or the
 *     sleeve; the wrist and forearm BELOW the pole's line (the hand under the pole), the forearm dropping away;
 *   • the thumb nearest: over the pole's top, its tip on the index; one nail, on the thumb;
 *   • the fingers behind: crescents that grow out of nothing and fade back (no knuckle steps), each its own width;
 *   • the wrist narrower than the fist; to the page placed, scaled, turned and mirrored.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const PU = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEndUnder.tsx'));
const PE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEnd.tsx'));
const FSm = R(await import('../src/dev/frontBoomStudy.tsx'));
const BV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/BoomV2.tsx'));
const BG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/boomGrip.ts'));

type Pt = { u: number; v: number };
type V3 = { x: number; y: number; z: number };
type Ell = { c: Pt; rx: number; ry: number; rot: number };
const A = PU.POLE_HAND_END_UNDER as unknown as {
  index: Pt[];
  middle: Pt[];
  ring: Pt[];
  little: Pt[];
  body: Pt[];
  thumb: Pt[];
  thumbNail: Pt[];
  sleeve: Pt[];
  cuff: Ell;
  knuckles: Pt[];
  bend: Pt;
  thumbTip: Pt;
  heel: Pt;
  wrist: Pt;
} & Record<string, unknown>;
const r = PU.POLE_R_UNDER as number;
const AXIS = PU.POLE_END_UNDER_AXIS as Pt;
const FORE = PU.POLE_END_UNDER_FORE as Pt;
const SEC = PU.POLE_END_UNDER_SECTION as Ell;
const K = PU.POLE_END_UNDER_FORESHORTEN as number;
const NEAR = PU.POLE_END_UNDER_NEAR as number;
const at = PU.poleEndUnderAxisAt as (a: number) => Pt;
const toPage = PU.poleHandEndUnderToPage as (o: { x: number; y: number; s: number; rot?: number; mirror?: boolean }) => (q: Pt) => Pt;
const axisOnPage = PU.poleHandEndUnderAxisOnPage as (o: { rot?: number; mirror?: boolean }) => Pt;
const foreOnPage = PU.poleHandEndUnderForeOnPage as (o: { rot?: number; mirror?: boolean }) => Pt;
const deg = (x: number) => (x * 180) / Math.PI;
/** A page angle difference folded into (−180°, 180°]. */
const fold = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const ang = (p: Pt) => deg(Math.atan2(p.v, p.u));
/** Along the pole's near axis on the page, and across it (+ = the BELOW side: the axis turned a quarter counter-clockwise
 *  on the page, y down — the side the palm and the wrist are on). */
const along = (p: Pt) => p.u * AXIS.u + p.v * AXIS.v;
const below = (p: Pt) => p.u * AXIS.v - p.v * AXIS.u;
function inside(q: Pt[], p: Pt): boolean {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const a = q[i];
    const b = q[j];
    if (a.v > p.v !== b.v > p.v && p.u < ((b.u - a.u) * (p.v - a.v)) / (b.v - a.v) + a.u) c = !c;
  }
  return c;
}
/** Under the near pole as drawn by default (0 … NEAR mm along it, its round end included), grown by `m` mm. */
function underNear(p: Pt, m = 0): boolean {
  const a = along(p);
  const x = below(p);
  const end = NEAR * K;
  if (a >= 0 && a <= end && Math.abs(x) <= r + m) return true;
  const rx = r * Math.cos(PU.POLE_END_UNDER_TILT as number) + m;
  const d = (a - end) / rx;
  return Math.abs(x) <= (r + m) * Math.sqrt(Math.max(0, 1 - d * d)) && Math.abs(a - end) <= rx;
}

/* ── the rig (read here, not copied): each B10 left hand that keeps this view ── */
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const neg = (a: V3): V3 => ({ x: -a.x, y: -a.y, z: -a.z });
type LeftArm = { label: string; F2: Pt; E2: Pt; N2: Pt; S2: Pt; foreFromNear: number; camOff: number; thumbEnd: boolean; turn: number; under: boolean };
function leftArm(label: string, rig: unknown, who: unknown): LeftArm {
  const B = BV.boomPlans(rig, who, 'side');
  const a = (B.arms as { hand: { arm: { side: string; fist: V3; elbow: V3; under?: boolean } }; arm: { shoulder: Pt } }[]).find((x) => x.hand.arm.side === 'L')!;
  const arm = a.hand.arm;
  const toward = B.vs.toward as V3;
  const f = BG.boomHandFace(B.o, arm, B.poleDir, toward);
  const near = dot(B.poleDir, toward) >= 0 ? B.poleDir : neg(B.poleDir);
  const F2 = B.vs.proj(arm.fist) as Pt;
  const E2 = B.vs.proj(arm.elbow) as Pt;
  const P2 = B.vs.proj(add(arm.fist, near)) as Pt;
  const N2 = { u: P2.u - F2.u, v: P2.v - F2.v };
  const te = dot(f.thumb, toward);
  return { label, F2, E2, N2, S2: a.arm.shoulder, foreFromNear: fold(ang({ u: E2.u - F2.u, v: E2.v - F2.v }) - ang(N2)), camOff: deg(Math.acos(Math.min(1, Math.abs(te)))), thumbEnd: te > 0, turn: f.turn, under: !!arm.under };
}
const rigs = FSm.SIDE_RIGS as { key: string; title: string; rig: unknown; who: unknown }[];
const WHO = rigs.find((x) => x.key === 'b10')!.who;
const START = leftArm('B10 overhead (start)', rigs.find((x) => x.key === 'b10')!.rig, WHO);
const live = (d: number, e: number) => {
  const q = (e * Math.PI) / 180;
  const front = { x: d * Math.cos(q), y: -d * Math.sin(q), z: 0 };
  const l = Math.hypot(front.x, front.y);
  const rig = FSm.b10LiveRig(front, { x: -front.x / l, y: -front.y / l, z: 0 });
  return rig ? leftArm(`B10 dragged ${d} mm at ${e}°`, rig, WHO) : null;
};

/** As BoomV2 places an end-on drawing (poleSideArm tryEnd + straightArm), for this drawing mirrored on a left arm. */
function place(L: LeftArm) {
  const ax = axisOnPage({ rot: 0, mirror: true });
  const rot = Math.atan2(L.N2.v, L.N2.u) - Math.atan2(ax.v, ax.u);
  const g = toPage({ x: 0, y: 0, s: 1, rot, mirror: true })(PU.POLE_END_UNDER_GRIP as Pt);
  const T = toPage({ x: L.F2.u - g.u, y: L.F2.v - g.v, s: 1, rot, mirror: true });
  const W = T(PU.POLE_HAND_END_UNDER_CUFF as Pt);
  const o0 = T({ u: 0, v: 0 });
  const f1 = T({ u: FORE.u * 100, v: FORE.v * 100 });
  const fe = { u: (f1.u - o0.u) / 100, v: (f1.v - o0.v) / 100 };
  const re = { u: L.E2.u - L.F2.u, v: L.E2.v - L.F2.v };
  const lean = Math.abs(fold(ang(fe) - ang(re)));
  const len = Math.hypot(L.E2.u - W.u, L.E2.v - W.v);
  const upper = (t: number) => Math.hypot(W.u + fe.u * t - L.S2.u, W.v + fe.v * t - L.S2.v);
  let t = -1;
  for (let k = len; k >= len * 0.6; k -= 2)
    if (upper(k) <= 300) {
      t = k;
      break;
    }
  const elbowV = W.v + fe.v * (t > 0 ? t : len);
  return { lean, reaches: t > 0, upper: upper(t > 0 ? t : len), elbowBelow: elbowV >= W.v + 40 };
}

describe('the pole hand end-on from the thumb end, supporting the pole from below (poleHandEndUnder)', () => {
  it('the art exists as authored points; the exports mirror poleHandEndLittleBack; the same tilt', () => {
    for (const q of [A.index, A.middle, A.ring, A.little, A.body, A.thumb, A.sleeve]) {
      assert.ok(Array.isArray(q) && q.length >= 8);
      for (const p of q) assert.ok(Number.isFinite(p.u) && Number.isFinite(p.v));
    }
    assert.equal(r, 15);
    for (const k of ['PoleHandEndUnder', 'poleHandEndUnderOutline', 'poleHandEndUnderToPage', 'poleHandEndUnderAxisOnPage', 'poleHandEndUnderForeOnPage', 'poleEndUnderAxisAt'])
      assert.equal(typeof PU[k as keyof typeof PU], 'function', k);
    assert.ok(Math.abs(SEC.rx / SEC.ry - Math.cos(PU.POLE_END_UNDER_TILT as number)) < 1e-9);
    assert.ok(Math.abs((PU.POLE_END_UNDER_TILT as number) - (PE.POLE_END_TILT as number)) < 1e-12, 'the same tilt as poleHandEnd');
    assert.equal(NEAR, 70, "B10's pole ends about 70 mm past the index side (110 past the grip)");
    assert.ok(Math.abs(along(PU.POLE_END_UNDER_GRIP as Pt) + 40 * K) < 1e-9);
  });

  it('the rig: B10’s start left hand is UNDERHAND, seen from the THUMB end 27° off the pole, its forearm −9.2° from the near pole', () => {
    assert.equal(START.under, true);
    assert.equal(START.thumbEnd, true);
    assert.ok(Math.abs(START.camOff - 26.8) < 1, `camera ${START.camOff.toFixed(1)}° off the pole`);
    assert.ok(Math.abs(START.foreFromNear - -9.2) < 1, `left forearm − near pole ${START.foreFromNear.toFixed(1)}°`);
  });

  it('the forearm leaves 8° clockwise from the near pole (mirrored −8°): fits B10’s start and every dragged thumb-end pose', () => {
    const mine = fold(ang(FORE) - ang(AXIS));
    assert.ok(Math.abs(mine - 8) < 1e-9, `forearm − near axis ${mine.toFixed(1)}°`);
    assert.ok(Math.abs(mine - deg(PU.END_UNDER_FORE_FROM_NEAR as number)) < 1e-9);
    const left = fold(ang(foreOnPage({ mirror: true })) - ang(axisOnPage({ mirror: true })));
    assert.ok(Math.abs(left - -8) < 1e-9, `left hand ${left.toFixed(1)}°`);
    assert.ok(Math.abs(fold(left - START.foreFromNear)) < 3, 'B10 start within 3°');
    // every dragged pose where the camera stays at the thumb end and the hand is seen end-on (B10's drag range)
    // B10's drag grid (the mic 600–1000 mm out, 20–60° up): every pose seen from the thumb end, end-on. The rig's left
    // forearm swings −42.8° … +60° there, so no one drawing fits them all: this one fits the start and the whole main
    // zone (750 mm out and more at 30° up and more; 650–700 mm higher up), and misses only the mic close in and low
    // (≤ 700 mm at ≤ 35°, 750 mm at ≤ 25°) and the camera within 9° of the pole (both other pictures).
    let fit = 0;
    const missed: string[] = [];
    for (const d of [600, 650, 700, 750, 800, 850, 900, 950, 1000])
      for (const e of [20, 25, 30, 35, 40, 45, 50, 55, 60]) {
        const L = live(d, e);
        if (!L || !L.thumbEnd || L.turn <= 45) continue;
        const off = Math.abs(fold(left - L.foreFromNear));
        if (off < 40) {
          fit++;
          assert.ok(place(L).lean < 40, `${L.label}: placed within 40°`);
        } else missed.push(`${d}/${e}`);
        if (L.camOff >= 9 && !(d <= 700 && e <= 35) && !(d <= 750 && e <= 25)) assert.ok(off < 40, `${L.label}: ${L.foreFromNear.toFixed(1)}° (${off.toFixed(1)}° off)`);
      }
    assert.ok(fit >= 30, `${fit} dragged thumb-end poses fit (missed: ${missed.join(', ')})`);
    // B10 raised over the head / dragged below the mouth: the little-finger end — other views
    for (const [k, title] of [['raised', 'raised over the head'], ['below', 'dragged below the mouth']] as const) {
      const rg = rigs.find((x) => x.title.includes(title));
      assert.ok(rg, k);
      assert.equal(leftArm(k, rg!.rig, WHO).thumbEnd, false, `${k}: seen from the little-finger end`);
    }
  });

  it('placed on B10’s start left arm as BoomV2 places an end-on drawing: the straight wrist reaches, the elbow below the hand', () => {
    const p = place(START);
    assert.ok(p.lean < 15, `forearm ${p.lean.toFixed(1)}° off the arm's`);
    assert.ok(p.reaches, `upper arm ${p.upper.toFixed(0)} mm on the page`);
    assert.ok(p.elbowBelow, 'the elbow below the hand');
  });

  it('the hand UNDER the pole: the wrist, the heel and the forearm on the below side of the pole’s line; the forearm drops away', () => {
    // the wrist's middle 25+ mm below the axis (the rig: 16 mm, opened so the pole never touches it)
    assert.ok(below(A.wrist) > 25, `wrist ${below(A.wrist).toFixed(1)} mm below the axis`);
    assert.ok(below(A.heel) > 0 && along(A.heel) > NEAR * K, 'the heel below the pole, beyond its end');
    // the wrist begins past the pole's end (B10's butt), so the forearm going away from it never meets the pole
    const end = NEAR * K + SEC.rx;
    assert.ok(along(A.wrist) > end + 10 && along(FORE) > 0.9, 'the wrist past the pole’s end; the forearm away from the fist');
    // the index's bend and the thumb's tip on the TOP side (over the pole)
    assert.ok(below(A.bend) < -r && below(A.thumbTip) < -r, 'the finger and the thumb close over the top');
  });

  it('the pole INSIDE the hand: skin all round its section; the near pole never over the wrist, the forearm or the sleeve', () => {
    const shapes = [A.body, A.index, A.thumb];
    for (let k = 0; k < 16; k++) {
      const t = (k * Math.PI) / 8;
      const e = { u: Math.cos(t) * (SEC.rx + 4), v: Math.sin(t) * (SEC.ry + 4) };
      const c = Math.cos(SEC.rot);
      const s = Math.sin(SEC.rot);
      const p = { u: e.u * c - e.v * s, v: e.u * s + e.v * c };
      assert.ok(shapes.some((q) => inside(q, p)), `skin round the section at ${(t * 180) / Math.PI}°`);
    }
    // the wrist and the forearm: every point of the body from the wrist on, and the sleeve, clear of the near pole (2 mm)
    const forearm = A.body.filter((p) => along(p) > 50);
    assert.ok(forearm.length >= 8);
    for (const p of [...forearm, ...A.sleeve, A.wrist, A.cuff.c]) assert.ok(!underNear(p, 2), `(${p.u.toFixed(1)}, ${p.v.toFixed(1)}) clear of the pole`);
    // the far pole hidden in the fist, out past the fingers' bends (top right)
    assert.ok([A.body, A.index].some((q) => inside(q, at(-40))), 'inside the hand at the middle of the fist');
    for (const a of [-160, -240]) assert.ok(![A.body, A.index, A.middle, A.ring, A.little, A.thumb].some((q) => inside(q, at(a))), `out past the fingers at ${a} mm`);
  });

  it('the thumb is the thickest digit (owner: "thumb is too skinny"): ≈ 21 mm across its base segment, ≈ 18 mm through its end segment', () => {
    /** The thumb's width along the line through `p` in direction `d`: its outermost crossings. */
    const chord = (q: Pt[], p: Pt, d: Pt) => {
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
    };
    // the base segment, where it leaves its mound (across it, level with the pole's near stretch; its inner part behind
    // the pole): was 17.9 mm
    const base = chord(A.thumb, { u: -36, v: 8 }, { u: 1, v: 0 });
    assert.ok(base >= 20 && base <= 23.5, `base segment ${base.toFixed(1)} mm`);
    // the end segment, through it square to its length (it runs about 19° above the page's horizontal): was ≈ 10 mm
    const n = { u: 0.324, v: 0.946 };
    for (const p of [{ u: -24, v: -24 }, { u: -18, v: -26 }]) {
      const w = chord(A.thumb, p, n);
      assert.ok(w >= 17 && w <= 21, `end segment ${w.toFixed(1)} mm deep at (${p.u}, ${p.v})`);
    }
    // a full, blunt tip: just short of the tip still at least 10 mm deep (no taper to a point)
    const tipW = chord(A.thumb, { u: -8, v: -27 }, n);
    assert.ok(tipW >= 10, `the tip ${tipW.toFixed(1)} mm deep`);
    // the strip of index still shows between the pole and the thumb (the thumb reads as a separate digit)
    const strip = { u: -20.5, v: -1 };
    assert.ok(inside(A.index, strip) && !inside(A.thumb, strip) && !underNear(strip), 'the index between the pole and the thumb');
  });

  it('the thumb nearest: over the pole’s top, its tip on the index; one nail, on the thumb’s end segment', () => {
    assert.ok(inside(A.thumb, A.thumbTip) || A.thumb.some((p) => Math.hypot(p.u - A.thumbTip.u, p.v - A.thumbTip.v) < 1e-9));
    assert.ok(inside(A.index, { u: A.thumbTip.u - 3, v: A.thumbTip.v }), 'its tip lies on the index');
    const nc = { u: A.thumbNail.reduce((s, p) => s + p.u, 0) / A.thumbNail.length, v: A.thumbNail.reduce((s, p) => s + p.v, 0) / A.thumbNail.length };
    assert.ok(inside(A.thumb, nc), 'the nail on the thumb');
    for (const p of A.thumbNail) assert.ok(inside(A.thumb, p), 'wholly on the thumb');
    assert.ok(below(nc) < -r, 'on the end segment, over the pole');
    const nails = Object.keys(A).filter((k) => /nail/i.test(k));
    assert.deepEqual(nails, ['thumbNail'], 'no other nail');
  });

  it('the fingers behind: crescents that grow out of nothing and fade back, each its own width (no knuckle steps)', () => {
    // (how far each finger's drawn outer edge stands out past the outline of the finger in front)
    const seg = (p: Pt, a: Pt, b: Pt) => {
      const dx = b.u - a.u;
      const dy = b.v - a.v;
      const t = Math.max(0, Math.min(1, ((p.u - a.u) * dx + (p.v - a.v) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(p.u - a.u - dx * t, p.v - a.v - dy * t);
    };
    const toPoly = (p: Pt, q: Pt[]) => Math.min(...q.map((a, i) => seg(p, a, q[(i + 1) % q.length])));
    const edges = A.behindEdges as unknown as Pt[][];
    const width = (e: Pt[], front: Pt[]) => Math.max(...e.filter((p) => !inside(front, p)).map((p) => toPoly(p, front)));
    const wm = width(edges[0], A.index);
    const wr = width(edges[1], A.middle);
    const wl = width(edges[2], A.ring);
    assert.ok(wm > wr && wr > wl && wl > 0.5, `widths ${wm.toFixed(1)} / ${wr.toFixed(1)} / ${wl.toFixed(1)}`);
    assert.ok(Math.abs(wm - wr) > 1 && Math.abs(wr - wl) > 1, 'no two alike');
    // each starts and ends inside the finger in front (it grows out from under it: no step, no base of its own)
    for (const [q, front] of [[A.middle, A.index], [A.ring, A.middle], [A.little, A.ring]] as const) {
      assert.ok(inside(front, q[0]), 'starts under the finger in front');
    }
    // the body's back edge starts on the index's knuckle curve: the hand runs on into the finger
    const k = A.knuckles[0];
    assert.ok(A.body.some((p) => Math.hypot(p.u - k.u, p.v - k.v) < 6), 'the back of the hand meets the knuckle');
  });

  it('the wrist narrower than the fist; the cuff toward the forearm; to the page placed, scaled, turned and mirrored', () => {
    // widths across the forearm's direction
    const acrossF = (p: Pt) => p.u * -FORE.v + p.v * FORE.u;
    const alongF = (p: Pt) => p.u * FORE.u + p.v * FORE.v;
    const band = (lo: number, hi: number) => A.body.filter((p) => alongF(p) > lo && alongF(p) < hi).map(acrossF);
    const wr = band(alongF(A.wrist) - 6, alongF(A.wrist) + 6);
    const hand = [...A.body, ...A.thumb, ...A.index].map(acrossF);
    assert.ok(wr.length >= 2);
    assert.ok(Math.max(...wr) - Math.min(...wr) < (Math.max(...hand) - Math.min(...hand)) * 0.6, 'the wrist narrower');
    assert.ok(alongF(A.cuff.c) > alongF(A.wrist), 'the cuff past the wrist');
    const p = toPage({ x: 100, y: 50, s: 2 })(A.bend);
    assert.ok(Math.abs(p.u - (100 + 2 * A.bend.u)) < 1e-9 && Math.abs(p.v - (50 + 2 * A.bend.v)) < 1e-9);
    const m = toPage({ x: 100, y: 50, s: 2, mirror: true })(A.bend);
    assert.ok(Math.abs(m.u - (100 - 2 * A.bend.u)) < 1e-9 && Math.abs(m.v - p.v) < 1e-9);
    const ax = axisOnPage({ mirror: true });
    assert.ok(Math.abs(ax.u + AXIS.u) < 1e-9 && Math.abs(ax.v - AXIS.v) < 1e-9);
    const fo = foreOnPage({ rot: 0.3 });
    assert.ok(Math.abs(fold(ang(fo) - (ang(FORE) + deg(0.3)))) < 1e-9);
  });
});
