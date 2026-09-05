import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dayKey,
  EMPTY_REVIEW_STATE,
  evaluateReviewEligibility,
  recordHighValueEvent,
  recordRequested,
  recordSession,
  REVIEW_RULES,
  type ReviewState,
} from '../src/features/review/reviewEligibility.ts';

const DAY = 86400000;
const NOW = Date.UTC(2026, 8, 5, 12, 0, 0);

/** A state that satisfies every counter, so each test can break exactly one. */
function readyState(over: Partial<ReviewState> = {}): ReviewState {
  return {
    sessions: REVIEW_RULES.minSessions,
    activeDays: ['2026-09-01', '2026-09-02'],
    highValueEvents: REVIEW_RULES.minHighValueEvents,
    installedAtMs: NOW - (REVIEW_RULES.minDaysSinceInstall + 1) * DAY,
    lastRequestedMs: null,
    requestedVersions: [],
    ...over,
  };
}
const ask = (over: Partial<Parameters<typeof evaluateReviewEligibility>[0]> = {}) =>
  evaluateReviewEligibility({
    state: readyState(),
    version: '1.0.0',
    nowMs: NOW,
    event: 'lab_completed',
    ...over,
  });

test('a fully qualified user asked after a real success is eligible', () => {
  assert.deepEqual(ask(), { eligible: true, reason: 'eligible' });
});

test('a request NEVER fires without a qualifying success event', () => {
  assert.equal(ask({ event: undefined }).reason, 'no_success_event');
  // Not on a passive milestone, and not on a commercial one.
  assert.equal(ask({ event: 'app_opened' as never }).reason, 'no_success_event');
  assert.equal(ask({ event: 'subscription_started' as never }).reason, 'no_success_event');
});

test('every forbidden context vetoes the request, however good the counters', () => {
  for (const b of [
    'onboarding',
    'first_launch',
    'measuring',
    'after_purchase',
    'after_error',
    'after_permission_denied',
  ] as const) {
    assert.deepEqual(ask({ blockers: [b] }), { eligible: false, reason: 'blocked_context' }, b);
  }
});

test('each threshold blocks on its own', () => {
  assert.equal(ask({ state: readyState({ sessions: REVIEW_RULES.minSessions - 1 }) }).reason, 'too_few_sessions');
  assert.equal(ask({ state: readyState({ activeDays: ['2026-09-01'] }) }).reason, 'too_few_active_days');
  assert.equal(
    ask({ state: readyState({ highValueEvents: REVIEW_RULES.minHighValueEvents - 1 }) }).reason,
    'too_few_events',
  );
});

test('a brand-new install is never asked, even after a success', () => {
  assert.equal(ask({ state: readyState({ installedAtMs: NOW }) }).reason, 'too_soon_after_install');
  assert.equal(ask({ state: readyState({ installedAtMs: null }) }).reason, 'too_soon_after_install');
  assert.equal(
    ask({ state: readyState({ installedAtMs: NOW - (REVIEW_RULES.minDaysSinceInstall - 1) * DAY }) }).reason,
    'too_soon_after_install',
  );
});

test('cooldown holds for the full window and releases after it', () => {
  const justInside = readyState({ lastRequestedMs: NOW - (REVIEW_RULES.cooldownDays - 1) * DAY });
  assert.equal(ask({ state: justInside }).reason, 'in_cooldown');
  const justOutside = readyState({ lastRequestedMs: NOW - (REVIEW_RULES.cooldownDays + 1) * DAY });
  assert.equal(ask({ state: justOutside, version: '1.1.0' }).eligible, true);
});

test('at most one request per app version', () => {
  const asked = readyState({ requestedVersions: ['1.0.0'] });
  assert.equal(ask({ state: asked }).reason, 'already_asked_this_version');
  assert.equal(ask({ state: asked, version: '1.1.0' }).eligible, true);
});

test('recordSession counts sessions, dedupes the day, and stamps install once', () => {
  const d1 = new Date(2026, 8, 1, 9);
  let s = recordSession(EMPTY_REVIEW_STATE, d1);
  assert.equal(s.sessions, 1);
  assert.deepEqual(s.activeDays, [dayKey(d1)]);
  const installed = s.installedAtMs;
  // Same day again: session counts, active day does not.
  s = recordSession(s, new Date(2026, 8, 1, 18));
  assert.equal(s.sessions, 2);
  assert.equal(s.activeDays.length, 1);
  // New day.
  s = recordSession(s, new Date(2026, 8, 2, 9));
  assert.equal(s.activeDays.length, 2);
  assert.equal(s.installedAtMs, installed, 'install stamp never moves');
});

test('recordRequested stores that we asked, and nothing about the answer', () => {
  const s = recordRequested(readyState(), '1.0.0', NOW);
  assert.equal(s.lastRequestedMs, NOW);
  assert.deepEqual(s.requestedVersions, ['1.0.0']);
  // The shape must not carry a rating/answer field in any form.
  for (const k of Object.keys(s)) {
    assert.ok(!/rating|stars|score|liked|answer/i.test(k), `state must not record the user's answer: ${k}`);
  }
  // Asking twice in the same version does not duplicate.
  assert.deepEqual(recordRequested(s, '1.0.0', NOW + 1000).requestedVersions, ['1.0.0']);
});

test('recordHighValueEvent increments without touching anything else', () => {
  const before = readyState();
  const after = recordHighValueEvent(before);
  assert.equal(after.highValueEvents, before.highValueEvents + 1);
  assert.equal(after.sessions, before.sessions);
  assert.equal(after.lastRequestedMs, before.lastRequestedMs);
});

test('the realistic path: install, use, succeed, ask once, then stay quiet', () => {
  let s = EMPTY_REVIEW_STATE;
  s = recordSession(s, new Date(NOW - 8 * DAY));
  s = recordSession(s, new Date(NOW - 4 * DAY));
  s = recordSession(s, new Date(NOW - 1 * DAY));
  s = recordHighValueEvent(recordHighValueEvent(s));
  const first = evaluateReviewEligibility({ state: s, version: '1.0.0', nowMs: NOW, event: 'certificate_earned' });
  assert.equal(first.eligible, true);
  s = recordRequested(s, '1.0.0', NOW);
  // Immediately after, and a month later, we stay quiet.
  assert.equal(
    evaluateReviewEligibility({ state: s, version: '1.0.0', nowMs: NOW + 1000, event: 'quiz_passed' }).eligible,
    false,
  );
  assert.equal(
    evaluateReviewEligibility({ state: s, version: '1.0.0', nowMs: NOW + 30 * DAY, event: 'quiz_passed' }).reason,
    'in_cooldown',
  );
});
