/**
 * Pattern hunt P10 (catalog 2026-10-02) — timers, intervals, rAF and animation
 * loops that outlive the screen or ignore "Reduce animations".
 *
 * What the sweep found (2026-10-02):
 *  • withRepeat: the catalog's "14 of 19 ungated" was mostly gates its grep did
 *    not know (useCiMotion's m.loops, useLabLoops, `running={focused}` props).
 *    The REAL class was different: six loops read the motion setting with the
 *    plain `animationsAllowed()` per render. Settings is a modal, so the screen
 *    behind it stays mounted and never re-renders on the toggle — the loop kept
 *    moving at a user who had just turned animations off (a11y.ts's own
 *    docblock says decorative loops must use the subscribed hook). They read
 *    `useAnimationsAllowed()` now. The SPL gauge's gold sweep/sparkle had no
 *    gate at all; the Harmonograph's endless redraw ran behind pushed screens.
 *  • setTimeout without clearTimeout (14 files): all one-shot yields, ref-only
 *    work or module-level hand-offs except one — the Ear Lab clip-end timer
 *    set state after the screen was left; it checks aliveRef now.
 *  • rAF without cancel (5 files): all single-frame, ref-guarded scrolls/opens
 *    — none is a loop.
 *  • setInterval without clear: none.
 *
 * Ratchets below: lists may only shrink.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
function srcFiles(dir = 'src'): string[] {
  const out: string[] = [];
  for (const name of readdirSync(new URL(dir, ROOT))) {
    const rel = join(dir, name).replace(/\\/g, '/');
    if (statSync(new URL(rel, ROOT)).isDirectory()) out.push(...srcFiles(rel));
    else if (/\.tsx?$/.test(name)) out.push(rel);
  }
  return out;
}
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const FILES = srcFiles().map((f) => ({ f, s: code(read(f)) }));

/** A SUBSCRIBED motion gate (re-renders when the app toggle or the OS flips). */
// P10b (2026-10-02): the shared decorative gate is subscribed too.
const REACTIVE_GATE = /\buseAnimationsAllowed\(|\buseDecorativeMotion\(|\buseCiMotion\(|\buseLabLoops\(/;

/** withRepeat hosts whose loop IS the display (not decoration), with the gate
 *  they do have. Owner call pending on whether reduce-motion should still them. */
const LOOP_IS_THE_DISPLAY: Record<string, string> = {
  'src/screens/lab/HarmonographMachine.tsx': 'the pen drawing IS the lab display; paused on blur (useIsFocused) and by FREEZE',
  'src/screens/lab/micspeaker/MicCutaway.tsx': 'the diaphragm/wave motion IS the lesson; the host passes running={focused}',
  'src/screens/lab/wave/vizWave.tsx': 'the trace pulse runs only while the learner is tracing (user-started)',
  'src/screens/lab/OscillatorLabScreen.tsx': 'the scrolling scope trace IS the display; gated on useIsFocused',
};

test('every withRepeat loop has a subscribed motion gate (or is the display, listed with its gate)', () => {
  const bad: string[] = [];
  const listedSeen = new Set<string>();
  for (const { f, s } of FILES) {
    if (!/\bwithRepeat\(/.test(s)) continue;
    if (LOOP_IS_THE_DISPLAY[f]) {
      listedSeen.add(f);
      continue;
    }
    if (!REACTIVE_GATE.test(s)) bad.push(f);
  }
  assert.deepEqual(bad, [], 'a withRepeat loop with no subscribed reduce-motion gate — use useAnimationsAllowed() (or useCiMotion / useLabLoops)');
  assert.deepEqual(Object.keys(LOOP_IS_THE_DISPLAY).filter((f) => !listedSeen.has(f)), [], 'remove stale LOOP_IS_THE_DISPLAY entries');
});

test('no loop host reads the motion setting with the plain per-render animationsAllowed()', () => {
  // `const x = animationsAllowed()` / `a && animationsAllowed()` in a render
  // body never re-runs on the toggle. A one-shot read INSIDE an effect (e.g.
  // InsideStats' count-up) is fine and is not an assignment.
  const PLAIN = /(?:const|let)\s+\w+\s*=[^;\n]*(?<![\w.])animationsAllowed\(\)/;
  const bad = FILES.filter(({ s }) => /\bwithRepeat\(/.test(s) && PLAIN.test(s)).map(({ f }) => f);
  assert.deepEqual(bad, []);
  // …including the shared motion hooks every cable/sound-systems loop reads.
  assert.doesNotMatch(code(read('src/screens/lab/cableinstall/motion.tsx')), PLAIN);
  assert.match(read('src/screens/lab/cableinstall/motion.tsx'), /const allowed = useAnimationsAllowed\(\);\n\s*const reduceMotion = reduce \|\| !allowed;/);
});

test('the SPL gauge gold sweep and sparkle hold still under reduced motion', () => {
  const s = code(read('src/screens/tools/Spl3dGauge.tsx'));
  // P10b (2026-10-02): through the shared decorative gate (+ Low-Light).
  assert.match(s, /const motionOk = useDecorativeMotion\(\);/);
  assert.match(s, /if \(goldActive && motionOk\) \{\s*sweep\.value = withRepeat/);
  assert.match(s, /if \(sparkleOn && motionOk\) \{\s*twinkle\.value = withRepeat/);
});

test('the Harmonograph redraw pauses off screen and resumes the same run', () => {
  const s = code(read('src/screens/lab/HarmonographMachine.tsx'));
  const eff = s.slice(s.indexOf('const focused = useIsFocused();'), s.indexOf('const M = useDerivedValue('));
  assert.ok(eff.length > 0);
  assert.match(eff, /cancelAnimation\(progress\);\s*if \(!focused\) return;\s*if \(frozen\)/);
  assert.match(eff, /\}, \[ink, dDrawMs, progress, frozen, epoch, onFreezeFraction, focused\]\);/);
});

test('Ear Lab: the clip-end timer does not set state on a screen that was left', () => {
  const s = code(read('src/screens/lab/eartraining/EarModuleScreen.tsx'));
  assert.match(s, /if \(aliveRef\.current && my === playTokenRef\.current\) setPlaying\(/);
});

test('every setInterval is cleared somewhere in its file', () => {
  const bad = FILES.filter(({ s }) => /\bsetInterval\(/.test(s) && !/\bclearInterval\b/.test(s)).map(({ f }) => f);
  assert.deepEqual(bad, []);
});

/** setTimeout with no clearTimeout anywhere in the file — each checked by hand
 *  2026-10-02. Shrink-only. */
const TIMEOUT_NO_CLEAR: Record<string, string> = {
  'src/features/audio/resample.ts': 'setTimeout(r, 0) yield inside an async loop that checks its abort signal',
  'src/features/audio/useRecordedPlayback.ts': 'breathe() — a 0 ms yield promise; callers re-check after it',
  'src/features/dev/DevVisualIndex.tsx': 'dev-only index; navigates after its modal closes',
  'src/features/ear/earPlayer.ts': 'a 0 ms base64 yield and a bounded audio-mode race — promises, no state',
  'src/features/glossary/corpusFetch.ts': 'yieldToUi() — a 0 ms yield promise',
  'src/features/glossary/offlineCorpus.native.ts': '0 ms yield between write batches',
  'src/features/glossary/offlinePrefetch.ts': 'settle/back-off waits inside a run that re-checks cancelled() after each',
  'src/lib/confirm.ts': 'the dialog hand-off (afterDialogCloses) — runs the caller\'s action after the fade by design',
  'src/navigation/pendingLink.ts': 'module-level URL correction ticks; idempotent',
  'src/screens/lab/calc/CalcWorkspaceScreen.tsx': 'scrollRef.current?.scrollTo after the keyboard — ref-only, null after unmount',
  'src/screens/lab/eartraining/EarModuleScreen.tsx': '0 ms yields + token/aliveRef-checked timers (clip end fixed 2026-10-02)',
  'src/screens/lab/mixing/pagesAdvD.tsx': '30 ms DSP breathers; each is followed by guard.alive()',
  'src/screens/profile/ProfileScreen.tsx': 'focus a field after the sheet opens — ref-only, null after unmount',
};

test('ratchet: no NEW file arms a setTimeout it can never clear', () => {
  const found = FILES.filter(({ s }) => /\bsetTimeout\(/.test(s) && !/\bclearTimeout\b/.test(s)).map(({ f }) => f);
  const unexpected = found.filter((f) => !TIMEOUT_NO_CLEAR[f]);
  assert.deepEqual(unexpected, [], 'keep the handle in a ref and clear it on unmount / re-arm — or justify it in TIMEOUT_NO_CLEAR');
  assert.deepEqual(Object.keys(TIMEOUT_NO_CLEAR).filter((f) => !found.includes(f)), [], 'remove stale TIMEOUT_NO_CLEAR entries');
});

/** requestAnimationFrame with no cancelAnimationFrame — all single frames. */
const RAF_ONE_SHOT: Record<string, string> = {
  'src/components/AccuracyNote.tsx': 'one frame to re-open the sheet',
  'src/screens/awards/AwardsScreen.tsx': 'one-frame scrollToIndex on a ref',
  'src/screens/courses/CourseSelectionScreen.tsx': 'one-frame scrollToIndex on a ref after a width change',
  'src/screens/curriculum/CurriculumScreen.tsx': 'one-frame scrollTo on a ref',
  'src/screens/glossary/GlossaryScreen.tsx': 'one-frame scrolls on refs',
};

test('ratchet: every rAF that can loop is cancellable; the one-shots are listed', () => {
  const found = FILES.filter(({ s }) => /\brequestAnimationFrame\(/.test(s) && !/\bcancelAnimationFrame\b/.test(s)).map(({ f }) => f);
  assert.deepEqual(found.filter((f) => !RAF_ONE_SHOT[f]), [], 'a rAF loop needs its handle cancelled on unmount');
  assert.deepEqual(Object.keys(RAF_ONE_SHOT).filter((f) => !found.includes(f)), [], 'remove stale RAF_ONE_SHOT entries');
  // One-shot means one-shot: none of them stores a handle (a loop would).
  for (const f of Object.keys(RAF_ONE_SHOT)) {
    assert.doesNotMatch(code(read(f)), /=\s*requestAnimationFrame\(/, `${f} keeps a rAF handle — it is a loop, cancel it`);
  }
});
