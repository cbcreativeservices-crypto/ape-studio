/**
 * E14 FULL ORCHESTRA — where things are (charter §2 layer 2), frame S
 * (shared/ensemble/frameS.ts). Research: docs/labs/miking/full_orchestra/
 * SOURCES.md (§A arrays, §B seating), GEOMETRY_PROPOSAL.md; corrections
 * E14-* in CORRECTIONS_LOG.md.
 *
 *   SEATING   American (default) and German (the variants): strings by the
 *             research's order; every position a drawing default
 *   MAIN      over or just behind the podium, 3–4 m up (DPA-AB-ORCH); drawn
 *             at 3.2 m (practice: PELLOWE, inside 3–4 m and ARI's ≈ 3 m)
 *   ARRAYS    A/B 50 cm (40–60 cm), ORTF 17 cm / 110° (95° recording angle),
 *             X/Y 90°, M/S; the three-omni tree 2 m × 1.5 m (SCH-SURR, the
 *             default: OWNER REVIEW) or compact (PELLOWE); outriggers ≈ 6.1 m
 *             apart, 1.5 m in front of the outer strings, the tree's height
 *             (practice, not a standard: OWNER REVIEW)
 *   SUPPORTS  a cardioid 1–1.5 m from three or four players (DPA-MULTI): the
 *             front woodwinds, the front cellos
 * The engine's single mic stands for an array's centre (its zone); Lab 5's
 * own pages draw the whole array.
 */
import type { DocumentedZone, MicPose, Provenance, Wedge } from '../../engine/model/types.ts';
import { aimOf, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { frontAt, seatingOf } from '../shared/ensemble/seating.ts';
import { MAIN_HEIGHT, OUTRIGGERS } from '../shared/ensemble/stereoArray.ts';
import { ensembleModel, mainZone, sectionPartId, supportPose, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const E14_SEATS = { american: seatingOf('orch.american'), german: seatingOf('orch.german') } as const;
const AM = E14_SEATS.american;
const DE = E14_SEATS.german;
const P = AM.podium!;

/* ── the main array's places (frame S) ── */
/** The main pair: just behind the podium's centre, 3.2 m up. */
export const MAIN_C = v3(0, -MAIN_HEIGHT.def, P.c.z + 200);
/** The tree: its L–R bar over the podium, the centre mic 1.5 m ahead (near
 *  the front desks' line, as practice describes it). */
export const TREE_C = v3(0, -MAIN_HEIGHT.def, P.c.z);
/** Where the strings' front edge is beside the tree, and the outriggers
 *  ≈ 1.5 m in front of it (practice) — the u offset from the tree's bar. */
const OUT_Z = frontAt(AM, OUTRIGGERS.span / 2) + OUTRIGGERS.front;
export const OUT_U = TREE_C.z - OUT_Z;
const STRINGS_MID = v3(0, -1100, -2400);
const toward = (from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }): MicPose => ({ p: from, ...aimOf(sub(to, from)) });

/* ── supports (the shared rule: 1–1.5 m from 3–4 players) ── */
export const WW = supportPose(AM, ['fl', 'ob'], { r: 1250, lift: 50 });
export const VC_AM = supportPose(AM, 'vc', { r: 1250, lift: 58, toward: v3(4200, 0, 2600) });
export const VC_DE = supportPose(DE, 'vc', { r: 1250, lift: 58, toward: v3(-1600, 0, 2600) });

const MAIN_TYPES = ['arrOmni', 'arrCard', 'arrFig8'];

export const E14_SURFACES = [
  targetSurface('t.ww', sectionPartId('american', 'fl'), 'the front-row woodwinds', WW.target, WW.approach),
  targetSurface('t.vcA', sectionPartId('american', 'vc'), 'the front cellos', VC_AM.target, VC_AM.approach),
  targetSurface('t.vcD', sectionPartId('german', 'vc'), 'the front cellos', VC_DE.target, VC_DE.approach),
];
const surf = (id: string) => E14_SURFACES.find((s) => s.id === id)!;

export const E14_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'orch.main',
    label: 'Above or just behind the podium',
    band: 'Start the main pair above or just behind the conductor’s podium, about 3–4 m (10–13 ft) up — high enough to see past the front players to the rows behind.',
    kind: 'sourced',
    src: 'DPA-AB-ORCH',
    quote: 'above or right behind the conductor’s podium at a height of between three and four meters, so that no musicians obscure the instrument behind them',
    ref: 'floor',
    d: [3000, 4000],
    box: { min: v3(-900, -4000, P.c.z - 450), max: v3(900, -3000, P.c.z + 1500) },
    start: toward(MAIN_C, STRINGS_MID),
    micTypeIds: MAIN_TYPES,
    tendency: 'A broad view of the whole orchestra with the hall around it. Higher tends to hear more of the back rows and the room; farther forward, more of the front desks.',
    checks: ['A quiet and a loud passage, every section', 'A stable centre and the edges', 'The mono sum'],
  }),
  targetZone({
    id: 'sup.ww',
    label: 'A support over the front woodwinds',
    band: 'A cardioid about 1–1.5 m (3–5 ft) from the flutes and oboes, above and in front of them, aimed across all four — on a tall stand between the string desks, clear of the bows.',
    src: 'DPA-MULTI',
    quote: 'directional microphones around 1 to 1.5 meters from the players, covering approximately three or four musicians (the orchestral example)',
    kind: 'sourced',
    surface: surf('t.ww'),
    side: v3(1, 0, 0),
    d: [1000, 1500],
    coneMax: 35,
    aimMax: 25,
    start: WW.pose,
    micTypeIds: ['arrCard'],
    tendency: 'More detail from four players the main pair hears as part of the blend — and an earlier arrival than the main pair to judge in the sum.',
    checks: ['It alone, then under the main pair', 'The players next to them (brass, strings)', 'The image and the mono sum'],
    prov: ill('approached from above and in front: the lab’s cone round the shared support direction'),
  }),
  targetZone({
    id: 'sup.vc.am',
    label: 'A support over the front cellos',
    band: 'A cardioid about 1–1.5 m (3–5 ft) from the front cellos, above and to the outside, aimed across four players — clear of the bows and the endpins.',
    src: 'DPA-MULTI',
    quote: 'directional microphones around 1 to 1.5 meters from the players, covering approximately three or four musicians (the orchestral example)',
    kind: 'sourced',
    surface: surf('t.vcA'),
    side: v3(0, 0, 1),
    d: [1000, 1500],
    coneMax: 35,
    aimMax: 25,
    start: VC_AM.pose,
    variants: ['american'],
    micTypeIds: ['arrCard'],
    tendency: 'More of the cellos’ line and bow detail; a local view that can pull them forward of the orchestra if it is too loud.',
    checks: ['Bow noise and the low notes', 'Front-desk bias', 'Under the main pair, in mono'],
    prov: ill('approached from the outside and above: the lab’s cone'),
  }),
  targetZone({
    id: 'sup.vc.de',
    label: 'A support over the front cellos',
    band: 'A cardioid about 1–1.5 m (3–5 ft) from the front cellos, above and in front, aimed across four players — clear of the bows, the endpins and the conductor.',
    src: 'DPA-MULTI',
    quote: 'directional microphones around 1 to 1.5 meters from the players, covering approximately three or four musicians (the orchestral example)',
    kind: 'sourced',
    surface: surf('t.vcD'),
    side: v3(-1, 0, 0),
    d: [1000, 1500],
    coneMax: 35,
    aimMax: 25,
    start: VC_DE.pose,
    variants: ['german'],
    micTypeIds: ['arrCard'],
    tendency: 'More of the cellos’ line and bow detail; a local view that can pull them forward of the orchestra if it is too loud.',
    checks: ['Bow noise and the low notes', 'Front-desk bias', 'Under the main pair, in mono'],
    prov: ill('approached from the front and above: the lab’s cone'),
  }),
];

export const E14_MODEL = ensembleModel({
  id: 'e14-orchestra',
  name: 'full orchestra on its stage',
  variants: [
    { id: 'american', label: AM.label, short: 'Together', blurb: AM.blurb, seating: AM },
    { id: 'german', label: DE.label, short: 'Facing', blurb: DE.blurb, seating: DE },
  ],
  extraSurfaces: E14_SURFACES,
});

/** A side-fill monitor at the front right, facing back toward the players
 *  (live, with a soloist or a choir): a drawing default. */
export const E14_WEDGES: Wedge[] = [
  { id: 'fill', label: 'the side-fill monitor at the front right', short: 'SIDE-FILL', p: v3(3600, 0, 2600), lift: 380, faces: unit(v3(-0.35, 0, -1)), note: 'A monitor facing the players from the front right: the support mic’s rejection can be turned toward it.', prov: ill('a typical side-fill position: a drawing default') },
  { id: 'paL', label: 'the PA loudspeaker at the front left', short: 'PA LEFT', p: v3(-5600, 0, 3300), lift: 3000, faces: v3(0, 0, 1), glyph: 'none', note: 'High at the front left, facing the hall: farther off the support’s axis, and the hall’s system — level and routing do the rest.', prov: ill('a typical PA position: a drawing default') },
];

/* ── STARTING SETUPS (drawn whole on the stage) ── */
const BOOM = { kind: 'boom' as const, reach: 1500 };
const mainRig = (id: 'ab' | 'ortf' | 'xy' | 'ms', params = {}) => ({ id, params, place: { c: MAIN_C, face: 0, tilt: 25 }, mount: BOOM });
const OUT_PARAMS = { outriggers: true, outSpan: OUTRIGGERS.span, outU: OUT_U, outTilt: 40 };

export const E14_SETUPS: EnsembleSetup[] = [
  {
    id: 'ab',
    role: 'MAIN PAIR · SPACED',
    title: 'A spaced omni pair over the podium',
    rig: mainRig('ab', { spacing: 500 }),
    mics: 'Two omni small condensers, 50 cm (20 in) apart on one bar, on a tall boom stand behind the podium.',
    start: 'Above or just behind the podium, about 3–4 m (10–13 ft) up; 40–60 cm apart to start.',
    line: 'A broad view of the orchestra and the hall. Wide spacing can thin the middle — compare spacings and heights, and check mono.',
    core: true,
    view: 'section',
  },
  {
    id: 'ortf',
    role: 'MAIN PAIR · NEAR-COINCIDENT',
    title: 'A 17 cm, 110° cardioid pair over the podium',
    rig: mainRig('ortf'),
    mics: 'Two cardioid small condensers on one bar: 17 cm (6.7 in) apart, 110° between them — a fixed geometry.',
    start: 'The same place: above or just behind the podium, about 3–4 m up, its 95° recording angle taking in the orchestra’s width.',
    line: 'Width from time and level, with less of the hall behind than omnis. Check the edges and the low end at that distance, and mono.',
    core: true,
    view: 'plan',
  },
  {
    id: 'tree',
    role: 'MAIN ARRAY · THREE-OMNI TREE',
    title: 'A three-omni tree over the podium',
    rig: { id: 'tree', params: { turn: 0 }, place: { c: TREE_C, face: 0, tilt: 25 }, mount: { kind: 'boom', reach: 1600 } },
    mics: 'Three omni small condensers on a T-bar: left and right 2 m (6.6 ft) apart, the centre 1.5 m (4.9 ft) ahead of them.',
    start: 'About 3–4 m up over the podium, the centre mic near the front desks; the centre fed into both sides a few dB down.',
    line: 'A broad, stable picture with a filled-in middle. It needs a safe mount and careful centre balance — its name alone does not make it work.',
    core: true,
    view: 'plan',
  },
  {
    id: 'treeOut',
    role: 'MAIN ARRAY · TREE + OUTRIGGERS',
    title: 'The tree with two outriggers',
    rig: { id: 'tree', params: { turn: 0, ...OUT_PARAMS }, place: { c: TREE_C, face: 0, tilt: 25 }, mount: { kind: 'boom', reach: 1600 } },
    mics: 'The three-omni tree, plus an omni on its own tall stand at each side, about 6.1 m (20 ft) apart.',
    start: 'The outriggers at the tree’s height, about 1.5 m (5 ft) in front of the outer strings, looking down into them — panned to the sides. Add them one at a time.',
    line: 'More of the wide strings at the edges. They are extra perspectives, not left and right string mics: check the centre, the low end and mono as each one comes up.',
    core: true,
    view: 'plan',
  },
  {
    id: 'supWW',
    role: 'SECTION SUPPORT',
    title: 'The main pair and a support over the woodwinds',
    rig: mainRig('ab', { spacing: 500 }),
    singles: [{ key: 'ww', p: WW.pose.p, aim: unit(sub(WW.target, WW.pose.p)), pattern: 'cardioid', label: 'WOODWIND SUPPORT' }],
    mics: 'The spaced pair, plus one cardioid small condenser on a tall stand between the string desks.',
    start: 'The support about 1–1.5 m (3–5 ft) from the flutes and oboes, above and in front, aimed across all four players. Brought up from silence under the main pair.',
    line: 'Detail for a named need, such as a woodwind line lost in the pair. It hears them earlier than the main pair — judge the sum, in mono.',
    core: true,
    view: 'section',
  },
  {
    id: 'xy',
    role: 'MAIN PAIR · COINCIDENT',
    title: 'A coincident X/Y pair over the podium',
    rig: mainRig('xy', { angle: 90 }),
    mics: 'Two cardioid small condensers, capsules together one above the other, 90° apart to start.',
    start: 'The same place over the podium; try 90°, then wider (up to 135°) if the image is too narrow.',
    line: 'A compact, stable image and a dependable mono sum; it can sound less spacious than a well-chosen spaced pair.',
    core: false,
    view: 'plan',
  },
  {
    id: 'ms',
    role: 'MAIN PAIR · MID-SIDE',
    title: 'A Mid-Side pair over the podium',
    rig: mainRig('ms'),
    mics: 'A forward cardioid (Mid) with a sideways figure-8 (Side) just above it.',
    start: 'The same place over the podium; set the width later in the matrix: Left = Mid + Side, Right = Mid − Side.',
    line: 'Width you can change after the concert; the mono sum is the Mid. Check the matrix and the Side’s polarity.',
    core: false,
    view: 'plan',
  },
  {
    id: 'treeSmall',
    role: 'MAIN ARRAY · SMALLER TREE',
    title: 'A smaller three-omni tree over the podium',
    rig: { id: 'treeCompact', params: { turn: 0 }, place: { c: TREE_C, face: 0, tilt: 25 }, mount: { kind: 'boom', reach: 1600 } },
    mics: 'Three omni small condensers on a smaller T-bar: left and right about 1.5 m (5 ft) apart, the centre about 0.75 m (2.5 ft) ahead.',
    start: 'The same place as the larger tree: over the podium, about 3.2 m (10.5 ft) up, the centre fed into both sides a few dB down.',
    line: 'The capsules sit closer than 1.5 m to each other, so the three hear more alike: compare its width and centre with the 2 m tree at matched level.',
    core: false,
    view: 'plan',
  },
  {
    id: 'supVcA',
    role: 'SECTION SUPPORT',
    title: 'A support over the front cellos',
    variants: ['american'],
    rig: mainRig('ab', { spacing: 500 }),
    singles: [{ key: 'vc', p: VC_AM.pose.p, aim: unit(sub(VC_AM.target, VC_AM.pose.p)), pattern: 'cardioid', label: 'CELLO SUPPORT' }],
    mics: 'The spaced pair, plus one cardioid small condenser on a boom stand outside the cellos.',
    start: 'About 1–1.5 m (3–5 ft) from the front cellos, above and to the outside, aimed across four players.',
    line: 'More of the cellos’ line and bow; too much pulls them forward of the orchestra.',
    core: false,
    view: 'plan',
  },
  {
    id: 'supVcD',
    role: 'SECTION SUPPORT',
    title: 'A support over the front cellos',
    variants: ['german'],
    rig: mainRig('ab', { spacing: 500 }),
    singles: [{ key: 'vc', p: VC_DE.pose.p, aim: unit(sub(VC_DE.target, VC_DE.pose.p)), pattern: 'cardioid', label: 'CELLO SUPPORT' }],
    mics: 'The spaced pair, plus one cardioid small condenser on a boom stand in front of the cellos.',
    start: 'About 1–1.5 m (3–5 ft) from the front cellos, above and in front, aimed across four players — clear of the conductor.',
    line: 'More of the cellos’ line and bow; too much pulls them forward of the orchestra.',
    core: false,
    view: 'plan',
  },
];

/* ── the Placement Studio's starting points for the array's centre ── */
export const E14_PLACE: PlaceZone[] = [
  {
    id: 'pz.over',
    label: 'Over the podium, 3–4 m up',
    band: 'Above the conductor’s podium, about 3–4 m (10–13 ft) up.',
    box: { min: v3(-900, -4000, P.c.z - P.d / 2), max: v3(900, -3000, P.c.z + P.d / 2) },
    tendency: 'Closer to the front desks: more direct sound and detail, with the strings forward.',
  },
  {
    id: 'pz.behind',
    label: 'Just behind the podium, 3–4 m up',
    band: 'Right behind the conductor, about 3–4 m (10–13 ft) up.',
    box: { min: v3(-900, -4000, P.c.z + P.d / 2), max: v3(900, -3000, P.c.z + P.d / 2 + 1200) },
    tendency: 'A little farther back: more blend between the rows and more of the hall.',
  },
];
