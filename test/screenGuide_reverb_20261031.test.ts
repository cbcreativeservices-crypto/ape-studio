/**
 * Screen Guide rollout — Reverb Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (a LabShell rack lab).
 *
 *   1. every screen the learner reaches has a guide — the three LabShell tabs
 *      EXPLORE (the rack), LEARN (the reading page) and CHECK (the
 *      understanding check: the lab has authored questions, so the tab
 *      exists) — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the lab's source;
 *   4. the TRY THIS numbers are what the screen draws at that setting — the
 *      glass is re-run with fxAnim's OWN revCol / onePoleGain / hashW (the
 *      functions are lifted out of fxAnim.tsx and evaluated, so a change to
 *      the drawing re-checks the guide), plus fxViz DecayCurveGraph and the
 *      reverbConfig caption;
 *   5. wiring + chip decision: a CONCEPT lab (built-in test source, a
 *      teaching model badged "not a measurement", no microphone; RT60 here is
 *      an effect SETTING, not a room measurement) → the guide function and
 *      `accuracy: false`. FxLabScreen.tsx is shared by all 12 effect labs and
 *      does not yet forward `guide` / `accuracy` to LabShell; the test
 *      switches on by itself the moment it does.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { REVERB_SCREEN_GUIDES, reverbScreenGuide } = await import('../src/screens/lab/reverbScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { fmt2sig, snap2sig } = await import('../src/features/lab/sliderMaps.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = REVERB_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CONFIGS = code('src/screens/lab/fxLabConfigs.tsx');
/** The reverbConfig block alone (up to its screen export). */
const REVERB = CONFIGS.slice(CONFIGS.indexOf('const reverbConfig: FxLabConfig = {'), CONFIGS.indexOf('export const ReverbLabScreen'));
const SCREEN = code('src/screens/lab/FxLabScreen.tsx');
const ANIM_RAW = read('src/screens/lab/fxAnim.tsx');
const ANIM = code('src/screens/lab/fxAnim.tsx');
const VIZ = code('src/features/lab/fxViz.tsx');
const ENGINE = code('modules/ape-dsp/ios/core/Effects.hpp');
const CHECKS = code('src/features/lab/understandingChecks.ts');
const SRC = [
  REVERB,
  CONFIGS,
  SCREEN,
  ANIM,
  VIZ,
  code('src/screens/lab/LabShell.tsx'),
  code('src/screens/lab/rack/RackUnit.tsx'),
  code('src/screens/lab/rack/BezelReadouts.tsx'),
  code('src/screens/lab/foundations/bits.tsx'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/features/lab/guidedLessons/content.ts'),
  code('src/components/LabUnderstandingCheck.tsx'),
  CHECKS,
].join('\n');

describe('1. every Reverb screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has an authored check, so CHECK exists)', () => {
    assert.deepEqual(Object.keys(REVERB_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(CHECKS, /^\s*reverb: REVERB,/m, 'the reverb understanding check is gone — drop the CHECK guide');
    assert.match(code('src/screens/lab/LabShell.tsx'), /hasUnderstandingCheck\(labId\) \? \[\.\.\.BASE_MODES, \{ key: 'check' as const, label: 'CHECK' \}\]/);
    assert.match(REVERB, /labId: 'reverb'/);
    for (const m of ['explore', 'learn', 'check'] as const) assert.equal(reverbScreenGuide(m), (REVERB_SCREEN_GUIDES as Record<string, unknown>)[m]);
    assert.equal(reverbScreenGuide('other'), undefined);
    const block = CHECKS.slice(CHECKS.indexOf('const REVERB: readonly Q[] = ['), CHECKS.indexOf('const CHORUS: readonly Q[] = ['));
    assert.equal((block.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(REVERB_SCREEN_GUIDES.check.seeing.join(' '), /Four question cards/);
    // "two questions offer controls as answers": the pre-delay and the far-away ones
    const ctrlQs = [...block.matchAll(/options: \[([^\]]*)\]/g)].filter((m) => /'Pre-delay'|'Lower the reverb MIX'/.test(m[1]));
    assert.equal(ctrlQs.length, 2);
    assert.match(REVERB_SCREEN_GUIDES.check.tryThis[0], /two questions offer controls as answers/);
    assert.equal((REVERB.match(/^\s{6}question: '/gm) ?? []).length, 2);
    assert.match(REVERB_SCREEN_GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
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
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|v6|FDN)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Waves|UAD|Universal Audio|SSL|Neve|API|Lexicon|Eventide|Bricasti|EMT|Boss|TC Electronic|Valhalla|AMS|Yamaha|Roland)\b/, `${id}: a gear maker/model name`);
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
      // the glass (fxAnim ReverbFlow) + the badge strip
      'IN ▸', '▸ OUT', 'REVERB', 'TEACHING MODEL',
      // bezel readouts, dock keys, tray heads + choices (literal in the source)
      'RT60', 'PRE', 'MIX', 'PRE-DLY', 'DAMP', 'SOURCE', 'PRE-DELAY', 'HF DAMPING', 'DARK 2k', 'NATURAL 5.5k', 'BRIGHT 12k', '35%', '70%', '100% WET', 'BURST 1 kHz', 'PINK NOISE',
      // the rack, the header and LAB NOTES
      '▶', '■', 'ⓘ', 'HIDE DISPLAY', 'FULL SCREEN', 'LAB NOTES', 'DESIGNED RESPONSE', 'THE AUDIO PATH', 'CHECK YOURSELF', 'GUIDED LESSON',
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'RT60 (decay time)', 'Pre-delay', 'HF damping', 'Mix', 'Sabine', 'PRE-DLY', 'DESIGNED RESPONSE', 'No pre-delay: the wash starts with the dry hit'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'HF DAMPING', 'RT60', 'PRE-DELAY', 'MIX', '✓', 'EXPLORE', 'LEARN', 'DESIGNED RESPONSE', 'OUT'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(REVERB_SCREEN_GUIDES).sort());
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
  it('the generated labels the guide quotes: CLICK 60 · PRE-DLY 0/20/60 ms · RT60 0.40 s – 6.0 s', () => {
    assert.match(CONFIGS, /const srcClick = \(bpm: number\) => \(\{ label: `CLICK \$\{bpm\}`/);
    assert.match(REVERB, /sources: \[srcClick\(60\), \{ label: 'BURST 1 kHz', short: 'BURST', gen: \{ mode: GEN_MODES\.burst, frequency: 1000 \} \}, SRC_PINK\]/);
    assert.match(REVERB, /choices: \[0, 20, 60\]\.map\(\(ms\) => \(\{ label: `\$\{ms\} ms`, value: ms \}\)\)/);
    assert.match(REVERB, /fader: \{ min: 0\.4, max: 6, log: true, snap: snap2sig, format: \(v\) => `\$\{fmt2sig\(v\)\} s` \}/);
    assert.equal(`${fmt2sig(0.4)} s`, '0.40 s');
    assert.equal(`${fmt2sig(6)} s`, '6.0 s');
    const ex = REVERB_SCREEN_GUIDES.explore.control.join(' ');
    assert.match(ex, /RT60, 0\.40 s to 6\.0 s/);
    // the dock abbreviations spelled out once
    assert.match(ex, /PRE-DLY \(PRE-DELAY: 0, 20, 60 ms\)/);
    assert.match(ex, /DAMP \(HF DAMPING, high-frequency damping: DARK 2k, NATURAL 5\.5k, BRIGHT 12k\)/);
    assert.match(ex, /MIX \(35%, 70%, 100% WET\)/);
    assert.match(ex, /SOURCE \(CLICK 60, BURST 1 kHz, PINK NOISE\)/);
    assert.match(REVERB, /label: 'RT60 \(DECAY TIME\)', short: 'RT60'/);
    assert.match(REVERB, /label: 'PRE-DELAY', short: 'PRE-DLY'/);
    assert.match(REVERB, /label: 'HF DAMPING', short: 'DAMP'/);
    assert.match(REVERB, /bezel: \[\s*\{ k: 'RT60', paramId: P\.rt60 \},\s*\{ k: 'PRE', paramId: P\.preDelayMs \},\s*\{ k: 'MIX', paramId: P\.reverbMix \},\s*\]/);
    // the glass labels the guide describes: 100 ms ticks, a "0.5 s" mark, guides every 30 dB
    assert.match(ANIM, /for \(let ms = 100; ms < 5000; ms \+= 100\)/);
    assert.match(ANIM, /const major = ms % 500 === 0;/);
    assert.match(ANIM, /`\$\{\(ms \/ 1000\)\.toFixed\(1\)\} s`/);
    assert.match(ANIM, /for \(let d = 30; d < REV_RANGE_DB; d \+= 30\)/);
    assert.match(ANIM, /<DashPathEffect intervals=\{\[2, 4\]\} \/>/);
  });
});

/* ── fxAnim's own glass math, lifted out and evaluated ─────────────────────
 * revCol / hashW / onePoleGain are worklets in a Skia module that cannot be
 * imported under node; their source is extracted and run as plain JS, so the
 * guide is checked against the drawing itself, not a copy of it. */
function lift(name: string): string {
  const m = ANIM_RAW.match(new RegExp(`(?:export )?function ${name}\\([\\s\\S]*?\\n\\}\\n`));
  assert.ok(m, `fxAnim.${name} not found`);
  return m[0].replace(/^export /, '').replace(/:\s*number\[\]/g, '').replace(/:\s*number/g, '');
}
const PI2 = Math.PI * 2;
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const lib = new Function('PI2', `${lift('hashW')}\n${lift('onePoleGain')}\n${lift('revCol')}\nreturn { hashW, onePoleGain, revCol };`)(PI2) as {
  onePoleGain: (fc: number, f: number) => number;
  revCol: (tMid: number, colMs: number, sk: number, P: number, pre: number, decDbS: number, mix: number) => number[];
};
const RANGE = 90; // REV_RANGE_DB — the OUT floor sits this far under the source peak
const LOOP_S = 0.0448; // REV_LOOP_S
/** ReverbFlow's decay rate for the 1 kHz click (its decG line). */
const decay = (rt60: number, dampHz: number) => 60 / Math.max(rt60, 0.05) + (-20 * Math.log10(lib.onePoleGain(dampHz, 1000))) / LOOP_S;
/** OUT's wet level (dB re the source peak) at t ms after a CLICK 60 hit
 *  (the click lands at t = 0, the next at 1000). One ~7.6 ms column. */
const COL = 1500 / 197;
const wetAt = (t: number, rt60: number, pre: number, mix: number, damp: number) => lib.revCol(1000 * 50 + t, COL, 0, 1000, pre, decay(rt60, damp), mix)[1];
/** First t (ms) after the hit at which OUT's wash is at or under the floor. */
function floorAt(rt60: number, pre: number, mix: number, damp: number): number | null {
  for (let t = pre + 70; t < 1000; t += 1) if (wetAt(t, rt60, pre, mix, damp) <= -RANGE) return t;
  return null;
}
/** First t (ms) after the hit at which THIS hit's wash jumps up (the earlier
 *  hits' tails still ring under it, ~−66 dB at the defaults, so "drawn at
 *  all" is not the onset — the jump to the new wash, ~−21 dB, is). */
function onsetAt(pre: number): number {
  const before = lib.revCol(1000 * 50 - 1, 1, 0, 1000, pre, decay(1.5, 5500), 0.35)[1];
  assert.ok(before < -55, `the old tail under the click: ${before.toFixed(1)} dB`);
  for (let t = 0; t < 400; t += 0.5) if (lib.revCol(1000 * 50 + t, 1, 0, 1000, pre, decay(1.5, 5500), 0.35)[1] > -40) return t;
  return NaN;
}

describe('4. the TRY THIS numbers are what the screen draws', () => {
  it('the inputs the re-run copies: defaults, CLICK 60 = 1 kHz ping, the decay line, the 31 ms first echo', () => {
    assert.match(REVERB, /paramId: P\.rt60[\s\S]*?initial: 1\.5,/);
    assert.match(REVERB, /paramId: P\.preDelayMs[\s\S]*?initial: 20,/);
    assert.match(REVERB, /paramId: P\.reverbDampHz[\s\S]*?initial: 5500,/);
    assert.match(REVERB, /paramId: P\.reverbMix[\s\S]*?initial: 0\.35,/);
    assert.match(read('modules/ape-dsp/ios/core/Generator.hpp'), /Short 1 kHz ping repeating at the click BPM\./);
    assert.match(ANIM, /const REV_RANGE_DB = 90;/);
    assert.match(ANIM, /const REV_LOOP_S = 0\.0448;/);
    assert.match(ANIM, /const REV_WIN_MS = 1500;/);
    assert.match(ANIM, /const decG = useGlide\(60 \/ Math\.max\(rt60, 0\.05\) \+ \(-20 \* Math\.log10\(onePoleGain\(dampHz, srcHz\)\)\) \/ REV_LOOP_S\);/);
    assert.match(ANIM, /const srcHz = src\.kind === 'burst' \? src\.hz : 1000;/);
    assert.match(ANIM, /const hgt = Math\.max\(0, Math\.min\(1, \(db \+ REV_RANGE_DB\) \/ REV_RANGE_DB\)\) \* \(base - top\);/);
    // the engine: shortest loop 1499 samples (31 ms at 48 kHz), in-loop one-pole damping, out = dry·(1−mix) + wet·mix
    assert.match(ENGINE, /static constexpr double kBase\[4\] = \{1499\.0, 1889\.0, 2381\.0, 2833\.0\};/);
    assert.ok(Math.abs(1499 / 48 - 31.2) < 0.05);
    assert.match(ANIM, /if \(tau < 31\) continue;/);
    assert.match(ENGINE, /lp_\[i\] \+= dampC \* \(v - lp_\[i\]\);/);
    assert.match(ENGINE, /L\[s\] = static_cast<float>\(\(double\)L\[s\] \* \(1\.0 - mix\) \+ outL \* mix\);/);
    // the per-trip damping figures the file header quotes
    assert.ok(Math.abs(decay(1.5, 5500) - 40 - 3.0) < 0.2, `NATURAL adds ${(decay(1.5, 5500) - 40).toFixed(2)} dB/s`);
    assert.ok(Math.abs(decay(1.5, 2000) - 40 - 21.5) < 0.3, `DARK adds ${(decay(1.5, 2000) - 40).toFixed(2)} dB/s`);
  });
  it('EXPLORE 1: RT60 0.40 s → the wash reaches the floor near the 0.5 s mark; 6.0 s → it falls only a little before the next click', () => {
    const t = floorAt(0.4, 20, 0.35, 5500);
    assert.ok(t != null && t >= 450 && t <= 550, `floor at ${t} ms`);
    // 6.0 s: still far above the floor as the next click arrives, and only a small fall from its start
    const start = wetAt(70, 6, 20, 0.35, 5500);
    const end = wetAt(990, 6, 20, 0.35, 5500);
    assert.equal(floorAt(6, 20, 0.35, 5500), null);
    assert.ok(end > -50, `6.0 s at 990 ms: ${end.toFixed(1)} dB`);
    assert.ok(start - end < 22, `6.0 s falls ${(start - end).toFixed(1)} dB of a 90 dB panel`);
    assert.match(REVERB_SCREEN_GUIDES.explore.tryThis[0], /slide RT60 down to 0\.40 s: on OUT the wash sinks to the bottom near the 0\.5 s mark\. At 6\.0 s it falls only a little before the next click, and the tails pile up/);
  });
  it('EXPLORE 2: PRE-DLY 60 ms → the new wash jumps up ~91 ms after the click (nearly one 100 ms tick); 0 ms → ~31 ms (about a third)', () => {
    const g60 = onsetAt(60);
    const g0 = onsetAt(0);
    assert.ok(g60 >= 88 && g60 <= 95, `60 ms gap = ${g60}`);
    assert.ok(g0 >= 28 && g0 <= 36, `0 ms gap = ${g0}`);
    assert.match(REVERB_SCREEN_GUIDES.explore.tryThis[1], /the wash now jumps up nearly one 100 ms tick after the gray click \(60 ms plus the reverb’s 31 ms\)\. At 0 ms it jumps up about a third of a tick after/);
  });
  it('EXPLORE 3: RT60 ≈ 1.5 s with DARK 2k → nearly at the floor by the 1 s mark (NATURAL stays well up); DESIGNED RESPONSE ignores damping', () => {
    for (const rt of [1.4, 1.5, 1.6]) {
      const dark = wetAt(990, rt, 20, 0.35, 2000);
      const nat = wetAt(990, rt, 20, 0.35, 5500);
      assert.ok(dark > -RANGE && dark < -RANGE + 12, `RT60 ${rt} DARK at 990 ms: ${dark.toFixed(1)} dB`);
      assert.ok(nat > -RANGE + 18, `RT60 ${rt} NATURAL at 990 ms: ${nat.toFixed(1)} dB`);
    }
    assert.match(REVERB, /Hero: \(v\) => <DecayCurveGraph rt60=\{v\[P\.rt60\]\} preDelayMs=\{v\[P\.preDelayMs\]\} spanS=\{DECAY_SPAN_S\} \/>/);
    assert.match(REVERB_SCREEN_GUIDES.explore.tryThis[2], /DARK 2k: the wash now nearly reaches the bottom by the 1 s mark\. DESIGNED RESPONSE stays put: it draws RT60 alone/);
  });
  it('LEARN 1: RT60 3.0 s → the marker reads "RT60 3.0 s" on the dashed −60 line (and the fader can land on 3.0)', () => {
    assert.match(VIZ, /`RT60 \$\{fmt2sig\(rt60\)\} s`/);
    // the marker shares the fader/bezel formatter: no disagreement below 1 s
    assert.equal(fmt2sig(3), '3.0');
    assert.equal(fmt2sig(0.47), '0.47');
    assert.equal(fmt2sig(0.99), '0.99');
    assert.match(VIZ, /<Circle cx=\{rtX\} cy=\{yAt\(-60\)\}/);
    assert.match(VIZ, /<Line x1=\{padL\} y1=\{yAt\(-60\)\} x2=\{W - 8\} y2=\{yAt\(-60\)\} stroke="rgba\(255,198,77,\.4\)" strokeWidth=\{1\} strokeDasharray="4 3" \/>/);
    assert.equal(`RT60 ${fmt2sig(3)} s`, 'RT60 3.0 s');
    // below 1 s the label keeps two decimals, like the fader and the bezel
    assert.equal(`RT60 ${fmt2sig(snap2sig(0.47))} s`, 'RT60 0.47 s');
    assert.equal(`RT60 ${fmt2sig(snap2sig(0.95))} s`, 'RT60 0.95 s');
    // the log fader around 3.0 s: a band of positions snaps to exactly 3
    const val = (p: number) => snap2sig(0.4 * Math.pow(6 / 0.4, p));
    const p3 = Math.log(3 / 0.4) / Math.log(6 / 0.4);
    assert.equal(val(p3), 3);
    assert.equal(val(p3 + 0.004), 3);
    // the dot is on the −60 line; its label sits at the bottom edge, on the time axis
    assert.match(VIZ, /<SvgText x=\{rtX\} y=\{H - 2\} fill=\{AMBER\}[^>]*>\s*\{`RT60 \$\{fmt2sig\(rt60\)\} s`\}/);
    assert.match(REVERB_SCREEN_GUIDES.learn.tryThis[0], /slide RT60 to 3\.0 s: in DESIGNED RESPONSE the dot sits where the slope meets the dashed −60 line, labelled RT60 3\.0 s on the time axis below/);
  });
  it('CHECK 2 (D41 fix 2026-11-01): a FIXED 7.5 s axis — the RT60 marker slides from near the left (0.40 s) to near the right (6.0 s)', () => {
    assert.match(VIZ, /export const DECAY_SPAN_S = 7\.5;/);
    assert.match(VIZ, /const spanS = fixedSpanS \?\? Math\.max\(rt60 \* 1\.25, refRt60 \? refRt60 \* 1\.25 : 0, 0\.6\);/);
    assert.match(VIZ, /const xAt = \(s: number\) => padL \+ \(s \/ spanS\) \* \(W - padL - 8\);/);
    assert.match(VIZ, /const rtX = xAt\(preDelayMs \/ 1000 \+ rt60\);/);
    assert.match(VIZ, /const tickStep = spanS > 4 \? 2 : spanS > 1\.5 \? 1 : 0\.5;/);
    assert.match(REVERB, /spanS=\{DECAY_SPAN_S\}/);
    // the window holds the whole drawn slope at the fader's top: PRE 60 ms + 6 s × 1.15
    assert.ok(0.06 + 6 * 1.15 < 7.5);
    // the 320-wide card, padL 26: the marker's x at the default PRE 20 ms
    const x = (rt: number, pre = 0.02) => 26 + ((pre + rt) / 7.5) * (320 - 26 - 8);
    assert.ok(x(0.4) < 26 + 30, `0.40 s at x ${x(0.4).toFixed(0)}`);
    assert.ok(x(6) > 312 - 70, `6.0 s at x ${x(6).toFixed(0)}`);
    const xs = [0.5, 0.8, 1.5, 3, 6].map((r) => x(r));
    for (let k = 1; k < xs.length; k++) assert.ok(xs[k] - xs[k - 1] > 10, 'the marker moves at every RT60 choice ' + xs.map((v) => v.toFixed(0)).join(','));
    // the label stays on the card at both ends (≈ 6 px a glyph at 9 pt mono)
    assert.ok(x(0.4) - ('RT60 0.40 s'.length * 6) / 2 > 0 && x(6) + ('RT60 6.0 s'.length * 6) / 2 < 320);
    assert.match(REVERB_SCREEN_GUIDES.check.tryThis[1], /On its fixed time axis the marker slides along the dashed −60 line, near the left at 0\.40 s and near the right at 6\.0 s/);
    assert.doesNotMatch(textOf(GUIDES.check), /barely moves|axis stretches/);
  });
  it('LEARN 2: PRE-DLY 0 ms → the caption opens "No pre-delay: the wash starts with the dry hit…" (no "0 ms … separates")', () => {
    assert.match(REVERB, /v\[P\.preDelayMs\] === 0\s*\? `No pre-delay: the wash starts with the dry hit, gluing the source to the tail\. Then the tail falls 60 dB in \$\{v\[P\.rt60\]\} s\.`\s*: `\$\{v\[P\.preDelayMs\]\} ms pre-delay separates the dry hit from the wash/);
    assert.doesNotMatch(REVERB, /' No pre-delay glues the source to the tail\.'/);
    assert.match(REVERB_SCREEN_GUIDES.learn.tryThis[1], /PRE-DLY 0 ms: the caption under DESIGNED RESPONSE now opens “No pre-delay: the wash starts with the dry hit…”/);
  });
  it('EXPLORE changes: MIX 100% WET leaves only the wash (no dry stub on OUT)', () => {
    assert.match(ANIM, /const ldry = mix >= 0\.999 \? -200 : 20 \* Math\.log10\(1 - mix\);/);
    assert.equal(lib.revCol(50000, COL, 0, 1000, 20, decay(1.5, 5500), 1)[0], -200);
    assert.match(REVERB_SCREEN_GUIDES.explore.changes.join(' '), /MIX: at 100% WET only the wash is left/);
    assert.match(REVERB_SCREEN_GUIDES.explore.changes.join(' '), /about 31 ms the reverb needs for its first echo/);
  });
});

/* ── OUT never draws signal that has not happened yet (D41 fix 2026-11-01) ──
 * revOutPath is lifted the same way, with a stub Skia that records points. */
type Pt = [number, number];
function liftOut(): (kind: number, now: number, sk: number, P: number, TP: number, pre: number, dec: number, mix: number, x0: number, x1: number, msPerPx: number, top: number, base: number) => Pt[][] {
  const m = ANIM_RAW.match(/function revOutPath\([\s\S]*?\n\}\n/);
  assert.ok(m, 'fxAnim.revOutPath not found');
  const src = m[0].replace(/\): SkPathT \{/, ') {').replace(/:\s*number/g, '');
  const Skia = {
    Path: {
      Make: () => {
        const subs: Pt[][] = [];
        return {
          subs,
          moveTo: (x: number, y: number) => subs.push([[x, y]]),
          lineTo: (x: number, y: number) => subs[subs.length - 1].push([x, y]),
          close: () => {},
        };
      },
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const f = new Function('Skia', 'revCol', 'REV_RANGE_DB', `${src}\nreturn revOutPath;`)(Skia, lib.revCol, RANGE) as (...a: number[]) => { subs: Pt[][] };
  return (...a: number[]) => f(...a).subs;
}
describe('4b. OUT draws only what has already happened', () => {
  const revOutPath = liftOut();
  // the 320-wide flow at STAGE_FRAC 0.5: OUT runs 170 → 314 px over 1500 ms
  const x0 = 170, x1 = 314, msPerPx = 1500 / (x1 - x0), top = 24, base = 160;
  const msAt = (x: number) => (x - x0) * msPerPx;
  const dec = decay(1.5, 5500);
  const draw = (kind: number, e: number) => revOutPath(kind, 50000 + e, 0, 1000, 1000, 20, dec, 0.35, x0, x1, msPerPx, top, base);
  it('the guard is in the drawing', () => {
    assert.match(ANIM, /if \(old\) T -= TP;\s*if \(T > now\) \{\s*if \(kind === 0\) p\.lineTo\(xm, base\);\s*else started = false;\s*continue;\s*\}/);
  });
  it('100 ms after a click (CLICK 60): nothing past 1.1 s on OUT — no wash, no dim contour, no dry stroke', () => {
    const e = 100;
    for (const kind of [2, 3]) for (const sub of draw(kind, e)) for (const [x] of sub) assert.ok(msAt(x) <= 1000 + e + msPerPx, `kind ${kind} draws at ${msAt(x).toFixed(0)} ms`);
    // the wet area sits on the baseline there
    for (const sub of draw(0, e)) for (const [x, y] of sub) if (msAt(x) > 1000 + e + msPerPx && x < x1) assert.equal(y, base, `wash at ${msAt(x).toFixed(0)} ms`);
    // …and the region was NOT empty before the fix: the new click's wash lives there (T = tTrig + x − 1000)
    assert.ok(lib.revCol(50000 + 300, 7.6, 0, 1000, 20, dec, 0.35)[1] > -40);
  });
  it('600 ms after a click the whole window is past: the dim contour reaches the right end again', () => {
    const xs = draw(3, 600).flat().map(([x]) => msAt(x));
    assert.ok(Math.max(...xs) > 1450, `dim contour ends at ${Math.max(...xs).toFixed(0)} ms`);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  // Whichever config field names the coordinated change picks (guide /
  // accuracy, or screenGuide / accuracyChip) — read them from FxLabScreen.
  const guideKey = SCREEN.match(/<LabShell[\s\S]*?guide=\{config\.(\w+)\}/)?.[1];
  const accKey = SCREEN.match(/<LabShell[\s\S]*?accuracy=\{config\.(\w+)/)?.[1];
  const forwards = !!guideKey && !!accKey;
  it(
    'reverbConfig hands LabShell the per-tab guide function',
    { skip: forwards ? false : 'pending: FxLabScreen.tsx (shared by 12 effect labs) does not forward guide/accuracy yet' },
    () => {
      assert.match(CONFIGS, /import \{ reverbScreenGuide \} from '\.\/reverbScreenGuides';/);
      assert.match(REVERB, new RegExp(`\\b${guideKey}: reverbScreenGuide,`));
    },
  );
  it(
    'a CONCEPT lab: no live mic, no real-world measurement — the chip gives its spot to the ⓘ',
    { skip: forwards ? false : 'pending: FxLabScreen.tsx (shared by 12 effect labs) does not forward guide/accuracy yet' },
    () => {
      assert.match(REVERB, new RegExp(`\\b${accKey}: false,`));
    },
  );
  it('the reason for the chip decision holds today: generator + effects only, RT60 a setting, a badged teaching model', () => {
    const calls = new Set([...SCREEN.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    assert.ok(calls.size > 0);
    for (const c of calls) assert.match(c, /^(gen|fx)[A-Z]\w*$|^(isAvailable|engineVersion|fxAvailable|stereoSpreadAvailable)$/, `ApeDsp.${c} — not a generator/effects call`);
    assert.doesNotMatch(SCREEN, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame|rt60Status|Rt60/);
    assert.doesNotMatch(REVERB, /pollGr/);
    assert.match(SCREEN, /const ANIM_BADGE = 'TEACHING MODEL · DRAWN FROM THE SAME MATH AS THE AUDIO · NOT A MEASUREMENT';/);
    assert.match(REVERB, /heroBadge: 'DECAY SLOPE — ANALYTIC/);
  });
});
