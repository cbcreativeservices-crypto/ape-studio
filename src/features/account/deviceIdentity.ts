/**
 * deviceIdentity — a stable per-install device id for single-device login
 * (owner 2026-08-21). Generated once and persisted under `ape:deviceId`, which
 * is on the clearLocalAccountData KEEP allowlist so it SURVIVES account switches
 * (it identifies the physical install, not the user). Cleared only if the user
 * wipes app data / reinstalls — which is correctly treated as a new device.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export const DEVICE_ID_KEY = 'ape:deviceId';

let cached: string | null = null;
/**
 * ONE first read at a time (2026-09-30 day pass). Two callers arriving before
 * the first had cached (the glossary meter and a sign-in's device claim, say)
 * each read an empty key and each MINTED a different id; the claim could go
 * out under one while the displacement check later compared the other, and
 * the device read as displaced by itself and signed itself out.
 */
let pending: Promise<string> | null = null;

/** The stable device id, creating + persisting it on first use. */
export function getDeviceId(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  pending ??= readOrCreate().finally(() => {
    pending = null;
  });
  return pending;
}

async function readOrCreate(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
  } catch {
    /* fall through to generate */
  }
  const id = Crypto.randomUUID();
  cached = id;
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    /* in-memory id still works for this run */
  }
  return id;
}
