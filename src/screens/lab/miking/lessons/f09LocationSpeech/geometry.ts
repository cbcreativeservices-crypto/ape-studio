/**
 * F09 LOCATION SPEECH AND PRACTICAL SOUNDS — where things are (charter §2
 * layer 2). One talker in frame V (lessons/shared/voice: the LIP POINT at the
 * origin, +x straight out of the mouth, +y DOWN, +z to the talker's right,
 * mm), in three set-ups (the variants):
 *
 *   set      ON SET, INDOORS: the talker standing at a counter with a set of
 *            keys on it (the practical action), a camera on its tripod 2.5 m
 *            in front, its frame a medium shot; a boom operator outside the
 *            frame to the talker's left.
 *   outdoor  OUTDOORS: the same talker and camera, the boom in a fur
 *            windshield — and an overhead power line behind the talker, with
 *            its 3 m (10 ft) keep-out (SAFETY, exact).
 *   live     LIVE, ON A STAGE: the talker presenting with a handheld or a
 *            body mic, a floor wedge in front.
 *
 * Sources: docs/labs/miking/location_speech/SOURCES.md, GEOMETRY_PROPOSAL.md.
 * Every position is a DRAWING DEFAULT unless named: the camera's distance and
 * height, the shot size (location.ts SHOTS), the counter, the keys, the
 * operator's stance and grip, the pole's reach and the power line's place.
 * The keep-out radius (3 m) and the lav's place (above the sternum) are
 * sourced.
 */
import type { Envelope, InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { FRAME_V, VOICE_DIMS, EAR, EAR_HALF, HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { SINGER_NECK, SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { VOICE_PART_WORDS } from '../shared/voice/voiceModel.ts';
import { mouthLine, mouthSurface, onAnchor, voiceRegions } from '../shared/voice/voiceZones.ts';
import { FUR_CAPSULE_MM, SHOTGUN_CAPSULE_MM } from '../shared/field/fieldMics.ts';
import { boomStart, frameForShot, headroomKeepOut, powerLineKeepOut, type CameraFrame, type OverheadLine } from '../shared/field/location.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (location_speech/GEOMETRY_PROPOSAL.md §2)');

/** The floor (frame V: the lips 1550 mm above it). */
export const FLOOR = VOICE_DIMS.lipStanding.mm;
/** The top of the talker's head (the shared figure's skull). */
export const HEAD_TOP = HEAD_C.y - HEAD_R;

/* ── the camera and its frame ── */
/** The lens: 2.5 m in front of the lips, a little above them (eye level). */
export const LENS = v3(2500, -80, 0);
/** The shot on set: a medium shot (the talker to the waist, 150 mm of headroom). */
export const FRAME: CameraFrame = frameForShot(LENS, 'medium');
/** The camera body with its lens barrel (a box for collision). */
export const CAMERA_BOX = { min: v3(2400, -175, -80), max: v3(2720, 15, 80) };
/** The tripod's head under the camera, and its feet. */
export const TRIPOD = { head: v3(2560, 15, 0), spread: 520 };

/* ── the counter and the practical action ── */
export const COUNTER_BOX = { min: v3(180, 650, -650), max: v3(800, FLOOR, 650) };
/** The keys on the counter (the practical sound). */
export const KEYS = v3(420, 640, -180);
/** The jar that hides the planted mic from the camera. */
export const JAR = v3(790, 650, -180);

/* ── the boom operator (outside the frame, to the talker's left) ── */
export const OPERATOR = { feet: v3(1360, FLOOR, -1050), box: { min: v3(1210, -210, -1240), max: v3(1510, FLOOR, -860) } };
/** The operator's front hand on the pole (the grip the pole is drawn to). */
export const GRIP = v3(1150, -285, -820);

/* ── the body mic: on the chest, just above the sternum (SHURE-LAV) ── */
/** The chest's front face (the shared figure's torso). */
const CHEST_X = SINGER_SOLIDS.torso.kind === 'box' ? SINGER_SOLIDS.torso.max.x : 7;
/** Where the clip grips the shirt (just below the capsule). */
export const LAV_CLIP = v3(CHEST_X + 1, SINGER_NECK.y + 107, 0);
/** The lav's front (the capsule's mesh cap), aimed up at the mouth. */
export const LAV_P = v3(CHEST_X + 6, SINGER_NECK.y + 92, 0);

/* ── the boom's starting point (location.boomStart: 150 mm above the frame
 *  line, 45° above the mouth's axis, aimed at the mouth). Owner 2026-10-08
 *  (L6A): the TIP keeps the 150 mm clearance and the readout is the
 *  shotgun's CAPSULE, about 200 mm behind the tip (285 mm behind the fur
 *  basket's front outdoors) ── */
export const BOOM = boomStart(FRAME, { clearance: 150, elevDeg: 45, capsule: SHOTGUN_CAPSULE_MM });
export const BOOM_FUR = boomStart(FRAME, { clearance: 150, elevDeg: 45, capsule: FUR_CAPSULE_MM });

/* ── the overhead power line (outdoor): along z, 1.2 m behind the talker,
 *  5.2 m above the ground — a drawing default; its keep-out is exact ── */
export const POWER_LINE: OverheadLine = { a: v3(-1200, FLOOR - 5200, -6000), b: v3(-1200, FLOOR - 5200, 6000) };

/* ── the stage (live): the wedge (E01's, a drawing default) ── */
export const WEDGE_P = v3(1000, FLOOR, 0);

export const F09_VARIANTS: Variant[] = [
  { id: 'set', label: 'ON SET', blurb: 'Indoors on a set: the talker at a counter with keys on it, a camera 2.5 m in front framing a medium shot, a boom operator outside the frame.', phrase: 'on a set, indoors' },
  { id: 'outdoor', label: 'OUTDOORS', blurb: 'Outdoors: the same shot, the boom in a fur windshield for the wind — and an overhead power line behind the talker, with its 3 m (10 ft) keep-out.', phrase: 'outdoors, under a power line' },
  { id: 'live', label: 'LIVE', blurb: 'Live on a small stage: the talker presenting to an audience through a PA, a floor wedge in front, no camera frame to keep out of.', phrase: 'live, on a stage' },
];

export const F09_VIEWS: Record<'set' | 'outdoor' | 'live', { side: ViewBox; top: ViewBox }> = {
  set: { side: { u0: -800, u1: 2850, v0: -1100, v1: 1640 }, top: { u0: -800, u1: 2850, v0: -1450, v1: 900 } },
  outdoor: { side: { u0: -1500, u1: 2850, v0: -1350, v1: 1640 }, top: { u0: -1500, u1: 2850, v0: -1450, v1: 900 } },
  live: { side: { u0: -450, u1: 1250, v0: -500, v1: 1640 }, top: { u0: -450, u1: 1250, v0: -700, v1: 700 } },
};

const FIG = ill('the shared adult figure (players/playerPose BODY), placed round the lip point: a drawing default');
const W = VOICE_PART_WORDS;
const S = SINGER_SOLIDS;
const parts: Part[] = [
  { id: 'v.mouth', ...W.mouth, role: 'Where the voice leaves the talker — almost all of it. Every distance here is measured from the lips to the mic’s capsule.', prov: FIG },
  { id: 'v.nose', ...W.nose, prov: FIG },
  { id: 'v.folds', ...W.folds, listIn: [], prov: ill('the larynx, low in the throat: a simplified picture') },
  { id: 'v.head', ...W.head, label: 'head and face', role: 'The head turns as the talker speaks and looks around: a boom is turned to follow it, a mic on the chest does not. Nothing touches the face.', solid: S.head, prov: FIG },
  { id: 'v.chest', label: 'chest (where a body mic goes)', short: 'chest', role: 'A body mic clips here, just above the breastbone — with the talker’s agreement. It moves with the chest, not with the head.', solid: S.torso, prov: FIG },
  { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: S.neck, listIn: [], prov: FIG },
  { id: 'player.legs', label: 'the talker’s legs and feet', short: 'legs', role: 'Where the talker stands: stands, cables and bodypacks stay clear of the feet and the walking path.', solid: S.legs, listIn: [], prov: FIG },
  { id: 'f9.camera', label: 'the camera and its frame', short: 'camera', role: 'What the camera sees decides where a boom may go: just above the top of the frame. A mic on top of the camera points the right way, but it is as far from the talker as the camera is.', solid: { kind: 'box', ...CAMERA_BOX }, variants: ['set', 'outdoor'], prov: DD },
  { id: 'f9.counter', label: 'the counter', short: 'counter', role: 'Part of the set. A planted mic can hide here, in a prop, aimed at the action on top.', solid: { kind: 'box', ...COUNTER_BOX }, variants: ['set'], prov: DD },
  { id: 'f9.keys', label: 'the keys (the practical sound)', short: 'keys', role: 'A practical sound: real keys put down on the counter during the line. It has its own place and its own moment — a planted mic can cover it on its own channel.', variants: ['set'], prov: DD },
  { id: 'f9.operator', label: 'the boom operator', short: 'operator', role: 'A trained boom operator stands outside the frame and follows the talker with the mic from a rehearsed, safe position — the pole’s end in their hands.', solid: { kind: 'box', ...OPERATOR.box }, variants: ['set', 'outdoor'], prov: DD },
  { id: 'f9.line', label: 'overhead power line', short: 'power line', role: 'Keep the pole, the stands and every mic at least 3 m (10 ft) from it — farther if you do not know the voltage. If you cannot be sure of the clearance, the pole stays down.', variants: ['outdoor'], prov: { kind: 'sourced', src: 'OSHA-ELEC', quote: 'Stay at least 10 feet away from overhead power lines.' } },
  // The reach of a pole or a clip: a stop the bezel can name (no solid).
  { id: 'clamp', label: 'how far the pole or the clip reaches', short: 'reach', role: 'A boom pole reaches only so far from the operator’s hands, and a clip only from where it grips.', listIn: [], prov: ill('the pole’s reach (2.5 m) and a clip’s (4 cm): drawing defaults') },
];

const envelopes: Envelope[] = [
  { id: 'f9.headroom', label: 'the camera’s frame above the talker’s head', shape: headroomKeepOut(FRAME, HEAD_TOP), prov: ill('the medium shot’s headroom: between the ray to the top of the head and the frame’s top edge (location.ts)'), variants: ['set', 'outdoor'] },
  { id: 'f9.power', label: '3 m (10 ft) from the power line', shape: powerLineKeepOut(POWER_LINE), prov: { kind: 'sourced', src: 'OSHA-ELEC', quote: 'Stay at least 10 feet away from overhead power lines.' }, variants: ['outdoor'] },
];

const rims: Rim[] = [
  { id: 'grip', label: 'the boom operator’s hands', c: GRIP, axis: v3(0, 0, 1), r: 0, variants: ['set', 'outdoor'], types: ['locBoomSgCap', 'locBoomHyper', 'locBoomFurCap'] },
  { id: 'lav', label: 'a clip on the shirt, above the breastbone', c: LAV_CLIP, axis: v3(1, 0, 0), r: 0, types: ['locLav'] },
  { id: 'clip.ear', label: 'a headset over the right ear', c: onAnchor(FRAME_V, { x: EAR.x, y: EAR.y, z: EAR_HALF }), axis: v3(0, 0, 1), r: 0, variants: ['live'], types: ['vocHeadset'] },
];

export const F09_MODEL: InstrumentModel = {
  id: 'f09-location',
  name: 'a talker on location',
  parts,
  regions: [
    ...voiceRegions(FRAME_V, { mouthPart: 'v.mouth', nosePart: 'v.nose' }),
    { id: 'r.keys', partId: 'f9.keys', label: 'the keys', anchor: KEYS, prov: DD, variants: ['set'], note: 'Keys put down on the counter: a short, bright practical sound, about 40 cm in front of and below the talker’s mouth.' },
  ],
  surfaces: [mouthSurface(FRAME_V, { partId: 'v.mouth' }), { id: 'keys', partId: 'f9.keys', label: 'the keys', point: KEYS, normal: v3(1, 0, 0), target: true, plus: { words: 'from', key: 'FROM' }, variants: ['set'] }],
  lines: [mouthLine(FRAME_V, {})],
  envelopes,
  variants: F09_VARIANTS,
  defaultVariant: 'set',
  views: F09_VIEWS.set,
  viewsByVariant: { set: F09_VIEWS.set, outdoor: F09_VIEWS.outdoor, live: F09_VIEWS.live },
  // The location is the subject: every view keeps its authored box (the
  // camera, the operator and the line stay on the glass).
  fitAuthored: { side: true, top: true },
  // On a stage the setups keep to the head and shoulders (a 6 cm handheld
  // was a few pixels framed head to floor); the stand runs on off the edge.
  setupFrameMaxByVariant: { live: { side: { u0: -450, u1: 1000, v0: -430, v1: 640 }, top: { u0: -450, u1: 1000, v0: -480, v1: 480 } } },
  yFloor: VOICE_DIMS.lipStanding,
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { set: null, outdoor: null, live: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE TALKER’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};
