/**
 * Stage shapes and numbered stage boxes (owner GO 2026-11-13: "yes i want a
 * stage-shape option (thrust, round or wings). also the ability to place where
 * stage boxes are").
 *
 *   SHAPES  rectangle (every saved plot and example, unchanged), thrust, in
 *           the round, with wings: the drawing, the on-stage test, the
 *           position words, snap and grid, undo, migration, copies, packet.
 *   BOXES   SB1, SB2…: sockets, returns, a place on the stage; inputs plugged
 *           in by hand or by AUTO-ASSIGN (channel order, nearest box, never
 *           over a socket chosen by hand); the input list column, the patch
 *           summary, and four review questions.
 *
 * Run: node --test --test-timeout=120000 test/stagePlotShapesBoxes_20261113.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spBoxLine, spBoxUse, spTextSummary } from '../src/features/stageplot/spDerive.ts';
import { spHistoryApply, spHistoryRedo, spHistoryStart, spHistoryUndo } from '../src/features/stageplot/spHistory.ts';
import * as M from '../src/features/stageplot/spModel.ts';
import { spBuildDoc, spBuildSnapshot, spDocText, spPlotDoc } from '../src/features/stageplot/spPacket.ts';
import { spPlotScene } from '../src/features/stageplot/spPacketHtml.ts';
import { spPdfBytes } from '../src/features/stageplot/spPdf.ts';
import { spGuidedSteps, spReview, type SpIssue } from '../src/features/stageplot/spReview.ts';
import * as S from '../src/features/stageplot/spShape.ts';
import { SP_TEMPLATES, spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';
import { spIssueActionLabel, runIssueAction } from '../src/screens/lab/stageplot/spIssueActions.ts';
import { spBoxFreeSocket, spBoxSocketLines, spRowBoxWords, spRowView, spSameSocket } from '../src/screens/lab/stageplot/inputs/inputsLogic.ts';
import { stageFacingShort, stageFacingWord, stageRegionFor, stageSnapPoint } from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import { stageFreeSpot, stagePlace, stageUnplaced } from '../src/screens/lab/stageplot/stage/stageLinks.ts';
import { spPatchRows } from '../src/features/stageplot/spDerive.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (f: string): string => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const NOW = Date.UTC(2026, 10, 13, 20, 0);
const four = (id = 'p-four'): SpProject => spFromTemplate('four-piece', { id, now: NOW, band: 'The Example Four' });
const salsa = (id = 'p-salsa'): SpProject => spFromTemplate('salsa', { id, now: NOW, band: 'Orquesta Ejemplo' });
const sized = (p: SpProject, w: number, d: number): SpProject => M.spEdit(p, (q) => Object.assign(q.stage, { width: w, depth: d, unit: 'ft', dims: 'confirmed' }));
const rule = (p: SpProject, r: string): SpIssue[] => spReview(p).filter((i) => i.rule === r);

/* ── shapes ─────────────────────────────────────────────────────────────── */

describe('stage shapes: the model', () => {
  it('a new plot and every example is a RECTANGLE, unchanged', () => {
    assert.equal(M.spNewProject({ id: 'x', now: NOW }).stage.shape, 'rect');
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `t-${t.id}`, now: NOW });
      assert.equal(p.stage.shape, 'rect', t.id);
      assert.deepEqual(p.boxes, [], t.id);
      assert.equal(spPlotDoc(p).deck, undefined, `${t.id}: a rectangle draws no shape of its own`);
    }
  });

  it('a plot saved at schema 1 reads as a rectangle with no stage boxes (migration)', () => {
    const old = JSON.parse(JSON.stringify(four('old'))) as Record<string, unknown> & SpProject;
    old.schema = 1;
    const st = old.stage as unknown as Record<string, unknown>;
    for (const k of ['shape', 'thrustWidth', 'thrustDepth', 'wingWidth', 'roundForm', 'roundRef']) delete st[k];
    delete (old as Record<string, unknown>).boxes;
    for (const i of old.inputs) {
      delete (i as unknown as Record<string, unknown>).box;
      delete (i as unknown as Record<string, unknown>).direct;
    }
    for (const o of old.objects) delete (o as unknown as Record<string, unknown>).boxId;
    const q = M.spMigrate(old) as SpProject;
    assert.ok(q);
    assert.equal(q.schema, 2);
    assert.equal(q.stage.shape, 'rect');
    assert.equal(q.stage.roundForm, 'circle');
    assert.equal(q.stage.roundRef, 'FOH');
    assert.deepEqual(q.boxes, []);
    assert.ok(q.inputs.every((i) => i.box === null && i.direct === false));
    assert.ok(q.objects.every((o) => o.boxId === null));
    assert.deepEqual(M.spBrokenRefs(q), []);
    // a junk shape or size is the safe default, never kept
    const junk = M.spMigrate({ ...old, stage: { ...old.stage, shape: 'hexagon', thrustWidth: -3, wingWidth: 'x' } }) as SpProject;
    assert.equal(junk.stage.shape, 'rect');
    assert.equal(junk.stage.thrustWidth, null);
    assert.equal(junk.stage.wingWidth, null);
  });

  it('a circle has one size: its depth follows its width', () => {
    let p = sized(four(), 30, 18);
    p = M.spSetStageShape(p, { shape: 'round', roundForm: 'circle' });
    assert.equal(p.stage.depth, 30);
    assert.equal(M.spStageAspect(p), 1);
    p = M.spSetStageShape(p, { roundForm: 'square' });
    p = M.spEdit(p, (q) => (q.stage.depth = 20));
    assert.equal(p.stage.depth, 20, 'a square in the round keeps its own depth');
  });

  it('on the stage, per shape: a tongue and a wing are on it; a corner outside a circle is not', () => {
    const rect = M.spNewProject({ id: 'r', now: NOW }).stage;
    const thrust = { ...rect, shape: 'thrust' as const };
    const wings = { ...rect, shape: 'wings' as const };
    const circle = { ...rect, shape: 'round' as const, roundForm: 'circle' as const };
    const square = { ...rect, shape: 'round' as const, roundForm: 'square' as const };
    assert.equal(M.spOnStage({ x: 0.5, y: 1.2 }, rect), false);
    assert.equal(M.spOnStage({ x: 0.5, y: 1.2 }, thrust), true, 'on the tongue');
    assert.equal(M.spOnStage({ x: 0.1, y: 1.1 }, thrust), false, 'beside the tongue is the audience');
    assert.equal(M.spOnStage({ x: -0.1, y: 0.5 }, wings), true, 'in the stage right wing');
    assert.equal(S.spInPerformance({ x: -0.1, y: 0.5 }, wings), false, 'a wing is not the performance area');
    assert.equal(M.spOnStage({ x: -0.3, y: 0.5 }, wings), false, 'past the wing');
    assert.equal(M.spOnStage({ x: 0.05, y: 0.05 }, circle), false, 'the corner outside the circle');
    assert.equal(M.spOnStage({ x: 0.05, y: 0.05 }, square), true);
    assert.equal(M.spOnStage({ x: 0.5, y: 0.5 }, circle), true);
    // a rectangle is exactly what it was
    for (const at of [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0.5, y: 0.5 }, { x: -0.01, y: 0.5 }, { x: 0.5, y: 1.01 }]) assert.equal(M.spOnStage(at, rect), M.spOnStage(at));
  });

  it('the position words, per shape (round: from the reference side)', () => {
    const base = M.spNewProject({ id: 'r', now: NOW }).stage;
    assert.equal(M.spLocationWord({ x: 0.1, y: 0.1 }), 'Upstage right', 'the rectangle is unchanged');
    const thrust = { ...base, shape: 'thrust' as const };
    assert.equal(M.spLocationWord({ x: 0.5, y: 1.05 }, thrust), 'Thrust, center');
    assert.equal(M.spLocationWord({ x: 0.5, y: 1.3 }, thrust), 'Thrust tip, center');
    assert.equal(M.spLocationWord({ x: 0.36, y: 1.3 }, thrust), 'Thrust tip, stage right side');
    assert.equal(M.spLocationWord({ x: 0.9, y: 0.9 }, thrust), 'Downstage left');
    const wings = { ...base, shape: 'wings' as const };
    assert.equal(M.spLocationWord({ x: -0.08, y: 0.4 }, wings), 'Stage right wing');
    assert.equal(M.spLocationWord({ x: 1.08, y: 0.4 }, wings), 'Stage left wing');
    const round = { ...base, shape: 'round' as const, roundForm: 'square' as const };
    assert.equal(M.spLocationWord({ x: 0.1, y: 0.9 }, round), 'The FOH side, stage right');
    assert.equal(M.spLocationWord({ x: 0.5, y: 0.1 }, round), 'The far side, center');
    assert.equal(M.spLocationWord({ x: 0.5, y: 0.5 }, round), 'Center');
    assert.equal(M.spLocationWord({ x: 0.9, y: 0.5 }, round), 'Stage left');
    assert.equal(M.spLocationWord({ x: 0.5, y: 0.9 }, { ...round, roundRef: 'Bar' }), 'The Bar side, center');
  });

  it('facing, in the round, is said from the reference side; elsewhere it is unchanged', () => {
    const base = M.spNewProject({ id: 'r', now: NOW }).stage;
    const round = { ...base, shape: 'round' as const };
    assert.equal(stageFacingWord(0), 'facing the audience');
    assert.equal(stageFacingWord(0, round), 'facing the FOH side');
    assert.equal(stageFacingWord(180, round), 'facing the far side');
    assert.equal(stageFacingWord(90, round), 'facing stage right');
    assert.equal(stageFacingWord(0, { ...base, shape: 'thrust' as const }), 'facing the audience');
    // the dock's one-line readout stays short with the longest reference name
    const long = { ...round, roundRef: 'X'.repeat(S.SP_ROUND_REF_MAX) };
    for (let r = 0; r < 360; r += 5) assert.ok(`${r}° · ${stageFacingShort(r, long)}`.length <= 48, `${r}: ${stageFacingShort(r, long)}`);
    // the short form says "faces", so a turn is never read as a place
    assert.equal(stageFacingShort(45, round), 'faces FOH side, to stage right');
  });

  it('the review asks about an object off the stage, per shape', () => {
    let p = sized(four(), 24, 16);
    const mic = p.objects.find((o) => o.label === 'Lead vocal') as SpProject['objects'][number];
    p = M.spMoveObject(p, mic.id, { x: 0.5, y: 1.2 }, { snap: false });
    assert.equal(rule(p, 'object-offstage').length, 1, 'a rectangle: in front of the stage is off it');
    const t = M.spSetStageShape(p, { shape: 'thrust' });
    assert.equal(rule(t, 'object-offstage').length, 0, 'a thrust: the same place is on its tongue');
    const w = M.spMoveObject(M.spSetStageShape(p, { shape: 'wings', wingWidth: 6 }), mic.id, { x: -0.1, y: 0.4 }, { snap: false });
    assert.equal(rule(w, 'object-offstage').length, 0, 'in a wing is on the plot');
    const r = M.spMoveObject(M.spSetStageShape(p, { shape: 'round', roundForm: 'circle' }), mic.id, { x: 0.04, y: 0.04 }, { snap: false });
    assert.equal(rule(r, 'object-offstage').length >= 1, true, 'the corner of the square is outside the circle');
  });

  it('moving reaches the shape: a deep thrust lets an object go to its tip, and snap matches the editor', () => {
    let p = sized(four(), 24, 16);
    p = M.spSetStageShape(p, { shape: 'thrust', thrustWidth: 12, thrustDepth: 20 });
    const lim = S.spMoveLimits(p.stage);
    assert.ok(Math.abs(lim.y1 - (1 + 1.25 + 0.25)) < 1e-9, `tongue 20/16 deep: ${lim.y1}`);
    const o = p.objects[0];
    for (const to of [{ x: 0.5, y: 2.1 }, { x: 0.43, y: 1.77 }, { x: -0.6, y: 3 }]) {
      const moved = M.spObject(M.spMoveObject(p, o.id, to), o.id) as SpProject['objects'][number];
      const seen = stageSnapPoint(p, to);
      assert.ok(Math.abs(moved.x - seen.x) < 1e-9 && Math.abs(moved.y - seen.y) < 1e-9, `the drawing and the model agree at ${JSON.stringify(to)}`);
    }
    // a rectangle keeps its old reach
    const r = sized(four(), 24, 16);
    assert.equal((M.spObject(M.spMoveObject(r, o.id, { x: 0.5, y: 3 }), o.id) as SpProject['objects'][number]).y, 1.25);
    // the picture takes in the tongue and the wings
    assert.ok(stageRegionFor(p).y1 >= 1 + 1.25);
    const w = M.spSetStageShape(r, { shape: 'wings', wingWidth: 6 });
    assert.ok(stageRegionFor(w).x0 <= -0.25 && stageRegionFor(w).x1 >= 1.25);
  });

  it('the grid lies inside the shape: inside the circle, on the tongue, in the wings', () => {
    const base = { ...M.spNewProject({ id: 'r', now: NOW }).stage, width: 20, depth: 20 };
    const circle = { ...base, shape: 'round' as const };
    const segs = S.spShapeGridSegments(circle, { x: 1 / 20, y: 1 / 20 });
    assert.ok(segs.length > 20);
    for (const [x1, y1, x2, y2] of segs) {
      assert.ok((x1 - 0.5) ** 2 + (y1 - 0.5) ** 2 <= 0.2500001 && (x2 - 0.5) ** 2 + (y2 - 0.5) ** 2 <= 0.2500001, 'each end on or inside the circle');
    }
    const thrust = { ...base, shape: 'thrust' as const, thrustWidth: 8, thrustDepth: 6 };
    assert.ok(S.spShapeGridSegments(thrust, { x: 0.05, y: 0.05 }).some(([, y1, , y2]) => y1 >= 1 && y2 > 1.2), 'lines on the tongue');
    const wings = { ...base, shape: 'wings' as const, wingWidth: 4 };
    assert.ok(S.spShapeGridSegments(wings, { x: 0.05, y: 0.05 }).some(([x1]) => x1 < 0), 'lines in the stage right wing');
    assert.deepEqual(S.spShapeGridSegments(base, { x: 0, y: 0 }), []);
  });

  it('a new object is put inside a round stage, not in a corner of its square', () => {
    const p = M.spSetStageShape(sized(four(), 30, 30), { shape: 'round' });
    for (const at of [{ x: 0.05, y: 0.05 }, { x: 0.95, y: 0.95 }]) {
      const q = stageFreeSpot(p, at, 'wedge');
      assert.ok(S.spInPerformance(q, p.stage), JSON.stringify(q));
    }
  });

  it('UNDO and REDO take the shape back and forward; copies keep it', () => {
    const p = sized(four(), 24, 16);
    let h = spHistoryStart(p);
    h = spHistoryApply(h, M.spSetStageShape(h.present, { shape: 'thrust', thrustWidth: 10, thrustDepth: 8 }));
    assert.equal(h.present.stage.shape, 'thrust');
    h = spHistoryUndo(h);
    assert.equal(h.present.stage.shape, 'rect');
    h = spHistoryRedo(h);
    assert.equal(h.present.stage.thrustDepth, 8);
    for (const kind of ['master', 'gig'] as const) {
      const c = M.spDuplicateProject(h.present, { id: `c-${kind}`, kind, now: NOW });
      assert.equal(c.stage.shape, 'thrust');
      assert.equal(c.stage.thrustWidth, 10);
    }
  });

  it('the packet draws the shape: an outline, its front edges, the wings, its own direction words', () => {
    const t = spPlotDoc(M.spSetStageShape(sized(four(), 24, 16), { shape: 'thrust', thrustWidth: 10, thrustDepth: 8 }));
    assert.equal(t.deck?.shape, 'thrust');
    assert.equal(t.deck?.outline.t, 'poly');
    assert.equal(t.deck?.front.lines.length, 5, 'two front pieces and three sides of the tongue');
    assert.ok(Math.abs(t.depthM - (16 + 8) * 0.3048) < 1e-6, 'the plot takes in the tongue');
    assert.match(t.sizeNote, /thrust 10 ft × 8 ft/);
    assert.ok(t.legend.some((l) => /Thrust stage/.test(l)));
    const r = spPlotDoc(M.spSetStageShape(sized(four(), 30, 30), { shape: 'round', roundRef: 'FOH' }));
    assert.equal(r.deck?.outline.t, 'circle');
    assert.equal(r.deck?.words.down, 'FOH SIDE (AUDIENCE)');
    assert.equal(r.deck?.front.all, true);
    // how to read a round drawing is printed with its size, on the plot's own page
    assert.match(r.sizeNote, /in the round: the FOH side is at the bottom$/);
    const scene = spPlotScene(r, 510);
    assert.ok(scene.ops.some((op) => op.t === 'text' && op.text === 'FAR SIDE (AUDIENCE)'));
    assert.ok(scene.ops.some((op) => op.t === 'circle' && op.sw === 3), 'every side of a round stage is a front edge');
    const w = spPlotDoc(M.spSetStageShape(sized(four(), 24, 16), { shape: 'wings', wingWidth: 6 }));
    assert.deepEqual(w.deck?.areas.map((a) => a.name), ['SR WING', 'SL WING']);
    assert.ok(Math.abs(w.widthM - 36 * 0.3048) < 1e-6);
    assert.ok(spPlotScene(w, 510).ops.some((op) => op.t === 'text' && op.text === 'SL WING'));
    // every item stays inside the drawing it is placed for
    for (const plot of [t, r, w]) for (const i of plot.items) assert.ok(i.at.x >= -plot.marginM && i.at.x <= plot.widthM + plot.marginM, i.label);
  });

  it('the text view says positions in the shape’s words, and keeps “FOH” whole', () => {
    const p = M.spSetStageShape(sized(four(), 30, 30), { shape: 'round', roundRef: 'FOH' });
    const text = spDocText(spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'full' }, NOW)));
    assert.match(text, /the FOH side, center/);
    assert.doesNotMatch(text, /fOH/);
    assert.match(text, /said from the FOH side/);
  });

  it('every shape and paper makes a PDF that opens as one', () => {
    for (const shape of ['thrust', 'round', 'wings'] as const) {
      const p = M.spSetStageShape(sized(four(), 24, 16), { shape });
      for (const paper of ['letter', 'a4'] as const) {
        const bytes = spPdfBytes(spBuildDoc(spBuildSnapshot(p, { paper, packet: 'full' }, NOW)));
        const head = new TextDecoder('latin1').decode(bytes.slice(0, 8));
        assert.match(head, /^%PDF-1\./);
        assert.match(new TextDecoder('latin1').decode(bytes.slice(-8)), /%%EOF/);
      }
    }
  });

  it('Setup offers the shape next to the size, with one plain line for each', () => {
    const setup = read('src/screens/lab/stageplot/SetupArea.tsx');
    assert.match(setup, /label="Shape of the stage"/);
    assert.match(setup, /SP_SHAPES\.map\(\(s\) =>/);
    assert.match(setup, /SP_SHAPE_HINT\[s\]/);
    assert.match(setup, /label="Thrust width"/);
    assert.match(setup, /label="Width of each wing"/);
    assert.match(setup, /label="Name of the side at the bottom"/);
    assert.match(setup, /front of house, where the sound engineer mixes/);
    assert.match(setup, /label="Diameter"/);
    for (const s of S.SP_SHAPES) assert.ok(S.SP_SHAPE_HINT[s].length <= 140 && !/\n/.test(S.SP_SHAPE_HINT[s]), s);
    // the real-world guidance is in the guide and the help, in the student's voice
    assert.match(setup, /in-ear monitors are much more common/);
    const plan = read('src/screens/lab/stageplot/stage/StagePlanView.tsx');
    assert.match(plan, /<ShapeDeck p=\{p\} T=\{T\} grid=\{shapeGrid\} \/>/);
  });
});

/* ── stage boxes ────────────────────────────────────────────────────────── */

describe('stage boxes: the model', () => {
  it('a box is SB1, SB2…, 16 sockets unless told, and has its own symbol on the stage', () => {
    const a = M.spAddBox(four());
    const b = M.spAddBox(a.p);
    assert.deepEqual(M.spBoxes(b.p).map((x) => [x.name, x.inputs, x.returns, x.supplier]), [
      ['SB1', 16, null, 'tbc'],
      ['SB2', 16, null, 'tbc'],
    ]);
    const o = M.spObject(b.p, b.objectId) as SpProject['objects'][number];
    assert.equal(o.kind, 'stage-box');
    assert.equal(o.boxId, b.id);
    assert.equal(o.label, 'SB2');
    // renaming the box renames its symbol; a typed size is held to a real number of sockets
    const r = M.spUpdateBox(b.p, b.id, { name: 'Drum sub', inputs: 500 });
    assert.equal((M.spObject(r, b.objectId) as SpProject['objects'][number]).label, 'Drum sub');
    assert.equal(M.spBox(r, b.id)?.inputs, M.SP_BOX_MAX);
    assert.deepEqual(M.SP_BOX_SIZES, [8, 12, 16, 24, 32, 48]);
  });

  it('a stage with wings puts a new box in a wing', () => {
    const p = M.spSetStageShape(sized(four(), 24, 16), { shape: 'wings', wingWidth: 6 });
    const r = M.spAddBox(p);
    assert.equal(S.spInWing(M.spObject(r.p, r.objectId) as SpProject['objects'][number], r.p.stage), 'left');
  });

  it('AUTO-ASSIGN: channel order, the nearest box, a stereo pair side by side', () => {
    let p = sized(four(), 24, 16);
    // SB1 by the drums (upstage center), SB2 by the keyboard (stage left)
    p = M.spAddBox(p, { name: 'SB1', inputs: 8, at: { x: 0.5, y: 0.1 } }).p;
    p = M.spAddBox(p, { name: 'SB2', inputs: 8, at: { x: 0.95, y: 0.55 } }).p;
    const r = M.spAutoAssignBoxes(p);
    assert.equal(r.left, 0);
    const at = (label: string) => M.spBoxPatchWords(r.p, r.p.inputs.find((i) => i.label === label) as SpProject['inputs'][number]);
    // the drums, channels 1–6, fill SB1 1–6 in channel order
    const drums = spPatchRows(r.p, 'house').slice(0, 6).map((x) => M.spBoxPatchWords(r.p, x.input));
    assert.deepEqual(drums, ['SB1 · 1', 'SB1 · 2', 'SB1 · 3', 'SB1 · 4', 'SB1 · 5', 'SB1 · 6']);
    // the keyboard's pair is on the box nearest the keyboard, side by side, L first
    const keys = r.p.inputs.filter((i) => i.pairId && /Keys/.test(i.label));
    assert.equal(keys.length, 2);
    const kl = keys.find((i) => i.side === 'L')?.box;
    const kr = keys.find((i) => i.side === 'R')?.box;
    assert.ok(kl && kr && kl.boxId === kr.boxId && kr.socket === kl.socket + 1);
    assert.equal(M.spBox(r.p, kl?.boxId)?.name, 'SB2');
    assert.ok(at('Nina vocal').startsWith('SB2'), 'Nina sings by the keyboard');
    assert.ok(r.p.inputs.every((i) => i.box && !i.box.byHand));
    // no socket twice
    for (const u of spBoxUse(r.p)) assert.deepEqual(u.doubled, []);
  });

  it('AUTO-ASSIGN never moves a socket chosen by hand, leaves "console direct" alone, and UNDO puts it all back', () => {
    let p = M.spAddBox(sized(four(), 24, 16), { name: 'SB1', inputs: 16, at: { x: 0.5, y: 0.1 } }).p;
    const sb1 = M.spBoxes(p)[0].id;
    const click = p.inputs.find((i) => i.label === 'Click') as SpProject['inputs'][number];
    const kick = spPatchRows(p, 'house')[0].input;
    p = M.spAssignBox(p, kick.id, { boxId: sb1, socket: 16 });
    p = M.spSetDirect(p, click.id, true);
    let h = spHistoryStart(p);
    h = spHistoryApply(h, M.spAutoAssignBoxes(h.present).p);
    const q = h.present;
    assert.deepEqual(q.inputs.find((i) => i.id === kick.id)?.box, { boxId: sb1, socket: 16, byHand: true });
    assert.equal(q.inputs.find((i) => i.id === click.id)?.box, null);
    assert.equal(q.inputs.find((i) => i.id === click.id)?.direct, true);
    assert.ok(!q.inputs.some((i) => i.id !== kick.id && i.box?.socket === 16), 'nobody else on the hand-chosen socket');
    // a second press gives the same answer
    assert.deepEqual(M.spAutoAssignBoxes(q).p.inputs.map((i) => i.box), q.inputs.map((i) => i.box));
    h = spHistoryUndo(h);
    assert.ok(h.present.inputs.filter((i) => i.id !== kick.id).every((i) => i.box === null));
  });

  it('a wireless input plugs in at its receiver rack: by the rack when one is drawn, otherwise left for the band', () => {
    let p = M.spAddBox(sized(four(), 24, 16), { name: 'SB1', inputs: 16, at: { x: 0.5, y: 0.75 } }).p;
    p = M.spAddBox(p, { name: 'SB2', inputs: 16, at: { x: 0.05, y: 0.05 } }).p;
    const vocal = p.inputs.find((i) => i.label === 'Lead vocal') as SpProject['inputs'][number];
    p = M.spUpdateInput(p, vocal.id, { capture: 'wireless' });
    const none = M.spAutoAssignBoxes(p);
    assert.equal(none.wireless, 1);
    assert.equal(none.p.inputs.find((i) => i.id === vocal.id)?.box, null, 'no rack drawn: not plugged in at the singer');
    assert.equal(none.left, 0, 'a wireless input left for the band is not counted as "every box is full"');
    p = M.spAddObject(p, 'rack', { x: 0.08, y: 0.1 }).p;
    const racked = M.spAutoAssignBoxes(p);
    assert.equal(racked.wireless, 0);
    assert.equal(M.spBox(racked.p, racked.p.inputs.find((i) => i.id === vocal.id)?.box?.boxId)?.name, 'SB2', 'the box by the rack, not the one by the singer');
  });

  it('where two boxes are about as near, a section stays on the box that already holds it', () => {
    // two boxes the same distance from the drum kit: the kit's six inputs stay together
    let p = sized(four(), 24, 16);
    const kit = p.objects.find((o) => o.kind === 'drum-kit') as SpProject['objects'][number];
    p = M.spAddBox(p, { name: 'SB1', inputs: 16, at: { x: kit.x - 0.2, y: kit.y } }).p;
    p = M.spAddBox(p, { name: 'SB2', inputs: 16, at: { x: kit.x + 0.2, y: kit.y } }).p;
    const r = M.spAutoAssignBoxes(p).p;
    const drums = spPatchRows(r, 'house').slice(0, 6).map((x) => x.input.box?.boxId);
    assert.equal(new Set(drums).size, 1, 'one box for the whole kit');
  });

  it('a full box: AUTO-ASSIGN says how many are left with no socket', () => {
    const p = M.spAddBox(salsa(), { name: 'SB1', inputs: 8 }).p;
    const r = M.spAutoAssignBoxes(p);
    assert.equal(r.placed, 8);
    assert.equal(r.left, p.inputs.length - 8);
  });

  it('removing a box takes its symbol off the stage and its sockets off the inputs; a restored stereo side never copies a socket', () => {
    let p = M.spAutoAssignBoxes(M.spAddBox(four()).p).p;
    const id = M.spBoxes(p)[0].id;
    const gone = M.spRemoveBox(p, id);
    assert.equal(gone.objects.some((o) => o.boxId === id || o.kind === 'stage-box'), false);
    assert.ok(gone.inputs.every((i) => i.box === null));
    assert.deepEqual(M.spBrokenRefs(gone), []);
    // pair restore
    const left = p.inputs.find((i) => i.side === 'L') as SpProject['inputs'][number];
    const right = p.inputs.find((i) => i.pairId === left.pairId && i.side === 'R') as SpProject['inputs'][number];
    p = M.spRemoveInput(p, right.id);
    const back = M.spPairRestore(p, left.id);
    assert.equal(back.p.inputs.find((i) => i.id === back.id)?.box, null);
  });

  it('copies keep their boxes, re-pointed at their own copies', () => {
    const p = M.spAutoAssignBoxes(M.spAddBox(four()).p).p;
    for (const kind of ['master', 'gig'] as const) {
      const c = M.spDuplicateProject(p, { id: `c-${kind}`, kind, now: NOW });
      assert.equal(c.boxes.length, 1);
      assert.equal(c.boxes[0].name, p.boxes[0].name);
      assert.ok(c.inputs.every((i) => !i.box || i.box.boxId === c.boxes[0].id));
      assert.equal(c.inputs.filter((i) => i.box).length, p.inputs.filter((i) => i.box).length);
      assert.equal(c.objects.find((o) => o.kind === 'stage-box')?.boxId, c.boxes[0].id);
      assert.deepEqual(M.spBrokenRefs(c), []);
    }
  });

  it('a duplicated box symbol is only a drawing', () => {
    const r = M.spAddBox(four());
    const d = M.spDuplicateObject(r.p, r.objectId);
    const copy = M.spObject(d.p, d.ids[0]) as SpProject['objects'][number];
    assert.equal(copy.boxId, null);
    assert.equal(copy.label, 'SB1 (copy)');
  });
});

describe('stage boxes: the review (four questions, each with GO TO)', () => {
  const base = () => M.spAddBox(sized(four(), 24, 16), { name: 'SB1', inputs: 8 });

  it('no box, no question', () => {
    const p = four();
    for (const r of ['box-socket-twice', 'box-over-capacity', 'box-none', 'box-empty']) assert.equal(rule(p, r).length, 0, r);
  });

  it('a box with nothing plugged in is a question', () => {
    const p = base().p;
    const q = rule(p, 'box-empty');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'ask');
    assert.deepEqual(q[0].target, { kind: 'box', id: M.spBoxes(p)[0].id });
    // (GO TO only: AUTO-ASSIGN could leave it empty and say nothing)
    assert.deepEqual(q[0].actions, ['edit']);
  });

  it('a stage box, a rack or an in-ear transmitter beside the stage is not asked about; a microphone there is', () => {
    let p = M.spSetStageShape(sized(four(), 30, 30), { shape: 'round' });
    const tx = p.objects.find((o) => o.label === 'In-ear transmitter') as SpProject['objects'][number];
    assert.ok(!S.spInPerformance(tx, p.stage), 'the example’s transmitter stands outside the circle');
    assert.equal(rule(p, 'object-offstage').length, 0);
    p = M.spAddBox(p, { at: { x: 1.1, y: 0.5 } }).p;
    p = M.spAddObject(p, 'rack', { x: -0.1, y: 0.5 }).p;
    assert.equal(rule(p, 'object-offstage').length, 0);
    const mic = p.objects.find((o) => o.label === 'Lead vocal') as SpProject['objects'][number];
    p = M.spMoveObject(p, mic.id, { x: 1.1, y: 0.9 }, { snap: false });
    assert.equal(rule(p, 'object-offstage').length, 1);
  });

  it('a long list of inputs with no socket is cut to six names and a count', () => {
    const p = M.spAddBox(salsa(), { inputs: 8 }).p;
    const q = rule(p, 'box-none')[0];
    assert.match(q.text, /and \d+ more\)/);
  });

  it('inputs with no socket while boxes exist: ONE question, not an error, answered by AUTO-ASSIGN or GO TO', () => {
    const p = base().p;
    const q = rule(p, 'box-none');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'ask');
    assert.deepEqual(q[0].actions, ['box-auto', 'edit']);
    assert.equal(q[0].field, 'box');
    assert.match(q[0].text, /go to the console directly/);
    assert.equal(spIssueActionLabel('box-auto'), 'AUTO-ASSIGN SOCKETS');
    // the answer, run as the screen runs it
    let cur = p;
    runIssueAction({ project: cur, apply: (f) => (cur = f(cur)), goTo: () => undefined }, q[0], 'box-auto');
    assert.ok(cur.inputs.filter((i) => i.box).length === 8);
    // every input direct: the question is answered
    let d = p;
    for (const i of d.inputs) d = M.spSetDirect(d, i.id, true);
    assert.equal(rule(d, 'box-none').length, 0);
  });

  it('a socket used twice, and an input past the box’s size, must be corrected', () => {
    let p = base().p;
    const sb = M.spBoxes(p)[0].id;
    const [a, b, c] = spPatchRows(p, 'house').map((x) => x.input);
    p = M.spAssignBox(p, a.id, { boxId: sb, socket: 3 });
    p = M.spAssignBox(p, b.id, { boxId: sb, socket: 3 });
    p = M.spAssignBox(p, c.id, { boxId: sb, socket: 8 });
    const twice = rule(p, 'box-socket-twice');
    assert.equal(twice.length, 1);
    assert.equal(twice[0].level, 'block');
    assert.match(twice[0].text, /SB1 socket 3 is given to/);
    assert.deepEqual(spSameSocket(p, a.id), [b.label]);
    // the box made smaller: the input on socket 8 is past it
    p = M.spUpdateBox(p, sb, { inputs: 6 });
    const over = rule(p, 'box-over-capacity');
    assert.equal(over.length, 1);
    assert.equal(over[0].level, 'block');
    assert.match(over[0].text, /SB1 has 6 input sockets/);
    assert.equal(spReview(p).some((i) => i.level === 'block'), true, 'not Ready until corrected');
  });

  it('the credit rules are unchanged: the guided steps are the same five', () => {
    const p = M.spAutoAssignBoxes(M.spAddBox(four()).p).p;
    assert.deepEqual(spGuidedSteps(p, false).map((s) => s.id), ['performers', 'sources', 'monitors', 'review', 'export']);
    assert.equal(p.startedBlank, four().startedBlank);
  });
});

describe('stage boxes: where they show', () => {
  it('the input list gets a "Box · socket" column only when the plot has boxes', () => {
    const doc = (p: SpProject) => spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'full' }, NOW));
    const table = (p: SpProject) => {
      const s = doc(p).sections.find((x) => x.id === 'inputs');
      const b = s?.blocks.find((x) => x.t === 'table');
      return b && b.t === 'table' ? b.table : null;
    };
    assert.equal(table(four())?.columns.some((c) => c.key === 'box'), false);
    let p = M.spAutoAssignBoxes(M.spAddBox(four(), { name: 'SB2', inputs: 12 }).p).p;
    const click = p.inputs.find((i) => i.label === 'Click') as SpProject['inputs'][number];
    p = M.spSetDirect(p, click.id, true);
    const t = table(p);
    assert.equal(t?.columns[1].label, 'Box · socket');
    assert.equal(t?.rows[0].cells.box, 'SB2 · 1');
    assert.ok(t?.rows.some((r) => r.cells.box === 'Console direct'));
    // the patch summary
    const s = doc(p).sections.find((x) => x.id === 'inputs');
    assert.ok(s?.blocks.some((b) => b.t === 'heading' && b.text === 'Stage boxes'));
    const list = s?.blocks.find((b) => b.t === 'list' && b.items.some((x) => x.startsWith('SB2 (12 inputs)')));
    assert.ok(list && list.t === 'list');
    assert.match(list.items[0], /sockets 1–\d+ used, \d+ free/);
    assert.match(spTextSummary(p), /Stage boxes: SB2 \(12 inputs\): sockets/);
    assert.match(spDocText(doc(p)), /Plugged in at the console directly, not through a stage box: Click\./);
  });

  it('the stage drawing and the plot print each box’s name', () => {
    const r = M.spAddBox(four(), { name: 'SB1' });
    const plot = spPlotDoc(r.p);
    assert.ok(plot.items.some((i) => i.label === 'SB1'));
    assert.ok(plot.key.some((k) => k.kind === 'stage-box'));
  });

  it('a row and the editor say the socket; the box editor lists its sockets', () => {
    let p = M.spAutoAssignBoxes(M.spAddBox(four(), { name: 'SB1', inputs: 8 }).p).p;
    const row = spPatchRows(p, 'house')[0];
    assert.equal(spRowView(p, row).box, 'SB1 · 1');
    assert.match(spRowView(p, row).a11y, /Stage box SB1, socket 1/);
    assert.equal(spRowBoxWords(four(), four().inputs[0]), '', 'no box, no words');
    const sb = M.spBoxes(p)[0].id;
    assert.equal(spBoxSocketLines(p, sb)[0], `1 · ${row.input.label}`);
    assert.equal(spBoxFreeSocket(p, sb), null, '8 inputs fill an 8-socket box');
    p = M.spUpdateBox(p, sb, { inputs: 12 });
    assert.equal(spBoxFreeSocket(p, sb), 9);
    assert.match(spBoxSocketLines(p, sb).at(-1) ?? '', /^Free: 9–12$/);
    assert.match(spBoxLine(spBoxUse(p)[0]), /^SB1 \(12 inputs\): sockets 1–8 used, 4 free$/);
  });

  it('the Stage area places a box that has no symbol, and lists it until then', () => {
    let p = M.spAddBox(four(), { place: false }).p;
    const id = M.spBoxes(p)[0].id;
    assert.ok(stageUnplaced(p).some((u) => u.kind === 'box' && u.id === id));
    const r = stagePlace(p, { kind: 'box', id }, { x: 0.5, y: 0.7 });
    assert.ok(r);
    p = (r as NonNullable<typeof r>).p;
    assert.equal(M.spBoxObject(p, id)?.kind, 'stage-box');
    assert.ok(!stageUnplaced(p).some((u) => u.kind === 'box'));
  });

  it('the screens: ADD from the palette makes a numbered box; Inputs has STAGE BOXES and AUTO-ASSIGN; the editor has the socket', () => {
    const palette = read('src/screens/lab/stageplot/stage/StagePalette.tsx');
    assert.match(palette, /if \(item\.kind === 'stage-box'\) \{\s*done\(item\.kind, item\.name, \(q, at\) => \{/);
    assert.match(palette, /const r = spAddBox\(q, inWing \? \{\} : \{ at \}\);\s*return \{ p: r\.p, id: r\.objectId \};/);
    const panel = read('src/screens/lab/stageplot/inputs/BoxPanel.tsx');
    for (const w of ['title="STAGE BOXES"', 'label="ADD A STAGE BOX"', 'label="AUTO-ASSIGN SOCKETS"', 'label="REMOVE THIS STAGE BOX"']) assert.ok(panel.includes(w), w);
    assert.doesNotMatch(panel, /Alert\.alert/);
    const editor = read('src/screens/lab/stageplot/inputs/InputEditor.tsx');
    assert.match(editor, /<FocusMark k="box">/);
    assert.match(editor, /label="Stage box"/);
    assert.match(editor, /Console direct: no stage box/);
    const area = read('src/screens/lab/stageplot/InputsArea.tsx');
    assert.match(area, /<BoxPanel /);
    assert.match(area, /else if \(t\.kind === 'box' && t\.id\) openBox\(t\.id\);/);
    const inspector = read('src/screens/lab/stageplot/stage/StageInspector.tsx');
    assert.match(inspector, /label="MAKE IT A NUMBERED STAGE BOX"/);
  });
});
