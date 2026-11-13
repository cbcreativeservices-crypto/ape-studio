/**
 * bitsLogic — the PURE half of the Game Audio lab's well furniture (bits.tsx
 * draws what this decides): how one line of the activity log is worded, how
 * its time is printed, and what an empty log says. No React, so each rule is
 * proven in test/gameAudioScene.test.ts.
 */
import { GA_LOG_KIND_WORD, type GaLogKind } from './model/gaModel.ts';

/** The word in a log line's first column: what KIND of line it is (the
 *  model's own table, so the log, the trays and the strips agree). */
export const GA_KIND_WORD = GA_LOG_KIND_WORD;

const UNHEARD = '(not heard: sound is off)';
const esc = (w: string): string => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One log line as it is shown: the kind as ONE clean label, and the text
 *  with that same word taken out, whichever side it came from (audit 2,
 *  L-02 / W1 F16: rows read "START  START Door…", "STATE  STATE mood…",
 *  "MUSIC  music: STOP", "REFUSED  Crate impact REFUSED: …").
 *
 *   - the text opens with the kind word ("START …", "music: …") → dropped
 *   - the kind word stands before a colon inside the text ("… REFUSED: …")
 *     → dropped; the colon stays
 *   - "(not heard: sound is off)" moves to the END of a START line, so the
 *     line opens with what started
 *
 *  Nothing else is touched: "TRIGGER foot contact" keeps its word under GAME
 *  (TRIGGER is the lab's own term, not the column's word). */
export function gaLogRow(kind: GaLogKind, text: string): { word: string; text: string } {
  const word = GA_KIND_WORD[kind];
  let t = text.trim();
  const w = esc(word);
  const lead = new RegExp(`^${w}(?::\\s*|\\s+|$)`, 'i');
  if (lead.test(t)) t = t.replace(lead, '');
  else t = t.replace(new RegExp(`\\s+${w}(?=:)`), '');
  if (t.startsWith(UNHEARD)) t = `${t.slice(UNHEARD.length).trim()} ${UNHEARD}`;
  // a line that was ONLY its kind word ("music: STOP" under STOP…) keeps it
  return { word, text: t.length ? t : text.trim() };
}

/** What a screen reader says for one line. */
export function gaLogSpoken(kind: GaLogKind, text: string): string {
  const r = gaLogRow(kind, text);
  return `${r.word}: ${r.text}`;
}

/** The time column: scene seconds, always ONE line in its cell. Up to
 *  9999.9 s it shows a tenth of a second; beyond that, whole seconds
 *  (audit 2, W1 F06: "1000.0s" wrapped in a 40 pt cell). At most 7
 *  characters, which is what the cell is sized for. */
export function gaLogTime(t: number): string {
  const s = Number.isFinite(t) && t > 0 ? t : 0;
  return s < 9999.95 ? `${s.toFixed(1)}s` : `${Math.round(s)}s`;
}

const orList = (words: string[]): string => (words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`);

/** What an EMPTY log says. A page may show only some kinds of line; then
 *  "nothing has happened" would be false while sounds are playing (audit 2,
 *  W2-22), so the log says which kinds it shows and that none of those has
 *  happened yet.
 *    only   the kinds this log shows (undefined = every kind)
 *    total  how many lines of ANY kind the scene's log holds */
export function gaLogEmpty(only: readonly GaLogKind[] | undefined, total: number): string {
  if (!only || !only.length) return 'Nothing has happened yet. Use the controls at the bottom.';
  const kinds = orList(only.map((k) => GA_KIND_WORD[k]));
  if (total > 0) return `No ${kinds} line yet. This log shows only ${only.length === 1 ? 'that kind' : 'those kinds'} of line; other things have happened.`;
  return `Nothing has happened yet. This log shows only ${kinds} lines.`;
}

/** The hints a TROUBLESHOOT card may give NOW (bug test 2026-11-13,
 *  B-S1-03: SHOW A HINT gave the cause while the fault was still unnamed).
 *  Before the learner has met the symptom (`seen` false) the only hint is
 *  "first make the problem happen", in the page's own words when it gives
 *  them (`before`); the page's cause hints come only after the symptom.
 *  `shownBefore` / `shownAfter` are how many of each list have been asked
 *  for: a hint asked for before the symptom never reveals a cause hint later. */
export const GA_FAULT_FIRST_HINT = 'First make the problem happen: do what the report above says, then watch the readouts and the newest lines of the log.';
export function gaFaultHints(hints: readonly string[], seen: boolean, before: string | undefined, shownBefore: number, shownAfter: number): { shown: string[]; more: boolean } {
  const list = seen ? hints : [before ?? GA_FAULT_FIRST_HINT];
  const n = seen ? shownAfter : shownBefore;
  return { shown: list.slice(0, n), more: n < list.length };
}

/** A readout under the scene: the frame's cell, plus what it becomes on a
 *  NARROW phone (window under GA_NARROW_W wide). At 320 wide five even cells
 *  cut "PLAYING" to "PLAYI…" and "YOUR FLOOR" to "YOUR FL…" (bug test
 *  2026-11-13, B-S2-06). House rule (decision 4): a label may SHORTEN, a
 *  number never. On a narrow phone each cell's share is what its words need
 *  (its key or its value, whichever is wider, in the frame's own type), so
 *  a short value gives its room to a long key; a value still too wide drops
 *  its key and shrinks, never under 9 pt (rack/BezelReadouts).
 *    kNarrow     the shorter key on a narrow phone */
export type GaReadout = { k: string; v: string; flex?: number; kNarrow?: string };
export const GA_NARROW_W = 360;
/** The frame's type, measured: a key letter (Oswald 12, spaced) and a value
 *  letter (mono 13.5), and a cell's padding and rule, in points. */
export const GA_KEY_CH = 6.7;
export const GA_VAL_CH = 8.1;
export const GA_CELL_PAD = 17;
/** The width a cell needs to show its whole key and its whole value. */
export const gaReadoutNeed = (k: string, v: string): number => Math.max(k.length * GA_KEY_CH, v.length * GA_VAL_CH) + GA_CELL_PAD;
export function gaFitReadouts<T extends GaReadout>(items: readonly T[], winW: number): Omit<T, 'kNarrow'>[] {
  const narrow = Number.isFinite(winW) && winW > 0 && winW < GA_NARROW_W;
  return items.map(({ kNarrow, ...it }) => {
    if (!narrow) return it;
    const k = kNarrow ?? it.k;
    return { ...it, k, flex: Math.round(gaReadoutNeed(k, it.v)) / 50 };
  });
}

/** "1 instance", "2 instances": a count with the right word. */
export const gaCount = (n: number, one: string, many: string = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
