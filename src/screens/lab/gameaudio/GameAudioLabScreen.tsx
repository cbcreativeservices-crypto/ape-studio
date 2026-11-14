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
 * CERTIFICATE CREDIT: the key is tr_game_audio (trainingLabKeys, by this
 * route). PagedLab reports it once every page is done (`labDoneKey`), on the
 * FINISH that completes the set and on any later visit. Credit is never
 * removed; START OVER (PRACTICE) clears only this device's page marks, and
 * NEXT always moves on (a lab never blocks navigation). It is required by
 * cert-game-audio-v3, cert-interactive-and-game-music-v3 and
 * prog-game-and-interactive-audio-v3 (labRequirements); the server rows for
 * the key and those requirements are Comp A's, after this is on phones
 * (D60 (f)).
 */
import { PagedLab } from '../kit/PagedLab';
import { trainingKeyFor } from '../../../features/lab/trainingLabKeys';
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
/** No page is optional. Passed so that PagedLab's "lab done" rule checks
 *  EVERY page index 0…21 (`every(i => completed.includes(i))`), not the
 *  number of stored entries: an index from an older layout or a corrupt
 *  copy cannot stand in for a page not done (round-2 bug test 2026-11-13,
 *  R2-GA1-15). Nothing else changes: the END screen marks a page optional
 *  only when this returns true. */
const noPageOptional = (_i: number): boolean => false;

export function GameAudioLabScreen() {
  return (
    <GaLabProvider>
      <PagedLab labId={GA_LAB_ID} title={GA_LAB_TITLE} subtitle="How a game asks for sound, and how the audio side answers." pages={GA_PAGES} handsOnDetail={HANDS_ON} pageDetail={pageDetail} accuracy={false} endGuide={GA_END_GUIDE} optionalPage={noPageOptional} labDoneKey={trainingKeyFor('GameAudioLab')} />
    </GaLabProvider>
  );
}
