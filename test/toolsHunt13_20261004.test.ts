/**
 * HUNT 13 (2026-10-04) - AREA 6 (TOOLS + AUDIO). Receipts; each fails on HEAD 642fb8a2.
 *
 *  1. Exposure monitor (re-audit of hunt 12's settleIdle): a READ of the
 *     snapshot settles a stale day/session silently, and the tick that follows
 *     sees nothing new and (quiet-tick rule) emits nothing. The hub's dosimeter
 *     chip keeps its snapshot in state and only refreshes on an emit, so once
 *     the Exposure screen (or any re-render's useState initialiser) had read
 *     after midnight, the chip went on showing YESTERDAY's dose and time as
 *     "today" until sound played again. A read that settles now tells the
 *     subscribers (deferred - never inside a render).
 *  2. MultiMeter Smart Detection: the clip detector fired on clipRuns minus a
 *     zero baseline, but the engine's counter is per CAPTURE and a START that
 *     adopts the warm stream (SPL meter / RTA a moment ago, or STOP->START)
 *     inherits every run counted there - "CLIPPING - clipped samples in the
 *     last moments" lit over a clean signal. A counter that restarted (new
 *     capture) below the last value hid real clipping until it caught up.
 *  3. Waveform CLIP OVERRUNS: the same zero baseline on START showed the warm
 *     stream's runs as this run's red count, and saved them into the record.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORAGE_URL = 'ape-test-h13t:async-storage';
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener() { return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => (globalThis.__h13Tone ? { running: true, effectiveLevelDb: -10 } : { running: false, effectiveLevelDb: -10 }),
    binStatus: () => null,
    modStatus: () => null,
    getInfo: () => ({ outputRoute: 'speaker' }),
    getMeterFrame: () => null,
  };`,
  useDspEngine: 'export const frameIsLive = () => false;',
  audioOutputStore: 'export const isAudioOutputEnabled = () => globalThis.__h13Out !== false; export const isMicActive = () => false;',
  popupSuppressStore: 'export const areOverlaysSuppressed = () => false;',
  calibrationStore: 'export const getSplCalibration = () => null;',
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_URL, shortCircuit: true };
    if (specifier in MOCKS) return { url: `ape-test-h13m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-h13m:${tail}`, shortCircuit: true };
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
    if (url.startsWith('ape-test-h13m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(14)] };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __h13Tone: boolean;
  // eslint-disable-next-line no-var
  var __h13Out: boolean;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};
const realTurn = () => new Promise((r) => setTimeout(r, 10));

test('1. a read that rolls the day tells the subscribers (the hub chip never keeps yesterday as today)', async () => {
  globalThis.__h13Tone = false;
  globalThis.__h13Out = true;
  const t0 = new Date(2026, 9, 3, 23, 50, 0).getTime();
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: t0 });
  try {
    const exposure = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
    const snapshot = exposure.getExposureSnapshot as () => { todayActiveSec: number; todayDose: number };
    const subscribe = exposure.subscribeExposure as (cb: () => void) => () => void;
    let rearm: () => void = () => {};
    (exposure.initExposureMonitor as (s: (cb: () => void) => void) => void)((cb) => {
      rearm = cb;
    });
    await flush();

    // Two loud minutes late at night.
    globalThis.__h13Tone = true;
    for (let i = 0; i < 120; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    globalThis.__h13Tone = false;
    mock.timers.tick(1000);
    await flush();
    // Output re-mutes - the poller stands down; the app stays in the foreground.
    globalThis.__h13Out = false;
    rearm();
    await flush();

    // The hub's chip, as it holds the snapshot: state refreshed on emits only.
    let chip = snapshot();
    assert.ok(chip.todayActiveSec >= 100, 'the late listening counted');
    const unsubscribe = subscribe(() => {
      chip = snapshot();
    });
    try {
      // Past midnight, nothing ticking. The Exposure screen opens (its
      // useState initialiser reads the snapshot) - that read rolls the day.
      mock.timers.tick(30 * 60 * 1000);
      await flush();
      const screen = snapshot();
      assert.equal(screen.todayActiveSec, 0, 'the screen shows the new day');
      await realTurn();
      await flush();
      assert.equal(chip.todayActiveSec, 0, 'the hub chip learned the day rolled - not yesterday\'s time as today');
      assert.equal(chip.todayDose, 0, 'nor yesterday\'s dose');
    } finally {
      unsubscribe();
    }
  } finally {
    globalThis.__h13Tone = false;
    mock.timers.reset();
  }
});

type Det = { id: string };
type DetectMod = {
  analyze: (input: unknown, state: unknown) => { raw: Det[]; state: unknown };
  initialDetectState: () => unknown;
};

const frame = (tMs: number, clipRuns: number) => ({
  tMs,
  spectrumDb: null,
  sampleRate: 48000,
  fftSize: 8192,
  meter: { peakDb: -20, clipRuns },
  waveClipped: false,
  pitch: null,
});

test('2. MultiMeter: a warm stream\'s earlier clip runs are not "clipping in the last moments"; a restarted counter still reports new runs', async () => {
  const d = (await import('../src/screens/tools/multiMeterDetect.ts')) as unknown as DetectMod;
  const hasClip = (r: { raw: Det[] }) => r.raw.some((x) => x.id === 'clipping');

  // START adopts a warm stream whose counter already holds 5 runs (from the
  // SPL meter a moment ago). Nothing is clipping now.
  let s = d.initialDetectState();
  let r = d.analyze(frame(0, 5), s);
  assert.equal(hasClip(r), false, 'inherited runs are a baseline, not a fresh clip');
  s = r.state;
  r = d.analyze(frame(160, 5), s);
  assert.equal(hasClip(r), false);
  s = r.state;
  // A real new run is still caught.
  r = d.analyze(frame(320, 6), s);
  assert.equal(hasClip(r), true, 'a new run fires');
  s = r.state;
  // The capture restarted under the tool (counter back near 0) and clipped.
  r = d.analyze(frame(480, 2), s);
  assert.equal(hasClip(r), true, 'runs counted by a restarted capture are new');
});

test('3. Waveform: CLIP OVERRUNS baselines on the run\'s first live frame and follows a restarted counter', () => {
  const src = readFileSync(new URL('../src/screens/tools/WaveformScreen.tsx', import.meta.url), 'utf8');
  assert.match(src, /useState<number \| null>\(null\)/, 'no baseline until a live frame arrives');
  const onStart = src.slice(src.indexOf('const onStart = useCallback'), src.indexOf('void start();', src.indexOf('const onStart = useCallback')));
  assert.match(onStart, /setClipBase\(null\)/, 'START waits for the first live frame instead of assuming a zero counter');
  assert.doesNotMatch(onStart, /setClipBase\(0\)/);
  assert.match(src, /if \(clipBase == null\) setClipBase\(meter\.clipRuns\)/, 'the first live frame is the baseline');
  assert.match(src, /else if \(meter\.clipRuns < clipBase\) setClipBase\(0\)/, 'a restarted counter re-bases to zero');
});
