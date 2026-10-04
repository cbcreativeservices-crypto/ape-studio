/**
 * HUNT 12 (2026-10-04) - AREA 6 (TOOLS + AUDIO). Receipts; each fails on HEAD c0debb14.
 *
 *  1. Exposure monitor: only a TICK closed a session past its quiet gap and
 *     rolled the calendar day, and the poller only runs while output is on or
 *     the mic is capturing (output re-mutes after 20 idle minutes). Listening
 *     late at night and opening the monitor next morning with the app still in
 *     memory showed YESTERDAY's time and dose as "Today" (and the history list
 *     carried yesterday twice); the first tick next day then rolled the day
 *     BEFORE closing last night's session, filing it under today. Snapshot,
 *     history and tick now settle a stale session into its own day, then roll.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORAGE_URL = 'ape-test-h12t:async-storage';
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener() { return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => (globalThis.__h12Tone ? { running: true, effectiveLevelDb: -20 } : { running: false, effectiveLevelDb: -20 }),
    binStatus: () => null,
    modStatus: () => null,
    getInfo: () => ({ outputRoute: 'speaker' }),
    getMeterFrame: () => null,
  };`,
  useDspEngine: 'export const frameIsLive = () => false;',
  audioOutputStore: 'export const isAudioOutputEnabled = () => globalThis.__h12Out !== false; export const isMicActive = () => false;',
  popupSuppressStore: 'export const areOverlaysSuppressed = () => false;',
  calibrationStore: 'export const getSplCalibration = () => null;',
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_URL, shortCircuit: true };
    if (specifier in MOCKS) return { url: `ape-test-h12m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-h12m:${tail}`, shortCircuit: true };
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
          const mem = globalThis.__h12Mem = new Map();
          export default {
            async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
            async multiGet(ks) { return ks.map((k) => [k, mem.has(k) ? mem.get(k) : null]); },
          };
        `,
      };
    }
    if (url.startsWith('ape-test-h12m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(14)] };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __h12Tone: boolean;
  // eslint-disable-next-line no-var
  var __h12Out: boolean;
  // eslint-disable-next-line no-var
  var __h12Mem: Map<string, string>;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

type Day = { date: string; activeSec: number; dose: number; sessions: unknown[] };

test('1. the morning after: yesterday is never shown as today, and last night\'s session stays in last night', async () => {
  globalThis.__h12Tone = false;
  globalThis.__h12Out = true;
  const t0 = new Date(2026, 9, 3, 23, 58, 0).getTime();
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: t0 });
  try {
    const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
    const dateKeyOf = exposure.dateKeyOf as (d: Date) => string;
    const snapshot = exposure.getExposureSnapshot as () => { todayActiveSec: number; todayDose: number; sessionStartMs: number | null };
    const readHistory = exposure.readExposureHistory as () => Promise<{ days: Day[] }>;
    const yesterday = dateKeyOf(new Date(t0));
    let rearm: () => void = () => {};
    (exposure.initExposureMonitor as (s: (cb: () => void) => void) => void)((cb) => {
      rearm = cb;
    });
    await flush();

    // A minute of listening just before midnight.
    globalThis.__h12Tone = true;
    for (let i = 0; i < 60; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    assert.ok(snapshot().todayActiveSec >= 55, 'the minute counted');
    // The tone stops; output re-mutes soon after - the poller stands down.
    globalThis.__h12Tone = false;
    mock.timers.tick(1000);
    await flush();
    globalThis.__h12Out = false;
    rearm();
    // Nine hours later, the app still in memory.
    mock.timers.tick(9 * 3600 * 1000);
    await flush();
    const today = dateKeyOf(new Date());
    assert.notEqual(today, yesterday);

    const s = snapshot();
    assert.equal(s.todayActiveSec, 0, 'no listening yet today - not last night\'s minute');
    assert.equal(s.todayDose, 0, 'today\'s dose is not yesterday\'s');
    assert.equal(s.sessionStartMs, null, 'last night\'s session is not the current one');
    await flush();
    const { days } = await readHistory();
    const dates = days.map((d) => d.date);
    assert.equal(new Set(dates).size, dates.length, `each day listed once (${JSON.stringify(dates)})`);

    // Output on again: the first ticks of today.
    globalThis.__h12Out = true;
    rearm();
    for (let i = 0; i < 3; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    const after = await readHistory();
    const todayRec = after.days.find((d) => d.date === today);
    const lastNight = after.days.find((d) => d.date === yesterday);
    assert.equal(todayRec?.sessions.length ?? 0, 0, 'no session from last night filed under today');
    assert.equal(lastNight?.sessions.length, 1, 'last night\'s session is in last night\'s record');
  } finally {
    globalThis.__h12Tone = false;
    mock.timers.reset();
  }
});
