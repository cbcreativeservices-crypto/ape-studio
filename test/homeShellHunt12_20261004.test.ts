/**
 * HUNT 12 — AREA 1, HOME + SHELL (2026-10-04).
 *
 * 1. (K2) The Dashboard built its deck from `useEnrollment()`, which is the
 *    EMPTY placeholder while the stored list is read and after that read
 *    FAILED. On a failed read the empty-list fallback painted the two free
 *    topics as the learner's whole deck (every enrolled topic gone, no word
 *    why) and cached it. load() now refuses an unreadable list (asks the
 *    store to read again, throws `enrollment_unreadable` — a silent refresh
 *    keeps the deck on screen, a cold one says so with Retry), and the reload
 *    effect re-runs when the read state changes, so a recovered read lands.
 *
 * 2. (K2) The ★ Custom List card read `useTermList('starred')`, the same
 *    placeholder: a list whose read FAILED showed "0 TERMS · MY CUSTOM LIST"
 *    with its STUDY switch disabled. It now asks `readTermList` (which
 *    rejects on a failed read) and says "TERMS COULD NOT BE READ", leaving
 *    STUDY live (Flashcards says "could not load" with its own Retry).
 *
 * 3. (K11) Two DIFFERENT lit study switches mashed together each ran
 *    `navigate` (the stack ignores only a repeat of the focused route), so two
 *    study screens stacked, the covered one still accruing its session. One
 *    study open per 600 ms now (Start Here's claimOpen window); the quiz
 *    switch's briefing dialog takes the same claim, so it cannot pop over a
 *    study screen a sibling switch just opened.
 *
 * R2: every receipt FAILED against HEAD c0debb14 (file copied aside, the HEAD
 * file written back, this test run, the fix restored, cmp clean).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const DASH = 'src/screens/dashboard/DashboardScreen.tsx';

test('1. Dashboard: an unreadable enrollment list is not "nothing enrolled"', () => {
  const src = strip(read(DASH));
  assert.match(src, /const enrollRead = useEnrollmentReadState\(\);/);
  const load = src.slice(src.indexOf('const load = useCallback(async () => {'), src.indexOf('useFocusEffect(', src.indexOf('const load = useCallback(async () => {')));
  // Refused BEFORE the empty-list fallback to the free topics can run.
  const guard = load.search(/if \(enrollReadRef\.current === 'unreadable'\) \{\s*getEnrollment\(\);[^}]*throw new Error\('enrollment_unreadable'\);/);
  const fallback = load.indexOf('[...FREE_ENROLL_GS]');
  assert.ok(guard > 0, 'load() refuses an unreadable list and asks the store to read again');
  assert.ok(fallback > guard, 'the guard runs before the free-topic fallback');
  // Honest cold-screen words, not "check your connection".
  assert.match(load, /e\?\.message === 'enrollment_unreadable'\s*\?\s*'Your enrolled topics could not be read from this device just now/);
  // A recovered (or empty) read reloads the deck even when the key is unchanged.
  assert.match(src, /void load\(\);\s*\}, \[enrolledKey, enrollRead\]\);/);
});

test('2. Dashboard: an unreadable ★ Custom List is not "0 TERMS"', () => {
  const src = strip(read(DASH));
  assert.match(src, /readTermList\('starred'\)\.then\(\s*\(\) => \{\s*if \(alive\) setStarredUnreadable\(false\);\s*\},\s*\(\) => \{\s*if \(alive\) setStarredUnreadable\(true\);/);
  assert.match(src, /\}, \[customOnDashboard, starred\]\);/, 're-asked when the live list changes');
  assert.match(src, /const starredCount = starredUnreadable\s*\?\s*'TERMS COULD NOT BE READ'/);
  // No count printed straight from the placeholder set any more.
  assert.doesNotMatch(src, /`\$\{starred\.size\} TERM\$\{starred\.size === 1 \? '' : 'S'\} · MY CUSTOM LIST`/);
  assert.match(src, /\$\{starredCount\} · MY CUSTOM LIST/);
  assert.match(src, /disabled=\{!starredUnreadable && starred\.size === 0\}/, 'STUDY stays live on an unreadable list');
});

test('3. Dashboard: one study screen per tap across different switches', () => {
  const src = strip(read(DASH));
  assert.match(src, /const lastStudyOpenAt = useRef\(0\);/);
  assert.match(src, /if \(now - lastStudyOpenAt\.current < 600\) return false;/);
  // The claim is a hook, so it must sit above the early returns.
  assert.ok(src.indexOf('const claimStudyOpen = useCallback(') < src.indexOf('if (loading && !data) {'));
  assert.match(src, /if \(routeName && claimStudyOpen\(\)\) \{\s*navigation\.navigate\(routeName, \{ achievementId: dispTopic\.id/);
  assert.match(src, /if \(!claimStudyOpen\(\)\) return;\s*confirmDialog\(\s*'BEFORE YOU BEGIN'/);
});
