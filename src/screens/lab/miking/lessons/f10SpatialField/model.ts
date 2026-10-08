/**
 * F10 SPATIAL FIELD PICKUP — the recommended starting points (charter §2
 * layer 1) and the lesson's STARTING SETUPS drawn whole (its own page: an
 * array is drawn with every capsule, never as one engine mic). Frame F10
 * (geometry.ts). Research: docs/labs/miking/spatial_field/SOURCES.md,
 * GEOMETRY_PROPOSAL.md §4 (the setups) — every spacing a drawing default
 * shown as "an example layout" (D-6B-7), heights from MEYER-MAPP.
 *
 * ENGINE ZONES (the MICROPHONES page draws each type here; the two-mic page
 * starts from them):
 *   sp.head    the binaural head at the listener's point, ears 1.55–1.8 m up
 *              (standing), face to the scene front — the worked example;
 *   sp.seated  the same at a seated listener's height (1.1–1.3 m);
 *   sp.foa     the Ambisonic mic at the listener's point, front mark forward;
 *   sp.dms     the Double M/S cluster there;
 *   sp.close   a close handheld on the street singer (Lab 5's stage row,
 *              within about 10 cm) — the separate close mono;
 *   sp.close.e a headset on the performer (Lab 5's headset row).
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import type { ArrayParams, ArrayPresetId } from '../shared/ensemble/stereoArray.ts';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { EAR_SEATED, EAR_STANDING, EVENT, LISTENER, PLAZA, figureToF } from './geometry.ts';
import { VOICE_DIMS } from '../shared/voice/voiceSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const FRONT = v3(1, 0, 0);
const MEYER = { kind: 'sourced', src: 'MEYER-MAPP', quote: 'mic heights 1.2 m (~4 ft.) for seated audience, 1.7 m (~5.6 ft.) for standing audience' } as const;
const facing = (p: Vec3): MicPose => ({ p, az: 180, el: 0 });
/** The plan box round the listener's point a spatial mic counts in. */
const AT_LISTENER = { min: v3(-500, -2100, -500), max: v3(700, -900, 500), prov: ill('within about half a metre of the listener’s point (the lab’s box)') };

function atListener(o: { id: string; label: string; band: string; type: string; seated?: boolean; front: number; tendency: string; checks: string[]; quote: string; src: string }): DocumentedZone {
  const ear = o.seated ? EAR_SEATED : EAR_STANDING;
  return {
    id: o.id,
    label: o.label,
    band: o.band,
    kind: 'sourced',
    src: o.src,
    quote: o.quote,
    bandProv: MEYER,
    refSurface: 'ground',
    side: 'either',
    distance: o.seated ? { min: 1100, max: 1300 } : { min: 1550, max: 1800 },
    aim: { maxOffAxis: 15, dir: FRONT, prov: ill('the face or front mark toward the scene front, within 15° (the lab’s tolerance)') },
    box: AT_LISTENER,
    requires: { micTypeIds: [o.type] },
    start: facing(v3(o.front, -ear, 0)),
    tendency: o.tendency,
    checks: o.checks,
  };
}

/** The headset capsule on the performer (Lab 5's headset place, turned into frame F10). */
const HS = figureToF(EVENT.perfMouth, v3(VOICE_DIMS.headsetFwd.mm, 0, VOICE_DIMS.headsetSide.mm));
/** The close handheld in front of the singer's lips (8 cm, aimed at them). */
const CLOSE = v3(PLAZA.singerMouth.x - 80, PLAZA.singerMouth.y, 0);

export const F10_ZONES: DocumentedZone[] = [
  atListener({
    id: 'sp.head',
    label: 'At the listener’s point, the face to the scene front',
    band: 'Start the ears where a standing listener’s would be — about 1.7 m (5.6 ft) up — at the listener’s point, the face toward the scene front. Label left and right.',
    type: 'spHead',
    front: 95,
    src: 'LESSON-F10',
    quote: 'Position the two ear pickup points where a listener would be, at a safe and stable head height; orient the face toward the intended front (L12); heights MEYER-MAPP',
    tendency: 'A fixed listener’s point of view over headphones: sounds at the sides and behind as well as in front. On loudspeakers it depends on the head and the processing.',
    checks: ['Left and right labelled, the face to the scene front', 'The headphones it is made for', 'Wind on the outer ears; the stand stable'],
  }),
  atListener({
    id: 'sp.seated',
    label: 'A seated listener’s height',
    band: 'For a seated audience’s point of view, try the ears about 1.2 m (4 ft) up, still facing the scene front.',
    type: 'spHead',
    seated: true,
    front: 95,
    src: 'MEYER-MAPP',
    quote: 'mic heights 1.2 m (~4 ft.) for seated audience',
    tendency: 'The scene from where a seated listener would hear it — the people and objects nearby block and reflect more of it.',
    checks: ['What is between the head and the front source', 'The ground and nearby surfaces', 'The headphone listen'],
  }),
  atListener({
    id: 'sp.foa',
    label: 'An Ambisonic mic at the listener’s point',
    band: 'Start the four-capsule mic upright at the listener’s point, about 1.7 m up, its front mark toward the scene front. Four tracks, identical preamps, matched and linked gain.',
    type: 'spFoa',
    front: 25,
    src: 'AMBEO-REC',
    quote: 'four capsules … recorded separately on four tracks using identical microphone preamplifiers; Set the same gain for each of the four channels',
    tendency: 'An enveloping view that can be turned and rendered later — to headphones, a speaker layout or an interactive scene. Not sharp, separable point sources.',
    checks: ['The front mark and the mounting (upright, upside down, end-on) logged', 'Four tracks, matched and linked gain', 'The capsule order from the mic’s manual'],
  }),
  atListener({
    id: 'sp.dms',
    label: 'A Double M/S cluster at the listener’s point',
    band: 'An idea to try for a compact surround take: the front and rear cardioids and the side figure-8 together at the listener’s point, about 1.7 m up, the front Mid toward the scene front.',
    type: 'spDms',
    front: 25,
    src: 'LESSON-F10',
    quote: 'Mount a forward cardioid Mid, backward cardioid Mid and shared sideways figure-eight close together (L18)',
    tendency: 'Front and rear, left and right decoded afterwards from three tracks — the width and the rear level adjustable. The decode must be done on purpose.',
    checks: ['The figure-8’s positive side marked before recording', 'Three separate tracks', 'Left, right and rear following a walker'],
  }),
  {
    id: 'sp.close',
    label: 'A close mic on the singer, on its own channel',
    band: 'A separate close mono for the front source: a handheld on a stand within about 10 cm (4 in) of the singer’s lips, aimed at them — its own channel, beside the spatial take.',
    kind: 'sourced',
    src: 'DPA-VOICE',
    quote: 'Vocal microphones on stage are normally used within 10 cm (Lab 5’s stage row) — the lesson L6: record a separate close source if the project needs it',
    bandProv: ill('Lab 5’s stage row: 2.5–10 cm (the lab’s drawing)'),
    refSurface: 'mouthF',
    side: 'either',
    distance: { min: 25, max: 100 },
    aim: { maxOffAxis: 15, prov: ill('aimed at the lips within 15° (the lab’s tolerance)') },
    requires: { variant: 'plaza', micTypeIds: ['vocDynCard'] },
    start: { p: CLOSE, ...aimOf(sub(PLAZA.singerMouth, CLOSE)) },
    tendency: 'The singer’s voice clear and close, nearly free of the square — a layer the spatial take cannot give, because no array isolates one source.',
    checks: ['The singer’s agreement and their space', 'The stand clear of passers-by', 'Its timing against the spatial take (it hears the singer first)'],
  },
  {
    id: 'sp.close.e',
    label: 'A headset on the performer, on its own channel',
    band: 'A separate close mono for the performer: a headset capsule near the corner of the mouth, placed as its maker says — its own channel, beside the spatial take.',
    kind: 'sourced',
    src: 'DPA-VOICE',
    quote: 'the mouth-to-capsule position … must be checked (Lab 5’s headset row); the lesson L41: appropriate close microphones for intelligible live speech',
    bandProv: ill('Lab 5’s headset row: 2–6 cm from the lips (the lab’s drawing of "near the mouth corner")'),
    refSurface: 'mouthE',
    side: 'either',
    distance: { min: 20, max: 60 },
    aim: { maxOffAxis: 60, prov: ill('toward the mouth within 60° (the lab’s tolerance)') },
    requires: { variant: 'event', micTypeIds: ['vocHeadset'], mount: 'clip' },
    start: { p: HS, ...aimOf(sub(EVENT.perfMouth, HS)) },
    tendency: 'The performer’s voice steady and close whatever they do — what the PA and the stream need; the spatial mic is the audience’s view.',
    checks: ['The capsule where its maker says', 'The pack and the cable secured', 'Its own path: never the spatial mic into the PA'],
  },
];

/* ── STARTING SETUPS (the lesson's own page draws each whole) ── */

/** A rig: a stereoArray preset placed in frame F10 (its centre, its facing
 *  in degrees from the scene front toward the listener's right). */
export type SpatialRig = { id: ArrayPresetId; c: Vec3; face?: number; params?: ArrayParams };
/** A single mic in a setup (an engine type at an engine zone's start). */
export type SetupSingle = { typeId: string; zone: string };
export type SpatialSetup = {
  id: string;
  role: 'ONE MIC' | 'TWO MICS' | 'FARTHER BACK · STUDIO' | 'ANOTHER START';
  core: boolean;
  title: string;
  /** What is drawn: rigs (whole arrays) and single mics. */
  rigs: SpatialRig[];
  singles: SetupSingle[];
  /** For the setup card: the deliverable it serves, where to start, what it tends to do. */
  deliver: string;
  start: string;
  line: string;
  variants?: readonly string[];
};

const AT = (h = EAR_STANDING): Vec3 => v3(LISTENER.x, -h, LISTENER.z);

export const F10_SETUPS: SpatialSetup[] = [
  {
    id: 's.head',
    role: 'ONE MIC',
    core: true,
    title: 'A binaural head at the listener’s point',
    rigs: [{ id: 'binaural', c: AT() }],
    singles: [],
    deliver: 'For: headphones.',
    start: 'The ears about 1.7 m (5.6 ft) up at the listener’s point, the face to the scene front, on a stable stand.',
    line: 'A fixed listener’s point of view with sides and behind — made for headphones.',
  },
  {
    id: 's.foa',
    role: 'TWO MICS',
    core: true,
    title: 'An Ambisonic mic, plus a close mic on the front source',
    rigs: [{ id: 'foa', c: AT() }],
    singles: [{ typeId: 'vocDynCard', zone: 'sp.close' }],
    deliver: 'For: headphones, a speaker layout or an interactive scene — and a separate close voice.',
    start: 'The Ambisonic mic upright at the listener’s point, its front mark forward; a close handheld within about 10 cm of the singer, on its own channel.',
    line: 'An enveloping, turnable view, plus the clear voice an array cannot isolate — two layers, kept apart.',
    variants: ['plaza'],
  },
  {
    id: 's.foa.e',
    role: 'TWO MICS',
    core: true,
    title: 'An Ambisonic mic, plus a headset on the performer',
    rigs: [{ id: 'foa', c: AT() }],
    singles: [{ typeId: 'vocHeadset', zone: 'sp.close.e' }],
    deliver: 'For: the stream’s spatial view — and a close voice for the PA and the stream.',
    start: 'The Ambisonic mic upright at the audience’s listening point, its front mark toward the stage; a headset on the performer, on its own channel.',
    line: 'The audience’s view for the stream, plus a close voice — and the spatial mic kept out of the PA.',
    variants: ['event'],
  },
  {
    id: 's.50',
    role: 'FARTHER BACK · STUDIO',
    core: true,
    title: 'A five-channel array (an example layout)',
    rigs: [{ id: 'surround50', c: AT() }],
    singles: [],
    deliver: 'For: a five-speaker layout (L, C, R, Ls, Rs).',
    start: 'Front left, centre and right across the front, two surrounds behind, round the listener’s point — the spacing chosen for the place and the taste. Document each mic and its front axis.',
    line: 'A stable front with the space around it; check the stereo and mono downmix — spaced mics can colour it.',
  },
  {
    id: 's.dms',
    role: 'ANOTHER START',
    core: false,
    title: 'Double M/S at the listener’s point',
    rigs: [{ id: 'dms', c: AT() }],
    singles: [],
    deliver: 'For: front and rear, decoded later — or plain stereo.',
    start: 'The cluster at the listener’s point, the front Mid toward the scene front, the figure-8’s positive side marked.',
    line: 'Compact and adjustable after recording — the decode must be done on purpose.',
  },
  {
    id: 's.add',
    role: 'ANOTHER START',
    core: false,
    title: 'A front pair with a rear add-on (an example layout)',
    rigs: [
      { id: 'ortf', c: AT() },
      { id: 'hamasaki', c: v3(-1500, -EAR_STANDING, 0) },
    ],
    singles: [],
    deliver: 'For: a surround layout, built from a front array and an ambience layer.',
    start: 'A front pair at the listener’s point; a wide square of figure-8s behind it, their dead sides toward the front source — an ambience layer, not a whole array.',
    line: 'Space and reverberation behind a stable front; check the timing and the direct sound leaking into the square.',
  },
  {
    id: 's.seated',
    role: 'ANOTHER START',
    core: false,
    title: 'A binaural head at a seated listener’s height',
    rigs: [{ id: 'binaural', c: AT(EAR_SEATED) }],
    singles: [],
    deliver: 'For: headphones, from a seated audience’s point of view.',
    start: 'The ears about 1.2 m (4 ft) up, the face to the scene front.',
    line: 'The scene from a seat: more of what is close by, less of what is beyond it.',
  },
];

export const setupsIn = (variant: string) => F10_SETUPS.filter((s) => !s.variants || s.variants.includes(variant));
