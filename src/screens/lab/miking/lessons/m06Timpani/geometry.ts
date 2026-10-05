/**
 * M06 TIMPANI — where things are (charter §2 layer 2). Every solid is BUILT
 * from model.ts and the timpano drawing defaults (shared/concert/TimpaniArt
 * TIMPANO_DRAW), so the art, the hit areas and the collision agree.
 */
import type { Envelope, InstrumentModel, Part, Provenance, ReferenceSurface, Shape3, Vec3 } from '../../engine/model/types.ts';
import { TIMPANO_DRAW, bowlDepth } from '../shared/concert/timpanoSpec.ts';
import { GAP_PAIR, HEAD_Y, R29, strikePoint, TIMP_DIMS, TIMPANI, type Timpano } from './model.ts';

const DEG = Math.PI / 180;
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const DRAW = ill('a drawing default (timpani/GEOMETRY_PROPOSAL.md: kettle and base sizes UNKNOWN)');
const DOWN: Vec3 = { x: 0, y: 1, z: 0 };

const T = TIMPANO_DRAW;
const vars = (t: Timpano) => (t.four ? ['four'] : undefined);
const name = (t: Timpano) => `${t.inch} in`;

/** The solids of one drum (the head, the counterhoop with its handles, the
 *  bowl as a solid cylinder, three legs, the pedal). */
export function timpanoSolids(t: Timpano): { head: Shape3; hoop: Shape3; bowl: Shape3; legs: Shape3[]; pedal: Shape3 } {
  const R = t.d.mm / 2;
  const c = t.c;
  const Db = bowlDepth(R);
  const ringY = c.y + 6 + Db * T.ringK;
  const legs = T.legsDeg.map<Shape3>((deg) => {
    const a = deg * DEG;
    return { kind: 'capsule', a: { x: c.x + Math.cos(a) * R * 0.85, y: ringY, z: c.z + Math.sin(a) * R * 0.85 }, b: { x: c.x + Math.cos(a) * (R + T.footOut), y: -20, z: c.z + Math.sin(a) * (R + T.footOut) }, r: 9 };
  });
  return {
    head: { kind: 'slab', c, axis: DOWN, r: R, x0: -0.5, x1: 0.5 },
    hoop: { kind: 'tube', c, axis: DOWN, rIn: R + 2, rOut: R + T.handle + 8, x0: -T.hoopUp - 16, x1: T.hoopDown },
    bowl: { kind: 'slab', c, axis: DOWN, r: R + T.lip, x0: 6, x1: 6 + Db },
    legs,
    pedal: { kind: 'box', min: { x: c.x - R - T.pedal.gap - T.pedal.len, y: -70, z: c.z - T.pedal.w / 2 }, max: { x: c.x - R - T.pedal.gap + 10, y: 0, z: c.z + T.pedal.w / 2 } },
  };
}

function drumParts(t: Timpano): Part[] {
  const s = timpanoSolids(t);
  const v = vars(t);
  const big = t.inch >= 29;
  return [
    { id: `tp.head${t.inch}`, label: `${name(t)} head`, short: `${t.inch} in head`, role: `The ${name(t)} drum’s head, tuned to a pitch. The mallet strikes it about a third of the way in from the hoop, on the player’s side.`, moving: true, clearance: TIMP_DIMS.headClear, prov: t.d.prov, variants: v, solid: s.head },
    { id: `tp.hoop${t.inch}`, label: `${name(t)} counterhoop and tension rods`, short: 'hoop', role: 'The hoop holds the head; T-handled tension rods round it set its tension. Keep hardware off the hoop and the handles.', prov: DRAW, variants: v, listIn: t.id === 't29' ? undefined : [], solid: s.hoop },
    { id: `tp.bowl${t.inch}`, label: `${name(t)} bowl (kettle)`, short: 'bowl', role: big ? 'The copper bowl under the head. Its air pushes back on the head and pulls its main vibration shapes into near-harmonic steps — the reason a timpani has a clear pitch.' : 'The bowl under the head: the air inside works with the head to give the drum its pitch.', prov: DRAW, variants: v, listIn: t.id === 't29' ? undefined : [], solid: s.bowl },
    { id: `tp.pedal${t.inch}`, label: `${name(t)} pedal`, short: 'pedal', role: 'On the player’s side: pressing the pedal tightens the head and raises the pitch. The player retunes with it during a piece — feet and pedals are the player’s space.', moving: true, prov: { kind: 'sourced', src: 'YMH-TIMP-MECH', quote: 'On pedal-type timpani, the head will tighten when the pedal is depressed (producing a higher pitch)' }, variants: v, listIn: t.id === 't29' ? undefined : [], solid: s.pedal },
    ...s.legs.map<Part>((sh, i) => ({ id: `tp.leg${t.inch}.${i}`, label: 'leg and caster', short: 'leg', role: 'A leg of the stand with its caster.', prov: DRAW, variants: v, listIn: [], solid: sh })),
  ];
}

const TWO = TIMPANI.filter((t) => !t.four);

/** The mallets' reach over one drum: the player's half, from the head up. */
function malletSector(t: Timpano): Envelope {
  return {
    id: `env.mallets${t.inch}`,
    label: `the mallets over the ${name(t)} drum`,
    shape: { kind: 'sector', c: t.c, r0: 0, r1: t.d.mm / 2 + TIMP_DIMS.malletOut.mm, a0: 0.55 * Math.PI, a1: 1.45 * Math.PI, y0: HEAD_Y - TIMP_DIMS.malletH.mm, y1: HEAD_Y },
    prov: TIMP_DIMS.malletH.prov,
    variants: vars(t),
    clearance: 15,
  };
}

const surface = (t: Timpano): ReferenceSurface => ({
  id: `head${t.inch}`,
  partId: `tp.head${t.inch}`,
  label: `the ${t.inch} in head`,
  point: t.c,
  normal: { x: 0, y: -1, z: 0 },
  plus: { words: 'above', key: 'ABOVE' },
  minus: { words: 'below', key: 'BELOW' },
  variants: vars(t),
});

export const TIMP_MODEL: InstrumentModel = {
  id: 'timpaniPair',
  name: 'pair of timpani (29 and 26 in)',
  parts: TIMPANI.flatMap(drumParts),
  regions: [
    ...TWO.map((t) => ({ id: `r.strike${t.inch}`, partId: `tp.head${t.inch}`, label: `${t.inch} in strike`, anchor: strikePoint(t), prov: { kind: 'sourced' as const, src: 'YMH-TIMP-STRIKE', quote: 'Striking the head about one-third of the radius from the hoop will produce a full tone' }, note: `The mallet strikes the ${t.inch} in head a third of the way in from the hoop: the attack starts there, and the head rings mostly in its pitched shapes.` })),
  ],
  surfaces: [
    { id: 'heads', partId: 'tp.head29', label: 'the heads', point: { x: 0, y: HEAD_Y, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
    ...TIMPANI.map(surface),
  ],
  lines: [
    { id: 'gap', label: 'the centre gap', point: GAP_PAIR, dir: { x: 0, y: 1, z: 0 } },
    { id: 'rim29', label: 'the 29 in rim', point: drum29().c, dir: { x: 0, y: 1, z: 0 }, offset: R29, words: { plus: 'out from', minus: 'in from', keyPlus: 'OUT FROM RIM', keyMinus: 'IN FROM RIM' } },
  ],
  envelopes: [
    ...TIMPANI.map(malletSector),
    {
      id: 'env.player',
      label: 'the player',
      shape: { kind: 'box', min: { x: -1080, y: -1750, z: -560 }, max: { x: -R29 - 230, y: 0, z: 560 } },
      prov: ill('the timpanist behind the pair; no source gives a position'),
      variants: ['two'],
    },
    {
      id: 'env.player4',
      label: 'the player',
      shape: { kind: 'box', min: { x: -1080, y: -1750, z: -1150 }, max: { x: -R29 - 230, y: 0, z: 1150 } },
      prov: ill('the timpanist behind the set; no source gives a position'),
      variants: ['four'],
    },
  ],
  variants: [
    { id: 'two', label: 'TWO DRUMS', blurb: 'A pair: 29 in on the player’s left, 26 in on the right (the international order).', phrase: 'two drums' },
    { id: 'four', label: 'FOUR DRUMS', blurb: 'A set of four: 32, 29, 26 and 23 in, larger on the player’s left (the international order; a German set is mirrored).', phrase: 'four drums' },
  ],
  defaultVariant: 'two',
  views: {
    side: { u0: -1100, u1: 950, v0: HEAD_Y - 1180, v1: 40 },
    top: { u0: -1100, u1: 950, v0: -900, v1: 900 },
  },
  viewsByVariant: { four: { top: { u0: -1100, u1: 950, v0: -1750, v1: 1500 } } },
  yFloor: { mm: 0, prov: ill('the floor is the frame’s origin (the head height above it is the unknown)') },
  // The air under the 29 in head (a mic can never get there).
  interior: { x0: 1, x1: 200, rIn: R29 - 10, c: drum29().c, axis: DOWN },
  ports: { two: null, four: null },
};

function drum29(): Timpano {
  return TIMPANI.find((t) => t.id === 't29')!;
}
