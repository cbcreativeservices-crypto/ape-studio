/**
 * deviceIdentity — a stable per-install device id for single-device login
 * (owner 2026-08-21). Generated once and persisted under `ape:deviceId`, which
 * is on the clearLocalAccountData KEEP allowlist so it SURVIVES account switches
 * (it identifies the physical install, not the user). Cleared only if the user
 * wipes app data / reinstalls — which is correctly treated as a new device.
 *
 * Not on createLocalStore on purpose: the id is KEEP (the account wipe must not
 * touch it, so it needs no generation fence — it is the same id for every
 * identity on this install), it is written exactly once, and its one rule is
 * the read rule below.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export const DEVICE_ID_KEY = 'ape:deviceId';

/** Thrown by getDeviceId when the stored id could not be READ (pattern catalog
 *  2026-10-02, P1). Callers already fail open on a throw. */
export class DeviceIdUnreadable extends Error {
  constructor() {
    super('device id could not be read');
  }
}

let cached: string | null = null;
/**
 * ONE first read at a time (2026-09-30 day pass). Two callers arriving before
 * the first had cached (the glossary meter and a sign-in's device claim, say)
 * each read an empty key and each MINTED a different id; the claim could go
 * out under one while the displacement check later compared the other, and
 * the device read as displaced by itself and signed itself out.
 */
let pending: Promise<string> | null = null;

/** The stable device id, creating + persisting it on first use. REJECTS
 *  (DeviceIdUnreadable) when the stored id cannot be read — never a new id. */
export function getDeviceId(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  pending ??= readOrCreate().finally(() => {
    pending = null;
  });
  return pending;
}

/** How many times a throwing read is tried before giving up for this call. */
const READ_TRIES = 2;

async function readOrCreate(): Promise<string> {
  /**
   * ⛔ A READ THAT FAILED IS NOT AN EMPTY KEY (wave 2, 2026-10-02). This fell
   * through to MINT A NEW ID and setItem it — over the stored one. One storage
   * hiccup at boot changed the install's identity for good: the server's
   * active device became the new id, the glossary meter's per-device row was
   * left behind (fresh lookups), and an id already claimed elsewhere in this
   * run no longer matched. Only a read that SUCCEEDED and found nothing may
   * mint. A failed read rejects; nothing is cached, so the next call reads
   * again. Every caller fails open on a throw (glossaryCap / glossaryGateway
   * send no device id, claimThisDevice claims nothing, isDisplaced answers
   * false, AuthScreen skips the takeover prompt).
   */
  let readFailed = false;
  for (let i = 0; i < READ_TRIES; i++) {
    try {
      const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (existing) {
        cached = existing;
        return existing;
      }
      readFailed = false;
      break;
    } catch {
      readFailed = true;
    }
  }
  if (readFailed) throw new DeviceIdUnreadable();
  const id = Crypto.randomUUID();
  cached = id;
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    /* in-memory id still works for this run */
  }
  return id;
}
