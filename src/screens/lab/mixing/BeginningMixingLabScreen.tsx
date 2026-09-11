/**
 * Beginning Mixing Lab (owner GO 2026-09-11) — COMPLETE: 15 pages on the
 * PagedLab shell. Purpose (brief): a clear, balanced basic stereo mix via a
 * repeatable process — What Mixing Does → Prep → Signal Flow → Gain Staging →
 * Static Mix → Subtractive → Panning → EQ in Context → Compression → Reverb &
 * Delay → Auxes & Subgroups → Automation → Check & Finish → Export → the
 * guided Final Mix. COPY IS NEW — owner ratification pending
 * (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
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

export function BeginningMixingLabScreen() {
  return <PagedLab labId="mixing-beg" title="Beginning Mixing" subtitle={MIX_MANTRA} pages={PAGES} />;
}
