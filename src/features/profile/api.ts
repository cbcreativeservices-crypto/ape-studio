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

export const ALBUM_DENOMINATOR = 50; // locked (D-5)

/* ---- fetches ---- */

export type ProfileData = {
  nickname: string | null;
  apeStudentId: string;
  initials: string;
  photoUrl: string | null;
  /** Permanent per-user credential token → the QR / public registry lookup. */
  qrToken: string | null;
  earnedCerts: Set<'mic' | 'rec' | 'mix' | 'pa'>;
  completeCount: number;
  overallPct: number;
  tierName: AlbumTierName;
};

export async function fetchProfile(): Promise<ProfileData> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, nickname, ape_student_id, first_name, last_name_initial, photo_url, qr_token')
    .single();
  if (error || !user) throw new Error('user_not_found');

  const [{ data: badges }, { count: completeCount }] = await Promise.all([
    supabase.from('student_badges').select('badge_name_snapshot').eq('user_id', user.id),
    supabase
      .from('student_achievement_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'complete'),
  ]);

  const earnedCerts = new Set<'mic' | 'rec' | 'mix' | 'pa'>();
  for (const b of badges ?? []) {
    const key = (b.badge_name_snapshot ?? '').split(' ')[0]?.toLowerCase();
    if (key === 'mic' || key === 'rec' || key === 'mix' || key === 'pa') earnedCerts.add(key);
  }

  const done = completeCount ?? 0;
  const overallPct = Math.floor((done / ALBUM_DENOMINATOR) * 100);
  const tier = albumTierFor(overallPct);

  const initials =
    `${(user.first_name ?? user.nickname ?? '?').charAt(0)}${user.last_name_initial ?? ''}`.toUpperCase();

  return {
    nickname: user.nickname,
    apeStudentId: user.ape_student_id,
    initials,
    photoUrl: user.photo_url,
    qrToken: (user as { qr_token?: string | null }).qr_token ?? null,
    earnedCerts,
    completeCount: done,
    overallPct,
    tierName: tier.name,
  };
}

/** The current user's permanent credential token (for the QR / registry link),
 *  used by screens that don't load the full profile (e.g. Directory). Returns
 *  null when signed out or on any error — callers show the pending state. */
export async function fetchMyQrToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.from('users').select('qr_token').single();
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

export type AchievementTile = {
  id: string;
  name: string;
  courseCode: string;
  color: string;
  iconUrl: string | null;
  /** 1-based grid position (achievements.global_sequence). */
  position: number;
  status: 'complete' | 'passed_incomplete' | 'unlocked' | 'locked';
};

const FALLBACK_CYCLE = ['#2f9bff', '#37e05f', '#ffc233', '#b45bff', '#ff8a1e'];

export async function fetchAchievements(): Promise<{ tiles: AchievementTile[]; earned: number }> {
  const { data: user, error } = await supabase.from('users').select('id').single();
  if (error || !user) throw new Error('user_not_found');

  const [{ data: rows, error: aErr }, { data: prog, error: pErr }] = await Promise.all([
    // All achievements (incl. inactive future topics) so their trophy art
    // previews in the grid at its permanent slot (Booth 2026-07-09).
    supabase
      .from('achievements')
      .select('id, name, sequence_in_course, global_sequence, icon_url, courses!inner(code, sequence, color_hex)')
      .order('global_sequence'),
    supabase.from('student_achievement_progress').select('achievement_id, status').eq('user_id', user.id),
  ]);
  if (aErr) throw aErr;
  if (pErr) throw pErr;

  const statusById = new Map((prog ?? []).map((p: any) => [p.achievement_id, p.status]));
  const sorted = (rows ?? []).sort(
    (a: any, b: any) =>
      a.courses.sequence - b.courses.sequence || a.sequence_in_course - b.sequence_in_course,
  );

  const tiles: AchievementTile[] = sorted.map((r: any, i: number) => ({
    id: r.id,
    name: r.name,
    courseCode: r.courses.code,
    color: r.courses.color_hex || FALLBACK_CYCLE[i % FALLBACK_CYCLE.length],
    iconUrl: r.icon_url ?? null,
    position: r.global_sequence ?? i + 1,
    status: (statusById.get(r.id) as AchievementTile['status']) ?? 'locked',
  }));

  const earned = tiles.filter((t) => t.status === 'complete').length;
  return { tiles, earned };
}

export type GalleryEntry = {
  achievementId: string;
  name: string;
  courseCode: string;
  color: string;
  iconUrl: string | null;
  dateEarned: string;
};

export async function fetchGallery(): Promise<GalleryEntry[]> {
  const { data: user, error } = await supabase.from('users').select('id').single();
  if (error || !user) throw new Error('user_not_found');

  const { data, error: gErr } = await supabase
    .from('student_achievement_progress')
    .select('achievement_id, date_earned, achievements!inner(name, icon_url, courses!inner(code, color_hex))')
    .eq('user_id', user.id)
    .eq('status', 'complete')
    .not('date_earned', 'is', null)
    .order('date_earned', { ascending: false }); // newest first (locked)
  if (gErr) throw gErr;

  return (data ?? []).map((r: any, i: number) => ({
    achievementId: r.achievement_id,
    name: r.achievements.name,
    courseCode: r.achievements.courses.code,
    color: r.achievements.courses.color_hex || FALLBACK_CYCLE[i % FALLBACK_CYCLE.length],
    iconUrl: r.achievements.icon_url ?? null,
    dateEarned: r.date_earned,
  }));
}
