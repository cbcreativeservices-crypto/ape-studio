/**
 * Pattern hunt P12 (catalog 2026-10-02) — stale closure / wrong dependency.
 * G6: the cleanup-with-deps guard from labSoundAudit20260929, extended from
 * "the cleanup is ONE stop() call" to EVERY cleanup-only effect in src/,
 * features/tools included.
 *
 * The shape: an effect whose whole body is a cleanup —
 *   useEffect(() => () => { … }, [dep])
 *   useFocusEffect(useCallback(() => () => { … }, [dep]))
 *   useEffect(() => { return () => { … }; }, [dep])
 * runs that cleanup every time `dep` changes identity, not only on blur or
 * unmount. When the cleanup stops sound or releases the mic, the render a
 * start causes tears the start down (the dead Bass ▶, b2660894).
 *
 * The catalog's one live candidate was useDspEngine.ts (deps [stopPolling],
 * cleanup also calls releaseMic). Verified 2026-10-02: `stopPolling` is
 * useCallback(…, []) so it never fired — but one added dep would have made the
 * tools engine release the mic on its own start. Both teardowns are []-deps
 * now. Every other cleanup-only effect with deps is listed below with why its
 * dep is stable (or why re-running on change is the point). The list may only
 * shrink; a new one fails until it is []-deps or justified here.
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

/** Balanced-bracket end of the expression starting at `i` (a block or an
 *  expression body), returning the index just past it. */
function bodyEnd(s: string, i: number): number {
  if (s[i] === '{') {
    let d = 0;
    for (let j = i; j < s.length; j++) {
      if (s[j] === '{') d++;
      else if (s[j] === '}' && --d === 0) return j + 1;
    }
    return s.length;
  }
  let d = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) {
      if (d === 0) return j;
      d--;
    } else if (c === ',' && d === 0) return j;
  }
  return s.length;
}

/** Every cleanup-only effect with a non-empty deps array: `file → [deps…]`. */
export function cleanupOnlyWithDeps(src: string): string[] {
  const s = code(src);
  const out: string[] = [];
  const starts = [/\(\)\s*=>\s*\(\)\s*=>\s*/g, /\(\)\s*=>\s*\{\s*return\s*\(\)\s*=>\s*/g];
  for (const re of starts) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      let end = bodyEnd(s, re.lastIndex);
      if (re.source.includes('return')) {
        // The outer block must hold nothing but that return.
        const close = /^\s*;?\s*\}/.exec(s.slice(end));
        if (!close) continue;
        end += close[0].length;
      }
      const deps = /^\s*,\s*\[([^\]]*)\]/.exec(s.slice(end));
      if (deps && deps[1].trim()) out.push(deps[1].trim().replace(/\s+/g, ' '));
    }
  }
  return out;
}

/** file → the deps it is allowed, each with why it cannot cause the Bass shape. */
const JUSTIFIED: Record<string, { deps: string[]; why: string }> = {
  'src/features/commercial/MembershipGate.tsx': {
    deps: ['hostId'],
    why: 'hostId is a useState constant (stable); the cleanup clears this host\'s pending paywall on unmount and stops no sound',
  },
  'src/features/tools/measure/previews/SpectrogramPreview.tsx': {
    deps: ['img'],
    why: 'disposes the PREVIOUS Skia image when a new one replaces it — re-running on change is the point',
  },
  'src/screens/tools/SpectrogramScreen.tsx': {
    deps: ['img'],
    why: 'disposes the PREVIOUS Skia image when a new one replaces it — re-running on change is the point',
  },
  'src/screens/lab/envelope/EnvelopeChart.tsx': {
    deps: ['prog'],
    why: 'a Reanimated shared value — stable identity for the life of the component',
  },
  'src/screens/lab/tuning/components/dragRail.tsx': {
    deps: ['anim'],
    why: 'an Animated.Value held in a ref/useRef — stable identity',
  },
  'src/screens/tools/SplMeterScreen.tsx': {
    deps: ['navigation'],
    why: 'the navigation prop is stable for a mounted screen; the cleanup restores portrait on leave',
  },
  'src/screens/tools/ToolFullScreen.tsx': {
    deps: ['navigation'],
    why: 'the navigation prop is stable for a mounted screen; the cleanup restores portrait on leave',
  },
  'src/screens/tools/WaveformScreen.tsx': {
    deps: ['navigation'],
    why: 'the navigation prop is stable for a mounted screen; the cleanup restores portrait on leave',
  },
  'src/screens/tools/ToolsHubScreen.tsx': {
    deps: ['lit, bloom'],
    why: 'two Animated.Values from useRef — stable identity',
  },
};

test('the scanner catches every form of a cleanup-only effect with deps', () => {
  assert.deepEqual(cleanupOnlyWithDeps('useEffect(() => () => stopTone(), [stopTone]);'), ['stopTone']);
  assert.deepEqual(
    cleanupOnlyWithDeps('useFocusEffect(useCallback(() => () => {\n  gen++;\n  stopPolling();\n  releaseMic();\n}, [stopPolling]));'),
    ['stopPolling'],
  );
  assert.deepEqual(cleanupOnlyWithDeps('useEffect(() => {\n  return () => {\n    stop();\n  };\n}, [stop]);'), ['stop']);
  // Not the shape: []-deps, or an effect that does work before its cleanup.
  assert.deepEqual(cleanupOnlyWithDeps('useEffect(() => () => stop(), []);'), []);
  assert.deepEqual(cleanupOnlyWithDeps('useEffect(() => {\n  start();\n  return () => stop();\n}, [stop]);'), []);
});

test('G6 ratchet: no NEW cleanup-only effect with deps anywhere in src/ (features/tools included)', () => {
  const found: Record<string, string[]> = {};
  for (const f of srcFiles()) {
    const hits = cleanupOnlyWithDeps(read(f));
    if (hits.length) found[f] = hits;
  }
  const unexpected: string[] = [];
  for (const [f, deps] of Object.entries(found)) {
    const ok = JUSTIFIED[f];
    for (const d of deps) if (!ok || !ok.deps.includes(d)) unexpected.push(`${f}: [${d}]`);
  }
  assert.deepEqual(unexpected, [], 'a cleanup-only effect re-runs its cleanup on a dep change (the Bass ▶ shape) — use []-deps with refs, useStopOnClose, or justify it in JUSTIFIED');
  // Shrink-only: an entry that no longer matches must be removed.
  const stale = Object.keys(JUSTIFIED).filter((f) => !found[f]);
  assert.deepEqual(stale, [], 'remove these JUSTIFIED entries — the effect is gone');
});

test('useDspEngine: the blur and unmount teardowns are []-deps (they release the mic)', () => {
  const s = code(read('src/features/tools/engine/useDspEngine.ts'));
  assert.deepEqual(cleanupOnlyWithDeps(s), []);
  const blur = s.slice(s.indexOf('useFocusEffect('), s.indexOf('return { state, frames, start, stop'));
  assert.equal((blur.match(/releaseMic\(\);/g) ?? []).length, 2, 'both teardowns still release the mic');
  assert.match(blur, /useFocusEffect\(\s*useCallback\(\s*\(\) => \(\) => \{[\s\S]*?\},\s*\[\],\s*\),\s*\);/);
});
