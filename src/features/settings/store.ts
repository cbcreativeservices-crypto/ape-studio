/**
 * Settings — S11. Two backends:
 *  - Device/accessibility settings → AsyncStorage (local, immediate).
 *  - Notification toggles → notification_preferences (own row, created by
 *    register_student; the 6 LIVE columns only — r7/F-6 and C-5 exclusions).
 * Immediate writes, no Save button (locked). Color-blind mode (D-1): the
 * design omits it, but the locked S11 spec requires a 5-option selector.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export type ColorBlindMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
export const COLOR_BLIND_MODES: { key: ColorBlindMode; label: string }[] = [
  { key: 'off', label: 'Off' },
  { key: 'protanopia', label: 'Protan' },
  { key: 'deuteranopia', label: 'Deutan' },
  { key: 'tritanopia', label: 'Tritan' },
  { key: 'monochrome', label: 'Mono' },
];

export type FontSize = 13 | 16 | 19 | 24;
export const FONT_SIZES: FontSize[] = [13, 16, 19, 24];

export type LocalSettings = {
  darkMode: boolean; // dark is the only shipped theme; stored for spec parity
  fontSize: FontSize;
  highContrast: boolean;
  colorBlind: ColorBlindMode;
  reduceAnimations: boolean;
  haptics: boolean;
  // Daily Term push — one glossary term delivered per day (Booth 2026-07-11 #3).
  // Device-local intent flag; notification_preferences (server) is frozen, so
  // this lives in AsyncStorage. Actual scheduling wires with expo-notifications
  // (not yet installed) — ROUTE TO GOVERNANCE for the delivery job.
  dailyTerms: boolean;
};

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  darkMode: true,
  fontSize: 16,
  highContrast: false,
  colorBlind: 'off',
  reduceAnimations: false,
  haptics: true,
  dailyTerms: false,
};

const KEY = 'ape:settings';

// Synchronous mirror of the "Haptic feedback" toggle so low-level components
// (e.g. SwitchButton) can honour it without an async read (Booth 2026-07-11 #4).
let hapticsOn = DEFAULT_LOCAL_SETTINGS.haptics;
export function hapticsEnabled(): boolean {
  return hapticsOn;
}

export async function loadLocalSettings(): Promise<LocalSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const merged = raw ? { ...DEFAULT_LOCAL_SETTINGS, ...JSON.parse(raw) } : DEFAULT_LOCAL_SETTINGS;
    hapticsOn = merged.haptics;
    return merged;
  } catch {
    return DEFAULT_LOCAL_SETTINGS;
  }
}

export async function saveLocalSettings(s: LocalSettings): Promise<void> {
  hapticsOn = s.haptics;
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

/* ---- notification preferences (server row) ---- */

export type NotificationPrefs = {
  push_enabled: boolean;
  email_enabled: boolean;
  notify_trophy: boolean;
  notify_badge: boolean;
  notify_quiz_unlock: boolean;
  notify_method_complete: boolean;
};

export const NOTIFICATION_ROWS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'push_enabled', label: 'Push' },
  { key: 'email_enabled', label: 'Email' },
  { key: 'notify_trophy', label: 'Trophy Earned' },
  { key: 'notify_badge', label: 'Badge Earned' },
  { key: 'notify_quiz_unlock', label: 'Quiz Unlocked' },
  { key: 'notify_method_complete', label: 'Method Complete' },
];

export async function fetchNotificationPrefs(): Promise<NotificationPrefs | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('push_enabled, email_enabled, notify_trophy, notify_badge, notify_quiz_unlock, notify_method_complete')
    .maybeSingle();
  if (error) {
    console.warn('[settings] prefs fetch failed:', error.message);
    return null;
  }
  return (data as NotificationPrefs) ?? null;
}

/** Immediate single-toggle write; returns false on failure (caller reverts). */
export async function updateNotificationPref(
  key: keyof NotificationPrefs,
  value: boolean,
): Promise<boolean> {
  const { data: user } = await supabase.from('users').select('id').single();
  if (!user) return false;
  const { error } = await supabase
    .from('notification_preferences')
    .update({ [key]: value, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);
  if (error) console.warn('[settings] pref update failed:', error.message);
  return !error;
}
