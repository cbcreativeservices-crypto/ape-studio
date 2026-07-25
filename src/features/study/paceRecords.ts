/**
 * paceRecords — thin wrappers over the two deployed pace RPCs. These are the
 * ONLY backend touchpoints for the pace timer; everything else is device-local
 * (see paceStore.ts). Records are encouraging-only: best / average / sessions.
 *
 *   record_pace_session(p_method_key, p_seconds, p_questions)
 *     → { best_seconds, avg_seconds, sessions, last_seconds }
 *   get_pace_records() → { [method_key]: PaceRecord }
 */
import { supabase } from '../../lib/supabase';
import type { PaceMethodKey } from './paceStore';

export type PaceRecord = {
  best_seconds: number | null;
  avg_seconds: number | null;
  sessions: number;
  last_seconds: number | null;
};

/**
 * Log one completed STOPWATCH run. Returns the updated record, or null on any
 * error (the timer is a practice aid — a failed write never disrupts study).
 */
export async function recordPaceSession(
  methodKey: PaceMethodKey,
  seconds: number,
  questions: number,
): Promise<PaceRecord | null> {
  try {
    const { data, error } = await supabase.rpc('record_pace_session', {
      p_method_key: methodKey,
      p_seconds: Math.max(0, Math.round(seconds)),
      p_questions: questions,
    });
    if (error || !data) return null;
    return data as PaceRecord;
  } catch {
    return null;
  }
}

/** Fetch all pace records keyed by method. Empty object on any error. */
export async function getPaceRecords(): Promise<Partial<Record<PaceMethodKey, PaceRecord>>> {
  try {
    const { data, error } = await supabase.rpc('get_pace_records');
    if (error || !data) return {};
    return data as Partial<Record<PaceMethodKey, PaceRecord>>;
  } catch {
    return {};
  }
}
