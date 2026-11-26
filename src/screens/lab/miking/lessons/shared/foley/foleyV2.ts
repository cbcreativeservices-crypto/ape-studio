/**
 * THE FOLEY PERFORMER in the new look (figure V2, wave 3 set 3b of D78,
 * 2026-11-24). Pure: no React, no Skia.
 *
 * The same 3-D body as the current picture (performer.ts: the Body3 a lesson
 * authors once, projected to the side view and from above), the same props
 * where the lessons put them, drawn as Mei of the cast. Each hand is one of:
 *   hold  closed round what it holds (review 2026-11-24: the approved held-mic
 *         hand, figureV2/playersGrip.ts — ONE skin round the thing, the
 *         fingers round one side, the thumb round the other, the thing
 *         THROUGH the fist; the arm solved from the body's own shoulder so the
 *         side and the top views show the same arm): a lever handle, a chair's
 *         top rail, a jug's handle, the block's back end, the key ring held in
 *         a loose fist;
 *   flat  palm down on the table, paper or board under it (the approved desk
 *         hand: from the side the near hand's little-finger edge, the far
 *         hand's thumb side; from above the back of the hand);
 *   side  hanging at the side (the approved resting hand; from above, under
 *         the shoulder, not drawn).
 * Nothing moves a prop, a keep-out or a measured point (a hold's `at` IS the
 * fist's middle).
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { castFor } from '../figureV2/cast';
import { sidePlan, type SidePlan, type Sole } from '../figureV2/sidePlan.ts';
import { placeRest } from '../figureV2/authoredHands.ts';
import { personTopPlan } from '../figureV2/topPerson.ts';
import { armPlan } from '../figureV2/sidePlan.ts';
import type { TopPlan } from '../figureV2/topPlan.ts';
import type { PlacedGrip } from '../figureV2/heldHands.ts';
import { gripArm3, gripInView, noseTip, openingOf, SIDE_VIEW, tiltTo, TOP_VIEW, type GripArm3 } from '../figureV2/playersGrip.ts';
import { hull, P, type Pt } from '../figureV2/geom.ts';
import { sidePose, topPose, type Body3 } from './performer.ts';

export const FOLEY_PERFORMER = castFor('foley.performer');

/** What one hand does: closes on a thing (its grip point and the direction it runs), lies flat, or hangs. */
export type FoleyHand =
  /** `r`: the thing's radius where the fist closes (mm, default 12); `back`: where the back of the hand faces
   *  (default: out to the hand's own side and up) */
  | { kind: 'hold'; at: Vec3; toward: Vec3; r?: number; back?: Vec3; /** how the thing lies across the palm (playersGrip `tilt`): 6 (default) square across, a rail or a ring; 28 diagonal, a hammer's or a handle's grip */ tilt?: number; /** (round 3) the elbow hangs toward here (playersGrip `elbowHint`; default: the solver's easiest elbow) */ elbow?: Vec3 }
  /** `on`: the surface's y (side view) the palm rests on — the hand is set down onto it (the pose's wrist
   *  is a few centimetres off it); absent, the hand lies where the pose's wrist is */
  | { kind: 'flat'; on?: number }
  | { kind: 'side' }
  /** a relaxed open hand held in the air (the resting hand at the pose's wrist; from above, its back) */
  | { kind: 'open' }
  /** an arm swinging empty as the body walks (the resting hand at the side; from above the sleeve where it
   *  reaches past the shoulders, the hand hanging under its cuff, seen edge-on — not drawn, as the old figure) */
  | { kind: 'swing' };
export type FoleySpec = { R: FoleyHand; L: FoleyHand; soleR?: Sole; soleL?: Sole; nod?: number };

const sub3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len3 = (a: Vec3) => Math.hypot(a.x, a.y, a.z);

const gripCache = new WeakMap<Body3, Map<string, GripArm3 | null>>();
/** The arm that holds: from the body's own shoulder, the hand closed round the thing (frame F: +x the
 *  performer's front, +y down, +z the performer's right). */
export function foleyGrip(b: Body3, side: 'R' | 'L', h: FoleyHand): GripArm3 | null {
  if (h.kind !== 'hold') return null;
  let m = gripCache.get(b);
  if (!m) {
    m = new Map();
    gripCache.set(b, m);
  }
  const key = side + JSON.stringify(h);
  const hit = m.get(key);
  if (hit !== undefined) return hit;
  const out = side === 'R' ? 1 : -1;
  const g = gripArm3({
    hand: side,
    fist: h.at,
    toward: h.toward,
    shoulder: side === 'R' ? b.shR : b.shL,
    back: h.back ?? { x: 0, y: -0.5, z: out * 0.87 },
    R: h.r ?? 12,
    // (a rail or a ring: held square across the palm, a power grip; a block's end, a lever, a jug's handle: a
    // hammer's grip, the thing diagonal across the palm, the wrist easy)
    tilt: h.tilt ?? 6,
    ulnar: (h.tilt ?? 6) > 15 ? 22 : 6,
    ...(h.elbow ? { elbowHint: h.elbow } : {}),
    fwd: { x: 1, y: 0, z: 0 },
    right: { x: 0, y: 0, z: 1 },
    centre: { x: (b.shR.x + b.shL.x) / 2, y: 0, z: (b.shR.z + b.shL.z) / 2 },
  });
  m.set(key, g);
  return g;
}

export type FoleyGrips = { near: PlacedGrip | null; far: PlacedGrip | null };

const sideCache = new WeakMap<Body3, Map<string, { plan: SidePlan; grips: FoleyGrips }>>();
function foleySide(b: Body3, s: FoleySpec) {
  let m = sideCache.get(b);
  if (!m) {
    m = new Map();
    sideCache.set(b, m);
  }
  const key = JSON.stringify(s);
  const hit = m.get(key);
  if (hit) return hit;
  const pose = sidePose(b);
  const R = foleyGrip(b, 'R', s.R);
  const L = foleyGrip(b, 'L', s.L);
  const restOf = (h: FoleyHand) => (h.kind === 'flat' ? ('restFlat' as const) : h.kind === 'side' || h.kind === 'open' || h.kind === 'swing' ? ('restSide' as const) : undefined);
  // (a flat hand set down on its surface: the authored flat hand's palm lies ≈ 26–28 mm under its wrist line)
  const PALM = { restFlat: 26.4, restFlatThumb: 27.8 } as const;
  const onSurface = (h: FoleyHand, w: Pt, view: 'restFlat' | 'restFlatThumb') => (h.kind === 'flat' && h.on !== undefined ? placeRest(view, P(w.u, h.on - PALM[view]), 0, P(0, 1)) : null);
  const placedR = onSurface(s.R, pose.handR.wrist, 'restFlat');
  const placedL = onSurface(s.L, pose.handL.wrist, 'restFlatThumb');
  const who = FOLEY_PERFORMER;
  const p2 = (q: Vec3): Pt => P(q.x, q.y);
  const V = SIDE_VIEW.toward;
  // (review 2026-11-24: "an exaggerated round buttock" on the performer bent over the table) the side figure's
  // seat turns with the whole torso; a body bending at the hips tilts its pelvis far less than its trunk, so
  // the seat seen from the side stands out less behind: its fullness eased by the bend (upright: unchanged)
  const hipMid = { x: (b.hipR.x + b.hipL.x) / 2, y: (b.hipR.y + b.hipL.y) / 2 };
  const lean = Math.max(0, Math.atan2(b.neck.x - hipMid.x, hipMid.y - b.neck.y));
  const body = who.body ? { ...who.body, hip: who.body.hip * (1 - 0.55 * Math.sin(lean)) } : who.body;
  const plan = sidePlan(
    {
      ...pose,
      ...(R ? { elbowR: p2(R.elbow), handR: { ...pose.handR, wrist: p2(R.wrist), kind: 'grip' as const } } : {}),
      ...(L ? { elbowL: p2(L.elbow), handL: { ...pose.handL, wrist: p2(L.wrist), kind: 'grip' as const } } : {}),
    },
    {
      head: who.head,
      body,
      ...(placedR ? { placedR } : {}),
      ...(placedL ? { placedL } : {}),
      ...(restOf(s.R) ? { restR: restOf(s.R) } : {}),
      ...(restOf(s.L) ? { restL: restOf(s.L) } : {}),
      awayR: R ? tiltTo(R, V) < -0.5 : false,
      awayL: L ? tiltTo(L, V) < -0.5 : false,
      tiltR: R ? tiltTo(R, V) : 0,
      tiltL: L ? tiltTo(L, V) : 0,
      ...(s.soleR ? { soleR: s.soleR } : {}),
      ...(s.soleL ? { soleL: s.soleL } : {}),
      ...(s.nod ? { nod: s.nod } : {}),
    },
  );
  const grips: FoleyGrips = {
    near: R ? gripInView(R, SIDE_VIEW, openingOf(plan.arms.near)) : null,
    far: L ? gripInView(L, SIDE_VIEW, openingOf(plan.arms.far)) : null,
  };
  const out = { plan, grips };
  m.set(key, out);
  return out;
}

/** The performer in profile. */
export const foleySidePlan = (b: Body3, s: FoleySpec): SidePlan => foleySide(b, s).plan;
/** The hands that hold, closed round their things, in profile (PlayerSideV2 `grips`). */
export const foleySideGrips = (b: Body3, s: FoleySpec): FoleyGrips => foleySide(b, s).grips;

/** How far the body bends forward at the hips (radians; 0 upright). */
export function leanOf(b: Body3): number {
  const hx = (b.hipR.x + b.hipL.x) / 2;
  const hy = (b.hipR.y + b.hipL.y) / 2;
  return Math.max(0, Math.atan2(b.neck.x - hx, hy - b.neck.y));
}
/** A bend past this (≈ 10°) shows the back and the seat from above. */
const LEAN_SHOWS = 0.17;
/** A stride past this (mm, heel to heel along the walk) shows the feet past the body from above. */
const STRIDE_SHOWS = 250;
/** Whether the legs show from above: a body bent forward (its seat and shoes behind the shoulders) or walking
 *  (the forward shoe ahead of the chest, the back one behind); an upright stance keeps them under the shoulders. */
export const legsFromAbove = (b: Body3): boolean => leanOf(b) > LEAN_SHOWS || Math.abs(b.ftR.x - b.ftL.x) > STRIDE_SHOWS;
/** The shirt from above carried back from the shoulders to the waist over the hips (a body bent forward). */
function backToWaist(slab: readonly Pt[], b: Body3): Pt[] {
  const B = FOLEY_PERFORMER.body;
  const hx = (b.hipR.x + b.hipL.x) / 2;
  const hz = (b.hipR.z + b.hipL.z) / 2;
  const half = 132 * (B?.waist ?? 1);
  // (the waist a little forward of the hip joints on the bent trunk; the seat behind is the thighs' own cloth)
  const w = hx + 40;
  return hull([...slab, P(w, hz - half), P(w - 18, hz - half * 0.7), P(w - 26, hz), P(w - 18, hz + half * 0.7), P(w, hz + half)]);
}

const topCache = new WeakMap<Body3, Map<string, { plan: TopPlan; grips: FoleyGrips }>>();
function foleyTop(b: Body3, s: FoleySpec) {
  let m = topCache.get(b);
  if (!m) {
    m = new Map();
    topCache.set(b, m);
  }
  const key = JSON.stringify(s);
  const hit = m.get(key);
  if (hit) return hit;
  const pose = topPose(b);
  const who = FOLEY_PERFORMER;
  const desk = personTopPlan(pose, who, { desk: true });
  const hang = personTopPlan(pose, who, {});
  const B = who.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  const xz = (q: Vec3): Pt => P(q.x, q.z);
  const arm = (side: 'R' | 'L') => {
    const h = s[side];
    const k = side === 'R' ? 'near' : 'far';
    if (h.kind === 'flat' || h.kind === 'open') {
      // (review 2026-11-24: "the far arm hooks out from BEHIND the shoulder line with a sharp 90° elbow") the
      // approved hand where the desk plan lays it, the arm from the body's OWN 3-D shoulder and elbow
      const sh = side === 'R' ? b.shR : b.shL;
      const el = side === 'R' ? b.elR : b.elL;
      const wr = side === 'R' ? b.wrR : b.wrL;
      const d = sub3(wr, el);
      // (the back of the hand from above, the fingers on along the forearm, the thumb toward the body's middle)
      const placed = placeRest('restTop', xz(wr), Math.atan2(d.z, d.x), P(0, side === 'R' ? -1 : 1));
      return armPlan(xz(sh), xz(el), placed.wrist, null, false, placed, -d.y / (len3(d) || 1), null, true, armB);
    }
    if (h.kind === 'side') return hang.arms[k];
    if (h.kind === 'swing') {
      const sh = side === 'R' ? b.shR : b.shL;
      const el = side === 'R' ? b.elR : b.elL;
      const wr = side === 'R' ? b.wrR : b.wrL;
      const d = sub3(wr, el);
      return armPlan(xz(sh), xz(el), xz(wr), null, false, null, -d.y / (len3(d) || 1), null, true, armB);
    }
    const g = foleyGrip(b, side, h)!;
    return armPlan(xz(g.shoulder), xz(g.elbow), xz(g.wrist), null, false, null, tiltTo(g, TOP_VIEW.toward), null, true, armB);
  };
  const arms = { near: arm('R'), far: arm('L') };
  // (cast sweep 2026-11-26: "the performer bent over the table wrong from above") a body bent forward at the hips
  // shows its back from above, sloping from the shoulders down to the waist over the hips — not the upright
  // shoulders alone: the shirt carried back to the waist (the seat and the legs behind it are the plan's legs,
  // drawn under the body — legsFromAbove)
  const torso = leanOf(b) > LEAN_SHOWS ? backToWaist(desk.torso, b) : desk.torso;
  // (review 2026-11-24: from above only the nose's tip shows past the brow)
  const plan: TopPlan = noseTip({ ...desk, torso, arms });
  const R = foleyGrip(b, 'R', s.R);
  const L = foleyGrip(b, 'L', s.L);
  const grips: FoleyGrips = {
    near: R ? gripInView(R, TOP_VIEW, openingOf(arms.near)) : null,
    far: L ? gripInView(L, TOP_VIEW, openingOf(arms.far)) : null,
  };
  const out = { plan, grips };
  m.set(key, out);
  return out;
}

/** The performer from above: the legs (what shows past the shoulders), the arms that hold or lie flat, the
 *  shoulders and the head; a hanging arm lies under its shoulder. */
export const foleyTopPlan = (b: Body3, s: FoleySpec): TopPlan => foleyTop(b, s).plan;
/** The hands that hold, closed round their things, from above (PlayerTopV2 `grips`). */
export const foleyTopGrips = (b: Body3, s: FoleySpec): FoleyGrips => foleyTop(b, s).grips;

/** The key ring (props KeyRing: its ring Ø 30 at the origin, the keys hanging under it) held in a loose
 *  right fist closed over the ring's top, the ring running through the fist across the hand, the keys
 *  hanging free below it; the left hand at the side. (F03 keys / live, F05.) */
// (the fist palm down over the ring's top, the forearm level behind it: the ring's wire across the palm, the
// thumb's side inward)
export const KEYS_HOLD: FoleySpec = { R: { kind: 'hold', at: { x: 0, y: 4, z: 0 }, toward: { x: 0, y: 4, z: -100 }, r: 8, back: { x: 0.15, y: -1, z: 0.25 } }, L: { kind: 'side' } };

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
/** F03 — the props, per variant (propGeom: each prop's sounding part at the origin). */
export const PROPS_HOLD: Readonly<Record<string, FoleySpec>> = {
  keys: KEYS_HOLD,
  live: KEYS_HOLD,
  // both hands palm down on the sheet on the table (its top at y = 0), lifting and bending it
  paper: { R: { kind: 'flat', on: -1.5 }, L: { kind: 'flat', on: -1.5 } },
  // the right hand round the handle — drawn (props FoleyDoor) as a bar through the door, square to it, 70 mm
  // in from the latch edge: the fist closed on its outer end, the bar running from it into the door (+x), the
  // thumb on its top; the left hand at the side
  door: { R: { kind: 'hold', at: v(-58, 0, 70), toward: v(40, 0, 70), r: 10, back: v(0, -0.25, 1), tilt: 28 }, L: { kind: 'side' } },
  // both hands round the top of the chair's back (it runs across, along z), knuckles up and a little forward
  chair: { R: { kind: 'hold', at: v(-425, -886, -80), toward: v(-425, -886, -180), r: 14, back: v(0.35, -1, 0) }, L: { kind: 'hold', at: v(-425, -886, -340), toward: v(-425, -886, -240), r: 14, back: v(0.35, -1, 0) } },
};
/** F04 — the impacts, liquids and textures, per variant. */
export const IMPACTS_HOLD: Readonly<Record<string, FoleySpec>> = {
  // the padded block (lifted 200 mm to strike) held by its back end, the block running forward out of the
  // fist, the thumb on its top; the left hand flat on the table
  // (second review 2026-11-24: "from above the hand holding the block is at the face with no arm") the elbow out to
  // the right side, so from above the upper arm leaves the shoulder beside the head and the forearm runs in to the fist
  impact: { R: { kind: 'hold', at: v(-58, -230, 0), toward: v(60, -230, 0), r: 24, back: v(0, -0.3, 1), tilt: 28, elbow: v(-330, -330, 330) }, L: { kind: 'flat', on: 0 } },
  live: { R: { kind: 'hold', at: v(-58, -230, 0), toward: v(60, -230, 0), r: 24, back: v(0, -0.3, 1), tilt: 28, elbow: v(-330, -330, 330) }, L: { kind: 'flat', on: 0 } },
  // the jug's C handle in the right fist (the jug tipped 100° to pour: the handle runs forward and a little
  // down from the fist toward the jug's mouth end), the left hand open beside the jug, ready to steady it
  water: { R: { kind: 'hold', at: v(-150, -290, 0), toward: v(-150 + 98.5, -290 + 17.4, 0), r: 8, back: v(0, -0.35, 1), tilt: 20 }, L: { kind: 'open' } },
  // the block brush held palm down on its back (its top 70 mm over the fabric), the left hand flat on the board
  texture: { R: { kind: 'flat', on: -70 }, L: { kind: 'flat', on: 0 } },
};

/** Whether a hand is drawn from above (a hanging hand is not). */
export const shownFromAbove = (h: FoleyHand) => h.kind !== 'side';
/** Whether an arm is drawn from above without a hand (a swinging arm). */
export const bareFromAbove = (s: FoleySpec) => s.R.kind === 'swing' || s.L.kind === 'swing';
