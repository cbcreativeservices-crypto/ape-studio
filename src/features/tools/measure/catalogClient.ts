/**
 * catalogClient — the network last mile for the community mic catalog (owner
 * 2026-08-21). Uploads locally-queued anonymous contributions and fetches the
 * aggregated per-model starting offset. Backend: docs/MIC_CATALOG_2026_08_21.sql
 * (anonymous table, INSERT-only for clients; a privacy-safe aggregated view is
 * the ONLY thing clients read).
 *
 * SAFETY: upload is CONSENT-GATED (re-checked here, not just at queue time) and
 * anonymous (the payload carries no account/PII/audio/geo — see deviceProfile).
 * A community offset is a SUGGESTED starting point, never applied as truth.
 */
import { supabase } from '../../../lib/supabase';
import {
  clearContributionQueue,
  getQueuedContributions,
  hasCrowdsourceConsent,
  type CalibrationContribution,
  type DeviceKey,
} from './deviceProfile';

const TABLE = 'mic_calibration_contributions';
const VIEW = 'mic_catalog_public';

function toRow(c: CalibrationContribution) {
  return {
    contribution_id: c.contributionId,
    device_key: c.deviceKey,
    offset_db: c.offsetDb,
    nominal_start: c.nominalStart,
    reference_quality: c.referenceQuality,
    mic_info: c.micInfo,
    noise_floor_db: c.noiseFloorDb,
    sample_rate: c.sampleRate,
    schema_version: c.schemaVersion,
  };
}

/** Drain the local queue to the backend. No-op without consent (a queued item is
 *  not consent) or when the queue is empty. Best-effort: on any error we KEEP the
 *  queue for a later retry. Dedup is server-side (unique contribution_id). */
export async function uploadQueuedContributions(): Promise<void> {
  try {
    if (!(await hasCrowdsourceConsent())) return;
    const q = await getQueuedContributions();
    if (q.length === 0) return;
    const { error } = await supabase
      .from(TABLE)
      .upsert(q.map(toRow), { onConflict: 'contribution_id', ignoreDuplicates: true });
    if (!error) await clearContributionQueue();
  } catch {
    /* offline / transient — the queue persists and retries next time */
  }
}

export type CommunityProfile = {
  suggestedOffsetDb: number;
  spreadDb: number | null;
  trustedCount: number;
  totalCount: number;
};

/** Fetch the aggregated community starting offset for a device, or null when
 *  there's no identity yet (model comes with the native batch) or the catalog
 *  hasn't reached the publish bar for this model. Reads the aggregate view only. */
export async function fetchCommunityProfile(key: DeviceKey): Promise<CommunityProfile | null> {
  if (!key.model) return null; // no device identity → nothing to match
  try {
    const { data, error } = await supabase
      .from(VIEW)
      .select('suggested_offset_db, spread_db, trusted_count, total_count')
      .eq('platform', key.platform)
      .eq('model', key.model)
      .eq('measurement_grade', key.measurementGrade)
      .maybeSingle();
    if (error || !data || data.suggested_offset_db == null) return null;
    return {
      suggestedOffsetDb: data.suggested_offset_db as number,
      spreadDb: (data.spread_db as number | null) ?? null,
      trustedCount: (data.trusted_count as number) ?? 0,
      totalCount: (data.total_count as number) ?? 0,
    };
  } catch {
    return null;
  }
}
