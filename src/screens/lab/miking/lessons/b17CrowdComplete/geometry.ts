/**
 * B17 CROWD AND COMPLETE SPORTS COVERAGE — where things are (charter §2
 * layer 2): the shared mock venue (practiceScenes.ts `practiceCrowd`) as the
 * engine's model. The indoor arena with its seating bowl is a plan on the
 * lesson's own pages (arenaPlans.ts, D7-2 default).
 */
import { crowdModel } from '../shared/sports/practiceModels.ts';

export const B17_MODEL = crowdModel('b17-venue', 'LESSON-B17');
