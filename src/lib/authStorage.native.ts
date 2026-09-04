/**
 * authStorage (native) — encrypted persistence for the Supabase auth session.
 *
 * SECURITY (vibe-security 2026-09-04): the session JWT + refresh token must NOT
 * sit in AsyncStorage (plaintext on disk, trivially readable on a rooted /
 * jailbroken device). Here it lives in the OS keychain / keystore via
 * `expo-secure-store`.
 *
 * expo-secure-store is a NATIVE module, and its JS entry resolves that module
 * at IMPORT time — on a dev client built BEFORE the module was added, a static
 * `import` throws "Cannot find native module 'ExpoSecureStore'" and red-screens
 * the whole app. So it is loaded through a guarded `require`: if the native
 * module is absent (a stale dev client), we fall back to AsyncStorage so the
 * app still boots, and it auto-upgrades to the keychain once the client is
 * rebuilt. Release builds always ship the native module (config plugin), so
 * they always get the keychain.
 *
 * expo-secure-store caps a single value at ~2 KB and a Supabase session can be
 * larger, so keychain values are CHUNKED: the base key holds either the value
 * or a "__sbchunks__:N" marker, and the N parts live at `<key>.0 … <key>.N-1`.
 *
 * The `.native.ts` / `.ts` split (Metro platform resolution) keeps this out of
 * the web bundle entirely; web uses AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

type SecureStoreModule = typeof import('expo-secure-store');

// Guarded load: a literal require so Metro still bundles the package, wrapped so
// a missing native module (stale client) degrades to AsyncStorage instead of
// crashing at import.
let SecureStore: SecureStoreModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const mod = require('expo-secure-store') as SecureStoreModule;
  // Touch a member so the native-module binding resolves HERE (inside the try),
  // not lazily on first call.
  SecureStore = typeof mod?.getItemAsync === 'function' ? mod : null;
} catch {
  SecureStore = null;
}

/** True on a build that actually carries the ExpoSecureStore native module. */
export const secureStoreAvailable = SecureStore != null;

const CHUNK = 1800; // bytes, safely under the ~2 KB SecureStore limit
const MARKER = /^__sbchunks__:(\d+)$/;

/** SecureStore keys allow only [A-Za-z0-9._-]; Supabase keys already comply,
 *  but sanitise defensively so a future key can never throw. */
const safe = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_');

async function secureGet(store: SecureStoreModule, key: string): Promise<string | null> {
  const head = await store.getItemAsync(safe(key));
  if (head == null) return null;
  const m = MARKER.exec(head);
  if (!m) return head;
  const n = Number(m[1]);
  let out = '';
  for (let i = 0; i < n; i++) {
    const part = await store.getItemAsync(safe(`${key}.${i}`));
    if (part == null) return null; // torn write — treat as absent
    out += part;
  }
  return out;
}

async function secureRemove(store: SecureStoreModule, key: string): Promise<void> {
  const head = await store.getItemAsync(safe(key));
  const m = head ? MARKER.exec(head) : null;
  if (m) {
    const n = Number(m[1]);
    for (let i = 0; i < n; i++) await store.deleteItemAsync(safe(`${key}.${i}`));
  }
  await store.deleteItemAsync(safe(key));
}

async function secureSet(store: SecureStoreModule, key: string, value: string): Promise<void> {
  await secureRemove(store, key); // clear any prior value/chunks first
  if (value.length <= CHUNK) {
    await store.setItemAsync(safe(key), value);
    return;
  }
  const n = Math.ceil(value.length / CHUNK);
  await store.setItemAsync(safe(key), `__sbchunks__:${n}`);
  for (let i = 0; i < n; i++) {
    await store.setItemAsync(safe(`${key}.${i}`), value.slice(i * CHUNK, (i + 1) * CHUNK));
  }
}

/** Supabase auth `storage` interface. Uses the keychain when the native module
 *  is present, else AsyncStorage (stale client / never on release). Every path
 *  is defensive: a keychain error falls back rather than throwing. */
export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!SecureStore) return AsyncStorage.getItem(key);
    try {
      return await secureGet(SecureStore, key);
    } catch {
      return AsyncStorage.getItem(key);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (!SecureStore) return AsyncStorage.setItem(key, value);
    try {
      await secureSet(SecureStore, key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (!SecureStore) return AsyncStorage.removeItem(key);
    try {
      await secureRemove(SecureStore, key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};
