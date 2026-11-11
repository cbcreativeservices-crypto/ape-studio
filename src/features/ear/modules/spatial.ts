/**
 * M6 — Stereo Recognition (Wave 4, spec §2). HEADPHONES REQUIRED: the shell
 * shows the blocking acknowledgment before scoring counts.
 *
 * Honesty notes baked into copy: a single centered source IS mono
 * (correlation 1.0) — we teach that rather than pretending to separate the
 * two; and on headphones out-of-phase reads as "in-head/diffuse", not the
 * speaker-world cancellation.  All copy NEW COPY — owner review.
 */
import {
  pinkNoise, sine, fadeEdges, rms, pan, toStereo, width, decorrelate,
  invertChannel, type Mono, type Stereo,
} from '../earDsp';
import type { EarModule } from '../earTypes';
import { rngFor, pickInt, type Rng } from './common';

/** Loudness-match a stereo buffer: one shared gain to −20 dBFS mean energy. */
function presentStereo(s: Stereo, targetDb = -20): Stereo {
  const e = (rms(s.l) ** 2 + rms(s.r) ** 2) / 2;
  const g = Math.pow(10, (targetDb - 10 * Math.log10(Math.max(e, 1e-12))) / 20);
  const scale = (x: Mono) => {
    const out = Float32Array.from(x);
    for (let i = 0; i < out.length; i++) out[i] *= g;
    return fadeEdges(out);
  };
  return { l: scale(s.l), r: scale(s.r) };
}

/**
 * Set the side level against the mid, in dB of energy (D41 #25/#27). The
 * decorrelated bed already carries MORE side than mid (corr ≈ −0.2), so a
 * fixed width factor above 1 pushed "Wide" to corr −0.6…−0.9 — the out-of-
 * phase warning shape. Measuring the bed and solving for the factor makes the
 * result the same on every seed: with M and S uncorrelated,
 * corr = (1 − 10^(sideDb/10)) / (1 + 10^(sideDb/10)), so −3 dB → +0.33,
 * −4 dB → +0.43, −7.5 dB → +0.70, −8 dB → +0.73.
 */
function sideAt(s: Stereo, sideDb: number): Stereo {
  let em = 0, es = 0;
  for (let i = 0; i < s.l.length; i++) {
    em += ((s.l[i] + s.r[i]) / 2) ** 2;
    es += ((s.l[i] - s.r[i]) / 2) ** 2;
  }
  return width(s, Math.sqrt((Math.pow(10, sideDb / 10) * em) / Math.max(es, 1e-12)));
}

/** "Wide": side 3 dB under the mid — a broad cloud, still mono-safe (corr ≈ +0.33). */
export const WIDE_SIDE_DB = -3;
/** Level-4 "Which clip is wider?" pairs, [wider, narrower] side dB. The ~4 dB
 *  gaps match the old factor pairs' difficulty; every clip stays positive. */
export const WIDER_PAIRS_SIDE_DB: ReadonlyArray<readonly [number, number]> = [[-3, -7.5], [-4, -8]];

/** Pink burst + tone mix (spec's M6 source). */
function scene(rng: Rng): Mono {
  const seconds = 1.4;
  const noise = pinkNoise(seconds, rng);
  const tone = sine(330 * Math.pow(2, rng() * 0.8), seconds);
  const out = new Float32Array(noise.length);
  for (let i = 0; i < out.length; i++) out[i] = noise[i] * 0.6 + tone[i] * 0.35;
  return out;
}

type M6Variant = { key: string; label: string; truth: string; make: (m: Mono, rng: Rng) => Stereo };
const VARIANTS: M6Variant[] = [
  {
    key: 'left', label: 'Left',
    truth: 'Panned far left (constant-power) — the right ear still gets the sound, about 18 dB quieter.',
    make: (m) => pan(m, -0.85),
  },
  {
    key: 'right', label: 'Right',
    truth: 'Panned far right — the mirror image.',
    make: (m) => pan(m, 0.85),
  },
  {
    key: 'center', label: 'Centered (mono)',
    truth: 'Identical channels — a single centered source IS mono: correlation 1.0. Same thing, two names.',
    make: (m) => toStereo(m),
  },
  {
    key: 'wide', label: 'Wide',
    truth: 'Decorrelated side content raised to about 3 dB under the mid — the image spills outward, yet the sides still agree more than they differ (correlation about +0.3), so it stays mono-safe.',
    make: (m) => sideAt(decorrelate(m), WIDE_SIDE_DB),
  },
  {
    key: 'narrow', label: 'Narrow',
    // The decorrelated bed is unusually wide to begin with, so the factor is
    // lower than the spec's nominal −8 dB to actually SOUND narrow (the
    // harness measures side ≤ −12 dB and correlation ≥ 0.8).
    truth: 'Side content pulled way down — the image huddles around the middle.',
    make: (m) => width(decorrelate(m), 0.18),
  },
  {
    key: 'oop', label: 'Out of phase',
    truth: 'One channel polarity-flipped: correlation −1. On headphones it feels in-head and diffuse; the dramatic cancellation is a SPEAKER phenomenon.',
    make: (m) => invertChannel(toStereo(m), 'r'),
  },
];

export const M6_STEREO: EarModule = {
  id: 'stereo',
  num: '6',
  title: 'Stereo Recognition',
  blurb: 'Left, right, centered, wide, narrow, out of phase — read the image with your eyes closed.',
  phones: 'required',
  playbackNote: 'Phone speakers collapse the image — scoring needs headphones.',
  // NEW COPY
  listenFor: 'Close your eyes. Where is the sound: one side, dead center, spread wide, huddled in the middle, or floating inside your head?',
  levels: 4,
  levelNames: ['Left / right / centered', '+ wide / narrow', '+ out of phase', 'Which is wider?'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const m = scene(rng);
    if (level >= 4) {
      const base = decorrelate(m);
      const sides = rng() < 0.5 ? WIDER_PAIRS_SIDE_DB[0] : WIDER_PAIRS_SIDE_DB[1];
      const wideFirst = rng() < 0.5;
      const a = presentStereo(sideAt(base, wideFirst ? sides[0] : sides[1]));
      const b = presentStereo(sideAt(base, wideFirst ? sides[1] : sides[0]));
      return {
        clips: [
          { label: 'A', buf: a },
          { label: 'B', buf: b },
        ],
        question: 'Which clip is wider?',
        answers: [{ label: 'A' }, { label: 'B' }],
        correct: wideFirst ? 0 : 1,
        reveal: 'Same scene, different mid/side ratio — here, width is set by the side level against the mid.',
        seeIt: {
          kind: 'gonio',
          clips: [0, 1],
          caption: 'Thin upright line = mono-ish, broader cloud = wider. Correlation is the number engineers watch: wide but positive is healthy.',
        },
      };
    }
    const deck = VARIANTS.slice(0, level === 1 ? 3 : level === 2 ? 5 : 6);
    const idx = pickInt(rng, deck.length);
    const v = deck[idx];
    const near =
      level === 2 && (v.key === 'wide' || v.key === 'narrow')
        ? [deck.findIndex((x) => x.key === (v.key === 'wide' ? 'narrow' : 'wide'))]
        : undefined;
    return {
      clips: [{ label: '▶', buf: presentStereo(v.make(m, rng)) }],
      question: 'What is this stereo image doing?',
      answers: deck.map((x) => ({ label: x.label })),
      correct: idx,
      near,
      reveal: v.truth,
      seeIt: {
        kind: 'gonio',
        clips: [0],
        caption: 'Vertical line = mono. Tilted = panned. Cloud = wide. Horizontal = out of phase.',
      },
    };
  },
};
