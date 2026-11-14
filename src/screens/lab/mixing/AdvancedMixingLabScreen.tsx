/**
 * Advanced Mixing Lab (owner GO 2026-09-11) — 20 pages on the PagedLab shell.
 * Purpose (brief): manage, refine, troubleshoot and professionally DELIVER
 * complex mixes. Boundary vs Beginning: "can you create a clear, balanced
 * stereo mix?" vs "can you deliver a complex one?" Prerequisite is a SOFT
 * gate (page 1): auto-met when the Beginning lab is complete on this device,
 * else a three-check knowledge pass — never a hard wall.
 * COPY RATIFIED by the owner 2026-09-11
 * (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 *
 * Shares the Beginning lab's kit, engines and renderer; adds the AML render
 * stages (sidechain, parallel blend, linked bus comp, drive, M/S width) and
 * the advanced engine (phase math, LUFS/true-peak ESTIMATES, stem null test).
 */
import { useEffect } from 'react';
import { PagedLab } from '../kit/PagedLab';
import { mixingPageKeyAt } from '../../../features/lab/trainingLabKeys';
import { reportTrainingComplete } from '../../../features/lab/trainingSignal';
import { retainSessionStems } from './audio/mixAudio';
import { HANDS_ON_DETAIL, MIX_MANTRA } from './kit';
import { MIXING_ADV_PAGES_A } from './pagesAdvA';
import { MIXING_ADV_PAGES_B } from './pagesAdvB';
import { MIXING_ADV_PAGES_C } from './pagesAdvC';
import { MIXING_ADV_PAGES_D } from './pagesAdvD';
// Screen Guide (owner 2026-10-31): "this page, explained" — one guide per page.
// The what's-left screen has its own (WHERE YOU ARE), via PagedLab's endGuide.
import { ADVANCED_MIXING_END_GUIDE, advancedMixingPageGuide } from './advancedMixingScreenGuides';

const PAGES = [...MIXING_ADV_PAGES_A, ...MIXING_ADV_PAGES_B, ...MIXING_ADV_PAGES_C, ...MIXING_ADV_PAGES_D];

// CERTIFICATE CREDIT, PAGE BY PAGE (owner 2026-10-13): each page marked done
// reports its stable server key (trainingLabKeys MIXING_ADV_PAGE_IDS, in page order).
// PagedLab fires this once per newly-done REAL page (never the check page).
const onPageDone = (index: number) => reportTrainingComplete(mixingPageKeyAt('adv', index));
// The same keys, so a page banked to the account reads CREDITED after START
// OVER (PRACTICE) — credit is never shown as missing (toddler pass 2026-10-13).
const PAGE_KEYS = PAGES.map((_, i) => mixingPageKeyAt('adv', i));
const ADV_ACCURACY_DETAIL =
  'In this lab: LUFS and true-peak readings are BS.1770-style ESTIMATES, and the peak, RMS, crest, null-test and decay numbers measure the lab’s own rendered mixes, played through your phone’s uncalibrated output. Learn the decisions here; deliver with calibrated monitors and certified meters.';

/**
 * WHAT'S LEFT, row by row (phase 2, 2026-11-14): each unfinished page names
 * its OWN goals (the chips at its foot); the shared rule (HANDS_ON_DETAIL) is
 * printed once above the list. With sound off a ▶ tap counts as looked at
 * (kit.tsx, the silent path). Pinned by test/labFixes_20261114_F4.
 */
export const ADV_PAGE_DETAIL: readonly string[] = [
  'Goal: finish Beginning Mixing, or pass the three checks on this page.',
  'Goals: open every planning move · commit to three priorities · pass the check.',
  'Goals: open every practice · pass the check.',
  'Goals: play dry, bus comp and per-track comp · pass the check.',
  'Goals: open every routing tool · pass the check.',
  'Goals: play dry, insert and parallel · pass the check.',
  'Goals: play crowded vs complementary · open all four tools · pass the check.',
  'Goals: play the kick ducking the bass · open all five tools · pass the check.',
  'Goals: explore two comb delays · pass the check.',
  'Goals: play room vs hall · open all four tools · pass the check.',
  'Goals: play clean, gentle and hard drive · open all four cards · pass the check.',
  'Goals: play mixed, widened and the mono price · pass the check.',
  'Goals: play static vs section-designed · open all four moves · pass the check.',
  'Goals: play clean, conservative and overcooked · pass the check.',
  'Goals: measure the mix · run the mono fold · pass the check.',
  'Goals: open all five cards · pass the check.',
  'Goals: run the null test · pass the check.',
  'Goals: open all three practices · check the whole checklist · pass the check.',
  'Goal: solve all three cases.',
  'Goal: complete all seven steps of the repair.',
];
const pageDetail = (i: number): string | undefined => ADV_PAGE_DETAIL[i];

export function AdvancedMixingLabScreen() {
  // Same release valve as the Beginning lab, and deliberately the same COUNTED
  // one: the two labs share a single stems cache, so neither may drop it while
  // the other is still on screen. See retainSessionStems in audio/mixAudio.ts.
  useEffect(retainSessionStems, []);
  // ACCURACY CHIP RULE (owner 2026-10-31): kept (PagedLab's default) — the lab
  // shows real-world measurement numbers: LUFS and true-peak estimates
  // (BS.1770-style), peak / RMS / crest readouts, null-test residues and RT60
  // decays. The note sits at the top of each reading page (PagedLab draws the
  // header chip only on rack pages, and this lab has none); the ⓘ has the
  // header to itself.
  // The note's first line says what THIS lab measures (novice audit G4, 2026-11-14).
  return <PagedLab labId="mixing-adv" title="Advanced Mixing" subtitle={MIX_MANTRA} pages={PAGES} proNote pageGuide={advancedMixingPageGuide} endGuide={ADVANCED_MIXING_END_GUIDE} onPageDone={onPageDone} accuracyDetail={ADV_ACCURACY_DETAIL} pageDetail={pageDetail} pageCreditKeys={PAGE_KEYS} handsOnDetail={HANDS_ON_DETAIL} />;
}
