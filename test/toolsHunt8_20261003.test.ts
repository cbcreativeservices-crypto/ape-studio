/**
 * Hunt 8 (2026-10-03, single pass) — TOOLS + AUDIO area.
 *
 *  1. Listening Exposure Monitor: a session's first audible second is held
 *     (a one-tick blip never opens a session, §2.4) and "retro-credited so no
 *     real listening time is lost" — but only to the SESSION. Today's record
 *     (active time AND dose, the hearing-safety number) missed one second per
 *     session: two audible ticks read "Current session 2 s" over "Today 1 s".
 *     The opening tick now credits the held second to the day as well, and the
 *     routine check-in fires on a crossing so that two-second step can never
 *     jump past a multiple of the interval.
 *
 * R2: fails against HEAD cf0b9c7e (today 1 s under a 2 s session).
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORAGE_URL = 'ape-test-h8:async-storage';
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener() { return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  // A generator tone at −20 dBFS on the loudspeaker (94 + −20 = 74 dB).
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => (globalThis.__h8Tone ? { running: true, effectiveLevelDb: -20 } : { running: false, effectiveLevelDb: -20 }),
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
    if (specifier in MOCKS) return { url: `ape-test-h8m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-h8m:${tail}`, shortCircuit: true };
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
    if (url.startsWith('ape-test-h8m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(13)] };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __h8Tone: boolean;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

test("1. a session's held first second reaches today's record too", async () => {
  globalThis.__h8Tone = false;
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: new Date(2026, 9, 3, 12, 0, 0).getTime() });
  try {
    const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
    const snap = exposure.getExposureSnapshot as () => { sessionActiveSec: number; todayActiveSec: number; todayDose: number };
    (exposure.initExposureMonitor as (s: (cb: () => void) => void) => void)(() => {});
    await flush();

    globalThis.__h8Tone = true;
    mock.timers.tick(1000); // first audible tick — held, no session yet
    await flush();
    assert.equal(snap().todayActiveSec, 0, 'a one-tick blip is not counted yet');
    mock.timers.tick(1000); // second audible tick — the session opens
    await flush();
    const s2 = snap();
    assert.equal(s2.sessionActiveSec, 2, 'the session counts both seconds');
    assert.equal(s2.todayActiveSec, 2, "today counts the held second too (it read 1 under a 2 s session)");

    for (let i = 0; i < 8; i++) mock.timers.tick(1000);
    await flush();
    const s10 = snap();
    assert.equal(s10.sessionActiveSec, 10);
    assert.equal(s10.todayActiveSec, s10.sessionActiveSec, 'session and today agree');
  } finally {
    mock.timers.reset();
  }
});
