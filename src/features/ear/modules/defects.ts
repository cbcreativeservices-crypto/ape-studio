/**
 * M5 — Audio Defect Recognition (Wave 4, spec §2): the twelve problems every
 * engineer must name on the first listen. Solo at L1–L2, buried under a
 * rendered program bed at L3–L4. Ground loop and RF are labeled
 * "(emulation)". All copy NEW COPY — owner review.
 */
import {
  SR, harmonicComplex, whiteNoise, hum, buzz, crackle, dropout,
  digitalGlitch, rfInterference, clip, normalizePeak, applyBiquad, highShelf,
  rmsDb, gainDb, type Mono,
} from '../earDsp';
import type { EarModule } from '../earTypes';
import { rngFor, pickInt, drumPattern, present, type Rng } from './common';

/** Program bed: chord pad + soft drum pulse — a rendered surrogate. */
function bed(rng: Rng): Mono {
  const drums = drumPattern(1, rng);
  const out = new Float32Array(drums.length);
  const chord = [220, 277.2, 329.6].map((f) => harmonicComplex(f, drums.length / SR, 0.8));
  for (let i = 0; i < out.length; i++) {
    out[i] = drums[i] * 0.45 + (chord[0][i] + chord[1][i] + chord[2][i]) * 0.14;
  }
  return out;
}

const silence = (seconds: number) => new Float32Array(Math.round(seconds * SR));

type Defect = {
  key: string;
  label: string;
  truth: string;
  /** Renders the defect SOLO (its own sound, or applied to a quiet pad). */
  solo: (rng: Rng) => Mono;
  /** Applies/adds the defect to a program bed at the given mix level. */
  onBed: (b: Mono, rng: Rng, mixDb: number) => Mono;
  confusableWith?: string[];
  core?: boolean; // in the L1 six
};

/** Add `sig` under `b` at mixDb relative to the bed's RMS. */
function addUnder(b: Mono, sig: Mono, mixDb: number): Mono {
  const g = Math.pow(10, (rmsDb(b) + mixDb - rmsDb(sig)) / 20);
  const out = Float32Array.from(b);
  for (let i = 0; i < out.length && i < sig.length; i++) out[i] += sig[i] * g;
  return out;
}

function groundLoop(seconds: number, mains: 50 | 60): Mono {
  // Rectified hum: dominant 2× mains + rich even harmonics (emulation).
  const h = hum(seconds, mains, 2);
  const out = new Float32Array(h.length);
  let mean = 0;
  for (let i = 0; i < h.length; i++) mean += Math.abs(h[i]);
  mean /= h.length;
  for (let i = 0; i < h.length; i++) out[i] = Math.abs(h[i]) - mean;
  return out;
}

function pop(rng: Rng): Mono {
  const out = silence(1.6);
  const at = Math.round((0.4 + rng() * 0.7) * SR);
  const f = 40 + rng() * 20;
  const len = Math.round(0.03 * SR);
  for (let i = 0; i < len; i++) out[at + i] = Math.sin((Math.PI * i) / len) * Math.sin((2 * Math.PI * f * i) / SR + Math.PI / 2) * 0.9;
  return out;
}

function click(rng: Rng): Mono {
  const out = silence(1.6);
  const at = Math.round((0.4 + rng() * 0.7) * SR);
  const n = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) out[at + i] = (rng() < 0.5 ? -1 : 1) * 0.9;
  return out;
}

function hissSig(rng: Rng): Mono {
  return applyBiquad(gainDb(whiteNoise(1.6, rng), -12), highShelf(3000, 4));
}

const mains = (rng: Rng): 50 | 60 => (rng() < 0.5 ? 50 : 60);

const DEFECTS: Defect[] = [
  {
    key: 'hum', label: 'Hum', core: true, confusableWith: ['ground'],
    truth: 'Mains hum — 50/60 Hz with a couple of soft harmonics. Smooth and low.',
    solo: (rng) => hum(1.6, mains(rng), 3),
    onBed: (b, rng, mix) => addUnder(b, hum(b.length / SR, mains(rng), 3), mix),
  },
  {
    key: 'ground', label: 'Ground loop (emulation)', confusableWith: ['hum'],
    truth: 'Ground-loop buzz (emulation) — rectification doubles the mains tone and stacks even harmonics.',
    solo: (rng) => groundLoop(1.6, mains(rng)),
    onBed: (b, rng, mix) => addUnder(b, groundLoop(b.length / SR, mains(rng)), mix),
  },
  {
    key: 'buzz', label: 'Buzz',
    truth: 'Buzz — mains-rate but harmonic-rich to 5 kHz. Edgy where hum is smooth.',
    solo: (rng) => buzz(1.6, mains(rng)),
    onBed: (b, rng, mix) => addUnder(b, buzz(b.length / SR, mains(rng)), mix),
  },
  {
    key: 'hiss', label: 'Hiss', core: true,
    truth: 'Broadband hiss with a gentle presence tilt — the classic noise floor.',
    solo: (rng) => hissSig(rng),
    onBed: (b, rng, mix) => addUnder(b, hissSig(rng), mix),
  },
  {
    key: 'crackle', label: 'Crackle', confusableWith: ['click'],
    truth: 'Crackle — a steady rain of small random impulses (dirty pot, dying cable).',
    solo: (rng) => crackle(silence(1.6), rng, 0.0004, 0.8),
    onBed: (b, rng, mix) => addUnder(b, crackle(silence(b.length / SR), rng, 0.0004, 0.8), mix),
  },
  {
    key: 'pop', label: 'Pop',
    truth: 'One low thump — a 30 ms half-cosine at 40–60 Hz. Think plosive or patch-while-hot.',
    solo: pop,
    onBed: (b, rng, mix) => addUnder(b, pop(rng), mix + 10),
  },
  {
    key: 'click', label: 'Click', core: true, confusableWith: ['crackle'],
    truth: 'A single full-band click, a couple of samples long — an edit point or timing glitch.',
    solo: click,
    onBed: (b, rng, mix) => addUnder(b, click(rng), mix + 10),
  },
  {
    key: 'distortion', label: 'Distortion', core: true, confusableWith: ['clipping'],
    truth: 'Soft-saturation distortion of the program itself — harmonics thicken everything.',
    solo: (rng) => clip(normalizePeak(bed(rng)), 'soft', 6 + rng() * 12),
    onBed: (b, rng) => clip(normalizePeak(b), 'soft', 6 + rng() * 12),
  },
  {
    key: 'clipping', label: 'Clipping', core: true, confusableWith: ['distortion'],
    truth: 'Hard clipping — the peaks slam a ceiling and shear off. Harsher than saturation.',
    solo: (rng) => clip(normalizePeak(bed(rng)), 'hard', 5),
    onBed: (b) => clip(normalizePeak(b), 'hard', 5),
  },
  {
    key: 'dropout', label: 'Dropout', core: true,
    truth: 'A moment of program simply missing — 80–300 ms of silence with fast fades.',
    solo: (rng) => dropout(bed(rng), 0.6 + rng() * 0.8, 80 + rng() * 220),
    onBed: (b, rng) => dropout(b, 0.6 + rng() * 0.8, 80 + rng() * 220),
  },
  {
    key: 'glitch', label: 'Digital glitch',
    truth: 'Buffer stutter — a slice of audio repeats itself for a few blocks.',
    solo: (rng) => digitalGlitch(bed(rng), rng, 3),
    onBed: (b, rng) => digitalGlitch(b, rng, 3),
  },
  {
    key: 'rf', label: 'RF interference (emulation)',
    truth: 'RF pickup (emulation) — pulsed bursts of a buzzy carrier, the old GSM-near-a-cable sound.',
    solo: (rng) => rfInterference(silence(1.6), rng),
    onBed: (b, rng, mix) => addUnder(b, rfInterference(silence(b.length / SR), rng), mix + 6),
  },
];

export const M5_DEFECTS: EarModule = {
  id: 'defect',
  num: '5',
  title: 'Audio Defect Recognition',
  blurb: 'Hum, buzz, hiss, crackle, clicks, clipping, dropouts — name the problem on the first listen.',
  phones: 'any',
  playbackNote: 'Hum fundamentals are weak on phone speakers — the harmonics carry it.',
  levels: 4,
  levelNames: ['Six common defects, solo', 'All twelve, solo', 'Under a program bed (−20 dB)', 'Buried (−32 dB)'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const deck = level <= 1 ? DEFECTS.filter((d) => d.core) : DEFECTS;
    const idx = pickInt(rng, deck.length);
    const d = deck[idx];
    const buf =
      level <= 2 ? present(d.solo(rng)) : present(d.onBed(bed(rng), rng, level === 3 ? -20 : -32));
    const near =
      level <= 2 && d.confusableWith
        ? d.confusableWith.map((k) => deck.findIndex((x) => x.key === k)).filter((i) => i >= 0)
        : undefined;
    const tonal = ['hum', 'ground', 'buzz', 'hiss', 'rf', 'distortion', 'clipping'].includes(d.key);
    return {
      clips: [{ label: '▶', buf }],
      question: level <= 2 ? 'What problem do you hear?' : 'What problem is hiding in the program?',
      answers: deck.map((x) => ({ label: x.label })),
      correct: idx,
      near: near && near.length ? near : undefined,
      reveal: `${d.truth}${level >= 3 ? ' (The bed is a rendered surrogate.)' : ''}`,
      seeIt: tonal
        ? {
            kind: 'spectrum',
            clips: [0],
            caption: 'Tonal defects leave fingerprints — mains harmonics, tilted floors, harmonic spray.',
          }
        : {
            kind: 'wave',
            clips: [0],
            caption: 'Impulsive and time-domain defects show in the envelope — spikes, stutters, holes.',
          },
    };
  },
};
