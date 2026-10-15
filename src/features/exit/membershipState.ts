/**
 * What the Membership and billing screen may honestly say, from the caller's
 * academy entitlement rows (exit flow, 2026-10-15).
 *
 * Pure (no React Native, no Supabase) so the rules are tested directly.
 *
 * ⛔ RENEWAL IS NEVER GUESSED. `will_renew` is written by the server from the
 * store's own notifications (Comp A, not live yet). Until that column exists,
 * or while it is null, a store subscription is 'unknown': the screen says "We
 * couldn't confirm your renewal status" and offers Manage subscription. It
 * never claims "Renews on" or "ends on".
 */
import { classifyExpiry, verdictKeepsAccess } from '../commercial/entitlementExpiry';
import type { Provider } from './survey';

export type MembershipRow = {
  product?: string | null;
  status?: string | null;
  expires_at?: string | null;
  source?: string | null;
  /** Comp A columns — absent until the server half is live. */
  plan?: string | null;
  will_renew?: boolean | null;
  renewal_checked_at?: string | null;
};

export type PlanKind = 'monthly' | 'annual' | 'lifetime' | null;

export type MembershipCard =
  | { kind: 'renewing'; provider: Provider; plan: PlanKind; endsAt: string | null }
  | { kind: 'renewal_off'; provider: Provider; plan: PlanKind; endsAt: string | null }
  | { kind: 'unknown'; provider: Provider; plan: PlanKind; endsAt: string | null }
  | { kind: 'lifetime'; provider: Provider | null }
  | { kind: 'granted'; endsAt: string | null };

export type MembershipView =
  | { state: 'active'; cards: MembershipCard[] }
  | { state: 'lapsed'; provider: Provider | null }
  | { state: 'none' };

/** Billing provider from the verified record, never from the phone in hand. */
export function providerOf(source: string | null | undefined): Provider | null {
  if (source === 'app_store') return 'apple';
  if (source === 'play_store') return 'google';
  return null;
}

/** Lifetime rows carry the 2099-12-31 sentinel (iapProducts / validate-purchase). */
const LIFETIME_YEAR = 2099;

function planOf(row: MembershipRow): PlanKind {
  if (row.plan === 'monthly' || row.plan === 'annual' || row.plan === 'lifetime') return row.plan;
  const t = row.expires_at ? Date.parse(row.expires_at) : NaN;
  if (Number.isFinite(t) && new Date(t).getUTCFullYear() >= LIFETIME_YEAR) return 'lifetime';
  return null;
}

function laterEnd(a: string | null | undefined, b: string | null | undefined): number {
  const ta = a ? Date.parse(a) : NaN;
  const tb = b ? Date.parse(b) : NaN;
  return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
}

/**
 * @param renewalKnown false when the renewal columns could not be read (not
 *        deployed yet) — every store subscription is then 'unknown'.
 */
export function membershipView(rows: MembershipRow[], renewalKnown: boolean, now: number = Date.now()): MembershipView {
  const academy = rows.filter((r) => (r.product ?? 'academy') === 'academy');
  const active = academy
    .filter((r) => r.status === 'active' && verdictKeepsAccess(classifyExpiry(r.expires_at, now)))
    .sort((a, b) => laterEnd(a.expires_at, b.expires_at));

  const cards: MembershipCard[] = [];
  const seen = new Set<string>();
  for (const r of active) {
    const provider = providerOf(r.source);
    const plan = planOf(r);
    if (plan === 'lifetime') {
      if (seen.has('lifetime')) continue;
      seen.add('lifetime');
      cards.push({ kind: 'lifetime', provider });
      continue;
    }
    if (!provider) {
      // An access code or a staff grant: nothing is billed, so nothing to cancel.
      if (seen.has('granted')) continue;
      seen.add('granted');
      cards.push({ kind: 'granted', endsAt: r.expires_at ?? null });
      continue;
    }
    // One card per billing provider (the latest-ending row): cancelling one
    // must never read as all billing having stopped.
    if (seen.has(provider)) continue;
    seen.add(provider);
    const endsAt = r.expires_at ?? null;
    const wr = renewalKnown ? r.will_renew : null;
    if (wr === true) cards.push({ kind: 'renewing', provider, plan, endsAt });
    else if (wr === false) cards.push({ kind: 'renewal_off', provider, plan, endsAt });
    else cards.push({ kind: 'unknown', provider, plan, endsAt });
  }
  if (cards.length) return { state: 'active', cards };

  // Paid access has ended. A store row past its date (or marked lapsed) is
  // described in the store's terms — never as a cancellation.
  const ended = academy.filter((r) => r.status === 'lapsed' || r.status === 'active');
  if (ended.length) return { state: 'lapsed', provider: providerOf(ended[0].source) };
  return { state: 'none' };
}

/**
 * C4 may show "Your membership will not renew." ONLY when the server says so
 * for this provider: an active subscription with will_renew === false and no
 * active one of the same provider still renewing. A tap, a store page opened,
 * a missing column or a null are all NOT confirmation.
 */
export function cancellationVerified(rows: MembershipRow[], renewalKnown: boolean, provider: Provider, now: number = Date.now()): boolean {
  if (!renewalKnown) return false;
  const view = membershipView(rows, true, now);
  if (view.state !== 'active') return false;
  const card = view.cards.find((c) => 'provider' in c && c.provider === provider && c.kind !== 'lifetime');
  return !!card && card.kind === 'renewal_off';
}

/** The verified access-end date for a provider's subscription, if any. */
export function accessEndFor(rows: MembershipRow[], provider: Provider, now: number = Date.now()): string | null {
  const view = membershipView(rows, true, now);
  if (view.state !== 'active') return null;
  const card = view.cards.find((c) => 'provider' in c && c.provider === provider && 'endsAt' in c);
  return card && 'endsAt' in card ? card.endsAt : null;
}

/** Store subscriptions whose renewal is on or not confirmed off (deletion D2 warnings). */
export function providersStillBilling(view: MembershipView): Provider[] {
  if (view.state !== 'active') return [];
  const out: Provider[] = [];
  for (const c of view.cards) {
    if ((c.kind === 'renewing' || c.kind === 'unknown') && !out.includes(c.provider)) out.push(c.provider);
  }
  return out;
}

/** The first renewing subscription — the one "Cancel membership and keep my account" leads to. */
export function renewingCard(view: MembershipView): Extract<MembershipCard, { kind: 'renewing' }> | null {
  if (view.state !== 'active') return null;
  return (view.cards.find((c) => c.kind === 'renewing') as Extract<MembershipCard, { kind: 'renewing' }>) ?? null;
}

/** "Missing column" errors from PostgREST — the renewal columns are not deployed yet. */
export function isMissingColumnError(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === '42703' || error.code === 'PGRST204') return true;
  return /column .* does not exist|could not find the .* column/i.test(error.message ?? '');
}

/** PostgREST: no function with that signature (delete_my_account(p_keep_credentials) not deployed). */
export function isMissingFunctionError(error: { code?: string | null } | null | undefined): boolean {
  return !!error && error.code === 'PGRST202';
}

/** delete_my_account arguments for the chosen certificate outcome. */
export function deleteRpcArgs(choice: 'delete_all' | 'keep_record' | null): { p_keep_credentials: boolean } {
  return { p_keep_credentials: choice === 'keep_record' };
}

/**
 * The final Delete is enabled only with a password typed and — when the person
 * holds a certificate (or we could not tell) — one certificate outcome chosen.
 * Nothing is preselected, so `null` keeps it disabled.
 */
export function deleteEnabled(opts: {
  password: string;
  needsCertChoice: boolean;
  certChoice: 'delete_all' | 'keep_record' | null;
  busy: boolean;
}): boolean {
  if (opts.busy) return false;
  if (!opts.password) return false;
  if (opts.needsCertChoice && !opts.certChoice) return false;
  return true;
}

/** Localised long date, or null for a missing/unreadable value (never "Invalid Date"). */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  try {
    return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return new Date(t).toDateString();
  }
}
