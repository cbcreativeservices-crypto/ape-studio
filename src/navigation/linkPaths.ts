/**
 * linkPaths — the PURE half of the deep-link contract (no React Native
 * imports, so node:test can cover it). `linking.ts` builds the React Navigation
 * config on top of these.
 *
 * PATHS ARE THE PUBLIC CONTRACT — the website hosts a real page at each one,
 * so a link works for people WITHOUT the app too. Change a path here only
 * together with app.json (intentFilters) and the website (AASA paths).
 */

export const APP_SCHEME = 'proaudio';
export const LINK_HOSTS = ['proaudiotrainingacademy.com', 'www.proaudiotrainingacademy.com'] as const;

/** The seven tool-info keys `/tools/:toolKey` accepts. A plain list (not the
 *  ToolKey union) so the filter never imports the tools catalogue at boot. */
export const TOOL_INFO_KEYS = ['spl', 'rta', 'waveform', 'spectrogram', 'rt60', 'signalgen', 'hzcounter'];
/** The Awards pager's landing pages (`Awards.category`). */
export const AWARD_PAGES = ['curriculum', 'specialization', 'program', 'directory', 'enrollment'];

/** Path (no leading slash, no query/hash) of any URL the app may receive:
 *  `https://host/tools/rta` → `tools/rta`; `proaudio://tools/rta` → `tools/rta`. */
export function linkPath(url: string): string {
  let rest = url;
  const schemeIdx = url.indexOf('://');
  if (schemeIdx >= 0) {
    const scheme = url.slice(0, schemeIdx).toLowerCase();
    rest = url.slice(schemeIdx + 3);
    if (scheme !== APP_SCHEME) {
      // https://host/path → drop the host
      const slash = rest.indexOf('/');
      rest = slash >= 0 ? rest.slice(slash + 1) : '';
    }
  }
  return rest.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
}

/** True for the paths this app claims (mirrors app.json intentFilters and the
 *  website's AASA `paths`). Website-only pages (`verify`, `registry`, `u`, …)
 *  return false so the OS/browser keeps them. */
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
        (more.length === 0 && (TOOL_INFO_KEYS.includes(second) || second === 'multimeter' || second === 'frequency-counter'))
      );
    case 'labs':
    case 'glossary':
      return more.length === 0;
    case 'awards':
      return more.length === 0 && AWARD_PAGES.includes(second ?? '');
    default:
      return false;
  }
}

/** URL slug for a glossary term — the same rule the website uses for
 *  `/glossary/[slug]`: fold accents, lowercase, runs of non-alphanumerics → '-'. */
export function glossaryTermSlug(term: string): string {
  return term
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The human search text for a slug that arrives by deep link. */
export function slugToQuery(slug: string): string {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    /* keep raw */
  }
  return s.replace(/-+/g, ' ').trim();
}
