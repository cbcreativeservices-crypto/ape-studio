/**
 * The instructor's class: the PURE half (must-do E3, owner "Build an app
 * screen" 2026-11-07). Import-free so the node tests load it.
 *
 * ── THE SERVER (read live 2026-11-07, SELECT only) ───────────────────────────
 *   instructor_my_code() → text; null unless the caller is an ACTIVE
 *       instructor (employer_profiles.kind = 'instructor', not revoked).
 *   instructor_students() → rows (share_id, student_name, granted_at,
 *       topics_started, topics_complete, labs_complete, labs_total,
 *       last_activity), newest share first. Only students who shared with
 *       THIS instructor.
 *   instructor_student_progress(p_share_id) → jsonb { student {name,
 *       shared_since}, topics [...], labs {complete, total, list,
 *       other_completed}, final_exams [...], credentials [...] }. Raises
 *       "this student has not shared their progress with you" when the share
 *       is gone (or the caller lost verification).
 * Topics = enrolled + studied + every completed topic, before sharing too (no
 * date filter, owner 2026-10-26). Labs = private.student_scoped_labs: the
 * Audio Fundamentals labs (key af_*) + the certificate labs of the ENROLLED
 * topics; any other finished lab is in `other_completed`.
 *
 * ── RULES THIS FILE KEEPS ─────────────────────────────────────────────────
 *  - Never "N of total" for progress (owner 2026-10-29): `labs_total` and
 *    `topics_started` are never printed as a denominator. What was done, by
 *    count and by name. A final exam's "27 / 30" is a SCORE and keeps it (D41).
 *  - A quiz score is a COUNT of right answers (quiz_attempts.score 0–30), not a
 *    percent. The rows do not carry how many questions were served, so the
 *    score is printed alone ("29 right"). A value above the largest quiz is
 *    not a quiz score (two test accounts hold seeded 100s): it is explained in
 *    words, never printed (D53).
 *  - Answers are never returned by the server and never drawn here.
 */

/* ── Shapes ────────────────────────────────────────────────────────────── */

export type ClassStudent = {
  shareId: string;
  name: string;
  sharedSince: string | null;
  topicsStarted: number;
  topicsComplete: number;
  labsComplete: number;
  lastActivity: string | null;
};

export type MethodRow = { key: string; name: string; pct: number; lastStudied: string | null };
export type QuizAttemptRow = { number: number; score: number | null; practice: boolean; submittedAt: string | null };

export type TopicFace = 'complete' | 'studying' | 'not_started';

export type TopicRow = {
  id: string;
  name: string;
  field: string | null;
  subject: string | null;
  face: TopicFace;
  completedAt: string | null;
  bestScore: number | null;
  studyPct: number;
  methods: MethodRow[];
  attempts: QuizAttemptRow[];
};

export type LabRow = { name: string; area: string | null; completedAt: string | null };
export type FinalExamRow = { number: number; score: number; outOf: number; passed: boolean; submittedAt: string | null };
export type CredentialRow = { type: string; name: string; earnedAt: string | null };

export type StudentProgress = {
  name: string;
  sharedSince: string | null;
  topics: TopicRow[];
  labs: LabRow[];
  labsComplete: number;
  otherLabs: LabRow[];
  finalExams: FinalExamRow[];
  credentials: CredentialRow[];
};

/* ── Reading the server's rows ─────────────────────────────────────────── */

const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
/** A whole, non-negative count. Anything else is 0 (the server sends ints). */
export function wholeCount(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
/** A percent for a meter: whole, 0–100. */
export function pctOf(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
const intOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null;

/** instructor_students() → the list. null = the answer was not a list (a
 *  failed read, never "no students"). A row without a share id is dropped:
 *  it could not be opened. */
export function classFromRows(data: unknown): ClassStudent[] | null {
  if (!Array.isArray(data)) return null;
  const out: ClassStudent[] = [];
  for (const raw of data) {
    const r = obj(raw);
    const shareId = r && str(r.share_id);
    if (!r || !shareId) continue;
    out.push({
      shareId,
      name: str(r.student_name) ?? 'Academy member',
      sharedSince: str(r.granted_at),
      topicsStarted: wholeCount(r.topics_started),
      topicsComplete: wholeCount(r.topics_complete),
      labsComplete: wholeCount(r.labs_complete),
      lastActivity: str(r.last_activity),
    });
  }
  return out;
}

/** A topic the server calls in_progress with nothing studied and no quiz
 *  taken is a topic the student enrolled in and has not opened yet. */
export function topicFaceOf(status: unknown, studyPct: number, attempts: number): TopicFace {
  if (status === 'complete') return 'complete';
  return studyPct > 0 || attempts > 0 ? 'studying' : 'not_started';
}

function labFrom(raw: unknown): LabRow | null {
  const r = obj(raw);
  const name = r && str(r.name);
  if (!r || !name) return null;
  return { name, area: str(r.area), completedAt: str(r.completed_at) };
}

/** instructor_student_progress(p_share_id) → the app's shape, or null when
 *  the answer is not the object the server builds. */
export function progressFromJson(data: unknown): StudentProgress | null {
  const d = obj(data);
  const student = d && obj(d.student);
  if (!d || !student) return null;
  const labs = obj(d.labs) ?? {};
  const topics: TopicRow[] = [];
  for (const raw of arr(d.topics)) {
    const t = obj(raw);
    const id = t && str(t.topic_id);
    if (!t || !id) continue;
    const attempts: QuizAttemptRow[] = [];
    for (const a of arr(t.quiz_attempts)) {
      const q = obj(a);
      if (!q) continue;
      attempts.push({
        number: wholeCount(q.number),
        score: intOrNull(q.score),
        practice: q.practice === true,
        submittedAt: str(q.submitted_at),
      });
    }
    const methods: MethodRow[] = [];
    for (const m of arr(t.methods)) {
      const r = obj(m);
      const key = r && str(r.key);
      if (!r || !key) continue;
      methods.push({ key, name: str(r.name) ?? key, pct: pctOf(r.completion_pct), lastStudied: str(r.last_studied) });
    }
    const studyPct = pctOf(t.study_pct);
    topics.push({
      id,
      name: str(t.name) ?? 'Topic',
      field: str(t.field),
      subject: str(t.subject),
      face: topicFaceOf(t.status, studyPct, attempts.length),
      completedAt: t.status === 'complete' ? str(t.completed_at) : null,
      bestScore: intOrNull(t.best_score),
      studyPct,
      methods,
      attempts,
    });
  }
  const list = arr(labs.list).map(labFrom).filter((l): l is LabRow => !!l);
  return {
    name: str(student.name) ?? 'Academy member',
    sharedSince: str(student.shared_since),
    topics,
    labs: list,
    labsComplete: list.filter((l) => !!l.completedAt).length,
    otherLabs: arr(labs.other_completed)
      .map(labFrom)
      .filter((l): l is LabRow => !!l && !!l.completedAt),
    finalExams: arr(d.final_exams)
      .map((raw) => {
        const f = obj(raw);
        if (!f) return null;
        return {
          number: wholeCount(f.number),
          score: wholeCount(f.score),
          outOf: wholeCount(f.out_of),
          passed: f.passed === true,
          submittedAt: str(f.submitted_at),
        };
      })
      .filter((f): f is FinalExamRow => !!f),
    credentials: arr(d.credentials)
      .map((raw) => {
        const c = obj(raw);
        if (!c) return null;
        return { type: str(c.type) ?? 'credential', name: str(c.name) ?? 'Credential', earnedAt: str(c.earned_at) };
      })
      .filter((c): c is CredentialRow => !!c),
  };
}

/** The server's refusal when the share is gone, as opposed to a failed read. */
export function isShareGone(message: string | null | undefined): boolean {
  return /has not shared their progress with you/i.test(message ?? '');
}

/* ── Words for numbers ─────────────────────────────────────────────────── */

/** The largest quiz the Academy serves (features/quiz/api QUIZ_SIZE). */
export const LARGEST_QUIZ = 30;

/** A quiz score is a count of right answers. null = no number to print. */
export function quizScoreText(score: number | null): string | null {
  if (score == null || !Number.isFinite(score) || score < 0 || score > LARGEST_QUIZ) return null;
  return `${Math.round(score)} right`;
}

/** The best-score line on a topic card. */
export function bestScoreText(t: Pick<TopicRow, 'bestScore' | 'attempts' | 'face'>): string {
  const s = quizScoreText(t.bestScore);
  const scored = t.attempts.some((a) => !a.practice);
  if (s && (scored || (t.bestScore ?? 0) > 0)) return `Best quiz: ${s}`;
  if (t.bestScore != null && t.bestScore > LARGEST_QUIZ) return 'No quiz score on record';
  return t.attempts.length ? 'Practice quizzes only' : 'No quiz taken yet';
}

/** "Nov 7, 2026". "—" when there is no date to give. */
export function dayText(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const DAY = 24 * 60 * 60 * 1000;

/** How recently the student did anything: words, and a lamp for the list. */
export type Recency = 'today' | 'week' | 'month' | 'quiet' | 'none';

export function recencyOf(iso: string | null | undefined, now: number): Recency {
  if (!iso) return 'none';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'none';
  const age = now - t;
  if (age < DAY && new Date(t).toDateString() === new Date(now).toDateString()) return 'today';
  if (age < 7 * DAY) return 'week';
  if (age < 30 * DAY) return 'month';
  return 'quiet';
}

export function lastActiveText(iso: string | null | undefined, now: number): string {
  const r = recencyOf(iso, now);
  if (r === 'none') return 'No study recorded yet';
  if (r === 'today') return 'Studied today';
  return `Last studied ${dayText(iso)}`;
}

/** The list row's readouts: what was done, never "of" anything. */
export function studentReadouts(s: Pick<ClassStudent, 'topicsStarted' | 'topicsComplete' | 'labsComplete'>): {
  value: number;
  label: string;
}[] {
  // Enrolled or studied, not complete. The detail screen splits these into
  // "studying now" and "enrolled, not started"; the list row cannot tell.
  const studying = Math.max(0, s.topicsStarted - s.topicsComplete);
  return [
    { value: s.topicsComplete, label: s.topicsComplete === 1 ? 'TOPIC DONE' : 'TOPICS DONE' },
    { value: studying, label: 'IN PROGRESS' },
    { value: s.labsComplete, label: s.labsComplete === 1 ? 'LAB DONE' : 'LABS DONE' },
  ];
}

/** The topic groups, in the order a teacher reads them: what they are on now,
 *  what they finished, what they signed up for and have not opened. */
export const TOPIC_GROUPS: { face: TopicFace; head: string }[] = [
  { face: 'studying', head: 'STUDYING NOW' },
  { face: 'complete', head: 'COMPLETED' },
  { face: 'not_started', head: 'ENROLLED, NOT STARTED' },
];

export function topicsByFace(topics: TopicRow[]): { face: TopicFace; head: string; topics: TopicRow[] }[] {
  const byName = (a: TopicRow, b: TopicRow) => a.name.localeCompare(b.name);
  return TOPIC_GROUPS.map((g) => ({ ...g, topics: topics.filter((t) => t.face === g.face).sort(byName) })).filter(
    (g) => g.topics.length > 0,
  );
}

/** labs.area → the heading a teacher reads. */
export const LAB_AREA_NAMES: Record<string, string> = {
  audio_fundamentals: 'Audio Fundamentals',
  ear: 'Ear Training',
  miking: 'Miking',
  mixing: 'Mixing',
  training: 'Training',
};

export function labAreaName(area: string | null): string {
  if (!area) return 'Other';
  return LAB_AREA_NAMES[area] ?? area.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Scoped labs grouped by area, Audio Fundamentals first, the server's own
 *  order kept inside a group. Finished labs lead each group. */
export function labsByArea(labs: LabRow[]): { area: string; name: string; done: LabRow[]; notYet: LabRow[] }[] {
  const order: string[] = [];
  const groups = new Map<string, LabRow[]>();
  for (const l of labs) {
    const k = l.area ?? '';
    if (!groups.has(k)) {
      groups.set(k, []);
      order.push(k);
    }
    groups.get(k)!.push(l);
  }
  order.sort((a, b) => (a === 'audio_fundamentals' ? -1 : b === 'audio_fundamentals' ? 1 : 0));
  return order.map((k) => {
    const rows = groups.get(k)!;
    return {
      area: k,
      name: labAreaName(k || null),
      done: rows.filter((l) => !!l.completedAt),
      notYet: rows.filter((l) => !l.completedAt),
    };
  });
}

/** "Certificate" / "Program". */
export function credentialKind(type: string): string {
  if (type === 'certificate') return 'CERTIFICATE';
  if (type === 'program') return 'PROGRAM';
  return type.toUpperCase();
}

/** A final exam line: the score keeps its total (a score, D41). */
export function finalExamScore(f: FinalExamRow): string {
  return f.outOf > 0 ? `${f.score} / ${f.outOf}` : `${f.score}`;
}

/* ── Every word the instructor reads ───────────────────────────────────── */

export const CLASS_COPY = {
  // Profile → INSTRUCTOR ACCOUNT, under the code.
  entry: 'YOUR STUDENTS ›',
  entryA11y: 'Open your students’ progress',
  entrySub: 'Progress from the students who chose to share it with you.',
  // The list.
  eyebrow: 'VERIFIED INSTRUCTOR',
  title: ['Your', 'Students'] as const,
  codeHead: 'YOUR INSTRUCTOR CODE',
  codeBody: 'Students enter this code in the app under Profile → MY INSTRUCTOR. They can stop sharing at any time.',
  shareCode: 'SHARE MY CODE ›',
  listHead: 'SHARING WITH YOU',
  loadingClass: 'Loading your class…',
  classFailed:
    'Couldn’t load your class just now. This is a connection problem, not a change to your students.',
  tryAgain: 'TRY AGAIN',
  emptyTitle: 'No students are sharing with you yet',
  emptyBody:
    'That is normal until your students enter your code. Each student turns sharing on in the app, and appears here as soon as they do.',
  notInstructor: 'This view is for verified instructors. Your account is not a verified instructor account.',
  // One student.
  sharedSince: (day: string) => `Sharing with you since ${day}`,
  loadingStudent: 'Loading progress…',
  studentFailed: 'Couldn’t load this student’s progress just now. Check your connection and try again.',
  goneTitle: 'No longer shared',
  goneBody: 'This student has stopped sharing their progress with you, so there is nothing to show.',
  topicsHead: 'TOPICS',
  topicsEmpty: 'No topics yet. Topics appear here once the student enrols in one or starts studying.',
  methodsHead: 'STUDY METHODS',
  attemptsHead: 'QUIZ ATTEMPTS',
  practice: 'PRACTICE',
  labsHead: 'LABS FOR THEIR TOPICS',
  labsNote: 'The Audio Fundamentals labs and the labs the certificates of their enrolled topics require.',
  labsEmpty: 'No labs yet.',
  notYet: 'Not yet',
  otherLabsHead: 'OTHER LABS COMPLETED',
  finalsHead: 'FINAL EXAMS',
  finalsEmpty: 'No final exams yet.',
  passed: 'PASSED',
  notPassed: 'NOT PASSED',
  credsHead: 'CREDENTIALS',
  credsEmpty: 'No credentials yet.',
  neverHead: 'NEVER SHOWN TO YOU',
  never:
    'Answers to any question (only scores and dates), the student’s notes, their email address and their private user name.',
  completeOn: (day: string) => `COMPLETE · ${day}`,
  studying: 'STUDYING',
  notStarted: 'NOT STARTED',
};

/**
 * ⚠ DRAFT, NOT APPROVED (must-do E3 / plan B2): the short student-data
 * statement for schools. It needs the owner's wording sign-off. Shown ONLY in
 * the dev sample harness, stamped DRAFT, and nowhere in a release build.
 */
export const SCHOOL_DATA_STATEMENT_DRAFT = {
  head: 'STUDENT DATA, FOR SCHOOLS · DRAFT',
  paragraphs: [
    'A student’s progress is shared with an instructor only when the student turns sharing on and enters that instructor’s code. It is off unless they turn it on, it goes to one verified instructor at a time, and the student can turn it off at any moment. Employers never see it.',
    'While sharing is on, the instructor sees the student’s certificate name, their topics (enrolled, studied and completed, including those completed before sharing), how far they are in each study method, quiz and final exam scores with dates, their labs, the credentials they have earned, and when they last studied.',
    'The instructor never sees the student’s answers, notes, email address or private user name. When the student stops sharing, the instructor’s view of them closes at once.',
    'Instructor accounts are checked by the Academy before they are approved. Every time a student turns sharing on or off, the Academy keeps a record of it.',
  ] as readonly string[],
};
