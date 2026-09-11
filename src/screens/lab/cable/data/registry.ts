/**
 * registry — aggregation of every connector record in the Cable & Connector
 * Fundamentals Lab (calc-registry idiom: domain files + array spread; new
 * family files only need an import + spread here).
 *
 * VERIFICATION STATE (re-counted 2026-09-11): authored 2026-08-15 (B2). The
 * adversarial fact-verification pass (docs/APE_CABLE_LAB_PLAN_2026_08_15.md
 * §9) HAS RUN over the great majority — 189 sourceNotes now read VERIFIED.
 * This docblock used to say "every record's sourceNotes carry '— VERIFY'",
 * which has been false for some time and hid the ones that genuinely are not.
 *
 * STILL UNVERIFIED — 10 sourceNotes across 5 records, grep '— VERIFY':
 *   connectors.analog.ts:365,478 · connectors.digital.ts:579,690,807,912 ·
 *   connectors.recognition.ts:716 · connectors.speaker.ts:602,606,707
 * These are the only facts in this SAFETY-CRITICAL set not yet confirmed.
 * Re-count rather than trusting this list once any of them is resolved.
 */
import type { ConnectorId, ConnectorRecord, LearningTier } from '../cableTypes';
import { CONNECTORS_ANALOG } from './connectors.analog.ts';
import { CONNECTORS_SPEAKER } from './connectors.speaker.ts';
import { CONNECTORS_DIGITAL } from './connectors.digital.ts';
import { CONNECTORS_POWER } from './connectors.power.ts';
import { CONNECTORS_RECOGNITION } from './connectors.recognition.ts';

export const CONNECTORS: ConnectorRecord[] = [
  ...CONNECTORS_ANALOG,
  ...CONNECTORS_SPEAKER,
  ...CONNECTORS_DIGITAL,
  ...CONNECTORS_POWER,
  ...CONNECTORS_RECOGNITION,
];

const BY_ID = new Map<ConnectorId, ConnectorRecord>(CONNECTORS.map((c) => [c.id, c]));

export function getConnector(id: ConnectorId): ConnectorRecord | undefined {
  return BY_ID.get(id);
}

/** Records at a learning tier, registry order preserved. */
export function connectorsByTier(tier: LearningTier): ConnectorRecord[] {
  return CONNECTORS.filter((c) => c.tier === tier);
}
