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
};
