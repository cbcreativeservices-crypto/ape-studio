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
    truth: 'Panned hard left (constant-power) — nearly nothing in the right ear.',
    make: (m) => pan(m, -0.85),
  },
  {
    key: 'right', label: 'Right',
    truth: 'Panned hard right — the mirror image.',
    make: (m) => pan(m, 0.85),
  },
  {
    key: 'center', label: 'Centered (mono)',
    truth: 'Identical channels — a single centered source IS mono: correlation 1.0. Same thing, two names.',
    make: (m) => toStereo(m),
  },
  {
    key: 'wide', label: 'Wide',
    truth: 'Decorrelated side content boosted (~+6 dB side) — the image spills outward.',
    make: (m) => width(decorrelate(m), 2.2),
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
  listenFor: 'Close your eyes. Where is the sound: one side, dead centre, spread wide, huddled in the middle, or floating inside your head?',
  levels: 4,
  levelNames: ['Left / right / centered', '+ wide / narrow', '+ out of phase', 'Which is wider?'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const m = scene(rng);
    if (level >= 4) {
      const base = decorrelate(m);
      const widths = rng() < 0.5 ? [1.5, 0.9] : [1.25, 0.8];
      const wideFirst = rng() < 0.5;
      const a = presentStereo(width(base, wideFirst ? widths[0] : widths[1]));
      const b = presentStereo(width(base, wideFirst ? widths[1] : widths[0]));
      return {
        clips: [
          { label: 'A', buf: a },
          { label: 'B', buf: b },
        ],
        question: 'Which clip is wider?',
        answers: [{ label: 'A' }, { label: 'B' }],
        correct: wideFirst ? 0 : 1,
        reveal: 'Same scene, different mid/side ratio — width is just the side channel’s level.',
        seeIt: {
          kind: 'gonio',
          clips: [0, 1],
          caption: 'The goniometer: taller-than-wide = mono-ish, ball-shaped = wide. Correlation is the number engineers watch.',
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
      question: 'Where does the image sit?',
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
