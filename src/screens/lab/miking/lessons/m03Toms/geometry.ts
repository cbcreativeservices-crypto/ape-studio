/**
 * M03 RACK AND FLOOR TOMS — where things are (charter §2 layer 2), in the
 * KIT frame. Every solid, surface, line and view box is BUILT from the
 * shared drum family (drumSpec.ts) and the shared kit (kitPlanModel.ts).
 * Anchor ids follow toms/GEOMETRY_PROPOSAL.md §3.
 */
import type { InstrumentModel, Part, Provenance, Shape3, ViewBox } from '../../engine/model/types.ts';
import { drumSolids, frameOf, hoopRadii, pointOn, type PlacedDrum } from '../shared/drums/drumSpec.ts';
import { CYMBAL_PROFILE, KIT, KIT_CYMBALS, KIT_DRUMS, PLAN_HARDWARE } from '../shared/kitPlanModel.ts';
import { F1, F2, FF, FLOOR, stickSector, TOM1, TOM2, TOM_DIMS as D, TOM_RIMS } from './model.ts';

const DEG = Math.PI / 180;
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const layout = ill('the shared 5-piece kit (kit/GEOMETRY_PROPOSAL.md §2): a typical right-handed layout');
const FLOOR_Y = D.yFloor.mm;
const RACK: readonly string[] = ['rack'];
const FLOORS: readonly string[] = ['floor', 'open'];

/** A tom's parts (ids `<key>.batter` …), present in all setups, listed in `listIn`. */
function tomParts(key: string, d: PlacedDrum, name: string, listIn: readonly string[], resoVariants?: string[]): Part[] {
  const S = drumSolids(d);
  const size = d.spec.d.prov;
  return [
    { id: `${key}.batter`, label: `${name} batter head`, short: 'batter', role: 'The top head, struck by the sticks. The attack starts here.', moving: true, clearance: D.headClear, prov: size, listIn: [...listIn], solid: S.batter },
    { id: `${key}.reso`, label: `${name} resonant head`, short: 'bottom head', role: 'The bottom head. The air inside drives it: it carries much of the drum’s ring and low end — no wires, unlike a snare.', moving: true, clearance: D.resoClear, prov: size, listIn: [...listIn], variants: resoVariants, solid: S.reso! },
    { id: `${key}.shell`, label: `${name} shell`, short: 'shell', role: 'The wooden shell between the heads. With the air inside, it couples the two heads.', prov: d.spec.tShell.prov, listIn: [...listIn], solid: S.shell },
    { id: `${key}.hoop`, label: `${name} hoop (the rim)`, short: 'rim', role: 'The metal hoop holding the batter head — the rim the starting points read from. Rim hits strike it.', prov: d.spec.hoop.t.prov, listIn: [...listIn], solid: S.hoopTop },
    { id: `${key}.hoopBottom`, label: `${name} bottom hoop`, short: 'bottom rim', role: 'The hoop holding the resonant head.', prov: d.spec.hoop.t.prov, listIn: [], variants: resoVariants, solid: S.hoopBottom! },
    { id: `${key}.lugs`, label: `${name} lugs and rods`, short: 'lugs', role: 'The tension rods and lugs that tune each head. A mic between two lugs is not a starting point.', prov: d.spec.rods.n.prov, listIn: [...listIn], solid: S.lugs },
  ];
}

/* ── the floor tom's legs and the rack toms' mount (drawing defaults) ── */
const legs = FLOOR.spec.legs!;
export const FLOOR_LEGS = Array.from({ length: legs.n.mm }, (_, k) => {
  const th = legs.phaseDeg.mm + (k * 360) / legs.n.mm;
  return { top: pointOn(FF, FF.R + 18, th, FF.depth * 0.3), foot: { ...pointOn(FF, FF.R + legs.spread.mm, th, 0), y: FLOOR_Y } };
});
const post = PLAN_HARDWARE.tomPost;
const KICK_TOP_Y = -Math.sqrt(KIT.kick.R ** 2 - post.v ** 2);
export const MOUNT = {
  base: { x: post.u, y: KICK_TOP_Y, z: post.v },
  top: { x: post.u, y: TOM2.c.y + 230, z: post.v },
  arms: [TOM1, TOM2].map((d) => {
    const f = frameOf(d);
    const dx = post.u - d.c.x;
    const dz = post.v - d.c.z;
    const th = Math.atan2(dz, dx) / DEG;
    return pointOn(f, f.R + 20, th, f.depth * 0.55);
  }),
};

/* ── neighbour hulls ── */
const hull = (d: PlacedDrum): Shape3 => {
  const f = frameOf(d);
  return { kind: 'slab', c: f.c, axis: f.axis, r: hoopRadii(d.spec).rOut + d.spec.lug.out.mm, x0: -d.spec.hoop.above.mm, x1: f.depth + d.spec.hoop.above.mm };
};
const cymHull = (id: 'crash1' | 'crash2' | 'ride' | 'hihat'): Shape3 => {
  const c = KIT_CYMBALS[id];
  const t = c.tiltDeg * DEG;
  return { kind: 'slab', c: c.c, axis: { x: Math.sin(t), y: Math.cos(t), z: 0 }, r: c.d / 2, x0: -CYMBAL_PROFILE.rise * c.d, x1: c.pair ? 12 : 3 };
};
const sector = (d: PlacedDrum): Shape3 => {
  const s = stickSector(d);
  const R = d.spec.d.mm / 2;
  const f = frameOf(d);
  return { kind: 'sector', c: d.c, r0: 0, r1: R + D.stickOut.mm, a0: s.a0 * DEG, a1: s.a1 * DEG, y0: d.c.y - D.stickUp.mm, y1: d.c.y + R * Math.sin(d.tiltDeg * DEG) - 12 - f.depth * 0 };
};

const parts: Part[] = [
  ...tomParts('tom2', TOM2, '12 in tom', RACK),
  ...tomParts('tom1', TOM1, '10 in tom', RACK),
  ...tomParts('floor', FLOOR, 'floor tom', FLOORS, ['rack', 'floor']),
  ...FLOOR_LEGS.map<Part>((l, i) => ({ id: `floor.leg${i}`, label: 'floor-tom leg', short: 'leg', role: 'One of the floor tom’s three legs, standing on the floor: a bottom mic and its cable keep clear.', prov: legs.n.prov, listIn: i === 0 ? [...FLOORS] : [], solid: { kind: 'capsule', a: l.top, b: l.foot, r: legs.r.mm } })),
  { id: 'mount', label: 'tom holder', short: 'holder', role: 'The holder standing on the kick’s shell, with an arm to each rack tom. A boom’s path goes around it.', prov: ill('no source gives the mount’s geometry (names only)'), listIn: [...RACK], solid: { kind: 'capsule', a: MOUNT.base, b: MOUNT.top, r: 12 } },
  ...MOUNT.arms.map<Part>((a, i) => ({ id: `mount.arm${i}`, label: 'tom holder', short: 'holder', role: 'An arm of the tom holder.', prov: ill('no source gives the mount’s geometry'), listIn: [], solid: { kind: 'capsule', a: MOUNT.top, b: a, r: 9 } })),
  { id: 'crash1', label: 'crash cymbal (16 in)', short: 'crash', role: 'A crash above the small tom and the hi-hat side: loud, and it swings when struck.', prov: layout, clearance: D.cymbalClear, listIn: [...RACK], solid: cymHull('crash1') },
  { id: 'crash2', label: 'crash cymbal (18 in)', short: 'crash', role: 'A crash above the 12 in tom: the cymbal a tom mic hears most — and one a mic’s rejection can be aimed at.', prov: layout, clearance: D.cymbalClear, listIn: [...RACK], solid: cymHull('crash2') },
  { id: 'ride', label: 'ride cymbal (20 in)', short: 'ride', role: 'The ride, above and beside the floor tom.', prov: layout, clearance: D.cymbalClear, listIn: [...FLOORS], solid: cymHull('ride') },
  { id: 'hihat', label: 'hi-hat', short: 'hi-hat', role: 'The hi-hat, across the kit on the player’s left.', prov: layout, listIn: [], solid: cymHull('hihat') },
  { id: 'snare', label: 'snare drum', short: 'snare', role: 'The snare, between the player’s knees.', prov: layout, listIn: [], solid: hull(KIT_DRUMS.snare) },
  { id: 'kick', label: 'kick drum', short: 'kick', role: 'The kick, on the floor under the rack toms: the holder stands on it.', prov: layout, listIn: [...RACK], solid: { kind: 'slab', c: { x: 0, y: 0, z: 0 }, r: KIT.kick.hoop.halfW, x0: KIT.kick.hoop.u0, x1: KIT.kick.hoop.u1 } },
];

/* ── views (per setup): the rack pair, or the floor tom ── */
const RACK_SIDE: ViewBox = { u0: -260, u1: 620, v0: -960, v1: -170 };
const RACK_TOP: ViewBox = { u0: -260, u1: 620, v0: -560, v1: 380 };
const FLOOR_SIDE: ViewBox = { u0: -760, u1: 180, v0: -790, v1: 310 };
const FLOOR_TOP: ViewBox = { u0: -760, u1: 180, v0: 70, v1: 930 };

const n2 = F2.n;
const n1 = F1.n;
const nF = FF.n;
const edgeWords = { plus: 'out from', minus: 'in from', keyPlus: 'OUT FROM EDGE', keyMinus: 'IN FROM EDGE' };

export const TOMS_MODEL: InstrumentModel = {
  id: 'toms5pc',
  name: 'rack and floor toms',
  parts,
  regions: [
    { id: 'r.strike2', partId: 'tom2.batter', label: '12 in strike', anchor: TOM2.c, prov: ill('the strike drawn at the centre'), variants: ['rack'], note: 'The stick strikes the 12 in tom’s batter head: its attack starts here.' },
    { id: 'r.strike1', partId: 'tom1.batter', label: '10 in strike', anchor: TOM1.c, prov: ill('the strike drawn at the centre'), variants: ['rack'], note: 'The stick strikes the 10 in tom’s batter head.' },
    { id: 'r.strikeF', partId: 'floor.batter', label: 'floor tom strike', anchor: FLOOR.c, prov: ill('the strike drawn at the centre'), variants: ['floor', 'open'], note: 'The stick strikes the floor tom’s batter head: its attack starts here.' },
    { id: 'r.resoF', partId: 'floor.reso', label: 'floor tom bottom head', anchor: pointOn(FF, 0, 0, FF.depth), prov: FLOOR.spec.depth.prov, variants: ['floor'], note: 'The resonant head radiates downward: much of the floor tom’s ring and low end leave here.' },
    { id: 'r.openF', partId: 'floor.shell', label: 'open bottom', anchor: pointOn(FF, 0, 0, FF.depth), prov: FLOOR.spec.depth.prov, variants: ['open'], note: 'With the bottom head off, the air and the sound leave straight out of the open end.' },
  ],
  surfaces: [
    { id: 'tom2', partId: 'tom2.batter', label: 'the 12 in head', point: TOM2.c, normal: n2, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' }, variants: ['rack'] },
    { id: 'tom1', partId: 'tom1.batter', label: 'the 10 in head', point: TOM1.c, normal: n1, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' }, variants: ['rack'] },
    { id: 'floor', partId: 'floor.batter', label: 'the 16 in head', point: FLOOR.c, normal: nF, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'inside, below', key: 'INSIDE' }, variants: ['floor', 'open'] },
    { id: 'floorReso', partId: 'floor.reso', label: 'the bottom head', point: pointOn(FF, 0, 0, FF.depth), normal: FF.axis, plus: { words: 'below', key: 'BELOW' }, minus: { words: 'above', key: 'ABOVE' }, variants: ['floor'] },
  ],
  lines: [
    { id: 'tom2Edge', label: 'the 12 in head’s edge', point: TOM2.c, dir: F2.axis, offset: F2.R, words: edgeWords, variants: ['rack'], surfaces: ['tom2'] },
    { id: 'tom1Edge', label: 'the 10 in head’s edge', point: TOM1.c, dir: F1.axis, offset: F1.R, words: edgeWords, variants: ['rack'], surfaces: ['tom1'] },
    { id: 'floorEdge', label: 'the 16 in head’s edge', point: FLOOR.c, dir: FF.axis, offset: FF.R, words: edgeWords, variants: ['floor', 'open'], surfaces: ['floor', 'floorReso'] },
  ],
  envelopes: [
    { id: 'env.stick2', label: 'the sticks’ path', shape: sector(TOM2), prov: ill('no source gives a stick envelope: the drummer-facing half of each tom, 40 cm up, is the lab’s drawing'), variants: ['rack'] },
    { id: 'env.stick1', label: 'the sticks’ path', shape: sector(TOM1), prov: ill('as above'), variants: ['rack'] },
    { id: 'env.stickF', label: 'the sticks’ path', shape: sector(FLOOR), prov: ill('as above'), variants: ['floor', 'open'] },
    { id: 'env.leg', label: 'the player’s right leg', shape: { kind: 'box', min: { x: -700, y: FLOOR_Y - D.legBox.mm, z: 120 }, max: { x: -250 - 120, y: FLOOR_Y, z: 300 } }, prov: ill('toms/GEOMETRY_PROPOSAL.md §6 ko.ft.leg (drawn just clear of the floor tom’s shell)'), variants: ['floor', 'open'] },
  ],
  variants: [
    { id: 'rack', label: 'RACK PAIR', blurb: 'The 10 in and 12 in rack toms on their holder over the kick, both heads on.', phrase: 'the rack pair in view' },
    { id: 'floor', label: 'FLOOR TOM', blurb: 'The 16 in floor tom on its legs, beside the player’s right leg, both heads on.', phrase: 'the floor tom in view' },
    { id: 'open', label: 'FLOOR · HEAD OFF', blurb: 'The floor tom with its bottom head removed — a change to the drum, made only if the player wants it that way.', phrase: 'the floor tom’s bottom head removed' },
  ],
  defaultVariant: 'rack',
  views: { side: RACK_SIDE, top: RACK_TOP },
  viewsByVariant: { floor: { side: FLOOR_SIDE, top: FLOOR_TOP }, open: { side: FLOOR_SIDE, top: FLOOR_TOP } },
  yFloor: D.yFloor,
  interior: { x0: 0, x1: F2.depth, rIn: F2.R - TOM2.spec.tShell.mm, c: F2.c, axis: F2.axis },
  interiors: [
    { x0: 0, x1: F1.depth, rIn: F1.R - TOM1.spec.tShell.mm, c: F1.c, axis: F1.axis },
    { x0: 0, x1: FF.depth, rIn: FF.R - FLOOR.spec.tShell.mm, c: FF.c, axis: FF.axis },
  ],
  rims: TOM_RIMS,
  ports: { rack: null, floor: null, open: { c: pointOn(FF, 0, 0, FF.depth), r: FF.R - FLOOR.spec.tShell.mm } },
};

export const TOM_VIEWS = { RACK_SIDE, RACK_TOP, FLOOR_SIDE, FLOOR_TOP };
