/**
 * Profile / Achievements / Gallery data layer — RLS-scoped reads only.
 * `overallPct` = completed ACTIVE v3 topics / active v3 topic count — both
 * sides scoped identically (2026-09-22). Was complete_count / 50.
 * status rows (never client math over raw events). The album-tier data (tier
 * name + AlbumDisc) is still computed for the RETAINED academic Profile variant,
 * but the commercial version no longer shows it and the live tab-bar tier store
 * was REMOVED (owner 2026-08-07 — album progression retired for commercial).
 */
import { supabase } from '../../lib/supabase';
import { hasSafeSession, safeSession } from '../../lib/getSessionSafe';
import { isRealAccount } from '../commercial/realAccount';
import { albumTierFor, type AlbumTierName } from '../../theme/tokens';
import { V3_CURRICULUM_VERSION_ID } from '../../data/v3Curriculum';
import { classifyProfileRead, type ProfileRead } from './profileRead';
import { myUserId, myUserRow } from '../account/myUserRow';
export type { ProfileRead } from './profileRead';

export const ALBUM_DENOMINATOR = 50; // locked (D-5) — legacy album scale; NOT the
// overall-% denominator anymore (that is the live v3 topic count; see fetchProfile).

/* ---- fetches ---- */

export type ProfileData = {
  nickname: string | null;
  /** null for a user without a student id (my_identity() returns it nullable). */
  apeStudentId: string | null;
  initials: string;
  photoUrl: string | null;
  /** Permanent per-user credential token → the QR / public registry lookup. */
  qrToken: string | null;
  completeCount: number;
  /** The denominator the percentage is over — the live ACTIVE v3 topic count.
   *  Exposed (2026-09-22) so the Profile readout can state "163 of 166" rather
   *  than a bare "98%", which tells the learner nothing about the scale. */
  topicTotal: number;
  overallPct: number;
  tierName: AlbumTierName;
};

type UserRow = {
  id: string;
  nickname: string | null;
  first_name: string | null;
  last_name_initial: string | null;
  photo_url: string | null;
};

export async function fetchProfile(): Promise<ProfileRead> {
  // Safe profile fields come straight from `users`; the isolated identity
  // columns (ape_student_id, qr_token) come from the my_identity() RPC
  // (schema-isolation Phase 1, Computer A 2026-09-04) instead of a direct read.
  //
  // The RPC's own error is deliberately ignored (it only decorates the card
  // with an ID + QR), but a REJECTION would take the whole Promise.all down, so
  // the throw is caught and reported as `unavailable` rather than escaping as
  // an unhandled rejection.
  let user: UserRow | null = null;
  let identity: unknown = null;
  try {
    // A GUEST has no account, so there is no ID to load and nothing to retry.
    // Settle that BEFORE the read rather than trying to read it out of the
    // error afterwards: `anon` has no SELECT grant on `users`, so a guest comes
    // back as 42501 "permission denied" — the same code as the real
    // GRANTs-dropped outage for a signed-in user (see profileRead.ts). Exactly
    // what `fetchMyRegistryListing` below does, on this same table.
    // ⚠️ isRealAccount, not `session`. A guest holding the glossary's temporary
    // device key has a session and NO `users` row — the read below would come
    // back 42501 and classify as 'unavailable', which is the "Couldn't load
    // your ID — check your connection" banner fixed earlier on 2026-09-13,
    // shown to someone whose connection is fine. See realAccount.ts.
    const { data: sessionData } = await safeSession(supabase.auth.getSession(), 'profile/api');
    if (!isRealAccount(sessionData?.session)) return { state: 'none' };
    const authUid = sessionData!.session!.user.id;

    /* ⛔ `.eq('auth_id', …)`, not a bare `.single()`. An ADMIN matches every
       row under the `admin_all_users` policy, so the unfiltered read raised
       PGRST116 and `classifyProfileRead` reported "you have no account". The
       uid is already in hand from the session check two lines up. */
    const [userRes, identityRes] = await Promise.all([
      supabase
        .from('users')
        .select('id, nickname, first_name, last_name_initial, photo_url')
        .eq('auth_id', authUid)
        .single(),
      supabase.rpc('my_identity').single(),
    ]);
    const verdict = classifyProfileRead(userRes.error, userRes.data);
    if (verdict !== 'profile') return { state: verdict };
    user = userRes.data as UserRow;
    identity = identityRes.data;
  } catch {
    return { state: 'unavailable' };
  }
  if (!user) return { state: 'none' };
  const ident = identity as { ape_student_id?: string | null; qr_token?: string | null } | null;

  // Same guard as above: these three tolerate an `{ error }` result on their own
  // (each defaults), but a transport-level REJECTION would escape this function,
  // and a function that promises a ProfileRead must not sometimes throw one.
  let completeCount: number | null = null;
  let totalTopics: number | null = null;
  try {
    const [completeRes, totalRes] = await Promise.all([
      /**
       * ⛔ THE NUMERATOR MUST BE SCOPED LIKE THE DENOMINATOR (fixed 2026-09-22).
       *
       * This counted EVERY `complete` row for the user, while the denominator
       * below counts only ACTIVE v3 achievements. So completions against
       * retired v2 topics — or against v3 topics since deactivated — were
       * counted in the top and absent from the bottom.
       *
       * Measured on production: one account had 410 complete rows against a
       * denominator of 166, of which only 163 were live topics. The raw
       * percentage was 246%, and the `Math.min(100, …)` clamp below was doing
       * ALL the work — it showed a confident 100% where the honest figure is
       * 98%. The clamp was hiding the fault rather than guarding an edge.
       *
       * `completeCount` is worse, because nothing clamps it: the "Topics
       * completed" stat read 410 out of a 166-topic curriculum, on the screen
       * that is the learner's own record of their work.
       *
       * The `!inner` join makes the count answer the same question the
       * denominator does.
       */
      supabase
        .from('student_achievement_progress')
        .select('id, achievements!inner(id)', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .eq('achievements.curriculum_version_id', V3_CURRICULUM_VERSION_ID)
        .eq('achievements.is_active', true),
      // Overall % denominator = the LIVE v3 topic count, not the retired 50-slot
      // album scale (QA Wave B 2026-09-10: /50 against 166 topics rendered >100%).
      supabase
        .from('achievements')
        .select('id', { count: 'exact', head: true })
        .eq('curriculum_version_id', V3_CURRICULUM_VERSION_ID)
        .eq('is_active', true),
    ]);
    /**
     * ⛔ A FAILED READ IS `unavailable`, NOT ZERO.
     *
     * supabase-js RESOLVES with `{ count, error }` — it does not throw on an
     * RLS denial or a PostgREST error, so the try/catch above only ever sees a
     * transport-level rejection. On any `{ error }` result `count` is null,
     * and defaulting it to 0 below turned a failed read into an authoritative
     * "Not started yet · 0% of the whole curriculum · Topics completed 0" on
     * the one screen that is the learner's record of their own work. No error,
     * no retry, just a wrong number stated as fact.
     *
     * awards/api.ts:95-102 already refuses to do this for the same class of
     * read: "A partial failure must surface as the failed state, never as an
     * authoritative zero-progress checklist (B-174)." Same rule here.
     */
    if (completeRes.error || totalRes.error) return { state: 'unavailable' };
    completeCount = completeRes.count;
    totalTopics = totalRes.count;
  } catch {
    return { state: 'unavailable' };
  }

  const done = completeCount ?? 0;
  // Both sides are now scoped to ACTIVE v3, so this can no longer exceed 100 by
  // construction. The clamp stays as a floor-level guard against a future
  // divergence, but it is no longer load-bearing — when it WAS, it turned a
  // 246% computation into a confident-looking 100%.
  const total = totalTopics ?? 0;
  const overallPct = total > 0 ? Math.min(100, Math.floor((done / total) * 100)) : 0;
  const tier = albumTierFor(overallPct);

  const initials =
    `${(user.first_name ?? user.nickname ?? '?').charAt(0)}${user.last_name_initial ?? ''}`.toUpperCase();

  return {
    state: 'profile',
    profile: {
      nickname: user.nickname,
      apeStudentId: ident?.ape_student_id ?? null,
      initials,
      photoUrl: user.photo_url,
      qrToken: ident?.qr_token ?? null,
      completeCount: done,
      topicTotal: total,
      overallPct,
      tierName: tier.name,
    },
  };
}

/** The current user's permanent credential token (for the QR / registry link),
 *  used by screens that don't load the full profile (e.g. Directory). Returns
 *  null when signed out or on any error — callers show the pending state. */
export async function fetchMyQrToken(): Promise<string | null> {
  try {
    // Signed out (a guest, or a cold start whose keychain read has not landed):
    // there is no identity to fetch, and asking earns a 401 (measured 2026-09-25).
    if (!(await hasSafeSession(supabase.auth.getSession(), 'fetchMyQrToken'))) return null;
    // Via the my_identity() RPC (schema isolation) rather than a direct
    // users.qr_token read.
    const { data, error } = await supabase.rpc('my_identity').single();
    if (error || !data) return null;
    return (data as { qr_token?: string | null }).qr_token ?? null;
  } catch {
    return null;
  }
}

/** The user-chosen display name for the public Pro Registry and for printed
 *  credentials — the Profile field "Name used in registry". Server-backed as of
 *  2026-08-29 so the printed certificate and the QR verification page resolve to
 *  the SAME name, and so the value survives a reinstall or a device change.
 *
 *  Writable via a column-scoped grant: `authenticated` holds UPDATE on
 *  users.registry_name only, and `own_users_update` (auth_id = auth.uid())
 *  restricts it to the caller's own row.
 *
 *  Both helpers swallow errors and return null/false: a signed-out guest has no
 *  row, and the caller falls back to the device-local copy rather than failing. */
export async function fetchMyRegistryName(): Promise<string | null> {
  try {
    const data = await myUserRow<{ registry_name: string | null }>('registry_name');
    if (!data) return null;
    const v = (data as { registry_name?: string | null }).registry_name;
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

/**
 * REGISTRY VISIBILITY — server-backed, because it decides whether a PUBLIC page
 * exists (owner-approved 2026-08-30). It used to live only in AsyncStorage
 * while `public_verify_by_token` served every token regardless, so the switch
 * promised privacy it could not deliver. `users.show_in_registry` now gates the
 * RPC, and this is the only thing that writes it.
 */
export type RegistryListing = {
  listed: boolean;
  bio: string;
  interests: string[];
  primaryInterest: string;
  /** Already attested 18+ once — the prompt is not shown again. */
  adultConfirmed: boolean;
};

/**
 * The THREE answers this read can give, kept apart on purpose.
 *
 * `null` used to mean both "this account has no listing" and "we could not
 * reach the server", and the caller could only do one thing with it: fall back
 * to the device draft. So an offline phone showed the registry switch in
 * whatever position it was last left in, with no hint that the position was a
 * guess — a privacy control silently reporting an unverified state. Splitting
 * the two lets the UI say it does not know, instead of asserting.
 */
export type RegistryListingRead =
  | { state: 'listing'; listing: RegistryListing }
  /** Signed out, or signed in with no listing. Authoritative: there is no page. */
  | { state: 'none' }
  /** The read FAILED. We know nothing — never present this as "not listed". */
  | { state: 'unavailable' };

export async function fetchMyRegistryListing(): Promise<RegistryListingRead> {
  try {
    // A guest genuinely has no listing, and asking would fail on RLS and look
    // like an outage. Settle that before the read rather than after it.
    const { data: sessionData } = await safeSession(supabase.auth.getSession(), 'profile/api');
    if (!isRealAccount(sessionData?.session)) return { state: 'none' }; // see above
    const authUid = sessionData!.session!.user.id;

    const { data, error } = await supabase
      .from('users')
      .select('show_in_registry, registry_bio, registry_interests, registry_primary_interest, registry_adult_confirmed')
      .eq('auth_id', authUid)
      .single();
    if (error || !data) return { state: 'unavailable' };
    const r = data as {
      show_in_registry?: boolean | null;
      registry_bio?: string | null;
      registry_interests?: string[] | null;
      registry_primary_interest?: string | null;
      registry_adult_confirmed?: boolean | null;
    };
    return {
      state: 'listing',
      listing: {
        listed: !!r.show_in_registry,
        bio: r.registry_bio ?? '',
        interests: r.registry_interests ?? [],
        primaryInterest: r.registry_primary_interest ?? '',
        adultConfirmed: !!r.registry_adult_confirmed,
      },
    };
  } catch {
    return { state: 'unavailable' };
  }
}

/**
 * PUBLISH / UPDATE / UNPUBLISH — one atomic server call, never a raw column
 * write (owner ruling 2026-08-30). The RPC is SECURITY DEFINER because three
 * things must not be client-controlled: the 18+ gate (a client that skips the
 * prompt still cannot create a listing), the consent timestamp, and the
 * erasure on unpublish. Returns false on any failure so the UI can revert
 * rather than show a privacy state the server does not share.
 */
export async function setRegistryListing(input: {
  on: boolean;
  adult?: boolean;
  bio?: string;
  interests?: string[];
  primaryInterest?: string;
  policyVersion?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('set_registry_listing', {
      p_on: input.on,
      p_adult: input.adult ?? false,
      p_bio: input.bio ?? null,
      p_interests: input.interests ?? null,
      p_primary: input.primaryInterest ?? null,
      p_policy_version: input.policyVersion ?? null,
    });
    if (error) console.warn('[registry] listing write failed:', error.message);
    return !error;
  } catch {
    return false;
  }
}

/** Persist the registry name to the server. Returns false on any failure
 *  (guest, offline, RLS) so the caller can keep the local copy and retry later. */
export async function saveMyRegistryName(name: string): Promise<boolean> {
  try {
    const userId = await myUserId();
    if (!userId) return false;
    /**
     * ⛔ NO ERROR IS NOT THE SAME AS "IT SAVED".
     *
     * An `update().eq()` that matches ZERO rows returns `error: null` — the
     * write simply had nothing to write to. Without `.select()` there is no way
     * to tell that apart from a successful update, so this returned `true` for
     * a save that never happened. Row-level security is exactly how that
     * occurs: the column grant here is scoped, and `own_users_update` restricts
     * it to `auth_id = auth.uid()`, so a stale or mismatched `userId` is
     * filtered out silently rather than refused loudly.
     *
     * It matters beyond a lost setting. This is the name that gets PRINTED on
     * the certificate: `certificatePdf` reads the SERVER copy of
     * `registry_name`, while the Profile screen keeps showing the device-local
     * value it just "saved". The learner sees their corrected name in the app
     * and a different one on the credential, with nothing anywhere reporting a
     * failure.
     *
     * The house idiom, already applied in three other places after the same
     * bug: ask for the row back and treat an empty result as failure.
     */
    const { data, error } = await supabase
      .from('users')
      .update({ registry_name: name.trim() })
      .eq('id', userId)
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

// The Achievements trophy grid + Gallery data moved to
// `src/features/achievements/api.ts` (v3 redesign 2026-09-04). The old
// `fetchAchievements`/`fetchGallery` here joined the retired v1 `courses` table
// and were removed with the single 50-slot grid.
