/**
 * GUARD — two ways this app can take the process down, neither of which a
 * `try/catch` can see. Both were reported by the owner on 2026-09-23 as plain
 * "it crashed", which is all a native crash ever looks like from the outside.
 *
 * 1. CALLING A NON-WORKLET FROM A WORKLET.
 *    Reanimated worklets run on the UI thread in a SEPARATE JS runtime. A
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
 *
 * ⚠️ BOTH CHECKS STRIP COMMENTS FIRST. The first version of this guard matched
 * `<Modal` inside prose — the codebase discusses its own modals at length — and
 * the automated fix that came with it wrote a JSX prop into four sentences.
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

/** Blank out comments, preserving offsets so reported line numbers stay true. */
const blank = (s: string) => s.replace(/\n/g, '\u0001').replace(/[^\u0001]/g, ' ').replace(/\u0001/g, '\n');
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
}

/** The text of every `name(...)` call, by paren balance. */
function callBodies(code: string, name: string): { body: string; at: number }[] {
  const out: { body: string; at: number }[] = [];
  for (const m of code.matchAll(new RegExp('\\b' + name + '\\s*\\(', 'g'))) {
    let depth = 0;
    let j = m.index! + m[0].length - 1;
    for (; j < code.length; j++) {
      const c = code[j];
      if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push({ body: code.slice(m.index!, j + 1), at: m.index! });
  }
  return out;
}

const WORKLET_HOOKS = [
  'useDerivedValue',
  'useAnimatedStyle',
  'useFrameCallback',
  'useAnimatedReaction',
  'useAnimatedScrollHandler',
  'useAnimatedGestureHandler',
  'useAnimatedProps',
  'runOnUI',
];

const BUILTINS = new Set(
  ('Math Number String Boolean Array Object JSON Date isNaN isFinite parseInt parseFloat Infinity NaN ' +
    'Skia Float32Array Int32Array Uint8Array Map Set Symbol RegExp Error TypeError console ' +
    'if for while switch catch return typeof function new await super require delete void')
    .split(' '),
);

describe('worklets never call a function that does not exist on the UI thread', () => {
  test('no module-scope non-worklet is called inside a worklet', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const raw = readFileSync(file, 'utf8');
      if (!WORKLET_HOOKS.some((h) => raw.includes(h + '(')) && !raw.includes("'worklet'")) continue;
      const code = stripComments(raw);

      // Spans that run on the UI thread.
      const spans: [number, number][] = [];
      for (const h of WORKLET_HOOKS) {
        for (const c of callBodies(code, h)) spans.push([c.at, c.at + c.body.length]);
      }
      if (spans.length === 0) continue;

      // Module-scope definitions and whether they carry the directive.
      const defs = new Map<string, { worklet: boolean; at: number }>();
      for (const m of code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
        const head = code.slice(m.index!, m.index! + 400);
        defs.set(m[1], { worklet: /['"]worklet['"]\s*;/.test(head), at: m.index! });
      }

      const imported = new Set<string>();
      for (const m of raw.matchAll(/import\s*\{([^}]*)\}\s*from/g)) {
        for (const part of m[1].split(',')) {
          const n = part.trim().split(' as ').pop()?.trim();
          if (n) imported.add(n);
        }
      }

      const seen = new Set<string>();
      for (const [s, e] of spans) {
        for (const m of code.slice(s, e).matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
          const name = m[1];
          if (BUILTINS.has(name) || imported.has(name) || WORKLET_HOOKS.includes(name)) continue;
          const def = defs.get(name);
          if (!def || def.worklet) continue;
          // A closure DEFINED INSIDE a worklet is workletized along with it.
          if (spans.some(([a, b]) => def.at >= a && def.at <= b)) continue;
          const key = `${file}:${name}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const line = code.slice(0, s + m.index!).split('\n').length;
          offenders.push(`${rel(file)}:${line} — worklet calls ${name}()`);
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `a UI-thread worklet calls a function that does not exist there — this is a NATIVE CRASH, not an error:\n${offenders.join('\n')}`,
    );
  });

  test('the worklet twin still exists and is still a worklet', () => {
    // If `hash` lost its directive the fix would silently become the bug again.
    const viz = readFileSync(join(SRC, 'screens', 'lab', 'foundations', 'viz.tsx'), 'utf8');
    assert.match(viz, /function hash\(n: number\): number \{\s*\n\s*'worklet';/, "viz.tsx's `hash` is no longer a worklet");
    assert.match(viz, /const r = \(hash\(i \* 17\.13\) - 0\.5\) \* 2;/, 'the noise trace stopped using the worklet hash');
  });
});

describe('every native Modal may face the way the app is facing', () => {
  test('a raw react-native Modal always sets supportedOrientations', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const raw = readFileSync(file, 'utf8');
      if (!/<Modal[\s>]/.test(raw)) continue;
      // Modals from DimModal inherit the safe default; only RAW ones must say it.
      if (!/^import \{[^}]*\bModal\b[^}]*\} from 'react-native';$/m.test(raw)) continue;
      const code = stripComments(raw);
      for (const m of code.matchAll(/<Modal(?=[\s>])[\s\S]*?>/g)) {
        if (!m[0].includes('supportedOrientations')) {
          offenders.push(`${rel(file)}:${code.slice(0, m.index!).split('\n').length}`);
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

  test('the landscape lock that made this reachable still exists', () => {
    const spl = readFileSync(join(SRC, 'screens', 'tools', 'SplMeterScreen.tsx'), 'utf8');
    assert.match(spl, /'landscape'/, 'the SPL fullscreen no longer locks landscape');
  });
});

describe('the guard itself still detects the bugs it was written for', () => {
  // A sweep that finds nothing is worthless unless it can find the known case.
  test('a non-worklet call inside a worklet is detected', () => {
    const sample = [
      "function hashJs(n: number): number { return n; }",
      "const paths = useDerivedValue(() => { const r = hashJs(1); return r; }, []);",
    ].join('\n');
    const code = stripComments(sample);
    const spans = callBodies(code, 'useDerivedValue').map((c) => [c.at, c.at + c.body.length] as [number, number]);
    assert.equal(spans.length, 1, 'the worklet span was not found');
    const def = /\bfunction\s+hashJs\s*\(/.exec(code);
    assert.ok(def, 'the definition was not found');
    const insideWorklet = spans.some(([a, b]) => def!.index >= a && def!.index <= b);
    assert.equal(insideWorklet, false, 'a module-scope def was wrongly treated as an inner closure');
    assert.match(code.slice(spans[0][0], spans[0][1]), /hashJs\(/, 'the offending call was not seen');
  });

  test('comments are stripped, not scanned', () => {
    const sample = "/* Every RN <Modal> is its own window. */\n<Modal visible />";
    const code = stripComments(sample);
    assert.ok(!code.includes('RN <Modal>'), 'block comments are not being stripped');
    assert.equal([...code.matchAll(/<Modal(?=[\s>])/g)].length, 1, 'the commented Modal is still being counted');
  });
});
