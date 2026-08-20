/**
 * apeDspSim — DEV + WEB ONLY synthetic engine frames.
 *
 * There is no native audio engine on web, so the live measurement tools can
 * normally only show their honest "not in this build" gate. This module feeds
 * ANIMATED fake frames through the SAME real screens (via Object.assign onto the
 * ApeDsp singleton in index.ts, gated on __DEV__ && web) so the tool UIs can be
 * seen and iterated in the browser — the whole-tool analogue of the
 * #gaugepreview harness. NEVER bundled on device; nothing here touches native.
 *
 * The data is deliberately musical-looking, not physically exact: a moving
 * formant on the spectrum, a wandering pitch, a breathing waveform — enough to
 * exercise every panel (levels, 31-band, spectrogram, scope, tuner) so layout
 * and styling read true. `Date.now()` drives the animation (web/app code — the
 * no-Date rule is workflow-scripts only).
 */
import type {
  BandsFrame,
  DspInfo,
  EngineConfig,
  MeterFrame,
  PitchFrame,
  SpectrumMeta,
  WaveBucket,
} from './index';

// IEC 1/3-octave nominal centres, 20 Hz–20 kHz (31 bands).
const THIRD_OCT = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
  2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000,
];
const N_BANDS = THIRD_OCT.length;
const SR = 48000;
const FFT = 8192;
const BINS = FFT / 2;

let seq = 0;
const nextSeq = () => (seq = (seq + 1) % 1_000_000_000);

function meter(): MeterFrame {
  const t = Date.now() / 1000;
  const a = -26 + 9 * Math.sin(t * 0.6) + 3 * Math.sin(t * 2.7);
  const peak = Math.min(-1, a + 9 + 2 * Math.abs(Math.sin(t * 3.3)));
  return {
    version: 2,
    sequence: nextSeq(),
    settingsEpoch: 1,
    zFastDb: a + 3,
    zSlowDb: a + 2.5,
    aFastDb: a,
    aSlowDb: a - 0.5,
    cFastDb: a + 4,
    cSlowDb: a + 3.5,
    peakDb: peak,
    peakHoldDb: -4,
    clipRuns: 0,
    leqZDb: a + 1.5,
    leqADb: a + 0.5,
    elapsedSec: t % 3600,
    droppedFrames: 0,
    running: true,
    captureStalled: false,
    processedInput: false,
    bluetoothInput: false,
    interrupted: false,
  };
}

function bands(): BandsFrame {
  const t = Date.now() / 1000;
  const peakIdx = 12 + 7 * Math.sin(t * 0.4); // slowly sweeping formant
  const levelsDb: number[] = [];
  const peakHoldDb: number[] = [];
  const resolvable: boolean[] = [];
  for (let i = 0; i < N_BANDS; i++) {
    const tilt = -34 - i * 0.9; // pink-ish downward tilt
    const bump = 22 * Math.exp(-((i - peakIdx) ** 2) / 10);
    const wobble = 2.5 * Math.sin(t * 4 + i * 0.7);
    const lv = Math.max(-90, tilt + bump + wobble);
    levelsDb.push(lv);
    peakHoldDb.push(lv + 4);
    resolvable.push(true);
  }
  return { sequence: nextSeq(), fraction: 3, fftSize: FFT, sampleRate: SR, centers: THIRD_OCT, levelsDb, peakHoldDb, resolvable };
}

function pitch(): PitchFrame {
  const t = Date.now() / 1000;
  const semis = Math.round(4 * Math.sin(t * 0.3));
  const freq = 220 * Math.pow(2, semis / 12 + 0.02 * Math.sin(t * 1.5));
  return { sequence: nextSeq(), freq, confidence: 0.92, voiced: true, levelDb: -18 };
}

function spectrumMeta(): SpectrumMeta {
  return { sequence: nextSeq(), fftSize: FFT, sampleRate: SR, bins: BINS };
}

function spectrum(): Float32Array {
  const t = Date.now() / 1000;
  const out = new Float32Array(BINS);
  const peakBin = BINS * (0.045 + 0.02 * Math.sin(t * 0.5));
  const width = peakBin * 0.5 + 6;
  for (let b = 1; b < BINS; b++) {
    const tilt = -30 - Math.log2(b) * 3.2;
    const bump = 26 * Math.exp(-((b - peakBin) ** 2) / (2 * width * width));
    const noise = 4 * Math.sin(t * 6 + b * 0.05);
    out[b] = Math.max(-100, tilt + bump + noise);
  }
  out[0] = -100;
  return out;
}

function waveform(maxBuckets = 1200): WaveBucket[] {
  const t = Date.now() / 1000;
  const n = Math.min(maxBuckets, 240);
  const f = 2 + 1.5 * Math.sin(t * 0.5);
  const amp = 0.4 + 0.3 * Math.sin(t * 0.7);
  const out: WaveBucket[] = [];
  for (let i = 0; i < n; i++) {
    const ph = (i / n) * Math.PI * 2 * f + t * 6;
    const s = amp * Math.sin(ph);
    const env = 0.04 + 0.02 * Math.abs(Math.sin(ph * 3));
    out.push({ min: s - env, max: s + env, rms: Math.abs(s) * 0.7, clipped: false });
  }
  return out;
}

const INFO: DspInfo = {
  engineVersion: 2,
  sampleRate: SR,
  ioBufferDuration: 256 / SR,
  measurementMode: true,
  bluetoothInput: false,
  routeName: 'Built-in Microphone (SIM)',
  inputPortType: 'MicrophoneBuiltIn',
  running: true,
  lastError: '',
  outputRoute: 'Speaker',
  stopReason: '',
  events: [],
  genRenderPulls: 0,
};

/** The subset of ApeDsp the live tools read — overridden onto the singleton.
 *  Because the sim reports engineVersion 2, methods NOT overridden here would
 *  hit `native!.x()` and throw on web (native is null) — so the generator /
 *  rt60 / legacy read methods are stubbed too (e.g. the exposure monitor polls
 *  genStatus globally). Anything genuinely unused stays a harmless no-op. */
export function makeApeDspSim() {
  return {
    isAvailable: () => true,
    engineVersion: () => 2,
    start: () => Promise.resolve(INFO),
    stop: () => Promise.resolve(),
    getInfo: () => INFO,
    setEngineConfig: (_cfg: EngineConfig) => {},
    resetPeakHold: () => {},
    resetLeq: () => {},
    getMeterFrame: meter,
    getBandsFrame: bands,
    getPitchFrame: pitch,
    getSpectrumMeta: spectrumMeta,
    getSpectrum: spectrum,
    getWaveform: waveform,
    // Generator / rt60 / legacy — safe stubs so global pollers don't crash.
    getFrame: () => ({ ...meter(), rmsDb: meter().zFastDb }),
    genStatus: () => ({ running: false, capUnlocked: false, effectiveLevelDb: -20, defaultLevelDb: -20, capDb: -12 }),
    genStart: () => Promise.resolve({ running: true, capUnlocked: false, effectiveLevelDb: -20, defaultLevelDb: -20, capDb: -12 }),
    genStop: () => Promise.resolve(),
    genSet: () => {},
    genUnlockCap: () => {},
    genRelockCap: () => {},
    rt60Arm: () => {},
    rt60Cancel: () => {},
  };
}
