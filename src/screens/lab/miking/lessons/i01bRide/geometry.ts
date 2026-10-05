/**
 * I01b RIDE CYMBAL — where things are (charter §2 layer 2): the shared
 * 5-piece kit with the ride's own parts, its top and under faces, its edge
 * line and the stick's side. The kit already carries the ride's solid (the
 * plate and its swing), its boom stand, the floor tom below and the crash
 * beside it.
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { cymbalModel, edgeLine, ill, stickSector, topSurface, underSurface, at } from '../shared/cymbals/cymbalLesson.ts';
import { FLOOR, RIDE, RIDE_R, STRIKE, STRIKE_BOW, TH_THRONE } from './model.ts';

const size = RIDE.spec.d.prov;
const areas = { kind: 'sourced', src: 'ZIL-L11', quote: '"BELL (or CUP)", "RIDE AREA", "CRASH AREA", "BOW/PROFILE", "EDGE"' } as const;

const OWN: Part[] = [
  { id: 'ride.bell', label: 'bell (cup)', short: 'bell', role: 'The raised centre. The stick’s tip on the bell gives a bright, cutting accent that rings through the band.', prov: areas },
  { id: 'ride.bow', label: 'bow (the ride area)', short: 'bow', role: 'The wide middle, played with the stick’s tip for time. It does not open up at once like a crash — a clear “ping” over the wash.', prov: areas },
  { id: 'ride.edge', label: 'edge (the crash area)', short: 'edge', role: 'The outer band. Crashed with the shoulder of the stick, the ride opens up into a big wash — and swings hardest on its felts.', prov: areas },
  { id: 'ride.mount', label: 'felts, sleeve and wing nut', short: 'mount', role: 'The ride sits on its sleeve between two felts, able to move — the wing nut is not over-tightened. That freedom is why it swings.', prov: { kind: 'sourced', src: 'ZIL-L11', quote: 'it’s important to have sleeves, bottom and top felts and a wing nut. The cymbal should be able to move freely, so avoid over tightening the wing nut.' } },
  { id: 'ride.stand', label: 'boom stand', short: 'stand', role: 'A tripod, a tube and a boom arm reaching under the ride. A mic underneath keeps clear of the boom.', prov: size },
];

export const RIDE_MODEL: InstrumentModel = cymbalModel({
  id: 'ride20',
  name: 'ride cymbal',
  variants: [{ id: 'ride', label: 'RIDE', blurb: 'The 20 in ride on its boom stand over the floor tom, tilted toward the player.', phrase: 'the ride over the floor tom' }],
  defaultVariant: 'ride',
  views: {
    side: { u0: -500, u1: 420, v0: -1430, v1: -280 },
    top: { u0: -500, u1: 420, v0: 180, v1: 1300 },
  },
  roles: {
    'kit.floor': 'Right under the ride: a mic under the ride has the floor tom below it, and the floor tom’s mic hears plenty of ride.',
    'cym.crash2': 'The larger crash hangs beside and above the ride’s audience side: a mic over that side runs into it.',
    'kit.throne': 'The player sits here; the right arm reaches out to the ride — its tip on the bow and bell, its shoulder on the edge.',
  },
  listed: ['kit.floor', 'cym.crash2', 'kit.throne'],
  own: OWN,
  surfaces: [topSurface('rideTop', 'ride.bow', 'the ride', RIDE), underSurface('rideUnder', 'ride.bow', 'the ride’s underside', RIDE, 0)],
  lines: [edgeLine('rideEdge', 'the ride’s edge', RIDE, ['rideTop', 'rideUnder'])],
  envelopes: [{ id: 'env.rideStick', label: 'the stick over the ride', shape: stickSector(RIDE, 80, 30), prov: ill('the player’s side of the ride, a stick’s length (406.4 mm) up — the lab’s drawing (ride_cymbal/GEOMETRY_PROPOSAL.md ko.stick)') }],
  regions: [
    { id: 'r.tip', partId: 'ride.bow', label: 'the stick’s tip on the bow', anchor: STRIKE_BOW, prov: ill('the bow, toward the player (a drawing default on the sourced area)'), note: 'Where the stick’s tip plays the bow for time: the ride’s definition starts here.' },
    { id: 'r.bell', partId: 'ride.bell', label: 'the bell', anchor: at(RIDE, STRIKE.bell, TH_THRONE, RIDE.spec.rise.mm), prov: ill('the bell'), note: 'The raised centre: bright, cutting accents.' },
    { id: 'r.edge', partId: 'ride.edge', label: 'the edge (a crash on the ride)', anchor: at(RIDE, STRIKE.edge, TH_THRONE, 2), prov: ill('the edge band'), note: 'Crashed with the stick’s shoulder: the ride opens into its wash.' },
    { id: 'r.floor', partId: 'kit.floor', label: 'the floor tom below', anchor: FLOOR.c, prov: ill('the shared 5-piece kit'), note: 'The floor tom right under the ride: the neighbour a ride mic hears most.' },
  ],
  boomOut: { x: 0.3, y: 0, z: 0.95 },
  boomLength: 520,
});

export const RIDE_RADIUS = RIDE_R;
