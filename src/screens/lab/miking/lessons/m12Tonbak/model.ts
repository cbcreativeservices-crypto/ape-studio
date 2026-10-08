/**
 * M12 TONBAK — the technical truth (charter §2 layer 1). Sources:
 * docs/labs/miking/tonbak/SOURCES.md (MET-89.4.304 wood example, MET-89.4.332
 * brass example, S-B27-UG) and GEOMETRY_PROPOSAL.md.
 *
 * Frame H (congas/GEOMETRY_PROPOSAL.md): origin = the floor under the head's
 * centre; +x toward the audience; +y DOWN (floor y = 0); +z to the player's
 * right. The player sits at −x with the drum across the lap, the head toward
 * the player's right, tilted up — a DRAWING DEFAULT the owner checks on the
 * phone (the lesson leaves the posture to the player: "note the head
 * orientation"). Every tonbak position in the lesson is the lesson's own
 * TRIAL; they are shown as suggested starting points (owner ruling).
 */
import type { Dim, Provenance } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });
const IN = 25.4;

export const TONBAK = {
  /** The wooden example: "Height: 16 in. (40.6 cm) Diameter: 10 in. (25.4 cm)". */
  length: { mm: 16 * IN, prov: src('MET-89.4.304', 'Height: 16 in. (40.6 cm)') } as Dim,
  headD: { mm: 10 * IN, prov: src('MET-89.4.304', 'Diameter: 10 in. (25.4 cm)') } as Dim,
  /** Waist and foot from the brass example's proportions (head : waist : base
   *  = 18.5 : 6.5 : 11.1) scaled to the wooden head — DERIVED. */
  waistD: { mm: (10 * IN * 6.5) / 18.5, prov: { kind: 'trial', src: 'MET-89.4.332', note: 'head : waist : base = 18.5 : 6.5 : 11.1 (brass example), scaled to the 254 mm head' } } as Dim,
  footD: { mm: (10 * IN * 11.1) / 18.5, prov: { kind: 'trial', src: 'MET-89.4.332', note: 'head : waist : base = 18.5 : 6.5 : 11.1 (brass example), scaled to the 254 mm head' } } as Dim,
  openingD: placeholder(110, 'the lower opening’s diameter: drawing default 110'),
  /** The bowl's shape along the axis: a drawing default through the sourced
   *  head, waist and foot diameters. */
  waistAt: placeholder(0.64, 'where the waist sits along the drum (fraction of its length): drawing default 0.64'),
  /** Posture (drawing defaults, the owner checks them on the phone). */
  headHeight: placeholder(620, 'the head’s height above the floor in the player’s lap: drawing default 620'),
  tilt: placeholder(15, 'how far the head is tilted up from the player’s right: drawing default 15°'),
} as const;

export const T_LEN = TONBAK.length.mm;
export const T_R = TONBAK.headD.mm / 2;

/**
 * The outside profile r(s) at s mm from the head along the axis — a smooth
 * goblet through the head (127), a slight bulge, the waist (≈ 44.6) and the
 * flared foot (≈ 76.2). Drawing default except at those three diameters.
 */
export const PROFILE: readonly (readonly [number, number])[] = (() => {
  const L = T_LEN;
  const rw = TONBAK.waistD.mm / 2;
  const rf = TONBAK.footD.mm / 2;
  const sw = TONBAK.waistAt.mm * L;
  return [
    [0, T_R],
    [0.02 * L, T_R + 3],
    [0.1 * L, T_R + 4],
    [0.22 * L, T_R - 6],
    [0.34 * L, T_R - 26],
    [0.45 * L, rw + 22],
    [0.55 * L, rw + 5],
    [sw, rw],
    [0.74 * L, rw + 2],
    [0.84 * L, rw + 9],
    [0.93 * L, rf - 8],
    [L, rf],
  ];
})();

export function radiusAt(s: number): number {
  const p = PROFILE;
  if (s <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) {
    if (s <= p[i][0]) {
      const t = (s - p[i - 1][0]) / (p[i][0] - p[i - 1][0]);
      // Smoothstep between samples (no kinks in the drawn outline).
      const k = t * t * (3 - 2 * t);
      return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k;
    }
  }
  return p[p.length - 1][1];
}
