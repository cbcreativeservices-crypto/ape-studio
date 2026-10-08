/**
 * THE FIELD LOG (Lab 6 group 2; field_ambience/GEOMETRY_PROPOSAL.md §6,
 * F06 L40): the optional sheet every field lesson ends with, built on Lab 5's
 * worksheet (lessons/shared/ensemble/worksheet.ts: the same field shape and
 * its two-position comparison rows). Pure data; the Practice page shows it
 * and keeps it on this device through the lab's own store
 * (engine/progress/observations.ts → createLocalStore), only for a signed-in
 * account.
 *
 * TYPED FIELDS ONLY (O-12): no location is read, no GPS, no permission is
 * asked — permissions must match the app's binary. A place is written in
 * words ("the bench by the north gate, 8 m from the stream"). Field ids stay
 * under 32 characters (the store's sanitiser).
 */
import type { SheetField } from '../ensemble/worksheet.ts';

const text = (id: string, label: string): SheetField => ({ id, label, kind: 'text' });
const choice = (id: string, label: string, choices: string[]): SheetField => ({ id, label, kind: 'choice', choices });

/** The lines every field log carries (F06 L40). */
export const FIELD_LOG_CORE: SheetField[] = [
  text('when', 'Date, local time and time zone'),
  text('site', 'Site in words, and the permission to be there'),
  text('weather', 'Weather and wind (direction, gusts), and the wind protection used'),
  text('mic', 'Mic type and pattern; the array, its spacing or angle, and which way it faced'),
  text('height', 'Height and position (in words, from landmarks)'),
  text('recorder', 'Recorder settings, any filter, and the channel map'),
  text('take', 'Take length and what happened in it (events, intrusions)'),
  text('limits', 'Restrictions on use (people, privacy, the site’s rules)'),
];

/** Two positions compared, Lab 5's way: the same rows for A and B. */
export const FIELD_COMPARE_ROWS: readonly { id: string; label: string }[] = [
  { id: 'where', label: 'Where it stood, and the one thing you changed' },
  { id: 'heard', label: 'What it heard: the bed, the events, the balance' },
  { id: 'mono', label: 'Mono and left/right checked (start, middle, end)' },
  { id: 'wind', label: 'Wind or handling on the take' },
];

export function fieldCompare(): SheetField[] {
  return (['a', 'b'] as const).flatMap((p) => FIELD_COMPARE_ROWS.map((r) => text(`${p}.${r.id}`, `POSITION ${p.toUpperCase()} · ${r.label}`)));
}

/** A lesson's log: the core lines, the lesson's own, the comparison, the decision. */
export function fieldLog(own: readonly SheetField[], o: { compare?: boolean } = {}): SheetField[] {
  return [...FIELD_LOG_CORE, ...own, ...(o.compare === false ? [] : fieldCompare()), text('decision', 'What you chose and why — and the limit that remains')];
}

export { choice as logChoice, text as logText };
