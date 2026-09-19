/**
 * Audio Community Directory — the whole client/server contract in one place.
 *
 * EVERY call here is an RPC. Not one of these tables is reachable by a direct
 * PostgREST select or update: the visibility model (published → discoverable →
 * contact), the selection caps, the age gate, the block symmetry and the rate
 * limits all live in the database, so a client that skips a screen still cannot
 * skip a rule. The functions are SECURITY DEFINER; the tables grant nothing to
 * `authenticated` except the member's own profile rows.
 *
 * NO EMAIL ADDRESS crosses this boundary in either direction. Members are
 * addressed by `publicToken` — the community profile's own share token, which
 * is deliberately NOT users.qr_token: deleting a community profile must not
 * disturb a credential QR someone already printed (spec §4.4).
 */
import { supabase } from '../../lib/supabase';
import { LIMITS, readableError } from './rules';

export { LIMITS, readableError };

/* ── Taxonomy ─────────────────────────────────────────────────────────── */

export type TaxonomyItem = { slug: string; label: string; sortOrder: number };
export type Specialty = TaxonomyItem & { areas: string[] };

export type Taxonomy = {
  areas: TaxonomyItem[];
  specialties: Specialty[];
  roles: TaxonomyItem[];
  openTo: TaxonomyItem[];
};

/** Reference data, fetched once per launch. Labels may change; slugs may not. */
let taxonomyCache: Taxonomy | null = null;

/**
 * The whole chip vocabulary. Returns NULL when the fetch failed — NOT an empty
 * taxonomy (network audit 2026-09-11): every caller renders the taxonomy as chip
 * rows, so handing back EMPTY_TAXONOMY on a dropped connection drew a profile
 * editor and a filter panel with every section silently blank, which reads as
 * "there is nothing to choose here" rather than "this didn't load". A failure is
 * never cached, so the next call genuinely refetches.
 */
export async function fetchTaxonomy(): Promise<Taxonomy | null> {
  if (taxonomyCache) return taxonomyCache;
  try {
    const [areas, specs, maps, roles, openTo] = await Promise.all([
      supabase.from('directory_areas').select('slug,label,sort_order').order('sort_order'),
      supabase.from('directory_specialties').select('slug,label,sort_order').order('sort_order'),
      supabase.from('directory_specialty_areas').select('specialty_slug,area_slug'),
      supabase.from('directory_roles').select('slug,label,sort_order').order('sort_order'),
      supabase.from('directory_open_to').select('slug,label,sort_order').order('sort_order'),
    ]);
    if (areas.error || specs.error || maps.error || roles.error || openTo.error) return null;

    const byArea = new Map<string, string[]>();
    for (const m of (maps.data ?? []) as { specialty_slug: string; area_slug: string }[]) {
      const list = byArea.get(m.specialty_slug) ?? [];
      list.push(m.area_slug);
      byArea.set(m.specialty_slug, list);
    }
    const row = (r: { slug: string; label: string; sort_order: number }): TaxonomyItem => ({
      slug: r.slug,
      label: r.label,
      sortOrder: r.sort_order,
    });
    taxonomyCache = {
      areas: (areas.data ?? []).map(row),
      specialties: (specs.data ?? []).map((s) => ({ ...row(s), areas: byArea.get(s.slug) ?? [] })),
      roles: (roles.data ?? []).map(row),
      openTo: (openTo.data ?? []).map(row),
    };
    return taxonomyCache;
  } catch {
    return null;
  }
}

/** Account switch — the taxonomy is global, but drop it so a stale fetch from a
 *  signed-out session cannot linger with partial data. */
export function resetTaxonomyCache(): void {
  taxonomyCache = null;
}

/* ── My community profile ─────────────────────────────────────────────── */

export type WorkPref = 'remote' | 'local' | 'either';

export type CommunityProfile = {
  displayName: string;
  about: string;
  countryCode: string;
  region: string;
  workPref: WorkPref | null;
  published: boolean;
  discoverable: boolean;
  contactEnabled: boolean;
  adultConfirmed: boolean;
  needsIdentityReview: boolean;
  publicToken: string | null;
  primaryArea: string | null;
  areas: string[];
  specialties: string[];
  roles: string[];
  openTo: string[];
  languages: string[];
  featuredCredentialIds: string[];
};

export const EMPTY_COMMUNITY_PROFILE: CommunityProfile = {
  displayName: '',
  about: '',
  countryCode: '',
  region: '',
  workPref: null,
  published: false,
  discoverable: false,
  contactEnabled: false,
  adultConfirmed: false,
  needsIdentityReview: false,
  publicToken: null,
  primaryArea: null,
  areas: [],
  specialties: [],
  roles: [],
  openTo: [],
  languages: [],
  featuredCredentialIds: [],
};

/**
 * The three outcomes must stay apart (network audit 2026-09-11). The old
 * `CommunityProfile | null` collapsed "you have no community profile yet" into
 * "the request failed", and the editor treated both as "start a blank one" — so
 * a published member on a bad connection was shown an EMPTY, unpublished profile
 * and the first thing they typed was saved over their real server-side one. A
 * failed load must never become an editable blank draft.
 */
export type MyProfileLoad =
  | { status: 'ok'; profile: CommunityProfile }
  | { status: 'none' }
  | { status: 'error'; error: string };

export async function fetchMyCommunityProfile(): Promise<MyProfileLoad> {
  try {
    const { data, error } = await supabase.rpc('community_profile_mine');
    if (error) return { status: 'error', error: readableError(error.message) };
    const r = (data as Record<string, unknown>[] | null)?.[0];
    if (!r) return { status: 'none' };
    const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
    const profile: CommunityProfile = {
      displayName: (r.display_name as string) ?? '',
      about: (r.about as string) ?? '',
      countryCode: (r.country_code as string) ?? '',
      region: (r.region as string) ?? '',
      workPref: (r.work_pref as WorkPref) ?? null,
      published: !!r.published,
      discoverable: !!r.discoverable,
      contactEnabled: !!r.contact_enabled,
      adultConfirmed: !!r.adult_confirmed,
      needsIdentityReview: !!r.needs_identity_review,
      publicToken: (r.public_token as string) ?? null,
      primaryArea: (r.primary_area as string) ?? null,
      areas: arr(r.areas),
      specialties: arr(r.specialties),
      roles: arr(r.roles),
      openTo: arr(r.open_to),
      languages: arr(r.languages),
      featuredCredentialIds: arr(r.featured_credential_ids),
    };
    return { status: 'ok', profile };
  } catch {
    return {
      status: 'error',
      error: 'Couldn’t load your community profile. Check your connection and try again.',
    };
  }
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveCommunityProfile(p: CommunityProfile): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('community_profile_save', {
      p_display_name: p.displayName,
      p_about: p.about,
      p_country: p.countryCode,
      p_region: p.region,
      p_work_pref: p.workPref,
      p_primary_area: p.primaryArea,
      p_areas: p.areas,
      p_specialties: p.specialties,
      p_roles: p.roles,
      p_open_to: p.openTo,
      p_languages: p.languages,
    });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Your changes are still here — try again.' };
  }
}

export async function setFeaturedCredentials(ids: string[]): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('community_profile_set_credentials', { p_ids: ids });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

/** §9 attestation version — bump when the wording or the published field set changes. */
export const DIRECTORY_POLICY_VERSION = '2026-08-31.1';

export async function publishCommunityProfile(on: boolean, adult = false): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('community_profile_publish', {
      p_on: on,
      p_adult: adult,
      p_policy_version: DIRECTORY_POLICY_VERSION,
    });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

export async function setDiscoverable(on: boolean): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('community_profile_set_discoverable', { p_on: on });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

export async function setContactEnabled(on: boolean): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('community_profile_set_contact', { p_on: on });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

export async function deleteCommunityProfile(): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('community_profile_delete');
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

/* ── Explore ──────────────────────────────────────────────────────────── */

export type DirectoryFilters = {
  q?: string;
  areas?: string[];
  specialties?: string[];
  roles?: string[];
  openTo?: string[];
  country?: string;
  workPref?: WorkPref;
};

export type DirectoryCard = {
  publicToken: string;
  displayName: string;
  primaryArea: string | null;
  specialties: string[];
  roles: string[];
  countryCode: string | null;
  workPref: WorkPref | null;
  credentialCount: number;
  contactEnabled: boolean;
};

export type SearchOutcome =
  | { status: 'ok'; results: DirectoryCard[]; total: number }
  | { status: 'error'; error: string };

export async function searchDirectory(
  f: DirectoryFilters,
  page = 0,
  pageSize = 30,
): Promise<SearchOutcome> {
  const none = <T,>(a: T[] | undefined) => (a && a.length ? a : null);
  try {
    const { data, error } = await supabase.rpc('directory_search', {
      p_q: f.q?.trim() || null,
      p_areas: none(f.areas),
      p_specialties: none(f.specialties),
      p_roles: none(f.roles),
      p_open_to: none(f.openTo),
      p_country: f.country || null,
      p_work_pref: f.workPref ?? null,
      p_limit: pageSize,
      p_offset: page * pageSize,
    });
    if (error) return { status: 'error', error: readableError(error.message) };
    const rows = (data ?? []) as Record<string, unknown>[];
    return {
      status: 'ok',
      total: rows.length ? Number(rows[0].total_count ?? rows.length) : 0,
      results: rows.map((r) => ({
        publicToken: r.public_token as string,
        displayName: (r.display_name as string) ?? 'Member',
        primaryArea: (r.primary_area as string) ?? null,
        specialties: Array.isArray(r.specialties) ? (r.specialties as string[]) : [],
        roles: Array.isArray(r.roles) ? (r.roles as string[]) : [],
        countryCode: (r.country_code as string) ?? null,
        workPref: (r.work_pref as WorkPref) ?? null,
        credentialCount: Number(r.credential_count ?? 0),
        contactEnabled: !!r.contact_enabled,
      })),
    };
  } catch {
    return { status: 'error', error: 'No connection. Try again.' };
  }
}

/* ── A member's public profile (also what the preview renders) ─────────── */

export type PublicProfile = {
  displayName: string;
  about: string | null;
  countryCode: string | null;
  region: string | null;
  workPref: WorkPref | null;
  primaryArea: string | null;
  areas: string[];
  specialties: string[];
  roles: string[];
  openTo: string[];
  languages: string[];
  contactEnabled: boolean;
};

export type PublicCredential = {
  credentialType: string;
  credentialName: string;
  levelOrTier: string | null;
  earnedAt: string | null;
  verifyToken: string | null;
};

/**
 * Why the credentials come back as a THREE-state value (2026-09-18).
 *
 * `c.error` used to be dropped on the floor: a failed credentials RPC left
 * `c.data` null, `?? []` turned that into an empty array, and the screen —
 * which gates the VERIFIED CREDENTIALS block on `credentials.length` — simply
 * omitted the section.
 *
 * So a member who shares their directory link was presented to a prospective
 * employer as holding NO CREDENTIALS AT ALL. Stated as fact, with no error, no
 * retry, and no way for either party to tell it was a failure. On the one
 * screen whose entire purpose is to vouch for what somebody has earned.
 *
 * And the likely trigger is not a blip. It is the failure this project has
 * already been bitten by once: a public-catalog RPC with an RLS policy but no
 * GRANT returns zero rows rather than an error, so EVERY profile would show
 * zero credentials, permanently, and the credentials directory would quietly
 * stop being one.
 *
 * 'unavailable' is therefore not the same as an empty list, and the screen must
 * not render one as the other.
 */
export type PublicCredentialsResult =
  | { state: 'ok'; items: PublicCredential[] }
  | { state: 'unavailable' };

export async function fetchPublicProfile(
  token: string,
): Promise<{ profile: PublicProfile; credentials: PublicCredential[]; credentialsState: 'ok' | 'unavailable' } | null> {
  try {
    const [p, c] = await Promise.all([
      supabase.rpc('community_profile_public', { p_token: token }),
      supabase.rpc('community_profile_public_credentials', { p_token: token }),
    ]);
    if (p.error) return null;
    const r = (p.data as Record<string, unknown>[] | null)?.[0];
    if (!r) return null;
    const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
    return {
      profile: {
        displayName: (r.display_name as string) ?? 'Member',
        about: (r.about as string) ?? null,
        countryCode: (r.country_code as string) ?? null,
        region: (r.region as string) ?? null,
        workPref: (r.work_pref as WorkPref) ?? null,
        primaryArea: (r.primary_area as string) ?? null,
        areas: arr(r.areas),
        specialties: arr(r.specialties),
        roles: arr(r.roles),
        openTo: arr(r.open_to),
        languages: arr(r.languages),
        contactEnabled: !!r.contact_enabled,
      },
      // An empty list means "this member has earned nothing yet". A failed read
      // means "we do not know". Only the first may be shown as a fact.
      credentialsState: c.error ? 'unavailable' : 'ok',
      credentials: ((c.data ?? []) as Record<string, unknown>[]).map((x) => ({
        credentialType: (x.credential_type as string) ?? 'certificate',
        credentialName: (x.credential_name as string) ?? 'Credential',
        levelOrTier: (x.level_or_tier as string) ?? null,
        earnedAt: (x.earned_at as string) ?? null,
        verifyToken: (x.verify_token as string) ?? null,
      })),
    };
  } catch {
    return null;
  }
}

/* ── Contact ──────────────────────────────────────────────────────────── */

export type ContactThread = {
  id: string;
  direction: 'incoming' | 'outgoing';
  otherDisplayName: string;
  otherToken: string | null;
  purposeLabel: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'blocked';
  createdAt: string;
  respondedAt: string | null;
  messageCount: number;
  /**
   * Who is on the other end — a fellow MEMBER, or a verified EMPLOYER
   * (2026-09-18, employer accounts).
   *
   * This matters more than it looks. An employer has no community profile by
   * design, so before these fields existed `contact_threads` fell through to a
   * generic "Member" with a null token: a stranger asking a graduate about
   * work, rendered exactly like a peer, with the app implicitly vouching for
   * them. Someone deciding whether to accept has to know which they are
   * talking to.
   */
  otherKind: 'member' | 'employer';
  /** A human approved this organisation. Only ever true for an employer. */
  otherVerified: boolean;
  /** The employer's own site, so the claim is checkable by the person being
   *  asked rather than only by us. */
  otherWebsite: string | null;
};

/** A list fetch that can FAIL loudly. Swallowing the error and returning []
 *  made a dead network look exactly like "you have no requests" (app-nav audit
 *  finding 2026-09-07 [75]); callers must be able to tell the two apart. */
export type ListResult<T> = { ok: true; rows: T[] } | { ok: false; error: string };

export async function fetchContactThreads(): Promise<ListResult<ContactThread>> {
  try {
    const { data, error } = await supabase.rpc('contact_threads');
    if (error) return { ok: false, error: readableError(error.message) };
    const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      direction: (r.direction as 'incoming' | 'outgoing') ?? 'incoming',
      otherDisplayName: (r.other_display_name as string) ?? 'Member',
      otherToken: (r.other_token as string) ?? null,
      purposeLabel: (r.purpose_label as string) ?? '',
      message: (r.message as string) ?? '',
      status: (r.status as ContactThread['status']) ?? 'pending',
      createdAt: r.created_at as string,
      respondedAt: (r.responded_at as string) ?? null,
      messageCount: Number(r.unread_hint ?? 0),
      // Defaults to 'member': an older server that does not return these
      // columns must not silently label everyone an employer.
      otherKind: (r.other_kind === 'employer' ? 'employer' : 'member') as ContactThread['otherKind'],
      otherVerified: r.other_verified === true,
      otherWebsite: (r.other_website as string) ?? null,
    }));
    return { ok: true, rows };
  } catch {
    return { ok: false, error: 'Couldn’t load your requests. Check your connection and try again.' };
  }
}

export type ThreadMessage = { id: string; mine: boolean; body: string; createdAt: string };

export async function fetchThreadMessages(requestId: string): Promise<ListResult<ThreadMessage>> {
  try {
    const { data, error } = await supabase.rpc('contact_thread_messages', { p_request_id: requestId });
    if (error) return { ok: false, error: readableError(error.message) };
    const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      mine: !!r.mine,
      body: (r.body as string) ?? '',
      createdAt: r.created_at as string,
    }));
    return { ok: true, rows };
  } catch {
    return { ok: false, error: 'Couldn’t load this conversation. Check your connection and try again.' };
  }
}

export async function sendContactRequest(
  toToken: string,
  purpose: string,
  message: string,
): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('contact_request_send', {
      p_to_token: toToken,
      p_purpose: purpose,
      p_message: message,
    });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

export async function respondToRequest(
  id: string,
  action: 'accept' | 'decline' | 'withdraw',
): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('contact_request_respond', { p_id: id, p_action: action });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

/**
 * What the member has LEFT, not what the limits are.
 *
 * Every cap in this system used to be discovered by hitting it and reading an
 * error — `contact_limits()` has been callable since it was written and was
 * called by nothing. With the caps tightened (owner 2026-09-19) that goes from
 * mildly rude to confusing, so the UI now shows the remaining allowance and
 * disables SEND at zero. The DATABASE is still the enforcement; this only
 * moves the news earlier.
 *
 * Returns null on any failure — the caller must treat "unknown" as "allowed"
 * and let the server refuse, never as "blocked". Guessing blocked on a dropped
 * connection would lock someone out of their own conversation.
 */
export type ContactAllowance = {
  requestsLeftThisWeek: number;
  messagesLeftToday: number;
  messagesLeftThisWeek: number;
  messagesLeftHereToday: number;
  messageMaxChars: number;
  awaitingReply: boolean;
};

export async function fetchContactAllowance(requestId?: string): Promise<ContactAllowance | null> {
  try {
    const { data, error } = await supabase.rpc('contact_allowance', {
      p_request_id: requestId ?? null,
    });
    const r = (data as Record<string, unknown>[] | null)?.[0];
    if (error || !r) return null;
    return {
      requestsLeftThisWeek: Number(r.requests_left_this_week ?? 0),
      messagesLeftToday: Number(r.messages_left_today ?? 0),
      messagesLeftThisWeek: Number(r.messages_left_this_week ?? 0),
      messagesLeftHereToday: Number(r.messages_left_here_today ?? 0),
      messageMaxChars: Number(r.message_max_chars ?? 1000),
      awaitingReply: r.awaiting_reply === true,
    };
  } catch {
    return null;
  }
}

export async function sendThreadMessage(requestId: string, body: string): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('contact_message_send', {
      p_request_id: requestId,
      p_body: body,
    });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

/**
 * Block whoever is on the other end of a THREAD.
 *
 * `blockMember` below resolves its target from a community_profiles token,
 * and an EMPLOYER has no community profile — so `contact_threads` returns a
 * null token and the old call sent '' straight into a uuid cast. The member
 * saw `invalid input syntax for type uuid: ""` and the block never happened.
 * "Block an abusive user" was untrue for the one counterparty who can message
 * you without publishing anything about themselves.
 *
 * A request id identifies both parties for every kind of thread, so this
 * works for members and employers alike.
 */
export async function blockThread(requestId: string, on = true): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('contact_block_thread', {
      p_request_id: requestId,
      p_on: on,
    });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

/** Token-scoped block. Still used where a token is genuinely in hand (the
 *  member sheet in the directory); prefer `blockThread` from a conversation. */
export async function blockMember(token: string, on = true): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('contact_block', { p_token: token, p_on: on });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}

export type ReportReason = 'spam' | 'harassment' | 'solicitation' | 'impersonation' | 'other';

export async function reportMember(input: {
  token?: string | null;
  requestId?: string | null;
  reason: ReportReason;
  detail?: string;
}): Promise<SaveResult> {
  try {
    const { error } = await supabase.rpc('contact_report', {
      p_token: input.token ?? null,
      p_request_id: input.requestId ?? null,
      p_reason: input.reason,
      p_detail: input.detail ?? null,
    });
    return error ? { ok: false, error: readableError(error.message) } : { ok: true };
  } catch {
    return { ok: false, error: 'No connection. Try again.' };
  }
}
