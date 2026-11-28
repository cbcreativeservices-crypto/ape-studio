/**
 * FIGURE V2 — THE CONDUCTOR WITH A BATON (wave 6 of D78, the ensembles;
 * 2026-11-24). One 3-D pose of the arms, projected in each view the seatings
 * draw a conductor:
 *   • 'back'  the front elevation, seen from the hall: his BACK to us
 *             (FigureV2Back), the arms raised before him;
 *   • 'side'  the section, from his right: in profile (PersonSideV2, the arms
 *             drawn here);
 *   • 'top'   the plan, from above (PersonTopV2 standing, the arms drawn here).
 *
 * THE BEAT POSITION (drawing default): both upper arms raised forward and out
 * from the shoulders, the elbows well away from the body (about 150 mm out
 * past each shoulder), the forearms rising forward to the hands a little below
 * shoulder height in front of the chest.
 *
 * THE BATON GRIP (the standard grip taught to conductors): the baton's bulb (a
 * cork handle) rests IN THE PALM, toward its heel; the shaft leaves the hand
 * between the THUMB'S PAD and the SIDE OF THE INDEX finger at its first joint,
 * the thumb pressing it there; the other three fingers curl loosely round the
 * bulb. Modeled as ONE 3-D hand (heldHands.ts, read only: its grip model and
 * projection) closed round the bulb as round a short handle — the bulb across
 * the palm from the heel toward the index, the fingers round one side of it,
 * the thumb round the OTHER, their ends meeting on the shaft's side — and the
 * shaft carried on from the thumb–index notch, pointing forward, a little up
 * and in, about as the forearm points. The baton: 380 mm, the bulb 60 mm long
 * and 22 mm thick, the white shaft tapering from 6 mm to 2.4 mm.
 *
 * THE LEFT HAND: open, the palm toward the players, the fingers up and
 * together (the approved relaxed hand: 'restTop' seen from its back, the thumb
 * on the side toward his middle; 'restSide' edge-on where the view looks along
 * it).
 *
 * The approved hands' rules hold: fingers one side of the bulb, the thumb the
 * other; the thumb grows out of the hand; one knuckle row, low swells.
 */
import { memo, type ReactNode } from 'react';
import { Group, LinearGradient, Paint, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale, levelOf, useFigureScale } from './detail';
import { LIGHT, P, add, limbOutline, lerp, mul, sub, unit, type Pt } from './geom.ts';
import { across, AuthoredHand, Folds, Form } from './paint';
import { artPaths, smoothClosed, unionOf, type SkPath } from './paths.ts';
import { heldFrame, placeGrip, type PlacedGrip, type V3 } from './heldHands.ts';
import { HeldHand } from './heldHandV2';
import { placeRest, type PlacedHand } from './authoredHands.ts';
import { FigureLook, useLook } from './look';
import type { CastMember } from './cast';
import type { Material } from './palette.ts';
import { lens } from './sidePlan.ts';
import { SHIRT_CUFF_SHOWS } from './jacketPlan.ts';
import { JACKET_DEFAULT } from './jacketV2';
import { BACK_STANDING } from './backPlan.ts';
import { backPaths, personBackPlan, PersonBackV2 } from './FigureV2Back';
import { PersonSideV2, PersonTopV2 } from './personV2';
import { SINGER_SIDE } from '../voice/voicePose.ts';
import { poseOnTalker } from '../broadcast/talkerPose.ts';
import { standingAbovePose } from './markerPose.ts';
import type { PlayerPose } from '../players/playerPose.ts';

/* ── the pose (his own frame: x his right, y up, z forward toward the players; mm) ── */

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const add3 = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul3 = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit3 = (a: V3): V3 => mul3(a, 1 / (len3(a) || 1));

/** The arms from each shoulder: the elbow, then the wrist; the baton's aim; the open hand's fingers. */
export const CONDUCTOR_POSE = {
  // (Ensembles3, reviewer 2026-11-24: "goalpost" arms) the upper arms hang more, forward and a little out (the
  // elbows ≈ 130 mm out past the shoulders, ≈ 230 below them); the right forearm rises forward to the baton hand a
  // little below shoulder height; the open left hand is held higher and nearer the body, ready to cue — so from his
  // right the two hands never lie over each other
  R: { toElbow: v3(130, -230, 150), toWrist: v3(-40, 120, 215) },
  L: { toElbow: v3(-140, -240, 120), toWrist: v3(30, 200, 150) },
  /** The baton's direction: forward, a little up and in toward his middle — about 36° off the forearm's line
   *  (the bulb lies across the palm about 62° off the hand's own axis; the wrist bends toward the little
   *  finger the rest, about 26°: the baton reads as the arm carried on). */
  // (Ensembles3: from behind the baton must be seen in his hand — rising forward and a little in, its tip above
  // his right shoulder beside the head, never wholly hidden behind his head and back)
  aim: unit3(v3(-0.34, 0.84, 0.46)),
  /** The open left hand's fingers: up, a little forward and in. */
  fingersL: unit3(v3(0.1, 0.62, 0.78)),
} as const;

/** The baton (mm): its whole length, the bulb's length and radius, the shaft's radii at the bulb and the tip;
 *  `butt`: where the bulb's end lies along the grip's handle line from the fist's middle (toward the heel). */
export const BATON = { len: 380, bulb: 60, bulbR: 11, shaft0: 3, shaft1: 1.2, butt: -30 } as const;

/** The fist's middle on the bulb, from the wrist along the forearm (mm). */
const FIST_FROM_WRIST = 62;

/** A view: a direction in his frame → (u, v on the page, depth toward the viewer). */
export type CondDir = (p: V3) => V3;
export type CondView = 'back' | 'side' | 'top';

/** The view's map for the three drawings (his frame → the page; the side view from his right, facing +u). */
export const COND_DIR: Record<CondView, CondDir> = {
  back: (p) => v3(p.x, -p.y, -p.z),
  side: (p) => v3(p.z, -p.y, p.x),
  top: (p) => v3(p.x, -p.z, p.y),
};

/* ── the bodies the arms join (each view's own drawing; origin: the floor under him, or his neck from above) ── */

// (Ensembles3, reviewer: "profile: one leg reads") his far foot a fuller step back than the side figure's own
// (sidePlan sets it 95 mm behind) — the conductor's open stance — so the far leg shows clear of the near one from
// the calf down (a drawing default)
const SIDE_POSE: PlayerPose = {
  ...SINGER_SIDE,
  kneeL: P(SINGER_SIDE.kneeL.u - (SINGER_SIDE.facing ?? 1) * 34, SINGER_SIDE.kneeL.v),
  footL: P(SINGER_SIDE.footL.u - (SINGER_SIDE.facing ?? 1) * 95, SINGER_SIDE.footL.v),
};
const SIDE_LEFT: PlayerPose = poseOnTalker(SIDE_POSE, { id: 'condLeft', lip: { x: 0, y: 0, z: 0 }, facing: -1 } as never);

type Body = { shoulders: { R: Pt; L: Pt }; place: { u: number; v: number } };
function bodyOf(view: CondView, who: CastMember, facing: 1 | -1): Body {
  if (view === 'back') {
    const B = personBackPlan(BACK_STANDING, who, { jacket: true });
    const fl = BACK_STANDING.floor ?? 0;
    const cx = (BACK_STANDING.shoulderR.u + BACK_STANDING.shoulderL.u) / 2;
    const at = (q: Pt) => P(q.u - cx, q.v - fl);
    const R = B.arms.find((a) => a.side === 1)!.shoulder;
    const L = B.arms.find((a) => a.side === -1)!.shoulder;
    // (the sleeve's root a little in and up from the drawn shoulder point: the arm rises out of the deltoid)
    return { shoulders: { R: at(P(R.u - 14, R.v - 6)), L: at(P(L.u + 14, L.v - 6)) }, place: { u: -cx, v: -fl } };
  }
  if (view === 'side') {
    const pose = facing > 0 ? SIDE_POSE : SIDE_LEFT;
    const fl = pose.floor ?? 0;
    const nu = pose.neck.u;
    const at = (q: Pt) => P(q.u - nu, q.v - fl);
    return { shoulders: { R: at(pose.shoulderR), L: at(pose.shoulderL) }, place: { u: -nu, v: -fl } };
  }
  // from above: the standing figure round its neck, facing up the page
  return { shoulders: { R: P(176, 6), L: P(-176, 6) }, place: { u: 0, v: 0 } };
}

/** A placed hand shortened along its own length about the wrist (a hand leaning toward or away from the viewer). */
function foreshorten(h: PlacedHand, W: Pt, k: number): PlacedHand {
  if (k >= 0.999) return h;
  const ex = h.ex;
  const f = (p: Pt): Pt => {
    const d = sub(p, W);
    const a = d.u * ex.u + d.v * ex.v;
    return add(p, mul(ex, a * (k - 1)));
  };
  const fe = (e: { c: Pt; rx: number; ry: number; rot: number }) => ({ ...e, c: f(e.c), rx: Math.abs(Math.cos(e.rot - Math.atan2(ex.v, ex.u))) > 0.7 ? e.rx * k : e.rx });
  return {
    ...h,
    at: (p: Pt) => f(h.at(p)),
    F: f(h.F),
    parts: h.parts.map((q) => ({ ...q, placed: q.placed.map(f), placedAxis: [f(q.placedAxis[0]), f(q.placedAxis[1])] as [Pt, Pt], placedChain: q.placedChain ? { pts: q.placedChain.pts.map(f), r: q.placedChain.r } : null, placedEdge: q.placedEdge ? q.placedEdge.map(f) : null, placedShade: q.placedShade ? ([f(q.placedShade[0]), f(q.placedShade[1])] as [Pt, Pt]) : null })),
    creases: h.creases.map((c) => c.map(f)),
    ...(h.gaps ? { gaps: h.gaps.map((c) => c.map(f)) } : {}),
    ...(h.contact ? { contact: h.contact.map(fe) } : {}),
    nails: h.nails.map((c) => c.map(f)),
    warm: h.warm.map((w) => ({ c: f(w.c), r: w.r })),
    lights: h.lights.map(fe),
    darks: h.darks.map(fe),
    thumbTip: h.thumbTip ? f(h.thumbTip) : null,
    knuckle: f(h.knuckle),
  };
}

/* ── the arms, planned in a view ── */

export type CondArm = {
  side: 'R' | 'L';
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
  /** The shirt's sleeve, shoulder to the cuff (closed); the cuff band; folds at the elbow. */
  sleeve: Pt[];
  /** The same sleeve's two halves, shoulder to elbow and elbow to the cuff (closed). */
  upper: Pt[];
  fore: Pt[];
  /** (from behind) the back of the armpit: the cloth from under the raised arm onto the torso's side (closed). */
  web: Pt[] | null;
  cuff: Pt[];
  folds: Pt[][];
  /** The arm's depth toward the viewer at the shoulder, the elbow and the hand. */
  depth: { shoulder: number; elbow: number; hand: number };
  grip: PlacedGrip | null;
  open: PlacedHand | null;
  /** The baton on the page: the bulb's end, the bulb's top (into the shaft), the tip. */
  baton: { butt: Pt; neck: Pt; tip: Pt; depthTip: number } | null;
};

export type CondPlan = { view: CondView; facing: 1 | -1; place: { u: number; v: number }; arms: { R: CondArm; L: CondArm } };

const planCache = new Map<string, CondPlan>();

/** The conductor's arms in a view (memoised per view, person and facing). */
export function conductorPlan(view: CondView, who: CastMember, facing: 1 | -1 = 1): CondPlan {
  const key = `${view}|${who.id}|${facing}`;
  const hit = planCache.get(key);
  if (hit) return hit;
  const dir0 = COND_DIR[view];
  const dir: CondDir = view === 'side' && facing < 0 ? (p) => v3(-p.z, -p.y, -p.x) : dir0;
  const body = bodyOf(view, who, facing);
  const pg = (d: V3) => {
    const q = dir(d);
    return P(q.x, q.y);
  };
  // the viewer's direction in his frame (the depth axis pulled back through the map)
  const toward = unit3(v3(dir(v3(1, 0, 0)).z, dir(v3(0, 1, 0)).z, dir(v3(0, 0, 1)).z));
  const arm = (side: 'R' | 'L'): CondArm => {
    const A = CONDUCTOR_POSE[side];
    const S = side === 'R' ? body.shoulders.R : body.shoulders.L;
    // his frame's points, the shoulder at the origin of the arm (the page's shoulder is the drawn body's)
    const E3 = A.toElbow;
    const W3 = add3(E3, A.toWrist);
    const at = (p3: V3) => add(S, pg(p3));
    const E = at(E3);
    const W = at(W3);
    const dz = (p3: V3) => dir(p3).z;
    const df = unit(sub(W, E));
    const cuffA = sub(W, mul(df, 34));
    const cuffB = sub(W, mul(df, 12));
    const rootIn = sub(S, mul(unit(sub(E, S)), 26));
    // HIS JACKET'S SLEEVE (the cast's dress variant): over the shirt's, ending SHIRT_CUFF_SHOWS short of the shirt cuff's
    // end, so a strip of the cuff shows at the wrist
    const jEnd = sub(cuffB, mul(df, SHIRT_CUFF_SHOWS));
    // (Ensembles3) a real taper: the deltoid fullest, narrower at the elbow, the forearm narrowing to the cuff
    const sleeve = limbOutline([rootIn, S, lerp(S, E, 0.45), E, lerp(E, jEnd, 0.5), jEnd], [44, 50, 45.5, 40, 38.5, 37], { capEnd: false });
    // (the two halves, for a view that sees the forearm go away behind the elbow: from behind)
    // (from behind the root runs down and in under the shoulder's top, never a round end above it: the top line
    // goes on from the trapezius over the deltoid into the arm)
    const outB = Math.sign(E.u - S.u) || 1;
    const upper = view === 'back' ? limbOutline([add(S, P(-outB * 26, 26)), add(S, P(-outB * 6, 6)), lerp(S, E, 0.45), E], [40, 50, 45.5, 40]) : limbOutline([rootIn, S, lerp(S, E, 0.45), E], [44, 50, 45.5, 40]);
    // (the forearm starts as wide as the elbow's round — the bend closed with cloth, never a corner)
    const fore = limbOutline([sub(E, mul(df, 14)), E, lerp(E, jEnd, 0.5), jEnd], [40, 40, 38.5, 37], { capEnd: false });
    // (from behind) the cloth from under the raised arm down onto the torso's side — the back of the armpit: the
    // shirt runs on from the back into the sleeve, one silhouette, no step where the arm leaves the body
    const out = Math.sign(E.u - S.u) || 1;
    const du = unit(sub(E, S));
    const under = add(lerp(S, E, 0.42), mul(P(du.v, -du.u), du.v * out < 0 ? -40 : 40));
    const web = view === 'back' ? [add(S, P(-out * 34, -8)), add(S, P(out * 10, -6)), add(lerp(S, E, 0.3), P(0, 0)), under, add(S, P(-out * 18, 150)), add(S, P(-out * 40, 120))] : null;
    const cuff = limbOutline([sub(cuffA, mul(df, 2)), cuffB], [34, 33.4], { capStart: false, capEnd: false });
    const folds = [lens(add(E, P(-14, -16)), add(E, P(16, 10)), 4, 2), lens(add(lerp(E, cuffA, 0.4), P(-12, -6)), add(lerp(E, cuffA, 0.4), P(14, 6)), 3.6, -2)];
    let grip: PlacedGrip | null = null;
    let open: PlacedHand | null = null;
    let baton: CondArm['baton'] = null;
    const fore3 = unit3(A.toWrist);
    if (side === 'R') {
      // the fist round the bulb: its middle a hand's length on from the wrist, the bulb across the palm
      // the wrist bent toward the little finger: the hand's axis turned from the forearm, away from the baton, so
      // the bulb lies across the palm at the grip model's angle (62° off the hand) while the baton points as aimed
      const b = CONDUCTOR_POSE.aim;
      const fb = fore3.x * b.x + fore3.y * b.y + fore3.z * b.z;
      const g3 = unit3(add3(b, mul3(fore3, -fb)));
      const dev = Math.max(0, (62 * Math.PI) / 180 - Math.acos(Math.min(1, fb)));
      const hand3 = unit3(add3(mul3(fore3, Math.cos(dev)), mul3(g3, -Math.sin(dev))));
      const fist3 = add3(W3, mul3(hand3, FIST_FROM_WRIST));
      const fr = heldFrame(add3(fist3, mul3(hand3, -300)), fist3, b, 'R', v3(1, 0, 0));
      const proj = (p3: V3) => at(p3);
      // (`back`: the lesson arms' low knuckle swells and the creases that start at the tips — never a block)
      grip = placeGrip(fist3, fr, toward, proj, BATON.bulbR, { wristFrom2: cuffB, back: true });
      // the baton along the grip's own handle line (the model's bulb axis), out past the thumb and index
      const h3 = unit3(add3(mul3(grip.frame.U, Math.tan(grip.frame.beta)), grip.frame.W));
      const pAt = (t: number) => proj(add3(fist3, mul3(h3, t)));
      baton = { butt: pAt(BATON.butt), neck: pAt(BATON.butt + BATON.bulb), tip: pAt(BATON.butt + BATON.len), depthTip: dz(add3(fist3, mul3(h3, BATON.butt + BATON.len))) };
    } else {
      // the open hand, its back toward the viewer behind him, the fingers up; edge-on where the view looks along its palm
      const fingers = pg(CONDUCTOR_POSE.fingersL);
      const d = Math.atan2(fingers.v, fingers.u);
      const backOn = Math.abs(toward.z) > 0.6;
      // (the thumb toward his middle: +x in his frame)
      const thumbWay = pg(v3(1, 0, 0));
      // (the hand foreshortened along its length as its fingers lean toward or away from the viewer)
      const k = Math.max(0.35, Math.sqrt(Math.max(0, 1 - (dir(CONDUCTOR_POSE.fingersL).z) ** 2)));
      open = foreshorten(placeRest(backOn ? 'restTop' : 'restSide', cuffB, d, Math.hypot(thumbWay.u, thumbWay.v) > 0.2 ? thumbWay : P(0, -1)), cuffB, k);
    }
    return {
      side,
      shoulder: S,
      elbow: E,
      wrist: W,
      sleeve,
      upper,
      fore,
      web,
      cuff,
      folds,
      depth: { shoulder: 0, elbow: dz(E3), hand: dz(W3) },
      grip,
      open,
      baton,
    };
  };
  const out: CondPlan = { view, facing, place: body.place, arms: { R: arm('R'), L: arm('L') } };
  planCache.set(key, out);
  return out;
}

/* ── the drawing ── */

const bodyCache = new WeakMap<CondArm, { sleeve: SkPath; upper: SkPath; fore: SkPath; cuff: SkPath; folds: SkPath; open: ReturnType<typeof artPaths> | null; bulb: SkPath | null; shaft: SkPath | null }>();
function armPaths(a: CondArm) {
  const hit = bodyCache.get(a);
  if (hit) return hit;
  const folds = smoothClosed([], 0.5);
  for (const f of a.folds) folds.addPath(smoothClosed(f, 0.5));
  const b = a.baton;
  const out = {
    sleeve: a.web ? unionOf(smoothClosed(a.sleeve, 0.45), smoothClosed(a.web, 0.5)) : smoothClosed(a.sleeve, 0.45),
    upper: a.web ? unionOf(smoothClosed(a.upper, 0.45), smoothClosed(a.web, 0.5)) : smoothClosed(a.upper, 0.45),
    fore: smoothClosed(a.fore, 0.45),
    cuff: smoothClosed(a.cuff, 0.3),
    folds,
    open: a.open ? artPaths(a.open, null) : null,
    bulb: b ? smoothClosed(limbOutline([b.butt, lerp(b.butt, b.neck, 0.35), lerp(b.butt, b.neck, 0.8), b.neck], [BATON.bulbR - 1.5, BATON.bulbR, BATON.bulbR - 2.6, BATON.shaft0 + 1])) : null,
    shaft: b ? smoothClosed(limbOutline([b.neck, b.tip], [BATON.shaft0, BATON.shaft1])) : null,
  };
  bodyCache.set(a, out);
  return out;
}

const CORK: Material = { form: ['#c9a57a', '#b08a5e', '#8e6a44', '#5e4128', '#6e4e33'], pos: [0, 0.2, 0.52, 0.8, 1], rim: '#ecd3b0', edge: '#3a2716', deep: '#2e1d10' };
const SHAFT: Material = { form: ['#fbfaf6', '#ece8df', '#cfc9bc', '#9d978b', '#aaa498'], pos: [0, 0.2, 0.52, 0.8, 1], rim: '#ffffff', edge: '#6c675d', deep: '#5a564d' };

function Baton({ a, part }: { a: CondArm; part: 'shaft' | 'bulb' | 'all' }) {
  const P0 = armPaths(a);
  if (!a.baton || !P0.shaft || !P0.bulb) return null;
  const b = a.baton;
  const [s, e] = across(b.neck, b.tip, 4);
  return (
    <Group>
      {part !== 'bulb' ? (
        <Group>
          <Path path={P0.shaft}>
            <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={SHAFT.form} positions={SHAFT.pos} />
          </Path>
          <Path path={P0.shaft} style="stroke" strokeWidth={0.5} color={SHAFT.edge} opacity={0.6} />
        </Group>
      ) : null}
      {part !== 'shaft' ? <Form path={P0.bulb} mat={CORK} axis={[b.butt, b.neck]} w={11} rim={2} edge={0.6} /> : null}
    </Group>
  );
}

function Sleeve({ a, mat, over, half }: { a: CondArm; mat: Material; over?: SkPath | null; half?: 'upper' | 'fore' }) {
  const P0 = armPaths(a);
  const path = half === 'upper' ? P0.upper : half === 'fore' ? P0.fore : P0.sleeve;
  return (
    <Group>
      <Form path={path} mat={mat} axis={half === 'fore' ? [a.elbow, a.wrist] : [a.shoulder, a.elbow]} w={half === 'fore' ? 36 : 42} rim={5} edge={0.9} fall={0.08} over={over ?? null}>
        <Folds path={P0.folds} mat={mat} opacity={0.45} />
      </Form>
    </Group>
  );
}

function Hand({ a, mat, lite }: { a: CondArm; mat: Material; lite: boolean }) {
  const { MAT } = useLook();
  const P0 = armPaths(a);
  return (
    <Group>
      {/* (looking down the baton from its butt, the bulb lies behind the fist: drawn first, the hand over it) */}
      {a.grip && a.grip.order[a.grip.order.length - 1] === 'MIC' ? <Baton a={a} part="bulb" /> : null}
      {a.grip ? <HeldHand h={a.grip} mic={a.grip.order[a.grip.order.length - 1] === 'MIC' ? null : <Baton a={a} part="bulb" />} /> : null}
      {P0.open ? <AuthoredHand a={P0.open} /> : null}
      {/* the cuff over the wrist, its soft shadow on the skin */}
      {!lite ? (
        <Group transform={[{ translateX: -LIGHT.u * 2 }, { translateY: -LIGHT.v * 2 }]}>
          <Path path={P0.cuff} color={MAT.skin.deep} opacity={0.3}>
            <Blur mm={2.4} />
          </Path>
        </Group>
      ) : null}
      <Form path={P0.cuff} mat={mat} axis={[a.elbow, a.wrist]} w={34} rim={lite ? 0 : 3} edge={0.9} />
    </Group>
  );
}

/**
 * (Ensembles3, reviewer 2026-11-24: "each upper arm starts as a round ball cap sitting on top of the jacket
 * shoulder") THE SLEEVE GROWS OUT OF THE JACKET'S SHOULDER — BoomV2's shoulderRoot rule: off the body, nothing of
 * the sleeve behind a line across the shoulder (square to the upper arm, 6 mm back from the shoulder point) is
 * drawn; over the body the sleeve's first 34 mm fade into the jacket's back (one cloth, no edge, no cap).
 */
const rootCache = new WeakMap<CondArm, { behindOff: SkPath; plane: SkPath; from: Pt; to: Pt }>();
function rootOf(a: CondArm, body: SkPath) {
  const hit = rootCache.get(a);
  if (hit) return hit;
  const s = a.shoulder;
  const du = unit(sub(a.elbow, s));
  const n = P(-du.v, du.u);
  const far = 5000;
  const o = sub(s, mul(du, 6));
  const half = Skia.Path.Make();
  half.moveTo(o.u + n.u * far, o.v + n.v * far);
  half.lineTo(o.u + n.u * far + du.u * far, o.v + n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far + du.u * far, o.v - n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far, o.v - n.v * far);
  half.close();
  const plane = Skia.Path.Make();
  plane.addRect(Skia.XYWHRect(s.u - far, s.v - far, 2 * far, 2 * far));
  const behind = Skia.Path.MakeFromOp(plane, half, PathOp.Difference) ?? Skia.Path.Make();
  const out = { behindOff: Skia.Path.MakeFromOp(behind, body, PathOp.Difference) ?? behind, plane, from: sub(o, mul(du, 20)), to: add(o, mul(du, 64)) };
  rootCache.set(a, out);
  return out;
}
function RootFromShoulder({ a, body, children }: { a: CondArm; body: SkPath | null; children: ReactNode }) {
  if (!body) return <Group>{children}</Group>;
  const r = rootOf(a, body);
  return (
    <Group layer={<Paint />}>
      {children}
      <Path path={r.behindOff} color="black" blendMode="dstOut" />
      {/* over the back the sleeve's root fades into the back's own cloth over its first 64 mm (no panel of sleeve
          laid on the back, no edge) */}
      <Group clip={body}>
        <Path path={r.plane} blendMode="dstOut">
          <LinearGradient start={vec(r.from.u, r.from.v)} end={vec(r.to.u, r.to.v)} colors={['black', 'black', 'rgba(0,0,0,0)']} positions={[0, 0.35, 1]} />
        </Path>
      </Group>
    </Group>
  );
}

/** The conductor's two arms with the baton, in a view, at the order that view needs round `body`. */
function ConductorArms({ plan, body, shirtOver }: { plan: CondPlan; body: ReactNode; shirtOver: SkPath | null }) {
  const { MAT } = useLook();
  const lite = useFigureScale().level === 'lite';
  const { R, L } = plan.arms;
  // (his jacket over the shirt: the sleeves are the jacket's; the shirt shows at the cuffs)
  const shirt = useLook().JACKET ?? JACKET_DEFAULT;
  const cuffMat = MAT.shirt;
  if (plan.view === 'back') {
    // seen from behind: the baton, the hands and the forearms reach forward, away from us — farther than his back
    // and the upper arms (drawn first; the body and the upper arms hide what they cover); the upper arms rise out
    // of the shoulders over the shirt (no edge there)
    return (
      <Group>
        <Baton a={R} part="shaft" />
        {[L, R].map((a) => (
          <Group key={`f${a.side}`}>
            <Hand a={a} mat={cuffMat} lite={lite} />
            <Sleeve a={a} mat={shirt} half="fore" />
          </Group>
        ))}
        {body}
        {[L, R].map((a) => (
          <RootFromShoulder key={`u${a.side}`} a={a} body={shirtOver}>
            <Sleeve a={a} mat={shirt} over={shirtOver} half="upper" />
          </RootFromShoulder>
        ))}
      </Group>
    );
  }
  if (plan.view === 'side') {
    // from his right: the left arm behind the body, the right (baton) arm before it
    const near = plan.facing > 0 ? R : L;
    const far = plan.facing > 0 ? L : R;
    return (
      <Group>
        <Group>
          <Hand a={far} mat={cuffMat} lite={lite} />
          <Sleeve a={far} mat={shirt} />
          {far.baton ? <Baton a={far} part="shaft" /> : null}
        </Group>
        {body}
        {near.baton ? <Baton a={near} part="shaft" /> : null}
        <Hand a={near} mat={cuffMat} lite={lite} />
        <Sleeve a={near} mat={shirt} over={shirtOver} />
      </Group>
    );
  }
  // from above: the arms below the shoulders (the body over their roots), the baton out before him
  return (
    <Group>
      {[L, R].map((a) => (
        <Group key={a.side}>
          {a.baton ? <Baton a={a} part="shaft" /> : null}
          <Hand a={a} mat={cuffMat} lite={lite} />
          <Sleeve a={a} mat={shirt} />
        </Group>
      ))}
      {body}
    </Group>
  );
}

/** (from behind) beside the back under each raised upper arm: outside the line from the armpit (just in from the
 *  shoulder point, 70 mm down) to the inside of the elbow, from the armpit down to the waist. */
const underCache = new WeakMap<CondPlan, SkPath>();
function underArms(plan: CondPlan): SkPath {
  const hit = underCache.get(plan);
  if (hit) return hit;
  const p = Skia.Path.Make();
  for (const a of [plan.arms.R, plan.arms.L]) {
    const s = Math.sign(a.elbow.u - a.shoulder.u) || 1;
    const A = add(a.shoulder, P(-s * 28, 70));
    const B = add(a.elbow, P(-s * 36, 0));
    // (down to just below the armpit, the cut's lower end easing back out to the back's own side line)
    const pts = [A, B, P(B.u + s * 400, B.v), P(B.u + s * 400, A.v + 120), P(A.u + s * 14, A.v + 120), P(A.u + s * 2, A.v + 60)];
    p.moveTo(pts[0].u, pts[0].v);
    for (const q of pts.slice(1)) p.lineTo(q.u, q.v);
    p.close();
  }
  underCache.set(plan, p);
  return p;
}

/** (from behind) his shirt's back where the body is placed: the upper arms lie over it with a soft seam, no edge. */
const shirtCache = new Map<string, SkPath>();
function backShirt(who: CastMember, place: { u: number; v: number }): SkPath {
  const hit = shirtCache.get(who.id);
  if (hit) return hit;
  const bp = backPaths(personBackPlan(BACK_STANDING, who, { jacket: true }));
  const p = (bp.jacket?.body ?? bp.shirt).copy();
  p.offset(place.u, place.v);
  shirtCache.set(who.id, p);
  return p;
}

/**
 * The conductor, drawn in a view (origin: the floor point between his feet in elevation; his neck from above,
 * facing up the page). Full detail at close-up sizes, lite at lesson sizes.
 */
export const ConductorV2 = memo(function ConductorV2({ who, view, facing = 1, assumePtPerMm }: { who: CastMember; view: CondView; facing?: 1 | -1; assumePtPerMm?: number }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const plan = conductorPlan(view, who, facing);
  const place = [{ translateX: plan.place.u }, { translateY: plan.place.v }];
  const body =
    view === 'back' ? (
      // (Ensembles3) the jacket's back as drawn for hanging arms keeps its armhole corners: with the arms raised out
      // they would stand past the back's side under each sleeve as flaps — cut away outside the armpit's line
      <Group clip={underArms(plan)} invertClip>
        <Group transform={place}>
          <PersonBackV2 pose={BACK_STANDING} who={who} arms={false} opts={{ jacket: true }} />
        </Group>
      </Group>
    ) : view === 'side' ? (
      <Group transform={place}>
        <PersonSideV2 pose={facing > 0 ? SIDE_POSE : SIDE_LEFT} who={who} opts={{ noArm: 'both', rest: 'restSide', jacket: true }} />
      </Group>
    ) : (
      <Group transform={[{ rotate: -Math.PI }]}>
        <PersonTopV2 pose={standingAbovePose()} who={who} opts={{ jacket: true }} />
      </Group>
    );
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <ConductorArms plan={plan} body={body} shirtOver={view === 'back' ? backShirt(who, plan.place) : null} />
      </FigureLook>
    </FigureScale>
  );
});
