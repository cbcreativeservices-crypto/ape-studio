/**
 * Tone-family ear modules — Wave 1 (spec §2 M1–M4):
 *   M1 Frequency Recognition · M2 EQ Recognition · M3 Band Identification ·
 *   M4 Noise & Waveform Identification.
 *
 * Pure trial factories: everything audible AND everything drawn comes from the
 * same rendered buffers. All copy is NEW COPY — owner review.
 */
import {
  sine, classicWave, harmonicComplex, whiteNoise, pinkNoise, brownNoise,
  peakEq, lowShelf, highShelf, applyBiquad, bandDb, type Biquad, type Mono,
} from '../earDsp';
import type { EarModule, EarTrial } from '../earTypes';
import {
  rngFor, pickInt, choice, shuffled, ISO_THIRDS, ISO_OCTAVES, ISO_HALVES,
  hzLabel, present, presentTone, lfMakeupDb, type Rng,
} from './common';

// ————————————————————————————— M1 · Frequency —————————————————————————————

const TONE_SEC = 1.5;

function m1Pool(level: number, subBassOk: boolean): number[] {
  const pool = level <= 1 ? ISO_OCTAVES : level === 2 ? ISO_HALVES : [...ISO_THIRDS];
  return subBassOk ? [...pool] : pool.filter((f) => f > 80);
}

function m1Tone(freq: number, rng: Rng, seconds = TONE_SEC): Mono {
  return presentTone(sine(freq, seconds, rng() * Math.PI * 2), freq);
}

function m1NameTheBand(level: number, rng: Rng, subBassOk: boolean): EarTrial {
  const pool = m1Pool(level, subBassOk);
  const idx = pickInt(rng, pool.length);
  const freq = pool[idx];
  const makeup = lfMakeupDb(freq);
  return {
    clips: [{ label: '▶', buf: m1Tone(freq, rng) }],
    question: 'Which frequency is this tone?',
    answers: pool.map((f) => ({ label: hzLabel(f) })),
    correct: idx,
    near: level === 3 ? [idx - 1, idx + 1].filter((i) => i >= 0 && i < pool.length) : undefined,
    reveal:
      `${hzLabel(freq)} sine, 1.5 s.` +
      (makeup > 0
        ? ` Low tones get +${makeup.toFixed(1)} dB makeup here — an equal-loudness approximation, not a calibration.`
        : ''),
    seeIt: {
      kind: 'spectrum',
      clips: [0],
      highlightHz: freq,
      caption: `A pure sine puts all its energy in one place: ${hzLabel(freq)}.`,
    },
  };
}

function m1HigherLower(level: number, rng: Rng, subBassOk: boolean): EarTrial {
  // Ladder: 2 octaves → 1 → 1/3 → 1/6 apart.
  const stepThirds = [6, 3, 1, 0.5][Math.min(level, 4) - 1];
  const pool = m1Pool(4, subBassOk); // full grid for placement
  const span = Math.max(1, Math.round(stepThirds));
  const i0 = pickInt(rng, pool.length - span);
  const f1 = pool[i0];
  // 1/6-octave case: nudge by ~12% off-grid so the pair is genuinely 1/6 apart.
  const f2 = stepThirds >= 1 ? pool[i0 + span] : f1 * Math.pow(2, 1 / 6);
  const firstHigher = rng() < 0.5;
  const [a, b] = firstHigher ? [f2, f1] : [f1, f2];
  return {
    clips: [
      { label: 'A', buf: m1Tone(a, rng) },
      { label: 'B', buf: m1Tone(b, rng) },
    ],
    question: 'Which tone is higher?',
    answers: [{ label: 'A is higher' }, { label: 'B is higher' }],
    correct: firstHigher ? 0 : 1,
    reveal: `A = ${hzLabel(Math.round(a))}, B = ${hzLabel(Math.round(b))}.`,
    seeIt: {
      kind: 'spectrum',
      clips: [0, 1],
      caption: 'Two sines — the higher peak sits further right on the log axis.',
    },
  };
}

function m1FindTarget(level: number, rng: Rng, subBassOk: boolean): EarTrial {
  const pool = m1Pool(level, subBassOk);
  const targetIdx = pickInt(rng, pool.length);
  const target = pool[targetIdx];
  const others = shuffled(rng, pool.filter((_, i) => i !== targetIdx)).slice(0, 2);
  const order = shuffled(rng, [target, ...others]);
  const correct = order.indexOf(target);
  return {
    clips: order.map((f, i) => ({ label: 'ABC'[i], buf: m1Tone(f, rng) })),
    question: `Which clip is ${hzLabel(target)}?`,
    answers: order.map((_, i) => ({ label: `Clip ${'ABC'[i]}` })),
    correct,
    reveal: order.map((f, i) => `${'ABC'[i]} = ${hzLabel(f)}`).join(' · '),
    seeIt: {
      kind: 'spectrum',
      clips: [0, 1, 2],
      highlightHz: target,
      caption: `The target band is highlighted — one clip's peak lands in it.`,
    },
  };
}

export const M1_FREQUENCY: EarModule = {
  id: 'frequency',
  num: '1',
  title: 'Frequency Recognition',
  blurb: 'Name pure tones on the ISO third-octave grid — the ear-training bedrock.',
  phones: 'recommended',
  playbackNote: '63–80 Hz is genuinely absent on phone speakers.',
  levels: 4,
  levelNames: ['Octave centers', 'Half-octave grid', 'Third-octave, near credit', 'Third-octave, exact'],
  hasSubBassTrials: true,
  makeTrial: (level, seed, opts) => {
    const rng = rngFor(seed);
    const subBassOk = opts?.subBassOk !== false;
    const kind = pickInt(rng, 3);
    if (kind === 1) return m1HigherLower(level, rng, subBassOk);
    if (kind === 2) return m1FindTarget(level, rng, subBassOk);
    return m1NameTheBand(level, rng, subBassOk);
  },
};

// ————————————————————————————— M2 · EQ ————————————————————————————————————

/** Program-material surrogate (spec: V2 = real stems, marked). */
function eqSource(rng: Rng, seconds = 1.6): Mono {
  return rng() < 0.5
    ? pinkNoise(seconds, rng)
    : harmonicComplex(110 * Math.pow(2, rng()), seconds, 1);
}

type EqMove = { filter: Biquad; freq: number; gain: number; shape: 'peak' | 'shelf' | 'narrow' };

function eqMove(level: number, rng: Rng): EqMove {
  const amounts = [12, 9, 6, 3];
  const gainMag = amounts[Math.min(level, 4) - 1];
  // Boosts before cuts at each level (cuts are measurably harder — Bech).
  const boost = level <= 1 ? true : rng() < 0.55;
  const gain = boost ? gainMag : -gainMag;
  const centers = ISO_OCTAVES.filter((f) => f >= 125 && f <= 8000);
  const freq = choice(rng, centers);
  if (level >= 3 && rng() < 0.3) {
    // Shelves join the deck at L3 (spec ladder).
    const lowSide = freq <= 500;
    return {
      filter: lowSide ? lowShelf(freq, gain) : highShelf(freq, gain),
      freq, gain, shape: 'shelf',
    };
  }
  const narrow = level >= 3 && rng() < 0.35;
  return { filter: peakEq(freq, gain, narrow ? 4.0 : 1.4), freq, gain, shape: narrow ? 'narrow' : 'peak' };
}

function shapeName(m: EqMove): string {
  return m.shape === 'shelf' ? (m.freq <= 500 ? 'low shelf' : 'high shelf') : m.shape === 'narrow' ? 'narrow bell (Q 4.0)' : 'wide bell (Q 1.4)';
}

export const M2_EQ: EarModule = {
  id: 'eq',
  num: '2',
  title: 'EQ Recognition',
  blurb: 'A/B one EQ move on the same source — name the frequency, direction, and amount.',
  phones: 'recommended',
  playbackNote: 'Low-shelf trials need real low-frequency extension.',
  levels: 4,
  levelNames: ['±12 dB wide boosts', '±9 dB boost + cut', '±6 dB, shelves + narrow', '±3 dB, all filter types'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    // A harmonic-complex source has DISCRETE partials — an EQ centre can land
    // where the source has no energy, making the "change" inaudible. So the
    // factory MEASURES its own render and re-rolls until the stated move is
    // genuinely in the sound (≥60% of the stated dB at the centre, right sign).
    let src = eqSource(rng);
    let move = eqMove(level, rng);
    let dry = present(src);
    let wet = present(applyBiquad(src, move.filter));
    for (let attempt = 0; attempt < 6; attempt++) {
      const c = Math.min(move.freq, 16000);
      const delta = bandDb(wet, c, 0.33) - bandDb(dry, c, 0.33);
      if (Math.sign(delta) === Math.sign(move.gain) && Math.abs(delta) >= Math.abs(move.gain) * 0.6) break;
      // Last resort is pink noise — continuous spectrum, always verifies.
      src = attempt >= 4 ? pinkNoise(1.6, rng) : eqSource(rng);
      move = eqMove(level, rng);
      dry = present(src);
      wet = present(applyBiquad(src, move.filter));
    }
    const reveal = `${move.gain > 0 ? '+' : ''}${move.gain} dB ${shapeName(move)} at ${hzLabel(move.freq)} — loudness re-matched so only tone changed.`;
    const q = pickInt(rng, 3);
    const base = {
      clips: [
        { label: 'A', buf: dry },
        { label: 'B', buf: wet },
      ],
      reveal,
      seeIt: {
        kind: 'spectrum' as const,
        clips: [0, 1],
        highlightHz: move.freq,
        caption: 'Dry vs processed spectra — the EQ move is the gap between the curves.',
      },
    };
    if (q === 0) {
      const centers = ISO_OCTAVES.filter((f) => f >= 125 && f <= 8000);
      const idx = centers.indexOf(move.freq);
      return {
        ...base,
        question: 'B has one EQ move. Around which frequency?',
        answers: centers.map((f) => ({ label: hzLabel(f) })),
        correct: idx,
        near: [idx - 1, idx + 1].filter((i) => i >= 0 && i < centers.length),
      };
    }
    if (q === 1) {
      return {
        ...base,
        question: 'Is B boosted or cut?',
        answers: [{ label: 'Boost' }, { label: 'Cut' }],
        correct: move.gain > 0 ? 0 : 1,
      };
    }
    const steps = [3, 6, 9, 12];
    const idx = steps.indexOf(Math.abs(move.gain));
    return {
      ...base,
      question: 'By about how much?',
      answers: steps.map((s) => ({ label: `${s} dB` })),
      correct: idx,
      near: level <= 2 ? [idx - 1, idx + 1].filter((i) => i >= 0 && i < steps.length) : undefined,
    };
  },
};

// ————————————————————————————— M3 · Band ID ———————————————————————————————

type Band = { label: string; lo: number; hi: number; c: number; coarse: boolean };
export const BANDS: Band[] = [
  { label: 'Sub Bass', lo: 20, hi: 60, c: 35, coarse: false },
  { label: 'Bass', lo: 60, hi: 250, c: 122, coarse: true },
  { label: 'Low Mid', lo: 250, hi: 500, c: 354, coarse: false },
  { label: 'Mid', lo: 500, hi: 2000, c: 1000, coarse: true },
  { label: 'Upper Mid', lo: 2000, hi: 4000, c: 2830, coarse: false },
  { label: 'Presence', lo: 4000, hi: 6000, c: 4900, coarse: true },
  { label: 'Brilliance', lo: 6000, hi: 16000, c: 9800, coarse: true },
  { label: 'Air', lo: 16000, hi: 22000, c: 17500, coarse: false },
];

export const M3_BAND: EarModule = {
  id: 'band',
  num: '3',
  title: 'Band Identification',
  blurb: 'Hear which of the 8 named bands an EQ move landed in — mixing vocabulary.',
  phones: 'recommended',
  playbackNote: 'Sub Bass and Air trials are flagged; sub-bass toggle offered.',
  levels: 4,
  levelNames: ['±12 dB, 4 coarse bands', '±9 dB, all 8 bands', '±6 dB, all 8', '±4 dB, exact only'],
  hasSubBassTrials: true,
  makeTrial: (level, seed, opts) => {
    const rng = rngFor(seed);
    const subBassOk = opts?.subBassOk !== false;
    const deck = (level <= 1 ? BANDS.filter((b) => b.coarse) : BANDS).filter(
      (b) => subBassOk || b.lo >= 60,
    );
    const idx = pickInt(rng, deck.length);
    const band = deck[idx];
    const gainMag = [12, 9, 6, 4][Math.min(level, 4) - 1];
    const gain = rng() < 0.6 ? gainMag : -gainMag;
    // Q sized to band width so the move fills the named region.
    const q = Math.max(0.7, band.c / (band.hi - band.lo));
    const src = eqSource(rng);
    const dry = present(src);
    const wet = present(applyBiquad(src, peakEq(Math.min(band.c, 16000), gain, q)));
    return {
      clips: [
        { label: 'A', buf: dry },
        { label: 'B', buf: wet },
      ],
      question: 'What area changed from A to B?',
      answers: deck.map((b) => ({ label: b.label })),
      correct: idx,
      near:
        level <= 3
          ? [idx - 1, idx + 1].filter((i) => i >= 0 && i < deck.length)
          : undefined,
      reveal: `${gain > 0 ? '+' : ''}${gain} dB in ${band.label} (${hzLabel(band.lo)}–${hzLabel(band.hi)}), centred near ${hzLabel(band.c)}.`,
      seeIt: {
        kind: 'spectrum',
        clips: [0, 1],
        bands: deck.map((b) => ({ label: b.label, lo: b.lo, hi: b.hi })),
        highlightHz: band.c,
        caption: 'The changed region glows — match the name to the place on the axis.',
      },
    };
  },
};

// ————————————————————————— M4 · Noise & Waveform ——————————————————————————

type M4Kind = 'white' | 'pink' | 'brown' | 'sine' | 'square' | 'saw' | 'triangle';
const M4_ALL: M4Kind[] = ['white', 'pink', 'brown', 'sine', 'square', 'saw', 'triangle'];
const M4_LABEL: Record<M4Kind, string> = {
  white: 'White noise', pink: 'Pink noise', brown: 'Brown noise',
  sine: 'Sine wave', square: 'Square wave', saw: 'Sawtooth wave', triangle: 'Triangle wave',
};
const M4_TRUTH: Record<M4Kind, string> = {
  white: 'White noise — flat energy per Hz.',
  pink: 'Pink noise — −3 dB per octave, equal energy per octave.',
  brown: 'Brown noise — about −6 dB per octave, all rumble.',
  sine: 'Sine — one partial, nothing else.',
  square: 'Square — odd harmonics, hollow and buzzy.',
  saw: 'Sawtooth — every harmonic, bright and brassy.',
  triangle: 'Triangle — odd harmonics falling fast, soft and flute-like.',
};

function m4Render(kind: M4Kind, rng: Rng, seconds: number): Mono {
  const f0 = 200 * Math.pow(4, rng()); // 200–800 Hz, fresh each trial
  switch (kind) {
    case 'white': return present(whiteNoise(seconds, rng));
    case 'pink': return present(pinkNoise(seconds, rng));
    case 'brown': return present(brownNoise(seconds, rng));
    case 'sine': return present(sine(f0, seconds));
    default: return present(classicWave(kind, f0, seconds));
  }
}

export const M4_NOISE: EarModule = {
  id: 'noise',
  num: '4',
  title: 'Noise & Waveform ID',
  blurb: 'White, pink, brown — sine, square, saw, triangle. Learn the seven basic colors of sound.',
  phones: 'any',
  playbackNote: 'Spectral slopes survive even small speakers.',
  levels: 3,
  levelNames: ['Noises vs tones, separated', 'All 7 mixed', 'Short clips + which-is-pink pairs'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const seconds = level >= 3 ? 0.8 : 1.2;
    if (level >= 3 && rng() < 0.35) {
      // A/B "which is pink?" against its neighbours on the slope.
      const other = choice(rng, ['white', 'brown'] as const);
      const pinkFirst = rng() < 0.5;
      const order: M4Kind[] = pinkFirst ? ['pink', other] : [other, 'pink'];
      return {
        clips: order.map((k, i) => ({ label: 'AB'[i], buf: m4Render(k, rng, seconds) })),
        question: 'Which clip is pink noise?',
        answers: [{ label: 'A' }, { label: 'B' }],
        correct: pinkFirst ? 0 : 1,
        reveal: `${M4_TRUTH.pink} The other clip was ${M4_LABEL[other].toLowerCase()}.`,
        seeIt: {
          kind: 'spectrum',
          clips: [0, 1],
          caption: 'Flat = white, −3 dB/oct = pink, −6 dB/oct = brown. Read the slope.',
        },
      };
    }
    const deck: M4Kind[] =
      level <= 1
        ? rng() < 0.5
          ? ['white', 'pink', 'brown']
          : ['sine', 'square', 'saw', 'triangle']
        : M4_ALL;
    const idx = pickInt(rng, deck.length);
    const kind = deck[idx];
    return {
      clips: [{ label: '▶', buf: m4Render(kind, rng, seconds) }],
      question: 'What are you hearing?',
      answers: deck.map((k) => ({ label: M4_LABEL[k] })),
      correct: idx,
      reveal: M4_TRUTH[kind],
      seeIt: {
        kind: 'spectrum',
        clips: [0],
        caption:
          kind === 'white' || kind === 'pink' || kind === 'brown'
            ? 'Noise is a slope: flat / −3 / −6 dB per octave.'
            : 'Tones are harmonic stacks — the pattern of partials is the timbre.',
      },
    };
  },
};
