/**
 * "A password reset is in progress on this device" (toddler bug hunt
 * 2026-10-14, HOLD item 8, owner-approved).
 *
 * A valid recovery code signs the device in (verifyOtp → a recovery session)
 * BEFORE the new password is set. Closing the app at that moment left the
 * session stored, and the next launch went straight into the account with no
 * new password set and no device claim. So the reset is remembered on disk
 * from just before the code is checked until the new password is set or the
 * reset is cancelled; a launch that finds it still set signs the device out
 * and clears it (SplashScreen).
 *
 * The key is on clearLocalAccountData's KEEP and GUEST_KEEP lists: verifyOtp's
 * PASSWORD_RECOVERY event runs an identity wipe, which would otherwise delete
 * the flag in the very moment it exists for. It holds no user data.
 */
import { createLocalStore } from '../storage/localStore';
import { runAfterAccountSync } from '../account/accountLocalSync';

export const PASSWORD_RESET_PENDING_KEY = 'ape:passwordResetPending';

const store = createLocalStore<boolean>({
  key: PASSWORD_RESET_PENDING_KEY,
  empty: () => false,
  parse: (v) => v === true,
  // Nothing pending = nothing stored.
  serialize: (v) => (v ? 'true' : null),
});

/** Set before the recovery code is checked. Resolves once the device has it
 *  (or refused it — the reset still goes ahead; Cancel still signs out). */
export async function markPasswordResetPending(): Promise<void> {
  // On the identity-wipe queue: a wipe's store reset mid-write would drop it.
  // A refused write raises the shared save notice (the opt-out list only
  // shrinks — test/failedSaveNotice_20261003).
  await runAfterAccountSync(async () => void (await store.set(true)));
}

/** The new password is set, or the reset was cancelled / signed out. */
export async function clearPasswordResetPending(): Promise<void> {
  // Queued AFTER the sign-out's own SIGNED_OUT wipe (or the recovery's
  // PASSWORD_RECOVERY one), so that wipe's store reset cannot drop the clear.
  await runAfterAccountSync(async () => void (await store.set(false)));
}

/** Launch: is a reset left unfinished? An UNREADABLE flag answers false — a
 *  member is never signed out on a storage read that failed. */
export async function isPasswordResetPending(): Promise<boolean> {
  await store.hydrate();
  if (store.isUnreadable()) return false;
  return store.get() === true;
}
