/**
 * Owner decisions 2026-10-23 — group C (calculators), items 7–9.
 *
 *  7  Plausible ranges → refused in words outside them (D53), never a number:
 *     air temperature −40…60 °C (every AIR TEMPERATURE field); compressor
 *     threshold/input −150…+30 dB; mic sensitivity 0.05–200 mV/Pa; preamp gain
 *     needed > 75 dB; limiter threshold > +24 dBu; required power > 100 kW;
 *     RF TX power −30…+50 dBm and receiver sensitivity −130…−20 dBm; loudness
 *     −70…0 LUFS and true peak −60…+6 dBTP.
 *  8  The calculator accuracy note keeps "Built to be a source you can trust in
 *     the field…" and adds "For work in the field, confirm with a calibrated
 *     instrument."
 *  9  True peak (loudness.ts, R026987): inter-sample peaks "often sit about
 *     1 dB above the sample peaks, and 3 dB or more on some hot material".
 *
 * Every case runs the REAL field declarations, refuse() hooks, compute and
 * steps through the same order calcPanel.runCompute uses.
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
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CALC = path.join(REPO, 'src/screens/lab/calc');
const { getWorkspace, WORKSPACES } = await import(pathToFileURL(path.join(CALC, 'registry.ts')).href);
const U = await import(pathToFileURL(path.join(CALC, 'calcUnits.ts')).href);
const T = await import(pathToFileURL(path.join(CALC, 'calcTypes.ts')).href);
const read = (rel: string) => readFileSync(path.join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');

type Out = { label: string; value?: number; text?: string; refusal?: true };
type Run = { error: string | null; outputs: Out[]; steps: string[]; refused: boolean };
type Vals = Record<string, number | number[]>;

/** calcPanel.runCompute, headless (calcPanel imports React Native). */
function run(wsId: string, key: string, v: Vals): Run {
  const ws = getWorkspace(wsId);
  assert.ok(ws, wsId);
  const fn = ws.functions.find((f: { key: string }) => f.key === key);
  assert.ok(fn, `${wsId}.${key}`);
  const neg = U.negativeInput(fn, v, ws.fields);
  if (neg) return { error: `${neg.name} can’t be negative`, outputs: [], steps: [], refused: false };
  const dom = U.domainError(fn, v, ws.fields);
  if (dom) return { error: dom, outputs: [], steps: [], refused: false };
  const why = fn.refuse ? fn.refuse(v) : null;
  if (why) return { error: why, outputs: [], steps: [], refused: false };
  const outputs = fn.compute(v) as Out[];
  return { error: null, outputs, steps: fn.steps ? fn.steps(v) : [], refused: T.isRefused(outputs) };
}
const out = (r: Run, label: string) => r.outputs.find((o) => o.label === label);
/** Refused in words: an error sentence, no number from the absurd input. */
function refused(r: Run, re: RegExp) {
  assert.ok(r.error, `expected a refusal, got ${JSON.stringify(r).slice(0, 300)}`);
  assert.match(r.error!, re);
  assert.doesNotMatch(r.error!, /NaN|Infinity|e[+-]?\d|\d{5,}/, r.error!);
  assert.equal(r.outputs.length, 0);
}
/** Answers with finite numbers. */
function answers(r: Run) {
  assert.equal(r.error, null, String(r.error));
  assert.ok(r.outputs.length > 0);
  for (const o of r.outputs) if ('value' in o) assert.ok(Number.isFinite(o.value), `${o.label} = ${o.value}`);
}

describe('7a — every AIR TEMPERATURE field is −40…60 °C, refused in words outside', () => {
  const tempFields: [string, string][] = [];
  for (const ws of WORKSPACES) {
    for (const f of ws.fields) if (f.name === 'AIR TEMPERATURE') tempFields.push([ws.id, f.key]);
  }
  it('finds every AIR TEMPERATURE field (13 when Round A counted)', () => assert.ok(tempFields.length >= 13, String(tempFields.length)));
  for (const [wsId, key] of tempFields) {
    it(`${wsId}.${key}`, () => {
      const ws = getWorkspace(wsId);
      const f = ws.fields.find((x: { key: string }) => x.key === key);
      assert.deepEqual([...f.range], [-40, 60]);
      const fn = ws.functions.find((x: { inputs: string[] }) => x.inputs.includes(key));
      assert.ok(fn, `a function reads ${wsId}.${key}`);
      for (const bad of [-41, 61, 20_000_000, -300]) {
        assert.match(U.domainError(fn, { [key]: bad }, ws.fields) ?? '', /AIR TEMPERATURE must be from −40 to 60 °C/, `${bad}`);
      }
      for (const ok of [-40, 20, 60]) assert.equal(U.domainError(fn, { [key]: ok }, ws.fields), null, `${ok}`);
    });
  }
  it('the speed of sound answers at both ends and refuses 20,000,000 °C', () => {
    answers(run('wave', 'speed', { temp: -40 }));
    answers(run('wave', 'speed', { temp: 60 }));
    refused(run('wave', 'speed', { temp: 20_000_000 }), /from −40 to 60 °C/);
    refused(run('wave', 'speed', { temp: 61 }), /from −40 to 60 °C/);
  });
});

describe('7b — compressor threshold / input −150…+30 dB', () => {
  it('a −20,000,000 dB threshold is refused, not "-1.500e7 dB"', () =>
    refused(run('compressor', 'outFromRatio', { thr: -2e7, ratio: 4, inLvl: -8 }), /THRESHOLD must be from −150 to \+30 dB/));
  it('a −8,000,000 dB input is refused', () =>
    refused(run('compressor', 'thrForGr', { inLvl: -8e6, ratio: 4, targetGr: 4 }), /INPUT LEVEL must be from −150 to \+30 dB/));
  it('just outside either end is refused', () => {
    refused(run('compressor', 'outFromRatio', { thr: -151, ratio: 4, inLvl: -8 }), /THRESHOLD/);
    refused(run('compressor', 'outFromRatio', { thr: -20, ratio: 4, inLvl: 31 }), /INPUT LEVEL/);
    refused(run('compressor', 'ratioForOut', { thr: -20, inLvl: -8, targetOut: -1e6 }), /TARGET OUTPUT must be from −150 to \+30 dB/);
  });
  it('real levels still answer, the ends included', () => {
    const r = run('compressor', 'outFromRatio', { thr: -20, ratio: 4, inLvl: -8 });
    answers(r);
    assert.ok(Math.abs(out(r, 'OUTPUT LEVEL')!.value! - -17) < 1e-9);
    answers(run('compressor', 'outFromRatio', { thr: -150, ratio: 4, inLvl: 30 }));
    assert.equal(run('compressor', 'thrForGr', { inLvl: -8, ratio: 4, targetGr: 9 }).error, null);
  });
});

describe('7c — mic sensitivity 0.05–200 mV/Pa, the same in both mic cards', () => {
  it('a 2,000,000 mV/Pa mic is refused, not "2005 V"', () => {
    refused(run('micgain', 'micout', { sens: 2e6, spl: 94 }), /MIC SENSITIVITY \(mV\/Pa\) must be from 0\.05 to 200 mV\/Pa/);
    refused(run('micgain', 'maxspl', { sens: 2e6, maxIn: 10 }), /0\.05 to 200 mV\/Pa/);
    refused(run('micsens', 'mvToDb', { mvpa: 2e6 }), /SENSITIVITY \(mV\/Pa\) must be from 0\.05 to 200 mV\/Pa/);
    refused(run('micsens', 'outputAtSPL', { mvpa: 250, spl: 94 }), /0\.05 to 200 mV\/Pa/);
  });
  it('below 0.05 mV/Pa is refused in both cards', () => {
    refused(run('micgain', 'micout', { sens: 0.04, spl: 94 }), /0\.05 to 200 mV\/Pa/);
    refused(run('micsens', 'mvToDb', { mvpa: 0.04 }), /0\.05 to 200 mV\/Pa/);
  });
  it('the dBV/Pa sister refuses the same span (0 dBV/Pa = 1000 mV/Pa)', () => {
    refused(run('micsens', 'dbToMv', { dbvpa: 0 }), /−86 to −14 dBV\/Pa/);
    refused(run('micsens', 'dbToMv', { dbvpa: -90 }), /−86 to −14 dBV\/Pa/);
    answers(run('micsens', 'dbToMv', { dbvpa: -36.5 }));
  });
  it('real mics still answer, the ends included', () => {
    answers(run('micgain', 'micout', { sens: 2, spl: 94 }));
    answers(run('micgain', 'micout', { sens: 200, spl: 94 }));
    answers(run('micsens', 'mvToDb', { mvpa: 0.05 }));
    answers(run('micsens', 'mvToDb', { mvpa: 15 }));
  });
});

describe('7d — preamp gain needed above 75 dB: no setting, words', () => {
  it('a 2 mV/Pa mic at 47 dB SPL gets no "102.7 dB" — it is told what to do', () => {
    const r = run('micgain', 'gain', { sens: 2, spl: 47, target: 4, headroom: 12 });
    refused(r, /needs more gain than most preamps have/);
    assert.match(r.error!, /Move the mic closer, use a more sensitive \(hotter\) mic, or add an inline mic booster\./);
    assert.doesNotMatch(r.error!, /102|90\.7/);
  });
  it('just past 75 dB is refused; just under still answers', () => {
    // 2 mV/Pa: at 74 dB SPL the gain needed is ≈ 75.7 dB; at 76 dB SPL ≈ 73.7 dB.
    refused(run('micgain', 'gain', { sens: 2, spl: 74, target: 4, headroom: 12 }), /more gain than most preamps have/);
    const ok = run('micgain', 'gain', { sens: 2, spl: 76, target: 4, headroom: 12 });
    answers(ok);
    assert.ok(out(ok, 'GAIN TO HIT TARGET (dB)')!.value! < 75);
  });
  it('the worked example (2 mV/Pa at 94 dB SPL → ≈ 56 dB) is untouched', () => {
    const r = run('micgain', 'gain', { sens: 2, spl: 94, target: 4, headroom: 12 });
    answers(r);
    assert.ok(Math.abs(out(r, 'GAIN TO HIT TARGET (dB)')!.value! - 55.74) < 0.01);
  });
});

describe('7e — limiter threshold above +24 dBu: set it to the amp clip point', () => {
  it('a 500,000,000 W rating gets no "63.24 dBu" or 1125 V', () => {
    const r = run('limiter', 'threshold', { pwr: 5e8, z: 8, ampGain: 32, margin: 3 });
    refused(r, /The processor cannot send that much/);
    assert.match(r.error!, /Set the limiter to the amp’s clip point instead\./);
  });
  it('the worked example (500 W / 8 Ω / 32 dB / 3 dB ≈ +3.2 dBu) still answers', () => {
    const r = run('limiter', 'threshold', { pwr: 500, z: 8, ampGain: 32, margin: 3 });
    answers(r);
    assert.ok(out(r, 'THRESHOLD (dBu)')!.value! < 24);
  });
  it('the line falls at +24 dBu', () => {
    // 0 dB amp gain, 0 margin: threshold = speaker dBu. +24 dBu ≈ 12.28 V; 8 Ω → P = V²/8.
    const v24 = 0.7746 * Math.pow(10, 24 / 20);
    answers(run('limiter', 'threshold', { pwr: (v24 * v24) / 8 * 0.98, z: 8, ampGain: 0, margin: 0 }));
    refused(run('limiter', 'threshold', { pwr: (v24 * v24) / 8 * 1.02, z: 8, ampGain: 0, margin: 0 }), /cannot send that much/);
  });
});

describe('7f — required power above 100 kW: no number', () => {
  it('a 0 dB sensitivity gets no "1.259e13 W"', () =>
    refused(
      run('speakerpower', 'reqpower', { sens: 0, target: 105, dist: 10, headroom: 6, nspk: 1 }),
      /^No amplifier can do this — use a more sensitive speaker, more speakers, or move them closer\.$/,
    ));
  it('a real system still answers (97 dB, 105 dB at 10 m, 6 dB headroom ≈ 2.5 kW)', () => {
    const r = run('speakerpower', 'reqpower', { sens: 97, target: 105, dist: 10, headroom: 6, nspk: 1 });
    answers(r);
    assert.ok(Math.abs(out(r, 'REQUIRED POWER (one speaker)')!.value! - Math.pow(10, 3.4)) < 1e-6);
  });
  it('shared by speakers whose each share is real, the one-box figure is words, not 158 kW', () => {
    // dB over the 1 W reference = 123 + 20 − 97 + 6 = 52 → 158 kW alone, 79 kW each for two.
    const r = run('speakerpower', 'reqpower', { sens: 97, target: 123, dist: 10, headroom: 6, nspk: 2 });
    answers(r);
    const one = out(r, 'REQUIRED POWER (one speaker)')!;
    assert.equal(one.value, undefined);
    assert.match(one.text ?? '', /No amplifier could drive one speaker this hard/);
    const each = r.outputs.find((o) => o.label.startsWith('POWER PER SPEAKER'))!;
    assert.ok(each.value! < 100_000 && each.value! > 79_000, String(each.value));
    assert.doesNotMatch(r.steps.join(' '), /158\d/);
  });
  it('more speakers than that cannot rescue it: each share past 100 kW is refused', () =>
    refused(run('speakerpower', 'reqpower', { sens: 97, target: 140, dist: 10, headroom: 6, nspk: 4 }), /No amplifier can do this/));
});

describe('7g — RF TX power −30…+50 dBm, receiver sensitivity −130…−20 dBm', () => {
  const base = { gtx: 2, grx: 2, dist: 50, freqMHz: 550 };
  it('a 10,000,000 dBm transmitter is refused, not a "1.000e7 dB" margin', () =>
    refused(run('rflink', 'budget', { ...base, ptx: 1e7, rxsens: -95 }), /TRANSMIT POWER must be from −30 to \+50 dBm/));
  it('just outside either end is refused', () => {
    refused(run('rflink', 'budget', { ...base, ptx: 51, rxsens: -95 }), /TRANSMIT POWER/);
    refused(run('rflink', 'budget', { ...base, ptx: -31, rxsens: -95 }), /TRANSMIT POWER/);
    refused(run('rflink', 'budget', { ...base, ptx: 10, rxsens: -19 }), /RECEIVER SENSITIVITY must be from −130 to −20 dBm/);
    refused(run('rflink', 'budget', { ...base, ptx: 10, rxsens: -131 }), /RECEIVER SENSITIVITY/);
  });
  it('a real link still answers, the ends included', () => {
    answers(run('rflink', 'budget', { ...base, ptx: 10, rxsens: -95 }));
    answers(run('rflink', 'budget', { ...base, ptx: 50, rxsens: -130 }));
    answers(run('rflink', 'budget', { ...base, ptx: -30, rxsens: -20 }));
  });
});

describe('7h — loudness −70…0 LUFS, true peak −60…+6 dBTP', () => {
  const ok = { measured: -9, target: -14, truePeak: -0.5, ceiling: -1 };
  it('a −9,000,000 LUFS master is refused, not a "9000000 dB" gain', () =>
    refused(run('loudnorm', 'normalize', { ...ok, measured: -9e6 }), /MEASURED LOUDNESS \(LUFS\) must be from −70 to 0 LUFS/));
  it('each loudness / true-peak field refuses just outside its span', () => {
    refused(run('loudnorm', 'normalize', { ...ok, measured: 1 }), /MEASURED LOUDNESS/);
    refused(run('loudnorm', 'normalize', { ...ok, target: -71 }), /TARGET LOUDNESS \(LUFS\) must be from −70 to 0 LUFS/);
    refused(run('loudnorm', 'normalize', { ...ok, truePeak: 7 }), /CURRENT TRUE PEAK \(dBTP\) must be from −60 to \+6 dBTP/);
    refused(run('loudnorm', 'normalize', { ...ok, ceiling: -61 }), /TRUE-PEAK CEILING \(dBTP\) must be from −60 to \+6 dBTP/);
    refused(run('loudtp', 'loudnessDelta', { lufsA: 5, lufsB: -20 }), /LOUDNESS A \(LUFS\)/);
    refused(run('loudtp', 'loudnessDelta', { lufsA: -14, lufsB: -80 }), /LOUDNESS B \(LUFS\)/);
  });
  it('real readings still answer, the ends included', () => {
    const r = run('loudnorm', 'normalize', ok);
    answers(r);
    assert.equal(out(r, 'GAIN CHANGE')!.value, -5);
    answers(run('loudnorm', 'normalize', { measured: -70, target: 0, truePeak: -60, ceiling: 6 }));
    answers(run('loudtp', 'loudnessDelta', { lufsA: -14, lufsB: -20 }));
  });
});

describe('8 — the calculator accuracy note', () => {
  const s = read('src/components/AccuracyNote.tsx');
  it('keeps the trust line and adds the calibrated-instrument sentence', () => {
    assert.match(s, /'Built to be a source you can trust in the field\. Each result is computed EXACTLY from the formula shown, using established, published engineering methods\. For work in the field, confirm with a calibrated instrument\.'/);
  });
});

describe('9 — true peak (R026987)', () => {
  const s = read('src/screens/lab/calc/workspaces/loudness.ts');
  it('says about 1 dB typically, 3 dB or more on some hot material', () => {
    assert.ok(
      s.includes(
        'inter-sample peaks often sit about 1 dB above the sample peaks, and 3 dB or more on some hot material; only a true-peak (oversampled) meter catches them.',
      ),
    );
    assert.ok(!s.includes('often ride up to about 3 dB higher (more on rare hot material)'));
  });
});
