/**
 * Nothing inside the Awards pager may route to the Awards screen.
 *
 * ⛔ WHAT THIS PINS — two dead buttons, both of which looked correctly wired.
 *
 * AwardsScreen is a five-page horizontal pager, and Curriculum, Directory and
 * Enrollments are rendered INSIDE it. So a child calling
 *
 *     navigation.navigate('Awards', { category: … })
 *
 * is navigating to the route it is already on. React Navigation 7 reuses a
 * focused route with the same key and merely swaps its params — the component
 * never remounts. And AwardsScreen reads `route.params.category` exactly once,
 * into `useState`, with no effect watching it. So the swapped param was read
 * by nobody and the tap did nothing at all. No error, no log, no movement.
 *
 * It killed the glowing "FINAL EXAM · EARN CERTIFICATE AWARD" button on the
 * Enrollments page — dead for precisely the learner who had just finished a
 * certificate — and "GO TO MY ENROLLMENTS" in the credential popup. Both
 * survived review because the identical call DOES work from Home, where the
 * route is genuinely not focused yet.
 *
 * The fix is a callback (`onOpenCategory` → `goToPage`), and the reason it is
 * the right fix is that a callback cannot silently no-op the way a repeat
 * navigate() does. These tests pin the rule rather than the two instances,
 * because the next page added to the pager will be just as tempting.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * ⚠️ STRIP COMMENTS FIRST. The first draft of this guard failed on the very
 * fix it was written to protect: the comments explaining "never call
 * navigate('Awards')" contain the string `navigate('Awards')`, so the guard
 * flagged its own documentation. A source guard that cannot tell code from
 * prose reports the careful files and misses the careless ones.
 */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const read = (rel: string) =>
  stripComments(readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8'));

/** Every view rendered as a page of the Awards pager. */
const PAGER_CHILDREN = [
  'screens/curriculum/CurriculumScreen.tsx',
  'screens/enrollment/EnrollmentScreen.tsx',
];

test('AwardsScreen never navigates to itself', () => {
  const src = read('screens/awards/AwardsScreen.tsx');
  const hits = [...src.matchAll(/navigate\(\s*['"]Awards['"]/g)];
  assert.equal(
    hits.length,
    0,
    'AwardsScreen called navigate("Awards") — from inside the screen that IS Awards, ' +
      'that only swaps params and moves nothing. Use goToPage().',
  );
});

test('every pager child is given a way to move the pager without navigating', () => {
  for (const rel of PAGER_CHILDREN) {
    assert.match(
      read(rel),
      /onOpenCategory/,
      `${rel} is rendered inside the Awards pager but has no onOpenCategory callback, ` +
        'so its only way to change page is a navigate() that silently does nothing.',
    );
  }
});

test('a pager child that still calls navigate("Awards") must prefer the callback', () => {
  // The fallback is legitimate for a standalone mount, where the route really
  // is not focused. What is NOT legitimate is reaching for navigate() first.
  for (const rel of PAGER_CHILDREN) {
    const src = read(rel);
    for (const m of src.matchAll(/navigate\(\s*['"]Awards['"]/g)) {
      const before = src.slice(Math.max(0, m.index! - 400), m.index!);
      assert.match(
        before,
        /onOpenCategory/,
        `${rel} calls navigate("Awards") with no onOpenCategory check in front of it — ` +
          'inside the pager that call is a no-op.',
      );
    }
  }
});

test('AwardsScreen still exposes goToPage — the replacement must exist', () => {
  assert.match(
    read('screens/awards/AwardsScreen.tsx'),
    /const goToPage = useCallback\(/,
    'goToPage is what the children are handed; without it they have no lever at all',
  );
});
