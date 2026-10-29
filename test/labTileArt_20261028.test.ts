/**
 * Labs menu tile art (owner 2026-10-28/29): 16 Audio Fundamentals + 47 Advanced Training images.
 * Each art entry must name a real lab in labCatalog.ts (a renamed lab would
 * silently lose its picture), each file must exist, and every Audio
 * Fundamentals lab has one.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(spec)) {
      for (const ext of ['.ts', '.tsx']) {
        const c = new URL(spec + ext, ctx.parentURL);
        if (existsSync(fileURLToPath(c))) return { url: c.href, shortCircuit: true };
      }
    }
    return next(spec, ctx);
  },
});
const { LAB_CATEGORIES } = await import('../src/screens/lab/labCatalog.ts');

const root = join(import.meta.dirname, '..');
const src = readFileSync(join(root, 'src/screens/lab/labTileArt.ts'), 'utf8').replace(/\r\n/g, '\n');
const entries = [...src.matchAll(/^\s*'([^']+)': require\('\.\.\/\.\.\/\.\.\/(assets\/lab-tiles\/[^']+\.webp)'\),$/gm)].map((m) => ({ name: m[1], file: m[2] }));

function leafNames(section: 'fundamentals' | 'training'): string[] {
  return LAB_CATEGORIES.filter((c) => c.section === section).flatMap((c) => {
    const cc = c as unknown as { labs?: { name: string }[]; families?: { labs: { name: string }[] }[]; extraLabs?: { name: string }[] };
    return [...(cc.labs ?? []), ...(cc.families ?? []).flatMap((f) => f.labs), ...(cc.extraLabs ?? [])].map((l) => l.name);
  });
}

describe('Labs menu tile art', () => {
  it('has 16 entries, each a real lab, each file present', () => {
    assert.equal(entries.length, 63);
    const all = new Set([...leafNames('fundamentals'), ...leafNames('training')]);
    for (const e of entries) {
      assert.ok(all.has(e.name), `${e.name} is not a lab name in labCatalog.ts`);
      assert.ok(existsSync(join(root, e.file)), `${e.file} missing`);
    }
  });
  it('every Audio Fundamentals lab has its art', () => {
    const have = new Set(entries.map((e) => e.name));
    assert.deepEqual(leafNames('fundamentals').filter((n) => !have.has(n)), []);
  });
  it('every Advanced Training lab has its art', () => {
    const have = new Set(entries.map((e) => e.name));
    assert.deepEqual(leafNames('training').filter((n) => !have.has(n)), []);
  });
  it('every Calculator Lab section tile has its art, and the screen passes it', () => {
    const calc = [...src.matchAll(/^\s{2}(\w+): require\('\.\.\/\.\.\/\.\.\/(assets\/lab-tiles\/calc-[^']+\.webp)'\),$/gm)].map((m) => ({ id: m[1], file: m[2] }));
    const reg = readFileSync(join(root, 'src/screens/lab/calc/registry.ts'), 'utf8');
    const ids = [...reg.slice(reg.indexOf('export const SECTION_META'), reg.indexOf('export const COMING_SOON')).matchAll(/\{ id: '(\w+)'/g)].map((m) => m[1]);
    assert.equal(ids.length, 10);
    assert.deepEqual(calc.map((c) => c.id).sort(), [...ids].sort());
    for (const c of calc) assert.ok(existsSync(join(root, c.file)), `${c.file} missing`);
    assert.match(readFileSync(join(root, 'src/screens/lab/calc/CalcLabScreen.tsx'), 'utf8'), /backgroundImage=\{calcTileArt\(sec\.id\)\}/);
  });
  it('the Labs screen passes it to the tile, and the tile shades it for legible text', () => {
    const screen = readFileSync(join(root, 'src/screens/lab/EarLabScreen.tsx'), 'utf8');
    assert.match(screen, /backgroundImage=\{labTileArt\(leaf\.name\)\}/);
    const tile = readFileSync(join(root, 'src/screens/tools/GlassTile.tsx'), 'utf8');
    assert.match(tile, /<Image source=\{backgroundImage\} resizeMode="cover"/);
    assert.match(tile, /colors=\{\['rgba\(5,6,10,0\.88\)'/);
  });
});
