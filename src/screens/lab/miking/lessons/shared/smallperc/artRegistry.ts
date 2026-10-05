/**
 * SMALL-PERCUSSION FAMILY (Lab 2) — lesson ART by id: each lesson's drawings,
 * its HOW IT SOUNDS pair, the station plan, and the family's own sound page
 * (idiophones have no drumhead: three steps). The other pages are the shared
 * ones. Appended to data/lessonArt.ts.
 */
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { SHK_ART } from '../../i03aShaker/art';
import { ShakerStrike, ShakerStroke } from '../../i03aShaker/soundArt';
import { I03A_LESSON } from '../../i03aShaker/lesson.ts';
import { EGG_ART } from '../../i03bEgg/art';
import { EggGrip, EggStrike } from '../../i03bEgg/soundArt';
import { I03B_LESSON } from '../../i03bEgg/lesson.ts';
import { MAR_ART } from '../../i03cMaracas/art';
import { MaracaStrike, MaracaMotion } from '../../i03cMaracas/soundArt';
import { I03C_LESSON } from '../../i03cMaracas/lesson.ts';
import { SSound } from './pages/SSound';
import { SInstrument } from './pages/SInstrument';
import { stationPlanFor } from './StationPlan';
import type { SpLesson } from './family.ts';

const SP_PAGES: NonNullable<LessonArt['pages']> = { instrument: SInstrument as never, sound: SSound as never };

function withFamily(lesson: SpLesson, art: LessonArt): LessonArt {
  return { ...art, pages: SP_PAGES, stepCounts: { sound: art.CoupledHeads ? 3 : 2 }, SettingPlan: stationPlanFor(lesson.sp.plan.things, lesson.sp.plan.box, art.Instrument) };
}

export const SMALL_PERC_ART: Record<string, LessonArt> = {
  I03a: withFamily(I03A_LESSON, { ...SHK_ART, StrikeSequence: ShakerStrike, CoupledHeads: ShakerStroke }),
  I03b: withFamily(I03B_LESSON, { ...EGG_ART, StrikeSequence: EggStrike, CoupledHeads: EggGrip }),
  I03c: withFamily(I03C_LESSON, { ...MAR_ART, StrikeSequence: MaracaStrike, CoupledHeads: MaracaMotion }),
};
