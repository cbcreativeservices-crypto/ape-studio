/**
 * B16 MOTORSPORT, EQUESTRIAN AND AQUATIC EVENTS — where things are (charter
 * §2 layer 2): the shared practice room (practiceScenes.ts `practiceSmall` —
 * the same scene as B15, correction B15-01) as the engine's model. The real
 * venues (a circuit, a jumping arena, a pool, the optional hydrophone's
 * container) are plans on the lesson's own pages (arenaPlans.ts; D7-2, D7-3
 * and D7-4 defaults).
 */
import { smallModel } from '../shared/sports/practiceModels.ts';

export const B16_MODEL = smallModel('b16-room', 'LESSON-B16');
