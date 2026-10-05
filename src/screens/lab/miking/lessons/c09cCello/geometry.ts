/**
 * C09c CELLO — where things are (charter §2 layer 2): the shared bowed
 * family's model for a seated cellist (lessons/shared/bowed/bowedModel.ts),
 * with the cello's clip attachment and its view boxes.
 */
import type { InstrumentModel } from '../../engine/model/types.ts';
import { bowedModel } from '../shared/bowed/bowedModel.ts';
import { CLEAR } from '../shared/bowed/bowedSpec.ts';
import { A, CLIP_AT, POSTURE } from './model.ts';

export const CELLO_VIEWS = {
  side: { u0: -800, u1: 1200, v0: -860, v1: 700 },
  top: { u0: -800, u1: 1200, v0: -780, v1: 800 },
};

export const CELLO_MODEL: InstrumentModel = bowedModel(POSTURE, {
  id: 'cello',
  name: 'cello',
  right: 'bow',
  views: CELLO_VIEWS,
  attach: [{ id: 'clip.strings', label: 'the C and A strings below the bridge', at: CLIP_AT }],
  front: POSTURE.ax.z,
  clearance: CLEAR.body,
  surfaces: [{ id: 'foot', partId: 'bw.bridge', label: 'the bridge’s foot', point: A.bridgeFoot, normal: POSTURE.ax.x, target: true }],
});
