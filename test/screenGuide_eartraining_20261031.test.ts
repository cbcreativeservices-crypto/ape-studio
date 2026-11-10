/**
 * Screen Guide rollout — Ear Training Lab (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts, test/screenGuide_meter_20261031.test.ts.
 *
 *   1. every EarModuleId, the module list (home) and the what's-left screen
 *      have a guide: five sections, 1–5 bullets each, 2–3 TRY THIS
 *      experiments, the house copy rules, each step within its no-scroll
 *      budget;
 *   2. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and this lab's source (rename one → update the guide);
 *   3. every number the guide states is what the screen prints — recomputed
 *      here from the module's own trial factory, earDsp and SeeItView's own
 *      formulas (the defaults and formulas are pinned too);
 *   4. wiring: both screens pass the guide to LabHeader and wrap their root in
 *      ScreenGuideHost (regions off — neither is a Rack Unit);
 *   5. the accuracy-chip decision: a CONCEPT lab — every clip is rendered by
 *      the app, nothing listens to a microphone or measures a real room — so
 *      neither header shows AccuracyNote; the playback honesty it carried is
 *      in the home guide.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// The ear modules import their siblings without an extension (Metro style).
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
/** The screen mixes straight and curly apostrophes; the guide uses curly. */
const ap = (s: string) => s.replace(/[’']/g, "'");

const { EAR_MODULES, earModuleById } = await import('../src/features/ear/modules/registry.ts');
const C = await import('../src/features/ear/modules/common.ts');
const TONE = await import('../src/features/ear/modules/tone.ts');
const D = await import('../src/features/ear/earDsp.ts');
const SM = await import('../src/screens/lab/eartraining/seeItMath.ts');
const { REQUIRED_EAR_LEVEL } = await import('../src/features/lab/trainingLabKeys.ts');
const { EAR_SCREEN_GUIDES, EAR_HOME_GUIDE, EAR_END_GUIDE } = await import('../src/screens/lab/eartraining/earTrainingScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
type Trial = {
  clips: { label: string; buf: Float32Array | { l: Float32Array; r: Float32Array } }[];
  question: string;
  answers: { label: string }[];
  correct: number;
  reveal: string;
  seeIt: { kind: string; bars?: { label: string; db: number }[]; markersSec?: number[] };
};
type Mod = { id: string; levels: number; makeTrial: (l: number, s: number, o?: { subBassOk?: boolean }) => Trial };
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = EAR_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [
  ['home', EAR_HOME_GUIDE as unknown as Guide],
  ['end', EAR_END_GUIDE as unknown as Guide],
  ...Object.entries(GUIDES),
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const tryOf = (id: string) => GUIDES[id].tryThis.join('\n');
const mod = (id: string) => earModuleById(id) as unknown as Mod;
/** First trial (seed 1…) that passes `pick`. */
function find(id: string, level: number, pick: (t: Trial) => boolean, opts?: { subBassOk?: boolean }): Trial {
  for (let s = 1; s < 2000; s++) {
    const t = mod(id).makeTrial(level, s, opts);
    if (pick(t)) return t;
  }
  throw new Error(`${id} L${level}: no trial found`);
}
const ans = (t: Trial) => t.answers.map((a) => a.label);
const right = (t: Trial) => t.answers[t.correct].label;

describe('1. every Ear Training screen has a complete guide', () => {
  it('every EarModuleId has a guide — and no guide is for a module that does not exist', () => {
    const ids = EAR_MODULES.map((x: { id: string }) => x.id).sort();
    assert.equal(ids.length, 14);
    assert.deepEqual(Object.keys(GUIDES).sort(), ids);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty, 2–3 experiments`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro && intro.learning.trim().length > 10 && intro.start.trim().length > 10, `${id}: the intro card (learning + start)`);
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
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|build \d+|NEW COPY)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Altiverb|Waves|iZotope|Neve|SSL|Shure|Neumann|Yamaha|Behringer|Dolby|Avid|Lexicon|EMT|Fairchild|Universal Audio)\b/, `${id}: a gear brand`);
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
  it('"at level N, the top" is each module’s real top level (the two-replay cap)', () => {
    assert.match(code('src/screens/lab/eartraining/EarModuleScreen.tsx'), /const TOP_LEVEL_REPLAYS = 2;[\s\S]*const replayCap = mod && level >= mod\.levels \? TOP_LEVEL_REPLAYS : Infinity;/);
    for (const [id, gd] of Object.entries(GUIDES)) {
      for (const m of textOf(gd).matchAll(/at level (\d), the top/g)) assert.equal(Number(m[1]), mod(id).levels, `${id}: level ${m[1]} is not the top`);
      assert.match(gd.control.join(' '), /two plays/, `${id}: the replay cap is not mentioned`);
    }
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const SRC = ap(
    [
      'src/screens/lab/eartraining/EarModuleScreen.tsx',
      'src/screens/lab/eartraining/EarTrainingLabScreen.tsx',
      'src/screens/lab/eartraining/SeeItView.tsx',
      'src/screens/lab/eartraining/earLabEnd.ts',
      'src/screens/lab/ModuleAccordionRow.tsx',
      'src/screens/lab/kit/LabEndScreen.tsx',
      'src/screens/lab/kit/labEnd.ts',
      'src/screens/lab/kit/ExpandableFigure.tsx',
      'src/features/ear/earPrograms.ts',
      ...readdirSync(join(ROOT, 'src/features/ear/modules')).map((f) => `src/features/ear/modules/${f}`),
    ]
      .map(code)
      .join('\n'),
  );
  const DRILL = ['NEXT TRIAL ›', 'FULL SCREEN', 'FINISH · SEE WHAT’S LEFT ›'];
  const NAMES: Record<string, string[]> = {
    home: ['MODULES', 'OPEN', 'FINISH · SEE WHAT’S LEFT ›', 'NEXT TRIAL ›', 'Frequency Recognition'],
    end: ['WHAT’S LEFT', 'REVIEW ▾', 'LAB COMPLETE', 'CARRY ON · ', 'DONE · BACK TO THE MODULE LIST', 'DONE · BACK TO LABS', 'PRACTICE AGAIN FROM THE START', 'Frequency Recognition'],
    frequency: [...DRILL, 'LISTEN FOR', 'NEXT ROUND ›', 'SEE IT', 'SPECTRUM', 'Which tone is higher?', 'My playback can’t reproduce sub-bass'],
    eq: [...DRILL, 'SOURCE', 'Synth', 'Piano', 'Guitar', 'Boost', 'Cut', 'Is B boosted or cut?', 'wide bell (Q 1.4)', 'narrow bell (Q 4.0)', 'SEE IT'],
    band: [...DRILL, 'Which band changed from A to B?', 'Sub Bass', 'Low Mid', 'Upper Mid', 'Presence', 'Brilliance', 'Air', 'BASS', 'BRILL', 'SOURCE', 'CLOSE', 'My playback can’t reproduce sub-bass'],
    noise: [...DRILL, 'What are you hearing?', 'Which clip is pink noise?', 'Sawtooth', 'Triangle', 'SPECTRUM', '−6 dB/oct'],
    defect: [...DRILL, 'What problem do you hear?', 'What problem is hiding in the program?', 'Hum', 'Hiss', 'Click', 'Distortion', 'Clipping', 'Dropout', 'Ground loop (emulation)', 'Buzz', 'Crackle', 'Pop', 'Digital glitch', 'RF interference (emulation)', 'SPECTRUM', 'WAVEFORM'],
    stereo: [...DRILL, 'HEADPHONES REQUIRED', 'I’M ON HEADPHONES', 'What is this stereo image doing?', 'Left', 'Right', 'Centered (mono)', 'Wide', 'Narrow', 'Out of phase', 'Which clip is wider?', 'GONIOMETER', 'M up · S across', 'corr'],
    loudness: ['NEXT TRIAL ›', 'FINISH · SEE WHAT’S LEFT ›', 'Which is louder?', 'By about how much do A and B differ?', 'A is louder', 'B is louder'],
    delay: [...DRILL, 'About how long is the delay?', 'WAVEFORM'],
    reverb: [...DRILL, '(emulation)', 'Short', 'Medium', 'Long', 'Room', 'Hall', 'Plate', 'Chamber', 'Spring', 'Bright', 'Dark', 'WAVEFORM', 'SPECTRUM'],
    compression: [...DRILL, 'None', 'Light', 'Moderate', 'Heavy', 'Pumping', 'WAVEFORM'],
    pitch: [...DRILL, 'Which note is higher?', 'What interval is A up to B?', 'Unison', 'Perfect 5th', 'Octave', 'Major 3rd', 'Perfect 4th', 'Major 2nd', 'Minor 3rd', 'Major 6th', 'SPECTRUM'],
    polarity: [...DRILL, 'Which sum is fuller?', 'Normal sum', 'Polarity flipped', 'Partial cancellation', 'SPECTRUM'],
    comb: [...DRILL, 'linear Hz', ' ÷ ', 'X is A', 'X is B'],
    clipping: [...DRILL, 'How clipped is this?', 'Clean', 'Mild', 'Moderate', 'Severe', 'SPECTRUM', 'WAVEFORM'],
  };
  const byId: Record<string, Guide> = Object.fromEntries(allGuides);
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), allGuides.map(([id]) => id).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = ap(textOf(byId[id]));
      for (const n of names.map(ap)) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in this lab's source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('module titles the guides name are the registry’s', () => {
    const titles = EAR_MODULES.map((m: { title: string }) => m.title);
    for (const t of ['Frequency Recognition', 'EQ Recognition', 'Band Identification', 'Delay Recognition', 'Comb Filtering']) assert.ok(titles.includes(t), t);
    assert.equal(EAR_MODULES[0].id, 'frequency', 'PRACTICE AGAIN FROM THE START opens Module 1');
  });
  it('the module families the home guide lists are the registry’s numbering', () => {
    const num = (id: string) => EAR_MODULES.find((m: { id: string }) => m.id === id).num;
    assert.deepEqual(['frequency', 'eq', 'band', 'noise'].map(num), ['1', '2', '3', '4']);
    assert.deepEqual(['defect', 'stereo', 'pitch'].map(num), ['5', '6', '11']);
    assert.deepEqual(['loudness', 'compression', 'clipping'].map(num), ['7', '10', '14']);
    assert.deepEqual(['delay', 'reverb', 'polarity', 'comb'].map(num), ['8', '9', '12', '13']);
    assert.ok(EAR_HOME_GUIDE.changes[0].includes('7, 10, 14 level, compression, clipping; 8, 9, 12, 13 time'));
  });
  it('the related labs the guides point to exist under those names', () => {
    const cat = code('src/screens/lab/labCatalog.ts');
    for (const n of ['Equalization', 'Dynamics', 'Time Effects', 'Stereo & Spatial', 'EQ Lab', 'Noise', 'Oscillators', 'Stereo Imaging', 'Delay', 'Reverb', 'Compression', 'Tuning & Temperament Lab', 'Phase', 'Wave Physics Laboratory', 'Distortion']) {
      assert.ok(cat.includes(`name: '${n}'`), `no lab or category named "${n}"`);
    }
  });
});

describe('3. every number the guides state is what the screen prints', () => {
  it('home + end: fourteen modules, level 2 at 80 % over 20 to count, ladder 80 % up / under 50 % down, ten-trial rounds, 15-minute reminder', () => {
    assert.equal(EAR_MODULES.length, 14);
    assert.equal(REQUIRED_EAR_LEVEL, 2);
    const P = code('src/features/ear/earProgress.ts');
    assert.match(P, /const WINDOW = 20;/);
    assert.match(P, /if \(pct >= 0\.8\) \{/);
    assert.match(P, /\} else if \(pct < 0\.5 && p\.level > 1\) \{/);
    assert.match(P, /next\.mastered = Math\.max\(next\.mastered, p\.level\);/, 'credit (mastered) only grows');
    const S = code('src/screens/lab/eartraining/EarModuleScreen.tsx');
    assert.match(S, /const ROUND = 10;/);
    assert.match(S, /const FATIGUE_MS = 15 \* 60 \* 1000;/);
    assert.match(code('src/screens/lab/eartraining/EarTrainingLabScreen.tsx'), /`L\$\{Math\.min\(p\.level, m\.levels\)\}\$\{acc != null \? ` · \$\{Math\.round\(acc \* 100\)\}%` : ''\}/);
    assert.ok(EAR_END_GUIDE.changes[0].includes('level 2 at 80 % over 20 answers'));
  });

  it('Frequency: the grids, the sub-bass skip and the low-tone makeup', () => {
    const f = mod('frequency');
    const named = (lvl: number, opts?: { subBassOk?: boolean }) => find('frequency', lvl, (t) => t.question === 'Which frequency is this tone?', opts);
    assert.deepEqual(ans(named(1)), ['63 Hz', '125 Hz', '250 Hz', '500 Hz', '1 kHz', '2 kHz', '4 kHz', '8 kHz', '16 kHz']);
    const noSub = ans(named(1, { subBassOk: false }));
    assert.equal(noSub.length, 8);
    assert.equal(noSub[0], '125 Hz');
    assert.equal(noSub[7], '16 kHz');
    const l2 = ans(named(2));
    assert.equal(l2.length, 13);
    // "every other third-octave center" — NOT half-octave steps (63 → 100 Hz is two thirds of an octave).
    assert.deepEqual(l2, (C.ISO_THIRDS as readonly number[]).filter((_, i) => i % 2 === 0).map(C.hzLabel));
    assert.equal(ans(named(3)).length, 25);
    assert.equal(ans(named(4)).length, 25);
    assert.equal(C.lfMakeupDb(125).toFixed(1), '3.0');
    assert.equal(C.lfMakeupDb(63).toFixed(1), '6.0');
    assert.equal(C.lfMakeupDb(250), 0);
    const t125 = find('frequency', 1, (t) => t.reveal.startsWith('125 Hz sine'));
    assert.ok(t125.reveal.includes('+3.0 dB makeup'));
    assert.ok(tryOf('frequency').includes('125 Hz tone adds “+3.0 dB makeup”, 63 Hz adds “+6.0 dB”, 250 Hz and up add none'));
    assert.ok(!find('frequency', 1, (t) => t.reveal.startsWith('250 Hz sine')).reveal.includes('makeup'));
    // Higher-or-lower: two octaves at level 1 → a sixth of an octave at level 4.
    assert.match(code('src/features/ear/modules/tone.ts'), /const stepThirds = \[6, 3, 1, 0\.5\]\[Math\.min\(level, 4\) - 1\];/);
    assert.match(code('src/features/ear/modules/tone.ts'), /f1 \* Math\.pow\(2, 1 \/ 6\)/);
    assert.equal(f.levels, 4);
  });

  it('EQ: the chips, the truth-line wording, the amount ladder', () => {
    const q0 = find('eq', 1, (t) => t.question === 'B has one EQ move. Around which frequency?');
    assert.deepEqual(ans(q0), ['125 Hz', '250 Hz', '500 Hz', '1 kHz', '2 kHz', '4 kHz', '8 kHz']);
    const t = find('eq', 1, (x) => x.reveal.startsWith('+12 dB wide bell (Q 1.4) at 1 kHz'));
    assert.ok(t.reveal.includes('loudness re-matched'));
    assert.deepEqual(ans(find('eq', 4, (x) => x.question.startsWith('By about how much'))), ['3 dB', '6 dB', '9 dB', '12 dB']);
    assert.deepEqual(ans(find('eq', 2, (x) => x.question === 'Is B boosted or cut?')), ['Boost', 'Cut']);
    const T = code('src/features/ear/modules/tone.ts');
    assert.match(T, /const EQ_AMOUNTS = \[12, 9, 6, 3\];/);
    assert.match(T, /const boost = level <= 1 \? true : rng\(\) < 0\.55;/, 'cuts join at level 2');
    assert.match(T, /if \(level >= 3 && rng\(\) < 0\.3\) \{/, 'shelves join at level 3');
    assert.match(T, /peakEq\(freq, gain, narrow \? 4\.0 : 1\.4\)/);
  });

  it('Band ID: the truth line, the level-1 deck, the sub-bass skip, the band names SEE IT can print', () => {
    const t = find('band', 2, (x) => x.reveal.startsWith('+9 dB in Low Mid'));
    assert.equal(t.reveal, '+9 dB in Low Mid (250 Hz–500 Hz), centered near 354 Hz.');
    assert.ok(tryOf('band').includes(`“${t.reveal.slice(0, -1)}”`));
    assert.deepEqual(ans(mod('band').makeTrial(1, 3)), ['Bass', 'Mid', 'Presence', 'Brilliance']);
    const l2 = ans(mod('band').makeTrial(2, 3, { subBassOk: false }));
    assert.equal(l2.length, 7);
    assert.ok(!l2.includes('Sub Bass'));
    assert.match(code('src/features/ear/modules/tone.ts'), /const gainMag = \[12, 9, 6, 4\]\[Math\.min\(level, 4\) - 1\];/);
    // SeeItView prints a band's short name only where the band is ≥ 28 units wide.
    const V = code('src/screens/lab/eartraining/SeeItView.tsx');
    assert.match(V, /const W = 320;/);
    assert.match(V, /const PLOT_L = 30;/);
    assert.match(V, /const PLOT_R = W - 14;/);
    assert.match(V, /const F_LO = 40;\nconst F_HI = 20000;/);
    assert.match(V, /if \(w < 28\) return null;/);
    const xOf = (hz: number) => 30 + (Math.log(Math.max(40, Math.min(20000, hz)) / 40) / Math.log(20000 / 40)) * (306 - 30);
    const BANDS = TONE.BANDS as { label: string; lo: number; hi: number }[];
    const drawn = BANDS.filter((b) => xOf(Math.min(b.hi, 20000)) - xOf(b.lo) >= 28).map((b) => b.label);
    assert.deepEqual(drawn, ['Bass', 'Low Mid', 'Mid', 'Upper Mid', 'Brilliance'], 'SUB, PRES and AIR are too narrow to print');
    assert.ok(GUIDES.band.seeing.join(' ').includes('short names such as BASS, MID and BRILL'));
  });

  it('Noise: wave pitches 200–800 Hz, three-noise / four-wave level 1, the slope guides', () => {
    const T = code('src/features/ear/modules/tone.ts');
    assert.match(T, /const f0 = 200 \* Math\.pow\(4, rng\(\)\);/);
    const decks = new Set<string>();
    for (let s = 1; s < 60; s++) decks.add(ans(mod('noise').makeTrial(1, s)).join('|'));
    assert.deepEqual([...decks].sort(), ['Sine wave|Square wave|Sawtooth wave|Triangle wave', 'White noise|Pink noise|Brown noise'].sort());
    assert.equal(ans(mod('noise').makeTrial(2, 5)).length, 7);
    assert.match(code('src/screens/lab/eartraining/SeeItView.tsx'), /label: slope === 0 \? '0' : slope === -3 \? '−3' : '−6 dB\/oct'/);
  });

  it('Defects: the level-1 six, the look-alike pairs, buzz’s top harmonic', () => {
    const six = new Set<string>();
    for (let s = 1; s < 40; s++) ans(mod('defect').makeTrial(1, s)).forEach((a) => six.add(a));
    assert.deepEqual([...six].sort(), ['Click', 'Clipping', 'Distortion', 'Dropout', 'Hiss', 'Hum']);
    assert.ok(GUIDES.defect.seeing[1].startsWith('Level 1 chips: Hum, Hiss, Click, Distortion, Clipping, Dropout.'));
    assert.equal(ans(mod('defect').makeTrial(2, 1)).length, 12);
    const M = code('src/features/ear/modules/defects.ts');
    assert.match(M, /key: 'hum', label: 'Hum', core: true, confusableWith: \['ground'\]/);
    assert.match(M, /key: 'crackle', label: 'Crackle', confusableWith: \['click'\]/);
    assert.match(M, /key: 'distortion', label: 'Distortion', core: true, confusableWith: \['clipping'\]/);
    assert.match(M, /level <= 2 && d\.confusableWith/);
    assert.match(M, /const tonal = \['hum', 'ground', 'buzz', 'hiss', 'rf', 'distortion', 'clipping'\]\.includes\(d\.key\);/);
    // buzz(): harmonics 1…min(⌊24000/mains⌋, 60) at 1/k.
    assert.match(code('src/features/ear/earDsp.ts'), /for \(let k = 1; k <= Math\.min\(maxK, 60\); k\+\+\)/);
    const top = (mains: number) => Math.min(Math.floor(D.SR / 2 / mains), 60) * mains;
    assert.equal(top(50), 3000);
    assert.equal(top(60), 3600);
    assert.ok(tryOf('defect').includes('up to 3 kHz (50 Hz power) or 3.6 kHz (60 Hz)'));
  });

  it('Stereo: the correlation SEE IT prints for Left, Centered, Narrow and Out of phase', () => {
    // SeeItView's goniometer correlation, every 4th sample, as drawn.
    assert.match(code('src/screens/lab/eartraining/SeeItView.tsx'), /for \(let i = 0; i < l\.length; i \+= 4\) \{\s*lr \+= l\[i\] \* r\[i\];\s*ll \+= l\[i\] \* l\[i\];\s*rr \+= r\[i\] \* r\[i\];\s*\}\s*const corr = ll > 1e-12 && rr > 1e-12 \? lr \/ Math\.sqrt\(ll \* rr\) : 0;/);
    const corr = (b: { l: Float32Array; r: Float32Array }) => {
      let lr = 0, ll = 0, rr = 0;
      for (let i = 0; i < b.l.length; i += 4) { lr += b.l[i] * b.r[i]; ll += b.l[i] * b.l[i]; rr += b.r[i] * b.r[i]; }
      return lr / Math.sqrt(ll * rr);
    };
    const c = (label: string, seed = 0) => corr(find('stereo', 3, (t) => right(t) === label && seed-- <= 0).clips[0].buf as { l: Float32Array; r: Float32Array });
    for (let k = 0; k < 3; k++) {
      assert.equal(c('Left', k).toFixed(2), '1.00');
      assert.equal(c('Centered (mono)', k).toFixed(2), '1.00');
      assert.equal(c('Out of phase', k).toFixed(2), '-1.00');
      const n = c('Narrow', k);
      assert.ok(n >= 0.85 && n <= 0.95, `Narrow corr ${n.toFixed(2)} is not "about 0.9"`);
    }
    assert.ok(tryOf('stereo').includes('corr after you answer: 1.00, the same as Centered'));
    assert.ok(tryOf('stereo').includes('corr goes from 1.00 to −1.00'));
    assert.deepEqual(ans(mod('stereo').makeTrial(1, 2)), ['Left', 'Right', 'Centered (mono)']);
    assert.equal(ans(mod('stereo').makeTrial(2, 2)).length, 5);
    assert.equal(ans(mod('stereo').makeTrial(3, 2)).length, 6);
    assert.equal(mod('stereo').makeTrial(4, 2).question, 'Which clip is wider?');
  });

  it('Loudness: the gaps, the jitter, and the bars at level 2', () => {
    const M = code('src/features/ear/modules/dynamics.ts');
    assert.match(M, /const M7_STEPS = \[6, 3, 2, 1\];/);
    assert.match(M, /const askMagnitude = level >= 2 && rng\(\) < 0\.4;/, 'level 1 asks only which is louder');
    assert.match(M, /const base = \(rng\(\) - 0\.5\) \* 4;/, '±2 dB together');
    const bars = new Set<string>();
    for (let s = 1; s < 200; s++) {
      const t = mod('loudness').makeTrial(2, s);
      if (!t.question.startsWith('By about how much')) continue;
      // The bar's printed text: `${db.toFixed(1)} dB` (hyphen-minus on screen).
      bars.add(t.seeIt.bars!.map((b) => `${b.db > 0 ? `+${b.db.toFixed(1)}` : b.db.toFixed(1)} dB`).sort().join(' & '));
    }
    assert.deepEqual([...bars].sort(), ['-3.0 dB & 0.0 dB', '-6.0 dB & 0.0 dB']);
    assert.ok(tryOf('loudness').includes('0.0 dB and −3.0 dB, or 0.0 dB and −6.0 dB'));
  });

  it('Delay: the ruler reads the delay, the echo is 6 dB down, later repeats only from 250 ms', () => {
    for (let s = 1; s < 30; s++) {
      const t = mod('delay').makeTrial(3, s);
      if (t.question !== 'About how long is the delay?') continue;
      const [a, b] = t.seeIt.markersSec!;
      assert.ok(t.reveal.includes(`${Math.round((b - a) * 1000)} ms`), 'the gold ruler reads the trial’s delay');
    }
    assert.match(code('src/features/ear/modules/time.ts'), /let y = mixDelayed\(x, delayMs, 0\.5\);\s*if \(delayMs >= 250\) y = mixDelayed\(y, delayMs \* 2, 0\.15\);/);
    assert.equal((20 * Math.log10(0.5)).toFixed(1), '-6.0');
    assert.match(code('src/features/ear/modules/time.ts'), /const DELAY_CHIPS = \[50, 100, 250, 500\];/);
    assert.match(code('src/features/ear/modules/time.ts'), /near: level <= 2 \?/);
  });

  it('Reverb: the spaces’ tails, the Short / Medium / Long RT60s, the bright/dark decay', () => {
    assert.deepEqual(D.REVERB_RT60, { room: 0.4, chamber: 1.0, hall: 2.2, plate: 1.6, spring: 1.8 });
    assert.ok(GUIDES.reverb.changes[0].includes('Room about 0.4 s, Chamber 1.0 s, Plate 1.6 s, Hall 2.2 s'));
    const T = code('src/features/ear/modules/time.ts');
    assert.match(T, /\{ label: 'Short', rt60: 0\.5,[\s\S]*?\{ label: 'Medium', rt60: 1\.2,[\s\S]*?\{ label: 'Long', rt60: 2\.5,/);
    assert.match(T, /reverb\(padTail\(src, 1\.6\), space\.key, 1\.2, brightIs \? 0\.9 : 0\.12, 0\.55\)/);
    assert.match(T, /const nearKeys: Record<string, string\[\]> = \{ room: \['chamber'\], chamber: \['room'\], hall: \['plate'\], plate: \['hall'\] \};/);
    assert.deepEqual(ans(find('reverb', 3, () => true)), ['Room (emulation)', 'Hall (emulation)', 'Plate (emulation)']);
    assert.equal(ans(find('reverb', 4, () => true)).length, 5);
  });

  it('Compression: the four settings as the truth lines state them', () => {
    const M = code('src/features/ear/modules/dynamics.ts');
    assert.match(M, /Light: 2:1 above −18 dBFS[\s\S]*?compress\(x, 2, -18, 30, 200\)/);
    assert.match(M, /Moderate: 4:1 above −24 dBFS[\s\S]*?compress\(x, 4, -24, 10, 150\)/);
    assert.match(M, /Heavy: 8:1 above −30 dBFS[\s\S]*?compress\(x, 8, -30, 5, 100\)/);
    assert.match(M, /Pumping: 10:1 above −35 dBFS, 1 ms attack, 400 ms release[\s\S]*?compress\(x, 10, -35, 1, 400\)/);
    assert.deepEqual(ans(find('compression', 2, () => true)), ['None', 'Moderate', 'Heavy']);
  });

  it('Pitch: the higher/lower steps, the root range, the interval decks by level', () => {
    const M = code('src/features/ear/modules/pitch.ts');
    assert.match(M, /const HL_STEPS = \[12, 7, 4, 2, 1\];/);
    assert.match(M, /const root = 110 \* Math\.pow\(2, rng\(\) \* 2\);/, '110–440 Hz');
    const deck = (lvl: number) => ans(find('pitch', lvl, (t) => t.question === 'What interval is A up to B?'));
    assert.deepEqual(deck(1), ['Unison', 'Perfect 5th', 'Octave']);
    assert.deepEqual(deck(2), ['Unison', 'Major 3rd', 'Perfect 4th', 'Perfect 5th', 'Octave']);
    assert.deepEqual(deck(3), ['Unison', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th', 'Major 6th', 'Octave']);
    assert.equal(deck(4).length, 13);
  });

  it('Polarity: level 1’s flipped sum is truly silent; the offsets; the partial-cancellation first notch', () => {
    for (let s = 1; s < 6; s++) {
      const t = mod('polarity').makeTrial(1, s);
      const peaks = t.clips.map((c) => Math.max(...Array.from(c.buf as Float32Array, Math.abs)));
      assert.equal(peaks.filter((p) => p === 0).length, 1, 'exactly one clip is digital silence');
      assert.equal(t.question, 'Two mic copies, summed twice. Which sum is fuller?');
    }
    const T = code('src/features/ear/modules/time.ts');
    assert.match(T, /const offsetMs = level === 1 \? 0 : level === 2 \? 0\.2 : 0\.5;\s*const mismatchDb = level >= 3 \? -3 : 0;/);
    assert.match(T, /buf: mk\(false, 1\.2\),/);
    const firstNotch = 1 / (2 * 1.2e-3);
    assert.ok(firstNotch > 380 && firstNotch < 430, `first notch ${firstNotch.toFixed(0)} Hz is "about 400 Hz"`);
  });

  it('Comb: the truth line and the MEASURED dips of a 2.0 ms copy (250, 750, 1250 Hz… 500 Hz apart)', () => {
    const t = mod('comb').makeTrial(1, 3);
    assert.match(t.reveal, /^Delayed copy \d+\.\d ms behind — notches every \d+ Hz \(spacing = 1 ÷ delay\)\.$/);
    assert.equal((1000 / 2.0).toFixed(0), '500');
    // The SAME measurement SEE IT's lower plot draws: Welch power ratio, combed ÷ dry, 0–5 kHz.
    const src = D.pinkNoise(3, D.makeRng(7));
    const of = SM.welchPower(C.present(D.mixDelayed(src, 2.0, 1)), 48, SM.SEE_IT_FFT);
    const ref = SM.welchPower(C.present(src), 48, SM.SEE_IT_FFT);
    const r = SM.powerRatioDb(of.acc, ref.acc, 5000, SM.SEE_IT_FFT);
    const dips: number[] = [];
    for (let i = 1; i < r.db.length - 1; i++) {
      const v = r.db[i];
      if (v == null) { dips.push(r.hz[i]); continue; }
      if (v < (r.db[i - 1] ?? 99) && v < (r.db[i + 1] ?? 99) && v < -10) dips.push(r.hz[i]);
    }
    for (const want of [250, 750, 1250]) assert.ok(dips.some((h) => Math.abs(h - want) < 15), `no measured dip near ${want} Hz (${dips.slice(0, 6).map(Math.round)})`);
    assert.ok(tryOf('comb').includes('“Delayed copy 2.0 ms behind — notches every 500 Hz”'));
    assert.ok(tryOf('comb').includes('250, 750, 1250 Hz… 500 Hz apart'));
    assert.match(code('src/features/ear/modules/time.ts'), /const delayMs = 0\.5 \+ rng\(\) \* 9\.5;/);
    assert.match(code('src/features/ear/modules/time.ts'), /const COMB_GAINS_DB = \[0, -3, -6, -9\];/);
  });

  it('Clipping: the severities, and Severe’s flat ceiling on the WAVEFORM', () => {
    const M = code('src/features/ear/modules/dynamics.ts');
    assert.match(M, /key: 'mild', label: 'Mild', drop: 1,[\s\S]*?key: 'moderate', label: 'Moderate', drop: 4,[\s\S]*?key: 'severe', label: 'Severe', drop: 10,/);
    const t = find('clipping', 3, (x) => right(x) === 'Severe');
    const x = t.clips[0].buf as Float32Array;
    const per = Math.floor(x.length / 200);
    const env: number[] = [];
    for (let c = 0; c < 200; c++) { let m = 0; for (let i = c * per; i < (c + 1) * per; i++) m = Math.max(m, Math.abs(x[i])); env.push(m); }
    const mx = Math.max(...env);
    assert.ok(env.filter((v) => v > mx * 0.98).length >= 20, 'the hits all stop at the same flat height');
    assert.deepEqual(ans(find('clipping', 2, (y) => y.answers.length === 3)), ['Clean', 'Moderate', 'Severe']);
  });
});

describe('4. wiring: the guide key in both headers, a host around each root', () => {
  const MOD = code('src/screens/lab/eartraining/EarModuleScreen.tsx');
  const HOME = code('src/screens/lab/eartraining/EarTrainingLabScreen.tsx');
  it('EarModuleScreen: per-module guide by EarModuleId (what’s-left guide while FINISH is open), host with regions off', () => {
    assert.match(MOD, /import \{ EAR_END_GUIDE, EAR_SCREEN_GUIDES \} from '\.\/earTrainingScreenGuides';/);
    assert.match(MOD, /<LabHeader[\s\S]*?guide=\{ending \? EAR_END_GUIDE : EAR_SCREEN_GUIDES\[mod\.id\]\}/);
    assert.match(MOD, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : mod\.id\}>/);
    assert.match(MOD, /<\/ScrollView>\s*\)\}\s*<\/ScreenGuideHost>\s*<\/View>\s*\);\s*\}/);
  });
  it('EarTrainingLabScreen: the home guide (what’s-left guide when swapped in), host with regions off', () => {
    assert.match(HOME, /import \{ EAR_END_GUIDE, EAR_HOME_GUIDE \} from '\.\/earTrainingScreenGuides';/);
    assert.match(HOME, /<LabHeader[\s\S]*?guide=\{ending \? EAR_END_GUIDE : EAR_HOME_GUIDE\}/);
    assert.match(HOME, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : 'list'\}>/);
    assert.match(HOME, /<\/ScrollView>\s*\)\}\s*<\/ScreenGuideHost>\s*<\/View>\s*\);\s*\}/);
  });
  it('the module screen keeps its accuracy pill (last-20 score) beside the ⓘ', () => {
    assert.match(MOD, /<Text style=\{styles\.statSub\}>last 20<\/Text>/);
  });
});

describe('5. the accuracy chip: a concept lab', () => {
  it('neither header shows AccuracyNote', () => {
    for (const p of ['src/screens/lab/eartraining/EarModuleScreen.tsx', 'src/screens/lab/eartraining/EarTrainingLabScreen.tsx']) {
      assert.doesNotMatch(code(p), /AccuracyNote/, `${p} still renders the chip`);
    }
  });
  it('the reason (vetted 2026-10-31): no live input anywhere in the lab — every clip is rendered by the app or a stored recording', () => {
    const files = [
      ...readdirSync(join(ROOT, 'src/screens/lab/eartraining')).filter((f) => /\.tsx?$/.test(f)).map((f) => `src/screens/lab/eartraining/${f}`),
      ...readdirSync(join(ROOT, 'src/features/ear')).filter((f) => /\.tsx?$/.test(f)).map((f) => `src/features/ear/${f}`),
      ...readdirSync(join(ROOT, 'src/features/ear/modules')).map((f) => `src/features/ear/modules/${f}`),
    ];
    assert.ok(files.length >= 14);
    for (const p of files) {
      assert.doesNotMatch(code(p), /useMicrophone|getUserMedia|AudioRecorder|useAudioRecorder|requestRecordingPermissions|startMic|micInput/, `${p}: live input`);
    }
  });
  it('the playback honesty the chip carried is in the home guide', () => {
    assert.ok(EAR_HOME_GUIDE.teaches.some((l: string) => /phone and headphones color the sound/.test(l)));
  });
});

describe('6. vetted review fixes (2026-10-31): each claim re-proved from the code', () => {
  const MOD = code('src/screens/lab/eartraining/EarModuleScreen.tsx');
  const HOME = code('src/screens/lab/eartraining/EarTrainingLabScreen.tsx');
  // Guided Lessons return (2026-11-08): the header line stays on Frequency Recognition only; whether the
  // other drills get it back is an open owner question (report_G4), so this pins the one that carries it.
  const HEADER = 'Header: “last 20” score and level; above the question, trial number and streak.';
  it('the what’s-left guide card is titled WHAT’S LEFT on both screens (as the sibling labs do)', () => {
    assert.match(MOD, /guide=\{ending \? EAR_END_GUIDE : EAR_SCREEN_GUIDES\[mod\.id\]\}\s*guideTitle=\{ending \? 'WHAT’S LEFT' : undefined\}/);
    assert.match(HOME, /guide=\{ending \? EAR_END_GUIDE : EAR_HOME_GUIDE\}\s*guideTitle=\{ending \? 'WHAT’S LEFT' : undefined\}/);
  });
  it('home: a tried row that does not count yet reads “· tried”; recordings exist in two drills; the ladder counts only since the last level change', () => {
    assert.match(HOME, /\$\{earModuleCredited\(p\) \? '' : ' · tried'\}/);
    assert.ok(EAR_HOME_GUIDE.seeing[1].includes('L2 · 85% · tried'));
    assert.deepEqual(EAR_MODULES.filter((m: { realSources?: boolean }) => m.realSources).map((m: { id: string }) => m.id).sort(), ['band', 'eq']);
    assert.ok(EAR_HOME_GUIDE.seeing[0].includes('Two can use a recorded piano or guitar chord'));
    assert.match(code('src/features/ear/earProgress.ts'), /\.slice\(-sinceChange\)\s*\.filter\(\(t\) => t\.level === p\.level\)\s*\.slice\(-WINDOW\)/);
    assert.ok(EAR_HOME_GUIDE.changes[1].includes('judged only on answers at your current level'));
  });
  it('drill readouts the guides name are on the screen: the “last 20” pill, the level subtitle, the trial/streak line', () => {
    assert.match(MOD, /<Text style=\{styles\.statSub\}>last 20<\/Text>/);
    assert.match(MOD, /subtitle=\{`Level \$\{level\}\/\$\{mod\.levels\}/);
    assert.match(MOD, /Trial \{trialNo\} of \{ROUND\} · Streak \{streak\}\s*<\/Text>\s*<Text style=\{styles\.question\}>/, 'the trial/streak line sits above the question');
    const withHeader = Object.entries(GUIDES).filter(([, gd]) => gd.seeing.includes(HEADER)).map(([id]) => id);
    assert.ok(withHeader.includes('frequency'), `header readouts named in ${withHeader.join(', ') || 'no drill'}`);
  });
  it('Frequency: only “Which frequency is this tone?” has the chip deck; higher-or-lower draws no green band', () => {
    const hl = find('frequency', 1, (t) => t.question === 'Which tone is higher?') as Trial & { seeIt: { highlightHz?: number; clips?: number[] } };
    assert.deepEqual(ans(hl), ['A is higher', 'B is higher']);
    assert.equal(hl.seeIt.highlightHz, undefined);
    const ft = find('frequency', 1, (t) => /^Which clip is /.test(t.question)) as Trial & { seeIt: { highlightHz?: number; clips?: number[] } };
    assert.deepEqual(ans(ft), ['Clip A', 'Clip B', 'Clip C']);
    assert.equal(ft.seeIt.clips?.length, 3);
    assert.ok(GUIDES.frequency.changes[0].includes('one peak per clip. After you answer, a green band marks the tone (none on higher-or-lower)'));
  });
  it('Noise: SEE IT is a log axis and square/triangle carry odd harmonics only — the tip says “crowding”, never “evenly spaced”', () => {
    assert.match(code('src/screens/lab/eartraining/SeeItView.tsx'), /Math\.log\(clampHz\(hz\) \/ F_LO\) \/ Math\.log\(F_HI \/ F_LO\)/);
    assert.match(code('src/features/ear/earDsp.ts'), /if \(kind === 'square'\) return k % 2 === 1 \? 1 \/ k : 0;/);
    assert.doesNotMatch(tryOf('noise'), /evenly spaced/);
    assert.ok(tryOf('noise').includes('crowding together to the right — full for the sawtooth, every other one for square and triangle'));
  });
  it('Defects: ground loop draws a SPECTRUM; level 4 deepens only the faults mixed on top', () => {
    const D5 = code('src/features/ear/modules/defects.ts');
    assert.match(D5, /const tonal = \['hum', 'ground', 'buzz', 'hiss', 'rf', 'distortion', 'clipping'\]\.includes\(d\.key\);/);
    assert.ok(GUIDES.defect.seeing.join(' ').includes('SPECTRUM for hum, ground loop, buzz'));
    assert.match(D5, /onBed: \(b, rng\) => clip\(normalizePeak\(b\), 'soft'/, 'distortion ignores the mix level');
    assert.match(D5, /level === 3 \? -20 : -32/);
    assert.ok(GUIDES.defect.changes[0].includes('level 4 mixes the faults that sit on top'));
    assert.ok(tryOf('defect').includes('peaks at the far left, the low end'));
  });
  it('Loudness is not the only unmatched drill: Polarity level 1 shares one gain too', () => {
    assert.match(code('src/features/ear/modules/time.ts'), /const gain = -20 - rmsDb\(sumIn\);\s*a = fadeEdges\(gainDb\(sumIn, gain\)\);\s*b = fadeEdges\(gainDb\(sumOut, gain\)\);/, 'Polarity L1: one shared gain, no re-match');
    assert.ok(GUIDES.loudness.changes[0].startsWith('Unlike most drills'));
    assert.ok(GUIDES.polarity.changes[0].includes('that clip’s level isn’t matched'));
  });
  it('EQ: clips are RMS-matched (present → normalizeRms), so the guide says “matched in level”, not “never louder”', () => {
    // D41 #26 added an opt-in peak ceiling; with none (every EQ clip), present() is still pure RMS matching.
    assert.match(code('src/features/ear/modules/common.ts'), /const out = fadeEdges\(normalizeRms\(x, targetDb\), fadeMs\);\n  if \(peakCeiling === undefined\) return out;/);
    assert.doesNotMatch(code('src/features/ear/modules/tone.ts'), /present\([^)]*PEAK_CEILING/);
    assert.doesNotMatch(textOf(GUIDES.eq), /never simply louder/);
  });
  it('Reverb: the Reverb lab’s controls are RT60, pre-delay, HF damping and mix — no size', () => {
    const fx = code('src/screens/lab/fxLabConfigs.tsx');
    for (const l of ['RT60 (DECAY TIME)', 'PRE-DELAY', 'HF DAMPING', "label: 'MIX'"]) assert.ok(fx.includes(l), l);
    assert.ok(GUIDES.reverb.teaches.join(' ').includes('you set RT60, pre-delay, damping and mix'));
    assert.doesNotMatch(textOf(GUIDES.reverb), /\bsize\b/);
  });
  it('Pitch: notes stop at 16 harmonics, so only B’s peaks up to A’s highest line up', () => {
    assert.match(code('src/features/ear/earDsp.ts'), /const maxK = Math\.min\(16, Math\.floor\(SR \/ 2 \/ f0\)\);/);
    assert.ok(tryOf('pitch').includes('up to A’s highest peak, each peak of B lands on every second peak of A'));
  });
  it('Stereo: “single” centered source; the Wide cloud matches the screen caption', () => {
    const SP6 = code('src/features/ear/modules/spatial.ts');
    assert.ok(SP6.includes('a single centered source IS mono'));
    assert.ok(SP6.includes('Cloud = wide'));
    assert.ok(GUIDES.stereo.teaches.join(' ').includes('A single centered source is mono'));
    assert.ok(GUIDES.stereo.changes[1].includes('turned up (a cloud)'));
  });
  it('Polarity L1: the flipped sum is exact silence, so the SEE IT caption names it instead of promising a hole', () => {
    const M12 = earModuleById('polarity');
    for (let seed = 1; seed <= 12; seed++) {
      const t = M12.makeTrial(1, seed);
      const silent = t.clips.findIndex((c: { buf: Float32Array }) => c.buf.every((v) => v === 0));
      assert.ok(silent === 0 || silent === 1, `seed ${seed}: one clip is all zeros`);
      const label = t.clips[silent].label;
      assert.ok(t.seeIt.caption.startsWith(`Clip ${label} cancelled to total silence`), t.seeIt.caption);
      assert.doesNotMatch(t.seeIt.caption, /unmistakable/);
    }
    // Levels 2–3 keep the hole caption (partial cancellation is real there).
    for (let seed = 1; seed <= 40; seed++) {
      const t = M12.makeTrial(2, seed);
      if (t.seeIt?.kind === 'spectrum' && t.clips.length === 2) {
        assert.match(t.seeIt.caption, /low-frequency hole is unmistakable/);
        break;
      }
    }
  });
});
