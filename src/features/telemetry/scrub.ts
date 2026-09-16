/**
 * Telemetry scrubbers — the privacy contract, as code.
 *
 * Everything that leaves the app for Sentry or Aptabase passes through one of
 * these. They are deliberately IMPORT-FREE (no react-native, no SDK types) so
 * node:test can pin the rules without the module graph — see
 * test/telemetry.test.ts. The rules:
 *
 *   • Analytics props are ENUM-SHAPED only: short identifier-ish strings,
 *     finite numbers, booleans. Free text is refused, not truncated — a
 *     truncated email is still an email.
 *   • Breadcrumbs never carry a query string (a Supabase REST filter can embed
 *     a uid or an email) and console output is dropped outright (console lines
 *     are the one place user-typed text routinely appears).
 *   • Events never carry a `user` object at all — no id, email, username or
 *     IP. Sentry is fully anonymous (owner ruling 2026-09-16, "Option B");
 *     the field is removed here as a backstop even though nothing sets it.
 */

export type Primitive = string | number | boolean;

/** Max custom props per analytics event. */
export const MAX_PROPS = 10;
/** Max characters for a string prop value. */
export const MAX_STRING = 48;

const KEY_RE = /^[a-z][a-z0-9_]{0,31}$/;
// Identifier-ish: letters, digits, _ - . : and single spaces. No '@', no '/',
// no quotes — nothing that could be an email, URL, path or sentence.
const VALUE_RE = /^[A-Za-z0-9_\-.:]+( [A-Za-z0-9_\-.:]+)*$/;

/** True when a string is safe to send as an analytics prop value. */
export function isSafeString(v: string): boolean {
  return v.length > 0 && v.length <= MAX_STRING && VALUE_RE.test(v);
}

/**
 * Whitelist-filter analytics props. Unsafe entries are DROPPED (never
 * rewritten), so a caller cannot smuggle text by accident. Returns undefined
 * when nothing survives so the SDK call stays minimal.
 */
export function sanitizeProps(
  props: Record<string, unknown> | undefined,
): Record<string, Primitive> | undefined {
  if (!props) return undefined;
  const out: Record<string, Primitive> = {};
  let n = 0;
  for (const [k, v] of Object.entries(props)) {
    if (n >= MAX_PROPS) break;
    if (!KEY_RE.test(k)) continue;
    if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'string' && isSafeString(v)) out[k] = v;
    else continue;
    n += 1;
  }
  return n > 0 ? out : undefined;
}

/** Strip the query string and fragment from a URL (keeps scheme/host/path). */
export function scrubUrl(url: string): string {
  const cut = url.search(/[?#]/);
  return cut < 0 ? url : url.slice(0, cut);
}

/** The subset of a Sentry breadcrumb these rules touch (structural — Sentry's
 *  own `Breadcrumb` satisfies it; no SDK import needed here). */
export type BreadcrumbLike = {
  category?: string;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: { [key: string]: any };
};

/**
 * Sentry `beforeBreadcrumb`. Drops console breadcrumbs; strips query strings
 * from any http/fetch/xhr breadcrumb URL. Everything else passes untouched.
 */
export function scrubBreadcrumb<T extends BreadcrumbLike>(b: T): T | null {
  if (b.category === 'console') return null;
  const url = b.data?.url;
  if (typeof url === 'string') {
    return { ...b, data: { ...b.data, url: scrubUrl(url) } };
  }
  return b;
}

/** The subset of a Sentry event these rules touch (structural, see above —
 *  Sentry's `User.id` may be a number and `ip_address` may be null). */
export type EventLike = {
  user?: { id?: string | number; email?: string; username?: string; ip_address?: string | null };
  request?: unknown;
  breadcrumbs?: BreadcrumbLike[];
};

/**
 * Sentry `beforeSend`. Removes the `user` object entirely (no id, email,
 * username or IP — telemetry.ts never calls setUser, this is the backstop);
 * drops any request context; re-applies the breadcrumb rules to the
 * breadcrumbs attached to the event (they may have been added before the hook
 * was installed).
 */
export function scrubEvent<T extends EventLike>(event: T): T {
  const out: EventLike = { ...event };
  if ('user' in out) delete out.user;
  if ('request' in out) delete out.request;
  if (Array.isArray(out.breadcrumbs)) {
    out.breadcrumbs = out.breadcrumbs
      .map((b) => scrubBreadcrumb(b))
      .filter((b): b is BreadcrumbLike => b != null);
  }
  return out as T;
}
