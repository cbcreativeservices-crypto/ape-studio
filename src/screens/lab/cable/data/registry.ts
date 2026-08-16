/**
 * registry — aggregation of every connector record in the Cable & Connector
 * Fundamentals Lab (calc-registry idiom: domain files + array spread; new
 * family files only need an import + spread here).
 *
 * VERIFICATION STATE: authored 2026-08-15 (B2); every record's sourceNotes
 * carry '— VERIFY' until the adversarial fact-verification pass
 * (docs/APE_CABLE_LAB_PLAN_2026_08_15.md §9) confirms or corrects them.
 */
import type { ConnectorId, ConnectorRecord, LearningTier } from '../cableTypes';
import { CONNECTORS_ANALOG } from './connectors.analog';
import { CONNECTORS_SPEAKER } from './connectors.speaker';
import { CONNECTORS_DIGITAL } from './connectors.digital';
import { CONNECTORS_POWER } from './connectors.power';
import { CONNECTORS_RECOGNITION } from './connectors.recognition';

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
