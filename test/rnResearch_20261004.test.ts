/**
 * RN research pass (2026-10-04) — the vetted, OTA-safe "do now" items.
 *
 * A1. InteractionManager is a deprecated stub in RN 0.86 bridgeless (its
 *     callback runs as a same-tick microtask, before the render step) and
 *     Expo SDK 58 removes it. Every site now uses runSoon (src/lib/
 *     afterInteractions.ts): a real macrotask, or an idle callback with a
 *     ceiling. RATCHET: no InteractionManager use in src/ (allowlist empty).
 * A2. UIManager.setLayoutAnimationEnabledExperimental is a no-op under the
 *     New Architecture (and warns in dev). RATCHET: none in src/.
 * A3. The three expo-sqlite modules open the database on FIRST USE, not as a
 *     side effect of import (measurementsBackend.native.ts's rule).
 *
 * R2: against HEAD every test here fails.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

function srcFiles(dir = join(ROOT, 'src')): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...srcFiles(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}
const code = (p: string) =>
  readFileSync(p, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('A1 ratchet: no InteractionManager in src/ (removed in SDK 58)', () => {
  const ALLOW: string[] = [];
  const hits = srcFiles()
    .filter((p) => /\bInteractionManager\b/.test(code(p)))
    .map((p) => p.slice(ROOT.length).split(String.fromCharCode(92)).join('/'));
  assert.deepEqual(hits.filter((h) => !ALLOW.includes(h)), []);
});

test('A1: runSoon gives each old site its claimed timing', () => {
  assert.match(read('src/features/updates/startAutoUpdate.ts'), /settle: \(cb\) => \{\s*runSoon\(cb\);/);
  assert.match(read('src/components/JogWheel.tsx'), /runSoon\(\(\) => prewarmJogRasters\(size\), \{ idleTimeoutMs: 1000 \}\)/);
  assert.match(read('src/screens/tools/ToolsHubScreen.tsx'), /runSoon\(finish, \{ idleTimeoutMs: 350 \}\)/);
  assert.match(read('src/features/tools/engine/useDspEngine.ts'), /const task = runSoon\(fire\);/);
});

test('A1: runSoon is a macrotask, cancellable, and uses idle callbacks only when asked', async () => {
  const { runSoon } = await import('../src/lib/afterInteractions.ts');
  const order: string[] = [];
  runSoon(() => order.push('soon'));
  queueMicrotask(() => order.push('micro'));
  const cancelled = runSoon(() => order.push('cancelled'));
  cancelled.cancel();
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual(order, ['micro', 'soon']);

  const g = globalThis as unknown as Record<string, unknown>;
  let idleTimeout = -1;
  g.requestIdleCallback = (cb: () => void, o: { timeout: number }) => { idleTimeout = o.timeout; cb(); return 1; };
  g.cancelIdleCallback = () => {};
  try {
    let ran = false;
    runSoon(() => { ran = true; }, { idleTimeoutMs: 350 });
    assert.equal(ran, true);
    assert.equal(idleTimeout, 350);
  } finally {
    delete g.requestIdleCallback;
    delete g.cancelIdleCallback;
  }
});

test('A2 ratchet: no setLayoutAnimationEnabledExperimental in src/', () => {
  const hits = srcFiles().filter((p) => /setLayoutAnimationEnabledExperimental/.test(code(p)));
  assert.deepEqual(hits, []);
});

test('A3: no expo-sqlite database is opened at module scope', () => {
  for (const f of [
    'src/features/glossary/offlineCorpus.native.ts',
    'src/features/quiz/submissionQueueStorage.native.ts',
    'src/features/study/studyQueueStorage.native.ts',
    'src/features/tools/measure/measurementsBackend.native.ts',
  ]) {
    const s = read(f);
    assert.doesNotMatch(s, /^const db = SQLite\.openDatabaseSync/m, `${f} opens at import`);
    assert.doesNotMatch(s, /^db\.execSync/m, `${f} runs DDL at import`);
    assert.match(s, /function db\(\): SQLite\.SQLiteDatabase \{\n  if \(handle\) return handle;/, `${f} has no lazy opener`);
  }
});
