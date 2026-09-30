/**
 * Toddler + cat — day pass 2, 2026-09-30 (audio tools area).
 *
 *  1. catalogClient: the upload drains ONLY the rows it read — a contribution
 *     queued while the upload was in flight survives (it used to be cleared);
 *  2. RT60: an ARM still awaiting start() is dropped by STOP / blur / unmount;
 *  3. SPL + Frequency Counter: their Android BACK handlers act only while the
 *     screen is focused (a pushed library's BACK was swallowed);
 *  4. Light Pulse: no new camera frames ⇒ the reading blanks instead of
 *     re-printing the last window as live.
 *
 * (1) drives the real catalogClient + deviceProfile with faked native deps;
 * the rest are source pins (RN screens cannot be imported under node).
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const MOCKS: Record<string, string> = {
  '@react-native-async-storage/async-storage': 'export default globalThis.__p2AsyncStorage;',
  'react-native': "export const Platform = { OS: 'android', Version: 34, constants: { Model: 'Pixel Test' } };",
  'expo-crypto': 'let n = 0; export const randomUUID = () => `uuid-${++n}`;',
  'expo-constants': "export default { expoConfig: { version: '1.0.0' } };",
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier in MOCKS) return { url: `ape-test-p2:${specifier}`, shortCircuit: true };
    if (specifier.endsWith('/lib/supabase')) return { url: 'ape-test-p2:supabase', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('ape-test-p2:')) {
      const key = url.slice('ape-test-p2:'.length);
      const source = key === 'supabase' ? 'export const supabase = globalThis.__p2Supabase;' : MOCKS[key];
      return { format: 'module', shortCircuit: true, source };
    }
    return next(url, context);
  },
});

const disk = new Map<string, string>();
declare global {
  // eslint-disable-next-line no-var
  var __p2AsyncStorage: unknown;
  // eslint-disable-next-line no-var
  var __p2Supabase: unknown;
}
globalThis.__p2AsyncStorage = {
  async getItem(k: string) {
    return disk.has(k) ? disk.get(k)! : null;
  },
  async setItem(k: string, v: string) {
    disk.set(k, v);
  },
  async removeItem(k: string) {
    disk.delete(k);
  },
};
let duringUpload: (() => Promise<void>) | null = null;
const uploaded: string[] = [];
globalThis.__p2Supabase = {
  from: () => ({
    async upsert(rows: { contribution_id: string }[]) {
      uploaded.push(...rows.map((r) => r.contribution_id));
      if (duringUpload) await duringUpload();
      return { error: null };
    },
  }),
};

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('1 — a contribution queued during the upload is not dropped', async () => {
  const dp = await import('../src/features/tools/measure/deviceProfile.ts');
  const cc = await import('../src/features/tools/measure/catalogClient.ts');
  await dp.setCrowdsourceConsent(true);
  const rec = (model: string) =>
    dp.buildCapabilityRecord({ model } as never);
  const first = dp.makeContribution({ record: rec('A'), offsetDb: 98, nominalStart: 100, referenceQuality: 'calibrator' });
  assert.equal(await dp.queueContribution(first), true);
  const late = dp.makeContribution({ record: rec('B'), offsetDb: 101, nominalStart: 100, referenceQuality: 'type1_2_meter' });
  duringUpload = async () => {
    duringUpload = null;
    await dp.queueContribution(late); // lands while the upsert is in flight
  };
  await cc.uploadQueuedContributions();
  assert.deepEqual(uploaded, [first.contributionId]);
  const left = await dp.getQueuedContributions();
  assert.deepEqual(left.map((c) => c.contributionId), [late.contributionId], 'the late row must survive for the next drain');
  // …and the next drain sends it and empties the queue.
  await cc.uploadQueuedContributions();
  assert.deepEqual(uploaded, [first.contributionId, late.contributionId]);
  assert.deepEqual(await dp.getQueuedContributions(), []);
});

test('2 — RT60: STOP / blur / unmount drop an ARM awaiting start()', () => {
  const src = read('screens/tools/Rt60Screen.tsx');
  const arm = src.slice(src.indexOf('const armCapture = useCallback'), src.indexOf('// STOP must not collapse the guided panel'));
  assert.match(arm, /const gen = \+\+armGenRef\.current;\s*if \(state !== 'running'\) await start\(\);[^\n]*\n\s*if \(gen !== armGenRef\.current\) return;/);
  const stopFn = src.slice(src.indexOf('const onStop = useCallback'), src.indexOf('useToolAutoStart(state, onStart, stop);'));
  assert.equal((stopFn.match(/armGenRef\.current\+\+;/g) ?? []).length, 3, 'STOP, blur and unmount each bump the arm generation');
});

test('3 — SPL + Frequency Counter BACK handlers only while focused', () => {
  const spl = read('screens/tools/SplMeterScreen.tsx');
  assert.match(spl, /const backFocused = useIsFocused\(\);\s*useEffect\(\(\) => \{\s*if \(!backFocused\) return undefined;\s*const onBack = \(\) => \{/);
  const fc = read('screens/tools/FrequencyCounterScreen.tsx');
  assert.match(fc, /const backFocused = useIsFocused\(\);\s*useEffect\(\(\) => \{\s*if \(!backFocused\) return;/);
  assert.match(fc, /\}, \[backFocused, centerLockOpen, vuTunerOpen, mode\]\);/);
});

test('4 — Light Pulse blanks when the camera stops delivering frames', () => {
  const src = read('features/tools/capture/opticalCounter.ts');
  assert.match(src, /const STALE_MS = 1000;/);
  const poll = src.slice(src.indexOf('let lastNewAt = Date.now();'), src.indexOf('if (batch.lastError)'));
  assert.match(poll, /else if \(Date\.now\(\) - lastNewAt > STALE_MS\) \{[\s\S]*setReading\(\(r\) => \(r === null \? r : null\)\);\s*return;/);
  assert.ok(poll.indexOf('STALE_MS') < poll.indexOf('if (!batch) return;'), 'a null batch must not skip the staleness check');
});
