// Builds src/screens/lab/mixingGuides/data/worldMap.ts from
//   argv[2] world-atlas countries-50m.json (Natural Earth, public domain; ISC packaging)
//   argv[3] the owner's Earth.svg (Equal Earth outline, viewBox 0 0 1117.51 544.04)
//   argv[4] output .ts path
// Country fills are projected with Equal Earth (central meridian 0) into the
// owner's frame, so they sit under the owner's own borders.
const fs = require('fs');
const [topoPath, svgPath, outPath, mode] = process.argv.slice(2);
const topo = JSON.parse(fs.readFileSync(topoPath, 'utf8'));
const svg = fs.readFileSync(svgPath, 'utf8');

const W = 1117.51, H = 544.04;
// Equal Earth (Šavrič, Patterson, Jenny 2018)
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
const XMAX = Math.PI / (M * A1); // x at lon 180, lat 0
const K = W / (2 * XMAX);
function project(lon, lat) {
  const l = (lon * Math.PI) / 180, p = (lat * Math.PI) / 180;
  const th = Math.asin(M * Math.sin(p)), t2 = th * th, t6 = t2 * t2 * t2;
  const x = (l * Math.cos(th)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [W / 2 + K * x, H / 2 - K * y];
}

// --- TopoJSON decode -------------------------------------------------------
const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
});
function ring(idxs) {
  const out = [];
  for (const i of idxs) {
    const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    for (let k = out.length ? 1 : 0; k < a.length; k++) out.push(a[k]);
  }
  return out;
}

// --- simplify (Douglas–Peucker) + format -----------------------------------
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) {
      // A closed ring starts and ends on one point: measure from that point.
      const d = L < 1e-6 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > eps) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const f = (n) => (Math.round(n * 10) / 10).toString();
function pathD(polys, closed, eps) {
  // Compact relative form: absolute points rounded to 0.1 first, then exact
  // deltas between rounded points (no drift); implicit lineto after 'm'.
  let d = '', px = 0, py = 0;
  const num = (n) => { const v = Math.round(n) / 10; return (v < 0 ? '' : ' ') + v; };
  for (const pts of polys) {
    const s = dp(pts, eps);
    if (s.length < 2) continue;
    let seg = 'm', first = true, sx0 = 0, sy0 = 0;
    for (const [x, y] of s) {
      const rx = Math.round(x * 10), ry = Math.round(y * 10);
      if (!first && rx === px && ry === py) continue;
      seg += num(rx - px) + num(ry - py);
      if (first) { sx0 = rx; sy0 = ry; }
      px = rx; py = ry; first = false;
    }
    d += seg.replace(/^m /, 'm') + (closed ? 'z' : '');
    // After 'z' the pen returns to the subpath's start — the next 'm' is relative to that.
    if (closed) { px = sx0; py = sy0; }
  }
  return d.trim();
}
// --- owner outline: merge the 1,992 open polylines into one path ------------
const outlinePolys = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) =>
  [...m[1].matchAll(/(-?[0-9.]+) (-?[0-9.]+)/g)].map((q) => [+q[1], +q[2]]));
const outlineSplit = [];
for (const pl of outlinePolys) {
  let cur = [pl[0]];
  for (let i = 1; i < pl.length; i++) {
    if (Math.abs(pl[i][0] - pl[i - 1][0]) > 100) { outlineSplit.push(cur); cur = []; }
    cur.push(pl[i]);
  }
  outlineSplit.push(cur);
}
const OUTLINE_D = pathD(outlineSplit, false, 0.3);

// --- countries used by the 50 styles ---------------------------------------
const WANT = ['840','826','528','752','056','724','484','076','591','630','410','036','356','566','288','040','276','250','380','392','156','158','344','702','458','586','124','388','710','192','214','170','818','422','792','360','756'];
const countries = {};
const ringsById = {}, nameById = {};
for (const g of topo.objects.countries.geometries) {
  if (!WANT.includes(g.id)) continue;
  // Some ids repeat (036 = Australia AND Ashmore and Cartier Is.): merge, keep the largest's name.
  const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  const rings = [];
  for (const poly of polys) for (const r of poly) rings.push(ring(r).map(([lo, la]) => project(lo, la)));
  const n = rings.reduce((k, r) => k + r.length, 0);
  if (!ringsById[g.id] || n > nameById[g.id].n) nameById[g.id] = { name: g.properties.name, n };
  (ringsById[g.id] ||= []).push(...rings);
}
for (const id of Object.keys(ringsById)) {
  // Locator: the centre of the largest ring (the mainland), and whether the
  // country is too small to see filled at phone width (largest ring under 22 units).
  const big = ringsById[id].reduce((a, r) => (r.length > a.length ? r : a), []);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of big) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  countries[id] = { name: nameById[id].name, d: pathD(ringsById[id], true, 0.3), c: [Math.round((x0 + x1) * 5) / 10, Math.round((y0 + y1) * 5) / 10], small: Math.max(x1 - x0, y1 - y0) < 22 };
}

if (mode === 'html') {
  // Overlay check page: every wanted country filled under the owner's outline.
  const fills = Object.values(countries).map((c) => `<path d="${c.d}" fill="#e3a33a" fill-opacity=".85"/>`).join('');
  fs.writeFileSync(outPath, `<!doctype html><meta charset=utf-8><body style="margin:0;background:#111"><svg viewBox="0 0 ${W} ${H}" style="width:100%;background:#16181c">${fills}<path d="${OUTLINE_D}" fill="none" stroke="#cfd3da" stroke-width=".5"/></svg>`);
} else {
  const header = `/**
 * World map for the Mixing Guides hub — GENERATED by the map script (2026-10-08); do not edit by hand.
 *
 * OUTLINE_D: the owner's Earth.svg (assets/Earth.svg, an Equal Earth outline map,
 *   viewBox 0 0 ${W} ${H}) with its 1,992 coastline/border lines merged into one
 *   path and thinned to 0.1-unit precision (invisible at phone size).
 * COUNTRIES: fill shapes for the countries the 50 styles come from, projected with
 *   Equal Earth (central meridian 0) into the same frame so they sit under the
 *   owner's borders. Shapes: Natural Earth 1:50m admin-0 (public domain), via the
 *   world-atlas package — Copyright 2013-2019 Michael Bostock, ISC licence:
 *   "Permission to use, copy, modify, and/or distribute this software for any purpose
 *   with or without fee is hereby granted, provided that the above copyright notice
 *   and this permission notice appear in all copies."
 * Keys are ISO 3166-1 numeric codes.
 */
`;
  const body = `export const WORLD_VIEWBOX = '0 0 ${W} ${H}';
export const WORLD_ASPECT = ${W} / ${H};

export const OUTLINE_D =
  ${JSON.stringify(OUTLINE_D)};

/** c = locator centre (mainland); small = too small to see filled at phone width — draw a ring. */
export const COUNTRIES: Readonly<Record<string, { name: string; d: string; c: readonly [number, number]; small: boolean }>> = {
${Object.entries(countries).sort().map(([k, v]) => `  '${k}': { name: ${JSON.stringify(v.name)}, c: [${v.c[0]}, ${v.c[1]}], small: ${v.small}, d: ${JSON.stringify(v.d)} },`).join('\n')}
};
`;
  fs.writeFileSync(outPath, header + body);
}
console.log('outline chars', OUTLINE_D.length, 'countries', Object.keys(countries).length,
  'country chars', Object.values(countries).reduce((n, c) => n + c.d.length, 0));
