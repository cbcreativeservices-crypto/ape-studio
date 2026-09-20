/**
 * Audio Community Directory — the RULES, with no dependencies.
 *
 * Everything here is a pure function or a constant, deliberately: these are the
 * decisions worth testing (caps, what the public About field refuses, how the
 * old flat interest list maps onto the new four concepts), and a rule you can
 * only exercise by booting React Native is a rule nobody tests.
 *
 * NONE OF THIS IS ENFORCEMENT. Every limit and check below is mirrored in the
 * database — `directory_enforce_limit`, `directory_specialty_needs_area` and
 * `directory_about_is_safe`. This copy exists so the UI can disable a control
 * before the server refuses it, and so the migration never proposes a value the
 * server would reject. If the two ever disagree, the database wins.
 */

/** Selection caps (spec §6.2–6.5, §6.7, §6.8). */
export const LIMITS = {
  areas: 3,
  specialties: 6,
  roles: 2,
  openTo: 3,
  languages: 3,
  about: 200,
} as const;

/**
 * §6.8: contact details must not reach a public field. Mirrors
 * public.directory_about_is_safe. A published phone number cannot be
 * un-published from someone else's screenshot, which is why this is checked in
 * two places rather than one.
 */
export function aboutIsSafe(text: string | null | undefined): boolean {
  if (text == null) return true;
  const t = text.trim();
  if (t.length === 0) return true;
  if (t.length > LIMITS.about) return false;
  if (/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i.test(t)) return false; // email
  if (/(https?:\/\/|www\.)/i.test(t)) return false; // url
  if (/(\+?\d[\d ().-]{7,}\d)/.test(t)) return false; // phone
  if (/(^|[^\w])@\w{2,}/.test(t)) return false; // social handle
  return true;
}

/** Why an About value was refused — so the UI can say something specific. */
export function aboutProblem(text: string): string | null {
  if (aboutIsSafe(text)) return null;
  if (text.trim().length > LIMITS.about) return `Keep this to ${LIMITS.about} characters.`;
  if (/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i.test(text)) return 'Remove the email address.';
  if (/(https?:\/\/|www\.)/i.test(text)) return 'Remove the link.';
  if (/(\+?\d[\d ().-]{7,}\d)/.test(text)) return 'Remove the phone number.';
  return 'Remove the @handle.';
}

/**
 * The old profile's single flat list, sorted into the concept each value
 * actually belongs to.
 *
 * The two `role` entries are the whole point. "Education" and "Sales" were
 * never work areas — they describe what someone DOES in a field, which is what
 * "How I'm Involved" is for. Copying them across as areas would have carried
 * the original confusion into the new taxonomy.
 */
export const LEGACY_INTEREST_MAP: Readonly<
  Record<string, { area?: string; specialty?: string; role?: string }>
> = {
  'Live Sound': { area: 'live-sound-event-production', specialty: 'foh-mixing' },
  'Studio Recording': { area: 'studio-recording-mixing-mastering', specialty: 'recording-engineering' },
  Mixing: { area: 'studio-recording-mixing-mastering', specialty: 'studio-mixing' },
  Mastering: { area: 'studio-recording-mixing-mastering', specialty: 'mastering' },
  'Music Production': { area: 'music-production-electronic-sound-design', specialty: 'music-production' },
  Podcasting: { area: 'broadcast-podcast-streaming', specialty: 'podcast-production' },
  Broadcast: { area: 'broadcast-podcast-streaming', specialty: 'broadcast-air-chain' },
  'Film & Game Audio': { area: 'picture-games-immersive', specialty: 'game-audio' },
  'System Design & Install': {
    area: 'installed-commercial-home-vehicle',
    specialty: 'audio-system-design-specification',
  },
  'RF / Wireless': { area: 'live-sound-event-production', specialty: 'rf-wireless-systems' },
  'Audio Networking (Dante)': {
    area: 'systems-networking-infrastructure',
    specialty: 'dante-networked-audio-routing',
  },
  'Live Streaming': { area: 'broadcast-podcast-streaming', specialty: 'live-streaming' },
  DJ: { area: 'live-sound-event-production', specialty: 'dj-performance-beatmatching' },
  'Corporate AV': { area: 'installed-commercial-home-vehicle', specialty: 'corporate-av' },
  'Repair & Electronics': {
    area: 'electronics-equipment-manufacturing-repair',
    specialty: 'maintenance-diagnostics-repair',
  },
  Education: { role: 'teaching-mentoring' },
  Sales: { role: 'sales-product-support' },
};

export type MappedLegacy = {
  areas: string[];
  specialties: string[];
  roles: string[];
  primaryArea: string | null;
  dropped: string[];
};

/**
 * Map the old list, honouring the new caps. `primaryInterest` goes first so the
 * member's own choice survives truncation and becomes the primary area.
 */
export function mapLegacyInterests(interests: string[], primaryInterest?: string): MappedLegacy {
  const areas: string[] = [];
  const specialties: string[] = [];
  const roles: string[] = [];
  const dropped: string[] = [];

  const ordered = primaryInterest
    ? [primaryInterest, ...interests.filter((i) => i !== primaryInterest)]
    : [...interests];

  for (const raw of ordered) {
    const m = LEGACY_INTEREST_MAP[raw];
    if (!m) {
      dropped.push(raw);
      continue;
    }
    if (m.role) {
      if (roles.length < LIMITS.roles && !roles.includes(m.role)) roles.push(m.role);
      else dropped.push(raw);
      continue;
    }
    const areaAlreadyIn = m.area ? areas.includes(m.area) : false;
    const areaFits = areaAlreadyIn || areas.length < LIMITS.areas;
    const specFits = specialties.length < LIMITS.specialties;
    if (!areaFits || !specFits) {
      dropped.push(raw);
      continue;
    }
    if (m.area && !areaAlreadyIn) areas.push(m.area);
    if (m.specialty && !specialties.includes(m.specialty)) specialties.push(m.specialty);
  }

  return { areas, specialties, roles, primaryArea: areas[0] ?? null, dropped };
}

/**
 * Slugify exactly as public.directory_slugify does, so a label round-trips to
 * the same slug on both sides of the wire.
 */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Postgres speaks precisely but not to people. Translate the errors a member
 * can actually provoke; pass anything else through rather than inventing a
 * friendly lie about a failure we did not anticipate.
 */
export function readableError(message: string | undefined): string {
  // An EMPTY message is as useless to a member as a missing one (edge-case QA
  // 2026-09-11): `message ?? fallback` let '' through, so a driver that
  // surfaced a blank error string painted an empty red banner with no text.
  if (message !== undefined && message.trim().length === 0) message = undefined;
  const m = (message ?? '').toLowerCase();
  // PostgREST rejects an anon caller at the GRANT before the function body
  // runs, so the friendly "sign in to browse" guard inside directory_search is
  // unreachable for a signed-out visitor — they got the raw
  // "permission denied for function directory_search" instead. Every directory
  // function is granted to `authenticated` only, so this error means exactly
  // one thing: no account. (Found 2026-08-31 by opening the directory as a
  // guest during the lab sweep.)
  if (m.includes('permission denied for function'))
    return 'Sign in to use the Audio Community Directory.';
  if (m.includes('at most')) return 'That is more than you can select here.';
  if (m.includes('needs one of its areas')) return 'Add the matching area first, or remove that specialty.';
  if (m.includes('primary area')) return 'Choose one primary area before publishing.';
  if (m.includes('display name')) return 'Add a public display name before publishing.';
  if (m.includes('how i am involved')) return 'Choose at least one “How I’m Involved” option.';
  if (m.includes('age attestation') || m.includes('18 or older'))
    return 'The community directory is for members 18 or older.';
  if (m.includes('verify your account email')) return 'Verify your account email first.';
  if (m.includes('publish your own profile')) return 'Publish your own profile before contacting members.';
  if (m.includes('publish your profile first')) return 'Publish your profile first.';
  if (m.includes('open to')) return 'Choose at least one “Open To” option first.';
  if (m.includes('not accepting contact')) return 'This member is not accepting contact.';
  if (m.includes('not something this member is open to'))
    return 'This member is not open to that. Pick another reason.';
  if (m.includes('links and contact details')) return 'Remove links and contact details from your message.';
  // ⚠️ Every server window is `created_at > now() - interval '…'` — ROLLING,
  // not a calendar day or week. These four used to say "resets tomorrow" /
  // "today's" / "this week's", which describes a midnight reset that never
  // happens. Phrase them the way the glossary dialog already does.
  if (m.includes('contact requests per week'))
    return 'You have sent 10 contact requests in the last 7 days, which is the limit. The oldest frees up 7 days after you sent it.';
  // ── ORDER MATTERS (2026-09-19) ──────────────────────────────────────────
  // The per-conversation message contains the words "daily limit", so it must
  // be tested BEFORE the all-threads one or it is swallowed and the person is
  // told the wrong thing about why they were stopped.
  if (m.includes('daily limit for this conversation'))
    return 'You have sent this member 5 messages in the last 24 hours, which is the limit for one conversation. The oldest frees up 24 hours after you sent it.';
  if (m.includes('daily message limit'))
    return 'You have sent 10 messages in the last 24 hours, which is the daily limit. The oldest frees up 24 hours after you sent it.';
  if (m.includes('weekly message limit'))
    return 'You have sent 30 messages in the last 7 days, which is the weekly limit. The oldest frees up 7 days after you sent it.';
  if (m.includes('wait for a reply'))
    return 'Wait for a reply before sending more.';
  if (m.includes('already have an open conversation'))
    return 'You already have an open conversation with this member — continue it under Requests.';
  if (m.includes('message is longer than'))
    return 'That message is longer than 1,000 characters. Shorten it and send again.';
  if (m.includes('already answered')) return 'That request has already been answered.';
  if (m.includes('review your public display name'))
    return 'Review your public display name before appearing in search.';
  if (m.includes('about_safe') || (m.includes('check constraint') && m.includes('about')))
    return 'Remove any email address, phone number, link or @handle from About My Work.';
  // supabase-js does not throw on a network failure — it resolves with
  // `{ error }` whose message is the runtime's own text ("TypeError: Failed to
  // fetch" on Chrome, "Load failed" on Safari, "Network request failed" on
  // React Native), so the callers' `catch` branch with the friendly copy never
  // runs. Say the same thing here that the catch says. (Found 2026-09-01:
  // the Explore banner read "TypeError: Failed to fetch".)
  if (
    m.includes('failed to fetch') ||
    m.includes('fetch failed') ||
    m.includes('load failed') ||
    m.includes('network request failed') ||
    m.includes('network error')
  )
    return 'No connection. Try again.';
  // ⚠️ The fall-through used to be `message ?? …`, which handed the member the
  // raw Postgres exception text — lowercase, no full stop, no next step
  // ("your account is restricted", "sign in first"). Name the reachable ones
  // and never pass the server string through.
  if (m.includes('your account is restricted'))
    return 'Your community access is restricted, so you cannot send this. See the notice on your Profile for the reason.';
  if (m.includes('this conversation is closed'))
    return 'This conversation is closed. Nothing you have already sent was removed.';
  if (m.includes('this conversation is not open'))
    return 'This conversation is not open yet — the other member has not accepted your request.';
  if (m.includes('that is your own profile')) return 'That is your own profile.';
  if (m.includes('sign in first')) return 'Your session has ended. Sign in again to continue.';
  return 'Something went wrong on our side. Nothing you entered was lost — try again, and email info@proaudiotrainingacademy.com if it keeps happening.';
}
