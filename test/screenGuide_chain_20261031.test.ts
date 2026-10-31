/**
 * Screen Guide rollout — Signal Chain Builder (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (the Wave Physics pilot).
 *
 *   1. every screen the learner reaches in this LabShell lab has a guide —
 *      EXPLORE (the rack) and LEARN (the reading page); no CHECK tab exists
 *      (the lab's three understanding questions sit in LAB NOTES on EXPLORE,
 *      and the guide names them) — all five sections, the copy rules, 2–3
 *      TRY THIS experiments;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and SignalChainLabScreen.tsx / chainRack.tsx;
 *   4. the TRY THIS numbers follow from the lab's defaults and the engine
 *      (source −20 dB peak, ceiling −25 dB, soft-clip drive +12 dB, comp
 *      −30 dB 4:1 5 ms, +9 dB low shelf at 150 Hz) — re-run sample by sample
 *      on BOTH routes (headphones, and the phone speaker's 150 Hz high-pass
 *      that sits before the chain);
 *   5. wiring: LabShell gets the per-tab guide function, and the chip
 *      decision is pinned — a CONCEPT lab, so `accuracy={false}`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { CHAIN_SCREEN_GUIDES, chainScreenGuide } = await import('../src/screens/lab/chainScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const allGuides = Object.entries(CHAIN_SCREEN_GUIDES as unknown as Record<string, Guide>);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const SCREEN = 'src/screens/lab/SignalChainLabScreen.tsx';
const SRC = [code(SCREEN), code('src/screens/lab/chainRack.tsx'), code('src/screens/lab/LabShell.tsx'), code('src/screens/lab/rack/RackUnit.tsx'), code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'), code('src/features/lab/guidedLessons/content.ts'), code('src/features/lab/LabReviewButton.tsx'), code('src/screens/lab/kit/LabEndScreen.tsx'), code('src/screens/lab/rack/DockTray.tsx')].join('\n');

describe('1. every Signal Chain screen has a complete guide', () => {
  it('one guide per LabShell tab the lab offers: explore + learn (no CHECK tab — its questions live in LAB NOTES)', () => {
    assert.deepEqual(Object.keys(CHAIN_SCREEN_GUIDES).sort(), ['explore', 'learn']);
    assert.match(code('src/features/lab/understandingChecks.ts'), /export const PRACTICE_LAB_CHECKS/);
    assert.doesNotMatch(code('src/features/lab/understandingChecks.ts'), /^\s*chain:/m, 'a chain check now exists — add a CHECK-tab guide');
    assert.equal(chainScreenGuide('explore'), CHAIN_SCREEN_GUIDES.explore);
    assert.equal(chainScreenGuide('learn'), CHAIN_SCREEN_GUIDES.learn);
    assert.equal(chainScreenGuide('check'), undefined);
    // The three understanding questions render on EXPLORE (LAB NOTES), so the
    // EXPLORE guide must say they are there.
    const s = code(SCREEN);
    assert.equal((s.match(/^\s{4}question: '/gm) ?? []).length, 3);
    assert.match(s, /CHAIN_CHECKS\.map\(\(c, i\) => \(\s*<CheckQuestion/);
    assert.match(CHAIN_SCREEN_GUIDES.explore.control.join(' '), /LAB NOTES: the lesson, three quick questions/);
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
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*9\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client)\b/i, `${id}: a build note in learner text`);
      // audit 2026-10-31: no unsupported absolutes / hardware claims
      assert.doesNotMatch(t, /always works|most consoles|engineers meet most/i, `${id}: an absolute the screen does not bear out`);
      assert.doesNotMatch(t, /\b(Waves|UAD|Universal Audio|SSL|Neve|API|Fairchild|Teletronix|Urei|1176|LA-2A|Lexicon|Eventide|Boss|TC Electronic)\b/, `${id}: a gear maker/model name`);
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
      // the units, as drawn under each panel
      'EQ', 'COMP', 'GATE', 'DIST', 'MOD', 'DELAY', 'REVERB', 'STEREO', 'LIMIT', 'SRC', 'OUT', 'bypassed',
      // bezel readouts + their values
      'CHAIN', 'SCENE', 'CUSTOM', 'LIVE', 'IDLE',
      // dock keys, scenario + source options, the tray reset
      'MODULES', 'SCENARIO', 'SOURCE', 'EQ BOOST → COMP', 'DELAY → REVERB', 'GATE THE CLICK', 'HOT INTO LIMITER', 'FULL CHAIN', 'CLEAR CHAIN', 'CLICK 90', 'PINK NOISE', 'SINE 220',
      // unit captions (lab defaults) and the rack's own controls
      '−30 dB · 4:1', 'opens −35 dB', 'drive +12 dB', 'HIDE DISPLAY', 'GR', '⟲',
      // the SCENE short name the guide quotes, and LAB NOTES' contents
      'SQUASH', 'LAB NOTES', 'MARK AS REVIEWED', 'FINISH · SEE WHAT’S LEFT',
    ],
    learn: ['LEARN', 'EXPLORE', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'EQ BOOST → COMP', 'HOT INTO LIMITER', 'MODULES', 'Gain-staging into the limiter', 'EQ→comp', 'SINE 220'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(CHAIN_SCREEN_GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf((CHAIN_SCREEN_GUIDES as unknown as Record<string, Guide>)[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the five scenarios and three sources are exactly the ones the guide lists', () => {
    const s = code(SCREEN);
    const scen = [...s.matchAll(/key: '[a-z_]+', label: '([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(scen, ['EQ BOOST → COMP', 'DELAY → REVERB', 'GATE THE CLICK', 'HOT INTO LIMITER', 'FULL CHAIN']);
    const src = [...s.matchAll(/\{ label: '([A-Z0-9 ]+)', short: '[A-Z]+', gen:/g)].map((m) => m[1]);
    assert.deepEqual(src, ['CLICK 90', 'PINK NOISE', 'SINE 220']);
  });
});

describe('4. the TRY THIS numbers follow from the lab and the engine', () => {
  const s = code(SCREEN);
  const fx = code('modules/ape-dsp/ios/core/Effects.hpp');
  it('the inputs: −20 dB source, −25 dB ceiling, comp −30 dB 4:1, soft-clip drive +12 dB at full mix', () => {
    assert.match(s, /const GEN_LEVEL_DB = -20;/);
    assert.match(s, /\{ fx: FX\.limiter, param: P\.ceilingDb, value: -25 \}/);
    assert.match(s, /\{ fx: FX\.comp, param: P\.thresholdDb, value: -30 \}/);
    assert.match(s, /\{ fx: FX\.comp, param: P\.ratio, value: 4 \}/);
    assert.match(s, /\{ fx: FX\.dist, param: P\.distType, value: 1 \}/);
    assert.match(s, /\{ fx: FX\.dist, param: P\.driveDb, value: 12 \}/);
    assert.match(s, /\{ fx: FX\.dist, param: P\.distMix, value: 1 \}/);
    assert.match(fx, /enum Type \{ Hard = 0, Soft = 1,/);
    assert.match(fx, /case Soft: return std::tanh\(x\);/);
    // limiter GR = envelope over the ceiling; the chain runs DIST before LIMIT
    assert.match(fx, /const double over = envDb - ceiling;\s*const double gr = over > 0\.0 \? over : 0\.0;/);
    assert.match(fx, /dist_\.processStereo\(L, R, n\);[\s\S]*?limiter_\.processStereo\(L, R, n\);/);
  });
  it('the arithmetic: LIMIT alone 4–5 dB, with DIST about 16 dB (headphones and phone speaker)', () => {
    const peak = 10 ** (-20 / 20);
    const spk = peak * 0.907; // 2nd-order 150 Hz high-pass at 220 Hz (−0.85 dB)
    const grLimit = (p: number) => 20 * Math.log10(p) - -25;
    const grDist = (p: number) => 20 * Math.log10(Math.tanh(p * 10 ** (12 / 20))) - -25;
    for (const p of [peak, spk]) {
      assert.ok(grLimit(p) >= 3.9 && grLimit(p) <= 5.01, `LIMIT alone ${grLimit(p).toFixed(2)}`);
      assert.ok(Math.abs(grDist(p) - 16) <= 0.7, `DIST + LIMIT ${grDist(p).toFixed(2)}`);
    }
    const t = CHAIN_SCREEN_GUIDES.explore.tryThis.join('\n');
    assert.match(t, /between −4 and −5 dB/);
    assert.match(t, /about −16 dB/);
    // and the screen prints GR as "GR −x.x dB"
    assert.match(code('src/screens/lab/chainRack.tsx'), /`GR −\$\{grv\.toFixed\(1\)\} dB`/);
  });

  // ── Sample-level re-run of the engine (audit 2026-10-31) ─────────────────
  // Effects.hpp DynamicsEffect (peak detector, limiter attack 0.1 ms),
  // Biquad.hpp lowShelf (RBJ) + highpass (2nd-order Butterworth, bilinear),
  // 48 kHz. The speaker route's 150 Hz high-pass sits on the generator,
  // BEFORE the chain — so every number must hold on both routes.
  it('the engine inputs the re-run copies', () => {
    assert.match(s, /\{ fx: FX\.eq, param: P\.eqBand\(0, 'type'\), value: EQ_BAND_TYPES\.lowShelf \}/);
    assert.match(s, /\{ fx: FX\.eq, param: P\.eqBand\(0, 'freq'\), value: 150 \}/);
    assert.match(s, /\{ fx: FX\.eq, param: P\.eqBand\(0, 'q'\), value: 0\.7 \}/);
    assert.match(s, /\{ fx: FX\.eq, param: P\.eqBand\(0, 'gain'\), value: 9 \}/);
    assert.match(s, /\{ fx: FX\.comp, param: P\.attackMs, value: 5 \}/);
    assert.match(s, /\{ fx: FX\.comp, param: P\.releaseMs, value: 120 \}/);
    assert.match(s, /\{ fx: FX\.limiter, param: P\.releaseMs, value: 120 \}/);
    assert.match(fx, /fx::onePole\(mode_ == LimiterMode \? 0\.1 : attackMs_\.load\(\), fs_\)/);
    assert.match(fx, /eq_\.processStereo\(L, R, n\);\s*comp_\.processStereo\(L, R, n\);/);
    assert.match(code('src/features/audio/speakerSafety.ts'), /export const SPEAKER_HPF_HZ = 150;/);
    assert.match(read('modules/ape-dsp/ios/core/Generator.hpp'), /HPF sits on the raw signal/);
    // EQ BOOST → COMP and HOT INTO LIMITER default to PINK NOISE (index 1),
    // which reads ~0 GR on the speaker — why the guide switches to SINE 220.
    assert.match(s, /key: 'bass_comp',[^\n]*sourceIdx: 1,/);
    assert.match(s, /key: 'squash',[^\n]*sourceIdx: 1,/);
    // …so both scenario lessons (also their SCENARIO tray blurbs) say so
    // honestly: headphones, or SOURCE on SINE 220 (vetted 2026-10-31).
    for (const key of ['bass_comp', 'squash']) {
      const lesson = s.match(new RegExp(`key: '${key}',[^\\n]*\\n\\s*lesson: '([^']*)'`))?.[1] ?? '';
      assert.match(lesson, /On the phone speaker most of the boosted bass is filtered out/, `${key} speaker note`);
      assert.match(lesson, /use headphones with the volume turned down first, or set SOURCE to SINE 220\./, `${key} way to hear it`);
    }
  });

  const FS = 48000;
  const onePole = (ms: number) => 1 - Math.exp(-1 / (0.001 * Math.max(ms, 0.01) * FS));
  type Co = { b0: number; b1: number; b2: number; a1: number; a2: number };
  const biquad = (c: Co) => {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    return (x: number) => { const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
  };
  const lowShelf = (f0: number, q: number, g: number): Co => {
    const A = 10 ** (g / 40), w = (2 * Math.PI * f0) / FS, cw = Math.cos(w), al = Math.sin(w) / (2 * q), t = 2 * Math.sqrt(A) * al;
    const a0 = A + 1 + (A - 1) * cw + t;
    return { b0: (A * (A + 1 - (A - 1) * cw + t)) / a0, b1: (2 * A * (A - 1 - (A + 1) * cw)) / a0, b2: (A * (A + 1 - (A - 1) * cw - t)) / a0, a1: (-2 * (A - 1 + (A + 1) * cw)) / a0, a2: (A + 1 + (A - 1) * cw - t) / a0 };
  };
  const highpass = (f0: number): Co => {
    const w = 2 * Math.PI * f0, K = 2 * FS, K2 = K * K, A1 = w / Math.SQRT1_2, A0 = w * w, a0 = K2 + A1 * K + A0;
    return { b0: K2 / a0, b1: (-2 * K2) / a0, b2: K2 / a0, a1: (2 * A0 - 2 * K2) / a0, a2: (K2 - A1 * K + A0) / a0 };
  };
  const dyn = (limiter: boolean, thr: number, ratio: number, attMs: number, relMs: number) => {
    let env = 0;
    const aA = onePole(limiter ? 0.1 : attMs), aR = onePole(relMs);
    return (x: number): [number, number] => {
      const ax = Math.abs(x);
      env += (ax > env ? aA : aR) * (ax - env);
      const over = 20 * Math.log10(env + 1e-9) - thr;
      const gr = over > 0 ? (limiter ? over : over * (1 - 1 / ratio)) : 0;
      return [x * 10 ** (-gr / 20), gr];
    };
  };
  /** SINE 220 at −20 dB peak through the chosen units; the GR the screen
   *  would print (toFixed(1)), max over the last second of a 1.5 s run. */
  const run = (o: { eq?: boolean; comp?: boolean; dist?: boolean; lim?: boolean; speaker?: boolean }) => {
    const hp = o.speaker ? biquad(highpass(150)) : (x: number) => x;
    const eq = o.eq ? biquad(lowShelf(150, 0.7, 9)) : (x: number) => x;
    const comp = o.comp ? dyn(false, -30, 4, 5, 120) : null;
    const lim = o.lim ? dyn(true, -25, 1, 0, 120) : null;
    let c = 0, l = 0;
    for (let i = 0; i < FS * 1.5; i++) {
      let x = eq(hp(0.1 * Math.sin((2 * Math.PI * 220 * i) / FS)));
      let gc = 0, gl = 0;
      if (comp) [x, gc] = comp(x);
      if (o.dist) x = Math.tanh(x * 10 ** (12 / 20));
      if (lim) [x, gl] = lim(x);
      if (i > FS * 0.5) { c = Math.max(c, gc); l = Math.max(l, gl); }
    }
    return { comp: +c.toFixed(1), limit: +l.toFixed(1) };
  };

  for (const speaker of [false, true]) {
    const route = speaker ? 'phone speaker' : 'headphones';
    it(`EXPLORE TRY THIS 1–2 on ${route}: LIMIT alone between −4 and −5, with DIST about −16`, () => {
      const a = run({ lim: true, speaker });
      assert.ok(a.limit >= 4.0 && a.limit <= 5.0, `LIMIT alone ${a.limit}`);
      const b = run({ dist: true, lim: true, speaker });
      assert.ok(Math.abs(b.limit - 16) <= 0.6, `DIST + LIMIT ${b.limit}`);
    });
    it(`EXPLORE TRY THIS 3 + LEARN TRY THIS on ${route}: EQ + COMP about −8, COMP alone about −7 (−6 on the speaker), LIMIT 0.0 after COMP`, () => {
      const withEq = run({ eq: true, comp: true, speaker });
      const noEq = run({ comp: true, speaker });
      assert.equal(Math.round(withEq.comp), 8, `EQ + COMP ${withEq.comp}`);
      assert.equal(Math.round(noEq.comp), speaker ? 6 : 7, `COMP alone ${noEq.comp}`);
      assert.ok(withEq.comp - noEq.comp > 1, 'bypassing EQ drops COMP by over 1 dB');
      const squash = run({ eq: true, comp: true, lim: true, speaker });
      assert.equal(squash.limit, 0, `HOT INTO LIMITER on SINE 220: LIMIT ${squash.limit}`);
      assert.equal(Math.round(squash.comp), 8);
    });
  }
  it('the guide states exactly those readings', () => {
    const ex = CHAIN_SCREEN_GUIDES.explore.tryThis.join('\n');
    assert.match(ex, /set SOURCE to SINE 220, play: COMP reads about −8 dB\. Bypass EQ in MODULES: about −7 \(about −6 on the phone speaker\)/);
    const le = CHAIN_SCREEN_GUIDES.learn.tryThis;
    assert.match(le[0], /EQ BOOST → COMP with SOURCE on SINE 220 and bypass EQ in MODULES — COMP’s GR falls by over 1 dB/);
    assert.match(le[1], /Gain-staging into the limiter[\s\S]*HOT INTO LIMITER with SOURCE on SINE 220: COMP reads about −8 dB, LIMIT 0\.0/);
    // no step leans on PINK NOISE for a GR number (it reads ~0 on the speaker)
    for (const t of [...CHAIN_SCREEN_GUIDES.explore.tryThis, ...le]) assert.doesNotMatch(t, /PINK NOISE/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  const s = code(SCREEN);
  it('LabShell gets the per-tab guide function from chainScreenGuides', () => {
    assert.match(s, /import \{ chainScreenGuide \} from '\.\/chainScreenGuides';/);
    assert.match(s, /<LabShell[\s\S]*?guide=\{chainScreenGuide\}/);
    // the shell draws the key + hint and hosts the overlay (regions in rack EXPLORE)
    const shell = code('src/screens/lab/LabShell.tsx');
    assert.match(shell, /typeof guide === 'function' \? guide\(mode\)/);
    assert.match(shell, /<ScreenGuideHost resetKey=\{mode\} regions=\{!!rack && mode === 'explore'\}>/);
    assert.match(s, /rack=\{\{/);
  });
  it('a CONCEPT lab: no live mic, no real-world measurement — the chip gives its spot to the ⓘ', () => {
    assert.match(s, /<LabShell[\s\S]*?accuracy=\{false\}/);
    assert.doesNotMatch(s, /<AccuracyNote/);
    // The reason (re-vetted 2026-10-31): no microphone is ever opened — the
    // engine only runs its own generator + effects (ApeDsp.start() is mic
    // capture, never called here), so the GR numbers are the engine's gain
    // reduction on a built-in test source, not a reading of a real signal.
    const calls = new Set([...s.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    assert.ok(calls.size > 0);
    for (const c of calls) assert.match(c, /^(gen|fx)[A-Z]\w*$|^(isAvailable|engineVersion)$/, `ApeDsp.${c} — not a generator/effects call`);
    assert.doesNotMatch(s, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
    // The honesty disclosure stays on the faceplate.
    assert.match(s, /badge: 'MODULES RUN LAB-DEFAULT SETTINGS — GR METERS MEASURED, LIVE'/);
  });
});
