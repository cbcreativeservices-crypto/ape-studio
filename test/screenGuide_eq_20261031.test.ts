/**
 * Screen Guide rollout — EQ Lab (owner 2026-10-31) — receipts. Pattern:
 * test/screenGuide_20261031.test.ts (Wave) and screenGuide_digital_20261031.
 *
 *   1. every EqModuleId, the lab home and the what's-left screen have a guide
 *      with all five sections, 1–5 bullets each, 2–3 TRY THIS items, in the
 *      house copy rules — and each module's guide names its neighbours in
 *      the lesson order by their real titles;
 *   2. every section fits its no-scroll budget (SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each pinned name is in both
 *      the guide and the module's source (rename one → update the guide);
 *   4. the TRY THIS numbers match the modules' own formulas and defaults;
 *   5. wiring: both headers pass `guide` to LabHeader inside a
 *      ScreenGuideHost (regions only on Rack Unit modules, off on the menu);
 *   6. chip decision pinned: the chip stays only on the two LIVE-MICROPHONE
 *      modules (Seeing Frequency, Live Spectrum + EQ); the menu, the concept
 *      modules, the synthetic trainers and the what's-left screen drop it.
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

const { EQ_MODULES } = await import('../src/screens/lab/eq/modules/registry.ts');
const { EQ_SCREEN_GUIDES, EQ_HOME_GUIDE, EQ_END_GUIDE } = await import('../src/screens/lab/eq/eqScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const M = await import('../src/screens/lab/eq/modules/eqMath.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const MODS = EQ_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [
  ['home', EQ_HOME_GUIDE as unknown as Guide],
  ['end', EQ_END_GUIDE as unknown as Guide],
  ...Object.entries(MODS),
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');
const D = 'src/screens/lab/eq/';
const mod = (f: string) => code(`${D}modules/${f}.tsx`);

describe('1. every EQ Lab screen has a complete guide', () => {
  it('every EqModuleId has a guide — and no guide is for a module that does not exist', () => {
    const ids = EQ_MODULES.map((m: { id: string }) => m.id).sort();
    assert.equal(ids.length, 15);
    assert.deepEqual(Object.keys(EQ_SCREEN_GUIDES).sort(), ids);
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
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\b\d+\s*\/\s*(5|15|2)\b(?!\s*-?oct)/i, `${id}: an "n/total" readout quoted`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|ratchet|test\/)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Pro Tools|Logic|Ableton|Cubase|FabFilter|Waves|API|SSL|Neve|Pultec|Klark|dbx|Behringer|Yamaha)\b/, `${id}: a gear/software brand`);
    }
  });
  it('each module guide names the module before and after it by their real titles (the lesson order)', () => {
    const titles = EQ_MODULES.map((m: { title: string }) => m.title);
    EQ_MODULES.forEach((m: { id: string }, i: number) => {
      const t = MODS[m.id].teaches.join(' ');
      if (i > 0) assert.ok(t.includes(titles[i - 1]), `${m.id}: teaches never names the previous module "${titles[i - 1]}"`);
      if (i < titles.length - 1) assert.ok(t.includes(titles[i + 1]), `${m.id}: teaches never names the next module "${titles[i + 1]}"`);
    });
    // The Advanced Training menu lists categories A→Z (Dynamics sits BEFORE Equalization), so Dynamics is suggested, never 'next'.
    assert.match(MODS.challenges.teaches.join(' '), /A good next step: the Dynamics labs/);
    assert.match((EQ_HOME_GUIDE as unknown as Guide).teaches.join(' '), /try Dynamics next/);
    for (const gd of [MODS.challenges, EQ_HOME_GUIDE as unknown as Guide]) assert.doesNotMatch(gd.teaches.join(' '), /Dynamics comes next/);
  });
  it('the home guide’s module ranges match the registry’s sections (LEARN 1–8, EXPLORE 9–11, TRAIN 12–14, CHALLENGE 15)', () => {
    const sec = EQ_MODULES.map((m: { section: string }) => m.section);
    assert.deepEqual(sec, ['learn', 'learn', 'learn', 'learn', 'learn', 'learn', 'learn', 'learn', 'explore', 'explore', 'explore', 'train', 'train', 'train', 'challenge']);
    const ch = (EQ_HOME_GUIDE as unknown as Guide).changes.join('\n');
    for (const r of ['Modules 1–3', 'Modules 4–8', 'Modules 9–11', 'Modules 12–15']) assert.ok(ch.includes(r), r);
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
  const RACK = 'src/screens/lab/rack/RackUnit.tsx';
  const EXPAND = 'src/screens/lab/kit/ExpandableFigure.tsx';
  const AUD = `${D}modules/eqAudition.tsx`;
  const MOD_SRC: Record<string, string[]> = {
    spectrum: [`${D}modules/SeeingFrequency.tsx`, RACK],
    whyEq: [`${D}modules/WhyEq.tsx`, EXPAND],
    camera: [`${D}modules/CameraAnalogy.tsx`],
    parametric: [`${D}modules/ParametricControls.tsx`],
    qband: [`${D}modules/QBandwidth.tsx`],
    shapes: [`${D}modules/FilterShapes.tsx`],
    slopes: [`${D}modules/FilterSlopes.tsx`],
    gvp: [`${D}modules/GraphicVsParametric.tsx`],
    multiband: [`${D}modules/MultiBand.tsx`, AUD],
    graphic: [`${D}modules/GraphicTruth.tsx`],
    liveEq: [`${D}modules/LiveSpectrumEq.tsx`],
    findFreq: [`${D}modules/FindFrequency.tsx`, AUD],
    matchCurve: [`${D}modules/MatchCurve.tsx`],
    fixSignal: [`${D}modules/FixSignal.tsx`, AUD],
    challenges: [`${D}modules/EqChallenges.tsx`, EXPAND, AUD],
  };
  const NAMES: Record<string, string[]> = {
    spectrum: ['LOW CUT', 'HPF', 'SLOPE', '12/OCT', 'RES', '1/3 OCT', 'MIC', 'LIVE', 'PAUSED', 'OFF', 'FULL SCREEN'],
    whyEq: ['EQ RESPONSE', 'PICK A REGION', 'LOW', 'MID', 'HIGH', 'GAIN', 'BOOST', 'CUT / ATTENUATION', 'FLAT', 'FULL SCREEN'],
    camera: ['EQ TYPE', 'FIXED', 'SEMI-PARAMETRIC', 'FULLY PARAMETRIC', 'SEMI', 'FULL', 'PAN', 'ZOOM', 'FREQ', 'WIDTH', 'MOVE THE CAMERA = FREQUENCY', 'ZOOM THE CAMERA = Q / BANDWIDTH'],
    parametric: ['FREQ', 'GAIN', 'BW'],
    qband: ['BW', 'FREQ', 'GAIN', 'HIGH Q = NARROW · LOW Q = WIDE'],
    shapes: ['SHAPE', 'BELL / PEAK', 'LOW SHELF', 'HIGH SHELF', 'HIGH-PASS / LOW-CUT', 'LOW-PASS / HIGH-CUT', 'NOTCH', 'CUTOFF', 'FREQ', 'GAIN', 'HPF', 'LPF', '12 dB/octave'],
    slopes: ['SLOPE', 'CUTOFF', '@40 Hz', '@20 Hz', 'dB/OCT'],
    gvp: ['BOARD', 'RANGE', '±12 dB', 'BAND', 'LEVEL', '1-OCTAVE · 10 BANDS', '1/3-OCTAVE · 31 BANDS', 'RESET', 'ACTUAL combined response'],
    multiband: ['HPF', 'LOW', 'LMF', 'HMF', 'HIGH', 'LPF', 'BAND', 'FREQ', 'GAIN', 'ACTIVE', 'BYPASS', 'BAND ON', 'BAND OFF', 'RESET', 'BYP', 'COMBINED', 'HEAR IT', 'PINK NOISE', 'SWEEP'],
    graphic: ['VIEW', 'MAG', 'PHASE ±180°', 'FILTERS', 'SHOWN', 'HIDDEN', 'BAND', 'LEVEL', 'MAGNITUDE', 'PHASE', 'EXAMPLE', 'CLEAR', 'THE SLIDERS ARE NOT THE RESPONSE'],
    liveEq: ['VIEW', 'LOW CUT', 'BAND', 'MIC', 'SPECTRUM ONLY', 'EQ ONLY', 'COMBINED', 'BAND ON', 'BAND OFF', 'MIC LIVE — PAUSE', 'MIC PAUSED — RESUME', 'dBFS · UNCALIBRATED APPROXIMATE', 'SLOPE', 'dB/OCT', 'FREQ', 'GAIN'],
    findFreq: ['LVL', 'BAND', 'RESULT', 'PASS', 'MISS', 'LEVEL', 'NEW SIGNAL', 'CHECK', 'NEXT LEVEL ›', 'Target', 'Your selection', 'Difference', 'REFERENCE', 'SIGNAL', 'HEAR IT', 'PINK NOISE', 'SWEEP'],
    matchCurve: ['TARGET', 'MATCH', 'HIDDEN', 'BANDS', 'BAND', 'SCORE', 'HIDE', 'NEW', 'EXCELLENT', 'CLOSE', 'KEEP TRYING'],
    fixSignal: ['CASE', 'SCEN', 'RESULT', 'FIXED', 'NOT YET', 'BOOMY KICK', 'HARSH VOCAL', 'STAGE RUMBLE', 'HONKY GUITAR', 'SIBILANT VOCAL', 'CHECK', 'REFERENCE', 'SIGNAL', 'HEAR IT'],
    challenges: ['THE PROBLEM', 'STRATEGY: CUT', 'STRATEGY: BOOST AROUND', '250 Hz +6 dB', 'overall shift', 'PROBLEM ONLY', 'CUT THE PROBLEM (−6 @ 250)', 'BOOST AROUND IT (+6)', 'CUT −6 @ 250 Hz', 'BOOST +6 AROUND IT', 'FULL SCREEN', 'HEAR IT'],
  };
  const HOME_SRC = [
    `${D}EqLabHomeScreen.tsx`,
    `${D}modules/registry.ts`,
    'src/screens/lab/ModuleAccordionRow.tsx',
    'src/components/LabUnderstandingCheck.tsx',
  ].map(code).join('\n');
  const HOME_NAMES = ['SEE', 'MANIPULATE', 'HEAR', 'IDENTIFY', 'CORRECT', 'LEARN', 'EXPLORE', 'TRAIN', 'CHALLENGE', 'OPEN', 'CHECK YOUR UNDERSTANDING', 'SEE WHAT’S LEFT', 'RELATED TOOLS', 'SPECTRUM ANALYZER / RTA', 'EQUALIZER EFFECT LAB', 'Q & BANDWIDTH CALC'];
  const END_SRC = code('src/screens/lab/kit/LabEndScreen.tsx') + code('src/screens/lab/kit/labEnd.ts');
  /** [as written in the source, as written in the guide] — the source spells WHAT'S with a straight quote. */
  const END_NAMES: [string, string][] = [
    ["WHAT'S LEFT", 'WHAT’S LEFT'],
    ...['LAB COMPLETE', 'DONE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'YOUR PROGRESS'].map((n): [string, string] => [n, n]),
  ];

  it('a name list for every module', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(MODS).sort());
    assert.deepEqual(Object.keys(MOD_SRC).sort(), Object.keys(MODS).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const src = MOD_SRC[id].map(code).join('\n');
      const gt = textOf(MODS[id]);
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the module source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('home: every pinned name is on the menu AND in the guide; every module title quoted is real', () => {
    const gt = textOf(EQ_HOME_GUIDE as unknown as Guide);
    for (const n of HOME_NAMES) {
      assert.ok(HOME_SRC.includes(n), `home: "${n}" is no longer on the menu`);
      assert.ok(gt.includes(n), `home: the guide never names "${n}"`);
    }
    assert.ok(EQ_MODULES.some((m: { title: string }) => m.title === 'Seeing Frequency'));
  });
  it('what’s left: every pinned name is on the end screen AND in the guide; the EQ Lab end screen is "progress" mode (rows read DONE)', () => {
    const gt = textOf(EQ_END_GUIDE as unknown as Guide);
    for (const [inSrc, inGuide] of END_NAMES) {
      assert.ok(END_SRC.includes(inSrc), `end: "${inSrc}" is no longer on the end screen`);
      assert.ok(gt.includes(inGuide), `end: the guide never names "${inGuide}"`);
    }
    for (const p of ['EqLabHomeScreen.tsx', 'EqModuleScreen.tsx']) assert.match(code(D + p), /mode="progress"/, p);
    assert.doesNotMatch(gt, /CREDITED/, 'progress mode never reads CREDITED');
    assert.equal(EQ_MODULES[0].title, 'Seeing Frequency');
    assert.ok(gt.includes('opens Seeing Frequency'));
  });
});

describe('4. TRY THIS (and quoted) numbers are what the modules print', () => {
  const t = (id: string) => MODS[id].tryThis.join('\n');
  const all = (id: string) => textOf(MODS[id]);
  const hp12 = (f0: number, f: number) => {
    const r4 = Math.pow(f / f0, 4);
    return 10 * Math.log10(r4 / (1 + r4));
  };

  it('Seeing Frequency: the LOW CUT ladder, a 12 dB/oct Butterworth — −3 dB at the cutoff, about −12 dB an octave below', () => {
    const S = mod('SeeingFrequency');
    assert.match(S, /const HPF_CHOICES = \[20, 40, 60, 80, 100, 120, 160\] as const;/);
    assert.match(S, /useState<number \| null>\(null\)/);
    assert.match(code('src/features/lab/fxViz.tsx'), /const r4 = Math\.pow\(r, 4\);\s*return 10 \* Math\.log10\(Math\.max\(r4 \/ \(1 \+ r4\), 1e-12\)\);/);
    assert.equal(hp12(80, 80).toFixed(1), '-3.0');
    assert.equal(Math.round(hp12(80, 40)), -12);
    assert.match(S, /butterworthHighPassDb\(hpfHz, c\)/, 'the low cut really is applied to the drawn bars');
    for (const s of ['80 Hz', '12 dB lower at 40 Hz', 'PAUSED']) assert.ok(t('spectrum').includes(s), s);
    assert.ok(all('spectrum').includes('20, 40, 60, 80, 100, 120 or 160 Hz'));
  });
  it('Why We Use EQ: regions 120 Hz / 1.00 kHz / 6.00 kHz, ±12 dB, starting MID +6.0 dB; verdicts as printed', () => {
    const W = mod('WhyEq');
    assert.match(W, /\{ key: 'LOW', f: 120 \}/);
    assert.match(W, /\{ key: 'MID', f: 1000 \}/);
    assert.match(W, /\{ key: 'HIGH', f: 6000 \}/);
    assert.match(W, /const GAIN_RANGE = 12;/);
    assert.match(W, /useState<\(typeof REGIONS\)\[number\]>\(REGIONS\[1\]\)/);
    assert.match(W, /const \[gainDb, setGainDb\] = useState\(6\);/);
    assert.equal(M.fmtHz(120), '120 Hz');
    assert.equal(M.fmtHz(1000), '1.00 kHz');
    assert.equal(M.fmtHz(6000), '6.00 kHz');
    for (const v of ['BOOST —', 'CUT / ATTENUATION —', 'FLAT —']) assert.ok(W.includes(v), v);
    for (const s of ['MID, +6.0 dB', '−6.0 dB', '0.0 dB']) assert.ok(t('whyEq').includes(s), s);
  });
  it('Camera Analogy: fixed 2.00 kHz; locked lens 0.89 oct / Q 1.6; ZOOM 4.00 oct (Q 0.3) to 0.25 oct (Q 5.8)', () => {
    const C = mod('CameraAnalogy');
    assert.match(C, /const bwFromZoom = \(z: number\) => 4 - 3\.75 \* z;/);
    assert.match(C, /const LOCKED_ZOOM = 0\.83;/);
    assert.match(C, /const FIXED_FREQ = 2000;/);
    assert.match(C, /const ANALOGY_GAIN_DB = 9;/);
    const bw = (z: number) => 4 - 3.75 * z;
    assert.equal(bw(0.83).toFixed(2), '0.89');
    assert.equal(M.qFromBwOct(bw(0.83)).toFixed(1), '1.6');
    assert.equal(M.qFromBwOct(bw(1)).toFixed(1), '5.8');
    assert.equal(bw(1).toFixed(2), '0.25');
    assert.equal(M.qFromBwOct(bw(0)).toFixed(1), '0.3');
    assert.equal(M.qFromBwOct(bw(0)).toFixed(2), '0.27'); // the readout rounds 0.27 to 0.3
    assert.equal(bw(0).toFixed(2), '4.00');
    assert.equal(M.fmtHz(2000), '2.00 kHz');
    for (const s of ['2.00 kHz', 'Q stays 1.6', 'WIDTH 0.89 oct', 'WIDTH 0.25 oct, Q 5.8']) assert.ok(t('camera').includes(s), s);
    for (const s of ['4.00 oct (Q about 0.27; the readout rounds it to 0.3)', '0.25 oct (Q 5.8)', '+9 dB']) assert.ok(all('camera').includes(s), s);
  });
  it('Parametric Controls: Q 0.3–12 → BW 3.70–0.12 oct; GAIN ±18; double-tap home prints +0.0 dB', () => {
    const P = mod('ParametricControls');
    assert.match(P, /const GAIN_RANGE = 18;/);
    assert.match(P, /const Q_MIN = 0\.3;/);
    assert.match(P, /const Q_MAX = 12;/);
    assert.match(P, /home: 0\.5/);
    assert.equal(M.bwOctFromQ(0.3).toFixed(2), '3.70');
    assert.equal(M.bwOctFromQ(12).toFixed(2), '0.12');
    assert.equal(`${0 >= 0 ? '+' : ''}${(0).toFixed(1)} dB`, '+0.0 dB');
    for (const s of ['Q 0.30, BW 3.70 oct', 'Q 12.00, BW 0.12 oct', '+0.0 dB']) assert.ok(t('parametric').includes(s), s);
    // The LANE (format) shows Q and octaves together; the dock KEY (formatShort) is Q2.0 only.
    for (const src of [P, mod('QBandwidth')]) {
      assert.match(src, /useState\(2\)/);
      assert.match(src, /format: \(\) => `Q \$\{q\.toFixed\(2\)\} · \$\{bwOct\.toFixed\(2\)\} oct`/);
    }
    assert.equal(`Q ${(2).toFixed(2)} · ${M.bwOctFromQ(2).toFixed(2)} oct`, 'Q 2.00 · 0.71 oct');
    for (const id of ['parametric', 'qband']) {
      assert.ok(MODS[id].control.join(' ').includes('Q 2.00 · 0.71 oct'), id);
      assert.doesNotMatch(MODS[id].control.join(' '), /Its key (shows|reads) Q/, id);
    }
  });
  it('Q & Bandwidth: frozen 1 kHz / +9 dB; ghosts Q 0.5 (≈2.5 oct) and Q 8 (≈0.18 oct)', () => {
    const Q = mod('QBandwidth');
    assert.match(Q, /const FREQ = 1000;/);
    assert.match(Q, /const GAIN_DB = 9;/);
    assert.match(Q, /q: 0\.5, gainDb: GAIN_DB/);
    assert.match(Q, /q: 8, gainDb: GAIN_DB/);
    assert.equal(M.bwOctFromQ(0.5).toFixed(1), '2.5');
    assert.equal(M.bwOctFromQ(8).toFixed(2), '0.18');
    for (const s of ['about 2.5 oct', 'about 0.18 oct', '+9 dB at 1 kHz']) assert.ok(t('qband').includes(s), s);
  });
  it('Filter Shapes: GAIN starts +6.0 dB; a +6 dB low shelf reaches +6 dB well below FREQ; notch Q lane 1–12', () => {
    const F = mod('FilterShapes');
    assert.match(F, /const \[gainDb, setGainDb\] = useState\(6\);/);
    assert.match(F, /type: shape, freq, q: 0\.707, gainDb/);
    assert.match(code('src/features/lab/sliderMaps.ts'), /export const qLaneMin = \(notch: boolean\): number => \(notch \? 1 : 0\.3\);/);
    assert.match(code('src/features/lab/sliderMaps.ts'), /export const Q_LANE_MAX = 12;/);
    // RBJ low shelf (fxViz rbjLowShelf, same cookbook) at 1 kHz, Q 0.707, +6 dB.
    assert.match(code('src/features/lab/fxViz.tsx'), /const a0 = A \+ 1 \+ \(A - 1\) \* cw \+ tsa;/);
    const shelf = (f0: number, q: number, g: number, f: number) => {
      const fs = 48000, A = Math.pow(10, g / 40), w = (2 * Math.PI * f0) / fs, cw = Math.cos(w), sw = Math.sin(w);
      const tsa = 2 * Math.sqrt(A) * (sw / (2 * q));
      const a0 = A + 1 + (A - 1) * cw + tsa;
      const c = { b0: (A * (A + 1 - (A - 1) * cw + tsa)) / a0, b1: (2 * A * (A - 1 - (A + 1) * cw)) / a0, b2: (A * (A + 1 - (A - 1) * cw - tsa)) / a0, a1: (-2 * (A - 1 + (A + 1) * cw)) / a0, a2: (A + 1 + (A - 1) * cw - tsa) / a0 };
      return M.biquadMagDb(c, f);
    };
    assert.equal(shelf(1000, 0.707, 6, 20).toFixed(1), '6.0');
    assert.equal(shelf(1000, 0.707, 6, 100).toFixed(1), '6.0');
    for (const s of ['+6.0 dB', 'rises by 6 dB', 'from 1.0 up to 12.0']) assert.ok(t('shapes').includes(s), s);
  });
  it('Filter Slopes: 80 Hz cutoff, Butterworth order = slope ÷ 6 — the @40 / @20 Hz bezel values', () => {
    const S = mod('FilterSlopes');
    assert.match(S, /const CUTOFF = 80;/);
    assert.match(S, /const SLOPES = \[6, 12, 18, 24, 36, 48\] as const;/);
    assert.match(S, /useState<Slope>\(12\)/);
    assert.match(S, /butterworthHpDb\(CUTOFF, CUTOFF \/ 2, order\)/);
    const at = (slope: number, f: number) => M.butterworthHpDb(80, f, slope / 6).toFixed(1);
    assert.deepEqual([at(12, 40), at(12, 20)], ['-12.3', '-24.1']);
    assert.deepEqual([at(48, 40), at(48, 20)], ['-48.2', '-96.3']);
    assert.deepEqual([at(6, 40), at(6, 20)], ['-7.0', '-12.3']);
    for (const slope of [6, 12, 18, 24, 36, 48]) assert.equal(at(slope, 80), '-3.0');
    for (const s of ['−12.3 dB', '−24.1 dB', '−48.2 dB', '−96.3 dB', '−7.0 dB']) assert.ok(t('slopes').includes(s), s);
  });
  it('Graphic vs. Parametric: 1-octave Q ≈ 1.4, 1/3-octave Q ≈ 4.3; a +12 dB 1k fader is still ≈ +2.5 dB an octave away', () => {
    const G = mod('GraphicVsParametric');
    assert.match(G, /{ kind: 'action', id: 'reset', label: 'RESET', onPress: reset }/);
    assert.equal(M.Q_1OCT.toFixed(1), '1.4');
    assert.equal(M.Q_THIRD.toFixed(1), '4.3');
    const gains = M.OCT_CENTERS.map((c: number) => (c === 1000 ? 12 : 0));
    assert.equal(M.graphicActualDb(M.OCT_CENTERS, gains, M.Q_1OCT, 1000).toFixed(1), '12.0');
    assert.equal(M.graphicActualDb(M.OCT_CENTERS, gains, M.Q_1OCT, 500).toFixed(1), '2.5');
    assert.equal(M.graphicActualDb(M.OCT_CENTERS, gains, M.Q_1OCT, 2000).toFixed(1), '2.5');
    assert.equal(M.fmtHz(1000), '1.00 kHz');
    assert.match(code(`${D}modules/eqBits.tsx`), /range = 12/);
    for (const s of ['BAND 1.00 kHz', 'LEVEL +12.0 dB', 'about +2.5 dB']) assert.ok(t('gvp').includes(s), s);
    for (const s of ['Q about 1.4', 'Q about 4.3']) assert.ok(all('gvp').includes(s), s);
  });
  it('Multi-Band: four bells on at 0 dB, filters off (4 ACTIVE); two +6 dB bells together reach +12 dB', () => {
    const B = mod('MultiBand');
    assert.match(B, /hpf: \{ on: false, f: 80 \}/);
    assert.match(B, /lpf: \{ on: false, f: 12000 \}/);
    assert.equal((B.match(/\{ on: true, f: \d+, g: 0, q: 1 \}/g) ?? []).length, 4);
    assert.match(B, /`\$\{specsFor\(bands\)\.length\} ACTIVE`/);
    assert.match(B, /const DB_RANGE = 18;/);
    const two = 2 * M.graphicActualDb([1000], [6], 1, 1000);
    assert.equal(two.toFixed(1), '12.0');
    for (const s of ['4 ACTIVE', '+6 dB', '+12 dB', 'BYPASS']) assert.ok(t('multiband').includes(s), s);
    // Per-band curves carry a colour → drawn solid (fxViz), and a 0 dB bell draws none.
    assert.match(B, /if \(bell\.on && bell\.g !== 0\)/);
    assert.doesNotMatch(all('multiband'), /dim curve/i);
  });
  it('What a Graphic EQ Really Does: EXAMPLE (125 +3, 250 +6, 500 +3) peaks at +7.1 dB; its phase swings about ±24°', () => {
    const T = mod('GraphicTruth');
    assert.match(T, /c === 125 \? 3 : c === 250 \? 6 : c === 500 \? 3 : 0/);
    const gains = M.OCT_CENTERS.map((c: number) => (c === 125 ? 3 : c === 250 ? 6 : c === 500 ? 3 : 0));
    let peak = -99;
    let peakF = 0;
    let pMax = -999;
    let pMin = 999;
    for (let i = 0; i <= 2000; i++) {
      const f = 20 * Math.pow(1000, i / 2000);
      const d = M.graphicActualDb(M.OCT_CENTERS, gains, M.Q_1OCT, f);
      if (d > peak) [peak, peakF] = [d, f];
      const p = M.graphicPhaseDeg(M.OCT_CENTERS, gains, M.Q_1OCT, f);
      pMax = Math.max(pMax, p);
      pMin = Math.min(pMin, p);
    }
    assert.equal(peak.toFixed(1), '7.1');
    assert.ok(Math.abs(Math.log2(peakF / 250)) < 0.05, `peak at ${peakF}`);
    assert.equal(Math.round(pMax), 24);
    assert.equal(Math.round(pMin), -24);
    for (const s of ['+6 dB at 250 Hz', 'about +7.1 dB', 'about ±24°']) assert.ok(t('graphic').includes(s), s);
    assert.match(T, /unit="°" curves=\{phaseCurves\} dbRange=\{180\}/);
    assert.ok(t('graphic').includes('±180° scale'));
    assert.ok(all('graphic').includes('125 Hz +3, 250 Hz +6 and 500 Hz +3 dB'));
  });
  it('Live Spectrum + EQ: LOW CUT 40/80/120, SLOPE 12/24/48, bell gain ±8; the bezel prints 80Hz·12', () => {
    const L = mod('LiveSpectrumEq');
    assert.match(L, /const HPF_CHOICES = \[40, 80, 120\] as const;/);
    assert.match(L, /const SLOPES = \[12, 24, 48\] as const;/);
    assert.match(L, /const BELL_GAIN_MAX_DB = 8;/);
    assert.match(L, /`\$\{hpfHz\}Hz·\$\{slope\}`/);
    assert.match(L, /useState<ViewMode>\('combined'\)/);
    assert.match(L, /const shape = mode === 'combined' \? eqAt\(c\) : 0;/, 'COMBINED reshapes the drawn bars');
    for (const s of ['80Hz·12', '48 dB/OCT', '+8.0 dB']) assert.ok(t('liveEq').includes(s), s);
    // No curve until a band or LOW CUT is set.
    assert.match(L, /if \(hpfHz == null && !bellOn\) return null;/);
    assert.ok(MODS.liveEq.seeing[0].includes('once you touch a band fader or pick a LOW CUT'));
    assert.ok(all('liveEq').includes('−8 to +8 dB'));
  });
  it('Find the Frequency: level 1 hides a +9 dB boost; CHECK = within 1/3 octave and within 3 dB of the opposite gain', () => {
    const F = mod('FindFrequency');
    assert.match(F, /case 1:\s*return \[\{ f: randF\(100, 8000\), g: 9, q: 1 \}\];/);
    assert.match(F, /case 3:\s*return \[\{ f: randF\(200, 6000\), g: 8, q: 8 \}\];/);
    assert.match(F, /const freqOk = Math\.abs\(Math\.log2\(u\.f \/ h\.f\)\) <= 1 \/ 3;/);
    assert.match(F, /const gainOk = Math\.abs\(u\.g \+ h\.g\) <= 3 && u\.g \* h\.g < 0;/);
    assert.match(F, /setVerdict\(null\);/);
    for (const s of ['about −9 dB', 'NEXT LEVEL ›', 'LEVEL 3']) assert.ok(t('findFreq').includes(s), s);
    assert.ok(all('findFreq').includes('third of an octave'));
    assert.ok(all('findFreq').includes('within 3 dB'));
    // One method across the trainers: the order Match the Curve prints on screen.
    assert.match(mod('MatchCurve'), /start with WHERE, then HOW MUCH, then HOW WIDE/);
    assert.ok(all('findFreq').includes('WHERE first (frequency), then HOW MUCH (gain), then HOW WIDE (Q)'));
  });
  it('Match the Curve: a flat EQ scores 0% (score normalised by the flat error); EXCELLENT ≥ 90, CLOSE ≥ 75; GAIN ±15', () => {
    const C = mod('MatchCurve');
    assert.match(C, /Math\.round\(100 \* \(1 - errUser \/ errFlat\)\)/);
    assert.match(C, /live >= 90 \? 'EXCELLENT/);
    assert.match(C, /live >= 75 \? 'CLOSE/);
    assert.match(C, /\(sel\.g \+ 15\) \/ 30/);
    assert.match(C, /\{ f: i === 0 \? 300 : 3000, g: 0, q: 1 \}/);
    for (const s of ['0%', '90%']) assert.ok(t('matchCurve').includes(s), s);
    assert.ok(all('matchCurve').includes('−15 to +15 dB'));
  });
  it('Fix the Signal: the band starts at 0 dB (so CHECK first reads NOT YET); same 1/3-octave / 3 dB rule; STAGE RUMBLE at 60 Hz', () => {
    const X = mod('FixSignal');
    assert.match(X, /useState<UserBand>\(\{ f: 500, g: 0, q: 1\.4 \}\)/);
    assert.match(X, /const gainOk = Math\.abs\(band\.g \+ sc\.hidden\.g\) <= 3 && band\.g \* sc\.hidden\.g < 0;/);
    assert.match(X, /const freqOk = Math\.abs\(Math\.log2\(band\.f \/ sc\.hidden\.f\)\) <= 1 \/ 3;/);
    assert.match(X, /name: 'STAGE RUMBLE',[\s\S]*?hidden: \{ f: 60, g: 9, q: 1 \}/);
    assert.match(X, /the problem was \{sc\.hidden\.g > 0 \? 'a boost' : 'a hole'\} around/);
    for (const s of ['FIXED', 'STAGE RUMBLE']) assert.ok(t('fixSignal').includes(s), s);
    // Diagnose from the complaint first (finding 2026-10-31): a failed CHECK prints the
    // frequency, so TRY THIS never sends the learner to CHECK before looking.
    assert.doesNotMatch(t('fixSignal'), /CHECK before/);
    assert.ok(MODS.fixSignal.seeing.join(' ').includes('no frequency until you tap CHECK'));
  });
  it('EQ Challenges: the overall shift the readout prints — cut ≈ −1.0 dB, boost-around ≈ +2.9 dB', () => {
    const E = mod('EqChallenges');
    assert.match(E, /const PROBLEM: EqBandSpec\[\] = \[\{ type: 'peak', freq: 250, q: 1, gainDb: 6 \}\];/);
    assert.match(E, /const CUT_FIX: EqBandSpec\[\] = \[\{ type: 'peak', freq: 250, q: 1, gainDb: -6 \}\];/);
    assert.match(E, /\{ type: 'peak', freq: 63, q: 0\.7, gainDb: 6 \},\s*\{ type: 'peak', freq: 2500, q: 0\.5, gainDb: 6 \},/);
    assert.match(E, /const N = 96;/);
    const mean = (bands: [number, number, number][]) => {
      let s = 0;
      for (let i = 0; i <= 96; i++) {
        const f = 20 * Math.pow(1000, i / 96);
        for (const [f0, q, g] of bands) s += M.graphicActualDb([f0], [g], q, f);
      }
      return s / 97;
    };
    assert.equal(mean([[250, 1, -6]]).toFixed(1), '-1.0');
    assert.equal(mean([[63, 0.7, 6], [2500, 0.5, 6]]).toFixed(1), '2.9');
    // The cut is the exact inverse of the problem bell: back on the reference.
    for (const f of [60, 250, 1000]) assert.ok(Math.abs(M.graphicActualDb([250, 250], [6, -6], 1, f)) < 1e-9);
    for (const s of ['overall shift ≈ −1.0 dB', 'overall shift ≈ +2.9 dB']) assert.ok(t('challenges').includes(s), s);
    assert.ok(all('challenges').includes('63 Hz and 2.5 kHz'));
  });
});

describe('5. wiring: the ⓘ on both EQ Lab headers, inside a ScreenGuideHost', () => {
  const MOD = code(`${D}EqModuleScreen.tsx`);
  const HOME = code(`${D}EqLabHomeScreen.tsx`);
  it('EqModuleScreen: the module’s guide (the end guide on what’s left), regions only on Rack Unit modules', () => {
    assert.match(MOD, /import \{ EQ_END_GUIDE, EQ_SCREEN_GUIDES \} from '\.\/eqScreenGuides';/);
    assert.match(MOD, /<LabHeader[\s\S]*?guide=\{ending \? EQ_END_GUIDE : EQ_SCREEN_GUIDES\[meta\.id\]\}/);
    assert.match(MOD, /guideTitle=\{ending \? 'WHAT’S LEFT' : undefined\}/);
    assert.match(
      MOD,
      /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : meta\.id\} regions=\{RACK_MODULES\.has\(meta\.id\) && !ending\}>/,
    );
    assert.match(MOD, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('the rack set is exactly the modules that render a Rack Unit (whyEq and challenges stay classic)', () => {
    const rackSet = (MOD.match(/const RACK_MODULES = new Set<EqModuleId>\(\[([\s\S]*?)\]\);/) ?? ['', ''])[1];
    const ids = [...rackSet.matchAll(/'(\w+)'/g)].map((m) => m[1]).sort();
    const FILE: Record<string, string> = {
      spectrum: 'SeeingFrequency', whyEq: 'WhyEq', camera: 'CameraAnalogy', parametric: 'ParametricControls', qband: 'QBandwidth',
      shapes: 'FilterShapes', slopes: 'FilterSlopes', gvp: 'GraphicVsParametric', graphic: 'GraphicTruth', multiband: 'MultiBand',
      liveEq: 'LiveSpectrumEq', findFreq: 'FindFrequency', matchCurve: 'MatchCurve', fixSignal: 'FixSignal', challenges: 'EqChallenges',
    };
    const racks = Object.entries(FILE).filter(([, f]) => /<RackUnit/.test(mod(f))).map(([id]) => id).sort();
    assert.deepEqual(ids, racks);
    assert.ok(!ids.includes('whyEq') && !ids.includes('challenges'));
  });
  it('EqLabHomeScreen: the home guide (the end guide on what’s left), host without regions', () => {
    assert.match(HOME, /import \{ EQ_END_GUIDE, EQ_HOME_GUIDE \} from '\.\/eqScreenGuides';/);
    assert.match(HOME, /<LabHeader[\s\S]*?guide=\{ending \? EQ_END_GUIDE : EQ_HOME_GUIDE\}/);
    assert.match(HOME, /guideTitle=\{ending \? 'WHAT’S LEFT' : undefined\}/);
    assert.match(HOME, /<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : 'list'\}>/);
    assert.match(HOME, /<\/ScreenGuideHost>\s*<\/View>/);
  });
});

describe('6. chip decision: the accuracy chip stays only on the live-microphone modules', () => {
  const MOD = code(`${D}EqModuleScreen.tsx`);
  it('MIC_MODULES is exactly the modules that open the live microphone engine', () => {
    const set = (MOD.match(/const MIC_MODULES = new Set<EqModuleId>\(\[([^\]]*)\]\);/) ?? ['', ''])[1];
    const ids = [...set.matchAll(/'(\w+)'/g)].map((m) => m[1]).sort();
    assert.deepEqual(ids, ['liveEq', 'spectrum']);
    for (const f of ['SeeingFrequency', 'LiveSpectrumEq']) assert.match(mod(f), /useDspEngine\(cfg, \{ bands: true \}\)/, f);
    for (const f of ['WhyEq', 'CameraAnalogy', 'ParametricControls', 'QBandwidth', 'FilterShapes', 'FilterSlopes', 'GraphicVsParametric', 'GraphicTruth', 'MultiBand', 'FindFrequency', 'MatchCurve', 'FixSignal', 'EqChallenges']) {
      assert.doesNotMatch(mod(f), /useDspEngine/, `${f} reads the mic — it would need the chip`);
    }
  });
  it('the module header renders the chip only for MIC_MODULES and never on the what’s-left screen', () => {
    assert.match(MOD, /right=\{MIC_MODULES\.has\(meta\.id\) && !ending \? <AccuracyNote compact detail="[^"]*UNCALIBRATED microphone[^"]*" \/> : undefined\}/);
    assert.equal((MOD.match(/<AccuracyNote/g) ?? []).length, 1);
  });
  it('the lab menu shows no chip (no measurement on it); the ⓘ takes the spot', () => {
    const HOME = code(`${D}EqLabHomeScreen.tsx`);
    assert.doesNotMatch(HOME, /AccuracyNote/);
    assert.doesNotMatch(HOME, /right=\{/);
  });
  it('the guides carry the honesty line the chip used to: which modules use the uncalibrated mic, and designed vs synthetic', () => {
    assert.match((EQ_HOME_GUIDE as unknown as Guide).teaches.join(' '), /Modules 1 and 11 read your phone’s uncalibrated microphone/);
    assert.equal(EQ_MODULES[0].id, 'spectrum');
    assert.equal(EQ_MODULES[10].id, 'liveEq');
    for (const id of ['spectrum', 'liveEq']) assert.match(MODS[id].teaches.join(' '), /uncalibrated/i, id);
    for (const id of ['findFreq', 'fixSignal', 'challenges']) assert.match(MODS[id].seeing.join(' '), /synthetic/i, id);
  });
});
