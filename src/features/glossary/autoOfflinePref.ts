/**
 * "Keep the glossary on this phone" — the off switch for the background save.
 *
 * Owner 2026-09-22 chose automatic-with-an-off-switch over asking first: 5.4 MB
 * is one photo, and a member should not have to go and find a button for it.
 * The switch exists because the download cannot yet tell wi-fi from cellular
 * (see offlinePrefetch), so somebody on a metered or satellite connection needs
 * a way to say no.
 *
 * ⛔ DEFAULT ON, and a failed read must also return ON — the feature the owner
 * asked for is that it simply happens. Failing to OFF would turn a flaky
 * storage read into a phone that silently never saves anything.
 *
 * ⛔ ON THE KEEP LIST. `clearLocalAccountData` wipes every `ape:*` key except an
 * allowlist, and a preference swept on an account switch would silently revert.
 * That exact trap cost a real bug earlier the same day with the Profile
 * big-picture toggle — see docs/APE_ENGINEERING_LESSONS.md (2026-09-22).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTO_OFFLINE_KEY = 'ape:glossary:autoOffline';

export async function autoOfflineEnabled(): Promise<boolean> {
  try {
    // Anything other than an explicit '0' is on, so a corrupt value fails ON.
    return (await AsyncStorage.getItem(AUTO_OFFLINE_KEY)) !== '0';
  } catch {
    return true;
  }
}

export async function setAutoOffline(on: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTO_OFFLINE_KEY, on ? '1' : '0');
  } catch {
    // Non-fatal — the switch still reflects the choice for this session.
  }
}
