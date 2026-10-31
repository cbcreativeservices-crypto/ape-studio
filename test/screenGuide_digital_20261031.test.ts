/**
 * Screen Guide rollout — Digital Audio Sampling & Conversion Lab (owner
 * 2026-10-31) — receipts. Pattern: test/screenGuide_20261031.test.ts (Wave).
 *
 *   1. every DigitalModuleId, the lab home and the what's-left screen have a
 *      guide with all five sections, 1–5 bullets each, 2–3 TRY THIS items,
 *      in the house copy rules;
 *   2. every section fits its no-scroll budget (SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each pinned name is in both
 *      the guide and the lab's source (rename one → update the guide);
 *   4. the TRY THIS numbers match the modules' own formulas and defaults;
 *   5. wiring: both headers pass `guide` to LabHeader inside a ScreenGuideHost
 *      (regions on the Rack Unit module host, off on the menu);
 *   6. chip decision pinned: Digital Audio is a CONCEPT lab (exact sampling /
 *      quantization math and disclosed illustrative models — no live mic, no
 *      real-world measurement), so neither header renders AccuracyNote.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { DIGITAL_MODULES } = await import('../src/screens/lab/digital/modules/registry.ts');
const { DIGITAL_SCREEN_GUIDES, DIGITAL_HOME_GUIDE, DIGITAL_END_GUIDE } = await import(
  '../src/screens/lab/digital/digitalScreenGuides.ts'
);
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const MODS = DIGITAL_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [
  ['home', DIGITAL_HOME_GUIDE as unknown as Guide],
  ['end', DIGITAL_END_GUIDE as unknown as Guide],
  ...Object.entries(MODS),
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

describe('1. every Digital screen has a complete guide', () => {
  it('every DigitalModuleId has a guide — and no guide is for a module that does not exist', () => {
    const ids = DIGITAL_MODULES.map((m: { id: string }) => m.id).sort();
    assert.equal(ids.length, 8);
    assert.deepEqual(Object.keys(DIGITAL_SCREEN_GUIDES).sort(), ids);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no "recommend", no build notes, no brand names', () => {
    for (const [id, gd] of allGuides) {
      // The Module 8 card's on-screen title says "ONE MASTER" (a device role,
      // not a skill claim) — quoted verbatim, so it is set aside here.
      const t = textOf(gd).replace('CLOCKING — ONE MASTER, THE REST FOLLOW', '');
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|ratchet|test\/)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Pro Tools|Logic|Ableton|Cubase|Apogee|RME|Focusrite|Universal Audio|Antelope|Lynx)\b/, `${id}: a gear/software brand`);
    }
  });
});

describe('2. stepped: every section fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length})`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, []);
  });
});

describe('3. each guide quotes its screen’s real names', () => {
  const D = 'src/screens/lab/digital/';
  const MOD_SRC: Record<string, string[]> = {
    analog: ['modules/modAnalog.tsx', 'vizSignal.tsx'],
    sampling: ['modules/modAnalog.tsx', 'vizSignal.tsx'],
    quant: ['modules/modQuant.tsx', 'vizQuant.tsx'],
    binary: ['modules/modQuant.tsx', 'vizQuant.tsx'],
    adc: ['modules/modChain.tsx', 'vizChain.tsx', 'bits.tsx'],
    processing: ['modules/modChain.tsx', 'vizChain.tsx'],
    dac: ['modules/modDac.tsx', 'vizDac.tsx'],
    errors: ['modules/modDac.tsx', 'vizDac.tsx', 'modules/clockingCard.ts'],
  };
  const NAMES: Record<string, string[]> = {
    analog: ['SPEAKER', 'PRESSURE →', 'MIC', 'CONTINUOUS VOLTAGE →', 'FREQ', 'PERIOD', 'PEAK', 'RMS', 'AMP', 'ZOOM', 'WAVE', 'SINE', 'SQUARE', 'TRIANGLE', 'SAW', 'IMPULSE', 'WHITE NOISE', 'MODS', 'POLARITY Ø INVERT', 'ADD NOISE', 'ADD DISTORTION'],
    sampling: ['INPUT — CONTINUOUS', 'TRUE INPUT (DIM) — ABOVE NYQUIST', 'ALIAS REMOVED', 'FS', 'INPUT', 'NYQUIST', 'READS AS', 'FREQ', 'ZOOM', 'RATE', '/CYC', 'RECONSTRUCTED · ON', 'ALIAS', 'PLAY INPUT', 'PLAY PREDICTED ALIAS', 'ANTI-ALIASING FILTER', 'FILTER OFF', 'FILTER ON', 'dB/OCT', 'CUTOFF'],
    quant: ['AMBER = ORIGINAL · BLUE = SAMPLED · GREEN = STORED/RESULT · RED = ROUNDING ERROR', 'BITS', 'LEVELS', 'TH. SNR', 'PEAK', 'LEVEL', '-BIT', 'ERROR', 'DITHER', 'NO DITHER', 'RPDF', 'TPDF', 'NOISE-SHAPED', 'CORRELATED', 'ERROR HISTOGRAM'],
    binary: ['SAMPLE', 'DECIMAL', 'HEX', 'LEVEL', 'TIME', 'BINARY', 'NORMALIZED', '% OF FS', 'RESET REG', 'SIGN', '16-bit · 48 kHz'],
    adc: ['0 dBFS (full scale)', 'analog rail', 'noise floor', 'ANLG', 'DIG', 'TOO LOW', 'RIGHT', 'TOO HIGH', 'PEAK', 'SNR', 'HEADROOM', 'ZONE', 'INPUT', 'AN. CLIP', 'A+D CLIP', '0.0 OVER', 'THE CONVERSION CHAIN', 'SIMPLIFIED', 'STANDARD', 'X-RAY', 'SAMPLE & HOLD — WATCH ONE CELL WORK'],
    processing: ['FLOAT INTERNAL PATH', 'FIXED-POINT RENDER (24-BIT)', 'FLOAT BUS', 'FIXED', '0.0 CLIP', 'TRIM', 'GAIN', 'VALUE', 'HOW A FLOAT NUMBER WORKS', 'SIGN', 'EXPONENT (decade)', 'MANTISSA (slides 1→10)', 'INTEGER vs FLOATING POINT'],
    dac: ['SAMPLES', 'ZOH', 'RECONSTRUCTED', 'ORIGINAL', 'DAC CLOCK', 'RECON LPF', 'FS', 'MODE', 'LAYERS', 'INTER-SAMPLE PEAKS', 'SAMPLE PK', 'TRUE PK', 'MISSED', 'SIMPLIFIED', 'STANDARD', 'X-RAY', 'OS RATE', 'SPECTRAL IMAGES & OVERSAMPLING', 'ISP FREQ', 'PHASE', 'INTER-SAMPLE PEAK EXPLORER', 'dBTP'],
    errors: ['IDEAL CLOCK', 'WITH JITTER (EXAGGERATED)', 'VALUE ERROR ≈ SLOPE × TIMING ERROR', 'INTERVAL', '20.83 µs @48k', 'PEAK DEV', 'MODE', 'JITTER', 'JITTER MODE', 'RANDOM', 'PERIODIC', 'CLOCKING — ONE MASTER, THE REST FOLLOW', 'MODULE 8 · MYTH vs REALITY', 'DATA RATE — THE MENTAL MATH'],
  };
  const HOME_SRC = code(`${D}DigitalLabHomeScreen.tsx`) + code('src/screens/lab/ModuleAccordionRow.tsx');
  const HOME_NAMES = ['SOUND', 'ANALOG', 'SAMPLES', 'NUMBERS', 'LOUDSPEAKER', 'THE EIGHT MODULES', 'SECONDARY TOOLS', 'LEARNING', 'GUIDED LESSON', 'OPEN', 'SAMPLE INSPECTOR', 'ALIASING EXPLORER', 'DITHER COMPARATOR', 'TRUE-PEAK EXPLORER', 'CLOCK & JITTER', 'DATA-RATE CALCULATOR', 'BUFFER LATENCY CALC', 'FFT RESOLUTION CALC', 'SEE WHAT’S LEFT', 'MYTH vs REALITY'];
  const END_SRC = code('src/screens/lab/kit/LabEndScreen.tsx') + code('src/screens/lab/kit/labEnd.ts');
  /** [as written in the source, as written in the guide] — the source spells WHAT'S with a straight quote. */
  const END_NAMES: [string, string][] = [
    ["WHAT'S LEFT", 'WHAT’S LEFT'],
    ...['LAB COMPLETE', 'CREDITED', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'YOUR PROGRESS'].map((n): [string, string] => [n, n]),
  ];

  it('a name list for every module', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(MODS).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const src = MOD_SRC[id].map((f) => code(D + f)).join('\n');
      const gt = textOf(MODS[id]);
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the module/renderer source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('home: every pinned name is on the menu AND in the guide', () => {
    const gt = textOf(DIGITAL_HOME_GUIDE as unknown as Guide);
    for (const n of HOME_NAMES) {
      assert.ok(HOME_SRC.includes(n), `home: "${n}" is no longer on the menu`);
      assert.ok(gt.includes(n), `home: the guide never names "${n}"`);
    }
  });
  it('what’s left: every pinned name is on the end screen AND in the guide', () => {
    const gt = textOf(DIGITAL_END_GUIDE as unknown as Guide);
    for (const [inSrc, inGuide] of END_NAMES) {
      assert.ok(END_SRC.includes(inSrc), `end: "${inSrc}" is no longer on the end screen`);
      assert.ok(gt.includes(inGuide), `end: the guide never names "${inGuide}"`);
    }
  });
});

describe('4. TRY THIS numbers are what the modules print', () => {
  const t = (id: string) => MODS[id].tryThis.join('\n');
  const A = code('src/screens/lab/digital/modules/modAnalog.tsx');
  const Q = code('src/screens/lab/digital/modules/modQuant.tsx');
  const C = code('src/screens/lab/digital/modules/modChain.tsx');
  const K = code('src/screens/lab/digital/modules/modDac.tsx');

  it('Module 1: 60–2000 Hz FREQ, PERIOD = 1000/f ms, AMP starts at 0.75 FS', () => {
    assert.match(A, /const F1_MIN = 60;/);
    assert.match(A, /const F1_MAX = 2000;/);
    assert.match(A, /useState\(0\.72\)/);
    assert.equal((0.12 + 0.72 * 0.88).toFixed(2), '0.75');
    assert.equal((1000 / 2000).toFixed(2), '0.50');
    assert.equal((1000 / 60).toFixed(2), '16.67');
    for (const s of ['2000 Hz', '0.50 ms', '60 Hz', '16.67 ms', '0.75 FS', '0.53', '0.63', '0.15 FS']) assert.ok(t('analog').includes(s), s);
  });
  it('Module 2: 48k default, sweep tops at 30 kHz, alias 18 kHz; cutoff floor 0.3 × Nyquist = 7.2 kHz; 1.7 /CYC folds to 0.7 × f', () => {
    assert.match(A, /useState<RateMode>\(\{ kind: 'abs', fs: 48000 \}\)/);
    assert.match(A, /Math\.min\(rateMode\.fs \* 0\.75, 30000\)/);
    assert.match(A, /const cutoffHz = \(0\.3 \+ 0\.68 \* cutV\) \* nyq;/);
    assert.match(A, /const CYC_CHIPS = \[4, 3, 2\.5, 2, 1\.7\];/);
    const alias = (f: number, fs: number) => Math.abs(f - Math.round(f / fs) * fs);
    assert.equal(alias(30000, 48000), 18000);
    assert.ok(Math.abs(alias(1000, 1700) - 700) < 1e-9);
    // 24 dB/oct at the floor cutoff: the input is cut below the 0.04 "removed" line.
    const g = 1 / Math.sqrt(1 + Math.pow(30000 / 7200, 2 * 4));
    assert.ok(g <= 0.04);
    for (const s of ['30 kHz', '18 kHz', '7.2 kHz', '1.7 /CYC', '0.7 × INPUT']) assert.ok(t('sampling').includes(s), s);
  });
  it('Module 3: levels 2ᴺ, TH. SNR 6.02·N + 1.76; 8-bit turns CORRELATED below −24 dBFS', () => {
    assert.match(Q, /const drTheory = 6\.02 \* bits \+ 1\.76;/);
    assert.match(Q, /const correlated = amp < 8 \* step;/);
    assert.equal((6.02 * 4 + 1.76).toFixed(1), '25.8');
    assert.equal((6.02 * 16 + 1.76).toFixed(1), '98.1');
    const amp = (db: number) => Math.pow(10, db / 20);
    assert.ok(!(amp(-24) < 8 / 128) && amp(-25) < 8 / 128);
    for (const s of ['≈25.8 dB', '≈98.1 dB', '65,536', '−24 dBFS']) assert.ok(t('quant').includes(s), s);
  });
  it('Module 4: the inspector samples and the register, as stored', () => {
    const S: number[] = [];
    for (let i = 0; i < 28; i++) {
      const x = i / 28;
      const v = 0.68 * Math.sin(2 * Math.PI * 2 * x) + 0.24 * Math.sin(2 * Math.PI * 5 * x + 1.3);
      S.push(Math.max(-32768, Math.min(32767, Math.round(v * 0.92 * 32767))));
    }
    assert.match(Q, /0\.68 \* Math\.sin\(2 \* Math\.PI \* 2 \* t\) \+ 0\.24 \* Math\.sin\(2 \* Math\.PI \* 5 \* t \+ 1\.3\)/);
    assert.match(Q, /useState\(7\)/);
    assert.match(Q, /useState\(16384\)/);
    assert.equal(S[7], 1935);
    assert.equal(S[21], -1935);
    assert.equal(S[17], 27212);
    assert.equal(Math.max(...S.map(Math.abs)), 27212);
    const db = (v: number) => (20 * Math.log10(Math.abs(v) / 32768)).toFixed(1);
    assert.equal(db(1935), '-24.6');
    assert.equal(db(27212), '-1.6');
    assert.equal(db(16384), '-6.0');
    for (const s of ['1,935', '0x078F', '−24.6 dBFS', '0xF871', '27,212', '−1.6 dBFS', '0x4000', '0xC000', '−6.0 dBFS']) assert.ok(t('binary').includes(s), s);
  });
  it('Module 5: INPUT −54…+12 dB, default 0.6 of travel; the readouts at start, bottom, top and +1 dB', () => {
    assert.match(C, /const DRIVE_MIN = -54;/);
    assert.match(C, /const DRIVE_MAX = 12;/);
    assert.match(C, /useState\(0\.6\)/);
    const gr = (d: number) => {
      const rail = Math.pow(10, 3 / 20);
      const ao = rail * Math.tanh(Math.pow(10, d / 20) / rail);
      const over = ao >= 0.999;
      const rp = 20 * Math.log10(Math.max(1e-4, Math.min(1, ao)));
      const zone = d < -18 ? 'TOO LOW' : d <= -10 ? 'RIGHT' : 'TOO HIGH';
      return { peak: over ? '0.0 OVER' : rp.toFixed(1), snr: (rp + 60).toFixed(0), head: over ? 'none' : (-rp).toFixed(1), zone: d > 0.5 && over ? 'A+D CLIP' : d > 0.5 ? 'AN. CLIP' : zone };
    };
    assert.deepEqual(gr(-54 + 0.6 * 66), { peak: '-14.5', snr: '46', head: '14.5', zone: 'RIGHT' });
    assert.deepEqual(gr(-54), { peak: '-54.0', snr: '6', head: '54.0', zone: 'TOO LOW' });
    assert.deepEqual(gr(12), { peak: '0.0 OVER', snr: '60', head: 'none', zone: 'A+D CLIP' });
    assert.equal(gr(1).zone, 'AN. CLIP');
    assert.ok(Number(gr(1).peak) < 0);
    for (const s of ['−14.5 dBFS', 'SNR 46 dB', '−54.0 dBFS', 'SNR 6 dB', '0.0 OVER', 'HEADROOM none', 'A+D CLIP', 'AN. CLIP']) assert.ok(t('adc').includes(s), s);
  });
  it('Module 6: bus = −6 + 12 × GAIN, starting at the top; TRIM takes off the added 12 dB', () => {
    assert.match(C, /const gainDb = 12 \* gain01;/);
    assert.match(C, /const busDb = -6 \+ gainDb;/);
    assert.match(C, /const \[gain01, setGain01\] = useState\(1\);/);
    for (const s of ['+6.0', '0.0 CLIP', '−12.0 dB', '−6.0']) assert.ok(t('processing').includes(s), s);
    assert.ok(MODS.processing.control.join(' ').includes('3.9811'));
    assert.equal(Math.pow(10, -3 + 3.6).toFixed(4), '3.9811');
  });
  it('Module 7: ISP FREQ 0.40–0.49 fs at 48k, PHASE 0–180°; true peak at the top setting', () => {
    assert.match(K, /const ratio = 0\.4 \+ ratio01 \* 0\.09;/);
    assert.match(K, /const phaseDeg = phase01 \* 180;/);
    assert.match(K, /const ISP_SAMPLE_PEAK_DB = -0\.1;/);
    const tp = (deg: number) => {
      let m = 0;
      for (let n = 0; n < 16; n++) m = Math.max(m, Math.abs(Math.sin(2 * Math.PI * 0.49 * n + (deg * Math.PI) / 180)));
      return -0.1 - 20 * Math.log10(m);
    };
    for (const d of [44.5, 45, 45.49]) assert.ok(Math.abs(tp(d) - 2.9) < 0.1, `PHASE ${d}° → ${tp(d)}`);
    assert.equal(tp(90).toFixed(2), '-0.10');
    assert.equal((0.4 * 48).toFixed(1), '19.2');
    assert.equal((0.49 * 48).toFixed(1), '23.5');
    for (const s of ['+2.9 dBTP', '3 dB', '−0.10 dBFS', '−0.10 dBTP', 'MISSED 0.00 dB']) assert.ok(t('dac').includes(s), s);
  });
  it('Module 8: JITTER peak deviation = 8 ns × travel, starting at ±4.8 ns', () => {
    assert.match(K, /const \[jitAmt, setJitAmt\] = useState\(0\.6\);/);
    assert.match(K, /const peakDevNs = jitAmt \* 8;/);
    assert.ok(MODS.errors.control.join(' ').includes('±4.8 ns'));
    for (const s of ['±8.0 ns', '±0.0 ns']) assert.ok(t('errors').includes(s), s);
  });
});

describe('5. wiring: the ⓘ on both Digital headers, inside a ScreenGuideHost', () => {
  const MOD = code('src/screens/lab/digital/DigitalModuleScreen.tsx');
  const HOME = code('src/screens/lab/digital/DigitalLabHomeScreen.tsx');
  it('DigitalModuleScreen: the module’s guide (the end guide on what’s left), host with regions (Rack Unit modules)', () => {
    assert.match(MOD, /import \{ DIGITAL_END_GUIDE, DIGITAL_SCREEN_GUIDES \} from '\.\/digitalScreenGuides';/);
    assert.match(MOD, /<LabHeader[\s\S]*?guide=\{ending \? DIGITAL_END_GUIDE : DIGITAL_SCREEN_GUIDES\[meta\.id\]\}/);
    assert.match(MOD, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : meta\.id\}>/);
    assert.match(MOD, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
    assert.doesNotMatch(MOD, /<ScreenGuideHost[^>]*regions=\{false\}/, 'module host keeps the Rack Unit regions');
  });
  it('DigitalLabHomeScreen: the home guide (the end guide on what’s left), host without regions', () => {
    assert.match(HOME, /import \{ DIGITAL_END_GUIDE, DIGITAL_HOME_GUIDE \} from '\.\/digitalScreenGuides';/);
    assert.match(HOME, /<LabHeader[\s\S]*?guide=\{ending \? DIGITAL_END_GUIDE : DIGITAL_HOME_GUIDE\}/);
    assert.match(HOME, /<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : 'list'\}>/);
    assert.match(HOME, /<\/ScreenGuideHost>\s*<\/View>/);
  });
  it('every Digital module renders a Rack Unit (so the default regions are measured, never guessed)', () => {
    for (const f of ['modAnalog', 'modQuant', 'modChain', 'modDac']) {
      assert.match(code(`src/screens/lab/digital/modules/${f}.tsx`), /<RackUnit/);
    }
    assert.match(MOD, /const RACK_MODULES = new Set<DigitalModuleId>\(\[\s*'analog',\s*'sampling',\s*'quant',\s*'binary',\s*'adc',\s*'processing',\s*'dac',\s*'errors',\s*\]\)/);
  });
});

describe('6. chip decision: Digital Audio is a CONCEPT lab — no accuracy chip', () => {
  it('neither Digital header renders AccuracyNote; the ⓘ takes its spot', () => {
    for (const p of ['src/screens/lab/digital/DigitalModuleScreen.tsx', 'src/screens/lab/digital/DigitalLabHomeScreen.tsx']) {
      const s = code(p);
      assert.doesNotMatch(s, /AccuracyNote/, `${p} still renders the accuracy chip`);
      assert.doesNotMatch(s, /right=\{/, `${p}: nothing else sits in the header's right slot`);
    }
  });
  it('the model scenes carry their own illustrative-model badges (Modules 3–4 are exact math)', () => {
    const M = (f: string) => code(`src/screens/lab/digital/modules/${f}.tsx`);
    const BADGES: [string, string[]][] = [
      ['modAnalog', ['ILLUSTRATIVE MODEL, SLOWED']], // Module 1
      ['modChain', ['ILLUSTRATIVE MODEL — level axis compressed', 'ILLUSTRATIVE MODEL — one drawn bus']], // Modules 5, 6
      ['modDac', ['CONCEPTUAL MODEL', 'EXACT SINE MATH', 'TIMING DEVIATION EXAGGERATED ×1000']], // Modules 7, 8
    ];
    for (const [f, bs] of BADGES) for (const b of bs) assert.ok(M(f).includes(b), `${f}: "${b}"`);
  });
  it('the home guide says which numbers are exact math and which are models (the chip’s honesty line)', () => {
    const t = (DIGITAL_HOME_GUIDE as unknown as Guide).teaches.join(' ');
    assert.match(t, /exact math/i);
    assert.match(t, /illustrative models, not measurements/);
    assert.match(MODS.adc.seeing.join(' '), /An illustrative model/);
  });
  it('the what’s-left guide card is titled WHAT’S LEFT on both hosts, not the module/lab title', () => {
    for (const p of ['src/screens/lab/digital/DigitalModuleScreen.tsx', 'src/screens/lab/digital/DigitalLabHomeScreen.tsx']) {
      assert.match(code(p), /guideTitle=\{ending \? 'WHAT’S LEFT' : undefined\}/, p);
    }
  });
});
