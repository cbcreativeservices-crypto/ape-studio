/**
 * Stage Plot and Channel Designer — bug test ROUND 2 of 2026-11-13 (testers
 * R2-SP1: Library, Setup, Stage, registration; R2-SP2: Inputs, Monitors,
 * Export and the PDF). One test (or more) per fixed bug, written to FAIL on
 * the code the testers used: what the learner, the band and the venue would
 * see, not that a function was called.
 *
 * Reports: docs/labs/bugtest_2026_11_13_r2/R2_STAGEPLOT_1_*.md and _2_*.md.
 * The fixer's notes: docs/labs/bugtest_2026_11_13_r2/FIX_STAGEPLOT_R2.md.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spCanUndo, spHistoryApply, spHistoryStart, spHistoryUndo } from '../src/features/stageplot/spHistory.ts';
import {
  spAddMix,
  spAddPackage,
  spAddSource,
  spDuplicateProject,
  spEdit,
  spFreeze,
  spMarkDraft,
  spMarkReady,
  spMigrate,
  spMonoLabel,
  spNewProject,
  spPairRestore,
  spPatch,
  spRemoveInput,
  spRemoveObjects,
  spRenumber,
  spSetReserved,
} from '../src/features/stageplot/spModel.ts';
import { SP_PLOT_NOMINAL_W, SP_PLOT_ONLY_WORDS, spAfterExport, spBuildDoc, spBuildSnapshot, spLabelBlock, spPacketCounts, spPlotDoc, spPlotScale } from '../src/features/stageplot/spPacket.ts';
import { spPdfBytes } from '../src/features/stageplot/spPdf.ts';
import { spGuidedSteps, spLooksLikePhone, spReview } from '../src/features/stageplot/spReview.ts';
import { spFromTemplate, type SpTemplateId } from '../src/features/stageplot/spTemplates.ts';
import type { SpDocBlock, SpPacketKind, SpPaper, SpProject } from '../src/features/stageplot/spTypes.ts';
import { spmUsualDevices } from '../src/screens/lab/stageplot/monitors/monitorPlan.ts';
import { STAGE_VIEW_FIT, stageDrawOrder, stageFrameBoxes, stageLabelClash, stageLabelPlan, stageObjectBox, stageTransformFor } from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import { stageBadges, stageName } from '../src/screens/lab/stageplot/stage/stageLinks.ts';
import { overlapArea } from '../src/screens/lab/roomdesign/planLabels.ts';

// spStore reads the device's storage: loaded with the same in-memory stand-in
// the store's own tests use (stagePlotStore.test.ts)
const ASYNC_STORAGE = '@react-native-async-storage/async-storage';
const STUB_URL = 'ape-test:async-storage-stageplot-bugtest-r2';
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
const { spStageSizeFromText } = await import('../src/features/stageplot/spStore.ts');

const NOW = Date.UTC(2026, 10, 13, 12, 0);
const tpl = (id: SpTemplateId): SpProject => spFromTemplate(id, { id: `p-${id}`, now: NOW, band: 'The Example' });
const snapOf = (p: SpProject, paper: SpPaper = 'letter', packet: SpPacketKind = 'full') => spBuildSnapshot(p, { paper, packet }, NOW);
const docOf = (p: SpProject, paper: SpPaper = 'letter', packet: SpPacketKind = 'full') => spBuildDoc(snapOf(p, paper, packet));
const src = (f: string): string => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SP = 'screens/lab/stageplot';

/** The screen's own rule (spContext): a packet was made from THIS revision. */
const exportedNow = (p: SpProject): boolean => p.packetRevision >= p.revision;
/** The credit's own rule (StagePlotLabScreen): blank start, a packet, all five steps. */
const earns = (p: SpProject): boolean => exportedNow(p) && p.startedBlank && spGuidedSteps(p, true).every((s) => s.done);
/** A solo plot with every review question answered (only "to be confirmed" left). */
const answered = (p: SpProject): SpProject =>
  spEdit(p, (d) => {
    d.band = 'Test Band';
    d.title = 'Club set';
    d.contact.name = 'Ana';
    d.contact.phone = '+1 555 0100';
  });

describe('R2-SP1-01 = R2-SP2-01 (S1): only a REAL packet marks "Make the packet"', () => {
  it('Ready to advance freezes the revision and makes no packet: step 5 stays to do, and no credit', () => {
    const p = answered(tpl('solo'));
    assert.deepEqual(spGuidedSteps(p, exportedNow(p)).map((s) => s.done), [true, true, true, true, false]);
    const ready = spMarkReady(p);
    assert.equal(ready.frozenRevision, ready.revision, 'Ready still freezes the revision');
    assert.equal(ready.packetRevision, 0, 'Ready records no packet');
    assert.equal(exportedNow(ready), false);
    assert.equal(spGuidedSteps(ready, exportedNow(ready))[4].done, false, 'step 5 stays To do');
    // back to Draft does not make one either
    assert.equal(exportedNow(spMarkDraft(ready)), false);
  });

  it('COPY TECHNICAL SUMMARY (an export with no packet) freezes and records no packet', () => {
    const p = answered(tpl('solo'));
    const copied = spAfterExport(p, snapOf(p), false);
    assert.equal(copied.frozenRevision, p.revision);
    assert.equal(copied.packetRevision, 0);
    assert.equal(exportedNow(copied), false);
  });

  it('DOWNLOAD PDF, SHARE or PRINT records the revision the packet was made from, and it survives a restart', () => {
    const p = answered(tpl('solo'));
    const made = spAfterExport(p, snapOf(p), true);
    assert.equal(made.packetRevision, p.revision);
    assert.equal(exportedNow(made), true);
    assert.equal(spGuidedSteps(made, exportedNow(made))[4].done, true);
    // saved and read back (the store runs every row through spMigrate)
    const back = spMigrate(JSON.parse(JSON.stringify(made)));
    assert.ok(back);
    assert.equal(exportedNow(back), true, 'a packet made before a restart still counts');
    // a second packet of the same revision changes nothing at all
    assert.equal(spAfterExport(made, snapOf(made), true), made);
  });

  it('an edit after the packet moves the revision on: the step is open again until a new packet', () => {
    const p = answered(tpl('solo'));
    const made = spAfterExport(p, snapOf(p), true);
    const edited = spEdit(made, (d) => (d.notes = 'Two sets.'));
    assert.equal(edited.revision, made.revision + 1);
    assert.equal(exportedNow(edited), false);
    // and Ready on the new revision does not count as its packet
    assert.equal(exportedNow(spMarkReady(edited)), false);
  });

  it('a packet finished after an edit made meanwhile records the revision that went out, not the new one', () => {
    const p = answered(tpl('solo'));
    const snap = snapOf(p);
    const meanwhile = spEdit(p, (d) => (d.notes = 'typed while the PDF was made'));
    // the edit did not move the revision (it was not shared yet)
    assert.equal(meanwhile.revision, p.revision);
    const after = spAfterExport(meanwhile, snap, true);
    assert.equal(after.packetRevision, p.revision);
    assert.ok(after.revision > after.packetRevision, 'what is on screen now is the next revision');
    assert.equal(exportedNow(after), false);
  });

  it('a packet is not an UNDO step, and UNDO never forgets that a packet was made', () => {
    const p = answered(tpl('solo'));
    let h = spHistoryStart(p);
    h = spHistoryApply(h, spEdit(h.present, (d) => (d.notes = 'one')));
    const before = h.past.length;
    h = spHistoryApply(h, spAfterExport(h.present, snapOf(h.present), true));
    assert.equal(h.past.length, before, 'recording the packet replaces the present state in place');
    assert.equal(h.present.packetRevision, h.present.revision);
    assert.ok(spCanUndo(h));
    const undone = spHistoryUndo(h);
    assert.equal(undone.present.packetRevision, h.present.packetRevision, 'the record of the packet is carried');
    assert.equal(exportedNow(undone.present), false, 'the state UNDO lands on is a new revision, with no packet of its own');
  });

  it('an older saved plot (no packetRevision) reads cleanly, with nothing marked exported', () => {
    const p = spMarkReady(answered(tpl('solo')));
    const old = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
    delete old.packetRevision;
    delete old.startedBlank;
    const back = spMigrate(old);
    assert.ok(back);
    assert.equal(back.packetRevision, 0);
    assert.equal(exportedNow(back), false, 'a Ready plot saved before the fix is not taken as exported');
    for (const junk of ['3', -1, Number.NaN, null]) assert.equal(spMigrate({ ...old, packetRevision: junk })?.packetRevision, 0);
  });

  it('a duplicate and a gig copy start with no packet of their own', () => {
    const p = spAfterExport(answered(tpl('solo')), snapOf(answered(tpl('solo'))), true);
    for (const kind of ['master', 'gig'] as const) assert.equal(spDuplicateProject(p, { id: `c-${kind}`, kind, now: NOW }).packetRevision, 0);
  });

  it('the editor reads the packet record, never the frozen revision; only a packet passes packetMade', () => {
    const ctx = src(`${SP}/spContext.tsx`);
    assert.match(ctx, /exported: exportedRev === project\.revision \|\| project\.packetRevision >= project\.revision,/);
    assert.doesNotMatch(ctx, /frozenRevision >= project\.revision/);
    const area = src(`${SP}/ExportArea.tsx`);
    assert.match(area, /const next = spAfterExport\(p, snap, packetMade\);/);
    // the copy passes false; the PDF, the share, the download and the print pass true
    assert.match(area, /if \(r === 'copied'\) \{\s*finish\(b\.snap, false\);/);
    assert.equal((area.match(/finish\((?:b\.snap|s\.snap), true\)/g) ?? []).length, 4);
  });
});

describe('R2-SP1-04 (owner 2026-11-13, "Blank stage only"): only a plot started from a blank stage earns the lab', () => {
  it('a new blank plot is recorded as started blank; every example is not', () => {
    assert.equal(tpl('blank').startedBlank, true);
    for (const t of ['solo', 'duo', 'four-piece', 'playback', 'salsa'] as const) assert.equal(tpl(t).startedBlank, false, t);
    // the model's own new project never assumes it
    assert.equal(spNewProject({ id: 'x', now: NOW }).startedBlank, false);
  });

  it('an example with all five steps done and a real packet still earns nothing (it stays open for practice)', () => {
    const p = answered(tpl('solo'));
    const made = spAfterExport(p, snapOf(p), true);
    assert.deepEqual(spGuidedSteps(made, exportedNow(made)).map((s) => s.done), [true, true, true, true, true], 'the steps still show done');
    assert.equal(earns(made), false);
  });

  it('a duplicate or gig copy keeps where it started: a copy of a blank-started plot can earn it, a copy of an example cannot', () => {
    // a blank-started plot with the solo example's content: what a learner builds
    const built = { ...answered(tpl('solo')), startedBlank: true, startedFrom: '' };
    for (const kind of ['master', 'gig'] as const) {
      const copy = spDuplicateProject(built, { id: `b-${kind}`, kind, now: NOW });
      assert.equal(copy.startedBlank, true);
      assert.equal(earns(spAfterExport(copy, snapOf(copy), true)), true, `${kind} copy of a blank-started plot`);
      const ex = spDuplicateProject(answered(tpl('solo')), { id: `e-${kind}`, kind, now: NOW });
      assert.equal(ex.startedBlank, false);
      assert.equal(earns(spAfterExport(ex, snapOf(ex), true)), false, `${kind} copy of an example`);
    }
  });

  it('an older saved plot with no record does not count as blank', () => {
    const old = JSON.parse(JSON.stringify(tpl('blank'))) as Record<string, unknown>;
    delete old.startedBlank;
    assert.equal(spMigrate(old)?.startedBlank, false);
    assert.equal(spMigrate({ ...old, startedBlank: 'yes' })?.startedBlank, false);
  });

  it('the credit, the guided task and the Setup guide say so in plain words; nothing is taken back', () => {
    const screen = src(`${SP}/StagePlotLabScreen.tsx`);
    assert.match(screen, /const guidedDone = useMemo\(\(\) => ed\.exported && ed\.project\.startedBlank && spGuidedSteps\(ed\.project, true\)\.every\(\(s\) => s\.done\), \[ed\.exported, ed\.project\]\);/);
    assert.doesNotMatch(screen, /removeTraining|unmarkTraining|clearTraining/);
    const task = src(`${SP}/GuidedTask.tsx`);
    assert.match(task, /'All five steps on a plot started from a blank stage complete this lab\.'/);
    assert.match(task, /'This plot started from an example band, so it is for practice\. A plot started from a blank stage completes this lab\.'/);
    assert.match(task, /p\.startedBlank \? SP_GUIDED_EARNS_BLANK : p\.startedFrom \? SP_GUIDED_EARNS_EXAMPLE : SP_GUIDED_EARNS_UNKNOWN/);
    assert.match(task, /hint=\{`Five steps from an empty stage to a packet\. \$\{spGuidedEarns\(ed\.project\)\}/);
    assert.match(task, /A plot-only page does not complete this step, and marking it Ready or copying the summary does not make a packet\./);
    assert.doesNotMatch(task, /All five done on one stage plot complete this lab/);
    assert.match(src(`${SP}/guides/setup.ts`), /All five steps on a plot started from a blank stage complete this lab\. An example band is for practice\./);
  });
});

/** Every page but the last whose last body line is a heading (text over
 *  10.5 pt): read from the PDF's own text operators. */
function pagesEndingOnHeading(bytes: Uint8Array): number[] {
  const text = Buffer.from(bytes).toString('latin1');
  const streams = [...text.matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((m) => m[1]).filter((s) => s.includes(' Tj ET'));
  const out: number[] = [];
  streams.forEach((s, i) => {
    if (i === streams.length - 1) return;
    const lines = [...s.matchAll(/1 0 0 1 [\d.]+ ([\d.]+) Tm \/F\d ([\d.]+) Tf \((.*)\) Tj ET/g)]
      .map((m) => ({ y: Number(m[1]), size: Number(m[2]), t: m[3] }))
      .filter((l) => !(l.t.includes('Page ') && l.t.includes(' of ')) && l.t !== 'DRAFT');
    if (!lines.length) return;
    const last = lines.reduce((a, b) => (b.y < a.y ? b : a));
    if (last.size > 10.5) out.push(i + 1);
  });
  return out;
}

describe('R2-SP2-02 (S2): a heading never ends a page, with Notes typed', () => {
  const G = 'We change between two sets with a ten minute break; please keep the stage lights low during the change. ';
  const A = 'The van parks at the rear dock; we need two people to help carry the keyboard case up the stairs. ';
  it('the tester’s packet: Salsa, compact, US Letter, one sentence of each note', () => {
    const p = spEdit(tpl('salsa'), (d) => {
      d.notes = G.trim();
      d.accessNotes = A.trim();
    });
    assert.deepEqual(pagesEndingOnHeading(spPdfBytes(docOf(p, 'letter', 'compact'))), []);
  });
  it('every example, both papers, both packets, short and longer notes', () => {
    const bad: string[] = [];
    for (const t of ['solo', 'duo', 'four-piece', 'playback', 'salsa'] as const)
      for (const paper of ['letter', 'a4'] as const)
        for (const packet of ['full', 'compact'] as const)
          for (const g of [1, 3])
            for (const a of [0, 1]) {
              const p = spEdit(tpl(t), (d) => {
                d.notes = G.repeat(g).trim();
                d.accessNotes = A.repeat(a).trim();
              });
              const pages = pagesEndingOnHeading(spPdfBytes(docOf(p, paper, packet)));
              if (pages.length) bad.push(`${t} ${paper} ${packet} g${g} a${a}: page ${pages.join(', ')}`);
            }
    assert.deepEqual(bad, []);
  });
});

describe('R2-SP2-03 (S2): a performer’s name is never printed over another performer’s head', () => {
  it('on every example’s printed plot, the usual and the roomy drawing', () => {
    for (const t of ['solo', 'duo', 'four-piece', 'playback', 'salsa'] as const) {
      for (const how of [{}, { roomy: true }]) {
        const plot = spPlotDoc(tpl(t), how);
        const k = spPlotScale(plot, SP_PLOT_NOMINAL_W);
        const people = plot.items.filter((it) => it.person);
        for (const me of people) {
          const b = spLabelBlock(me);
          if (!b.h) continue;
          const x0 = me.labelAt.x - b.labelW / 2 / k;
          const box = { x0, y0: me.labelAt.y, x1: x0 + b.w / k, y1: me.labelAt.y + b.h / k };
          for (const o of people) {
            if (o.id === me.id) continue;
            const head = o.shapes.find((s) => s.t === 'circle');
            assert.ok(head && head.t === 'circle');
            const top = head.cy - head.r;
            const over = box.y1 <= top + 1e-9 && top - box.y1 < 2 * (box.y1 - box.y0) && Math.min(box.x1, head.cx + head.r) - Math.max(box.x0, head.cx - head.r) > 0;
            assert.equal(over, false, `${t} ${JSON.stringify(how)}: ${me.label}'s name stands over ${o.label}'s head`);
          }
        }
      }
    }
  });
  it('the salsa plot: Nelson’s name is not over Chino, and Chino’s name is over Chino', () => {
    const plot = spPlotDoc(tpl('salsa'));
    const nelson = plot.items.find((i) => i.label === 'Nelson');
    const chino = plot.items.find((i) => i.label === 'Chino');
    assert.ok(nelson && chino);
    assert.ok(Math.abs(chino.labelAt.x - chino.at.x) < 0.5 && chino.labelAt.y < chino.at.y, 'Chino is named above his own head');
    assert.ok(!chino.leader, 'Chino needs no leader any more');
    // Nelson's name is tied to him: beside him, or on a leader
    const nearer = Math.hypot(nelson.labelAt.x - nelson.at.x, nelson.labelAt.y - nelson.at.y) < Math.hypot(nelson.labelAt.x - chino.at.x, nelson.labelAt.y - chino.at.y);
    assert.ok(nearer || nelson.leader, 'Nelson’s name belongs to Nelson');
  });
});

describe('R2-SP2-04 (S2): a monitor device fact wraps inside its card', () => {
  it('the fact chip shrinks and wraps like the Inputs tags', () => {
    const bits = src(`${SP}/monitors/bits.tsx`);
    assert.match(bits, /fact: \{[^}]*flexShrink: 1, maxWidth: '100%' \}/);
    assert.match(bits, /factText: \{[^}]*flexShrink: 1 \}/);
  });
});

describe('R2-SP2-05 (S2): the "not on the stage" question names the right thing', () => {
  const withMonoKeys = () => {
    const four = tpl('four-piece');
    const nina = four.performers.find((x) => x.name === 'Nina');
    assert.ok(nina);
    return spAddPackage(four, 'keys-mono', { performerId: nina.id, sourceLabel: 'Keys 2' });
  };
  it('MAKE IT MONO never takes another source’s name', () => {
    const { p } = withMonoKeys();
    const keysL = p.inputs.find((i) => i.label === 'Keys L');
    assert.ok(keysL);
    const name = spMonoLabel(spRemoveInput(p, p.inputs.find((i) => i.label === 'Keys R')?.id ?? ''), keysL.id);
    assert.notEqual(name.toLowerCase(), 'keys 2', 'the source "Keys 2" exists');
    assert.ok(!p.sources.some((s) => s.label.toLowerCase() === name.toLowerCase()));
  });
  it('the question names the source with its own rows', () => {
    const { p, sourceId } = withMonoKeys();
    const ask = spReview(p).find((i) => i.rule === 'source-unplaced' && i.target.id === sourceId);
    assert.ok(ask);
    const rows = p.inputs.filter((i) => i.sourceId === sourceId).map((i) => i.label);
    assert.equal(rows.length, 1);
    assert.equal(ask.text, `Keys 2 is not on the stage, and its input ${rows[0]} is in the input list.`);
    // the short sentence stays where the one row has the source's own name
    const stereo = spRemoveObjects(tpl('four-piece'), tpl('four-piece').objects.filter((o) => o.kind === 'keyboard').map((o) => o.id));
    const k = spReview(stereo).find((i) => i.rule === 'source-unplaced');
    assert.ok(k);
    assert.equal(k.text, 'Keys is not on the stage, and its inputs Keys L and Keys R are in the input list.');
  });
});

describe('R2-SP2-06 (S2): a personal-mixer mix is given a personal mixer, not a headphone amplifier', () => {
  it('wired in-ear on a personal mixer system proposes one personal mixer for each performer', () => {
    const p = tpl('four-piece');
    const sam = p.performers.find((x) => x.name === 'Sam');
    assert.ok(sam);
    const rows = spmUsualDevices(p, { delivery: 'wired-iem', recipients: [sam.id], provider: 'personal-mixer' });
    assert.deepEqual(rows.map((r) => [r.type, r.performerId]), [['personal-mixer', sam.id]]);
    // from the house console it is still a headphone amplifier
    assert.deepEqual(spmUsualDevices(p, { delivery: 'wired-iem', recipients: [sam.id], provider: 'house' }).map((r) => r.type), ['hp-amp']);
  });
});

describe('R2-SP2-07 (S3, round-1 16 leak): "Keep reserved channels free" belongs to one stage plot', () => {
  it('the choice is kept by stage plot and list, not by list alone', () => {
    const panel = src(`${SP}/inputs/OrderPanel.tsx`);
    assert.match(panel, /const choiceKey = `\$\{p\.id\}:\$\{patchId\}`;/);
    assert.match(panel, /useState\(keepReservedChoice\[choiceKey\] \?\? true\)/);
    assert.match(panel, /keepReservedChoice\[choiceKey\] = on;/);
  });
});

describe('R2-SP2-08 (S3): RENUMBER keeps a stereo pair on two neighbouring channels', () => {
  it('channel 6 reserved: the overheads move on to 7 and 8, never 5 and 7', () => {
    const p = spRenumber(spSetReserved(tpl('four-piece'), 'house', [6]), 'house', { keepReserved: true });
    const house = spPatch(p, 'house');
    assert.ok(house);
    const n = (label: string) => house.numbers[p.inputs.find((i) => i.label === label)?.id ?? ''];
    assert.equal(n('Overhead R') - n('Overhead L'), 1);
    assert.ok(![n('Overhead L'), n('Overhead R')].includes(6));
    assert.ok(!Object.values(house.numbers).includes(6), 'channel 6 stays free');
    // with keep-free OFF nothing is skipped
    const off = spPatch(spRenumber(spSetReserved(tpl('four-piece'), 'house', [6]), 'house', { keepReserved: false }), 'house');
    assert.ok(off && Object.values(off.numbers).includes(6));
  });
});

describe('R2-SP2-09 (S3): a reserved number typed in a row is said beside the field', () => {
  it('the input editor says it, as it says a duplicate', () => {
    const ed = src(`${SP}/inputs/InputEditor.tsx`);
    assert.match(ed, /n != null && patch\?\.reserved\.includes\(n\) \?/);
    assert.match(ed, /Channel \{n\} is kept free on purpose in the/);
  });
});

describe('R2-SP2-10 (S3): the outputs sentence follows the house-console line', () => {
  it('"If each audio channel…" comes before the personal-mixer line', () => {
    const four = tpl('four-piece');
    const sam = four.performers.find((x) => x.name === 'Sam');
    assert.ok(sam);
    const p = spAddMix(four, { recipients: [sam.id], format: 'mono', provider: 'personal-mixer', delivery: 'wired-iem' }).p;
    const paras = docOf(p).sections.flatMap((s) => s.blocks).filter((b): b is Extract<SpDocBlock, { t: 'para' }> => b.t === 'para').map((b) => b.text);
    const line = paras.find((t) => t.includes('If each audio channel'));
    assert.ok(line);
    assert.ok(line.includes('Made on a personal mixer system'));
    assert.ok(line.indexOf('If each audio channel') < line.indexOf('Made on a personal mixer system'));
  });
});

describe('R2-SP2-11 (S3): PUT THE OTHER SIDE BACK puts the side beside its partner in the rows', () => {
  it('the review lists L before R', () => {
    const four = tpl('four-piece');
    const keysL = four.inputs.find((i) => i.label === 'Keys L');
    assert.ok(keysL);
    const restored = spPairRestore(spRemoveInput(four, keysL.id), four.inputs.find((i) => i.label === 'Keys R')?.id ?? '').p;
    const at = (label: string) => restored.inputs.findIndex((i) => i.label === label);
    assert.equal(at('Keys L') + 1, at('Keys R'));
  });
});

describe('R2-SP2-12 (S3): no key, no sentence about the key', () => {
  it('the plot preview says "The key under it" only when there is one', () => {
    const view = src(`${SP}/export/PlotView.tsx`);
    assert.match(view, /\{parts\.key \? ' The key under it stays in view\.' : ''\}/);
    assert.match(view, /\$\{plot\.key\.length \? 'A key under the stage names each kind of symbol\. ' : ''\}/);
  });
});

describe('R2-SP2-13 (S3): reserved channels can be set before the first input', () => {
  it('an empty list still shows the reserved-channels field', () => {
    const panel = src(`${SP}/inputs/OrderPanel.tsx`);
    assert.match(panel, /if \(!patch\) return null;/);
    assert.doesNotMatch(panel, /if \(!patch \|\| !patch\.order\.length\) return null;/);
    assert.match(panel, /<Section title="RESERVED CHANNELS"/);
    // and the house list exists on a blank plot
    assert.ok(spPatch(tpl('blank'), 'house'));
  });
});

describe('round-1 15 (S3): one person, one position word', () => {
  it('a vocal at its singer is printed where the singer is', () => {
    for (const [t, name] of [
      ['solo', 'Alex'],
      ['playback', 'Jo'],
    ] as const) {
      const d = docOf(tpl(t));
      const rows = d.sections.flatMap((s) => s.blocks).flatMap((b) => (b.t === 'table' ? b.table.rows.map((r) => r.cells) : []));
      const where = rows.find((c) => c.name === name)?.where;
      assert.ok(where);
      const vocal = rows.find((c) => typeof c.who === 'string' && c.who.startsWith(`${name} · `) && !c.who.includes('at the'));
      assert.ok(vocal);
      assert.equal(vocal.who, `${name} · ${where}`, t);
    }
  });
});

describe('round-1 18 (S3): small things', () => {
  it('a number brought into range is said under the field ("How many" 0 → 1)', () => {
    const form = src(`${SP}/spForm.tsx`);
    assert.match(form, /const \[moved, setMoved\] = useState\(''\);/);
    assert.match(form, /is not taken here: a number from/);
    assert.match(form, /\{moved \? \(/);
  });
  it('a DI device asked to carry more than it has must be corrected before Ready', () => {
    const p = tpl('four-piece');
    const di = p.diDevices[0];
    assert.ok(di);
    const forced = spEdit(p, (d) => {
      const dev = d.diDevices[0];
      for (const i of d.inputs) if (i.capture === 'di') i.diDeviceId = dev.id;
      dev.channels = 1;
    });
    const cap = spReview(forced).find((i) => i.rule === 'capacity');
    assert.ok(cap, 'the four-piece has more than one DI channel to put on one device');
    assert.equal(cap.level, 'block');
  });
});

describe('R2-SP1-02 (S2): on a short phone a channel number never covers a name, and the screen tells the truth', () => {
  for (const [gw, gh] of [
    [351, 139],
    [296, 111],
  ]) {
    it(`salsa at ${gw}×${gh}: no equipment number lies on a performer’s name`, () => {
      const p = tpl('salsa');
      const T = stageTransformFor(p, gw, gh, STAGE_VIEW_FIT);
      const order = stageDrawOrder(p.objects);
      const boxes = order.map((o) => stageObjectBox(p, o, T));
      const items = order.map((o, i) => ({ id: o.id, text: stageName(p, o), badges: stageBadges(p, o), box: boxes[i], person: o.kind === 'performer' }));
      const f = stageFrameBoxes(gw, gh);
      const plan = stageLabelPlan(items, gw, gh, [f.top, f.bottom, f.left, f.right]);
      const people = new Set(items.filter((i) => i.person).map((i) => i.id));
      const names = plan.labels.filter((l) => people.has(l.id));
      const gear = plan.labels.filter((l) => !people.has(l.id));
      for (const g of gear) for (const n of names) assert.equal(stageLabelClash(g.box, n.box), 0, `${g.id} covers ${n.id}`);
      // a name that touches another label is counted, so the screen never says "every performer is named" then
      const touching = names.filter((n) => plan.labels.some((o) => o.id !== n.id && overlapArea(n.box, o.box, 2) > 0.01)).map((n) => n.id);
      assert.deepEqual([...plan.crowded].sort(), touching.sort());
    });
  }
  it('the note says "Every performer is named" only while no name is covered', () => {
    const area = src(`${SP}/StageArea.tsx`);
    // owner 2026-11-13: build them all — names stay inside the stage. A
    // performer's name left out at this size (peopleOut) also takes the
    // sentence away, and the view reports that count too.
    // owner 2026-11-13: build the remaining held items: a performer shown by
    // initials also takes the sentence away
    assert.match(area, /\$\{crowded > 0 \|\| peopleOut > 0 \|\| shortNames\.count > 0 \? '' : ' Every performer is named\.'\}/);
    assert.match(area, /performers’ names touch`\} another label at this size\./);
    assert.match(src(`${SP}/stage/StagePlanView.tsx`), /leftOutRef\.current\?\.\(leftOut, codesOut, crowded, numbersOut, peopleOut\);/);
  });
});

describe('R2-SP1-03 (S2): "Go to it" for the band name and the title scrolls to THE BAND', () => {
  it('both fields are scrolled to, laid out like the contact block', () => {
    const setup = src(`${SP}/SetupArea.tsx`);
    assert.match(setup, /\} else if \(field === 'band' \|\| field === 'title'\) \{/);
    assert.match(setup, /bandY\.current = e\.nativeEvent\.layout\.y;/);
    assert.ok(setup.indexOf('bandY.current = e.nativeEvent.layout.y') < setup.indexOf('<Section title="THE BAND">'));
  });
});

describe('R2-SP1-05 (S3): "▼ MORE" goes at the end of the key', () => {
  it('the tag fades out as the scroll reaches END OF THE KEY (the key still takes no touch)', () => {
    const key = src(`${SP}/stage/StageKey.tsx`);
    assert.match(key, /onScroll=\{Animated\.event\(\[\{ nativeEvent: \{ contentOffset: \{ y: scrolled \} \} \}\], \{ useNativeDriver: false \}\)\}/);
    assert.match(key, /opacity: scrolled\.interpolate\(/);
    assert.doesNotMatch(key, /useState|Pressable|onPress/);
  });
});

describe('R2-SP1-06 / R2-SP2-14 (S3): the editor bar on a narrow phone', () => {
  it('below 360 wide the revision line goes under the buttons; on a small phone "Not saved" is said in short', () => {
    const screen = src(`${SP}/StagePlotLabScreen.tsx`);
    assert.match(screen, /const SP_BAR_NARROW = 360;/);
    assert.match(screen, /'session-only': 'Not saved',/);
    assert.match(screen, /\{narrow \? <View style=\{styles\.barGap\} \/> : stateBox\}/);
    assert.match(screen, /\{narrow \? stateBox : null\}/);
    // a screen reader still hears the full sentence
    assert.match(screen, /accessibilityLabel=\{SAVE_WORDS\[ed\.saveState\]\}/);
  });
});

describe('R2-SP1-07 (S3, rest of round-1 S2-05): a phone with no digits does not answer the contact question', () => {
  it('"abc" keeps the question; a real number answers it', () => {
    const base = spEdit(tpl('solo'), (d) => {
      d.contact.name = 'Ana';
      d.contact.email = '';
    });
    const ask = (phone: string) => spReview(spEdit(base, (d) => (d.contact.phone = phone))).some((i) => i.rule === 'no-contact');
    assert.equal(ask('abc'), true);
    assert.equal(ask('12'), true);
    assert.equal(ask('+1 555 0100'), false);
    assert.equal(spLooksLikePhone('555-0100'), true);
    assert.match(src(`${SP}/SetupArea.tsx`), /This does not look like a phone number\. It is kept as typed\./);
  });
});

describe('R2-SP1-08 (S3): a refused stage size', () => {
  it('-5 is answered "must be more than 0"; the refused text stays in the field', () => {
    assert.equal(spStageSizeFromText('-5'), 'zero');
    assert.equal(spStageSizeFromText('abc'), 'unread');
    assert.equal(spStageSizeFromText('1001'), 'big');
    const setup = src(`${SP}/SetupArea.tsx`);
    assert.match(setup, /setSizeRefused\(\(r\) => \(\{ \.\.\.r, \[key\]: text \}\)\);/);
    assert.match(setup, /<TextField label="Width" value=\{sizeShown\('width'\)\}/);
    assert.match(setup, /<TextField label="Depth" value=\{sizeShown\('depth'\)\}/);
  });
});

describe('R2-SP1-09 (S3): the REMOVE sheet says "in both choices" only when it shows two', () => {
  it('the line depends on hasOwn', () => {
    assert.match(src(`${SP}/SetupArea.tsx`), /It is removed with them\$\{hasOwn \? ' in both choices' : ''\}\./);
  });
});

describe('R2-SP1-10 (S3, rest of round-1 S3-07): ZOOM is kept on leaving the Stage area', () => {
  it('the view is remembered per stage plot while the app is open', () => {
    const area = src(`${SP}/StageArea.tsx`);
    assert.match(area, /const stageViews: Record<string, StageView> = \{\};/);
    assert.match(area, /useState<StageView>\(stageViews\[p\.id\] \?\? STAGE_VIEW_FIT\)/);
    assert.match(area, /stageViews\[p\.id\] = view;/);
  });
});

describe('the frozen revision still works as before (no regression)', () => {
  it('a Ready plot moves the revision on at the next edit, a copy summary freezes it too', () => {
    const p = answered(tpl('solo'));
    const r = spMarkReady(p);
    assert.equal(spEdit(r, (d) => (d.notes = 'x')).revision, p.revision + 1);
    const c = spAfterExport(p, snapOf(p), false);
    assert.equal(spEdit(c, (d) => (d.notes = 'x')).revision, p.revision + 1);
    assert.equal(spFreeze(p).packetRevision, 0, 'freezing is not a packet');
  });
  it('spAddSource is untouched by the mono-name change', () => {
    const p = spAddSource(tpl('blank'), { label: 'Keys', category: 'keys' }).p;
    assert.equal(p.sources.length, 1);
  });
});

/* ── checker follow-up (CHECK_STAGEPLOT_R2.md, 2026-11-13) ──────────────── */

describe('checker P1: a damaged saved row never earns the credit', () => {
  // a blank-started, fully answered plot as the store would read it back
  const row = (patch: Record<string, unknown>) => ({ ...JSON.parse(JSON.stringify({ ...answered(tpl('solo')), startedBlank: true })), ...patch });
  const read = (patch: Record<string, unknown>) => {
    const p = spMigrate(row(patch));
    assert.ok(p);
    return p;
  };
  it('a packet record past the revision, or past the frozen one, or not whole, reads as no packet', () => {
    for (const patch of [
      { revision: 1, frozenRevision: 0, packetRevision: 999 },
      { revision: 1, frozenRevision: 0, packetRevision: 1 },
      { revision: 2, frozenRevision: 1, packetRevision: 1.5 },
      { revision: 1, frozenRevision: 1, packetRevision: 1.5 },
      { revision: 3, frozenRevision: 2, packetRevision: 999 },
    ]) {
      const p = read(patch);
      assert.ok(p.packetRevision <= p.frozenRevision && p.frozenRevision <= p.revision, JSON.stringify(patch));
      assert.ok(Number.isInteger(p.packetRevision));
      assert.equal(earns(p), false, `no credit from ${JSON.stringify(patch)}`);
    }
    // 999 on a frozen revision 1 is brought down to 1: the packet of that revision
    assert.equal(read({ revision: 1, frozenRevision: 1, packetRevision: 999 }).packetRevision, 1);
  });
  it('an unreadable revision (0, null, -3, 1.5, "2") reads as revision 1 with nothing shared or packed', () => {
    for (const revision of [0, null, -3, 1.5, '2']) {
      for (const marks of [{}, { frozenRevision: 1, packetRevision: 1 }]) {
        const p = read({ revision, ...marks });
        assert.equal(p.revision, 1, String(revision));
        assert.equal(p.frozenRevision, 0);
        assert.equal(p.packetRevision, 0);
        assert.equal(exportedNow(p), false, `revision ${String(revision)} is not exported`);
        assert.equal(earns(p), false);
      }
    }
  });
  it('a frozen revision past the revision is brought down to it; a good row is kept as it is', () => {
    assert.equal(read({ revision: 2, frozenRevision: 7, packetRevision: 0 }).frozenRevision, 2);
    assert.equal(read({ revision: 2, frozenRevision: -1, packetRevision: 0 }).frozenRevision, 0);
    const good = read({ revision: 3, frozenRevision: 3, packetRevision: 3 });
    assert.deepEqual([good.revision, good.frozenRevision, good.packetRevision], [3, 3, 3]);
    assert.equal(earns(good), true, 'a real packet still counts after a restart');
  });
});

describe('checker P2: Ready, then DOWNLOAD PDF (the usual order) records the packet', () => {
  it('through the UNDO history, the packet-only change is kept', () => {
    let h = spHistoryStart(answered(tpl('solo')));
    h = spHistoryApply(h, spMarkReady(h.present));
    assert.equal(h.present.frozenRevision, h.present.revision);
    const snap = snapOf(h.present);
    const before = h;
    h = spHistoryApply(h, spAfterExport(h.present, snap, true));
    assert.notEqual(h, before, 'the history takes the change (only packetRevision differs)');
    assert.equal(h.present.packetRevision, h.present.revision);
    assert.equal(h.past.length, before.past.length, 'and it is not an UNDO step');
    // what is saved and read back still says a packet was made
    const back = spMigrate(JSON.parse(JSON.stringify(h.present)));
    assert.ok(back);
    assert.equal(exportedNow(back), true);
  });
});

/** The page (1-based) whose text holds a PDF string that starts so; 0 when none. */
function pageWith(bytes: Uint8Array, needle: string): number {
  const streams = [...Buffer.from(bytes).toString('latin1').matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((m) => m[1]).filter((s) => s.includes(' Tj ET'));
  return streams.findIndex((s) => s.includes(`(${needle}`)) + 1;
}

describe('checker P3: the list and facts caps in keepAfter', () => {
  it('list cap: Salsa compact Letter with one sentence of notes keeps the Notes sentence on page 3 (no 179 pt hole)', () => {
    const p = spEdit(tpl('salsa'), (d) => {
      d.notes = 'We change between two sets with a ten minute break; please keep the stage lights low during the change.';
      d.accessNotes = 'The van parks at the rear dock; we need two people to help carry the keyboard case up the stairs.';
    });
    const bytes = spPdfBytes(docOf(p, 'letter', 'compact'));
    assert.equal(pageWith(bytes, 'Notes and unresolved questions'), 3);
    assert.equal(pageWith(bytes, 'We change between'), 3, 'the section and its first sentence stay on page 3');
  });
  it('facts cap: a heading near a page foot keeps its two short lines, though a facts block further on goes overleaf', () => {
    const base = docOf(tpl('blank'), 'letter', 'compact');
    const S = 'Filler sentence for the probe page, long enough to wrap across the line. ';
    for (const n of [71, 72]) {
      const blocks: SpDocBlock[] = [
        { t: 'para', text: S.repeat(n).trim() },
        { t: 'heading', level: 2, text: 'Probe heading' },
        { t: 'para', text: 'First short line under the heading.' },
        { t: 'para', text: 'Second short line under the heading.' },
        { t: 'facts', rows: [['Probe fact', 'value']] },
      ];
      const bytes = spPdfBytes({ ...base, sections: [{ ...base.sections[0], id: 'notes', title: 'Probe section', blocks }] });
      assert.equal(pageWith(bytes, 'Probe fact'), 2, `n=${n}: the probe reaches the page foot`);
      assert.equal(pageWith(bytes, 'Probe heading'), 1, `n=${n}: the heading asks for its first lines, not for every block up to the facts`);
      assert.equal(pageWith(bytes, 'First short line'), 1);
    }
  });
});

/** A whole-number constant from a source file. */
const numberIn = (text: string, name: string): number => {
  const m = new RegExp(`const ${name} = (\\d+);`).exec(text);
  assert.ok(m, `${name} is defined`);
  return Number(m[1]);
};

describe('checker P4: the screen fixes show WHEN they should', () => {
  it('R2-SP1-06: the bar goes narrow below 360 wide, and says "Not saved" in short below 400 wide or 760 tall', () => {
    const screen = src(`${SP}/StagePlotLabScreen.tsx`);
    assert.match(screen, /const narrow = win\.width < SP_BAR_NARROW;/);
    assert.match(screen, /const shortWords = win\.width < SP_BAR_SHORT_W \|\| win\.height < SP_BAR_SHORT_H;/);
    assert.match(screen, /\{shortWords \? SAVE_WORDS_SHORT\[ed\.saveState\] : SAVE_WORDS\[ed\.saveState\]\}/);
    assert.match(screen, /<View style=\{narrow \? styles\.stateNarrow : styles\.state\}>/);
    // the decisions at the tested phone sizes, from the file's own numbers
    const N = numberIn(screen, 'SP_BAR_NARROW');
    const W = numberIn(screen, 'SP_BAR_SHORT_W');
    const H = numberIn(screen, 'SP_BAR_SHORT_H');
    const at = (w: number, h: number) => ({ narrow: w < N, short: w < W || h < H });
    assert.deepEqual(at(320, 640), { narrow: true, short: true });
    assert.deepEqual(at(375, 667), { narrow: false, short: true });
    assert.deepEqual(at(390, 844), { narrow: false, short: true });
    assert.deepEqual(at(430, 932), { narrow: false, short: false });
    assert.deepEqual(at(820, 1180), { narrow: false, short: false });
  });
  it('R2-SP1-05: "▼ MORE" is fully shown at the top and fully gone at the end of the key', () => {
    const key = src(`${SP}/stage/StageKey.tsx`);
    assert.match(key, /inputRange: \[Math\.max\(0, h \+ MORE_H - shownH - 12\), Math\.max\(1, h \+ MORE_H - shownH - 2\)\], outputRange: \[1, 0\], extrapolate: 'clamp'/);
    assert.match(key, /const MORE_H = 18;/);
    assert.match(key, /more: \{ height: MORE_H,/);
    // the same interpolation, worked: a 109-tall key in a 59-tall window
    const h = 109;
    const shownH = 59;
    const lo = Math.max(0, h + 18 - shownH - 12);
    const hi = Math.max(1, h + 18 - shownH - 2);
    const opacity = (y: number) => 1 - Math.min(1, Math.max(0, (y - lo) / (hi - lo)));
    assert.equal(opacity(0), 1);
    assert.equal(opacity(h + 18 - shownH), 0, 'at the end of the scroll');
  });
  it('R2-SP2-09: the reserved-channel note shows only when the typed number is reserved', () => {
    const ed = src(`${SP}/inputs/InputEditor.tsx`);
    assert.match(ed, /\{n != null && patch\?\.reserved\.includes\(n\) \? \(\s*<Note tone="warning">\s*Channel \{n\} is kept free on purpose/);
  });
  it('R2-SP1-07: the phone note shows only for a typed phone that fails the review’s own test', () => {
    const setup = src(`${SP}/SetupArea.tsx`);
    assert.match(setup, /\{f\.key === 'phone' && p\.contact\.phone\.trim\(\) && !spLooksLikePhone\(p\.contact\.phone\) \? <Note tone="warning">This does not look like a phone number\./);
    // and the review uses the same test
    assert.match(src('features/stageplot/spReview.ts'), /c\.show\.phone && spLooksLikePhone\(c\.phone\)/);
  });
  it('R2-SP1-08: a refused size is shown in its field until a size is taken', () => {
    const setup = src(`${SP}/SetupArea.tsx`);
    assert.match(setup, /const sizeShown = \(key: 'width' \| 'depth'\): string => sizeRefused\[key\] \?\? \(p\.stage\[key\] == null \? '' : String\(p\.stage\[key\]\)\);/);
    // set only when the field is LEFT with a refused size; cleared by a size that is taken
    assert.match(setup, /if \(typeof n === 'string'\) \{\s*if \(how !== 'paused'\) \{\s*setSizeSaid\(SIZE_SAID\[n\]\);\s*setSizeRefused\(\(r\) => \(\{ \.\.\.r, \[key\]: text \}\)\);/);
    assert.match(setup, /setSizeRefused\(\(r\) => \(\{ \.\.\.r, \[key\]: undefined \}\)\);\s*setSizeSaid\(null\);/);
  });
  it('round-1 18a: the clamp note shows only when the typed number was moved into range', () => {
    const form = src(`${SP}/spForm.tsx`);
    assert.match(form, /const typed = n;\s*if \(min != null\) n = Math\.max\(min, n\);\s*if \(max != null\) n = Math\.min\(max, n\);\s*setMoved\(n === typed \? '' :/);
    // a field left as shown, or emptied, says nothing
    assert.match(form, /if \(t === shown\) \{\s*setMoved\(''\);/);
    assert.match(form, /if \(how === 'left'\) \{\s*setMoved\(''\);\s*onCommit\(null\);/);
    assert.match(form, /\{moved \? \(\s*<Text style=\{\[styles\.hint, styles\.hintMoved\]\}/);
  });
});

/* ── owner 2026-11-13: "Plot only" is not the packet; checker P6 ─────────── */

describe('owner 2026-11-13: a "Stage plot only" PDF does not complete "Make the packet"', () => {
  it('a plot-only PDF freezes the revision and records no packet; full and compact do', () => {
    const p = { ...answered(tpl('solo')), startedBlank: true };
    const plotOnly = spAfterExport(p, snapOf(p, 'letter', 'plot'), true);
    assert.equal(plotOnly.frozenRevision, p.revision, 'the page that left the app froze its revision');
    assert.equal(plotOnly.packetRevision, 0, 'but it is not the packet');
    assert.equal(exportedNow(plotOnly), false);
    assert.equal(spGuidedSteps(plotOnly, exportedNow(plotOnly))[4].done, false, 'step 5 stays To do');
    assert.equal(earns(plotOnly), false, 'no credit from a plot-only page');
    for (const paper of ['letter', 'a4'] as const) {
      for (const packet of ['full', 'compact'] as const) {
        const made = spAfterExport(p, snapOf(p, paper, packet), true);
        assert.equal(made.packetRevision, p.revision, `${packet} ${paper}`);
        assert.equal(earns(made), true, `${packet} ${paper} earns it on a blank-started plot`);
      }
      assert.equal(spAfterExport(p, snapOf(p, paper, 'plot'), true).packetRevision, 0, `plot ${paper}`);
    }
    // a plot-only page after a full packet takes nothing back
    const full = spAfterExport(p, snapOf(p, 'letter', 'full'), true);
    assert.equal(spAfterExport(full, snapOf(full, 'letter', 'plot'), true).packetRevision, full.revision);
  });
  it('through the history (Ready, then a plot-only PDF): still no packet', () => {
    let h = spHistoryStart({ ...answered(tpl('solo')), startedBlank: true });
    h = spHistoryApply(h, spMarkReady(h.present));
    h = spHistoryApply(h, spAfterExport(h.present, snapOf(h.present, 'letter', 'plot'), true));
    assert.equal(h.present.packetRevision, 0);
    assert.equal(earns(h.present), false);
  });
  it('the rule is the model’s, one function; the Plot only choice still makes its PDF', () => {
    assert.equal(spPacketCounts('full'), true);
    assert.equal(spPacketCounts('compact'), true);
    assert.equal(spPacketCounts('plot'), false);
    assert.match(src('features/stageplot/spPacket.ts'), /const counts = packetMade && spPacketCounts\(snap\.options\.packet\);/);
    // the plot-only page is still a working PDF
    assert.ok(spPdfBytes(docOf(tpl('salsa'), 'letter', 'plot')).length > 1000);
  });
  it('the guided task and the Export area say so in plain words, and Export says it only while Plot only is chosen', () => {
    const words = 'A plot-only page does not complete the guided task’s last step: make the full or compact packet.';
    assert.equal(SP_PLOT_ONLY_WORDS, words);
    const area = src(`${SP}/ExportArea.tsx`);
    assert.match(area, /\{packet === 'plot' \? <Note>\{SP_PLOT_ONLY_WORDS\}<\/Note> : null\}/);
    assert.match(src(`${SP}/GuidedTask.tsx`), /In Export, download, print or share the full or compact packet\. A plot-only page does not complete this step/);
  });
});

/** Pages (not the last) that end with a heading and only ONE list item
 *  under it, while the list goes on overleaf (checker P6). */
function pagesEndingOnOneItem(bytes: Uint8Array): number[] {
  const pages = [...Buffer.from(bytes).toString('latin1').matchAll(/stream\n([\s\S]*?)\nendstream/g)]
    .map((m) => m[1])
    .filter((s) => s.includes(' Tj ET'))
    .map((s) =>
      [...s.matchAll(/1 0 0 1 [\d.]+ ([\d.]+) Tm \/F\d ([\d.]+) Tf \((.*)\) Tj ET/g)]
        .map((m) => ({ y: Number(m[1]), size: Number(m[2]), t: m[3] }))
        .filter((l) => !(l.t.includes('Page ') && l.t.includes(' of ')) && l.t !== 'DRAFT' && l.y < 715 && l.y > 50)
        .sort((a, b) => b.y - a.y),
    );
  const out: number[] = [];
  pages.forEach((L, i) => {
    if (i === pages.length - 1 || !L.length) return;
    let hi = -1;
    L.forEach((l, k) => {
      if (l.size > 10.5) hi = k;
    });
    if (hi < 0) return;
    const bullets = L.slice(hi + 1).filter((l) => l.t === '\\225').length;
    const next = pages[i + 1][0];
    if (bullets === 1 && next && next.t === '\\225') out.push(i + 1);
  });
  return out;
}

describe('checker P6: a list heading keeps its first two items at a page foot', () => {
  const G = 'We change between two sets with a ten minute break; please keep the stage lights low during the change. ';
  const A = 'The van parks at the rear dock; we need two people to help carry the keyboard case up the stairs. ';
  /** The checker's packet: long notes, no contact, long names, three extra sources. */
  const longQuestions = (t: SpTemplateId) => {
    let p = spEdit(tpl(t), (d) => {
      d.notes = G.repeat(9).trim();
      d.accessNotes = A.repeat(3).trim();
      d.contact.name = '';
      d.contact.phone = '';
      d.contact.email = '';
      for (const pf of d.performers) pf.name = `${pf.name} the performer with a long stage name that wraps`;
    });
    for (let k = 0; k < 3; k++) p = spAddSource(p, { label: `Extra source ${k + 1} with a long descriptive name that keeps going`, category: 'other' }).p;
    return p;
  };
  it('the checker’s case: Playback, full, US Letter: "Unresolved: to be confirmed" goes overleaf with its items', () => {
    const bytes = spPdfBytes(docOf(longQuestions('playback'), 'letter', 'full'));
    assert.deepEqual(pagesEndingOnOneItem(bytes), []);
    assert.deepEqual(pagesEndingOnHeading(bytes), []);
  });
  it('every example, both papers, both packets', () => {
    const bad: string[] = [];
    for (const t of ['solo', 'duo', 'four-piece', 'playback', 'salsa'] as const)
      for (const paper of ['letter', 'a4'] as const)
        for (const packet of ['full', 'compact'] as const) {
          const pages = pagesEndingOnOneItem(spPdfBytes(docOf(longQuestions(t), paper, packet)));
          if (pages.length) bad.push(`${t} ${paper} ${packet}: page ${pages.join(', ')}`);
        }
    assert.deepEqual(bad, []);
  });
});
