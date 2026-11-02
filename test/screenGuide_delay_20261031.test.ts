/**
 * Screen Guide rollout — Delay Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (a LabShell rack lab).
 *
 *   1. every screen the learner reaches has a guide — the three LabShell tabs
 *      EXPLORE (the rack), LEARN (the reading page) and CHECK (the
 *      understanding check: the lab has authored questions, so the tab
 *      exists) — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the lab's source;
 *   4. the TRY THIS numbers are what the screen draws at that setting —
 *      re-run from fxViz EchoTimelineGraph, the delayConfig caption and the
 *      engine's ping-pong (Effects.hpp DelayEffect);
 *   5. wiring + chip decision: a CONCEPT lab (built-in test source, a
 *      teaching model badged "not a measurement", no microphone) → the guide
 *      function and `accuracy: false`. FxLabScreen.tsx is shared by all 12
 *      effect labs and does not yet forward `guide` / `accuracy` to LabShell;
 *      that wiring is pending a coordinated change, and the test switches on
 *      by itself the moment FxLabScreen forwards them.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { DELAY_SCREEN_GUIDES, delayScreenGuide } = await import('../src/screens/lab/delayScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = DELAY_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CONFIGS = code('src/screens/lab/fxLabConfigs.tsx');
/** The delayConfig block alone (up to its screen export). */
const DELAY = CONFIGS.slice(CONFIGS.indexOf('const delayConfig: FxLabConfig = {'), CONFIGS.indexOf('export const DelayLabScreen'));
const SCREEN = code('src/screens/lab/FxLabScreen.tsx');
const ANIM = code('src/screens/lab/fxAnim.tsx');
const VIZ = code('src/features/lab/fxViz.tsx');
const ENGINE = code('modules/ape-dsp/ios/core/Effects.hpp');
const CHECKS = code('src/features/lab/understandingChecks.ts');
const SRC = [
  DELAY,
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

describe('1. every Delay screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has an authored check, so CHECK exists)', () => {
    assert.deepEqual(Object.keys(DELAY_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(CHECKS, /^\s*delay: DELAY,/m, 'the delay understanding check is gone — drop the CHECK guide');
    assert.match(code('src/screens/lab/LabShell.tsx'), /hasUnderstandingCheck\(labId\) \? \[\.\.\.BASE_MODES, \{ key: 'check' as const, label: 'CHECK' \}\]/);
    assert.match(DELAY, /labId: 'delay'/);
    for (const m of ['explore', 'learn', 'check'] as const) assert.equal(delayScreenGuide(m), (DELAY_SCREEN_GUIDES as Record<string, unknown>)[m]);
    assert.equal(delayScreenGuide('other'), undefined);
    // CHECK guide says four cards — the check really has four questions.
    const block = CHECKS.slice(CHECKS.indexOf('const DELAY: readonly Q[] = ['), CHECKS.indexOf('const REVERB: readonly Q[] = ['));
    assert.equal((block.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(DELAY_SCREEN_GUIDES.check.seeing.join(' '), /Four question cards/);
    // EXPLORE names the two in-notes questions (delayConfig.checks).
    assert.equal((DELAY.match(/^\s{6}question: '/gm) ?? []).length, 2);
    assert.match(DELAY_SCREEN_GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
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
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|v6)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Waves|UAD|Universal Audio|SSL|Neve|API|Fairchild|Teletronix|Urei|1176|LA-2A|Lexicon|Eventide|Boss|TC Electronic|Roland|Echoplex|Space Echo|Strymon|Line 6)\b/, `${id}: a gear maker/model name`);
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
      // the glass (fxAnim EchoFlow) + the badge strip
      'IN ▸', '▸ OUT', 'DELAY', 'TRY CLICK', 'TEACHING MODEL', 'L', 'R',
      // bezel readouts, dock keys, tray choices (literal in the source)
      'TIME', 'FDBK', 'MIX', 'COLOR', 'SOURCE', 'PING-PONG', 'REPEAT DAMPING', 'DARK 2k', 'TAPE 6k', 'OFF 20k', '100% WET', 'PINK NOISE',
      // the rack, the header and LAB NOTES
      '▶', '■', 'ⓘ', 'HIDE DISPLAY', 'FULL SCREEN', 'LAB NOTES', 'DESIGNED RESPONSE', 'THE AUDIO PATH', 'CHECK YOURSELF', 'GUIDED LESSON',
      // the caption the TRY THIS quotes
      'a quarter-note at',
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'Delay time', 'Feedback', 'Wet / Dry', 'Ping-pong', 'Repeat damping', 'slapback', 'MIX', 'TIME', 'FDBK', 'DESIGNED RESPONSE'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'FEEDBACK', 'REPEAT DAMPING', '✓', 'EXPLORE', 'LEARN', 'TIME', 'FDBK', 'DESIGNED RESPONSE'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(DELAY_SCREEN_GUIDES).sort());
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
  it('the generated labels the guide quotes: CLICK 90 · SINE 220 Hz · FDBK 0%–75% · TIME 80–500 ms', () => {
    // Labels built from templates, so the literal is not in the source.
    assert.match(CONFIGS, /const srcClick = \(bpm: number\) => \(\{ label: `CLICK \$\{bpm\}`/);
    assert.match(CONFIGS, /const srcSine = \(hz: number\) => \(\{ label: `SINE \$\{hz\} Hz`/);
    assert.match(DELAY, /sources: \[srcClick\(90\), SRC_PINK, srcSine\(220\)\]/);
    assert.match(DELAY, /choices: \[0, 0\.25, 0\.5, 0\.75\]\.map\(\(f\) => \(\{ label: `\$\{f \* 100\}%`, value: f \}\)\)/);
    assert.match(DELAY, /fader: \{ min: 80, max: 500, log: true, snap: Math\.round, format: \(v\) => `\$\{Math\.round\(v\)\} ms` \}/);
    assert.match(DELAY, /\{ label: '25%', value: 0\.25 \},\s*\{ label: '50%', value: 0\.5 \},/);
    const ex = DELAY_SCREEN_GUIDES.explore.control.join(' ');
    assert.match(ex, /TIME, 80 to 500 ms/);
    assert.match(ex, /FDBK \(FEEDBACK: 0%, 25%, 50% or 75%\)/); // the dock abbreviation spelled out once, with its four choices
    assert.match(ex, /MIX \(25%, 50%, 100% WET\)/);
    assert.match(ex, /SOURCE \(CLICK 90, PINK NOISE, SINE 220 Hz\)/);
    // dock keys in order: the TIME fader, FDBK, MIX, COLOR (ping-pong + damping folded), SOURCE
    assert.match(DELAY, /label: 'DELAY TIME', short: 'TIME'/);
    assert.match(DELAY, /label: 'FEEDBACK', short: 'FDBK'/);
    assert.match(DELAY, /id: 'color', label: 'COLOR', paramIds: \[P\.pingpong, P\.dampHz\]/);
    assert.match(SCREEN, /label: 'SOURCE',/);
    assert.match(DELAY, /bezel: \[\s*\{ k: 'TIME', paramId: P\.timeMs \},\s*\{ k: 'FDBK', paramId: P\.delayFeedback \},\s*\{ k: 'MIX', paramId: P\.delayMix \},\s*\]/);
  });
});

describe('4. the TRY THIS numbers are what the screen draws', () => {
  // fxViz EchoTimelineGraph (DESIGNED RESPONSE): the stems it draws.
  it('the stem law the re-run copies', () => {
    assert.match(read('src/features/lab/sliderMaps.ts'), /export const ECHO_SPAN_MS = 3250;/);
    assert.match(VIZ, /let amp = mix;\s*for \(let n = 1; n <= 12 && amp > 0\.02 && n \* timeMs <= spanMs; n\+\+\) \{\s*out\.push\(\{ ms: n \* timeMs, amp, side: pingpong \? \(n % 2 === 1 \? 'L' : 'R'\) : 'C' \}\);\s*amp \*= feedback;/);
    assert.match(VIZ, /`\$\{Math\.round\(spanMs\)\} ms`/); // the "3250 ms" axis end
    assert.match(DELAY, /<EchoTimelineGraph timeMs=\{v\[P\.timeMs\]\} feedback=\{v\[P\.delayFeedback\]\} mix=\{v\[P\.delayMix\]\} pingpong=\{v\[P\.pingpong\] > 0\.5\} \/>/);
    // the defaults the steps start from: TIME 375, FDBK 50 %, MIX 50 %, ping-pong off
    assert.match(DELAY, /initial: 375,/);
    assert.match(DELAY, /paramId: P\.delayFeedback[\s\S]*?initial: 0\.5,/);
    assert.match(DELAY, /paramId: P\.delayMix[\s\S]*?initial: 0\.5,/);
    assert.match(DELAY, /paramId: P\.pingpong[\s\S]*?initial: 0,/);
  });
  const SPAN = 3250;
  const stems = (timeMs: number, fb: number, mix: number) => {
    const out: number[] = [];
    let amp = mix;
    for (let n = 1; n <= 12 && amp > 0.02 && n * timeMs <= SPAN; n++) {
      out.push(amp);
      amp *= fb;
    }
    return { n: out.length, next: amp, nextMs: (out.length + 1) * timeMs };
  };
  it('EXPLORE: TIME 500 ms, MIX 50% → FDBK 25% draws 3 stems, 75% draws 6 with the trail past 3250 ms', () => {
    assert.equal(stems(500, 0.25, 0.5).n, 3);
    const hi = stems(500, 0.75, 0.5);
    assert.equal(hi.n, 6);
    assert.ok(hi.next > 0.02 && hi.nextMs > SPAN, 'the 7th repeat is still tall but past the window');
    const t = DELAY_SCREEN_GUIDES.explore.tryThis[1];
    assert.match(t, /Keep TIME at 500 ms and MIX at 50%/);
    assert.match(t, /FDBK to 25%: DESIGNED RESPONSE shows 3 stems/);
    assert.match(t, /At 75%: 6, and the trail runs past the 3250 ms edge/);
  });
  it('EXPLORE + LEARN: TIME 500 ms → the caption names a quarter-note at 120 BPM (FDBK under 75%)', () => {
    // A BPM only from TIME 250 ms up (≤ 240 BPM); slapback / short TIMEs name no tempo.
    assert.match(DELAY, /\(v\[P\.delayFeedback\] >= 0\.75 \? 'High feedback — a long trail; runaway starts near 100%\.'\s*: v\[P\.timeMs\] <= 150 \? 'Slapback range[^']*not tied to the tempo\.'\s*: v\[P\.timeMs\] < 250 \? 'A short echo[^']*'\s*: `That spacing = a quarter-note at \$\{Math\.round\(60000 \/ v\[P\.timeMs\]\)\} BPM/);
    assert.ok(60000 / 250 <= 240 && 60000 / 249 > 240, 'the 250 ms cut keeps every named BPM at 240 or under');
    assert.equal(Math.round(60000 / 500), 120);
    assert.match(DELAY_SCREEN_GUIDES.explore.tryThis[0], /readout says 500 ms[\s\S]*quarter-note at 120 BPM \(60,000 ÷ 500\)/);
    assert.match(DELAY_SCREEN_GUIDES.learn.tryThis[0], /slide TIME to 500 ms: the caption under DESIGNED RESPONSE names 120 BPM/);
    // At FDBK 75% the caption swaps the BPM for "a long trail", and the
    // rack stays mounted across tabs (LabShell), so FDBK 75% from EXPLORE
    // TRY THIS 2 carries into LEARN / CHECK: every BPM step names the condition.
    assert.match(code('src/screens/lab/LabShell.tsx'), /<View style=\{mode === 'explore' \? styles\.rackFill : styles\.rackHidden\}/);
    for (const t of [DELAY_SCREEN_GUIDES.explore.tryThis[0], DELAY_SCREEN_GUIDES.learn.tryThis[0], DELAY_SCREEN_GUIDES.check.tryThis[0]]) {
      assert.match(t, /with FDBK under 75%/i, 'a BPM step without the FDBK condition: ' + t.slice(0, 50));
      assert.doesNotMatch(t, /for any TIME/);
    }
    // the formula the guide quotes is the lesson's own
    assert.match(code('src/features/lab/guidedLessons/content.ts'), /Quarter-note ms = 60000 \/ BPM\./);
  });
  it('LEARN: slapback — TIME 80 ms, FDBK 0% → one stem after the dry one', () => {
    assert.equal(stems(80, 0, 0.5).n, 1);
    assert.match(DELAY_SCREEN_GUIDES.learn.tryThis[1], /TIME to 80 ms and FDBK to 0%: DESIGNED RESPONSE shows one stem/);
  });
  it('EXPLORE: ping-pong — L lane over R, repeat 1 left, 2 right (engine 10 cross-feed, the glass and the stems agree)', () => {
    // engine: mono input into the LEFT line, each side's repeat feeds the other
    assert.match(ENGINE, /bufL_\[w_\] = static_cast<float>\(\(inL \+ inR\) \* 0\.5 \+ lpR_ \* fb\);\s*bufR_\[w_\] = static_cast<float>\(lpL_ \* fb\);/);
    // the glass: odd repeats on the L lane (drawn above), even on R
    assert.match(ANIM, /if \(n % 2 === 1\) odd \+= a;\s*else even \+= a;/);
    assert.match(ANIM, /const lc = top \+ \(bot - top\) \/ 4;\s*const rc = bot - \(bot - top\) \/ 4;/);
    assert.match(ANIM, /text="L"[\s\S]*?text="R"/);
    assert.match(DELAY_SCREEN_GUIDES.explore.tryThis[2], /an L lane over an R lane, odd repeats left, even right\. In LAB NOTES, DESIGNED RESPONSE letters one click’s repeats L, R, L/);
    // the letters are drawn by the DESIGNED RESPONSE stems (LAB NOTES), not the glass
    assert.match(VIZ, /pingpong \? \(\s*<SvgText key=\{`s\$\{i\}`\}[\s\S]*?\{t\.side\}/);
    // why the order is read on the stems: at CLICK 90 (667 ms) and TIME 375 ms,
    // click 1's first repeat (1042 ms) lands in the L lane between click 0's
    // repeats 1 and 3 (375, 1125 ms) — the trails interleave on OUT.
    const firstOfNext = 60000 / 90 + 375;
    assert.ok(firstOfNext > 375 && firstOfNext < 3 * 375);
  });
  it('EXPLORE changes: the physics the bullets state is the engine’s', () => {
    // MIX: out = dry·(1 − mix) + repeat·mix, so 100 % WET drops the dry click from OUT
    assert.match(ENGINE, /L\[i\] = static_cast<float>\(inL \* \(1\.0 - mix\) \+ dl \* mix\);/);
    assert.match(ANIM, /const a = ev\[0\] \* \(1 - mixV\);/);
    // damping sits in the loop: the first repeat is the raw input, every later pass is low-passed
    assert.match(ENGINE, /lpL_ \+= dampC \* \(dl - lpL_\);/);
    assert.match(ENGINE, /bufL_\[w_\] = static_cast<float>\(inL \+ lpL_ \* fb\);/);
    const ch = DELAY_SCREEN_GUIDES.explore.changes.join(' ');
    assert.match(ch, /at 100% WET the grey dry click leaves OUT/);
    assert.match(ch, /REPEAT DAMPING dulls every pass after the first/);
    assert.match(ch, /At 50% each repeat is half as tall \(6 dB down\)/);
    // steady sources: the glass note
    assert.match(ANIM, /'STEADY SINE · TRY CLICK' : 'STEADY NOISE · TRY CLICK'/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  // FxLabScreen is the shared screen of all 12 effect labs: it must forward a
  // config's guide + accuracy to LabShell before any effect lab can show ⓘ.
  // Whichever config field names the coordinated change picks (guide /
  // accuracy, or screenGuide / accuracyChip) — read them from FxLabScreen.
  const guideKey = SCREEN.match(/<LabShell[\s\S]*?guide=\{config\.(\w+)\}/)?.[1];
  const accKey = SCREEN.match(/<LabShell[\s\S]*?accuracy=\{config\.(\w+)/)?.[1];
  const forwards = !!guideKey && !!accKey;
  it(
    'delayConfig hands LabShell the per-tab guide function',
    { skip: forwards ? false : 'pending: FxLabScreen.tsx (shared by 12 effect labs) does not forward guide/accuracy yet' },
    () => {
      assert.match(CONFIGS, /import \{ delayScreenGuide \} from '\.\/delayScreenGuides';/);
      assert.match(DELAY, new RegExp(`\\b${guideKey}: delayScreenGuide,`));
    },
  );
  it(
    'a CONCEPT lab: no live mic, no real-world measurement — the chip gives its spot to the ⓘ',
    { skip: forwards ? false : 'pending: FxLabScreen.tsx (shared by 12 effect labs) does not forward guide/accuracy yet' },
    () => {
      assert.match(DELAY, new RegExp(`\\b${accKey}: false,`));
    },
  );
  it('the reason for the chip decision holds today: generator + effects only, a badged teaching model', () => {
    const calls = new Set([...SCREEN.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    assert.ok(calls.size > 0);
    for (const c of calls) assert.match(c, /^(gen|fx)[A-Z]\w*$|^(isAvailable|engineVersion|fxAvailable|stereoSpreadAvailable)$/, `ApeDsp.${c} — not a generator/effects call`);
    assert.doesNotMatch(SCREEN, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
    assert.doesNotMatch(DELAY, /pollGr/); // no measured readout on this lab
    assert.match(SCREEN, /const ANIM_BADGE = 'TEACHING MODEL · DRAWN FROM THE SAME MATH AS THE AUDIO · NOT A MEASUREMENT';/);
    assert.match(DELAY, /heroBadge: 'ECHO PATTERN — ANALYTIC/);
  });
});
