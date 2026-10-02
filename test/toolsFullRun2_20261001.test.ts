/**
 * Full-app bug run 2, 2026-10-02 — TOOLS + AUDIO area.
 *
 *  1. calibrationStore.setSplCalibration swallowed a failed write
 *     (`.catch(() => {})`): on a full device the SPL meter read
 *     "field-calibrated" for the session and silently uncalibrated after a
 *     relaunch (CLEAR likewise came back). It now resolves false on a failed
 *     write, and the SPL meter says so instead of staying quiet.
 *
 * (1a/1b) drive the real store with a fake AsyncStorage; (1c) is a source pin
 * (RN screens cannot be imported under node).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const AS_URL = 'ape-test-fr2:async-storage';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: AS_URL, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === AS_URL) {
      return { format: 'module', shortCircuit: true, source: 'export default globalThis.__fr2AsyncStorage;' };
    }
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __fr2AsyncStorage: unknown;
}

const disk = new Map<string, string>();
let full = false; // SQLITE_FULL: every write rejects
globalThis.__fr2AsyncStorage = {
  async getItem(k: string) {
    return disk.has(k) ? disk.get(k)! : null;
  },
  async setItem(k: string, v: string) {
    if (full) throw new Error('database or disk is full (code 13 SQLITE_FULL)');
    disk.set(k, v);
  },
  async removeItem(k: string) {
    if (full) throw new Error('database or disk is full (code 13 SQLITE_FULL)');
    disk.delete(k);
  },
};

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const KEY = 'ape:splCalOffset';

test('1a — calibration: a write that reaches disk resolves true', async () => {
  const store = await import('../src/features/tools/measure/calibrationStore.ts?ok');
  full = false;
  disk.clear();
  assert.equal(await store.setSplCalibration(96.5), true);
  assert.equal((JSON.parse(disk.get(KEY)!) as { offsetDb: number }).offsetDb, 96.5);
  assert.equal(await store.setSplCalibration(null), true);
  assert.equal(disk.has(KEY), false);
});

test('1b — calibration: a failed write resolves false (never swallowed), and never rejects', async () => {
  const store = await import('../src/features/tools/measure/calibrationStore.ts?full');
  full = false;
  disk.clear();
  disk.set(KEY, JSON.stringify({ offsetDb: 90, setAt: '2026-10-01T00:00:00.000Z' }));
  full = true;
  assert.equal(await store.setSplCalibration(101), false, 'a SET that did not reach disk must say so');
  assert.equal(store.getSplCalibration()?.offsetDb, 101, 'it still applies for this session');
  assert.equal((JSON.parse(disk.get(KEY)!) as { offsetDb: number }).offsetDb, 90, 'disk still holds the old value');
  assert.equal(await store.setSplCalibration(null), false, 'a CLEAR that did not reach disk must say so');
  full = false;
});

test('1c — SPL meter: a calibration write that failed is SAID, for CALIBRATE and CLEAR', () => {
  const src = read('screens/tools/SplMeterScreen.tsx');
  const commit = src.slice(src.indexOf('const commitCalibration = useCallback'), src.indexOf('const clearCalibration = useCallback'));
  assert.match(commit, /void setSplCalibration\(o\)\.then\(\(stored\) => \{/);
  assert.match(commit, /notify\(\s*'Calibration not saved'/);
  assert.match(commit, /afterDialogCloses\(offerContribution\)/, 'the contribution prompt waits for the notice to close');
  const clear = src.slice(src.indexOf('const clearCalibration = useCallback'));
  assert.match(clear.slice(0, 600), /void setSplCalibration\(null\)\.then\(\(stored\) => \{\s*if \(stored\) return;\s*notify\(\s*'Calibration not cleared'/);
  assert.equal(src.includes('onPress={() => setSplCalibration(null)}'), false, 'no CLEAR button bypasses the check');
  assert.equal(src.match(/onPress=\{clearCalibration\}/g)?.length, 2, 'both CLEAR buttons (inline + full screen)');
});
