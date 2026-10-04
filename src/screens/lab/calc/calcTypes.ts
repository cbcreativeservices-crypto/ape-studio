/**
 * Audio Calculator Laboratory — typed model (owner spec 2026-07-29).
 *
 * One UNIFIED lab (not a wall of calculator icons): ~25 consolidated
 * WORKSPACES, each holding related calculation FUNCTIONS ("What are you
 * trying to determine?"), reverse solving (each solvable direction is its own
 * explicit function — no symbolic algebra to go wrong), unit-aware fields,
 * worked steps, why-it-matters, practical example, common mistakes,
 * feasibility warnings, glossary terms, and the Calculation Chain (send a
 * result into another workspace's matching input).
 *
 * HONESTY: results are teaching calculations from the stated formula — never
 * standards-compliant measurements. Where a formal method exists the
 * workspace names it (IEC 60268-4, ISO 3382, ISO 354, ITU-R BS.1770-5) in
 * `warnings`. Exposure math must always display criterion + exchange rate.
 */
import type { QuantityKind } from './calcUnits';

/** Values handed to compute/steps — always in BASE units (see calcUnits). */
export type CalcValues = Record<string, number | number[]>;

export type FieldDef = {
  /** Stable key — also the key into CalcValues. */
  key: string;
  name: string;
  quantity: QuantityKind;
  /** Restrict selectable units to this subset (unit ids); default = all. */
  unitIds?: string[];
  /** Unit id preselected for this field. */
  defaultUnit?: string;
  placeholder?: string;
  /** One-line teaching definition of the variable (shown via ⓘ). */
  help?: string;
  /** Feasibility check on the BASE value; message shown, calc still runs. */
  warn?: { test: (x: number) => boolean; msg: string };
  /** A physically non-negative value on a kind that is otherwise signed
   *  ('number', 'ratio', 'db', 'list' …) — capacitance in µF, a channel count,
   *  a list of impedances or durations. A negative entry is an ERROR exactly
   *  like a negative frequency (see calcUnits NON_NEGATIVE_KINDS). */
  nonNegative?: boolean;
  /** P16 SIGN CLASS (pattern hunt 2026-10-02): on a signed kind, a negative is
   *  a real value HERE — a level, a gain, a phase, a transposition, a loss
   *  budget read through |x|. Every field must resolve to a class (its kind,
   *  `nonNegative`, or this) — test/patternP16_20261002 fails one that does not. */
  signed?: boolean;
  /** P16 — a whole-number COUNT (channels, taps, frames, buffer size, a MIDI
   *  note, a wire gauge). A fractional entry is an ERROR, never a confident
   *  answer for 2.5 speakers (see calcUnits `domainError`). */
  integer?: boolean;
  /** P16 — inclusive bounds of a RANGED value, in BASE units (MIDI 0–127, a
   *  0/1 flag, AWG −3…40 where −1 is 2/0). Outside the range is an ERROR. */
  range?: readonly [number, number];
};

export type OutputVal =
  | {
      label: string;
      value: number;
      quantity: QuantityKind;
      /** Preferred display unit id (default: quantity's first unit). */
      unit?: string;
      /** Offer "SEND →" into the calculation chain (default true). */
      chainable?: boolean;
    }
  | {
      label: string;
      text: string;
      /** REFUSAL (owner 2026-10-03, "do 1"): this row says the inputs have no
       *  answer — a ratio below 1:1, a reflection shorter than the direct path,
       *  no time to average. An output set carrying one is a REFUSAL: it costs a
       *  capped account nothing (like an error) and feeds no workflow step.
       *  Mark ONLY "no answer exists" rows — a genuine answer in words
       *  (room-mode fundamentals, "no listed gauge passes") stays unmarked. */
      refusal?: true;
    };

/** A row that refuses the inputs (see `refusal` above). */
export function isRefusalRow(o: OutputVal): o is Extract<OutputVal, { text: string }> {
  return 'text' in o && o.refusal === true;
}

/** The refusal rows of a result — all a capped account sees of a refused one. */
export function refusalRows(outputs: readonly OutputVal[]): Extract<OutputVal, { text: string }>[] {
  return outputs.filter(isRefusalRow);
}

/** An output set is a REFUSAL when any row refuses the inputs. */
export function isRefused(outputs: readonly OutputVal[]): boolean {
  return outputs.some(isRefusalRow);
}

/** Whether revealing this result spends a capped account's weekly calculation:
 *  an error or a refusal reveals no answer, so it costs nothing (bug pass
 *  2026-09-30; refusals owner 2026-10-03, "do 1"). */
export function costsACalculation(r: { computeError: boolean; refused?: boolean }): boolean {
  return !r.computeError && r.refused !== true;
}

export type CalcTable ={ title?: string; cols: string[]; rows: string[][] };

export type CalcFunction = {
  key: string;
  /** Answers "What are you trying to determine?" */
  name: string;
  /** Field keys required (order = render order). */
  inputs: string[];
  /** The formula, human-readable (e.g. "T = 1 / f"). */
  formula: string;
  /** FORMULA-KEY POPUP (owner 2026-08-13) — the purple key beside the formula
   *  opens a popup UNIQUE to this formula, not the whole symbol key. These two
   *  optional fields author its custom prose; the popup also auto-derives the
   *  element list (from this function's input fields + their `help`) and the
   *  symbol subset (the key entries whose glyph appears in `formula`).
   *  `plainFormula`: the formula spelled out in words, no symbols
   *    (e.g. "Period equals one second divided by the frequency").
   *  `explain`: what the calculation does and what its elements mean, in prose. */
  plainFormula?: string;
  explain?: string;
  /** Optional explicit, ordered glyph list for the popup's "symbols used" block
   *  when auto-derivation from `formula` would be imperfect (exact author
   *  control). Each string is a glyph as it appears in a SymbolEntry.symbol. */
  keySymbols?: string[];
  /** Per-function caveat (model limits, standards note). */
  note?: string;
  compute: (v: CalcValues) => OutputVal[];
  /** Worked calculation steps, plain language, values already substituted. */
  steps?: (v: CalcValues) => string[];
  /** Optional result table (room modes, tap plans, repeat schedules…). */
  table?: (v: CalcValues) => CalcTable;
  /** Shared-report presentation only (owner 2026-08-06). The output LABEL to
   *  headline as the PRIMARY RESULT; omit to default to the first numeric
   *  output. Never affects computation. */
  primaryResultLabel?: string;
};

export type CalcSectionId =
  | 'waves'
  | 'levels'
  | 'spl'
  | 'speakers'
  | 'mics'
  | 'digital'
  | 'music'
  | 'rooms'
  | 'filters'
  | 'electronics';

export type Workspace = {
  id: string;
  name: string;
  tagline: string;
  section: CalcSectionId;
  /** Shared-report presentation only (owner 2026-08-06): short prefix for the
   *  report id (e.g. 'SPL'); defaults to name initials when omitted. */
  reportPrefix?: string;
  /** What this workspace is, plain language (top of screen). */
  intro: string;
  whyItMatters: string;
  /** One fully worked practical example, prose. */
  example: string;
  mistakes: string[];
  /** Standards/model honesty block (rendered as an amber-ruled note). */
  warnings?: string;
  /** Glossary terms this workspace's variables map to. */
  glossary: string[];
  fields: FieldDef[];
  functions: CalcFunction[];
};
