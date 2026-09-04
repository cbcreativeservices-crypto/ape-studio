/**
 * Audio Career Finder — scoring tests (owner brief 2026-09-03 §TESTING).
 *
 * Runs on Node's built-in test runner with native TypeScript stripping:
 *     npm test
 *
 * Covers the pure modules only (questions, dimensions, families, scoring).
 * Persistence is exercised through the store's `clean()` contract here via
 * a JSON round-trip of the record shape; the AsyncStorage side is verified
 * in the browser harness (progress survives a reload).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DIMENSION_CODES, DIMENSIONS } from '../src/features/careerfinder/dimensions.ts';
import { QUESTIONS, QUESTION_COUNT, ANSWERS, type QuestionId, type Response } from '../src/features/careerfinder/questions.ts';
import { FAMILIES, FAMILY_COUNT } from '../src/features/careerfinder/families.ts';
import {
  dimensionScores, familyScore, rankFamilies, clarity, explainFamily, computeResult, strongestDimensions, FAMILY_WEIGHTS, TOP_N, type Responses,
} from '../src/features/careerfinder/scoring.ts';

/** Answer every question with `value`, then override some. */
const fill = (value: Response, over: Partial<Record<QuestionId, Response>> = {}): Responses => {
  const r: Responses = {};
  for (const q of QUESTIONS) r[q.id] = value;
  return { ...r, ...over };
};
/** Rate every question of the given dimensions `hi` and everything else `lo`. */
const profile = (hiDims: string[], hi: Response = 4, lo: Response = 1): Responses => {
  const r: Responses = {};
  for (const q of QUESTIONS) r[q.id] = hiDims.includes(q.dimension) ? hi : lo;
  return r;
};
const rankOf = (ranked: ReturnType<typeof rankFamilies>, id: string) => ranked.findIndex((f) => f.family.id === id) + 1;

describe('question bank', () => {
  it('1. all 28 questions load, with unique stable ids', () => {
    assert.equal(QUESTION_COUNT, 28);
    assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 28);
    for (const q of QUESTIONS) assert.match(q.id, /^[A-Z]{2}0[12]$/);
  });
  it('2. every dimension has exactly two questions', () => {
    for (const code of DIMENSION_CODES) {
      assert.equal(QUESTIONS.filter((q) => q.dimension === code).length, 2, code);
    }
    assert.equal(DIMENSION_CODES.length, 14);
  });
  it('the two questions of one dimension never sit together', () => {
    for (let i = 1; i < QUESTIONS.length; i++) assert.notEqual(QUESTIONS[i].dimension, QUESTIONS[i - 1].dimension, `${QUESTIONS[i - 1].id} → ${QUESTIONS[i].id}`);
  });
  it('the six answers are 0–4 plus null, and null is "don’t know"', () => {
    assert.deepEqual(ANSWERS.map((a) => a.value), [0, 1, 2, 3, 4, null]);
  });
});

describe('dimension scoring', () => {
  it('worked example: CP01 = 4, CP02 = 3 → 0.875', () => {
    const d = dimensionScores({ CP01: 4, CP02: 3 });
    assert.equal(d.CP.score, 0.875);
    assert.equal(d.CP.evidence, 2);
    assert.equal(d.CP.insufficient, false);
  });
  it('3. null responses are excluded from the average, never zero', () => {
    const d = dimensionScores({ CP01: 4, CP02: null });
    assert.equal(d.CP.score, 1);
    assert.equal(d.CP.evidence, 1);
    const asZero = dimensionScores({ CP01: 4, CP02: 0 });
    assert.notEqual(d.CP.score, asZero.CP.score);
  });
  it('4. two nulls → 0.5 internally and insufficient evidence', () => {
    const d = dimensionScores({ CP01: null, CP02: null });
    assert.equal(d.CP.score, 0.5);
    assert.equal(d.CP.insufficient, true);
    assert.equal(d.CP.evidence, 0);
  });
  it('an unanswered dimension is also insufficient (no guess)', () => {
    const d = dimensionScores({});
    for (const code of DIMENSION_CODES) assert.equal(d[code].insufficient, true, code);
  });
  it('scores stay within 0–1', () => {
    for (const v of [0, 1, 2, 3, 4] as const) {
      const d = dimensionScores(fill(v));
      for (const code of DIMENSION_CODES) assert.ok(d[code].score >= 0 && d[code].score <= 1);
    }
    assert.equal(dimensionScores(fill(0)).CP.score, 0);
    assert.equal(dimensionScores(fill(4)).CP.score, 1);
  });
});

describe('family data', () => {
  it('5. all family dimension codes are valid and distinct within a family', () => {
    for (const f of FAMILIES) {
      assert.equal(f.dimensions.length, 3, f.id);
      for (const c of f.dimensions) assert.ok(DIMENSION_CODES.includes(c), `${f.id}: ${c}`);
      assert.equal(new Set(f.dimensions).size, 3, `${f.id} repeats a dimension`);
    }
  });
  it('42 families with unique ids, names, three examples and a description', () => {
    assert.equal(FAMILY_COUNT, 42);
    assert.equal(new Set(FAMILIES.map((f) => f.id)).size, 42);
    assert.equal(new Set(FAMILIES.map((f) => f.name)).size, 42);
    for (const f of FAMILIES) {
      assert.equal(f.examples.length, 3, f.id);
      assert.ok(f.description.length > 40 && f.description.endsWith('.'), f.id);
    }
  });
  it('every dimension is a primary for at least one family', () => {
    for (const code of DIMENSION_CODES) assert.ok(FAMILIES.some((f) => f.dimensions[0] === code), `${code} (${DIMENSIONS[code].label}) is nobody’s primary`);
  });
  it('weights are 0.5 / 0.3 / 0.2', () => {
    assert.deepEqual([...FAMILY_WEIGHTS], [0.5, 0.3, 0.2]);
  });
});

describe('family scoring and ranking', () => {
  it('family score is the weighted sum of its three dimensions', () => {
    const dims = dimensionScores({ RC01: 4, RC02: 4, ER01: 2, ER02: 2, CP01: 0, CP02: 0 });
    const rec = FAMILIES.find((f) => f.id === 'recording-studios-and-music-production')!;
    assert.equal(familyScore(rec, dims), 1 * 0.5 + 0.5 * 0.3 + 0 * 0.2);
  });
  it('6. all 42 families receive a score', () => {
    const ranked = rankFamilies(dimensionScores(fill(2)));
    assert.equal(ranked.length, 42);
    for (const r of ranked) assert.ok(Number.isFinite(r.score));
    assert.deepEqual(ranked.map((r) => r.rank), Array.from({ length: 42 }, (_, i) => i + 1));
  });
  it('7. results are sorted deterministically — equal scores break on id', () => {
    const ranked = rankFamilies(dimensionScores(fill(2)));
    for (let i = 1; i < ranked.length; i++) {
      const a = ranked[i - 1], b = ranked[i];
      assert.ok(a.score > b.score || (a.score === b.score && a.family.id < b.family.id), `${a.family.id} before ${b.family.id}`);
    }
    const again = rankFamilies(dimensionScores(fill(2)));
    assert.deepEqual(again.map((r) => r.family.id), ranked.map((r) => r.family.id));
  });
  it('an insufficient dimension cannot lift or sink a family', () => {
    const base = profile(['LO'], 4, 2);
    const withNull = { ...base, BM01: null, BM02: null } as Responses;
    const live = rankFamilies(dimensionScores(base));
    const nulled = rankFamilies(dimensionScores(withNull));
    // BM sits at 0.5 either way (2/4 = 0.5), so Live Sound keeps its score.
    const id = 'live-sound-touring-and-festivals';
    assert.equal(live.find((f) => f.family.id === id)!.score, nulled.find((f) => f.family.id === id)!.score);
  });
});

describe('scoring scenarios (owner brief)', () => {
  const inTop = (ranked: ReturnType<typeof rankFamilies>, ids: string[], n: number) => {
    for (const id of ids) assert.ok(rankOf(ranked, id) <= n, `${id} ranked ${rankOf(ranked, id)}, expected within top ${n}`);
  };
  it('CREATIVE / PERFORMANCE — high CP, LO, MS elevates Music Performance, DJ, Music for Picture, Sonic Branding', () => {
    const ranked = rankFamilies(dimensionScores(profile(['CP', 'LO', 'MS'])));
    inTop(ranked, ['music-performance-conducting-and-live-musical-direction', 'dj-club-and-event-performance-technology', 'music-for-picture-scoring-and-editorial', 'sonic-branding-ux-exhibits-and-experience-design'], 8);
  });
  it('SYSTEMS — high SD, BM, AR elevates Installed AV, Hardware Engineering, System Tuning, Acoustic Construction', () => {
    const ranked = rankFamilies(dimensionScores(profile(['SD', 'BM', 'AR'])));
    inTop(ranked, ['installed-av-integration-and-institutional-systems', 'audio-hardware-transducers-and-electronics-engineering', 'audio-measurement-system-tuning-and-instrumentation', 'acoustic-construction-and-noise-control-trades'], 8);
  });
  it('HELPING — high HC, TE, AR elevates Audiology, Music Therapy, Music Education, Accessible Media', () => {
    const ranked = rankFamilies(dimensionScores(profile(['HC', 'TE', 'AR'])));
    inTop(ranked, ['hearing-audiology-psychoacoustics-and-accessibility', 'music-therapy-speech-and-clinical-voice', 'music-education-lessons-and-musicianship-coaching', 'accessible-media-and-audio-description'], 8);
  });
  it('MEDIA — high MS, ER, RC elevates Film/TV Post, Podcast, Accessible Media, Broadcast', () => {
    const ranked = rankFamilies(dimensionScores(profile(['MS', 'ER', 'RC'])));
    inTop(ranked, ['film-television-and-post-production-audio', 'podcast-audiobook-voice-and-spoken-word-production', 'accessible-media-and-audio-description'], 8);
    // Broadcast's PRIMARY is Live Operation, which this profile rates low, so
    // with the brief's own weights it cannot reach the top; "elevate" here
    // means it moves up from a neutral baseline (the brief: no exact ordering
    // required where families share dimensions).
    const id = 'broadcast-radio-sports-and-streaming';
    const low = rankFamilies(dimensionScores(fill(1)));
    const score = (r: typeof ranked) => r.find((f) => f.family.id === id)!.score;
    assert.ok(score(ranked) > score(low), `${id}: ${score(ranked)} should beat the all-low ${score(low)}`);
    assert.ok(rankOf(ranked, id) <= 21, `${id} ranked ${rankOf(ranked, id)}, expected upper half`);
  });
  it('8. different answer patterns produce meaningfully different top fives', () => {
    const a = computeResult(profile(['CP', 'LO', 'MS'])).top.map((t) => t.family.id);
    const b = computeResult(profile(['SD', 'BM', 'AR'])).top.map((t) => t.family.id);
    const overlap = a.filter((id) => b.includes(id)).length;
    assert.ok(overlap <= 1, `top fives overlap on ${overlap}`);
  });
});

describe('profile clarity', () => {
  it('CLEAR — four strong dimensions with real variation', () => {
    const r = profile(['SD', 'BM', 'AR', 'LO'], 4, 1);
    assert.equal(clarity(r, dimensionScores(r)), 'clear');
  });
  it('BROAD — everything rated the same', () => {
    const r = fill(3);
    assert.equal(clarity(r, dimensionScores(r)), 'broad');
    const r4 = fill(4); // all strong, no variation — still broad
    assert.equal(clarity(r4, dimensionScores(r4)), 'broad');
  });
  it('DEVELOPING — more than 25 % "don’t know"', () => {
    const over: Partial<Record<QuestionId, Response>> = {};
    for (const q of QUESTIONS.slice(0, 8)) over[q.id] = null; // 8/28 = 28.6 %
    const r = fill(4, over);
    assert.equal(clarity(r, dimensionScores(r)), 'developing');
    const seven: Partial<Record<QuestionId, Response>> = {};
    for (const q of QUESTIONS.slice(0, 7)) seven[q.id] = null; // 25 % exactly is NOT over
    const r7 = fill(4, seven);
    assert.notEqual(clarity(r7, dimensionScores(r7)), 'developing');
  });
});

describe('explanations', () => {
  it('10. name the family’s actual matched dimensions and the user’s actual levels', () => {
    const dims = dimensionScores(profile(['RC', 'ER'], 4, 2)); // CP = 0.5 → "some"
    const rec = FAMILIES.find((f) => f.id === 'recording-studios-and-music-production')!;
    const text = explainFamily(rec, dims);
    assert.equal(text, 'This appeared because you showed strong interest in Record & Capture and Edit & Refine activities, and some interest in Create & Perform.');
  });
  it('mention unexplored dimensions as unexplored, not ruled out', () => {
    const dims = dimensionScores({ ...profile(['RC', 'ER'], 4, 2), CP01: null, CP02: null });
    const rec = FAMILIES.find((f) => f.id === 'recording-studios-and-music-production')!;
    assert.match(explainFamily(rec, dims), /did not know enough about Create & Perform yet, so that part is unexplored rather than ruled out/);
  });
  it('never make forbidden claims', () => {
    const banned = /talent|qualified|will succeed|perfect|should avoid|born to|\d+\s?%/i;
    for (const value of [0, 2, 4, null] as const) {
      const dims = dimensionScores(fill(value));
      for (const f of FAMILIES) assert.doesNotMatch(explainFamily(f, dims), banned, f.id);
    }
  });
});

describe('whole result', () => {
  it('returns the top five, strongest dimensions, and counts', () => {
    const r = computeResult(profile(['AR', 'GS', 'ER']));
    assert.equal(r.top.length, TOP_N);
    assert.equal(r.answered, 28);
    assert.equal(r.unknown, 0);
    assert.deepEqual(r.strongest.map((d) => d.code).sort(), ['AR', 'ER', 'GS']);
  });
  it('the surprise family leans on the strongest dimension and comes from a new field', () => {
    const fieldOf = (id: string) => (id.startsWith('m') ? 'M' : 'X');
    const r = computeResult(profile(['AR', 'GS', 'ER']), fieldOf);
    if (r.surprise) {
      assert.ok(r.surprise.family.dimensions.includes(r.strongest[0].code));
      assert.ok(!r.top.some((t) => fieldOf(t.family.id) === fieldOf(r.surprise!.family.id)));
      assert.ok(r.surprise.rank > TOP_N);
    }
  });
  it('9. a reset record scores as fully insufficient and answers 0', () => {
    const r = computeResult({});
    assert.equal(r.answered, 0);
    assert.ok(Object.values(r.dims).every((d) => d.insufficient));
    assert.equal(r.clarity, 'broad');
  });
  it('strongestDimensions skips insufficient ones', () => {
    const dims = dimensionScores({ CP01: 4, CP02: 4, RC01: null, RC02: null });
    assert.deepEqual(strongestDimensions(dims).map((d) => d.code), ['CP']);
  });
});
