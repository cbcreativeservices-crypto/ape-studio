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
import { readFileSync, readdirSync } from 'node:fs';
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
    assert.match(shell, /<ScreenGuideHost resetKey=\{`\$\{mode\}:\$\{guideIdOf\(shownGuide\)\}`\} regions=\{!!rack && mode === 'explore'\}>/);
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

// ── D41 J3 (2026-11-01): the chain writes every dynamics param it relies on ──
// Engine params PERSIST across labs (EffectChain::reset only disables nodes),
// so a param the chain does not write is whatever the last lab left. The gate's
// HOLD was unwritten: after the Gate lab its GR peak swung 38–47 dB with the
// Gate lab's HOLD chip (0 / 10 / 100 ms). The comp's MAKEUP was unwritten too:
// the Compression lab's +6 dB would ride in and feed LIMIT 6 dB hotter.
describe('6. every dynamics param the engine reads is written by the chain (D41 J3)', () => {
  const s = code(SCREEN);
  const fx = code('modules/ape-dsp/ios/core/Effects.hpp');
  const written = (node: string) => {
    const block = s.slice(s.indexOf(`[FX.${node}]: [`));
    return new Set([...block.slice(0, block.indexOf('],')).matchAll(/param: P\.(\w+), value:/g)].map((m) => m[1]));
  };
  it('the engine facts this rests on: what each mode reads, and that reset only disables', () => {
    assert.match(fx, /void reset\(\) \{\s*for \(int id = fx::Eq; id <= fx::Limiter; \+\+id\) set\(id, 0, 0\.0\);\s*\}/);
    // the limiter forces its own 0.1 ms attack and reads only ceiling + release
    assert.match(fx, /fx::onePole\(mode_ == LimiterMode \? 0\.1 : attackMs_\.load\(\), fs_\)/);
    assert.match(fx, /const double over = envDb - ceiling;/);
    // comp: threshold, ratio, attack, release, makeup
    assert.match(fx, /gain = std::pow\(10\.0, -gr \/ 20\.0\) \* makeup;/);
    // gate: threshold, attack, release, range, hold
    assert.match(fx, /holdLeft_ = holdSamples;/);
    assert.match(fx, /const double floorG = std::pow\(10\.0, range \/ 20\.0\);/);
  });
  it('COMP writes threshold, ratio, attack, release and MAKEUP 0', () => {
    for (const p of ['thresholdDb', 'ratio', 'attackMs', 'releaseMs', 'makeupDb']) assert.ok(written('comp').has(p), `comp ${p}`);
    assert.match(s, /\{ fx: FX\.comp, param: P\.makeupDb, value: 0 \}/);
  });
  it('GATE writes threshold, range, release, attack and HOLD 10 ms (the Gate lab default)', () => {
    for (const p of ['thresholdDb', 'rangeDb', 'releaseMs', 'attackMs', 'holdMs']) assert.ok(written('gate').has(p), `gate ${p}`);
    assert.match(s, /\{ fx: FX\.gate, param: P\.holdMs, value: 10 \}/);
    const cfg = code('src/screens/lab/fxLabConfigs.tsx');
    assert.match(cfg, /label: 'HOLD', paramId: P\.holdMs[\s\S]*?initial: 10,/);
  });
  it('LIMIT writes ceiling and release', () => {
    for (const p of ['ceilingDb', 'releaseMs']) assert.ok(written('limiter').has(p), `limiter ${p}`);
  });
  it('the chain gate on CLICK 90 (−35 dB, −70 floor, 100 ms, 1 ms attack): HOLD changes its GR, so it must be pinned', () => {
    const FS = 48000;
    const op = (ms: number) => 1 - Math.exp(-1 / (0.001 * Math.max(ms, 0.01) * FS));
    const grMax = (holdMs: number) => {
      const aA = op(1), aR = op(100), hN = Math.floor(holdMs * 0.001 * FS), fl = 10 ** (-70 / 20);
      let env = 0, g = 1, hl = 0, mx = 0;
      for (let i = 0; i < FS * 4; i++) {
        const t = (i / FS) % (60 / 90);
        const x = t < 0.005 ? 0.1 * 0.5 * (1 - Math.cos((2 * Math.PI * t) / 0.005)) * Math.sin(2 * Math.PI * 1000 * t) : 0;
        const ax = Math.abs(x);
        env += (ax > env ? aA : aR) * (ax - env);
        if (20 * Math.log10(env + 1e-9) > -35) { hl = hN; g += aA * (1 - g); } else if (hl > 0) hl--; else g += aR * (fl - g);
        if (i >= FS * 2) mx = Math.max(mx, -20 * Math.log10(g + 1e-9));
      }
      return mx;
    };
    const [h0, h10, h100] = [0, 10, 100].map(grMax);
    assert.ok(h0 - h100 > 5, `HOLD moves the gate's GR peak (${h0.toFixed(1)} vs ${h100.toFixed(1)})`);
    assert.ok(h10 > 40 && h10 < 50, `at the written 10 ms: ${h10.toFixed(1)} dB`);
  });

  // ── The generic guard (round 2): EVERY node the chain enables, EVERY param
  // any lab or screen writes. Lab writes come from the twelve effect-lab
  // configs (`fixed` + `params`, on their `fxId`) and from every direct
  // ApeDsp.fxSet call in src/ (the EQ audition modules, the Playground).
  /** "node:param" — EQ bands as "eq:eqBand<b>.<field>". */
  const key = (node: string, p: string) => `${node}:${p.replace(/^eqBand\((\d), '(\w+)'\)$/, 'eqBand$1.$2')}`;
  const chainWrites = () => {
    const d = s.slice(s.indexOf('const DEFAULTS'), s.indexOf('const SCENARIOS'));
    return new Set([...d.matchAll(/\{ fx: FX\.(\w+), param: P\.(eqBand\(\d, '\w+'\)|\w+), value:/g)].map((m) => key(m[1], m[2])));
  };
  const labWrites = () => {
    const out = new Map<string, string>(); // key → who writes it
    const cfg = code('src/screens/lab/fxLabConfigs.tsx');
    const alias = new Map([...cfg.matchAll(/^const ([A-Z_]+) = P\.(eqBand\(\d, '\w+'\)|\w+);/gm)].map((m) => [m[1], m[2]]));
    const blocks = cfg.split(/\nconst (?=\w+Config: FxLabConfig = \{)/).slice(1);
    assert.ok(blocks.length >= 12, `found ${blocks.length} effect-lab configs`);
    for (const b of blocks) {
      const name = b.slice(0, b.indexOf(':'));
      const node = b.match(/fxId: FX\.(\w+),/)?.[1];
      assert.ok(node, `${name}: no fxId`);
      for (const m of b.matchAll(/paramId: (P\.(eqBand\(\d, '\w+'\)|\w+)|[A-Z_]+)\b/g)) {
        const p = m[2] ?? alias.get(m[1]);
        assert.ok(p, `${name}: unknown param alias ${m[1]}`);
        out.set(key(node!, p!), name);
      }
    }
    const walk = (dir: string): string[] =>
      readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);
    for (const f of walk('src')) {
      if (f.endsWith('SignalChainLabScreen.tsx')) continue;
      const c = code(f);
      for (const m of c.matchAll(/ApeDsp\.fxSet\(FX\.(\w+), FX_PARAM\.(?:eqBand\((\w+), '(\w+)'\)|(\w+))/g)) {
        if (m[4]) { out.set(key(m[1], m[4]), f); continue; }
        // a loop variable band (eqAudition pushBands) can be any of the six
        const bands = /^\d$/.test(m[2]) ? [m[2]] : ['0', '1', '2', '3', '4', '5'];
        for (const b of bands) out.set(key(m[1], `eqBand(${b}, '${m[3]}')`), f);
      }
    }
    return out;
  };
  /** Params the chain may leave unwritten, each with the engine line that
   *  makes it inert in the chain's settings. */
  const INERT: Record<string, RegExp> = {
    // the chain's MOD runs CHORUS (modMode 0): centre frequency and stages are phaser-only
    'mod:centerHz': /if \(mode == Phaser\) \{\s*const int stages = stages_\.load\(\);\s*const double c0 = centerHz_\.load\(\);/,
    'mod:stages': /if \(mode == Phaser\) \{\s*const int stages = stages_\.load\(\);/,
    'mod:enabled': /./, 'eq:enabled': /./, 'stereo:enabled': /./, 'delay:enabled': /./, // the MODULES toggle
  };
  // bands 1–5 are written OFF, and an off band's freq / q / gain are never read
  for (const b of [1, 2, 3, 4, 5]) for (const f of ['freq', 'q', 'gain']) INERT[`eq:eqBand${b}.${f}`] = /const int t = bands_\[i\]\.type\.load\(std::memory_order_relaxed\);\s*if \(t == Off\) continue;/;

  it('the chain enables all nine nodes (FULL CHAIN), so every node is covered', () => {
    const full = s.match(/key: 'full',[^\n]*enable: \[([^\]]+)\]/)?.[1] ?? '';
    assert.deepEqual(full.split(',').map((x) => x.trim()), ['FX.eq', 'FX.comp', 'FX.gate', 'FX.dist', 'FX.mod', 'FX.delay', 'FX.reverb', 'FX.stereo', 'FX.limiter']);
  });
  it('every param any lab or screen writes is written by the chain too (or is inert in the chain’s settings)', () => {
    const chain = chainWrites();
    const missing: string[] = [];
    for (const [k, who] of labWrites()) {
      if (chain.has(k)) continue;
      const inert = INERT[k];
      if (inert && inert.test(fx)) continue;
      missing.push(`${k} (written by ${who})`);
    }
    assert.deepEqual(missing, []);
  });
  it('the guard sees the leaks it was written for (it is not vacuous)', () => {
    const w = labWrites();
    for (const k of ['stereo:pan', 'stereo:delayRms', 'stereo:invertR', 'stereo:monoFold', 'stereo:bassMonoHz', 'eq:eqBand5.type', 'mod:modFeedback', 'mod:centerMs', 'delay:pingpong', 'delay:dampHz', 'reverb:preDelayMs', 'reverb:reverbDampHz', 'dist:oversample', 'gate:holdMs', 'comp:makeupDb']) {
      assert.ok(w.has(k), `no lab writes ${k} any more — trim the chain or this list`);
    }
    assert.match(w.get('stereo:pan') ?? '', /FoundationsPlaygroundScreen\.tsx|Config/);
  });
  it('the values are each lab’s initial value = the engine default', () => {
    const want: [string, string][] = [
      ['stereo', 'pan, value: 0'], ['stereo', 'monoFold, value: 0'], ['stereo', 'invertR, value: 0'], ['stereo', 'delayRms, value: 0'], ['stereo', 'bassMonoHz, value: 0'],
      ['mod', 'modFeedback, value: 0'], ['mod', 'centerMs, value: 20'], ['delay', 'pingpong, value: 0'], ['delay', 'dampHz, value: 6000'],
      ['reverb', 'preDelayMs, value: 20'], ['reverb', 'reverbDampHz, value: 5500'], ['dist', 'oversample, value: 1'],
    ];
    for (const [n, tail] of want) assert.ok(s.includes(`{ fx: FX.${n}, param: P.${tail} }`), `${n} ${tail}`);
    for (const b of [1, 2, 3, 4, 5]) assert.ok(s.includes(`{ fx: FX.eq, param: P.eqBand(${b}, 'type'), value: EQ_BAND_TYPES.off }`), `EQ band ${b} off`);
    assert.match(fx, /pan_\{0\.0\}, delayRms_\{0\.0\}, bassMonoHz_\{0\.0\}/);
    assert.match(fx, /enabled_\{false\}, monoFold_\{false\}, invertR_\{false\}/);
    assert.match(fx, /feedback_\{0\.0\}, mix_\{0\.5\};\s*std::atomic<double> centerMs_\{20\.0\}/);
    assert.match(fx, /dampHz_\{6000\.0\};\s*std::atomic<bool> pingpong_\{false\};/);
    assert.match(fx, /preDelayMs_\{20\.0\}, dampHz_\{5500\.0\}/);
    assert.match(fx, /enabled_\{false\}, oversample_\{true\};/);
  });
});
