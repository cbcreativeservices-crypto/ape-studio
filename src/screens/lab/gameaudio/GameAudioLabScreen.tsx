/**
 * GameAudioLabScreen — the Game Audio Lab (must-do D60, owner GO 2026-11-12;
 * plan: Downloads\2026-11-12_GAME_AUDIO_LAB_PLAN). A paged lab on the house
 * shell (kit/PagedLab) and the Rack Unit, modeled on the DJ Systems Lab.
 *
 * WHAT THE LEARNER LEAVES KNOWING (owner's words): "ready for the real tools
 * generally … recognize and orient themselves quickly … understanding how
 * the software works generally / conceptually / environmentally", in the
 * glossary's own Game Audio terms.
 *
 * ONE sound session serves every page (GaLabProvider). Each page opens on a
 * clean copy of the same scene, as each DJ Systems Lab screen does.
 *
 * NOT LISTED YET [MD:D60]: this screen is reachable only from the web
 * preview (`#labpreview/GameAudioLab`). It joins the Labs menu, and gets its
 * certificate credit key, after the owner's phone checks, a tile image and
 * approval.
 */
import { PagedLab } from '../kit/PagedLab';
import { GaLabProvider } from './GaLab';
import { GA_PAGES } from './pages';
import { GA_END_GUIDE } from './pages/guides/end';

export const GA_LAB_ID = 'game-audio';
export const GA_LAB_TITLE = 'Game Audio Lab';

const HANDS_ON = 'Counts once its practice goals and its check are done; NEXT moves on without counting it.';

/** The end screen's line for a page that is not done yet. Three pages count
 *  by a different rule from the rest, and each says its own (by page index:
 *  19 = page 20 "Finding your way in the tools", 20 = page 21 "Game audio
 *  today", 21 = page 22 the capstone). The numbers follow the pages: page 20
 *  has six checks (P20_CHECKS), page 21 two, the capstone seven goals
 *  (GA_CAPSTONE); test/gameAudioChETools.test.ts holds them together. The
 *  capstone's line does not say NEXT: its key is FINISH (audit 2, W2-29). */
const PAGE_DETAIL: Readonly<Record<number, string>> = {
  19: 'Counts once its six checks are done; NEXT moves on without counting it.',
  20: 'Counts once its two checks are done; NEXT moves on without counting it.',
  21: 'Counts once its seven goals are done in one visit. Its check is optional, and FINISH moves on without counting it.',
};
const pageDetail = (i: number): string | undefined => PAGE_DETAIL[i];

export function GameAudioLabScreen() {
  return (
    <GaLabProvider>
      <PagedLab labId={GA_LAB_ID} title={GA_LAB_TITLE} subtitle="How a game asks for sound, and how the audio side answers." pages={GA_PAGES} handsOnDetail={HANDS_ON} pageDetail={pageDetail} accuracy={false} endGuide={GA_END_GUIDE} />
    </GaLabProvider>
  );
}
