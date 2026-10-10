/**
 * B09 COMMENTATORS AND ANNOUNCE POSITIONS — where things are (charter §2
 * layer 2). Frame V on the COMMENTATOR (the play-by-play voice: the lip point
 * at the origin, +x straight out of the mouth toward the field, +y DOWN, +z
 * to their right, mm), seated at the commentary desk (shared/broadcast/
 * talkerPose.ts: the desk top 450 mm below the lips). Three positions (the
 * variants):
 *
 *   booth   A COMMENTARY BOOTH: the commentator and the analyst side by
 *           side, 0.9 m apart, both on closed-ear headsets with a boom, a
 *           window to the field in front, a screen and notes on the desk.
 *   open    AN OPEN POSITION: the commentator alone at a rail with nothing
 *           between them and the stadium — the crowd in front and below, a
 *           PA cluster high to the front-left — a lip ribbon held to the
 *           mouth.
 *   studio  A QUIET BOOTH OR STUDIO: the commentator calling from a screen,
 *           a broadcast dynamic on a desk arm.
 *
 * Sources: docs/labs/miking/commentators/SOURCES.md, GEOMETRY_PROPOSAL.md.
 * Every position is a DRAWING DEFAULT: the desk (1.8 × 0.75 m), the seats
 * (0.9 m apart), the window, the screen, the PA's place, the arm's clamp.
 */
import type { InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { DESK_TOP_Y, HOST, SEATED, SEATED_FLOOR, type Talker } from '../shared/broadcast/talkerPose.ts';
import { REACH_PART, VOICE_IDS, deskArm, talkerIds, talkerParts, talkerVoice } from '../shared/broadcast/talkerModel.ts';
import { SHOULDER_R } from '../shared/broadcast/standing.ts';
import { BOOTH } from '../shared/broadcast/boothPlan.ts';
import { EAR, EAR_HALF } from '../shared/voice/voiceSpec.ts';
import { onTalker } from '../shared/broadcast/talkerPose.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (commentators/GEOMETRY_PROPOSAL.md §3)');

/** The commentator at the origin; the analyst 0.9 m to their right. */
export const CALLER: Talker = HOST;
export const ANALYST: Talker = { id: 'analyst', lip: v3(0, 0, BOOTH.seatGap.mm), facing: 1 };
export const IDS_A = VOICE_IDS;
export const IDS_B = talkerIds('b9B');

/** The commentary desk: 0.75 m deep from just in front of the lips, 1.8 m
 *  wide round the two seats. */
const MIDZ = BOOTH.seatGap.mm / 2;
export const DESK = { min: v3(SEATED.deskEdge.mm, DESK_TOP_Y, MIDZ - BOOTH.deskW.mm / 2), max: v3(SEATED.deskEdge.mm + BOOTH.deskD.mm, DESK_TOP_Y + SEATED.deskThick.mm, MIDZ + BOOTH.deskW.mm / 2) };
/** The window (booth, studio) or the open rail, just beyond the desk. */
export const FRONT_X = DESK.max.x + 220;
/** The screen on the desk between the two, facing them; the notes in front of the caller. */
export const SCREEN = v3(560, DESK_TOP_Y, MIDZ);
export const NOTES = v3(330, DESK_TOP_Y, -60);
/** The desk arm (studio): its clamp on the desk's left SIDE edge, 39 cm back, reaching forward over the desk (owner 2026-10-10). */
export const GRIP_A = v3(DESK.min.x + 390, DESK_TOP_Y - 120, DESK.min.z + 20);
/** The PA cluster (open): high to the front-left of the position, facing the crowd. */
export const PA_C = v3(1800, -1600, -3000);

export const B09_VARIANTS: Variant[] = [
  { id: 'booth', label: 'BOOTH', blurb: 'A commentary booth: two commentators side by side, both on closed-ear headsets with a boom mic, a window to the field in front.', phrase: 'in a commentary booth' },
  { id: 'open', label: 'OPEN', blurb: 'An open position: the commentator at a rail with nothing between them and the stadium — the crowd in front, a PA cluster high to the front-left.', phrase: 'at an open position, in the stadium' },
  { id: 'studio', label: 'QUIET BOOTH', blurb: 'A quiet, enclosed booth or a studio calling from a screen: a broadcast dynamic on a desk arm.', phrase: 'in a quiet booth' },
];

export const B09_VIEWS: Record<'booth' | 'open' | 'studio', { side: ViewBox; top: ViewBox }> = {
  booth: { side: { u0: -700, u1: 1500, v0: -620, v1: 1260 }, top: { u0: -700, u1: 1500, v0: -760, v1: 1660 } },
  open: { side: { u0: -700, u1: 2400, v0: -1900, v1: 1260 }, top: { u0: -700, u1: 2400, v0: -3400, v1: 900 } },
  studio: { side: { u0: -700, u1: 1500, v0: -620, v1: 1260 }, top: { u0: -700, u1: 1500, v0: -900, v1: 900 } },
};

const HEADSETS = ['bcHeadsetBoom', 'bcHeadsetSuper'];
const arm = deskArm('arm.A', 'the commentator’s desk arm', GRIP_A, DESK_TOP_Y, ['bcDynArm'], ['studio']);
const voiceA = talkerVoice(CALLER, IDS_A);
const voiceB = talkerVoice(ANALYST, IDS_B, ['booth']);

/** A headset's ear pivot on a talker (their right ear). */
export const earPivot = (t: Talker): Vec3 => onTalker(t, v3(EAR.x, EAR.y, EAR_HALF));
/** The caller's right shoulder: where the arm holding a lip mic hangs from. */
export const SHOULDER_A: Vec3 = onTalker(CALLER, SHOULDER_R);

const parts: Part[] = [
  ...talkerParts(CALLER, IDS_A, { who: 'the commentator', mouthRole: 'Where the commentator’s voice leaves — almost all of it. Every distance here is measured from the lips to the front of the mic.', headRole: 'The head follows the play, looks down at the notes and the screen, and turns to the analyst. A headset boom turns with it; a mic on an arm does not.' }),
  ...talkerParts(ANALYST, IDS_B, { who: 'the analyst', headRole: 'The second voice, 0.9 m to the commentator’s right: their voice reaches the commentator’s mic too — later and lower.' }, ['booth']),
  { id: 'b9.desk', label: 'the commentary desk', short: 'desk', role: 'A hard top under the mouths: notes, a screen and cables on it. A mic low over it hears its reflection; a headset boom stays well above it.', solid: { kind: 'box', ...DESK }, prov: DD },
  { id: 'b9.screen', label: 'the screen', short: 'screen', role: 'The replay and the statistics. The mic and its arm keep out of the line from the eyes to it.', solid: { kind: 'box', min: v3(SCREEN.x - 20, DESK_TOP_Y - 230, SCREEN.z - 170), max: v3(SCREEN.x + 20, DESK_TOP_Y, SCREEN.z + 170) }, variants: ['booth', 'studio'], prov: DD },
  { id: 'b9.notes', label: 'the notes', short: 'notes', role: 'Papers on the desk: page turns are a noise to check, and reading down takes the mouth off a fixed mic’s axis.', prov: DD },
  { id: 'b9.window', label: 'the window to the field', short: 'window', role: 'The booth’s glass: it keeps some of the crowd out — and reflects the voice back. With the window open, the crowd and the PA come straight in.', variants: ['booth', 'studio'], prov: DD },
  { id: 'b9.rail', label: 'the open rail', short: 'rail', role: 'Nothing between the commentator and the stadium: the crowd, the wind and the PA reach the mic as they are.', variants: ['open'], prov: DD },
  { id: 'b9.pa', label: 'the PA cluster', short: 'PA', role: 'High to the front-left, facing the crowd: an open position hears the PA as well as the crowd. A pattern’s side null can be aimed at it; no pattern makes it vanish.', variants: ['open'], prov: DD },
  { id: 'b9.crowd', label: 'the crowd', short: 'crowd', role: 'In front and below. Its noise reaches every commentary mic: a close mic keeps the voice ahead of it. The crowd’s own mics are separate.', prov: DD },
  arm.part,
  REACH_PART,
];

const rims: Rim[] = [
  { id: 'clip.ear.A', label: 'the headset over the commentator’s right ear', c: earPivot(CALLER), axis: v3(0, 0, 1), r: 0, types: HEADSETS },
  { id: 'clip.ear.B', label: 'the headset over the analyst’s right ear', c: earPivot(ANALYST), axis: v3(0, 0, 1), r: 0, types: HEADSETS, variants: ['booth'] },
  { id: 'hand.A', label: 'the commentator’s hand', c: SHOULDER_A, axis: v3(0, 0, 1), r: 0, types: ['bcLipRibbon'], variants: ['open'] },
  arm.rim,
];

export const B09_MODEL: InstrumentModel = {
  id: 'b09-commentators',
  name: 'a commentator at the desk',
  parts,
  regions: [...voiceA.regions, ...voiceB.regions],
  surfaces: [voiceA.surface, voiceB.surface],
  lines: [voiceA.line, voiceB.line],
  envelopes: [],
  variants: B09_VARIANTS,
  defaultVariant: 'booth',
  views: B09_VIEWS.booth,
  fitAuthored: { side: true, top: true },
  viewsByVariant: { booth: B09_VIEWS.booth, open: B09_VIEWS.open, studio: B09_VIEWS.studio },
  // The setups keep to the head: a headset capsule 3 cm from the lips was a
  // few pixels on a whole-booth drawing.
  setupFrameMax: { side: { u0: -360, u1: 700, v0: -420, v1: 560 }, top: { u0: -360, u1: 700, v0: -480, v1: 520 } },
  setupFrameMaxByVariant: { booth: { side: { u0: -360, u1: 700, v0: -420, v1: 560 }, top: { u0: -360, u1: 700, v0: -480, v1: 1380 } } },
  yFloor: { mm: SEATED_FLOOR, prov: { kind: 'unknown', needed: 'the floor below a seated talker’s lips (talkerPose: desk 740 + 450 mm)' }, placeholder: true },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { booth: null, open: null, studio: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE COMMENTATOR’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};
