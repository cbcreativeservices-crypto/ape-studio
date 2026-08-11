/**
 * Custom Calculator Workflows — data model (owner spec 2026-08-06).
 *
 * A workflow is an ORDERED LIST of calculator steps run as one guided sequence
 * — deliberately NOT a node graph, formula editor, or branching engine. Each
 * step points at an existing (workspace, function) pair from the calc registry;
 * formulas are never duplicated here.
 *
 * Value passing reuses the Calculation Chain's compatibility rule exactly:
 * a value may feed an input only when their QuantityKind MATCHES (distance ↔︎
 * distance, time ↔︎ time — power never auto-fills voltage). Units convert
 * through the quantity's BASE unit via calcUnits, as everywhere else.
 */
import type { QuantityKind } from './calcUnits';

// ---------------------------------------------------------------------------
// Workflow definition (what the builder edits, what templates provide)
// ---------------------------------------------------------------------------

export type WorkflowStep = {
  /** Workspace id from registry.ts (e.g. 'distdelay'). */
  workspaceId: string;
  /** Function key WITHIN the workspace (each solve-direction is a function). */
  fnKey: string;
  /** Optional short instruction shown above the step while running. */
  note?: string;
};

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  /** Built-in template ids are stable strings; templates are read-only. */
  isTemplate?: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

// ---------------------------------------------------------------------------
// Run state (an in-progress or completed walk through a workflow)
// ---------------------------------------------------------------------------

/** Where a bound input value came from — shown as the source label. */
export type ValueSource =
  | { kind: 'manual' }
  | { kind: 'prior-step'; stepIndex: number; outputLabel: string }
  | { kind: 'project'; projectId: string; valueLabel: string }
  | { kind: 'fixed' } // a constant saved in the workflow itself
  | { kind: 'override'; replaced: ValueSource }; // manually replaced an import

export type BoundInput = {
  /** Raw text as typed/filled (display units). */
  raw: string;
  /** Selected unit index for the field. */
  unitIdx: number;
  source: ValueSource;
};

export type StepRunState = {
  /** Field key → bound input. */
  inputs: Record<string, BoundInput>;
  /** True when an upstream value changed after this step last computed —
   *  the step must recompute before its results may be shown as current. */
  stale: boolean;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  workflowName: string; // denormalized so a deleted workflow can't orphan the run
  projectId?: string;
  projectName?: string;
  startedAt: string;
  /** Set when Finish Workflow produced the summary. */
  completedAt?: string;
  /** Index of the step the user is on. */
  stepIndex: number;
  steps: StepRunState[];
  notes?: string;
};

/** A saved, completed result — reopenable WITHOUT recalculating. */
export type SavedRunSummary = {
  id: string;
  workflowName: string;
  projectName?: string;
  completedAt: string;
  inputs: { label: string; value: string; unit: string; source: string; step: string }[];
  results: { label: string; value: string; unit: string; step: string }[];
  warnings: string[];
  notes?: string;
};

// ---------------------------------------------------------------------------
// Projects — a lightweight reusable collection of named values
// ---------------------------------------------------------------------------

export type ProjectValue = {
  label: string; // e.g. 'Listener distance'
  quantity: QuantityKind;
  baseValue: number; // stored in the quantity's BASE unit
};

export type Project = {
  id: string;
  name: string; // e.g. 'Church Sanctuary'
  notes?: string;
  values: ProjectValue[];
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Entitlement limits — configurable in ONE place (gate on entitlement, not
// caps — standing rule). null = unlimited.
// ---------------------------------------------------------------------------

export type WorkflowLimits = {
  savedWorkflows: number | null;
  savedProjects: number | null;
  savedResults: number | null;
  templates: 'selected' | 'all';
  canResume: boolean;
};

// Owner 2026-08-06: creating custom "My Workflows" (new OR duplicate-and-
// customize) is ACADEMY-ONLY. Free accounts can run templates, resume, and
// save/share their results — but savedWorkflows stays 0.
export const WORKFLOW_LIMITS: Record<'anonymous' | 'free' | 'academy' | 'lapsed', WorkflowLimits> = {
  anonymous: { savedWorkflows: 0, savedProjects: 0, savedResults: 0, templates: 'selected', canResume: false },
  free: { savedWorkflows: 0, savedProjects: 3, savedResults: 10, templates: 'selected', canResume: true },
  academy: { savedWorkflows: null, savedProjects: null, savedResults: null, templates: 'all', canResume: true },
  lapsed: { savedWorkflows: 0, savedProjects: 3, savedResults: 10, templates: 'selected', canResume: true },
};
