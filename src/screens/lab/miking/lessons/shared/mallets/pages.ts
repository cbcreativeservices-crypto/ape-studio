/**
 * MALLET-BAR FAMILY — the family's own pages for the ids where a mallet
 * keyboard differs from the kick (no heads: bars, tubes and fans; a
 * published coincident pair). The rest are the shared pages/.
 */
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { MSound } from './MSound';
import { MTwoMic } from './MTwoMic';

export const MALLET_PAGES: NonNullable<LessonArt['pages']> = {
  sound: MSound as never,
  twoMic: MTwoMic as never,
};
