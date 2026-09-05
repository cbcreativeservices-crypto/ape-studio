/**
 * linkPaths — the PURE half of the deep-link contract (no React Native
 * imports, so node:test covers it). `linking.ts` builds the React Navigation
 * config on top of these.
 *
 * PATHS ARE THE PUBLIC CONTRACT — the website hosts a real page at each one,
 * so a link works for people WITHOUT the app too. Change a path here only
 * together with app.json (intentFilters) and the website (AASA paths). The
 * full contract, including the families the app deliberately does NOT claim,
 * is docs/discoverability/URL_ROUTE_CONTRACT.md.
 *
 * SECURITY (hardening pass 2026-09-05, from the owner's SEO brief §3): an
 * incoming URL is attacker-controllable — anything can send the app a
 * `proaudio://…` URL, and a browser can hand us an https one. So we validate
 * the AUTHORITY, not just the path. The first version only stripped everything
 * up to the first slash, which meant
 *   https://proaudiotrainingacademy.com@evil.com/tools
 * parsed to the path `tools` AND string-prefix-matched React Navigation's
 * `https://proaudiotrainingacademy.com` prefix. Userinfo, ports, uppercase
 * hosts, backslashes, encoded slashes and traversal segments are all handled
 * below and covered by test/linkPaths.test.ts.
 */

export const APP_SCHEME = 'proaudio';
export const LINK_HOSTS = ['proaudiotrainingacademy.com', 'www.proaudiotrainingacademy.com'] as const;

/** The seven tool-info keys `/tools/:toolKey` accepts. A plain list (not the
 *  ToolKey union) so the filter never imports the tools catalogue at boot. */
export const TOOL_INFO_KEYS = ['spl', 'rta', 'waveform', 'spectrogram', 'rt60', 'signalgen', 'hzcounter'];
/** Tool keys that open their own live screen instead of a ToolInfo page. */
export const TOOL_DIRECT_KEYS = ['multimeter', 'frequency-counter'];
/** The Awards pager's landing pages (`Awards.category`). */
export const AWARD_PAGES = ['curriculum', 'specialization', 'program', 'directory', 'enrollment'];

/** Hard caps: a deep link is never legitimately longer than this. */
const MAX_URL_LEN = 2048;
const MAX_SEGMENT_LEN = 128;
const MAX_SEGMENTS = 8;

/** Control characters (including NUL, CR, LF, tab) never appear in a real link
 *  and are a classic smuggling vector. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;

export type ParsedLink = {
  /** Lowercased host, or null for a scheme-relative/custom-scheme URL. */
  host: string | null;
  /** Path with no leading/trailing slash, no query, no fragment. */
  path: string;
};

/**
 * Parse an incoming URL into `{host, path}`, or null when it is malformed or
 * not addressed to us. Returning null is always safe: the caller drops the link.
 */
export function parseLink(url: string): ParsedLink | null {
  if (typeof url !== 'string' || url.length === 0 || url.length > MAX_URL_LEN) return null;
  if (CONTROL_CHARS.test(url)) return null;

  // A backslash is treated as a slash by several URL parsers but not by naive
  // string splitting — normalise before anything else so the two agree.
  let rest = url.replace(/\\/g, '/');
  let host: string | null = null;

  const schemeIdx = rest.indexOf('://');
  if (schemeIdx >= 0) {
    const scheme = rest.slice(0, schemeIdx).toLowerCase();
    rest = rest.slice(schemeIdx + 3);
    if (scheme === APP_SCHEME) {
      // proaudio://tools/rta — the "authority" is really the first path
      // segment, so keep the whole remainder as the path.
      if (rest.startsWith('/')) rest = rest.slice(1);
    } else if (scheme === 'https' || scheme === 'http') {
      // Split authority from path. The authority ends at the first / ? or #.
      const end = rest.search(/[/?#]/);
      const authority = end === -1 ? rest : rest.slice(0, end);
      rest = end === -1 ? '' : rest.slice(end + (rest[end] === '/' ? 1 : 0));
      // Reject userinfo outright rather than trying to interpret it: it is the
      // host-spoofing vector and no legitimate link to us carries one.
      if (authority.includes('@')) return null;
      const hostOnly = authority.replace(/:\d+$/, '').toLowerCase();
      if (hostOnly.length === 0) return null;
      host = hostOnly;
    } else {
      // Any other scheme (file:, intent:, …) is not ours.
      return null;
    }
  } else {
    // No "://" at all. A bare `scheme:` prefix is still a scheme, and the
    // dangerous ones look exactly like this: javascript:, data:, mailto:.
    // Treat anything with a colon before the first slash as a foreign scheme.
    const firstSlash = rest.indexOf('/');
    const firstColon = rest.indexOf(':');
    if (firstColon !== -1 && (firstSlash === -1 || firstColon < firstSlash)) return null;
  }

  // Drop query and fragment, then normalise the path.
  const path = rest.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  if (path.length > MAX_URL_LEN) return null;

  const segments = path.length === 0 ? [] : path.split('/');
  if (segments.length > MAX_SEGMENTS) return null;
  for (const s of segments) {
    // Empty (//), traversal (. ..) and over-long segments are all rejected.
    // %2F is rejected too: it would otherwise smuggle a path separator past
    // the per-segment allowlist checks below.
    if (s.length === 0 || s.length > MAX_SEGMENT_LEN) return null;
    if (s === '.' || s === '..') return null;
    if (/%2f/i.test(s) || /%5c/i.test(s)) return null;
  }

  return { host, path: segments.join('/') };
}

/** True when the URL's host is one we accept (or it is our custom scheme). */
export function isAllowedHost(host: string | null): boolean {
  return host === null || (LINK_HOSTS as readonly string[]).includes(host);
}

/** Path (no leading slash, no query/hash) of a URL, or '' when unparseable. */
export function linkPath(url: string): string {
  return parseLink(url)?.path ?? '';
}

/** True for the paths this app claims (mirrors app.json intentFilters and the
 *  website's AASA `paths`). Website-only pages (`verify`, `registry`, `u`,
 *  `subjects`, …) return false so the browser keeps them. */
export function isClaimedPath(path: string): boolean {
  const [head, second, ...more] = path.split('/');
  switch (head) {
    case 'get':
    case 'learn':
    case 'directory':
    case 'careers':
      return second == null;
    case 'tools':
      return (
        second == null ||
        (more.length === 0 && (TOOL_INFO_KEYS.includes(second) || TOOL_DIRECT_KEYS.includes(second)))
      );
    case 'labs':
    case 'glossary':
    case 'topics':
      return more.length === 0;
    case 'awards':
      return more.length === 0 && AWARD_PAGES.includes(second ?? '');
    default:
      return false;
  }
}

/**
 * The one gate every incoming URL passes: parseable, addressed to a host we
 * accept, and a path this app actually handles well. Anything else is left to
 * the browser and the website, which is the correct fallback — claiming a URL
 * we would handle badly is worse than not claiming it.
 */
export function isAcceptedLink(url: string): boolean {
  const parsed = parseLink(url);
  if (!parsed) return false;
  if (!isAllowedHost(parsed.host)) return false;
  return isClaimedPath(parsed.path);
}

/** URL slug for a term/topic/subject name — the same rule the website uses:
 *  fold accents, lowercase, runs of non-alphanumerics collapse to '-'. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Back-compat alias — glossary terms use the shared slug rule. */
export const glossaryTermSlug = slugify;

/** The human search text for a slug that arrives by deep link. */
export function slugToQuery(slug: string): string {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    /* malformed escape — keep the raw text rather than throwing */
  }
  return s.replace(/-+/g, ' ').trim();
}
