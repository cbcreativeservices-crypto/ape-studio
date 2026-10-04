/**
 * Hunt 9 (2026-10-03, single pass) - TOOLS + AUDIO area.
 *
 *  1. Listening Exposure Monitor: the quiet-gap rule that ends a session ran
 *     only on a QUIET tick. The 1 Hz poller stops in the background, so audio
 *     that started again hours later continued the OLD session (its start
 *     time, length, sustained-loud count and spent advisory latch). The gap
 *     is now checked on an audible tick as well.
 *  2. Saved Measurements: a measurement saved while the stored library could
 *     not be read is the only row in memory, so the library listed that one
 *     record as the whole library; the "could not be read" card sat in the
 *     EMPTY slot and never showed. It now heads a non-empty list too.
 *
 * R2: each test fails against HEAD 3131eae3.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORAGE_URL = 'ape-test-h9:async-storage';
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener(_e, cb) { globalThis.__h9App = cb; return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  // A generator tone at −20 dBFS on the loudspeaker (94 + −20 = 74 dB).
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => (globalThis.__h9Tone ? { running: true, effectiveLevelDb: -20 } : { running: false, effectiveLevelDb: -20 }),
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
    if (specifier in MOCKS) return { url: `ape-test-h9m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-h9m:${tail}`, shortCircuit: true };
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
          export default {
            async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
            async multiGet(ks) { return ks.map((k) => [k, mem.has(k) ? mem.get(k) : null]); },
          };
        `,
      };
    }
    if (url.startsWith('ape-test-h9m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(13)] };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __h9Tone: boolean;
  // eslint-disable-next-line no-var
  var __h9App: (st: string) => void;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

test('1. audio resumed hours after the app went to the background opens a NEW exposure session', async () => {
  globalThis.__h9Tone = false;
  const t0 = new Date(2026, 9, 3, 12, 0, 0).getTime();
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: t0 });
  try {
    const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
    const snap = exposure.getExposureSnapshot as () => { sessionActiveSec: number; sessionStartMs: number | null; todayActiveSec: number };
    (exposure.initExposureMonitor as (s: (cb: () => void) => void) => void)(() => {});
    await flush();

    globalThis.__h9Tone = true;
    for (let i = 0; i < 8; i++) mock.timers.tick(1000);
    await flush();
    assert.equal(snap().sessionActiveSec, 8);

    globalThis.__h9App('background'); // poller stops; the session is still open
    await flush();
    mock.timers.tick(2 * 3600 * 1000); // two hours later
    const resumeAt = Date.now();
    globalThis.__h9App('active');
    mock.timers.tick(1000);
    mock.timers.tick(1000);
    await flush();
    const s = snap();
    assert.ok(s.sessionStartMs != null && s.sessionStartMs >= resumeAt, 'the session started on resume, not two hours ago');
    assert.equal(s.sessionActiveSec, 2, 'the new session counts only the resumed listening');
    assert.equal(s.todayActiveSec, 10, 'today still adds both stretches');
  } finally {
    mock.timers.reset();
  }
});

test('2. Saved Measurements: an unreadable library that holds a record saved since still says it could not be read', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/screens/tools/MeasurementLibraryScreen.tsx', import.meta.url), 'utf8');
  const header = src.slice(src.indexOf('ListHeaderComponent={'), src.indexOf('ListEmptyComponent={'));
  assert.ok(header.length > 0, 'the list header precedes the empty slot');
  assert.match(
    header,
    /measurementsUnreadable\(\)\s*&&\s*all\.length\s*>\s*0/,
    'the header carries the could-not-be-read notice when the list is NOT empty (the empty slot never shows then)',
  );
});
