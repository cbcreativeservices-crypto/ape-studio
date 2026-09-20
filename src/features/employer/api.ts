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
      },
    };
  } catch {
    return { state: 'error' };
  }
}

/**
 * Am I a verified employer? Never throws; false on any doubt.
 *
 * ── WHY THIS TAKES NO ARGUMENT (corrected 2026-09-18) ──────────────────────
 *
 * `is_verified_employer(uuid)` wants public.users.id; the client holds the
 * AUTH id. My first version resolved that mapping here through `my_identity()`
 * and read the wrong field — it returns `id`, not `user_id` — so it would have
 * returned false for EVERY verified employer, forever, with no error anywhere.
 * Fails closed and silent: the exact inert-check shape that has bitten this
 * codebase three times.
 *
 * `am_i_verified_employer()` does the resolution server-side with
 * `directory_me()`. The client cannot get the id space wrong because it is no
 * longer asked to.
 */
export async function amIVerifiedEmployer(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('am_i_verified_employer');
    return !error && data === true;
  } catch {
    return false;
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
};

export type ActiveEmployer = {
  userId: string;
  companyName: string;
  companyWebsite: string;
  revokedAt: string | null;
  createdAt: string;
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
    const { data, error } = await supabase.rpc('employer_pending_list');
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
    }));
  } catch {
    return null;
  }
}

export async function fetchActiveEmployers(): Promise<ActiveEmployer[] | null> {
  try {
    const { data, error } = await supabase.rpc('employer_active_list');
    if (error) return null;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      userId: String(r.user_id),
      companyName: String(r.company_name ?? ''),
      companyWebsite: String(r.company_website ?? ''),
      revokedAt: (r.revoked_at as string) ?? null,
      createdAt: String(r.created_at ?? ''),
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
    const { error } = await supabase.rpc('employer_review', {
      p_id: id,
      p_action: action,
      p_note: note ?? null,
    });
    // Never the raw Postgres string under a two-word title, and say what
    // did NOT happen — an approve/revoke failure used to leave the reviewer
    // unable to tell whether the applicant's state had changed.
    return error ? { ok: false, error: 'That change could not be saved. Nothing was changed for this account — reload the queue and try again.' } : { ok: true };
  } catch {
    // Not a connection failure: supabase-js RESOLVES with `{ error }`
    // when the network drops, so only a thrown exception lands here.
    return { ok: false, error: 'Something went wrong and that wasn’t saved. Your changes are still on this screen — try again.' };
  }
}

export async function setEmployerRevoked(userId: string, revoked: boolean): Promise<SaveOk> {
  try {
    const { error } = await supabase.rpc('employer_revoke', {
      p_user: userId,
      p_revoked: revoked,
    });
    // Never the raw Postgres string under a two-word title, and say what
    // did NOT happen — an approve/revoke failure used to leave the reviewer
    // unable to tell whether the applicant's state had changed.
    return error ? { ok: false, error: 'That change could not be saved. Nothing was changed for this account — reload the queue and try again.' } : { ok: true };
  } catch {
    // Not a connection failure: supabase-js RESOLVES with `{ error }`
    // when the network drops, so only a thrown exception lands here.
    return { ok: false, error: 'Something went wrong and that wasn’t saved. Your changes are still on this screen — try again.' };
  }
}
