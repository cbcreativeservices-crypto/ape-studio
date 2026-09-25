/**
 * Lab photograph maps stay honest (2026-09-25).
 *
 * The three Cable Install art maps (cable types, Stage 5 supports, Final
 * Inspection defects) are `Partial<Record<id, number>>` filled with
 * `require('…webp')` lines as Computer C delivers each photograph. Two things
 * go wrong silently at that moment: a key that is not a real lab id (the photo
 * never shows, nobody notices) and a path to a file that is not there (Metro
 * fails only at bundle time). Both are caught here by reading the source
 * files as text — no RN import, no Metro.
 */
import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'src/screens/lab/cableinstall/data');

const read = (p: string) => readFileSync(p, 'utf8');

/** `key: require('…')` entries of an art map (comments excluded). */
function entries(file: string): { key: string; rel: string }[] {
  const src = read(file).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const out: { key: string; rel: string }[] = [];
  const re = /^\s*'?([\w-]+)'?:\s*require\('([^']+)'\)/gm;
  for (let m = re.exec(src); m; m = re.exec(src)) out.push({ key: m[1], rel: m[2] });
  return out;
}

const ids = (file: string, re: RegExp) => new Set([...read(file).matchAll(re)].map((m) => m[1]));

const MAPS: { map: string; idsFrom: string; idRe: RegExp; what: string }[] = [
  { map: 'cableTypeArt.ts', idsFrom: 'cableTypes.ts', idRe: /^\s+id: '([\w-]+)',$/gm, what: 'cable type' },
  { map: 'supportArt.ts', idsFrom: 'scenarios.ts', idRe: /^\s+\{ id: '([\w-]+)', name: '[^']*', ok: /gm, what: 'support item' },
  { map: 'defectArt.ts', idsFrom: 'mistakes.ts', idRe: /^\s+\{ id: '([\w-]+)', name: /gm, what: 'mistake' },
];

describe('cable install photo maps', () => {
  for (const { map, idsFrom, idRe, what } of MAPS) {
    it(`${map}: every key is a real ${what} id and every file exists`, () => {
      const known = ids(resolve(DATA, idsFrom), idRe);
      assert.ok(known.size > 5, `${idsFrom}: id pattern matched ${known.size} ids`);
      for (const { key, rel } of entries(resolve(DATA, map))) {
        assert.ok(known.has(key), `${map}: '${key}' is not a ${what} id in ${idsFrom}`);
        const abs = resolve(DATA, rel);
        assert.ok(existsSync(abs) && statSync(abs).isFile(), `${map}: '${key}' → missing file ${rel}`);
        assert.ok(rel.endsWith('.webp'), `${map}: '${key}' must point at a bundled .webp, got ${rel}`);
      }
    });
  }

  it('cableTypeArt.ts covers every cable type except the ones still waiting on a photograph', () => {
    const known = ids(resolve(DATA, 'cableTypes.ts'), /^\s+id: '([\w-]+)',$/gm);
    const have = new Set(entries(resolve(DATA, 'cableTypeArt.ts')).map((e) => e.key));
    const missing = [...known].filter((k) => !have.has(k));
    // group-2-14 (extension cord) is on Computer C's list; anything else
    // missing means a cable type was added without its workbench photo.
    assert.deepEqual(missing, ['extension']);
  });
});
