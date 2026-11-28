/**
 * FIGURE V2 — THE TWO-HANDED BOOM-POLE GRIP (wave 4 of D78, builder
 * "FrontAndBoom", 2026-11-24). Pure: no React, no Skia.
 *
 * How a boom operator holds the pole (researched: Rode, "What you need to know
 * about boompole usage"; My New Microphone, "How to properly hold a boom
 * pole"; No Film School, "6 boom pole positions"): overhead, the pole about
 * level and high over the head, BOTH hands on it about shoulder-width apart or
 * a little more, the arms close to the head with the elbows bent and out to
 * the side, a firm (not tight) grip so the hands can turn the pole without
 * rubbing it; held low ("bench press") for a shot from below.
 *
 * Each hand is the APPROVED 3-D power grip (heldHands.ts: the handle in the
 * palm, the four fingers round its far edge, the thumb round its near edge the
 * other way, their ends meeting on the front) closed on the pole — that file is
 * used as it is, its output unchanged. A pole held overhead and running fore
 * and aft is held in the neutral grip: the back of each hand turned out to the
 * side, the palms toward each other across the pole. The grip model is a RIGHT
 * hand; the LEFT hand is the same hand built in the world mirrored across the
 * operator's own middle plane and drawn back through the mirror — a true left
 * hand, never a right hand on a left arm.
 *
 * The arms: the shoulder of the person drawn, the elbow solved on the circle
 * the upper arm and the forearm allow (bent, out to the side and a little
 * forward and down — never in at the head), the hand on the lesson's own grip
 * points on the pole (no point of the lesson moves).
 */
import type { Pt } from './geom.ts';
import { placeGrip, type PlacedGrip, type V3 } from './heldHands.ts';

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const sub = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const add = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const len = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit = (a: V3): V3 => mul(a, 1 / (len(a) || 1));

/** The pole's radius where the hands close on it (a ≈ 30 mm boom-pole section; a drawing default). */
export const POLE_R = 15;
/** The arm (mm): shoulder → elbow, elbow → the middle of the fist (the forearm with the hand to the grip). */
export const BOOM_ARM = { upper: 300, fore: 330 } as const;

/** The operator's frame (frame V, y down): F the way they face (level), R their right, the neck's base. */
export type OperatorFrame = { F: V3; R: V3; neck: V3 };

/** The operator facing level along `face` (only its x and z are used), the base of the neck at `neck`. */
export function operatorFrame(neck: V3, face: V3): OperatorFrame {
  const F = unit(v3(face.x, 0, face.z));
  const up = v3(0, -1, 0);
  // (frame V: +x out of the mouth, +y down, +z the person's right: right = up × forward)
  const R = unit(cross(up, F));
  return { F, R, neck };
}

/** The mirror across the operator's middle plane (a point, and a direction). */
const mirrorP = (o: OperatorFrame) => (p: V3): V3 => sub(p, mul(o.R, 2 * dot(sub(p, o.neck), o.R)));
const mirrorV = (o: OperatorFrame) => (v: V3): V3 => sub(v, mul(o.R, 2 * dot(v, o.R)));

/**
 * The elbow: on the circle the upper arm and the forearm allow between the shoulder and the fist, the point
 * most out to the arm's own side, then a little down and forward (an overhead hold: the elbows bent, out
 * beside the head, never in at it). At or past full reach: on the straight line.
 */
export function boomElbow(shoulder: V3, fist: V3, outward: V3, F: V3, a = BOOM_ARM.upper, b = BOOM_ARM.fore, lean: { forward: number; down: number } = { forward: 0.15, down: 0.35 }): { elbow: V3; reach: number } {
  const sf = sub(fist, shoulder);
  const d = len(sf);
  const u = unit(sf);
  if (d >= a + b - 1) return { elbow: add(shoulder, mul(u, (a / (a + b)) * d)), reach: d / (a + b) };
  const t = (a * a - b * b + d * d) / (2 * d);
  const r = Math.sqrt(Math.max(0, a * a - t * t));
  const c = add(shoulder, mul(u, t));
  let e1 = cross(u, v3(0, 1, 0));
  if (len(e1) < 1e-3) e1 = cross(u, v3(1, 0, 0));
  e1 = unit(e1);
  const e2 = unit(cross(u, e1));
  const down = v3(0, 1, 0);
  let best = c;
  let score = -Infinity;
  for (let k = 0; k < 360; k += 1) {
    const ph = (k * Math.PI) / 180;
    const dir = add(mul(e1, Math.cos(ph)), mul(e2, Math.sin(ph)));
    const sc = dot(dir, outward) + lean.down * dot(dir, down) + lean.forward * dot(dir, F);
    if (sc > score) {
      score = sc;
      best = add(c, mul(dir, r));
    }
  }
  return { elbow: best, reach: d / (a + b) };
}

/** One arm on the pole, in the world. */
export type BoomArm3 = {
  side: 'L' | 'R';
  shoulder: V3;
  elbow: V3;
  fist: V3;
  reach: number;
  /** how far the shoulder rose and moved toward the reach (world; zero within reach) */ lift?: V3;
  /** (2026-11-25, UNDERHAND) the hand SUPPORTS the pole from below: the palm turned up under the pole (the back of the
   *  hand down), the fingers closing up and over its top, the thumb up the other side — the hand's roll about the
   *  pole only; the grip point, the pole and the arm's joints are unchanged (BoomV2 decides which hands). */
  under?: boolean;
};

/**
 * THE UNDERHAND ROLL (owner 2026-11-24 on B10 overhead, left hand: "it curls ontop of the pole and not cradeling it
 * from below"). Of the two backs of the hand square to the forearm and the pole, the one pointing DOWN (frame V: +y),
 * so the palm faces up under the pole. The same rule in rightFrame (the mirrored world keeps y) and boomHandFace.
 */
const underBack = (c: V3): V3 => (c.y >= 0 ? unit(c) : mul(unit(c), -1));

/** The hand's frame for a RIGHT hand closing on a pole along `pole`: the forearm f, the back of the hand
 *  turned out to the side (d), the pole's direction taken toward the thumb's side (h). */
function rightFrame(elbow: V3, fist: V3, pole: V3, outward: V3, back?: V3, under = false): { f: V3; h: V3; d: V3 } {
  const f = unit(sub(fist, elbow));
  // (FrontBoom3, review 2026-11-24: the hand was a paddle with the pole across it) the back of the hand is square to
  // BOTH the forearm and the pole (the pole lies in the palm, across the hand): of the two such directions, the one
  // nearer `back` (the arm's own side, and the operator's back: a pole across the operator is held palms forward,
  // as arms raised overhead turn; a pole running fore and aft, palms toward each other, the backs out to the side).
  // Never the arm's outward side alone: with the pole running across the operator that lies ALONG the pole and
  // leaves the hand's turn undecided.
  const c = cross(f, pole);
  let d: V3;
  if (len(c) > 0.2) {
    const pref = back ?? outward;
    d = under ? underBack(c) : dot(c, pref) >= 0 ? unit(c) : mul(unit(c), -1);
  } else {
    d = sub(outward, mul(f, dot(outward, f)));
    d = len(d) < 1e-3 ? unit(cross(f, pole)) : unit(d);
  }
  // (for the right-hand model the thumb runs along W = f × d: the pole's sign that way)
  const W = cross(f, d);
  const h = dot(pole, W) >= 0 ? unit(pole) : mul(unit(pole), -1);
  return { f, h, d };
}

export type BoomHandPlan = {
  arm: BoomArm3;
  grip: PlacedGrip;
  /** The wrist where the forearm meets the hand (world). */
  wrist3: V3;
  /** The forearm runs away from the viewer (behind its own elbow). */
  away: boolean;
  /** The pole seen nearly end-on at this hand. */
  endOn: boolean;
  /** The hand's own frame on the page: a point of the grip model (u wrist → knuckles, w toward the thumb,
   *  n palm → back) to the page — through the mirror for a left hand. */
  toPage: (l: { u: number; w: number; n: number }) => Pt;
  /** (FrontBoom5, the front view) drawn by the approved mic hand's own painter (heldHandV2), not boomFist;
   *  (2026-11-24) 'poleFront': the approved authored pole hand, palm side (poleHandFront.tsx). */
  painter?: 'held' | 'poleFront' | 'poleBack' | 'poleEnd' | 'poleEndBack' | 'poleEndLittle' | 'poleEndLittleBack' | 'poleEndUnder' | 'poleTop' | 'poleTopUnder' | 'poleTopUnderLow';
  /** ('poleFront') where the authored hand sits on the page: its pole axis's middle under the fist, its turn, mirrored for a left hand. */
  poleFront?: { x: number; y: number; rot: number; mirror: boolean };
  /** ('poleBack', the side view) the approved authored pole hand seen from its BACK (poleHandBack.tsx), placed as poleFront. */
  poleBack?: { x: number; y: number; rot: number; mirror: boolean };
  /** ('poleEnd', the side view, 2026-11-24) the approved authored pole hand seen END-ON from its thumb / index end
   *  (poleHandEnd.tsx): (x, y) the drawing's origin (the pole's axis where it enters the fist on the index side), its
   *  turn, mirrored for a left hand. */
  poleEnd?: { x: number; y: number; rot: number; mirror: boolean };
  /** ('poleEndBack', the side view) the approved end-on hand from the thumb / index end, the camera tilted toward the BACK
   *  of the hand (poleHandEndBack.tsx), placed as poleEnd. */
  poleEndBack?: { x: number; y: number; rot: number; mirror: boolean };
  /** ('poleEndLittle', the side view) the approved end-on hand seen from the LITTLE-FINGER end (poleHandEndLittle.tsx):
   *  (x, y) the drawing's origin (the pole's axis where it enters the fist on the little-finger side), placed as poleEnd. */
  poleEndLittle?: { x: number; y: number; rot: number; mirror: boolean };
  /** ('poleEndLittleBack', the side view, 2026-11-25) the approved end-on hand from the LITTLE-FINGER end, the camera
   *  toward the BACK of the hand (poleHandEndLittleBack.tsx), placed as poleEnd; `near` the pole's real near stretch
   *  past the drawing's origin (mm along the pole: where the drawn pole ends on the camera's side, at most END_NEAR). */
  poleEndLittleBack?: { x: number; y: number; rot: number; mirror: boolean; near: number };
  /** ('poleEndUnder', the side view, 2026-11-25) the approved UNDERHAND hand cradling the pole from below, seen from the
   *  thumb / index end toward the palm (poleHandEndUnder.tsx), placed as poleEnd; `near` the pole's real near stretch. */
  poleEndUnder?: { x: number; y: number; rot: number; mirror: boolean; near: number };
  /** (from the front, 2026-11-25) an underhand hand's picture there: the back-of-hand drawing, or the palm side and why. */
  frontFace?: { drawing: 'palm' | 'back'; why?: string };
  /** ('poleTop', from above, 2026-11-24) the approved authored pole hand from directly above (poleHandTop.tsx): its pole
   *  axis under the middle of the fist, its turn, mirrored for a left hand. */
  poleTop?: { x: number; y: number; rot: number; mirror: boolean };
  /** ('poleTopUnder', from above, 2026-11-25) the approved UNDERHAND hand from directly above (poleHandTopUnder.tsx):
   *  (x, y) its grip (the pole's axis at the middle of the fist), its turn, mirrored for a left hand. */
  poleTopUnder?: { x: number; y: number; rot: number; mirror: boolean };
  /** ('poleTopUnderLow', from above, 2026-11-25) the approved LOW underhand hand from directly above, the mic dragged below
   *  the mouth (poleHandTopUnderLow.tsx): placed as poleTopUnder. */
  poleTopUnderLow?: { x: number; y: number; rot: number; mirror: boolean };
  /** (the side view's authored hands) what the rig's real 3-D hand shows the camera: the face, how far (degrees) the
   *  hand's plane is turned from square to the camera, how far the forearm is from square to the pole (3-D, degrees). */
  sideFace?: {
    face: 'back' | 'palm';
    turn: number;
    foreSquare: number;
    /** the drawing could be placed with a reachable straight-wrist arm */
    fits: boolean;
    why?: string;
    /** (2026-11-24) which approved drawing this hand carries ('old': none could be placed — the old hand) */
    drawing?: 'back' | 'palm' | 'end' | 'endBack' | 'endLittle' | 'endLittleBack' | 'endUnder' | 'old';
    /** (2026-11-25) the palm's normal against world up: + the palm faces up under the pole (an underhand hold) */
    palmUp?: number;
    /** (2026-11-25) the hand holds underhand (BoomArm3.under) */
    under?: boolean;
    /** (2026-11-24) each end-on drawing tried for this hand: how far its forearm lies off the arm's on the page (deg),
     *  the camera's angle off the pole against the drawing's 25° (deg), whether it could be placed, and why not */
    tried?: { drawing: 'end' | 'endBack' | 'endLittle' | 'endLittleBack' | 'endUnder'; lean: number; axisOff: number; fits: boolean; why?: string }[];
    /** (2026-11-24) the flat drawing's forearm on the page against the arm's (deg) */
    flatLean?: number;
    /** how far the camera is along the pole toward the fist's THUMB / index end (+1: straight along it from that end;
     *  −1: from the little-finger end) */
    thumbEnd?: number;
  };
  /** (from above, 2026-11-24) the approved top drawing's fit: placed, or why not (the old hand kept). */
  topFace?: {
    fits: boolean;
    why?: string;
    /** (2026-11-25) which drawing this hand carries from above: 'topUnder' (poleHandTopUnder), 'topUnderLow'
     *  (poleHandTopUnderLow), 'top' (poleHandTop) or 'old' (the old hand) */
    drawing?: 'top' | 'topUnder' | 'topUnderLow' | 'old';
    /** (2026-11-25, an underhand hand) how far (deg) the rig's forearm on the page is off the underhand drawing's ±98° */
    underOff?: number;
    /** (2026-11-25, an underhand hand) how far (deg) it is off the LOW underhand drawing's ±150° */
    lowOff?: number;
    /** (2026-11-25, an underhand hand that took neither underhand drawing) why not */
    underWhy?: string;
  };
};

/**
 * WHICH FACE OF THE HAND A VIEW SEES (2026-11-24, "Boom side"). The approved authored pole hands are drawn for a camera
 * looking square at the hand: the forearm and the pole both in the picture's plane, the back of the hand toward the
 * camera (poleHandBack) or away from it (poleHandFront, the palm side). The back of the hand `d` is square to the
 * forearm and to the pole (the pole across the palm), turned toward the arm's own side and the operator's back — the
 * same choice rightFrame makes (in the mirrored world for a left hand, which maps back to the same rule here).
 * `turn`: how far the hand's plane is from square to the camera; `foreSquare`: the forearm's angle off square to the pole.
 */
export function boomHandFace(o: OperatorFrame, arm: BoomArm3, pole: V3, toward: V3): { face: 'back' | 'palm'; turn: number; foreSquare: number; d: V3; thumb: V3; palmUp: number } {
  const outward = arm.side === 'L' ? mul(o.R, -1) : o.R;
  const back = add(outward, mul(o.F, -1));
  const f = unit(sub(arm.fist, arm.elbow));
  const c = cross(f, pole);
  let d: V3;
  if (len(c) > 0.2) d = arm.under ? underBack(c) : dot(c, back) >= 0 ? unit(c) : mul(unit(c), -1);
  else {
    d = sub(outward, mul(f, dot(outward, f)));
    d = len(d) < 1e-3 ? unit(cross(f, pole)) : unit(d);
  }
  // (the thumb: along f × d for a right hand, the other way for a left)
  const W = mul(cross(f, d), arm.side === 'L' ? -1 : 1);
  const thumb = dot(pole, W) >= 0 ? unit(pole) : mul(unit(pole), -1);
  const k = dot(d, unit(toward));
  const deg = (x: number) => (Math.acos(Math.max(-1, Math.min(1, x))) * 180) / Math.PI;
  // (palmUp: the palm's normal −d against world up (frame V, y down): + the palm faces up, under the pole)
  return { face: k > 0 ? 'back' : 'palm', turn: deg(Math.abs(k)), foreSquare: 90 - deg(Math.abs(dot(f, unit(pole)))), d, thumb, palmUp: d.y };
}

/**
 * One hand on the pole as a view sees it: `toward` the unit vector to the viewer, `proj` the view's page
 * projection, `wristFrom2` (optional) where the forearm's skin starts on the page (the cuff's opening).
 */
export function boomHand(o: OperatorFrame, arm: BoomArm3, pole: V3, toward: V3, proj: (p: V3) => Pt, wristFrom2?: Pt): BoomHandPlan {
  const left = arm.side === 'L';
  const MP = left ? mirrorP(o) : (p: V3) => p;
  const MV = left ? mirrorV(o) : (v: V3) => v;
  // (a left hand: the right-hand model built in the mirrored world, drawn back through the mirror)
  const outward = left ? mul(o.R, -1) : o.R;
  // (the back of the hand: out to the arm's side and back toward the operator — palms forward on a pole across them)
  const back = add(outward, mul(o.F, -1));
  const fr = rightFrame(MP(arm.elbow), MP(arm.fist), MV(pole), MV(outward), MV(back), !!arm.under);
  const projM = (p: V3) => proj(MP(p));
  const grip = placeGrip(MP(arm.fist), fr, MV(toward), projM, POLE_R, wristFrom2 ? { wristFrom2 } : {});
  const wrist3 = MP(grip.wrist3);
  const fore = unit(sub(wrist3, arm.elbow));
  const g = grip.frame;
  const fm = MP(arm.fist);
  const toPage = (l: { u: number; w: number; n: number }) => projM(add(fm, add(mul(g.U, l.u), add(mul(g.W, l.w), mul(g.N, l.n)))));
  return { arm, grip, wrist3, away: dot(fore, toward) < -0.35, endOn: Math.abs(dot(unit(pole), toward)) > 0.8, toPage };
}

/**
 * The two arms on the pole: `front` and `rear` the lesson's own hand points on the pole (the middle of each
 * fist), `shoulders` the person's (world), which arm takes which point (`rearArm`: the arm on the rear hand —
 * the old drawing's choice, so no arm crosses the face in profile).
 */
/** Where the elbows go on an overhead hold: 'forward' (the default: out, a little down and forward), 'beside'
 *  (out beside the head and a little back — the hands above the head; nothing crosses the face in profile). */
export type ElbowLean = 'forward' | 'beside';
const LEAN: Record<ElbowLean, { forward: number; down: number }> = { forward: { forward: 0.15, down: 0.35 }, beside: { forward: -1.1, down: -0.25 } };

export function boomArms(o: OperatorFrame, shoulders: { L: V3; R: V3 }, front: V3, rear: V3, rearArm: 'L' | 'R', elbows: ElbowLean = 'forward', force?: 'L' | 'R'): BoomArm3[] {
  // (FrontBoom2, review 2026-11-24: "the two forearms cross in an X") each arm takes the hand on ITS OWN side of
  // the operator's middle — an H, never an X; the rig's `rearArm` only breaks a tie (both hands on the middle line).
  // `force` (FrontBoom3, a side view only): the arm that takes the rear hand whatever its side.
  const lat = (p: V3) => dot(sub(p, o.neck), o.R);
  const dl = lat(rear) - lat(front);
  const rearSide: 'L' | 'R' = force ?? (Math.abs(dl) < 12 ? rearArm : dl > 0 ? 'R' : 'L');
  return (['L', 'R'] as const).map((side) => {
    const fist = side === rearSide ? rear : front;
    const outward = side === 'R' ? o.R : mul(o.R, -1);
    const s0 = shoulders[side];
    // A REACH: where the grip lies past what the arm reaches nearly straight, the shoulder girdle rises and
    // moves toward it (the shoulder blade turns up and forward on an overhead reach — a few centimetres, at
    // most SHOULDER_TRAVEL) so the arm is nearly but never fully straight and nothing stretches.
    const want = REACH_MAX * (BOOM_ARM.upper + BOOM_ARM.fore);
    const d0 = len(sub(fist, s0));
    const travel = Math.max(0, Math.min(SHOULDER_TRAVEL, d0 - want));
    const s = add(s0, mul(unit(sub(fist, s0)), travel));
    const pole = unit(sub(front, rear));
    const { elbow, reach } = fist.y < s.y - 80 ? overheadElbow(s, fist, outward, o, pole) : lowHoldElbow(s, fist, outward, o, pole);
    void LEAN[elbows];
    return { side, shoulder: s, elbow, fist, reach, lift: sub(s, s0) };
  });
}

/** The points of the elbow's circle (the upper arm and the forearm fixed, shoulder and fist given). */
function elbowCircle(shoulder: V3, fist: V3, a = BOOM_ARM.upper, b = BOOM_ARM.fore): { pts: V3[]; reach: number; straight: V3 | null } {
  const sf = sub(fist, shoulder);
  const d = len(sf);
  const u = unit(sf);
  if (d >= a + b - 1) return { pts: [], reach: d / (a + b), straight: add(shoulder, mul(u, (a / (a + b)) * d)) };
  const t = (a * a - b * b + d * d) / (2 * d);
  const r = Math.sqrt(Math.max(0, a * a - t * t));
  const c = add(shoulder, mul(u, t));
  let e1 = cross(u, v3(0, 1, 0));
  if (len(e1) < 1e-3) e1 = cross(u, v3(1, 0, 0));
  e1 = unit(e1);
  const e2 = unit(cross(u, e1));
  const pts: V3[] = [];
  for (let k = 0; k < 360; k += 2) {
    const ph = (k * Math.PI) / 180;
    pts.push(add(c, add(mul(e1, r * Math.cos(ph)), mul(e2, r * Math.sin(ph)))));
  }
  return { pts, reach: d / (a + b), straight: null };
}

/**
 * THE OVERHEAD HOLD'S ELBOW (FrontBoom2, review 2026-11-24): the forearm roughly VERTICAL under the fist and SQUARE
 * to the pole (the wrist straight, in line with the forearm — never a right-angle kink), the elbow out to the arm's
 * own side beside the head, never in front of the face, never in across the body.
 */
function overheadElbow(shoulder: V3, fist: V3, outward: V3, o: OperatorFrame, pole: V3): { elbow: V3; reach: number } {
  const C = elbowCircle(shoulder, fist);
  if (C.straight) return { elbow: C.straight, reach: C.reach };
  let best = C.pts[0];
  let score = -Infinity;
  for (const e of C.pts) {
    const f = unit(sub(fist, e));
    const along = Math.abs(dot(f, pole));
    const out = dot(sub(e, shoulder), outward);
    const fwd = dot(sub(e, o.neck), o.F);
    const sc = 1.6 * -f.y + 0.012 * Math.min(out, 140) - 6 * Math.max(0, along - 0.32) - 0.02 * Math.max(0, fwd - 40) - 0.05 * Math.max(0, -out);
    if (sc > score) {
      score = sc;
      best = e;
    }
  }
  return { elbow: best, reach: C.reach };
}

/** A pole held LOW (at the hip, beside the body): the elbows hang down and a little out and back, the forearms
 *  forward to the pole, square to it where the arm allows. */
function lowHoldElbow(shoulder: V3, fist: V3, outward: V3, o: OperatorFrame, pole: V3): { elbow: V3; reach: number } {
  const C = elbowCircle(shoulder, fist);
  if (C.straight) return { elbow: C.straight, reach: C.reach };
  let best = C.pts[0];
  let score = -Infinity;
  for (const e of C.pts) {
    const f = unit(sub(fist, e));
    const along = Math.abs(dot(f, pole));
    const out = dot(sub(e, shoulder), outward);
    const fwd = dot(sub(e, shoulder), o.F);
    const sc = 0.02 * e.y + 0.01 * Math.min(out, 150) - 3 * Math.max(0, along - 0.62) - 0.05 * Math.max(0, -out + 20) - 0.004 * fwd - 0.05 * Math.max(0, shoulder.y + 40 - e.y);
    if (sc > score) {
      score = sc;
      best = e;
    }
  }
  return { elbow: best, reach: C.reach };
}

/** The share of the arm's full length a hold keeps (nearly straight, never locked). */
export const REACH_MAX = 0.97;
/** How far the shoulder girdle may rise and move toward an overhead reach (mm). */
export const SHOULDER_TRAVEL = 60;

/** A point `k` mm along the pole from `a` toward `b`. */
export const alongPole = (a: V3, b: V3, k: number): V3 => add(a, mul(unit(sub(b, a)), k));
