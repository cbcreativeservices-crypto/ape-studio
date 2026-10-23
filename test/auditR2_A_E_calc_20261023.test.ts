/**
 * Audit R2, Round A — group E_calc (2026-10-23).
 *
 * Comp B recomputed 1,247 calculator cases and returned 164 findings, almost
 * all under house rule D53: an impossible or out-of-range input is REFUSED or
 * explained in words — never printed as a number ("— ms", "0 Ω", 210 dB SPL,
 * 1e8 dB, 5,000,000 % open area). These tests run the REAL compute/steps/table
 * functions through the same pipeline calcPanel.runCompute uses (negative →
 * field domain → the function's own `refuse` → compute), and pin the corrected
 * wording.
 *
 *  E1  a 0 that has no answer is refused by name (`positive` fields)
 *  E2  the ceiling of air: no SPL above ~194 dB is ever printed
 *  E3  overflow / underflow is refused in words, not "check for zeros"
 *  E4  the two real MISMATCHes: timecode at 12.5 fps; loudness ratio sign
 *  E5  units: dBA exposure, MB/s, dBi antennas
 *  E6  steps that were false as written (rounded K, "−9.5 dB down", 1/0)
 *  E7  sister cards agree; plurals; text corrections
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

const CALC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/screens/lab/calc');
const { getWorkspace } = await import(pathToFileURL(path.join(CALC, 'registry.ts')).href);
const U = await import(pathToFileURL(path.join(CALC, 'calcUnits.ts')).href);
const T = await import(pathToFileURL(path.join(CALC, 'calcTypes.ts')).href);
const read = (rel: string) => readFileSync(path.join(CALC, rel), 'utf8').replace(/\r\n/g, '\n');

type Out = { label: string; value?: number; text?: string; refusal?: true; quantity?: string; unit?: string };
type Run = { error: string | null; outputs: Out[]; steps: string[]; table: { cols: string[]; rows: string[][] } | null; refused: boolean };

/** calcPanel.runCompute, headless (calcPanel imports React Native). */
function run(wsId: string, key: string, v: Record<string, number | number[]>): Run {
  const ws = getWorkspace(wsId);
  assert.ok(ws, wsId);
  const fn = ws.functions.find((f: { key: string }) => f.key === key);
  assert.ok(fn, `${wsId}.${key}`);
  const neg = U.negativeInput(fn, v, ws.fields);
  if (neg) return { error: `${neg.name} can’t be negative`, outputs: [], steps: [], table: null, refused: false };
  const dom = U.domainError(fn, v, ws.fields);
  if (dom) return { error: dom, outputs: [], steps: [], table: null, refused: false };
  const why = fn.refuse ? fn.refuse(v) : null;
  if (why) return { error: why, outputs: [], steps: [], table: null, refused: false };
  const outputs = fn.compute(v) as Out[];
  const nums = outputs.filter((o) => 'value' in o);
  if (nums.length && nums.every((o) => !Number.isFinite(o.value))) return { error: 'GENERIC', outputs: [], steps: [], table: null, refused: false };
  return { error: null, outputs, steps: fn.steps ? fn.steps(v) : [], table: fn.table ? fn.table(v) : null, refused: T.isRefused(outputs) };
}
const out = (r: Run, label: string) => r.outputs.find((o) => o.label === label);
/** No dash in a number slot, no NaN/Infinity, nowhere on the card. */
function honest(r: Run) {
  const strs = [...r.steps, ...r.outputs.map((o) => o.text ?? ''), ...(r.table ? r.table.rows.flat() : [])];
  for (const s of strs) assert.doesNotMatch(s, /NaN|Infinity|— (ms|s|Hz|Ω|V|A|W|dB|m|cm|samples|×|%)\b/, s);
  for (const o of r.outputs) if ('value' in o) assert.ok(Number.isFinite(o.value), `${o.label} = ${o.value}`);
}
function refusedInWords(r: Run, re?: RegExp) {
  assert.ok(r.error && r.error !== 'GENERIC', `expected a refusal in words, got ${JSON.stringify(r).slice(0, 300)}`);
  assert.doesNotMatch(r.error!, /check for zeros|NaN|Infinity|= —|— (ms|Hz|Ω|V|W|dB|samples)/);
  if (re) assert.match(r.error!, re);
}

describe('E1 — a 0 that has no answer is refused by name', () => {
  const cases: [string, string, Record<string, number | number[]>, RegExp][] = [
    ['wave', 'period', { f: 0 }, /FREQUENCY must be above 0 — a 0 Hz tone has no cycles/],
    ['wave', 'cycles', { fKnown: 0, dist: 3.43, temp: 20 }, /FREQUENCY must be above 0/],
    ['phase', 'phaseFromTime', { f: 0, dt: 0.0005 }, /no phase angle/],
    ['distdelay', 'timeToSmp', { delay: 0.0874, sr: 0 }, /SAMPLE RATE must be above 0/],
    ['latency', 'bufLatency', { buf: 0, sr: 48000 }, /BUFFER SIZE must be at least 1 sample/],
    ['latency', 'bufLatency', { buf: 128, sr: 0 }, /SAMPLE RATE must be above 0/],
    ['latency', 'msToSmp', { t: 0.0068, sr: 0 }, /SAMPLE RATE must be above 0/],
    ['ohmspower', 'powerFromPeak', { vpk: 40, z: 0 }, /IMPEDANCE must be above 0/],
    ['ohmspower', 'vFromPZ', { p: 100, z: 0 }, /IMPEDANCE must be above 0/],
    ['ohmspower', 'zFromVP', { vrms: 0, p: 100 }, /VOLTAGE \(RMS\) must be above 0/],
    ['ohmspower', 'pFromVZ', { vrms: 0, z: 8 }, /VOLTAGE \(RMS\) must be above 0/],
    ['electronics', 'xl', { f: 0, ind: 10 }, /FREQUENCY must be above 0/],
    ['qbw', 'geoCenter', { flo: 0, fhi: 400 }, /LOWER FREQUENCY must be above 0/],
    ['qbw', 'paramReach', { fc: 0, q: 1.41, gain: 9 }, /CENTER FREQUENCY must be above 0/],
    ['micgain', 'micout', { sens: 0, spl: 94 }, /MIC SENSITIVITY/],
    ['limiter', 'threshold', { pwr: 0, z: 8, ampGain: 32, margin: 3 }, /SPEAKER CONTINUOUS RATING must be above 0/],
    ['cable', 'maxlen', { awg: 16, z: 0, maxloss: 0.5 }, /a 0 Ω load is a short circuit/],
    ['cv70', 'load', { taps: [10, 10], prated: 0, vline: 70.7, hr: 1 }, /AMPLIFIER RATED POWER must be above 0/],
    ['bpm', 'lfoSync', { bpm: 0, beatsPerCycle: 4 }, /TEMPO must be above 0 BPM/],
    ['bpm', 'lfoSync', { bpm: 120, beatsPerCycle: 0 }, /BEATS PER CYCLE must be above 0/],
    ['pitch', 'noteToFreq', { midi: 69, ref: 0 }, /A4 reference must be above 0 Hz/],
    ['filesize', 'size', { sr: 0, bits: 24, ch: 2, dur: 3600 }, /SAMPLE RATE must be above 0/],
    ['filesize', 'multitrack', { sr: 48000, bits: 0, ch: 2, tracks: 24 }, /BIT DEPTH must be at least 1 bit/],
    ['sabine', 'rtFromVA', { vol: 0, absA: 54 }, /ROOM VOLUME must be above 0/],
    ['treatment', 'panels', { vol: 0, rtCur: 1.2, rtTgt: 0.5, panelArea: 2.88, alpha: 0.9 }, /ROOM VOLUME must be above 0/],
    ['critdist', 'drr', { vol: 0, rt60: 0.8, q: 1, r: 3 }, /ROOM VOLUME must be above 0/],
    ['schroeder', 'fs', { vol: 50, rt60: 0 }, /must be above 0/],
    ['reflection', 'comb', { dDirect: 0, dReflected: 0.75, temp: 20 }, /DIRECT PATH must be above 0/],
    ['absorber', 'helmholtz', { openPct: 0, depth: 0.1, thick: 0.012, hole: 0.008, temp: 20 }, /needs holes/],
    ['transformer', 'ratioFromZ', { zp: 0, zs: 150 }, /PRIMARY IMPEDANCE must be above 0/],
    ['pads', 'tpad', { atten: 0, z: 600 }, /ATTENUATION must be above 0/],
    ['pads', 'pipad', { atten: 20, z: 0 }, /must be above 0/],
    ['vdrop', 'gaugeFor', { len: 30, current: 0, vsrc: 48, pct: 3, condTemp: 75 }, /CURRENT must be above 0/],
    ['rackheat', 'safeLoad', { mains: 0, breaker: 15 }, /MAINS VOLTAGE must be above 0/],
    ['complexz', 'resonance', { indmH: 0, capuF: 10 }, /With no inductance there is no resonance/],
    ['crossover', 'firstOrder', { fx: 2500, z: 0 }, /DRIVER IMPEDANCE must be above 0/],
    ['driver', 'sealed', { fs: 25, qts: 0, vas: 0.05, vb: 0.03 }, /TOTAL Q \(Qts\) must be above 0/],
    ['driver', 'portLength', { fbTarget: 35, av: 0, vb: 0.03, temp: 20 }, /PORT AREA must be above 0/],
    ['clockdrift', 'slip', { sr: 0, ppm: 50, dur: 3600 }, /SAMPLE RATE must be above 0/],
    ['netaudio', 'packetize', { channels: 0, sr: 48000, bitdepth: 24, packetms: 0.001 }, /CHANNELS must be above 0/],
    ['firlen', 'latency', { sr: 0, taps: 1024 }, /SAMPLE RATE must be above 0/],
    ['bitdepth', 'fromBits', { bits: 0 }, /BIT DEPTH must be at least 1 bit/],
    ['bitdepth', 'bitsFromRange', { dr: 0 }, /TARGET DYNAMIC RANGE must be above 0/],
    ['micsens', 'outputAtSPL', { mvpa: 0, spl: 94 }, /must be above 0/],
    ['rflink', 'pathLoss', { dist: 50, freqMHz: 0 }, /FREQUENCY \(MHz\) must be above 0/],
    ['loudtp', 'windows', { sr: 0 }, /SAMPLE RATE must be above 0/],
    ['align', 'phaseAtFreq', { offset: 1.2, freq: 0, temp: 20 }, /FREQUENCY must be above 0/],
    ['imd', 'products', { f1: 0, f2: 20000 }, /TONE 1 \(f₁\) must be above 0/],
  ];
  for (const [ws, key, v, re] of cases) {
    it(`${ws}.${key} ${JSON.stringify(v)}`, () => refusedInWords(run(ws, key, v), re));
  }
  it('every zero refusal costs nothing: it is an error, not a result card', () => {
    assert.equal(T.costsACalculation({ computeError: true }), false);
  });
  it('0 ppm is a real answer — the clocks never slip — said in words', () => {
    const s = run('clockdrift', 'slip', { sr: 48000, ppm: 0, dur: 3600 });
    assert.equal(s.error, null);
    assert.match(out(s, 'TIME PER 1-SAMPLE SLIP')?.text ?? '', /^Never\. With 0 ppm the clocks match exactly/);
    assert.deepEqual(s.steps, ['With 0 ppm the clocks match exactly, so no samples ever slip.']);
    honest(s);
    const u = run('clockdrift', 'untilSlip', { sr: 48000, ppm: 0, maxSlip: 1 });
    assert.match(out(u, 'TIME TO REACH SLIP BUDGET')?.text ?? '', /never used up/);
    assert.equal(U.domainError({ inputs: ['ppm'] }, { ppm: 0 }, getWorkspace('clockdrift').fields), null);
  });
  it('a typical input still answers (nothing over-refused)', () => {
    for (const [ws, key, v] of [
      ['wave', 'period', { f: 100 }],
      ['ohmspower', 'pFromVZ', { vrms: 28.3, z: 8 }],
      ['latency', 'bufLatency', { buf: 128, sr: 48000 }],
      ['sabine', 'rtFromVA', { vol: 100, absA: 54 }],
    ] as const) {
      const r = run(ws, key, v as Record<string, number>);
      assert.equal(r.error, null, `${ws}.${key}`);
      honest(r);
    }
  });
});

describe('E2 — the ceiling of air (about 194 dB SPL) is never printed past', () => {
  it('one shared constant, from calcUnits', () => {
    assert.equal(U.SPL_MAX_AIR_DB, 194);
    assert.equal(U.overAirCeiling(194), false);
    assert.equal(U.overAirCeiling(194.1), true);
  });
  const cases: [string, string, Record<string, number | number[]>, RegExp][] = [
    ['spldist', 'point', { l1: 1e8, d1: 1, d2: 8 }, /cannot get louder than about 194 dB SPL/],
    ['spldist', 'point', { l1: 194, d1: 8, d2: 1 }, /194 dB SPL/],
    ['spldist', 'line', { l1: 200, d1: 1, d2: 8 }, /194 dB SPL/],
    ['spldist', 'custom', { l1: 1e8, d1: 1, d2: 8, rate: 4.5 }, /194 dB SPL/],
    ['spldist', 'required', { lTarget: 192, d1: 1, d2: 8 }, /No source can do this/],
    ['spladd', 'identical', { lvl: 190, count: 4 }, /194 dB SPL/],
    ['spladd', 'combine', { levels: [190, 190, 190, 190] }, /194 dB SPL/],
    ['spladd', 'dominance', { la: 300, lb: 84 }, /194 dB SPL/],
    ['dose', 'allowNiosh', { lex: 9.4e7 }, /194 dB SPL/],
    ['dose', 'allowOsha', { lex: 9.4e7 }, /194 dB SPL/],
    ['speakerpower', 'predictspl', { sens: 194, power: 500, dist: 10, headroom: 6, nspk: 1 }, /194 dB SPL/],
    ['speakerpower', 'maxspl', { sens: 194, power: 500, dist: 10 }, /194 dB SPL/],
    ['speakerpower', 'reqpower', { sens: 97, target: 190, dist: 10, headroom: 6, nspk: 1 }, /No speaker can do this/],
    ['linearray', 'distanceLoss', { splRef: 200, refDist: 4, farDist: 16 }, /194 dB SPL/],
    ['micsens', 'outputAtSPL', { mvpa: 15, spl: 300 }, /194 dB SPL/],
  ];
  for (const [ws, key, v, re] of cases) {
    it(`${ws}.${key} ${JSON.stringify(v)}`, () => refusedInWords(run(ws, key, v), re));
  }
  it('a mic that can never clip the preamp says so in words, never "275.7 dB SPL"', () => {
    const r = run('micgain', 'maxspl', { sens: 2e-6, maxIn: 10 });
    assert.equal(r.error, null);
    assert.equal(out(r, 'SPL AT PREAMP INPUT CLIP')?.value, undefined);
    assert.match(out(r, 'SPL AT PREAMP INPUT CLIP')?.text ?? '', /cannot put out enough to clip the preamp/);
    assert.match(r.steps.join(' '), /no sound in air is loud enough/);
    const ok = run('micgain', 'maxspl', { sens: 2, maxIn: 10 });
    assert.ok(Number.isFinite(out(ok, 'SPL AT PREAMP INPUT CLIP')?.value), 'a real mic still gets a number');
  });
  it('real levels still answer', () => {
    const r = run('spldist', 'point', { l1: 100, d1: 1, d2: 8 });
    assert.ok(Math.abs(out(r, 'LEVEL AT d₂')!.value! - (100 - 20 * Math.log10(8))) < 1e-9);
  });
});

describe('E3 — overflow and underflow are refused in words', () => {
  const cases: [string, string, Record<string, number | number[]>, RegExp][] = [
    ['level', 'dbuToV', { dbu: 4e6 }, /too large to turn into a voltage/],
    ['level', 'dbvToV', { dbv: -1e7 }, /too far below the reference/],
    ['level', 'dbuDbv', { dbx: 4e6 }, /too large to turn into a voltage/],
    ['level', 'dbToAmp', { dbAmp: 6e6 }, /too large to turn into a ratio/],
    ['level', 'dbToPow', { dbPow: 3e6 }, /too large to turn into a ratio/],
    ['qbw', 'qFromOct', { noct: 1e6 }, /wider than the whole range of hearing/],
    ['spladd', 'needed', { delta: 6e6 }, /more sources than could ever exist/],
    ['pitch', 'transpose', { semi: 3e6, cents: 0 }, /far too large for varispeed/],
    ['transloss', 'massForTL', { tlTarget: 4e7, f: 125 }, /far beyond any real wall/],
    ['bitdepth', 'fromBits', { bits: 24e6 }, /more code values than any number/],
    ['micsens', 'dbToMv', { dbvpa: -3.65e7 }, /too far below 1 V\/Pa/],
    ['loudtp', 'loudnessDelta', { lufsA: -1.4e7, lufsB: -20 }, /far apart beyond any real programme/],
  ];
  for (const [ws, key, v, re] of cases) {
    it(`${ws}.${key} ${JSON.stringify(v)}`, () => refusedInWords(run(ws, key, v), re));
  }
  it('outside the MIDI range a frequency has no note name', () => {
    refusedInWords(run('pitch', 'freqToNote', { f: 452e6, ref: 440 }), /outside the MIDI note range/);
    refusedInWords(run('pitch', 'freqToNote', { f: 0.000452, ref: 440 }), /outside the MIDI note range/);
    assert.equal(run('pitch', 'freqToNote', { f: 452, ref: 440 }).error, null);
  });
  it('an absurd FFT spacing, IR, sample rate, prime or room is refused in words', () => {
    refusedInWords(run('fft', 'sizeFromRes', { df: 5e6, sr: 48000 }), /coarsest bin spacing is 24 kHz/);
    refusedInWords(run('convolution', 'cost', { irSec: 2e-6, sr: 48000, channels: 2 }), /shorter than one sample/);
    refusedInWords(run('loudtp', 'windows', { sr: 0.048 }), /holds less than one sample/);
    refusedInWords(run('diffuser', 'qrd', { N: 14, f0: 500, w: 0.05, temp: 20 }), /14 is not a prime number/);
    refusedInWords(run('eyring', 'eyring', { vol: 120, surf: 80, aBar: 0.3 }), /cannot enclose 120 m³ — even a sphere needs about 117\.7 m²/);
    refusedInWords(run('eyring', 'absForRt', { vol: 1.2e8, surf: 160, rtTarget: 0.3 }), /cannot enclose/);
    refusedInWords(run('absorber', 'helmholtz', { openPct: 5e6, depth: 0.1, thick: 0.012, hole: 0.008, temp: 20 }), /cannot be more than 100 %/);
    refusedInWords(run('wave', 'speed', { temp: -300 }), /above absolute zero/);
    refusedInWords(run('imd', 'products', { f1: 1000, f2: 1000 }), /identical tones make no intermodulation/);
  });
  it('an absurd beat interval never rounds to a "0 BPM" tempo', () => {
    const r = run('bpm', 'bpmFromInterval', { interval: 5e5 });
    assert.match(out(r, 'NEAREST WHOLE BPM')?.text ?? '', /^Below 1 BPM/);
    assert.doesNotMatch([...r.steps, ...r.outputs.map((o) => o.text ?? '')].join(' '), /\b0 BPM/);
  });
  it('a port shorter than nothing prints no length at all', () => {
    const r = run('driver', 'portLength', { fbTarget: 3.5e7, av: 0.005, vb: 0.03, temp: 20 });
    assert.ok(r.refused);
    assert.equal(r.outputs.filter((o) => 'value' in o).length, 0, JSON.stringify(r.outputs));
    assert.doesNotMatch(r.steps.join(' '), /-\d|−\d/);
    assert.match(r.steps.join(' '), /tunes BELOW the target/);
  });
});

describe('E4 — the two real MISMATCHes', () => {
  it('timecode needs a standard frame rate (12.5 fps read 720 s beside 00:11:32:04)', () => {
    refusedInWords(run('timecode', 'fromFrames', { frames: 9000, fps: 12.5 }), /standard frame rate/);
    refusedInWords(run('timecode', 'toFrames', { hours: 0, mins: 6, secs: 0, fps: 12.5 }), /standard frame rate/);
    const r = run('timecode', 'fromFrames', { frames: 9000, fps: 25 });
    assert.deepEqual(r.table!.rows[0], ['00', '06', '00', '00']);
    assert.equal(out(r, 'TOTAL TIME')!.value, 360);
    for (const fps of [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60]) assert.equal(run('timecode', 'fromFrames', { frames: 9000, fps }).error, null, String(fps));
    assert.match(run('timecode', 'fromFrames', { frames: 9e9, fps: 25 }).steps[0], /^Time = 9\.000e9 frames/);
  });
  it('8 LU quieter is 0.574×, not 1.741× — the ratio keeps its sign', () => {
    const r = run('loudtp', 'loudnessDelta', { lufsA: -28, lufsB: -20 });
    assert.ok(Math.abs(out(r, 'PERCEIVED LOUDNESS RATIO')!.value! - Math.pow(2, -0.8)) < 1e-12);
    assert.match(out(r, 'WHICH SOUNDS LOUDER')!.text!, /A sounds quieter — about 0\.5743× as loud as B \(B sounds about 1\.741× as loud as A\)/);
    const up = run('loudtp', 'loudnessDelta', { lufsA: -14, lufsB: -20 });
    assert.ok(Math.abs(out(up, 'PERCEIVED LOUDNESS RATIO')!.value! - Math.pow(2, 0.6)) < 1e-12);
  });
});

describe('E5 — units', () => {
  it('the exposure level is dBA, and an Leq of dBA intervals is dBA', () => {
    const lex = getWorkspace('dose').fields.find((f: { key: string }) => f.key === 'lex');
    assert.deepEqual(U.unitsFor(lex.quantity, lex.unitIds).map((u: { label: string }) => u.label), ['dBA']);
    const leq = run('dose', 'leq', { doseLevels: [85, 94, 100], doseMins: [240, 90, 30] });
    assert.equal(out(leq, 'Leq OVER THE INTERVALS')!.unit, 'dba');
    assert.deepEqual(U.outputUnits('spl', 'dba').map((u: { label: string }) => u.label), ['dBA']);
  });
  it('an unweighted SPL never cycles to a dBA label', () => {
    assert.deepEqual(U.unitsFor('spl').map((u: { label: string }) => u.label), ['dB SPL']);
    assert.deepEqual(U.outputUnits('spl').map((u: { label: string }) => u.label), ['dB SPL']);
  });
  it('raw bytes per second is a rate in MB/s', () => {
    const r = run('netaudio', 'bandwidth', { channels: 64, sr: 48000, bitdepth: 24 });
    const o = out(r, 'RAW BYTES PER SECOND')!;
    const units = U.outputUnits(o.quantity, o.unit);
    assert.equal(units[0].label, 'MB/s');
    assert.equal(U.fmt(units[0].fromBase(o.value)), '9.216');
    assert.match(getWorkspace('netaudio').functions.find((f: { key: string }) => f.key === 'packetize').formula, /× 8 ÷ packet time/);
  });
  it('antenna gains are dBi, with the dBd conversion in the help', () => {
    for (const k of ['gtx', 'grx']) {
      const f = getWorkspace('rflink').fields.find((x: { key: string }) => x.key === k);
      assert.match(f.name, /\(dBi\)$/);
      assert.match(f.help, /add 2\.15 to get dBi/);
    }
  });
});

describe('E6 — worked steps that are true as written', () => {
  it('a sample count keeps its decimals (4195.2, 16782.5)', () => {
    assert.equal(U.fmtSamples(4195.2), '4195.2');
    assert.equal(U.fmtSamples(16782.5), '16782.5');
    assert.equal(U.fmtSamples(4196), '4196');
    const r = run('distdelay', 'timeToSmp', { delay: 0.0874, sr: 48000 });
    assert.match(r.steps[0], /= 4195\.2 samples\./);
    const t = run('distdelay', 'distToDelay', { dist: 60, temp: 20 });
    assert.equal(t.table!.rows[2][1], '16782.5');
    assert.match(read('calcPanel.tsx'), /if \(o\.quantity === 'samples'\) return `\$\{fmtSamples\(o\.value, sig\)\}/);
  });
  it('a ratio next to 1 is printed with the digits the step needs', () => {
    assert.equal(U.fmtNotWhole(1.0000005), '1.0000005');
    assert.equal(U.fmtNotWhole(2), '2');
    assert.equal(U.fmtNotWhole(1.5), '1.5');
    assert.match(run('level', 'pctToDb', { pct: 5e-5 }).steps[1], /log10\(1\.0000005\)/);
    assert.match(run('qbw', 'qFromOct', { noct: 1e-6 }).steps[0], /= 1\.0000007 /);
    assert.doesNotMatch(run('qbw', 'qFromOct', { noct: 1e-6 }).steps[1], /\(1 − 1\)/);
    assert.match(run('pads', 'tpad', { atten: 2e-5, z: 600 }).steps[0], /= 1\.0000023/);
    assert.doesNotMatch(run('cable', 'loss', { len: 3e-5, awg: 16, z: 8, pamp: 500 }).steps.join(' '), /log10\(1\)|= 8\/8 /);
    const n = run('spladd', 'needed', { delta: 6e-6 });
    assert.notEqual(out(n, 'EXACT SOURCE MULTIPLE')?.value, 1);
    assert.match(out(n, 'EXACT SOURCE MULTIPLE')?.text ?? '', /^1\.000001\d*×$/);
  });
  it('magnitudes beside "attenuation" and "down" (no double negatives)', () => {
    const d = run('electronics', 'divider', { vin: 1, r1: 10000, r2: 10000 });
    assert.ok(Math.abs(out(d, 'ATTENUATION')!.value! - 20 * Math.log10(2)) < 1e-12);
    assert.match(d.steps.join(' '), /That is 6\.021 dB of attenuation/);
    const s = run('stereomic', 'threeToOne', { micDist: 0.3 });
    assert.match(s.steps.join(' '), /about 9\.542 dB down/);
    assert.doesNotMatch(s.steps.join(' '), /-9\.542 dB down/);
  });
  it('a 0 Ω branch and a single resistor are said in words', () => {
    const z = run('electronics', 'parallelR', { rlist: [8, 8, 16, 0] });
    assert.deepEqual(z.steps, ['A 0 Ω branch is a short circuit: it carries all the current, so the whole parallel group is 0 Ω.']);
    const one = run('electronics', 'parallelR', { rlist: [8] });
    assert.match(one.steps[0], /^With one resistor there is nothing in parallel/);
    assert.match(run('impedance', 'parallel', { zlist: [8] }).steps[0], /^Only one speaker/);
    assert.match(run('impedance', 'series', { zlist: [8] }).steps[0], /^Only one speaker/);
    refusedInWords(run('impedance', 'parallel', { zlist: [8, 0] }), /0 Ω speaker is a short circuit/);
    assert.match(run('impedance', 'seriesparallel', { z4: [8, 8, 8, 8, 0] }).outputs[0].text!, /exactly FOUR impedances \(you entered 5\)/);
    refusedInWords(run('impedance', 'seriesparallel', { z4: [8, 8, 8, 0] }), /short circuit/);
  });
  it('the comb formula counts its nulls the way the table does; no delay is no comb', () => {
    assert.match(getWorkspace('comb').functions[0].formula, /\(2k−1\)\/\(2Δt\).*k = 1, 2, 3/);
    const r = run('comb', 'combFromDelay', { dt: 0 });
    assert.ok(r.refused);
    assert.match(r.outputs[0].text!, /^No delay → no comb-filter nulls/);
    assert.equal(r.table?.rows.length ?? 0, 0);
  });
  it('the phase wrap is stated and the verdict follows the sum', () => {
    const w = run('align', 'phaseAtFreq', { offset: 1.2e6, freq: 80, temp: 20 });
    assert.match(w.steps[1], /°, which is 130\.4° after removing whole turns/);
    const p = run('align', 'phaseAtFreq', { offset: 1.2, freq: 40, temp: 20 });
    assert.match(p.steps[2], /^Mostly in phase — two equal sources still add well here \(about \+5\.2 dB over one alone\)/);
  });
  it('complex impedance squares a negative reactance in brackets', () => {
    assert.match(run('complexz', 'impedance', { r: 8, indmH: 1, capuF: 10, f: 1000 }).steps[2], /\+ \(-9\.632\)²/);
  });
  it('the minimum FFT size is a whole number of points', () => {
    const r = run('fft', 'sizeFromRes', { df: 7, sr: 48000 });
    assert.equal(out(r, 'MINIMUM FFT SIZE')!.value, 6858);
    assert.match(r.steps[0], /so at least 6858 points/);
  });
  it('a refused Sabine list counts only its pairs, in the steps and the table too', () => {
    const r = run('sabine', 'rtFromSurfaces', { vol: 100, surfaces: [20, 20, 12.5, 0], coeffs: [0.05, 0.3, 0.9] });
    assert.equal(r.table!.rows.length, 3);
    assert.doesNotMatch(r.steps[0], /0 × 0 = 0/);
  });
});

describe('E7 — sister cards, plurals, and the corrected text', () => {
  it('singular when the count is 1', () => {
    assert.match(run('dose', 'doseNiosh', { doseLevels: [85], doseMins: [240, 90, 30] }).outputs[0].text!, /^You entered 1 level but 3 durations — only the first pair is counted\.$/);
    assert.ok(run('cv70', 'load', { taps: [10], prated: 250, vline: 70.7, hr: 1 }).outputs.some((o) => o.label === 'SYSTEM LOAD (1 speaker)'));
    assert.ok(run('treatment', 'panels', { vol: 0.00015, rtCur: 1.2, rtTgt: 0.5, panelArea: 2.88, alpha: 0.9 }).outputs.some((o) => o.label === 'PREDICTED RT60 WITH 1 PANEL'));
    assert.match(run('bitdepth', 'bitsFromRange', { dr: 9.6e-5 }).steps[1], /round UP to 1 bit —/);
    assert.match(run('pitch', 'interval', { f: 452e6, f2: 678 }).steps[2], /is 19 octaves plus a major 3rd\.$/);
    assert.match(run('pitch', 'interval', { f: 452, f2: 678 }).steps[2], /is a perfect 5th\.$/);
  });
  it('labels say what the number is', () => {
    assert.ok(run('speakerpower', 'predictspl', { sens: 97, power: 500, dist: 10, headroom: 6, nspk: 1 }).outputs.some((o) => o.label === 'SPL AT 1 m (after headroom, before distance loss)'));
    assert.ok(run('eyring', 'absForRt', { vol: 120, surf: 160, rtTarget: 0.3 }).outputs.some((o) => o.label === 'SUM OF AREA × α NEEDED (S·ā)'));
    const g = run('cable', 'recgauge', { len: 30, z: 8, maxloss: 0.5 });
    const loss = out(g, 'ITS LOSS ON THIS RUN')!.value!;
    const row12 = g.table!.rows.find((r) => r[0] === '12')!;
    assert.equal(row12[2], U.fmt(loss, 3), 'the table and the card use one sign');
    assert.equal(run('cable', 'loss', { len: 0, awg: 12, z: 4, pamp: 100 }).outputs.find((o) => o.label === 'DAMPING-FACTOR CEILING')!.text, 'No cable, so the cable puts no limit on damping factor.');
  });
  it('text corrections (audit R2 text findings)', () => {
    const lv = read('workspaces/levels.ts');
    assert.match(lv, /a small but clearly audible step; to sound twice as loud takes about \+10 dB/);
    assert.doesNotMatch(lv, /just-noticeable step|barely-noticeable step|which this tool models but does not replace/);
    assert.match(read('workspaces/loudness.ts'), /truePeak: 'Max −1 dBTP', kind: 'Delivery recommendation'/);
    assert.doesNotMatch(read('workspaces/loudness.ts'), /dBFS true peak|up to ~3 dB|up to about 3 dB higher,|≥4× oversampling/);
    assert.doesNotMatch(read('workspaces/roomsMusic.ts'), /Advanced ' \+\s*'tier roadmap|tier roadmap/);
    const tp = read('workspaces/timePhase.ts');
    assert.match(tp, /~0\.89 ms\/ft at 20 °C/);
    assert.match(tp, /differs by about 3 ms/);
    assert.match(tp, /next power of two 32768, giving 1\.46 Hz bins but a 683 ms/);
    assert.match(read('workspaces/digitalAdv.ts'), /≈ 144 dB of theoretical range/);
    assert.match(read('workspaces/powerElec.ts'), /remote 48 V supplies/);
    assert.doesNotMatch(read('workspaces/powerElec.ts'), /phantom-power feeds|nuisance-trip/);
    assert.match(read('workspaces/splSafety.ts'), /NIOSH recommends 85 dBA for 8 hours, halving the time for every 3 dB above that; the US legal limit \(OSHA\) is 90 dBA with a 5 dB rule\./);
    assert.match(read('workspaces/splSafety.ts'), /preamp’s input clip point at minimum gain — engage a pad before this SPL/);
    assert.match(read('workspaces/roomsAdvanced.ts'), /bass is most often the weakest link/);
    assert.match(read('workspaces/wavesAdv.ts'), /twice one tone, plus or minus the other/);
  });
  it('the pipeline: calcPanel runs the function’s own refusal after the field checks', () => {
    const panel = read('calcPanel.tsx');
    assert.match(panel, /const why = fn\.refuse \? fn\.refuse\(values\) : null;\n\s+if \(why\) return \{ outputs: \[\], steps: \[\], table: null, computeError: true, inputError: why \};/);
    assert.ok(panel.indexOf('domainError(fn, values, fields)') < panel.indexOf('fn.refuse(values)'));
    assert.match(panel, /const units = outputUnits\(o\.quantity, o\.unit\);/);
  });
});
