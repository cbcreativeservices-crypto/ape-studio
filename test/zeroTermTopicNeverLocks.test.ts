/**
 * GUARD — a topic with no terms must not lock its whole study chain.
 *
 * Every item-based method divides by the term count and `studyDisplayPct`
 * returns 0 when that count is 0. So a topic whose terms were never mapped sits
 * at 0% on flashcards forever → homework never powers → scenarios never power →
 * the quiz never unlocks → every credential requiring that topic becomes
 * permanently unreachable, while the award checklist still promises a goal that
 * cannot be reached. Nothing anywhere explains why.
 *
 * It cannot happen on today's data (queried 2026-09-23: 0 of 166 live topics
 * have zero terms; the smallest has 69), so this guards a content-ordering
 * mistake rather than a live fault.
 *
 * ⛔ THE SAFETY OF THE WHOLE THING IS "CONFIRMED-EMPTY ONLY". Marking a topic
 * exempt on an ERROR would hand out its completion on a transient failure — and
 * the cold-start 42501 auth denial is common on exactly the first open of a
 * topic. Only a RESOLVED fetch that returned zero items may mark one.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('a confirmed-empty topic does not lock the chain', () => {
  test('the live gate formula exempts item-based methods', () => {
    // topicPct.ts is the LIVE formula — dashboard/gates.ts is dead code that
    // nothing imports, and a fix has already gone into the wrong one once.
    const code = strip(read('src', 'features', 'dashboard', 'topicPct.ts'));
    assert.match(code, /isTermsExempt/, 'the terms exemption is gone from the live gate formula');
    assert.match(
      code,
      /key !== 'scenarios' && isTermsExempt\(topicId\)/,
      'the exemption no longer covers the item-based methods, so a zero-term topic locks again',
    );
    // Scenarios keeps its OWN exemption; the two are not interchangeable.
    assert.match(code, /isScenariosExempt/, 'the scenarios exemption was lost');
  });

  test('ONLY a resolved fetch of zero items marks a topic', () => {
    const code = strip(read('src', 'screens', 'study', 'FlashcardsScreen.tsx'));
    assert.match(code, /markTermsExempt\(achievementId\)/, 'nothing records a confirmed-empty topic');
    assert.match(
      code,
      /if \(!flaggedMode && fetched\.length === 0\)/,
      'the mark is no longer conditioned on a RESOLVED fetch returning zero items',
    );
    // The mark must sit in the success path, never in the catch.
    const markAt = code.indexOf('markTermsExempt(achievementId)');
    const catchAt = code.indexOf('[flashcards] topic load failed');
    assert.ok(markAt > 0 && catchAt > 0, 'the flashcards load changed shape — re-verify this guard');
    assert.ok(
      markAt < catchAt,
      'markTermsExempt moved into (or past) the failure path — an error would grant the topic',
    );
  });

  test('the store refuses to be a general-purpose setter', () => {
    const store = strip(read('src', 'features', 'study', 'termsExempt.ts'));
    // Hydrate-before-write, or a deep link overwrites every prior exemption.
    assert.match(store, /await hydrate\(\);/, 'markTermsExempt no longer hydrates before writing');
    assert.match(store, /export function isTermsExempt/, 'the reader is gone');
    assert.match(store, /export function resetLocal/, 'the account-switch reset is gone');
    // There must be no "unmark"/clear-one API: the only way out is a wipe.
    assert.ok(
      !/export .*unmarkTermsExempt|export .*clearTermsExempt/.test(store),
      'an unmark API appeared — exemptions are derived state, not user-editable',
    );
  });

  test('the exemption is cleared when the account changes', () => {
    const wipe = strip(read('src', 'features', 'account', 'clearLocalAccountData.ts'));
    assert.match(wipe, /resetTermsExempt/, 'the terms exemption survives an account switch');
  });
});
