/**
 * THE BOWED FAMILY'S HANDS (figure pass 3, owner 2026-10-15: "check that the
 * hand is correctly positioned, placed, bent, fingers and digits accounted
 * for"). Pure: no React, no Skia — the art paints these very skeletons
 * (BowedArt → PlayerFigure.drawHand3) and the tests measure them
 * (`handCases`).
 *
 * Every hand is the shared adult hand (players/handModel.ts) posed in the
 * LESSON frame (posture.ts: +x the audience, +y down, +z the player's right)
 * by solving each pad onto what it plays:
 *
 *   THE STOPPING HAND (all four): first position, each pad pressing a string
 *   to the board at its equal-tempered stop (L·2^(−n/12) from the bridge) —
 *   violin/viola 1-2-3-4 on whole/half steps (2, 4, 5, 7 semitones; the hand
 *   spans ≈ 73 mm on a violin), cello one finger per semitone (2-3-4-5,
 *   ≈ 98 mm), bass 1-2-4 (2-3-4, the ring finger beside the little finger,
 *   ≈ 108 mm). The knuckle row lies beside the board on the treble side
 *   (frame B +y), the fingers arch OVER the board from there and come down
 *   onto the strings (the index reaching the lowest string, the short little
 *   finger the nearest), the thumb opposite the 1st/2nd finger — on the
 *   neck's bass flank (violin, viola) or on its back (cello, bass).
 *
 *   THE BOW HAND (at the frog): the thumb bent, its tip under the stick at
 *   the frog's front corner; the index draped over the stick on the winding,
 *   the middle finger opposite the thumb, the ring finger over the frog, the
 *   little finger curved ON TOP of the stick (violin, viola) or down on the
 *   frog's side (cello, bass: a rounder hand — the bass's French bow is held
 *   the same way).
 *
 *   THE PIZZICATO HAND (bass): the thumb anchored on the board's edge near
 *   its end, the index and middle pads on the strings just below it, ring
 *   and little finger loosely curled.
 *
 * THE ARMS: each wrist is joined to its shoulder by an adult arm solved in
 * 3-D (upper arm 310 mm, forearm 255 mm to the wrist crease), the elbow bent
 * the way the posture bends it — so the forearm the art draws ends exactly
 * where the hand begins, and the wrist's bend is measured against it.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, dot, len, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { fingerFlexDeg, fitHand, handFrame, handOn, h3, HAND, inFrame, THUMB_REST, wristBendDeg, type DigitGoal, type HandFrame, type HandSkeleton, type V3 } from '../players/handModel.ts';
import { BOWED, fbHalf, fingerboardZ, stationsOf, stringYs, type BowedSpec } from './bowedSpec.ts';
import { elbowOf, FIRST_POSITION, seated, standing, stopX, toLesson, underChin, type BowPose, type BPoint, type Posture } from './posture.ts';

/** The adult arm the bowed figure is drawn with (mm): shoulder → elbow, elbow → wrist crease. */
export const ARM_UPPER = 310;
export const ARM_FORE = 255;

export { FIRST_POSITION, stopX };

/** A pressing pad's centre above the board's face (the string pressed down to it, the pad ≈ 8 mm round). */
const PAD_UP = 8;
/** The back of the neck under the board at frame-B x (BowedArt draws the neck with it): the board's face less 5k,
 *  then a neck 20k deep at the nut swelling to 28k at the heel — k a violin's 1, growing with the body but slower
 *  than it (figure pass 3: a true neck for the thumb to rest on — the cello's ≈ 40 mm and the bass's ≈ 54 mm deep
 *  at the nut, board included; scaled with the whole body they were drawn ≈ 52 and 77). */
export function neckBackZ(spec: BowedSpec, x: number): number {
  const st = stationsOf(spec);
  const k = 1 + (spec.body.mm / 358 - 1) * 0.55;
  const x0 = st.neckX - 12 * (spec.body.mm / 358);
  const t = Math.max(0, Math.min(1, (x - x0) / (st.nutX - x0)));
  return fingerboardZ(spec, x) - 5 * k - (20 + 8 * (1 - t)) * k;
}

export type PosedHand = {
  sk: HandSkeleton;
  /** The 3-D elbow of the arm drawn to this wrist (lesson frame). */
  elbow: V3;
  /** The shoulder that arm hangs from (a protracted bow arm's root, as drawn). */
  shoulder: V3;
  /** The digits that must touch what they play (0 index … 3 little, 4 thumb). */
  contact: number[];
  thumb: string;
  /** What the hand holds, as an axis (a neck, a stick): the art paints the hand's far side behind it. */
  axis: { p: V3; d: V3 };
};

const toV = (p: Vec3): V3 => ({ x: p.x, y: p.y, z: p.z });

/** The elbow of an adult arm from `shoulder` to `wrist`, bent toward `pole`. */
export function armElbow(shoulder: V3, wrist: V3, pole: V3): V3 {
  return elbowOf(shoulder, wrist, ARM_UPPER, ARM_FORE, pole);
}

/** The pole an existing elbow bends toward, square to shoulder → hand. */
function poleOf(shoulder: Vec3, elbow: Vec3, hand: Vec3): Vec3 {
  const u = norm(sub(hand, shoulder));
  const off = sub(elbow, shoulder);
  return sub(off, scale(u, dot(off, u)));
}

/**
 * Fit a hand and the arm to its wrist together: the hand's pads onto their
 * targets with the wrist within `maxWrist`° of the forearm, the forearm from
 * the elbow an adult arm puts there (re-solved as the wrist settles).
 */
function fitWithArm(start: HandFrame, pads: readonly DigitGoal[], thumb: V3, shoulder: V3, pole: V3, o: { maxWrist: number; slide: number; curl: number; dipRatio?: number; keep?: (f: HandFrame) => number; knuckles?: boolean | 'soft' }): { sk: HandSkeleton; elbow: V3 } {
  // The thumb is solved once the hand has settled (its search is the costly part): while fitting, only its reach
  // counts — its target within what the thumb spans from its saddle joint (≈ 45–92 mm of its 101).
  // (`knuckles`: a finger reaching its pad with its base knuckle bent BACKWARD reads as a claw — the hand is placed
  // so every knuckle flexes, ≥ 5°: the bow hold's draped fingers.)
  const keep = (f: HandFrame) => {
    const r = h3.len(h3.sub(thumb, inFrame(f, HAND.thumb.cmc.x, HAND.thumb.cmc.y, HAND.thumb.cmc.z)));
    let c = (o.keep?.(f) ?? 0) + 40 * Math.max(0, r - 90) ** 2 + 40 * Math.max(0, 48 - r) ** 2;
    if (!o.knuckles) return c;
    const sk = handOn(f, pads, THUMB_REST, o.dipRatio);
    sk.fingers.forEach((d, i) => {
      if ((pads[i] as V3).x === undefined) return;
      c += (o.knuckles === true ? 2 : 0.4) * Math.max(0, 5 - fingerFlexDeg(f, d).mcp) ** 2;
    });
    return c;
  };
  const solve = (from: HandFrame) => {
    let elbow = armElbow(shoulder, from.o, pole);
    let sk: HandSkeleton = fitHand(from, pads, THUMB_REST, { elbow, maxWrist: o.maxWrist, slide: o.slide, curl: o.curl, dipRatio: o.dipRatio, keep });
    for (let i = 0; i < 3; i++) {
      elbow = armElbow(shoulder, sk.frame.o, pole);
      sk = fitHand(sk.frame, pads, THUMB_REST, { elbow, maxWrist: o.maxWrist, slide: o.slide * 0.5, curl: o.curl, dipRatio: o.dipRatio, keep });
    }
    sk = handOn(sk.frame, pads, thumb, o.dipRatio);
    elbow = armElbow(shoulder, sk.frame.o, pole);
    const over = Math.max(0, wristBendDeg(sk, elbow) - o.maxWrist);
    const cost = sk.miss.reduce((a, m) => a + m * m, 0) + 400 * over * over + keep(sk.frame);
    return { sk, elbow, cost };
  };
  // A few starts (the hand turned ±20° about each of its axes): the search is local; the best fit wins.
  let best = solve(start);
  if (best.sk.miss.some((m) => m > 2)) {
    for (const ax of [start.x, start.y, start.z])
      for (const a of [-0.35, 0.35]) {
        const r = solve(turnFrame(start, ax, a));
        if (r.cost < best.cost) best = r;
      }
  }
  return { sk: best.sk, elbow: best.elbow };
}

/** A frame turned by `a` about the unit axis `k` (Rodrigues), about its own origin. */
function turnFrame(f: HandFrame, k: V3, a: number): HandFrame {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const rot = (v: V3): V3 => {
    const kxv = { x: k.y * v.z - k.z * v.y, y: k.z * v.x - k.x * v.z, z: k.x * v.y - k.y * v.x };
    return h3.add(h3.add(h3.mul(v, c), h3.mul(kxv, s)), h3.mul(k, h3.dot(k, v) * (1 - c)));
  };
  return { o: f.o, x: rot(f.x), y: rot(f.y), z: rot(f.z) };
}

/* ── the stopping hand ── */

/** Frame-B points and directions → the lesson frame. */
const Bp = (P: Pick<Posture, 'ax'>, q: BPoint): V3 => toV(toLesson(P.ax, q));

export function leftHand(P: Posture): PosedHand {
  const { spec } = P;
  const fp = FIRST_POSITION[spec.id];
  const xs = fp.semis.map((n) => stopX(spec, n));
  // Bass 1-2-4: the ring finger presses just behind the little finger, toward the nut.
  if (spec.id === 'bass') xs[2] = xs[3] + 20;
  const pads: V3[] = xs.map((x, i) => Bp(P, { x, y: stringYs(spec, x)[fp.strings[i]], z: fingerboardZ(spec, x) + PAD_UP }));
  const xm = (xs[0] + xs[3]) / 2;
  const xt = stopX(spec, fp.thumbSemis);
  const fz = fingerboardZ(spec, xt);
  // The thumb: on the bass flank of the neck, a little under the board (violin, viola), or on its back (cello, bass).
  const thumbB: BPoint = fp.thumb === 'flank' ? { x: xt, y: -(fbHalf(spec, xt) * 0.92 + 7), z: fz - 13 } : { x: xt, y: 3, z: neckBackZ(spec, xt) - 8 };
  const thumb = Bp(P, thumbB);
  // Start: the knuckle row beside the board on the treble side, the hand rising from under the neck, its back out.
  const big = spec.id === 'cello' || spec.id === 'bass';
  const kn: BPoint = { x: xm, y: fbHalf(spec, xm) + (big ? 22 : 16), z: fingerboardZ(spec, xm) - (big ? 2 : 8) };
  const alongB: BPoint = big ? { x: -0.15, y: -0.25, z: 1 } : { x: -0.1, y: -0.2, z: 1 };
  const along = norm(Bp(P, alongB));
  const dorsal = Bp(P, { x: 0, y: 1, z: big ? 0.15 : 0.25 });
  const toNut = Bp(P, { x: 1, y: 0, z: 0 });
  const wrist = sub(Bp(P, kn), scale(along, 96));
  const start = handFrame(wrist, along, dorsal, toNut);
  const Y = norm(Bp(P, { x: 0, y: 1, z: 0 }));
  // (The bass's knuckles stand well out from its wide board, so its fingers curve from the knuckle, never claw.)
  const idxMcp = Bp(P, spec.id === 'bass' ? { x: xs[0] - 10, y: fbHalf(spec, xs[0]) + 27, z: fingerboardZ(spec, xs[0]) - 8 } : { x: xs[0] - 6, y: fbHalf(spec, xs[0]) + 11, z: fingerboardZ(spec, xs[0]) - 14 });
  const pl = P.player;
  const pole = poleOf(pl.shoulderL, pl.elbowL, pl.handL);
  const { sk, elbow } = fitWithArm(start, pads, thumb, toV(pl.shoulderL), toV(pole), {
    // Violin, viola: the wrist straight with the forearm; cello, bass: a natural, slightly bent wrist.
    maxWrist: big ? 50 : 18,
    knuckles: spec.id === 'cello' ? 'soft' : false,
    slide: 40,
    curl: big ? 1.15 : 1.25,
    // The back of the hand stays outward (the palm toward the neck); the index's base knuckle against the neck's
    // treble flank just under the board (violin, viola; a cello's or bass's hand stays clear of the neck).
    keep: (f) => 30000 * Math.max(0, 0.55 - h3.dot(f.z, Y)) ** 2 + (spec.id === 'cello' ? 0 : spec.id === 'bass' ? 0 : 6) * h3.len(h3.sub(inFrame(f, HAND.fingers[0].mcp.x, HAND.fingers[0].mcp.y, 0), idxMcp)) ** 2,
  });
  return { sk, elbow, shoulder: toV(pl.shoulderL), contact: [0, 1, 2, 3, 4], thumb: fp.thumb === 'flank' ? 'neck flank' : 'behind', axis: { p: Bp(P, { x: xm, y: 0, z: fingerboardZ(spec, xm) - 15 }), d: norm(Bp(P, { x: 1, y: 0, z: 0 })) } };
}

/** A wrist further than an easy reach (0.95 of the arm: the elbow still bent) from its shoulder costs. */
const inReach = (f: HandFrame, shoulder: V3) => 0.5 * Math.max(0, h3.len(h3.sub(f.o, shoulder)) - 0.95 * (ARM_UPPER + ARM_FORE)) ** 2;

/* ── the bow hand ── */

/** The stick's centre `d` mm from the frog's back end toward the tip (BowedArt.bowItems: the stick ≈ 16.5 mm over the hair there). */
function stickAt(spec: BowedSpec, b: BowPose, d: number): V3 {
  const k = Math.max(1, spec.bow.mm / 750);
  return toV(add(add(b.frog, scale(b.dir, -d)), scale(b.up, 16.5 * k)));
}

/** Where each digit of the bow hold touches (d from the frog's back toward the tip; `far` across the stick away
 *  from the wrist, `up` along the stick's side of the hair). */
const BOW_HOLD = {
  // Violin, viola: the index's middle joint over the stick on the winding, its pad hanging on the far side; the middle
  // finger opposite the thumb; the ring finger over the frog, its pad on the frog's far face; the little finger's tip
  // ON TOP of the stick near the frog's back. The thumb's tip under the stick in the corner the frog makes with it.
  upper: { fingers: [{ d: 98, far: 10, up: -21 }, { d: 68, far: 11, up: -24 }, { d: 42, far: 14, up: -15 }, { d: 18, far: 2, up: 10 }], thumb: { d: 70, far: -4, up: -10 } },
  // Cello, bass: a rounder, deeper hand — the fingers spread a little wider and draped further round, the little finger
  // down on the frog's far face (the French bass bow is held the same way).
  lower: { fingers: [{ d: 110, far: 12, up: -19 }, { d: 76, far: 14, up: -23 }, { d: 48, far: 16, up: -14 }, { d: 22, far: 15, up: -9 }], thumb: { d: 72, far: -4, up: -10 } },
} as const;

export function bowHand(P: Posture): PosedHand {
  const { spec } = P;
  const b = P.bow;
  const pl = P.player;
  const hold = spec.id === 'violin' || spec.id === 'viola' ? BOW_HOLD.upper : BOW_HOLD.lower;
  // Across the stick, away from the forearm: the fingers drape to that side.
  const across = norm(sub(P.ax.x, scale(b.dir, dot(P.ax.x, b.dir))));
  const far = dot(across, sub(b.frog, pl.elbowR)) >= 0 ? across : scale(across, -1);
  const at = (h: { d: number; far: number; up: number }): V3 => toV(add(add(stickAt(spec, b, h.d), scale(far, h.far)), scale(b.up, h.up)));
  const pads = hold.fingers.map(at);
  const thumb = at(hold.thumb);
  // Start: the knuckles over the stick on the wrist's side, the hand slanting toward the tip, its back up.
  const toTip = scale(b.dir, -1);
  const knuckles = add(add(stickAt(spec, b, 55), scale(b.up, 32)), scale(far, -6));
  const along = norm(add(add(scale(far, 0.75), scale(toTip, 0.35)), scale(b.up, -0.35)));
  const dorsal = add(scale(b.up, 0.85), scale(far, -0.3));
  const wrist = sub(knuckles, scale(along, 96));
  const start = handFrame(toV(wrist), toV(along), toV(dorsal), toV(toTip));
  const ref = P.strokes[1] ?? { hand: pl.handR, elbow: pl.elbowR };
  const pole = poleOf(pl.shoulderR, ref.elbow, ref.hand);
  const up = toV(b.up);
  const sh = toV(pl.shoulderR);
  const tipV = toV(toTip);
  const slant = hold === BOW_HOLD.upper ? 0.35 : 0.2;
  const { sk, elbow } = fitWithArm(start, pads, thumb, sh, toV(pole), {
    maxWrist: 50,
    knuckles: true,
    slide: 45,
    curl: 1.1,
    // The back of the hand faces away from the hair (never the palm up); the wrist within an arm's easy reach.
    // The hand slants toward the tip (the fingers lie across the stick at ≈ 25–30°, the violinist's more than the
    // cellist's rounder hand).
    keep: (f) => 30000 * Math.max(0, 0.35 - h3.dot(f.z, up)) ** 2 + inReach(f, sh) + 1000 * (h3.dot(f.x, tipV) - slant) ** 2,
  });
  return { sk, elbow, shoulder: toV(pl.shoulderR), contact: [0, 1, 2, 3, 4], thumb: 'under the stick', axis: { p: stickAt(spec, b, 50), d: toV(b.dir) } };
}

/* ── the pizzicato hand (bass) ── */

/** Where the plucking hand works (frame-B x): the thumb on the board's edge just above its end, the pads just below. */
export const PLUCK = { thumbX: 272, indexX: 234, middleX: 226 } as const;

export function pluckHand(P: Posture): PosedHand {
  const { spec } = P;
  const pl = P.player;
  const ys = (x: number) => stringYs(spec, x);
  // The pads hook the strings from the treble side (they pull them toward the thumb).
  const pads: DigitGoal[] = [
    Bp(P, { x: PLUCK.indexX, y: ys(PLUCK.indexX)[1] + 7, z: fingerboardZ(spec, PLUCK.indexX) + PAD_UP + 6 }),
    Bp(P, { x: PLUCK.middleX, y: ys(PLUCK.middleX)[2] + 7, z: fingerboardZ(spec, PLUCK.middleX) + PAD_UP + 6 }),
    { curl: 0.75 },
    { curl: 0.85 },
  ];
  // The thumb's pad on the board's bass-side edge (the low string's side, toward the bow arm).
  const thumb = Bp(P, { x: PLUCK.thumbX, y: -(fbHalf(spec, PLUCK.thumbX) + 5), z: fingerboardZ(spec, PLUCK.thumbX) - 4 });
  // Start: the hand pointing down the strings toward the bridge, the palm toward them, the thumb on the bass side.
  const along = norm(Bp(P, { x: -1, y: 0.25, z: -0.15 }));
  const dorsal = Bp(P, { x: 0, y: 0, z: 1 });
  const kn = Bp(P, { x: 300, y: 0, z: fingerboardZ(spec, 300) + 30 });
  const start = handFrame(toV(sub(kn, scale(along, 96))), along, dorsal, Bp(P, { x: 0, y: -1, z: 0 }));
  const pole = poleOf(pl.shoulderR, pl.elbowR, pl.handR);
  const Z = norm(Bp(P, { x: 0, y: 0, z: 1 }));
  const sh = toV(pl.shoulderR);
  const { sk, elbow } = fitWithArm(start, pads, thumb, sh, toV(pole), {
    maxWrist: 45,
    knuckles: true,
    slide: 50,
    curl: 0.7,
    keep: (f) => 30000 * Math.max(0, 0.3 - h3.dot(f.z, Z)) ** 2 + inReach(f, sh),
  });
  return { sk, elbow, shoulder: toV(pl.shoulderR), contact: [0, 1, 4], thumb: 'on the board edge', axis: { p: Bp(P, { x: 250, y: 0, z: fingerboardZ(spec, 250) - 10 }), d: norm(Bp(P, { x: 1, y: 0, z: 0 })) } };
}

/* ── the bow arm as DRAWN ── */

/** How far down the bow the violin/viola picture is drawn (a fraction of the hair from the contact). */
export const DRAWN_DOWN_BOW = 0.9;
/** Shoulder protraction (mm): a reaching bow arm carries the shoulder a little forward along the reach. */
export const DRAWN_PROTRACT = 60;

/**
 * The violin/viola as DRAWN (owner review 2026-10-10: mid-stroke, the bow's
 * tip half rose up behind the player's head). The picture shows a down-bow
 * near its end instead: the tip just past the strings, the stick out to the
 * frog in the hand, the arm reaching forward. Only the drawing changes: the
 * keep-outs (the bow's whole sweep), the hit areas and the mic positions
 * still come from the posture.
 */
export function drawnBow(P: Posture): Posture {
  if (P.kind !== 'underChin' || P.strokes.length < 3 || !P.player) return P;
  const b = P.bow;
  const frog = add(b.contact, scale(b.dir, b.hair * DRAWN_DOWN_BOW));
  const tip = sub(frog, scale(b.dir, b.hair + (P.spec.bow.mm - b.hair) * 0.12));
  return { ...P, bow: { ...b, frog, tip }, player: { ...P.player, handR: add(frog, scale(b.up, 28)) } };
}

/** A reaching bow arm's protracted shoulder (the root the sleeve hangs from), toward the wrist. */
function protracted(shoulder: Vec3, wrist: Vec3): Vec3 {
  const reach = len(sub(wrist, shoulder));
  const pro = Math.min(DRAWN_PROTRACT, Math.max(0, reach - (ARM_UPPER + ARM_FORE - 40)));
  return add(shoulder, scale(norm(sub(wrist, shoulder)), pro));
}

export type DrawnHands = { P: Posture; L: PosedHand; R: PosedHand | null };

const cache = new WeakMap<Posture, { bow?: DrawnHands; pluck?: DrawnHands }>();

/**
 * Everything the art draws for a posture: the posture as drawn (the bow
 * moved for the violin/viola picture; each elbow re-solved to its posed
 * wrist; the bow arm's protracted shoulder) and the posed hands. Cached per
 * posture (the lessons' postures are module constants).
 */
export function drawnHands(P0: Posture, bowed: boolean): DrawnHands {
  let c = cache.get(P0);
  if (!c) {
    c = {};
    cache.set(P0, c);
  }
  const k = bowed ? 'bow' : 'pluck';
  return (c[k] ??= build(P0, bowed));
}

function build(P0: Posture, bowed: boolean): DrawnHands {
  const P = bowed ? drawnBow(P0) : P0;
  const L = leftHand(P);
  let R: PosedHand | null = null;
  if (bowed && P.strokes.length) R = bowHand(P);
  else if (!bowed && P.kind === 'standing') R = pluckHand(P);
  const pl = P.player;
  let shoulderR = pl.shoulderR;
  let elbowR = pl.elbowR;
  if (R) {
    shoulderR = bowed ? protracted(pl.shoulderR, R.sk.frame.o) : pl.shoulderR;
    const ref = bowed ? (P.strokes[1] ?? { hand: pl.handR, elbow: pl.elbowR }) : { hand: pl.handR, elbow: pl.elbowR };
    elbowR = armElbow(shoulderR, R.sk.frame.o, poleOf(pl.shoulderR, ref.elbow, ref.hand));
    R = { ...R, elbow: elbowR, shoulder: shoulderR };
  }
  const player = { ...pl, elbowL: L.elbow, shoulderR, elbowR };
  return { P: { ...P, player }, L, R };
}

/* ── the test cases (figureAnatomy: five digits, proportions, joint limits, wrist ≤ 70°, contacts ≤ 3 mm) ── */

export function handCases(): { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb?: string }[] {
  const out: { name: string; sk: HandSkeleton; elbow: V3; contact: number[]; thumb?: string }[] = [];
  const postures: [string, Posture, boolean][] = [
    ['C09a violin standing', underChin(BOWED.violin, 0, false), true],
    ['C09a violin seated', underChin(BOWED.violin, 0, true), true],
    ['C09b viola standing', underChin(BOWED.viola, 20, false), true],
    ['C09b viola seated', underChin(BOWED.viola, 20, true), true],
    ['C09c cello', seated(BOWED.cello), true],
    ['C06a bass plucked', standing(BOWED.bass, 'pluck'), false],
    ['C06b bass bowed', standing(BOWED.bass, 'bow'), true],
  ];
  for (const [name, P, bowed] of postures) {
    const d = drawnHands(P, bowed);
    out.push({ name: `${name}: left (stopping) hand`, sk: d.L.sk, elbow: d.L.elbow, contact: d.L.contact, thumb: d.L.thumb });
    if (d.R) out.push({ name: `${name}: right (${bowed ? 'bow' : 'pizzicato'}) hand`, sk: d.R.sk, elbow: d.R.elbow, contact: d.R.contact, thumb: d.R.thumb });
  }
  return out;
}

/** The wrist's bend of a posed hand against its drawn forearm (degrees). */
export const wristOf = (h: PosedHand) => wristBendDeg(h.sk, h.elbow);
