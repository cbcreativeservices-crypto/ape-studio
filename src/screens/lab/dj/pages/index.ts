/**
 * The DJ Systems Lab's twelve screens (Stage 1 of the owner's 24-screen
 * outline), in the owner's order.
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

export const DJ_PAGES: PageDef[] = [P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12];

/** Each screen's goal labels, in page order — the what's-left rows name the
 *  ones still unmet (booth/goalStore, learning review X5). */
export const DJ_GOALS: readonly (readonly string[])[] = [GOALS_WELCOME, GOALS_GEAR, GOALS_CONNECT, GOALS_BUILD, GOALS_PLAY, GOALS_GAIN, GOALS_CUE, GOALS_FADERS, GOALS_EQ, GOALS_TEMPO, GOALS_GRID, GOALS_LOOPS];
