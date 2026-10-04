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
 * 'photo' (snapshot room photo), 'mic' (live measurement capture — copy ready
 * in PermissionPrompt; wiring into the engine start path is a build-owner
 * change, see docs/audit/night_2026_09_13/mic_engine_rename.md).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { armSaveFailureReport } from '../storage/saveFailureNotice';

export type CapabilityKey = 'camera' | 'location' | 'photo' | 'mic' | 'notifications';
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
    // READ failed (wave 2, 2026-10-02, confirmed): answer 'ask' — the
    // explainer shows, which is the consent-safe side — and cache NOTHING, so
    // the next call reads again. Nothing is written here; the only writes are
    // the user's own whole-value choice (setAskMode) and the Settings reset, so
    // a failed read can never be saved over a stored "always"/"never".
    return 'ask';
  }
}

export async function setAskMode(cap: CapabilityKey, mode: AskMode): Promise<void> {
  cache[cap] = mode;
  const reportRefused = armSaveFailureReport();
  try {
    await AsyncStorage.setItem(KEY(cap), mode);
  } catch {
    // The user's "always" / "never" holds for this session; a refusal is
    // told, so they know it will not be remembered (owner 2026-10-03).
    reportRefused();
  }
}

/**
 * Forget the in-memory cache only — the account-wipe entry point.
 *
 * The stored keys are under `ape:` and the sweep deletes them, but `cache` is a
 * module-level object that survives it, so the NEXT person on this device
 * inherited the departing user's "never ask me again" for the camera,
 * microphone, photos and location (2026-09-17). Those are consent decisions;
 * they belong to a person, not to a handset.
 */
export function resetAskModeCache(): void {
  for (const c of Object.keys(cache) as CapabilityKey[]) delete cache[c];
}

/** Settings "Reset permission prompts" — clears every remembered choice so the
 *  explainer shows again (the OS grant itself is untouched). REJECTS when a
 *  stored choice could not be removed (owner 2026-10-03: "if it fails the user
 *  needs to know"): Settings said "reset" while a stored "never" came back on
 *  the next launch. The rest are still cleared. */
export async function resetAskModes(): Promise<void> {
  let refused = false;
  for (const c of ['camera', 'location', 'photo', 'mic', 'notifications'] as CapabilityKey[]) {
    delete cache[c];
    try {
      await AsyncStorage.removeItem(KEY(c));
    } catch {
      refused = true; // Settings says so (one message, its own)
    }
  }
  if (refused) throw new Error('a remembered permission choice could not be removed');
}
