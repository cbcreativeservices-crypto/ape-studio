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
  | { label: string; text: string };

export type CalcTable = { title?: string; cols: string[]; rows: string[][] };

export type CalcFunction = {
  key: string;
  /** Answers "What are you trying to determine?" */
  name: string;
  /** Field keys required (order = render order). */
  inputs: string[];
  /** The formula, human-readable (e.g. "T = 1 / f"). */
  formula: string;
  /** Per-function caveat (model limits, standards note). */
  note?: string;
  compute: (v: CalcValues) => OutputVal[];
  /** Worked calculation steps, plain language, values already substituted. */
  steps?: (v: CalcValues) => string[];
  /** Optional result table (room modes, tap plans, repeat schedules…). */
  table?: (v: CalcValues) => CalcTable;
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
