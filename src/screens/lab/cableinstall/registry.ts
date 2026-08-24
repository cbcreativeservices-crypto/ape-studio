/**
 * Cable Dressing & Installation Lab — MODULE REGISTRY + module contract.
 *
 * 13 instructional stages (12 modules + the final field inspection), completed
 * primarily in sequence with voluntary replay (spec §6). Pure data + types —
 * zero React (house rule).
 *
 * The central learning loop every stage serves:
 *   PLAN → ROUTE → SUPPORT → DRESS → PROTECT → TERMINATE → LABEL → INSPECT
 */
import type { CiDimScores } from './engine/score';

export type CiModuleId =
  | 'why'
  | 'know'
  | 'route'
  | 'mech'
  | 'supports'
  | 'rack'
  | 'walls'
  | 'ceiling'
  | 'floor'
  | 'emi'
  | 'fire'
  | 'label'
  | 'inspect';

export type CiModuleDef = {
  id: CiModuleId;
  tag: string;
  title: string;
  intro: string;
  /** labCompletion unit marked when the module's exercises complete. */
  unit: string;
};

export const CI_MODULES: CiModuleDef[] = [
  {
    id: 'why',
    tag: 'STAGE 1 · WHY',
    title: 'Why Cable Dressing Matters',
    intro: 'Cable management is not appearance. Six consequences ride on every run — and the neatest install is not automatically the right one.',
    unit: 'm_why',
  },
  {
    id: 'know',
    tag: 'STAGE 2 · KNOW',
    title: 'Know What You Are Installing',
    intro: 'Installation method follows cable type and use case. Before routing anything, know what it is, what it carries, and what can hurt it.',
    unit: 'm_know',
  },
  {
    id: 'route',
    tag: 'STAGE 3 · PLAN',
    title: 'Plan the Route',
    intro: 'The shortest route is not always the best route. Judge candidate routes on safety, protection, pathway quality and the next technician.',
    unit: 'm_route',
  },
  {
    id: 'mech',
    tag: 'STAGE 4 · PROTECT',
    title: 'Mechanical Cable Protection',
    intro: 'Bends, tension and restraints all have limits — and the limits belong to the specific cable. Check the specification: that IS the skill.',
    unit: 'm_mech',
  },
  {
    id: 'supports',
    tag: 'STAGE 5 · SUPPORT',
    title: 'Cable Supports & Pathways',
    intro: 'Support carries weight. Pathway defines the route. Protection blocks damage. Management organizes for service. Choose hardware by the job.',
    unit: 'm_supports',
  },
  {
    id: 'rack',
    tag: 'STAGE 6 · DRESS',
    title: 'Rack Cable Dressing',
    intro: 'The professional audio heart of the lab: find what\'s wrong with a bad rack, dress it right, then prove it with a service call.',
    unit: 'm_rack',
  },
  {
    id: 'walls',
    tag: 'STAGE 7 · WALLS',
    title: 'Wall & Surface Installations',
    intro: 'Raceway, penetrations, doorways and raw edges — and the one question that must be answered before any drill touches a wall.',
    unit: 'm_walls',
  },
  {
    id: 'ceiling',
    tag: 'STAGE 8 · OVERHEAD',
    title: 'Ceiling & Overhead Installations',
    intro: 'Above the tiles is other people\'s infrastructure. Find the violations, then install a run with its own supports — to the given system\'s spec.',
    unit: 'm_ceiling',
  },
  {
    id: 'floor',
    tag: 'STAGE 9 · FLOOR',
    title: 'Floor & Temporary Event Runs',
    intro: 'Stage, FOH and load-in: keep walking routes safe, protect for the real traffic, and coil flexible cable so it deploys straight.',
    unit: 'm_floor',
  },
  {
    id: 'emi',
    tag: 'STAGE 10 · SIGNAL',
    title: 'Power, Signal & Interference',
    intro: 'No folklore: coupling depends on level, balancing, shielding, current, distance and geometry. Manage exposure — don\'t recite a number.',
    unit: 'm_emi',
  },
  {
    id: 'fire',
    tag: 'STAGE 11 · BUILDING',
    title: 'Penetrations, Fire & Building Spaces',
    intro: 'Recognize when code requirements are triggered: rated assemblies, air-handling spaces, risers — and what "verify first" means.',
    unit: 'm_fire',
  },
  {
    id: 'label',
    tag: 'STAGE 12 · IDENTIFY',
    title: 'Labeling, Serviceability & Documentation',
    intro: 'Troubleshoot an unlabeled system once and you\'ll never skip labels again. Identity, records and intentional slack make systems serviceable.',
    unit: 'm_label',
  },
  {
    id: 'inspect',
    tag: 'FINAL · INSPECT',
    title: 'Final Installation Inspection',
    intro: 'The capstone: one facility, many defects. Find them, classify them, correct them — then pass the knowledge check.',
    unit: 'm_inspect',
  },
];

/** Extra completion units beyond the per-module ones. */
export const CI_INSPECT_PASS_UNIT = 'inspect_pass';
export const CI_FINAL_CHECK_UNIT = 'final_check';

export const CI_LAB_UNITS: readonly string[] = [
  ...CI_MODULES.map((m) => m.unit),
  CI_INSPECT_PASS_UNIT,
  CI_FINAL_CHECK_UNIT,
];

/** Contract every module scene implements. */
export type CiModuleProps = {
  /** Content width (host-measured, CableLab idiom). */
  width: number;
  /** True once this module's unit is already cleared (replay mode). */
  completed: boolean;
  /** Fire ONCE when the module's exercises are genuinely completed —
   *  optionally carrying the dimension scores the exercises produced. */
  onComplete: (dims?: CiDimScores) => void;
  /** Open the host's source sheet on these source ids. */
  openSources: (sourceIds: string[]) => void;
};

export const CI_TITLE = 'Cable Dressing & Installation';
export const CI_SUBTITLE = 'Route it. Support it. Protect it. Make it serviceable.';

export const CI_OBJECTIVES = [
  'Plan professional cable routes',
  'Protect cables from mechanical damage',
  'Select appropriate supports and pathways',
  'Dress racks for performance and service',
  'Manage floor and overhead runs safely',
  'Inspect an installation professionally',
] as const;

export const CI_GOVERN_NOTE =
  'Local electrical, fire, building and workplace regulations always govern. U.S. regulatory material is labeled; permanent electrical wiring is installed by appropriately qualified personnel.';

/** The field-checklist reward (spec §44) — a training summary, not a
 *  substitute for project documents or code. */
export const CI_FIELD_CHECK: { title: string; items: string[] }[] = [
  {
    title: 'BEFORE PULLING',
    items: [
      'Verify cable type for the signal AND the space',
      'Verify the route — pathways, spaces, penetrations',
      'Verify environment (air-handling, riser, wet, public)',
      'Check pathway capacity, including what\'s already there',
      'Check the cable manufacturer\'s installation requirements',
    ],
  },
  {
    title: 'DURING INSTALLATION',
    items: [
      'Protect cable from edges, pinches and traffic',
      'Control pull force — never force a snag',
      'Maintain the specified bend radius everywhere',
      'Support to the support system\'s criteria',
      'Restrain to hold, never to crush',
      'Keep terminations strain-free',
    ],
  },
  {
    title: 'DRESSING',
    items: [
      'Organize intentionally — by class, by plan',
      'Preserve service access to every device',
      'Preserve equipment airflow',
      'Manage slack deliberately, where hands can reach it',
      'Maintain the planned power/signal relationships',
    ],
  },
  {
    title: 'FINISH',
    items: [
      'Label both ends + service points to the scheme',
      'Inspect against the plan',
      'Test and verify',
      'Document — records must match reality',
      'Clean the work area',
      'Update as-builts where applicable',
    ],
  },
];
