/**
 * Notifications between members — the CLIENT half (owner decision 2026-10-04).
 * Pure rules and every word: ./communityRules.ts. Server (DRAFT, Comp A):
 * supabase/migrations/2026100401_community_notifications.sql.
 *
 * WHAT THIS DOES
 *  - Reads / saves the person's choices through RPCs (opt-in, OFF by default;
 *    per type: messages, contact requests; message text on the lock screen,
 *    OFF by default).
 *  - Registers THIS phone (stable per-install id + Expo push address) for the
 *    signed-in account, and releases it.
 *
 * WHO OWNS A PHONE (token cleanup — K5)
 *  The server keeps one row per INSTALL (`push_devices.device_id`). Registering
 *  moves that row to the account now signed in, and the foreground sync below
 *  RELEASES it for an account that has alerts off. So after an account switch
 *  the departing account's alerts stop reaching this phone the first time the
 *  new account opens the app — and Log out releases it before signing out.
 *
 * Until Comp A applies the migration every RPC here is missing: Settings does
 * not offer the switch (status 'unsupported'), and nothing else changes.
 */
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { isRealAccount, type MaybeSession } from '../commercial/realAccount';
import { getDeviceId } from '../account/deviceIdentity';
import { registerLocalStoreReset } from '../storage/localStoreRegistry';
import { getExpoPushTokenOnly, getNotifications } from './push';
import {
  COMMUNITY_CHANNEL_ID,
  COMMUNITY_CHANNEL_NAME,
  isMissingRpc,
  prefsFromRow,
  type CommunityNotifyPrefs,
} from './communityRules';

export type CommunityPrefsLoad =
  | { status: 'ok'; prefs: CommunityNotifyPrefs }
  /** The server does not have the feature yet — do not offer it. */
  | { status: 'unsupported' }
  /** No account (guest / anonymous device key) — guests receive nothing. */
  | { status: 'signedOut' }
  /** The read failed or the session could not be read — say so, offer retry. */
  | { status: 'error' };

async function accountUid(where: string): Promise<{ uid: string | null; unknown: boolean }> {
  const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), where);
  if (timedOut) return { uid: null, unknown: true };
  const session = (result.data?.session ?? null) as (MaybeSession & { user?: { id?: string } | null }) | null;
  if (!isRealAccount(session)) return { uid: null, unknown: false };
  return { uid: session?.user?.id ?? null, unknown: false };
}

export async function fetchCommunityPrefs(): Promise<CommunityPrefsLoad> {
  try {
    const who = await accountUid('communityPrefs');
    if (who.unknown) return { status: 'error' };
    if (!who.uid) return { status: 'signedOut' };
    const { data, error } = await supabase.rpc('community_notify_prefs_get');
    if (error) return isMissingRpc(error) ? { status: 'unsupported' } : { status: 'error' };
    const row = (data as unknown[] | null)?.[0];
    if (!row) return { status: 'signedOut' };
    return { status: 'ok', prefs: prefsFromRow(row) };
  } catch {
    return { status: 'error' };
  }
}

/** Save part of the choices. `prefs` is what the SERVER now holds — the
 *  switches show that, never the request. */
export async function saveCommunityPrefs(
  patch: Partial<CommunityNotifyPrefs>,
): Promise<{ ok: true; prefs: CommunityNotifyPrefs } | { ok: false }> {
  try {
    const { data, error } = await supabase.rpc('community_notify_prefs_set', {
      p_push_enabled: patch.pushEnabled ?? null,
      p_messages: patch.messages ?? null,
      p_requests: patch.requests ?? null,
      p_show_preview: patch.showPreview ?? null,
    });
    const row = (data as unknown[] | null)?.[0];
    if (error || !row) return { ok: false };
    return { ok: true, prefs: prefsFromRow(row) };
  } catch {
    return { ok: false };
  }
}

export type OsPermission = 'granted' | 'denied' | 'blocked' | 'unavailable';

/** The phone's own notification permission. `ask` shows the system dialog —
 *  only ever called after our explainer (PermissionPrompt) said ALLOW. */
export async function notificationPermission(ask: boolean): Promise<OsPermission> {
  const N = getNotifications();
  if (!N) return 'unavailable';
  try {
    const now = await N.getPermissionsAsync();
    if (now.status === 'granted') return 'granted';
    if (!ask) return now.canAskAgain === false ? 'blocked' : 'denied';
    if (now.canAskAgain === false) return 'blocked';
    const asked = await N.requestPermissionsAsync();
    if (asked.status === 'granted') return 'granted';
    return asked.canAskAgain === false ? 'blocked' : 'denied';
  } catch {
    // Android refuses a request with no foreground activity — "not granted".
    return 'denied';
  }
}

/**
 * Register THIS phone for the signed-in account's member alerts. True only
 * when the server stored it. Needs the permission already granted.
 */
export async function registerCommunityDevice(): Promise<boolean> {
  try {
    const N = getNotifications();
    if (!N) return false;
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(COMMUNITY_CHANNEL_ID, {
        name: COMMUNITY_CHANNEL_NAME,
        importance: N.AndroidImportance.HIGH,
        lightColor: '#ffc64d',
      });
    }
    const [token, deviceId] = await Promise.all([
      getExpoPushTokenOnly(),
      getDeviceId().catch(() => null),
    ]);
    if (!token || !deviceId) return false;
    const { data, error } = await supabase.rpc('push_device_register', {
      p_device_id: deviceId,
      p_token: token,
      p_platform: Platform.OS,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** Stop alerts reaching THIS phone (whichever account it was registered to). */
export async function releaseCommunityDevice(): Promise<boolean> {
  try {
    const deviceId = await getDeviceId().catch(() => null);
    if (!deviceId) return false;
    const { error } = await supabase.rpc('push_device_release', { p_device_id: deviceId });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Once per account per app run (on launch / first foreground): keep this
 * phone's registration true to the signed-in account's choice.
 *  - alerts ON and permission already granted → register (refreshes a rotated
 *    push address, and takes the phone over from a previous account);
 *  - alerts OFF → release (a previous account's registration stops here).
 * Never asks for permission. An unknown session, a failed read, or a server
 * without the feature does nothing — and is tried again next time.
 */
let syncedFor: string | null = null;
let syncing: Promise<void> | null = null;

export function syncCommunityDevice(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  syncing ??= (async () => {
    const who = await accountUid('communityDeviceSync');
    if (who.unknown || !who.uid || syncedFor === who.uid) return;
    const load = await fetchCommunityPrefs();
    if (load.status !== 'ok') return;
    let ok: boolean;
    if (load.prefs.pushEnabled) {
      ok = (await notificationPermission(false)) === 'granted' ? await registerCommunityDevice() : true;
    } else {
      ok = await releaseCommunityDevice();
    }
    if (ok) syncedFor = who.uid;
  })()
    .catch(() => {})
    .finally(() => {
      syncing = null;
    });
  return syncing;
}

/** Account wipe: the next account syncs afresh. */
export function resetCommunityDeviceSync(): void {
  syncedFor = null;
}
registerLocalStoreReset(resetCommunityDeviceSync);
