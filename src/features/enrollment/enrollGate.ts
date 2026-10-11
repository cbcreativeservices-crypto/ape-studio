/**
 * enrollGate — ENROLLING IS FOR MEMBERS (owner 2026-10-11).
 *
 * Owner, verbatim: "do not allow non members to add topics, certificates, etc
 * into enrollments anymore. they need to know immediately that this is only
 * for members … they must be a member notice needs to happen when they try."
 * Testers read the old behaviour (everyone could ENROLL; a guest got a "won't
 * be saved" heads-up afterwards) as "I can enroll", which was confusing.
 *
 * This file is the PURE half (node-testable): which `MemberGate` state lets an
 * add through, and the words the refusal says. The hook that screens call is
 * `useEnrollGate` (./useEnrollGate.ts). Every user-initiated ADD into My
 * Enrollments goes through it — test/enrollMembersOnly_20261011.test.ts holds
 * every screen call to the add functions to it.
 *
 * Exempt, always: REMOVING (never gated), and the two free topics
 * (FREE_ENROLL_GS — Pro Audio Safety + DAW Fundamentals), which are seeded for
 * everyone and may be added back by anyone.
 */
import type { MemberGate } from '../commercial/tier';

export type EnrollDecision = 'add' | 'locked' | 'checking' | 'unconfirmed';

/** Only 'open' (academy standing) adds — or a request made up ENTIRELY of free
 *  topics. Everything else changes nothing and explains why. */
export function enrollDecisionOf(
  gate: MemberGate,
  gsList: readonly number[] | undefined,
  isFree: (gs: number) => boolean,
): EnrollDecision {
  if (gate === 'open') return 'add';
  if (gsList && gsList.length > 0 && gsList.every(isFree)) return 'add';
  return gate;
}

export const ENROLL_GATE_TITLE = 'MEMBERS ONLY';

/** The members-only popup's body. `guest` = a KNOWN guest (useGuestWording). */
export function enrollLockedBody(guest: boolean): string {
  const core =
    'Enrolling — adding topics, certificates and programs to My Enrollments — is for Academy members only.';
  const free = 'Pro Audio Safety and DAW Fundamentals stay open to everyone.';
  return guest ? `You’re not signed in. ${core} ${free}` : `${core} ${free}`;
}

export const ENROLL_CHECKING_TITLE = 'Checking your account…';
export const ENROLL_CHECKING_BODY = 'We’re still confirming your membership. Try again in a moment.';
export const ENROLL_UNCONFIRMED_TITLE = 'Membership not confirmed';
