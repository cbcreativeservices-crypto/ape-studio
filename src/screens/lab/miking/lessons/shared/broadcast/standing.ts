/**
 * THE STANDING TALKER AND THE BODY-WORN LAYOUT — Lab 7b group 1 (B10
 * sideline interviews, B11 athletes, coaches and officials). Pure: no React,
 * so the tests reach it (test/mikingLab7bSpeech.test.ts).
 *
 * FRAME. Frame V of the voice family (shared/voice/voiceSpec.ts): the LIP
 * POINT at the origin, +x straight out of the mouth, +y DOWN, +z to the
 * talker's RIGHT, mm. A standing talker is the voice family's standing
 * figure (voicePose: the lips 1550 mm above the floor), placed anywhere by
 * its lip point and facing ±x — the seated talker's `Talker` (talkerPose.ts)
 * with the standing figure. A second person in an interview (the reporter)
 * stands beside the guest, both facing the camera's way (a drawing default:
 * the research's "facing about 60° apart" is said in words — a profile
 * drawing turned 60° would no longer agree with the plan).
 *
 * THE HELD ARM. A handheld held by a person is an engine 'clip' mount with
 * `style: 'held'` (sportMics.ts): its grip is the holder's SHOULDER — the
 * standing figure's shoulder in frame V (`SHOULDER_R`, `SHOULDER_L`), placed
 * on the person.
 *
 * FRAME T — THE TORSO (athletes_officials/GEOMETRY_PROPOSAL.md §1): the
 * landmarks a body-worn layout names, on the same standing figure (every one
 * a DRAWING DEFAULT, `placeholder` — no anthropometry was read): the
 * sternum, the collar, the belt, the small of the back, the shoulders, the
 * ear; and the KEEP-OUT regions a mount never uses — a helmet, shoulder pads,
 * shin pads, the chest of a contact athlete — illustrative regions, never
 * rule geometry. `TORSO_FRONT` is the figure seen from the front (u = −z, the
 * talker's right on the viewer's left; v = y).
 */
import type { PlayerPose } from '../players/playerPose.ts';
import { pt } from '../players/playerPose.ts';
import type { Shape3, Vec3 } from '../../../engine/model/types.ts';
import { EAR, EAR_HALF, HEAD_C, HEAD_R, dd } from '../voice/voiceSpec.ts';
import { FLOOR_Y, SINGER_NECK, SINGER_SIDE, SINGER_SOLIDS, SINGER_TOP } from '../voice/voicePose.ts';
import { onTalker, solidOnTalker, talkerAnchor, type Talker } from './talkerPose.ts';

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const N = SINGER_NECK;

/** A standing talker is a Talker (lip point + facing ±x) with the standing figure. */
export type Stander = Talker;
export { onTalker as onStander, talkerAnchor as standerAnchor, solidOnTalker as solidOnStander };

/** The standing figure's shoulders in frame V (the side pose's height, the
 *  plan's spread): where a held arm hangs from. */
export const SHOULDER_R: Vec3 = v3(N.x - 6, N.y + 58, 176);
export const SHOULDER_L: Vec3 = v3(N.x - 6, N.y + 58, -176);

/** A standing pose (side or above) placed on a talker: moved to their lips
 *  and, facing −x, mirrored (side) or turned half round (above). `arm`:
 *  fold that arm into the shoulder (the engine draws the arm holding a mic). */
export function standPose(pose: PlayerPose, t: Stander, opts: { headless?: boolean; arm?: 'R' | 'L' } = {}): PlayerPose {
  const side = pose.view === 'side';
  const nTop = pt(N.x, 0);
  const neckTo = onTalker(t, v3(N.x, 0, 0));
  const m = (q: { u: number; v: number }) => (side ? pt(t.lip.x + t.facing * q.u, t.lip.y + q.v) : pt(q.u - nTop.u + neckTo.x, q.v - nTop.v + t.lip.z));
  const hand = (h: PlayerPose['handR']) => ({ ...h, wrist: m(h.wrist), dir: side && t.facing < 0 ? Math.PI - h.dir : h.dir });
  let out: PlayerPose = {
    ...pose,
    head: { c: m(pose.head.c), r: opts.headless ? 1 : pose.head.r },
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
    floor: side ? FLOOR_Y + t.lip.y : null,
  };
  if (opts.arm === 'R') out = { ...out, elbowR: out.shoulderR, handR: { ...out.handR, wrist: out.shoulderR } };
  if (opts.arm === 'L') out = { ...out, elbowL: out.shoulderL, handL: { ...out.handL, wrist: out.shoulderL } };
  return out;
}

/** The standing poses of a talker, both views. */
export function standPoses(t: Stander, opts: { headless?: boolean; arm?: 'R' | 'L' } = {}): { side: PlayerPose; top: PlayerPose } {
  return { side: standPose(SINGER_SIDE, t, opts), top: standPose(SINGER_TOP, t, opts) };
}

/** The standing body as collision solids, placed on a talker. */
export function standSolids(t: Stander): Record<'head' | 'neck' | 'torso' | 'legs', Shape3> {
  return { head: solidOnTalker(t, SINGER_SOLIDS.head), neck: solidOnTalker(t, SINGER_SOLIDS.neck), torso: solidOnTalker(t, SINGER_SOLIDS.torso), legs: solidOnTalker(t, SINGER_SOLIDS.legs) };
}

/** The ear a headset hangs on (frame V): the near (right) ear, or the left. */
export function earOf(t: Stander, side: 'R' | 'L' = 'R'): Vec3 {
  return onTalker(t, v3(EAR.x, EAR.y, side === 'R' ? EAR_HALF : -EAR_HALF));
}

/* ── FRAME T: the torso's landmarks and keep-outs ── */

const CHEST_X = SINGER_SOLIDS.torso.kind === 'box' ? SINGER_SOLIDS.torso.max.x : 7;

/** The landmarks (frame V on the wearer), all drawing defaults. */
export const TORSO = {
  /** The breastbone's top, on the shirt's front: where a chest mic clips. */
  sternum: v3(CHEST_X + 6, N.y + 92, 0),
  /** The collar's front edge. */
  collar: v3(CHEST_X - 6, N.y + 24, 0),
  /** The belt line at the front and the small of the back. */
  beltFront: v3(CHEST_X - 4, N.y + 520, 0),
  smallOfBack: v3(N.x - 158, N.y + 470, 0),
  /** The ear (a headset's pivot), the shoulders. */
  ear: v3(EAR.x, EAR.y, EAR_HALF),
  shoulderR: SHOULDER_R,
  shoulderL: SHOULDER_L,
} as const;

/** The record of the landmark defaults (the unknowns list reads it). */
export const TORSO_DIMS = {
  lavBelowLips: dd(Math.round(Math.hypot(TORSO.sternum.x, TORSO.sternum.y)), 'a chest mic’s distance below the lips (athletes_officials/GEOMETRY_PROPOSAL §2: drawing default ~200 mm)'),
  packAtBack: dd(Math.round(N.y + 470), 'the small of the back below the lips, where a bodypack sits (a drawing default)'),
  cableSlack: dd(120, 'the cable’s strain-relief loop and slack (a drawing default)'),
} as const;

/** Who wears it — and what a mount must never touch (illustrative regions,
 *  not rule geometry; the real gear and the real rules decide). */
export type Wearer = 'coach' | 'official' | 'athlete';
export type KeepOut = { id: string; label: string; short: string; shape: Shape3 };

/** The keep-out regions on a wearer (frame V on them). An athlete in
 *  contact kit: a helmet, shoulder pads, shin pads. A coach and an official:
 *  none drawn — their own communications equipment is said in words. */
export function keepOutsOf(w: Wearer): KeepOut[] {
  if (w !== 'athlete') return [];
  return [
    { id: 'ko.helmet', label: 'the helmet — never drilled, altered or moved for a mic', short: 'HELMET', shape: { kind: 'capsule', a: HEAD_C, b: HEAD_C, r: HEAD_R + 34 } },
    { id: 'ko.padsR', label: 'the shoulder pads — never displaced to make room', short: 'PADS', shape: { kind: 'capsule', a: v3(N.x - 40, N.y + 40, 60), b: v3(N.x - 40, N.y + 60, 250), r: 92 } },
    { id: 'ko.padsL', label: 'the shoulder pads — never displaced to make room', short: 'PADS', shape: { kind: 'capsule', a: v3(N.x - 40, N.y + 40, -60), b: v3(N.x - 40, N.y + 60, -250), r: 92 } },
    { id: 'ko.shins', label: 'the shin pads and the contact zones of the legs', short: 'SHIN PADS', shape: { kind: 'box', min: v3(N.x - 40, N.y + 1000, -170), max: v3(N.x + 150, FLOOR_Y - 90, 170) } },
  ];
}

/** The body-worn chain on a wearer: the mic, the cable's path with its
 *  strain-relief loop, the pack at the small of the back, the antenna
 *  hanging straight (never coiled) — points in frame V for the drawing. */
export function bodyWornChain(at: 'chest' | 'headset'): { mic: Vec3; cable: Vec3[]; loop: Vec3; pack: Vec3; antenna: [Vec3, Vec3] } {
  const mic = at === 'chest' ? TORSO.sternum : v3(14, 0, 34);
  const loop = at === 'chest' ? v3(CHEST_X + 2, N.y + 150, 70) : v3(EAR.x - 10, EAR.y + 130, EAR_HALF + 20);
  const side = v3(N.x - 40, N.y + 300, 205);
  const pack = TORSO.smallOfBack;
  const cable = at === 'chest' ? [mic, loop, side, pack] : [TORSO.ear, loop, v3(N.x - 70, N.y + 120, 150), side, pack];
  return { mic, cable, loop, pack, antenna: [v3(pack.x - 20, pack.y + 40, 40), v3(pack.x - 24, pack.y + 200, 40)] };
}

/** A chest mic against a headset as the head turns (inverse square only, a
 *  simplified picture): the head turns, the chest stays — so the chest mic's
 *  distance to the mouth changes; a headset's boom turns with the head. */
export function chestVsHeadset(yawDeg: number, pitchDeg: number, turn: (y: number, p: number) => { mouth: Vec3 }): { chest: { d0: number; d: number; db: number }; headset: { d0: number; d: number; db: number } } {
  const m = turn(yawDeg, pitchDeg).mouth;
  const s = TORSO.sternum;
  const d0 = Math.hypot(s.x, s.y, s.z);
  const d = Math.hypot(s.x - m.x, s.y - m.y, s.z - m.z);
  const hs = v3(14, 0, 34);
  const h0 = Math.hypot(hs.x, hs.y, hs.z);
  return { chest: { d0, d, db: 20 * Math.log10(d / d0) }, headset: { d0: h0, d: h0, db: 0 } };
}

/* ── the figure from the FRONT (u = −z, v = y): the body-worn layout ── */

/** The standing figure seen from the front (the talker's right on the
 *  viewer's left), arms relaxed at the sides — for the layout drawing. */
export const TORSO_FRONT: PlayerPose = {
  view: 'front',
  posture: 'standing',
  head: { c: pt(0, HEAD_C.y), r: HEAD_R },
  neck: pt(0, N.y),
  shoulderR: pt(-176, N.y + 52),
  shoulderL: pt(176, N.y + 52),
  elbowR: pt(-206, N.y + 340),
  elbowL: pt(206, N.y + 340),
  handR: { wrist: pt(-214, N.y + 590), dir: Math.PI / 2 + 0.05, kind: 'rest' },
  handL: { wrist: pt(214, N.y + 590), dir: Math.PI / 2 - 0.05, kind: 'rest' },
  hipR: pt(-106, N.y + 530),
  hipL: pt(106, N.y + 530),
  kneeR: pt(-112, N.y + 975),
  kneeL: pt(112, N.y + 975),
  footR: pt(-110, FLOOR_Y),
  footL: pt(110, FLOOR_Y),
  floor: FLOOR_Y,
};
/** A frame-V point seen from the front (u = −z, v = y). */
export const frontUV = (p: Vec3) => ({ u: -p.z, v: p.y });
