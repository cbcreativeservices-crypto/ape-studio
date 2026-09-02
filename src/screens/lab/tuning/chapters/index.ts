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

// NEW COPY — one-line objectives, stated by the shell before each chapter.
export const CHAPTERS: ChapterDef[] = [
  { index: 0, title: CHAPTER_TITLES[0], short: 'Welcome', objective: 'Hear the one question every tuning system must answer.', Component: Ch0Welcome },
  { index: 1, title: CHAPTER_TITLES[1], short: 'Intervals', objective: 'Read an interval as a ratio and in cents — and see why a hertz difference is not an interval.', Component: Ch1Intervals },
  { index: 2, title: CHAPTER_TITLES[2], short: 'Landmarks', objective: 'Know the five simple ratios by ear, by number and by position on the rail.', Component: Ch2Landmarks },
  { index: 3, title: CHAPTER_TITLES[3], short: 'Fold', objective: 'Fold any ratio into the comparison octave with ×2 and ÷2, one step at a time.', Component: Ch3Octave },
  { index: 4, title: CHAPTER_TITLES[4], short: 'Harmonics', objective: 'See why one tuning ratio makes upper harmonics coincide and another makes them beat.', Component: Ch4Harmonics },
  { index: 5, title: CHAPTER_TITLES[5], short: 'Fifths', objective: 'Generate twelve notes from one rule — ×3/2, then fold — and watch where the last one lands.', Component: Ch5Fifths },
  { index: 6, title: CHAPTER_TITLES[6], short: 'Comma', objective: 'Measure the Pythagorean comma exactly and see that it is not rounding.', Component: Ch6Comma },
  { index: 7, title: CHAPTER_TITLES[7], short: 'Just', objective: 'Build pure triads from small ratios — and find what one fixed mapping gives up when the key changes.', Component: Ch7Just },
  { index: 8, title: CHAPTER_TITLES[8], short: 'Compare', objective: 'Find which degrees of two same-named scales differ, and by exactly what ratio.', Component: Ch8Compare },
  { index: 9, title: CHAPTER_TITLES[9], short: 'Meantone', objective: 'Narrow the fifth until four of them make a pure third — then locate the wolf that pays for it.', Component: Ch9Meantone },
  { index: 10, title: CHAPTER_TITLES[10], short: 'Equal', objective: 'Derive 2^(1/12) and see that equal semitones are equal ratios, not equal hertz.', Component: Ch10Equal },
  { index: 11, title: CHAPTER_TITLES[11], short: 'Compare', objective: 'Compare four systems fairly: same C, same keys, same sounds — only the ratios change.', Component: Ch11Systems },
  { index: 12, title: CHAPTER_TITLES[12], short: 'Tradeoffs', objective: 'State what each system preserves, what it gives up, and which common claims are wrong.', Component: Ch12Tradeoffs },
  { index: 13, title: CHAPTER_TITLES[13], short: 'Apply', objective: 'Do six things you learned — on purpose, without the walkthrough.', Component: Ch13Apply },
];
