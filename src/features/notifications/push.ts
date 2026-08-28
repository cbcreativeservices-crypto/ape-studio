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
function getNotifications(): NotificationsModule | null {
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

async function authUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
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

  const uid = await authUserId();
  if (!uid) return token;

  const { error } = await supabase
    .from('notification_preferences')
    .update({
      expo_push_token: token,
      push_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', uid);
  if (error) console.warn('[push] token save failed:', error.message);
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

export function attachWeeklyConceptPush(nav: NavFn): () => void {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const payload = payloadFromResponse(response);
    if (!payload) return;
    nav(payload);
  });

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    const payload = payloadFromResponse(response);
    if (!payload) return;
    nav(payload);
    void Notifications.clearLastNotificationResponseAsync();
  });

  return () => sub.remove();
}
