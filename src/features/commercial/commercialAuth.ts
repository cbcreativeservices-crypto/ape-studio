/**
 * Commercial signup (CM5, Booth 2026-07-11 → LIVE 2026-07-16). Open
 * email+password account creation for consumer users, then the deployed
 * `register_commercial_user(p_nickname text, p_favorites jsonb)` RPC creates
 * the users row (audience='commercial', APE-C-... student id) and seeds the
 * free topics. `already_registered` is treated as success (idempotent re-auth).
 *
 * The class-code path (register_student) is UNTOUCHED — commercial users who
 * have a class code use the existing two-step verify/claim flow.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureSession } from '../auth/api';
import { supabase } from '../../lib/supabase';

// Device-local glossary state (anonymous favorites/history) — migrated on signup.
const FAVS_KEY = 'ape:glossaryFavs';
const RECENT_KEY = 'ape:glossaryRecent';

export type FavoritesMigration = { favorites: string[]; recent: string[] };

/** Collect the anonymous device-local glossary state to migrate on signup. */
export async function collectFavoritesMigration(): Promise<FavoritesMigration> {
  const [f, r] = await Promise.all([AsyncStorage.getItem(FAVS_KEY), AsyncStorage.getItem(RECENT_KEY)]);
  return {
    favorites: f ? (JSON.parse(f) as string[]) : [],
    recent: r ? (JSON.parse(r) as string[]) : [],
  };
}

export type CommercialSignupResult = { success: true } | { success: false; error: string };

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
  const { data, error } = await supabase.rpc('register_commercial_user', {
    p_nickname: nickname,
    p_favorites: migration.favorites,
  });
  if (error) {
    console.warn('[commercial] register_commercial_user failed:', error.message);
    return { success: false, error: 'Could not complete registration. Please try again.' };
  }
  const status = (data as { status?: string } | null)?.status;
  // 'already_registered' = an existing commercial user re-authenticating — fine.
  if (status === 'ok' || status === 'already_registered') return { success: true };
  console.warn('[commercial] register_commercial_user status:', status);
  return {
    success: false,
    error: status === 'nickname_required' ? 'A nickname is required.' : 'Could not complete registration.',
  };
}
