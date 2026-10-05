/**
 * Microphones round the ROTARY CABINET — pure, tested
 * (speaker_leslie/GEOMETRY_PROPOSAL.md B4; the module's "Build the pickup in
 * stages"). Every mic is OUTSIDE the cabinet: the module never opens it, and
 * nothing — mic, cable, hand or tool — goes through a louver.
 *
 * Plan coordinates are frame L's (x out of the front, z to the right, mm);
 * heights are y (up = negative). A mic's `aim` is the plan direction its
 * front faces (unit (x, z)).
 */
import { LESLIE, outsideFace, type LeslieFace } from './speakerModel.ts';

export type LeslieMic = { id: string; label: string; x: number; y: number; z: number; aim: { x: number; z: number }; level: 'upper' | 'lower' | 'room'; pair?: boolean };
export type LeslieArrangement = 'upper' | 'upperLower' | 'xyLower' | 'sidesLower' | 'room';

/** The research's starting ranges (mm from the face). */
export const LESLIE_RANGES = {
  /** "3 inches to 1 foot away" (upper louvers and the bottom speaker). */
  close: { min: 3 * 25.4, max: 12 * 25.4 },
  /** Side mics: one account puts them "an inch or two" from each side, another
   *  "about 12 in" away — both inside this range. */
  sides: { min: 1 * 25.4, max: 12 * 25.4 },
  /** "a couple of meters away". */
  room: 2000,
} as const;

/** Keep-out round the cabinet: its volume plus 20 mm (no mic inside it). */
export const LESLIE_KEEP_OUT = 20;

/** Heights: the middle of each opening band (drawing defaults). */
export const UPPER_Y = (LESLIE.upperLouvers.y0 + LESLIE.upperLouvers.y1) / 2;
export const LOWER_Y = (LESLIE.lowerOpenings.y0 + LESLIE.lowerOpenings.y1) / 2;
/** "just under the top louvers" for the side mics. */
export const SIDE_Y = LESLIE.upperLouvers.y1 - 20;

const toward = (face: LeslieFace) => {
  const o = outsideFace(face, 1);
  const l = Math.hypot(o.x, o.z);
  return { x: -o.x / l, z: -o.z / l };
};

function at(face: LeslieFace, d: number, y: number, id: string, label: string, level: LeslieMic['level']): LeslieMic {
  const p = outsideFace(face, Math.max(LESLIE_KEEP_OUT, d));
  return { id, label, x: p.x, y, z: p.z, aim: toward(face), level };
}

/** The mics of an arrangement. `upperD` / `lowerD` are the distances from
 *  the faces; `lowerFace` front (as the tables do) or back (an organist's
 *  "from the back" variation). */
export function leslieMics(arr: LeslieArrangement, upperD: number, lowerD: number, lowerFace: 'front' | 'back' = 'front'): LeslieMic[] {
  const lower = at(lowerFace, lowerD, LOWER_Y, 'L', 'lower', 'lower');
  switch (arr) {
    case 'upper':
      return [at('front', upperD, UPPER_Y, 'U', 'upper', 'upper')];
    case 'upperLower':
      return [at('front', upperD, UPPER_Y, 'U', 'upper', 'upper'), lower];
    case 'xyLower': {
      // A coincident X/Y pair at one point, 90° apart (drawing default),
      // facing the front louvers: each capsule 45° off the line to the cabinet.
      const p = outsideFace('front', Math.max(LESLIE_KEEP_OUT, upperD));
      const c = Math.SQRT1_2;
      return [
        { id: 'X', label: 'upper X', x: p.x, y: UPPER_Y, z: p.z - 12, aim: { x: -c, z: c }, level: 'upper', pair: true },
        { id: 'Y', label: 'upper Y', x: p.x, y: UPPER_Y, z: p.z + 12, aim: { x: -c, z: -c }, level: 'upper', pair: true },
        lower,
      ];
    }
    case 'sidesLower':
      return [at('left', upperD, SIDE_Y, 'S1', 'upper left side', 'upper'), at('right', upperD, SIDE_Y, 'S2', 'upper right side', 'upper'), lower];
    case 'room': {
      const d = LESLIE_RANGES.room;
      const p = outsideFace('front', d);
      const c = Math.SQRT1_2;
      return [
        { id: 'R1', label: 'room X', x: p.x, y: -1000, z: p.z - 12, aim: { x: -c, z: c }, level: 'room', pair: true },
        { id: 'R2', label: 'room Y', x: p.x, y: -1000, z: p.z + 12, aim: { x: -c, z: -c }, level: 'room', pair: true },
      ];
    }
  }
}

/** A mic's distance from the cabinet's outside (mm; negative = inside). */
export function distanceFromCabinet(m: LeslieMic): number {
  const hx = LESLIE.d.mm / 2;
  const hz = LESLIE.w.mm / 2;
  const dx = Math.abs(m.x) - hx;
  const dz = Math.abs(m.z) - hz;
  if (dx <= 0 && dz <= 0) return Math.max(dx, dz);
  return Math.hypot(Math.max(0, dx), Math.max(0, dz));
}

/** Is the mic in the research's starting range for its kind? */
export function inRange(arr: LeslieArrangement, m: LeslieMic): boolean {
  if (m.level === 'room') return true;
  const d = distanceFromCabinet(m);
  const r = arr === 'sidesLower' && m.level === 'upper' ? LESLIE_RANGES.sides : LESLIE_RANGES.close;
  return d >= r.min - 0.5 && d <= r.max + 0.5;
}

/** The angle (deg, 0..180) between a horn bell pointing at plan angle θ
 *  (deg; 0 = the front, increasing counter-clockwise from above, i.e.
 *  toward +z) and the line from the rotor axis to the mic. Only that bell
 *  sounds: on the classic cabinet the opposite bell is a blocked balance
 *  bell (review Lab 1 M7), so a mic hears ONE sweep per turn. 0 = the
 *  sounding bell points straight at the mic. */
export function bellToMic(thetaDeg: number, m: { x: number; z: number }): number {
  'worklet';
  const a = (thetaDeg * Math.PI) / 180;
  const bx = Math.cos(a);
  const bz = Math.sin(a);
  const l = Math.sqrt(m.x * m.x + m.z * m.z) || 1;
  const c = (bx * m.x + bz * m.z) / l;
  const ang = (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  return ang;
}
