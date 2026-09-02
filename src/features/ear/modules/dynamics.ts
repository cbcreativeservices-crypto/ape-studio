/**
 * Dynamics-family ear modules — Wave 2 (spec §2 M7/M10/M14):
 *   M7 Loudness Recognition · M10 Compression Recognition ·
 *   M14 Clipping Recognition.
 *
 * Shared source: the rendered drum-pattern surrogate (common.drumPattern) —
 * labeled a surrogate in copy; real loops are a marked V2.
 * All copy is NEW COPY — owner review.
 */
import {
  pinkNoise, harmonicComplex, normalizeRms, fadeEdges, gainDb, compress, clip,
  type Mono,
} from '../earDsp';
import type { EarModule, EarTrial } from '../earTypes';
import { rngFor, pickInt, drumPattern, p99, present, type Rng } from './common';

// ————————————————————————————— M7 · Loudness ——————————————————————————————

/** THE module exempt from loudness matching — level difference IS the lesson. */
const M7_STEPS = [6, 3, 2, 1]; // dB per level
const M7_CHIPS = [1, 2, 3, 6];

function m7Source(rng: Rng): Mono {
  const src =
    rng() < 0.5 ? pinkNoise(1.2, rng) : harmonicComplex(110 * Math.pow(2, rng()), 1.2, 1);
  // −23 dBFS base leaves headroom for base jitter + the up-to-6 dB step.
  return fadeEdges(normalizeRms(src, -23));
}

export const M7_LOUDNESS: EarModule = {
  id: 'loudness',
  num: '7',
  title: 'Loudness Recognition',
  blurb: 'The same sound at two levels — which is louder, and by about how much?',
  phones: 'any',
  playbackNote: 'Relative levels survive any transducer.',
  levels: 4,
  levelNames: ['6 dB steps', '3 dB steps', '2 dB steps', '1 dB steps'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const delta = M7_STEPS[Math.min(level, 4) - 1];
    const src = m7Source(rng);
    const base = (rng() - 0.5) * 4; // ±2 dB anti-anchoring jitter
    const firstLouder = rng() < 0.5;
    const a = gainDb(src, base + (firstLouder ? delta : 0));
    const b = gainDb(src, base + (firstLouder ? 0 : delta));
    const askMagnitude = level <= 2 && rng() < 0.4;
    const bars = [
      { label: 'A', db: firstLouder ? 0 : -delta },
      { label: 'B', db: firstLouder ? -delta : 0 },
    ];
    const reveal = `${firstLouder ? 'A' : 'B'} is ${delta} dB louder — same clip, only gain differs. Relative dB, nothing calibrated.`;
    if (askMagnitude) {
      const idx = M7_CHIPS.indexOf(delta);
      return {
        clips: [
          { label: 'A', buf: a },
          { label: 'B', buf: b },
        ],
        question: 'By about how much do A and B differ?',
        answers: M7_CHIPS.map((s) => ({ label: `${s} dB` })),
        correct: idx,
        near: delta >= 3 ? [idx - 1, idx + 1].filter((i) => i >= 0 && i < M7_CHIPS.length) : undefined,
        reveal,
        seeIt: {
          kind: 'levels',
          bars,
          caption: `The ${delta} dB you just judged — the gain move clients feel but can't name.`,
        },
      };
    }
    return {
      clips: [
        { label: 'A', buf: a },
        { label: 'B', buf: b },
      ],
      question: 'Which is louder?',
      answers: [{ label: 'A is louder' }, { label: 'B is louder' }],
      correct: firstLouder ? 0 : 1,
      reveal,
      seeIt: {
        kind: 'levels',
        bars,
        caption: `Two identical clips, ${delta} dB apart. Broadband level JND is roughly 0.5–1 dB.`,
      },
    };
  },
};

// ————————————————————————— M10 · Compression ——————————————————————————————

type CompSetting = { key: string; label: string; truth: string; apply?: (x: Mono) => Mono };
const COMP: CompSetting[] = [
  { key: 'none', label: 'None', truth: 'No compression — the transients keep their full snap.' },
  {
    key: 'light', label: 'Light', truth: 'Light: 2:1, threshold −18, attack 30 ms, release 200 ms — near transparent.',
    apply: (x) => compress(x, 2, -18, 30, 200),
  },
  {
    key: 'moderate', label: 'Moderate', truth: 'Moderate: 4:1, −24, 10 ms, 150 ms — the hits sit down noticeably.',
    apply: (x) => compress(x, 4, -24, 10, 150),
  },
  {
    key: 'heavy', label: 'Heavy', truth: 'Heavy: 8:1, −30, 5 ms, 100 ms — squashed, thick, up-front.',
    apply: (x) => compress(x, 8, -30, 5, 100),
  },
  {
    key: 'pumping', label: 'Pumping', truth: 'Pumping: 10:1, −35, 1 ms attack, 400 ms release — the gain audibly swells back between hits.',
    apply: (x) => compress(x, 10, -35, 1, 400),
  },
];

function m10Render(setting: CompSetting, rng: Rng): { dry: Mono; out: Mono } {
  const dry = drumPattern(2, rng);
  const out = setting.apply ? setting.apply(dry) : dry;
  return { dry: present(dry), out: present(out) };
}

export const M10_COMPRESSION: EarModule = {
  id: 'compression',
  num: '10',
  title: 'Compression Recognition',
  blurb: 'None, light, moderate, heavy, pumping — hear the envelope change, not the level.',
  phones: 'recommended',
  playbackNote: 'Rendered drum surrogate; headphones help on the light settings.',
  levels: 4,
  levelNames: ['None vs heavy', 'None / moderate / heavy', 'All five', 'None vs light — the hard one'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    if (level === 1 || level >= 4) {
      // AB: which is compressed? L1 uses heavy (obvious), L4 light (subtle).
      const setting = COMP[level === 1 ? 3 : 1];
      const { dry, out } = m10Render(setting, rng);
      const compFirst = rng() < 0.5;
      return {
        clips: [
          { label: 'A', buf: compFirst ? out : dry },
          { label: 'B', buf: compFirst ? dry : out },
        ],
        question: 'Which clip is compressed?',
        answers: [{ label: 'A' }, { label: 'B' }],
        correct: compFirst ? 0 : 1,
        reveal: `${setting.truth} Both clips are loudness-matched — the tell is the envelope, never the volume.`,
        seeIt: {
          kind: 'wave',
          clips: [0, 1],
          caption: 'Peak envelopes overlaid — compression shaves the hits and lifts the space between them.',
        },
      };
    }
    const deck = level === 2 ? [COMP[0], COMP[2], COMP[3]] : COMP;
    const idx = pickInt(rng, deck.length);
    const setting = deck[idx];
    const { out } = m10Render(setting, rng);
    return {
      clips: [{ label: '▶', buf: out }],
      question: 'How compressed is this?',
      answers: deck.map((s) => ({ label: s.label })),
      correct: idx,
      near:
        level === 3 && setting.key !== 'pumping'
          ? [idx - 1, idx + 1].filter((i) => i >= 0 && i < deck.length && deck[i].key !== 'pumping' && deck[i].key !== 'none')
          : undefined,
      reveal: `${setting.truth} Loudness-matched, so only the envelope gives it away.`,
      seeIt: {
        kind: 'wave',
        clips: [0],
        caption: 'The peak envelope — flatter tops and filled-in valleys mean more compression.',
      },
    };
  },
};

// ————————————————————————————— M14 · Clipping —————————————————————————————

type ClipSeverity = { key: string; label: string; drop: number; truth: string };
const SEVERITIES: ClipSeverity[] = [
  { key: 'clean', label: 'Clean', drop: 0, truth: 'Clean — no samples flattened.' },
  { key: 'mild', label: 'Mild', drop: 1, truth: 'Mild: hard clip 1 dB into the peaks — only the transient tips flatten.' },
  { key: 'moderate', label: 'Moderate', drop: 4, truth: 'Moderate: 4 dB into the peaks — an audible crunch on every hit.' },
  { key: 'severe', label: 'Severe', drop: 10, truth: 'Severe: 10 dB into the peaks — square-ish, buzzing, unmistakable.' },
];

function m14Render(sev: ClipSeverity, rng: Rng): Mono {
  const src = drumPattern(2, rng);
  if (sev.drop === 0) return present(src);
  // Clip threshold sits `drop` dB below the 99th-percentile peak: scale so
  // p99 = full scale, then drive by `drop` into the hard ceiling. clip()
  // RMS-matches after (else this would be a loudness test).
  const scaled = gainDb(src, -20 * Math.log10(p99(src)));
  return present(clip(scaled, 'hard', sev.drop));
}

export const M14_CLIPPING: EarModule = {
  id: 'clipping',
  num: '14',
  title: 'Clipping Recognition',
  blurb: 'Clean, mild, moderate, severe — catch flattened peaks before the client does.',
  phones: 'any',
  playbackNote: 'Phone-speaker distortion can mask mild clipping.',
  levels: 4,
  levelNames: ['Clean vs severe', 'Clean / moderate / severe', 'All four severities', 'ABX on mild'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    if (level === 1) {
      const clipped = m14Render(SEVERITIES[3], rng);
      const clean = m14Render(SEVERITIES[0], rng);
      const clippedFirst = rng() < 0.5;
      return {
        clips: [
          { label: 'A', buf: clippedFirst ? clipped : clean },
          { label: 'B', buf: clippedFirst ? clean : clipped },
        ],
        question: 'Which clip is clipped?',
        answers: [{ label: 'A' }, { label: 'B' }],
        correct: clippedFirst ? 0 : 1,
        reveal: `${SEVERITIES[3].truth} Loudness-matched — listen for the buzz, not the volume.`,
        seeIt: {
          kind: 'spectrum',
          clips: [0, 1],
          caption: 'Hard clipping sprays odd harmonics across the top of the spectrum.',
        },
      };
    }
    if (level >= 4) {
      // ABX on mild — the pro-level discrimination test.
      const clean = m14Render(SEVERITIES[0], rng);
      const mild = m14Render(SEVERITIES[1], rng);
      const xIsA = rng() < 0.5;
      const aIsClean = rng() < 0.5;
      const a = aIsClean ? clean : mild;
      const b = aIsClean ? mild : clean;
      return {
        clips: [
          { label: 'A', buf: a },
          { label: 'B', buf: b },
          { label: 'X', buf: xIsA ? a : b },
        ],
        question: 'X is a copy of one of them. Which?',
        answers: [{ label: 'X is A' }, { label: 'X is B' }],
        correct: xIsA ? 0 : 1,
        reveal: `${aIsClean ? 'A' : 'B'} was clean, ${aIsClean ? 'B' : 'A'} mildly clipped (1 dB into the peaks). ${SEVERITIES[1].truth}`,
        seeIt: {
          kind: 'wave',
          clips: [0, 1],
          caption: 'Only the tallest transient tips differ — that sliver is what your ear caught (or will).',
        },
      };
    }
    const deck = level === 2 ? [SEVERITIES[0], SEVERITIES[2], SEVERITIES[3]] : SEVERITIES;
    const idx = pickInt(rng, deck.length);
    const sev = deck[idx];
    return {
      clips: [{ label: '▶', buf: m14Render(sev, rng) }],
      question: 'How clipped is this?',
      answers: deck.map((s) => ({ label: s.label })),
      correct: idx,
      near: level === 3 ? [idx - 1, idx + 1].filter((i) => i > 0 && i < deck.length) : undefined,
      reveal: `${sev.truth} Loudness-matched after clipping.`,
      seeIt: {
        kind: 'wave',
        clips: [0],
        caption: 'Watch the peaks: clipping flattens the tallest hits into a hard ceiling.',
      },
    };
  },
};
