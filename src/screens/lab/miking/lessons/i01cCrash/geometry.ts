/**
 * I01c CRASH CYMBAL — where things are (charter §2 layer 2): the shared
 * 5-piece kit with the crash's own parts, each crash's top and under faces
 * and edge line (per setup), and the stick's side with the glancing stroke's
 * follow-through. The kit already carries both crashes' solids (the plate and
 * its swing), their boom stands, the toms below and the hi-hats.
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { at, cymbalModel, edgeLine, ill, stickSector, topSurface, underSurface } from '../shared/cymbals/cymbalLesson.ts';
import { C1, C2, FOLLOW_THROUGH, STRIKE1, STRIKE2, TH1, TH2, TOM1, TOM2 } from './model.ts';

const areas = { kind: 'sourced', src: 'ZIL-FAQ', quote: 'Crash Area The outer edge where a cymbal responds immediately and where most players strike to produce an instant Crash response.' } as const;

const OWN: Part[] = [
  { id: 'crash.edge', label: 'edge (the crash area)', short: 'edge', role: 'The outer band, where most players strike — a glancing blow with the shoulder of the stick. The crash responds at once.', prov: areas },
  { id: 'crash.bow', label: 'bow', short: 'bow', role: 'The wide middle of the plate. Thin crashes flex and swing; heavy ones ring longer and louder.', prov: { kind: 'sourced', src: 'ZIL-L11', quote: 'There are many models of crash cymbals, from thick and heavy to thin and light.' } },
  { id: 'crash.bell', label: 'bell', short: 'bell', role: 'The raised centre, held by the felts. A crash is seldom played there.', prov: areas },
  { id: 'crash.mount', label: 'felts, sleeve and wing nut', short: 'mount', role: 'The crash sits loose between two felts on its sleeve, so it can move — that is why it swings and rocks after a stroke.', prov: { kind: 'sourced', src: 'ZIL-L11', quote: 'The cymbal should be able to move freely, so avoid over tightening the wing nut.' } },
  { id: 'crash.stand', label: 'boom stand', short: 'stand', role: 'A tripod, a tube and a boom reaching in over the drums. A mic underneath keeps clear of the boom.', prov: C1.spec.d.prov },
];

export const CRASH_MODEL: InstrumentModel = cymbalModel({
  id: 'crash1618',
  name: 'crash cymbal',
  variants: [
    { id: 'crash1', label: '16 in CRASH', blurb: 'The 16 in crash on the hi-hat side, over the 10 in tom.', phrase: 'the 16 in crash' },
    { id: 'crash2', label: '18 in CRASH', blurb: 'The 18 in crash on the right, over the 12 in tom — larger, a little higher.', phrase: 'the 18 in crash' },
  ],
  defaultVariant: 'crash1',
  views: {
    side: { u0: -620, u1: 460, v0: -1400, v1: -200 },
    top: { u0: -620, u1: 460, v0: -1120, v1: -40 },
  },
  viewsByVariant: {
    crash2: { side: { u0: -140, u1: 940, v0: -1450, v1: -250 }, top: { u0: -140, u1: 940, v0: -60, v1: 1020 } },
  },
  roles: {
    'kit.tom1': 'Under the 16 in crash: its mic hears the crash — and a crash mic aimed down hears the tom.',
    'kit.tom2': 'Under the 18 in crash: its mic hears the crash — and a crash mic aimed down hears the tom.',
    'cym.hihat': 'Below the 16 in crash’s player side: the hats and their stick are right there.',
    'kit.throne': 'The player sits here: a crash is struck with a glancing blow that follows through past the edge.',
  },
  listed: ['kit.tom1', 'kit.tom2', 'cym.hihat', 'kit.throne'],
  own: OWN,
  surfaces: [
    topSurface('c1Top', 'crash.bow', 'the 16 in crash', C1, ['crash1']),
    underSurface('c1Under', 'crash.bow', 'the 16 in crash’s underside', C1, 0, ['crash1']),
    topSurface('c2Top', 'crash.bow', 'the 18 in crash', C2, ['crash2']),
    underSurface('c2Under', 'crash.bow', 'the 18 in crash’s underside', C2, 0, ['crash2']),
  ],
  lines: [edgeLine('c1Edge', 'the 16 in crash’s edge', C1, ['c1Top', 'c1Under'], ['crash1']), edgeLine('c2Edge', 'the 18 in crash’s edge', C2, ['c2Top', 'c2Under'], ['crash2'])],
  envelopes: [
    { id: 'env.c1Stick', label: 'the stick and its follow-through', shape: stickSector(C1, 80, 150, FOLLOW_THROUGH), prov: ill('the player’s side, a stick’s length up, the glancing stroke 25 cm past the edge and 15 cm down (crash_cymbal/GEOMETRY_PROPOSAL.md ko.stroke)'), variants: ['crash1'] },
    { id: 'env.c2Stick', label: 'the stick and its follow-through', shape: stickSector(C2, 80, 150, FOLLOW_THROUGH), prov: ill('as above, for the 18 in crash'), variants: ['crash2'] },
  ],
  regions: [
    { id: 'r.edge1', partId: 'crash.edge', label: 'the stick on the edge', anchor: STRIKE1, prov: areas, variants: ['crash1'], note: 'A glancing blow on the edge: the crash’s attack starts here.' },
    { id: 'r.bell1', partId: 'crash.bell', label: 'the bell', anchor: at(C1, 0, TH1, C1.spec.rise.mm), prov: ill('the bell'), variants: ['crash1'], note: 'The raised centre, held by the felts.' },
    { id: 'r.tom1', partId: 'kit.tom1', label: 'the 10 in tom below', anchor: TOM1.c, prov: ill('the shared 5-piece kit'), variants: ['crash1'], note: 'The tom under the crash: the drum a crash mic aimed down hears most.' },
    { id: 'r.edge2', partId: 'crash.edge', label: 'the stick on the edge', anchor: STRIKE2, prov: areas, variants: ['crash2'], note: 'A glancing blow on the edge: the crash’s attack starts here.' },
    { id: 'r.bell2', partId: 'crash.bell', label: 'the bell', anchor: at(C2, 0, TH2, C2.spec.rise.mm), prov: ill('the bell'), variants: ['crash2'], note: 'The raised centre, held by the felts.' },
    { id: 'r.tom2', partId: 'kit.tom2', label: 'the 12 in tom below', anchor: TOM2.c, prov: ill('the shared 5-piece kit'), variants: ['crash2'], note: 'The tom under the crash: the drum a crash mic aimed down hears most.' },
  ],
  boomOut: { x: 1, y: 0, z: 0 },
  boomLength: 520,
});
