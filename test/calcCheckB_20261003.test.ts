/**
 * Extra calculator check B (2026-10-03) — screens, store and flows.
 *
 * B-1 (hunt-6 judgement S1) workflowStore / runner: every FINISH stored the
 *     completed run in `ape:calcwf:runs`, and nothing ever removed it. The only
 *     reader of that collection is the runner's resume search, which skips
 *     completed runs — so the one blob only grew, toward Android's ~2 MB row
 *     limit, past which the drafts could not be read at all. FINISH now
 *     removes the finished run (and any completed run older versions left).
 * B-2 (hunt-6 judgement S5) CalcWorkflowsScreen + CalcResultsScreen: reload()
 *     had no newest-wins fence (pattern P2). The mount load, each focus and
 *     each delete started one; an older list landing last put a just-deleted
 *     workflow/result back on screen (and the workflows repair pass could write
 *     that stale copy back).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const store = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === '../../../features/storage/saveFailureNotice') {
      return { url: 'data:text/javascript,export function reportUnhandledSaveFailure(){}', shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

const mod = await import('../src/screens/lab/calc/workflowStore.ts');
const { workflowStore } = mod;

const RUNS = 'ape:calcwf:runs';
const run = (id: string, completedAt?: string) => ({
  id,
  workflowId: 'tpl-ohms-law',
  workflowName: 'Ohm’s Law',
  startedAt: '2026-10-03T00:00:00Z',
  stepIndex: completedAt ? 2 : 1,
  steps: [{ inputs: {}, stale: false }, { inputs: {}, stale: false }],
  ...(completedAt ? { completedAt } : {}),
});
const stored = () => (JSON.parse(store.get(RUNS) ?? '[]') as { id: string }[]).map((r) => r.id).sort();
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

beforeEach(() => store.clear());

describe('B-1 — a finished workflow run is not kept forever', () => {
  it('finishRun removes the finished run and every completed run, keeps every draft', async () => {
    assert.equal(typeof (workflowStore as Record<string, unknown>).finishRun, 'function', 'the store can retire a finished run');
    store.set(RUNS, JSON.stringify([run('draftA'), run('legacyDone', '2026-09-01T00:00:00Z'), run('cur', '2026-10-03T01:00:00Z'), run('draftB')]));
    const finishRun = (workflowStore as unknown as { finishRun: (id: string) => Promise<boolean> }).finishRun;
    assert.equal(await finishRun('cur'), true);
    assert.deepEqual(stored(), ['draftA', 'draftB']);
  });

  it('finishRun never writes over a runs list it could not read', async () => {
    const fake = (await import('./_fake-async-storage.mjs')).default as { getItem: (k: string) => Promise<string | null> };
    const realGet = fake.getItem;
    store.set(RUNS, JSON.stringify([run('draftA'), run('cur', '2026-10-03T01:00:00Z')]));
    fake.getItem = async () => {
      throw new Error('CursorWindow: row too big');
    };
    try {
      const finishRun = (workflowStore as unknown as { finishRun: (id: string) => Promise<boolean> }).finishRun;
      assert.equal(await finishRun('cur'), false);
    } finally {
      fake.getItem = realGet;
    }
    assert.deepEqual(stored(), ['cur', 'draftA'], 'untouched');
  });

  it('the runner retires a FINISHED run instead of storing it; drafts still save', () => {
    const s = code(read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx'));
    const persist = s.slice(s.indexOf('const persist = useCallback('), s.indexOf("navigation.addListener('beforeRemove'"));
    assert.match(
      persist,
      /const ok = r\.completedAt\s*\?\s*await workflowStore\.finishRun\(r\.id, storeGenRef\.current\)\s*:\s*await workflowStore\.saveRun\(r, storeGenRef\.current\);/,
    );
  });
});

describe('B-2 — newest load wins on My Workflows and Saved Results (P2)', () => {
  it('CalcWorkflowsScreen: an older list (or favourites) read never lands over a newer one', () => {
    const s = code(read('src/screens/lab/calc/CalcWorkflowsScreen.tsx'));
    assert.match(
      s,
      /const ticket = \+\+loadTicket\.current;\s*void workflowStore\.listWorkflows\(\)\.then\(\(list\) => \{\s*if \(ticket !== loadTicket\.current\) return;\s*setMineUnreadable/,
    );
    assert.match(s, /getFavorites\(\)\.then\(\(ids\) => \{\s*if \(ticket === loadTicket\.current\) setFavorites\(ids\);/);
    assert.doesNotMatch(s, /getFavorites\(\)\.then\(setFavorites\)/);
  });

  it('CalcResultsScreen: an older results read never lands over a newer one', () => {
    const s = code(read('src/screens/lab/calc/CalcResultsScreen.tsx'));
    assert.match(
      s,
      /const ticket = \+\+loadTicket\.current;\s*void workflowStore\.listResults\(\)\.then\(\(list\) => \{\s*if \(ticket === loadTicket\.current\) setResults\(list\);/,
    );
    assert.doesNotMatch(s, /listResults\(\)\.then\(setResults\)/);
  });
});
