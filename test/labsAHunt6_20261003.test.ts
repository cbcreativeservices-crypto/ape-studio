/**
 * Labs A — hunt 6 (2026-10-03). Receipts.
 *
 *  • Production lab home: a rename wrote the ON-SCREEN project back whole
 *    (`upsert({ ...project, name })`). After a stage screen saved answers,
 *    the home's re-read on focus can fail — the list stays on screen (the
 *    copy from before the stage screen) with no notice — and a rename then
 *    wrote those old answers over the learner's work. Now the rename changes
 *    only the name, on the stored copy (projectStore.rename), and a failed
 *    re-read with a list on screen says the list may be out of date.
 * R2: run against the HEAD projectStore.ts / ProductionLabScreen.tsx and failed.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('Production lab home: a rename never writes stale answers back', () => {
  it('projectStore.rename changes the name on the STORED copy and keeps its answers', async () => {
    const { createProjectStore, memoryStore, newProject } = await import('../src/features/production/projectStore.ts');
    const st = createProjectStore(memoryStore());
    const p = newProject('preprod', 'music' as never, 'Plan');
    assert.equal(await st.upsert(p), true);
    // The stage screen saves an answer; the home still holds `p` (no answers).
    assert.ok(await st.setValue('preprod', p.id, 's1', 'f1', 'answer'));
    const store = st as unknown as { rename?: (lab: string, id: string, name: string) => Promise<unknown> };
    assert.equal(typeof store.rename, 'function', 'projectStore has a name-only rename');
    assert.ok(await store.rename!('preprod', p.id, 'My plan'));
    const after = await st.get('preprod', p.id);
    assert.equal(after?.name, 'My plan');
    assert.equal(after?.values['s1.f1'], 'answer', 'the saved answer survives the rename');
  });

  it('the home renames through rename(), never upsert of its on-screen copy', () => {
    const home = read('src/screens/lab/production/ProductionLabScreen.tsx');
    const commit = home.slice(home.indexOf('const commitName = useCallback('), home.indexOf('const confirmDelete'));
    assert.doesNotMatch(commit, /\.upsert\(\{\s*\.\.\.project/);
    assert.match(commit, /\.rename\(lab, project\.id, next\)/);
  });

  it('a failed re-read with a list on screen is said, not silent', () => {
    const home = read('src/screens/lab/production/ProductionLabScreen.tsx');
    assert.match(home, /\{readFailed && projects !== null \? \(/);
  });
});
