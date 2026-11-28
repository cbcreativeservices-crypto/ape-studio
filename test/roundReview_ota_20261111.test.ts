/**
 * Fill-in and Matching end-of-round review (must-do E4), ported to the OTA
 * branch on 2026-11-11 (owner: "Add both, show me first"). JS only: the round
 * review part of 1.0.1 commit 90bb9838. The location tag, MONO CHECK and the
 * Android ApeDspModule change in that commit are native and stay on the store
 * build (test/nextBuild_E4E5D20_20261107.test.ts on 1.0.1).
 *
 * features/study/studyRounds.ts + RoundReview.tsx; preview #roundreviewpreview.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { ROUND_TERMS, noteAnswer, roundDue, roundTarget, type RoundEntry } from '../src/features/study/studyRounds.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('Fill-in and Matching: end-of-round review', () => {
  const item = (id: string) => ({ id, term: `T${id}`, definition: `D${id}`, wikipedia_url: null, search_query: `q${id}` });

  it('a round is ROUND_TERMS distinct terms, or the whole of a smaller deck', () => {
    assert.equal(ROUND_TERMS, 10);
    assert.equal(roundTarget(162), 10);
    assert.equal(roundTarget(4), 4);
    assert.equal(roundTarget(0), 1);
    let r: RoundEntry[] = [];
    for (let i = 0; i < 9; i++) r = noteAnswer(r, item(String(i)), true);
    assert.equal(roundDue(r, 162), false);
    r = noteAnswer(r, item('9'), false, 'wrong');
    assert.equal(roundDue(r, 162), true);
    assert.equal(roundDue([], 0), false, 'an empty round is never due');
  });
  it('one entry per term; a miss stays marked and keeps the wrong pick', () => {
    let r: RoundEntry[] = [];
    r = noteAnswer(r, item('a'), false, 'Headroom');
    r = noteAnswer(r, item('a'), true);
    r = noteAnswer(r, item('b'), true);
    assert.equal(r.length, 2);
    assert.deepEqual(
      { gotRight: r[0].gotRight, missed: r[0].missed, lastWrong: r[0].lastWrong, searchQuery: r[0].searchQuery },
      { gotRight: true, missed: true, lastWrong: 'Headroom', searchQuery: 'qa' },
    );
    assert.equal(r[1].missed, false);
  });
  it('the panel carries the research links for every term, with the stored article and search phrase', () => {
    const p = read('src/features/study/RoundReview.tsx');
    assert.match(p, /<ResearchMoreLink term=\{e\.term\} wikipediaUrl=\{e\.wikipediaUrl\} searchQuery=\{e\.searchQuery\}/);
    assert.match(p, /entries\.map\(\(e\) =>/);
    assert.match(p, /label="Next round"/);
  });
  for (const [file, method] of [
    ['src/screens/study/FillInBlankScreen.tsx', 'fill_in_blank'],
    ['src/screens/study/MatchingScreen.tsx', 'matching'],
  ] as const) {
    it(`${method}: answers feed the round, the review replaces the screen, then practice carries on`, () => {
      const s = read(file);
      assert.match(s, /roundRef\.current = noteAnswer\(roundRef\.current, /);
      assert.match(s, /if \(review\) \{\s*return \(\s*<RoundReview\s+method="/);
      // The pace clock pauses for the reading and resumes as it was; full screen likewise.
      assert.match(s, new RegExp(`if \\(runningRef\\.current\\) setRunning\\('${method}', false\\);`));
      assert.match(s, new RegExp(`if \\(reviewResume\\.current\\.running\\) setRunning\\('${method}', true\\);`));
      assert.match(s, /if \(reviewResume\.current\.fullscreen\) setFullscreen\(true\);/);
    });
  }
  it('Fill-in shows the review instead of the next question only when the round is full', () => {
    const s = read('src/screens/study/FillInBlankScreen.tsx');
    assert.match(s, /if \(reviewNow\) \{\s*openReview\(\);\s*return;\s*\}[\s\S]*?setQIdx\(\(i\) => i \+ 1\);/);
    assert.match(s, /const closeReview = useCallback\(\(\) => \{\s*session\.current\?\.touch\(\);\s*setReview\(null\);\s*setQIdx\(\(i\) => i \+ 1\);/);
  });
  it('Matching still auto-advances between boards; only a full round stops for the review', () => {
    const s = read('src/screens/study/MatchingScreen.tsx');
    assert.match(s, /if \(reviewNow\) openReviewRef\.current\(\);\s*else goBoardRef\.current\(1\);/);
    assert.match(s, /const closeReview = useCallback\(\(\) => \{\s*setReview\(null\);\s*goBoardRef\.current\(1\);/);
  });
});
