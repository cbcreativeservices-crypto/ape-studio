/**
 * In-app UNREAD COUNTS for the Audio Community Directory (owner decision
 * 2026-10-04) — pending contact requests and unread messages, behind the
 * badges on Profile, the directory entry points and the REQUESTS tab.
 *
 * Pure store: no React Native, no Supabase. The read itself is passed in
 * (inboxApi.ts in the app, a stub in the tests).
 *
 * HONEST FACES (catalog K2, K4, K5):
 *  - A read that FAILED, or a session we could not read, is 'unknown' and
 *    shows NO badge — never a false "0" and never the last number kept from
 *    before the failure.
 *  - No account (guest, anonymous device key) is 'signedOut': no badge.
 *  - NEWEST READ WINS: every read takes a ticket; an older answer that lands
 *    after a newer one is dropped.
 *  - ACCOUNT WIPE: the reset below is registered with the wipe when this module
 *    is first evaluated (the TabBar imports it at boot, before any count can
 *    exist). It bumps a generation, so a read that was in flight for the
 *    departing account can never land on the next one.
 */
import { registerLocalStoreReset } from '../storage/localStoreRegistry';

export type InboxCounts = {
  /** Incoming contact requests still waiting for an answer. */
  pending: number;
  /** Messages from the other side not yet opened. NULL when the server cannot
   *  say yet (read state not deployed) — then only requests are counted. */
  unreadMessages: number | null;
  /** Unread messages per conversation (request id → count). */
  byThread: Readonly<Record<string, number>>;
};

export type InboxState =
  | { status: 'unknown' }
  | { status: 'signedOut' }
  | { status: 'ok'; counts: InboxCounts; at: number };

export type InboxRead = { ok: true; counts: InboxCounts } | { ok: false; signedOut?: boolean };

const UNKNOWN: InboxState = { status: 'unknown' };

let state: InboxState = UNKNOWN;
let gen = 0;
let ticket = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of [...listeners]) {
    try {
      l();
    } catch {
      /* one listener must not stop the others */
    }
  }
}

export function getInboxState(): InboxState {
  return state;
}

export function subscribeInbox(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/**
 * Read the counts.
 *  - `minAgeMs`: skip when a good answer is younger than this (badge mounts).
 *  - `force`: start a NEW read even if one is out — used after a write (a
 *    request answered, a conversation opened) so the answer reflects it.
 * Without `force`, a call made while a read is out shares that read.
 */
export function refreshInbox(
  read: () => Promise<InboxRead>,
  opts: { minAgeMs?: number; force?: boolean; now?: () => number } = {},
): Promise<void> {
  const now = opts.now ?? Date.now;
  if (!opts.force) {
    if (opts.minAgeMs != null && state.status === 'ok' && now() - state.at < opts.minAgeMs) {
      return Promise.resolve();
    }
    if (inflight) return inflight;
  }
  const myTicket = ++ticket;
  const myGen = gen;
  const run = (async () => {
    let r: InboxRead;
    try {
      r = await read();
    } catch {
      r = { ok: false };
    }
    // A newer read was started, or the account changed, while this one was out.
    if (myGen !== gen || myTicket !== ticket) return;
    if (r.ok) state = { status: 'ok', counts: sane(r.counts), at: now() };
    else state = r.signedOut ? { status: 'signedOut' } : UNKNOWN;
    emit();
  })();
  const tracked = run.finally(() => {
    if (inflight === tracked) inflight = null;
  });
  inflight = tracked;
  return tracked;
}

/** Whole, non-negative numbers only — a bad server value never reaches a badge. */
function sane(c: InboxCounts): InboxCounts {
  const whole = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  const byThread: Record<string, number> = {};
  for (const [k, v] of Object.entries(c.byThread ?? {})) {
    const n = whole(v);
    if (n > 0) byThread[k] = n;
  }
  return {
    pending: whole(c.pending),
    unreadMessages: c.unreadMessages == null ? null : whole(c.unreadMessages),
    byThread,
  };
}

/**
 * A conversation was marked read ON THE SERVER (call only after that write
 * succeeded): take its messages off the badge at once, without waiting for the
 * next read. Bumps the ticket, so a read already out (taken before the mark)
 * cannot put the old number back.
 */
export function markThreadSeen(requestId: string): void {
  if (state.status !== 'ok') return;
  const n = state.counts.byThread[requestId] ?? 0;
  if (n <= 0) return;
  ticket += 1;
  inflight = null;
  const byThread = { ...state.counts.byThread };
  delete byThread[requestId];
  const um = state.counts.unreadMessages;
  state = {
    status: 'ok',
    at: state.at,
    counts: { ...state.counts, byThread, unreadMessages: um == null ? null : Math.max(0, um - n) },
  };
  emit();
}

/** Account wipe / identity change: forget everything; no badge until the new
 *  account's own read lands. */
export function resetInbox(): void {
  gen += 1;
  ticket += 1;
  inflight = null;
  state = UNKNOWN;
  emit();
}
registerLocalStoreReset(resetInbox);

/** The number a badge shows, or null for NO badge (unknown, signed out, or 0). */
export function badgeCount(s: InboxState): number | null {
  if (s.status !== 'ok') return null;
  const n = s.counts.pending + (s.counts.unreadMessages ?? 0);
  return n > 0 ? n : null;
}

/** REQUESTS only (pending incoming) — for the incoming section. */
export function pendingCount(s: InboxState): number | null {
  if (s.status !== 'ok') return null;
  return s.counts.pending > 0 ? s.counts.pending : null;
}

/** Unread messages in one conversation, or 0. */
export function threadUnread(s: InboxState, requestId: string): number {
  if (s.status !== 'ok') return 0;
  return s.counts.byThread[requestId] ?? 0;
}

export function badgeText(n: number): string {
  return n > 99 ? '99+' : String(n);
}

/** What a screen reader hears for the badge. */
export function badgeA11y(s: InboxState): string {
  if (s.status !== 'ok') return '';
  const parts: string[] = [];
  const p = s.counts.pending;
  const m = s.counts.unreadMessages ?? 0;
  if (p > 0) parts.push(`${p} contact ${p === 1 ? 'request' : 'requests'} waiting`);
  if (m > 0) parts.push(`${m} new ${m === 1 ? 'message' : 'messages'}`);
  return parts.join(', ');
}
