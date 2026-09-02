/**
 * Chapter registry — the fourteen chapters (spec Stage 1 §5) are added here
 * as they are built; the shell paces through whatever is listed.
 */
import type { ChapterDef } from '../labCtx';
import { Ch0Welcome } from './ch0Welcome';
import { Ch1Intervals } from './ch1Intervals';
import { Ch2Landmarks } from './ch2Landmarks';
import { Ch3Octave } from './ch3Octave';
import { Ch4Harmonics } from './ch4Harmonics';
import { Ch5Fifths } from './ch5Fifths';
import { Ch6Comma } from './ch6Comma';
import { Ch7Just } from './ch7Just';
import { Ch8Compare } from './ch8Compare';
import { Ch9Meantone } from './ch9Meantone';
import { Ch10Equal } from './ch10Equal';
import { Ch11Systems } from './ch11Systems';
import { Ch12Tradeoffs } from './ch12Tradeoffs';
import { Ch13Apply } from './ch13Apply';

export const CHAPTER_TITLES = [
  'Welcome and Listening Setup',
  'Intervals Are Frequency Relationships',
  'Ratio Landmarks',
  'Folding Notes Into One Octave',
  'Harmonic Alignment and Beating',
  'Build With Pure Fifths',
  'The Circle Does Not Close',
  'Build Harmony With Just Intonation',
  'Spot the Difference: Pythagorean Versus Just',
  'Build Quarter-Comma Meantone',
  'Divide the Octave Equally',
  'Compare Tuning Systems',
  'Tradeoffs, Musical Use, and Misconceptions',
  'Apply What You Learned',
] as const;

export const CHAPTER_COUNT = CHAPTER_TITLES.length;

export const CHAPTERS: ChapterDef[] = [
  { index: 0, title: CHAPTER_TITLES[0], short: 'Welcome', Component: Ch0Welcome },
  { index: 1, title: CHAPTER_TITLES[1], short: 'Intervals', Component: Ch1Intervals },
  { index: 2, title: CHAPTER_TITLES[2], short: 'Landmarks', Component: Ch2Landmarks },
  { index: 3, title: CHAPTER_TITLES[3], short: 'Fold', Component: Ch3Octave },
  { index: 4, title: CHAPTER_TITLES[4], short: 'Harmonics', Component: Ch4Harmonics },
  { index: 5, title: CHAPTER_TITLES[5], short: 'Fifths', Component: Ch5Fifths },
  { index: 6, title: CHAPTER_TITLES[6], short: 'Comma', Component: Ch6Comma },
  { index: 7, title: CHAPTER_TITLES[7], short: 'Just', Component: Ch7Just },
  { index: 8, title: CHAPTER_TITLES[8], short: 'Compare', Component: Ch8Compare },
  { index: 9, title: CHAPTER_TITLES[9], short: 'Meantone', Component: Ch9Meantone },
  { index: 10, title: CHAPTER_TITLES[10], short: 'Equal', Component: Ch10Equal },
  { index: 11, title: CHAPTER_TITLES[11], short: 'Compare', Component: Ch11Systems },
  { index: 12, title: CHAPTER_TITLES[12], short: 'Tradeoffs', Component: Ch12Tradeoffs },
  { index: 13, title: CHAPTER_TITLES[13], short: 'Apply', Component: Ch13Apply },
];
