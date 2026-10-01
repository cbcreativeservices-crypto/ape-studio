/**
 * Night bug pass 2 of 3, 2026-10-01 (audio tools area).
 *
 *  1. micSession: an acquire landing while a stop is still closing the HAL
 *     (the hub's forceRestart, releaseMicNow, the dead-stream restart) waits
 *     for that stop before it starts — natively the two interleaved and the
 *     late stop killed the fresh stream we flagged 'open';
 *  2. micSession: a forceRestart released mid-stop (backgrounded during the
 *     hub's resume) does not reopen a stream nobody owns;
 *  3. measurementStore: a SAVE tapped while the account wipe is clearing the
 *     table writes nothing (pass-1's fence bumped only AFTER the clear);
 *  4. Light Pulse: a new camera session waits for the previous run's late
 *     close (STOP → START, or Home-and-back during the camera open);
 *  5. MultiMeter locked SAVE: the snapshot sheet is a DimModal, so the
 *     membership gate's rootModalHoldMs wait covers the close (pin).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DSP_URL = 'ape-test-n2:ape-dsp';
const OUT_URL = 'ape-test-n2:audio-output-store';
const BACKEND_URL = 'ape-test-n2:measurements-backend';
const STORAGE_URL = 'ape-test-n2:async-storage';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('modules/ape-dsp')) return { url: DSP_URL, shortCircuit: true };
    if (specifier.endsWith('audio/audioOutputStore')) return { url: OUT_URL, shortCircuit: true };
    if (specifier === './measurementsBackend') return { url: BACKEND_URL, shortCircuit: true };
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_URL, shortCircuit: true };
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
    if (url === DSP_URL) return { format: 'module', shortCircuit: true, source: 'export const ApeDsp = globalThis.__n2Dsp;' };
    if (url === OUT_URL) return { format: 'module', shortCircuit: true, source: 'export function setMicActive() {}' };
    if (url === STORAGE_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export default { async getItem() { return null; }, async setItem() {}, async removeItem() {} };',
      };
    }
    if (url === BACKEND_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const rows = new Map();
          globalThis.__n2Rows = rows;
          globalThis.__n2ClearGate = null;
          export async function readAllRows() { return [...rows.values()]; }
          export async function putRow(r) { rows.set(r.id, r); }
          export async function deleteRows(ids) { for (const id of ids) rows.delete(id); }
          export async function replaceAllRows(rs) { rows.clear(); for (const r of rs) rows.set(r.id, r); }
          export async function clearAllRows() {
            if (globalThis.__n2ClearGate) await globalThis.__n2ClearGate;
            rows.clear();
          }
        `,
      };
    }
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __n2Dsp: unknown;
  // eslint-disable-next-line no-var
  var __n2Rows: Map<string, unknown>;
  // eslint-disable-next-line no-var
  var __n2ClearGate: Promise<void> | null;
}

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

// A native layer whose stop settles only when the test says so, and which
// records the order the calls actually ran in.
const log: string[] = [];
let capturing = false;
const stops: (() => void)[] = [];
/** When set, the next start() waits for this (a cold HAL open). */
let startGate: Promise<void> | null = null;
globalThis.__n2Dsp = {
  setEngineConfig() {},
  async start() {
    log.push('start');
    if (startGate) await startGate;
    capturing = true;
  },
  stop() {
    log.push('stop:issued');
    return new Promise<void>((r) => {
      stops.push(() => {
        log.push('stop:done');
        capturing = false;
        r();
      });
    });
  },
  getMeterFrame() {
    return { running: capturing, captureStalled: false };
  },
};
const mic = await import('../src/features/tools/engine/micSession.ts');
const settleStops = async () => {
  while (stops.length) {
    stops.shift()!();
    await flush();
  }
};

test('1a — a tool acquire during the hub forceRestart stop waits for the stop', async () => {
  await mic.acquireMic({} as never); // hub, first open
  assert.equal(mic.isMicOpen(), true);
  log.length = 0;
  const hub = mic.acquireMic({} as never, true); // hub resume: hard reset
  await flush();
  const tool = mic.acquireMic({} as never); // a tool lands inside that stop
  await flush();
  assert.deepEqual(log, ['stop:issued'], 'no start while the HAL is still closing');
  await settleStops();
  await Promise.all([hub, tool]);
  assert.deepEqual(log, ['stop:issued', 'stop:done', 'start'], 'ONE fresh open, after the stop');
  assert.equal(mic.isMicOpen(), true);
  assert.equal(capturing, true, 'the stream both screens read as running is live');
  mic.releaseMicNow();
  await settleStops();
});

test('1b — an acquire right after releaseMicNow waits for that stop', async () => {
  await mic.acquireMic({} as never);
  log.length = 0;
  mic.releaseMicNow(); // Home
  const back = mic.acquireMic({} as never); // straight back
  await flush();
  assert.deepEqual(log, ['stop:issued']);
  await settleStops();
  await back;
  assert.deepEqual(log, ['stop:issued', 'stop:done', 'start']);
  assert.equal(capturing, true);
  mic.releaseMicNow();
  await settleStops();
});

test('1c — a second acquire during the dead-stream restart joins, never overlaps', async () => {
  await mic.acquireMic({} as never);
  capturing = false; // the OS killed capture under the 'open' flag
  log.length = 0;
  const a = mic.acquireMic({} as never);
  await flush();
  const b = mic.acquireMic({} as never);
  await flush();
  assert.deepEqual(log, ['stop:issued']);
  await settleStops();
  await Promise.all([a, b]);
  assert.deepEqual(log, ['stop:issued', 'stop:done', 'start'], 'one start, after the stop');
  assert.equal(capturing, true);
  mic.releaseMicNow();
  await settleStops();
});

test('2 — a forceRestart released mid-stop does not reopen the mic', async () => {
  await mic.acquireMic({} as never);
  log.length = 0;
  const hub = mic.acquireMic({} as never, true);
  await flush();
  mic.releaseMicNow(); // backgrounded during the resume
  await settleStops();
  await hub;
  await flush();
  assert.deepEqual(log, ['stop:issued', 'stop:done'], 'no start for a released session');
  assert.equal(mic.isMicOpen(), false);
  assert.equal(capturing, false);
});

test('2b — a forceRestart released while it waits on a cold start does not reopen', async () => {
  log.length = 0;
  let open: () => void = () => {};
  startGate = new Promise<void>((r) => (open = r));
  const first = mic.acquireMic({} as never).catch(() => {}); // cold open in flight
  await flush();
  const hub = mic.acquireMic({} as never, true); // hub resume waits on it
  await flush();
  mic.releaseMicNow(); // backgrounded
  startGate = null;
  open();
  await flush();
  await settleStops();
  await Promise.all([first, hub]);
  await settleStops();
  assert.equal(log.filter((l) => l === 'start').length, 1, 'no second open for a released session');
  assert.equal(mic.isMicOpen(), false);
  assert.equal(capturing, false);
});

test('3 — a SAVE tapped while the account wipe is clearing the table writes nothing', async () => {
  const store = await import('../src/features/tools/measure/measurementStore.ts');
  const rec = (id: string) => ({
    id,
    tool_type: 'spl',
    created_at: '2026-10-01T00:00:00.000Z',
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
  assert.equal(await store.saveMeasurement(rec('warm') as never), true, 'library hydrated and warm');
  let release: () => void = () => {};
  globalThis.__n2ClearGate = new Promise<void>((r) => (release = r));
  const wiping = store.clearStoredMeasurements();
  await flush();
  const saving = store.saveMeasurement(rec('during-wipe') as never);
  await flush();
  globalThis.__n2ClearGate = null;
  release();
  await wiping;
  assert.equal(await saving, false, 'the departing account’s save reports it did not land');
  await flush();
  assert.equal(globalThis.__n2Rows.has('during-wipe'), false, 'nothing written for the next account');
  store.getMeasurements();
  await flush();
  assert.deepEqual(store.getMeasurements().map((m) => m.id), []);
  assert.equal(await store.saveMeasurement(rec('after') as never), true, 'saves work again once the wipe is done');
});

test('4 — Light Pulse: every start waits for the previous run’s close', () => {
  const src = read('features/tools/capture/opticalCounter.ts');
  assert.match(src, /let priorClose: Promise<void> = Promise\.resolve\(\);/);
  const fx = src.slice(src.indexOf('const run = priorClose'), src.indexOf('return { state, reading, lastError };'));
  assert.match(fx, /if \(cancelled\) return; \/\/ superseded[^\n]*\n\s*await Optical\.start\(\);/);
  assert.match(fx, /if \(cancelled\) \{[\s\S]*?await Optical\.stop\(\);\s*return;\s*\}/, 'the late close is awaited, not fired');
  assert.match(fx, /priorClose = run\.then\(\(\) => Optical\.stop\(\)\)/);
});

test('5 — MultiMeter locked SAVE: the sheet is a DimModal, so the gate waits out its close', () => {
  const src = read('screens/tools/MultiMeterScreen.tsx');
  assert.match(src, /import \{ Modal \} from '\.\.\/\.\.\/components\/DimModal';/);
  assert.doesNotMatch(src, /import \{[^}]*\bModal\b[^}]*\} from 'react-native';/);
  const fn = src.slice(src.indexOf('const confirmSnapshot = useCallback'), src.indexOf('if (!draft) return;', src.indexOf('const confirmSnapshot = useCallback')));
  assert.match(fn, /setDraft\(null\);\s*saveGate\.prompt\(\);/);
  const gate = read('features/commercial/MembershipGate.tsx');
  assert.match(gate, /const holdMs = live && !otherModalOpen \? rootModalHoldMs\(\) : 0;/);
});
