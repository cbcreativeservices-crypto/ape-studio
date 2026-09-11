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
import { PagedLab } from '../kit/PagedLab';
import { MIX_MANTRA } from './kit';
import { MIXING_PAGES_A } from './pagesA';
import { MIXING_PAGES_B } from './pagesB';
import { MIXING_PAGES_C } from './pagesC';
import { MIXING_PAGES_D } from './pagesD';

const PAGES = [...MIXING_PAGES_A, ...MIXING_PAGES_B, ...MIXING_PAGES_C, ...MIXING_PAGES_D];

// NOTE (resource hygiene 2026-09-11): the ~15.4 MB of synthesized stems that
// audio/mixAudio.ts memoizes is still NOT released when this screen unmounts.
// releaseSessionStems() exists and is safe to call; re-synthesis was ~7.1 s of
// blocked JS, which settled the question, but the wavetable rewrite of
// earDsp.classicWave brought it to ~350 ms on desktop V8. Holding the memory is
// now a choice rather than a necessity — see the cache comment in
// audio/mixAudio.ts, and the owner's call either way.
export function BeginningMixingLabScreen() {
  return <PagedLab labId="mixing-beg" title="Beginning Mixing" subtitle={MIX_MANTRA} pages={PAGES} />;
}
