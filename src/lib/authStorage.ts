/**
 * authStorage (web / default) — the Supabase auth session store on web.
 *
 * SecureStore is native-only, so the web build (and the 8090 preview) uses
 * AsyncStorage, which on react-native-web is backed by localStorage. The
 * encrypted keychain path lives in `authStorage.native.ts` (Metro resolves the
 * `.native.ts` variant on device). See that file for the security rationale.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authStorage = AsyncStorage;
