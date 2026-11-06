/**
 * Function audit decisions 3, 17, 26, 31 and 37 (2026-11-05), the placement
 * engine. Each one was a control that answered without showing anything:
 *
 *  3  The pattern lobe was a fixed 170 mm, so a wide frame drew it about 20 px
 *     on top of the instrument and PATTERN changed nothing you could see.
 * 31  PATTERN SHAPE, NOT RANGE sat on FLOOR and the aim ring.
 * 17  A part wholly off the glass waited at the edge as an empty box.
 * 26  Two mics, one set of keys, and nothing marked which mic they moved.
 * 37  The Trumpet card printed NO LINE NAMED beside a bezel reading 8.5 cm.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const Scene = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));
const { A01_MODEL } = R(await import('../src/screens/lab/miking/lessons/a01Trumpet/geometry.ts'));
const { A01_ZONES } = R(await import('../src/screens/lab/miking/lessons/a01Trumpet/model.ts'));
const { A01_COPY } = R(await import('../src/screens/lab/miking/lessons/a01Trumpet/copy.ts'));

const { EDIT_RING_MINI_PX, EDIT_RING_PX, LOBE_MIN_MINI_PX, LOBE_MIN_PX, MARK_POINTER_PX, lobeDrawnR, lobeTagSpot, markOnGlass } = Scene;

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const SCENE = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
const DUAL = read('src/screens/lab/miking/engine/scene/DualView.tsx');
const TWO = read('src/screens/lab/miking/pages/PTwoMic.tsx');
const PLACEMENT = read('src/screens/lab/miking/pages/PPlacement.tsx');

/* ── decision 3: the lobe has a size you can read ─────────────────────── */

test('the lobe is never under its minimum on the glass, however wide the frame', () => {
  for (const s of [0.05, 0.1, 0.12, 0.2, 0.3]) assert.ok(lobeDrawnR(s) * s >= LOBE_MIN_PX - 1e-9, `at ${s} px/mm`);
  assert.ok(LOBE_MIN_PX >= 40, 'twice the 20 px that read as a blob');
  assert.ok(lobeDrawnR(0.12, 1, LOBE_MIN_MINI_PX) * 0.12 >= LOBE_MIN_MINI_PX - 1e-9, 'and the mini view has its own floor');
});

test('a close frame keeps the 170 mm drawing size, scaled with the hardware', () => {
  assert.equal(lobeDrawnR(1), 170);
  assert.equal(lobeDrawnR(1, 8), 170 * 8);
});

test('the lobe, the shotgun lobe and the tag all use that one size', () => {
  const slice = SCENE.slice(SCENE.indexOf('function PolarSlice'), SCENE.indexOf('function PathsOverlay'));
  assert.equal(slice.match(/lobeDrawnR\(xf\.value\.s, hk, minPx\)/g)?.length, 2, 'both pattern paths');
  assert.match(slice, /lobeDrawnR\(c\.s, hk\)/, 'the tag sits off the size drawn');
  assert.doesNotMatch(slice, /POLAR_R/);
});

test('the dashes match the Field Reporter shape: a fixed look on the glass, brighter than before', () => {
  const report = read('src/screens/lab/miking/lessons/shared/broadcast/reporterPages.tsx');
  assert.match(report, /strokeWidth=\{1\.6 \* px\}/);
  assert.match(report, /intervals=\{\[6 \* px, 4 \* px\]\}/);
  assert.match(SCENE, /lineW = useDerivedValue\(\(\) => 1\.6 \/ xf\.value\.s\)/);
  assert.match(SCENE, /dash = useDerivedValue\(\(\) => \[6 \/ xf\.value\.s, 4 \/ xf\.value\.s\]\)/);
  assert.doesNotMatch(SCENE, /intervals=\{\[10, 7\]\}/);
  assert.match(SCENE, /<Path path=\{path\} style="stroke" strokeWidth=\{lineW\} color=\{IDEAL\} opacity=\{0\.75\}>/);
});

test('both views ask for the right floor', () => {
  assert.match(SCENE, /minPx=\{mini \? LOBE_MIN_MINI_PX : LOBE_MIN_PX\}/);
});

/* ── decision 31: the tag steps clear of labels, rings and the inset ──── */

const W = 118;
const H = 12;
const box = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1 });
const touches = (q: { x: number; y: number }, b: ReturnType<typeof box>) => q.x < b.x1 && q.x + W > b.x0 && q.y < b.y1 && q.y + H > b.y0;

test('above the lobe when that is clear', () => {
  assert.deepEqual(lobeTagSpot(150, 200, 48, 14, W, H, 354, 300, 20, []), { x: 91, y: 138 });
});

test('FLOOR or a mic ring on the way: the tag moves off it', () => {
  const floor = box(100, 130, 170, 150);
  const q = lobeTagSpot(150, 200, 48, 14, W, H, 354, 300, 20, [floor])!;
  assert.ok(q && !touches(q, floor), 'clear of the label');
  const ring = box(100, 245, 220, 262);
  const r = lobeTagSpot(150, 200, 48, 14, W, H, 354, 300, 20, [floor, ring])!;
  assert.ok(r && !touches(r, floor) && !touches(r, ring), 'and of the ring below it');
});

test('a tag under the inset corner slides clear, staying above the lobe (Ambience)', () => {
  const corner = box(354 * 0.7, -1e6, 1e6, 300 * 0.62);
  const q = lobeTagSpot(190, 190, 48, 14, W, H, 354, 300, 20, [corner, box(120, 240, 250, 256)])!;
  assert.equal(q.y, 128, 'still above');
  assert.ok(q.x + W <= 354 * 0.7, 'clear of the corner');
});

test('no clean spot: no tag, never one on top of something', () => {
  assert.equal(lobeTagSpot(150, 200, 48, 14, W, H, 354, 300, 20, [box(-1e4, -1e4, 1e4, 1e4)]), null);
});

test('every lesson hands the tag its labels, the mics and the inset', () => {
  assert.doesNotMatch(SCENE, /labelsYieldToMic \? labels\.map/, 'no longer opt-in per lesson');
  const tag = SCENE.slice(SCENE.indexOf('function LobeTag'), SCENE.indexOf('function EditRing'));
  assert.match(tag, /if \(avoid\) keepOff\.push\(avoid\)/);
  assert.ok(tag.includes('for (const b of labelBoxes ?? [])'));
  assert.match(tag, /RING_R_PX/, 'the aim ring is kept off');
  assert.match(SCENE, /labelBoxes=\{labelBoxes\} shown=\{lobeOpacity\} avoid=\{avoid \?\? null\} mics=\{tagMics\}/);
});

/* ── decision 17: an edge marker says what it is ──────────────────────── */

const VIS = { u0: 0, u1: 1000, v0: 0, v1: 600 };

test('a box wholly off the glass is tagged off and a pointer stands in, toward the part', () => {
  const d = markOnGlass({ how: 'solid', shapes: [], rects: [{ u0: -700, u1: -400, v0: 300, v1: 400 }], rings: [] }, 'side', 0.3, VIS);
  assert.equal(d.off, true);
  assert.equal(d.rects[0].off, true, 'the empty box is not drawn');
  assert.equal(d.pointers.length, 1);
  const p = d.pointers[0];
  assert.ok(p.u >= VIS.u0 && p.v >= VIS.v0 && p.v <= VIS.v1, 'on the glass');
  assert.ok(p.du < -0.9, 'pointing left, at the part');
  assert.ok(Math.abs(Math.hypot(p.du, p.dv) - 1) < 1e-9);
});

test('a ring wholly off the glass does the same', () => {
  const d = markOnGlass({ how: 'solid', shapes: [], rects: [], rings: [{ u: 500, v: 900 }] }, 'side', 0.3, VIS);
  assert.equal(d.rings[0].off, true);
  assert.equal(d.pointers.length, 1);
  assert.ok(d.pointers[0].dv > 0.9, 'pointing down');
});

test('a part on the glass keeps its box and has no pointer', () => {
  const d = markOnGlass({ how: 'solid', shapes: [], rects: [{ u0: 100, u1: 400, v0: 100, v1: 300 }], rings: [] }, 'side', 0.3, VIS);
  assert.equal(d.off, false);
  assert.equal(d.rects[0].off, undefined);
  assert.deepEqual(d.pointers, []);
});

test('two pieces of one part off the same side share one pointer', () => {
  const d = markOnGlass({ how: 'solid', shapes: [], rects: [{ u0: -700, u1: -600, v0: 300, v1: 320 }, { u0: -700, u1: -600, v0: 305, v1: 325 }], rings: [] }, 'side', 0.3, VIS);
  assert.equal(d.pointers.length, 1);
});

test('the scene draws no off box, a solid pointer and the part name beside it', () => {
  assert.match(SCENE, /for \(const q of drawn\.rects\) if \(!q\.off\) p\.addRRect/);
  assert.match(SCENE, /for \(const c of drawn\.rings\) if \(!c\.off\) p\.addCircle/);
  assert.match(SCENE, /<Path path=\{highlightMark\.toward\} color=\{AMBER\} \/>/);
  assert.match(SCENE, /highlightMark\?\.tags\.map/);
  assert.ok(MARK_POINTER_PX >= 12, 'big enough to see');
});

/* ── decision 26: the ring on the mic the keys move ───────────────────── */

test('the two-mic page marks the mic it edits, through DualView, for every lesson', () => {
  assert.match(TWO, /editing=\{slot\}/);
  assert.match(TWO, /big amber ring = the mic the keys move/, 'and the display says what the ring means');
  assert.match(DUAL, /Omit<PlacementSceneProps, 'view' \| 'baseXf' \| 'mini' \| 'accessibilityLabel'>/, 'the prop passes through');
  assert.ok((DUAL.match(/\{\.\.\.props\}/g)?.length ?? 0) >= 5, 'to every scene, the inset included');
});

test('the ring follows that mic alone and is big enough to see at each size', () => {
  assert.match(SCENE, /micsShown\.filter\(\(m\) => m\.slot === editing\)/);
  assert.match(SCENE, /rPx=\{mini \? EDIT_RING_MINI_PX : EDIT_RING_PX\}/);
  assert.ok(EDIT_RING_PX > 12, 'wider than the aim ring it sits beside');
  assert.ok(EDIT_RING_MINI_PX >= 6);
  const ring = SCENE.slice(SCENE.indexOf('function EditRing'), SCENE.indexOf('function PathsOverlay'));
  assert.match(ring, /pose\.value/, 'it moves with the mic');
});

/* ── decision 37: the Trumpet card and bezel agree ────────────────────── */

const region = (src: string, from: string, to: string) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `${from} is defined`);
  return stripTypeScriptTypes(src.slice(a, b).replace(/^export /gm, ''));
};
type Mark = { label: { text: string } | null; pathsFrom: unknown };
const { lineFoot, workedMark } = new Function(`${region(PLACEMENT, 'export function lineFoot', 'export function PPlacement')}; return { lineFoot, workedMark };`)() as {
  lineFoot: (l: unknown, p: unknown) => unknown;
  workedMark: (step: number, x: unknown) => Mark;
};

test('the Trumpet worked zone names no line, yet the bezel prints a distance from the axis', () => {
  const z = A01_ZONES.find((q: { id: string }) => q.id === A01_COPY.placement!.workedZone!.trumpet)!;
  assert.equal(z.radial, undefined, 'this is the case the fix is for');
  assert.ok(A01_MODEL.lines.length > 0, 'the rig reads a line all the same');
});

test('with the line the rig reads, piece 4 marks that line, never NO LINE NAMED', () => {
  const line = A01_MODEL.lines[0];
  const mic = { x: 400, y: 85, z: 0 };
  const m = workedMark(3, { mic, head: 'the bell', headPart: null, guide: null, line: { label: line.label, foot: lineFoot(line, mic) }, envelope: null });
  assert.equal(m.label?.text, `OFF ${line.label.toUpperCase()}`);
  assert.ok(m.pathsFrom, 'and draws the way to it');
});

test('the page hands the mark the rig line, and the card says the same thing', () => {
  assert.match(PLACEMENT, /const exReadLine = exRefLine \?\? lesson\.model\.lines\.find\(\(l\) => l\.id === ex\.lineId\) \?\? null;/);
  assert.match(PLACEMENT, /line: exReadLine \? \{ label: exReadLine\.label, foot: lineFoot\(exReadLine, exPose\.p\) \} : null/);
  assert.match(PLACEMENT, /This starting point sets no distance from \$\{exReadLine\.label\}/);
});
