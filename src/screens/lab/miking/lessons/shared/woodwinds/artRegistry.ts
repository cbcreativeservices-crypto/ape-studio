/**
 * WOODWIND FAMILY — lesson ART by id (Lab 3, Winds). Appended to
 * data/lessonArt.ts's table.
 */
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { FLUTE_ART } from '../../a06Flute/art';
import { PICCOLO_ART } from '../../a07Piccolo/art';
import { CLARINET_ART } from '../../a08aClarinet/art';
import { BASS_CLARINET_ART } from '../../a08bBassClarinet/art';
import { OBOE_ART } from '../../a09aOboe/art';
import { BASSOON_ART } from '../../a09bBassoon/art';

export const WOODWIND_ART: Record<string, LessonArt> = {
  A06: FLUTE_ART,
  A07: PICCOLO_ART,
  A08a: CLARINET_ART,
  A08b: BASS_CLARINET_ART,
  A09a: OBOE_ART,
  A09b: BASSOON_ART,
};
