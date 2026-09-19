/**
 * Moderation — the report queue and account standing.
 *
 * ⚠️ NONE OF THIS IS ENFORCEMENT. Every function below is guarded in the
 * DATABASE by `is_admin()` and refuses with "not permitted" regardless of what
 * the client does — verified by calling them as `authenticated`. These
 * wrappers exist so a screen has something typed to call.
 *
 * `account_standing_mine` is the exception and is NOT admin-guarded: it can
 * only ever return the caller's own row, and somebody who has been suspended
 * has every right to know it, why, and when it lifts.
 */
import { supabase } from '../../lib/supabase';

export type AccountStatus = 'active' | 'warned' | 'suspended' | 'banned' | 'removed';

export type ReportRow = {
  id: string;
  reason: string;
  detail: string | null;
  createdAt: string;
  reporterDisplay: string;
  reportedUser: string;
  reportedDisplay: string;
  reportedStatus: AccountStatus;
  /** How many OTHER reports exist against this person. The triage signal. */
  priorReports: number;
  requestId: string | null;
  status: 'open' | 'actioned' | 'dismissed';
  resolution: string | null;
};

export type ReportMessage = { senderIsReported: boolean; body: string; createdAt: string };

export type MyStanding = {
  status: AccountStatus;
  until: string | null;
  publicNote: string | null;
  reasonCode: string;
};

type Ok = { ok: true } | { ok: false; error: string };

/**
 * Returns null on failure, NEVER an empty array.
 *
 * The screen has to be able to tell "nothing to review" from "the read
 * failed" — printing the first when the second is true is how a queue gets
 * ignored for a week.
 */
export async function fetchReportQueue(status: 'open' | 'actioned' | 'dismissed' | 'all' = 'open'): Promise<ReportRow[] | null> {
  try {
    const { data, error } = await supabase.rpc('report_queue_list', { p_status: status });
    if (error) return null;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      reason: String(r.reason ?? ''),
      detail: (r.detail as string) ?? null,
      createdAt: String(r.created_at ?? ''),
      reporterDisplay: String(r.reporter_display ?? 'Member'),
      reportedUser: String(r.reported_user),
      reportedDisplay: String(r.reported_display ?? 'Member'),
      reportedStatus: (r.reported_status as AccountStatus) ?? 'active',
      priorReports: Number(r.prior_reports ?? 0),
      requestId: (r.request_id as string) ?? null,
      status: (r.status as ReportRow['status']) ?? 'open',
      resolution: (r.resolution as string) ?? null,
    }));
  } catch {
    return null;
  }
}

/** The thread behind a report, so a decision is made on evidence. */
export async function fetchReportMessages(id: string): Promise<ReportMessage[] | null> {
  try {
    const { data, error } = await supabase.rpc('report_detail', { p_id: id });
    if (error) return null;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      senderIsReported: r.sender_is_reported === true,
      body: String(r.body ?? ''),
      createdAt: String(r.created_at ?? ''),
    }));
  } catch {
    return null;
  }
}

export async function setAccountStanding(args: {
  userId: string;
  status: AccountStatus;
  until?: string | null;
  reason: string;
  publicNote?: string | null;
  privateNote?: string | null;
  reportIds?: string[];
}): Promise<Ok> {
  try {
    const { error } = await supabase.rpc('account_set_standing', {
      p_user: args.userId,
      p_status: args.status,
      p_until: args.until ?? null,
      p_reason: args.reason,
      p_public_note: args.publicNote ?? null,
      p_private_note: args.privateNote ?? null,
      p_report_ids: args.reportIds ?? [],
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

export async function resolveReport(id: string, outcome: 'dismissed' | 'open', note?: string): Promise<Ok> {
  try {
    const { error } = await supabase.rpc('report_resolve', {
      p_id: id,
      p_outcome: outcome,
      p_note: note ?? null,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

/**
 * The caller's OWN standing, or null when there is nothing to say.
 *
 * Null must be read as "fine" — a failed read has to leave the app usable.
 * Locking someone out because a request dropped would be indistinguishable
 * from a ban, which is the opposite of what this is for.
 */
export async function fetchMyStanding(): Promise<MyStanding | null> {
  try {
    const { data, error } = await supabase.rpc('account_standing_mine');
    const r = (data as Record<string, unknown>[] | null)?.[0];
    if (error || !r) return null;
    return {
      status: (r.status as AccountStatus) ?? 'active',
      until: (r.until as string) ?? null,
      publicNote: (r.public_note as string) ?? null,
      reasonCode: String(r.reason_code ?? ''),
    };
  } catch {
    return null;
  }
}
