/**
 * I06c BAR CHIMES (a mark tree) — the technical truth (charter §2 layer 1).
 * Keys point into docs/labs/miking/bar_chimes/SOURCES.md (and shaker/
 * SOURCES.md §0). Owner ruling 2026-10-04: `src`, `quote`, every `prov` and
 * the unknowns are the internal record; the learner sees starting points.
 *
 * FRAME H: origin ON THE FLOOR under the rail's centre; +x toward the
 * audience and the mic; +y DOWN; +z the player's right. The rail runs along
 * z; the bars hang from it in a straight row, longest on the player's left
 * (a drawing choice), and the player sweeps a hand along them.
 */
import type { Dim, Provenance, Vec3 } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export const BC = {
  /** "any model that is between the size of 12" – 16" would be adequate" — read as the rail's length. */
  rail: { mm: 380, prov: trial('PAS-ECV02', '"between the size of 12" – 16"" read as the rail’s length (304.8–406.4 mm); 380 drawn') } as Dim,
  railDepth: placeholder(40, 'the rail’s depth'),
  railH: placeholder(30, 'the rail’s height'),
  /** The rail's height on its stand: a drawing default. */
  height: placeholder(1350, 'the rail’s height on its stand'),
  /** 27 bars, a single row (one maker's studio model); 60 in a double row (another). */
  bars: { mm: 27, prov: src('MEINL-CH27', '27 bars; Single row') } as Dim,
  barsDouble: { mm: 60, prov: src('MEINL-LC60', '60 bars, double row') } as Dim,
  /** Bar sizes: UNKNOWN in every source — drawing defaults. */
  longest: placeholder(300, 'the longest bar’s length'),
  shortest: placeholder(60, 'the shortest bar’s length'),
  barD: placeholder(10, 'a bar’s diameter'),
  filament: placeholder(15, 'the filament from the rail to each bar'),
  /** How far a struck bar swings about its filament: a drawing default. */
  swingDeg: placeholder(20, 'how far a bar swings'),
  /** Shure's general percussion floor: "a gap of at least 12” / 30cm". */
  shure: { mm: 304.8, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

export const RAIL_Y = -BC.height.mm;
/** Where the bars' tops hang (under the rail, on their filaments). */
export const BAR_TOP = RAIL_Y + BC.railH.mm / 2 + BC.filament.mm;

export type Bar = { z: number; x: number; L: number };

/** The row(s): 'single' — 27 bars along the rail; 'double' — 60 in two
 *  staggered rows. Lengths graduated linearly, longest at −z. */
export function barsOf(variant: string): Bar[] {
  const span = BC.rail.mm - 20;
  if (variant === 'double') {
    const n = BC.barsDouble.mm / 2;
    const out: Bar[] = [];
    for (let row = 0; row < 2; row++) {
      for (let k = 0; k < n; k++) {
        const f = (k + row * 0.5) / (n - 0.5);
        out.push({ z: -span / 2 + f * span, x: row === 0 ? -9 : 9, L: BC.longest.mm - (BC.longest.mm - BC.shortest.mm) * f });
      }
    }
    return out;
  }
  const n = BC.bars.mm;
  return Array.from({ length: n }, (_, k) => {
    const f = k / (n - 1);
    return { z: -span / 2 + f * span, x: 0, L: BC.longest.mm - (BC.longest.mm - BC.shortest.mm) * f };
  });
}

/** The row's centre at the bars' mean mid-height: P0, the starting points' reference. */
export const P0: Vec3 = (() => {
  const bs = barsOf('single');
  const mid = bs.reduce((a, b) => a + (BAR_TOP + b.L / 2), 0) / bs.length;
  return { x: 0, y: mid, z: 0 };
})();
/** The two ends of the row, at their bars' mid-heights. */
export const END_L: Vec3 = { x: 0, y: BAR_TOP + BC.longest.mm / 2, z: -(BC.rail.mm - 20) / 2 };
export const END_R: Vec3 = { x: 0, y: BAR_TOP + BC.shortest.mm / 2, z: (BC.rail.mm - 20) / 2 };
/** Every bar's length, longest first (the shapes step's BAR fader). */
export const LENGTHS = barsOf('single').map((b) => b.L);
