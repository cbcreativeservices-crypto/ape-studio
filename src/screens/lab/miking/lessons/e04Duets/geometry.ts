/**
 * E04 DUETS AND SMALL VOCAL GROUPS — where things are, frame S, the singers
 * frame V's (every vocal distance from the LIPS). Research:
 * docs/labs/miking/duets_small_vocal/ (SOURCES.md, GEOMETRY_PROPOSAL.md);
 * 3:1 = lead_vocal/SOURCES.md §0.2; arrays full_orchestra/SOURCES.md §A;
 * corrections E4-* in CORRECTIONS_LOG.md.
 *
 *   SHARED   a duet on a semicircle in front of ONE mic, each mouth at a
 *            matched distance (AKG-C414; the radius 40 cm a drawing default)
 *            — or a handheld each, within about 10 cm (the voice family's
 *            stage row, DPA-VOICE), the two mics far past 3:1
 *   FIGURE-8 two singers facing each other, one in each lobe of a
 *            figure-8 (the lesson L11; the bidirectional pattern's own
 *            geometry; each 30 cm away: a drawing default) — or two
 *            cardioids back to back, one per singer
 *   QUARTET  four singers 75 cm apart on a shallow arc: a pair at the
 *            group's acoustic centre, far enough that the group fills a 17
 *            cm pair's 95° recording angle (DERIVED from the drawn width) —
 *            or a cardioid each about 20–30 cm away (N-VOC's studio row),
 *            spaced 3:1 (mic to mic)
 * Two singers face each other here, so every stand's boom runs DOWNSTAGE
 * (the model's fixed boom rule), never into a singer.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { aimOf, dirOf, sub, v3 } from '../shared/ensemble/frameS.ts';
import { seatingOf } from '../shared/ensemble/seating.ts';
import { lipOf, SHARED_AT, SHARED_R, VOX } from '../shared/ensemble/seatingVoices.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews } from '../shared/ensemble/ensembleModel.ts';
import { mouthSurfaceFor, seatById, singerAnchor, threeToOneMics } from '../shared/ensemble/voiceGroup.ts';
import { voiceZone } from '../shared/voice/voiceZones.ts';
import { fartherRow, stageRow } from '../shared/voice/voiceStarts.ts';
import { distanceSwingDb } from '../shared/voice/voiceSpec.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E04_SEATS = { shared: seatingOf('duo.shared'), fig8: seatingOf('duo.fig8'), quartet: seatingOf('vocal.quartet') } as const;
const SH = E04_SEATS.shared;
const F8 = E04_SEATS.fig8;
const QU = E04_SEATS.quartet;
const toward = (from: Vec3, to: Vec3): MicPose => ({ p: from, ...aimOf(sub(to, from)) });
const M_SH = SHARED_AT['duo.shared'];
const M_F8 = SHARED_AT['duo.fig8'];
const LIP = VOX.adult.lip;

export const E04_SURFACES = [
  mouthSurfaceFor('shared', SH, 'hi.1', sectionPartId('shared', 'hi')),
  mouthSurfaceFor('shared', SH, 'lo.1', sectionPartId('shared', 'lo')),
  mouthSurfaceFor('quartet', QU, 'sop.1', sectionPartId('quartet', 'sop')),
  mouthSurfaceFor('quartet', QU, 'alt.1', sectionPartId('quartet', 'alt')),
];
export const E04_MODEL = ensembleModel({
  id: 'e04-duets',
  name: 'duet and small vocal group',
  variants: [
    { id: 'shared', label: 'A duet at one mic', short: 'Duet', blurb: SH.blurb, seating: SH },
    { id: 'fig8', label: 'Face to face', short: 'Figure-8', blurb: F8.blurb, seating: F8 },
    { id: 'quartet', label: 'An a cappella quartet', short: 'Quartet', blurb: QU.blurb, seating: QU },
  ],
  views: stageViews([SH, F8, QU], { hMax: 2600 }),
  viewsByVariant: { shared: stageViews([SH], { hMax: 2400 }), fig8: stageViews([F8], { hMax: 2400 }), quartet: stageViews([QU], { hMax: 2600 }) },
  extraSurfaces: E04_SURFACES,
  mountRule: { boom: 'level', fallback: v3(0, 0, 1), length: 700, fixed: true },
});

/* ── the duet's handhelds (live) ── */
const handSpec = (id: string) =>
  stageRow({
    id,
    variant: 'shared',
    micTypeIds: ['vocDynCard', 'vocDynSuper'],
    label: 'A handheld each, within about 10 cm',
    band: 'For a live duet with a mic each: the handheld within about 10 cm (4 in) of the lips, on the mouth’s axis, the grille clear — a short distance each singer can repeat, a little farther for a loud phrase.',
  });
const HAND_HI = voiceZone(E04_MODEL, singerAnchor(SH, 'hi.1'), handSpec('du.hand'), MIC_TYPES, { surface: E04_SURFACES[0].id });
const HAND_LO = voiceZone(E04_MODEL, singerAnchor(SH, 'lo.1'), handSpec('du.hand2'), MIC_TYPES, { surface: E04_SURFACES[1].id });
export const E04_HANDS_31 = threeToOneMics(HAND_HI.start.p, seatById(SH, 'hi.1'), HAND_LO.start.p, seatById(SH, 'lo.1'));

/* ── the quartet's individual cardioids (studio) ── */
const indSpec = (id: string) =>
  fartherRow({
    id,
    variant: 'quartet',
    micTypeIds: ['arrCard'],
    label: 'A cardioid each, about 20–30 cm away',
    band: 'For a cappella with a mic each: a cardioid about 20–30 cm (8–12 in) from each singer’s lips, on the mouth’s axis — the mics at least three times that distance apart from each other.',
    start: { d: [220, 225, 230, 215, 240] },
    tendency: 'Independent control of each voice; close mics expose breath, mouth noise and small timing differences that one pair would blend.',
    checks: ['The 3:1 spacing to the next mic', 'Breath and consonants', 'The sum in mono'],
  });
const IND_S = voiceZone(E04_MODEL, singerAnchor(QU, 'sop.1'), indSpec('du.ind'), MIC_TYPES, { surface: E04_SURFACES[2].id });
const IND_A = voiceZone(E04_MODEL, singerAnchor(QU, 'alt.1'), indSpec('du.ind2'), MIC_TYPES, { surface: E04_SURFACES[3].id });
export const E04_IND_31 = threeToOneMics(IND_S.start.p, seatById(QU, 'sop.1'), IND_A.start.p, seatById(QU, 'alt.1'));
/** The same cardioids at 30 cm (1 ft): the lesson's 3:1 example needs 90 cm between mics — 75 cm singers are too close. */
const at30 = (seat: string) => {
  const q = seatById(QU, seat);
  const V = singerAnchor(QU, seat);
  const p = v3(V.lip.x + V.fwd.x * 300, V.lip.y, V.lip.z + V.fwd.z * 300);
  return { pose: toward(p, lipOf(q)), seat: q };
};
const S30 = ['sop.1', 'alt.1', 'ten.1', 'bas.1'].map(at30);
export const E04_30_31 = threeToOneMics(S30[0].pose.p, S30[0].seat, S30[1].pose.p, S30[1].seat);

/* ── a shared mic, a figure-8, the quartet's pair ── */
const SH_MID = v3(0, -LIP, (lipOf(seatById(SH, 'hi.1')).z + lipOf(seatById(SH, 'lo.1')).z) / 2);
export const SHARED_POSE = toward(M_SH, SH_MID);
/** The figure-8's front faces the lower voice (+x); its back the higher. */
export const FIG8_POSE = toward(M_F8, v3(M_F8.x + 500, M_F8.y, M_F8.z));
/** The quartet's lips: the acoustic centre, and the pair in front of it. */
const QU_C = v3(0, -LIP, QU.seats.map(lipOf).reduce((a, q) => a + q.z, 0) / QU.seats.length);
export const QU_PAIR = v3(0, -(LIP + 250), 950);
export const QU_PAIR_POSE = toward(QU_PAIR, QU_C);
/** The exercise: one singer 6 in (152.4 mm) closer to a mic 40 cm away — the level change by distance alone. */
export const SIX_IN_DB = distanceSwingDb(SHARED_R.arc - 152.4, SHARED_R.arc);

export const E04_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'du.shared',
    label: 'One mic, the duet on a semicircle in front',
    band: 'One cardioid (or omni) at the singers’ mouth height, the two of them on a semicircle in front of it — each mouth the same distance away. The nearer singer would dominate, and sound bassier.',
    kind: 'sourced',
    src: 'AKG-C414',
    quote: 'select the cardioid or omni pattern and place the vocalists in a semicircle in front of the microphone (§4.6.2); "Keep mouths at comparable distances from the capsule" (the lesson L10)',
    bandProv: ill('the semicircle’s radius (40 cm) and the mic within ±10 cm of the mouths’ height: drawing defaults'),
    ref: 'floor',
    d: [LIP - 100, LIP + 100],
    box: { min: v3(-150, -(LIP + 100), -150), max: v3(150, -(LIP - 100), 150) },
    start: SHARED_POSE,
    variants: ['shared'],
    micTypeIds: ['grpLdc'],
    tendency: 'A coherent blend and the singers’ interaction; the room and their distances set the tone, with little to correct afterwards.',
    checks: ['Both mouths at a matched distance', 'Unison and harmony', 'Small distance changes for dynamics'],
  }),
  HAND_HI,
  HAND_LO,
  mainZone({
    id: 'du.fig8',
    label: 'A figure-8 between two singers',
    band: 'For a duet in a controlled room: a figure-8 between the two singers, one in each lobe, both mouths on its axis at a matched distance — its dead sides to the room. Turn or angle it only while listening to both.',
    kind: 'trial',
    src: 'LESSON-DUET',
    quote: 'a bidirectional figure-eight microphone can put one singer in each lobe … the side nulls and strong proximity effect make position critical (L11)',
    bandProv: ill('each mouth 30 cm from the mic, at its height within ±10 cm: drawing defaults'),
    ref: 'floor',
    d: [LIP - 100, LIP + 100],
    box: { min: v3(M_F8.x - 100, -(LIP + 100), M_F8.z - 100), max: v3(M_F8.x + 100, -(LIP - 100), M_F8.z + 100) },
    start: FIG8_POSE,
    variants: ['fig8'],
    micTypeIds: ['grpLdc'],
    tendency: 'Two voices on one channel with the room’s sides rejected; strong proximity effect, so small moves change the balance a lot.',
    checks: ['Both mouths on the axis, matched', 'Nothing loud behind either singer', 'Small moves, listening to both'],
  }),
  mainZone({
    id: 'du.pair',
    label: 'A pair at the group’s acoustic centre',
    band: 'In a good room: a coincident or 17 cm pair in front of the group, aimed at its acoustic centre, far enough back that all the singers sit inside its angle — about 0.6–1.8 m (2–6 ft) here — and a little above the mouths.',
    kind: 'trial',
    src: 'LESSON-DUET',
    quote: 'Aim the pair at the group’s acoustic center and arrange the singers so the group fills the intended pickup angle (L13); ORTF recording angle 95° (SCH-MSTC74)',
    bandProv: ill('0.6–1.8 m in front and up to 0.5 m above the mouths: the lab’s drawing; the group fills a 17 cm pair’s 95° from about 0.9 m (DERIVED from the drawn 2.25 m width)'),
    ref: 'front',
    d: [600, 1800],
    box: { min: v3(-400, -(LIP + 500), 600), max: v3(400, -(LIP - 100), 1800) },
    start: QU_PAIR_POSE,
    variants: ['quartet'],
    micTypeIds: ['arrCard', 'arrOmni', 'arrFig8'],
    tendency: 'The group’s own blend and image, with the room; limited correction afterwards.',
    checks: ['Every singer inside the pair’s angle', 'The room’s quality', 'The sum in mono'],
  }),
  IND_S,
  IND_A,
];

/** A wedge in front of the duet, between them, facing back: a typical stage. */
export const E04_WEDGES: Wedge[] = [
  { id: 'wedge', label: 'a floor wedge in front of the duet, facing back at them', short: 'WEDGE', p: v3(0, 0, 700), lift: 250, faces: v3(0, 0, -1), note: 'On the floor in front of the two singers, facing back: behind and below each handheld aimed at a mouth — the pattern and the tilt decide how much it hears.', prov: ill('in front of the singers = behind their mics (S-VOC-TIPS, S-SM58-UG); the distance a drawing default') },
];

/* ── STARTING SETUPS ── */
const one = (id: 'one' | 'oneOmni' | 'oneFig8' | 'b2b', pose: MicPose, face: number, dimTo: Vec3) => ({ id, params: {}, place: { c: pose.p, face, tilt: Math.max(0, -pose.el) }, mount: { kind: 'stand' as const }, dimTo });
const F8_LO = lipOf(seatById(F8, 'lo.1'));
const hand = (key: string, z: DocumentedZone, seat: string, label: string) => ({ key, p: z.start.p, aim: dirOf(z.start.az, z.start.el), pattern: 'cardioid' as const, label, art: 'vocalDynamic' as const, dimTo: lipOf(seatById(SH, seat)), aimLen: 260, boomDir: v3(0, 0, 1) });
const card = (key: string, pose: MicPose, label: string) => ({ key, p: pose.p, aim: dirOf(pose.az, pose.el), pattern: 'cardioid' as const, label, aimLen: 400 });
const rig = (id: 'xy' | 'ortf' | 'ab', params = {}) => ({ id, params, place: { c: QU_PAIR, face: 0, tilt: Math.max(0, -QU_PAIR_POSE.el) }, mount: { kind: 'stand' as const } });

export const E04_SETUPS: EnsembleSetup[] = [
  { id: 'one', role: 'ONE MIC · CARDIOID', title: 'One cardioid, the duet on a semicircle in front', variants: ['shared'], rig: one('one', SHARED_POSE, 0, lipOf(seatById(SH, 'hi.1'))), mics: 'One large-diaphragm condenser, cardioid, on a stand at mouth height.', start: `Each mouth about ${SHARED_R.arc / 10} cm away, matched; the nearer singer would dominate. A step of 15 cm (6 in) closer is about ${SIX_IN_DB.toFixed(0)} dB louder by distance alone.`, line: 'A coherent, natural blend and interaction; limited individual control.', core: true, view: 'plan' },
  { id: 'omni', role: 'ONE MIC · OMNI', title: 'The same mic set to omni', variants: ['shared'], rig: one('oneOmni', SHARED_POSE, 0, lipOf(seatById(SH, 'hi.1'))), mics: 'The same large condenser, switched to omni.', start: 'The same place, in a quiet, good-sounding room; no proximity boost for whoever is nearer.', line: 'More of the room, an even sound all round; not a loud-stage choice.', core: true, view: 'plan' },
  { id: 'hands', role: 'A MIC EACH · LIVE', title: 'A handheld each, within 10 cm', short: 'HANDHELDS', variants: ['shared'], singles: [hand('h', HAND_HI, 'hi.1', 'HIGH'), hand('l', HAND_LO, 'lo.1', 'LOW')], mics: 'Two handheld vocal dynamics, cardioid or supercardioid, each on its own boom stand.', start: `Each within about 10 cm of its singer’s lips; the two mics ${(E04_HANDS_31.d / 100).toFixed(0)} cm apart — far past 3:1.`, line: 'Independent level and a margin before feedback on a stage; check the wedge against each pattern.', core: true, view: 'plan', focus: ['hi.1', 'lo.1'] },
  { id: 'fig8', role: 'ONE FIGURE-8', title: 'A figure-8 between two singers', variants: ['fig8'], rig: one('oneFig8', FIG8_POSE, 90, F8_LO), mics: 'One large-diaphragm condenser set to figure-8, its front to one singer, its back to the other.', start: `Each mouth about ${SHARED_R.fig8 / 10} cm away, on the axis; the dead sides face the room.`, line: 'Two voices efficiently on one channel; the proximity effect and the rear lobe make every move count.', core: true, view: 'plan' },
  { id: 'b2b', role: 'TWO CARDIOIDS · BACK TO BACK', title: 'Two cardioids back to back, one per singer', variants: ['fig8'], rig: one('b2b', FIG8_POSE, 90, F8_LO), mics: 'Two large-diaphragm cardioids back to back, between the singers.', start: 'Each singer in front of their own cardioid, the same distance away.', line: 'Each voice on its own channel, the other at the back of its pattern; still check the sum in mono.', core: true, view: 'plan' },
  { id: 'xy', role: 'PAIR · COINCIDENT', title: 'An X/Y pair at the group’s centre', variants: ['quartet'], rig: rig('xy', { angle: 110 }), mics: 'Two matched cardioid small condensers, capsules together.', start: 'In front of the quartet’s acoustic centre, a little above the mouths, far enough back that all four sit inside its angle.', line: 'A stable, compatible image of the group; check the outer singers.', core: true, view: 'plan' },
  { id: 'ortf', role: 'PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair at the group’s centre', variants: ['quartet'], rig: rig('ortf'), mics: 'Two cardioid small condensers, 17 cm apart, 110° between them.', start: 'The same place: from here the quartet fills its 95° recording angle.', line: 'A wider image with more separation; check the mono sum.', core: true, view: 'plan' },
  { id: 'ind', role: 'A MIC EACH · STUDIO', title: 'A cardioid each, 3:1 apart', short: 'A MIC EACH', variants: ['quartet'], singles: [card('s', IND_S.start, 'S'), card('a', IND_A.start, 'A'), ...['ten.1', 'bas.1'].map((seat, i) => card(['t', 'b'][i], at22(seat), ['T', 'B'][i]))], mics: 'Four cardioid small condensers, one per singer, each on its own stand.', start: `About 22 cm from each singer’s lips; the mics about ${(E04_IND_31.d / 100).toFixed(0)} cm apart — at least three times that distance (≈ ${E04_IND_31.ratio.toFixed(1)}:1).`, line: 'Independent level, pan and edits; more stands, bleed and phase paths — and every breath exposed.', core: true, view: 'plan' },
  { id: 'ind30', role: 'A MIC EACH · TOO FAR', title: 'The same cardioids at 30 cm', short: 'A MIC EACH', variants: ['quartet'], singles: S30.map((q, i) => card(`m${i}`, q.pose, ['S', 'A', 'T', 'B'][i])), mics: 'The same four cardioids, each about 30 cm (1 ft) from its singer.', start: `3:1 would need about 90 cm (3 ft) between the mics; these singers stand 75 cm apart, so it is only ≈ ${E04_30_31.ratio.toFixed(1)}:1. Move the mics closer, use fewer, or space the singers.`, line: 'More bleed between neighbours and a deeper comb in mono — when 3:1 cannot be met, change the geometry.', core: false, view: 'plan' },
  { id: 'ab', role: 'PAIR · SPACED', title: 'A spaced omni pair', variants: ['quartet'], rig: rig('ab', { spacing: 500 }), mics: 'Two omni small condensers, 50 cm apart.', start: 'The same place, in an excellent, quiet room only.', line: 'Natural and spacious; more room, timing difference and stage noise.', core: false, view: 'front' },
];
/** A quartet singer's cardioid 22 cm out (the setups' third and fourth). */
function at22(seat: string): MicPose {
  const V = singerAnchor(QU, seat);
  return toward(v3(V.lip.x + V.fwd.x * 220, V.lip.y, V.lip.z + V.fwd.z * 220), V.lip);
}

export const E04_PLACE: PlaceZone[] = [
  { id: 'pz.matched', label: 'In the middle, at mouth height', band: 'In front of the semicircle’s middle, within about 10 cm of the mouths’ height — both mouths the same distance away.', box: { min: v3(-150, -(LIP + 100), -150), max: v3(150, -(LIP - 100), 150) }, variants: ['shared'], tendency: 'A matched duet: neither voice leads by distance.' },
  { id: 'pz.over', label: 'A little higher, angled down', band: 'About 10–35 cm above the mouths, aimed down between them.', box: { min: v3(-150, -(LIP + 350), -150), max: v3(150, -(LIP + 100), 150) }, variants: ['shared'], tendency: 'Out of the breath; a little more room.' },
  { id: 'pz.f8mid', label: 'Halfway between the singers', band: 'Exactly between the two mouths, at their height — the same distance to each.', box: { min: v3(M_F8.x - 60, -(LIP + 100), M_F8.z - 100), max: v3(M_F8.x + 60, -(LIP - 100), M_F8.z + 100) }, variants: ['fig8'], tendency: 'Both voices matched on the axis; the room at the dead sides.' },
  { id: 'pz.f8near', label: 'A little nearer the lower voice', band: 'About 6–16 cm toward the lower singer — for a voice that needs a little help.', box: { min: v3(M_F8.x + 60, -(LIP + 100), M_F8.z - 100), max: v3(M_F8.x + 160, -(LIP - 100), M_F8.z + 100) }, variants: ['fig8'], tendency: 'The nearer voice louder and fuller (the proximity effect is strong in a figure-8).' },
  { id: 'pz.qNear', label: 'Near: 0.6–1.0 m in front', band: 'About 0.6–1.0 m (2–3 ft) in front of the group, a little above the mouths.', box: { min: v3(-400, -(LIP + 500), 600), max: v3(400, -(LIP - 100), 1000) }, variants: ['quartet'], tendency: 'More of each voice and the words; the outer singers near the edge of the pair’s angle.' },
  { id: 'pz.qFar', label: 'Farther: 1.0–1.8 m in front', band: 'About 1.0–1.8 m (3–6 ft) in front, a little above the mouths — the whole group inside the pair’s angle.', box: { min: v3(-400, -(LIP + 500), 1000), max: v3(400, -(LIP - 100), 1800) }, variants: ['quartet'], tendency: 'More blend and room; the group inside the angle.' },
];
