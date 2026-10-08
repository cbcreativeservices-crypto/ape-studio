/**
 * F06 NATURAL AND URBAN AMBIENCE — where things are (charter §2 layer 2), in
 * frame G (lessons/shared/field/frameG.ts): the LISTENING POINT on the ground
 * at the origin, +x toward the scene, +z the array's right, the ground y = 0.
 * Two sites (the variants), from lessons/shared/field/sites.ts:
 *
 *   woodland  a woodland stream 6.5 m ahead of the listening point, a
 *             walking path just behind it, birds calling in the canopy
 *   plaza     a city plaza: the road's kerb 9 m ahead with the sidewalk in
 *             front of it, a building's facade 9 m behind, a café's tables,
 *             a walkway to the building's door
 * Lanes, walking paths, access routes, the stream and its bank are
 * keep-outs (F06 L33, L45–L46). Every size is a drawing default
 * (field_ambience/GEOMETRY_PROPOSAL.md §2); the mic height 1.5 m is a
 * drawing default too (no source gives one: L82).
 */
import type { InstrumentModel, Part, RadiatingRegion, ReferenceSurface, RefLine, Variant, ViewBox, ViewId } from '../../engine/model/types.ts';
import { ill, measureModel } from '../shared/measure/measureModel.ts';
import { AMB_WOODS, PLAZA, PLAZA_KERB_X, PLAZA_SITE, STREAM_BANK_X, siteKeepOuts } from '../shared/field/sites.ts';

/** The array's height at the listening point: 1.5 m (a drawing default). */
export const AMB_H = 1500;

export const F06_SITE = { woodland: AMB_WOODS, plaza: PLAZA_SITE } as const;

const VIEWS: Readonly<Record<'woodland' | 'plaza', Record<ViewId, ViewBox>>> = {
  woodland: { side: { u0: -9000, u1: 14000, v0: -8000, v1: 1600 }, top: { u0: -9000, u1: 14000, v0: -10500, v1: 10500 } },
  plaza: { side: { u0: -11000, u1: 15500, v0: -8000, v1: 1600 }, top: { u0: -11000, u1: 15500, v0: -13000, v1: 11000 } },
};

const SITE = ill('a drawing default: the site is illustrated (field_ambience/GEOMETRY_PROPOSAL.md §2)');

const PARTS: Part[] = [
  { id: 'stream', label: 'the stream', short: 'stream', role: 'Moving water: a continuous bed of sound, strongest nearest the water. A few steps toward or away from it change the water-to-bird balance a lot.', prov: SITE, variants: ['woodland'] },
  { id: 'path', label: 'the walking path', short: 'path', role: 'Visitors walk here: no stand, cable or bag on it. The listening point stays just off the path.', prov: SITE, variants: ['woodland'] },
  { id: 'canopy', label: 'trees and their canopy', short: 'canopy', role: 'Leaves move in the wind and birds call from the branches — events above and around the listening point.', prov: SITE, variants: ['woodland'] },
  { id: 'birds', label: 'birds calling', short: 'birds', role: 'Intermittent calls at different bearings: they come and go, so a take needs time to hold a normal cycle of them. Never lure or approach them.', prov: SITE, variants: ['woodland'] },
  { id: 'floor', label: 'the forest floor', short: 'ground', role: 'Soft ground and leaf litter: it absorbs some sound, and your own steps on it are part of what the mic hears.', prov: SITE, variants: ['woodland'] },
  { id: 'road', label: 'the road and its traffic', short: 'road', role: 'Two lanes of traffic: a steady urban bed with buses and sirens as events. Nothing goes on the road.', prov: SITE, variants: ['plaza'] },
  { id: 'sidewalk', label: 'the sidewalk', short: 'sidewalk', role: 'A walking path for the public: stands and cables stay off it.', prov: SITE, variants: ['plaza'] },
  { id: 'walkway', label: 'the walkway to the door', short: 'walkway', role: 'An access route to the building’s door: keep it clear.', prov: SITE, variants: ['plaza'] },
  { id: 'cafe', label: 'the café’s tables', short: 'café', role: 'Voices and cups: speech may be intelligible — check permissions and privacy before using it.', prov: SITE, variants: ['plaza'] },
  {
    id: 'facade',
    label: 'the building’s facade',
    short: 'facade',
    role: 'A hard wall: it reflects the plaza’s sound back toward a mic near it. Useful colour or not — listen before you shield from it or stand by it.',
    prov: SITE,
    variants: ['plaza'],
    solid: { kind: 'box', min: { x: -14000, y: -12000, z: -15000 }, max: { x: PLAZA.facadeX, y: 0, z: 15000 } },
  },
  { id: 'paving', label: 'the paved square', short: 'paving', role: 'Hard paving reflects more than grass: footsteps and voices carry across it.', prov: SITE, variants: ['plaza'] },
];

const REGIONS: RadiatingRegion[] = [
  { id: 'water', partId: 'stream', label: 'the water', anchor: { x: STREAM_BANK_X + 1200, y: 0, z: 0 }, prov: SITE, variants: ['woodland'], note: 'The stream over its stones: a broad, steady bed from the whole length of water in view, loudest at its nearest point.' },
  { id: 'birdA', partId: 'birds', label: 'a bird to the left', anchor: AMB_WOODS.sources[1].p, prov: SITE, variants: ['woodland'], note: 'A call from the canopy ahead and to the left: an event that comes and goes.' },
  { id: 'birdB', partId: 'birds', label: 'a bird to the right', anchor: AMB_WOODS.sources[2].p, prov: SITE, variants: ['woodland'], note: 'Another call, ahead and to the right, higher up.' },
  { id: 'leaves', partId: 'canopy', label: 'leaves in the wind', anchor: AMB_WOODS.sources[3].p, prov: SITE, variants: ['woodland'], note: 'Wind moving through the trees: part of the place — different from wind on the mic itself.' },
  { id: 'trafficNear', partId: 'road', label: 'the near lane', anchor: PLAZA_SITE.sources[0].p, prov: SITE, variants: ['plaza'], note: 'Tyres and engines in the near lane: the steady bed, rising and falling as vehicles pass.' },
  { id: 'trafficFar', partId: 'road', label: 'the far lane', anchor: PLAZA_SITE.sources[1].p, prov: SITE, variants: ['plaza'], note: 'The far lane, a little quieter, moving the other way.' },
  { id: 'voices', partId: 'cafe', label: 'voices at the café', anchor: PLAZA_SITE.sources[2].p, prov: SITE, variants: ['plaza'], note: 'Conversation and cups at the tables to the left.' },
  { id: 'steps', partId: 'walkway', label: 'steps on the walkway', anchor: PLAZA_SITE.sources[3].p, prov: SITE, variants: ['plaza'], note: 'People walking to and from the door, close by on the left.' },
  { id: 'reflect', partId: 'facade', label: 'the facade’s reflection', anchor: PLAZA_SITE.sources[4].p, prov: SITE, variants: ['plaza'], note: 'The plaza’s sound coming back off the wall behind: stronger the nearer the mic is to it.' },
];

/** Distances are read from the water's edge (woodland) or the kerb (plaza). */
export const F06_SURFACES: ReferenceSurface[] = [
  { id: 'water', partId: 'stream', label: 'the water’s edge', point: { x: STREAM_BANK_X, y: -AMB_H, z: 0 }, normal: { x: -1, y: 0, z: 0 }, plus: { words: 'back from', key: 'BACK FROM' }, variants: ['woodland'] },
  { id: 'kerb', partId: 'road', label: 'the kerb', point: { x: PLAZA_KERB_X, y: -AMB_H, z: 0 }, normal: { x: -1, y: 0, z: 0 }, plus: { words: 'back from', key: 'BACK FROM' }, variants: ['plaza'] },
];

/** The ground as a reference plane: the signed distance is the height above it. */
export const F06_LINES: RefLine[] = [{ id: 'ground', label: 'the ground', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above', minus: 'below', keyPlus: 'HEIGHT', keyMinus: 'BELOW' } }];

const VARIANTS: Variant[] = [
  { id: 'woodland', label: 'WOODLAND', blurb: 'A woodland stream: the water ahead, a walking path behind the listening point, birds calling in the canopy.', phrase: 'by a woodland stream' },
  { id: 'plaza', label: 'CITY PLAZA', blurb: 'A city plaza: the road and its sidewalk ahead, a building’s facade behind, a café’s tables to the left.', phrase: 'in a city plaza' },
];

export const F06_MODEL: InstrumentModel = {
  ...measureModel({
  id: 'ambience',
  name: 'a listening point outdoors',
  parts: PARTS,
  regions: REGIONS,
  surfaces: F06_SURFACES,
  lines: F06_LINES,
  envelopes: [...siteKeepOuts(AMB_WOODS, 'woodland'), ...siteKeepOuts(PLAZA_SITE, 'plaza')],
  variants: VARIANTS,
  defaultVariant: 'woodland',
  views: VIEWS.woodland,
  viewsByVariant: { plaza: VIEWS.plaza },
  viewTags: { side: 'SECTION · ALONG THE VIEW', top: 'SITE PLAN' },
  groundY: { mm: 0, prov: ill('the ground at the listening point (frame G)') },
  aimAzLimit: 180,
  labelMinScale: 0.008,
  }),
  // A field site keeps its authored boxes: its ground, paths and water are drawn, not solid.
  fitAuthored: { side: true, top: true },
  // A site plan metres wide: mics, lobes and stands drawn 8 × life size (said once in the accuracy note).
  hardwareScale: 8,
};
