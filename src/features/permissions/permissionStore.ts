/**
 * permissionStore — device-local record of the user's PRE-PERMISSION choices
 * (owner 2026-07-29: "use a pop up to ask… allow user to always approve
 * instead of always ask").
 *
 * This is NOT the OS permission (iOS/Android own that and can revoke it any
 * time). It records whether the user asked us to REMEMBER their choice so we
 * skip our own explainer popup next time:
 *   • 'ask'    — show the pre-permission explainer before the OS dialog.
 *   • 'always' — the user ticked "always allow / don't ask again": go straight
 *                to the OS request (which itself only prompts once — after that
 *                the OS returns the remembered grant, no dialog).
 *   • 'never'  — the user chose "don't ask again" while declining: we skip the
 *                feature and point them to Settings, no nagging.
 *
 * Capabilities: 'camera' (optical Hz counter), 'location' (snapshot GPS),
 * 'photo' (snapshot room photo).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CapabilityKey = 'camera' | 'location' | 'photo';
export type AskMode = 'ask' | 'always' | 'never';

const KEY = (c: CapabilityKey) => `ape:perm:${c}`;

const cache: Partial<Record<CapabilityKey, AskMode>> = {};

export async function getAskMode(cap: CapabilityKey): Promise<AskMode> {
  if (cache[cap]) return cache[cap]!;
  try {
    const v = (await AsyncStorage.getItem(KEY(cap))) as AskMode | null;
    const mode: AskMode = v === 'always' || v === 'never' ? v : 'ask';
    cache[cap] = mode;
    return mode;
  } catch {
    return 'ask';
  }
}

export async function setAskMode(cap: CapabilityKey, mode: AskMode): Promise<void> {
  cache[cap] = mode;
  try {
    await AsyncStorage.setItem(KEY(cap), mode);
  } catch {
    /* best-effort */
  }
}

/** Settings "Reset permission prompts" — clears every remembered choice so the
 *  explainer shows again (the OS grant itself is untouched). */
export async function resetAskModes(): Promise<void> {
  for (const c of ['camera', 'location', 'photo'] as CapabilityKey[]) {
    delete cache[c];
    try {
      await AsyncStorage.removeItem(KEY(c));
    } catch {
      /* best-effort */
    }
  }
}
