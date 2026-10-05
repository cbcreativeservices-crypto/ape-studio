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
import { TMB_ART } from '../../i04Tambourine/art';
import { TambourineStrike, TambourineMotion } from '../../i04Tambourine/soundArt';
import { I04_LESSON } from '../../i04Tambourine/lesson.ts';
import { BELL_ART } from '../../i05aCowbell/art';
import { CowbellStrike, CowbellMute } from '../../i05aCowbell/soundArt';
import { I05A_LESSON } from '../../i05aCowbell/lesson.ts';
import { CLV_ART } from '../../i05bClaves/art';
import { ClavesStrike, ClavesGrip } from '../../i05bClaves/soundArt';
import { I05B_LESSON } from '../../i05bClaves/lesson.ts';
import { WB_ART } from '../../i05cWoodblock/art';
import { WoodblockStrike, WoodblockSupport } from '../../i05cWoodblock/soundArt';
import { I05C_LESSON } from '../../i05cWoodblock/lesson.ts';
import { GU_ART } from '../../i05dGuiro/art';
import { GuiroScrape, GuiroLength } from '../../i05dGuiro/soundArt';
import { I05D_LESSON } from '../../i05dGuiro/lesson.ts';
import { CAJ_ART } from '../../i02Cajon/art';
import { CajonStroke, CajonPlace } from '../../i02Cajon/soundArt';
import { I02_LESSON } from '../../i02Cajon/lesson.ts';
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
  I04: withFamily(I04_LESSON, { ...TMB_ART, StrikeSequence: TambourineStrike, CoupledHeads: TambourineMotion }),
  I05a: withFamily(I05A_LESSON, { ...BELL_ART, StrikeSequence: CowbellStrike, CoupledHeads: CowbellMute }),
  I05b: withFamily(I05B_LESSON, { ...CLV_ART, StrikeSequence: ClavesStrike, CoupledHeads: ClavesGrip }),
  I05c: withFamily(I05C_LESSON, { ...WB_ART, StrikeSequence: WoodblockStrike, CoupledHeads: WoodblockSupport }),
  I05d: withFamily(I05D_LESSON, { ...GU_ART, StrikeSequence: GuiroScrape, CoupledHeads: GuiroLength }),
  I02: withFamily(I02_LESSON, { ...CAJ_ART, StrikeSequence: CajonStroke, CoupledHeads: CajonPlace }),
};
