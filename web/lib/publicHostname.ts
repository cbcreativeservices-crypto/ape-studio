/**
 * Is this hostname something we are willing to make the SERVER fetch?
 *
 * ── WHY THIS IS A SECURITY CONTROL, NOT A VALIDATOR ─────────────────────────
 *
 * /api/employers/apply probes a company's website from our Vercel server. For
 * a while it probed whatever `domain` the request body contained, checked only
 * against /^[a-z0-9.-]{3,253}$/ — which happily accepts `localhost`,
 * `metadata`, `169.254.169.254` and `10.0.0.5`. Any signed-in user could point
 * our server at an internal address and read back the HTTP status and up to
 * 200 characters of <title>, which then travelled onward into an email. That
 * is an internal port-probe with an exfiltration channel.
 *
 * The real fix is upstream: the domain now comes from the application row,
 * computed by `employer_domain_of` in Postgres, which the applicant cannot
 * forge. This function is the second line, and it is deliberately strict —
 * it answers "is this plausibly a PUBLIC company website", not "is this a
 * syntactically legal hostname". Anything it is unsure about, it refuses; the
 * cost of a false refusal is one queued application a human looks at.
 */
export function isPublicHostname(h: string): boolean {
  if (!/^[a-z0-9.-]{4,253}$/.test(h)) return false;
  if (h.startsWith('.') || h.endsWith('.') || h.includes('..')) return false;
  // Reject the whole IPv4-literal class rather than enumerating private
  // ranges: a company website is a NAME, and "which ranges are internal" is a
  // list that is never quite complete. (IPv6 and ports are already excluded
  // by the charset above, which allows neither ':' nor '[').
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false;
  const parts = h.split('.');
  if (parts.length < 2) return false; // dotless: localhost, metadata, …
  if (!/^[a-z]{2,}$/.test(parts[parts.length - 1])) return false; // letter TLD
  if (/(^|\.)(localhost|local|internal|intranet|localdomain)$/.test(h)) return false;
  return true;
}
