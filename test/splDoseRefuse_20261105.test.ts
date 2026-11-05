/**
 * D53 (bug hunt 2026-11-05): the dose workspace's interval levels are a list,
 * so SPL_FIELD_RANGE never sees them. Every function that reads doseLevels
 * must refuse a level past the ceiling of air in words, never print
 * "396.99 dB", "1.358e92%" or Infinity. Valid levels still answer.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const { WORKSPACES } = await import('../src/screens/lab/calc/registry.ts');
const { SPL_CEILING_WHY, SPL_MAX_AIR_DB } = await import('../src/screens/lab/calc/calcUnits.ts');

const fns = WORKSPACES.flatMap((w) => w.functions.filter((f) => f.inputs.includes('doseLevels')));

/** The order runCompute uses: refuse first, compute only when it passes. */
const evaluate = (key: string, doseLevels: number[], doseMins: number[]) => {
  const fn = fns.find((f) => f.key === key);
  assert.ok(fn, `${key} exists`);
  const values = { doseLevels, doseMins };
  const why = fn.refuse ? fn.refuse(values) : null;
  return why ? { why, outputs: [] } : { why: null, outputs: fn.compute(values) };
};

describe('dose workspace refuses interval levels past the ceiling of air', () => {
  it('covers every function that reads the list field', () => {
    assert.deepEqual(fns.map((f) => f.key).sort(), ['doseNiosh', 'doseOsha', 'leq']);
  });

  for (const key of ['doseNiosh', 'doseOsha', 'leq']) {
    it(`${key}: refuses the reported inputs in words`, () => {
      for (const [ls, ts] of [
        [[400, 90], [10, 10]],
        [[1000], [60]],
        [[48000], [1e-9]],
        [[85, 195], [10, 10]],
      ]) {
        const r = evaluate(key, ls, ts);
        assert.equal(r.why, `${SPL_CEILING_WHY} Check the levels you entered.`, `${key} ${ls}`);
        assert.equal(r.outputs.length, 0);
      }
    });

    it(`${key}: still answers at and below the ceiling`, () => {
      for (const ls of [[85, 94, 100], [SPL_MAX_AIR_DB, 90]]) {
        const r = evaluate(key, ls, ls.map(() => 30));
        assert.equal(r.why, null, `${key} ${ls}`);
        assert.ok(r.outputs.length > 0);
      }
    });
  }

  it('leq is unchanged for a valid day', () => {
    const r = evaluate('leq', [90, 90], [10, 10]);
    const leq = r.outputs.find((o) => 'value' in o);
    assert.ok(leq && 'value' in leq);
    assert.ok(Math.abs(leq.value - 90) < 1e-9);
  });
});
