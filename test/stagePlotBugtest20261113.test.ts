/**
 * Stage Plot and Channel Designer — the bug test of 2026-11-13 (testers SP1:
 * Library, Setup, Stage; SP2: Inputs, Monitors, Export and the PDF). One
 * test per fixed bug, each written so that it FAILED on the code the testers
 * used. The owner's bar: a control passes only if it does its job, so these
 * check what the band and the venue would see (the review list, the packet's
 * words, the numbers, the layout), not that a function was called.
 *
 * Reports: docs/labs/bugtest_2026_11_13/BUGTEST_STAGEPLOT_1_*.md and _2_*.md.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spMonitorTotals, spOpenItems, spTextSummary } from '../src/features/stageplot/spDerive.ts';
import { spHistoryApply, spHistoryStart, spHistoryUndo } from '../src/features/stageplot/spHistory.ts';
import {
  spAddMix,
  spAddObject,
  spAddPackage,
  spAddPerformer,
  spAddSource,
  spDuplicateObject,
  spEdit,
  spMarkReady,
  spMonoLabel,
  spPairRestore,
  spPatch,
  spRemoveInput,
  spRemoveObjects,
  spSetNeed,
  spSetReserved,
  spSetStageView,
  spStereoToMono,
  spUpdateMix,
  spUpdatePerformer,
} from '../src/features/stageplot/spModel.ts';
import { SP_PLOT_NOMINAL_W, spBuildDoc, spBuildSnapshot, spDocText, spLabelBlock, spPlotDoc, spPlotScale } from '../src/features/stageplot/spPacket.ts';
import { spPdfBytes, spPdfPageCount } from '../src/features/stageplot/spPdf.ts';
import { spCanMarkReady, spGuidedSteps, spReview } from '../src/features/stageplot/spReview.ts';
import { spSymbol } from '../src/features/stageplot/spSymbols.ts';
import { spFromTemplate, type SpTemplateId } from '../src/features/stageplot/spTemplates.ts';
import type { SpPacketKind, SpPaper, SpProject } from '../src/features/stageplot/spTypes.ts';
import { spMonoChoice } from '../src/screens/lab/stageplot/inputs/inputsLogic.ts';
import { spmBringsLine, spmClickNotes, spmSuggestName } from '../src/screens/lab/stageplot/monitors/monitorPlan.ts';
import { runIssueAction } from '../src/screens/lab/stageplot/spIssueActions.ts';
import {
  STAGE_KEY_MIN_SHOWN,
  STAGE_KEY_SHARE,
  STAGE_SIZE_MAX,
  STAGE_VIEW_FIT,
  stageDrawOrder,
  stageFrameBoxes,
  stageLabelPlan,
  stageKeySplit,
  stageObjectBox,
  stagePosFraction,
  stagePosValue,
  stageSizeFraction,
  stageTransformFor,
  stageTypedWords,
} from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import { stageBadges, stageName, stageUnplaced } from '../src/screens/lab/stageplot/stage/stageLinks.ts';

// spStore reads the device's storage: it is loaded with the same in-memory
// stand-in the store's own tests use (stagePlotStore.test.ts)
const ASYNC_STORAGE = '@react-native-async-storage/async-storage';
const STUB_URL = 'ape-test:async-storage-stageplot-bugtest';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === ASYNC_STORAGE) return { url: STUB_URL, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const f = path.resolve(base, specifier + ext);
        if (existsSync(f)) return { url: pathToFileURL(f).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STUB_URL) return { format: 'module', shortCircuit: true, source: 'const mem = new Map(); export default { async getItem(k) { return mem.has(k) ? mem.get(k) : null; }, async setItem(k, v) { mem.set(k, v); }, async removeItem(k) { mem.delete(k); } };' };
    return next(url, context);
  },
});
const { spDayFromText, spLooksLikeTime, spStageSizeFromText } = await import('../src/features/stageplot/spStore.ts');

const NOW = Date.UTC(2026, 10, 13, 12, 0);
const tpl = (id: SpTemplateId): SpProject => spFromTemplate(id, { id: `p-${id}`, now: NOW, band: 'The Example' });
const docOf = (p: SpProject, paper: SpPaper = 'letter', packet: SpPacketKind = 'full') => spBuildDoc(spBuildSnapshot(p, { paper, packet }, NOW));
const src = (f: string): string => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SP = 'screens/lab/stageplot';
const inputNamed = (p: SpProject, label: string) => {
  const i = p.inputs.find((x) => x.label === label);
  assert.ok(i, `no input "${label}"`);
  return i;
};

describe('SP2 bug 1 (S1): a reserved channel an input sits on', () => {
  const reserved = () => spSetReserved(tpl('four-piece'), 'house', [2, 5, 6, 40]);

  it('is a review question that blocks "Ready to advance", like a duplicate channel', () => {
    const p = reserved();
    const house = spPatch(p, 'house');
    assert.ok(house);
    const used = house.order.filter((id) => [2, 5, 6].includes(house.numbers[id] ?? -1));
    assert.equal(used.length, 3, 'the four-piece has inputs on 2, 5 and 6');
    const issues = spReview(p).filter((i) => i.rule === 'reserved-channel-used');
    assert.equal(issues.length, 3);
    for (const i of issues) {
      assert.equal(i.level, 'block');
      assert.equal(i.area, 'inputs');
      assert.match(i.text, /^House system: channel \d+ is kept free on purpose, and .+ is on it\./);
      assert.deepEqual(i.actions, ['renumber', 'unreserve', 'edit']);
    }
    assert.equal(spCanMarkReady(spReview(p)), false);
    // a reservation nobody uses asks nothing
    assert.equal(spReview(spSetReserved(tpl('four-piece'), 'house', [40])).filter((i) => i.rule === 'reserved-channel-used').length, 0);
  });

  it('the packet never prints a used channel as "kept free"', () => {
    const text = spDocText(docOf(reserved()));
    assert.ok(text.includes('House system: channels kept free on purpose: 40.'), 'only the free one');
    assert.doesNotMatch(text, /channels kept free on purpose: [^.]*\b(2|5|6)\b/);
    // nothing free: no "kept free" line (the question itself is printed under "To correct")
    const one = spDocText(docOf(spSetReserved(tpl('four-piece'), 'house', [2])));
    assert.doesNotMatch(one, /channels kept free on purpose/);
    assert.match(one, /To correct before this document is ready:\n- House system: channel 2 is kept free on purpose, and Snare is on it\./);
  });

  it('each answer settles it: renumber keeping them free, or stop keeping the channel free', () => {
    let p = reserved();
    const ed = { get project() { return p; }, apply: (f: (q: SpProject) => SpProject) => void (p = f(p)), goTo: () => undefined };
    const first = spReview(p).find((i) => i.rule === 'reserved-channel-used');
    assert.ok(first);
    runIssueAction(ed, first, 'unreserve');
    assert.equal(spReview(p).filter((i) => i.rule === 'reserved-channel-used').length, 2, 'that channel is no longer reserved');
    const next = spReview(p).find((i) => i.rule === 'reserved-channel-used');
    assert.ok(next);
    runIssueAction(ed, next, 'renumber');
    assert.equal(spReview(p).filter((i) => i.rule === 'reserved-channel-used').length, 0);
  });
});

describe('SP1 S1-01 (S1): the stage keeps its room on a short phone; the key stays in the drawing', () => {
  it('the key takes at most its share of the display, and scrolls past it', () => {
    // 375 × 667: a display of about 200 glass units, a key of 104 (15 kinds)
    const s = stageKeySplit(200, 104);
    assert.ok(s.key <= 200 * STAGE_KEY_SHARE * 1.12 + 1e-9);
    assert.ok(s.stage >= 200 * (1 - STAGE_KEY_SHARE * 1.12) - 1e-9, `the stage keeps ${s.stage}`);
    assert.equal(s.scrolls, true, 'the rest of the key scrolls inside the display, nothing is cut');
    // a short key is shown whole and does not scroll
    assert.deepEqual(stageKeySplit(300, 50), { stage: 250, key: 50, scrolls: false });
    // a key only a little over its share is shown whole (no scroll by a few points)
    assert.equal(stageKeySplit(200, 200 * STAGE_KEY_SHARE + 3).scrolls, false);
    // and never less than its heading row and one row of kinds
    assert.ok(stageKeySplit(80, 200).key >= STAGE_KEY_MIN_SHOWN);
  });

  it('the key is never a popup or a switch; a short phone gives the stage the room the well kept', () => {
    const key = src(`${SP}/stage/StageKey.tsx`);
    assert.doesNotMatch(key, /\bSheet\b|\bModal\b|\bSwitch\b/);
    assert.match(key, /▼ MORE/);
    const area = src(`${SP}/StageArea.tsx`);
    assert.match(area, /const minWell = winH >= 900 \? Math\.round\(winH \* 0\.3\) : winH < 760 \? 48 : 110;/);
  });
});

describe('SP1 S2-02: removing an instrument symbol asks about its inputs', () => {
  it('a drum kit with no symbol is "in the input list but not on the stage"; a vocal its singer carries is not asked about', () => {
    const p = tpl('four-piece');
    const kit = p.objects.find((o) => o.kind === 'drum-kit');
    assert.ok(kit);
    const q = spRemoveObjects(p, [kit.id]);
    const ask = spReview(q).find((i) => i.rule === 'source-unplaced');
    assert.ok(ask, 'the review asks');
    // round 2 (R2-SP2-05): named from the source WITH its own rows
    assert.match(ask.text, /^Drum kit is not on the stage, and its inputs Kick, .+ are in the input list\./);
    assert.ok(stageUnplaced(q).some((u) => u.kind === 'source' && u.name === 'Drum kit'), 'NOT ON THE STAGE YET offers it');
    // a voice is carried by its singer: the figure stands for it
    const mic = p.objects.find((o) => o.kind === 'vocal-mic');
    assert.ok(mic);
    assert.equal(spReview(spRemoveObjects(p, [mic.id])).filter((i) => i.rule === 'source-unplaced').length, 0);
  });
});

describe('SP1 S2-03: a performer named without their mix code', () => {
  it('stands clear of every other label, and the screen says the code is left out', () => {
    // (since the salsa example was re-spaced, held item 2026-11-13, a 390-wide
    // phone shows every code: the names shown alone are on a 375 × 667
    // phone's glass, 351 units wide)
    for (const [gw, gh] of [
      [351, 230],
      [351, 250],
    ]) {
      const p = tpl('salsa');
      const T = stageTransformFor(p, gw, gh, STAGE_VIEW_FIT);
      const order = stageDrawOrder(p.objects);
      const boxes = order.map((o) => stageObjectBox(p, o, T));
      const items = order.map((o, i) => ({ id: o.id, text: stageName(p, o), badges: stageBadges(p, o), box: boxes[i], person: o.kind === 'performer' }));
      const f = stageFrameBoxes(gw, gh);
      const plan = stageLabelPlan(items, gw, gh, [f.top, f.bottom, f.left, f.right]);
      const gap = (a: { x0: number; y0: number; x1: number; y1: number }, b: typeof a) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
      assert.ok(plan.bare.length > 0, 'the salsa stage has names shown alone on the smaller phone');
      for (const id of plan.bare) {
        const me = plan.labels.find((l) => l.id === id);
        assert.ok(me);
        // never touching another label; well apart (8 units) where any place
        // keeps the hard rules (at this crowded size not every name has one)
        for (const l of plan.labels) if (l.id !== id) assert.ok(gap(me.box, l.box) > 2, `${gw}×${gh}: ${id} is ${gap(me.box, l.box).toFixed(1)} from another label`);
      }
    }
    const plan = src(`${SP}/stage/StagePlanView.tsx`);
    assert.match(plan, /const codesOut = showNumbers \? plan\.bare\.length : 0;/);
  });
});

describe('frame fixer, 2026-11-13: an area’s intro card belongs to that area', () => {
  it('the editor has one guide host per area (keyed by it), so a card owed or up in Setup is dropped, not carried, when the Stage tab opens', () => {
    const screen = src(`${SP}/StagePlotLabScreen.tsx`);
    assert.match(screen, /<ScreenGuideHost key=\{area\} resetKey=\{area\} regions=\{area === 'stage'\}>/);
    // the header that offers the card is inside that host, and takes the area's own guide
    const host = screen.indexOf('<ScreenGuideHost key={area}');
    const header = screen.indexOf('<LabHeader title={TITLE} subtitle={headerName} guide={GUIDES[area]}');
    assert.ok(host > 0 && header > host && header < screen.indexOf('</ScreenGuideHost>', host));
  });
});

describe('held item (S2-03): the salsa example gives every performer’s name and mix code clear room', () => {
  // THE DISTANCES (glass units on the phone, points on the plot document):
  //   • BESIDE, on the same row: at least 8, twice the 4 that joins a name to
  //     its own code (NAME_GAP; the plot's own gap is 4 too). Closer than that,
  //     a neighbor's code reads as this name's ("Marisol M6" was 4 apart).
  //   • in ANY direction (a row above or below): at least 4.5 on the phone and
  //     5.5 pt on the plot, about twice the 2.5 between the lines of one name.
  const ROW = 8;
  const ANY_PHONE = 4.5;
  const ANY_PLOT = 5.5;
  type B = { x0: number; y0: number; x1: number; y1: number };
  const apart = (a: B, b: B) => ({ d: Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1)), sameRow: Math.max(0, a.y0 - b.y1, b.y0 - a.y1) === 0 });

  it('on a 390 × 844 phone: every performer shows the name and the code, clear of every other object’s label', () => {
    // the stage glass of a 390-wide phone is 366 wide; its height depends on the key
    for (const gh of [250, 280, 300]) {
      const gw = 366;
      const p = tpl('salsa');
      const T = stageTransformFor(p, gw, gh, STAGE_VIEW_FIT);
      const order = stageDrawOrder(p.objects);
      const boxes = order.map((o) => stageObjectBox(p, o, T));
      const items = order.map((o, i) => ({ id: o.id, text: stageName(p, o), badges: stageBadges(p, o), box: boxes[i], person: o.kind === 'performer' }));
      const f = stageFrameBoxes(gw, gh);
      const plan = stageLabelPlan(items, gw, gh, [f.top, f.bottom, f.left, f.right]);
      assert.deepEqual(plan.bare, [], `${gw}×${gh}: no performer is named without the mix code`);
      const name = (id: string) => p.objects.find((o) => o.id === id)?.label;
      for (const o of p.objects.filter((x) => x.kind === 'performer')) {
        const me = plan.labels.find((l) => l.id === o.id);
        assert.ok(me && me.badges.length === 1 && /^M\d$/.test(me.badges[0].text), `${o.label}: name and mix code`);
        for (const other of plan.labels) {
          if (other.id === o.id) continue;
          const r = apart(me.box, other.box);
          assert.ok(r.d >= (r.sameRow ? ROW : ANY_PHONE), `${gw}×${gh}: ${o.label} is ${r.d.toFixed(1)} from ${name(other.id)}${r.sameRow ? ' on the same row' : ''}`);
        }
      }
    }
  });

  it('on the printed plot (one plot for Letter and A4; the usual and the roomy plot-only drawing): the same, and at most one name on a leader', () => {
    const p = tpl('salsa');
    for (const how of [{}, { roomy: true }]) {
      const plot = spPlotDoc(p, how);
      const k = spPlotScale(plot, SP_PLOT_NOMINAL_W);
      const labs = plot.items
        .map((it) => {
          const b = spLabelBlock(it);
          if (!b.h) return null;
          const x0 = it.labelAt.x * k - b.labelW / 2;
          const y0 = it.labelAt.y * k;
          return { it, box: { x0, y0, x1: x0 + b.w, y1: y0 + b.h } };
        })
        .filter((x): x is NonNullable<typeof x> => !!x);
      const people = labs.filter((l) => l.it.person);
      assert.equal(people.length, 12);
      for (const me of people) {
        assert.ok(me.it.label && me.it.badges.length === 1, `${me.it.label}: name and mix code`);
        for (const other of labs) {
          if (other.it.id === me.it.id) continue;
          const r = apart(me.box, other.box);
          assert.ok(r.d >= (r.sameRow ? ROW : ANY_PLOT), `${JSON.stringify(how)}: ${me.it.label} is ${r.d.toFixed(1)} pt from ${other.it.label || other.it.badges.join(' ')}`);
        }
      }
      // at most one performer's name stands off on a leader (it was four)
      assert.ok(people.filter((l) => l.it.leader).length <= 1);
    }
  });

  it('it is still a salsa stage: front line downstage, rhythm section behind it, horns stage left, the piano where it was', () => {
    const p = tpl('salsa');
    const at = (label: string) => {
      const o = p.objects.find((x) => x.label === label);
      assert.ok(o, label);
      return o;
    };
    const front = ['Tito', 'Marisol', 'Yolanda'].map(at);
    assert.ok(front[0].x < front[1].x && front[1].x < front[2].x, 'the lead between the two coros');
    assert.ok(Math.abs(front[1].x - 0.5) <= 0.021, 'the lead at center');
    for (const r of ['Nelson', 'Chino', 'Papo', 'Luisito'].map(at)) for (const f of front) assert.ok(r.y < f.y - 0.15);
    for (const h of ['Carmen', 'Iván', 'Beto', 'Ana'].map(at)) assert.ok(h.x > 0.66, 'horns stage left');
    assert.ok(at('Beto').y > at('Carmen').y && at('Ana').y > at('Iván').y, 'trombones in front of the trumpets');
    assert.deepEqual([at('Rafa').x, at('Rafa').y, at('Piano').x, at('Piano').y, at('Wedge 6').x, at('Wedge 6').y], [0.08, 0.5, 0.16, 0.5, 0.08, 0.67]);
  });
});

describe('SP1 S2-04: Snap (never printed) is not an edit of the document', () => {
  it('toggling Snap, or the grid of a plot not to scale, keeps a Ready revision Ready and is no undo step', () => {
    const ready = spMarkReady(tpl('solo'));
    const h = spHistoryStart(ready);
    for (const patch of [{ snap: !ready.stage.snap }, { grid: !ready.stage.grid }]) {
      const next = spSetStageView(ready, patch);
      assert.equal(next.revision, ready.revision);
      assert.equal(next.status, 'ready');
      const h2 = spHistoryApply(h, next);
      assert.notEqual(h2, h, 'the switch takes effect');
      assert.equal(h2.past.length, 0, 'no undo step');
      assert.equal(h2.present.stage.snap, next.stage.snap);
      assert.equal(h2.present.stage.grid, next.stage.grid);
    }
    // an undo keeps the switch where the user left it
    const edited = spHistoryApply(h, spUpdatePerformer(ready, ready.performers[0].id, { name: 'Alexa' }));
    const snapped = spHistoryApply(edited, spSetStageView(edited.present, { snap: !ready.stage.snap }));
    assert.equal(spHistoryUndo(snapped).present.stage.snap, !ready.stage.snap);
  });
  it('the grid of a plot drawn to scale IS printed, so turning it starts the next revision', () => {
    const ready = spMarkReady(spEdit(tpl('solo'), (d) => Object.assign(d.stage, { width: 20, depth: 12 })));
    const next = spSetStageView(ready, { grid: !ready.stage.grid });
    assert.equal(next.revision, ready.revision + 1);
    assert.equal(next.status, 'draft');
  });
});

describe('SP1 S2-05: an email that is not an email', () => {
  it('does not answer "no technical contact"', () => {
    const p = spEdit(tpl('four-piece'), (d) => Object.assign(d.contact, { name: 'Ana Ruiz', email: 'ana-at-example' }));
    assert.ok(spReview(p).some((i) => i.rule === 'no-contact'));
    const q = spEdit(p, (d) => (d.contact.email = 'ana@example.com'));
    assert.ok(!spReview(q).some((i) => i.rule === 'no-contact'));
  });
});

describe('SP1 S2-06: the guided step "Add what each performer plays or sings"', () => {
  it('is not done while a performer has nothing listed; a source with no connection answers it', () => {
    const base = tpl('salsa');
    assert.equal(spGuidedSteps(base, false).find((s) => s.id === 'sources')?.done, true);
    const added = spAddPerformer(base, { name: 'Güiro' });
    assert.equal(spGuidedSteps(added.p, false).find((s) => s.id === 'sources')?.done, false);
    const answered = spAddSource(added.p, { label: 'Güiro', category: 'percussion', performerId: added.id, connection: 'none' }).p;
    assert.equal(spGuidedSteps(answered, false).find((s) => s.id === 'sources')?.done, true);
  });
});

describe('SP1 S2-07 and S3-06: DUPLICATE', () => {
  it('a copy of a linked object is named as a copy, links to nothing, and lands upstage of a front-edge original', () => {
    const p = tpl('four-piece');
    const wedge = p.objects.find((o) => o.kind === 'wedge' && o.deviceId);
    assert.ok(wedge);
    const r = spDuplicateObject(p, wedge.id);
    const copy = r.p.objects.find((o) => o.id === r.ids[0]);
    assert.ok(copy);
    assert.equal(copy.label, `${wedge.label} (copy)`);
    assert.equal(copy.deviceId, null);
    assert.ok(wedge.y + 0.06 > 0.9 ? copy.y < wedge.y : copy.y > wedge.y, 'never across the front lip');
    assert.ok(copy.y <= 1, 'on the stage');
    // a figure's copy is not a second "Alex"
    const solo = tpl('solo');
    const fig = solo.objects.find((o) => o.kind === 'performer');
    assert.ok(fig);
    const d2 = spDuplicateObject(solo, fig.id);
    assert.match(d2.p.objects.find((o) => o.id === d2.ids[0])?.label ?? '', /\(copy\)$/);
    // a drawing that links to nothing keeps its own name
    const plain = spAddObject(p, 'chair', { x: 0.5, y: 0.5 }, { label: 'Stool' });
    const d3 = spDuplicateObject(plain.p, plain.id);
    assert.equal(d3.p.objects.find((o) => o.id === d3.ids[0])?.label, 'Stool');
  });
});

describe('SP1 S2-08: "Name on the plot" of a monitor device', () => {
  it('renames the device in the monitor plan in the same edit; a source shows its list name beside the field', () => {
    const inspector = src(`${SP}/stage/StageInspector.tsx`);
    assert.match(inspector, /device && t\.trim\(\) \? ed\.apply\(\(q\) => spUpdateDevice\(spUpdateObject\(q, id, \{ label: t \}\), device\.id, \{ label: t\.trim\(\) \}\)\) : set\(\{ label: t \}\)/);
    assert.match(inspector, /In the input list this is “\$\{listName\}”\. The plot prints “\$\{o\.label\.trim\(\)\}” beside its symbol\./);
  });
});

describe('SP1 S2-09 and S3-03: typed sizes and positions', () => {
  it('a platform is never wider or deeper than the stage, and a value not taken as typed is said in words', () => {
    const p = spEdit(tpl('four-piece'), (d) => Object.assign(d.stage, { width: null, depth: null }));
    assert.equal(STAGE_SIZE_MAX, 1);
    assert.equal(stageSizeFraction(p, 'x', 500), 1);
    assert.match(stageTypedWords(p, 'x', 'size', 500, stageSizeFraction(p, 'x', 500)), /cannot be larger than the stage, so it was set to 100 % of the stage width/);
    assert.match(stageTypedWords(p, 'x', 'size', 0, stageSizeFraction(p, 'x', 0)), /must be above 0/);
    assert.match(stageTypedWords(p, 'x', 'position', null, null), /Not read as a number/);
    assert.match(stageTypedWords(p, 'x', 'position', 150, stagePosFraction(p, 'x', 150)), /set to 125 % of the stage width/);
    assert.equal(stageTypedWords(p, 'x', 'position', 45.5, stagePosFraction(p, 'x', 45.5)), '', 'taken as typed');
    assert.equal(stagePosValue(p, 'x', 0.455), 45.5, 'reads back as typed');
  });
});

describe('SP1 S2-10 and S2-12: FULL SCREEN shows the whole stage, at the top', () => {
  it('no fill zoom is forced; VIEW is a tray', () => {
    const plan = src(`${SP}/stage/StagePlanView.tsx`);
    assert.doesNotMatch(plan, /stageFillZoom\(/);
    const area = src(`${SP}/StageArea.tsx`);
    assert.doesNotMatch(area, /<Sheet visible=\{shown === 'view'\}/);
  });
});

describe('SP1 S2-11 and S3-08: dates', () => {
  it('only a month name or its usual short form is read as a month', () => {
    assert.equal(spDayFromText('Junk 5 2026'), null);
    assert.equal(spDayFromText('Mayday 1 2026'), null);
    assert.equal(spDayFromText('5 Decimal 2026'), null);
    assert.equal(spDayFromText('June 5, 2026'), '2026-06-05');
    assert.equal(spDayFromText('jun. 5 2026'), '2026-06-05');
    assert.equal(spDayFromText('Sept 5 2026'), '2026-09-05');
    assert.equal(spDayFromText('5 Dec 2026'), '2026-12-05');
    assert.equal(spDayFromText('May 1 2026'), '2026-05-01');
  });
  it('a refused date stays in the field with the note', () => {
    const setup = src(`${SP}/SetupArea.tsx`);
    assert.match(setup, /<TextField label="Event date" value=\{dateRefused \?\? p\.eventDate\}/);
  });
});

describe('SP1 S2-13: a long selected name', () => {
  it('is cut short on the dock button, never reflowing the dock', () => {
    assert.match(src(`${SP}/StageArea.tsx`), /valueLabel: sel \? dockName\(selName\)\.toUpperCase\(\)/);
  });
});

describe('SP1 S3: Setup and Library words', () => {
  it('times, stage sizes, the scale note, the example title, LOCATE and the copy header', () => {
    for (const t of ['', '9', '9 PM', '9:30', '21:30', '9:30 p.m.', '3:00 PM']) assert.equal(spLooksLikeTime(t), true, t);
    for (const t of ['25:99 PM', 'soon', '13 PM', '9:75']) assert.equal(spLooksLikeTime(t), false, t);
    assert.equal(spStageSizeFromText('1001'), 'big');
    assert.equal(spStageSizeFromText('0'), 'zero');
    assert.equal(spStageSizeFromText('abc'), 'unread');
    assert.equal(spStageSizeFromText(''), null);
    assert.equal(spStageSizeFromText('7,5'), 7.5);
    const setup = src(`${SP}/SetupArea.tsx`);
    assert.match(setup, /A stage size above 1000 is not taken/);
    assert.match(setup, /Until both the width and the depth are set/);
    assert.match(setup, /Change it or clear it above\./);
    assert.match(setup, /ed\.goTo\('stage', fig \? \{ kind: 'object', id: fig\.id \} : \{ kind: 'performer', id: pf\.id \}\)/);
    assert.match(src(`${SP}/StagePlotLabScreen.tsx`), /' · copy'/);
    // screen switches are remembered while the app is open
    assert.match(src(`${SP}/StageArea.tsx`), /const drawingShows = \{ names: true, numbers: true \};/);
    assert.match(src(`${SP}/GuidedTask.tsx`), /let stepsOpen = false;/);
    // round 2 (R2-SP2-07): kept per stage plot and per list
    assert.match(src(`${SP}/inputs/OrderPanel.tsx`), /const keepReservedChoice: Partial<Record<string, boolean>> = \{\};/);
  });
});

describe('SP2 bug 2: the venue feed is a request, never a statement', () => {
  it('the playback packet says "Requested from the venue", never "The venue provides"', () => {
    for (const packet of ['full', 'compact'] as const) {
      const text = spDocText(docOf(tpl('playback'), 'letter', packet));
      assert.ok(text.includes('Requested from the venue: an input split'), packet);
      assert.doesNotMatch(text, /The venue provides/);
    }
  });
});

describe('SP2 bug 3: an instrument’s channels never stand nearer another performer', () => {
  it('the salsa timbales’ "3–5" is nearer the timbales than the conga player, or tied to them by a leader', () => {
    const plot = spPlotDoc(tpl('salsa'));
    const p = tpl('salsa');
    const timb = p.objects.find((o) => o.kind === 'timbales');
    const chino = p.objects.find((o) => o.kind === 'performer' && p.performers.find((x) => x.id === o.performerId)?.name === 'Chino');
    assert.ok(timb && chino);
    const t = plot.items.find((i) => i.id === timb.id);
    const c = plot.items.find((i) => i.id === chino.id);
    assert.ok(t && c);
    assert.ok(t.badges.includes('3–5'));
    const d = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
    assert.ok(t.leader || d(t.labelAt, t.at) < d(t.labelAt, c.at), 'the number reads as the timbales’');
  });
});

describe('SP2 bug 4: MAKE IT MONO never gives two inputs one name', () => {
  it('the kept side takes a name nobody else has, and the preview says the same name', () => {
    let p = spAddPackage(tpl('four-piece'), 'keys-mono').p;
    assert.ok(p.inputs.some((i) => i.label === 'Keys'), 'the mono keyboard is "Keys"');
    const left = inputNamed(p, 'Keys L');
    assert.ok(left.pairId);
    assert.equal(spMonoLabel(p, left.id), 'Keys 2');
    assert.equal(spMonoChoice(p, left.pairId)?.monoLabel('L'), 'Keys 2');
    p = spStereoToMono(p, left.pairId, { keep: 'L', di: 'release' });
    const names = p.inputs.map((i) => i.label.toLowerCase());
    assert.equal(new Set(names).size, names.length, 'every input has its own name');
  });
});

describe('SP2 bug 5: a personal mixer system is not the band monitor rig', () => {
  it('the summary, the packet and the copied text say it apart', () => {
    const p = spAddMix(tpl('four-piece'), { recipients: [], provider: 'personal-mixer', delivery: 'wired-iem', format: 'stereo', name: 'Sam' }).p;
    assert.equal(spMonitorTotals(p).byProvider['personal-mixer'].mixes, 1);
    const copied = spTextSummary(p);
    assert.match(copied, /Made on a personal mixer system, and not mixed on the house console: 1 mix\./);
    assert.doesNotMatch(copied, /Created in the band monitor rig/);
    const text = spDocText(docOf(p));
    assert.match(text, /Made on a personal mixer system, and not mixed on the house console: 1 mix \(2 audio channels\)\./);
    assert.doesNotMatch(text, /Created in the band monitor rig/);
  });
});

describe('SP2 bug 6: GO TO opens the field that answers the question', () => {
  it('every open question names its field, and the popups mark those fields', () => {
    for (const t of ['four-piece', 'playback', 'salsa'] as const) for (const o of spOpenItems(tpl(t))) assert.ok(o.field, `${t}: ${o.text}`);
    const salsa = spOpenItems(tpl('salsa'));
    assert.equal(salsa.find((o) => o.text.startsWith('Piano L:'))?.field, 'supplier', 'who supplies the DI comes first');
    assert.equal(salsa.find((o) => o.text.startsWith('M2 Coro:'))?.field, 'outputs', 'how its wedges are fed');
    for (const i of spReview(tpl('four-piece')).filter((x) => x.rule === 'to-be-confirmed')) assert.ok(i.field);
    const editor = src(`${SP}/inputs/InputEditor.tsx`);
    for (const k of ['supplier', 'audience', 'di', 'standSupplier', 'phantom', 'destination']) assert.match(editor, new RegExp(`<FocusMark k="${k}">`));
    assert.match(editor, /<MoreDetails title="More details" focusKeys=\{\['di', 'standSupplier', 'phantom', 'destination'\]\}>/);
    assert.match(src(`${SP}/monitors/MixSheets.tsx`), /<MoreDetails initiallyOpen=\{shareOpen\} focusKeys=\{\['outputs'\]\}>/);
    assert.match(src(`${SP}/monitors/DeviceSheets.tsx`), /<FocusMark k="supplier">/);
    assert.match(src(`${SP}/inputs/DiPanel.tsx`), /<FocusMark k="kind">/);
    const form = src(`${SP}/spForm.tsx`);
    assert.match(form, /askSheetFocus\(issue\.field\);\s*p\.onGoTo\(issue\);/);
  });
});

describe('SP2 bug 7: PUT THE OTHER SIDE BACK', () => {
  it('the restored side comes back beside its partner, on the number next to it', () => {
    let p = spAddPackage(tpl('four-piece'), 'keys-stereo').p;
    const house = () => spPatch(p, 'house')!;
    const l = p.inputs.filter((i) => i.pairId).at(-2)!;
    const r = p.inputs.find((i) => i.pairId === l.pairId && i.id !== l.id)!;
    const nl = house().numbers[l.id]!;
    const nr = house().numbers[r.id]!;
    assert.equal(nr, nl + 1);
    p = spRemoveInput(p, l.id);
    const back = spPairRestore(p, r.id);
    p = back.p;
    assert.equal(house().numbers[back.id], nl, 'the number it had');
    assert.equal(house().order.indexOf(back.id) + 1, house().order.indexOf(r.id), 'just above its partner');
  });
});

describe('SP2 bug 8: the paper choice is seen to do something', () => {
  it('the Export screen says how many pages the PDF has, by the same layout as the file', () => {
    for (const paper of ['letter', 'a4'] as const) {
      const d = docOf(tpl('salsa'), paper, 'compact');
      const bytes = new TextDecoder('latin1').decode(spPdfBytes(d));
      assert.equal(spPdfPageCount(d), (bytes.match(/\/Type \/Page /g) ?? []).length);
    }
    assert.match(src(`${SP}/ExportArea.tsx`), /The PDF has \$\{plural\(pages, 'page'\)\} on \$\{SP_PAPER_WORD\[paper\]\}\./);
  });
});

describe('SP2 bug 9: "Own vocal prominent" with the own vocal kept out', () => {
  it('is a review question and a note on the mix card, like the click', () => {
    const p0 = tpl('four-piece');
    const m = p0.mixes.find((x) => x.instructions.includes('Own vocal prominent'));
    assert.ok(m);
    const own = p0.inputs.find((i) => {
      const s = p0.sources.find((x) => x.id === i.sourceId);
      return s?.category === 'vocals' && !!s.performerId && m.recipients.includes(s.performerId);
    });
    assert.ok(own);
    const p = spSetNeed(p0, m.id, own.id, 'exclude');
    assert.ok(spReview(p).some((i) => i.rule === 'own-clash' && i.target.id === m.id));
    assert.ok(spmClickNotes(p, p.mixes.find((x) => x.id === m.id)!).some((t) => t.includes('“Own vocal prominent”')));
    // asked for: no question
    assert.ok(!spReview(spSetNeed(p0, m.id, own.id, 'primary')).some((i) => i.rule === 'own-clash'));
    assert.ok(!spReview(spUpdateMix(p, m.id, { instructions: [] })).some((i) => i.rule === 'own-clash'));
  });
});

describe('SP2 bug 10: the IEM symbol', () => {
  it('has square corners like every other box: a rounded box is a mix code', () => {
    const box = spSymbol('iem').shapes.find((s) => s.t === 'rect');
    assert.ok(box && box.t === 'rect');
    assert.ok((box.r ?? 0) <= 0.05);
  });
});

describe('SP2 bug 11: no sheet for the closing note alone', () => {
  it('the salsa compact packet on US Letter is three pages; what the packet is, and when it was made, is on page one', () => {
    const d = docOf(tpl('salsa'), 'letter', 'compact');
    assert.equal(spPdfPageCount(d), 3);
    const facts = d.sections[0].blocks.find((b) => b.t === 'facts');
    assert.ok(facts && facts.t === 'facts');
    assert.ok(facts.rows.some(([k, v]) => k === 'This packet' && /not a confirmation by the venue\. Made /.test(v)));
  });
});

describe('SP2 bug 12, 16, 17: small things', () => {
  it('a row move on a shared revision asks first; "both" for two; a role with "and" in a mix name', () => {
    assert.match(src(`${SP}/InputsArea.tsx`), /confirmDialog\('Move a row in a stage plot that may have been sent\?', shared, 'Move it', run\)/);
    assert.equal(spmBringsLine({ band: 0, venue: 2, other: 0, tbc: 0 }, 2), 'The venue brings both.');
    const p = tpl('four-piece');
    const [a, b] = p.performers;
    const q = spUpdatePerformer(spUpdatePerformer(p, a.id, { role: 'Guitar and lead vocal' }), b.id, { role: 'Bass and vocal' });
    assert.equal(spmSuggestName(q, [a.id, b.id], 'wedge'), 'Guitar and lead vocal; Bass and vocal');
  });
});
