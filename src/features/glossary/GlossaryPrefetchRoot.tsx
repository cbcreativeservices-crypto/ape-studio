/**
 * Starts the background glossary save once, for a member, after launch settles.
 *
 * Renders nothing. Mounted inside EntitlementProvider because membership is the
 * gate and that is where entitlement lives — the prefetch itself is a plain
 * module and knows nothing about React.
 *
 * Owner 2026-09-22: the glossary should already be on the phone by the time
 * somebody needs it offline, rather than waiting for them to open the screen
 * and find a button.
 */
import { useEffect } from 'react';
import { useEntitlement } from '../commercial/EntitlementProvider';
import { cancelGlossaryPrefetch, prefetchGlossary } from './offlinePrefetch';

export function GlossaryPrefetchRoot(): null {
  const { resolved, isMember } = useEntitlement();

  useEffect(() => {
    // ⛔ Wait for a RESOLVED entitlement. Starting on the optimistic pre-resolve
    // view would spend a non-member's data on a members-only feature, which is
    // the one direction of that guess we cannot take back.
    if (!resolved || !isMember) return;
    void prefetchGlossary();
    // Signing out (or losing membership) stops it mid-run rather than carrying
    // on downloading against an entitlement that has gone.
    return () => cancelGlossaryPrefetch();
  }, [resolved, isMember]);

  return null;
}
