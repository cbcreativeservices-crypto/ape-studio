/**
 * SMALL-PERCUSSION FAMILY (Lab 2) — lesson CONTENT by id (node-safe: data
 * only, no drawings). Appended to data/lessons.ts's table.
 */
import type { Lesson } from '../../../engine/model/types.ts';
import { I03A_LESSON } from '../../i03aShaker/lesson.ts';
import { I03B_LESSON } from '../../i03bEgg/lesson.ts';
import { I03C_LESSON } from '../../i03cMaracas/lesson.ts';
import { I04_LESSON } from '../../i04Tambourine/lesson.ts';
import { I05A_LESSON } from '../../i05aCowbell/lesson.ts';
import { I05B_LESSON } from '../../i05bClaves/lesson.ts';
import { I05C_LESSON } from '../../i05cWoodblock/lesson.ts';
import { I05D_LESSON } from '../../i05dGuiro/lesson.ts';

export const SMALL_PERC_CONTENT: Record<string, Lesson> = {
  I03a: I03A_LESSON,
  I03b: I03B_LESSON,
  I03c: I03C_LESSON,
  I04: I04_LESSON,
  I05a: I05A_LESSON,
  I05b: I05B_LESSON,
  I05c: I05C_LESSON,
  I05d: I05D_LESSON,
};
