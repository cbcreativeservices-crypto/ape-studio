/**
 * Weekly concept subscriptions — server rows the on-weekly-concept Edge Function
 * reads. Categories must match notification_concepts.category exactly.
 */
import { supabase } from '../../lib/supabase';

export const WEEKLY_CONCEPT_CATEGORIES = [
  'Acoustics',
  'Pro Audio Equipment',
  'Audio Electronics',
  'Recording Studio Production',
  'Cabling and Wiring',
  'Music Recording Production',
  'Live Sound Reinforcement',
] as const;

export type WeeklyConceptCategory = (typeof WEEKLY_CONCEPT_CATEGORIES)[number];

export type WeeklyConceptPayload = {
  concept_id: number;
  category: string;
  subdomain: string;
  concept: string;
  what_it_is: string;
  misconception: string;
  correction: string;
  why_it_matters: string;
  confidence: string;
};

export type WeeklySubscription = {
  category: string;
  day_of_week: number;
  send_time: string;
  timezone: string;
  active: boolean;
};

const DAY_TO_DOW: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const DOW_TO_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function dayNameToDow(name: string): number {
  return DAY_TO_DOW[name] ?? 1;
}

export function dowToDayName(dow: number): string {
  return DOW_TO_DAY[((dow % 7) + 7) % 7];
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Postgres `time` may come back as "09:00:00". Normalize to "HH:MM". */
export function timeToHhmm(raw: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(raw ?? '');
  if (!m) return '09:00';
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
}

/**
 * IDENTITY MAP (verified in the DB 2026-08-30):
 *   notification_concept_subscriptions.user_id = auth.users.id  (RLS: user_id = auth.uid())
 *   notification_preferences.user_id           = public.users.id (RLS resolves via users.auth_id)
 * Subscriptions use the AUTH uid; preferences use the APP id. Mixing them
 * matches zero rows and — for updates — fails SILENTLY.
 */
async function authUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** App id (public.users.id) — required for notification_preferences. */
async function appUserId(): Promise<string | null> {
  const { data, error } = await supabase.from('users').select('id').maybeSingle();
  if (error) {
    console.warn('[weekly-concept] app user lookup failed:', error.message);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}

export async function fetchWeeklySubscriptions(): Promise<WeeklySubscription[]> {
  const { data, error } = await supabase
    .from('notification_concept_subscriptions')
    .select('category, day_of_week, send_time, timezone, active')
    .eq('active', true);
  if (error) {
    console.warn('[weekly-concept] subs fetch failed:', error.message);
    return [];
  }
  return (data ?? []) as WeeklySubscription[];
}

export async function setWeeklyConceptPref(on: boolean): Promise<boolean> {
  const uid = await appUserId(); // preferences key on the APP id
  if (!uid) return false;
  const { data, error } = await supabase
    .from('notification_preferences')
    .update({ notify_weekly_concept: on, updated_at: new Date().toISOString() })
    .eq('user_id', uid)
    .select('user_id');
  if (error) console.warn('[weekly-concept] pref update failed:', error.message);
  else if (!data?.length) {
    console.warn('[weekly-concept] pref update matched no row for', uid);
    return false;
  }
  return !error;
}

/** Upsert one category at the shared day/time. */
export async function upsertWeeklySubscription(opts: {
  category: string;
  dayName: string;
  hhmm: string;
  active: boolean;
}): Promise<boolean> {
  const uid = await authUserId();
  if (!uid) return false;
  const row = {
    user_id: uid,
    category: opts.category,
    day_of_week: dayNameToDow(opts.dayName),
    send_time: `${timeToHhmm(opts.hhmm)}:00`,
    timezone: deviceTimezone(),
    active: opts.active,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('notification_concept_subscriptions')
    .upsert(row, { onConflict: 'user_id,category' });
  if (error) console.warn('[weekly-concept] upsert failed:', error.message);
  return !error;
}

export async function syncWeeklySchedule(opts: {
  categories: string[];
  dayName: string;
  hhmm: string;
}): Promise<boolean> {
  const uid = await authUserId();
  if (!uid) return false;
  const tz = deviceTimezone();
  const send_time = `${timeToHhmm(opts.hhmm)}:00`;
  const day_of_week = dayNameToDow(opts.dayName);
  const now = new Date().toISOString();

  const selected = new Set(opts.categories);
  let ok = true;
  for (const category of WEEKLY_CONCEPT_CATEGORIES) {
    const { error } = await supabase.from('notification_concept_subscriptions').upsert(
      {
        user_id: uid,
        category,
        day_of_week,
        send_time,
        timezone: tz,
        active: selected.has(category),
        updated_at: now,
      },
      { onConflict: 'user_id,category' },
    );
    if (error) {
      console.warn('[weekly-concept] sync failed:', error.message);
      ok = false;
    }
  }
  return ok;
}

export async function deactivateAllWeeklySubscriptions(): Promise<void> {
  const uid = await authUserId();
  if (!uid) return;
  const { error } = await supabase
    .from('notification_concept_subscriptions')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('user_id', uid);
  if (error) console.warn('[weekly-concept] deactivate failed:', error.message);
}

export function payloadFromUnknown(raw: unknown): WeeklyConceptPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (d.type && d.type !== 'weekly_concept') return null;
  const id = Number(d.concept_id);
  if (!Number.isFinite(id) || id < 1) return null;
  return {
    concept_id: id,
    category: String(d.category ?? ''),
    subdomain: String(d.subdomain ?? ''),
    concept: String(d.concept ?? ''),
    what_it_is: String(d.what_it_is ?? ''),
    misconception: String(d.misconception ?? ''),
    correction: String(d.correction ?? ''),
    why_it_matters: String(d.why_it_matters ?? ''),
    confidence: String(d.confidence ?? ''),
  };
}

export async function fetchConceptById(id: number): Promise<WeeklyConceptPayload | null> {
  const { data, error } = await supabase
    .from('notification_concepts')
    .select(
      'id, category, subdomain, concept, what_it_is, misconception, correction, why_it_matters, confidence',
    )
    .eq('id', id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn('[weekly-concept] concept fetch failed:', error.message);
    return null;
  }
  const row = data as {
    id: number;
    category: string;
    subdomain: string;
    concept: string;
    what_it_is: string;
    misconception: string;
    correction: string;
    why_it_matters: string;
    confidence: string;
  };
  return {
    concept_id: row.id,
    category: row.category,
    subdomain: row.subdomain,
    concept: row.concept,
    what_it_is: row.what_it_is,
    misconception: row.misconception,
    correction: row.correction,
    why_it_matters: row.why_it_matters,
    confidence: row.confidence,
  };
}
