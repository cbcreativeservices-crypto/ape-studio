/**
 * HOW A CYMBAL SOUNDS — the plate's vibration shapes, for drawing
 * (LESSON_JOURNEY §7: "Plates and bars (cymbals): plate mode shapes from
 * features/cymatics/plateModes.ts where the shape fits"). No new physics: the
 * shapes, their λ² and the drive rule are the Cymatics Lab's circular plate
 * whose edge is not held, driven at a point and held at its centre (the
 * felts and the sleeve hold a cymbal there).
 *
 *   shape    W(r, θ) = J_n(k r)·cos(nθ)  (plateModes' circle; r ∈ [0, 1])
 *   ratio    f / f_lowest = λ² / λ²_lowest (the lowest drawn shape = 1)
 *   strike   a stick at radius r drives a shape in proportion to how much the
 *            plate moves THERE in that shape; a shape that moves the centre
 *            is held still by the mounting (plateModes' support rule).
 *
 * SIMPLIFICATIONS (said on screen, once): a FLAT disc of uniform thickness.
 * A real cymbal is domed, has a bell and lathing, is thinner at the edge and
 * rings non-linearly when hit hard ("wash" builds up) — so its numbers differ;
 * the shapes' TOPOLOGY (still lines across the plate, the edge moving most)
 * is what the picture teaches.
 */
import { DEFAULT_PLATE, plateModes, type PlateMode } from '../../../../../../features/cymatics/plateModes.ts';

export type CymbalShape = {
  id: string;
  /** Still lines across the plate (nodal diameters) and still rings. */
  n: number;
  s: number;
  /** λ² ÷ the lowest drawn shape's λ². */
  ratio: number;
  /** "(2,0)"-style label and the still lines in words. */
  label: string;
  still: string;
  /** The Cymatics Lab's shape, plate-normalised (x, y) ∈ [0, 1]². */
  at: (x: number, y: number) => number;
};

function stillWords(n: number, s: number): string {
  const d = n === 0 ? '' : `${n} still line${n === 1 ? '' : 's'} across`;
  const c = s === 0 ? '' : `${s} still ring${s === 1 ? '' : 's'}`;
  return [d, c].filter(Boolean).join(' and ') || 'no still lines';
}

/** "c-2-0" → (2, 0): plateModes' own id for a circle's (n, s). */
function nsOf(m: PlateMode): { n: number; s: number } {
  const parts = m.id.split('-');
  return { n: Number(parts[1]), s: Number(parts[2]) };
}

/** The disc the Cymatics model is asked for: a circle whose edge is not
 *  held, centre-supported (the model's default edge condition for plates). */
function discModes(): PlateMode[] {
  return plateModes({ ...DEFAULT_PLATE, shape: 'circle', sizeMm: 406.4, aspect: 1, thicknessMm: 1, material: 'brass', exciter: { x: 0.5, y: 0.1 }, support: { x: 0.5, y: 0.5 } }, 15);
}

/**
 * The first shapes a centre-held cymbal can ring in, ascending: those with
 * NO motion at the centre (n ≥ 1; a shape with n = 0 moves the centre and
 * the mounting holds it still). (2,0) (3,0) (1,1) (4,0) (5,0) (2,1) …
 */
export const CYMBAL_SHAPES: readonly CymbalShape[] = (() => {
  const ms = discModes()
    .map((m) => ({ m, ...nsOf(m) }))
    .filter((q) => q.n >= 1)
    .sort((a, b) => a.m.lam2 - b.m.lam2)
    .slice(0, 6);
  const base = ms[0].m.lam2;
  return ms.map(({ m, n, s }) => ({ id: m.id, n, s, ratio: m.lam2 / base, label: `(${n},${s})`, still: stillWords(n, s), at: m.shape }));
})();

/** The shape's value at polar (r ∈ [0, 1], θ from the strike direction). */
export function cymbalShapeAt(sh: CymbalShape, r: number, theta: number): number {
  if (r > 1) return 0;
  return sh.at(0.5 + (r * Math.cos(theta)) / 2, 0.5 + (r * Math.sin(theta)) / 2);
}

const peakCache = new Map<string, number>();
export function cymbalShapePeak(sh: CymbalShape): number {
  const hit = peakCache.get(sh.id);
  if (hit != null) return hit;
  let pk = 0;
  for (let i = 0; i <= 200; i++) pk = Math.max(pk, Math.abs(cymbalShapeAt(sh, i / 200, 0)));
  peakCache.set(sh.id, pk);
  return pk;
}

/** 0..1: how much of the shape's peak motion sits under a stick at radius
 *  fraction `rFrac`, the shape oriented with a moving region toward it. */
export function cymbalStrikeShare(sh: CymbalShape, rFrac: number): number {
  const pk = cymbalShapePeak(sh);
  return pk > 0 ? Math.min(1, Math.abs(cymbalShapeAt(sh, Math.max(0, Math.min(1, rFrac)), 0)) / pk) : 0;
}

/** Radii (fractions of R) of the still RINGS, found on θ = 0. */
export function cymbalStillRings(sh: CymbalShape): number[] {
  const out: number[] = [];
  let prev = cymbalShapeAt(sh, 0.02, 0);
  for (let i = 3; i <= 400; i++) {
    const r = i / 400;
    const v = cymbalShapeAt(sh, r, 0);
    if (r < 0.985 && Math.sign(v) !== Math.sign(prev) && Math.abs(prev) > 1e-9) out.push(r - 0.5 / 400);
    prev = v;
  }
  return out.slice(0, sh.s);
}

/** Angles (radians, from the strike direction) of the still DIAMETERS. */
export function cymbalStillDiameters(sh: Pick<CymbalShape, 'n'>): number[] {
  if (sh.n === 0) return [];
  return Array.from({ length: sh.n }, (_, k) => ((2 * k + 1) * Math.PI) / (2 * sh.n));
}

/** How far the edge moves compared with the bow, in a shape (|W| at 0.97 R ÷
 *  |W| at the middle of the bow, 0.55 R): above 1, the edge moves most. */
export function edgeToBow(sh: CymbalShape): number {
  const e = Math.abs(cymbalShapeAt(sh, 0.97, 0));
  const b = Math.abs(cymbalShapeAt(sh, 0.55, 0));
  return b > 1e-9 ? e / b : Infinity;
}
