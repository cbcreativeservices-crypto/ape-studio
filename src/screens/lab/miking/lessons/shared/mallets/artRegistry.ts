/**
 * MALLET-BAR FAMILY — lesson ART by id: each lesson's drawings, the family's
 * own pages (HOW IT SOUNDS: bars, tubes, fans; TWO MICROPHONES: spaced and
 * coincident pairs) and its setting plan. Every other page is the shared
 * one. Appended to data/lessonArt.ts.
 */
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { I07_ART } from '../../i07Vibraphone/art';
import { I08_ART } from '../../i08Marimba/art';
import { I09_ART } from '../../i09Xylophone/art';
import { I10_ART } from '../../i10Glockenspiel/art';

export const MALLET_ART: Record<string, LessonArt> = {
  I07: I07_ART,
  I08: I08_ART,
  I09: I09_ART,
  I10: I10_ART,
};
