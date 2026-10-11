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
import { useCallback, useRef } from 'react';
import { notify } from '../../lib/confirm';
import { openMembershipGate } from '../commercial/MembershipGate';
import { MEMBERSHIP_NOT_CONFIRMED, type MemberGate } from '../commercial/tier';
import { useGuestWording, useMemberGate, useUpsellAllowed } from '../commercial/useTier';
import {
  ENROLL_CHECKING_BODY,
  ENROLL_CHECKING_TITLE,
  ENROLL_GATE_TITLE,
  ENROLL_UNCONFIRMED_TITLE,
  enrollDecisionOf,
  enrollLockedBody,
} from './enrollGate';
import { isFreeEnrollGs } from './enrollmentStore';

export function useEnrollGate(): {
  guardEnroll: (add: () => void, gsList?: readonly number[]) => boolean;
  locked: boolean;
  gate: MemberGate;
} {
  const gate = useMemberGate();
  const upsell = useUpsellAllowed();
  const { guest } = useGuestWording();
  const latest = useRef({ gate, upsell, guest });
  latest.current = { gate, upsell, guest };

  const guardEnroll = useCallback((add: () => void, gsList?: readonly number[]): boolean => {
    const { gate: g, upsell: u, guest: isGuest } = latest.current;
    const decision = enrollDecisionOf(g, gsList, isFreeEnrollGs);
    if (decision === 'add') {
      add();
      return true;
    }
    if (decision === 'checking') notify(ENROLL_CHECKING_TITLE, ENROLL_CHECKING_BODY);
    else if (decision === 'unconfirmed') notify(ENROLL_UNCONFIRMED_TITLE, MEMBERSHIP_NOT_CONFIRMED);
    else if (u) openMembershipGate({ title: ENROLL_GATE_TITLE, body: enrollLockedBody(isGuest) });
    else notify('Members only', enrollLockedBody(isGuest));
    return false;
  }, []);

  return { guardEnroll, locked: gate === 'locked', gate };
}
