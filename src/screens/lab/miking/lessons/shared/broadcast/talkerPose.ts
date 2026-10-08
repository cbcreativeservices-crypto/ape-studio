/**
 * THE SEATED TALKER — Lab 7 (broadcast speech), "frame B" (docs/labs/miking/
 * radio_host/GEOMETRY_PROPOSAL.md §1). Built once by group 1 (B01 radio and
 * podcast hosts, B07 voiceover and guests, B06 panels); used again by group 2
 * (B02 news anchors, B05 seated body mics) and group 3. Pure: no React, so the
 * tests reach it (test/mikingLab7Broadcast.test.ts).
 *
 * FRAME. Frame V of the voice family (shared/voice/voiceSpec.ts): the LIP
 * POINT at the origin, +x straight out of the mouth, +y DOWN, +z to the
 * talker's RIGHT, millimetres. The head is the voice family's own (HEAD_C,
 * HEAD_R, NOSE …), so every vocal distance reads the same seated or standing.
 *
 * WHAT IS HERE (every number a DRAWING DEFAULT unless named — no source gives
 * a seated adult's geometry; the owner list carries them):
 *   SEATED           the seat, the desk top, the floor below the lips
 *                    (desk 740 mm high, the lips 450 mm above the desk top:
 *                    the proposal's own defaults);
 *   seatedPose       the shared player figure seated in profile (facing ±x)
 *                    and from above, forearms resting on the desk;
 *   seatedSolids     the same body as collision solids (head, neck, torso,
 *                    forearms, thighs), for a talker at ANY place facing +x
 *                    or −x (a second host across the desk);
 *   Talker           where a talker is (lip point + facing) and the voice
 *                    anchor that every vocal zone is built on;
 *   HEAD TURN        yaw ψ ∈ [−60°, +60°] (+ toward the talker's right) and
 *                    pitch θ ∈ [−25°, +10°] (− = reading down) about the
 *                    head's centre: where the mouth goes and which way its
 *                    axis points (`turnHead`), and what a FIXED mic then
 *                    reads (`turnReadout`: distance, angle off the mouth's
 *                    axis, how far the mic now points off the mouth). This one
 *                    control teaches B01 "turning", B02 "head turns", B05
 *                    "chest versus head" and B06 "turning to a neighbour".
 * The turn limits are drawing defaults; the readouts are DERIVED (geometry
 * only — a simplified picture: the head turns about its centre).
 */
import type { PlayerPose } from '../players/playerPose.ts';
import { BODY, pt } from '../players/playerPose.ts';
import type { Shape3, Vec3 } from '../../../engine/model/types.ts';
import { FRAME_V, HEAD_C, HEAD_R, dd, type VoiceAnchor } from '../voice/voiceSpec.ts';
import { micToMouth } from '../field/location.ts';

const DEG = Math.PI / 180;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** The seated dimensions — the record (all drawing defaults). */
export const SEATED = {
  /** The desk top above the floor (an adult desk). */
  deskHeight: dd(740, 'a desk’s height (radio_host/GEOMETRY_PROPOSAL §1: drawing default 740 mm)'),
  /** The lips above the desk top, sitting upright. */
  lipAboveDesk: dd(450, 'the lips above the desk top, seated (proposal §1: drawing default 450 mm)'),
  /** The seat's top above the floor. */
  seatHeight: dd(470, 'a chair’s seat height (drawing default)'),
  /** The desk's front edge in front of the lips (the chest a hand's width from it). */
  deskEdge: dd(60, 'how far the desk’s front edge sits in front of the lips — the host leaning in a little, the mouth about over the edge (drawing default)'),
  /** The desk top's thickness. */
  deskThick: dd(30, 'a desk top’s thickness (drawing default)'),
} as const;

/** The floor and the desk top below the lips (frame V, y down). */
export const SEATED_FLOOR = SEATED.deskHeight.mm + SEATED.lipAboveDesk.mm;
export const DESK_TOP_Y = SEATED.lipAboveDesk.mm;
export const SEAT_Y = SEATED_FLOOR - SEATED.seatHeight.mm;

/** The base of the neck (the collar): the voice family's standing figure's. */
export const NECK_B: Vec3 = v3(HEAD_C.x - 18, HEAD_C.y + 172, 0);

/* ── the talker's place ── */

/** A seated talker: the lip point in the scene's frame and the way they face
 *  (+1 = +x, as frame V; −1 = −x, a second host across the desk). */
export type Talker = { id: string; lip: Vec3; facing: 1 | -1 };
export const HOST: Talker = { id: 'host', lip: v3(0, 0, 0), facing: 1 };

/** A frame-V point (relative to a talker facing +x at the origin) placed on
 *  a talker: mirrored front-to-back and side-to-side when they face −x. */
export function onTalker(t: Talker, p: Vec3): Vec3 {
  return { x: t.lip.x + t.facing * p.x, y: t.lip.y + p.y, z: t.lip.z + t.facing * p.z };
}
/** The talker's voice anchor (voiceZones builds every vocal zone on it). */
export function talkerAnchor(t: Talker): VoiceAnchor {
  return { lip: t.lip, fwd: v3(t.facing, 0, 0), up: FRAME_V.up, right: v3(0, 0, t.facing) };
}

/** A collision solid of frame V placed on a talker. */
export function solidOnTalker(t: Talker, s: Shape3): Shape3 {
  const P = (p: Vec3) => onTalker(t, p);
  if (s.kind === 'capsule') return { kind: 'capsule', a: P(s.a), b: P(s.b), r: s.r };
  if (s.kind === 'box') {
    const a = P(s.min);
    const b = P(s.max);
    return { kind: 'box', min: v3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z)), max: v3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z)) };
  }
  throw new Error(`solidOnTalker: ${s.kind} is not placed`);
}

/* ── the seated figure (frame V, facing +x) ── */

const N = NECK_B;
/** Elbows and wrists: the forearms resting on the desk top (drawing defaults). */
const ELBOW_Y = DESK_TOP_Y - 18;
const WRIST_X = 250;

/** In profile, facing +x (the side view: u = x, v = y): the near side is the
 *  talker's RIGHT. */
export const SEATED_SIDE: PlayerPose = {
  view: 'side',
  posture: 'seated',
  facing: 1,
  head: { c: pt(HEAD_C.x, HEAD_C.y), r: HEAD_R },
  neck: pt(N.x, N.y),
  shoulderR: pt(N.x - 4, N.y + 58),
  shoulderL: pt(N.x - 18, N.y + 48),
  elbowR: pt(N.x + 60, ELBOW_Y),
  elbowL: pt(N.x + 44, ELBOW_Y - 6),
  handR: { wrist: pt(WRIST_X, DESK_TOP_Y - 26), dir: 0.06, kind: 'rest' },
  handL: { wrist: pt(WRIST_X - 20, DESK_TOP_Y - 30), dir: 0.06, kind: 'rest' },
  hipR: pt(N.x - 10, SEAT_Y - 70),
  hipL: pt(N.x - 22, SEAT_Y - 74),
  kneeR: pt(N.x + 430, SEAT_Y - 60),
  kneeL: pt(N.x + 412, SEAT_Y - 66),
  footR: pt(N.x + 470, SEATED_FLOOR),
  footL: pt(N.x + 440, SEATED_FLOOR),
  floor: SEATED_FLOOR,
};

/** From above (u = x, v = z), the chest facing +x — authored chest toward +v
 *  round the neck, turned by `facing` 0 (PlayerFigure.aboveTurn): local
 *  (right, fwd) lands at world (fwd, right), so the talker's right is +z. */
const N_TOP = pt(N.x, 0);
const L = (right: number, fwd: number) => pt(N_TOP.u - right, N_TOP.v + fwd);
export const SEATED_TOP: PlayerPose = {
  view: 'above',
  posture: 'seated',
  facing: 0,
  head: { c: L(0, HEAD_C.x - N.x), r: HEAD_R },
  neck: N_TOP,
  shoulderR: L(BODY.shoulderHalf - 12, -6),
  shoulderL: L(-(BODY.shoulderHalf - 12), -6),
  elbowR: L(220, 150),
  elbowL: L(-220, 150),
  handR: { wrist: L(150, WRIST_X - N.x), dir: Math.PI / 2 - 0.25, kind: 'above' },
  handL: { wrist: L(-150, WRIST_X - N.x), dir: Math.PI / 2 + 0.25, kind: 'above' },
  hipR: L(106, -10),
  hipL: L(-106, -10),
  kneeR: L(120, 420),
  kneeL: L(-120, 420),
  footR: L(126, 470),
  footL: L(-126, 470),
  floor: null,
};

/** A pose (side or above) placed on a talker. Side: moved to the talker's
 *  lips and, facing −x, mirrored (`facing` −1). Above: the joints are
 *  authored round the neck and TURNED by the figure (PlayerFigure.aboveTurn),
 *  so they are only moved — the neck onto the talker's — and `facing` turns
 *  the chest (0 = +x, π = −x). */
export function poseOnTalker(pose: PlayerPose, t: Talker): PlayerPose {
  const side = pose.view === 'side';
  const neckTo = onTalker(t, v3(N.x, 0, 0));
  const m = (q: { u: number; v: number }) => (side ? pt(t.lip.x + t.facing * q.u, t.lip.y + q.v) : pt(q.u - N_TOP.u + neckTo.x, q.v - N_TOP.v + neckTo.z));
  const hand = (h: PlayerPose['handR']) => ({ ...h, wrist: m(h.wrist), dir: side && t.facing < 0 ? Math.PI - h.dir : h.dir });
  return {
    ...pose,
    head: { c: m(pose.head.c), r: pose.head.r },
    neck: m(pose.neck),
    shoulderR: m(pose.shoulderR),
    shoulderL: m(pose.shoulderL),
    elbowR: m(pose.elbowR),
    elbowL: m(pose.elbowL),
    handR: hand(pose.handR),
    handL: hand(pose.handL),
    hipR: m(pose.hipR),
    hipL: m(pose.hipL),
    kneeR: m(pose.kneeR),
    kneeL: m(pose.kneeL),
    footR: m(pose.footR),
    footL: m(pose.footL),
    facing: side ? t.facing : t.facing < 0 ? Math.PI : 0,
    floor: side ? SEATED_FLOOR + t.lip.y : null,
  };
}

/**
 * The seated body as collision solids in frame V (facing +x), the same
 * masses the figure draws: the head (the voice family's sphere), the neck,
 * the torso down to the seat, the two forearms on the desk, the thighs under
 * it. A mic, its arm and its pop screen keep clear of them.
 */
export const SEATED_SOLIDS: Record<'head' | 'neck' | 'torso' | 'armR' | 'armL' | 'thighs', Shape3> = {
  head: { kind: 'capsule', a: HEAD_C, b: HEAD_C, r: HEAD_R },
  neck: { kind: 'capsule', a: v3(HEAD_C.x + 30, HEAD_C.y + 90, 0), b: v3(N.x, N.y, 0), r: 54 },
  torso: { kind: 'box', min: v3(N.x - 150, N.y - 10, -215), max: v3(N.x + 112, SEAT_Y - 40, 215) },
  armR: { kind: 'capsule', a: v3(N.x + 40, ELBOW_Y - 10, 205), b: v3(WRIST_X + 120, DESK_TOP_Y - 36, 150), r: 46 },
  armL: { kind: 'capsule', a: v3(N.x + 40, ELBOW_Y - 10, -205), b: v3(WRIST_X + 120, DESK_TOP_Y - 36, -150), r: 46 },
  thighs: { kind: 'box', min: v3(N.x - 120, SEAT_Y - 150, -190), max: v3(N.x + 470, SEAT_Y, 190) },
};

/** The eyes (between them, frame V): a little above and behind the lips —
 *  read off the shared profile head (a drawing default), for sight lines. */
export const EYES: Vec3 = v3(-12, -46, 0);

/* ── the head turn ── */

/** The turn's limits (drawing defaults, proposal §1). */
export const TURN_LIMITS = { yaw: { min: -60, max: 60 }, pitch: { min: -25, max: 10 } } as const;
/** The point the head turns about: its centre (a simplified picture). */
export const TURN_PIVOT: Vec3 = HEAD_C;

/**
 * The head turned by `yawDeg` (+ toward the talker's right) and pitched by
 * `pitchDeg` (+ up, − reading down), about the head's centre, for a talker
 * facing +x at the origin: where the mouth is and which way its axis points.
 * Yaw turns about the vertical through the pivot; pitch tilts about the
 * talker's left–right line through it. Use `onTalker` to place it.
 */
export function turnHead(yawDeg: number, pitchDeg: number, pivot: Vec3 = TURN_PIVOT): { mouth: Vec3; dir: Vec3 } {
  const y = yawDeg * DEG;
  const p = pitchDeg * DEG;
  // Pitch first (in the x–y plane: + up = toward −y), then yaw (x–z plane).
  const rx = -pivot.x;
  const ry = -pivot.y;
  const px = rx * Math.cos(p) + ry * Math.sin(p);
  const py = -rx * Math.sin(p) + ry * Math.cos(p);
  const dx0 = Math.cos(p);
  const dy0 = -Math.sin(p);
  const mouth = v3(pivot.x + px * Math.cos(y), pivot.y + py, pivot.z + px * Math.sin(y));
  const dir = v3(dx0 * Math.cos(y), dy0, dx0 * Math.sin(y));
  return { mouth, dir };
}

/** What a FIXED mic (front `p`, aim `aim`, both in the talker's frame V)
 *  reads when the head turns: the distance, the angle off the mouth's axis,
 *  how far it points off the mouth now — and the change in level against the
 *  head facing forward, by distance alone (inverse square; DERIVED). */
export function turnReadout(p: Vec3, aim: Vec3 | null, yawDeg: number, pitchDeg: number): { d: number; offAxis: number; aimErr: number | null; d0: number; distDb: number } {
  const t = turnHead(yawDeg, pitchDeg);
  const now = micToMouth(p, aim, t.mouth, t.dir);
  const at0 = micToMouth(p, aim, v3(0, 0, 0), v3(1, 0, 0));
  return { ...now, d0: at0.d, distDb: 20 * Math.log10(now.d / Math.max(1, at0.d)) };
}
