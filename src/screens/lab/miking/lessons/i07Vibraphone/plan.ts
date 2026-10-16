/** THE SETTING's plan, pure (collision pass 2026-10-15) — u → the audience,
 *  v down; mm; positions ILLUSTRATIVE: the vibraphone, a drum kit and
 *  a bass amp beside it, a piano, a wedge in front of the player, a side
 *  fill on stage left — the two monitors the Studio-or-live page uses.
 *  `cue`: the studio's headphone mix. */
import type { MalletPlanSpec } from '../shared/mallets/malletPlanModel.ts';

export const VIBE_PLAN: MalletPlanSpec = {
  box: { u0: -2700, u1: 3300, v0: -2900, v1: 2700 },
  things: [
    { id: 'vibe', kind: 'drums', u: 0, v: 0, scene: 'all' },
    { id: 'kit', kind: 'kit', u: -1500, v: -1900, scene: 'all' },
    { id: 'bass', kind: 'amp', u: -1700, v: 1500, face: 0, scene: 'all' },
    { id: 'piano', kind: 'keys', u: -400, v: 1950, scene: 'all' },
    { id: 'front', kind: 'wedge', u: 1300, v: 0, face: Math.PI, scene: 'stage' },
    { id: 'side', kind: 'sidefill', u: 0, v: -2400, face: Math.PI / 2, scene: 'stage' },
    { id: 'audience', kind: 'audience', u: 2600, v: 0, scene: 'stage' },
    { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
  ],
  cue: {
    wall: 'v1',
    hubAt: 600,
    stations: [
      { of: 'vibe', at: { u: -850, v: -560 }, via: [{ u: -1250, v: -560 }] },
      { of: 'kit', at: { u: -2265, v: -1450 } },
      { of: 'piano', at: { u: -1000, v: 1520 } },
    ],
  },
};
