/**
 * Screen Guide rollout — Foundations of Sound + Sound Playground (owner
 * 2026-10-31) — receipts. Pattern: test/screenGuide_20261031.test.ts (Wave).
 *
 *   1. every course module (STEPS keys m1–m14), Module 7's predict-first
 *      cover, the course's what's-left screen and the Playground have a guide
 *      with all five sections, 1–5 bullets each, 2–3 TRY THIS experiments, in
 *      the house copy rules, each step within its no-scroll budget;
 *   2. each guide quotes its screen's REAL names — every one pinned here is in
 *      both the guide and the screen/renderer source;
 *   3. the TRY THIS numbers are the ones the screen prints (worked out here
 *      from the same formulas, and the formulas pinned in the source);
 *   4. wiring: the course passes the per-screen guide to LabHeader and wraps
 *      its root in ScreenGuideHost; the Playground (own header) wires the key,
 *      the hint anchor and the host by hand;
 *   5. the chip decision: both screens are CONCEPT screens (slowed models and
 *      drawings from the settings; the Playground's LEVEL is the commanded
 *      generator level, not a measurement) — AccuracyNote is gone from both.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const G = await import('../src/screens/lab/foundations/foundationsScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const MODULES = G.FOUNDATIONS_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [
  ...Object.entries(MODULES),
  ['m7cover', G.FOUNDATIONS_M7_COVER_GUIDE as unknown as Guide],
  ['end', G.FOUNDATIONS_END_GUIDE as unknown as Guide],
  ['playground', G.PLAYGROUND_SCREEN_GUIDE as unknown as Guide],
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

const COURSE_P = 'src/screens/lab/foundations/FoundationsCourseScreen.tsx';
const PLAY_P = 'src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx';
const COURSE = code(COURSE_P);
const PLAY = code(PLAY_P);
const VIZ = code('src/screens/lab/foundations/viz.tsx');

describe('1. every Foundations screen has a complete guide', () => {
  it('one guide per course module — the keys are exactly the STEPS keys, in order', () => {
    const stepsBlock = COURSE.slice(COURSE.indexOf('const STEPS: Step[] = ['), COURSE.indexOf('if (__DEV__ && STEPS.length'));
    const keys = [...stepsBlock.matchAll(/\n {4}key: '(m\d+)',/g)].map((m) => m[1]);
    assert.equal(keys.length, 14, 'Modules 1–14');
    assert.deepEqual(Object.keys(MODULES), keys);
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
  it('house copy rules: knowledge not skills, no "N of total", no build notes, no "recommend", no gear brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*14\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|dev build|engine v\d)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Shure|Sennheiser|Neumann|Yamaha|Behringer|Apple|iPhone|Pixel|Samsung|JBL|Bose)\b/, `${id}: a maker/model name`);
    }
  });
  it('every step fits its no-scroll budget', () => {
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
  it('the Module 7 cover guide never gives the prediction away', () => {
    const t = textOf(G.FOUNDATIONS_M7_COVER_GUIDE as unknown as Guide);
    assert.doesNotMatch(t, /left\s*(=|is)\s*earlier|millisecond|\bms\b|diary|MIC’S OUTPUT|answer is|most people/i);
    // Nor may it point at anything the cover shows that states the answer:
    // THE GOAL card renders on the cover and says waveforms draw TIME.
    assert.doesNotMatch(t, /THE GOAL|goal card/i);
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const COURSE_SRC = [
    COURSE,
    VIZ,
    code('src/screens/lab/foundations/bits.tsx'),
    code('src/screens/lab/kit/labNav.ts'),
    code('src/screens/lab/kit/LabEndScreen.tsx'),
    code('src/screens/lab/rack/RackUnit.tsx'),
  ].join('\n');
  const PLAY_SRC = [PLAY, VIZ, code('src/screens/lab/foundations/bits.tsx'), code('src/screens/lab/rack/RackUnit.tsx')].join('\n');
  const NAMES: Record<string, string[]> = {
    m1: ['PITCH', 'LOW · 110 Hz', 'MID · 220 Hz', 'HIGH · 880 Hz', 'COLORIZED PRESSURE', 'FREQ', 'MODEL', 'TONE', 'LIVE', 'PLAY', 'FULL SCREEN', '▾ TEXT'],
    m2: ['SPEAKER', 'THE GRAPH', 'COLORIZED PRESSURE', 'FREQ', 'TONE'],
    m3: ['STRENGTH', 'gentle', 'medium', 'strong', 'LEVEL', '+ PRESSURE', '− PRESSURE'],
    m4: ['AMPLITUDE', 'AMP', 'small → quiet', 'large → loud', 'LEVEL', 'THE GRAPH'],
    m5: ['FREQ B', 'A (REF)', 'B (YOURS)', 'TONE'],
    m6: ['FREQ', 'λ', 'FITS', '7 m'],
    m7: ['THE ROOM — CAMERA FLASH', 'MIC INPUT', 'NOW', 'PROBE', 'SAME SPOT', 'FREEZE', 'MODE', 'FROZEN', 'RUN', '1 · WATCH', '2 · FREEZE', '3 · DRAG THE PROBE'],
    m8: ['PITCH', 'OCTAVES', 'ABOVE 110', '8ve'],
    m9: ['SEND', 'HEARD', 'YOU SEND — same at every Hz', 'YOU HEAR', 'EAR', 'WHAT YOU HEAR — LEVEL × EAR CURVE'],
    m10: ['PHASE', 'PRESET', 'HEAR', 'ALIGNED', 'PARTIAL', 'CANCELED', 'OUT', 'INPUTS', 'SUM = A + B', 'HEAR ALIGNED — 220 / 220 Hz', 'HEAR DRIFTING — 220 / 222 Hz', 'STOP'],
    m11: ['HARMONICS', 'F0', 'SEL', 'LEVEL', 'SUM'],
    m12: ['UNMIX', 'RECIPE', 'PURE', 'HOLLOW (odd)', 'BRIGHT (all)', 'F0', 'separated'],
    m13: ['CHAIN', 'SOURCE → AIR → MIC', 'SPL Meter', 'Frequency Counter & Tuner', 'RTA', 'Spectrogram', 'Waveform', 'RT60', 'Signal Generator', 'dBFS · uncalibrated'],
    m14: ['COURSE', 'COMPLETE — THE WHOLE MODEL', 'YOU BUILT THE WHOLE MODEL', 'CHECK YOURSELF', 'OPEN THE PLAYGROUND', 'FINISH ›'],
    m7cover: ['TIME', 'SPACE', 'earlier → later', 'one place → another', 'PROBE', 'FREEZE'],
    end: ['CREDITED', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', '‹ PREV'],
  };
  const PLAY_NAMES = [
    'WAVEFORM — PRESSURE VS TIME', 'SPECTRUM — LOG 40 Hz–16 kHz', 'STEREO BALANCE', 'CENTER', 'FREQ', 'λ', 'PERIOD', 'LEVEL', 'dBFS',
    'SWEEP', 'CONTENT', 'SOURCE', 'SINE', 'SQUARE', 'SAW', 'TRIANGLE', 'WHITE', 'PINK', 'BROWN', 'NOISE', 'SLOW SWEEP', 'FAST SWEEP',
    'HARMONIC RICHNESS', 'ALL HARMONICS', 'FIRST 3', 'FUNDAMENTAL', 'PHASE · POLARITY', 'POLARITY +', 'POLARITY −', 'FX',
    'DELAY OFF', '120 ms', '400 ms', 'EQ LOW-PASS', 'LPF 2 kHz', 'LPF 500 Hz', 'Q 0.7', 'Q 4', 'PLAY', 'STOP',
  ];
  it('a name list for every course guide', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), [...Object.keys(MODULES), 'm7cover', 'end'].sort());
  });
  const byId = Object.fromEntries(allGuides);
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(byId[id]);
      for (const n of names) {
        assert.ok(COURSE_SRC.includes(n), `${id}: "${n}" is no longer in the course/renderer source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('playground: every pinned name is on the screen AND in the guide', () => {
    const gt = textOf(byId.playground);
    for (const n of PLAY_NAMES) {
      assert.ok(PLAY_SRC.includes(n), `playground: "${n}" is no longer in the source — update the guide`);
      assert.ok(gt.includes(n), `playground: the guide never names "${n}"`);
    }
  });
});

describe('3. TRY THIS numbers are the numbers the screen prints', () => {
  const t = (id: string) => byIdText[id];
  const byIdText = Object.fromEntries(allGuides.map(([id, gd]) => [id, textOf(gd)]));
  it('the formulas and defaults the numbers come from are still the source’s', () => {
    assert.match(read('src/features/audio/startLevel.ts'), /export const START_LEVEL_01 = 0\.3;/);
    // M1 MODEL = visHzFor(f); M5 A/B; M6 55·2^oct; M7 probe readout; M9 LEVEL map and FREQ map.
    assert.match(COURSE, /return 0\.45 \+ 1\.15 \* \(Math\.log\(f \/ lo\) \/ Math\.log\(hi \/ lo\)\);/);
    assert.match(COURSE, /const M5_FIXED_A = 110;/);
    assert.match(COURSE, /const M5_MIN = 100;/);
    assert.match(COURSE, /const M5_MAX = 700;/);
    assert.match(COURSE, /useState\(330\)/);
    assert.match(COURSE, /const f = Math\.round\(55 \* Math\.pow\(2, oct\)\);/);
    assert.match(COURSE, /useState\(0\.69\)/);
    assert.match(COURSE, /return `\$\{\(\(k \* 343\) \/ f\)\.toFixed\(2\)\} m · \$\{\(\(k \* 1000\) \/ f\)\.toFixed\(1\)\} ms`;/);
    assert.match(COURSE, /const levelDb = -44 \+ lvl \* 24;/);
    assert.match(COURSE, /const f = Math\.round\(80 \* Math\.pow\(8000 \/ 80, pos\)\);/);
    assert.match(VIZ, /s = -20 \* Math\.pow\(Math\.log10\(1000 \/ fc\), 1\.8\);/);
    assert.match(VIZ, /const bump = 5 \* Math\.exp\(-Math\.pow\(Math\.log2\(fc \/ 3500\), 2\) \/ 0\.6\);/);
    assert.match(PLAY, /const freq = Math\.round\(55 \* Math\.pow\(3520 \/ 55, freq01\)\);/);
    assert.match(PLAY, /const levelDb = Math\.round\(-48 \+ lvl01 \* 32\);/);
    assert.match(PLAY, /useState\(0\.4\); \/\/ log 55\.\.3520/);
  });
  const vis = (f: number) => {
    const c = Math.max(110, Math.min(1760, f));
    return 0.45 + 1.15 * (Math.log(c / 110) / Math.log(1760 / 110));
  };
  const ear = (f: number) => {
    const fc = Math.max(30, Math.min(18000, f));
    const s =
      fc < 1000
        ? -20 * Math.pow(Math.log10(1000 / fc), 1.8)
        : 5 * Math.exp(-Math.pow(Math.log2(fc / 3500), 2) / 0.6) - 9 * Math.max(0, Math.log2(fc / 9000));
    return Math.max(-42, Math.min(8, s));
  };
  const rd = (v: number) => (Number(v.toFixed(0)) === 0 ? 0 : Number(v.toFixed(0)));
  const neg = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));
  it('M1: MODEL at LOW and HIGH', () => {
    assert.ok(t('m1').includes(`MODEL goes ${vis(110).toFixed(2)} → ${vis(880).toFixed(2)} Hz`));
  });
  it('M6: λ and FITS at 55 / 110 / 220 / 880 Hz', () => {
    for (const f of [55, 110, 220, 880]) {
      const l = 343 / f;
      assert.ok(t('m6').includes(`${l.toFixed(2)} m`), `λ at ${f}`);
      assert.ok(t('m6').includes(`${(7 / l).toFixed(1)}×`), `FITS at ${f}`);
    }
  });
  it('M7: the PROBE lane at its start, at 110 Hz, and at the end of its lane', () => {
    const lane = (c: number, f: number) => `${(((c / 0.69) * 343) / f).toFixed(2)} m · ${(((c / 0.69) * 1000) / f).toFixed(1)} ms`;
    for (const [c, f] of [[0.69, 220], [0.69, 110], [1, 220]]) assert.ok(t('m7').includes(lane(c, f)), lane(c, f));
    // The display's SAME SPOT / PROBE tags use the lane's mapping (vet item
    // foundations-m7, 2026-10-31: they used a width-dependent cursor·(w−112)
    // and disagreed with the lane on every phone). One period = w/DD_CYC px,
    // so tMs = off·(DD_CYC·1000/f)/w = (c/0.69)·1000/f at ANY stage width.
    assert.match(VIZ, /const off = Math\.min\(maxOff, \(cursor \/ 0\.69\) \* \(w \/ DD_CYC\)\);/);
    assert.match(VIZ, /const maxOff = MICX - 8;/);
    assert.match(VIZ, /const MICX = w - 96;/);
    assert.match(VIZ, /const tMs = off \* \(windowMs \/ w\);/);
    for (const w of [320, 393, 478.5, 607]) {
      const maxOff = w - 96 - 8;
      for (const [c, f] of [[0.69, 220], [0.69, 110], [1, 220]]) {
        const off = Math.min(maxOff, (c / 0.69) * (w / 2.2));
        assert.ok(off < maxOff, `PROBE never clamps at w=${w}`);
        const tMs = off * (((2.2 / f) * 1000) / w);
        assert.equal(`${((343 * tMs) / 1000).toFixed(2)} m · ${tMs.toFixed(1)} ms`, lane(c, f), `display = lane at w=${w}, c=${c}, ${f} Hz`);
      }
    }
    assert.match(t('m7'), /the PROBE lane reads 1\.56 m/);
    assert.doesNotMatch(t('m7'), /one wavelength, one period/);
  });
  it('M12: BRIGHT bars — the 6 px floor makes H5 and H6 the same height, and the guide says so', () => {
    assert.match(VIZ, /specBase - Math\.max\(6, 30 \* amps\[n\]\)/);
    const h = [1, 2, 3, 4, 5, 6].map((n) => Math.max(6, 30 / n));
    assert.equal(h[4], h[5]);
    assert.match(t('m12'), /the last two look the same height/);
  });
  it('M11: the last experiment clears every layer but H1 (an earlier one raised H4)', () => {
    assert.match(t('m11'), /every layer but H1 to 0 %/);
  });
  it('M9: SEND / EAR / HEARD at 1 kHz, 80 Hz and 3.5 kHz; LEVEL top', () => {
    const send = rd(-44 + 0.3 * 24);
    assert.ok(t('m9').includes(`both read ${neg(send)} dB`));
    assert.ok(t('m9').includes(`EAR reads ${neg(rd(ear(80)))} dB, HEARD ${neg(send + rd(ear(80)))} dB`));
    assert.ok(t('m9').includes(`EAR reads +${rd(ear(3500))} dB and HEARD ${neg(send + rd(ear(3500)))} dB`));
    assert.equal(rd(ear(1000)), 0);
    assert.ok(t('m9').includes(`SEND reads ${neg(-44 + 1 * 24)} dB`));
  });
  it('Playground: the defaults and the λ halving', () => {
    const f = Math.round(55 * Math.pow(3520 / 55, 0.4));
    assert.equal(f, 290);
    assert.ok(t('playground').includes(`starts at ${f} Hz`));
    assert.ok(t('playground').includes(`starts at ${neg(Math.round(-48 + 0.3 * 32))})`));
    assert.ok(t('playground').includes(`λ at ${f} Hz (${(343 / f).toFixed(2)} m)`));
    assert.ok(t('playground').includes(`${(343 / 580).toFixed(2)} m`));
  });
});

describe('4–5. wiring, and the accuracy chip decision (concept screens: chip out)', () => {
  it('FoundationsCourseScreen: the guide on LabHeader per screen in view, the host around the root, no AccuracyNote', () => {
    assert.doesNotMatch(COURSE, /AccuracyNote/);
    assert.match(COURSE, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(
      COURSE,
      /<LabHeader[\s\S]*?guide=\{ending \? FOUNDATIONS_END_GUIDE : spoilerGated \? FOUNDATIONS_M7_COVER_GUIDE : FOUNDATIONS_SCREEN_GUIDES\[s\.key as FoundationsStepKey\]\}/,
    );
    // The host wraps the root's whole content; a module change (or the cover
    // opening, or the end screen) closes an open guide.
    assert.match(COURSE, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost resetKey=\{ending \? 'end' : spoilerGated \? 'm7-cover' : s\.key\}>/);
    assert.match(COURSE, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('FoundationsPlaygroundScreen: key + hint anchor + host wired by hand, no AccuracyNote', () => {
    assert.doesNotMatch(PLAY, /AccuracyNote/);
    // The reason (re-vetted 2026-10-31): no microphone is ever opened — only
    // the engine's generator + effects (ApeDsp.start() is mic capture, never
    // called here) — and LEVEL prints the generator's COMMANDED level
    // (-48 + lvl01 * 32 dBFS), set by the fader, not measured from a signal.
    const calls = new Set([...PLAY.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    assert.ok(calls.size > 0);
    for (const c of calls) assert.match(c, /^(gen|fx)[A-Z]\w*$|^(isAvailable|engineVersion)$/, `ApeDsp.${c} — not a generator/effects call`);
    assert.doesNotMatch(PLAY, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
    assert.match(PLAY, /const levelDb = Math\.round\(-48 \+ lvl01 \* 32\);/);
    assert.match(PLAY, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost>\s*<ScreenGuideHintAnchor>\s*<View style=\{styles\.header\}>/);
    assert.match(PLAY, /<ScreenGuideKey title="FOUNDATIONS PLAYGROUND" guide=\{PLAYGROUND_SCREEN_GUIDE\} \/>\s*<\/View>\s*<\/ScreenGuideHintAnchor>/);
    assert.match(PLAY, /<\/ScreenGuideHost>\s*<\/View>\s*\);\s*\}/);
  });
});
