/**
 * Sound Systems Lab — small pure helpers from the lab fix round of 2026-11-14
 * (group F2), kept out of the .tsx pages so test/labFixes_20261114_F2
 * reaches them. Each says which finding it answers.
 */
import type { Reading } from '../../../features/soundsystems/faults';

/* ── TROUBLESHOOT · the bench ───────────────────────────────────────────── */

/** A flag in words: `wrongContent` → "WRONG CONTENT" (it printed as the code
 *  word "WRONGCONTENT" on the READS cell and the reading's header). */
export function flagWords(flag: string): string {
  return flag.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
}

/** The short readout for a probed station. A station whose signal is
 *  healthy but carries the fault's flag reads the flag alone ("HUM",
 *  "WRONG CONTENT"), as the map already did — never "OK · HUM" on the
 *  faulty station ("OK · WRONGCONTENT"). */
export function readoutOf(r: Reading): string {
  const flag = r.flags?.[0];
  const sig = r.signal === 'ok' ? 'OK' : r.signal === 'none' ? 'NO SIGNAL' : r.signal === 'low' ? 'LOW' : r.signal === 'hot' ? 'HOT' : 'CLIP';
  if (!flag) return sig;
  return r.signal === 'ok' ? flagWords(flag) : `${sig} · ${flagWords(flag)}`;
}

/** The one word under a probed station on the map — and the PROBE key's
 *  value, which printed only the first word of the reading ("PROBE ▸ NO"
 *  for NO SIGNAL): the flag when the station carries one, else the signal. */
export function mapReadout(r: Reading): string {
  const flag = r.flags?.[0];
  return flag ? flagWords(flag) : readoutOf(r);
}

/** Why FAULT is locked before the first probe (no trailing full stop: the
 *  dock adds its own). */
export const NAME_NEEDS_A_PROBE = 'probe a station first. The bench names a fault from a reading, not from the list';

/** May a pick be made now? Never once solved, never while a wrong pick waits
 *  for the next probe, and never before the first probe of the case ("a
 *  0-probe answer counts as solved"). */
export function canName(solved: boolean, locked: boolean, probes: number): boolean {
  return !solved && !locked && probes > 0;
}

/** The FAULT key's id for one case run: a new id per case (and per RESET)
 *  closes the tray left open from the LAST case, which covered NEXT and
 *  showed the answers before any probe (quick win 10); a new id once solved
 *  closes it so the debrief and NEXT are in view. */
export function faultKeyId(run: number, solved: boolean): string {
  return `fault-${run}${solved ? '-done' : ''}`;
}

/* ── the end screen of a mode ───────────────────────────────────────────── */

/** "TROUBLESHOOT COMPLETE", never "LAB COMPLETE": each of the five modes is
 *  one part of the lab ("FINISH says LAB COMPLETE after one mode"). `title`
 *  is the mode screen's title, "Sound Systems · Troubleshoot". */
export function modeCompleteTitle(title: string): string {
  const mode = title.split('·').slice(1).join('·').trim();
  return mode ? `${mode.toUpperCase()} COMPLETE` : 'LAB COMPLETE';
}

/** The end screen's one sentence on how a page counts, said once above the
 *  list (phase 2, S2 §4); each row then names its own missing goals. */
export const SS_HOW_A_PAGE_COUNTS = 'A module counts once every goal chip in it is met (a capstone, once its checklist passes); opening it does not count it. Rows you opened this session name what is still missing.';

/* ── BUILD ──────────────────────────────────────────────────────────────── */

/** The venue line as a sentence with ONE full stop: every venue already
 *  ends with one ("One presenter."), and the caption added a second —
 *  "One presenter.." in all ten capstones. */
export function venueSentence(venue: string): string {
  const v = venue.trim();
  return /[.!?]$/.test(v) ? v : `${v}.`;
}

/* ── goals that are STATES (OPERATE 3 and 4) ────────────────────────────── */

/** The words a goal chip shows. `now`: whether the goal is true at this
 *  moment. A goal met earlier but lost again keeps its credit and says "not
 *  now", instead of a plain ✓ beside a readout that contradicts it ("✓ No
 *  stage clipping" next to VERDICT CLIPPING). */
export function goalChipText(label: string, latched: boolean, now?: boolean): { mark: string; text: string; lost: boolean } {
  const lost = latched && now === false;
  return { mark: latched ? '✓ ' : '○ ', text: lost ? `${label} · met earlier, not now` : label, lost };
}

/* ── OPERATE 1 and 5 · the power rack ───────────────────────────────────── */

/** Is this rack item powered? Power-UP lists the steps switched ON so far;
 *  power-DOWN lists the steps switched OFF so far. */
export function rackLit(on: ReadonlySet<string>, direction: 'up' | 'down', step: string): boolean {
  return direction === 'up' ? on.has(step) : !on.has(step);
}

/** The rack's spoken label, from the SAME test as the drawing (on power-down
 *  it read the opposite of the screen). */
export function rackA11y(items: readonly { step: string; label: string }[], on: ReadonlySet<string>, direction: 'up' | 'down'): string {
  return `The rack: ${items.map((r) => `${r.label} ${rackLit(on, direction, r.step) ? 'on' : 'off'}`).join(', ')}`;
}

/* ── progress words (lab fix round 2026-11-14, phase 3, owner decision 2) ── */

/** What is LEFT, never "N of total": "3 LEFT", or `doneWord` once nothing is. */
export function leftWord(done: number, total: number, doneWord = 'ALL DONE'): string {
  const left = Math.max(0, total - done);
  return left === 0 ? doneWord : `${left} LEFT`;
}
