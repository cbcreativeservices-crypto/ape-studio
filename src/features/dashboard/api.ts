/**
 * Dashboard data layer — READS ONLY (RLS-scoped selects). All progress facts
 * come from server rows; the client never writes tables (study writes go
 * through record_study_progress in M4, quiz through the quiz RPCs in M5).
 *
 * Status vocabulary (from deployed recompute_reachability):
 *   locked · unlocked · passed_incomplete (partial 20–23, clamps one-ahead) ·
 *   complete (full pass 24–25).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export type TopicStatus = 'locked' | 'unlocked' | 'passed_incomplete' | 'complete';

export type Course = {
  id: string;
  code: string;
  name: string;
  sequence: number;
  achievement_count: number;
  color_hex: string | null;
};

export type Topic = {
  id: string;
  sequence_in_course: number;
  name: string;
  applicable_methods: string[];
  is_prerequisite: boolean;
  icon_url: string | null;
  /** achievements.global_sequence — present on enrollment-driven topics so the
   *  Dashboard can map a topic back to its enrollment entry (active/inactive). */
  global_sequence?: number | null;
};

export type TopicProgress = {
  achievement_id: string;
  status: TopicStatus;
  best_genuine_score: number;
  quiz_attempts: number;
  lockout_until: string | null;
  date_earned: string | null;
};

export type MethodProgressRow = {
  achievement_id: string;
  method_key: string;
  completion_pct: number;
  engagement_seconds: number;
  answered_count: number;
  correct_count: number;
  /** Per-item pass states (server-written by record_study_progress). */
  item_states: Record<string, { views?: number; known?: boolean; attempts?: number }> | null;
};

export type StudyMethodConfig = {
  key: string;
  name: string;
  sequence: number;
  min_engagement_seconds: number;
  requires_accuracy: boolean;
  accuracy_threshold: number;
  required_passes: number;
};

export type DashboardData = {
  userId: string;
  nickname: string | null;
  courses: Course[];
  currentCourse: Course;
  topics: Topic[];
  progressByTopic: Map<string, TopicProgress>;
  methodRows: MethodProgressRow[];
  methodConfigs: StudyMethodConfig[];
  /** Topic item-universe sizes (glossary_topics counts) for display progress. */
  itemCountByTopic: Map<string, number>;
};

const LAST_COURSE_KEY = 'ape:lastCourseId';
const lastTopicKey = (courseId: string) => `ape:lastTopic:${courseId}`;

export async function getLastTopicIndex(courseId: string): Promise<number | null> {
  const v = await AsyncStorage.getItem(lastTopicKey(courseId));
  return v == null ? null : Number(v);
}

export async function setLastTopicIndex(courseId: string, idx: number): Promise<void> {
  await AsyncStorage.setItem(lastTopicKey(courseId), String(idx));
}

export async function setLastCourse(courseId: string): Promise<void> {
  await AsyncStorage.setItem(LAST_COURSE_KEY, courseId);
}

/** Synthetic course id for the enrollment-driven Dashboard (user request
 *  2026-07-22) — used for the last-topic-index storage key + display. */
export const ENROLLMENT_COURSE_ID = 'enrollment';

/**
 * Item-universe sizes per topic — the Dashboard denominator for study-method
 * completion. Counts glossary_topics rows by achievement_id; for any topic whose
 * DIRECT count is 0, unions across sibling achievements that share the same NAME.
 *
 * This mirrors the duplicate-achievement name-union in features/study/api.ts
 * (fetchTopicItems): the v3 launch left several achievement rows sharing one
 * topic name with the glossary terms mapped to only ONE of those ids (e.g.
 * Professional Audio Safety / gs3060). Without the union the Dashboard reads a
 * 0 denominator while Flashcards happily loads terms via the sibling union — so
 * flashcards % is stuck at 0, homeworkPowered never flips, and fill-in-blank /
 * matching / scenarios / quiz are all dead switches forever. gs3060 is an
 * auto-enrolled free topic, i.e. the first thing a new tester touches.
 */
async function resolveItemCounts(
  topicIds: string[],
  topicNameById: Map<string, string>,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (topicIds.length === 0) return counts;

  // Direct counts (glossary_topics is a unique (achievement_id, glossary_id)
  // mapping, so row count == distinct term count for a single achievement_id).
  const { data: direct } = await supabase
    .from('glossary_topics')
    .select('achievement_id')
    .in('achievement_id', topicIds);
  for (const r of (direct ?? []) as { achievement_id: string }[]) {
    counts.set(r.achievement_id, (counts.get(r.achievement_id) ?? 0) + 1);
  }

  // Topics with zero direct terms → resolve siblings by name and union, deduping
  // by glossary_id exactly as the study fetch does.
  const zeroIds = topicIds.filter((id) => (counts.get(id) ?? 0) === 0);
  if (zeroIds.length === 0) return counts;

  const names = Array.from(
    new Set(zeroIds.map((id) => topicNameById.get(id)).filter(Boolean) as string[]),
  );
  if (names.length === 0) return counts;

  const { data: sibs } = await supabase.from('achievements').select('id, name').in('name', names);
  const nameByAch = new Map<string, string>();
  for (const s of (sibs ?? []) as { id: string; name: string }[]) nameByAch.set(s.id, s.name);
  const allSibIds = Array.from(nameByAch.keys());
  if (allSibIds.length === 0) return counts;

  const { data: sibItems } = await supabase
    .from('glossary_topics')
    .select('achievement_id, glossary_id')
    .in('achievement_id', allSibIds);
  const glossaryByName = new Map<string, Set<string>>();
  for (const r of (sibItems ?? []) as { achievement_id: string; glossary_id: string }[]) {
    const name = nameByAch.get(r.achievement_id);
    if (!name) continue;
    const set = glossaryByName.get(name) ?? new Set<string>();
    set.add(r.glossary_id);
    glossaryByName.set(name, set);
  }
  for (const id of zeroIds) {
    const name = topicNameById.get(id);
    const set = name ? glossaryByName.get(name) : undefined;
    if (set && set.size > 0) counts.set(id, set.size);
  }
  return counts;
}

/**
 * Enrollment-driven Dashboard (user request 2026-07-22): builds a DashboardData
 * whose `topics` are the user's enrolled topics resolved from their
 * global_sequence (gs), in the given order, so the EXISTING Dashboard renders
 * them with the full study machinery (methods + quiz + meters). Cross-course by
 * nature. Reads only; defensive about the users row (progress stays empty when
 * there's no account — e.g. anonymous local lists).
 *
 * `gsList` should be the FULL enrolled order (active + inactive); the caller
 * dims inactive ones by matching topic.global_sequence.
 */
export async function fetchEnrollmentDashboard(gsList: number[]): Promise<DashboardData> {
  // Own users row (absent for anonymous/local → progress stays empty).
  let userId = 'local';
  let nickname: string | null = null;
  try {
    const { data: user } = await supabase.from('users').select('id, nickname').single();
    if (user) {
      userId = user.id;
      nickname = (user as { nickname: string | null }).nickname ?? null;
    }
  } catch {
    // no account — device-local only
  }

  const currentCourse: Course = {
    id: ENROLLMENT_COURSE_ID,
    code: 'ENROLL',
    name: 'My Enrollment',
    sequence: 0,
    achievement_count: gsList.length,
    color_hex: null,
  };

  // Method configs are global — load them so the method blocks render. NON-FATAL:
  // a session-less GUEST (anon role) has no table-level grant on study_methods, so
  // this select 403s for them. That must NOT break guest study of the free topics
  // — the method panels render from the static METHOD_ORDER regardless, and the
  // free topics' gates are display-only. On any error configs stay empty (an authed
  // user always has the grant, so their result is unchanged).
  const { data: cfg, error: cfgErr } = await supabase
    .from('study_methods')
    .select('key, name, sequence, min_engagement_seconds, requires_accuracy, accuracy_threshold, required_passes')
    .order('sequence');
  if (cfgErr) console.warn('[dashboard] study_methods unavailable (guest?):', cfgErr.message);
  const methodConfigs = (cfg ?? []) as StudyMethodConfig[];

  const empty: DashboardData = {
    userId,
    nickname,
    courses: [currentCourse],
    currentCourse,
    topics: [],
    progressByTopic: new Map(),
    methodRows: [],
    methodConfigs,
    itemCountByTopic: new Map(),
  };
  if (gsList.length === 0) return empty;

  // Resolve gs → achievements (cross-course). Dedupe by gs; keep enrollment order.
  const { data: achRows, error: achErr } = await supabase
    .from('achievements')
    .select('id, sequence_in_course, name, applicable_methods, is_prerequisite, icon_url, global_sequence')
    .in('global_sequence', gsList);
  if (achErr) throw achErr;
  const byGs = new Map<number, Topic>();
  for (const a of (achRows ?? []) as any[]) {
    if (a.global_sequence == null || byGs.has(a.global_sequence)) continue;
    byGs.set(a.global_sequence, {
      id: a.id,
      sequence_in_course: a.sequence_in_course,
      name: a.name,
      applicable_methods: a.applicable_methods ?? [],
      is_prerequisite: !!a.is_prerequisite,
      icon_url: a.icon_url ?? null,
      global_sequence: a.global_sequence,
    });
  }
  const topics: Topic[] = gsList.map((gs) => byGs.get(gs)).filter(Boolean) as Topic[];
  const topicIds = topics.map((t) => t.id);
  if (topicIds.length === 0) return empty;

  const progressByTopic = new Map<string, TopicProgress>();
  let methodRows: MethodProgressRow[] = [];

  const nameById = new Map<string, string>(topics.map((t) => [t.id, t.name]));
  const itemCountByTopic = await resolveItemCounts(topicIds, nameById);

  if (userId !== 'local') {
    const [{ data: prog }, { data: mRows }] = await Promise.all([
      supabase
        .from('student_achievement_progress')
        .select('achievement_id, status, best_genuine_score, quiz_attempts, lockout_until, date_earned')
        .eq('user_id', userId)
        .in('achievement_id', topicIds),
      supabase
        .from('student_method_progress')
        .select('achievement_id, method_key, completion_pct, engagement_seconds, answered_count, correct_count, item_states')
        .eq('user_id', userId)
        .in('achievement_id', topicIds),
    ]);
    for (const p of (prog ?? []) as TopicProgress[]) progressByTopic.set(p.achievement_id, p);
    methodRows = (mRows ?? []) as MethodProgressRow[];
  }

  return {
    userId,
    nickname,
    courses: [currentCourse],
    currentCourse,
    topics,
    progressByTopic,
    methodRows,
    methodConfigs,
    itemCountByTopic,
  };
}

// fetchDashboard() removed 2026-09-03 (owner decision "delete two dead entry
// points"). It read `enrollment` joined to the archived `courses` table and
// keyed topics on achievements.course_id — all v1. It was already unreachable:
// its only caller sat on the false arm of a ternary behind commercialMode,
// which is permanently true. Removing it is what lets the enrollment table
// and achievements.course_id be dropped.
