/**
 * Engine — the connection evaluator, the assessment draw/score logic, and
 * the data validator (all pure; pinned by test/connectorSelect.test.ts).
 */
import type { CableChoice, ProblemKind, Scenario } from '../data/scenarios.ts';
import { PROBLEM_LABELS, SCENARIOS } from '../data/scenarios.ts';
import { ASSESSMENT_BANK, DRAW_MINIMUMS, DRAW_SIZE, PASS_PCT, type AsmtQuestion } from '../data/assessment.ts';
import { JOB_MATRIX } from '../data/jobs.ts';
import { ROSTER } from '../data/roster.ts';
import { FAULTS } from './tester.ts';
import { MISCONCEPTIONS, SAFETY_RULES } from '../data/practice.ts';
import { getConnector } from '../../cable/data/registry.ts';
import { hasConnectorImage } from '../../cable/connectorImages.ts';

// ── the four-question verdict (Station 5) ───────────────────────────────────

/** Which of the four questions each problem kind fails. `overall` is false
 *  for every non-correct verdict — including fits_but_verify, where the
 *  honest answer to "is this the right cable?" is "you don't know yet". */
export type Verdict = {
  fit: boolean;
  signal: boolean;
  construction: boolean;
  safe: boolean;
  overall: boolean;
  /** fits_but_verify: rows 2–4 are UNKNOWN, not passed — the UI renders
   *  them as amber "?" so the app never claims what it teaches you not to
   *  claim (cognition pass round 1). */
  unverified?: boolean;
  problem?: ProblemKind;
  label: string;
  explain: string;
};

const FAILS: Record<ProblemKind, { fit?: boolean; signal?: boolean; construction?: boolean; safe?: boolean }> = {
  no_fit: { fit: false },
  wrong_level: { signal: false },
  wrong_construction: { construction: false },
  bal_unbal: { signal: false, construction: false },
  protocol: { signal: false },
  speaker_into_input: { signal: false, safe: false },
  outputs_combined: { signal: false, safe: false },
  fits_but_verify: {}, // every check "passes"… which is exactly the trap
};

export function evaluateChoice(choice: CableChoice): Verdict {
  if (choice.verdict === 'correct') {
    return { fit: true, signal: true, construction: true, safe: true, overall: true, label: 'CORRECT CABLE', explain: choice.explain };
  }
  const f = FAILS[choice.verdict];
  const o = choice.rowsOverride ?? {};
  return {
    fit: o.fit ?? f.fit !== false,
    signal: o.signal ?? f.signal !== false,
    construction: o.construction ?? f.construction !== false,
    safe: o.safe ?? f.safe !== false,
    overall: false,
    unverified: choice.verdict === 'fits_but_verify',
    problem: choice.verdict,
    label: PROBLEM_LABELS[choice.verdict],
    explain: choice.explain,
  };
}

// ── assessment draw + scoring ───────────────────────────────────────────────

export type Rng = () => number; // [0,1) — injected so tests can be deterministic

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Draw a paper honoring the composition minimums, then top up randomly.
 *  EVERY safety-critical question is force-included first — without this,
 *  ~2.5% of random draws carried no critical question at all and the
 *  "every safety-critical call must be right" pass rule was vacuous
 *  (cognition pass round 1; mirrors the cable lab's structural
 *  SAFETY_UNITS approach). Returns questions in shuffled order (option
 *  order is shuffled by the UnderstandingCheck idiom at render time). */
export function drawAssessment(rng: Rng): AsmtQuestion[] {
  const byKind = new Map<string, AsmtQuestion[]>();
  for (const q of ASSESSMENT_BANK) {
    byKind.set(q.kind, [...(byKind.get(q.kind) ?? []), q]);
  }
  const picked: AsmtQuestion[] = [];
  const taken = new Set<string>();
  for (const q of ASSESSMENT_BANK.filter((x) => x.critical)) {
    picked.push(q);
    taken.add(q.id);
  }
  for (const [kind, min] of Object.entries(DRAW_MINIMUMS)) {
    const already = picked.filter((q) => q.kind === kind).length;
    const pool = shuffle((byKind.get(kind) ?? []).filter((q) => !taken.has(q.id)), rng);
    for (const q of pool.slice(0, Math.max(0, (min ?? 0) - already))) {
      picked.push(q);
      taken.add(q.id);
    }
  }
  const rest = shuffle(
    ASSESSMENT_BANK.filter((q) => !taken.has(q.id)),
    rng,
  );
  for (const q of rest) {
    if (picked.length >= DRAW_SIZE) break;
    picked.push(q);
  }
  return shuffle(picked, rng);
}

export type AsmtResult = {
  total: number;
  right: number;
  pct: number;
  /** Safety-critical questions answered wrongly (ids). Pass requires none. */
  criticalMisses: string[];
  passed: boolean;
};

export function scoreAssessment(paper: readonly AsmtQuestion[], answers: ReadonlyMap<string, number>): AsmtResult {
  let right = 0;
  const criticalMisses: string[] = [];
  for (const q of paper) {
    const a = answers.get(q.id);
    const ok = a === q.correct;
    if (ok) right += 1;
    else if (q.critical) criticalMisses.push(q.id);
  }
  const pct = paper.length ? Math.round((right / paper.length) * 100) : 0;
  return { total: paper.length, right, pct, criticalMisses, passed: pct >= PASS_PCT && criticalMisses.length === 0 };
}

// ── data validation (run by the test suite; also cheap enough for __DEV__) ──

/** Returns human-readable problems; empty = valid. Covers the brief's
 *  required checks: duplicate ids, missing fields, invalid references —
 *  plus this lab's honesty invariants. */
export function validateSelectionData(): string[] {
  const errors: string[] = [];
  const dup = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${label}: duplicate id '${id}'`);
      seen.add(id);
    }
  };

  // Roster: unique, resolvable, photographed.
  dup('roster', [...ROSTER]);
  for (const id of ROSTER) {
    const rec = getConnector(id);
    if (!rec) errors.push(`roster: '${id}' has no verified ConnectorRecord`);
    if (!hasConnectorImage(id)) errors.push(`roster: '${id}' has no image in the verified image map`);
  }

  // Jobs: connectors on the roster; every can:true claim backed by carried
  // types actually present on the record (or its family siblings).
  dup('jobs', JOB_MATRIX.map((j) => j.connector));
  for (const entry of JOB_MATRIX) {
    const family = [entry.connector, ...(entry.alsoFrom ?? [])];
    const carried = new Set(family.flatMap((id) => getConnector(id)?.carried ?? []));
    if (!ROSTER.includes(entry.connector)) errors.push(`jobs: '${entry.connector}' not on the roster`);
    dup(`jobs '${entry.connector}'`, entry.jobs.map((j) => j.id));
    for (const job of entry.jobs) {
      if (job.can) {
        if (!job.backs?.length && !job.basis?.trim()) errors.push(`jobs '${entry.connector}/${job.id}': can:true without backing carried types or a cited basis`);
        for (const c of job.backs ?? []) {
          if (!carried.has(c)) errors.push(`jobs '${entry.connector}/${job.id}': claims '${c}' the verified record(s) do not carry`);
        }
      }
    }
  }

  // Scenarios: unique ids, exactly one correct, connectors resolvable,
  // every ProblemKind used at least once across the set.
  dup('scenarios', SCENARIOS.map((s) => s.id));
  const kindsUsed = new Set<ProblemKind>();
  for (const s of SCENARIOS) {
    dup(`scenario '${s.id}' choices`, s.choices.map((c) => c.id));
    const correct = s.choices.filter((c) => c.verdict === 'correct');
    if (correct.length !== 1) errors.push(`scenario '${s.id}': ${correct.length} correct choices (must be exactly 1)`);
    for (const c of s.choices) {
      if (!getConnector(c.a)) errors.push(`scenario '${s.id}/${c.id}': unknown connector '${c.a}'`);
      if (!getConnector(c.b)) errors.push(`scenario '${s.id}/${c.id}': unknown connector '${c.b}'`);
      if (c.verdict !== 'correct') kindsUsed.add(c.verdict);
    }
  }
  for (const k of Object.keys(PROBLEM_LABELS) as ProblemKind[]) {
    if (!kindsUsed.has(k)) errors.push(`scenarios: problem kind '${k}' never exercised`);
  }

  // Faults: unique, correct index in range, link tables sized to the kind.
  dup('faults', FAULTS.map((f) => f.id));
  for (const f of FAULTS) {
    if (f.correct < 0 || f.correct >= f.options.length) errors.push(`fault '${f.id}': correct index out of range`);
  }

  // Assessment: unique ids, correct in range, wrong[] aligned, minimums met
  // by the bank itself, ≥2 critical safety questions available.
  dup('assessment', ASSESSMENT_BANK.map((q) => q.id));
  for (const q of ASSESSMENT_BANK) {
    if (q.correct < 0 || q.correct >= q.options.length) errors.push(`assessment '${q.id}': correct index out of range`);
    if (q.wrong.length !== q.options.length) errors.push(`assessment '${q.id}': wrong[] not aligned to options`);
    if (q.wrong[q.correct] !== undefined) errors.push(`assessment '${q.id}': wrong[] entry present at the correct index`);
    if (q.image && !hasConnectorImage(q.image)) errors.push(`assessment '${q.id}': image connector unmapped`);
  }
  for (const [kind, min] of Object.entries(DRAW_MINIMUMS)) {
    const n = ASSESSMENT_BANK.filter((q) => q.kind === kind).length;
    if (n < (min ?? 0)) errors.push(`assessment: bank has ${n} '${kind}' questions, minimum draw needs ${min}`);
  }
  if (ASSESSMENT_BANK.filter((q) => q.critical).length < 2) errors.push('assessment: fewer than 2 safety-critical questions in the bank');
  if (ASSESSMENT_BANK.length < DRAW_SIZE) errors.push('assessment: bank smaller than the draw size');

  // Practice decks.
  dup('misconceptions', MISCONCEPTIONS.map((m) => m.id));
  dup('safety rules', SAFETY_RULES.map((r) => r.id));

  return errors;
}
