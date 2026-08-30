/**
 * Expo push token registration + weekly-concept tap handling.
 * Native only — web has no Expo push pipeline.
 * Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import { payloadFromUnknown, type WeeklyConceptPayload } from './weeklyConcept';

// Type-only import — erased at runtime, never touches the native module.
import type * as NotificationsTypes from 'expo-notifications';

const CHANNEL_ID = 'weekly-concept';

/**
 * GUARDED LAZY REQUIRE (house rule — "never call a native module before a
 * build that contains it", the 2026-08-21 IAP lesson): a top-level
 * `import 'expo-notifications'` calls requireNativeModule('ExpoPushTokenManager')
 * at startup and HARD-CRASHES any dev client built before the module was added
 * ("[runtime not ready]" on 2026-08-27). Until a NEW EAS build ships the native
 * side, this returns null and every push feature fails soft.
 */
type NotificationsModule = typeof NotificationsTypes;
let notifMod: NotificationsModule | null | undefined;
export function getNotifications(): NotificationsModule | null {
  if (notifMod !== undefined) return notifMod;
  if (Platform.OS === 'web') {
    notifMod = null;
    return null;
  }
  try {
    // Probe the NATIVE side first via the optional API: requiring
    // expo-notifications on a build without it throws inside Metro's guarded
    // module loader, which RedBoxes in dev even around a try/catch
    // (house pattern: requireOptionalNativeModule — returns null, never throws).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const core = require('expo-modules-core') as typeof import('expo-modules-core');
    if (!core.requireOptionalNativeModule('ExpoPushTokenManager')) {
      console.warn('[push] expo-notifications native module missing (needs a new dev build) — push disabled');
      notifMod = null;
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('expo-notifications') as NotificationsModule;
    m.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notifMod = m;
  } catch {
    console.warn('[push] expo-notifications native module missing (needs a new dev build) — push disabled');
    notifMod = null;
  }
  return notifMod;
}

type NavFn = (payload: WeeklyConceptPayload) => void;

let pending: WeeklyConceptPayload | null = null;

export function queueWeeklyConcept(payload: WeeklyConceptPayload): void {
  pending = payload;
}

export function flushWeeklyConceptNav(nav: NavFn): void {
  if (!pending) return;
  const next = pending;
  pending = null;
  nav(next);
}

/**
 * TWO DIFFERENT IDENTITIES (verified in the DB 2026-08-30 — this bit me):
 *   notification_preferences.user_id            = public.users.id  (app id)
 *   notification_concept_subscriptions.user_id  = auth.users.id    (auth uid)
 * Their RLS policies encode exactly that difference. Writing the auth uid into
 * notification_preferences matches ZERO rows — and `.update().eq()` reports NO
 * error when it matches nothing, so the push token silently never saved.
 * Always resolve the app id before touching notification_preferences.
 */
async function appUserId(): Promise<string | null> {
  const { data, error } = await supabase.from('users').select('id').maybeSingle();
  if (error) {
    console.warn('[push] app user lookup failed:', error.message);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}

export async function registerAndSavePushToken(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Weekly concepts',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#ffc64d',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] missing eas.projectId');
    return null;
  }

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    console.warn('[push] getExpoPushTokenAsync failed:', e);
    return null;
  }

  const uid = await appUserId(); // app id — NOT the auth uid (see appUserId)
  if (!uid) return token;

  const { data, error } = await supabase
    .from('notification_preferences')
    .update({
      expo_push_token: token,
      push_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', uid)
    .select('user_id');
  if (error) console.warn('[push] token save failed:', error.message);
  // A no-match update is NOT an error — say so loudly rather than pretending
  // the token is stored (the 2026-08-30 silent-failure lesson).
  else if (!data?.length) console.warn('[push] token save matched no prefs row for', uid);
  return token;
}

function payloadFromResponse(
  response: NotificationsTypes.NotificationResponse | null,
): WeeklyConceptPayload | null {
  const content = response?.notification.request.content;
  if (!content) return null;
  const data = (content.data ?? {}) as Record<string, unknown>;
  return payloadFromUnknown({
    ...data,
    concept: data.concept ?? content.title,
  });
}

/** Tap payload from a LOCAL reminder (localSchedule.ts) — `dest` names an
 *  in-app destination the caller maps to a route. */
function localDestFromResponse(
  response: NotificationsTypes.NotificationResponse | null,
): string | null {
  const data = (response?.notification.request.content.data ?? {}) as Record<string, unknown>;
  if (data.type !== 'local') return null;
  return typeof data.dest === 'string' ? data.dest : '';
}

export function attachWeeklyConceptPush(
  nav: NavFn,
  onLocal?: (dest: string) => void,
): () => void {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};

  const route = (response: NotificationsTypes.NotificationResponse | null): boolean => {
    const payload = payloadFromResponse(response);
    if (payload) {
      nav(payload);
      return true;
    }
    const dest = localDestFromResponse(response);
    if (dest !== null) {
      if (dest && onLocal) onLocal(dest);
      return true;
    }
    return false;
  };

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    route(response);
  });

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!route(response)) return;
    void Notifications.clearLastNotificationResponseAsync();
  });

  return () => sub.remove();
}
