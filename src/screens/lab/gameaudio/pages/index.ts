/**
 * The Game Audio Lab's pages, in order. One file per page; this list is the
 * only place their order lives.
 *
 * GROUPS (the one statement of them; audit 2, L-34). The pages fall into
 * five groups, A to E. They are the first handoff's chapters and the helper
 * files' prefixes (chA…, chb…, chc…, chd…, che…); a page's header comment
 * names its group by letter.
 *
 *   A  What game audio is              1–6    chAViews
 *   B  How a game asks for sound       7–12   chbBits
 *   C  Space, music and voice          13–17  chcBits, chcSpeakerMap
 *   D  The mix and its limits          18–21  chdKit
 *   E  The real tools                  22–24  cheKit, cheToolMap
 *
 * 24 PAGES SINCE 2026-11-14 (owner's decision 5: "Split a page that holds
 * two lessons into two pages"). The old page 4 is now "Kinds of games" and
 * "Whose ears: the listener"; the old page 10 is now "Ambience and zones"
 * and "Loops and their joins".
 *
 * A FILE'S NUMBER IS ITS NAME, NOT ITS PLACE. The files p01…p22 keep the
 * numbers of the 22-page plan (tests, guides and comments name them so),
 * and the two new pages took the next free numbers, p23 and p24. The
 * learner's page number is the place in GA_PAGES below, nothing else:
 *     p01 p02 p03 p04 P23 p05 p06 p07 p08 p09 p10 P24 p11 … p22
 *      1   2   3   4   5   6   7   8   9  10  11  12  13 … 24
 * A comment in an old file that says "page 11" means the page of that
 * number in the 22-page plan. Text a LEARNER reads names pages by their
 * number today (test/labFixes_20261114_F3.test.ts holds every such number
 * against this list).
 *
 * SAVED PAGE MARKS ARE KEPT BY INDEX in this list (kit/PagedLab), so a
 * change of order needs a move of the saved record: model/gaPageLayout.ts
 * does it for this change, once per device. Change the order again and
 * that file needs a layout 3.
 *
 * The learner sees NO group: the shared shell lists the 24 page titles with
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
import { P23 } from './p23Listener';
import { P24 } from './p24LoopJoin';

export const GA_PAGES: PageDef[] = [P01, P02, P03, P04, P23, P05, P06, P07, P08, P09, P10, P24, P11, P12, P13, P14, P15, P16, P17, P18, P19, P20, P21, P22];
