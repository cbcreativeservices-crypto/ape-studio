import { getSupabaseBrowser } from "./supabase";

/**
 * Web dashboard read layer — READS ONLY, RLS-scoped to the signed-in user.
 * Mirrors the mobile app's data model (src/features/dashboard/api.ts) but at a
 * summary level: identity, membership tier, progress totals, "up next", and
 * earned credentials. The web never writes tables.
 */

export type Tier = "anonymous" | "free" | "academy" | "lapsed";

export type CourseProgress = {
  courseId: string;
  code: string;
  name: string;
  sequence: number;
  colorHex: string | null;
  total: number;
  complete: number;
};

export type UpNext = {
  courseName: string;
  topicName: string;
} | null;

export type Credential = {
  id: string;
  type: string;
  name: string;
  earnedAt: string | null;
};

export type DashboardSummary = {
  userId: string;
  displayName: string | null;
  tier: Tier;
  courses: CourseProgress[];
  totalTopics: number;
  completeTopics: number;
  upNext: UpNext;
  credentials: Credential[];
  credentialsAvailable: boolean;
};

/** Mirror of EntitlementProvider: an ACTIVE, non-expired academy row ⇒ academy;
 *  an academy row that's inactive/expired ⇒ lapsed; a signed-in account with no
 *  academy row ⇒ free. (anonymous is handled by the caller when no session.) */
async function deriveTier(): Promise<Tier> {
  const supabase = getSupabaseBrowser();
  try {
    const { data } = await supabase
      .from("entitlements")
      .select("status, expires_at")
      .eq("product", "academy");
    const acad = (data ?? [])[0] as
      | { status?: string; expires_at?: string | null }
      | undefined;
    if (acad) {
      const notExpired =
        !acad.expires_at || new Date(acad.expires_at).getTime() > Date.now();
      return acad.status === "active" && notExpired ? "academy" : "lapsed";
    }
  } catch {
    // Network/RLS failure — safe signed-in default.
  }
  return "free";
}

async function fetchCredentials(): Promise<{
  credentials: Credential[];
  available: boolean;
}> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("credential_awards")
    .select("id, credential_type, credential_id, earned_at, revoked_at")
    .is("revoked_at", null);
  // No self-read policy yet (DB-7) or another RLS denial ⇒ treat as unavailable
  // rather than an error state; the UI shows an empty/coming state.
  if (error) return { credentials: [], available: false };

  const rows = (data ?? []) as {
    id: string;
    credential_type: string;
    credential_id: string;
    earned_at: string | null;
  }[];
  if (rows.length === 0) return { credentials: [], available: true };

  // Resolve display names from certificates/programs by type.
  const certIds = rows.filter((r) => r.credential_type === "certificate").map((r) => r.credential_id);
  const progIds = rows.filter((r) => r.credential_type === "program").map((r) => r.credential_id);
  const nameById = new Map<string, string>();
  await Promise.all([
    certIds.length
      ? supabase.from("certificates").select("id, name").in("id", certIds).then(({ data }) => {
          for (const c of (data ?? []) as { id: string; name: string }[]) nameById.set(c.id, c.name);
        })
      : Promise.resolve(),
    progIds.length
      ? supabase.from("programs").select("id, name").in("id", progIds).then(({ data }) => {
          for (const p of (data ?? []) as { id: string; name: string }[]) nameById.set(p.id, p.name);
        })
      : Promise.resolve(),
  ]);

  const credentials: Credential[] = rows.map((r) => ({
    id: r.id,
    type: r.credential_type,
    name: nameById.get(r.credential_id) ?? "Credential",
    earnedAt: r.earned_at,
  }));
  return { credentials, available: true };
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const supabase = getSupabaseBrowser();

  // 1. Own users row (RLS own_user links auth.uid() → app user id).
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, nickname, first_name, last_name_initial")
    .single();
  if (userErr || !user) throw new Error("user_not_found");
  const displayName =
    (user.nickname as string | null) ||
    [user.first_name, user.last_name_initial].filter(Boolean).join(" ") ||
    null;

  const tier = await deriveTier();

  // 2. Enrollments + course reference rows (own_enrollment).
  const { data: enrollments } = await supabase
    .from("enrollment")
    .select(
      "course_id, curriculum_version_id, courses(id, code, name, sequence, achievement_count, color_hex)",
    )
    .eq("user_id", user.id);

  type EnrRow = {
    course_id: string;
    curriculum_version_id: string;
    courses: {
      id: string;
      code: string;
      name: string;
      sequence: number;
      achievement_count: number;
      color_hex: string | null;
    } | null;
  };
  const enrs = (enrollments ?? []) as unknown as EnrRow[];

  // 3. Active topics across enrolled courses, and own progress.
  const courses: CourseProgress[] = [];
  let totalTopics = 0;
  let completeTopics = 0;
  let upNext: UpNext = null;

  // Fetch per course (small N); keeps curriculum_version filtering exact.
  const sortedEnrs = enrs
    .filter((e) => e.courses)
    .sort((a, b) => (a.courses!.sequence ?? 0) - (b.courses!.sequence ?? 0));

  for (const e of sortedEnrs) {
    const c = e.courses!;
    const { data: topics } = await supabase
      .from("achievements")
      .select("id, name, sequence_in_course")
      .eq("course_id", c.id)
      .eq("curriculum_version_id", e.curriculum_version_id)
      .eq("is_active", true)
      .order("sequence_in_course");
    const topicRows = (topics ?? []) as {
      id: string;
      name: string;
      sequence_in_course: number;
    }[];
    const topicIds = topicRows.map((t) => t.id);

    const { data: prog } = topicIds.length
      ? await supabase
          .from("student_achievement_progress")
          .select("achievement_id, status")
          .eq("user_id", user.id)
          .in("achievement_id", topicIds)
      : { data: [] as { achievement_id: string; status: string }[] };
    const statusById = new Map<string, string>();
    for (const p of (prog ?? []) as { achievement_id: string; status: string }[]) {
      statusById.set(p.achievement_id, p.status);
    }

    const total = topicRows.length;
    let complete = 0;
    for (const t of topicRows) {
      const st = statusById.get(t.id);
      if (st === "complete") complete += 1;
      else if (!upNext) upNext = { courseName: c.name, topicName: t.name };
    }

    courses.push({
      courseId: c.id,
      code: c.code,
      name: c.name,
      sequence: c.sequence,
      colorHex: c.color_hex,
      total,
      complete,
    });
    totalTopics += total;
    completeTopics += complete;
  }

  const { credentials, available } = await fetchCredentials();

  return {
    userId: user.id,
    displayName,
    tier,
    courses,
    totalTopics,
    completeTopics,
    upNext,
    credentials,
    credentialsAvailable: available,
  };
}
