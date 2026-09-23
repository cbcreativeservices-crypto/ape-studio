/**
 * GUARD — every background mic-release handler covers 'starting', not just
 * 'running'.
 *
 * The setting "Release microphone in the background" promises the mic "stops
 * immediately". A handler that only releases from 'running' breaks that promise
 * during the START window: press START, press Home, and capture stays open in
 * the background with the OS mic indicator lit. On Android the cold HAL open is
 * a documented 5–10 second window, so first entry hits it easily.
 *
 * This has now been found TWICE — `useDspEngine` on 2026-09-20 and
 * `MultiMeterScreen` on 2026-09-23 — because MultiMeter carries its own copy of
 * the handler rather than using the engine's. That is why this guard checks
 * every copy rather than one file.
 *
 * ⛔ It is also a privacy defect, not a tidiness one: the OS indicator tells the
 * user their mic is live while the app is not in front of them.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('the mic is released when the app goes to the background', () => {
  test("no release handler gates on 'running' alone", () => {
    const offenders: string[] = [];
    for (const file of walk(join(process.cwd(), 'src'))) {
      const code = strip(readFileSync(file, 'utf8'));
      // Only files that actually do a background mic release.
      if (!code.includes('releaseMicNow')) continue;
      if (!/AppState\.addEventListener/.test(code)) continue;
      // The state test guarding that release must include 'starting'.
      for (const m of code.matchAll(/if \(([^)]*stateRef\.current[^)]*)\)/g)) {
        const cond = m[1];
        if (!cond.includes("'running'")) continue;
        if (!cond.includes("'starting'")) {
          offenders.push(`${file.replace(process.cwd(), '')} — ${cond.trim()}`);
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `a background mic release ignores the START window, so the mic stays hot:\n${offenders.join('\n')}`,
    );
  });

  test('both known handlers are still present', () => {
    // If a file stops releasing entirely the test above would pass vacuously.
    const engine = readFileSync(join(process.cwd(), 'src', 'features', 'tools', 'engine', 'useDspEngine.ts'), 'utf8');
    const meter = readFileSync(join(process.cwd(), 'src', 'screens', 'tools', 'MultiMeterScreen.tsx'), 'utf8');
    for (const [name, src] of [['useDspEngine', engine], ['MultiMeterScreen', meter]] as const) {
      assert.match(src, /releaseMicNow\(\)/, `${name} no longer releases the mic on background`);
      assert.match(src, /'running' \|\| stateRef\.current === 'starting'/, `${name} no longer covers the START window`);
    }
  });
});
