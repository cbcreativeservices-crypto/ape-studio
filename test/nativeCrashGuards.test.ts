/**
 * GUARD — two ways this app can take the process down, neither of which a
 * `try/catch` can see. Both were reported by the owner on 2026-09-23 as plain
 * "it crashed", which is all a native crash ever looks like from the outside.
 *
 * 1. CALLING A NON-WORKLET FROM A WORKLET.
 *    Reanimated worklets run on the UI thread in a separate JS runtime. A
 *    function that was not workletized does not exist there, and calling one is
 *    a hard crash. `viz.tsx` keeps deliberate TWINS — `hash` ('worklet') and
 *    `hashJs` ("module scope, not a worklet") — and the noise branch of the
 *    Playground waveform reached for the JS one from inside `useDerivedValue`.
 *    It fired only on PINK/WHITE/BROWN because that is the only branch that
 *    hashes; the wave branch is pure trigonometry, so sine → square worked.
 *
 * 2. A MODAL THAT CANNOT FACE THE WAY THE APP IS FACING.
 *    `supportedOrientations` defaults to `['portrait']`. Present a Modal while
 *    the interface is locked LANDSCAPE and UIKit raises
 *    `UIApplicationInvalidInterfaceOrientation`. The SPL Meter's fullscreen sets
 *    `orientation: 'landscape'`, so its colour wheel crashed the app.
 *    ⚠️ This lesson was already WRITTEN DOWN — in HarmonographViewer, as
 *    "MODAL RULES (SplMeter lessons)" — in the file that learned it rather than
 *    anywhere that enforced it. Hence a test.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}
const SRC = join(process.cwd(), 'src');
const files = walk(SRC);
// `sep` rather than a backslash literal: this file is read by a strip-only
// TypeScript loader and an escaped backslash is easy to mangle in tooling.
const rel = (f: string) => relative(process.cwd(), f).split(sep).join('/');

/** The body of every `hook(` call in `code`, by brace/paren balance. */
function callBodies(code: string, hook: string): string[] {
  const out: string[] = [];
  let i = 0;
  for (;;) {
    const at = code.indexOf(hook + '(', i);
    if (at < 0) break;
    let depth = 0;
    let j = at + hook.length;
    for (; j < code.length; j++) {
      const c = code[j];
      if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push(code.slice(at, j + 1));
    i = j + 1;
  }
  return out;
}

const WORKLET_HOOKS = ['useDerivedValue', 'useAnimatedStyle', 'useFrameCallback', 'useAnimatedProps'];

describe('worklets never call a JS-only twin', () => {
  test('no `…Js` helper is called inside a worklet hook', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const code = readFileSync(file, 'utf8');
      if (!WORKLET_HOOKS.some((h) => code.includes(h + '('))) continue;
      for (const hook of WORKLET_HOOKS) {
        for (const body of callBodies(code, hook)) {
          // The naming convention in this codebase for the JS-thread twin.
          for (const m of body.matchAll(/\b([A-Za-z_$][\w$]*Js)\s*\(/g)) {
            offenders.push(`${rel(file)} — ${hook} calls ${m[1]}()`);
          }
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `a UI-thread worklet calls a function that does not exist on the UI thread — this is a NATIVE CRASH, not an error:\n${offenders.join('\n')}`,
    );
  });

  test('the worklet twin still exists and is still a worklet', () => {
    // If `hash` lost its directive the fix above would silently become the bug.
    const viz = readFileSync(join(SRC, 'screens', 'lab', 'foundations', 'viz.tsx'), 'utf8');
    assert.match(
      viz,
      /function hash\(n: number\): number \{\s*\n\s*'worklet';/,
      "viz.tsx's `hash` is no longer a worklet",
    );
    assert.match(viz, /const r = \(hash\(i \* 17\.13\) - 0\.5\) \* 2;/, 'the noise trace stopped using the worklet hash');
  });
});

describe('every native Modal may face the way the app is facing', () => {
  test('a raw react-native Modal always sets supportedOrientations', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const code = readFileSync(file, 'utf8');
      if (!/<Modal[\s>]/.test(code)) continue;
      // Modals from DimModal inherit the safe default; only RAW ones must say it.
      const rawImport = /^import \{[^}]*\bModal\b[^}]*\} from 'react-native';$/m.test(code);
      if (!rawImport) continue;
      for (const m of code.matchAll(/<Modal(?=[\s>])[\s\S]*?>/g)) {
        if (!m[0].includes('supportedOrientations')) {
          const line = code.slice(0, m.index).split('\n').length;
          offenders.push(`${rel(file)}:${line}`);
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `a raw <Modal> defaults to portrait-only; opening it over a landscape-locked screen is a NATIVE CRASH on iOS:\n${offenders.join('\n')}`,
    );
  });

  test('DimModal supplies the default so 40+ callers do not have to', () => {
    const dim = readFileSync(join(SRC, 'components', 'DimModal.tsx'), 'utf8');
    assert.match(dim, /supportedOrientations = ALL_ORIENTATIONS/, 'DimModal no longer defaults the orientations');
    assert.match(
      dim,
      /<RNModal supportedOrientations=\{supportedOrientations\}/,
      'DimModal no longer passes the orientations through',
    );
    const consts = readFileSync(join(SRC, 'components', 'modalOrientations.ts'), 'utf8');
    for (const o of ['portrait', 'landscape', 'landscape-left', 'landscape-right']) {
      assert.ok(consts.includes(`'${o}'`), `ALL_ORIENTATIONS lost '${o}'`);
    }
  });

  test('the landscape locks that make this reachable still exist', () => {
    // If nothing locked landscape any more this guard would be pointless; if a
    // NEW lock appears, the guard above already covers it.
    const spl = readFileSync(join(SRC, 'screens', 'tools', 'SplMeterScreen.tsx'), 'utf8');
    assert.match(spl, /orientation:\s*'landscape'|'landscape'\n?\s*:/, 'the SPL fullscreen no longer locks landscape');
  });
});
