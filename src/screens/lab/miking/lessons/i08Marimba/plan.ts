/** THE SETTING's plan, pure (collision pass 2026-10-15) — u → the audience,
 *  v down; mm; positions ILLUSTRATIVE: the marimba, other percussion
 *  and a drum kit beside it, a wedge in front of the player, a side fill.
 *  `cue`: the studio's headphone mix. */
import type { MalletPlanSpec } from '../shared/mallets/malletPlanModel.ts';

export const MARIMBA_PLAN: MalletPlanSpec = {
  box: { u0: -3000, u1: 3400, v0: -3300, v1: 3100 },
  things: [
    { id: 'marimba', kind: 'drums', u: 0, v: 0, scene: 'all' },
    { id: 'perc', kind: 'perc', u: -1500, v: -2300, scene: 'all' },
    { id: 'kit', kind: 'kit', u: -1700, v: 2000, scene: 'all' },
    { id: 'front', kind: 'wedge', u: 1500, v: 0, face: Math.PI, scene: 'stage' },
    { id: 'side', kind: 'sidefill', u: 0, v: -2800, face: Math.PI / 2, scene: 'stage' },
    { id: 'audience', kind: 'audience', u: 2700, v: 0, scene: 'stage' },
    { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
  ],
  cue: {
    wall: 'u0',
    hubAt: 1000,
    stations: [
      { of: 'marimba', at: { u: -1000, v: -560 } },
      { of: 'kit', at: { u: -2465, v: 2450 } },
    ],
  },
};
