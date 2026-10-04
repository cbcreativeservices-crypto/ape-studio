/**
 * HUNT 13 — AREA 1, HOME + SHELL (2026-10-04, final overnight pass).
 *
 * 1. (K10) The Dashboard's one-time "Your Study Dashboard" intro was a
 *    self-contained <ScreenIntroOverlay>, a Modal the screen could not see.
 *    Everything else the Dashboard raises BY ITSELF checks that none of its
 *    own popups is open — but the intro was never one of them. On a
 *    learner's first Dashboard visit (a new account, a reinstall, a new
 *    phone) the intro is up, and:
 *      - STUDY NOW from Explore / Awards / Career Finder lands with `focusGs`
 *        on a members topic, and the study-access sheet opened ~0.45 s after
 *        the deck loaded — a second Modal beside the intro. iOS refuses a
 *        second presentation ("already presenting"): the sheet never showed,
 *        `upgradeOpen` stayed true, and every later LOCKED switch / MEMBERS
 *        TOPIC tap set it true again — a dead tap, the exact moment a free
 *        learner asks how to unlock;
 *      - a learner with synced progress (celebrations are device-local) got
 *        the in-screen celebration popup beside it;
 *      - the credential celebration push and the offline-replay notices
 *        ignored it too.
 *    The Dashboard now owns the intro (`useScreenIntro`), counts it as one of
 *    its popups (`popupOpenRef`), gates the celebration on it, and the
 *    STUDY NOW sheet waits for no popup at all (the inline 🔒 notice and the
 *    switches still answer with the sheet on a tap).
 *
 * 2. (K11) Sign Out (stranded-session banner) and the error face's Back to
 *    Login ran `signOutOrSay` unlatched. It first flushes the offline queues
 *    for up to 15 s with no feedback — offline is exactly when there is work
 *    to flush — so a second tap ran a second flush and, with work stranded,
 *    raised a second "Sign out anyway?" that surfaced over the login screen
 *    after the first was answered (or a second "Couldn't log out"). One
 *    sign-out at a time now (`useLatchedPress`).
 *
 * R2: every receipt FAILED against HEAD 642fb8a2 (file copied aside, the HEAD
 * file written back, this test run, the fix restored, cmp clean).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const DASH = 'src/screens/dashboard/DashboardScreen.tsx';

test('1a. Dashboard owns its intro: useScreenIntro, not a blind ScreenIntroOverlay', () => {
  const src = strip(read(DASH));
  assert.match(src, /const dashIntro = useScreenIntro\('dashboard'\);/);
  assert.doesNotMatch(src, /<ScreenIntroOverlay introKey="dashboard"/);
  assert.match(src, /\{dashIntro\.visible \? <IntroSheet introKey="dashboard" onDismiss=\{dashIntro\.dismiss\} \/> : null\}/);
  // The hook sits above the early returns (hook order).
  assert.ok(src.indexOf("useScreenIntro('dashboard')") < src.indexOf('if (loading && !data) {'));
});

test('1b. the intro counts as one of the screen\'s popups', () => {
  const src = strip(read(DASH));
  assert.match(
    src,
    /popupOpenRef\.current = termsOpen \|\| trophyOpen \|\| deckOpen \|\| upgradeOpen \|\| dashIntroUp;/,
  );
  assert.match(src, /const dashIntroUp = dashIntro\.visible && data != null;/);
});

test('1c. the in-screen celebration waits for the intro', () => {
  const src = strip(read(DASH));
  assert.match(
    src,
    /\{isFocused && !dashIntroUp && !termsOpen && !trophyOpen && !deckOpen && !upgradeOpen && !jogActive && pendingCelebration \?/,
  );
});

test('1d. STUDY NOW\'s study-access sheet never opens beside another popup', () => {
  const src = strip(read(DASH));
  const at = src.indexOf('afterPopupCloses(() => {');
  const body = src.slice(at, src.indexOf('});', at));
  assert.match(body, /if \(navigation\.isFocused\(\) && !popupOpenRef\.current\) setUpgradeOpen\(true\);/);
});

test('2. one sign-out at a time (stranded banner + error face)', () => {
  const src = strip(read(DASH));
  assert.match(src, /const signOutOnce = useLatchedPress\(\(\) => signOutOrSay\(resetToLogin\)\);/);
  // No unlatched call site is left.
  assert.equal(src.split('signOutOrSay(resetToLogin)').length - 1, 1);
  assert.ok(src.indexOf('const signOutOnce') < src.indexOf('if (loading && !data) {'));
  assert.ok((src.match(/signOutOnce\(\)/g) ?? []).length >= 2);
});
