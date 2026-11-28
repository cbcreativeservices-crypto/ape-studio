/**
 * hudC — instrument strips: mix, voices, net. Contract: gaHudTypes.ts.
 *
 *   mix      cMix.tsx      one meter per bus: level, fader, MUTE, SOLO, the DUCK
 *   voices   cVoices.tsx   one slot per voice of the budget: stolen, waiting, refused
 *   net      cNet.tsx      an action on its way to each machine, and what became of it
 *
 * What they read from the model is in cModel.ts (pure, tested by
 * test/gameAudioHudC.test.ts). The tool-window display for page 20 is
 * `GaToolsStage` (cToolsStage.tsx): a page mounts it through `glass`.
 */
import type { GaHudMap } from './gaHudTypes';
import { MixStrip } from './cMix';
import { NetStrip } from './cNet';
import { VoicesStrip } from './cVoices';

export const GA_HUDS_C: GaHudMap = {
  mix: MixStrip,
  voices: VoicesStrip,
  net: NetStrip,
};

export { GaToolsStage, type GaToolsStageProps } from './cToolsStage';
