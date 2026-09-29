/**
 * Source guards for the lab SOUND audit of 2026-09-29 (owner: "make sure all
 * other labs with play sound are fixed as well with all our learned lessons").
 * The lessons came from the dead Bass ▶ (b2660894, da333188, 15b88be5). Each
 * test pins the SHAPE of one fix so a later edit cannot quietly undo it; the
 * reasoning lives in the comment beside each fix in the source.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');

/** Every .ts/.tsx file under src/, relative to the repo root. */
function srcFiles(dir = 'src'): string[] {
  const out: string[] = [];
  for (const name of readdirSync(new URL(dir, ROOT))) {
    const rel = join(dir, name).replace(/\\/g, '/');
    if (statSync(new URL(rel, ROOT)).isDirectory()) out.push(...srcFiles(rel));
    else if (/\.tsx?$/.test(name)) out.push(rel);
  }
  return out;
}

/** Comments out, so a doc block that QUOTES the bad pattern is not a hit. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

// ── Lesson 1: the self-cancelling start ──────────────────────────────────────

test('repo-wide: no effect cleanup stops sound AND re-runs when that stop changes identity', () => {
  // `useFocusEffect(useCallback(() => () => stop(), [stop]))` and its
  // useEffect twin run the CLEANUP whenever `stop` changes identity — the
  // render a start causes then cancels that start (the dead Bass ▶). Use
  // useStopOnBlur(stop), or a ref to the latest stop in a []-deps effect.
  const bad = /\(\)\s*=>\s*\(\)\s*=>\s*\{?\s*(?:void\s+)?(\w*(?:stop|Stop|pause|Pause|dispose|Dispose)\w*)\(\);?\s*\}?\s*,\s*\[[^\]]*\b\1\b[^\]]*\]/;
  const hits = srcFiles().filter((f) => bad.test(code(read(f))));
  assert.deepEqual(hits, []);
});

test('the guard regex itself catches both the one-line and the block form', () => {
  const bad = /\(\)\s*=>\s*\(\)\s*=>\s*\{?\s*(?:void\s+)?(\w*(?:stop|Stop|pause|Pause|dispose|Dispose)\w*)\(\);?\s*\}?\s*,\s*\[[^\]]*\b\1\b[^\]]*\]/;
  assert.match('useFocusEffect(useCallback(() => () => stop(), [stop]));', bad);
  assert.match('useEffect(() => () => stopTone(), [stopTone]);', bad);
  assert.match('useEffect(\n  () => () => {\n    stopNote();\n  },\n  [stopNote],\n);', bad);
  assert.doesNotMatch('useFocusEffect(useCallback(() => () => stopRef.current(), []));', bad);
});

test('modAnalog: the unmount stop is useStopOnBlur, not a [stop]-deps cleanup', () => {
  const s = read('src/screens/lab/digital/modules/modAnalog.tsx');
  assert.match(s, /useStopOnBlur\(stop\);/);
});

// ── Lesson 4: safety — a start re-checks the gate after its awaits ───────────

test('every native generator start re-checks the output gate after the start resolves', () => {
  for (const f of [
    'src/screens/lab/OscillatorLabScreen.tsx',
    'src/screens/lab/BinauralLabScreen.tsx',
    'src/screens/lab/FxLabScreen.tsx',
    'src/screens/lab/ModularLabScreen.tsx',
    'src/screens/lab/NoiseLabScreen.tsx',
    'src/screens/lab/SignalChainLabScreen.tsx',
    'src/screens/lab/BassLabScreen.tsx',
    'src/screens/lab/cymatics/useDriveTone.ts',
    'src/screens/lab/eq/modules/eqAudition.tsx',
    'src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx',
  ]) {
    const s = read(f);
    assert.match(s, /await ApeDsp\.(gen|bin|mod)Start\(\);\n(\s*\/\/[^\n]*\n)*\s*if \(\w+ !== \w+(\.current)? \|\| !isAudioOutputEnabled\(\)\) \{/, f);
  }
  const course = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
  assert.equal((course.match(/if \(gen !== genRef\.current \|\| !isAudioOutputEnabled\(\)\) \{/g) ?? []).length, 3, 'sine, additive and stereo starts');
  const hv = read('src/screens/lab/HarmonicsView.tsx');
  const start = hv.slice(hv.indexOf('const startTone = useCallback('), hv.indexOf('const stopTone = useCallback('));
  assert.ok(start.indexOf('if (!isAudioOutputEnabled()) {') > start.indexOf('await ApeDsp.genStart();'));
  assert.ok(start.indexOf('if (!isAudioOutputEnabled()) {') < start.indexOf('setGenRunning(true);'));
});

test('Cymatics drive tone follows a mute (useStopWhenSilenced), like every other lab tone', () => {
  const s = read('src/screens/lab/cymatics/useDriveTone.ts');
  assert.match(s, /useStopWhenSilenced\(running, stop\);/);
  assert.match(s, /useStopOnBlur\(stop\);/);
});

test('ear training and Tuning stop on BLUR, not only on unmount', () => {
  const ear = read('src/screens/lab/eartraining/EarModuleScreen.tsx');
  assert.match(ear, /useStopOnBlur\(\(\) => \{\n\s+playTokenRef\.current\+\+;\n\s+playerRef\.current\?\.stop\(\);\n\s+setPlaying\(null\);/);
  const tun = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  assert.match(tun, /useStopOnBlur\(\(\) => player\.stop\(\)\);/);
  assert.match(tun, /useStopWhenSilenced\(status\.playing \|\| !!status\.rendering, \(\) => player\.stop\(\)\);/);
});

// ── Lesson 3: latency — nothing slow is awaited on every tap ─────────────────

test('earPlayer awaits the audio-session mode once per run, bounded (Tuning + ear training)', () => {
  const s = read('src/features/ear/earPlayer.ts');
  assert.doesNotMatch(code(s), /await setAudioModeAsync\(/);
  const fn = s.slice(s.indexOf('async function settleMode()'));
  assert.match(fn, /if \(modeSettled\) return;\n\s+await Promise\.race\(\[mode, new Promise<void>\(\(r\) => setTimeout\(r, AUDIO_MODE_WAIT_MS\)\)\]\);\n\s+modeSettled = true;/);
  assert.match(s, /await settleMode\(\);/);
});
