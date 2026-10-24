/**
 * The app's per-lesson loader (data/lessonLoader.ts, generated) must serve the
 * SAME lesson objects as the eager table (data/lessons.ts) — 2026-10-23: the
 * first Miking lesson open froze ~15 s because the screen imported the eager
 * table (10.9 s of it on a Pixel 7 Pro). Node cannot run the loader's
 * `require` thunks, so this resolves each entry's module + accessor itself.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';

const DATA = new URL('../src/screens/lab/miking/data/', import.meta.url);
const loader = readFileSync(new URL('lessonLoader.ts', DATA), 'utf8').replace(/\r\n/g, '\n');
const registry = readFileSync(new URL('registry.ts', DATA), 'utf8').replace(/\r\n/g, '\n');
const screen = readFileSync(new URL('../MikingLessonScreen.tsx', DATA), 'utf8').replace(/\r\n/g, '\n');

const entries = [...loader.matchAll(/^ {2}"(\w+)": \(\) => require\('([^']+)'\)\.(\w+)(?:\["(\w+)"\])?,$/gm)].map((m) => ({
  id: m[1],
  mod: m[2],
  sym: m[3],
  key: m[4],
}));

test('the loader has one entry per registered lesson', () => {
  const ids = [...registry.matchAll(/\{ id: '(\w+)', labId: '\w+', title:/g)].map((m) => m[1]).sort();
  assert.ok(ids.length > 100, `registry scan sanity: ${ids.length}`);
  assert.deepEqual(entries.map((e) => e.id).sort(), ids);
});

test('every loader entry returns the same object as the eager table', async () => {
  for (const e of entries) {
    const ns = (await import(new URL(e.mod, DATA).href)) as Record<string, unknown>;
    const v = e.key ? (ns[e.sym] as Record<string, unknown>)[e.key] : ns[e.sym];
    assert.ok(v, `${e.id}: ${e.mod} has no ${e.sym}${e.key ? `["${e.key}"]` : ''}`);
    assert.equal(v, lessonById(e.id), `${e.id}: loader and data/lessons.ts disagree`);
  }
});

test('the lesson screen resolves lessons through the loader, never the eager table', () => {
  assert.match(screen, /import \{ lessonById \} from '\.\/data\/lessonLoader';/);
  assert.doesNotMatch(screen, /from '\.\/data\/lessons'/);
});
