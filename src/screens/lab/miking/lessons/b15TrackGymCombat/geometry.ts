/**
 * B15 TRACK, GYMNASTICS AND COMBAT SPORTS — where things are (charter §2
 * layer 2): the shared practice room (lessons/shared/sports/practiceScenes.ts
 * `practiceSmall`, ONE scene with B16 — correction B15-01) as the engine's
 * model. Frame P → engine mm by venuePlan.toEngine. The real venues (a
 * track start, gymnastics, a boxing ring, a wrestling mat, judo) are plan
 * outlines on the lesson's own pages (arenaPlans.ts, owner decision D7-2
 * default).
 */
import { smallModel } from '../shared/sports/practiceModels.ts';

export const B15_MODEL = smallModel('b15-room', 'LESSON-B15');
