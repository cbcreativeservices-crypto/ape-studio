/**
 * Calc — hunt 8 (2026-10-03) receipts.
 *
 *  H8-1  A refusal never leaks the answer for free. A capped (free/lapsed)
 *        account reads ONLY the refusal rows of a refused result, without
 *        spending a calculation (215d7f25, "do 1"). Voltage drop's refusal
 *        words printed the cable's ROUND-TRIP RESISTANCE — that calculator's
 *        first answer — plus I·R and the short-circuit current, so typing a
 *        huge CURRENT revealed any cable's resistance for free. The refusal
 *        row now echoes inputs only; the figures ride a separate, unmarked
 *        row that members (and the worked steps) still show.
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
      for (const ext of ['.ts', '.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const { refusalRows, isRefused } = await import('../src/screens/lab/calc/calcTypes.ts');
const { fmt } = await import('../src/screens/lab/calc/calcUnits.ts');

type Out = { label: string; text?: string; value?: number; refusal?: true };
const fnOf = (wsId: string, key: string) => {
  const f = getWorkspace(wsId)?.functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};

describe('H8-1 — a refused voltage drop shows a free account no figure', () => {
  // 50 A over 100 m of 18 AWG from 12 V: I·R is far past the supply.
  const v = { awg: 18, len: 100, current: 50, vsrc: 12 };
  const outs = fnOf('vdrop', 'drop').compute(v) as Out[];
  const R = (outs.find((o) => o.label === 'ROUND-TRIP RESISTANCE')?.value ?? NaN) as number;

  it('is still a refusal, with the same words the earlier receipts pin', () => {
    assert.equal(isRefused(outs as never), true);
    const t = (refusalRows(outs as never) as Out[]).map((o) => o.text).join(' ');
    assert.match(t, /cannot deliver 50 A over this cable/);
    assert.match(t, /more than the 12 V supply/);
  });

  it('the refusal rows (all a capped account sees) carry no computed figure', () => {
    assert.ok(Number.isFinite(R) && R > 0);
    const free = (refusalRows(outs as never) as Out[]).map((o) => o.text ?? '').join(' ');
    for (const figure of [fmt(R), fmt(50 * R), fmt(12 / R)]) {
      assert.ok(!free.includes(figure), `refusal words leak ${figure}`);
    }
    assert.doesNotMatch(free, /Ω/, 'no resistance in the free words');
  });

  it('members still get the figures, in an unmarked row and in the steps', () => {
    const fig = outs.find((o) => o.label === 'THE FIGURES');
    assert.ok(fig && fig.refusal !== true, 'an unmarked figures row');
    assert.ok(fig!.text!.includes(`${fmt(R)} Ω`));
    assert.ok(fig!.text!.includes(`${fmt(50 * R)} V`));
    const steps = (fnOf('vdrop', 'drop').steps?.(v) ?? []).join(' ');
    assert.match(steps, /model breaks down/);
    assert.ok(steps.includes(`${fmt(R)} Ω`));
  });
});
