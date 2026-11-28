/**
 * Both hands of a 3-D drummer closed on their sticks (grip.ts), cached per
 * pose — shared by the side view (kitDrummerV2) and the view from above
 * (topPlan). Pure.
 */
import type { DrummerPose3 } from '../kitScene/stickPose.ts';
import { stickHold, type StickHold } from './grip.ts';

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

