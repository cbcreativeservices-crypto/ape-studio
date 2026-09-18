/**
 * production/types — the shared vocabulary of BOTH production labs.
 *
 * Plan of record: docs/APE_PRODUCTION_LABS_PLAN_2026_09_17.md.
 *
 * The central decision (plan §2): Pre-Production and Post-Production are ONE
 * machine with two content sets. Pre-Production builds a plan from nothing into
 * a Production Packet; Post-Production repairs a handed-over project into a
 * Delivery Package. Underneath, both are: structured decisions → cross-field
 * validation → readiness scoring → exported document. So the engine lives here
 * once, and each lab is CONTENT. Adding a stage must never mean adding a screen.
 *
 * Nothing in this module imports React or react-native. It is pure data and pure
 * functions, which is what lets `node --test` exercise the whole engine.
 */

/** Which lab a project belongs to. */
export type LabKind = 'preprod' | 'postprod';

/**
 * Project pathway. The user picks one at the start and it reshapes the
 * questions, the wording and the problems — but never the screens, because a
 * pathway is a schema overlay, not a fork (plan §2.1).
 *
 * Owner 2026-09-17: MUSIC, PODCAST and LIVE open the labs. Between them they
 * cover the app's whole study-area lineup. The remaining four are authored
 * later as content and each ships on its own.
 */
export const LAUNCH_PATHWAYS = ['music', 'podcast', 'live'] as const;
export const LATER_PATHWAYS = ['film', 'broadcast', 'game', 'custom'] as const;
export type PathwayId = (typeof LAUNCH_PATHWAYS)[number] | (typeof LATER_PATHWAYS)[number];

export const PATHWAY_LABEL: Record<PathwayId, string> = {
  music: 'Music recording',
  podcast: 'Podcast or spoken word',
  live: 'Live performance or event',
  film: 'Film or video sound',
  broadcast: 'Broadcast or livestream',
  game: 'Game, immersive or interactive',
  custom: 'Custom production',
};

/** True for a pathway whose content is authored and open. */
export function isOpenPathway(p: PathwayId): boolean {
  return (LAUNCH_PATHWAYS as readonly string[]).includes(p);
}

// ── field values ─────────────────────────────────────────────────────────────

/** One row of a `table` field. Column id → cell value. */
export type TableRow = Record<string, string | number | boolean | null>;

export type FieldValue = string | number | boolean | string[] | TableRow[] | null;

/**
 * A project's answers, keyed `${stageId}.${fieldId}`.
 *
 * FLAT on purpose. A nested shape would make every added stage a migration of
 * every saved project; a flat map lets the schema grow while old saves stay
 * readable, and an unknown key is simply ignored rather than fatal.
 */
export type ValueMap = Record<string, FieldValue>;

/**
 * "Not applicable" carries a REASON, never a bare boolean. The readiness meter
 * has to judge decisions (plan §2.3), and choosing to skip something is a
 * decision the user should be able to defend — so it is recorded like one.
 */
export type NaMap = Record<string, string>;

/**
 * A blocker an authorised person accepted rather than fixed. This is how a real
 * production proceeds with a known gap, and it prints in the packet so the
 * decision is visible rather than buried.
 */
export type AcceptedCondition = {
  ruleId: string;
  /** Who accepted it. A named person, not a role. */
  acceptedBy: string;
  /** Why proceeding is acceptable. */
  reason: string;
  at: number;
};

export type ProductionProject = {
  id: string;
  v: 1;
  lab: LabKind;
  pathway: PathwayId;
  name: string;
  createdAt: number;
  updatedAt: number;
  values: ValueMap;
  na: NaMap;
  acceptedConditions: AcceptedCondition[];
  /** Set when the project was seeded by an activity or the capstone. */
  scenarioId?: string;
  /** Document-control revision, incremented when a packet is exported. */
  revision: number;
};

// ── findings ─────────────────────────────────────────────────────────────────

/**
 * Severity. `blocker` is deliberately hard to clear: plan §2.3 requires that a
 * numerical score can NEVER outrank an unresolved safety, legal, recording or
 * delivery blocker. That rule lives in readiness.ts, not in a screen.
 */
export type Severity = 'blocker' | 'attention' | 'info';

export type FindingKind =
  | 'missing'
  | 'conflict'
  | 'unrealistic'
  | 'mismatch'
  | 'unsafe'
  | 'legal';

export type Finding = {
  ruleId: string;
  stageId: string;
  /** Fields the user should look at. Drives "take me there". */
  fieldIds: string[];
  severity: Severity;
  kind: FindingKind;
  title: string;
  detail: string;
  fixHint?: string;
  /** An existing lab or tool that teaches this. Deep link, never a rebuild. */
  learnMore?: { route: string; params?: Record<string, unknown> };
  /** Set when an authorised person accepted this blocker instead of fixing it. */
  accepted?: AcceptedCondition;
};

// ── readiness ────────────────────────────────────────────────────────────────

/** The five states the meter shows. Exactly the owner's spec wording. */
export type ReadinessState =
  | 'complete'
  | 'attention'
  | 'missing'
  | 'conflict'
  | 'na';

export const READINESS_LABEL: Record<ReadinessState, string> = {
  complete: 'Complete',
  attention: 'Needs attention',
  missing: 'Missing',
  conflict: 'Conflict detected',
  na: 'Not applicable',
};

/** The verdict a whole project receives. */
export type ProjectVerdict = 'ready' | 'ready_with_conditions' | 'not_ready';

export const VERDICT_LABEL: Record<LabKind, Record<ProjectVerdict, string>> = {
  preprod: {
    ready: 'Ready for Production',
    ready_with_conditions: 'Ready With Approved Conditions',
    not_ready: 'Not Ready for Production',
  },
  postprod: {
    ready: 'Approved for Delivery',
    ready_with_conditions: 'Approved With Documented Conditions',
    not_ready: 'Not Approved',
  },
};

// ── helpers ──────────────────────────────────────────────────────────────────

/** The flat key a value is stored under. */
export function valueKey(stageId: string, fieldId: string): string {
  return `${stageId}.${fieldId}`;
}

/**
 * Has this field actually been decided?
 *
 * Deliberately strict. Whitespace is not an answer, an empty multi-select is
 * not an answer, and a table with no rows is not an answer. The meter must
 * reward decisions, not visits (plan §2.3), and this predicate is where that
 * begins.
 */
/** One cell, or one entry of a multi-choice. */
function scalarAnswered(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'boolean') return true;
  return false;
}

/**
 * Has this field been answered?
 *
 * ── A TABLE WITH A BLANK ROW IN IT IS NOT AN ANSWER (2026-09-17) ──────────
 *
 * This used to accept any non-empty array, and a table field's value is an array
 * of ROW OBJECTS. Tapping "add row" appends a row whose cells are all empty — so
 * `length > 0` was true, the field read COMPLETE, and the stage's progress
 * counted it as a decision the user had made.
 *
 * A bug-hunt pass measured it: 11 of 16 required pre-production tables and 5 of
 * 6 post-production tables went green from one blank row. Among them were the
 * HAZARD REGISTER and the RIGHTS REGISTER — the two tables whose entire purpose
 * is that somebody looked, and the two whose emptiness is most expensive later.
 * A plan that reports itself ready when it is not is the one failure this whole
 * feature exists to prevent.
 *
 * A row counts once any cell in it carries something. Multi-choice values are
 * arrays of plain strings and are unaffected.
 */
export function isAnswered(v: FieldValue | undefined): boolean {
  if (Array.isArray(v)) {
    return v.some((item) =>
      item !== null && typeof item === 'object'
        ? Object.values(item as Record<string, unknown>).some(scalarAnswered)
        : scalarAnswered(item),
    );
  }
  return scalarAnswered(v);
}

/** Stable id for a new project. */
export function newProjectId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
