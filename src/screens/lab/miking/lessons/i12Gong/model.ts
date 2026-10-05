/**
 * I12 GONG — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/gong/SOURCES.md. Owner ruling 2026-10-04: `src`, `quote`,
 * every `prov` and the unknowns are the internal record; the learner sees
 * starting points only.
 *
 * FRAME G (gong/GEOMETRY_PROPOSAL.md): origin ON THE FLOOR under the gong's
 * centre at rest; +x from the gong toward the audience (the struck face looks
 * +x); +y DOWN; z across the stage — the player stands beside the struck
 * face at −z.
 *
 * TWO KINDS OF GONG (variants) — identify the instrument before choosing an
 * approach (the lesson): an orchestral TAM-TAM (a large, bossless symphonic
 * gong with a broad, complex bloom) and a BOSSED gong (a raised central boss
 * that is struck, a more pitch-centred sound).
 */
import type { Dim, Provenance, Vec3, VariantId } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

const IN = 25.4;

export const GONG = {
  /** A 32 in symphonic gong (the maker's list runs 20–40 in, and larger). */
  tamtamD: { mm: 32 * IN, prov: src('PAI-GONG', 'Size: 20″ / 22″ / 24″ / 26″ / 28″ / 30″ / 32″ / 34″ / 36″ / 38″ / 40″') } as Dim,
  /** A bossed ("nipple") gong: 12–24 in and larger; 18 in drawn. */
  bossedD: { mm: 18 * IN, prov: trial('SONVO', '"can range from 12″ to 24″ and even larger" — 18 in drawn, inside the range') } as Dim,
  bossD: placeholder(90, 'the boss’s diameter'),
  bossH: placeholder(35, 'the boss’s height'),
  /** The turned rim (flange) and the face's slight dome: drawing defaults. */
  rim: placeholder(40, 'the rim’s depth'),
  dome: placeholder(8, 'the face’s dome'),
  /** The centre's height in its frame: a drawing default. */
  centreH: placeholder(1300, 'the gong’s centre height'),
  /** Free swing at the rim, fore and aft: the behaviour is sourced, the amount is not. */
  swing: placeholder(80, 'how far the rim swings'),
  /** The mallet: head Ø 120, handle 400 — drawing defaults. */
  malletHead: placeholder(120, 'the mallet head’s diameter'),
  malletHandle: placeholder(400, 'the mallet’s handle'),
  /** A frame stand rated up to 40 in / 100 cm gongs; its own sizes are not in the text read. */
  standRating: { mm: 1000, prov: src('MEINL-TMGS3', 'Up to 40" / 100 cm Gong Size') } as Dim,
  feet: placeholder(600, 'the frame’s feet, front to back'),
  post: placeholder(40, 'the frame’s posts'),
} as const;

export type GongKind = 'tamtam' | 'bossed';
export const kindOf = (v: VariantId): GongKind => (v === 'bossed' ? 'bossed' : 'tamtam');
export const diameterOf = (v: VariantId): number => (kindOf(v) === 'bossed' ? GONG.bossedD.mm : GONG.tamtamD.mm);
export const radiusOf = (v: VariantId): number => diameterOf(v) / 2;
/** The frame's inner width: the gong plus room to swing (a drawing default). */
export const frameW = (v: VariantId): number => Math.max(760, diameterOf(v) + 290);

export const CY = -GONG.centreH.mm;
export const C0: Vec3 = { x: 0, y: CY, z: 0 };

/** Where the mallet lands: a tam-tam a little off centre toward the player
 *  (a drawing default — the maker's figure was not read); a bossed gong on
 *  its boss. As a fraction of R, and the point. */
export const strikeFrac = (v: VariantId): number => (kindOf(v) === 'bossed' ? 0 : 0.25);
export const strikePoint = (v: VariantId): Vec3 => ({ x: kindOf(v) === 'bossed' ? GONG.bossH.mm : GONG.dome.mm, y: CY, z: -strikeFrac(v) * radiusOf(v) });

/** The player, beside the struck face (frame G), facing the gong. */
export const PLAYER = { x: 320, z: -560 };
