/**
 * F07 WILDLIFE AND DISTANT SOURCES — where things are (charter §2 layer 2),
 * in frame G (lessons/shared/field/frameG.ts): the recordist's permitted
 * OBSERVATION POINT on the ground at the origin, +x toward the target, +z
 * to the right. Research: field_wildlife_distant/GEOMETRY_PROPOSAL.md §1.
 *
 *   bird     a woodland edge: one bird calling in a canopy 26 m ahead, 9 m
 *            up, its setback ring 25 yards (≈ 22.9 m, the US-park example,
 *            NPS-WILD; local rules first, O-11); the trail and a brook behind
 *            the recordist
 *   flock    open grassland: a flock crossing 28–30 m out, 6 m up (it moves
 *            on the path tool)
 *   distant  open ground: a large, low-voiced animal 70 m away, its 25-yard
 *            ring
 * Ranges and heights are DRAWING DEFAULTS (none sourced); the rings are the
 * sourced example distances. The rings are keep-outs: a mic inside one is
 * stopped — "if animals react to your presence you are too close".
 */
import type { InstrumentModel, Part, RadiatingRegion, ReferenceSurface, RefLine, Variant, ViewBox, ViewId } from '../../engine/model/types.ts';
import { ill, measureModel, src } from '../shared/measure/measureModel.ts';
import { BISON, BISON_MEADOW, EDGE_BIRD, FLOCK_LINE, MEADOW, WOOD_EDGE, siteKeepOuts } from '../shared/field/sites.ts';
import { straightPath, type PathDef } from '../shared/field/path.ts';

/** The mics' height at the observation point: 1.5 m (a drawing default). */
export const WL_H = 1500;
export const F07_SITE = { bird: WOOD_EDGE, flock: MEADOW, distant: BISON_MEADOW } as const;

/** A flock in flight crossing the meadow (speed a drawing default, about 8 m/s). */
export const FLOCK_SPEED_MS = 8;
export const FLOCK_PATH: PathDef = straightPath({ x: FLOCK_LINE.x, y: -FLOCK_LINE.h, z: -28000 }, { x: FLOCK_LINE.x, y: -FLOCK_LINE.h, z: 28000 }, FLOCK_SPEED_MS, 0);

export const BIRD_P = { x: EDGE_BIRD.c[0], y: -EDGE_BIRD.h, z: EDGE_BIRD.c[1] };
export const FLOCK_P = { x: FLOCK_LINE.x, y: -FLOCK_LINE.h, z: 0 };
export const ANIMAL_P = { x: BISON.c[0], y: -1500, z: BISON.c[1] };

const VIEWS: Readonly<Record<'bird' | 'flock' | 'distant', Record<ViewId, ViewBox>>> = {
  bird: { side: { u0: -10500, u1: 33000, v0: -13000, v1: 1600 }, top: { u0: -10500, u1: 33000, v0: -19000, v1: 19000 } },
  flock: { side: { u0: -6000, u1: 36000, v0: -10000, v1: 1600 }, top: { u0: -6000, u1: 36000, v0: -24000, v1: 24000 } },
  distant: { side: { u0: -8000, u1: 80000, v0: -14000, v1: 1600 }, top: { u0: -8000, u1: 80000, v0: -34000, v1: 34000 } },
};

const SITE = ill('a drawing default: the site is illustrated (field_wildlife_distant/GEOMETRY_PROPOSAL.md §1)');
const RING = src('NPS-WILD', '25 yards from most wildlife and 100 yards from predators like bears and wolves; If animals react to your presence you are too close (US national parks; local rules first)');

const PARTS: Part[] = [
  { id: 'bird', label: 'the bird calling', short: 'bird', role: 'One bird calling from the canopy: a clear, high call from one direction — the case a dish suits best. Never lure it, call it or play recordings to it.', prov: SITE, variants: ['bird'] },
  { id: 'ring', label: 'the setback ring', short: 'setback', role: 'An example distance — 25 yards (about 23 m) in US national parks for most wildlife, 100 yards from bears and wolves. Local rules come first; if the animal reacts, you are too close.', prov: RING, variants: ['bird', 'distant'] },
  { id: 'trail', label: 'the trail', short: 'trail', role: 'Visitors use it: tripods, poles and dishes stay off it, and you never step back onto it while aiming.', prov: SITE, variants: ['bird', 'flock'] },
  { id: 'brook', label: 'the brook behind you', short: 'brook', role: 'Running water: a background that competes with the call. A quieter position away from it helps more than any gain.', prov: SITE, variants: ['bird'] },
  { id: 'canopy', label: 'the woodland edge', short: 'trees', role: 'The trees where the bird calls: their leaves move in the wind, and the edge reflects a little.', prov: SITE, variants: ['bird'] },
  { id: 'flock', label: 'the flock in flight', short: 'flock', role: 'Many birds moving fast across a wide field: a narrow dish cannot follow them; a shotgun or a wider pickup copes better.', moving: true, prov: SITE, variants: ['flock'] },
  { id: 'hedge', label: 'the hedgerow', short: 'hedgerow', role: 'Shelter for birds — and the far edge of the open ground.', prov: SITE, variants: ['flock'] },
  { id: 'animal', label: 'a large animal, far off', short: 'animal', role: 'A low, deep call from far away: little help from a small dish at such long wavelengths. Keep your distance; never approach to shorten it.', prov: SITE, variants: ['distant'] },
];

const REGIONS: RadiatingRegion[] = [
  { id: 'call', partId: 'bird', label: 'the call', anchor: BIRD_P, prov: SITE, variants: ['bird'], note: 'A clear call from one bird in the canopy: one direction, mostly mid and high pitches.' },
  { id: 'brookSound', partId: 'brook', label: 'the brook', anchor: { x: -7900, y: 0, z: 0 }, prov: SITE, variants: ['bird'], note: 'The brook behind: a steady background the mic also hears.' },
  { id: 'flockCalls', partId: 'flock', label: 'the flock’s calls', anchor: FLOCK_P, prov: SITE, variants: ['flock'], note: 'Many calls and wingbeats moving across the field.' },
  { id: 'low', partId: 'animal', label: 'the low call', anchor: ANIMAL_P, prov: SITE, variants: ['distant'], note: 'A deep call from far away: long wavelengths, carried far over the open ground.' },
];

/** Distances are read from the target (a point). */
export const F07_SURFACES: ReferenceSurface[] = [
  { id: 'bird', partId: 'bird', label: 'the bird', point: BIRD_P, normal: { x: -1, y: 0, z: 0 }, target: true, variants: ['bird'] },
  { id: 'flock', partId: 'flock', label: 'the flock’s line', point: FLOCK_P, normal: { x: -1, y: 0, z: 0 }, target: true, variants: ['flock'] },
  { id: 'animal', partId: 'animal', label: 'the animal', point: ANIMAL_P, normal: { x: -1, y: 0, z: 0 }, target: true, variants: ['distant'] },
];
export const F07_LINES: RefLine[] = [{ id: 'ground', label: 'the ground', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above the ground', minus: 'below the ground', keyPlus: 'HEIGHT', keyMinus: 'BELOW' } }];

const VARIANTS: Variant[] = [
  { id: 'bird', label: 'ONE BIRD', blurb: 'One bird calling from a canopy at a woodland edge, 26 m away, its setback ring drawn; the trail and a brook behind you.', phrase: 'at a woodland edge' },
  { id: 'flock', label: 'A FLOCK', blurb: 'A flock crossing open grassland about 30 m out — fast, wide, many callers.', phrase: 'on open grassland' },
  { id: 'distant', label: 'FAR AND LOW', blurb: 'A large animal’s low call from 70 m across open ground, its setback ring drawn.', phrase: 'across open ground' },
];

export const F07_MODEL: InstrumentModel = {
  ...measureModel({
    id: 'wildlife',
    name: 'an observation point',
    parts: PARTS,
    regions: REGIONS,
    surfaces: F07_SURFACES,
    lines: F07_LINES,
    envelopes: [...siteKeepOuts(WOOD_EDGE, 'bird'), ...siteKeepOuts(MEADOW, 'flock'), ...siteKeepOuts(BISON_MEADOW, 'distant')],
    variants: VARIANTS,
    defaultVariant: 'bird',
    views: VIEWS.bird,
    viewsByVariant: { flock: VIEWS.flock, distant: VIEWS.distant },
    viewTags: { side: 'SECTION · TOWARD THE TARGET', top: 'SITE PLAN' },
    groundY: { mm: 0, prov: ill('the ground at the observation point (frame G)') },
    aimAzLimit: 180,
    labelMinScale: 0.004,
  }),
  // A field site keeps its authored boxes: its ground and paths are drawn, not solid.
  fitAuthored: { side: true, top: true },
  // A site plan tens of metres wide: mics, lobes and stands drawn 10 × life size (said once in the accuracy note).
  hardwareScale: 10,
};
