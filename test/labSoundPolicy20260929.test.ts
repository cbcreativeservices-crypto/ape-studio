/**
 * The lab sound POLICY of 2026-09-29 (owner: "Only stop when closed, keep
 * playing when switching screens (in most labs where this makes sense do
 * this)"). Pure tests for the one-owner rule (labOutputOwner.ts) and source
 * guards so a lab cannot quietly go back to stopping on blur.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  __resetLabOutputOwnerForTests,
  claimLabOutput,
  currentLabOutputOwner,
  mayStopOnClose,
  registerLabSound,
} from '../src/features/audio/labOutputOwner.ts';

// ── labOutputOwner: the sound screen in front owns the output ────────────────

test('claiming stops the previous owner (every stop it registered), never itself', () => {
  __resetLabOutputOwnerForTests();
  const calls: string[] = [];
  registerLabSound('A', { current: () => calls.push('A1') });
  registerLabSound('A', { current: () => calls.push('A2') });
  registerLabSound('B', { current: () => calls.push('B') });
  claimLabOutput('A');
  assert.deepEqual(calls, []); // nobody owned before
  claimLabOutput('A');
  assert.deepEqual(calls, []); // re-focus of the owner is a no-op
  claimLabOutput('B');
  assert.deepEqual(calls, ['A1', 'A2']);
  assert.equal(currentLabOutputOwner(), 'B');
});

test('components on the same screen never stop each other', () => {
  __resetLabOutputOwnerForTests();
  let stops = 0;
  registerLabSound('S', { current: () => stops++ });
  registerLabSound('S', { current: () => stops++ });
  claimLabOutput('S');
  claimLabOutput('S');
  assert.equal(stops, 0);
});

test('a superseded lab does not stop again on close (it would kill the newer lab\'s generator)', () => {
  __resetLabOutputOwnerForTests();
  registerLabSound('A', { current: () => {} });
  const offB = registerLabSound('B', { current: () => {} });
  claimLabOutput('A');
  assert.equal(mayStopOnClose('A'), true);
  claimLabOutput('B');
  assert.equal(mayStopOnClose('A'), false);
  assert.equal(mayStopOnClose('B'), true);
  offB(); // B closes → nobody owns → anyone closing may stop
  assert.equal(currentLabOutputOwner(), null);
  assert.equal(mayStopOnClose('A'), true);
});

test('the owner is kept while another component of the same screen is still registered', () => {
  __resetLabOutputOwnerForTests();
  const off1 = registerLabSound('S', { current: () => {} });
  registerLabSound('S', { current: () => {} });
  claimLabOutput('S');
  off1();
  assert.equal(currentLabOutputOwner(), 'S');
});

test('one throwing stop never keeps the rest of the old owner sounding', () => {
  __resetLabOutputOwnerForTests();
  let second = false;
  registerLabSound('A', {
    current: () => {
      throw new Error('released');
    },
  });
  registerLabSound('A', { current: () => (second = true) });
  claimLabOutput('A');
  claimLabOutput('B');
  assert.equal(second, true);
});

test('the LATEST stop is called (ref), not the one registered first', () => {
  __resetLabOutputOwnerForTests();
  const ref = { current: () => 'old' as unknown as void };
  let hit = '';
  registerLabSound('A', ref);
  ref.current = () => {
    hit = 'new';
  };
  claimLabOutput('A');
  claimLabOutput('B');
  assert.equal(hit, 'new');
});

// ── Source guards ────────────────────────────────────────────────────────────

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
function srcFiles(dir = 'src'): string[] {
  const out: string[] = [];
  for (const name of readdirSync(new URL(dir, ROOT))) {
    const rel = join(dir, name).replace(/\\/g, '/');
    if (statSync(new URL(rel, ROOT)).isDirectory()) out.push(...srcFiles(rel));
    else if (/\.tsx?$/.test(name)) out.push(rel);
  }
  return out;
}

/** The screens that are allowed to stop their sound on BLUR, and why. */
const BLUR_EXCEPTIONS = new Set([
  // Ear-training trials: a quiz stimulus heard behind another screen is not a
  // lesson, and a replay must not sound over the next question.
  'src/screens/lab/eartraining/EarModuleScreen.tsx',
  // Harmonics: the tone is the mic-measured reference, and the mic stops on
  // blur (privacy) — the tone goes with it.
  'src/screens/lab/HarmonicsView.tsx',
]);

test('useStopOnBlur is used only by the listed exceptions — every other lab stops on CLOSE', () => {
  const users = srcFiles().filter((f) => f !== 'src/features/audio/useStopOnBlur.ts' && /\buseStopOnBlur\(/.test(code(read(f))));
  assert.deepEqual(users.sort(), [...BLUR_EXCEPTIONS].sort());
});

test('every screen that starts lab sound joins the one-owner rule (useStopOnClose / useStopOnBlur)', () => {
  const starts = /ApeDsp\.(gen|bin|mod)Start\(|new EarClipPlayer\(|new TuningPlayer\(|\buseLabAudio\(\)/;
  const missing = srcFiles()
    .filter((f) => f.startsWith('src/screens/'))
    .filter((f) => starts.test(code(read(f))))
    .filter((f) => !/\buseStopOn(Close|Blur)\(/.test(code(read(f))));
  assert.deepEqual(missing, []);
});

/** Text of each `useFocusEffect(...)` call, parens balanced. */
function focusEffects(s: string): string[] {
  const out: string[] = [];
  let i = s.indexOf('useFocusEffect(');
  while (i >= 0) {
    let depth = 0;
    let j = i + 'useFocusEffect'.length;
    for (; j < s.length; j++) {
      if (s[j] === '(') depth++;
      else if (s[j] === ')' && --depth === 0) break;
    }
    out.push(s.slice(i, j + 1));
    i = s.indexOf('useFocusEffect(', j);
  }
  return out;
}

test('no lab or tool focus effect stops SOUND on blur (outside the exceptions)', () => {
  const soundStop = /ApeDsp\.(gen|bin|mod)Stop\(|player\w*(\.current)?\??\.stop\(\)|\bstop(Tone|Note|Noise|Interval)?\(\)/;
  const hits = srcFiles()
    .filter((f) => f.startsWith('src/screens/') && !BLUR_EXCEPTIONS.has(f))
    .filter((f) => focusEffects(code(read(f))).some((b) => soundStop.test(b)));
  assert.deepEqual(hits, []);
});

test('the focus-effect guard catches the old blur stops', () => {
  const soundStop = /ApeDsp\.(gen|bin|mod)Stop\(|player\w*(\.current)?\??\.stop\(\)|\bstop(Tone|Note|Noise|Interval)?\(\)/;
  const old = [
    'useFocusEffect(useCallback(() => () => { playerRef.current?.stop(); }, []));',
    'useFocusEffect(useCallback(() => () => { void ApeDsp.genStop(); }, []));',
    'useFocusEffect(useCallback(() => () => stop(), []));',
  ];
  for (const o of old) assert.ok(focusEffects(o).some((b) => soundStop.test(b)), o);
  assert.ok(!focusEffects('useFocusEffect(useCallback(() => { focusedRef.current = true; }, []));').some((b) => soundStop.test(b)));
});

test('useStopOnClose: []-deps unmount stop through a ref, and it yields to a newer owner', () => {
  const s = code(read('src/features/audio/useStopOnBlur.ts'));
  const fn = s.slice(s.indexOf('export function useStopOnClose'));
  assert.match(fn, /stopRef\.current = stop;/);
  assert.match(fn, /if \(mayStopOnClose\(idRef\.current\)\) stopRef\.current\(\);\n\s+\},\n\s+\[\],/);
  assert.match(s, /claimLabOutput\(id\);/);
});

test('safety paths are untouched: background + shake still silence every voice and file player', () => {
  const gate = read('src/features/audio/AudioOutputGate.tsx');
  // Unconditional since 2026-09-30: a generator live while the gate already
  // reads muted is silenced too.
  // 2026-10-01: routed through Settings › "Mute audio when I leave the app" —
  // ON → panicMuteAudio, OFF → stopAllSound (same silencing pass, gate stays
  // on). Both stop every voice; see test/muteAudioOnLeave20261001.test.ts.
  assert.match(
    gate,
    /if \(state === 'background'\) \{[\s\S]{0,1800}?\n\s+onLeaveApp\(muteOnLeaveEnabled\(\), \{ panicMute: panicMuteAudio, stopAllSound \}\);\n\s+return;/,
  );
  // 2026-10-09 (owner: Save auto-muted the Pixel): the app's OWN share sheet is
  // not leaving — but only for a bounded window, after which the same rule runs.
  assert.match(gate, /const sheetMs = systemSheetMsLeft\(\);\s*if \(sheetMs > 0\) \{\s*setTimeout\(\(\) => \{\s*if \(AppState\.currentState !== 'active'\) onLeaveApp\(muteOnLeaveEnabled\(\), \{ panicMute: panicMuteAudio, stopAllSound \}\);\s*\}, sheetMs\);/);
  const panic = read('src/features/audio/panicMute.ts');
  assert.match(panic, /stopAllFilePlayers\(\);/);
});
