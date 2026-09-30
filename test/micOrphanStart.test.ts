/**
 * An ORPHANED mic start must not kill the stream a later acquire opens
 * (tools pass 2026-09-30).
 *
 * Android: a tool is cold-opening the HAL (5–10 s); Home → releaseMicNow()
 * disowns that start; back within the window → a NEW acquire. The old code
 * started the HAL a second time at once; the orphan's late `ApeDsp.stop()`
 * then landed after it and killed the new stream, while micSession flagged it
 * 'open' — a tool reading RUNNING over a dead mic. The fix makes the new
 * acquire wait for the orphan to close its stream first.
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { mock, test } from 'node:test';

const DSP_URL = 'ape-test:ape-dsp';
const OUT_URL = 'ape-test:audio-output-store';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('modules/ape-dsp')) return { url: DSP_URL, shortCircuit: true };
    if (specifier.endsWith('audio/audioOutputStore')) return { url: OUT_URL, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === DSP_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export const ApeDsp = globalThis.__apeDsp;',
      };
    }
    if (url === OUT_URL) {
      return { format: 'module', shortCircuit: true, source: 'export function setMicActive() {}' };
    }
    return next(url, context);
  },
});

type Fake = { starts: number; stops: number; pending: (() => void)[]; capturing: boolean };
const fake: Fake = { starts: 0, stops: 0, pending: [], capturing: false };
declare global {
  // eslint-disable-next-line no-var
  var __apeDsp: unknown;
}
globalThis.__apeDsp = {
  setEngineConfig() {},
  start() {
    fake.starts++;
    return new Promise<void>((r) => {
      fake.pending.push(() => {
        fake.capturing = true;
        r();
      });
    });
  },
  async stop() {
    fake.stops++;
    fake.capturing = false;
  },
  getMeterFrame() {
    return { running: fake.capturing, captureStalled: false };
  },
};

mock.timers.enable({ apis: ['setTimeout'] });

const { acquireMic, micAcquireSeq, releaseMic, releaseMicNow, isMicOpen } = await import('../src/features/tools/engine/micSession.ts');
const { releaseOnSupersede } = await import('../src/features/tools/engine/startSupersede.ts');

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};


test('an acquire after a disowned cold start ends with a LIVE stream', async () => {
  const cfg = {} as never;
  const first = acquireMic(cfg).catch(() => {});
  releaseMicNow(); // Home pressed mid cold-open
  const second = acquireMic(cfg); // back again inside the window
  await flush();
  assert.equal(fake.starts, 1, 'no second HAL open while the orphan is still opening');
  fake.pending.shift()!(); // the orphaned open completes…
  await flush();
  assert.equal(fake.capturing, false, '…and closes its own stream');
  assert.equal(fake.starts, 2, 'only then does the new acquire open the HAL');
  fake.pending.shift()!();
  await Promise.all([first, second]);
  await flush();
  assert.equal(isMicOpen(), true);
  assert.equal(fake.capturing, true, 'the mic the tool reads as running is actually capturing');
  releaseMicNow();
});

/** useDspEngine's start/stop continuation, minus React — one per SCREEN. */
function makeEngine() {
  let gen = 0;
  let latest = 0;
  let state: 'idle' | 'starting' | 'running' = 'idle';
  return {
    get state() {
      return state;
    },
    async start() {
      const my = ++gen;
      latest = my;
      state = 'starting';
      const acquiring = acquireMic({} as never);
      const mySeq = micAcquireSeq();
      await acquiring;
      if (my !== gen) {
        if (micAcquireSeq() !== mySeq) return;
        if (releaseOnSupersede(my, latest)) releaseMic();
        return;
      }
      state = 'running';
    },
    stop() {
      gen++;
      releaseMic();
      state = 'idle';
    },
  };
}

test('the hub handing its in-flight cold start to a tool does not kill the tool mic', async () => {
  const hub = makeEngine();
  const tool = makeEngine();
  const starts0 = fake.starts;
  const a = hub.start(); // first hub visit, cold open in flight
  hub.stop(); // tile tapped → stopForNavigation()
  const b = tool.start(); // the tool joins the same in-flight open
  await flush();
  assert.equal(fake.starts - starts0, 1, 'one shared HAL open');
  fake.pending.shift()!();
  await Promise.all([a, b]);
  await flush();
  assert.equal(tool.state, 'running');
  mock.timers.tick(5000);
  await flush();
  assert.equal(isMicOpen(), true, 'no late release from the hub under the running tool');
  assert.equal(fake.capturing, true);
  releaseMicNow();
});

test('a start superseded only by its own stop still hands the stream back', async () => {
  const hub = makeEngine();
  const a = hub.start();
  hub.stop();
  await flush();
  fake.pending.shift()!();
  await a;
  await flush();
  mock.timers.tick(5000);
  await flush();
  assert.equal(isMicOpen(), false, 'nobody owns it — it closes');
});
