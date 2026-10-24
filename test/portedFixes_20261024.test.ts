/**
 * Receipt for two never-merged JS fixes ported into the final store build
 * (owner approved 2026-10-24):
 *
 *  1. ADVANCED TUNER SOAK-FREEZE (orig. 43d6c06e, 2026-09-13): the tuner-frame
 *     store quantizes confidence (0.01) and levelDb (1 dB) before its publish
 *     dedup, and the tuner-mode subtree freezes while a fullscreen overlay
 *     (CenterLock / VU) covers it. The overlays render at the screen root and
 *     read the store, so they keep updating every frame.
 *  2. TOOL-DEMO FIELD NOTE ITALIC (orig. 47e64195, 2026-09-13): Android draws
 *     fontStyle:'italic' on a custom font UPRIGHT, so the FIELD NOTE used the
 *     true Barlow italic face from the installed @expo-google-fonts/barlow,
 *     preloaded with the other fonts — identical on iOS and Android.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  publishTunerFrame,
  readTunerFrame,
} from '../src/features/tools/tuner/tunerFrameStore.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ── 1. Tuner soak-freeze ─────────────────────────────────────────────────────

test('store: sub-0.01 confidence and sub-dB level jitter no longer republish', () => {
  const base = { freq: null, accepted: false, a4: 440 };
  publishTunerFrame({ ...base, confidence: 0.1234, levelDb: -71.2 });
  const first = readTunerFrame();
  assert.equal(first.confidence, 0.12);
  assert.equal(first.levelDb, -71);
  // Noise-floor jitter inside the quantum: same object, no emit.
  publishTunerFrame({ ...base, confidence: 0.1201, levelDb: -70.9 });
  assert.equal(readTunerFrame(), first);
  publishTunerFrame({ ...base, confidence: 0.1249, levelDb: -71.4 });
  assert.equal(readTunerFrame(), first);
  // A real change still publishes.
  publishTunerFrame({ ...base, confidence: 0.2, levelDb: -71 });
  assert.notEqual(readTunerFrame(), first);
  publishTunerFrame({ ...base, freq: 110, accepted: true, confidence: 0.2, levelDb: -71 });
  assert.equal(readTunerFrame().freq, 110);
});

test('store: CenterLock SIGNAL percent is unchanged by the 0.01 quantum', () => {
  const pct = (c: number) => Math.round(Math.max(0, Math.min(1, c)) * 100);
  for (let i = -20; i <= 1020; i++) {
    const raw = i / 1000 + 0.00037;
    const q = Math.round(raw * 100) / 100;
    assert.equal(pct(q), pct(raw), `confidence ${raw}`);
  }
});

test('store: the accept thresholds read the RAW engine frame, never the store', () => {
  const src = read('src/screens/tools/FrequencyCounterScreen.tsx');
  assert.match(src, /const PITCH_CONF_MIN = 0\.5;/);
  assert.match(src, /const PITCH_LOW_SIGNAL_DB = -60;/);
  assert.doesNotMatch(src, /useTunerFrame|readTunerFrame/);
  const store = read('src/features/tools/tuner/tunerFrameStore.ts');
  assert.match(store, /const confidence = Math\.round\(frame\.confidence \* 100\) \/ 100;/);
  assert.match(store, /const levelDb = Math\.round\(frame\.levelDb\);/);
  assert.match(store, /state = \{ \.\.\.state, frame: \{ \.\.\.frame, confidence, levelDb \} \};/);
  // No store reader renders levelDb.
  for (const f of ['src/screens/tools/CenterLockTuner.tsx', 'src/screens/tools/SkinnedTunerVu.tsx']) {
    assert.doesNotMatch(read(f), /levelDb/, f);
  }
});

test('screen: the tuner-mode subtree freezes while an overlay covers it; overlays stay at the root', () => {
  const src = read('src/screens/tools/FrequencyCounterScreen.tsx');
  assert.match(
    src,
    /function FrozenWhileCovered\(\{ frozen, children \}: \{ frozen: boolean; children: ReactElement \}\) \{\n  const last = useRef\(children\);\n  if \(!frozen\) last\.current = children;\n  return last\.current;\n\}/,
  );
  const mode = src.slice(src.indexOf('function LivePitchMode('), src.indexOf('function ModeSelect('));
  // Both hooks run on every render (no short-circuited hook call).
  assert.match(mode, /const centerLockCovering = useCenterLockOpen\(\);\n  const vuCovering = useVuTunerOpen\(\);\n  const coveredByOverlay = centerLockCovering \|\| vuCovering;/);
  assert.doesNotMatch(mode, /useCenterLockOpen\(\) \|\|/);
  assert.match(mode, /return \(\n    <FrozenWhileCovered frozen=\{coveredByOverlay\}>\n    <>/);
  assert.match(mode, /<\/>\n    <\/FrozenWhileCovered>\n  \);\n\}\n*$/);
  // The publish that feeds the overlays lives in the mode body, outside the
  // frozen element, so it keeps running while covered.
  assert.ok(mode.indexOf('publishTunerFrame({') < mode.indexOf('<FrozenWhileCovered'));
  // The overlays are NOT inside the frozen tree.
  assert.doesNotMatch(mode, /<CenterLockTuner|<VuTunerFullScreen/);
  assert.match(src, /\{centerLockOpen \? <CenterLockTuner \/> : null\}/);
  assert.match(src, /\{vuTunerOpen \? <VuTunerFullScreen \/> : null\}/);
});

// ── 2. Tool-demo FIELD NOTE italic ───────────────────────────────────────────

test('fonts: the true Barlow italic face is a token and preloaded with the others', () => {
  const tokens = read('src/theme/tokens.ts');
  assert.match(tokens, /barlowItalic: 'Barlow_400Regular_Italic',/);
  assert.match(
    tokens,
    /Barlow_400Regular_Italic: require\('@expo-google-fonts\/barlow\/400Regular_Italic\/Barlow_400Regular_Italic\.ttf'\),/,
  );
  const assets = tokens.slice(tokens.indexOf('export const fontAssets'));
  assert.ok(assets.includes('Barlow_400Regular_Italic:'), 'inside fontAssets (useFonts in App.tsx)');
  assert.ok(
    existsSync(new URL('../node_modules/@expo-google-fonts/barlow/400Regular_Italic/Barlow_400Regular_Italic.ttf', import.meta.url)),
    'face ships in the already-installed package (no new dependency)',
  );
  assert.match(read('App.tsx'), /useFonts\(fontAssets\)/);
});

test('demos: every field note uses the italic face; no fontStyle italic left in the demos', () => {
  const dir = new URL('../src/components/tooldemos/', import.meta.url);
  const demos = readdirSync(dir).filter((f) => f.endsWith('Demo.tsx'));
  for (const name of ['Rt60Demo.tsx', 'SignalGenDemo.tsx', 'HzCounterDemo.tsx', 'RtaDemo.tsx', 'SpectrogramDemo.tsx', 'SplDemo.tsx', 'WaveformDemo.tsx']) {
    assert.ok(demos.includes(name), name);
  }
  for (const f of demos) {
    const src = read(`src/components/tooldemos/${f}`);
    assert.doesNotMatch(src, /fontStyle:\s*'italic'/, `${f}: Android draws this upright on Barlow`);
    const m = src.match(/fieldNote: \{[^}]*\}/);
    assert.ok(m, `${f} has a fieldNote style`);
    assert.match(m![0], /fontFamily: fonts\.barlowItalic/, f);
  }
});
