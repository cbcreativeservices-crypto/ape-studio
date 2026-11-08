/**
 * Bug pass 1, group "queue" (2026-11-08): the owner's forum queue
 * (src/screens/admin/ForumQueueView.tsx).
 *
 *  CODE-1-15  a slow appeal SAVE closed the next appeal's popup and dropped its note
 *  CODE-1-26  TRACKED: one shared error line, A's PIN on B, a silent 50-per-category cap
 *  UI-1-13    the appeal popup title flipped to "Uphold the decision" while fading out
 *  UI-1-14    "not the owner" offered RETRY, the AI line and the tabs
 *
 * The faces module is imported as a namespace so a helper that did not exist yet
 * fails its own test instead of the whole file.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const QUEUE = 'src/screens/admin/ForumQueueView.tsx';
const FACES = 'src/screens/admin/forumQueueFaces.ts';
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const between = (src: string, from: string, to: string) => src.slice(src.indexOf(from), src.indexOf(to, src.indexOf(from)));

type Faces = {
  createPopupTurns: () => {
    open(): number;
    close(): void;
    current(): number | null;
    isOpen(t: number | null): boolean;
  };
  offersRetry: (code: string | null | undefined) => boolean;
  trackedCapNote: (rows: { categoryName: string }[], limit?: number) => string | null;
  TRACKED_PER_CATEGORY: number;
};
const faces = async (): Promise<Faces> => {
  assert.ok(existsSync(FACES), 'forumQueueFaces.ts exists');
  return (await import('../src/screens/admin/forumQueueFaces.ts')) as unknown as Faces;
};

describe('CODE-1-15: an appeal save lands only on its own popup', () => {
  it('appeal A saving, CANCEL, open B: A\'s answer does not belong to B', async () => {
    const { createPopupTurns } = await faces();
    const turns = createPopupTurns();
    const a = turns.open();
    turns.close();
    const b = turns.open();
    assert.equal(turns.isOpen(a), false);
    assert.equal(turns.isOpen(b), true);
    turns.close();
    assert.equal(turns.current(), null);
    assert.equal(turns.isOpen(null), false);
  });

  it('reopening the same appeal is a new turn too', async () => {
    const { createPopupTurns } = await faces();
    const turns = createPopupTurns();
    const first = turns.open();
    turns.close();
    assert.notEqual(turns.open(), first);
  });

  it('the appeal SAVE closes only its own turn, and shows busy', () => {
    const body = between(code(QUEUE), 'function AppealList', 'function TrackedList');
    assert.match(body, /const turn = turns\.current\(\)/);
    assert.match(body, /if \(!turns\.isOpen\(turn\)\) return;/);
    assert.ok(body.indexOf('if (!turns.isOpen(turn)) return;') < body.indexOf('setError(r.error)'));
    assert.match(body, /<AmberButton label="SAVE" onPress=\{save\} busy=\{saving\}/);
    // The old unconditional close after the await is gone.
    assert.doesNotMatch(body, /setDeciding\(null\)/);
  });
});

describe('UI-1-13: the appeal popup keeps its title while it fades out', () => {
  it('the popup opens on a flag, not on `deciding`, so the title is never recomputed from null', () => {
    const body = between(code(QUEUE), 'function AppealList', 'function TrackedList');
    assert.match(body, /<Popup visible=\{visible\} onClose=\{close\} label="Decide this appeal">/);
    assert.doesNotMatch(body, /visible=\{!!deciding\}/);
    const close = between(body, 'const close = () =>', '};');
    assert.doesNotMatch(close, /setDeciding/);
  });
});

describe('UI-1-14: "not the owner" is a refusal, not a read failure', () => {
  it('a refusal offers no RETRY; a network failure still does', async () => {
    const { offersRetry } = await faces();
    assert.equal(offersRetry('not_permitted'), false);
    assert.equal(offersRetry(null), true);
    assert.equal(offersRetry('not_allowed'), true);
  });

  it('Failed draws RETRY only when it can help, and every list passes the code', () => {
    const src = code(QUEUE);
    const failed = between(src, 'function Failed', 'function Act');
    assert.match(failed, /\{offersRetry\(code\) \? \(/);
    assert.equal((src.match(/<Failed error=\{read\.error\} code=\{read\.code\}/g) ?? []).length, 3);
    assert.doesNotMatch(src, /<Failed error=\{read\.error\} onRetry/);
  });

  it('the refused page has no AI line and no tabs', () => {
    const view = between(code(QUEUE), 'export function ForumQueueView', 'function Failed');
    const refused = view.indexOf('!offersRetry(usage.code)');
    assert.ok(refused > 0, 'checks the usage refusal');
    assert.ok(refused < view.indexOf('AI this month'), 'before the AI line');
    assert.ok(refused < view.indexOf('accessibilityRole="tablist"'), 'before the tabs');
  });
});

describe('CODE-1-26: the TRACKED tab', () => {
  it('a full category says only the latest are listed, without claiming older ones exist', async () => {
    const { trackedCapNote, TRACKED_PER_CATEGORY } = await faces();
    const rows = (slug: string, name: string, n: number) =>
      Array.from({ length: n }, () => ({ categorySlug: slug, categoryName: name }));
    assert.equal(trackedCapNote(rows('ideas-requests', 'Ideas & Requests', TRACKED_PER_CATEGORY - 1)), null);
    const one = trackedCapNote([
      ...rows('ideas-requests', 'Ideas & Requests', TRACKED_PER_CATEGORY),
      ...rows('bug-reports', 'Bug reports', 3),
    ]);
    assert.equal(one, 'Only the latest 50 topics in Ideas & Requests are listed here.');
    const two = trackedCapNote([...rows('ideas-requests', 'Ideas & Requests', 2), ...rows('bug-reports', 'Bug reports', 2)], 2);
    assert.equal(two, 'Only the latest 2 topics in Ideas & Requests and Bug reports are listed here.');
    assert.doesNotMatch(`${one}${two}`, /—|Older ones/);
  });

  it('the cap is counted per fetch (slug), and a missing name never prints "in  are"', async () => {
    const { trackedCapNote } = await faces();
    // Two categories with no name: each is below the cap on its own.
    const noName = [
      { categorySlug: 'ideas-requests', categoryName: '' },
      { categorySlug: 'bug-reports', categoryName: '' },
    ];
    assert.equal(trackedCapNote(noName, 2), null);
    const full = trackedCapNote([...noName, { categorySlug: 'ideas-requests', categoryName: '' }], 2);
    assert.equal(full, 'Only the latest 2 topics in each category are listed here.');
    assert.doesNotMatch(full ?? '', /in {2}|in are/);
  });

  it('R1: a PIN answer reaches a popup reopened on the same topic', () => {
    const body = code(QUEUE).slice(code(QUEUE).indexOf('function TrackedList'));
    const flag = between(body, 'const flag = useLatchedPress', 'if (read.face');
    const show = flag.indexOf('setTopic((t) => (t && t.id === id ?');
    assert.ok(show > 0, 'flag updates the popup topic');
    assert.ok(show < flag.indexOf('turns.isOpen(turn)'), 'before (not behind) the turn check');
    assert.doesNotMatch(flag, /if \(!turns\.isOpen\(turn\)\) return;/);
  });

  it('the cap matches the p_limit fetchTracked sends', async () => {
    const { TRACKED_PER_CATEGORY } = await faces();
    const api = code('src/features/forum/adminApi.ts');
    const fetch = between(api, 'export async function fetchTracked', '\n}\n');
    assert.match(fetch, new RegExp(`p_limit: ${TRACKED_PER_CATEGORY}\\b`));
  });

  it('SAVE, PIN and LOCK each clear the shared error line before they try', () => {
    const body = code(QUEUE).slice(code(QUEUE).indexOf('function TrackedList'));
    const save = between(body, 'const save = useLatchedPress', 'const flag = useLatchedPress');
    const flag = between(body, 'const flag = useLatchedPress', 'if (read.face');
    for (const fn of [save, flag]) {
      assert.ok(fn.indexOf('setError(null)') > 0 && fn.indexOf('setError(null)') < fn.indexOf('await '), 'cleared before the call');
    }
    assert.ok(save.indexOf('if (!turns.isOpen(turn)) return;') > 0, 'save guards its popup');
    assert.ok(save.indexOf('if (!turns.isOpen(turn)) return;') < save.indexOf('setError(r.error)'), 'save: only its own popup');
    assert.match(flag, /if \(turns\.isOpen\(turn\)\) setError\(r\.error\);/, 'flag: the error is only its own popup\'s');
    assert.match(flag, /setTopic\(\(t\) => \(t && t\.id === id \?/);
    assert.match(body, /trackedCapNote\(read\.value\)/);
    assert.match(body, /<AmberButton label="SAVE" onPress=\{save\} disabled=\{!!problem\} busy=\{saving\}/);
  });
});
