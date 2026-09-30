/**
 * Toddler + cat — day pass 3, 2026-09-30 (audio tools area).
 *
 *  1. measurementStore: a hydrate already reading when the account wipe ran
 *     no longer lands afterwards (it put the PREVIOUS account's rows back);
 *  2. SPL meter: HOME ⇄ DIGITAL no longer re-announces every standing warning
 *     (haptic + 5 s flash each switch) — the seen list lives on the screen;
 *  3. hub previews: a stalled capture rests the minis instead of emitting the
 *     dead engine's last frame as live;
 *  4. Waveform: a user FREEZE survives auto-resume — only STOP's own freeze is
 *     released by START;
 *  5. Contribute-calibration prompt: one answer per prompt (NOT NOW during an
 *     in-flight CONTRIBUTE, or the reverse);
 *  6. Exposure monitor: one history export at a time;
 *  7. Measurement Library: one TEXT share at a time;
 *  8. COLORS / tool colour prefs: a choice made before the stored value loads
 *     is not overwritten by the late read.
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

const STUB_URL = 'ape-test-p3:async-storage';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: STUB_URL, shortCircuit: true };
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
    if (url === STUB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        // getItem reads NOW, then waits on the gate (if one is set) before
        // answering — a read that is already "on the wire" when a wipe runs.
        source: `
          const mem = new Map();
          globalThis.__p3Storage = mem;
          globalThis.__p3Gate = null;
          export default {
            async getItem(k) {
              const v = mem.has(k) ? mem.get(k) : null;
              if (globalThis.__p3Gate && k === 'ape:toolMeasurementRows') await globalThis.__p3Gate;
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
  var __p3Storage: Map<string, string>;
  // eslint-disable-next-line no-var
  var __p3Gate: Promise<void> | null;
}

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const tick = () => new Promise((r) => setTimeout(r, 0));

test('1 — a hydrate in flight across the account wipe does not bring the old rows back', async () => {
  const store = await import('../src/features/tools/measure/measurementStore.ts');
  const rec = {
    id: 'old-account',
    tool_type: 'spectrogram',
    created_at: '2026-09-30T00:00:00.000Z',
    title: 'Previous account',
    notes: '',
    input_device: 'Device microphone',
    calibration_status: 'uncalibrated',
    sample_rate: 48000,
    measurement_settings: {},
    quality_state: 'good',
    warning_flags: [],
    data_payload: { kind: 'spectrogram_snapshot', grid: [[1]] },
  };
  store.getMeasurements();
  await tick();
  await store.saveMeasurement(rec as never);
  store.resetLocal(); // cold cache, rows still on disk

  let release: () => void = () => {};
  globalThis.__p3Gate = new Promise<void>((r) => (release = r));
  store.getMeasurements(); // hydrate starts and reads the OLD rows…
  for (let i = 0; i < 6; i++) await tick();
  assert.ok(globalThis.__p3Storage.has('ape:toolMeasurementRows'), 'the old row is on disk while the read is held');
  await store.clearStoredMeasurements(); // …the account wipe runs meanwhile
  globalThis.__p3Gate = null;
  release();
  for (let i = 0; i < 6; i++) await tick();

  store.getMeasurements();
  for (let i = 0; i < 6; i++) await tick();
  assert.deepEqual(store.getMeasurements().map((m) => m.id), [], 'the wiped account’s record must not reappear');
});

test('2 — SPL: the warning list outlives the HOME ⇄ DIGITAL switch', () => {
  const src = read('screens/tools/SplMeterScreen.tsx');
  assert.match(src, /function LiveWarnings\(\{ flags, memory \}: \{ flags: WarningFlag\[\]; memory: \{ current: WarningFlag\[\] \} \}\)/);
  assert.match(src, /useState<WarningFlag\[\]>\(\(\) => memory\.current\)/);
  assert.match(src, /new Set\(memory\.current\)/);
  assert.match(src, /memory\.current = \[\.\.\.memory\.current, f\];/);
  assert.equal((src.match(/<LiveWarnings flags=\{flags\} memory=\{warnSeenRef\} \/>/g) ?? []).length, 2, 'both views share one list');
});

test('3 — hub previews rest on a stalled capture', () => {
  const src = read('screens/tools/hubPreviewEngine.ts');
  const tickBody = src.slice(src.indexOf('const id = setInterval(() => {'), src.indexOf('}, HUB_TICK_MS);'));
  assert.match(tickBody, /if \(stalled\) \{\s*cols = \[\];\s*if \(data !== EMPTY\) emit\(EMPTY\);\s*return;\s*\}/);
  assert.ok(tickBody.indexOf('if (stalled) {') > tickBody.indexOf('if (stalledTicks > 12)'), 'the watchdog still runs first');
  assert.ok(tickBody.indexOf('if (stalled) {') < tickBody.indexOf('emit({'), 'no live emit after a stalled verdict');
});

test('4 — Waveform: START releases only the freeze STOP pinned', () => {
  const src = read('screens/tools/WaveformScreen.tsx');
  const toggle = src.slice(src.indexOf('const toggleFreeze = useCallback'), src.indexOf('// micPaused (owner 2026-07-31)'));
  assert.match(toggle, /stopFrozeRef\.current = false;/);
  const stopFn = src.slice(src.indexOf('const onStop = useCallback'), src.indexOf('const onStart = useCallback'));
  assert.match(stopFn, /if \(frozenRef\.current == null\) \{\s*stopFrozeRef\.current = true;\s*setFrozen\(liveBuckets\);\s*\}/);
  const startFn = src.slice(src.indexOf('const onStart = useCallback'), src.indexOf('// Clear the paused flag ONLY'));
  assert.match(startFn, /if \(stopFrozeRef\.current\) \{\s*stopFrozeRef\.current = false;\s*setFrozen\(null\);\s*\}/);
  assert.doesNotMatch(startFn, /^\s*setFrozen\(null\);\s*void start\(\);/m, 'an unconditional release must not return');
});

test('5 — contribute prompt: the first answer wins', () => {
  const src = read('components/ContributeCalibrationPrompt.tsx');
  const decline = src.slice(src.indexOf('const decline = async () => {'), src.indexOf('return (\n'));
  assert.match(decline, /if \(sendingRef\.current\) return;\s*sendingRef\.current = true;/);
  assert.ok(decline.indexOf('sendingRef.current = true') < decline.indexOf('await setCrowdsourceConsent(false)'));
});

test('6 — exposure monitor: one export at a time', () => {
  const src = read('screens/tools/ExposureMonitorScreen.tsx');
  assert.match(src, /if \(exportingRef\.current\) return;\s*exportingRef\.current = true;/);
  assert.match(src, /\.finally\(\(\) => \{\s*exportingRef\.current = false;\s*\}\)/);
});

test('7 — measurement library: one text share at a time', () => {
  const src = read('screens/tools/MeasurementLibraryScreen.tsx');
  assert.match(src, /^let textShareBusy = false;/m);
  assert.match(src, /if \(ms\.length === 0 \|\| textShareBusy\) return;\s*textShareBusy = true;\s*try \{\s*await shareMeasurementsNow\(ms\);\s*\} finally \{\s*textShareBusy = false;/);
});

test('8 — a colour / COLORS choice beats the late stored read', () => {
  for (const f of ['features/tools/colorModePref.ts', 'features/tools/waveColorPref.ts']) {
    const src = read(f);
    assert.match(src, /const touched = useRef\(false\);/, f);
    assert.match(src, /if \(alive && !touched\.current && raw/, f);
    assert.match(src, /touched\.current = true;/, f);
    assert.match(src, /\.catch\(\(\) => \{\}\); \/\/ unreadable → keep the default/, f);
  }
});
