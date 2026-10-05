/**
 * I06b FINGER CYMBALS — the technical truth (charter §2 layer 1). Keys point
 * into docs/labs/miking/finger_cymbals/SOURCES.md (and shaker/SOURCES.md §0).
 * Owner ruling 2026-10-04: `src`, `quote`, every `prov` and the unknowns are
 * the internal record; the learner sees starting points only.
 *
 * FRAME H (shaker/GEOMETRY_PROPOSAL.md §A): origin ON THE FLOOR under the
 * playing area; +x toward the audience and the mic; +y DOWN; +z the player's
 * right. The player stands at −x.
 *
 * TWO WAYS OF PLAYING (variants), each a different source:
 *   ORCHESTRAL  one cymbal held flat (parallel to the floor) in one hand; the
 *               other dropped edge-first into it (a classical technique);
 *   DANCE       a pair on the thumb and a finger of each hand — the
 *               traditional attachment — played by a moving dancer.
 */
import type { Dim, Provenance, Vec3 } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export const FC = {
  /** A measured museum pair (the two differ slightly): Ø 5.5 and 4.8 cm, 2.4 cm high. */
  dA: { mm: 55, prov: src('MET-TAL', 'Diam. a) ±2 3/16 - b) ±1 7/8 in. ( a) ± 5.5 - b) ±4.8 cm)') } as Dim,
  dB: { mm: 48, prov: src('MET-TAL', 'Diam. a) ±2 3/16 - b) ±1 7/8 in. ( a) ± 5.5 - b) ±4.8 cm)') } as Dim,
  h: { mm: 24, prov: src('MET-TAL', 'H. ±15/16 (2.4 cm)') } as Dim,
  /** The dome (the raised centre), and the flange's thickness: drawing defaults. */
  domeD: placeholder(26, 'the dome’s diameter'),
  thick: placeholder(1.5, 'the metal’s thickness'),
  /** ORCHESTRAL: held "parallel to the floor"; its height and the drop are drawing defaults. */
  holdH: placeholder(1150, 'the held cymbal’s height in front of the chest'),
  drop: placeholder(60, 'how far above the edge is dropped from'),
  /** DANCE: the hands' usual height, the movement envelope and the route are drawing defaults. */
  danceH: placeholder(1550, 'the dancer’s hands’ usual height'),
  danceR: placeholder(700, 'the dance envelope’s radius round the dancer'),
  danceTop: placeholder(2050, 'the top of the dance envelope (raised hands)'),
  route: placeholder(1500, 'half the dancer’s route across the stage'),
  /** Shure's general percussion floor: "a gap of at least 12” / 30cm". */
  shure: { mm: 304.8, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

/** The playing-zone centres: the held pair, and the dancer's hands. */
export const P0: Vec3 = { x: 0, y: -FC.holdH.mm, z: 0 };
export const P0D: Vec3 = { x: 0, y: -FC.danceH.mm, z: 0 };
export const RA = FC.dA.mm / 2;
export const RB = FC.dB.mm / 2;

/**
 * A finger cymbal's profile, seen edge-on (u across, v up = −): a flat
 * flange and a raised dome, total height `h`. Points from one rim to the
 * other along the TOP surface (the dome's top at −h·0.7, a drawing choice).
 */
export function profile(r: number, h: number): [number, number][] {
  const rd = (FC.domeD.mm / 2) * (r / RA);
  const dh = h * 0.7;
  return [
    [-r, 0],
    [-rd - 3, -1.5],
    [-rd, -dh * 0.55],
    [-rd * 0.55, -dh],
    [rd * 0.55, -dh],
    [rd, -dh * 0.55],
    [rd + 3, -1.5],
    [r, 0],
  ];
}
