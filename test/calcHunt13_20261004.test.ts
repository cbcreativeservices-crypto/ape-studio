/**
 * Calc — hunt 13 (2026-10-04) receipts.
 *
 *  H13-1 Transmission Loss (mass law) printed an IMPOSSIBLE negative isolation
 *        (D53). TL = 20·log₁₀(m·f) − 47 drops below 0 dB once m·f < 10^(47/20)
 *        ≈ 224: a 2 kg/m² panel at 63 Hz read TRANSMISSION LOSS "−0.98 dB", a
 *        1 kg/m² blanket at 125 Hz "−5.1 dB" — a wall that makes sound louder,
 *        with a SEND → offering it to the next calculator and a capped account
 *        charged a weekly calculation for it. The MASS-LAW TL BY BAND table
 *        printed the same negative figures. Now: a refusal in words (costs
 *        nothing, feeds no workflow step), and "below the mass law" in the
 *        table's affected bands.
 *  H13-2 Compressor "Threshold for a target gain reduction" at a ratio BELOW
 *        1:1 told the learner "At 0.5:1 the compressor makes no gain reduction"
 *        (an expander RAISES the level) and its steps said "At 1:1" for the
 *        0.5 they typed. Now the same NOT A COMPRESSOR RATIO words as the
 *        forward function.
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

const { WORKSPACES_ROOMS_ADVANCED } = await import('../src/screens/lab/calc/workspaces/roomsAdvanced.ts');
const { WORKSPACES_DYNAMICS } = await import('../src/screens/lab/calc/workspaces/dynamics.ts');
const { isRefused } = await import('../src/screens/lab/calc/calcTypes.ts');

type Out = { label: string; value?: number; text?: string; refusal?: true };
const fnOf = (list: { id: string; functions: { key: string }[] }[], ws: string, key: string) =>
  list.find((w) => w.id === ws)!.functions.find((f) => f.key === key)! as unknown as {
    compute: (v: Record<string, number>) => Out[];
    steps: (v: Record<string, number>) => string[];
    table?: (v: Record<string, number>) => { rows: string[][] };
  };

describe('H13-1 mass-law transmission loss never prints a negative isolation', () => {
  const tl = fnOf(WORKSPACES_ROOMS_ADVANCED, 'transloss', 'massTL');

  it('a light panel at a low frequency is refused in words, with no number', () => {
    for (const v of [{ mass: 2, f: 63 }, { mass: 1, f: 125 }, { mass: 4, f: 30 }]) {
      const outs = tl.compute(v);
      assert.ok(isRefused(outs as never), `m=${v.mass} f=${v.f} must be a refusal`);
      assert.ok(outs.every((o) => !('value' in o) || (o.value as number) >= 0), JSON.stringify(outs));
      assert.match(outs[0].text!, /outside the mass law/);
      assert.match(tl.steps(v).join(' '), /outside the mass law/);
      assert.doesNotMatch(tl.steps(v).join(' '), /= −?-?\d+(\.\d+)? dB\./);
    }
  });

  it('inside the mass law the answer is unchanged (25 kg/m² at 125 Hz ≈ 22.9 dB)', () => {
    const outs = tl.compute({ mass: 25, f: 125 });
    assert.equal(isRefused(outs as never), false);
    const want = 20 * Math.log10(25 * 125) - 47;
    assert.ok(Math.abs(outs.find((o) => o.label === 'TRANSMISSION LOSS')!.value! - want) < 1e-12);
    assert.ok(Math.abs(outs.find((o) => o.label === 'TL ONE OCTAVE UP')!.value! - (want + 20 * Math.log10(2))) < 1e-12);
  });

  it('the band table says "below the mass law" instead of a negative TL', () => {
    const rows = tl.table!({ mass: 1, f: 125 }).rows;
    for (const [, cell] of rows) assert.doesNotMatch(cell, /^[−-]\d/, `negative TL in table: ${cell}`);
    assert.equal(rows[0][1], 'below the mass law'); // 1 × 125 < 224
    assert.match(rows[1][1], /^\d/); // 1 × 250 > 224 → a real figure
  });
});

describe('H13-2 compressor threshold solve below 1:1 says it is not a compressor ratio', () => {
  const thr = fnOf(WORKSPACES_DYNAMICS, 'compressor', 'thrForGr');

  it('0.5:1 is refused with the not-a-compressor words, and the steps never say "At 1:1"', () => {
    const v = { inLvl: -8, ratio: 0.5, targetGr: 3 };
    const outs = thr.compute(v);
    assert.ok(isRefused(outs as never));
    assert.equal(outs[0].label, 'NOT A COMPRESSOR RATIO');
    assert.match(outs[0].text!, /0\.5:1 is not compression/);
    assert.doesNotMatch(thr.steps(v).join(' '), /At 1:1/);
  });

  it('exactly 1:1 still says no threshold exists', () => {
    const outs = thr.compute({ inLvl: -8, ratio: 1, targetGr: 3 });
    assert.equal(outs[0].label, 'NO THRESHOLD');
    assert.match(thr.steps({ inLvl: -8, ratio: 1, targetGr: 3 })[0], /At 1:1/);
  });
});
