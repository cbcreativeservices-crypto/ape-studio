/**
 * I03c MARACAS — where things are (charter §2 layer 2), built from the states
 * in model.ts by the family helper (smallperc/build.ts): two maracas (head and
 * handle each), both arms, the pair's motion, and — for the singer — the vocal
 * mic on its boom.
 */
import type { Envelope, InstrumentModel, Part } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { ill, v3 } from '../shared/smallperc/geom.ts';
import { HANDLE, MAR_DIMS, motionOf, PM, STATES, VOCAL, type MarState } from './model.ts';

const HW = MAR_DIMS.headW.mm / 2;
const HH = MAR_DIMS.headH.mm / 2;

function parts(s: MarState): Part[] {
  const out: Part[] = [];
  s.m.forEach((m, i) => {
    const side = m.side === 'R' ? 'right-hand' : 'left-hand';
    out.push({ id: `mar.head${i}.${s.id}`, label: `${side} head`, short: 'head', role: 'The hollow vessel with the seeds inside — where the sound is made. Watch where each head travels, not the bottom of the handle.', moving: true, prov: MAR_DIMS.headH.prov, solid: { kind: 'capsule', a: v3(m.head.x, m.head.y - (HH - HW), m.head.z), b: v3(m.head.x, m.head.y + (HH - HW), m.head.z), r: HW } });
    out.push({ id: `mar.handle${i}.${s.id}`, label: `${side} handle`, short: 'handle', role: 'The handle the player holds. It makes little sound itself; a mic aimed at the handles misses the heads.', moving: true, prov: MAR_DIMS.len.prov, solid: { kind: 'cyl', a: v3(m.head.x, m.head.y + HH - 6, m.head.z), b: v3(m.head.x, m.head.y + HH - 6 + HANDLE, m.head.z), r: MAR_DIMS.handleD.mm / 2 } });
  });
  out.push({ id: `mar.seeds.${s.id}`, label: 'seeds (the fill inside each head)', short: 'seeds', role: 'Seeds or beads inside the heads: they strike and rub the vessel on each stroke — and roll round it when the wrist circles.', prov: ill('the fill is drawn as beads; material and amount vary') });
  if (s.id === 'singer') out.push({ id: 'mar.vocal', label: 'the singer’s vocal mic and its boom', short: 'vocal mic', role: 'The singer’s own mic, at the mouth. It hears the maracas too — more when a head passes near it.', prov: ill('a vocal mic at the mouth (proposal: h 1600 at the face); its boom is a drawing default'), solid: { kind: 'capsule', a: VOCAL.front, b: VOCAL.tail, r: 26 } });
  return out;
}

function state(s: MarState, label: string, blurb: string, phrase: string): StateSpec {
  const mo = motionOf(s);
  const env: Envelope[] = [];
  if (s.id === 'singer') {
    env.push({ id: 'env.vocalBoom', label: 'the vocal mic’s boom and stand', shape: { kind: 'capsule', a: VOCAL.tail, b: VOCAL.boomEnd, r: 12 }, prov: ill('the vocal mic’s boom (drawing default)') });
    env.push({ id: 'env.vocalStand', label: 'the vocal mic’s boom and stand', shape: { kind: 'capsule', a: VOCAL.boomEnd, b: v3(VOCAL.boomEnd.x, 0, 0), r: 14 }, prov: ill('the vocal mic’s stand (drawing default)') });
  }
  return {
    variant: { id: s.id, label, blurb, phrase },
    parts: parts(s),
    motion: { ...mo, label: 'the heads’ motion', prov: MAR_DIMS.stroke.prov },
    arms: s.m.map((m) => ({ id: `arm.${m.side}`, label: m.side === 'R' ? 'right' : 'left', arm: m.arm, sweep: 30 })),
    ref: { id: `p0.${s.id}`, partId: `mar.head0.${s.id}`, label: 'the midpoint between the heads', point: PM, normal: v3(1, 0, 0) },
    surfaces: s.id === 'pair' ? s.m.map((m, i) => ({ id: `head.${m.side}.pair`, partId: `mar.head${i}.pair`, label: m.side === 'R' ? 'the right-hand head' : 'the left-hand head', point: m.head, normal: v3(1, 0, 0), target: true })) : [],
    envelopes: env,
    regions: s.m.map((m, i) => ({ id: `r.head${i}.${s.id}`, partId: `mar.head${i}.${s.id}`, label: 'head', anchor: m.head, prov: MAR_DIMS.headH.prov, note: 'The head radiates the seeds’ impacts — the sound is made here, not at the handle.' })),
  };
}

export const MAR_MODEL: InstrumentModel = smallPercModel({
  id: 'maracas',
  name: 'maracas',
  states: [
    state(STATES.pair, 'A PAIR', 'A matched pair, one in each hand, heads up — two arms, two heads, often two different rhythms.', 'a pair'),
    state(STATES.singer, 'SINGER WITH MARACAS', 'The same pair played by a singer at a vocal mic: the vocal mic hears the maracas too.', 'played by a singer at a vocal mic'),
  ],
  views: {
    side: { u0: -560, u1: 940, v0: -1880, v1: -780 },
    top: { u0: -560, u1: 940, v0: -760, v1: 760 },
  },
});
