/** THE SETTING's plan, pure (collision pass 2026-10-15) — u → the audience,
 *  v down; mm; positions ILLUSTRATIVE: the glockenspiel, other
 *  percussion and a drum kit beside it, a wedge in front of the player, a
 *  side fill.
 *  `cue`: the studio's headphone mix. */
import type { MalletPlanSpec } from '../shared/mallets/malletPlanModel.ts';

export const GLOCK_PLAN: MalletPlanSpec = {
  box: { u0: -2400, u1: 3000, v0: -2300, v1: 2300 },
  things: [
    { id: 'glock', kind: 'drums', u: 0, v: 0, scene: 'all' },
    { id: 'perc', kind: 'perc', u: -1200, v: -1600, scene: 'all' },
    { id: 'kit', kind: 'kit', u: -1300, v: 1500, scene: 'all' },
    { id: 'front', kind: 'wedge', u: 1100, v: 0, face: Math.PI, scene: 'stage' },
    { id: 'side', kind: 'sidefill', u: 0, v: -1900, face: Math.PI / 2, scene: 'stage' },
    { id: 'audience', kind: 'audience', u: 2200, v: 0, scene: 'stage' },
    { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
  ],
  cue: {
    wall: 'u0',
    hubAt: 700,
    stations: [
      { of: 'glock', at: { u: -780, v: -560 } },
      { of: 'kit', at: { u: -1860, v: 1960 } },
    ],
  },
};
