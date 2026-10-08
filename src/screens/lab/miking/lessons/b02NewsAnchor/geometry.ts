/**
 * B02 NEWS ANCHORS AND SEATED INTERVIEWS — where things are (charter §2
 * layer 2). Frame V on the ANCHOR (the lip point at the origin, +x straight
 * out of the mouth toward the camera, +y DOWN, +z to their right, mm), seated
 * at an anchor desk (shared/broadcast/talkerPose.ts: the desk top 450 mm
 * below the lips, the floor 1190 mm below). The guest sits beside them on
 * their right, both facing the camera; to talk they turn to each other. It
 * assembles the shared families: the seated talker and the desk (group 1),
 * the camera frame, the fixed boom and the body-worn mount points (group 2).
 * Three set-ups (the variants):
 *
 *   close    CLOSE ON THE ANCHOR: the camera 2.6 m in front at eye level,
 *            head and shoulders.
 *   twoShot  THE TWO-SHOT: the same camera wider, both the anchor and the
 *            guest in the picture — the frame's top higher, the boom farther.
 *   public   A PUBLIC INTERVIEW: the two-shot, an audience in front and a PA
 *            at the stage's front corner on the anchor's left.
 *
 * Sources: docs/labs/miking/news_anchor/SOURCES.md, GEOMETRY_PROPOSAL.md.
 * Every position is a DRAWING DEFAULT (owner list: seat angle and spacing,
 * the camera's lens): the desk, the guest's seat 80 cm along it, the camera,
 * the shots, the fixed boom's stand and arm, the gooseneck's base, the
 * boundary's place, the PA. The boom's start is DERIVED from the frame.
 */
import type { Envelope, InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { DESK_TOP_Y, HOST, SEATED, SEATED_FLOOR, onTalker, type Talker } from '../shared/broadcast/talkerPose.ts';
import { REACH_PART, VOICE_IDS, talkerIds, talkerParts, talkerVoice } from '../shared/broadcast/talkerModel.ts';
import { deskPlate } from '../shared/broadcast/deskReflection.ts';
import { BODY_MOUNTS } from '../shared/broadcast/bodyWorn.ts';
import { SHOT_PRESETS, boomAbove, cameraBody, cameraForShot, headroomFan, sideFan, type BroadcastCamera } from '../shared/broadcast/cameraFrame.ts';
import { standBoomRule } from '../shared/broadcast/boomPole.ts';
import { SHOTGUN_BODY } from '../shared/fieldmics/fieldMics.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (news_anchor/GEOMETRY_PROPOSAL.md §1; owner list: seat spacing, the camera)');
const LIP = v3(0, 0, 0);

/* ── the two talkers ── */
export const ANCHOR: Talker = HOST;
/** The guest beside the anchor on their right, 80 cm along the desk. */
export const GUEST: Talker = { id: 'guest', lip: v3(0, 0, 800), facing: 1 };
export const IDS_A = VOICE_IDS;
export const IDS_G = talkerIds('g');
export const HEAD_TOP = v3(HEAD_C.x, HEAD_C.y - HEAD_R, 0);

/** The anchor desk: 70 cm deep in front of them, from 65 cm on the anchor's
 *  left to 65 cm past the guest. */
export const DESK = { min: v3(SEATED.deskEdge.mm, DESK_TOP_Y, -650), max: v3(760, DESK_TOP_Y + SEATED.deskThick.mm, 1450) };
export const DESK_PLATE = deskPlate(DESK_TOP_Y, DESK.min.x, DESK.max.x, DESK.min.z, DESK.max.z);

/* ── the camera ── */
export const LENS = v3(2600, -60, 0);
/** Close on the anchor: head and shoulders. */
export const CAM_CLOSE: BroadcastCamera = cameraForShot(LENS, LIP, SHOT_PRESETS.close);
/** The two-shot: the same camera wider, framed between the two talkers. */
export const CAM_TWO: BroadcastCamera = cameraForShot(LENS, LIP, SHOT_PRESETS.wide, v3(0, 0, GUEST.lip.z / 2));
export const CAM_OF: Readonly<Record<'close' | 'twoShot' | 'public', BroadcastCamera>> = { close: CAM_CLOSE, twoShot: CAM_TWO, public: CAM_TWO };

/* ── the fixed boom: above the frame and a little in front, coming from the
 *  anchor's left (the lab's 45° and 20°); for the short shotgun the TUBE's
 *  tip keeps 15 cm clear of the frame, so its capsule — where distances are
 *  read — sits the tube's length farther back (fieldmics SHOTGUN_BODY) ── */
const TUBE = SHOTGUN_BODY.fore!.mm;
function boomFor(cam: BroadcastCamera) {
  const tip = boomAbove(cam, LIP, { clearance: 150, elevDeg: 45, planDeg: -20 });
  const p = v3(tip.p.x - tip.aim.x * TUBE, tip.p.y - tip.aim.y * TUBE, tip.p.z - tip.aim.z * TUBE);
  return { p, d: tip.d + TUBE, aim: tip.aim, tip: tip.p };
}
export const BOOM_CLOSE = boomFor(CAM_CLOSE);
export const BOOM_TWO = boomFor(CAM_TWO);
/** The fixed stand's arm runs level toward the anchor's left (−z), then the
 *  stand drops to the floor — out of the two-shot (boomPole.standBoomRule). */
export const STAND_RULE = standBoomRule(v3(0, 0, -1));

/* ── the desk mics ── */
/** The gooseneck's weighted base on the desk, in front of the anchor and a
 *  little to their left (as the panel lesson's: a drawing default). */
export const GOOSE_BASE = v3(330, DESK_TOP_Y - 30, -210);
/** The boundary lying on the desk in front of the anchor, its front toward them. */
export const BOUNDARY_AT = v3(330, DESK_TOP_Y, 40);

/* ── the lavs ── */
export const LAV_A = BODY_MOUNTS.sternum;
export const LAV_G_AT = onTalker(GUEST, BODY_MOUNTS.sternum.at);
export const LAV_G_GRIP = onTalker(GUEST, BODY_MOUNTS.sternum.grip);

/** The PA (public): at the stage's front corner on the anchor's left, facing
 *  the audience (+x): 2.2 m out, 1.6 m across, its centre 1.7 m up. */
export const PA_C = v3(2200, SEATED_FLOOR - 1700, -1600);

export const B02_VARIANTS: Variant[] = [
  { id: 'close', label: 'CLOSE', blurb: 'Close on the anchor: the camera 2.6 m in front, head and shoulders; the guest beside them, out of the picture.', phrase: 'close on the anchor' },
  { id: 'twoShot', label: 'TWO-SHOT', blurb: 'The two-shot: the same camera wider, the anchor and the guest both in the picture — the frame’s top higher, the boom farther away.', phrase: 'in a two-shot' },
  { id: 'public', label: 'PUBLIC', blurb: 'A public interview: the two-shot, an audience in front, a PA at the stage’s front corner on the anchor’s left.', phrase: 'a public interview with a PA' },
];

export const B02_VIEWS: Record<'close' | 'twoShot' | 'public', { side: ViewBox; top: ViewBox }> = {
  close: { side: { u0: -700, u1: 3000, v0: -1000, v1: 1260 }, top: { u0: -700, u1: 3000, v0: -1400, v1: 1700 } },
  twoShot: { side: { u0: -700, u1: 3000, v0: -1100, v1: 1260 }, top: { u0: -700, u1: 3000, v0: -1400, v1: 1700 } },
  public: { side: { u0: -700, u1: 3000, v0: -1100, v1: 1260 }, top: { u0: -700, u1: 3000, v0: -2000, v1: 1700 } },
};

const voiceA = talkerVoice(ANCHOR, IDS_A);
const voiceG = talkerVoice(GUEST, IDS_G);

const parts: Part[] = [
  ...talkerParts(ANCHOR, IDS_A, { who: 'the anchor', mouthRole: 'Where the anchor’s voice leaves — almost all of it. Every distance here is measured from the lips to the front of the mic.', headRole: 'The head turns to the camera, to the guest and down to the script: a chest mic stays put, a boom or a desk mic stays where it is — only the mouth moves.', chestRole: 'A lav clips here, over the breastbone, with the anchor’s agreement and wardrobe’s — on a firm edge, clear of the jacket’s movement.' }),
  ...talkerParts(GUEST, IDS_G, { who: 'the guest', headRole: 'Beside the anchor, on their own lav: their voice reaches the anchor’s mics too — later and lower.' }),
  { id: 'bc.desk', label: 'the anchor desk', short: 'desk', role: 'A hard top under the mouths: it reflects the voice back up into a raised desk mic. Papers, a keyboard and taps travel through it. A boundary mic lies on it.', solid: { kind: 'box', ...DESK }, prov: DD },
  { id: 'b2.base', label: 'the gooseneck’s base', short: 'base', role: 'A weighted base on the desk, away from the papers and the hands, so taps stay out of the neck.', prov: DD },
  { id: 'bc.camera', label: 'the camera', short: 'camera', role: 'Its widest frame decides how close a boom may come. A desk mic is in the picture; a hidden lav is not.', solid: { kind: 'box', ...cameraBody(CAM_CLOSE) }, prov: DD },
  { id: 'b2.stand', label: 'the boom stand', short: 'boom stand', role: 'A fixed stand with a level arm, for a seated talker who stays put: rigged and secured by qualified crew before anyone sits beneath it, out of every frame and light.', prov: DD },
  { id: 'b2.pa', label: 'the PA loudspeaker', short: 'PA', role: 'A public interview: it faces the audience, but every open mic on the set hears its back and side.', variants: ['public'], prov: DD },
  REACH_PART,
];

const fan = (id: string, label: string, shape: Envelope['shape'], variants: string[]): Envelope => ({ id, label, shape, prov: ill('the shot’s edge (cameraFrame.ts): a simplified picture of the frame, as wide as it is at the talker'), variants });
const envelopes: Envelope[] = [
  fan('b2.headroom', 'the camera’s frame above the anchor’s head', headroomFan(CAM_CLOSE, HEAD_TOP), ['close']),
  fan('b2.left', 'the camera’s frame on the anchor’s left', sideFan(CAM_CLOSE, LIP, -1), ['close']),
  fan('b2.headroom.2', 'the camera’s frame above the two heads', headroomFan(CAM_TWO, HEAD_TOP), ['twoShot', 'public']),
  fan('b2.left.2', 'the camera’s frame on the anchor’s left', sideFan(CAM_TWO, LIP, -1), ['twoShot', 'public']),
];

const rims: Rim[] = [
  { id: 'clip.sternum', label: 'a clip on the anchor’s shirt, over the breastbone', c: LAV_A.grip, axis: v3(1, 0, 0), r: 0, types: ['locLav'] },
  { id: 'clip.guest', label: 'a clip on the guest’s shirt, over the breastbone', c: LAV_G_GRIP, axis: v3(1, 0, 0), r: 0, types: ['locLav'] },
  { id: 'goose.desk', label: 'the gooseneck’s base on the desk', c: GOOSE_BASE, axis: v3(0, -1, 0), r: 0, types: ['bcGoose', 'bcGooseSuper'] },
];

export const B02_MODEL: InstrumentModel = {
  id: 'b02-news-anchor',
  name: 'an anchor and a guest at a desk',
  parts,
  regions: [...voiceA.regions, ...voiceG.regions],
  surfaces: [voiceA.surface, voiceG.surface],
  lines: [voiceA.line, voiceG.line],
  envelopes,
  variants: B02_VARIANTS,
  defaultVariant: 'close',
  views: B02_VIEWS.close,
  viewsByVariant: { close: B02_VIEWS.close, twoShot: B02_VIEWS.twoShot, public: B02_VIEWS.public },
  fitAuthored: { side: true, top: true },
  // The setups keep to the desk, the talkers and the boom's stand (the camera
  // 2.6 m out made a 21 cm lav distance a few pixels on a phone).
  setupFrameMax: { side: { u0: -700, u1: 1200, v0: -950, v1: 1260 }, top: { u0: -700, u1: 1200, v0: -1250, v1: 1500 } },
  yFloor: { mm: SEATED_FLOOR, prov: { kind: 'unknown', needed: 'the floor below a seated talker’s lips (talkerPose: desk 740 + 450 mm)' }, placeholder: true },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { close: null, twoShot: null, public: null },
  // The fixed boom stand: its arm runs level toward the anchor's left, then
  // the stand drops (the only 'stand' mics here are the boom's).
  mountRule: STAND_RULE,
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE ANCHOR’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};
