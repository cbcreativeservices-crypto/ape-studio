/**
 * Night bug pass 1 of 3 (2026-10-01) — Home / Awards / Explore / Enrollments.
 * Source-reading regressions (RN screens do not load under node:test).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(p, 'utf8');

test('Enrollments: a core is force-loaded / Home-reserved only on a KNOWN %, never on an unloaded progress map', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(
    s,
    /COREQ_TOPIC_GS\.filter\(\s*\(gs\) => enrolledGs\.has\(gs\) && prog\.has\(gs\) && \(prog\.get\(gs\)\?\.pct \?\? 0\) < 100 && !activeGs\.has\(gs\)/,
    'force-activate must skip a core whose progress has not loaded',
  );
  assert.match(s, /if \(hasCredential && !prog\.has\(gs\)\) continue;/, 'Home reserve must skip an unknown %');
});

test('Home Setup drag measures finger travel from the touch start, not a re-created gestureState', () => {
  const s = src('src/screens/enrollment/HomeSetupSheet.tsx');
  const body = s.slice(s.indexOf('const rowPan ='), s.indexOf('const rowTouch ='));
  assert.ok(body.length > 0, 'rowPan missing');
  assert.match(body, /const dy = e\.nativeEvent\.pageY - touchStart\.current\.y;/);
  assert.doesNotMatch(body, /\(g\.dy|setValue\(g\.dy/,'g.dy resets on every re-render (new PanResponder per render)');
});

test('Explore hub motion stops when its page is not showing or the screen is covered', () => {
  const stats = src('src/screens/curriculum/InsideStats.tsx');
  assert.match(stats, /if \(!anim \|\| !live\) return;/, 'crackle interval must not run while not live');
  assert.match(stats, /if \(!live\) return;/, 'gold breathe must not run while not live');
  const cur = src('src/screens/curriculum/CurriculumScreen.tsx');
  assert.match(cur, /live=\{onScreen && isFocused\}/);
  const awards = src('src/screens/awards/AwardsScreen.tsx');
  assert.match(awards, /onScreen=\{currentKey === 'curriculum'\}/);
  assert.match(awards, /extraData=\{currentKey\}/, 'pager cells must re-render when the page changes');
});

test('Certificate download ignores a second tap while the first export runs', () => {
  const s = src('src/screens/awards/AwardProgressScreen.tsx');
  const body = s.slice(s.indexOf('const onExportCertificate'), s.indexOf('// Reload on focus'));
  assert.match(body, /if \(exportingRef\.current\) return;\s*exportingRef\.current = true;/);
  assert.match(body, /exportingRef\.current = false;/);
});
