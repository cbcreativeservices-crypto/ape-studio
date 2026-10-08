/**
 * THE FIELD INTERVIEW — Lab 7 group 3 (B03 Field Reporters and Handheld
 * Interviews; docs/labs/miking/field_reporter/GEOMETRY_PROPOSAL.md §1, §4).
 * Pure: no React (test/mikingLab7Field.test.ts).
 *
 * The build prompt names this tool "handoff.ts". Lab 7b group 1 built a
 * `handoff.ts` first (B10's question → move → pause → answer TIMELINE); this
 * file is B03's half — the PATH the one handheld travels between two
 * standing talkers and what the pattern does along it — and it reuses
 * handoff.ts's `levelDb` and `between` instead of redefining them.
 *
 * FRAME V on the guest (the lip point at the origin, +x toward the reporter,
 * +y DOWN, +z to the guest's right, mm). Two mouths `a` (the reporter) and
 * `b` (the guest).
 *
 *   THE PATH      a smooth arc from a close place at the reporter's mouth,
 *                 down through the SHARED place at chest height midway
 *                 between them (R-REPORTER: "held at around chest height
 *                 between the interviewer and the person being interviewed"),
 *                 up to the close place at the guest's mouth. The close ends
 *                 sit `endGap` from a mouth (the Lab 5 handheld row's 10 cm,
 *                 S-SM58-UG "less than 15 cm") and a little below it; the
 *                 chest height is a DRAWING DEFAULT (proposal §6: owner
 *                 list).
 *   THE READINGS  (DERIVED, inverse square + first-order patterns — "a
 *                 simplified picture", said once on screen):
 *                   distDb     the speaking mouth over the other mouth at
 *                              the mic by distance alone, 20·log10(r_o/r_s);
 *                   patternDb  what the pattern adds: its gain toward the
 *                              speaker over its gain toward the other mouth;
 *                   noiseDb    the pattern's pickup of a loud source at a
 *                              bearing, against its pickup of the speaker
 *                              (0 dB for an omni: it hears every side).
 * No reading is a promised result: the wind, the street's reflections and
 * real (frequency-dependent) patterns change it.
 */
import type { PatternId, Vec3 } from '../../../engine/model/types.ts';
import { gainDb } from '../../../engine/physics/polar.ts';
import { between, levelDb } from './handoff.ts';

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const unit = (a: Vec3): Vec3 => {
  const l = len(a) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};
const angleDeg = (a: Vec3, b: Vec3): number => {
  const c = (a.x * b.x + a.y * b.y + a.z * b.z) / ((len(a) || 1) * (len(b) || 1));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
};

/** The reporter's mouth `a` and the guest's `b` (frame V on the guest). */
export type FieldPair = { a: Vec3; b: Vec3 };

/** The path's shape (mm). `endGap`: a close end from its mouth (the Lab 5
 *  handheld row's 10 cm); `endDrop`: how far below the mouth's line it sits
 *  (out of the breath); `chestDrop`: the shared place's depth below the
 *  mouths — a DRAWING DEFAULT ("around chest height"). */
export const HANDOFF_PATH = { endGap: 100, endDrop: 35, chestDrop: 280 } as const;

/** The three places the path passes through. */
export function pathKeys(pair: FieldPair): { atA: Vec3; mid: Vec3; atB: Vec3 } {
  const d = unit(sub(pair.b, pair.a));
  const m = between(pair.a, pair.b);
  return {
    atA: v3(pair.a.x + d.x * HANDOFF_PATH.endGap, pair.a.y + HANDOFF_PATH.endDrop, pair.a.z + d.z * HANDOFF_PATH.endGap),
    mid: v3(m.x, m.y + HANDOFF_PATH.chestDrop, m.z),
    atB: v3(pair.b.x - d.x * HANDOFF_PATH.endGap, pair.b.y + HANDOFF_PATH.endDrop, pair.b.z - d.z * HANDOFF_PATH.endGap),
  };
}

/** A point on the path: s = 0 at the reporter's mouth, 0.5 the shared place
 *  at chest height, 1 at the guest's mouth (a quadratic through the three). */
export function pathPoint(pair: FieldPair, s: number): Vec3 {
  const t = Math.max(0, Math.min(1, s));
  const { atA, mid, atB } = pathKeys(pair);
  // The control point that makes the curve pass through `mid` at t = 0.5.
  const c = v3(2 * mid.x - (atA.x + atB.x) / 2, 2 * mid.y - (atA.y + atB.y) / 2, 2 * mid.z - (atA.z + atB.z) / 2);
  const u = 1 - t;
  return v3(u * u * atA.x + 2 * u * t * c.x + t * t * atB.x, u * u * atA.y + 2 * u * t * c.y + t * t * atB.y, u * u * atA.z + 2 * u * t * c.z + t * t * atB.z);
}

/** Where a mic at p points: at the speaking mouth, or "between" them — at
 *  the midpoint of the two mouths (the lesson's anti-example for a
 *  directional mic, L27). */
export function aimFrom(pair: FieldPair, p: Vec3, speaker: 'a' | 'b', mode: 'speaker' | 'between'): Vec3 {
  return unit(sub(mode === 'between' ? between(pair.a, pair.b) : pair[speaker], p));
}

/** A loud source on the ground plan round the pair: `bearingDeg` 0 = behind
 *  the guest (−x), 90 = off the guest's right (+z), 180 = behind the
 *  reporter, 270 = off the guest's left; `r` from the pair's midpoint, at
 *  the mouths' height (a drawing default). */
export function noiseAt(pair: FieldPair, bearingDeg: number, r = NOISE_RANGE): Vec3 {
  const m = between(pair.a, pair.b);
  const a = (bearingDeg * Math.PI) / 180;
  return v3(m.x - Math.cos(a) * r, m.y, m.z + Math.sin(a) * r);
}
/** The loud source’s distance from the pair (mm): a drawing default (2 m — on the road behind the guest, or beside the pair). */
export const NOISE_RANGE = 2000;

export type InterviewReading = {
  /** mm from the mic to the speaking mouth and to the other one. */
  rSpeaker: number;
  rOther: number;
  /** The speaker over the other voice at the mic: by distance, what the
   *  pattern adds, together (dB). */
  distDb: number;
  patternDb: number;
  totalDb: number;
  /** Degrees off the mic's front: the speaker, the other mouth, the loud source. */
  offSpeaker: number;
  offOther: number;
  offNoise: number;
  /** The loud source against the speaker by the pattern alone (dB, ≤ 0
   *  means the pattern takes it down; 0 for an omni). */
  noiseDb: number;
};

/** The readings at a mic at `p`, aimed along `aim`, with `pattern`. */
export function interviewReading(pair: FieldPair, p: Vec3, aim: Vec3, pattern: PatternId, speaker: 'a' | 'b', noise: Vec3): InterviewReading {
  const S = pair[speaker];
  const O = speaker === 'a' ? pair.b : pair.a;
  const offSpeaker = angleDeg(aim, sub(S, p));
  const offOther = angleDeg(aim, sub(O, p));
  const offNoise = angleDeg(aim, sub(noise, p));
  const distDb = levelDb(p, S, O);
  const patternDb = gainDb(pattern, offSpeaker) - gainDb(pattern, offOther);
  return {
    rSpeaker: len(sub(S, p)),
    rOther: len(sub(O, p)),
    distDb,
    patternDb,
    totalDb: distDb + patternDb,
    offSpeaker,
    offOther,
    offNoise,
    noiseDb: gainDb(pattern, offNoise) - gainDb(pattern, offSpeaker),
  };
}

/** The level a voice loses by distance alone between two mic places (dB):
 *  the shared midpoint against the close end, for one mouth. */
export function sharedCostDb(pair: FieldPair, who: 'a' | 'b'): number {
  const k = pathKeys(pair);
  const mouth = pair[who];
  const close = who === 'a' ? k.atA : k.atB;
  return 20 * Math.log10(len(sub(k.mid, mouth)) / Math.max(1, len(sub(close, mouth))));
}
