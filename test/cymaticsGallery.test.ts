/**
 * Cymatics Lab — Pattern Gallery & Art Studio (Phase 4) pinned:
 *   • contours: marching squares lands on the true zero lines; the enclosed
 *     regions between nodal lines are the sign components; a region's boundary
 *     comes back as CLOSED loops with the right area; symmetry rotation maps a
 *     tap onto the matching region; a disc's NaN outside is honoured;
 *   • figure: fills go through the artwork's symmetry order; SVG export is a
 *     real document with one even-odd path per fill and no data on the ART
 *     sheet, all settings on the LAB sheet;
 *   • store: save → load round-trips the exact state; damaged rows are set
 *     aside, never destroyed; duplicate / delete / favourite / artwork
 *     separation behave.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const contours = await import('../src/features/cymatics/contours.ts');
const figure = await import('../src/features/cymatics/figure.ts');
const svgExport = await import('../src/features/cymatics/svgExport.ts');
const store = await import('../src/features/cymatics/patternStore.ts');
const fieldMod = await import('../src/features/cymatics/patternField.ts');
const { DEFAULT_PLATE } = await import('../src/features/cymatics/plateModes.ts');
const { DEFAULT_LIQUID } = await import('../src/features/cymatics/faraday.ts');
const { DEFAULT_MEMBRANE } = await import('../src/features/cymatics/membrane.ts');

const N = 40;
/** f = (x−½)(y−½): zero lines on x = ½ and y = ½, four quadrant regions. */
function saddleField(mask?: (x: number, y: number) => boolean): Float32Array {
  const f = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N;
      const y = (j + 0.5) / N;
      f[j * N + i] = mask && !mask(x, y) ? NaN : (x - 0.5) * (y - 0.5);
    }
  }
  return f;
}
const geomOf = (field: Float32Array, outline: 'rect' | 'circle' = 'rect') =>
  ({ field, N, aspect: 1, outline: outline === 'rect' ? { kind: 'rect', rx: 0.02 } : { kind: 'circle' }, face: '#b9bec4', edge: '#7d848c', texture: 'brushed', strength: 1 }) as import('../src/features/cymatics/patternField.ts').PatternGeometry;

test('isoLines lands on the true zero lines', () => {
  const lines = contours.isoLines(saddleField(), N, 1, 0);
  assert.ok(lines.length >= 1);
  let n = 0;
  for (const l of lines)
    for (const p of l.pts) {
      n++;
      assert.ok(Math.abs(p.x - 0.5) < 0.02 || Math.abs(p.y - 0.5) < 0.02, `point (${p.x},${p.y}) off the nodal lines`);
    }
  // Two diameters ≈ 2·(N−1) segments; stitched chains emit one point per segment plus one.
  assert.ok(n >= 2 * (N - 4), `lines cover both diameters (${n} points)`);
});

test('regions are the sign components — four quadrants, distinct, sized alike', () => {
  const map = contours.labelRegions(saddleField(), N);
  assert.equal(map.count, 4);
  const q = [
    contours.regionAt(map, N, 1, 0.25, 0.25),
    contours.regionAt(map, N, 1, 0.75, 0.25),
    contours.regionAt(map, N, 1, 0.75, 0.75),
    contours.regionAt(map, N, 1, 0.25, 0.75),
  ];
  assert.equal(new Set(q).size, 4);
  assert.equal(map.sign[q[0]], 1);
  assert.equal(map.sign[q[1]], -1);
  for (let r = 0; r < 4; r++) assert.ok(Math.abs(map.size[r] - (N * N) / 4) <= N, `region ${r} size ${map.size[r]}`);
  assert.equal(contours.regionAt(map, N, 1, -0.1, 0.5), -1);
});

test('regionBoundary returns closed loops enclosing the quadrant (area ≈ ¼)', () => {
  const field = saddleField();
  const map = contours.labelRegions(field, N);
  const r = contours.regionAt(map, N, 1, 0.25, 0.25);
  const loops = contours.regionBoundary(field, N, 1, map, r);
  assert.ok(loops.length >= 1);
  for (const l of loops) assert.equal(l.closed, true);
  const area = loops.reduce((s, l) => s + contours.polygonArea(l.pts), 0);
  assert.ok(Math.abs(area - 0.25) < 0.03, `area ${area}`);
  for (const l of loops) for (const p of l.pts) assert.ok(p.x <= 0.51 && p.y <= 0.51 && p.x >= -0.03 && p.y >= -0.03, `boundary point ${p.x},${p.y} outside the quadrant`);
});

test('a disc mask: regions only inside, boundaries stay inside the disc', () => {
  const field = saddleField((x, y) => (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25);
  const map = contours.labelRegions(field, N);
  assert.equal(map.count, 4);
  assert.equal(contours.regionAt(map, N, 1, 0.02, 0.02), -1);
  const r = contours.regionAt(map, N, 1, 0.3, 0.3);
  const loops = contours.regionBoundary(field, N, 1, map, r);
  for (const l of loops) for (const p of l.pts) assert.ok((p.x - 0.5) ** 2 + (p.y - 0.5) ** 2 <= 0.25 + 0.08, 'boundary left the disc');
});

test('rotational symmetry maps a tap onto the matching regions', () => {
  const p = contours.rotatePoint({ x: 0.25, y: 0.25 }, 1, 4, 1);
  assert.ok(Math.abs(p.x - 0.75) < 1e-9 && Math.abs(p.y - 0.25) < 1e-9);
  const g = geomOf(saddleField());
  const art = { ...store.blankArtwork('p', N), symmetry: 4 };
  const a = figure.analyse(g);
  const r = contours.regionAt(a.regions, N, 1, 0.25, 0.25);
  const fills = figure.applyFill(g, art, r, { x: 0.25, y: 0.25 }, { color: '#ff0000', style: 'solid' });
  assert.equal(fills.length, 4, 'four-fold symmetry fills all four quadrants');
  const erased = figure.applyFill(g, { ...art, fills }, r, { x: 0.25, y: 0.25 }, null);
  assert.equal(erased.length, 0);
});

test('figureLayers: fills are even-odd paths, hit-testing maps px → region', () => {
  const g = geomOf(saddleField());
  const frame = figure.fitFrame(1, 200, 200, 10);
  const a = figure.analyse(g);
  const r = contours.regionAt(a.regions, N, 1, 0.25, 0.25);
  const art = { ...store.blankArtwork('p', N), fills: [{ region: r, color: '#00ff00', style: 'gradient' as const }] };
  const L = figure.figureLayers(g, frame, art);
  assert.equal(L.fills.length, 1);
  assert.ok(L.fills[0].d.startsWith('M') && L.fills[0].d.endsWith('Z'));
  assert.ok(L.linesD.length > 0 && L.outlineD.length > 0);
  assert.equal(figure.regionAtPx(g, frame, frame.ox + frame.w * 0.25, frame.oy + frame.h * 0.25), r);
  assert.equal(figure.regionAtPx(g, frame, 1, 1), -1);
  // A mismatched N drops the fills instead of misplacing them.
  assert.equal(figure.figureLayers(g, frame, { ...art, N: 99 }).fills.length, 0);
});

test('SVG export: a document with one path per fill; ART sheet hides data, LAB sheet prints it', () => {
  const g = geomOf(saddleField());
  const a = figure.analyse(g);
  const art = { ...store.blankArtwork('p', N), fills: [0, 1, 2, 3].map((region) => ({ region, color: '#123456', style: 'solid' as const })) };
  const svg = svgExport.figureSvg(g, art, { size: 400, background: '#000000', face: false });
  assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
  assert.equal((svg.match(/fill="#123456"/g) ?? []).length, 4);
  assert.ok(svg.includes('fill-rule="evenodd"'));
  assert.equal(a.regions.count, 4);
  const state: import('../src/features/cymatics/patternStore.ts').PatternState = { studio: 'plate', spec: { ...DEFAULT_PLATE }, hz: 412, amplitude: 0.7, view: 'particles', multi: 'off', sandCount: 3000, sandSize: 0.45, friction: 0.4 };
  const readout = fieldMod.patternReadout(state);
  const meta = { name: 'My figure', notes: 'note text', badge: 'SIMULATION · APPROXIMATED — Ritz', date: '2026-09-17', readout, brand: ['Generated with X', 'line', 'site'], title: 'Cymatics Lab' };
  const artSheet = svgExport.sheetHtml('art', 'letter', svg, meta);
  const labSheet = svgExport.sheetHtml('lab', 'a4', svg, meta);
  assert.ok(!artSheet.includes('412') && !artSheet.includes('My figure'), 'art print hides the data');
  assert.ok(labSheet.includes('My figure') && labSheet.includes('Aluminum') && labSheet.includes('SIMULATION') && labSheet.includes('note text'));
  assert.ok(labSheet.includes('size: 595pt 842pt') && artSheet.includes('size: 612pt 792pt'));
  assert.equal(svgExport.PAGES.square.w, svgExport.PAGES.square.h);
});

test('patternGeometry + readout work for all three studios', () => {
  const plate: import('../src/features/cymatics/patternStore.ts').PatternState = { studio: 'plate', spec: { ...DEFAULT_PLATE, shape: 'circle' }, hz: 300, amplitude: 0.5, view: 'heat', multi: 'oct', sandCount: 3000, sandSize: 0.45, friction: 0.4 };
  const liquid: import('../src/features/cymatics/patternStore.ts').PatternState = { studio: 'liquid', spec: { ...DEFAULT_LIQUID }, hz: 40, accelG: 0.4, view: 'surface', dualId: 'off' };
  const drum: import('../src/features/cymatics/patternStore.ts').PatternState = { studio: 'membrane', spec: { ...DEFAULT_MEMBRANE }, hz: 200, amplitude: 0.7, view: 'head', driverId: 'woofer200' };
  for (const s of [plate, liquid, drum]) {
    const g = fieldMod.patternGeometry(s, 32);
    assert.equal(g.field.length, 32 * 32);
    assert.equal(g.outline.kind, 'circle');
    assert.ok(Number.isNaN(g.field[0]), 'corner is outside the disc');
    const r = fieldMod.patternReadout(s);
    assert.ok(r.rows.length >= 6 && r.title.length > 0);
    assert.ok(fieldMod.defaultPatternName(s).length > 0);
  }
});

test('store: save → load round-trips the exact state; artwork is separate; damaged rows are quarantined', async () => {
  const kv = store.memoryStore();
  const s = store.createPatternStore(kv);
  const state: import('../src/features/cymatics/patternStore.ts').PatternState = { studio: 'liquid', spec: { ...DEFAULT_LIQUID, liquid: 'glycerin50', depthMm: 8, dualRatio: 1.5 }, hz: 45.5, accelG: 0.35, view: 'refraction', dualId: 'fifth' };
  const p = store.newPattern(state, 'SIMULATION · APPROXIMATED', 'Glycerin dish');
  assert.equal(await s.upsertPattern(p), true);
  const back = await s.getPattern(p.id);
  assert.ok(back);
  assert.deepEqual(back!.state, state);
  assert.equal(back!.badge, 'SIMULATION · APPROXIMATED');
  // Favourite + notes edit through upsert.
  await s.upsertPattern({ ...back!, favourite: true, notes: 'hello' });
  assert.equal((await s.getPattern(p.id))!.favourite, true);
  // Artwork lives apart and dies with the pattern.
  const art = { ...store.blankArtwork(p.id, 96), fills: [{ region: 2, color: '#ff0000', style: 'solid' as const }], symmetry: 6 };
  assert.equal(await s.saveArtwork(art), true);
  assert.equal((await s.loadArtwork(p.id))!.fills.length, 1);
  assert.equal((await s.getPattern(p.id))!.state.studio, 'liquid');
  const copy = await s.duplicatePattern(p.id);
  assert.ok(copy && copy.id !== p.id && copy.name.endsWith('(copy)'));
  assert.equal(await s.loadArtwork(copy!.id), null, 'a duplicate starts without artwork');
  assert.equal((await s.loadPatterns()).length, 2);
  await s.deletePattern(p.id);
  assert.equal(await s.getPattern(p.id), null);
  assert.equal(await s.loadArtwork(p.id), null);
  // Damage: one bad row among good ones is set aside, the good survive.
  await kv.setItem(store.PATTERN_KEYS.patterns, JSON.stringify([{ id: 'x' }, JSON.parse(JSON.stringify(copy))]));
  const list = await s.loadPatterns();
  assert.equal(list.length, 1);
  assert.ok(await kv.getItem(`${store.PATTERN_KEYS.patterns}:damaged`));
  // A whole-blob corruption starts empty and keeps the blob.
  await kv.setItem(store.PATTERN_KEYS.patterns, '{not json');
  assert.deepEqual(await s.loadPatterns(), []);
  assert.equal(await kv.getItem(`${store.PATTERN_KEYS.patterns}:damaged`), '{not json');
});

test('normalisePattern fills missing newer fields with defaults', () => {
  const raw = { id: 'a', name: 'old', state: { studio: 'plate', spec: { material: 'brass' }, hz: 100 } };
  const p = store.normalisePattern(raw);
  assert.ok(p);
  assert.equal(p!.state.studio, 'plate');
  if (p!.state.studio === 'plate') {
    assert.equal(p!.state.spec.material, 'brass');
    assert.equal(p!.state.spec.sizeMm, DEFAULT_PLATE.sizeMm);
    assert.equal(p!.state.multi, 'off');
  }
  assert.equal(store.normalisePattern({ id: 'b', name: 'x', state: { studio: 'nope', spec: {}, hz: 1 } }), null);
});
