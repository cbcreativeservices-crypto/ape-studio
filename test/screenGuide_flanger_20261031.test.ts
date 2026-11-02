/**
 * Screen Guide rollout — Flanger Lab (2026-10-31) — receipts.
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

const { FLANGER_SCREEN_GUIDES, flangerScreenGuide } = await import('../src/screens/lab/flangerScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = FLANGER_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CONFIGS = code('src/screens/lab/fxLabConfigs.tsx');
/** This lab's config block only. */
const CFG = CONFIGS.slice(CONFIGS.indexOf('const flangerConfig: FxLabConfig'), CONFIGS.indexOf('export const FlangerLabScreen'));
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

describe('1. every Flanger screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has a CHECK tab)', () => {
    assert.deepEqual(Object.keys(FLANGER_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*flanger: FLANGER,/m, 'flanger lost its CHECK tab — drop the check guide');
    for (const m of ['explore', 'learn', 'check'] as const) assert.equal(flangerScreenGuide(m), FLANGER_SCREEN_GUIDES[m]);
    assert.equal(flangerScreenGuide('other'), undefined);
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
      'FLANGER', 'IN ▸', '▸ OUT', 'SPECTRUM (dB)', 'PINK NOISE', 'WHITE NOISE', '100', '1k', '10k',
      // bezel + dock + tray choices (config labels / shorts)
      'CENTER', 'RATE', 'FDBK', 'FEEDBACK', 'SWEEP', 'DEPTH', 'MIX', 'SOURCE',
      '0.2 Hz JET', '5 Hz WARBLE', '70% METALLIC', '−70% HOLLOW', '50% EVEN', '90%',
      // the header transport, the rack's own controls, the well
      '▶', '■', 'HIDE DISPLAY', 'FULL SCREEN', 'LAB NOTES', 'DESIGNED RESPONSE',
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'Manual / Delay time', 'LFO Waveform', 'Stereo width', 'Through-Zero', 'TZF', 'ADV', 'CENTER', 'SWEEP', 'FDBK', '50% EVEN'],
    check: ['CHECK YOUR UNDERSTANDING', 'still to get right', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'Lab complete', 'LEARN', 'EXPLORE', 'CENTER', 'SOURCE', 'FDBK'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(FLANGER_SCREEN_GUIDES).sort());
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
  it('the dock is CENTER (fader) · SWEEP (RATE + DEPTH) · FDBK · MIX · SOURCE, the bezel CENTER · RATE · FDBK, the sources PINK + WHITE NOISE', () => {
    const labels = [...CFG.matchAll(/label: '([A-Z ]+)', (?:short: '([A-Z]+)', )?paramId:/g)].map((m) => m[2] ?? m[1]);
    assert.deepEqual(labels, ['CENTER', 'RATE', 'DEPTH', 'FDBK', 'MIX']);
    assert.match(CFG, /id: 'sweep', label: 'SWEEP', paramIds: \[P\.rateHz, P\.depth\]/);
    assert.deepEqual([...CFG.matchAll(/\{ k: '([A-Z]+)', paramId/g)].map((m) => m[1]), ['CENTER', 'RATE', 'FDBK']);
    assert.match(CFG, /sources: \[SRC_PINK, SRC_WHITE\]/);
    assert.match(code(FX_SCREEN), /label: 'SOURCE'/);
    // the analyzers' labels: the source name on IN, SPECTRUM (dB) on OUT
    assert.match(ANIM, /text=\{white \? 'WHITE NOISE' : 'PINK NOISE'\}/);
    assert.match(ANIM, /text="SPECTRUM \(dB\)"/);
    assert.match(ANIM, /\[100, '100'\],\s*\[1000, '1k'\],\s*\[10000, '10k'\]/);
    assert.match(ANIM, /case 'mod': return model\.flavor === 'chorus' \? 'CHORUS' : 'FLANGER';/);
  });
  it('the LEARN page lists the three controls the guide says are not in this dock', () => {
    const c = code('src/features/lab/guidedLessons/content.ts');
    const block = c.slice(c.indexOf('  flanger: {'), c.indexOf('  phaser: {'));
    for (const k of ['lfo_wave', 'stereo_offset', 'tzf']) assert.match(block, new RegExp(`key: '${k}'`));
    assert.match(block, /key: 'tzf'[\s\S]*?advanced: true/);
    assert.doesNotMatch(CFG, /lessonKey: '(lfo_wave|stereo_offset|tzf)'/, 'one of them is on the dock now — update the LEARN guide');
  });
  it('the CHECK tab has the four questions the guide counts', () => {
    const u = code('src/features/lab/understandingChecks.ts');
    const block = u.slice(u.indexOf('const FLANGER: readonly Q[]'), u.indexOf('const PHASER: readonly Q[]'));
    assert.equal((block.match(/^\s{4}id: '/gm) ?? []).length, 4);
    const opts = [...block.matchAll(/options: \[([\s\S]*?)\],\n/g)];
    assert.equal(opts.length, 4);
    for (const q of opts) assert.equal((q[1].match(/'[^'\n]+'/g) ?? []).length, 4, 'four answers each');
    assert.match(textOf(GUIDES.check), /four questions, four answers each/);
  });
});

/** The engine's flanger, |H(f)| (Effects.hpp ModEffect mode 1):
 *  wet = x(t−τ) + fb·wet(t−τ), out = (1 − mix)·x + mix·wet. */
function flangerMag(tauMs: number, mix: number, fb: number, f: number): number {
  const th = 2 * Math.PI * f * (tauMs / 1000);
  const ar = Math.cos(th), ai = -Math.sin(th);
  const dr = 1 - fb * ar, di = -fb * ai;
  const den = dr * dr + di * di;
  const wr = (ar * dr + ai * di) / den, wi = (ai * dr - ar * di) / den;
  return Math.hypot(1 - mix + mix * wr, mix * wi);
}
const dB = (m: number) => 20 * Math.log10(Math.max(m, 1e-9));
/** Min and max of |H| in dB over one comb period at τ. */
function extremes(tauMs: number, mix: number, fb: number): { lo: number; hi: number } {
  let lo = Infinity, hi = -Infinity;
  const period = 1000 / tauMs;
  for (let i = 0; i <= 4000; i++) {
    const v = dB(flangerMag(tauMs, mix, fb, (period * i) / 4000));
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return { lo, hi };
}

describe('4. the TRY THIS numbers follow from the config and the engine', () => {
  const fmt2sig = (v: number) => (v < 1 ? v.toFixed(2) : v.toFixed(1));
  it('the law the guide works from is the engine’s and the display’s', () => {
    const eng = code('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(eng, /buf_\[w_\] = static_cast<float>\(L\[i\] \+ wetL \* fb\);/);
    assert.match(eng, /L\[i\] = static_cast<float>\(L\[i\] \* \(1\.0 - mix\) \+ wetL \* mix\);/);
    assert.match(eng, /const double sweepMs = \(mode == Flanger\) \? baseMs \* 0\.85 : 6\.0;/);
    assert.match(code('src/features/lab/fxViz.tsx'), /const hr = 1 - mix \+ mix \* wr;/);
    assert.match(CFG, /fixed: \[\{ paramId: P\.modMode, value: 1 \}\]/);
  });
  it('CENTER fader: 0.50–5.0 ms, starts at 2.0 ms (fmt2sig)', () => {
    assert.match(code('src/features/lab/sliderMaps.ts'), /export const fmt2sig = \(v: number\): string => \(v < 1 \? v\.toFixed\(2\) : v\.toFixed\(1\)\);/);
    assert.match(CFG, /initial: 2,\s*fader: \{ min: 0\.5, max: 5, log: true, snap: snap2sig, format: \(v\) => `\$\{fmt2sig\(v\)\} ms` \}/);
    assert.ok(textOf(GUIDES.explore).includes(`CENTER fader (${fmt2sig(0.5)}–${fmt2sig(5)} ms, starts at ${fmt2sig(2)} ms)`));
  });
  it('the caption’s spacing = round(1 / delay): 0.50 → 2000, 2.0 → 500, 5.0 → 200 Hz', () => {
    assert.match(CFG, /`Notches every \$\{Math\.round\(1 \/ \(v\[P\.centerMs\] \/ 1000\)\)\} Hz \(spacing = 1\/delay\)/);
    const sp = (ms: number) => Math.round(1 / (ms / 1000));
    assert.deepEqual([sp(0.5), sp(2), sp(5)], [2000, 500, 200]);
    const ex = textOf(GUIDES.explore);
    assert.ok(ex.includes(`from notches every ${sp(2)} Hz to every ${sp(0.5)} Hz`));
    assert.ok(ex.includes(`every ${sp(2)} Hz at 2.0 ms`));
    assert.ok(textOf(GUIDES.learn).includes(`notches every ${sp(5)} Hz`));
  });
  it('FDBK 0% → 70% at MIX 50%: the peaks go from the dotted line (0 dB) to well above it (+6.7 dB)', () => {
    assert.match(CFG, /\{ label: '70% METALLIC', value: 0\.7 \}/);
    assert.match(CFG, /\{ label: '50% EVEN', value: 0\.5 \}/);
    const p0 = extremes(2, 0.5, 0).hi, p4 = extremes(2, 0.5, 0.4).hi, p7 = extremes(2, 0.5, 0.7).hi;
    assert.ok(Math.abs(p0) < 0.05, `fb 0 peak ${p0}`);
    assert.ok(Math.abs(p4 - 2.5) < 0.1, `fb 40% peak ${p4}`);
    assert.ok(Math.abs(p7 - 6.7) < 0.1, `fb 70% peak ${p7}`);
    // the analyzer draws 1.9 px per dB: +6.7 dB is ~13 px over the dotted line
    assert.match(ANIM, /const SPEC_PX_PER_DB = 1\.9;/);
    assert.ok(p7 * 1.9 > 12);
  });
  it('MIX 100% (FDBK 40%): only shallow ripples — the deep notches vanish', () => {
    const { lo, hi } = extremes(2, 1, 0.4);
    assert.ok(lo > -3.5 && hi < 5, `${lo} / ${hi}`);
    assert.ok(extremes(2, 0.5, 0.4).lo < -15, 'at 50% the notch is deep');
  });
  it('no guide line claims what the engine does not draw (deeper notches from FDBK, a hollow picture at −70%)', () => {
    // positive FDBK makes the 50% notches SHALLOWER; −70% at 50% is nearly flat
    assert.ok(extremes(2, 0.5, 0.4).lo > extremes(2, 0.5, 0).lo);
    const neg = extremes(2, 0.5, -0.7);
    assert.ok(neg.hi - neg.lo < 4, `−70%: ${neg.lo} / ${neg.hi}`);
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /deepen|deeper notch|hollow (tone|sound|picture)/i, id);
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
    assert.ok(CFG.includes(`${guideKey}: flangerScreenGuide,`), `config lacks ${guideKey}: flangerScreenGuide`);
    assert.ok(CFG.includes(`${accKey}: false,`), `config lacks ${accKey}: false`);
  });
});

describe('6. guide review fixes (2026-10-31, each re-checked against the code)', () => {
  it('LEARN does not say "nothing plays": the header ▶ shows on every tab and the rack stays mounted', () => {
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{headerAction \? <View style=\{styles\.headerAction\}/);
    assert.doesNotMatch(textOf(GUIDES.learn), /Nothing here plays/);
    assert.ok(GUIDES.learn.seeing[0].includes('the ▶ in the header still plays or stops the sound'));
  });
  it('Through-Zero is a specialty, not "many flangers"; stereo width is FIXED at a quarter cycle in the engine', () => {
    assert.match(code('modules/ape-dsp/ios/core/Effects.hpp'), /const double sR = std::sin\(2\.0 \* fx::kPi \* \(lfo_ \+ 0\.25\)\);/);
    const t = textOf(GUIDES.learn);
    assert.doesNotMatch(t, /found on many flangers/);
    assert.ok(t.includes('Through-Zero is a specialty') && t.includes('a quarter cycle apart'));
  });
});

describe('7. −70% HOLLOW is hollow only at full wet (screen + lesson copy, 2026-10-31)', () => {
  // Worked: H = (1−m) + m·z/(1−fb·z). m 0.5 / fb −0.7 → +1.34 / −2.00 dB (almost flat);
  // m 1 / fb −0.7 → +10.46 / −4.61 dB (the resonant, hollow comb).
  it('the maths: a ~3 dB ripple at 50% MIX, peaks above +10 dB at 100%', () => {
    const half = extremes(2, 0.5, -0.7), full = extremes(2, 1, -0.7);
    assert.ok(Math.abs(half.hi - 1.34) < 0.05 && Math.abs(half.lo + 2.0) < 0.05, `50%: ${half.lo} / ${half.hi}`);
    assert.ok(full.hi > 10 && Math.abs(full.lo + 4.61) < 0.05, `100%: ${full.lo} / ${full.hi}`);
  });
  it('the screen copy says so, and the check hint points at positive feedback', () => {
    assert.ok(CFG.includes('Negative feedback at 50% MIX almost cancels the comb out — set MIX to 100% to hear the hollow tone.'));
    assert.ok(CFG.includes('at −70% that is the hollow, through-a-tube tone'));
    assert.doesNotMatch(CFG, /gentle ripples/);
    assert.doesNotMatch(CFG, /Math\.abs\(v\[P\.modFeedback\]\) >= 0\.7/);
    assert.ok(CFG.includes("wrongHint: 'Step FDBK from 0% to 70% METALLIC and watch the peaks between the notches on OUT rise above the dotted input line.'"));
    // the card's answer/reveal follow the maths: peaks grow (0 → +2.5 → +6.7 dB), notches get SHALLOWER
    assert.ok(CFG.includes("'The peaks between the notches grow tall and narrow and ring"));
    // D42 r2 (owner GO 2026-11-01): the CHECK reveal follows the maths too — taller,
    // narrower peaks; never "deeper contrast" or "deeper notches".
    assert.ok(CFG.includes('the peaks between the notches grow taller and narrower, so the comb sounds sharper and more resonant'));
    assert.doesNotMatch(CFG, /deeper contrast/);
    assert.doesNotMatch(CFG, /deeper notches/);
    assert.doesNotMatch(CFG, /The notches sharpen/);
  });
  it('the lesson’s negative-feedback lines name the full-wet condition', () => {
    const L = read('src/features/lab/guidedLessons/content.ts');
    assert.ok(L.includes('at full wet (100% mix) it gives the hollow "through-a-tube" tone, but at 50/50 it mostly flattens the comb'));
    assert.ok(L.includes('Negative feedback + short delay at full wet (100% mix) = the hollow, resonant "jet"'));
  });
  it('the guide’s TRY THIS names the full-wet condition too (D42, 2026-11-01)', () => {
    assert.ok(GUIDES.explore.tryThis.join(' ').includes('pick FDBK −70% HOLLOW: it sounds hollow only at 100%; at 50% EVEN it almost cancels the comb out'));
  });
});

describe('8. MIX 50% is EVEN, not always DEEPEST (verified 2026-10-31)', () => {
  // out = (1−m)·x + m·wet, wet = z/(1−fb·z). Full null needs m = (1+fb)/(2+fb),
  // so 50% is the null only at FDBK 0%; at −70% HOLLOW, 50% is the SHALLOWER chip.
  it('the maths: 50% is not the deepest point once FDBK is on', () => {
    assert.ok(extremes(2, 0.5, 0.4).lo > -18, `fb 40%: ${extremes(2, 0.5, 0.4).lo}`);
    assert.ok(extremes(2, 0.5, -0.7).lo > extremes(2, 1, -0.7).lo, 'at −70% the 100% chip dips deeper');
  });
  it('the chip, caption and lesson do not claim "deepest at 50%"', () => {
    assert.match(CFG, /\{ label: '50% EVEN', value: 0\.5 \}/);
    assert.doesNotMatch(CFG, /DEEPEST|deepest comb/);
    const L = read('src/features/lab/guidedLessons/content.ts');
    assert.ok(L.includes('Comb notches are deepest near 50% (equal dry+wet). With no feedback they cancel fully at exactly 50%'));
    assert.doesNotMatch(L, /deepest at 50%/);
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /DEEPEST|deepest at 50%/, id);
  });
});
