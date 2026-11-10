/**
 * Screen Guide rollout — Phaser Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (Wave pilot) and
 * test/screenGuide_chain_20261031.test.ts (the other LabShell lab).
 *
 *   1. every screen the learner reaches has a guide — the three LabShell tabs
 *      (LEARN, EXPLORE, CHECK); all five sections, the copy rules, 2–3 TRY
 *      THIS experiments;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names, each pinned in both the guide
 *      and the lab source (fxLabConfigs / FxLabScreen / fxAnim / the shell);
 *   4. the TRY THIS numbers follow from the config and the scope's own maths;
 *   5. the accuracy-chip ruling (a concept lab: teaching model, uncalibrated,
 *      no measured readout → no chip) and the wiring. The wiring needs the
 *      SHARED FxLabScreen / fxLabConfigs files (all twelve effect labs), so
 *      it was not done by this rollout: that test is TODO until it lands, and
 *      enforced from then on.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { PHASER_SCREEN_GUIDES, phaserScreenGuide } = await import('../src/screens/lab/phaserScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = PHASER_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CONFIGS = code('src/screens/lab/fxLabConfigs.tsx');
/** This lab's config block only. */
const CFG = CONFIGS.slice(CONFIGS.indexOf('const phaserConfig: FxLabConfig'), CONFIGS.indexOf('export const PhaserLabScreen'));
const FX_SCREEN = 'src/screens/lab/FxLabScreen.tsx';
const ANIM = code('src/screens/lab/fxAnim.tsx');
const SRC = [
  CFG,
  code(FX_SCREEN),
  ANIM,
  code('src/screens/lab/LabShell.tsx'),
  code('src/screens/lab/rack/RackUnit.tsx'),
  code('src/features/lab/guidedLessons/content.ts'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/features/lab/understandingChecks.ts'),
  code('src/components/LabUnderstandingCheck.tsx'),
].join('\n');

describe('1. every Phaser screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has a CHECK tab)', () => {
    assert.deepEqual(Object.keys(PHASER_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*phaser: PHASER,/m, 'phaser lost its CHECK tab — drop the check guide');
    for (const m of ['explore', 'learn', 'check'] as const) assert.equal(phaserScreenGuide(m), PHASER_SCREEN_GUIDES[m]);
    assert.equal(phaserScreenGuide('other'), undefined);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS is 2–3`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      // the intro card (Guided Lessons return 2026-11-08): learning ≤ 30 words, start ≤ 40
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro, `${id}: no intro`);
      assert.ok(intro.learning.trim().split(/\s+/).length <= 30, `${id}: intro.learning over 30 words`);
      assert.ok(intro.start.trim().split(/\s+/).length <= 40, `${id}: intro.start over 40 words`);
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, no "recommend", no brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Boss|Electro-Harmonix|MXR|Roland|TC Electronic|Eventide|Strymon|Small Clone|CE-1|Dimension D|Lexicon|Waves|UAD)\b/, `${id}: a gear maker/model name`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('low ≤ 410, high ≤ 700, one TRY THIS item ≤ 200', () => {
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
    assert.deepEqual(over, []);
  });
});

describe('3. each guide quotes its screen’s real names', () => {
  const NAMES: Record<string, string[]> = {
    explore: [
      // the two analyzers (fxAnim SpectrumFlow / FlowScene)
      'PHASER', 'IN ▸', '▸ OUT', 'SPECTRUM (dB)', 'PINK NOISE', 'WHITE NOISE', '100', '1k', '10k',
      // bezel + dock + tray choices (config labels / shorts)
      'CENTER', 'STAGES', 'RES', 'RESONANCE', 'SWEEP', 'RATE', 'DEPTH (SWEEP)', 'STATIC', 'SOURCE', '60%',
      // the header transport, the rack's own controls, the well
      '▶', '■', 'HIDE DISPLAY', 'FULL SCREEN', 'LAB NOTES', 'DESIGNED RESPONSE',
    ],
    // 'LEARN' dropped: the 2026-11-08 rewrite names only the tabs to switch TO from this page.
    // Lesson names follow the on-screen labels (decision 1): STAGES / RES / CENTER / RATE, not the old long names.
    learn: ['EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'STAGES', 'CENTER', 'RATE', 'Mix', 'LFO Waveform', 'Stereo spread', 'DEPTH (SWEEP)', 'STATIC', 'SWEEP', 'RES'],
    check: ['CHECK YOUR UNDERSTANDING', 'still to get right', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'Check passed', 'LEARN', 'EXPLORE', 'STAGES', 'RES'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(PHASER_SCREEN_GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the dock is CENTER (fader) · STAGES · SWEEP (RATE + DEPTH) · RES · SOURCE — no MIX key, MIX fixed at 50% — the bezel STAGES · CENTER · RES', () => {
    const labels = [...CFG.matchAll(/label: '([A-Z ()]+)', (?:short: '([A-Z]+)', )?paramId:/g)].map((m) => m[2] ?? m[1]);
    assert.deepEqual(labels, ['CENTER', 'STAGES', 'RATE', 'DEPTH (SWEEP)', 'RES']);
    assert.match(CFG, /id: 'sweep', label: 'SWEEP', paramIds: \[P\.rateHz, P\.depth\]/);
    assert.match(CFG, /\{ paramId: P\.modMix, value: 0\.5 \}/);
    assert.doesNotMatch(CFG, /label: 'MIX'/);
    assert.deepEqual([...CFG.matchAll(/\{ k: '([A-Z]+)', paramId/g)].map((m) => m[1]), ['STAGES', 'CENTER', 'RES']);
    assert.match(CFG, /sources: \[SRC_PINK, SRC_WHITE\]/);
    assert.match(code(FX_SCREEN), /label: 'SOURCE'/);
    assert.match(CFG, /choices: \[2, 4, 6, 8\]\.map\(\(s\) => \(\{ label: `\$\{s\}`, value: s \}\)\)/);
    assert.match(ANIM, /text=\{white \? 'WHITE NOISE' : 'PINK NOISE'\}/);
    assert.match(ANIM, /text="SPECTRUM \(dB\)"/);
    assert.match(ANIM, /case 'phaser': return 'PHASER';/);
    assert.match(ANIM, /mode="phaser"[\s\S]*?mix=\{0\.5\}/);
  });
  it('the LEARN page lists the controls the guide says are not in this dock', () => {
    const c = code('src/features/lab/guidedLessons/content.ts');
    const block = c.slice(c.indexOf('  phaser: {'), c.indexOf('  compression: {'));
    for (const k of ['mix', 'lfo_wave', 'stereo_offset']) assert.match(block, new RegExp(`key: ["']${k}["']`));
    assert.match(block, /fixed at 50% here[\s\S]*?always mixes half and half, near where the dips are deepest\./);
    assert.doesNotMatch(CFG, /lessonKey: '(mix|lfo_wave|stereo_offset)'/, 'one of them is on the dock now — update the LEARN guide');
  });
  it('the CHECK tab has the four questions the guide counts', () => {
    const u = code('src/features/lab/understandingChecks.ts');
    const block = u.slice(u.indexOf('const PHASER: readonly Q[]'), u.indexOf('const DISTORTION: readonly Q[]'));
    assert.equal((block.match(/^\s{4}id: '/gm) ?? []).length, 4);
    const opts = [...block.matchAll(/options: \[([\s\S]*?)\],\n/g)];
    assert.equal(opts.length, 4);
    for (const q of opts) assert.equal((q[1].match(/'[^'\n]+'/g) ?? []).length, 4, 'four answers each');
    assert.match(textOf(GUIDES.check), /four questions, four answers each/);
  });
});

/** The phaser exactly as the config's phaserResDb and the analyzer draw it
 *  (the engine's bilinear all-pass cascade, RES fed back one sample late,
 *  mix 0.5) — as a magnitude in dB. */
function phaserDb(fc: number, stages: number, fb: number, f: number): number {
  const fs = 48000;
  const phi = -2 * stages * Math.atan(Math.tan((Math.PI * Math.min(f, 23000)) / fs) / Math.tan((Math.PI * fc) / fs));
  const wv = (2 * Math.PI * f) / fs;
  const ar = Math.cos(phi), ai = Math.sin(phi);
  const dr = 1 - fb * Math.cos(phi - wv), di = -fb * Math.sin(phi - wv);
  const den = Math.max(dr * dr + di * di, 1e-12);
  const yr = (ar * dr + ai * di) / den, yi = (ai * dr - ar * di) / den;
  const hr = 0.5 + 0.5 * yr, hi = 0.5 * yi;
  return 10 * Math.log10(Math.max(hr * hr + hi * hi, 1e-12));
}
/** The dips OUT draws (local minima below −6 dB, 20 Hz–20 kHz). */
function dips(fc: number, stages: number, fb: number): number[] {
  const out: number[] = [];
  const st = 1.001;
  let p2: number | null = null, p: number | null = null;
  for (let f = 20; f <= 20000; f *= st) {
    const m = phaserDb(fc, stages, fb, f);
    if (p != null && p2 != null && p < p2 && p < m && p < -6) out.push(f / st);
    p2 = p;
    p = m;
  }
  return out;
}
function peak(fc: number, stages: number, fb: number): number {
  let hi = -Infinity;
  for (let f = 20; f <= 20000; f *= 1.001) hi = Math.max(hi, phaserDb(fc, stages, fb, f));
  return hi;
}

describe('4. the TRY THIS numbers follow from the config and the engine', () => {
  it('the law the guide works from is the config’s curve, the analyzer’s and the engine’s', () => {
    assert.match(CONFIGS, /const phi = -2 \* stages \* Math\.atan\(Math\.tan\(\(Math\.PI \* Math\.min\(f, 23000\)\) \/ fs\) \/ Math\.tan\(\(Math\.PI \* fc\) \/ fs\)\);/);
    assert.match(CONFIGS, /const hr = 0\.5 \+ 0\.5 \* yr, hi = 0\.5 \* yi;/);
    const eng = code('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(eng, /const double fc = fx::clampd\(c0 \* std::pow\(2\.0, 2\.0 \* depth \* sweep\), 40\.0, fs_ \* 0\.45\);/);
    assert.match(eng, /double xl = L\[i\] \+ fbL_ \* fb, xr = R\[i\] \+ fbR_ \* fb;/);
    assert.match(CFG, /phaserResDb\(v\[P\.centerHz\] \* Math\.pow\(2, -2 \* v\[P\.depth\]\)/);
  });
  it('CENTER fader: 400–2000 Hz, starts at 1000 Hz', () => {
    assert.match(CFG, /initial: 1000,\s*fader: \{ min: 400, max: 2000, log: true, snap: Math\.round, format: \(v\) => `\$\{Math\.round\(v\)\} Hz` \}/);
    assert.ok(textOf(GUIDES.explore).includes('CENTER fader (400–2000 Hz, starts at 1000 Hz)'));
  });
  it('STAGES 2 · 4 · 6 · 8: the caption says floor(N/2) = 1 · 2 · 3 · 4 notches, and OUT draws exactly that many dips — every CENTER, every sweep corner, every RES', () => {
    assert.match(CFG, /`\$\{v\[P\.stages\]\} stages ≈ \$\{Math\.floor\(v\[P\.stages\] \/ 2\)\} notches, UNEVENLY spaced/);
    for (const n of [2, 4, 6, 8]) {
      // CENTER 400–2000, and the 50% sweep's corners at CENTER 1000 (500, 2000)
      for (const fc of [400, 500, 1000, 1414, 2000]) {
        for (const fb of [0, 0.3, 0.6]) assert.equal(dips(fc, n, fb).length, Math.floor(n / 2), `N ${n} fc ${fc} res ${fb}`);
      }
    }
    assert.ok(textOf(GUIDES.explore).includes('says 1, 2, 3, then 4 notches'));
  });
  it('4 stages, DEPTH STATIC: the two dips sit either side of CENTER at every fader position', () => {
    for (const fc of [400, 632, 1000, 1414, 2000]) {
      for (const fb of [0, 0.3, 0.6]) {
        const d = dips(fc, 4, fb);
        assert.equal(d.length, 2);
        assert.ok(d[0] < fc && d[1] > fc, `fc ${fc} res ${fb}: ${d}`);
      }
    }
    assert.match(CFG, /\{ label: 'STATIC', value: 0 \}/);
  });
  it('RES 0% → 60%: the peaks between the dips go from the dotted line (0 dB) to above it (+4.9 dB)', () => {
    assert.match(CFG, /\{ label: '60%', value: 0\.6 \}/);
    const p0 = peak(1000, 4, 0), p6 = peak(1000, 4, 0.6);
    assert.ok(Math.abs(p0) < 0.05, `res 0 peak ${p0}`);
    assert.ok(Math.abs(p6 - 4.9) < 0.15, `res 60% peak ${p6}`);
    assert.match(ANIM, /const SPEC_PX_PER_DB = 1\.9;/);
    assert.ok(p6 * 1.9 > 8, 'about 9 px over the dotted line');
  });
  it('no guide line claims RES deepens the dips (it makes them shallower)', () => {
    const depth = (fb: number) => Math.min(...dips(1000, 4, fb).map((f) => phaserDb(1000, 4, fb, f)));
    assert.ok(depth(0.6) > depth(0.3) && depth(0.3) > depth(0), 'RES raises the dips');
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /deepen|deeper (dip|notch)/i, id);
  });
});

describe('5. the accuracy-chip ruling and the wiring', () => {
  it('a concept lab: the glass is a teaching model, the audio uncalibrated, nothing measured', () => {
    assert.match(code(FX_SCREEN), /const ANIM_BADGE = 'TEACHING MODEL · DRAWN FROM THE SAME MATH AS THE AUDIO · NOT A MEASUREMENT';/);
    assert.match(code(FX_SCREEN), /dBFS · uncalibrated/);
    assert.doesNotMatch(CFG, /pollGr/, 'a measured readout appeared — re-rule the chip');
  });
  // The shared FxLabScreen change is not this rollout's, and sibling effect
  // labs proposed different field names (screenGuide / accuracyChip, or
  // guide / accuracy) — read them from FxLabScreen, then pin this config.
  const SCREEN_SRC = code(FX_SCREEN);
  const guideKey = SCREEN_SRC.match(/<LabShell[\s\S]*?guide=\{config\.(\w+)\}/)?.[1];
  const accKey = SCREEN_SRC.match(/<LabShell[\s\S]*?accuracy=\{config\.(\w+)/)?.[1];
  const wired = guideKey != null;
  it('wiring: LabShell gets this lab’s per-tab guide, and no AccuracyNote chip', { todo: wired ? false : 'needs the shared FxLabScreen / fxLabConfigs change (see the rollout report)' }, () => {
    if (!wired) return; // TODO until the shared files are wired; enforced from then on
    assert.ok(accKey, 'FxLabScreen forwards a guide but no accuracy flag');
    assert.ok(CFG.includes(`${guideKey}: phaserScreenGuide,`), `config lacks ${guideKey}: phaserScreenGuide`);
    assert.ok(CFG.includes(`${accKey}: false,`), `config lacks ${accKey}: false`);
  });
});

describe('6. guide review fixes (2026-10-31, each re-checked against the code)', () => {
  it('LEARN does not say "nothing plays": the header ▶ shows on every tab and the rack stays mounted', () => {
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{headerAction \? <View style=\{styles\.headerAction\}/);
    assert.doesNotMatch(textOf(GUIDES.learn), /Nothing here plays/);
    assert.ok(GUIDES.learn.seeing[0].includes('▶ in the header still plays or stops the sound'));
  });
  it('MIX 50% is only NEAR the deepest notch once RES is up (true null at m = (1+RES)/(2+RES))', () => {
    // At A = −1 the wet copy is −1/(1+RES): RES 30% → null at 1.3/2.3 ≈ 56% mix; at 50% the dip is ≈ −18.8 dB.
    const at50 = 20 * Math.log10(Math.abs(0.5 - 0.5 / 1.3));
    assert.ok(Math.abs(at50 - -18.8) < 0.1, `${at50}`);
    assert.ok(textOf(GUIDES.learn).includes('near where the notches are deepest'));
  });
  it('the STAGES experiment needs no CENTER 1000 Hz (the dip count holds at every CENTER — section 4)', () => {
    assert.doesNotMatch(GUIDES.explore.tryThis[1], /At CENTER 1000 Hz/);
  });
  it('passing CHECK finishes the Phaser lab only (own tr_ key), not "the Modulation set"', () => {
    const k = code('src/features/lab/trainingLabKeys.ts');
    for (const r of ['Chorus', 'Flanger', 'Phaser']) assert.match(k, new RegExp(`route: '${r}Lab', key: 'tr_${r.toLowerCase()}', completion: 'understanding'`));
    assert.doesNotMatch(textOf(GUIDES.check), /Modulation set/);
    // course order left student text (decision 4, 2026-11-08): the CHECK guide no longer places the lab in a set
    assert.doesNotMatch(textOf(GUIDES.check), /last in Modulation|in the Modulation/);
  });
  // Course-navigation lines left WHAT THIS TEACHES (decision 4, 2026-11-08): no guide names a next lab.
  // (The menu still sorts categories A→Z, D42, so a "next" claim would also be false.)
  it('lab order: no guide suggests or names a next lab (decision 4; the menu sorts A→Z, D42)', () => {
    assert.match(code('src/screens/lab/labCatalog.ts'), /section === 'training' \? \[\.\.\.cats\]\.sort\(\(a, b\) => a\.name\.localeCompare\(b\.name\)\)/);
    for (const id of ['explore', 'learn', 'check']) {
      const t = textOf(GUIDES[id]);
      assert.doesNotMatch(t, /next step|Distortion & Saturation|Saturation (comes|is) next/, id);
    }
  });
  it('CHECK (decision 6, 2026-11-08): no TRY THIS walks to a tested reading (8 stages → 4; RES lifts the peaks)', () => {
    const PH = code('src/features/lab/understandingChecks.ts');
    assert.match(PH, /An 8-stage phaser produces roughly how many notches\?[\s\S]*?correct: '4'/);
    assert.match(PH, /correct: 'Sharpens the peaks between the notches, so the sweep rings'/);
    const t = GUIDES.check.tryThis.join(' ') + ' ' + JSON.stringify((GUIDES.check as unknown as { intro: unknown }).intro);
    assert.doesNotMatch(t, /STAGES to 8|STAGES 8|four|watch what rises|peaks (rise|between)|0% to 60%/);
    assert.match(GUIDES.check.tryThis[0], /set STAGES to 4 and count the dips on OUT/);
    assert.match(CFG, /label: 'RESONANCE', short: 'RES', paramId: P\.modFeedback, lessonKey: 'feedback',/);
    assert.match(GUIDES.check.tryThis[1], /long-press the RES key on EXPLORE to open its lesson entry/);
  });
});
