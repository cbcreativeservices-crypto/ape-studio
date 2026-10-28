import { getSupabaseBrowser } from "./supabase";

/**
 * Instructor view (owner 2026-10-26: "build the website instructor page").
 *
 * Reads ONLY the three instructor functions that have been live since
 * 2026-10-04. Each one checks on the server that the caller is an active
 * instructor (`employer_profiles.kind = 'instructor'`, not revoked) and, for a
 * student, that THIS student shared with THIS instructor. Nothing here can see
 * a student who did not share, and quiz/exam ANSWERS are never returned, only
 * scores and dates.
 *
 * Owner rulings the server applies (not this file): topics = enrolled +
 * studied + every completed topic, including before the student shared (no
 * date filter); labs = the certificate labs of the enrolled topics + the
 * Audio Fundamentals labs, with labs done outside that set listed apart.
 */

export type StudentRow = {
  share_id: string;
  student_name: string;
  granted_at: string;
  topics_started: number;
  topics_complete: number;
  labs_complete: number;
  labs_total: number;
  last_activity: string | null;
};

export type MethodProgress = {
  key: string;
  name: string;
  completion_pct: number;
  last_studied: string | null;
};

export type QuizAttempt = {
  number: number;
  score: number | null;
  practice: boolean;
  submitted_at: string;
};

export type TopicProgress = {
  topic_id: string;
  name: string;
  field: string | null;
  subject: string | null;
  status: "complete" | "in_progress";
  completed_at: string | null;
  best_score: number | null;
  study_pct: number;
  methods: MethodProgress[];
  quiz_attempts: QuizAttempt[];
};

export type LabRow = { name: string; area: string | null; completed_at: string | null };

export type StudentProgress = {
  student: { name: string; shared_since: string };
  topics: TopicProgress[];
  labs: {
    complete: number;
    total: number;
    list: LabRow[];
    /** Arrives with Comp A's labs-scope change (owner 2026-10-26); absent before it. */
    other_completed?: LabRow[];
  };
  final_exams: { number: number; score: number; out_of: number; passed: boolean; submitted_at: string }[];
  credentials: { type: string; name: string; earned_at: string }[];
};

export type InstructorState =
  | { kind: "signed-out" }
  | { kind: "not-instructor" }
  | { kind: "error" }
  | { kind: "ready"; code: string; students: StudentRow[] };

/** Who is asking, and their class. A failed read is "error", never "no students". */
export async function loadInstructor(): Promise<InstructorState> {
  const sb = getSupabaseBrowser();
  const { data: sess } = await sb.auth.getSession();
  if (!sess.session) return { kind: "signed-out" };

  // instructor_my_code answers null for anyone who is not an active instructor.
  const code = await sb.rpc("instructor_my_code");
  if (code.error) return { kind: "error" };
  if (!code.data) return { kind: "not-instructor" };

  const list = await sb.rpc("instructor_students");
  if (list.error) return { kind: "error" };
  return { kind: "ready", code: String(code.data), students: (list.data ?? []) as StudentRow[] };
}

/** One student's progress. Throws on any failure (the screen says so). */
export async function loadStudent(shareId: string): Promise<StudentProgress> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.rpc("instructor_student_progress", { p_share_id: shareId });
  if (error || !data) throw new Error(error?.message ?? "no data");
  return data as StudentProgress;
}

/** "26 Oct 2026" — the site's other dates read this way. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
