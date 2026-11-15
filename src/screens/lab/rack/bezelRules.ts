/**
 * bezelRules — the pure half of the bezel's lab-fix-round-1 additions
 * (2026-11-14; BezelReadouts, bezelFirstSight): the spoken label without a
 * doubled unit, the silent swap (row 3), the Hz / dB chip's cue and words,
 * and the captions' id (row 7). Type-only imports, so tests load it directly.
 */
import type { BezelItem } from './rackTypes';
import { NOT_HEARD } from './silentRules.ts';

/**
 * A cell's spoken label (pure; lab fix round 1, 2026-11-14). The sub line is
 * read after the value only when the value's own words do not already carry
 * it: DJ Systems' dB cells pass `vA11y: "-8.4 dBFS"` AND `sub: "dBFS"`, and
 * the label read "-8.4 dBFS dBFS" (G5b, G5c screens 7 and 21).
 */
export function bezelCellSaid(it: Pick<BezelItem, 'v' | 'vA11y' | 'sub' | 'helpKey' | 'onPress'>, silentNote = false): string {
  const said = it.vA11y ?? it.v;
  const sub = it.sub && !said.toLowerCase().includes(it.sub.trim().toLowerCase()) ? ` ${it.sub}` : '';
  // A cell with no tap job of its own opens its lesson on a tap (SN-2,
  // 2026-11-15), so it says "tap"; a tap-to-reset cell keeps "long-press".
  const lesson = it.helpKey ? (it.onPress ? ' — long-press for its lesson' : ' — tap for its lesson') : '';
  return `${said}${sub}${silentNote ? ` (${NOT_HEARD})` : ''}${lesson}`;
}

/**
 * What a plain TAP on a bezel cell does about its lesson (pure; beginner
 * waves 2026-11-15, SN-2 from F6b TB-01). Help must not hide behind
 * long-press, so a cell with a `helpKey` opens it on a tap too — but ONLY
 * when the tap has no job: a cell's own `onPress` (tap-to-reset) always
 * wins, and with no `onHelp` there is nothing to open. The long-press stays.
 */
export function bezelTapHelp(
  it: Pick<BezelItem, 'helpKey' | 'onPress'>,
  onHelp: ((helpKey?: string) => void) | undefined,
): (() => void) | undefined {
  if (it.onPress || !it.helpKey || !onHelp) return undefined;
  const key = it.helpKey;
  return () => onHelp(key);
}

/** The cell as drawn: a `silent` value replaces the live one while sound is
 *  off (row 3). Pure. */
export function bezelShown(it: BezelItem, soundOff: boolean): { it: BezelItem; silent: boolean } {
  if (!soundOff || !it.silent || !it.silent.v) return { it, silent: false };
  return { it: { ...it, v: it.silent.v, vA11y: it.silent.vA11y, sub: it.silent.sub }, silent: true };
}

/** A value that shows hertz or decibels (the units chip's cue). Pure. */
export function showsHzOrDb(values: readonly string[]): boolean {
  return values.some((v) => /(^|[\d\s(])(k?Hz|dB)/.test(v));
}

export const UNITS_CHIP_LABEL = 'Hz? dB? WHAT THEY MEAN ›';
export const UNITS_TITLE = 'WHAT Hz AND dB MEAN';
export const UNITS_LINES: readonly { term: string; text: string }[] = [
  { term: 'Hz (hertz)', text: 'How many times a second the wave repeats. Low numbers are low notes, high numbers are high notes; 1 kHz is 1,000 Hz.' },
  { term: 'dB (decibels)', text: 'How much stronger or weaker, compared with a reference. +6 dB is about twice the signal, −6 dB about half.' },
  { term: 'The letters after dB', text: 'Name that reference: dBFS is the top of a digital meter, dB SPL is pressure in the air, dBu is voltage in a cable.' },
];

/** The id a stage's captions count under: its own, else the captions joined
 *  (so two different strips never share a "seen"). */
export function captionsIdFor(explicit: string | undefined, captions: readonly (string | undefined)[]): string | null {
  const words = captions.filter((c): c is string => typeof c === 'string' && c.trim() !== '');
  if (!words.length) return null;
  return explicit && explicit.trim() ? explicit : words.join('|');
}
