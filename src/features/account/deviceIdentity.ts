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

/** The stable device id, creating + persisting it on first use. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
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
