/**
 * The DJ Systems Lab's screens, in the owner's 24-screen outline order.
 * Stage 1 is screens 1–12; screens 13–18 are built on branch dj-lab and
 * slot in at the marked comments; 19–24 are Stage 2b (branch dj-lab-b).
 *
 * Each page's OUTLINE NUMBER comes from DJ_PAGE_NO (pages/registry
 * numberPages): declared here for the pages after the gap, and "the one
 * before + 1" for every other — so the numbers, the optional paths (16–18)
 * and the closing "what this lab covers" read right with or without 13–18.
 */
import type { PageDef } from '../../kit/PagedLab';
import { GOALS_WELCOME, P01 } from './p01Welcome';
import { GOALS_GEAR, P02 } from './p02Gear';
import { GOALS_CONNECT, P03 } from './p03Connect';
import { GOALS_BUILD, P04 } from './p04Build';
import { GOALS_PLAY, P05 } from './p05Play';
import { GOALS_GAIN, P06 } from './p06Gain';
import { GOALS_CUE, P07 } from './p07Cue';
import { GOALS_FADERS, P08 } from './p08Faders';
import { GOALS_EQ, P09 } from './p09Eq';
import { GOALS_TEMPO, P10 } from './p10Tempo';
import { GOALS_GRID, P11 } from './p11Grid';
import { GOALS_LOOPS, P12 } from './p12Loops';
// 13–18: built on branch dj-lab (merged later)
import { GOALS_MIC, P19 } from './p19Mic';
import { GOALS_PA, P20 } from './p20Pa';
import { GOALS_REC, P21 } from './p21Rec';
import { GOALS_HYBRID, P22 } from './p22Hybrid';
import { GOALS_CHANGE, P23 } from './p23Changeover';
import { GOALS_EVENT, P24 } from './p24Capstone';
import { numberPages } from './registry';
import { setDjRegistry } from './registryRuntime';

export const DJ_PAGES: PageDef[] = [
  P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12,
  // 13–18: built on branch dj-lab (merged later)
  P19, P20, P21, P22, P23, P24,
];

/** Each screen's goal labels, in page order — the what's-left rows name the
 *  ones still unmet (booth/goalStore, learning review X5). */
export const DJ_GOALS: readonly (readonly string[])[] = [
  GOALS_WELCOME, GOALS_GEAR, GOALS_CONNECT, GOALS_BUILD, GOALS_PLAY, GOALS_GAIN, GOALS_CUE, GOALS_FADERS, GOALS_EQ, GOALS_TEMPO, GOALS_GRID, GOALS_LOOPS,
  // 13–18: built on branch dj-lab (merged later)
  GOALS_MIC, GOALS_PA, GOALS_REC, GOALS_HYBRID, GOALS_CHANGE, GOALS_EVENT,
];

/** Each registered page's outline number (1–24): the pages after the 13–18
 *  gap declare theirs; every other page is the one before + 1. */
export const DJ_PAGE_NO: readonly number[] = numberPages(DJ_PAGES, new Map<PageDef, number>([[P19, 19]]));

// the closing screen reads the registry at render time (no import cycle)
setDjRegistry(DJ_PAGES, DJ_PAGE_NO);
