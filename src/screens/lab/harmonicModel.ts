/**
 * harmonicModel — the PURE editable 12-harmonic additive model behind the
 * Ear Lab's ANALYTIC harmonics view (HV-1 Build A). No React, no I/O, no
 * audio — every function here is deterministic math the view renders from.
 *
 * MODEL SHAPE: 12 harmonics (n = 1..12), each { amp, phaseDeg, enabled,
 * muted }. amp is a MAGNITUDE 0..1 relative to the fundamental-at-baseline
 * (= 1); sign lives in phaseDeg (sin(x + 180°) = −sin(x)), which keeps the
 * spectrum panels magnitude-only while synthesis honors the exact Fourier
 * signs of the canonical series (the corrected harmonicSign math that used
 * to live in HarmonicsView.tsx: triangle (-1)^((n-1)/2) on odds → 180° on
 * n = 3, 7, 11; saw (-1)^(n+1) → 180° on evens).
 *
 * PRESETS are SIMPLIFIED INSTRUCTIONAL MODELS (spec 2026-07-25 §3): the four
 * exact ideal series (sine/square/triangle/saw), an ideal 25 %-duty pulse,
 * and four hand-tuned distortion RECIPES (sym/asym clipping, soft
 * saturation, hard clipping) chosen to exhibit the taught tendency — they
 * are NOT measurements or reproductions of any real device, and the UI
 * labels them accordingly (measurement-tools §1.7 honesty).
 */

export const MODEL_HARMONICS = 12;

/** dB display/edit floor — matches the view's −60 dB analytic range. */
export const DBC_FLOOR_DB = -60;
/** Amplitude at the floor: anything at/below this counts as silent. */
export const AMP_FLOOR = 10 ** (DBC_FLOOR_DB / 20); // 0.001

export type Harmonic = {
  n: number; // 1..12 — LOCKED to integer multiples of f0 in HV-1
  amp: number; // 0..1 magnitude relative to fundamental baseline = 1
  phaseDeg: number; // 0..360
  enabled: boolean;
  muted: boolean;
};
export type HarmonicSet = Harmonic[];

// ---------------------------------------------------------------------------
// Canonical presets
// ---------------------------------------------------------------------------

export type PresetKey =
  | 'sine'
  | 'square'
  | 'triangle'
  | 'saw'
  | 'pulse'
  | 'symClip'
  | 'asymClip'
  | 'softSat'
  | 'hardClip';

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'sine', label: 'SINE' },
  { key: 'square', label: 'SQUARE' },
  { key: 'triangle', label: 'TRIANGLE' },
  { key: 'saw', label: 'SAW' },
  { key: 'pulse', label: 'PULSE' },
  { key: 'symClip', label: 'SYM CLIP' },
  { key: 'asymClip', label: 'ASYM CLIP' },
  { key: 'softSat', label: 'SOFT SAT' },
  { key: 'hardClip', label: 'HARD CLIP' },
];

/** Ideal rectangular-pulse duty cycle for the PULSE preset. d = 0.25 nulls
 *  every 4th harmonic (H4/H8/H12) — a visibly instructive comb. */
export const PULSE_DUTY = 0.25;

// Hand-tuned distortion recipes — SIMPLIFIED INSTRUCTIONAL MODELS, not device
// measurements. Index = n − 1; magnitudes re the fundamental = 1.
/** Symmetrical clipping tendency: strong ODD emphasis, no even orders. */
const SYM_CLIP_AMPS = [1, 0, 0.32, 0, 0.2, 0, 0.14, 0, 0.1, 0, 0.075, 0];
/** Asymmetrical clipping tendency: EVEN orders appear alongside the odds. */
const ASYM_CLIP_AMPS = [1, 0.28, 0.15, 0.095, 0.06, 0.042, 0.03, 0.022, 0.016, 0.012, 0.009, 0.007];
/** Soft saturation tendency: gentle LOW-ORDER odd + even, fast roll-off.
 *  H7 is 0, not the old 0.001: that value sat EXACTLY on AMP_FLOOR, which
 *  counts as silent — never ship a preset value on the silence boundary. */
const SOFT_SAT_AMPS = [1, 0.065, 0.035, 0.012, 0.006, 0.0025, 0, 0, 0, 0, 0, 0];
/** Hard clipping tendency: odd-only like square but with SLOWER roll-off
 *  (more high-order energy → harsher edge than symmetrical clipping). */
const HARD_CLIP_AMPS = [1, 0, 0.55, 0, 0.38, 0, 0.29, 0, 0.23, 0, 0.19, 0];

function presetAmp(key: PresetKey, n: number): number {
  switch (key) {
    case 'sine':
      return n === 1 ? 1 : 0;
    case 'square':
      return n % 2 === 1 ? 1 / n : 0; // exact ideal series
    case 'triangle':
      return n % 2 === 1 ? 1 / (n * n) : 0; // exact ideal series
    case 'saw':
      return 1 / n; // exact ideal series
    case 'pulse': {
      // Ideal rectangular pulse: |sin(nπd)| / (n·sin(πd)), normalized H1 = 1.
      const a = Math.abs(Math.sin(n * Math.PI * PULSE_DUTY)) / (n * Math.sin(Math.PI * PULSE_DUTY));
      return a < 1e-6 ? 0 : a; // snap the nulled orders to exactly 0
    }
    case 'symClip':
      return SYM_CLIP_AMPS[n - 1];
    case 'asymClip':
      return ASYM_CLIP_AMPS[n - 1];
    case 'softSat':
      return SOFT_SAT_AMPS[n - 1];
    case 'hardClip':
      return HARD_CLIP_AMPS[n - 1];
  }
}

/** Fourier phase of harmonic n for the canonical series, expressed in
 *  degrees (180° = the negative sign of the exact series; see header). The
 *  distortion recipes are magnitude-only teaching recipes → phase 0. */
function presetPhase(key: PresetKey, n: number): number {
  switch (key) {
    case 'triangle':
      // (-1)^((n-1)/2) on the odd terms — straight flanks, not a rounded blob.
      return n % 2 === 1 && ((n - 1) / 2) % 2 === 1 ? 180 : 0;
    case 'saw':
      // (-1)^(n+1) — the conventional ASCENDING ramp.
      return n % 2 === 0 ? 180 : 0;
    case 'pulse':
      // The ideal rectangular-pulse series is COSINE-based with coefficients
      // ∝ sin(nπd), which changes sign (at d = 0.25: negative on n = 5,6,7).
      // In this model's sine basis: sin(x + 90°) = cos x for the positive
      // coefficients, 270° for the negative ones (presetAmp takes |·|, so
      // the sign must live here or the drawn wave is not a pulse).
      return Math.sin(n * Math.PI * PULSE_DUTY) >= 0 ? 90 : 270;
    default:
      return 0;
  }
}

/** Build a fresh, fully-owned HarmonicSet for a canonical preset. */
export function buildPreset(key: PresetKey): HarmonicSet {
  return Array.from({ length: MODEL_HARMONICS }, (_, i) => ({
    n: i + 1,
    amp: presetAmp(key, i + 1),
    phaseDeg: presetPhase(key, i + 1),
    enabled: true,
    muted: false,
  }));
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** The amplitude a harmonic actually contributes (0 when disabled/muted). */
export const effectiveAmp = (h: Harmonic): number => (h.enabled && !h.muted ? h.amp : 0);

/** True when anything above the fundamental would sound — gates the "audio
 *  plays a pure sine" honesty note in the view. At/below AMP_FLOOR counts
 *  as silent (the one silence predicate, everywhere). */
export function hasOvertones(set: HarmonicSet): boolean {
  return set.some((h) => h.n >= 2 && effectiveAmp(h) > AMP_FLOOR);
}

/** Level in dB re MODEL FULL SCALE (amp 1.0), guarded at the −60 floor.
 *  NOT dBc: the fundamental is itself an editable stem, so a carrier-
 *  relative figure would drift from the stem geometry the moment H1 leaves
 *  0 dB. Carrier-relative ratios live in thd() (aₙ/a₁), and every UI label
 *  says "re full scale" accordingly. */
export function dbcOf(h: Harmonic): number {
  if (h.amp <= AMP_FLOOR) return DBC_FLOOR_DB;
  return Math.max(DBC_FLOOR_DB, 20 * Math.log10(h.amp));
}

/** Additive synthesis honoring amp, phaseDeg, enabled, and muted — the
 *  drawn model waveform. Returns `points` samples over `cycles` fundamental
 *  cycles, peak-normalized to ±1 (crest factor is scale-invariant, so
 *  crestFactorDb stays valid on the normalized output). */
export function synthWaveform(set: HarmonicSet, points: number, cycles: number): number[] {
  const pts = new Array<number>(points).fill(0);
  let peak = 0;
  for (let i = 0; i < points; i++) {
    const t = (i / (points - 1)) * cycles;
    let v = 0;
    for (const h of set) {
      const a = effectiveAmp(h);
      if (a <= AMP_FLOOR) continue; // at/below the floor counts as silent
      v += a * Math.sin(2 * Math.PI * h.n * t + (h.phaseDeg * Math.PI) / 180);
    }
    pts[i] = v;
    const m = Math.abs(v);
    if (m > peak) peak = m;
  }
  if (peak > 0) for (let i = 0; i < points; i++) pts[i] /= peak;
  return pts;
}

/** Flat additive-generator payload [f0, a1..a12, p1..p12] for
 *  ApeDsp.genSet({ additive }) / genSetAdditive (HV-2, engineVersion ≥ 3) —
 *  engine units: f0 in Hz, amps 0..1 relative, phases in degrees.
 *  Contribution uses effectiveAmp with the AMP_FLOOR silence predicate (the
 *  SAME qualifier as synthWaveform), so the audio matches the drawn wave;
 *  silent harmonics ride along as amp 0 because the native setter is
 *  all-or-nothing (always 25 numbers). Band-limiting is the engine's job —
 *  harmonics at/above Nyquist are omitted there, never aliased. */
export function additivePayload(set: HarmonicSet, f0: number): number[] {
  const flat = new Array<number>(1 + 2 * MODEL_HARMONICS).fill(0);
  flat[0] = f0;
  for (const h of set) {
    const a = effectiveAmp(h);
    if (a <= AMP_FLOOR) continue; // at/below the floor counts as silent
    flat[h.n] = a;
    flat[MODEL_HARMONICS + h.n] = h.phaseDeg;
  }
  return flat;
}

/** Crest factor (peak/RMS) of a waveform, in dB — the phase-lab readout:
 *  phase edits move THIS while the magnitude spectrum stays identical.
 *  Null for an empty/silent waveform (never fabricate a figure). */
export function crestFactorDb(waveform: readonly number[]): number | null {
  let peak = 0;
  let sumSq = 0;
  for (const v of waveform) {
    const m = Math.abs(v);
    if (m > peak) peak = m;
    sumSq += v * v;
  }
  if (waveform.length === 0 || peak <= 0 || sumSq <= 0) return null;
  return 20 * Math.log10(peak / Math.sqrt(sumSq / waveform.length));
}

export type ThdResult = {
  /** THD% = √(Σ aₙ², n≥2) / a₁ × 100 — null when the fundamental is silent
   *  (THD is undefined re nothing; never fabricated). */
  pct: number | null;
  /** THD dB = 20·log10(THD% / 100) — null when pct is null or 0. */
  db: number | null;
  /** Per-harmonic component (aₙ/a₁ × 100, the classic individual harmonic
   *  distortion figure) — empty when the fundamental is silent. */
  perHarmonic: { n: number; pct: number }[];
};

/** THD of the model. THD+N is deliberately ABSENT: the analytic model has
 *  no noise, so THD+N would be a fabrication — the UI must show
 *  "THD+N — live measurement required" instead (spec §2.I). */
export function thd(set: HarmonicSet): ThdResult {
  const h1 = set.find((h) => h.n === 1);
  const a1 = h1 ? effectiveAmp(h1) : 0;
  if (a1 <= AMP_FLOOR) return { pct: null, db: null, perHarmonic: [] };
  let sumSq = 0;
  const perHarmonic = set
    .filter((h) => h.n >= 2)
    .map((h) => {
      const raw = effectiveAmp(h);
      const a = raw <= AMP_FLOOR ? 0 : raw; // at/below the floor counts as silent
      sumSq += a * a;
      return { n: h.n, pct: (a / a1) * 100 };
    });
  const pct = (Math.sqrt(sumSq) / a1) * 100;
  return { pct, db: pct > 0 ? 20 * Math.log10(pct / 100) : null, perHarmonic };
}

/** Scale every harmonic so the LARGEST stored amplitude becomes exactly 1
 *  (the group-controls NORMALIZE action). Raw amps are used — muted/disabled
 *  stems keep their stored level and scale with the rest, so unmuting after
 *  a normalize is consistent. A silent set is returned unchanged (there is
 *  nothing honest to scale). */
export function normalizeSet(set: HarmonicSet): HarmonicSet {
  let max = 0;
  for (const h of set) if (h.amp > max) max = h.amp;
  if (max <= 0) return set.map((h) => ({ ...h }));
  return set.map((h) => ({ ...h, amp: Math.min(1, h.amp / max) }));
}

/** Least-squares slope of dB vs log2(n) over CONTRIBUTING harmonics —
 *  enabled, unmuted, above the floor (effectiveAmp, the same qualifier as
 *  every other analytic panel) — "harmonic energy decreases approximately
 *  N dB per octave". Null when fewer than two harmonics qualify (no honest
 *  fit exists). */
export function envelopeSlopeDbPerOct(set: HarmonicSet): number | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const h of set) {
    const a = effectiveAmp(h);
    if (a <= AMP_FLOOR) continue;
    xs.push(Math.log2(h.n));
    ys.push(20 * Math.log10(a));
  }
  if (xs.length < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den > 0 ? num / den : null;
}

// ---------------------------------------------------------------------------
// Note / frequency helpers (moved from HarmonicsView.tsx — single source,
// shared by the view's markers/piano gutter and the identity card).
// ---------------------------------------------------------------------------

/** Note math (A4 = 440 Hz): m = 69 + 12·log2(f/440); nearest note = round(m);
 *  cents = (m − round(m))·100; octave = floor(round(m)/12) − 1. */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const BLACK_PC = new Set([1, 3, 6, 8, 10]); // C# D# F# G# A#

export function noteInfo(hz: number): { midi: number; label: string; cents: number } {
  const m = 69 + 12 * Math.log2(hz / 440);
  const midi = Math.round(m);
  const cents = Math.round((m - midi) * 100);
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  return { midi, label: `${name}${Math.floor(midi / 12) - 1}`, cents };
}

export const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** Exact frequency of harmonic n over fundamental f0 (locked integer ratio). */
export const harmonicHz = (n: number, f0: number) => n * f0;

/** Period in milliseconds. */
export const periodMs = (hz: number) => 1000 / hz;
