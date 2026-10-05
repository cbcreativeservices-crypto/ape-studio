/**
 * A04b EUPHONIUM — the collision model (charter §2 layer 2): the shared
 * low-brass family's model for a seated euphonium player, bell UP or bell
 * FRONT (lowBrassModel.ts), with the euphonium's own part words, its view
 * boxes and the player's path to stand.
 */
import type { InstrumentModel } from '../../engine/model/types.ts';
import { lowBrassModel } from '../shared/lowbrass/lowBrassModel.ts';
import { EUPH_VIEWS, SPEC, STAND_UP } from './model.ts';

export const EUPH_MODEL: InstrumentModel = lowBrassModel(SPEC, {
  id: 'euphBb',
  name: 'B♭ euphonium',
  centreLabel: 'the euphonium',
  views: EUPH_VIEWS,
  extraEnvelopes: [STAND_UP],
  variantWords: {
    up: { label: 'BELL UP', blurb: 'The bell points up, beside the player’s head — most concert setups.', phrase: 'the bell up' },
    front: { label: 'BELL FRONT', blurb: 'A bell-front model: the bell turns to face the audience, made for forward projection.', phrase: 'the bell to the front' },
  },
  words: {
    bell: 'The flared end of the tube — 30 cm across. Nearly all of the sound leaves from its opening: no mic goes in it, or very close over it.',
    body: { label: 'body and bows', short: 'body', role: 'A widening (conical) tube with a large bell, folded into a body that rests on the lap. The air inside vibrates; the metal gives off very little sound.' },
    valves: 'Three valves on top under the right hand and a fourth at the side under the left — a compensating model adds tubing to keep the low notes in tune. Keep mounts and cables clear of every valve hand.',
    leadpipe: 'Where the player’s lips buzz into the mouthpiece; the leadpipe carries the air into the valves. Nothing goes near the face.',
    slides: 'Tuning slides stick out of the body; the player pulls them to tune and to empty water. No clamp or cable here.',
    player: 'The euphonium player sits facing the audience, the instrument on the lap — and may stand. Their arms, both valve hands and the bell’s movement come first.',
  },
});
