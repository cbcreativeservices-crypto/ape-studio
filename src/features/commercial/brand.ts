/**
 * brand — single source of truth for the company identity that appears on ALL
 * outgoing SHARED content (calculator reports, glossary terms, saved
 * measurements — text and image cards alike). Owner 2026-08-10: every share
 * must carry the SAME header + footer branding — one theme, no per-surface
 * drift, and NO trailing company wordmark ("logo") at the end.
 *
 * Use `shareHeaderLines(subtitle)` + `shareFooterLines()` so every surface
 * renders the identical branding block; never hand-roll a header/footer.
 */
export const BRAND = {
  /** Full display name — NEVER truncated in a share. */
  name: 'Pro Audio Training Academy',
  /** ® on shared content. Owner 2026-08-10: DROPPED everywhere — clean wordmark,
   *  no registered mark on any share. Flip to true to re-add it in one place. */
  trademarkApproved: false,
  /** Company website — used exactly once per share, tappable where supported. */
  website: 'proaudiotrainingacademy.com',
  /** The common footer product line — the FREE glossary leads, as the public
   *  entry point into the product. Owner 2026-08-10: this is THE footer on every
   *  share surface. */
  productLine: 'Free Audio Glossary • Audio Calculators • Interactive Learning',
  /** Attribution lead-in for the footer credit line (owner 2026-08-10): every
   *  shared output carries "Generated with {brand}" so recipients see which app
   *  it came from — the credit/advertising rides along on every share. */
  generatedWith: 'Generated with',
  /** Report-type labels (single calculator vs multi-calculator workflow). */
  calculatorLabel: 'Professional Audio Engineering Calculator',
  workflowLabel: 'Professional Audio Engineering Workflow',
} as const;

/** Company name carrying the ® mark when approved (never truncated). */
export function brandName(): string {
  return BRAND.trademarkApproved ? `${BRAND.name}®` : BRAND.name;
}

/** Canonical tappable website — ALWAYS the https:// form (a bare domain isn't a
 *  live link in many messaging apps). The one website string for every share. */
export function websiteUrl(): string {
  return /^https?:\/\//i.test(BRAND.website) ? BRAND.website : `https://${BRAND.website}`;
}

/**
 * The ONE shared header identity for outgoing shares: the company name (caps,
 * no ®) followed by a surface-specific context subtitle
 * (e.g. "Professional Audio Glossary", a report label, "Saved Measurements").
 * Callers place their own content below this; the identity line is uniform.
 */
export function shareHeaderLines(subtitle: string): string[] {
  const L = [brandName().toUpperCase()];
  if (subtitle) L.push(subtitle);
  return L;
}

/**
 * The ONE shared footer for EVERY outgoing share (owner 2026-08-10): a
 * "Generated with {brand}" CREDIT line (the app's attribution/advertising — it
 * rides along on every share so recipients see where it came from), then the
 * product line, then the tappable website. This credit line is NOT the old
 * trailing wordmark the owner removed — that was a bare, redundant company name;
 * this is a framed attribution. Callers render their own separator rule above.
 */
export function shareFooterLines(): string[] {
  return [`${BRAND.generatedWith} ${brandName()}`, BRAND.productLine, websiteUrl()];
}
