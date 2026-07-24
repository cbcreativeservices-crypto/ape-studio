/**
 * Measurement data model (Phase 2, spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §6 quality system + §7 saved
 * measurement library + §8 compare mode).
 *
 * DEVICE-LOCAL ONLY: the backend is frozen and the tools tech-spec §7.2
 * forbids calibration data in the DB — everything here lives in AsyncStorage.
 * Payloads are NUMERICAL results, never raw audio (spec §9 dev note / §18).
 *
 * Payload types for the engine tools (SPL log, spectrum trace, snapshots, IR)
 * are PLANNED here now — spec §7: "the data model must be planned before
 * compare mode is built" — and go live with the native engine.
 */
import type { ToolKey } from '../../../screens/tools/toolsData';

/** Measurement quality states (spec §6). */
export type QualityState = 'valid' | 'caution' | 'invalid';

export type CalibrationStatus = 'uncalibrated' | 'calibrated' | 'not_applicable';

/** Common warning flags (spec §6 table). Machine codes; user copy in WARNING_INFO. */
export type WarningFlag =
  | 'mic_permission_missing'
  | 'input_clipping'
  | 'uncalibrated_input'
  | 'high_noise_floor'
  | 'unstable_measurement'
  | 'insufficient_signal'
  | 'insufficient_sample_count' // too few events/taps to average reliably (tap timing)
  | 'insufficient_decay_range'
  | 'settings_mismatch'
  | 'unsupported_input'
  | 'file_unsupported'
  | 'engine_inactive';

/** Plain-language warning copy (spec §6: warnings appear on-screen, never
 *  hidden in developer logs). `hint` = what the user should DO about it. */
export const WARNING_INFO: Record<WarningFlag, { label: string; message: string; hint: string }> = {
  mic_permission_missing: {
    label: 'MIC PERMISSION',
    message: 'Microphone permission is missing.',
    hint: 'Allow microphone access in system settings to measure live audio.',
  },
  input_clipping: {
    label: 'CLIPPING',
    message: 'Input clipping detected. Reading may be inaccurate.',
    hint: 'Lower input gain or move the microphone farther from the source.',
  },
  uncalibrated_input: {
    label: 'UNCALIBRATED',
    message: 'This input is uncalibrated — values are approximate.',
    hint: 'Treat readings as relative. Calibration tightens absolute accuracy.',
  },
  high_noise_floor: {
    label: 'NOISE FLOOR',
    message: 'High background noise detected.',
    hint: 'Reduce background noise or measure when the space is quieter.',
  },
  unstable_measurement: {
    label: 'UNSTABLE',
    message: 'The measurement is unstable.',
    hint: 'Hold conditions steady and repeat; interpret this result with care.',
  },
  insufficient_signal: {
    label: 'LOW SIGNAL',
    message: 'Not enough signal to measure reliably.',
    hint: 'Increase the source level or capture a longer measurement.',
  },
  insufficient_sample_count: {
    label: 'FEW TAPS',
    message: 'Too few taps to average reliably.',
    hint: 'Keep tapping in time — more taps tighten the result.',
  },
  insufficient_decay_range: {
    label: 'DECAY RANGE',
    message: 'Insufficient decay range — the result should not be trusted.',
    hint: 'Use a louder excitation or a quieter room so the decay clears the noise floor.',
  },
  settings_mismatch: {
    label: 'SETTINGS',
    message: 'Measurement settings do not match.',
    hint: 'Match settings before comparing measurements.',
  },
  unsupported_input: {
    label: 'INPUT',
    message: 'This input device is not supported for measurement.',
    hint: 'Use the built-in microphone or a supported input.',
  },
  file_unsupported: {
    label: 'FILE',
    message: 'This file format is not supported.',
    hint: 'Use a supported audio file format.',
  },
  engine_inactive: {
    label: 'ENGINE',
    message: 'The measurement engine is not active.',
    hint: 'Live measurement requires the audio engine — no values are simulated.',
  },
};

/** Measurement settings — flat, JSON-safe, disclosed with every saved
 *  measurement (spec §5: always disclose measurement context). */
export type MeasurementSettings = Record<string, string | number | boolean | null>;

// ---------------------------------------------------------------------------
// Per-tool data payloads (spec §7 saved-object table). Numerical only.
// ---------------------------------------------------------------------------

/** Tap-timing session (Frequency Counter & Tuner — the live tool today). */
export type TapLogPayload = {
  kind: 'tap_log';
  freq: number; // Hz
  periodMs: number;
  bpm: number;
  intervals: number; // how many inter-tap intervals averaged in
  stabilityPct: number | null;
  stabilityLabel: string | null;
  minFreq: number | null;
  maxFreq: number | null;
};

/** SPL logging session (engine tool — planned; spec §9 View 2). */
export type SplLogPayload = {
  kind: 'spl_log';
  weighting: 'A' | 'C' | 'Z';
  response: 'fast' | 'slow';
  durationSec: number;
  /** Downsampled dB timeline (numerical, never audio). */
  timeline: number[];
  timelineStepSec: number;
  peakDb: number;
  avgDb: number;
};

/** Frozen RTA trace (engine tool — planned; spec §10 View 2). */
export type SpectrumTracePayload = {
  kind: 'spectrum_trace';
  bandsHz: number[];
  levelsDb: number[];
  fraction: 1 | 3; // 1/1 or 1/3 octave
  smoothing: string;
  averaging: string;
};

/** Waveform snapshot (engine tool — planned; spec §11 View 2). */
export type WaveformSnapshotPayload = {
  kind: 'waveform_snapshot';
  /** Min/max envelope pairs (downsampled), NOT raw audio. */
  envelope: { min: number; max: number }[];
  durationSec: number;
  peakDbfs: number;
  clippedRuns: number;
  channels: 1 | 2;
};

/** Spectrogram snapshot (engine tool — planned; spec §12 View 2). */
export type SpectrogramSnapshotPayload = {
  kind: 'spectrogram_snapshot';
  /** Coarse time × band dB grid (display-resolution, never audio). */
  grid: number[][];
  bandsHz: number[];
  timeStepSec: number;
  dynamicRangeDb: number;
  fftPreset: string;
};

/** RT60 / impulse-response measurement (spec §13). `method` is the BROADBAND
 *  headline fit; range gates are per band, so bands carry their OWN method. */
export type ImpulseResponsePayload = {
  kind: 'impulse_response';
  method: 'T20' | 'T30' | 'EDT';
  /** Per-band decay fits. `method` is that band's fit (§13 "always labeled" —
   *  may differ from the broadband headline; optional for pre-2026-07-23
   *  records, null when the band was invalid). `confidence` is the raw R² of
   *  the line fit backing rt60Sec (0–1 goodness-of-fit — NOT a probability;
   *  render as "R²", never as a percent). */
  perBand: { bandHz: number; rt60Sec: number | null; method?: 'T20' | 'T30' | null; confidence: number }[];
  noiseFloorDb: number | null;
  /** Downsampled decay curve in dB (numerical). */
  decayDb: number[];
  decayStepSec: number;
};

export type MeasurementPayload =
  | TapLogPayload
  | SplLogPayload
  | SpectrumTracePayload
  | WaveformSnapshotPayload
  | SpectrogramSnapshotPayload
  | ImpulseResponsePayload;

// ---------------------------------------------------------------------------
// The saved measurement record (spec §7 required metadata — every field).
// ---------------------------------------------------------------------------

export type SavedMeasurement = {
  id: string;
  tool_type: ToolKey;
  /** ISO 8601 — when the measurement was taken. */
  created_at: string;
  title: string;
  notes: string;
  input_device: string;
  calibration_status: CalibrationStatus;
  /** Hz, or null where sample rate does not apply (e.g. tap timing). */
  sample_rate: number | null;
  measurement_settings: MeasurementSettings;
  quality_state: QualityState;
  warning_flags: WarningFlag[];
  data_payload: MeasurementPayload;
};
