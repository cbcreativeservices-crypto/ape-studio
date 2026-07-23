/**
 * Compare-compatibility engine (Phase 2, spec §8): decides whether two saved
 * measurements can be meaningfully compared, and produces the plain-language
 * warnings the spec requires when conditions differ. Never silently blocks a
 * viewable comparison — it WARNS (spec: "show a warning when comparison
 * conditions differ"); only a tool-type mismatch is a hard block.
 */
import type { SavedMeasurement } from './types';

export type CompareIssueLevel = 'blocked' | 'warning';

export type CompareIssue = { level: CompareIssueLevel; message: string };

export type CompareCompatibilityReport = {
  /** false only when the comparison is meaningless (different tools). */
  comparable: boolean;
  issues: CompareIssue[];
};

/** Human labels for known measurement_settings keys (used in warnings). */
const SETTING_LABELS: Record<string, string> = {
  weighting: 'weighting',
  response: 'response (Fast/Slow)',
  smoothing: 'smoothing',
  averaging: 'averaging',
  fraction: 'octave resolution',
  fft_size: 'FFT size',
  fft_preset: 'FFT/window preset',
  window: 'window',
  dynamic_range_db: 'dynamic range',
  mic_position: 'mic position',
  frequency_band: 'frequency band',
  method: 'measurement method',
  window_taps: 'tap averaging window',
  reset_gap_ms: 'tap reset gap',
};

const label = (key: string) => SETTING_LABELS[key] ?? key.replace(/_/g, ' ');

export function compareCompatibility(
  a: SavedMeasurement,
  b: SavedMeasurement,
): CompareCompatibilityReport {
  const issues: CompareIssue[] = [];

  // Hard block: different tools measure different things (spec §8).
  if (a.tool_type !== b.tool_type) {
    return {
      comparable: false,
      issues: [
        {
          level: 'blocked',
          message: 'These measurements come from different tools and cannot be compared directly.',
        },
      ],
    };
  }

  // Calibration mismatch — the spec §8 sentence fires only when the pair truly
  // is calibrated vs uncalibrated; other mismatches (e.g. vs not_applicable)
  // get an honest generic message (review 2026-07-23).
  if (a.calibration_status !== b.calibration_status) {
    const pair = [a.calibration_status, b.calibration_status];
    issues.push({
      level: 'warning',
      message:
        pair.includes('calibrated') && pair.includes('uncalibrated')
          ? 'One measurement is calibrated and the other is uncalibrated. Values may not be directly comparable.'
          : `These measurements have different calibration contexts (${a.calibration_status.replace(/_/g, ' ')} vs ${b.calibration_status.replace(/_/g, ' ')}).`,
    });
  }

  // Input device mismatch.
  if (a.input_device !== b.input_device) {
    issues.push({
      level: 'warning',
      message: `These measurements used different input devices (${a.input_device} vs ${b.input_device}). Device response differences affect the values.`,
    });
  }

  // Sample-rate mismatch (only when both apply).
  if (a.sample_rate != null && b.sample_rate != null && a.sample_rate !== b.sample_rate) {
    issues.push({
      level: 'warning',
      message: `These measurements used different sample rates (${a.sample_rate} Hz vs ${b.sample_rate} Hz).`,
    });
  }

  // Per-setting mismatches — every differing disclosed setting gets a warning.
  const keys = new Set([...Object.keys(a.measurement_settings), ...Object.keys(b.measurement_settings)]);
  for (const k of keys) {
    const av = a.measurement_settings[k];
    const bv = b.measurement_settings[k];
    if (av !== bv) {
      issues.push({
        level: 'warning',
        message: `These measurements use different ${label(k)} settings (${String(av ?? '—')} vs ${String(
          bv ?? '—',
        )}). Comparison may be misleading.`,
      });
    }
  }

  // Degraded-quality members (spec §8: "one measurement has warning/invalid status").
  for (const m of [a, b]) {
    if (m.quality_state === 'invalid') {
      issues.push({
        level: 'warning',
        message: `“${m.title}” is marked INVALID — it should not be trusted, so this comparison is for study only.`,
      });
    } else if (m.quality_state === 'caution') {
      issues.push({
        level: 'warning',
        message: `“${m.title}” carries warnings — interpret this comparison with care.`,
      });
    }
  }

  return { comparable: true, issues };
}
