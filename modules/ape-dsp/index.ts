/**
 * ape-dsp — JS API for the native capture/DSP module.
 * Spike 0 (2026-07-09): capture + RMS/peak proof. ENGINE BUILD (2026-07-23):
 * weighted meters (Z/A/C × Fast/Slow), Leq logging, FFT → octave bands with
 * the Q2 honest-gray-out flags, fine spectrum for the spectrogram, YIN pitch
 * with confidence, waveform envelope, and the Q4-capped signal generator.
 * ENGINE v3 (2026-07-25, HV-2): additive generator mode — 12 harmonics of a
 * fundamental, band-limited and peak-normalized inside the same Q4 cap chain.
 *
 * Pull-based frames (spike bridge rules): poll at ≤30 Hz from the UI.
 * Scalars/small arrays ride the dictionary bridge; spectrum + waveform ride
 * Data → Uint8Array, decoded here into Float32Arrays.
 *
 * `isAvailable()` gates every caller (absent on web/Android/Expo Go).
 * `engineVersion()` gates the ENGINE surface: a dev client built at Spike-0
 * has the module but not the engine — callers must degrade to the honest
 * "install the new dev build" state, never crash, never simulate.
 */
import { requireNativeModule } from 'expo-modules-core';

export type DspFrame = {
  version: number;
  sequence: number;
  settingsEpoch: number;
  rmsDb: number;
  peakDb: number;
  peakHoldDb: number;
  droppedFrames: number;
  running: boolean;
  captureStalled: boolean;
  processedInput: boolean;
  bluetoothInput: boolean;
  interrupted: boolean;
  engineVersion?: number;
};

export type DspInfo = {
  engineVersion?: number;
  sampleRate: number;
  ioBufferDuration: number;
  measurementMode: boolean;
  bluetoothInput: boolean;
  routeName: string;
  inputPortType: string;
  running: boolean;
  lastError: string;
  /** Output audio route (engineVersion ≥ 4): e.g. "Speaker", "Headphones",
   *  "BluetoothA2DP", "LineOut". Drives the route-aware speaker-safety HPF and
   *  is shown to the user. "" / "unknown" on older builds. */
  outputRoute?: string;
  /** Which code path last stopped capture (spike diagnostics). */
  stopReason: string;
  /** Rolling native lifecycle event log (spike diagnostics). */
  events: string[];
};

/** Engine meter frame — dBFS values; peak may exceed 0 dBFS (finding F1). */
export type MeterFrame = {
  version: number;
  sequence: number;
  settingsEpoch: number;
  zFastDb: number;
  zSlowDb: number;
  aFastDb: number;
  aSlowDb: number;
  cFastDb: number;
  cSlowDb: number;
  peakDb: number;
  peakHoldDb: number;
  clipRuns: number;
  leqZDb: number;
  leqADb: number;
  elapsedSec: number;
  droppedFrames: number;
  running: boolean;
  captureStalled: boolean;
  processedInput: boolean;
  bluetoothInput: boolean;
  interrupted: boolean;
};

export type BandsFrame = {
  sequence: number;
  fraction: 1 | 3;
  fftSize: number;
  sampleRate: number;
  centers: number[];
  levelsDb: number[];
  peakHoldDb: number[];
  /** Q2 honest gray-out: false bands render grayed, never fabricated. */
  resolvable: boolean[];
};

export type PitchFrame = {
  sequence: number;
  freq: number;
  confidence: number;
  voiced: boolean;
  levelDb: number;
};

export type SpectrumMeta = {
  sequence: number;
  fftSize: number;
  sampleRate: number;
  bins: number;
};

/** One waveform bucket decoded from the quad stream. */
export type WaveBucket = { min: number; max: number; rms: number; clipped: boolean };

export type EngineConfig = {
  fftSize?: number; // 256..16384 (Q5 ceiling)
  fraction?: 1 | 3;
  spectrumEnabled?: boolean;
  pitchEnabled?: boolean;
  waveformEnabled?: boolean;
  bandAvgAlpha?: number; // 0..1 exponential band averaging per tick
};

/** Generator modes (must match apedsp::GenMode). */
export const GEN_MODES = {
  off: 0,
  sine: 1,
  white: 2,
  pink: 3,
  brown: 4,
  blue: 5,
  violet: 6,
  sweepLin: 7,
  sweepLog: 8,
  impulse: 9,
  click: 10,
  burst: 11,
  additive: 12, // engineVersion ≥ 3 — 12-harmonic additive (HV-2)
  fm: 13, // engineVersion ≥ 7 — carrier+modulator FM voice (wave-2)
} as const;
export type GenModeName = keyof typeof GEN_MODES;

export type GenParams = {
  mode?: number;
  frequency?: number;
  levelDb?: number;
  clickBpm?: number;
  sweep?: { startHz: number; endHz: number; seconds: number; repeat?: boolean };
  /** Additive mode params (engineVersion ≥ 3): the flat 25-number layout
   *  [f0, a1..a12, p1..p12] shared byte-for-byte with both native bridges —
   *  f0 in Hz (floored to 1 native-side), amps relative 0..1 (clamped),
   *  phases in DEGREES 0..360 (wrapped). The native setter is
   *  all-or-nothing (< 25 numbers dropped); harmonics at/above Nyquist are
   *  silently omitted from synthesis (band-limited by construction).
   *  NOTE: `frequency` retunes the SINE path only — retuning the additive
   *  f0 means resending this whole array (phase-continuous in the core). */
  additive?: number[];
  /** Stereo dual-oscillator (engineVersion ≥ 5): hard-panned L = sine(fL),
   *  R = sine(fR). `on:false` returns to mono (L==R). Used by stereo lab tools
   *  (Harmonograph: harmonic n1 → L, n2 → R). No-op below v5. */
  stereo?: { on: boolean; fL: number; fR: number };
  /** FM voice targets (engineVersion ≥ 7, GEN_MODES.fm): modulator = ratio ×
   *  carrier (`frequency`); index = peak phase deviation in radians (Chowning —
   *  sidebands at fc±k·fm with amplitudes J_k(I)), ramped native-side;
   *  decaySec > 0 = per-trigger exponential index decay (the classic bell/
   *  pluck "brightness fades"; 0 = sustained). A genStart on a running tone is
   *  the STRIKE (click-free retrigger restarts the decay). No-op below v7. */
  fm?: { ratio: number; index: number; decaySec?: number };
};

export type GenStatus = {
  running: boolean;
  capUnlocked: boolean;
  effectiveLevelDb: number;
  defaultLevelDb: number; // −20 (Q4)
  capDb: number; // −12 (Q4)
  /** engineVersion ≥ 3 only: current additive normalization factor
   *  (1/max(1, Σaₙ)) — 1 = not attenuating, <1 = the norm is pulling the
   *  harmonic sum down to keep the peak inside the Q4 cap chain. */
  additiveNorm?: number;
  /** engineVersion ≥ 4 only: the route-aware speaker-safety high-pass cutoff in
   *  Hz (0 = bypassed, e.g. on headphones) and whether it's engaged. Read for
   *  honest display; the native route layer drives the value. */
  genHpfHz?: number;
  genHpfEngaged?: boolean;
};

/** Binaural source types (engineVersion ≥ 7 — binaural::Src). */
export const BIN_SRC = { sine: 0, white: 1, pink: 2 } as const;

/** One binaural source's targets (all ramped native-side — drag-rate safe). */
export type BinSourceParams = {
  on: boolean;
  /** BIN_SRC value. */
  type?: number;
  /** Sine frequency in Hz (ignored for noise types). */
  freq?: number;
  /** ≤ −12 (Q4 cap, no unlock on this bus). */
  levelDb?: number;
  /** Azimuth in degrees: 0 = front, +90 = hard right, ±180 = behind. */
  azDeg?: number;
  /** Distance in meters (0.5–4), inverse-distance gain re 1 m. */
  dist?: number;
};

export type BinStatus = {
  running: boolean;
  /** Bus normalization actually applied (1 = not attenuating; <1 = the Q4 sum
   *  bound is pulling the mix down) — honest display. */
  busNorm: number;
};

/** Modular-voice scalar param ids (engineVersion ≥ 7 — modular::Param; keep in
 *  lockstep with Modular.hpp). Param blocks: seqStep(i) = semitone offset of
 *  step i (0..7); seqGate(i) = step active 0/1. */
export const MOD_PARAM = {
  shape: 1, // 0 saw · 1 square · 2 triangle · 3 sine
  baseFreq: 2,
  cutoff: 3,
  resonance: 4, // 0..1
  envA: 5,
  envD: 6,
  envS: 7,
  envR: 8,
  envToCutoff: 9, // −1..1 (± 4 octaves)
  lfoRate: 10,
  lfoDepth: 11, // 0..1
  lfoDest: 12, // 0 off · 1 pitch · 2 cutoff · 3 amp
  seqOn: 13,
  seqRate: 14, // steps/s
  levelDb: 16,
  seqStep: (i: number) => 20 + i,
  seqGate: (i: number) => 28 + i,
} as const;

export type ModStatus = {
  running: boolean;
  /** Live ADSR envelope level 0..1 (honest env meter). */
  envLevel: number;
  /** Active sequencer step 0..7, or −1 when the sequencer is off. */
  activeStep: number;
};

/** RT60 guided-capture states (spec §13). */
export type Rt60State = 0 | 1 | 2 | 3; // off | armed | recording | done

export type Rt60Band = {
  bandHz: number; // 0 = broadband
  edtSec: number; // 0 = unavailable
  t20Rt60Sec: number; // 0 = unavailable — NEVER fabricated
  t30Rt60Sec: number;
  r2: number; // best available fit (validity gate)
  t20R2: number; // R² of the T20 fit; 0 = unavailable
  t30R2: number; // R² of the T30 fit; 0 = unavailable
  decayRangeDb: number;
  valid: boolean;
};

export type Rt60Frame = {
  state: Rt60State;
  bands: Rt60Band[];
  curveDb: number[];
  curveStepSec: number;
};

type NativeApeDsp = {
  start(): Promise<DspInfo>;
  stop(): Promise<void>;
  getFrame(): DspFrame;
  getInfo(): DspInfo;
  resetPeakHold(): void;
  // Engine build:
  setEngineConfig(cfg: EngineConfig): void;
  getMeterFrame(): MeterFrame;
  getBandsFrame(): BandsFrame;
  getPitchFrame(): PitchFrame;
  getSpectrumMeta(): SpectrumMeta;
  getSpectrumData(): Uint8Array;
  getWaveformData(): Uint8Array;
  resetLeq(): void;
  rt60Arm(): void;
  rt60Cancel(): void;
  getRt60Frame(): Rt60Frame;
  genStart(): Promise<GenStatus>;
  genStop(): Promise<void>;
  genSet(params: GenParams): void;
  genUnlockCap(): void;
  genRelockCap(): void;
  genStatus(): GenStatus;
  fxSet(effectId: number, paramId: number, value: number): void;
  fxReset(): void;
  fxGrStatus(): number[];
  // Wave-2 expansion voices (engineVersion ≥ 7):
  binStart(): Promise<BinStatus>;
  binStop(): Promise<void>;
  binSet(sourceIdx: number, params: BinSourceParams): void;
  binStatus(): BinStatus;
  modStart(): Promise<ModStatus>;
  modStop(): Promise<void>;
  modSet(param: number, value: number): void;
  modStatus(): ModStatus;
};

let native: NativeApeDsp | null = null;
try {
  native = requireNativeModule<NativeApeDsp>('ApeDsp');
} catch {
  native = null; // old dev client / unsupported platform
}

// Memoized (review 2026-07-23): the native surface cannot change within a
// process, and the uncached version cost a full getInfo() round trip inside
// EVERY frame getter — doubling bridge traffic at the 15 Hz poll.
let cachedEngineVersion: number | null = null;

/** Decode a native byte payload into a Float32Array (little-endian). */
function toFloat32(bytes: Uint8Array | null | undefined): Float32Array {
  if (!bytes || bytes.byteLength < 4) return new Float32Array(0);
  return new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
}

export const ApeDsp = {
  isAvailable(): boolean {
    return native != null;
  },
  /** 0 = module absent · 1 = Spike-0 build (no engine) · 2 = engine build ·
   *  3 = engine + additive generator (HV-2). The value is READ from the
   *  native constant (DspInfo.engineVersion — never hardcoded here beyond
   *  feature-gating comparisons). Callers gate the engine surface on ≥2,
   *  the additive surface on ≥3, and degrade honestly below. */
  engineVersion(): number {
    if (!native) return 0;
    if (cachedEngineVersion != null) return cachedEngineVersion;
    try {
      cachedEngineVersion =
        typeof native.getMeterFrame === 'function' ? (native.getInfo().engineVersion ?? 1) : 1;
    } catch {
      cachedEngineVersion = 1;
    }
    return cachedEngineVersion;
  },
  /** Requests mic permission (lazily, per spec §1.5), configures the session, starts capture. */
  start(): Promise<DspInfo> {
    if (!native) return Promise.reject(new Error('ape-dsp native module not in this build'));
    return native.start();
  },
  stop(): Promise<void> {
    return native ? native.stop() : Promise.resolve();
  },
  getFrame(): DspFrame | null {
    return native ? native.getFrame() : null;
  },
  getInfo(): DspInfo | null {
    return native ? native.getInfo() : null;
  },
  resetPeakHold(): void {
    native?.resetPeakHold();
  },

  // ---- Engine surface (all no-op/null below engineVersion 2) ----
  setEngineConfig(cfg: EngineConfig): void {
    if (this.engineVersion() >= 2) native?.setEngineConfig(cfg);
  },
  getMeterFrame(): MeterFrame | null {
    return this.engineVersion() >= 2 ? native!.getMeterFrame() : null;
  },
  getBandsFrame(): BandsFrame | null {
    return this.engineVersion() >= 2 ? native!.getBandsFrame() : null;
  },
  getPitchFrame(): PitchFrame | null {
    return this.engineVersion() >= 2 ? native!.getPitchFrame() : null;
  },
  getSpectrumMeta(): SpectrumMeta | null {
    return this.engineVersion() >= 2 ? native!.getSpectrumMeta() : null;
  },
  getSpectrum(): Float32Array {
    return this.engineVersion() >= 2 ? toFloat32(native!.getSpectrumData()) : new Float32Array(0);
  },
  /** Waveform history, newest first. */
  getWaveform(): WaveBucket[] {
    if (this.engineVersion() < 2) return [];
    const q = toFloat32(native!.getWaveformData());
    const out: WaveBucket[] = [];
    for (let i = 0; i + 3 < q.length; i += 4) {
      out.push({ min: q[i], max: q[i + 1], rms: q[i + 2], clipped: q[i + 3] > 0.5 });
    }
    return out;
  },
  resetLeq(): void {
    if (this.engineVersion() >= 2) native?.resetLeq();
  },
  rt60Arm(): void {
    if (this.engineVersion() >= 2) native?.rt60Arm();
  },
  rt60Cancel(): void {
    if (this.engineVersion() >= 2) native?.rt60Cancel();
  },
  getRt60Frame(): Rt60Frame | null {
    return this.engineVersion() >= 2 ? native!.getRt60Frame() : null;
  },

  // ---- Generator (Q4 caps native-side; see GenStatus for the honest levels) ----
  genStart(): Promise<GenStatus> {
    if (this.engineVersion() < 2)
      return Promise.reject(new Error('generator requires the engine build'));
    return native!.genStart();
  },
  genStop(): Promise<void> {
    return this.engineVersion() >= 2 ? native!.genStop() : Promise.resolve();
  },
  genSet(params: GenParams): void {
    if (this.engineVersion() >= 2) native?.genSet(params);
  },
  /** Additive generator params (engineVersion ≥ 3): `values` is the flat
   *  25-number [f0, a1..a12, p1..p12] array (see GenParams.additive for
   *  units/layout). Rides the same genSet funnel both bridges marshal under
   *  the "additive" key. No-op below v3 — an engine-v2 dev client predates
   *  the mode, so callers feature-gate their UI on engineVersion() ≥ 3 and
   *  fall back to the sine-only behavior. */
  genSetAdditive(values: number[]): void {
    if (this.engineVersion() >= 3) native?.genSet({ additive: values });
  },
  genUnlockCap(): void {
    if (this.engineVersion() >= 2) native?.genUnlockCap();
  },
  genRelockCap(): void {
    if (this.engineVersion() >= 2) native?.genRelockCap();
  },
  genStatus(): GenStatus | null {
    return this.engineVersion() >= 2 ? native!.genStatus() : null;
  },

  // ---- Effects chain (engineVersion ≥ 6) ----
  /** Route one scalar param to an effect node (see FX ids/params below).
   *  No-op below v6 — labs feature-gate their audio on fxAvailable(). */
  fxSet(effectId: number, paramId: number, value: number): void {
    if (this.engineVersion() >= 6) native?.fxSet(effectId, paramId, value);
  },
  /** Disable every effect node (a lab's stop path — leaves nothing armed). */
  fxReset(): void {
    if (this.engineVersion() >= 6) native?.fxReset();
  },
  /** Live gain-reduction readout { comp, gate, limiter } in dB (≥0 = amount of
   *  reduction) — REAL measured values for the labs' GR meters. */
  fxGrStatus(): { comp: number; gate: number; limiter: number } | null {
    if (this.engineVersion() < 6) return null;
    const g = native!.fxGrStatus();
    return g && g.length >= 3 ? { comp: g[0], gate: g[1], limiter: g[2] } : null;
  },
  /** True when the native effects path exists in this build. */
  fxAvailable(): boolean {
    return this.engineVersion() >= 6;
  },

  // ---- Wave-2 expansion voices (engineVersion ≥ 7) ----
  /** True when the FM voice / binaural bus / modular voice exist in this
   *  build — labs feature-gate their audio on this and degrade honestly. */
  wave2Available(): boolean {
    return this.engineVersion() >= 7;
  },
  /** Start the binaural bus (shares the output graph with the generator). */
  binStart(): Promise<BinStatus> {
    if (this.engineVersion() < 7)
      return Promise.reject(new Error('binaural bus requires the v7 engine build'));
    return native!.binStart();
  },
  binStop(): Promise<void> {
    return this.engineVersion() >= 7 ? native!.binStop() : Promise.resolve();
  },
  /** Program source 0..2 — targets only, ramped native-side (drag-rate safe). */
  binSet(sourceIdx: number, params: BinSourceParams): void {
    if (this.engineVersion() >= 7) native?.binSet(sourceIdx, params);
  },
  binStatus(): BinStatus | null {
    return this.engineVersion() >= 7 ? native!.binStatus() : null;
  },
  /** Start the modular voice (shares the output graph with the generator). */
  modStart(): Promise<ModStatus> {
    if (this.engineVersion() < 7)
      return Promise.reject(new Error('modular voice requires the v7 engine build'));
    return native!.modStart();
  },
  modStop(): Promise<void> {
    return this.engineVersion() >= 7 ? native!.modStop() : Promise.resolve();
  },
  /** One scalar param (MOD_PARAM ids) — the fxSet idiom. */
  modSet(param: number, value: number): void {
    if (this.engineVersion() >= 7) native?.modSet(param, value);
  },
  modStatus(): ModStatus | null {
    return this.engineVersion() >= 7 ? native!.modStatus() : null;
  },
};

/** Effect node ids (must match apedsp::fx::Id — chain order is canonical). */
export const FX = {
  eq: 0,
  comp: 1,
  gate: 2,
  dist: 3,
  mod: 4, // chorus / flanger / phaser (param `mode`)
  delay: 5,
  reverb: 6,
  stereo: 7,
  limiter: 8,
} as const;

/** Per-effect param ids (param 0 of EVERY effect = enabled 0/1). Mirrors the
 *  setParam routing in Effects.hpp — keep in lockstep. */
export const FX_PARAM = {
  enabled: 0,
  // EQ band fields: 100 + band*10 + field
  eqBand: (band: number, field: 'type' | 'freq' | 'q' | 'gain') =>
    100 + band * 10 + { type: 0, freq: 1, q: 2, gain: 3 }[field],
  // Dynamics (comp/gate/limiter)
  thresholdDb: 1,
  ratio: 2,
  attackMs: 3,
  releaseMs: 4,
  makeupDb: 5,
  rangeDb: 6,
  holdMs: 7,
  ceilingDb: 8,
  // Distortion
  distType: 1, // 0 hard · 1 soft · 2 tube · 3 bitcrush · 4 decimate
  driveDb: 2,
  distMix: 3,
  oversample: 4,
  bits: 5,
  rateDiv: 6,
  outTrimDb: 7,
  // Mod (chorus/flanger/phaser)
  modMode: 1, // 0 chorus · 1 flanger · 2 phaser
  rateHz: 2,
  depth: 3,
  modFeedback: 4,
  modMix: 5,
  centerMs: 6,
  centerHz: 7,
  stages: 8,
  // Delay
  timeMs: 1,
  delayFeedback: 2,
  delayMix: 3,
  pingpong: 4,
  dampHz: 5,
  // Reverb
  rt60: 1,
  preDelayMs: 2,
  reverbDampHz: 3,
  reverbMix: 4,
  roomSize: 5,
  // Stereo
  widthPct: 1,
  pan: 2,
  monoFold: 3,
  invertR: 4,
  delayRms: 5,
  bassMonoHz: 6,
} as const;

/** EQ band type values (EqEffect::BandType). */
export const EQ_BAND_TYPES = {
  off: 0,
  peak: 1,
  lowShelf: 2,
  highShelf: 3,
  lowPass: 4,
  highPass: 5,
} as const;
