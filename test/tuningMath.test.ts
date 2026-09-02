/**
 * Tuning & Temperament Lab — mathematical tests (build spec Stage 5 §5, all
 * 27 required assertions plus structure checks). Node's built-in runner:
 * npm test. Irrational values are compared with tolerances, never strictly.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  C4_ET, ratioToCents, centsToRatio, frequencyFromRatio, normalizeRatioToOctave, normalizeRatioTrace,
  normalizeFracToOctave, frac, fracValue, fracEq, fracDiv, centsDifference,
  buildPythagoreanFifthChain, buildPythagoreanCMajor, buildCommonFiveLimitCMajor,
  buildQuarterCommaMeantoneC, buildTwelveToneEqualTemperament, harmonicFrequency, partialDifferenceHz,
  PYTHAGOREAN_COMMA, PYTHAGOREAN_COMMA_FRAC, SYNTONIC_COMMA, SYNTONIC_COMMA_FRAC,
  MEANTONE_FIFTH, MEANTONE_FIFTH_RATIO, MEANTONE_TONE_RATIO, ET_SEMITONE, ET_FIFTH, ET_MAJOR_THIRD,
  TUNING_SYSTEMS, meantoneWolf, deviationFromEqualCents, nearestLandmark,
} from '../src/features/tuning/tuningMath.ts';

const near = (a: number, b: number, tol = 1e-4) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (tol ${tol})`);

describe('ratio ↔ cents', () => {
  it('1. ratioToCents(2) = 1200', () => assert.equal(ratioToCents(2), 1200));
  it('2. ratioToCents(3/2) ≈ 701.95500', () => near(ratioToCents(3 / 2), 701.955, 1e-3));
  it('3. ratioToCents(5/4) ≈ 386.31371', () => near(ratioToCents(5 / 4), 386.31371, 1e-4));
  it('cents → ratio round-trips', () => near(centsToRatio(ratioToCents(1.234)), 1.234, 1e-12));
  it('rejects non-positive ratios rather than returning NaN', () => {
    assert.throws(() => ratioToCents(0));
    assert.throws(() => ratioToCents(-1));
    assert.throws(() => ratioToCents(NaN));
  });
});

describe('octave normalization', () => {
  it('4. normalizeRatioToOctave(9/4) = 9/8', () => near(normalizeRatioToOctave(9 / 4), 9 / 8, 1e-12));
  it('5. normalizeRatioToOctave(3/4) = 3/2', () => near(normalizeRatioToOctave(3 / 4), 3 / 2, 1e-12));
  it('exact fraction trace shows every step (27/8 → 27/16 in one ÷2)', () => {
    const t = normalizeFracToOctave(frac(27, 8));
    assert.equal(t.steps.length, 1);
    assert.equal(t.steps[0].op, '÷2');
    assert.ok(fracEq(t.ratio, frac(27, 16)));
  });
  it('9/4 trace: one ÷2 with before/after visible', () => {
    const t = normalizeRatioTrace(9 / 4);
    assert.equal(t.steps.length, 1);
    near(t.steps[0].before, 2.25);
    near(t.steps[0].after, 1.125);
  });
  it('27. every normalized ratio lands in [1, 2)', () => {
    for (const r of [0.1, 0.75, 1, 1.999, 2, 2.25, 3.375, 10, 531441 / 524288 * 128]) {
      const n = normalizeRatioToOctave(r);
      assert.ok(n >= 1 && n < 2, `${r} → ${n}`);
    }
  });
});

describe('commas', () => {
  it('6. Pythagorean comma ratio = 531441/524288', () => {
    assert.ok(fracEq(PYTHAGOREAN_COMMA_FRAC, frac(531441, 524288)));
    near(PYTHAGOREAN_COMMA.numericRatio, 1.013643, 1e-6);
  });
  it('7. Pythagorean comma ≈ 23.46001 cents', () => near(PYTHAGOREAN_COMMA.cents, 23.46001, 1e-4));
  it('twelve fifths minus seven octaves reproduces the comma from the chain', () => {
    const chain = buildPythagoreanFifthChain(frac(1, 1), 12);
    const last = chain[12];
    assert.equal(last.spelling, 'B♯');
    assert.ok(fracEq(last.normalized, frac(531441, 524288)));
    const totalReductions = chain.reduce((a, s) => a + s.reductions.length, 0);
    assert.equal(totalReductions, 7); // seven octave equivalents identified
  });
  it('8. syntonic comma ratio = 81/80', () => {
    assert.ok(fracEq(SYNTONIC_COMMA_FRAC, frac(81, 80)));
    assert.ok(fracEq(fracDiv(frac(81, 64), frac(5, 4)), frac(81, 80)));
    near(SYNTONIC_COMMA.numericRatio, 1.0125, 1e-12);
  });
  it('9. syntonic comma ≈ 21.50629 cents', () => near(SYNTONIC_COMMA.cents, 21.50629, 1e-4));
});

describe('quarter-comma meantone', () => {
  it('10. generator = 5^(1/4)', () => near(MEANTONE_FIFTH_RATIO, Math.pow(5, 0.25), 1e-12));
  it('11. meantone fifth ≈ 696.57843 cents', () => near(MEANTONE_FIFTH.cents, 696.57843, 1e-4));
  it('12. four meantone fifths reduced by two octaves = 5/4', () => near(Math.pow(MEANTONE_FIFTH_RATIO, 4) / 4, 5 / 4, 1e-12));
  it('13. whole tone squared = 5/4', () => near(MEANTONE_TONE_RATIO * MEANTONE_TONE_RATIO, 5 / 4, 1e-12));
  it('g equals (3/2) ÷ (81/80)^(1/4)', () => near(MEANTONE_FIFTH_RATIO, 1.5 / Math.pow(81 / 80, 0.25), 1e-12));
  it('wolf for the E♭…G♯ chain ≈ 737.64 cents, ≈ 41.06 wider than a normal fifth', () => {
    const w = meantoneWolf();
    near(w.wolfCents, 737.637, 1e-2);
    near(w.widerThanNormalBy, 41.06, 1e-1);
  });
});

describe('equal temperament', () => {
  it('14. 2^(1/12) produces 100 cents', () => near(ET_SEMITONE.cents, 100, 1e-9));
  it('15. twelve semitones produce ratio 2', () => near(Math.pow(Math.pow(2, 1 / 12), 12), 2, 1e-12));
  it('16. ET fifth = 700 cents', () => near(ET_FIFTH.cents, 700, 1e-9));
  it('17. ET major third = 400 cents', () => near(ET_MAJOR_THIRD.cents, 400, 1e-9));
  it('ET fifth is ≈1.955 cents narrower than 3/2; ET third ≈13.686 wider than 5/4', () => {
    near(centsDifference(3 / 2, ET_FIFTH.numericRatio), 1.955, 1e-3);
    near(centsDifference(ET_MAJOR_THIRD.numericRatio, 5 / 4), 13.686, 1e-3);
  });
});

describe('frequencies from the shared C4 root', () => {
  const root = C4_ET;
  const py = buildPythagoreanCMajor();
  const ju = buildCommonFiveLimitCMajor();
  const et = buildTwelveToneEqualTemperament();
  const note = (s: ReturnType<typeof buildPythagoreanCMajor>, sp: string, degree: number) => s.notes.find((n) => n.spelling === sp && n.degree === degree)!;
  it('C4 root is 261.625565 Hz', () => near(root, 261.625565, 1e-6));
  it('18. Pythagorean E ≈ 331.119856 Hz', () => near(frequencyFromRatio(root, note(py, 'E', 3).value.numericRatio), 331.119856, 1e-5));
  it('19. Just E ≈ 327.031957 Hz', () => near(frequencyFromRatio(root, note(ju, 'E', 3).value.numericRatio), 327.031957, 1e-5));
  it('20. ET E ≈ 329.627557 Hz', () => near(frequencyFromRatio(root, note(et, 'E', 3).value.numericRatio), 329.627557, 1e-5));
  it('21–23. Pythagorean and Just E, A, B differ by exactly 81/80', () => {
    for (const [sp, deg] of [['E', 3], ['A', 6], ['B', 7]] as const) {
      near(note(py, sp, deg).value.numericRatio / note(ju, sp, deg).value.numericRatio, 81 / 80, 1e-12);
    }
  });
  it('C, D, F, G match between the selected Pythagorean and Just examples', () => {
    for (const [sp, deg] of [['C', 1], ['D', 2], ['F', 4], ['G', 5]] as const) {
      near(note(py, sp, deg).value.numericRatio, note(ju, sp, deg).value.numericRatio, 1e-12);
    }
  });
  it('spec reference table — meantone D4 ≈ 292.51, A4 ≈ 437.40, B4 ≈ 489.03', () => {
    const mt = buildQuarterCommaMeantoneC();
    near(frequencyFromRatio(root, note(mt, 'D', 2).value.numericRatio), 292.51, 5e-3);
    near(frequencyFromRatio(root, note(mt, 'A', 6).value.numericRatio), 437.40, 5e-3);
    near(frequencyFromRatio(root, note(mt, 'B', 7).value.numericRatio), 489.03, 5e-3);
  });
  it('spec reference table — Pythagorean A4 ≈ 441.49, Just A4 ≈ 436.04, ET A4 = 440', () => {
    near(frequencyFromRatio(root, note(py, 'A', 6).value.numericRatio), 441.49, 5e-3);
    near(frequencyFromRatio(root, note(ju, 'A', 6).value.numericRatio), 436.04, 5e-3);
    near(frequencyFromRatio(root, note(et, 'A', 6).value.numericRatio), 440, 1e-9);
  });
});

describe('harmonics', () => {
  it('24. root harmonic 5 and just-third harmonic 4 coincide', () => {
    const f = C4_ET;
    near(partialDifferenceHz(harmonicFrequency(f * 5 / 4, 4), harmonicFrequency(f, 5)), 0, 1e-9);
  });
  it('25. root harmonic 5 and Pythagorean-third harmonic 4 differ by 0.0625·f', () => {
    const f = C4_ET;
    near(partialDifferenceHz(harmonicFrequency(f * 81 / 64, 4), harmonicFrequency(f, 5)), 0.0625 * f, 1e-9);
    near(0.0625 * f, 16.35, 5e-3);
  });
  it('harmonic 1 is the fundamental; harmonic 2 is the first overtone', () => {
    assert.equal(harmonicFrequency(100, 1), 100);
    assert.equal(harmonicFrequency(100, 2), 200);
    assert.throws(() => harmonicFrequency(100, 0));
  });
});

describe('structure', () => {
  it('26. every generated ratio and frequency is positive and finite', () => {
    for (const s of Object.values(TUNING_SYSTEMS)) {
      for (const n of s.notes) {
        assert.ok(Number.isFinite(n.value.numericRatio) && n.value.numericRatio > 0);
        assert.ok(Number.isFinite(n.value.cents));
        assert.ok(Number.isFinite(frequencyFromRatio(C4_ET, n.value.numericRatio)));
      }
    }
    for (const s of buildPythagoreanFifthChain(frac(1, 1), 12)) assert.ok(fracValue(s.normalized) >= 1 && fracValue(s.normalized) < 2);
  });
  it('exact labels are exact, decimals are separate', () => {
    const e = TUNING_SYSTEMS.pythagorean.notes.find((n) => n.spelling === 'E')!;
    assert.equal(e.value.exactLabel, '81/64');
    assert.equal(e.value.decimalLabel, '1.265625');
    const g = TUNING_SYSTEMS.meantone.notes.find((n) => n.spelling === 'G')!;
    assert.equal(g.value.exactLabel, '5^(1/4)');
  });
  it('deviation from equal temperament — Pythagorean E is +7.82 cents', () => {
    near(deviationFromEqualCents(TUNING_SYSTEMS.pythagorean.notes.find((n) => n.spelling === 'E')!), 7.82, 1e-2);
  });
  it('landmark snapping finds 3:2 near 702 cents and nothing at 650', () => {
    assert.equal(nearestLandmark(700)!.name, 'Pure perfect fifth');
    assert.equal(nearestLandmark(650), null);
  });
});
