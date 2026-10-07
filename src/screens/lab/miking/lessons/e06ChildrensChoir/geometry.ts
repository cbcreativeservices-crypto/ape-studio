/**
 * E06 CHILDREN'S VOICES AND CHOIRS — where things are, frame S, drawn FROM
 * ABOVE ONLY (the lead ruling: children are plan-view only — no side-view
 * figures, no faces, no headset close-ups; SeatingArt never draws a child in
 * elevation, and the lesson offers no other view). Research:
 * docs/labs/miking/childrens_choir/ and choir/ (the area-mic register);
 * corrections E6-* in CORRECTIONS_LOG.md.
 *
 *   CHOIR    fifteen children in two rows (the practice exercise's "two
 *            rows"): the front on the floor, the back on one 8 in step.
 *            A MAIN PAIR first (the lesson's studio workflow), AREA MICS
 *            2–4 ft in front and 1–3 ft above the front heads (S-LIVE's
 *            choral row; heights said in words), 3:1 apart, one per 6–9 ft
 *            of width (S-REC).
 *   FEATURE  the same choir with one child stepped forward to a stand mic an
 *            adult sets: within about 10 cm, the grille clear (the voice
 *            family's stage row, DPA-VOICE — an adult figure's research,
 *            used here as a drawing default: no source gives a child's).
 * Every child's size and spacing is a DRAWING DEFAULT (seatingVoices VOX.child).
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { add, aimOf, dirOf, dist, mul, sub, v3 } from '../shared/ensemble/frameS.ts';
import { seatingOf, type Seat, type Seating } from '../shared/ensemble/seating.ts';
import { lipOf, VOX } from '../shared/ensemble/seatingVoices.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews } from '../shared/ensemble/ensembleModel.ts';
import { mouthSurfaceFor, singerAnchor, threeToOneMics } from '../shared/ensemble/voiceGroup.ts';
import { voiceZone } from '../shared/voice/voiceZones.ts';
import { stageRow } from '../shared/voice/voiceStarts.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E06_SEATS = { choir: seatingOf('choir.children'), feature: seatingOf('choir.childrenSolo') } as const;
const CH = E06_SEATS.choir;
const FE = E06_SEATS.feature;
const toward = (from: Vec3, to: Vec3): MicPose => ({ p: from, ...aimOf(sub(to, from)) });
const mean = (pts: readonly Vec3[]) => mul(pts.reduce((a, b) => add(a, b), v3(0, 0, 0)), 1 / Math.max(1, pts.length));

/** S-LIVE's choral row (conv.), from the FRONT row's heads (children: VOX.child.head). */
export const LIVE = { above: { min: 304.8, max: 914.4 }, ahead: { min: 609.6, max: 1219.2 } } as const;
export const SECTION_W = { min: 1828.8, max: 2743.2 } as const;
const HEADS = VOX.child.head;
const above = (h: number) => -(HEADS + h);
const kids = (s: Seating, f: (q: Seat) => boolean = () => true) => s.seats.filter((q) => q.kind === 'child' && q.section !== 'solo' && f(q)).map(lipOf);

const CENTRE = mean(kids(CH));
const HALF_L = mean(kids(CH, (q) => q.p.x < 0));
const HALF_R = mean(kids(CH, (q) => q.p.x > 0));
/** Two area mics, each 0.62 m in front and 0.34 m above the front heads, 2.52 m apart. */
export const AREA_X = 1260;
export const AREA_L = toward(v3(-AREA_X, above(340), 620), HALF_L);
export const AREA_R = toward(v3(AREA_X, above(340), 620), HALF_R);
const nearest = (s: Seating, p: Vec3) => [...s.seats.filter((q) => q.kind === 'child')].sort((a, b) => dist(lipOf(a), p) - dist(lipOf(b), p))[0];
export const E06_31 = threeToOneMics(AREA_L.p, nearest(CH, AREA_L.p), AREA_R.p, nearest(CH, AREA_R.p));

/** The main pair: near (in S-LIVE's band) and farther (the choir fills a 95° angle). */
export const PAIR_NEAR = v3(0, above(500), 900);
export const PAIR_FAR = v3(0, above(800), 1700);

/* ── the featured child ── */
const SOLO = FE.seats.find((q) => q.section === 'solo')!;
const V_SOLO = singerAnchor(FE, SOLO.id);
export const E06_SURFACES = [mouthSurfaceFor('feature', FE, SOLO.id, sectionPartId('feature', 'solo'))];

const PAIR_TYPES = ['arrCard', 'arrOmni', 'arrFig8'];
const MODEL_NO_ZONES = () =>
  ensembleModel({
    id: 'e06-children',
    name: 'children’s choir, from above',
    variants: [
      { id: 'choir', label: 'A children’s choir', short: 'Choir', blurb: CH.blurb, seating: CH },
      { id: 'feature', label: 'A featured child', short: 'Soloist', blurb: FE.blurb, seating: FE },
    ],
    views: stageViews([CH, FE], { hMax: 2600 }),
    viewsByVariant: { choir: stageViews([CH], { hMax: 2600 }), feature: stageViews([FE], { hMax: 2600 }) },
    extraSurfaces: E06_SURFACES,
  });
export const E06_MODEL = MODEL_NO_ZONES();

/** The featured child's stand mic, found clear of the child (frame V's stage row). */
const SOLO_ZONE = voiceZone(
  E06_MODEL,
  V_SOLO,
  stageRow({
    id: 'cc.solo',
    variant: 'feature',
    micTypeIds: ['vocDynCard', 'vocDynSuper'],
    label: 'A stand mic an adult sets for the featured child',
    band: 'An adult sets the stand: the mic at the child’s mouth height, within about 10 cm (4 in) of the lips, on the mouth’s axis, the grille clear — a short distance the child can repeat.',
    tendency: 'The featured voice clear over the choir; a young voice changes level quickly, so a steady, rehearsed distance matters more than the exact one.',
    checks: ['The stand’s base and cable clear of the child’s feet, a sandbag if needed', 'The grille not covered, the mic not pointed at a monitor', 'The child’s loudest note at this distance'],
  }),
  MIC_TYPES,
  { surface: E06_SURFACES[0].id },
);

export const E06_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'cc.area',
    label: 'In front of the first row, a little above the heads',
    band: 'Try each area mic about 0.6–1.2 m (2–4 ft) in front of the first row and a little above the children’s heads — aimed at their mouths and the back row, not at the tops of heads. One mic for each 1.8–2.7 m (6–9 ft) of width.',
    kind: 'sourced',
    src: 'S-LIVE',
    quote: 'Choral groups: 1 to 3 feet above and 2 to 4 feet in front of the first row of the choir (S-LIVE); a mic too high "can become dull and distant", too low "can capture riser noise and point toward the front row only" (the lesson L14); one mic per 6–9 ft (S-REC p.6)',
    ref: 'front',
    d: [LIVE.ahead.min, LIVE.ahead.max],
    box: { min: v3(-AREA_X - 700, above(LIVE.above.max), LIVE.ahead.min), max: v3(-AREA_X + 700, above(LIVE.above.min), LIVE.ahead.max) },
    start: AREA_L,
    variants: ['choir'],
    micTypeIds: ['arrCard'],
    tendency: 'The children’s blend, with a little of the room. Too high and it turns dull and distant; too low, it hears the front row and the riser.',
    checks: ['The front row against the back row', 'The 3:1 spacing to the next mic, and mono', 'Where the monitor sits against the pattern'],
  }),
  mainZone({
    id: 'cc.pair',
    label: 'A main pair a few feet in front, a little above the heads',
    band: 'Begin with one pair, centred, a few feet in front and a little above the children’s heads — about 0.6–2 m (2–6.5 ft) out — then move it toward or away and listen to the front-to-back balance and the words.',
    kind: 'trial',
    src: 'S-REC',
    quote: 'a few feet in front of, and a few feet above, the heads of the first row (S-REC p.6); "Record a rehearsal pass with one stereo pair … Move the main array in small increments" (the lesson L27–L29)',
    bandProv: ill('"a few feet": 0.6–2 m out and 0.3–1.3 m above the children’s heads — the lab’s drawing, the near end S-LIVE’s choral band'),
    ref: 'front',
    d: [LIVE.ahead.min, 2000],
    box: { min: v3(-700, above(1300), LIVE.ahead.min), max: v3(700, above(LIVE.above.min), 2000) },
    start: toward(PAIR_NEAR, CENTRE),
    variants: ['choir', 'feature'],
    micTypeIds: PAIR_TYPES,
    tendency: 'The whole children’s choir as one sound: nearer, more of the front row and the words; farther, more blend and room.',
    checks: ['The front row against the back row', 'The words, quiet and loud', 'The sum in mono'],
  }),
  SOLO_ZONE,
];

/** A floor monitor in front of the children, low, facing them. */
export const E06_WEDGES: Wedge[] = [
  { id: 'mon', label: 'a low floor monitor in front of the children, facing them', short: 'MONITOR', p: v3(-AREA_X, 0, 1500), lift: 300, faces: v3(0, 0, -1), note: 'Low in level, in front of the children, facing them — below and in front of the area mic, where its rejection can be turned toward it. It carries the piano, never the choir’s own mics.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS (all drawn from above) ── */
const single = (key: string, pose: MicPose, label: string, extra: { art?: 'vocalDynamic'; dimTo?: Vec3; aimLen?: number } = {}) => ({ key, p: pose.p, aim: dirOf(pose.az, pose.el), pattern: 'cardioid' as const, label, ...extra });
const rig = (id: 'xy' | 'ortf' | 'ab', c: Vec3, params = {}, tilt = 20) => ({ id, params, place: { c, face: 0, tilt }, mount: { kind: 'stand' as const } });
const SPOT_L = toward(v3(-1500, above(450), 950), HALF_L);

export const E06_SETUPS: EnsembleSetup[] = [
  { id: 'xy', role: 'MAIN PAIR · COINCIDENT', title: 'One X/Y pair, a few feet in front', variants: ['choir', 'feature'], rig: rig('xy', PAIR_NEAR, { angle: 110 }, 15), mics: 'Two matched cardioid small condensers, capsules together, on one tall stand with a wide base.', start: 'Centred about 0.9 m (3 ft) in front of the first row and about 0.5 m above the children’s heads, aimed at their mouths; then move it toward or away and listen.', line: 'The children’s blend and the room, a dependable mono sum — the place to begin, before any close mic.', core: true, view: 'plan' },
  { id: 'ortf', role: 'MAIN PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair farther back', variants: ['choir'], rig: rig('ortf', PAIR_FAR), mics: 'Two cardioid small condensers, 17 cm (6.7 in) apart, 110° between them.', start: 'About 1.7 m (5.5 ft) in front and 0.8 m above the heads, where the whole choir fills its angle.', line: 'A wider picture with useful separation; check the outer children and mono.', core: true, view: 'plan' },
  { id: 'area', role: 'AREA MICS · TWO', title: 'Two area mics, 3:1 apart', short: 'AREA MICS', variants: ['choir'], singles: [single('l', AREA_L, 'LEFT AREA', { dimTo: lipOf(nearest(CH, AREA_L.p)) }), single('r', AREA_R, 'RIGHT AREA', { dimTo: lipOf(nearest(CH, AREA_R.p)) })], mics: 'Two cardioid small condensers on tall, stable stands, one for each half.', start: `Each about 0.6 m (2 ft) in front of the first row and about 0.35 m above the children’s heads, aimed at their mouths and the back row; ${(2 * AREA_X / 1000).toFixed(1)} m apart — at least three times each mic’s distance to its nearest child.`, line: 'Practical live coverage with two channels; the mic height matters more with children — too high turns them dull.', core: true, view: 'plan' },
  { id: 'spot', role: 'MAIN PAIR + SECTION SPOT', title: 'The pair and a spot for the sopranos', short: 'PAIR + SPOT', variants: ['choir'], rig: rig('xy', PAIR_NEAR, { angle: 110 }, 15), singles: [single('s', SPOT_L, 'SOPRANO SPOT')], mics: 'The X/Y pair, plus one cardioid on its own stand for a section the pair cannot carry.', start: 'The spot about 1–2 m from the section, in front and above their mouths; raised only until the section is clear.', line: 'Limited correction under the pair; too much and the children sound like separate soloists.', core: false, view: 'plan' },
  { id: 'solo', role: 'A FEATURED CHILD', title: 'A stand mic an adult sets for the soloist', short: 'STAND MIC', variants: ['feature'], singles: [single('solo', SOLO_ZONE.start, 'SOLO MIC', { art: 'vocalDynamic', dimTo: lipOf(SOLO), aimLen: 300 })], mics: 'A handheld vocal mic in a clip on a stable, wide-based stand an adult sets — the choir keeps its pair.', start: 'The stand at the child’s mouth height, the mic within about 10 cm (4 in) of the lips; an adult checks it is not pointed at a monitor.', line: 'Independent control for a featured voice; safer for a young singer than a handheld they must hold and aim.', core: true, view: 'plan', focus: ['solo.1', 'sop.3', 'sop.4'] },
];

export const E06_PLACE: PlaceZone[] = [
  { id: 'pz.near', label: 'Near: 0.6–1.2 m in front', band: 'About 0.6–1.2 m (2–4 ft) in front of the first row, 0.3–0.9 m (1–3 ft) above the children’s heads.', box: { min: v3(-700, above(LIVE.above.max), LIVE.ahead.min), max: v3(700, above(LIVE.above.min), LIVE.ahead.max) }, tendency: 'More of the front row and the words; the outer children can fall outside the pair’s angle.' },
  { id: 'pz.far', label: 'Farther: 1.2–2 m in front, higher', band: 'About 1.2–2 m (4–6.5 ft) in front, 0.6–1.3 m (2–4 ft) above the heads — the whole choir inside the pair’s angle.', box: { min: v3(-700, above(1300), LIVE.ahead.max), max: v3(700, above(600), 2000) }, tendency: 'More blend between the rows and more of the room.' },
];
