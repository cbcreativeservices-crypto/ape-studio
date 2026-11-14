/**
 * Stage Plot, round 3 of the labels (owner 2026-11-13: "build the remaining
 * held items"). Geometry, not eyes:
 *
 *   ON THE PHONE (390, 375, 320 wide; the plan exactly as StagePlanView makes
 *   it): no label on another label, no label over another object's drawing
 *   (the selected object's name, drawn in its own color over everything while
 *   it is selected and right against its own symbol, excepted; a performer's
 *   name wholly on its own figure lies
 *   only on the instrument painted under that figure), no label across a line
 *   of the stage, a platform's name only on its platform, no leader behind a
 *   label, and every bare number plainly its own symbol's (on a leader, or
 *   clearly nearer its own symbol than any other). The selection with no clean
 *   place is said in the frame above the drawing.
 *
 *   IN PRINT (the size the names are placed for, and a rectangle as A4 draws
 *   it, with Helvetica's own widths): no name row on another row or on another
 *   symbol, none across the shape's lines, none on any leader (a bent one
 *   too), and a platform's name on its platform or not printed.
 *
 *   And: the round's sides by clock positions or numbers; the drum overhead
 *   note in the round; MOVE THEM INSIDE; the export preview fits the width;
 *   Setup's shape lines; the words under the drawing.
 *
 * Run: node --test --test-timeout=120000 test/stagePlotLabelsR3_20261113.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { SP_PALETTE } from '../src/features/stageplot/spCatalog.ts';
import type { SpDocPlot } from '../src/features/stageplot/spDocTypes.ts';
import * as I from '../src/features/stageplot/spInside.ts';
import * as M from '../src/features/stageplot/spModel.ts';
import { SP_PLOT_NOMINAL_W, SP_PLOT_SHAPED_K, SP_PLOT_TYPE, spBuildDoc, spBuildSnapshot, spDocText, spLabelBlock, spLabelBlockPrinted, spPlotDoc, spPlotItemName, spPlotScale } from '../src/features/stageplot/spPacket.ts';
import { spPlotScene } from '../src/features/stageplot/spPacketHtml.ts';
import * as S from '../src/features/stageplot/spShape.ts';
import { SP_MORE_KINDS, spIsSized, spSymbol, type SpShape } from '../src/features/stageplot/spSymbols.ts';
import { spFromTemplate, type SpTemplateId } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';
import * as G from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import * as L from '../src/screens/lab/stageplot/stage/stageLinks.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (f: string): string => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const NOW = Date.UTC(2026, 10, 13, 20, 0);
type Box = { x0: number; y0: number; x1: number; y1: number };
const BAND: Record<string, string> = { salsa: 'Orquesta Ejemplo', 'four-piece': 'The Example Four', playback: 'The Example Tracks', solo: 'Alex Example', duo: 'Alex and Robin' };
const tpl = (id: SpTemplateId, pid = `p-${id}`): SpProject => spFromTemplate(id, { id: pid, now: NOW, band: BAND[id] ?? 'Example' });
const sized = (p: SpProject, w: number, d: number): SpProject => M.spEdit(p, (q) => Object.assign(q.stage, { width: w, depth: d, unit: 'ft', dims: 'confirmed' }));
const moveTo = (p: SpProject, label: string, x: number, y: number): SpProject => {
  const o = p.objects.find((x) => x.label === label);
  return o ? M.spMoveObject(p, o.id, { x, y }, { snap: false }) : p;
};

/* ── the plots ─────────────────────────────────────────────────────────── */

const EXAMPLES: SpTemplateId[] = ['solo', 'duo', 'four-piece', 'playback', 'salsa'];
function boxedSalsa(): SpProject {
  let p = tpl('salsa', 'p-boxed');
  p = M.spAddBox(p, { name: 'SB1', inputs: 16, returns: 8, kind: 'digital', supplier: 'venue', at: { x: 0.25, y: 0.06 } }).p;
  return M.spAddBox(p, { name: 'SB2', inputs: 12, returns: 4, kind: 'analog', supplier: 'venue', at: { x: 0.8, y: 0.06 } }).p;
}
/** The four-piece on 24 × 16 ft, a 10 × 8 ft thrust and 6 ft wings: the
 *  singer out on the thrust, gear in the wings, a stage box. */
function thrustWings(): SpProject {
  let p = sized(tpl('four-piece', 'p-tw'), 24, 16);
  p = M.spSetStageShape(p, { shape: 'thrust', thrustWidth: 10, thrustDepth: 8, wings: true, wingWidth: 6 });
  p = moveTo(p, 'Lead vocal', 0.5, 1.3);
  p = moveTo(p, 'Wedge 1', 0.5, 1.42);
  const sam = p.objects.find((x) => x.kind === 'performer' && p.performers.find((pf) => pf.id === x.performerId)?.name === 'Sam');
  if (sam) p = M.spMoveObject(p, sam.id, { x: 0.5, y: 1.2 }, { snap: false });
  p = moveTo(p, 'In-ear transmitter', -0.12, 0.2);
  p = moveTo(p, 'Keys headphone amplifier', 1.12, 0.3);
  return M.spAddBox(p, { name: 'SB1', inputs: 16, returns: 8, kind: 'digital', supplier: 'venue' }).p;
}
function allNewSymbols(): SpProject {
  let p = M.spNewProject({ id: 'p-syms', now: NOW, band: 'Example' });
  p = { ...p, stage: { ...p.stage, width: 60, depth: 30, unit: 'ft', dims: 'confirmed' } };
  [...SP_MORE_KINDS].forEach((k, i) => {
    p = M.spAddObject(p, k, { x: 0.1 + (i % 6) * 0.16, y: 0.12 + Math.floor(i / 6) * 0.25 }, { label: spSymbol(k) ? (SP_PALETTE.find((x) => x.kind === k)?.name ?? '') : '' }).p;
  });
  return p;
}
/** Every plot this round is judged on: the five examples, the salsa band with
 *  boxes, and shaped versions. */
function screenPlots(): [string, SpProject][] {
  const out: [string, SpProject][] = EXAMPLES.map((id) => [id, tpl(id)]);
  out.push(['salsa with two stage boxes', boxedSalsa()]);
  for (const id of ['four-piece', 'salsa', 'playback'] as const) {
    out.push([`${id} on a thrust`, M.spSetStageShape(tpl(id), { shape: 'thrust' })]);
    out.push([`${id} in the round (square)`, M.spSetStageShape(tpl(id), { shape: 'round', roundForm: 'square' })]);
    out.push([`${id} in the round (30 ft circle)`, M.spSetStageShape(sized(tpl(id), 30, 30), { shape: 'round' })]);
    out.push([`${id} with wings`, M.spSetStageShape(tpl(id), { wings: true })]);
    out.push([`${id} on a thrust with wings`, M.spSetStageShape(tpl(id), { shape: 'thrust', wings: true })]);
  }
  out.push(['four-piece, thrust with wings, sized', thrustWings()]);
  out.push(['salsa with two stage boxes, on a thrust', M.spSetStageShape(boxedSalsa(), { shape: 'thrust' })]);
  return out;
}

/* ── the phone ─────────────────────────────────────────────────────────── */

/** The display at each phone (390 × 844, 375 × 667, 320 × 640): its glass
 *  width and height, measured in the lab; each plot's own key takes its share. */
const PHONES: [string, number, number][] = [
  ['390', 368, 357],
  ['375', 353, 1390 / 7],
  ['320', 298, 168],
];
const glassOf = (p: SpProject, gw: number, H: number): number => G.stageKeySplit(H, G.stageKeyLayout(L.stageKeyEntries(p.objects), gw, G.stageScaleNote(p)).height).stage;

/** The plan exactly as StagePlanView makes it. */
function screenPlan(p: SpProject, gw: number, gh: number, selId: string | null = null, zoom = 1) {
  const T = G.stageTransformFor(p, gw, gh, { zoom, cx: 0.5, cy: 0.6 });
  const order = G.stageDrawOrder(p.objects);
  const items: G.StageLabelIn[] = order.map((o) => ({ id: o.id, text: o.id === selId ? L.stageListName(p, o) : L.stageName(p, o), badges: L.stageBadges(p, o), box: G.stageObjectBox(p, o, T), person: o.kind === 'performer', selected: o.id === selId, onStage: M.spOnStage(o, p.stage) }));
  const f = G.stageFrameBoxes(gw, gh);
  return { T, items, plan: G.stageLabelPlan(items, gw, gh, [f.top, f.bottom, f.left, f.right], G.stageScreenLabelOpts(p, T)) };
}
const hit = (a: Box, b: Box, tol = 0.3): boolean => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > tol && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > tol;
const apart = (a: Box, b: Box): number => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
const within = (a: Box, b: Box, e = 0.01): boolean => a.x0 >= b.x0 - e && a.y0 >= b.y0 - e && a.x1 <= b.x1 + e && a.y1 <= b.y1 + e;
/** Does a line pass through a box (shrunk by `tol`, so a graze is not a cut)? */
function cuts(box: Box, x1: number, y1: number, x2: number, y2: number, tol = 0.3): boolean {
  const b = { x0: box.x0 + tol, y0: box.y0 + tol, x1: box.x1 - tol, y1: box.y1 - tol };
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  for (const [u, v] of [[-dx, x1 - b.x0], [dx, b.x1 - x1], [-dy, y1 - b.y0], [dy, b.y1 - y1]] as [number, number][]) {
    if (Math.abs(u) < 1e-12) {
      if (v < 0) return false;
    } else {
      const t = v / u;
      if (u < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}
/** Every piece a label draws: its name row and each number box. */
function pieces(plan: G.StageLabelPlan): { id: string; what: string; box: Box }[] {
  const out: { id: string; what: string; box: Box }[] = [];
  for (const l of plan.labels) {
    if (l.lines.length) out.push({ id: l.id, what: l.lines.map((x) => x.text).join(' '), box: { ...l.box, x1: l.badges.length ? Math.max(l.box.x0, l.badges[0].x - 4) : l.box.x1 } });
    for (const b of l.badges) out.push({ id: l.id, what: b.text, box: { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h } });
  }
  return out;
}
/** Everything that breaks this round's rules on the phone. */
function screenFaults(p: SpProject, gw: number, gh: number, selId: string | null = null, zoom = 1): string[] {
  const { T, items, plan } = screenPlan(p, gw, gh, selId, zoom);
  const floor = G.stageFloorOf(p, T);
  const glass = { x0: G.STAGE_FRAME.side, y0: G.STAGE_FRAME.top, x1: gw - G.STAGE_FRAME.side, y1: gh - G.STAGE_FRAME.bottom };
  const nameOf = (id: string): string => items.find((i) => i.id === id)?.text || id;
  // what is drawn of each symbol: the part inside the glass (the frame covers the rest)
  const art = items
    .filter((i) => !i.box.sized)
    .map((i) => {
      const b = G.stageBoxBounds(i.box);
      return { id: i.id, person: i.person, box: { x0: Math.max(b.x0, glass.x0), y0: Math.max(b.y0, glass.y0), x1: Math.min(b.x1, glass.x1), y1: Math.min(b.y1, glass.y1) } };
    })
    .filter((a) => a.box.x1 > a.box.x0 && a.box.y1 > a.box.y0);
  const paint = (id: string): number => items.findIndex((x) => x.id === id);
  const bad: string[] = [];
  const ps = pieces(plan);
  for (let i = 0; i < ps.length; i++) {
    const q = ps[i];
    for (let j = i + 1; j < ps.length; j++) if (q.id !== ps[j].id && hit(q.box, ps[j].box)) bad.push(`"${q.what}" on "${ps[j].what}"`);
    const own = items.find((x) => x.id === q.id);
    const ownB = own ? G.stageBoxBounds(own.box) : null;
    const onFigure = !!own?.person && !!ownB && within(q.box, ownB, 0.5);
    for (const a of art) {
      if (a.id === q.id) continue;
      // (the selection, drawn over everything in its own color, may lie over a neighbor only right against its own symbol)
      if (q.id === selId && ownB && apart(plan.labels.find((l) => l.id === q.id)?.box ?? q.box, ownB) <= 8 + 1e-6) continue;
      // (a name wholly on its own figure lies only on an instrument painted under it)
      if (onFigure && !a.person && paint(a.id) < paint(q.id)) continue;
      if (hit(q.box, a.box)) bad.push(`"${q.what}" over the drawing of ${nameOf(a.id)}`);
    }
    if (G.stageCrossesFloor(q.box, floor, 0)) bad.push(`"${q.what}" across a line of the stage`);
    // a riser's dashed edge is a line too: a name is wholly on it or wholly off it
    for (const d of items.filter((x) => x.box.sized && x.id !== q.id)) {
      const db = G.stageBoxBounds(d.box);
      if (hit(q.box, db, 0.01) && !within(q.box, db)) bad.push(`"${q.what}" across the edge of ${nameOf(d.id)}`);
    }
  }
  for (const l of plan.labels) {
    const it = items.find((i) => i.id === l.id);
    if (!it) continue;
    const said = l.lines.map((x) => x.text).join(' ') || l.badges.map((b) => b.text).join(' ');
    if (it.box.sized) {
      if (!within(l.box, G.stageBoxBounds(it.box))) bad.push(`platform name "${said}" is not on its platform`);
      continue;
    }
    const own = G.stageBoxBounds(it.box);
    const lead = G.stageLabelLeader(l.box, own);
    if (lead) {
      for (const o of plan.labels) if (o.id !== l.id && cuts(o.box, lead.x1, lead.y1, lead.x2, lead.y2)) bad.push(`the leader of ${nameOf(l.id)} runs behind "${o.lines.map((x) => x.text).join(' ') || o.badges.map((b) => b.text).join(' ')}"`);
    } else if (!l.lines.length) {
      // a bare number: plainly its own symbol's
      const d = apart(l.box, own);
      for (const a of art) if (a.id !== l.id && apart(l.box, a.box) < d + 2) bad.push(`bare "${said}" of ${nameOf(l.id)} is ${apart(l.box, a.box).toFixed(1)} from ${nameOf(a.id)}, ${d.toFixed(1)} from its own`);
    }
  }
  return [...new Set(bad)];
}

describe('on the phone: names, numbers and leaders (owner 2026-11-13: build the remaining held items)', () => {
  const PLOTS = screenPlots();
  for (const [name, p] of PLOTS)
    it(`${name}: at 390, 375 and 320 wide, nothing selected and zoomed in, every label keeps the rules`, () => {
      for (const [phone, gw, H] of PHONES) {
        const gh = glassOf(p, gw, H);
        assert.deepEqual(screenFaults(p, gw, gh), [], `${name} · ${phone}`);
        for (const zoom of [1.5, 2]) assert.deepEqual(screenFaults(p, gw, gh, null, zoom), [], `${name} · ${phone} ×${zoom}`);
        // every performer is named whole, by initials, or counted out; nothing crowded
        const { items, plan } = screenPlan(p, gw, gh);
        for (const it of items.filter((x) => x.person)) {
          const l = plan.labels.find((x) => x.id === it.id);
          const said = l ? l.lines.map((x) => x.text).join(' ') : '';
          const short = plan.short.find((x) => x.id === it.id);
          assert.ok(said === it.text || (short && said === short.text && short.name === it.text) || (!l && plan.peopleOut.includes(it.id)), `${name} · ${phone}: ${it.text}`);
          if (l) assert.ok(l.fs >= 9, 'readable: at least 9 units');
        }
        assert.deepEqual(plan.crowded, [], `${name} · ${phone}`);
      }
    });

  it('with any one object selected, on every plot, at the three phones: the rules hold, and the selection is named on the drawing or in the frame above it', () => {
    for (const [name, p] of PLOTS)
      for (const [phone, gw, H] of PHONES) {
        const gh = glassOf(p, gw, H);
        for (const o of p.objects) {
          assert.deepEqual(screenFaults(p, gw, gh, o.id), [], `${name} · ${phone} · ${o.label || o.kind} selected`);
          const { plan } = screenPlan(p, gw, gh, o.id);
          const on = plan.labels.some((l) => l.id === o.id && l.lines.length);
          assert.ok(on !== (plan.readout === o.id), `${name} · ${phone}: ${o.label || o.kind} is named in one place`);
          if (plan.readout) {
            const r = G.stageReadoutWords(L.stageListName(p, o), gw);
            assert.ok(r.fs >= 9 && G.stageFrameWordW(r.text, r.fs, r.spacing) <= gw - 8, 'the frame says it, readable, between its ends');
          }
        }
      }
  });

  it('the thrust with wings at 320: the selected "Keys headphone amplifier" never crosses a line, and is named', () => {
    const p = thrustWings();
    const o = p.objects.find((x) => x.label === 'Keys headphone amplifier');
    assert.ok(o);
    const gh = glassOf(p, 298, 168);
    assert.deepEqual(screenFaults(p, 298, gh, o.id), []);
    const { plan } = screenPlan(p, 298, gh, o.id);
    assert.ok(plan.readout === o.id || plan.labels.some((l) => l.id === o.id && l.lines.length));
    assert.deepEqual(G.stageReadoutWords('Keys headphone amplifier', 298), { text: 'SELECTED · Keys headphone amplifier', fs: 10, spacing: 1 });
  });

  it('initials: two words give their initials, one word its first two letters, lengthened until no two performers share one', () => {
    const m = G.stageShortNames([
      { id: 'a', text: 'Marisol' },
      { id: 'b', text: 'Mario' },
      { id: 'c', text: 'Ana María' },
      { id: 'd', text: 'Iván' },
      { id: 'e', text: 'Jo' },
    ]);
    assert.equal(m.get('c'), 'AM');
    assert.equal(m.get('d'), 'Iv');
    assert.equal(m.get('e'), 'Jo');
    assert.notEqual(m.get('a'), m.get('b'));
    assert.ok((m.get('a') ?? '').startsWith('Mar') && (m.get('b') ?? '').startsWith('Mar'));
  });

  it('a platform\'s name is only ever on its platform; with no room there it is left out and counted', () => {
    for (const [name, p] of PLOTS.filter(([n]) => n.startsWith('four-piece')))
      for (const [phone, gw, H] of PHONES) {
        const { items, plan } = screenPlan(p, gw, glassOf(p, gw, H));
        const riser = items.find((i) => i.box.sized);
        assert.ok(riser);
        const l = plan.labels.find((x) => x.id === riser.id);
        assert.ok(l ? within(l.box, G.stageBoxBounds(riser.box)) : plan.dropped.includes(riser.id), `${name} · ${phone}`);
      }
  });

  it('the view draws the readout in the frame and reports the initials; the area says who is who', () => {
    const view = read('src/screens/lab/stageplot/stage/StagePlanView.tsx');
    assert.match(view, /const readout = plan\.readout && selected && plan\.readout === selected\.id \? stageReadoutWords\(selName, gw\) : null;/);
    assert.match(view, /\{readout \? \(\s*<SvgText x=\{midX\} y=\{STAGE_FRAME\.top - 4\.5\} fill=\{AMBER\}/);
    assert.match(view, /\{!readout && T\.zoom <= 1/);
    assert.match(view, /shortRef\.current\?\.\(shortCount, shortWords\);/);
    const area = read('src/screens/lab/stageplot/StageArea.tsx');
    assert.match(area, /onShortNames=\{\(count, words\) =>/);
    assert.match(area, /shortened at this size: \$\{shortNames\.words\}\./);
  });
});

/* ── print ─────────────────────────────────────────────────────────────── */

const shapeBox = (s: SpShape): Box => {
  if (s.t === 'circle') return { x0: s.cx - s.r, y0: s.cy - s.r, x1: s.cx + s.r, y1: s.cy + s.r };
  if (s.t === 'line') return { x0: Math.min(s.x1, s.x2), y0: Math.min(s.y1, s.y2), x1: Math.max(s.x1, s.x2), y1: Math.max(s.y1, s.y2) };
  if (s.t === 'poly') {
    const xs = s.pts.filter((_, i) => i % 2 === 0);
    const ys = s.pts.filter((_, i) => i % 2 === 1);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }
  return { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h };
};
/** Every print fault of a plot drawn at `k` points per meter (`printed`:
 *  each word as wide as Helvetica prints it, else the estimate). */
function printFaults(p: SpProject, plot: SpDocPlot, k: number, printed: boolean): string[] {
  const X = (x: number): number => (plot.marginM + x) * k;
  const Y = (y: number): number => (plot.marginM + y) * k;
  const kind = new Map(p.objects.map((o) => [o.id, o.kind]));
  const rows: { id: string; text: string; box: Box }[] = [];
  const parts: { id: string; box: Box }[] = [];
  for (const it of plot.items) {
    const sizedKind = spIsSized(kind.get(it.id) ?? 'generic');
    if (!sizedKind) for (const s of it.shapes) {
      const b = shapeBox(s);
      parts.push({ id: it.id, box: { x0: X(b.x0) - 0.3, y0: Y(b.y0) - 0.3, x1: X(b.x1) + 0.3, y1: Y(b.y1) + 0.3 } });
    }
    const blk = printed ? spLabelBlockPrinted(it) : spLabelBlock(it);
    if (!blk.h) continue;
    const x0 = X(it.labelAt.x) - blk.labelW / 2;
    rows.push({ id: it.id, text: it.label || it.badges.join(' '), box: { x0, y0: Y(it.labelAt.y), x1: x0 + blk.w, y1: Y(it.labelAt.y) + blk.h } });
  }
  const bad: string[] = [];
  const TOL = 0.25;
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) if (hit(rows[i].box, rows[j].box, TOL)) bad.push(`"${rows[i].text}" runs into "${rows[j].text}"`);
    for (const q of parts) if (q.id !== rows[i].id && hit(rows[i].box, q.box, TOL)) bad.push(`"${rows[i].text}" touches the symbol of ${spPlotItemName(plot.items.find((x) => x.id === q.id) as SpDocPlot['items'][number]) || q.id}`);
    for (const it of plot.items) {
      if (!it.leader || it.id === rows[i].id) continue;
      const l = it.leader;
      const legs = l.via ? [[l.from, l.via], [l.via, l.to]] : [[l.from, l.to]];
      if (legs.some(([a, b]) => cuts(rows[i].box, X(a.x), Y(a.y), X(b.x), Y(b.y), 0.2))) bad.push(`"${rows[i].text}" lies on the leader of ${spPlotItemName(it)}`);
    }
    // a platform's name: on its platform
    if (spIsSized(kind.get(rows[i].id) ?? 'generic')) {
      const own = plot.items.find((x) => x.id === rows[i].id);
      if (own) {
        const b = own.shapes.map(shapeBox).reduce((a, c) => ({ x0: Math.min(a.x0, c.x0), y0: Math.min(a.y0, c.y0), x1: Math.max(a.x1, c.x1), y1: Math.max(a.y1, c.y1) }));
        if (!within(rows[i].box, { x0: X(b.x0), y0: Y(b.y0), x1: X(b.x1), y1: Y(b.y1) })) bad.push(`platform "${rows[i].text}" is not on its platform`);
      }
    }
  }
  // the shape's own lines
  if (plot.deck) {
    const segs: [number, number, number, number][] = [];
    const ol = plot.deck.outline;
    if (ol.t === 'poly') for (let n = 0; n + 1 < ol.pts.length; n += 2) segs.push([ol.pts[n], ol.pts[n + 1], ol.pts[(n + 2) % ol.pts.length], ol.pts[(n + 3) % ol.pts.length]]);
    for (const a of plot.deck.areas) segs.push([a.x, a.y, a.x + a.w, a.y], [a.x + a.w, a.y, a.x + a.w, a.y + a.h], [a.x + a.w, a.y + a.h, a.x, a.y + a.h], [a.x, a.y + a.h, a.x, a.y]);
    for (const r of rows) {
      for (const s of segs) if (cuts(r.box, X(s[0]), Y(s[1]), X(s[2]), Y(s[3]), 0.2)) bad.push(`"${r.text}" lies across the stage's line`);
      if (ol.t === 'circle') {
        const c = { x: X(ol.cx), y: Y(ol.cy), r: ol.r * k };
        const b = r.box;
        const near = Math.hypot(Math.max(0, b.x0 - c.x, c.x - b.x1), Math.max(0, b.y0 - c.y, c.y - b.y1));
        const far = Math.hypot(Math.max(Math.abs(b.x0 - c.x), Math.abs(b.x1 - c.x)), Math.max(Math.abs(b.y0 - c.y), Math.abs(b.y1 - c.y)));
        if (near < c.r - 0.2 && c.r + 0.2 < far) bad.push(`"${r.text}" lies across the circle`);
      }
    }
  }
  return [...new Set(bad)];
}
function printPlots(): [string, SpProject][] {
  const syms = allNewSymbols();
  return [
    ...EXAMPLES.map((id) => [id, tpl(id)] as [string, SpProject]),
    ['salsa with two stage boxes', boxedSalsa()],
    ['the 22 new symbols', syms],
    ...screenPlots().slice(6),
    ['the 22 new symbols, thrust', M.spSetStageShape(syms, { shape: 'thrust', thrustWidth: 20, thrustDepth: 10 })],
    ['the 22 new symbols, wings', M.spSetStageShape(syms, { shape: 'wings', wingWidth: 10 })],
    ['the 22 new symbols, round', M.spSetStageShape(syms, { shape: 'round', roundForm: 'square' })],
    ['four-piece, wings 6 ft', M.spSetStageShape(sized(tpl('four-piece', 'p-w6'), 24, 16), { shape: 'wings', wingWidth: 6 })],
  ];
}

describe('in print: names, numbers, leaders and the riser (owner 2026-11-13: build the remaining held items)', () => {
  for (const [name, p] of printPlots())
    it(`${name}: at the size its names are placed for (and a rectangle as A4 prints it), no name row touches another row or another symbol, lies across a line or on a leader; a platform's name is on its platform`, () => {
      for (const roomy of [false, true]) {
        const plot = spPlotDoc(p, { roomy });
        const shaped = !!plot.deck;
        // the size the names were placed for
        const placed = shaped ? spPlotScale({ ...plot, roomy: false }, SP_PLOT_SHAPED_K.width) * SP_PLOT_SHAPED_K.give : spPlotScale(plot, SP_PLOT_NOMINAL_W);
        assert.deepEqual(printFaults(p, plot, placed, shaped), [], `${name}${roomy ? ' (plot only)' : ''}: at the placed size`);
        // a rectangle as A4 draws it (a little smaller), every word as wide as Helvetica prints it
        if (!shaped) assert.deepEqual(printFaults(p, plot, Math.min(placed, spPlotScale(plot, SP_PLOT_SHAPED_K.width)), true), [], `${name}${roomy ? ' (plot only)' : ''}: as A4 prints it`);
      }
    });

  it('the salsa band on A4: "Nelson (M5)" is clear of the bass amp, as Helvetica prints it', () => {
    for (const p of [tpl('salsa'), boxedSalsa()]) {
      const plot = spPlotDoc(p);
      const k = spPlotScale(plot, SP_PLOT_SHAPED_K.width);
      const X = (x: number): number => (plot.marginM + x) * k;
      const Y = (y: number): number => (plot.marginM + y) * k;
      const nelson = plot.items.find((i) => i.person && i.label === 'Nelson');
      const amp = plot.items.find((i) => p.objects.find((o) => o.id === i.id)?.label === 'Bass amp');
      assert.ok(nelson && amp);
      const b = spLabelBlockPrinted(nelson);
      const row = { x0: X(nelson.labelAt.x) - b.labelW / 2, y0: Y(nelson.labelAt.y), x1: X(nelson.labelAt.x) - b.labelW / 2 + b.w, y1: Y(nelson.labelAt.y) + b.h };
      for (const s of amp.shapes) {
        const q = shapeBox(s);
        assert.ok(apart(row, { x0: X(q.x0), y0: Y(q.y0), x1: X(q.x1), y1: Y(q.y1) }) > 0.3, 'at least a hair of paper between them');
      }
    }
  });

  it('a symbol printed with no name (its name only repeats the key\'s) is named in the key, the legend says so, and the text view still names it', () => {
    const p = M.spSetStageShape(allNewSymbols(), { shape: 'thrust', thrustWidth: 20, thrustDepth: 10 });
    const plot = spPlotDoc(p);
    const unnamed = plot.items.filter((i) => !i.label && !i.badges.length && spPlotItemName(i));
    for (const i of unnamed) assert.ok(plot.key.some((k) => k.name.toLowerCase() === spPlotItemName(i).toLowerCase() || k.name.toLowerCase().startsWith(`${spPlotItemName(i).toLowerCase()} (`)), spPlotItemName(i));
    assert.equal(plot.legend.some((l) => l === 'A symbol with no name beside it is named in the key.'), unnamed.length > 0);
    const text = spDocText(spBuildDoc(spBuildSnapshot(p, { paper: 'a4', packet: 'full' }, NOW)));
    for (const i of unnamed) assert.ok(text.includes(`- ${spPlotItemName(i)}: `), spPlotItemName(i));
    // a rectangle never leaves a name out this way
    assert.ok(!spPlotDoc(allNewSymbols()).legend.includes('A symbol with no name beside it is named in the key.'));
  });

  it('a bent leader is drawn as two lines, under the symbols, in the sheet', () => {
    const p = M.spSetStageShape(allNewSymbols(), { shape: 'thrust', thrustWidth: 20, thrustDepth: 10 });
    const plot = spPlotDoc(p);
    const bent = plot.items.filter((i) => i.leader?.via);
    const straight = plot.items.filter((i) => i.leader && !i.leader.via);
    const lines = spPlotScene(plot, 508).ops.filter((o) => o.t === 'line' && o.stroke === '#8a8a8a');
    assert.equal(lines.length, straight.length + 2 * bent.length);
    for (const i of bent) {
      const l = i.leader as NonNullable<typeof i.leader>;
      assert.ok(Math.abs(l.via!.x - l.to.x) < 1e-9 || Math.abs(l.via!.y - l.to.y) < 1e-9, 'one bend: the last leg runs straight across or down to the symbol');
      assert.deepEqual(l.to, i.at);
    }
  });
});

/* ── the round's sides ─────────────────────────────────────────────────── */

describe('in the round: name the sides by the reference side, clock positions or numbers (owner 2026-11-13: build the remaining held items)', () => {
  const round = (sides?: 'ref' | 'clock' | 'numbered') => M.spSetStageShape(sized(tpl('four-piece', 'p-r'), 30, 30), { shape: 'round', ...(sides ? { roundSides: sides } : {}) });
  it('the default stays exactly as today: no field saved, the same words everywhere', () => {
    const p = round();
    assert.equal('roundSides' in p.stage, false);
    assert.equal('roundSides' in round('ref').stage, false, 'the usual naming is never saved');
    assert.deepEqual(S.spShapeDirections(p.stage), { up: 'FAR SIDE (AUDIENCE)', down: 'FOH SIDE (AUDIENCE)', right: 'STAGE RIGHT (AUDIENCE)', left: 'STAGE LEFT (AUDIENCE)' });
    assert.deepEqual(G.stageRoundFrameWords(p.stage), { far: 'FAR SIDE · ', all: 'AUDIENCE ON ALL SIDES', near: 'FOH SIDE' });
    assert.equal(G.stageRoundSideWords(p.stage), null);
    assert.equal(S.spShapeLocationWord({ x: 0.15, y: 0.85 }, p.stage), 'The FOH side, stage right');
    assert.deepEqual(S.spShapeFacingWords(90, p.stage), { full: 'facing stage right', short: 'facing stage right' });
    const plot = spPlotDoc(p);
    assert.match(plot.sizeNote, /in the round: the FOH side is at the bottom$/);
    assert.equal('roundSides' in (plot.deck?.stage ?? {}), false);
    // an old plot with a stray value reads as the usual naming
    const back = M.spMigrate(JSON.parse(JSON.stringify({ ...p, stage: { ...p.stage, roundSides: 'sideways' } })));
    assert.ok(back && !('roundSides' in back.stage));
  });

  it('clock positions: 12 o’clock at FOH, 3 o’clock on the left of the drawing, on screen, in position words and in print', () => {
    const p = round('clock');
    assert.equal(p.stage.roundSides, 'clock');
    assert.equal(S.spShapeLocationWord({ x: 0.5, y: 0.9 }, p.stage), 'Toward 12 o’clock');
    assert.equal(S.spShapeLocationWord({ x: 0.1, y: 0.5 }, p.stage), 'Toward 3 o’clock');
    assert.equal(S.spShapeLocationWord({ x: 0.5, y: 0.1 }, p.stage), 'Toward 6 o’clock');
    assert.equal(S.spShapeLocationWord({ x: 0.9, y: 0.5 }, p.stage), 'Toward 9 o’clock');
    assert.equal(S.spShapeLocationWord({ x: 0.5, y: 0.5 }, p.stage), 'Center');
    assert.deepEqual(S.spShapeFacingWords(0, p.stage), { full: 'facing 12 o’clock', short: 'faces 12 o’clock' });
    assert.deepEqual(S.spShapeFacingWords(90, p.stage), { full: 'facing 3 o’clock', short: 'faces 3 o’clock' });
    assert.deepEqual(S.spShapeFacingWords(45, p.stage), { full: 'facing between 1 and 2 o’clock', short: 'faces 1–2 o’clock' });
    assert.deepEqual(S.spShapeDirections(p.stage), { up: '6 O’CLOCK (AUDIENCE)', down: '12 O’CLOCK · FOH SIDE (AUDIENCE)', right: '3 O’CLOCK (AUDIENCE)', left: '9 O’CLOCK (AUDIENCE)' });
    assert.deepEqual(G.stageRoundFrameWords(p.stage), { far: '6 O’CLOCK · ', all: 'AUDIENCE ON ALL SIDES', near: '12 O’CLOCK · FOH' });
    assert.deepEqual(G.stageRoundSideWords(p.stage), { right: '3 O’CLOCK', left: '9 O’CLOCK' });
    const plot = spPlotDoc(p);
    assert.match(plot.sizeNote, /in the round: 12 o’clock \(the FOH side\) is at the bottom$/);
    assert.equal(plot.deck?.stage.roundSides, 'clock');
    const text = spDocText(spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'full' }, NOW)));
    assert.match(text, /in the round, in clock positions: 12 o’clock is the FOH side, at the bottom of the drawing/);
    assert.match(text, /Toward \d+ o’clock/);
    assert.match(S.spShapeWords(p.stage), /with 12 o’clock at the FOH side, at the bottom of this drawing: 3 o’clock is on the drawing’s left/);
  });

  it('numbered sides: side 1 at FOH, numbered clockwise as seen from above', () => {
    const p = round('numbered');
    assert.equal(S.spShapeLocationWord({ x: 0.5, y: 0.9 }, p.stage), 'Toward side 1');
    assert.equal(S.spShapeLocationWord({ x: 0.1, y: 0.5 }, p.stage), 'Toward side 2');
    assert.equal(S.spShapeLocationWord({ x: 0.5, y: 0.1 }, p.stage), 'Toward side 3');
    assert.equal(S.spShapeLocationWord({ x: 0.9, y: 0.5 }, p.stage), 'Toward side 4');
    assert.equal(S.spShapeLocationWord({ x: 0.15, y: 0.85 }, p.stage), 'Between sides 1 and 2');
    assert.deepEqual(S.spShapeFacingWords(180, p.stage), { full: 'facing side 3', short: 'facing side 3' });
    assert.deepEqual(S.spShapeFacingWords(30, p.stage), { full: 'facing side 1, turned toward side 2', short: 'faces side 1, to side 2' });
    assert.deepEqual(S.spShapeDirections(p.stage), { up: 'SIDE 3 (AUDIENCE)', down: 'SIDE 1 · FOH (AUDIENCE)', right: 'SIDE 2 (AUDIENCE)', left: 'SIDE 4 (AUDIENCE)' });
    assert.match(spPlotDoc(p).sizeNote, /in the round: side 1 \(the FOH side\) is at the bottom$/);
    const text = spDocText(spBuildDoc(spBuildSnapshot(p, { paper: 'a4', packet: 'compact' }, NOW)));
    assert.match(text, /Side 1 is the FOH side, at the bottom; sides 2, 3 and 4 follow clockwise\./);
  });

  it('the frame words fit at 320 wide with the longest reference name, and Setup offers the choice in those words', () => {
    for (const sides of ['clock', 'numbered'] as const) {
      const w = G.stageRoundFrameWords(M.spSetStageShape(round(sides), { roundRef: 'MONITORWORLD' }).stage);
      assert.ok(G.stageFrameWordW(w.far + w.all, 10, 1.4) <= 298 - 2 * G.STAGE_FRAME.side, sides);
      assert.ok(G.stageFrameWordW(w.near, 10.5, 1.4) <= 2 * (Math.min(298 / 2 - 24, 96) - 5), `${sides}: between the arrows`);
    }
    assert.deepEqual(S.SP_ROUND_SIDES.map((v) => S.spRoundSidesWord(v, 'FOH')), ['FOH side and far side', 'Clock positions (12 o’clock at FOH)', 'Numbered sides (side 1 at FOH)']);
    const setup = read('src/screens/lab/stageplot/SetupArea.tsx');
    assert.match(setup, /label="Name the sides by"/);
    assert.match(setup, /setShape\(\{ roundSides \}\)/);
    const view = read('src/screens/lab/stageplot/stage/StagePlanView.tsx');
    assert.match(view, /\{sideWords\.right\}/);
  });
});

describe('the drum overhead note in the round (owner 2026-11-13: build the remaining held items)', () => {
  it('said from the FOH side (or 12 o’clock, or side 1) in the round; back as it was on any other shape; a band\'s own note is never changed', () => {
    const four = tpl('four-piece');
    assert.equal(four.viewNote, S.SP_OVERHEAD_NOTE);
    const r = M.spSetStageShape(four, { shape: 'round' });
    assert.equal(r.viewNote, 'Overhead L and R are named as the kit is seen from the FOH side.');
    assert.equal(M.spSetStageShape(r, { roundSides: 'clock' }).viewNote, 'Overhead L and R are named as the kit is seen from 12 o’clock (the FOH side).');
    assert.equal(M.spSetStageShape(r, { roundSides: 'numbered', roundRef: 'Bar' }).viewNote, 'Overhead L and R are named as the kit is seen from side 1 (the Bar side).');
    assert.equal(M.spSetStageShape(r, { shape: 'thrust' }).viewNote, S.SP_OVERHEAD_NOTE);
    assert.equal(M.spSetStageShape(four, { shape: 'thrust' }).viewNote, S.SP_OVERHEAD_NOTE, 'a thrust keeps the audience viewpoint');
    const own = M.spEdit(four, (d) => (d.viewNote = 'Our overheads are named from the drummer’s seat.'));
    assert.equal(M.spSetStageShape(own, { shape: 'round' }).viewNote, 'Our overheads are named from the drummer’s seat.');
    // printed under the plot
    assert.equal(spPlotDoc(r).viewNote, 'Overhead L and R are named as the kit is seen from the FOH side.');
  });
});

/* ── MOVE THEM INSIDE ──────────────────────────────────────────────────── */

describe('objects across a new outline: MOVE THEM INSIDE, one edit (owner 2026-11-13: build the remaining held items)', () => {
  it('a rectangle that becomes a circle names the objects it left across or outside the edge; nothing moves until asked', () => {
    const four = tpl('four-piece');
    assert.deepEqual(I.spAcrossOutline(four), [], 'the example stands wholly on its stage');
    const circle = M.spSetStageShape(four, { shape: 'round' });
    const out = I.spDisplacedBy(four, circle);
    const names = out.map((id) => circle.objects.find((o) => o.id === id)?.label).sort();
    assert.deepEqual(names, ['Click', 'In-ear transmitter', 'Keys headphone amplifier']);
    for (const o of four.objects) assert.deepEqual({ x: circle.objects.find((x) => x.id === o.id)?.x, y: circle.objects.find((x) => x.id === o.id)?.y }, { x: o.x, y: o.y }, 'a change of shape moves nothing');
  });
  it('MOVE THEM INSIDE moves exactly those, each wholly onto the stage, a short way, in one edit', () => {
    for (const id of EXAMPLES) {
      const before = tpl(id);
      const circle = M.spSetStageShape(before, { shape: 'round' });
      const ids = I.spDisplacedBy(before, circle);
      const r = I.spMoveInside(circle, ids);
      assert.deepEqual([...r.moved].sort(), [...ids].sort(), id);
      for (const o of r.p.objects) {
        const was = circle.objects.find((x) => x.id === o.id);
        assert.ok(was);
        if (ids.includes(o.id)) {
          assert.ok(I.spWhollyOn(r.p, o), `${id}: ${o.label} is on the stage`);
          assert.ok(Math.hypot(o.x - was.x, o.y - was.y) < 0.35, `${id}: ${o.label} moved a short way`);
        } else assert.deepEqual({ x: o.x, y: o.y }, { x: was.x, y: was.y }, `${id}: nothing else moves`);
      }
      // nothing to do: the same project back
      assert.equal(I.spMoveInside(r.p, ids).p, r.p);
    }
  });
  it('Setup and the Stage show the offer; a change of shape or size notes what it displaced', () => {
    const setup = read('src/screens/lab/stageplot/SetupArea.tsx');
    assert.match(setup, /noteDisplaced\(q\.id, spDisplacedBy\(q, next\)\);/);
    assert.match(setup, /const setShape = \(patch: Parameters<typeof spSetStageShape>\[1\]\) => reshape\(\(q\) => spSetStageShape\(q, patch\)\);/);
    assert.match(setup, /<InsideOffer \/>/);
    assert.match(read('src/screens/lab/stageplot/StageArea.tsx'), /<InsideOffer \/>/);
    const offer = read('src/screens/lab/stageplot/InsideOffer.tsx');
    assert.match(offer, /label=\{ids\.length === 1 \? 'MOVE IT INSIDE' : 'MOVE THEM INSIDE'\}/);
    assert.match(offer, /ed\.apply\(\(q\) => \{\s*const r = spMoveInside\(q, ids\);/);
    assert.match(offer, /one UNDO puts them back/);
  });
});

/* ── the export preview, Setup's shape lines ───────────────────────────── */

describe('the export preview fits a phone; Setup shows the chosen shape\'s line (owner 2026-11-13: build the remaining held items)', () => {
  it('the plot is drawn at the window\'s width (no page-wide sideways scroll); ZOOM IN shows the printed size inside its own frame', () => {
    const view = read('src/screens/lab/stageplot/export/PlotView.tsx');
    assert.match(view, /<Scene scene=\{parts\.stage\} drawW=\{fitW\}/);
    assert.match(view, /<View style=\{\[styles\.wrap, \{ width: fitW \}\]\}>/);
    assert.match(view, /\{zoomed \? \(\s*<ScrollView horizontal[^>]*style=\{\{ width: fitW \}\}/);
    assert.match(view, /label=\{zoomed \? 'ZOOM OUT: FIT THE SCREEN' : 'ZOOM IN: FULL SIZE'\}/);
    assert.match(view, /export const SP_PLOT_MIN_W = 520;/, 'the names are still placed for the printed size');
  });
  it('Setup: the shapes are the choices, and only the chosen one\'s line is shown, in full', () => {
    const setup = read('src/screens/lab/stageplot/SetupArea.tsx');
    assert.match(setup, /<Text style=\{styles\.quiet\}>\{SP_SHAPE_HINT\[shape\]\}<\/Text>/);
    assert.doesNotMatch(setup, /SP_SHAPES\.map\(\(s\) =>/);
  });
  it('the words under the drawing are true: names are kept clear of other names AND drawings, and inside the stage', () => {
    const area = read('src/screens/lab/stageplot/StageArea.tsx');
    assert.doesNotMatch(area, /so no name is covered|so nothing is covered/);
    assert.match(area, /hidden so that no name covers another name or drawing\./);
    assert.match(area, /there is no clear spot beside \$\{numbersOut === 1 \? 'its' : 'their'\} own symbol, inside the stage\./);
  });
  it('the type stays readable: names at least 9 points in print and on the phone', () => {
    assert.ok(SP_PLOT_TYPE.label >= 9 && SP_PLOT_TYPE.person >= 9 && SP_PLOT_TYPE.badge >= 9);
    assert.ok(G.STAGE_NAME_FS >= 9 && G.STAGE_PERSON_FS >= 9 && G.STAGE_BADGE_FS >= 9);
  });
});
