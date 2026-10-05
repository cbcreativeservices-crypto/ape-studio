/**
 * Miking Labs stay OUT of the app-start graph (integrator, 2026-10-05).
 *
 * The app-start ratchet (perfStartTrim_20261004: ≤ 260 modules) only shrinks,
 * and Miking lessons keep landing (drums, speakers, hand drums, strings,
 * Lab 2 …). So no lesson may ever be reached at start: the catalog reads
 * `data/registry.ts` (metadata only, type-only imports), and every lesson's
 * model / geometry / art / pages is reached only through MikingLessonScreen,
 * which the navigator `require`s on first open (lazyScreen). Adding a lesson
 * therefore adds 0 modules to the start graph.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const strip = (s: string) => s.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const slash = (p: string) => p.split('\\').join('/');

// Same walk as perfStartTrim_20261004 / perfDecisionsB: the closure of STATIC,
// non-type imports from App.tsx (a `require` inside a function is not followed).
const EXTS = ['.tsx', '.ts', '.js', '.jsx', '.json'];
function resolveFile(fromAbs: string, spec: string): string | null {
  const base = resolve(dirname(fromAbs), spec);
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const e of EXTS) if (existsSync(base + e)) return base + e;
  for (const e of EXTS) if (existsSync(join(base, 'index' + e))) return join(base, 'index' + e);
  return null;
}
function eagerClosure(entry: string): Set<string> {
  const seen = new Set<string>();
  const walk = (abs: string) => {
    if (seen.has(abs)) return;
    seen.add(abs);
    if (abs.endsWith('.json')) return;
    const src = strip(readFileSync(abs, 'utf8'));
    for (const m of src.matchAll(/^\s*(?:import|export)\s+(?!type\b)(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/gm)) {
      if (!m[1].startsWith('.')) continue;
      const r = resolveFile(abs, m[1]);
      if (r) walk(r);
    }
  };
  walk(join(ROOT, entry));
  return new Set([...seen].map((a) => slash(relative(ROOT, a))));
}

describe('Miking lessons load lazily — never in the app-start graph', () => {
  const start = eagerClosure('App.tsx');
  const miking = [...start].filter((f) => f.startsWith('src/screens/lab/miking/'));

  it('only the metadata registry is eager; no lesson, engine, page or art module', () => {
    assert.deepEqual(miking, ['src/screens/lab/miking/data/registry.ts']);
  });

  it('the registry imports types only (so it cannot drag a lesson in)', () => {
    const s = strip(readFileSync(join(ROOT, 'src/screens/lab/miking/data/registry.ts'), 'utf8'));
    const imports = [...s.matchAll(/^\s*import\s+(type\s+)?[\s\S]*?from\s+['"][^'"]+['"]/gm)];
    assert.ok(imports.length > 0);
    for (const m of imports) assert.ok(m[1], `registry.ts has a value import: ${m[0]}`);
  });

  it('the lesson screen is reached only through the navigator’s lazy require', () => {
    const nav = strip(readFileSync(join(ROOT, 'src/navigation/RootNavigator.tsx'), 'utf8'));
    assert.match(nav, /MikingLesson: lazyScreen\(\(\) => [^\n]*require\('\.\.\/screens\/lab\/miking\/MikingLessonScreen'\)/);
    assert.doesNotMatch(nav, /^import [^;]*miking\/MikingLessonScreen'/m);
    assert.ok(!start.has('src/screens/lab/miking/MikingLessonScreen.tsx'));
    assert.ok(!start.has('src/screens/lab/miking/data/lessons.ts') && !start.has('src/screens/lab/miking/data/lessonArt.ts'));
  });
});
