/**
 * THE MEASUREMENT SHEET — the field log every measurement lesson ends with
 * (F11 L49–L68, F12 L51, F13 L53; BATCH6_RESEARCH_SUMMARY_PART2.md §3.9).
 * Pure data, shown by the Practice page's optional sheet, which keeps it on
 * this device through the lab's own store (engine/progress/observations.ts →
 * createLocalStore) and only for a signed-in account.
 *
 * TYPED FIELDS ONLY: no location is read, no GPS, no permission is asked —
 * a place is written in words ("north lawn, 2 m from the facade"). The
 * owner's name line for the learner is gone (CORRECTIONS_LOG, Lab 6 group 4 item 14).
 */
export type SheetField = { id: string; label: string; kind: 'text' | 'choice'; choices?: string[] };

const text = (id: string, label: string): SheetField => ({ id, label, kind: 'text' });
const choice = (id: string, label: string, choices: string[]): SheetField => ({ id, label, kind: 'choice', choices });

/** The lines every measurement sheet carries. */
const COMMON: SheetField[] = [
  text('question', 'Question and method (in your own words)'),
  text('chain', 'Mic, preamp, power and input (model and serial as written on them)'),
  choice('label', 'This result is', ['Relative only', 'Calibrated, under the named method', 'Marked for investigation']),
];

/** F11 — microphone and calibration sheet. */
export const MEASURE_SHEET: SheetField[] = [
  ...COMMON,
  choice('field', 'Field response and orientation', ['Free field, aimed as its data says', 'Pressure (coupler or flush)', 'Random incidence', 'Not known — relative only']),
  text('cal', 'Calibrator, adapter, stated level, before and after (unadjusted)'),
  text('position', 'Position and source state (height, distance, orientation, grid or windscreen)'),
  text('notes', 'Drift action, correction data, and the claim’s limit'),
];

/** F12 — the field sheet for a sound-level survey. */
export const FIELD_SHEET: SheetField[] = [
  ...COMMON,
  text('point', 'Receiver points (in words: what, where, height, distance to the facade)'),
  choice('descriptor', 'Descriptor', ['LAeq over the window', 'LAFmax', 'L10 / L50 / L90', 'A peak, as the method names it']),
  text('window', 'Start, stop and window length'),
  text('weather', 'Wind, rain, temperature; events and exclusions with their reason'),
  text('notes', 'One supported conclusion and two limits'),
];

/** F13 — the room measurement sheet. */
export const ROOM_SHEET: SheetField[] = [
  ...COMMON,
  text('state', 'Room state: doors, curtains, panels, people, air handling'),
  text('runs', 'Runs: source, receiver, repeat — positions and heights'),
  choice('decay', 'Decay figure supported', ['T30', 'T20', 'Neither — not enough range']),
  text('notes', 'Bands that were refused, spread between positions, and the result’s label'),
];
