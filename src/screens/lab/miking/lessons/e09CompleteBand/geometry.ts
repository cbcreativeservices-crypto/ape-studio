/**
 * E09 RHYTHM SECTIONS AND COMPLETE BANDS — where things are, frame S, on the
 * stage-plot presets (shared/ensemble/bandStage.ts). Research:
 * docs/labs/miking/rhythm_section_band/ (SOURCES.md, GEOMETRY_PROPOSAL.md:
 * "All token positions = drawing defaults (lesson gives none)"); the
 * lesson has no numbers of its own.
 *
 *   STAGE  a band on a stage: drums upstage centre, guitar and bass in
 *          front of their amps, keys at the side on a DI, the singer
 *          downstage centre, a wedge for each player, the PA at the corners
 *   ROOM   the same band tracking in one room: the amps to the walls, a gobo
 *          by the guitar amp, the singer screened, no wedges
 *
 * EVERY CLOSE MIC IS BORROWED from its instrument's own lesson, never
 * re-derived: the kick level with its front head (M01 reso.level), the
 * snare over the rim (M02 top.close), the guitar amp close to the grille
 * (C02 eg.close), the bass amp on one woofer (C08 bass.centre), the vocal
 * within 10 cm of the lips (the voice family's stage row, E01 lv.stage);
 * the overhead pair is M09's spaced pair (each mic about 1.2 m from the
 * snare, pointing down), the room pair M10's low pair about 1 m in front of
 * the kick. The kit and the singer stand in the same place in both
 * seatings, so the shared pages' vocal and kick mics sit on them in either.
 */
import type { DocumentedZone, MicPose, Provenance, Wedge } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { aimOf, add, mul, planDir, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { seatingOf, seatsOf, type Seating } from '../shared/ensemble/seating.ts';
import { ampGeom, ampOf, ampSpeaker, closeMic, kitKickFront, kitPoint, kitSnare, rightOf, singerAnchor, VOCAL_WEDGE, type CloseMic } from '../shared/ensemble/bandStage.ts';
import { ensembleModel, sectionPartId, stageViews, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';
import { addVoice, voiceIds } from '../shared/voice/addVoice.ts';
import { voiceZone } from '../shared/voice/voiceZones.ts';
import { stageRow } from '../shared/voice/voiceStarts.ts';
import { KICK_ZONES } from '../m01Kick/model.ts';
import { SNARE_ZONES } from '../m02Snare/model.ts';
import { M09_ZONES } from '../m09Overheads/model.ts';
import { M10_ZONES } from '../m10Room/model.ts';
import { BASS_ZONES, GUITAR_ZONES } from '../shared/speakers/ampZones.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const zoneOf = (list: readonly DocumentedZone[], id: string): DocumentedZone => {
  const z = list.find((q) => q.id === id);
  if (!z) throw new Error(`E09: borrowed zone ${id} missing`);
  return z;
};

/** The borrowed starting points (their distances and words are the source lessons'). */
export const E09_BORROWED = {
  kick: zoneOf(KICK_ZONES, 'reso.level'),
  snare: zoneOf(SNARE_ZONES, 'top.close'),
  amp: zoneOf(GUITAR_ZONES, 'eg.close'),
  bass: zoneOf(BASS_ZONES, 'bass.centre'),
  oh: zoneOf(M09_ZONES, 'oh.ab.hat'),
  room: zoneOf(M10_ZONES, 'rm.low'),
} as const;

export const E09_SEATS = { stage: seatingOf('band.stage'), room: seatingOf('band.room') } as const;
const ST = E09_SEATS.stage;
const RM = E09_SEATS.room;
const DR = seatsOf(ST, 'drums')[0];
const VX = seatsOf(ST, 'vox')[0];
export const SINGER_V = singerAnchor(VX);
const KF = kitKickFront(DR);
const SN = kitSnare(DR);
const FWD = planDir(DR.face);

/* ── the drums (the same in both seatings) ── */
/** The kick mic: level with the front head at its port, 4 cm out, aimed in. */
export const KICK_MIC: CloseMic = closeMic({ key: 'kick', label: 'KICK', src: 'drums', own: KF.port, from: FWD, d: 40, typeId: 'kickDynCard' });
/** The snare mic: about 5 cm above the rim on the audience side of the
 *  drum, toward the hi-hat, aimed at the head (M02 top.close: 2.5–7.5 cm). */
const SN_R = KIT_DRUMS.snare.spec.d.mm / 2;
const SN_RIM = kitPoint(DR, add(KIT_DRUMS.snare.c, v3(SN_R * 0.82, 0, -SN_R * 0.58)));
export const SNARE_MIC: CloseMic = closeMic({ key: 'snare', label: 'SNARE', src: 'drums', own: SN_RIM, from: unit(add(v3(0, -1, 0), mul(unit(sub(SN_RIM, SN)), 0.35))), d: 50, typeId: 'smallDynCard', aimAt: SN });
/** The spaced overhead pair (M09): centred over the snare, its mics 1.4 m
 *  apart and each about 1.2 m from the snare's centre, pointing down; on a
 *  boom stand in front of the kit. */
export const OH_SPACING = 1400;
export const OH_FROM_SNARE = 1219;
export const OH_C = v3(SN.x, SN.y - Math.sqrt(OH_FROM_SNARE ** 2 - (OH_SPACING / 2) ** 2), SN.z);
const ohRig = { id: 'ab' as const, params: { spacing: OH_SPACING }, place: { c: OH_C, face: 0, tilt: 90 }, mount: { kind: 'boom' as const, reach: 1250 } };
/** The low room pair (M10 rm.low): omnis 40 cm apart, about 1 m in front of
 *  the kick's front head; 0.6 m up (its height "low" is a drawing default). */
export const ROOM_C = add(v3(KF.c.x, -600, KF.c.z), mul(FWD, 1000));
const roomRig = { id: 'ab' as const, params: { spacing: 400 }, place: { c: ROOM_C, face: 0, tilt: 15 }, mount: { kind: 'stand' as const } };

/* ── the singer (the same in both seatings) ── */
export const VOX_IDS = voiceIds('bd');

/* ── the amps ── */
function ampMic(s: Seating, sec: 'gtr' | 'bass'): CloseMic {
  const g = ampOf(s, sec)!;
  const sp = ampSpeaker(g);
  const z = sec === 'gtr' ? E09_BORROWED.amp : E09_BORROWED.bass;
  const d = sec === 'gtr' ? 50 : 60;
  if (d < z.distance.min || d > z.distance.max) throw new Error(`E09: ${sec} amp mic outside ${z.id}`);
  return closeMic({ key: sec === 'gtr' ? 'gtrAmp' : 'bassAmp', label: sec === 'gtr' ? 'GUITAR AMP' : 'BASS AMP', src: sec, own: sp, from: planDir(g.face), d, typeId: 'instDynCard' });
}
export const AMP_MICS = { stage: { gtr: ampMic(ST, 'gtr'), bass: ampMic(ST, 'bass') }, room: { gtr: ampMic(RM, 'gtr'), bass: ampMic(RM, 'bass') } } as const;

/* ── the model: the stage plot, with the singer's mouth on it ── */
const pose = (m: { p: { x: number; y: number; z: number }; aim: { x: number; y: number; z: number } }): MicPose => ({ p: m.p, ...aimOf(m.aim) });
const views = stageViews([ST, RM], { hMax: 2600 });
const BASE = ensembleModel({
  id: 'e09-band',
  name: 'band on its stage',
  variants: [
    { id: 'stage', label: 'A band on a stage', short: 'Stage', blurb: ST.blurb, seating: ST },
    { id: 'room', label: 'The band in one room', short: 'Room', blurb: RM.blurb, seating: RM },
  ],
  views,
  extraSurfaces: [
    targetSurface('t.kick', sectionPartId('stage', 'drums'), 'the kick’s front head, at its port', KF.port, FWD),
    targetSurface('t.gtr', sectionPartId('stage', 'gtr'), 'the guitar amp’s speaker', AMP_MICS.stage.gtr.own, planDir(ampOf(ST, 'gtr')!.face)),
    targetSurface('t.gtrRoom', sectionPartId('room', 'gtr'), 'the guitar amp’s speaker', AMP_MICS.room.gtr.own, planDir(ampOf(RM, 'gtr')!.face)),
    targetSurface('t.bass', sectionPartId('stage', 'bass'), 'one of the bass amp’s woofers', AMP_MICS.stage.bass.own, planDir(ampOf(ST, 'bass')!.face)),
    targetSurface('t.bassRoom', sectionPartId('room', 'bass'), 'one of the bass amp’s woofers', AMP_MICS.room.bass.own, planDir(ampOf(RM, 'bass')!.face)),
  ],
});
export const E09_MODEL = addVoice(BASE, SINGER_V, VOX_IDS, ['stage', 'room']);
const surf = (id: string) => E09_MODEL.surfaces.find((s) => s.id === id)!;

/* ── the recommended starting points the shared pages read ── */
const VOX_ZONE = voiceZone(E09_MODEL, SINGER_V, stageRow({ id: 'bd.voc', micTypeIds: ['vocDynSuper', 'vocDynCard'], variants: ['stage', 'room'] }), MIC_TYPES, { surface: VOX_IDS.surface });
const ampZone = (id: string, variant: 'stage' | 'room', sec: 'gtr' | 'bass', s: string, m: CloseMic): DocumentedZone => {
  const z = sec === 'gtr' ? E09_BORROWED.amp : E09_BORROWED.bass;
  return targetZone({
    id,
    label: sec === 'gtr' ? 'Close to the guitar amp’s grille' : 'Close to one woofer of the bass amp',
    band: z.band,
    src: z.src,
    quote: z.quote,
    kind: z.kind,
    surface: surf(s),
    side: v3(0, -1, 0),
    d: [z.distance.min, z.distance.max],
    coneMax: 20,
    aimMax: 20,
    start: pose(m),
    variants: [variant],
    micTypeIds: ['instDynCard'],
    tendency: z.tendency,
    checks: z.checks,
    prov: ill('in front of the speaker, on its axis: the band lesson’s drawing of the amp lesson’s zone'),
  });
};
const KZ = E09_BORROWED.kick;
export const E09_ZONES: DocumentedZone[] = [
  VOX_ZONE,
  targetZone({
    id: 'bd.kick',
    label: 'Level with the kick’s front head, at its port',
    band: KZ.band,
    src: KZ.src,
    quote: KZ.quote,
    kind: KZ.kind,
    surface: surf('t.kick'),
    side: v3(0, -1, 0),
    d: [10, 60],
    coneMax: 25,
    aimMax: 25,
    start: pose(KICK_MIC),
    variants: ['stage', 'room'],
    micTypeIds: ['kickDynCard'],
    tendency: KZ.tendency,
    checks: KZ.checks,
    prov: ill('outside the port, on the drum’s axis: the band lesson’s drawing of the kick lesson’s zone'),
  }),
  ampZone('bd.gtr', 'stage', 'gtr', 't.gtr', AMP_MICS.stage.gtr),
  ampZone('bd.gtrRoom', 'room', 'gtr', 't.gtrRoom', AMP_MICS.room.gtr),
  ampZone('bd.bass', 'stage', 'bass', 't.bass', AMP_MICS.stage.bass),
  ampZone('bd.bassRoom', 'room', 'bass', 't.bassRoom', AMP_MICS.room.bass),
];
/** The vocal mic where the vocal zone starts it (the voice family's search). */
export const VOCAL_MIC: CloseMic = { key: 'vox', label: 'VOCAL', src: 'vox', own: SINGER_V.lip, typeId: 'vocDynSuper', pattern: 'supercardioid', p: VOX_ZONE.start.p, aim: unit(sub(SINGER_V.lip, VOX_ZONE.start.p)) };

/* ── the wedge the context page aims a null at (the stage's own wedge) ── */
const vWedge = ST.gear!.find((g) => g.id === 'mon.vox')!;
export const E09_WEDGES: Wedge[] = [
  { id: 'vox', label: 'the singer’s floor wedge', short: 'WEDGE', p: v3(vWedge.p.x, 0, vWedge.p.z), lift: 250, faces: planDir(vWedge.face), note: `The singer’s wedge on the floor about ${(VOCAL_WEDGE / 1000).toFixed(2)} m in front of them, facing back at them — behind the vocal mic, below its axis.`, prov: ill('a typical position: a drawing default (past the mic stand’s base)') },
];

/* ── STARTING SETUPS ── */
const singles = (...m: CloseMic[]) => m;
/** The drum pairs in their own words (the array tool's spaced pair is worded for an orchestra). */
const OH_WORDS = { what: 'Two small condensers on one bar over the kit, pointing straight down, each the same distance from the snare.', check: 'The snare in the middle, the cymbals against the drums, and the pair in mono.' };
const ROOM_WORDS = { what: 'Two omnis about 40 cm apart on one bar, low in front of the kit.', check: 'The kick and the room against the close mics, and the pair in mono.' };
const withWords = (list: EnsembleSetup[]): EnsembleSetup[] => list.map((s) => (s.rig === ohRig ? { ...s, arrayWords: OH_WORDS } : s.rig === roomRig ? { ...s, arrayWords: ROOM_WORDS } : s));
export const E09_SETUPS: EnsembleSetup[] = withWords([
  {
    id: 'min',
    role: 'MINIMAL PLAN',
    title: 'Overheads, kick, one guitar mic, a vocal — bass and keys by DI',
    variants: ['stage'],
    rig: ohRig,
    singles: singles(KICK_MIC, AMP_MICS.stage.gtr, VOCAL_MIC),
    di: ['bass', 'keys'],
    mics: 'A spaced pair of small condensers over the kit, a kick dynamic at the front head, a dynamic on the guitar amp, a supercardioid vocal dynamic.',
    start: 'The pair about 1.2 m (4 ft) from the snare’s centre, pointing down; the kick level with its front head; the guitar mic a few centimetres from the grille; the vocal within about 10 cm of the lips.',
    line: 'Few channels and few feedback paths: the band’s own balance and the arrangement do most of the mixing, with less to correct later.',
    roles: 'Every mic and DI feeds the PA; the vocal, kick and DIs feed the wedges; the overheads stay out of the wedges.',
    core: true,
    view: 'plan',
  },
  {
    id: 'exp',
    role: 'EXPANDED PLAN',
    title: 'Close mics on every loud source, bass DI plus its cabinet',
    variants: ['stage'],
    rig: ohRig,
    singles: singles(KICK_MIC, SNARE_MIC, AMP_MICS.stage.gtr, AMP_MICS.stage.bass, VOCAL_MIC),
    di: ['bass', 'keys'],
    mics: 'The overhead pair, kick and snare dynamics, a dynamic on the guitar amp and one on a bass woofer, the vocal mic — plus the bass and keys DIs.',
    start: 'Each close mic at its own instrument’s starting point; the bass cabinet mic a few centimetres from one woofer, its DI from the bass amp’s direct output or a DI box.',
    line: 'Independent control of every part — and more spill, more phase pairs, more channels that can feed back or get noisy. More tracks are not automatically more control.',
    roles: 'Close mics and DIs to the PA and the wedges as each player needs; the overheads to the PA lightly and to the recording.',
    core: true,
    view: 'plan',
  },
  {
    id: 'vox',
    role: 'VOCAL AND ITS WEDGE',
    title: 'A directional vocal mic close, the wedge in its rejection',
    variants: ['stage'],
    singles: singles(VOCAL_MIC),
    mics: 'A supercardioid vocal dynamic on a boom stand.',
    start: 'Within about 10 cm of the lips, on the mouth’s axis; the wedge on the floor in front, facing back at the singer — toward the mic’s rejection.',
    line: 'The closest mic on the stage, so the voice stays ahead of the band. A supercardioid rejects most well off its back, not straight behind: aim it with the wedge in mind.',
    roles: 'To the PA and the singer’s wedge — with no loud backing in that wedge.',
    core: true,
    view: 'section',
  },
  {
    id: 'bassPair',
    role: 'BASS · DI PLUS CABINET',
    title: 'The bass DI under a mic on one woofer',
    variants: ['stage'],
    singles: singles(AMP_MICS.stage.bass),
    di: ['bass'],
    mics: 'The bass DI (a steady low end with no spill) and a dynamic on one woofer of the bass amp.',
    start: 'The mic a few centimetres from the grille in front of one woofer; the DI from the amp’s direct output or a DI box before it.',
    line: 'A stable low foundation plus the cabinet’s character. The two paths arrive at different times: compare each alone, then together in mono, before blending.',
    roles: 'The DI to the PA and the wedges; the cabinet mic blended under it.',
    core: true,
    view: 'plan',
  },
  {
    id: 'oh',
    role: 'KIT FROM ABOVE',
    title: 'The spaced overhead pair alone',
    variants: ['stage', 'room'],
    rig: ohRig,
    mics: 'Two small condensers on one bar, 1.4 m apart, pointing straight down.',
    start: 'Each mic about 1.2 m (4 ft) from the snare’s centre — the same distance — over the hi-hat side and the other side of the kit.',
    line: 'The whole kit and the cymbals as one picture; the close mics add focus only where it is missing. Check the pair in mono.',
    core: false,
    view: 'section',
  },
  {
    id: 'rmin',
    role: 'MINIMAL · ONE ROOM',
    title: 'A low room pair, kick, guitar amp and vocal — bass by DI',
    variants: ['room'],
    rig: roomRig,
    singles: singles(KICK_MIC, AMP_MICS.room.gtr, VOCAL_MIC),
    di: ['bass'],
    mics: 'Two omnis 40 cm apart in front of the kit, a kick dynamic, a dynamic on the guitar amp, the vocal mic.',
    start: 'The pair about 1 m (3.3 ft) in front of the kick, low; the guitar amp facing the wall with its mic close to the grille; the singer behind a gobo.',
    line: 'The band’s interaction and the room’s sound, with controlled bleed. Every track carries some of the others: process one, and you process them too.',
    roles: 'All to the recording; the players hear a cue mix on headphones.',
    core: true,
    view: 'plan',
  },
  {
    id: 'rexp',
    role: 'EXPANDED · ONE ROOM',
    title: 'Overheads and close mics on every source, bass DI plus cabinet',
    variants: ['room'],
    rig: ohRig,
    singles: singles(KICK_MIC, SNARE_MIC, AMP_MICS.room.gtr, AMP_MICS.room.bass, VOCAL_MIC),
    di: ['bass'],
    mics: 'The overhead pair, kick and snare dynamics, dynamics on the guitar amp and one bass woofer, the vocal mic, the bass DI.',
    start: 'Each at its own instrument’s starting point; the amps still facing the walls, away from the vocal mic.',
    line: 'More control after the session — and more phase pairs to check. Listen to the complete mix, not each mic soloed.',
    roles: 'All to the recording; a cue mix to the headphones.',
    core: true,
    view: 'plan',
  },
  {
    id: 'rvox',
    role: 'VOCAL, SCREENED',
    title: 'The vocal mic close, a gobo between the singer and the band',
    variants: ['room'],
    singles: singles(VOCAL_MIC),
    mics: 'A directional vocal dynamic close to the singer.',
    start: 'Within about 10 cm of the lips; the gobo behind the singer, so the band reaches the mic from its back.',
    line: 'Less drum and amp spill in the vocal — but a scratch vocal full of spill is hard to keep as the final one. Keep eye contact and a cue mix.',
    roles: 'To the recording and the cue mix.',
    core: true,
    view: 'plan',
  },
  {
    id: 'ramp',
    role: 'GUITAR AMP TO THE WALL',
    title: 'The amp turned away, its mic close, a gobo behind it',
    variants: ['room'],
    singles: singles(AMP_MICS.room.gtr),
    mics: 'A dynamic close to the guitar amp’s grille.',
    start: 'A few centimetres from the grille, on the speaker; the amp faces the wall, away from the vocal mic and the room pair; the gobo between its open back and the room.',
    line: 'Less guitar in the other mics and more control of its own — a gobo changes the reflections and the sightlines too, so check both.',
    roles: 'To the recording and the cue mix.',
    core: true,
    view: 'plan',
  },
  {
    id: 'room',
    role: 'ROOM PAIR',
    title: 'A low pair of omnis in front of the kit',
    variants: ['room'],
    rig: roomRig,
    mics: 'Two omni small condensers, 40 cm apart, on one bar.',
    start: 'About 1 m (3.3 ft) in front of the kick’s front head, low.',
    line: 'The kit and the room together; muddy if the room is too reflective or the pair too close to the loudest sources.',
    core: false,
    view: 'section',
  },
]);

/* ── THE PLACEMENT STUDIO: the pair's centre ── */
const SN_H = -SN.y;
const ohH = (d: number) => SN_H + Math.sqrt(d * d - (OH_SPACING / 2) ** 2);
const ohBox = (d0: number, d1: number) => ({ min: v3(SN.x - 350, -ohH(d1), SN.z - 350), max: v3(SN.x + 350, -ohH(d0), SN.z + 350) });
export const E09_PLACE: PlaceZone[] = [
  { id: 'pz.ohLow', label: 'Over the kit, each mic about 1–1.2 m from the snare', band: 'The spaced pair centred over the snare, each mic about 1–1.2 m (3.3–4 ft) from its centre, pointing down.', box: ohBox(1000, 1200), tendency: 'More drums and less room; the snare and toms a little closer than the cymbals.' },
  { id: 'pz.ohHigh', label: 'A little higher, each mic about 1.2–1.4 m from the snare', band: 'The same pair raised so each mic is about 1.2–1.4 m (4–4.6 ft) from the snare’s centre.', box: ohBox(1200, 1400), tendency: 'More cymbals and more of the room; the kit as one picture.' },
  { id: 'pz.room', label: 'Low, about 1 m in front of the kick', band: 'A pair about 1 m (3.3 ft) in front of the kick’s front head, low — omnis about 40 cm apart is one idea.', box: { min: add(v3(KF.c.x - 450, -900, KF.c.z), mul(FWD, 850)), max: add(v3(KF.c.x + 450, -300, KF.c.z), mul(FWD, 1150)) }, variants: ['room'], tendency: 'The kit with the room around it — and the kick strong. Too close to a loud source and it gets muddy.' },
];
/** Recorded so the test can check them against the borrowed zones. */
export const E09_NUMBERS = { kickD: 40, snareD: 50, ampD: { gtr: 50, bass: 60 }, ohFromSnare: OH_FROM_SNARE, roomFront: 1000, ampSize: ampGeom('combo') } as const;
export const RIGHT_OF_KIT = rightOf(DR.face);
