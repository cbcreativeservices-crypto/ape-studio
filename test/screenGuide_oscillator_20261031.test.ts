/**
 * Screen Guide rollout — Oscillator Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (a LabShell lab).
 *
 *   1. every screen the learner reaches has a guide — EXPLORE (the rack),
 *      LEARN (the reading page) and CHECK (the lab has an understanding
 *      check, so LabShell offers the tab) — all five sections, the copy
 *      rules, 2–3 TRY THIS experiments;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the lab's source;
 *   4. the TRY THIS numbers are what the screen draws: the bars are
 *      harmonicModel.buildPreset's amplitudes, the SPKR view multiplies them
 *      by the 2nd-order 150 Hz high-pass (speakerSafety), the strip shows two
 *      cycles;
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

const { OSCILLATOR_SCREEN_GUIDES, oscillatorScreenGuide } = await import('../src/screens/lab/oscillatorScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const M = await import('../src/screens/lab/harmonicModel.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = OSCILLATOR_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const SCREEN = 'src/screens/lab/OscillatorLabScreen.tsx';
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

describe('1. every Oscillator screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has an understanding check)', () => {
    assert.deepEqual(Object.keys(OSCILLATOR_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(CHECKS, /^\s*oscillator: OSCILLATOR,$/m, 'the CHECK tab exists because PRACTICE_LAB_CHECKS has oscillator');
    assert.equal((CHECKS.match(/const OSCILLATOR: readonly Q\[\] = \[([\s\S]*?)\n\];/)![1].match(/^\s{4}id: '/gm) ?? []).length, 4, 'four questions — the CHECK guide says four');
    assert.equal(oscillatorScreenGuide('explore'), OSCILLATOR_SCREEN_GUIDES.explore);
    assert.equal(oscillatorScreenGuide('learn'), OSCILLATOR_SCREEN_GUIDES.learn);
    assert.equal(oscillatorScreenGuide('check'), OSCILLATOR_SCREEN_GUIDES.check);
    assert.equal(oscillatorScreenGuide('other'), undefined);
    // The two LAB NOTES questions render on EXPLORE, and the guide says so.
    assert.equal((code(SCREEN).match(/<CheckQuestion/g) ?? []).length, 2);
    assert.match(OSCILLATOR_SCREEN_GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
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
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|ape-dsp|v3)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Moog|Roland|Korg|Yamaha|Sequential|Oberheim|Arturia|Behringer|Minimoog|Prophet|Jupiter|Juno)\b/, `${id}: a gear maker/model name`);
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
      // bezel readouts + values, the badge
      'WAVE', 'F0', 'VIEW', 'IDEAL', 'SPEAKER', 'ANALYTIC MODEL — NOT A MEASUREMENT',
      // dock keys + options
      'SPKR', 'SINE', 'SQUARE', 'TRIANGLE', 'SAW', 'PULSE 25%', '110', '220', '440', '880',
      // the well and the rack's own controls
      'LAB NOTES', 'THE SOUND', 'CHECK YOURSELF', 'GUIDED LESSON', 'HIDE DISPLAY', 'FULL SCREEN',
      // the catalog placement
      'Synthesis & Sound Design', 'Noise', 'Harmonics', 'FM Synthesis',
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'PULSE 25%', 'TRIANGLE', 'SQUARE', 'SPKR'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '✓', 'LEARN', 'EXPLORE', 'TRIANGLE', 'SQUARE', 'PULSE 25%'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(OSCILLATOR_SCREEN_GUIDES).sort());
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
  it('the waves and pitches are exactly the ones the guide lists; the catalog order is the one the guide states', () => {
    const s = code(SCREEN);
    const waves = [...s.matchAll(/\{ key: '[a-z]+', label: '([A-Z0-9 %]+)', lessonKey:/g)].map((m) => m[1]);
    assert.deepEqual(waves, ['SINE', 'SQUARE', 'TRIANGLE', 'SAW', 'PULSE 25%']);
    assert.match(s, /const F0_CHOICES = \[110, 220, 440, 880\];/);
    assert.match(s, /useState<PresetKey>\('saw'\)/);
    const cat = code('src/screens/lab/labCatalog.ts');
    const syn = cat.slice(cat.indexOf("id: 'synthesis'"), cat.indexOf("id: 'spatial'"));
    const order = [...syn.matchAll(/\{ name: '([^']+)', blurb:/g)].map((m) => m[1]);
    assert.deepEqual(order.slice(0, 4), ['Oscillators', 'Noise', 'Harmonics', 'FM Synthesis']);
    // The LEARN guide says the noise / FM / AM lesson entries have no control here — the screen says so too.
    assert.match(s, /FM · AM — NOT IN THIS LAB/);
    assert.doesNotMatch(s, /id: '(fm|am|noise)'/);
  });
});

describe('4. the TRY THIS numbers are what the screen draws', () => {
  const s = code(SCREEN);
  // speakerSafety's filter, re-derived (its module imports the native engine):
  const ss = code('src/features/audio/speakerSafety.ts');
  it('the inputs: bars = buildPreset amplitudes; SPKR = 2nd-order 150 Hz high-pass gain per harmonic', () => {
    assert.match(s, /const amps = useMemo\(\(\) => shownModel\.map\(effectiveAmp\), \[shownModel\]\);/);
    assert.match(s, /amp: h\.amp \* speakerGuardGain\(\(i \+ 1\) \* f0\)/);
    assert.match(ss, /export const SPEAKER_HPF_HZ = 150;/);
    assert.match(ss, /export const SPEAKER_HPF_ORDER = 2;/);
    assert.match(ss, /const r2n = Math\.pow\(r, 2 \* SPEAKER_HPF_ORDER\);[^\n]*\n\s*const mag2 = r2n \/ \(1 \+ r2n\);/);
  });
  const gain = (f: number) => {
    const r4 = (f / 150) ** 4;
    return Math.sqrt(r4 / (1 + r4));
  };
  const bars = (k: string) => M.buildPreset(k).map((h: { amp: number }) => h.amp);
  it('SQUARE: bars 2, 4 … 12 empty; TRIANGLE: same bars empty, bar 3 = 1/9', () => {
    const sq = bars('square');
    assert.deepEqual([2, 4, 6, 8, 10, 12].map((n) => sq[n - 1]), [0, 0, 0, 0, 0, 0]);
    assert.ok([1, 3, 5, 7, 9, 11].every((n) => sq[n - 1] > 0));
    const tri = bars('triangle');
    assert.deepEqual([2, 4, 6, 8, 10, 12].map((n) => tri[n - 1]), [0, 0, 0, 0, 0, 0]);
    assert.ok(Math.abs(tri[2] - 1 / 9) < 1e-12);
  });
  it('PULSE 25%: bars 4, 8, 12 empty and bar 2 ≈ 0.7 of bar 1', () => {
    const p = bars('pulse');
    assert.deepEqual([p[3], p[7], p[11]], [0, 0, 0]);
    assert.ok(p.filter((a: number) => a === 0).length === 3, 'only those three');
    assert.equal(p[0], 1);
    assert.ok(Math.abs(p[1] - 0.707) < 0.001);
  });
  it('SAW at F0 110 with SPKR: bar 1 ≈ bar 2 (filter −6.5 dB at 110 Hz); at 880 Hz the bars barely move', () => {
    const saw = bars('saw');
    const b1 = saw[0] * gain(110);
    const b2 = saw[1] * gain(220);
    assert.ok(Math.abs(20 * Math.log10(gain(110)) + 6.5) < 0.05, '≈ −6.5 dB at 110 Hz');
    assert.ok(Math.abs(b1 - b2) < 0.03, `bar 1 ${b1.toFixed(3)} ≈ bar 2 ${b2.toFixed(3)}`);
    for (let n = 1; n <= 12; n++) assert.ok(gain(n * 880) > 0.999, 'every bar keeps over 99.9 %');
  });
  it('the strip shows two cycles: 3 model cycles drawn across 1.5 × the glass', () => {
    assert.match(s, /synthWaveform\(shownModel, 361, 3\)/);
    assert.match(s, /const step = \(w \* 1\.5\) \/ \(points\.length - 1\);/);
    assert.match(OSCILLATOR_SCREEN_GUIDES.explore.seeing[0], /two cycles traveling left to right/);
    assert.match(s, /shift\.value = -w \/ 2;\s*shift\.value = withRepeat\(withTiming\(0,/, 'it slides rightward');
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  const s = code(SCREEN);
  it('LabShell gets the per-tab guide function', () => {
    assert.match(s, /import \{ oscillatorScreenGuide \} from '\.\/oscillatorScreenGuides';/);
    assert.match(s, /<LabShell[\s\S]*?guide=\{oscillatorScreenGuide\}/);
    assert.match(s, /rack=\{\{/);
  });
  it('a CONCEPT lab: no live mic, no real-world measurement — the chip gives its spot to the ⓘ', () => {
    assert.match(s, /<LabShell[\s\S]*?accuracy=\{false\}/);
    assert.doesNotMatch(s, /<AccuracyNote/);
    // Only generator calls — no microphone is ever opened.
    const calls = new Set([...s.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    for (const c of calls) assert.match(c, /^gen[A-Z]\w*$|^(isAvailable|engineVersion)$/, `ApeDsp.${c} — not a generator call`);
    assert.doesNotMatch(s, /useDspEngine\(|useMicrophone|getUserMedia|requestRecordingPermissions/);
    // The honesty badge stays on the faceplate.
    assert.match(s, /: 'ANALYTIC MODEL — NOT A MEASUREMENT',/);
  });
});

describe('6. review round 2026-10-31 — each fix re-proved from the code', () => {
  const s = code(SCREEN);
  const g = OSCILLATOR_SCREEN_GUIDES;
  it('the guide names BOTH badges (SPKR swaps it)', () => {
    assert.match(s, /\? `PHONE SPEAKER OUTPUT — \$\{SPEAKER_HPF_HZ\} Hz HPF APPLIED`\s*: 'ANALYTIC MODEL — NOT A MEASUREMENT',/);
    assert.match(g.explore.seeing[2], /with SPKR on, PHONE SPEAKER OUTPUT — 150 Hz HPF APPLIED/);
    assert.match(code('src/features/audio/speakerSafety.ts'), /export const SPEAKER_HPF_HZ = 150;/);
  });
  it('the heard sound on the phone speaker is high-passed in any view (110 Hz ≈ −6.5 dB)', () => {
    assert.match(s, /additive: guardAdditiveForEngine\(additivePayload\(buildPreset\(w\), hz\)\)/);
    const r4 = (110 / 150) ** 4;
    assert.equal((10 * Math.log10(r4 / (1 + r4))).toFixed(1), '-6.5');
    assert.match(g.explore.changes[3], /You hear this on the speaker in either view\./);
    assert.doesNotMatch(textOf(GUIDES.explore), /cannot play deep notes/);
  });
  it('LEARN: LAB NOTES says "not in this lab" for FM and AM only; the band-limiting tip has no control here', () => {
    assert.match(s, /'FM · AM — NOT IN THIS LAB'/);
    assert.match(code('src/features/lab/guidedLessons/content.ts'), /band-limiting OFF/);
    assert.match(g.learn.changes[1], /FM, AM, noise and the band-limiting ON\/OFF tip are reading only: EXPLORE has only WAVE, F0 and SPKR \(LAB NOTES says so for FM and AM\)/);
  });
  it('D41 CHECK: right answers survive a tab switch (the check stays mounted), and the guide says so', () => {
    assert.match(code('src/components/LabUnderstandingCheck.tsx'), /const \[correct, setCorrect\] = useState<Set<string>>/);
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{hasCheck \? \(\s*<View style=\{mode === 'check' \? styles\.rackFill : styles\.rackHidden\}>\s*<ScrollView[\s\S]*?<LabUnderstandingCheck/);
    const t = textOf(GUIDES.check);
    assert.doesNotMatch(t, /even if you come back later|nothing is lost|stay on this tab|start fresh/);
    assert.match(t, /Answers already right stay right if you switch to LEARN or EXPLORE and come back; leaving the lab before the last one starts the check over/);
  });
});
