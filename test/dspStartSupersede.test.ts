/**
 * A superseded engine start must not kill the mic a NEWER start owns
 * (bug hunt 2026-09-29, T1).
 *
 * The defect: STOP → START (or a double START) while the HAL was still opening.
 * Both starts awaited the same in-flight acquireMic(); the stale one saw its
 * generation had moved and called releaseMic(), arming the 1.5 s debounce AFTER
 * the newer start's acquire had cancelled the previous timer. The newer start
 * set 'running', then doStop() fired — the UI said ON over a dead mic.
 *
 * This drives the REAL micSession (native module + output store stubbed) through
 * the same continuation useDspEngine runs, with fake timers, so the debounce is
 * exercised exactly as on device.
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

type Fake = {
  starts: number;
  stops: number;
  pendingStart: (() => void) | null;
  capturing: boolean;
};
const fake: Fake = { starts: 0, stops: 0, pendingStart: null, capturing: false };
declare global {
  // eslint-disable-next-line no-var
  var __apeDsp: unknown;
}
globalThis.__apeDsp = {
  setEngineConfig() {},
  start() {
    fake.starts++;
    return new Promise<void>((r) => {
      fake.pendingStart = () => {
        fake.capturing = true;
        r();
      };
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

const { acquireMic, releaseMic, releaseMicNow, isMicOpen } = await import('../src/features/tools/engine/micSession.ts');
const { releaseOnSupersede } = await import('../src/features/tools/engine/startSupersede.ts');

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

/** The useDspEngine start/stop continuation, minus React. */
function makeEngine(useFix: boolean) {
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
      await acquireMic({} as never);
      if (my !== gen) {
        if (!useFix || releaseOnSupersede(my, latest)) releaseMic();
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

function reset() {
  releaseMicNow();
  fake.starts = 0;
  fake.stops = 0;
  fake.pendingStart = null;
  fake.capturing = false;
}

test('releaseOnSupersede: release only when no newer start owns the stream', () => {
  assert.equal(releaseOnSupersede(1, 1), true, 'superseded by a stop — hand it back');
  assert.equal(releaseOnSupersede(1, 3), false, 'a newer start owns it — leave it');
});

test('STOP → START while the HAL is opening leaves a LIVE mic under a running screen', async () => {
  reset();
  const eng = makeEngine(true);
  const a = eng.start();
  eng.stop();
  const b = eng.start();
  await flush();
  fake.pendingStart!();
  await Promise.all([a, b]);
  await flush();
  assert.equal(eng.state, 'running');
  mock.timers.tick(5000);
  await flush();
  assert.equal(isMicOpen(), true, 'the debounce must not fire doStop() under the running screen');
  assert.equal(fake.stops, 0);
});

test('STOP → START → STOP → START also survives', async () => {
  reset();
  const eng = makeEngine(true);
  const a = eng.start();
  eng.stop();
  const b = eng.start();
  eng.stop();
  const c = eng.start();
  await flush();
  fake.pendingStart!();
  await Promise.all([a, b, c]);
  await flush();
  mock.timers.tick(5000);
  await flush();
  assert.equal(eng.state, 'running');
  assert.equal(isMicOpen(), true);
});

test('control: the pre-fix continuation DOES kill the mic (the bug is real)', async () => {
  reset();
  const eng = makeEngine(false);
  const a = eng.start();
  eng.stop();
  const b = eng.start();
  await flush();
  fake.pendingStart!();
  await Promise.all([a, b]);
  await flush();
  assert.equal(eng.state, 'running');
  mock.timers.tick(5000);
  await flush();
  assert.equal(isMicOpen(), false, 'UI says running over a dead mic');
});

test('a start superseded ONLY by a stop still hands the stream back', async () => {
  reset();
  const eng = makeEngine(true);
  const a = eng.start();
  eng.stop();
  await flush();
  fake.pendingStart!();
  await a;
  await flush();
  mock.timers.tick(5000);
  await flush();
  assert.equal(isMicOpen(), false, 'nobody owns it — it must close');
});

test('useDspEngine wires the guard and joins an in-flight start', () => {
  const src = readFileSync(new URL('../src/features/tools/engine/useDspEngine.ts', import.meta.url), 'utf8');
  assert.match(src, /if \(releaseOnSupersede\(gen, latestStartRef\.current\)\) releaseMic\(\);/);
  assert.match(src, /if \(pending && pending\.gen === genRef\.current\) return pending\.promise;/);
});
