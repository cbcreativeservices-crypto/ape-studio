/**
 * HUNT 11 (2026-10-04) - AREA 6 (TOOLS + AUDIO). Receipts; each fails on HEAD 784bb36f.
 *
 *  1. Exposure monitor day-index cache (perf f578503d) vs the start-up prune:
 *     the prune rewrites the index from its OWN earlier read. A flush that
 *     added today in between remembered "today is indexed", the prune's write
 *     then dropped today, and the cache skipped every later re-add - the day
 *     never reached the history list. Before the cache it healed on the next
 *     flush. The prune now forgets the cache before and after (index epoch).
 *  2. Exposure monitor: the once-a-session ELEVATED-level advisory spent its
 *     latch while Low-Light suppressed overlays (ExposureCheckin drops every
 *     check-in then), so a loud session worked in Low-Light never got it. Now
 *     held like the critical dose warnings; it fires once the mode is off.
 *  3. Community mic catalog consent: a WITHDRAWAL whose consent write failed
 *     returned before clearing the queue, so the stored '1' and every queued
 *     contribution survived and the next drain uploaded what the user had just
 *     declined. A withdrawal now empties the queue even then.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORAGE_URL = 'ape-test-h11t:async-storage';
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener() { return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => (globalThis.__h11Tone ? { running: true, effectiveLevelDb: globalThis.__h11Dbfs ?? -20 } : { running: false, effectiveLevelDb: -20 }),
    binStatus: () => null,
    modStatus: () => null,
    getInfo: () => ({ outputRoute: 'speaker' }),
    getMeterFrame: () => null,
  };`,
  useDspEngine: 'export const frameIsLive = () => false;',
  audioOutputStore: 'export const isAudioOutputEnabled = () => true; export const isMicActive = () => false;',
  popupSuppressStore: 'export const areOverlaysSuppressed = () => globalThis.__h11Quiet === true;',
  'expo-crypto': 'export const randomUUID = () => "u-" + Math.random().toString(36).slice(2);',
  'expo-constants': 'export default { expoConfig: null };',
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_URL, shortCircuit: true };
    if (specifier in MOCKS) return { url: `ape-test-h11m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-h11m:${tail}`, shortCircuit: true };
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
          const mem = globalThis.__h11Mem = new Map();
          export default {
            async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) {
              if (globalThis.__h11FailKey === k) throw new Error('disk full');
              mem.set(k, v);
            },
            async removeItem(k) {
              // The prune's removal of an expired day can be held open.
              if (globalThis.__h11Hold && k === globalThis.__h11HoldKey) await globalThis.__h11Hold;
              mem.delete(k);
            },
            async multiGet(ks) { return ks.map((k) => [k, mem.has(k) ? mem.get(k) : null]); },
          };
        `,
      };
    }
    if (url.startsWith('ape-test-h11m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(14)] };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __h11Tone: boolean;
  // eslint-disable-next-line no-var
  var __h11Mem: Map<string, string>;
  // eslint-disable-next-line no-var
  var __h11Hold: Promise<void> | null;
  // eslint-disable-next-line no-var
  var __h11HoldKey: string;
  // eslint-disable-next-line no-var
  var __h11Dbfs: number | undefined;
  // eslint-disable-next-line no-var
  var __h11Quiet: boolean;
  // eslint-disable-next-line no-var
  var __h11FailKey: string | undefined;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

test('1. a start-up prune overlapping the first flush cannot leave today out of the history index for good', async () => {
  globalThis.__h11Tone = false;
  const t0 = new Date(2026, 9, 4, 12, 0, 0).getTime();
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: t0 });
  try {
    const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
    const dateKeyOf = exposure.dateKeyOf as (d: Date) => string;
    const today = dateKeyOf(new Date(t0));
    const expired = dateKeyOf(new Date(t0 - 60 * 86400000));
    const INDEX = 'ape:exposure:v1:days';
    const mem = globalThis.__h11Mem;
    mem.set(INDEX, JSON.stringify([expired]));
    mem.set(`ape:exposure:v1:day:${expired}`, JSON.stringify({ date: expired }));
    // Hold the prune's removal of the expired day open across the first flush.
    let release!: () => void;
    globalThis.__h11Hold = new Promise<void>((r) => {
      release = r;
    });
    globalThis.__h11HoldKey = `ape:exposure:v1:day:${expired}`;

    (exposure.initExposureMonitor as (s: (cb: () => void) => void) => void)(() => {});
    await flush();

    // Listening starts: the session opens on the 2nd audible tick and flushes,
    // adding today to the index while the prune is still mid-way.
    globalThis.__h11Tone = true;
    for (let i = 0; i < 3; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    assert.ok((JSON.parse(mem.get(INDEX) ?? '[]') as string[]).includes(today), 'the first flush indexed today');

    // The prune finishes and writes the index from its earlier read.
    release();
    globalThis.__h11Hold = null;
    await flush();

    // A minute more of listening: four more flushes.
    for (let i = 0; i < 60; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    const idx = JSON.parse(mem.get(INDEX) ?? '[]') as string[];
    assert.ok(idx.includes(today), `today is back in the stored index after the prune (index: ${JSON.stringify(idx)})`);
    assert.ok(!idx.includes(expired), 'the expired day stays pruned');
  } finally {
    // The mocked clock stays on for test 2 (same monitor, same poller).
    globalThis.__h11Tone = false;
  }
});

test('2. the elevated-level advisory is held in Low-Light, not spent unseen', async () => {
  const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
  const onCheckin = exposure.onExposureCheckin as (cb: (kind: string) => void) => () => void;
  try {
    // What ExposureCheckin SHOWS: nothing while overlays are suppressed.
    const shown: string[] = [];
    const off = onCheckin((kind) => {
      if (!globalThis.__h11Quiet) shown.push(kind);
    });
    globalThis.__h11Tone = true;
    globalThis.__h11Dbfs = -4; // 94 + -4 = 90 dBA, above the 88 dBA advisory level
    globalThis.__h11Quiet = true; // Low-Light on
    for (let i = 0; i < 310; i++) mock.timers.tick(1000);
    await flush();
    assert.equal(shown.filter((k) => k === 'advisory').length, 0, 'nothing appears in Low-Light');
    globalThis.__h11Quiet = false; // Low-Light off, still loud
    for (let i = 0; i < 3; i++) mock.timers.tick(1000);
    await flush();
    assert.equal(shown.filter((k) => k === 'advisory').length, 1, 'the held advisory appears once Low-Light is off');
    off();
  } finally {
    globalThis.__h11Tone = false;
    globalThis.__h11Dbfs = undefined;
    globalThis.__h11Quiet = false;
    mock.timers.reset();
  }
});

test('3. withdrawing calibration-sharing consent empties the queue even when the consent write fails', async () => {
  const dp = (await import('../src/features/tools/measure/deviceProfile.ts')) as Record<string, unknown>;
  const mem = globalThis.__h11Mem;
  const CONSENT = 'ape:crowdsource:consent';
  mem.set(CONSENT, '1');
  const c = {
    schemaVersion: 1,
    contributionId: 'c-1',
    deviceKey: { platform: 'android', model: 'Pixel', osBuild: '1', measurementGrade: false, inputPortType: 'mic', profileVersion: 1 },
    offsetDb: 100,
    nominalStart: 100,
    referenceQuality: 'unknown',
    micInfo: null,
    noiseFloorDb: null,
    sampleRate: 48000,
    createdAt: '2026-10-04T00:00:00Z',
  };
  assert.equal(await (dp.queueContribution as (x: unknown) => Promise<boolean>)(c), true);
  assert.equal(((await (dp.getQueuedContributions as () => Promise<unknown[]>)()) as unknown[]).length, 1);
  globalThis.__h11FailKey = CONSENT; // the "No" cannot be stored
  try {
    await (dp.setCrowdsourceConsent as (on: boolean) => Promise<void>)(false);
  } finally {
    globalThis.__h11FailKey = undefined;
  }
  const left = (await (dp.getQueuedContributions as () => Promise<unknown[]>)()) as unknown[];
  assert.equal(left.length, 0, 'nothing the user withdrew is left waiting for upload');
});
