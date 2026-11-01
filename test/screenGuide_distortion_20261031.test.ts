/**
 * Screen Guide rollout — Distortion Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (Wave pilot) and
 * test/screenGuide_chain_20261031.test.ts (the LabShell lab).
 *
 *   1. every screen the learner reaches in this LabShell lab has a guide —
 *      EXPLORE (the rack), LEARN (the reading page) and CHECK (the
 *      understanding check) — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the lab's source (distConfig, FxLabScreen, the flow
 *      display, LabShell, the rack, the lesson, the check);
 *   4. the numbers follow from the lab's own math — the −20 dBFS source, the
 *      DRIVE in dB, the shaper formulas (fxViz distShape = Effects.hpp shape),
 *      the DC block and the MIX blend — re-run here;
 *   5. the chip decision is pinned: a CONCEPT lab, `accuracy` false, because
 *      both displays are badged as drawn from the model, not measured.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { DISTORTION_SCREEN_GUIDES, distortionScreenGuide, DISTORTION_ACCURACY_CHIP } = await import('../src/screens/lab/distortionScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = DISTORTION_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CONFIGS = code('src/screens/lab/fxLabConfigs.tsx');
/** The Distortion lab's own config block (from its header to the next lab). */
const DIST = CONFIGS.slice(CONFIGS.indexOf('const distConfig: FxLabConfig'), CONFIGS.indexOf('export const DistortionLabScreen'));
const FXSCREEN = code('src/screens/lab/FxLabScreen.tsx');
const ANIM = code('src/screens/lab/fxAnim.tsx');
const VIZ = code('src/features/lab/fxViz.tsx');
const SHELL = code('src/screens/lab/LabShell.tsx');
const RACK = [code('src/screens/lab/rack/RackUnit.tsx'), code('src/screens/lab/rack/BezelReadouts.tsx')].join('\n');
const LESSON = code('src/features/lab/guidedLessons/content.ts');
const LESSON_DIST = LESSON.slice(LESSON.indexOf('  distortion: {'), LESSON.indexOf('  noise: {'));
const CHECKS = code('src/features/lab/understandingChecks.ts');
const CHECK_DIST = CHECKS.slice(CHECKS.indexOf('const DISTORTION: readonly Q[]'), CHECKS.indexOf('const PHASE: readonly Q[]'));
const UNDERSTAND = code('src/components/LabUnderstandingCheck.tsx');
const SHEET = code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx');
const BITS = code('src/screens/lab/foundations/bits.tsx');

describe('1. every Distortion screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has an understanding check)', () => {
    assert.deepEqual(Object.keys(DISTORTION_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(CHECKS, /^\s*distortion: DISTORTION,$/m, 'the Distortion check is registered — LabShell shows a CHECK tab');
    assert.match(SHELL, /hasUnderstandingCheck\(labId\) \? \[\.\.\.BASE_MODES, \{ key: 'check' as const, label: 'CHECK' \}\] : BASE_MODES/);
    for (const m of ['explore', 'learn', 'check']) assert.equal(distortionScreenGuide(m), GUIDES[m]);
    assert.equal(distortionScreenGuide('other'), undefined);
    // The lab is one FxLabScreen config with labId 'distortion'.
    assert.match(DIST, /labId: 'distortion',/);
  });
  it('the CHECK guide matches the check: four questions, on harmonics, odd harmonics, aliasing and MIX', () => {
    assert.equal((CHECK_DIST.match(/^\s{4}id: '/gm) ?? []).length, 4);
    for (const id of ['what-is-added', 'symmetric-odd', 'oversampling', 'parallel']) assert.match(CHECK_DIST, new RegExp(`id: '${id}'`));
    assert.match(DISTORTION_SCREEN_GUIDES.check.seeing.join(' '), /four questions/);
  });
  it('the EXPLORE guide names the two CHECK YOURSELF cards in LAB NOTES', () => {
    assert.equal((DIST.match(/^\s{6}question: '/gm) ?? []).length, 2);
    assert.match(FXSCREEN, /config\.checks\.map\(\(c, i\) => \(\s*<CheckQuestion/);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS is 2–3`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
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
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*4\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Marshall|Fender|Vox|Mesa|Boss|Ibanez|Tube Screamer|Big Muff|ProCo|RAT|Klon|Soundtoys|Decapitator|Waves|UAD|Neve|SSL|Fairchild|1176|LA-2A)\b/, `${id}: a gear maker/model name`);
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
  // [token in the screen source, that source, the words the guide uses (default: the token)]
  const NAMES: Record<string, [string, string, string?][]> = {
    explore: [
      // the flow display (fxAnim DistFlow + FlowScene)
      ['IN ▸', ANIM], ['▸ OUT', ANIM], ['IN = −20 dBFS sine', ANIM], ['DRIVEN (before clip)', ANIM], ['0 dBFS', ANIM],
      // the stage name, the readouts, the dock keys and their choices
      ["case 'distortion': return 'DRIVE';", ANIM, 'green DRIVE stage'], ["k: 'TYPE'", DIST, 'TYPE'], ["k: 'DRIVE'", DIST, 'DRIVE'], ["k: 'MIX'", DIST, 'MIX'],
      ['HARD CLIP', DIST], ['SOFT (TANH)', DIST], ['TUBE (ASYM)', DIST], ["short: 'OS'", DIST, 'OS key'], ['ON (CLEAN)', DIST], ['OFF (ALIASING)', DIST],
      ["label: '100%'", DIST, '100%'], ['50% PARALLEL', DIST], ["label: 'SOURCE'", FXSCREEN, 'SOURCE key'], ['PINK NOISE', CONFIGS], ['SINE ${hz} Hz', CONFIGS, 'SINE 220 Hz'],
      // the fader range and the caption's −8 dBFS
      ['min: 6, max: 36', DIST, '+6 to +36 dB'], ['lifts the −20 dBFS sine to', DIST, '−8 dBFS'],
      // the well and the rack's own controls
      ['DESIGNED RESPONSE', FXSCREEN], ['dBFS · uncalibrated', FXSCREEN, '−20 dBFS, uncalibrated'], ['LAB NOTES', SHELL], ['CHECK YOURSELF', BITS],
      ['HIDE DISPLAY', RACK], ['FULL SCREEN', RACK], ['ⓘ', RACK], ["'■'", SHELL, '■'], ["'▶'", SHELL, '▶'],
    ],
    learn: [
      ['LEARN', SHELL], ['EXPLORE', SHELL], ['CHECK', SHELL], ['CONTROLS', SHEET], ['COMMON MISTAKES', SHEET], ['PRO TIPS', SHEET], ['FORMULA / CONCEPT', SHEET],
      ['GUIDED LESSON', SHELL], ['LAB NOTES', SHELL],
      ["'What the display shows'", LESSON_DIST, 'What the display shows'], ["'Type (clip shape)'", LESSON_DIST, 'Type (clip shape)'], ["name: 'Drive'", LESSON_DIST, 'Drive'],
      ["'Oversampling'", LESSON_DIST, 'Oversampling'], ["name: 'Mix'", LESSON_DIST, 'Mix'], ["'+6 … +36 dB'", LESSON_DIST, '+6 … +36 dB'],
      ['THD', LESSON_DIST], ['DC offset', LESSON_DIST], ['level-match', LESSON_DIST, 'match levels'], ['Bitcrush', LESSON_DIST + DIST],
      ['HARD CLIP', DIST], ['TUBE (ASYM)', DIST], ["k: 'DRIVE'", DIST, 'DRIVE'],
    ],
    check: [
      ['CHECK YOUR UNDERSTANDING', UNDERSTAND], ['CORRECT', UNDERSTAND], ['NOT QUITE — TRY ANOTHER', UNDERSTAND], ['no score', UNDERSTAND], ['✓', UNDERSTAND],
      ['this lab is complete', UNDERSTAND, 'the lab is complete'], ['certificate and program', UNDERSTAND],
      ['HARD CLIP', DIST], ['TUBE (ASYM)', DIST], ['50% PARALLEL', DIST],
    ],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(DISTORTION_SCREEN_GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const [n, src, w = n] of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(w), `${id}: the guide never names "${w}"`);
      }
    });
  }
  it('the sources, keys and readouts are exactly the ones the guide lists', () => {
    assert.match(DIST, /sources: \[srcSine\(220\), SRC_PINK\],/);
    assert.deepEqual([...DIST.matchAll(/^\s{6}label: '([^']+)', (?:short: '[^']+', )?paramId:/gm)].map((m) => m[1]), ['DRIVE', 'TYPE', 'OVERSAMPLING', 'MIX']);
    assert.deepEqual([...DIST.matchAll(/\{ k: '([A-Z ]+)', paramId:/g)].map((m) => m[1]), ['TYPE', 'DRIVE', 'MIX']);
    // the SOURCE key is the last dock key on every FX lab
    assert.match(FXSCREEN, /id: 'src',\s*label: 'SOURCE',/);
    // the flow display always draws a sine; the source only switches its IN
    // note (2026-10-31: the note had said "−20 dBFS sine" with PINK playing)
    assert.match(DIST, /anim: \(v, src\) => \(\{\s*kind: 'distortion',[\s\S]*?srcIsNoise: isNoiseSrc\(src\),\s*\}\),/);
    assert.match(CONFIGS, /function isNoiseSrc\(src\?: FxSourceSpec\): boolean \{\s*const m = src\?\.gen\?\.mode;\s*return m === GEN_MODES\.pink \|\| m === GEN_MODES\.white;/);
    const distFlow = ANIM.slice(ANIM.indexOf('function DistFlow'), ANIM.indexOf('const STEREO_A'));
    assert.doesNotMatch(distFlow, /\bsrc\b/);
    assert.match(distFlow, /note=\{srcIsNoise \? 'NOISE · SINE DRAWN' : 'IN = −20 dBFS sine'\}/);
    // the noise note must clear the legend: no longer than the sine note
    assert.ok('NOISE · SINE DRAWN'.length <= 'IN = −20 dBFS sine'.length);
    assert.match(ANIM, /srcIsNoise=\{model\.srcIsNoise\} \/>;/);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.seeing.join(' '), /With PINK NOISE: “NOISE · SINE DRAWN”./);
    // OVERSAMPLING reaches neither drawing — the guide says it changes the sound only
    assert.doesNotMatch(DIST.slice(DIST.indexOf('Hero:'), DIST.indexOf('heroBadge')), /oversample/);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.changes.join(' '), /OS changes the sound only/);
  });
  it('the OS copy promises only what a 220 Hz sine can show (verified 2026-10-31: aliasing is faint, HARD CLIP only; no FFT, no high sine)', () => {
    // 24000 / 220 = 109.1 and 22050 / 220 = 100.2: the first folded harmonic is past the 100th
    assert.ok(24000 / 220 > 100 && 22050 / 220 > 100 && 22050 / 220 < 101);
    assert.doesNotMatch(DIST, /HEAR ALIASING/);
    assert.doesNotMatch(LESSON_DIST, /read the FFT|Push a high sine|lets you HEAR|so you can hear the aliasing/);
    assert.match(LESSON_DIST, /only matters on HARD CLIP/);
    assert.doesNotMatch(CHECK_DIST, /What do you hear when OVERSAMPLING/);
    // SOFT / TUBE are smooth (tanh): their harmonic at n = 101 is negligible
    const N = 4096, g = 0.1 * 10 ** (36 / 20);
    const amp = (f: (x: number) => number, n: number) => {
      let re = 0, im = 0;
      for (let i = 0; i < N; i++) { const y = f(g * Math.sin((2 * Math.PI * i) / N)), a = (2 * Math.PI * n * i) / N; re += y * Math.cos(a); im += y * Math.sin(a); }
      return (2 * Math.hypot(re, im)) / N;
    };
    assert.ok(amp(Math.tanh, 101) < 1e-9, 'SOFT makes no harmonic near Nyquist');
    assert.ok(amp((x) => Math.max(-1, Math.min(1, x)), 101) > 1e-5, 'HARD CLIP does');
  });
});

describe('4. the numbers follow from the lab’s own math', () => {
  // fxViz distShape — the JS mirror of Effects.hpp shape() (pinned below).
  const shape = (x: number, t: 'hard' | 'soft' | 'tube') => (t === 'hard' ? Math.max(-1, Math.min(1, x)) : t === 'soft' ? Math.tanh(x) : Math.tanh(x + 0.4) - Math.tanh(0.4));
  /** One DC-blocked output cycle at this DRIVE (input −20 dBFS sine). */
  const cycle = (t: 'hard' | 'soft' | 'tube', driveDb: number, mix = 1, n = 4000) => {
    const g = 0.1 * 10 ** (driveDb / 20);
    const o = Array.from({ length: n }, (_, i) => shape(g * Math.sin((2 * Math.PI * i) / n), t));
    const mean = o.reduce((a, b) => a + b, 0) / n;
    return o.map((y, i) => mix * (y - mean) + (1 - mix) * 0.1 * Math.sin((2 * Math.PI * i) / n));
  };
  it('the inputs: −20 dBFS source, DRIVE in dB on +6…+36 (default +24), the shaper formulas, DC block, MIX blend', () => {
    assert.match(CONFIGS, /const SOURCE_PEAK_DB = -20;/);
    assert.match(FXSCREEN, /const GEN_LEVEL_DB = -20;/);
    assert.match(DIST, /initial: 24,/);
    assert.match(VIZ, /case 'hard': return x > 1 \? 1 : x < -1 \? -1 : x;/);
    assert.match(VIZ, /case 'soft': return Math\.tanh\(x\);/);
    assert.match(VIZ, /case 'tube': return Math\.tanh\(x \+ 0\.4\) - Math\.tanh\(0\.4\);/);
    const fx = code('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(fx, /case Hard: return x > 1\.0 \? 1\.0 : \(x < -1\.0 \? -1\.0 : x\);/);
    assert.match(fx, /case Soft: return std::tanh\(x\);/);
    assert.match(fx, /case Tube: return std::tanh\(x \+ 0\.4\) - 0\.37994896225522488;/);
    assert.match(fx, /L\[i\] = static_cast<float>\(\(inL \* \(1\.0 - mix\) \+ hl \* mix\) \* trim\);/);
    // the drawings subtract the cycle mean (the DSP's DC blocker) and blend with the dry
    assert.match(ANIM, /return out\.map\(\(y\) => y - mean\);/);
    assert.match(VIZ, /const blended = mixV \* \(outs\[i\] - mean\) \+ \(1 - mixV\) \* xin;/);
  });
  it('EXPLORE TRY THIS 1: +12 dB peaks at −8 dBFS (caption, no clipping); +36 dB sits on the ceiling for most of each cycle', () => {
    assert.equal(-20 + 12, -8);
    const c12 = cycle('hard', 12);
    assert.ok(Math.max(...c12) < 1, 'no clipping at +12 dB');
    // the caption the screen prints for HARD CLIP under 0 dBFS
    // 2026-10-31 (two verifiers): at exactly +20 dB the peak is 0.1·10 = 1.0
    // and the hard clipper (x > 1) cuts nothing, so 0 dBFS takes the
    // "nothing to cut yet" caption ("right at" the ceiling), not "clip".
    assert.match(DIST, /if \(v\[P\.distType\] === 0 && peak <= 0\)/);
    assert.match(DIST, /lifts the −20 dBFS sine to \$\{Math\.round\(peak\)\} dBFS — \$\{peak < 0 \? 'still under' : 'right at'\} the 0 dBFS ceiling/);
    const g20 = 0.1 * 10 ** (20 / 20);
    assert.ok(Math.abs(g20 - 1) < 1e-12 && shape(g20, 'hard') === g20, 'nothing clipped at +20 dB');
    const c36 = cycle('hard', 36);
    const flat = c36.filter((y) => Math.abs(y) >= 0.99999).length / c36.length;
    assert.ok(flat > 0.85 && flat < 0.95, `flat share at +36 dB: ${flat.toFixed(3)}`);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.tryThis[0], /−8 dBFS/);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.tryThis[0], /flat on the ceiling for most of each cycle/);
  });
  it('EXPLORE TRY THIS 2: TUBE (ASYM) at +24 dB — the top flattens lower than the bottom', () => {
    const c = cycle('tube', 24);
    const top = Math.max(...c), bot = -Math.min(...c);
    assert.ok(top < bot - 0.15, `top ${top.toFixed(3)} vs bottom ${bot.toFixed(3)}`);
    assert.ok(Math.abs(top - 0.78) < 0.01 && Math.abs(bot - 1.01) < 0.01);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.tryThis[1], /top flattens lower than the bottom/);
    // verified review 2026-10-31: the DC-blocked TUBE bottom passes full scale (−1.01 at +24,
    // worst ≈ −1.08 at +30) while HARD and SOFT never do — so the guide must not call the
    // dashed lines a ceiling for every TYPE.
    assert.ok(bot > 1 && Math.min(...cycle('tube', 30)) < -1.07);
    for (const d of [24, 30, 36]) {
      assert.ok(Math.max(...cycle('hard', d).map(Math.abs)) <= 1 + 1e-12);
      assert.ok(Math.max(...cycle('soft', d).map(Math.abs)) <= 1 + 1e-12);
    }
    assert.match(DISTORTION_SCREEN_GUIDES.explore.tryThis[1], /bottom, which edges just past 0 dBFS/);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.seeing[1], /0 dBFS, where HARD and SOFT stop/);
    assert.doesNotMatch(DISTORTION_SCREEN_GUIDES.explore.seeing.join(' '), /the ceiling/);
  });
  it('EXPLORE TRY THIS 3: HARD CLIP +24 dB at 50% PARALLEL peaks near 0.55 — about half the 0 dBFS height', () => {
    assert.equal(Math.max(...cycle('hard', 24)), 1);
    const p = Math.max(...cycle('hard', 24, 0.5));
    assert.ok(Math.abs(p - 0.55) < 0.005, `peak ${p.toFixed(3)}`);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.tryThis[2], /about half the height of the 0 dBFS lines/);
  });
  /** DFT magnitude of harmonic k over one cycle. */
  const harm = (y: number[], k: number) => {
    let re = 0, im = 0;
    for (let i = 0; i < y.length; i++) { re += y[i] * Math.cos((2 * Math.PI * k * i) / y.length); im += y[i] * Math.sin((2 * Math.PI * k * i) / y.length); }
    return (2 * Math.hypot(re, im)) / y.length;
  };
  const thd = (y: number[]) => Math.sqrt(Array.from({ length: 58 }, (_, i) => harm(y, i + 2) ** 2).reduce((a, b) => a + b, 0)) / harm(y, 1);
  it('EXPLORE TRY THIS 3 / CHECK (review 2026-10-31): 50% PARALLEL is ~5 dB quieter but nearly as gritty — no clean tone to hear', () => {
    const full = cycle('hard', 24), half = cycle('hard', 24, 0.5);
    const dropDb = 20 * Math.log10(harm(half, 1) / harm(full, 1));
    assert.ok(Math.abs(dropDb + 5.3) < 0.1, `level drop ${dropDb.toFixed(2)} dB`);
    assert.ok(Math.abs(thd(full) - 0.171) < 0.003 && Math.abs(thd(half) - 0.157) < 0.003, `THD ${thd(full).toFixed(3)} → ${thd(half).toFixed(3)}`);
    // the dry is the UN-driven −20 dBFS input (Effects.hpp: inL * (1 - mix)): under 8 % of the output fundamental
    assert.ok(0.05 / harm(half, 1) < 0.08);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.tryThis[2], /About 5 dB quieter, yet nearly as gritty/);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.changes.join(' '), /at \+24 dB it sits 20 dB under the driven one: grit stays/);
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /clean tone|half clean/i, `${id}: promises a clean tone the lab cannot play`);
    // 2026-10-31 (two verifiers): the lab's own copy no longer promises the clean body at 50% —
    // the check, the lesson's Mix entry and the CHECK guide all state the ~20 dB gap at +24 dB.
    assert.doesNotMatch(CHECK_DIST + LESSON, /without losing the dry body|keeps clarity while adding grit/);
    assert.match(CHECK_DIST, /about 20 dB under the clipped one at DRIVE \+24 dB, so 50% PARALLEL sounds about 5 dB quieter/);
    assert.match(LESSON, /In this lab the dry is about 20 dB below the clipped signal at \+24 dB/);
    assert.doesNotMatch(textOf(DISTORTION_SCREEN_GUIDES.check), /keeps the clean body/);
    // the OUT wave's crisp stroke is the level gradient (red at ±full scale), not amber
    assert.match(ANIM, /<FlowGlow path=\{outPath\} width=\{2\} gradH=\{h\} gradY=\{\[h \/ 2 - A, h \/ 2 \+ A\]\} \/>/);
    assert.match(ANIM, /<Path path=\{path\} color=\{gradH != null \? undefined : color\}/);
    assert.doesNotMatch(DISTORTION_SCREEN_GUIDES.explore.seeing.join(' ') + DISTORTION_SCREEN_GUIDES.explore.tryThis.join(' '), /amber/i);
  });
  it('EXPLORE changes (review 2026-10-31): "just gain" holds only on HARD CLIP — SOFT and TUBE already bend at +12 dB', () => {
    assert.ok(thd(cycle('hard', 12)) < 1e-6, 'HARD +12: a pure sine');
    assert.ok(thd(cycle('soft', 12)) > 0.01, 'SOFT +12: already bent');
    assert.ok(thd(cycle('tube', 12)) > 0.05, 'TUBE +12: clearly bent');
    assert.ok(Math.max(...cycle('soft', 20)) < 0.8, 'SOFT +20: bending without reaching 0 dBFS');
    assert.match(DISTORTION_SCREEN_GUIDES.explore.changes[0], /^On HARD CLIP, DRIVE \+12 dB/);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.changes[0], /SOFT and TUBE bend gently long before that/);
  });
  it('the readouts ⓘ opens the lesson display entry (the moving display first, then the LAB NOTES waveshape); SOURCE notes open on a long-press', () => {
    assert.match(FXSCREEN, /onGuide: \(\) => openLesson\('display'\)/);
    // Fix 2026-10-31 (two verifiers): the ⓘ sits beside the animated DistFlow, so the entry
    // leads with it and names its on-screen labels; the still drawing is one closing line.
    const entry = LESSON_DIST.match(/key: 'display', name: 'What the display shows', definition: "([^"]*)"/)![1];
    assert.match(entry, /^The moving display is the signal path: a sine enters at IN ▸ \(“IN = −20 dBFS sine”\), passes the green DRIVE stage and leaves at ▸ OUT\./);
    for (const name of ['IN ▸', '▸ OUT', "'IN = −20 dBFS sine'", "label: 'DRIVEN (before clip)'", "label: '0 dBFS'", "case 'distortion': return 'DRIVE';"]) assert.ok(ANIM.includes(name), `fxAnim: ${name}`);
    assert.match(entry, /DRIVEN \(before clip\)/);
    assert.match(entry, /LAB NOTES, under DESIGNED RESPONSE, draws one still cycle of the same waves; where the moving display cannot run, that still drawing takes its place\.$/);
    assert.doesNotMatch(entry, /curve|amber/i, 'not a transfer curve; the OUT wave is the level gradient, not amber');
    assert.match(DISTORTION_SCREEN_GUIDES.explore.control.join(' '), /opens the lesson’s display entry: this moving display, then the drawing in LAB NOTES/);
    assert.match(DISTORTION_SCREEN_GUIDES.learn.changes.join(' '), /The display entry covers the moving display, then the still drawing in LAB NOTES./);
    assert.match(FXSCREEN, /onLongPress: \(\) => openSourceHelp\(s\.gen\)/);
    assert.match(DISTORTION_SCREEN_GUIDES.learn.control.join(' '), /long-press a SOURCE choice/);
    assert.doesNotMatch(textOf(GUIDES.check), /points back to something the EXPLORE/);
  });
  it('symmetric shapes make only odd harmonics; TUBE adds even ones (660/1100 Hz vs 440/880 Hz from 220 Hz)', () => {
    const mag = (y: number[], k: number) => {
      let re = 0, im = 0;
      for (let i = 0; i < y.length; i++) { re += y[i] * Math.cos((2 * Math.PI * k * i) / y.length); im += y[i] * Math.sin((2 * Math.PI * k * i) / y.length); }
      return (2 * Math.hypot(re, im)) / y.length;
    };
    for (const t of ['hard', 'soft'] as const) {
      const y = cycle(t, 24);
      assert.ok(mag(y, 2) < 1e-9 && mag(y, 4) < 1e-9, `${t}: no even harmonics`);
      assert.ok(mag(y, 3) > 0.01, `${t}: a 3rd harmonic`);
    }
    const tube = cycle('tube', 24);
    assert.ok(mag(tube, 2) > 0.05 && mag(tube, 4) > 0.005, 'tube: even harmonics');
    assert.match(DISTORTION_SCREEN_GUIDES.explore.changes.join(' '), /660, 1100 Hz… from 220 Hz/);
    assert.match(DISTORTION_SCREEN_GUIDES.explore.changes.join(' '), /even ones \(440, 880 Hz…\)/);
  });
  it('LEARN TRY THIS 2: +12 dB clean at −8 dBFS, +24 dB clipped', () => {
    assert.ok(Math.max(...cycle('hard', 12)) < 1);
    assert.equal(Math.max(...cycle('hard', 24)), 1);
    assert.match(DISTORTION_SCREEN_GUIDES.learn.tryThis[1], /\+12 dB \(clean, −8 dBFS\), then \+24 dB/);
  });
});

describe('5. the chip decision: a concept lab', () => {
  it('accuracy chip OFF — both displays are badged as drawn from the model, not measured', () => {
    assert.equal(DISTORTION_ACCURACY_CHIP, false);
    assert.match(FXSCREEN, /const ANIM_BADGE = 'TEACHING MODEL · DRAWN FROM THE SAME MATH AS THE AUDIO · NOT A MEASUREMENT';/);
    assert.match(DIST, /heroBadge: 'WAVESHAPE — TRUE LEVEL:/);
    // no live readout on this lab (the measured GR cell is dynamics-only)
    assert.doesNotMatch(DIST, /pollGr/);
  });
});
