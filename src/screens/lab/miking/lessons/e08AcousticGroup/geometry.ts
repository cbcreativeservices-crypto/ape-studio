/**
 * E08 ACOUSTIC DUOS AND SMALL GROUPS — where things are, frame S, on the
 * stage-plot presets (shared/ensemble/bandStage.ts). Research:
 * docs/labs/miking/acoustic_small_group/ (SOURCES.md, GEOMETRY_PROPOSAL.md):
 * a thin lesson — the 3:1 starting point, and the published small-group
 * rule "arrange players at an equal distance from the microphone" with its
 * band "Strings or horns 1–6 feet (30 cm–2 m)" (S-SM4-UG).
 *
 *   DUO   a seated guitar and mandolin
 *   TRIO  guitar, fiddle and upright bass
 * Both on one arc round a point in front of them, where the main pair can
 * hear every player at about the same distance (the arc: a drawing default).
 *
 * The spots are the instrument lessons' own starting points, never
 * re-derived: the guitar near its 12th fret (C01 fret12, 15–30 cm), the
 * mandolin aimed where its neck meets the body (C05B joint, 30–40 cm), the
 * fiddle in front of where the bow meets the strings (C09a vn.close,
 * 25–35 cm), the bass in front just above the bridge (C06a ub.front).
 * The guitarist sits in the same place in both groups, so the shared
 * pages' guitar spot sits on them in either.
 */
import type { DocumentedZone, MicPose, Provenance, Wedge } from '../../engine/model/types.ts';
import { aimOf, add, planDir, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { seatingOf, seatsOf, soundPoint } from '../shared/ensemble/seating.ts';
import { closeMic, guitarPoint, GUITAR_POSE, TRIO_ARC, type CloseMic } from '../shared/ensemble/bandStage.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';
import { C01_ZONES } from '../c01Guitar/geometry.ts';
import { C05B_ZONES } from '../c05bMandolin/geometry.ts';
import { VIOLIN_ZONES } from '../c09aViolin/model.ts';
import { BASS_PLUCK_ZONES } from '../c06aBassPlucked/model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const zoneOf = (list: readonly DocumentedZone[], id: string): DocumentedZone => {
  const z = list.find((q) => q.id === id);
  if (!z) throw new Error(`E08: borrowed zone ${id} missing`);
  return z;
};

/** The borrowed starting points (their distances and words are the source lessons'). */
export const E08_BORROWED = {
  guitar: zoneOf(C01_ZONES, 'fret12.steel'),
  mandolin: zoneOf(C05B_ZONES, 'joint.a'),
  fiddle: zoneOf(VIOLIN_ZONES, 'vn.close'),
  bass: zoneOf(BASS_PLUCK_ZONES, 'ub.front'),
} as const;
/** The published small-group band for a main mic: strings or horns 1–6 ft (30 cm–2 m), players at an equal distance. */
export const SM4_BAND = { min: 304.8, max: 2000 } as const;

export const E08_SEATS = { duo: seatingOf('acoustic.duo'), trio: seatingOf('acoustic.trio') } as const;
const DUO = E08_SEATS.duo;
const TRIO = E08_SEATS.trio;
const AG = seatsOf(DUO, 'ag')[0];
const MD = seatsOf(DUO, 'mdn')[0];
const FD = seatsOf(TRIO, 'fid')[0];
const UB = seatsOf(TRIO, 'ub')[0];

/* ── the main pair at the arc's centre, a little above the instruments ── */
export const PAIR_C = v3(TRIO_ARC.c.x, -1300, TRIO_ARC.c.z);
const GROUP_MID = v3(0, -850, -450);
export const PAIR_POSE: MicPose = { p: PAIR_C, ...aimOf(sub(GROUP_MID, PAIR_C)) };
const place = { c: PAIR_C, face: 0, tilt: 25 };
const mount = { kind: 'boom' as const, reach: 900 };
const xyRig = { id: 'xy' as const, params: { angle: 90 }, place, mount };
const ortfRig = { id: 'ortf' as const, params: {}, place, mount };
const abRig = { id: 'ab' as const, params: { spacing: 500 }, place, mount };

/* ── the spots ── */
/** The guitar: 22.5 cm out from the 12th fret, aimed between the upper top and the strings (C01 fret12, 15–30 cm). */
const FRET12 = guitarPoint(AG, 'aguitar', GUITAR_POSE.aguitar.L + 60);
const AG_FROM = unit(add(planDir(AG.face), v3(0, -0.15, 0)));
export const GUITAR_MIC: CloseMic = closeMic({ key: 'ag', label: 'GUITAR', src: 'ag', own: FRET12, from: AG_FROM, d: 225, typeId: 'sdcCard' });
/** The mandolin: 35 cm out, aimed where the neck meets the body (C05B joint, 30–40 cm). */
const MD_JOINT = guitarPoint(MD, 'mandolin', GUITAR_POSE.mandolin.L);
export const MANDOLIN_MIC: CloseMic = closeMic({ key: 'mdn', label: 'MANDOLIN', src: 'mdn', own: MD_JOINT, from: unit(add(planDir(MD.face), v3(0, -0.2, 0))), d: 350, typeId: 'sdcCard' });
/** The fiddle: 30 cm in front of where the bow meets the strings, a little above (C09a vn.close, 25–35 cm). */
const FD_BRIDGE = soundPoint(FD);
export const FIDDLE_MIC: CloseMic = closeMic({ key: 'fid', label: 'FIDDLE', src: 'fid', own: FD_BRIDGE, from: unit(add(planDir(FD.face), v3(0, -0.5, 0))), d: 300, typeId: 'sdcCard' });
/** The bass: 22 cm in front of the strings, a little above the bridge (C06a ub.front, 15–30 cm). */
const UB_BRIDGE = soundPoint(UB);
export const BASS_MIC: CloseMic = closeMic({ key: 'ub', label: 'BASS', src: 'ub', own: UB_BRIDGE, from: unit(add(planDir(UB.face), v3(0, -0.35, 0))), d: 220, typeId: 'sdcCard' });

/* ── the model ── */
const views = stageViews([DUO, TRIO], { zMax: 2600, hMax: 2200 });
export const E08_MODEL = ensembleModel({
  id: 'e08-acoustic',
  name: 'acoustic group',
  variants: [
    { id: 'duo', label: 'Guitar and mandolin', short: 'Duo', blurb: DUO.blurb, seating: DUO },
    { id: 'trio', label: 'Guitar, fiddle and bass', short: 'Trio', blurb: TRIO.blurb, seating: TRIO },
  ],
  views,
  extraSurfaces: [targetSurface('t.ag', sectionPartId('duo', 'ag'), 'the guitar’s 12th fret', FRET12, AG_FROM)],
});
const surf = (id: string) => E08_MODEL.surfaces.find((s) => s.id === id)!;
const pose = (m: CloseMic): MicPose => ({ p: m.p, ...aimOf(m.aim) });
const GZ = E08_BORROWED.guitar;

export const E08_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'ac.main',
    label: 'At the point the players sit round',
    band: 'Try the pair where every player is about the same distance from it — about 1–2 m (3–6 ft) away, a little above the instruments, aimed at the group’s middle.',
    kind: 'sourced',
    src: 'S-SM4-UG',
    quote: 'Strings or horns 1–6 feet (30 cm–2 m) … For a horn or string section, arrange players at an equal distance from the microphone',
    bandProv: ill('the height "a little above the instruments" and the arc are drawing defaults; the 1–2 m is inside the published 30 cm–2 m'),
    ref: 'floor',
    d: [1100, 1600],
    box: { min: v3(-400, -1600, 250), max: v3(400, -1100, 1100) },
    start: PAIR_POSE,
    micTypeIds: ['arrCard', 'arrOmni'],
    tendency: 'The group as one acoustic instrument with its room. Closer, the nearest player leads; farther, more blend and more room.',
    checks: ['Every player about the same distance', 'The outer players inside the pair’s angle', 'The mono sum'],
  }),
  targetZone({
    id: 'ac.ag',
    label: 'Near the guitar’s 12th fret',
    band: GZ.band,
    src: GZ.src,
    quote: GZ.quote,
    kind: GZ.kind,
    surface: surf('t.ag'),
    side: v3(0, -1, 0),
    d: [GZ.distance.min, GZ.distance.max],
    coneMax: 30,
    aimMax: 20,
    start: pose(GUITAR_MIC),
    micTypeIds: ['sdcCard'],
    tendency: GZ.tendency,
    checks: GZ.checks,
    prov: ill('out from the 12th fret, in front of the top: the group lesson’s drawing of the guitar lesson’s zone'),
  }),
];

/* ── the guitarist's wedge (the context page aims the guitar spot's rejection at it) ── */
const agWedge = DUO.gear!.find((g) => g.id === 'mon.ag')!;
export const E08_WEDGES: Wedge[] = [
  { id: 'ag', label: 'the guitarist’s floor wedge', short: 'WEDGE', p: v3(agWedge.p.x, 0, agWedge.p.z), lift: 250, faces: planDir(agWedge.face), note: 'The guitarist’s wedge on the floor about 1 m in front of them, facing back at them — behind the guitar mic, below it.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS ── */
export const E08_SETUPS: EnsembleSetup[] = [
  {
    id: 'xy',
    role: 'MAIN PAIR · COINCIDENT',
    title: 'An X/Y pair where the players are equally far',
    rig: xyRig,
    mics: 'Two matched cardioid small condensers, capsules together, 90° apart, on a boom stand.',
    start: 'At the point the players sit round — every player about the same distance, about 1–2 m (3–6 ft) — a little above the instruments, aimed at the group’s middle.',
    line: 'A stable image and a dependable mono sum; the players’ own balance. A narrower picture is not worse if it serves the music.',
    roles: 'To the recording; to a stereo PA only if the group is small and the pair close enough.',
    core: true,
    view: 'plan',
  },
  {
    id: 'ortf',
    role: 'MAIN PAIR · NEAR-COINCIDENT',
    title: 'A 17 cm, 110° pair in the same place',
    rig: ortfRig,
    mics: 'Two cardioid small condensers, 17 cm (6.7 in) apart, 110° between them — a fixed geometry.',
    start: 'The same place; move the whole pair, and seat the players so the group fills its angle.',
    line: 'A wider image with useful directionality; check the outer players and the mono sum.',
    core: true,
    view: 'plan',
  },
  {
    id: 'ab',
    role: 'MAIN PAIR · SPACED',
    title: 'A spaced omni pair — in a quiet, useful room only',
    rig: abRig,
    mics: 'Two omni small condensers, 50 cm (20 in) apart on one bar.',
    start: 'The same place, in a quiet room worth hearing.',
    line: 'A wide, warm room image; timing differences can blur the image and change the tone in mono. In a noisy or reflective room, a closer coincident pair keeps it clearer.',
    core: false,
    view: 'front',
  },
  {
    id: 'spot',
    role: 'MAIN PAIR + ONE SPOT',
    title: 'The pair and a spot on the guitar',
    variants: ['duo'],
    rig: xyRig,
    singles: [GUITAR_MIC],
    mics: 'The X/Y pair, plus a small condenser on its own stand for the guitar.',
    start: 'The spot about 15–30 cm (6–12 in) out from the 12th fret, aimed between the upper top and the strings — raised from silence until the guitar is defined, then back until it still sounds like one group.',
    line: 'Definition for the quieter instrument without losing the group; too much and it detaches.',
    roles: 'To the recording; to the PA if the room needs it.',
    core: true,
    view: 'plan',
  },
  {
    id: 'spots',
    role: 'TWO SPOTS · 3:1',
    title: 'A spot on each instrument, far enough apart',
    variants: ['duo'],
    singles: [GUITAR_MIC, MANDOLIN_MIC],
    mics: 'A small condenser for the guitar and one for the mandolin.',
    start: 'The guitar mic out from the 12th fret, the mandolin mic about 30–40 cm (12–16 in) out, aimed where its neck meets the body — the two mics at least about 3 times farther apart than either is from its own instrument.',
    line: '3:1 is a starting point that reduces correlated leakage — not a promise of phase alignment or equal tone. Where it cannot be met, use fewer mics, move the players, or a coherent pair.',
    roles: 'To the PA and the wedges; to the recording under a pair.',
    core: true,
    view: 'plan',
  },
  {
    id: 'di',
    role: 'MAIN PAIR + PICKUP',
    title: 'The pair and the guitar’s pickup through a DI',
    variants: ['duo'],
    rig: xyRig,
    di: ['ag'],
    mics: 'The X/Y pair; the acoustic-electric guitar’s pickup through a DI box.',
    start: 'The pair at its starting point; the DI from the guitar’s output — each path useful alone before they are blended.',
    line: 'A stable source under the pair, strong for gain before feedback; its direct tone may not match the acoustic picture. Check polarity and mono before blending.',
    roles: 'The DI to the PA and the wedge; the pair to the recording.',
    core: false,
    view: 'plan',
  },
  {
    id: 'tspot',
    role: 'MAIN PAIR + ONE SPOT',
    title: 'The pair and a spot on the bass',
    variants: ['trio'],
    rig: xyRig,
    singles: [BASS_MIC],
    mics: 'The X/Y pair, plus a small condenser for the upright bass.',
    start: 'The spot about 15–30 cm (6–12 in) in front of the strings, a little above the bridge — raised under the pair only until the bass is defined.',
    line: 'The low line clearer under the pair; watch the floor and the room’s low notes, and keep the group one picture.',
    roles: 'To the recording; to the PA if the room needs it.',
    core: true,
    view: 'plan',
  },
  {
    id: 'tspots',
    role: 'THREE SPOTS · 3:1',
    title: 'A spot on each player',
    variants: ['trio'],
    singles: [GUITAR_MIC, FIDDLE_MIC, BASS_MIC],
    mics: 'A small condenser for each: the guitar, the fiddle, the bass.',
    start: 'Each at its instrument’s starting point — the fiddle mic about 25–35 cm (10–14 in) in front of where the bow meets the strings — and every pair of mics at least about 3 times farther apart than each is from its own player.',
    line: 'Control of each line, at the cost of the shared picture and more phase pairs. Keep the bright fiddle off the guitar’s mic axis.',
    roles: 'To the PA and the wedges; to the recording under a pair.',
    core: true,
    view: 'plan',
  },
];

/* ── THE PLACEMENT STUDIO: the pair's centre ── */
export const E08_PLACE: PlaceZone[] = [
  { id: 'pz.near', label: 'Nearer: about 1–1.5 m from the players', band: 'The pair about 1–1.5 m (3–5 ft) from the players, a little above the instruments.', box: { min: v3(-400, -1600, 250), max: v3(400, -1100, 650) }, tendency: 'More direct sound and detail; the nearest player can lead.' },
  { id: 'pz.far', label: 'Farther: about 1.5–2 m, at the arc’s centre', band: 'The pair about 1.5–2 m (5–6.5 ft) from the players, where they are about equally far from it.', box: { min: v3(-400, -1600, 650), max: v3(400, -1100, 1100) }, tendency: 'More blend and more of the room; the players about equally loud.' },
];
export const E08_NUMBERS = { guitarD: 225, mandolinD: 350, fiddleD: 300, bassD: 220 } as const;
