/**
 * useEnrollGate — the ONE gate in front of every user-initiated ADD into My
 * Enrollments (owner 2026-10-11; see ./enrollGate.ts for the ruling).
 *
 *   const { guardEnroll, locked } = useEnrollGate();
 *   onPress={() => guardEnroll(() => addTopic(gs), [gs])}
 *
 * - 'open'        → runs the add.
 * - 'locked'      → changes NOTHING; the centred members-only popup at once
 *                   (MembershipGate's card with GET MEMBERSHIP when upsell copy
 *                   is allowed, otherwise a plain notice).
 * - 'checking'    → "Checking your account…" notice, nothing changes.
 * - 'unconfirmed' → MEMBERSHIP_NOT_CONFIRMED notice, nothing changes.
 *
 * Pass the topic gs list being added when it is known: a request made only of
 * the free topics (FREE_ENROLL_GS) goes through for everyone.
 *
 * `guardEnroll` is STABLE (it reads the latest state from a ref), so a memoised
 * row handler with `[]` deps can call it. Returns whether the add ran.
 * `locked` is for the up-front 🔒 on enroll buttons — 'locked' only, never a
 * lock while checking (D52).
 */
// Moved into src/features/commercial/MembershipGate.tsx (2026-10-14, start-graph
// cap 260): screens import it from there; this file only re-exports.
export { useEnrollGate } from '../commercial/MembershipGate';
