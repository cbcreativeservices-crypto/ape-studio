/**
 * Exit flow server calls (2026-10-15). Every call is bounded (withDeadline
 * here, and the Supabase client's own fetch bound underneath) and never
 * rejects into a screen. The server half (Comp A) is live since 2026-10-23;
 * each call stays written against it DEFENSIVELY:
 *
 *  · readMembership — asks for plan / will_renew / renewal_checked_at; if those
 *    columns are missing it falls back to the old select and reports renewal
 *    as UNKNOWN (the screen then never claims "renews" or "ends").
 *  · submitExitFeedback — best effort; a failure never blocks anything.
 *  · deleteMyAccount — calls delete_my_account(p_keep_credentials). If that
 *    signature is missing (PGRST202) and the person chose to KEEP a record, it
 *    HOLDS (nothing deleted, an honest error); only "delete everything" may
 *    fall back to the old no-argument delete.
 */
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import { withDeadline } from '../../lib/boundedCall';
import { notify } from '../../lib/confirm';
import { trackEvent } from '../telemetry/telemetry';
import { markIntentionalSignOut } from '../auth/intentionalSignOut';
import { lookUpDeletedAccount, signOutThisDevice } from '../auth/api';
import { clearLocalAccountData, resetAllLocalStores } from '../account/clearLocalAccountData';
import { runAfterAccountSync } from '../account/accountLocalSync';
import { myUserRow } from '../account/myUserRow';
import { fetchMyCredentials } from '../credentials/api';
import { COMMENT_MAX, EXIT_FLOW_VERSION, type ExitFlow, type KeepChoice, type Provider } from './survey';
import { deleteRpcArgs, isMissingColumnError, isMissingFunctionError, type MembershipRow } from './membershipState';

const READ_MS = 15000;

export type MembershipRead = { ok: true; rows: MembershipRow[]; renewalKnown: boolean } | { ok: false };

export async function readMembership(): Promise<MembershipRead> {
  try {
    const full = await withDeadline(
      async () =>
        await supabase
          .from('entitlements')
          .select('product, status, expires_at, source, plan, will_renew, renewal_checked_at')
          .eq('product', 'academy'),
      'exit membership read',
      READ_MS,
    );
    if (!full.error) return { ok: true, rows: (full.data ?? []) as MembershipRow[], renewalKnown: true };
    if (!isMissingColumnError(full.error)) return { ok: false };
    // The renewal columns are not deployed yet: the old columns only, renewal UNKNOWN.
    const old = await withDeadline(
      async () => await supabase.from('entitlements').select('product, status, expires_at, source').eq('product', 'academy'),
      'exit membership read (old columns)',
      READ_MS,
    );
    if (old.error) return { ok: false };
    return { ok: true, rows: (old.data ?? []) as MembershipRow[], renewalKnown: false };
  } catch {
    return { ok: false };
  }
}

/** The person's first name, or null. Never derived from an email address. */
export async function readFirstName(): Promise<string | null> {
  try {
    const row = await withDeadline(async () => await myUserRow<{ first_name: string | null }>('first_name'), 'first name', 8000);
    const n = (row?.first_name ?? '').trim();
    return n || null;
  } catch {
    return null;
  }
}

/**
 * Does the person hold at least one earned, non-revoked certificate or
 * program? `null` = the read failed — the deletion screen then SHOWS the
 * certificate choice (asking is harmless; silently deleting a record someone
 * wanted kept is not).
 */
export async function readHasCredential(): Promise<boolean | null> {
  try {
    const list = await withDeadline(() => fetchMyCredentials(), 'credentials for deletion', READ_MS);
    return list.length > 0;
  } catch {
    return null;
  }
}

/** Best effort. Resolves true only when the server accepted the answers. */
export async function submitExitFeedback(input: {
  flow: ExitFlow;
  reason: string | null;
  followup: string | null;
  comment?: string | null;
}): Promise<boolean> {
  const comment = (input.comment ?? '').trim().slice(0, COMMENT_MAX) || null;
  try {
    const { error } = await withDeadline(
      async () =>
        await supabase.rpc('submit_exit_feedback', {
          p_flow: input.flow,
          p_flow_version: EXIT_FLOW_VERSION,
          p_reason: input.reason,
          p_followup: input.followup,
          p_comment: comment,
          p_platform: Platform.OS,
          p_app_version: Constants.expoConfig?.version ?? null,
        }),
      'submit_exit_feedback',
      10000,
    );
    if (error) return false;
    trackEvent('feedback_submitted', {
      flow: input.flow,
      flow_version: EXIT_FLOW_VERSION,
      reason: input.reason ?? 'none',
      followup: input.followup ?? 'none',
      has_comment: !!comment,
    });
    return true;
  } catch {
    return false;
  }
}

// ── Store subscription pages (same links as the Paywall's onManage) ─────────
const APPLE_SUBS_APP = 'itms-apps://apps.apple.com/account/subscriptions';
const APPLE_SUBS_WEB = 'https://apps.apple.com/account/subscriptions';
const PLAY_SUBS = 'https://play.google.com/store/account/subscriptions?package=com.cbcreativeservices.apestudio';

/** The billing provider's page — from the verified record, even on the other platform's phone. */
export function subscriptionsUrl(provider: Provider | null): string {
  const p = provider ?? (Platform.OS === 'ios' ? 'apple' : 'google');
  if (p === 'apple') return Platform.OS === 'ios' ? APPLE_SUBS_APP : APPLE_SUBS_WEB;
  return PLAY_SUBS;
}

/** Opens the store page. Resolves true when it opened. Never rejects. */
export async function openSubscriptions(provider: Provider | null, flow: ExitFlow | 'membership'): Promise<boolean> {
  try {
    await Linking.openURL(subscriptionsUrl(provider));
    trackEvent('billing_management_opened', { flow, provider: provider ?? 'unknown' });
    return true;
  } catch {
    notify(
      // Ratified by the owner 2026-09-14 (PaywallScreen onManage)
      'Manage subscription',
      'We couldn’t open your app-store subscription settings. Open the App Store or Play Store app and look under Subscriptions.',
    );
    return false;
  }
}

// ── Account deletion ─────────────────────────────────────────────────────────
class KeepRecordUnavailable extends Error {}

async function callDelete(choice: KeepChoice | null): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('delete_my_account', deleteRpcArgs(choice));
  if (!error) return { error: null };
  if (!isMissingFunctionError(error as { code?: string })) return { error };
  // The new signature is not deployed. Keeping a record cannot be honoured by
  // the old delete, so HOLD — nothing is deleted. Delete-everything may use it.
  if (choice === 'keep_record') throw new KeepRecordUnavailable('keep record unavailable');
  const old = await supabase.rpc('delete_my_account');
  return { error: old.error };
}

/**
 * The device side of an erased account — the same steps, in the same order,
 * as DeleteAccountButton's runDelete: sign this device out (local scope, a
 * retry, then removed regardless), then the account wipe ON THE WIPE QUEUE
 * after the sign-out's own SIGNED_OUT sweep.
 */
export async function finishAccountErasure(): Promise<void> {
  markIntentionalSignOut();
  await signOutThisDevice();
  await runAfterAccountSync(async () => {
    await clearLocalAccountData();
    resetAllLocalStores();
  });
}

export type DeleteOutcome = 'deleted' | 'keep_unavailable' | 'failed';

/**
 * delete_my_account(p_keep_credentials) → sign out → wipe. Bounded. A delete
 * that timed out may still have happened, so only the auth server's "this
 * account does not exist" counts as erased (same rule as the hold button).
 * Once erased, a local step that throws still reports 'deleted' — the account
 * is gone and the device must go on out.
 */
export async function deleteMyAccount(choice: KeepChoice | null): Promise<DeleteOutcome> {
  let erased = false;
  try {
    let error: unknown = null;
    try {
      ({ error } = await withDeadline(async () => await callDelete(choice), 'delete_my_account'));
    } catch (unanswered) {
      if (unanswered instanceof KeepRecordUnavailable) return 'keep_unavailable';
      if ((await lookUpDeletedAccount()) !== 'gone') throw unanswered;
    }
    if (error) throw error;
    erased = true;
    trackEvent('deletion_completed', { flow_version: EXIT_FLOW_VERSION, kept_record: choice === 'keep_record' });
    await finishAccountErasure();
    return 'deleted';
  } catch {
    return erased ? 'deleted' : 'failed';
  }
}
