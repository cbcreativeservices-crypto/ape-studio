/**
 * Night bug pass 1 of 3, 2026-10-01 (audio tools area).
 *
 *  1. measurementStore: a SAVE waiting on hydrate across an account wipe no
 *     longer writes the previous account's record into the wiped store;
 *  2. Spectrogram: a user FREEZE survives auto-resume (back from the library,
 *     back from Home) — the Waveform's 2026-09-30 rule;
 *  3. useToolAutoStart: never auto-starts the mic while the screen is blurred
 *     (a push during the first cold start used to re-arm and open it behind
 *     the pushed screen);
 *  4. Light Pulse: the camera session closes in the background and reopens on
 *     return;
 *  5. SPL SAVE LOG: a dead capture frame is not saved (frameIsLive);
 *  6. micSession: restarting a dead "open" stream awaits the stop before it
 *     starts again (the unawaited stop could land second and kill it).
 *
 * (1) drives the real store with a gated in-memory AsyncStorage; the rest are
 * source pins (RN screens and hooks cannot be run under node).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STUB_URL = 'ape-test-n1:async-storage';
const DSP_URL = 'ape-test-n1:ape-dsp';
const OUT_URL = 'ape-test-n1:audio-output-store';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: STUB_URL, shortCircuit: true };
    if (specifier.endsWith('modules/ape-dsp')) return { url: DSP_URL, shortCircuit: true };
    if (specifier.endsWith('audio/audioOutputStore')) return { url: OUT_URL, shortCircuit: true };
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
    if (url === DSP_URL) return { format: 'module', shortCircuit: true, source: 'export const ApeDsp = globalThis.__n1Dsp;' };
    if (url === OUT_URL) return { format: 'module', shortCircuit: true, source: 'export function setMicActive() {}' };
    if (url === STUB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const mem = new Map();
          globalThis.__n1Storage = mem;
          globalThis.__n1Gate = null;
          export default {
            async getItem(k) {
              const v = mem.has(k) ? mem.get(k) : null;
              if (globalThis.__n1Gate && k === 'ape:toolMeasurementRows') await globalThis.__n1Gate;
              return v;
            },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
          };
        `,
      };
    }
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __n1Storage: Map<string, string>;
  // eslint-disable-next-line no-var
  var __n1Gate: Promise<void> | null;
  // eslint-disable-next-line no-var
  var __n1Dsp: unknown;
}

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const tick = () => new Promise((r) => setTimeout(r, 0));

test('1 — a save waiting on hydrate across the account wipe writes nothing', async () => {
  const store = await import('../src/features/tools/measure/measurementStore.ts');
  const rec = {
    id: 'previous-account',
    tool_type: 'spl',
    created_at: '2026-10-01T00:00:00.000Z',
    title: 'Previous account',
    notes: '',
    input_device: 'phone microphone',
    calibration_status: 'uncalibrated',
    sample_rate: null,
    measurement_settings: {},
    quality_state: 'good',
    warning_flags: [],
    data_payload: { kind: 'spl_log', weighting: 'A', response: 'fast', durationSec: 1, timeline: [], timelineStepSec: 0, peakDb: 1, avgDb: 1 },
  };
  let release: () => void = () => {};
  globalThis.__n1Gate = new Promise<void>((r) => (release = r));
  const saving = store.saveMeasurement(rec as never); // cold cache: waits on the held read
  for (let i = 0; i < 6; i++) await tick();
  await store.clearStoredMeasurements(); // the account wipe lands meanwhile
  globalThis.__n1Gate = null;
  release();
  assert.equal(await saving, false, 'the superseded save reports it did not land');
  for (let i = 0; i < 6; i++) await tick();
  store.getMeasurements();
  for (let i = 0; i < 6; i++) await tick();
  assert.deepEqual(store.getMeasurements().map((m) => m.id), [], 'the next account must not open on it');
  const rows = globalThis.__n1Storage.get('ape:toolMeasurementRows');
  assert.ok(rows == null || !rows.includes('previous-account'), 'nothing written to disk');
});

test('2 — Spectrogram: START/auto-resume keeps a user freeze', () => {
  const src = read('screens/tools/SpectrogramScreen.tsx');
  const startFn = src.slice(src.indexOf('const onStart = useCallback'), src.indexOf('const onStop = useCallback'));
  assert.match(startFn, /if \(!frozenRef\.current\) \{\s*setHistory\(\[\]\);\s*colIdRef\.current = 0;\s*\}/);
  assert.doesNotMatch(startFn, /frozenRef\.current = false;/, 'START must not unfreeze');
  assert.doesNotMatch(startFn, /setFrozen\(false\)/, 'START must not unfreeze');
});

test('3 — useToolAutoStart holds the auto-start while blurred', () => {
  const src = read('features/tools/engine/useDspEngine.ts');
  assert.match(src, /import \{ useFocusEffect, useIsFocused \} from '@react-navigation\/native';/);
  const fx = src.slice(src.indexOf('const focused = useIsFocused();'), src.indexOf('// Background release + foreground resume (rev 24)'));
  assert.match(fx, /if \(done\.current\) return;\s*if \(!focused\) return undefined;/);
  assert.match(fx, /\}, \[state, start, resumeTick, focused\]\);/);
});

test('4 — Light Pulse closes the camera in the background', () => {
  const src = read('features/tools/capture/opticalCounter.ts');
  assert.match(src, /AppState\.addEventListener\('change', \(s\) => setForeground\(s !== 'background'\)\)/);
  assert.match(src, /const live = active && foreground;/);
  assert.match(src, /if \(!live\) return;/);
  assert.match(src, /\}, \[live, reset\]\);/);
});

test('5 — SPL SAVE LOG refuses a dead capture frame', () => {
  const src = read('screens/tools/SplMeterScreen.tsx');
  const fn = src.slice(src.indexOf('const onSaveLog = useCallback'), src.indexOf('const saveFlags = [...meterFlags(m)'));
  assert.ok(fn.length > 0 && fn.length < 4000, 'the SAVE LOG slice is found');
  assert.match(fn, /if \(!frameIsLive\(m\)\) return;/);
  assert.doesNotMatch(fn, /if \(!m\) return;/);
});

test('6 — micSession: a dead "open" stream is fully stopped BEFORE the restart opens a new one', async () => {
  // A stop that settles later than it is issued — a native call on its own queue.
  const log: string[] = [];
  let capturing = false;
  let releaseStop: () => void = () => {};
  globalThis.__n1Dsp = {
    setEngineConfig() {},
    async start() {
      log.push('start');
      capturing = true;
    },
    stop() {
      log.push('stop:issued');
      return new Promise<void>((r) => {
        releaseStop = () => {
          log.push('stop:done');
          capturing = false;
          r();
        };
      });
    },
    getMeterFrame() {
      return { running: capturing, captureStalled: false };
    },
  };
  const mic = await import('../src/features/tools/engine/micSession.ts');
  await mic.acquireMic({} as never); // open + live
  assert.equal(mic.isMicOpen(), true);
  capturing = false; // the OS killed capture under an 'open' flag
  log.length = 0;
  const again = mic.acquireMic({} as never);
  for (let i = 0; i < 6; i++) await tick();
  assert.deepEqual(log, ['stop:issued'], 'no new start while the old stream is still closing');
  releaseStop();
  await again;
  assert.deepEqual(log, ['stop:issued', 'stop:done', 'start'], 'the restart opens only after the stop has landed');
  assert.equal(mic.isMicOpen(), true);
  mic.releaseMicNow();
  releaseStop();
});
