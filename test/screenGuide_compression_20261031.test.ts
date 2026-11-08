/**
 * Screen Guide rollout — Compression Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (a LabShell lab).
 *
 *   1. every screen the learner reaches has a guide — the LabShell tabs
 *      EXPLORE (the rack), LEARN (the lesson) and CHECK (the lab has an
 *      understanding check) — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the lab source (fxLabConfigs compConfig, FxLabScreen,
 *      fxAnim, fxViz, the lesson, the check);
 *   4. the TRY THIS numbers follow from the engine (Effects.hpp DynamicsEffect)
 *      and the lab's sources — re-run sample by sample on BOTH routes
 *      (headphones, and the phone speaker's 150 Hz high-pass);
 *   5. wiring + the chip decision. FxLabScreen / fxLabConfigs are SHARED by
 *      twelve effect labs, so this rollout does not edit them: the wiring
 *      assertion is a TODO until the shared FxLabConfig `guide` / `accuracy`
 *      pass-through lands (reported to the coordinator).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { COMPRESSION_SCREEN_GUIDES, compressionScreenGuide } = await import('../src/screens/lab/compressionScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = COMPRESSION_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CFG = code('src/screens/lab/fxLabConfigs.tsx');
/** compConfig alone, so a name from another lab's config proves nothing. */
const COMP = CFG.slice(CFG.indexOf('const compConfig'), CFG.indexOf('export const CompressionLabScreen'));
/** The source labels are built by templates (srcClick / srcSine): pin the
 *  templates, then add the labels this lab's `sources` line produces. */
assert.match(CFG, /const srcSine = \(hz: number\) => \(\{ label: `SINE \$\{hz\} Hz`/);
assert.match(CFG, /const srcClick = \(bpm: number\) => \(\{ label: `CLICK \$\{bpm\}`/);
const SRC = [
  COMP,
  /sources: \[srcClick\(120\), srcSine\(440\), SRC_PINK\]/.test(COMP) ? 'CLICK 120 · SINE 440 Hz' : '',
  CFG.slice(0, CFG.indexOf('// Retrieval checks')), // the shared source specs
  code('src/screens/lab/FxLabScreen.tsx'),
  code('src/screens/lab/fxAnim.tsx'),
  code('src/features/lab/fxViz.tsx'),
  code('src/screens/lab/LabShell.tsx'),
  code('src/screens/lab/rack/RackUnit.tsx'),
  code('src/screens/lab/foundations/bits.tsx'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/components/LabUnderstandingCheck.tsx'),
].join('\n');
const LESSON = (() => {
  const c = code('src/features/lab/guidedLessons/content.ts');
  return c.slice(c.indexOf('  compression: {'), c.indexOf('  gate: {'));
})();
const CHECKS = (() => {
  const c = code('src/features/lab/understandingChecks.ts');
  return c.slice(c.indexOf('const COMPRESSION'), c.indexOf('const GATE'));
})();

describe('1. every Compression screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has an understanding check)', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*compression: COMPRESSION,/m);
    assert.equal((CHECKS.match(/^\s{4}id: '/gm) ?? []).length, 4, 'the CHECK guide says "four questions"');
    assert.match(GUIDES.check.seeing.join(' '), /four questions/);
    for (const m of ['explore', 'learn', 'check']) assert.equal(compressionScreenGuide(m), GUIDES[m]);
    assert.equal(compressionScreenGuide('other'), undefined);
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
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed|ing)\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|v6)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Waves|UAD|Universal Audio|SSL|Neve|API|Fairchild|Teletronix|Urei|1176|LA-2A|Lexicon|Eventide|Boss|TC Electronic|Midas|dbx)\b/, `${id}: a gear maker/model name`);
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
      // the display (fxAnim FlowScene + DynamicsFlow) and the GR ladder
      'IN ▸', '▸ OUT', 'COMP', 'GR',
      // bezel keys + the stopped GR value
      'THRESH', 'RATIO', '— dB',
      // dock keys and their choices (compConfig)
      'ATK/REL', 'MAKEUP', 'SOURCE', '2:1 GLUE', '4:1', '8:1', '20:1 LIMIT', '0.5 ms FAST', '25 ms PUNCH', '100 ms', '+6 dB',
      'CLICK 120', 'SINE 440 Hz', 'PINK NOISE', 'ATTACK', 'RELEASE',
      // the well
      'LAB NOTES', 'GAIN REDUCTION', 'DESIGNED RESPONSE', 'GUIDED LESSON', 'THE AUDIO PATH',
      // the stage badge + the CLICK drawing's note (fxAnim)
      // the CLICK is drawn as the real 5 ms ping since D41 J4 (was 'DRUM-HIT MODEL')
      'TEACHING MODEL', '5 ms CLICK',
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'THRESH', 'RATIO', 'ATTACK', 'RELEASE', 'MAKEUP', 'CLICK 120', '0.5 ms FAST', '25 ms PUNCH'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '✓', 'LEARN', 'EXPLORE', 'SINE 440 Hz', 'THRESH'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      const src = SRC + '\n' + LESSON + '\n' + CHECKS;
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the dock is exactly what the guide lists: THRESH fader −50…−10, RATIO, ATK/REL, MAKEUP, SOURCE', () => {
    assert.match(COMP, /label: 'THRESHOLD', short: 'THRESH'/);
    assert.match(COMP, /fader: \{ min: -50, max: -10,/);
    assert.match(GUIDES.explore.control.join(' '), /THRESH fader from −50 to −10 dB/);
    assert.match(COMP, /label: 'RELEASE', paramId: P\.releaseMs[\s\S]*?\[\s*\{ label: '30 ms', value: 30 \},\s*\{ label: '120 ms', value: 120 \},\s*\{ label: '500 ms', value: 500 \},/);
    assert.match(COMP, /id: 'env', label: 'ATK\/REL', paramIds: \[P\.attackMs, P\.releaseMs\]/);
    assert.match(COMP, /sources: \[srcClick\(120\), srcSine\(440\), SRC_PINK\]/);
    assert.match(COMP, /bezel: \[\s*\{ k: 'THRESH', paramId: P\.thresholdDb \},\s*\{ k: 'RATIO', paramId: P\.ratio \},\s*\]/);
    assert.match(COMP, /pollGr: 'comp'/);
    // the lab's own two well questions — "two quick questions"
    assert.equal((COMP.match(/^\s{6}question: '/gm) ?? []).length, 2);
    assert.match(GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
    assert.match(read('src/screens/lab/foundations/bits.tsx'), />CHECK YOURSELF\{/);
  });
  it('LEARN: the header ▶ shows on every tab (LabShell headerAction), so the page says it still plays', () => {
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{headerAction \? <View style=\{styles\.headerAction\}/);
    assert.doesNotMatch(textOf(GUIDES.learn), /Nothing here plays/);
    assert.ok(GUIDES.learn.seeing[0].includes('▶ in the header still plays or stops the sound'));
  });
});

// ── Sample-level re-run of the engine ────────────────────────────────────────
// Effects.hpp DynamicsEffect, Compressor mode: a peak detector on |x| with the
// ATTACK coefficient while the level rises and RELEASE while it falls; GR =
// (detector dB − threshold) × (1 − 1/ratio) above the threshold. Sources from
// Generator.hpp at the lab's −20 dBFS: a sine, and the CLICK — a 5 ms
// Hann-windowed 1 kHz ping every beat. 48 kHz. The speaker route's 150 Hz
// high-pass sits on the generator, before the effects.
const FS = 48000;
const onePole = (ms: number) => 1 - Math.exp(-1 / (0.001 * Math.max(ms, 0.01) * FS));
const highpass = (f0: number) => {
  const w = 2 * Math.PI * f0, K = 2 * FS, K2 = K * K, A1 = w / Math.SQRT1_2, A0 = w * w, a0 = K2 + A1 * K + A0;
  const c = { b0: K2 / a0, b1: (-2 * K2) / a0, b2: K2 / a0, a1: (2 * A0 - 2 * K2) / a0, a2: (K2 - A1 * K + A0) / a0 };
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x: number) => { const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
};
const comp = (thr: number, ratio: number, attMs: number, relMs: number) => {
  let env = 0;
  const aA = onePole(attMs), aR = onePole(relMs);
  return (x: number) => {
    const ax = Math.abs(x);
    env += (ax > env ? aA : aR) * (ax - env);
    const over = 20 * Math.log10(env + 1e-9) - thr;
    return over > 0 ? over * (1 - 1 / ratio) : 0;
  };
};
const sine = (hz: number) => (i: number) => 0.1 * Math.sin((2 * Math.PI * hz * i) / FS);
const click = (bpm: number) => (i: number) => {
  const t = (i / FS) % (60 / bpm);
  return t < 0.005 ? 0.1 * 0.5 * (1 - Math.cos((2 * Math.PI * t) / 0.005)) * Math.sin(2 * Math.PI * 1000 * t) : 0;
};
/** The GR over the last second of a 2 s run: [min, max], and the readings a
 *  50 ms poll would catch (FxLabScreen GR_POLL_MS). */
const run = (src: (i: number) => number, thr: number, ratio: number, att: number, rel: number, speaker: boolean) => {
  const hp = speaker ? highpass(150) : (x: number) => x;
  const g = comp(thr, ratio, att, rel);
  let mn = Infinity, mx = -Infinity;
  const polls: number[] = [];
  for (let i = 0; i < FS * 2; i++) {
    const gr = g(hp(src(i)));
    if (i >= FS) { mn = Math.min(mn, gr); mx = Math.max(mx, gr); if (i % (FS * 0.05) === 0) polls.push(gr); }
  }
  return { mn, mx, polls };
};

describe('4. the TRY THIS numbers follow from the lab and the engine', () => {
  it('the inputs: −20 dBFS sources, the default 4:1 / 5 ms / 120 ms, the engine law, the 5 ms click', () => {
    const fx = code('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(code('src/screens/lab/FxLabScreen.tsx'), /const GEN_LEVEL_DB = -20;/);
    assert.match(code('src/screens/lab/FxLabScreen.tsx'), /const GR_POLL_MS = 50;/);
    assert.match(COMP, /label: 'RATIO', paramId: P\.ratio[\s\S]*?initial: 4,/);
    assert.match(COMP, /label: 'ATTACK', paramId: P\.attackMs[\s\S]*?initial: 5,/);
    assert.match(COMP, /label: 'RELEASE', paramId: P\.releaseMs[\s\S]*?initial: 120,/);
    assert.match(fx, /if \(x > env_\) env_ \+= aA \* \(x - env_\);\s*else env_ \+= aR \* \(x - env_\);/);
    assert.match(fx, /const double gr = over > 0\.0 \? over \* \(1\.0 - 1\.0 \/ ratio\) : 0\.0;/);
    const gen = read('modules/ape-dsp/ios/core/Generator.hpp');
    assert.match(gen, /if \(t < 0\.005\) \{\s*const double win = 0\.5 \* \(1\.0 - std::cos\(2\.0 \* kPi \* t \/ 0\.005\)\);\s*return win \* std::sin\(2\.0 \* kPi \* 1000\.0 \* t\);/);
    // GR prints as "x.x dB" on the bezel (toFixed(1))
    assert.match(code('src/screens/lab/FxLabScreen.tsx'), /v: running \? `\$\{grDb\.toFixed\(1\)\} dB` : '— dB'/);
  });
  for (const speaker of [false, true]) {
    const route = speaker ? 'phone speaker' : 'headphones';
    it(`EXPLORE 1 on ${route}: SINE 440 at −30 dB holds about 7 dB; −20 dB and above read 0.0`, () => {
      const a = run(sine(440), -30, 4, 5, 120, speaker);
      assert.equal(Math.round(a.mn), 7); assert.equal(Math.round(a.mx), 7);
      assert.ok(a.mx - a.mn < 0.1, 'it HOLDS (steady tone)');
      for (const thr of [-20, -15, -10]) assert.equal(+run(sine(440), thr, 4, 5, 120, speaker).mx.toFixed(1), 0, `THRESH ${thr}`);
    });
    it(`EXPLORE 2 on ${route}: RATIO 2:1 / 4:1 / 8:1 / 20:1 at −30 → about 5 / 7 / 8 / 9, all under 10`, () => {
      const got = [2, 4, 8, 20].map((r) => run(sine(440), -30, r, 5, 120, speaker).mx);
      assert.deepEqual(got.map(Math.round), [5, 7, 8, 9]);
      for (const g of got) assert.ok(g < 10);
    });
    it(`EXPLORE 3 + LEARN 2 on ${route}: CLICK 120 at −40 kicks then falls to 0.0; 25 ms PUNCH stays 0.0; 0.5 ms FAST kicks deeper`, () => {
      const def = run(click(120), -40, 4, 5, 120, speaker);
      assert.ok(def.mx > 4 && def.mx < 7, `kick ${def.mx.toFixed(1)}`);
      assert.equal(+def.mn.toFixed(1), 0, 'falls back to 0.0 between hits');
      assert.ok(def.polls.some((p) => p > 0.5), 'a 50 ms poll catches the kick');
      assert.equal(+run(click(120), -40, 4, 25, 120, speaker).mx.toFixed(1), 0, '25 ms PUNCH');
      assert.ok(run(click(120), -40, 4, 0.5, 120, speaker).mx > def.mx + 3, '0.5 ms FAST kicks deeper');
    });
    it(`OPENING settings (D41 fix) on ${route}: CLICK 120, THRESH −40, ATTACK 5 ms → GR moves on first play (~5.5 dB a hit)`, () => {
      const open = run(click(120), -40, 4, 5, 120, speaker);
      assert.equal(Math.round(open.mx), 5, `kick ${open.mx.toFixed(1)}`);
      assert.ok(open.polls.some((p) => p > 0.5), 'a 50 ms poll catches it');
      // the old opening (−30) never moved the meter — why the default changed
      assert.equal(+run(click(120), -30, 4, 5, 120, speaker).mx.toFixed(1), 0);
    });
  }
  // the below-threshold reading: true per the engine, but it IS the below-threshold answer,
  // so the CHECK guide no longer walks there (decision 6, 2026-11-08; pinned below)
  it('SINE 440 at THRESH −10 dB reads 0.0', () => {
    assert.equal(+run(sine(440), -10, 4, 5, 120, false).mx.toFixed(1), 0);
  });
  it('the guide states exactly those readings', () => {
    const t = GUIDES.explore.tryThis;
    assert.match(t[0], /THRESH at −30 dB: GR holds at about 7 dB\. Ride THRESH up to −20 dB: GR falls to 0\.0/);
    assert.match(t[1], /2:1 GLUE about 5 dB, 4:1 about 7, 8:1 about 8, 20:1 LIMIT about 9/);
    assert.match(t[2], /On CLICK 120 at THRESH −40 dB, GR kicks on each hit, then falls to 0\.0\. Pick ATTACK 25 ms PUNCH: GR stays 0\.0/);
    assert.match(GUIDES.learn.tryThis[0], /12 × \(1 − 1\/4\) = 9 dB of gain reduction, so the output sits 3 dB over the threshold/);
    // …the same kind of sum as the check's first question (8 dB over at 4:1 →
    // '2 dB'), with other numbers, so no guide step hands over that answer
    assert.match(CHECKS, /input rises 8 dB above the threshold[\s\S]*?correct: '2 dB'/);
    for (const gd of Object.values(GUIDES)) assert.doesNotMatch(textOf(gd), /8 ÷ 4|8 dB over at 4:1|8 dB over leaves 2/);
    assert.match(GUIDES.check.tryThis[0], /SINE 440 Hz at THRESH −30 dB and step RATIO from 2:1 GLUE to 20:1 LIMIT: GR grows from about 5 to 9 dB/);
    assert.match(GUIDES.explore.changes.join(' '), /At the start \(CLICK 120, THRESH −40 dB, ATTACK 5 ms\) GR kicks about 3–5 dB on each hit, then falls back to 0\.0/);
    assert.doesNotMatch(textOf(GUIDES.explore), /at the start GR reads 0\.0/);
    assert.match(COMP, /label: 'THRESHOLD', short: 'THRESH'[\s\S]*?initial: -40,/);
    assert.match(COMP, /sources: \[srcClick\(120\)/);
    assert.match(GUIDES.check.tryThis[1], /Read FORMULA \/ CONCEPT on LEARN, or long-press THRESH on EXPLORE/);
    assert.match(COMP, /short: 'THRESH', paramId: P\.thresholdDb, lessonKey: 'threshold',/);
    const checkText = [...SECTION_KEYS.map((k: string) => GUIDES.check[k].join(' ')), JSON.stringify((GUIDES.check as unknown as { intro: unknown }).intro)].join(' ');
    assert.doesNotMatch(checkText, /THRESH −10 dB|GR reads 0\.0|only acts above|nothing changes|2 dB over|slower attack|25 ms PUNCH|brings? the (whole )?(signal|level) back/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  it('the LabShell shell already takes a per-tab guide and the chip opt-out', () => {
    const shell = code('src/screens/lab/LabShell.tsx');
    assert.match(shell, /typeof guide === 'function' \? guide\(mode\)/);
    assert.match(shell, /accuracy = true,/);
  });
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
    assert.ok(COMP.includes(`${guideKey}: compressionScreenGuide,`), `config lacks ${guideKey}: compressionScreenGuide`);
    assert.ok(COMP.includes(`${accKey}: false,`), `config lacks ${accKey}: false`);
  });
  it('a CONCEPT lab: no mic, no real-world measurement — the GR is the engine’s own reduction on a built-in test source', () => {
    const fxs = code('src/screens/lab/FxLabScreen.tsx');
    const calls = new Set([...fxs.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    for (const c of calls) assert.match(c, /^(gen|fx)[A-Z]\w*$|^(isAvailable|engineVersion|stereoSpreadAvailable)$/, `ApeDsp.${c} — not a generator/effects call`);
    assert.doesNotMatch(fxs, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
  });
});

// ── D41 J4 (2026-11-01): the drawing runs the REAL click ─────────────────────
// The compressor drawing used fxAnim's 90 ms DRUM-HIT MODEL as its input, so at
// the opening settings its detector clamped ~14 dB while the live GR meter
// kicked ~5.5 dB. It now walks the generator's 5 ms ping on the engine's
// 48 kHz grid. This mirror copies the DynamicsFlow ping walk (columns, pre-roll,
// silence between pings) and checks it against the engine re-run above.
describe('6. the compressor drawing and the GR meter run the same click (D41 J4)', () => {
  const ANIM = code('src/screens/lab/fxAnim.tsx');
  it('source pins: the compressor asks for the ping; the gate and limiter keep the drum model', () => {
    assert.match(COMP, /signal: dynSignalOf\(src, true\),/);
    const gate = CFG.slice(CFG.indexOf('const gateConfig'), CFG.indexOf('export const GateLabScreen'));
    const lim = CFG.slice(CFG.indexOf('const limiterConfig'), CFG.indexOf('export const LimiterLabScreen'));
    assert.match(gate, /signal: dynSignalOf\(src\),/);
    assert.match(lim, /signal: dynSignalOf\(src\),/);
    assert.match(ANIM, /const ping = sigKind === 0 && signal\?\.kind === 'hits' && signal\.ping === true && mode !== 'gate';/);
    // the ping = Generator.hpp GenMode::Click at −20 dBFS, on the 48 kHz grid
    assert.match(ANIM, /const PING_MS = 5;/);
    assert.match(ANIM, /const PING_DT = 1000 \/ 48000;/);
    assert.match(ANIM, /const PING_PEAK = Math\.pow\(10, DYN_PEAK_DB \/ 20\);/);
    assert.match(ANIM, /const DYN_PEAK_DB = -20;/);
    assert.match(ANIM, /const win = 0\.5 \* \(1 - Math\.cos\(\(2 \* Math\.PI \* u\) \/ PING_MS\)\);\s*return PING_PEAK \* win \* Math\.abs\(Math\.sin\(2 \* Math\.PI \* u\)\);/);
    // the walk: the engine's per-sample coefficients, its detector and law, silence between pings
    assert.match(ANIM, /const aAtkP = 1 - Math\.exp\(-PING_DT \/ atk\);\s*const aRelP = 1 - Math\.exp\(-PING_DT \/ rel\);/);
    assert.match(ANIM, /env \+= \(xp > env \? aAtkP : aRelP\) \* \(xp - env\);/);
    assert.match(ANIM, /\? \(env > thrLin \? Math\.exp\(-slope \* Math\.log\(env \/ thrLin\)\) : 1\) \* mkLin/);
    assert.match(ANIM, /env \*= Math\.exp\(-\(uEnd - u\) \/ rel\);/);
    assert.match(ANIM, /: ping\s*\? `5 ms CLICK · \$\{Math\.round\(60000 \/ periodMs\)\} BPM`/);
  });

  /** The DynamicsFlow OUT walk at a phone width: the detector's peak GR and
   *  the drawn spike's drop under the dotted outline (dB), CLICK 120. */
  const drawn = (thr: number, atk: number, ping: boolean, ratio = 4, rel = 120) => {
    const w = 358, stageX = w * 0.42, outX0 = stageX + 10, outX1 = w - 6, msPerPx = 900 / (outX1 - outX0), SUB = 4;
    const PEAK = 0.1, FLOOR = 10 ** (-52 / 20), DEC = 90, PMS = 5, PDT = 1000 / FS, PN = 240, periodMs = 500;
    const pingAbs = (u: number) => (u < PMS ? PEAK * 0.5 * (1 - Math.cos((2 * Math.PI * u) / PMS)) * Math.abs(Math.sin(2 * Math.PI * u)) : 0);
    const cols = Math.floor(outX1 - outX0), cw = (outX1 - outX0) / cols, dts = (cw * msPerPx) / SUB, dtc = dts * SUB;
    const thrLin = 10 ** (thr / 20), slope = 1 - 1 / ratio;
    const now = 3000.37, tOld = now - (outX1 - stageX) * msPerPx;
    const pre = Math.ceil(Math.min(2500, Math.max(periodMs, 5 * rel, 5 * atk, 200)) / dtc);
    const peaks: number[] = new Array(cols).fill(0), dry: number[] = new Array(cols).fill(0);
    let t = tOld - pre * dtc, tb = t - Math.floor(t / periodMs) * periodMs, xd = PEAK * Math.exp(-tb / DEC), env = 0, grMax = 0;
    const law = (c: number, x: number) => {
      const gr = env > thrLin ? slope * 20 * Math.log10(env / thrLin) : 0;
      if (c < 0) return;
      grMax = Math.max(grMax, gr);
      peaks[c] = Math.max(peaks[c], x * 10 ** (-gr / 20));
      dry[c] = Math.max(dry[c], x);
    };
    for (let k = 0; k < pre + cols * SUB; k++) {
      const coarse = k < pre, dt = coarse ? dtc : dts, c = coarse ? -1 : cols - 1 - Math.floor((k - pre) / SUB);
      if (ping) {
        let u = tb, rem = dt;
        while (rem > 1e-9) {
          if (u >= periodMs) u -= periodMs;
          if (u < PMS) {
            const uEnd = Math.min(u + rem, PMS);
            for (let j = Math.ceil(u / PDT - 1e-9); j < PN && j * PDT < uEnd - 1e-9; j++) {
              const x = pingAbs(j * PDT);
              env += (x > env ? 1 - Math.exp(-PDT / atk) : 1 - Math.exp(-PDT / rel)) * (x - env);
              law(c, x);
            }
            rem -= uEnd - u; u = uEnd;
          } else { const uEnd = Math.min(u + rem, periodMs); env *= Math.exp(-(uEnd - u) / rel); rem -= uEnd - u; u = uEnd; }
        }
      } else {
        const x = Math.max(xd, FLOOR);
        env += (x > env ? 1 - Math.exp(-dt / atk) : 1 - Math.exp(-dt / rel)) * (x - env);
        law(c, x);
      }
      t += dt; tb += dt;
      if (tb >= periodMs) { tb -= periodMs; xd = PEAK * Math.exp(-tb / DEC); } else xd *= Math.exp(-dt / DEC);
    }
    return { gr: grMax, drop: 20 * Math.log10(Math.max(...dry) / Math.max(...peaks)) };
  };
  /** The engine's own output: the click's peak in vs out over the last second. */
  const engineDrop = (thr: number, atk: number) => {
    const g = comp(thr, 4, atk, 120), src = click(120);
    let inPk = 0, outPk = 0;
    for (let i = 0; i < FS * 2; i++) {
      const x = src(i), gr = g(x);
      if (i >= FS) { inPk = Math.max(inPk, Math.abs(x)); outPk = Math.max(outPk, Math.abs(x) * 10 ** (-gr / 20)); }
    }
    return 20 * Math.log10(inPk / outPk);
  };

  it('the old drum-hit drawing clamped about 14 dB where the meter kicks about 5.5 (the bug)', () => {
    const old = drawn(-40, 5, false).gr;
    assert.ok(Math.abs(old - 14) < 1.5, `drum model ${old.toFixed(1)}`);
    assert.equal(Math.round(run(click(120), -40, 4, 5, 120, false).mx), 5);
  });
  const CASES: [string, number, number][] = [['the opening settings', -40, 5], ['0.5 ms FAST', -40, 0.5], ['25 ms PUNCH', -40, 25], ['THRESH −50', -50, 5], ['THRESH −30', -30, 5]];
  for (const [label, thr, atk] of CASES) {
    it(`${label}: the drawn detector's GR matches the meter's within 0.5 dB, and the drawn spike drops what the engine's output does`, () => {
      const d = drawn(thr, atk, true);
      const meter = run(click(120), thr, 4, atk, 120, false).mx;
      assert.ok(Math.abs(d.gr - meter) <= 0.5, `drawn GR ${d.gr.toFixed(2)} vs meter ${meter.toFixed(2)}`);
      const e = engineDrop(thr, atk);
      assert.ok(Math.abs(d.drop - e) <= 0.5, `drawn drop ${d.drop.toFixed(2)} vs engine ${e.toFixed(2)}`);
    });
  }
  it('"about 3–5 dB": wherever the 50 ms poll lands after a kick, it reads between about 3 and 5.5 dB', () => {
    const g = comp(-40, 4, 5, 120), src = click(120);
    const gr: number[] = [];
    for (let i = 0; i < FS * 2; i++) { const v = g(src(i)); if (i >= FS) gr.push(v); }
    const peakAt = gr.indexOf(Math.max(...gr));
    // a poll every 50 ms: the first one after the peak lands 0–50 ms later
    const caught = Array.from({ length: 50 }, (_, ms) => gr[peakAt + Math.round((ms * FS) / 1000)]);
    assert.ok(Math.min(...caught) > 2.5 && Math.max(...caught) < 5.7, `poll reads ${Math.min(...caught).toFixed(1)}–${Math.max(...caught).toFixed(1)}`);
  });
  it('what the guide says the spike does: ~1 dB at the start, squeezed at 0.5 ms FAST, untouched at 25 ms PUNCH', () => {
    assert.ok(drawn(-40, 5, true).drop < 2, 'the opening spike drops about 1 dB');
    assert.ok(drawn(-40, 0.5, true).drop > 8, '0.5 ms FAST squeezes it');
    assert.equal(+drawn(-40, 25, true).drop.toFixed(1), 0, '25 ms PUNCH leaves it untouched');
    assert.match(GUIDES.explore.tryThis[2], /so the spike passes untouched/);
    assert.match(GUIDES.learn.tryThis[1], /0\.5 ms FAST kicks GR deeper and squeezes the drawn spike; 25 ms PUNCH leaves GR at 0\.0/);
    assert.match(GUIDES.explore.seeing.join(' '), /the 5 ms CLICK is the real click\. At ATTACK 5 ms its spike passes almost whole \(about 1 dB lower\): GR peaks as each click ends/);
    for (const gd of Object.values(GUIDES)) assert.doesNotMatch(textOf(gd), /DRUM-HIT|drawn hit still clamps|longer drawn hit/);
    assert.doesNotMatch(COMP, /its tail trails behind/);
  });
});
