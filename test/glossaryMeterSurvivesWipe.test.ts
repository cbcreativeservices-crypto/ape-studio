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

// guestEphemeral 2026-10-04: the `total` branch is now its own allowlist,
// GUEST_KEEP (owner ruling: a guest keeps ONLY the glossary and calculator
// meters, the device id, and the onboarding family). The meter must be ON it.
// The behavioural proof (keepsThroughWipe) is test/guestEphemeral_20261004.
const GUEST_KEEP_SRC = SRC.match(/const GUEST_KEEP[^=]*= new Set<string>\(\[([\s\S]*?)\]\)/);

test('⛔ the guest (`total`) allowlist names the glossary meter', () => {
  assert.ok(GUEST_KEEP_SRC, 'could not find GUEST_KEEP — this test needs updating to match the new shape');
  assert.ok(
    GUEST_KEEP_SRC[1].includes(`'${METER}'`),
    'Guest Mode passes { total: true }, so leaving the meter off GUEST_KEEP hands out unlimited free definitions.',
  );
  assert.match(SRC, /opts\?\.total === true \? GUEST_KEEP\.has\(k\) : KEEP\.has\(k\)/);
});

test('the final-exam queue is kept for its ACCOUNT, not wiped as guest data (owner ruling 2026-10-04)', () => {
  // Deliberately changed 2026-10-04: a guest can never create a queued exam
  // (start_final_exam refuses without an account row), so whatever is queued
  // belongs to an account — and the guest LAUNCH wipe runs for a member who
  // signed out and relaunched, which must not throw their offline exam away.
  assert.ok(GUEST_KEEP_SRC && GUEST_KEEP_SRC[1].includes("'ape:finalExamQueue'"));
});
