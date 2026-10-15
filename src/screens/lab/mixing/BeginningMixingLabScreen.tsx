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

const PAGES = [...MIXING_PAGES_A, ...MIXING_PAGES_B, ...MIXING_PAGES_C, ...MIXING_PAGES_D];

// CERTIFICATE CREDIT, PAGE BY PAGE (owner 2026-10-13): each page marked done
// reports its stable server key (trainingLabKeys MIXING_BEG_PAGE_IDS, in page order).
// PagedLab fires this once per newly-done REAL page (never the check page).
const onPageDone = (index: number) => reportTrainingComplete(mixingPageKeyAt('beg', index));
// The same keys, so a page banked to the account reads CREDITED after START
// OVER (PRACTICE) — credit is never shown as missing (toddler pass 2026-10-13).
const PAGE_KEYS = PAGES.map((_, i) => mixingPageKeyAt('beg', i));

export function BeginningMixingLabScreen() {
  // Leaving the lab releases the ~15.4 MB of synthesized stems (owner ruling
  // 2026-09-11). Counted rather than a bare release, because the Advanced lab
  // shares the same cache — see retainSessionStems. The cost of coming back is
  // one re-render on the next PLAY, behind the RENDERING state the lab already
  // shows; it was 7.1 s before classicWave became a wavetable, which is why
  // this was not wired until now.
  useEffect(retainSessionStems, []);
  return <PagedLab labId="mixing-beg" title="Beginning Mixing" subtitle={MIX_MANTRA} pages={PAGES} proNote onPageDone={onPageDone} pageCreditKeys={PAGE_KEYS} handsOnDetail={HANDS_ON_DETAIL} />;
}
