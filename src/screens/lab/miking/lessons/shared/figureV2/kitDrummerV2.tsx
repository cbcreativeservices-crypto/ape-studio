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
import { KIT, KIT_FLOOR_Y, yAt } from '../kitPlanModel.ts';
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
/** The hi-hat pedal's footboard (CymbalArt.buildHiHatSide: from (u0, floor − 14) to (u1, floor − 52)). */
function hatSole(x: number): Sole {
  const h = KIT.hihatPedal;
  const a = P(h.u0, KIT_FLOOR_Y - 14);
  const b = P(h.u1, KIT_FLOOR_Y - 52);
  const t = (x - a.u) / (b.u - a.u);
  return {
    ball: P(x, a.v + (b.v - a.v) * t),
    slope: Math.atan2(a.v - b.v, b.u - a.u),
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

/** The side-view plan of the drummer playing `spec` (memoised through
 *  drummerPose / viewDrummer / sidePlan). */
export function kitDrummerPlan(spec: DrummerSpec = KIT_GROOVE): SidePlan {
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
    seatV: yAt(KIT.throne.seatH),
  });
}

/** The kit drummer from the player's right in the V2 look; the scene's own
 *  sticks are passed in so each passes through its fist. */
export function KitDrummerSideV2({ farStick, nearStick, spec = KIT_GROOVE }: { farStick?: ReactNode; nearStick?: ReactNode; spec?: DrummerSpec }) {
  return <FigureV2Side plan={kitDrummerPlan(spec)} farStick={farStick} nearStick={nearStick} />;
}
