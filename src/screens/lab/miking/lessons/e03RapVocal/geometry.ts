/**
 * E03 RAP AND RHYTHMIC VOCAL — where things are (charter §2 layer 2): the
 * E01 standing singer in frame V (lessons/shared/voice; rap_vocal/
 * GEOMETRY_PROPOSAL.md: "Reuse lead_vocal/GEOMETRY_PROPOSAL.md unchanged"),
 * in the STUDIO (closed-back headphones, the WORKING ZONE the rapper moves in
 * drawn round the head — its size a drawing default) and on STAGE.
 */
import type { InstrumentModel } from '../../engine/model/types.ts';
import { standingVoiceModel } from '../shared/voice/voiceModel.ts';

export const E03_VIEWS = {
  side: { u0: -420, u1: 900, v0: -390, v1: 520 },
  top: { u0: -420, u1: 900, v0: -455, v1: 455 },
};

export const E03_MODEL: InstrumentModel = standingVoiceModel({
  id: 'rapVocal',
  name: 'rap vocal',
  variants: [
    { id: 'studio', label: 'STUDIO', blurb: 'In a studio: the rapper on closed-back headphones, the loudspeakers off, a working zone agreed for the head’s movement.', phrase: 'in a studio, on headphones' },
    { id: 'live', label: 'ON STAGE', blurb: 'On a stage: a handheld vocal mic, a floor wedge in front, the beat loud through the PA.', phrase: 'on a stage' },
  ],
  defaultVariant: 'studio',
  views: E03_VIEWS,
  phones: ['studio'],
  headset: ['live'],
});
