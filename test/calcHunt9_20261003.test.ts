/**
 * Calc — hunt 9 (2026-10-03) receipts.
 *
 *  H9-1  A refusal never leaks the answer for free (the hunt 8 vdrop split,
 *        applied to the one other refusal that printed a computed figure).
 *        Vented port length refuses a target no port length reaches, and its
 *        words quoted fb₀ — the tuning of a zero-length port. fb₀ fixes
 *        c²·Av/Vb, so L = corr·((fb₀/fb)² − 1) answers EVERY reachable target:
 *        typing a huge target revealed the paid answer without spending a
 *        calculation. The refusal row now echoes inputs only; fb₀ rides an
 *        unmarked THE FIGURES row members still see (and the worked steps).
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
const { fmt, speedOfSoundAir } = await import('../src/screens/lab/calc/calcUnits.ts');

type Out = { label: string; text?: string; value?: number; refusal?: true };
const fnOf = (wsId: string, key: string) => {
  const f = getWorkspace(wsId)?.functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};

describe('H9-1 — a refused port length shows a free account no figure', () => {
  // 50 cm² port, 50 L box, 20 °C: a 200 Hz target is out of reach.
  const v = { av: 0.005, vb: 0.05, fbTarget: 200, temp: 20 };
  const outs = fnOf('driver', 'portLength').compute(v) as Out[];
  const c = speedOfSoundAir(20);
  const corr = 1.46 * Math.sqrt(v.av / Math.PI);
  const fb0 = (c / (2 * Math.PI)) * Math.sqrt(v.av / (v.vb * corr));

  it('is still a refusal, with its advice', () => {
    assert.equal(isRefused(outs as never), true);
    const t = (refusalRows(outs as never) as Out[]).map((o) => o.text).join(' ');
    assert.match(t, /No port length reaches 200 Hz/);
    assert.match(t, /larger port area or a smaller box/);
  });

  it('the refusal rows (all a capped account sees) carry no computed figure', () => {
    assert.ok(fb0 > 0 && fb0 < v.fbTarget);
    const free = (refusalRows(outs as never) as Out[]).map((o) => o.text ?? '').join(' ');
    assert.ok(!free.includes(fmt(fb0)), `refusal words leak fb0 ${fmt(fb0)}`);
    // Only the typed target may appear as a number.
    const nums = free.match(/\d+(\.\d+)?/g) ?? [];
    assert.deepEqual(nums, ['200'], `free words print only the input (got ${nums.join(', ')})`);
  });

  it('members still get fb0, in an unmarked row and in the steps', () => {
    const fig = outs.find((o) => o.label === 'THE FIGURES');
    assert.ok(fig && fig.refusal !== true, 'an unmarked figures row');
    assert.ok(fig!.text!.includes(`about ${fmt(fb0)} Hz`));
    const steps = (fnOf('driver', 'portLength').steps?.(v) ?? []).join(' ');
    assert.ok(steps.includes(fmt(fb0)));
  });
});

/**
 *  H9-2  70 V "how many more speakers fit": with the zone already over its
 *        usable budget the WORKED STEPS printed a negative "Room left" and
 *        then "floor(−120.6 ÷ 10) = 0 more speakers" — false arithmetic (that
 *        floor is −13). The steps now state the overage in words.
 */
describe('H9-2 — over-budget 70 V zone: the worked steps do no false arithmetic', () => {
  const f = fnOf('cv70', 'morespeakers');
  const v = { taps: [100, 100], prated: 100, tapw: 10, hr: 1 };

  it('no floor() of a negative claimed to equal 0, no negative room left', () => {
    const steps = (f.steps?.(v) ?? []).join(' ');
    assert.doesNotMatch(steps, /floor\(-/);
    assert.doesNotMatch(steps, /Room left = [^.]*= -/);
    assert.match(steps, /120\.6 W OVER that budget/);
    assert.match(steps, /0 more speakers fit/);
  });

  it('the answer itself is unchanged (None), and an in-budget zone keeps its floor() step', () => {
    const outs = f.compute(v) as Out[];
    assert.match(outs.find((o) => o.label === 'MORE SPEAKERS THAT FIT')?.text ?? '', /^None/);
    const ok = (f.steps?.({ taps: [10, 10], prated: 100, tapw: 10, hr: 1 }) ?? []).join(' ');
    assert.match(ok, /floor\(59\.43 ÷ 10\) = 5 more speakers/);
  });
});

/**
 *  H9-3  A refused calculation's shared report headlined a supporting figure
 *        as its PRIMARY RESULT. The text report prints that block as a bare
 *        value under the function's name, so a refused "Vented port length"
 *        shared as "PRIMARY RESULT 2.1 cm" — its ACOUSTIC length — which reads
 *        as the port to cut, while the answer is "no port length reaches it".
 *        A refusal has no answer to headline; its rows still list in full.
 */
describe('H9-3 — a refused result shares with no PRIMARY RESULT', async () => {
  const { buildReportFromCalc, reportToText } = await import('../src/screens/lab/calc/calcReport.ts');
  const v = { av: 0.005, vb: 0.05, fbTarget: 200, temp: 20 };
  const outs = fnOf('driver', 'portLength').compute(v) as Out[];
  const results = outs.map((o) =>
    o.value != null ? { label: o.label, formattedValue: `${fmt(o.value * 100)} cm`, isText: false } : { label: o.label, formattedValue: o.text ?? '', isText: true },
  );
  const base = { workspaceName: 'Driver & Enclosure', functionName: 'Vented port length for a target tuning', inputs: [], results, createdAtISO: '2026-10-03T12:00:00.000Z' };

  it('refused: no primary result, the rows still listed', () => {
    const r = buildReportFromCalc({ ...base, refused: true });
    assert.equal(r.primaryResult, undefined);
    const text = reportToText(r);
    assert.doesNotMatch(text, /PRIMARY RESULT/);
    assert.match(text, /No port length reaches 200 Hz/);
    assert.match(text, /EFFECTIVE \(ACOUSTIC\) LENGTH/);
  });

  it('not refused: the first numeric row still headlines (unchanged)', () => {
    const r = buildReportFromCalc(base);
    assert.equal(r.primaryResult?.label, 'EFFECTIVE (ACOUSTIC) LENGTH');
  });

  it('the calculator screen passes the refusal to the report', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/screens/lab/calc/CalcWorkspaceScreen.tsx', import.meta.url), 'utf8');
    const call = src.slice(src.indexOf('const report = buildReportFromCalc({'), src.indexOf('Share.share({ message: reportToText(report) })'));
    assert.match(call, /\n\s+refused,\n/);
  });
});
