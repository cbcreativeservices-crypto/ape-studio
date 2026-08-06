/**
 * Custom Calculator Workflows — catalog + built-in templates (Phase 2,
 * owner spec 2026-08-06).
 *
 * The catalog flattens the existing workspace registry into pickable
 * "calculator" entries — one per (workspace, function) pair — for the builder's
 * search list. Nothing here duplicates a formula.
 *
 * Templates are plain read-only Workflow objects whose steps reference VERIFIED
 * existing (workspaceId, fnKey) pairs. Every workflow (template or saved) is
 * passed through validateWorkflow() before use: steps that no longer resolve
 * are dropped and reported, so an old or damaged workflow never crashes the
 * runner (spec: repair, don't die).
 */
import type { CalcFunction, Workspace } from './calcTypes';
import { SECTION_META, WORKSPACES, getWorkspace } from './registry';
import type { Workflow, WorkflowStep } from './workflowModel';

export type CatalogEntry = {
  workspaceId: string;
  fnKey: string;
  workspaceName: string;
  fnName: string;
  sectionTitle: string;
};

/** Every runnable calculator function, grouped in registry order. */
export function listCalculators(): CatalogEntry[] {
  const sectionTitle = new Map(SECTION_META.map((s) => [s.id, s.title]));
  const out: CatalogEntry[] = [];
  for (const ws of WORKSPACES) {
    for (const fn of ws.functions) {
      out.push({
        workspaceId: ws.id,
        fnKey: fn.key,
        workspaceName: ws.name,
        fnName: fn.name,
        sectionTitle: sectionTitle.get(ws.section) ?? '',
      });
    }
  }
  return out;
}

/** Resolve a step to its live workspace + function — null when either is gone. */
export function resolveStep(step: WorkflowStep): { ws: Workspace; fn: CalcFunction } | null {
  const ws = getWorkspace(step.workspaceId);
  if (!ws) return null;
  const fn = ws.functions.find((f) => f.key === step.fnKey);
  return fn ? { ws, fn } : null;
}

/** Drop unresolvable steps (deleted/renamed calculators). `dropped` > 0 tells
 *  the UI to say so — never silently pretend the workflow is intact. */
export function validateWorkflow(w: Workflow): { workflow: Workflow; dropped: number } {
  const steps = w.steps.filter((s) => resolveStep(s) != null);
  return { workflow: steps.length === w.steps.length ? w : { ...w, steps }, dropped: w.steps.length - steps.length };
}

// ---------------------------------------------------------------------------
// Built-in templates — read-only; duplicate-and-customize to edit.
// Every (workspaceId, fnKey) below was verified against the live registry.
// ---------------------------------------------------------------------------

const T = '2026-08-06T00:00:00.000Z';
const tpl = (id: string, name: string, description: string, steps: WorkflowStep[]): Workflow => ({
  id: `tpl-${id}`,
  name,
  description,
  steps,
  isTemplate: true,
  createdAt: T,
  updatedAt: T,
});

export const WORKFLOW_TEMPLATES: Workflow[] = [
  tpl('delay-speaker', 'Delay Speaker Setup', 'Speed of sound → distance delay → device latency.', [
    { workspaceId: 'wave', fnKey: 'speed', note: 'Get the speed of sound for today’s temperature.' },
    { workspaceId: 'distdelay', fnKey: 'distToDelay', note: 'Turn the distance to the delay speaker into milliseconds.' },
    { workspaceId: 'latency', fnKey: 'bufLatency', note: 'Account for the processor’s own buffer latency.' },
  ]),
  tpl('spl-estimate', 'Loudspeaker SPL Estimate', 'Predicted SPL from sensitivity/power, then at the listener distance.', [
    { workspaceId: 'speakerpower', fnKey: 'predictspl', note: 'Predict SPL from sensitivity and amplifier power.' },
    { workspaceId: 'spldist', fnKey: 'point', note: 'Carry that SPL to the actual listening distance.' },
  ]),
  tpl('amp-matching', 'Amplifier & Loudspeaker Matching', 'Load impedance, then the amplifier power the target needs.', [
    { workspaceId: 'impedance', fnKey: 'parallel', note: 'Find the combined load the amp will see.' },
    { workspaceId: 'speakerpower', fnKey: 'reqpower', note: 'Find the power needed for the target SPL.' },
  ]),
  tpl('cable-drop', 'Cable Voltage Drop', 'Loss over the run, then the recommended gauge.', [
    { workspaceId: 'cable', fnKey: 'loss', note: 'Check the loss for this length and gauge.' },
    { workspaceId: 'cable', fnKey: 'recgauge', note: 'Confirm the recommended gauge for the run.' },
  ]),
  tpl('room-modes', 'Room Mode Review', 'Axial modes, then the reverb-time picture.', [
    { workspaceId: 'roommodes', fnKey: 'axial', note: 'List the room’s axial modes.' },
    { workspaceId: 'sabine', fnKey: 'rtFromVA', note: 'Estimate RT60 for the same room.' },
  ]),
  tpl('tempo-delay', 'Tempo & Delay Time', 'Note-value delay times from the song tempo.', [
    { workspaceId: 'bpm', fnKey: 'noteValues', note: 'Delay times for each note value at this BPM.' },
    { workspaceId: 'bpm', fnKey: 'preDelay', note: 'Pick a musical pre-delay from the same tempo.' },
  ]),
  tpl('wavelength', 'Wavelength & Frequency', 'Wavelength, then the period of the same tone.', [
    { workspaceId: 'wave', fnKey: 'wavelength' },
    { workspaceId: 'wave', fnKey: 'period' },
  ]),
  tpl('ohms-law', 'Ohm’s Law', 'Power from voltage & impedance, then the current drawn.', [
    { workspaceId: 'ohmspower', fnKey: 'pFromVZ' },
    { workspaceId: 'ohmspower', fnKey: 'iFromPV' },
  ]),
  tpl('impedance', 'Series & Parallel Impedance', 'Series total, then the parallel combination.', [
    { workspaceId: 'electronics', fnKey: 'seriesR' },
    { workspaceId: 'electronics', fnKey: 'parallelR' },
  ]),
];
