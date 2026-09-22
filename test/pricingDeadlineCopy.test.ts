/**
 * The pricing deadline must not be able to go stale on its own.
 *
 * ⛔ WHAT THIS PINS. The paywall used to carry a hardcoded sentence —
 * "all prices are valid through the end of the year" — with no date behind it.
 * At midnight on 31 December it would have become false with nobody touching
 * the app, on the one screen a customer screenshots. It also said "Lock in",
 * which promises that today's price follows the subscriber: nothing implements
 * grandfathering, and neither store applies it automatically.
 *
 * Owner ruling 2026-09-22: "pricing changes Jan 1. However that needs to be
 * communicated is fine." So the date is a constant, every sentence is derived
 * from it, and the note hides itself once it has passed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COPY, CURRENT_PRICING_ENDS, CURRENT_PRICING_ENDS_LABEL, pricingDeadlineActive } from '../src/lib/copy.ts';

test('the note is shown before the deadline and withdrawn after it', () => {
  const before = new Date(CURRENT_PRICING_ENDS.getTime() - 1000);
  const after = new Date(CURRENT_PRICING_ENDS.getTime() + 1000);
  assert.equal(pricingDeadlineActive(before), true, 'still true a second before');
  assert.equal(pricingDeadlineActive(after), false, 'must stop claiming it a second after');
});

test('every deadline sentence is derived from the one constant', () => {
  for (const [name, text] of Object.entries({
    pricingNote: COPY.pricingNote,
    introDeadline: COPY.introDeadline,
    lifetimeOffer: COPY.lifetimeOffer,
  })) {
    assert.ok(
      text.includes(CURRENT_PRICING_ENDS_LABEL),
      `${name} must build its date from CURRENT_PRICING_ENDS_LABEL, not restate it`,
    );
  }
});

test('the label and the date agree — they are read side by side', () => {
  // A mismatch here would put one date in the prose and another in the logic.
  const y = CURRENT_PRICING_ENDS.getFullYear();
  assert.ok(CURRENT_PRICING_ENDS_LABEL.includes(String(y)), `label says ${CURRENT_PRICING_ENDS_LABEL}, date is ${y}`);
});

test('the three retired claims do not come back', () => {
  const src = readFileSync(new URL('../src/lib/copy.ts', import.meta.url), 'utf8');
  // Only the explanatory comment may mention them; the STRINGS must not.
  const strings = Object.values(COPY).filter((v) => typeof v === 'string') as string[];
  for (const s of strings) {
    assert.doesNotMatch(s, /early beta/i, 'never tell a paying customer the product is a beta');
    assert.doesNotMatch(s, /lock in/i, 'that promises grandfathering, which nothing implements');
    assert.doesNotMatch(s, /through the end of the year/i, 'undated prose goes false on its own');
  }
  assert.ok(src.includes('CURRENT_PRICING_ENDS'), 'the constant must remain the single source');
});

test('the paywall gates the note on the deadline, not on prose', () => {
  const src = readFileSync(new URL('../src/screens/commercial/PaywallScreen.tsx', import.meta.url), 'utf8');
  assert.match(src, /pricingDeadlineActive\(\)/, 'the note must withdraw itself once the date passes');
});
