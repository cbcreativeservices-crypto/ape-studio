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
import { LAUNCH_PATHWAYS, isAnswered, valueKey } from './types';

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
 * A condition on another field's answer.
 *
 * Deliberately not a general expression language: a `field` plus a list of
 * values is enough for every case the labs have, and it stays readable in the
 * content files where it is authored.
 *
 * ── THE RULES OF THE CONDITION (2026-10-04, design review #1 completed) ──────
 *
 *   • The controlling field must be a `choice`, `multiChoice` or `status`
 *     field, and every value named here must be one of its options. A typo in
 *     a value would otherwise never match and silently never hide anything —
 *     `validateStage` refuses it instead.
 *   • `field` is a `fieldId` in this stage, or `stageId.fieldId` for a field in
 *     another stage of the same lab ("only if mixing is in scope" is answered in
 *     stage 1 and asked about in stage 3).
 *   • An UNANSWERED controller shows the field (unknown is visible).
 *   • A HIDDEN controller hides its dependants: a question about an answer
 *     nobody was asked for does not apply either.
 *   • `equals` shows the field when ANY selected answer is listed.
 *   • `notEquals` hides it when EVERY selected answer is listed — for a single
 *     choice that is simply "the answer is one of these"; for a multi-choice it
 *     means "none" ticked on its own hides, while "none" ticked beside a real
 *     answer (a contradiction) keeps the question in view.
 *   • A hidden field keeps its stored answer. It is not evaluated — no rule,
 *     no score, no packet line reads it — and it comes back, answer intact, the
 *     moment the controlling answer changes.
 */
export type ShowWhen = {
  /** `fieldId` in this stage, or `stageId.fieldId` in another stage of the lab. */
  field: string;
  /** Show when any selected answer is one of these. */
  equals?: string[];
  /** Hide when every selected answer is one of these. */
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
  /** Questions in this section hidden by an earlier answer (they come back
   *  with their answers if that answer changes). Drives the screen's note. */
  hiddenCount?: number;
  /** Which answered question hid them, and with which answer — one entry per
   *  controlling question, in field order. Absent when it cannot be named
   *  (a stage resolved on its own whose condition names another stage). */
  hiddenBecause?: HiddenBecause[];
};

export type ResolvedStage = Omit<StageDef, 'sections' | 'rules' | 'notices'> & {
  sections: ResolvedSection[];
  rules: RuleDef[];
  notices: NoticeDef[];
  /**
   * Value keys (`stageId.fieldId`) of this stage's fields that `showWhen` hid.
   * Rules and readiness read this so a hidden field is never evaluated: it
   * never blocks, never scores, and its stored answer is never read.
   * Fields absent because of the PATHWAY are not listed — they were never part
   * of this project at all.
   */
  hidden?: string[];
};

function resolveRequired(req: FieldDef['required'], p: PathwayId): boolean {
  if (req === undefined) return false;
  if (typeof req === 'boolean') return req;
  return req[p] ?? false;
}

/** The value key a `showWhen` names, from the stage it is written in. */
export function showWhenKey(stageId: string, ref: string): string {
  return ref.includes('.') ? ref : valueKey(stageId, ref);
}

/**
 * Does this answer satisfy the condition? Pure value test — whether the
 * controller is itself hidden is decided by the caller.
 *
 * UNKNOWN IS VISIBLE. When the controlling field has not been answered yet, the
 * condition cannot be evaluated and the dependent field SHOWS. Hiding on
 * unknown would mean a fresh project opens with half its questions missing and
 * no way to discover them — the opposite of the point.
 */
function answerPasses(rule: ShowWhen, raw: FieldValue | undefined): boolean {
  if (!isAnswered(raw)) return true;
  const answers = (Array.isArray(raw) ? raw : [raw])
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.toLowerCase());
  if (answers.length === 0) return true;
  if (rule.equals && !rule.equals.some((e) => answers.includes(e.toLowerCase()))) return false;
  if (rule.notEquals) {
    const not = rule.notEquals.map((e) => e.toLowerCase());
    if (answers.every((a) => not.includes(a))) return false;
  }
  return true;
}

/**
 * Every value key `showWhen` hides, across `stages`, for one pathway and one
 * set of answers.
 *
 * Pass the WHOLE LAB when you have it: a condition can name a field in another
 * stage, and a hidden controller hides its dependants, which can only be known
 * with the controller's own stage in hand. Given a single stage, a condition
 * naming another stage is still tested against its stored answer.
 *
 * With no `values` nothing is hidden (previews and tests resolve everything).
 */
export function hiddenKeys(stages: StageDef[], pathway: PathwayId, values: ValueMap | undefined): Set<string> {
  return new Set(hiddenReasons(stages, pathway, values).keys());
}

/**
 * As `hiddenKeys`, with WHY: each hidden value key → the key of the answered
 * question that hid it. For a chain (a question hidden because its own
 * controller is hidden) that is the root — the answer the learner actually
 * gave, which is the one they can change to bring the question back
 * (2026-10-04, owner ruling: the note names the question and the answer).
 */
export function hiddenReasons(stages: StageDef[], pathway: PathwayId, values: ValueMap | undefined): Map<string, string> {
  const because = new Map<string, string>();
  if (!values) return because;
  type Node = { stageId: string; field: FieldDef; section: SectionDef };
  const nodes = new Map<string, Node>();
  for (const st of stages) {
    for (const sec of st.sections) {
      if (!appliesTo(sec.onlyFor, pathway)) continue;
      for (const f of sec.fields) {
        if (!appliesTo(f.onlyFor, pathway)) continue;
        nodes.set(valueKey(st.stageId, f.fieldId), { stageId: st.stageId, field: f, section: sec });
      }
    }
  }
  const memo = new Map<string, boolean>();
  const visiting = new Set<string>();
  /** null when the condition passes; otherwise the key of the answer that hid it. */
  const blockedBy = (rule: ShowWhen | undefined, stageId: string): string | null => {
    if (!rule) return null;
    const ck = showWhenKey(stageId, rule.field);
    // A hidden controller hides its dependants — for the controller's reason.
    if (nodes.has(ck) && !visible(ck)) return because.get(ck) ?? ck;
    return answerPasses(rule, values[ck]) ? null : ck;
  };
  const visible = (key: string): boolean => {
    const known = memo.get(key);
    if (known !== undefined) return known;
    const n = nodes.get(key);
    if (!n) return true;
    // A cycle is refused by validateStage/validateStages; at run time it must
    // never hide anything, so a field met again mid-walk reads as visible.
    if (visiting.has(key)) return true;
    visiting.add(key);
    const why = blockedBy(n.section.showWhen, n.stageId) ?? blockedBy(n.field.showWhen, n.stageId);
    visiting.delete(key);
    if (why !== null) because.set(key, why);
    memo.set(key, why === null);
    return why === null;
  };
  for (const key of nodes.keys()) visible(key);
  // Insertion order follows the walk; keep the authored field order instead.
  return new Map([...nodes.keys()].filter((k) => because.has(k)).map((k) => [k, because.get(k)!]));
}

/**
 * Why some questions in a section are hidden: the question that was answered,
 * the answer given, and how many questions it hid. `stageNum` is set only when
 * that question lives in another stage.
 */
export type HiddenBecause = { count: number; question: string; answer: string; stageNum?: number };

/**
 * The note under a section with hidden questions (2026-10-04, owner ruling:
 * "Hidden because you answered 'No' to 'Will anything be flown?'"). Naming the
 * question and the answer turns a vanished question into a lesson about the
 * decision that removed it — and tells the learner which answer brings it back.
 */
export function hiddenNoteText(r: HiddenBecause): string {
  const where = r.stageNum !== undefined ? ` in stage ${r.stageNum}` : '';
  const q = `“${r.question}”${where}`;
  const stop = where || !/[?.!]$/.test(r.question) ? '.' : '';
  return r.count === 1
    ? `One question is hidden because you answered “${r.answer}” to ${q}${stop} If that answer changes, it comes back with anything you wrote in it.`
    : `${r.count} questions are hidden because you answered “${r.answer}” to ${q}${stop} If that answer changes, they come back with anything you wrote in them.`;
}

/** Every hidden key across already-resolved stages (the lab-wide set rules read). */
export function labHiddenKeys(stages: ResolvedStage[]): Set<string> {
  const out = new Set<string>();
  for (const s of stages) for (const k of s.hidden ?? []) out.add(k);
  return out;
}

/**
 * Collapse a stage for one pathway: drop what does not apply, apply the wording
 * overrides, and settle required-ness. Screens only ever see the result, which
 * is why they contain no pathway logic at all.
 *
 * `lab` (optional) is every stage of the lab, so a condition naming another
 * stage — and a chain of conditions — resolves exactly as it does on the lab
 * home. Screens pass it; `resolveLab` does it for a whole lab at once.
 */
export function resolveStage(stage: StageDef, pathway: PathwayId, values?: ValueMap, lab?: StageDef[]): ResolvedStage {
  const stages = lab ?? [stage];
  return resolveWith(stage, pathway, hiddenReasons(stages, pathway, values), describer(stages, pathway, values));
}

/** Resolve a whole lab against one set of answers (one visibility pass). */
export function resolveLab(stages: StageDef[], pathway: PathwayId, values?: ValueMap): ResolvedStage[] {
  const hidden = hiddenReasons(stages, pathway, values);
  const describe = describer(stages, pathway, values);
  return stages.map((s) => resolveWith(s, pathway, hidden, describe));
}

/** Names a controlling question and the answer it holds, for the hidden note. */
type Describe = (controllerKey: string, fromStageId: string) => Omit<HiddenBecause, 'count'> | null;

function describer(stages: StageDef[], pathway: PathwayId, values: ValueMap | undefined): Describe {
  const byKey = new Map<string, { field: FieldDef; stageId: string; stageNum: number }>();
  for (const st of stages) {
    for (const sec of st.sections) for (const f of sec.fields) byKey.set(valueKey(st.stageId, f.fieldId), { field: f, stageId: st.stageId, stageNum: st.num });
  }
  return (ck, from) => {
    const n = byKey.get(ck);
    if (!n || !values) return null;
    const raw = values[ck];
    const picked = (Array.isArray(raw) ? raw : [raw]).filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    if (!picked.length) return null;
    const answer = picked
      .map((v) => (n.field.kind === 'status' ? v : n.field.options?.find((o) => o.value === v)?.label ?? v))
      .join(', ');
    return {
      question: n.field.labelBy?.[pathway] ?? n.field.label,
      answer,
      ...(n.stageId !== from ? { stageNum: n.stageNum } : {}),
    };
  };
}

function resolveWith(stage: StageDef, pathway: PathwayId, hiddenMap: Map<string, string>, describe: Describe): ResolvedStage {
  const sections: ResolvedSection[] = [];
  const hidden: string[] = [];
  for (const s of stage.sections) {
    if (!appliesTo(s.onlyFor, pathway)) continue;
    const fields: ResolvedField[] = [];
    let hiddenCount = 0;
    /** controller key → how many of this section's questions it hid, in order. */
    const byController = new Map<string, number>();
    for (const f of s.fields) {
      if (!appliesTo(f.onlyFor, pathway)) continue;
      const key = valueKey(stage.stageId, f.fieldId);
      const why = hiddenMap.get(key);
      if (why !== undefined) {
        hidden.push(key);
        hiddenCount++;
        byController.set(why, (byController.get(why) ?? 0) + 1);
        continue;
      }
      const { required, labelBy, helpBy, onlyFor, ...rest } = f;
      fields.push({
        ...rest,
        label: labelBy?.[pathway] ?? f.label,
        help: helpBy?.[pathway] ?? f.help,
        required: resolveRequired(required, pathway),
        allowNa: f.allowNa !== false,
      });
    }
    // A section whose own condition hid every field it has on this pathway is
    // not drawn at all (its notices go with it).
    if (s.showWhen && fields.length === 0 && hiddenCount > 0) continue;
    // Name every controlling answer, or none (the screen then says it plainly
    // without naming one) — never a note that explains only some of them.
    const reasons = [...byController].map(([ck, count]) => {
      const d = describe(ck, stage.stageId);
      return d ? { count, ...d } : null;
    });
    const hiddenBecause = reasons.length && reasons.every((r) => r !== null) ? (reasons as HiddenBecause[]) : undefined;
    sections.push({
      sectionId: s.sectionId,
      title: s.title,
      intro: s.intro,
      fields,
      notices: (s.notices ?? []).filter((n) => appliesTo(n.onlyFor, pathway)),
      hiddenCount,
      ...(hiddenBecause ? { hiddenBecause } : {}),
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
    hidden,
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

  // ── showWhen (2026-10-04) ────────────────────────────────────────────────
  // Same-stage references are checked here; a reference into another stage is
  // checked by validateStages, which can see the whole lab.
  const byId = new Map<string, FieldDef>();
  for (const s of stage.sections) for (const f of s.fields) byId.set(f.fieldId, f);
  for (const s of stage.sections) {
    const own = (fid: string) => s.fields.some((f) => f.fieldId === fid);
    if (s.showWhen) {
      const at = `${stage.stageId}.[${s.sectionId}]`;
      const local = localRef(stage.stageId, s.showWhen.field);
      if (local !== null) {
        errors.push(...checkShowWhen(at, s.showWhen, byId.get(local)));
        if (own(local)) errors.push(`${at}: showWhen is controlled by "${local}", a field inside the section it hides`);
      } else errors.push(...checkShowWhenShape(at, s.showWhen));
    }
    for (const f of s.fields) {
      if (!f.showWhen) continue;
      const at = `${stage.stageId}.${f.fieldId}`;
      const local = localRef(stage.stageId, f.showWhen.field);
      if (local === f.fieldId) {
        errors.push(`${at}: showWhen names the field itself`);
        continue;
      }
      if (local !== null) errors.push(...checkShowWhen(at, f.showWhen, byId.get(local)));
      else errors.push(...checkShowWhenShape(at, f.showWhen));
    }
  }
  for (const cycle of showWhenCycles([stage])) errors.push(`showWhen cycle: ${cycle}`);

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

/** The fieldId a reference names in `stageId`, or null when it names another stage. */
function localRef(stageId: string, ref: string): string | null {
  if (!ref.includes('.')) return ref;
  const [sid, fid] = ref.split('.');
  return sid === stageId ? fid : null;
}

/** The shape every condition needs, whatever it points at. */
function checkShowWhenShape(at: string, rule: ShowWhen): string[] {
  const errors: string[] = [];
  if (!rule.field) errors.push(`${at}: showWhen names no field`);
  if (!(rule.equals?.length || rule.notEquals?.length)) {
    errors.push(`${at}: showWhen needs "equals" or "notEquals" values`);
  }
  return errors;
}

/**
 * A condition against its controlling field: the field must exist, must be a
 * field with a fixed set of answers, and every value named must be one of
 * them. A misspelt value would never match, so the field would silently never
 * hide (or, under `equals`, never show).
 */
function checkShowWhen(at: string, rule: ShowWhen, controller: FieldDef | undefined): string[] {
  const errors = checkShowWhenShape(at, rule);
  if (!controller) {
    errors.push(`${at}: showWhen names "${rule.field}", which does not exist`);
    return errors;
  }
  const kinds: FieldKind[] = ['choice', 'multiChoice', 'status'];
  if (!kinds.includes(controller.kind)) {
    errors.push(`${at}: showWhen is controlled by "${rule.field}", a ${controller.kind} field — it must be choice, multiChoice or status`);
    return errors;
  }
  const allowed = (
    controller.kind === 'status' ? [...STATUS_OPTIONS] : (controller.options ?? []).map((o) => o.value)
  ).map((v) => v.toLowerCase());
  for (const v of [...(rule.equals ?? []), ...(rule.notEquals ?? [])]) {
    if (!allowed.includes(v.toLowerCase())) errors.push(`${at}: showWhen value "${v}" is not an option of "${rule.field}"`);
  }
  return errors;
}

/**
 * Cycles in the visibility graph (field → its controller; a section's fields →
 * the section's controller). Each cycle is reported once, as a path. A cycle
 * would leave a field whose visibility depends on itself.
 */
function showWhenCycles(stages: StageDef[]): string[] {
  const edges = new Map<string, string[]>();
  const add = (from: string, to: string) => edges.set(from, [...(edges.get(from) ?? []), to]);
  for (const st of stages) {
    for (const sec of st.sections) {
      for (const f of sec.fields) {
        const k = valueKey(st.stageId, f.fieldId);
        if (f.showWhen?.field) add(k, showWhenKey(st.stageId, f.showWhen.field));
        if (sec.showWhen?.field) add(k, showWhenKey(st.stageId, sec.showWhen.field));
      }
    }
  }
  const out: string[] = [];
  const seen = new Set<string>();
  const state = new Map<string, 'open' | 'done'>();
  const walk = (k: string, path: string[]) => {
    const s = state.get(k);
    if (s === 'done') return;
    if (s === 'open') {
      const loop = [...path.slice(path.indexOf(k)), k];
      const id = [...loop].slice(0, -1).sort().join('|');
      if (!seen.has(id)) {
        seen.add(id);
        out.push(loop.join(' → '));
      }
      return;
    }
    state.set(k, 'open');
    for (const next of edges.get(k) ?? []) walk(next, [...path, k]);
    state.set(k, 'done');
  };
  for (const k of edges.keys()) walk(k, []);
  return out;
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

  // showWhen that reaches into ANOTHER stage (same-stage ones are checked by
  // validateStage). An unknown stage is as much an error as an unknown field:
  // a condition that names nothing would never hide anything.
  const fieldByKey = new Map<string, FieldDef>();
  for (const s of stages) for (const sec of s.sections) for (const f of sec.fields) fieldByKey.set(`${s.stageId}.${f.fieldId}`, f);
  for (const s of stages) {
    for (const sec of s.sections) {
      const conds: [string, ShowWhen | undefined][] = [
        [`${s.stageId}.[${sec.sectionId}]`, sec.showWhen],
        ...sec.fields.map((f) => [`${s.stageId}.${f.fieldId}`, f.showWhen] as [string, ShowWhen | undefined]),
      ];
      for (const [at, rule] of conds) {
        if (!rule || localRef(s.stageId, rule.field) !== null) continue;
        errors.push(...checkShowWhen(at, rule, fieldByKey.get(rule.field)).filter((e) => !e.includes('needs "equals"') && !e.includes('names no field')));
      }
    }
  }
  // Cycles that cross stages (a single-stage cycle is already reported above).
  for (const cycle of showWhenCycles(stages)) {
    const sids = new Set(cycle.split(' → ').map((k) => k.split('.')[0]));
    if (sids.size > 1) errors.push(`showWhen cycle: ${cycle}`);
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
    // An exercise must not hide what it seeded: the learner is sent to repair
    // a value they would then never see (2026-10-04, showWhen).
    for (const pw of a.onlyFor ?? LAUNCH_PATHWAYS) {
      const hidden = hiddenKeys(stages, pw, a.seed as ValueMap);
      for (const key of Object.keys(a.seed)) {
        if (hidden.has(key)) errors.push(`${a.activityId} (${pw}): seeds "${key}", which its own seed hides`);
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
