/**
 * The server reads behind the community badges (owner decision 2026-10-04).
 *
 * Kept OUT of ./api.ts on purpose: the TabBar badge loads this at app start,
 * and the start-up trim (2026-10-04) moved the directory API off the boot path.
 * This module needs only the shared client.
 *
 * Two server shapes, so it ships by OTA before Comp A applies the migration:
 *  - `contact_inbox_counts()` (migration 2026100401) — pending requests AND
 *    unread messages, per conversation, with blocks and restricted accounts
 *    already left out.
 *  - Until that exists, `contact_threads()` (live today) still gives the
 *    pending incoming requests; unread messages are then UNKNOWN (null) and
 *    simply not counted — never shown as 0.
 */
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { isRealAccount, type MaybeSession } from '../commercial/realAccount';
import { isMissingRpc } from '../notifications/communityRules';
import type { InboxRead } from './inboxCounts';

export async function readInboxCounts(): Promise<InboxRead> {
  try {
    // Unknown session ≠ signed out (K1): a stalled read is 'unknown' — no badge,
    // but nothing claims the person is signed out.
    const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'inboxCounts');
    if (timedOut) return { ok: false };
    const session = (result.data?.session ?? null) as MaybeSession;
    if (!isRealAccount(session)) return { ok: false, signedOut: true };

    const { data, error } = await supabase.rpc('contact_inbox_counts');
    if (!error) {
      const r = (data as Record<string, unknown>[] | null)?.[0];
      // No row = the server found no account behind this session.
      if (!r) return { ok: false, signedOut: true };
      const byThread: Record<string, number> = {};
      const raw = r.unread_by_thread;
      if (raw && typeof raw === 'object') {
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) byThread[k] = Number(v);
      }
      return {
        ok: true,
        counts: {
          pending: Number(r.pending_requests ?? 0),
          unreadMessages: Number(r.unread_messages ?? 0),
          byThread,
        },
      };
    }
    if (!isMissingRpc(error)) return { ok: false };

    // Before the migration: pending incoming requests from the live list.
    const t = await supabase.rpc('contact_threads');
    if (t.error) return { ok: false };
    const rows = (t.data ?? []) as Record<string, unknown>[];
    const pending = rows.filter((x) => x.direction === 'incoming' && x.status === 'pending').length;
    return { ok: true, counts: { pending, unreadMessages: null, byThread: {} } };
  } catch {
    return { ok: false };
  }
}

/**
 * Record that the person has read a conversation up to now. True only when
 * the server stored it. Before the migration the function does not exist and
 * this answers false — nothing was stored, so nothing is claimed.
 */
export async function markThreadRead(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('contact_thread_mark_read', { p_request_id: requestId });
    return !error;
  } catch {
    return false;
  }
}
