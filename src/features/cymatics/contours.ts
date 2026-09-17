/**
 * cymatics/contours — nodal-line geometry for the Pattern Gallery & Art
 * Studio (spec §4, Phase 4). Pure functions, no Skia, no React: the SAME
 * polylines feed the on-screen figure (react-native-svg), tap-to-fill
 * hit-testing and the SVG / PDF exports.
 *
 * Domain: an N×N sampled field over x ∈ [0,1], y ∈ [0,aspect] with NaN
 * outside the plate / head / dish (the sampleField / sampleMembrane /
 * sampleSurface contract). Sample (i, j) sits at ((i+½)/N, (j+½)/N·aspect).
 *
 *   isoLines        marching squares at a level → polylines (open or closed),
 *                   endpoints keyed by the grid EDGE they cross so neighbouring
 *                   cells stitch exactly.
 *   labelRegions    the enclosed regions between nodal lines are exactly the
 *                   4-connected components of sign(field) — no polygon
 *                   arithmetic needed, and it is right for every shape.
 *   regionBoundary  a region's outline as CLOSED loops: marching squares on a
 *                   field that is +|f| inside the region and −|f| outside, so
 *                   the boundary lands on the TRUE zero crossing where two
 *                   regions meet and hugs the plate edge (half a sample past
 *                   the last inside cell) elsewhere. The grid is padded by one
 *                   ring so every loop closes. Fill with the even-odd rule.
 *   rotatePoint     rotational-symmetry fill helper.
 *
 * The liquid studio's contour view keeps its own inline copy with a radial
 * envelope normalisation (a dish-specific concern, debugged 2026-09-17);
 * this module is deliberately free of that.
 */

export type Pt = { x: number; y: number };
export type Polyline = { pts: Pt[]; closed: boolean };

/** Bit-cases of marching squares → the edge pairs to connect. Edges are
 *  0 = top, 1 = right, 2 = bottom, 3 = left of the sample quad
 *  (i,j)→(i+1,j)→(i+1,j+1)→(i,j+1). Cases 5 and 10 are saddles: resolved by
 *  the quad's centre value at call time. */
const CASES: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  [], // 0
  [[3, 0]], // 1
  [[0, 1]], // 2
  [[3, 1]], // 3
  [[1, 2]], // 4
  [], // 5 saddle
  [[0, 2]], // 6
  [[3, 2]], // 7
  [[3, 2]], // 8
  [[0, 2]], // 9
  [], // 10 saddle
  [[1, 2]], // 11
  [[3, 1]], // 12
  [[0, 1]], // 13
  [[3, 0]], // 14
  [], // 15
];

type Seg = { a: Pt; b: Pt; ka: number; kb: number };

/** Marching squares over `field` (N×N, NaN = outside). Returns stitched
 *  polylines in domain coordinates. Cells with a NaN corner are skipped, so
 *  lines stop half a sample short of the outline — the drawn plate edge covers
 *  that. `at` lets a caller substitute a transformed sample (regionBoundary). */
export function isoLines(field: Float32Array, N: number, aspect: number, level = 0): Polyline[] {
  return stitch(marchingSegments(N, N, aspect, level, (i, j) => field[j * N + i], (i) => (i + 0.5) / N, (j) => ((j + 0.5) / N) * aspect));
}

function marchingSegments(
  nx: number,
  ny: number,
  _aspect: number,
  level: number,
  at: (i: number, j: number) => number,
  xOf: (i: number) => number,
  yOf: (j: number) => number,
): Seg[] {
  const segs: Seg[] = [];
  // Edge keys: h(i,j) = between (i,j)-(i+1,j); v(i,j) = between (i,j)-(i,j+1).
  const hKey = (i: number, j: number) => (j * (nx + 1) + i) * 2;
  const vKey = (i: number, j: number) => (j * (nx + 1) + i) * 2 + 1;
  const lerp = (a: number, b: number) => {
    const d = b - a;
    const t = Math.abs(d) < 1e-12 ? 0.5 : (level - a) / d;
    return t < 0 ? 0 : t > 1 ? 1 : t;
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const v0 = at(i, j);
      const v1 = at(i + 1, j);
      const v2 = at(i + 1, j + 1);
      const v3 = at(i, j + 1);
      if (v0 !== v0 || v1 !== v1 || v2 !== v2 || v3 !== v3) continue;
      const idx = (v0 > level ? 1 : 0) | (v1 > level ? 2 : 0) | (v2 > level ? 4 : 0) | (v3 > level ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const x0 = xOf(i);
      const x1 = xOf(i + 1);
      const y0 = yOf(j);
      const y1 = yOf(j + 1);
      const edgePt = (e: number): { p: Pt; k: number } => {
        switch (e) {
          case 0:
            return { p: { x: x0 + lerp(v0, v1) * (x1 - x0), y: y0 }, k: hKey(i, j) };
          case 1:
            return { p: { x: x1, y: y0 + lerp(v1, v2) * (y1 - y0) }, k: vKey(i + 1, j) };
          case 2:
            return { p: { x: x0 + lerp(v3, v2) * (x1 - x0), y: y1 }, k: hKey(i, j + 1) };
          default:
            return { p: { x: x0, y: y0 + lerp(v0, v3) * (y1 - y0) }, k: vKey(i, j) };
        }
      };
      let pairs: ReadonlyArray<[number, number]>;
      if (idx === 5 || idx === 10) {
        // Saddle: connect according to the centre value so the two lines never
        // cross inside the cell.
        const centreHigh = (v0 + v1 + v2 + v3) / 4 > level;
        if (idx === 5) pairs = centreHigh ? [[3, 2], [0, 1]] : [[3, 0], [1, 2]];
        else pairs = centreHigh ? [[3, 0], [1, 2]] : [[0, 1], [3, 2]];
      } else pairs = CASES[idx];
      for (const [ea, eb] of pairs) {
        const A = edgePt(ea);
        const B = edgePt(eb);
        segs.push({ a: A.p, b: B.p, ka: A.k, kb: B.k });
      }
    }
  }
  return segs;
}

/** Join segments that share an edge key into chains; a chain that returns to
 *  its start is closed. */
function stitch(segs: Seg[]): Polyline[] {
  if (segs.length === 0) return [];
  const byKey = new Map<number, number[]>();
  const push = (k: number, s: number) => {
    const l = byKey.get(k);
    if (l) l.push(s);
    else byKey.set(k, [s]);
  };
  segs.forEach((s, n) => {
    push(s.ka, n);
    push(s.kb, n);
  });
  const used = new Uint8Array(segs.length);
  const out: Polyline[] = [];
  const walk = (start: number, fromKey: number): { pts: Pt[]; endKey: number } => {
    const pts: Pt[] = [];
    let s = start;
    let key = fromKey;
    for (;;) {
      used[s] = 1;
      const seg = segs[s];
      const enterA = seg.ka === key;
      pts.push(enterA ? seg.a : seg.b);
      const nextKey = enterA ? seg.kb : seg.ka;
      const cands = (byKey.get(nextKey) ?? []).filter((n) => !used[n]);
      if (cands.length === 0) {
        pts.push(enterA ? seg.b : seg.a);
        return { pts, endKey: nextKey };
      }
      s = cands[0];
      key = nextKey;
    }
  };
  // Open chains first: start at every endpoint whose key has exactly one segment.
  for (let n = 0; n < segs.length; n++) {
    if (used[n]) continue;
    const s = segs[n];
    const degA = (byKey.get(s.ka) ?? []).length;
    const degB = (byKey.get(s.kb) ?? []).length;
    if (degA === 1) out.push({ pts: walk(n, s.ka).pts, closed: false });
    else if (degB === 1) out.push({ pts: walk(n, s.kb).pts, closed: false });
  }
  // Then whatever is left: closed loops.
  for (let n = 0; n < segs.length; n++) {
    if (used[n]) continue;
    const r = walk(n, segs[n].ka);
    const pts = r.pts;
    const closed = r.endKey === segs[n].ka;
    if (closed && pts.length > 1) pts.pop(); // the walk re-emitted the start point
    out.push({ pts, closed });
  }
  return out.filter((p) => p.pts.length >= 2);
}

export type RegionMap = {
  /** Per sample: region index 0..count−1, or −1 outside the domain. */
  labels: Int32Array;
  count: number;
  /** Per region: +1 / −1 sign of the field there. */
  sign: Int8Array;
  /** Per region: sample count (a proxy for area). */
  size: Int32Array;
};

/** 4-connected components of sign(field). The enclosed areas between nodal
 *  lines are exactly these regions. */
export function labelRegions(field: Float32Array, N: number): RegionMap {
  const labels = new Int32Array(N * N).fill(-1);
  const signs: number[] = [];
  const sizes: number[] = [];
  const stack = new Int32Array(N * N);
  let count = 0;
  for (let start = 0; start < N * N; start++) {
    const v = field[start];
    if (v !== v || labels[start] !== -1) continue;
    const sg = v > 0 ? 1 : -1;
    const id = count++;
    let sp = 0;
    stack[sp++] = start;
    labels[start] = id;
    let n = 0;
    while (sp > 0) {
      const c = stack[--sp];
      n++;
      const i = c % N;
      const j = (c - i) / N;
      const tryPush = (k: number) => {
        const w = field[k];
        if (w !== w || labels[k] !== -1) return;
        if ((w > 0 ? 1 : -1) !== sg) return;
        labels[k] = id;
        stack[sp++] = k;
      };
      if (i > 0) tryPush(c - 1);
      if (i < N - 1) tryPush(c + 1);
      if (j > 0) tryPush(c - N);
      if (j < N - 1) tryPush(c + N);
    }
    signs.push(sg);
    sizes.push(n);
  }
  return { labels, count, sign: Int8Array.from(signs), size: Int32Array.from(sizes) };
}

/** Region index under a domain point, or −1 outside. */
export function regionAt(map: RegionMap, N: number, aspect: number, x: number, y: number): number {
  const i = Math.floor(x * N);
  const j = Math.floor((y / aspect) * N);
  if (i < 0 || j < 0 || i >= N || j >= N) return -1;
  return map.labels[j * N + i];
}

/** Mean sample position of a region (domain coordinates). */
export function regionCentroid(map: RegionMap, N: number, aspect: number, region: number): Pt {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      if (map.labels[j * N + i] !== region) continue;
      sx += (i + 0.5) / N;
      sy += ((j + 0.5) / N) * aspect;
      n++;
    }
  }
  return n ? { x: sx / n, y: sy / n } : { x: 0.5, y: aspect / 2 };
}

/** A region's boundary as closed loops (even-odd). See the header. */
export function regionBoundary(field: Float32Array, N: number, aspect: number, map: RegionMap, region: number): Polyline[] {
  const OUT = -1e-3; // outside-the-domain value: the edge lands on the outside sample centre
  const M = N + 2; // padded
  const at = (i: number, j: number): number => {
    const ii = i - 1;
    const jj = j - 1;
    if (ii < 0 || jj < 0 || ii >= N || jj >= N) return OUT;
    const k = jj * N + ii;
    const v = field[k];
    if (v !== v) return OUT;
    const mag = Math.abs(v) + 1e-6;
    return map.labels[k] === region ? mag : -mag;
  };
  const segs = marchingSegments(M, M, aspect, 0, at, (i) => (i - 0.5) / N, (j) => ((j - 0.5) / N) * aspect);
  return stitch(segs).map((p) => ({ ...p, closed: true }));
}

/** Rotate a domain point about the domain centre by i·(2π/k). */
export function rotatePoint(p: Pt, aspect: number, k: number, i: number): Pt {
  const cx = 0.5;
  const cy = aspect / 2;
  const a = (2 * Math.PI * i) / k;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = p.x - cx;
  const dy = p.y - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

/** Shoelace area of a closed polyline (absolute). */
export function polygonArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/** SVG path data for polylines mapped through `map` (domain → px). */
export function polylinesToPath(lines: Polyline[], map: (p: Pt) => Pt, digits = 2): string {
  const f = (v: number) => (Math.round(v * 10 ** digits) / 10 ** digits).toString();
  const parts: string[] = [];
  for (const l of lines) {
    if (l.pts.length < 2) continue;
    l.pts.forEach((p, k) => {
      const m = map(p);
      parts.push(`${k === 0 ? 'M' : 'L'}${f(m.x)} ${f(m.y)}`);
    });
    if (l.closed) parts.push('Z');
  }
  return parts.join('');
}
