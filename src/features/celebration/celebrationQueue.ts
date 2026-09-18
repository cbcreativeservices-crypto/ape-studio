/**
 * celebrationQueue — what to show, in what order, and what to swallow.
 *
 * Pure logic, no React and no navigator, so the rules that decide whether a
 * user is congratulated once or three times can be tested directly.
 *
 * ── THE TWO RULES THAT MATTER ────────────────────────────────────────────────
 *
 * 1. MULTIPLE CREDENTIALS SUPPRESSES THE INDIVIDUAL ONES. A capstone can
 *    satisfy several credentials at once, and without this the user gets three
 *    full screens stacked — the third dismissed unread, which devalues all
 *    three. The owner's spec has the combined screen; it does not say it must
 *    replace the singles, and it must.
 *
 * 2. ONE FULL SCREEN AT A TIME, STRONGEST FIRST. Finishing a topic can raise
 *    'topic-complete' AND 'perfect-score' AND 'subject-complete' in one moment.
 *    They are all true; showing all three is not a celebration, it is a queue
 *    of dialogs. The strongest wins and the rest are dropped — not deferred,
 *    because a congratulation that arrives three screens later is confusing.
 *
 * Step and stage notices are inline and cheap, so several may stand together.
 */
import { CELEBRATIONS, CREDENTIAL_IDS } from './catalog';
import type { CelebrationEvent, CelebrationTier } from './types';

const TIER_RANK: Record<CelebrationTier, number> = {
  step: 0,
  stage: 1,
  milestone: 2,
  credential: 3,
};

/**
 * Reduce everything raised in one moment to what should actually be shown.
 *
 * Returns the events in display order: at most one screen-tier event, followed
 * by any inline notices.
 */
export function resolveCelebrations(raised: readonly CelebrationEvent[]): CelebrationEvent[] {
  if (raised.length === 0) return [];

  // Rule 1 — the combined credential screen replaces the singles.
  const hasCombined = raised.some((e) => e.id === 'multiple-credentials');
  const kept = hasCombined
    ? raised.filter((e) => !CREDENTIAL_IDS.includes(e.id))
    : [...raised];

  const isScreen = (e: CelebrationEvent) => {
    const t = CELEBRATIONS[e.id].tier;
    return t === 'milestone' || t === 'credential';
  };

  // Rule 2 — one screen, the strongest. Ties keep the order they were raised
  // in, so a caller that raises the more specific one first gets it.
  const screens = kept.filter(isScreen);
  const best = screens.reduce<CelebrationEvent | null>((acc, e) => {
    if (!acc) return e;
    return TIER_RANK[CELEBRATIONS[e.id].tier] > TIER_RANK[CELEBRATIONS[acc.id].tier] ? e : acc;
  }, null);

  const notices = kept.filter((e) => !isScreen(e));
  return best ? [best, ...notices] : notices;
}

/**
 * Which credential celebration to raise for a set of newly earned credentials.
 *
 * Encodes the first-time distinction the owner asked for: the FIRST certificate
 * and the FIRST programme get their own, warmer wording, and anything beyond
 * one credential at a time becomes the combined screen.
 */
export function credentialCelebration(input: {
  certificates: number;
  programs: number;
  /** Totals the user held BEFORE this moment. */
  priorCertificates: number;
  priorPrograms: number;
}): CelebrationEvent | null {
  const total = input.certificates + input.programs;
  if (total <= 0) return null;

  if (total > 1) {
    return { id: 'multiple-credentials', values: { credential_count: total } };
  }
  if (input.programs === 1) {
    return { id: input.priorPrograms === 0 ? 'first-program' : 'program-complete', values: {} };
  }
  return {
    id: input.priorCertificates === 0 ? 'first-certificate' : 'certificate-earned',
    values: {},
  };
}
