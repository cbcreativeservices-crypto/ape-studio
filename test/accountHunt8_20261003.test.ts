/**
 * ACCOUNT + COMMERCE — hunt 8 (2026-10-03).
 *
 * 1. WeeklyConceptScreen seeded its card from the route params ONCE, at mount.
 *    A second weekly-concept push tapped while a card is open navigates to the
 *    SAME screen with new params (`navigate('WeeklyConcept', payload,
 *    { pop: true })` in App.tsx), and the screen kept showing the FIRST
 *    concept. Worse, a payload with a body arriving while the first one's
 *    fetch was still out left the spinner up for good: the cancelled fetch
 *    never cleared `loading`, and the early return never touched it.
 *
 * 2. ProfileScreen reloads the ID card and the credentials on every focus with
 *    no ticket. A read that stalled offline could answer AFTER a later visit's
 *    read had shown the card: its 'unavailable' blanked the ID card and raised
 *    "check your connection" over a good answer (and a late credentials
 *    failure did the same to loaded certificates).
 *
 * Source-reading (React Native screens). R2: every test fails on the HEAD files.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

/** The text between `start` and the first `end` after it. */
function between(src: string, start: string, end: string): string {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `missing: ${start}`);
  const j = src.indexOf(end, i + start.length);
  assert.ok(j > i, `missing end after: ${start}`);
  return src.slice(i, j);
}

test('weekly concept: the card follows the route params, and the early return clears the spinner', () => {
  const src = read('src/screens/notifications/WeeklyConceptScreen.tsx');
  const effect = between(src, 'const initial = fromRoute(route.params);', '}, [route.params, reloadKey]);');
  const early = effect.indexOf('if (hasBody(initial) || !route.params.concept_id)');
  assert.ok(early > 0, 'the early-return guard is still there');
  // The new params' card is applied BEFORE anything can return early.
  const seeded = effect.indexOf('setCard(initial)');
  assert.ok(seeded >= 0 && seeded < early, 'setCard(initial) runs before the early return');
  const errCleared = effect.indexOf('setLoadError(false)');
  assert.ok(errCleared >= 0 && errCleared < early, 'a stale error is cleared before the early return');
  // The early return path itself puts the spinner down.
  const earlyBlock = effect.slice(early, effect.indexOf('let cancelled', early));
  assert.match(earlyBlock, /setLoading\(false\)/, 'a payload with a body never leaves a spinner up');
});

test('profile: only the newest ID-card and credentials reads may land', () => {
  const src = read('src/screens/profile/ProfileScreen.tsx');
  const load = between(src, 'const loadProfile = useCallback(() => {', '}, []);');
  assert.match(load, /const ticket = \+\+profileTicket\.current/);
  // Every outcome is gated: the answer, and the rejection.
  const thenAt = load.indexOf('.then((res) => {');
  assert.ok(thenAt > 0);
  assert.match(load.slice(thenAt, thenAt + 80), /if \(!current\(\)\) return;/, 'a superseded answer lands nowhere');
  assert.match(load, /\.catch\(\(\) => \{\s*if \(current\(\)\) setProfileError\(true\);/);

  const creds = between(src, 'fetchMyCredentials().then(', ');\n    }, [loadProfile, resolved]),');
  assert.match(src, /const creds = \+\+credsTicket\.current;\s*fetchMyCredentials\(\)/);
  assert.match(creds, /if \(creds !== credsTicket\.current\) return;\s*setCredentials\(rows\)/);
  assert.match(creds, /if \(creds === credsTicket\.current\) setCredsFailed\(true\)/);
});
