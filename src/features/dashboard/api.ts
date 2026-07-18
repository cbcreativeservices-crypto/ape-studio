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
  course_id: string;
  sequence_in_course: number;
  name: string;
  applicable_methods: string[];
  is_prerequisite: boolean;
  icon_url: string | null;
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

export async function fetchDashboard(): Promise<DashboardData> {
  // 1. Own users row (RLS: own_user) — links auth.uid() → app user id.
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, nickname')
    .single();
  if (userErr || !user) throw new Error('user_not_found');

  // 2. Enrollments + course reference rows.
  const { data: enrollments, error: enrErr } = await supabase
    .from('enrollment')
    .select('course_id, curriculum_version_id, courses(id, code, name, sequence, achievement_count, color_hex)')
    .eq('user_id', user.id);
  if (enrErr) throw enrErr;
  const courses: Course[] = (enrollments ?? [])
    .map((e: any) => e.courses)
    .filter(Boolean)
    .sort((a: Course, b: Course) => a.sequence - b.sequence);
  if (courses.length === 0) throw new Error('not_enrolled');

  // 3. Current course = last-used or first by sequence.
  const lastCourseId = await AsyncStorage.getItem(LAST_COURSE_KEY);
  const currentCourse = courses.find((c) => c.id === lastCourseId) ?? courses[0];
  const cv = (enrollments ?? []).find((e: any) => e.course_id === currentCourse.id)
    ?.curriculum_version_id as string;

  // 4. Active topics for the course, in sequence.
  const { data: topics, error: topErr } = await supabase
    .from('achievements')
    .select('id, course_id, sequence_in_course, name, applicable_methods, is_prerequisite, icon_url')
    .eq('course_id', currentCourse.id)
    .eq('curriculum_version_id', cv)
    .eq('is_active', true)
    .order('sequence_in_course');
  if (topErr) throw topErr;
  const topicIds = (topics ?? []).map((t) => t.id);

  // 5. Own per-topic + per-method progress (missing row = locked / no progress).
  const [
    { data: prog, error: progErr },
    { data: methodRows, error: mErr },
    { data: cfg, error: cfgErr },
    { data: topicItems, error: tiErr },
  ] = await Promise.all([
    supabase
      .from('student_achievement_progress')
      .select('achievement_id, status, best_genuine_score, quiz_attempts, lockout_until, date_earned')
      .eq('user_id', user.id)
      .in('achievement_id', topicIds),
    supabase
      .from('student_method_progress')
      .select('achievement_id, method_key, completion_pct, engagement_seconds, answered_count, correct_count, item_states')
      .eq('user_id', user.id)
      .in('achievement_id', topicIds),
    supabase
      .from('study_methods')
      .select('key, name, sequence, min_engagement_seconds, requires_accuracy, accuracy_threshold, required_passes')
      .order('sequence'),
    supabase.from('glossary_topics').select('achievement_id').in('achievement_id', topicIds),
  ]);
  if (progErr) throw progErr;
  if (mErr) throw mErr;
  if (cfgErr) throw cfgErr;
  if (tiErr) throw tiErr;

  const itemCountByTopic = new Map<string, number>();
  for (const r of (topicItems ?? []) as { achievement_id: string }[]) {
    itemCountByTopic.set(r.achievement_id, (itemCountByTopic.get(r.achievement_id) ?? 0) + 1);
  }

  const progressByTopic = new Map<string, TopicProgress>();
  for (const p of (prog ?? []) as TopicProgress[]) progressByTopic.set(p.achievement_id, p);

  return {
    userId: user.id,
    nickname: user.nickname ?? null,
    courses,
    currentCourse,
    topics: (topics ?? []) as Topic[],
    progressByTopic,
    methodRows: (methodRows ?? []) as MethodProgressRow[],
    methodConfigs: (cfg ?? []) as StudyMethodConfig[],
    itemCountByTopic,
  };
}
