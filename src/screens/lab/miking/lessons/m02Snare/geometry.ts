/**
 * M02 SNARE DRUM — where things are (charter §2 layer 2), in the lesson
 * frame (model.ts: origin = the batter-head centre S0, +y down). Every solid,
 * anchor and view box is BUILT from the shared drum family (drumSpec.ts) and
 * the shared kit (kitPlanModel.ts), so the drawing, the hit areas, the zones
 * and the readouts agree at every zoom. Anchor ids follow snare/
 * GEOMETRY_PROPOSAL.md §3.
 */
import type { InstrumentModel, Part, Provenance, Shape3, Vec3 } from '../../engine/model/types.ts';
import { drumSolids, frameOf, hoopRadii, pointOn } from '../shared/drums/drumSpec.ts';
import { CYMBAL_PROFILE } from '../shared/kitPlanModel.ts';
import { DEPTH, H_UP, HOOP, NEIGHBOURS, R, R_IN, SNARE_DIMS as D, SNARE_RIMS, SPEC, STAND } from './model.ts';

const DEG = Math.PI / 180;
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const layout = ill('the shared 5-piece kit (kit/GEOMETRY_PROPOSAL.md §2): a typical right-handed layout');

export const SNARE_DRUM = { spec: SPEC, c: { x: 0, y: 0, z: 0 }, tiltDeg: 0 };
const S = drumSolids(SNARE_DRUM);
const W = SPEC.wires!;
const WIRE_HALF = { x: W.length.mm / 2, z: W.width.mm / 2 };
/** The wire set's top face under the snare-side head, per variant. */
export const WIRE_Y = { on: DEPTH + 3, off: DEPTH + 3 + W.dropOff.mm };
export const FLOOR_Y = D.yFloor.mm;

/* ── anchors (mm, lesson frame) ── */
const strainerX = -R - 30;
const hub = { x: 0, y: DEPTH + D.basketBelow.mm, z: 0 };
const legHub = { x: 0, y: FLOOR_Y - D.hubAbove.mm, z: 0 };
export const SNARE_ANCHORS = {
  'sn.batter.center': { x: 0, y: 0, z: 0 },
  'sn.reso.center': { x: 0, y: DEPTH, z: 0 },
  'sn.strike.center': { x: 0, y: 0, z: 0 },
  'sn.strainer': { x: -R - 16, y: DEPTH * 0.5, z: 0 },
  'sn.butt': { x: R + 10, y: DEPTH * 0.7, z: 0 },
  'sn.stand.hub': hub,
  'sn.stand.legHub': legHub,
} as const satisfies Record<string, Vec3>;

/** The basket's arms end on the bottom hoop; the legs on the floor. */
export const STAND_GEOM = {
  hub,
  legHub,
  arms: STAND.armsDeg.map((a) => ({ x: Math.cos(a * DEG) * HOOP.rIn, y: DEPTH + 4, z: Math.sin(a * DEG) * HOOP.rIn })),
  feet: STAND.legsDeg.map((a) => ({ x: Math.cos(a * DEG) * D.legSpread.mm, y: FLOOR_Y, z: Math.sin(a * DEG) * D.legSpread.mm })),
};

/* ── neighbours' hulls (one solid each; their art is the shared family's) ── */
const tom1 = NEIGHBOURS.tom1;
const tom1F = frameOf(tom1);
const tom1Hull: Shape3 = { kind: 'slab', c: tom1F.c, axis: tom1F.axis, r: hoopRadii(tom1.spec).rOut + tom1.spec.lug.out.mm, x0: -tom1.spec.hoop.above.mm, x1: tom1F.depth + tom1.spec.hoop.above.mm };
const kickC = NEIGHBOURS.kick.c;
/** The kick (axis ∥ x, the legacy cylinder: absolute x from its batter hoop to its front hoop). */
const kickHull: Shape3 = { kind: 'slab', c: kickC, r: 290.4, x0: kickC.x - 19, x1: kickC.x + 476.2 };
const hh = NEIGHBOURS.hihat;
const hhRise = CYMBAL_PROFILE.rise * hh.d;
const hihatHull: Shape3 = { kind: 'slab', c: hh.c, axis: { x: 0, y: 1, z: 0 }, r: hh.d / 2, x0: -hhRise, x1: 12 };
const c1 = NEIGHBOURS.crash1;
const c1F = frameOf({ spec: SPEC, c: c1.c, tiltDeg: c1.tiltDeg });
const crashHull: Shape3 = { kind: 'slab', c: c1.c, axis: c1F.axis, r: c1.d / 2, x0: -CYMBAL_PROFILE.rise * c1.d, x1: 3 };

/* ── PARTS (ids stable: taps and progress key on them) ── */
const sizeProv: Provenance = SPEC.d.prov;
const parts: Part[] = [
  { id: 'snare.batter', label: 'batter head', short: 'batter', role: 'The top head, struck by the sticks. The crack of the attack starts here.', moving: true, clearance: D.headClear, prov: sizeProv, solid: S.batter },
  { id: 'snare.reso', label: 'snare-side head', short: 'snare head', role: 'The thin bottom head. The air inside drives it, and it throws the wires stretched across it.', moving: true, clearance: D.resoClear, prov: sizeProv, solid: S.reso! },
  { id: 'snare.wiresOn', label: 'snare wires (on)', short: 'wires', role: 'Coiled steel strands stretched across the snare-side head. Pressed against it, they rattle against the head — the snare’s buzz.', moving: true, clearance: D.wireClear, prov: W.strands.prov, variants: ['on'], solid: { kind: 'box', min: { x: -WIRE_HALF.x, y: WIRE_Y.on, z: -WIRE_HALF.z }, max: { x: WIRE_HALF.x, y: WIRE_Y.on + 5, z: WIRE_HALF.z } } },
  { id: 'snare.wiresOff', label: 'snare wires (off)', short: 'wires', role: 'With the throw-off released, the wires hang just clear of the head: no buzz, and the drum rings like a tom.', clearance: D.wireClear, prov: W.strands.prov, variants: ['off'], solid: { kind: 'box', min: { x: -WIRE_HALF.x, y: WIRE_Y.off, z: -WIRE_HALF.z }, max: { x: WIRE_HALF.x, y: WIRE_Y.off + 5, z: WIRE_HALF.z } } },
  { id: 'snare.strainer', label: 'strainer (throw-off)', short: 'strainer', role: 'The lever on the shell that pulls the wires up against the head (snares on) or lets them drop (off). It is the player’s: ask before anything goes near it.', prov: W.strainerDeg.prov, solid: { kind: 'box', min: { x: strainerX, y: 2, z: -16 }, max: { x: -R, y: DEPTH - 2, z: 16 } } },
  { id: 'snare.butt', label: 'butt plate', short: 'butt', role: 'The fixed end of the wires, on the far side of the shell from the strainer.', prov: W.buttDeg.prov, solid: { kind: 'box', min: { x: R, y: DEPTH * 0.5, z: -11 }, max: { x: R + 20, y: DEPTH * 0.9, z: 11 } } },
  { id: 'snare.shell', label: 'shell', short: 'shell', role: 'The wooden cylinder between the heads. With the air inside, it couples the two heads.', prov: SPEC.tShell.prov, solid: S.shell },
  { id: 'snare.hoopTop', label: 'top hoop (the rim)', short: 'rim', role: 'The metal hoop holding the batter head — “the rim” the starting points measure from. Rimshots strike it.', prov: SPEC.hoop.t.prov, solid: S.hoopTop },
  { id: 'snare.hoopBottom', label: 'bottom hoop', short: 'bottom rim', role: 'The hoop holding the snare-side head; the wires’ cords pass over it.', prov: SPEC.hoop.t.prov, solid: S.hoopBottom! },
  { id: 'snare.lugs', label: 'lugs and tension rods', short: 'lugs', role: 'Ten rods per head, one per lug, tension each head. A mic between two lugs is not a starting point.', prov: SPEC.rods.n.prov, solid: S.lugs },
  { id: 'snare.stand', label: 'snare stand', short: 'stand', role: 'Its basket grips the bottom hoop; its legs share the floor with the pedals and the bottom mic’s stand.', prov: ill('no source gives the stand’s geometry'), solid: { kind: 'capsule', a: hub, b: legHub, r: 9 } },
  ...STAND_GEOM.arms.map<Part>((a, i) => ({ id: `snare.standArm${i}`, label: 'snare stand', short: 'stand', role: 'A basket arm, gripping the bottom hoop.', prov: ill('no source gives the basket'), listIn: [], solid: { kind: 'capsule', a: hub, b: a, r: 5 } })),
  ...STAND_GEOM.feet.map<Part>((f, i) => ({ id: `snare.standLeg${i}`, label: 'snare stand', short: 'stand', role: 'A stand leg.', prov: ill('no source gives the leg spread'), listIn: [], solid: { kind: 'capsule', a: legHub, b: f, r: 7 } })),
  { id: 'hihat', label: 'hi-hat', short: 'hi-hat', role: 'Two cymbals on a stand, played with the left foot and the sticks, just behind and above the snare: the loudest neighbour a snare mic hears.', prov: layout, clearance: D.hihatClear, solid: hihatHull },
  { id: 'hihat.stand', label: 'hi-hat stand', short: 'hi-hat', role: 'The hi-hat’s stand and rod.', prov: layout, listIn: [], solid: { kind: 'capsule', a: { x: hh.c.x, y: hh.c.y + 20, z: hh.c.z }, b: { x: hh.c.x, y: FLOOR_Y, z: hh.c.z }, r: 14 } },
  { id: 'tom1', label: 'rack tom (10 in)', short: 'rack tom', role: 'The small rack tom, above the kick to the snare’s right: a top mic’s stand comes in between it and the hi-hat.', prov: layout, solid: tom1Hull },
  { id: 'crash1', label: 'crash cymbal (16 in)', short: 'crash', role: 'A crash above, in front of the snare: loud, and it swings when struck.', prov: layout, clearance: D.cymbalClear, solid: crashHull },
  { id: 'kick', label: 'kick drum', short: 'kick', role: 'The kick, on the floor to the snare’s right (seen past it).', prov: layout, listIn: [], solid: kickHull },
];

/* ── the model ── */
export const SNARE_MODEL: InstrumentModel = {
  id: 'snare14x55',
  name: '14 × 5.5 in snare drum',
  parts,
  regions: [
    { id: 'r.strike', partId: 'snare.batter', label: 'stick strike', anchor: SNARE_ANCHORS['sn.strike.center'], prov: ill('the strike drawn at the centre'), note: 'The stick strikes the batter head: the crack of the attack starts here, radiating up toward the player and a top mic.' },
    { id: 'r.snareHead', partId: 'snare.reso', label: 'snare-side head and wires', anchor: SNARE_ANCHORS['sn.reso.center'], prov: sizeProv, note: 'The snare-side head and the wires radiate downward: much of the buzz leaves here, toward the floor and a bottom mic.' },
    { id: 'r.shell', partId: 'snare.shell', label: 'shell', anchor: { x: R, y: DEPTH / 2, z: 0 }, prov: SPEC.tShell.prov, note: 'The shell, the heads’ tuning and the wires’ tension shape how the drum rings.' },
  ],
  surfaces: [
    { id: 'rim', partId: 'snare.hoopTop', label: 'the rim', point: { x: 0, y: -H_UP, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
    { id: 'batter', partId: 'snare.batter', label: 'the batter head', point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
    { id: 'snareSide', partId: 'snare.reso', label: 'the snare-side head', point: { x: 0, y: DEPTH, z: 0 }, normal: { x: 0, y: 1, z: 0 }, plus: { words: 'below', key: 'BELOW' }, minus: { words: 'above', key: 'ABOVE' } },
  ],
  lines: [
    // The head's EDGE (its nominal radius, the sourced 14 in): the signed
    // horizontal distance "in from / out from" the edge.
    { id: 'edge', label: 'the head’s edge', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: 1, z: 0 }, offset: R, words: { plus: 'out from', minus: 'in from', keyPlus: 'OUT FROM EDGE', keyMinus: 'IN FROM EDGE' } },
  ],
  envelopes: [
    {
      id: 'env.stick',
      label: 'the sticks’ path',
      shape: { kind: 'sector', c: { x: 0, y: 0, z: 0 }, r0: 0, r1: R + D.stickOut.mm, a0: D.stickA0.mm * DEG, a1: D.stickA1.mm * DEG, y0: -D.stickUp.mm, y1: -H_UP - 2 },
      prov: ill('no source gives a stick or rimshot envelope (lesson L89): the player’s half, 40 cm up, is the lab’s drawing'),
    },
    {
      id: 'env.player',
      label: 'the player',
      shape: { kind: 'box', min: { x: -700, y: -620, z: -120 }, max: { x: -R - 70, y: FLOOR_Y, z: 460 } },
      prov: ill('no source gives the player’s reach'),
    },
  ],
  variants: [
    { id: 'on', label: 'ON', blurb: 'The throw-off is up: the wires press against the snare-side head and buzz when the drum is struck.', phrase: 'the snares on' },
    { id: 'off', label: 'OFF', blurb: 'The throw-off is released: the wires hang just clear of the head, and the drum rings like a tom. Ask the player which a passage needs.', phrase: 'the snares off' },
  ],
  defaultVariant: 'on',
  views: {
    side: { u0: -430, u1: 600, v0: -430, v1: 300 },
    top: { u0: -430, u1: 600, v0: -560, v1: 380 },
  },
  yFloor: D.yFloor,
  interior: { x0: 0, x1: DEPTH, rIn: R_IN, c: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 } },
  rims: SNARE_RIMS,
  ports: { on: null, off: null },
};

/** A point on the snare in its frame (for the art and the tests). */
export const snarePoint = (r: number, thetaDeg: number, s: number) => pointOn(frameOf(SNARE_DRUM), r, thetaDeg, s);
