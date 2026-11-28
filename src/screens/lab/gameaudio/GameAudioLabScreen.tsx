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
 * LISTED 2026-11-13 [MD:D60] (owner: "Yes, register both"): in the Labs menu
 * under its own subject, Game Audio (labCatalog), with its tile art. MEMBERS
 * ONLY — nothing here is free for a guest. The gate is RootNavigator's
 * MemberGated.GameAudioLab (withMembershipPreview → useMemberGate), reading
 * `member: true` on this lab's catalog leaf. The web preview
 * (`#labpreview/GameAudioLab`) still opens it for the owner.
 *
 * 24 PAGES SINCE 2026-11-14 (owner's decision 5): the old pages 4 and 10
 * held two lessons each and are two pages each now (pages/index.ts). Saved
 * page marks are kept by page INDEX, so this screen first moves a record
 * saved in the 22-page layout (model/gaPageLayout.ts, once per device) and
 * only then mounts the shell.
 *
 * CERTIFICATE CREDIT: the key is tr_game_audio (trainingLabKeys, by this
 * route). PagedLab reports it once every page is done (`labDoneKey`), on the
 * FINISH that completes the set and on any later visit. THE RULE'S WORDS ARE
 * UNCHANGED ("every page done"); the number of pages it covers went from 22
 * to 24, with the same goals and checks as before, shared out over two more
 * pages. A credit already reported is kept by labCompletion and is not
 * looked at again. Credit is never
 * removed; START OVER (PRACTICE) clears only this device's page marks, and
 * NEXT always moves on (a lab never blocks navigation). It is required by
 * cert-game-audio-v3, cert-interactive-and-game-music-v3 and
 * prog-game-and-interactive-audio-v3 (labRequirements); the server rows for
 * the key and those requirements are Comp A's, after this is on phones
 * (D60 (f)).
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { PagedLab } from '../kit/PagedLab';
import { trainingKeyFor } from '../../../features/lab/trainingLabKeys';
import { GaLabProvider } from './GaLab';
import { gaEnsurePageLayout } from './model/gaPageLayout';
import { GA_PAGES } from './pages';
import { GA_HANDS_ON, GA_PAGE_LEFT } from './pages/data/gaPageLeft';
import { GA_END_GUIDE } from './pages/guides/end';

export const GA_LAB_ID = 'game-audio';
export const GA_LAB_TITLE = 'Game Audio Lab';

/** The rule the hands-on pages share. The shared end screen prints it ONCE,
 *  above the list, under HOW A PAGE COUNTS (never under a row). */
const HANDS_ON = GA_HANDS_ON;

/** The end screen's line for a page that is not done yet. Three pages count
 *  by a different rule from the rest, and each says its own (by page index
 *  in the 24-page list: 21 = page 22 "Finding your way in the tools", 22 =
 *  page 23 "Game audio today", 23 = page 24 the capstone; they were 19, 20
 *  and 21 before the split of 2026-11-14). The numbers follow the pages: the
 *  tools page has six checks (P20_CHECKS), "today" two, the capstone seven
 *  goals (GA_CAPSTONE); test/gameAudioChETools.test.ts holds them together.
 *  The capstone's line does not say NEXT: its key is FINISH (audit 2, W2-29). */
const PAGE_DETAIL: Readonly<Record<number, string>> = {
  21: 'Counts once its six checks are done; NEXT moves on without counting it.',
  22: 'Counts once its two checks are done; NEXT moves on without counting it.',
  23: 'Counts once its seven goals are done in one visit. Its check is optional, and FINISH moves on without counting it.',
};
/** Every row that is not done names what THAT page still needs (phase 2 of
 *  the lab fix round, 2026-11-14): pages 1 to 21 from pages/data/gaPageLeft
 *  (their own goals and their check), pages 22 to 24 from PAGE_DETAIL. */
const pageDetail = (i: number): string | undefined => PAGE_DETAIL[i] ?? GA_PAGE_LEFT[i];
/** No page is optional. Passed so that PagedLab's "lab done" rule checks
 *  EVERY page index 0…21 (`every(i => completed.includes(i))`), not the
 *  number of stored entries: an index from an older layout or a corrupt
 *  copy cannot stand in for a page not done (round-2 bug test 2026-11-13,
 *  R2-GA1-15). Nothing else changes: the END screen marks a page optional
 *  only when this returns true. */
const noPageOptional = (_i: number): boolean => false;

/** True once this device's saved page marks are in the 24-page layout (or
 *  could not be moved now: the shell mounts all the same, a lab never
 *  blocks). The shell must not READ the record before that, so it is not
 *  mounted until then; the move is a few storage calls. */
function usePageLayoutReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void gaEnsurePageLayout(GA_LAB_ID).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

// ONE WORD FOR THE LAB'S UNIT (owner's decision 3, 2026-11-14): this lab's
// own text has always said "page" (lessons, goal notes, guides, the end
// screen's lines), so the shared strip, CONTENTS and the end screen say page
// too (`unitNoun`; they said MODULE).
export function GameAudioLabScreen() {
  const ready = usePageLayoutReady();
  return (
    <GaLabProvider>
      {ready ? (
        <PagedLab labId={GA_LAB_ID} title={GA_LAB_TITLE} subtitle="How a game asks for sound, and how the audio side answers." pages={GA_PAGES} handsOnDetail={HANDS_ON} pageDetail={pageDetail} unitNoun="page" accuracy={false} endGuide={GA_END_GUIDE} optionalPage={noPageOptional} labDoneKey={trainingKeyFor('GameAudioLab')} />
      ) : (
        <View style={{ flex: 1, backgroundColor: '#0a0a0c' }} />
      )}
    </GaLabProvider>
  );
}
