/**
 * Measurement Quality Engine (Phase 2, spec §6): a shared, rule-based mapping
 * from warning flags to the three quality states. No thresholds live here —
 * each tool decides WHICH flags apply from its own real data; this module only
 * decides how flags combine into valid / caution / invalid.
 */
import type { QualityState, WarningFlag } from './types';

/** How severely each flag degrades a measurement (spec §6 semantics):
 *  'invalid' = the measurement should not be trusted at all;
 *  'caution' = viewable, but interpretation is limited. */
export const FLAG_SEVERITY: Record<WarningFlag, Exclude<QualityState, 'valid'>> = {
  mic_permission_missing: 'invalid',
  // §15 Module 8 + the in-app Measurement Integrity capstone teach "clipping
  // invalidates data" — that outweighs §9's softer "may be inaccurate" copy,
  // which still displays (review 2026-07-23; flip to 'caution' only on a
  // product ruling that also rewords the capstone).
  input_clipping: 'invalid',
  uncalibrated_input: 'caution',
  high_noise_floor: 'caution',
  unstable_measurement: 'caution',
  insufficient_signal: 'caution',
  insufficient_sample_count: 'caution',
  insufficient_decay_range: 'invalid',
  settings_mismatch: 'caution',
  unsupported_input: 'invalid',
  file_unsupported: 'invalid',
  // A stream dropout breaks continuity — instantaneous readings survive, but any
  // held/integrated value (peak-hold, Leq, exposure) is suspect, so this LIMITS
  // (caution) the live view. Time-integrated tools additionally hard-invalidate
  // the affected interval in the engine (Phase 1 A1), independent of this flag.
  capture_dropout: 'caution',
  engine_inactive: 'invalid',
};

/** Combine flags → quality state: any invalid-severity flag invalidates; any
 *  caution flag limits; no flags = valid. */
export function evaluateQuality(flags: WarningFlag[]): QualityState {
  if (flags.some((f) => FLAG_SEVERITY[f] === 'invalid')) return 'invalid';
  if (flags.length > 0) return 'caution';
  return 'valid';
}

/** Display colors for the quality states (house palette). */
export const QUALITY_COLOR: Record<QualityState, string> = {
  valid: '#5bff85',
  caution: '#ffc64d',
  invalid: '#ff8d7a',
};

export const QUALITY_LABEL: Record<QualityState, string> = {
  valid: 'VALID',
  caution: 'CAUTION',
  invalid: 'INVALID',
};
