/**
 * THE WOODWIND PLAYERS' HANDS ON THE KEYS (figure pass 3, owner 2026-10-15:
 * "check that the hand is correctly positioned, placed, bent, fingers and
 * digits accounted for"). Pure: no React, no Skia — the tests measure the
 * very hands WindArt paints (PlayerFigure.drawHand3).
 *
 * Each hand is the shared adult hand (players/handModel.ts) placed by the
 * posture (windPosture.ts: the wrist, the way the hand points, the way its
 * back faces, the side its thumb is on — the same joints the keep-outs use)
 * and turned about its wrist until every pad lands on what that finger plays:
 *   • LEFT HAND ABOVE THE RIGHT (nearest the player's end) on every one of
 *     them; the index nearest the player's end, then the middle and the ring
 *     finger, the little finger on its own key (the flute's G♯, the clarinet's
 *     and oboe's left little-finger keys);
 *   • FLUTE and PICCOLO: the left hand nearest the head joint, its palm turned
 *     toward the player, the flute resting on the base of the index finger
 *     (the knuckle row in front of and under the tube), the fingers rising
 *     and curling back over the top onto their keys, the thumb under the
 *     tube on its thumb key; the right hand behind the tube, its fingers
 *     arching forward over the top onto the lower keys, the thumb under the
 *     tube behind the index and middle fingers, the little finger on the D♯
 *     key;
 *   • CLARINET, BASS CLARINET, OBOE: each palm on its own side of the tube,
 *     the fingers wrapping round the front onto the rings and plates, the
 *     left thumb on the thumb hole / register (octave) key behind, the right
 *     thumb under the thumb rest behind;
 *   • BASSOON: the left hand on the wing joint, its thumb on the wing joint's
 *     keys behind; the right hand on the boot, its fingers on the boot's
 *     finger holes, its thumb on the boot's keys behind.
 * WHERE A FINGER GOES — the drawn holes and keys sit at the semitone rule's
 * places (windSpec.ts, a simplified acoustic picture). Where those fall
 * within a hand's span the pads land on them (a padded cup anywhere on its
 * top, a ring or an open hole covered by the pad's centre). Where the rule
 * spreads the holes wider than any hand (the bass clarinet's plates, the
 * bassoon's finger holes, the oboe's right little-finger key, the thumbs'
 * keys behind) the finger plays a TOUCH the art draws under it — the real
 * instrument's finger plate, finger hole, spatula, thumb key or thumb rest.
 * Every hold dimension is a drawing default (no source gives a player's
 * hand on the keys).
 */
import { fitHand, handFrame, handOn, h3, jointBendsDeg, LIMITS, THUMB_REST, thumbJoints, wristBendDeg, type DigitGoal, type HandFrame, type HandSkeleton, type ThumbPose, type V3 } from '../players/handModel.ts';
import { around, bassClarinetLayout, bassoonAxes, bassoonLayout, BSN, fluteLayout, frameAt, straightReedLayout, type HandPose, type Layout } from './windPosture.ts';
import { BASSOON, bassClarinetSpec, CLARINET, fluteSpec, holeR, holeS, OBOE, PICCOLO, radiusAt, type WindSpec } from './windSpec.ts';

/** What a digit plays: a spec hole (`k`) or a touch at s, `ang`° round from the key side. */
export type TouchKind = 'key' | 'ring' | 'open' | 'plate' | 'spatula' | 'thumbKey' | 'rest';
export type Touch = {
  s: number;
  ang: number;
  kind: TouchKind;
  /** The spec's tone hole it is (its cup / ring / hole is already drawn), or none: a touch the art adds. */
  k?: number;
  /** Its top's distance from the tube's axis (default: the tube's radius + the kind's lift). */
  out?: number;
  /** A touch the art adds may sit where the digit falls: within `ds` mm and
   *  `dang`° of here (its distance from the axis at an angle: `outAt`). */
  roam?: { ds: number; dang: number; outAt?: (ang: number) => number };
};
export type DigitPlay = Touch | { curl: number };
export type HoldPlan = { fingers: DigitPlay[]; thumb: Touch };

const isTouch = (g: DigitPlay): g is Touch => typeof (g as Touch).s === 'number';
const isV3 = (g: unknown): g is V3 => typeof (g as V3).x === 'number' && typeof (g as V3).z === 'number';

/** How far a touch's top stands off the tube's surface (mm). */
const LIFT: Record<TouchKind, number> = { open: 0, ring: 3.4, key: 4.6, plate: 4.2, spatula: 6, thumbKey: 4, rest: 0 };
/** A pad pressing a key: its centre ≈ 7 mm over what it presses. */
export const PAD = 7;

const isSimpleFlute = (spec: WindSpec) => spec.id === 'flute' && spec.holes.some((h) => h.kind === 'open');
const hole = (spec: WindSpec, k: number): Touch => {
  const h = spec.holes.find((q) => q.k === k)!;
  return { s: holeS(spec, k), ang: h.side, kind: h.kind, k };
};

/** The touch's top centre and its outward direction. */
export function touchAt(L: Layout, t: Touch): { p: V3; m: V3 } {
  const r = t.out ?? radiusAt(L.spec, t.s) + LIFT[t.kind];
  const f = frameAt(L, t.s);
  const a = (t.ang * Math.PI) / 180;
  const m = h3.unit(h3.add(h3.mul(f.n, Math.cos(a)), h3.mul(f.b, Math.sin(a))));
  return { p: around(L, t.s, t.ang, r), m };
}

/** The touch's drawn size (radius, mm). */
export function touchR(spec: WindSpec, t: Touch): number {
  if (t.k !== undefined) return holeR(spec, t.k) + (t.kind === 'open' ? 0 : 2.2);
  return { key: 8, ring: 8, open: spec.id === 'bassoon' ? 5.5 : 4.5, plate: spec.id === 'bassClarinet' ? 11 : 8, spatula: 7, thumbKey: 7, rest: 0 }[t.kind];
}

/**
 * The fingers' and thumbs' places for an instrument (index … little, thumb).
 * The keys each finger closes are the real instruments' (Boehm flute: left
 * C♯·B·A + G♯, thumb B; right G·E·D + D♯; clarinet: the three rings of each
 * joint; oboe: the three rings or plates of each joint), on this spec's
 * drawn holes.
 */
export function holdPlan(L: Layout, side: 'L' | 'R'): HoldPlan {
  const spec = L.spec;
  const H = (k: number) => hole(spec, k);
  // A side of the tube toward a hand: the key side's angle whose direction
  // points to the player's left (+x) for the left hand.
  const toward = (s: number, deg: number) => {
    const f = frameAt(L, s);
    const a = (deg * Math.PI) / 180;
    const m = h3.add(h3.mul(f.n, Math.cos(a)), h3.mul(f.b, Math.sin(a)));
    return (m.x >= 0) === (side === 'L') ? deg : -deg;
  };
  const back = (s: number, deg = 180) => toward(s, deg);
  switch (spec.id) {
    case 'flute': {
      if (isSimpleFlute(spec)) {
        // Six open finger holes (left 11 · 9 · 7, right 5 · 4 · 2); the little
        // fingers on the G♯ and E♭ keys' long levers below the ring fingers'
        // holes (the cups sit higher up the tube); no thumb keys: the thumbs
        // steady the tube from below.
        if (side === 'L') return { fingers: [H(11), H(9), H(7), { s: holeS(spec, 7) + 22, ang: 48, kind: 'spatula' }], thumb: { s: (holeS(spec, 10) + holeS(spec, 9)) / 2, ang: -150, kind: 'rest', out: radiusAt(spec, 330) + PAD } };
        return { fingers: [H(5), H(4), H(2), { s: holeS(spec, 2) + 22, ang: -30, kind: 'spatula' }], thumb: { s: (holeS(spec, 5) + holeS(spec, 4)) / 2, ang: -172, kind: 'rest', out: radiusAt(spec, 480) + PAD } };
      }
      // The little fingers on their levers beside the G♯ and D♯ cups (the
      // spatulas the art draws, joined to those cups).
      if (side === 'L') return { fingers: [H(13), H(11), H(9), { s: holeS(spec, 8) - 2, ang: 52, kind: 'spatula' }], thumb: { s: holeS(spec, 12) + 4, ang: -140, kind: 'thumbKey' } };
      return { fingers: [H(7), H(5), H(4), { s: holeS(spec, 3) - 6, ang: -30, kind: 'spatula' }], thumb: { s: (holeS(spec, 7) + holeS(spec, 6)) / 2, ang: -170, kind: 'rest', out: radiusAt(spec, 430) + PAD } };
    }
    case 'piccolo': {
      if (side === 'L') return { fingers: [H(11), H(9), H(7), H(6)], thumb: { s: holeS(spec, 10) + 3, ang: -140, kind: 'thumbKey' } };
      return { fingers: [H(5), H(3), H(2), H(1)], thumb: { s: (holeS(spec, 5) + holeS(spec, 4)) / 2, ang: -170, kind: 'rest', out: radiusAt(spec, 210) + PAD } };
    }
    case 'clarinet': {
      // Left: the upper joint's rings (14 · 12 · 10), the little finger on its
      // keys at the joint's foot, the thumb on the thumb hole behind. Right:
      // the lower joint's rings (7 · 5 · 3), the little finger on its keys
      // near the joint's foot, the thumb under the thumb rest behind.
      if (side === 'L') return { fingers: [H(14), H(12), H(10), { s: holeS(spec, 9) + 4, ang: toward(366, 62), kind: 'spatula' }], thumb: { s: holeS(spec, 14) - 6, ang: 180, kind: 'thumbKey' } };
      return { fingers: [H(7), H(5), H(3), { s: holeS(spec, 3) + 26, ang: toward(530, 62), kind: 'spatula' }], thumb: { s: holeS(spec, 7) + 16, ang: 180, kind: 'rest', out: radiusAt(spec, 420) + PAD } };
    }
    case 'oboe': {
      if (side === 'L') return { fingers: [H(15), H(13), H(11), { s: holeS(spec, 11) + 24, ang: toward(284, 64), kind: 'spatula' }], thumb: { s: holeS(spec, 15) - 8, ang: 180, kind: 'thumbKey' } };
      return { fingers: [H(8), H(6), H(4), { s: holeS(spec, 4) + 24, ang: toward(412, 64), kind: 'spatula' }], thumb: { s: holeS(spec, 8) + 14, ang: 180, kind: 'rest', out: radiusAt(spec, 330) + PAD } };
    }
    case 'bassClarinet': {
      // The bass clarinet's six finger PLATES (covered keys over the main
      // holes), ≈ 40 mm apart along each joint — within a hand's span; the
      // semitone-rule rings stay drawn where the acoustic picture puts them.
      const lo = spec.pieces.find((p) => p.id === 'lower')!;
      const l0 = L.handL.s - 14;
      const r0 = lo.s0 + 22;
      const plate = (s: number): Touch => ({ s, ang: 0, kind: 'plate' });
      if (side === 'L') return { fingers: [plate(l0), plate(l0 + 40), plate(l0 + 80), { s: l0 + 118, ang: toward(l0 + 118, 58), kind: 'spatula' }], thumb: { s: l0 - 8, ang: 180, kind: 'thumbKey' } };
      return { fingers: [plate(r0), plate(r0 + 42), plate(r0 + 84), { s: r0 + 124, ang: toward(r0 + 124, 58), kind: 'spatula' }], thumb: { s: r0 + 14, ang: 180, kind: 'rest', out: radiusAt(spec, r0) + PAD } };
    }
    case 'bassoon': {
      // The wing joint's three finger holes (left) on its front face, turned
      // toward its open side (away from the long joint, art fix 2026-10-16:
      // the wing lies beside the long joint, nearest the left hand); the
      // boot's three (right) on the boot's front face.
      const BOOT_FRONT = 66;
      if (side === 'L') {
        const s0 = L.handL.s - 34;
        const a = toward(s0, 45);
        const fingers: DigitPlay[] = [0, 34, 68].map((d): Touch => ({ s: s0 + d, ang: a, kind: 'open' }));
        fingers.push({ s: s0 + 92, ang: toward(s0 + 92, 72), kind: 'spatula' });
        return { fingers, thumb: { s: s0 + 20, ang: back(s0, 165), kind: 'thumbKey', roam: { ds: 30, dang: 40 } } };
      }
      const s0 = L.handR.s - 36;
      const fingers: DigitPlay[] = [0, 36, 72].map((d): Touch => ({ s: s0 + d, ang: 0, kind: 'open', out: BOOT_FRONT }));
      fingers.push({ s: s0 + 104, ang: toward(s0 + 104, 18), kind: 'spatula', out: BOOT_FRONT + 2 });
      // The thumb on the boot's back, toward its right-hand edge: on the boot's
      // surface (≈ 44 mm round the line midway between the bores, 22.5 mm from
      // this bore toward the long joint's) at that angle.
      const ta = toward(s0 + 30, 165);
      const ax = bassoonAxes();
      const off = h3.mul(h3.sub(ax.L(0), ax.W(0)), 0.5);
      const fb = frameAt(L, s0 + 30);
      const outAt = (ang: number) => {
        const a = (ang * Math.PI) / 180;
        const k = h3.dot(h3.add(h3.mul(fb.n, Math.cos(a)), h3.mul(fb.b, Math.sin(a))), off);
        return k + Math.sqrt(Math.max(0, k * k - h3.dot(off, off) + 44 ** 2)) + 2;
      };
      return { fingers, thumb: { s: s0 + 30, ang: ta, kind: 'thumbKey', out: outAt(ta), roam: { ds: 40, dang: 60, outAt } } };
    }
  }
}

/** The pad's target for a touch (its top, then a pad's half-thickness out). */
export function padTarget(L: Layout, t: Touch): V3 {
  const { p, m } = touchAt(L, t);
  return t.kind === 'rest' ? p : h3.add(p, h3.mul(m, PAD));
}

/** The touches the art draws itself (not a spec hole the art already draws). */
export function addedTouches(L: Layout): Touch[] {
  const out: Touch[] = [];
  for (const side of ['L', 'R'] as const) {
    const p = holdPlan(L, side);
    for (const g of [...p.fingers, p.thumb]) if (isTouch(g) && g.k === undefined && g.kind !== 'rest') out.push(g);
  }
  return out;
}

/** The hand's starting frame from the posture (its wrist, the way it points, its back, its thumb). */
export function startFrame(hp: HandPose): HandFrame {
  return handFrame(hp.wrist, hp.dir, hp.dorsal ?? { x: 0, y: 0, z: 1 }, hp.thumbSide ?? { x: 0, y: -1, z: 0 });
}

/** The solids near a hand (capsules: the tube about s; the bassoon's long
 *  joint beside its wing joint, and its boot round both bores). */
type Capsule = { a: V3; b: V3; r: (t: number) => number };
const solidsCache = new WeakMap<Layout, Map<number, Capsule[]>>();
function solidsNear(L: Layout, s: number): Capsule[] {
  let m = solidsCache.get(L);
  if (!m) {
    m = new Map();
    solidsCache.set(L, m);
  }
  const hit = m.get(s);
  if (hit) return hit;
  const out: Capsule[] = [];
  const a = frameAt(L, s - 160).p;
  const b = frameAt(L, s + 160).p;
  out.push({ a, b, r: (t) => radiusAt(L.spec, s - 160 + 320 * t) });
  // The player's chest (two capsules ≈ 112 mm deep each side of the
  // breastbone): no hand or wrist inside the body.
  const B = L.body;
  const midZ = (B.shoulderL.z + B.shoulderR.z + B.hipL.z + B.hipR.z) / 4;
  for (const x of [-55, 55]) out.push({ a: { x, y: B.neck.y + 60, z: midZ }, b: { x, y: (B.hipL.y + B.hipR.y) / 2 - 60, z: midZ }, r: () => 112 });
  if (L.spec.id === 'bassoon') {
    const ax = bassoonAxes();
    // The long joint (in front of the wing joint) and the boot (a body ≈ 44 mm
    // round the line between its two bores) — as WindArt draws them.
    out.push({ a: ax.L(BSN.bootTop), b: ax.L(BSN.bellTop), r: () => 19.5 });
    const mid = (h: number) => h3.mul(h3.add(ax.L(h), ax.W(h)), 0.5);
    out.push({ a: mid(0), b: mid(BSN.bootTop), r: () => 44 });
  }
  m.set(s, out);
  return out;
}

/** How deep a point is inside the solids near the hand (mm; > 0 inside). */
function inTube(L: Layout, s: number, p: V3, rPart: number): number {
  let worst = -Infinity;
  for (const c of solidsNear(L, s)) {
    const d = h3.sub(c.b, c.a);
    const t = Math.max(0, Math.min(1, h3.dot(h3.sub(p, c.a), d) / h3.dot(d, d)));
    const q = h3.add(c.a, h3.mul(d, t));
    worst = Math.max(worst, c.r(t) + rPart - h3.len(h3.sub(p, q)));
  }
  return worst;
}

export type WindHand = { sk: HandSkeleton; elbow: V3; plan: HoldPlan; s: number; /** Each finger's final pad target (null: a curled finger). */ pads: (V3 | null)[]; /** Where the thumb plays (its touch as placed). */ thumbTouch: Touch };

/** What a finger plays, for the fit: its pad's target (and how far the target
 *  may slide across what it presses — `m` its outward normal), or a curl. */
export type PadGoal = { target: V3; m: V3; max: number } | { curl: number };
const isPad = (g: PadGoal): g is { target: V3; m: V3; max: number } => 'target' in g;

/**
 * THE GENERIC FIT (the woodwinds' and the saxophones'): a hand from a starting
 * frame turned about its wrist (a reviewer's sweep may also slide it) until
 * the pads land, the wrist within 64° of the forearm (from `elbow`), the
 * fingers in a natural curl, nothing of the hand inside a solid (`depth`: how
 * deep a point of radius r lies inside; > 0 inside). Returns the hand with the
 * thumb at rest, each finger's final target, and a thumb solver for the same
 * frame (never through a solid).
 */
export function fitHold(o: { frame: HandFrame; elbow: V3; fingers: PadGoal[]; thumb: V3; depth: (p: V3, r: number) => number; slide?: number; turn?: number }) {
  const f0 = o.frame;
  const base = o.fingers.map((g) => (isPad(g) ? g.target : null));
  let fingers: DigitGoal[] = o.fingers.map((g) => (isPad(g) ? g.target : { curl: g.curl, abd: 0.1 }));
  const thumb = o.thumb;
  const x0 = f0.x;
  const z0 = f0.z;
  const turn = o.turn ?? 900;
  // Nothing of the palm, the knuckles or a finger's bones inside a solid (a
  // finger reaches round the tube, never through it).
  const inside = (sk: HandSkeleton, withThumb: boolean) => {
    let c = 0;
    const g = sk.frame;
    for (const [x, y] of [[96, -27], [100, -8.5], [96, 9.5], [86, 26], [60, 0], [40, -20], [40, 20], [0, 0]] as const) {
      const d = o.depth(h3.add(g.o, h3.add(h3.mul(g.x, x), h3.mul(g.y, y))), 12);
      if (d > 0) c += 40 * d * d;
    }
    for (const dg of withThumb ? [...sk.fingers, sk.thumb] : sk.fingers)
      for (let k = dg.name === 'thumb' ? 1 : 0; k < 3; k++) {
        const mid = h3.mul(h3.add(dg.joints[k], dg.joints[k + 1]), 0.5);
        for (const p of k === 2 ? [mid] : [dg.joints[k + 1], mid]) {
          const d = o.depth(p, dg.r[k + 1] - (k === 2 ? 3 : 1));
          if (d > 0) c += 30 * d * d;
        }
      }
    return c;
  };
  // The frame is fitted with the thumb at rest (cheap); its reach to its own
  // key is held by the distance from its saddle joint (a thumb spans ≈ 52–90 mm).
  const keep = (g: HandFrame) => {
    let c = turn * (1 - h3.dot(g.x, x0)) + turn * (1 - h3.dot(g.z, z0));
    c += inside(handOn(g, fingers, THUMB_REST, 0.7), false);
    const cmc = h3.add(g.o, h3.add(h3.mul(g.x, 24), h3.add(h3.mul(g.y, -24), h3.mul(g.z, -10))));
    const r = h3.len(h3.sub(thumb, cmc));
    if (r > 90) c += 4 * (r - 90) ** 2;
    if (r < 52) c += 4 * (52 - r) ** 2;
    return c;
  };
  const fit = (from: HandFrame) => fitHand(from, fingers, THUMB_REST, { elbow: o.elbow, maxWrist: 64, curl: 1.0, dipRatio: 0.7, slide: o.slide ?? 0, keep });
  const score = (sk: HandSkeleton) => sk.miss.slice(0, 4).reduce((a, m) => a + m * m, 0) + keep(sk.frame);
  // A few starts round the posture's frame (the search is local) — only when
  // the posture's own frame does not already land the pads.
  let sk = fit(f0);
  let best = score(sk);
  const landed = (q: HandSkeleton) => q.miss.slice(0, 4).every((m) => m < 0.5);
  if (!landed(sk))
  for (const ax of [f0.x, f0.y, f0.z])
    for (const a of [0.3, -0.3]) {
      const s2 = fit(turnFrame(f0, ax, a));
      const e = score(s2);
      if (e < best - 1e-6) {
        best = e;
        sk = s2;
      }
    }
  // Each target slides (within its `max`, across what it presses) toward
  // where the finger reaches, then the hand is fitted again.
  for (let round = 0; round < 2 && !landed(sk); round++) {
    fingers = o.fingers.map((g, i) => {
      if (!isPad(g)) return fingers[i];
      const tip = sk.fingers[i].joints[3];
      const t0 = base[i]!;
      let d = h3.sub(tip, t0);
      d = h3.sub(d, h3.mul(g.m, h3.dot(d, g.m)));
      const l = h3.len(d);
      return l > g.max ? h3.add(t0, h3.mul(d, g.max / l)) : h3.add(t0, d);
    });
    sk = fit(sk.frame);
  }
  const done = sk;
  const pen = (d: ReturnType<typeof thumbJoints>) => inside({ ...done, thumb: d }, true) - inside(done, false);
  return { sk: done, pads: fingers.map((g) => (isV3(g) ? g : null)), thumbTo: (target: V3) => thumbOnto(done.frame, target, pen) };
}

/**
 * One hand solved: the posture's frame turned about the wrist (and, for the
 * reviewer's sweep, slid by `slide` mm) until the pads land, the wrist within
 * 64° of the forearm, the fingers in a natural curl, nothing of the hand
 * inside the tube or the player.
 */
export function solveHand(L: Layout, side: 'L' | 'R', opts: { slide?: number; turn?: number } = {}): WindHand {
  const hp = side === 'L' ? L.handL : L.handR;
  const plan = holdPlan(L, side);
  // A pad may press a padded cup anywhere on its top (≈ half its radius off
  // the centre), a ring or an open hole only with its centre over the hole
  // (≤ 2.5 mm); a touch the art adds (a finger plate, a spatula, the
  // bassoon's finger holes) is drawn where the finger falls (≤ 8 mm, a
  // spatula's long lever ≤ 16 mm).
  const goals: PadGoal[] = plan.fingers.map((g) => {
    if (!isTouch(g)) return { curl: g.curl };
    const max = g.k === undefined ? (g.kind === 'spatula' ? 16 : 8) : g.kind === 'ring' || g.kind === 'open' ? 2.5 : 0.45 * touchR(L.spec, g);
    return { target: padTarget(L, g), m: touchAt(L, g).m, max };
  });
  const r = fitHold({ frame: startFrame(hp), elbow: hp.elbow, fingers: goals, thumb: padTarget(L, plan.thumb), depth: (p, rr) => inTube(L, hp.s, p, rr), slide: opts.slide, turn: opts.turn });
  // The thumb last: onto its key round the tube (never through it) — a key
  // the art adds sits where the thumb falls (within its roam).
  let thumbTouch = plan.thumb;
  let t = r.thumbTo(padTarget(L, plan.thumb));
  const roam = plan.thumb.roam;
  if (roam && t.miss > 1)
    for (const fs of [-1, -0.5, 0, 0.5, 1])
      for (const fa of [-1, -0.5, 0, 0.5, 1]) {
        const ang = plan.thumb.ang + fa * roam.dang;
        const cand: Touch = { ...plan.thumb, s: plan.thumb.s + fs * roam.ds, ang, out: roam.outAt ? roam.outAt(ang) : plan.thumb.out };
        const q = r.thumbTo(padTarget(L, cand));
        if (q.miss < t.miss - 0.5) {
          t = q;
          thumbTouch = cand;
        }
      }
  return { sk: { ...r.sk, thumb: t.digit, miss: [...r.sk.miss.slice(0, 4), t.miss] }, elbow: hp.elbow, plan, s: hp.s, pads: r.pads, thumbTouch };
}

/** A frame turned about a unit axis through its wrist (Rodrigues). */
function turnFrame(f: HandFrame, k: V3, a: number): HandFrame {
  const rot = (v: V3) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const kxv = { x: k.y * v.z - k.z * v.y, y: k.z * v.x - k.x * v.z, z: k.x * v.y - k.y * v.x };
    return h3.add(h3.add(h3.mul(v, c), h3.mul(kxv, s)), h3.mul(k, h3.dot(k, v) * (1 - c)));
  };
  return { o: f.o, x: rot(f.x), y: rot(f.y), z: rot(f.z) };
}

/** The thumb's pad onto `target` (a sweep of its whole range, then refined),
 *  `inside` the penalty for any of it inside the tube. */
function thumbOnto(f: HandFrame, target: V3, inside: (d: ReturnType<typeof thumbJoints>) => number): { digit: ReturnType<typeof thumbJoints>; miss: number } {
  // (The penalty is never negative: a pose whose miss alone already costs
  // more than the best so far is not tested against the solids.)
  let bound = Infinity;
  const cost = (p: ThumbPose) => {
    const d = thumbJoints(f, p);
    const m = h3.len(h3.sub(d.joints[3], target));
    const c0 = m * m + 2 * (Math.abs(p.yaw - THUMB_REST.yaw) + Math.abs(p.pitch - THUMB_REST.pitch));
    return { c: c0 >= bound ? c0 : c0 + inside(d), m, d };
  };
  let best: ThumbPose = THUMB_REST;
  let e = cost(best).c;
  bound = e;
  for (let a = -0.2; a <= 1.41; a += 0.2)
    for (let b = -0.3; b <= 1.46; b += 0.25)
      for (let m = 0; m <= 1.06; m += 0.35)
        for (let q = 0; q <= 1.41; q += 0.35) {
          const p = { yaw: a, pitch: b, mcp: m, ip: q };
          const c = cost(p).c;
          if (c < e) {
            e = c;
            best = p;
            bound = e;
          }
        }
  for (const s of [0.15, 0.07, 0.03, 0.012])
    for (let it = 0; it < 30; it++) {
      let moved = false;
      for (const key of ['yaw', 'pitch', 'mcp', 'ip'] as const)
        for (const dd of [s, -s]) {
          const p = { ...best, [key]: best[key] + dd };
          p.yaw = Math.max(-0.2, Math.min(1.4, p.yaw));
          p.pitch = Math.max(-0.35, Math.min(1.45, p.pitch));
          p.mcp = Math.max(LIMITS.thumbMcp[0], Math.min(LIMITS.thumbMcp[1], p.mcp));
          p.ip = Math.max(LIMITS.thumbIp[0], Math.min(LIMITS.thumbIp[1], p.ip));
          const c = cost(p).c;
          if (c < e - 1e-6) {
            e = c;
            best = p;
            bound = e;
            moved = true;
          }
        }
      if (!moved) break;
    }
  const r = cost(best);
  return { digit: r.d, miss: r.m };
}

const cache = new WeakMap<Layout, { L: WindHand; R: WindHand }>();
/** Both hands for a layout (solved once). */
export function windHands(L: Layout): { L: WindHand; R: WindHand } {
  let h = cache.get(L);
  if (!h) {
    h = { L: solveHand(L, 'L'), R: solveHand(L, 'R') };
    cache.set(L, h);
  }
  return h;
}

/** A hand's checks (the reviewer's and the tests'): pads' misses, the wrist's bend, each finger's bends. */
export function handReport(w: WindHand): { miss: number[]; wrist: number; bends: number[][] } {
  return { miss: w.sk.miss, wrist: wristBendDeg(w.sk, w.elbow), bends: [...w.sk.fingers, w.sk.thumb].map(jointBendsDeg) };
}

/**
 * EVERY POSED WOODWIND HAND (the figure-anatomy ratchet reads these): per
 * lesson and variant — the layouts built exactly as the lessons build them
 * (A06 flute: metal, wooden, simple-system, standing; A07 piccolo, A08a
 * clarinet (35°), A09a oboe (40°), A09b bassoon: standing and seated; A08b
 * bass clarinet: low E♭ and low C models, seated). `contact`: the digits that
 * must touch what they play (index 0 … little 3, thumb 4) — every one here.
 */
export function handCases(): { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb: string }[] {
  const layouts: [string, Layout][] = [
    ['A06 flute metal', fluteLayout(fluteSpec('metal'), 'standing')],
    ['A06 flute wooden', fluteLayout(fluteSpec('wooden'), 'standing')],
    ['A06 flute simple', fluteLayout(fluteSpec('simple'), 'standing')],
    ['A07 piccolo standing', fluteLayout(PICCOLO, 'standing')],
    ['A07 piccolo seated', fluteLayout(PICCOLO, 'seated')],
    ['A08a clarinet seated', straightReedLayout(CLARINET, 'seated', 35)],
    ['A08a clarinet standing', straightReedLayout(CLARINET, 'standing', 35)],
    ['A08b bass clarinet eflat', bassClarinetLayout(bassClarinetSpec('eflat'))],
    ['A08b bass clarinet lowc', bassClarinetLayout(bassClarinetSpec('lowc'))],
    ['A09a oboe seated', straightReedLayout(OBOE, 'seated', 40)],
    ['A09a oboe standing', straightReedLayout(OBOE, 'standing', 40)],
    ['A09b bassoon seated', bassoonLayout('seated', BASSOON)],
    ['A09b bassoon standing', bassoonLayout('standing', BASSOON)],
  ];
  const out: { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb: string }[] = [];
  for (const [name, L] of layouts) {
    const h = windHands(L);
    for (const side of ['L', 'R'] as const) {
      const w = h[side];
      const contact = w.plan.fingers.map((g, i) => (isTouch(g) ? i : -1)).filter((i) => i >= 0);
      out.push({ name: `${name} ${side === 'L' ? 'left' : 'right'}`, sk: w.sk, elbow: w.elbow, contact: [...contact, 4], thumb: w.plan.thumb.kind === 'rest' ? 'under the tube (rest)' : 'on its thumb key' });
    }
  }
  return out;
}
