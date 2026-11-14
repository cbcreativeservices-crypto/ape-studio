/**
 * Stage boxes, round 2 (owner 2026-11-13: "Yes, build them all", the items
 * held from the stage-box feature):
 *
 *   RETURNS   each monitor mix may be given a stage box return ("SB1 ·
 *             return 3", a stereo mix two neighbouring ones), "From the
 *             console", or none yet; by hand or AUTO-ASSIGN RETURNS (one
 *             UNDO). Printed in the monitor plan (a column only when a box
 *             has returns) and the patch summary ("returns 1–6: M1–M5").
 *             Review: a return used twice, a return past the box's count
 *             (must correct); more returns asked for than the boxes have
 *             (question).
 *   SUB-SNAKE a box may plug into sockets of another box ("SB2 → SB1
 *             sockets 9–16"); its inputs read "SB2 · 3 (via SB1 · 11)". A
 *             loop can never be made. AUTO-ASSIGN never uses those sockets.
 *             Review: overlap, too short, past the main box (must correct).
 *   CONSOLE   a band's own digital box is asked once which console it
 *             connects to; answered by "Connects to" or "to be confirmed".
 *
 * No schema change: a plot saved at schema 1 or 2 reads with every new field
 * at its blank value, and every example prints as before.
 *
 * Run: node --test --test-timeout=120000 test/stagePlotBoxesMore_20261113.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spBoxLine, spBoxUse, spOpenItems, spTextSummary } from '../src/features/stageplot/spDerive.ts';
import { spHistoryApply, spHistoryStart, spHistoryUndo } from '../src/features/stageplot/spHistory.ts';
import * as M from '../src/features/stageplot/spModel.ts';
import { spBuildDoc, spBuildSnapshot, spDocText } from '../src/features/stageplot/spPacket.ts';
import { spPdfBytes } from '../src/features/stageplot/spPdf.ts';
import { spReview, type SpIssue } from '../src/features/stageplot/spReview.ts';
import { SP_TEMPLATES, spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpDocTable } from '../src/features/stageplot/spDocTypes.ts';
import { SP_SCHEMA, type SpProject } from '../src/features/stageplot/spTypes.ts';
import { spIssueSelection } from '../src/screens/lab/stageplot/spIssueActions.ts';
import { spBoxFreeSocket, spBoxSocketLines, spRowBoxWords, spSocketSub } from '../src/screens/lab/stageplot/inputs/inputsLogic.ts';
import { spmAutoReturnSaid, spmBoxReturnLines, spmFreeReturn, spmReturnLine, spmSameReturn, SPM_IEM_RETURN_HELP, SPM_RETURNS_HELP } from '../src/screens/lab/stageplot/monitors/monitorPlan.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (f: string): string => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const NOW = Date.UTC(2026, 10, 13, 20, 0);
const four = (id = 'p-four'): SpProject => spFromTemplate('four-piece', { id, now: NOW, band: 'The Example Four' });
const salsa = (id = 'p-salsa'): SpProject => spFromTemplate('salsa', { id, now: NOW, band: 'Orquesta Ejemplo' });
const rule = (p: SpProject, r: string): SpIssue[] => spReview(p).filter((i) => i.rule === r);
const mix = (p: SpProject, code: string) => p.mixes.find((m) => m.code === code) as SpProject['mixes'][number];
const box = (p: SpProject, name: string) => p.boxes.find((b) => b.name === name) as SpProject['boxes'][number];
const input = (p: SpProject, label: string) => p.inputs.find((i) => i.label === label) as SpProject['inputs'][number];
const docOf = (p: SpProject, packet: 'full' | 'compact' = 'full') => spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet }, NOW));
const tables = (p: SpProject, section: string, packet: 'full' | 'compact' = 'full'): SpDocTable[] =>
  (docOf(p, packet).sections.find((s) => s.id === section)?.blocks ?? []).flatMap((b) => (b.t === 'table' ? [b.table] : []));
const listItems = (p: SpProject, section: string): string[] => (docOf(p).sections.find((s) => s.id === section)?.blocks ?? []).flatMap((b) => (b.t === 'list' ? b.items : []));

/** The four-piece with SB1 (16 inputs, 8 returns) by the wedges, downstage. */
function withReturns(returns: number | null = 8): { p: SpProject; sb1: string } {
  const r = M.spAddBox(four(), { name: 'SB1', inputs: 16, returns, kind: 'digital', supplier: 'venue', at: { x: 0.5, y: 0.9 } });
  return { p: r.p, sb1: r.id };
}

/* ── defaults, schema, examples ─────────────────────────────────────────── */

describe('round 2: blank values, schema and the examples', () => {
  it('a new mix has no return and is not "from the console"; a new box has no feed and names no console', () => {
    const p = M.spAddMix(M.spNewProject({ id: 'x', now: NOW })).p;
    assert.equal(p.mixes[0].ret, null);
    assert.equal(p.mixes[0].fromConsole, false);
    const q = M.spAddBox(p).p;
    assert.equal(q.boxes[0].feed, null);
    assert.equal(q.boxes[0].connectsTo, '');
    assert.equal(q.boxes[0].connectsTbc, false);
  });

  it('no schema change: still 2', () => {
    assert.equal(SP_SCHEMA, 2);
  });

  it('every example has no box, so no Box return column, no via words and no new question', () => {
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `t-${t.id}`, now: NOW });
      for (const m of p.mixes) assert.deepEqual([m.ret, m.fromConsole], [null, false], t.id);
      for (const tb of tables(p, 'monitors')) assert.ok(!tb.columns.some((c) => c.key === 'ret'), t.id);
      const text = p.mixes.length || p.inputs.length ? spDocText(docOf(p)) : '';
      assert.ok(!/Box return|\(via |sub-snake|Connects to|connects to/.test(text), t.id);
      assert.deepEqual(spReview(p).filter((i) => /^(return|returns|box-feed|box-console)/.test(i.rule)), [], t.id);
    }
  });

  it('a plot saved at schema 1 or 2, before these fields, reads with every one at its blank value', () => {
    const { p } = withReturns();
    for (const schema of [1, 2]) {
      const old = JSON.parse(JSON.stringify(p)) as Record<string, unknown> & SpProject;
      old.schema = schema;
      for (const m of old.mixes as unknown as Record<string, unknown>[]) {
        delete m.ret;
        delete m.fromConsole;
      }
      for (const b of old.boxes as unknown as Record<string, unknown>[]) {
        delete b.feed;
        delete b.connectsTo;
        delete b.connectsTbc;
      }
      if (schema === 1) delete (old as Record<string, unknown>).boxes;
      const q = M.spMigrate(old) as SpProject;
      assert.ok(q, `schema ${schema}`);
      assert.equal(q.schema, 2);
      for (const m of q.mixes) assert.deepEqual([m.ret, m.fromConsole], [null, false]);
      for (const b of q.boxes) assert.deepEqual([b.feed, b.connectsTo, b.connectsTbc], [null, '', false]);
      assert.deepEqual(M.spBrokenRefs(q), []);
    }
  });

  it('junk in the new fields falls back safely; a return or feed to a box that is gone, and a saved loop, are dropped', () => {
    let { p, sb1 } = withReturns();
    const r = M.spAddBox(p, { name: 'SB2', inputs: 8 });
    p = r.p;
    const raw = JSON.parse(JSON.stringify(p)) as SpProject;
    (raw.mixes[0] as unknown as Record<string, unknown>).ret = 'return 3';
    (raw.mixes[0] as unknown as Record<string, unknown>).fromConsole = 'yes';
    raw.mixes[1].ret = { boxId: 'gone', ret: 2, byHand: true };
    raw.mixes[2].ret = { boxId: sb1, ret: Number.NaN, byHand: true };
    (raw.boxes[0] as unknown as Record<string, unknown>).connectsTo = 7;
    (raw.boxes[0] as unknown as Record<string, unknown>).feed = { boxId: 5, first: 1, last: 8 };
    // a loop, as only a damaged save could hold it
    raw.boxes[0].feed = { boxId: r.id, first: 1, last: 8 };
    raw.boxes[1].feed = { boxId: sb1, first: 9, last: 16 };
    (raw.boxes[1] as unknown as Record<string, unknown>).connectsTbc = 'no';
    const q = M.spMigrate(raw) as SpProject;
    assert.equal(q.mixes[0].ret, null);
    assert.equal(q.mixes[0].fromConsole, false);
    assert.equal(q.mixes[1].ret, null);
    assert.equal(q.mixes[2].ret, null);
    assert.equal(q.boxes[0].connectsTo, '');
    assert.equal(q.boxes[1].connectsTbc, false);
    assert.equal([q.boxes[0].feed, q.boxes[1].feed].filter(Boolean).length, 1, 'a loop is never kept');
    assert.deepEqual(M.spBrokenRefs(q), []);
    assert.equal(M.spMigrate({ ...raw, schema: 3 }), null, 'a later schema is not read');
  });
});

/* ── returns ────────────────────────────────────────────────────────────── */

describe('monitor returns tied to mixes', () => {
  it('by hand: "SB1 · return 3"; a stereo mix takes two neighbouring returns; From the console clears it', () => {
    let { p, sb1 } = withReturns();
    p = M.spAssignReturn(p, mix(p, 'M1').id, { boxId: sb1, ret: 3 });
    assert.equal(M.spReturnWords(p, mix(p, 'M1')), 'SB1 · return 3');
    assert.equal(mix(p, 'M1').ret?.byHand, true);
    p = M.spAssignReturn(p, mix(p, 'M3').id, { boxId: sb1, ret: 5 });
    assert.equal(mix(p, 'M3').format, 'stereo');
    assert.deepEqual(M.spReturnRange(mix(p, 'M3')), [5, 6]);
    assert.equal(M.spReturnWords(p, mix(p, 'M3')), 'SB1 · returns 5–6');
    p = M.spSetFromConsole(p, mix(p, 'M3').id, true);
    assert.equal(mix(p, 'M3').ret, null);
    assert.equal(M.spReturnWords(p, mix(p, 'M3')), 'From the console');
    p = M.spAssignReturn(p, mix(p, 'M3').id, { boxId: sb1, ret: 5 });
    assert.equal(mix(p, 'M3').fromConsole, false, 'a return chosen answers "from the console"');
  });

  it('AUTO-ASSIGN RETURNS: lowest returns in mix order, a stereo pair on neighbours, never over one chosen by hand', () => {
    let { p, sb1 } = withReturns();
    p = M.spAssignReturn(p, mix(p, 'M2').id, { boxId: sb1, ret: 1 });
    const r = M.spAutoAssignReturns(p);
    p = r.p;
    assert.equal(mix(p, 'M2').ret?.ret, 1, 'by hand: never moved');
    assert.equal(mix(p, 'M1').ret?.ret, 2);
    assert.deepEqual(M.spReturnRange(mix(p, 'M3')), [3, 4], 'the drum in-ear mix goes to the box by its drawn transmitter');
    assert.deepEqual(M.spReturnRange(mix(p, 'M4')), [5, 6]);
    assert.equal(r.placed, 3);
    assert.equal(r.left, 0);
    for (const m of p.mixes) if (m.code !== 'M2') assert.equal(m.ret?.byHand, false);
  });

  it('one UNDO puts every return back', () => {
    const { p } = withReturns();
    let h = spHistoryStart(p);
    h = spHistoryApply(h, M.spAutoAssignReturns(h.present).p);
    assert.ok(h.present.mixes.every((m) => m.ret));
    h = spHistoryUndo(h);
    assert.ok(h.present.mixes.every((m) => m.ret === null));
  });

  it('skips a mix from the console and a mix the band makes itself; a wireless in-ear mix with no transmitter or rack drawn is left, and says why', () => {
    let { p } = withReturns();
    p = M.spSetFromConsole(p, mix(p, 'M1').id, true);
    p = M.spUpdateMix(p, mix(p, 'M2').id, { provider: 'band-console' });
    // take the transmitter's drawing off the stage (and no rack is drawn)
    const tx = p.devices.find((d) => d.type === 'iem-tx' && d.mixId === mix(p, 'M3').id);
    assert.ok(tx);
    p = M.spEdit(p, (d) => {
      d.objects = d.objects.filter((o) => o.deviceId !== tx.id && o.kind !== 'rack');
    });
    const r = M.spAutoAssignReturns(p);
    assert.equal(r.iem, 1);
    assert.equal(r.placed, 1, 'only M4');
    assert.equal(mix(r.p, 'M1').ret, null);
    assert.equal(mix(r.p, 'M2').ret, null);
    assert.equal(mix(r.p, 'M3').ret, null);
    assert.match(spmAutoReturnSaid(r), /transmitter is not drawn/);
    assert.match(spmAutoReturnSaid(r), /UNDO puts every return back/);
  });

  it('the box nearest the mix’s devices; too few returns leaves mixes, and says so', () => {
    let p = four();
    const near = M.spAddBox(p, { name: 'SB1', inputs: 8, returns: 2, at: { x: 0.2, y: 0.9 } });
    p = near.p;
    const far = M.spAddBox(p, { name: 'SB2', inputs: 8, returns: 1, at: { x: 0.95, y: 0.05 } });
    p = far.p;
    const r = M.spAutoAssignReturns(p);
    assert.ok(r.left >= 1);
    assert.match(spmAutoReturnSaid(r), /do not have enough returns/);
    const onNear = r.p.mixes.filter((m) => m.ret?.boxId === near.id).map((m) => m.code);
    assert.ok(onNear.length >= 1);
  });

  it('a sub-snake’s returns are not used by AUTO-ASSIGN (they reach it through its main box)', () => {
    let { p, sb1 } = withReturns();
    const sub = M.spAddBox(p, { name: 'SB2', inputs: 8, returns: 4, at: { x: 0.5, y: 0.95 } });
    p = M.spSetBoxFeed(sub.p, sub.id, { boxId: sb1 });
    const r = M.spAutoAssignReturns(p);
    assert.ok(r.p.mixes.every((m) => m.ret?.boxId !== sub.id));
  });

  it('removing a box takes its mixes off their returns; a copy keeps its returns on its own boxes', () => {
    let { p, sb1 } = withReturns();
    p = M.spAutoAssignReturns(p).p;
    const copy = M.spDuplicateProject(p, { id: 'c', kind: 'gig', now: NOW });
    const cbox = copy.boxes[0].id;
    assert.notEqual(cbox, sb1);
    assert.ok(copy.mixes.every((m) => m.ret?.boxId === cbox));
    assert.deepEqual(M.spBrokenRefs(copy), []);
    p = M.spRemoveBox(p, sb1);
    assert.ok(p.mixes.every((m) => m.ret === null));
  });

  it('screen helpers: the card line, the editor’s lowest free return, the box’s return lines, a shared return', () => {
    let { p, sb1 } = withReturns();
    assert.equal(spmReturnLine(p, mix(p, 'M1')), 'Stage box return: none yet. Choose one in EDIT MIX, or tap AUTO-ASSIGN RETURNS.');
    p = M.spUpdateMix(p, mix(p, 'M2').id, { provider: 'band-console' });
    assert.match(spmReturnLine(p, mix(p, 'M2')), /not needed/);
    p = M.spAssignReturn(p, mix(p, 'M1').id, { boxId: sb1, ret: 1 });
    assert.equal(spmFreeReturn(p, sb1, 2), 3, 'a stereo pair starts on an odd return');
    assert.equal(spmFreeReturn(p, sb1, 1, mix(p, 'M1').id), 1, 'its own return counts as unused');
    p = M.spAssignReturn(p, mix(p, 'M3').id, { boxId: sb1, ret: 1 });
    assert.deepEqual(spmSameReturn(p, mix(p, 'M1').id).map((m) => m.code), ['M3']);
    const lines = spmBoxReturnLines(p, sb1);
    assert.ok(lines.includes('1 · M1 Lead vocal (shares a return with another mix: give each its own)'), lines.join(' | '));
    assert.ok(lines.some((l) => l.startsWith('1–2 · M3') && l.includes('(stereo)') && l.includes('shares a return')));
    assert.ok(lines.includes('Not used yet: 3–8'));
    assert.equal(spmReturnLine(withReturns(null).p, mix(four(), 'M1')), '', 'no box with returns: no line');
  });
});

describe('returns: the review', () => {
  it('a return used twice must be corrected; GO TO opens the mix at its return', () => {
    let { p, sb1 } = withReturns();
    p = M.spAssignReturn(p, mix(p, 'M1').id, { boxId: sb1, ret: 2 });
    p = M.spAssignReturn(p, mix(p, 'M3').id, { boxId: sb1, ret: 1 });
    const q = rule(p, 'return-twice');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'block');
    assert.equal(q[0].area, 'monitors');
    assert.equal(q[0].field, 'ret');
    assert.match(q[0].text, /SB1 return 2 is given to M1 and M3\. One return carries one mix/);
    assert.deepEqual(spIssueSelection(q[0]), { kind: 'mix', id: mix(p, 'M3').id });
  });

  it('a return past the box’s count must be corrected (a stereo mix’s second return too)', () => {
    let { p, sb1 } = withReturns(4);
    p = M.spAssignReturn(p, mix(p, 'M3').id, { boxId: sb1, ret: 4 });
    const q = rule(p, 'return-over');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'block');
    assert.match(q[0].text, /SB1 has 4 returns, and M3 is on returns 4–5/);
    p = M.spUpdateBox(p, sb1, { returns: 6 });
    assert.equal(rule(p, 'return-over').length, 0);
  });

  it('more returns asked for than the boxes have is a question, only while a box has returns', () => {
    // four-piece: M1, M2 mono and M3, M4 stereo = 6 returns
    let { p } = withReturns(4);
    const q = rule(p, 'returns-short');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'ask');
    assert.match(q[0].text, /4 mixes need 6 returns \(a stereo mix takes two\), and the stage boxes have 4/);
    assert.match(q[0].packetText ?? '', /stage boxes listed have 4/);
    p = M.spSetFromConsole(p, mix(p, 'M3').id, true);
    assert.equal(rule(p, 'returns-short').length, 0, 'a mix from the console needs no return');
    assert.equal(rule(withReturns(null).p, 'returns-short').length, 0, 'no returns given: not asked');
    assert.equal(rule(withReturns(8).p, 'returns-short').length, 0);
  });
});

describe('returns: on paper', () => {
  it('a "Box return" column only when a box has returns, in the full and compact monitor plans', () => {
    let { p, sb1 } = withReturns();
    p = M.spAssignReturn(p, mix(p, 'M1').id, { boxId: sb1, ret: 1 });
    p = M.spSetFromConsole(p, mix(p, 'M3').id, true);
    for (const packet of ['full', 'compact'] as const) {
      const t = tables(p, 'monitors', packet).find((x) => x.columns.some((c) => c.key === 'mix')) as SpDocTable;
      assert.ok(t.columns.some((c) => c.key === 'ret' && c.label === 'Stage box return'), packet);
      const cell = (code: string) => t.rows.find((r) => r.cells.mix.startsWith(code))?.cells.ret;
      assert.equal(cell('M1'), 'SB1 · return 1');
      assert.equal(cell('M2'), 'No return yet');
      assert.equal(cell('M3'), 'From the console, not a stage box');
    }
    const none = withReturns(null).p;
    for (const packet of ['full', 'compact'] as const) for (const t of tables(none, 'monitors', packet)) assert.ok(!t.columns.some((c) => c.key === 'ret'), packet);
  });

  it('the patch summary, return by return: "returns 1 M1, 2 M2, 3–4 M3, 5–6 M4, 2 free"; the text summary too; and a line that it is a suggestion', () => {
    const p = M.spAutoAssignReturns(withReturns().p).p;
    const item = listItems(p, 'inputs').find((x) => x.startsWith('SB1'));
    assert.ok(item?.includes('returns 1 M1, 2 M2, 3–4 M3, 5–6 M4, 2 free'), item);
    assert.match(spTextSummary(p), /returns 1 M1, 2 M2, 3–4 M3, 5–6 M4, 2 free/);
    assert.match(spBoxLine(spBoxUse(p)[0], p), /returns 1 M1/);
    assert.match(spDocText(docOf(p)), /Stage box returns are the band’s suggestion/);
  });

  it('a stereo mix starts on an odd return (1–2, 3–4), as consoles link their outputs', () => {
    let { p, sb1 } = withReturns();
    p = M.spAssignReturn(p, mix(p, 'M1').id, { boxId: sb1, ret: 1 });
    p = M.spAutoAssignReturns(p).p;
    assert.deepEqual(M.spReturnRange(mix(p, 'M3')), [3, 4]);
    assert.deepEqual(M.spReturnRange(mix(p, 'M4')), [5, 6]);
    assert.equal(mix(p, 'M2').ret?.ret, 2, 'a mono mix takes the even return left');
  });

  it('a plot with returns makes its PDF on both papers', () => {
    const p = M.spAutoAssignReturns(withReturns().p).p;
    for (const paper of ['letter', 'a4'] as const) {
      const bytes = spPdfBytes(spBuildDoc(spBuildSnapshot(p, { paper, packet: 'full' }, NOW)));
      assert.ok(bytes.length > 1000);
    }
  });
});

/* ── sub-snakes ─────────────────────────────────────────────────────────── */

/** The four-piece with SB1 (16) and a drum sub SB2 (8) into SB1 9–16. */
function withSub(): { p: SpProject; sb1: string; sb2: string } {
  let p = four();
  const a = M.spAddBox(p, { name: 'SB1', inputs: 16, returns: 8, kind: 'digital', supplier: 'venue', at: { x: 0.15, y: 0.1 } });
  const b = M.spAddBox(a.p, { name: 'SB2', inputs: 8, kind: 'analog', supplier: 'band', at: { x: 0.5, y: 0.1 } });
  p = M.spSetBoxFeed(b.p, b.id, { boxId: a.id, first: 9 });
  return { p, sb1: a.id, sb2: b.id };
}

describe('a sub-snake that feeds another box', () => {
  it('"SB2 → SB1 sockets 9–16"; with no range given it takes the first run of the main box nothing uses', () => {
    const { p, sb1, sb2 } = withSub();
    assert.deepEqual(box(p, 'SB2').feed, { boxId: sb1, first: 9, last: 16 });
    assert.equal(M.spBoxFeedWords(p, box(p, 'SB2')), '→ SB1 sockets 9–16');
    assert.equal(M.spBoxFeedWords(p, box(p, 'SB1')), '→ the console directly');
    let q = M.spAssignBox(p, input(p, 'Kick').id, { boxId: sb1, socket: 1 });
    q = M.spSetBoxFeed(M.spSetBoxFeed(q, sb2, null), sb2, { boxId: sb1 });
    assert.deepEqual([box(q, 'SB2').feed?.first, box(q, 'SB2').feed?.last], [2, 9]);
  });

  it('its inputs read "SB2 · 3 (via SB1 · 11)" in the input list, on the row and in the Box · socket column', () => {
    let { p, sb2 } = withSub();
    p = M.spAssignBox(p, input(p, 'Kick').id, { boxId: sb2, socket: 3 });
    assert.equal(M.spBoxPatchWords(p, input(p, 'Kick')), 'SB2 · 3 (via SB1 · 11)');
    assert.equal(spRowBoxWords(p, input(p, 'Kick')), 'SB2 · 3 (via SB1 · 11)');
    const t = tables(p, 'inputs')[0];
    const row = t.rows.find((r) => r.cells.input === 'Kick');
    assert.equal(row?.cells.box, 'SB2 · 3 (via SB1 · 11)');
  });

  it('a chain reads through every box; a socket past what the feed carries says so', () => {
    let { p, sb2 } = withSub();
    const c = M.spAddBox(p, { name: 'SB3', inputs: 4 });
    p = M.spSetBoxFeed(c.p, c.id, { boxId: sb2, first: 5, last: 8 });
    p = M.spAssignBox(p, input(p, 'Kick').id, { boxId: c.id, socket: 2 });
    assert.equal(M.spBoxPatchWords(p, input(p, 'Kick')), 'SB3 · 2 (via SB2 · 6, SB1 · 14)');
    p = M.spSetBoxFeed(p, c.id, { boxId: sb2, first: 5, last: 5 });
    assert.equal(M.spBoxPatchWords(p, input(p, 'Kick')), 'SB3 · 2 (past its feed to SB2)');
  });

  it('a loop is impossible: it is never offered, and refused if asked for', () => {
    const { p, sb1, sb2 } = withSub();
    assert.deepEqual(M.spFeedTargets(p, sb1).map((b) => b.name), [], 'SB2 already plugs into SB1');
    assert.deepEqual(M.spFeedTargets(p, sb2).map((b) => b.name), ['SB1']);
    assert.equal(M.spSetBoxFeed(p, sb1, { boxId: sb2 }), p, 'refused: nothing changes');
    assert.equal(M.spSetBoxFeed(p, sb1, { boxId: sb1 }), p, 'a box cannot feed itself');
    assert.equal(M.spFeedLoops(p, sb1, sb2), true);
  });

  it('AUTO-ASSIGN never uses the sockets a sub-snake plugs into; nor does a socket chosen in an editor', () => {
    const { p, sb1 } = withSub();
    const q = M.spAutoAssignBoxes(p).p;
    for (const i of q.inputs) if (i.box?.boxId === sb1) assert.ok(i.box.socket < 9, `${i.label} on ${i.box.socket}`);
    // sockets 1–8 taken by hand: SB1 has no free socket left (9–16 carry SB2)
    let full = p;
    p.inputs.slice(0, 8).forEach((i, k) => (full = M.spAssignBox(full, i.id, { boxId: sb1, socket: k + 1 })));
    assert.equal(spBoxFreeSocket(full, sb1), null);
    assert.equal(spBoxFreeSocket(p, sb1), 1);
  });

  it('the main box’s socket lines name the sub-snake, and its free count leaves those sockets out', () => {
    const { p, sb1 } = withSub();
    const lines = spBoxSocketLines(p, sb1);
    assert.ok(lines.includes('9–16 · SB2 plugs in here (a sub-snake)'), lines.join(' | '));
    assert.ok(lines.includes('Free: 1–8'));
    assert.equal(spBoxUse(p).find((u) => u.box.id === sb1)?.free, 8);
  });

  it('review: an input on the sockets the sub-snake takes must be corrected', () => {
    let { p, sb1, sb2 } = withSub();
    p = M.spAssignBox(p, input(p, 'Kick').id, { boxId: sb1, socket: 10 });
    const q = rule(p, 'box-feed-overlap');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'block');
    assert.equal(q[0].field, 'feed');
    assert.deepEqual(spIssueSelection(q[0]), { kind: 'box', id: sb2 });
    assert.match(q[0].text, /SB2 plugs into SB1 sockets 9–16, and socket 10 of SB1 is also given to Kick\. One socket takes one cable/);
    assert.equal(spSocketSub(p, input(p, 'Kick').id)?.name, 'SB2', 'the input’s editor warns too');
  });

  it('review: two sub-snakes on the same sockets must be corrected', () => {
    let { p, sb1 } = withSub();
    const c = M.spAddBox(p, { name: 'SB3', inputs: 4 });
    p = M.spSetBoxFeed(c.p, c.id, { boxId: sb1, first: 15, last: 18 });
    const q = rule(p, 'box-feed-overlap');
    assert.equal(q.length, 1);
    assert.match(q[0].text, /SB3 plugs into SB1 sockets 15–18, and sockets 15–16 of SB1 are also given to SB2/);
    assert.equal(rule(p, 'box-feed-past').length, 1, 'and SB1 has no sockets 17 and 18');
  });

  it('review: a feed shorter than the sub-snake’s sockets in use must be corrected', () => {
    let { p, sb1, sb2 } = withSub();
    p = M.spAssignBox(p, input(p, 'Kick').id, { boxId: sb2, socket: 7 });
    p = M.spSetBoxFeed(p, sb2, { boxId: sb1, first: 9, last: 14 });
    const q = rule(p, 'box-feed-short');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'block');
    assert.match(q[0].text, /SB2 plugs into SB1 sockets 9–14: that carries sockets 1–6 of SB2 only, and Kick is on socket 7/);
  });

  it('a main box that only carries a sub-snake is not asked about as empty', () => {
    let { p, sb2 } = withSub();
    p = M.spAssignBox(p, input(p, 'Kick').id, { boxId: sb2, socket: 1 });
    assert.ok(!rule(p, 'box-empty').some((i) => i.target.id === box(p, 'SB1').id));
  });

  it('the patch summary and the text summary say it; removing the main box sends the sub to the console', () => {
    let { p, sb1 } = withSub();
    p = M.spAutoAssignBoxes(p).p;
    const items = listItems(p, 'inputs');
    assert.ok(items.find((x) => x.startsWith('SB1'))?.includes('sockets 9–16: SB2 (sub-snake)'));
    assert.ok(items.find((x) => x.startsWith('SB2'))?.includes('a sub-snake, plugs into SB1 sockets 9–16'));
    assert.match(spTextSummary(p), /SB2 \(8 inputs, analog\): .*plugs into SB1 sockets 9–16/);
    const q = M.spRemoveBox(p, sb1);
    assert.equal(box(q, 'SB2').feed, null);
    assert.deepEqual(M.spBrokenRefs(q), []);
  });

  it('a DIGITAL box is never a sub-snake: refused, and dropped if a sub-snake is made digital (it joins over the network)', () => {
    const { p, sb1, sb2 } = withSub();
    const d = M.spAddBox(p, { name: 'SB3', inputs: 8, kind: 'digital' });
    assert.equal(M.spSetBoxFeed(d.p, d.id, { boxId: sb1 }), d.p);
    assert.equal(box(M.spUpdateBox(p, sb2, { kind: 'digital' }), 'SB2').feed, null);
    assert.match(read('src/screens/lab/stageplot/inputs/BoxPanel.tsx'), /b\.kind !== 'digital' \? \(\n\s*<FocusMark k="feed">/);
  });

  it('AUTO-ASSIGN fills a sub-snake only up to what its cable carries; its free count says the same', () => {
    let { p, sb1, sb2 } = withSub();
    p = M.spUpdateBox(p, sb2, { inputs: 12 });
    p = M.spSetBoxFeed(p, sb2, { boxId: sb1, first: 9, last: 16 });
    const q = M.spAutoAssignBoxes(p).p;
    for (const i of q.inputs) if (i.box?.boxId === sb2) assert.ok(i.box.socket <= 8, `${i.label} on ${i.box.socket}`);
    assert.equal(rule(q, 'box-feed-short').length, 0);
    assert.equal(spBoxUse(p).find((u) => u.box.id === sb2)?.free, 8);
  });

  it('a sub-snake’s returns are not offered to a mix: its returns come from the main box', () => {
    let { p, sb2 } = withSub();
    p = M.spUpdateBox(p, sb2, { returns: 4 });
    assert.ok(!M.spReturnBoxes(p).some((b) => b.id === sb2));
  });

  it('a copy keeps the sub-snake on its own copy of the main box', () => {
    const { p } = withSub();
    const c = M.spDuplicateProject(p, { id: 'c', kind: 'master', now: NOW });
    assert.equal(box(c, 'SB2').feed?.boxId, box(c, 'SB1').id);
    assert.deepEqual(M.spBrokenRefs(c), []);
  });
});

/* ── a band's own digital box ───────────────────────────────────────────── */

describe('a band’s own digital box: which console?', () => {
  const bandBox = (f: Partial<SpProject['boxes'][number]> = {}) => M.spAddBox(four(), { name: 'SB1', kind: 'digital', supplier: 'band', ...f });

  it('asked once, as a question, for a digital box the band supplies; GO TO opens its "Connects to" field', () => {
    const { p, id } = bandBox();
    const q = rule(p, 'box-console');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'ask');
    assert.ok(q[0].text.startsWith('Which console does SB1 connect to? A digital stage box only works with a console that speaks its format.'), q[0].text);
    assert.equal(q[0].field, 'connectsTo');
    assert.deepEqual(spIssueSelection(q[0]), { kind: 'box', id });
  });

  it('not asked for a venue box or an analog box (a digital box is never a sub-snake, so it is always asked)', () => {
    assert.equal(rule(bandBox({ supplier: 'venue' }).p, 'box-console').length, 0);
    assert.equal(rule(bandBox({ kind: 'analog' }).p, 'box-console').length, 0);
    const { p, id } = bandBox();
    const main = M.spAddBox(p, { name: 'SB2', inputs: 32 });
    assert.equal(rule(M.spSetBoxFeed(main.p, id, { boxId: main.id }), 'box-console').length, 1);
  });

  it('a typed box note is its own sentence in the patch summary, never glued on after a semicolon (lead fix 2026-11-13)', () => {
    const { p, id } = bandBox();
    const noted = M.spUpdateBox(p, id, { note: 'by the drum riser' });
    const line = listItems(noted, 'inputs').find((x) => x.startsWith('SB1')) ?? '';
    assert.ok(/Supplied by the band[^.]*\. By the drum riser\.$/.test(line), line);
    assert.ok(!line.includes('; By') && !line.includes('; by the drum'), line);
    const ended = M.spUpdateBox(p, id, { note: 'Next to the riser!' });
    assert.ok((listItems(ended, 'inputs').find((x) => x.startsWith('SB1')) ?? '').endsWith('Next to the riser!'));
  });

  it('answered by "Connects to" (printed in the patch summary), or by "to be confirmed" (an open item)', () => {
    const { p, id } = bandBox();
    const named = M.spUpdateBox(p, id, { connectsTo: 'Yamaha CL5, Dante' });
    assert.equal(rule(named, 'box-console').length, 0);
    assert.ok(listItems(named, 'inputs').find((x) => x.startsWith('SB1'))?.includes('connects to Yamaha CL5, Dante'));
    const tbc = M.spUpdateBox(p, id, { connectsTbc: true });
    assert.equal(rule(tbc, 'box-console').length, 0);
    assert.ok(listItems(tbc, 'inputs').find((x) => x.startsWith('SB1'))?.includes('which console it connects to is to be confirmed'));
    const open = spOpenItems(tbc).find((x) => x.kind === 'box');
    assert.equal(open?.text, 'Stage box SB1: which console it connects to');
    assert.equal(open?.field, 'connectsTo');
    // naming the console answers "to be confirmed"
    assert.equal(box(M.spUpdateBox(tbc, id, { connectsTo: 'CL5' }), 'SB1').connectsTbc, false);
  });

  it('the field is short: at most 40 letters', () => {
    const { p, id } = bandBox();
    assert.equal(box(M.spUpdateBox(p, id, { connectsTo: 'x'.repeat(80) }), 'SB1').connectsTo.length, M.SP_CONNECTS_MAX);
    assert.equal(M.SP_CONNECTS_MAX, 40);
  });
});

/* ── the screens (source pins) ──────────────────────────────────────────── */

describe('round 2: the screens', () => {
  const box = read('src/screens/lab/stageplot/inputs/BoxPanel.tsx');
  const mixes = read('src/screens/lab/stageplot/monitors/MixSheets.tsx');
  const area = read('src/screens/lab/stageplot/MonitorsArea.tsx');
  const editor = read('src/screens/lab/stageplot/inputs/InputEditor.tsx');

  it('the box editor: "Where this box plugs in" (GO TO field feed), its sockets, and "Connects to" (field connectsTo)', () => {
    assert.match(box, /<FocusMark k="feed">/);
    assert.match(box, /<FocusMark k="connectsTo">/);
    assert.match(box, /spSetBoxFeed\(q, boxId/);
    assert.match(box, /spFeedTargets\(p, boxId\)/);
    assert.match(box, /Straight to the console/);
    assert.match(box, /Console not known yet \(to be confirmed\)/);
    assert.match(box, /GO TO MONITORS/);
  });

  it('the mix editor: "Where it comes back to the stage" (GO TO field ret), From the console, and the transmitter line', () => {
    assert.match(mixes, /<FocusMark k="ret">/);
    assert.match(mixes, /Stage box return \(where the mix comes back to the stage\)/);
    assert.match(mixes, /'From the console'/);
    assert.match(mixes, /spAssignReturn\(cur, id/);
    assert.match(mixes, /An in-ear mix goes to its transmitter/);
  });

  it('Monitors: RETURNS ON THE STAGE BOXES with AUTO-ASSIGN RETURNS (one edit), and the help says what a wedge and an IEM mix really need', () => {
    assert.match(area, /RETURNS ON THE STAGE BOXES/);
    assert.match(area, /label="AUTO-ASSIGN RETURNS"/);
    assert.match(area, /ed\.apply\(\(cur\) => spAutoAssignReturns\(cur\)\.p\)/);
    assert.match(SPM_RETURNS_HELP, /A wedge mix uses one return/);
    assert.match(SPM_IEM_RETURN_HELP, /An in-ear mix goes to its transmitter, not to the performer/);
    assert.match(SPM_IEM_RETURN_HELP, /transmitter rack at the side of the stage is fed from a stage box return/);
  });

  it('the input editor warns of a socket a sub-snake plugs into, and says where a sub-snake’s socket arrives', () => {
    assert.match(editor, /spSocketSub\(p, inputId\)/);
    assert.match(editor, /is a sub-snake: this socket arrives at/);
  });
});
