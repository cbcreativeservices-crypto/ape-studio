/**
 * Owner ruling 2026-10-04 — Loudness & True-Peak calculator, "True-peak
 * ceiling & sample-peak margin": a NEGATIVE margin to the ceiling (the level
 * is OVER the ceiling) reads "OVER CEILING BY x dB" with the positive amount,
 * never "MARGIN TO CEILING −x dB". Positive margins and exactly 0 keep
 * "MARGIN TO CEILING". The number stays exact (D53); the boundary is decided
 * on the value as displayed, so there is never a "−0" and never an
 * "OVER CEILING BY 0". The worked steps say the same thing in words.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
const { formatOutput } = await import('../src/screens/lab/calc/calcPanel.tsx').catch(() => ({ formatOutput: null as never }));
const { fmt } = await import('../src/screens/lab/calc/calcUnits.ts');

const ws = WORKSPACES.find((w) => w.id === 'loudtp');
const fn = ws?.functions.find((f) => f.key === 'truePeakMargin');

type Out = { label: string; value?: number; quantity?: string };
const run = (samplePeak: number, lossy = 0) => {
  assert.ok(fn, 'loudtp / truePeakMargin exists');
  const outs = fn.compute({ samplePeak, lossy }) as Out[];
  const steps = (fn.steps?.({ samplePeak, lossy }) ?? []) as string[];
  const ceilingRow = outs.find((o) => /CEILING/.test(o.label) && !/RECOMMENDED/.test(o.label));
  assert.ok(ceilingRow, 'a margin/over row exists');
  return { row: ceilingRow, outs, steps };
};
const shown = (o: Out) => (formatOutput ? formatOutput(o as never, 4, 0) : `${fmt(o.value as number)} dB`);

describe('calcCeiling — OVER CEILING BY (owner ruling 2026-10-04)', () => {
  it('negative margin reads OVER CEILING BY with the positive, exact amount', () => {
    // Lossless ceiling −1 dBTP, sample peak −0.1 dBFS → margin −0.9 → OVER BY 0.9.
    const { row, outs, steps } = run(-0.1, 0);
    assert.equal(row.label, 'OVER CEILING BY');
    assert.equal(row.value, -(-1 - -0.1));
    assert.ok((row.value as number) > 0);
    assert.equal(shown(row), '0.9 dB');
    assert.ok(!outs.some((o) => o.label === 'MARGIN TO CEILING'));
    assert.ok(steps.some((s) => /0\.9 dB OVER the ceiling/.test(s)), steps.join('\n'));
    assert.ok(!steps.some((s) => /= -0\.9 dB|= −0\.9 dB/.test(s)), 'no negative margin in the steps');
  });

  it('the owner example: margin −1.3 dB shows OVER CEILING BY 1.3 dB', () => {
    // Lossy ceiling −2 dBTP, sample peak −0.7 → margin −1.3.
    const { row } = run(-0.7, 1);
    assert.equal(row.label, 'OVER CEILING BY');
    assert.equal(shown(row), '1.3 dB');
  });

  it('a positive margin keeps MARGIN TO CEILING unchanged', () => {
    const { row, steps } = run(-3, 0);
    assert.equal(row.label, 'MARGIN TO CEILING');
    assert.equal(row.value, -1 - -3);
    assert.equal(shown(row), '2 dB');
    assert.ok(steps.some((s) => s.startsWith('Margin from sample peak to the ceiling = 2 dB')));
  });

  it('exactly 0 stays MARGIN TO CEILING 0, never "-0" and never OVER BY 0', () => {
    for (const [peak, lossy] of [[-1, 0], [-2, 1]] as const) {
      const { row, steps } = run(peak, lossy);
      assert.equal(row.label, 'MARGIN TO CEILING');
      assert.ok(Object.is(row.value, 0), 'exact +0');
      assert.ok(!/^-|^−/.test(shown(row)));
      assert.ok(!steps.some((s) => /OVER the ceiling/.test(s)));
    }
  });

  it('float noise is never an OVER CEILING BY ~0, and no row ever prints a negative', () => {
    for (let p = -4; p <= 0.5001; p += 0.1) {
      for (const lossy of [0, 1]) {
        const { row } = run(Number(p.toFixed(1)), lossy);
        assert.ok((row.value as number) >= 0, `${p}/${lossy}: ${row.value}`);
        if (row.label === 'OVER CEILING BY') assert.ok((row.value as number) > 1e-9);
        assert.ok(!/^-|^−/.test(shown(row)));
      }
    }
  });
});

it('Loudness Normalization: over the ceiling also reads OVER CEILING BY (owner 2026-10-04)', () => {
  const src = readFileSync(new URL('../src/screens/lab/calc/workspaces/loudness.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /LIMITING NEEDED/);
  assert.match(src, /over > 0 \? 'OVER CEILING BY' : 'HEADROOM TO CEILING'/);
});
