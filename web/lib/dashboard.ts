import { getSupabaseBrowser } from "./supabase";

/**
 * Web dashboard read layer — READS ONLY, RLS-scoped to the signed-in user.
 * Mirrors the mobile app's data model (src/features/dashboard/api.ts) but at a
 * summary level: identity, membership tier, progress totals, "up next", and
 * earned credentials. The web never writes tables.
 */

export type Tier = "anonymous" | "free" | "academy" | "lapsed";

/**
 * ⛔ v3 GROUPS BY SUBJECT, NOT BY COURSE. The course model was retired
 * 2026-09-03 and `achievements.course_id` is NULL on every live v3 topic, so
 * the old per-course panel returned nothing for everybody. The v3 curriculum is
 * Field → Subject → Topic, and the SUBJECT is the middle tier that reads like
 * the old course did.
 */
export type SubjectProgress = {
  /** Stable key: the subject name is unique within the active curriculum. */
  subject: string;
  field: string | null;
  total: number;
  complete: number;
};

export type UpNext = {
  subjectName: string;
  topicName: string;
} | null;

/** The active v3 curriculum (mirrors `src/data/v3Curriculum.ts`). Topics are
 *  resolved by `global_sequence` within THIS version — the same id the app
 *  resolves by, so the two cannot drift onto different curricula. */
const V3_CURRICULUM_VERSION_ID = "a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72";

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
  subjects: SubjectProgress[];
  totalTopics: number;
  completeTopics: number;
  /** FALSE when the enrolment read FAILED, as distinct from a member who is
   *  genuinely enrolled in nothing. The page must not present the two the same
   *  way — telling a member with 40 topics that they have none, as a fact, is
   *  the failure this whole panel was rebuilt for. */
  progressAvailable: boolean;
  upNext: UpNext;
  credentials: Credential[];
  credentialsAvailable: boolean;
};

/** Mirror of EntitlementProvider: an ACTIVE, non-expired academy row ⇒ academy;
 *  an academy row that's inactive/expired ⇒ lapsed; a signed-in account with no
 *  academy row ⇒ free. (anonymous is handled by the caller when no session.)
 *
 *  ⛔ THIS COPY DRIFTED, AND CALLING ITSELF A MIRROR IS WHY NOBODY NOTICED.
 *  It mirrored the PRE-FIX version and re-introduced both defects the app was
 *  audited for. Re-synced 2026-09-23; `test/webMirrorsEntitlementRuling.test.ts`
 *  now fails if either drifts again. The app's reasoning lives in
 *  `src/features/commercial/EntitlementProvider.tsx` (`academyTierFromRows`) and
 *  `src/features/commercial/entitlementExpiry.ts` — read those before editing
 *  this. `web/` cannot import from `src/` (separate tsconfig, no shared path),
 *  so this is a deliberate re-implementation, not an oversight. */
type AcademyRow = { status?: string; expires_at?: string | null };

/** Does this row's expiry leave it entitling the member?
 *
 *  ⛔ UNREADABLE EXPIRY ⇒ FAIL OPEN (owner ruling 2026-09-11). The old guard was
 *  `new Date(expires_at).getTime() > Date.now()`, which leans on the comparison
 *  to do the checking — and `NaN > now` is FALSE. So a row whose `expires_at`
 *  was present but unparseable read as ALREADY EXPIRED and silently dropped a
 *  PAYING member to "lapsed". Only a timestamp we genuinely READ and that has
 *  genuinely PASSED may take access away. */
function keepsAccess(expiresAt: string | null | undefined): boolean {
  if (expiresAt === null || expiresAt === undefined || expiresAt === "") return true;
  // A non-string is unreadable, and unreadable keeps access (see above).
  if (typeof expiresAt !== "string") return true;
  const ms = Date.parse(expiresAt);
  if (!Number.isFinite(ms)) return true; // unreadable ⇒ keep access
  return ms > Date.now();
}

async function deriveTier(): Promise<Tier> {
  const supabase = getSupabaseBrowser();
  try {
    const { data, error } = await supabase
      .from("entitlements")
      .select("status, expires_at")
      .eq("product", "academy");
    // A read FAILURE is not "this member has no entitlement". Without this the
    // page silently told a paying member they were on a free account.
    if (error) throw error;
    const rows = (data ?? []) as AcademyRow[];
    // ⛔ SCAN, do not trust row [0]. A user may hold MULTIPLE academy rows (an
    // expired one plus an active one) with NO guaranteed order — there is no
    // ORDER BY on this query — so `[0]` could classify an active member as
    // lapsed (owner debug audit).
    const active = rows.some((r) => r.status === "active" && keepsAccess(r.expires_at));
    if (active) return "academy";
    if (rows.length > 0) return "lapsed";
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

  // 1. Own users row.
  //
  // ⛔ FILTERED ON auth_id, NOT LEFT TO RLS. The comment here used to say
  // "RLS own_user links auth.uid() → app user id", and that is true for an
  // ordinary member — but `public.users` also carries `admin_all_users`
  // (ALL, is_admin()), so an ADMIN matches every row and `.single()` raises
  // PGRST116. This function then threw `user_not_found`, i.e. the website
  // told an administrator they had no account.
  const { data: auth } = await supabase.auth.getUser();
  const authUid = auth?.user?.id;
  if (!authUid) throw new Error("user_not_found");
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, nickname, first_name, last_name_initial")
    .eq("auth_id", authUid)
    .single();
  if (userErr || !user) throw new Error("user_not_found");
  const displayName =
    (user.nickname as string | null) ||
    [user.first_name, user.last_name_initial].filter(Boolean).join(" ") ||
    null;

  const tier = await deriveTier();

  // 2. The member's own enrolled topics (v3).
  //
  // ⛔ THIS REPLACED THE v1 COURSE WALK (2026-09-23). The old code read
  // `enrollment` joined to the archived `courses` table and keyed topics on
  // `achievements.course_id`. The app deleted its equivalent on 2026-09-03; the
  // website kept it, and `course_id` is NULL on all 166 live v3 topics — so the
  // panel reported "not enrolled in any topics yet / 0 of 0 / 0%" to 100% of
  // signed-in members, while the credentials block beside it rendered
  // correctly, which is exactly what made the empty progress read as TRUE.
  //
  // `user_topic_enrollments` is RLS-scoped to the caller's own rows, so no
  // user filter is passed here — see the `own_topic_enrollments` policy in
  // supabase/migrations/2026092301_own_topic_enrollments_read.sql.
  let progressAvailable = true;
  const subjects: SubjectProgress[] = [];
  let totalTopics = 0;
  let completeTopics = 0;
  let upNext: UpNext = null;

  const { data: enrRows, error: enrErr } = await supabase
    .from("user_topic_enrollments")
    .select("gs, active, position")
    .order("position", { ascending: true });

  // ⛔ A FAILED READ IS NOT "ENROLLED IN NOTHING". Until the migration above is
  // applied this table is deny-all to `authenticated` and returns 42501, so
  // this branch is the LIVE one — and it must say so rather than invent a zero.
  if (enrErr) progressAvailable = false;

  const enrolled = ((enrRows ?? []) as { gs: number; active: boolean | null; position: number }[])
    // `active: false` is a parked topic; the app does not count it either.
    .filter((e) => e.active !== false && typeof e.gs === "number");

  if (progressAvailable && enrolled.length > 0) {
    const gsList = enrolled.map((e) => e.gs);

    const { data: achRows, error: achErr } = await supabase
      .from("achievements")
      .select("id, name, field, subject, global_sequence")
      .eq("curriculum_version_id", V3_CURRICULUM_VERSION_ID)
      .eq("is_active", true)
      .in("global_sequence", gsList)
      .order("global_sequence");
    if (achErr) progressAvailable = false;

    const topics = (achRows ?? []) as {
      id: string;
      name: string;
      field: string | null;
      subject: string | null;
      global_sequence: number;
    }[];

    if (progressAvailable && topics.length > 0) {
      const { data: prog, error: progErr } = await supabase
        .from("student_achievement_progress")
        .select("achievement_id, status")
        .eq("user_id", user.id)
        .in(
          "achievement_id",
          topics.map((t) => t.id),
        );
      // Same rule: a failed progress read must not render as "nothing complete".
      if (progErr) progressAvailable = false;

      const statusById = new Map<string, string>();
      for (const pr of (prog ?? []) as { achievement_id: string; status: string }[]) {
        statusById.set(pr.achievement_id, pr.status);
      }

      if (progressAvailable) {
        // Keep the member's OWN ordering for "up next" — `position` is the order
        // they arranged in My Enrollments, and the first thing they have not
        // finished in their own order is the honest answer.
        const orderByGs = new Map(enrolled.map((e, i) => [e.gs, i]));
        const inOwnOrder = [...topics].sort(
          (a, b) =>
            (orderByGs.get(a.global_sequence) ?? Number.MAX_SAFE_INTEGER) -
            (orderByGs.get(b.global_sequence) ?? Number.MAX_SAFE_INTEGER),
        );

        const bySubject = new Map<string, SubjectProgress>();
        for (const t of inOwnOrder) {
          const subject = t.subject || "Other";
          const group = bySubject.get(subject) ?? {
            subject,
            field: t.field ?? null,
            total: 0,
            complete: 0,
          };
          group.total += 1;
          const done = statusById.get(t.id) === "complete";
          if (done) group.complete += 1;
          else if (!upNext) upNext = { subjectName: subject, topicName: t.name };
          bySubject.set(subject, group);
        }

        subjects.push(...bySubject.values());
        for (const g of subjects) {
          totalTopics += g.total;
          completeTopics += g.complete;
        }
      }
    }
  }

  const { credentials, available } = await fetchCredentials();

  return {
    userId: user.id,
    displayName,
    tier,
    subjects,
    totalTopics,
    completeTopics,
    progressAvailable,
    upNext,
    credentials,
    credentialsAvailable: available,
  };
}
