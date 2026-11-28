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

/* ── BUILD · the console tray in steps (beginner waves 2026-11-15) ──────── */

/** SS-10 (owner 2026-11-15: "build waves 1 thru 3", D62 adoption plan):
 *  capstones 7, 8 and 10 opened the whole desk in one tray (40 to 80 small
 *  controls, three routing ideas at once). The tray now shows ONE step at a
 *  time: the first step whose console requirements are not met yet is open;
 *  every other step is a one-line header that opens on a tap. Nothing is
 *  removed: each column, strip and readout is in exactly one step. */
export type ConsoleStep = {
  /** The step's name on its header (GROUP, EFFECTS, DCA…). */
  label: string;
  /** What the step is for, in a few words. */
  blurb: string;
  /** The capstone's route requirement ids this step meets. */
  reqs: readonly string[];
  /** The desk columns shown in this step (ConsoleColumn ids). */
  columns: readonly string[];
  subgroups?: boolean;
  dcas?: boolean;
  /** Matrix strips shown in this step (ids). */
  matrices?: readonly string[];
  /** "Who hears" readouts shown in this step (their titles). */
  hears: readonly string[];
};

export const CONSOLE_STEPS: Readonly<Record<string, readonly ConsoleStep[]>> = {
  'groups-fx': [
    { label: 'GROUP', blurb: 'the drums on their subgroup, and the subgroup into the main mix', reqs: ['drumsSub', 'drumsMain'], columns: ['main', 'sub'], subgroups: true, hears: ['MAIN MIX HEARS', 'DRUMS SUBGROUP HEARS'] },
    { label: 'EFFECTS', blurb: 'both vocals to the reverb on Aux 5, post-fader', reqs: ['reverb'], columns: ['send:aux5'], hears: ['AUX 5 · REVERB HEARS'] },
    { label: 'DCA', blurb: 'every band channel on the BAND DCA', reqs: ['dca'], columns: ['dca'], dcas: true, hears: [] },
  ],
  matrices: [
    { label: 'FILLS AND SUBS', blurb: 'Matrix 2 and Matrix 1 take the main mix', reqs: ['fills', 'subs'], columns: ['main'], matrices: ['mx-fills', 'mx-subs'], hears: ['MATRIX 2 · FRONT FILLS HEAR', 'MATRIX 1 · SUBS HEAR'] },
    { label: 'LOBBY', blurb: 'the announce mic to Aux 7, and Matrix 3 taking the main mix and Aux 7', reqs: ['lobby'], columns: ['send:aux7'], matrices: ['mx-lobby'], hears: ['MATRIX 3 · LOBBY HEARS'] },
    { label: 'SUB AUX', blurb: 'nothing vocal sent to Aux 6', reqs: ['noVox'], columns: ['send:aux6'], hears: [] },
  ],
  festival: [
    { label: 'MONITORS', blurb: 'four wedge mixes on Aux 1 to 4, all pre-fader', reqs: ['fourMixes'], columns: ['send:aux1', 'send:aux2', 'send:aux3', 'send:aux4'], hears: ['AUX 1 · WEDGE 1 HEARS'] },
    { label: 'IN-EARS', blurb: 'the singer’s vocal to the in-ears, pre-fader', reqs: ['iemMix'], columns: ['send:aux8', 'send:aux9', 'send:aux10'], hears: ['AUX 8 · THE IN-EARS HEAR', 'AUX 9 · IN-EARS L HEARS', 'AUX 10 · IN-EARS R HEARS'] },
    { label: 'RECORDING', blurb: 'Matrix 4 takes the main mix', reqs: ['rec'], columns: [], matrices: ['mx-rec'], hears: ['MATRIX 4 · RECORDING HEARS'] },
    { label: 'SUBS', blurb: 'only kick, bass and keys on Aux 6', reqs: ['subs'], columns: ['send:aux6'], hears: ['AUX 6 · THE SUBS HEAR'] },
  ],
};

/** Which step is open: the learner's own pick when they tapped a header,
 *  else the first step with a requirement still unmet; -1 when every step
 *  is met and nothing was picked (all headers show ✓). */
export function openConsoleStep(steps: readonly ConsoleStep[], met: readonly string[], picked: number | null): number {
  if (picked === -1) return -1; // the open step's own header folded it shut
  if (picked != null && picked >= 0 && picked < steps.length) return picked;
  return steps.findIndex((s) => s.reqs.some((r) => !met.includes(r)));
}

/** A step's header line: "✓ GROUP · …" once its requirements are met. */
export function consoleStepHeader(step: ConsoleStep, met: readonly string[], open: boolean): string {
  const done = step.reqs.every((r) => met.includes(r));
  return `${done ? '✓ ' : ''}${step.label}${open ? ' ▴' : ' ▾'} · ${step.blurb}`;
}

/* ── the home page (beginner waves 2026-11-15) ──────────────────────────── */

/** SS-04 (owner 2026-11-15: "build waves 1 thru 3"): the whole signal chain
 *  in one line at the top of the home page, and where to start. The names
 *  are the lab's own station names (types.ts STATION_LABEL: console, not
 *  mixer; processor; loudspeaker), so one part keeps one name (SH-36). */
export const SS_CHAIN: readonly string[] = ['SOURCE', 'STAGE INPUT', 'CONSOLE', 'PROCESSOR', 'AMPLIFIER', 'LOUDSPEAKER', 'LISTENER'];
export const SS_START_LINE = 'Every live system is this one chain. Start with LEARN: it teaches the chain, and the other four modes, in any order, put it to work.';

/** SH-76 (owner 2026-11-15: "build waves 1 thru 3"): every tray choice
 *  carries a one-line meaning. The ROUTE patch page's BUS tray listed bare
 *  bus names; each now says what that bus carries (in general, never which
 *  socket it belongs to). */
export const BUS_BLURB: Readonly<Record<string, string>> = {
  'Main L': 'The main mix, left side: the mix the house faders control.',
  'Main R': 'The main mix, right side.',
  'Aux 1': 'An auxiliary send: a separate mix, built from each channel’s own send level.',
  'Aux 2': 'Another auxiliary send, with a separate mix of its own.',
  'Aux 6': 'An auxiliary send; on this console it is the sub aux, for the low sources.',
  'Matrix 2': 'A matrix: a blend of the console’s buses (the main mix, an aux) with its own level, EQ and delay.',
  'Matrix 3': 'Another matrix, with its own level and its own blend of buses.',
};
