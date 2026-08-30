/**
 * Visual Audio Analysis Lab — pure-math engine (owner spec 2026-07-29).
 *
 * The lab teaches READING meters, not measuring: every module renders
 * deterministic SYNTHETIC teaching signals from this library (seeded — same
 * picture every visit, honest "SYNTHESIZED TEACHING SIGNAL" badges) and real
 * meter math on top of them. No audio playback at launch; no Skia here.
 *
 * HONESTY: the loudness module is a SIMPLIFIED BS.1770-STYLE MODEL for
 * teaching what the numbers mean — never a compliance meter (ITU-R BS.1770-5
 * true-peak/loudness measurement needs real DSP; module badges say so).
 */

const TAU = Math.PI * 2;

/** Deterministic hash noise (foundations idiom, JS-side). */
export function hashN(n: number): number {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s); // 0..1
}
const rnd = (i: number, seed: number) => hashN(i * 12.9898 + seed * 78.233) * 2 - 1;

export type SignalKey =
  | 'speech' | 'kick' | 'guitar' | 'whitenoise' | 'pinknoise'
  | 'snare' | 'organ' | 'sine' | 'square' | 'triangle' | 'saw' | 'music';

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  speech: 'Speech', kick: 'Kick drum', guitar: 'Guitar', whitenoise: 'White noise',
  pinknoise: 'Pink noise', snare: 'Snare', organ: 'Organ', sine: 'Sine',
  square: 'Square', triangle: 'Triangle', saw: 'Sawtooth', music: 'Music mix',
};

/** Tray blurbs (owner 2026-08-28): what each signal IS and what to watch on a
 *  meter — read inside the open tray, where the lab's prose is covered. */
export const SIGNAL_BLURBS: Record<SignalKey, string> = {
  speech: 'Real talking: bursts with gaps between words. Meters leap on each syllable and fall back in the silences — the average sits far below the peaks.',
  kick: 'A low thump that hits and dies fast. Peak meters catch it; slow averages barely move — the classic peak-vs-average lesson.',
  guitar: 'Plucked notes that ring and decay: an attack spike, then a long falling tail.',
  whitenoise: 'Every frequency at equal energy — constant hiss. Rock-steady on every meter, and bright, because each octave up holds more frequencies.',
  pinknoise: 'Equal energy per OCTAVE — the calibration reference. As steady as white noise but darker, and it reads flat on a log-frequency display.',
  snare: 'A sharp crack with a short rattle: a huge peak over a tiny average — the highest crest factor of the drums.',
  organ: 'Held, sustained chords at nearly constant level. Peak and average sit close together — the opposite of drums.',
  sine: 'One single frequency — the purest signal there is. Peak sits exactly 3 dB above RMS.',
  square: 'Odd harmonics stacked on a sine: flat tops and fast edges. RMS nearly equals peak — the densest waveform a meter can see.',
  triangle: 'Odd harmonics too, but fading fast up the series — sounds soft, measures gentle.',
  saw: 'Every harmonic in the series, falling gently — the bright, buzzy synth staple.',
  music: 'A full mix: drums, bass and sustained parts together. Peaks ride far above the average — exactly what LUFS-vs-peak metering is about.',
};

/** Render n samples (−1..1) of a teaching signal. Deterministic per (key, seed).
 *  Time base: the buffer represents ~1.5 s (waveform module) — shapes chosen
 *  for how they READ on a meter, not for playback. */
export function renderSignal(key: SignalKey, n = 1024, seed = 1): number[] {
  const out = new Array<number>(n);
  const cyc = (f: number, i: number) => Math.sin((TAU * f * i) / n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let v = 0;
    switch (key) {
      case 'sine': v = cyc(12, i); break;
      case 'square': { let s = 0; for (let h = 1; h <= 11; h += 2) s += Math.sin((TAU * 12 * h * i) / n) / h; v = s * (4 / Math.PI) * 0.72; break; }
      case 'triangle': { let s = 0; for (let h = 1; h <= 11; h += 2) s += (Math.pow(-1, (h - 1) / 2) / (h * h)) * Math.sin((TAU * 12 * h * i) / n); v = s * (8 / (Math.PI * Math.PI)); break; }
      case 'saw': { let s = 0; for (let h = 1; h <= 12; h++) s += Math.sin((TAU * 12 * h * i) / n) / h; v = s * (2 / Math.PI) * 0.8; break; }
      case 'whitenoise': v = rnd(i, seed) * 0.7; break;
      case 'pinknoise': {
        // 3-octave averaged noise — reads pink-ish (smoother than white).
        v = (rnd(i, seed) + rnd(i >> 1, seed + 1) + rnd(i >> 2, seed + 2) + rnd(i >> 3, seed + 3)) * 0.28;
        break;
      }
      case 'kick': {
        // Two hits: pitch-dropping sine burst + click transient.
        for (const t0 of [0.08, 0.58]) {
          const dt = t - t0;
          if (dt >= 0) {
            const env = Math.exp(-dt * 14);
            v += env * Math.sin(TAU * (52 + 90 * Math.exp(-dt * 30)) * dt * 18);
            if (dt < 0.004) v += (1 - dt / 0.004) * 0.9;
          }
        }
        break;
      }
      case 'snare': {
        for (const t0 of [0.12, 0.62]) {
          const dt = t - t0;
          if (dt >= 0) {
            const env = Math.exp(-dt * 18);
            v += env * (0.6 * rnd(i, seed + 4) + 0.4 * Math.sin(TAU * 190 * dt * 18));
          }
        }
        break;
      }
      case 'guitar': {
        const dt = Math.max(0, t - 0.06);
        const env = Math.exp(-dt * 2.2) * (t > 0.06 ? 1 : 0);
        for (let h = 1; h <= 6; h++) v += (env / h) * Math.sin((TAU * 9 * h * i) / n + h);
        v *= 0.5;
        break;
      }
      case 'organ': {
        for (const h of [1, 2, 3, 4, 6]) v += Math.sin((TAU * 8 * h * i) / n) / (h * 1.2);
        v *= 0.42; // steady — the RMS≈peak teaching case
        break;
      }
      case 'speech': {
        // Syllable bursts: voiced buzz + envelope gaps (high crest, pauses).
        const syll = [0.05, 0.22, 0.34, 0.55, 0.72, 0.86];
        for (const t0 of syll) {
          const dt = t - t0;
          if (dt >= 0 && dt < 0.11) {
            const env = Math.sin((Math.PI * dt) / 0.11);
            v += env * (0.7 * Math.sin(TAU * 14 * i / n + Math.sin(TAU * 3 * i / n) * 2) + 0.25 * rnd(i, seed + 7));
          }
        }
        v *= 0.8;
        break;
      }
      case 'music': {
        v = 0.4 * Math.sin((TAU * 8 * i) / n) + 0.2 * Math.sin((TAU * 24 * i) / n + 1);
        const beat = Math.exp(-((t * 4) % 1) * 9);
        v += beat * 0.5 * Math.sin(TAU * 55 * t * 6) + 0.12 * rnd(i, seed + 9);
        v *= 0.7;
        break;
      }
    }
    out[i] = Math.max(-1.2, Math.min(1.2, v));
  }
  return out;
}

// ── Meter math ───────────────────────────────────────────────────────────────

export const peakOf = (x: number[]) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
export const rmsOf = (x: number[]) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(1, x.length));
export const dcOf = (x: number[]) => x.reduce((s, v) => s + v, 0) / Math.max(1, x.length);
export const db = (lin: number) => 20 * Math.log10(Math.max(1e-6, lin));
export const crestDb = (x: number[]) => db(peakOf(x)) - db(rmsOf(x));

/** One first-order VU ballistics step: the needle chases RMS with ~300 ms
 *  integration — WHY a VU can't show transients (the whole M3 lesson). */
export function vuStep(prev: number, targetRms: number, dtSec: number, tcSec = 0.3): number {
  const a = 1 - Math.exp(-dtSec / tcSec);
  return prev + (targetRms - prev) * a;
}

// ── Simplified loudness teaching curves (BS.1770-STYLE MODEL, not a meter) ──

export type LoudnessSim = {
  /** 0..1 time series over the teaching clip (~24 s). */
  momentary: number[];
  short: number[];
  integratedLufs: number;
  lraLu: number;
  truePeakDbtp: number;
  samplePeakDbfs: number;
};

/** Per-signal authored loudness stories (what each meter WOULD read). */
export function simulateLoudness(key: SignalKey, seed = 3): LoudnessSim {
  const N = 96;
  const momentary: number[] = [];
  const base = key === 'organ' || key === 'sine' ? -16 : key === 'speech' ? -19 : key === 'music' ? -14 : -18;
  const swing = key === 'speech' ? 9 : key === 'music' ? 5 : key === 'kick' || key === 'snare' ? 12 : 1.5;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const slow = Math.sin(TAU * t * 1.5 + seed) * 0.5 + 0.5;
    const fast = hashN(i * 3.7 + seed) * 0.7;
    momentary.push(base - swing * (key === 'speech' ? (fast > 0.35 ? 0.15 : 1) : slow * 0.6 + fast * 0.4));
  }
  const short: number[] = momentary.map((_, i) => {
    const a = Math.max(0, i - 7);
    const w = momentary.slice(a, i + 1);
    return w.reduce((s, v) => s + v, 0) / w.length;
  });
  const sorted = [...short].sort((a, b) => a - b);
  const lra = sorted[Math.floor(0.95 * (N - 1))] - sorted[Math.floor(0.1 * (N - 1))];
  const integrated = short.reduce((s, v) => s + v, 0) / N;
  const samplePeak = base + swing * 0.55 + 6;
  return {
    momentary,
    short,
    integratedLufs: Math.round(integrated * 10) / 10,
    lraLu: Math.round(lra * 10) / 10,
    samplePeakDbfs: Math.min(-0.3, Math.round(samplePeak * 10) / 10),
    truePeakDbtp: Math.min(1.8, Math.round((samplePeak + (key === 'square' || key === 'music' ? 0.9 : 0.4)) * 10) / 10),
  };
}

// ── Spectrum pattern library (M5) ────────────────────────────────────────────

export type SpectrumKey = 'speech' | 'cymbal' | 'kick' | 'guitar' | 'hum' | 'feedback' | 'pinknoise';
export const SPECTRUM_LABELS: Record<SpectrumKey, string> = {
  speech: 'Speech', cymbal: 'Cymbal', kick: 'Kick drum', guitar: 'Guitar',
  hum: 'Mains hum', feedback: 'Feedback', pinknoise: 'Pink noise',
};

/** Teaching spectrum in dB (relative) at frequency f (20..20k). */
export function spectrumDb(key: SpectrumKey, f: number): number {
  const lg = Math.log10(f);
  const bump = (fc: number, w: number, g: number) => g * Math.exp(-Math.pow((lg - Math.log10(fc)) / w, 2));
  switch (key) {
    case 'pinknoise': return -10 * (lg - Math.log10(20)) + 0; // −3 dB/oct ≈ −10 dB/decade
    case 'kick': return bump(60, 0.16, 24) + bump(3000, 0.25, 6) - 26 - 6 * (lg - 2);
    case 'speech': return bump(220, 0.16, 18) + bump(900, 0.18, 14) + bump(2600, 0.18, 10) - 26 - (f > 4000 ? 10 * (lg - Math.log10(4000)) * 4 : 0);
    case 'guitar': {
      let v = -30;
      for (let h = 1; h <= 8; h++) v = Math.max(v, bump(196 * h, 0.035, 22 - h * 2) - 26);
      return v + bump(2500, 0.4, 4);
    }
    case 'cymbal': return -34 + bump(4000, 0.5, 16) + bump(9000, 0.4, 18) + 4 * Math.sin(lg * 14) * (f > 2500 ? 1 : 0) - (f < 800 ? 14 : 0);
    case 'hum': {
      let v = -46;
      for (let h = 1; h <= 6; h++) v = Math.max(v, bump(60 * h, 0.012, 34 - h * 3.5) - 26);
      return v;
    }
    case 'feedback': return -44 + bump(1750, 0.015, 52);
  }
}

// ── Spectrogram pattern painters (M6) — level 0..1 at (t01, f01 log axis) ───

export type SpectrogramKey = 'speech' | 'birdsong' | 'cymbal' | 'feedback' | 'whistle' | 'whitenoise';
export const SPECTROGRAM_LABELS: Record<SpectrogramKey, string> = {
  speech: 'Speech', birdsong: 'Birdsong', cymbal: 'Cymbal decay',
  feedback: 'Feedback', whistle: 'Whistle', whitenoise: 'White noise',
};

export function spectrogramLevel(key: SpectrogramKey, t01: number, f01: number): number {
  const band = (c: number, w: number) => Math.exp(-Math.pow((f01 - c) / w, 2));
  switch (key) {
    case 'whitenoise': return 0.55 + 0.12 * hashN(t01 * 997 + f01 * 631);
    case 'whistle': return band(0.62 + 0.02 * Math.sin(t01 * 28), 0.015) * (t01 > 0.08 && t01 < 0.92 ? 1 : 0);
    case 'feedback': return band(0.58, 0.01) * Math.min(1, t01 * 1.8) + 0.08;
    case 'cymbal': {
      const hit = t01 > 0.12 ? Math.exp(-(t01 - 0.12) * 3.2) : 0;
      return hit * Math.max(0, f01 - 0.35) * (1.5 - f01 * 0.4) * (0.8 + 0.2 * hashN(f01 * 431 + t01 * 100));
    }
    case 'birdsong': {
      let v = 0;
      for (const c of [0.18, 0.44, 0.7]) {
        const dt = t01 - c;
        if (Math.abs(dt) < 0.09) v = Math.max(v, band(0.72 + dt * 2.2, 0.02));
      }
      return v;
    }
    case 'speech': {
      const syll = [0.1, 0.28, 0.44, 0.63, 0.8];
      let v = 0;
      for (const t0 of syll) {
        if (Math.abs(t01 - t0) < 0.07) {
          for (const fmt of [0.18, 0.38, 0.55]) v = Math.max(v, band(fmt + 0.02 * Math.sin(t01 * 40), 0.05) * 0.9);
          if (f01 < 0.3) v = Math.max(v, 0.5 * (1 - Math.abs(((f01 * 24) % 1) - 0.5) * 2)); // pitch striations
        }
      }
      return v;
    }
  }
}

// ── Waterfall model (M7 — the star) ──────────────────────────────────────────

export type RoomKey = 'cathedral' | 'classroom' | 'studio' | 'theater' | 'living';
export const ROOM_LABELS: Record<RoomKey, string> = {
  cathedral: 'Cathedral', classroom: 'Classroom', studio: 'Studio', theater: 'Theater', living: 'Living room',
};
export type ReverbKey = 'none' | 'room' | 'plate' | 'hall' | 'spring';

export type WaterfallOpts = {
  room: RoomKey;
  /** 0 = concrete … 1 = heavy treatment (the damping slider). */
  damping01: number;
  /** EQ boost at 250 Hz, dB (−12..+12). */
  eqBoostDb: number;
  /** Which filter the EQ lane drives (owner 2026-08-30 — was a fixed 250 Hz
   *  bell, so the lab could only ever teach one filter shape). */
  eqFilter: EqFilterKey;
  /** High-Q ringing filter on/off (adds a narrow long-decay ridge at 1.2 kHz). */
  qRing: boolean;
  reverb: ReverbKey;
};

/**
 * PHYSICAL RT60 MODEL (owner 2026-08-29: "this has to be calculated and
 * visualized correctly — every value, every setting, every combination, every
 * physics consequence"). The previous per-room base×multiplier heuristic gave a
 * bare concrete THEATER 1.45 s at 125 Hz — that number describes a FINISHED,
 * seated hall, while the DAMPING fader's zero point is literally labeled
 * CONCRETE. The semantics are now consistent:
 *
 *   ROOM    = the SHELL — geometry only (volume V, surface S).
 *   DAMPING = everything soft in it (0 = bare concrete shell … 1 = maximum
 *             treatment: the fader's CONCRETE→CURTAINS→CARPET→PANELS arc).
 *
 * RT60 comes from the Eyring reverberation equation with HF air absorption:
 *
 *   RT60(f) = 0.161·V / ( −S·ln(1 − ᾱ(f)) + 4m(f)·V )
 *
 * ᾱ(f) mixes the shell's bare absorption spectrum toward a porous-treatment
 * spectrum as DAMPING rises, over the fraction of surface that can physically
 * be treated. Every teaching consequence now EMERGES instead of being faked:
 * treatment eats highs first and lows last (porous α collapses below 250 Hz —
 * why bass traps are thick), big rooms ring longest (V/S), air itself kills
 * the top octaves of large spaces, and a cathedral stays over a second even
 * fully treated (you cannot kill a cathedral with panels).
 *
 * Bare-shell spectra are CALIBRATED: α_bare is derived by inverse Eyring from
 * published RT60 profiles of comparable untreated spaces (bare concrete shell /
 * stone church / empty domestic room), so damping 0 lands on measured reality
 * and the formula supplies every in-between combination.
 */
const WF_BAND_HZ = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const WF_BAND_LG = WF_BAND_HZ.map((f) => Math.log10(f));
/** Air absorption 4m (1/m), ~20 °C / 50 % RH — negligible below 1 kHz, then
 *  the reason big rooms are never bright: at 8 kHz air alone caps a 12 000 m³
 *  space near 7 s no matter what the walls do. */
const WF_AIR_4M = [0.00005, 0.0001, 0.0002, 0.0006, 0.0011, 0.0027, 0.008, 0.024, 0.07];
/** Porous treatment α (panels + some corner trapping): near-total above 1 kHz,
 *  collapsing below 250 Hz — the entire bass-trap lesson is in this row. */
const WF_PANEL_ALPHA = [0.18, 0.25, 0.5, 0.8, 0.95, 0.98, 0.98, 0.95, 0.9];

type RoomPhys = {
  V: number; // m³
  S: number; // m²
  /** Fraction of S that treatment can realistically cover (walls/ceiling —
   *  you cannot panel a cathedral's vaults or a theater's stage opening). */
  treatable: number;
  /** Bare-shell RT60 targets per WF_BAND_HZ — inverse-Eyring'd into α_bare. */
  bareRt: number[];
  /** Dominant low room mode (small/medium rooms below Schroeder): modal decay
   *  outlasts the diffuse field, and thin treatment barely touches it. */
  ring: { hz: number; w: number; mult: (d: number) => number } | null;
};

const ROOM_PHYS: Record<RoomKey, RoomPhys> = {
  // Large stone church: mid-band 6-7 s bare, LF near 9 s, HF air-limited.
  cathedral: {
    V: 12000, S: 4800, treatable: 0.3,
    bareRt: [9.0, 8.5, 8.0, 7.2, 6.2, 5.0, 3.2, 1.9, 1.0],
    ring: null,
  },
  // Medium hard-walled room (drywall/glass/tile): ~2 s bare, treated to ~0.45.
  classroom: {
    V: 220, S: 250, treatable: 0.55,
    bareRt: [2.6, 2.4, 2.2, 2.0, 1.9, 1.7, 1.4, 1.1, 0.8],
    // Strong 250 Hz mode: ~1.75x the diffuse decay bare; panels DO reach 250,
    // so full damping tames it to parity.
    ring: { hz: 250, w: 0.035, mult: (d) => Math.max(1.02, 1.75 - 0.9 * d) },
  },
  // Small concrete box (a studio SHELL before treatment rings badly);
  // full PANELS = the dead control room, ~0.12-0.2 s mids, bass hanging on.
  studio: {
    V: 85, S: 115, treatable: 0.85,
    bareRt: [2.2, 2.0, 1.8, 1.6, 1.5, 1.4, 1.2, 1.0, 0.8],
    ring: null,
  },
  // Large hall shell, bare concrete (think empty gymnasium): 5-6 s mids.
  // At ~50 % damping (seats + curtains) it lands on the ~1 s of a real
  // seated theater; 100 % is cinema-grade treatment (~0.45 s).
  theater: {
    V: 8000, S: 3400, treatable: 0.7,
    bareRt: [7.0, 6.5, 6.0, 5.5, 5.0, 4.2, 2.9, 1.8, 1.0],
    ring: null,
  },
  // Domestic room, EMPTY (bare ~1 s); furnishing it is the damping arc.
  living: {
    V: 60, S: 95, treatable: 0.45,
    bareRt: [1.4, 1.3, 1.15, 1.0, 0.95, 0.9, 0.8, 0.7, 0.6],
    // 110 Hz mode: thin domestic soft goods barely touch it — it still rings
    // ~1.1x even fully furnished. That residual is the truth, not a bug.
    ring: { hz: 110, w: 0.045, mult: (d) => Math.max(1.05, 1.8 - 0.7 * d) },
  },
};

/** α_bare per band via inverse Eyring: A_target = 0.161V/RT, minus the air
 *  term, back through ln. Precomputed once per room. */
const ROOM_ALPHA_BARE: Record<RoomKey, number[]> = Object.fromEntries(
  (Object.keys(ROOM_PHYS) as RoomKey[]).map((k) => {
    const r = ROOM_PHYS[k];
    return [
      k,
      r.bareRt.map((rt, i) => {
        const aTotal = (0.161 * r.V) / rt;
        const aSurf = Math.max(0.5, aTotal - WF_AIR_4M[i] * r.V);
        return 1 - Math.exp(-aSurf / r.S);
      }),
    ];
  }),
) as Record<RoomKey, number[]>;

/** Piecewise-linear in log-f across WF_BAND_HZ, clamped at the ends. */
function bandInterp(table: number[], lg: number): number {
  if (lg <= WF_BAND_LG[0]) return table[0];
  const last = WF_BAND_LG.length - 1;
  if (lg >= WF_BAND_LG[last]) return table[last];
  let i = 1;
  while (WF_BAND_LG[i] < lg) i++;
  const t = (lg - WF_BAND_LG[i - 1]) / (WF_BAND_LG[i] - WF_BAND_LG[i - 1]);
  return table[i - 1] + (table[i] - table[i - 1]) * t;
}

const REVERB_RT: Record<ReverbKey, { rtAt1k: number; lfMult: number; hfMult: number }> = {
  none: { rtAt1k: 0, lfMult: 1, hfMult: 1 },
  room: { rtAt1k: 0.5, lfMult: 1.3, hfMult: 0.7 },
  plate: { rtAt1k: 1.8, lfMult: 0.9, hfMult: 1.05 },
  hall: { rtAt1k: 2.6, lfMult: 1.5, hfMult: 0.55 },
  spring: { rtAt1k: 1.4, lfMult: 0.7, hfMult: 0.5 },
};

/** RT60(f) for the configured scene — the decay half of the mountain. */
export function waterfallRt(opts: WaterfallOpts, f: number): number {
  const r = ROOM_PHYS[opts.room];
  const lg = Math.log10(f);

  // Eyring + air, with ᾱ mixed bare→treated over the treatable fraction.
  const cover = Math.min(1, Math.max(0, opts.damping01)) * r.treatable;
  const aBare = bandInterp(ROOM_ALPHA_BARE[opts.room], lg);
  const aPanel = bandInterp(WF_PANEL_ALPHA, lg);
  const alpha = Math.min(0.98, aBare * (1 - cover) + aPanel * cover);
  const air4m = bandInterp(WF_AIR_4M, lg);
  const A = -r.S * Math.log(1 - alpha) + air4m * r.V;
  let rt = (0.161 * r.V) / A;

  // Low room mode: modal decay stands above the diffuse field, shrinking as
  // damping rises (per-room — a 110 Hz mode resists panels, a 250 Hz one less).
  if (r.ring) {
    const g = Math.exp(-Math.pow((lg - Math.log10(r.ring.hz)) / r.ring.w, 2));
    const ringRt = rt * r.ring.mult(opts.damping01);
    rt = Math.max(rt, ringRt * g + rt * (1 - g));
  }
  // High-Q ringing FILTER — an electronic demonstration, not room physics.
  if (opts.qRing) {
    const g = Math.exp(-Math.pow((lg - Math.log10(1200)) / 0.012, 2));
    rt = Math.max(rt, 2.8 * g + rt * (1 - g));
  }
  // Added reverb runs in parallel with the room — the slower decay wins.
  if (opts.reverb !== 'none') {
    const rv = REVERB_RT[opts.reverb];
    const mult = f < 400 ? rv.lfMult : f > 3000 ? rv.hfMult : 1;
    rt = Math.max(rt, rv.rtAt1k * mult);
  }
  // Last-resort realism clamp: a fully treated vocal booth measures ~0.12 s;
  // below that is an anechoic chamber, which is not one of these rooms.
  return Math.max(0.12, rt);
}

/**
 * THE EQ LANE'S FILTER (owner 2026-08-30: the EQ button opens a menu).
 *
 * Three deliberately different shapes, so the lab can show that WHERE and HOW
 * WIDE matter as much as how much:
 *   220 Hz Q6    — surgical: narrow enough to sit between room modes
 *   440 Hz Q1    — musical: nearly one and a half octaves wide
 *   1 kHz shelf  — everything above moves together, not a bump at all
 *
 * Bandwidth comes from Q properly rather than by eye:
 *   BW(octaves) = (2/ln2)·asinh(1/(2Q))
 * and the bell is drawn as a gaussian in log10(f), whose half-power full width
 * is 1.665σ — so σ = BW_decades / 1.665. Q6 lands at ~0.24 octaves and Q1 at
 * ~1.39, which is what those numbers mean on a real parametric.
 */
export type EqFilterKey = 'bell220q6' | 'bell440q1' | 'shelf1k';

export const EQ_FILTERS: {
  key: EqFilterKey;
  label: string;
  hz: number;
  kind: 'bell' | 'shelf';
  q?: number;
  blurb: string;
}[] = [
  {
    key: 'bell220q6',
    label: '220 Hz · Q6',
    hz: 220,
    kind: 'bell',
    q: 6,
    blurb: 'Surgical: about a quarter-octave wide. Narrow enough to cut one room mode and leave its neighbours alone — and narrow enough to miss if the mode is not exactly there.',
  },
  {
    key: 'bell440q1',
    label: '440 Hz · Q1',
    hz: 440,
    kind: 'bell',
    q: 1,
    blurb: 'Musical: nearly one and a half octaves wide. This is the shape you use to change how something FEELS; it moves everything around 440 Hz with it.',
  },
  {
    key: 'shelf1k',
    label: '1 kHz shelf',
    hz: 1000,
    kind: 'shelf',
    blurb: 'Not a bump at all: everything above 1 kHz moves together, by the same amount. A tilt, not a target — the tool for "too dull" or "too bright".',
  },
];

export const EQ_FILTER_BY_KEY: Record<EqFilterKey, (typeof EQ_FILTERS)[number]> =
  Object.fromEntries(EQ_FILTERS.map((f) => [f.key, f])) as Record<EqFilterKey, (typeof EQ_FILTERS)[number]>;

/** Gain multiplier (0..1) this filter applies at frequency f. */
export function eqFilterShape(key: EqFilterKey, f: number): number {
  const spec = EQ_FILTER_BY_KEY[key] ?? EQ_FILTER_BY_KEY.bell220q6;
  const lg = Math.log10(f);
  const c = Math.log10(spec.hz);
  if (spec.kind === 'shelf') {
    // Smooth high shelf: half gain at the corner, full a bit above it.
    return 0.5 * (1 + Math.tanh((lg - c) / 0.16));
  }
  const q = spec.q ?? 1;
  const bwOct = (2 / Math.LN2) * Math.asinh(1 / (2 * q));
  const sigma = (bwOct * Math.log10(2)) / 1.665;
  return Math.exp(-Math.pow((lg - c) / sigma, 2));
}

/** Initial (t=0) excitation spectrum in dB — impulse through the EQ. */
export function waterfallSpectrumDb(opts: WaterfallOpts, f: number): number {
  const lg = Math.log10(f);
  let v = -4 - 5 * Math.abs(lg - Math.log10(500)) * 0.6; // gentle broadband impulse
  v += opts.eqBoostDb * eqFilterShape(opts.eqFilter, f);
  if (opts.qRing) v += 7 * Math.exp(-Math.pow((lg - Math.log10(1200)) / 0.012, 2));
  return v;
}

/**
 * The RINGING RIDGE: a NARROW resonance whose decay stands apart from its
 * surroundings — a room mode or a filter ring — and how far it stands out.
 *
 * ONE detector, shared by everything that points at it — the waterfall's on-plot
 * "RINGS <f>" mark, the bezel's RIDGE readout, and the EQ fader's purple tint.
 * They previously sampled RT60 on DIFFERENT grids (the plot on 140 points from
 * 20 Hz–20 kHz, the bezel on 240 from 40 Hz–12 kHz) and could genuinely
 * disagree: with CLASSROOM + Q RING the coarser grid under-resolved the 1.2 kHz
 * filter ring and named 252 Hz while the finer one named 1214 Hz. Three UI
 * elements pointing at two different frequencies is worse than none of them
 * pointing at all, so the grid now lives here, once.
 *
 * PROMINENCE, not global max (2026-08-29, forced by the physical model): with
 * honest Eyring physics EVERY treated room ends up with a broadband LF rise —
 * bass outlasting treatment is normal acoustics, not ringing, and a global
 * max-vs-median compare flagged that tilt as a 40 Hz "ridge" on a fully damped
 * classroom. A callout-worthy ridge must be a LOCAL peak measured against the
 * median of its ±1-octave neighbourhood, which stays quiet on any smooth tilt
 * and fires hard on modes (110/250 Hz) and the Q RING filter.
 */
export function waterfallRidge(opts: WaterfallOpts): { f: number; ratio: number } {
  const N = 240;
  const lgLo = Math.log10(40);
  const lgHi = Math.log10(12000);
  const freq = (i: number) => Math.pow(10, lgLo + ((lgHi - lgLo) * i) / (N - 1));
  const rts: number[] = [];
  for (let i = 0; i < N; i++) rts.push(waterfallRt(opts, freq(i)));

  // ~29 points per octave on this grid; the neighbourhood spans ±1 octave and
  // the peak's own ±0.1 octave core is excluded so it can't lift its baseline.
  const NEIGH = 29;
  const CORE = 3;
  let best = { f: freq(0), ratio: 1 };
  for (let i = 1; i < N - 1; i++) {
    if (rts[i] < rts[i - 1] || rts[i] < rts[i + 1]) continue; // local maxima only
    const lo = Math.max(0, i - NEIGH);
    const hi = Math.min(N - 1, i + NEIGH);
    const neigh: number[] = [];
    for (let j = lo; j <= hi; j++) if (Math.abs(j - i) > CORE) neigh.push(rts[j]);
    if (!neigh.length) continue;
    neigh.sort((a, b) => a - b);
    const med = neigh[Math.floor(neigh.length / 2)];
    const ratio = rts[i] / Math.max(0.01, med);
    if (ratio > best.ratio) best = { f: freq(i), ratio };
  }
  return best;
}

/** A ridge is only worth pointing at when it genuinely stands apart. */
export const RIDGE_CALLOUT_RATIO = 1.5;

/** Frequencies sampled when sizing the plot's time window. 110 and 1200 are
 *  in the list because the living-room mode and the Q RING filter peak there —
 *  a probe grid that misses the slowest ridge sizes the window too small. */
const RT_PROBE_HZ = [31.5, 63, 110, 125, 250, 500, 1000, 1200, 2000, 4000, 8000, 16000];

/**
 * The time window a CSD of THIS scene should span, in seconds.
 *
 * A fixed window cannot serve every room. Over a fixed 3 s span a studio's
 * decay occupied 5 of 56 slices (2 % once damped) while the other 51 sat pinned
 * at the floor, and a cathedral OVERFLOWED at 138 % — so the same plot showed
 * a dead room as "gone instantly" and a live one as "never decays". Owner
 * 2026-08-28: "you are showing the decay unrealistically too fast ... this
 * needs to be realistic." Real acoustics tools fit the window to the decay for
 * exactly this reason.
 *
 * Driven by the LONGEST RT60 in the band, because the window has to be long
 * enough to show the slowest part of the room finish — that is usually the low
 * end, and seeing the bass outlast the top IS the lesson. 1.25x gives the tail
 * room to be visible instead of ending exactly at the front edge. Snapped to a
 * readable step so the floor marks land on round numbers.
 */
export function waterfallTimeSpan(opts: WaterfallOpts): number {
  // PINNED PER SCENE (owner 2026-08-28: "pin time axis do not make it change").
  //
  // The window is measured from the UNTREATED room — damping01 is forced to 0
  // here — so the axis holds still while you actually work. DAMPING, EQ and
  // Q RING are the live controls, and the whole point of DAMPING is to watch
  // the decay get shorter: if the ruler shrank with it, the range would look
  // identical at every setting and the control would appear to do nothing. A
  // stable ruler is what makes the change visible.
  //
  // ROOM and REVERB do move it, because they are scene selectors, not live
  // controls, and one global pin is not physically possible: the bare-shell
  // scenes span ~1.3 s (living room) to ~9 s (cathedral), 7x. Any single
  // fixed window either buries a small room's decay in a couple of slices or
  // clips a cathedral off the front edge.
  const untreated: WaterfallOpts = { ...opts, damping01: 0 };
  let maxRt = 0;
  for (const f of RT_PROBE_HZ) maxRt = Math.max(maxRt, waterfallRt(untreated, f));
  const needed = maxRt * 1.25;
  const STEPS = [0.3, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 10, 12];
  return STEPS.find((s) => s >= needed) ?? STEPS[STEPS.length - 1];
}

/** Whole-number-ish floor division marks that fit inside `span`. */
export function waterfallTimeDivisions(span: number): number[] {
  // Aim for 2-4 marks: enough to read a duration off the floor, few enough
  // that the chrome stays quieter than the data.
  const step = span <= 0.5 ? 0.2 : span <= 1 ? 0.25 : span <= 2 ? 0.5 : span <= 4 ? 1 : span <= 8 ? 2 : 3;
  const out: number[] = [];
  for (let t = step; t < span - 1e-6; t += step) out.push(Number(t.toFixed(2)));
  return out;
}

/** Level (dB) of the slice at time t — spectrum minus linear-in-dB decay. */
export function waterfallSliceDb(opts: WaterfallOpts, f: number, tSec: number): number {
  return waterfallSpectrumDb(opts, f) - (60 * tSec) / waterfallRt(opts, f);
}

// ── Stereo / phase (M8–M9) ───────────────────────────────────────────────────

/** Deterministic stereo pair: width 0 = mono … 1 = fully decorrelated;
 *  phaseDeg rotates R against L (180 = polarity-style cancellation). */
export function stereoPair(width01: number, phaseDeg: number, n = 512, seed = 5): { l: number[]; r: number[] } {
  const l: number[] = [];
  const r: number[] = [];
  const ph = (phaseDeg * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const common = Math.sin((TAU * 7 * i) / n) * 0.7 + 0.25 * Math.sin((TAU * 19 * i) / n + 1);
    const side = 0.7 * rnd(i, seed) + 0.3 * Math.sin((TAU * 11 * i) / n + 2);
    const L = common * (1 - width01 * 0.5) + side * width01 * 0.6;
    const Rbase = common * (1 - width01 * 0.5) - side * width01 * 0.6;
    // Phase rotation applied to R's dominant component (teaching model).
    const R = Rbase * Math.cos(ph) + side * Math.sin(ph) * 0.4 - common * Math.sin(ph) * (1 - width01) * 0.6;
    l.push(L * 0.8);
    r.push(R * 0.8);
  }
  return { l, r };
}

export function correlationOf(l: number[], r: number[]): number {
  let sl = 0, sr = 0, slr = 0;
  for (let i = 0; i < l.length; i++) {
    sl += l[i] * l[i];
    sr += r[i] * r[i];
    slr += l[i] * r[i];
  }
  return slr / Math.max(1e-6, Math.sqrt(sl * sr));
}
