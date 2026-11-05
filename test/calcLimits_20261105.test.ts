/**
 * D53, owner-approved limits (2026-11-05, report item 3): an input outside
 *   limiter safety margin        0 to 60 dB
 *   compressor target GR         0 to 60 dB
 *   SPL                          -20 to 194 dB
 *   Q                            0.1 to 100
 * is refused in words, never printed as a number. The report's cases: margin
 * 500 printed -500.75 dBu, target GR 500 printed -676.67 dBFS, mic SPL -1000
 * printed -1137 dBV, Q 0.0001 printed 26.6 octaves. Valid inputs answer exactly
 * as before; the pinned figures below were read from the code before the limits.
 *
 * The limits are written out here on purpose: this file must fail if the shared
 * constant drifts from what the owner approved.
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
const { WORKSPACES_SPL } = await import('../src/screens/lab/calc/workspaces/splSafety.ts');
const { WORKSPACES_DYNAMICS } = await import('../src/screens/lab/calc/workspaces/dynamics.ts');
const { WORKSPACES_LEVELS } = await import('../src/screens/lab/calc/workspaces/levels.ts');

type Values = Record<string, number | number[]>;

const allFns = WORKSPACES.flatMap((w) => w.functions);
const fnOf = (key: string) => {
  const hits = allFns.filter((f) => f.key === key);
  assert.equal(hits.length, 1, `${key} is one function`);
  return hits[0]!;
};
/** The order runCompute uses: refuse first, compute only when it passes. */
const evaluate = (key: string, values: Values) => {
  const fn = fnOf(key);
  const why = fn.refuse ? fn.refuse(values) : null;
  return why ? { why, outputs: [] } : { why: null, outputs: fn.compute(values) };
};
const refuses = (key: string, values: Values, wordsRe: RegExp) => {
  const r = evaluate(key, values);
  assert.ok(r.why, `${key} must refuse ${JSON.stringify(values)}`);
  assert.match(r.why!, wordsRe);
  assert.equal(r.outputs.length, 0);
};
const answers = (key: string, values: Values) => {
  const r = evaluate(key, values);
  assert.equal(r.why, null, `${key} must answer ${JSON.stringify(values)}`);
  assert.ok(r.outputs.length > 0);
  return r.outputs;
};
const valueOf = (outputs: { label: string }[], label: string): number => {
  const o = outputs.find((x) => x.label === label) as { value?: number } | undefined;
  assert.ok(o && typeof o.value === 'number', `output ${label}`);
  return o.value!;
};

const LIMITER = { pwr: 500, z: 8, ampGain: 32 };
const COMP = { inLvl: -8, ratio: 4 };
const FLOOR = /−20/;

describe('the report cases are refused in words', () => {
  it('limiter margin 500 dB', () => refuses('threshold', { ...LIMITER, margin: 500 }, /0 to 60 dB/));
  it('compressor target gain reduction 500 dB', () => refuses('thrForGr', { ...COMP, targetGr: 500 }, /0 to 60 dB/));
  it('mic output at -1000 dB SPL', () => refuses('micout', { sens: 2, spl: -1000 }, FLOOR));
  it('Q 0.0001', () => refuses('octFromQ', { q: 0.0001 }, /0\.1 to 100/));
});

describe('each limit holds at both edges', () => {
  it('limiter margin 0 to 60', () => {
    answers('threshold', { ...LIMITER, margin: 0 });
    answers('threshold', { ...LIMITER, margin: 60 });
    refuses('threshold', { ...LIMITER, margin: 60.01 }, /0 to 60 dB/);
  });
  it('compressor target gain reduction 0 to 60', () => {
    answers('thrForGr', { ...COMP, targetGr: 0 });
    answers('thrForGr', { ...COMP, targetGr: 60 });
    refuses('thrForGr', { ...COMP, targetGr: 60.01 }, /0 to 60 dB/);
  });
  it('Q 0.1 to 100', () => {
    for (const [key, base] of [['bwFromQ', { fc: 1000 }], ['octFromQ', {}], ['paramReach', { fc: 1000, gain: 9 }]] as const) {
      answers(key, { ...base, q: 0.1 });
      answers(key, { ...base, q: 100 });
      refuses(key, { ...base, q: 0.0999 }, /0\.1 to 100/);
      refuses(key, { ...base, q: 100.01 }, /0\.1 to 100/);
    }
  });
});

describe('the SPL floor reaches every level input', () => {
  const cases: [string, Values, string][] = [
    ['point', { d1: 1, d2: 8 }, 'l1'],
    ['line', { d1: 1, d2: 8 }, 'l1'],
    ['custom', { d1: 1, d2: 8, rate: 4.5 }, 'l1'],
    ['required', { d1: 1, d2: 8 }, 'lTarget'],
    ['identical', { count: 4 }, 'lvl'],
    ['dominance', { lb: 84 }, 'la'],
    ['dominance', { la: 95 }, 'lb'],
    ['allowNiosh', {}, 'lex'],
    ['allowOsha', {}, 'lex'],
    ['micout', { sens: 2 }, 'spl'],
    // Target -100 dBu keeps the -20 dB SPL case inside the 75 dB preamp limit.
    ['gain', { sens: 2, target: -100, headroom: 12 }, 'spl'],
  ];
  for (const [key, base, field] of cases) {
    it(`${key}.${field}`, () => {
      answers(key, { ...base, [field]: -20 });
      refuses(key, { ...base, [field]: -20.01 }, FLOOR);
    });
  }

  for (const key of ['doseNiosh', 'doseOsha', 'leq']) {
    it(`${key} list`, () => {
      answers(key, { doseLevels: [-20, 90], doseMins: [10, 10] });
      refuses(key, { doseLevels: [90, -21], doseMins: [10, 10] }, FLOOR);
      refuses(key, { doseLevels: [-1000], doseMins: [10] }, FLOOR);
    });
  }
  it('combine list', () => {
    answers('combine', { levels: [-20, 90] });
    refuses('combine', { levels: [90, -21] }, FLOOR);
  });
  it('a computed level below the floor is still an answer, not a refused input', () => {
    const out = answers('point', { l1: 0, d1: 1, d2: 1000 });
    assert.equal(valueOf(out, 'LEVEL AT d₂'), -60);
  });
});

describe('every function in the three files that takes an SPL or a Q has a refuse', () => {
  const inScope = [...WORKSPACES_SPL, ...WORKSPACES_DYNAMICS, ...WORKSPACES_LEVELS];
  it('finds none without one, so a new function cannot skip the limits', () => {
    const missing: string[] = [];
    let seen = 0;
    for (const w of inScope) {
      const levelKeys = new Set(
        w.fields.filter((f) => f.quantity === 'spl' || f.key === 'levels' || f.key === 'doseLevels' || f.key === 'q').map((f) => f.key),
      );
      for (const f of w.functions) {
        if (!f.inputs.some((k) => levelKeys.has(k))) continue;
        seen++;
        if (!f.refuse) missing.push(`${w.id}.${f.key}`);
      }
    }
    assert.deepEqual(missing, []);
    assert.equal(seen, 17);
  });
});

describe('valid results are unchanged', () => {
  const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

  it('limiter threshold, the workspace example', () => {
    const out = answers('threshold', { ...LIMITER, margin: 3 });
    close(valueOf(out, 'THRESHOLD (dBu)'), 20 * Math.log10(Math.sqrt(4000) / Math.sqrt(0.6)) - 35);
  });
  it('threshold for a target gain reduction', () => {
    const out = answers('thrForGr', { ...COMP, targetGr: 9 });
    close(valueOf(out, 'SET THRESHOLD TO'), -20);
    close(valueOf(out, 'INPUT WILL SIT ABOVE IT BY'), 12);
  });
  it('mic output at 94 dB SPL', () => {
    const out = answers('micout', { sens: 2, spl: 94 });
    close(valueOf(out, 'OUTPUT VOLTAGE'), 0.002 * 2e-5 * Math.pow(10, 94 / 20));
  });
  it('band edges at Q 1.41', () => {
    const out = answers('bwFromQ', { fc: 1000, q: 1.41 });
    close(valueOf(out, 'BANDWIDTH'), 1000 / 1.41);
  });
  it('Leq of a steady day', () => {
    const out = answers('leq', { doseLevels: [90, 90], doseMins: [10, 10] });
    close(valueOf(out, 'Leq OVER THE INTERVALS'), 90);
  });
  it('a level at the ceiling keeps the ceiling words, not the floor words', () => {
    const r = evaluate('leq', { doseLevels: [400, 90], doseMins: [10, 10] });
    assert.match(r.why ?? '', /194 dB SPL/);
    assert.doesNotMatch(r.why ?? '', FLOOR);
  });
});
