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
// Moved into src/features/commercial/tier.ts (2026-10-14, start-graph cap): this
// file only re-exports, for node tests and any non-start-path importer.
export {
  ENROLL_CHECKING_BODY,
  ENROLL_CHECKING_TITLE,
  ENROLL_GATE_TITLE,
  ENROLL_UNCONFIRMED_TITLE,
  enrollDecisionOf,
  enrollLockedBody,
  type EnrollDecision,
} from '../commercial/tier.ts';
