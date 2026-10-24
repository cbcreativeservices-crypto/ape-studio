/**
 * Commercial signup (CM5, Booth 2026-07-11 → LIVE 2026-07-16). Open
 * email+password account creation for consumer users, then the deployed
 * `register_commercial_user(p_nickname text, p_favorites jsonb)` RPC creates
 * the users row (audience='commercial', APE-C-... student id) and seeds the
 * free topics. `already_registered` is treated as success (idempotent re-auth).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_CALL_MS, ensureSession, signOutHalfCreatedAccount } from '../auth/api';
import { ACCOUNT_SETUP_UNFINISHED } from '../auth/authErrorCopy';
import { supabase } from '../../lib/supabase';
import { withDeadline } from '../../lib/boundedCall';

// Device-local glossary state (anonymous favorites/history) — migrated on signup.
const FAVS_KEY = 'ape:glossaryFavs';
const RECENT_KEY = 'ape:glossaryRecent';

export type FavoritesMigration = { favorites: string[]; recent: string[] };

/** Collect the anonymous device-local glossary state to migrate on signup. */
export async function collectFavoritesMigration(): Promise<FavoritesMigration> {
  // A storage READ that throws must not block signup either (evening hunt 1,
  // 2026-10-02): it rejected straight through registerCommercialUser AFTER the
  // auth account was made, so the users row was never created and every retry
  // failed the same way. Unreadable = nothing to migrate (read-only: nothing
  // is written from it).
  const [f, r] = await Promise.all([
    AsyncStorage.getItem(FAVS_KEY).catch(() => null),
    AsyncStorage.getItem(RECENT_KEY).catch(() => null),
  ]);
  // Defensive parse: a corrupt anonymous glossary blob must NEVER throw here —
  // this runs on the signup path and would otherwise block account creation.
  const safeList = (v: string | null): string[] => {
    if (!v) return [];
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? (a as string[]) : [];
    } catch {
      return [];
    }
  };
  return { favorites: safeList(f), recent: safeList(r) };
}

/** `created`: the server made a NEW account just now (status 'ok'), not an
 *  existing one signing back in ('already_registered'). */
export type CommercialSignupResult = { success: true; created: boolean } | { success: false; error: string };

/**
 * Create a commercial account: real auth session, then the registration RPC.
 * Nickname defaults to the email local-part (no nickname field on the CM5
 * form yet); the user can change it later on Profile.
 */
export async function registerCommercialUser(email: string, password: string): Promise<CommercialSignupResult> {
  // 1. Auth account + session.
  const sessionErr = await ensureSession(email.trim(), password);
  if (sessionErr) return { success: false, error: sessionErr };

  // 2. Registration RPC — creates the users row + seeds free topics.
  const nickname = email.trim().split('@')[0] || 'Student';
  const migration = await collectFavoritesMigration();
  // BOUNDED (night bug pass 1, 2026-10-01). A stall is caught HERE now (it
  // used to reject into the Auth screen's "check your connection").
  let data: unknown = null;
  let error: { message?: string } | null = null;
  try {
    ({ data, error } = await withDeadline(
      async () =>
        await supabase.rpc('register_commercial_user', {
          p_nickname: nickname,
          p_favorites: migration.favorites,
        }),
      'register_commercial_user',
      AUTH_CALL_MS,
    ));
  } catch (e) {
    error = { message: (e as Error)?.message ?? 'register_commercial_user failed' };
  }
  const status = error ? null : (data as { status?: string } | null)?.status;
  // 'already_registered' = an existing commercial user re-authenticating — fine.
  if (status === 'ok' || status === 'already_registered') return { success: true, created: status === 'ok' };
  if (error) console.warn('[commercial] register_commercial_user failed:', error.message);
  else console.warn('[commercial] register_commercial_user status:', status);
  /**
   * ⛔ A HALF-CREATED ACCOUNT IS SIGNED OUT (toddler hunt 2026-10-14, item 7,
   * owner-approved). The auth account and its session exist by now, but the
   * app record does not (or we cannot tell — a stall). Left signed in, RETURN,
   * LOGIN or a relaunch walked into an account with no record. The device is
   * signed out (bounded, local, never rejects) and the person is asked to try
   * again: CREATE ACCOUNT with the same email signs back in and finishes the
   * record (ensureSession → "already registered" → sign in → this RPC).
   */
  await signOutHalfCreatedAccount();
  return { success: false, error: ACCOUNT_SETUP_UNFINISHED };
}
