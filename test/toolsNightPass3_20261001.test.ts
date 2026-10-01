/**
 * Night bug pass 3 of 3, 2026-10-01 (audio tools area).
 *
 *  1. micSession: a native stop that never settles no longer blocks every
 *     future start (closeStream is capped; the orphan close goes through it);
 *  2. Light Pulse: the priorClose chain is capped the same way;
 *  3. Exposure Monitor: a history read started before "Delete all" cannot land
 *     after it and bring the deleted days back (request-order fence).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { mock, test } from 'node:test';

const DSP_URL = 'ape-test-n3:ape-dsp';
const OUT_URL = 'ape-test-n3:audio-output-store';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('modules/ape-dsp')) return { url: DSP_URL, shortCircuit: true };
    if (specifier.endsWith('audio/audioOutputStore')) return { url: OUT_URL, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === DSP_URL) return { format: 'module', shortCircuit: true, source: 'export const ApeDsp = globalThis.__n3Dsp;' };
    if (url === OUT_URL) return { format: 'module', shortCircuit: true, source: 'export function setMicActive() {}' };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __n3Dsp: unknown;
}

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

let starts = 0;
let capturing = false;
/** When true, stop() returns a promise that never settles (a wedged HAL). */
let stopHangs = false;
let startGate: Promise<void> | null = null;
globalThis.__n3Dsp = {
  setEngineConfig() {},
  async start() {
    starts++;
    if (startGate) await startGate;
    capturing = true;
  },
  stop() {
    capturing = false;
    return stopHangs ? new Promise<void>(() => {}) : Promise.resolve();
  },
  getMeterFrame() {
    return { running: capturing, captureStalled: false };
  },
};

mock.timers.enable({ apis: ['setTimeout'] });
const mic = await import('../src/features/tools/engine/micSession.ts');

test('1a — a stop that never settles does not block the next start forever', async () => {
  await mic.acquireMic({} as never);
  assert.equal(mic.isMicOpen(), true);
  stopHangs = true;
  mic.releaseMicNow(); // Home — the native stop wedges
  const back = mic.acquireMic({} as never);
  await flush();
  assert.equal(starts, 1, 'still waits for the stop inside the cap');
  stopHangs = false;
  mock.timers.tick(4000);
  await flush();
  await back;
  assert.equal(starts, 2, 'the cap let the fresh open through');
  assert.equal(mic.isMicOpen(), true);
  mic.releaseMicNow();
  await flush();
});

test('1b — an orphaned start whose late close wedges does not hold every acquire', async () => {
  let open: () => void = () => {};
  startGate = new Promise<void>((r) => (open = r));
  const first = mic.acquireMic({} as never).catch(() => {});
  await flush();
  mic.releaseMicNow(); // disowns the cold open
  const back = mic.acquireMic({} as never);
  stopHangs = true;
  startGate = null;
  open(); // the orphan opens, then its close wedges
  await flush();
  const before = starts;
  stopHangs = false;
  mock.timers.tick(4000);
  await flush();
  await Promise.all([first, back]);
  assert.equal(starts, before + 1, 'the waiting acquire opened once the cap passed');
  assert.equal(mic.isMicOpen(), true);
  mic.releaseMicNow();
  await flush();
});

test('1c — source: closeStream is capped and the orphan close goes through it', () => {
  const src = read('features/tools/engine/micSession.ts');
  assert.match(src, /const STOP_SETTLE_CAP_MS = \d+;/);
  assert.match(src, /setTimeout\(resolve, STOP_SETTLE_CAP_MS\)/);
  const orphan = src.slice(src.indexOf('if (myGen !== startGen) {'), src.indexOf("streamState = 'open';"));
  assert.match(orphan, /await closeStream\(\);/);
  assert.doesNotMatch(orphan, /await ApeDsp\.stop\(\)/);
});

test('2 — Light Pulse: the priorClose chain is capped', () => {
  const src = read('features/tools/capture/opticalCounter.ts');
  assert.match(src, /const CLOSE_SETTLE_CAP_MS = \d+;/);
  assert.match(src, /function settledWithin\(p: Promise<unknown>\): Promise<void>/);
  assert.match(src, /priorClose = settledWithin\(run\.then\(\(\) => Optical\.stop\(\)\)\);/);
});

test('3 — Exposure Monitor: only the newest history request may land; Delete all fences first', () => {
  const src = read('screens/tools/ExposureMonitorScreen.tsx');
  assert.match(src, /const historyReq = useRef\(0\);/);
  assert.match(src, /const req = \+\+historyReq\.current;\s*void getExposureHistory\(\)\.then\(\(h\) => \{\s*if \(req === historyReq\.current\) setHistory\(h\);/);
  assert.doesNotMatch(src, /getExposureHistory\(\)\.then\(setHistory\)/);
  const del = src.slice(src.indexOf("'Delete all',"), src.indexOf('<Text style={styles.chipText}>Delete all</Text>'));
  assert.match(del, /const req = \+\+historyReq\.current;[^\n]*\n\s*void deleteExposureHistory\(\)\.then\(\(\) => \{\s*if \(req === historyReq\.current\) setHistory\(\[\]\);/);
});
