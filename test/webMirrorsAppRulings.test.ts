/**
 * GUARD — `web/` holds COPIES of app logic, and the copies drift.
 *
 * `web/` is a separate Next.js app with its own tsconfig and no path into
 * `src/`, so shared logic is re-implemented rather than imported. That is a
 * legitimate constraint, but it means an app-side ruling does not reach the
 * website, and nobody finds out: the website keeps working, it just answers
 * differently. The 2026-09-23 hunt found three such drifts at once, and one of
 * the files described itself as a "Mirror of EntitlementProvider" while
 * implementing the version from BEFORE the audit.
 *
 * These assertions are deliberately about the RULINGS, not about matching text.
 * Two rulings are pinned here because both are security-adjacent and both
 * silently take something away from a PAYING member:
 *
 *   1. Scan every academy row; never trust row [0]. There is no ORDER BY, and a
 *      member may hold an expired row and an active one.
 *   2. An UNREADABLE expires_at FAILS OPEN. `NaN > now` is FALSE, so the naive
 *      comparison reads an unparseable timestamp as already expired.
 *
 * And one presentation ruling, because it is the page an EMPLOYER opens:
 *
 *   3. A failed credentials read is not a member who holds none.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('the website honours the entitlement rulings', () => {
  const web = () => strip(read('web', 'lib', 'dashboard.ts'));

  test('it scans the academy rows instead of trusting row [0]', () => {
    const code = web();
    assert.ok(
      /rows\.some\(/.test(code),
      'web deriveTier no longer scans every academy row — an active member holding an expired row reads as "lapsed"',
    );
    assert.ok(
      !/\(data \?\? \[\]\)\[0\]/.test(code),
      'web deriveTier is back to trusting row [0]; the query has no ORDER BY, so the row is arbitrary',
    );
  });

  test('an unreadable expiry fails OPEN', () => {
    const code = web();
    assert.ok(
      /Number\.isFinite\(/.test(code),
      'web deriveTier no longer checks the expiry explicitly — `NaN > now` is FALSE, so an unparseable expires_at silently drops a paying member to "lapsed"',
    );
    assert.ok(
      !/new Date\((?:acad\.)?expires_at\)\.getTime\(\) >/.test(code),
      'web deriveTier is back to the naive comparison the owner ruled out on 2026-09-11',
    );
  });

  test('a failed entitlement read is not treated as "no entitlement"', () => {
    assert.match(
      web(),
      /if \(error\) throw error;/,
      'web deriveTier swallows its read error again — a blip silently shows a member the free tier',
    );
  });

  test('the app-side originals still hold the rulings this mirrors', () => {
    // If the app's version regressed, matching it would be the wrong target.
    const provider = strip(read('src', 'features', 'commercial', 'EntitlementProvider.tsx'));
    const expiry = strip(read('src', 'features', 'commercial', 'entitlementExpiry.ts'));
    assert.match(provider, /function academyTierFromRows/, 'the app lost academyTierFromRows');
    assert.match(expiry, /Number\.isFinite\(ms\)/, 'the app lost its explicit expiry parse');
    assert.match(expiry, /return verdict !== 'expired'/, 'the app no longer fails open on an unreadable expiry');
  });
});

describe('the website does not present a failed read as an empty record', () => {
  test('the public profile distinguishes "could not load" from "holds none"', () => {
    const lib = strip(read('web', 'lib', 'community.ts'));
    assert.ok(
      /c\.error/.test(lib),
      'web fetchCommunityProfile drops the credentials error again — a member is shown to an employer as holding NO credentials',
    );
    assert.match(lib, /credentialsUnavailable/, 'the three-state result is gone');
    const view = strip(read('web', 'components', 'CommunityProfileView.tsx'));
    assert.match(
      view,
      /credentialsUnavailable/,
      'the profile view no longer renders the "could not load" state, so the block silently disappears again',
    );
  });
});
