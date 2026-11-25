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
import type { CarrySnap, StepCarry, Workflow, WorkflowStep } from './workflowModel';

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
 *  the UI to say so — never silently pretend the workflow is intact. A step's
 *  carried values (fix-first 15) are renumbered to follow the steps that stay;
 *  one whose source step was dropped is removed. */
export function validateWorkflow(w: Workflow): { workflow: Workflow; dropped: number } {
  const keep = w.steps.map((s) => resolveStep(s) != null);
  if (keep.every(Boolean)) return { workflow: w, dropped: 0 };
  const newIndex: number[] = [];
  let k = 0;
  keep.forEach((ok, i) => {
    newIndex[i] = ok ? k++ : -1;
  });
  const steps = w.steps
    .filter((_, i) => keep[i])
    .map((s) => {
      if (!s.carry) return s;
      const carry: Record<string, StepCarry> = {};
      for (const [key, c] of Object.entries(s.carry)) {
        const to = newIndex[c.from];
        if (to != null && to >= 0) carry[key] = { ...c, from: to };
      }
      return { ...s, carry };
    });
  return { workflow: { ...w, steps }, dropped: w.steps.length - steps.length };
}

// ---------------------------------------------------------------------------
// Built-in templates — read-only; duplicate-and-customize to edit.
// Every (workspaceId, fnKey) below was verified against the live registry.
//
// CARRY (fix-first 15, owner 2026-11-25): `carry` names, per input, the value
// a step takes from an earlier step — an earlier INPUT (`inp`) or ANSWER
// (`ans`). Each link below is reviewed physics: the same quantity, the same
// unit and the same thing (test/fixFirst15_calc_20261125 lists every one).
// Left out on purpose: Digital Session Storage's CHANNELS (step 2 counts the
// channels of the whole recording, step 1 the channels of one track).
// ---------------------------------------------------------------------------

const T = '2026-08-06T00:00:00.000Z';
type TplCarry = { from: number; input?: string; output?: string; snap?: CarrySnap };
type TplStep = Omit<WorkflowStep, 'carry'> & { carry?: Record<string, TplCarry> };
const inp = (from: number, input: string): TplCarry => ({ from, input });
const ans = (from: number, output: string, snap?: CarrySnap): TplCarry => ({ from, output, ...(snap ? { snap } : {}) });
const tpl = (id: string, name: string, description: string, steps: TplStep[]): Workflow => ({
  id: `tpl-${id}`,
  name,
  description,
  steps: steps.map((s): WorkflowStep => {
    const base: WorkflowStep = { workspaceId: s.workspaceId, fnKey: s.fnKey, ...(s.note ? { note: s.note } : {}), ...(s.estimate ? { estimate: s.estimate } : {}) };
    if (!s.carry) return base;
    const carry: Record<string, StepCarry> = {};
    for (const [key, c] of Object.entries(s.carry)) {
      carry[key] = { ...c, ws: steps[c.from]?.workspaceId ?? '', fn: steps[c.from]?.fnKey ?? '' };
    }
    return { ...base, carry };
  }),
  isTemplate: true,
  createdAt: T,
  updatedAt: T,
});

export const WORKFLOW_TEMPLATES: Workflow[] = [
  tpl('delay-speaker', 'Delay Speaker Setup', 'Speed of sound, then distance delay, then device latency.', [
    { workspaceId: 'wave', fnKey: 'speed', note: 'Get the speed of sound for today’s temperature.' },
    { workspaceId: 'distdelay', fnKey: 'distToDelay', note: 'Turn the distance to the delay speaker into milliseconds.', carry: { temp: inp(0, 'temp') } },
    { workspaceId: 'latency', fnKey: 'bufLatency', note: 'Account for the processor’s own buffer latency.' },
  ]),
  tpl('spl-estimate', 'Loudspeaker SPL Estimate', 'Predicted SPL from sensitivity/power, then at the listener distance.', [
    { workspaceId: 'speakerpower', fnKey: 'predictspl', note: 'Predict SPL from sensitivity and amplifier power.' },
    // The level AND the distance it was worked out at (audit item 1): L₁ alone
    // left d₁ to the "often 1 m" hint — 79.93 dB at 8 m for a true 99.93 dB.
    { workspaceId: 'spldist', fnKey: 'point', note: 'Carry that SPL to the actual listening distance.', carry: { l1: ans(0, 'PREDICTED SPL (one speaker, after headroom)'), d1: inp(0, 'dist') } },
  ]),
  tpl('amp-matching', 'Amplifier & Loudspeaker Matching', 'Load impedance, then the amplifier power the target needs.', [
    { workspaceId: 'impedance', fnKey: 'parallel', note: 'Find the combined load the amp will see.' },
    { workspaceId: 'speakerpower', fnKey: 'reqpower', note: 'Find the power needed for the target SPL.' },
  ]),
  tpl('cable-drop', 'Speaker Cable Loss', 'Loss over the run, then the suggested gauge.', [
    { workspaceId: 'cable', fnKey: 'loss', note: 'Check the loss for this length and gauge.' },
    { workspaceId: 'cable', fnKey: 'recgauge', note: 'Confirm the suggested gauge for the run.', carry: { len: inp(0, 'len'), z: inp(0, 'z') } },
  ]),
  tpl('room-modes', 'Room Mode Review', 'Axial modes, then the reverb-time picture.', [
    { workspaceId: 'roommodes', fnKey: 'axial', note: 'List the room’s axial modes.' },
    { workspaceId: 'sabine', fnKey: 'rtFromVA', note: 'Estimate RT60 for the same room.' },
  ]),
  tpl('tempo-delay', 'Tempo & Delay Time', 'Note-value delay times from the song tempo.', [
    { workspaceId: 'bpm', fnKey: 'noteValues', note: 'Delay times for each note value at this BPM.' },
    { workspaceId: 'bpm', fnKey: 'preDelay', note: 'Pick a musical pre-delay from the same tempo.', carry: { bpm: inp(0, 'bpm') } },
  ]),
  tpl('wavelength', 'Wavelength & Frequency', 'Wavelength, then the period of the same tone.', [
    { workspaceId: 'wave', fnKey: 'wavelength' },
    { workspaceId: 'wave', fnKey: 'period', carry: { f: inp(0, 'f') } },
  ]),
  tpl('ohms-law', 'Ohm’s Law', 'Power from voltage & impedance, then the current drawn.', [
    { workspaceId: 'ohmspower', fnKey: 'pFromVZ' },
    { workspaceId: 'ohmspower', fnKey: 'iFromPV', carry: { p: ans(0, 'POWER'), vrms: inp(0, 'vrms') } },
  ]),
  tpl('impedance', 'Series & Parallel Impedance', 'Series total, then the parallel combination.', [
    { workspaceId: 'electronics', fnKey: 'seriesR' },
    { workspaceId: 'electronics', fnKey: 'parallelR', carry: { rlist: inp(0, 'rlist') } },
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
    { workspaceId: 'critdist', fnKey: 'dc', carry: { vol: inp(0, 'vol'), rt60: ans(0, 'RT60') }, note: 'Critical distance from room volume, RT60 and source directivity.' },
    { workspaceId: 'critdist', fnKey: 'drr', note: 'Direct-to-reverberant ratio at the listener.', carry: { vol: inp(1, 'vol'), rt60: inp(1, 'rt60'), q: inp(1, 'q') } },
  ]),
  tpl('bass-boundaries', 'Bass & Boundaries', 'Axial modes, boundary cancellations, and the Schroeder transition.', [
    { workspaceId: 'roommodes', fnKey: 'axial', note: 'The room’s axial modes.' },
    { workspaceId: 'boundary', fnKey: 'sbir', note: 'Boundary cancellations & reinforcements (SBIR).', carry: { temp: inp(0, 'temp') } },
    { workspaceId: 'schroeder', fnKey: 'fs', note: 'Where modal behavior gives way to a diffuse field.' },
  ]),
  tpl('wireless-link', 'Wireless Mic Link', 'Free-space path loss, then the received power and link margin.', [
    { workspaceId: 'rflink', fnKey: 'pathLoss', note: 'Path loss at this distance and frequency.' },
    { workspaceId: 'rflink', fnKey: 'budget', note: 'Received power and how much link margin you have.', carry: { dist: inp(0, 'dist'), freqMHz: inp(0, 'freqMHz') } },
  ]),
  tpl('rack-power', 'Rack Power & Circuit', 'Current, heat and airflow, then the safe wattage for the breaker.', [
    { workspaceId: 'rackheat', fnKey: 'heatLoad', note: 'AC current, BTU/hr and the cooling airflow.' },
    { workspaceId: 'rackheat', fnKey: 'safeLoad', note: 'Safe continuous wattage for the circuit.', carry: { mains: inp(0, 'mains') } },
  ]),
  tpl('power-run', 'Long Power Run', 'Voltage drop over the run, the gauge that keeps it in spec, then the ampacity check.', [
    { workspaceId: 'vdrop', fnKey: 'drop', note: 'Voltage lost over this length and gauge.' },
    { workspaceId: 'vdrop', fnKey: 'gaugeFor', note: 'Gauge needed for your allowable drop.', carry: { len: inp(0, 'len'), current: inp(0, 'current'), vsrc: inp(0, 'vsrc'), condTemp: inp(0, 'condTemp') } },
    // The gauge carries in (audit item 2). The current cannot: NEC ampacity is a
    // property of the conductor, so the note says what to compare it with.
    // Round 2 (owner 2026-11-25): the gauge arrives as the next THICKER size
    // Table 310.16 lists (11 → 10; the step says so), and a load of 3 hours or
    // more is compared with the 80 % continuous figure (NEC 210.19 / 210.20).
    { workspaceId: 'ampacity', fnKey: 'awg', note: 'Whether the gauge from step 2 may carry the current (NEC Table 310.16 and its limits): its ALLOWABLE AMPACITY must be at least the current from step 1; for a load that runs 3 hours or more, compare with MAX CONTINUOUS LOAD instead. If it is less, choose a thicker conductor (a lower AWG number) and check again.', carry: { awg: ans(1, 'DROP-LIMITED AWG (CHECK AMPACITY)', 'awg-table') } },
  ]),
  tpl('passive-crossover', 'Passive Crossover', 'First-order and second-order component values for the crossover.', [
    { workspaceId: 'crossover', fnKey: 'firstOrder', note: '6 dB/oct inductor & capacitor values.' },
    { workspaceId: 'crossover', fnKey: 'secondOrder', note: '12 dB/oct Butterworth values.', carry: { fx: inp(0, 'fx'), z: inp(0, 'z') } },
  ]),
  tpl('line-array', 'Line-Array Aim', 'Directivity control, spatial aliasing, and far-throw loss.', [
    { workspaceId: 'linearray', fnKey: 'directivity', note: 'Where the array controls directivity.' },
    { workspaceId: 'linearray', fnKey: 'aliasing', note: 'Where element spacing starts to lobe.', carry: { temp: inp(0, 'temp') } },
    { workspaceId: 'linearray', fnKey: 'distanceLoss', note: 'Level lost to the far seats.' },
  ]),
  tpl('sub-enclosure', 'Subwoofer Enclosure', 'Sealed tuning, vented port length, and displacement-limited SPL.', [
    { workspaceId: 'driver', fnKey: 'sealed', note: 'Sealed-box resonance and system Q.' },
    { workspaceId: 'driver', fnKey: 'portLength', note: 'Port length for a target vented tuning.', carry: { vb: inp(0, 'vb') } },
    { workspaceId: 'driver', fnKey: 'excursionSPL', note: 'Max SPL the driver’s excursion allows.' },
  ]),
  tpl('stereo-mic', 'Stereo Mic Setup', 'Arrival delay & comb null, then the 3:1 spacing rule.', [
    { workspaceId: 'stereomic', fnKey: 'pathDelay', note: 'Arrival delay and the first mono comb null.' },
    { workspaceId: 'stereomic', fnKey: 'threeToOne', note: '3:1 spacing for two mics on different sources, so bleed stays clean in mono.' },
  ]),
  tpl('network-audio', 'Network Audio Link', 'Raw audio bandwidth, then the on-the-wire packet rate.', [
    { workspaceId: 'netaudio', fnKey: 'bandwidth', note: 'Raw channels × sample rate × bit depth.' },
    { workspaceId: 'netaudio', fnKey: 'packetize', note: 'Packets per second and the on-the-wire rate.', carry: { channels: inp(0, 'channels'), sr: inp(0, 'sr'), bitdepth: inp(0, 'bitdepth') } },
  ]),

  // -------------------------------------------------------------------------
  // Gap-fill pass (owner 2026-08-09): common tasks that had no template but
  // map to existing calculators. Every (workspaceId, fnKey) verified.
  // -------------------------------------------------------------------------
  tpl('hearing-dose', 'Hearing Exposure & Dose', 'SPL at the listener, the allowable time, then the daily dose.', [
    // Round 2 (owner 2026-11-25): step 2's dBA field fills from this answer.
    { workspaceId: 'spldist', fnKey: 'point', note: 'SPL at the audience or operator distance. Enter L₁ as an A-weighted level (dBA).' },
    { workspaceId: 'dose', fnKey: 'allowNiosh', note: 'Allowable exposure time (NIOSH: 85 dBA, 3 dB exchange).', carry: { lex: ans(0, 'LEVEL AT d₂') } },
    { workspaceId: 'dose', fnKey: 'doseNiosh', note: 'Daily dose from the actual exposure intervals.' },
  ]),
  tpl('gain-staging', 'Input Gain Staging', 'Mic output, the preamp gain to reach target, and the clip ceiling.', [
    { workspaceId: 'micgain', fnKey: 'micout', note: 'Mic output voltage at the source SPL.' },
    { workspaceId: 'micgain', fnKey: 'gain', note: 'Preamp gain to reach your target level.', carry: { sens: inp(0, 'sens'), spl: inp(0, 'spl') } },
    { workspaceId: 'micgain', fnKey: 'maxspl', note: 'Loudest SPL before the preamp input clips.', carry: { sens: inp(1, 'sens') } },
  ]),
  tpl('cv-distribution', '70V / 100V Distribution', 'System load and line current, then how many more speakers fit.', [
    { workspaceId: 'cv70', fnKey: 'load', note: 'System load, amp fit, and line current.' },
    { workspaceId: 'cv70', fnKey: 'morespeakers', note: 'How many more taps the amplifier will take.', carry: { taps: inp(0, 'taps'), prated: inp(0, 'prated'), hr: inp(0, 'hr') } },
  ]),
  tpl('time-align', 'System Time Alignment', 'Delay to align a path offset, then the phase at the crossover.', [
    { workspaceId: 'align', fnKey: 'delayForOffset', note: 'Delay to add to the closer source.' },
    { workspaceId: 'align', fnKey: 'phaseAtFreq', note: 'Phase relationship at the crossover frequency.', carry: { offset: inp(0, 'offset'), temp: inp(0, 'temp') } },
  ]),
  // Audit item 2: the panels step works from the SAME room volume and target
  // RT60 as the absorption step (carried). Round 2 (owner 2026-11-25, his go):
  // a first step gives the room's RT60 NOW, carried into the panels step's
  // CURRENT RT60 (the same quantity: the room's RT60 in seconds), and its
  // absorption into step 2 (the same field of the same calculator). A learner
  // who does not know the absorption may tap a stated ESTIMATE (a typical
  // untreated room, workflowEstimate.ts); every answer resting on it says so.
  tpl('treatment-plan', 'Acoustic Treatment Plan', 'The room’s RT60 now, the absorption needed for the target RT, the panels, and wall isolation.', [
    { workspaceId: 'sabine', fnKey: 'rtFromVA', note: 'The room’s RT60 now, from its volume and total absorption. Don’t know the absorption? Tap I DON’T KNOW IT for a typical untreated room: an estimate, said as one.', estimate: { absA: 'untreated-room' } },
    { workspaceId: 'sabine', fnKey: 'neededA', note: 'Absorption needed for the target RT60.', carry: { vol: inp(0, 'vol'), absA: inp(0, 'absA') } },
    { workspaceId: 'treatment', fnKey: 'panels', note: 'Panels required to add that absorption.', carry: { vol: inp(0, 'vol'), rtCur: ans(0, 'RT60'), rtTgt: inp(1, 'targetRt') } },
    { workspaceId: 'transloss', fnKey: 'massTL', note: 'Isolation from a wall’s mass at a frequency.' },
  ]),
  tpl('monitor-latency', 'Monitoring Latency', 'One buffer’s latency, then the round-trip in-and-out.', [
    { workspaceId: 'latency', fnKey: 'bufLatency', note: 'Latency of one processing buffer.' },
    { workspaceId: 'latency', fnKey: 'roundTrip', note: 'Round-trip in + out monitoring latency.', carry: { inBuf: inp(0, 'buf'), outBuf: inp(0, 'buf'), sr: inp(0, 'sr') } },
  ]),
  tpl('session-storage', 'Digital Session Storage', 'Total multitrack session size, then the record time storage allows.', [
    { workspaceId: 'filesize', fnKey: 'multitrack', note: 'Total size of the multitrack session.' },
    { workspaceId: 'filesize', fnKey: 'recTime', note: 'Record time your storage allows.', carry: { sr: inp(0, 'sr'), bits: inp(0, 'bits') } },
  ]),
  tpl('speaker-limiter', 'Speaker Protection Limiter', 'Max continuous speaker voltage, then the limiter threshold to set.', [
    { workspaceId: 'limiter', fnKey: 'maxv', note: 'Max continuous voltage the driver takes.' },
    { workspaceId: 'limiter', fnKey: 'threshold', note: 'Processor limiter threshold to set.', carry: { pwr: inp(0, 'pwr'), z: inp(0, 'z') } },
  ]),
];
