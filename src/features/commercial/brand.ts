/**
 * brand — single source of truth for the company identity that appears on
 * SHARED calculator reports (owner spec 2026-08-06). Centralized so the ®
 * usage, full name, website and product line are approved/edited in ONE place
 * rather than sprinkled through the report code.
 */
export const BRAND = {
  /** Full display name — NEVER truncated in a report. */
  name: 'Pro Audio Training Academy',
  /** ® approved for report use. The owner authored the shared-report spec with
   *  the mark throughout, so it is approved here; flip to false to drop it
   *  everywhere the reports render (legal can veto in one place). */
  trademarkApproved: true,
  /** Company website — used exactly once per report, tappable where supported. */
  website: 'proaudiotrainingacademy.com',
  /** Restrained footer product line — the FREE glossary leads, as the public
   *  entry point into the product. */
  productLine: 'Free Audio Glossary • Audio Calculators • Interactive Learning',
  generatedWith: 'Generated with',
  /** Report-type labels (single calculator vs multi-calculator workflow). */
  calculatorLabel: 'Professional Audio Engineering Calculator',
  workflowLabel: 'Professional Audio Engineering Workflow',
} as const;

/** Company name carrying the ® mark when approved (never truncated). */
export function brandName(): string {
  return BRAND.trademarkApproved ? `${BRAND.name}®` : BRAND.name;
}
