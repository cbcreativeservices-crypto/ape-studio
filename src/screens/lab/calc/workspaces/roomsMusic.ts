/**
 * Workspaces: Rooms & Music — BPM/delay · pitch/cents · file size ·
 * room modes · Sabine RT · treatment planner.
 * Follows the wave.ts exemplar pattern (owner spec 2026-07-29).
 */
import type { Workspace } from '../calcTypes';
import { fmt, speedOfSoundAir } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);
const arr = (v: number | number[]): number[] => (typeof v === 'number' ? [v] : v);

/* ────────────────────────── shared music helpers ────────────────────────── */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Note name + octave (MIDI 69 = A4, octave = floor(m/12) − 1). */
function noteName(m: number): string {
  const r = Math.round(m);
  const pc = ((r % 12) + 12) % 12;
  return `${NOTE_NAMES[pc] ?? 'C'}${Math.floor(r / 12) - 1}`;
}

const INTERVAL_NAMES = [
  'unison',
  'minor 2nd',
  'major 2nd',
  'minor 3rd',
  'major 3rd',
  'perfect 4th',
  'tritone',
  'perfect 5th',
  'minor 6th',
  'major 6th',
  'minor 7th',
  'major 7th',
  'octave',
];

/** Nearest named interval for a (possibly fractional/negative) semitone count. */
function intervalName(semitones: number): string {
  const a = Math.abs(semitones);
  const r = Math.round(a);
  if (r <= 12) return INTERVAL_NAMES[r] ?? 'unison';
  const oct = Math.floor(r / 12);
  const rem = r % 12;
  return `${oct} octave${oct > 1 ? 's' : ''} + ${INTERVAL_NAMES[rem] ?? 'unison'}`;
}

/** Note-value divisions in beats (quarter = one beat in 4/4). */
const NOTE_DIVS: { label: string; beats: number }[] = [
  { label: 'Whole', beats: 4 },
  { label: 'Half', beats: 2 },
  { label: 'Quarter', beats: 1 },
  { label: '8th', beats: 0.5 },
  { label: '16th', beats: 0.25 },
  { label: '32nd', beats: 0.125 },
];

/* ─────────────────────────── 1 · BPM & Delay Time ───────────────────────── */

const WS_BPM: Workspace = {
  id: 'bpm',
  name: 'BPM & Delay Time',
  tagline: 'Tempo → delay times · LFO rates · pre-delay',
  section: 'music',
  intro:
    'Everything on the time axis of a mix can lock to the tempo. Enter the BPM (or tap an ' +
    'interval and get the BPM back) and the lab converts musical note values into the ' +
    'milliseconds your delay, LFO, and reverb pre-delay actually want.',
  whyItMatters:
    'A delay set to a musical division sits IN the groove; one set to a round number sits on ' +
    'top of it. The same tempo math drives synced LFOs (tremolo, auto-pan, filter sweeps) and ' +
    'reverb pre-delay, so one number — the beat in milliseconds — unlocks the whole time domain.',
  example:
    'At 120 BPM the beat is 60000 ÷ 120 = 500 ms, so a quarter-note delay is 500 ms and a ' +
    'dotted 8th is 500 × 0.5 × 1.5 = 375 ms — THE classic U2 delay: play straight 8ths and the ' +
    'repeats fill in the syncopation for you.',
  mistakes: [
    'Setting delays in round numbers (250, 300, 400 ms) instead of tempo divisions — close-but-off repeats smear the groove instead of reinforcing it.',
    'Forgetting dotted vs triplet: a dotted 8th (×1.5) and a triplet quarter (×2/3 of a half) feel completely different against the same straight 8ths.',
    'Assuming the tap tempo captured the grid exactly — a few taps can land 1–2 BPM off; check against the session tempo or a longer measured interval.',
  ],
  glossary: ['BPM (Beats Per Minute)'],
  fields: [
    {
      key: 'bpm',
      name: 'TEMPO',
      quantity: 'bpm',
      placeholder: '120',
      help: 'Beats per minute — the quarter note gets the beat in 4/4.',
      warn: { test: (x) => x < 20 || x > 400, msg: 'Outside the usual 20–400 BPM musical range — check the value.' },
    },
    {
      key: 'interval',
      name: 'MEASURED INTERVAL',
      quantity: 'time',
      defaultUnit: 'ms',
      placeholder: '500',
      help: 'Time between two beats — from tap tempo, a delay time, or a measured loop.',
    },
    {
      key: 'beatsPerCycle',
      name: 'BEATS PER CYCLE',
      quantity: 'number',
      placeholder: '4',
      help: 'How many beats one full LFO cycle should span (4 = whole note in 4/4, 0.5 = 8th note).',
    },
  ],
  functions: [
    {
      key: 'noteValues',
      name: 'Note values from BPM',
      inputs: ['bpm'],
      formula: 'beat (ms) = 60000 / BPM · dotted ×1.5 · triplet ×2/3',
      plainFormula:
        'The beat in milliseconds equals 60000 divided by the tempo; a dotted value is 1.5 times its straight length, and a triplet is two-thirds.',
      explain:
        'Everything on the time axis of a mix can lock to the tempo. One minute is 60000 ms, so the beat is 60000 over the BPM. The quarter note is the beat in 4/4; every other value scales from it — dotted ×1.5, triplet ×2/3 — giving the delay, LFO, and pre-delay times that sit in the groove.',
      keySymbols: ['/', '×'],
      compute: (v) => {
        const beatMs = 60000 / n(v.bpm);
        return [
          { label: 'ONE BEAT (QUARTER NOTE)', value: beatMs / 1000, quantity: 'time', unit: 'ms' },
          { label: 'DOTTED 8TH', value: (beatMs * 0.5 * 1.5) / 1000, quantity: 'time', unit: 'ms' },
          { label: '8TH-NOTE TRIPLET', value: (beatMs * 0.5 * 2) / 3 / 1000, quantity: 'time', unit: 'ms' },
          { label: 'ONE BAR OF 4/4', value: (beatMs * 4) / 1000, quantity: 'time', unit: 'ms', chainable: false },
        ];
      },
      steps: (v) => {
        const bpm = n(v.bpm);
        const beatMs = 60000 / bpm;
        return [
          `One minute is 60000 ms; at ${fmt(bpm)} BPM each beat takes 60000 ÷ ${fmt(bpm)} = ${fmt(beatMs)} ms.`,
          `The quarter note IS the beat in 4/4, so every other value scales from it: dotted = ×1.5, triplet = ×2/3.`,
          `Dotted 8th = ${fmt(beatMs)} × 0.5 × 1.5 = ${fmt(beatMs * 0.75)} ms — the full table below covers whole through 32nd.`,
        ];
      },
      table: (v) => {
        const beatMs = 60000 / n(v.bpm);
        return {
          title: `Note values at ${fmt(n(v.bpm))} BPM (ms)`,
          cols: ['Note', 'Straight (×1)', 'Dotted (×1.5)', 'Triplet (×2/3)'],
          rows: NOTE_DIVS.map((d) => {
            const ms = beatMs * d.beats;
            return [d.label, fmt(ms), fmt(ms * 1.5), fmt((ms * 2) / 3)];
          }),
        };
      },
    },
    {
      key: 'bpmFromInterval',
      name: 'BPM from a measured interval (reverse)',
      inputs: ['interval'],
      formula: 'BPM = 60000 / ms',
      plainFormula: 'The tempo equals 60000 divided by the beat interval in milliseconds.',
      explain:
        'The reverse: turns a tapped or measured beat interval back into a tempo. Sessions run on whole (or half) BPM values, so it also gives the nearest whole tempo — useful for matching a loop or a tapped feel to the session grid.',
      keySymbols: ['/'],
      note: 'Reverse solve: turn a tapped or measured beat interval back into tempo.',
      compute: (v) => {
        const ms = n(v.interval) * 1000;
        const bpm = 60000 / ms;
        return [
          { label: 'TEMPO', value: bpm, quantity: 'bpm' },
          { label: 'NEAREST WHOLE BPM', text: `${Math.round(bpm)} BPM (exact: ${fmt(bpm)})` },
        ];
      },
      steps: (v) => {
        const ms = n(v.interval) * 1000;
        return [
          `BPM = 60000 ÷ ${fmt(ms)} ms = ${fmt(60000 / ms)} BPM.`,
          `Sessions run on whole (or half) BPM values — the nearest whole tempo is ${Math.round(60000 / ms)} BPM.`,
        ];
      },
    },
    {
      key: 'lfoSync',
      name: 'LFO rate synced to tempo',
      inputs: ['bpm', 'beatsPerCycle'],
      formula: 'Hz = BPM / (60 × beats per cycle)',
      plainFormula:
        'The LFO rate in hertz equals the tempo divided by 60 times the number of beats per cycle.',
      explain:
        'Syncs a modulation rate to the song. The BPM over 60 is beats per second; dividing by the beats you want one cycle to span gives the LFO frequency. A tremolo, auto-pan, or filter sweep at this rate breathes with the music instead of drifting against it.',
      keySymbols: ['/', '×'],
      compute: (v) => {
        const hz = n(v.bpm) / (60 * n(v.beatsPerCycle));
        return [
          { label: 'LFO RATE', value: hz, quantity: 'frequency' },
          { label: 'CYCLE LENGTH', value: 1 / hz, quantity: 'time', unit: 'ms', chainable: false },
        ];
      },
      steps: (v) => {
        const bpm = n(v.bpm);
        const bpc = n(v.beatsPerCycle);
        return [
          `${fmt(bpm)} BPM is ${fmt(bpm / 60)} beats per second.`,
          `One LFO cycle spans ${fmt(bpc)} beat(s), so Hz = ${fmt(bpm)} ÷ (60 × ${fmt(bpc)}) = ${fmt(bpm / (60 * bpc))} Hz.`,
          `That is one full sweep every ${fmt((60 * bpc) / bpm)} s — a tremolo or auto-pan at this rate breathes with the song.`,
        ];
      },
    },
    {
      key: 'preDelay',
      name: 'Reverb pre-delay from tempo',
      inputs: ['bpm'],
      formula: 'pre-delay = beat (ms) × division',
      plainFormula: 'The reverb pre-delay equals the beat in milliseconds times a note division.',
      explain:
        'Sets a reverb’s pre-delay to a musical fraction of the beat — a starting point for listening, not a rule. Short (a 1/64 note) tucks the reverb in behind the source; longer (a 1/16) separates the dry voice from the tail. Audition, then trust your ears.',
      keySymbols: ['×'],
      note: 'Musical pre-delay is a STARTING POINT for listening, not a rule — the room in the recording and the vocal rhythm get the final vote.',
      compute: (v) => {
        const beatMs = 60000 / n(v.bpm);
        return [
          { label: '1/64 NOTE', value: beatMs / 16 / 1000, quantity: 'time', unit: 'ms' },
          { label: '1/32 NOTE', value: beatMs / 8 / 1000, quantity: 'time', unit: 'ms' },
          { label: '1/16 NOTE', value: beatMs / 4 / 1000, quantity: 'time', unit: 'ms' },
        ];
      },
      steps: (v) => {
        const beatMs = 60000 / n(v.bpm);
        return [
          `Beat = 60000 ÷ ${fmt(n(v.bpm))} = ${fmt(beatMs)} ms; a 1/64 note is beat ÷ 16, 1/32 ÷ 8, 1/16 ÷ 4.`,
          `Short (1/64 ≈ ${fmt(beatMs / 16)} ms) keeps the reverb tucked in; longer (1/16 ≈ ${fmt(beatMs / 4)} ms) separates the dry voice from the tail. Audition, then trust your ears.`,
        ];
      },
      table: (v) => {
        const beatMs = 60000 / n(v.bpm);
        return {
          title: `Pre-delay candidates at ${fmt(n(v.bpm))} BPM`,
          cols: ['Division', 'Pre-delay (ms)'],
          rows: [
            ['1/64 note', fmt(beatMs / 16)],
            ['1/32 note', fmt(beatMs / 8)],
            ['1/16 note', fmt(beatMs / 4)],
          ],
        };
      },
    },
  ],
};

/* ───────────────────────── 2 · Pitch · Note · Cents ─────────────────────── */

const WS_PITCH: Workspace = {
  id: 'pitch',
  name: 'Pitch · Note · Cents',
  tagline: 'Frequency ↔︎ note name · intervals · transposition',
  section: 'music',
  intro:
    'The translator between the physics side (hertz) and the musical side (note names, ' +
    'semitones, cents). Every direction is its own function: name a frequency, tune a note, ' +
    'measure the interval between two tones, or work out a transposition ratio.',
  whyItMatters:
    'Tuning drift, sample-rate mismatches, and varispeed all show up as cents; feedback ' +
    'frequencies and resonances make sense the moment you name the note. Equal temperament ' +
    '(12 equal semitones per octave, 100 cents each) is the shared grid all of it lives on.',
  example:
    'A tone measures 452 Hz. Against A4 = 440 Hz that is m = 69 + 12·log₂(452/440) ≈ 69.47 — ' +
    'nearest note A4, +47 cents sharp. Noticeably sharp: trained ears catch a sustained tone ' +
    'only a few cents off, and 47 cents is almost a quarter tone.',
  mistakes: [
    'Confusing cents with hertz — cents are ratio-based, so 1 Hz of error is about 17 cents at 100 Hz but only 1.7 cents at 1 kHz.',
    'Forgetting the tuning reference: an orchestra at A = 442 Hz reads "sharp" on an A440 tuner even when it is perfectly in tune with itself.',
    'Transposing by ratio and expecting duration to survive — pure varispeed (tape-style) shifts pitch AND length together; keeping length needs time-stretch DSP.',
  ],
  glossary: ['Cents', 'MIDI'],
  fields: [
    {
      key: 'f',
      name: 'FREQUENCY',
      quantity: 'frequency',
      placeholder: '452',
      help: 'The measured or intended frequency of the tone.',
    },
    {
      key: 'midi',
      name: 'MIDI NOTE NUMBER',
      quantity: 'number',
      placeholder: '69',
      help: 'MIDI numbering: 69 = A4, 60 = middle C (C4); one step = one semitone.',
      warn: { test: (x) => x < 0 || x > 127, msg: 'MIDI note numbers run 0–127.' },
    },
    {
      key: 'cents',
      name: 'EXTRA CENTS',
      quantity: 'cents',
      placeholder: '0',
      help: 'Fine-tune offset added to the semitone shift (100 cents = 1 semitone). Enter 0 for none.',
    },
    {
      key: 'f2',
      name: 'SECOND FREQUENCY',
      quantity: 'frequency',
      placeholder: '678',
      help: 'The other tone of the interval you are measuring.',
    },
    {
      key: 'ref',
      name: 'A4 REFERENCE',
      quantity: 'frequency',
      placeholder: '440',
      help: 'tuning reference',
      warn: { test: (x) => x < 400 || x > 480, msg: 'A4 references outside 400–480 Hz are historically unusual — check the value.' },
    },
    {
      key: 'semi',
      name: 'SEMITONES',
      quantity: 'number',
      placeholder: '3',
      help: 'Transposition in semitones — positive = up, negative = down.',
    },
  ],
  functions: [
    {
      key: 'freqToNote',
      name: 'Note name from frequency',
      inputs: ['f', 'ref'],
      formula: 'm = 69 + 12·log₂(f / A4) · cents = (m − round m) × 100',
      plainFormula:
        'The MIDI number equals 69 plus twelve times the base-two log of the frequency over the A4 reference; the cents offset is the fractional part times 100.',
      explain:
        'Translates a frequency into a note name and tuning offset. Because pitch is logarithmic, twelve times the base-two log of the ratio to A4 gives the position in semitones, and MIDI 69 anchors A4. The leftover fraction, times 100, is how many cents sharp or flat the tone sits.',
      keySymbols: ['·', '−', '×', '/'],
      compute: (v) => {
        const f = n(v.f);
        const ref = n(v.ref);
        const m = 69 + 12 * Math.log2(f / ref);
        const r = Math.round(m);
        const cents = (m - r) * 100;
        const exact = ref * Math.pow(2, (r - 69) / 12);
        const below = ref * Math.pow(2, (r - 70) / 12);
        const above = ref * Math.pow(2, (r - 68) / 12);
        return [
          { label: 'NEAREST NOTE', text: `${noteName(r)} (MIDI ${r})` },
          {
            label: 'TUNING OFFSET',
            text:
              Math.abs(cents) < 0.5
                ? 'In tune (within half a cent).'
                : `${fmt(Math.abs(cents), 3)} cents ${cents > 0 ? 'sharp' : 'flat'} of ${noteName(r)}.`,
          },
          { label: 'CENTS OFF', value: cents, quantity: 'cents' },
          { label: `EXACT ${noteName(r)}`, value: exact, quantity: 'frequency' },
          {
            label: 'ADJACENT NOTES',
            text: `${noteName(r - 1)} = ${fmt(below)} Hz below · ${noteName(r + 1)} = ${fmt(above)} Hz above.`,
          },
        ];
      },
      steps: (v) => {
        const f = n(v.f);
        const ref = n(v.ref);
        const m = 69 + 12 * Math.log2(f / ref);
        const r = Math.round(m);
        return [
          `m = 69 + 12·log₂(${fmt(f)} ÷ ${fmt(ref)}) = ${fmt(m)} — the fractional MIDI position of this frequency.`,
          `Nearest whole note: MIDI ${r} = ${noteName(r)}, whose exact frequency is ${fmt(ref * Math.pow(2, (r - 69) / 12))} Hz.`,
          `The leftover (${fmt(m)} − ${r}) × 100 = ${fmt((m - r) * 100, 3)} cents is how far ${cents(m, r)}.`,
        ];
      },
    },
    {
      key: 'noteToFreq',
      name: 'Frequency from MIDI note',
      inputs: ['midi', 'ref'],
      formula: 'f = A4 · 2^((m − 69) / 12)',
      plainFormula:
        'The frequency equals the A4 reference times two raised to the number of semitones from A4 (the MIDI number minus 69) divided by twelve.',
      explain:
        'The reverse: the frequency of a MIDI note. Each of the twelve equal semitones per octave multiplies the frequency by the twelfth root of two, so raising two to the semitone distance over twelve and scaling by the A4 reference gives the note’s pitch in hertz.',
      keySymbols: ['·', 'x²', '−', '/'],
      compute: (v) => {
        const m = n(v.midi);
        const ref = n(v.ref);
        const f = ref * Math.pow(2, (m - 69) / 12);
        return [
          { label: 'FREQUENCY', value: f, quantity: 'frequency' },
          { label: 'NOTE', text: `MIDI ${fmt(m)} = ${noteName(m)} at A4 = ${fmt(ref)} Hz.` },
        ];
      },
      steps: (v) => {
        const m = n(v.midi);
        const ref = n(v.ref);
        return [
          `MIDI ${fmt(m)} sits ${fmt(m - 69)} semitone(s) from A4 (MIDI 69).`,
          `f = ${fmt(ref)} × 2^(${fmt(m - 69)}/12) = ${fmt(ref * Math.pow(2, (m - 69) / 12))} Hz.`,
        ];
      },
    },
    {
      key: 'interval',
      name: 'Interval between two frequencies',
      inputs: ['f', 'f2'],
      formula: 'semitones = 12·log₂(f₂/f₁) · cents = 1200·log₂(f₂/f₁)',
      plainFormula:
        'The interval in semitones equals twelve times the base-two log of the ratio of the two frequencies; in cents it is 1200 times that log.',
      explain:
        'Measures the musical distance between two tones. Pitch intervals live in ratios, not differences, so it takes the base-two log of the frequency ratio — times twelve for semitones, times 1200 for cents — and names the nearest equal-tempered interval.',
      keySymbols: ['·', '/', 'x₁'],
      compute: (v) => {
        const f1 = n(v.f);
        const f2 = n(v.f2);
        const st = 12 * Math.log2(f2 / f1);
        return [
          { label: 'RATIO', value: f2 / f1, quantity: 'ratio' },
          { label: 'SEMITONES', value: st, quantity: 'number', chainable: false },
          { label: 'CENTS', value: st * 100, quantity: 'cents' },
          { label: 'OCTAVES', value: st / 12, quantity: 'number', chainable: false },
          {
            label: 'NEAREST INTERVAL',
            text: `≈ ${intervalName(st)} (${fmt(Math.abs(st))} semitones ${st >= 0 ? 'up' : 'down'}).`,
          },
        ];
      },
      steps: (v) => {
        const f1 = n(v.f);
        const f2 = n(v.f2);
        const st = 12 * Math.log2(f2 / f1);
        return [
          `Ratio = ${fmt(f2)} ÷ ${fmt(f1)} = ${fmt(f2 / f1)} — pitch intervals live in ratios, not differences.`,
          `Semitones = 12·log₂(${fmt(f2 / f1)}) = ${fmt(st)}; cents = ×100 = ${fmt(st * 100)}.`,
          `The nearest equal-tempered interval is a ${intervalName(st)}.`,
        ];
      },
    },
    {
      key: 'transpose',
      name: 'Transposition ratio & varispeed',
      inputs: ['semi', 'cents'],
      formula: 'ratio = 2^((semitones + cents/100) / 12)',
      plainFormula:
        'The frequency ratio equals two raised to the total shift — semitones plus cents over 100 — divided by twelve.',
      explain:
        'Turns a transposition in semitones and cents into the ratio every frequency is multiplied by. As pure varispeed that ratio is also the playback speed, so a clip’s pitch and length change together; keeping the length while shifting pitch needs a separate time-stretch DSP process.',
      keySymbols: ['x²', '/'],
      note: 'Pure varispeed: pitch and playback length change together. Pitch-shift with preserved duration is a separate DSP process.',
      compute: (v) => {
        const total = n(v.semi) + n(v.cents) / 100;
        const ratio = Math.pow(2, total / 12);
        return [
          { label: 'FREQUENCY RATIO', value: ratio, quantity: 'ratio' },
          { label: 'PLAYBACK SPEED', value: ratio * 100, quantity: 'percent' },
          { label: 'NEW LENGTH OF A 1× CLIP', value: 100 / ratio, quantity: 'percent', chainable: false },
        ];
      },
      steps: (v) => {
        const semi = n(v.semi);
        const ct = n(v.cents);
        const total = semi + ct / 100;
        const ratio = Math.pow(2, total / 12);
        return [
          `Total shift = ${fmt(semi)} semitone(s) + ${fmt(ct)} cents = ${fmt(total)} semitones.`,
          `ratio = 2^(${fmt(total)}/12) = ${fmt(ratio)} — every frequency is multiplied by this.`,
          `As varispeed that is ${fmt(ratio * 100)}% playback speed, so the clip runs ${fmt(100 / ratio)}% of its original length.`,
        ];
      },
    },
  ],
};

/** Small step-text helper for freqToNote (keeps the template literal readable). */
function cents(m: number, r: number): string {
  const c = (m - r) * 100;
  if (Math.abs(c) < 0.5) return 'in tune the tone already is';
  return `${c > 0 ? 'sharp' : 'flat'} the tone is`;
}

/* ─────────────────── 3 · File Size & Recording Time ─────────────────────── */

/** Uncompressed PCM data rate in bytes per second. */
const pcmBytesPerSec = (sr: number, bits: number, ch: number) => (sr * bits * ch) / 8;

const WS_FILESIZE: Workspace = {
  id: 'filesize',
  name: 'File Size & Recording Time',
  tagline: 'PCM data rates · storage · session planning',
  section: 'digital',
  intro:
    'How big audio files get and how long a card or drive lasts. Uncompressed PCM is pure ' +
    'multiplication — sample rate × bit depth × channels — so the lab can go both directions: ' +
    'size from time, or time from storage, for one file or a whole multitrack session.',
  whyItMatters:
    'Running out of storage mid-take is a career-limiting event. Knowing the per-minute rate of ' +
    'your format lets you sanity-check a card before a gig, budget drive space for a session, ' +
    'and spot a mis-set format (a 32-bit float 96 kHz session fills a drive 4× faster than ' +
    '16/44.1).',
  example:
    '24-bit / 48 kHz stereo: 48000 × 24 ÷ 8 × 2 = 288000 bytes/s = 288 kB/s ≈ 17.3 MB per ' +
    'minute (about 1.04 GB per hour). A 64 GB card holds 64e9 ÷ 288000 ≈ 222222 s ≈ 61 hours ' +
    'of stereo recording at that format.',
  mistakes: [
    'Mixing bits and bytes — data rates quote bits, files store bytes; the ÷8 is where most estimates go wrong by a factor of eight.',
    'Forgetting channel count: stereo doubles everything, and a 24-track session multiplies it by 24.',
    'Planning to fill storage to 100% — leave a reserve (filesystem overhead, safety margin, that one extra take always happens).',
  ],
  warnings:
    'This is uncompressed PCM (WAV/AIFF) math: rate = sample rate × bit depth × channels. ' +
    'Compressed formats (MP3, AAC, FLAC) vary with content and encoder settings — estimating ' +
    'those from a bitrate is a separate calculation, not this one.',
  glossary: ['Sample Rate', 'Bit Depth'],
  fields: [
    {
      key: 'sr',
      name: 'SAMPLE RATE',
      quantity: 'samplerate',
      defaultUnit: 'srkhz',
      placeholder: '48',
      help: 'Samples per second per channel (44.1 kHz CD, 48 kHz video/broadcast, 96/192 kHz hi-res).',
    },
    {
      key: 'bits',
      name: 'BIT DEPTH',
      quantity: 'bitdepth',
      placeholder: '24',
      help: '16/24/32',
      warn: { test: (x) => ![8, 16, 24, 32, 64].includes(x), msg: 'Unusual bit depth — common PCM depths are 16, 24, and 32 bit.' },
    },
    {
      key: 'ch',
      name: 'CHANNELS',
      quantity: 'number',
      placeholder: '2',
      help: 'Channels in the file: 1 = mono, 2 = stereo.',
    },
    {
      key: 'dur',
      name: 'DURATION',
      quantity: 'time',
      defaultUnit: 'min',
      placeholder: '60',
      help: 'How long the recording runs.',
    },
    {
      key: 'storage',
      name: 'STORAGE AVAILABLE',
      quantity: 'datasize',
      defaultUnit: 'gb',
      placeholder: '64',
      help: 'Free space on the card or drive.',
    },
    {
      key: 'tracks',
      name: 'TRACK COUNT',
      quantity: 'number',
      placeholder: '24',
      help: 'Simultaneously recording tracks in the session (each at the channel count above).',
    },
  ],
  functions: [
    {
      key: 'size',
      name: 'File size from format & duration',
      inputs: ['sr', 'bits', 'ch', 'dur'],
      formula: 'bytes/s = sample rate × bit depth ÷ 8 × channels',
      plainFormula:
        'The bytes per second equal the sample rate times the bit depth, divided by eight, times the number of channels.',
      explain:
        'Uncompressed PCM is pure multiplication: sample rate times bit depth times channels, divided by eight to turn bits into bytes. This gives the file size for a duration plus handy per-minute and per-hour rates. The ÷8 is where most estimates go wrong by a factor of eight.',
      keySymbols: ['×', '÷'],
      compute: (v) => {
        const rate = pcmBytesPerSec(n(v.sr), n(v.bits), n(v.ch));
        return [
          { label: 'FILE SIZE', value: rate * n(v.dur), quantity: 'datasize', unit: 'mb' },
          { label: 'DATA RATE', value: rate * 8, quantity: 'datarate', chainable: false },
          { label: 'PER MINUTE', value: rate * 60, quantity: 'datasize', unit: 'mb', chainable: false },
          { label: 'PER HOUR', value: rate * 3600, quantity: 'datasize', unit: 'gb', chainable: false },
        ];
      },
      steps: (v) => {
        const sr = n(v.sr);
        const bits = n(v.bits);
        const ch = n(v.ch);
        const rate = pcmBytesPerSec(sr, bits, ch);
        return [
          `Each second stores ${fmt(sr)} samples × ${fmt(bits)} bits ÷ 8 bits-per-byte × ${fmt(ch)} channel(s) = ${fmt(rate)} bytes/s.`,
          `Over ${fmt(n(v.dur) / 60)} min: ${fmt(rate)} × ${fmt(n(v.dur))} s = ${fmt((rate * n(v.dur)) / 1e6)} MB.`,
          `Handy rate: ${fmt((rate * 60) / 1e6)} MB per minute, ${fmt((rate * 3600) / 1e9)} GB per hour.`,
        ];
      },
    },
    {
      key: 'recTime',
      name: 'Recording time from storage (reverse)',
      inputs: ['sr', 'bits', 'ch', 'storage'],
      formula: 'time = storage bytes ÷ (bytes/s)',
      plainFormula: 'The recording time equals the available storage in bytes divided by the data rate in bytes per second.',
      explain:
        'The reverse: how long a card or drive lasts at a given format. It divides the free space by the per-second byte rate. Leave a reserve — filesystem overhead and one extra take mean you should never plan to hit 100%.',
      keySymbols: ['÷'],
      note: 'Reverse solve: how long the free space lasts at this format. Leave a reserve — do not plan to hit 100%.',
      compute: (v) => {
        const rate = pcmBytesPerSec(n(v.sr), n(v.bits), n(v.ch));
        const secs = n(v.storage) / rate;
        return [
          { label: 'RECORDING TIME', value: secs, quantity: 'time', unit: 'min' },
          { label: 'IN HOURS', text: `${fmt(secs / 3600)} hours (${fmt(secs / 60)} minutes).` },
        ];
      },
      steps: (v) => {
        const rate = pcmBytesPerSec(n(v.sr), n(v.bits), n(v.ch));
        const secs = n(v.storage) / rate;
        return [
          `This format writes ${fmt(rate)} bytes every second.`,
          `${fmt(n(v.storage) / 1e9)} GB ÷ ${fmt(rate)} bytes/s = ${fmt(secs)} s ≈ ${fmt(secs / 3600)} hours.`,
        ];
      },
    },
    {
      key: 'multitrack',
      name: 'Multitrack session size',
      inputs: ['sr', 'bits', 'ch', 'tracks'],
      formula: 'session bytes/s = tracks × sample rate × bit depth ÷ 8 × channels',
      plainFormula:
        'The session’s bytes per second equal the track count times the sample rate times the bit depth, divided by eight, times the channels.',
      explain:
        'Scales the single-file rate by the number of simultaneously recording tracks. A 24-track session writes 24× the data of one track — the number that decides whether a drive survives a long multitrack date.',
      keySymbols: ['×', '÷'],
      compute: (v) => {
        const rate = pcmBytesPerSec(n(v.sr), n(v.bits), n(v.ch)) * n(v.tracks);
        return [
          { label: 'SESSION RATE PER MINUTE', value: rate * 60, quantity: 'datasize', unit: 'mb' },
          { label: 'SESSION RATE PER HOUR', value: rate * 3600, quantity: 'datasize', unit: 'gb', chainable: false },
        ];
      },
      steps: (v) => {
        const per = pcmBytesPerSec(n(v.sr), n(v.bits), n(v.ch));
        const rate = per * n(v.tracks);
        return [
          `One track at this format writes ${fmt(per)} bytes/s.`,
          `${fmt(n(v.tracks))} tracks write ${fmt(rate)} bytes/s = ${fmt((rate * 60) / 1e6)} MB per minute of rolling tape.`,
        ];
      },
      table: (v) => {
        const rate = pcmBytesPerSec(n(v.sr), n(v.bits), n(v.ch)) * n(v.tracks);
        return {
          title: `${fmt(n(v.tracks))}-track session at this format`,
          cols: ['Session length', 'Size'],
          rows: [30, 60, 120].map((min) => {
            const bytes = rate * min * 60;
            return [`${min} min`, bytes >= 1e9 ? `${fmt(bytes / 1e9)} GB` : `${fmt(bytes / 1e6)} MB`];
          }),
        };
      },
    },
  ],
};

/* ─────────────────────── 4 · Room Modes (Axial) ─────────────────────────── */

const WS_ROOMMODES: Workspace = {
  id: 'roommodes',
  name: 'Room Modes (Axial)',
  tagline: 'Axial standing waves from room dimensions',
  section: 'rooms',
  intro:
    'Between every pair of parallel surfaces, frequencies whose half-wavelengths divide the ' +
    'distance evenly form standing waves — room modes. Enter the room dimensions and the lab ' +
    'lists the axial modes: where the low end of the room will peak, null, and ring.',
  whyItMatters:
    'Below a few hundred hertz the ROOM is the biggest EQ in the monitoring chain. Knowing the ' +
    'modal frequencies tells you why the bass disappears at the mix position, where to try ' +
    'moving the speakers or the chair, and which frequencies the bass trapping has to reach.',
  example:
    'A 5 × 4 × 2.5 m room at 20 °C (c ≈ 343 m/s): fundamentals f = c/2L → 34.3 Hz (length), ' +
    '42.9 Hz (width), 68.6 Hz (height). Note that the second-order height mode (137.3 Hz) and ' +
    'the fourth-order length mode (137.3 Hz) stack — a 2:1 dimension ratio piles modes on the ' +
    'same frequencies.',
  mistakes: [
    'EQing a null — a cancellation is missing energy at that point in space; boosting the band just eats headroom and rings elsewhere. Move the listener, the source, or add treatment.',
    'Treating this table as a full low-frequency prediction — mode math says where modes CAN sit, not how audible each one is from your seat.',
    'Cube-ish rooms (or 2:1 ratios) stacking coincident modes — equal dimensions put multiple modes on the same frequency and multiply the damage.',
  ],
  warnings:
    'Axial modes only — tangential and oblique modes (weaker but real) are in the Advanced ' +
    'tier roadmap. Mode presence ≠ audibility: level depends on source/listener position and ' +
    'surface absorption. Modes are treatable (bass traps, placement), not EQ-able — formal room ' +
    'measurement is the domain of ISO 3382.',
  glossary: ['Room Mode', 'Standing wave', 'Frequency', 'Wavelength'],
  fields: [
    { key: 'len', name: 'ROOM LENGTH', quantity: 'length', placeholder: '5', help: 'Longest floor dimension, wall to wall.' },
    { key: 'wid', name: 'ROOM WIDTH', quantity: 'length', placeholder: '4', help: 'Shorter floor dimension, wall to wall.' },
    { key: 'hei', name: 'CEILING HEIGHT', quantity: 'length', placeholder: '2.5', help: 'Floor to ceiling.' },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound in the classroom dry-air model.' },
    {
      key: 'dist',
      name: 'SURFACE-TO-SURFACE DISTANCE',
      quantity: 'length',
      placeholder: '3.2',
      help: 'Any single pair of parallel boundaries — wall to wall, floor to ceiling, desk to ceiling.',
    },
  ],
  functions: [
    {
      key: 'axial',
      name: 'Axial modes of the room',
      inputs: ['len', 'wid', 'hei', 'temp'],
      formula: 'f = n · c / (2 · L) for each dimension, n = 1…4',
      plainFormula:
        'Each modal frequency equals the mode number times the speed of sound, divided by twice the room dimension.',
      explain:
        'Between every pair of parallel surfaces, frequencies whose half-wavelengths divide the distance evenly form standing waves — room modes. This lists the axial modes for a room’s length, width, and height, flagging near-coincident modes that stack. Below a few hundred hertz the room is the biggest EQ in the chain; modes are treatable, not EQ-able.',
      keySymbols: ['f', '·', 'c', '/'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const dims: [string, number][] = [
          ['L', n(v.len)],
          ['W', n(v.wid)],
          ['H', n(v.hei)],
        ];
        const out: { label: string; text: string }[] = [
          { label: 'LENGTH FUNDAMENTAL (1,0,0)', text: `${fmt(c / (2 * n(v.len)))} Hz` },
          { label: 'WIDTH FUNDAMENTAL (0,1,0)', text: `${fmt(c / (2 * n(v.wid)))} Hz` },
          { label: 'HEIGHT FUNDAMENTAL (0,0,1)', text: `${fmt(c / (2 * n(v.hei)))} Hz` },
        ];
        const modes = dims
          .flatMap(([dim, L]) => [1, 2, 3, 4].map((ord) => ({ f: (ord * c) / (2 * L), dim, ord })))
          .sort((a, b) => a.f - b.f);
        for (let i = 1; i < modes.length; i++) {
          const a = modes[i - 1];
          const b = modes[i];
          if (a && b && a.dim !== b.dim && (b.f - a.f) / a.f < 0.05) {
            out.push({
              label: 'NEAR-COINCIDENT',
              text: `${a.dim}${a.ord} (${fmt(a.f)} Hz) and ${b.dim}${b.ord} (${fmt(b.f)} Hz) sit within 5% — expect a stronger buildup there.`,
            });
          }
        }
        return out;
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        return [
          `c = ${fmt(c)} m/s at ${fmt(n(v.temp))} °C.`,
          `A mode forms when half a wavelength (or a whole multiple of halves) fits the dimension exactly: f = n·c ÷ 2L.`,
          `Length ${fmt(n(v.len))} m → f₁ = ${fmt(c / (2 * n(v.len)))} Hz; width ${fmt(n(v.wid))} m → ${fmt(c / (2 * n(v.wid)))} Hz; height ${fmt(n(v.hei))} m → ${fmt(c / (2 * n(v.hei)))} Hz. Higher orders are whole-number multiples of each.`,
        ];
      },
      table: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const dims: [string, number][] = [
          ['L', n(v.len)],
          ['W', n(v.wid)],
          ['H', n(v.hei)],
        ];
        const modes = dims
          .flatMap(([dim, L]) => [1, 2, 3, 4].map((ord) => ({ f: (ord * c) / (2 * L), dim, ord })))
          .sort((a, b) => a.f - b.f);
        return {
          title: 'Axial modes, ascending (n = 1…4 per dimension)',
          cols: ['Frequency (Hz)', 'Dimension', 'Order n'],
          rows: modes.map((m) => [fmt(m.f), m.dim, String(m.ord)]),
        };
      },
    },
    {
      key: 'single',
      name: 'Modes of one dimension (boundary check)',
      inputs: ['dist', 'temp'],
      formula: 'f = n · c / (2 · d), n = 1…6',
      plainFormula:
        'Each modal frequency equals the mode number times the speed of sound, divided by twice the distance between the surfaces.',
      explain:
        'A quick check for any single pair of parallel surfaces — a wall pair, floor-to-ceiling, or a large desk under a ceiling. The lowest standing wave sits at the speed of sound over twice the gap, and every whole multiple stacks another mode on the same pair.',
      keySymbols: ['f', '·', 'c', '/'],
      note: 'Quick check for any single pair of parallel surfaces — a wall pair, floor–ceiling, or a large desk under a ceiling.',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.dist);
        return [
          { label: 'FUNDAMENTAL (n = 1)', value: c / (2 * d), quantity: 'frequency' },
          { label: 'SECOND ORDER (n = 2)', value: c / d, quantity: 'frequency', chainable: false },
          { label: 'THIRD ORDER (n = 3)', value: (3 * c) / (2 * d), quantity: 'frequency', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.dist);
        return [
          `f₁ = ${fmt(c)} ÷ (2 × ${fmt(d)}) = ${fmt(c / (2 * d))} Hz — the lowest standing wave between these two surfaces.`,
          `Every whole multiple stacks another mode on the same pair: ${[2, 3, 4, 5, 6].map((k) => fmt((k * c) / (2 * d))).join(', ')} Hz.`,
        ];
      },
      table: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.dist);
        return {
          title: `Modes between surfaces ${fmt(d)} m apart`,
          cols: ['Order n', 'Frequency (Hz)'],
          rows: [1, 2, 3, 4, 5, 6].map((ord) => [String(ord), fmt((ord * c) / (2 * d))]),
        };
      },
    },
  ],
};

/* ─────────────────── 5 · Reverberation Time (Sabine) ────────────────────── */

const SABINE_K = 0.161; // metric Sabine constant (s/m)

const WS_SABINE: Workspace = {
  id: 'sabine',
  name: 'Reverberation Time (Sabine)',
  tagline: 'RT60 from volume & absorption',
  section: 'rooms',
  intro:
    "Sabine's equation ties a room's reverberation time to its volume and total absorption: " +
    'RT60 = 0.161·V/A. Solve any direction — RT from a known absorption, RT from a surface ' +
    'list, or the absorption a target RT demands.',
  whyItMatters:
    'RT60 is the single most quoted room-acoustics number: it decides speech intelligibility, ' +
    'how much "room" ends up in every mic, and whether a mix room tells the truth. The Sabine ' +
    'form also teaches THE core trade: absorption units are area × coefficient, so treatment ' +
    'is bought in square meters that actually absorb.',
  example:
    'A 100 m³ control room aiming for RT60 = 0.3 s needs A = 0.161 × 100 ÷ 0.3 ≈ 54 m² of ' +
    'equivalent absorption — a lot of treated surface, which is why serious control rooms look ' +
    'the way they do.',
  mistakes: [
    'Using a single broadband α — coefficients are strongly frequency-dependent; a panel rated 0.9 at 1 kHz may do almost nothing at 100 Hz.',
    'Absorbing only highs (thin foam everywhere): the top dies, the bottom keeps booming, and the room sounds worse than untreated.',
    'Chasing RT60 in small rooms — below a few hundred hertz, modal behavior dominates and a single decay number stops describing what you hear.',
  ],
  warnings:
    'Sabine assumes a diffuse field and average absorption below roughly 0.3 — dead rooms need ' +
    'the Eyring equation (Advanced tier). Coefficients here are single-band teaching values; ' +
    'real products are measured per frequency band under ISO 354, and real rooms under ISO 3382.',
  glossary: ['Reverberation Time', 'RT60', 'Absorption Coefficient', 'Room Mode'],
  fields: [
    { key: 'vol', name: 'ROOM VOLUME', quantity: 'volume', placeholder: '100', help: 'Length × width × height of the room.' },
    {
      key: 'absA',
      name: 'TOTAL ABSORPTION A',
      quantity: 'area',
      placeholder: '54',
      help: 'total equivalent absorption, m² sabins',
    },
    {
      key: 'surfaces',
      name: 'SURFACE AREAS',
      quantity: 'list',
      placeholder: '20, 20, 12.5',
      help: 'Comma-separated areas in m², one per surface (walls, floor, ceiling, panels…).',
    },
    {
      key: 'coeffs',
      name: 'ABSORPTION COEFFICIENTS α',
      quantity: 'list',
      placeholder: '0.05, 0.3, 0.9',
      help: 'One α (0–1) per surface, in the SAME ORDER as the areas list.',
    },
    {
      key: 'targetRt',
      name: 'TARGET RT60',
      quantity: 'time',
      defaultUnit: 's',
      placeholder: '0.3',
      help: 'The reverberation time you are designing toward.',
      warn: { test: (x) => x < 0.05 || x > 15, msg: 'RT60 outside 0.05–15 s is outside any normal room — check the value.' },
    },
  ],
  functions: [
    {
      key: 'rtFromVA',
      name: 'RT60 from volume & absorption',
      inputs: ['vol', 'absA'],
      formula: 'RT60 = 0.161 · V / A',
      plainFormula: 'The reverberation time equals 0.161 times the room volume, divided by the total absorption.',
      explain:
        'Sabine’s equation: RT60 is set by a room’s volume and its total absorption. A bigger room decays longer; more absorption decays shorter. The 0.161 is the metric Sabine constant. It assumes a diffuse field and average absorption below about 0.3 — dead rooms need the Eyring form instead.',
      keySymbols: ['·', '/'],
      compute: (v) => [
        { label: 'RT60', value: (SABINE_K * n(v.vol)) / n(v.absA), quantity: 'time', unit: 's' },
      ],
      steps: (v) => {
        const V = n(v.vol);
        const A = n(v.absA);
        return [
          `RT60 = 0.161 × ${fmt(V)} m³ ÷ ${fmt(A)} m² = ${fmt((SABINE_K * V) / A)} s.`,
          `Bigger room → longer decay; more absorption → shorter. The 0.161 constant is the metric Sabine coefficient.`,
        ];
      },
    },
    {
      key: 'rtFromSurfaces',
      name: 'RT60 from a surface list',
      inputs: ['vol', 'surfaces', 'coeffs'],
      formula: 'A = Σ (Sᵢ · αᵢ) · RT60 = 0.161 · V / A',
      plainFormula:
        'The total absorption is the sum over surfaces of each area times its absorption coefficient; the reverberation time is then 0.161 times the volume over that total.',
      explain:
        'Builds the total absorption from a list of surfaces: each area times its absorption coefficient, summed. Because absorption is area × coefficient, treatment is bought in square metres that actually absorb. The result feeds straight into Sabine for the room’s RT60.',
      keySymbols: ['Σ', 'α', '·', '/', 'x₁'],
      note: 'Areas and coefficients pair by position: first area with first α, and so on.',
      compute: (v) => {
        const S = arr(v.surfaces);
        const al = arr(v.coeffs);
        const A = S.reduce((sum, s, i) => sum + s * (al[i] ?? 0), 0);
        return [
          { label: 'TOTAL ABSORPTION A', value: A, quantity: 'area' },
          { label: 'RT60', value: (SABINE_K * n(v.vol)) / A, quantity: 'time', unit: 's' },
        ];
      },
      steps: (v) => {
        const S = arr(v.surfaces);
        const al = arr(v.coeffs);
        const A = S.reduce((sum, s, i) => sum + s * (al[i] ?? 0), 0);
        return [
          `Each surface contributes area × α: ${S.map((s, i) => `${fmt(s)} × ${fmt(al[i] ?? 0)} = ${fmt(s * (al[i] ?? 0))}`).join('; ')} m².`,
          `A = ${fmt(A)} m² of equivalent absorption in total.`,
          `RT60 = 0.161 × ${fmt(n(v.vol))} ÷ ${fmt(A)} = ${fmt((SABINE_K * n(v.vol)) / A)} s.`,
        ];
      },
      table: (v) => {
        const S = arr(v.surfaces);
        const al = arr(v.coeffs);
        return {
          title: 'Absorption contribution per surface',
          cols: ['Surface', 'Area (m²)', 'α', 'S·α (m²)'],
          rows: S.map((s, i) => [`#${i + 1}`, fmt(s), fmt(al[i] ?? 0), fmt(s * (al[i] ?? 0))]),
        };
      },
    },
    {
      key: 'neededA',
      name: 'Absorption needed for a target RT (reverse)',
      inputs: ['vol', 'targetRt', 'absA'],
      formula: 'A needed = 0.161 · V / RT target',
      plainFormula: 'The absorption needed equals 0.161 times the volume, divided by the target reverberation time.',
      explain:
        'Rearranges Sabine to solve for absorption: how many square metres of equivalent absorption a target RT60 demands. Enter the current total absorption too and it gives the shortfall — the extra absorption to add to reach the target.',
      keySymbols: ['·', '/'],
      note: 'Reverse solve: enter the current total absorption to also get the shortfall to add.',
      compute: (v) => {
        const needed = (SABINE_K * n(v.vol)) / n(v.targetRt);
        const cur = n(v.absA);
        const out: ReturnType<Workspace['functions'][number]['compute']> = [
          { label: 'ABSORPTION NEEDED', value: needed, quantity: 'area' },
        ];
        if (Number.isFinite(cur)) {
          out.push({ label: 'ABSORPTION TO ADD', value: needed - cur, quantity: 'area' });
        }
        return out;
      },
      steps: (v) => {
        const V = n(v.vol);
        const rt = n(v.targetRt);
        const needed = (SABINE_K * V) / rt;
        const cur = n(v.absA);
        const s = [
          `Rearranged Sabine: A = 0.161 × V ÷ RT = 0.161 × ${fmt(V)} ÷ ${fmt(rt)} = ${fmt(needed)} m².`,
        ];
        if (Number.isFinite(cur)) {
          s.push(`The room already has ${fmt(cur)} m², so ΔA = ${fmt(needed)} − ${fmt(cur)} = ${fmt(needed - cur)} m² of absorption to add.`);
        }
        return s;
      },
    },
  ],
};

/* ─────────────────── 6 · Acoustic Treatment Planner ─────────────────────── */

const WS_TREATMENT: Workspace = {
  id: 'treatment',
  name: 'Acoustic Treatment Planner',
  tagline: 'How many panels to hit a target RT60',
  section: 'rooms',
  intro:
    "The Sabine math chained end-to-end into a shopping answer: from the room's current decay " +
    'and your target, the lab computes the missing absorption and converts it into a whole ' +
    'number of panels of a given size and coefficient.',
  whyItMatters:
    'Treatment is bought in panels, not in abstract sabins. Turning "the room is too live" into ' +
    '"eleven 2.88 m² panels at α 0.9" is the difference between guessing at foam and planning a ' +
    'room — and the same chain predicts the RT you will actually land on with a whole number of ' +
    'panels.',
  example:
    'A 150 m³ office at RT60 = 1.2 s, target 0.5 s: A now = 0.161×150/1.2 ≈ 20.1 m², A needed ' +
    '= 0.161×150/0.5 ≈ 48.3 m², so ΔA ≈ 28.2 m². With 2.88 m² panels at α 0.9 (2.59 m² each), ' +
    'that is ceil(28.2/2.59) = 11 panels — predicted RT ≈ 0.50 s.',
  mistakes: [
    'Buying thin foam for low frequencies — a 25 mm panel absorbing 0.9 at 4 kHz can be nearly transparent at 125 Hz; bass needs thick porous material, air gaps, or tuned traps.',
    'Treating RT60 as the only metric — first reflections, flutter echo, and modal ringing all need attention the average decay number cannot see.',
    'Covering 100% of the walls — a completely dead room is fatiguing and unnatural; aim for the target RT and balanced absorption across frequency, not maximum coverage.',
  ],
  warnings:
    'Same Sabine limits as the Reverberation Time workspace: diffuse field, average absorption ' +
    'below ~0.3, single-band teaching α. Lab-measured α above 1.0 happens (edge diffraction) — ' +
    'treat it as ≈1. Placement matters as much as quantity: first-reflection points and corners ' +
    '(for bass) do the most work — pair this plan with the Room Modes workspace to see WHAT ' +
    'needs absorbing down low.',
  glossary: ['Reverberation Time', 'RT60', 'Absorption Coefficient', 'Room Mode'],
  fields: [
    { key: 'vol', name: 'ROOM VOLUME', quantity: 'volume', placeholder: '150', help: 'Length × width × height of the room.' },
    {
      key: 'rtCur',
      name: 'CURRENT RT60',
      quantity: 'time',
      defaultUnit: 's',
      placeholder: '1.2',
      help: 'The decay time the room has now (measured, or estimated from a clap test).',
    },
    {
      key: 'rtTgt',
      name: 'TARGET RT60',
      quantity: 'time',
      defaultUnit: 's',
      placeholder: '0.5',
      help: 'The decay time you want (speech ≈ 0.4–0.6 s, mix rooms ≈ 0.2–0.4 s).',
      warn: { test: (x) => x < 0.05, msg: 'Below 0.05 s is anechoic territory — no panel count gets a normal room there.' },
    },
    {
      key: 'panelArea',
      name: 'PANEL AREA (EACH)',
      quantity: 'area',
      placeholder: '2.88',
      help: 'Face area of one panel (e.g. 1.2 × 2.4 m sheet = 2.88 m²).',
    },
    {
      key: 'alpha',
      name: 'PANEL ABSORPTION α',
      quantity: 'number',
      placeholder: '0.9',
      help: 'Absorption coefficient of the panel, 0–1 (from the datasheet, ISO 354 lab value).',
      warn: { test: (x) => x <= 0 || x > 1.2, msg: 'α should be 0–1 in practice; lab values slightly above 1.0 should be treated as ≈1.' },
    },
  ],
  functions: [
    {
      key: 'panels',
      name: 'Panels needed for the target RT',
      inputs: ['vol', 'rtCur', 'rtTgt', 'panelArea', 'alpha'],
      formula: 'ΔA = 0.161·V/RT_target − 0.161·V/RT_current · panels = ceil(ΔA / (S_panel · α))',
      plainFormula:
        'The absorption to add is 0.161 times the volume over the target RT minus the same over the current RT; the panel count is that shortfall divided by each panel’s area times its coefficient, rounded up.',
      explain:
        'The Sabine math chained into a shopping answer: from the room’s current decay and your target, it finds the missing absorption and converts it into a whole number of panels of a given size and coefficient — then predicts the RT60 you’ll actually land on, since a fraction of a panel doesn’t exist.',
      keySymbols: ['Δ', '·', '/', '−', 'α'],
      compute: (v) => {
        const V = n(v.vol);
        const aCur = (SABINE_K * V) / n(v.rtCur);
        const aTgt = (SABINE_K * V) / n(v.rtTgt);
        const dA = aTgt - aCur;
        const perPanel = n(v.panelArea) * n(v.alpha);
        const panels = Math.max(0, Math.ceil(dA / perPanel));
        const predicted = (SABINE_K * V) / (aCur + panels * perPanel);
        return [
          { label: 'ABSORPTION TO ADD ΔA', value: dA, quantity: 'area' },
          { label: 'PANELS NEEDED', value: panels, quantity: 'number', chainable: false },
          { label: `PREDICTED RT60 WITH ${panels} PANELS`, value: predicted, quantity: 'time', unit: 's' },
        ];
      },
      steps: (v) => {
        const V = n(v.vol);
        const rtC = n(v.rtCur);
        const rtT = n(v.rtTgt);
        const aCur = (SABINE_K * V) / rtC;
        const aTgt = (SABINE_K * V) / rtT;
        const dA = aTgt - aCur;
        const perPanel = n(v.panelArea) * n(v.alpha);
        const panels = Math.max(0, Math.ceil(dA / perPanel));
        return [
          `Absorption the room has now: A = 0.161 × ${fmt(V)} ÷ ${fmt(rtC)} = ${fmt(aCur)} m².`,
          `Absorption the target needs: A = 0.161 × ${fmt(V)} ÷ ${fmt(rtT)} = ${fmt(aTgt)} m².`,
          `Shortfall ΔA = ${fmt(aTgt)} − ${fmt(aCur)} = ${fmt(dA)} m².`,
          `Each panel supplies ${fmt(n(v.panelArea))} m² × α ${fmt(n(v.alpha))} = ${fmt(perPanel)} m² of absorption.`,
          `Panels = ceil(${fmt(dA)} ÷ ${fmt(perPanel)}) = ${panels} — rounding UP, because a fraction of a panel does not exist.`,
          `With ${panels} whole panels the room lands at RT60 = 0.161 × ${fmt(V)} ÷ ${fmt(aCur + panels * perPanel)} = ${fmt((SABINE_K * V) / (aCur + panels * perPanel))} s.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_ROOMS_MUSIC: Workspace[] = [
  WS_BPM,
  WS_PITCH,
  WS_FILESIZE,
  WS_ROOMMODES,
  WS_SABINE,
  WS_TREATMENT,
];
