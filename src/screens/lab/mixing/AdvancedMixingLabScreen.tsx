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
import { PagedLab } from '../kit/PagedLab';
import { MIX_MANTRA } from './kit';
import { MIXING_ADV_PAGES_A } from './pagesAdvA';
import { MIXING_ADV_PAGES_B } from './pagesAdvB';
import { MIXING_ADV_PAGES_C } from './pagesAdvC';
import { MIXING_ADV_PAGES_D } from './pagesAdvD';

const PAGES = [...MIXING_ADV_PAGES_A, ...MIXING_ADV_PAGES_B, ...MIXING_ADV_PAGES_C, ...MIXING_ADV_PAGES_D];

// NOTE (resource hygiene 2026-09-11): the stems cache is deliberately NOT
// released on unmount — same reasoning as BeginningMixingLabScreen.
export function AdvancedMixingLabScreen() {
  return <PagedLab labId="mixing-adv" title="Advanced Mixing" subtitle={MIX_MANTRA} pages={PAGES} />;
}
