/**
 * A04a TUBA — the collision model (charter §2 layer 2): the shared low-brass
 * family's model for a seated tuba player, bell UP or bell FRONT
 * (lowBrassModel.ts), with the tuba's own part words and view boxes.
 */
import type { InstrumentModel } from '../../engine/model/types.ts';
import { lowBrassModel } from '../shared/lowbrass/lowBrassModel.ts';
import { SPEC, TUBA_VIEWS } from './model.ts';

export const TUBA_MODEL: InstrumentModel = lowBrassModel(SPEC, {
  id: 'tubaBb',
  name: 'B♭ tuba',
  centreLabel: 'the tuba',
  views: TUBA_VIEWS,
  variantWords: {
    up: { label: 'BELL UP', blurb: 'The bell points up, beside the player’s head — the usual orchestral tuba.', phrase: 'the bell up' },
    front: { label: 'BELL FRONT', blurb: 'The bell turns to face the audience — the form made for recording studios. (Older military tubas pointed back; a sousaphone wraps round the player.)', phrase: 'the bell to the front' },
  },
  words: {
    bell: 'The flared end of the tube — about 44 cm across here. Nearly all of the sound leaves from its opening: no mic goes in it or right over it.',
    body: { label: 'body and bows', short: 'body', role: 'About 5.5 m of widening tube in a B♭ tuba, folded into the big body that rests on the lap. The air inside vibrates; the metal gives off very little sound.' },
    valves: 'Four piston valves under the right hand switch extra lengths of tube in or out. The fingers move on top of them all the time: keep mics and cables clear.',
    leadpipe: 'Where the player’s lips buzz into the large mouthpiece; the leadpipe carries the air into the valves. Nothing goes near the face.',
    slides: 'Tuning slides stick out of the body; the player pulls them to tune and to empty water. They bend easily: never use one to hold the tuba or a mic.',
    player: 'The tuba player sits facing the audience, the tuba on the lap, leaning against them. Their arms, the valves and the bell’s sway come first.',
  },
});
