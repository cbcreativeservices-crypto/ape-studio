/**
 * singleDevice — server-enforced single active device per account (owner
 * 2026-08-21). Backend: docs/APE_SINGLE_DEVICE_2026_08_21.sql (claim_device /
 * get_active_device). Fails OPEN everywhere: until the migration is run (RPC
 * missing) these no-op so login and normal use are never blocked.
 *
 * Flow: on sign-in the device CLAIMS itself active; a foreground guard
 * (useSingleDeviceGuard) checks that it's still the active device and, if a newer
 * device took over, signs this one out.
 */
import { supabase } from '../../lib/supabase';
import { getDeviceId } from './deviceIdentity';
import { withDeadline } from '../../lib/boundedCall';

export type ClaimResult = { ok: boolean; tookOver: boolean };

/** Claim this device as the account's active device. Non-throwing; fails open. */
export async function claimThisDevice(): Promise<ClaimResult> {
  try {
    const deviceId = await getDeviceId();
    // BOUNDED (night bug pass 1, 2026-10-01) — the twin of getActiveDeviceId
    // below. claimAndProceed AWAITS this after a successful sign-in, so a
    // stalled RPC left the person on the login spinner, signed in, forever
    // (and the takeover prompt's Continue spinning the same way). A stall now
    // lands in the catch and fails open like every other failure here.
    const { data, error } = await withDeadline(
      async () => await supabase.rpc('claim_device', { p_device_id: deviceId }),
      'claim_device',
      8000,
    );
    if (error) {
      console.warn('[single-device] claim_device failed (feature may be un-migrated):', error.message);
      return { ok: false, tookOver: false };
    }
    const payload = (data ?? {}) as { status?: string; took_over?: boolean };
    return { ok: payload.status === 'claimed', tookOver: !!payload.took_over };
  } catch (e) {
    console.warn('[single-device] claim_device threw:', (e as Error).message);
    return { ok: false, tookOver: false };
  }
}

/** The account's currently-active device id (null on error / none / no session). */
/**
 * ⛔ BOUNDED, because this GATES SIGN-IN.
 *
 * `claimAndProceed` awaits this inside a `Promise.all` before letting a login
 * complete, and the whole design of this function is to FAIL OPEN — an error
 * or an un-migrated backend returns null and the user proceeds. A hung RPC
 * fails neither open nor closed: it never returns, so a *successful* sign-in
 * leaves the person on the login spinner, signed in and unable to see it.
 *
 * The timeout returns the same `null` the error paths already return, so a
 * stall now means exactly what every other failure here means. Same 5 s and
 * the same reasoning as `lib/getSessionSafe`; kept local because this is an
 * RPC rather than an auth read. If a fourth of these appears, extract it.
 */
const ACTIVE_DEVICE_TIMEOUT_MS = 5000;

export async function getActiveDeviceId(): Promise<string | null> {
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      supabase.rpc('get_active_device').then(
        ({ data, error }) => (error ? null : ((data as string | null) ?? null)),
        () => null,
      ),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          console.warn('[single-device] get_active_device stalled >5s — treating as no active device');
          resolve(null);
        }, ACTIVE_DEVICE_TIMEOUT_MS);
      }),
    ]).finally(() => {
      if (timer) clearTimeout(timer);
    });
    return result;
  } catch {
    return null;
  }
}

/**
 * True when this device has been DISPLACED — i.e. the server reports a DIFFERENT
 * active device. Returns false when there's no active row yet (null) or on any
 * error, so a transient failure / un-migrated backend never forces a logout.
 */
export async function isDisplaced(): Promise<boolean> {
  const active = await getActiveDeviceId();
  if (!active) return false; // no active device on record → don't act
  // An install id that could not be READ is unknown, not different (wave 2,
  // 2026-10-02): getDeviceId rejects rather than mint a new id, and an
  // unknown id must never sign this device out.
  let mine: string;
  try {
    mine = await getDeviceId();
  } catch {
    return false;
  }
  return active !== mine;
}
