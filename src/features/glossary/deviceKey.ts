/**
 * Glossary temporary device key — consent state machine (owner 2026-09-13).
 *
 * WHY THIS EXISTS. `glossary` is anon-SELECTable today, so the 14-a-week free
 * allowance is a UI convention: anyone holding the shipped anon key can pull all
 * 26,855 definitions from the REST API in one request. Owner: *"i need the
 * database to be protected — so the definitions need to come through a counting
 * gateway on the server"*. A server cannot meter a caller it cannot name, and a
 * guest has no name — so the glossary asks for one: an anonymous Supabase user,
 * with consent, disposable after 7 days.
 *
 * Plan + copy: docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md.
 *
 * ⚠️ THE ID IS NOT AN ACCOUNT. `EntitlementProvider.isRealAccount()` keeps
 * `entitlement === 'anonymous'` true for these users, so Settings, the awards
 * screens and CredentialWall all keep treating them as guests. Read that
 * docblock before changing anything here.
 *
 * RENEWAL, stated plainly. The nightly purge deletes anonymous users older than
 * 7 days, which is the promise the dialog makes. A device whose key has been
 * purged needs another one to keep reading definitions, and we mint it WITHOUT
 * re-asking: the consent was to the practice (a rolling 7-day key, no other data
 * attached), and every individual key still dies on schedule. Re-asking weekly
 * would be friction without a matching gain in honesty. The record below keeps
 * the grant timestamp so this is auditable, and DECLINE is never remembered as
 * final — it lasts the visit, and the screen offers the ask again.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../lib/supabase';
import { classifyMintError, singleFlight, type ConsentRecord } from './deviceKeyState';

export * from './deviceKeyState';

const CONSENT_KEY = 'ape:glossaryDeviceKeyConsent';

/** Read the stored consent. Unreadable storage is treated as "no consent" — the
 *  dialog is cheap and a wrongly-assumed grant is not. */
export async function readConsent(): Promise<ConsentRecord> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { granted?: unknown; at?: unknown };
    return v && v.granted === true && typeof v.at === 'number' ? { granted: true, at: v.at } : null;
  } catch {
    return null;
  }
}

export async function writeConsent(at = Date.now()): Promise<ConsentRecord> {
  const rec: ConsentRecord = { granted: true, at };
  try {
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(rec));
  } catch {
    /* best-effort — a failed write just means we ask again next launch */
  }
  return rec;
}

/** Used by "forget this device" style flows and by tests. */
export async function clearConsent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CONSENT_KEY);
  } catch {
    /* nothing to do */
  }
}

export type MintResult = { ok: true } | { ok: false; reason: 'disabled' | 'network' | 'unknown'; message: string };

const mintOnce = singleFlight<MintResult>();

/**
 * Mint the temporary key. Requires anonymous sign-ins to be ENABLED in the
 * Supabase dashboard (Auth → Providers); they are off by default, and the
 * failure is a runtime 422, not a build error — hence the explicit 'disabled'
 * reason so the screen can fail open rather than look broken.
 *
 * ⚠️ TWO GUARDS AGAINST MINTING MORE THAN ONE KEY, both added after the first
 * live run created two 67 microseconds apart:
 *   - `mintOnce` collapses concurrent callers into one request;
 *   - the getSession() check ahead of it means a key that has ALREADY arrived
 *     (from the other caller, or restored from storage) is reused rather than
 *     duplicated.
 * Every extra key is a real row in auth.users that nobody is using and that
 * survives until the nightly purge.
 */
export function mintDeviceKey(): Promise<MintResult> {
  return mintOnce(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) return { ok: true };
      const { error } = await supabase.auth.signInAnonymously();
      if (!error) return { ok: true };
      return { ok: false, reason: classifyMintError(error.message), message: error.message };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, reason: classifyMintError(message), message };
    }
  });
}
