/**
 * PERFORMANCE HUNT 2026-10-03 - AREA 6 (TOOLS + AUDIO).
 *
 *  1. SPL meter: the skinned VU face re-reconciled its whole SVG (1586x992 skin
 *     image + printed scales) on every ~20 Hz text-readout render. Memoised.
 *  2. SPL meter: the side LED (Skia PEAK/AVG stack) did the same. Memoised.
 *  3. RTA: the piano keyboard (~120 note positions, ~70 SVG keys) rebuilt on
 *     every 15 Hz level frame. Memoised by band AXIS (centres by value).
 *  4. Tuner: the printed cents face (~90 transformed Views) rebuilt on every
 *     15 Hz pitch frame. Memoised.
 *  5. Exposure monitor: a quiet tick after a quiet tick emitted an identical
 *     snapshot every second (re-rendering the hub dosimeter chip / Exposure
 *     screen). Now silent until something changes.
 *  6. Exposure monitor: every 15 s flush re-read and re-parsed the day index
 *     to learn what it already knew (today is in it). Read once per day.
 *  7. Saved Measurements: FlatList windowing (no 21-screen render window over
 *     up to 200 rows).
 *
 * R2: each test fails against HEAD 4201f49f.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

// ── Source-shape receipts ────────────────────────────────────────────────────

test('1. SkinnedVu is memoised (the SPL text readouts no longer re-diff the VU skin SVG)', () => {
  const s = read('src/screens/tools/SkinnedVu.tsx');
  assert.match(s, /export const SkinnedVu = memo\(function SkinnedVu\(/);
  assert.doesNotMatch(s, /export function SkinnedVu\(/);
});

test('2. the SPL side LED is memoised', () => {
  const s = read('src/screens/tools/SplMeterScreen.tsx');
  assert.match(s, /const SideLed = memo\(function SideLed\(/);
  // The props it is compared on stay stable between frames: `live` is memoised.
  assert.match(s, /const live = useMemo<LiveMeterDrive>\(/);
});

test('3. the RTA piano strip is memoised by band axis, not by frame identity', () => {
  const s = read('src/screens/tools/RtaScreen.tsx');
  assert.match(s, /const PianoStrip = memo\(\s*PianoStripImpl,/);
  assert.match(s, /sameCenters\(p\.bands, n\.bands\)/);
  assert.match(s, /function sameCenters\(a: DisplayBands \| null, b: DisplayBands \| null\): boolean/);
});

test('4. the tuner printed scale is memoised', () => {
  const s = read('src/screens/tools/SkinnedTunerVu.tsx');
  assert.match(s, /const PrintedScale = memo\(function PrintedScale\(/);
});

test('7. Saved Measurements list is windowed', () => {
  const s = read('src/screens/tools/MeasurementLibraryScreen.tsx');
  const list = s.slice(s.indexOf('<FlatList'), s.indexOf('renderItem='));
  assert.match(list, /windowSize=\{7\}/);
  assert.match(list, /initialNumToRender=\{10\}/);
  assert.match(list, /maxToRenderPerBatch=\{8\}/);
});

// ── Exposure monitor, behavioural ────────────────────────────────────────────

const STORAGE_URL = 'ape-test-perf6:async-storage';
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener(_e, cb) { globalThis.__p6App = cb; return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => (globalThis.__p6Tone ? { running: true, effectiveLevelDb: -20 } : { running: false, effectiveLevelDb: -20 }),
    binStatus: () => null,
    modStatus: () => null,
    getInfo: () => ({ outputRoute: 'speaker' }),
    getMeterFrame: () => null,
  };`,
  useDspEngine: 'export const frameIsLive = () => false;',
  audioOutputStore: 'export const isAudioOutputEnabled = () => true; export const isMicActive = () => false;',
  popupSuppressStore: 'export const areOverlaysSuppressed = () => false;',
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_URL, shortCircuit: true };
    if (specifier in MOCKS) return { url: `ape-test-p6m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-p6m:${tail}`, shortCircuit: true };
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
          globalThis.__p6Reads = [];
          export default {
            async getItem(k) { globalThis.__p6Reads.push(k); return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
            async multiGet(ks) { return ks.map((k) => [k, mem.has(k) ? mem.get(k) : null]); },
          };
        `,
      };
    }
    if (url.startsWith('ape-test-p6m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(13)] };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __p6Tone: boolean;
  // eslint-disable-next-line no-var
  var __p6App: (st: string) => void;
  // eslint-disable-next-line no-var
  var __p6Reads: string[];
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

test('5 + 6. exposure monitor: quiet ticks stay silent; the day index is read once per day, not every flush', async () => {
  globalThis.__p6Tone = false;
  const t0 = new Date(2026, 9, 3, 12, 0, 0).getTime();
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: t0 });
  try {
    const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
    const subscribe = exposure.subscribeExposure as (cb: () => void) => () => void;
    const snap = exposure.getExposureSnapshot as () => { todayActiveSec: number; soundingNow: boolean };
    (exposure.initExposureMonitor as (s: (cb: () => void) => void) => void)(() => {});
    await flush();

    let emits = 0;
    const off = subscribe(() => {
      emits++;
    });

    // ── 5: sixty quiet seconds with the gate on → nothing new to show.
    for (let i = 0; i < 60; i++) mock.timers.tick(1000);
    await flush();
    assert.equal(emits, 0, 'a quiet tick after a quiet tick does not re-emit an identical snapshot');

    // ── 6: two minutes of listening → eight 15 s flushes, one index read.
    const INDEX = 'ape:exposure:v1:days';
    const before = globalThis.__p6Reads.filter((k) => k === INDEX).length;
    globalThis.__p6Tone = true;
    for (let i = 0; i < 120; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    assert.ok(emits >= 120, 'every audible tick still emits (the live clock keeps ticking)');
    assert.equal(snap().todayActiveSec, 120);
    const indexReads = globalThis.__p6Reads.filter((k) => k === INDEX).length - before;
    assert.equal(indexReads, 1, `the index is read once for today, not on every flush (read ${indexReads}x)`);

    // ── Going quiet still emits the change (sounding → silent), then rests.
    globalThis.__p6Tone = false;
    const atQuiet = emits;
    mock.timers.tick(1000);
    await flush();
    assert.equal(emits, atQuiet + 1, 'the first quiet tick reports the change');
    assert.equal(snap().soundingNow, false);
    for (let i = 0; i < 30; i++) mock.timers.tick(1000);
    await flush();
    assert.equal(emits, atQuiet + 1, 'later quiet ticks change nothing and stay silent');

    // ── Deleting the history forgets "today is indexed": the next flush re-adds it.
    assert.equal(await (exposure.deleteExposureHistory as () => Promise<boolean>)(), true);
    globalThis.__p6Tone = true;
    const beforeDel = globalThis.__p6Reads.filter((k) => k === INDEX).length;
    for (let i = 0; i < 20; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    assert.ok(
      globalThis.__p6Reads.filter((k) => k === INDEX).length > beforeDel,
      'after Delete all the index is read (and today re-added) again',
    );
    off();
  } finally {
    mock.timers.reset();
  }
});
