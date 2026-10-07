/**
 * A SINGER ON A HOST (Lab 5): the voice's pieces added to another family's
 * model — the mouth as a part to name, the mouth as the TARGET surface vocal
 * distances are read from, the mouth's axis as a reference line, and the
 * mouth and nose as places the sound leaves — for one variant, in that
 * host's frame (voiceSpec.VoiceAnchor). The host's own player (the guitar
 * family's seated player, the piano lesson's pianist) is the body: its
 * envelopes stay the solids a vocal mic keeps clear of. Pure.
 */
import type { InstrumentModel, Provenance, VariantId } from '../../../engine/model/types.ts';
import type { VoiceAnchor } from './voiceSpec.ts';
import { mouthLine, mouthSurface, voiceRegions } from './voiceZones.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export type VoiceIds = { mouth: string; nose: string; surface: string; line: string; regions: string };

/** The ids a singer's pieces take on a host variant (unique per variant). */
export const voiceIds = (tag: string): VoiceIds => ({ mouth: `${tag}.mouth`, nose: `${tag}.nose`, surface: `mouth.${tag}`, line: `mouthAxis.${tag}`, regions: `r${tag}` });

export function addVoice(model: InstrumentModel, V: VoiceAnchor, ids: VoiceIds, variants: VariantId[]): InstrumentModel {
  return {
    ...model,
    parts: [
      ...model.parts,
      { id: ids.mouth, label: 'the singer’s mouth', short: 'mouth', role: 'Where the voice leaves the singer. Every vocal starting point is measured from the lips to the front of the mic — and every instrument mic hears this voice too.', prov: ill('the host player’s mouth (a drawing default)'), variants },
      { id: ids.nose, label: 'the singer’s nose', short: 'nose', role: 'On m, n and ng some of the voice leaves through the nose.', prov: ill('the host player’s nose (a drawing default)'), variants, listIn: [] },
    ],
    surfaces: [...model.surfaces, mouthSurface(V, { id: ids.surface, partId: ids.mouth, variants })],
    lines: [...model.lines, mouthLine(V, { id: ids.line, surface: ids.surface, variants })],
    regions: [...model.regions, ...voiceRegions(V, { mouthPart: ids.mouth, nosePart: ids.nose, prefix: ids.regions, variants })],
  };
}
