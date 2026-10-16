/**
 * M10 — the room plan's objects (PRoomSetting.tsx draws them): pure, so the
 * plans' overlap test (test/mikingPlanCollisions_20261015,
 * planCases/m10Room.ts) reads the same numbers the drawing uses.
 *
 * Frame: the KIT frame K (u = x toward the front wall / audience, v = z the
 * drummer's right), mm. LIVE: the kit, the stage monitors (M10_WEDGES — the
 * same places as every kit lesson, kitStage.ts) and the PA pair. STUDIO
 * (owner 2026-10-15): no wedges; the drummer's personal headphone mixer at
 * the drummer's right, behind the floor tom, fed from the CONTROL ROOM box
 * on the back wall (clear of the door and its walkway).
 */
import { foot, wedgeFoot, type PlanFoot, type PlanRect } from '../shared/planFoot.ts';
import { cueFootprints, type CueRig } from '../shared/monitoring/cueMix.ts';
import { kitCue, kitFoots } from '../shared/kitPlanLayout.ts';
import { DRUMMER } from '../shared/kitScene/kitSceneModel.ts';
import { ROOM } from './model.ts';
import { M10_WEDGES, PA } from './geometry.ts';

export type M10Where = 'studio' | 'live';

/** LIVE: how far the plan reaches past the stage's open front for the
 *  AUDIENCE direction (mm; the house itself is off the plan). */
export const LIVE_HOUSE = 700;
/** LIVE: the AUDIENCE mark beyond the stage's downstage edge. */
export const M10_AUDIENCE_MARK: PlanRect = { u0: ROOM.front + 60, u1: ROOM.front + LIVE_HOUSE - 60, v0: -1700, v1: 1700 };

/** The room's inner wall faces (the plan's top view). */
export const M10_PLAN_ROOM: PlanRect = { u0: ROOM.back, u1: ROOM.front, v0: ROOM.left, v1: ROOM.right };

/** The door and the walkway to the kit (the lesson's keep-out). */
export const M10_WALKWAY: PlanRect = { u0: ROOM.back, u1: -300, v0: ROOM.door.z0, v1: ROOM.door.z1 };

/** The studio headphone mix: the drummer's mixer (the kit plan's place),
 *  the phones on the drawn drummer's head, the box on the back wall. */
export function m10Cue(): CueRig {
  return kitCue(M10_PLAN_ROOM, { u: DRUMMER.headTop.x, v: DRUMMER.headTop.z });
}

/** The PA pair's plan rects (live). */
export function m10PaRects(): PlanRect[] {
  return [-1, 1].map((s) => ({ u0: PA.x - PA.d / 2, u1: PA.x + PA.d / 2, v0: s * PA.z - PA.w / 2, v1: s * PA.z + PA.w / 2 }));
}

/** Every object's footprint on the room plan (top view, mm). */
export function m10Foots(where: M10Where): PlanFoot[] {
  const out: PlanFoot[] = [...kitFoots(), foot('walkway', 'keepClear', M10_WALKWAY, { group: 'walkway', zone: true })];
  if (where === 'live') {
    for (const w of M10_WEDGES) if (w.glyph !== 'none') out.push(wedgeFoot(w));
    m10PaRects().forEach((r, i) => out.push(foot(`pa${i}`, 'pa', r)));
  } else out.push(...cueFootprints(m10Cue()));
  return out;
}
