/**
 * Workflow ESTIMATES (round 2, owner 2026-11-25, on the Acoustic Treatment
 * Plan: "i like it to add but many users will not be able to so maybe we
 * offer also a default setting?").
 *
 * A step may OFFER a typical value for an input the learner does not know —
 * never silently: the learner taps "I DON'T KNOW IT", the value is worked out
 * live from the step's other inputs, its assumption is printed under the
 * field, every answer that rests on it says ESTIMATE (the final panel count
 * included), and a value the learner types always replaces it. No calculator
 * is added (the lab's 166 stay 166): the estimate fills an existing input.
 *
 * ── 'untreated-room': TOTAL ABSORPTION A of an untreated room, from V ───────
 *
 * A = ᾱ · S (Sabine's absorption: the average coefficient times the room's
 * total surface area).
 *
 * ᾱ = 0.07 — the mid-frequency (500 Hz – 1 kHz) average absorption of an
 * ORDINARY untreated room: hard walls, ceiling and floor, a door, a window
 * and a few furnishings. Basis: the standard absorption-coefficient table of
 * general building materials (as printed in Everest & Pohlmann, Master
 * Handbook of Acoustics, and Egan, Architectural Acoustics), at 500 Hz / 1 kHz:
 *   gypsum board ½ in on studs ........ 0.05 / 0.04
 *   plaster, smooth on brick or tile .. 0.02 / 0.03
 *   wood floor ........................ 0.10 / 0.07
 *   concrete floor .................... 0.015 / 0.02
 *   ordinary window glass ............. 0.18 / 0.12
 * Area-weighted over the 1 : 1.4 : 1.9 box below (floor and ceiling 2.66 h²
 * each, walls 6.6 h²), a BARE room averages over the two bands: drywall walls
 * and ceiling on a wood floor 0.054, on a concrete floor 0.039; a door and a
 * window lift the wood-floor room only to about 0.056. So a bare, empty room is
 * 0.04 – 0.055. 0.07 is used because the owner wants a default for ordinary
 * users' rooms, which hold a few things (a desk, shelves, a chair): the app's
 * own calibrated hard-walled classroom (meterEngine.ts ROOM_PHYS at 500 Hz,
 * ᾱ = 0.161·V / (RT·S) = 0.161·220/(2.0·250) = 0.071) and bare studio shell
 * (0.161·85/(1.6·115) = 0.074) sit there too. It is the same single mid band
 * as the panel step's α (a datasheet's 500 Hz – 1 kHz value), and well under
 * Sabine's ≈ 0.3 limit. Both directions are said on screen: an empty, bare
 * room absorbs less (about 4–5%) and rings longer; carpet, curtains, soft
 * furniture or people absorb more and the room decays faster.
 *
 * S from V — only the volume is known (Sabine's RT60-from-V-and-A calculator
 * has no floor-area or height field), so a SHAPE is assumed and said: a
 * rectangular box 1 : 1.4 : 1.9 (height : width : length; Louden's often-
 * quoted room ratio). Then V = 2.66·h³ and S = 2·(1.4 + 1.9 + 2.66)·h² =
 * 11.92·h², i.e. S ≈ 6.21·V^(2/3). The shape matters little: a cube (the
 * least surface any box can have) has 3.4 % less, a 1 : 1.6 : 2.33 box 2.6 %
 * more.
 *
 * Worked: V = 100 m³ → h = 3.350 m, S = 133.7 m², A = 0.07 × 133.7 = 9.362 m²,
 * RT60 = 0.161 × 100 ÷ 9.362 = 1.720 s (an ESTIMATE).
 *
 * Pure (no React Native): the runner calls these; the tests import them.
 */
import type { FieldDef, OutputVal } from './calcTypes';
import { fmt, unitsFor } from './calcUnits';
import type { EstimateId, ValueSource, WorkflowStep } from './workflowModel';
import { carriedInputs, dependentSteps } from './workflowCarry';

/** Average absorption ᾱ of an untreated hard-surfaced room, 500 Hz – 1 kHz. */
export const UNTREATED_ALPHA = 0.07;
/** The assumed box, height : width : length (Louden's 1 : 1.4 : 1.9). */
export const ROOM_BOX_RATIO = [1, 1.4, 1.9] as const;

/** Total surface S (m²) of a ROOM_BOX_RATIO box of volume V (m³). */
export function boxSurfaceFromVolume(V: number): number {
  const [a, b, c] = ROOM_BOX_RATIO;
  const h = Math.cbrt(V / (a * b * c));
  return 2 * (a * b + b * c + c * a) * h * h;
}

/** The untreated-room estimate for a room of volume V (m³): S and A (m²), or
 *  null when there is no usable volume yet. */
export function untreatedRoomAbsorption(V: number): { S: number; A: number } | null {
  if (!(V > 0) || !Number.isFinite(V)) return null;
  const S = boxSurfaceFromVolume(V);
  return { S, A: UNTREATED_ALPHA * S };
}

type EstimateDef = { ws: string; field: string; from: string; button: string };
const ESTIMATES: Record<EstimateId, EstimateDef> = {
  'untreated-room': { ws: 'sabine', field: 'absA', from: 'vol', button: 'I DON’T KNOW IT: USE A TYPICAL UNTREATED ROOM' },
};

/** The estimate step `step` offers for field `fieldKey`, or null. Checked
 *  against the step's own calculator, so a moved or changed step never offers
 *  an estimate that does not fit it. */
export function estimateFor(step: WorkflowStep | undefined, fnInputs: readonly string[], fieldKey: string): EstimateId | null {
  const id = step?.estimate?.[fieldKey];
  if (!id) return null;
  const d = ESTIMATES[id];
  if (!d || step.workspaceId !== d.ws || d.field !== fieldKey || !fnInputs.includes(fieldKey) || !fnInputs.includes(d.from)) return null;
  return id;
}

export const estimateButton = (id: EstimateId): string => ESTIMATES[id].button;

/** The estimated fields of a step that are worked out from input `fieldKey`
 *  (the volume feeds the untreated-room absorption): an edit of that input
 *  changes them too. */
export function estimatesFedBy(
  estimates: Record<string, unknown>,
  inputs: Record<string, { source: ValueSource } | undefined>,
  fieldKey: string,
): string[] {
  return Object.keys(estimates).filter((k) => {
    const s = inputs[k]?.source;
    return s?.kind === 'estimate' && ESTIMATES[s.id]?.from === fieldKey;
  });
}

/** The estimate's value in BASE units (m² for A), worked out from the same
 *  step's other inputs as entered now, with the surface it assumed — or null
 *  when the input it needs (the volume) is not entered yet. */
export function estimateValue(
  id: EstimateId,
  fields: readonly FieldDef[],
  effRaw: Record<string, string>,
  unitSel: Record<string, number>,
): { value: number; S: number } | null {
  const d = ESTIMATES[id];
  const v = carriedInputs(fields.filter((f) => f.key === d.from), effRaw, unitSel)[d.from];
  const r = v ? untreatedRoomAbsorption(v.value) : null;
  return r ? { value: r.A, S: r.S } : null;
}

/** The assumption in plain words, with the surface and absorption it gives
 *  (in the field's own unit). */
function assumption(f: FieldDef, unitIdx: number, est: { value: number; S: number }): string {
  const units = unitsFor(f.quantity, f.unitIds);
  const u = units[unitIdx % units.length];
  const S = fmt(u.fromBase(est.S));
  const A = fmt(u.fromBase(est.value));
  return (
    'an ordinary untreated room (hard walls, ceiling and floor, a door, a window and a few furnishings) absorbs about 7% of the sound that hits its surfaces (ᾱ ≈ 0.07, 500 Hz – 1 kHz). ' +
    `The room is taken as a box shaped 1 : 1.4 : 1.9 (height : width : length), so its surfaces total about ${S} ${u.label}, and A = 0.07 × ${S} ≈ ${A} ${u.label}. ` +
    'An empty, bare room absorbs less (about 4–5%) and rings longer; a room with carpet, curtains, soft furniture or people absorbs more and decays faster.'
  );
}

/** The words under the estimated field. */
export function estimateText(id: EstimateId, f: FieldDef, unitIdx: number, est: { value: number; S: number } | null): string {
  void id;
  if (!est) return 'ESTIMATE needs a ROOM VOLUME above 0: enter it above.';
  return `ESTIMATE, not a measurement: ${assumption(f, unitIdx, est)} Type a measured value to replace it.`;
}

/** The report's line for an estimated input (results view, shared text). */
export function estimateReportLine(stepNo: number, f: FieldDef, unitIdx: number, est: { value: number; S: number }): string {
  return `Step ${stepNo}: ${f.name} is an ESTIMATE, not a measurement — ${assumption(f, unitIdx, est)} Every answer marked (ESTIMATE) changes with it; measure the room to replace it.`;
}

/** The short source label (report inputs). */
export const ESTIMATE_SOURCE_LABEL = 'Estimate: typical untreated room (ᾱ ≈ 0.07, box 1 : 1.4 : 1.9)';

/** The line in each answer that rests on the estimate. */
export function estimateResultText(estimateStep: number, thisStep: number): string {
  return estimateStep === thisStep
    ? 'This answer uses the typical untreated-room absorption above, not a measurement of this room.'
    : `This answer rests on step ${estimateStep + 1}’s typical untreated-room absorption, not a measurement of this room.`;
}

/** An answer's label when it rests on an estimate ("PANELS NEEDED (ESTIMATE)"). */
export const estimateLabel = (label: string, isEstimate: boolean): string => (isEstimate ? `${label} (ESTIMATE)` : label);

/** A step's computed answers as SHOWN: each numeric answer in `marked` (by
 *  position) labeled "(ESTIMATE)". A display copy only — the step itself keeps
 *  the calculators' own labels, which later steps import by. */
export function withEstimateLabels<T extends { result: { outputs: OutputVal[] } }>(c: T | undefined, marked: ReadonlySet<number> | undefined): T | null {
  if (!c) return null;
  if (!marked || marked.size === 0) return c;
  return { ...c, result: { ...c.result, outputs: c.result.outputs.map((o, i) => ('value' in o && marked.has(i) ? { ...o, label: estimateLabel(o.label, true) } : o)) } };
}

type ChainStep = { complete: boolean; result: { outputs: OutputVal[] } };
/**
 * The answers that DEPEND on a stated estimate: per step, the positions of the
 * outputs that differ in any of `alts` (the same chain worked out with the
 * estimate scaled, e.g. ½×, 1.01× and 2×). Matched by label, else by position
 * (a label that carries a count, "PREDICTED RT60 WITH 18 PANELS", changes
 * with it — that is a change). Several scales, because a rounded count (the
 * panels) can sit still under a small nudge. A step that does not work out
 * has no answers to mark.
 */
export function estimatedOutputs(base: readonly ChainStep[], alts: readonly (readonly ChainStep[])[]): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  const differs = (a: OutputVal, b: OutputVal | undefined): boolean => {
    if (!b || a.label !== b.label) return true;
    if ('value' in a) return !('value' in b) || Math.abs(a.value - b.value) > 1e-9 * Math.max(1, Math.abs(a.value));
    return 'value' in b || a.text !== b.text;
  };
  base.forEach((c, i) => {
    if (!c.complete) return;
    const set = new Set<number>();
    c.result.outputs.forEach((o, oi) => {
      for (const alt of alts) {
        const outs = alt[i]?.result.outputs ?? [];
        const b = outs.find((x) => x.label === o.label) ?? outs[oi];
        if (!alt[i]?.complete || differs(o, b)) {
          set.add(oi);
          break;
        }
      }
    });
    if (set.size > 0) out.set(i, set);
  });
  return out;
}

/**
 * Which steps rest on an estimate: every step with an estimated input, and
 * every later step that depends on that input (carried or through an answer,
 * directly or transitively — workflowCarry `dependentSteps`). Maps each such
 * step to the FIRST step whose estimate it rests on.
 */
export function estimateReach(
  stepCount: number,
  keysOf: (i: number) => readonly string[],
  bindingOf: (i: number, key: string) => ValueSource | undefined,
  isEstimated: (i: number, key: string) => boolean,
): Map<number, number> {
  const out = new Map<number, number>();
  for (let i = 0; i < stepCount; i++) {
    for (const k of keysOf(i)) {
      if (!isEstimated(i, k)) continue;
      if (!out.has(i)) out.set(i, i);
      for (const d of dependentSteps(stepCount, keysOf, bindingOf, i, k)) if (!out.has(d)) out.set(d, i);
    }
  }
  return out;
}
