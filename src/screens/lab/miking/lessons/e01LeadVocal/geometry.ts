/**
 * E01 LEAD VOCAL — where things are (charter §2 layer 2): one standing
 * singer in frame V (lessons/shared/voice: the lip point at the origin, +x
 * out of the mouth, +y down, +z to the singer's right), in two set-ups — the
 * STUDIO (closed-back headphones on, a screened condenser) and the STAGE (a
 * handheld vocal mic in a stand clip, a floor wedge in front). The singer's
 * size and stance are drawing defaults (lead_vocal/GEOMETRY_PROPOSAL.md §2).
 */
import type { InstrumentModel } from '../../engine/model/types.ts';
import { standingVoiceModel } from '../shared/voice/voiceModel.ts';

/** Head and shoulders with room in front for the farthest starting point
 *  (60 cm) and its stand; the legs and the floor run off the bottom (a
 *  stand is still drawn to the floor). Stage aspect ≈ 1.45. */
export const E01_VIEWS = {
  side: { u0: -400, u1: 900, v0: -380, v1: 520 },
  top: { u0: -400, u1: 900, v0: -450, v1: 450 },
};

export const E01_MODEL: InstrumentModel = standingVoiceModel({
  id: 'leadVocal',
  name: 'lead vocal',
  variants: [
    { id: 'studio', label: 'STUDIO', blurb: 'In a studio: the singer on closed-back headphones, the loudspeakers off, a studio condenser on a stand with a pop screen in front of it.', phrase: 'in a studio, on headphones' },
    { id: 'live', label: 'ON STAGE', blurb: 'On a stage: a handheld vocal mic in a stand clip, a floor wedge in front of the singer, the band and the PA around.', phrase: 'on a stage' },
  ],
  defaultVariant: 'studio',
  views: E01_VIEWS,
  phones: ['studio'],
  headset: ['live'],
});
