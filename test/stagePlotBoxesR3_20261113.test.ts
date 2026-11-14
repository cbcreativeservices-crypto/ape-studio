/**
 * Stage boxes, round 3 (owner 2026-11-13: "build the remaining held items
 * too", the items held in FEATURE_BOXES_R2 section 7):
 *
 *   SUB-SNAKE RETURNS  a sub-snake's returns come through a range of the main
 *             box's returns, as its inputs come through sockets: "SB2 ·
 *             return 1 (via SB1 · return 7)". Review: overlap, past the end,
 *             shorter than used (must correct); not connected (question).
 *             AUTO-ASSIGN RETURNS never gives those main returns to a mix.
 *   L / R     a stereo mix's cell reads "SB1 · returns 3 (L) – 4 (R)"; a
 *             stereo sidefill whose speakers stand by two boxes takes its L
 *             on one and its R on the other, by hand or by AUTO-ASSIGN.
 *   BAND RIG  a mix the band makes itself that still holds a return: a
 *             question with GO TO.
 *   RACK      with no transmitter drawn, an in-ear mix goes to the box by
 *             the rack nearest its performer, and the result says which.
 *   LABEL     "SB1 16/8" beside the symbol, on screen and on paper.
 *   WORDS     AUTO-ASSIGN SOCKETS / RETURNS named in full; SP_BOX_HELP
 *             shorter; the box note printed as "Note: …".
 *
 * Saved fields are optional only: schema 2, and every example prints as
 * before (no example has a box).
 *
 * Run: node --test --test-timeout=120000 test/stagePlotBoxesR3_20261113.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spBoxUse, spTextSummary } from '../src/features/stageplot/spDerive.ts';
import * as M from '../src/features/stageplot/spModel.ts';
import { spBuildDoc, spBuildSnapshot, spDocText, spPlotDoc } from '../src/features/stageplot/spPacket.ts';
import { spReview, type SpIssue } from '../src/features/stageplot/spReview.ts';
import { SP_TEMPLATES, spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpDocTable } from '../src/features/stageplot/spDocTypes.ts';
import { SP_SCHEMA, type SpProject } from '../src/features/stageplot/spTypes.ts';
import { spIssueSelection } from '../src/screens/lab/stageplot/spIssueActions.ts';
import { SPM_FEED_OPTIONS, spmAutoReturnSaid, spmBoxReturnLines, spmFreeReturn, spmSameReturn, spmVenueFeedLines } from '../src/screens/lab/stageplot/monitors/monitorPlan.ts';
import { stageListName, stageName } from '../src/screens/lab/stageplot/stage/stageLinks.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (f: string): string => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
/** The box help, read from its source (a .tsx file is not imported here). */
const SP_BOX_HELP = (/export const SP_BOX_HELP =\n\s*'([^']*)'/.exec(read('src/screens/lab/stageplot/inputs/BoxPanel.tsx')) ?? ['', ''])[1];
const NOW = Date.UTC(2026, 10, 13, 20, 0);
const four = (id = 'p-four'): SpProject => spFromTemplate('four-piece', { id, now: NOW, band: 'The Example Four' });
const rule = (p: SpProject, r: string): SpIssue[] => spReview(p).filter((i) => i.rule === r);
const mix = (p: SpProject, code: string) => p.mixes.find((m) => m.code === code) as SpProject['mixes'][number];
const box = (p: SpProject, name: string) => p.boxes.find((b) => b.name === name) as SpProject['boxes'][number];
const docOf = (p: SpProject, packet: 'full' | 'compact' = 'full') => spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet }, NOW));
const tables = (p: SpProject, section: string): SpDocTable[] => (docOf(p).sections.find((s) => s.id === section)?.blocks ?? []).flatMap((b) => (b.t === 'table' ? [b.table] : []));
const listItems = (p: SpProject, section: string): string[] => (docOf(p).sections.find((s) => s.id === section)?.blocks ?? []).flatMap((b) => (b.t === 'list' ? b.items : []));
const retCell = (p: SpProject, code: string): string => {
  const t = tables(p, 'monitors').find((x) => x.columns.some((c) => c.key === 'ret')) as SpDocTable;
  return String(t.rows.find((r) => String(r.cells.mix).startsWith(code))?.cells.ret ?? '');
};

/** The four-piece with SB1 (16/8) downstage and SB2 (8/2, a drum sub-snake
 *  into SB1 9–16) by the drums; M1–M4 on SB1 returns 1–6 by AUTO-ASSIGN. */
function withSubReturns(): { p: SpProject; sb1: string; sb2: string } {
  let p = four();
  const a = M.spAddBox(p, { name: 'SB1', inputs: 16, returns: 8, kind: 'analog', supplier: 'venue', at: { x: 0.5, y: 0.9 } });
  const b = M.spAddBox(a.p, { name: 'SB2', inputs: 8, returns: 2, kind: 'analog', supplier: 'venue', at: { x: 0.5, y: 0.08 } });
  p = M.spSetBoxFeed(b.p, b.id, { boxId: a.id, first: 9 });
  p = M.spAutoAssignReturns(p).p;
  return { p, sb1: a.id, sb2: b.id };
}

/* ── 1. a sub-snake's returns through its main box ──────────────────────── */

describe('round 3: a sub-snake’s returns come through returns of its main box', () => {
  it('not connected, its returns are not offered; connected, it takes the first run of the main box nothing uses', () => {
    let { p, sb1, sb2 } = withSubReturns();
    assert.ok(!M.spReturnBoxes(p).some((b) => b.id === sb2), 'not offered before it is connected');
    p = M.spSetBoxReturnFeed(p, sb2, {});
    assert.deepEqual(box(p, 'SB2').retFeed, { first: 7, last: 8 });
    assert.ok(M.spReturnBoxes(p).some((b) => b.id === sb2));
    assert.equal(M.spReturnFeedWords(p, box(p, 'SB2')), 'SB1 returns 7–8');
    assert.equal(M.spReturnFeedWords(p, box(p, 'SB1')), '');
    // a typed range
    p = M.spSetBoxReturnFeed(p, sb2, { first: 7, last: 7 });
    assert.deepEqual(box(p, 'SB2').retFeed, { first: 7, last: 7 });
    assert.equal(M.spReturnsUsable(box(p, 'SB2')), 1);
    // off again
    p = M.spSetBoxReturnFeed(p, sb2, null);
    assert.equal(box(p, 'SB2').retFeed, null);
    assert.ok(sb1);
  });

  it('"SB2 · return 1, via SB1 · return 7"; a stereo mix "SB2 · returns 1 (L) – 2 (R), via SB1 · returns 7–8" (round 3b form)', () => {
    let { p, sb2 } = withSubReturns();
    p = M.spSetBoxReturnFeed(p, sb2, {});
    p = M.spAssignReturn(p, mix(p, 'M1').id, { boxId: sb2, ret: 1 });
    assert.equal(M.spReturnWords(p, mix(p, 'M1')), 'SB2 · return 1, via SB1 · return 7');
    p = M.spAssignReturn(M.spAssignReturn(p, mix(p, 'M1').id, null), mix(p, 'M3').id, { boxId: sb2, ret: 1 });
    assert.equal(M.spReturnWords(p, mix(p, 'M3')), 'SB2 · returns 1 (L) – 2 (R), via SB1 · returns 7–8');
    // printed the same in the monitor plan's column
    assert.equal(retCell(p, 'M3'), 'SB2 · returns 1 (L) – 2 (R), via SB1 · returns 7–8');
    // not connected: said so, and the review asks
    p = M.spSetBoxReturnFeed(p, sb2, null);
    assert.match(M.spReturnWords(p, mix(p, 'M3')), /its returns are not connected to SB1 yet/);
    const q = rule(p, 'box-ret-feed-none');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'ask');
    assert.equal(q[0].field, 'retFeed');
    assert.deepEqual(spIssueSelection(q[0]), { kind: 'box', id: sb2 });
  });

  it('AUTO-ASSIGN RETURNS never gives the main box’s carrying returns to a mix, and uses the sub-snake for the mix nearest it', () => {
    let { p, sb1, sb2 } = withSubReturns();
    // M1–M4 keep SB1 1–6 (chosen by hand now, so the run below leaves them)
    for (const m of p.mixes) if (m.ret) p = M.spAssignReturn(p, m.id, { boxId: m.ret.boxId, ret: m.ret.ret });
    p = M.spSetBoxReturnFeed(p, sb2, { first: 7, last: 8 });
    // a drum fill by the drums, nearest SB2
    const fill = M.spAddMix(p, { name: 'Drum fill', format: 'mono', provider: 'house', delivery: 'drum-fill' });
    p = fill.p;
    const dev = M.spAddDevice(p, { type: 'drum-fill', label: 'Drum fill', mixId: fill.id });
    p = M.spAddObject(dev.p, 'drum-fill', { x: 0.42, y: 0.12 }, { deviceId: dev.id }).p;
    // a fifth wedge by the front, nearest SB1: SB1 7–8 are taken by SB2
    const wedge = M.spAddMix(p, { name: 'Guest', format: 'mono', provider: 'house', delivery: 'wedge' });
    p = wedge.p;
    const w = M.spAddDevice(p, { type: 'wedge', label: 'Wedge 5', mixId: wedge.id });
    p = M.spAddObject(w.p, 'wedge', { x: 0.7, y: 0.92 }, { deviceId: w.id }).p;
    const r = M.spAutoAssignReturns(p);
    const f = r.p.mixes.find((m) => m.id === fill.id);
    assert.deepEqual([f?.ret?.boxId, f?.ret?.ret], [sb2, 1]);
    for (const m of r.p.mixes) for (const s of M.spMixReturnSpots(m)) if (s.boxId === sb1) assert.ok(s.ret < 7, `${m.code} on SB1 ${s.ret}`);
    // SB1 has no free return left: the wedge goes to the next nearest box
    // with one, SB2's return 2, which arrives on SB1's return 8
    const g = r.p.mixes.find((m) => m.id === wedge.id) as SpProject['mixes'][number];
    assert.equal(M.spReturnWords(r.p, g), 'SB2 · return 2, via SB1 · return 8');
    assert.equal(r.left, 0);
    assert.equal(spmFreeReturn(r.p, sb1, 1), null, 'the editor’s pick skips them too');
  });

  it('review: overlap, past the end and shorter than used must be corrected, each with GO TO the sub-snake', () => {
    let { p, sb1, sb2 } = withSubReturns();
    p = M.spSetBoxReturnFeed(p, sb2, { first: 6, last: 7 });
    let q = rule(p, 'box-ret-feed-overlap');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'block');
    assert.match(q[0].text, /SB2’s returns come through SB1 returns 6–7, and SB1 · return 6 is also given to M4\. One return carries one thing: give M4 another return, or, in SB2’s editor, connect its returns to other returns of SB1\./);
    assert.deepEqual(spIssueSelection(q[0]), { kind: 'box', id: sb2 });
    assert.equal(q[0].field, 'retFeed');
    p = M.spSetBoxReturnFeed(p, sb2, { first: 8, last: 9 });
    assert.equal(rule(p, 'box-ret-feed-overlap').length, 0);
    q = rule(p, 'box-ret-feed-past');
    assert.equal(q.length, 1);
    assert.match(q[0].text, /SB1 has 8 returns\. In SB2’s editor, choose returns SB1 has, or correct the number of returns SB1 has\./);
    p = M.spSetBoxReturnFeed(p, sb2, { first: 7, last: 7 });
    p = M.spAssignReturn(p, mix(p, 'M1').id, { boxId: sb2, ret: 2 });
    q = rule(p, 'box-ret-feed-short');
    assert.equal(q.length, 1);
    assert.match(q[0].text, /which carry SB2 return 1 only, and M1 is on SB2 · return 2\. In SB2’s editor, use more returns of SB1, or give M1 another return\./);
    p = M.spSetBoxReturnFeed(p, sb2, { first: 7, last: 8 });
    assert.equal(rule(p, 'box-ret-feed-short').length, 0);
    // two sub-snakes on the same returns
    const c = M.spAddBox(p, { name: 'SB3', inputs: 4, returns: 1, kind: 'analog', at: { x: 0.9, y: 0.5 } });
    p = M.spSetBoxReturnFeed(M.spSetBoxFeed(c.p, c.id, { boxId: sb1, first: 13, last: 16 }), c.id, { first: 8, last: 8 });
    assert.ok(rule(p, 'box-ret-feed-overlap').some((i) => /also given to SB2/.test(i.text)));
    assert.ok(sb1);
  });

  it('the patch summary: "7–8 SB2 (sub-snake)" on the main box, "its returns come through SB1 returns 7–8" on the sub', () => {
    let { p, sb2 } = withSubReturns();
    p = M.spSetBoxReturnFeed(p, sb2, {});
    const items = listItems(p, 'inputs');
    const one = items.find((x) => x.startsWith('SB1')) ?? '';
    assert.ok(one.includes('returns 1 M1, 2 M2, 3–4 M3, 5–6 M4, 7–8 to SB2 returns 1–2 (sub-snake)'), one);
    assert.ok(!/free/.test(one.split('returns 1 M1')[1] ?? ''), 'no return of SB1 is free');
    const two = items.find((x) => x.startsWith('SB2')) ?? '';
    assert.ok(two.includes('its returns come through SB1 returns 7–8'), two);
    assert.match(spTextSummary(p), /7–8 to SB2 returns 1–2 \(sub-snake\)/);
    // the box editor's lines
    assert.ok(spmBoxReturnLines(p, box(p, 'SB1').id).includes('7–8 · to SB2 returns 1–2 (sub-snake)'));
    // the packet says what a sub-snake and "via" mean
    assert.match(spDocText(docOf(p)), /SB2 is a sub-snake: a small box whose cable plugs into SB1\. “SB2 · 1, via SB1 · 9” means socket 1 of SB2 arrives on SB1 socket 9; its returns work the same way \(SB2 · return 1 comes from SB1 · return 7\)\./);
    assert.equal(spmBoxReturnLines(p, sb2)[0], 'Its returns come through SB1 returns 7–8.');
  });

  it('plugging it straight into the console, or into another box, drops its return feed; a copy keeps it', () => {
    let { p, sb1, sb2 } = withSubReturns();
    p = M.spSetBoxReturnFeed(p, sb2, {});
    const c = M.spDuplicateProject(p, { id: 'c', kind: 'gig', now: NOW });
    assert.deepEqual(box(c, 'SB2').retFeed, { first: 7, last: 8 });
    assert.deepEqual(M.spBrokenRefs(c), []);
    assert.equal(box(M.spSetBoxFeed(p, sb2, null), 'SB2').retFeed, null);
    const other = M.spAddBox(p, { name: 'SB9', inputs: 24, returns: 4 });
    assert.equal(box(M.spSetBoxFeed(other.p, sb2, { boxId: other.id }), 'SB2').retFeed, null);
    assert.deepEqual(box(M.spSetBoxFeed(p, sb2, { boxId: sb1, first: 9 }), 'SB2').retFeed, { first: 7, last: 8 }, 'the same main box keeps it');
    // spUpdateBox never touches it
    assert.deepEqual(box(M.spUpdateBox(p, sb2, { note: 'by the drums' }), 'SB2').retFeed, { first: 7, last: 8 });
  });
});

/* ── 2. L / R, and a stereo sidefill at two boxes ───────────────────────── */

/** The four-piece with SB1 at stage right and SB2 at stage left (both 16/8,
 *  console boxes), and a stereo sidefill with a speaker at each side. */
function withSidefill(): { p: SpProject; sb1: string; sb2: string; sf: string } {
  let p = four();
  const a = M.spAddBox(p, { name: 'SB1', inputs: 16, returns: 8, kind: 'analog', supplier: 'venue', at: { x: 0.05, y: 0.5 } });
  const b = M.spAddBox(a.p, { name: 'SB2', inputs: 16, returns: 8, kind: 'analog', supplier: 'venue', at: { x: 0.95, y: 0.5 } });
  const m = M.spAddMix(b.p, { name: 'Sidefill', format: 'stereo', provider: 'house', delivery: 'sidefill' });
  p = m.p;
  const sr = M.spAddDevice(p, { type: 'sidefill', label: 'Sidefill SR', mixId: m.id });
  p = M.spAddObject(sr.p, 'sidefill', { x: 0.02, y: 0.4 }, { deviceId: sr.id }).p;
  const sl = M.spAddDevice(p, { type: 'sidefill', label: 'Sidefill SL', mixId: m.id });
  p = M.spAddObject(sl.p, 'sidefill', { x: 0.98, y: 0.4 }, { deviceId: sl.id }).p;
  return { p, sb1: a.id, sb2: b.id, sf: m.id };
}

describe('round 3: L and R on the return cells, and a stereo sidefill placed at two boxes', () => {
  it('a stereo mix on one box reads "SB1 · returns 3 (L) – 4 (R)", on screen and in print', () => {
    let p = M.spAddBox(four(), { name: 'SB1', inputs: 16, returns: 8, at: { x: 0.5, y: 0.9 } }).p;
    p = M.spAssignReturn(p, mix(p, 'M3').id, { boxId: p.boxes[0].id, ret: 3 });
    assert.equal(M.spReturnWords(p, mix(p, 'M3')), 'SB1 · returns 3 (L) – 4 (R)');
    assert.equal(M.spReturnWordsOn(p, mix(p, 'M3')), 'returns 3 (L) – 4 (R)');
    assert.equal(retCell(p, 'M3'), 'SB1 · returns 3 (L) – 4 (R)');
    assert.deepEqual(M.spMixReturnSpots(mix(p, 'M3')), [
      { boxId: p.boxes[0].id, ret: 3, side: 'L' },
      { boxId: p.boxes[0].id, ret: 4, side: 'R' },
    ]);
  });

  it('by hand: its R on another box, "SB2 · return 1 (R)"; the box lines, the patch summary and a shared return say so', () => {
    let { p, sb1, sb2, sf } = withSidefill();
    p = M.spAssignReturn(p, sf, { boxId: sb2, ret: 1 });
    p = M.spAssignReturnR(p, sf, { boxId: sb1, ret: 1 });
    const m = p.mixes.find((x) => x.id === sf) as SpProject['mixes'][number];
    assert.ok(M.spMixSplit(m));
    assert.equal(M.spReturnWords(p, m), 'SB2 · return 1 (L, stage left); SB1 · return 1 (R, stage right)');
    assert.deepEqual(M.spReturnRange(m), [1], 'its L box holds one return');
    assert.ok(spBoxUse(p).find((u) => u.box.id === sb1)?.returnsUsed.some((x) => x.mix.id === sf && x.side === 'R'));
    const items = listItems(p, 'inputs');
    assert.ok(items.find((x) => x.startsWith('SB1'))?.includes(`1 ${m.code} (R, stage right; L on SB2)`), items.join('\n'));
    assert.ok(items.find((x) => x.startsWith('SB2'))?.includes(`1 ${m.code} (L, stage left; R on SB1)`));
    assert.ok(spmBoxReturnLines(p, sb1).some((l) => l.includes('(stereo R, stage right; L on SB2 · return 1)')));
    // a mix on SB1 return 1 shares it with the R
    p = M.spAssignReturn(p, mix(p, 'M1').id, { boxId: sb1, ret: 1 });
    assert.deepEqual(spmSameReturn(p, sf).map((x) => x.code), ['M1']);
    assert.ok(rule(p, 'return-twice').some((i) => /SB1 return 1 is given to/.test(i.text)));
    // back on the next return of its L; mono drops it
    let q = M.spAssignReturnR(p, sf, null);
    assert.equal(M.spReturnWords(q, q.mixes.find((x) => x.id === sf) as SpProject['mixes'][number]), 'SB2 · returns 1 (L) – 2 (R)');
    q = M.spUpdateMix(p, sf, { format: 'mono' });
    assert.ok(!q.mixes.find((x) => x.id === sf)?.retR);
    // a return past the box's count on the R box
    q = M.spAssignReturnR(p, sf, { boxId: sb1, ret: 9 });
    assert.match(rule(q, 'return-over')[0]?.text ?? '', /SB1 has 8 returns, and Sidefill|is on return 9/);
  });

  it('AUTO-ASSIGN RETURNS: L on the box by the stage-left speaker, R on the box by the stage-right one, and says so', () => {
    const { p, sb1, sb2, sf } = withSidefill();
    const r = M.spAutoAssignReturns(p);
    const m = r.p.mixes.find((x) => x.id === sf) as SpProject['mixes'][number];
    assert.equal(m.ret?.boxId, sb2, 'L = stage left = SB2');
    assert.equal(m.retR?.boxId, sb1, 'R = stage right = SB1');
    assert.equal(m.ret?.byHand, false);
    assert.deepEqual(r.split, [m.code]);
    assert.match(spmAutoReturnSaid(r), /a stereo sidefill\) has its L return on the box nearest its stage-left speaker and its R return on the box nearest its stage-right speaker\. L and R are named as the performers see the stage\./);
    // UNDO-able in one edit, and a second run gives the same
    const again = M.spAutoAssignReturns(r.p);
    assert.deepEqual(again.p.mixes.find((x) => x.id === sf)?.retR, m.retR);
  });

  it('both speakers nearest one box: one pair on that box, as before', () => {
    let { p, sf } = withSidefill();
    p = M.spRemoveBox(p, p.boxes[1].id);
    const r = M.spAutoAssignReturns(p);
    const m = r.p.mixes.find((x) => x.id === sf);
    assert.ok(!m?.retR);
    assert.equal(r.split.length, 0);
    assert.equal(M.spReturnRange(m as SpProject['mixes'][number]).length, 2);
  });
});

describe('round 3: engineer review', () => {
  it('an in-ear or headphone mix goes to one place: no R choice offered, and a split must be corrected', () => {
    let p = M.spAddBox(four(), { name: 'SB1', inputs: 16, returns: 8, at: { x: 0.1, y: 0.5 } }).p;
    const b2 = M.spAddBox(p, { name: 'SB2', inputs: 16, returns: 8, at: { x: 0.9, y: 0.5 } });
    p = b2.p;
    const m3 = mix(p, 'M3').id;
    assert.equal(M.spMixMaySplit(mix(p, 'M3')), false);
    p = M.spAssignReturnR(M.spAssignReturn(p, m3, { boxId: p.boxes[0].id, ret: 1 }), m3, { boxId: b2.id, ret: 1 });
    const q = rule(p, 'return-split-one-place');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'block');
    assert.match(q[0].text, /an in-ear transmitter takes L and R together\. Put both on one box: choose “Right after L” for its R\./);
    assert.deepEqual(spIssueSelection(q[0]), { kind: 'mix', id: m3 });
    assert.equal(rule(M.spAssignReturnR(p, m3, null), 'return-split-one-place').length, 0);
  });

  it('a chain: a sub-snake below a sub-snake is checked against what its main feed carries, and AUTO-ASSIGN skips returns that go nowhere', () => {
    let { p, sb2 } = withSubReturns();
    for (const m of p.mixes) if (m.ret) p = M.spAssignReturn(p, m.id, { boxId: m.ret.boxId, ret: m.ret.ret });
    p = M.spUpdateBox(p, sb2, { returns: 4 });
    p = M.spSetBoxReturnFeed(p, sb2, { first: 7, last: 8 }); // SB2 1–2 reach SB1; 3–4 do not
    const c = M.spAddBox(p, { name: 'SB3', inputs: 4, returns: 2, kind: 'analog', at: { x: 0.6, y: 0.1 } });
    p = M.spSetBoxReturnFeed(M.spSetBoxFeed(c.p, c.id, { boxId: sb2, first: 5, last: 8 }), c.id, { first: 3, last: 4 });
    assert.ok(rule(p, 'box-ret-feed-short').some((i) => /SB3/.test(i.text) && i.target.id === sb2), 'SB2 does not carry the returns SB3 uses');
    assert.match(M.spReturnWords({ boxes: p.boxes }, { ret: { boxId: c.id, ret: 1, byHand: true }, format: 'mono', fromConsole: false }), /\(not carried: SB2’s returns reach SB1 on returns 7–8 only\)/);
    assert.equal(spmFreeReturn(p, c.id, 1), null, 'SB3’s returns go nowhere');
    // what SB2 shows: returns past its feed are not free
    const lines = spmBoxReturnLines(p, sb2);
    assert.ok(lines.includes('Not carried to SB1: 3–4') || lines.some((l) => l.startsWith('3–4 · to SB3')), lines.join(' | '));
  });

  it('a return feed is never longer than the sub-snake has returns', () => {
    let { p, sb2 } = withSubReturns();
    p = M.spSetBoxReturnFeed(p, sb2, { first: 5, last: 10 });
    assert.deepEqual(box(p, 'SB2').retFeed, { first: 5, last: 6 }, 'SB2 has 2 returns');
  });

  it('a stereo mix with two sidefills is not asked how its two devices are fed (one output each side)', () => {
    let { p, sb1, sb2, sf } = withSidefill();
    p = M.spAssignReturnR(M.spAssignReturn(p, sf, { boxId: sb2, ret: 1 }), sf, { boxId: sb1, ret: 1 });
    const code = (p.mixes.find((m) => m.id === sf) as SpProject['mixes'][number]).code;
    assert.ok(!spReview(p).some((i) => i.level === 'open' && i.text.startsWith(code) && /how its 2 sidefills are fed/.test(i.text)));
    assert.ok(!spDocText(docOf(p)).includes('how its 2 sidefills are fed'));
  });
});

/* ── 3. a band-rig mix that still holds a return ────────────────────────── */

describe('round 3: a mix the band makes itself that still holds a return', () => {
  it('a question, with GO TO the mix’s return; not asked when the band requests return lines from the house', () => {
    let p = M.spAddBox(four(), { name: 'SB1', inputs: 16, returns: 8, at: { x: 0.5, y: 0.9 } }).p;
    p = M.spAutoAssignReturns(p).p;
    const id = mix(p, 'M2').id;
    p = M.spUpdateMix(p, id, { provider: 'band-console', venueFeed: 'feeds' });
    const q = rule(p, 'return-band-rig');
    assert.equal(q.length, 1);
    assert.equal(q[0].level, 'ask');
    assert.equal(q[0].field, 'ret');
    assert.equal(q[0].area, 'monitors');
    assert.match(q[0].text, /M2 is made on your band’s own monitor console, but it still has SB1 · return 2\. Does it still need that return\? If the venue’s return lines carry it to the stage, turn on “It still uses this return” in the mix\. If not, choose No return yet\./);
    // answered by the switch; until then the packet cell says it is open
    assert.equal(retCell(p, 'M2'), 'SB1 · return 2 (to be confirmed)');
    const kept = M.spSetReturnKeep(p, id, true);
    assert.equal(rule(kept, 'return-band-rig').length, 0);
    assert.equal(retCell(kept, 'M2'), 'SB1 · return 2');
    assert.ok(!('retKeep' in (M.spSetReturnKeep(kept, id, false).mixes.find((m) => m.id === id) as object)));
    assert.deepEqual(spIssueSelection(q[0]), { kind: 'mix', id });
    assert.equal(rule(M.spUpdateMix(p, id, { venueFeed: 'returns' }), 'return-band-rig').length, 0);
    assert.equal(rule(M.spAssignReturn(p, id, null), 'return-band-rig').length, 0);
    // AUTO-ASSIGN RETURNS takes off a return it chose itself (the mix wants
    // none now); one chosen by hand stays, and the question stays with it
    assert.equal(M.spAutoAssignReturns(p).p.mixes.find((m) => m.id === id)?.ret, null);
    const hand = M.spAssignReturn(p, id, { boxId: p.boxes[0].id, ret: 2 });
    assert.equal(M.spAutoAssignReturns(hand).p.mixes.find((m) => m.id === id)?.ret?.ret, 2);
    assert.equal(rule(M.spAutoAssignReturns(hand).p, 'return-band-rig').length, 1);
  });
});

/* ── 4. the transmitter fallback ────────────────────────────────────────── */

describe('round 3: no transmitter drawn: the box by the rack nearest the performer', () => {
  it('uses the rack nearest the performer, not the first rack, and says which', () => {
    let p = four();
    // M3 (wireless in-ear) is Maya's; her transmitter is not drawn
    const tx = p.objects.find((o) => o.deviceId && p.devices.find((d) => d.id === o.deviceId)?.type === 'iem-tx');
    if (tx) p = M.spRemoveObjects(p, [tx.id]);
    assert.ok(!p.objects.some((o) => o.deviceId && p.devices.find((d) => d.id === o.deviceId)?.type === 'iem-tx'), 'no transmitter drawn');
    p = M.spAddObject(p, 'rack', { x: 0.95, y: 0.9 }, { label: 'Rack A' }).p; // the first rack: far from Maya
    p = M.spAddObject(p, 'rack', { x: 0.55, y: 0.05 }, { label: 'Rack B' }).p; // by Maya (0.50, 0.15)
    p = M.spAddBox(p, { name: 'SB1', inputs: 16, returns: 8, at: { x: 0.9, y: 0.9 } }).p;
    p = M.spAddBox(p, { name: 'SB2', inputs: 8, returns: 4, at: { x: 0.6, y: 0.05 } }).p;
    const r = M.spAutoAssignReturns(p);
    assert.equal(r.p.mixes.find((m) => m.code === 'M3')?.ret?.boxId, box(p, 'SB2').id);
    assert.deepEqual(r.viaRack.map((v) => [v.code, v.box, v.why, v.rack]), [['M3', 'SB2', 'performer', 'Rack B']]);
    assert.match(spmAutoReturnSaid(r), /M3: its transmitter is not on the plot, so AUTO-ASSIGN RETURNS used Rack B at [a-z ]+ \(the rack nearest its performer\) and gave M3 a return on SB2, the box nearest that rack\./);
    // a rack named for in-ears comes first (engineer review)
    const rackA = p.objects.find((o) => o.label === 'Rack A') as SpProject['objects'][number];
    const named = M.spAutoAssignReturns(M.spUpdateObject(p, rackA.id, { label: 'IEM rack' }));
    assert.deepEqual(named.viaRack.map((v) => [v.rack, v.why, v.box]), [['IEM rack', 'named', 'SB1']]);
  });
});

/* ── 5. the box size on the label ───────────────────────────────────────── */

describe('round 3: "SB1 16/8" beside the symbol', () => {
  it('the stage drawing and the printed plot say the size; returns not given: "SB2 8"; short enough for a phone', () => {
    let r = M.spAddBox(four(), { name: 'SB1', inputs: 16, returns: 8 });
    r = M.spAddBox(r.p, { name: 'SB2', inputs: 8 });
    const p = r.p;
    const o1 = M.spBoxObject(p, box(p, 'SB1').id) as SpProject['objects'][number];
    const o2 = M.spBoxObject(p, box(p, 'SB2').id) as SpProject['objects'][number];
    assert.equal(stageName(p, o1), 'SB1 16/8');
    assert.equal(stageListName(p, o2), 'SB2 8 in', '"SB2 8" would read like socket 8');
    assert.equal(M.spBoxPlotLabel({ name: '', inputs: 24, returns: 0 }), 'Stage box 24/0');
    const plot = spPlotDoc(p);
    assert.ok(plot.items.some((i) => i.label === 'SB1 16/8'));
    assert.ok(plot.items.some((i) => i.label === 'SB2 8 in'));
    assert.ok(plot.legend.includes('A stage box is named with its size: SB1 16/8 has 16 inputs and 8 returns.'), plot.legend.join(' | '));
    assert.ok(!spPlotDoc(four()).legend.some((l) => /stage box is named/.test(l)));
    assert.ok(stageName(p, o1).length <= 9, 'as short as a name');
    assert.match(spDocText(docOf(p)), /- SB1 16\/8: /);
  });
});

/* ── 6–7. words ─────────────────────────────────────────────────────────── */

describe('round 3: words', () => {
  it('the round-1 texts name AUTO-ASSIGN SOCKETS and AUTO-ASSIGN RETURNS in full', () => {
    for (const f of ['src/screens/lab/stageplot/inputs/BoxPanel.tsx', 'src/screens/lab/stageplot/inputs/InputEditor.tsx', 'src/screens/lab/stageplot/monitors/monitorPlan.ts', 'src/screens/lab/stageplot/MonitorsArea.tsx']) {
      const code = read(f)
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .join('\n');
      const bare = code.match(/AUTO-ASSIGN(?! SOCKETS| RETURNS)/g) ?? [];
      assert.deepEqual(bare, [], f);
    }
  });

  it('SP_BOX_HELP is short and still says what a student needs', () => {
    // (round 2's help was 156 words)
    const words = SP_BOX_HELP.split(/\s+/).length;
    assert.ok(words > 50 && words <= 125, `${words} words`);
    for (const k of [/digital box/, /same network type/, /splitter/, /PA amplifiers/, /analog box/, /snake/, /returns/, /16\/8/, /16 inputs and 8 returns/, /sub-snake/]) assert.match(SP_BOX_HELP, k);
  });

  it('the box note prints as "Note: …" in the patch summary', () => {
    const r = M.spAddBox(four(), { name: 'SB1', supplier: 'band', note: 'by the drum riser' });
    const line = listItems(r.p, 'inputs').find((x) => x.startsWith('SB1')) ?? '';
    assert.ok(line.endsWith('Supplied by the band. Note: By the drum riser.'), line);
  });
});

/* ── saved fields ───────────────────────────────────────────────────────── */

describe('round 3: saved fields are optional; schema 2; the examples are unchanged', () => {
  it('still schema 2; the examples have no box, no L/R and no new key', () => {
    assert.equal(SP_SCHEMA, 2);
    for (const t of SP_TEMPLATES) {
      const p = spFromTemplate(t.id, { id: `x-${t.id}`, now: NOW, band: 'Example' });
      assert.equal(p.boxes.length, 0, t.id);
      assert.ok(p.mixes.every((m) => !('retR' in m)), t.id);
      const back = M.spMigrate(JSON.parse(JSON.stringify(p)));
      assert.ok(back?.mixes.every((m) => !('retR' in m)));
      assert.ok(!/\(L\)|\(R\)|sub-snake|Note: /.test(spDocText(docOf(p))), t.id);
      assert.equal(rule(p, 'return-band-rig').length, 0);
    }
  });

  it('spMigrate keeps a real return feed and R return, and drops junk (schema 1 and 2)', () => {
    let { p, sb1, sb2, sf } = withSidefill();
    p = M.spAssignReturnR(M.spAssignReturn(p, sf, { boxId: sb2, ret: 1 }), sf, { boxId: sb1, ret: 2 });
    const sub = withSubReturns();
    const s = M.spSetBoxReturnFeed(sub.p, sub.sb2, {});
    const raw = JSON.parse(JSON.stringify(p));
    const back = M.spMigrate(raw) as SpProject;
    assert.deepEqual(back.mixes.find((m) => m.id === sf)?.retR, { boxId: sb1, ret: 2, byHand: true });
    const rawS = JSON.parse(JSON.stringify(s));
    assert.deepEqual((M.spMigrate(rawS) as SpProject).boxes.find((b) => b.name === 'SB2')?.retFeed, { first: 7, last: 8 });
    // junk
    rawS.boxes.find((b: { name: string }) => b.name === 'SB2').retFeed = { first: 'x' };
    raw.mixes.find((m: { id: string }) => m.id === sf).retR = 'right';
    assert.ok(!('retFeed' in ((M.spMigrate(rawS) as SpProject).boxes.find((b) => b.name === 'SB2') as object)));
    assert.ok(!('retR' in ((M.spMigrate(raw) as SpProject).mixes.find((m) => m.id === sf) as object)));
    // an R pointing at a box that is gone, and a return feed on a box that is not a sub-snake, are dropped
    raw.mixes.find((m: { id: string }) => m.id === sf).retR = { boxId: 'gone', ret: 1, byHand: true };
    assert.ok(!(M.spMigrate(raw) as SpProject).mixes.find((m) => m.id === sf)?.retR);
    rawS.boxes.find((b: { name: string }) => b.name === 'SB1').retFeed = { first: 1, last: 2 };
    assert.ok(!(M.spMigrate(rawS) as SpProject).boxes.find((b) => b.name === 'SB1')?.retFeed);
    // schema 1
    const one = { ...JSON.parse(JSON.stringify(four('p-one'))), schema: 1 };
    delete one.boxes;
    assert.ok(M.spMigrate(one));
  });
});

/* ── screens ────────────────────────────────────────────────────────────── */

describe('round 3: screens', () => {
  it('the mix editor offers the R return; the box editor connects a sub-snake’s returns', () => {
    const sheets = read('src/screens/lab/stageplot/monitors/MixSheets.tsx');
    assert.match(sheets, /label="R \(right\) side of this mix"/);
    assert.match(sheets, /stereo && \(spMixMaySplit\(mix\) \|\| mix\.retR\)/);
    assert.match(sheets, /<Switch label="It still uses this return"/);
    assert.match(sheets, /spAssignReturnR\(cur, id, \{ boxId: v, ret: s \}\)/);
    assert.match(sheets, /`L \(left\) return on \$\{spBoxName\(retBox\)\}`/);
    const panel = read('src/screens/lab/stageplot/inputs/BoxPanel.tsx');
    assert.match(panel, /<FocusMark k="retFeed">/);
    assert.match(panel, /label: `Returns of \$\{spBoxName\(main\)\}`/);
    assert.match(panel, /<SubTitle>Where its returns come from<\/SubTitle>/);
    assert.match(panel, /spSetBoxReturnFeed\(q, boxId, v \? \{\} : null\)/);
    assert.match(panel, /u\.retFeedClash\.length \|\| u\.retFeedPast\.length \|\| u\.retFeedShort\.length/);
  });
});

/* ── round 3b (owner 2026-11-13: build the remaining held items) ────────── */

describe('round 3b: "An input split and return lines", the via form, the socket line', () => {
  it('a band-rig mix can ask for an input split AND return lines; then it is not asked about its return', () => {
    let p = M.spAddBox(four(), { name: 'SB1', inputs: 16, returns: 8, at: { x: 0.5, y: 0.9 } }).p;
    p = M.spAutoAssignReturns(p).p;
    const id = mix(p, 'M2').id;
    p = M.spAssignReturn(p, id, { boxId: p.boxes[0].id, ret: 2 });
    p = M.spUpdateMix(p, id, { provider: 'band-console', venueFeed: 'split' });
    assert.equal(rule(p, 'return-band-rig').length, 1);
    const both = M.spUpdateMix(p, id, { venueFeed: 'split-returns' });
    assert.equal(rule(both, 'return-band-rig').length, 0);
    assert.equal(retCell(both, 'M2'), 'SB1 · return 2');
    assert.ok(spmVenueFeedLines(both).includes('For M2, requested from the venue: an input split and return lines to the stage.'));
    assert.ok(SPM_FEED_OPTIONS.some((o) => o.value === 'split-returns' && o.label === 'An input split and return lines to the stage'));
    assert.match(spDocText(docOf(both)), /Requested from the venue: an input split and return lines to the stage/);
  });

  it('saved values: old ones are kept, the new one is kept, junk is "to be confirmed"; examples unchanged', () => {
    const p = spFromTemplate('playback', { id: 'pb', now: NOW, band: 'Example' });
    const raw = JSON.parse(JSON.stringify(p));
    raw.mixes[0].venueFeed = 'split-returns';
    raw.mixes[1].venueFeed = 'returns';
    raw.mixes[2].venueFeed = 'a fax machine';
    const back = M.spMigrate(raw) as SpProject;
    assert.deepEqual(back.mixes.slice(0, 3).map((m) => m.venueFeed), ['split-returns', 'returns', 'tbc']);
    // an example saved and read back keeps every answer it had
    assert.deepEqual((M.spMigrate(JSON.parse(JSON.stringify(p))) as SpProject).mixes.map((m) => m.venueFeed), p.mixes.map((m) => m.venueFeed));
  });

  it('the socket line of a main box says which sockets of the sub-snake arrive there', () => {
    let { p, sb2 } = withSubReturns();
    p = M.spSetBoxReturnFeed(p, sb2, {});
    const one = listItems(p, 'inputs').find((x) => x.startsWith('SB1')) ?? '';
    assert.ok(one.includes('sockets 9–16 from SB2 sockets 1–8 (sub-snake)'), one);
    assert.ok(read('src/screens/lab/stageplot/inputs/BoxPanel.tsx').includes('` · sockets ${f.first}–${f.last} from ${spBoxName(f.box)}`'));
  });
});
