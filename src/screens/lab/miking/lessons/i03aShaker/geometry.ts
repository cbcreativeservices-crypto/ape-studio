/**
 * I03a HANDHELD SHAKER — where things are (charter §2 layer 2), built from the
 * states in model.ts by the family helper (smallperc/build.ts): the shell, its
 * fill, the player's right arm and the motion envelope agree in every state.
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { ill, P0, v3 } from '../shared/smallperc/geom.ts';
import { HALF, motionOf, R_SHELL, SHK_DIMS, STATES, type ShakerState } from './model.ts';

const SHELL_PROV = SHK_DIMS.d.prov;

function parts(s: ShakerState): Part[] {
  const a = v3(P0.x - s.axis.x * HALF, P0.y, P0.z - s.axis.z * HALF);
  const b = v3(P0.x + s.axis.x * HALF, P0.y, P0.z + s.axis.z * HALF);
  return [
    { id: `shk.shell.${s.id}`, label: 'shell (a clear tube)', short: 'shell', role: 'The closed tube the player holds. Its walls and end caps are what the fill strikes: they ring briefly and pass the sound to the air.', moving: true, prov: SHELL_PROV, solid: { kind: 'cyl', a, b, r: R_SHELL } },
    { id: `shk.fill.${s.id}`, label: 'fill (beads or grains inside)', short: 'fill', role: 'The loose fill inside. It lags behind each change of direction and hits the end and the walls — the attack — and slides and rubs along the wall in between — the wash.', prov: ill('the fill is drawn as beads; the material and amount vary by model') },
    { id: `shk.caps.${s.id}`, label: 'end caps', short: 'caps', role: 'The two closed ends. When the stroke reverses, the fill lands on one of them: that is where most of the accent starts.', prov: SHELL_PROV },
  ];
}

function state(s: ShakerState, label: string, blurb: string, phrase: string): StateSpec {
  const m = motionOf(s);
  return {
    variant: { id: s.id, label, blurb, phrase },
    parts: parts(s),
    motion: { ...m, label: 'the shake', prov: SHK_DIMS.sweep.prov },
    arms: [{ id: 'arm.R', label: 'right', arm: s.arm, sweep: 30 }],
    ref: { id: `p0.${s.id}`, partId: `shk.shell.${s.id}`, label: 'the middle of the playing area', point: P0, normal: v3(1, 0, 0) },
    regions: [{ id: `r.shell.${s.id}`, partId: `shk.shell.${s.id}`, label: 'shell', anchor: P0, prov: SHELL_PROV, note: 'The whole shell radiates: the fill’s impacts on the caps and walls, passed to the air.' }],
  };
}

export const SHK_MODEL: InstrumentModel = smallPercModel({
  id: 'handShaker',
  name: 'handheld shaker',
  states: [
    state(STATES.toward, 'TOWARD THE MIC', 'Shaken toward and away from the mic, the shell pointing at it: each forward stroke comes closer.', 'shaken toward and away from the mic'),
    state(STATES.side, 'SIDE TO SIDE', 'Shaken across, side to side, the shell pointing across: the distance to a mic in front changes less.', 'shaken side to side'),
  ],
  views: {
    side: { u0: -560, u1: 780, v0: -1800, v1: -760 },
    top: { u0: -560, u1: 780, v0: -620, v1: 620 },
  },
});
