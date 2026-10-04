/**
 * Calculator check A (2026-10-03) — FORMULA ACCURACY, the workspaces only.
 *
 * Every function in every workspace was re-checked against its reference
 * (Sabine/Eyring, OSHA 1910.95 / NIOSH, Thiele–Small, Ohm's law, AWG geometry,
 * Friis, BS.1770 …), re-computed independently at its placeholder inputs, and
 * fuzzed (500 random valid inputs + 0 / tiny / huge / range-end boundaries).
 * The formulas held. What did not hold were EDGES — answers no physics allows,
 * or words the maths denies:
 *
 * A1  Compressor › output: ratio 0 divided by zero ("—" output beside a real
 *     INPUT ABOVE THRESHOLD); 0.5:1 put the output ABOVE the input.
 * A2  Exposure › Leq: durations adding to 0 min → a bare "—" Leq.
 * A3  Sabine › absorption needed: the placeholder room itself read a NEGATIVE
 *     "ABSORPTION TO ADD" (−0.3333 m²) with no words.
 * A4  Treatment planner: a target longer than the current RT60 read a negative
 *     ΔA with no words; a 0 m² / α 0 panel read "PREDICTED RT60 WITH — PANELS".
 * A5  Voltage drop: I·R past the supply gave a NEGATIVE voltage at the load, a
 *     drop over 100 %, and more power "lost" than the supply gives; its steps
 *     wrote −1 AWG as "-1 AWG" (the hunt-6 "-7 AWG" class — it is 2/0).
 * A6  Eyring: ā ≥ 1 took ln(0) / ln(negative) → "—" Eyring beside a Sabine
 *     figure, and ā = 1 printed an Eyring RT60 of 0 s.
 * A7  FIR length: 0 dB stopband → 0 taps and a NEGATIVE latency; a 0-tap
 *     filter's latency likewise read −0.5 samples.
 * A8  70 V line: an overloaded amp read "REMAINING AMP CAPACITY −80 W".
 * A9  Q & bandwidth › reach: 0 dB of gain read "a 0 dB boost is still audibly
 *     shifting energy beyond …".
 * A10 Driver excursion steps said "Peak RMS pressure" — it is the RMS pressure
 *     at full excursion.
 * A11 Adding sources › needed: 0 dB read "You need 1 sources (next whole
 *     number above 1×)"; an exact 4× read "above 4×".
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The workspaces use Metro-style extensionless imports (see calcDegenerate).
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

const fn = (ws: string, key: string) => {
  const w = getWorkspace(ws);
  assert.ok(w, `workspace ${ws}`);
  const f = w.functions.find((x) => x.key === key);
  assert.ok(f, `${ws}.${key}`);
  return f;
};
type Out = { label: string; value?: number; quantity?: string; text?: string };
type V = Record<string, number | number[]>;
const outs = (ws: string, key: string, v: V) => fn(ws, key).compute(v) as Out[];
const steps = (ws: string, key: string, v: V) => (fn(ws, key).steps?.(v) ?? []).join(' ');
const row = (o: Out[], label: string) => o.find((x) => x.label === label);
const num = (o: Out[], label: string) => {
  const r = row(o, label);
  assert.ok(r && typeof r.value === 'number', `numeric row ${label}`);
  return r.value as number;
};
/** No numeric row may be NaN/∞ (a "—" on the glass) or a negative physical amount. */
const allHonest = (o: Out[]) => {
  for (const r of o) {
    if (typeof r.value !== 'number') continue;
    assert.ok(Number.isFinite(r.value), `${r.label} is ${r.value}`);
    if (['area', 'voltage', 'power', 'time', 'samples', 'length'].includes(r.quantity ?? '')) {
      assert.ok(r.value >= 0, `${r.label} is negative (${r.value})`);
    }
  }
};

describe('A1 — compressor output never divides by a ratio below 1:1', () => {
  for (const ratio of [0, 0.5]) {
    it(`ratio ${ratio}:1 says it is not a compressor ratio — no "—" output, no output above input`, () => {
      const v = { thr: -20, ratio, inLvl: -8 };
      const o = outs('compressor', 'outFromRatio', v);
      allHonest(o);
      assert.equal(row(o, 'OUTPUT LEVEL'), undefined, 'no output level is claimed');
      assert.match(row(o, 'NOT A COMPRESSOR RATIO')?.text ?? '', /not compression/);
      assert.match(steps('compressor', 'outFromRatio', v), /not compression/);
    });
  }
  it('the normal case is untouched: −8 in, −20 threshold, 4:1 → −17 out, 9 dB GR', () => {
    const o = outs('compressor', 'outFromRatio', { thr: -20, ratio: 4, inLvl: -8 });
    assert.equal(num(o, 'OUTPUT LEVEL'), -17);
    assert.equal(num(o, 'GAIN REDUCTION'), 9);
  });
});

describe('A2 — Leq over no time says so', () => {
  it('durations adding to 0 min give words, not a "—" Leq', () => {
    const v = { doseLevels: [85, 94], doseMins: [0, 0] };
    const o = outs('dose', 'leq', v);
    allHonest(o);
    assert.equal(row(o, 'Leq OVER THE INTERVALS'), undefined);
    assert.match(row(o, 'NO TIME TO AVERAGE')?.text ?? '', /no time to average/);
    assert.match(steps('dose', 'leq', v), /no time to average/);
  });
  it('the placeholder day is untouched (≈ 92.23 dB)', () => {
    const o = outs('dose', 'leq', { doseLevels: [85, 94, 100], doseMins: [240, 90, 30] });
    assert.ok(Math.abs(num(o, 'Leq OVER THE INTERVALS') - 92.233) < 0.001);
  });
});

describe('A3 — Sabine › absorption needed never asks you to add a negative area', () => {
  it('the placeholder room (54 m² already, 53.67 m² needed) adds 0 m² and says why', () => {
    const v = { vol: 100, targetRt: 0.3, absA: 54 };
    const o = outs('sabine', 'neededA', v);
    allHonest(o);
    assert.equal(num(o, 'ABSORPTION TO ADD'), 0);
    assert.match(row(o, 'ALREADY ENOUGH ABSORPTION')?.text ?? '', /already has 54 m² .*add none/);
    assert.match(steps('sabine', 'neededA', v), /nothing to add/);
  });
  it('a real shortfall is untouched: 100 m³, 0.3 s, 20 m² → 33.67 m² to add', () => {
    const o = outs('sabine', 'neededA', { vol: 100, targetRt: 0.3, absA: 20 });
    assert.ok(Math.abs(num(o, 'ABSORPTION TO ADD') - 33.667) < 0.001);
    assert.equal(row(o, 'ALREADY ENOUGH ABSORPTION'), undefined);
  });
});

describe('A4 — treatment planner: no negative ΔA, no "— PANELS"', () => {
  it('a target longer than the current decay needs 0 panels and says so', () => {
    const v = { vol: 150, rtCur: 0.5, rtTgt: 1.2, panelArea: 2.88, alpha: 0.9 };
    const o = outs('treatment', 'panels', v);
    allHonest(o);
    assert.equal(num(o, 'ABSORPTION TO ADD ΔA'), 0);
    assert.equal(num(o, 'PANELS NEEDED'), 0);
    assert.match(row(o, 'ALREADY ENOUGH ABSORPTION')?.text ?? '', /add none/);
    assert.match(steps('treatment', 'panels', v), /no shortfall/);
  });
  it('a panel that absorbs nothing is refused, not counted as "—" panels', () => {
    const base = { vol: 150, rtCur: 1.2, rtTgt: 0.5, panelArea: 2.88, alpha: 0.9 };
    assert.throws(() => outs('treatment', 'panels', { ...base, panelArea: 0 }));
    assert.throws(() => outs('treatment', 'panels', { ...base, alpha: 0 }));
    assert.equal(num(outs('treatment', 'panels', base), 'PANELS NEEDED'), 11);
  });
});

describe('A5 — voltage drop past the supply says the model breaks down', () => {
  // 3 A over 300 m of 16 AWG is a 23.7 V drop — from a 12 V supply.
  const v = { awg: 16, len: 300, current: 3, vsrc: 12 };
  it('no negative VOLTAGE AT LOAD, no drop over 100 %, and the words say why', () => {
    const o = outs('vdrop', 'drop', v);
    allHonest(o);
    assert.equal(row(o, 'VOLTAGE AT LOAD'), undefined);
    assert.equal(row(o, 'DROP AS PERCENT'), undefined);
    const t = row(o, 'MODEL BREAKS DOWN')?.text ?? '';
    assert.match(t, /cannot deliver 3 A over this cable/);
    assert.match(t, /more than the 12 V supply/);
    assert.match(steps('vdrop', 'drop', v), /model breaks down/);
  });
  it('the placeholder run is untouched (2.371 V, 45.63 V at the load)', () => {
    // ρ = 1/58 µΩ·m exactly (IACS) since the 2026-10-04 audit — was 1.724e-8.
    const o = outs('vdrop', 'drop', { awg: 16, len: 30, current: 3, vsrc: 48 });
    assert.ok(Math.abs(num(o, 'VOLTAGE DROP') - 2.3714) < 1e-4);
    assert.ok(Math.abs(num(o, 'VOLTAGE AT LOAD') - 45.6286) < 1e-4);
  });
  it('the steps write −1 AWG as 2/0 AWG, never "-1 AWG"', () => {
    const s = steps('vdrop', 'drop', { awg: -1, len: 30, current: 3, vsrc: 48 });
    assert.match(s, /2\/0 AWG/);
    assert.doesNotMatch(s, /-1 AWG/);
  });
});

describe('A6 — Eyring refuses ā outside (0, 1)', () => {
  for (const aBar of [1, 1.5]) {
    it(`ā = ${aBar} is refused, not a "—" or 0 s Eyring RT60`, () => {
      assert.throws(() => outs('eyring', 'eyring', { vol: 120, surf: 160, aBar }));
    });
  }
  it('ā = 0.3 is untouched (0.3385 s)', () => {
    assert.ok(Math.abs(num(outs('eyring', 'eyring', { vol: 120, surf: 160, aBar: 0.3 }), 'RT60 (EYRING)') - 0.33854) < 1e-5);
  });
});

describe('A7 — FIR latency is never negative', () => {
  it('0 dB of stopband (0 taps) is refused', () => {
    assert.throws(() => outs('firlen', 'sizeTaps', { sr: 48000, trans: 100, atten: 0 }));
  });
  it('a 0-tap filter is refused', () => {
    assert.throws(() => outs('firlen', 'latency', { sr: 48000, taps: 0 }));
  });
  it('the placeholder is untouched: 1310 taps, 654.5 samples', () => {
    const o = outs('firlen', 'sizeTaps', { sr: 48000, trans: 100, atten: 60 });
    assert.equal(num(o, 'FILTER TAPS (N)'), 1310);
    assert.equal(num(o, 'LATENCY IN SAMPLES'), 654.5);
    assert.equal(num(outs('firlen', 'latency', { sr: 48000, taps: 1 }), 'LATENCY IN SAMPLES'), 0);
  });
});

describe('A8 — an overloaded 70 V amp has no NEGATIVE capacity', () => {
  it('330 W of taps on a 250 W amp reads "OVER THE AMP RATING BY 80 W"', () => {
    const o = outs('cv70', 'load', { taps: Array(33).fill(10), prated: 250, vline: 70.7, hr: 2 });
    allHonest(o);
    assert.equal(row(o, 'REMAINING AMP CAPACITY'), undefined);
    assert.equal(num(o, 'OVER THE AMP RATING BY'), 80);
    assert.ok(row(o, 'OVERLOADED'));
  });
  it('the placeholder still reads 130 W remaining', () => {
    assert.equal(num(outs('cv70', 'load', { taps: Array(12).fill(10), prated: 250, vline: 70.7, hr: 2 }), 'REMAINING AMP CAPACITY'), 130);
  });
});

describe('A9 — a 0 dB bell is not "still audibly shifting energy"', () => {
  it('0 dB says the bell changes nothing', () => {
    const v = { fc: 1000, q: 1.41, gain: 0 };
    const t = row(outs('qbw', 'paramReach', v), 'AUDIBLE REACH')?.text ?? '';
    assert.doesNotMatch(t, /still audibly shifting/);
    assert.match(t, /changes nothing/);
    assert.doesNotMatch(steps('qbw', 'paramReach', v), /expect the move to be audible/);
  });
  it('a 9 dB boost keeps its reach wording', () => {
    assert.match(row(outs('qbw', 'paramReach', { fc: 1000, q: 1.41, gain: 9 }), 'AUDIBLE REACH')?.text ?? '', /9 dB boost is still audibly shifting/);
  });
});

describe('A10 — excursion steps name the pressure correctly', () => {
  it('RMS at full excursion, not "Peak RMS"', () => {
    const s = steps('driver', 'excursionSPL', { sd: 0.05, xmax: 0.005, f: 40, dist: 1 });
    assert.doesNotMatch(s, /Peak RMS/);
    assert.match(s, /RMS pressure at full excursion/);
  });
});

describe('A11 — sources needed: whole multiples are not "rounded above"', () => {
  it('0 dB needs 1 source, singular, no "next whole number above 1×"', () => {
    const t = row(outs('spladd', 'needed', { delta: 0 }), 'PRACTICAL ANSWER')?.text ?? '';
    assert.match(t, /^You need 1 source \(/);
    assert.doesNotMatch(t, /above 1×/);
  });
  it('6 dB still needs 4 sources (3.981×)', () => {
    assert.match(row(outs('spladd', 'needed', { delta: 6 }), 'PRACTICAL ANSWER')?.text ?? '', /^You need 4 sources \(3\.981× rounded up/);
  });
});
