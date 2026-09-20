/**
 * The free-glossary meter must survive EVERY wipe, including the `total` one.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * `ape:glossaryUsageLocal` is the only device-side limit on free access to
 * 26,855 definitions. It was added to the KEEP set on 2026-09-17 to close this
 * exact exploit, with a comment describing the repro: hit the lock, tap
 * "Exit to menu", tap any sign-in button, tap GUEST MODE, and get fourteen
 * fresh lookups, forever.
 *
 * It did not close it. The `total` branch of the sweep explicitly exempted the
 * key it had just been added to protect, and Guest Mode entry is the ONLY
 * caller that passes `total: true` — so the documented repro stayed open
 * verbatim for three days. A comment claiming a hole is closed is worth
 * nothing; this asserts it.
 *
 * Source-text, like accountWipeRegistry.test.ts and for the same reason: the
 * module pulls in AsyncStorage and a dozen RN stores, and a crude check that
 * runs beats a precise one that cannot.
 *
 * ⚠️ The SERVER half is a separate, open problem and is NOT asserted here.
 * `glossary_consume()` is keyed on `auth.uid()`, and Guest Mode signs out
 * first, so a new anonymous session is a new uid with a fresh row. Closing
 * that needs the guest device-key to be reused rather than re-minted, which is
 * the owner's call.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const SRC = readFileSync('src/features/account/clearLocalAccountData.ts', 'utf8');
const METER = 'ape:glossaryUsageLocal';

test('the meter is in the KEEP set', () => {
  assert.ok(SRC.includes(`'${METER}'`), 'the glossary meter key is no longer named in this file at all');
});

test('⛔ the `total` exemption does NOT name the glossary meter', () => {
  // Find the filter predicate that decides what gets removed.
  const m = SRC.match(/!\(KEEP\.has\(k\) && !\(opts\?\.total === true && [^)]*\)\)/);
  assert.ok(m, 'could not find the total-wipe exemption — this test needs updating to match the new shape');
  assert.ok(
    !m[0].includes('glossaryUsageLocal'),
    `Guest Mode passes { total: true }, so naming the meter here hands out unlimited free definitions.\nFound: ${m[0]}`,
  );
});

test('the exemption still covers the final-exam queue, which SHOULD be wiped for a guest', () => {
  const m = SRC.match(/!\(KEEP\.has\(k\) && !\(opts\?\.total === true && [^)]*\)\)/);
  assert.ok(m && m[0].includes('finalExamQueue'), 'a guest cannot sit a graded exam; its queue must still be wiped');
});
