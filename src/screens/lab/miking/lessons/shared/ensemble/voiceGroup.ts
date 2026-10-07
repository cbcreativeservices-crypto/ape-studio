/**
 * LAB 5 GROUP 2 — singers on the ensemble model (frame S): the pieces that
 * join the voice family (frame V, lessons/shared/voice) to the seating
 * builder, so a vocal starting point means the same on a backing singer, a
 * duet partner or a chorister as on E01's lead singer. Pure; tested
 * (test/mikingLab5Groups.test.ts).
 *
 *   voiceSolids      a singer's head, neck and body as collision solids
 *                    (frame V's figure, at the child's scale for a child)
 *   singerAnchor     a seat's mouth as a VoiceAnchor (the lips, the mouth's
 *                    axis, up, the singer's right) — feed it to voiceZone
 *   mouthSurfaceFor  the lips as a TARGET surface on the ensemble model
 *   threeToOneMics   the 3:1 readout for separate mics, each on its singer
 *                    (lead ruling: mic-to-mic ≥ 3 × the larger
 *                    mic-to-source distance, lead_vocal/SOURCES.md §0.2)
 */
import type { ReferenceSurface, Shape3, Vec3 } from '../../../engine/model/types.ts';
import type { VoiceAnchor } from '../voice/voiceSpec.ts';
import { mouthSurface } from '../voice/voiceZones.ts';
import { add, dist, mul, planDir, v3 } from './frameS.ts';
import type { Seat, Seating } from './seating.ts';
import { bodyOf, headCentreOf, lipOf, mouthOf } from './seatingVoices.ts';

/** A singer as solids (frame V's body: the head a sphere, the neck, the body
 *  a column from the floor to the collar). Keys are appended to the seat's
 *  part id. */
export function voiceSolids(q: Seat): [string, Shape3][] {
  const b = bodyOf(q.kind);
  const k = b.scale;
  const f = planDir(q.face);
  const hc = headCentreOf(q);
  const lip = lipOf(q);
  const collar = add(add(lip, mul(f, -105 * k)), v3(0, 118 * k, 0));
  const c = add(q.p, mul(f, b.lipAhead - 124 * k));
  return [
    ['.head', { kind: 'capsule', a: hc, b: hc, r: b.headR }],
    ['.neck', { kind: 'capsule', a: add(hc, add(mul(f, 30 * k), v3(0, 90 * k, 0))), b: collar, r: 54 * k }],
    ['.body', { kind: 'cyl', a: v3(c.x, q.p.y, c.z), b: v3(c.x, collar.y, c.z), r: 165 * k }],
  ];
}

export const seatById = (s: Seating, id: string): Seat => {
  const q = s.seats.find((x) => x.id === id);
  if (!q) throw new Error(`no seat ${id} in ${s.id}`);
  return q;
};

/** A seat's mouth as frame V's anchor. */
export function singerAnchor(s: Seating, seatId: string): VoiceAnchor {
  return mouthOf(seatById(s, seatId));
}

/** The lips of one singer as a target surface (`mouth.<variant>.<seat>`). */
export function mouthSurfaceFor(variant: string, s: Seating, seatId: string, partId: string): ReferenceSurface {
  return mouthSurface(singerAnchor(s, seatId), { id: mouthId(variant, seatId), partId, variants: [variant] });
}
export const mouthId = (variant: string, seatId: string) => `mouth.${variant}.${seatId}`;

/** 3:1 between two SEPARATE mics, each on its own singer (lips). */
export function threeToOneMics(micA: Vec3, a: Seat, micB: Vec3, b: Seat): { rA: number; rB: number; d: number; ratio: number; ok: boolean; need: number } {
  const rA = dist(micA, lipOf(a));
  const rB = dist(micB, lipOf(b));
  const d = dist(micA, micB);
  const r = Math.max(rA, rB);
  return { rA, rB, d, ratio: d / Math.max(1, r), ok: d >= 3 * r, need: 3 * r };
}
