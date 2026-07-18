/**
 * Commercial course dashboard data (CM6, Booth 2026-07-11). Returns the SAME
 * `DashboardData` shape as fetchDashboard(), so the existing DashboardScreen
 * renders a public course UNCHANGED — topic swipe, 5 study methods, quiz, all
 * reusing the locked engine screens.
 *
 * Topic order = the seed's `seq` (placement SSoT). `gs` resolves to achievement
 * UUIDs at RUNTIME from the achievements query (never hardcoded). Completion is
 * per-achievement (shared across cross-listed courses). Locked/clamp come from
 * the SERVER's progress rows exactly as today; where a commercial user has no
 * server row yet (register_commercial_user not deployed), we render the
 * ENTITLEMENT only — academy ⇒ topics accessible, free ⇒ only gs0/gs36 — and
 * the server still gates the actual study/quiz on write. We never DECIDE
 * grading/clamp client-side.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import {
  type Course,
  type DashboardData,
  type MethodProgressRow,
  type StudyMethodConfig,
  type Topic,
  type TopicProgress,
  type TopicStatus,
} from '../../features/dashboard/api';
import { getPublicCatalog, isFreeTopicGs, type PublicCourse } from '../../data/publicCourses';
import type { Caps } from './EntitlementProvider';

const LAST_PUBLIC_ORDER_KEY = 'ape:lastPublicCourseOrder';

export async function setLastPublicCourse(order: number): Promise<void> {
  await AsyncStorage.setItem(LAST_PUBLIC_ORDER_KEY, String(order));
}
export async function getLastPublicCourse(): Promise<number | null> {
  const v = await AsyncStorage.getItem(LAST_PUBLIC_ORDER_KEY);
  return v == null ? null : Number(v);
}

type AchievementRow = {
  id: string;
  name: string;
  global_sequence: number;
  applicable_methods: string[] | null;
  is_prerequisite: boolean | null;
  icon_url: string | null;
};

/** Server truth wins; else render the entitlement (server still gates writes). */
function statusFor(serverStatus: TopicStatus | undefined, isFree: boolean, caps: Caps): TopicStatus | null {
  if (serverStatus) return serverStatus;
  if (caps.allTopics) return 'unlocked'; // academy: all topics accessible
  if (caps.freeTopics && isFree) return 'unlocked'; // free: gs0/gs36 playable
  return null; // missing row ⇒ the dashboard reads this as 'locked'
}

export async function fetchCommercialDashboard(order: number, caps: Caps): Promise<DashboardData> {
  // v2.13: catalog from public_courses/public_course_topics (seed fallback).
  const catalog = await getPublicCatalog();
  const seedCourse: PublicCourse = catalog.find((c) => c.order === order) ?? catalog[0];

  // 1. All achievements → gs → achievement map (resolve UUIDs at runtime).
  const { data: achRows, error: achErr } = await supabase
    .from('achievements')
    .select('id, name, global_sequence, applicable_methods, is_prerequisite, icon_url');
  if (achErr) throw achErr;
  const byGs = new Map<number, AchievementRow>();
  for (const a of (achRows ?? []) as AchievementRow[]) byGs.set(a.global_sequence, a);

  // 2. Study-method configs (global).
  const { data: cfg } = await supabase
    .from('study_methods')
    .select('key, name, sequence, min_engagement_seconds, requires_accuracy, accuracy_threshold, required_passes')
    .order('sequence');

  // 3. Topics in seq order, resolved to achievements (skip any unresolved gs).
  const topics: Topic[] = [];
  const achievementIds: string[] = [];
  const freeByAch = new Map<string, boolean>();
  for (const t of seedCourse.topics) {
    const a = byGs.get(t.gs);
    if (!a) continue; // gs not present in this DB snapshot — omit honestly
    topics.push({
      id: a.id,
      course_id: `pub-${order}`,
      sequence_in_course: t.seq,
      name: t.name, // PUBLIC name from the seed (no academic codes)
      applicable_methods: a.applicable_methods ?? [],
      is_prerequisite: !!a.is_prerequisite,
      icon_url: a.icon_url,
    });
    achievementIds.push(a.id);
    freeByAch.set(a.id, isFreeTopicGs(t.gs));
  }

  // 4. Own progress + method rows + item counts — DEFENSIVE: a commercial user
  //    without a `users` row (pre register_commercial_user) yields empty maps;
  //    the entitlement rendering (step 5) covers the free/academy display.
  let serverProgress = new Map<string, TopicProgress>();
  let methodRows: MethodProgressRow[] = [];
  const itemCountByTopic = new Map<string, number>();
  try {
    const { data: user } = await supabase.from('users').select('id').single();
    if (user?.id && achievementIds.length) {
      const [{ data: prog }, { data: mrows }, { data: items }] = await Promise.all([
        supabase
          .from('student_achievement_progress')
          .select('achievement_id, status, best_genuine_score, quiz_attempts, lockout_until, date_earned')
          .eq('user_id', user.id)
          .in('achievement_id', achievementIds),
        supabase
          .from('student_method_progress')
          .select('achievement_id, method_key, completion_pct, engagement_seconds, answered_count, correct_count, item_states')
          .eq('user_id', user.id)
          .in('achievement_id', achievementIds),
        supabase.from('glossary_topics').select('achievement_id').in('achievement_id', achievementIds),
      ]);
      for (const p of (prog ?? []) as TopicProgress[]) serverProgress.set(p.achievement_id, p);
      methodRows = (mrows ?? []) as MethodProgressRow[];
      for (const r of (items ?? []) as { achievement_id: string }[]) {
        itemCountByTopic.set(r.achievement_id, (itemCountByTopic.get(r.achievement_id) ?? 0) + 1);
      }
    }
  } catch {
    // No student record yet — entitlement rendering below carries the display.
  }

  // If item counts came back empty (no user), fetch them anyway (public read)
  // so the LED meters have a denominator.
  if (itemCountByTopic.size === 0 && achievementIds.length) {
    const { data: items } = await supabase
      .from('glossary_topics')
      .select('achievement_id')
      .in('achievement_id', achievementIds);
    for (const r of (items ?? []) as { achievement_id: string }[]) {
      itemCountByTopic.set(r.achievement_id, (itemCountByTopic.get(r.achievement_id) ?? 0) + 1);
    }
  }

  // 5. Compose progressByTopic: server row if present, else the entitlement.
  const progressByTopic = new Map<string, TopicProgress>();
  for (const t of topics) {
    const server = serverProgress.get(t.id);
    const st = statusFor(server?.status, freeByAch.get(t.id) ?? false, caps);
    if (server) {
      progressByTopic.set(t.id, server);
    } else if (st) {
      progressByTopic.set(t.id, {
        achievement_id: t.id,
        status: st,
        best_genuine_score: 0,
        quiz_attempts: 0,
        lockout_until: null,
        date_earned: null,
      });
    }
    // st === null ⇒ omit ⇒ the dashboard renders it as locked.
  }

  const currentCourse: Course = {
    id: `pub-${order}`,
    code: '',
    name: seedCourse.name,
    sequence: order,
    achievement_count: topics.length,
    color_hex: null,
  };

  return {
    userId: '',
    nickname: null,
    courses: [currentCourse],
    currentCourse,
    topics,
    progressByTopic,
    methodRows,
    methodConfigs: (cfg ?? []) as StudyMethodConfig[],
    itemCountByTopic,
  };
}
