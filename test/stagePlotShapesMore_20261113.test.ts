/**
 * Stage shapes, round 2 (owner 2026-11-13: "Yes, build them all", the items
 * held from the stage-shape feature).
 *
 *   1. WINGS ARE AN OPTION of a rectangle or a thrust (not the round): a
 *      thrust with wings draws on screen, in the export preview, the HTML
 *      sheet and the PDF; on-stage tests, position words, grid, reach,
 *      review, size note and legend. A plot saved with the morning's
 *      "wings" shape loads as a rectangle with wings on, drawn the same.
 *   2. ON THE PHONE A NAME NEVER CROSSES THE STAGE'S EDGE, on any plot
 *      (rectangles too): names, numbers and mix codes stay inside the frame
 *      and off the stage's lines, and a performer's name never touches
 *      another label. What has no such place is left out and counted.
 *   3. IN THE ROUND the screen says the audience is on every side.
 *
 * Tests that read source normalise CRLF (ratchet).
 * Run: node --test --test-timeout=120000 test/stagePlotShapesMore_20261113.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as M from '../src/features/stageplot/spModel.ts';
import { spBuildDoc, spBuildSnapshot, spDocText, spPlotDoc } from '../src/features/stageplot/spPacket.ts';
import { spPacketHtml, spPlotPreview, spPlotScene } from '../src/features/stageplot/spPacketHtml.ts';
import { spPdfBytes } from '../src/features/stageplot/spPdf.ts';
import { spReview } from '../src/features/stageplot/spReview.ts';
import * as S from '../src/features/stageplot/spShape.ts';
import { spFromTemplate, type SpTemplateId } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';
import * as G from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import * as L from '../src/screens/lab/stageplot/stage/stageLinks.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (f: string): string => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const NOW = Date.UTC(2026, 10, 13, 20, 0);
const BAND: Record<string, string> = { salsa: 'Orquesta Ejemplo', 'four-piece': 'The Example Four', playback: 'The Example Tracks', solo: 'Alex Example', duo: 'Alex and Robin' };
const tpl = (id: SpTemplateId, pid = `p-${id}`): SpProject => spFromTemplate(id, { id: pid, now: NOW, band: BAND[id] ?? 'Example' });
const sized = (p: SpProject, w: number, d: number): SpProject => M.spEdit(p, (q) => Object.assign(q.stage, { width: w, depth: d, unit: 'ft', dims: 'confirmed' }));
const byLabel = (p: SpProject, label: string) => p.objects.find((o) => o.label === label);
const moveTo = (p: SpProject, label: string, x: number, y: number): SpProject => {
  const o = byLabel(p, label);
  return o ? M.spMoveObject(p, o.id, { x, y }, { snap: false }) : p;
};

/** The four-piece on 24 × 16 ft with a 10 × 8 ft thrust and 6 ft wings: the
 *  singer out on the thrust, the in-ear transmitter and the headphone
 *  amplifier in the wings, one stage box. */
function thrustWings(): SpProject {
  let p = sized(tpl('four-piece', 'p-tw'), 24, 16);
  p = M.spSetStageShape(p, { shape: 'thrust', thrustWidth: 10, thrustDepth: 8, wings: true, wingWidth: 6 });
  p = moveTo(p, 'Lead vocal', 0.5, 1.3);
  p = moveTo(p, 'Wedge 1', 0.5, 1.42);
  const sam = p.objects.find((x) => x.kind === 'performer' && p.performers.find((pf) => pf.id === x.performerId)?.name === 'Sam');
  if (sam) p = M.spMoveObject(p, sam.id, { x: 0.5, y: 1.2 }, { snap: false });
  p = moveTo(p, 'In-ear transmitter', -0.12, 0.2);
  p = moveTo(p, 'Keys headphone amplifier', 1.12, 0.3);
  p = M.spAddBox(p, { name: 'SB1', inputs: 16, returns: 8, kind: 'digital', supplier: 'venue' }).p;
  return p;
}

/* ── 1. wings with a rectangle or a thrust ──────────────────────────────── */

describe('wings are an option of a rectangle or a thrust', () => {
  const base = { width: 24, depth: 16 };
  it('the shape is one of three; wings go with a rectangle or a thrust, never the round', () => {
    assert.deepEqual([...S.SP_SHAPES], ['rect', 'thrust', 'round']);
    assert.equal(S.spHasWings({ ...base, shape: 'rect' }), false);
    assert.equal(S.spHasWings({ ...base, shape: 'rect', wings: true }), true);
    assert.equal(S.spHasWings({ ...base, shape: 'thrust', wings: true }), true);
    assert.equal(S.spHasWings({ ...base, shape: 'round', wings: true }), false, 'a round stage has audience on every side');
    // the morning's "wings" shape reads as a rectangle with wings
    assert.equal(S.spShapeOf({ ...base, shape: 'wings' }), 'rect');
    assert.equal(S.spHasWings({ ...base, shape: 'wings' }), true);
    assert.equal(S.spIsShaped({ ...base, shape: 'rect' }), false);
    assert.equal(S.spIsShaped({ ...base, shape: 'rect', wings: true }), true);
    assert.ok(S.SP_WINGS_HINT.length <= 140 && !/\n/.test(S.SP_WINGS_HINT));
  });

  it('a plot saved with the "wings" shape loads as a rectangle with wings on; a junk flag is off; the round keeps the flag but draws none', () => {
    const raw = JSON.parse(JSON.stringify(M.spSetStageShape(tpl('four-piece', 'p-old'), { wingWidth: 6 }))) as SpProject;
    (raw.stage as { shape: string }).shape = 'wings';
    delete raw.stage.wings;
    const q = M.spMigrate(raw) as SpProject;
    assert.equal(q.stage.shape, 'rect');
    assert.equal(q.stage.wings, true);
    assert.equal(q.stage.wingWidth, 6);
    const junk = JSON.parse(JSON.stringify(tpl('four-piece', 'p-j'))) as SpProject;
    (junk.stage as unknown as Record<string, unknown>).wings = 'yes';
    const j = M.spMigrate(junk) as SpProject;
    assert.equal('wings' in j.stage, false);
    // a schema-1 plot has no wings field at all
    const one = JSON.parse(JSON.stringify(tpl('solo', 'p-1'))) as SpProject & { schema: number };
    one.schema = 1;
    for (const k of ['shape', 'thrustWidth', 'thrustDepth', 'wingWidth', 'roundForm', 'roundRef', 'wings']) delete (one.stage as unknown as Record<string, unknown>)[k];
    const o = M.spMigrate(one) as SpProject;
    assert.equal(o.stage.shape, 'rect');
    assert.equal(S.spHasWings(o.stage), false);
    // a rectangle saved today carries no wings field (its saved form is unchanged)
    assert.equal('wings' in tpl('salsa').stage, false);
    // the round: the flag is kept for when the band switches back, but no wing is drawn
    const r = M.spSetStageShape(M.spSetStageShape(tpl('four-piece', 'p-r'), { wings: true }), { shape: 'round' });
    assert.equal(r.stage.wings, true);
    assert.deepEqual(S.spWingRects(r.stage), []);
    assert.equal(spPlotDoc(r).deck?.areas.length, 0);
    assert.equal(S.spHasWings(M.spSetStageShape(r, { shape: 'thrust' }).stage), true);
  });

  it('an old wings plot (as saved, or migrated, or set the old way) is drawn exactly the same: document, HTML, preview and PDF bytes', () => {
    const now = M.spSetStageShape(sized(tpl('four-piece', 'p-w'), 24, 16), { wings: true, wingWidth: 6 });
    const oldWay = M.spSetStageShape(sized(tpl('four-piece', 'p-w'), 24, 16), { shape: 'wings', wingWidth: 6 });
    const saved = { ...now, stage: { ...now.stage, shape: 'wings' as const } };
    delete (saved.stage as { wings?: boolean }).wings;
    const migrated = M.spMigrate(JSON.parse(JSON.stringify(saved))) as SpProject;
    for (const paper of ['letter', 'a4'] as const)
      for (const packet of ['full', 'compact', 'plot'] as const) {
        const docs = [now, oldWay, saved as SpProject, migrated].map((p) => spBuildDoc(spBuildSnapshot(p, { paper, packet }, NOW)));
        const pdf = docs.map((d) => Buffer.from(spPdfBytes(d)).toString('base64'));
        const html = docs.map((d) => spPacketHtml(d));
        for (let k = 1; k < docs.length; k++) {
          assert.equal(pdf[k], pdf[0], `${paper} ${packet}: PDF ${k}`);
          assert.equal(html[k], html[0], `${paper} ${packet}: HTML ${k}`);
          assert.equal(spDocText(docs[k]), spDocText(docs[0]));
        }
      }
    // and its plot is the one the morning drew: a 'wings' deck with two named areas
    const d = spPlotDoc(now).deck;
    assert.equal(d?.shape, 'wings');
    assert.deepEqual(d?.areas.map((a) => a.name), ['SR WING', 'SL WING']);
  });

  it('a thrust with wings: on the stage, in a wing, off the stage; the reach and the floor take in both', () => {
    const st = thrustWings().stage;
    assert.equal(S.spShapeOf(st), 'thrust');
    assert.equal(S.spHasWings(st), true);
    const t = S.spThrustRect(st);
    assert.ok(t);
    assert.ok(Math.abs(t.x1 - t.x0 - 10 / 24) < 1e-9 && Math.abs(t.y1 - 1 - 8 / 16) < 1e-9);
    assert.deepEqual(S.spShapeBounds(st), { x0: -0.25, y0: 0, x1: 1.25, y1: 1.5 });
    assert.deepEqual(S.spMoveLimits(st), { x0: -0.5, y0: -0.25, x1: 1.5, y1: 1.75 });
    assert.equal(M.spOnStage({ x: 0.5, y: 1.3 }, st), true, 'on the tongue');
    assert.equal(M.spOnStage({ x: -0.1, y: 0.5 }, st), true, 'in the stage right wing');
    assert.equal(M.spOnStage({ x: 1.1, y: 0.5 }, st), true, 'in the stage left wing');
    assert.equal(S.spInPerformance({ x: -0.1, y: 0.5 }, st), false, 'a wing is not the performance area');
    assert.equal(M.spOnStage({ x: -0.1, y: 1.2 }, st), false, 'below a wing, beside the tongue: the audience');
    assert.equal(M.spOnStage({ x: 0.1, y: 1.2 }, st), false, 'beside the tongue');
    assert.equal(M.spOnStage({ x: -0.3, y: 0.5 }, st), false, 'past the wing');
    // the drag's reach and the model's agree (the model clamps to spMoveLimits)
    const p = thrustWings();
    const mic = p.objects.find((o) => o.label === 'Lead vocal');
    assert.ok(mic);
    const far = M.spMoveObject(p, mic.id, { x: -2, y: 3 }, { snap: false });
    const at = far.objects.find((o) => o.id === mic.id);
    assert.deepEqual({ x: at?.x, y: at?.y }, { x: -0.5, y: 1.75 });
    // the picture's region takes in the tongue and both wings
    const reg = G.stageRegionFor(p);
    assert.ok(reg.x0 <= -0.25 && reg.x1 >= 1.25 && reg.y1 >= 1.5);
  });

  it('a thrust with wings: the position words', () => {
    const st = thrustWings().stage;
    assert.equal(M.spLocationWord({ x: 1.1, y: 0.4 }, st), 'Stage left wing');
    assert.equal(M.spLocationWord({ x: -0.1, y: 0.4 }, st), 'Stage right wing');
    assert.equal(M.spLocationWord({ x: 0.5, y: 1.4 }, st), 'Thrust tip, center');
    assert.equal(M.spLocationWord({ x: 0.5, y: 1.1 }, st), 'Thrust, center');
    assert.equal(M.spLocationWord({ x: 0.33, y: 1.4 }, st), 'Thrust tip, stage right side');
    assert.equal(M.spLocationWord({ x: 0.5, y: 0.1 }, st), 'Upstage center');
    assert.equal(M.spLocationWord({ x: -0.1, y: 1.2 }, st), 'Off the stage');
  });

  it('a thrust with wings: the grid lies on the main stage, the tongue and both wings, never beside the tongue', () => {
    const st = thrustWings().stage;
    const segs = S.spShapeGridSegments(st, { x: 0.05, y: 0.05 });
    assert.ok(segs.some(([x1, , x2]) => x1 < 0 && x2 <= 0), 'lines in the stage right wing');
    assert.ok(segs.some(([x1]) => x1 > 1), 'lines in the stage left wing');
    assert.ok(segs.some(([, y1, , y2]) => y1 > 1 && y2 > 1), 'lines on the tongue');
    const t = S.spThrustRect(st);
    assert.ok(t);
    for (const [x1, y1, x2, y2] of segs) {
      for (const [x, y] of [[(x1 + x2) / 2, (y1 + y2) / 2]]) assert.ok(M.spOnStage({ x, y }, st), `grid line at ${x.toFixed(2)},${y.toFixed(2)} is on the floor`);
    }
  });

  it('a thrust with wings: the size note, the legend, the deck, the text view', () => {
    const plot = spPlotDoc(thrustWings());
    assert.equal(plot.sizeNote, '24 ft × 16 ft (confirmed); thrust 10 ft × 8 ft; wings 6 ft each');
    const shapeLine = plot.legend.find((l) => /^Thrust stage/.test(l));
    assert.equal(shapeLine, 'Thrust stage: a tongue 10 ft wide and 8 ft deep reaches into the audience from the middle of the front edge, so the audience is on three sides of it. The wings (6 ft wide each) are drawn dashed at each side. What stands there is out of the audience’s sight, off the performance area, and still on the plot.');
    const d = plot.deck;
    assert.ok(d);
    assert.equal(d.shape, 'thrust');
    assert.deepEqual(d.areas.map((a) => a.name), ['SR WING', 'SL WING']);
    assert.equal(d.outline.t === 'poly' && d.outline.pts.length, 16, 'the thrust outline');
    assert.equal(d.front.lines.length, 5, 'the thrust’s front edges');
    assert.deepEqual(d.words, { up: 'UPSTAGE', down: 'AUDIENCE / DOWNSTAGE', right: 'STAGE RIGHT', left: 'STAGE LEFT' });
    assert.equal(d.stage.wings, true);
    // the wings stand beside the main stage, the tongue below it, in the plot's own space
    const sr = d.areas[0];
    assert.ok(Math.abs(sr.x + sr.w - d.origin.x) < 1e-6 && Math.abs(sr.y - d.origin.y) < 1e-6 && Math.abs(sr.h - d.mainD) < 1e-6);
    const text = spDocText(spBuildDoc(spBuildSnapshot(thrustWings(), { paper: 'letter', packet: 'full' }, NOW)));
    assert.match(text, /Stage size: 24 ft × 16 ft \(confirmed\); thrust 10 ft × 8 ft; wings 6 ft each\./);
    assert.match(text, /- Lead vocal: thrust tip, center\./);
    assert.match(text, /- In-ear transmitter: stage right wing\./);
    assert.match(text, /- Keys headphone amplifier: stage left wing\./);
    // with no sizes the note says what is drawn
    const plain = spPlotDoc(M.spSetStageShape(tpl('four-piece', 'p-tw2'), { shape: 'thrust', wings: true }));
    assert.equal(plain.sizeNote, 'Not to scale; a thrust reaches into the audience at the front, with wings at each side');
    assert.ok(plain.legend.some((l) => /Its size is not given: it is drawn at a usual size\. The wings are drawn dashed/.test(l)));
    // a thrust with sizes and wings with none
    const half = spPlotDoc(M.spSetStageShape(sized(tpl('four-piece', 'p-tw3'), 24, 16), { shape: 'thrust', thrustWidth: 10, thrustDepth: 8, wings: true }));
    assert.equal(half.sizeNote, '24 ft × 16 ft (confirmed); thrust 10 ft × 8 ft; wings drawn at a usual width');
  });

  it('a thrust with wings: the HTML sheet, the export preview and the PDF draw the tongue and both wings', () => {
    const p = thrustWings();
    for (const paper of ['letter', 'a4'] as const)
      for (const packet of ['full', 'compact', 'plot'] as const) {
        const doc = spBuildDoc(spBuildSnapshot(p, { paper, packet }, NOW));
        const html = spPacketHtml(doc);
        assert.match(html, /SR WING/);
        assert.match(html, /SL WING/);
        const bytes = spPdfBytes(doc);
        assert.ok(bytes.length > 2000);
        assert.match(Buffer.from(bytes).toString('latin1'), /SR WING|\(SR WING\)/);
      }
    const plot = spPlotDoc(p);
    for (const w of [390, 375, 320]) {
      const prev = spPlotPreview(plot, w - 32, 520);
      const words = prev.stage.ops.filter((op) => op.t === 'text').map((op) => (op as { text: string }).text);
      assert.ok(words.includes('SR WING') && words.includes('SL WING'), `${w}: the preview names both wings`);
    }
    const scene = spPlotScene(plot, 520);
    assert.ok(scene.ops.some((op) => op.t === 'text' && (op as { text: string }).text === 'UPSTAGE'));
  });

  it('a thrust with wings: the review asks about nothing in a wing or on the tongue, and still asks about what is past them', () => {
    const p = thrustWings();
    const off = (q: SpProject) => spReview(q).filter((i) => i.rule === 'object-offstage').map((i) => i.text);
    assert.deepEqual(off(p), []);
    const wedge2 = moveTo(p, 'Wedge 2', -0.1, 1.25);
    assert.deepEqual(off(wedge2), ['Wedge 2 is outside the stage.'], 'beside the tongue, under the wing, is the audience');
    const inWing = moveTo(p, 'Wedge 2', -0.1, 0.8);
    assert.deepEqual(off(inWing), []);
  });

  it('a thrust with wings: the first stage box goes in a wing', () => {
    const p = M.spSetStageShape(sized(tpl('four-piece', 'p-twb'), 24, 16), { shape: 'thrust', wings: true, wingWidth: 6 });
    const r = M.spAddBox(p);
    const o = r.p.objects.find((x) => x.id === r.objectId);
    assert.ok(o);
    assert.equal(S.spInWing(o, r.p.stage), 'left');
  });

  it('Setup: three shapes, each with its plain line; a wings switch for a rectangle or a thrust; the wing width when wings are on', () => {
    const setup = read('src/screens/lab/stageplot/SetupArea.tsx');
    assert.match(setup, /<Choice<SpStageForm> label="Shape of the stage"/);
    assert.match(setup, /\{shape !== 'round' \? <Switch label="Wings at each side" value=\{wings\} onChange=\{\(on\) => \(on === wings \? undefined : setShape\(\{ wings: on \}\)\)\} hint=\{SP_WINGS_HINT\} \/> : null\}/);
    assert.match(setup, /\{wings \? <TextField label="Width of each wing"/);
    assert.match(setup, /const wings = spHasWings\(p\.stage\);/);
    assert.doesNotMatch(setup, /shape === 'wings'/);
    for (const s of S.SP_SHAPES) assert.ok(S.SP_SHAPE_HINT[s].length <= 140, s);
    // the palette's first box and the inspector's hint read the wings the same way
    assert.match(read('src/screens/lab/stageplot/stage/StagePalette.tsx'), /const inWing = spHasWings\(q\.stage\)/);
    assert.match(read('src/screens/lab/stageplot/stage/StageInspector.tsx'), /\{!spIsShaped\(p\.stage\) \? '' :/);
  });

  it('on screen: the shape is drawn for wings alone and for a thrust with wings (ShapeDeck, its grid)', () => {
    const view = read('src/screens/lab/stageplot/stage/StagePlanView.tsx');
    assert.match(view, /const shaped = spIsShaped\(p\.stage\);/);
    const p = thrustWings();
    const T = G.stageTransformFor(p, 368, 266);
    assert.notEqual(G.stageShapeGridPath(p, T), '', 'the grid of the tongue and the wings');
    assert.equal(G.stageShapeGridPath(tpl('four-piece'), T), '', 'a rectangle keeps its own grid');
  });
});

/* ── 2. names stay inside the stage on the phone ────────────────────────── */

/** The display heights the Stage area gets at 390 × 844, 375 × 667 and
 *  320 × 640, measured in the lab (the four-piece's glass was 368 × 266,
 *  353 × 139 and 298 × 117.6): each plot's own key takes its share. */
const PHONES: [string, number, number][] = [
  ['390', 368, 357],
  ['375', 353, 1390 / 7],
  ['320', 298, 168],
];
const glassOf = (p: SpProject, gw: number, H: number): number => G.stageKeySplit(H, G.stageKeyLayout(L.stageKeyEntries(p.objects), gw, G.stageScaleNote(p)).height).stage;
type Box = { x0: number; y0: number; x1: number; y1: number };
/** The plan exactly as StagePlanView makes it. */
function screenPlan(p: SpProject, gw: number, gh: number, selId: string | null = null, zoom = 1) {
  const T = G.stageTransformFor(p, gw, gh, { zoom, cx: 0.5, cy: 0.6 });
  const order = G.stageDrawOrder(p.objects);
  const items: G.StageLabelIn[] = order.map((o) => ({ id: o.id, text: o.id === selId ? L.stageListName(p, o) : L.stageName(p, o), badges: L.stageBadges(p, o), box: G.stageObjectBox(p, o, T), person: o.kind === 'performer', selected: o.id === selId, onStage: M.spOnStage(o, p.stage) }));
  const f = G.stageFrameBoxes(gw, gh);
  return { T, items, plan: G.stageLabelPlan(items, gw, gh, [f.top, f.bottom, f.left, f.right], G.stageScreenLabelOpts(p, T)) };
}
/** The stage's lines worked out here from the shape and the transform (not
 *  from stageFloorOf): segments with half their drawn thickness. */
function linesOf(p: SpProject, T: G.StageTransform): { segs: [number, number, number, number, number][]; ring: { cx: number; cy: number; r: number } | null } {
  const g = (x: number, y: number) => T.toGlass({ x, y });
  const segs: [number, number, number, number, number][] = [];
  if (!S.spIsShaped(p.stage)) {
    const a = g(0, 0);
    const b = g(1, 1);
    segs.push([a.x, a.y, b.x, a.y, 0.5], [b.x, a.y, b.x, b.y, 0.5], [a.x, a.y, a.x, b.y, 0.5]);
    // the lip: 1 unit inside the front edge to 3.5 past it
    segs.push([a.x, b.y + 1.25, b.x, b.y + 1.25, 2.25]);
    return { segs, ring: null };
  }
  const ol = S.spShapeOutline(p.stage);
  let ring = null;
  if (ol.t === 'circle') ring = { cx: g(ol.cx, ol.cy).x, cy: g(ol.cx, ol.cy).y, r: ol.r * T.kx + 1.8 };
  else
    for (let n = 0; n < ol.pts.length; n += 2) {
      const a = g(ol.pts[n], ol.pts[n + 1]);
      const b = g(ol.pts[(n + 2) % ol.pts.length], ol.pts[(n + 3) % ol.pts.length]);
      segs.push([a.x, a.y, b.x, b.y, 2]);
    }
  for (const w of S.spWingRects(p.stage)) {
    const a = g(w.r.x0, w.r.y0);
    const b = g(w.r.x1, w.r.y1);
    segs.push([a.x, a.y, b.x, a.y, 0.5], [b.x, a.y, b.x, b.y, 0.5], [b.x, b.y, a.x, b.y, 0.5], [a.x, b.y, a.x, a.y, 0.5]);
  }
  return { segs, ring };
}
/** Does a segment pass through a box (sampled every 0.25 units)? */
const segHits = (b: Box, [x1, y1, x2, y2, half]: [number, number, number, number, number]): boolean => {
  const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 0.25));
  for (let k = 0; k <= n; k++) {
    const x = x1 + ((x2 - x1) * k) / n;
    const y = y1 + ((y2 - y1) * k) / n;
    if (x >= b.x0 - half && x <= b.x1 + half && y >= b.y0 - half && y <= b.y1 + half) return true;
  }
  return false;
};
const ringHits = (b: Box, r: { cx: number; cy: number; r: number }): boolean => {
  const corners = [[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1]].map(([x, y]) => Math.hypot(x - r.cx, y - r.cy));
  const near = Math.hypot(Math.max(0, b.x0 - r.cx, r.cx - b.x1), Math.max(0, b.y0 - r.cy, r.cy - b.y1));
  return near <= r.r && Math.max(...corners) >= r.r - 3.6;
};
/** Every drawn piece of every label (each name row and each number box). */
function pieces(plan: G.StageLabelPlan): { id: string; what: string; box: Box; name: boolean }[] {
  const out: { id: string; what: string; box: Box; name: boolean }[] = [];
  for (const l of plan.labels) {
    if (l.lines.length) out.push({ id: l.id, what: l.lines.map((x) => x.text).join(' '), box: { ...l.box, x1: l.badges.length ? Math.max(l.box.x0, l.badges[0].x - 4) : l.box.x1 }, name: true });
    for (const b of l.badges) out.push({ id: l.id, what: b.text, box: { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h }, name: false });
  }
  return out;
}
const gap = (a: Box, b: Box): number => Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1);
/** What breaks "inside the stage" in a plan. */
function breaks(p: SpProject, gw: number, gh: number, selId: string | null = null, zoom = 1): string[] {
  const { T, items, plan } = screenPlan(p, gw, gh, selId, zoom);
  const { segs, ring } = linesOf(p, T);
  const bad: string[] = [];
  const inner = { x0: G.STAGE_FRAME.side, y0: G.STAGE_FRAME.top, x1: gw - G.STAGE_FRAME.side, y1: gh - G.STAGE_FRAME.bottom };
  const ps = pieces(plan);
  for (const q of ps) {
    if (q.box.x0 < inner.x0 - 1e-6 || q.box.y0 < inner.y0 - 1e-6 || q.box.x1 > inner.x1 + 1e-6 || q.box.y1 > inner.y1 + 1e-6) bad.push(`${q.what} is in the frame`);
    if (segs.some((s) => segHits(q.box, s)) || (ring && ringHits(q.box, ring))) bad.push(`${q.what} crosses the stage’s edge`);
  }
  const keeps = new Set(items.filter((i) => i.person || i.selected).map((i) => i.id));
  for (let i = 0; i < plan.labels.length; i++)
    for (let j = i + 1; j < plan.labels.length; j++) {
      const a = plan.labels[i];
      const b = plan.labels[j];
      const g = gap(a.box, b.box);
      if (g < 0) bad.push(`${a.id} on ${b.id}`);
      else if ((keeps.has(a.id) || keeps.has(b.id)) && g < 4) bad.push(`a performer’s name touches: ${a.id} ~ ${b.id} (${g.toFixed(1)})`);
    }
  return bad;
}

describe('on the phone, a name never crosses the stage’s edge (owner 2026-11-13: build them all — names stay inside the stage)', () => {
  const EXAMPLES: SpTemplateId[] = ['solo', 'duo', 'four-piece', 'playback', 'salsa'];
  const boxedSalsa = (): SpProject => {
    let p = tpl('salsa', 'p-boxed');
    p = M.spAddBox(p, { name: 'SB1', inputs: 16, returns: 8, kind: 'digital', supplier: 'venue', at: { x: 0.25, y: 0.06 } }).p;
    return M.spAddBox(p, { name: 'SB2', inputs: 12, returns: 4, kind: 'analog', supplier: 'venue', at: { x: 0.8, y: 0.06 } }).p;
  };
  const PLOTS: [string, () => SpProject][] = [
    ...EXAMPLES.map((id) => [id, () => tpl(id)] as [string, () => SpProject]),
    ['salsa with two stage boxes', boxedSalsa],
    ['four-piece on a thrust', () => M.spSetStageShape(tpl('four-piece'), { shape: 'thrust' })],
    ['four-piece in the round', () => M.spSetStageShape(sized(tpl('four-piece'), 30, 30), { shape: 'round' })],
    ['four-piece with wings', () => M.spSetStageShape(tpl('four-piece'), { wings: true })],
    ['four-piece, thrust with wings, sized', thrustWings],
    ['salsa, thrust with wings', () => M.spSetStageShape(tpl('salsa'), { shape: 'thrust', wings: true })],
  ];
  for (const [name, make] of PLOTS)
    it(`${name}: at 390, 375 and 320 wide, every label is inside the frame and off the stage’s lines, and no performer’s name touches another label`, () => {
      const p = make();
      for (const [phone, gw, H] of PHONES) {
        const gh = glassOf(p, gw, H);
        assert.deepEqual(breaks(p, gw, gh), [], `${name} · ${phone}`);
        // every performer is named at every phone size (nothing about a name is cut)
        const { items, plan } = screenPlan(p, gw, gh);
        for (const it of items.filter((x) => x.person)) {
          const l = plan.labels.find((x) => x.id === it.id);
          assert.ok(l && l.lines.map((x) => x.text).join(' ') === it.text, `${name} · ${phone}: ${it.text} is named whole`);
        }
        assert.deepEqual(plan.peopleOut, [], `${name} · ${phone}`);
        assert.deepEqual(plan.crowded, [], `${name} · ${phone}`);
      }
    });

  it('with any one object selected (it is named first), on every example and the salsa band with boxes, at the three phones', () => {
    for (const [name, make] of PLOTS.slice(0, 6)) {
      const p = make();
      for (const [phone, gw, H] of PHONES) {
        const gh = glassOf(p, gw, H);
        for (const o of p.objects) {
          assert.deepEqual(breaks(p, gw, gh, o.id), [], `${name} · ${phone} · ${o.label || o.kind} selected`);
          const { plan } = screenPlan(p, gw, gh, o.id);
          assert.ok(plan.labels.some((l) => l.id === o.id && l.lines.length), `${name} · ${phone}: the selection is named`);
        }
      }
    }
  });

  it('zoomed in, the same rules hold', () => {
    for (const [name, make] of PLOTS)
      for (const zoom of [1.5, 2, 3]) {
        const p = make();
        assert.deepEqual(breaks(p, 298, glassOf(p, 298, 168), null, zoom), [], `${name} ×${zoom}`);
        assert.deepEqual(breaks(p, 368, glassOf(p, 368, 357), null, zoom), [], `${name} ×${zoom}`);
      }
  });

  it('what has no place is left out and counted: equipment names, numbers, and (never the selection) a performer’s name', () => {
    // the salsa band at 320: many names and numbers are left out, each counted
    const p = tpl('salsa');
    const gh = glassOf(p, 298, 168);
    const { items, plan } = screenPlan(p, 298, gh);
    assert.ok(plan.dropped.length > 0 && plan.numbersOut.length > 0);
    for (const id of plan.numbersOut) assert.equal(plan.labels.find((l) => l.id === id), undefined, 'numbers left out are not drawn');
    for (const id of plan.dropped) {
      const l = plan.labels.find((x) => x.id === id);
      assert.ok(!l || l.lines.length === 0, 'a dropped name is not drawn');
      assert.equal(items.find((x) => x.id === id)?.person, false);
    }
    // a performer squeezed where no place keeps the rules: left out and counted (pure plan, two people on one spot)
    const box = (id: string, cx: number): G.StageLabelIn => ({ id, text: 'Performer name', badges: [], box: { id, cx, cy: 60, hw: 8, hh: 5, rot: 0, sized: false }, person: true, selected: false, onStage: true });
    const tight = G.stageLabelPlan([box('a', 60), box('b', 61)], 120, 120, [], { numbersClear: true, peopleApart: true, floor: { lines: [], ring: null, floorAt: null } });
    assert.ok(tight.labels.length + tight.peopleOut.length === 2);
    const sel = G.stageLabelPlan([{ ...box('a', 60), selected: true }, box('b', 61)], 120, 120, [], { numbersClear: true, peopleApart: true, floor: { lines: [], ring: null, floorAt: null } });
    assert.ok(sel.labels.some((l) => l.id === 'a'), 'the selection is always named');
    assert.ok(!sel.peopleOut.includes('a'));
  });

  it('with no options, the plan is what it always was (the packet and other callers are untouched)', () => {
    const p = tpl('salsa');
    const T = G.stageTransformFor(p, 298, 117.6);
    const order = G.stageDrawOrder(p.objects);
    const items: G.StageLabelIn[] = order.map((o) => ({ id: o.id, text: L.stageName(p, o), badges: L.stageBadges(p, o), box: G.stageObjectBox(p, o, T), person: o.kind === 'performer' }));
    const f = G.stageFrameBoxes(298, 117.6);
    const a = G.stageLabelPlan(items, 298, 117.6, [f.top, f.bottom, f.left, f.right]);
    const b = G.stageLabelPlan(items.map((i) => ({ ...i, onStage: true })), 298, 117.6, [f.top, f.bottom, f.left, f.right], {});
    assert.deepEqual(a, b);
    assert.deepEqual(a.peopleOut, []);
  });

  it('the stage’s lines the plan keeps off are the drawn ones', () => {
    const p = tpl('four-piece');
    const T = G.stageTransformFor(p, 368, 266);
    const f = G.stageFloorOf(p, T);
    const a = T.toGlass({ x: 0, y: 0 });
    const b = T.toGlass({ x: 1, y: 1 });
    assert.equal(f.floorAt, null, 'a rectangle: the strip round the deck is open glass');
    assert.ok(f.lines.some((l) => Math.abs(l.y1 - (b.y + 1.25)) < 1e-9 && l.half === 2.25), 'the bright front lip');
    assert.ok(f.lines.some((l) => l.x1 === a.x && l.x2 === a.x), 'the stage right edge');
    // a box across the lip crosses; one wholly above it does not
    assert.equal(G.stageCrossesFloor({ x0: 100, y0: b.y - 4, x1: 140, y1: b.y + 6 }, f), true);
    assert.equal(G.stageCrossesFloor({ x0: 100, y0: b.y - 20, x1: 140, y1: b.y - 6 }, f), false);
    // a round stage: the rim; a thrust with wings: the floor is the outline and both wings
    const r = M.spSetStageShape(sized(tpl('four-piece'), 30, 30), { shape: 'round' });
    const Tr = G.stageTransformFor(r, 368, 266);
    assert.ok(G.stageFloorOf(r, Tr).ring);
    const tw = thrustWings();
    const Tt = G.stageTransformFor(tw, 368, 266);
    const ft = G.stageFloorOf(tw, Tt);
    const at = (x: number, y: number) => {
      const q = Tt.toGlass({ x, y });
      return ft.floorAt?.(q.x, q.y);
    };
    assert.equal(at(-0.1, 0.5), true, 'a wing is floor');
    assert.equal(at(0.5, 1.3), true, 'the tongue is floor');
    assert.equal(at(0.1, 1.3), false, 'beside the tongue is not');
  });

  it('the view asks for it on every plot, says which objects stand on the stage, and the area tells the count in words', () => {
    const view = read('src/screens/lab/stageplot/stage/StagePlanView.tsx');
    assert.match(view, /onStage: spOnStage\(livePos\?\.get\(o\.id\) \?\? o, p\.stage\),/);
    assert.match(view, /stageLabelPlan\(items, gw, gh, \[frame\.top, frame\.bottom, frame\.left, frame\.right\], stageScreenLabelOpts\(p, T\)\)/);
    assert.match(view, /\}, \[order, boxes, p, T, livePos, showNames, showNumbers, selectedId, gw, gh, frame\]\);/);
    const area = read('src/screens/lab/stageplot/StageArea.tsx');
    assert.match(area, /onNamesLeftOut=\{\(n, codes, crowd = 0, nums = 0, people = 0\) => \{/);
    assert.match(area, /setPeopleOut\(people\);/);
    assert.match(area, /\{leftOut > 0 \|\| codesOut > 0 \|\| crowded > 0 \|\| numbersOut > 0 \|\| peopleOut > 0 \? \(/);
    assert.match(area, /so nothing is covered and nothing crosses the edge of the stage\./);
  });
});

/* ── 3. in the round, the screen says the audience is on every side ─────── */

describe('in the round the screen says the audience is on every side', () => {
  it('the top band says it once for all four sides; the bottom names the reference side; at least 9 points, and it fits at 320 wide', () => {
    const r = M.spSetStageShape(tpl('four-piece'), { shape: 'round' });
    const w = G.stageRoundFrameWords(r.stage);
    assert.deepEqual(w, { far: 'FAR SIDE · ', all: 'AUDIENCE ON ALL SIDES', near: 'FOH SIDE' });
    // the top line fits between the side bands on the narrowest phone (298 glass units)
    const top = G.stageFrameWordW(w.far + w.all, 10, 1.4);
    assert.ok(top <= 298 - 2 * G.STAGE_FRAME.side, `${top.toFixed(1)} fits`);
    // the longest reference name (12 letters) still fits between the bottom arrows (their inner edges at ±(96 - 5))
    const long = G.stageRoundFrameWords(M.spSetStageShape(r, { roundRef: 'MONITORWORLD' }).stage);
    assert.equal(long.near, 'MONITORWORLD SIDE');
    assert.ok(G.stageFrameWordW(long.near, 10.5, 1.4) <= 2 * (Math.min(298 / 2 - 24, 96) - 5), 'between the arrows at 320');
    assert.ok(G.STAGE_DIR_FS >= 9);
  });

  it('the view draws them: the audience words in the audience color, the reference side at the bottom, STAGE RIGHT and STAGE LEFT kept', () => {
    const view = read('src/screens/lab/stageplot/stage/StagePlanView.tsx');
    assert.match(view, /<TSpan fill=\{WORD\}>\{roundWords\.far\}<\/TSpan>\s*<TSpan fill=\{AMBER\}>\{roundWords\.all\}<\/TSpan>/);
    assert.match(view, /y=\{gh - 5\} fill=\{AMBER\} fontSize=\{10\.5\}[^>]*>\s*\{roundWords\.near\}/);
    assert.match(view, /const roundWords = stageRoundFrameWords\(p\.stage\);/);
    // a rectangle and a thrust keep their words exactly
    assert.match(view, />\s*UPSTAGE\s*</);
    assert.match(view, />\s*AUDIENCE \/ DOWNSTAGE\s*</);
    assert.match(view, />\s*STAGE RIGHT\s*</);
    assert.match(view, />\s*STAGE LEFT\s*</);
    // the packet still prints "(AUDIENCE)" on all four sides
    assert.deepEqual(S.spShapeDirections({ shape: 'round', roundRef: 'FOH' }), { up: 'FAR SIDE (AUDIENCE)', down: 'FOH SIDE (AUDIENCE)', right: 'STAGE RIGHT (AUDIENCE)', left: 'STAGE LEFT (AUDIENCE)' });
  });
});
