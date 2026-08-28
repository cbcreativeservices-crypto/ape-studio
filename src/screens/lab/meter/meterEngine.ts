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
  /** High-Q ringing filter on/off (adds a narrow long-decay ridge at 1.2 kHz). */
  qRing: boolean;
  reverb: ReverbKey;
};

const ROOM_RT: Record<RoomKey, { base: number; lfMult: number; ringHz: number | null; ringRt: number }> = {
  cathedral: { base: 4.6, lfMult: 1.5, ringHz: null, ringRt: 0 },
  classroom: { base: 0.9, lfMult: 1.7, ringHz: 250, ringRt: 2.2 },
  studio: { base: 0.28, lfMult: 1.25, ringHz: null, ringRt: 0 },
  theater: { base: 1.3, lfMult: 1.4, ringHz: null, ringRt: 0 },
  living: { base: 0.55, lfMult: 1.9, ringHz: 110, ringRt: 1.6 },
};
const REVERB_RT: Record<ReverbKey, { rtAt1k: number; lfMult: number; hfMult: number }> = {
  none: { rtAt1k: 0, lfMult: 1, hfMult: 1 },
  room: { rtAt1k: 0.5, lfMult: 1.3, hfMult: 0.7 },
  plate: { rtAt1k: 1.8, lfMult: 0.9, hfMult: 1.05 },
  hall: { rtAt1k: 2.6, lfMult: 1.5, hfMult: 0.55 },
  spring: { rtAt1k: 1.4, lfMult: 0.7, hfMult: 0.5 },
};

/** RT60(f) for the configured scene — the decay half of the mountain. */
export function waterfallRt(opts: WaterfallOpts, f: number): number {
  const r = ROOM_RT[opts.room];
  const lg = Math.log10(f);
  let rt = r.base * (f < 250 ? 1 + (r.lfMult - 1) * (Math.log10(250) - lg) : f > 2000 ? Math.max(0.45, 1 - 0.28 * (lg - Math.log10(2000))) : 1);
  // Damping eats HF first, then mids, lows resist (why bass traps exist).
  const dampEff = opts.damping01 * (f > 500 ? 1 : f > 120 ? 0.7 : 0.35);
  // Max reduction 0.78 -> 0.55 (owner 2026-08-28: "no room can be that short
  // with no reverb tail"). At 0.78, full treatment drove a STUDIO to 0.08 s at
  // 1 kHz, which is anechoic-chamber territory, not a room -- and it made the
  // waterfall's decay vanish in a couple of slices. Treatment cannot take a
  // real room below roughly half its untreated RT60 across the band; absorbers
  // stop being effective long before the reverberant field disappears.
  rt *= 1 - 0.55 * dampEff;
  if (r.ringHz) {
    const g = Math.exp(-Math.pow((lg - Math.log10(r.ringHz)) / 0.035, 2));
    rt = Math.max(rt, r.ringRt * (1 - 0.55 * opts.damping01 * 0.35) * g + rt * (1 - g));
  }
  if (opts.qRing) {
    const g = Math.exp(-Math.pow((lg - Math.log10(1200)) / 0.012, 2));
    rt = Math.max(rt, 2.8 * g + rt * (1 - g));
  }
  if (opts.reverb !== 'none') {
    const rv = REVERB_RT[opts.reverb];
    const mult = f < 400 ? rv.lfMult : f > 3000 ? rv.hfMult : 1;
    rt = Math.max(rt, rv.rtAt1k * mult);
  }
  // Floor 0.08 -> 0.15 s. A heavily treated vocal booth measures ~0.15-0.25 s;
  // below ~0.1 s you are describing an anechoic chamber, which is not one of
  // the rooms this lab models. The floor is a REALISM clamp, not a safety one.
  return Math.max(0.15, rt);
}

/** Initial (t=0) excitation spectrum in dB — impulse through the EQ. */
export function waterfallSpectrumDb(opts: WaterfallOpts, f: number): number {
  const lg = Math.log10(f);
  let v = -4 - 5 * Math.abs(lg - Math.log10(500)) * 0.6; // gentle broadband impulse
  v += opts.eqBoostDb * Math.exp(-Math.pow((lg - Math.log10(250)) / 0.09, 2));
  if (opts.qRing) v += 7 * Math.exp(-Math.pow((lg - Math.log10(1200)) / 0.012, 2));
  return v;
}

/**
 * The RINGING RIDGE: the slowest-decaying frequency, and how far it stands
 * above the median of the range.
 *
 * ONE detector, shared by everything that points at it — the waterfall's on-plot
 * "RINGS <f>" mark, the bezel's RIDGE readout, and the EQ fader's purple tint.
 * They previously sampled RT60 on DIFFERENT grids (the plot on 140 points from
 * 20 Hz–20 kHz, the bezel on 240 from 40 Hz–12 kHz) and could genuinely
 * disagree: with CLASSROOM + Q RING the coarser grid under-resolved the 1.2 kHz
 * filter ring and named 252 Hz while the finer one named 1214 Hz. Three UI
 * elements pointing at two different frequencies is worse than none of them
 * pointing at all, so the grid now lives here, once.
 */
export function waterfallRidge(opts: WaterfallOpts): { f: number; ratio: number } {
  const N = 240;
  const lgLo = Math.log10(40);
  const lgHi = Math.log10(12000);
  const rts: number[] = [];
  let fMax = 40;
  let rtMax = 0;
  for (let i = 0; i < N; i++) {
    const f = Math.pow(10, lgLo + ((lgHi - lgLo) * i) / (N - 1));
    const rt = waterfallRt(opts, f);
    rts.push(rt);
    if (rt > rtMax) {
      rtMax = rt;
      fMax = f;
    }
  }
  const sorted = [...rts].sort((a, b) => a - b);
  return { f: fMax, ratio: rtMax / Math.max(0.01, sorted[Math.floor(N / 2)]) };
}

/** A ridge is only worth pointing at when it genuinely stands apart. */
export const RIDGE_CALLOUT_RATIO = 1.5;

/** Frequencies sampled when sizing the plot's time window. */
const RT_PROBE_HZ = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

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
  // controls, and one global pin is not physically possible: the scenes span
  // 0.28 s (damped studio) to 6.7 s (cathedral), 24x. Avoiding overflow needs
  // >= 7.3 s; showing a studio's decay in more than a handful of slices needs
  // <= 3.1 s. The bounds cross by 2.4x, so any single fixed window either
  // buries a dead room in one slice or clips a live one off the front edge.
  const untreated: WaterfallOpts = { ...opts, damping01: 0 };
  let maxRt = 0;
  for (const f of RT_PROBE_HZ) maxRt = Math.max(maxRt, waterfallRt(untreated, f));
  const needed = maxRt * 1.25;
  const STEPS = [0.3, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 10];
  return STEPS.find((s) => s >= needed) ?? STEPS[STEPS.length - 1];
}

/** Whole-number-ish floor division marks that fit inside `span`. */
export function waterfallTimeDivisions(span: number): number[] {
  // Aim for 2-4 marks: enough to read a duration off the floor, few enough
  // that the chrome stays quieter than the data.
  const step = span <= 0.5 ? 0.2 : span <= 1 ? 0.25 : span <= 2 ? 0.5 : span <= 4 ? 1 : 2;
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
