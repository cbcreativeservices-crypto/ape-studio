/**
 * Screen Guide rollout — Limiter Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (a LabShell lab).
 *
 *   1. a guide for every LabShell tab the lab offers — EXPLORE, LEARN, CHECK —
 *      all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget;
 *   3. the guide quotes the screen's REAL names (fxLabConfigs limiterConfig,
 *      FxLabScreen, fxAnim, fxViz, the lesson, the check);
 *   4. the TRY THIS numbers follow from the engine (Effects.hpp DynamicsEffect
 *      LimiterMode, attack forced to 0.1 ms) on the lab's SINE 440 Hz and
 *      CLICK 120 — re-run sample by sample, both routes;
 *   5. wiring (TODO until the shared FxLabScreen pass-through lands) + chip.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { LIMITER_SCREEN_GUIDES, limiterScreenGuide } = await import('../src/screens/lab/limiterScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = LIMITER_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CFG = code('src/screens/lab/fxLabConfigs.tsx');
const LIM = CFG.slice(CFG.indexOf('const limiterConfig'), CFG.indexOf('export const LimiterLabScreen'));
assert.match(CFG, /const srcSine = \(hz: number\) => \(\{ label: `SINE \$\{hz\} Hz`/);
assert.match(CFG, /const srcClick = \(bpm: number\) => \(\{ label: `CLICK \$\{bpm\}`/);
const SRC = [
  LIM,
  /sources: \[srcSine\(440\), srcClick\(120\), SRC_PINK\]/.test(LIM) ? 'SINE 440 Hz · CLICK 120' : '',
  CFG.slice(0, CFG.indexOf('// Retrieval checks')),
  code('src/screens/lab/FxLabScreen.tsx'),
  code('src/screens/lab/fxAnim.tsx'),
  code('src/features/lab/fxViz.tsx'),
  code('src/screens/lab/LabShell.tsx'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/components/LabUnderstandingCheck.tsx'),
].join('\n');
const LESSON = (() => {
  const c = code('src/features/lab/guidedLessons/content.ts');
  return c.slice(c.indexOf('  limiter: {'), c.indexOf('  distortion: {'));
})();
const CHECKS = (() => {
  const c = code('src/features/lab/understandingChecks.ts');
  return c.slice(c.indexOf('const LIMITER'), c.indexOf('const DEESSER'));
})();

describe('1. every Limiter screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*limiter: LIMITER,/m);
    assert.equal((CHECKS.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(GUIDES.check.seeing.join(' '), /four questions/);
    for (const m of ['explore', 'learn', 'check']) assert.equal(limiterScreenGuide(m), GUIDES[m]);
    assert.equal(limiterScreenGuide('other'), undefined);
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
        assert.ok(gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: ${gd[k].length} bullets`);
        for (const line of gd[k]) assert.ok(line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3);
    });
  }
  it('house copy rules', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed|ing)\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|v6)\b/i, `${id}: a build note`);
      assert.doesNotMatch(t, /\b(Waves|UAD|Universal Audio|SSL|Neve|API|Fairchild|Urei|1176|L1|L2|Lexicon|Eventide|Boss|TC Electronic|Midas|dbx|iZotope|FabFilter)\b/, `${id}: a gear maker/model name`);
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
      'IN ▸', '▸ OUT', 'LIMIT', 'GR', 'CEIL', 'RLS', '— dB', 'CEILING', '30, 120 or 500 ms', 'SOURCE', 'SINE 440 Hz', 'CLICK 120', 'PINK NOISE',
      'LAB NOTES', 'GAIN REDUCTION', 'DESIGNED RESPONSE', 'GUIDED LESSON', 'THE AUDIO PATH',
      'TEACHING MODEL', 'DRUM-HIT MODEL',
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'Drive', 'RLS', 'Attack', 'Lookahead', 'True-Peak', 'CLICK 120', 'CEILING', 'dBTP'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '✓', 'LEARN', 'EXPLORE', 'SINE 440 Hz', 'CEILING', 'True-Peak'],
  };
  it('a name list for every screen', () => assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(GUIDES).sort()));
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      // '30, 120 or 500 ms' is the guide's reading of the three RLS chips
      const src = SRC + '\n' + LESSON + '\n' + CHECKS + (/label: '30 ms'[\s\S]*?label: '120 ms'[\s\S]*?label: '500 ms'/.test(LIM) ? '\n30, 120 or 500 ms' : '');
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the dock, bezel and well are exactly what the guide lists', () => {
    assert.match(LIM, /label: 'CEILING', paramId: P\.ceilingDb/);
    assert.match(LIM, /fader: \{ min: -45, max: -15,/);
    assert.match(GUIDES.explore.control.join(' '), /CEILING fader from −45 to −15 dB/);
    assert.match(LIM, /bezel: \[\s*\{ k: 'CEIL', paramId: P\.ceilingDb \},\s*\{ k: 'RLS', paramId: P\.releaseMs \},\s*\]/);
    assert.match(LIM, /pollGr: 'limiter'/);
    assert.match(LIM, /note: 'True-peak \(inter-sample\) detection and lookahead are covered in the lesson/);
    assert.match(GUIDES.explore.control.join(' '), /a note on true peak/);
    assert.equal((LIM.match(/^\s{6}question: '/gm) ?? []).length, 2);
    assert.match(GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
    assert.match(read('src/screens/lab/foundations/bits.tsx'), />CHECK YOURSELF\{/);
    // the lesson's ceiling figure the LEARN guide contrasts with the lab's
    assert.match(LESSON, /masters often −1 dBTP/);
  });
  it('LEARN: the header ▶ shows on every tab (LabShell headerAction), so the page says it still plays', () => {
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{headerAction \? <View style=\{styles\.headerAction\}/);
    assert.doesNotMatch(textOf(GUIDES.learn), /Nothing here plays/);
    assert.ok(GUIDES.learn.seeing[0].includes('▶ in the header still plays or stops the sound'));
  });
});

// ── Sample-level re-run of the engine (Effects.hpp DynamicsEffect LimiterMode) ──
const FS = 48000;
const onePole = (ms: number) => 1 - Math.exp(-1 / (0.001 * Math.max(ms, 0.01) * FS));
const highpass = (f0: number) => {
  const w = 2 * Math.PI * f0, K = 2 * FS, K2 = K * K, A1 = w / Math.SQRT1_2, A0 = w * w, a0 = K2 + A1 * K + A0;
  const c = { b0: K2 / a0, b1: (-2 * K2) / a0, b2: K2 / a0, a1: (2 * A0 - 2 * K2) / a0, a2: (K2 - A1 * K + A0) / a0 };
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x: number) => { const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
};
const limiter = (ceil: number, relMs: number) => {
  let env = 0;
  const aA = onePole(0.1), aR = onePole(relMs);
  return (x: number) => {
    const ax = Math.abs(x);
    env += (ax > env ? aA : aR) * (ax - env);
    const over = 20 * Math.log10(env + 1e-9) - ceil;
    return over > 0 ? over : 0;
  };
};
const sine = (hz: number) => (i: number) => 0.1 * Math.sin((2 * Math.PI * hz * i) / FS);
const click = (bpm: number) => (i: number) => {
  const t = (i / FS) % (60 / bpm);
  return t < 0.005 ? 0.1 * 0.5 * (1 - Math.cos((2 * Math.PI * t) / 0.005)) * Math.sin(2 * Math.PI * 1000 * t) : 0;
};
const run = (src: (i: number) => number, ceil: number, rel: number, speaker: boolean) => {
  const hp = speaker ? highpass(150) : (x: number) => x;
  const d = limiter(ceil, rel);
  let mn = Infinity, mx = -Infinity;
  const polls: number[] = [];
  for (let i = 0; i < FS * 3; i++) {
    const gr = d(hp(src(i)));
    if (i >= FS) { mn = Math.min(mn, gr); mx = Math.max(mx, gr); if (i % (FS * 0.05) === 0) polls.push(gr); }
  }
  return { mn, mx, polls };
};

describe('4. the TRY THIS numbers follow from the lab and the engine', () => {
  it('the inputs: −20 dBFS sources, RLS 120 default, the engine’s 0.1 ms limiter attack and its law', () => {
    const fx = code('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(code('src/screens/lab/FxLabScreen.tsx'), /const GEN_LEVEL_DB = -20;/);
    assert.match(LIM, /label: 'RELEASE', short: 'RLS'[\s\S]*?initial: 120,/);
    assert.match(fx, /fx::onePole\(mode_ == LimiterMode \? 0\.1 : attackMs_\.load\(\), fs_\)/);
    assert.match(fx, /const double over = envDb - ceiling;\s*const double gr = over > 0\.0 \? over : 0\.0;/);
  });
  for (const speaker of [false, true]) {
    const route = speaker ? 'phone speaker' : 'headphones';
    it(`EXPLORE 1–2 + CHECK 1 on ${route}: SINE 440 — −25 about 5, −45 about 25, −15 (and −20) 0.0`, () => {
      const a = run(sine(440), -25, 120, speaker);
      assert.equal(Math.round(a.mn), 5); assert.equal(Math.round(a.mx), 5);
      const b = run(sine(440), -45, 120, speaker);
      assert.equal(Math.round(b.mn), 25); assert.equal(Math.round(b.mx), 25);
      for (const c of [-15, -20]) assert.equal(+run(sine(440), c, 120, speaker).mx.toFixed(1), 0, `CEILING ${c}`);
    });
    it(`EXPLORE 3 + LEARN 2 on ${route}: CLICK 120 at −45 — RLS 30 flicks and is gone, RLS 500 never reaches 0.0`, () => {
      const fast = run(click(120), -45, 30, speaker);
      assert.ok(fast.mx > 20, 'the hit flicks GR up');
      const zeroShare = fast.polls.filter((p) => p < 0.05).length / fast.polls.length;
      assert.ok(zeroShare > 0.8, `at 30 ms a 50 ms poll mostly reads 0.0 (${zeroShare.toFixed(2)})`);
      const slow = run(click(120), -45, 500, speaker);
      assert.ok(slow.mn > 10, `at 500 ms GR never reaches 0.0 (low ${slow.mn.toFixed(1)})`);
    });
  }
  it('LEARN 1 works the GR sum with OTHER numbers than the check (−25 → 5 dB): −35 → 15 dB, on both routes', () => {
    assert.match(CHECKS, /source peaks at −20 dBFS and the ceiling is set to −25 dB[\s\S]*?correct: '5 dB'/);
    assert.match(GUIDES.learn.tryThis[0], /−20 dBFS under a −35 dB ceiling is held down 15 dB\. On EXPLORE, play SINE 440 Hz at CEILING −35 dB: GR reads about 15/);
    assert.doesNotMatch(GUIDES.learn.tryThis.join(' '), /CHECK’s second question/);
    for (const speaker of [false, true]) {
      const a = run(sine(440), -35, 120, speaker);
      assert.equal(Math.round(a.mn), 15); assert.equal(Math.round(a.mx), 15);
    }
  });
  it('no lookahead: on the CLICK, output SAMPLE peaks pass the ceiling by a few dB; on the SINE they hold — and the guide says so', () => {
    const overshoot = (src: (i: number) => number, ceil: number, rel: number) => {
      let env = 0, pk = 0;
      const aA = onePole(0.1), aR = onePole(rel);
      for (let i = 0; i < FS * 3; i++) {
        const x = src(i), ax = Math.abs(x);
        env += (ax > env ? aA : aR) * (ax - env);
        const over = Math.max(0, 20 * Math.log10(env + 1e-9) - ceil);
        if (i >= FS) pk = Math.max(pk, Math.abs(x * 10 ** (-over / 20)));
      }
      return 20 * Math.log10(pk) - ceil;
    };
    assert.ok(overshoot(sine(440), -25, 120) < 0.1);
    for (const [c, r] of [[-45, 30], [-45, 500], [-25, 120]]) {
      const o = overshoot(click(120), c, r);
      assert.ok(o > 1.5 && o < 6, `CLICK ${c}/${r}: +${o.toFixed(2)} dB`);
    }
    assert.match(GUIDES.explore.changes[0], /pulled down to it almost at once[\s\S]*A sharp click can slip a few dB past first, because this limiter can’t look ahead/);
    assert.doesNotMatch(GUIDES.explore.changes.join(' '), /held down to it at once/);
    assert.match(GUIDES.learn.changes.join(' '), /only if it sees peaks coming early \(lookahead\)\. This lab has none/);
    // case-blind: the Part A lesson rewrite (2026-11-08) prints the label, CEILING
    assert.match(LESSON, /out ≤ ceiling, as long as the lookahead covers the attack/i);
  });
  it('the guide states exactly those readings', () => {
    const t = GUIDES.explore.tryThis;
    assert.match(t[0], /CEILING to −25 dB: GR holds at about 5 dB[\s\S]*CEILING to −45 dB: about 25 dB/);
    assert.match(t[1], /CEILING to −15 dB: GR reads 0\.0/);
    assert.match(t[2], /CLICK 120 and CEILING to −45 dB\. RLS 30 ms: GR flicks up and is gone\. RLS 500 ms: it falls back so slowly it never reaches 0\.0/);
    // CHECK (decision 6, owner's own example 2026-11-08): the GR-sum line never walks to the check's
    // −25 dB / 5 dB; it works a DIFFERENT ceiling (−30 → about 10, re-run here on both routes)
    assert.match(GUIDES.check.tryThis[0], /SINE 440 Hz at CEILING −30 dB: GR reads about 10 dB/);
    for (const speaker of [false, true]) {
      const c = run(sine(440), -30, 120, speaker);
      assert.equal(Math.round(c.mn), 10); assert.equal(Math.round(c.mx), 10);
    }
    const checkText = [...SECTION_KEYS.map((k: string) => GUIDES.check[k].join(' ')), JSON.stringify((GUIDES.check as unknown as { intro: unknown }).intro)].join(' ');
    assert.doesNotMatch(checkText, /−25 dB|\b5 dB|never goes above|at or near the (very )?end|final safety net|between (the )?samples can|inter-sample/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  // The shared FxLabScreen change is not this rollout's, and sibling effect
  // labs proposed different field names (guide / accuracy, screenGuide /
  // accuracyChip) — read them from FxLabScreen, then pin this config.
  const SCREEN_SRC = code('src/screens/lab/FxLabScreen.tsx');
  const guideKey = SCREEN_SRC.match(/<LabShell[\s\S]*?guide=\{config\.(\w+)\}/)?.[1];
  const accKey = SCREEN_SRC.match(/<LabShell[\s\S]*?accuracy=\{config\.(\w+)/)?.[1];
  const wired = guideKey != null;
  it('wiring: LabShell gets this lab’s per-tab guide, and no AccuracyNote chip', { todo: wired ? false : 'needs the shared FxLabScreen / fxLabConfigs change (12 effect labs share them — see the rollout report)' }, () => {
    if (!wired) return; // TODO until the shared files are wired; enforced from then on
    assert.ok(accKey, 'FxLabScreen forwards a guide but no accuracy flag');
    assert.ok(LIM.includes(`${guideKey}: limiterScreenGuide,`), `config lacks ${guideKey}: limiterScreenGuide`);
    assert.ok(LIM.includes(`${accKey}: false,`), `config lacks ${accKey}: false`);
  });
  it('a CONCEPT lab: no mic, no real-world measurement', () => {
    const fxs = code('src/screens/lab/FxLabScreen.tsx');
    assert.doesNotMatch(fxs, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
  });
});
