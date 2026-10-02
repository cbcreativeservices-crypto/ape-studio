/**
 * Evening toddler hunt, pass 2 (2026-10-02) — TOOLS + AUDIO area.
 *
 *  1. measurementStore: a FAILED library read was latched as an empty library
 *     (`hydrated = true`) for the rest of the session — "NO SAVED
 *     MEASUREMENTS YET" over a library still on disk, and a save in that
 *     session showed only itself. Now nothing is latched: the next use reads
 *     again (a save merges into the real library), the screen says the
 *     library could not be read, and a failure is not re-read on every render.
 *  2. measurementStore: a DELETE that failed on disk vanished from the library
 *     with only a console.warn and came back on the next launch. The row now
 *     returns to the list and the person is told (one popup for a bulk delete).
 *  3. exposureMonitor: "Delete today" swallowed a failed removal — today read
 *     0 % on screen while the stored day stayed on disk and was back at the
 *     next launch. The day is put back and the call resolves false (the
 *     screen says so); Delete all reports it too.
 *
 * The store runs against a stubbed backend whose read can be made to fail
 * (same loader shape as toolsNightPass2_20261001). R2: fails against the
 * pre-fix store.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BACKEND_URL = 'ape-test-e2:measurements-backend';
const STORAGE_URL = 'ape-test-e2:async-storage';
// exposureMonitor's native neighbours (same set as localStoreWave2Audio).
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener() { return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  'ape-dsp': 'export const ApeDsp = { isAvailable: () => false };',
  useDspEngine: 'export const frameIsLive = () => false;',
  audioOutputStore: 'export const isAudioOutputEnabled = () => true; export const isMicActive = () => false;',
  popupSuppressStore: 'export const areOverlaysSuppressed = () => false;',
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === './measurementsBackend') return { url: BACKEND_URL, shortCircuit: true };
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_URL, shortCircuit: true };
    if (specifier in MOCKS) return { url: `ape-test-e2m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-e2m:${tail}`, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STORAGE_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const mem = new Map();
          globalThis.__e2AS = mem;
          globalThis.__e2RemoveFails = false;
          export default {
            async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) {
              if (globalThis.__e2RemoveFails) throw new Error('storage write failed');
              mem.delete(k);
            },
          };
        `,
      };
    }
    if (url.startsWith('ape-test-e2m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(13)] };
    if (url === BACKEND_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const rows = new Map();
          globalThis.__e2Rows = rows;
          globalThis.__e2ReadFails = false;
          globalThis.__e2Reads = 0;
          export async function readAllRows() {
            globalThis.__e2Reads++;
            if (globalThis.__e2ReadFails) throw new Error('SQLITE_IOERR');
            return [...rows.values()];
          }
          export async function putRow(r) { rows.set(r.id, r); }
          globalThis.__e2DeleteFails = false;
          export async function deleteRows(ids) {
            if (globalThis.__e2DeleteFails) throw new Error('SQLITE_IOERR');
            for (const id of ids) rows.delete(id);
          }
          export async function replaceAllRows(rs) { rows.clear(); for (const r of rs) rows.set(r.id, r); }
          export async function clearAllRows() { rows.clear(); }
        `,
      };
    }
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __e2Rows: Map<string, { id: string; created_at: string; json: string }>;
  // eslint-disable-next-line no-var
  var __e2ReadFails: boolean;
  // eslint-disable-next-line no-var
  var __e2Reads: number;
  // eslint-disable-next-line no-var
  var __e2DeleteFails: boolean;
  // eslint-disable-next-line no-var
  var __e2AS: Map<string, string>;
  // eslint-disable-next-line no-var
  var __e2RemoveFails: boolean;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

const rec = (id: string, at: string) => ({
  id,
  tool_type: 'spl',
  created_at: at,
  title: id,
  notes: '',
  input_device: 'phone microphone',
  calibration_status: 'uncalibrated',
  sample_rate: null,
  measurement_settings: {},
  quality_state: 'good',
  warning_flags: [],
  data_payload: { kind: 'spl_log', weighting: 'A', response: 'fast', durationSec: 1, timeline: [], timelineStepSec: 0, peakDb: 1, avgDb: 1 },
});

test('1. a failed library read is not latched as an empty library for the session', async () => {
  const store = await import('../src/features/tools/measure/measurementStore.ts');
  // A library already on disk from an earlier session.
  const old = rec('on-disk', '2026-09-01T00:00:00.000Z');
  globalThis.__e2Rows.set(old.id, { id: old.id, created_at: old.created_at, json: JSON.stringify(old) });

  globalThis.__e2ReadFails = true;
  assert.deepEqual(store.getMeasurements(), []);
  await flush();
  assert.equal(store.measurementsUnreadable(), true, 'the screen can say the library could not be read');

  // Re-rendering after the failure does not hammer the broken read.
  const readsAfterFail = globalThis.__e2Reads;
  store.getMeasurements();
  store.getMeasurements();
  await flush();
  assert.equal(globalThis.__e2Reads, readsAfterFail, 'no read per render while unreadable');

  // The device recovers: the next SAVE reads again and merges into the real library.
  globalThis.__e2ReadFails = false;
  assert.equal(await store.saveMeasurement(rec('new', '2026-10-02T00:00:00.000Z') as never), true);
  assert.deepEqual(
    store.getMeasurements().map((m) => m.id),
    ['new', 'on-disk'],
    'the stored library is back on screen, with the new record',
  );
  assert.equal(store.measurementsUnreadable(), false);
});

test('1b. the library screen says "could not be read", not "no saved measurements yet"', () => {
  const src = readFileSync(
    fileURLToPath(new URL('../src/screens/tools/MeasurementLibraryScreen.tsx', import.meta.url)),
    'utf8',
  ).replace(/\r\n/g, '\n');
  assert.match(src, /ListEmptyComponent=\{\s*measurementsUnreadable\(\) \? \(/);
  assert.match(src, /SAVED MEASUREMENTS COULD NOT BE READ/);
});

test('2. a failed delete puts the row back and says so, once for a bulk delete', async () => {
  const store = await import('../src/features/tools/measure/measurementStore.ts');
  const said: string[] = [];
  store.setMeasurementFailureReporter((title) => said.push(title));
  assert.equal(await store.saveMeasurement(rec('a', '2026-10-02T01:00:00.000Z') as never), true);
  assert.equal(await store.saveMeasurement(rec('b', '2026-10-02T02:00:00.000Z') as never), true);
  const before = store.getMeasurements().map((m) => m.id).sort();
  globalThis.__e2DeleteFails = true;
  store.deleteMeasurement(['a', 'b']); // the library's bulk delete
  await flush();
  assert.deepEqual(store.getMeasurements().map((m) => m.id).sort(), before, 'still stored, still listed');
  assert.deepEqual(said, ['Measurements not deleted'], 'one popup for the lot');
  globalThis.__e2DeleteFails = false;
  store.deleteMeasurement('a');
  await flush();
  assert.equal(store.getMeasurements().some((m) => m.id === 'a'), false);
  assert.equal(globalThis.__e2Rows.has('a'), false);
  const screen = readFileSync(
    fileURLToPath(new URL('../src/screens/tools/MeasurementLibraryScreen.tsx', import.meta.url)),
    'utf8',
  );
  assert.match(screen, /deleteMeasurement\(selected\);/, 'the bulk delete is one call');
});

test('3. Delete today that did not reach disk keeps the day and says so', async () => {
  const exposure = await import('../src/features/audio/exposureMonitor.ts');
  const date = exposure.dateKeyOf(new Date());
  const key = `ape:exposure:v1:day:${date}`;
  globalThis.__e2AS.set(key, JSON.stringify({
    date, activeSec: 3600, dose: 0.5, maxDb: 90, energySum: 3600 * 1e9,
    routeSec: { headphones: 3600, bluetooth: 0, speaker: 0, external: 0, environmental: 0, unknown: 0 },
    checkins: 2, warnings: 0, sessions: [], longestSessionSec: 3600,
  }));
  exposure.resetLocal(); // reads the stored day
  await flush();
  assert.equal(exposure.getExposureSnapshot().todayDose, 0.5);

  globalThis.__e2RemoveFails = true;
  assert.equal(await exposure.deleteExposureToday(), false, 'the failed removal is reported');
  assert.equal(exposure.getExposureSnapshot().todayDose, 0.5, 'never shown as gone while it is still stored');
  assert.ok(globalThis.__e2AS.has(key));
  assert.equal(await exposure.deleteExposureHistory(), false, 'Delete all reports it too');

  globalThis.__e2RemoveFails = false;
  assert.equal(await exposure.deleteExposureToday(), true);
  assert.equal(exposure.getExposureSnapshot().todayDose, 0);
  assert.equal(globalThis.__e2AS.has(key), false);

  const screen = readFileSync(
    fileURLToPath(new URL('../src/screens/tools/ExposureMonitorScreen.tsx', import.meta.url)),
    'utf8',
  ).replace(/\r\n/g, '\n');
  assert.match(screen, /void deleteExposureToday\(\)\.then\(\(deleted\) => \{[\s\S]*?'Today not deleted'/);
});

test('4. (correction to pass 1, item 2) Start Here plays course tones, so it gets the exposure check-ins', () => {
  const read = (rel: string) =>
    readFileSync(fileURLToPath(new URL(`../src/${rel}`, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
  assert.match(read('screens/startHere/StartHereScreen.tsx'), /const tone = useCourseTone\(/);
  const block = read('features/audio/ExposureCheckin.tsx').match(/AUDIO_ROUTES = new Set<string>\(\[([\s\S]*?)\]\)/);
  assert.ok(block);
  assert.ok(block[1].includes("'StartHere'"), 'Start Here is an audio screen');
});
