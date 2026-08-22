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

export type ClaimResult = { ok: boolean; tookOver: boolean };

/** Claim this device as the account's active device. Non-throwing; fails open. */
export async function claimThisDevice(): Promise<ClaimResult> {
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await supabase.rpc('claim_device', { p_device_id: deviceId });
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
export async function getActiveDeviceId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_active_device');
    if (error) return null;
    return (data as string | null) ?? null;
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
  const mine = await getDeviceId();
  return active !== mine;
}
