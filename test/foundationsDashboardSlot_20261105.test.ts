/**
 * The Dashboard's INTRODUCTION sheet (2026-11-05). Runs the real
 * FoundationsDashboardSlot over a small hook stand-in, with its neighbours
 * stubbed, and tests what the sheet is handed.
 *
 *  (a) I'VE READ THIS closes only on a write that landed. A false result keeps
 *      the sheet open and tells the learner. A session or store that is not
 *      known never offers the button.
 *  (b) The buttons are fixed when the sheet opens: a write landing does not
 *      flip them to CLOSE underneath the closing Modal.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SLOT = join(ROOT, 'src/features/foundations/FoundationsDashboardSlot.tsx');
const LESSON = { title: 'A lesson', paragraphs: ['Body'] };

type Rs = { known: boolean; settled: boolean; read: boolean; markRead: () => Promise<boolean> };
type Harness = {
  hooks: { values: unknown[]; deps: (unknown[] | undefined)[]; at: number };
  rs: Rs;
  notices: [string, string][];
  lesson: typeof LESSON;
};
const h: Harness = {
  hooks: { values: [], deps: [], at: 0 },
  rs: { known: true, settled: true, read: false, markRead: async () => true },
  notices: [],
  lesson: LESSON,
};
(globalThis as Record<string, unknown>).__SLOT__ = h;

const stub = (source: string) => 'data:text/javascript,' + encodeURIComponent(`const h = globalThis.__SLOT__;\n${source}`);
const STUBS: Record<string, string> = {
  react: stub(`
    export function useState(init) {
      const i = h.hooks.at++;
      if (!(i in h.hooks.values)) h.hooks.values[i] = typeof init === 'function' ? init() : init;
      return [h.hooks.values[i], (v) => { h.hooks.values[i] = v; }];
    }
    export function useEffect(fn, deps) {
      const i = h.hooks.at++;
      const was = h.hooks.deps[i];
      if (!was || deps.some((d, n) => d !== was[n])) { h.hooks.deps[i] = deps; fn(); }
    }`),
  'react/jsx-runtime': stub(`
    export const Fragment = 'Fragment';
    export const jsx = (type, props) => ({ type, props });
    export const jsxs = jsx;`),
  '../../lib/confirm': stub(`export const notify = (title, body) => { h.notices.push([title, body]); };`),
  './foundationsSource': stub(`
    export const cachedFoundations = () => h.lesson;
    export const loadFoundations = async () => h.lesson;`),
  './TopicFoundationsSheet': stub(`export const FoundationsSheet = 'FoundationsSheet';`),
  './useFoundationsRead': stub(`export const useFoundationsRead = () => h.rs;`),
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (STUBS[specifier]) return { url: STUBS[specifier], shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && fileURLToPath(url) === SLOT) {
      const out = ts.transpileModule(readFileSync(SLOT, 'utf8').replace(/\r\n/g, '\n'), {
        fileName: SLOT,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
const { FoundationsDashboardSlot } = await import('../src/features/foundations/FoundationsDashboardSlot.tsx');

type Row = { read: boolean; locked: boolean; onPress: () => void };
type Sheet = { alreadyRead: boolean; onLater: () => void; onRead: () => Promise<unknown> };

function render(locked = false, onLocked = () => {}): { row: Row; sheet: Sheet | null } {
  h.hooks.at = 0;
  let row: Row | null = null;
  const tree = FoundationsDashboardSlot({
    achievementId: 'topic-1',
    gs: 3060,
    locked,
    onLocked,
    renderRow: (p: Row) => {
      row = p;
      return { type: 'Row' } as never;
    },
  }) as unknown as { props: { children: [unknown, { props: Sheet } | null] } };
  return { row: row as unknown as Row, sheet: tree.props.children[1]?.props ?? null };
}
const opened = (): Sheet => {
  render().row.onPress();
  const { sheet } = render();
  assert.ok(sheet, 'the sheet opened');
  return sheet;
};

beforeEach(() => {
  h.hooks = { values: [], deps: [], at: 0 };
  h.rs = { known: true, settled: true, read: false, markRead: async () => true };
  h.notices = [];
});

describe("(a) I'VE READ THIS answers the write result", () => {
  it('a write that landed closes the sheet, with no notice', async () => {
    await opened().onRead();
    assert.equal(render().sheet, null);
    assert.deepEqual(h.notices, []);
  });

  it('a write that failed keeps the sheet open and tells the learner; trying again can succeed', async () => {
    h.rs.markRead = async () => false;
    await opened().onRead();
    const after = render().sheet;
    assert.ok(after, 'still open');
    assert.equal(after.alreadyRead, false, "I'VE READ THIS is still offered");
    assert.equal(h.notices.length, 1);
    assert.match(h.notices[0][1], /couldn.t be marked as read/);

    h.rs.markRead = async () => true;
    await after.onRead();
    assert.equal(render().sheet, null);
    assert.equal(h.notices.length, 1);
  });

  it("an unknown state does not offer I'VE READ THIS", () => {
    h.rs = { ...h.rs, known: false, read: false };
    assert.equal(opened().alreadyRead, true);
  });
});

describe('(b) the buttons are fixed when the sheet opens', () => {
  it('unread at opening: stays the two-button sheet after the store says read', () => {
    assert.equal(opened().alreadyRead, false);
    h.rs = { ...h.rs, read: true };
    assert.equal(render().sheet?.alreadyRead, false);
  });

  it('read at opening: one CLOSE button', () => {
    h.rs = { ...h.rs, read: true };
    assert.equal(opened().alreadyRead, true);
  });

  it('a later opening takes the state of that opening', () => {
    opened().onLater();
    assert.equal(render().sheet, null);
    h.rs = { ...h.rs, read: true };
    assert.equal(opened().alreadyRead, true);
  });
});

describe('the rest of the row', () => {
  it('a locked topic answers with the study-access popup and opens nothing', () => {
    let told = 0;
    render(true, () => (told += 1)).row.onPress();
    assert.equal(told, 1);
    assert.equal(render(true).sheet, null);
  });

  it('the failure is told through the app dialog, never a raw Alert', () => {
    assert.ok(!/Alert\.alert/.test(readFileSync(SLOT, 'utf8').replace(/\r\n/g, '\n')));
  });
});
