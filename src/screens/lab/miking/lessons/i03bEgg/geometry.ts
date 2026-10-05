/**
 * I03b EGG SHAKER — where things are (charter §2 layer 2), built from the
 * states in model.ts by the family helper (smallperc/build.ts).
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { ill, P0, v3 } from '../shared/smallperc/geom.ts';
import { EGG_DIMS, motionOf, STATES, type EggState } from './model.ts';

const PROV = EGG_DIMS.len.prov;
const R = EGG_DIMS.d.mm / 2;
const HL = EGG_DIMS.len.mm / 2;

function parts(s: EggState): Part[] {
  const out: Part[] = [];
  s.eggs.forEach((e, i) => {
    const tag = s.eggs.length > 1 ? (e.side === 'R' ? ' (right hand)' : ' (left hand)') : '';
    out.push({ id: `egg.shell${i}.${s.id}`, label: `egg shell${tag}`, short: 'egg', role: 'A small closed plastic shell with no handle, held in the palm or the fingers. The whole shell sounds when the fill inside strikes it.', moving: true, prov: PROV, solid: { kind: 'capsule', a: v3(e.c.x - (HL - R), e.c.y, e.c.z), b: v3(e.c.x + (HL - R), e.c.y, e.c.z), r: R } });
  });
  out.push({ id: `egg.fill.${s.id}`, label: 'fill (grains inside)', short: 'fill', role: 'The loose grains inside. They lag each change of direction and strike the shell: the attack; and roll along it: the wash.', prov: ill('the fill is drawn as beads; the amount and material vary by model') });
  out.push({ id: `egg.grip.${s.id}`, label: 'the grip (palm and fingers)', short: 'grip', role: 'The hand round the egg. A palm cupped over the shell can partly shield and damp it — so the grip changes what a mic hears.', prov: ill('a palm cup covering part of the shell (proposal)') });
  return out;
}

function state(s: EggState, label: string, blurb: string, phrase: string): StateSpec {
  const one = s.eggs.length === 1;
  const span = one ? motionOf(s.eggs[0]) : { a: v3(0, P0.y, s.eggs[1].c.z), b: v3(0, P0.y, s.eggs[0].c.z), r: EGG_DIMS.sweep.mm };
  return {
    variant: { id: s.id, label, blurb, phrase },
    parts: parts(s),
    motion: { ...span, label: one ? 'the egg’s motion' : 'the eggs’ motion', prov: EGG_DIMS.sweep.prov },
    arms: s.eggs.map((e) => ({ id: `arm.${e.side}`, label: e.side === 'R' ? 'right' : 'left', arm: e.arm, sweep: 25 })),
    ref: { id: `p0.${s.id}`, partId: `egg.shell0.${s.id}`, label: one ? 'the middle of the playing area' : 'the middle between the eggs', point: P0, normal: v3(1, 0, 0) },
    surfaces: s.id === 'apart' ? s.eggs.map((e, i) => ({ id: `egg.${e.side}.apart`, partId: `egg.shell${i}.apart`, label: e.side === 'R' ? 'the right-hand egg' : 'the left-hand egg', point: e.c, normal: v3(1, 0, 0), target: true })) : [],
    regions: s.eggs.map((e, i) => ({ id: `r.egg${i}.${s.id}`, partId: `egg.shell${i}.${s.id}`, label: 'egg', anchor: e.c, prov: PROV, note: 'The whole shell radiates — less where the palm covers it.' })),
  };
}

export const EGG_MODEL: InstrumentModel = smallPercModel({
  id: 'eggShaker',
  name: 'egg shaker',
  states: [
    state(STATES.one, 'ONE EGG', 'One egg in the right hand, shaken with the wrist.', 'one egg'),
    state(STATES.two, 'TWO, CLOSE', 'An egg in each hand, the hands close together in front of the player.', 'two eggs close together'),
    state(STATES.apart, 'HANDS APART', 'An egg in each hand, the hands wide apart, each playing its own part.', 'two eggs, hands apart'),
  ],
  views: {
    side: { u0: -560, u1: 760, v0: -1800, v1: -760 },
    top: { u0: -560, u1: 760, v0: -720, v1: 720 },
  },
});
