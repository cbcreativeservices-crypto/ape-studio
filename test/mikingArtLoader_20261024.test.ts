/**
 * The per-lesson ART loader (data/lessonArtLoader.ts, generated from
 * data/lessonArt.ts) — 2026-10-24: the whole art index cost 2.75 s on the
 * first Miking lesson open. Node cannot evaluate the art (react-native-svg), so
 * this checks statically: one entry per registered lesson, every required name
 * is really exported by its module, and the screen uses the loader.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const DATA = new URL('../src/screens/lab/miking/data/', import.meta.url);
const read = (u: URL) => readFileSync(u, 'utf8').replace(/\r\n/g, '\n');
const loader = read(new URL('lessonArtLoader.ts', DATA));
const registry = read(new URL('registry.ts', DATA));
const index = read(new URL('lessonArt.ts', DATA));
const screen = read(new URL('../MikingLessonScreen.tsx', DATA));

const entryIds = [...loader.matchAll(/^ {2}"(\w+)": \(\) =>/gm)].map((m) => m[1]);

test('one art entry per registered lesson, and the index has the same set', () => {
  const ids = [...registry.matchAll(/\{ id: '(\w+)', labId: '\w+', title:/g)].map((m) => m[1]).sort();
  assert.ok(ids.length > 100, `registry scan sanity: ${ids.length}`);
  assert.deepEqual([...entryIds].sort(), ids);
  // every id assigned directly in the index appears in the loader
  for (const m of index.matchAll(/^ART\.(\w+) = /gm)) assert.ok(entryIds.includes(m[1]), `${m[1]} missing from the loader`);
});

test('every name a thunk requires is exported by that module', () => {
  const exportsOf = new Map<string, string>();
  for (const m of loader.matchAll(/const \{ ([^}]+) \} = require\('([^']+)'\);/g)) {
    const mod = m[2];
    let src = exportsOf.get(mod);
    if (src === undefined) {
      const base = new URL(mod, DATA);
      const file = ['.tsx', '.ts', ''].map((x) => new URL(base.href + x)).find((u) => existsSync(u));
      assert.ok(file, `module not found: ${mod}`);
      src = read(file!);
      exportsOf.set(mod, src);
    }
    for (const name of m[1].split(',').map((s) => s.trim())) {
      const exported =
        new RegExp(`export (?:const|let|function|class|type)\\s+${name}\\b`).test(src) ||
        new RegExp(`export \\{[^}]*\\b${name}\\b[^}]*\\}`).test(src) ||
        new RegExp(`export const \\{[^}]*\\b${name}\\b`).test(src);
      assert.ok(exported, `${mod} does not export ${name}`);
    }
  }
});

test('the lesson screen resolves art through the loader', () => {
  assert.match(screen, /import \{ lessonArt \} from '\.\/data\/lessonArtLoader';/);
  assert.doesNotMatch(screen, /from '\.\/data\/lessonArt'/);
});
