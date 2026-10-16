/**
 * One PLAN CASE = one plan as a lesson shows it (a lesson, a scene, a
 * variant): every object's footprint, every cable, the studio headphone
 * mix — built by each plan family from the same pure layout its drawing
 * uses. test/mikingPlanCollisions_20261015.test.ts checks every case (owner
 * 2026-10-15: no collisions or impossible layering in ANY plan; a personal
 * headphone mixer per performer in every studio plan).
 */
import { turnCable, turnRect, type PlanCable, type PlanFoot, type PlanRect } from '../planFoot.ts';
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

/** A plan that shows only the floor round the player: AUDIENCE · PA ↓ is
 *  printed in the strip past the deck's dashed edge at the plan's downstage
 *  (+u) edge, centred across it (BrassPlan, SaxPlan, LowBrassPlan, BowedPlan —
 *  drawn turned, so it is the plan's bottom edge); the house lies beyond. */
export function offPlanAudience(wide: PlanRect): PlanAudience {
  const cv = (wide.v0 + wide.v1) / 2;
  return { axis: 'u', dir: 1, lip: wide.u1, kind: 'direction', offPlan: true, marks: [{ u0: wide.u1 - 110 - 90, u1: wide.u1 - 110 + 90, v0: cv - 450, v1: cv + 450 }] };
}

export type PlanAudience = { axis: 'u' | 'v'; dir: 1 | -1; lip: number; kind: 'seats' | 'direction'; marks: PlanRect[]; offPlan?: boolean };

/** A STAGE case as its family DRAWS it turned (planFoot planTurn — DOWNSTAGE
 *  = BOTTOM, owner 2026-10-16): every footprint, cable, deck and audience
 *  mark in the turned frame, the audience then down the screen (+v). A turn
 *  keeps every distance, so the overlap checks read the same; the audience
 *  check reads the new direction. */
export function turnCase(c: PlanCase): PlanCase {
  const A = c.audience;
  return {
    ...c,
    foots: c.foots.map(turnRect),
    cables: c.cables.map(turnCable),
    ...(c.deck ? { deck: turnRect(c.deck) } : {}),
    ...(A ? { audience: { ...A, axis: A.axis === 'u' ? 'v' : 'u', dir: A.axis === 'u' ? A.dir : (-A.dir as 1 | -1), lip: A.axis === 'u' ? A.lip : -A.lip, marks: A.marks.map(turnRect) } } : {}),
  };
}
