/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — where things are (charter §2
 * layer 2). Frame V on the GUEST (the person being interviewed: the lip
 * point at the origin, +x straight out of the mouth toward the reporter, +y
 * DOWN, +z to the guest's right, mm), standing (the voice family's figure,
 * the lips 1550 mm above the ground). The REPORTER stands facing them, 75 cm
 * mouth to mouth (field_reporter/GEOMETRY_PROPOSAL.md §1: "≈ 600–900 mm",
 * a drawing default; the standing figure faces ±x only, so the proposal's
 * "60–90°" is said in words). Three set-ups (the variants):
 *
 *   street   ON THE STREET: one handheld in the reporter's right hand, the
 *            camera beside the reporter on the guest's right, the kerb and
 *            the traffic lane behind the guest, the wind from the road.
 *   twoMics  TWO MICS: the same place, the reporter's own handheld at their
 *            mouth and a lav on the guest's chest (with their agreement) —
 *            each on its own channel.
 *   event    AT A LIVE EVENT: the same pair, a local loudspeaker on a pole
 *            beyond the reporter facing the crowd — what goes to it, and
 *            where a directional handheld's rejection points.
 *
 * Sources: docs/labs/miking/field_reporter/SOURCES.md, GEOMETRY_PROPOSAL.md.
 * Every position is a DRAWING DEFAULT (owner list: talker spacing, chest
 * height, the flag, the background-source rotate): the spacing, the camera,
 * the kerb, the loudspeaker.
 */
import type { InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { FRAME_V, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { VOICE_PART_WORDS } from '../shared/voice/voiceModel.ts';
import { mouthLine, mouthSurface, voiceRegions } from '../shared/voice/voiceZones.ts';
import { talkerIds, talkerVoice } from '../shared/broadcast/talkerModel.ts';
import { SHOULDER_R, onStander, standSolids, type Stander } from '../shared/broadcast/standing.ts';
import { BODY_MOUNTS } from '../shared/broadcast/bodyWorn.ts';
import { pathKeys, type FieldPair } from '../shared/broadcast/fieldInterview.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (field_reporter/GEOMETRY_PROPOSAL.md §1; owner list: spacing, chest height, the flag)');

/** The ground below the lips (standing). */
export const FLOOR = VOICE_DIMS.lipStanding.mm;

/** Mouth to mouth (mm): a drawing default inside the proposal's 600–900. */
export const SPACING = 750;
/** The guest at the origin facing +x; the reporter facing them. */
export const GUEST: Stander = { id: 'guest', lip: v3(0, 0, 0), facing: 1 };
export const REPORTER: Stander = { id: 'reporter', lip: v3(SPACING, 0, 0), facing: -1 };
export const IDS_R = talkerIds('b3R');
export const PAIR: FieldPair = { a: REPORTER.lip, b: GUEST.lip };

/** The reporter's right shoulder: the held mic's grip (their right is the
 *  guest's −z side, facing back). */
export const SHOULDER_REP = onStander(REPORTER, SHOULDER_R);

/** The handoff path's places (fieldInterview.ts): the close end at each
 *  mouth and the SHARED place at chest height midway. */
export const KEYS = pathKeys(PAIR);
/** The shared omni a little toward the reporter's right hand (it is held
 *  there): its plan offset (mm, a drawing default). */
export const SHARED_Z = -40;
export const SHARED_P = v3(KEYS.mid.x, KEYS.mid.y, SHARED_Z);

/** The camera on its tripod beside the reporter, on the guest's right,
 *  aimed back at the guest (a drawing default). */
export const LENS = v3(2300, -80, 760);
export const CAMERA_BOX = { min: v3(2200, -175, 680), max: v3(2520, 15, 840) };
export const TRIPOD = { spread: 520 };

/** The kerb behind the guest and the lane beyond it (mm, drawing defaults). */
export const KERB_X = -1250;
export const ROAD_X0 = -3600;
export const ROAD_Z = { z0: -2600, z1: 2600 } as const;

/** The local loudspeaker (event): beyond the reporter on their left, up on
 *  its pole, facing the crowd (+x) — its back and side toward the pair. */
export const PA_C = v3(2600, FLOOR - 1700, 1300);

/** The guest's lav (two mics): the body-worn family's sternum place. */
export const LAV = BODY_MOUNTS.sternum;

export const B03_VARIANTS: Variant[] = [
  { id: 'street', label: 'STREET', blurb: 'On the street: one handheld in the reporter’s hand, the camera beside the reporter, the kerb and the traffic behind the guest.', phrase: 'on the street' },
  { id: 'twoMics', label: 'TWO MICS', blurb: 'The same place with a mic each: the reporter keeps a handheld at their own mouth, the guest wears a lav — each on its own channel.', phrase: 'with a mic each' },
  { id: 'event', label: 'LIVE EVENT', blurb: 'At a live event: the same interview, and a local loudspeaker on a pole beyond the reporter, facing the crowd.', phrase: 'at a live event with a loudspeaker' },
];

export const B03_VIEWS: Record<'street' | 'twoMics' | 'event', { side: ViewBox; top: ViewBox }> = {
  street: { side: { u0: -1700, u1: 2800, v0: -900, v1: 1640 }, top: { u0: -1700, u1: 2800, v0: -1500, v1: 1300 } },
  twoMics: { side: { u0: -700, u1: 1500, v0: -500, v1: 1640 }, top: { u0: -700, u1: 1500, v0: -900, v1: 700 } },
  event: { side: { u0: -800, u1: 3200, v0: -1300, v1: 1640 }, top: { u0: -800, u1: 3200, v0: -900, v1: 1900 } },
};

const W = VOICE_PART_WORDS;
const S = SINGER_SOLIDS;
const RS = standSolids(REPORTER);
const FIG = ill('the shared adult figure standing (players/playerPose BODY), placed round the lip point: a drawing default');
const voiceR = talkerVoice(REPORTER, IDS_R);

const parts: Part[] = [
  { id: 'v.mouth', ...W.mouth, role: 'Where the guest’s voice leaves — almost all of it. Every distance here is measured from the lips to the front of the mic.', prov: FIG },
  { id: 'v.nose', ...W.nose, prov: FIG },
  { id: 'v.head', ...W.head, label: 'the guest’s head', role: 'The guest turns to the reporter, to the camera, to someone beside them. The mic follows the mouth — and asks before it comes close to a face.', solid: S.head, prov: FIG },
  { id: 'v.chest', label: 'the guest’s chest', short: 'chest', role: 'A lav clips here for a second channel — only with the guest’s agreement.', solid: S.torso, prov: FIG },
  { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: S.neck, listIn: [], prov: FIG },
  { id: 'player.legs', label: 'the guest’s legs', short: 'legs', role: 'Where the guest stands: cables stay behind the operator, away from feet.', solid: S.legs, listIn: [], prov: FIG },
  { id: 'b3R.mouth', label: 'the reporter: mouth', short: 'mouth', role: 'Where the reporter’s questions leave. One handheld is moved here for the question, then to the guest before the answer.', prov: FIG },
  { id: 'b3R.head', label: 'the reporter', short: 'reporter', role: 'The reporter holds the mic and moves it to whoever is speaking — the flag and the grille clear of faces and the lens, the arm never stretched off balance.', solid: RS.head, prov: FIG },
  { id: 'b3R.chest', label: 'the reporter: chest', short: 'chest', role: 'The reporter’s body.', solid: RS.torso, listIn: [], prov: FIG },
  { id: 'b3R.neck', label: 'the reporter: neck', short: 'neck', role: 'The reporter’s neck.', solid: RS.neck, listIn: [], prov: FIG },
  { id: 'b3R.legs', label: 'the reporter: legs', short: 'legs', role: 'The reporter’s legs.', solid: RS.legs, listIn: [], prov: FIG },
  { id: 'b3.camera', label: 'the camera', short: 'camera', role: 'Beside the reporter, on the guest’s right: the mic and its flag stay out of the lens’s way. A mic on the camera would be far from both voices.', solid: { kind: 'box', ...CAMERA_BOX }, prov: DD },
  { id: 'b3.road', label: 'the road behind the guest', short: 'road', role: 'Traffic: the loudest noise here, and a vehicle path nobody stands in — the reporter, the guest and the camera operator stay on the pavement.', variants: ['street', 'twoMics'], prov: DD },
  { id: 'b3.pa', label: 'the local loudspeaker', short: 'loudspeaker', role: 'At a live event: every open mic hears it. What goes to it, and where a directional handheld’s rejection points, decide how close to feedback it gets.', variants: ['event'], prov: DD },
  { id: 'clamp', label: 'how far the hand or the clip reaches', short: 'reach', role: 'A hand holds a mic only an arm’s length from the shoulder — never stretched until the stance is unstable; a clip grips where it is.', listIn: [], prov: ill('an arm’s reach (63 cm) and a clip’s (4 cm): drawing defaults') },
];

const HELD = ['repOmni', 'bcFlagCard'];
const rims: Rim[] = [
  { id: 'hand.R', label: 'the reporter’s hand', c: SHOULDER_REP, axis: v3(0, 0, 1), r: 0, types: HELD },
  { id: 'clip.sternum', label: 'a clip on the guest’s shirt, over the breastbone', c: LAV.grip, axis: v3(1, 0, 0), r: 0, types: ['locLav'], variants: ['twoMics'] },
];

export const B03_MODEL: InstrumentModel = {
  id: 'b03-field-reporter',
  name: 'a reporter and a guest',
  parts,
  regions: [...voiceRegions(FRAME_V, { mouthPart: 'v.mouth', nosePart: 'v.nose' }), ...voiceR.regions],
  surfaces: [mouthSurface(FRAME_V, { partId: 'v.mouth' }), voiceR.surface],
  lines: [mouthLine(FRAME_V, {}), voiceR.line],
  envelopes: [],
  variants: B03_VARIANTS,
  defaultVariant: 'street',
  views: B03_VIEWS.street,
  viewsByVariant: { street: B03_VIEWS.street, twoMics: B03_VIEWS.twoMics, event: B03_VIEWS.event },
  fitAuthored: { side: true, top: true },
  // The setups keep to the two people (a handheld 10 cm from the lips was a
  // few pixels on the whole street).
  setupFrameMax: { side: { u0: -450, u1: 1250, v0: -520, v1: 900 }, top: { u0: -450, u1: 1250, v0: -700, v1: 520 } },
  yFloor: VOICE_DIMS.lipStanding,
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { street: null, twoMics: null, event: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE GUEST’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};
