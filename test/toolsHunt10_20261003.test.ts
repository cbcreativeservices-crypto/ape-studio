/**
 * Hunt 10 (2026-10-03, single pass) - TOOLS + AUDIO area.
 *
 *  1. Listening Exposure Monitor: the once-a-session "elevated level"
 *     advisory latch was cleared only by closeSession(). "Delete today" drops
 *     the open session without closing it, so a listener whose advisory had
 *     fired, who deleted today and kept listening loud, never got the advisory
 *     again. A fresh session now clears the latch when it opens.
 *
 * R2: each test fails against HEAD d5ade47c.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORAGE_URL = 'ape-test-h10:async-storage';
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener(_e, cb) { globalThis.__h10App = cb; return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  // A generator tone at −20 dBFS on the loudspeaker (94 + −20 = 74 dB).
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => (globalThis.__h10Tone ? { running: true, effectiveLevelDb: globalThis.__h10Dbfs ?? -20 } : { running: false, effectiveLevelDb: -20 }),
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
    if (specifier in MOCKS) return { url: `ape-test-h10m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-h10m:${tail}`, shortCircuit: true };
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
    if (url.startsWith('ape-test-h10m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice('ape-test-h10m:'.length)] };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __h10Tone: boolean;
  // eslint-disable-next-line no-var
  var __h10Dbfs: number;
  // eslint-disable-next-line no-var
  var __h10App: (st: string) => void;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

test('1. after "Delete today" a NEW loud session gets its own elevated-level advisory', async () => {
  globalThis.__h10Tone = false;
  globalThis.__h10Dbfs = -4; // 94 + -4 = 90 dBA, above the 88 dBA advisory level
  const t0 = new Date(2026, 9, 3, 12, 0, 0).getTime();
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: t0 });
  try {
    const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
    const kinds: string[] = [];
    (exposure.onExposureCheckin as (cb: (k: string) => void) => void)((k) => kinds.push(k));
    (exposure.initExposureMonitor as (s: (cb: () => void) => void) => void)(() => {});
    await flush();

    globalThis.__h10Tone = true;
    for (let i = 0; i < 310; i++) mock.timers.tick(1000);
    await flush();
    assert.equal(kinds.filter((k) => k === 'advisory').length, 1, 'five loud minutes raise the advisory');

    assert.equal(await (exposure.deleteExposureToday as () => Promise<boolean>)(), true);
    await flush();
    for (let i = 0; i < 310; i++) mock.timers.tick(1000);
    await flush();
    const snap = (exposure.getExposureSnapshot as () => { sessionActiveSec: number })();
    assert.ok(snap.sessionActiveSec >= 300, 'a new session has run five loud minutes');
    assert.equal(
      kinds.filter((k) => k === 'advisory').length,
      2,
      'the new session raises its own advisory (the latch is per session)',
    );
  } finally {
    mock.timers.reset();
  }
});
