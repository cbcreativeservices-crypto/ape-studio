/**
 * Profile / Achievements / Gallery data layer — RLS-scoped reads only.
 * `overallPct` = complete_count / 50 — a plain completion percentage from server
 * status rows (never client math over raw events). The album-tier data (tier
 * name + AlbumDisc) is still computed for the RETAINED academic Profile variant,
 * but the commercial version no longer shows it and the live tab-bar tier store
 * was REMOVED (owner 2026-08-07 — album progression retired for commercial).
 */
import { supabase } from '../../lib/supabase';
import { albumTierFor, type AlbumTierName } from '../../theme/tokens';
import { V3_CURRICULUM_VERSION_ID } from '../../data/v3Curriculum';
import { classifyProfileRead, type ProfileRead } from './profileRead';
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
  earnedCerts: Set<'mic' | 'rec' | 'mix' | 'pa'>;
  completeCount: number;
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
type BadgeRow = { badge_name_snapshot: string | null };

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
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return { state: 'none' };

    const [userRes, identityRes] = await Promise.all([
      supabase
        .from('users')
        .select('id, nickname, first_name, last_name_initial, photo_url')
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
  let badges: BadgeRow[] | null = null;
  let completeCount: number | null = null;
  let totalTopics: number | null = null;
  try {
    const [badgeRes, completeRes, totalRes] = await Promise.all([
      supabase.from('student_badges').select('badge_name_snapshot').eq('user_id', user.id),
      supabase
        .from('student_achievement_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'complete'),
      // Overall % denominator = the LIVE v3 topic count, not the retired 50-slot
      // album scale (QA Wave B 2026-09-10: /50 against 166 topics rendered >100%).
      supabase
        .from('achievements')
        .select('id', { count: 'exact', head: true })
        .eq('curriculum_version_id', V3_CURRICULUM_VERSION_ID)
        .eq('is_active', true),
    ]);
    badges = badgeRes.data as BadgeRow[] | null;
    completeCount = completeRes.count;
    totalTopics = totalRes.count;
  } catch {
    return { state: 'unavailable' };
  }

  const earnedCerts = new Set<'mic' | 'rec' | 'mix' | 'pa'>();
  for (const b of badges ?? []) {
    const key = (b.badge_name_snapshot ?? '').split(' ')[0]?.toLowerCase();
    if (key === 'mic' || key === 'rec' || key === 'mix' || key === 'pa') earnedCerts.add(key);
  }

  const done = completeCount ?? 0;
  // Clamp to 100: the denominator is the curriculum size, and `done` is not yet
  // v3-scoped, so a stray non-v3 complete row can't push the headline over 100%.
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
      earnedCerts,
      completeCount: done,
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
    const { data, error } = await supabase.from('users').select('registry_name').single();
    if (error || !data) return null;
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
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return { state: 'none' };

    const { data, error } = await supabase
      .from('users')
      .select('show_in_registry, registry_bio, registry_interests, registry_primary_interest, registry_adult_confirmed')
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
    const { data: user, error: uErr } = await supabase.from('users').select('id').single();
    if (uErr || !user) return false;
    const { error } = await supabase
      .from('users')
      .update({ registry_name: name.trim() })
      .eq('id', (user as { id: string }).id);
    return !error;
  } catch {
    return false;
  }
}

// The Achievements trophy grid + Gallery data moved to
// `src/features/achievements/api.ts` (v3 redesign 2026-09-04). The old
// `fetchAchievements`/`fetchGallery` here joined the retired v1 `courses` table
// and were removed with the single 50-slot grid.
