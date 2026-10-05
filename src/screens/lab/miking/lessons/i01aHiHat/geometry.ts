/**
 * I01a HI-HAT — where things are (charter §2 layer 2): the shared 5-piece
 * kit (kitScene/kitSceneModel.ts) with the hats' own parts, reference
 * surfaces, edge line, the sticks' side of the pair and the clamp on the
 * stand. Everything is BUILT from the shared kit and cymbal family; the kit
 * already carries the hats' solid (the pair and its opening travel), the
 * stand, the pedal and the air-burst ring (DPA's "air pressure moving out from
 * the sides").
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { HIHAT_HARDWARE } from '../shared/cymbals/cymbalSpec.ts';
import { at, cymbalModel, edgeLine, ill, stickSector, topSurface, underSurface } from '../shared/cymbals/cymbalLesson.ts';
import { GAP, HAT, HAT_R, HAT_RISE, STAND_CLAMP_Y, STRIKE, TH_FAR } from './model.ts';

const layout = ill('the shared 5-piece kit (kit/GEOMETRY_PROPOSAL.md §2): a typical right-handed layout');
const size = HAT.spec.d.prov;

/** The hats' own parts (named on the parts page; the kit's solids collide). */
const OWN: Part[] = [
  { id: 'hat.top', label: 'top cymbal', short: 'top cymbal', role: 'The upper cymbal, usually the lighter one. The stick strikes it; the clutch holds it on the pull rod, so it rises and falls with the pedal.', prov: { kind: 'sourced', src: 'DPA-HH', quote: 'Normally, a heavy cymbal is at the bottom and a lighter one on top.' } },
  { id: 'hat.bottom', label: 'bottom cymbal', short: 'bottom cymbal', role: 'The lower cymbal, often the heavier one, resting on the stand’s seat, face down. The two are rarely identical.', prov: { kind: 'sourced', src: 'DPA-HH', quote: 'The two cymbals are rarely identical – their thickness and weight are usually different.' } },
  { id: 'hat.clutch', label: 'clutch and pull rod', short: 'clutch', role: 'The clutch clamps the top cymbal to the pull rod, which runs down the stand to the pedal. A mic and its boom stay clear of the rod above the clutch too.', prov: size },
  { id: 'hat.stand', label: 'hi-hat stand', short: 'stand', role: 'The stand’s two tubes and tripod. A small clip-on mic can clamp to it, under the bottom cymbal.', prov: size },
  { id: 'hat.pedal', label: 'pedal (the player’s left foot)', short: 'pedal', role: 'The player’s left foot opens and closes the pair. When it closes, air rushes out sideways from between the cymbals.', prov: size },
];

export const HAT_MODEL: InstrumentModel = cymbalModel({
  id: 'hihat14',
  name: 'hi-hats',
  variants: [
    { id: 'closed', label: 'CLOSED', blurb: 'The pedal down: the two cymbals pressed together. A tight, short “chick” or stick sound.', phrase: 'the pair closed' },
    { id: 'open', label: 'OPEN', blurb: 'The pedal up: the cymbals apart (drawn ½ in, 12.7 mm). They ring longer and can wash into each other.', phrase: 'the pair open' },
  ],
  defaultVariant: 'closed',
  views: {
    side: { u0: -800, u1: -180, v0: -890, v1: -60 },
    top: { u0: -800, u1: -180, v0: -1380, v1: -220 },
  },
  roles: {
    'kit.snare': 'Right beside the hats and a little lower: the loudest neighbour a hi-hat mic hears. Keep the snare off the mic’s front — or let the pair hide it.',
    'cym.crash1': 'The crash hangs above the hats’ audience side: a stand mic over that side runs into it (and its swing).',
    'kit.throne': 'The player sits here: the left foot on the pedal, the left hand or the right stick crossing over to the hats.',
  },
  listed: ['kit.snare', 'cym.crash1', 'kit.throne'],
  own: OWN,
  surfaces: [
    topSurface('hatTop', 'hat.top', 'the top cymbal', HAT),
    underSurface('hatUnderC', 'hat.bottom', 'the bottom cymbal', HAT, GAP.closed, ['closed']),
    underSurface('hatUnderO', 'hat.bottom', 'the bottom cymbal', HAT, GAP.open, ['open']),
  ],
  lines: [edgeLine('hatEdge', 'the hats’ edge', HAT, ['hatTop', 'hatUnderC', 'hatUnderO'])],
  envelopes: [{ id: 'env.hatStick', label: 'the stick over the hats', shape: stickSector(HAT, 80, 30), prov: ill('the drummer-facing side of the pair, a stick’s length (406.4 mm) up — the lab’s drawing (hihat/GEOMETRY_PROPOSAL.md §4 ko.stick)') }],
  regions: [
    { id: 'r.stick', partId: 'hat.top', label: 'the stick on the top cymbal', anchor: STRIKE, prov: { kind: 'sourced', src: 'DPA-HH', quote: 'where the drummer hits the hi hat with the stick (usually around 2-3 cm (1 inch) from the edge)' }, note: 'Where the stick strikes the top cymbal, about 2–3 cm in from the edge: the attack starts here.' },
    { id: 'r.edge', partId: 'hat.bottom', label: 'the pair’s edge (the air)', anchor: at(HAT, HAT_R, TH_FAR, -GAP.open / 2), prov: { kind: 'sourced', src: 'S-REC1', quote: 'the hi-hat resonates horizontally' }, note: 'Between the two edges: the pair’s sound spreads out sideways from here — and so does the air as it closes.' },
    { id: 'r.bell', partId: 'hat.top', label: 'the top cymbal’s cup', anchor: at(HAT, 0, 0, HAT_RISE), prov: layout, note: 'The raised cup at the centre: the higher overtones sit toward it.' },
    { id: 'r.snare', partId: 'kit.snare', label: 'the snare', anchor: KIT_DRUMS.snare.c, prov: layout, note: 'The snare’s head, beside the hats: the neighbour a hat mic should hear least.' },
  ],
  rims: [{ id: 'rim.hatStand', label: 'the hi-hat stand', c: { x: HAT.c.x, y: STAND_CLAMP_Y, z: HAT.c.z }, axis: { x: 0, y: 1, z: 0 }, r: HIHAT_HARDWARE.upperTube.mm / 2 + 2 }],
  // Out of the kit, on the hats' far side (the player's left).
  boomOut: { x: -0.24, y: 0, z: -0.97 },
  boomLength: 520,
});

export const HAT_GAP_OF = (variant: string) => (variant === 'open' ? GAP.open : GAP.closed);
