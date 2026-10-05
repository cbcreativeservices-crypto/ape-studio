/**
 * I06a TRIANGLE — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/triangle/SOURCES.md (and shaker/SOURCES.md §0 for the
 * small-percussion rows). Owner ruling 2026-10-04: `src`, `quote`, every
 * `prov` and the unknowns are the internal record; the learner sees
 * starting points only.
 *
 * FRAME H (shaker/GEOMETRY_PROPOSAL.md §A): origin ON THE FLOOR under the
 * triangle's centre; +x toward the audience and the mic; +y DOWN; +z the
 * player's right. The player stands at −x, chest front plane at x = −250.
 *
 * The triangle hangs from its top corner, its face toward the audience
 * (+x), the open corner on the player's LEFT (−z) — a right-handed player
 * (PAS). In the plane x = 0: the base is level, at the bottom.
 */
import type { Dim, Provenance, Vec3 } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

const IN = 25.4;

export const TRI = {
  /** 8 in side, inside both makers' ranges (Grover 4–10 in, PAS 4–12 in; 6–9 in for concert). */
  side: { mm: 8 * IN, prov: src('PAS-ECV01', 'A typical size for a "standard" triangle is the 6-9 inch range.') } as Dim,
  /** ½ in rod ("Thicker triangles (approx. ½ inch in diameter) will have a fuller tone"). */
  rod: { mm: 0.5 * IN, prov: src('PAS-ECV01', 'Thicker triangles (approx. ½ inch in diameter) will have a fuller tone') } as Dim,
  /** The open corner's gap: a drawing default. */
  gap: placeholder(15, 'the open corner’s gap'),
  /** "out in front of the chest" (PAS): the centre's height is a drawing default. */
  holdH: placeholder(1250, 'the held triangle’s height in front of the chest'),
  /** Grover's "eye level": said in words; its height is a drawing default. */
  eyeH: placeholder(1600, 'eye level'),
  /** The suspension line from the clip to the top corner (drawing default length). */
  line: placeholder(40, 'the suspension line’s length'),
  /** A steel beater 8–9 in long (Grover): drawn 215 mm. */
  beater: { mm: 215, prov: src('GROVER-TRI', 'a set of at least three steel beaters in various diameters and a length of 8-9" is recommended') } as Dim,
  beaterD: placeholder(6, 'a beater’s diameter (Grover: "various diameters")'),
  /** Shure's general percussion floor: "a gap of at least 12” / 30cm". */
  shure: { mm: 12 * IN, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

export const SIDE = TRI.side.mm;
export const ROD_D = TRI.rod.mm;
export const GAP = TRI.gap.mm;
/** The triangle's height (equilateral). */
export const TRI_H = (SIDE * Math.sqrt(3)) / 2;
/** The centre (centroid) — the playing-zone centre P0. */
export const P0: Vec3 = { x: 0, y: -TRI.holdH.mm, z: 0 };

/** The corners in the plane x = 0, as (z, y) — HELD: the top corner up, the
 *  base level at the bottom, the open corner on the player's left (−z). */
export type Corners = { top: [number, number]; open: [number, number]; closed: [number, number] };
export const HELD: Corners = {
  top: [0, P0.y - (2 / 3) * TRI_H],
  open: [-SIDE / 2, P0.y + TRI_H / 3],
  closed: [SIDE / 2, P0.y + TRI_H / 3],
};
/** MOUNTED (PAS: two clips at both closed corners): the closed side on top,
 *  level; the open corner at the bottom. Same centre. */
export const MOUNTED: Corners = {
  top: [SIDE / 2, P0.y - TRI_H / 3], // a closed corner, top right of the player
  closed: [-SIDE / 2, P0.y - TRI_H / 3], // the other closed corner, top left
  open: [0, P0.y + (2 / 3) * TRI_H],
};

/**
 * The rod as the bar it was bent from, from one end at the open corner,
 * round the two closed corners, to the other end at the open corner
 * (z, y in the plane x = 0). HELD: along the base to the closed corner, up
 * the side to the top, down the other side.
 */
export function rodPath(c: Corners): [number, number][] {
  const g = GAP / 2;
  const toward = (a: [number, number], b: [number, number], d: number): [number, number] => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a[0] + ((b[0] - a[0]) * d) / L, a[1] + ((b[1] - a[1]) * d) / L];
  };
  // HELD: open → closed (the base) → top → back toward open.
  // MOUNTED: open → top (a closed corner) → closed (the other) → toward open.
  const [first, second] = c === HELD ? [c.closed, c.top] : [c.top, c.closed];
  return [toward(c.open, first, g), first, second, toward(c.open, second, g)];
}

/** Along the unfolded rod (0 … 1): where each piece starts and ends. */
export function rodLengths(c: Corners): number[] {
  const p = rodPath(c);
  return [0, 1, 2].map((i) => Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]));
}
export const ROD_LEN = rodLengths(HELD).reduce((a, b) => a + b, 0);

/** Strike spots along the held rod (fractions of its length). */
export const STRIKE_S = (() => {
  const [base, side] = rodLengths(HELD);
  return {
    /** The middle of the base (a common playing area — PAS). */
    base: base / 2 / ROD_LEN,
    /** The base near the closed corner, where rolls are played (PAS). */
    corner: (base - 25) / ROD_LEN,
    /** The outside of the side with the closed corner (PAS). */
    side: (base + side / 2) / ROD_LEN,
  };
})();
