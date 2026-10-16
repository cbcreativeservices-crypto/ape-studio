/**
 * One PLAN CASE = one plan as a lesson shows it (a lesson, a scene, a
 * variant): every object's footprint, every cable, the studio headphone
 * mix — built by each plan family from the same pure layout its drawing
 * uses. test/mikingPlanCollisions_20261015.test.ts checks every case (owner
 * 2026-10-15: no collisions or impossible layering in ANY plan; a personal
 * headphone mixer per performer in every studio plan).
 */
import type { PlanCable, PlanFoot, PlanRect } from '../planFoot.ts';
import type { CueRig } from '../monitoring/cueMix.ts';

export type PlanCase = {
  lesson: string;
  scene: 'stage' | 'studio';
  /** The renderer (for the report): 'backline', 'kitPlan', … */
  family: string;
  variant?: string;
  /** The studio room's inner wall faces (studio only). */
  room?: PlanRect;
  foots: PlanFoot[];
  cables: PlanCable[];
  /** Studio: the headphone mix (one or more distribution points). */
  cue: CueRig[];
  /** The performers this plan draws (or implies by a seat), by station id:
   *  each needs a station in the studio. `group` = their footprints' group
   *  (the phones cord may reach into it). */
  performers: { id: string; group?: string }[];
  /** Physically real stacking between different objects, with the reason. */
  allow?: { a: string; b: string; why: string }[];
  /** STAGE only: how the plan marks the audience (owner 2026-10-15: "if you
   *  are marking an audience area, there actually should — or could fit —
   *  one there"). `axis` + `dir`: the way to the audience; `lip`: the deck's
   *  downstage edge on that axis (beyond the plan's edge for a plan that
   *  shows only the floor round the player); `kind`: 'seats' (true-size
   *  chairs, the front row ≥ FRONT_ROW_GAP_MM past the lip) or 'direction'
   *  (the lip and an off-plan word / arrows beyond it); `marks`: the chairs',
   *  arrows' or words' plan rects. None in a studio. */
  audience?: PlanAudience;
  /** STAGE: the stage deck the plan draws (everything but the audience and
   *  its marks stands on it — expert review 2026-10-15: the kit's drummer
   *  and a cymbal stand hung off the deck's back corner in C02/C04/C08). */
  deck?: PlanRect;
};

/** A word's or an arrow's plan rect round its anchor (mm). */
export const markAt = (u: number, v: number, hu = 250, hv = 120): PlanRect => ({ u0: u - hu, u1: u + hu, v0: v - hv, v1: v + hv });

/** A plan that shows only the floor round the player: AUDIENCE · PA → is
 *  printed at the plan's downstage (+u) edge, top corner (BrassPlan, SaxPlan,
 *  LowBrassPlan, BowedPlan); the deck's edge lies beyond the plan. */
export function offPlanAudience(wide: PlanRect): PlanAudience {
  return { axis: 'u', dir: 1, lip: wide.u1, kind: 'direction', offPlan: true, marks: [{ u0: wide.u1 - 40 - 900, u1: wide.u1 - 40, v0: wide.v0 + 60 - 110, v1: wide.v0 + 60 + 60 }] };
}

export type PlanAudience = { axis: 'u' | 'v'; dir: 1 | -1; lip: number; kind: 'seats' | 'direction'; marks: PlanRect[]; offPlan?: boolean };
