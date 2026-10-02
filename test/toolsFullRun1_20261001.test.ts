/**
 * Full-app bug run 1, 2026-10-01 — TOOLS + AUDIO area.
 *
 *  1. micSession: an acquire waiting on a stop that is still closing the HAL
 *     (or on an orphaned start, or on the dead-stream restart's close) must
 *     not open the mic when the session was RELEASED during that wait (back
 *     to a tool, then Home again) — it opened capture in the background for
 *     an owner that had already gone. The forceRestart wait already checked
 *     this (night pass 2, test 2); the other three waits did not.
 *  2. Signal Generator: a START whose native genStart() is in flight when
 *     stopAllSound() fires (leaving the app with "Mute audio when I leave the
 *     app" OFF — the gate stays ON) must stop the generator instead of
 *     starting it behind the user.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DSP_URL = 'ape-test-fr1:ape-dsp';
const OUT_URL = 'ape-test-fr1:audio-output-store';
registerHooks({
  resolve(specifier, context, next) {
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
    if (url === DSP_URL) return { format: 'module', shortCircuit: true, source: 'export const ApeDsp = globalThis.__fr1Dsp;' };
    if (url === OUT_URL) return { format: 'module', shortCircuit: true, source: 'export function setMicActive() {}' };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __fr1Dsp: unknown;
}

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

// A native layer whose stop settles only when the test says so.
const log: string[] = [];
let capturing = false;
const stops: (() => void)[] = [];
let startGate: Promise<void> | null = null;
globalThis.__fr1Dsp = {
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

test('1a — released while waiting on a closing stop: the mic stays closed', async () => {
  await mic.acquireMic({} as never);
  await settleStops();
  log.length = 0;
  mic.releaseMicNow(); // Home
  const back = mic.acquireMic({} as never); // straight back — waits on that stop
  await flush();
  mic.releaseMicNow(); // …and Home again inside the wait
  await settleStops();
  await back;
  await settleStops();
  assert.deepEqual(log, ['stop:issued', 'stop:done'], 'no start for a released session');
  assert.equal(mic.isMicOpen(), false);
  assert.equal(capturing, false, 'capture is not live in the background');
});

test('1b — released during the dead-stream restart close: the mic stays closed', async () => {
  await mic.acquireMic({} as never);
  await settleStops();
  capturing = false; // the OS killed capture under the 'open' flag
  log.length = 0;
  const a = mic.acquireMic({} as never); // restart: closes first
  await flush();
  mic.releaseMicNow(); // backgrounded during the close
  await settleStops();
  await a;
  await settleStops();
  assert.deepEqual(log, ['stop:issued', 'stop:done']);
  assert.equal(mic.isMicOpen(), false);
  assert.equal(capturing, false);
});

test('1c — released while waiting on an orphaned start: the mic stays closed', async () => {
  log.length = 0;
  let open: () => void = () => {};
  startGate = new Promise<void>((r) => (open = r));
  const first = mic.acquireMic({} as never).catch(() => {}); // cold open
  await flush();
  mic.releaseMicNow(); // Home mid cold-open → the start is orphaned
  const back = mic.acquireMic({} as never); // back: waits on the orphan
  await flush();
  mic.releaseMicNow(); // Home again inside that wait
  startGate = null;
  open();
  await flush();
  await settleStops();
  await first;
  await back;
  await settleStops();
  assert.equal(log.filter((l) => l === 'start').length, 1, 'only the orphan ever started');
  assert.equal(mic.isMicOpen(), false);
  assert.equal(capturing, false);
});

test('1d — an un-released wait still opens exactly once (no regression)', async () => {
  await mic.acquireMic({} as never);
  await settleStops();
  log.length = 0;
  mic.releaseMicNow();
  const a = mic.acquireMic({} as never);
  const b = mic.acquireMic({} as never); // a second screen joins the same wait
  await flush();
  await settleStops();
  await Promise.all([a, b]);
  assert.deepEqual(log, ['stop:issued', 'stop:done', 'start']);
  assert.equal(capturing, true);
  mic.releaseMicNow();
  await settleStops();
});

test('2 — Signal Generator: stopAllSound during an in-flight genStart stops it', () => {
  const src = read('screens/tools/SignalGenScreen.tsx');
  const start = src.indexOf('const onStart = async');
  const body = src.slice(start, src.indexOf('const onStop = async', start));
  const epochAt = body.indexOf('getSoundStopEpoch()');
  const nativeStart = body.indexOf('await ApeDsp.genStart()');
  assert.ok(epochAt > 0 && epochAt < nativeStart, 'the sound-stop epoch is read before the native start');
  assert.match(
    body,
    /if \(getSoundStopEpoch\(\) !== stopEpoch\) \{\s*void ApeDsp\.genStop\(\);/,
    'a stopAllSound() during the start stops the generator',
  );
  assert.ok(
    body.indexOf('getSoundStopEpoch() !== stopEpoch') < body.indexOf('setRunning(true)'),
    'checked before the transport reads RUNNING',
  );
});

test('3 — RTA: the piano key-lighting poll reads no pitch from a dead mic', () => {
  const src = read('screens/tools/RtaScreen.tsx');
  const at = src.indexOf('const pitchRingRef');
  const effect = src.slice(at, src.indexOf('PITCH_POLL_MS);', at));
  const detect = effect.indexOf('detectPeakHz(');
  assert.ok(detect > 0, 'the poll is found');
  const before = effect.slice(0, detect);
  assert.match(before, /frameIsLive\(ApeDsp\.getMeterFrame\(\)\)/, 'liveness is checked in the poll itself');
  assert.match(effect, /live \? detectPeakHz\(/, 'a stalled capture contributes no detection');
});
