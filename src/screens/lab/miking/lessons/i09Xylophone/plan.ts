/** THE SETTING's plan, pure (collision pass 2026-10-15) — u → the audience,
 *  v down; mm; positions ILLUSTRATIVE: the xylophone, other percussion
 *  and a drum kit beside it, a wedge in front of the player, a side fill.
 *  `cue`: the studio's headphone mix. */
import type { MalletPlanSpec } from '../shared/mallets/malletPlanModel.ts';

export const XYLO_PLAN: MalletPlanSpec = {
  box: { u0: -2700, u1: 3300, v0: -2600, v1: 2600 },
  things: [
    { id: 'xylo', kind: 'drums', u: 0, v: 0, scene: 'all' },
    { id: 'perc', kind: 'perc', u: -1300, v: -1900, scene: 'all' },
    { id: 'kit', kind: 'kit', u: -1500, v: 1800, scene: 'all' },
    { id: 'front', kind: 'wedge', u: 1300, v: 0, face: Math.PI, scene: 'stage' },
    { id: 'side', kind: 'sidefill', u: 0, v: -2200, face: Math.PI / 2, scene: 'stage' },
    { id: 'audience', kind: 'audience', u: 2500, v: 0, scene: 'stage' },
    { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
  ],
  cue: {
    wall: 'u0',
    hubAt: 800,
    stations: [
      { of: 'xylo', at: { u: -950, v: -560 } },
      { of: 'kit', at: { u: -2060, v: 2260 } },
    ],
  },
};
