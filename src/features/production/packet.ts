/**
 * production/packet — the Production Packet, and the Delivery Package.
 *
 * This is the payoff. Everything the user decided becomes a document they could
 * actually hand to a crew, with the gaps and the accepted conditions printed
 * rather than hidden. A plan that looks complete but is not is worse than an
 * obviously unfinished one, so the packet states its own readiness on page one.
 *
 * Two halves, kept apart on purpose:
 *   • buildPacketHtml() is PURE — no native modules, no React. It is what the
 *     tests exercise and what the on-screen preview renders.
 *   • exportPacketPdf() is the native path, behind the same honesty gate as
 *     certificatePdf: expo-print and expo-sharing are reached through
 *     optionalModule, and isPdfAvailable() lets a screen offer the control
 *     honestly instead of presenting a button that cannot work.
 */
import { optionalModule } from '../tools/capture/optionalModule';
import type { ProductionProject } from './types';
import { READINESS_LABEL, VERDICT_LABEL, valueKey } from './types';
import type { ResolvedStage, ResolvedField } from './schema';
import { STATUS_OPTIONS } from './schema';
import type { ReadinessReport } from './readiness';
import { localDay } from '../../lib/localDate';

type PrintLib = {
  printToFileAsync: (opts: { html: string; width?: number; height?: number; base64?: false }) => Promise<{ uri: string }>;
};
type SharingLib = {
  isAvailableAsync: () => Promise<boolean>;
  shareAsync: (url: string, opts?: { mimeType?: string; dialogTitle?: string; UTI?: string }) => Promise<void>;
};

let printCached: PrintLib | null | undefined;
let shareCached: SharingLib | null | undefined;
const printLib = (): PrintLib | null => {
  if (printCached === undefined) printCached = optionalModule<PrintLib>('expo-print');
  return printCached;
};
const shareLib = (): SharingLib | null => {
  if (shareCached === undefined) shareCached = optionalModule<SharingLib>('expo-sharing');
  return shareCached;
};

/** True when this build can actually produce and share a PDF. */
export function isPdfAvailable(): boolean {
  return printLib() != null && shareLib() != null;
}

/** US Letter portrait in PostScript points — expo-print's unit. */
const PAGE_W = 612;
const PAGE_H = 792;

// ── rendering helpers ────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Render one answer as the document should read it, never as raw JSON. */
export function renderValue(field: ResolvedField, raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') return '';
  if (field.kind === 'multiChoice' && Array.isArray(raw)) {
    const labels = raw.map((v) => field.options?.find((o) => o.value === v)?.label ?? String(v));
    return labels.join(', ');
  }
  if (field.kind === 'choice') {
    return field.options?.find((o) => o.value === raw)?.label ?? String(raw);
  }
  if (field.kind === 'table' && Array.isArray(raw)) {
    const rows = raw as Record<string, unknown>[];
    if (!rows.length) return '';
    const cols = field.columns ?? [];
    const head = cols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
    const body = rows
      .map((r) => `<tr>${cols.map((c) => `<td>${escapeHtml(String(r[c.columnId] ?? ''))}</td>`).join('')}</tr>`)
      .join('');
    return `<table class="grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }
  if (field.kind === 'number' && field.unit) return `${String(raw)} ${field.unit}`;
  if (field.kind === 'status') {
    const s = String(raw);
    return (STATUS_OPTIONS as readonly string[]).includes(s) ? s : s;
  }
  return String(raw);
}

/** Document-control block — every page of a real production document has one. */
export type DocControl = {
  projectName: string;
  revision: number;
  revisionDate: string;
  author: string;
  approvalStatus: string;
  distribution?: string;
  confidential?: boolean;
};

export function docControl(project: ProductionProject, report: ReadinessReport): DocControl {
  return {
    projectName: project.name,
    revision: project.revision,
    // LOCAL, not UTC (2026-09-18). `toISOString` converts first, so an evening
    // in the Americas stamped this revision block with TOMORROW'S date — on a
    // document handed to a paying client, whose revision history would then
    // read out of order against their own records.
    revisionDate: localDay(project.updatedAt),
    author: String(project.values[valueKey('define', 'project_lead')] ?? 'Unattributed'),
    approvalStatus: VERDICT_LABEL[project.lab][report.verdict],
  };
}

const CSS = `
  @page { margin: 42pt 46pt; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #15181d; font-size: 11pt; line-height: 1.45; }
  h1 { font-size: 19pt; margin: 0 0 2pt; letter-spacing: .2pt; }
  h2 { font-size: 13pt; margin: 20pt 0 6pt; padding-bottom: 3pt; border-bottom: 1px solid #c8ccd4; }
  h3 { font-size: 11pt; margin: 12pt 0 4pt; color: #3b424e; }
  .sub { color: #5a626f; margin: 0 0 14pt; }
  .ctl { width: 100%; border-collapse: collapse; margin: 0 0 16pt; font-size: 9pt; color: #3b424e; }
  .ctl td { border: 1px solid #c8ccd4; padding: 4pt 6pt; }
  .ctl .k { background: #f2f4f7; width: 88pt; font-weight: 600; }
  .verdict { padding: 9pt 11pt; border-radius: 4pt; margin: 0 0 14pt; font-weight: 600; }
  .v-ready { background: #e8f5ec; border: 1px solid #7bbf95; }
  .v-cond  { background: #fdf4e3; border: 1px solid #d9ae5a; }
  .v-not   { background: #fdeceb; border: 1px solid #d98080; }
  .f { margin: 0 0 9pt; }
  .f .lab { font-weight: 600; }
  .f .val { white-space: pre-wrap; }
  .f .empty { color: #8a919d; font-style: italic; }
  .na { color: #5a626f; font-style: italic; }
  table.grid { border-collapse: collapse; width: 100%; margin-top: 4pt; font-size: 9.5pt; }
  table.grid th, table.grid td { border: 1px solid #c8ccd4; padding: 3pt 5pt; text-align: left; }
  table.grid th { background: #f2f4f7; }
  .notice { border-left: 3px solid #6b7382; background: #f5f6f8; padding: 6pt 9pt; margin: 8pt 0; font-size: 9.5pt; }
  .notice.qualified { border-left-color: #b4452f; }
  .issues { margin: 0 0 4pt; padding: 0; list-style: none; }
  .issues li { border-left: 3px solid #d9ae5a; padding: 5pt 9pt; margin: 0 0 6pt; background: #fbfbfc; }
  .issues li.blocker { border-left-color: #c0392b; }
  .issues .t { font-weight: 600; }
  .issues .d { color: #3b424e; font-size: 10pt; }
  .cond { border-left: 3px solid #6b7382; background: #f5f6f8; padding: 6pt 9pt; margin: 0 0 6pt; font-size: 10pt; }
  .foot { margin-top: 22pt; padding-top: 7pt; border-top: 1px solid #c8ccd4; color: #6b7382; font-size: 8.5pt; }
`;

function controlTable(d: DocControl): string {
  const rows: [string, string][] = [
    ['Project', d.projectName],
    ['Revision', `${d.revision}`],
    ['Revision date', d.revisionDate],
    ['Prepared by', d.author],
    ['Status', d.approvalStatus],
  ];
  if (d.distribution) rows.push(['Distribution', d.distribution]);
  return `<table class="ctl">${rows
    .map(([k, v]) => `<tr><td class="k">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
    .join('')}</table>`;
}

export type PacketInput = {
  project: ProductionProject;
  stages: ResolvedStage[];
  report: ReadinessReport;
  /** Title on the cover. Defaults per lab. */
  title?: string;
};

/**
 * The whole packet as one offline HTML document.
 *
 * Pure: no native modules, no network, no React. The on-screen preview and the
 * PDF render the exact same string, so what the user reads is what they print.
 */
export function buildPacketHtml(input: PacketInput): string {
  const { project, stages, report } = input;
  const title = input.title ?? (project.lab === 'preprod' ? 'Production Packet' : 'Delivery Package');
  const d = docControl(project, report);

  const verdictClass =
    report.verdict === 'ready' ? 'v-ready' : report.verdict === 'ready_with_conditions' ? 'v-cond' : 'v-not';

  const parts: string[] = [];
  parts.push(`<h1>${escapeHtml(title)}</h1>`);
  parts.push(`<p class="sub">${escapeHtml(project.name)}</p>`);
  parts.push(controlTable(d));

  // Readiness first. A packet that hides its own gaps is the thing this lab
  // exists to prevent, so the verdict is page one, above the content.
  parts.push(
    `<div class="verdict ${verdictClass}">${escapeHtml(VERDICT_LABEL[project.lab][report.verdict])} — ` +
      `${report.answeredRequired} of ${report.totalRequired} required decisions made</div>`,
  );

  if (report.blockers.length) {
    parts.push('<h2>Must be resolved before proceeding</h2>');
    parts.push(
      `<ul class="issues">${report.blockers
        .map(
          (b) =>
            `<li class="blocker"><div class="t">${escapeHtml(b.title)}</div><div class="d">${escapeHtml(b.detail)}</div></li>`,
        )
        .join('')}</ul>`,
    );
  }

  if (report.acceptedBlockers.length) {
    parts.push('<h2>Accepted conditions</h2>');
    parts.push(
      report.acceptedBlockers
        .map((b) => {
          const a = b.accepted!;
          return `<div class="cond"><strong>${escapeHtml(b.title)}</strong><br/>Accepted by ${escapeHtml(
            a.acceptedBy,
          )} — ${escapeHtml(a.reason)}</div>`;
        })
        .join(''),
    );
  }

  for (const stage of stages) {
    const sr = report.stages.find((s) => s.stageId === stage.stageId);
    parts.push(`<h2>${stage.num}. ${escapeHtml(stage.title)}</h2>`);
    if (sr) {
      parts.push(
        `<p class="sub">${escapeHtml(READINESS_LABEL[sr.state])} — ${sr.answeredRequired} of ${sr.totalRequired} required decisions</p>`,
      );
    }
    for (const n of stage.notices) {
      parts.push(`<div class="notice ${n.kind}">${escapeHtml(n.text)}</div>`);
    }

    for (const section of stage.sections) {
      parts.push(`<h3>${escapeHtml(section.title)}</h3>`);
      for (const n of section.notices) {
        parts.push(`<div class="notice ${n.kind}">${escapeHtml(n.text)}</div>`);
      }
      for (const field of section.fields) {
        const key = valueKey(stage.stageId, field.fieldId);
        const na = project.na[key];
        const raw = project.values[key];
        let body: string;
        if (na && na.trim()) {
          body = `<span class="na">Not applicable — ${escapeHtml(na)}</span>`;
        } else {
          const rendered = renderValue(field, raw);
          body =
            rendered === ''
              ? `<span class="empty">${field.required ? 'Not decided — required' : 'Not decided'}</span>`
              : field.kind === 'table'
                ? rendered
                : `<span class="val">${escapeHtml(rendered)}</span>`;
        }
        parts.push(`<div class="f"><span class="lab">${escapeHtml(field.label)}:</span> ${body}</div>`);
      }
    }

    const issues = (sr?.findings ?? []).filter((f) => f.severity !== 'blocker');
    if (issues.length) {
      parts.push(
        `<ul class="issues">${issues
          .map((f) => `<li><div class="t">${escapeHtml(f.title)}</div><div class="d">${escapeHtml(f.detail)}</div></li>`)
          .join('')}</ul>`,
      );
    }
  }

  parts.push(
    `<div class="foot">${escapeHtml(project.name)} — revision ${d.revision}, ${escapeHtml(d.revisionDate)}. ` +
      'Prepared with the Pro Audio Training Academy production lab. This document records planning decisions; ' +
      'it is not legal advice, and rigging, electrical distribution and similar work must be approved by ' +
      'qualified personnel.</div>',
  );

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
    title,
  )}</title><style>${CSS}</style></head><body>${parts.join('\n')}</body></html>`;
}

export type PacketResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'needs_build' | 'no_share_target' | 'failed' };

/**
 * Render the packet to PDF and open the share sheet. Never throws.
 *
 * Returns a typed reason instead of a boolean so a screen can say "needs the
 * next app build" honestly rather than failing silently.
 */
export async function exportPacketPdf(input: PacketInput): Promise<PacketResult> {
  const print = printLib();
  const share = shareLib();
  if (!print || !share) return { ok: false, reason: 'needs_build' };
  try {
    const html = buildPacketHtml(input);
    const { uri } = await print.printToFileAsync({ html, width: PAGE_W, height: PAGE_H });
    if (!uri) return { ok: false, reason: 'failed' };
    if (!(await share.isAvailableAsync())) return { ok: false, reason: 'no_share_target' };
    await share.shareAsync(uri.startsWith('file://') ? uri : `file://${uri}`, {
      mimeType: 'application/pdf',
      dialogTitle: input.title ?? 'Production Packet',
      UTI: 'com.adobe.pdf',
    });
    return { ok: true, uri };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
