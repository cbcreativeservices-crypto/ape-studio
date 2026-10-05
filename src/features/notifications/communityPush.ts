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
import { deviceTimeZone, isUnknownTimeZone, quietFromRow, type QuietWindow } from './quietHours';
import { rememberQuietWindow, resyncLocalNotifications } from './localSchedule';

export type CommunityPrefsLoad =
  | { status: 'ok'; prefs: CommunityNotifyPrefs; quiet: QuietWindow }
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
    const quiet = quietFromRow(row);
    adoptQuietWindow(quiet);
    return { status: 'ok', prefs: prefsFromRow(row), quiet };
  } catch {
    return { status: 'error' };
  }
}

/** What a save may change: any of the switches, and the quiet-hours window. */
export type CommunityPrefsPatch = Partial<CommunityNotifyPrefs> & { quiet?: Partial<QuietWindow> };

/**
 * The `community_notify_prefs_set` arguments for a patch. Every call carries
 * the phone's time zone as `p_tz` (Comp A's quiet-hours contract), so the
 * window is applied in the zone the member is in; NULL means "unchanged" for
 * every other argument. Pure — tested directly.
 */
export function prefsSetArgs(patch: CommunityPrefsPatch, tz: string | null): Record<string, unknown> {
  return {
    p_push_enabled: patch.pushEnabled ?? null,
    p_messages: patch.messages ?? null,
    p_requests: patch.requests ?? null,
    p_show_preview: patch.showPreview ?? null,
    p_quiet_enabled: patch.quiet?.enabled ?? null,
    p_quiet_start: patch.quiet?.start ?? null,
    p_quiet_end: patch.quiet?.end ?? null,
    p_tz: tz,
  };
}

/**
 * One `community_notify_prefs_set` call. A zone the server does not know
 * (`unknown time zone`) is retried ONCE without it, so an odd zone name never
 * stops the member saving their other choices.
 */
async function callPrefsSet(patch: CommunityPrefsPatch): Promise<{ row: unknown | null; error: { code?: string | null; message?: string | null } | null }> {
  const tz = deviceTimeZone();
  let { data, error } = await supabase.rpc('community_notify_prefs_set', prefsSetArgs(patch, tz));
  if (error && tz && isUnknownTimeZone(error)) {
    ({ data, error } = await supabase.rpc('community_notify_prefs_set', prefsSetArgs(patch, null)));
  }
  return { row: (data as unknown[] | null)?.[0] ?? null, error };
}

/** Save part of the choices. `prefs` / `quiet` are what the SERVER now holds —
 *  the switches and times show that, never the request. */
export async function saveCommunityPrefs(
  patch: CommunityPrefsPatch,
): Promise<{ ok: true; prefs: CommunityNotifyPrefs; quiet: QuietWindow } | { ok: false }> {
  try {
    const { row, error } = await callPrefsSet(patch);
    if (error || !row) return { ok: false };
    const quiet = quietFromRow(row);
    adoptQuietWindow(quiet);
    return { ok: true, prefs: prefsFromRow(row), quiet };
  } catch {
    return { ok: false };
  }
}

/** The server's window → this device's copy; a change re-books the local
 *  reminders so they follow it (localSchedule.ts, "quiet hours"). */
function adoptQuietWindow(w: QuietWindow): void {
  void rememberQuietWindow(w)
    .then((changed) => {
      if (changed) resyncLocalNotifications();
    })
    .catch(() => {});
}

/**
 * Once per account (and zone) per app run: tell the server this phone's time
 * zone — the call with ONLY `p_tz` set — so a member who never opens
 * Settings has quiet hours in the right zone. Not on web (alerts reach the
 * phone app only, and a browser elsewhere must not move the phone's zone).
 * A server without the feature, or a zone it refuses, is not asked again
 * this run; any other failure is retried on the next foreground.
 */
let tzSentFor: string | null = null;

export async function syncQuietTimeZone(uid: string): Promise<void> {
  const tz = deviceTimeZone();
  if (!tz) return;
  const key = `${uid}|${tz}`;
  if (tzSentFor === key) return;
  const { data, error } = await supabase.rpc('community_notify_prefs_set', { p_tz: tz });
  if (error) {
    if (isMissingRpc(error) || isUnknownTimeZone(error)) tzSentFor = key;
    return;
  }
  tzSentFor = key;
  const row = (data as unknown[] | null)?.[0];
  if (row) adoptQuietWindow(quietFromRow(row));
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
 * Once per account per app run (on launch / first foreground): send this
 * phone's time zone for quiet hours (syncQuietTimeZone), and keep this
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
    if (who.unknown || !who.uid) return;
    await syncQuietTimeZone(who.uid).catch(() => {});
    if (syncedFor === who.uid) return;
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
  tzSentFor = null;
}
registerLocalStoreReset(resetCommunityDeviceSync);
