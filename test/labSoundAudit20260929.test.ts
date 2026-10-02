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
  // useStopOnClose(stop) / useStopOnBlur(stop), or a ref to the latest stop
  // in a []-deps effect.
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

test('modAnalog: the unmount stop is useStopOnClose, not a [stop]-deps cleanup', () => {
  const s = read('src/screens/lab/digital/modules/modAnalog.tsx');
  assert.match(s, /useStopOnClose\(stop\);/);
  assert.doesNotMatch(code(s), /if \(!focused\) stop\(\);/); // owner 2026-09-29: not on blur
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
    // The gate re-check is the start fence's (startFenced, 2026-10-02): every
    // native start runs inside it, and none is awaited bare.
    assert.match(s, /startFenced\(\{\n\s*start: \(\) => ApeDsp\.(gen|bin|mod)Start\(\),/, f);
    assert.doesNotMatch(s, /await ApeDsp\.(gen|bin|mod)Start\(/, `${f}: a bare native start escapes the fence`);
  }
  const course = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
  assert.equal((course.match(/start: \(\) => ApeDsp\.genStart\(\),/g) ?? []).length, 3, 'sine, additive and stereo starts');
  assert.doesNotMatch(course, /await ApeDsp\.genStart\(/);
  const hv = read('src/screens/lab/HarmonicsView.tsx');
  const start = hv.slice(hv.indexOf('const startTone = useCallback('), hv.indexOf('const stopTone = useCallback('));
  assert.ok(start.indexOf('startFenced({') > 0 && start.indexOf('startFenced({') < start.indexOf('ApeDsp.genStart()'));
  assert.ok(start.indexOf("if (fenced.status !== 'started') return false;") > start.indexOf('ApeDsp.genStart()'));
  assert.ok(start.indexOf("if (fenced.status !== 'started') return false;") < start.indexOf('setGenRunning(true);'));
});

test('Cymatics drive tone follows a mute (useStopWhenSilenced), like every other lab tone', () => {
  const s = read('src/screens/lab/cymatics/useDriveTone.ts');
  assert.match(s, /useStopWhenSilenced\(running, stop\);/);
  assert.match(s, /useStopOnClose\(stop\);/);
});

test('ear training stops on BLUR (exception); Tuning stops on CLOSE (owner 2026-09-29)', () => {
  const ear = read('src/screens/lab/eartraining/EarModuleScreen.tsx');
  assert.match(ear, /useStopOnBlur\(\(\) => \{\n\s+playTokenRef\.current\+\+;\n\s+playerRef\.current\?\.stop\(\);\n\s+setPlaying\(null\);/);
  const tun = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  assert.match(tun, /useStopOnClose\(\(\) => player\.stop\(\)\);/);
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

// ── Lesson 2: ▶ arms the lab — the transport stays ■ and changes re-sound ────

test('Autotune: the pass ringing out keeps ■; an AMOUNT/SPEED change replays it', () => {
  const s = read('src/screens/lab/AutotuneLabScreen.tsx');
  assert.match(s, /if \(idx >= MELODY\.length\) \{\n\s+hush\(\);/);
  assert.doesNotMatch(s, /if \(playing\) stop\(\);/);
  assert.match(s, /\}, \[amount, speedKey\]\);/);
  assert.match(s, /if \(armedRef\.current\) void playRef\.current\(\);/);
  // A superseded start only stops the generator when nothing newer wants it.
  assert.match(s, /why === 'superseded' && wantRef\.current \? undefined : ApeDsp\.genStop\(\)/);
  // ■ cancels a replay that is already scheduled.
  assert.match(s, /armedRef\.current = false; \/\/ a replay already scheduled must not fire/);
});

test('FM: armed PLUCK/BELL strike again when a control settles; a ■ cancels it', () => {
  const s = read('src/screens/lab/FmLabScreen.tsx');
  assert.match(s, /if \(env\.decaySec <= 0\) return;/);
  assert.match(s, /if \(wantRef\.current\) void strikeRef\.current\(\);/);
  assert.match(s, /why === 'superseded' && wantRef\.current \? undefined : ApeDsp\.genStop\(\)/);
});

test('Harmonograph: an unclean ratio goes quiet but stays armed; ■ stays pressable', () => {
  const s = read('src/screens/lab/HarmonographLabScreen.tsx');
  assert.doesNotMatch(s, /retuneOrStop/);
  const fn = s.slice(s.indexOf('const retuneOrHush = '), s.indexOf('const pickRatio = '));
  assert.doesNotMatch(fn, /stopInterval\(\)/);
  assert.match(fn, /void soundInterval\(m\);/);
  assert.match(fn, /hushInterval\(\);/);
  assert.match(s, /disabled=\{!playable && !running/);
  assert.doesNotMatch(s, /if \(d !== 0 && running\) stopInterval\(\);/);
});

test('Cymatics ratio pair: an unplayable pair goes quiet, PLAY stays on and stays reachable', () => {
  const s = read('src/screens/lab/cymatics/modules/modHarmony.tsx');
  const eff = s.slice(s.indexOf('const startRef = useRef(start);'), s.indexOf('useStopOnClose(stop);'));
  assert.doesNotMatch(eff, /\bstop\(\)/);
  assert.match(eff, /void startRef\.current\(\); \/\/ playable again — sound again/);
  assert.match(s, /\.\.\.\(tone\.playable \|\| tone\.running \? \[\{ kind: 'toggle'/);
});

test('Digital alias tone: leaving 40 Hz–16 kHz goes quiet, not STOP; the button can always stop', () => {
  const s = read('src/screens/lab/digital/modules/modAnalog.tsx');
  assert.match(s, /retarget\(playing, target, target >= PLAY_MIN_HZ && target <= PLAY_MAX_HZ\);/);
  assert.match(s, /disabled=\{!canInput && playing !== 'input'/);
  assert.match(s, /disabled=\{!canAlias && playing !== 'alias'/);
});

test('EQ audition: switching PINK/SWEEP while playing retargets in place (no stop/restart)', () => {
  const s = read('src/screens/lab/eq/modules/eqAudition.tsx');
  assert.doesNotMatch(s, /stop\(\);\n\s+void start\(s\.key\);/);
  assert.match(s, /if \(running\) \{\n\s+ApeDsp\.genSet\(\{ levelDb: GEN_LEVEL_DB, \.\.\.s\.gen \}\);/);
});

test('mixing: ■ stays lit after the clip ends; a console edit replays the same variant', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  assert.match(s, /playerRef\.current\.onEnded = null;/);
  assert.match(s, /const again = activeRef\.current \?\? pendingRef\.current(?: \?\? replayIdRef\.current)?;/);
  const eff = s.slice(s.indexOf('const again = activeRef.current'), s.indexOf('}, [signature]);'));
  // Alive + in front + the open gate (and the sound-stop epoch) — the fence,
  // armed when the replay is armed (armFence, 2026-10-02).
  assert.match(eff, /const blocked = armFence\(\(\) => aliveRef\.current && focusedRef\.current\);/);
  assert.match(eff, /if \(blocked\(\)\) return;/);
  assert.match(eff, /void renderAllRef\.current\(\);/);
  assert.match(eff, /return \(\) => (?:\{\s*)?clearTimeout\(t\);/);
});
