/**
 * F07 WILDLIFE AND DISTANT SOURCES — the suggested starting points (charter
 * §2 layer 1). Keys: foley_footsteps/SOURCES.md §0, field_wildlife_distant/
 * SOURCES.md; geometry from field_wildlife_distant/GEOMETRY_PROPOSAL.md §3.
 * Distances are read from the target to the mic; every range is a DRAWING
 * DEFAULT, every start lies outside the setback ring. The methods are
 * sourced:
 *
 *   shotgun  a short shotgun in protection, aimed at the target (L12;
 *            CORNELL-MIC) — the worked example (ONE MIC)
 *   dish     a 57 cm dish, the capsule at its focus facing the dish, aimed
 *            precisely at the single bird (L15; SCH-DISH, INNERCORE) —
 *            ANOTHER START ("a dish for one caller")
 *   habitat  the shotgun plus a separate omni for the habitat, two labelled
 *            channels (L29) — TWO MICS
 *   pair     a flock: an ORTF pair for the group (TWO MICS)
 *   wide     an omni for a group or the whole place (L18) — the farther role
 *            named WIDER VIEW through SETUP_PICKS (O-14)
 * The autonomous recorder (L21) is a card, never placed.
 */
import type { DocumentedZone, Provenance, SetupPairData, Vec3 } from '../../engine/model/types.ts';
import { ill } from '../shared/measure/measureModel.ts';
import { arraySetup, pairPoses } from '../shared/field/fieldArrays.ts';
import { poseToward } from '../shared/field/frameG.ts';
import { ANIMAL_P, BIRD_P, FLOCK_P, WL_H } from './geometry.ts';

const HEIGHT = { line: 'ground', min: WL_H - 300, max: WL_H + 300, prov: ill('1.2–1.8 m: a drawing default (a tripod or a held mic at about chest height)') };
const at = (x: number, z = 0): Vec3 => ({ x, y: -WL_H, z });
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const RANGE: Provenance = ill('the range is a drawing default: the sources give no distance (L74); the observation point lies outside the setback ring');

type Spec = { startPose?: import('../../engine/model/types.ts').MicPose; id: string; variant: 'bird' | 'flock' | 'distant'; surface: 'bird' | 'flock' | 'animal'; target: Vec3; types: string[]; x0: number; x1: number; z0: number; z1: number; start: Vec3; aimTol?: number; label: string; band: string; tendency: string; checks: string[]; src: string; quote: string };
function wlZone(s: Spec): DocumentedZone {
  const corners = [at(s.x0, s.z0), at(s.x1, s.z0), at(s.x0, s.z1), at(s.x1, s.z1), at((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2)];
  const ds = corners.map((p) => dist(p, s.target));
  const min = Math.floor(Math.min(...ds) / 100) * 100 - 100;
  const max = Math.ceil(Math.max(...ds) / 100) * 100 + 100;
  return {
    id: s.id,
    label: s.label,
    band: s.band,
    kind: 'sourced',
    src: s.src,
    quote: s.quote,
    bandProv: RANGE,
    refSurface: s.surface,
    side: 'either',
    distance: { min, max },
    radial: HEIGHT,
    box: { min: { x: s.x0, y: -4000, z: s.z0 }, max: { x: s.x1, y: 0, z: s.z1 }, prov: RANGE },
    requires: { variant: s.variant, micTypeIds: s.types },
    ...(s.aimTol ? { aim: { maxOffAxis: s.aimTol, prov: ill(`aimed within ${s.aimTol}° of the target — the lab’s tolerance`) } } : {}),
    drawn: { side: { u0: s.x0, u1: s.x1, v0: -WL_H - 300, v1: -WL_H + 300 }, top: { u0: s.x0, u1: s.x1, v0: s.z0, v1: s.z1 } },
    start: s.startPose ?? poseToward(s.start, s.target),
    tendency: s.tendency,
    checks: s.checks,
  };
}

export const F07_START = { bird: at(0), habitat: at(0, 3000), flock: at(0), distant: at(0) } as const;

export const F07_ZONES: DocumentedZone[] = [
  wlZone({
    id: 'wl.bird.shotgun',
    variant: 'bird',
    surface: 'bird',
    target: BIRD_P,
    types: ['shotgunShort'],
    x0: -1500,
    x1: 1500,
    z0: -2500,
    z1: 2500,
    start: F07_START.bird,
    aimTol: 12,
    label: 'A shotgun at the observation point, aimed at the bird',
    band: 'Start from a permitted observation point outside the setback ring — here about 26–29 m from the bird — with a shotgun in a basket and fur, its axis on the call.',
    tendency: 'Less of the off-axis surroundings, mostly in the upper pitches — but it does not amplify the bird or remove what lies on its axis. Off its axis the tone changes.',
    checks: ['Outside the ring; feet planted', 'The axis on the call, by ear on headphones', 'The wind protection fitted'],
    src: 'CORNELL-MIC',
    quote: 'shotguns "especially useful for recording groups of birds, birds in flight, and other actively moving birds"; off-axis mid and high frequency sounds altered (L12–L13)',
  }),
  wlZone({
    id: 'wl.bird.dish',
    variant: 'bird',
    surface: 'bird',
    target: BIRD_P,
    types: ['dishMic'],
    x0: -1500,
    x1: 1500,
    z0: -2500,
    z1: 2500,
    start: F07_START.bird,
    aimTol: 5,
    label: 'A dish at the observation point, aimed precisely at the bird',
    band: 'For one bird calling from a fixed spot, try a dish from the same permitted point — its capsule at the focus, facing the dish — aimed precisely at the call.',
    tendency: 'The call’s mid and high pitches gathered at the focus: a clearer call against its surroundings — while the aim holds. Low pitches get little help.',
    checks: ['The capsule at the maker’s focus, facing the dish', 'A slow sweep on headphones to find the best aim', 'Steady during a phrase'],
    src: 'SCH-DISH',
    quote: '"All CCM microphones are mounted with their 0° direction pointing towards the dish"; diameter "585 mm", focal distance "210 mm" (L15, L27)',
  }),
  wlZone({
    id: 'wl.bird.habitat',
    variant: 'bird',
    surface: 'bird',
    target: BIRD_P,
    types: ['arrOmni', 'arrCard'],
    x0: -1500,
    x1: 1500,
    z0: 2600,
    z1: 4500,
    start: F07_START.habitat,
    label: 'A habitat mic beside it',
    band: 'For the place around the call, a separate omni a few metres beside the shotgun — its own labelled channel.',
    tendency: 'The habitat as it is — the brook, the trees, the bird among them: a second channel to blend or keep apart.',
    checks: ['Its own labelled channel', 'Clear of the trail', 'Checked against the focused channel'],
    src: 'LESSON-F07',
    quote: 'Record a separate general ambience track when the surrounding habitat matters, and label it as such (L29)',
  }),
  wlZone({
    id: 'wl.flock.shotgun',
    variant: 'flock',
    surface: 'flock',
    target: FLOCK_P,
    types: ['shotgunShort'],
    x0: -1500,
    x1: 1500,
    z0: -2500,
    z1: 2500,
    start: F07_START.flock,
    aimTol: 15,
    label: 'A shotgun, ready to follow the flock',
    band: 'For birds in flight, start with a shotgun at the observation point — its broader useful angle copes with fast movement better than a dish.',
    tendency: 'The flock held near its axis as you re-aim smoothly; off-axis birds change colour.',
    checks: ['Feet planted, a smooth re-aim', 'Eyes on the flock’s path', 'Handling noise kept down'],
    src: 'CORNELL-MIC',
    quote: 'shotguns "especially useful for recording groups of birds, birds in flight" (L28)',
  }),
  wlZone({
    id: 'wl.flock.pair',
    variant: 'flock',
    surface: 'flock',
    target: FLOCK_P,
    types: ['arrCard', 'arrOmni'],
    x0: -1500,
    x1: 1500,
    z0: -2500,
    z1: 2500,
    start: F07_START.flock,
    startPose: pairPoses('ortf', F07_START.flock, 0).A,
    label: 'A stereo pair for the group',
    band: 'For the flock as a group crossing the field, a stereo pair at the same point, facing the flight line.',
    tendency: 'The flock crossing the image with the open ground around it — less isolation, steadier coverage.',
    checks: ['The pair’s geometry written down', 'Mono checked', 'Wind protection on both capsules'],
    src: 'LESSON-F07',
    quote: 'Choose when the target and its surrounding scene are both important, or a group spans more than a narrow beam (L18)',
  }),
  wlZone({
    id: 'wl.flock.wide',
    variant: 'flock',
    surface: 'flock',
    target: FLOCK_P,
    types: ['arrOmni'],
    x0: -1500,
    x1: 1500,
    z0: -2500,
    z1: 2500,
    start: F07_START.flock,
    label: 'A wider view: one omni for the whole group',
    band: 'For the whole group and its place, an omni at the observation point.',
    tendency: 'The flock and the open ground together: steadier coverage of moving birds, less isolation of any one.',
    checks: ['The wind protection for open ground', 'The flock against the background', 'Labelled as a wide view'],
    src: 'LESSON-F07',
    quote: 'Less isolation of one remote source; preserves a broader context and may give steadier coverage of moving animals (L19)',
  }),
  wlZone({
    id: 'wl.far.shotgun',
    variant: 'distant',
    surface: 'animal',
    target: ANIMAL_P,
    types: ['shotgunShort'],
    x0: -1500,
    x1: 1500,
    z0: -2500,
    z1: 2500,
    start: F07_START.distant,
    aimTol: 12,
    label: 'A shotgun at the observation point, far outside the ring',
    band: 'For a low call far away, start with a shotgun at a permitted point — here about 70 m from the animal, well outside its ring — and expect little isolation in the lows.',
    tendency: 'Some help against off-axis sound in the upper pitches; the low call itself arrives with much of the surroundings. Distance does not disappear.',
    checks: ['Well outside the ring; never closer to shorten it', 'Wind protection for open ground', 'Any low-cut filter noted — it may take the call'],
    src: 'LESSON-F07',
    quote: 'A low-pitched roar or rumble may therefore be less suited to a typical small dish than a clear high-pitched call (L24)',
  }),
  wlZone({
    id: 'wl.far.wide',
    variant: 'distant',
    surface: 'animal',
    target: ANIMAL_P,
    types: ['arrOmni'],
    x0: -1500,
    x1: 1500,
    z0: -2500,
    z1: 2500,
    start: F07_START.distant,
    label: 'A wider view: one omni for the place',
    band: 'For the call in its place, an omni at the same permitted point.',
    tendency: 'The low call and the open ground around it, as a listener there would hear them.',
    checks: ['Wind protection for open ground', 'The call against the background', 'Labelled as a wide view'],
    src: 'LESSON-F07',
    quote: 'Conventional cardioid or omni — choose when the target and its surrounding scene are both important (L18)',
  }),
];

export const F07_PAIRS: SetupPairData[] = [
  { label: 'Shotgun on the bird + an omni for the habitat', A: { zone: 'wl.bird.shotgun' }, B: { zone: 'wl.bird.habitat' }, variants: ['bird'], line: 'The call focused on one channel, the place on another — two labelled channels to blend or keep apart.' },
  arraySetup({ label: 'ORTF pair facing the flight line (17 cm, 110°)', id: 'ortf', zone: 'wl.flock.pair', c: F07_START.flock, bearing: 0, typeA: 'arrCard', aOnZone: true, variants: ['flock'], line: 'The flock crossing the image with the field around it — check mono, and protect both capsules from the wind.' }),
];
