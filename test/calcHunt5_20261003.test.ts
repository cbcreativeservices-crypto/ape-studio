/**
 * Hunt 5 (2026-10-03) — CALC area.
 *
 * H5-1 Runner SAVE RESULT: notes typed (or START AGAIN tapped) while the save
 *      was in flight re-armed SAVE — then the write landed and set SAVED ✓
 *      over a summary that was never stored. SAVED ✓ now only when the
 *      summary on screen is still the one written.
 * H5-2 workflowStore: a plain list read (off the write chain) that found a
 *      damaged row wrote its quarantine-cleaned SNAPSHOT back. A save queued on
 *      the chain could land between that read and that write — reported
 *      "saved", then erased. The quarantine now runs on the chain and re-reads.
 * H5-3 A failed storage READ of Saved Results / My Workflows / Saved Projects
 *      showed "Nothing saved yet" (or the empty intro) over every saved row —
 *      the hunt-4 Cymatics gallery class. The empty stand-in is now marked and
 *      the screens say the list could not be read.
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
const fake = (await import('./_fake-async-storage.mjs')).default as {
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
};
const realGet = fake.getItem;

const RESULTS = 'ape:calcwf:results';
const result = (id: string) => ({ id, workflowName: `W ${id}`, completedAt: '2026-10-03T00:00:00Z', inputs: [], results: [], warnings: [] });
const settle = () => new Promise((r) => setTimeout(r, 10));
const src = (f: string) => readFileSync(new URL(`../src/screens/lab/calc/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

beforeEach(() => {
  store.clear();
  fake.getItem = realGet;
});

describe('H5-2 — a list read never writes a stale snapshot over a save', () => {
  it('a SAVE that lands between a list read and its quarantine write survives', async () => {
    // One good row and one damaged row (fails the shape guard).
    store.set(RESULTS, JSON.stringify([result('old'), { id: 42 }]));
    // The reader's getItem answers with what it read, but its reply is
    // delivered late — after the save's own read-modify-write has finished.
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let first = true;
    fake.getItem = async (k: string) => {
      const v = store.has(k) ? store.get(k)! : null;
      if (first && k === RESULTS) {
        first = false;
        await gate;
      }
      return v;
    };
    const reading = workflowStore.listResults();
    await settle();
    const ok = await workflowStore.saveResult(result('new'));
    assert.equal(ok, true, 'the save reported success');
    release();
    const shown = await reading;
    assert.ok(shown.every((r) => typeof r.id === 'string'), 'the damaged row is never shown');
    await settle();
    fake.getItem = realGet;
    const ids = (await workflowStore.listResults()).map((r) => r.id).sort();
    assert.deepEqual(ids, ['new', 'old'], 'the reported-saved result is still stored');
    assert.ok(store.has(`${RESULTS}:damaged`), 'the damaged row is still set aside');
  });

  it('a list read still quarantines damaged rows (now on the chain)', async () => {
    store.set(RESULTS, JSON.stringify([result('a'), 'junk']));
    const shown = await workflowStore.listResults();
    assert.deepEqual(shown.map((r) => r.id), ['a']);
    assert.deepEqual(JSON.parse(store.get(RESULTS)!).map((r: { id: string }) => r.id), ['a']);
    assert.deepEqual(JSON.parse(store.get(`${RESULTS}:damaged`)!), ['junk']);
  });

  it('a whole unreadable blob is still set aside before removal', async () => {
    store.set(RESULTS, '{not json');
    assert.deepEqual(await workflowStore.listResults(), []);
    assert.equal(store.get(`${RESULTS}:damaged`), '{not json');
    assert.equal(store.has(RESULTS), false);
  });
});

describe('H5-3 — a failed READ is never shown as "nothing saved"', () => {
  it('the store marks the empty stand-in for a failed read, and only that', async () => {
    assert.equal(typeof mod.workflowListUnreadable, 'function');
    fake.getItem = async () => {
      throw new Error('CursorWindow: row too big');
    };
    const failed = await workflowStore.listResults();
    assert.deepEqual(failed, []);
    assert.equal(mod.workflowListUnreadable(failed), true);
    fake.getItem = realGet;
    const empty = await workflowStore.listResults();
    assert.equal(mod.workflowListUnreadable(empty), false, 'a real empty list is just empty');
  });

  it('Saved Results, My Workflows and Saved Projects each say the list could not be read', () => {
    const res = src('CalcResultsScreen.tsx');
    const i = res.indexOf('workflowListUnreadable(results) ?');
    assert.ok(i > 0 && i < res.indexOf('Nothing saved yet'), 'Saved Results checks before "Nothing saved yet"');
    const wf = src('CalcWorkflowsScreen.tsx');
    assert.match(wf, /setMineUnreadable\(workflowListUnreadable\(list\)\);/);
    const j = wf.indexOf('{mineUnreadable\n');
    assert.ok(j > 0 && j < wf.indexOf("'Nothing saved yet"), 'My Workflows checks before "Nothing saved yet"');
    const pr = src('CalcProjectsScreen.tsx');
    const k = pr.indexOf('workflowListUnreadable(projects) ?');
    // FlatList since perf decisions 2026-10-04: the empty intro is the last
    // branch of ListEmptyComponent, after the unreadable check.
    assert.ok(k > 0 && k < pr.indexOf('A project stores a venue'), 'Saved Projects checks before the empty intro');
    for (const s of [res, wf, pr]) assert.match(s, /could not be read from this device just now — they are not lost/);
  });
});

describe('H5-1 — SAVED ✓ only for the summary that was written', () => {
  it('the runner compares the on-screen summary after the write lands', () => {
    const s = src('CalcWorkflowRunScreen.tsx');
    assert.match(s, /const summaryRef = useRef<SavedRunSummary \| null>\(null\);\n\s*summaryRef\.current = summary;/);
    const save = s.slice(s.indexOf('const saveResult = async'), s.indexOf('// ---- Render'));
    assert.match(save, /if \(ok\) \{\s*if \(summaryRef\.current === summary\) setResultSaved\(true\);\s*return;\s*\}/);
    assert.doesNotMatch(save, /if \(ok\) setResultSaved\(true\);/);
  });
});
