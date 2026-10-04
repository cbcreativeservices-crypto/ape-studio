/**
 * PERFORMANCE HUNT — AREA 2 (STUDY), 2026-10-03.
 *
 * One receipt per fix. Every test below FAILED against the HEAD (4201f49f)
 * files — each edited file copied aside, `git show HEAD:<path>` written back,
 * this file run, the copies restored and checked with cmp.
 *
 *  1. Flashcards term art: expo-image with a memory+disk cache, and the whole
 *     topic's art prefetched in ONE expo-image call into that cache.
 *  2. Scenarios: every image figure in all three rounds is prefetched when the
 *     homework loads; the figure renders through the same cache.
 *  3. Quiz + Final Exam: every figure in the paper is prefetched when the
 *     attempt opens; figures render through the memory+disk cache.
 *  4. Quiz + Final Exam countdown: the 250 ms tick re-renders the paper only
 *     when the SHOWN clock changes (4 renders/s → 1).
 *  5. Quiz + Final Exam submit: the two post-submit storage clears run in one
 *     round trip before the result screen opens.
 *  6. Enrollments browse: a topic tap re-renders one memoised row, not ~170.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { nextClockMs } from '../src/features/assess/clockTick.ts';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const rnImport = (s: string) => {
  const m = s.match(/import\s*\{([^}]*)\}\s*from 'react-native';/);
  return m ? m[1] : '';
};

describe('1. Flashcards term art', () => {
  const s = src('src/screens/study/FlashcardsScreen.tsx');
  it('renders through expo-image, not react-native Image', () => {
    assert.match(s, /import \{ Image \} from 'expo-image';/);
    assert.doesNotMatch(rnImport(s), /\bImage\b/);
  });
  it('prefetches the topic art into the memory+disk cache in one call', () => {
    assert.match(s, /Image\.prefetch\(uris, 'memory-disk'\)/);
  });
  it('every term image reads that cache', () => {
    const imgs = s.match(/<Image accessible[\s\S]*?\/>/g) ?? [];
    assert.equal(imgs.length, 3);
    for (const i of imgs) {
      assert.match(i, /cachePolicy="memory-disk"/);
      assert.match(i, /contentFit="contain"/);
      assert.match(i, /onError=/, 'a broken image still falls back to text');
    }
  });
});

describe('2. Scenarios figures', () => {
  const s = src('src/screens/study/ScenariosScreen.tsx');
  it('expo-image, prefetched when the homework loads', () => {
    assert.match(s, /import \{ Image \} from 'expo-image';/);
    assert.doesNotMatch(rnImport(s), /\bImage\b/);
    const load = s.indexOf('fetchScenarioHomework(achievementId).then(');
    const pre = s.indexOf("Image.prefetch(figures, 'memory-disk')");
    assert.ok(load > 0 && pre > load, 'prefetch runs inside the homework load');
    assert.match(s, /q\.media\?\.kind === 'image' \? \[q\.media\.url\]/);
    assert.match(s, /cachePolicy="memory-disk"/);
  });
});

describe('3. Quiz + Final Exam figures', () => {
  for (const [file, list] of [
    ['src/screens/quiz/QuizScreen.tsx', 'p.questions'],
    ['src/screens/exam/FinalExamScreen.tsx', 'p.items'],
  ] as const) {
    it(`${file}: prefetch the paper's figures at start`, () => {
      const s = src(file);
      assert.match(s, /import \{ Image \} from 'expo-image';/);
      assert.doesNotMatch(rnImport(s), /\bImage\b/);
      assert.ok(s.includes(`${list}.map((q) => q.media_url)`));
      assert.match(s, /Image\.prefetch\(figures, 'memory-disk'\)/);
      assert.match(s, /cachePolicy="memory-disk"/);
    });
  }
});

describe('4. Countdown renders only when the shown clock changes', () => {
  it('nextClockMs keeps the previous value inside one shown second', () => {
    assert.equal(nextClockMs(125_000, 124_750), 125_000); // both show 2:05
    assert.equal(nextClockMs(125_000, 124_000), 124_000); // 2:04 now
  });
  it('the one-minute and zero edges still land on the same tick', () => {
    // 60_000 → 59_999 is still "1:00" but is now under a minute.
    assert.equal(nextClockMs(60_000, 59_999), 59_999);
    assert.equal(nextClockMs(1, 0), 0);
    assert.equal(nextClockMs(0, -250), 0);
  });
  it('ten seconds of 250 ms ticks: ~11 renders instead of 40', () => {
    const deadline = 10_000;
    let state = deadline;
    let renders = 0;
    for (let t = 250; t <= 10_000; t += 250) {
      const next = nextClockMs(state, deadline - t);
      if (next !== state) renders++;
      state = next;
    }
    assert.ok(renders <= 11, `renders=${renders}`);
  });
  for (const file of ['src/screens/quiz/QuizScreen.tsx', 'src/screens/exam/FinalExamScreen.tsx']) {
    it(`${file} ticks through nextClockMs`, () => {
      const s = src(file);
      assert.match(s, /setMsLeft\(\(prev\) => nextClockMs\(prev, left\)\)/);
      assert.doesNotMatch(s, /setMsLeft\(left\);/);
    });
  }
});

describe('5. Post-submit clears in one round trip', () => {
  it('quiz', () => {
    const s = src('src/screens/quiz/QuizScreen.tsx');
    assert.match(s, /await Promise\.all\(\[clearAttemptDraft\(args\.attemptId\), clearQuizIntent\(achievementId\)\]\);/);
  });
  it('final exam', () => {
    const s = src('src/screens/exam/FinalExamScreen.tsx');
    assert.match(s, /await Promise\.all\(\[clearAttemptDraft\(args\.attemptId\), clearExamIntent\(awardType, awardId\)\]\);/);
  });
});

describe('6. Enrollments browse rows are memoised', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  it('TopicAddRow is a memo component fed primitives + one stable handler', () => {
    assert.match(s, /const TopicAddRow = memo\(function TopicAddRow\(/);
    assert.match(s, /const onTopicRowPress = useCallback\(\(gs: number, locked: boolean, coreLocked: boolean\) => \{[\s\S]*?\}, \[\]\);/);
    assert.match(s, /<TopicAddRow\s+key=\{gs\}[\s\S]*?onRowPress=\{onTopicRowPress\}/);
  });
  it('the press rules are unchanged (locked notice, double-tap guard, toggle)', () => {
    const i = s.indexOf('const onTopicRowPress');
    const body = s.slice(i, s.indexOf('}, []);', i));
    assert.ok(body.indexOf("'This topic stays'") > 0);
    assert.ok(body.indexOf('lastRowTap.current = { gs, at: now };') < body.indexOf('toggleTopic(gs);'));
  });
});
