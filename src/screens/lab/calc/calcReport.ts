/**
 * calcReport — the SHARED report layer for calculator/workflow results (owner
 * spec 2026-08-06). ONE place builds the recipient-facing report structure and
 * the plain-text rendering; the runner, the saved-results browser and the
 * standalone calculators all format through here instead of hand-assembling
 * their own strings.
 *
 * It NEVER calculates and NEVER re-formats numbers — callers pass values that
 * are already formatted by the existing calculator display rules. This layer
 * only arranges hierarchy, cleans recipient-facing language, and stamps
 * branding + a reference report id.
 */
import { BRAND, brandName, shareFooterLines } from '../../../features/commercial/brand';
import type { SavedRunSummary } from './workflowModel';

export type SharedReportValue = {
  id: string;
  label: string;
  /** Display string, unit already included (e.g. "84.3 dB SPL"). */
  formattedValue: string;
  unit?: string;
  /** Optional secondary detail (kept out of the main line). */
  detail?: string;
  /** For workflow results: the readable step that produced this value. */
  sourceStepName?: string;
};

export type SharedCalculatorReport = {
  reportId: string;
  reportType: 'calculator' | 'workflow';
  companyName: string; // brandName() — no ® (owner 2026-08-10)
  reportLabel: string; // "Professional Audio Engineering Calculator" | "…Workflow"
  title: string; // calculator or workflow name — never truncated
  subtitle?: string; // e.g. the specific function on a single calculator
  createdAt: string; // ISO
  createdAtDisplay: string; // "August 6, 2026 • 10:58 AM"
  primaryResult?: SharedReportValue;
  inputs: SharedReportValue[];
  results: SharedReportValue[];
  notes: string[];
  warnings: string[];
  /** Common footer content (shared across ALL share surfaces). Owner 2026-08-10:
   *  product line + tappable website only — NO "Generated with", NO trailing
   *  company wordmark. */
  footer: { lines: string[] };
};

// ---------------------------------------------------------------------------
// Date / report-id helpers  (app runtime — new Date() is fine here)
// ---------------------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** "August 6, 2026 • 10:58 AM" — a readable date+time, not a raw timestamp. */
export function formatReportDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} • ${h}:${pad(d.getMinutes())} ${ampm}`;
}

/** {prefix}-{yyyyMMdd}-{HHmmss}. Derived from the creation time, so reopening a
 *  saved result yields the SAME id, and a new run yields a new one. */
export function makeReportId(prefix: string, iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return `${prefix}-00000000-000000`;
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${prefix.toUpperCase()}-${date}-${time}`;
}

/** A short calculator prefix from an explicit override or a name fallback. */
export function reportPrefixFor(explicit: string | undefined, name: string): string {
  if (explicit && explicit.trim()) return explicit.trim().toUpperCase();
  const letters = name.replace(/[^A-Za-z]/g, '').toUpperCase();
  return (letters.slice(0, 4) || 'CALC');
}

// ---------------------------------------------------------------------------
// Language cleanup — strip internal annotations from recipient-facing text
// ---------------------------------------------------------------------------

const looksNumeric = (s: string) => /^[+\-(]?\s*[\d.]/.test(s.trim());

/** Drop the leading "N. " step number the runner prefixes onto step names. */
const stripStepNumber = (step: string) => step.replace(/^\s*\d+\.\s*/, '').trim();

/** A prior-step import (its source names a "(step N)") is really a RESULT
 *  flowing between steps, not a user input — keep it out of INPUTS. */
const isPriorStepImport = (source: string) => /\(step\s*\d+\)/i.test(source);

/** Split a long note into sentence bullets so it never becomes an unreadable
 *  paragraph — without changing wording. Short notes pass through unchanged. */
function toBullets(note: string): string[] {
  const n = note.trim();
  if (n.length <= 140) return [n];
  return n
    .split(/(?<=\.)\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Warnings = safety/validity/limitation; everything else is a note. */
const isWarningText = (s: string) =>
  /overrid|missing value|could not compute|cannot|invalid|unsafe|exceed|do not|never|must|caution|warning/i.test(s);

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function footer() {
  // The ONE shared footer — identical on glossary, calc, and measurement shares.
  return { lines: shareFooterLines() };
}

/** Build a report from a completed WORKFLOW summary (may be a single step). */
export function buildReportFromSummary(s: SavedRunSummary): SharedCalculatorReport {
  const distinctSteps = new Set<string>([
    ...s.inputs.map((i) => i.step),
    ...s.results.map((r) => r.step),
  ]);
  const isWorkflow = distinctSteps.size > 1;

  // INPUTS: user-provided values only (exclude prior-step imports — those are
  // results), deduped by label, no internal source noise in the main line.
  const seen = new Set<string>();
  const inputs: SharedReportValue[] = [];
  s.inputs.forEach((i, idx) => {
    if (isPriorStepImport(i.source)) return;
    const key = i.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const projectDetail = i.source && i.source !== 'Entered manually' ? i.source : undefined;
    inputs.push({
      id: `i${idx}`,
      label: i.label,
      formattedValue: i.unit ? `${i.value} ${i.unit}` : i.value,
      unit: i.unit || undefined,
      detail: projectDetail,
    });
  });

  const results: SharedReportValue[] = s.results.map((r, idx) => ({
    id: `r${idx}`,
    label: r.label,
    formattedValue: r.value,
    sourceStepName: isWorkflow ? stripStepNumber(r.step) : undefined,
  }));

  // PRIMARY = the last numeric result (the final answer of the sequence).
  const primaryResult = [...results].reverse().find((r) => looksNumeric(r.formattedValue));

  // NOTES vs WARNINGS. summary.warnings mixes both; user notes are always notes.
  const notes: string[] = [];
  const warnings: string[] = [];
  for (const w of s.warnings) {
    (isWarningText(w) ? warnings : notes).push(...toBullets(w));
  }
  if (s.notes) notes.push(...toBullets(s.notes));

  const prefix = isWorkflow ? 'WF' : reportPrefixFor(undefined, s.workflowName);
  return {
    reportId: makeReportId(prefix, s.completedAt),
    reportType: isWorkflow ? 'workflow' : 'calculator',
    companyName: brandName(),
    reportLabel: isWorkflow ? BRAND.workflowLabel : BRAND.calculatorLabel,
    title: s.workflowName,
    subtitle: s.projectName ? `Project · ${s.projectName}` : undefined,
    createdAt: s.completedAt,
    createdAtDisplay: formatReportDateTime(s.completedAt),
    primaryResult,
    inputs,
    results,
    notes,
    warnings,
    footer: footer(),
  };
}

/** Build a report from a SINGLE standalone calculator (values already formatted
 *  by the caller — this layer never computes or re-rounds). */
export function buildReportFromCalc(p: {
  workspaceName: string;
  functionName: string;
  reportPrefix?: string;
  /** Output label chosen as the headline result; falls back to first numeric. */
  primaryResultLabel?: string;
  inputs: { label: string; value: string; unit?: string; detail?: string }[];
  results: { label: string; formattedValue: string; isText?: boolean }[];
  notes?: string[];
  warnings?: string[];
  createdAtISO: string;
}): SharedCalculatorReport {
  const results: SharedReportValue[] = p.results.map((r, idx) => ({
    id: `r${idx}`,
    label: r.label,
    formattedValue: r.formattedValue,
  }));
  const numeric = results.filter((r, idx) => !p.results[idx].isText && looksNumeric(r.formattedValue));
  const primaryResult = p.primaryResultLabel
    ? numeric.find((r) => r.label === p.primaryResultLabel) ?? numeric[0]
    : numeric[0];

  const notes: string[] = [];
  const warnings: string[] = [];
  for (const n of p.notes ?? []) (isWarningText(n) ? warnings : notes).push(...toBullets(n));
  for (const w of p.warnings ?? []) warnings.push(...toBullets(w));

  return {
    reportId: makeReportId(reportPrefixFor(p.reportPrefix, p.workspaceName), p.createdAtISO),
    reportType: 'calculator',
    companyName: brandName(),
    reportLabel: BRAND.calculatorLabel,
    title: p.workspaceName,
    subtitle: p.functionName,
    createdAt: p.createdAtISO,
    createdAtDisplay: formatReportDateTime(p.createdAtISO),
    primaryResult,
    inputs: p.inputs.map((i, idx) => ({
      id: `i${idx}`,
      label: i.label,
      formattedValue: i.unit ? `${i.value} ${i.unit}` : i.value,
      unit: i.unit,
      detail: i.detail,
    })),
    results,
    notes,
    warnings,
    footer: footer(),
  };
}

// ---------------------------------------------------------------------------
// Plain-text rendering — Messages/Mail/Notes/Slack safe (no proportional tables)
// ---------------------------------------------------------------------------

const RULE = '────────────────────────';
const LEADER_WIDTH = 26;

/** "Label ........... value" — dot leaders that still read fine if a
 *  proportional font shifts the spacing (the dots still separate the two). */
function leaderLine(label: string, value: string): string {
  const base = `${label} `;
  const dots = base.length >= LEADER_WIDTH ? ' ' : '.'.repeat(LEADER_WIDTH - base.length);
  return `${base}${dots} ${value}`;
}

export function reportToText(r: SharedCalculatorReport): string {
  const L: string[] = [];
  // Header
  L.push(r.companyName.toUpperCase());
  L.push(r.reportLabel);
  L.push(r.title);
  if (r.subtitle) L.push(r.subtitle);
  L.push(r.createdAtDisplay);

  if (r.primaryResult) {
    L.push(RULE, 'PRIMARY RESULT', r.primaryResult.formattedValue);
  }

  if (r.inputs.length) {
    L.push(RULE, 'INPUTS');
    for (const i of r.inputs) {
      L.push(leaderLine(i.label, i.formattedValue));
      if (i.detail) L.push(`   ${i.detail}`);
    }
  }

  if (r.results.length) {
    L.push(RULE, 'RESULTS');
    for (const r2 of r.results) L.push(leaderLine(r2.label, r2.formattedValue));
  }

  if (r.notes.length) {
    L.push(RULE, 'NOTES');
    for (const n of r.notes) L.push(`• ${n}`);
  }
  if (r.warnings.length) {
    L.push(RULE, 'WARNINGS');
    for (const w of r.warnings) L.push(`• ${w}`);
  }

  // Footer — the ONE shared branding block (product line + website), NO trailing
  // company wordmark (owner 2026-08-10). Report ID kept as calc-only metadata.
  L.push(RULE);
  for (const line of r.footer.lines) L.push(line);
  L.push(`Report ID: ${r.reportId}`);

  return L.join('\n');
}

/** A one-line accessibility summary of a report (image preview label). */
export function reportAccessibilityLabel(r: SharedCalculatorReport): string {
  const primary = r.primaryResult ? `, primary result ${r.primaryResult.formattedValue}` : '';
  return `${r.reportLabel}: ${r.title}${primary}. ${r.inputs.length} inputs, ${r.results.length} results.`;
}
