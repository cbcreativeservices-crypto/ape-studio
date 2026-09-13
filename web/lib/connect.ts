/**
 * /connect — private welcome for people Booth has handed a card.
 * One page. Unlisted: no Nav, Footer, or sitemap. noindex.
 * Preview-gate allowlist; visiting does not unlock the rest of the site.
 */

export const CONNECT_PATH = "/connect";
export const CONNECT_EMAIL = "info@proaudiotrainingacademy.com";

export function isConnectPath(pathname: string): boolean {
  return pathname === CONNECT_PATH || pathname.startsWith(`${CONNECT_PATH}/`);
}

export function normalizeConnectFrom(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return key.length > 0 && key.length < 40 ? key : undefined;
}

export type ConnectNeed = "seats" | "custom" | "both" | "app";

export const CONNECT_NEED_LABELS: Record<ConnectNeed, string> = {
  seats: "Site licenses for a school, studio, or team",
  custom: "A custom program configuration",
  both: "Seats now, and a custom configuration as it comes online",
  app: "The learner app",
};

export function isConnectNeed(value: string): value is ConnectNeed {
  return value in CONNECT_NEED_LABELS;
}

export function buildConnectMailto(opts: {
  name: string;
  organization: string;
  role: string;
  email: string;
  need: ConnectNeed;
  note: string;
  from?: string;
}): string {
  const lines = [
    `Name: ${opts.name}`,
    `Organization: ${opts.organization}`,
    opts.role ? `Role: ${opts.role}` : null,
    `Email: ${opts.email}`,
    `Need: ${CONNECT_NEED_LABELS[opts.need]}`,
    opts.from ? `Source: ${opts.from}` : null,
    opts.note ? `Note:\n${opts.note}` : null,
  ].filter((line): line is string => Boolean(line));

  // encodeURIComponent, not URLSearchParams: mailto is not a form post, and
  // mail clients show URLSearchParams' "+" for space literally in the subject.
  const subject = encodeURIComponent("Following up from our meeting");
  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:${CONNECT_EMAIL}?subject=${subject}&body=${body}`;
}