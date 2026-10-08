/**
 * B05 LAVALIER, HEADSET AND CONCEALED PICKUP — where things are (charter §2
 * layer 2). Frame V on the PRESENTER (the lip point at the origin, +x
 * straight out of the mouth, +y DOWN, +z to their right, mm), standing (the
 * voice family's figure, the lips 1550 mm above the floor), in a jacket and
 * shirt. The body-worn family (shared/broadcast/bodyWorn.ts) gives the
 * mount points. Two set-ups (the variants):
 *
 *   studio  A STUDIO: the presenter standing in front of a camera (2.5 m,
 *           a close shot), no loudspeakers — the picture and a clean voice.
 *   live    LIVE, ON A STAGE: the presenter at a lectern with its own
 *           gooseneck, the PA at the stage's front corner on the presenter's
 *           right, facing the audience — its back and side toward the stage.
 *
 * Sources: docs/labs/miking/lavalier_headset/SOURCES.md, GEOMETRY_PROPOSAL.md
 * (and the Lab 7a register, radio_host/SOURCES.md §0). Every position is a
 * DRAWING DEFAULT unless named: the garment, the clip points, the pack, the
 * camera, the lectern (B06's), the PA. The bands the mount points fall in
 * are sourced (bodyWorn.LAV_BAND, HEADSET_BAND).
 */
import type { InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { EAR, EAR_HALF, FRAME_V, HEAD_C, HEAD_R, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { VOICE_PART_WORDS } from '../shared/voice/voiceModel.ts';
import { mouthLine, mouthSurface, voiceRegions } from '../shared/voice/voiceZones.ts';
import { REACH_PART } from '../shared/broadcast/talkerModel.ts';
import { BODY_MOUNTS, packAt } from '../shared/broadcast/bodyWorn.ts';
import { SHOT_PRESETS, cameraBody, cameraForShot } from '../shared/broadcast/cameraFrame.ts';
import { LECTERN } from '../b06Panels/geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (lavalier_headset/GEOMETRY_PROPOSAL.md §2, §7)');
const FIG = ill('the shared adult figure standing (voicePose): a drawing default');

/** The floor (frame V: the lips 1550 mm above it). */
export const FLOOR = VOICE_DIMS.lipStanding.mm;
export const HEAD_TOP = v3(HEAD_C.x, HEAD_C.y - HEAD_R, 0);

/* ── the studio camera (a close shot, 2.5 m out, at eye level) ── */
export const LENS = v3(2500, -80, 0);
export const CAMERA = cameraForShot(LENS, v3(0, 0, 0), SHOT_PRESETS.close);
export const CAMERA_BOX = cameraBody(CAMERA);

/* ── the lectern (the same lectern as B06: its drawing default) and the PA ── */
export { LECTERN };
/** The PA at the stage's front corner on the presenter's right, facing the
 *  audience (+x): 1.5 m out, 1.5 m across, its centre 1.7 m up. */
export const PA_C = v3(1500, FLOOR - 1700, 1500);

/** The bodypack at the back of the belt. */
export const PACK = packAt(true);

export const B05_VARIANTS: Variant[] = [
  { id: 'studio', label: 'STUDIO', blurb: 'A studio: the presenter standing in front of a camera, a close shot, no loudspeakers — a clean voice and the picture.', phrase: 'in a studio, on camera' },
  { id: 'live', label: 'LIVE', blurb: 'Live on a stage: the presenter at a lectern that has its own gooseneck, the PA at the stage’s front corner on their right.', phrase: 'live, at a lectern with a PA' },
];

export const B05_VIEWS: Record<'studio' | 'live', { side: ViewBox; top: ViewBox }> = {
  studio: { side: { u0: -560, u1: 2900, v0: -620, v1: 1620 }, top: { u0: -560, u1: 2900, v0: -1100, v1: 1100 } },
  live: { side: { u0: -560, u1: 1900, v0: -600, v1: 1620 }, top: { u0: -560, u1: 1900, v0: -900, v1: 1950 } },
};

const W = VOICE_PART_WORDS;
const S = SINGER_SOLIDS;
const LAV_TYPES = ['locLav', 'lavCard'];
const HS_TYPES = ['vocHeadset', 'hsCard'];

const parts: Part[] = [
  { id: 'v.mouth', ...W.mouth, role: 'Where the voice leaves the presenter — almost all of it. Every distance here is measured from the lips to the front of the mic.', prov: FIG },
  { id: 'v.nose', ...W.nose, prov: FIG },
  { id: 'v.head', ...W.head, label: 'head and face', role: 'The head turns, reads down and smiles: a headset turns with it; a mic on the chest does not. Nothing presses on the face or the ear.', solid: S.head, prov: FIG },
  { id: 'v.chest', label: 'chest (where a lav clips)', short: 'chest', role: 'A lavalier clips here — over the breastbone, on a lapel, the collar, the tie or the neckline — with the wearer’s agreement. It moves with the chest, not with the head.', solid: S.torso, prov: FIG },
  { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar: a lav right under the chin hears the jaw and the collar as well.', solid: S.neck, listIn: [], prov: FIG },
  { id: 'player.legs', label: 'the presenter’s legs and feet', short: 'legs', role: 'Standing: the pack’s cable and any stand stay clear of the feet.', solid: S.legs, listIn: [], prov: FIG },
  { id: 'b5.jacket', label: 'the jacket and the shirt', short: 'jacket', role: 'The garments a lav clips to and hides under: their edges hold the clip, their layers can rub and dull a hidden capsule. Wardrobe approves any change to them.', prov: DD },
  { id: 'b5.pack', label: 'the bodypack transmitter', short: 'pack', role: 'On the belt at the back: secured where it cannot fall, press into the wearer or pull the cable; its antenna hangs as its manual says.', prov: DD },
  { id: 'bc.camera', label: 'the camera', short: 'camera', role: 'What the shot shows decides between a visible lav, a hidden one and a headset. A mic on the chest is in the picture; a hidden one is not.', solid: { kind: 'box', ...CAMERA_BOX }, variants: ['studio'], prov: DD },
  { id: 'b5.lectern', label: 'the lectern and its gooseneck', short: 'lectern', role: 'A lectern with its own gooseneck: when the headset or the lav is live, the lectern mic is muted — two open mics on one voice comb.', solid: { kind: 'box', min: v3(LECTERN.x0, LECTERN.top + 10, -LECTERN.halfW), max: v3(LECTERN.x1, FLOOR, LECTERN.halfW) }, variants: ['live'], prov: ill('the lectern of B06 (panels_press drawing default)') },
  { id: 'b5.pa', label: 'the PA loudspeaker', short: 'PA', role: 'It faces the audience; every open mic on the stage hears its back and side. A capsule near the mouth keeps the voice ahead of it.', variants: ['live'], prov: DD },
  REACH_PART,
];

const garmentRim = (id: keyof typeof BODY_MOUNTS, label: string): Rim => ({ id: `clip.${id}`, label, c: BODY_MOUNTS[id].grip, axis: v3(1, 0, 0), r: 0, types: LAV_TYPES });
const rims: Rim[] = [
  garmentRim('sternum', 'a clip on the shirt, over the breastbone'),
  garmentRim('lapel', 'a clip on the jacket’s lapel'),
  garmentRim('collar', 'a clip on the collar'),
  garmentRim('tie', 'a clip on the tie'),
  garmentRim('neckline', 'a clip at the neckline'),
  { id: 'clip.ear', label: 'a headset over the right ear', c: v3(EAR.x, EAR.y, EAR_HALF), axis: v3(0, 0, 1), r: 0, types: HS_TYPES },
  { id: 'goose.lectern', label: 'the lectern’s gooseneck socket', c: LECTERN.socket, axis: v3(0, -1, 0), r: 0, variants: ['live'], types: ['bcGoose', 'bcGooseSuper'] },
];

export const B05_MODEL: InstrumentModel = {
  id: 'b05-lavalier',
  name: 'a presenter with a body mic',
  parts,
  regions: voiceRegions(FRAME_V, { mouthPart: 'v.mouth', nosePart: 'v.nose' }),
  surfaces: [mouthSurface(FRAME_V, { partId: 'v.mouth' })],
  lines: [mouthLine(FRAME_V, {})],
  envelopes: [],
  variants: B05_VARIANTS,
  defaultVariant: 'studio',
  views: B05_VIEWS.studio,
  viewsByVariant: { studio: B05_VIEWS.studio, live: B05_VIEWS.live },
  fitAuthored: { side: true, top: true },
  // The setups keep to the head and the chest (a 2–3 cm headset distance on a
  // whole-stage drawing was a few pixels on a phone).
  setupFrameMax: { side: { u0: -420, u1: 640, v0: -380, v1: 560 }, top: { u0: -420, u1: 640, v0: -420, v1: 420 } },
  yFloor: VOICE_DIMS.lipStanding,
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { studio: null, live: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE PRESENTER’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};

/** The places the step drawings and the tests read. */
export const STERNUM = BODY_MOUNTS.sternum;
export const LAPEL = BODY_MOUNTS.lapel;
export const HEADSET = BODY_MOUNTS.headset;
