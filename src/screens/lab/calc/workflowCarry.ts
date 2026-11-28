/**
 * Workflow CARRY-FORWARD (fix-first 15, owner 2026-11-25; lab controls audit
 * items 1 and 2).
 *
 * Before: a later step was offered only an earlier step's ANSWERS, and only by
 * a ⤵ USE tap. A value TYPED in step 1 (a listening distance, a temperature,
 * a cable length) had to be typed again, so editing step 1 later left step 2
 * on the old number while the screen said "N later results recalculated". The
 * Loudspeaker SPL Estimate passed its level on without the distance it was
 * worked out at: following the "often 1 m" hint gave 79.93 dB at 8 m instead
 * of 99.93 dB.
 *
 * Now:
 *  - A template step names the values it CARRIES from earlier steps
 *    (WorkflowStep `carry`): an earlier INPUT or an earlier ANSWER. Each link
 *    is reviewed physics (same quantity, same unit, same thing) and is LIVE:
 *    the field reads the earlier value every render, so an edit flows on.
 *  - Any workflow (custom ones too) OFFERS an earlier step's input as ⤵ USE
 *    where it is the same thing: the same field of the same calculator, or a
 *    kind with one meaning in the whole lab (a tempo, a sample rate).
 *  - The ↻ note counts every later step that depends on the edited value (by
 *    a carried input or an imported answer, directly or through another
 *    step), and names in words a dependent step that cannot be worked out
 *    from the new value instead of counting it as recalculated.
 *
 * Pure (no React Native): the runner calls these; the tests import them.
 */
import type { FieldDef, OutputVal } from './calcTypes';
import { SAFE_UNTAGGED_KINDS, aliasOnlyUnits, aliasUnitFits, parseQuantity, unitFits, unitsFor } from './calcUnits';
import { resolveStep } from './workflowCatalog';
import type { StepCarry, ValueSource, Workflow, WorkflowStep } from './workflowModel';
import { NEC_310_16_CU_AWG, awgLabel } from './workspaces/ampacity';

type PriorStep = Extract<ValueSource, { kind: 'prior-step' }>;
type NumOut = Extract<OutputVal, { value: number }>;

/** Kind + unit: may the value of input `from` sit in input `to` at all? A list
 *  carries as typed, so only into the same list (same name, same values). */
export function carryUnitsFit(from: Pick<FieldDef, 'name' | 'quantity'>, to: Pick<FieldDef, 'name' | 'quantity'>): boolean {
  if (from.quantity !== to.quantity) return false;
  if (to.quantity === 'list') return from.name === to.name;
  return unitFits(from.name, from.quantity, to);
}

/**
 * May an earlier step's INPUT be OFFERED (⤵ USE) to a later input? Kind and
 * unit must fit, AND it must be the same thing: the same field of the same
 * calculator, or a SAFE kind (one meaning in the whole lab: a tempo, a sample
 * rate). An input's meaning tag says what it ACCEPTS, not what it is, so two
 * tags agreeing is not enough: the SPL Estimate's KNOWN LEVEL L₁ and the dose
 * calculator's EXPOSURE LEVEL both take an SPL, but one is not the other.
 * Anything else is carried only by a reviewed template link. Lists are never
 * offered (a template may still carry one).
 */
export function inputOfferFits(
  fromWs: string,
  from: Pick<FieldDef, 'key' | 'name' | 'quantity' | 'unitIds'>,
  toWs: string,
  to: Pick<FieldDef, 'key' | 'name' | 'quantity' | 'unitIds'>,
): boolean {
  if (to.quantity === 'list' || !carryUnitsFit(from, to)) return false;
  // A dBA-only input takes only another input that is itself in dBA (F2).
  const fromAlias = aliasOnlyUnits(from);
  if (!aliasUnitFits(fromAlias?.length === 1 ? fromAlias[0] : undefined, to)) return false;
  if (fromWs === toWs && from.key === to.key) return true;
  return SAFE_UNTAGGED_KINDS.has(to.quantity);
}

/**
 * The live source a template link gives field `fieldKey` of step `stepIndex`,
 * or null. A link whose source step has moved or changed (a customized copy
 * can reorder steps), whose source input is gone, or whose units do not fit
 * is ignored — the field is then simply typed, never filled from the wrong
 * place.
 */
export function carrySource(workflow: Workflow, stepIndex: number, fieldKey: string): PriorStep | null {
  const step = workflow.steps[stepIndex];
  const c = step?.carry?.[fieldKey];
  if (!c || !Number.isInteger(c.from) || c.from < 0 || c.from >= stepIndex) return null;
  const src = workflow.steps[c.from];
  if (!src || src.workspaceId !== c.ws || src.fnKey !== c.fn) return null;
  const to = resolveStep(step);
  const from = resolveStep(src);
  if (!to || !from || !to.fn.inputs.includes(fieldKey)) return null;
  const target = to.ws.fields.find((f) => f.key === fieldKey);
  if (!target) return null;
  if (c.input != null) {
    const sf = from.fn.inputs.includes(c.input) ? from.ws.fields.find((f) => f.key === c.input) : undefined;
    if (!sf || !carryUnitsFit(sf, target)) return null;
    return { kind: 'prior-step', stepIndex: c.from, outputLabel: sf.name, inputKey: c.input };
  }
  if (c.output != null && target.quantity !== 'list') {
    return { kind: 'prior-step', stepIndex: c.from, outputLabel: c.output, ...(c.snap ? { snap: c.snap } : {}) };
  }
  return null;
}

/** The AWG sizes NEC Table 310.16 lists (copper), thickest first is the
 *  LOWEST number (0 = 1/0 … −3 = 4/0, the gauge fields' own encoding). */
const TABLE_AWG: readonly number[] = [...NEC_310_16_CU_AWG.keys()].sort((a, b) => a - b);

/**
 * A gauge as the size Table 310.16 lists (round 2, owner 2026-11-25): a
 * drop-limited gauge the table has no row for (13, 11, 9, 7, 5, 15, 17, finer
 * than 18) becomes the next THICKER listed size — never thinner, so the
 * voltage-drop budget still holds (more copper, less drop). A listed size is
 * kept. Past the table's finest row (18) it is 18, which the ampacity check
 * then refuses in words (it covers 14 AWG and larger).
 */
export function snapAwgToTable(g: number): number {
  if (!Number.isFinite(g)) return g;
  let best: number | null = null;
  for (const k of TABLE_AWG) if (k <= g) best = k;
  return best ?? g; // thicker than 4/0: no AWG row (the gauge step answers in words there)
}

/** The finest gauge the ampacity check covers (it refuses 16 and 18 AWG). */
const AMPACITY_FINEST_AWG = 14;

/** A carried answer as the field receives it, and the words that say so
 *  when the carry changed it (`snap`). A drop-limited gauge FINER than 14 AWG
 *  carries nothing (value NaN): the drop does not limit that run, and the
 *  ampacity check starts at 14 AWG — so the words say that instead. */
export function carriedValue(src: PriorStep, value: number): { value: number; note: string | null } {
  if (src.snap !== 'awg-table') return { value, note: null };
  if (Number.isFinite(value) && value > AMPACITY_FINEST_AWG) {
    return { value: NaN, note: `The voltage drop does not limit this run (it allows ${awgLabel(value)}); size it by ampacity: type a gauge of 14 AWG or thicker here.` };
  }
  const v = snapAwgToTable(value);
  return v === value ? { value, note: null } : { value: v, note: `${awgLabel(value)} is not a size Table 310.16 lists; using ${awgLabel(v)}, the next thicker.` };
}

/** A step's inputs as carried values (BASE units), for a later step to read.
 *  A field that does not parse is absent: the later field reads empty. */
export function carriedInputs(
  fields: readonly FieldDef[],
  effRaw: Record<string, string>,
  unitSel: Record<string, number>,
): Record<string, NumOut> {
  const out: Record<string, NumOut> = {};
  for (const f of fields) {
    if (f.quantity === 'list') continue;
    const typed = parseQuantity(effRaw[f.key] ?? '');
    if (typed === null) continue;
    const units = unitsFor(f.quantity, f.unitIds);
    const x = units[(unitSel[f.key] ?? 0) % units.length].toBase(typed);
    if (Number.isFinite(x)) out[f.key] = { label: f.name, value: x, quantity: f.quantity };
  }
  return out;
}

/**
 * Later steps whose result depends on field `fieldKey` of step `from`: a step
 * that imports one of `from`'s answers, or carries that field — directly, or
 * through another dependent step's answers or carried inputs. A typed or
 * overridden value does not depend on anything. Sorted step indexes.
 */
export function dependentSteps(
  stepCount: number,
  keysOf: (i: number) => readonly string[],
  bindingOf: (i: number, key: string) => ValueSource | undefined,
  from: number,
  fieldKey: string,
): number[] {
  const changedInputs = new Set<string>([`${from}:${fieldKey}`]);
  const changedSteps = new Set<number>([from]);
  for (let i = from + 1; i < stepCount; i++) {
    for (const k of keysOf(i)) {
      const s = bindingOf(i, k);
      if (!s || s.kind !== 'prior-step') continue;
      const hit = s.inputKey != null ? changedInputs.has(`${s.stepIndex}:${s.inputKey}`) : changedSteps.has(s.stepIndex);
      if (hit) {
        changedInputs.add(`${i}:${k}`);
        changedSteps.add(i);
      }
    }
  }
  return [...changedSteps].filter((i) => i !== from).sort((a, b) => a - b);
}

/** The words under a carried or imported field that has nothing to carry yet
 *  (the earlier value is not entered, or that step has no answer). */
export function waitingText(src: PriorStep, inWords = false, noun = 'value'): string {
  const k = src.stepIndex + 1;
  // Round 2 (owner 2026-11-25): an answer given in WORDS ("2/0 AWG or
  // thicker.") is an answer — never "that step has no answer yet".
  if (inWords && src.inputKey == null) return `Step ${k} answered in words — type the ${noun} here.`;
  return src.inputKey != null
    ? `Waiting for ${src.outputLabel} from step ${k}: fill it in there, or type a value here.`
    : `Waiting for ${src.outputLabel} from step ${k}: that step has no answer for it yet. Finish step ${k}, or type a value here.`;
}

/** Did the source step answer this carried/imported output in WORDS (a text
 *  row with that label, the step not refused)? */
export function answeredInWords(
  out: readonly ({ result: { refused?: boolean; outputs: OutputVal[] } } | undefined)[],
  src: PriorStep,
): boolean {
  if (src.inputKey != null) return false;
  const up = out[src.stepIndex];
  if (!up || up.result.refused) return false;
  return up.result.outputs.some((o) => o.label === src.outputLabel && !('value' in o));
}

/**
 * The ↻ note's honest audience (round 2, owner 2026-11-25): of the dependent
 * steps, those that were complete BEFORE the edit (recalculated, or — if they
 * no longer work out — named as such), and those the learner has STARTED that
 * work out now (recalculated). A step never opened, or started but not
 * finished, is never called "can't be worked out": it never was.
 */
export function noteDependents(
  dependents: readonly number[],
  started: (i: number) => boolean,
  completeBefore: (i: number) => boolean,
  completeNow: (i: number) => boolean,
): number[] {
  return dependents.filter((i) => completeBefore(i) || (started(i) && completeNow(i)));
}

/**
 * The editor's ▲ / ▼ / ✕ (round 2, owner 2026-11-25): a customized copy's
 * carried values follow the steps they come from. `before` and `after` hold
 * the SAME step objects (the editor reorders and removes by identity); each
 * carry is renumbered to its source step's new place, and dropped when that
 * step was removed or no longer comes first. A step replaced IN PLACE (a note
 * edited: same count, a new object at the same place) keeps its place. Steps
 * whose carries do not change keep their identity.
 */
export function reindexCarry(before: readonly WorkflowStep[], after: readonly WorkflowStep[]): WorkflowStep[] {
  return after.map((s, i) => {
    if (!s.carry) return s;
    const carry: Record<string, StepCarry> = {};
    let changed = false;
    for (const [key, c] of Object.entries(s.carry)) {
      const src = before[c.from];
      let to = src ? after.indexOf(src) : -1;
      if (to < 0 && src && after.length === before.length && !after.includes(before[c.from]) && !before.includes(after[c.from])) to = c.from;
      if (to >= 0 && to < i) {
        carry[key] = to === c.from ? c : { ...c, from: to };
        if (to !== c.from) changed = true;
      } else changed = true;
    }
    return changed ? { ...s, carry } : s;
  });
}

const listSteps = (xs: readonly number[]) => {
  const n = xs.map((i) => String(i + 1));
  return n.length === 1 ? n[0] : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
};

/**
 * The ↻ note after `fieldName` changed: how many dependent results were
 * worked out again, and — in words — which could not be from the new value
 * (an error, a refusal, or a value still missing). null: nothing depends on it.
 */
export function recalcNoteText(fieldName: string, dependents: readonly number[], complete: (i: number) => boolean): string | null {
  if (dependents.length === 0) return null;
  const done = dependents.filter((i) => complete(i));
  const not = dependents.filter((i) => !complete(i));
  const head = `${fieldName} changed — `;
  const okPart = `${done.length} later result${done.length === 1 ? '' : 's'} recalculated`;
  if (not.length === 0) return `${head}${okPart}.`;
  const one = not.length === 1;
  const notPart = `step${one ? '' : 's'} ${listSteps(not)} can’t be worked out from the new value — open ${one ? 'it' : 'them'} to see why.`;
  return done.length === 0 ? `${head}${notPart}` : `${head}${okPart}; ${notPart}`;
}
