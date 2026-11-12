/**
 * Must-do E3 (2026-11-07) — the website's instructor page follows the same two
 * rules as the app's instructor screen:
 *  1. a quiz score is a COUNT of right answers, printed alone ("24 right");
 *     a value above the largest quiz is explained in words, never printed;
 *  2. never "N of total" progress counts (owner 2026-10-29): "N topics done",
 *     "N in progress", "N labs done"; an unfinished lab reads "Not yet".
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const w = await import('../web/lib/instructorRules.ts');
const read = (rel: string) =>
  readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('web instructor page · quiz scores are counts, not percents', () => {
  it('a score prints alone as right answers', () => {
    assert.equal(w.quizScoreText(24), '24 right');
    assert.equal(w.quizScoreText(29), '29 right');
    assert.equal(w.quizScoreText(0), '0 right');
    assert.equal(w.quizScoreText(30), '30 right');
  });

  it('a score above the largest quiz is never printed', () => {
    assert.equal(w.LARGEST_QUIZ, 30);
    assert.equal(w.quizScoreText(100), null);
    assert.equal(w.quizScoreText(-1), null);
    assert.equal(w.quizScoreText(null), null);
    assert.equal(w.attemptScoreText(100), 'no score on record');
    assert.equal(w.bestScoreText(100, [{ practice: false }]), 'No quiz score on record');
    assert.doesNotMatch(w.bestScoreText(100, [{ practice: false }]), /\d/);
  });

  it('the best-score line', () => {
    assert.equal(w.bestScoreText(24, [{ practice: false }]), 'Best quiz: 24 right');
    assert.equal(w.bestScoreText(null, []), 'No quiz taken yet');
    assert.equal(w.bestScoreText(0, [{ practice: true }]), 'Practice quizzes only');
  });

  it('the page never prints a quiz score with %', () => {
    const s = read('web/components/InstructorDashboard.tsx');
    assert.doesNotMatch(s, /score[^\n]*\}%/, 'a quiz score must not be followed by %');
    assert.doesNotMatch(s, /best quiz \$\{/);
    assert.match(s, /attemptScoreText\(a\.score\)/);
    assert.match(s, /bestScoreText\(t\.best_score, t\.quiz_attempts\)/);
  });
});

describe('web instructor page · no "N of total" progress', () => {
  it('the class row reads done / in progress / done, with no totals', () => {
    const r = w.studentReadouts({ topics_started: 5, topics_complete: 2, labs_complete: 7 });
    assert.deepEqual(r, ['2 topics done', '3 in progress', '7 labs done']);
    assert.deepEqual(w.studentReadouts({ topics_started: 1, topics_complete: 1, labs_complete: 1 }), [
      '1 topic done',
      '0 in progress',
      '1 lab done',
    ]);
    for (const line of r) assert.doesNotMatch(line, /\bof\b|\//);
  });

  it('labs done counts the listed rows; an unfinished lab reads "Not yet"', () => {
    assert.equal(w.labsDoneCount([{ completed_at: '2026-11-01' }, { completed_at: null }]), 1);
    assert.equal(w.labsDoneText(3), '3 labs done');
    assert.equal(w.NOT_YET, 'Not yet');
  });

  it('the page never prints labs_total, topics_started or labs.total as a denominator', () => {
    const s = read('web/components/InstructorDashboard.tsx');
    assert.doesNotMatch(s, /labs_total|topics_started|labs\.total/);
    assert.doesNotMatch(s, /complete of \{/);
    assert.doesNotMatch(s, /labs_complete\}<\/b> \//);
    assert.match(s, /studentReadouts\(s\)/);
    assert.match(s, /: NOT_YET\}/);
  });
});
