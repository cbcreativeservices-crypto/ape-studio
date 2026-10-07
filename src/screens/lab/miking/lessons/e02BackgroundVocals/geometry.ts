/**
 * E02 BACKGROUND AND HARMONY VOCALS — where things are, frame S, the singers
 * frame V's (lessons/shared/voice: every vocal distance from the LIPS).
 * Research: docs/labs/miking/background_vocals/ (SOURCES.md,
 * GEOMETRY_PROPOSAL.md); 3:1 = lead_vocal/SOURCES.md §0.2 (mic to mic);
 * corrections E2-* in CORRECTIONS_LOG.md.
 *
 *   LIVE    three backing singers in a row ('vocal.line'): a handheld each
 *           about 1.5–3 in (38–76 mm) from the lips (S-VOC-TIPS), the three
 *           mics 1.1 m apart — far past 3:1 at that distance; or one group
 *           mic in front and a little above (S-CHOIR; S-LIVE's choral row)
 *   SHARED  three singers on an arc round ONE large condenser, each mouth
 *           the same distance from it (the arc's radius 40 cm: a DRAWING
 *           DEFAULT — S-BLUEGRASS gives the method, not the number); they
 *           balance by stepping in and out
 *   STUDIO  four singers in a circle round one omni, or round two cardioids
 *           back to back (S-REC; the circle's 50 cm a drawing default)
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { aimOf, dirOf, sub, v3 } from '../shared/ensemble/frameS.ts';
import { seatingOf, type Seating } from '../shared/ensemble/seating.ts';
import { lipOf, SHARED_AT, SHARED_R, VOX } from '../shared/ensemble/seatingVoices.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews } from '../shared/ensemble/ensembleModel.ts';
import { mouthSurfaceFor, seatById, singerAnchor, threeToOneMics } from '../shared/ensemble/voiceGroup.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { ON_AXIS } from '../shared/voice/voiceStarts.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E02_SEATS = { live: seatingOf('vocal.line'), shared: seatingOf('vocal.shared'), studio: seatingOf('vocal.circle') } as const;
const LI = E02_SEATS.live;
const SH = E02_SEATS.shared;
const ST = E02_SEATS.studio;
const toward = (from: Vec3, to: Vec3): MicPose => ({ p: from, ...aimOf(sub(to, from)) });

/** S-VOC-TIPS: "Background vocals: usually 1.5 to 3 inches" (conv. 38.1–76.2 mm). */
export const BACKING = { min: 38.1, max: 76.2 } as const;
/** S-VOC-TIPS: loud / belting "6 inches to arm's length" — arm's length drawn as 60 cm (a drawing default). */
export const BELT = { min: 152.4, max: 600 } as const;
/** S-LIVE's choral row, from the singers' heads (for a group mic over a line). */
const LIVE = { above: { min: 304.8, max: 914.4 }, ahead: { min: 609.6, max: 1219.2 } } as const;
const above = (h: number) => -(VOX.adult.head + h);

export const E02_SURFACES = [mouthSurfaceFor('live', LI, 'mid.1', sectionPartId('live', 'mid')), mouthSurfaceFor('live', LI, 'hi.1', sectionPartId('live', 'hi')), mouthSurfaceFor('live', LI, 'lo.1', sectionPartId('live', 'lo'))];
export const E02_MODEL = ensembleModel({
  id: 'e02-backing',
  name: 'backing singers',
  variants: [
    { id: 'live', label: 'On a stage, a mic each', short: 'Live', blurb: LI.blurb, seating: LI },
    { id: 'shared', label: 'Round one shared mic', short: 'Shared', blurb: SH.blurb, seating: SH },
    { id: 'studio', label: 'A studio circle', short: 'Studio', blurb: ST.blurb, seating: ST },
  ],
  views: stageViews([LI, SH, ST], { hMax: 2600 }),
  viewsByVariant: { live: stageViews([LI], { hMax: 2600 }), shared: stageViews([SH], { hMax: 2400 }), studio: stageViews([ST], { hMax: 2400 }) },
  extraSurfaces: E02_SURFACES,
});

/** A backing singer's handheld: 38–76 mm from the lips, on the mouth's axis. */
const handRow = (id: string, variant: string): VoiceZoneSpec => ({
  id,
  label: 'A handheld close to the lips, on the axis',
  band: 'For live backing vocals, try the handheld about 4–8 cm (1.5–3 in) from the lips, on the mouth’s axis — closer for quiet phrases, farther for loud ones. The lips stay off the grille, and the grille stays open.',
  kind: 'sourced',
  src: 'S-VOC-TIPS',
  quote: 'Background vocals: usually 1.5 to 3 inches (2 fingers to 4 fingers); greater distance for loud belting and closer distance for quiet phrases',
  distance: BACKING,
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['vocDynCard', 'vocDynSuper'],
  variant,
  start: { d: [57, 55, 60, 50, 65, 70], at: 'mouth' },
  tendency: 'A close, clear part with little of the stage; very close it gains low end (the proximity effect). Matching the distance across the singers keeps the stack even.',
  checks: ['The grille open, never cupped', 'The loudest phrase: back off a little', 'The neighbour’s voice in this mic, and the 3:1 spacing'],
});
const HAND_MID = voiceZone(E02_MODEL, singerAnchor(LI, 'mid.1'), handRow('bv.hand', 'live'), MIC_TYPES, { surface: E02_SURFACES[0].id });
const HAND_HI = voiceZone(E02_MODEL, singerAnchor(LI, 'hi.1'), handRow('bv.hand2', 'live'), MIC_TYPES, { surface: E02_SURFACES[1].id });
const HAND_LO = voiceZone(E02_MODEL, singerAnchor(LI, 'lo.1'), handRow('bv.hand3', 'live'), MIC_TYPES, { surface: E02_SURFACES[2].id });
/** The three handhelds' 3:1 readout (mid against high). */
export const E02_31 = threeToOneMics(HAND_MID.start.p, seatById(LI, 'mid.1'), HAND_HI.start.p, seatById(LI, 'hi.1'));

/** The group mic over the line: 0.75 m in front, 0.45 m above the heads, aimed at the middle singer. */
export const GROUP_AT = v3(0, above(450), 750);
const MID_LIPS = lipOf(seatById(LI, 'mid.1'));

/* ── the shared mic and the studio circle ── */
const SH_MID = lipOf(seatById(SH, 'mid.1'));
export const SHARED_POSE = toward(SHARED_AT['vocal.shared'], SH_MID);
const CIRCLE = SHARED_AT['vocal.circle'];
// Aimed upstage, between the two upstage singers: its stand's boom runs
// downstage between the other two (an omni hears all four the same).
export const CIRCLE_POSE = toward(CIRCLE, v3(CIRCLE.x, CIRCLE.y, CIRCLE.z - 500));

export const E02_ZONES: DocumentedZone[] = [
  HAND_MID,
  HAND_HI,
  mainZone({
    id: 'bv.shared',
    label: 'One shared mic, at the singers’ mouth height',
    band: 'One large condenser on a stand at the singers’ mouth height, the singers round its front, each mouth about the same distance from it — set the distance and mark the floor in rehearsal. The loudest singer steps back.',
    kind: 'trial',
    src: 'S-BLUEGRASS',
    quote: 'band members "gracefully move in and out of the mic pattern"; "They mix themselves using few or (more likely) no monitors" (S-BLUEGRASS); the semicircle in front of a cardioid or omni (AKG-C414 §4.6.2)',
    bandProv: ill('no source gives the distance: the drawing puts the mouths 40 cm away (the geometry proposal’s drawing default) and the mic within ±10 cm of their height'),
    ref: 'floor',
    d: [VOX.adult.lip - 100, VOX.adult.lip + 100],
    box: { min: v3(-150, -(VOX.adult.lip + 100), -150), max: v3(150, -(VOX.adult.lip - 100), 150) },
    start: SHARED_POSE,
    variants: ['shared'],
    micTypeIds: ['grpLdc'],
    tendency: 'A natural blend the singers make themselves, with the room; less control of any one voice afterwards.',
    checks: ['Every mouth at a matched distance', 'The loudest singer a step back', 'Nobody at the side of the pattern'],
  }),
  mainZone({
    id: 'bv.circle',
    label: 'One omni in the middle of the circle',
    band: 'In a quiet, good-sounding studio: one omni at mouth height in the middle, the singers round it, each balancing by stepping in or out.',
    kind: 'sourced',
    src: 'S-REC',
    quote: 'Having the vocalists circle around an omnidirectional mic, and changing their individual levels and timbres to create a blend (Ensemble Vocals p.6)',
    bandProv: ill('the circle’s 50 cm radius and the mic within ±10 cm of the mouths’ height: drawing defaults'),
    ref: 'floor',
    d: [VOX.adult.lip - 100, VOX.adult.lip + 100],
    box: { min: v3(CIRCLE.x - 150, -(VOX.adult.lip + 100), CIRCLE.z - 150), max: v3(CIRCLE.x + 150, -(VOX.adult.lip - 100), CIRCLE.z + 150) },
    start: CIRCLE_POSE,
    variants: ['studio'],
    micTypeIds: ['grpLdc'],
    tendency: 'Every voice with the room, from one place: a blend that is hard to repair if one singer dominates.',
    checks: ['The weakest and the strongest voice', 'The room: quiet and flattering', 'A repeatable arrangement'],
  }),
  mainZone({
    id: 'bv.group',
    label: 'A group mic in front, a little above',
    band: 'For a larger group: the fewest mics — one directional condenser about 0.6–1.2 m (2–4 ft) in front and a little above the singers, aimed at the middle of the group; adjust it while they sing.',
    kind: 'sourced',
    src: 'S-CHOIR',
    quote: 'slightly above the singers and aiming toward the center row (S-CHOIR); "1 to 3 feet above and 2 to 4 feet in front of the first row" (S-LIVE, choral)',
    ref: 'front',
    d: [LIVE.ahead.min, LIVE.ahead.max],
    box: { min: v3(-600, above(LIVE.above.max), LIVE.ahead.min), max: v3(600, above(LIVE.above.min), LIVE.ahead.max) },
    start: toward(GROUP_AT, MID_LIPS),
    variants: ['live'],
    micTypeIds: ['arrCard'],
    tendency: 'The group as one texture with the stage around it: more room and spill, less control of each part.',
    checks: ['Each part’s balance by ear', 'The band in the mic', 'The monitor against the pattern'],
  }),
];

/** A wedge in front of the middle singer (behind the handheld): a typical stage. */
export const E02_WEDGES: Wedge[] = [
  { id: 'wedge', label: 'the middle singer’s floor wedge, in front, facing back at them', short: 'WEDGE', p: v3(0, 0, 900), lift: 250, faces: v3(0, 0, -1), note: 'On the floor about a metre in front of the middle singer, facing back: behind a handheld aimed at the mouth, and well below it — the pattern and the tilt both decide how much it hears.', prov: ill('in front of the singer = behind the mic (S-VOC-TIPS, S-SM58-UG); the distance a drawing default') },
];

/* ── STARTING SETUPS ── */
const hand = (key: string, z: DocumentedZone, seat: string, label: string) => ({ key, p: z.start.p, aim: dirOf(z.start.az, z.start.el), pattern: 'cardioid' as const, label, art: 'vocalDynamic' as const, dimTo: lipOf(seatById(LI, seat)), aimLen: 300 });
/** A large condenser on a stand, facing `face` in plan and tilted down to its pose's aim. */
const ldc = (id: 'one' | 'oneOmni' | 'b2b', pose: MicPose, face: number, dimTo: Vec3) => ({ id, params: {}, place: { c: pose.p, face, tilt: Math.max(0, -pose.el) }, mount: { kind: 'stand' as const }, dimTo });
const ST_SOP = lipOf(seatById(ST, 'sop.1'));

export const E02_SETUPS: EnsembleSetup[] = [
  { id: 'hand', role: 'A MIC EACH · CLOSE', title: 'A handheld on a stand, close to the lips', short: 'HANDHELD', variants: ['live'], singles: [hand('m', HAND_MID, 'mid.1', 'HANDHELD')], mics: 'A handheld vocal dynamic, cardioid (or supercardioid), in a clip on a boom stand.', start: 'About 4–8 cm (1.5–3 in) from the lips, on the mouth’s axis — the lips off the grille, the grille never cupped.', line: 'Each part under its own fader; closer for quiet lines, back a little for loud ones.', core: true, view: 'section', focus: ['mid.1'] },
  { id: 'hand3', role: 'A MIC EACH · THE ROW', title: 'Three handhelds, 1.1 m apart', short: 'HANDHELDS', variants: ['live'], singles: [hand('h', HAND_HI, 'hi.1', 'HIGH'), hand('m', HAND_MID, 'mid.1', 'MIDDLE'), hand('l', HAND_LO, 'lo.1', 'LOW')], mics: 'Three handheld vocal dynamics, one per singer, each on its own boom stand.', start: `Each about 6 cm from its singer’s lips; the mics ${(E02_31.d / 1000).toFixed(1)} m apart — 3:1 needs only ${Math.round(E02_31.need / 10)} cm at this distance.`, line: 'Individual control and isolation; more stands, channels and phase paths — check the sum in mono.', core: true, view: 'plan' },
  { id: 'group', role: 'ONE GROUP MIC', title: 'One directional condenser in front, a little above', short: 'GROUP MIC', variants: ['live'], rig: ldc('one', toward(GROUP_AT, MID_LIPS), 0, MID_LIPS), mics: 'One large-diaphragm condenser, cardioid, on a tall stand.', start: 'About 0.75 m (2.5 ft) in front and a little above the heads, aimed at the middle singer; adjusted while they sing.', line: 'The group as one texture: more room and spill, less control of each part.', core: false, view: 'section' },
  { id: 'shared', role: 'ONE SHARED MIC', title: 'Three singers round one large condenser', variants: ['shared'], rig: ldc('one', SHARED_POSE, 0, SH_MID), mics: 'One large-diaphragm condenser, cardioid, on a stand at mouth height.', start: `Each mouth about ${SHARED_R.arc / 10} cm from the mic, round its front; the loudest singer a step back. Mark the floor and the stand height in rehearsal.`, line: 'A natural blend the singers make by distance; it needs choreography, and gives less control afterwards.', core: true, view: 'plan' },
  { id: 'sharedXY', role: 'ONE PAIR, SHARED', title: 'An X/Y pair in the middle instead', variants: ['shared'], rig: { id: 'xy', params: { angle: 110 }, place: { c: SHARED_POSE.p, face: 0, tilt: 0 }, mount: { kind: 'stand' }, dimTo: SH_MID }, mics: 'Two matched cardioid small condensers, capsules together, on one stand.', start: 'In the same place, at mouth height; the singers spread across its front.', line: 'The same self-balanced group, with a stereo picture; check the sides and the mono sum.', core: true, view: 'plan' },
  { id: 'omni', role: 'A CIRCLE · ONE OMNI', title: 'Four singers round one omni', variants: ['studio'], rig: ldc('oneOmni', CIRCLE_POSE, 0, ST_SOP), mics: 'One large-diaphragm condenser set to omni, at mouth height in the middle.', start: `The singers in a circle, each mouth about ${SHARED_R.circle / 10} cm from it; each one balances by stepping in or out.`, line: 'Shared room and interaction; a weak or dominant voice is hard to repair afterwards.', core: true, view: 'plan' },
  { id: 'b2b', role: 'A CIRCLE · BACK TO BACK', title: 'Two cardioids back to back', variants: ['studio'], rig: ldc('b2b', { p: CIRCLE, az: 0, el: 0 }, 0, ST_SOP), mics: 'Two large-diaphragm cardioids, back to back, at mouth height in the middle.', start: 'Two singers in front of each, nobody at the sides, where both hear less.', line: 'More separation between the two sides than an omni circle, the group still singing together; check mono.', core: true, view: 'plan' },
];

export const E02_PLACE: PlaceZone[] = [
  { id: 'pz.matched', label: 'In the middle, at mouth height', band: 'In the middle of the arc, within about 10 cm of the singers’ mouth height — every mouth about the same distance away.', box: { min: v3(-150, -(VOX.adult.lip + 100), -150), max: v3(150, -(VOX.adult.lip - 100), 150) }, variants: ['shared'], tendency: 'Matched distances: the singers balance themselves; a step in or out is a clear change.' },
  { id: 'pz.over', label: 'A little higher, angled down', band: 'About 10–35 cm above the mouths, aimed down at the middle singer — out of the breath, the faces clear.', box: { min: v3(-150, -(VOX.adult.lip + 350), -150), max: v3(150, -(VOX.adult.lip + 100), 150) }, variants: ['shared'], tendency: 'Less breath and fewer pops; a little more of the room, the singers’ faces clear.' },
  { id: 'pz.centre', label: 'The middle of the circle', band: 'In the middle of the circle, within about 10 cm of the mouths’ height.', box: { min: v3(CIRCLE.x - 150, -(VOX.adult.lip + 100), CIRCLE.z - 150), max: v3(CIRCLE.x + 150, -(VOX.adult.lip - 100), CIRCLE.z + 150) }, variants: ['studio'], tendency: 'Every singer at the same distance; the blend is theirs to make.' },
  { id: 'pz.cHigh', label: 'Above the circle, a little', band: 'About 10–35 cm above the mouths, in the middle.', box: { min: v3(CIRCLE.x - 150, -(VOX.adult.lip + 350), CIRCLE.z - 150), max: v3(CIRCLE.x + 150, -(VOX.adult.lip + 100), CIRCLE.z + 150) }, variants: ['studio'], tendency: 'Out of the breath stream; a little more room.' },
  { id: 'pz.gNear', label: 'Group mic: 0.6–0.9 m in front', band: 'About 0.6–0.9 m (2–3 ft) in front of the singers, 0.3–0.9 m (1–3 ft) above their heads.', box: { min: v3(-600, above(LIVE.above.max), LIVE.ahead.min), max: v3(600, above(LIVE.above.min), 914.4) }, variants: ['live'], tendency: 'More of each voice, less of the stage.' },
  { id: 'pz.gFar', label: 'Group mic: 0.9–1.2 m in front', band: 'About 0.9–1.2 m (3–4 ft) in front, 0.3–0.9 m above the heads.', box: { min: v3(-600, above(LIVE.above.max), 914.4), max: v3(600, above(LIVE.above.min), LIVE.ahead.max) }, variants: ['live'], tendency: 'More blend between the parts, and more of the stage around them.' },
];

/** The singers on the arc, for the tests: every mouth the same distance from the shared mic. */
export const sharedDistances = (s: Seating = SH) => s.seats.map((q) => Math.hypot(lipOf(q).x - SHARED_AT['vocal.shared'].x, lipOf(q).y - SHARED_AT['vocal.shared'].y, lipOf(q).z - SHARED_AT['vocal.shared'].z));
