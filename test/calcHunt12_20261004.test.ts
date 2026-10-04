/**
 * Calc — hunt 12 (2026-10-04) receipts.
 *
 *  H12-1 RF & Link Budget used the rounded free-space path loss constant
 *        147.56. The constant for d in metres and f in hertz is
 *        −20·log₁₀(4π/c) with c = 299 792 458 m/s exactly = 147.552 dB, so every
 *        path loss, received power and link margin was 0.008 dB off, and the
 *        formula and steps taught a constant the physics does not give (D53:
 *        the calculators are the source of truth). The wavelength step also
 *        said "c/f = 3×10⁸ ÷ f" beside an answer computed with the exact c, so
 *        a learner checking it by hand got a different 4th figure (54.55 cm vs
 *        the 54.51 cm shown at 550 MHz).
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { WORKSPACES_MICS_RF } = await import('../src/screens/lab/calc/workspaces/micsRf.ts');

const C = 299792458;
const exactFspl = (d: number, fHz: number) => 20 * Math.log10((4 * Math.PI * d * fHz) / C);

const rf = WORKSPACES_MICS_RF.find((w: { id: string }) => w.id === 'rflink')!;
const fnOf = (key: string) => rf.functions.find((f: { key: string }) => f.key === key)!;
const valueOf = (outs: { label: string; value?: number }[], label: string) => outs.find((o) => o.label === label)!.value!;

describe('H12-1 free-space path loss uses the exact constant (c = 299 792 458 m/s)', () => {
  it('path loss, received power and margin match 20·log₁₀(4πdf/c)', () => {
    const v = { dist: 50, freqMHz: 550, ptx: 10, gtx: 2, grx: 2, rxsens: -95 };
    const want = exactFspl(50, 550e6);
    const pl = fnOf('pathLoss').compute(v);
    assert.ok(Math.abs(valueOf(pl, 'FREE-SPACE PATH LOSS') - want) < 1e-9, `FSPL ${valueOf(pl, 'FREE-SPACE PATH LOSS')} vs ${want}`);
    const b = fnOf('budget').compute(v);
    assert.ok(Math.abs(valueOf(b, 'PATH LOSS') - want) < 1e-9);
    assert.ok(Math.abs(valueOf(b, 'RECEIVED POWER (dBm)') - (14 - want)) < 1e-9);
    assert.ok(Math.abs(valueOf(b, 'LINK MARGIN') - (14 - want + 95)) < 1e-9);
  });

  it('the formula, plain formula, explanation, warnings and steps all write 147.55', () => {
    const fn = fnOf('pathLoss');
    const v = { dist: 50, freqMHz: 550 };
    const texts = [fn.formula, fn.plainFormula, fn.explain, rf.warnings, rf.example, ...fn.steps(v)].join('\n');
    assert.doesNotMatch(texts, /147\.56/);
    assert.match(fn.formula, /147\.55$/);
    assert.match(fn.steps(v)[0], /− 147\.55 = /);
  });

  it('the wavelength step divides the c the answer uses', () => {
    const step = fnOf('pathLoss').steps({ dist: 50, freqMHz: 550 })[1];
    assert.doesNotMatch(step, /3×10⁸/);
    assert.match(step, /2\.998×10⁸ ÷ \S+ ≈ 54\.51 cm/);
  });
});

// ---------------------------------------------------------------------------
// Re-audit pin (NOT a receipt — passes on HEAD): hunt 11's GROUPED_BY_SPACES
// must not refuse a legitimate entry in any caller. The calculator fields,
// project values and runner imports go through parseQuantity; Production's
// cellNum calls it on the trimmed cell; Room Design's parseRoomNumber calls it
// for every shape except the lone decimal comma. fmt / fmtCarried (what a
// carried-in value is written as) never emit a separator.
// ---------------------------------------------------------------------------
const { parseQuantity, fmt, fmtCarried } = await import('../src/screens/lab/calc/calcUnits.ts');

describe('re-audit pin: real grouping and carried values still read in every caller', () => {
  it('every grouping shape a keyboard or paste source produces', () => {
    const ok: [string, number][] = [
      ['1 000', 1000], ['1 000 000', 1e6], ['1 000.5', 1000.5], ['1 000.', 1000], ['1 000e3', 1e6],
      ['1 000', 1000], ['1 000', 1000], ['1 000', 1000], ["1'000'000", 1e6], ['1_000', 1000],
      ['0.000 001', 1e-6], ['3.141 59', 3.14159], ['1 234.567 8', 1234.5678],
      ['\t42', 42], ['42\n', 42], [' -10 000 ', -10000], ['+1 000', 1000], ['.5', 0.5],
    ];
    for (const [s, n] of ok) assert.equal(parseQuantity(s), n, JSON.stringify(s));
  });

  it('a value the app itself writes into a field always reads back', () => {
    for (const x of [0, 1, -1, 0.000123, 48000, 65536, 1234567.8, 1.5e9, -2.2185, 1e-7]) {
      for (const s of [fmt(x), fmt(x, 6), fmtCarried(x, 'number'), fmtCarried(x, 'length')]) {
        assert.notEqual(parseQuantity(s), null, s);
      }
    }
  });
});
