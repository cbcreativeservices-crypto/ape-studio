/**
 * deEsserModel — the pure, testable model behind the De-Esser & Sibilance
 * Control Lab (owner brief 2026-09-02, V1 of the Smart Processors family).
 * No audio. A short spoken phrase is modelled as a sequence of FRAMES, each
 * with a low/mid "voice" energy and a high "hiss" energy; the de-esser's
 * detector, threshold, frequency band, range and mode act on those frames so
 * every display in the lab is computed, not drawn by hand.
 */

export type Frame = {
  label: string;
  /** Voiced / body energy 0..1 (what a broadband cut would damage). */
  body: number;
  /** Sibilant (hiss) energy 0..1 in the 2–10 kHz region. */
  hiss: number;
  /** Where that hiss sits, Hz (S higher than SH). */
  hissHz: number;
  sibilant: boolean;
};

/** "This is a sentence with essess." — enough S's to make the point. */
export const PHRASE: Frame[] = [
  { label: 'th', body: 0.35, hiss: 0.15, hissHz: 5000, sibilant: false },
  { label: 'i', body: 0.85, hiss: 0.08, hissHz: 5000, sibilant: false },
  { label: 's', body: 0.12, hiss: 0.95, hissHz: 6500, sibilant: true },
  { label: '·', body: 0.02, hiss: 0.02, hissHz: 5000, sibilant: false },
  { label: 'i', body: 0.8, hiss: 0.08, hissHz: 5000, sibilant: false },
  { label: 'z', body: 0.4, hiss: 0.75, hissHz: 6000, sibilant: true },
  { label: '·', body: 0.02, hiss: 0.02, hissHz: 5000, sibilant: false },
  { label: 'a', body: 0.9, hiss: 0.06, hissHz: 5000, sibilant: false },
  { label: 'sh', body: 0.15, hiss: 0.8, hissHz: 4000, sibilant: true },
  { label: 'ar', body: 0.75, hiss: 0.07, hissHz: 5000, sibilant: false },
  { label: 'p', body: 0.2, hiss: 0.25, hissHz: 3000, sibilant: false },
  { label: 's', body: 0.1, hiss: 1.0, hissHz: 7000, sibilant: true },
  { label: 'o', body: 0.85, hiss: 0.05, hissHz: 5000, sibilant: false },
  { label: 'und', body: 0.6, hiss: 0.1, hissHz: 5000, sibilant: false },
  { label: 's', body: 0.1, hiss: 0.9, hissHz: 6800, sibilant: true },
];

export type Mode = 'broadband' | 'split';

export type Settings = {
  /** Detector centre frequency, Hz (2 000–10 000). */
  freqHz: number;
  /** Detector band width as a Q-like factor: higher = narrower. */
  q: number;
  /** Level above which reduction starts, dB relative to full-scale hiss (−40..0). */
  thresholdDb: number;
  /** Maximum gain reduction allowed, dB (0..24). */
  rangeDb: number;
  /** How much of the excess is removed: 1 − 1/ratio. */
  ratio: number;
  mode: Mode;
};

/** Threshold −10 dB: on the modelled phrase every sibilant crosses, nothing
 *  else does, and the mean reduction lands in the "Controlled" stage — so
 *  the lab's own defaults are a setting it would call correct. (−14 landed
 *  in "Noticeable" by its own scale.) */
export const DEFAULTS: Settings = { freqHz: 6500, q: 1.4, thresholdDb: -10, rangeDb: 12, ratio: 4, mode: 'split' };

export const FREQ_MIN = 2000;
export const FREQ_MAX = 10000;

export const toDb = (x: number) => 20 * Math.log10(Math.max(1e-6, x));
export const fromDb = (db: number) => Math.pow(10, db / 20);

/** Band-pass magnitude (0..1) of the detector at frequency f — a simple
 *  second-order resonance; peak 1 at fc. */
export function bandpassGain(f: number, fc: number, q: number): number {
  const w = f / fc;
  return 1 / Math.sqrt(1 + Math.pow(q * (w - 1 / w), 2));
}

/** How much of a frame's hiss the detector sees, given where the hiss sits. */
export function detectorLevel(frame: Frame, s: Settings): number {
  return frame.hiss * bandpassGain(frame.hissHz, s.freqHz, s.q);
}

export function detectorDb(frame: Frame, s: Settings): number {
  return toDb(detectorLevel(frame, s));
}

/** Gain reduction (positive dB) the gain computer asks for on this frame. */
export function gainReductionDb(frame: Frame, s: Settings): number {
  const over = detectorDb(frame, s) - s.thresholdDb;
  if (over <= 0) return 0;
  return Math.min(s.rangeDb, over * (1 - 1 / s.ratio));
}

export type Processed = {
  frame: Frame;
  detectorDb: number;
  grDb: number;
  outBody: number;
  outHiss: number;
};

export function processFrame(frame: Frame, s: Settings): Processed {
  const gr = gainReductionDb(frame, s);
  const g = fromDb(-gr);
  return {
    frame,
    detectorDb: detectorDb(frame, s),
    grDb: gr,
    outBody: s.mode === 'broadband' ? frame.body * g : frame.body,
    outHiss: frame.hiss * g,
  };
}

export function processPhrase(frames: Frame[], s: Settings): Processed[] {
  return frames.map((f) => processFrame(f, s));
}

/* ── EQ vs de-esser ────────────────────────────────────────────────────── */

/** A static EQ cut of `cutDb` in the hiss band, applied to every frame. */
export function eqCut(frames: Frame[], cutDb: number): { outBody: number; outHiss: number }[] {
  const g = fromDb(-cutDb);
  return frames.map((f) => ({ outBody: f.body, outHiss: f.hiss * g }));
}

/** Mean hiss loss (dB) on the NON-sibilant frames — i.e. the brightness the
 *  vowels lose. A good de-esser leaves this near zero; a static EQ cannot. */
export function vowelBrightnessLossDb(frames: Frame[], out: { outHiss: number }[]): number {
  let sum = 0, n = 0;
  frames.forEach((f, i) => { if (!f.sibilant && f.hiss > 0.04) { sum += toDb(f.hiss) - toDb(out[i].outHiss); n++; } });
  return n ? sum / n : 0;
}

/** Mean gain reduction on the sibilant frames. */
export function meanSibilantGr(processed: Processed[]): number {
  const sib = processed.filter((p) => p.frame.sibilant);
  return sib.length ? sib.reduce((a, p) => a + p.grDb, 0) / sib.length : 0;
}

/* ── over-de-essing ────────────────────────────────────────────────────── */

export type OverStage = { id: string; name: string; maxGrDb: number; symptoms: string };

export const OVER_STAGES: OverStage[] = [
  { id: 'off', name: 'Not working yet', maxGrDb: 0.5, symptoms: 'Nothing is being reduced — the threshold is above every S.' },
  { id: 'transparent', name: 'Transparent', maxGrDb: 4, symptoms: 'The S’s lose their edge and nothing else changes. Most listeners could not tell it is on.' },
  { id: 'controlled', name: 'Controlled', maxGrDb: 7, symptoms: 'S’s clearly softened. Fine for a bright voice or a bright microphone.' },
  { id: 'noticeable', name: 'Noticeable', maxGrDb: 10, symptoms: 'Consonants start to blur; “s” begins to sound like “th”. Sibilants pump in and out.' },
  { id: 'lisp', name: 'Lisping', maxGrDb: 14, symptoms: 'The talker sounds like they have a lisp. Words with S’s lose their definition and intelligibility drops.' },
  { id: 'dull', name: 'Dull and lifeless', maxGrDb: Infinity, symptoms: 'Every S is a hole. In broadband mode the whole voice ducks on each one — the sound breathes and goes dark.' },
];

export function overStage(meanGrDb: number): OverStage {
  return OVER_STAGES.find((s) => meanGrDb <= s.maxGrDb) ?? OVER_STAGES[OVER_STAGES.length - 1];
}

/** How far the over-de-essing page's single control lowers the threshold at
 *  100 %. Chosen so the slider walks the WHOLE progression in order with the
 *  stages spread along its travel (a 40 dB span put "dull" across the top
 *  half of the slider). */
export const OVER_THRESHOLD_SPAN_DB = 24;

/** The over-de-essing page's rack: `amount` 0..1 lowers the threshold from
 *  0 to −OVER_THRESHOLD_SPAN_DB with the range wide open, so the only thing
 *  changing is how hard the de-esser is being pushed. */
export function overSettings(amount: number, mode: Mode): Settings {
  const a = Math.max(0, Math.min(1, amount));
  const depth = a * OVER_THRESHOLD_SPAN_DB;
  return { ...DEFAULTS, thresholdDb: depth === 0 ? 0 : -depth, rangeDb: 24, mode };
}

/* ── frequency hints ───────────────────────────────────────────────────── */

export type FreqHint = { id: string; name: string; hz: number; note: string };

export const FREQ_HINTS: FreqHint[] = [
  { id: 'low-male', name: 'Deep male voice', hz: 4500, note: 'Larger mouth, lower hiss — start around 4–5 kHz.' },
  { id: 'male', name: 'Typical male voice', hz: 5500, note: 'Usually 5–6.5 kHz.' },
  { id: 'female', name: 'Typical female voice', hz: 7000, note: 'Usually 6–8 kHz; sometimes higher.' },
  { id: 'sh', name: '"SH" rather than "S"', hz: 4000, note: 'SH sits lower, near 3–5 kHz — a de-esser tuned for S may miss it.' },
  { id: 'bright', name: 'Bright condenser mic', hz: 8000, note: 'The mic’s presence peak adds hiss high up; try 7–9 kHz.' },
];

/* ── the detection path (for the block diagram) ────────────────────────── */

export type Block = { id: string; name: string; what: string };

export const PATH_MAIN: Block[] = [
  { id: 'in', name: 'Input', what: 'The whole voice arrives.' },
  { id: 'gain', name: 'Gain element', what: 'Turns the level down by whatever the gain computer asks for — on the whole signal (broadband) or on the hiss band only (split-band).' },
  { id: 'out', name: 'Output', what: 'The voice with its S’s under control.' },
];

export const PATH_SIDECHAIN: Block[] = [
  { id: 'bpf', name: 'Band-pass filter', what: 'A copy of the input, filtered so only the hiss region remains. The de-esser listens here, not to the whole voice.' },
  { id: 'det', name: 'Level detector', what: 'Measures how loud the filtered copy is, moment to moment.' },
  { id: 'thr', name: 'Threshold compare', what: 'Is the hiss level above the threshold? If not, do nothing.' },
  // NEW COPY (review 2026-09-02): names the ratio, which the model has but the copy never mentioned.
  { id: 'gc', name: 'Gain computer', what: 'Turns the amount above threshold into a gain reduction: the ratio sets what fraction of the excess is removed, and the range caps how far the gain may fall.' },
];

/** The signal-chain screens that the connections card points at (route names
 *  are RootStackParamList keys; the screen casts them). */
// NEW COPY (review 2026-09-02): each line now says what to DO there and which
// page of this lab it extends, so the card is a study plan rather than a list.
export const CONNECTIONS: { name: string; why: string; route: string }[] = [
  { name: 'EQ Lab', why: 'Build the static cut from page 2 as a real EQ band and hear why it is always on.', route: 'EqLabHome' },
  { name: 'Compression', why: 'The same detector → threshold → gain computer, listening to the whole signal instead of a filtered copy.', route: 'CompressionLab' },
  { name: 'Gate / Expander', why: 'The same threshold, used the other way round: opening on signal instead of ducking on hiss.', route: 'GateLab' },
  { name: 'Visual Audio Analysis', why: 'Watch the hiss band on a live spectrum before you pick the detector frequency (page 5).', route: 'MeterLab' },
  { name: 'Speech & Voice Lab', why: 'Where the S is made — teeth, air and turbulence — and why some voices hiss more than others.', route: 'SpeechLab' },
];

/* ── a hiss spectrum for the frequency page ────────────────────────────── */

/** The spectrum (0..1) of a single S frame with the detector's band-pass
 *  overlaid, on `n` log-spaced bands from 100 Hz to 16 kHz. */
export function sFrameSpectrum(frame: Frame, n = 48): { hz: Float64Array; mag: Float64Array } {
  const hz = new Float64Array(n);
  const mag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const f = 100 * Math.pow(160, (i + 0.5) / n);
    hz[i] = f;
    const body = frame.body * (1 / (1 + Math.pow(90 / f, 2))) / Math.sqrt(1 + Math.pow(f / 900, 2));
    const hiss = frame.hiss * Math.exp(-Math.pow((Math.log(f) - Math.log(frame.hissHz)) / 0.32, 2));
    mag[i] = Math.max(body, hiss);
  }
  return { hz, mag };
}

export function detectorCurve(s: Settings, n = 48): { hz: Float64Array; mag: Float64Array } {
  const hz = new Float64Array(n);
  const mag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const f = 100 * Math.pow(160, (i + 0.5) / n);
    hz[i] = f;
    mag[i] = bandpassGain(f, s.freqHz, s.q);
  }
  return { hz, mag };
}
