import type { ComponentType } from 'react';
import type { DrumChapterId } from '../drumContent';
import type { ChapterProps } from './shared';
import { Ch1Sound } from './ch1Sound';
import { Ch2Prepare } from './ch2Prepare';
import { Ch3Method } from './ch3Method';
import { Ch4Whole } from './ch4Whole';
import { Ch5Types } from './ch5Types';
import { Ch6Kit } from './ch6Kit';
import { Ch7Trouble } from './ch7Trouble';

export type DrumChapterComponent = ComponentType<ChapterProps>;

/** Steps per chapter — static, so PREV on a chapter's first step can land
 *  on the previous chapter's LAST step. Pinned against the chapter files by
 *  test/drumTuningLab.test.ts. */
export const DRUM_STEP_COUNTS: Record<DrumChapterId, number> = {
  sound: 7, prepare: 6, method: 4, whole: 5, types: 6, kit: 4, trouble: 4,
};

/** Chapters whose credit needs the interactive's goal, not only answers. */
export const DRUM_NEEDS_INTERACTIVE: Record<DrumChapterId, boolean> = {
  sound: false, prepare: true, method: true, whole: true, types: true, kit: true, trouble: true,
};

export const DRUM_CHAPTER_COMPONENTS: Record<DrumChapterId, DrumChapterComponent> = {
  sound: Ch1Sound,
  prepare: Ch2Prepare,
  method: Ch3Method,
  whole: Ch4Whole,
  types: Ch5Types,
  kit: Ch6Kit,
  trouble: Ch7Trouble,
};
