/**
 * Study area — overnight toddler pass 1 (2026-10-24). Receipts.
 *
 * 1. MY CUSTOM LIST offered the 15-minute TIME TRIAL. PaceTimerModal shows the
 *    trial only when it gets a `topicId` ("Omit for pseudo-topics with no
 *    server row"), but Flashcards / Fill in the Blank / Matching passed the raw
 *    `achievementId` — 'flagged' on the custom list. A pass then called
 *    credit_time_trial(p_achievement_id uuid := 'flagged'), which can only
 *    fail: "Saving the pass to your account…" through every retry (~8 min),
 *    then "could not be saved … Check your connection". The trial also
 *    promised "this method counts complete toward unlocking the quiz" on a
 *    list that has no quiz to unlock (CUSTOM_LIST_SERVER_READY = false).
 *
 * 2. FLASHCARDS TIME TRIAL COULD BE CLEARED BY MASHING ONE CARD. Marking a
 *    card KNOWN registers one trial "correct". In the Bookmarked / Custom-only
 *    views a known card stays on screen, and the 1.5 s dwell is only re-armed
 *    when the CARD changes — so MARK KNOWN / MARK UNKNOWN / MARK KNOWN … on a
 *    single card added +1 every two taps: ~90 taps cleared the 15-minute
 *    trial and credited the method toward the quiz gate. One card now counts
 *    once per trial run.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');

for (const [file, modeVar] of [
  ['src/screens/study/FlashcardsScreen.tsx', 'flaggedMode'],
  ['src/screens/study/FillInBlankScreen.tsx', 'customMode'],
  ['src/screens/study/MatchingScreen.tsx', 'customMode'],
] as const) {
  test(`${file}: no time trial on My Custom List (no topic row to credit)`, () => {
    const src = read(file);
    const m = src.match(/<PaceTimerModal[\s\S]*?topicId=\{([^}]*)\}/);
    assert.ok(m, 'PaceTimerModal with a topicId prop');
    const expr = m[1].trim();
    assert.notEqual(expr, 'achievementId', 'the raw achievementId offers the trial on the custom list');
    assert.ok(expr.includes(modeVar) && expr.includes('undefined'), `topicId is withheld when ${modeVar}: got {${expr}}`);
  });
}

test('Flashcards: a card counts toward the time trial once per trial run', () => {
  const src = read('src/screens/study/FlashcardsScreen.tsx');
  const start = src.indexOf('const toggleKnown = useCallback(');
  assert.ok(start > 0);
  const body = src.slice(start, src.indexOf('}, [card, hidden', start));
  const reg = body.indexOf("registerTrialAnswer('flashcards'");
  assert.ok(reg > 0, 'toggleKnown registers trial answers');
  const guard = body.lastIndexOf('trialCountedRef.current.has(card.id)', reg);
  assert.ok(guard > 0, 'the trial answer is guarded by a per-trial set of counted cards');
  assert.ok(body.includes('trialCountedRef.current.add(card.id)'), 'the card is recorded as counted');
  // The set empties when a trial (re)starts: active with nothing counted yet.
  assert.match(
    src,
    /useEffect\(\(\) => \{\s*if \(trial\.active && trial\.correctCount === 0\) trialCountedRef\.current = new Set\(\);\s*\}, \[trial\.active, trial\.correctCount\]\);/,
  );
});
