/**
 * Labs A — hunt 12 (2026-10-04). Receipts.
 *
 * 1. LEFTOVER (hunt 11, K8 / catalog B "pre-renders cancel on leave"): the
 *    Mixing lab's QUIET pre-render (useMixPlayback, perf hunt 2026-10-03)
 *    checked focus only when its 900 ms timer fired. Once started it rendered
 *    every variant — full DSP per variant, then the WAV encode + file write —
 *    even after the learner pushed the EQ Lab or the other mixing lab (an
 *    OpenLabLink keeps this screen mounted, so neither unmount nor a console
 *    edit retired it). Blur now retires a quiet render the same way a console
 *    edit does (the generation bump), unless a ▶ press has joined it.
 *
 * R2: run against the HEAD files and failed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  assert.ok(i >= 0, `missing: ${a}`);
  const j = s.indexOf(b, i + a.length);
  assert.ok(j > i, `missing after ${a}: ${b}`);
  return s.slice(i, j);
};

describe('Mixing: a quiet pre-render stops at blur', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  const hook = between(s, 'export function useMixPlayback(', '\n}\n');

  it('renderAll records which generation is a QUIET one', () => {
    const body = between(hook, 'const renderAll = useCallback(async (quiet = false) => {', 'const current = () =>');
    assert.match(body, /const my = \+\+renderSeqRef\.current;\s*quietSeqRef\.current = quiet \? my : 0;/);
  });

  it('the focus cleanup retires the quiet render still in flight (generation bump + slot release + idle)', () => {
    const focus = between(hook, 'useFocusEffect(', '// STAYS ARMED');
    const cleanup = between(focus, 'return () => {', '}, []),');
    assert.match(cleanup, /focusedRef\.current = false;/);
    assert.match(cleanup, /quietSeqRef\.current === renderSeqRef\.current/, 'only the CURRENT render, and only a quiet one');
    assert.match(cleanup, /renderingSigRef\.current !== null/, 'only while one is actually rendering');
    assert.match(cleanup, /pendingRef\.current == null/, 'a ▶ that joined the render keeps it');
    assert.match(cleanup, /renderSeqRef\.current\+\+;\s*renderingSigRef\.current = null;\s*setStatus\('idle'\);/);
  });

  it('the pre-render itself is still quiet and never plays', () => {
    const pre = between(hook, 'useEffect(() => {\n    if (!sessionStemsWarm()) return;', '}, [signature]);');
    assert.match(pre, /void renderAllRef\.current\(true\);/);
    assert.doesNotMatch(pre, /pendingRef\.current =/);
  });
});
