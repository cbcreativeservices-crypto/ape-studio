/**
 * I05b CLAVES — where things are (charter §2 layer 2), built from the states
 * in model.ts by the family helper (smallperc/build.ts).
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { ill, P0, v3 } from '../shared/smallperc/geom.ts';
import { CL, CLV_DIMS, CR, motionOf, STATES, type ClvState } from './model.ts';

function parts(s: ClvState): Part[] {
  const v = s.id;
  const hollow = v === 'hollow';
  return [
    { id: `clv.rest.${v}`, label: 'the supported clave', short: 'supported', role: 'Cradled over the curled fingers of one hand, able to ring, the hand’s hollow beneath it. It is struck in the middle — the resonating half of the pair.', prov: CLV_DIMS.len.prov, solid: { kind: 'cyl', a: v3(s.rest.x, s.rest.y, s.rest.z - CL / 2), b: v3(s.rest.x, s.rest.y, s.rest.z + CL / 2), r: CR } },
    { id: `clv.striker.${v}`, label: 'the striking clave', short: 'striker', role: 'Held like a drumstick, in the fingers, not pressed into the palm; its edge strikes the supported clave’s middle.', moving: true, prov: CLV_DIMS.len.prov, solid: { kind: 'cyl', a: s.striker.a, b: s.striker.b, r: CR } },
    { id: `clv.hollow.${v}`, label: 'the hand’s hollow', short: 'hollow', role: 'The curled fingers make a resonating chamber under the supported clave. Squeezed into the palm instead, the clave is choked.', prov: ill('the cradle drawn as the grip describes; its size is the hand’s') },
    ...(hollow ? [{ id: `clv.slot.${v}`, label: 'the hollowed body', short: 'hollowed', role: 'A hollowed-out body: a different pitch character from a solid pair — a model description, not a promise of a sound at the mic.', prov: { kind: 'sourced' as const, src: 'MEINL-CL3', quote: 'Hollowed out body' } }] : []),
  ];
}

function state(s: ClvState, label: string, blurb: string, phrase: string): StateSpec {
  const mo = motionOf(s);
  return {
    variant: { id: s.id, label, blurb, phrase },
    parts: parts(s),
    motion: { ...mo, label: 'the striker’s stroke', prov: CLV_DIMS.arc.prov },
    arms: [{ id: 'arm.R', label: 'right', arm: s.strike, sweep: 20 }, { id: 'arm.L', label: 'left', arm: s.cradle, sweep: 0 }],
    ref: { id: `p0.${s.id}`, partId: `clv.rest.${s.id}`, label: 'the middle of the striking area', point: P0, normal: v3(1, 0, 0) },
    regions: [{ id: `r.clave.${s.id}`, partId: `clv.rest.${s.id}`, label: 'clave', anchor: P0, prov: CLV_DIMS.len.prov, note: 'The struck clave and its hollow: a fast click and a short woody ring.' }],
  };
}

export const CLV_MODEL: InstrumentModel = smallPercModel({
  id: 'claves',
  name: 'claves',
  states: [
    state(STATES.solid, 'SOLID PAIR', 'A pair of solid hardwood claves.', 'a solid pair'),
    state(STATES.hollow, 'HOLLOWED PAIR', 'A pair with a hollowed-out body: a different pitch character, the same grip.', 'a hollowed pair'),
  ],
  views: {
    side: { u0: -560, u1: 760, v0: -1780, v1: -760 },
    top: { u0: -560, u1: 760, v0: -560, v1: 560 },
  },
});
