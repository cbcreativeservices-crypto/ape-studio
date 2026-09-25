/**
 * Sound Systems Lab — amplifier, loudspeaker and timing arithmetic.
 *
 * ⛔ NOTHING HERE DERIVES A FORMULA. Every number a page prints comes from the
 * Audio Calculator Laboratory — the app's single, verified source of truth
 * (owner standard 2026-08-09: the calculators are held to a field-safety
 * bar; a lab re-deriving them would be a second copy that could drift). These
 * are thin wrappers that call the registered calculator functions and hand
 * back the value the page needs, plus the exact workspace/function keys so a
 * page can deep-link "open this in the calculator".
 *
 * The one thing this module ADDS is judgement copy — the amplifier-matching
 * guideline and the impedance verdict — stated as guidance, never as a
 * measurement.
 */
import { getWorkspace } from '../../screens/lab/calc/registry';
import type { CalcValues, OutputVal } from '../../screens/lab/calc/calcTypes';
import { speedOfSoundAir } from '../../screens/lab/calc/calcUnits';

function compute(workspaceId: string, fnKey: string, v: CalcValues): OutputVal[] {
  const ws = getWorkspace(workspaceId);
  const fn = ws?.functions.find((f) => f.key === fnKey);
  if (!fn) throw new Error(`Calculator ${workspaceId}.${fnKey} is not registered`);
  return fn.compute(v);
}

function numberOut(outs: OutputVal[], label: string): number {
  const o = outs.find((x) => x.label === label);
  if (!o || !('value' in o)) throw new Error(`Calculator output "${label}" missing`);
  return o.value;
}

/** Where each figure comes from — the calculator link every page offers. */
export const CALC_LINKS = {
  parallel: { workspace: 'impedance', fn: 'parallel', label: 'Parallel loudspeaker loads' },
  spl: { workspace: 'speakerpower', fn: 'predictspl', label: 'Predicted SPL at the listener' },
  delay: { workspace: 'distdelay', fn: 'distToDelay', label: 'Delay from distance' },
  comb: { workspace: 'comb', fn: 'combFromPath', label: 'Comb filter from a path difference' },
  splDistance: { workspace: 'spldist', fn: 'point', label: 'SPL at a new distance' },
} as const;

/* ── impedance ───────────────────────────────────────────────────────────── */

export type LoadResult = {
  /** Total impedance the amplifier channel sees, in ohms. */
  ohms: number;
  /** The calculator's own warning row, when it raised one. */
  warning: string | null;
};

/** Total parallel impedance of the cabinets on one amplifier channel. */
export function parallelLoad(ohmsEach: number[]): LoadResult {
  const zs = ohmsEach.filter((z) => z > 0);
  if (zs.length === 0) return { ohms: Infinity, warning: null };
  const outs = compute(CALC_LINKS.parallel.workspace, CALC_LINKS.parallel.fn, { zlist: zs });
  const warn = outs.find((o) => o.label === 'AMPLIFIER LOAD WARNING');
  return { ohms: numberOut(outs, 'TOTAL PARALLEL IMPEDANCE'), warning: warn && 'text' in warn ? warn.text : null };
}

export type LoadVerdict = 'safe' | 'marginal' | 'unsafe' | 'open';

/** Judge a load against the amplifier's minimum rated impedance.
 *  `marginal` = at the limit exactly (the amp runs hot, and cable resistance
 *  gives no margin); `unsafe` = below it (current limiting, protection, or
 *  failure). */
export function loadVerdict(totalOhms: number, ampMinOhms: number): LoadVerdict {
  if (!Number.isFinite(totalOhms)) return 'open';
  if (totalOhms < ampMinOhms) return 'unsafe';
  if (totalOhms === ampMinOhms) return 'marginal';
  return 'safe';
}

export function loadVerdictCopy(v: LoadVerdict, totalOhms: number, ampMinOhms: number): string {
  switch (v) {
    case 'open':
      return 'No loudspeaker connected — the amplifier sees an open circuit. Nothing plays; nothing is harmed.';
    case 'unsafe':
      return `${fmtOhms(totalOhms)} is BELOW this amplifier’s ${ampMinOhms} Ω minimum. It will current-limit, run into protection, or overheat. Re-wire the cabinets or use more amplifier channels.`;
    case 'marginal':
      return `${fmtOhms(totalOhms)} is exactly the ${ampMinOhms} Ω minimum. Legal, but the amplifier runs at its hottest with no margin for long cable runs — watch its temperature.`;
    default:
      return `${fmtOhms(totalOhms)} is above the ${ampMinOhms} Ω minimum — a safe load for this amplifier.`;
  }
}

export function fmtOhms(z: number): string {
  if (!Number.isFinite(z)) return '∞ Ω';
  return `${Number.isInteger(z) ? z : z.toFixed(2)} Ω`;
}

/* ── amplifier matching ──────────────────────────────────────────────────── */

export type MatchVerdict = 'under' | 'ok' | 'over';

/**
 * The common professional GUIDELINE (stated as one): choose an amplifier whose
 * continuous power into the loudspeaker’s impedance sits between the
 * loudspeaker’s continuous rating and its program rating (≈ 2× continuous).
 * Below that band, reaching level means driving the amplifier into clipping —
 * which is what actually burns high-frequency drivers. Well above it, a
 * moment’s carelessness delivers more than the voice coil can dissipate.
 */
export function ampMatch(ampWattsIntoLoad: number, speakerContinuousW: number, speakerProgramW = speakerContinuousW * 2): MatchVerdict {
  if (ampWattsIntoLoad < speakerContinuousW) return 'under';
  if (ampWattsIntoLoad > speakerProgramW * 1.25) return 'over';
  return 'ok';
}

export function ampMatchCopy(v: MatchVerdict, ampW: number, contW: number, progW: number): string {
  switch (v) {
    case 'under':
      return `${ampW} W is below the cabinet’s ${contW} W continuous rating. It will reach level only by clipping — and a clipped amplifier is the usual killer of high-frequency drivers. An underpowered amplifier is not the safe choice.`;
    case 'over':
      return `${ampW} W is well above the cabinet’s ${progW} W program rating. It can deliver more than the voice coils will dissipate; run it with the processor’s limiter set for the cabinet, or choose a smaller amplifier.`;
    default:
      return `${ampW} W sits between the cabinet’s ${contW} W continuous and ${progW} W program ratings — the usual professional guideline. Clean headroom without an easy way to cook the drivers.`;
  }
}

/** Power delivered changes with the load: a solid-state amplifier rated
 *  P at 8 Ω delivers roughly 1.6–2× P at 4 Ω. This helper reads the rating
 *  TABLE a page supplies — it never guesses a ratio. */
export type AmpRating = { at8: number; at4: number; at2?: number; bridged8?: number; minOhms: number; minOhmsBridged?: number };

export function wattsIntoLoad(rating: AmpRating, ohms: number, bridged = false): number | null {
  if (bridged) return rating.bridged8 != null && ohms >= (rating.minOhmsBridged ?? 8) ? rating.bridged8 : null;
  if (ohms >= 8) return rating.at8;
  if (ohms >= 4) return rating.at4;
  if (ohms >= 2 && rating.at2 != null) return rating.at2;
  return null;
}

/* ── SPL and distance ────────────────────────────────────────────────────── */

export function predictedSpl(sensitivityDb: number, watts: number, distanceM: number, headroomDb = 0): number {
  const outs = compute(CALC_LINKS.spl.workspace, CALC_LINKS.spl.fn, { sens: sensitivityDb, power: watts, dist: distanceM, headroom: headroomDb, nspk: 1 });
  return numberOut(outs, 'PREDICTED SPL (one speaker, after headroom)');
}

export function splAtDistance(l1: number, d1: number, d2: number): number {
  const outs = compute(CALC_LINKS.splDistance.workspace, CALC_LINKS.splDistance.fn, { l1, d1, d2 });
  return numberOut(outs, 'LEVEL AT d₂');
}

/* ── time ────────────────────────────────────────────────────────────────── */

/** Delay a signal must be held so it arrives with sound that has travelled
 *  `distanceM` through air at `tempC`. Milliseconds. */
export function delayMs(distanceM: number, tempC = 20): number {
  const outs = compute(CALC_LINKS.delay.workspace, CALC_LINKS.delay.fn, { dist: distanceM, temp: tempC });
  return numberOut(outs, 'DELAY') * 1000;
}

export function speedOfSound(tempC = 20): number {
  return speedOfSoundAir(tempC);
}

/** First comb-filter null when two arrivals differ by `pathDiffM`. Hz. */
export function combFirstNullHz(pathDiffM: number, tempC = 20): number {
  const outs = compute(CALC_LINKS.comb.workspace, CALC_LINKS.comb.fn, { pathDiff: pathDiffM, temp: tempC });
  return numberOut(outs, 'FIRST NULL');
}

/** Distance-to-time for a listener at (x, y) from a source at (sx, sy), in
 *  plot metres — the venue view's timing rings. */
export function arrivalMs(sx: number, sy: number, x: number, y: number, tempC = 20): number {
  return delayMs(Math.hypot(x - sx, y - sy), tempC);
}
