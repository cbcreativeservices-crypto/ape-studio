/**
 * Topic Foundations — the pure half (D47, owner GO 2026-11-03).
 *
 * A Topic Foundations lesson is plain text (docs/foundations/
 * TOPIC_FOUNDATIONS_STANDARD.md §1 and rule G24):
 *
 *   Topic Foundations: <short topic name>
 *   <blank line>
 *   6–8 plain paragraphs, separated by one blank line
 *
 * This file turns that text into what the popup draws, decides what a server
 * answer means, and names the read-state key. It imports NOTHING, so the node
 * tests load it directly (test/topicFoundations_20261103).
 */

/** The title line's fixed opening. The popup title is what follows it. */
export const FOUNDATIONS_TITLE_PREFIX = 'Topic Foundations:';

/** The one device-local key for "I've read this" (createLocalStore). Inside
 *  the `ape:*` sweep on purpose: the account and guest wipes clear it. */
export const FOUNDATIONS_READ_STORE_KEY = 'ape:foundations:read';

export type FoundationsLesson = {
  /** The topic name from line 1, without "Topic Foundations: ". */
  title: string;
  /** Body paragraphs, in order, each one line of text. */
  paragraphs: string[];
};

/**
 * Parse a lesson. Null for anything that is not a usable lesson — not a
 * string, blank, or a title with no body — so a bad row shows NO popup and
 * NO dashboard row, never a broken one.
 */
export function parseFoundationsText(raw: unknown): FoundationsLesson | null {
  if (typeof raw !== 'string') return null;
  const text = raw.replace(/\r\n?/g, '\n').trim();
  if (!text) return null;
  // Line 1 is the title, even when the writer forgot the blank line under it.
  const nl = text.indexOf('\n');
  let title = (nl < 0 ? text : text.slice(0, nl)).trim();
  const body = nl < 0 ? '' : text.slice(nl + 1);
  // Paragraphs are split on blank lines; a wrapped paragraph is re-joined.
  const paragraphs = body
    .split(/\n[ \t]*\n/)
    .map((b) =>
      b
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean);
  if (title.toLowerCase().startsWith(FOUNDATIONS_TITLE_PREFIX.toLowerCase())) {
    title = title.slice(FOUNDATIONS_TITLE_PREFIX.length).trim();
  }
  if (!title || paragraphs.length === 0) return null;
  return { title, paragraphs };
}

/** A PostgREST / Postgres error, as far as this feature cares. */
type QueryError = { code?: unknown; message?: unknown } | null | undefined;

/**
 * Is this error the column (or row shape) simply not being there yet? Until
 * Comp A adds `achievements.foundations_text`, every read answers Postgres
 * 42703 ("column … does not exist"); PostgREST's own schema-cache miss is
 * PGRST204. Those are a settled "no text", worth remembering for the session;
 * anything else (offline, timeout) is asked again next time.
 */
export function isMissingColumnError(error: QueryError): boolean {
  if (!error) return false;
  const code = typeof error.code === 'string' ? error.code : '';
  if (code === '42703' || code === 'PGRST204') return true;
  const msg = typeof error.message === 'string' ? error.message : '';
  return /foundations_text/.test(msg) && /does not exist|could not find/i.test(msg);
}

export type FoundationsAnswer = {
  /** The lesson, or null = show no row and no popup. */
  lesson: FoundationsLesson | null;
  /** True when the answer will not change this session (text read, no text,
   *  or the column is missing); false for a failed read worth asking again. */
  settled: boolean;
};

/**
 * What one `select foundations_text … maybeSingle()` answered. ANY error is
 * "no text" — a missing lesson must never interrupt studying, and the screen
 * never shows an error for it (owner decision 3, 2026-11-03).
 */
export function foundationsFromQuery(res: { data?: unknown; error?: QueryError } | null | undefined): FoundationsAnswer {
  if (!res) return { lesson: null, settled: false };
  if (res.error) return { lesson: null, settled: isMissingColumnError(res.error) };
  const row = res.data as { foundations_text?: unknown } | null | undefined;
  return { lesson: parseFoundationsText(row?.foundations_text ?? null), settled: true };
}

/** The read-state entry for one learner and one topic. `uid` is the signed-in
 *  user id, or 'guest' for a session that is KNOWN to have no account — never
 *  for a session read that did not answer (that is no key at all). */
export function foundationsReadKey(uid: string, achievementId: string): string {
  return `${uid}:${achievementId}`;
}

/** The stored map, cleaned: string keys → ISO timestamps. Throws for a blob
 *  that is not an object (createLocalStore sets it aside as damaged). */
export function parseFoundationsReadMap(parsed: unknown): Record<string, string> {
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('foundations read map: not an object');
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === 'string' && k.includes(':')) out[k] = v;
  }
  return out;
}

/** Has this learner tapped I'VE READ THIS for this topic? */
export function isFoundationsRead(map: Readonly<Record<string, string>>, uid: string, achievementId: string): boolean {
  return Object.prototype.hasOwnProperty.call(map, foundationsReadKey(uid, achievementId));
}

/**
 * Should the Flashcards screen pop the lesson up now? Only when the lesson
 * exists, the read state is KNOWN (session answered, store read), it is not
 * read, and the learner has not closed it on this visit. An unknown state
 * never auto-pops (AGENTS.md: a failed read is UNREADABLE, not "unread").
 */
export function foundationsAutoDue(p: {
  hasLesson: boolean;
  readKnown: boolean;
  read: boolean;
  closedThisVisit: boolean;
}): boolean {
  return p.hasLesson && p.readKnown && !p.read && !p.closedThisVisit;
}
