/**
 * Screen Guide rollout — Autotune Lab (owner 2026-10-31) — receipts. The
 * Wave Physics pilot's pattern (test/screenGuide_20261031.test.ts):
 *
 *   1. one guide per LabShell tab the lab offers (EXPLORE, LEARN, CHECK) with
 *      all five sections, 1–5 bullets each, 2–3 TRY THIS, in the house copy
 *      rules;
 *   2. every step fits its no-scroll budget (SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names (bezel keys, dock labels,
 *      SPEED options, lesson headings, check labels);
 *   4. the TRY THIS numbers are what ENDS prints — the lab's own curve,
 *      c₀·(1−a) + c₀·a·e^(−t/τ), re-run here with the screen's constants;
 *   5. wiring: LabShell takes the per-tab guide function;
 *   6. CHIP DECISION: a concept lab (tone-generator singer, exact retune math)
 *      passes accuracy={false}, so the ⓘ takes the chip's spot.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { AUTOTUNE_SCREEN_GUIDES, autotuneScreenGuide } = await import('../src/screens/lab/autotuneScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = AUTOTUNE_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const SCREEN = 'src/screens/lab/AutotuneLabScreen.tsx';

describe('1. every Autotune tab has a complete guide', () => {
  it('EXPLORE, LEARN and CHECK — the lab has an understanding check, so CHECK is a real tab', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(code('src/features/lab/understandingChecks.ts'), /\n\s*autotune: AUTOTUNE,/);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: 1–5 bullets`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no gear makers', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|toddler pass|audio review)\b/i, `${id}: a build note`);
      assert.doesNotMatch(t, /\b(Antares|Auto-Tune|Melodyne|Celemony|Waves|iZotope)\b/, `${id}: a maker or product name`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
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
  const SRC = [SCREEN, 'src/screens/lab/LabShell.tsx', 'src/features/lab/guidedLessons/GuidedLessonSheet.tsx', 'src/features/lab/guidedLessons/content.ts', 'src/components/LabUnderstandingCheck.tsx'].map(code).join('\n');
  const NAMES: Record<string, string[]> = {
    explore: ['AMOUNT', 'SPEED', 'NOTE', 'ENDS', 'OFF', 'FAST — SNAP', 'MEDIUM', 'SLOW — GLIDE', 'PLAY', 'LAB NOTES'],
    learn: ['CONTROLS', 'Correction amount', 'Retune speed', 'Cents grid', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'EXPLORE', 'CHECK'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'LEARN', 'EXPLORE'],
  };
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the SPEED time constants and the note length the guide quotes are the screen’s', () => {
    const s = code(SCREEN);
    assert.match(s, /key: 'fast', label: 'FAST — SNAP', short: 'FAST', tau: 0\.025/);
    assert.match(s, /key: 'med', label: 'MEDIUM', short: 'MEDIUM', tau: 0\.12/);
    assert.match(s, /key: 'slow', label: 'SLOW — GLIDE', short: 'SLOW', tau: 0\.4/);
    assert.match(s, /const NOTE_MS = 1100;/);
    const t = textOf(GUIDES.explore);
    for (const x of ['25 ms', '120 ms', '400 ms', '1.1 s']) assert.ok(t.includes(x), x);
  });
});

describe('4. TRY THIS numbers are what ENDS prints', () => {
  // The screen's own curve and ENDS cell (AutotuneLabScreen.tsx).
  const corrected = (c0: number, a: number, tau: number, t: number) => c0 * (1 - a) + c0 * a * Math.exp(-t / tau);
  const ends = (a: number, tau: number) => `${Math.round(Math.abs(corrected(-45, a, tau, 1.1)))}¢`;
  it('the curve, the 45¢-flat row and the ENDS cell are as quoted', () => {
    const s = code(SCREEN);
    assert.match(s, /return c0 \* \(1 - amount\) \+ c0 \* amount \* Math\.exp\(-t \/ tau\);/);
    assert.match(s, /\{ midi: 64, offCents: -45 \}/);
    assert.match(s, /\{ k: 'ENDS', v: `\$\{remaining\(MELODY\[3\]\.offCents\)\}¢`/);
    assert.match(s, /const remaining = \(c0: number\) => Math\.round\(Math\.abs\(correctedCents\(c0, amount, tau, NOTE_MS \/ 1000\)\)\);/);
    assert.match(s, /amount <= 0\.005 \? 'OFF'/);
    assert.match(s, /strokeDasharray=\{amount === 0 \? '4 4' : undefined\}/);
  });
  it('OFF → 45¢; 100% SLOW → 3¢; 100% FAST → 0¢; near 50% MEDIUM → 22–23¢', () => {
    assert.equal(ends(0, 0.12), '45¢');
    assert.equal(ends(1, 0.4), '3¢');
    assert.equal(ends(1, 0.025), '0¢');
    assert.equal(ends(1, 0.12), '0¢');
    assert.equal(ends(0.5, 0.12), '23¢');
    assert.equal(ends(0.51, 0.12), '22¢');
    const t = Object.values(GUIDES).map(textOf).join('\n');
    for (const x of ['ENDS reads 45¢', 'ENDS reads 3¢', 'ENDS reads 0¢', 'about 22–23¢', '(3¢)', '(0¢)']) assert.ok(t.includes(x), x);
  });
  it('“about two-thirds of the gap” per time constant is 1 − e⁻¹', () => {
    assert.ok(Math.abs(1 - Math.exp(-1) - 2 / 3) < 0.05);
    assert.ok(textOf(GUIDES.explore).includes('about two-thirds of the gap'));
  });
});

describe('5. wiring: LabShell takes the per-tab guide function', () => {
  it('the screen imports the guide and passes it with accuracy={false}', () => {
    const s = code(SCREEN);
    assert.match(s, /import \{ autotuneScreenGuide \} from '\.\/autotuneScreenGuides';/);
    assert.match(s, /<LabShell[\s\S]*?guide=\{autotuneScreenGuide\}\s*accuracy=\{false\}/);
  });
  it('the function returns a guide for each tab and nothing for anything else', () => {
    assert.equal(autotuneScreenGuide('explore'), AUTOTUNE_SCREEN_GUIDES.explore);
    assert.equal(autotuneScreenGuide('learn'), AUTOTUNE_SCREEN_GUIDES.learn);
    assert.equal(autotuneScreenGuide('check'), AUTOTUNE_SCREEN_GUIDES.check);
    assert.equal(autotuneScreenGuide('other'), undefined);
  });
});

describe('6. chip decision: concept lab — the chip gives its spot to the ⓘ', () => {
  it('no AccuracyNote in the lab; LabShell draws the chip only when accuracy is true', () => {
    assert.doesNotMatch(code(SCREEN), /<AccuracyNote\b/);
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{accuracy \? <AccuracyNote compact \/> : null\}/);
    // The honesty that matters stays on screen: no microphone, a generator.
    assert.match(code(SCREEN), /GENERATOR DEMO — plays the demo melody with the app’s tone generator \(no microphone\)/);
  });
});

describe('review fixes 2026-10-31 (each vetted against the code)', () => {
  it('cents is defined in the first step, before any reading in cents', () => {
    assert.ok(GUIDES.explore.seeing[0].includes('A cent is 1/100 of a semitone'));
  });
  it('the dock lane travels left–right, so the guide says "all the way left", never "the bottom"', () => {
    assert.match(code('src/screens/lab/rack/ParamLane.tsx'), /const capStyle = useAnimatedStyle\(\(\) => \(\{ left: capV\.value \*/);
    assert.ok(GUIDES.explore.tryThis[0].startsWith('Slide AMOUNT all the way left: it reads OFF'));
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /to the (bottom|top)\b/, id);
  });
  it('LEARN: only two CONTROLS carry a range; only some COMMON MISTAKES are a setting and its result', () => {
    const lesson = read('src/features/lab/guidedLessons/content.ts');
    assert.match(lesson, /\{ key: 'cents_grid', name: 'Cents grid', definition: '[^']*' \}/);
    assert.ok(GUIDES.learn.seeing[1].includes('Correction amount and Retune speed with their ranges, and Cents grid'));
    assert.ok(GUIDES.learn.changes.some((l) => l.startsWith('Several COMMON MISTAKES pair a setting')));
  });
});
