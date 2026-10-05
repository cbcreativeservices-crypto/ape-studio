/**
 * A03 FRENCH HORN — the collision model (charter §2 layer 2): the shared
 * low-brass family's model for a seated horn player (lowBrassModel.ts), with
 * the horn's own part words and view boxes.
 */
import type { InstrumentModel } from '../../engine/model/types.ts';
import { lowBrassModel } from '../shared/lowbrass/lowBrassModel.ts';
import { HORN_VIEWS, SPEC } from './model.ts';

export const HORN_MODEL: InstrumentModel = lowBrassModel(SPEC, {
  id: 'hornFBb',
  name: 'double horn in F/B♭',
  centreLabel: 'the horn (its coil)',
  views: HORN_VIEWS,
  variantWords: {
    back: { label: 'SEATED', blurb: 'Seated, the horn held in front of the right side of the chest, the bell behind the right hip pointing back — the usual concert position.', phrase: 'the player seated' },
  },
  words: {
    bell: 'The flared end of the tube. On the horn it points BEHIND the player and out to the right, and the player’s right hand sits inside it. Nearly all of the sound leaves here.',
    body: { label: 'coiled tube', short: 'coil', role: 'About 3.75 m of tube on the F side, wound into a hand-held circle. The air inside it vibrates; the metal itself gives off very little sound.' },
    valves: 'Four rotary valves under the left hand switch extra lengths of tube in or out — and switch a double horn between its F and B♭ sides. Keep mounts and cables away from the levers.',
    leadpipe: 'Where the player’s lips buzz into the mouthpiece; the leadpipe carries the air into the valves. Nothing goes near the player’s face or this line.',
    slides: 'U-shaped tuning slides stick out of the coil; the player pulls them to tune and to empty water. No clamp or cable here.',
    player: 'The horn player sits facing the audience. The right arm bends back to the bell; the left hand works the valves. Their space — and the bell’s — comes first.',
    hand: 'The right hand sits inside the bell: it supports the horn and shades the tone and the pitch; pushed further in, it “stops” the note for a keen, metallic sound. Never move it to fit a mic.',
  },
});
