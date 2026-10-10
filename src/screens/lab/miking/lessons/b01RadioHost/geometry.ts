/**
 * B01 RADIO, PODCAST AND STUDIO HOSTS — where things are (charter §2 layer
 * 2). Frame V on the HOST (lessons/shared/voice: the lip point at the origin,
 * +x straight out of the mouth, +y DOWN, +z to the host's right, mm), seated
 * at a desk (shared/broadcast/talkerPose.ts: the desk top 450 mm below the
 * lips, the floor 1190 mm below). Two set-ups (the variants):
 *
 *   studio  A PODCAST OR RADIO STUDIO: the host alone at the desk, on
 *           closed-back headphones, a mic on a desk arm.
 *   twoHosts TWO HOSTS: the host and a second host facing
 *           each other across a 1.4 m desk, both on closed-back headphones,
 *           each with a mic on a desk arm clamped to the desk's front edge,
 *           a laptop beside each, a script in front.
 *   live    A LIVE TALK PROGRAM: the host alone at the same desk, an
 *           audience in front, the PA loudspeaker at the stage's front
 *           corner facing the audience — its back and side toward the desk.
 *
 * Sources: docs/labs/miking/radio_host/SOURCES.md, GEOMETRY_PROPOSAL.md.
 * Every position is a DRAWING DEFAULT (none is sourced): the desk's size, the
 * second host's place (1.5 m lip to lip), the clamps, the laptops, the PA.
 */
import type { Envelope, InstrumentModel, Part, Provenance, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { DESK_TOP_Y, HOST, SEATED, SEATED_FLOOR, type Talker } from '../shared/broadcast/talkerPose.ts';
import { REACH_PART, VOICE_IDS, deskArm, talkerIds, talkerParts, talkerVoice } from '../shared/broadcast/talkerModel.ts';
import { deskPlate } from '../shared/broadcast/deskReflection.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (radio_host/GEOMETRY_PROPOSAL.md §1)');

/** The two hosts: the host at the origin, the second host across the desk. */
export const HOST_A: Talker = HOST;
export const HOST_B: Talker = { id: 'hostB', lip: v3(1500, 0, 0), facing: -1 };
export const IDS_A = VOICE_IDS;
export const IDS_B = talkerIds('hB');

/** The desk: about 1.4 m deep between the two hosts, 1.3 m wide. */
export const DESK = { min: v3(SEATED.deskEdge.mm, DESK_TOP_Y, -650), max: v3(HOST_B.lip.x - SEATED.deskEdge.mm, DESK_TOP_Y + SEATED.deskThick.mm, 650) };
/** The desk top as a reflecting plate (deskReflection.ts). */
export const DESK_PLATE = deskPlate(DESK_TOP_Y, DESK.min.x, DESK.max.x, DESK.min.z, DESK.max.z);

/** Each arm clamps on the desk's SIDE edge to the host's left, 39 cm back
 *  from the front edge, and reaches forward over the desk to the mouth (owner
 *  2026-10-10: not rising in front of the chest); the grip is the riser post's
 *  top, 12 cm above the desk. */
export const ARM_BACK = 390;
export const GRIP_A = v3(DESK.min.x + ARM_BACK, DESK_TOP_Y - 120, DESK.min.z + 20);
export const GRIP_B = v3(DESK.max.x - ARM_BACK, DESK_TOP_Y - 120, DESK.max.z - 20);

/** A laptop beside each host (its screen facing them), and the eyes' line to it. */
export const LAPTOP_A = v3(660, DESK_TOP_Y, -380);
export const LAPTOP_B = v3(HOST_B.lip.x - 660, DESK_TOP_Y, 380);
export const SCREEN_A = v3(LAPTOP_A.x + 120, DESK_TOP_Y - 120, LAPTOP_A.z);
export const SCRIPT_A = v3(420, DESK_TOP_Y, 140);

/** The PA (live): a cabinet on a pole at the stage's front corner, 2.6 m in
 *  front of the host and 1.1 m to their left, facing the audience (+x). */
export const PA_C = v3(2600, SEATED_FLOOR - 1700, -1100);

export const B01_VARIANTS: Variant[] = [
  { id: 'studio', label: 'STUDIO', blurb: 'A podcast or radio studio: the host at a desk on closed-back headphones, a mic on a desk arm — no loudspeakers on.', phrase: 'in a studio, at a desk' },
  { id: 'twoHosts', label: 'TWO HOSTS', blurb: 'Two hosts facing each other across the desk, each on headphones with their own mic on a desk arm.', phrase: 'in a studio, two hosts at a desk' },
  { id: 'live', label: 'LIVE SHOW', blurb: 'A live talk program: the host at the desk on a stage, an audience in front, the PA loudspeaker at the stage’s front corner facing them.', phrase: 'live, on a stage with a PA' },
];

export const B01_VIEWS: Record<'studio' | 'twoHosts' | 'live', { side: ViewBox; top: ViewBox }> = {
  studio: { side: { u0: -700, u1: 1500, v0: -620, v1: 1260 }, top: { u0: -700, u1: 1500, v0: -820, v1: 820 } },
  twoHosts: { side: { u0: -700, u1: 2050, v0: -620, v1: 1260 }, top: { u0: -700, u1: 2050, v0: -820, v1: 820 } },
  live: { side: { u0: -700, u1: 3000, v0: -1000, v1: 1260 }, top: { u0: -700, u1: 3000, v0: -1500, v1: 820 } },
};

const armTypes = ['bcDynArm', 'bcDynSuper', 'bcLdcArm'];
const armA = deskArm('arm.A', 'the host’s desk arm', GRIP_A, DESK_TOP_Y, armTypes);
const armB = deskArm('arm.B', 'the second host’s desk arm', GRIP_B, DESK_TOP_Y, armTypes, ['twoHosts']);
const voiceA = talkerVoice(HOST_A, IDS_A);
const voiceB = talkerVoice(HOST_B, IDS_B, ['twoHosts']);

const parts: Part[] = [
  ...talkerParts(HOST_A, IDS_A, { who: 'the host', mouthRole: 'Where the host’s voice leaves — almost all of it. Every distance here is measured from the lips to the front of the mic.' }),
  ...talkerParts(HOST_B, IDS_B, { who: 'the second host', headRole: 'Across the desk, on their own mic. Their voice reaches the host’s mic too — later and lower: bleed.' }, ['twoHosts']),
  { id: 'b1.desk', label: 'the desk', short: 'desk', role: 'A hard, flat top under the mouths: it reflects the voice back up into the mic, a little later. Keep the capsule away from it where you can.', solid: { kind: 'box', ...DESK }, prov: DD },
  armA.part,
  armB.part,
  { id: 'b1.laptop', label: 'the laptop', short: 'laptop', role: 'The host reads the rundown here. The mic and its arm stay out of the line from the eyes to the screen; its fan is a noise to check.', solid: { kind: 'box', min: v3(LAPTOP_A.x - 115, DESK_TOP_Y - 16, LAPTOP_A.z - 165), max: v3(LAPTOP_A.x + 135, DESK_TOP_Y, LAPTOP_A.z + 165) }, prov: DD },
  { id: 'b1.script', label: 'the script', short: 'script', role: 'Paper on the desk: page turns are a noise to check, and its surface reflects a little too.', prov: DD },
  { id: 'b1.chair', label: 'the chair', short: 'chair', role: 'A quiet chair that lets the host sit naturally: a creaking or swivelling chair is a noise the mic hears.', listIn: [], prov: DD },
  { id: 'b1.pa', label: 'the PA loudspeaker', short: 'PA', role: 'It faces the audience, but its back and side spill toward the desk: every open mic hears it. Fewest open mics, and the pattern’s rejection toward it.', variants: ['live'], prov: DD },
  REACH_PART,
];

// The sight line to the laptop is said in words (a keep-out capsule from the
// eyes crossed every close start: the screen sits low and to the side).
const envelopes: Envelope[] = [];

export const B01_MODEL: InstrumentModel = {
  id: 'b01-radio-host',
  name: 'a host at a desk',
  parts,
  regions: [...voiceA.regions, ...voiceB.regions],
  surfaces: [voiceA.surface, voiceB.surface],
  lines: [voiceA.line, voiceB.line],
  envelopes,
  variants: B01_VARIANTS,
  defaultVariant: 'studio',
  views: B01_VIEWS.studio,
  // The room is the subject: every view keeps its authored box (the second
  // host and, live, the PA stay on the glass).
  fitAuthored: { side: true, top: true },
  viewsByVariant: { studio: B01_VIEWS.studio, twoHosts: B01_VIEWS.twoHosts, live: B01_VIEWS.live },
  // The setups keep to the host, the desk and the arm (a 12 cm distance on
  // a whole-room drawing was a few pixels on a phone).
  setupFrameMax: { side: { u0: -420, u1: 1000, v0: -480, v1: 720 }, top: { u0: -420, u1: 1000, v0: -620, v1: 520 } },
  setupFrameMaxByVariant: { twoHosts: { side: { u0: -420, u1: 1900, v0: -480, v1: 720 }, top: { u0: -420, u1: 1900, v0: -620, v1: 620 } } },
  yFloor: { mm: SEATED_FLOOR, prov: { kind: 'unknown', needed: 'the floor below a seated talker’s lips (talkerPose: desk 740 + 450 mm)' }, placeholder: true },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims: [armA.rim, armB.rim],
  ports: { studio: null, twoHosts: null, live: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE HOST’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};
