/**
 * glossaryShare — the model + PURE plain-text renderers for sharing glossary
 * terms (owner spec 2026-08-06, "Improve Glossary Sharing").
 *
 * This module NEVER fetches and NEVER rewrites a definition — the caller resolves
 * each term's stored fields into a GlossaryShareTerm and this file only arranges
 * them into the exact share formats. Mirrors the role calcReport.ts plays for the
 * calculator share, but glossary shares are deliberately more compact: no report
 * id, no "generated with" line — the glossary content stays the focus.
 *
 * Branding is restrained and comes from the single BRAND source of truth; the
 * old sign-off "— from the Pro Audio Training Academy glossary" is retired.
 */
import { BRAND, shareFooterLines, websiteUrl } from '../commercial/brand';

// --- Sections the user can include ------------------------------------------
export type ShareSections = {
  /** Technical definition, exactly as stored. Default ON. */
  definition: boolean;
  /** Related-term NAMES (never their definitions). Default ON. */
  relatedTerms: boolean;
  /** Plain-English rewrite. Default OFF. */
  plainEnglish: boolean;
  /** Purpose & application. Default OFF. */
  purpose: boolean;
  /** Common Mistakes — only ever populated for permitted (member) viewers, and
   *  off by default even then. */
  commonMistakes: boolean;
};

export const DEFAULT_SECTIONS: ShareSections = {
  definition: true,
  relatedTerms: true,
  plainEnglish: false,
  purpose: false,
  commonMistakes: false,
};

/** A single term already resolved to its shareable content by the caller. The
 *  caller is responsible for only supplying `commonMistakes` when the viewer is
 *  permitted to read them (academy entitlement) — this module trusts the input. */
export type GlossaryShareTerm = {
  term: string;
  /** Technical definition, verbatim. */
  definition: string | null;
  plainEnglish: string | null;
  /** purpose_function + practical_application, already joined. */
  purpose: string | null;
  /** Related-term names, verbatim. */
  relatedTerms: string[];
  /** Common-mistake bullets — empty unless permitted AND present. */
  commonMistakes: string[];
};

/** Above this many terms in one share, the UI warns the message will be long. */
export const LARGE_SHARE_THRESHOLD = 25;

// --- Brand strings (single source of truth) ---------------------------------
const COMPANY = BRAND.name; // "Pro Audio Training Academy" — no ® on shares (2026-08-10)
// Tappable full URL — the ONE canonical website string (always https://).
export const WEBSITE = websiteUrl();
export const GLOSSARY_TAGLINE = 'Free Professional Audio Glossary';
const SINGLE_SOURCE = `${COMPANY} Glossary`;
const MULTI_HEADER_LINE2 = 'Professional Audio Glossary';

// --- Heading casing ---------------------------------------------------------
// Term headings are upper-cased, but audio UNIT tokens keep their real casing —
// an uppercased "DB"/"KHZ" would be wrong in an audio glossary (spec examples
// show "−4.5 dB PAN LAW", not "−4.5 DB PAN LAW").
const UNIT_FIXUPS: Record<string, string> = {
  DB: 'dB',
  DBFS: 'dBFS',
  DBU: 'dBu',
  DBV: 'dBV',
  DBA: 'dBA',
  DBSPL: 'dBSPL',
  DBM: 'dBm',
  HZ: 'Hz',
  KHZ: 'kHz',
  MHZ: 'MHz',
};
export function termHeading(term: string): string {
  return term
    .toUpperCase()
    .replace(/\b(DBFS|DBSPL|DBU|DBV|DBA|DBM|DB|KHZ|MHZ|HZ)\b/g, (m) => UNIT_FIXUPS[m] ?? m);
}

/** Case-insensitive dedupe of related-term names, preserving first-seen order and
 *  dropping any name that is itself one of the shared terms. */
export function dedupeRelated(names: string[], excludeTerms: string[] = []): string[] {
  const excluded = new Set(excludeTerms.map((t) => t.trim().toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (excluded.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

// --- Rendering helpers ------------------------------------------------------
function bulletList(items: string[]): string[] {
  return items.map((s) => `• ${s}`);
}

/** The optional, labeled sections of one term (Plain English / Purpose / Common
 *  Mistakes) in a stable order. Definition and Related Terms are placed by the
 *  callers because their position differs between single and multi layouts. */
function optionalSections(t: GlossaryShareTerm, s: ShareSections): string[] {
  const L: string[] = [];
  if (s.plainEnglish && t.plainEnglish?.trim()) {
    L.push('', 'PLAIN ENGLISH', t.plainEnglish.trim());
  }
  if (s.purpose && t.purpose?.trim()) {
    L.push('', 'PURPOSE & APPLICATION', t.purpose.trim());
  }
  if (s.commonMistakes && t.commonMistakes.length) {
    L.push('', 'COMMON MISTAKES', ...bulletList(t.commonMistakes));
  }
  return L;
}

// --- Single-term text -------------------------------------------------------
export function singleTermText(t: GlossaryShareTerm, s: ShareSections): string {
  const L: string[] = [];
  L.push(termHeading(t.term));
  L.push(SINGLE_SOURCE);

  if (s.definition && t.definition?.trim()) {
    L.push('', t.definition.trim());
  }

  L.push(...optionalSections(t, s));

  if (s.relatedTerms) {
    const related = dedupeRelated(t.relatedTerms, [t.term]);
    if (related.length) L.push('', 'RELATED TERMS', ...bulletList(related));
  }

  // The ONE shared footer (owner 2026-08-10) — identical across glossary, calc
  // and measurement shares. NO trailing company wordmark (the source line at
  // the top already names us).
  L.push('', ...shareFooterLines());
  return L.join('\n');
}

// --- Multi-term text --------------------------------------------------------
export function multiTermText(terms: GlossaryShareTerm[], s: ShareSections): string {
  const L: string[] = [];
  // One company header — never repeated per term.
  L.push(COMPANY.toUpperCase(), MULTI_HEADER_LINE2);

  for (const t of terms) {
    L.push('', termHeading(t.term));
    if (s.definition && t.definition?.trim()) L.push(t.definition.trim());
    L.push(...optionalSections(t, s));
  }

  if (s.relatedTerms) {
    const union = terms.flatMap((t) => t.relatedTerms);
    const related = dedupeRelated(
      union,
      terms.map((t) => t.term),
    );
    if (related.length) L.push('', 'RELATED TERMS', ...bulletList(related));
  }

  L.push('', ...shareFooterLines());
  return L.join('\n');
}

/** Text for either shape, chosen by count. */
export function shareText(terms: GlossaryShareTerm[], s: ShareSections): string {
  return terms.length === 1 ? singleTermText(terms[0], s) : multiTermText(terms, s);
}
