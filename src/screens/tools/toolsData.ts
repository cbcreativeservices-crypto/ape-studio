/**
 * Measurement & Analysis tools — catalog + educational copy (Booth 2026-07-09v).
 * Content distilled from AUDIO_MEASUREMENT_TOOLS_RESEARCH_2026_07_09_v1.md
 * (functional spec §2–§6). MVP = hub + info screens ONLY: the live measurement
 * engine is a native DSP module (Spike 0 in the companion tech report) that
 * needs its own ruling + a new EAS dev build — no fake meters in the meantime
 * (spec §1.7: no decorative elements that resemble meters).
 */
import type { GlassTint } from '../../components/GlassButton';

/**
 * DESIGN NOTE — tool depth (Booth 2026-07-18): the glossary goes deep into the
 * details of sounds, tools and measurement, so every tool we build here should
 * go equally deep — and, wherever possible, SHOW and DEMONSTRATE the glossary
 * terms it embodies (e.g. the RTA demonstrating octave banding/averaging/
 * windowing; the tuner demonstrating pitch, cents, temperament, beat frequency).
 * When designing a tool, sweep the glossary for its related terms and treat
 * "can this tool demonstrate that term?" as part of the spec.
 */
export type ToolKey =
  | 'spl'
  | 'rta'
  | 'waveform'
  | 'spectrogram'
  | 'rt60'
  | 'signalgen'
  | 'tuner'
  | 'hzcounter';

export type ToolDef = {
  key: ToolKey;
  num: number;
  name: string;
  subtitle?: string;
  tint: GlassTint;
  /** One-paragraph plain-English purpose (functional spec §x.1). */
  purpose: string;
  /** "What it measures" bullets (§x.2). */
  measures: string[];
  /** "What it does NOT measure" bullets (§x.2) — integrity-first, per spec. */
  notMeasures: string[];
  /** Placeholder tool — catalogued + info screen live, engine not yet specced. */
  planned?: boolean;
};

export const TOOLS: ToolDef[] = [
  {
    key: 'spl',
    num: 1,
    name: 'SPL Reference Meter',
    subtitle: 'Peak / RMS Meter',
    tint: 'orange',
    purpose:
      'Approximate acoustic sound-pressure level (dB SPL) for room, monitor and live-sound level checks — alongside digital peak/RMS metering (dBFS), so the difference between acoustic level and digital level becomes second nature.',
    measures: [
      'Approximate sound pressure at the microphone position (dB SPL, A/C/Z weighting, Fast/Slow)',
      'Digital peak level of the captured stream (dBFS, with peak-hold)',
      'Digital RMS level over a defined window (dBFS)',
    ],
    notMeasures: [
      'Loudness in LUFS',
      'Certified / legal sound levels (this is not an IEC 61672 Class 1/2 instrument)',
      'Levels at positions other than the microphone',
      'Frequency content (that is the RTA)',
      'Hearing damage — it informs, it does not diagnose',
    ],
  },
  {
    key: 'rta',
    num: 2,
    name: 'Spectrum Analyzer / RTA',
    tint: 'blue',
    purpose:
      'Shows how signal energy is distributed across frequency in real time — connect what you hear to where it lives spectrally: ringing identification, tonal-balance study, noise hunting, EQ regions. A seeing tool, not a judging tool.',
    measures: [
      'Short-term energy vs frequency (windowed FFT on a log-frequency axis)',
      'Fractional-octave RTA bands (1/1 and 1/3 octave — pink noise reads flat)',
      'Peak-hold per band/bin',
    ],
    notMeasures: [
      'Mix quality',
      "The room's true transfer function (a single-mic RTA conflates source, room and position)",
      'Phase or time-of-arrival',
      'Loudness',
      'How to EQ a room — it cannot tell you that by itself',
    ],
  },
  {
    key: 'waveform',
    num: 3,
    name: 'Waveform Viewer',
    tint: 'teal',
    purpose:
      'Amplitude versus time — the time-domain shape of audio. Read transients, dynamics, silence, clipping, symmetry and stereo relationships, and learn what a waveform can and cannot tell you.',
    measures: [
      'Amplitude vs time (min/max peak envelope with RMS energy band)',
      'Peak levels in dBFS over any selection',
      'Clipped-sample runs, marked on the timeline',
      'Channel symmetry / L-R differences',
    ],
    notMeasures: [
      'Perceived loudness — waveform height is not LUFS and not SPL',
      'Frequency content (a dense waveform could be bass or noise)',
      'Phase relationships beyond gross L/R visual comparison',
    ],
  },
  {
    key: 'spectrogram',
    num: 4,
    name: 'Spectrogram',
    tint: 'purple',
    purpose:
      'Frequency content over time — a moving picture of the spectrum. See melody vs harmonics, sibilance, hum, noise floors, transients vs sustains — and the fundamental trade-off between time resolution and frequency resolution.',
    measures: [
      'Time–frequency energy distribution (STFT: time → horizontal, frequency → vertical, color = dB)',
      'When each frequency happened — which neither the RTA nor the waveform can show',
    ],
    notMeasures: [
      'Musical importance — visible is not audible is not important',
      'Exact levels (reading color is only precise to a few dB)',
      'Phase or loudness',
      'Anything below the selected display floor',
    ],
  },
  {
    key: 'rt60',
    num: 5,
    name: 'RT60 / Reverb Decay',
    tint: 'green',
    purpose:
      'Estimates how long sound takes to decay in a room (reverberation time) — and teaches the measurement discipline around it: why RT60 is frequency-dependent, why noise floors limit what you can measure, and how professionals qualify a measurement before trusting it.',
    measures: [
      'Room decay time per octave band (125 Hz–4 kHz), from the Schroeder decay curve',
      'T20/T30 line fits extrapolated to RT60 — always labeled with the method used',
      'Per-band confidence from fit quality and available signal-to-noise',
    ],
    notMeasures: [
      '"Room quality" as a single number',
      'Frequency response',
      'Echoes / flutter as such',
      'Absorption coefficients',
      "An instrument's own decay — a piano note dying away is not RT60",
    ],
  },
  {
    key: 'signalgen',
    num: 6,
    name: 'Tone / Noise Generator',
    subtitle: 'Test-Signal Source',
    tint: 'gold',
    purpose:
      'Produces reference test signals — sine tones, sweeps, and pink/white noise — for checking systems, exciting rooms alongside the RTA, finding resonances, and ear training. A signal SOURCE, not a measurement tool.',
    measures: [
      'Sine tones at a chosen frequency and level',
      'Pink and white noise (pink reads flat on the RTA)',
      'Frequency sweeps for resonance and response checks',
    ],
    notMeasures: [
      'Anything — it is a signal SOURCE, not a meter',
      'Your system’s response (pair it with the RTA or SPL meter for that)',
    ],
  },
  {
    key: 'tuner',
    num: 7,
    name: 'Tuner',
    subtitle: 'Pitch / Instrument Tuner',
    tint: 'steel',
    planned: true, // PLACEHOLDER (Booth 2026-07-18) — engine + full spec to come.
    purpose:
      'Detects the pitch of a sustained note and shows how far it sits from the nearest note in the chosen reference — for tuning instruments and training the ear. Like every tool here, it should go deep: pitch vs frequency, cents, A4 reference standards, temperament, and beat frequency are all glossary terms this tool can demonstrate directly.',
    measures: [
      'Fundamental frequency of a sustained, mostly-monophonic note (Hz)',
      'Deviation from the nearest equal-temperament note in cents, against a selectable A4 reference (e.g. 440/442 Hz)',
      'Note name and octave of the detected pitch',
    ],
    notMeasures: [
      'Chords or dense polyphonic material (single dominant pitch only)',
      'Intonation quality across a whole performance',
      'Loudness or level — pitch only',
      'Timbre — two instruments on the same note read identically',
    ],
  },
];

// Frequency Counter (user request 2026-07-18). Unlike the other tools it has a
// mode that needs NO native engine — the TAP mode measures the rate of a
// tapped event purely from timing, so it ships live now; the Sound (mic) and
// Light-Pulse (camera) modes still need the measurement engine. Its own screen
// (FrequencyCounterScreen) renders the modes + results, so this catalog entry
// exists mainly for the hub tile and the shared honesty copy.
TOOLS.push({
  key: 'hzcounter',
  num: 8,
  name: 'Frequency Counter',
  subtitle: 'Hz Counter',
  tint: 'teal',
  purpose:
    'Estimates how often something repeats — a steady sound, a flickering light, or an event you tap along with — and shows it as frequency (Hz), period, and tempo (BPM). One tool, three views of the same idea: frequency, period, and beats per minute.',
  measures: [
    'Frequency in hertz (Hz) of a steady, repeating sound, light, or tapped event',
    'Cycles or events per second, and the period in milliseconds',
    'Beats per minute (BPM) when the rate is musical',
    'Measurement stability, with the minimum and maximum readings',
  ],
  notMeasures: [
    'Calibrated, laboratory-grade frequency — readings are estimates',
    'Several simultaneous frequencies at once (it tracks one dominant rate)',
    'Musical pitch and note name (that is the Tuner)',
    'Loudness, level, or spectral content',
  ],
});

export const toolByKey = (key: ToolKey): ToolDef => TOOLS.find((t) => t.key === key)!;

/** Shared phone-mic honesty copy (functional spec §1.4) — shown on every tool. */
export const MIC_LIMITS = [
  'Built-in phone mics are usably flat only ~100 Hz–8 kHz; response rolls off below and gets irregular above ~10 kHz',
  'Usable window is roughly ~30–35 dB SPL (self-noise) up to ~100–120 dB SPL (overload)',
  'Two phones of the same model can differ by several dB',
  'A case or a finger over the mic port silently ruins measurements',
  'Uncalibrated readings are always APPROXIMATE and labeled so',
];

/** Status note (tech report §0/§2.3): the engine is a native module, not yet built. */
export const ENGINE_NOTE =
  'The live measurement engine is a native audio module (real-time capture + DSP) currently in development. It requires a new app build to ship — no simulated readings are shown in the meantime, because a meter that looks live but isn’t would violate the measurement-integrity rules this module is built on.';
