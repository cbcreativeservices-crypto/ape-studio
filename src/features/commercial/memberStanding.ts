/**
 * memberStanding — a LEAF mirror of real academy standing for non-React code
 * (owner ruling 2026-09-01: notifications are MEMBERS ONLY).
 *
 * The device notification scheduler (localSchedule.ts) runs outside React —
 * at boot, on foreground, and from the settings save funnel — so it cannot
 * read EntitlementProvider's context. The provider writes the standing here;
 * the scheduler reads it. A leaf on purpose: localSchedule must never import
 * the provider (the provider re-syncs the scheduler on standing changes, and
 * a back-import would be a require cycle — the class of bug that blanked the
 * app via SkinnedVu ↔ VuGlass on 2026-09-01).
 *
 * Tri-state: 'unknown' (boot, before the provider resolves) deliberately does
 * NOT cancel anything — a member's booked reminders shouldn't be swept by a
 * cold boot racing the entitlement fetch. The provider always resolves to a
 * definite value moments later and re-runs the sync, which then enforces.
 */
export type MemberStanding = 'unknown' | 'member' | 'nonmember';

let standing: MemberStanding = 'unknown';

export function setMemberStanding(isMember: boolean): void {
  standing = isMember ? 'member' : 'nonmember';
}

export function memberStanding(): MemberStanding {
  return standing;
}
