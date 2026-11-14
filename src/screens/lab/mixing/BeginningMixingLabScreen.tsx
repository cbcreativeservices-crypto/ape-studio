/**
 * Beginning Mixing Lab (owner GO 2026-09-11) — COMPLETE: 16 pages on the
 * PagedLab shell. Purpose (brief): a clear, balanced basic stereo mix via a
 * repeatable process — What Mixing Does → Prep → Signal Flow → Gain Staging →
 * Static Mix → Subtractive → Panning → EQ in Context → Compression → Reverb &
 * Delay → The Six Routing Terms → Pre/Post & the Double Route → Automation →
 * Check & Finish → Export → the guided Final Mix. COPY RATIFIED by the owner
 * 2026-09-11 (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 *
 * Truth architecture: engine/routing.ts + engine/mixModel.ts, pinned by
 * test/mixingEngine.test.ts; audio is REAL offline DSP (audio/mixAudio.ts,
 * ear-lab pattern) — the learner hears their own decisions summed, and every
 * loudness-changing comparison is RMS-matched before judgment.
 */
import { useEffect } from 'react';
import { PagedLab } from '../kit/PagedLab';
import { mixingPageKeyAt } from '../../../features/lab/trainingLabKeys';
import { reportTrainingComplete } from '../../../features/lab/trainingSignal';
import { retainSessionStems } from './audio/mixAudio';
import { HANDS_ON_DETAIL, MIX_MANTRA } from './kit';
import { MIXING_PAGES_A } from './pagesA';
import { MIXING_PAGES_B } from './pagesB';
import { MIXING_PAGES_C } from './pagesC';
import { MIXING_PAGES_D } from './pagesD';
// Screen Guide (owner 2026-10-31): "this page, explained" — one guide per page,
// plus the what's-left END screen's own (PagedLab endGuide, WHERE YOU ARE).
import { BEGINNING_MIXING_END_GUIDE, beginningMixingPageGuide } from './beginningMixingScreenGuides';

const PAGES = [...MIXING_PAGES_A, ...MIXING_PAGES_B, ...MIXING_PAGES_C, ...MIXING_PAGES_D];

// CERTIFICATE CREDIT, PAGE BY PAGE (owner 2026-10-13): each page marked done
// reports its stable server key (trainingLabKeys MIXING_BEG_PAGE_IDS, in page order).
// PagedLab fires this once per newly-done REAL page (never the check page).
const onPageDone = (index: number) => reportTrainingComplete(mixingPageKeyAt('beg', index));
// The same keys, so a page banked to the account reads CREDITED after START
// OVER (PRACTICE) — credit is never shown as missing (toddler pass 2026-10-13).
const PAGE_KEYS = PAGES.map((_, i) => mixingPageKeyAt('beg', i));
const BEG_ACCURACY_DETAIL =
  'In this lab: the peak and RMS meters and every level-matched comparison measure the lab’s own rendered mixes, played through this device’s uncalibrated output. Learn the decisions here; judge a real mix on calibrated monitors and meters.';

/**
 * WHAT'S LEFT, row by row (phase 2, 2026-11-14): each unfinished page names
 * its OWN goals (the chips at its foot), never the rule every row shares (that
 * is HANDS_ON_DETAIL, printed once above the list). With sound off a ▶ tap
 * counts as looked at (kit.tsx, the silent path), so every goal here can be
 * met silently. Pinned to the pages' goal labels by test/labFixes_20261114_F4.
 */
export const BEG_PAGE_DETAIL: readonly string[] = [
  'Goals: open all five dimensions · choose your focal point · pass the check.',
  'Goals: open every prep step · pass the check.',
  'Goal: build the channel path in order.',
  'Goals: play MIX A and MIX B, then vote blind · play the reveal · pass the check.',
  'Goals: play the unmixed wall · commit to an anchor · shape at least five tracks · compare against the wall.',
  'Goals: open all six moves · try three moves on the chorus · pass the check.',
  'Goals: place three supports off-center · play the mono fold · pass the check.',
  'Goals: play the clash · play two different fixes · pass the check.',
  'Goals: open all five parameters · play dry, fast and slow attack · pass the check.',
  'Goals: play dry, shared and drowned · pass the check.',
  'Goals: open all six terms · pass the check.',
  'Goals: pull the fader on the cue rig · solve the double-routing case · pass the check.',
  'Goals: play static vs automated · change the chorus lift · pass the check.',
  'Goals: open all six habits · run the mono check · pass the check.',
  'Goals: choose rate and depth · build the file name · inspect the bounce · pass the check.',
  'Goal: complete all eight steps of THE PROCESS.',
];
const pageDetail = (i: number): string | undefined => BEG_PAGE_DETAIL[i];

export function BeginningMixingLabScreen() {
  // Leaving the lab releases the ~15.4 MB of synthesized stems (owner ruling
  // 2026-09-11). Counted rather than a bare release, because the Advanced lab
  // shares the same cache — see retainSessionStems. The cost of coming back is
  // one re-render on the next PLAY, behind the RENDERING state the lab already
  // shows; it was 7.1 s before classicWave became a wavetable, which is why
  // this was not wired until now.
  useEffect(retainSessionStems, []);
  // ACCURACY CHIP RULE (owner 2026-10-31): kept (PagedLab's default) — the lab
  // shows real level readouts: Gain Staging's measured peak/RMS meters on the
  // rendered mixes, every comparison matched by measured RMS, all heard through
  // an uncalibrated phone output. The note sits at the top of each reading page
  // (PagedLab draws the header chip only on rack pages, and this lab has none);
  // the ⓘ has the header to itself.
  // The note's first line says what THIS lab measures (novice audit G4,
  // 2026-11-14: the generic list, light meters included, read as off-topic).
  // Phase 2 (D37, owner 2026-10-31: "too repetitive and doesn't need to be on
  // every screen"; the chip stays for labs with REAL-WORLD numbers): this
  // lab's meters read its own rendered mixes, so the chip is the ABOUT
  // variant, which shows only BEG_ACCURACY_DETAIL.
  return <PagedLab labId="mixing-beg" unitNoun="page" title="Beginning Mixing" subtitle={MIX_MANTRA} pages={PAGES} proNote pageGuide={beginningMixingPageGuide} endGuide={BEGINNING_MIXING_END_GUIDE} onPageDone={onPageDone} accuracyDetail={BEG_ACCURACY_DETAIL} accuracyVariant="about" pageDetail={pageDetail} pageCreditKeys={PAGE_KEYS} handsOnDetail={HANDS_ON_DETAIL} />;
}
