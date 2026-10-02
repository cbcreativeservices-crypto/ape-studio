/**
 * firstOpen — is this the app's FIRST open on this device?
 *
 * Owner 2026-09-29: "The intro lab should be the default spot only for the
 * first time the user opens the app" — Home lands on Start Here that once, and
 * on Glossary (the normal default) every open after.
 *
 * The first call of a launch reads the flag and, if it was absent, writes it
 * straight away — so the NEXT launch is no longer the first. The answer is
 * cached for the rest of this launch, so Home re-mounting inside the same
 * session still sees "first open".
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FIRST_OPEN_KEY = 'ape:homeFirstOpenDone';

/** Home's onboarding record (attractStore) — its `firstSeenAt` stamp. */
const HOME_SEEN_KEY = 'ape:homeAttract2';

async function seenHomeBefore(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(HOME_SEEN_KEY);
    const at = raw ? (JSON.parse(raw) as { firstSeenAt?: number | null }).firstSeenAt : null;
    return typeof at === 'number' && Date.now() - at > 60_000;
  } catch {
    return false;
  }
}

let cached: Promise<boolean> | null = null;

export function isFirstAppOpen(): Promise<boolean> {
  if (!cached) {
    cached = (async () => {
      try {
        // READ failed → the catch below (wave 2, 2026-10-02, confirmed): the
        // normal Glossary landing, nothing re-shown, and the flag is NOT
        // written — the only write follows a read that answered "absent".
        const seen = await AsyncStorage.getItem(FIRST_OPEN_KEY);
        if (seen) return false;
        await AsyncStorage.setItem(FIRST_OPEN_KEY, '1').catch(() => {});
        // Someone who had the app BEFORE this flag existed is not a first
        // open: Home's onboarding record already holds when they first saw
        // Home. (A sighting under a minute old is this very launch.)
        return !(await seenHomeBefore());
      } catch {
        return false; // storage unavailable → the normal Glossary landing
      }
    })();
  }
  return cached;
}
