/**
 * Must-do H5: the pure rules of the /e/<token> page (no imports, so the node
 * tests load it directly). The fetch lives in employerPage.ts.
 */
export type EmployerPageKind = "employer" | "instructor";

export type EmployerPage = {
  name: string;
  kind: EmployerPageKind;
  /** Only an http(s) URL survives; anything else is dropped. */
  website: string | null;
  about: string | null;
  verifiedAt: string;
};

export type EmployerPageOutcome =
  | { status: "found"; page: EmployerPage }
  | { status: "notFound" }
  | { status: "error" };

export const EMPLOYER_PAGE_RPC = "employer_profile_public";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A well-formed token, or null. A malformed one never reaches the server. */
export function cleanToken(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  return UUID_RE.test(t) ? t.toLowerCase() : null;
}

/**
 * The website as a link we are willing to draw. The column is typed by the
 * applicant; a `javascript:` or `data:` value must never become an href.
 * A bare host ("example.com") is read as https.
 */
export function safeWebsite(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** The website as people read it: no scheme, no trailing slash. */
export function websiteLabel(href: string): string {
  return href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/** "Verified since October 2026" — month and year, read in UTC so the
 *  server render and the browser agree. */
export function verifiedSinceLabel(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `Verified since ${month} ${d.getUTCFullYear()}`;
}

/** The badge words, by kind. */
export const EMPLOYER_PAGE_BADGE: Record<EmployerPageKind, string> = {
  employer: "Verified employer",
  instructor: "Verified instructor",
};

/**
 * One row from the RPC → a page, or null when it must not be shown.
 * Pure, so the rules are tested without a network.
 */
export function pageFromRow(row: unknown): EmployerPage | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const name = typeof r.company_name === "string" ? r.company_name.trim() : "";
  const verifiedAt = typeof r.verified_at === "string" ? r.verified_at : "";
  // Verified only. The RPC answers unverified rows too.
  if (!name || !verifiedAt || verifiedSinceLabel(verifiedAt) === null) return null;
  // Only the two kinds the server allows; anything else is not drawn with a badge.
  if (r.kind !== "employer" && r.kind !== "instructor") return null;
  const about = typeof r.about === "string" && r.about.trim() ? r.about.trim() : null;
  return { name, kind: r.kind, website: safeWebsite(r.company_website), about, verifiedAt };
}
