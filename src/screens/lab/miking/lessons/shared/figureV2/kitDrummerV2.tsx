/**
 * FIGURE V2 — THE KIT DRUMMER, SIDE VIEW (the owner's example figure, D78,
 * 2026-11-22: Miking → Drum Overheads, "Meet it", from the player's right).
 *
 * The SAME 3-D drummer the kit scene draws (stickPose.drummerPose of
 * kitStrokes.KIT_GROOVE): the joints, the sticks, the fulcrums and the beads
 * are the pose's. What is new is how he is drawn (sidePlan / FigureV2Side):
 * each hand is the shared hand skeleton closed on its own stick at the pose's
 * fulcrum (grip.ts), each shoe stands ON its pedal's footboard (the kick
 * pedal under the right foot, the hi-hat pedal under the left — their own
 * drawn boards, KitSceneArt / CymbalArt), the thighs rest on the throne with
 * a contact shadow, the head bowed a little toward the snare.
 *
 * Pure helpers (`kitDrummerPlan`) for the test; the component for the art.
 */
import type { ReactNode } from 'react';
import { KIT, KIT_FLOOR_Y, hihatPedalGeom, yAt } from '../kitPlanModel.ts';
import { KICK_GEOM } from '../../m01Kick/geometry.ts';
import { drummerPose, viewDrummer, RIGHT_BALL, type DrummerPose3, type DrummerSpec } from '../kitScene/stickPose.ts';
import { KIT_GROOVE } from '../kitScene/kitStrokes.ts';
import { stickHold, type StickHold } from './grip.ts';
import { P } from './geom.ts';
import { sidePlan, type SidePlan, type Sole } from './sidePlan.ts';
import { FigureV2Side } from './FigureV2Side';

/** The kick pedal's footboard (KitSceneArt.buildKickSide: from the heel plate
 *  at (x0, floor − 8) up to (x1 − 60, top + 6)) under the ball at `x`. */
function kickSole(x: number): Sole {
  const p = KICK_GEOM.pedal;
  const a = P(p.x0, KICK_GEOM.yFloor - 8);
  const b = P(p.x1 - 60, p.top + 6);
  const t = (x - a.u) / (b.u - a.u);
  return {
    ball: P(x, a.v + (b.v - a.v) * t),
    slope: Math.atan2(a.v - b.v, b.u - a.u),
  };
}
/** The hi-hat pedal's footboard seen from the side (CymbalArt.buildHiHatSide:
 *  the pedal angled toward the throne, foreshortened, from its heel end up to
 *  its toe end) under the ball at `x`; the shoe on it is turned with the
 *  pedal, so it is drawn foreshortened too (2026-11-23: "left foot should be
 *  on hi hat pedal"). */
function hatSole(x: number): Sole {
  const g = hihatPedalGeom();
  const a = P(g.heel.u, KIT_FLOOR_Y - g.heelH);
  const b = P(g.toe.u, KIT_FLOOR_Y - g.toeH);
  const t = (x - a.u) / (b.u - a.u);
  return {
    ball: P(x, a.v + (b.v - a.v) * t),
    slope: Math.atan2(a.v - b.v, b.u - a.u),
    along: Math.abs(g.dir.u),
  };
}

export type KitHolds = { R: StickHold; L: StickHold };
const holdsCache = new WeakMap<DrummerPose3, KitHolds>();
/** Both hands closed on their sticks for a 3-D drummer (cached). */
export function kitHolds(d: DrummerPose3): KitHolds {
  const hit = holdsCache.get(d);
  if (hit) return hit;
  const arm = (a: DrummerPose3['R']) =>
    stickHold({
      hand: a.hand,
      elbow: a.elbow,
      wrist: a.wrist,
      fulcrum: a.fulcrum,
      bead: a.bead,
    });
  const out = { R: arm(d.R), L: arm(d.L) };
  holdsCache.set(d, out);
  return out;
}

/** The forearm's tilt toward the viewer (+z): the sine of its angle out of the picture. */
const tiltOf = (a: { elbow: { x: number; y: number; z: number }; wrist: { x: number; y: number; z: number } }) => {
  const dx = a.wrist.x - a.elbow.x;
  const dy = a.wrist.y - a.elbow.y;
  const dz = a.wrist.z - a.elbow.z;
  return dz / (Math.hypot(dx, dy, dz) || 1);
};

/** The side-view plan of the drummer playing `spec` (memoised through
 *  drummerPose / viewDrummer / sidePlan). */
export function kitDrummerPlan(spec: DrummerSpec = KIT_GROOVE, extra: { farBehind?: boolean } = {}): SidePlan {
  const d = drummerPose(spec);
  const v = viewDrummer(d, 'side');
  const h = kitHolds(d);
  return sidePlan(v.pose, {
    holdR: h.R,
    holdL: h.L,
    soleR: kickSole(RIGHT_BALL.x),
    soleL: hatSole(v.pose.footL.u),
    nod: 8,
    awayR: d.R.wrist.z < d.R.elbow.z - 60,
    awayL: d.L.wrist.z < d.L.elbow.z - 60,
    tiltR: tiltOf(d.R),
    tiltL: tiltOf(d.L),
    seatV: yAt(KIT.throne.seatH),
    ...extra,
  });
}

/** The kit drummer from the player's right in the V2 look; the scene's own
 *  sticks are passed in so each passes through its fist. */
export function KitDrummerSideV2({ farStick, nearStick, spec = KIT_GROOVE }: { farStick?: ReactNode; nearStick?: ReactNode; spec?: DrummerSpec }) {
  return <FigureV2Side plan={kitDrummerPlan(spec)} farStick={farStick} nearStick={nearStick} />;
}
