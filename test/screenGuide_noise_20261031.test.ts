/**
 * Screen Guide rollout — Noise Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (a LabShell lab).
 *
 *   1. every screen the learner reaches has a guide — EXPLORE (the rack),
 *      LEARN (the reading page) and CHECK (the lab has an understanding
 *      check) — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget;
 *   3. the guide quotes the screen's REAL names (pinned in both);
 *   4. the TRY THIS facts follow from the screen: SLOPE comes from the COLORS
 *      table; every line crosses 0 dB at 1 kHz; with SPKR on, the drawn line
 *      is slope·log2(f/1k) + the 2nd-order 150 Hz high-pass — so BROWN peaks
 *      exactly at the 150 Hz marker and falls to its left. No guide quotes a
 *      dB level off the chart (it prints none) or a per-color OUT value (that
 *      differs by engine build);
 *   5. wiring + the accuracy-chip decision — a CONCEPT lab: `accuracy={false}`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { NOISE_SCREEN_GUIDES, noiseScreenGuide } = await import('../src/screens/lab/noiseScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = NOISE_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const SCREEN = 'src/screens/lab/NoiseLabScreen.tsx';
const CHECKS = code('src/features/lab/understandingChecks.ts');
const SRC = [
  code(SCREEN),
  code('src/screens/lab/LabShell.tsx'),
  code('src/screens/lab/rack/RackUnit.tsx'),
  code('src/screens/lab/foundations/bits.tsx'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/features/lab/guidedLessons/content.ts'),
  code('src/components/LabUnderstandingCheck.tsx'),
  code('src/features/audio/speakerSafety.ts'),
  code('src/screens/lab/labCatalog.ts'),
].join('\n');

describe('1. every Noise screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has an understanding check)', () => {
    assert.deepEqual(Object.keys(NOISE_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(CHECKS, /^\s*noise: NOISE,$/m);
    assert.equal((CHECKS.match(/const NOISE: readonly Q\[\] = \[([\s\S]*?)\n\];/)![1].match(/^\s{4}id: '/gm) ?? []).length, 4, 'four questions — the CHECK guide says four');
    assert.equal(noiseScreenGuide('explore'), NOISE_SCREEN_GUIDES.explore);
    assert.equal(noiseScreenGuide('learn'), NOISE_SCREEN_GUIDES.learn);
    assert.equal(noiseScreenGuide('check'), NOISE_SCREEN_GUIDES.check);
    assert.equal(noiseScreenGuide('other'), undefined);
    assert.equal((code(SCREEN).match(/<CheckQuestion/g) ?? []).length, 2);
    assert.match(NOISE_SCREEN_GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
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
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|ape-dsp)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(dbx|Behringer|Yamaha|Smaart|Rational Acoustics|Bose|JBL)\b/, `${id}: a gear maker/model name`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('low ≤ 410, high ≤ 700, one TRY THIS item ≤ 200', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length})`);
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
      // chart labels + bezel readouts + badge
      'COLOR', 'SLOPE', 'OUT', 'dBFS', 'dB/OCT', 'IDEALIZED SPECTRAL SLOPES — ANALYTIC, NOT A MEASUREMENT',
      // dock keys + chips
      'SPKR', 'WHITE', 'PINK', 'BROWN', 'BLUE', 'VIOLET',
      // the well and the rack's own controls
      'LAB NOTES', 'WHAT YOU’RE SEEING', 'OUTPUT LEVEL', 'CHECK YOURSELF', 'GUIDED LESSON', 'HIDE DISPLAY', 'FULL SCREEN',
      // catalog placement (Oscillators / Harmonics / FM Synthesis) dropped: course-order lines left the guide (decision 4, 2026-11-08)
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'Gray', 'HVAC', 'WHITE', 'PINK', 'BROWN', 'BLUE', 'VIOLET', 'SLOPE', 'SPKR'],
    // BROWN dropped: the CHECK guide no longer pairs it with its slope (decision 6, the rumble/−6 question)
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '✓', 'LEARN', 'EXPLORE', 'COLOR', 'SLOPE', 'PINK', 'WHITE', 'VIOLET'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(NOISE_SCREEN_GUIDES).sort());
  });
  it('no guide states the course order any more (decision 4: course-navigation lines removed)', () => {
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /Comes after|follow(s)? (this|next)|Harmonics and FM Synthesis/, `${id}: a course-order line`);
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
  it('the five colors, their slopes and the chart’s range are the ones the guide states; Gray + the real-world noises have no chip', () => {
    const s = code(SCREEN);
    const rows = [...s.matchAll(/\{ key: '([a-z]+)', label: '([A-Z]+)', mode: GEN_MODES\.\w+, slope: (-?\d+) \}/g)].map((m) => [m[2], Number(m[3])]);
    assert.deepEqual(rows, [['WHITE', 0], ['PINK', -3], ['BROWN', -6], ['BLUE', 3], ['VIOLET', 6]]);
    assert.match(s, /useState<NoiseColor>\('pink'\)/);
    assert.match(s, /const OCT_LO = Math\.log2\(20 \/ 1000\);/);
    assert.match(s, /const OCT_HI = Math\.log2\(20000 \/ 1000\);/);
    assert.match(s, /const freqTicks = \[20, 100, 1000, 20000\];/);
    // the dot every line crosses: 0 dB at 1 kHz
    assert.match(s, /<Circle cx=\{xAt\(0\)\} cy=\{H \/ 2\}/);
    // the shimmer moves only while noise plays
    assert.match(s, /if \(!running\) return; \/\/ silent = still/);
    assert.doesNotMatch(s, /key: '(grey|gray|hvac|hum|buzz)'/i, 'a Gray/real-world chip now exists — update the LEARN guide');
    // the SLOPE readout's text: "+3 dB/OCT", "-3 dB/OCT", "0 dB/OCT"
    assert.match(s, /v: `\$\{selected\.slope > 0 \? '\+' : ''\}\$\{selected\.slope\} dB\/OCT`/);
  });
});

describe('4. the TRY THIS facts follow from the screen', () => {
  const s = code(SCREEN);
  const ss = code('src/features/audio/speakerSafety.ts');
  it('SPKR draws slope·oct + the 2nd-order 150 Hz high-pass, with a marker line at 150 Hz', () => {
    assert.match(s, /const db = selectedSlope \* oct \+ speakerGuardDb\(f\);/);
    assert.match(s, /x1=\{xAt\(Math\.log2\(SPEAKER_HPF_HZ \/ 1000\)\)\}/);
    assert.match(ss, /export const SPEAKER_HPF_HZ = 150;/);
    assert.match(ss, /export const SPEAKER_HPF_ORDER = 2;/);
  });
  const guardDb = (f: number) => {
    const r4 = (f / 150) ** 4;
    return 10 * Math.log10(r4 / (1 + r4));
  };
  const drawn = (slope: number, f: number) => slope * Math.log2(f / 1000) + guardDb(f);
  it('BROWN + SPKR: the line rises to the 150 Hz marker, then falls to its left', () => {
    const peak = drawn(-6, 150);
    for (const f of [20, 40, 75, 120, 140]) assert.ok(drawn(-6, f) < peak, `${f} Hz sits below the 150 Hz peak`);
    for (const f of [160, 300, 1000, 5000]) assert.ok(drawn(-6, f) < peak, `${f} Hz sits below the 150 Hz peak`);
    // monotone either side
    assert.ok(drawn(-6, 75) < drawn(-6, 120) && drawn(-6, 300) < drawn(-6, 200));
  });
  it('every ideal line crosses 0 dB at 1 kHz; PINK → WHITE takes SLOPE from −3 to 0', () => {
    for (const slope of [0, -3, -6, 3, 6]) assert.equal(Math.abs(slope * Math.log2(1000 / 1000)), 0);
    // the right-hand tick reads "20k": ticks at 1000 and up print f/1000 + "k"
    assert.match(s, /\{f >= 1000 \? `\$\{f \/ 1000\}k` : `\$\{f\}`\}/);
    assert.match(NOISE_SCREEN_GUIDES.explore.seeing[0], /20 Hz at the left, 20k at the right/);
    assert.match(NOISE_SCREEN_GUIDES.explore.tryThis[0], /SLOPE goes from −3 to 0 dB\/OCT/);
  });
  it('no guide quotes an OUT value (it reads −20 dBFS on native-HPF engines, lower for pink/brown on older ones)', () => {
    assert.match(ss, /return nativeHpfActive\(\) \? baseDb : safeNoiseLevelDb\(baseDb, colorKey\);/);
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /OUT (reads|shows|drops|falls)|−\d+ dBFS/, `${id}: quotes an OUT level`);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  const s = code(SCREEN);
  it('LabShell gets the per-tab guide function', () => {
    assert.match(s, /import \{ noiseScreenGuide \} from '\.\/noiseScreenGuides';/);
    assert.match(s, /<LabShell[\s\S]*?guide=\{noiseScreenGuide\}/);
    assert.match(s, /rack=\{\{/);
  });
  it('a CONCEPT lab: no live mic, no real-world measurement — the chip gives its spot to the ⓘ', () => {
    assert.match(s, /<LabShell[\s\S]*?accuracy=\{false\}/);
    assert.doesNotMatch(s, /<AccuracyNote/);
    const calls = new Set([...s.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    for (const c of calls) assert.match(c, /^gen[A-Z]\w*$|^(isAvailable|engineVersion)$/, `ApeDsp.${c} — not a generator call`);
    assert.doesNotMatch(s, /useDspEngine\(|useMicrophone|getUserMedia|requestRecordingPermissions/);
    assert.match(s, /: 'IDEALIZED SPECTRAL SLOPES — ANALYTIC, NOT A MEASUREMENT',/);
    // OUT is the generator's digital send level, labelled uncalibrated — not a measurement.
    assert.match(s, /outputs \$\{GEN_LEVEL_DB\} dBFS · uncalibrated — digital output level, not dB SPL\./);
  });
});

describe('6. review round 2026-10-31 — each fix re-proved from the code', () => {
  const s = code(SCREEN);
  const g = NOISE_SCREEN_GUIDES;
  it('the guide names BOTH badges (SPKR swaps it)', () => {
    assert.match(s, /\? `PHONE SPEAKER OUTPUT — \$\{SPEAKER_HPF_HZ\} Hz HPF ON \$\{selected\.label\}`/);
    assert.match(g.explore.seeing[2], /with SPKR, PHONE SPEAKER OUTPUT — 150 Hz HPF ON plus the color/);
  });
  it('SPKR dims ALL five straight lines; the bright line is the filtered curve', () => {
    assert.match(s, /active=\{!speakerView && l\.key === selectedKey\}\s*dim=\{speakerView\}/);
    assert.match(s, /\{filteredPath \? <Path d=\{filteredPath\} stroke=\{tint\} strokeWidth=\{2\.4\}/);
    assert.match(g.explore.control[2], /The five lines dim; a bright curve is the filtered color\./);
  });
  it('the high-pass reduces the rumble, it does not remove it (50 Hz: brown still ≈ +6.8 dB over the 1 kHz dot)', () => {
    const hpf = (f: number) => { const r4 = (f / 150) ** 4; return 10 * Math.log10(r4 / (1 + r4)); };
    const drawn = -6 * Math.log2(50 / 1000) + hpf(50);
    assert.equal(drawn.toFixed(1), '6.8');
    assert.doesNotMatch(textOf(GUIDES.explore), /never gets that rumble|can(’|')t reproduce deep bass/);
    assert.match(g.explore.tryThis[2], /[Tt]he phone speaker gets far less of that rumble/);
  });
  it('the chart is level PER HERTZ (white flat, pink −3), so pink’s octave-analyzer flatness is reconciled', () => {
    assert.match(g.explore.seeing[0], /^Level per hertz against frequency/);
    assert.match(g.explore.teaches[2], /reads flat on an octave-band analyzer \(this per-hertz chart shows it at −3\)/);
  });
  it('LEARN: the lesson mentions a spectrogram; this lab has none, and the guide says so', () => {
    // the lesson mentions a spectrogram both before and after the Part A lesson load
    assert.match(code('src/features/lab/guidedLessons/content.ts'), /spectrogram/);
    assert.doesNotMatch(s, /spectrogram/i);
    assert.match(g.learn.changes[1], /a line mentions a spectrogram, that display is in other tools, not this lab/);
  });
  it('decision 6: the CHECK guide never gives an answer away; its slope example is VIOLET (+6), a color the check does not ask', () => {
    const t = [textOf(GUIDES.check), g.check.intro!.learning, g.check.intro!.start].join('\n');
    // Q2 pink −3, Q3 brown −6, Q4 "equal energy per octave matches how we hear", Q1 "twice the hertz / twice the energy"
    assert.doesNotMatch(t, /−3 for PINK|−6 for BROWN|PINK[^.]*−3|BROWN[^.]*−6|ears follow octaves|matches how we hear|twice (as many )?(the )?hertz|twice the energy/);
    assert.doesNotMatch(t, /tap each COLOR chip (and|to) read SLOPE/);
    assert.match(g.check.tryThis[0], /tap COLOR, then VIOLET: SLOPE reads \+6 dB\/OCT/);
    assert.match(code(SCREEN), /label: 'VIOLET', mode: GEN_MODES\.\w+, slope: 6 \}/);
    assert.doesNotMatch(CHECKS.match(/const NOISE: readonly Q\[\] = \[([\s\S]*?)\n\];/)![1], /options: \[[^\]]*\+6 dB/, 'the check now asks +6; pick another example');
  });
  it('D41 CHECK: right answers survive a tab switch (the check stays mounted), and the guide says so', () => {
    assert.match(code('src/components/LabUnderstandingCheck.tsx'), /const \[correct, setCorrect\] = useState<Set<string>>/);
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{hasCheck \? \(\s*<View style=\{mode === 'check' \? styles\.rackFill : styles\.rackHidden\}>\s*<ScrollView[\s\S]*?<LabUnderstandingCheck/);
    const t = textOf(GUIDES.check);
    assert.doesNotMatch(t, /even if you come back later|nothing is lost|stay on this tab|start fresh/);
    assert.match(t, /Answers already right stay right if you switch to LEARN or EXPLORE and come back; leaving the lab before the last one starts the check over/);
  });
});
