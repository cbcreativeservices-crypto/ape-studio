/**
 * Toddler + cat — day pass 1, 2026-09-30 (audio tools area).
 *
 *  1. calibrationStore: an out-of-range offset saved before the stepper clamp
 *     shipped hydrates as UNCALIBRATED (it pinned every SPL reading to 0 dB);
 *  2. Tools hub: a tile's 90 ms beat is cleared on unmount, and the hub's other
 *     doors share the tiles' one-open latch;
 *  3. GlassTile: one activation per navigation across ALL tiles;
 *  4. Signal Generator: the transport follows the engine when it stops itself;
 *  5. MultiMeter: SMART DETECTION answers to `captureLive`;
 *  6. CenterLock RepeatKey: a hold that repeated does not add a step on release;
 *  7. RT60 axis labels render at ≥ 9 pt;
 *  8. Measurement Library: one image share at a time.
 *
 * (1) drives the real store with a fake AsyncStorage; the rest are source pins
 * (RN screens cannot be imported under node).
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const AS_URL = 'ape-test:async-storage-cal';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: AS_URL, shortCircuit: true };
    // The store is on the shared safe store (2026-10-02, wave 2), which Metro
    // imports extensionless: resolve `./x` to `./x.ts` under node.
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === AS_URL) {
      return { format: 'module', shortCircuit: true, source: 'export default globalThis.__calAsyncStorage;' };
    }
    return next(url, context);
  },
});

const disk = new Map<string, string>();
declare global {
  // eslint-disable-next-line no-var
  var __calAsyncStorage: unknown;
}
globalThis.__calAsyncStorage = {
  async getItem(k: string) {
    return disk.has(k) ? disk.get(k)! : null;
  },
  async setItem(k: string, v: string) {
    disk.set(k, v);
  },
  async removeItem(k: string) {
    disk.delete(k);
  },
};

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

test('1 — a pre-clamp negative calibration hydrates as uncalibrated', async () => {
  disk.set('ape:splCalOffset', JSON.stringify({ offsetDb: -25, setAt: '2026-09-29T00:00:00.000Z' }));
  const store = await import(`../src/features/tools/measure/calibrationStore.ts?neg`);
  store.getSplCalibration();
  await flush();
  assert.equal(store.getSplCalibration(), null, 'an offset outside 0–200 dB must not be applied');
});

test('1b — an in-range calibration still hydrates', async () => {
  disk.set('ape:splCalOffset', JSON.stringify({ offsetDb: 96.5, setAt: '2026-09-29T00:00:00.000Z' }));
  const store = await import(`../src/features/tools/measure/calibrationStore.ts?ok`);
  store.getSplCalibration();
  await flush();
  assert.equal(store.getSplCalibration()?.offsetDb, 96.5);
});

test('2 — hub: tile beat cleared on unmount; other doors share the latch', () => {
  const src = read('screens/tools/ToolsHubScreen.tsx');
  const tile = src.slice(src.indexOf('const busy = useRef(false);'), src.indexOf('const translateY = sink.interpolate'));
  assert.match(tile, /useEffect\(\(\) => \(\) => \{\s*if \(beat\.current\) clearTimeout\(beat\.current\);/);
  assert.match(tile, /beat\.current = setTimeout\(\(\) => \{\s*beat\.current = null;/);
  assert.match(src, /const openOnce = useCallback\(\(go: \(\) => void\) => \{/);
  assert.match(src, /onOpen=\{\(\) => openOnce\(\(\) => navigation\.navigate\('ExposureMonitor'\)\)\}/);
  assert.match(src, /openOnce\(\(\) => \(isMember \? navigation\.navigate\('ToolLibrary'/);
  assert.match(src, /openOnce\(\(\) =>\s*isMember\s*\? navigation\.navigate\('ConceptModule'/);
});

test('3 — GlassTile: one activation across every tile', () => {
  const src = read('screens/tools/GlassTile.tsx');
  assert.match(src, /^let lastActivateAt = -Infinity;/m, 'the latch must be module-level, not per tile');
  const act = src.slice(src.indexOf('const activate = () => {'), src.indexOf('const translateY'));
  assert.match(act, /if \(now - lastActivateAt < ACTIVATE_LATCH_MS\) return;\s*lastActivateAt = now;\s*busy\.current = true;/);
});

test('4 — Signal Generator transport follows a native stop', () => {
  const src = read('screens/tools/SignalGenScreen.tsx');
  const poll = src.slice(src.indexOf('if (!running) return;'), src.indexOf('}, STATUS_POLL_MS);'));
  assert.match(poll, /const s = ApeDsp\.genStatus\(\);/);
  assert.match(poll, /if \(s && !s\.running\) \{\s*setRunning\(false\);\s*return;\s*\}/);
  assert.ok(poll.indexOf('setRunning(false)') < poll.indexOf('noteAudioActivity()'), 'a stopped tone must not keep the output idle timer alive');
});

test('5 — MultiMeter SMART DETECTION is blank without a live capture', () => {
  const src = read('screens/tools/MultiMeterScreen.tsx');
  assert.match(src, /\{!captureLive \|\| chips\.length === 0 \? \(/);
});

test('6 — CenterLock RepeatKey: no extra step after a repeating hold', () => {
  const src = read('screens/tools/CenterLockTuner.tsx');
  const fn = src.slice(src.indexOf('function RepeatKey('), src.indexOf('function ChipRow('));
  assert.match(fn, /onPress=\{\(\) => \{\s*if \(repeated\.current\) \{\s*repeated\.current = false;\s*return;/);
  assert.match(fn, /repeated\.current = true;\s*onStep\(\);/);
});

test('7 — RT60 axis labels are at least 9 pt', () => {
  const src = read('screens/tools/Rt60Screen.tsx');
  assert.doesNotMatch(src, /fontSize=\{8\}/);
  const m = src.match(/const TICK_FONT = ([\d.]+);/);
  assert.ok(m, 'TICK_FONT constant');
  // The plot renders at ≥ ×0.956 (360-wide phone: 306 pt of a 320-unit viewBox).
  assert.ok(Number(m![1]) * (306 / 320) >= 9, 'axis text must clear 9 pt on a 360-wide phone');
});

test('9 — EngineGate: iOS denied retries on return to the app, focused only', () => {
  const src = read('screens/tools/EngineGate.tsx');
  assert.match(src, /const retryOnReturn = Platform\.OS === 'ios' && state === 'denied' && !!onRetry;/);
  assert.match(src, /if \(navRef\.current && !navRef\.current\.isFocused\(\)\) return;/);
  // Hooks run before the early return (rules of hooks).
  assert.ok(src.indexOf('useEffect(() => {\n    if (!retryOnReturn)') < src.indexOf("if (state === 'idle' || state === 'starting' || state === 'running') return null;"));
});

test('10 — Waveform shows ONE retry key on error', () => {
  const src = read('screens/tools/WaveformScreen.tsx');
  assert.doesNotMatch(src, /label="TRY AGAIN"/);
  // noSignal (iPad pass 2026-10-07) is the same single card, not a second key.
  assert.match(src, /<EngineGate state=\{state\} lastError=\{lastError\} onRetry=\{start\}(?: noSignal=\{noSignal\})? \/>/);
});

test('8 — Measurement Library: one image share at a time', () => {
  const src = read('screens/tools/MeasurementLibraryScreen.tsx');
  const share = src.slice(src.indexOf('const onRowShare = useCallback'), src.indexOf('// Bulk actions over the current selection.'));
  assert.match(share, /if \(shareBusyRef\.current\) return;/);
  assert.match(share, /if \(!m \|\| capturingRef\.current\) return;/);
  assert.match(share, /finally \{\s*capturingRef\.current = false;\s*shareBusyRef\.current = false;/);
});
