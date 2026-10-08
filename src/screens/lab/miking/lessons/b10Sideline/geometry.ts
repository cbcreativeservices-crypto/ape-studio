/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — where things are (charter §2
 * layer 2). Frame V on the GUEST (the athlete or coach answering: the lip
 * point at the origin, +x straight out of the mouth toward the camera, +y
 * DOWN, +z to their right, mm), standing (shared/voice: the lips 1550 mm
 * above the ground). The REPORTER stands beside them, 0.65 m to the guest's
 * left, both facing the camera's way (a drawing default — the research's
 * "about 60° apart" is said in words: standing.ts). Three set-ups (the
 * variants):
 *
 *   sideline  A SIDELINE INTERVIEW: one handheld in the reporter's hand,
 *             moved to whoever speaks; the reporter's headset for their
 *             cues; the camera in front; behind them the touchline and the
 *             hatched play area nobody steps into; a PA high beyond the
 *             camera; the clear exit route to their right kept open.
 *   twoMics   TWO HANDHELDS: the reporter and the guest each hold their own.
 *   postEvent A POST-EVENT MARK: a backdrop behind the guest, a body mic on
 *             a scheduled guest (with approval), a boom held by an operator
 *             outside the frame to the guest's right.
 *
 * Sources: docs/labs/miking/sideline_interviews/SOURCES.md, GEOMETRY_PROPOSAL.md.
 * Every position is a DRAWING DEFAULT: the reporter's place, the camera's,
 * the touchline's, the PA's, the backdrop's, the operator's stance and grip.
 */
import type { Envelope, InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { FRAME_V, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { VOICE_PART_WORDS } from '../shared/voice/voiceModel.ts';
import { mouthLine, mouthSurface, voiceRegions } from '../shared/voice/voiceZones.ts';
import { talkerIds, talkerVoice } from '../shared/broadcast/talkerModel.ts';
import { SHOULDER_R, TORSO, earOf, onStander, standSolids, type Stander } from '../shared/broadcast/standing.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (sideline_interviews/GEOMETRY_PROPOSAL.md §1)');

/** The ground below the lips (standing). */
export const FLOOR = VOICE_DIMS.lipStanding.mm;

/** The guest at the origin (frame V); the reporter 0.65 m to their left. */
export const GUEST: Stander = { id: 'guest', lip: v3(0, 0, 0), facing: 1 };
export const REPORTER: Stander = { id: 'reporter', lip: v3(40, 0, -650), facing: 1 };
export const IDS_R = talkerIds('b10R');

/** The shoulders a held mic hangs from: the reporter's right (toward the
 *  guest), the guest's right (their own mic, TWO HANDHELDS). */
export const SHOULDER_REP = onStander(REPORTER, SHOULDER_R);
export const SHOULDER_GUEST = onStander(GUEST, SHOULDER_R);

/** The camera on its tripod in front, between the two (lens 2.5 m out). */
export const LENS = v3(2500, -80, -320);
export const CAMERA_BOX = { min: v3(2400, -175, -400), max: v3(2720, 15, -240) };
export const TRIPOD = { head: v3(2560, 15, -320), spread: 520 };

/** The touchline behind the talkers and the play area beyond it. */
export const TOUCHLINE_X = -1300;
/** The clear exit route to the guest's right (a corridor kept open). */
export const EXIT_Z = 1150;
/** The PA (sideline): high beyond the camera, to the front-right. */
export const PA_C = v3(2600, -1300, 1500);

/** The post-event backdrop behind the guest. */
export const BACKDROP_X = -650;
/** The boom operator (post-event): outside the frame, to the guest's right. */
export const OPERATOR = { feet: v3(1150, FLOOR, 1150), box: { min: v3(1000, -210, 960), max: v3(1300, FLOOR, 1340) } };
export const GRIP = v3(930, -285, 920);

/** The guest's body mic: at the breastbone (frame T), aimed up at the mouth. */
export const LAV_P = TORSO.sternum;
export const LAV_CLIP = v3(TORSO.sternum.x - 5, TORSO.sternum.y + 15, 0);

export const B10_VARIANTS: Variant[] = [
  { id: 'sideline', label: 'SIDELINE', blurb: 'A sideline interview: one handheld in the reporter’s hand, moved to whoever speaks; the camera in front, the touchline and the play area behind, the exit route kept clear.', phrase: 'at the sideline' },
  { id: 'twoMics', label: 'TWO HANDHELDS', blurb: 'The reporter and the guest each hold their own handheld — when a handoff is not practical and both know how to use one.', phrase: 'with two handhelds' },
  { id: 'postEvent', label: 'POST-EVENT', blurb: 'A post-event mark in front of a backdrop: a body mic on a scheduled guest, with approval — or a boom held by an operator outside the frame.', phrase: 'at a post-event mark' },
];

export const B10_VIEWS: Record<'sideline' | 'twoMics' | 'postEvent', { side: ViewBox; top: ViewBox }> = {
  sideline: { side: { u0: -1600, u1: 2900, v0: -1700, v1: 1640 }, top: { u0: -1700, u1: 2900, v0: -1500, v1: 1900 } },
  twoMics: { side: { u0: -700, u1: 1500, v0: -500, v1: 1640 }, top: { u0: -700, u1: 1500, v0: -1100, v1: 600 } },
  postEvent: { side: { u0: -900, u1: 2900, v0: -1200, v1: 1640 }, top: { u0: -900, u1: 2900, v0: -1100, v1: 1500 } },
};

const W = VOICE_PART_WORDS;
const S = SINGER_SOLIDS;
const RS = standSolids(REPORTER);
const FIG = ill('the shared adult figure standing (players/playerPose BODY), placed round the lip point: a drawing default');
const voiceR = talkerVoice(REPORTER, IDS_R);

const parts: Part[] = [
  { id: 'v.mouth', ...W.mouth, role: 'Where the guest’s voice leaves — almost all of it. Every distance here is measured from the lips to the front of the mic.', prov: FIG },
  { id: 'v.nose', ...W.nose, prov: FIG },
  { id: 'v.head', ...W.head, label: 'the guest’s head', role: 'The guest turns to the reporter, to the camera, and away when they are out of breath. A handheld follows the speaking mouth; nothing touches the face.', solid: S.head, prov: FIG },
  { id: 'v.chest', label: 'the guest’s chest', short: 'chest', role: 'A body mic clips here, at the breastbone — only with the guest’s and the event’s approval, clear of straps, badges and protective gear.', solid: S.torso, prov: FIG },
  { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: S.neck, listIn: [], prov: FIG },
  { id: 'player.legs', label: 'the guest’s legs', short: 'legs', role: 'Where the guest stands: cables and packs stay clear of the feet.', solid: S.legs, listIn: [], prov: FIG },
  { id: 'b10R.mouth', label: 'the reporter: mouth', short: 'mouth', role: 'Where the reporter’s questions leave. One handheld is moved here for the question, then to the guest before the answer.', prov: FIG },
  { id: 'b10R.head', label: 'the reporter', short: 'reporter', role: 'The reporter holds the mic and moves it to whoever speaks — and keeps it, and its flag, clear of faces and the lens.', solid: RS.head, prov: FIG },
  { id: 'b10R.chest', label: 'the reporter: chest', short: 'chest', role: 'The reporter’s body.', solid: RS.torso, listIn: [], prov: FIG },
  { id: 'b10R.neck', label: 'the reporter: neck', short: 'neck', role: 'The reporter’s neck.', solid: RS.neck, listIn: [], prov: FIG },
  { id: 'b10R.legs', label: 'the reporter: legs', short: 'legs', role: 'The reporter’s legs.', solid: RS.legs, listIn: [], prov: FIG },
  { id: 'b10.camera', label: 'the camera', short: 'camera', role: 'The shot decides how close a mic may come without being seen — but a nice shot is no reason for a mic far from the mouth. The mic and its flag stay out of the lens’s way.', solid: { kind: 'box', ...CAMERA_BOX }, prov: DD },
  { id: 'b10.play', label: 'the play area', short: 'play area', role: 'Behind the touchline: nobody steps into play — or into a medical, official, athlete or security route — for a better sound.', variants: ['sideline'], prov: DD },
  { id: 'b10.exit', label: 'the clear exit route', short: 'exit', role: 'Kept open the whole time: if play, the crowd, the weather or the venue’s people make the spot unsafe, the interview stops or moves.', variants: ['sideline', 'twoMics'], prov: DD },
  { id: 'b10.pa', label: 'the PA', short: 'PA', role: 'High beyond the camera: every open mic hears it. Where it sits against the mic’s pattern matters — a supercardioid has a small lobe behind.', variants: ['sideline'], prov: DD },
  { id: 'b10.crowd', label: 'the crowd', short: 'crowd', role: 'Around the stadium: a mic close to the speaking mouth keeps the voice ahead of it. The crowd’s own mics are separate.', prov: DD },
  { id: 'b10.backdrop', label: 'the backdrop', short: 'backdrop', role: 'A post-event mark in front of it: repeatable places for the guest, the camera and a boom.', variants: ['postEvent'], prov: DD },
  { id: 'b10.operator', label: 'the boom operator', short: 'operator', role: 'Outside the frame and inside the approved area, the pole’s sweep clear of people, the camera, cables and exits.', solid: { kind: 'box', ...OPERATOR.box }, variants: ['postEvent'], prov: DD },
  { id: 'clamp', label: 'how far the hand, the clip or the pole reaches', short: 'reach', role: 'A hand holds a mic only an arm’s length from the shoulder; a clip grips where it is; a pole reaches only so far.', listIn: [], prov: ill('an arm’s reach (63 cm), a clip’s (4 cm) and a pole’s (2.5 m): drawing defaults') },
];

const envelopes: Envelope[] = [];

const FLAGS = ['bcFlagOmni', 'bcFlagCard', 'bcFlagSuper'];
const rims: Rim[] = [
  { id: 'hand.R', label: 'the reporter’s hand', c: SHOULDER_REP, axis: v3(0, 0, 1), r: 0, types: FLAGS, variants: ['sideline', 'twoMics'] },
  { id: 'hand.G', label: 'the guest’s hand', c: SHOULDER_GUEST, axis: v3(0, 0, 1), r: 0, types: FLAGS, variants: ['twoMics'] },
  { id: 'clip.ear.R', label: 'the headset over the reporter’s right ear', c: earOf(REPORTER, 'R'), axis: v3(0, 0, 1), r: 0, types: ['bcHeadsetBoom', 'bcHeadsetSuper'], variants: ['sideline'] },
  { id: 'lav', label: 'a clip on the guest’s shirt, at the breastbone', c: LAV_CLIP, axis: v3(1, 0, 0), r: 0, types: ['locLav'], variants: ['postEvent'] },
  { id: 'grip', label: 'the boom operator’s hands', c: GRIP, axis: v3(0, 0, 1), r: 0, types: ['locBoomSg'], variants: ['postEvent'] },
];

export const B10_MODEL: InstrumentModel = {
  id: 'b10-sideline',
  name: 'a sideline interview',
  parts,
  regions: [...voiceRegions(FRAME_V, { mouthPart: 'v.mouth', nosePart: 'v.nose' }), ...voiceR.regions],
  surfaces: [mouthSurface(FRAME_V, { partId: 'v.mouth' }), voiceR.surface],
  lines: [mouthLine(FRAME_V, {}), voiceR.line],
  envelopes,
  variants: B10_VARIANTS,
  defaultVariant: 'sideline',
  views: B10_VIEWS.sideline,
  fitAuthored: { side: true, top: true },
  viewsByVariant: { sideline: B10_VIEWS.sideline, twoMics: B10_VIEWS.twoMics, postEvent: B10_VIEWS.postEvent },
  // The setups keep to the two heads (a handheld 10 cm from the lips was a
  // few pixels on the whole sideline).
  setupFrameMax: { side: { u0: -450, u1: 800, v0: -520, v1: 640 }, top: { u0: -450, u1: 800, v0: -900, v1: 420 } },
  setupFrameMaxByVariant: { postEvent: { side: { u0: -450, u1: 1100, v0: -1000, v1: 640 }, top: { u0: -450, u1: 1100, v0: -500, v1: 1100 } } },
  yFloor: VOICE_DIMS.lipStanding,
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { sideline: null, twoMics: null, postEvent: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE GUEST’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};
