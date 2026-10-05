/**
 * THE CYMBAL LESSONS (Lab 2: I01a–e) — lesson ART by id: each lesson's
 * drawings, its setting plan, and the family's HOW IT SOUNDS page. The other
 * pages are the shared ones. Appended to data/lessonArt.ts.
 */
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { HIHAT_ART } from '../../i01aHiHat/art';
import { RIDE_ART } from '../../i01bRide/art';
import { CRASH_ART } from '../../i01cCrash/art';
import { SPLASH_ART } from '../../i01dSplash/art';
import { CHINA_ART } from '../../i01eChina/art';

export const CYMBAL_ART: Record<string, LessonArt> = {
  I01a: HIHAT_ART,
  I01b: RIDE_ART,
  I01c: CRASH_ART,
  I01d: SPLASH_ART,
  I01e: CHINA_ART,
};
