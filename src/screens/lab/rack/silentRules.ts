/**
 * silentRules — the pure half of the silent learner's frame (silentPath.tsx;
 * lab fix round 1, 2026-11-14, section 3 row 3). No imports, so the tests can
 * load it directly.
 */

/** The shared frame line (student's voice, knowledge not skills). */
export const SOUND_OFF_LINE = 'Sound off? You can still do every step. The readouts show what you would hear.';
/** The tag's words. */
export const NEEDS_SOUND = 'NEEDS SOUND';
/** What a stored value adds when it is read aloud (Game Audio's words). */
export const NOT_HEARD = 'not heard: sound is off';

/** The line a rack's `soundOffLine` asks for: `true` = the shared words, a
 *  string = the lab's own, anything else = none. */
export function soundOffLineText(ask: boolean | string | undefined): string | null {
  if (typeof ask === 'string') return ask.trim() ? ask : null;
  return ask === true ? SOUND_OFF_LINE : null;
}

/** "Hear the click" → "Hear the click (needs sound)". */
export function needsSoundA11y(label: string): string {
  return `${label} (needs sound)`;
}

/**
 * A readout's words with the silent rule: while sound is off and a stored
 * value exists, the stored value, read aloud with "(not heard: sound is off)".
 */
export function silentValue(soundOff: boolean, live: string, stored?: string | null): { v: string; a11y: string } {
  if (soundOff && stored != null && stored !== '') return { v: stored, a11y: `${stored} (${NOT_HEARD})` };
  return { v: live, a11y: live };
}
