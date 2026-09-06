/**
 * centerLock — the PURE logic of the CenterLock Stage Tuner (owner decisions
 * 2026-09-06, from docs/design/TUNER_STAGE_COMPARISON_2026_09_06.md §5):
 *
 *  • instrument presets with sounding-pitch open strings (scientific pitch,
 *    middle C = C4), tunings and a capo offset;
 *  • violin in PERFECT FIFTHS by default (A4 · D4 = A/1.5 · G3 = D/1.5 ·
 *    E5 = A·1.5), equal temperament as the alternative;
 *  • target selection: AUTO picks the nearest string and only re-targets after
 *    a different string has been closer for a short, stable stretch — never on
 *    a single frame, never because a harmonic flickered; MANUAL locks a string;
 *  • the lock state machine: IN TUNE only after CONFIRM_MS inside ±IN_TUNE_CENTS,
 *    one confirmation per entry, released only when the pitch leaves the zone;
 *  • display damping: fast when far from centre, heavier as it approaches;
 *  • the magnitude colour spectrum (never red/green alone).
 *
 * No React, no native imports: node:test covers it (test/centerLock.test.ts).
 */

export const IN_TUNE_CENTS = 2; // owner: ±2 ¢ confirmation zone
export const CLOSE_CENTS = 5; // the visible "close" band
export const CONFIRM_MS = 350; // owner: stable inside the zone before IN TUNE
/** A new AUTO target must be nearer for this long before the display switches. */
export const RETARGET_MS = 250;
/** Beyond this the reading is an octave (or more) off the target string. */
export const OCTAVE_CENTS = 700;

export type Temperament = 'equal' | 'fifths';
export type Family = 'Guitar' | 'Bass' | 'Bowed' | 'Folk' | 'World' | 'Chromatic';
export const FAMILY_ORDER: Family[] = ['Guitar', 'Bass', 'Bowed', 'Folk', 'World', 'Chromatic'];

export type StringTarget = {
  /** 1 = lowest string/course, as players count them. */
  index: number;
  label: string; // "LOW E", "A", …
  note: string; // "E2"
  hz: number;
  /** 0-based course this target belongs to (a double course has two targets). */
  course: number;
  /** True for the octave partner string of a double course. */
  partner?: boolean;
};

export type Tuning = { key: string; name: string; semitoneOffsets: number[] };

export type InstrumentDef = {
  name: string;
  family: Family;
  /** Open strings low → high (one entry per COURSE), sounding pitch. */
  strings: string[];
  labels: string[];
  /** Octave partner per course for double-course instruments; null = unison
   *  partner (or a single string). */
  partners?: (string | null)[];
  /** Every course is a pair (mandolin, oud, 12-string …). */
  doubled?: boolean;
  /** Identity line reads "STRING n · label" (guitars and basses). */
  numbered?: boolean;
  /** Tuned by perfect fifths from A4 by default (bowed family, mandolin). */
  fifths?: boolean;
  /** Capo chip applies. */
  capo?: boolean;
  /** Chromatic mode: no strings, nearest note, transposition, hold stats. */
  chromatic?: boolean;
  /** One line under the name in the picker. */
  blurb: string;
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** Frequency of a scientific-pitch note (e.g. 'E2') at the given A4. */
export function noteHz(note: string, a4 = 440): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`bad note ${note}`);
  const semis = NOTE_NAMES.indexOf(m[1] as (typeof NOTE_NAMES)[number]) + (parseInt(m[2], 10) + 1) * 12; // MIDI
  return a4 * Math.pow(2, (semis - 69) / 12);
}

/** Note name for a MIDI number. */
export function midiToNote(midi: number): string {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function hzToMidi(hz: number, a4 = 440): number {
  return 69 + 12 * Math.log2(hz / a4);
}

export function centsBetween(hz: number, targetHz: number): number {
  return 1200 * Math.log2(hz / targetHz);
}

/**
 * The launch preset set (owner 2026-09-06: "build all of it"). Sounding
 * pitches, one entry per course, low → high in playing order. World presets
 * are named by tradition — Arabic and Turkish oud are separate on purpose;
 * sitar/saz/shamisen/koto wait for a tonic (Sa) system rather than ship a
 * misleading absolute preset; there is no piano preset (stretched octaves).
 */
const INSTRUMENT_DEFS = {
  // ── Guitar ──
  guitar6: { name: 'Guitar · 6-string', family: 'Guitar', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], labels: ['LOW E', 'A', 'D', 'G', 'B', 'HIGH E'], numbered: true, capo: true, blurb: 'E2 A2 D3 G3 B3 E4' },
  guitar7: { name: 'Guitar · 7-string', family: 'Guitar', strings: ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'], labels: ['LOW B', 'E', 'A', 'D', 'G', 'B', 'HIGH E'], numbered: true, capo: true, blurb: 'B1 E2 A2 D3 G3 B3 E4' },
  guitar12: {
    name: 'Guitar · 12-string',
    family: 'Guitar',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    labels: ['LOW E', 'A', 'D', 'G', 'B', 'HIGH E'],
    partners: ['E3', 'A3', 'D4', 'G4', null, null],
    doubled: true,
    numbered: true,
    capo: true,
    blurb: 'Six courses · octave pairs on the low four',
  },
  // ── Bass ──
  bass4: { name: 'Bass · 4-string', family: 'Bass', strings: ['E1', 'A1', 'D2', 'G2'], labels: ['E', 'A', 'D', 'G'], numbered: true, capo: true, blurb: 'E1 A1 D2 G2' },
  bass5: { name: 'Bass · 5-string', family: 'Bass', strings: ['B0', 'E1', 'A1', 'D2', 'G2'], labels: ['LOW B', 'E', 'A', 'D', 'G'], numbered: true, capo: true, blurb: 'B0 E1 A1 D2 G2' },
  bass6: { name: 'Bass · 6-string', family: 'Bass', strings: ['B0', 'E1', 'A1', 'D2', 'G2', 'C3'], labels: ['LOW B', 'E', 'A', 'D', 'G', 'C'], numbered: true, capo: true, blurb: 'B0 E1 A1 D2 G2 C3' },
  doubleBass: { name: 'Double bass', family: 'Bass', strings: ['E1', 'A1', 'D2', 'G2'], labels: ['E', 'A', 'D', 'G'], numbered: true, blurb: 'E1 A1 D2 G2 · orchestral / upright' },
  // ── Bowed ──
  violin: { name: 'Violin', family: 'Bowed', strings: ['G3', 'D4', 'A4', 'E5'], labels: ['G', 'D', 'A', 'E'], fifths: true, blurb: 'G3 D4 A4 E5 · perfect fifths from A' },
  viola: { name: 'Viola', family: 'Bowed', strings: ['C3', 'G3', 'D4', 'A4'], labels: ['C', 'G', 'D', 'A'], fifths: true, blurb: 'C3 G3 D4 A4 · perfect fifths from A' },
  cello: { name: 'Cello', family: 'Bowed', strings: ['C2', 'G2', 'D3', 'A3'], labels: ['C', 'G', 'D', 'A'], fifths: true, blurb: 'C2 G2 D3 A3 · perfect fifths from A' },
  erhu: { name: 'Erhu', family: 'Bowed', strings: ['D4', 'A4'], labels: ['INNER D', 'OUTER A'], blurb: 'D4 A4 · Chinese two-string fiddle' },
  // ── Folk ──
  ukuleleHighG: { name: 'Ukulele · high G', family: 'Folk', strings: ['G4', 'C4', 'E4', 'A4'], labels: ['G', 'C', 'E', 'A'], blurb: 'G4 C4 E4 A4 · re-entrant' },
  ukuleleLowG: { name: 'Ukulele · low G', family: 'Folk', strings: ['G3', 'C4', 'E4', 'A4'], labels: ['G', 'C', 'E', 'A'], blurb: 'G3 C4 E4 A4 · linear' },
  ukuleleBaritone: { name: 'Ukulele · baritone', family: 'Folk', strings: ['D3', 'G3', 'B3', 'E4'], labels: ['D', 'G', 'B', 'E'], blurb: 'D3 G3 B3 E4' },
  mandolin: { name: 'Mandolin', family: 'Folk', strings: ['G3', 'D4', 'A4', 'E5'], labels: ['G', 'D', 'A', 'E'], doubled: true, fifths: true, blurb: 'G3 D4 A4 E5 · four unison pairs' },
  banjo5: {
    name: 'Banjo · 5-string',
    family: 'Folk',
    strings: ['D3', 'G3', 'B3', 'D4', 'G4'],
    labels: ['4TH D', '3RD G', '2ND B', '1ST D', '5TH G'],
    blurb: 'Open G · D3 G3 B3 D4 + G4 drone',
  },
  dulcimer: { name: 'Appalachian dulcimer', family: 'Folk', strings: ['D3', 'A3', 'D4'], labels: ['BASS', 'MIDDLE', 'MELODY'], blurb: 'DAD · DAA in the tuning row' },
  bouzoukiIrish: {
    name: 'Bouzouki · Irish',
    family: 'Folk',
    strings: ['G2', 'D3', 'A3', 'D4'],
    labels: ['G', 'D', 'A', 'D'],
    partners: ['G3', 'D4', null, null],
    doubled: true,
    blurb: 'G2 D3 A3 D4 · octave pairs on the low two',
  },
  balalaikaPrima: { name: 'Balalaika · prima', family: 'Folk', strings: ['E4', 'A4'], labels: ['E ×2', 'A'], blurb: 'E4 E4 A4 · two E strings in unison' },
  charango: {
    name: 'Charango',
    family: 'Folk',
    strings: ['G4', 'C5', 'E4', 'A4', 'E5'],
    labels: ['G', 'C', 'E', 'A', 'E'],
    partners: [null, null, 'E5', null, null],
    doubled: true,
    blurb: 'G4 C5 E4/E5 A4 E5 · re-entrant, octave E course',
  },
  // ── World ──
  oudArabic: {
    name: 'Oud · Arabic',
    family: 'World',
    strings: ['C2', 'F2', 'A2', 'D3', 'G3', 'C4'],
    labels: ['C', 'F', 'A', 'D', 'G', 'C'],
    doubled: true,
    blurb: 'C2 F2 A2 D3 G3 C4 · low-C set, unison pairs',
  },
  oudTurkish: {
    name: 'Oud · Turkish',
    family: 'World',
    strings: ['C#2', 'F#2', 'B2', 'E3', 'A3', 'D4'],
    labels: ['C#', 'F#', 'B', 'E', 'A', 'D'],
    doubled: true,
    blurb: 'C#2 F#2 B2 E3 A3 D4 · a step above Arabic',
  },
  pipa: { name: 'Pipa', family: 'World', strings: ['A2', 'D3', 'E3', 'A3'], labels: ['A', 'D', 'E', 'A'], blurb: 'A2 D3 E3 A3 · Chinese lute' },
  bouzoukiGreek3: {
    name: 'Bouzouki · Greek 3-course',
    family: 'World',
    strings: ['D3', 'A3', 'D4'],
    labels: ['D', 'A', 'D'],
    partners: ['D4', null, null],
    doubled: true,
    blurb: 'D3 A3 D4 · trichordo, octave low D',
  },
  bouzoukiGreek4: {
    name: 'Bouzouki · Greek 4-course',
    family: 'World',
    strings: ['C3', 'F3', 'A3', 'D4'],
    labels: ['C', 'F', 'A', 'D'],
    partners: ['C4', 'F4', null, null],
    doubled: true,
    blurb: 'C3 F3 A3 D4 · tetrachordo, octave low pairs',
  },
  // ── Chromatic ──
  chromatic: { name: 'Chromatic · winds & brass', family: 'Chromatic', strings: [], labels: [], chromatic: true, blurb: 'Any note · written pitch for B♭, E♭, F · hold readout' },
} satisfies Record<string, InstrumentDef>;

export type InstrumentKey = keyof typeof INSTRUMENT_DEFS;
export const INSTRUMENTS: Record<InstrumentKey, InstrumentDef> = INSTRUMENT_DEFS;
export const INSTRUMENT_KEYS = Object.keys(INSTRUMENT_DEFS) as InstrumentKey[];

/** Instruments grouped by family in display order. */
export function instrumentsByFamily(): { family: Family; keys: InstrumentKey[] }[] {
  return FAMILY_ORDER.map((family) => ({ family, keys: INSTRUMENT_KEYS.filter((k) => INSTRUMENTS[k].family === family) }));
}

/** Written-pitch transpositions for the chromatic (winds & brass) mode:
 *  written = concert + semis. */
export const TRANSPOSITIONS = [
  { key: 'C', name: 'C · CONCERT', semis: 0 },
  { key: 'Bb', name: 'B♭ INST', semis: 2 },
  { key: 'Eb', name: 'E♭ INST', semis: 9 },
  { key: 'F', name: 'F INST', semis: 7 },
] as const;
export type TranspositionKey = (typeof TRANSPOSITIONS)[number]['key'];

const STD = (n: number): Tuning => ({ key: 'standard', name: 'Standard', semitoneOffsets: Array(n).fill(0) });

/** Tunings as semitone offsets per string, low → high. */
export const TUNINGS: Record<InstrumentKey, Tuning[]> = {
  guitar12: [
    { key: 'standard', name: 'Standard', semitoneOffsets: [0, 0, 0, 0, 0, 0] },
    { key: 'eb', name: 'E♭ Standard', semitoneOffsets: [-1, -1, -1, -1, -1, -1] },
    { key: 'dStd', name: 'D Standard', semitoneOffsets: [-2, -2, -2, -2, -2, -2] },
  ],
  doubleBass: [STD(4)],
  viola: [STD(4)],
  cello: [STD(4)],
  erhu: [STD(2)],
  ukuleleHighG: [STD(4)],
  ukuleleLowG: [STD(4)],
  ukuleleBaritone: [STD(4)],
  mandolin: [STD(4)],
  banjo5: [
    { key: 'standard', name: 'Open G', semitoneOffsets: [0, 0, 0, 0, 0] },
    { key: 'doubleC', name: 'Double C', semitoneOffsets: [-2, -2, 0, 0, 0] },
  ],
  dulcimer: [
    { key: 'standard', name: 'DAD', semitoneOffsets: [0, 0, 0] },
    { key: 'daa', name: 'DAA', semitoneOffsets: [0, 0, -5] },
  ],
  bouzoukiIrish: [
    { key: 'standard', name: 'GDAD', semitoneOffsets: [0, 0, 0, 0] },
    { key: 'gdae', name: 'GDAE', semitoneOffsets: [0, 0, 0, 2] },
  ],
  balalaikaPrima: [STD(2)],
  charango: [STD(5)],
  oudArabic: [
    { key: 'standard', name: 'Low C', semitoneOffsets: [0, 0, 0, 0, 0, 0] },
    { key: 'lowD', name: 'Low D', semitoneOffsets: [2, 2, 0, 0, 0, 0] },
  ],
  oudTurkish: [STD(6)],
  pipa: [STD(4)],
  bouzoukiGreek3: [STD(3)],
  bouzoukiGreek4: [STD(4)],
  chromatic: [],
  guitar6: [
    { key: 'standard', name: 'Standard', semitoneOffsets: [0, 0, 0, 0, 0, 0] },
    { key: 'dropD', name: 'Drop D', semitoneOffsets: [-2, 0, 0, 0, 0, 0] },
    { key: 'eb', name: 'E♭ Standard', semitoneOffsets: [-1, -1, -1, -1, -1, -1] },
    { key: 'dStd', name: 'D Standard', semitoneOffsets: [-2, -2, -2, -2, -2, -2] },
    { key: 'dropC', name: 'Drop C', semitoneOffsets: [-4, -2, -2, -2, -2, -2] },
    { key: 'dadgad', name: 'DADGAD', semitoneOffsets: [-2, 0, 0, 0, -2, -2] },
    { key: 'openG', name: 'Open G', semitoneOffsets: [-2, 0, 0, 0, 0, -2] },
    { key: 'openD', name: 'Open D', semitoneOffsets: [-2, 0, 0, -1, -2, -2] },
  ],
  guitar7: [
    { key: 'standard', name: 'Standard', semitoneOffsets: [0, 0, 0, 0, 0, 0, 0] },
    { key: 'dropA', name: 'Drop A', semitoneOffsets: [-2, 0, 0, 0, 0, 0, 0] },
    { key: 'aStd', name: 'A Standard', semitoneOffsets: [-2, -2, -2, -2, -2, -2, -2] },
  ],
  bass4: [
    { key: 'standard', name: 'Standard', semitoneOffsets: [0, 0, 0, 0] },
    { key: 'dropD', name: 'Drop D', semitoneOffsets: [-2, 0, 0, 0] },
    { key: 'eb', name: 'E♭ Standard', semitoneOffsets: [-1, -1, -1, -1] },
    { key: 'dStd', name: 'D Standard', semitoneOffsets: [-2, -2, -2, -2] },
    { key: 'bead', name: 'BEAD', semitoneOffsets: [-5, -5, -5, -5] },
  ],
  bass5: [
    { key: 'standard', name: 'Standard', semitoneOffsets: [0, 0, 0, 0, 0] },
    { key: 'dropA', name: 'Drop A', semitoneOffsets: [-2, 0, 0, 0, 0] },
  ],
  bass6: [{ key: 'standard', name: 'Standard', semitoneOffsets: [0, 0, 0, 0, 0, 0] }],
  violin: [{ key: 'standard', name: 'Standard', semitoneOffsets: [0, 0, 0, 0] }],
};

/** MIDI number of a scientific-pitch note. */
export function noteMidi(note: string): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`bad note ${note}`);
  return NOTE_NAMES.indexOf(m[1] as (typeof NOTE_NAMES)[number]) + (parseInt(m[2], 10) + 1) * 12;
}

/**
 * A note reached from A4 by pure fifths (3:2) and octaves, the way bowed
 * players tune: A4 · 1.5ⁿ · 2ᵐ with 7n + 12m = semitones from A4. Falls back
 * to equal temperament when no small fifth-chain reaches the note.
 */
export function fifthsHz(note: string, a4 = 440): number {
  const d = noteMidi(note) - 69;
  for (let n = -6; n <= 6; n++) {
    const rest = d - 7 * n;
    if (rest % 12 === 0) return a4 * Math.pow(1.5, n) * Math.pow(2, rest / 12);
  }
  return noteHz(note, a4);
}

/**
 * The target strings for a configuration. Bowed instruments and the mandolin
 * default to PERFECT FIFTHS from A4; equal temperament is the alternative.
 * Capo raises every string by `capo` semitones where the instrument allows
 * one. Double courses with an octave partner produce TWO targets that share
 * a course, so either string of the pair can be tuned.
 */
export function buildTargets(
  instrument: InstrumentKey,
  tuningKey: string,
  a4: number,
  capo = 0,
  temperament: Temperament = INSTRUMENTS[instrument].fifths ? 'fifths' : 'equal',
): StringTarget[] {
  const inst = INSTRUMENTS[instrument];
  if (inst.chromatic) return [];
  const tuning = TUNINGS[instrument].find((t) => t.key === tuningKey) ?? TUNINGS[instrument][0];
  const shift = (i: number) => (tuning?.semitoneOffsets[i] ?? 0) + (inst.capo ? capo : 0);
  const hzOf = (note: string) => (inst.fifths && temperament === 'fifths' ? fifthsHz(note, a4) : noteHz(note, a4));
  const out: StringTarget[] = [];
  inst.strings.forEach((n, i) => {
    const note = midiToNote(noteMidi(n) + shift(i));
    out.push({ index: i + 1, label: inst.labels[i], note, hz: hzOf(note), course: i });
    const p = inst.partners?.[i];
    if (p) {
      const pNote = midiToNote(noteMidi(p) + shift(i));
      out.push({ index: i + 1, label: inst.labels[i], note: pNote, hz: hzOf(pNote), course: i, partner: true });
    }
  });
  return out;
}

/** Targets grouped by course for the string strip (one key per course). */
export function courses(targets: StringTarget[]): StringTarget[][] {
  const map = new Map<number, StringTarget[]>();
  targets.forEach((t) => {
    const arr = map.get(t.course) ?? [];
    arr.push(t);
    map.set(t.course, arr);
  });
  return [...map.values()];
}

/** Coaching for a double course with an octave partner. */
export function courseHint(target: StringTarget, targets: StringTarget[]): string | null {
  const mates = targets.filter((t) => t.course === target.course && t !== target);
  if (mates.length === 0) return null;
  return `Octave pair: tune one string at a time, mute its partner (${mates[0].note})`;
}

/**
 * Chromatic mode: the nearest semitone, held with hysteresis so a pitch that
 * wanders around the half-way point does not flip the display every frame.
 * `transposeSemis` turns concert pitch into the WRITTEN note for a B♭, E♭ or
 * F instrument; the frequency compared against stays concert.
 */
export function stepChromatic(prevMidi: number | null, hz: number, a4: number, transposeSemis = 0): { midi: number; target: StringTarget } {
  const exact = hzToMidi(hz, a4);
  let midi = Math.round(exact);
  if (prevMidi != null && Math.abs((exact - prevMidi) * 100) <= 60) midi = prevMidi;
  const concert = midiToNote(midi);
  const written = midiToNote(midi + transposeSemis);
  return {
    midi,
    target: { index: 0, label: transposeSemis ? `SOUNDS ${concert}` : 'CONCERT', note: written, hz: noteHz(concert, a4), course: 0 },
  };
}

/**
 * Sustained-tone readout for winds: mean cents and spread since the note
 * began. Resets whenever the note changes or the tone stops.
 */
export type HoldState = { note: string | null; since: number; n: number; sum: number; sumSq: number };
export const INITIAL_HOLD: HoldState = { note: null, since: 0, n: 0, sum: 0, sumSq: 0 };
export const HOLD_MIN_MS = 600;

export function stepHold(state: HoldState, note: string | null, cents: number | null, nowMs: number): HoldState {
  if (note == null || cents == null) return INITIAL_HOLD;
  if (state.note !== note) return { note, since: nowMs, n: 1, sum: cents, sumSq: cents * cents };
  return { note, since: state.since, n: state.n + 1, sum: state.sum + cents, sumSq: state.sumSq + cents * cents };
}

export function holdSummary(state: HoldState, nowMs: number): { avg: number; spread: number; ms: number } | null {
  if (state.note == null || state.n < 6 || nowMs - state.since < HOLD_MIN_MS) return null;
  const avg = state.sum / state.n;
  const variance = Math.max(0, state.sumSq / state.n - avg * avg);
  return { avg, spread: Math.sqrt(variance), ms: nowMs - state.since };
}

/** Words for the spread: how steady the sustained tone is. */
export function steadinessText(spread: number): string {
  if (spread <= 2) return 'ROCK STEADY';
  if (spread <= 5) return 'STEADY';
  if (spread <= 10) return 'WAVERING';
  return 'UNSTEADY';
}

/** Index of the target string nearest (in cents) to a detected frequency. */
export function nearestTarget(hz: number, targets: StringTarget[]): { i: number; cents: number } {
  let best = 0;
  let bestAbs = Infinity;
  let bestCents = 0;
  targets.forEach((t, i) => {
    const c = centsBetween(hz, t.hz);
    if (Math.abs(c) < bestAbs) {
      bestAbs = Math.abs(c);
      best = i;
      bestCents = c;
    }
  });
  return { i: best, cents: bestCents };
}

/**
 * AUTO targeting with hysteresis. `state.candidate` is a string that has been
 * nearer than the current target; it becomes the target only after it has
 * held for RETARGET_MS. Returns the (possibly unchanged) target index.
 */
export type TargetState = { target: number; candidate: number | null; candidateSince: number | null };

export function stepTarget(state: TargetState, nearestIdx: number, nowMs: number, manual: boolean): TargetState {
  if (manual) return { target: state.target, candidate: null, candidateSince: null };
  if (nearestIdx === state.target) return { ...state, candidate: null, candidateSince: null };
  if (state.candidate !== nearestIdx) return { ...state, candidate: nearestIdx, candidateSince: nowMs };
  if (state.candidateSince != null && nowMs - state.candidateSince >= RETARGET_MS) {
    return { target: nearestIdx, candidate: null, candidateSince: null };
  }
  return state;
}

/** The lock state machine. `confirmed` flips true once per entry into the zone. */
export type LockState = { inZoneSince: number | null; confirmed: boolean };

export const INITIAL_LOCK: LockState = { inZoneSince: null, confirmed: false };

export function stepLock(state: LockState, cents: number | null, nowMs: number): LockState & { justConfirmed: boolean } {
  if (cents == null || Math.abs(cents) > IN_TUNE_CENTS) {
    return { inZoneSince: null, confirmed: false, justConfirmed: false }; // leaving the zone re-arms
  }
  const since = state.inZoneSince ?? nowMs;
  const stable = nowMs - since >= CONFIRM_MS;
  const justConfirmed = stable && !state.confirmed;
  return { inZoneSince: since, confirmed: state.confirmed || stable, justConfirmed };
}

/**
 * Display damping: an exponential move toward the raw cents whose weight
 * shrinks as the reading nears centre — fast acquisition, heavy near the target.
 * `dtMs` normalises to a 60 Hz frame so the feel does not depend on frame rate.
 */
export function dampCents(shown: number, raw: number, dtMs: number): number {
  const distance = Math.abs(raw);
  const alphaPerFrame = distance > 20 ? 0.6 : distance > CLOSE_CENTS ? 0.4 : 0.22;
  const frames = Math.max(0.25, Math.min(4, dtMs / 16.7));
  const alpha = 1 - Math.pow(1 - alphaPerFrame, frames);
  return shown + (raw - shown) * alpha;
}

/** Direction words. */
export function directionText(cents: number | null, confirmed: boolean): string {
  if (cents == null) return 'PLAY A STRING';
  if (Math.abs(cents) >= OCTAVE_CENTS) return cents > 0 ? 'OCTAVE HIGH' : 'OCTAVE LOW';
  if (confirmed) return 'IN TUNE';
  if (Math.abs(cents) <= IN_TUNE_CENTS) return 'HOLD…';
  return cents < 0 ? 'FLAT · RAISE PITCH' : 'SHARP · LOWER PITCH';
}

/**
 * Magnitude colour: violet → blue → cyan → green (in tune) → yellow → orange →
 * red, keyed on |cents| so error SIZE reads as colour; direction is carried by
 * position and words, never by colour alone.
 */
export function magnitudeColor(cents: number | null): string {
  if (cents == null) return '#6b6f7a';
  const a = Math.abs(cents);
  if (a <= IN_TUNE_CENTS) return '#37e05f';
  if (a <= CLOSE_CENTS) return '#9be04a';
  if (a <= 12) return '#e5d34a';
  if (a <= 25) return '#f2a33a';
  if (a <= 50) return '#f0603a';
  return '#c94bd6';
}

/** Format a signed cents value for the big readout. */
export function fmtCents(cents: number | null): string {
  if (cents == null) return '—';
  const v = Math.abs(cents) < 0.05 ? 0 : cents;
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}¢`;
}

/** Low-string coaching: below ~65 Hz the fundamental is slow and weak. */
export const LOW_STRING_HZ = 65;
export function lowStringHint(targetHz: number, unstableMs: number): string | null {
  if (targetHz > LOW_STRING_HZ || unstableMs < 1500) return null;
  return 'Low string: try the 12th-fret harmonic, pluck away from the bridge';
}
