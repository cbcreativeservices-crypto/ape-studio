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

export type InstrumentKey = 'guitar6' | 'guitar7' | 'bass4' | 'bass5' | 'bass6' | 'violin';
export type Temperament = 'equal' | 'fifths';

export type StringTarget = {
  /** 1 = lowest string, as players count them. */
  index: number;
  label: string; // "LOW E", "A", …
  note: string; // "E2"
  hz: number;
};

export type Tuning = { key: string; name: string; semitoneOffsets: number[] };

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

/** Open strings low → high, sounding pitch. */
export const INSTRUMENTS: Record<InstrumentKey, { name: string; strings: string[]; labels: string[] }> = {
  guitar6: { name: 'Guitar', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], labels: ['LOW E', 'A', 'D', 'G', 'B', 'HIGH E'] },
  guitar7: { name: '7-String', strings: ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'], labels: ['LOW B', 'E', 'A', 'D', 'G', 'B', 'HIGH E'] },
  bass4: { name: 'Bass', strings: ['E1', 'A1', 'D2', 'G2'], labels: ['E', 'A', 'D', 'G'] },
  bass5: { name: '5-String Bass', strings: ['B0', 'E1', 'A1', 'D2', 'G2'], labels: ['LOW B', 'E', 'A', 'D', 'G'] },
  bass6: { name: '6-String Bass', strings: ['B0', 'E1', 'A1', 'D2', 'G2', 'C3'], labels: ['LOW B', 'E', 'A', 'D', 'G', 'C'] },
  violin: { name: 'Violin', strings: ['G3', 'D4', 'A4', 'E5'], labels: ['G', 'D', 'A', 'E'] },
};

/** Tunings as semitone offsets per string, low → high. */
export const TUNINGS: Record<InstrumentKey, Tuning[]> = {
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

/**
 * The target strings for a configuration. Violin defaults to PERFECT FIFTHS
 * built outward from A4 (D = A/1.5, G = D/1.5, E = A·1.5); equal temperament
 * uses the ordinary note frequencies. Capo raises every string by `capo`
 * semitones (guitar/bass only).
 */
export function buildTargets(
  instrument: InstrumentKey,
  tuningKey: string,
  a4: number,
  capo = 0,
  temperament: Temperament = instrument === 'violin' ? 'fifths' : 'equal',
): StringTarget[] {
  const inst = INSTRUMENTS[instrument];
  const tuning = TUNINGS[instrument].find((t) => t.key === tuningKey) ?? TUNINGS[instrument][0];
  if (instrument === 'violin' && temperament === 'fifths') {
    const A = a4;
    const D = A / 1.5;
    const G = D / 1.5;
    const E = A * 1.5;
    return [
      { index: 1, label: 'G', note: 'G3', hz: G },
      { index: 2, label: 'D', note: 'D4', hz: D },
      { index: 3, label: 'A', note: 'A4', hz: A },
      { index: 4, label: 'E', note: 'E5', hz: E },
    ];
  }
  return inst.strings.map((n, i) => {
    const midi = Math.round(hzToMidi(noteHz(n, a4), a4)) + tuning.semitoneOffsets[i] + (instrument === 'violin' ? 0 : capo);
    const note = midiToNote(midi);
    return { index: i + 1, label: inst.labels[i], note, hz: noteHz(note, a4) };
  });
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
