/**
 * C10 HARP — the instrument's technical truth (charter §2 layer 1): the
 * concert pedal harp and a smaller lever harp, and the harpist (ILLUSTRATIVE).
 * Pure: the tests and the lesson's geometry read it directly.
 *
 * SIZES (docs/labs/miking/harp/SOURCES.md): the height (DPA: "a full sized
 * pedal harp with its 190 cm height"), the pillar's length, the soundboard's
 * resonating length and greatest width, the longest and shortest sounding
 * string (the Met's Erard pedal harp, 1895 — TRIAL for a modern harp), the
 * depth (the Met's Lyon & Healy, 94 cm). Every other number is a DRAWING
 * DEFAULT (harp/GEOMETRY_PROPOSAL.md; `placeholder: true`): the lean, the
 * soundbox's depth, the hole layout, the pedals, the string count's layout,
 * the lever harp's scale.
 *
 * LESSON FRAME H (GEOMETRY_PROPOSAL, with +z made the PLAYER'S right so it
 * matches every other Miking frame): origin = the floor point under the
 * front of the base; +x toward the audience (the pillar side; the harpist
 * sits at −x, the soundbox on their right shoulder); +y DOWN (the floor at
 * y = 0); +z the player's right. The strings lie in the plane z = 0.
 */
import type { Dim, Provenance, Vec3 } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
export const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export type Pt = readonly [number, number];

export const HARP_SIZES = {
  height: { mm: 1900, prov: src('DPA-HARP', 'a full sized pedal harp with its 190 cm height') } as Dim,
  pillar: { mm: 1657, prov: trial('MET-ERARD', '"L. of pillar: 165.7 cm" (Erard, 1895)') } as Dim,
  board: { mm: 1328, prov: trial('MET-ERARD', '"Soundboard: resonating L.: 132.8 cm"') } as Dim,
  boardW: { mm: 390, prov: trial('MET-ERARD', '"greatest W.: 39 cm"') } as Dim,
  longest: { mm: 1557, prov: trial('MET-ERARD', '"Strings: sounding L.: longest: 155.7 cm"') } as Dim,
  shortest: { mm: 65, prov: trial('MET-ERARD', '"shortest: 6.5 cm"') } as Dim,
  depth: { mm: 940, prov: trial('MET-LH', '"Depth: 37 in. (94 cm)" (Lyon & Healy, 1891–95)') } as Dim,
};
export const HARP_DIMS = {
  lean: dd(29.3, 'the soundboard’s lean back from upright (deg)'),
  boxDepth0: dd(300, 'the soundbox’s depth at its lower end'),
  boxDepth1: dd(110, 'the soundbox’s depth at its top'),
  boxW1: dd(120, 'the soundbox’s width at its top'),
  baseH: dd(130, 'the base’s height'),
  strings: dd(47, 'the pedal harp’s string count (the lesson’s; not in the sources read)'),
  leverStrings: dd(34, 'the lever harp’s string count'),
  holeL: dd(120, 'a sound hole’s length'),
  holeW: dd(60, 'a sound hole’s width'),
  leverScale: dd(0.75, 'the lever harp drawn at 0.75 of the pedal harp (about 1.4 m, a floor-standing lever harp)'),
  pedals: dd(7, 'the pedals (seven, three left and four right: a drawing default)'),
  seatH: dd(550, 'the harpist’s seat height'),
  headH: dd(1300, 'the harpist’s head height, seated'),
};
const D = (k: keyof typeof HARP_DIMS) => HARP_DIMS[k].mm;

export type HarpGeom = {
  scale: number;
  pedals: boolean;
  /** The soundboard's centre line, bottom (B0) to top (B1). */
  b0: Pt;
  b1: Pt;
  /** Unit vector along the board (B0 → B1) and its normal toward the strings. */
  t: Pt;
  n: Pt;
  /** A point on the board at fraction f (0 = bottom), and the soundbox's back there. */
  boardAt: (f: number) => Pt;
  backAt: (f: number) => Pt;
  depthAt: (f: number) => number;
  widthAt: (f: number) => number;
  pillar: { a: Pt; b: Pt; r: number };
  crown: { c: Pt; r: number; top: number };
  /** Strings: x, the lower end (on the board) and the upper end (on the neck). */
  strings: { x: number; y0: number; y1: number }[];
  /** The neck's lower edge, through the strings' upper ends, to the crown. */
  neck: Pt[];
  holes: { f: number; c: Pt; l: number; w: number }[];
  base: { x0: number; x1: number; y0: number; hw: number };
  height: number;
};

const cache = new Map<string, HarpGeom>();

/** The harp at `scale` (1 = the concert pedal harp; the lever harp draws at
 *  0.75 of it, without pedals). */
export function harpGeom(lever: boolean): HarpGeom {
  const key = lever ? 'lever' : 'pedal';
  const hit = cache.get(key);
  if (hit) return hit;
  const k = lever ? D('leverScale') : 1;
  const lean = (D('lean') * Math.PI) / 180;
  const L = HARP_SIZES.board.mm * k;
  const b1: Pt = [-700 * k, -1450 * k];
  const t: Pt = [-Math.sin(lean), -Math.cos(lean)];
  const b0: Pt = [b1[0] - t[0] * L, b1[1] - t[1] * L];
  const n: Pt = [-t[1], t[0]]; // toward the strings: up and forward
  const boardAt = (f: number): Pt => [b0[0] + t[0] * L * f, b0[1] + t[1] * L * f];
  const depthAt = (f: number) => (D('boxDepth0') + (D('boxDepth1') - D('boxDepth0')) * f) * k;
  const widthAt = (f: number) => (HARP_SIZES.boardW.mm + (D('boxW1') - HARP_SIZES.boardW.mm) * f) * k;
  const backAt = (f: number): Pt => {
    const p = boardAt(f);
    const d = depthAt(f);
    return [p[0] - n[0] * d, p[1] - n[1] * d];
  };
  const H = HARP_SIZES.height.mm * k;
  const pillar = { a: [210 * k, -D('baseH') * k] as Pt, b: [160 * k, -(D('baseH') + HARP_SIZES.pillar.mm) * k] as Pt, r: 42 * k };
  const crown = { c: [150 * k, -(H - 70 * k)] as Pt, r: 72 * k, top: -H };
  // Strings: from the board's lowest point (the longest) to near its top
  // (the shortest), vertical; their lengths shorten by a drawing rule
  // between the sourced longest and shortest.
  const N = lever ? D('leverStrings') : D('strings');
  const strings: HarpGeom['strings'] = [];
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1);
    const fb = 0.02 + 0.94 * f;
    const p = boardAt(fb);
    const len = (HARP_SIZES.shortest.mm + (HARP_SIZES.longest.mm - HARP_SIZES.shortest.mm) * Math.pow(1 - f, 1.25)) * k;
    strings.push({ x: p[0], y0: p[1], y1: p[1] - len });
  }
  const neck: Pt[] = [[crown.c[0] - 30 * k, crown.c[1] + 20 * k], ...strings.map((s) => [s.x, s.y1 - 6 * k] as Pt), [b1[0] - 30 * k, b1[1] - 40 * k]];
  // Five sound holes along the soundbox's back (a drawing default); the
  // second from the bottom is the one DPA names.
  const holes = [0.12, 0.3, 0.48, 0.66, 0.82].map((f) => ({ f, c: backAt(f), l: D('holeL') * k, w: D('holeW') * k }));
  const g: HarpGeom = {
    scale: k,
    pedals: !lever,
    b0,
    b1,
    t,
    n,
    boardAt,
    backAt,
    depthAt,
    widthAt,
    pillar,
    crown,
    strings,
    neck,
    holes,
    base: { x0: b0[0] - 260 * k, x1: 300 * k, y0: -D('baseH') * k, hw: 230 * k },
    height: H,
  };
  cache.set(key, g);
  return g;
}

/** The harpist (ILLUSTRATIVE, GEOMETRY_PROPOSAL: seated at x = −750, seat
 *  550, head 1300 up, a little to their left of the soundbox). */
export type Harpist = { seat: { x0: number; x1: number; y: number; hw: number }; head: Vec3; headR: number };
export function harpistAt(): Harpist {
  return { seat: { x0: -980, x1: -580, y: -D('seatH'), hw: 230 }, head: { x: -760, y: -D('headH'), z: -150 }, headR: 105 };
}
