/**
 * accountLocalSync — ACCOUNT-SWITCH detection (user bug 2026-07-26).
 *
 * Logging in as a DIFFERENT user erases the backend link but historically left
 * the PREVIOUS user's device-local data on the phone. This hook subscribes to
 * Supabase auth and, on SIGNED_IN, compares the new user id against a stored
 * marker (`ape:localUserId`):
 *   • DIFFERENT user (or first-ever login, marker absent) → wipe device-local
 *     data + reset in-memory store caches, then write the new id.
 *   • SAME user (session restore / token re-auth) → do nothing (must NOT wipe).
 *
 * Mounted once at the app root (App.tsx), kept SEPARATE from the audio
 * onAuthStateChange in AudioOutputGate.
 *
 * ORDERING (critical): clearLocalAccountData() removes `ape:localUserId` (it's
 * `ape:*` and not on the KEEP allowlist), so the OLD marker is read BEFORE
 * clearing and the NEW marker is written AFTER clearing.
 */
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { isRealAccount } from '../commercial/realAccount';
import { clearLocalAccountData, resetAllLocalStores } from './clearLocalAccountData';
import { softDeadline } from '../../lib/boundedCall';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { noteSessionIdentity, settleSessionCarry } from '../lab/sessionCarry';

/** Marker holding the id of the user whose data currently lives on the device.
 *  Deliberately NOT on clearLocalAccountData's KEEP list — it is re-written
 *  AFTER every clear rather than preserved through it. */
const LOCAL_USER_ID_KEY = 'ape:localUserId';

/** The device's current IDENTITY = the signed-in user id, or '' for no-account
 *  (guest / signed-out). Wipe + reset only when it actually CHANGES. */
async function syncLocalToIdentity(identity: string): Promise<void> {
  let prev: string | null = null;
  try {
    prev = await AsyncStorage.getItem(LOCAL_USER_ID_KEY); // OLD marker, BEFORE clear
  } catch {
    prev = null;
  }
  // A null marker and the no-account identity ('') are the SAME identity —
  // treating them as a change caused repeat wipes after every guest entry
  // (QA night 2026-09-01 cross-tab cascade). First real sign-in still wipes
  // (identity is a uid, never '').
  if ((prev ?? '') === identity) return; // same identity — never wipe

  await clearLocalAccountData(); // removes ape:localUserId among the rest
  resetAllLocalStores();
  try {
    await AsyncStorage.setItem(LOCAL_USER_ID_KEY, identity); // NEW marker, AFTER clear
  } catch {
    // best-effort — a failed write just means we re-check on the next event
  }
}

/**
 * The one queue every identity wipe runs on (moved to module scope, night bug
 * pass 3, 2026-10-01, so Guest Mode's own wipe can join it — see below).
 */
let chain: Promise<void> = Promise.resolve();

/**
 * Run `fn` AFTER every identity sync already queued, and hold the next one
 * until it finishes (night bug pass 3, 2026-10-01).
 *
 * Account → Guest Mode ran TWO wipes at once: the SIGNED_OUT sync below and
 * Guest Mode's total wipe. Each sweep lists the keys, then removes them; the
 * sync's sweep that lagged behind Guest Mode deleted the Career Finder record
 * Guest Mode had just written back. Queued, the two cannot interleave. The
 * wait is bounded so a stalled storage call cannot hold Guest Mode for ever.
 */
export function runAfterAccountSync<T>(fn: () => Promise<T>, waitMs = 15000): Promise<T> {
  const prev = chain;
  const result = softDeadline(() => prev, undefined, 'accountSync/wait', waitMs).then(fn);
  chain = result.then(
    () => {},
    () => {},
  );
  return result;
}

/**
 * Mount once at the app root. Clears device-local data whenever the IDENTITY
 * changes — a different user signs in, OR the user signs OUT / enters no-account
 * (identity ''). This is what makes a LOG OUT (and a fresh Guest start) reset the
 * previous account's enrollment list, Home cards, and lab/tool state instead of
 * leaking them into the next session (user bug 2026-08-13). A same-user session
 * restore keeps everything. Cleans up its subscription on unmount.
 */
export function useAccountLocalSync(): void {
  useEffect(() => {
    /**
     * ONE SYNC AT A TIME (2026-09-30 bug pass). Each sync reads the marker,
     * wipes, then writes the new marker — three awaits. Two auth events close
     * together (sign out → sign straight in as someone else; SIGNED_IN racing
     * INITIAL_SESSION) ran interleaved: both read the SAME old marker, and
     * whichever finished last wrote ITS identity — so the marker could name an
     * account that is no longer signed in, and the next switch skipped the
     * wipe. Chained, each sync sees the marker the previous one wrote.
     */
    /** Auth events seen; a re-read answers only if none came after it. */
    let events = 0;
    /** This launch has settled whose device this is (see the re-read below). */
    let decided = false;
    type AnySession = { user?: { id?: string; is_anonymous?: boolean | null } } | null | undefined;
    const settle = (session: AnySession) => {
      decided = true;
      // ⚠️ An ANONYMOUS session maps to the GUEST identity (''), not to its
      // own uid. The glossary's temporary device key would otherwise read as
      // "a different user signed in" and wipe the guest's enrollment, Home
      // cards and lab state — once on accepting it, and again every time the
      // 7-day purge forces a new one. The dialog promises the opposite:
      // "none of your progress is stored with it".
      const identity = isRealAccount(session) ? (session?.user?.id ?? '') : '';
      // GUEST WORK → THE ACCOUNT (owner ruling 2026-10-01: "if in same
      // session guest signs in then current session is saved and stored").
      // The lab ledger learns the identity NOW, in event order (a sign-out
      // drops what it held at once), and writes a guest session's work to
      // its first account only AFTER this sign-in's wipe has run — or the
      // wipe would delete it.
      noteSessionIdentity(identity);
      chain = chain.then(() => syncLocalToIdentity(identity)).catch(() => {});
      chain = chain.then(() => settleSessionCarry()).catch(() => {});
    };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGNED_IN (login), SIGNED_OUT (logout → guest), INITIAL_SESSION (cold
      // start). TOKEN_REFRESHED and the like keep the same identity, so the
      // prev===identity guard above no-ops them.
      // PASSWORD_RECOVERY too: the in-app password reset signs in through
      // verifyOtp, which supabase-js announces as PASSWORD_RECOVERY and never
      // as SIGNED_IN — so the guest's (or previous account's) local data was
      // carried into the recovered account, then wiped at the next cold start.
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'INITIAL_SESSION' ||
        event === 'PASSWORD_RECOVERY'
      ) {
        const mine = ++events;
        // ⛔ A NULL INITIAL_SESSION IS NOT ALWAYS "SIGNED OUT" (hunt 10,
        // 2026-10-03 — the EntitlementProvider sweep's twin, missed here).
        // auth-js emits INITIAL_SESSION null whenever its session read ERRORS,
        // including a member's expired token on a dead connection (the
        // session stays stored). Read as the guest identity '', a member who
        // opened the app offline had EVERYTHING on the device wiped — the
        // unsent offline study/quiz/scenario queues, saved measurements, room
        // designs, enrollment, Home cards — and the marker left at '' wiped
        // whatever they did offline again at the next online launch. Re-read:
        // only a read that came back with no session is a guest; an UNKNOWN
        // one decides nothing (no wipe, no identity for the lab ledger) until
        // the session is confirmed — below, or by a real sign-in/out.
        if (event === 'INITIAL_SESSION' && !session) {
          void safeSessionResult(supabase.auth.getSession(), 'accountLocalSync/initial')
            .then(({ result, timedOut }) => {
              if (timedOut || mine !== events) return;
              settle(result.data.session as AnySession);
            })
            .catch(() => {});
          return;
        }
        settle(session);
        return;
      }
      // The refresh that gets through once the network is back is the first
      // CONFIRMED identity of a launch that could not tell (above). Same
      // person as the marker: no wipe, and the ledger writes their held work.
      if (event === 'TOKEN_REFRESHED' && session && !decided) {
        events += 1;
        settle(session);
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
}
