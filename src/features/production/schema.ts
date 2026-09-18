/**
 * production/schema — the declarative stage tree, and how a pathway reshapes it.
 *
 * A stage is DATA. Screens render whatever this describes, so Computer C can
 * author a stage without anyone writing a component (plan §7, and the authoring
 * contract shipped to C on 2026-09-17).
 *
 * Pathway handling is the reason this file exists. Seven pathways over forty
 * builders would be unbuildable as screens; as overlays on one schema it is
 * forty schema entries plus a few conditional keys, which is ordinary content
 * work. A pathway NEVER forks a screen.
 */
import type { FieldValue, PathwayId, Severity, FindingKind, ValueMap } from './types';
import { isAnswered, valueKey } from './types';

export type FieldKind =
  | 'text'
  | 'longText'
  | 'number'
  | 'choice'
  | 'multiChoice'
  | 'date'
  /** Clock time on a production day. Added 2026-09-17 on Computer C's finding
   *  (NOTES §2.5, §6.2): a production-day schedule is a list of clock times, and
   *  storing them as free text put a lenient parser between the user and the
   *  most valuable rule in stage 4. */
  | 'time'
  | 'duration'
  | 'currency'
  | 'table'
  | 'status';

/** The fixed status vocabulary for `status` fields (rights, equipment, notes). */
export const STATUS_OPTIONS = [
  'Approved',
  'Requested',
  'Pending',
  'Restricted',
  'Expired',
  'Not required',
  'Missing',
] as const;
export type StatusValue = (typeof STATUS_OPTIONS)[number];

export type Option = { value: string; label: string };

export type ColumnDef = {
  columnId: string;
  label: string;
  kind: Exclude<FieldKind, 'table'>;
  options?: Option[];
  unit?: string;
};

/** Per-pathway override map. Absent key = use the base value. */
export type ByPathway<T> = Partial<Record<PathwayId, T>>;

export type FieldDef = {
  fieldId: string;
  label: string;
  kind: FieldKind;
  help?: string;
  placeholder?: string;
  /** `true`, `false`, or per-pathway. Absent = not required. */
  required?: boolean | ByPathway<boolean>;
  /** Present only on these pathways. Absent = all of them. */
  onlyFor?: PathwayId[];
  labelBy?: ByPathway<string>;
  helpBy?: ByPathway<string>;
  options?: Option[];
  unit?: string;
  columns?: ColumnDef[];
  /** May the user mark this "not applicable" with a reason? Default true. */
  allowNa?: boolean;
  /**
   * Show this field only when another answer says so.
   *
   * ── WHY (2026-09-18, design review #1) ────────────────────────────────────
   *
   * Both labs asked every question of everyone. A user who is not rigging was
   * still asked who the rigger is; a user who said "no correction needed" was
   * still walked through five correction fields. Their own help text already
   * said "if" or "only if" — the form knew the question was conditional and
   * asked it anyway.
   *
   * Gating them cuts what a typical user sees without deleting a word of
   * content, and it makes the form RESPOND to their answers: say "yes, we are
   * rigging" and three questions appear, which teaches the consequence of the
   * decision better than any help text can.
   *
   * ⚠️ A hidden field must not count as missing. `resolveStage` drops it from
   * the resolved stage entirely, and `readiness.ts` derives its denominator
   * from those resolved fields — so the meter falls with it automatically
   * rather than punishing someone for a question they were never asked.
   */
  showWhen?: ShowWhen;
};

/**
 * A condition on another field's answer, within the SAME stage.
 *
 * Deliberately not a general expression language: a `field` plus a list of
 * values is enough for every case the labs have, and it stays readable in the
 * content files where it is authored.
 */
export type ShowWhen = {
  /** `fieldId` of another field in this stage. */
  field: string;
  /** Show when the answer is one of these. */
  equals?: string[];
  /** Show unless the answer is one of these. */
  notEquals?: string[];
};

/**
 * A legal / safety boundary statement. Owner 2026-09-17 made this an app
 * standard: a notice sits at EACH point where one applies, not once in a lab
 * header. `qualified` is the strongest — work a licensed or certified person
 * must approve.
 */
export type NoticeKind = 'legal' | 'safety' | 'qualified';
export type NoticeDef = { kind: NoticeKind; text: string; onlyFor?: PathwayId[] };

export type SectionDef = {
  sectionId: string;
  title: string;
  intro?: string;
  notices?: NoticeDef[];
  fields: FieldDef[];
  onlyFor?: PathwayId[];
  /** Same conditional rule as a field's — hides the whole section. */
  showWhen?: ShowWhen;
};

/**
 * An authored rule. `needsLogic` marks the ones whose comparison lives in code:
 * Computer C writes the intent in prose and ccode implements it in `rules.ts`
 * against the same ruleId. C never writes logic (plan §12).
 */
export type RuleDef = {
  ruleId: string;
  watches: string[];
  severity: Severity;
  kind: FindingKind;
  title: string;
  detail: string;
  fixHint?: string;
  needsLogic?: boolean;
  logicIntent?: string;
  onlyFor?: PathwayId[];
  learnMore?: { route: string; params?: Record<string, unknown> };
};

export type ActivityDef = {
  activityId: string;
  title: string;
  prompt: string;
  seed: Record<string, FieldValue>;
  passWhen: string;
  debrief: string;
  /**
   * Pathways this exercise makes sense on. Added 2026-09-17 on Computer C's
   * finding (NOTES §2.4, §6.5): a seeded scenario is almost always
   * pathway-specific. The stage 3 exercise is a recorded live show and seeds
   * fields that only exist on the live pathway, so offering it on a podcast
   * project would seed values into fields that are not there. Absent = all.
   */
  onlyFor?: PathwayId[];
};

export type StageDef = {
  stageId: string;
  num: number;
  title: string;
  intro: string;
  whyItMatters: string;
  notices?: NoticeDef[];
  sections: SectionDef[];
  rules: RuleDef[];
  activity?: ActivityDef;
};

// ── pathway resolution ───────────────────────────────────────────────────────

const appliesTo = (onlyFor: PathwayId[] | undefined, p: PathwayId): boolean =>
  onlyFor === undefined || onlyFor.includes(p);

/** A field with every per-pathway override already applied. */
export type ResolvedField = Omit<FieldDef, 'required' | 'labelBy' | 'helpBy' | 'onlyFor'> & {
  required: boolean;
};

export type ResolvedSection = Omit<SectionDef, 'fields' | 'onlyFor' | 'notices'> & {
  fields: ResolvedField[];
  notices: NoticeDef[];
};

export type ResolvedStage = Omit<StageDef, 'sections' | 'rules' | 'notices'> & {
  sections: ResolvedSection[];
  rules: RuleDef[];
  notices: NoticeDef[];
};

function resolveRequired(req: FieldDef['required'], p: PathwayId): boolean {
  if (req === undefined) return false;
  if (typeof req === 'boolean') return req;
  return req[p] ?? false;
}

/**
 * Collapse a stage for one pathway: drop what does not apply, apply the wording
 * overrides, and settle required-ness. Screens only ever see the result, which
 * is why they contain no pathway logic at all.
 */
/**
 * Does this `showWhen` pass, given the project's current answers?
 *
 * UNKNOWN IS VISIBLE. When the controlling field has not been answered yet, the
 * condition cannot be evaluated and the dependent field SHOWS. Hiding on
 * unknown would mean a fresh project opens with half its questions missing and
 * no way to discover them — the opposite of the point.
 */
function showWhenPasses(rule: ShowWhen | undefined, stageId: string, values: ValueMap | undefined): boolean {
  if (!rule) return true;
  if (!values) return true; // no values supplied — resolve everything (used by previews/tests)
  const raw = values[valueKey(stageId, rule.field)];
  if (!isAnswered(raw)) return true;
  const answers = (Array.isArray(raw) ? raw : [raw])
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.toLowerCase());
  if (answers.length === 0) return true;
  if (rule.equals && !rule.equals.some((e) => answers.includes(e.toLowerCase()))) return false;
  if (rule.notEquals && rule.notEquals.some((e) => answers.includes(e.toLowerCase()))) return false;
  return true;
}

export function resolveStage(stage: StageDef, pathway: PathwayId, values?: ValueMap): ResolvedStage {
  const sections: ResolvedSection[] = [];
  for (const s of stage.sections) {
    if (!appliesTo(s.onlyFor, pathway)) continue;
    if (!showWhenPasses(s.showWhen, stage.stageId, values)) continue;
    const fields: ResolvedField[] = [];
    for (const f of s.fields) {
      if (!appliesTo(f.onlyFor, pathway)) continue;
      if (!showWhenPasses(f.showWhen, stage.stageId, values)) continue;
      const { required, labelBy, helpBy, onlyFor, ...rest } = f;
      fields.push({
        ...rest,
        label: labelBy?.[pathway] ?? f.label,
        help: helpBy?.[pathway] ?? f.help,
        required: resolveRequired(required, pathway),
        allowNa: f.allowNa !== false,
      });
    }
    sections.push({
      sectionId: s.sectionId,
      title: s.title,
      intro: s.intro,
      fields,
      notices: (s.notices ?? []).filter((n) => appliesTo(n.onlyFor, pathway)),
    });
  }
  return {
    stageId: stage.stageId,
    num: stage.num,
    title: stage.title,
    intro: stage.intro,
    whyItMatters: stage.whyItMatters,
    notices: (stage.notices ?? []).filter((n) => appliesTo(n.onlyFor, pathway)),
    sections,
    rules: stage.rules.filter((r) => appliesTo(r.onlyFor, pathway)),
    activity: stage.activity,
  };
}

/** Every field of a resolved stage, flattened. */
export function stageFields(stage: ResolvedStage): ResolvedField[] {
  return stage.sections.flatMap((s) => s.fields);
}

/** The flat value keys a resolved stage owns. */
export function stageKeys(stage: ResolvedStage): string[] {
  return stageFields(stage).map((f) => valueKey(stage.stageId, f.fieldId));
}

// ── schema integrity ─────────────────────────────────────────────────────────

/**
 * Structural check over authored content. This is the same contract the
 * validator shipped to Computer C enforces; running it here too means a bad
 * ingest fails in a test rather than on a user's screen.
 */
export function validateStage(stage: StageDef): string[] {
  const errors: string[] = [];
  const fieldIds = new Set<string>();
  const ruleIds = new Set<string>();

  if (!stage.stageId) errors.push('stage has no stageId');
  if (!stage.sections.length) errors.push(`${stage.stageId}: no sections`);

  for (const s of stage.sections) {
    for (const f of s.fields) {
      const at = `${stage.stageId}.${f.fieldId}`;
      if (!f.fieldId) errors.push(`${stage.stageId}: a field has no fieldId`);
      if (fieldIds.has(f.fieldId)) errors.push(`${at}: duplicate fieldId`);
      fieldIds.add(f.fieldId);
      if (!f.label) errors.push(`${at}: no label`);
      if ((f.kind === 'choice' || f.kind === 'multiChoice') && !f.options?.length) {
        errors.push(`${at}: kind "${f.kind}" requires options`);
      }
      if (f.kind === 'table' && !f.columns?.length) errors.push(`${at}: kind "table" requires columns`);
      if (f.options) {
        const seen = new Set<string>();
        for (const o of f.options) {
          if (seen.has(o.value)) errors.push(`${at}: duplicate option value "${o.value}"`);
          seen.add(o.value);
        }
      }
    }
  }

  for (const r of stage.rules) {
    if (ruleIds.has(r.ruleId)) errors.push(`${stage.stageId}: duplicate ruleId "${r.ruleId}"`);
    ruleIds.add(r.ruleId);
    if (!r.title || !r.detail) errors.push(`${r.ruleId}: needs both title and detail`);
    if (!r.watches?.length) errors.push(`${r.ruleId}: watches nothing`);
    for (const w of r.watches) {
      const [sid, fid] = w.split('.');
      if (sid === stage.stageId && fid && !fieldIds.has(fid)) {
        errors.push(`${r.ruleId}: watches "${w}", which does not exist in this stage`);
      }
    }
    if (r.needsLogic && !r.logicIntent) errors.push(`${r.ruleId}: needsLogic without logicIntent`);
  }

  if (stage.activity) {
    for (const k of Object.keys(stage.activity.seed)) {
      const [sid, fid] = k.split('.');
      if (sid === stage.stageId && fid && !fieldIds.has(fid)) {
        errors.push(`${stage.activity.activityId}: seeds "${k}", which does not exist`);
      }
    }
  }

  return errors;
}

/**
 * Validate a WHOLE lab, resolving every cross-stage reference.
 *
 * Added 2026-09-17 on Computer C's finding (NOTES §6.1). `validateStage` only
 * checks watches carrying its own stage's prefix, and roughly half the useful
 * rules in the first batch are cross-stage — a rule in stage 1 watching a field
 * in stage 4. A typo in one of those resolved to nothing and the rule silently
 * never fired, which is the worst possible failure for a warning system.
 *
 * This is also the guard on the field names C flagged as load-bearing: rename
 * `schedule.production_days` and the stage 1 Scope Warning breaks quietly. Now
 * it breaks loudly, in a test.
 */
export function validateStages(stages: StageDef[]): string[] {
  const errors: string[] = stages.flatMap((s) => validateStage(s));

  // Every field key that exists anywhere in the lab.
  const known = new Set<string>();
  const stageIds = new Set<string>();
  for (const s of stages) {
    if (stageIds.has(s.stageId)) errors.push(`duplicate stageId "${s.stageId}"`);
    stageIds.add(s.stageId);
    for (const sec of s.sections) {
      for (const f of sec.fields) known.add(`${s.stageId}.${f.fieldId}`);
    }
  }

  const seenRuleIds = new Map<string, string>();
  for (const s of stages) {
    for (const r of s.rules) {
      const prev = seenRuleIds.get(r.ruleId);
      if (prev) errors.push(`ruleId "${r.ruleId}" used in both ${prev} and ${s.stageId}`);
      else seenRuleIds.set(r.ruleId, s.stageId);

      for (const w of r.watches) {
        // A watch naming a stage that exists must name a field that exists.
        const [sid] = w.split('.');
        if (stageIds.has(sid) && !known.has(w)) {
          errors.push(`${r.ruleId}: watches "${w}", which does not exist in this lab`);
        }
      }
    }
    if (s.activity) {
      for (const k of Object.keys(s.activity.seed)) {
        const [sid] = k.split('.');
        if (stageIds.has(sid) && !known.has(k)) {
          errors.push(`${s.activity.activityId}: seeds "${k}", which does not exist in this lab`);
        }
      }
    }
  }
  return errors;
}

/**
 * Seeded table rows must use real column ids, and seeded choice values must be
 * real options. Separate from validateStages because it needs to look inside
 * values rather than structure.
 */
export function validateSeeds(stages: StageDef[]): string[] {
  const errors: string[] = [];
  const fieldByKey = new Map<string, FieldDef>();
  for (const s of stages) {
    for (const sec of s.sections) {
      for (const f of sec.fields) fieldByKey.set(`${s.stageId}.${f.fieldId}`, f);
    }
  }

  for (const s of stages) {
    const a = s.activity;
    if (!a) continue;
    for (const [key, value] of Object.entries(a.seed)) {
      const field = fieldByKey.get(key);
      if (!field) continue; // reported by validateStages
      if (field.kind === 'table' && Array.isArray(value)) {
        const cols = new Map((field.columns ?? []).map((c) => [c.columnId, c]));
        for (const row of value as Record<string, unknown>[]) {
          if (typeof row !== 'object' || row === null) continue;
          for (const [colId, cell] of Object.entries(row)) {
            const col = cols.get(colId);
            if (!col) {
              errors.push(`${a.activityId}: seeds "${key}" with unknown column "${colId}"`);
              continue;
            }
            if (col.kind === 'choice' && cell !== '' && cell != null) {
              const ok = (col.options ?? []).some((o) => o.value === cell);
              if (!ok) errors.push(`${a.activityId}: "${key}.${colId}" seeds unknown option "${String(cell)}"`);
            }
          }
        }
      }
      if (field.kind === 'choice' && typeof value === 'string' && value !== '') {
        if (!(field.options ?? []).some((o) => o.value === value)) {
          errors.push(`${a.activityId}: "${key}" seeds unknown option "${value}"`);
        }
      }
      if (field.kind === 'multiChoice' && Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === 'string' && !(field.options ?? []).some((o) => o.value === v)) {
            errors.push(`${a.activityId}: "${key}" seeds unknown option "${v}"`);
          }
        }
      }
    }
  }
  return errors;
}

/**
 * Words that must never reach a user (owner standing rule, restated 2026-09-17
 * when the placeholder rows were removed). Checked over authored content so a
 * promise cannot arrive through a content ingest.
 */
const BANNED_PHRASES = [
  'coming soon',
  'in development',
  'will be added',
  'stay tuned',
  'future update',
  'launching soon',
];

export function findBannedCopy(stage: StageDef): string[] {
  const hits: string[] = [];
  const walk = (node: unknown, path: string): void => {
    if (typeof node === 'string') {
      const low = node.toLowerCase();
      for (const b of BANNED_PHRASES) if (low.includes(b)) hits.push(`${path}: "${b}"`);
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    }
  };
  walk(stage, stage.stageId);
  return hits;
}

/** Convenience for tests and the ingest path. */
export function isFieldAnswered(
  stageId: string,
  fieldId: string,
  values: Record<string, FieldValue>,
): boolean {
  return isAnswered(values[valueKey(stageId, fieldId)]);
}
