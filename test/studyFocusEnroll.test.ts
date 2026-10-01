/**
 * GUARD — STUDY NOW lands on the credential's topic even when that topic is
 * not in the enrollment list at all, and a non-member is told why they cannot
 * study it.
 *
 * STUDENT REPORT (owner, 2026-09-30): Home → "Sound for Film & Games" EXPLORE →
 * "Post-Production Audio" (program) → STUDY NOW → the Dashboard showed Pro
 * Audio Safety. focusGs = 3000 (Sound & Wave Fundamentals) was right; the
 * credential's BUNDLE still said ENROLLED but gs3000 had left the enrollment
 * list (Clear enrollment list kept bundles until bug pass 3, 2026-09-30; a
 * topic can also be removed on its own). The 09-27 fix only switched on an
 * INACTIVE topic, so the armed focus waited forever on topic 0.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { studyFocusAction } from '../src/features/enrollment/enrollmentPlan.ts';

describe('studyFocusAction — what a STUDY NOW request does to the list', () => {
  it('enrols a topic the list does not hold (the Post-Production report)', () => {
    const afterClear = [
      { gs: 3060, active: true },
      { gs: 3970, active: true },
    ];
    assert.equal(studyFocusAction(afterClear, 3000), 'enroll');
  });
  it('switches on an enrolled-but-inactive topic (the 09-27 report)', () => {
    assert.equal(studyFocusAction([{ gs: 3000, active: false }], 3000), 'activate');
  });
  it('leaves an active topic alone', () => {
    assert.equal(studyFocusAction([{ gs: 3000, active: true }], 3000), 'none');
  });
});

const root = process.cwd();
const store = readFileSync(join(root, 'src', 'features', 'enrollment', 'enrollmentStore.ts'), 'utf8');
const dash = readFileSync(join(root, 'src', 'screens', 'dashboard', 'DashboardScreen.tsx'), 'utf8');

describe('ensureStudyTopic', () => {
  it('waits for the stored list before adding (never persists over an un-hydrated list)', () => {
    const body = store.slice(store.indexOf('export async function ensureStudyTopic'));
    assert.ok(body.length > 0, 'ensureStudyTopic missing');
    const hydrateAt = body.indexOf('await hydrate();');
    const addAt = body.indexOf('addTopics([gs])');
    assert.ok(hydrateAt > 0 && addAt > hydrateAt, 'hydrate must come before addTopics');
    assert.match(body, /else if \(action === 'activate'\) setActiveMany\(\[gs\], true\);/);
  });
});

describe('Dashboard — a non-member landing on a members topic gets the centred study-access popup', () => {
  const landing = dash.slice(dash.indexOf('if (i >= 0) {'), dash.indexOf("if (typeof focusGs === 'number') void ensureStudyTopic"));
  it('gates on the real study lock (tier known, free topics exempt, members never)', () => {
    assert.match(landing, /studyMethodLocked\(\{ resolved: tierKnown, entitlement, displayedGs: topics\[i\]\.global_sequence, freeGs: FREE_ENROLL_GS \}\)/);
  });
  it('waits for the Explore / credential popup to finish closing, and respects Low-Light', () => {
    assert.match(landing, /afterPopupCloses\(\(\) => \{\s*if \(navigation\.isFocused\(\)\) setUpgradeOpen\(true\);\s*\}\)/);
    assert.match(landing, /!areOverlaysSuppressed\(\)/);
  });
  it('only for a numeric focus (a real topic request), after the param is cleared', () => {
    assert.ok(landing.indexOf('navigation.setParams({ focusGs: undefined') < landing.indexOf('afterPopupCloses'));
    assert.match(landing, /typeof focusGs === 'number' &&/);
  });
});
