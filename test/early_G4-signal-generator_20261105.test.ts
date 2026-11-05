/**
 * Signal Generator S3 (2026-11-05): a single-pass sweep must END on screen.
 *
 * Generator.hpp returns 0.0 past the end of a non-repeat sweep and keeps
 * running, so status.running stays true, the 2 Hz poll sees nothing, and the
 * key kept reading STOP over silence with no word that the sweep had finished.
 * Native code is not changing, so the screen counts the pass itself.
 *
 * Driven for real: SignalGenScreen.tsx is transpiled with the repo's TypeScript
 * and run on a tiny hooks runtime with mocked timers. The dock params and chips
 * the screen hands RackUnit are pressed exactly as the dock would press them.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

type El = { type: unknown; props: Record<string, any> };
type Effect = { deps?: unknown[]; cleanup?: void | (() => void) };
const rt = {
  slots: [] as unknown[],
  effects: [] as Effect[],
  pending: [] as (() => void)[],
  i: 0,
  e: 0,
  rendering: false,
  dirty: false,
  rerender: () => {},
};
const dsp = { stops: 0, starts: 0, running: false };
const g = globalThis as Record<string, unknown>;
g.__G4_RT__ = rt;
g.__G4_DSP__ = dsp;
g.__DEV__ = false;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const REACT = mod(`
  const rt = globalThis.__G4_RT__;
  export function useState(init) {
    const i = rt.i++;
    if (!(i in rt.slots)) rt.slots[i] = typeof init === 'function' ? init() : init;
    return [rt.slots[i], (v) => { const n = typeof v === 'function' ? v(rt.slots[i]) : v; if (n !== rt.slots[i]) { rt.slots[i] = n; rt.rerender(); } }];
  }
  export function useRef(init) { const i = rt.i++; if (!(i in rt.slots)) rt.slots[i] = { current: init }; return rt.slots[i]; }
  export function useMemo(fn) { rt.i++; return fn(); }
  export function useEffect(fn, deps) {
    const e = rt.e++;
    const prev = rt.effects[e];
    const changed = !prev || !deps || !prev.deps || deps.some((d, k) => !Object.is(d, prev.deps[k]));
    if (!changed) return;
    rt.pending.push(() => {
      if (prev && typeof prev.cleanup === 'function') prev.cleanup();
      rt.effects[e] = { deps, cleanup: fn() };
    });
  }
  export default { useState, useRef, useMemo, useEffect };`);
const JSX = mod(`
  export const jsx = (type, props) => ({ type, props });
  export const jsxs = jsx;
  export const Fragment = 'F';`);
const name = (n: string) => `export const ${n} = '${n}';`;
const STUBS: Record<string, string> = {
  react: REACT,
  'react/jsx-runtime': JSX,
  'react-native': mod(`${name('Pressable')}${name('Text')}${name('View')} export const StyleSheet = { create: (s) => s };`),
  'react-native-safe-area-context': mod(`export const useSafeAreaInsets = () => ({ top: 0, bottom: 0 });`),
  'react-native-svg': mod(`${['Defs', 'Line', 'LinearGradient', 'Path', 'Stop'].map(name).join('')} export default 'Svg';`),
  '../../components/backHitSlop': mod(`export const BACK_HIT_SLOP = 0;`),
  '../../../modules/ape-dsp': mod(`
    const d = globalThis.__G4_DSP__;
    const status = () => ({ running: d.running, capUnlocked: false, effectiveLevelDb: -20, defaultLevelDb: -20, capDb: -12 });
    export const AUDIO_UNAVAILABLE_MESSAGE = 'x';
    export const GEN_MODES = { sine: 1, sweepLin: 2, sweepLog: 3 };
    export const ApeDsp = {
      isAvailable: () => true,
      engineVersion: () => 2,
      getInfo: () => null,
      genStatus: status,
      genSet: () => {},
      genRelockCap: () => {},
      genUnlockCap: () => {},
      genStart: async () => { d.starts++; d.running = true; return status(); },
      genStop: async () => { d.stops++; d.running = false; },
    };`),
  '../../features/audio/AudioOutputGate': mod(`export const useAudioOutputGate = () => ({ requestAudioOutput: async () => true });`),
  '../../features/audio/levelHearingWarning': mod(`export const playWithHearingWarning = (go) => go();`),
  '../../features/audio/audioOutputStore': mod(`export const noteAudioActivity = () => {};`),
  '../../features/audio/startFenced': mod(`export const startFenced = async ({ start }) => ({ status: 'started', value: await start() });`),
  './EngineGate': mod(name('EngineGate')),
  '../../features/tools/levelColor': mod(`export const MIDLINE_BLUE = ''; export const WAVE_LEVEL_STOPS = []; export const levelColorForDb = () => '';`),
  '../../features/tools/genCapSession': mod(`export const isGenCapUnlockedThisSession = () => false; export const markGenCapUnlockedThisSession = () => {};`),
  '../../features/tools/colorModePref': mod(`export const useColorModePref = () => [true, () => {}];`),
  '../../theme/tokens': mod(`export const BACK_GLYPH_MAX_SCALE = 1; export const colors = {}; export const fonts = {};`),
  '../../lib/confirm': mod(`export const confirmDialog = () => {};`),
  '../../components/AccuracyNote': mod(name('AccuracyNote')),
  './toolsData': mod(`export const toolByKey = () => ({ name: 'Signal Generator' });`),
  '../../features/lab/guidedLessons': mod(`export const useToolHelp = () => ({ help() {}, helpAll() {}, sheet: null }); ${name('HelpHead')}`),
  '../lab/rack/RackUnit': mod(name('RackUnit')),
  '../../features/audio/useStopWhenSilenced': mod(`export const useStopWhenSilenced = () => {};`),
  '../../features/audio/useStopOnBlur': mod(`export const useStopOnClose = () => {};`),
  '../../lib/safeGoBack': mod(`export const safeGoBack = () => {};`),
  '../../features/lab/sliderMaps': mod(`export const scopeCyclesFor = () => 1; export const sineScopeCycles = () => 1;`),
};

const SRC_URL = new URL('../src/screens/tools/SignalGenScreen.tsx', import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((context.parentURL === SRC_URL || context.parentURL?.startsWith('data:')) && specifier in STUBS) {
      return { url: STUBS[specifier], shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === SRC_URL) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { SignalGenScreen } = (await import(SRC_URL)) as { SignalGenScreen: (p: { navigation: unknown }) => El };

let tree: El;
function render() {
  if (rt.rendering) {
    rt.dirty = true;
    return;
  }
  rt.rendering = true;
  do {
    rt.dirty = false;
    rt.i = 0;
    rt.e = 0;
    tree = SignalGenScreen({ navigation: {} });
    const run = rt.pending;
    rt.pending = [];
    for (const f of run) f();
  } while (rt.dirty || rt.pending.length);
  rt.rendering = false;
}
rt.rerender = render;

function unmount() {
  for (const e of rt.effects) if (e && typeof e.cleanup === 'function') e.cleanup();
  rt.effects = [];
}

const walk = (n: unknown, seen: (e: El) => void) => {
  if (Array.isArray(n)) return n.forEach((c) => walk(c, seen));
  if (n && typeof n === 'object' && 'props' in n) {
    seen(n as El);
    walk((n as El).props.children, seen);
  }
};
function rackParams(): any[] {
  let out: any[] = [];
  walk(tree, (e) => {
    if (e.type === 'RackUnit') out = e.props.params;
  });
  return out;
}
const param = (id: string) => rackParams().find((p) => p.id === id);
const textOf = (n: unknown): string =>
  typeof n === 'string' ? n : Array.isArray(n) ? n.map(textOf).join('') : n && typeof n === 'object' && 'props' in n ? textOf((n as El).props.children) : '';
const showsFinished = () => /Sweep finished/.test(textOf(tree));
const keyLabel = () => param('run').label;

const settle = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const wait = async (ms: number) => {
  mock.timers.tick(ms);
  await settle();
};
const pressKey = async () => {
  param('run').onToggle();
  await settle();
};
const pickSignal = async (id: string) => {
  param('signal').onSelect(id);
  await settle();
};
/** Taps a chip in the SWEEP tray, by its label (10s, 20, REPEAT…). */
const tapSweepChip = async (label: string) => {
  let chip: El | undefined;
  walk(param('sweep').render(), (e) => {
    if (e.props.label === label) chip = e;
  });
  assert.ok(chip, `no ${label} chip in the sweep tray`);
  chip.props.onPress();
  await settle();
};

const SEC = 1000;

describe('Signal Generator: a single-pass sweep ends on screen', () => {
  beforeEach(async () => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
    rt.slots = [];
    rt.effects = [];
    dsp.stops = 0;
    dsp.starts = 0;
    dsp.running = false;
    render();
    await pickSignal('sweepLog');
  });
  afterEach(() => {
    unmount();
    mock.timers.reset();
  });

  for (const signal of ['sweepLin', 'sweepLog']) {
    it(`${signal}: holds STOP for the whole pass, then the key reads START and the line appears`, async () => {
      await pickSignal(signal);
      await pressKey();
      assert.equal(keyLabel(), 'STOP');
      await wait(10 * SEC - 1);
      assert.equal(keyLabel(), 'STOP');
      assert.equal(dsp.stops, 0, 'a pass still sounding must not be stopped');
      assert.equal(showsFinished(), false);
      await wait(1);
      assert.equal(keyLabel(), 'START');
      assert.equal(dsp.stops, 1, 'the end goes through the normal stop path');
      assert.equal(showsFinished(), true);
    });
  }

  it('the pass length is the chosen duration', async () => {
    await tapSweepChip('5s');
    await pressKey();
    await wait(5 * SEC);
    assert.equal(keyLabel(), 'START');
  });

  it('a stopped-and-restarted sweep counts a full pass again and clears the line', async () => {
    await pressKey();
    await wait(10 * SEC);
    assert.equal(showsFinished(), true);
    await pressKey();
    assert.equal(showsFinished(), false);
    assert.equal(keyLabel(), 'STOP');
    await wait(10 * SEC - 1);
    assert.equal(keyLabel(), 'STOP');
    await wait(1);
    assert.equal(keyLabel(), 'START');
    assert.equal(dsp.starts, 2);
  });

  it('a manual STOP drops the count and never says finished', async () => {
    await pressKey();
    await wait(4 * SEC);
    await pressKey();
    assert.equal(keyLabel(), 'START');
    assert.equal(dsp.stops, 1);
    await wait(30 * SEC);
    assert.equal(dsp.stops, 1, 'the dropped timer must not stop anything later');
    assert.equal(showsFinished(), false);
    await pressKey();
    await wait(7 * SEC);
    assert.equal(keyLabel(), 'STOP', 'the 4 s from the stopped run must not carry over');
  });

  it('REPEAT never ends', async () => {
    await tapSweepChip('REPEAT');
    await pressKey();
    await wait(120 * SEC);
    assert.equal(keyLabel(), 'STOP');
    assert.equal(dsp.stops, 0);
    assert.equal(showsFinished(), false);
  });

  it('turning REPEAT on mid-run cancels the stop; turning it off counts a full pass from there', async () => {
    await pressKey();
    await wait(6 * SEC);
    await tapSweepChip('REPEAT');
    await wait(60 * SEC);
    assert.equal(keyLabel(), 'STOP');
    assert.equal(dsp.stops, 0);
    await tapSweepChip('REPEAT');
    await wait(10 * SEC - 1);
    assert.equal(keyLabel(), 'STOP');
    await wait(1);
    assert.equal(keyLabel(), 'START');
    assert.equal(showsFinished(), true);
  });

  it('any reprogram restarts the count, even a tap on the chip already selected', async () => {
    await pressKey();
    await wait(6 * SEC);
    await tapSweepChip('10s'); // already selected: the native sweep still restarts
    await wait(10 * SEC - 1);
    assert.equal(keyLabel(), 'STOP', 'the restarted pass must not be cut off by the old timer');
    await wait(1);
    assert.equal(keyLabel(), 'START');
  });

  it('a new start or end point restarts the count', async () => {
    await pressKey();
    await wait(6 * SEC);
    await tapSweepChip('100');
    await wait(9 * SEC);
    assert.equal(keyLabel(), 'STOP');
    await wait(1 * SEC);
    assert.equal(keyLabel(), 'START');
  });

  it('a new duration mid-run counts the new length', async () => {
    await pressKey();
    await wait(1 * SEC);
    await tapSweepChip('30s');
    await wait(29 * SEC);
    assert.equal(keyLabel(), 'STOP');
    await wait(1 * SEC);
    assert.equal(keyLabel(), 'START');
  });

  it('a chip tap after the end clears "Sweep finished"', async () => {
    await pressKey();
    await wait(10 * SEC);
    assert.equal(showsFinished(), true);
    await tapSweepChip('5s');
    assert.equal(showsFinished(), false);
  });

  it('a mode change clears the count: a sine never ends', async () => {
    await pressKey();
    await wait(6 * SEC);
    await pickSignal('sine');
    await wait(120 * SEC);
    assert.equal(keyLabel(), 'STOP');
    assert.equal(dsp.stops, 0);
    assert.equal(showsFinished(), false);
  });

  it('a change from one sweep to the other restarts the pass', async () => {
    await pressKey();
    await wait(6 * SEC);
    await pickSignal('sweepLin');
    await wait(10 * SEC - 1);
    assert.equal(keyLabel(), 'STOP');
    await wait(1);
    assert.equal(keyLabel(), 'START');
  });

  it('a sine started in sine, moved to a sweep mid-run, ends one pass later', async () => {
    await pickSignal('sine');
    await pressKey();
    await wait(30 * SEC);
    await pickSignal('sweepLog');
    await wait(10 * SEC);
    assert.equal(keyLabel(), 'START');
    assert.equal(showsFinished(), true);
  });

  it('leaving the screen clears the timer', async () => {
    await pressKey();
    await wait(4 * SEC);
    unmount();
    const stops = dsp.stops;
    await wait(30 * SEC);
    assert.equal(dsp.stops, stops, 'nothing may fire behind a closed screen');
    assert.equal(showsFinished(), false);
  });

  it('an engine that stopped by itself drops the count without claiming a finished sweep', async () => {
    await pressKey();
    await wait(1 * SEC);
    dsp.running = false; // route teardown, session interruption
    await wait(1 * SEC);
    assert.equal(keyLabel(), 'START');
    await wait(30 * SEC);
    assert.equal(showsFinished(), false);
    assert.equal(dsp.stops, 0);
  });
});

describe('what the count relies on in the engine', () => {
  const core = readFileSync(new URL('../modules/ape-dsp/ios/core/Generator.hpp', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  it('every sweep and mode write retriggers the sweep from zero', () => {
    assert.match(core, /void setSweep\([\s\S]{0,420}?retrigger_\.store\(true\);/);
    assert.match(core, /void setMode\(GenMode m\) \{[\s\S]{0,120}?retrigger_\.store\(true\);/);
    assert.match(core, /modeCur_ = m;\s*sweepPhase01_ = 0\.0;/);
  });
});
