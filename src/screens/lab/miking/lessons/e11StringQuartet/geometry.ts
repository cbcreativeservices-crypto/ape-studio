/**
 * E11 STRING QUARTETS AND LARGER STRING SECTIONS — where things are, frame
 * S. Research: docs/labs/miking/string_section/ (SOURCES.md, GEOMETRY_
 * PROPOSAL.md), the array register full_orchestra/SOURCES.md §A and the
 * bowed family (Lab 4: C09a–c); corrections E11-*.
 *
 *   QUARTET    on an arc 1.3 m round a point 1 m in front, 1st violin to the
 *              left (cello on the right, or the viola there: the variants —
 *              the order is a drawing default, OWNER REVIEW)
 *   MAIN       1–2 m in front and 1.8–2.5 m up (the lesson's trial; the
 *              height agrees with one maker's solo-violin height)
 *   SPOTS      the cello from its own lesson's farther start (0.6–1.2 m in
 *              front, C09c); four close stand mics from the violin and cello
 *              lessons' closer starts (25–35 cm, C09a / C09c)
 *   SECTIONS   the strings of the orchestra (American seating): the main pair
 *              over or just behind the podium 3–4 m up (DPA-AB-ORCH); section
 *              supports 1–1.5 m from three or four players (DPA-MULTI)
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { add, aimOf, mul, planDir, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { frontAt, seatingOf, seatsOf, soundPoint, type Seating } from '../shared/ensemble/seating.ts';
import { MAIN_HEIGHT, OUTRIGGERS } from '../shared/ensemble/stereoArray.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews, supportPose, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E11_SEATS = { quartet: seatingOf('quartet.arc'), quartetVa: seatingOf('quartet.arcVa'), sections: seatingOf('strings.american') } as const;
const Q = E11_SEATS.quartet;
const QV = E11_SEATS.quartetVa;
const S = E11_SEATS.sections;
const P = S.podium!;
const toward = (from: Vec3, to: Vec3): MicPose => ({ p: from, ...aimOf(sub(to, from)) });

/* ── the quartet ── */
export const Q_C = v3(0, -2100, 1500);
const Q_MID = v3(0, -900, 0);
/** A spot in front of a seat's instrument, `d` mm out along its facing and `up` (unit mix). */
function spotFor(s: Seating, sec: string, d: number, fwdK: number, upK: number): { pose: MicPose; target: Vec3; dir: Vec3 } {
  const seat = seatsOf(s, sec)[0];
  const T = soundPoint(seat);
  const dir = unit(add(mul(planDir(seat.face), fwdK), v3(0, -upK, 0)));
  return { pose: toward(add(T, mul(dir, d)), T), target: T, dir };
}
export const VC_Q = spotFor(Q, 'vc', 900, 0.89, 0.45);
export const VC_QV = spotFor(QV, 'vc', 900, 0.89, 0.45);

/* ── the string sections ── */
export const S_C = v3(0, -MAIN_HEIGHT.def, P.c.z + 200);
export const S_TREE = v3(0, -MAIN_HEIGHT.def, P.c.z);
export const S_OUT_U = S_TREE.z - (frontAt(S, OUTRIGGERS.span / 2) + OUTRIGGERS.front);
export const S_VA = supportPose(S, 'va', { r: 1250, lift: 55, toward: v3(2600, 0, 2600) });
export const S_CB = supportPose(S, 'cb', { r: 1250, lift: 50, toward: v3(4800, 0, 2600) });

export const E11_SURFACES = [
  targetSurface('t.vcQ', sectionPartId('quartet', 'vc'), 'the cello', VC_Q.target, VC_Q.dir),
  targetSurface('t.vcQV', sectionPartId('quartetVa', 'vc'), 'the cello', VC_QV.target, VC_QV.dir),
  targetSurface('t.va', sectionPartId('sections', 'va'), 'the front violas', S_VA.target, S_VA.approach),
];
const surf = (id: string) => E11_SURFACES.find((s) => s.id === id)!;
const PAIR_TYPES = ['arrCard', 'arrOmni', 'arrFig8'];
const cello = (id: string, variant: string, s: ReturnType<typeof spotFor>, sid: string): DocumentedZone =>
  targetZone({
    id,
    label: 'A spot on the cello',
    band: 'For a line that needs support: about 0.6–1.2 m (2–4 ft) in front of the cello, a little above, aimed at it — muted first, then brought up under the pair.',
    src: 'DPA-CELLO',
    quote: 'the cello lesson’s farther starting point: about 0.6–1.2 m in front, aimed at the cello (C09c)',
    kind: 'trial',
    surface: surf(sid),
    side: v3(0, 1, 0),
    d: [600, 1200],
    coneMax: 35,
    aimMax: 25,
    start: s.pose,
    variants: [variant],
    micTypeIds: ['arrCard'],
    tendency: 'The cello’s line and low notes clearer; close placement adds proximity and local resonances — check bow noise before any EQ.',
    checks: ['Muted, quietly supporting, then too much', 'Bow noise and the low notes', 'Mono with the pair'],
    prov: ill('in front and above: the lab’s cone'),
  });

export const E11_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'q.main',
    label: 'In front of the quartet, above it',
    band: 'Try the pair about 1–2 m (3–6.5 ft) in front of the quartet and 1.8–2.5 m (6–8 ft) above the floor, with a view across all four — a trial to start from, then change height and distance separately.',
    kind: 'trial',
    src: 'LESSON-QUARTET',
    quote: 'approximately 1–2 m in front and 1.8–2.5 m above the floor (the lesson’s trial, L9); AKG-C414 solo violin "from a height of 6 to 8 feet (1.8 to 2.5 m)"',
    ref: 'front',
    d: [1000, 2000],
    box: { min: v3(-700, -2500, 1000), max: v3(700, -1800, 2000) },
    start: toward(Q_C, Q_MID),
    variants: ['quartet', 'quartetVa'],
    micTypeIds: PAIR_TYPES,
    tendency: 'The quartet blended with the room. Closer favours the front players and adds direct sound; farther back, more room and less clarity.',
    checks: ['Cello definition and the inner voices', 'First-violin dominance', 'Room decay and mono'],
  }),
  cello('q.vc', 'quartet', VC_Q, 't.vcQ'),
  cello('q.vc2', 'quartetVa', VC_QV, 't.vcQV'),
  mainZone({
    id: 's.main',
    label: 'Above or just behind the podium',
    band: 'For larger sections: the main pair above or just behind the podium, about 3–4 m (10–13 ft) up, 40–60 cm apart to start.',
    kind: 'sourced',
    src: 'DPA-AB-ORCH',
    quote: 'above or right behind the conductor’s podium at a height of between three and four meters',
    ref: 'floor',
    d: [3000, 4000],
    box: { min: v3(-900, -4000, P.c.z - 450), max: v3(900, -3000, P.c.z + 1500) },
    start: toward(S_C, v3(0, -1050, -1800)),
    variants: ['sections'],
    micTypeIds: PAIR_TYPES,
    tendency: 'The whole string section and the room as one picture; the support mics add sections, not desks.',
    checks: ['Every section, quiet and loud', 'Front-to-back balance', 'The mono sum'],
  }),
  targetZone({
    id: 's.va',
    label: 'A support over the front violas',
    band: 'A cardioid about 1–1.5 m (3–5 ft) from the front violas, above and in front, aimed across three or four players.',
    src: 'DPA-MULTI',
    quote: 'directional microphones around 1 to 1.5 meters from the players, covering approximately three or four musicians (the orchestral example)',
    kind: 'sourced',
    surface: surf('t.va'),
    side: v3(0, 0, 1),
    d: [1000, 1500],
    coneMax: 35,
    aimMax: 25,
    start: S_VA.pose,
    variants: ['sections'],
    micTypeIds: ['arrCard'],
    tendency: 'An inner voice the pair loses, brought forward — too much and the violas jump out of the section.',
    checks: ['Under the pair, from silence', 'Front-to-back balance in the section', 'Mono'],
    prov: ill('approached from the front right and above: the lab’s cone'),
  }),
];

const views = stageViews([Q, QV, S]);
export const E11_MODEL = ensembleModel({
  id: 'e11-strings',
  name: 'string quartet and string sections',
  variants: [
    { id: 'quartet', label: Q.label, short: 'Cello R', blurb: Q.blurb, seating: Q },
    { id: 'quartetVa', label: QV.label, short: 'Viola R', blurb: QV.blurb, seating: QV },
    { id: 'sections', label: 'Larger string sections', short: 'Sections', blurb: 'The strings of an orchestra with their conductor: 1st and 2nd violins, violas, cellos and basses.', seating: S },
  ],
  views,
  viewsByVariant: { quartet: stageViews([Q], { zMax: 2600, hMax: 2900 }), quartetVa: stageViews([QV], { zMax: 2600, hMax: 2900 }), sections: stageViews([S]) },
  extraSurfaces: E11_SURFACES,
});

export const E11_WEDGES: Wedge[] = [
  { id: 'mon', label: 'a floor monitor in front of the quartet', short: 'MONITOR', p: v3(-300, 0, 1900), lift: 300, faces: unit(v3(0.25, 0, -1)), note: 'A floor monitor facing the players: the cello spot’s rejection can be turned toward it.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS ── */
const qRig = (id: 'xy' | 'ortf' | 'ab' | 'ms', params = {}) => ({ id, params, place: { c: Q_C, face: 0, tilt: 35 }, mount: { kind: 'stand' as const } });
const sRig = (id: 'ab' | 'ortf', params = {}) => ({ id, params, place: { c: S_C, face: 0, tilt: 25 }, mount: { kind: 'boom' as const, reach: 1500 } });
const one = (key: string, pose: MicPose, target: Vec3, label: string) => ({ key, p: pose.p, aim: unit(sub(target, pose.p)), pattern: 'cardioid' as const, label });
const QS = ['quartet', 'quartetVa'] as const;
/** Four close stand mics (production control / a loud stage): the violin family 25–35 cm in front of the bow's contact (C09a), the cello 25–35 cm in front of the bridge (C09c). */
function closeMics(s: Seating) {
  return s.seats.map((q) => {
    const T = soundPoint(q);
    const dir = unit(add(mul(planDir(q.face), q.kind === 'cello' ? 0.92 : 0.7), v3(0, q.kind === 'cello' ? -0.38 : -0.7, 0)));
    const pose = toward(add(T, mul(dir, 300)), T);
    return one(q.id, pose, T, q.kind.toUpperCase());
  });
}
const OUT = { outriggers: true, outSpan: OUTRIGGERS.span, outU: S_OUT_U, outTilt: 40 };

export const E11_SETUPS: EnsembleSetup[] = [
  { id: 'xy', role: 'MAIN PAIR · COINCIDENT', title: 'An X/Y pair in front of the quartet', variants: QS, rig: qRig('xy', { angle: 90 }), mics: 'Two matched cardioid small condensers, capsules together, 90° apart, on one tall stand.', start: 'About 1–2 m (3–6.5 ft) in front and 1.8–2.5 m (6–8 ft) up, with a view across all four; 90° to start.', line: 'A clear image with little time difference between the sides; check the width, the players at the edges and the room.', core: true, view: 'section' },
  { id: 'ortf', role: 'MAIN PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair in front of the quartet', variants: QS, rig: qRig('ortf'), mics: 'Two cardioid small condensers: 17 cm (6.7 in) apart, 110° between them — a fixed geometry.', start: 'The same place; move the whole pair to cover the group, never its spacing.', line: 'Level and time cues for width. Check the mono sum and that all four sit inside its recording angle.', core: true, view: 'plan' },
  { id: 'ab', role: 'MAIN PAIR · SPACED', title: 'A spaced omni pair in front of the quartet', variants: QS, rig: qRig('ab', { spacing: 500 }), mics: 'Two omni small condensers, 50 cm (20 in) apart on one bar.', start: 'The same place, for comparison: 40–60 cm is one starting range, not a rule for a quartet.', line: 'Room depth and spaciousness; check the centre, the time differences and the cello’s low notes in mono.', core: true, view: 'front' },
  { id: 'spot', role: 'MAIN PAIR + ONE SUPPORT', title: 'The pair and a spot on the cello', variants: ['quartet'], rig: qRig('xy', { angle: 90 }), singles: [one('vc', VC_Q.pose, VC_Q.target, 'CELLO SPOT')], mics: 'The X/Y pair, plus a cardioid on its own stand for the cello.', start: 'The spot about 0.6–1.2 m (2–4 ft) in front of the cello, a little above; muted first, then raised until the line is clearer.', line: 'A line supported without pulling it out of the quartet; pan it where the pair places the cello.', core: true, view: 'plan' },
  { id: 'spot2', role: 'MAIN PAIR + ONE SUPPORT', title: 'The pair and a spot on the cello', variants: ['quartetVa'], rig: qRig('xy', { angle: 90 }), singles: [one('vc', VC_QV.pose, VC_QV.target, 'CELLO SPOT')], mics: 'The X/Y pair, plus a cardioid on its own stand for the cello.', start: 'The spot about 0.6–1.2 m (2–4 ft) in front of the cello, a little above; muted first, then raised until the line is clearer.', line: 'A line supported without pulling it out of the quartet; pan it where the pair places the cello.', core: true, view: 'plan' },
  { id: 'ms', role: 'MAIN PAIR · MID-SIDE', title: 'A Mid-Side pair in front of the quartet', variants: QS, rig: qRig('ms'), mics: 'A forward cardioid (Mid) with a sideways figure-8 (Side) just above it.', start: 'The same place; Left = Mid + Side, Right = Mid − Side, the width set after decoding.', line: 'Adjustable width; check the matrix, the polarity and the room it hears behind.', core: false, view: 'plan' },
  { id: 'close', role: 'FOUR CLOSE MICS', title: 'A close mic on each player', variants: ['quartet'], singles: closeMics(Q), mics: 'Four cardioid small condensers, one on its own stand for each player.', start: 'About 25–35 cm (10–14 in) in front of each instrument — the violins and viola above and in front, outside the bow’s path; the cello in front of the bridge.', line: 'Control for overdubs or a loud band stage; more bow and local detail, more overlap between the tracks. Keep the pair as an option.', core: false, view: 'plan' },
  { id: 'sab', role: 'MAIN PAIR · SPACED', title: 'A spaced omni pair over the podium', variants: ['sections'], rig: sRig('ab', { spacing: 500 }), mics: 'Two omni small condensers, 50 cm (20 in) apart, on a tall boom stand behind the podium.', start: 'Above or just behind the podium, about 3–4 m (10–13 ft) up.', line: 'The whole section with the room; supports cover sections, not every desk.', core: true, view: 'section' },
  { id: 'sortf', role: 'MAIN PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair over the podium', variants: ['sections'], rig: sRig('ortf'), mics: 'Two cardioid small condensers: 17 cm (6.7 in) apart, 110° between them.', start: 'The same place; its 95° recording angle taking in the sections’ width.', line: 'A tighter image of the sections with less of the room than omnis.', core: true, view: 'plan' },
  { id: 'sva', role: 'MAIN PAIR + SECTION SUPPORT', title: 'The pair and a support over the violas', variants: ['sections'], rig: sRig('ab', { spacing: 500 }), singles: [one('va', S_VA.pose, S_VA.target, 'VIOLA SUPPORT')], mics: 'The spaced pair, plus a cardioid on a boom stand at the front right.', start: 'About 1–1.5 m (3–5 ft) from the front violas, aimed across three or four players; raised from silence.', line: 'An inner voice brought forward; reassess after any seating or stand change.', core: true, view: 'plan' },
  { id: 'scb', role: 'MAIN PAIR + SECTION SUPPORT', title: 'The pair and a support for the basses', variants: ['sections'], rig: sRig('ab', { spacing: 500 }), singles: [one('cb', S_CB.pose, S_CB.target, 'BASS SUPPORT')], mics: 'The spaced pair, plus a cardioid on a boom stand outside the basses.', start: 'About 1–1.5 m (3–5 ft) from the basses, aimed across them — first check whether the pair already carries their weight.', line: 'Articulation for the basses where the pair lacks it; their low weight may already be there.', core: true, view: 'plan' },
  { id: 'stree', role: 'MAIN ARRAY · TREE + OUTRIGGERS', title: 'A tree and outriggers over the sections', variants: ['sections'], rig: { id: 'tree', params: { turn: 0, ...OUT }, place: { c: S_TREE, face: 0, tilt: 25 }, mount: { kind: 'boom', reach: 1600 } }, mics: 'Three omnis on a T-bar over the podium, plus an omni on its own stand at each side.', start: 'An advanced extension for a large scoring stage: more channels and carefully tested coverage — not a quartet pair enlarged.', line: 'A broad picture with the outer desks; check the centre, the low end and mono as each mic comes up.', core: false, view: 'plan' },
];

export const E11_PLACE: PlaceZone[] = [
  { id: 'pz.qnear', label: 'Nearer: 1–1.5 m in front', band: 'About 1–1.5 m (3–5 ft) in front of the quartet, 1.8–2.5 m (6–8 ft) up.', box: { min: v3(-700, -2500, 1000), max: v3(700, -1800, 1500) }, variants: QS, tendency: 'More direct sound and definition; the front players are favoured.' },
  { id: 'pz.qfar', label: 'Farther: 1.5–2 m in front', band: 'About 1.5–2 m (5–6.5 ft) in front, 1.8–2.5 m (6–8 ft) up.', box: { min: v3(-700, -2500, 1500), max: v3(700, -1800, 2000) }, variants: QS, tendency: 'More of the room and the blend; less clarity if the room is live.' },
  { id: 'pz.over', label: 'Over the podium, 3–4 m up', band: 'Above the conductor’s podium, about 3–4 m (10–13 ft) up.', box: { min: v3(-900, -4000, P.c.z - P.d / 2), max: v3(900, -3000, P.c.z + P.d / 2) }, variants: ['sections'], tendency: 'Closer to the front desks: more direct sound.' },
  { id: 'pz.behind', label: 'Just behind the podium, 3–4 m up', band: 'Right behind the conductor, about 3–4 m (10–13 ft) up.', box: { min: v3(-900, -4000, P.c.z + P.d / 2), max: v3(900, -3000, P.c.z + P.d / 2 + 1200) }, variants: ['sections'], tendency: 'More blend between the desks and more of the room.' },
];
