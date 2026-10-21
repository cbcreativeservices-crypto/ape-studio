/**
 * The DJ Systems Lab's screens, in the owner's 24-screen outline order.
 * Stage 1 is screens 1–12; Stage 2 is 13–18 and Stage 2b is 19–24, all
 * merged into the one 24-screen lab.
 *
 * Each page's OUTLINE NUMBER comes from DJ_PAGE_NO (pages/registry
 * numberPages): declared here for the pages after the gap, and "the one
 * before + 1" for every other — so the numbers, the optional paths (16–18)
 * and the closing "what this lab covers" read right.
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
// Stage 2 (screens 13–18), in the owner's order
import { GOALS_FX, P13 } from './p13Effects';
import { GOALS_KEY, P14 } from './p14Key';
import { GOALS_STEMS, P15 } from './p15Stems';
// 16–18: optional equipment paths (laptop, vinyl, DVS)
import { GOALS_LAPTOP, P16 } from './p16Laptop';
import { GOALS_VINYL, P17 } from './p17Vinyl';
import { GOALS_DVS, P18 } from './p18Dvs';
// Stage 2b (screens 19–24)
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
  P13, P14, P15, P16, P17, P18,
  P19, P20, P21, P22, P23, P24,
];

/** Each screen's goal labels, in page order — the what's-left rows name the
 *  ones still unmet (booth/goalStore, learning review X5). */
export const DJ_GOALS: readonly (readonly string[])[] = [
  GOALS_WELCOME, GOALS_GEAR, GOALS_CONNECT, GOALS_BUILD, GOALS_PLAY, GOALS_GAIN, GOALS_CUE, GOALS_FADERS, GOALS_EQ, GOALS_TEMPO, GOALS_GRID, GOALS_LOOPS,
  GOALS_FX, GOALS_KEY, GOALS_STEMS, GOALS_LAPTOP, GOALS_VINYL, GOALS_DVS,
  GOALS_MIC, GOALS_PA, GOALS_REC, GOALS_HYBRID, GOALS_CHANGE, GOALS_EVENT,
];

/** Each registered page's outline number (1–24): P19 declares its own; every
 *  other page is the one before + 1. */
export const DJ_PAGE_NO: readonly number[] = numberPages(DJ_PAGES, new Map<PageDef, number>([[P19, 19]]));

// the closing screen reads the registry at render time (no import cycle)
setDjRegistry(DJ_PAGES, DJ_PAGE_NO);
