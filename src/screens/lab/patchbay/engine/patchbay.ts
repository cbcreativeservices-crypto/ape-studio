/**
 * Patchbay Signal Flow & Normalling — the pure signal-flow core (owner brief
 * 2026-09-10). Zero React / native imports; every teaching claim the lab makes
 * about routing is DERIVED from `resolvePair`, and test/patchbayEngine.test.ts
 * pins the complete truth table — the copy can never contradict the electronics.
 *
 * The central simplification (which is also the lab's teaching insight): the
 * three configurations differ ONLY in when the internal normal survives an
 * insertion. Everything else — what the destination hears, where the source
 * reaches, splits, merges — follows from that one boolean plus the two plug
 * states, identically for every configuration.
 *
 *   thru         → no normal exists
 *   full-normal  → normal survives only while NEITHER front jack is plugged
 *   half-normal  → normal survives until the BREAK side is plugged
 *                  (common bays break on BOTTOM, so the top is a tap; Neutrik
 *                  also documents half-normalled-TOP bays — spec §22: teach
 *                  "verify the bay", never an absolute law)
 *
 * Vocabulary note (spec §1): "Thru" is the safer teaching term — some
 * manufacturers give "isolated" more specific meanings.
 */

export type NormalConfig = 'full' | 'half' | 'thru';

/** Which FRONT insertion opens the normal contact on a half-normal pair. */
export type BreakSide = 'top' | 'bottom';

/** The common half-normal arrangement students will meet first: top = tap
 *  (non-breaking), bottom = break. */
export const COMMON_HALF_BREAK: BreakSide = 'bottom';

/** One vertical pair of patch points, as configured and as currently patched.
 *  TOP is wired to the source (an output); BOTTOM to the destination (an
 *  input). "Signal falls downhill." */
export type PairState = {
  config: NormalConfig;
  /** Half-normal only (ignored otherwise). Defaults to COMMON_HALF_BREAK. */
  breakSide?: BreakSide;
  /** A patch cord is inserted in the TOP front jack. */
  topPlugged: boolean;
  /** A patch cord is inserted in the BOTTOM front jack. */
  bottomPlugged: boolean;
};

export type DestinationFeed = 'normal' | 'patch' | 'both' | 'nothing';
export type SourceRoute = 'destination' | 'patch';

/** The fully-resolved routing for one pair — everything a page renders or a
 *  question grades comes from this record. */
export type PairFlow = {
  /** The configuration provides a default (normalled) path at all. */
  hasNormal: boolean;
  /** Signal is flowing top → bottom through the internal normal contacts. */
  normalActive: boolean;
  /** A normal existed and an insertion has opened the switching contact. */
  normalBroken: boolean;
  /** The source appears at the TOP front jack (out through the patch cord). */
  topFeedsPatch: boolean;
  /** A patched-in signal enters at the BOTTOM front jack toward the destination. */
  bottomFeedsDestination: boolean;
  /** The SOURCE reaches two places at once (the half-normal tap / split / mult). */
  isSplit: boolean;
  /** The DESTINATION receives two feeds at once (normal + patch in parallel —
   *  only possible on a half-normalled-TOP bay; one reason the common bays
   *  break on the bottom instead). */
  isMerge: boolean;
  /** What the destination hears right now. */
  destinationHears: DestinationFeed;
  /** Every place the source's signal arrives ([] = it dead-ends at its jack). */
  sourceReaches: SourceRoute[];
};

/** Does the internal normal survive the current insertions? The one rule the
 *  three configurations disagree on — the entire §12 comparison table is this
 *  function read four ways. */
function normalSurvives(s: PairState): boolean {
  switch (s.config) {
    case 'thru':
      return false; // no internal vertical connection exists to survive
    case 'full':
      return !s.topPlugged && !s.bottomPlugged; // either insertion breaks it
    case 'half': {
      const breaks = s.breakSide ?? COMMON_HALF_BREAK;
      return breaks === 'bottom' ? !s.bottomPlugged : !s.topPlugged;
    }
  }
}

export function resolvePair(s: PairState): PairFlow {
  const hasNormal = s.config !== 'thru';
  const normalActive = normalSurvives(s);
  // A patch cord in a front jack always couples that jack to the cord: the
  // top presents the source outward; the bottom accepts a signal inward.
  const topFeedsPatch = s.topPlugged;
  const bottomFeedsDestination = s.bottomPlugged;

  const sourceReaches: SourceRoute[] = [];
  if (normalActive) sourceReaches.push('destination');
  if (topFeedsPatch) sourceReaches.push('patch');

  const destinationHears: DestinationFeed =
    normalActive && bottomFeedsDestination
      ? 'both'
      : normalActive
        ? 'normal'
        : bottomFeedsDestination
          ? 'patch'
          : 'nothing';

  return {
    hasNormal,
    normalActive,
    normalBroken: hasNormal && !normalActive,
    topFeedsPatch,
    bottomFeedsDestination,
    isSplit: sourceReaches.length >= 2,
    isMerge: normalActive && bottomFeedsDestination,
    destinationHears,
    sourceReaches,
  };
}

/* ── the X-ray insertion model ──────────────────────────────────────────────
 * CONCEPTUAL MODEL: real TT/TRS jacks open their switching contact partway
 * through insertion; the exact fraction varies by jack design and is not a
 * spec'd constant. The lab teaches the MECHANISM (the plug physically lifts
 * the normal contact), so one fixed teaching threshold keeps every animation
 * and every sentence consistent. The X-ray page carries the app's standard
 * "conceptual model" badge. */

/** Fraction of plug travel at which the teaching model opens the contact. */
export const CONTACT_OPEN_AT = 0.6;

/** Is the normal switching contact held open at this insertion depth (0–1)? */
export function contactsOpen(insertion: number): boolean {
  return insertion >= CONTACT_OPEN_AT;
}

/* ── detective mode (spec §15) ──────────────────────────────────────────────
 * The student probes an unlabeled pair and infers its configuration from what
 * they observe. Deduction runs through resolvePair itself, so every authored
 * case is PROVABLY solvable — the test suite asserts each one narrows to
 * exactly its intended answer. Phase A keeps the candidate set to the three
 * configurations students have met (half = the common bottom-break bay).
 */

/** A candidate the detective can accuse. */
export type PairKind = 'full' | 'half' | 'thru';

const CANDIDATES: Record<PairKind, Pick<PairState, 'config' | 'breakSide'>> = {
  full: { config: 'full' },
  half: { config: 'half', breakSide: 'bottom' },
  thru: { config: 'thru' },
};

/** One probe: how the pair was patched, and what the student observed. Either
 *  observation may be omitted when the case doesn't reveal it. */
export type DetectiveTest = {
  topPlugged: boolean;
  bottomPlugged: boolean;
  /** Observed feed at the destination (e.g. "the mixer still hears the keyboard"). */
  destinationHears?: DestinationFeed;
  /** Observed at the far end of a TOP patch cord (e.g. "the analyzer shows signal"). */
  sourceAtPatch?: boolean;
};

/** All configurations consistent with every observation. */
export function consistentConfigs(tests: DetectiveTest[]): PairKind[] {
  return (Object.keys(CANDIDATES) as PairKind[]).filter((kind) =>
    tests.every((t) => {
      const flow = resolvePair({ ...CANDIDATES[kind], topPlugged: t.topPlugged, bottomPlugged: t.bottomPlugged });
      if (t.destinationHears !== undefined && flow.destinationHears !== t.destinationHears) return false;
      if (t.sourceAtPatch !== undefined && flow.topFeedsPatch !== t.sourceAtPatch) return false;
      return true;
    }),
  );
}
