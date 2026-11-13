/**
 * The Game Audio Lab's pages, in order. One file per page; this list is the
 * only place their order lives.
 *
 * GROUPS (the one statement of them; audit 2, L-34). The pages fall into
 * five groups, A to E. They are the first handoff's chapters and the helper
 * files' prefixes (chA…, chb…, chc…, chd…, che…); a page's header comment
 * names its group by letter.
 *
 *   A  What game audio is              1–5    chAViews
 *   B  How a game asks for sound       6–10   chbBits
 *   C  Space, music and voice          11–15  chcBits, chcSpeakerMap
 *   D  The mix and its limits          16–19  chdKit
 *   E  The real tools                  20–22  cheKit, cheToolMap
 *
 * The learner sees NO group: the shared shell lists the 22 page titles with
 * no heading, and no learner string says "chapter". (The approved plan had
 * six chapters, with 11–13 and 14–15 apart; the build merged them into C.
 * Older comments that say "chapter 3, Space" or "chapter 6" mean C and E.)
 * Showing groups to the learner is the shell's to add, and is not done.
 */
import type { PageDef } from '../../kit/PagedLab';
import { P01 } from './p01Welcome';
import { P02 } from './p02Reacts';
import { P03 } from './p03Platforms';
import { P04 } from './p04Games';
import { P05 } from './p05Sounds';
import { P06 } from './p06Pipeline';
import { P07 } from './p07Instances';
import { P08 } from './p08GameSyncs';
import { P09 } from './p09Variation';
import { P10 } from './p10Loops';
import { P11 } from './p11Distance';
import { P12 } from './p12Walls';
import { P13 } from './p13Formats';
import { P14 } from './p14Music';
import { P15 } from './p15Dialogue';
import { P16 } from './p16Mix';
import { P17 } from './p17Budgets';
import { P18 } from './p18Multiplayer';
import { P19 } from './p19Testing';
import { P20 } from './p20Tools';
import { P21 } from './p21Today';
import { P22 } from './p22Capstone';

export const GA_PAGES: PageDef[] = [P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12, P13, P14, P15, P16, P17, P18, P19, P20, P21, P22];
