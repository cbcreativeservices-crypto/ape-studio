/**
 * ONE plain definition per common audio word (owner 2026-11-15, D62 adoption plan guardrail:
 * "Shared words live in one place: one plain definition each for dB, RT60, ms and cents").
 *
 * The beginner audit found dB, RT60, ms and cents explained in different words in several labs.
 * A lab that explains one of these words takes the sentence from here, so every lab says the
 * same thing. Hz and dB reuse the wording of the shared units sheet (rack/bezelRules.ts
 * UNITS_LINES), which learners already see on the "Hz? dB? WHAT THEY MEAN" chip.
 *
 * `short` fits a caption or a dock line (a few words). `sentence` is one plain sentence for
 * lesson text or a help popup. Keep both in plain words; never add a formula here.
 * [MD:D62]
 */
import { UNITS_LINES } from '../../screens/lab/rack/bezelRules.ts';

export type PlainTermKey = 'hz' | 'db' | 'rt60' | 'ms' | 'cents';

export interface PlainTerm {
  /** The word as a learner meets it on screen. */
  term: string;
  /** A few words, for a caption next to a readout or key. */
  short: string;
  /** One plain sentence, for lesson text or a help popup. */
  sentence: string;
}

const unitsText = (prefix: string): string => {
  const line = UNITS_LINES.find((l) => l.term.startsWith(prefix));
  if (!line) throw new Error(`plainTerms: no units line for ${prefix}`);
  return line.text;
};

export const PLAIN_TERMS: Readonly<Record<PlainTermKey, PlainTerm>> = {
  hz: {
    term: 'Hz',
    short: 'vibrations per second',
    sentence: unitsText('Hz'),
  },
  db: {
    term: 'dB',
    short: 'how much louder or quieter',
    sentence: unitsText('dB (decibels)'),
  },
  rt60: {
    term: 'RT60',
    short: 'decay time',
    sentence: 'RT60 is the decay time: how many seconds a sound takes to die away in a room after it stops, until it is 60 dB quieter.',
  },
  ms: {
    term: 'ms',
    short: 'thousandths of a second',
    sentence: 'ms means milliseconds: thousandths of a second, so 1,000 ms is one second.',
  },
  cents: {
    term: 'cents',
    short: '100 cents = one piano key',
    sentence: 'Cents measure tiny steps in pitch: 100 cents is the step from one piano key to the next.',
  },
};

/** "RT60 (decay time)": the code with its plain words, for a first-sight label. */
export function termWithShort(key: PlainTermKey): string {
  const t = PLAIN_TERMS[key];
  return `${t.term} (${t.short})`;
}
