/**
 * Hunt 7 (2026-10-03, single pass) — TOOLS + AUDIO area.
 *
 *  1. Exposure Monitor HISTORY (D51 "a failed read is told, never shown as
 *     empty"). The screen read the history with the non-strict call, whose
 *     failure fallback is today alone, so a history that could not be read
 *     showed "No history yet." (or today only) over every stored day — and it
 *     showed "No history yet." while the read was still out. Now
 *     readExposureHistory() says `unreadable`, and the screen has the three
 *     faces: loading / could not be read / truly empty.
 *  2. Saved Measurements opened on "NO SAVED MEASUREMENTS YET" until the SQLite
 *     read landed — the loading face was missing (house rule: loading /
 *     unreadable / empty). measurementsLoaded() + a loading card.
 *  3. (Correction to final round C) SPL CLEAR said "could not update storage …
 *     free up some space" for a calibration store that could not be READ —
 *     round C split that message for SET and left CLEAR on the write-failure
 *     wording. CLEAR now tells the two truths too.
 *
 * R2: 1 and 2 fail against HEAD c2864ab1 (the functions do not exist and the
 * screens have no such faces); 3 fails against HEAD's SplMeterScreen.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BACKEND_URL = 'ape-test-h7:measurements-backend';
const STORAGE_URL = 'ape-test-h7:async-storage';
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
    if (specifier in MOCKS) return { url: `ape-test-h7m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-h7m:${tail}`, shortCircuit: true };
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
          globalThis.__h7AS = mem;
          globalThis.__h7ReadFails = new Set();
          export default {
            async getItem(k) {
              if (globalThis.__h7ReadFails.has(k)) throw new Error('storage read failed');
              return mem.has(k) ? mem.get(k) : null;
            },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
          };
        `,
      };
    }
    if (url.startsWith('ape-test-h7m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(13)] };
    if (url === BACKEND_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const rows = new Map();
          globalThis.__h7Rows = rows;
          globalThis.__h7Gate = null;
          export async function readAllRows() {
            if (globalThis.__h7Gate) await globalThis.__h7Gate;
            return [...rows.values()];
          }
          export async function putRow(r) { rows.set(r.id, r); }
          export async function deleteRows(ids) { for (const id of ids) rows.delete(id); }
          export async function clearAllRows() { rows.clear(); }
        `,
      };
    }
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __h7AS: Map<string, string>;
  // eslint-disable-next-line no-var
  var __h7ReadFails: Set<string>;
  // eslint-disable-next-line no-var
  var __h7Gate: Promise<void> | null;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};
const src = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../src/${rel}`, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');

test('1a. an exposure history that could not be read is said, not shown as empty', async () => {
  const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
  assert.equal(typeof exposure.readExposureHistory, 'function', 'readExposureHistory exists');
  const read = exposure.readExposureHistory as () => Promise<{ days: { date: string }[]; unreadable: boolean }>;
  const dayBlob = (date: string) =>
    JSON.stringify({
      date, activeSec: 600, dose: 0.1, maxDb: 80, energySum: 6e10,
      routeSec: { headphones: 600, bluetooth: 0, speaker: 0, external: 0, environmental: 0, unknown: 0 },
      checkins: 0, warnings: 0, sessions: [], longestSessionSec: 600,
    });
  globalThis.__h7AS.set('ape:exposure:v1:days', JSON.stringify(['2026-09-20', '2026-09-21']));
  globalThis.__h7AS.set('ape:exposure:v1:day:2026-09-20', dayBlob('2026-09-20'));
  globalThis.__h7AS.set('ape:exposure:v1:day:2026-09-21', dayBlob('2026-09-21'));
  (exposure.resetLocal as () => void)();
  await flush();

  const ok = await read();
  assert.equal(ok.unreadable, false);
  assert.ok(ok.days.some((d) => d.date === '2026-09-20') && ok.days.some((d) => d.date === '2026-09-21'));

  globalThis.__h7ReadFails.add('ape:exposure:v1:days');
  const failed = await read();
  globalThis.__h7ReadFails.clear();
  assert.equal(failed.unreadable, true, 'a failed read is reported as unreadable');
  assert.ok(!failed.days.some((d) => d.date === '2026-09-20'), 'only the in-memory today stands in');
});

test('1b. the Exposure screen has the three history faces', () => {
  const s = src('screens/tools/ExposureMonitorScreen.tsx');
  assert.match(s, /readExposureHistory\(\)\.then\(\(\{ days, unreadable \}\) =>/);
  assert.match(s, /setHistoryFace\(unreadable \? 'unreadable' : 'read'\)/);
  assert.doesNotMatch(s, /void getExposureHistory\(\)\.then/, 'no swallowing read feeds the list');
  // "No history yet." only once the read has landed and was readable.
  assert.match(
    s,
    /historyFace === 'loading' \? \(\s*<Text style=\{styles\.body\}>Loading history…<\/Text>\s*\) : historyFace === 'unreadable' \? null : \(\s*<Text style=\{styles\.body\}>No history yet\.<\/Text>/,
  );
  assert.match(s, /\{historyFace === 'unreadable' \? \(\s*<Text style=\{styles\.note\}>\s*Earlier days could not be read on this device just now — nothing has been deleted\./);
});

test('2a. the measurement library reports when it has been read', async () => {
  const store = (await import('../src/features/tools/measure/measurementStore.ts')) as Record<string, unknown>;
  assert.equal(typeof store.measurementsLoaded, 'function', 'measurementsLoaded exists');
  const loaded = store.measurementsLoaded as () => boolean;
  let open!: () => void;
  globalThis.__h7Gate = new Promise<void>((r) => (open = r));
  (store.resetLocal as () => void)();
  (store.getMeasurements as () => unknown[])(); // starts the read
  await flush();
  assert.equal(loaded(), false, 'still reading: not loaded');
  open();
  globalThis.__h7Gate = null;
  await flush();
  assert.equal(loaded(), true, 'read landed: loaded');
});

test('2b. Saved Measurements shows a loading face before "NO SAVED MEASUREMENTS YET"', () => {
  const s = src('screens/tools/MeasurementLibraryScreen.tsx');
  const empty = s.slice(s.indexOf('ListEmptyComponent='), s.indexOf('NO SAVED MEASUREMENTS YET'));
  assert.match(empty, /measurementsUnreadable\(\) \?/);
  assert.match(empty, /: !measurementsLoaded\(\) \? \(/);
  assert.match(empty, /Loading saved measurements…/);
});

test('3. (correction to round C) SPL CLEAR tells an unreadable store from a failed write', () => {
  const s = src('screens/tools/SplMeterScreen.tsx');
  const clear = s.slice(s.indexOf('const clearCalibration = useCallback'), s.indexOf('const [community, setCommunity]'));
  assert.match(clear, /'Calibration not cleared',\s*isSplCalibrationUnreadable\(\)\s*\?/);
  assert.match(clear, /could not read its saved calibration just now/);
  // The write-failure wording stays for a real write failure.
  assert.match(clear, /: 'This device could not update storage/);
});
