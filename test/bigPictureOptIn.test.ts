/**
 * GUARD — whole-academy progress totals stay OPT-IN.
 *
 * Owner 2026-09-22: "do not show progress across all certs, all programs, or
 * the entire curriculum, unless the user chooses to show them (they are
 * intimidating and discouraging since they fill so slowly)."
 *
 * A learner four topics in does not benefit from a bar reading 2% of 166, or a
 * list of 124 certificates each saying "0 of 3 complete". The denominator is
 * the whole academy, so the number barely moves however much work goes in.
 * Their OWN enrolled certificates and programs are never gated by this — only
 * the totals measured against everything.
 *
 * Three things have to hold together, and each has failed independently:
 *  1. The default is OFF. A default of ON restores the discouragement exactly.
 *  2. The readout is actually gated on the preference, not merely collapsed.
 *  3. The preference SURVIVES. It is an `ape:*` key, and clearLocalAccountData
 *     sweeps every `ape:*` key except a KEEP allowlist — so without an explicit
 *     entry it silently reset to OFF on boots where the anonymous session
 *     churns the identity marker. Verified in the browser: the toggle was set,
 *     the page reloaded, and the key was gone.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const PREF_KEY = 'ape:profile:showBigPicture';

describe('whole-academy totals are opt-in', () => {
  test('the stored preference defaults to OFF', () => {
    const pref = stripComments(read('src', 'features', 'profile', 'bigPicturePref.ts'));
    // Only the exact string '1' counts as on, so a missing or garbled value
    // reads as off rather than as "show them".
    assert.match(pref, /===\s*'1'/, 'loadShowBigPicture no longer treats only \'1\' as on');
    assert.match(pref, /catch\s*{\s*return false;?\s*}/s, 'a failed read must fall back to OFF, never to showing the totals');
  });

  test('the preference survives the account-data wipe', () => {
    const clear = read('src', 'features', 'account', 'clearLocalAccountData.ts');
    assert.ok(
      clear.includes(`'${PREF_KEY}'`),
      `${PREF_KEY} is not on clearLocalAccountData's KEEP list, so the generic ape:* sweep silently resets the learner's choice to OFF`,
    );
  });

  test('the screen gates the readout on the preference', () => {
    const screen = stripComments(read('src', 'screens', 'profile', 'ProfileScreen.tsx'));
    assert.match(screen, /\{showBigPicture \? \(/, 'the whole-curriculum readout is no longer gated on showBigPicture');
    // Catalogue rows must be able to state size instead of shortfall.
    assert.match(screen, /showProgress=\{showBigPicture\}/, 'catalogue rows no longer follow the preference');
    assert.match(screen, /showProgress\?: boolean/, 'CatalogRow lost its showProgress prop');
  });

  test('the section header does not lead with the academy-wide percentage', () => {
    const screen = stripComments(read('src', 'screens', 'profile', 'ProfileScreen.tsx'));
    // The collapsed header read "2% · 3 goals" before anything was opened.
    assert.ok(
      !/summary=\{`\$\{profile\?\.overallPct \?\? 0\}%/.test(screen),
      'MY PROGRESS again leads its collapsed summary with the whole-academy percentage',
    );
  });

  test("a learner's own certificates and programs are NOT gated", () => {
    const screen = stripComments(read('src', 'screens', 'profile', 'ProfileScreen.tsx'));
    // The enrolled rows use bundleDone and must not pass showProgress={showBigPicture}.
    const enrolled = screen.slice(screen.indexOf('MY CERTIFICATES'), screen.indexOf('EVERYTHING THE ACADEMY OFFERS'));
    assert.ok(enrolled.includes('bundleDone(b.topics)'), 'enrolled rows no longer show their own progress');
    assert.ok(
      !enrolled.includes('showProgress={showBigPicture}'),
      "the learner's own goals must always show progress — they are the motivating ones",
    );
  });
});
