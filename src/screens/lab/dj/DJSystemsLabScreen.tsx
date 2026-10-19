/**
 * DJ Systems Lab (owner GO 2026-10-18) — the owner's 24-screen outline
 * (docs/labs/dj/OWNER_24_SCREEN_OUTLINE.txt) on the PagedLab shell: Stage 1
 * (screens 1–12), Stage 2 (13–18; 16–18 are OPTIONAL
 * equipment paths) and Stage 2b (19–24: microphones, the PA and the venue,
 * recording, hybrid rigs, changeovers, and the closing event challenge,
 * which ends the lab). Every screen is a Rack Unit page over
 * ONE shared booth (booth/boothStore): two media players, a two-channel
 * mixer, PA speakers, booth monitors and headphones, revealed as the lessons
 * need them.
 *
 *   1 Welcome and safe operation      7 Headphone cue and booth monitoring
 *   2 Meet the DJ equipment           8 Channel faders and crossfaders
 *   3 Connections and signal types    9 EQ isolators and filters
 *   4 Build your first DJ system     10 Tempo, beatmatching and phrasing
 *   5 Load and play music            11 Beatgrids, sync and quantize
 *   6 Set gain and read meters       12 Cue points, loops and samples
 *  13–18 effects, key, stems, laptop, 19 Microphones and talkover
 *        vinyl, digital vinyl
 *                                    20 PA speakers, subs and the venue
 *                                    21 Recording and streaming
 *                                    22 Hybrid DJ systems
 *                                    23 Performer changeovers and backups
 *                                    24 Troubleshooting: the event challenge
 *
 * OPTIONAL PATHS (owner outline): 16–18 are equipment paths a learner may
 * skip; the lab counts as complete with every other screen done
 * (pages/registry, PagedLab `optionalPage`). Matched BY OUTLINE NUMBER
 * (DJ_PAGE_NO).
 *
 * Each screen keeps its five steps together (UNDERSTAND · EXPLORE · LISTEN &
 * OBSERVE · PRACTICE · CHECK YOURSELF) under the pinned booth; a screen marks
 * itself done when its practice goals, its check and its
 * troubleshooting exercise are met. FINISH opens the what's-left screen
 * (PagedLab → LabEndScreen): every screen not yet done, by name, with the
 * goals it still has to meet, PRACTISE AGAIN and DONE. Credit is never removed; START OVER (PRACTICE) only clears
 * this device's page marks.
 *
 * Truth architecture: model/djModel.ts + model/djDeck.ts + model/djTime.ts
 * (state, tapers, curves, routing, transport), engine/djRender.ts (the signal
 * path, clip stages, meter taps, the listener's limiter), engine/djMusic.ts
 * (the original practice tracks) — pinned by test/djTime, test/djRender,
 * test/djMusic and test/djLab. Documented in docs/labs/dj/MODEL.md; sources
 * and unknowns in docs/labs/dj/SOURCES.md (never shown to learners).
 *
 * MEMBERS ONLY — nothing here is free for a guest (owner 2026-10-18). The gate
 * is RootNavigator's MemberGated.DJSystemsLab (withMembershipPreview →
 * useMemberGate), reading `member: true` on this lab's catalog leaf.
 */
import { useEffect } from 'react';
import { PagedLab } from '../kit/PagedLab';
import { releaseTracks } from './engine/djMusic';
import { clearDeckCache } from './engine/djRender';
import { DJ_GOALS, DJ_PAGE_NO, DJ_PAGES } from './pages';
import { isOptionalNo } from './pages/registry';
import { leftLine } from './booth/goalStore';

export const DJ_LAB_ID = 'dj-systems';
export const DJ_LAB_TITLE = 'DJ Systems Lab';

export const DJ_ACCURACY_DETAIL =
  'This lab MODELS a DJ booth on your phone. Its music is synthesised in the app, its mixer is one generic design (real mixers differ — their manuals win), and its meters read this model in dBFS, never your ears or a room. The phone plays it through one uncalibrated output at a level you choose, behind a protective limiter — that is not a safe-listening measurement, and a phone microphone cannot measure what reaches your ears. Learn the method here; check levels with a calibrated meter and your own equipment.';

const HANDS_ON = 'Its practice goals, its check and its troubleshooting exercise — NEXT moves on without counting it.';

/** A screen's what's-left row: the goals it still has to meet, by name
 *  (learning review 2026-10-18 X5) — from its last visit this session, or
 *  every goal of a screen not opened yet. NEXT still moves on without it. */
const leftDetail = (i: number): string | undefined => {
  if (!DJ_PAGES[i] || !DJ_GOALS[i]) return undefined;
  const line = leftLine(DJ_PAGES[i].short, DJ_GOALS[i]);
  return optionalPage(i) ? `Optional equipment path — not needed to complete the lab. ${line}` : line;
};

/** Screens 16–18 (by outline number) are optional equipment paths. */
const optionalPage = (i: number): boolean => i < DJ_PAGES.length && isOptionalNo(DJ_PAGE_NO[i] ?? -1);

export function DJSystemsLabScreen() {
  // Leaving the lab releases the synthesised tracks' clip banks and the deck
  // render cache (the Mixing lab's rule): the next visit rebuilds them.
  useEffect(
    () => () => {
      releaseTracks();
      clearDeckCache();
    },
    [],
  );
  return (
    <PagedLab
      labId={DJ_LAB_ID}
      title={DJ_LAB_TITLE}
      subtitle="Connect, cue, mix and troubleshoot a two-deck DJ booth."
      pages={DJ_PAGES}
      handsOnDetail={HANDS_ON}
      pageDetail={leftDetail}
      accuracyDetail={DJ_ACCURACY_DETAIL}
      optionalPage={optionalPage}
    />
  );
}
