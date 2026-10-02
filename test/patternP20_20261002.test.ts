/**
 * Pattern hunt P20 (catalog 2026-10-02) — mic engine lifecycle.
 *
 * micSession (single owner, bounded close, generation per start) and
 * useDspEngine (blur/unmount teardown) were already swept. The remaining gap
 * was the BACKGROUND release: Home does not blur a screen, so only an AppState
 * handler can honour "Release microphone in the background". The tools get it
 * from useToolAutoStart(state, start, stop) — but three lab hosts of
 * useDspEngine never opted in, so the OS mic indicator stayed lit with the app
 * out of sight:
 *   • EQ Lab LiveSpectrumEq + SeeingFrequency — called useToolAutoStart
 *     WITHOUT `stop` (the opt-in), so no handler was wired;
 *   • HarmonicsView (Ear Lab LIVE mode) — manual START, no handler at all.
 * Fix: the two EQ modules pass `stop`; manual-start hosts use the new
 * useReleaseMicOnBackground(state, stop) (releases, never resumes — the user
 * restarts it, integrity rule).
 *
 * RATCHET: every useDspEngine host has a background release, or is listed.
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

const OWN_HANDLER: Record<string, string> = {
  'src/screens/tools/MultiMeterScreen.tsx': 'its own AppState handler (releaseMicNow, covers starting) — micReleasedOnBackground pins it',
  'src/screens/tools/hubPreviewEngine.ts': 'the hub stops its preview capture on background via its appActive state (owns its own AppState handling)',
};

function hasBackgroundRelease(s: string): boolean {
  if (/\buseReleaseMicOnBackground\(\s*\w+\s*,\s*\w+\s*\)/.test(s)) return true;
  // useToolAutoStart's background handler only wires when `stop` is passed.
  return /\buseToolAutoStart\(\s*\w+\s*,\s*\w+\s*,\s*\w+\s*\)/.test(s);
}

test('ratchet: every useDspEngine host releases the mic when the app goes to the background', () => {
  const hosts = srcFiles()
    .filter((f) => f !== 'src/features/tools/engine/useDspEngine.ts')
    .map((f) => ({ f, s: code(read(f)) }))
    .filter(({ s }) => /\buseDspEngine\(/.test(s));
  assert.ok(hosts.length >= 10, 'the scan still finds the hosts');
  const bad = hosts.filter(({ f, s }) => !OWN_HANDLER[f] && !hasBackgroundRelease(s)).map(({ f }) => f);
  assert.deepEqual(bad, [], 'pass `stop` to useToolAutoStart, or call useReleaseMicOnBackground(state, stop)');
  for (const f of Object.keys(OWN_HANDLER)) {
    assert.ok(hosts.some((h) => h.f === f), `${f} is no longer a host — remove it from OWN_HANDLER`);
  }
});

test('the three lab hosts that held the mic open in the background are wired', () => {
  for (const f of ['src/screens/lab/eq/modules/LiveSpectrumEq.tsx', 'src/screens/lab/eq/modules/SeeingFrequency.tsx']) {
    assert.match(code(read(f)), /useToolAutoStart\(state, onStart, stop\);/, f);
  }
  assert.match(code(read('src/screens/lab/HarmonicsView.tsx')), /useReleaseMicOnBackground\(state, stop\);/);
});

test('useReleaseMicOnBackground: background only, setting-gated, skips the permission dialog, covers START, never resumes', () => {
  const s = code(read('src/features/tools/engine/useDspEngine.ts'));
  const at = s.indexOf('export function useReleaseMicOnBackground(');
  assert.ok(at > 0);
  const body = s.slice(at, s.indexOf('\n}\n', at));
  assert.match(body, /if \(s !== 'background'\) return;/);
  assert.match(body, /if \(!micReleaseOnBackgroundEnabled\(\)\) return;/);
  assert.match(body, /if \(micPermissionPromptOpen\) return;/);
  assert.match(body, /if \(stateRef\.current === 'running' \|\| stateRef\.current === 'starting'\) \{\s*stopRef\.current\(\);\s*releaseMicNow\(\);/);
  assert.doesNotMatch(body, /start\w*\(\)|acquireMic/, 'a manual-start host never reopens the mic by itself');
  assert.match(body, /return \(\) => sub\.remove\(\);\s*\}, \[\]\);/);
});
