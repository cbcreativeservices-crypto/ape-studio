/**
 * LABS B — hunt 11 (2026-10-04). Receipts.
 *
 * 1. (K8 open item) Drum Tuning Lab: a ▶ STRIKE / ▶ TAP whose clip could not
 *    LOAD (EarClipPlayer.load rethrows a failed WAV write — disk full, cache
 *    cleared — or the player failed) dropped back to "STOPPED · press ▶ …"
 *    without a word, as if nothing had been pressed. The hook now reports
 *    `failed` for a PRESSED load (never a quiet preload) and every HEAR status
 *    line says the shared AUDIO_UNAVAILABLE_MESSAGE.
 * 2. (K8 open item) Mastering Lab: the same for a LISTEN ▶ (and a ▶ that
 *    joined the quiet pre-render): renderAll's catch went back to idle and the
 *    status line read "STOPPED · press ▶ … in the dock".
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** Comments out, so a receipt reads code only. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const DRUM_HOOK = 'src/screens/lab/drumtuning/useDrumPlayback.ts';
const DRUM_KIT = 'src/screens/lab/drumtuning/kit.tsx';
const DRUM_MODS = 'src/screens/lab/drumtuning/modules/';
const MASTER_HOOK = 'src/screens/lab/mastering/useMasterPlayback.ts';
const MASTER_KIT = 'src/screens/lab/mastering/kit.tsx';
const MASTER_MODS = ['mod1What', 'mod5Workflow', 'mod6Loudness'].map((m) => `src/screens/lab/mastering/modules/${m}.tsx`);

test('Drum: a PRESSED load that throws sets `failed` (a quiet preload never does); ▶ and ■ clear it', () => {
  const s = code(read(DRUM_HOOK));
  assert.match(s, /failed: boolean;/, 'DrumPlayback exposes failed');
  const loadCatch = s.slice(s.indexOf('await player.load('));
  const c = loadCatch.slice(0, loadCatch.indexOf('loadedKeyRef.current = k'));
  assert.match(c, /catch \{[\s\S]*if \(!quiet\) setFailed\(true\)/, 'the load catch reports a pressed failure');
  const play = s.slice(s.indexOf('const play = useCallback'), s.indexOf('const stop = useCallback'));
  assert.match(play, /setFailed\(false\)/, 'a new press clears the message');
  const stop = s.slice(s.indexOf('const stop = useCallback'), s.indexOf('useStopWhenSilenced('));
  assert.match(stop, /setFailed\(false\)/, '■ clears the message');
  assert.match(s, /\(\{ status, measure: renderNow, play, stop, playing, pending, failed,/);
});

test('Drum: the HEAR status line says AUDIO_UNAVAILABLE_MESSAGE, and every status line is wired to its players', () => {
  const k = code(read(DRUM_KIT));
  assert.match(k, /import \{ AUDIO_UNAVAILABLE_MESSAGE \} from '\.\.\/\.\.\/\.\.\/\.\.\/modules\/ape-dsp'/);
  const ds = k.slice(k.indexOf('export function DrumStatus'), k.indexOf('export function Landing'));
  assert.match(ds, /failed = false/);
  assert.match(ds, /if \(failed && !rendering && !pending && !playing\)[\s\S]*\{AUDIO_UNAVAILABLE_MESSAGE\}/);
  let sites = 0;
  for (const f of readdirSync(new URL(`../${DRUM_MODS}`, import.meta.url))) {
    if (!f.endsWith('.tsx')) continue;
    const s = read(DRUM_MODS + f);
    for (const m of s.matchAll(/<DrumStatus [^\n]*/g)) {
      sites++;
      const line = m[0];
      const pend = [...(line.match(/pending=\{([^}]*)\}/)?.[1] ?? '').matchAll(/(\w+)\.pending/g)].map((x) => x[1]);
      const fail = [...(line.match(/failed=\{([^}]*)\}/)?.[1] ?? '').matchAll(/(\w+)\.failed/g)].map((x) => x[1]);
      assert.deepEqual(fail, pend, `${f}: the status line reports every player it shows (${line.slice(0, 80)}…)`);
    }
  }
  assert.ok(sites >= 12, `found ${sites} DrumStatus lines`);
});

test('Mastering: a ▶ waiting on a render whose load throws sets `failed`; ▶ and ■ clear it', () => {
  const s = code(read(MASTER_HOOK));
  assert.match(s, /failed: boolean;/);
  const c = s.slice(s.indexOf('} catch {', s.indexOf('const renderAll')), s.indexOf('} finally {', s.indexOf('const renderAll')));
  assert.match(c, /if \(pendingRef\.current != null\) setFailed\(true\);\s*idsRef\.current = \[\];\s*pendingRef\.current = null;/, 'checked BEFORE the queue is cleared');
  const play = s.slice(s.indexOf('const play = useCallback'), s.indexOf('const stop = useCallback'));
  assert.match(play, /setFailed\(false\);\s*cancelReplay\(\);/);
  const stopAll = s.slice(s.indexOf('const stopAll = useCallback'), s.indexOf('useStopWhenSilenced('));
  assert.match(stopAll, /setFailed\(false\)/);
  assert.match(s, /return \{ status, failed, preparing:/);
});

test('Mastering: the LISTEN status line says AUDIO_UNAVAILABLE_MESSAGE, wired on every LISTEN page', () => {
  const k = code(read(MASTER_KIT));
  assert.match(k, /import \{ AUDIO_UNAVAILABLE_MESSAGE \} from '\.\.\/\.\.\/\.\.\/\.\.\/modules\/ape-dsp'/);
  const ps = k.slice(k.indexOf('export function PlaybackStatus'), k.indexOf('export function unmatchedWarning'));
  assert.match(ps, /failed = false/);
  assert.match(ps, /if \(failed && !rendering && !active\)[\s\S]*\{AUDIO_UNAVAILABLE_MESSAGE\}/);
  for (const p of MASTER_MODS) {
    const s = read(p);
    assert.match(s, /<PlaybackStatus [^\n]*failed=\{pb\.failed\}/, `${p} passes pb.failed`);
  }
});
