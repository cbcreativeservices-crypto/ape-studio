/**
 * Source guards for the lab bug hunt of 2026-09-29 (mixing, Foundations, tube
 * card, production, patchbay / connector-select goals, PagedLab, gear, mic
 * select). Each test pins the SHAPE of one fix so a later edit cannot quietly
 * undo it; the reasoning lives in the comment beside each fix in the source.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('mixing: plays on under other screens, stops on close; a queued play needs focus AND an open gate', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  const blur = s.slice(s.indexOf('const focusedRef = useRef(true);'));
  assert.ok(blur.length > 0, 'focusedRef exists');
  const cleanup = blur.slice(0, blur.indexOf('}, []),'));
  assert.match(cleanup, /focusedRef\.current = false;/);
  // Owner 2026-09-29: "only stop when closed" — blur no longer stops.
  assert.doesNotMatch(cleanup, /\.stop\(\)|setActive\(null\)/);
  assert.match(s, /useStopOnClose\(stopAll\);/);
  assert.match(s.slice(s.indexOf('const stopAll = useCallback(')), /pendingRef\.current = null;/);
  // The open-gate check is the start fence's (startFenced, 2026-10-02): the
  // load runs inside it and a queued play fires only when it reports started.
  assert.match(s, /const fenced = await startFenced\(\{\s*\n\s*start: \(\) => player\.load\(out\.map\(\(o\) => o\.mix\.stereo\)\),/);
  assert.match(s, /if \(fenced\.status === 'started' && want && focusedRef\.current\)/);
  assert.match(s, /useStopWhenSilenced\(active != null \|\| pending != null, stopAll\)/);
});

test('mixing: play() renders through the NEWEST renderAll after the gate await', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  assert.match(s, /renderAllRef\.current = renderAll;/);
  assert.match(s, /void renderAllRef\.current\(\);/);
  assert.doesNotMatch(s, /void renderAll\(\);/);
});

test('mixing: MiniConsole merges with a functional updater (two faders in one frame both land)', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  assert.match(s, /onChange: Dispatch<SetStateAction<MixSettings>>;/);
  assert.match(s, /onChange\(\(prev\) => \(\{ \.\.\.prev, \[id\]: \{ \.\.\.FLAT, \.\.\.\(prev\[id\] \?\? \{\}\), \.\.\.next \} \}\)\);/);
});

test('Foundations: tone.set is never gated on tone.playing, and NEXT/FINISH share ONE nav lock', () => {
  const s = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
  assert.doesNotMatch(s, /if \(tone\.playing\) tone\.set\(/);
  // Shared strip (2026-09-30): NEXT and FINISH are the same button of
  // useLabNav, behind its one 400 ms tap lock (createTapLock) — a double tap
  // at module 13 cannot run FINISH on the second tap. The screen keeps no
  // lock of its own for the strip; goTo keeps its stamp for the end screen's
  // own jump links. FINISH opens the what's-left screen (owner 2026-09-29).
  assert.match(s, /useLabNav\(\{[^}]*finish, unEnd \}\)/);
  assert.doesNotMatch(s, /navLocked/);
  assert.match(s, /if \(Date\.now\(\) - lastNavAtRef\.current < 400\) return;\s*\n\s*lastNavAtRef\.current = Date\.now\(\);/);
  assert.match(s, /tone\.stop\(\);\s*\n\s*setEnding\(true\);/);
});

test('tube card: one-finger drag tests the LIVE scale and a pinch hands over to pan', () => {
  const s = read('src/screens/lab/tube/TubeCardScreen.tsx');
  assert.doesNotMatch(s, /if \(s\.startScale > 1\.01\)/);
  assert.match(s, /if \(s\.mode === 'pinch'\) \{\s*\n\s*s\.mode = 'pan';\s*\n\s*s\.startTx = cur\.current\.tx - g\.dx;/);
  assert.match(s, /if \(s\.mode === 'pan' \|\| cur\.current\.scale > 1\.01\)/);
});

test('production: START A PROJECT has an in-flight guard; stale saves never win; NA editor can cancel', () => {
  const lab = read('src/screens/lab/production/ProductionLabScreen.tsx');
  assert.match(lab, /if \(startingRef\.current\) return;/);
  const stage = read('src/screens/lab/production/ProductionStageScreen.tsx');
  assert.equal((stage.match(/if \(my !== writeSeqRef\.current\) return;/g) ?? []).length, 2);
  const row = read('src/screens/lab/production/FieldRow.tsx');
  assert.match(row, />CANCEL<\/Text>/);
  assert.match(row, /setNaNeedReason\(true\)/);
});

test('production: a failed accept says so and keeps the sheet + text; clears only after success', () => {
  const lab = read('src/screens/lab/production/ProductionLabScreen.tsx');
  const fn = lab.slice(lab.indexOf('const acceptCondition = useCallback('));
  const body = fn.slice(0, fn.indexOf('[project, accepting, reload, lab]'));
  assert.ok(body.indexOf("notify(") < body.indexOf('setAccepting(null)'), 'notify on failure before any close');
  assert.match(body, /return false;/);
  const sheet = read('src/screens/lab/production/AcceptConditionSheet.tsx');
  assert.match(sheet, /const ok = await onAccept\(name\.trim\(\), reason\.trim\(\)\);\s*\n\s*if \(ok\) \{/);
  // Backdrop / BACK closes without wiping the draft.
  assert.match(sheet, /const close = \(\) => onCancel\(\);/);
});

test('goal chips start latched on a finished page (mixing, patchbay, connector select)', () => {
  for (const p of [
    'src/screens/lab/mixing/kit.tsx',
    'src/screens/lab/patchbay/bits.tsx',
    'src/screens/lab/connectorselect/bits.tsx',
  ]) {
    const s = read(p);
    assert.match(s, /useRef<boolean\[\]>\(goals\.map\(\(\) => ctx\.isDone\)\)/, p);
    assert.match(s, /if \(ctx\.isDone && !seen\.current\.every\(Boolean\)\)/, p);
  }
});

test('PagedLab: taps before progress loads are kept, and the restore never snaps back', () => {
  const s = read('src/screens/lab/kit/PagedLab.tsx');
  assert.match(s, /if \(!navigatedRef\.current\) setPage\(/);
  assert.match(s, /preloadRef\.current\.done\.add\(page\);/);
  assert.match(s, /navigatedRef\.current = true;/);
});

test('gear: no console legend under 9 pt', () => {
  const s = read('src/screens/lab/kit/gear.tsx');
  for (const m of s.matchAll(/fontSize: ([\d.]+)/g)) {
    assert.ok(Number(m[1]) >= 9, `fontSize ${m[1]} is under 9 pt`);
  }
});

test('mic select: the detail panel draws the zoomable photo the thumbnails promise', () => {
  const s = read('src/screens/lab/micselect/MicSelectLabScreen.tsx');
  const detail = s.slice(s.indexOf('const Detail = ('), s.indexOf('IMPORTANT LIMITATION'));
  assert.match(detail, /<MicVisual kind=\{t\.kind\} w=\{64\} h=\{96\} \/>/);
});
