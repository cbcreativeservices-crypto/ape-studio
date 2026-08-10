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

  // -------------------------------------------------------------------------
  // Expanded with the second-tier + advanced calculators (owner 2026-08-09).
  // Common, field-useful sequences; every (workspaceId, fnKey) verified.
  // -------------------------------------------------------------------------
  tpl('loudness-delivery', 'Loudness Delivery', 'Gain to hit the platform target, then the true-peak ceiling.', [
    { workspaceId: 'loudnorm', fnKey: 'normalize', note: 'Gain to reach the target LUFS, with the peak check.' },
    { workspaceId: 'loudtp', fnKey: 'truePeakMargin', note: 'Confirm the true-peak ceiling for the delivery format.' },
  ]),
  tpl('room-survey', 'Room Acoustics Survey', 'RT60, then critical distance and the direct-to-reverberant ratio.', [
    { workspaceId: 'sabine', fnKey: 'rtFromVA', note: 'Estimate RT60 for the room.' },
    { workspaceId: 'critdist', fnKey: 'dc', note: 'Critical distance from RT60 and source directivity.' },
    { workspaceId: 'critdist', fnKey: 'drr', note: 'Direct-to-reverberant ratio at the listener.' },
  ]),
  tpl('bass-boundaries', 'Bass & Boundaries', 'Axial modes, boundary cancellations, and the Schroeder transition.', [
    { workspaceId: 'roommodes', fnKey: 'axial', note: 'The room’s axial modes.' },
    { workspaceId: 'boundary', fnKey: 'sbir', note: 'Boundary cancellations & reinforcements (SBIR).' },
    { workspaceId: 'schroeder', fnKey: 'fs', note: 'Where modal behaviour gives way to a diffuse field.' },
  ]),
  tpl('wireless-link', 'Wireless Mic Link', 'Free-space path loss, then the received power and link margin.', [
    { workspaceId: 'rflink', fnKey: 'pathLoss', note: 'Path loss at this distance and frequency.' },
    { workspaceId: 'rflink', fnKey: 'budget', note: 'Received power and how much link margin you have.' },
  ]),
  tpl('rack-power', 'Rack Power & Circuit', 'Current, heat and airflow, then the safe wattage for the breaker.', [
    { workspaceId: 'rackheat', fnKey: 'heatLoad', note: 'Mains current, BTU/hr and the cooling airflow.' },
    { workspaceId: 'rackheat', fnKey: 'safeLoad', note: 'Safe continuous wattage for the circuit.' },
  ]),
  tpl('power-run', 'Long Power Run', 'Voltage drop over the run, then the gauge that keeps it in spec.', [
    { workspaceId: 'vdrop', fnKey: 'drop', note: 'Voltage lost over this length and gauge.' },
    { workspaceId: 'vdrop', fnKey: 'gaugeFor', note: 'Gauge needed for your allowable drop.' },
  ]),
  tpl('passive-crossover', 'Passive Crossover', 'First-order and second-order component values for the crossover.', [
    { workspaceId: 'crossover', fnKey: 'firstOrder', note: '6 dB/oct inductor & capacitor values.' },
    { workspaceId: 'crossover', fnKey: 'secondOrder', note: '12 dB/oct Butterworth values.' },
  ]),
  tpl('line-array', 'Line-Array Aim', 'Directivity control, spatial aliasing, and far-throw loss.', [
    { workspaceId: 'linearray', fnKey: 'directivity', note: 'Where the array controls directivity.' },
    { workspaceId: 'linearray', fnKey: 'aliasing', note: 'Where element spacing starts to lobe.' },
    { workspaceId: 'linearray', fnKey: 'distanceLoss', note: 'Level lost to the far seats.' },
  ]),
  tpl('sub-enclosure', 'Subwoofer Enclosure', 'Sealed tuning, vented port length, and displacement-limited SPL.', [
    { workspaceId: 'driver', fnKey: 'sealed', note: 'Sealed-box resonance and system Q.' },
    { workspaceId: 'driver', fnKey: 'portLength', note: 'Port length for a target vented tuning.' },
    { workspaceId: 'driver', fnKey: 'excursionSPL', note: 'Max SPL the driver’s excursion allows.' },
  ]),
  tpl('stereo-mic', 'Stereo Mic Setup', 'Arrival delay & comb null, then the 3:1 spacing rule.', [
    { workspaceId: 'stereomic', fnKey: 'pathDelay', note: 'Arrival delay and the first mono comb null.' },
    { workspaceId: 'stereomic', fnKey: 'threeToOne', note: 'Minimum spacing to keep bleed clean in mono.' },
  ]),
  tpl('network-audio', 'Network Audio Link', 'Raw audio bandwidth, then the on-the-wire packet rate.', [
    { workspaceId: 'netaudio', fnKey: 'bandwidth', note: 'Raw channels × sample rate × bit depth.' },
    { workspaceId: 'netaudio', fnKey: 'packetize', note: 'Packets per second and the on-the-wire rate.' },
  ]),
];
