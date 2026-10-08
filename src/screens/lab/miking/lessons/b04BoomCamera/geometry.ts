/**
 * B04 BOOM AND CAMERA-MOUNTED PICKUP — where things are (charter §2 layer
 * 2). Frame V on the TALKER (the lip point at the origin, +x straight out of
 * the mouth toward the camera, +y DOWN, +z to their right, mm), standing (the
 * voice family's figure, the lips 1550 mm above the floor). The camera frame
 * (shared/broadcast/cameraFrame.ts) and the boom (boomPole.ts; the location
 * kit's pole types). Three set-ups (the variants):
 *
 *   close  A CLOSE SHOT: the camera 2.2 m in front at eye level, head and
 *          shoulders; a boom operator outside the frame on the talker's left.
 *   wide   A WIDE SHOT: the camera moved back to 3.6 m, the talker to the
 *          waist with room round them — the boom must stay farther away, and
 *          the camera's own mic is now 3.6 m from the mouth.
 *   live   LIVE, ON A STAGE: the close shot for the broadcast, and a PA at
 *          the stage's front corner on the talker's left, facing the
 *          audience — every open mic on the stage hears it.
 *
 * Sources: docs/labs/miking/boom_camera/SOURCES.md, GEOMETRY_PROPOSAL.md.
 * Every position is a DRAWING DEFAULT (owner list: lens presets, the pole
 * operator): the cameras, the shots (cameraFrame.SHOT_PRESETS), the operator's
 * stance and grip, the PA. The boom's starting points are DERIVED from the
 * frame (the nearest place 15 cm outside it, cameraFrame.boomOutside).
 */
import type { Envelope, InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { FRAME_V, HEAD_C, HEAD_R, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { VOICE_PART_WORDS } from '../shared/voice/voiceModel.ts';
import { mouthLine, mouthSurface, voiceRegions } from '../shared/voice/voiceZones.ts';
import { REACH_PART } from '../shared/broadcast/talkerModel.ts';
import { BODY_MOUNTS } from '../shared/broadcast/bodyWorn.ts';
import { SHOT_PRESETS, boomAbove, boomBelow, boomSide, cameraBody, cameraForShot, cameraMic, cameraShoe, footFan, headroomFan, sideFan, type BroadcastCamera } from '../shared/broadcast/cameraFrame.ts';
import { operatorAt } from '../shared/broadcast/boomPole.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (boom_camera/GEOMETRY_PROPOSAL.md §1–§2; owner list: lens presets, the operator)');
const FIG = ill('the shared adult figure standing (voicePose): a drawing default');
const LIP = v3(0, 0, 0);

/** The floor (frame V: the lips 1550 mm above it). */
export const FLOOR = VOICE_DIMS.lipStanding.mm;
export const HEAD_TOP = v3(HEAD_C.x, HEAD_C.y - HEAD_R, 0);

/* ── the cameras ── */
/** Close: 2.2 m out at eye level, head and shoulders. */
export const CAM_CLOSE: BroadcastCamera = cameraForShot(v3(2200, -80, 0), LIP, SHOT_PRESETS.close);
/** Wide: moved back to 3.6 m, the talker to the waist with room round them. */
export const CAM_WIDE: BroadcastCamera = cameraForShot(v3(3600, -80, 0), LIP, SHOT_PRESETS.wide);
export const CAM_OF: Readonly<Record<'close' | 'wide' | 'live', BroadcastCamera>> = { close: CAM_CLOSE, wide: CAM_WIDE, live: CAM_CLOSE };

/* ── the boom's starting points (DERIVED: 15 cm outside the frame, aimed at
 *  the mouth; the angles are the lab's drawing: 45° up and 25° round toward
 *  the operator's side; below 40° down; beside 70° round, a little raised) ── */
const B = { clearance: 150, planDeg: -25 };
export const BOOM_ABOVE = boomAbove(CAM_CLOSE, LIP, { clearance: B.clearance, elevDeg: 45, planDeg: B.planDeg });
export const BOOM_BELOW = boomBelow(CAM_CLOSE, LIP, { clearance: B.clearance, elevDeg: 40, planDeg: B.planDeg });
export const BOOM_SIDE = boomSide(CAM_CLOSE, LIP, { clearance: B.clearance, side: -1, planDeg: 70 });
export const BOOM_WIDE = boomAbove(CAM_WIDE, LIP, { clearance: B.clearance, elevDeg: 45, planDeg: B.planDeg });

/* ── the camera's own mic, on its shoe ── */
export const CAMMIC_CLOSE = cameraMic(CAM_CLOSE);
export const CAMMIC_WIDE = cameraMic(CAM_WIDE);

/* ── the boom operator: outside every frame on the talker's left, the pole
 *  held high (drawing defaults; poles reach 2.5 m) ── */
export const GRIP_CLOSE = v3(1000, -350, -1000);
export const GRIP_WIDE = v3(900, -450, -1300);
export const OP_FEET_CLOSE = operatorAt(GRIP_CLOSE, BOOM_ABOVE.p, FLOOR);
export const OP_FEET_WIDE = operatorAt(GRIP_WIDE, BOOM_WIDE.p, FLOOR);

/** The PA (live): at the stage's front corner on the talker's left, beyond
 *  the operator, facing the audience (+x): 2 m out, 1.9 m across, its
 *  centre 1.7 m up. */
export const PA_C = v3(2000, FLOOR - 1700, -1900);

/** The lav (the safety track): the body-worn family's sternum place. */
export const LAV = BODY_MOUNTS.sternum;

export const B04_VARIANTS: Variant[] = [
  { id: 'close', label: 'CLOSE SHOT', blurb: 'A close shot: the camera 2.2 m in front, head and shoulders; a boom operator outside the frame on the talker’s left.', phrase: 'in a close shot' },
  { id: 'wide', label: 'WIDE SHOT', blurb: 'A wide shot: the camera moved back to 3.6 m, the talker to the waist with room round them — the boom and the camera’s mic both farther away.', phrase: 'in a wide shot' },
  { id: 'live', label: 'LIVE', blurb: 'Live on a stage: the same close shot for the broadcast, and a PA at the stage’s front corner on the talker’s left.', phrase: 'live, on a stage with a PA' },
];

export const B04_VIEWS: Record<'close' | 'wide' | 'live', { side: ViewBox; top: ViewBox }> = {
  close: { side: { u0: -600, u1: 2650, v0: -800, v1: 1620 }, top: { u0: -600, u1: 2650, v0: -1500, v1: 900 } },
  wide: { side: { u0: -700, u1: 4050, v0: -950, v1: 1620 }, top: { u0: -700, u1: 4050, v0: -1800, v1: 1300 } },
  live: { side: { u0: -600, u1: 2650, v0: -800, v1: 1620 }, top: { u0: -600, u1: 2650, v0: -2400, v1: 900 } },
};

const W = VOICE_PART_WORDS;
const S = SINGER_SOLIDS;
const POLE_TYPES = ['locBoomSg', 'locBoomHyper', 'locBoomFur'];

const parts: Part[] = [
  { id: 'v.mouth', ...W.mouth, role: 'Where the voice leaves the talker — almost all of it. Every distance here is measured from the lips to the front of the mic.', prov: FIG },
  { id: 'v.nose', ...W.nose, prov: FIG },
  { id: 'v.head', ...W.head, label: 'head and face', role: 'The head turns and reads down: a boom is re-aimed with it; nothing of the boom comes near the face.', solid: S.head, prov: FIG },
  { id: 'v.chest', label: 'chest (where a lav clips)', short: 'chest', role: 'A lav for a safety track clips here, with the talker’s agreement — on its own channel.', solid: S.torso, prov: FIG },
  { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: S.neck, listIn: [], prov: FIG },
  { id: 'player.legs', label: 'the talker’s legs and feet', short: 'legs', role: 'Standing: the operator’s feet and the cables stay clear of theirs.', solid: S.legs, listIn: [], prov: FIG },
  { id: 'bc.camera', label: 'the camera', short: 'camera', role: 'What it frames decides where a boom may go: just outside the widest frame. A mic on top of it points the right way, but it is as far from the talker as the camera is — and moves back with it.', solid: { kind: 'box', ...cameraBody(CAM_CLOSE) }, variants: ['close', 'live'], prov: DD },
  { id: 'bc.cameraWide', label: 'the camera, moved back', short: 'camera', role: 'Moved back for the wide shot: its own mic went back with it, and the frame grew — the boom must stay farther away too.', solid: { kind: 'box', ...cameraBody(CAM_WIDE) }, variants: ['wide'], prov: DD },
  { id: 'b4.operator', label: 'the boom operator', short: 'operator', role: 'A trained operator stands outside every frame on a clear path, the pole held from a rehearsed, safe place — never swung above people. Plan relief: a tired arm drifts into the shot.', prov: DD },
  { id: 'b4.pa', label: 'the PA loudspeaker', short: 'PA', role: 'Live: it faces the audience, but every open mic on the stage hears its back and side. Check the boom’s working position and pattern with the system’s operator.', variants: ['live'], prov: DD },
  REACH_PART,
];

const fanKeep = (id: string, label: string, shape: Envelope['shape'], variants: string[]): Envelope => ({ id, label, shape, prov: ill('the shot’s edge (cameraFrame.ts): a simplified picture of the frame, as wide as it is at the talker'), variants });
const CHIN_LOW = v3(13, 230, 0);
const envelopes: Envelope[] = [
  fanKeep('b4.headroom', 'the camera’s frame above the talker’s head', headroomFan(CAM_CLOSE, HEAD_TOP), ['close', 'live']),
  fanKeep('b4.footroom', 'the camera’s frame below the talker’s chest', footFan(CAM_CLOSE, CHIN_LOW), ['close', 'live']),
  fanKeep('b4.left', 'the camera’s frame on the talker’s left', sideFan(CAM_CLOSE, LIP, -1), ['close', 'live']),
  fanKeep('b4.right', 'the camera’s frame on the talker’s right', sideFan(CAM_CLOSE, LIP, 1), ['close', 'live']),
  fanKeep('b4.headroom.w', 'the camera’s frame above the talker’s head', headroomFan(CAM_WIDE, HEAD_TOP), ['wide']),
  fanKeep('b4.left.w', 'the camera’s frame on the talker’s left', sideFan(CAM_WIDE, LIP, -1), ['wide']),
  fanKeep('b4.right.w', 'the camera’s frame on the talker’s right', sideFan(CAM_WIDE, LIP, 1), ['wide']),
];

const rims: Rim[] = [
  { id: 'grip', label: 'the boom operator’s hands', c: GRIP_CLOSE, axis: v3(0, 0, 1), r: 0, variants: ['close', 'live'], types: POLE_TYPES },
  { id: 'grip.w', label: 'the boom operator’s hands', c: GRIP_WIDE, axis: v3(0, 0, 1), r: 0, variants: ['wide'], types: POLE_TYPES },
  { id: 'shoe', label: 'the camera’s shoe', c: cameraShoe(CAM_CLOSE), axis: v3(0, -1, 0), r: 0, variants: ['close', 'live'], types: ['camMic'] },
  { id: 'shoe.w', label: 'the camera’s shoe', c: cameraShoe(CAM_WIDE), axis: v3(0, -1, 0), r: 0, variants: ['wide'], types: ['camMic'] },
  { id: 'clip.sternum', label: 'a clip on the shirt, over the breastbone', c: LAV.grip, axis: v3(1, 0, 0), r: 0, types: ['locLav'] },
];

export const B04_MODEL: InstrumentModel = {
  id: 'b04-boom-camera',
  name: 'a talker on camera with a boom',
  parts,
  regions: voiceRegions(FRAME_V, { mouthPart: 'v.mouth', nosePart: 'v.nose' }),
  surfaces: [mouthSurface(FRAME_V, { partId: 'v.mouth' })],
  lines: [mouthLine(FRAME_V, {})],
  envelopes,
  variants: B04_VARIANTS,
  defaultVariant: 'close',
  views: B04_VIEWS.close,
  viewsByVariant: { close: B04_VIEWS.close, wide: B04_VIEWS.wide, live: B04_VIEWS.live },
  fitAuthored: { side: true, top: true },
  // Live, the PA's cabinet stands top right: the mini view goes bottom right.
  insetAt: { live: 'bottom' },
  // No cap on the setups' drawing: each one shows the talker with its whole
  // rig — the pole to the operator's hands, or the camera with its own mic.
  yFloor: VOICE_DIMS.lipStanding,
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { close: null, wide: null, live: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE TALKER’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};
