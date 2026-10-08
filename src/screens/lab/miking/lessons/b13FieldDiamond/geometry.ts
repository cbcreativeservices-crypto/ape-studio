/**
 * B13 FIELD AND DIAMOND SPORTS — where things are (charter §2 layer 2): the
 * shared practice field as the engine's model (lessons/shared/sports/
 * practiceModels.ts; frame P → engine mm by venuePlan.toEngine: engine x =
 * along the touchline, engine z = −(into the field), engine y = −height).
 * The engine's top view (u = x, v = z) is the plan the usual way up — the
 * field above, the crew strip below.
 *
 * One variant: the PRACTICE FIELD (the Placement Studio scene). The real
 * sports (football, soccer, rugby, baseball, softball) are plan outlines on
 * the lesson's own pages (sportPlans.ts, owner decision D7-2 default).
 * Every place except the lesson's own marks is a drawing default (unknowns in
 * lesson.ts).
 */
import type { Vec3 } from '../../engine/model/types.ts';
import { toEngine } from '../shared/sports/venuePlan.ts';
import { PF, PF_CREW, SPEECH_H } from '../shared/sports/practiceScenes.ts';
import { fieldModel } from '../shared/sports/practiceModels.ts';

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** The targets and marks in engine millimetres. */
export const TGT = { A: toEngine(PF.A, SPEECH_H), B: toEngine(PF.B, SPEECH_H), C: toEngine(PF.C, SPEECH_H) } as const;
export const MARK = { M: toEngine(PF.M, 0), E: toEngine(PF.E, 0) } as const;

export const B13_MODEL = fieldModel('b13-field', 'LESSON-B13');

/** The crew strip in engine mm (for the zones' boxes). */
export const CREW_BOX = { min: v3(PF_CREW.x0 * 1000, -2500, -PF_CREW.y1 * 1000), max: v3(PF_CREW.x1 * 1000, 0, -PF_CREW.y0 * 1000) };
