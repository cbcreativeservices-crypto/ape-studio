/**
 * The Dashboard's two study membership gates (owner 2026-09-13: "gate it").
 *
 * ⚠️ WHAT THIS SUITE REALLY GUARDS: that there are TWO gates, and that nobody
 * collapses them into one.
 *
 * `studyMethodLocked` reads the DISPLAYED topic, because the method blocks and
 * the quiz act on whatever the carousel is showing — gating on the committed
 * topic once opened DAW's flashcards from an Astronomical Acoustics card (user
 * bug 2026-08-13). The ★ Custom List panel is the mirror image: it RENDERS on
 * the committed topic, so reading the displayed one leaves its Study button
 * open whenever the carousel happens to be previewing a free topic. That is a
 * hole I wrote and caught before it shipped; the case below is here so it does
 * not come back.
 *
 * The Custom List was exempt from the gate until 2026-09-13. A free user can
 * star any glossary term and study it there, so the exemption was an unmetered
 * path to all 26,855 definitions — around the 14-a-week allowance and around
 * the server gateway built to meter it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { customListLocked, studyMethodLocked } from '../src/features/commercial/studyGate.ts';

/** FREE_ENROLL_GS — Pro Audio Safety and DAW Fundamentals. */
const FREE = [3060, 3970] as const;
const base = { resolved: true, entitlement: 'free', freeGs: FREE };

test('a non-member is locked out of a paid topic', () => {
  assert.equal(studyMethodLocked({ ...base, displayedGs: 3100 }), true);
});

test('the two free topics stay open', () => {
  assert.equal(studyMethodLocked({ ...base, displayedGs: 3060 }), false);
  assert.equal(studyMethodLocked({ ...base, displayedGs: 3970 }), false);
});

test('an academy member is never gated', () => {
  assert.equal(studyMethodLocked({ ...base, entitlement: 'academy', displayedGs: 3100 }), false);
  assert.equal(customListLocked({ resolved: true, entitlement: 'academy' }), false);
});

test('nobody is locked before the tier is known', () => {
  // The provider boots at 'anonymous'. Locking in that window showed a paying
  // member the upgrade sheet for the membership they already bought.
  assert.equal(studyMethodLocked({ ...base, resolved: false, entitlement: 'anonymous', displayedGs: 3100 }), false);
  assert.equal(customListLocked({ resolved: false, entitlement: 'anonymous' }), false);
});

test('a pseudo-topic has no gs, and that fails CLOSED', () => {
  assert.equal(studyMethodLocked({ ...base, displayedGs: null }), true);
  assert.equal(studyMethodLocked({ ...base, displayedGs: undefined }), true);
});

test('lapsed is not academy', () => {
  assert.equal(studyMethodLocked({ ...base, entitlement: 'lapsed', displayedGs: 3100 }), true);
  assert.equal(customListLocked({ resolved: true, entitlement: 'lapsed' }), true);
});

test('a guest is gated out of the Custom List', () => {
  // Including a guest holding the glossary's temporary device key — the whole
  // reason this gate exists.
  assert.equal(customListLocked({ resolved: true, entitlement: 'anonymous' }), true);
});

test('THE JOG RACE: the Custom List stays locked while the carousel previews a free topic', () => {
  // The Custom List panel renders on the COMMITTED topic; mid-jog the displayed
  // one can be gs3060. Reusing the method gate here would read false and open
  // custom-list study to a non-member.
  const midJog = { ...base, displayedGs: 3060 };
  assert.equal(studyMethodLocked(midJog), false, 'the method gate follows the carousel — by design');
  assert.equal(
    customListLocked({ resolved: true, entitlement: 'free' }),
    true,
    'the Custom List gate must NOT follow the carousel',
  );
});
