/**
 * employer/api — the app side of employer accounts.
 *
 * The APPLICATION lives on the website (owner: "the website has an additional
 * application… employers must set up an account AND download the app"). The app
 * is where a VERIFIED employer does the work: says what it is looking for, and
 * contacts members.
 *
 * So there is deliberately no `apply()` here. Adding one would put a second,
 * unverified door on the same room — and the website's door is the one that
 * runs the network checks.
 */
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { withDeadline } from '../../lib/boundedCall';
import { verifierKindOf, type VerifierKind } from './verifierKind.ts';
import { employerPageToken } from './publicPage.ts';

/**
 * The two admin WRITES are bounded (night bug pass 3, 2026-10-01). supabase-js
 * has no fetch timeout: a stalled approve / reject / revoke never settled, the
 * row stayed busy, and the admin queue was locked until a relaunch. A timeout
 * cannot say whether the write landed, so it says exactly that. The two queue
 * READS share the bound: the reload after a decision holds the same lock, and
 * a stalled one locked the queue just the same (a timeout reads as null — the
 * screen's "could not load" line, never an empty queue).
 */
const ADMIN_WRITE_MS = 20000;
const ADMIN_TIMEOUT_COPY = 'Couldn’t confirm — check the list after reconnecting.';
const isTimeout = (e: unknown) => /timeout/.test((e as Error | null)?.message ?? '');

export type EmployerApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export type EmployerApplication = {
  id: string;
  status: EmployerApplicationStatus;
  companyName: string;
  reviewNote: string | null;
  /** Why it was queued, in the applicant's own words-worth. Empty when auto-approved. */
  queueReasons: string[];
  createdAt: string;
  reviewedAt: string | null;
  /** Employer, or instructor/school (the server's `kind`, R1). */
  kind: VerifierKind;
};

/**
 * Three-state on purpose.
 *
 * `null` means "no application" and is a real answer. A FAILED read is
 * `'error'` — not null — because rendering "you haven't applied" to somebody
 * whose application is sitting in the queue is the kind of wrong that makes
 * people apply twice.
 */
export type EmployerState =
  | { state: 'none' }
  | { state: 'have'; application: EmployerApplication }
  | { state: 'error' };

export async function fetchMyEmployerApplication(): Promise<EmployerState> {
  try {
    // A guest has no application; the RPC answers 401 without a session.
    // A session read that did not come back is UNKNOWN, not a guest
    // (2026-10-03) — 'none' would tell an applicant they never applied.
    const { result: got, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'fetchMyEmployerApplication');
    if (timedOut) return { state: 'error' };
    if (!got.data.session) return { state: 'none' };
    const { data, error } = await supabase.rpc('employer_application_mine');
    if (error) return { state: 'error' };
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
    if (!row) return { state: 'none' };

    const checks = (row.checks ?? {}) as Record<string, unknown>;
    const reasons = Array.isArray(checks.queue_reasons)
      ? (checks.queue_reasons as unknown[]).map(String)
      : [];

    return {
      state: 'have',
      application: {
        id: String(row.id),
        status: (row.status as EmployerApplicationStatus) ?? 'pending',
        companyName: String(row.company_name ?? ''),
        reviewNote: (row.review_note as string) ?? null,
        queueReasons: reasons,
        createdAt: String(row.created_at ?? ''),
        reviewedAt: (row.reviewed_at as string) ?? null,
        kind: verifierKindOf(row.kind),
      },
    };
  } catch {
    return { state: 'error' };
  }
}

/**
 * Am I a verified employer OR a verified instructor — and which? (R1,
 * 2026-10-27; was `amIVerifiedEmployer`.)
 *
 *   'employer' | 'instructor' — a verified, non-revoked account of that kind;
 *   'none'                    — not a verified account (or a guest);
 *   'unknown'                 — THE READ FAILED. Never "not verified".
 *
 * ── WHY THIS TAKES NO ARGUMENT (2026-09-18) ────────────────────────────────
 * The server's per-user check wants public.users.id; the client holds the AUTH
 * id. A first version resolved that mapping here, read the wrong field and
 * would have answered "not verified" for EVERY verified employer, forever,
 * with no error. `my_verifier_kind()` resolves the caller server-side with
 * `directory_me()` (live definition, read 2026-10-27: the `kind` of the
 * caller's employer_profiles row where `revoked_at is null`, else null; granted
 * to authenticated only), so the client cannot get the id space wrong.
 *
 * ── 'unknown' IS NOT 'none' (hunt 7, 2026-10-03) ───────────────────────────
 * A failed read answered "not verified" and the Profile section turned "could
 * not ask" into a fact: a verified employer whose check dropped, beside an
 * application read that landed, was told "This application is no longer
 * active." Only a kind opens the chips, and the RPCs are refused server-side
 * regardless.
 */
export type MyVerifierKind = VerifierKind | 'none' | 'unknown';

export async function myVerifierKind(): Promise<MyVerifierKind> {
  try {
    // An UNKNOWN session is a failed read, not "not verified".
    const { result: got, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'myVerifierKind');
    if (timedOut) return 'unknown';
    if (!got.data.session) return 'none';
    const { data, error } = await supabase.rpc('my_verifier_kind');
    if (error) return 'unknown';
    // null = no verified profile. Any string = a verified profile of some kind.
    return typeof data === 'string' && data ? verifierKindOf(data) : 'none';
  } catch {
    return 'unknown';
  }
}

/**
 * My public page token, for the SHARE MY PUBLIC PAGE button (must-do H5,
 * 2026-10-29).
 *
 * `my_employer_public_token()` is written for Comp A to create (brief
 * Downloads/2026-10-29_FOR_COMP_A_H5_EMPLOYER_PUBLIC_TOKEN.md): the caller's
 * employer_profiles.public_token when verified and not revoked, else null.
 * Until it is live the call fails, and a failure, a null or anything that is
 * not a uuid all answer null, which HIDES the button. Nothing here can show a
 * share link that the website would not open.
 */
export async function myEmployerPublicToken(): Promise<string | null> {
  try {
    const { result: got, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'myEmployerPublicToken');
    if (timedOut || !got.data.session) return null;
    const { data, error } = await supabase.rpc('my_employer_public_token');
    if (error) return null;
    return employerPageToken(data);
  } catch {
    return null;
  }
}

export type SaveOk = { ok: true } | { ok: false; error: string };

/**
 * What this employer is looking for.
 *
 * Only reachable once verified — the RPC refuses otherwise, so the gate is the
 * database's and not this screen's. The UI still hides the control, because
 * offering something that will be refused is its own kind of lie.
 */
export async function setEmployerInterests(
  kind: 'area' | 'specialty' | 'role' | 'open_to',
  slugs: string[],
): Promise<SaveOk> {
  try {
    const { error } = await supabase.rpc('employer_set_interests', {
      p_kind: kind,
      p_slugs: slugs,
    });
    if (!error) return { ok: true };
    return {
      ok: false,
      error: /not verified/i.test(error.message)
        ? 'Your employer account is not verified yet.'
        : 'Could not save that. Try again.',
    };
  } catch {
    // Not a connection failure: supabase-js RESOLVES with `{ error }`
    // when the network drops, so only a thrown exception lands here.
    return { ok: false, error: 'Something went wrong and that wasn’t saved. Your changes are still on this screen — try again.' };
  }
}

export async function fetchMyEmployerInterests(): Promise<Record<string, string[]> | null> {
  try {
    // ── MINE, NOT EVERY EMPLOYER'S (2026-09-19, audit) ──────────────────
    // This used to select the table directly with no user filter. The RLS
    // policy on employer_profile_interests deliberately exposes ALL rows for
    // any non-revoked employer (it backs the public profile), so with one
    // employer it looked right and with two it silently merged them —
    // employer B saw A's chips lit, and toggling one rewrote B's rows from
    // the merged list, destroying B's real selections with no error.
    //
    // Filtering here is not possible: the client holds an auth uid, not
    // public.users.id. The RPC filters on directory_me(), where that id lives.
    const { data, error } = await supabase.rpc('employer_my_interests');
    if (error) return null;
    const out: Record<string, string[]> = {};
    for (const r of (data ?? []) as { kind: string; slug: string }[]) {
      (out[r.kind] ??= []).push(r.slug);
    }
    return out;
  } catch {
    return null;
  }
}

/* ── ADMIN ────────────────────────────────────────────────────────────────
 *
 * Every function below is guarded IN THE DATABASE by is_admin(); these
 * wrappers exist so the screen has something typed to call, not to enforce
 * anything. Hiding the UI is a courtesy — the refusal is the RPC's.
 */

export type PendingApplication = {
  id: string;
  companyName: string;
  companyWebsite: string;
  workEmail: string;
  roleTitle: string;
  hiringFor: string | null;
  createdAt: string;
  emailConfirmed: boolean;
  emailMatchesSite: boolean;
  freeMail: boolean;
  domainResolves: boolean;
  siteReachable: boolean;
  queueReasons: string[];
  /** Employer, or instructor/school (the list's last column, R1). */
  kind: VerifierKind;
};

export type ActiveEmployer = {
  userId: string;
  companyName: string;
  companyWebsite: string;
  revokedAt: string | null;
  createdAt: string;
  kind: VerifierKind;
};

/** True only for a user whose `users.role` is 'admin'. */
export async function amIAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    return !error && data === true;
  } catch {
    return false;
  }
}

export async function fetchPendingApplications(): Promise<PendingApplication[] | null> {
  try {
    const { data, error } = await withDeadline(async () => await supabase.rpc('employer_pending_list'), 'employer_pending_list', ADMIN_WRITE_MS);
    if (error) return null;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      companyName: String(r.company_name ?? ''),
      companyWebsite: String(r.company_website ?? ''),
      workEmail: String(r.work_email ?? ''),
      roleTitle: String(r.role_title ?? ''),
      hiringFor: (r.hiring_for as string) ?? null,
      createdAt: String(r.created_at ?? ''),
      emailConfirmed: r.email_confirmed === true,
      emailMatchesSite: r.email_matches_site === true,
      freeMail: r.free_mail === true,
      domainResolves: r.domain_resolves === true,
      siteReachable: r.site_reachable === true,
      queueReasons: Array.isArray(r.queue_reasons) ? (r.queue_reasons as string[]) : [],
      kind: verifierKindOf(r.kind),
    }));
  } catch {
    return null;
  }
}

export async function fetchActiveEmployers(): Promise<ActiveEmployer[] | null> {
  try {
    const { data, error } = await withDeadline(async () => await supabase.rpc('employer_active_list'), 'employer_active_list', ADMIN_WRITE_MS);
    if (error) return null;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      userId: String(r.user_id),
      companyName: String(r.company_name ?? ''),
      companyWebsite: String(r.company_website ?? ''),
      revokedAt: (r.revoked_at as string) ?? null,
      createdAt: String(r.created_at ?? ''),
      kind: verifierKindOf(r.kind),
    }));
  } catch {
    return null;
  }
}

export async function reviewApplication(
  id: string,
  action: 'approve' | 'reject',
  note?: string,
): Promise<SaveOk> {
  try {
    const { error } = await withDeadline(
      async () => await supabase.rpc('employer_review', {
        p_id: id,
        p_action: action,
        p_note: note ?? null,
      }),
      'employer_review',
      ADMIN_WRITE_MS,
    );
    // Never the raw Postgres string under a two-word title, and say what
    // did NOT happen — an approve/revoke failure used to leave the reviewer
    // unable to tell whether the applicant's state had changed.
    return error ? { ok: false, error: 'That change could not be saved. Nothing was changed for this account — reload the queue and try again.' } : { ok: true };
  } catch (e) {
    if (isTimeout(e)) return { ok: false, error: ADMIN_TIMEOUT_COPY };
    // Not a connection failure: supabase-js RESOLVES with `{ error }`
    // when the network drops, so only a thrown exception lands here.
    return { ok: false, error: 'Something went wrong and that wasn’t saved. Your changes are still on this screen — try again.' };
  }
}

export async function setEmployerRevoked(userId: string, revoked: boolean): Promise<SaveOk> {
  try {
    const { error } = await withDeadline(
      async () => await supabase.rpc('employer_revoke', {
        p_user: userId,
        p_revoked: revoked,
      }),
      'employer_revoke',
      ADMIN_WRITE_MS,
    );
    // Never the raw Postgres string under a two-word title, and say what
    // did NOT happen — an approve/revoke failure used to leave the reviewer
    // unable to tell whether the applicant's state had changed.
    return error ? { ok: false, error: 'That change could not be saved. Nothing was changed for this account — reload the queue and try again.' } : { ok: true };
  } catch (e) {
    if (isTimeout(e)) return { ok: false, error: ADMIN_TIMEOUT_COPY };
    // Not a connection failure: supabase-js RESOLVES with `{ error }`
    // when the network drops, so only a thrown exception lands here.
    return { ok: false, error: 'Something went wrong and that wasn’t saved. Your changes are still on this screen — try again.' };
  }
}
