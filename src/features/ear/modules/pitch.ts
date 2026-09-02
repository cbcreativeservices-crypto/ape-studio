/**
 * M11 — Pitch Recognition (Wave 4, spec §2): higher/lower discrimination
 * narrowing 12 → 1 semitone, plus interval naming on a growing deck.
 * Complex tones (not sines) — virtual pitch is stronger (Terhardt).
 * All copy NEW COPY — owner review.
 */
import { harmonicComplex, type Mono } from '../earDsp';
import type { EarModule } from '../earTypes';
import { rngFor, pickInt, present } from './common';

const HL_STEPS = [12, 7, 4, 2, 1]; // semitones per level

const INTERVALS: { semi: number; label: string; truth: string }[] = [
  { semi: 0, label: 'Unison', truth: 'Unison — the same note twice.' },
  { semi: 1, label: 'Minor 2nd', truth: 'Minor 2nd — one semitone, maximum rub.' },
  { semi: 2, label: 'Major 2nd', truth: 'Major 2nd — a whole step.' },
  { semi: 3, label: 'Minor 3rd', truth: 'Minor 3rd — the sad third.' },
  { semi: 4, label: 'Major 3rd', truth: 'Major 3rd — the bright third.' },
  { semi: 5, label: 'Perfect 4th', truth: 'Perfect 4th — "Here Comes the Bride".' },
  { semi: 6, label: 'Tritone', truth: 'Tritone — six semitones, maximally unstable.' },
  { semi: 7, label: 'Perfect 5th', truth: 'Perfect 5th — the power-chord interval.' },
  { semi: 8, label: 'Minor 6th', truth: 'Minor 6th — eight semitones.' },
  { semi: 9, label: 'Major 6th', truth: 'Major 6th — nine semitones.' },
  { semi: 10, label: 'Minor 7th', truth: 'Minor 7th — the dominant-seventh color.' },
  { semi: 11, label: 'Major 7th', truth: 'Major 7th — one shy of the octave, leaning hard.' },
  { semi: 12, label: 'Octave', truth: 'Octave — double the frequency, same note name.' },
];

function deckFor(level: number) {
  const semis =
    level <= 1 ? [0, 7, 12] : level === 2 ? [0, 4, 5, 7, 12] : level === 3 ? [0, 2, 3, 4, 5, 7, 9, 12] : INTERVALS.map((i) => i.semi);
  return INTERVALS.filter((i) => semis.includes(i.semi));
}

function note(f0: number): Mono {
  return present(harmonicComplex(f0, 1.0, 0.9));
}

export const M11_PITCH: EarModule = {
  id: 'pitch',
  num: '11',
  title: 'Pitch Recognition',
  blurb: 'Which note is higher — down to a single semitone — then name the interval.',
  phones: 'any',
  playbackNote: 'Complex tones carry pitch on any playback.',
  // NEW COPY
  listenFor: 'Hum the first note, then the second — does it land above or below? For intervals, sing the two notes as one step.',
  levels: 5,
  levelNames: ['Octave apart + 3 intervals', '7 semitones + 5 intervals', '4 semitones + 8 intervals', '2 semitones, every interval', '1 semitone, every interval'], // NEW COPY (L4/L5: 13 chips, unison to octave)
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const root = 110 * Math.pow(2, rng() * 2); // A2–A4
    if (rng() < 0.5) {
      const step = HL_STEPS[Math.min(level, 5) - 1];
      const firstHigher = rng() < 0.5;
      const low = note(root);
      const high = note(root * Math.pow(2, step / 12));
      return {
        clips: [
          { label: 'A', buf: firstHigher ? high : low },
          { label: 'B', buf: firstHigher ? low : high },
        ],
        question: 'Which note is higher?',
        answers: [{ label: 'A is higher' }, { label: 'B is higher' }],
        correct: firstHigher ? 0 : 1,
        reveal: `${step} semitone${step > 1 ? 's' : ''} apart. Complex tones, not sines — richer harmonics give the pitch more to grab.`,
        seeIt: {
          kind: 'spectrum',
          clips: [0, 1],
          caption: 'Two harmonic stacks — the higher note’s whole comb shifts right.',
        },
      };
    }
    const deck = deckFor(level);
    const idx = pickInt(rng, deck.length);
    const iv = deck[idx];
    const near =
      level <= 2
        ? deck
            .map((d, i) => (Math.abs(d.semi - iv.semi) === 1 ? i : -1))
            .filter((i) => i >= 0)
        : undefined;
    return {
      clips: [
        { label: 'A', buf: note(root) },
        { label: 'B', buf: note(root * Math.pow(2, iv.semi / 12)) },
      ],
      question: 'What interval is A up to B?',
      answers: deck.map((d) => ({ label: d.label })),
      correct: idx,
      near: near && near.length ? near : undefined,
      ordered: { low: 'too narrow', high: 'too wide' }, // NEW COPY
      reveal: iv.truth,
      seeIt: {
        kind: 'spectrum',
        clips: [0, 1],
        caption: 'Interval = the ratio between the stacks. An octave lands every harmonic on a harmonic.',
      },
    };
  },
};
