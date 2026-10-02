/**
 * Evening toddler hunt, pass 3 (2026-10-02, final) — TOOLS + AUDIO area.
 *
 *  1. measurementStore: the legacy-key migration REPLACED the whole table with
 *     the old library. When removing the old key failed, the next hydrate (the
 *     next launch, or pass 2's retry after a failed read) read it again and
 *     the replace DELETED every measurement saved since. The carried records
 *     are now added, never a replace.
 *  2. exposureMonitor: "Export history" shared whatever the swallowing history
 *     read fell back to — today alone — as the person's history, when the
 *     stored days could not be read. The export now rejects (the screen's
 *     existing "Export didn't complete" notice), and one damaged stored day no
 *     longer collapses the screen's whole history to today.
 *  3. ExposureMonitorScreen: updateExposureSettings answers whether the change
 *     was stored, and every settings row dropped the answer — "Save exposure
 *     history" OFF showed OFF and the next launch recorded again. A change the
 *     device did not store is now said (one notice at a time).
 *
 * R2: 1 and 2 fail against the pre-fix store/monitor; 3 fails against the
 * pre-fix screen (source pin — an RN screen cannot load under node).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BACKEND_URL = 'ape-test-e3:measurements-backend';
const STORAGE_URL = 'ape-test-e3:async-storage';
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
    if (specifier in MOCKS) return { url: `ape-test-e3m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-e3m:${tail}`, shortCircuit: true };
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
          globalThis.__e3AS = mem;
          globalThis.__e3ReadFails = new Set();
          globalThis.__e3RemoveFails = new Set();
          export default {
            async getItem(k) {
              if (globalThis.__e3ReadFails.has(k)) throw new Error('storage read failed');
              return mem.has(k) ? mem.get(k) : null;
            },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) {
              if (globalThis.__e3RemoveFails.has(k)) throw new Error('storage write failed');
              mem.delete(k);
            },
          };
        `,
      };
    }
    if (url.startsWith('ape-test-e3m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(13)] };
    if (url === BACKEND_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const rows = new Map();
          globalThis.__e3Rows = rows;
          export async function readAllRows() { return [...rows.values()]; }
          export async function putRow(r) { rows.set(r.id, r); }
          export async function deleteRows(ids) { for (const id of ids) rows.delete(id); }
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
  var __e3Rows: Map<string, { id: string; created_at: string; json: string }>;
  // eslint-disable-next-line no-var
  var __e3AS: Map<string, string>;
  // eslint-disable-next-line no-var
  var __e3ReadFails: Set<string>;
  // eslint-disable-next-line no-var
  var __e3RemoveFails: Set<string>;
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

test('1. a legacy key that could not be removed never wipes measurements saved since', async () => {
  const store = await import('../src/features/tools/measure/measurementStore.ts');
  const LEGACY = 'ape:toolMeasurements';
  globalThis.__e3AS.set(LEGACY, JSON.stringify([rec('legacy', '2026-09-01T00:00:00.000Z')]));
  globalThis.__e3RemoveFails.add(LEGACY); // the old key stays behind

  store.getMeasurements();
  await flush();
  assert.deepEqual(store.getMeasurements().map((m) => m.id), ['legacy'], 'the old library is carried');
  assert.equal(await store.saveMeasurement(rec('new', '2026-10-02T00:00:00.000Z') as never), true);

  store.resetLocal(); // the next launch: memory empty, the store reads again
  store.getMeasurements();
  await flush();
  assert.ok(globalThis.__e3Rows.has('new'), 'the measurement saved after the move is still stored');
  assert.deepEqual(store.getMeasurements().map((m) => m.id), ['new', 'legacy']);
});

test('2. the history export never passes today off as the whole history', async () => {
  const exposure = await import('../src/features/audio/exposureMonitor.ts');
  const dayBlob = (date: string, activeSec: number) =>
    JSON.stringify({
      date, activeSec, dose: 0.1, maxDb: 80, energySum: activeSec * 1e8,
      routeSec: { headphones: activeSec, bluetooth: 0, speaker: 0, external: 0, environmental: 0, unknown: 0 },
      checkins: 0, warnings: 0, sessions: [], longestSessionSec: activeSec,
    });
  globalThis.__e3AS.set('ape:exposure:v1:days', JSON.stringify(['2026-09-20', '2026-09-21', '2026-09-22']));
  globalThis.__e3AS.set('ape:exposure:v1:day:2026-09-20', dayBlob('2026-09-20', 600));
  globalThis.__e3AS.set('ape:exposure:v1:day:2026-09-21', '{damaged');
  globalThis.__e3AS.set('ape:exposure:v1:day:2026-09-22', dayBlob('2026-09-22', 900));
  exposure.resetLocal();
  await flush();

  // One damaged stored day is skipped on its own.
  const shown = (await exposure.getExposureHistory()).map((d) => d.date);
  assert.ok(shown.includes('2026-09-20') && shown.includes('2026-09-22'), `the readable days still show (got ${shown})`);

  // A stored day that cannot be READ fails the export instead of shrinking it.
  globalThis.__e3ReadFails.add('ape:exposure:v1:day:2026-09-22');
  await assert.rejects(exposure.exportExposureHistory(), 'an export missing stored days is not "your history"');
  globalThis.__e3ReadFails.clear();
  const json = JSON.parse(await exposure.exportExposureHistory()) as { days: { date: string }[] };
  assert.ok(json.days.some((d) => d.date === '2026-09-22'));
});

test('3. a settings change the device did not store is said, once', () => {
  const src = readFileSync(
    fileURLToPath(new URL('../src/screens/tools/ExposureMonitorScreen.tsx', import.meta.url)),
    'utf8',
  ).replace(/\r\n/g, '\n');
  const calls = src.match(/updateExposureSettings\(/g) ?? [];
  assert.equal(calls.length, 1, 'every row goes through changeSetting');
  assert.match(
    src,
    /void updateExposureSettings\(patch\)\.then\(\(stored\) => \{\s*if \(stored \|\| settingNoticeRef\.current\) return;[\s\S]*?'Setting not saved'/,
  );
  assert.ok((src.match(/changeSetting\(\{/g) ?? []).length >= 9, 'the nine settings rows');
});
