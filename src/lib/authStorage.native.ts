/**
 * authStorage (native) — encrypted persistence for the Supabase auth session.
 *
 * SECURITY (vibe-security 2026-09-04): the session JWT + refresh token must NOT
 * sit in AsyncStorage (plaintext on disk, trivially readable on a rooted /
 * jailbroken device). Here it lives in the OS keychain / keystore via
 * `expo-secure-store`.
 *
 * expo-secure-store caps a single value at ~2 KB, and a Supabase session can be
 * larger, so values are CHUNKED: the base key holds either the value itself or a
 * "__sbchunks__:N" marker, and the N parts live at `<key>.0 … <key>.N-1`.
 *
 * `expo-secure-store` is a NATIVE module — it requires a fresh dev/native BUILD.
 * Every call is wrapped so a stale client that predates the module degrades to
 * "no persisted session" (a re-login) instead of crashing the app.
 *
 * The `.native.ts` / `.ts` split (Metro platform resolution) keeps this native
 * module out of the web bundle entirely; the web build uses AsyncStorage.
 */
import * as SecureStore from 'expo-secure-store';

const CHUNK = 1800; // bytes, safely under the ~2 KB SecureStore limit
const MARKER = /^__sbchunks__:(\d+)$/;

/** SecureStore keys allow only [A-Za-z0-9._-]; Supabase keys already comply,
 *  but sanitise defensively so a future key can never throw. */
const safe = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_');

async function get(key: string): Promise<string | null> {
  try {
    const head = await SecureStore.getItemAsync(safe(key));
    if (head == null) return null;
    const m = MARKER.exec(head);
    if (!m) return head;
    const n = Number(m[1]);
    let out = '';
    for (let i = 0; i < n; i++) {
      const part = await SecureStore.getItemAsync(safe(`${key}.${i}`));
      if (part == null) return null; // torn write — treat as absent
      out += part;
    }
    return out;
  } catch {
    return null;
  }
}

async function remove(key: string): Promise<void> {
  try {
    const head = await SecureStore.getItemAsync(safe(key));
    const m = head ? MARKER.exec(head) : null;
    if (m) {
      const n = Number(m[1]);
      for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(safe(`${key}.${i}`));
    }
    await SecureStore.deleteItemAsync(safe(key));
  } catch {
    /* best-effort */
  }
}

async function set(key: string, value: string): Promise<void> {
  try {
    await remove(key); // clear any prior value/chunks first
    if (value.length <= CHUNK) {
      await SecureStore.setItemAsync(safe(key), value);
      return;
    }
    const n = Math.ceil(value.length / CHUNK);
    await SecureStore.setItemAsync(safe(key), `__sbchunks__:${n}`);
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(safe(`${key}.${i}`), value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
  } catch {
    /* a stale client without the native module keeps the session in memory only */
  }
}

/** Supabase auth `storage` interface. */
export const authStorage = {
  getItem: get,
  setItem: set,
  removeItem: remove,
};
