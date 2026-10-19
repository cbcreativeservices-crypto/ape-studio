/**
 * skipOptional — the way PAST the optional equipment paths (learning review 2
 * W1): screens 16, 17 and 18 (a laptop rig, turntables, a digital vinyl
 * system) are optional; a learner on a standalone or media-player rig skips
 * straight to Screen 19 (Microphones). The jump goes through the page shell's
 * own navigation (skipTarget.skipToMic → `ctx.goTo`), to the index the
 * registry gives screen 19 — read at press time, so this file never imports
 * the page index that imports it (no import cycle).
 */
import { View } from 'react-native';
import { LabChip } from '../../LabShell';
import type { PageCtx } from '../../kit/PagedLab';
import { Note } from '../bits';
import { getDjRegistry } from './registryRuntime';
import { SKIP_LABEL, skipToMic } from './skipTarget';

/** The note and the button, worded as optional equipment paths. `here` names
 *  where the learner stands (15: before the paths; 16–18: on one of them). */
export function SkipOptional({ ctx, here }: { ctx: PageCtx; here: 15 | 16 | 17 | 18 }) {
  const text =
    here === 15
      ? 'Next come three OPTIONAL equipment screens: 16 a laptop rig, 17 turntables, 18 a digital vinyl system. On a standalone or media-player rig you can skip all three — nothing from Screen 19 (Microphones) on needs them.'
      : here === 18
        ? 'An optional screen, for a digital vinyl system. It builds on Screen 16 (laptop audio) and 17 (turntables) — do those first if you can. Without one, go on to the next screen (19, Microphones).'
        : `An optional screen, for ${here === 16 ? 'a laptop rig' : 'turntables'}. Screens 16–18 are all optional equipment paths: on a standalone or media-player rig, skip to Screen 19 (Microphones) — nothing after 18 needs them.`;
  return (
    <View style={{ gap: 8 }}>
      <Note>{text}</Note>
      <View style={{ flexDirection: 'row' }}>
        <LabChip label={SKIP_LABEL} selected={false} onPress={() => void skipToMic(ctx, getDjRegistry().numbers)} />
      </View>
    </View>
  );
}
