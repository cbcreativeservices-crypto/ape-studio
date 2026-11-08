/**
 * Bug pass 2, group "queue" (2026-11-08): the owner's forum queue
 * (src/screens/admin/ForumQueueView.tsx).
 *
 *  CODE-2-14  the QUEUE tab showed at most 100 items with nothing saying so,
 *             and a cleared full batch read "Nothing is waiting for you."
 *  UI-2-15    DISMISS / CONFIRM acted on one tap, even on threat, self-harm and
 *             child-safety items, and no line said what had happened
 *
 * The faces module is imported as a namespace so a helper that did not exist yet
 * fails its own test instead of the whole file.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const QUEUE = 'src/screens/admin/ForumQueueView.tsx';
const API = 'src/features/forum/adminApi.ts';
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const between = (src: string, from: string, to: string) => src.slice(src.indexOf(from), src.indexOf(to, src.indexOf(from)));

type Ask = { title: string; body: string; yes: string; destructive: boolean } | null;
type Faces = {
  QUEUE_LIMIT: number;
  queueCapNote: (full: boolean, shown: number, limit?: number) => string | null;
  queueDecisionAsk: (d: string, item: { urgentCategory: string | null; child: boolean; hasMember: boolean; name?: string | null }) => Ask;
  queueResultLine: (d: string, name: string | null | undefined, days?: number) => string;
  createDecisionGuard: () => Guard;
  askThenDecide: <Q>(g: Guard, id: number, ask: Q | null, confirm: (q: Q, yes: () => void) => void, start: () => void) => void;
  visibleQueueItems: <T extends { logId: number }>(items: readonly T[], g: Guard) => T[];
};
type Guard = {
  claim(id: number): boolean;
  release(id: number): void;
  land(id: number): void;
  held(id: number): boolean;
  landed(id: number): boolean;
};
const faces = async (): Promise<Faces> => (await import('../src/screens/admin/forumQueueFaces.ts')) as unknown as Faces;

describe('CODE-2-14: the queue says when it may not be complete', () => {
  it('QUEUE_LIMIT matches fetchQueue\'s p_limit', async () => {
    const { QUEUE_LIMIT } = await faces();
    const m = between(read(API), 'export async function fetchQueue', '\n}').match(/p_limit:\s*(\d+)/);
    assert.ok(m, 'fetchQueue sends p_limit');
    assert.equal(QUEUE_LIMIT, Number(m![1]));
  });

  it('a full read says so; a short read says nothing', async () => {
    const { queueCapNote } = await faces();
    assert.equal(queueCapNote(false, 40), null);
    assert.equal(queueCapNote(false, 0), null);
    const note = queueCapNote(true, 100);
    assert.ok(note && /at most 100/.test(note) && /may be waiting/.test(note), String(note));
    const cleared = queueCapNote(true, 0);
    assert.ok(cleared && /cleared/.test(cleared) && /may be waiting/.test(cleared), String(cleared));
    for (const n of [note!, cleared!]) {
      assert.doesNotMatch(n, /—/, 'no em dash');
      assert.doesNotMatch(n, /\d+ of \d+/, 'no "N of total"');
    }
  });

  it('the screen keeps "full" with the list, and a cleared full batch is never "Nothing is waiting"', () => {
    const src = code(QUEUE);
    const list = between(src, 'function QueueList()', '/* ── Appeals');
    assert.match(src, /full:\s*r\.value\.length\s*>=\s*QUEUE_LIMIT/);
    assert.match(list, /useForumRead<QueueRead>\(fetchQueueRead/);
    // `done` keeps `full` when it removes a row.
    assert.match(list, /read\.patch\(\(q\) => \(\{ \.\.\.q, items: q\.items\.filter/);
    const empty = between(list, 'if (items.length === 0)', 'return (\n    <>\n      {read.stale');
    assert.match(empty, /capLine \?\? <Text style=\{st\.muted\}>Nothing is waiting for you\.<\/Text>/);
    assert.match(list, /queueCapNote\(read\.value\.full, items\.length\)/);
    assert.match(list, /onPress=\{readAgain\}/);
    assert.match(list, /useLatchedPress\(\(\) => read\.reload\(\)\)/);
  });
});

describe('UI-2-15: urgent decisions ask first, and every decision says what it did', () => {
  it('threat, self-harm and child safety ask before DISMISS, CONFIRM and RESTORE', async () => {
    const { queueDecisionAsk } = await faces();
    for (const urgentCategory of ['threat', 'self_harm', 'child_safety']) {
      for (const d of ['dismiss', 'confirm', 'restore']) {
        const ask = queueDecisionAsk(d, { urgentCategory, child: urgentCategory === 'child_safety', hasMember: true });
        assert.ok(ask, `${urgentCategory} ${d} asks`);
        assert.equal(ask!.yes, d.toUpperCase());
        assert.doesNotMatch(ask!.title + ask!.body, /—/, 'no em dash');
      }
    }
    // An older child-safety row with no urgent category of its own still asks.
    assert.ok(queueDecisionAsk('dismiss', { urgentCategory: null, child: true, hasMember: false }));
    assert.equal(queueDecisionAsk('dismiss', { urgentCategory: 'threat', child: false, hasMember: false })!.destructive, true);
  });

  it('CONFIRM on a "Suggested: ban" item says the ban is a separate step; child safety reminds about the report', async () => {
    const { queueDecisionAsk } = await faces();
    const child = queueDecisionAsk('confirm', { urgentCategory: 'child_safety', child: true, hasMember: true })!;
    assert.match(child.body, /separate step, under MEMBER/);
    assert.match(child.body, /law requires a report/);
    const threat = queueDecisionAsk('confirm', { urgentCategory: 'threat', child: false, hasMember: false })!;
    assert.doesNotMatch(threat.body, /MEMBER|law/);
  });

  it('ordinary items and HIDE keep the one tap; DELETE already asks on its own', async () => {
    const { queueDecisionAsk } = await faces();
    assert.equal(queueDecisionAsk('dismiss', { urgentCategory: null, child: false, hasMember: true }), null);
    assert.equal(queueDecisionAsk('confirm', { urgentCategory: 'spam', child: false, hasMember: true }), null);
    assert.equal(queueDecisionAsk('hide', { urgentCategory: 'threat', child: false, hasMember: true }), null);
    assert.equal(queueDecisionAsk('delete', { urgentCategory: 'threat', child: false, hasMember: true }), null);
  });

  it('the result line names what happened and to whose item', async () => {
    const { queueResultLine } = await faces();
    assert.equal(queueResultLine('dismiss', 'Sam'), 'Dismissed. The item from Sam has left the queue.');
    assert.equal(queueResultLine('confirm', null), 'Confirmed. The item has left the queue.');
    assert.equal(queueResultLine('suspended', 'Sam', 7), 'Suspended for 7 days. The item from Sam has left the queue.');
    assert.equal(queueResultLine('banned', ' '), 'Banned. The item has left the queue.');
    assert.match(queueResultLine('please_edit', 'Sam'), /^Asked the member to edit it\./);
  });

  it('the screen asks through confirmDialog and sets the line only from a write that answered ok', () => {
    const src = code(QUEUE);
    assert.doesNotMatch(src, /Alert\.alert/);
    const list = between(src, 'function QueueList()', '/* ── Appeals');
    const decide = between(list, 'const decide = useCallback', 'const onPost');
    assert.match(decide, /queueDecisionAsk\(decision/);
    assert.match(decide, /askThenDecide\(\s*guard,\s*item\.logId,\s*ask,\s*\(q, yes\) => confirmDialog\(q\.title, q\.body, q\.yes, yes,/);
    assert.match(decide, /\(\) => decideNow\(item, decision, note\)/);
    const now = between(list, 'const decideNow = useCallback', 'const decide = useCallback');
    assert.match(now, /if \(r\.ok\) \{\s*done\(item\.logId\);\s*setResult\(queueResultLine\(decision/);
    // Every queue write that clears an item sets the line on success only.
    assert.equal((list.match(/setResult\(queueResultLine\(/g) ?? []).length, 3);
    assert.equal((list.match(/if \(d\.ok\) \{\s*done\(item\.logId\);\s*setResult/g) ?? []).length, 2);
    // DISMISS and CONFIRM go through the asking path.
    assert.match(list, /label="DISMISS" onPress=\{\(\) => decide\(item, 'dismiss'\)\}/);
    assert.match(list, /label="CONFIRM" onPress=\{\(\) => decide\(item, 'confirm'\)\}/);
    // The line is shown both above the list and on the emptied face.
    assert.equal((list.match(/\{resultLine\}/g) ?? []).length, 2);
  });
});

describe('check follow-ups (CHECK_P2_queue.md)', () => {
  it('R-1: the emptied face shows the stale note when READ AGAIN fails', () => {
    const list = between(code(QUEUE), 'function QueueList()', '/* ── Appeals');
    const empty = between(list, 'if (items.length === 0)', 'return (\n    <>\n      {read.stale');
    assert.match(empty, /\{read\.stale \? <StaleNote \/> : null\}/);
  });

  it('W-1: the screen passes child: isChildItem(item), so an older child-safety row still asks', () => {
    const list = between(code(QUEUE), 'function QueueList()', '/* ── Appeals');
    const decide = between(list, 'const decide = useCallback', 'const onPost');
    assert.match(decide, /queueDecisionAsk\(decision, \{[^}]*child: isChildItem\(item\)/);
  });

  it('O-1: one decision per item; a cancel or a failed write frees it, a landed write keeps it', async () => {
    const { createDecisionGuard } = await faces();
    const g = createDecisionGuard();
    assert.equal(g.claim(7), true, 'DISMISS claims');
    assert.equal(g.claim(7), false, 'CONFIRM in the same frame is refused');
    assert.equal(g.claim(8), true, 'another item is free');
    g.release(7);
    assert.equal(g.claim(7), true, 'after a cancel or a failure the item can be decided again');
    g.land(7);
    assert.equal(g.held(7), true, 'a landed decision keeps the claim');
    assert.equal(g.landed(7), true);
    g.release(7);
    assert.equal(g.claim(7), false, 'a landed item never takes another decision, even after a stray release');
  });

  it('O-1: no-question paths claim at the tap; asked paths claim in YES; landed writes are kept', () => {
    const list = between(code(QUEUE), 'function QueueList()', '/* ── Appeals');
    const decide = between(list, 'const decide = useCallback', 'const onPost');
    assert.doesNotMatch(decide, /guard\.claim/, 'decide never claims before its question (N-1)');
    assert.match(decide, /askThenDecide\(/);
    assert.match(between(list, 'const onPost', 'const onUser'), /if \(!postId \|\| !guard\.claim\(item\.logId\)\) return;/);
    const stand = between(list, 'const stand', 'const memberItems');
    assert.doesNotMatch(stand, /guard\.claim/, 'stand never claims before its question (N-1)');
    assert.match(stand, /askThenDecide\(/);
    const send = between(list, 'const send = useCallback', 'const done');
    assert.match(send, /if \(landed\) guard\.land\(item\.logId\);\s*else guard\.release\(item\.logId\)/);
    assert.match(send, /if \(!started\) guard\.release\(item\.logId\)/);
    // The writes go through `send`, never straight to `run`, except MEMBER's warn/mute (no queue decision).
    assert.equal((list.match(/\brun\(String\(item\.logId\)/g) ?? []).length, 2);
    assert.equal((list.match(/send\(item, async/g) ?? []).length, 3);
  });
});

describe('re-check follow-ups (CHECK_P2_queue.md, Re-check)', () => {
  /** The house dialog host drops a request identical (title + body) to one
   *  already showing, without running any handler (AppDialog sameDialog). */
  const host = () => {
    const showing: { title: string; body: string; yes: () => void }[] = [];
    return {
      showing,
      confirm(q: { title: string; body: string }, yes: () => void) {
        if (showing.some((d) => d.title === q.title && d.body === q.body)) return; // dropped, no handler runs
        showing.push({ title: q.title, body: q.body, yes });
      },
      tapYes(i = 0) {
        const [d] = showing.splice(i, 1);
        d.yes();
      },
      dismiss(i = 0) {
        showing.splice(i, 1); // CANCEL, scrim or BACK
      },
    };
  };

  it('N-1: DISMISS on threat items A and B in one frame: two questions, and neither item is held by a question', async () => {
    const { createDecisionGuard, askThenDecide, queueDecisionAsk } = await faces();
    const g = createDecisionGuard();
    const h = host();
    const sent: number[] = [];
    const item = { urgentCategory: 'threat', child: false, hasMember: true };
    const a = queueDecisionAsk('dismiss', { ...item, name: 'Ana' })!;
    const b = queueDecisionAsk('dismiss', { ...item, name: 'Ben' })!;
    assert.notEqual(a.title, b.title, 'two items never make identical questions');
    askThenDecide(g, 1, a, h.confirm, () => sent.push(1));
    askThenDecide(g, 2, b, h.confirm, () => sent.push(2));
    assert.equal(h.showing.length, 2);
    assert.equal(g.held(1), false, 'a question alone holds nothing');
    assert.equal(g.held(2), false);
    h.tapYes(1);
    assert.deepEqual(sent, [2]);
    assert.equal(g.held(2), true, 'claimed in YES');
  });

  it('N-1: a question the host dropped, or one cancelled, leaves the item free for the next tap', async () => {
    const { createDecisionGuard, askThenDecide } = await faces();
    const g = createDecisionGuard();
    const h = host();
    const sent: number[] = [];
    const same = { title: 'Dismiss this item?', body: 'This was flagged as a threat of violence.' };
    askThenDecide(g, 1, same, h.confirm, () => sent.push(1));
    askThenDecide(g, 2, same, h.confirm, () => sent.push(2)); // nameless twin: dropped
    assert.equal(h.showing.length, 1);
    assert.equal(g.held(2), false, 'the dropped question never claimed item 2');
    h.dismiss();
    assert.equal(g.held(1), false, 'a cancelled question never claimed item 1');
    askThenDecide(g, 2, same, h.confirm, () => sent.push(2));
    h.tapYes();
    assert.deepEqual(sent, [2], 'item 2 can still be decided');
  });

  it('O-1 still holds with the claim in YES: DISMISS then CONFIRM on one item sends one decision', async () => {
    const { createDecisionGuard, askThenDecide, queueDecisionAsk } = await faces();
    const g = createDecisionGuard();
    const h = host();
    const sent: string[] = [];
    const item = { urgentCategory: 'child_safety', child: true, hasMember: true, name: 'Ana' };
    askThenDecide(g, 1, queueDecisionAsk('dismiss', item), h.confirm, () => sent.push('dismiss'));
    askThenDecide(g, 1, queueDecisionAsk('confirm', item), h.confirm, () => sent.push('confirm'));
    assert.equal(h.showing.length, 2, 'two different questions queue');
    h.tapYes(); // DISMISS: claimed, write in flight
    h.tapYes(); // CONFIRM: refused while the first is pending
    assert.deepEqual(sent, ['dismiss']);
    g.land(1);
    askThenDecide(g, 1, null, h.confirm, () => sent.push('again'));
    assert.deepEqual(sent, ['dismiss'], 'and refused for good once it landed');
  });

  it('N-2: READ AGAIN in flight while a decision lands: the older read never shows the decided item', async () => {
    const { createDecisionGuard, visibleQueueItems } = await faces();
    const g = createDecisionGuard();
    // READ AGAIN starts; the server still lists item 1.
    const olderRead = [{ logId: 1 }, { logId: 2 }];
    // DISMISS on item 1 lands before that read answers.
    assert.equal(g.claim(1), true);
    g.land(1);
    // The older read lands: item 1 is not shown again.
    assert.deepEqual(visibleQueueItems(olderRead, g), [{ logId: 2 }]);
    // A pending (not landed) decision stays visible, with its busy buttons.
    assert.equal(g.claim(2), true);
    assert.deepEqual(visibleQueueItems(olderRead, g), [{ logId: 2 }]);
    g.release(2);
    assert.deepEqual(visibleQueueItems(olderRead, g), [{ logId: 2 }]);
  });

  it('N-2: the screen draws the list through visibleQueueItems, and the question names the author', () => {
    const list = between(code(QUEUE), 'function QueueList()', '/* ── Appeals');
    assert.match(list, /const items = visibleQueueItems\(read\.value\.items, guard\);/);
    const decide = between(list, 'const decide = useCallback', 'const onPost');
    assert.match(decide, /name: item\.author\?\.name/);
  });
});
