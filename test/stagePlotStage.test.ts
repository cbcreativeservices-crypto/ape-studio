/**
 * Stage Plot and Channel Designer — the STAGE area (must-do D60), proven with
 * no device: the pure geometry between the stage and the glass
 * (stage/stageGeom.ts), what a stage object is in the one model
 * (stage/stageLinks.ts), and the few facts of the screen files that a node
 * test can hold (the fixed orientation, one edit per drag, no popup in a
 * tray, the screen guide).
 *
 * What a band relies on, and what is checked:
 *   • the plot is never mirrored: stage right is on the viewer's left and the
 *     audience is at the bottom, at every stage shape and zoom;
 *   • a finger lands on the object under it, at 1× and in FULL SCREEN, and a
 *     small symbol can be grabbed from 22 points away;
 *   • the object under the finger is drawn where the saved one will be (the
 *     view's snap is the model's snap), and a drag is ONE undo step;
 *   • a name is never cut and never leaves the picture, and names keep off
 *     each other;
 *   • a symbol never adds an input by itself.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { SCREEN_GUIDE_BUDGET, SCREEN_GUIDE_SECTIONS, SCREEN_INTRO_WORDS, type ScreenGuide } from '../src/features/lab/screenGuide/types.ts';
import { SP_PACKAGES, SP_PALETTE } from '../src/features/stageplot/spCatalog.ts';
import { spHistoryApply, spHistoryStart, spHistoryUndo } from '../src/features/stageplot/spHistory.ts';
import { spAddObject, spGridStep, spGroup, spInputLocation, spMoveObject, spNewProject, spObject, spRemoveObjects, spStageAspect, spUpdateObject } from '../src/features/stageplot/spModel.ts';
import { spmAddDevice } from '../src/screens/lab/stageplot/monitors/monitorPlan.ts';
import { spReview } from '../src/features/stageplot/spReview.ts';
import { spKeyKind, spKeyRot, spKeySymbol, spPlacedShapes, spPlotKey } from '../src/features/stageplot/spSymbols.ts';
import { spFromTemplate, type SpTemplateId } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';
import { touchToGlass } from '../src/screens/lab/roomdesign/planGeom.ts';
import { SP_GUIDE_STAGE } from '../src/screens/lab/stageplot/guides/stage.ts';
import {
  STAGE_BADGE_FS,
  STAGE_FRAME,
  STAGE_KEY_ART,
  STAGE_KEY_CHAR_W,
  STAGE_KEY_EMPTY,
  STAGE_KEY_FS,
  STAGE_MIN_REACH,
  STAGE_NAME_FS,
  STAGE_PERSON_FS,
  STAGE_VIEW_FIT,
  STAGE_ZOOM_MAX,
  stageBoxBounds,
  stageArtSize,
  stageAxisWords,
  stageBoxDistance,
  stageDrawOrder,
  stageFacingPoint,
  stageFacingShort,
  stageFacingWord,
  stageFillZoom,
  stageNaturalHeight,
  stageFrameBoxes,
  stageGlassWidthGuess,
  stageGridLines,
  stageHit,
  stageKeyLayout,
  stageKeyScale,
  stageKeyWords,
  stageLabelClash,
  stageLabelLeader,
  stageLabelPlan,
  stageLabels,
  stageLivePositions,
  stageNameLines,
  stageObjectBox,
  stagePan,
  stagePosFraction,
  stagePosUnit,
  stagePosValue,
  stagePosWords,
  stageRegion,
  stageResizeHandle,
  stageResizeTo,
  stageScaleNote,
  stageSizeFraction,
  stageSnapPoint,
  stageSymbolScale,
  stageTransform,
  stageTransformFor,
  stageZoomTo,
  type StageLabelIn,
  type StageObjBox,
} from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import {
  STAGE_NEW_SPOT,
  STAGE_PACKAGES,
  stageAddDrawing,
  stageAddLinked,
  stageAddPerformer,
  stageAddWithDevice,
  stageAddWithPackage,
  stageBadges,
  stageCompressBadges,
  stageDefaultRot,
  stageDeviceChoices,
  stageFreeSpot,
  stageInputChoices,
  stageKeyEntries,
  stageKindForSource,
  stageLinkMode,
  stageListOrder,
  stageMoveExact,
  stageName,
  stageNudge,
  stageObjectKindName,
  stagePackagesFor,
  stagePlace,
  stageSelectedObjectId,
  stageSourceChoices,
  stageUnplaced,
} from '../src/screens/lab/stageplot/stage/stageLinks.ts';

const ROOT = process.cwd();
const SP = 'src/screens/lab/stageplot';
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const NOW = 1_800_000_000_000;
const tpl = (id: SpTemplateId): SpProject => spFromTemplate(id, { id: `p-${id}`, now: NOW, band: 'The Example' });
const blank = (stage: Partial<SpProject['stage']> = {}): SpProject => {
  const p = spNewProject({ id: 'p-blank', now: NOW });
  return { ...p, stage: { ...p.stage, ...stage } };
};
/** The glass a 390-wide phone gives the stage (the rack's side padding off). */
const PHONE = { gw: 366, gh: 250 };
const PHONE_TALL = { gw: 366, gh: 300 };
const TEMPLATES: SpTemplateId[] = ['solo', 'duo', 'four-piece', 'playback', 'salsa'];
const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

function labelItems(p: SpProject, gw: number, gh: number, zoom = 1): { items: StageLabelIn[]; boxes: StageObjBox[] } {
  const T = stageTransformFor(p, gw, gh, { ...STAGE_VIEW_FIT, zoom });
  const order = stageDrawOrder(p.objects);
  const boxes = order.map((o) => stageObjectBox(p, o, T));
  return { boxes, items: order.map((o, i) => ({ id: o.id, text: stageName(p, o), badges: stageBadges(p, o), box: boxes[i], person: o.kind === 'performer' })) };
}
const frameOf = (gw: number, gh: number) => {
  const f = stageFrameBoxes(gw, gh);
  return [f.top, f.bottom, f.left, f.right];
};

describe('the stage on the glass: one fixed view, at every shape and zoom', () => {
  const SHAPES = [0.6, 1, 1.6, 2.5, 4];
  const GLASS = [PHONE, PHONE_TALL, { gw: 700, gh: 420 }, { gw: 250, gh: 366 }];
  const ZOOMS = [1, 1.5, 2, STAGE_ZOOM_MAX];

  it('a stage position goes to the glass and back to the same place', () => {
    for (const aspect of SHAPES)
      for (const g of GLASS)
        for (const zoom of ZOOMS) {
          const T = stageTransform(aspect, g.gw, g.gh, stageRegion([]), { zoom, cx: 0.3, cy: 0.7 });
          for (const pt of [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0.37, y: 0.81 }, { x: -0.2, y: 1.2 }]) {
            const back = T.toFrac(T.toGlass(pt));
            near(back.x, pt.x, 1e-9);
            near(back.y, pt.y, 1e-9);
          }
          // the deck keeps the stage's own shape
          near(T.kx / T.ky, aspect, 1e-9);
        }
  });

  it('is never mirrored: stage right is on the viewer’s left, the audience at the bottom', () => {
    for (const aspect of SHAPES)
      for (const g of GLASS)
        for (const zoom of ZOOMS) {
          const T = stageTransform(aspect, g.gw, g.gh, stageRegion([]), { zoom, cx: 0.5, cy: 0.5 });
          assert.ok(T.toGlass({ x: 0, y: 0.5 }).x < T.toGlass({ x: 1, y: 0.5 }).x, 'x = 0 (stage right) is left of x = 1');
          assert.ok(T.toGlass({ x: 0.5, y: 0 }).y < T.toGlass({ x: 0.5, y: 1 }).y, 'y = 1 (downstage) is below y = 0');
        }
  });

  it('at the whole-stage zoom, the stage and everything standing off it are inside the frame', () => {
    for (const aspect of SHAPES)
      for (const g of GLASS) {
        const region = stageRegion([{ x: -0.2, y: 0.4 }, { x: 0.5, y: 1.22 }]);
        const T = stageTransform(aspect, g.gw, g.gh, region);
        for (const pt of [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: -0.2, y: 0.4 }, { x: 0.5, y: 1.22 }]) {
          const q = T.toGlass(pt);
          assert.ok(q.x >= STAGE_FRAME.side - 1e-6 && q.x <= g.gw - STAGE_FRAME.side + 1e-6, `x ${q.x} inside the frame`);
          assert.ok(q.y >= STAGE_FRAME.top - 1e-6 && q.y <= g.gh - STAGE_FRAME.bottom + 1e-6, `y ${q.y} inside the frame`);
        }
      }
  });

  it('an object outside the stage widens the picture; one that is far away never pushes the stage out of reach', () => {
    const base = stageRegion([]);
    const wide = stageRegion([{ x: 1.2, y: 0.5 }]);
    assert.ok(wide.x1 > base.x1 && wide.x0 === base.x0);
    const wild = stageRegion([{ x: 40, y: -40 }, { x: Number.NaN, y: 0 }]);
    assert.ok(wild.x1 <= 1.34 && wild.y0 >= -0.34, 'held at the model’s own reach');
  });

  it('zoomed in, the picture slides with the finger and stops at the edge of what there is to see', () => {
    const region = stageRegion([]);
    const T = stageTransform(1.6, PHONE.gw, PHONE.gh, region, { zoom: 2, cx: 0.5, cy: 0.5 });
    const before = T.toGlass({ x: 0.5, y: 0.5 });
    // the finger travels 40 to the right and 10 down: the stage follows it
    const v = stagePan({ zoom: 2, cx: 0.5, cy: 0.5 }, T, 40, 10);
    const T2 = stageTransform(1.6, PHONE.gw, PHONE.gh, region, v);
    const after = T2.toGlass({ x: 0.5, y: 0.5 });
    near(after.x - before.x, 40, 1e-6);
    near(after.y - before.y, 10, 1e-6);
    // a very long drag stops with the region's edge at the frame, not beyond
    const far = stagePan({ zoom: 2, cx: 0.5, cy: 0.5 }, T, 5000, 5000);
    const T3 = stageTransform(1.6, PHONE.gw, PHONE.gh, region, far);
    near(T3.toGlass({ x: region.x0, y: region.y0 }).x, T3.inner.x0, 1e-6);
    // at the whole stage there is nothing to slide
    const T1 = stageTransform(1.6, PHONE.gw, PHONE.gh, region);
    assert.deepEqual(stagePan(STAGE_VIEW_FIT, T1, 80, 80), STAGE_VIEW_FIT);
  });

  it('zooming in from the whole stage centers on the selected object; already zoomed, it keeps the place', () => {
    assert.deepEqual(stageZoomTo(STAGE_VIEW_FIT, 2, { x: 0.8, y: 0.2 }), { zoom: 2, cx: 0.8, cy: 0.2 });
    assert.deepEqual(stageZoomTo({ zoom: 2, cx: 0.3, cy: 0.3 }, 3, { x: 0.8, y: 0.2 }), { zoom: 3, cx: 0.3, cy: 0.3 });
    assert.deepEqual(stageZoomTo({ zoom: 3, cx: 0.3, cy: 0.3 }, 1, null), STAGE_VIEW_FIT);
    assert.equal(stageZoomTo(STAGE_VIEW_FIT, 99, null).zoom, STAGE_ZOOM_MAX);
  });

  it('the fit does not change while an object is dragged, and FULL SCREEN is given no shape that could cut the stage', () => {
    const p = tpl('four-piece');
    const before = JSON.stringify(stageRegion(p.objects));
    // the live position of a drag is not in the project, so the region (and
    // the fit) is the same on every frame of the drag
    stageLivePositions(p, p.objects[0].id, { x: 1.2, y: 1.2 });
    assert.equal(JSON.stringify(stageRegion(p.objects)), before);
    // The drawing reports no aspect to the shared full-screen view: it takes
    // the whole body and fits the stage into it, so 1× is always the whole
    // stage and there is no FIT step (visual review: FIT cut the stage's sides).
    const plan = code(`${SP}/stage/StagePlanView.tsx`);
    assert.doesNotMatch(plan, /StageAspectReport|\.aspect\(/);
    // in a tall full-screen body the whole stage is still inside the frame
    const T = stageTransformFor(p, 366, 560);
    for (const pt of [{ x: 0, y: 0 }, { x: 1, y: 1 }]) {
      const q = T.toGlass(pt);
      assert.ok(q.x >= STAGE_FRAME.side && q.x <= 366 - STAGE_FRAME.side && q.y >= STAGE_FRAME.top && q.y <= 560 - STAGE_FRAME.bottom);
    }
  });
});

describe('the finger and the object under it', () => {
  const p = tpl('four-piece');
  const T = stageTransformFor(p, PHONE.gw, PHONE.gh);
  const order = stageDrawOrder(p.objects);
  const boxes = order.map((o) => stageObjectBox(p, o, T));
  const boxOf = (id: string) => boxes.find((b) => b.id === id) as StageObjBox;

  it('a touch on an object’s center finds that object or one painted over it there: at 1× and in FULL SCREEN', () => {
    for (const scale of [1, 2, 3]) {
      for (const b of boxes) {
        // FULL SCREEN paints the same glass units `scale` times larger; the
        // touch arrives in box pixels and is divided by the same scale
        const g = touchToGlass(b.cx * scale, b.cy * scale, scale);
        const hit = stageHit(boxes, g.x, g.y);
        assert.ok(hit, 'something is under the finger');
        assert.equal(stageBoxDistance(boxOf(hit as string), g.x, g.y) <= STAGE_MIN_REACH, true);
        // told which SYMBOL is selected, the finger takes that one (a selected
        // platform still yields to a symbol the finger is directly on)
        if (!b.sized) assert.equal(stageHit(boxes, g.x, g.y, { selectedId: b.id }), b.id);
      }
    }
  });

  it('platforms are painted first, so what stands on a riser is on top of it', () => {
    const riser = order.findIndex((o) => o.kind === 'riser');
    const kit = order.findIndex((o) => o.kind === 'drum-kit');
    assert.ok(riser >= 0 && kit > riser, 'the riser is painted before the kit');
    const k = boxes[kit];
    assert.equal(order.find((o) => o.id === stageHit(boxes, k.cx + k.hw - 2, k.cy + k.hh - 2))?.kind, 'drum-kit', 'a finger on the kit takes the kit, not the riser under it');
  });

  it('the topmost of two symbols under one finger wins; the selected one wins over it', () => {
    let q = blank();
    const a = spAddObject(q, 'guitar-amp', { x: 0.5, y: 0.5 });
    const b = spAddObject(a.p, 'bass-amp', { x: 0.5, y: 0.5 });
    q = b.p;
    const Tq = stageTransformFor(q, PHONE.gw, PHONE.gh);
    const bx = stageDrawOrder(q.objects).map((o) => stageObjectBox(q, o, Tq));
    const c = Tq.toGlass({ x: 0.5, y: 0.5 });
    assert.equal(stageHit(bx, c.x, c.y), b.id, 'the one added last is on top');
    assert.equal(stageHit(bx, c.x, c.y, { selectedId: a.id }), a.id, 'what is selected can always be grabbed again');
  });

  it('a small symbol can be grabbed from 22 points away, and no further', () => {
    const r = spAddObject(blank(), 'di', { x: 0.5, y: 0.5 });
    const Tq = stageTransformFor(r.p, PHONE.gw, PHONE.gh);
    const bx = [stageObjectBox(r.p, r.p.objects[0], Tq)];
    const b = bx[0];
    assert.ok(b.hw < STAGE_MIN_REACH && b.hh < STAGE_MIN_REACH, 'a DI box is smaller than a fingertip');
    assert.equal(stageHit(bx, b.cx + 21, b.cy - 21), r.id);
    assert.equal(stageHit(bx, b.cx + 23.5, b.cy), null);
    assert.equal(stageHit(bx, b.cx, b.cy + 23.5), null);
    assert.equal(stageHit([], 10, 10), null, 'the bare stage is nothing');
  });

  it('a microphone standing on a riser wins over the riser from within its reach; the bare riser is still the riser', () => {
    let q = blank();
    const riser = spAddObject(q, 'riser', { x: 0.5, y: 0.5 }, { w: 0.6, h: 0.6 });
    const mic = spAddObject(riser.p, 'mic-stand', { x: 0.5, y: 0.5 });
    q = mic.p;
    const Tq = stageTransformFor(q, PHONE.gw, PHONE.gh);
    const bx = stageDrawOrder(q.objects).map((o) => stageObjectBox(q, o, Tq));
    const m = bx.find((b) => b.id === mic.id) as StageObjBox;
    const rb = bx.find((b) => b.id === riser.id) as StageObjBox;
    assert.equal(stageHit(bx, m.cx + m.hw + 6, m.cy), mic.id, 'a little off the microphone is still the microphone');
    assert.equal(stageHit(bx, rb.cx - rb.hw + 4, rb.cy - rb.hh + 4), riser.id, 'the riser’s far corner is the riser');
    assert.equal(stageHit(bx, m.cx + m.hw + 6, m.cy, { selectedId: riser.id }), riser.id, 'a selected riser is grabbed where no symbol is directly under the finger');
    assert.equal(stageHit(bx, m.cx, m.cy, { selectedId: riser.id }), mic.id, 'a finger ON a symbol takes the symbol');
  });

  it('a turned object is hit where it is drawn, not where it would be unturned', () => {
    const r = spAddObject(blank(), 'keyboard', { x: 0.5, y: 0.5 }, { rot: 90 });
    const Tq = stageTransformFor(r.p, 700, 420);
    const b = stageObjectBox(r.p, r.p.objects[0], Tq);
    assert.ok(b.hw > STAGE_MIN_REACH * 1.2, 'a keyboard is long');
    // turned a quarter, its length runs up and down the page
    assert.equal(stageHit([b], b.cx, b.cy + b.hw - 2), r.id);
    assert.equal(stageHit([b], b.cx + b.hw - 2, b.cy), null);
    const bb = stageBoxBounds(b);
    near(bb.x1 - bb.x0, b.hh * 2, 1e-6);
    near(bb.y1 - bb.y0, b.hw * 2, 1e-6);
  });

  it('a symbol is never drawn smaller than the legibility floor, and a platform is always true to the stage', () => {
    // a 60 ft stage on a phone: a person at true scale would be a dot
    const big = blank({ width: 60, depth: 30, unit: 'ft' });
    const Tb = stageTransformFor(big, PHONE.gw, PHONE.gh);
    assert.ok(Tb.kx / (60 * 0.3048) < 36);
    assert.equal(stageSymbolScale(big, Tb), 36);
    const r = spAddObject(big, 'riser', { x: 0.5, y: 0.5 }, { w: 0.5, h: 0.4 });
    const b = stageObjectBox(r.p, r.p.objects[0], Tb);
    near(b.hw * 2, 0.5 * Tb.kx, 1e-9);
    near(b.hh * 2, 0.4 * Tb.ky, 1e-9);
  });

  it('“facing” means the same on the glass as in the print symbols', () => {
    const r = spAddObject(blank(), 'performer', { x: 0.5, y: 0.5 });
    const Tq = stageTransformFor(r.p, PHONE.gw, PHONE.gh);
    const at = (rot: number) => {
      const b = stageObjectBox(r.p, r.p.objects[0], Tq, { rot });
      const f = stageFacingPoint(b);
      return { dx: f.x - b.cx, dy: f.y - b.cy };
    };
    assert.ok(at(0).dy > 0 && Math.abs(at(0).dx) < 1e-6, '0° faces the audience (down the page)');
    assert.ok(at(180).dy < 0, '180° faces upstage');
    assert.ok(at(90).dx < 0 && Math.abs(at(90).dy) < 1e-6, '90° faces stage right (the viewer’s left)');
    assert.ok(at(270).dx > 0, '270° faces stage left');
    assert.equal(stageFacingWord(0), 'facing the audience');
    assert.equal(stageFacingWord(90), 'facing stage right');
    assert.equal(stageFacingWord(180), 'facing upstage');
    assert.equal(stageFacingWord(270), 'facing stage left');
    assert.equal(stageFacingWord(-90), 'facing stage left');
    // the print symbol of a person carries its facing mark on the same side
    const mark = spPlacedShapes(r.p, { ...r.p.objects[0], x: 0, y: 0, rot: 90 }).find((s) => s.t === 'line');
    assert.ok(mark && mark.t === 'line' && mark.x2 < -0.2 && Math.abs(mark.y2) < 1e-6);
  });
});

describe('a drag is the model’s own move, and one undo step', () => {
  const POINTS = [
    { x: 0.5, y: 0.5 },
    { x: 0.213, y: 0.777 },
    { x: -0.4, y: 0.3 },
    { x: 1.6, y: 1.6 },
    { x: 0.0199, y: 0.9801 },
  ];
  const STAGES: Partial<SpProject['stage']>[] = [{}, { snap: false }, { width: 24, depth: 16, unit: 'ft' }, { width: 8, depth: 5, unit: 'm' }, { width: 20, depth: 12, unit: 'ft', snap: false }];

  it('the object under the finger is drawn exactly where the saved one will be', () => {
    for (const stage of STAGES) {
      const r = spAddObject(blank(stage), 'wedge', { x: 0.5, y: 0.5 });
      for (const to of POINTS) {
        const saved = spObject(spMoveObject(r.p, r.id, to), r.id);
        const shown = stageSnapPoint(r.p, to);
        near(shown.x, saved?.x ?? NaN, 1e-12);
        near(shown.y, saved?.y ?? NaN, 1e-12);
        const live = stageLivePositions(r.p, r.id, to).get(r.id);
        near(live?.x ?? NaN, saved?.x ?? NaN, 1e-12);
      }
    }
  });

  it('a group under the finger keeps its shape, as the model moves it', () => {
    const p = tpl('four-piece');
    const [a, b, c] = p.objects;
    const g = spGroup(p, [a.id, b.id, c.id]);
    const to = { x: 0.31, y: 0.47 };
    const live = stageLivePositions(g, a.id, to);
    const saved = spMoveObject(g, a.id, to);
    assert.equal(live.size, 3);
    for (const id of [a.id, b.id, c.id]) {
      near(live.get(id)?.x ?? NaN, spObject(saved, id)?.x ?? NaN, 1e-12);
      near(live.get(id)?.y ?? NaN, spObject(saved, id)?.y ?? NaN, 1e-12);
    }
    assert.equal(stageLivePositions(g, 'no-such-object', to).size, 0);
  });

  it('thirty frames of a drag and one release are ONE step: UNDO puts the object back where it began', () => {
    const p = tpl('duo');
    const id = p.objects[0].id;
    const start = { x: p.objects[0].x, y: p.objects[0].y };
    let h = spHistoryStart(p);
    // while the finger is down the project is not touched: the moving place
    // is the view's own, read from the same project every frame
    let to = start;
    for (let f = 1; f <= 30; f++) {
      to = { x: start.x + f * 0.004, y: start.y - f * 0.003 };
      assert.ok(stageLivePositions(h.present, id, to).has(id));
      assert.equal(h.past.length, 0, 'no history is made while dragging');
    }
    // release: the one edit
    h = spHistoryApply(h, spMoveObject(h.present, id, to));
    assert.equal(h.past.length, 1);
    assert.notDeepEqual({ x: spObject(h.present, id)?.x, y: spObject(h.present, id)?.y }, start);
    h = spHistoryUndo(h);
    assert.deepEqual({ x: spObject(h.present, id)?.x, y: spObject(h.present, id)?.y }, start);
  });

  it('the view makes its edits only when the finger lets go', () => {
    const src = code(`${SP}/stage/StagePlanView.tsx`);
    const move = src.slice(src.indexOf('onPanResponderMove:'), src.indexOf('onPanResponderRelease:'));
    assert.ok(move.length > 100, 'the move handler was found');
    assert.doesNotMatch(move, /\.onMove\(|\.onResize\(/, 'a moving finger never edits the project');
    const finish = src.slice(src.indexOf('const finish ='), src.indexOf('const pan = useRef'));
    assert.equal((finish.match(/st\.onMove\(/g) ?? []).length, 1);
    assert.equal((finish.match(/st\.onResize\(/g) ?? []).length, 1);
    assert.match(src, /onPanResponderRelease: \(\) => finish\(true\)/);
    assert.match(src, /onPanResponderTerminationRequest: \(\) => false/);
    // and the area turns each of them into exactly one edit through the model
    const area = code(`${SP}/StageArea.tsx`);
    assert.match(area, /onMove=\{\(id, to\) => ed\.apply\(\(q\) => spMoveObject\(q, id, to\)\)\}/);
    assert.match(area, /onResize=\{\(id, size\) => ed\.apply\(\(q\) => spUpdateObject\(q, id, \{ w: size\.w, h: size\.h \}\)\)\}/);
    // the TURN lane previews while the finger rides it and commits once
    assert.match(area, /onCommit: \(v\) => commitTurn\(turnOf\(v\)\)/);
  });

  it('a platform’s corner handle sizes it about its center, in grid steps when snap is on', () => {
    const r = spAddObject(blank(), 'riser', { x: 0.5, y: 0.5 }, { w: 0.3, h: 0.25 });
    const T = stageTransformFor(r.p, 700, 420);
    const b = stageObjectBox(r.p, r.p.objects[0], T);
    const h = stageResizeHandle(b);
    near(h.x, b.cx + b.hw, 1e-9);
    near(h.y, b.cy + b.hh, 1e-9);
    // the handle let go where it is: the size it had (to the grid)
    const same = stageResizeTo(r.p, b, T, h.x, h.y);
    near(same.w, Math.round(0.3 * 24) / 24, 1e-9);
    // dragged out: wider and deeper, never under the smallest size
    const more = stageResizeTo(r.p, b, T, h.x + 60, h.y + 40);
    assert.ok(more.w > 0.3 && more.h > 0.25);
    const tiny = stageResizeTo({ ...r.p, stage: { ...r.p.stage, snap: false } }, b, T, b.cx, b.cy);
    assert.ok(tiny.w >= 0.04 && tiny.h >= 0.04);
  });

  it('a nudge is one step toward the word on its key; a typed position is kept exactly', () => {
    const r = spAddObject(blank({ width: 24, depth: 16, unit: 'ft' }), 'performer', { x: 0.5, y: 0.5 });
    const right = spObject(stageNudge(r.p, r.id, -1, 0), r.id);
    near(right?.x ?? NaN, 0.5 - 1 / 24, 1e-9); // one foot toward stage right
    const down = spObject(stageNudge(r.p, r.id, 0, 1), r.id);
    near(down?.y ?? NaN, 0.5 + 1 / 16, 1e-9); // one foot toward the audience
    // 7.3 ft from stage right is not on the 1 ft grid, and stays 7.3 ft
    const typed = spObject(stageMoveExact(r.p, r.id, { x: stagePosFraction(r.p, 'x', 7.3) as number }), r.id);
    near(stagePosValue(r.p, 'x', typed?.x ?? NaN), 7.3, 1e-9);
    near(typed?.y ?? NaN, 0.5, 1e-12);
  });

  it('typed positions read in the stage’s own unit, or as a percentage when the size is not known', () => {
    const ft = blank({ width: 24, depth: 16, unit: 'ft' });
    assert.equal(stagePosUnit(ft), 'ft');
    assert.equal(stagePosValue(ft, 'x', 0.5), 12);
    assert.equal(stagePosValue(ft, 'y', 0.25), 4);
    near(stagePosFraction(ft, 'y', 4) as number, 0.25);
    const none = blank();
    assert.equal(stagePosUnit(none), '%');
    assert.equal(stagePosValue(none, 'x', 0.5), 50);
    near(stagePosFraction(none, 'x', 80) as number, 0.8);
    assert.equal(stagePosFraction(none, 'x', null), null);
    assert.equal(stagePosFraction(none, 'x', Number.NaN), null);
    near(stagePosFraction(none, 'x', 900) as number, 1.25); // never out of the model’s reach
    near(stageSizeFraction(ft, 'x', 8) as number, 8 / 24);
    assert.equal(stageSizeFraction(ft, 'x', 0), null);
    assert.equal(stageSizeFraction(ft, 'x', -3), null);
  });

  it('moving a symbol moves the stage location the input list shows', () => {
    const p = tpl('four-piece');
    const kit = p.objects.find((o) => o.kind === 'drum-kit');
    const kick = p.inputs.find((i) => i.label === 'Kick');
    assert.ok(kit && kick);
    assert.equal(spInputLocation(p, kick.id), 'Upstage center');
    const moved = spMoveObject(p, kit.id, { x: 0.1, y: 0.9 });
    assert.equal(spInputLocation(moved, kick.id), 'Downstage right');
  });
});

describe('the grid on the stage', () => {
  it('lines are never closer than a finger can read, and all lie on the stage', () => {
    for (const stage of [{}, { width: 24, depth: 16, unit: 'ft' as const }, { width: 60, depth: 40, unit: 'ft' as const }, { width: 8, depth: 5, unit: 'm' as const }]) {
      for (const zoom of [1, 2, 4]) {
        const p = blank(stage);
        const T = stageTransformFor(p, PHONE.gw, PHONE.gh, { zoom, cx: 0.5, cy: 0.5 });
        const g = stageGridLines(p, T);
        assert.ok(g.xs.length > 0 && g.ys.length > 0);
        for (let i = 1; i < g.xs.length; i++) assert.ok(g.xs[i] - g.xs[i - 1] >= 9 - 1e-6, `x gap ${g.xs[i] - g.xs[i - 1]}`);
        for (let i = 1; i < g.ys.length; i++) assert.ok(g.ys[i] - g.ys[i - 1] >= 9 - 1e-6, `y gap ${g.ys[i] - g.ys[i - 1]}`);
        for (const x of g.xs) assert.ok(x > T.ox && x < T.ox + T.kx);
        for (const y of g.ys) assert.ok(y > T.oy && y < T.oy + T.ky);
      }
    }
  });
  it('a 60 ft stage on a phone draws every n-th foot, and says which', () => {
    const p = blank({ width: 60, depth: 40, unit: 'ft' });
    const g = stageGridLines(p, stageTransformFor(p, PHONE.gw, PHONE.gh));
    assert.ok(g.every >= 2);
  });
});

describe('names and numbers on the stage', () => {
  it('every size of text on the picture is at least 9 points on the glass', () => {
    assert.ok(STAGE_NAME_FS >= 9 && STAGE_PERSON_FS >= 9 && STAGE_BADGE_FS >= 9);
    const src = code(`${SP}/stage/StagePlanView.tsx`) + code(`${SP}/stage/stageArt.tsx`);
    for (const m of src.matchAll(/fontSize=\{(\d+(?:\.\d+)?)\}/g)) assert.ok(Number(m[1]) >= 9, `fontSize ${m[1]}`);
  });

  it('a name is never cut: every word of every name is printed, on one line or two', () => {
    assert.deepEqual(stageNameLines('Sam'), ['Sam']);
    assert.deepEqual(stageNameLines('Nina’s headphone amplifier'), ['Nina’s headphone', 'amplifier']);
    assert.deepEqual(stageNameLines('Supercalifragilisticexpialidocious'), ['Supercalifragilisticexpialidocious']);
    // a very long name takes three lines, every word kept, none wider than half of it
    const long = 'Alexandria Montgomery-Fitzgerald of the Northern Mountain Orchestra';
    const three = stageNameLines(long);
    assert.equal(three.length, 3);
    assert.equal(three.join(' '), long);
    for (const line of three) assert.ok(line.length < long.length / 2, line);
    assert.deepEqual(stageNameLines('Keys headphone amplifier'), ['Keys headphone', 'amplifier']);
    assert.deepEqual(stageNameLines('   '), []);
    // a name is printed WHOLE or not printed: never a part of it. Where it is
    // left out (a crowded stage), the plan says so, and the numbers stay
    for (const id of TEMPLATES) {
      const p = tpl(id);
      const { items } = labelItems(p, PHONE.gw, PHONE.gh);
      const plan = stageLabelPlan(items, PHONE.gw, PHONE.gh, frameOf(PHONE.gw, PHONE.gh));
      for (const it of items) {
        if (!it.text && !it.badges.length) continue;
        const l = plan.labels.find((x) => x.id === it.id);
        const shownName = l ? l.lines.map((x) => x.text).join(' ') : '';
        if (plan.dropped.includes(it.id)) {
          assert.equal(it.person, false, `${id}: a performer’s name is never left out (${it.text})`);
          assert.equal(shownName, '', `${id}: ${it.text} is left out whole`);
          if (it.badges.length) assert.deepEqual(l?.badges.map((b) => b.text), [...it.badges], `${id}: ${it.text} keeps every number`);
          continue;
        }
        assert.ok(l, `${id}: ${it.text} has its label`);
        assert.equal(shownName, it.text, 'the whole name');
        if (plan.bare.includes(it.id)) assert.equal(l.badges.length, 0, 'a name alone');
        else assert.deepEqual(l.badges.map((b) => b.text), [...it.badges], 'every number');
        assert.doesNotMatch(shownName, /…|\.\.\.$/);
      }
    }
  });

  it('every label is inside the picture, in every example, on a phone, a tablet and zoomed in', () => {
    for (const id of TEMPLATES)
      for (const g of [PHONE, PHONE_TALL, { gw: 700, gh: 420 }])
        for (const zoom of [1, 2, 4]) {
          const { items } = labelItems(tpl(id), g.gw, g.gh, zoom);
          for (const l of stageLabels(items, g.gw, g.gh, frameOf(g.gw, g.gh))) {
            assert.ok(l.box.x0 >= 0 && l.box.y0 >= 0 && l.box.x1 <= g.gw + 1e-6 && l.box.y1 <= g.gh + 1e-6, `${id} ${g.gw}×${g.gh} ×${zoom}: ${l.lines.map((x) => x.text).join(' ')}`);
            // a number's box is inside its label's box
            for (const b of l.badges) assert.ok(b.x >= l.box.x0 - 1e-6 && b.x + b.w <= l.box.x1 + 1e-6 && b.y >= l.box.y0 - 1e-6 && b.y + b.h <= l.box.y1 + 1e-6);
          }
        }
  });

  const clashes = (id: SpTemplateId, g: { gw: number; gh: number }) => {
    const { items } = labelItems(tpl(id), g.gw, g.gh);
    const out = stageLabels(items, g.gw, g.gh, frameOf(g.gw, g.gh));
    let area = 0;
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) area += stageLabelClash(out[i].box, out[j].box);
    return area;
  };

  it('on a 390-wide phone the names of the solo, duo, four-piece and playback examples keep off each other', () => {
    for (const g of [PHONE, PHONE_TALL, { gw: 700, gh: 420 }]) for (const id of ['solo', 'duo', 'four-piece', 'playback'] as const) assert.equal(clashes(id, g), 0, `${id} on ${g.gw}×${g.gh}`);
    // the thirty-three objects of the salsa band are too many for a phone at
    // 1×: a few names touch there (each box is an upper bound of its text),
    // and ZOOM or FULL SCREEN is how that plot is read
    assert.ok(clashes('salsa', PHONE_TALL) < clashes('salsa', { gw: 200, gh: 150 }), 'more glass, fewer names touching');
  });

  it('no name is ever under a direction word: every label is inside the frame', () => {
    for (const id of TEMPLATES)
      for (const g of [PHONE, PHONE_TALL, { gw: 700, gh: 420 }])
        for (const zoom of [1, 2, 4]) {
          const { items } = labelItems(tpl(id), g.gw, g.gh, zoom);
          const frame = frameOf(g.gw, g.gh);
          for (const l of stageLabels(items, g.gw, g.gh)) for (const f of frame) assert.equal(stageLabelClash(l.box, f), 0, `${id} ${g.gw}×${g.gh} ×${zoom}: ${l.lines.map((x) => x.text).join(' ')}`);
        }
  });

  it('an object that is not in the picture has no label and is in nobody’s way', () => {
    const p = tpl('four-piece');
    const whole = stageLabelPlan(labelItems(p, PHONE.gw, PHONE.gh).items, PHONE.gw, PHONE.gh);
    const zoomed = stageLabels(labelItems(p, PHONE.gw, PHONE.gh, 4).items, PHONE.gw, PHONE.gh);
    // at the whole stage, the only objects with no label are those whose name
    // was left out and that have no number to keep (the riser)
    const none = p.objects.filter((o) => !whole.labels.some((l) => l.id === o.id));
    for (const o of none) assert.ok(whole.dropped.includes(o.id) && stageBadges(p, o).length === 0, `${o.label} has no label`);
    assert.ok(zoomed.length < whole.labels.length && zoomed.length > 0);
  });

  // ── review 2: the hard rules for a name on the screen ─────────────────────
  type Box4 = { x0: number; y0: number; x1: number; y1: number };
  const centerGap = (a: Box4, b: Box4) => Math.hypot((a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2, (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);
  /** Lay a project's labels as the screen does, and list what breaks a rule. */
  const audit = (p: SpProject, g: { gw: number; gh: number }, zoom = 1, selId: string | null = null) => {
    const base = labelItems(p, g.gw, g.gh, zoom);
    const items = base.items.map((it) => ({ ...it, selected: it.id === selId }));
    const glass = { x0: STAGE_FRAME.side, y0: STAGE_FRAME.top, x1: g.gw - STAGE_FRAME.side, y1: g.gh - STAGE_FRAME.bottom };
    const shown = items.filter((it) => stageLabelClash(stageBoxBounds(it.box), glass) > 0);
    const plan = stageLabelPlan(items, g.gw, g.gh, frameOf(g.gw, g.gh));
    const name = (id: string) => items.find((x) => x.id === id)?.text || id;
    const overlap: string[] = [];
    const onOtherArt: string[] = [];
    const personOnOtherArt: string[] = [];
    const strayed: string[] = [];
    const riser: string[] = [];
    plan.labels.forEach((l, i) => {
      for (const m of plan.labels.slice(i + 1)) if (stageLabelClash(l.box, m.box) > 0) overlap.push(`${name(l.id)} × ${name(m.id)}`);
      const own = items.find((x) => x.id === l.id)!;
      const ownBox = stageBoxBounds(own.box);
      if (own.box.sized) {
        // a platform's name: inside its own box, or directly under it
        const inside = l.box.x0 >= ownBox.x0 - 1e-6 && l.box.x1 <= ownBox.x1 + 1e-6 && l.box.y0 >= ownBox.y0 - 1e-6 && l.box.y1 <= ownBox.y1 + 1e-6;
        // (a selected platform's frame stands 5 units out: its name goes under the frame)
        const under = l.box.y0 >= ownBox.y1 && l.box.y0 <= ownBox.y1 + 9 && l.box.x1 > ownBox.x0 && l.box.x0 < ownBox.x1;
        if (!inside && !under) riser.push(name(l.id));
        return;
      }
      const keeper = own.person || own.selected;
      for (const it of shown) {
        if (it.id === l.id || it.box.sized) continue;
        if (stageLabelClash(l.box, stageBoxBounds(it.box)) > 0) (keeper ? personOnOtherArt : onOtherArt).push(`${name(l.id)} on ${name(it.id)}`);
      }
      // a label that stands AWAY from its symbol (it has a leader) is nearer
      // to its own symbol than to any other. (An object whose center is past
      // the edge of a zoomed-in drawing is not judged: most of it is not there.)
      const inView = own.box.cx >= glass.x0 && own.box.cx <= glass.x1 && own.box.cy >= glass.y0 && own.box.cy <= glass.y1;
      if (!keeper && inView && stageLabelLeader(l.box, ownBox)) {
        const mine = centerGap(l.box, ownBox);
        for (const it of shown) if (it.id !== l.id && !it.box.sized && centerGap(l.box, stageBoxBounds(it.box)) < mine - 1e-6) strayed.push(`${name(l.id)} is nearer ${name(it.id)}`);
      }
    });
    return { plan, items, overlap, onOtherArt, personOnOtherArt, strayed, riser };
  };
  /** The glass a 390 × 844 phone gives the stage above a three-row key. */
  const SCREEN = { gw: 366, gh: 262 };
  const SIZES = [SCREEN, PHONE, PHONE_TALL, { gw: 700, gh: 420 }];

  it('no name is over another name, in every example, at every size and zoom', () => {
    for (const id of TEMPLATES)
      for (const g of SIZES)
        for (const zoom of [1, 1.5, 2, 3]) assert.deepEqual(audit(tpl(id), g, zoom).overlap, [], `${id} ${g.gw}×${g.gh} ×${zoom}`);
  });

  it('a name of a piece of equipment is never over another object’s art, and when it stands away from its symbol its nearest object is its own', () => {
    for (const id of TEMPLATES)
      for (const g of SIZES)
        for (const zoom of [1, 1.5, 2, 3]) {
          const a = audit(tpl(id), g, zoom);
          assert.deepEqual(a.onOtherArt, [], `${id} ${g.gw}×${g.gh} ×${zoom}`);
          assert.deepEqual(a.strayed, [], `${id} ${g.gw}×${g.gh} ×${zoom}`);
        }
    // a performer always keeps a name; on the phone, at the whole stage, it
    // is clear of every other object in the four small examples (the salsa
    // band's front line is the one place a name may touch a neighbor's box)
    for (const id of ['solo', 'duo', 'four-piece', 'playback'] as const) assert.deepEqual(audit(tpl(id), SCREEN).personOnOtherArt, [], id);
    assert.ok(audit(tpl('salsa'), SCREEN).personOnOtherArt.length <= 1);
    assert.deepEqual(audit(tpl('salsa'), SCREEN, 1.5).personOnOtherArt, []);
  });

  it('a riser’s name is inside its own box or directly under it, or it is left out: it never crosses the stage', () => {
    const p = tpl('four-piece');
    const riserObj = p.objects.find((o) => o.kind === 'riser');
    assert.ok(riserObj);
    for (const g of SIZES)
      for (const zoom of [1, 1.5, 2, 3]) {
        const a = audit(p, g, zoom);
        assert.deepEqual(a.riser, [], `${g.gw}×${g.gh} ×${zoom}`);
      }
    // on the phone the kit fills the riser: the name is left out (the key
    // names the dashed outline). With room, it is printed
    assert.ok(audit(p, SCREEN).plan.dropped.includes(riserObj.id));
    const roomy = spUpdateObject(spRemoveObjects(p, p.objects.filter((o) => o.kind !== 'riser').map((o) => o.id)), riserObj.id, {});
    const alone = audit(roomy, SCREEN);
    assert.equal(alone.plan.labels.length, 1);
    assert.deepEqual(alone.riser, []);
  });

  it('moving one object never sends another object’s name onto a third (review 2, B1)', () => {
    // the case that was seen: Sam one step toward stage left
    const p = tpl('four-piece');
    const sam = p.objects.find((o) => o.kind === 'performer' && stageName(p, o) === 'Sam');
    const riserObj = p.objects.find((o) => o.kind === 'riser');
    assert.ok(sam && riserObj);
    const moved = stageNudge(p, sam.id, 1, 0);
    const seen = audit(moved, SCREEN, 1, sam.id);
    assert.deepEqual(seen.riser, []);
    assert.deepEqual(seen.onOtherArt, []);
    assert.deepEqual(seen.overlap, []);
    // …and every object of the four-piece and the playback example, one step each way, selected as it is after a move
    const artOf = (pp: SpProject, id: string) => stageBoxBounds(stageObjectBox(pp, pp.objects.find((x) => x.id === id)!, stageTransformFor(pp, SCREEN.gw, SCREEN.gh)));
    for (const id of ['four-piece', 'playback'] as const) {
      const q = tpl(id);
      for (const o of q.objects)
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const after = stageNudge(q, o.id, dx, dy);
          const a = audit(after, SCREEN, 1, o.id);
          const what = `${id}: ${stageName(q, o) || o.kind} moved ${dx},${dy}`;
          // two objects whose own drawings lie on each other (one pushed
          // onto the other) leave no clean place between them: that one pair
          // is not judged here. Every other rule still is.
          const idOf = (name: string) => q.objects.find((x) => (stageName(q, x) || x.id) === name)?.id ?? name;
          const judged = a.onOtherArt.filter((f) => {
            const [who, on] = f.split(' on ');
            return stageLabelClash(artOf(after, idOf(who)), artOf(after, idOf(on))) === 0;
          });
          assert.deepEqual(a.overlap, [], what);
          assert.deepEqual(judged, [], what);
          assert.deepEqual(a.strayed, [], what);
          assert.deepEqual(a.riser, [], what);
        }
    }
  });

  it('on a crowded stage an equipment row drops its NAME and keeps its numbers; performers keep their names; the names come back with zoom (B2)', () => {
    const p = tpl('salsa');
    const at = (zoom: number) => audit(p, SCREEN, zoom);
    const one = at(1);
    assert.ok(one.plan.dropped.length >= 5, `${one.plan.dropped.length} names left out at the whole stage`);
    for (const id of one.plan.dropped) {
      const it = one.items.find((x) => x.id === id)!;
      assert.equal(it.person, false, `${it.text} is equipment`);
      const l = one.plan.labels.find((x) => x.id === id);
      if (it.badges.length) {
        assert.ok(l, `${it.text} still shows its numbers`);
        assert.equal(l.lines.length, 0);
        assert.deepEqual(l.badges.map((b) => b.text), [...it.badges]);
      } else assert.equal(l, undefined);
    }
    // every performer is named, at every zoom at which they are in view
    for (const zoom of [1, 1.5, 2, 3]) {
      const a = at(zoom);
      for (const l of a.plan.labels) {
        const it = a.items.find((x) => x.id === l.id)!;
        if (it.person) assert.equal(l.lines.map((x) => x.text).join(' '), it.text, `×${zoom}: ${it.text}`);
      }
    }
    for (const o of p.objects.filter((x) => x.kind === 'performer')) assert.ok(one.plan.labels.some((l) => l.id === o.id), stageName(p, o));
    // zooming in brings the names back
    assert.ok(at(1.5).plan.dropped.length < one.plan.dropped.length);
    assert.ok(at(2).plan.dropped.length < at(1.5).plan.dropped.length);
    assert.equal(at(3).plan.dropped.length, 0);
    // a small band loses no name at the whole stage
    for (const id of ['solo', 'duo', 'playback'] as const) assert.deepEqual(audit(tpl(id), SCREEN).plan.dropped, [], id);
    // the selected object always keeps its name, equipment too
    const four = tpl('four-piece');
    const plain = audit(four, SCREEN);
    const lost = plain.plan.dropped.map((id) => four.objects.find((o) => o.id === id)!).find((o) => o.kind !== 'riser');
    assert.ok(lost, 'the four-piece leaves a name out on the phone');
    const picked = audit(four, SCREEN, 1, lost.id);
    assert.equal(picked.plan.dropped.includes(lost.id), false);
    assert.equal(picked.plan.labels.find((l) => l.id === lost.id)?.lines.map((x) => x.text).join(' '), stageName(four, lost));
  });

  it('the screen says how many names are left out, and only then', () => {
    const plan = code(`${SP}/stage/StagePlanView.tsx`);
    const area = code(`${SP}/StageArea.tsx`);
    assert.match(plan, /const leftOut = showNames \? plan\.dropped\.length : 0;/);
    // …and how many performers are named WITHOUT their mix code (bug test S2-03)
    assert.match(plan, /const codesOut = showNumbers \? plan\.bare\.length : 0;/);
    // round 2 (R2-SP1-02): also the names that touch another label, and the numbers left out
    // owner 2026-11-13: build them all — names stay inside the stage: and the
    // performers whose names are left out at this size (peopleOut)
    assert.match(plan, /leftOutRef\.current\?\.\(leftOut, codesOut, crowded, numbersOut, peopleOut\);/);
    assert.match(plan, /const peopleOut = showNames \? plan\.peopleOut\.length : 0;/);
    assert.match(area, /setLeftOut\(n\);\s*setCodesOut\(codes\);/);
    // "every performer is named" only while no name is covered (R2-SP1-02)
    // owner 2026-11-13: build the remaining held items: the words say why,
    // truly (names are kept clear of other names AND drawings), and the
    // performers shown by initials are counted and named
    assert.match(area, /leftOut > 0 \? `At this size, \$\{leftOut === 1 \? '1 equipment name is' : `\$\{leftOut\} equipment names are`\} hidden so that no name covers another name or drawing\.\$\{numbersOut > 0 \? '' : ' The equipment keeps its channel numbers and mix codes\.'\}\$\{crowded > 0 \|\| peopleOut > 0 \|\| shortNames\.count > 0 \? '' : ' Every performer is named\.'\}`/);
    assert.match(area, /peopleOut > 0 \? `At this size, \$\{peopleOut === 1 \? '1 performer’s name is' : `\$\{peopleOut\} performers’ names are`\} hidden so that no name covers another name or drawing, or runs past the edge of the stage\.` : ''/);
    assert.match(area, /shortened at this size: \$\{shortNames\.words\}\./);
    assert.match(area, /performers are`\} named without \$\{codesOut === 1 \? 'their mix code' : 'their mix codes'\} at this size\. Each code is still on that performer’s monitor\./);
    // owner 2026-11-13: build them all — names stay inside the stage: numbers are left out at small sizes too
    assert.match(area, /'Press ZOOM IN to see every name and number\. In FULL SCREEN, turn the phone sideways for a larger stage\.'/);
    assert.doesNotMatch(area, /some names sit close together|to read every name/);
  });

  it('a performer is drawn after the instrument they sit at, and a platform under everything (B3)', () => {
    const p = tpl('four-piece');
    const order = stageDrawOrder(p.objects).map((o) => o.kind);
    assert.equal(order[0], 'riser');
    assert.ok(order.lastIndexOf('drum-kit') < order.indexOf('performer'), 'the drummer is on top of the kit');
    assert.ok(order.lastIndexOf('keyboard') < order.indexOf('performer'));
    assert.ok(order.indexOf('performer') < order.indexOf('wedge'), 'microphones and monitors are on top');
    // the selection frame is the box of what is DRAWN: a figure is 0.72 m wide
    assert.deepEqual(stageArtSize('performer'), { w: 0.72, h: 0.42 });
    assert.deepEqual(stageArtSize('vocal-mic'), stageArtSize('mic-stand'));
    assert.deepEqual(stageArtSize('wedge'), { w: spKeySymbol('wedge').w, h: spKeySymbol('wedge').h });
    const plan = code(`${SP}/stage/StagePlanView.tsx`);
    assert.match(plan, /const ringCorners = selBox \? stageBoxCorners\(selBox, 3\) : null;/);
  });

  it('FULL SCREEN opens on the WHOLE stage, laid out at the top at its own height (bug test S2-10, S2-12)', () => {
    for (const id of TEMPLATES) {
      const p = tpl(id);
      const aspect = spStageAspect(p);
      const region = stageRegion(p.objects);
      // the natural height is exactly the height at which the WIDTH limits the stage at 1×
      const gw = 366;
      const nat = stageNaturalHeight(aspect, gw, region);
      const T = stageTransform(aspect, gw, nat, region);
      const innerW = gw - STAGE_FRAME.side * 2;
      near((region.x1 - region.x0) * T.kx, innerW, 1e-6);
      near((region.y1 - region.y0) * T.ky, nat - STAGE_FRAME.top - STAGE_FRAME.bottom, 1e-6);
      // in a taller glass the whole stage still shows: nothing is off the sides at 1×
      const tall = stageTransform(aspect, gw, nat * 2, region);
      assert.ok((region.x1 - region.x0) * tall.kx <= innerW + 1e-6, `${id}: the whole width shows`);
    }
    const plan = code(`${SP}/stage/StagePlanView.tsx`);
    assert.match(plan, /const gh = inFull \? Math\.min\(split\.stage, stageNaturalHeight\(aspect, gw, region\)\) : split\.stage;/);
    // no zoom is forced on entering; the zoom from before is put back on leaving
    assert.doesNotMatch(plan, /const fill = stageFillZoom/);
    assert.match(plan, /if \(!auto\.current\) auto\.current = \{ before: ref\.current\.view \};/);
    assert.match(plan, /auto\.current = null;/);
  });

  it('the fill zoom (no longer forced on FULL SCREEN) still measures the height (B4)', () => {
    for (const id of TEMPLATES) {
      const p = tpl(id);
      const aspect = spStageAspect(p);
      const region = stageRegion(p.objects);
      // a phone held upright: 366 wide, about 370 tall above the key
      const g = { gw: 366, gh: 370 };
      const z = stageFillZoom(aspect, g.gw, g.gh, region);
      assert.ok(z > 1.2 && z <= STAGE_ZOOM_MAX, `${id}: ${z}`);
      near(z * 20, Math.round(z * 20), 1e-6);
      const fit = stageTransform(aspect, g.gw, g.gh, region);
      const full = stageTransform(aspect, g.gw, g.gh, region, { zoom: z, cx: 0.5, cy: 0.5 });
      const innerH = g.gh - STAGE_FRAME.top - STAGE_FRAME.bottom;
      const tall = (region.y1 - region.y0) * full.ky;
      assert.ok(Math.abs(tall - innerH) <= innerH * 0.04, `${id}: what there is to see is ${tall} tall in ${innerH}`);
      assert.ok(full.ky > fit.ky * 1.2, 'larger than on the normal screen');
      // turned sideways the stage fills the height already: no zoom is forced
      assert.equal(stageFillZoom(aspect, 800, 330, region), 1, `${id} sideways`);
    }
  });

  it('placing the labels is the same every time (no label jumps when nothing moved)', () => {
    const { items } = labelItems(tpl('salsa'), PHONE.gw, PHONE.gh);
    assert.deepEqual(stageLabels(items, PHONE.gw, PHONE.gh), stageLabels(items, PHONE.gw, PHONE.gh));
  });

  it('a label that had to stand away from its symbol gets a line to it; one beside it does not', () => {
    assert.equal(stageLabelLeader({ x0: 0, y0: 20, x1: 30, y1: 30 }, { x0: 5, y0: 0, x1: 25, y1: 17 }), null);
    const lead = stageLabelLeader({ x0: 0, y0: 60, x1: 30, y1: 70 }, { x0: 5, y0: 0, x1: 25, y1: 17 });
    assert.deepEqual(lead, { x1: 15, y1: 60, x2: 15, y2: 17 });
  });

  it('the numbers beside a symbol are its own inputs and mixes, read from the one model', () => {
    const p = tpl('four-piece');
    const by = (kind: string, n = 0) => p.objects.filter((o) => o.kind === kind)[n];
    assert.deepEqual(stageBadges(p, by('drum-kit')), ['1–6']);
    assert.deepEqual(stageBadges(p, by('keyboard')), ['9–10']);
    assert.deepEqual(stageBadges(p, by('bass-amp')), ['7']);
    assert.deepEqual(stageBadges(p, by('wedge')), ['M1']);
    const sam = p.objects.find((o) => o.kind === 'performer' && stageName(p, o) === 'Sam');
    assert.ok(sam);
    assert.deepEqual(stageBadges(p, sam), ['M1']);
    assert.deepEqual(stageCompressBadges(['1', '2', '3', '5', 'B2', '9', '10', '?']), ['1–3', '5', 'B2', '9–10', '?']);
    assert.deepEqual(stageCompressBadges([]), []);
    // off the stage is said in words beside the object
    const off = spMoveObject(p, by('wedge').id, { x: 1.2, y: 0.5 });
    assert.deepEqual(stageBadges(off, spObject(off, by('wedge').id)!), ['M1', 'OFF STAGE']);
    // a performer's figure prints the name from Setup, not a stale label
    const renamed = { ...p, performers: p.performers.map((pf) => (pf.name === 'Sam' ? { ...pf, name: 'Samantha' } : pf)) };
    assert.equal(stageName(renamed, sam), 'Samantha');
  });
});

describe('a symbol is not an input', () => {
  it('every kind in the palette says what it asks before it is placed, and every package it offers exists', () => {
    for (const it of SP_PALETTE) assert.ok(['none', 'performer', 'sound', 'capture', 'monitor'].includes(stageLinkMode(it.kind)), it.kind);
    for (const [kind, ids] of Object.entries(STAGE_PACKAGES)) {
      assert.ok(SP_PALETTE.some((x) => x.kind === kind), kind);
      for (const id of ids ?? []) assert.ok(SP_PACKAGES.some((x) => x.id === id), `${kind}: package ${id}`);
    }
    // every instrument offers a package or a clear way without one
    for (const it of SP_PALETTE.filter((x) => stageLinkMode(x.kind) === 'sound')) assert.ok(stagePackagesFor(it.kind).length > 0, `${it.kind} offers a package`);
    assert.equal(stagePackagesFor('di').length, 0, 'a DI symbol never offers to add an input');
    assert.equal(stageLinkMode('amp' as never), 'none');
  });

  it('placing a drawing, or a symbol for something already listed, adds nothing to any list', () => {
    const p = tpl('four-piece');
    const count = (q: SpProject) => [q.inputs.length, q.sources.length, q.devices.length, q.mixes.length, q.performers.length, q.diDevices.length];
    const before = count(p);
    for (const it of SP_PALETTE) {
      const a = stageAddDrawing(p, it.kind, { x: 0.5, y: 0.5 }, { visualOnly: true });
      assert.deepEqual(count(a.p), before, `${it.kind} as a drawing`);
      assert.equal(a.p.objects.length, p.objects.length + 1);
    }
    const src = p.sources[0];
    const linked = stageAddLinked(p, 'drum-kit', { x: 0.3, y: 0.3 }, { sourceId: src.id });
    assert.deepEqual(count(linked.p), before);
    assert.equal(spObject(linked.p, linked.id)?.sourceId, src.id);
    // a DI symbol points at the DI input that is already there: no second input
    const di = p.inputs.find((i) => i.capture === 'di');
    assert.ok(di);
    assert.equal(stageInputChoices(p, 'di').every((c) => p.inputs.find((i) => i.id === c.id)?.capture === 'di'), true);
    const diIcon = stageAddLinked(p, 'di', { x: 0.2, y: 0.4 }, { inputId: di.id });
    assert.deepEqual(count(diIcon.p), before);
    assert.equal(spObject(diIcon.p, diIcon.id)?.inputId, di.id);
  });

  it('“only a drawing” is remembered, so the review does not ask; “decide later” is asked', () => {
    const asked = (q: SpProject, id: string) => spReview(q).some((i) => i.target.kind === 'object' && i.target.id === id && (i.rule === 'icon-no-input' || i.rule === 'icon-no-device'));
    for (const kind of ['guitar-amp', 'wedge'] as const) {
      const drawing = stageAddDrawing(blank(), kind, { x: 0.5, y: 0.5 }, { visualOnly: true });
      assert.equal(asked(drawing.p, drawing.id), false, `${kind}: answered`);
      const later = stageAddDrawing(blank(), kind, { x: 0.5, y: 0.5 });
      assert.equal(asked(later.p, later.id), true, `${kind}: the review asks`);
    }
  });

  it('a package adds exactly the rows the band kept, and the symbol points at them', () => {
    const pkg = SP_PACKAGES.find((x) => x.id === 'drums-six');
    assert.ok(pkg);
    const base = stageAddPerformer(blank(), { x: 0.5, y: 0.2 }, 'Maya', 'Drums');
    const who = base.p.performers[0].id;
    const ticked = pkg.rows.map((r) => r.label !== 'Rack tom');
    const r = stageAddWithPackage(base.p, 'drum-kit', { x: 0.5, y: 0.3 }, pkg, { ticked, performerId: who });
    assert.deepEqual(r.p.inputs.map((i) => i.label), ['Kick', 'Snare', 'Floor tom', 'Overhead L', 'Overhead R']);
    assert.equal(r.inputIds.length, 5);
    const icon = spObject(r.p, r.id);
    assert.equal(icon?.sourceId, r.p.sources[0].id);
    assert.equal(r.p.sources[0].performerId, who);
    assert.deepEqual(stageBadges(r.p, icon!), ['1–5']);
    // the overheads stayed one stereo pair
    const oh = r.p.inputs.filter((i) => i.side);
    assert.equal(oh.length, 2);
    assert.equal(oh[0].pairId, oh[1].pairId);
    // one side of a pair left out: both sides are left out (never half a pair)
    const half = stageAddWithPackage(blank(), 'drum-kit', { x: 0.5, y: 0.3 }, pkg, { ticked: pkg.rows.map((row) => row.side !== 'R') });
    assert.equal(half.p.inputs.some((i) => i.side), false);
    // a vocal microphone's symbol points at its one input
    const vocal = SP_PACKAGES.find((x) => x.id === 'vocal');
    assert.ok(vocal);
    const v = stageAddWithPackage(blank(), 'vocal-mic', { x: 0.5, y: 0.8 }, vocal);
    assert.equal(spObject(v.p, v.id)?.inputId, v.p.inputs[0].id);
    // every row left out: a drawing, and still no input
    const none = stageAddWithPackage(blank(), 'drum-kit', { x: 0.5, y: 0.5 }, pkg, { ticked: pkg.rows.map(() => false) });
    assert.equal(none.p.inputs.length, 0);
    assert.equal(none.p.objects.length, 1);
  });

  it('a second package of the same kind gets its own names, as it does when it is added in Inputs', () => {
    const p = tpl('four-piece');
    const cab = SP_PACKAGES.find((x) => x.id === 'guitar-cab');
    const leo = p.performers.find((pf) => pf.name === 'Leo');
    assert.ok(cab && leo);
    const r = stageAddWithPackage(p, 'guitar-amp', { x: 0.6, y: 0.5 }, cab, { performerId: leo.id });
    const unique = (labels: string[]) => new Set(labels.map((l) => l.toLowerCase())).size === labels.length;
    assert.ok(unique(r.p.sources.map((x) => x.label)), `sources: ${r.p.sources.map((x) => x.label).join(', ')}`);
    assert.ok(unique(r.p.inputs.map((x) => x.label)), `inputs: ${r.p.inputs.map((x) => x.label).join(', ')}`);
    const amps = r.p.objects.filter((o) => o.kind === 'guitar-amp').map((o) => o.label);
    assert.equal(amps.length, 2);
    assert.ok(unique(amps), `two guitar amplifiers with one name: ${amps.join(', ')}`);
    assert.match(spObject(r.p, r.id)?.label ?? '', /Leo/);
    assert.match(r.p.inputs[r.p.inputs.length - 1].label, /Leo/);
    // and with nobody to name it after, a number tells the two apart
    const again = stageAddWithPackage(r.p, 'guitar-amp', { x: 0.7, y: 0.5 }, cab);
    assert.ok(unique(again.p.inputs.map((x) => x.label)));
    assert.ok(unique(again.p.objects.filter((o) => o.kind === 'guitar-amp').map((o) => o.label)));
  });

  it('a monitor symbol can add a DEVICE, never a mix and never an input', () => {
    const p = tpl('four-piece');
    const m1 = p.mixes[0];
    const r = stageAddWithDevice(p, 'wedge', { x: 0.6, y: 0.9 }, { type: 'wedge', mixId: m1.id });
    assert.equal(r.p.devices.length, p.devices.length + 1);
    assert.equal(r.p.mixes.length, p.mixes.length, 'a second wedge on M1 is not a new mix');
    assert.equal(r.p.inputs.length, p.inputs.length);
    const icon = spObject(r.p, r.id);
    const made = r.p.devices.find((d) => d.id === icon?.deviceId);
    assert.equal(made?.mixId, m1.id);
    assert.equal(icon?.rot, 180, 'a wedge is placed facing upstage, at its performer');
    assert.deepEqual(stageBadges(r.p, icon!), [m1.code]);
    // the same device, with the same name, as the Monitors area would add
    const viaMonitors = spmAddDevice(p, 'wedge', m1.id);
    const twin = viaMonitors.p.devices.find((d) => d.id === viaMonitors.id);
    assert.equal(made?.label, twin?.label);
    assert.equal(icon?.label, made?.label);
    assert.equal(made?.selfContained, twin?.selfContained);
    assert.equal(new Set(r.p.devices.map((d) => d.label)).size, r.p.devices.length, 'no two devices share a name');
    assert.equal(stageDeviceChoices(r.p, 'wedge').length, p.devices.filter((d) => d.type === 'wedge').length + 1);
    assert.equal(stageDeviceChoices(r.p, 'iem').some((c) => c.label.startsWith('Wedge')), false, 'an in-ear symbol is not offered a wedge');
  });

  it('a new monitor never faces the audience', () => {
    assert.equal(stageDefaultRot('wedge', { x: 0.5, y: 0.9 }), 180);
    assert.equal(stageDefaultRot('drum-fill', { x: 0.4, y: 0.3 }), 180);
    assert.equal(stageDefaultRot('sidefill', { x: 0.05, y: 0.5 }), 270, 'a sidefill at stage right faces stage left, across the stage');
    assert.equal(stageDefaultRot('sidefill', { x: 0.95, y: 0.5 }), 90, 'a sidefill at stage left faces stage right');
    assert.equal(stageDefaultRot('performer', { x: 0.5, y: 0.5 }), 0);
    assert.equal(stageFacingWord(270), 'facing stage left');
    for (const kind of ['wedge', 'drum-fill', 'sidefill'] as const) {
      const d = stageAddDrawing(blank(), kind, { x: 0.2, y: 0.5 });
      assert.notEqual(spObject(d.p, d.id)?.rot, 0, `${kind} as a drawing`);
      const type = kind === 'wedge' ? 'wedge' : kind;
      const w = stageAddWithDevice(blank(), kind, { x: 0.2, y: 0.5 }, { type, mixId: null });
      assert.notEqual(spObject(w.p, w.id)?.rot, 0, `${kind} with a device`);
    }
    // the print symbol agrees: a wedge's wide side (its grille) is its front,
    // and at 180° that side is upstage, toward the performer
    const w = stageAddDrawing(blank(), 'wedge', { x: 0.5, y: 0.9 });
    const o = spObject(w.p, w.id)!;
    const poly = spPlacedShapes(w.p, { ...o, x: 0, y: 0 }).find((sh) => sh.t === 'poly');
    assert.ok(poly && poly.t === 'poly');
    const ys = poly.pts.filter((_, k) => k % 2 === 1);
    const xs = poly.pts.filter((_, k) => k % 2 === 0);
    const widthAt = (y: number) => {
      const row = xs.filter((_, k) => Math.abs(ys[k] - y) < 1e-6);
      return Math.max(...row) - Math.min(...row);
    };
    assert.ok(widthAt(Math.min(...ys)) > widthAt(Math.max(...ys)), 'the wide side is upstage');
  });

  it('what is in the lists and not on the stage is named, and can be placed without adding anything', () => {
    const p = tpl('four-piece');
    assert.deepEqual(stageUnplaced(p), []);
    const figure = p.objects.find((o) => o.kind === 'performer');
    const kit = p.objects.find((o) => o.kind === 'drum-kit');
    assert.ok(figure && kit);
    const gone = spRemoveObjects(p, [figure.id, kit.id]);
    const un = stageUnplaced(gone);
    assert.ok(un.some((u) => u.kind === 'performer' && u.id === figure.performerId));
    assert.ok(un.some((u) => u.kind === 'source' && u.id === kit.sourceId));
    let q = gone;
    for (const u of un) {
      const r = stagePlace(q, { kind: u.kind, id: u.id }, stageFreeSpot(q, { x: 0.5, y: 0.5 }));
      assert.ok(r);
      q = r.p;
    }
    assert.deepEqual(stageUnplaced(q), []);
    assert.equal(q.inputs.length, p.inputs.length);
    assert.equal(q.devices.length, p.devices.length);
    assert.equal(q.objects.find((o) => o.sourceId === kit.sourceId)?.kind, 'drum-kit');
    // a wedge or a fill that is in the monitor plan with no symbol is named
    // too (a plot without it is missing something the venue must place); a
    // receiver pack is worn and is not asked onto the stage
    const wedgeIcon = p.objects.find((o) => o.kind === 'wedge');
    assert.ok(wedgeIcon);
    const noWedge = stageUnplaced(spRemoveObjects(p, [wedgeIcon.id]));
    assert.deepEqual(noWedge.map((u) => `${u.kind}:${u.id}`), [`device:${wedgeIcon.deviceId}`]);
    const fill = spmAddDevice(p, 'drum-fill', null);
    assert.ok(stageUnplaced(fill.p).some((u) => u.kind === 'device' && u.id === fill.id));
    const pack = spmAddDevice(p, 'iem-pack', null);
    assert.equal(stageUnplaced(pack.p).some((u) => u.id === pack.id), false);
    const placedFill = stagePlace(fill.p, { kind: 'device', id: fill.id }, { x: 0.4, y: 0.3 });
    assert.equal(spObject(placedFill!.p, placedFill!.id)?.kind, 'drum-fill');
    assert.equal(spObject(placedFill!.p, placedFill!.id)?.rot, 180);
    // an input and a device from the other areas ("Locate on the stage")
    const vox = p.inputs.find((i) => i.label === 'Lead vocal');
    assert.ok(vox);
    assert.equal(spObject(stagePlace(p, { kind: 'input', id: vox.id }, { x: 0.5, y: 0.5 })!.p, stagePlace(p, { kind: 'input', id: vox.id }, { x: 0.5, y: 0.5 })!.id)?.kind, 'vocal-mic');
    const dev = p.devices.find((d) => d.type === 'wedge');
    assert.ok(dev);
    assert.equal(spObject(stagePlace(p, { kind: 'device', id: dev.id }, { x: 0.5, y: 0.5 })!.p, stagePlace(p, { kind: 'device', id: dev.id }, { x: 0.5, y: 0.5 })!.id)?.kind, 'wedge');
    assert.equal(stagePlace(p, { kind: 'mix', id: p.mixes[0].id }, { x: 0.5, y: 0.5 }), null);
    // the symbol follows the source's own name before its category
    assert.equal(stageKindForSource('Acoustic guitar', 'guitars'), 'acoustic-guitar');
    assert.equal(stageKindForSource('Guitar', 'guitars'), 'guitar-amp');
    assert.equal(stageKindForSource('Congas', 'percussion'), 'congas');
    assert.equal(stageKindForSource('Trumpet 1', 'other'), 'horn');
    assert.equal(stageKindForSource('Section', 'horns'), 'horn');
    assert.equal(stageKindForSource('Piano', 'keys'), 'piano');
    assert.equal(stageKindForSource('Something else', 'other'), 'generic');
    assert.equal(stagePlace(p, { kind: 'source', id: 'no-such' }, { x: 0.5, y: 0.5 }), null);
  });

  it('a selection made in another area finds its symbol on the stage', () => {
    const p = tpl('four-piece');
    const kick = p.inputs.find((i) => i.label === 'Kick');
    const kit = p.objects.find((o) => o.kind === 'drum-kit');
    const wedge = p.objects.find((o) => o.kind === 'wedge');
    const figure = p.objects.find((o) => o.kind === 'performer');
    assert.ok(kick && kit && wedge && figure);
    assert.equal(stageSelectedObjectId(p, { kind: 'input', id: kick.id }), kit.id);
    assert.equal(stageSelectedObjectId(p, { kind: 'source', id: kit.sourceId as string }), kit.id);
    assert.equal(stageSelectedObjectId(p, { kind: 'device', id: wedge.deviceId as string }), wedge.id);
    assert.equal(stageSelectedObjectId(p, { kind: 'performer', id: figure.performerId as string }), figure.id);
    assert.equal(stageSelectedObjectId(p, { kind: 'object', id: kit.id }), kit.id);
    assert.equal(stageSelectedObjectId(p, { kind: 'object', id: 'gone' }), null);
    assert.equal(stageSelectedObjectId(p, { kind: 'mix', id: p.mixes[0].id }), null);
    assert.equal(stageSelectedObjectId(p, null), null);
  });

  it('a new object lands on the stage, on a free grid point, never on top of another object', () => {
    for (const stage of [{}, { width: 24, depth: 16, unit: 'ft' as const }, { width: 8, depth: 5, unit: 'm' as const }, { snap: false }]) {
      let p = blank(stage);
      const step = spGridStep(p);
      const seen: { x: number; y: number }[] = [];
      for (let k = 0; k < 10; k++) {
        const at = stageFreeSpot(p, STAGE_NEW_SPOT);
        assert.ok(at.x > 0 && at.x < 1 && at.y > 0 && at.y < 1, 'on the stage');
        if (p.stage.snap) {
          near(at.x / step.x, Math.round(at.x / step.x), 1e-6);
          near(at.y / step.y, Math.round(at.y / step.y), 1e-6);
          // so the model's own snap leaves it where it is, and the typed
          // position reads as a whole step
          const r = spAddObject(p, 'chair', at);
          const kept = spObject(spMoveObject(r.p, r.id, at), r.id);
          near(kept?.x ?? NaN, at.x, 1e-9);
        }
        for (const q of seen) assert.ok(Math.abs(q.x - at.x) > 0.05 || Math.abs(q.y - at.y) > 0.05, `clear of the one at ${q.x},${q.y}`);
        seen.push(at);
        p = spAddObject(p, 'chair', at).p;
      }
      // the first one is at downstage center, where a band starts its front line
      near(seen[0].x, 0.5, 0.05);
      assert.ok(seen[0].y > 0.6 && seen[0].y < 0.8);
    }
    const edge = stageFreeSpot(blank(), { x: 3, y: -3 });
    assert.ok(edge.x < 1 && edge.x > 0.9 && edge.y > 0 && edge.y < 0.1);
    // in the four-piece example the new place is clear of every object there
    const four = tpl('four-piece');
    const at = stageFreeSpot(four, STAGE_NEW_SPOT);
    for (const o of four.objects) assert.ok(Math.abs(o.x - at.x) > 0.05 || Math.abs(o.y - at.y) > 0.05, `clear of ${o.label}`);
  });

  it('fourteen objects added one after another never land on each other: a place is free for the new object’s own BOX (B7)', () => {
    const KINDS = ['piano', 'congas', 'timbales', 'drum-fill', 'stage-box', 'power', 'chair', 'sidefill', 'music-stand', 'rack', 'di', 'horn', 'percussion', 'keyboard'] as const;
    for (const stage of [{ width: 24, depth: 16, unit: 'ft' as const }, { width: 8, depth: 5, unit: 'm' as const }, {}, { width: 24, depth: 16, unit: 'ft' as const, snap: false }]) {
      let p = blank(stage);
      for (const kind of KINDS) {
        const at = stageFreeSpot(p, STAGE_NEW_SPOT, kind);
        assert.ok(at.x > 0 && at.x < 1 && at.y > 0 && at.y < 1, `${kind} is on the stage`);
        p = stageAddDrawing(p, kind, at, { visualOnly: true }).p;
      }
      assert.equal(p.objects.length, KINDS.length);
      const T = stageTransformFor(p, 700, 420);
      const boxes = p.objects.map((o) => ({ o, b: stageBoxBounds(stageObjectBox(p, o, T)) }));
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) assert.equal(stageLabelClash(boxes[i].b, boxes[j].b), 0, `${boxes[i].o.kind} and ${boxes[j].o.kind} share a place on a ${JSON.stringify(stage)} stage`);
    }
    // the old test of centers called this free: a sidefill 0.4 m from the congas
    const p = spAddObject(blank({ width: 24, depth: 16, unit: 'ft' }), 'congas', STAGE_NEW_SPOT).p;
    const at = stageFreeSpot(p, { x: STAGE_NEW_SPOT.x + 0.06, y: STAGE_NEW_SPOT.y }, 'sidefill');
    const q = stageAddDrawing(p, 'sidefill', at).p;
    const T = stageTransformFor(q, 700, 420);
    assert.equal(stageLabelClash(stageBoxBounds(stageObjectBox(q, q.objects[0], T)), stageBoxBounds(stageObjectBox(q, q.objects[1], T))), 0);
    // a new object may stand ON a riser
    const withRiser = spAddObject(blank({ width: 24, depth: 16, unit: 'ft' }), 'riser', STAGE_NEW_SPOT).p;
    near(stageFreeSpot(withRiser, STAGE_NEW_SPOT, 'drum-kit').x, 0.5, 0.05);
    // the palette and "PLACE ON THE STAGE" both ask for the kind's own place
    const palette = code(`${SP}/stage/StagePalette.tsx`);
    assert.match(palette, /onAdd\(\(q, near\) => make\(q, stageFreeSpot\(q, near, kind\)\)\);/);
    assert.match(code(`${SP}/stage/stageLinks.ts`), /stageFreeSpot\(p, near, kind\)/);
  });

  it('a position button moves ONE axis: the other stays exactly where it was', () => {
    const base = blank({ width: 24, depth: 16, unit: 'ft' });
    const r = spAddObject(base, 'chair', { x: 0.5, y: 0.5 });
    // typed to a place between grid lines
    const typed = stageMoveExact(r.p, r.id, { x: 0.5, y: 0.6812 });
    assert.equal(spObject(typed, r.id)?.y, 0.6812);
    const left = spObject(stageNudge(typed, r.id, 1, 0), r.id)!;
    assert.equal(left.y, 0.6812, 'STAGE LEFT does not change the depth');
    near(left.x, 0.5 + 1 / 24, 1e-9);
    const up = spObject(stageNudge(typed, r.id, 0, -1), r.id)!;
    assert.equal(up.x, 0.5, 'UPSTAGE does not change the place across');
    near(up.y * 16, Math.round(up.y * 16), 1e-9);
    assert.ok(up.y < 0.6812);
  });

  it('the likely source comes first when a symbol is linked: its own kind, then the rest', () => {
    const p = tpl('four-piece');
    const amp = stageSourceChoices(p, 'guitar-amp');
    assert.equal(amp.length, p.sources.length, 'every source is offered');
    assert.equal(p.sources.find((x) => x.id === amp[0].id)?.category, 'guitars');
    assert.equal(p.sources.find((x) => x.id === stageSourceChoices(p, 'keyboard')[0].id)?.category, 'keys');
    // an acoustic piano is offered microphones first
    assert.equal(stagePackagesFor('piano')[0].id, 'piano-mics');
    // a drum kit is shown the drums, and the rest only behind SHOW EVERY SOURCE
    const kit = stageSourceChoices(p, 'drum-kit');
    const own = kit.filter((c) => c.match);
    assert.ok(own.length >= 1 && own.length < kit.length);
    for (const c of own) assert.equal(p.sources.find((x) => x.id === c.id)?.category, 'drums');
    assert.deepEqual(kit.slice(0, own.length), own, 'its own kind first');
    const palette = code(`${SP}/stage/StagePalette.tsx`);
    assert.match(palette, /existing\(everySource \? sources : ownKind,/);
    assert.match(palette, /label="SHOW EVERY SOURCE ▾"/);
    assert.match(palette, /setEverySource\(false\);\s*setStep\(\{ at: 'link', item \}\);/);
  });

  it('the list of objects reads upstage to downstage, stage right to stage left', () => {
    let p = blank();
    for (const [x, y] of [[0.8, 0.9], [0.2, 0.9], [0.5, 0.1], [0.1, 0.5]] as const) p = spAddObject(p, 'chair', { x, y }, { label: `${x},${y}` }).p;
    assert.deepEqual(stageListOrder(p.objects).map((o) => o.label), ['0.5,0.1', '0.1,0.5', '0.2,0.9', '0.8,0.9']);
    // a turn made from the list is the model's own
    const id = p.objects[0].id;
    assert.equal(spObject(spUpdateObject(p, id, { rot: -15 }), id)?.rot, 345);
  });
});

describe('the Stage screen', () => {
  const area = code(`${SP}/StageArea.tsx`);
  const plan = code(`${SP}/stage/StagePlanView.tsx`);
  const stageFiles = readdirSync(join(ROOT, SP, 'stage')).filter((f) => /\.tsx?$/.test(f));
  const all = [area, ...stageFiles.map((f) => code(`${SP}/stage/${f}`))].join('\n');

  it('is on the Rack Unit with FULL SCREEN, its lane bound to a real fader', () => {
    assert.match(area, /export function StageArea\(\)/);
    assert.match(area, /<RackUnit\b/);
    assert.match(area, /fullScreen: true/);
    assert.match(area, /initialParam="zoom"/);
    assert.match(area, /kind: 'fader',\s*id: 'zoom'/);
    assert.match(area, /useSpEditor\(\)/);
  });

  it('prints the four direction words, each on its own side, and cannot be flipped', () => {
    for (const w of ['UPSTAGE', 'AUDIENCE / DOWNSTAGE', 'STAGE RIGHT', 'STAGE LEFT']) assert.ok(plan.includes(w), w);
    // STAGE RIGHT is drawn in the left band, STAGE LEFT in the right band
    assert.match(plan, /<SvgText x=\{STAGE_FRAME\.side - 4\.5\}[^>]*>\s*STAGE RIGHT/);
    assert.match(plan, /<SvgText x=\{gw - STAGE_FRAME\.side \+ 4\.5\}[^>]*>\s*STAGE LEFT/);
    assert.match(plan, /y=\{gh - 5\}[^>]*>\s*AUDIENCE \/ DOWNSTAGE/);
    assert.doesNotMatch(all, /flip\w*\s*[:=(]|mirror\w*\s*[:=(]|scale\(\s*-1|scaleX/i, 'no flip control and no mirrored view');
  });

  it('the drawing has its accessibility decision, and takes its touches through one box', () => {
    // hidden from the accessibility tree: `aria-hidden` on the tag (the web),
    // plus the two native props on a phone (not DOM attributes: on the web they
    // were a console warning on every render)
    assert.match(plan, /<Svg aria-hidden \{\.\.\.SVG_HIDDEN_NATIVE\}/);
    assert.match(plan, /SVG_HIDDEN_NATIVE = Platform\.OS === 'web' \? \{\} : \(\{ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' \}/);
    assert.match(plan, /NO_SELECT = \(Platform\.OS === 'web' \? \{ userSelect: 'none' \} : null\)/);
    assert.match(plan, /accessible accessibilityLabel=\{a11y\}/);
    assert.match(plan, /<View pointerEvents="none">/);
    assert.match(plan, /touchToGlass\(e\.nativeEvent\.locationX, e\.nativeEvent\.locationY, st\.s\)/);
    assert.match(plan, /useStageTextScale\(\)/);
  });

  it('the selected object is told by a shape: a dashed ring and corner brackets', () => {
    assert.match(plan, /strokeDasharray="5 3"/);
    assert.match(plan, /ringCorners\.map\(/);
    assert.match(plan, /stageFacingPoint\(selBox/);
  });

  it('ADD opens as the kit’s popup (a tray in FULL SCREEN); VIEW is a tray under the drawing on both screens (bug test S2-12)', () => {
    for (const id of ['add', 'object']) assert.match(area, new RegExp(`<Sheet visible=\\{shown === '${id}'\\}`), `${id} has its popup`);
    // VIEW's switches change the drawing, so the drawing stays in sight: a tray, never a popup over it
    assert.doesNotMatch(area, /<Sheet visible=\{shown === 'view'\}/);
    assert.match(area, /\{ kind: 'group', id: 'view', label: 'VIEW', [\s\S]*?hideLane: true, render: \(\) => \(inFull \? viewTray : viewBody\) \}/);
    // one opener for the two: a button that opens the popup, or (in FULL
    // SCREEN, where a popup cannot be presented) a tray that folds the lane
    assert.match(area, /inFull \? \{ kind: 'group', id, label, valueLabel, valueA11y, hideLane: true, render \} : \{ kind: 'action', id, label, onPress: \(\) => setPanel\(id\) \}/);
    assert.match(area, /const shown = inFull \? null : panel;/);
    assert.match(area, /onFullScreen=\{setInFull\}/);
    assert.match(plan, /fullRef\.current\?\.\(true\);\s*return \(\) => fullRef\.current\?\.\(false\);/);
    assert.match(area, /opener\('add'/);
    assert.doesNotMatch(area, /opener\('view'/);
    // one scroll bar in a popup: the popup's own scroller is off where this area brings its own
    assert.match(area, /<Sheet visible=\{shown === 'add'\} title="Add to the stage" onClose=\{closePanel\} scroll=\{false\}>/);
    assert.match(area, /<Sheet visible=\{shown === 'object'\} title=\{sel \? selName : 'Choose an object'\} onClose=\{closePanel\} scroll=\{false\}>/);
  });

  it('OBJECT opens UNDER the drawing on both screens: the position and turn buttons are seen to work (B10)', () => {
    // a tray (the drawing stays pinned above it), never a popup over the stage
    // the second line is cut short (dockName); the whole name is said to a screen reader (bug test S2-13)
    assert.match(area, /\{ kind: 'group', id: 'object', label: 'OBJECT', valueLabel: sel \? dockName\(selName\)\.toUpperCase\(\) : 'NOTHING', valueA11y: sel \? `\$\{selName\} is selected` : 'nothing is selected', hideLane: true, render: objectTray \}/);
    assert.match(area, /const dockName = \(name: string\): string => \(name\.length > 12 \? `\$\{name\.slice\(0, 11\)\.trimEnd\(\)\}…` : name\);/);
    assert.doesNotMatch(area, /opener\('object'/);
    const tray = area.slice(area.indexOf('const objectTray = '), area.indexOf('const objectSheet = '));
    assert.match(tray, /<StageMovePad id=\{sel\.id\} \/>/);
    assert.match(tray, /label=\{inFull && detailsFor === sel\.id \? 'HIDE NAME, LINKS AND MORE' : 'NAME, LINKS AND MORE ›'\}/);
    assert.match(tray, /inFull \? setDetailsFor\(\(cur\) => \(cur === sel\.id \? null : sel\.id\)\) : setPanel\('object'\)/);
    assert.match(tray, /label="DESELECT"/);
    // the popup (and the FULL SCREEN tray) hold the rest: no position, no turn
    assert.match(area, /<StageInspector id=\{sel\.id\} part="details" onDone=\{closePanel\} \/>/);
    assert.match(area, /\{inFull && detailsFor === sel\.id \? <StageInspector id=\{sel\.id\} part="details" \/> : null\}/);
    const inspector = code(`${SP}/stage/StageInspector.tsx`);
    assert.match(inspector, /\{part === 'all' \? \(\s*<>\s*<Text style=\{styles\.heading\} accessibilityRole="header">\s*POSITION AND TURN\s*<\/Text>\s*<StageMovePad id=\{id\} \/>/);
    assert.equal((inspector.match(/<StageMovePad\b/g) ?? []).length, 1);
    // the popup's title is the name: it is not printed a second time under it
    assert.match(inspector, /\{part === 'all' \? \(\s*<Text style=\{styles\.name\} accessibilityRole="header">/);
    // two short labels at one height; the long words are in the line under them
    assert.match(inspector, /return `\$\{axis === 'x' \? 'Across' : 'Depth'\} \$\{unit === '%' \? '%' : `\(\$\{unit\}\)`\}`;/);
    assert.match(inspector, /Across is measured from the stage right edge \(the left of the drawing\)\. Depth is measured from the upstage edge \(the top\)\./);
    // the pad: eight buttons, each 44 points high, each with words and a spoken name
    const pad = code(`${SP}/stage/StageMovePad.tsx`);
    assert.equal((pad.match(/<PadButton /g) ?? []).length, 8);
    assert.match(pad, /button: \{ flex: 1, minHeight: 44,/);
    assert.match(pad, /accessibilityRole="button" accessibilityLabel=\{a11y\}/);
    for (const w of ['STAGE RIGHT', 'UPSTAGE', 'DOWNSTAGE', 'STAGE LEFT', 'FACE THE AUDIENCE', 'FACE UPSTAGE']) assert.ok(pad.includes(`word="${w}"`), w);
    assert.match(pad, /ed\.apply\(\(q\) => stageNudge\(q, id, dx, dy\)\)/);
    assert.match(pad, /ed\.apply\(\(q\) => spUpdateObject\(q, id, \{ rot \}\)\)/);
    // one wording for the same turn, in the dock and in the pad
    assert.match(area, /label: 'FACE THE AUDIENCE'/);
    assert.doesNotMatch(all, /FACE AUDIENCE/);
  });

  it('VIEW holds the four switches and nothing else; FULL SCREEN adds UNDO and REDO, which have no bar there', () => {
    const switches = area.slice(area.indexOf('const viewSwitches = ('), area.indexOf('const viewBody'));
    assert.equal((switches.match(/<Switch /g) ?? []).length, 4);
    assert.doesNotMatch(switches, /<Button /);
    // a SHORT scroller, so the tray leaves the drawing in sight (bug test S2-12)
    assert.match(area, /const viewBody: ReactNode = \(\s*<StageStepScroll stepKey="view" maxHeight=\{Math\.max\(110, Math\.round\(winH \* 0\.2\)\)\}>\s*<View style=\{styles\.tray\}>\{viewSwitches\}<\/View>\s*<\/StageStepScroll>\s*\);/);
    const tray = area.slice(area.indexOf('const viewTray'), area.indexOf('const commitTurn'));
    assert.match(tray, /label="UNDO"/);
    assert.match(tray, /label="REDO"/);
    assert.doesNotMatch(tray, /FIT STAGE/);
    assert.equal((area.match(/label: 'FIT STAGE'/g) ?? []).length, 1, 'FIT STAGE is under the ZOOM fader only');
  });

  it('the palette shows each kind’s own art before it is placed (B8)', () => {
    const palette = code(`${SP}/stage/StagePalette.tsx`);
    const key = code(`${SP}/stage/StageKey.tsx`);
    assert.match(palette, /<Pressable key=\{it\.kind\} onPress=\{\(\) => pick\(it\)\} style=\{.+?\} accessibilityRole="button" accessibilityLabel=\{`Add: \$\{it\.name\}`\}>\s*<StageKindIcon project=\{p\} kind=\{it\.kind\} \/>\s*<Text style=\{styles\.kindText\}>\{it\.name\.toUpperCase\(\)\}<\/Text>/);
    assert.match(palette, /kind: \{ minHeight: 46,/);
    // the same art as the stage and the key, hidden from a screen reader (the button says the name)
    const icon = key.slice(key.indexOf('export function StageKindIcon'));
    assert.match(icon, /<Svg aria-hidden \{\.\.\.SVG_HIDDEN_NATIVE\}/);
    assert.match(icon, /<StageObjectArt p=\{project\} o=\{sample\(kind\)\} [^>]*rot=\{spKeyRot\(kind\)\}/);
    // a package says what it assumes under its own heading (one colon a sentence)
    assert.match(palette, />\s*THIS PACKAGE ASSUMES\s*<\/Text>\s*<Text style=\{styles\.lead\}>\{pkg\.assumes\}<\/Text>/);
    assert.doesNotMatch(palette, /This package assumes:/);
  });

  it('a thing the first block already offers to place is not asked again in the review block', () => {
    assert.match(area, /const offered = new Set\(unplaced\.map\(\(u\) => `\$\{u\.kind\}:\$\{u\.id\}`\)\);/);
    assert.match(area, /ed\.issues\.filter\(\(i\) => i\.area === 'stage' && !\(\(i\.rule === 'performer-unplaced' \|\| i\.rule === 'source-unplaced'\) && offered\.has\(`\$\{i\.target\.kind\}:\$\{i\.target\.id\}`\)\)\);/);
    // the rules and their targets are the review's own
    const p = spRemoveObjects(tpl('four-piece'), tpl('four-piece').objects.filter((o) => o.kind === 'performer' || o.kind === 'drum-kit').map((o) => o.id));
    const offered = new Set(stageUnplaced(p).map((u) => `${u.kind}:${u.id}`));
    const repeats = spReview(p).filter((i) => i.area === 'stage' && (i.rule === 'performer-unplaced' || i.rule === 'source-unplaced'));
    assert.ok(repeats.length >= 2);
    for (const i of repeats) assert.ok(offered.has(`${i.target.kind}:${i.target.id}`), i.text);
  });

  it('every step of the palette starts at its top (the question is never out of view)', () => {
    const scroll = code(`${SP}/stage/StageStepScroll.tsx`);
    assert.match(scroll, /ref\.current\?\.scrollTo\(\{ y: 0, animated: false \}\);\s*\}, \[stepKey\]\);/);
    assert.match(scroll, /style=\{\{ maxHeight \}\}/);
    const palette = code(`${SP}/stage/StagePalette.tsx`);
    // the key changes with the step, the kind, the package, and each object added
    assert.match(palette, /const stepKey = step\.at === 'pick' \? `pick:\$\{added\.n\}` : step\.at === 'package' \? `package:\$\{step\.item\.kind\}:\$\{step\.pkg\.id\}` : `\$\{step\.at\}:\$\{step\.item\.kind\}`;/);
    assert.equal((palette.match(/return wrap\(/g) ?? []).length, 6, 'every step is drawn inside the scroller');
    // the object's popup starts at its top for each object
    assert.match(area, /<StageStepScroll stepKey=\{sel \? sel\.id : 'none'\} maxHeight=\{sheetH\}>/);
  });

  it('the palette and the inspector open no popup of their own (they are drawn inside one, and in the FULL SCREEN tray)', () => {
    for (const f of ['StagePalette.tsx', 'StageInspector.tsx', 'StageStepScroll.tsx']) {
      const src = code(`${SP}/stage/${f}`);
      assert.doesNotMatch(src, /\bSheet\b|\bHelpTip\b|\bModal\b|confirmDialog|notify\(/, f);
    }
  });

  it('a readout is short enough for its one line, and a place off the stage is never a negative number', () => {
    for (let r = 0; r < 360; r += 5) assert.ok(`${r}° · ${stageFacingShort(r)}`.length <= 36, `${r}: ${stageFacingShort(r)}`);
    assert.equal(stageFacingShort(185), 'upstage, toward stage left');
    assert.match(area, /drag the stage to slide`/);
    // (2026-11-13, on purpose: the stage is passed, so a stage in the round
    // says the turn from its reference side; the wording is still one function)
    assert.match(area, /format: \(v\) => `\$\{turnOf\(v\)\}° · \$\{stageFacingShort\(turnOf\(v\), p\.stage\)\}`/);
    const ft = blank({ width: 24, depth: 16, unit: 'ft' });
    assert.equal(stagePosWords(ft, { x: 0.5, y: 0.25 }), '12 ft from the stage right edge, 4 ft from the upstage edge');
    assert.equal(stageAxisWords(ft, 'y', -3 / 16), '3 ft behind the upstage edge');
    assert.equal(stageAxisWords(ft, 'y', 1 + 2 / 16), '2 ft in front of the downstage edge');
    assert.equal(stageAxisWords(ft, 'x', -3 / 24), '3 ft past the stage right edge');
    assert.equal(stageAxisWords(ft, 'x', 1 + 3 / 24), '3 ft past the stage left edge');
    const none = blank();
    assert.equal(stagePosWords(none, { x: 0.5, y: 1.1 }), '50% of the way across from stage right, 10% of the stage depth in front of the downstage edge');
    for (const p of [ft, none, blank({ width: 8, depth: 5, unit: 'm' })])
      for (const at of [{ x: -0.2, y: -0.2 }, { x: 1.2, y: 1.2 }, { x: 0.3, y: 0.3 }]) {
        assert.doesNotMatch(stagePosWords(p, at), /-\d/);
      }
  });

  it('uses the lab’s one name for each thing', () => {
    const shown = [area, ...['StagePalette.tsx', 'StageInspector.tsx', 'StageObjectList.tsx', 'StagePlanView.tsx'].map((f) => code(`${SP}/stage/${f}`))].join('\n');
    // a button is a button (Keys is an instrument); the view is "the drawing"
    assert.doesNotMatch(shown, /(nudge|position|turn|arrow|dock) keys?\b|row of keys|LET GO OF IT|footprint|band member|sound-system|[Ss]elf-contained\.|the picture\b|on the picture/);
    assert.match(shown, /label="DESELECT"/);
    assert.match(shown, /label="PLACE ON THE STAGE"/);
    assert.match(shown, /MONITOR ONLY: kept out of the audience mix/);
    assert.match(shown, /label="Who plays or sings it"/);
    assert.match(shown, /Symbols are drawings, not the real size of the equipment\./);
    // review 2: the drawing is seen from ABOVE, with the audience at the bottom
    assert.match(shown, /Stage plot, seen from above, with the audience at the bottom: stage right is on the left\./);
    assert.match(shown, /You are looking down on the stage, with the audience at the bottom: stage right is on your left\./);
    assert.doesNotMatch(shown, /seen from the audience|looking from the audience|as the audience sees the stage|view from the audience/);
    assert.match(shown, /A code in a rounded box \(M1, M2\) is a monitor mix\./);
    assert.doesNotMatch(shown, /round box/);
    assert.match(shown, /label="Nobody \(shared source\)"|'Nobody \(shared source\)'/);
    assert.doesNotMatch(shown, /Nobody yet|No performer \(shared source\)|band’s own rig|Band rig/);
    assert.match(shown, /It is part of the band monitor rig\./);
    // one drawn thing, one name: both microphone kinds are a "Microphone on a stand" in the list
    assert.equal(stageObjectKindName('vocal-mic'), 'Microphone on a stand');
    assert.equal(stageObjectKindName('mic-stand'), 'Microphone on a stand');
    assert.equal(stageObjectKindName('iem'), 'In-ear monitor equipment');
    assert.equal(stageObjectKindName('power'), 'Power location');
    assert.equal(stageObjectKindName('generic'), 'Other object');
    // the kind is printed in a row only when it is not the name already ("Congas · Congas")
    const list = code(`${SP}/stage/StageObjectList.tsx`);
    assert.match(list, /kind\.toLowerCase\(\) === name\.toLowerCase\(\) \? '' : kind/);
    // a short status line
    // (2026-11-13, on purpose: the stage is passed, so the words follow its shape)
    assert.match(shown, /\$\{sel \? `Selected: \$\{selName\} \(\$\{stageWhere\(sel, p\.stage\)\}, \$\{stageFacingWord\(sel\.rot, p\.stage\)\}\)\.` : 'Nothing is selected\.'\}/);
    // removing asks in place first, as the Inputs area does
    assert.match(shown, /<RemoveStep\s/);
  });

  it('keeps the house rules a ratchet would catch', () => {
    assert.doesNotMatch(all, /Alert\.alert|\.goBack\(|InteractionManager|AsyncStorage/);
    assert.doesNotMatch(all, /numberOfLines=\{1\}(?![^>]*fitValue)/);
    assert.doesNotMatch(all, /colour|centre|grey|metre|labell/);
    // every edit goes through the model: no file here changes a project by hand
    assert.doesNotMatch(all, /\.objects\.push\(|\.objects\.splice\(|objects\[\w+\]\s*=/);
  });
});

describe('the key under the stage (owner: it is always there, in the drawing)', () => {
  const KEY_TEMPLATES: SpTemplateId[] = ['blank', ...TEMPLATES];
  const WIDTHS = [366, 320, 250, 700];

  it('every kind of symbol on the stage has ONE cell, in the model’s order and with the model’s names', () => {
    for (const id of KEY_TEMPLATES) {
      const p = tpl(id);
      const entries = stageKeyEntries(p.objects);
      // the model's entries, in its order; the screen changes one name only
      assert.deepEqual(entries.map((e) => e.kind), spPlotKey(p.objects).map((e) => e.kind));
      for (const e of entries) assert.equal(e.name, e.kind === 'wedge' ? 'Wedge monitor (speaker side faces the performer)' : spPlotKey(p.objects).find((x) => x.kind === e.kind)?.name);
      for (const gw of WIDTHS) {
        const L = stageKeyLayout(entries, gw);
        assert.deepEqual(L.cells.map((c) => c.kind), entries.map((e) => e.kind), `${id} at ${gw}`);
        assert.deepEqual(L.cells.map((c) => c.name), entries.map((e) => e.name));
        // a name is never cut: its lines, joined, are the name
        for (const c of L.cells) assert.equal(c.lines.map((l) => l.text).join(' '), c.name);
      }
      // every kind that is drawn is in the key (a vocal microphone under "Microphone on a stand")
      for (const o of p.objects) assert.ok(entries.some((e) => e.kind === spKeyKind(o.kind)), `${id}: ${o.kind}`);
    }
    // the four-piece: guitar and bass amplifier are ONE entry
    const four = stageKeyEntries(tpl('four-piece').objects);
    assert.equal(four.length, 9);
    assert.equal(four.find((e) => e.kind === 'guitar-amp')?.name, 'Amplifier (guitar or bass)');
    assert.equal(four.some((e) => e.kind === 'bass-amp'), false);
  });

  it('the key’s wedge is turned as the wedges on the stage are: its speaker side toward the performer', () => {
    assert.equal(spKeyRot('wedge'), 180);
    assert.equal(spKeyRot('performer'), 0);
    const key = code(`${SP}/stage/StageKey.tsx`);
    assert.match(key, /rot: spKeyRot\(kind\),/);
    assert.match(key, /<StageObjectArt key=\{`a\$\{c\.kind\}`\} [^>]*rot=\{spKeyRot\(c\.kind\)\}/);
    // a new wedge on the stage faces the same way
    assert.equal(stageDefaultRot('wedge', { x: 0.5, y: 0.9 }), spKeyRot('wedge'));
    // on the screen the wedge is a rectangle with a grille: "wide side" would name nothing
    const words = stageKeyWords(stageKeyEntries([{ kind: 'wedge' }]));
    assert.equal(words, 'Key: Wedge monitor (speaker side faces the performer).');
    assert.doesNotMatch(code(`${SP}/stage/StagePlanView.tsx`), /spPlotKey\(/);
  });

  it('no cell is wider than the glass, no two cells share a place, and nothing runs off any edge', () => {
    for (const id of KEY_TEMPLATES)
      for (const gw of WIDTHS) {
        const L = stageKeyLayout(stageKeyEntries(tpl(id).objects), gw);
        for (const c of L.cells) {
          assert.ok(c.x >= 0 && c.x + c.w <= gw + 1e-6, `${id} ${gw}: ${c.name} is inside the glass`);
          assert.ok(c.y >= 0 && c.y + c.h <= L.height + 1e-6, `${id} ${gw}: ${c.name} is inside the strip`);
          // the art box and every line of the name are inside the cell
          assert.ok(c.artCx - STAGE_KEY_ART.w / 2 >= c.x - 1e-6 && c.artCy - STAGE_KEY_ART.h / 2 >= c.y - 1e-6 && c.artCy + STAGE_KEY_ART.h / 2 <= c.y + c.h + 1e-6);
          for (const l of c.lines) {
            assert.ok(l.x >= c.x + STAGE_KEY_ART.w, 'the name starts after the art');
            assert.ok(l.x + l.text.length * STAGE_KEY_FS * STAGE_KEY_CHAR_W <= gw + 1e-6, `${id} ${gw}: “${l.text}” ends inside the glass`);
            assert.ok(l.y > c.y && l.y < c.y + c.h, 'the baseline is inside the cell');
          }
        }
        for (let i = 0; i < L.cells.length; i++)
          for (let j = i + 1; j < L.cells.length; j++) {
            const a = L.cells[i];
            const b = L.cells[j];
            const apart = a.x + a.w <= b.x + 1e-6 || b.x + b.w <= a.x + 1e-6 || a.y + a.h <= b.y + 1e-6 || b.y + b.h <= a.y + 1e-6;
            assert.ok(apart, `${id} ${gw}: ${a.name} and ${b.name}`);
          }
        // the heading KEY stands alone at the left of the first row
        for (const c of L.cells.filter((x) => x.row === 0)) assert.ok(c.x >= L.heading.x + 'KEY'.length * STAGE_KEY_FS * 0.7, 'clear of the heading');
      }
  });

  it('the text is at least 9 points, and the art keeps its shape inside its box', () => {
    assert.ok(STAGE_KEY_FS >= 9);
    const key = code(`${SP}/stage/StageKey.tsx`);
    for (const m of key.matchAll(/fontSize=\{([^}]+)\}/g)) assert.equal(m[1], 'STAGE_KEY_FS');
    for (const it of SP_PALETTE) {
      const sym = spKeySymbol(it.kind);
      const u = stageKeyScale(sym.w, sym.h);
      assert.ok(sym.w * u <= STAGE_KEY_ART.w + 1e-6 && sym.h * u <= STAGE_KEY_ART.h + 1e-6, it.kind);
      assert.ok(Math.abs(sym.w * u - STAGE_KEY_ART.w) < 1e-6 || Math.abs(sym.h * u - STAGE_KEY_ART.h) < 1e-6, `${it.kind} fills one side of the box`);
    }
  });

  it('the salsa band’s key fits a 390-wide phone in at most four rows; the small examples in fewer', () => {
    const lay = (id: SpTemplateId, gw = stageGlassWidthGuess(390)) => stageKeyLayout(stageKeyEntries(tpl(id).objects), gw, 'NOT TO SCALE');
    const rows = (id: SpTemplateId) => lay(id).rows;
    assert.equal(stageGlassWidthGuess(390), 366);
    assert.ok(rows('salsa') <= 4, `salsa: ${rows('salsa')} rows`);
    assert.ok(rows('four-piece') <= 4, `four-piece: ${rows('four-piece')} rows`);
    assert.ok(rows('solo') <= 2, `solo: ${rows('solo')} rows`);
    for (const id of TEMPLATES) {
      const h = lay(id).height;
      assert.ok(h <= 95, `${id}: the key is ${h} tall`);
      // …so the stage floor keeps its size: on a 390 × 844 phone the rack
      // gives the display 351 points, and the floor (as wide as the glass
      // lets it be) needs its own height plus the two direction bands
      const p = tpl(id);
      const floor = stageTransformFor(p, 366, 351 - h);
      const widest = stageTransformFor(p, 366, 2000);
      near(floor.kx, widest.kx, 1e-6);
      assert.ok(floor.kx >= 300 && floor.ky >= 185, `${id}: the floor is ${Math.round(floor.kx)} × ${Math.round(floor.ky)}`);
    }
    // a wider glass never needs more rows
    for (const id of TEMPLATES) assert.ok(lay(id, 700).rows <= rows(id));
    // a long name is set on two or three lines of about the same length, never cut
    const wedge = lay('four-piece').cells.find((c) => c.kind === 'wedge');
    assert.ok(wedge && wedge.lines.length >= 2 && wedge.lines.length <= 3);
    assert.equal(wedge.lines.map((l) => l.text).join(' '), 'Wedge monitor (speaker side faces the performer)');
  });

  it('an empty stage still shows the heading and says so, so the place of the key is learned', () => {
    const L = stageKeyLayout([], 366);
    assert.equal(L.rows, 1);
    assert.equal(L.cells.length, 0);
    assert.equal(L.empty?.text, 'Nothing is on the stage yet.');
    assert.equal(STAGE_KEY_EMPTY, 'Nothing is on the stage yet.');
    assert.ok(L.height >= 24);
    assert.equal(L.heading.text, 'KEY');
    assert.equal(stageKeyWords([]), 'Key: nothing is on the stage yet.');
  });

  it('the strip’s height is what the rack is told, and what the drawing takes from the stage', () => {
    const p = tpl('salsa');
    const L = stageKeyLayout(stageKeyEntries(p.objects), 366);
    // the height is the rows it drew: the last cell's bottom, plus the foot
    const bottom = Math.max(...L.cells.map((c) => c.y + c.h));
    assert.ok(L.height > bottom && L.height - bottom <= 6);
    assert.ok(stageKeyLayout([], 366).height < L.height, 'one row is a shorter strip than three');
    assert.ok(stageKeyLayout(stageKeyEntries(p.objects), 250).height > L.height, 'a narrower glass needs more rows, and says so in its height');
    assert.deepEqual(stageKeyLayout(stageKeyEntries(p.objects), 366), L, 'the same every time');
    const area = code(`${SP}/StageArea.tsx`);
    const plan = code(`${SP}/stage/StagePlanView.tsx`);
    // the area tells the rack: the usual display height PLUS the key's height
    assert.match(area, /const keyHeight = Math\.ceil\(stageKeyLayout\(stageKeyEntries\(p\.objects\), stageGlassWidthGuess\(winW\), scaleNote\)\.height\);/);
    // the key asks the rack for no more than its share (bug test S1-01)
    assert.match(area, /const phoneHeight = stageBase \+ Math\.min\(keyHeight, Math\.round\(\(stageBase \* STAGE_KEY_SHARE\) \/ \(1 - STAGE_KEY_SHARE\)\)\);/);
    // …and nothing else: no readout row and no line under the glass, so the
    // rack gives their height to the glass, and the key does not cost the stage
    assert.match(area, /stage=\{\{ render: stage, size: 'L', phoneHeight, minWell, hideDragTag: true, fullScreen: true \}\}/);
    assert.doesNotMatch(area, /\bbezel\b|\bbadge\b|BezelItem/);
    // the drawing lays the same key out for its real width, and the stage takes the height above it
    assert.match(plan, /const keyEntries = useMemo\(\(\) => stageKeyEntries\(p\.objects\), \[p\.objects\]\);/);
    assert.match(plan, /const keyLayout = useMemo\(\(\) => stageKeyLayout\(keyEntries, gw, scaleNote\), \[keyEntries, gw, scaleNote\]\);/);
    assert.match(plan, /const split = stageKeySplit\(ghAll, keyLayout\.height\);/);
  });

  it('the scale words are in the key’s heading row, at its right end, inside the drawing', () => {
    assert.equal(stageScaleNote(blank()), 'NOT TO SCALE');
    assert.equal(stageScaleNote(blank({ width: 24, depth: 16, unit: 'ft', dims: 'estimated' })), '24 × 16 ft · ESTIMATED');
    assert.equal(stageScaleNote(blank({ width: 8, depth: 5, unit: 'm', dims: 'confirmed' })), '8 × 5 m · CONFIRMED');
    assert.equal(stageScaleNote(blank({ width: 24, depth: null })), 'NOT TO SCALE', 'half a size is no size');
    for (const id of KEY_TEMPLATES)
      for (const gw of WIDTHS)
        for (const note of ['NOT TO SCALE', '24 × 16 ft · ESTIMATED']) {
          const L = stageKeyLayout(stageKeyEntries(tpl(id).objects), gw, note);
          assert.equal(L.note?.text, note);
          // right-aligned at the strip's right edge, on the heading's own line
          assert.ok((L.note?.x ?? 0) <= gw && (L.note?.x ?? 0) >= gw - 8);
          assert.equal(L.note?.y, L.heading.y);
          // the first row's cells stop before the words begin (0.62 of the size per letter is their bound)
          const noteLeft = (L.note?.x ?? 0) - note.length * STAGE_KEY_FS * 0.62;
          for (const c of L.cells.filter((x) => x.row === 0)) assert.ok(c.x + c.w <= noteLeft + 1e-6 || gw < 300, `${id} ${gw}: ${c.name} is clear of “${note}”`);
          // every entry is still there, once
          assert.equal(L.cells.length, stageKeyEntries(tpl(id).objects).length);
        }
    assert.equal(stageKeyLayout([], 366).note, null);
    const key = code(`${SP}/stage/StageKey.tsx`);
    assert.match(key, /\{layout\.note\.text\}/);
    assert.match(key, /textAnchor="end"/);
    // the well keeps the sentence the line under the glass used to carry
    const area = code(`${SP}/StageArea.tsx`);
    assert.equal((area.match(/Symbols are drawings, not the real size of the equipment\./g) ?? []).length, 2);
    assert.match(area, /NOT TO SCALE: the stage width and depth are not both set in Setup/);
  });

  it('with no readout row, the selection is still named: on the drawing, in the well, and on the OBJECT button’s second line (on both screens)', () => {
    const area = code(`${SP}/StageArea.tsx`);
    const plan = code(`${SP}/stage/StagePlanView.tsx`);
    assert.match(area, /id: 'object', label: 'OBJECT', valueLabel: sel \? dockName\(selName\)\.toUpperCase\(\) : 'NOTHING',/);
    assert.match(area, /objects`\} on the stage\. \$\{sel \? `Selected: \$\{selName\} \(/);
    // the selected object's name is kept even on a crowded stage (stageLabelPlan's `selected`)
    assert.match(plan, /selected: o\.id === selectedId,/);
    // the selected object's label is drawn even when it has no name, or names are switched off
    assert.match(plan, /text: o\.id === selectedId \? stageListName\(p, o\) : showNames \? stageName\(p, o\) : '',/);
    assert.match(plan, /fill=\{isSel \? AMBER : '#f1f2f5'\}/);
  });

  it('is part of the drawing: always drawn, not touchable, one sentence for a screen reader', () => {
    const plan = code(`${SP}/stage/StagePlanView.tsx`);
    const key = code(`${SP}/stage/StageKey.tsx`);
    const area = code(`${SP}/StageArea.tsx`);
    // drawn every time, by the drawing itself (so it is in FULL SCREEN too), with no condition round it
    assert.match(plan, /<\/View>\s*(?:\{\}\s*)?<StageKey project=\{p\} entries=\{keyEntries\} layout=\{keyLayout\} w=\{w\} gw=\{gw\} shownH=\{split\.scrolls \? split\.key \* s : undefined\} \/>\s*<\/View>\s*\);/);
    assert.equal((plan.match(/<StageKey\b/g) ?? []).length, 1);
    // not a popup, not behind a switch
    assert.doesNotMatch(key, /\bSheet\b|\bModal\b|\bSwitch\b|useState|Pressable|panHandlers|onPress/);
    assert.doesNotMatch(area, /showKey|Key on the drawing/);
    // it is a box of its own UNDER the box that takes the drags
    assert.ok(plan.indexOf('.panHandlers') < plan.indexOf('<StageKey'), 'the key comes after the drag surface');
    assert.match(plan, /\{\.\.\.pan\.panHandlers\} accessible accessibilityLabel=\{a11y\}>\s*(?:\{\}\s*)?<GestureExclusionZone maxHeightDp=\{STAGE_BAND_DP\} \/>/);
    assert.match(key, /<View pointerEvents="none">\s*<Svg aria-hidden \{\.\.\.SVG_HIDDEN_NATIVE\}/);
    // one labeled element: "Key: Performer, Drum kit, …"
    assert.match(key, /const label = layout\.note \? `\$\{stageKeyWords\(entries\)\} \$\{scaleWords\(layout\.note\.text\)\}` : stageKeyWords\(entries\);/);
    assert.equal((key.match(/accessible accessibilityRole="text" accessibilityLabel=\{label\}/g) ?? []).length, 2, 'one sentence, whether the strip scrolls or not');
    // a long key on a short phone SCROLLS inside the display (bug test S1-01): never cut, never a popup
    assert.match(key, /if \(shownH != null && shownH < h - 0\.5\) \{/);
    // (round 2, R2-SP1-05: an Animated scroller, so "▼ MORE" fades at the end with no state)
    assert.match(key, /<Animated\.ScrollView\s+style=\{\{ width: w, height: shownH \}\}\s+nestedScrollEnabled\s+showsVerticalScrollIndicator\s+persistentScrollbar/);
    const words = stageKeyWords(stageKeyEntries(tpl('four-piece').objects));
    assert.match(words, /^Key: Performer, Drum kit, /);
    assert.match(words, /Wedge monitor \(speaker side faces the performer\)/);
    assert.doesNotMatch(words, /wide side/);
    // the SAME art as the stage, and the model's key symbol for its size
    assert.match(key, /<StageObjectArt\b/);
    assert.match(key, /spKeySymbol\(c\.kind\)/);
    assert.match(key, />\s*KEY\s*<\/SvgText>/);
  });
});

describe('the Stage screen guide', () => {
  const g: ScreenGuide = SP_GUIDE_STAGE;
  const words = (s: string) => s.trim().split(/\s+/).length;
  const keys = SCREEN_GUIDE_SECTIONS.map((s) => s.key);
  const text = [g.intro?.learning ?? '', g.intro?.start ?? '', ...keys.flatMap((k) => g[k])].join('\n');

  it('has the intro card and five sections inside their budgets', () => {
    assert.ok(g.intro);
    assert.ok(words(g.intro.learning) <= SCREEN_INTRO_WORDS.learning, `learning: ${words(g.intro.learning)} words`);
    assert.ok(words(g.intro.start) <= SCREEN_INTRO_WORDS.start, `start: ${words(g.intro.start)} words`);
    for (const s of SCREEN_GUIDE_SECTIONS) {
      const items = g[s.key];
      assert.ok(items.length >= 1 && items.length <= 5, `${s.key}: ${items.length} bullets`);
      for (const it of items) assert.ok(it.trim().length > 20);
      if (s.key === 'tryThis') {
        assert.ok(items.length >= 2 && items.length <= 3);
        for (const it of items) assert.ok(it.length <= SCREEN_GUIDE_BUDGET.tryItem, `tryThis item: ${it.length} characters`);
      } else {
        const total = items.join('\n').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        assert.ok(total <= cap, `${s.key}: ${total} characters (cap ${cap})`);
      }
    }
  });

  it('follows the house copy rules: your voice, knowledge not skills, US spelling, no citations', () => {
    assert.match(text, /\byou(r)?\b/i);
    assert.doesNotMatch(text, /you(’|')ll (master|build|mix)|you will be able to/i);
    assert.doesNotMatch(text, /colour|behaviour|centre|programme|grey|organis|recognis/i);
    assert.doesNotMatch(text, /research shows|studies show|according to|survey/i);
    assert.doesNotMatch(g.teaches.join('\n'), /this screen (shows|lists|contains)/i);
    assert.doesNotMatch(text, /\bat once\b|production ready|\bfree\b/i);
    // a button is never a "key" (Keys is an instrument), and the view is "the drawing"
    assert.doesNotMatch(text, /\bkeys?\b|the picture|footprint/);
  });

  it('names only controls the screen really has', () => {
    const src = [code(`${SP}/StageArea.tsx`), code(`${SP}/stage/StagePlanView.tsx`), code(`${SP}/stage/StageKey.tsx`)].join('\n');
    const caps = new Set<string>();
    for (const line of [...g.control, ...g.seeing, g.intro?.start ?? '']) for (const m of line.matchAll(/\b[A-Z]{3,}(?: \/ [A-Z]{3,}| [A-Z]{3,})*\b/g)) caps.add(m[0]);
    assert.ok(caps.size >= 6, [...caps].join(', '));
    for (const c of caps) assert.ok(src.includes(c), `the guide quotes ${c}; the screen has no such label`);
  });

  it('shares no line with the guide of another work area', async () => {
    const dir = join(ROOT, SP, 'guides');
    const mine = new Set(keys.flatMap((k) => g[k]));
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts') && x !== 'stage.ts')) {
      if (!existsSync(join(dir, f))) continue;
      const mod = (await import(pathToFileURL(join(dir, f)).href)) as Record<string, ScreenGuide>;
      for (const other of Object.values(mod)) {
        if (!other || typeof other !== 'object' || !Array.isArray(other.seeing)) continue;
        for (const k of keys) for (const line of other[k] ?? []) assert.equal(mine.has(line), false, `${f} has the same line: ${line}`);
      }
    }
  });
});
