/**
 * E13 MIXED CLASSICAL ENSEMBLES — where things are, frame S. Research:
 * docs/labs/miking/mixed_classical_ensemble/ (SOURCES.md, GEOMETRY_PROPOSAL.md)
 * and the array register full_orchestra/SOURCES.md §A; corrections E13-*.
 *
 *   CHAMBER    a mixed group about 3.5 m wide (strings, flute, clarinet,
 *              horn, grand piano; no conductor) — a drawing default. Its main
 *              array 1.5–3 m in front, 2–2.5 m up (the lesson's suggested
 *              trial), on a tall stand
 *   ORCHESTRA  the shared orchestra (American seating): the main pair over or
 *              just behind the podium 3–4 m up (DPA-AB-ORCH); the tree and
 *              its outriggers (SCH-SURR; practice)
 *   SUPPORTS   1–1.5 m from three or four players (DPA-MULTI); the cello as a
 *              featured part, from the cello lesson's farther starting point
 *              (0.6–1.2 m in front, C09c)
 */
import type { DocumentedZone, MicPose, Provenance, Wedge } from '../../engine/model/types.ts';
import { aimOf, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { frontAt, seatingOf, seatsOf, soundPoint } from '../shared/ensemble/seating.ts';
import { MAIN_HEIGHT, OUTRIGGERS } from '../shared/ensemble/stereoArray.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews, supportPose, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E13_SEATS = { chamber: seatingOf('chamber.mixed'), orchestra: seatingOf('orch.american') } as const;
const CH = E13_SEATS.chamber;
const OR = E13_SEATS.orchestra;
const P = OR.podium!;
const toward = (from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }): MicPose => ({ p: from, ...aimOf(sub(to, from)) });

/* ── the chamber group ── */
/** The chamber pair: 2.2 m in front of the front players, 2.2 m up (inside 1.5–3 m and 2–2.5 m). */
export const CH_C = v3(0, -2200, 2200);
const CH_MID = v3(0, -950, -800);
/** A support across the flute, clarinet and horn, approached from the left (its stand clear of the strings). */
export const CH_WINDS = supportPose(CH, ['fl', 'cl', 'hn'], { r: 1250, lift: 52, toward: v3(-3200, 0, -1100) });
/** A featured cello: from in front and above, 0.6–1.2 m out (the cello lesson's farther start). */
const VC = soundPoint(seatsOf(CH, 'vc')[0]);
const VC_DIR = unit(v3(0.05, -0.45, 0.89));
export const CH_VC: MicPose = toward(v3(VC.x + VC_DIR.x * 900, VC.y + VC_DIR.y * 900, VC.z + VC_DIR.z * 900), VC);

/* ── the orchestra ── */
export const OR_C = v3(0, -MAIN_HEIGHT.def, P.c.z + 200);
export const OR_TREE = v3(0, -MAIN_HEIGHT.def, P.c.z);
export const OR_OUT_U = OR_TREE.z - (frontAt(OR, OUTRIGGERS.span / 2) + OUTRIGGERS.front);
export const OR_WW = supportPose(OR, ['fl', 'ob'], { r: 1250, lift: 50 });

export const E13_SURFACES = [
  targetSurface('t.winds', sectionPartId('chamber', 'fl'), 'the flute, clarinet and horn', CH_WINDS.target, CH_WINDS.approach),
  targetSurface('t.vc', sectionPartId('chamber', 'vc'), 'the cello', VC, VC_DIR),
  targetSurface('t.ww', sectionPartId('orchestra', 'fl'), 'the front-row woodwinds', OR_WW.target, OR_WW.approach),
];
const surf = (id: string) => E13_SURFACES.find((s) => s.id === id)!;
const PAIR_TYPES = ['arrCard', 'arrOmni', 'arrFig8'];

export const E13_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'ch.main',
    label: 'In front of the group, a little above',
    band: 'For a group about 3–4 m wide, try the pair about 1.5–3 m (5–10 ft) in front and 2–2.5 m (6.5–8 ft) up, on a tall stand — a place to start, then change one thing at a time.',
    kind: 'trial',
    src: 'LESSON-MIXED',
    quote: 'for a group about 3–4 m wide, audition the array roughly 1.5–3 m in front and 2–2.5 m above the floor (the lesson’s suggested trial, L36)',
    ref: 'front',
    d: [1500, 3000],
    box: { min: v3(-900, -2500, 1500), max: v3(900, -2000, 3000) },
    start: toward(CH_C, CH_MID),
    variants: ['chamber'],
    micTypeIds: PAIR_TYPES,
    tendency: 'The whole group blended with the room. Closer tends to favour the front players; farther back, more blend and more room.',
    checks: ['Every player, quiet and loud', 'The edges and the centre', 'The mono sum'],
  }),
  targetZone({
    id: 'ch.sup',
    label: 'A support across the winds and horn',
    band: 'A cardioid about 1–1.5 m (3–5 ft) from the flute, clarinet and horn, from the side and above, aimed across all three.',
    src: 'DPA-MULTI',
    quote: 'directional microphones around 1 to 1.5 meters from the players, covering approximately three or four musicians (the orchestral example)',
    kind: 'sourced',
    surface: surf('t.winds'),
    side: v3(0, 0, 1),
    d: [1000, 1500],
    coneMax: 35,
    aimMax: 25,
    start: CH_WINDS.pose,
    variants: ['chamber'],
    micTypeIds: ['arrCard'],
    tendency: 'More of a wind line the pair loses behind the strings — and an earlier arrival than the pair, to judge in the sum.',
    checks: ['It alone, then under the pair', 'The strings and piano next to them', 'The image and the mono sum'],
    prov: ill('approached from the left, above: the lab’s cone'),
  }),
  targetZone({
    id: 'ch.spot',
    label: 'A spot on the featured cello',
    band: 'For a featured line: about 0.6–1.2 m (2–4 ft) in front of the cello, a little above, aimed at it — brought up under the pair.',
    src: 'DPA-CELLO',
    quote: 'the cello lesson’s farther starting point: about 0.6–1.2 m in front, aimed at the cello (C09c)',
    kind: 'trial',
    surface: surf('t.vc'),
    side: v3(1, 0, 0),
    d: [600, 1200],
    coneMax: 35,
    aimMax: 25,
    start: CH_VC,
    variants: ['chamber'],
    micTypeIds: ['arrCard'],
    tendency: 'The cello’s line clearer, closer and drier; too much and it detaches from the group.',
    checks: ['Muted, quietly supporting, then too much', 'The players beside it', 'Mono'],
    prov: ill('in front and above: the lab’s cone'),
  }),
  mainZone({
    id: 'orc.main',
    label: 'Above or just behind the podium',
    band: 'For an orchestra: the main pair above or just behind the podium, about 3–4 m (10–13 ft) up, 40–60 cm apart to start.',
    kind: 'sourced',
    src: 'DPA-AB-ORCH',
    quote: 'above or right behind the conductor’s podium at a height of between three and four meters',
    ref: 'floor',
    d: [3000, 4000],
    box: { min: v3(-900, -4000, P.c.z - 450), max: v3(900, -3000, P.c.z + 1500) },
    start: toward(OR_C, v3(0, -1100, -2400)),
    variants: ['orchestra'],
    micTypeIds: ['arrOmni', 'arrCard', 'arrFig8'],
    tendency: 'A broad view of the whole orchestra with the hall. Higher tends to hear more of the back rows and the room.',
    checks: ['Every section, quiet and loud', 'A stable centre', 'The mono sum'],
  }),
  targetZone({
    id: 'orc.sup',
    label: 'A support over the front woodwinds',
    band: 'A cardioid about 1–1.5 m (3–5 ft) from the flutes and oboes, above and in front, aimed across all four — on a tall stand between the string desks.',
    src: 'DPA-MULTI',
    quote: 'directional microphones around 1 to 1.5 meters from the players, covering approximately three or four musicians (the orchestral example)',
    kind: 'sourced',
    surface: surf('t.ww'),
    side: v3(1, 0, 0),
    d: [1000, 1500],
    coneMax: 35,
    aimMax: 25,
    start: OR_WW.pose,
    variants: ['orchestra'],
    micTypeIds: ['arrCard'],
    tendency: 'More detail from four players the main pair hears as part of the blend.',
    checks: ['It alone, then under the pair', 'The brass behind them', 'Mono'],
    prov: ill('approached from above and in front: the lab’s cone'),
  }),
];

const views = stageViews([CH, OR]);
export const E13_MODEL = ensembleModel({
  id: 'e13-mixed',
  name: 'mixed classical ensemble on its stage',
  variants: [
    { id: 'chamber', label: 'A chamber group', short: 'Chamber', blurb: CH.blurb, seating: CH },
    { id: 'orchestra', label: 'An orchestra', short: 'Orchestra', blurb: 'The chamber group’s methods at orchestra size: strings at the front, winds, brass and percussion behind, a conductor.', seating: OR },
  ],
  views,
  viewsByVariant: { chamber: stageViews([CH], { zMax: 3200, hMax: 3000 }), orchestra: stageViews([OR]) },
  extraSurfaces: E13_SURFACES,
});

export const E13_WEDGES: Wedge[] = [
  { id: 'mon', label: 'a floor monitor in front of the group', short: 'MONITOR', p: v3(1000, 0, 2000), lift: 300, faces: unit(v3(-0.2, 0, -1)), note: 'A floor monitor facing the players: the cello spot’s rejection can be turned toward it.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS ── */
const chRig = (id: 'xy' | 'ortf' | 'ab' | 'ms', params = {}) => ({ id, params, place: { c: CH_C, face: 0, tilt: 20 }, mount: { kind: 'stand' as const } });
const orRig = (id: 'ab', params = {}) => ({ id, params, place: { c: OR_C, face: 0, tilt: 25 }, mount: { kind: 'boom' as const, reach: 1500 } });
const single = (key: string, pose: MicPose, target: { x: number; y: number; z: number }, label: string) => ({ key, p: pose.p, aim: unit(sub(target, pose.p)), pattern: 'cardioid' as const, label });
const OUT = { outriggers: true, outSpan: OUTRIGGERS.span, outU: OR_OUT_U, outTilt: 40 };

export const E13_SETUPS: EnsembleSetup[] = [
  { id: 'xy', role: 'MAIN PAIR · COINCIDENT', title: 'An X/Y pair in front of the group', variants: ['chamber'], rig: chRig('xy', { angle: 90 }), mics: 'Two matched cardioid small condensers, capsules together, 90° apart, on one tall stand.', start: 'About 1.5–3 m (5–10 ft) in front and 2–2.5 m (6.5–8 ft) up; 90° to start, wider if the group sounds narrow.', line: 'A compact, stable image and a dependable mono sum; a narrower picture is not worse if it serves the music.', core: true, view: 'section' },
  { id: 'ortf', role: 'MAIN PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair in front of the group', variants: ['chamber'], rig: chRig('ortf'), mics: 'Two cardioid small condensers: 17 cm (6.7 in) apart, 110° between them — a fixed geometry.', start: 'The same place; move the whole pair to change its coverage, never its spacing.', line: 'Width from time and level. Check the players at the edges and the mono sum.', core: true, view: 'plan' },
  { id: 'ab', role: 'MAIN PAIR · SPACED', title: 'A spaced omni pair in front of the group', variants: ['chamber'], rig: chRig('ab', { spacing: 500 }), mics: 'Two omni small condensers, 50 cm (20 in) apart on one bar.', start: 'The same place; spacing, distance and height judged together.', line: 'More room and spaciousness; wide spacing can weaken the middle and change the tone in mono.', core: true, view: 'front' },
  { id: 'spot', role: 'MAIN PAIR + SOLOIST SPOT', title: 'The pair and a spot on the featured cello', variants: ['chamber'], rig: chRig('xy', { angle: 90 }), singles: [single('vc', CH_VC, VC, 'CELLO SPOT')], mics: 'The X/Y pair, plus a cardioid on its own stand for the cello.', start: 'The spot about 0.6–1.2 m (2–4 ft) in front of the cello, a little above; muted first, then raised until the line is clearer.', line: 'Supports a featured part; too much detaches it from the group. Pan it where the pair places the cello.', core: true, view: 'section' },
  { id: 'sup', role: 'MAIN PAIR + SECTION SUPPORT', title: 'The pair and a support across the winds', variants: ['chamber'], rig: chRig('xy', { angle: 90 }), singles: [single('w', CH_WINDS.pose, CH_WINDS.target, 'WIND SUPPORT')], mics: 'The X/Y pair, plus a cardioid on a boom stand at the side, across the flute, clarinet and horn.', start: 'About 1–1.5 m (3–5 ft) from the three players, from the side and above, aimed across them.', line: 'Clearer winds behind the strings; it hears them before the pair does — judge the sum, in mono.', core: false, view: 'plan' },
  { id: 'ms', role: 'MAIN PAIR · MID-SIDE', title: 'A Mid-Side pair in front of the group', variants: ['chamber'], rig: chRig('ms'), mics: 'A forward cardioid (Mid) with a sideways figure-8 (Side) just above it.', start: 'The same place; Left = Mid + Side, Right = Mid − Side, the width set in the matrix.', line: 'Width you can set later; the mono sum is the Mid. Keep the raw Mid and Side labelled.', core: false, view: 'plan' },
  { id: 'oab', role: 'MAIN PAIR · SPACED', title: 'A spaced omni pair over the podium', variants: ['orchestra'], rig: orRig('ab', { spacing: 500 }), mics: 'Two omni small condensers, 50 cm (20 in) apart, on a tall boom stand behind the podium.', start: 'Above or just behind the podium, about 3–4 m (10–13 ft) up; 40–60 cm apart to start.', line: 'A broad view of the orchestra and the hall; check the centre, the spacing and mono.', core: true, view: 'section' },
  { id: 'tree', role: 'MAIN ARRAY · THREE-OMNI TREE', title: 'A three-omni tree over the podium', variants: ['orchestra'], rig: { id: 'tree', params: { turn: 0 }, place: { c: OR_TREE, face: 0, tilt: 25 }, mount: { kind: 'boom', reach: 1600 } }, mics: 'Three omni small condensers on a T-bar: left and right 2 m (6.6 ft) apart, the centre 1.5 m (4.9 ft) ahead.', start: 'Over the podium, about 3–4 m up. Left to left, right to right, the centre into both, a few dB down — raised from silence until the middle fills.', line: 'A filled-in centre and a broad picture; the advanced extension of the pair, where the room, the mount and the channels allow.', core: true, view: 'plan' },
  { id: 'treeOut', role: 'MAIN ARRAY · TREE + OUTRIGGERS', title: 'The tree with two outriggers', variants: ['orchestra'], rig: { id: 'tree', params: { turn: 0, ...OUT }, place: { c: OR_TREE, face: 0, tilt: 25 }, mount: { kind: 'boom', reach: 1600 } }, mics: 'The tree, plus an omni on its own tall stand at each side, about 6.1 m (20 ft) apart.', start: 'At the tree’s height, about 1.5 m (5 ft) in front of the outer strings; added one at a time, panned for a coherent picture.', line: 'More of the width at the edges; check the centre, the low notes and mono as each one comes up.', core: true, view: 'front' },
  { id: 'osup', role: 'MAIN PAIR + SECTION SUPPORT', title: 'The pair and a support over the woodwinds', variants: ['orchestra'], rig: orRig('ab', { spacing: 500 }), singles: [single('ww', OR_WW.pose, OR_WW.target, 'WOODWIND SUPPORT')], mics: 'The spaced pair, plus one cardioid small condenser on a tall stand between the string desks.', start: 'About 1–1.5 m (3–5 ft) from the flutes and oboes, aimed across all four, raised from silence under the pair.', line: 'A named need met; the pair keeps the picture. Judge the sum, in mono.', core: true, view: 'section' },
];

export const E13_PLACE: PlaceZone[] = [
  { id: 'pz.near', label: 'Nearer: 1.5–2.25 m in front', band: 'About 1.5–2.25 m (5–7.5 ft) in front of the front players, 2–2.5 m (6.5–8 ft) up.', box: { min: v3(-900, -2500, 1500), max: v3(900, -2000, 2250) }, variants: ['chamber'], tendency: 'More direct sound and detail; the front players can dominate.' },
  { id: 'pz.far', label: 'Farther: 2.25–3 m in front', band: 'About 2.25–3 m (7.5–10 ft) in front, 2–2.5 m (6.5–8 ft) up.', box: { min: v3(-900, -2500, 2250), max: v3(900, -2000, 3000) }, variants: ['chamber'], tendency: 'More blend between front and back, and more of the room.' },
  { id: 'pz.over', label: 'Over the podium, 3–4 m up', band: 'Above the conductor’s podium, about 3–4 m (10–13 ft) up.', box: { min: v3(-900, -4000, P.c.z - P.d / 2), max: v3(900, -3000, P.c.z + P.d / 2) }, variants: ['orchestra'], tendency: 'Closer to the front desks: more direct sound, the strings forward.' },
  { id: 'pz.behind', label: 'Just behind the podium, 3–4 m up', band: 'Right behind the conductor, about 3–4 m (10–13 ft) up.', box: { min: v3(-900, -4000, P.c.z + P.d / 2), max: v3(900, -3000, P.c.z + P.d / 2 + 1200) }, variants: ['orchestra'], tendency: 'A little farther back: more blend and more of the hall.' },
];
