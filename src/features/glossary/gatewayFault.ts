/**
 * Glossary gateway error classification — the pure half (owner 2026-09-13).
 *
 * Import-free so node:test can read it directly. The calls live in
 * `glossaryGateway.ts`.
 *
 * PostgREST surfaces a missing function/relation as its own PGRSTxxx code and
 * Postgres surfaces it as a SQLSTATE; which one arrives depends on whether the
 * schema cache or the database answered first, so both are accepted. The
 * gateway's OWN refusals are matched on the MESSAGE rather than the code: they
 * are raised with `errcode = 'PGRST'`, and how that reaches the client is a
 * PostgREST implementation detail — the message text is ours and is stable.
 */

export type GatewayFault =
  /** The view/RPC is not deployed. Caller falls back to the legacy path. */
  | 'not-deployed'
  /** Signed out (or the key was purged) — the caller must mint a device key. */
  | 'sign-in-required'
  /** Out of free definitions this week. */
  | 'limit-reached'
  /** GRANTs are gone and we are NOT signed in the way the server expects. */
  | 'denied'
  /** Anything else: network, timeout, unknown. Fail open. */
  | 'error';

export function classifyGatewayError(error: { code?: string | null; message?: string } | null): GatewayFault | null {
  if (!error) return null;
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  // Undefined function / undefined table, from either layer.
  if (code === '42883' || code === '42P01' || code === 'PGRST202' || code === 'PGRST205') return 'not-deployed';
  if (msg.includes('could not find the function') || msg.includes('could not find the table')) return 'not-deployed';
  if (msg.includes('weekly_limit_reached')) return 'limit-reached';
  if (msg.includes('sign_in_required')) return 'sign-in-required';
  if (code === '42501' || msg.includes('permission denied')) return 'denied';
  return 'error';
}
