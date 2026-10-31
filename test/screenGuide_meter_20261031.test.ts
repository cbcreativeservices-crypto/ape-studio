/**
 * Screen Guide rollout — Visual Audio Analysis Lab + Signal Detective
 * (owner 2026-10-31) — receipts. Pattern: test/screenGuide_20261031.test.ts.
 *
 *   1. every MeterModuleId (Signal Detective = 'detective'), the lab home and
 *      the what's-left screen have a guide: five sections, 1–5 bullets each,
 *      2–3 TRY THIS experiments, the house copy rules, each step within its
 *      no-scroll budget;
 *   2. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and this lab's source (rename one → update the guide);
 *   3. every TRY THIS number is what the bezel prints at that setting — worked
 *      out here from meterEngine with the module's own formulas and defaults
 *      (the defaults and formulas are pinned too, so a change in the module
 *      fails here instead of leaving the guide quietly wrong);
 *   4. wiring: both hosts pass the guide to LabHeader and wrap their root in
 *      ScreenGuideHost (rack regions on the module host, off on the menu);
 *   5. the accuracy-chip decision: a CONCEPT lab — every display runs on
 *      built-in teaching signals (badged on every stage), nothing measures the
 *      learner's sound or a real room — so neither header shows AccuracyNote,
 *      and the stage honesty badges stay.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const E = await import('../src/screens/lab/meter/meterEngine.ts');
const { METER_MODULES } = await import('../src/screens/lab/meter/modules/registry.ts');
const { METER_SCREEN_GUIDES, METER_HOME_GUIDE, METER_END_GUIDE } = await import('../src/screens/lab/meter/meterScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = METER_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [
  ['home', METER_HOME_GUIDE as unknown as Guide],
  ['end', METER_END_GUIDE as unknown as Guide],
  ...Object.entries(GUIDES),
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const tryOf = (id: string) => GUIDES[id].tryThis.join('\n');
/** The bezel prints a hyphen-minus; the guide writes a true minus. */
const m = (s: string) => s.replace(/-/g, '−');

describe('1. every Visual Audio Analysis screen has a complete guide', () => {
  it('every MeterModuleId has a guide — and no guide is for a module that does not exist', () => {
    const ids = METER_MODULES.map((x: { id: string }) => x.id).sort();
    assert.equal(ids.length, 11, '11 modules, Signal Detective last');
    assert.ok(ids.includes('detective'));
    assert.deepEqual(Object.keys(GUIDES).sort(), ids);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty, 2–3 experiments`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no gear brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|build \d+)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Altiverb|Waves|iZotope|Neve|SSL|Shure|Neumann|Yamaha|Behringer|Dolby|Avid)\b/, `${id}: a gear brand`);
    }
  });
  it('every step fits its no-scroll budget, on every screen', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, [], 'tighten the wording (keep it accurate) — a step must not need scrolling');
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const SRC = [
    'src/screens/lab/meter/modules/modMeterA.tsx',
    'src/screens/lab/meter/modules/modMeterB.tsx',
    'src/screens/lab/meter/modules/modMeterC.tsx',
    'src/screens/lab/meter/vizMeters.tsx',
    'src/screens/lab/meter/vizSpectral.tsx',
    'src/screens/lab/meter/meterEngine.ts',
    'src/screens/tools/SkinnedVu.tsx',
    'src/screens/lab/meter/MeterLabHomeScreen.tsx',
    'src/screens/lab/ModuleAccordionRow.tsx',
    'src/screens/lab/rack/RackUnit.tsx',
    'src/screens/lab/kit/labNav.ts',
    'src/screens/lab/kit/LabEndScreen.tsx',
    'src/screens/lab/kit/labEnd.ts',
  ]
    .map(code)
    .join('\n');
  // Tray / option labels the screen upper-cases from the engine's label maps
  // (SIGNAL_LABELS, SPECTRUM_LABELS, ROOM_LABELS …) — checked against the
  // upper-cased source.
  const UP = SRC.toUpperCase();
  const NAMES: Record<string, { exact: string[]; upper?: string[] }> = {
    home: { exact: ['SEE WHAT’S LEFT', 'USE WHAT YOU LEARNED', 'OPEN THE MEASUREMENT TOOLS ›', 'ⓘ GUIDED LESSON', 'OPEN', '‹ PREV', 'NEXT ›'] },
    end: { exact: ['LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS'] },
    waveform: { exact: ['PEAK', 'RMS', 'CREST', 'DC', 'CLIP', 'CLEAN', 'OVER', 'GAIN', 'SIGNAL', 'Ø POL', 'DC→0', 'FULL SCREEN'], upper: ['SPEECH', 'KICK DRUM', 'GUITAR', 'WHITE NOISE'] },
    peak: { exact: ['SAMPLE PEAK', 'OVER', 'dBFS', 'PEAK', 'PK HOLD', 'OVERS', 'RMS', 'CREST', 'GAIN', 'SIGNAL', 'RESET HOLD', 'OVR'], upper: ['KICK DRUM', 'SNARE', 'SPEECH', 'ORGAN'] },
    vu: { exact: ['PEAK', 'RMS', 'CREST', 'NDL MAX', 'GAIN', 'SIGNAL', 'FULL SCREEN'], upper: ['SNARE', 'ORGAN', 'PINK NOISE', 'SPEECH'] },
    loudness: { exact: ['LOUDNESS · LUFS', 'LUFS INTEGRATED', 'INTEGRATED', 'LRA', 'SAMPLE PK', 'TRUE PK', 'TP GAP', 'MOMENTARY RANGE', 'SHORT-TERM', 'STREAMING', 'SIGNAL'], upper: ['SPEECH', 'MUSIC MIX', 'ORGAN', 'KICK DRUM'] },
    spectrum: { exact: ['PATTERN', 'PEAK', 'LEVEL', 'TILT', 'dB rel'], upper: ['SPEECH', 'CYMBAL', 'KICK DRUM', 'GUITAR', 'MAINS HUM', 'FEEDBACK', 'PINK NOISE'] },
    spectrogram: { exact: ['NOW', 'FREQUENCY ↑', 'LEVEL', 'HI', 'LO', 'TIME', 'new → right', 'FREQ', '↑ up', '= color', 'MODE', 'SCROLL', 'SNAP', 'PATTERN', 'VIEW', 'ELAPSED TIME', 'SNAPSHOT — FULL 5 s'], upper: ['BIRDSONG', 'CYMBAL DECAY', 'WHISTLE', 'WHITE NOISE'] },
    waterfall: { exact: ['TIME', '0s', 'RINGS', 'RT·125', 'RT·4k', 'RIDGE', 'VS NEARBY', 'DAMPING', 'CONCRETE', 'CURTAINS', 'CARPET', 'PANELS', 'EQ', '220 Hz · Q6', '440 Hz · Q1', '1 kHz shelf', 'FLATTEN ALL BANDS', 'ROOM', 'REVERB', 'Q RING', 'REPLAY', 'RT60 · 250 Hz'], upper: ['CATHEDRAL', 'CLASSROOM', 'STUDIO', 'THEATER', 'LIVING ROOM', 'NONE', 'PLATE', 'HALL', 'SPRING'] },
    phase: { exact: ['CORRELATION', 'ρ', 'CORR', 'WIDTH', 'PHASE', 'MONO FOLD', 'MONO-SAFE', 'WIDE / UNRELATED', 'MONO-DEATH', 'MONO-FOLD VERDICT', 'SAFE', 'CANCELLATION', 'RISKY', 'R vs L'] },
    stereo: { exact: ['MID', 'SIDE', 'PRESET', 'MID (SHARED)', 'SIDE (DIFF)', 'MONO', 'NARROW', 'WIDE', 'HARD L-R', 'MID-SIDE', '100 %', '≈85 %', '≈55 %', '≈50 %', 'shared', 'difference'] },
    scope: { exact: ['CH 1 · SWEEP LOCK', 'TRIG', 'X = L · Y = R', 'MODE', 'TIME', 'X-Y', 'SIGNAL', 'CORR', 'WIDTH', 'PHASE', 'SINE', 'SQUARE', 'TRIANGLE', 'SAW', 'SPEECH', 'MUSIC', 'R vs L'] },
    detective: { exact: ['WHAT METER IS THIS?', 'WHAT DOES IT SHOW?', 'WHAT PROBLEM DO YOU SEE?', 'WHAT PROCESSOR/ACTION FIXES IT?', 'CASE', 'QUESTION', 'SOLVED', '‹ CASE', 'CASE ›', '‹ PREVIOUS', 'NEXT QUESTION ›', 'NEXT CASE ›'] },
  };
  const byId: Record<string, Guide> = Object.fromEntries(allGuides);
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), allGuides.map(([id]) => id).sort());
  });
  for (const [id, { exact, upper = [] }] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(byId[id]);
      for (const n of exact) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in this lab's source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
      for (const n of upper) {
        assert.ok(UP.includes(n), `${id}: tray label "${n}" is no longer in this lab's source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('Signal Detective: the deck the guide describes (seven cases, four questions each, ‹ CASE / CASE › in the dock)', () => {
    const c = code('src/screens/lab/meter/modules/modMeterC.tsx');
    const kinds = c.match(/^ {4}kind: '(\w+)',$/gm) ?? [];
    assert.equal(kinds.length, 7);
    assert.ok(textOf(GUIDES.detective).includes('seven cases'));
    assert.match(c, /const specs = \[kase\.what, kase\.shows, kase\.problem, kase\.fix\];/);
    assert.match(c, /if \(solvedRef\.current\.size >= n \* qCount\) markLabUnit\('af_signal_detective', PASS_UNIT\);/);
  });
});

describe('3. every TRY THIS number is what the screen prints', () => {
  const A = code('src/screens/lab/meter/modules/modMeterA.tsx');
  const B = code('src/screens/lab/meter/modules/modMeterB.tsx');
  const C = code('src/screens/lab/meter/modules/modMeterC.tsx');
  const gl = (g: number) => Math.pow(10, g / 20);
  const f1 = (x: number) => x.toFixed(1);
  const sgn = (x: number, d = 1) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;

  it('the defaults and formulas the numbers rest on are still the module’s', () => {
    // Waveform: SPEECH, 0 dB, DC 0; GAIN −12…+18; DC ±0.30.
    assert.match(A, /useState<SignalKey>\('speech'\);\s*const \[gainDb, setGainDb\] = useState\(0\);\s*const \[dcOff, setDcOff\] = useState\(0\);/);
    assert.match(A, /setGainDb\(snapHalfDb\(-12 \+ v \* 30\)\)/);
    assert.match(A, /setDcOff\(Math\.round\(\(v \* 0\.6 - 0\.3\) \* 100\) \/ 100\)/);
    // Peak: KICK at −6 dB. VU: SNARE at 0 dB, ~300 ms ballistics. Loudness: MUSIC MIX.
    assert.match(A, /useState<SignalKey>\('kick'\);\s*const \[gainDb, setGainDb\] = useState\(-6\);/);
    assert.match(A, /useState<SignalKey>\('snare'\);\s*const \[gainDb, setGainDb\] = useState\(0\);/);
    assert.match(A, /needle = vuStep\(needle, Math\.abs\(v\), dt\);/);
    assert.match(A, /useState<SignalKey>\('music'\);/);
    // Waterfall: CLASSROOM at DAMPING 0.15, no EQ, 220 Hz · Q6 band, no Q RING, no reverb.
    assert.match(B, /useState<RoomKey>\('classroom'\);\s*const \[damping01, setDamping01\] = useState\(0\.15\);/);
    assert.match(B, /useState<EqFilterKey>\('bell220q6'\);\s*const \[qRing, setQRing\] = useState\(false\);/);
    assert.match(B, /const ringing = rt\.ratio >= RIDGE_CALLOUT_RATIO;/);
    // Phase: WIDTH 35 %, PHASE 0°. Scope: SINE, WIDTH 0, PHASE 0. Stereo: MONO.
    assert.match(C, /const \[widthV, setWidthV\] = useState\(0\.35\);\s*const \[phaseV, setPhaseV\] = useState\(0\);/);
    assert.match(C, /useState<SignalKey>\('sine'\);\s*const \[xy, setXy\] = useState\(false\);\s*const \[widthV, setWidthV\] = useState\(0\);\s*const \[phaseV, setPhaseV\] = useState\(0\);/);
    assert.match(C, /useState<StereoPreset>\('mono'\)/);
    assert.match(C, /foldDb: db\(rmsOf\(mono\)\) - db\(\(rmsOf\(l\) \+ rmsOf\(r\)\) \/ 2\)/);
  });

  it('Waveform', () => {
    const wave = (s: string, g: number, dc = 0) => {
      const p = E.renderSignal(s).map((v: number) => v * gl(g) + dc);
      const c = p.map((v: number) => Math.max(-1, Math.min(1, v)));
      const over = p.some((v: number) => Math.abs(v) >= 1);
      return { peak: f1(E.db(E.peakOf(c))), crest: f1(E.crestDb(c)), dc: sgn(E.dcOf(c) * 100), clip: over ? `+${f1(E.db(E.peakOf(p)))} OVER` : 'CLEAN' };
    };
    const t = tryOf('waveform');
    // The PICTURE is drawn from renderOverview (its peak matched to the
    // 2048-sample reference), the frame from renderSignal at 1024 — so the
    // clean step must be clean in BOTH (audit 2026-10-31: at +2.5 dB the frame
    // said CLEAN while the drawn wave was already red).
    const ov = E.peakOf(E.renderOverview('speech'));
    const a = wave('speech', 2);
    assert.equal(a.clip, 'CLEAN');
    assert.ok(ov * gl(2) < 1, 'the drawn wave is not red at the clean step');
    assert.ok(t.includes('raise GAIN to +2.0 dB'));
    assert.ok(t.includes(`CLEAN (PEAK ${m(a.peak)})`));
    assert.ok(ov * gl(3) >= 1, 'the drawn wave IS red at the clip step');
    assert.ok(t.includes(`+3.0 dB it reads ${wave('speech', 3).clip} and the wave turns red`));
    assert.ok(t.includes(`CREST drops from ${wave('speech', 0).crest} dB to ${wave('whitenoise', 0).crest} dB`));
    const d = wave('speech', 0, 0.3);
    assert.ok(t.includes(`DC reads ${d.dc} % (the clip carries ${wave('speech', 0).dc} % of its own) and CLIP trips ${d.clip}`));
    // Ø POL: with DC at 0 only DC's sign flips; with an offset it does not simply mirror.
    const inv = (s: string, g: number, dc: number) => {
      const p = E.renderSignal(s).map((v: number) => -v * gl(g) + dc).map((v: number) => Math.max(-1, Math.min(1, v)));
      return sgn(E.dcOf(p) * 100);
    };
    assert.equal(inv('speech', 0, 0), wave('speech', 0).dc.replace('+', '-'), 'DC at 0: only the sign flips');
    assert.ok(inv('speech', 0, 0.3).startsWith('+') && inv('speech', 0, 0.3) !== wave('speech', 0, 0.3).dc, 'DC +30 %: the sign stays, the value moves');
    assert.ok(textOf(GUIDES.waveform).includes('With DC at 0 %, Ø POL flips the wave'));
  });

  it('Peak Meter', () => {
    const pk = (s: string, g: number) => {
      const p = E.renderSignal(s).map((v: number) => v * gl(g));
      let runs = 0;
      let inOver = false;
      for (const v of p) {
        const o = Math.abs(v) >= 1;
        if (o && !inOver) runs++;
        inOver = o;
      }
      const pd = E.db(E.peakOf(p));
      return { peak: pd >= 0 ? `+${f1(pd)} OVR` : f1(pd), overs: runs, crest: f1(E.crestDb(p)) };
    };
    const t = tryOf('peak');
    assert.ok(t.includes(`PEAK reads ${pk('kick', 0).peak}, OVERS reads ${pk('kick', 0).overs}`));
    assert.ok(t.includes(`PEAK returns to ${m(pk('kick', -6).peak)}`));
    assert.equal(pk('kick', -6).overs, 0);
    assert.ok(t.includes(`CREST on the frame falls from ${pk('kick', -6).crest} dB to ${pk('organ', -6).crest} dB`));
    assert.ok(Number(pk('kick', -6).crest) - Number(pk('organ', -6).crest) > 11, '"over 11 dB less gap"');
  });

  it('VU / RMS Meter', () => {
    const vu = (s: string) => {
      const p = E.renderSignal(s);
      const dt = 1.5 / p.length;
      let n = 0;
      let top = 0;
      for (const v of p) {
        n = E.vuStep(n, Math.abs(v), dt);
        top = Math.max(top, n);
      }
      return { peak: E.db(E.peakOf(p)), ndl: E.db(top) };
    };
    const t = tryOf('vu');
    const s = vu('snare');
    const o = vu('organ');
    assert.ok(t.includes(`PEAK ${m(f1(s.peak))}, but NDL MAX only ${m(f1(s.ndl))}`));
    assert.ok(Number(f1(s.peak)) - Number(f1(s.ndl)) > 21, '"more than 21 dB under the peak"');
    assert.ok(t.includes('more than 21 dB under the peak'));
    // GAIN cancels out of CREST on this (unclipped) path.
    for (const g of [-12, 0, 12]) assert.equal(f1(E.crestDb(E.renderSignal('snare').map((v: number) => v * gl(g)))), f1(E.crestDb(E.renderSignal('snare'))));
    assert.ok(textOf(GUIDES.vu).includes('CREST stays put'));
    // ORGAN never lights the PEAK lamp (it needs |x| ≥ 0.72 of full scale).
    assert.ok(E.peakOf(E.renderSignal('organ')) < 0.72 && E.peakOf(E.renderSignal('snare')) >= 0.72);
    assert.match(code('src/screens/lab/meter/vizMeters.tsx'), /m \/ 0\.72/);
    assert.ok(t.includes('the PEAK lamp stays dark'));
    assert.ok(t.includes(`PEAK ${m(f1(o.peak))}, NDL MAX ${m(f1(o.ndl))}`));
    const lift = Number(f1(o.ndl)) - Number(f1(s.ndl));
    assert.ok(lift > 11 && lift < 12, `"almost 12 dB higher" (${lift})`);
  });

  it('Loudness Meter', () => {
    const t = tryOf('loudness');
    const L = (k: string) => E.simulateLoudness(k);
    const gap = (k: string) => `+${f1(L(k).truePeakDbtp - L(k).samplePeakDbfs)} dB`;
    assert.ok(t.includes(`INTEGRATED ${m(f1(L('music').integratedLufs))} LUFS, TP GAP ${gap('music')}`));
    assert.ok(t.includes(`SPEECH: ${m(f1(L('speech').integratedLufs))} LUFS, and a gap of only ${gap('speech')}`));
    assert.ok(t.includes(`LRA reads ${f1(L('organ').lraLu)} LU against ${f1(L('kick').lraLu)} LU`));
    // The history replays on a 0.25 Hz phase clock: one loop every 4 s.
    assert.match(A, /const phase = viz\.usePhaseClock\(focused, 0\.25\);/);
    assert.ok(textOf(GUIDES.loudness).includes('replayed in about 4 s'));
    const mo = L('organ').momentary;
    assert.ok(t.includes(`spans only ${m(f1(Math.min(...mo)))} to ${m(f1(Math.max(...mo)))} LUFS`));
  });

  it('Spectrum Analyzer', () => {
    const scan = (key: string) => {
      const N = 480;
      const lo = Math.log10(20);
      const hi = Math.log10(20000);
      let pf = 20;
      let pd = -Infinity;
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (let i = 0; i < N; i++) {
        const f = Math.pow(10, lo + ((hi - lo) * i) / (N - 1));
        const v = E.spectrumDb(key, f);
        if (v > pd) { pd = v; pf = f; }
        const o = Math.log2(f);
        sx += o; sy += v; sxx += o * o; sxy += o * v;
      }
      return { pf, tilt: (N * sxy - sx * sy) / (N * sxx - sx * sx) };
    };
    const hz = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1)} kHz` : `${Math.round(f)} Hz`);
    const t = tryOf('spectrum');
    assert.match(B, /function scanSpectrum\(key: SpectrumKey\)[\s\S]*?const N = 480;/);
    assert.ok(t.includes(`PEAK jumps from ${hz(scan('hum').pf)} to ${hz(scan('feedback').pf)} (the plot’s marker says 1.75 kHz)`));
    assert.ok(t.includes(`TILT reads ${m(sgn(scan('pinknoise').tilt))}/oct`));
    assert.ok(t.includes(`TILT flips to ${sgn(scan('cymbal').tilt)}/oct`));
    assert.ok(t.includes(`PEAK reads ${hz(scan('kick').pf)} for the thump`));
  });

  it('Waterfall (CSD)', () => {
    const base = { room: 'classroom', damping01: 0.15, eqGains: {}, eqFilter: 'bell220q6', qRing: false, reverb: 'none' };
    const hz = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1)} kHz` : `${Math.round(f)} Hz`);
    const t = tryOf('waterfall');
    // At the default the classroom's ridge is below the callout (RIDGE none).
    assert.ok(E.waterfallRidge(base).ratio < E.RIDGE_CALLOUT_RATIO);
    const bare = E.waterfallRidge({ ...base, damping01: 0 });
    assert.ok(bare.ratio >= E.RIDGE_CALLOUT_RATIO);
    assert.ok(t.includes(`RIDGE reads ${hz(bare.f)} and VS NEARBY ${bare.ratio.toFixed(1)}×`));
    const q = E.waterfallRidge({ ...base, qRing: true });
    assert.ok(q.ratio >= E.RIDGE_CALLOUT_RATIO);
    assert.ok(t.includes(`RIDGE jumps to ${hz(q.f)} and VS NEARBY to ${q.ratio.toFixed(1)}×`));
    // Experiment 3 runs after the EQ boost: EQ leaves the ridge alone.
    assert.equal(E.waterfallRidge({ ...base, damping01: 0, eqGains: { bell220q6: 12 } }).ratio.toFixed(1), bare.ratio.toFixed(1));
    const r250 = E.waterfallRt({ ...base, eqGains: { bell220q6: 12 } }, 250).toFixed(2);
    assert.equal(r250, E.waterfallRt(base, 250).toFixed(2), 'EQ changes level, not decay');
    assert.ok(t.includes(`RT60 · 250 Hz below the display stays at ${r250} s`));
    // The default's DAMPING label.
    assert.match(B, /d < 0\.25 \? 'CONCRETE'/);
    assert.ok(textOf(GUIDES.waterfall).includes('CONCRETE · 15%'));
    assert.ok(textOf(GUIDES.waterfall).includes('At the start RIDGE reads none'));
    // Signal Detective's ring case must really draw RINGS: its answer is "a
    // ridge near 250 Hz that will not decay".
    const ring = C.match(/const RING_OPTS: WaterfallOpts = \{ room: 'classroom', damping01: ([\d.]+),/);
    assert.ok(ring, 'RING_OPTS moved');
    assert.ok(E.waterfallRidge({ ...base, damping01: Number(ring[1]) }).ratio >= E.RIDGE_CALLOUT_RATIO, 'the ring case draws no RINGS mark');
  });

  it('Phase Meter + Oscilloscope (X-Y)', () => {
    const ph = (w: number, deg: number) => {
      const { l, r } = E.stereoPair(w, deg);
      const mono = l.map((v: number, i: number) => (v + r[i]) * 0.5);
      return { corr: sgn(E.correlationOf(l, r), 2), fold: sgn(E.db(E.rmsOf(mono)) - E.db((E.rmsOf(l) + E.rmsOf(r)) / 2)) };
    };
    const t = tryOf('phase');
    const a = ph(0.35, 0);
    const b = ph(0.35, 180);
    const c = ph(0, 180);
    const d = ph(1, 0);
    assert.ok(t.includes(`CORR ${a.corr}, MONO FOLD ${m(a.fold)} dB — SAFE`));
    assert.ok(t.includes(`CORR ${m(b.corr)}, MONO FOLD ${m(b.fold)} dB — CANCELLATION`));
    assert.ok(t.includes(`CORR ${m(c.corr)} and MONO FOLD ${m(c.fold)} dB`));
    assert.ok(t.includes(`CORR ${m(d.corr)} (unrelated), MONO FOLD ${m(d.fold)} dB — RISKY`));
    // The verdict bands those words come from.
    assert.match(C, /if \(corr >= 0\.5\)\s*return `MONO-FOLD VERDICT: SAFE/);
    assert.match(C, /if \(corr >= -0\.35\)\s*return `MONO-FOLD VERDICT: RISKY/);
    // The engine's saw ramps DOWN and jumps back up (Σ sin(hx)/h): the guide
    // and the SAW tray say so.
    const saw = E.renderSignal('saw');
    assert.ok(saw[8] > saw[40] && saw[40] > saw[80] && saw[86] > saw[80]);
    assert.ok(textOf(GUIDES.scope).includes('this saw ramps down, then snaps back up'));
    assert.match(C, /key: 'saw', label: 'SAW', blurb: 'A steady ramp down, then an instant jump back up\./);
    const s = tryOf('scope');
    assert.ok(s.includes(`CORR ${ph(0, 0).corr} — mono`));
    assert.ok(s.includes(`CORR ${m(ph(0, 180).corr)}`));
    assert.ok(s.includes(`CORR falls to ${m(ph(1, 0).corr)}`));
  });

  it('Stereo Image: the preset numbers are the bezel’s', () => {
    for (const v of ["mid: '100 %'", "mid: '≈85 %'", "mid: '≈55 %'", "mid: '≈50 %'", "side: '≈50 %'"]) assert.ok(C.includes(v), v);
  });
});

describe('4. wiring: the guide key in both headers, a host around each root', () => {
  const MOD = code('src/screens/lab/meter/MeterModuleScreen.tsx');
  const HOME = code('src/screens/lab/meter/MeterLabHomeScreen.tsx');
  it('MeterModuleScreen: per-module guide by MeterModuleId (what’s-left guide after FINISH), host with rack regions', () => {
    assert.match(MOD, /import \{ METER_END_GUIDE, METER_SCREEN_GUIDES \} from '\.\/meterScreenGuides';/);
    assert.match(MOD, /<LabHeader[\s\S]*?guide=\{ending \? METER_END_GUIDE : METER_SCREEN_GUIDES\[meta\.id\]\}/);
    assert.match(MOD, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : meta\.id\}>/);
    assert.match(MOD, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('MeterLabHomeScreen: the home guide (what’s-left guide when swapped in), host with regions off', () => {
    assert.match(HOME, /import \{ METER_END_GUIDE, METER_HOME_GUIDE \} from '\.\/meterScreenGuides';/);
    assert.match(HOME, /<LabHeader[\s\S]*?guide=\{ending \? METER_END_GUIDE : METER_HOME_GUIDE\}/);
    assert.match(HOME, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : 'list'\}>/);
    assert.match(HOME, /<\/ScreenGuideHost>\s*<\/View>/);
  });
  it('Signal Detective (catalog route MeterModule { id: detective }) reaches the same host and its own guide', () => {
    assert.match(code('src/screens/lab/labCatalog.ts'), /name: 'Signal Detective'[^\n]*route: 'MeterModule', params: \{ id: 'detective' \}/);
    assert.ok(GUIDES.detective);
  });
});

describe('5. the accuracy chip: a concept lab', () => {
  it('neither header shows AccuracyNote — every display runs on badged teaching signals', () => {
    for (const p of ['src/screens/lab/meter/MeterModuleScreen.tsx', 'src/screens/lab/meter/MeterLabHomeScreen.tsx']) {
      assert.doesNotMatch(code(p), /AccuracyNote/, `${p} still renders the chip`);
    }
  });
  it('the reason (re-vetted 2026-10-31): no live input anywhere in the lab — every number is meter math on a synthetic signal', () => {
    const dir = 'src/screens/lab/meter';
    const files = [
      ...readdirSync(join(ROOT, dir)).filter((f) => /\.tsx?$/.test(f)).map((f) => `${dir}/${f}`),
      ...readdirSync(join(ROOT, dir, 'modules')).filter((f) => /\.tsx?$/.test(f)).map((f) => `${dir}/modules/${f}`),
    ];
    assert.ok(files.length >= 6);
    for (const p of files) {
      const c = code(p);
      assert.doesNotMatch(c, /modules\/ape-dsp|ApeDsp\b/, `${p}: no audio engine (so no mic capture)`);
      assert.doesNotMatch(c, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions/, `${p}: no live input`);
    }
    assert.match(code(`${dir}/meterEngine.ts`), /export function renderSignal\(key: SignalKey/);
  });
  it('the honesty stays on every stage: the teaching-signal badges and the loudness-model disclosure', () => {
    const A = code('src/screens/lab/meter/modules/modMeterA.tsx');
    const B = code('src/screens/lab/meter/modules/modMeterB.tsx');
    const C = code('src/screens/lab/meter/modules/modMeterC.tsx');
    assert.equal((A.match(/badge: 'SYNTHESIZED TEACHING SIGNAL/g) ?? []).length, 3, 'Waveform, Peak, VU');
    assert.match(A, /SIMPLIFIED BS\.1770-STYLE TEACHING MODEL — not a compliance meter/);
    assert.equal((B.match(/badge: 'SYNTHETIC/g) ?? []).length, 3, 'Spectrum, Spectrogram, Waterfall');
    assert.match(C, /const HONESTY = 'SYNTHESIZED TEACHING SIGNAL — NOTHING HERE MEASURES REAL AUDIO';/);
    assert.equal((C.match(/badge: HONESTY/g) ?? []).length, 4, 'Phase, Stereo, Scope, Detective');
  });
});
