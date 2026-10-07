/**
 * E15 JAZZ COMBO — where things are, frame S, on the stage-plot presets
 * (shared/ensemble/bandStage.ts). Research: docs/labs/miking/jazz_combo/
 * (SOURCES.md, GEOMETRY_PROPOSAL.md: "Positions drawing defaults"); the
 * lesson has no numbers of its own.
 *
 *   QUARTET  piano, upright bass, drums, tenor sax on a club stage: the
 *            grand on the audience's left, its lid open toward them
 *   GUITAR   guitar, upright bass, drums, trumpet: the guitar amp TURNED
 *            AWAY FROM THE DRUMS — the one confirmed move in the research
 *            (a jazz session: "We faced the guitar amp away from the drums
 *            and miked it … facing the speaker")
 *
 * The main pair borrows the mixed-ensemble lesson's suggested trial (a
 * group 3–4 m across: 1.5–3 m in front, 2–2.5 m up — E13 ch.main), logged
 * as an owner-review default: the jazz lesson gives no distances. Every
 * close mic is the instrument lesson's own starting point, never re-derived:
 * the bass 15–30 cm in front just above the bridge (C06a ub.front), the
 * piano outside its curve (C11 gp.curve), the kit from one mic over its
 * middle (M09 oh.mono) or a spaced pair (M09 oh.ab), the closed kick from
 * outside (M01 out.edge), the sax above its bell (A05c ts.above), the
 * trumpet a little off its bell's axis (A01 tp.off), the guitar amp close to
 * its grille (C02 eg.close). The kit, the bass and the soloist stand in the
 * same place in both seatings, so the shared pages' mics sit on them.
 */
import type { DocumentedZone, MicPose, Provenance, Wedge } from '../../engine/model/types.ts';
import { aimOf, add, mul, planDir, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { seatingOf, seatsOf, soundPoint } from '../shared/ensemble/seating.ts';
import { ampOf, ampSpeaker, closeMic, kitKickFront, kitSnare, local, rightOf, type CloseMic } from '../shared/ensemble/bandStage.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';
import { KICK_ZONES } from '../m01Kick/model.ts';
import { M09_ZONES } from '../m09Overheads/model.ts';
import { BASS_PLUCK_ZONES } from '../c06aBassPlucked/model.ts';
import { PIANO_ZONES } from '../c11Piano/model.ts';
import { TENOR_ZONES } from '../a05cTenorSax/model.ts';
import { GUITAR_ZONES } from '../shared/speakers/ampZones.ts';
import { E13_ZONES } from '../e13MixedEnsemble/geometry.ts';
import { KIT } from '../shared/kitPlanModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const zoneOf = (list: readonly DocumentedZone[], id: string): DocumentedZone => {
  const z = list.find((q) => q.id === id);
  if (!z) throw new Error(`E15: borrowed zone ${id} missing`);
  return z;
};

/** The borrowed starting points (their distances and words are the source lessons'). */
export const E15_BORROWED = {
  main: zoneOf(E13_ZONES, 'ch.main'),
  bass: zoneOf(BASS_PLUCK_ZONES, 'ub.front'),
  piano: zoneOf(PIANO_ZONES, 'gp.curve'),
  ohMono: zoneOf(M09_ZONES, 'oh.mono'),
  oh: zoneOf(M09_ZONES, 'oh.ab.hat'),
  kick: zoneOf(KICK_ZONES, 'out.edge'),
  sax: zoneOf(TENOR_ZONES, 'ts.above'),
  amp: zoneOf(GUITAR_ZONES, 'eg.close'),
} as const;

export const E15_SEATS = { quartet: seatingOf('jazz.quartet'), guitar: seatingOf('jazz.guitar') } as const;
const QT = E15_SEATS.quartet;
const GT = E15_SEATS.guitar;
const DR = seatsOf(QT, 'drums')[0];
const UB = seatsOf(QT, 'ub')[0];
const SX = seatsOf(QT, 'sax')[0];
const TP = seatsOf(GT, 'tpt')[0];
const PN = seatsOf(QT, 'pno')[0];
const KF = kitKickFront(DR);
const SN = kitSnare(DR);
const KFWD = planDir(DR.face);

/* ── the main pair: in front of the group (E13's suggested trial) ── */
export const MAIN_C = v3(-400, -2200, 2000);
const GROUP_MID = v3(-400, -950, -1700);
export const MAIN_POSE: MicPose = { p: MAIN_C, ...aimOf(sub(GROUP_MID, MAIN_C)) };
const xyRig = { id: 'xy' as const, params: { angle: 90 }, place: { c: MAIN_C, face: 0, tilt: 20 }, mount: { kind: 'stand' as const } };
const ortfRig = { id: 'ortf' as const, params: {}, place: { c: MAIN_C, face: 0, tilt: 20 }, mount: { kind: 'stand' as const } };

/* ── the close mics (the same kit, bass and soloist spot in both seatings) ── */
/** The bass: 22 cm in front of the strings, a little above the bridge, aimed back at it (C06a ub.front 15–30 cm). */
const UB_BRIDGE = soundPoint(UB);
const UB_FROM = unit(add(planDir(UB.face), v3(0, -0.35, 0)));
export const BASS_MIC: CloseMic = closeMic({ key: 'ub', label: 'BASS', src: 'ub', own: UB_BRIDGE, from: UB_FROM, d: 220, typeId: 'sdcCard' });
/** One mic over the middle of the kit, about 30 cm above the drummer's head (M09 oh.mono), tilted a little toward the audience so its boom comes from behind. */
const KIT_MID = add(SN, mul(KFWD, 250));
const HEAD_TOP = 1300;
const MONO_P = add(v3(KIT_MID.x, -(HEAD_TOP + 300), KIT_MID.z), mul(KFWD, -120));
export const KIT_MONO: CloseMic = { key: 'ohMono', label: 'OVERHEAD', src: 'drums', own: KIT_MID, typeId: 'sdcCard', pattern: 'cardioid', p: MONO_P, aim: unit(sub(v3(KIT_MID.x, -700, KIT_MID.z), MONO_P)) };
/** The closed jazz kick from outside, toward the edge of its front head (M01 out.edge 2–15 cm): 8 cm out. */
const KICK_EDGE = add(add(KF.c, mul(rightOf(DR.face), -KIT.kick.R * 0.45)), v3(0, -KIT.kick.R * 0.25, 0));
export const KICK_MIC: CloseMic = closeMic({ key: 'kick', label: 'KICK', src: 'drums', own: KICK_EDGE, from: KFWD, d: 80, typeId: 'kickDynCard' });
/** The sax: 7.5 cm above the bell rim, aimed down across the body at the sound holes (A05c ts.above). */
const SAX_BELL = soundPoint(SX);
/** The lower stack's holes, beside the bell toward the player (BandArt's tenor). */
const SAX_HOLES = local(SX.p, SX.face, 225, 120, 800);
const SAX_AIM = v3((SAX_BELL.x + SAX_HOLES.x) / 2, (SAX_BELL.y + SAX_HOLES.y) / 2, (SAX_BELL.z + SAX_HOLES.z) / 2);
export const SAX_MIC: CloseMic = closeMic({ key: 'sax', label: 'SAX', src: 'sax', own: SAX_BELL, from: unit(add(v3(0, -1, 0), mul(planDir(SX.face), 0.45))), d: 75, typeId: 'saxDynCard', aimAt: SAX_AIM });
/** The trumpet: 40 cm from the bell, a little off its axis (A01 tp.off 30–50 cm). */
const TP_BELL = soundPoint(TP);
export const TRUMPET_MIC: CloseMic = closeMic({ key: 'tpt', label: 'TRUMPET', src: 'tpt', own: TP_BELL, from: unit(add(planDir(TP.face), mul(rightOf(TP.face), 0.27))), d: 400, typeId: 'instDynCard' });
/** The piano from outside its curved side, 60 cm out at the rim, facing in under the lid (C11 gp.curve 0.3–1 m). */
const PIANO_IN = local(PN.p, PN.face, 1350, 0, 850);
const PIANO_RIM = local(PN.p, PN.face, 1500, 700, 1000);
export const PIANO_MIC: CloseMic = closeMic({ key: 'pno', label: 'PIANO', src: 'pno', own: PIANO_RIM, from: rightOf(PN.face), d: 600, typeId: 'sdcCard', aimAt: PIANO_IN });
/** The guitar amp, turned away from the drums: 5 cm from the grille, facing the speaker (C02 eg.close). */
const G_AMP = ampOf(GT, 'jgtr')!;
export const AMP_MIC: CloseMic = closeMic({ key: 'amp', label: 'GUITAR AMP', src: 'jgtr', own: ampSpeaker(G_AMP), from: planDir(G_AMP.face), d: 50, typeId: 'instDynCard' });
/** The spaced overhead pair over the jazz kit (M09: each mic about 1.2 m from the snare, pointing down). */
export const OH_SPACING = 1200;
export const OH_C = v3(SN.x, SN.y - Math.sqrt(1219 ** 2 - (OH_SPACING / 2) ** 2), SN.z);
const ohRig = { id: 'ab' as const, params: { spacing: OH_SPACING }, place: { c: OH_C, face: (DR.face + 180) % 360, tilt: 90 }, mount: { kind: 'boom' as const, reach: 1250 } };

/* ── the model ── */
const views = stageViews([QT, GT], { zMax: 2800, hMax: 2700 });
export const E15_MODEL = ensembleModel({
  id: 'e15-jazz',
  name: 'jazz combo on its stage',
  variants: [
    { id: 'quartet', label: 'Piano, bass, drums and sax', short: 'Piano', blurb: QT.blurb, seating: QT },
    { id: 'guitar', label: 'Guitar, bass, drums and trumpet', short: 'Guitar', blurb: GT.blurb, seating: GT },
  ],
  views,
  extraSurfaces: [targetSurface('t.ub', sectionPartId('quartet', 'ub'), 'the bass’s bridge and top', UB_BRIDGE, UB_FROM)],
});
const surf = (id: string) => E15_MODEL.surfaces.find((s) => s.id === id)!;
const pose = (m: CloseMic): MicPose => ({ p: m.p, ...aimOf(m.aim) });
const BZ = E15_BORROWED.bass;
const MZ = E15_BORROWED.main;

export const E15_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'jz.main',
    label: 'In front of the group, a little above',
    band: 'For a small group, try the pair about 1.5–3 m (5–10 ft) in front and 2–2.5 m (6.5–8 ft) up, on a tall stand — a place to start, then change one thing at a time.',
    kind: MZ.kind,
    src: MZ.src,
    quote: `${MZ.quote} — borrowed from the mixed-ensemble lesson; the jazz lesson gives no distances`,
    ref: 'front',
    d: [1500, 3000],
    box: { min: v3(-1300, -2500, 1500), max: v3(500, -2000, 3000) },
    start: MAIN_POSE,
    micTypeIds: ['arrCard', 'arrOmni'],
    tendency: 'The whole group with the room. Closer tends to favour the front player; farther back, more blend and more room — and in a loud club, less gain before feedback.',
    checks: ['The soloist against the drums', 'The bass and the piano under the rest', 'The mono sum'],
  }),
  targetZone({
    id: 'jz.ub',
    label: 'In front of the bass, just above the bridge',
    band: BZ.band,
    src: BZ.src,
    quote: BZ.quote,
    kind: BZ.kind,
    surface: surf('t.ub'),
    side: v3(0, -1, 0),
    d: [BZ.distance.min, BZ.distance.max],
    coneMax: 35,
    aimMax: 20,
    start: pose(BASS_MIC),
    micTypeIds: ['sdcCard'],
    tendency: BZ.tendency,
    checks: BZ.checks,
    prov: ill('in front of the bass, a little above the bridge: the combo lesson’s drawing of the bass lesson’s zone'),
  }),
];

/* ── the bassist's wedge (the context page aims the bass mic's rejection at it) ── */
const ubWedge = QT.gear!.find((g) => g.id === 'mon.ub')!;
export const E15_WEDGES: Wedge[] = [
  { id: 'ub', label: 'the bassist’s floor wedge', short: 'WEDGE', p: v3(ubWedge.p.x, 0, ubWedge.p.z), lift: 250, faces: planDir(ubWedge.face), note: 'The bassist’s wedge on the floor about 1 m in front of them, facing back at them — behind the bass mic, below it.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS ── */
const both = ['quartet', 'guitar'];
export const E15_SETUPS: EnsembleSetup[] = [
  {
    id: 'pair',
    role: 'ONE MAIN PAIR',
    title: 'An X/Y pair in front of the group',
    variants: both,
    rig: xyRig,
    mics: 'Two matched cardioid small condensers, capsules together, 90° apart, on one tall stand.',
    start: 'About 1.5–3 m (5–10 ft) in front of the group and 2–2.5 m (6.5–8 ft) up, aimed at its middle.',
    line: 'The players’ own balance and the room, with a dependable mono sum. Where they stand sets the balance — a drummer or a horn can dominate, and live, the gain before feedback is limited.',
    roles: 'To the recording; to the PA only in an unusually quiet, controlled room — never the wedges.',
    core: true,
    view: 'plan',
  },
  {
    id: 'ortf',
    role: 'ONE MAIN PAIR · NEAR-COINCIDENT',
    title: 'A 17 cm, 110° pair in the same place',
    variants: both,
    rig: ortfRig,
    mics: 'Two cardioid small condensers, 17 cm (6.7 in) apart, 110° between them — a fixed geometry.',
    start: 'The same place as the X/Y pair; move the whole pair to change what it covers.',
    line: 'A wider image and more room blend; check the players at the edges and the mono sum.',
    core: false,
    view: 'plan',
  },
  {
    id: 'spots',
    role: 'MAIN PAIR + A FEW SUPPORTS',
    title: 'The pair, a bass spot and a piano view',
    variants: ['quartet'],
    rig: xyRig,
    singles: [BASS_MIC, PIANO_MIC],
    mics: 'The X/Y pair, a small condenser in front of the bass, another outside the piano’s curve.',
    start: 'The bass mic about 15–30 cm (6–12 in) in front, a little above the bridge; the piano mic about 30 cm–1 m outside the curved side, facing in under the lid.',
    line: 'The pair keeps the picture; each support raised from silence only until its line is clear. The same instrument now arrives by two paths — listen in mono.',
    roles: 'To the recording; the supports to the PA if the room needs them.',
    core: true,
    view: 'plan',
  },
  {
    id: 'gspots',
    role: 'MAIN PAIR + A FEW SUPPORTS',
    title: 'The pair, a bass spot and the guitar amp',
    variants: ['guitar'],
    rig: xyRig,
    singles: [BASS_MIC, AMP_MIC],
    mics: 'The X/Y pair, a small condenser in front of the bass, a dynamic close to the guitar amp.',
    start: 'The bass mic about 15–30 cm in front, a little above the bridge; the amp mic a few centimetres from the grille, facing the speaker.',
    line: 'Definition for the bass and the guitar under the pair — each raised only as far as the music needs.',
    roles: 'To the recording; the supports to the PA if the room needs them.',
    core: true,
    view: 'plan',
  },
  {
    id: 'kit',
    role: 'KIT VIEW',
    title: 'One mic over the kit and an outside kick',
    variants: both,
    singles: [KIT_MONO, KICK_MIC],
    mics: 'A small condenser over the middle of the kit; a kick mic outside the closed front head.',
    start: 'The overhead about 30 cm (1 ft) above the drummer’s head; the kick mic about 2–15 cm (1–6 in) outside the front head, toward its edge.',
    line: 'The ride, hi-hat and brushes carry the time: hear the kit as one view first, and add the kick — or a snare — only if the arrangement needs it.',
    roles: 'To the recording and, lightly, the PA.',
    core: true,
    view: 'section',
  },
  {
    id: 'amp',
    role: 'AMP TURNED AWAY',
    title: 'The guitar amp faced away from the drums, overheads on the kit',
    variants: ['guitar'],
    rig: ohRig,
    singles: [AMP_MIC],
    mics: 'A spaced pair of small condensers over the kit; a dynamic facing the amp’s speaker.',
    start: 'The amp turned so its speaker points away from the kit, its mic a few centimetres from the grille; the pair each about 1.2 m (4 ft) from the snare, pointing down.',
    line: 'Less guitar in the drum mics and more drums out of the guitar mic — separation from the arrangement, before any mic or EQ.',
    roles: 'To the recording and the PA.',
    core: true,
    view: 'plan',
  },
  {
    id: 'close',
    role: 'CLOSE MICS',
    title: 'A mic on every source',
    variants: ['quartet'],
    singles: [KIT_MONO, KICK_MIC, BASS_MIC, PIANO_MIC, SAX_MIC],
    mics: 'An overhead, an outside kick, a bass condenser, a piano condenser and a sax dynamic.',
    start: 'Each at its own instrument’s starting point; the sax mic about 5–10 cm (2–4 in) above the bell, aimed down at the holes.',
    line: 'Isolation and balance control for a loud club or a separate stream — and more local tone, less natural blend, more open mics.',
    roles: 'Close mics to the PA and the wedges as the players need.',
    core: true,
    view: 'plan',
  },
  {
    id: 'gclose',
    role: 'CLOSE MICS',
    title: 'A mic on every source',
    variants: ['guitar'],
    singles: [KIT_MONO, KICK_MIC, BASS_MIC, AMP_MIC, TRUMPET_MIC],
    mics: 'An overhead, an outside kick, a bass condenser, a guitar-amp dynamic and a trumpet mic.',
    start: 'Each at its own instrument’s starting point; the trumpet mic about 30–50 cm (12–20 in) from the bell, a little off its axis.',
    line: 'Control for a loud club or a stream — with more open mics and less of the room’s blend.',
    roles: 'Close mics to the PA and the wedges as the players need.',
    core: true,
    view: 'plan',
  },
  {
    id: 'hybrid',
    role: 'HYBRID · PAIR ON ITS OWN FEED',
    title: 'Close mics for the PA, the pair for the stream',
    variants: both,
    rig: xyRig,
    singles: [KICK_MIC, BASS_MIC],
    mics: 'The X/Y pair for the recording and the stream; close mics where the PA needs them.',
    start: 'The pair where it hears the band well; the close mics at their own starting points.',
    line: 'The audience in the club and the listeners at home each get their own balance. Keep the pair out of the wedges and check its phase against the close mics.',
    roles: 'Close mics → PA and wedges; the pair → recording and stream only.',
    core: true,
    view: 'plan',
  },
];

/* ── THE PLACEMENT STUDIO: the main pair's centre ── */
export const E15_PLACE: PlaceZone[] = [
  { id: 'pz.near', label: 'Nearer: 1.5–2.25 m in front', band: 'About 1.5–2.25 m (5–7.5 ft) in front of the group, 2–2.5 m (6.5–8 ft) up.', box: { min: v3(-1300, -2500, 1500), max: v3(500, -2000, 2250) }, tendency: 'More direct sound; the soloist and the drums tend to dominate.' },
  { id: 'pz.far', label: 'Farther: 2.25–3 m in front', band: 'About 2.25–3 m (7.5–10 ft) in front, 2–2.5 m (6.5–8 ft) up.', box: { min: v3(-1300, -2500, 2250), max: v3(500, -2000, 3000) }, tendency: 'More blend between the players and more of the room.' },
];
export const E15_NUMBERS = { bassD: 220, kickD: 80, saxD: 75, trumpetD: 400, pianoD: 600, ampD: 50 } as const;
