/**
 * HOME + SHELL — hunt 5 (2026-10-03) receipts.
 *
 * 1. Dashboard study gates use the central "known" rule (memberGateOf).
 *    A free learner whose membership read failed, with this account's last
 *    confirmed tier 'free' restored from the cache (`tierKnown` false), saw
 *    every members topic's study switches read START and open — no 🔒 MEMBERS
 *    TOPIC, no popup — because the Dashboard fed `tierKnown` straight into
 *    studyMethodLocked / customListLocked. The tier sweep's own rule
 *    (memberGateOf: `tierKnown || tier === 'free'`) calls that learner a KNOWN
 *    non-member, and Flashcards (useMemberGate) already did.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { memberGateOf, tierOf } from '../src/features/commercial/tier.ts';
import { customListLocked, studyMethodLocked } from '../src/features/commercial/studyGate.ts';

const root = join(import.meta.dirname, '..');
const dash = readFileSync(join(root, 'src/screens/dashboard/DashboardScreen.tsx'), 'utf8');

/** The Dashboard's gate input, as the screen now derives it. */
const gateKnown = (entitlement: 'anonymous' | 'free' | 'lapsed' | 'academy', resolved: boolean, tierKnown: boolean, failed: boolean) => {
  const g = memberGateOf(tierOf(entitlement, resolved), tierKnown, failed);
  return g === 'open' || g === 'locked';
};

describe('Dashboard study gates — the central memberGateOf "known" rule', () => {
  it('the screen derives the gates from useMemberGate, not the raw provider tierKnown', () => {
    // `useTier` joined the import for the topic-terms cache key (perf decisions 2026-10-04).
    // `useGuestWording` joined it for the guest quiz notice (guestEphemeral 2026-10-04).
    assert.match(dash, /import \{ (?:useGuestWording, )?useMemberGate(?:, useTier)? \} from '\.\.\/\.\.\/features\/commercial\/useTier';/);
    assert.match(dash, /const memberGate = useMemberGate\(\);\s*const tierKnown = memberGate === 'open' \|\| memberGate === 'locked';/);
    assert.doesNotMatch(dash, /const \{[^}]*\btierKnown\b[^}]*\} = useEntitlement\(\)/);
  });

  it('a remembered free learner whose read failed is LOCKED on a members topic (and the ★ list)', () => {
    const k = gateKnown('free', true, false, true);
    assert.equal(k, true);
    assert.equal(studyMethodLocked({ resolved: k, entitlement: 'free', displayedGs: 3100, freeGs: [3060, 3970] }), true);
    assert.equal(customListLocked({ resolved: k, entitlement: 'free' }), true);
    // …still open on a free topic.
    assert.equal(studyMethodLocked({ resolved: k, entitlement: 'free', displayedGs: 3060, freeGs: [3060, 3970] }), false);
  });

  it('nothing changes for a member, the boot window, or an unconfirmed read', () => {
    // remembered member, read failed → open
    assert.equal(studyMethodLocked({ resolved: gateKnown('academy', true, false, true), entitlement: 'academy', displayedGs: 3100, freeGs: [3060] }), false);
    // boot window → member-favouring
    assert.equal(gateKnown('anonymous', false, false, false), false);
    // signed in, read failed, nothing remembered → no lock, no upsell (unconfirmed)
    assert.equal(gateKnown('anonymous', true, false, true), false);
    // a KNOWN guest is still locked
    assert.equal(gateKnown('anonymous', true, true, false), true);
  });
});
