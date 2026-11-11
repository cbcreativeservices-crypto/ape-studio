/**
 * Screen Guide rollout — Chorus Lab (2026-10-31) — receipts.
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

const { CHORUS_SCREEN_GUIDES, chorusScreenGuide } = await import('../src/screens/lab/chorusScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = CHORUS_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CONFIGS = code('src/screens/lab/fxLabConfigs.tsx');
/** This lab's config block only. */
const CFG = CONFIGS.slice(CONFIGS.indexOf('const chorusConfig: FxLabConfig'), CONFIGS.indexOf('export const ChorusLabScreen'));
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

describe('1. every Chorus screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has a CHECK tab)', () => {
    assert.deepEqual(Object.keys(CHORUS_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*chorus: CHORUS,/m, 'chorus lost its CHECK tab — drop the check guide');
    for (const m of ['explore', 'learn', 'check'] as const) assert.equal(chorusScreenGuide(m), CHORUS_SCREEN_GUIDES[m]);
    assert.equal(chorusScreenGuide('other'), undefined);
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
      // the scope (fxAnim ModFlow / FlowScene) and its notes
      'CHORUS', 'IN ▸', '▸ OUT', 'SCOPE · ', 'Hz TONE', 'PART OF THE NOISE', 'Hz · LFO SLOWED',
      // bezel + dock + tray choices (config labels / shorts), the sources
      'RATE', 'DEPTH', 'MIX', 'SUBTLE', 'CLASSIC', 'DEEP', 'VOICE DELAY', 'DELAY', '100% = VIBRATO', 'PINK NOISE', 'SOURCE',
      // the header transport, the rack's own controls, the well
      '▶', '■', 'HIDE DISPLAY', 'FULL SCREEN', 'LAB NOTES', 'DESIGNED RESPONSE',
    ],
    // 2026-11-08: lesson names Voice delay / Rate/Depth became the on-screen DELAY / RATE / DEPTH
    // (decision 1); the rewrite no longer names the LEARN tab itself.
    learn: ['EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'RATE', 'DEPTH', 'DELAY', 'MIX', '100% = VIBRATO', 'DEEP', '▶'],
    // '100% = VIBRATO' / 'DELAY' dropped: the on-screen label IS the full-wet answer, so the CHECK no
    // longer walks to it (decision 6) — see the negative check in section 6.
    check: ['CHECK YOUR UNDERSTANDING', 'still to get right', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'Check passed', 'LEARN', 'EXPLORE', 'MIX', 'COMMON MISTAKES', 'RATE'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(CHORUS_SCREEN_GUIDES).sort());
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
  it('the dock is exactly RATE (fader) · DEPTH · DELAY · MIX · SOURCE, the bezel RATE · DEPTH · MIX, the sources SINE 440 Hz + PINK NOISE', () => {
    const labels = [...CFG.matchAll(/label: '([A-Z ]+)', (?:short: '([A-Z]+)', )?paramId:/g)].map((m) => m[2] ?? m[1]);
    assert.deepEqual(labels, ['RATE', 'DEPTH', 'DELAY', 'MIX']);
    assert.deepEqual([...CFG.matchAll(/\{ k: '([A-Z]+)', paramId/g)].map((m) => m[1]), ['RATE', 'DEPTH', 'MIX']);
    assert.match(CFG, /sources: \[srcSine\(440\), SRC_PINK\]/);
    assert.match(CONFIGS, /label: `SINE \$\{hz\} Hz`/);
    assert.ok(textOf(GUIDES.explore).includes('SINE 440 Hz'));
    assert.doesNotMatch(CFG, /dockGroups/, 'a group tray appeared — the guide names four separate keys');
    assert.match(code(FX_SCREEN), /label: 'SOURCE'/);
  });
  it('the CHECK tab has the four questions the guide counts', () => {
    const u = code('src/features/lab/understandingChecks.ts');
    const block = u.slice(u.indexOf('const CHORUS: readonly Q[]'), u.indexOf('const FLANGER: readonly Q[]'));
    assert.equal((block.match(/^\s{4}id: '/gm) ?? []).length, 4);
    const opts = [...block.matchAll(/options: \[([\s\S]*?)\],\n/g)];
    assert.equal(opts.length, 4);
    for (const q of opts) assert.equal((q[1].match(/'[^'\n]+'/g) ?? []).length, 4, 'four answers each');
    assert.match(textOf(GUIDES.check), /four questions, four answers each/);
  });
});

describe('4. the TRY THIS numbers follow from the config and the scope', () => {
  it('RATE fader: 0.10–3.00 Hz, starts at 0.25 Hz, printed with two decimals', () => {
    assert.match(CFG, /initial: 0\.25,\s*fader: \{\s*min: 0\.1, max: 3, log: true/);
    assert.match(CFG, /format: \(v\) => `\$\{v\.toFixed\(2\)\} Hz`/);
    assert.ok(textOf(GUIDES.explore).includes('RATE fader (0.10–3.00 Hz, starts at 0.25 Hz)'));
  });
  it('DELAY 15 → 20 → 35 ms: the caption’s spacing is round(1000 / ms) = 67, 50, 29 Hz', () => {
    assert.match(CFG, /choices: \[15, 20, 35\]\.map\(\(ms\) => \(\{ label: `\$\{ms\} ms`, value: ms \}\)\),\s*initial: 20/);
    assert.match(CFG, /notches every \$\{Math\.round\(1000 \/ v\[P\.centerMs\]\)\} Hz/);
    const sp = [15, 20, 35].map((ms) => Math.round(1000 / ms));
    assert.deepEqual(sp, [67, 50, 29]);
    assert.ok(textOf(GUIDES.explore).includes(`every ${sp[0]}, ${sp[1]}, then ${sp[2]} Hz`));
    assert.ok(textOf(GUIDES.explore).includes(`every ${sp[1]} Hz at 20 ms`));
  });
  it('LFO SLOWED: first shown at 0.87 Hz with DEPTH on CLASSIC (fxAnim cap 45 rad/s)', () => {
    assert.match(ANIM, /const slipPerHz = trueLag \? PI2 \* \(srcHz as number\) \* 0\.006 \* Math\.max\(depth, 0\.01\) \* PI2 : 0;/);
    assert.match(ANIM, /Math\.min\(rateHz, 45 \/ slipPerHz\)/);
    assert.match(ANIM, /const lfoSlowed = trueLag && lfoVisHz < rateHz - 1e-6;/);
    assert.match(CFG, /\{ label: 'CLASSIC', value: 0\.5 \}/);
    const cap = 45 / (2 * Math.PI * 440 * 0.006 * 0.5 * 2 * Math.PI);
    assert.ok(Math.abs(cap - 0.864) < 0.001, `cap ${cap}`);
    // The fader snaps to 0.01 Hz: the first value past the cap.
    const first = Math.ceil(cap * 100 + 1e-9) / 100;
    assert.equal(first.toFixed(2), '0.87');
    assert.ok(textOf(GUIDES.explore).includes(`From ${first.toFixed(2)} Hz (DEPTH on CLASSIC)`));
    // The start setting (0.25 Hz) is not slowed — step 1 is honest.
    assert.ok(0.25 < cap);
  });
  it('MIX 100%: feedback is fixed at 0, so the drawn output IS the copy (no swelling)', () => {
    assert.match(CFG, /fixed: \[\s*\{ paramId: P\.modMode, value: 0 \},\s*\{ paramId: P\.modFeedback, value: 0 \},\s*\]/);
    assert.match(ANIM, /const wet = Math\.sin\(kc \* \(x - dx\) - pc \+ dph\) \+ fbV \* Math\.sin/);
    assert.match(ANIM, /\(\(1 - mixV\) \* dry \+ mixV \* wet\)/);
    assert.match(CFG, /label: '100% = VIBRATO', value: 1\.0/);
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
    assert.ok(CFG.includes(`${guideKey}: chorusScreenGuide,`), `config lacks ${guideKey}: chorusScreenGuide`);
    assert.ok(CFG.includes(`${accKey}: false,`), `config lacks ${accKey}: false`);
  });
});

describe('6. guide review fixes (2026-10-31, each re-checked against the code)', () => {
  it('LEARN does not say "nothing plays": the header ▶ shows on every tab and the rack stays mounted', () => {
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{headerAction \? <View style=\{styles\.headerAction\}/);
    assert.doesNotMatch(textOf(GUIDES.learn), /Nothing here plays/);
    assert.ok(GUIDES.learn.seeing[0].includes('▶ in the header still plays or stops the sound'));
  });
  it('TRY THIS step 3 sets MIX back to 50% first: at MIX 100% the caption shows no spacing numbers', () => {
    assert.match(CFG, /v\[P\.modMix\] >= 1\s*\? '100% wet removes the dry voice/);
    assert.ok(GUIDES.explore.tryThis[0].includes('100% = VIBRATO'));
    assert.ok(GUIDES.explore.tryThis[2].startsWith('With MIX back on 50%'));
  });
  it('CHECK points to where the delay is taught (the CHECK tab has no DELAY key)', () => {
    assert.doesNotMatch(textOf(GUIDES.check), /DELAY here/);
    assert.ok(textOf(GUIDES.check).includes('on LEARN reread the COMMON MISTAKES line on flanger'));
  });
  it('CHECK (decision 6, 2026-11-08): TRY THIS and the intro never give a check answer away', () => {
    const ck = CHORUS_SCREEN_GUIDES.check as unknown as Guide & { intro: { learning: string; start: string } };
    const all = [textOf(ck), ck.intro.learning, ck.intro.start].join('\n');
    // full-wet: the on-screen label "100% = VIBRATO" is the answer, so the CHECK neither names it nor walks to it
    assert.doesNotMatch(all, /VIBRATO|vibrato|turns into/);
    // vs-flanger: the 15–35 ms answer and "a few milliseconds" are not stated
    assert.doesNotMatch(all, /15, 20 or 35|15–35|few milliseconds|longer delay/i);
    // mechanism / rate-high: not stated
    assert.doesNotMatch(all, /wobbl|seasick|out of tune/i);
    assert.match(ck.tryThis[0], /reread the MIX entry on LEARN/);
  });
});
