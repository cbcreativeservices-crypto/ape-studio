/**
 * speechModel — the pure, testable content and numbers behind the Speech &
 * Voice Lab ("How Human Speech Works", owner brief 2026-09-02). No audio, no
 * React. Every number here is a TYPICAL teaching value (adult voices vary
 * widely) and the screens say so; nothing is presented as a measurement.
 *
 * Sources for the typical values: classic vowel-formant averages (Peterson &
 * Barney style adult-male means), standard speaking-f0 ranges, and the usual
 * inverse-square / proximity-effect rules of thumb. All copy is NEW — owner
 * review queue.
 */

/* ── 1. anatomy ─────────────────────────────────────────────────────────── */

export type AnatomyPart = {
  id: string;
  name: string;
  role: string;
  /** Position of the tap target / label inside the 300×320 cross-section. */
  x: number;
  y: number;
};

export const ANATOMY: AnatomyPart[] = [
  { id: 'lungs', name: 'Lungs & diaphragm', role: 'The power supply. The diaphragm pushes air up out of the lungs — no airflow, no voice.', x: 150, y: 300 },
  { id: 'trachea', name: 'Trachea (windpipe)', role: 'The air pipe from the lungs up to the larynx.', x: 150, y: 262 },
  { id: 'larynx', name: 'Larynx & vocal folds', role: 'The sound source. Two folds of tissue that air blows apart and suction pulls together, hundreds of times a second — the buzz that becomes voice.', x: 150, y: 222 },
  { id: 'pharynx', name: 'Pharynx (throat)', role: 'The first resonating chamber above the folds. Its length and width shape the buzz.', x: 172, y: 170 },
  { id: 'velum', name: 'Soft palate (velum)', role: 'A movable flap. Raised, it seals the nose off; lowered, air flows through the nose — that is what makes M, N and NG nasal.', x: 150, y: 110 },
  { id: 'nasal', name: 'Nasal cavity', role: 'A second resonator, used only when the soft palate lets air in. Too much of it and the voice sounds "nasal".', x: 128, y: 62 },
  { id: 'palate', name: 'Hard palate', role: 'The roof of the mouth. The tongue presses or nearly presses against it for T, D, S, SH and Y.', x: 105, y: 96 },
  { id: 'tongue', name: 'Tongue', role: 'The main articulator. Its height and front-back position set the vowel; its tip and body make most consonants.', x: 118, y: 150 },
  { id: 'teeth', name: 'Teeth', role: 'The edge that air is forced past for S, Z, F and V — the source of sibilance.', x: 62, y: 118 },
  { id: 'lips', name: 'Lips', role: 'Round for O and U, spread for E; close and burst apart for P and B — the source of plosive pops.', x: 44, y: 140 },
  { id: 'jaw', name: 'Jaw', role: 'Opens to enlarge the mouth cavity — open vowels like AH need it low.', x: 92, y: 200 },
];

/* ── 2. production sequence ─────────────────────────────────────────────── */

export type Stage = { id: string; name: string; what: string; see: string };

export const PRODUCTION: Stage[] = [
  { id: 'breath', name: 'Breath', what: 'The diaphragm and rib muscles push air up from the lungs. Airflow is the energy for everything that follows.', see: 'Steady air pressure below the larynx.' },
  { id: 'phonation', name: 'Vocal folds', what: 'For voiced sounds the folds are brought together; the air pressure blows them apart, the gap closes again, and the cycle repeats — a buzz rich in harmonics.', see: 'A pulse train: the buzz has a fundamental (the pitch) and many harmonics above it.' },
  { id: 'resonance', name: 'Resonance', what: 'The throat, mouth and (sometimes) nose act as tuned cavities that boost some harmonics and swallow others. Those boosted regions are the formants.', see: 'The flat harmonic comb becomes a shape with peaks — the vowel is born here.' },
  { id: 'articulation', name: 'Articulation', what: 'Tongue, lips, teeth, jaw and soft palate move to shape vowels and interrupt the air for consonants.', see: 'Fast changes: bursts, hisses, nasal hums, glides between shapes.' },
  { id: 'speech', name: 'Speech', what: 'Sequences of these shapes, tens of milliseconds each, strung into syllables and words.', see: 'A stream of alternating transients (consonants) and sustained tones (vowels).' },
];

/* ── 3. voiced vs unvoiced ─────────────────────────────────────────────── */

export type ConsonantPair = { unvoiced: string; voiced: string; place: string; example: [string, string] };

/** Same mouth shape, folds off vs on. */
export const VOICED_PAIRS: ConsonantPair[] = [
  { unvoiced: 'P', voiced: 'B', place: 'lips', example: ['pat', 'bat'] },
  { unvoiced: 'T', voiced: 'D', place: 'tongue tip on the ridge behind the teeth', example: ['tie', 'die'] },
  { unvoiced: 'K', voiced: 'G', place: 'back of the tongue on the soft palate', example: ['cap', 'gap'] },
  { unvoiced: 'F', voiced: 'V', place: 'lower lip against the upper teeth', example: ['fan', 'van'] },
  { unvoiced: 'S', voiced: 'Z', place: 'tongue near the ridge, air over the teeth', example: ['sue', 'zoo'] },
  { unvoiced: 'SH', voiced: 'ZH', place: 'tongue further back, wider channel', example: ['shoe', 'measure'] },
  { unvoiced: 'TH (thin)', voiced: 'TH (this)', place: 'tongue tip at the teeth', example: ['thigh', 'thy'] },
];

/* ── 4. vowels ─────────────────────────────────────────────────────────── */

export type Vowel = {
  id: string;
  letter: string;
  sound: string;
  /** 0 = tongue low (jaw open), 1 = tongue high (jaw closed). */
  height: number;
  /** 0 = tongue front, 1 = tongue back. */
  back: number;
  rounded: boolean;
  /** Typical adult-male formant centres in Hz (teaching values). */
  f1: number;
  f2: number;
  f3: number;
};

export const VOWELS: Vowel[] = [
  { id: 'a', letter: 'A', sound: 'AH as in father', height: 0.05, back: 0.75, rounded: false, f1: 730, f2: 1090, f3: 2440 },
  { id: 'e', letter: 'E', sound: 'EH as in bed', height: 0.45, back: 0.15, rounded: false, f1: 530, f2: 1840, f3: 2480 },
  { id: 'i', letter: 'I', sound: 'EE as in see', height: 0.95, back: 0.05, rounded: false, f1: 270, f2: 2290, f3: 3010 },
  { id: 'o', letter: 'O', sound: 'AW as in law', height: 0.35, back: 0.9, rounded: true, f1: 570, f2: 840, f3: 2410 },
  { id: 'u', letter: 'U', sound: 'OO as in boot', height: 0.9, back: 0.95, rounded: true, f1: 300, f2: 870, f3: 2240 },
];

/** A vowel's harmonic spectrum on `n` bins from 0..maxHz: a glottal comb at
 *  `f0` falling ~12 dB/oct, shaped by three formant resonances. Returns 0..1
 *  magnitudes (linear) — for drawing, not measuring. */
export function vowelSpectrum(v: Vowel, f0 = 120, n = 64, maxHz = 4000): { hz: Float64Array; mag: Float64Array } {
  const hz = new Float64Array(n);
  const mag = new Float64Array(n);
  const res = (f: number, fc: number, bw: number) => 1 / Math.sqrt(1 + Math.pow((f - fc) / (bw / 2), 2));
  for (let i = 0; i < n; i++) {
    const f = ((i + 0.5) / n) * maxHz;
    hz[i] = f;
    // glottal source: harmonics of f0, -12 dB/oct → amplitude ∝ (f0/f)^2
    const k = Math.round(f / f0);
    const nearest = k * f0;
    const onHarmonic = Math.abs(f - nearest) < maxHz / n / 2 + 1e-9 && k >= 1;
    const source = onHarmonic ? Math.pow(f0 / Math.max(f0, nearest), 2) : 0.05 * Math.pow(f0 / Math.max(f0, f), 2);
    const shape = res(f, v.f1, 90) + 0.6 * res(f, v.f2, 120) + 0.3 * res(f, v.f3, 160);
    mag[i] = source * shape;
  }
  let pk = 0;
  for (let i = 0; i < n; i++) pk = Math.max(pk, mag[i]);
  if (pk > 0) for (let i = 0; i < n; i++) mag[i] /= pk;
  return { hz, mag };
}

/** The smooth resonance curve of the mouth for a vowel (0..1) on `n` linear
 *  points from 0 to `maxHz` — the shape that the glottal comb is filtered by. */
export function formantEnvelope(v: Vowel, n = 120, maxHz = 4000): { hz: Float64Array; mag: Float64Array } {
  const hz = new Float64Array(n);
  const mag = new Float64Array(n);
  const res = (f: number, fc: number, bw: number) => 1 / Math.sqrt(1 + Math.pow((f - fc) / (bw / 2), 2));
  let pk = 0;
  for (let i = 0; i < n; i++) {
    const f = (i / (n - 1)) * maxHz;
    hz[i] = f;
    mag[i] = res(f, v.f1, 110) + 0.6 * res(f, v.f2, 150) + 0.3 * res(f, v.f3, 200);
    pk = Math.max(pk, mag[i]);
  }
  for (let i = 0; i < n; i++) mag[i] /= pk;
  return { hz, mag };
}

/** The harmonics of a voice at `f0` after the mouth has shaped them: one
 *  amplitude (0..1) per harmonic below `maxHz`. */
export function harmonicAmplitudes(v: Vowel, f0 = 120, maxHz = 4000): { hz: Float64Array; mag: Float64Array } {
  const count = Math.floor(maxHz / f0);
  const hz = new Float64Array(count);
  const mag = new Float64Array(count);
  const env = formantEnvelope(v, 400, maxHz);
  let pk = 0;
  for (let k = 1; k <= count; k++) {
    const f = k * f0;
    hz[k - 1] = f;
    const source = Math.pow(1 / k, 1.2);
    const idx = Math.min(env.hz.length - 1, Math.round((f / maxHz) * (env.hz.length - 1)));
    mag[k - 1] = source * env.mag[idx];
    pk = Math.max(pk, mag[k - 1]);
  }
  if (pk > 0) for (let i = 0; i < count; i++) mag[i] /= pk;
  return { hz, mag };
}

/* ── 5. consonant categories ───────────────────────────────────────────── */

export type ConsonantCategory = {
  id: string;
  name: string;
  how: string;
  examples: string;
  /** Where the energy sits — used by the band display. */
  energy: string;
  bandLoHz: number;
  bandHiHz: number;
  micNote: string;
};

export const CONSONANTS: ConsonantCategory[] = [
  { id: 'plosive', name: 'Plosives (stops)', how: 'Airflow is blocked completely, pressure builds, then bursts out.', examples: 'P B T D K G', energy: 'A broadband click plus a low-frequency blast of air', bandLoHz: 20, bandHiHz: 4000, micNote: 'The air blast is what pops a microphone — the sound is fine, the wind is the problem.' },
  { id: 'fricative', name: 'Fricatives', how: 'Air is forced through a narrow gap and turns turbulent — a continuous hiss.', examples: 'F V S Z SH ZH TH H', energy: 'Noise-like; S and Z peak roughly 4–10 kHz, SH lower, F and TH weaker and broader', bandLoHz: 2000, bandHiHz: 10000, micNote: 'S and Z are the sibilants a de-esser hunts.' },
  { id: 'affricate', name: 'Affricates', how: 'A stop released straight into a fricative — burst then hiss.', examples: 'CH J', energy: 'A click followed by a short SH-like hiss', bandLoHz: 1500, bandHiHz: 8000, micNote: 'Can trigger both a pop filter’s job and a de-esser’s.' },
  { id: 'nasal', name: 'Nasals', how: 'The mouth is closed and the soft palate drops, so the voiced buzz resonates out through the nose.', examples: 'M N NG', energy: 'Low, hum-like — strong below ~500 Hz, weak highs', bandLoHz: 80, bandHiHz: 800, micNote: 'Weak in the highs, so they are the first sounds to vanish in a muffled recording.' },
  { id: 'liquid', name: 'Liquids', how: 'The tongue shapes the airway without fully blocking it; voiced and vowel-like.', examples: 'L R', energy: 'Vowel-like formant structure with a dip', bandLoHz: 200, bandHiHz: 2500, micNote: 'Rarely a microphone problem.' },
  { id: 'glide', name: 'Glides (semivowels)', how: 'A fast movement from one vowel shape to another.', examples: 'W Y', energy: 'Vowel-like, sliding formants', bandLoHz: 200, bandHiHz: 2500, micNote: 'Rarely a microphone problem.' },
];

/* ── 6–7. plosives & sibilance ─────────────────────────────────────────── */

/** Illustrative time trace (0..1 samples, ±) of a "P" hitting a capsule with
 *  and without a pop filter: the pop is a slow low-frequency pressure hump
 *  the filter removes; the burst click that carries the consonant stays. */
export function plosiveTrace(n = 240, withFilter: boolean): Float64Array {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n; // 0..1 ≈ 60 ms
    const click = t < 0.08 ? Math.sin(2 * Math.PI * 18 * t) * Math.exp(-t * 40) * 0.5 : 0;
    const pop = withFilter ? 0 : t > 0.02 && t < 0.6 ? Math.sin(Math.PI * (t - 0.02) / 0.58) * 0.95 : 0;
    const vowel = t > 0.15 ? 0.25 * Math.sin(2 * Math.PI * 30 * t) * Math.min(1, (t - 0.15) / 0.2) : 0;
    out[i] = Math.max(-1, Math.min(1, pop + click + vowel));
  }
  return out;
}

/* ── 8. distance ───────────────────────────────────────────────────────── */

export type DistanceReadout = {
  inches: number;
  /** Direct sound relative to 12" (inverse-square). */
  directDb: number;
  /** Reverberant room sound — roughly constant with distance, set relative to direct at 12". */
  roomDb: number;
  /** Ratio direct minus room. */
  directToRoomDb: number;
  /** Plosive air energy: air jets lose speed much faster than sound loses level. */
  plosiveDb: number;
  /** Bass lift from the proximity effect of a directional mic. */
  proximityDb: number;
  /** Direct minus a fixed noise floor. */
  snrDb: number;
};

const ROOM_REL_DB = -14;
const NOISE_REL_DB = -36;

export function proximityBoostDb(inches: number): number {
  // Typical cardioid low-frequency lift — teaching curve, not a datasheet.
  const pts: [number, number][] = [[0.5, 16], [1, 12], [2, 9], [4, 6], [6, 4], [12, 1.5], [24, 0.5], [48, 0]];
  if (inches <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (inches <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const t = (Math.log(inches) - Math.log(x0)) / (Math.log(x1) - Math.log(x0));
      return y0 + (y1 - y0) * t;
    }
  }
  return 0;
}

export function distanceEffect(inches: number): DistanceReadout {
  const d = Math.max(0.25, inches);
  const directDb = 20 * Math.log10(12 / d);
  const plosiveDb = 50 * Math.log10(12 / d);
  return {
    inches: d,
    directDb,
    roomDb: ROOM_REL_DB,
    directToRoomDb: directDb - ROOM_REL_DB,
    plosiveDb,
    proximityDb: proximityBoostDb(d),
    snrDb: directDb - NOISE_REL_DB,
  };
}

export const DISTANCE_PRESETS = [1, 6, 12] as const;

/* ── 9. voices ─────────────────────────────────────────────────────────── */

export type VoiceRange = { id: string; name: string; f0LoHz: number; f0HiHz: number; f0TypicalHz: number; note: string };

export const VOICE_RANGES: VoiceRange[] = [
  { id: 'male', name: 'Typical adult male', f0LoHz: 85, f0HiHz: 155, f0TypicalHz: 120, note: 'Longer folds vibrate more slowly; a longer vocal tract puts the formants lower too.' },
  { id: 'female', name: 'Typical adult female', f0LoHz: 165, f0HiHz: 255, f0TypicalHz: 210, note: 'Shorter folds, higher pitch; formants sit roughly 15–20% higher.' },
  { id: 'child', name: 'Typical child', f0LoHz: 250, f0HiHz: 400, f0TypicalHz: 300, note: 'Small folds and a short tract — everything higher again.' },
];

/* ── 10. problem simulator ─────────────────────────────────────────────── */

export type ProblemId = 'sibilance' | 'plosives' | 'clicks' | 'nasality' | 'muffled' | 'offaxis' | 'distance' | 'breath';

export type SpeechProblem = {
  id: ProblemId;
  name: string;
  cause: string;
  hear: string;
  fix: string;
  /** Which visual the page draws. */
  visual: 'spectrum' | 'trace';
};

export const PROBLEMS: SpeechProblem[] = [
  { id: 'sibilance', name: 'Sibilance', cause: 'Air forced over the teeth on S, Z and SH makes intense hiss between roughly 4 and 10 kHz; bright mics, close placement and treble EQ make it worse.', hear: 'Piercing "ess" sounds that spit.', fix: 'Angle the mic slightly off-axis, back off a little, cut less treble — then a de-esser for what remains.', visual: 'spectrum' },
  { id: 'plosives', name: 'Plosives', cause: 'The air blast from P, B, T and K hits the capsule as a pressure wave far bigger than the sound.', hear: 'Low thumps and pops on P and B.', fix: 'A pop filter or foam windscreen, mic slightly above or beside the mouth, high-pass filter for what gets through.', visual: 'trace' },
  { id: 'clicks', name: 'Mouth clicks', cause: 'Saliva and a dry mouth make tiny ticks as the tongue and lips separate — a close mic hears every one.', hear: 'Small dry ticks between words.', fix: 'Water before the take, a slightly larger distance, then editing or a de-clicker.', visual: 'trace' },
  { id: 'nasality', name: 'Nasality', cause: 'The soft palate lets too much of the voice resonate through the nose, or the mic sits where the nasal path is loudest.', hear: 'A honky, pinched tone around 800 Hz–1.5 kHz.', fix: 'Reposition the mic lower and closer to the mouth; a narrow EQ cut in the honk region.', visual: 'spectrum' },
  { id: 'muffled', name: 'Muffled', cause: 'Something absorbs or blocks the highs: hand over the grille, mic behind a pop filter that is too dense, talking away from the capsule, a thick blanket over the mic.', hear: 'Dull, indistinct consonants; words blur.', fix: 'Clear the path to the capsule, aim it at the mouth, gentle presence lift only after the placement is fixed.', visual: 'spectrum' },
  { id: 'offaxis', name: 'Off-axis', cause: 'Speaking to the side of a directional mic — the pattern rolls off the highs and the level drops.', hear: 'Thinner, duller, quieter; changes as the head moves.', fix: 'Aim the front of the capsule at the mouth and keep the head still; a wider pattern if the talker moves a lot.', visual: 'spectrum' },
  { id: 'distance', name: 'Excessive distance', cause: 'Direct sound falls 6 dB every time distance doubles; the room and the noise floor do not.', hear: 'Roomy, distant, noisy after the gain is raised.', fix: 'Halve the distance before touching the gain; treat the room only after that.', visual: 'spectrum' },
  { id: 'breath', name: 'Popping breath', cause: 'Fast inhales and exhales straight into the capsule, especially after long sentences.', hear: 'Gasps and whooshes between phrases.', fix: 'Turn the head slightly to breathe, mic to the side of the airflow, a windscreen; edit or gate the rest.', visual: 'trace' },
];

/** A clean voice spectrum on `n` bands (20 Hz – 12 kHz, log spaced), 0..1. */
export function voiceSpectrum(n = 32): { hz: Float64Array; mag: Float64Array } {
  const hz = new Float64Array(n);
  const mag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const f = 20 * Math.pow(12000 / 20, (i + 0.5) / n);
    hz[i] = f;
    // broad hump around 200–400 Hz, ~-6 dB/oct above 1 kHz, weak below 100 Hz
    const lowRoll = 1 / (1 + Math.pow(90 / f, 2));
    const highRoll = 1 / Math.sqrt(1 + Math.pow(f / 1000, 2));
    mag[i] = lowRoll * highRoll;
  }
  return normalize(hz, mag);
}

/** The same spectrum with one problem applied — the visual for the simulator. */
export function problemSpectrum(id: ProblemId, n = 32): { hz: Float64Array; mag: Float64Array } {
  const { hz, mag } = voiceSpectrum(n);
  const out = new Float64Array(mag);
  for (let i = 0; i < n; i++) {
    const f = hz[i];
    switch (id) {
      case 'sibilance': if (f > 4000 && f < 10000) out[i] = Math.max(out[i], 0.9 * Math.exp(-Math.pow((Math.log(f) - Math.log(6500)) / 0.35, 2))); break;
      case 'plosives': if (f < 150) out[i] = Math.max(out[i], 1.0 * Math.exp(-Math.pow((Math.log(f) - Math.log(60)) / 0.6, 2))); break;
      case 'nasality': out[i] *= 1 + 1.4 * Math.exp(-Math.pow((Math.log(f) - Math.log(1100)) / 0.3, 2)); if (f > 2500) out[i] *= 0.6; break;
      case 'muffled': if (f > 1500) out[i] *= Math.pow(1500 / f, 1.6); break;
      case 'offaxis': out[i] *= 0.5; if (f > 3000) out[i] *= Math.pow(3000 / f, 1.0); break;
      case 'distance': out[i] *= 0.35; out[i] = Math.max(out[i], 0.22 * (f < 300 ? 1 : Math.pow(300 / f, 0.4))); break;
      case 'breath': if (f > 500 && f < 5000) out[i] = Math.max(out[i], 0.45); break;
      case 'clicks': break; // drawn as a trace, spectrum unchanged
    }
  }
  return { hz, mag: out };
}

/** Time trace for the trace-type problems (0..1 samples, ±): a clean vowel
 *  with the defect superimposed. */
export function problemTrace(id: ProblemId, n = 300): Float64Array {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let s = 0.35 * Math.sin(2 * Math.PI * 24 * t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 1.3 * t));
    if (id === 'plosives') { if (t > 0.1 && t < 0.45) s += 0.9 * Math.sin(Math.PI * (t - 0.1) / 0.35); }
    if (id === 'clicks') { for (const c of [0.18, 0.41, 0.63, 0.86]) if (Math.abs(t - c) < 0.006) s += 0.8 * (t < c ? 1 : -1); }
    if (id === 'breath') { if (t > 0.55 && t < 0.9) s = 0.5 * (Math.sin(2 * Math.PI * 131 * t) * 0.5 + Math.sin(2 * Math.PI * 211 * t) * 0.5) * Math.sin(Math.PI * (t - 0.55) / 0.35); }
    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

function normalize(hz: Float64Array, mag: Float64Array) {
  let pk = 0;
  for (let i = 0; i < mag.length; i++) pk = Math.max(pk, mag[i]);
  if (pk > 0) for (let i = 0; i < mag.length; i++) mag[i] /= pk;
  return { hz, mag };
}

/** Mean magnitude of the bands inside [lo, hi] Hz — for tests and readouts. */
export function bandMean(sp: { hz: Float64Array; mag: Float64Array }, lo: number, hi: number): number {
  let s = 0, c = 0;
  for (let i = 0; i < sp.hz.length; i++) if (sp.hz[i] >= lo && sp.hz[i] <= hi) { s += sp.mag[i]; c++; }
  return c ? s / c : 0;
}
