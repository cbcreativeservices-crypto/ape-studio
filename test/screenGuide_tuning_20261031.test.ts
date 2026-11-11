/**
 * Screen Guide rollout — Tuning & Temperament Lab (owner 2026-10-31) —
 * receipts. The Wave Physics pilot's pattern (test/screenGuide_20261031.test.ts):
 *
 *   1. one guide per chapter (CHAPTERS order) and one for the what's-left
 *      screen, all five sections, 1–5 bullets, 2–3 TRY THIS, house copy rules;
 *   2. every step fits its no-scroll budget (SCREEN_GUIDE_BUDGET);
 *   3. each guide quotes its chapter's REAL names (bezel keys, dock labels,
 *      tray options, drawing labels) — pinned in both guide and source;
 *   4. the TRY THIS numbers are what the chapter prints at A4 = 440,
 *      re-derived from features/tuning/tuningMath.ts;
 *   5. wiring: LabHeader takes the chapter guide (the end guide on FINISH)
 *      and ScreenGuideHost wraps the content — regions on rack chapters only;
 *   6. CHIP DECISION: a concept lab (synthesized tones, CALCULATED numbers)
 *      carries no AccuracyNote — not in the reading chapter, not in the well.
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

const { TUNING_SCREEN_GUIDES, TUNING_END_GUIDE } = await import('../src/screens/lab/tuning/tuningScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const M = await import('../src/features/tuning/tuningMath.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = TUNING_SCREEN_GUIDES as unknown as Guide[];
const allGuides: [string, Guide][] = [...GUIDES.map((g, i) => [`ch${i}`, g] as [string, Guide]), ['end', TUNING_END_GUIDE as unknown as Guide]];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const DIR = 'src/screens/lab/tuning';
const CH_FILES = ['ch0Welcome', 'ch1Intervals', 'ch2Landmarks', 'ch3Octave', 'ch4Harmonics', 'ch5Fifths', 'ch6Comma', 'ch7Just', 'ch8Compare', 'ch9Meantone', 'ch10Equal', 'ch11Systems', 'ch12Tradeoffs', 'ch13Apply'];
const t = (i: number) => GUIDES[i].tryThis.join('\n');
const all = (i: number) => textOf(GUIDES[i]);
const C4 = M.C4_ET;
const f2 = (x: number) => x.toFixed(2);

describe('1. every Tuning & Temperament screen has a complete guide', () => {
  it('one guide per chapter, in CHAPTERS order — the registry still lists these fourteen files', () => {
    const reg = code(`${DIR}/chapters/index.ts`);
    assert.equal(GUIDES.length, 14);
    const order = [...reg.matchAll(/\{ index: (\d+), title: CHAPTER_TITLES\[\d+\], short: '[^']*', objective: '[^']*',(?: rack: true,)? Component: (Ch\w+) \}/g)].map((m) => [Number(m[1]), m[2]]);
    assert.deepEqual(order.map((o) => o[0]), [...Array(14).keys()]);
    assert.deepEqual(order.map((o) => o[1]), CH_FILES.map((f) => f.replace(/^ch(\d+)(\w+)$/, (_, n, w) => `Ch${n}${w}`)));
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      // the intro card (Guided Lessons return 2026-11-08): learning ≤ 30 words, start ≤ 40
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro, 'no intro');
      assert.ok(intro.learning.trim().split(/\s+/).length <= 30, 'intro.learning over 30 words');
      assert.ok(intro.start.trim().split(/\s+/).length <= 40, 'intro.start over 40 words');
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: 1–5 bullets`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no makers', () => {
    for (const [id, gd] of allGuides) {
      const tx = textOf(gd);
      assert.doesNotMatch(tx, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(tx, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(tx, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(tx, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|toddler pass|review 2026)\b/i, `${id}: a build note`);
      assert.doesNotMatch(tx, /\b(Steinway|Yamaha|Roland|Korg|Moog|Peterson)\b/, `${id}: a maker's name`);
    }
  });
  it('chapters are named, not numbered — the strip counts from 1 while the lab text counts from 0', () => {
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /\bChapters? \d/, `${id}: a chapter number`);
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

describe('3. each guide quotes its chapter’s real names', () => {
  const SHARED = [`${DIR}/rackLayout.tsx`, `${DIR}/TuningLabScreen.tsx`, `${DIR}/components/octaveElevator.tsx`, `${DIR}/components/stageFigures.tsx`, `${DIR}/components/harmonicLadder.tsx`, 'src/screens/lab/kit/LabNavBar.tsx', 'src/screens/lab/kit/labNav.ts', 'src/screens/lab/rack/RackUnit.tsx', 'src/screens/lab/LabShell.tsx'].map(code).join('\n');
  const NAMES: string[][] = [
    ['ROOT', 'OCTAVE', 'SOUND', 'STOPPED', 'HEAR IT', '■ STOP', 'SCOPE ⓘ', 'BEGIN LAB ›', 'IN THIS CHAPTER', 'BASIC', 'MATH', '‹ PREV', 'NEXT ›'],
    ['RATIO', 'CENTS', 'INTERVAL', 'UPPER', 'ROOT', 'UPPER NOTE', 'TOGETHER', 'C3–C4', 'C4–C5', 'SHOW ME', 'TWO OCTAVES, TWO REGISTERS', 'minor 3rd', 'major 3rd', 'fourth', 'fifth', 'between'],
    ['RATIO', 'CENTS', 'MARKER', 'SHOW ME', '3:2 · YOUR ANSWER', 'WHOLE-NUMBER RELATIONSHIP'],
    ['RATIO', 'VALUE', 'REGION', 'NEXT OP', 'BELOW', 'INSIDE', 'ABOVE', 'COMPARISON OCTAVE', 'VIEW', 'Demo A · reduce 9/4', 'Demo B · raise 3/4', 'Your turn', 'SHOW OP', 'MOVE ÷2', 'MOVE ×2', 'REPLAY', 'SHOW ME', 'RESET'],
    ['THIRD', 'FROM 5/4', 'PARTIALS Δ', 'LISTEN', 'Full tones', 'Isolated partials', '▶ PLAY', 'SHOW ME', 'Just 5/4', 'Equal-tempered 2^(1/3)', 'Pythagorean 81/64', 'BEATING MODEL', 'LOG-FREQUENCY AXIS'],
    ['STEP', 'NEWEST', 'CENTS', 'ADD FIFTH', 'FIFTHS', 'BY PITCH'],
    ['EXPECTED C', 'ACTUAL B♯', 'GAP', 'HEAR', 'A · EXPECTED C', 'B · ACTUAL B♯', 'A → B', 'TOGETHER', 'PYTHAGOREAN COMMA', 'EXPECTED C · ACTUAL B♯'],
    ['NOTE', 'CENTS', 'Hz', 'TONIC', 'MODE', 'KEEP', 'RETUNE', 'IMPURE', 'MOVED', 'NOTES', 'PLAY', 'LOCKED', 'E 5/4', 'G 3/2', 'CHORD 4:5:6', 'ALIGNED PARTIALS'],
    ['RATIOS', 'NOTE', 'EXAMPLE', 'A / B', 'A · PYTHAGOREAN', 'B · JUST', 'A → B', 'PYTH', 'JUST', '81/80', 'C–E major third', 'C–E–G triad', 'F–A major third', 'G–B major third', 'C-major phrase'],
    ['PART', 'FIFTH', 'g⁴/4', 'FROM 5/4', 'WOLF', 'NORMAL', 'WIDER BY', 'SHOW ME', '▶ C–E–G', 'NOTES', '▶ SCALE', 'PURE FIFTH 3/2', 'MEANTONE FIFTH ⁴√5'],
    ['STEP', 'RATIO', 'Hz', 'ADD ×r', 'OCTAVE ✓', 'STEPS', 'A / B', 'A · PATTERN IN C', 'B · STARTING ON F', 'A → B'],
    ['NOTE', 'Hz', 'VS EQUAL', 'SYSTEM', 'REF', 'A4 = 440', 'A / B', 'EXAMPLE', 'SYSTEM B', 'HEAR THE SAME NOTE MOVE', 'C FIXED AT', '0 ¢ = EQUAL TEMPERAMENT', '+ HIGHER', '− LOWER'],
    ['MISCONCEPTIONS', 'WHERE THIS MEETS PROFESSIONAL AUDIO', 'UNDERSTOOD ›', 'seen · tap to reread ▸', 'A4 = 440 Hz is a law of nature.'],
    ['FIGURE', '1 · Normalize 9/4', '4 · Align the third', '6 · Hear E move', 'FOLD', 'THIRD', 'E MOVES', 'RATIO', 'VALUE', 'REGION', 'DONE', '4 × RATIO', 'SHOW ME', 'WHAT YOU KEEP', 'RETRY THE CHALLENGES'],
  ];
  it('a name list for every chapter', () => assert.equal(NAMES.length, GUIDES.length));
  NAMES.forEach((names, i) => {
    it(`ch${i}: every pinned name is on the screen AND in the guide`, () => {
      const src = code(`${DIR}/chapters/${CH_FILES[i]}.tsx`) + '\n' + SHARED;
      const gt = all(i);
      for (const n of names) {
        assert.ok(src.includes(n), `ch${i}: "${n}" is no longer in the chapter source — update the guide`);
        assert.ok(gt.toLowerCase().includes(n.toLowerCase()), `ch${i}: the guide never names "${n}"`);
      }
    });
  });
  it('ch13: the E MOVES readouts are built as JUST E / EQUAL E / PYTHAGOREAN E', () => {
    const s13 = code(`${DIR}/chapters/ch13Apply.tsx`);
    assert.match(s13, /const E_SYSTEMS = \[\['Just', TUNING_SYSTEMS\.just\], \['Equal', TUNING_SYSTEMS\.equal\], \['Pythagorean', TUNING_SYSTEMS\.pythagorean\]\] as const;/);
    assert.match(s13, /k: `\$\{l\.toUpperCase\(\)\} E`/);
    for (const n of ['JUST E', 'EQUAL E', 'PYTHAGOREAN E']) assert.ok(all(13).includes(n), n);
  });
  it('ch12: the system card the guide names is the system’s own title', () => {
    assert.equal(M.TUNING_SYSTEMS.equal.name.toUpperCase(), 'TWELVE-TONE EQUAL TEMPERAMENT');
    assert.ok(all(12).includes('TWELVE-TONE EQUAL TEMPERAMENT'));
    assert.match(code(`${DIR}/chapters/ch12Tradeoffs.tsx`), /Slightly tempers fifths \(−1\.96 ¢\) and major thirds \(\+13\.69 ¢\)/);
  });
  it('the end screen’s names are the shared end screen’s', () => {
    const src = [code('src/screens/lab/kit/LabEndScreen.tsx'), code('src/screens/lab/kit/labEnd.ts'), code(`${DIR}/TuningLabScreen.tsx`)].join('\n');
    const gt = textOf(TUNING_END_GUIDE as unknown as Guide);
    for (const n of ['LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'START OVER (PRACTICE)', '■ STOP']) {
      assert.ok(src.includes(n), `"${n}" is no longer in the end-screen source`);
      assert.ok(gt.includes(n), `the end guide never names "${n}"`);
    }
  });
});

describe('4. TRY THIS numbers are what the chapters print (A4 = 440)', () => {
  it('ch0: ROOT 261.63 Hz, OCTAVE 523.25 Hz', () => {
    assert.equal(f2(C4), '261.63');
    assert.equal(f2(C4 * 2), '523.25');
    for (const s of ['ROOT reads 261.63 Hz', 'OCTAVE 523.25 Hz']) assert.ok(all(0).includes(s), s);
  });
  it('ch1: fifth at 701.96 ¢; C3→C4 130.81 Hz, C4→C5 261.63 Hz', () => {
    assert.equal(f2(M.PURE_FIFTH.cents), '701.96');
    assert.equal(M.PURE_FIFTH.exactLabel, '3/2');
    assert.equal(f2(C4 - C4 / 2), '130.81');
    assert.equal(f2(C4 * 2 - C4), '261.63');
    for (const s of ['RATIO 3/2, CENTS 701.96 ¢', '130.81 → 261.63']) assert.ok(t(1).includes(s), s);
  });
  it('ch2: 5/4 at 386.31 ¢; 3:2 solved at 701.96 ¢; 261.63 × 3/2 = 392.44 Hz', () => {
    assert.equal(f2(M.JUST_MAJOR_THIRD.cents), '386.31');
    assert.equal(f2(C4 * 1.5), '392.44');
    assert.match(code(`${DIR}/chapters/ch2Landmarks.tsx`), /if \(Math\.abs\(c - TARGET\) < 0\.01 && !solved\)/);
    for (const s of ['CENTS reads 386.31 ¢', 'green at 701.96 ¢']) assert.ok(t(2).includes(s), s);
    assert.ok(all(2).includes('392.44 Hz'));
  });
  it('ch3: 9/4 → 9/8 (2.2500 → 1.1250); 27/8 → 27/16 (3.3750 → 1.6875); 3/4 ÷2 → 3/8 BELOW', () => {
    assert.equal((9 / 4).toFixed(4), '2.2500');
    assert.equal((9 / 8).toFixed(4), '1.1250');
    assert.equal((27 / 8).toFixed(4), '3.3750');
    assert.equal((27 / 16).toFixed(4), '1.6875');
    assert.ok(3 / 8 < 1);
    assert.match(code(`${DIR}/chapters/ch3Octave.tsx`), /const CHALLENGES: Frac\[\] = \[frac\(9, 4\), frac\(27, 8\), frac\(3, 4\)\];/);
    for (const s of ['VALUE 2.2500', '(1.1250, INSIDE)', 'VALUE 3.3750', '27/16, VALUE 1.6875', '3/8 drops further BELOW']) assert.ok(t(3).includes(s), s);
  });
  it('ch4: Equal +13.69 ¢ / +10.38 Hz; Pythagorean 407.82 ¢, +21.51 ¢ / +16.35 Hz', () => {
    const diff = (ratio: number) => M.partialDifferenceHz(M.harmonicFrequency(C4 * ratio, 4), M.harmonicFrequency(C4, 5));
    assert.equal(f2(M.ET_MAJOR_THIRD.cents), '400.00');
    assert.equal(f2(M.ET_MAJOR_THIRD.cents - M.JUST_MAJOR_THIRD.cents), '13.69');
    assert.equal(f2(diff(M.ET_MAJOR_THIRD.numericRatio)), '10.38');
    assert.equal(f2(M.PYTHAGOREAN_MAJOR_THIRD.cents), '407.82');
    assert.equal(f2(M.PYTHAGOREAN_MAJOR_THIRD.cents - M.JUST_MAJOR_THIRD.cents), '21.51');
    assert.equal(f2(diff(M.PYTHAGOREAN_MAJOR_THIRD.numericRatio)), '16.35');
    assert.match(code(`${DIR}/chapters/ch4Harmonics.tsx`), /const diff = partialDifferenceHz\(p4, p5\);/);
    for (const s of ['THIRD 400.00 ¢, FROM 5/4 +13.69 ¢, PARTIALS Δ +10.38 Hz', '407.82 ¢, FROM 5/4 +21.51 ¢, PARTIALS Δ +16.35 Hz']) assert.ok(t(4).includes(s), s);
    assert.match(code(`${DIR}/chapters/ch4Harmonics.tsx`), /const MIN = 380, MAX = 410;/);
  });
  it('ch5: D 9/8 at 203.91 ¢ after one ÷2; B♯ at 23.46 ¢', () => {
    const chain = M.buildPythagoreanFifthChain(M.frac(1, 1), 12);
    assert.equal(chain[2].spelling, 'D');
    assert.equal(M.fracLabel(chain[2].unreduced), '9/4');
    assert.equal(chain[2].reductions.length, 1);
    assert.equal(f2(chain[2].cents), '203.91');
    assert.equal(chain[12].spelling, 'B♯');
    assert.equal(f2(chain[12].cents), '23.46');
    for (const s of ['D lands at 203.91 ¢', 'B♯ at 23.46 ¢']) assert.ok(t(5).includes(s), s);
  });
  it('ch6: ACTUAL B♯ 265.19 Hz, GAP 23.46 ¢, 3.57 Hz apart', () => {
    const bs = C4 * M.PYTHAGOREAN_COMMA.numericRatio;
    assert.equal(f2(bs), '265.19');
    assert.equal(f2(M.PYTHAGOREAN_COMMA.cents), '23.46');
    assert.equal(f2(bs - C4), '3.57');
    for (const s of ['EXPECTED C 261.63 Hz, ACTUAL B♯ 265.19 Hz, GAP 23.46 ¢', '3.57 Hz apart']) assert.ok(t(6).includes(s), s);
  });
  it('ch7: E 5/4 327.03 Hz; tonic D keeps D→A = 40/27 (21.51 ¢ narrow), misses F♯ and C♯; RETUNE moves 2, adds 2', () => {
    assert.equal(f2(C4 * 1.25), '327.03');
    const J: Record<string, [number, number]> = { C: [1, 1], D: [9, 8], E: [5, 4], F: [4, 3], G: [3, 2], A: [5, 3], B: [15, 8] };
    const fr = (k: string) => M.frac(...J[k]);
    const dA = M.normalizeFracToOctave(M.fracDiv(fr('A'), fr('D'))).ratio;
    assert.equal(M.fracLabel(dA), '40/27');
    assert.equal(f2(M.PURE_FIFTH.cents - M.ratioToCents(M.fracValue(dA))), '21.51');
    // RETUNE around D (the chapter's own construction: tonic × each Just ratio, folded, D-major spelling).
    const spell = ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'];
    const retuned = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((deg, k) => ({ sp: spell[k], r: M.normalizeFracToOctave(M.fracMul(fr('D'), fr(deg))).ratio }));
    const moved = retuned.filter((x) => J[x.sp] && !M.fracEq(M.frac(...J[x.sp]), x.r)).map((x) => x.sp);
    const added = retuned.filter((x) => !J[x.sp]).map((x) => x.sp);
    assert.deepEqual(moved, ['E', 'A']);
    assert.deepEqual(added, ['F♯', 'C♯']);
    assert.match(code(`${DIR}/chapters/ch7Just.tsx`), /`\$\{keyDemo\.moved\.length\} \+ \$\{keyDemo\.added\.length\} new`/);
    assert.match(code(`${DIR}/chapters/ch7Just.tsx`), /\.\.\.\(revealed >= 5\s*\?/);
    // KEEP's bezel is TONIC / MODE / IMPURE / SOUND — the D → A line is in the LAB NOTES card, signed.
    assert.ok(code(`${DIR}/chapters/ch7Just.tsx`).includes("`✗ not ${c.wantLabel} (${c.offCents > 0 ? '+' : ''}${c.offCents.toFixed(2)} ¢)`"));
    assert.ok(code(`${DIR}/chapters/ch7Just.tsx`).includes("{tonic} major needs {keyDemo.missingNotes.join(' and ')}"));
    assert.equal((M.ratioToCents(M.fracValue(dA)) - M.PURE_FIFTH.cents).toFixed(2), '-21.51');
    for (const s of ['NOTE E 5/4, CENTS 386.31 ¢, Hz 327.03 Hz', 'in LAB NOTES, D → A reads 40/27 (−21.51 ¢)', 'D major needs F♯ and C♯', 'MOVED reads 2 + 2 new', 'E and A move, F♯ and C♯ are new']) assert.ok(t(7).includes(s), s);
  });
  it('ch8: PYTH E 407.82 ¢, JUST E 386.31 ¢, 81/80 = 21.51 ¢ — and the same split on A and B', () => {
    assert.equal(f2(M.SYNTONIC_COMMA.cents), '21.51');
    const py = M.TUNING_SYSTEMS.pythagorean.notes, ju = M.TUNING_SYSTEMS.just.notes;
    for (const sp of ['E', 'A', 'B']) {
      const a = py.find((n: { spelling: string }) => n.spelling === sp).value.cents;
      const b = ju.find((n: { spelling: string }) => n.spelling === sp).value.cents;
      assert.equal(f2(a - b), '21.51', sp);
    }
    for (const s of ['PYTH E reads 407.82 ¢, JUST E 386.31 ¢, 81/80 21.51 ¢', 'reads 21.51 ¢ each time']) assert.ok(t(8).includes(s), s);
  });
  it('ch9: t 1.118034, D 193.16 ¢; FIFTH 700 → g⁴/4 400.00 ¢ (+13.69 ¢); ⁴√5 696.58 ¢; WOLF 737.64, WIDER BY 41.06; 5.38 ¢ narrower', () => {
    assert.equal(M.MEANTONE_TONE.decimalLabel, '1.118034');
    assert.equal(f2(M.MEANTONE_TONE.cents), '193.16');
    const g = M.centsToRatio(700);
    const th = M.ratioToCents(Math.pow(g, 4) / 4);
    assert.equal(f2(th), '400.00');
    assert.equal(f2(th - M.JUST_MAJOR_THIRD.cents), '13.69');
    assert.equal(f2(M.MEANTONE_FIFTH.cents), '696.58');
    assert.equal(f2(M.PURE_FIFTH.cents - M.MEANTONE_FIFTH.cents), '5.38');
    const w = M.meantoneWolf();
    assert.equal(f2(w.wolfCents), '737.64');
    assert.equal(f2(w.normalFifthCents), '696.58');
    assert.equal(f2(w.widerThanNormalBy), '41.06');
    assert.match(code(`${DIR}/chapters/ch9Meantone.tsx`), /const MIN = 690, MAX = 705;/);
    assert.match(code(`${DIR}/chapters/ch9Meantone.tsx`), /const \[fifthCents, setFifthCents\] = useState\(700\);/);
    for (const s of ['t = 1.118034 (the step from C to D) and D at 193.16 ¢', 'g⁴/4 reads 400.00 ¢, FROM 5/4 +13.69 ¢', 'FIFTH 696.58 ¢', 'WOLF 737.64 ¢, NORMAL 696.58 ¢, WIDER BY 41.06 ¢']) assert.ok(t(9).includes(s), s);
    assert.ok(all(9).includes('5.38 ¢ narrower'));
  });
  it('ch10: step 1 = 1.059463, 277.18 Hz (+15.56 Hz); the last step adds 29.37 Hz', () => {
    const ch = M.buildEqualChromatic();
    assert.equal(ch[1].value.decimalLabel, '1.059463');
    assert.equal(f2(C4 * ch[1].value.numericRatio), '277.18');
    assert.equal(f2(C4 * ch[1].value.numericRatio - C4), '15.56');
    assert.equal(f2(C4 * ch[12].value.numericRatio - C4 * ch[11].value.numericRatio), '29.37');
    // The bezel is STEP / RATIO / Hz; the per-step +Hz is the LAB NOTES card's line.
    assert.ok(code(`${DIR}/chapters/ch10Equal.tsx`).includes('= +{(hz(built) - hz(built - 1)).toFixed(2)} Hz'));
    for (const s of ['RATIO 1.059463, Hz 277.18 Hz; the LAB NOTES card reads +15.56 Hz', 'LAB NOTES reads +29.37 Hz for the last step']) assert.ok(t(10).includes(s), s);
    // A → B lights BOTH patterns for the whole clip; only A then B shows the move.
    assert.ok(code(`${DIR}/chapters/ch10Equal.tsx`).includes("last === 'ab' ? [...pattern, ...pattern.map((s) => s + 5)]"));
    assert.ok(t(10).includes('Play A · PATTERN IN C, then B · STARTING ON F'));
    assert.doesNotMatch(t(10), /Play A → B[^.]*watch/);
  });
  it('ch11: E vs equal −13.69 ¢ (Just) and +7.82 ¢ (Pythagorean); A4 = 442 → C 262.81 Hz; E is the default degree', () => {
    const e = (id: string) => M.deviationFromEqualCents(M.TUNING_SYSTEMS[id].notes[2]);
    assert.equal(M.TUNING_SYSTEMS.just.notes[2].spelling, 'E');
    assert.equal(e('just').toFixed(2), '-13.69');
    assert.equal(e('pythagorean').toFixed(2), '7.82');
    assert.equal(f2(442 * Math.pow(2, -9 / 12)), '262.81');
    const s11 = code(`${DIR}/chapters/ch11Systems.tsx`);
    assert.match(s11, /const \[sysId, setSysId\] = useState<TuningSystemId>\('just'\);/);
    assert.match(s11, /const \[sel, setSel\] = useState\(2\);/);
    assert.match(s11, /C FIXED AT \{root\.toFixed\(2\)\} Hz/);
    for (const s of ['−13.69 ¢ to +7.82 ¢', 'C FIXED AT 262.81 Hz', 'Set A4 = 440 again']) assert.ok(t(11).includes(s), s);
  });
  it('ch13: 9/4 ÷2 → 9/8 (1.1250 INSIDE); SHOW ME → 386.31 ¢, 4 × RATIO 5.0000; E at 386.31 / 400.00 / 407.82 ¢', () => {
    assert.equal((4 * M.JUST_MAJOR_THIRD.numericRatio).toFixed(4), '5.0000');
    assert.match(code(`${DIR}/chapters/ch13Apply.tsx`), /const MIN = 370, MAX = 430;/);
    for (const id of ['just', 'equal', 'pythagorean']) assert.ok(t(13).includes(`${f2(M.TUNING_SYSTEMS[id].notes[2].value.cents)} ¢`), id);
    for (const s of ['VALUE 1.1250, REGION INSIDE', 'THIRD 386.31 ¢ and 4 × RATIO reads 5.0000']) assert.ok(t(13).includes(s), s);
  });
  it('ch13: DONE sits on FOLD and THIRD only; every challenge ticks on a right answer, not a first try', () => {
    const s13 = code(`${DIR}/chapters/ch13Apply.tsx`);
    assert.equal(s13.split('\n').filter((l) => l.trim() === 'doneCell,').length, 2);
    assert.match(s13, /\.\.\.E_SYSTEMS\.map[^\n]*\n\s*soundCell\(status, 0\.9\),/);
    assert.ok(s13.includes('const c2Correct = RULES.every((r) => picks[r.rule] === r.answer);'));
    for (const n of [2, 4, 5]) assert.ok(s13.includes(`onCorrect={() => mark(${n})}`), `challenge ${n + 1} ticks on a right answer`);
    const g = all(13);
    assert.ok(g.includes('DONE shows on FOLD (1) and THIRD (4), and E MOVES (6) shows the three E’s and SOUND'));
    assert.ok(g.includes('do challenge 2 (match the rule) and answer the questions for 3, 5 and 6'));
    assert.ok(g.includes('gets a check mark once you get it right'));
    assert.doesNotMatch(g, /perfect answers are not needed/);
  });
});

describe('4b. BASIC / MATH: only some chapters read the flag — the guide must not say every chapter', () => {
  it('at least one chapter ignores mathView, and ch0 says "in the chapters that have it"', () => {
    const reading = CH_FILES.filter((f) => code(`${DIR}/chapters/${f}.tsx`).includes('ctx.mathView'));
    assert.ok(reading.length > 0 && reading.length < CH_FILES.length, reading.join(','));
    assert.ok(all(0).includes('to MATH to see the working-out under the display, in the chapters that have it'));
    assert.doesNotMatch(all(0), /in every chapter/);
  });
  it('ch3: Your turn starts on 9/4; 27/8 arrives from the LAB NOTES NEXT button', () => {
    const s3 = code(`${DIR}/chapters/ch3Octave.tsx`);
    assert.ok(s3.includes('const [value, setValue] = useState<Frac>(CHALLENGES[0]);'));
    assert.ok(s3.includes('`NEXT: ${fracLabel(CHALLENGES[ci + 1])} ›`'));
    assert.ok(t(3).includes('Your turn starts on 9/4. Fold it, then press NEXT: 27/8 › in LAB NOTES'));
  });
});

describe('5. wiring: LabHeader takes the guide, ScreenGuideHost wraps the content', () => {
  const SCR = code(`${DIR}/TuningLabScreen.tsx`);
  it('the chapter guide by registry index, the end guide on FINISH, the chapter title on the card', () => {
    assert.match(SCR, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(SCR, /import \{ TUNING_END_GUIDE, TUNING_SCREEN_GUIDES \} from '\.\/tuningScreenGuides';/);
    assert.match(SCR, /<LabHeader[\s\S]*?guide=\{ending \? TUNING_END_GUIDE : TUNING_SCREEN_GUIDES\[def\.index\]\}[\s\S]*?guideTitle=\{ending \? 'WHAT’S LEFT' : def\.title\.toUpperCase\(\)\}/);
  });
  it('the host wraps the root’s content; a chapter change closes the guide; regions on rack chapters only', () => {
    assert.match(SCR, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 8 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : String\(chapter\)\} regions=\{rack && !ending\}>\s*<LabHeader/);
    assert.match(SCR, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('the reading chapter is the only one without a Rack Unit (guide 12 says it is a reading page)', () => {
    const reg = code(`${DIR}/chapters/index.ts`);
    assert.match(reg, /\{ index: 12, title: CHAPTER_TITLES\[12\], short: 'Tradeoffs', objective: '[^']*', Component: Ch12Tradeoffs \}/);
    assert.equal((reg.match(/rack: true/g) ?? []).length, 13);
    assert.ok(GUIDES[12].seeing[0].startsWith('This chapter is a reading page, with no display.'));
  });
});

describe('6. chip decision: concept lab — no AccuracyNote anywhere in the lab', () => {
  it('neither the shell (reading chapter) nor the rack well draws one; the honesty badge stays', () => {
    assert.doesNotMatch(code(`${DIR}/TuningLabScreen.tsx`), /AccuracyNote/);
    assert.doesNotMatch(code(`${DIR}/rackLayout.tsx`), /AccuracyNote/);
    assert.match(code(`${DIR}/rackLayout.tsx`), /export const BADGE_EXACT = 'CALCULATED — exact ratios, nothing measured';/);
    assert.ok(all(0).includes('The tones here are exact, so any difference you hear comes from the tuning.'));
  });
});
