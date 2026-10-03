/**
 * STUDY area, toddler hunt 6 (2026-10-03).
 *
 * Each test below FAILED against the file before its fix (R2: the fixed files
 * were copied aside, the HEAD ones written back, this file run, the fixes put
 * back and checked with cmp).
 *
 *   1. enrollment/EnrollmentScreen.tsx — the core-course Home reserve effect
 *      read `hasCredential` off `useBundles()`, which is [] until the stored
 *      credential list is READ and stays [] when that read FAILS. "Not read"
 *      was taken as "holds no credential": every core was pulled off Home, and
 *      removeHome also cleared a core chosen as the Home DEFAULT — for good,
 *      even after the list was read. The effect now waits for a real read
 *      (useBundlesHydrated, a new export of enrolledBundlesStore).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('enrolledBundlesStore exposes whether the stored list has been read', () => {
  const s = code('src/features/enrollment/enrolledBundlesStore.ts');
  assert.match(s, /export function useBundlesHydrated\(\): boolean \{\s*return store\.useHydrated\(\);\s*\}/);
});

test('EnrollmentScreen: the core Home reserve never runs on an unread credential list', () => {
  const s = code('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(s, /const bundlesRead = useBundlesHydrated\(\);/);
  const at = s.indexOf('const bundlesRead = useBundlesHydrated();');
  const effect = s.slice(at, s.indexOf('}, [bundlesRead, hasCredential, prog]);', at));
  assert.ok(effect.length > 0, 'reserve effect must depend on bundlesRead');
  // The guard comes BEFORE any ensureHome / removeHome.
  const guard = effect.indexOf('if (!bundlesRead) return;');
  assert.ok(guard > 0, 'reserve effect must bail while the bundles are unread');
  assert.ok(guard < effect.indexOf('removeHome(gs)'), 'guard must precede removeHome');
  assert.ok(guard < effect.indexOf('ensureHome(gs)'), 'guard must precede ensureHome');
});

/*
 *   2. Decorative loops on COVERED screens. courses/CourseSelectionScreen.tsx
 *      CardShimmer (a Skia sweep re-armed every SHIMMER_EVERY_MS) and
 *      enrollment/EnrollmentScreen.tsx LoadPill (an 11 s Animated.loop on
 *      every unloaded row) kept running while their screen was covered by a
 *      tab / pushed screen, or (LoadPill) on an off-page Awards pager page —
 *      the "stops off screen" rule LabScopeSweep (`sweepLive`) and the Explore
 *      hub already follow, missed here.
 */
test('Home shimmer stops while Home is not focused', () => {
  const s = code('src/screens/courses/CourseSelectionScreen.tsx');
  const body = s.slice(s.indexOf('function CardShimmer('), s.indexOf('const angle = useSharedValue(0);'));
  assert.ok(body.length > 0, 'CardShimmer missing');
  assert.match(body, /const focused = useIsFocused\(\);/);
  assert.match(body, /const off = reduceMotion \|\| suppressed \|\| !decorative \|\| !focused;/);
});

test('Enrollments LoadPill breathes only while the page is showing', () => {
  const s = code('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(s, /function LoadPill\(\{ on, small, dim, live = true \}/);
  assert.match(s, /const animate = !on && !suppressed && decorative && live;/);
  const pills = s.match(/<LoadPill [^>]*\/>/g) ?? [];
  assert.ok(pills.length >= 3, 'expected the three LoadPill sites');
  for (const p of pills) assert.match(p, /live=\{sweepLive\}/, `LoadPill without live: ${p}`);
});
