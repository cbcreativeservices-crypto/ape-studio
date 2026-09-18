/**
 * The Weekly-concept switch must never claim to be on with nothing behind it.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * Sending a weekly concept needs BOTH halves to be true, in two different
 * tables, written by two different calls:
 *
 *   notification_preferences.notify_weekly_concept = true   (keyed on app id)
 *   an ACTIVE notification_concept_subscriptions row         (keyed on auth id)
 *
 * Either write can fail alone. Only one of the two mismatches is harmful:
 *
 *   rows but no pref  →  nothing sends, switch reads OFF.  Consistent.
 *   PREF BUT NO ROWS  →  nothing sends, switch reads ON.   A lie.
 *
 * And that second state is permanent and silent. `get_due_concept_subscriptions`
 * reads only the subscriptions table, so a user with no rows never appears in
 * it — not once, not ever. Settings shows the switch on, nothing errors, and
 * no notification is ever delivered.
 *
 * It was reachable: the old `setWeeklyOn` wrote the pref FIRST and then threw
 * away `saveAllCategorySchedules`'s return value with a bare `await`, so a
 * failed row write was invisible and the pref stayed true. A live account was
 * found in exactly that state — pref true, zero rows — on 2026-09-18.
 *
 * The fix is an ORDERING plus two checks, and both are easy to undo by accident
 * while tidying, which is what this guards. Source-scanned rather than
 * behavioural because the bug is in the sequence of calls, not in their result.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SCREEN = readFileSync(
  new URL('../src/screens/settings/SettingsScreen.tsx', import.meta.url),
  'utf8',
);
const API = readFileSync(
  new URL('../src/features/notifications/weeklyConcept.ts', import.meta.url),
  'utf8',
);

/** The body of setWeeklyOn, from its declaration to its dependency array. */
function setWeeklyOnBody(): string {
  const start = SCREEN.indexOf('const setWeeklyOn = useCallback(');
  assert.ok(start >= 0, 'could not find setWeeklyOn');
  const end = SCREEN.indexOf('[prefs, catSched],', start);
  assert.ok(end > start, 'could not find the end of setWeeklyOn');
  return SCREEN.slice(start, end);
}

/** Just the `on === true` branch, which is where the harmful state was made. */
function onBranch(): string {
  const body = setWeeklyOnBody();
  const start = body.indexOf('if (on) {');
  assert.ok(start >= 0, 'could not find the on-branch');
  const end = body.indexOf('} else {', start);
  assert.ok(end > start, 'could not find the else-branch');
  return body.slice(start, end);
}

describe('switching Weekly concepts ON writes rows before the pref', () => {
  it('the source was actually parsed', () => {
    // Without this, a broken slice makes every assertion below pass vacuously.
    const branch = onBranch();
    assert.ok(branch.length > 200, `on-branch looks too short: ${branch.length} chars`);
    assert.ok(branch.includes('saveAllCategorySchedules'), 'sanity: the row write should be here');
    assert.ok(branch.includes('setWeeklyConceptPref'), 'sanity: the pref write should be here');
  });

  it('the ROWS are written before the PREF', () => {
    // The pref is the half the switch renders, so it must be the LAST thing to
    // become true. Flip this order back and a failed row write leaves the
    // switch on with nothing behind it.
    const branch = onBranch();
    const rows = branch.indexOf('saveAllCategorySchedules');
    const pref = branch.indexOf('setWeeklyConceptPref');
    assert.ok(
      rows < pref,
      'saveAllCategorySchedules must come BEFORE setWeeklyConceptPref — otherwise a failed ' +
        'row write leaves notify_weekly_concept true with zero subscription rows, which is ' +
        'silent and permanent',
    );
  });

  it('the row write is CHECKED, not fired and forgotten', () => {
    const branch = onBranch();
    assert.match(
      branch,
      /const\s+rowsOk\s*=\s*await\s+saveAllCategorySchedules/,
      'the result of saveAllCategorySchedules must be captured — a bare `await` discards the ' +
        'failure, which is the original bug',
    );
    assert.match(branch, /if\s*\(!rowsOk\)/, 'and it must actually be acted on');
  });

  it('the pref write is checked, and failing it puts the rows back', () => {
    const branch = onBranch();
    assert.match(branch, /const\s+prefOk\s*=\s*await\s+setWeeklyConceptPref\(true\)/, 'pref result captured');
    const afterPrefFail = branch.slice(branch.indexOf('if (!prefOk)'));
    assert.ok(
      afterPrefFail.includes('deactivateAllWeeklySubscriptions'),
      'if the pref write fails, the rows it was paired with must be deactivated — otherwise ' +
        'subscriptions sit armed behind a switch that reads off',
    );
  });
});

describe('switching Weekly concepts OFF tells the truth', () => {
  const body = setWeeklyOnBody();
  const off = body.slice(body.indexOf('} else {'));

  it('the PREF goes first — it alone stops every send', () => {
    const pref = off.indexOf('setWeeklyConceptPref(false)');
    const rows = off.indexOf('deactivateAllWeeklySubscriptions');
    assert.ok(pref >= 0 && rows > pref, 'pref off should precede deactivating the rows');
  });

  it('a failed pref write does NOT leave the switch reading off', () => {
    assert.match(
      off,
      /if\s*\(!prefOk\)[\s\S]{0,200}notify_weekly_concept:\s*true/,
      'if the server refused, the switch must go back to on rather than silently lying',
    );
  });
});

describe('deactivateAllWeeklySubscriptions reports whether it worked', () => {
  it('returns a boolean, not void', () => {
    // It used to return Promise<void>, which made the failure unobservable to
    // the only caller that matters.
    assert.match(
      API,
      /export async function deactivateAllWeeklySubscriptions\(\)\s*:\s*Promise<boolean>/,
      'a write whose failure cannot be observed is a write that fails silently',
    );
  });
});
