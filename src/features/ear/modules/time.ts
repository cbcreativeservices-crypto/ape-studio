/**
 * Time-family ear modules — Wave 3 (spec §2 M8/M13/M12/M9):
 *   M8 Delay Recognition · M13 Comb Filtering · M12 Polarity & Phase ·
 *   M9 Reverb Recognition (everything reverb is labeled "(emulation)").
 *
 * All copy is NEW COPY — owner review.
 */
import {
  pinkNoise, mixDelayed, reverb, gainDb, rmsDb, fadeEdges,
  type Mono, type ReverbSpace,
} from '../earDsp';
import type { EarModule, EarTrial } from '../earTypes';
import { rngFor, pickInt, choice, shuffled, drumPattern, pluckPattern, present, type Rng } from './common';

// ————————————————————————————— M8 · Delay —————————————————————————————————

const DELAYS = [500, 250, 100, 50]; // ms, ladder order L1→L4
const DELAY_CHIPS = [50, 100, 250, 500];

/** Dry pluck + one echo at −6 dB; ≥250 ms trials add a second repeat (fb 0.3). */
function withEcho(x: Mono, delayMs: number): Mono {
  let y = mixDelayed(x, delayMs, 0.5);
  if (delayMs >= 250) y = mixDelayed(y, delayMs * 2, 0.15);
  return y;
}

export const M8_DELAY: EarModule = {
  id: 'delay',
  num: '8',
  title: 'Delay Recognition',
  blurb: 'Hear discrete echoes and call their time — 500 ms down to the edge of fusion.',
  phones: 'any',
  playbackNote: 'Temporal, not spectral — any playback works.',
  levels: 4,
  levelNames: ['500 ms echoes', '250 ms', '100 ms', '50 ms — near the fusion edge'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const delay = DELAYS[Math.min(level, 4) - 1];
    const kind = pickInt(rng, 3);
    const firstOnset = 0.05;
    if (kind === 0) {
      const src = pluckPattern(rng, 0.6 + delay / 500);
      const dry = present(src);
      const wet = present(withEcho(src, delay));
      const wetFirst = rng() < 0.5;
      return {
        clips: [
          { label: 'A', buf: wetFirst ? wet : dry },
          { label: 'B', buf: wetFirst ? dry : wet },
        ],
        question: 'Which clip has a delay on it?',
        answers: [{ label: 'A' }, { label: 'B' }],
        correct: wetFirst ? 0 : 1,
        reveal: `One echo, ${delay} ms behind each pluck, 6 dB down. Below ~30–50 ms echoes fuse with the direct sound — that story continues in Comb Filtering.`,
        seeIt: {
          kind: 'wave',
          clips: [wetFirst ? 0 : 1],
          markersSec: [firstOnset, firstOnset + delay / 1000],
          caption: `Direct sound and its echo, ${delay} ms apart on the ruler.`,
        },
      };
    }
    if (kind === 1) {
      // Three clips, three delays — which is longest?
      const pool = shuffled(rng, DELAY_CHIPS).slice(0, 3);
      const src = pluckPattern(rng, 1.1);
      const clips = pool.map((d, i) => ({ label: 'ABC'[i], buf: present(withEcho(src, d)) }));
      const correct = pool.indexOf(Math.max(...pool));
      return {
        clips,
        question: 'Which clip has the longest delay?',
        answers: pool.map((_, i) => ({ label: `Clip ${'ABC'[i]}` })),
        correct,
        reveal: pool.map((d, i) => `${'ABC'[i]} = ${d} ms`).join(' · '),
        seeIt: {
          kind: 'wave',
          clips: [correct],
          markersSec: [firstOnset, firstOnset + Math.max(...pool) / 1000],
          caption: 'The longest gap between a pluck and its repeat.',
        },
      };
    }
    const src = pluckPattern(rng, 0.6 + delay / 500);
    const idx = DELAY_CHIPS.indexOf(delay);
    return {
      clips: [{ label: '▶', buf: present(withEcho(src, delay)) }],
      question: 'About how long is the delay?',
      answers: DELAY_CHIPS.map((d) => ({ label: `${d} ms` })),
      correct: idx,
      near: level <= 2 ? [idx - 1, idx + 1].filter((i) => i >= 0 && i < DELAY_CHIPS.length) : undefined,
      reveal: `${delay} ms, one repeat at −6 dB.`,
      seeIt: {
        kind: 'wave',
        clips: [0],
        markersSec: [firstOnset, firstOnset + delay / 1000],
        caption: `Count the ruler: ${delay} ms from direct to echo.`,
      },
    };
  },
};

// ————————————————————————————— M13 · Comb —————————————————————————————————

const COMB_GAINS_DB = [0, -3, -6, -9]; // ladder: deep → shallow notches

export const M13_COMB: EarModule = {
  id: 'comb',
  num: '13',
  title: 'Comb Filtering',
  blurb: 'The phasey, hollow sound of a signal meeting a delayed copy of itself.',
  phones: 'recommended',
  playbackNote: 'Room reflections add their own combs over speakers — genuinely confusing.',
  levels: 4,
  levelNames: ['Copy at 0 dB — deep combs', 'Copy at −3 dB', 'Copy at −6 dB', '−9 dB, ABX'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const g = Math.pow(10, COMB_GAINS_DB[Math.min(level, 4) - 1] / 20);
    // Randomized delay MOVES the notches each trial — learners learn the
    // character, not one notch pattern (spec).
    const delayMs = 0.5 + rng() * 9.5;
    const src = rng() < 0.5 ? pinkNoise(1.6, rng) : drumPattern(1, rng);
    const dry = present(src);
    const combed = present(mixDelayed(src, delayMs, g));
    const notchInfo = `Delayed copy ${delayMs.toFixed(1)} ms behind — notches every ${(1000 / delayMs).toFixed(0)} Hz (spacing = 1 ÷ delay).`;
    if (level >= 4) {
      const xIsA = rng() < 0.5;
      const aIsDry = rng() < 0.5;
      const a = aIsDry ? dry : combed;
      const b = aIsDry ? combed : dry;
      return {
        clips: [
          { label: 'A', buf: a },
          { label: 'B', buf: b },
          { label: 'X', buf: xIsA ? a : b },
        ],
        question: 'X is a copy of one of them. Which?',
        answers: [{ label: 'X is A' }, { label: 'X is B' }],
        correct: xIsA ? 0 : 1,
        reveal: `${aIsDry ? 'B' : 'A'} was comb filtered. ${notchInfo}`,
        seeIt: {
          kind: 'spectrum',
          clips: [0, 1],
          caption: 'The comb’s evenly spaced notches — the Wave lab’s interference module shows why.',
        },
      };
    }
    const combFirst = rng() < 0.5;
    return {
      clips: [
        { label: 'A', buf: combFirst ? combed : dry },
        { label: 'B', buf: combFirst ? dry : combed },
      ],
      question: 'Which clip is comb filtered?',
      answers: [{ label: 'A' }, { label: 'B' }],
      correct: combFirst ? 0 : 1,
      reveal: notchInfo,
      seeIt: {
        kind: 'spectrum',
        clips: [0, 1],
        caption: 'Evenly spaced notches on a linear grid look log-squeezed here — that “phasey” sound has a shape.',
      },
    };
  },
};

// ————————————————————————— M12 · Polarity & Phase ——————————————————————————

export const M12_POLARITY: EarModule = {
  id: 'polarity',
  num: '12',
  title: 'Polarity & Phase',
  blurb: 'Two mics on one source, summed — the snare-top/snare-bottom survival skill.',
  phones: 'recommended',
  playbackNote: 'The low-end loss needs real LF; speaker-room phase is Wave lab turf.',
  levels: 3,
  levelNames: ['Identical copies — dramatic', '0.2 ms offset — hollow', '0.5 ms + 3 dB mismatch — subtle'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const src = drumPattern(1, rng);
    const offsetMs = level === 1 ? 0 : level === 2 ? 0.2 : 0.5;
    const mismatchDb = level >= 3 ? -3 : 0;
    const mk = (invert: boolean, offset: number): Mono => {
      const out = new Float32Array(src.length);
      const d = Math.round((offset / 1000) * 48000);
      const g = Math.pow(10, mismatchDb / 20) * (invert ? -1 : 1);
      for (let i = 0; i < src.length; i++) {
        out[i] = (src[i] + (i >= d ? g * src[i - d] : 0)) / 2;
      }
      return out;
    };
    const sumIn = mk(false, offsetMs);
    const sumOut = mk(true, offsetMs);
    if (level === 1 || rng() < 0.5) {
      // AB: which sum is fuller? L1 keeps the LEVEL DROP — the documented
      // loudness-matching exemption: full cancellation IS the lesson.
      let a: Mono, b: Mono;
      if (level === 1) {
        const gain = -20 - rmsDb(sumIn);
        a = fadeEdges(gainDb(sumIn, gain));
        b = fadeEdges(gainDb(sumOut, gain));
      } else {
        a = present(sumIn);
        b = present(sumOut);
      }
      const inFirst = rng() < 0.5;
      return {
        clips: [
          { label: 'A', buf: inFirst ? a : b },
          { label: 'B', buf: inFirst ? b : a },
        ],
        question: 'Two mic copies, summed twice. Which sum is fuller?',
        answers: [{ label: 'A' }, { label: 'B' }],
        correct: inFirst ? 0 : 1,
        reveal:
          level === 1
            ? 'One sum had a copy polarity-flipped — identical signals cancel almost completely. (Level intentionally not re-matched here: the drop IS the lesson.)'
            : `The flipped sum loses its low end (copies ${offsetMs} ms apart${mismatchDb ? ', 3 dB mismatched' : ''}) — hollow, not silent. A lone flip on ONE signal is inaudible; the SUM is where polarity bites.`,
        seeIt: {
          kind: 'spectrum',
          clips: [0, 1],
          caption: 'The flipped sum’s low-frequency hole is unmistakable once you see it.',
        },
      };
    }
    // CHIPS: normal / inverted / partial-cancellation on a single sum.
    const variants = [
      { label: 'Normal sum', buf: sumIn, truth: 'In polarity — the copies reinforce.' },
      { label: 'Polarity flipped', buf: sumOut, truth: `One copy flipped${offsetMs ? ` (${offsetMs} ms apart)` : ''} — the lows cancel hardest.` },
      {
        label: 'Partial cancellation',
        buf: mk(false, 1.2),
        truth: 'In polarity but 1.2 ms late — comb notches up high, lows intact.',
      },
    ];
    const idx = pickInt(rng, variants.length);
    const v = variants[idx];
    return {
      clips: [{ label: '▶', buf: present(v.buf) }],
      question: 'What happened in this mic sum?',
      answers: variants.map((x) => ({ label: x.label })),
      correct: idx,
      reveal: `${v.truth} Loudness re-matched — judge the tone, not the level.`,
      seeIt: {
        kind: 'spectrum',
        clips: [0],
        caption: 'Flip = low-end hole. Time offset = evenly spaced notches. Both at once = trouble.',
      },
    };
  },
};

// ————————————————————————————— M9 · Reverb ————————————————————————————————

const SPACES: { key: ReverbSpace; label: string; truth: string }[] = [
  { key: 'room', label: 'Room (emulation)', truth: 'Room — tight early reflections, short tail.' },
  { key: 'chamber', label: 'Chamber (emulation)', truth: 'Chamber — a real room’s cousin, denser and a touch darker.' },
  { key: 'hall', label: 'Hall (emulation)', truth: 'Hall — long pre-delay feel, wide slow bloom.' },
  { key: 'plate', label: 'Plate (emulation)', truth: 'Plate — instant density, bright sheen, no early "room" cues.' },
  { key: 'spring', label: 'Spring (emulation)', truth: 'Spring — dispersive "boing"; the drip gives it away.' },
];

function padTail(x: Mono, tailSec: number): Mono {
  const out = new Float32Array(x.length + Math.round(tailSec * 48000));
  out.set(x);
  return out;
}

export const M9_REVERB: EarModule = {
  id: 'reverb',
  num: '9',
  title: 'Reverb Recognition',
  blurb: 'Room, chamber, hall, plate, spring — all rendered emulations, honestly labeled.',
  phones: 'recommended',
  playbackNote: 'Quiet tails vanish on phone speakers.',
  levels: 5,
  levelNames: ['Dry vs wet', 'Short / medium / long', 'Room vs hall vs plate', 'All five spaces', 'Bright vs dark'],
  makeTrial: (level, seed) => {
    const rng = rngFor(seed);
    const src = pluckPattern(rng, 0.2);
    if (level <= 1) {
      const space = choice(rng, SPACES);
      const dry = present(padTail(src, 1.2));
      const wet = present(reverb(padTail(src, 1.2), space.key, 1, 0.5, 0.5));
      const wetFirst = rng() < 0.5;
      return {
        clips: [
          { label: 'A', buf: wetFirst ? wet : dry },
          { label: 'B', buf: wetFirst ? dry : wet },
        ],
        question: 'Which clip has reverb on it?',
        answers: [{ label: 'A' }, { label: 'B' }],
        correct: wetFirst ? 0 : 1,
        reveal: `${space.truth} All spaces here are offline emulations — labeled as such.`,
        seeIt: {
          kind: 'wave',
          clips: [0, 1],
          caption: 'The tail after each pluck is the reverb — the dry clip falls straight to silence.',
        },
      };
    }
    if (level === 2) {
      const decays = [
        { label: 'Short', decay: 0.45, truth: 'Short decay (≈0.5 s).' },
        { label: 'Medium', decay: 1.1, truth: 'Medium decay (≈1.2 s).' },
        { label: 'Long', decay: 2.3, truth: 'Long decay (≈2.5 s).' },
      ];
      const idx = pickInt(rng, decays.length);
      const space = choice(rng, SPACES.slice(0, 4));
      const wet = present(reverb(padTail(src, 2.6), space.key, decays[idx].decay, 0.5, 0.5));
      return {
        clips: [{ label: '▶', buf: wet }],
        question: 'How long is the decay?',
        answers: decays.map((d) => ({ label: d.label })),
        correct: idx,
        near: [idx - 1, idx + 1].filter((i) => i >= 0 && i < decays.length),
        reveal: `${decays[idx].truth} ${space.truth} (emulation)`,
        seeIt: {
          kind: 'wave',
          clips: [0],
          caption: 'The tail’s slope IS the RT60 — the Wave lab’s reverb module measures exactly this.',
        },
      };
    }
    if (level === 5) {
      const space = choice(rng, SPACES.slice(0, 4));
      const brightIs = rng() < 0.5;
      const wet = present(reverb(padTail(src, 1.6), space.key, 1.2, brightIs ? 0.9 : 0.12, 0.55));
      return {
        clips: [{ label: '▶', buf: wet }],
        question: `Is this ${space.label.toLowerCase()} bright or dark?`,
        answers: [{ label: 'Bright' }, { label: 'Dark' }],
        correct: brightIs ? 0 : 1,
        reveal: `${brightIs ? 'Bright — high damping opened up (≈8 kHz).' : 'Dark — heavy damping (≈2 kHz).'} ${space.truth} (emulation)`,
        seeIt: {
          kind: 'spectrum',
          clips: [0],
          caption: 'Damping decides how much top end survives into the tail.',
        },
      };
    }
    const deck = level === 3 ? [SPACES[0], SPACES[2], SPACES[3]] : SPACES;
    const idx = pickInt(rng, deck.length);
    const space = deck[idx];
    const wet = present(reverb(padTail(src, 2.2), space.key, 1.2, 0.5, 0.55));
    // Classic confusions earn half credit: room↔chamber, hall↔plate (spec).
    const nearKeys: Record<string, string[]> =
      level >= 4 ? { room: ['chamber'], chamber: ['room'], hall: ['plate'], plate: ['hall'] } : {};
    const near = (nearKeys[space.key] ?? [])
      .map((k) => deck.findIndex((s) => s.key === k))
      .filter((i) => i >= 0);
    return {
      clips: [{ label: '▶', buf: wet }],
      question: 'Which space is this? (all emulations)',
      answers: deck.map((s) => ({ label: s.label })),
      correct: idx,
      near: near.length ? near : undefined,
      reveal: `${space.truth} (emulation)`,
      seeIt: {
        kind: 'wave',
        clips: [0],
        caption: 'Density and bloom speed separate the spaces as much as decay time.',
      },
    };
  },
};
