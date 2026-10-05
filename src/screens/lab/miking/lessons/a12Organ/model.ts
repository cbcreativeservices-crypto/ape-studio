/**
 * A12 ACOUSTIC PIPE ORGAN — the technical truth (charter §2 layer 1): a
 * ROOM-SCALE scene, not an instrument close-up
 * (docs/labs/miking/pipe_organ/SOURCES.md, GEOMETRY_PROPOSAL.md).
 *
 * FRAME O: origin on the nave floor at the centre of the main case's front
 * (the façade); +x down the nave toward the congregation; +y DOWN (the floor
 * is y = 0); +z to the right of someone facing down the nave (the engine's
 * convention). Stored in mm.
 *
 * Everything about the organ itself is a STYLISED drawing default — no
 * particular organ is drawn: a main case 8 m wide and 10 m high with its
 * divisions (Great, Swell behind its shutters, Pedal towers, a Positive
 * low in front), the console in the chancel, a nave 30 m × 15 m with pews,
 * two main aisles, side passages and exits, and an antiphonal division on a
 * rear gallery (that such divisions exist is sourced; where is not).
 * The one case study with numbers — a search that ended at the fourth pew,
 * about 35 ft from the pipework and about 8 ft up — is placed so the
 * drawing agrees: the fourth pew sits 10.7 m from the façade.
 */
import type { Dim, Provenance, Vec3 } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });
const FT = 304.8;

export const ORGAN = {
  caseW: placeholder(8000, 'the main case’s width: drawing default 8 m'),
  caseH: placeholder(10000, 'the main case’s height: drawing default 10 m'),
  caseD: placeholder(2500, 'the main case’s depth: drawing default 2.5 m'),
  naveL: placeholder(30000, 'the nave’s length: drawing default 30 m'),
  naveW: placeholder(15000, 'the nave’s width: drawing default 15 m'),
  naveH: placeholder(14000, 'the nave’s height: drawing default 14 m'),
  firstPew: placeholder(7700, 'the first pew 7.7 m from the façade: placed so the fourth pew is the case study’s 35 ft'),
  pewPitch: placeholder(1000, 'pews every 1 m: drawing default'),
  pewRows: placeholder(18, 'eighteen rows of pews: drawing default'),
  aisleZ0: placeholder(2800, 'the two main aisles from 2.8 m …'),
  aisleZ1: placeholder(3800, '… to 3.8 m either side of the middle: drawing default'),
  sideZ: placeholder(7000, 'the side passages from 7 m to the walls: drawing default'),
  /** The case study: "the fourth pew back, which is about 35 feet from the pipework"; "approximately eight feet off the floor". */
  studyX: { mm: 35 * FT, prov: src('NEU-ORGAN', 'the fourth pew back, which is about 35 feet from the pipework') } as Dim,
  studyH: { mm: 8 * FT, prov: src('NEU-ORGAN', 'approximately eight feet off the floor') } as Dim,
} as const;

export const NAVE = {
  x1: ORGAN.naveL.mm,
  zHalf: ORGAN.naveW.mm / 2,
  top: -ORGAN.naveH.mm,
} as const;

/** The main case and its divisions (front view u = z, v = y; and x for depth). */
export const CASE = { x0: -ORGAN.caseD.mm, x1: 0, zHalf: ORGAN.caseW.mm / 2, top: -ORGAN.caseH.mm } as const;
export type DivisionId = 'great' | 'swell' | 'pedal' | 'positive';
export const DIVISIONS: Record<DivisionId, { label: string; short: string; z0: number; z1: number; y0: number; y1: number; x: number; note: string }> = {
  great: { label: 'Great', short: 'GREAT', z0: -1600, z1: 1600, y0: -6600, y1: -3200, x: -150, note: 'The main division in the middle of the case: its pipes stand in the façade.' },
  swell: { label: 'Swell', short: 'SWELL', z0: -1900, z1: 1900, y0: -9600, y1: -6900, x: -1300, note: 'Enclosed in a box behind shutters the organist opens and closes: softer and more distant with them shut.' },
  pedal: { label: 'Pedal', short: 'PEDAL', z0: 2600, z1: 4000, y0: -10000, y1: -400, x: -400, note: 'The lowest pipes, in towers at the sides of the case (drawn on both sides).' },
  positive: { label: 'Positive', short: 'POSITIVE', z0: -1500, z1: 1500, y0: -2900, y1: -900, x: -250, note: 'A smaller division low in front of the case.' },
};
/** A division's sounding point (where its sound is drawn to leave from). */
export function divisionPoint(id: DivisionId, side: 1 | -1 = 1): Vec3 {
  const d = DIVISIONS[id];
  const zc = id === 'pedal' ? side * (d.z0 + d.z1) / 2 : (d.z0 + d.z1) / 2;
  return { x: d.x, y: (d.y0 + d.y1) / 2, z: zc };
}
/** The console in the chancel, the organist facing the case. */
export const CONSOLE = { x0: 1600, x1: 2600, z0: -3000, z1: -1700, h: 1300 } as const;
/** The PA columns on the chancel arch (the SERVICE variant), facing down the nave. */
export const PA = { x: 6500, z: 5600, h0: 3000, h1: 4800 } as const;
/** The rear gallery and its antiphonal division (the plan only). */
export const GALLERY = { x0: 27000, x1: 30000, y: -5000 } as const;

/** The pew rows' x (front edge of each pew). */
export function pewXs(): number[] {
  return Array.from({ length: ORGAN.pewRows.mm }, (_, i) => ORGAN.firstPew.mm + i * ORGAN.pewPitch.mm);
}

/** The case-study position (frame O): x ≈ 35 ft, ≈ 8 ft up, midway between the walls. */
export const STUDY: Vec3 = { x: ORGAN.studyX.mm, y: -ORGAN.studyH.mm, z: 0 };
/** The pedal notes the room picture offers: the lowest C of a 32′, 16′ and 8′ stop. */
export const PEDAL_NOTES = [
  { id: 'c32', feet: 32, label: '32′ LOW C' },
  { id: 'c16', feet: 16, label: '16′ LOW C' },
  { id: 'c8', feet: 8, label: '8′ LOW C' },
] as const;
